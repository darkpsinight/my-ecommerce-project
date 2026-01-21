const cron = require('node-cron');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { Payout } = require('../models/payout');
const { LedgerEntry } = require('../models/ledgerEntry');
const { AuditLog } = require('../models/auditLog');

/**
 * Job: Ledger Integrity Monitor
 * Frequency: Daily at 03:00 UTC
 * Scope: READ-ONLY Detection of Financial Anomalies
 */
const setupLedgerIntegrityMonitor = (fastify) => {
    // Schedule: 3 AM daily
    const schedule = '0 3 * * *';

    cron.schedule(schedule, async () => {
        fastify.log.info('[IntegrityMonitor] Starting daily financial integrity scan...');
        const session = await mongoose.startSession(); // Use session for consistency if needed, but read-only is fine without
        // Note: Aggregations across collections can't easily accept session unless handled carefully. 
        // We will run queries sequentially. 

        try {
            await runIntegrityChecks(fastify);
            fastify.log.info('[IntegrityMonitor] Scan complete.');
        } catch (err) {
            fastify.log.error(`[IntegrityMonitor] Critical Failure: ${err.message}`);
        } finally {
            await session.endSession();
        }
    }, {
        scheduled: true,
        timezone: "UTC"
    });

    fastify.log.info(`[IntegrityMonitor] Job registered: ${schedule} UTC`);
};

/**
 * Executes the 4 Pillars of Integrity Checks
 */
async function runIntegrityChecks(fastify) {
    const anomalies = [];

    // CHECK 1: Orphaned Payout Check
    // Payout exists (Processing+) but no Ledger Reservation found
    const activePayouts = await Payout.find({
        status: { $in: ['PROCESSING', 'COMPLETED'] }
    });

    for (const payout of activePayouts) {
        if (!payout.ledgerReservationId) {
            // Check if maybe it's just missing the link but entry exists (by metadata)
            const entry = await LedgerEntry.findOne({
                type: 'payout_reservation',
                'metadata.payoutId': payout.payoutId
            });

            if (!entry) {
                anomalies.push({
                    type: "ORPHANED_PAYOUT",
                    details: `Payout ${payout.payoutId} (${payout.status}) has no ledger reservation.`,
                    targetId: payout.payoutId
                });
            }
        } else {
            // Verify the linked ID actually exists
            const entry = await LedgerEntry.findById(payout.ledgerReservationId);
            if (!entry) {
                anomalies.push({
                    type: "BROKEN_LEDGER_LINK",
                    details: `Payout ${payout.payoutId} links to non-existent ledger entry ${payout.ledgerReservationId}`,
                    targetId: payout.payoutId
                });
            }
        }
    }

    // CHECK 2: Ghost Reservation Check
    // Ledger Reservation exists but no Payout found
    const reservations = await LedgerEntry.find({
        type: 'payout_reservation'
    });

    for (const entry of reservations) {
        // Must have a payoutId in metadata or referenced
        const payoutId = entry.metadata?.payoutId;
        if (!payoutId) {
            anomalies.push({
                type: "UNKNOWN_RESERVATION",
                details: `Reservation Ledger ${entry._id} has no payoutId metadata.`,
                targetId: entry._id.toString()
            });
            continue;
        }

        const payout = await Payout.findOne({ payoutId });
        if (!payout) {
            anomalies.push({
                type: "GHOST_RESERVATION",
                details: `Reservation Ledger ${entry._id} refers to missing payout ${payoutId}`,
                targetId: payoutId
            });
        }
    }

    // CHECK 3: Completion Truth Check
    // Completed Payout MUST have Stripe Transfer ID
    const completedPayouts = await Payout.find({ status: 'COMPLETED' });
    for (const payout of completedPayouts) {
        if (!payout.stripeTransferId) {
            anomalies.push({
                type: "UNVERIFIED_COMPLETION",
                details: `Payout ${payout.payoutId} is COMPLETED but missing stripeTransferId.`,
                targetId: payout.payoutId
            });
        }
    }

    // CHECK 4: Seller Negative Balance Check
    // (Simplified: Check if any seller has negative 'available' sum)
    // We aggregate ALL time.
    const sellerBalances = await LedgerEntry.aggregate([
        { $match: { role: 'seller', status: 'available' } },
        {
            $group: {
                _id: { uid: "$user_uid", currency: "$currency" },
                balance: { $sum: "$amount" }
            }
        },
        { $match: { balance: { $lt: 0 } } }
    ]);

    for (const neg of sellerBalances) {
        anomalies.push({
            type: "NEGATIVE_BALANCE",
            details: `Seller ${neg._id.uid} has negative available balance in ${neg._id.currency}: ${neg.balance}`,
            targetId: neg._id.uid
        });
    }

    // REPORTING
    if (anomalies.length > 0) {
        fastify.log.warn(`[IntegrityMonitor] Detected ${anomalies.length} financial anomalies!`);

        for (const anomaly of anomalies) {
            // Log to AuditLog strictly as INTEGIRTY_VIOLATION
            // Idempotency: Avoid spamming if checked daily? 
            // We'll check if we notified recently? 
            // For Step 18, we just log.

            // Log locally
            fastify.log.warn(anomaly);

            // Persist to AuditLog
            try {
                await AuditLog.create({
                    action: "INTEGRITY_VIOLATION",
                    actorId: "SYSTEM_INTEGRITY_MONITOR",
                    targetId: anomaly.targetId,
                    targetType: "FINANCIAL_ENTITY",
                    status: "FAILURE",
                    errorCode: anomaly.type,
                    errorMessage: anomaly.details,
                    metadata: { anomaly }
                });
            } catch (auditErr) {
                fastify.log.error(`Failed to save audit log: ${auditErr.message}`);
            }
        }
    } else {
        fastify.log.info('[IntegrityMonitor] No anomalies detected. System Healthy.');
    }
}

module.exports = { setupLedgerIntegrityMonitor, runIntegrityChecks };
