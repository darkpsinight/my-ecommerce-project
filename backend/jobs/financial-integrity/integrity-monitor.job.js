const mongoose = require("mongoose");
const { LedgerEntry } = require("../../models/ledgerEntry");
const { Payout } = require("../../models/payout");

/**
 * Financial Integrity Monitor Job (Read-Only)
 * Scans for impossible states and invariant violations.
 * Emits logs with tag [FINANCIAL_INTEGRITY_VIOLATION]
 */
async function runIntegrityMonitor() {
    console.log("[FINANCIAL_INTEGRITY_MONITOR] Starting read-only integrity scan...");
    const violations = [];

    try {
        // 1. Check Global Ledger Imbalance (Must be exactly 0)
        const balanceCheck = await LedgerEntry.aggregate([
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const netBalance = balanceCheck.length > 0 ? balanceCheck[0].total : 0;
        if (netBalance !== 0) {
            const msg = `GLOBAL_IMBALANCE: Net ledger balance is ${netBalance} (Expected 0)`;
            violations.push(msg);
            console.error(`[FINANCIAL_INTEGRITY_VIOLATION] ${msg}`);
        }

        // 2. Check for Negative Seller Balances (Strictly Prohibited)
        const negativeBalances = await LedgerEntry.aggregate([
            { $match: { role: { $in: ['seller', 'buyer'] } } }, // Filter for users only
            { $group: { _id: "$user_uid", balance: { $sum: "$amount" } } },
            { $match: { balance: { $lt: 0 } } }
        ]);

        negativeBalances.forEach(acct => {
            const msg = `NEGATIVE_BALANCE: User ${acct._id} has net key balance ${acct.balance}`;
            violations.push(msg);
            console.error(`[FINANCIAL_INTEGRITY_VIOLATION] ${msg}`);
        });

        // 3. Unbacked Payouts (Completed but no Stripe Transfer ID)
        const unbackedPayouts = await Payout.find({
            status: "COMPLETED",
            stripeTransferId: { $exists: false } // or null
        });

        unbackedPayouts.forEach(p => {
            if (!p.stripeTransferId) {
                const msg = `UNBACKED_PAY-OUT: Payout ${p.payoutId} is COMPLETED but missing stripeTransferId`;
                violations.push(msg);
                console.error(`[FINANCIAL_INTEGRITY_VIOLATION] ${msg}`);
            }
        });

        // 4. Missing Reservations (Processing/Completed Payout without Ledger Reservation)
        const missingReservations = await Payout.find({
            status: { $in: ["PROCESSING", "COMPLETED"] },
            ledgerReservationId: { $exists: false }
        });

        missingReservations.forEach(p => {
            if (!p.ledgerReservationId) {
                const msg = `MISSING_RESERVATION: Payout ${p.payoutId} (${p.status}) has no ledgerReservationId`;
                violations.push(msg);
                console.error(`[FINANCIAL_INTEGRITY_VIOLATION] ${msg}`);
            }
        });

        // 5. Orphaned Reservations (Reservation > 24h old with no active Payout)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const oldReservations = await LedgerEntry.find({
            type: "payout_reservation",
            createdAt: { $lt: dayAgo }
        });

        for (const res of oldReservations) {
            const payout = await Payout.findOne({ ledgerReservationId: res.externalId });
            if (!payout) {
                const msg = `ORPHANED_RESERVATION: LedgerEntry ${res.externalId} has no linked Payout`;
                violations.push(msg);
                console.error(`[FINANCIAL_INTEGRITY_VIOLATION] ${msg}`);
            }
        }

        console.log(`[FINANCIAL_INTEGRITY_MONITOR] Scan complete. Found ${violations.length} violations.`);
        return { status: violations.length === 0 ? "HEALTHY" : "VIOLATIONS_FOUND", violations };

    } catch (error) {
        console.error(`[FINANCIAL_INTEGRITY_MONITOR] Job Failed: ${error.message}`);
        throw error;
    }
}

/**
 * Sets up the Integrity Monitor Cron Job.
 * Runs every 4 hours by default (0 * /4 * * *).
 */
const setupIntegrityMonitor = (fastify) => {
    // Default: Every 4 hours
    const schedule = process.env.INTEGRITY_MONITOR_CRON || "0 */4 * * *";
    const cron = require('node-cron');

    cron.schedule(schedule, async () => {
        fastify.log.info('[IntegrityMonitor] Starting scheduled integrity scan...');
        try {
            await runIntegrityMonitor();
        } catch (err) {
            fastify.log.error(`[IntegrityMonitor] Execution Error: ${err.message}`);
        }
    }, {
        scheduled: true,
        timezone: "UTC"
    });

    fastify.log.info(`[IntegrityMonitor] Job registered: ${schedule} UTC`);
};

module.exports = { runIntegrityMonitor, setupIntegrityMonitor };
