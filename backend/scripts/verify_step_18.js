const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { connectDB } = require('../models/connectDB');
const FinancialObservabilityService = require('../services/financialObservability.service');
const { runIntegrityMonitor } = require('../jobs/financial-integrity/integrity-monitor.job');
const { LedgerEntry } = require('../models/ledgerEntry');
const { v4: uuidv4 } = require('uuid');

// Mock Fastify
const fastifyMock = {
    log: {
        info: console.log,
        error: console.error,
        debug: console.debug
    }
};

async function verify() {
    console.log("=== STEP 18 VERIFICATION START ===");

    // 1. Connect
    await connectDB(fastifyMock);

    // 2. Health Snapshot
    console.log("\n--- TEST: Financial Snapshot (Read-Only) ---");
    try {
        const snapshot = await FinancialObservabilityService.getFinancialSnapshot();
        console.log(JSON.stringify(snapshot, null, 2));

        if (snapshot.global_ledger.net_invariance_check !== 0) {
            console.error("CRITICAL: Net Invariance Check Failed! System is imbalanced.");
        } else {
            console.log("SUCCESS: Net Invariance Check is 0.");
        }
    } catch (e) {
        console.error("Snapshot Failed:", e);
    }

    // 3. Payout Trace (If any payout exists)
    console.log("\n--- TEST: Payout Trace (Read-Only) ---");
    try {
        const { Payout } = require('../models/payout');
        const existingPayout = await Payout.findOne({});
        if (existingPayout) {
            console.log(`Tracing Payout: ${existingPayout.payoutId}`);
            const trace = await FinancialObservabilityService.getPayoutTrace({ payoutId: existingPayout.payoutId });
            console.log(JSON.stringify(trace, null, 2));
        } else {
            console.log("No existing payouts found to trace. Skipping Trace Test.");
        }
    } catch (e) {
        console.error("Trace Failed:", e);
    }

    // 4. Integrity Monitor (Clean Run)
    console.log("\n--- TEST: Integrity Monitor (Baseline) ---");
    let baseline;
    try {
        baseline = await runIntegrityMonitor();
        console.log("Baseline Status:", baseline.status);
    } catch (e) {
        console.error("Baseline Monitor Failed:", e);
    }

    // 5. Integrity Monitor Violation Simulation
    console.log("\n--- TEST: Integrity Monitor (Simulated Violation) ---");
    // Create a corrupt ledger entry (One-sided credit)
    const corruptId = uuidv4();
    try {
        const corruptEntry = await LedgerEntry.create({
            user_uid: "test_corrupt_user",
            role: "seller",
            type: "admin_correction_credit",
            amount: 999999, // Big amount
            currency: "USD",
            status: "available",
            description: "INTEGRITY TEST CORRUPTION",
            externalId: corruptId
        });
        console.log("Inserted Corrupt Entry:", corruptId);

        // Run Monitor
        const result = await runIntegrityMonitor();
        console.log("Corruption Check Result:", result.status);
        // console.log("Violations:", JSON.stringify(result.violations, null, 2));

        if (result.status === "VIOLATIONS_FOUND" && result.violations.some(v => v.includes("GLOBAL_IMBALANCE"))) {
            console.log("SUCCESS: Integrity Monitor detected imbalance.");
        } else {
            console.error("FAILURE: Integrity Monitor DID NOT detect imbalance!");
        }

    } catch (e) {
        console.error("Error inserting corrupt data or running check:", e);
    } finally {
        // 6. Cleanup
        console.log("\n--- CLEANUP ---");
        if (corruptId) {
            await LedgerEntry.deleteOne({ externalId: corruptId });
            console.log("Deleted Corrupt Entry");
        }

        // 7. Verify Clean Again
        const finalCheck = await runIntegrityMonitor();
        console.log("Final Status:", finalCheck.status);
    }

    console.log("\n=== VERIFICATION COMPLETE ===");
    process.exit(0);
}

verify();
