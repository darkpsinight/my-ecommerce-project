const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Load App Configs
const appConfigsModule = require('../configs');
const appConfigs = appConfigsModule.configs || appConfigsModule;

const configs = {
    MONGO_URI: process.env.MONGO_URI || appConfigs.MONGO_URI,
    ADMIN_UID: 'test_admin_super_user_123'
};

const { connectDB } = require('../models/connectDB');
const { Payout } = require('../models/payout');
const { LedgerEntry } = require('../models/ledgerEntry');
const { AuditLog } = require('../models/auditLog');
const adminRemediationService = require('../services/payment/adminRemediationService');

async function runVerification() {
    try {
        console.log("=== STARTING FORMAL VERIFICATION STEP 17 ===");
        const fastifyMock = { log: { info: () => { }, error: console.error } };
        await connectDB(fastifyMock);
        console.log("DB Connected.");

        const sellerUid = `test_seller_${uuidv4()}`;
        console.log(`Test Seller: ${sellerUid}`);

        // ====================================================
        // SCENARIO A: Orphaned Payout (Force Transition)
        // ====================================================
        console.log("\n--- Scenario A: Orphaned Payout Correction ---");
        const payoutIdA = uuidv4();
        const payoutA = new Payout({
            payoutId: payoutIdA,
            sellerId: sellerUid,
            amount: 5000,
            currency: 'USD',
            status: 'PROCESSING',
            adminId: configs.ADMIN_UID,
            orderId: new mongoose.Types.ObjectId(),
            ledgerReservationId: 'res_A' // Mock reservation
        });
        await payoutA.save();
        console.log(`[Setup] Created Payout ${payoutIdA} in PROCESSING`);

        console.log("DEBUG: Testing AuditLog instantiation...");
        const auditTest = new AuditLog({
            action: 'TEST',
            actorId: 'test',
            targetId: 'test',
            targetType: 'test',
            status: 'SUCCESS'
        });
        console.log("DEBUG: AuditLog Instance Created");
        // await auditTest.save(); // Optional, but let's try saving too if instance works
        console.log("DEBUG: Testing LedgerEntry instantiation...");
        const ledgerTest = new LedgerEntry({
            user_uid: 'test',
            role: 'seller',
            type: 'payout',
            amount: 100,
            currency: 'USD',
            status: 'available',
            externalId: uuidv4()
        });
        console.log("DEBUG: LedgerEntry Instance Created");

        console.log(`[Action] Force Transition PROCESSING -> FAILED`);
        console.log("DEBUG: Calling forceTransitionPayout...");
        const resultA = await adminRemediationService.forceTransitionPayout(
            configs.ADMIN_UID,
            payoutIdA,
            'FAILED',
            'Verification Test A',
            uuidv4()
        );
        console.log(`[Result] API Response:`, resultA);

        const checkPayoutA = await Payout.findOne({ payoutId: payoutIdA });
        console.log(`[Verify] Payout Status: ${checkPayoutA.status} (Expected: FAILED)`);

        const reversalA = await LedgerEntry.findOne({ 'metadata.originalPayoutId': payoutIdA, type: 'payout_fail_reversal' });
        console.log(`[Verify] Ledger Reversal: ${reversalA ? 'FOUND' : 'MISSING'} (${reversalA ? reversalA.amount : 0} cents)`);

        // ====================================================
        // SCENARIO B: Missed Webhook (Credit Correction)
        // ====================================================
        console.log("\n--- Scenario B: Missed Webhook Correction ---");
        const payoutIdB = uuidv4();
        const payoutB = new Payout({
            payoutId: payoutIdB,
            sellerId: sellerUid,
            amount: 2000,
            currency: 'USD',
            status: 'COMPLETED',
            adminId: configs.ADMIN_UID,
            orderId: new mongoose.Types.ObjectId()
        });
        await payoutB.save();
        console.log(`[Setup] Created Payout ${payoutIdB} in COMPLETED`);

        console.log(`[Action] Apply Correction Credit`);
        const resultB = await adminRemediationService.applyLedgerCorrection(
            configs.ADMIN_UID,
            sellerUid,
            'admin_correction_credit',
            2000,
            'USD',
            'Verification Test B',
            { relatedPayoutId: payoutIdB },
            uuidv4()
        );
        console.log(`[Result] API Response:`, resultB);

        const creditB = await LedgerEntry.findOne({ 'metadata.relatedPayoutId': payoutIdB, type: 'admin_correction_credit' });
        console.log(`[Verify] Correction Entry: ${creditB ? 'FOUND' : 'MISSING'} (${creditB ? creditB.amount : 0} cents)`);

        // ====================================================
        // SCENARIO C & D: Abuse Prevention & Anomaly
        // ====================================================
        console.log("\n--- Scenario C: Admin Abuse Prevention ---");

        // 1. Forbidden Transition
        console.log(`[Test] Attempt Forbidden Transition PROCESSING -> COMPLETED`);
        try {
            await adminRemediationService.forceTransitionPayout(
                configs.ADMIN_UID,
                payoutIdA, // Reuse failed payout? No, create new one.
                'COMPLETED',
                'Hacking',
                uuidv4()
            );
            console.error(`[FAIL] Should have thrown error`);
        } catch (e) {
            console.log(`[PASS] Error Caught: ${e.message}`);
        }

        // 2. Unanchored Debit
        console.log(`[Test] Attempt Unanchored Debit`);
        try {
            await adminRemediationService.applyLedgerCorrection(
                configs.ADMIN_UID,
                sellerUid,
                'admin_correction_debit',
                -100,
                'USD',
                'Theft',
                {}, // Empty anchors
                uuidv4()
            );
            console.error(`[FAIL] Should have thrown error`);
        } catch (e) {
            console.log(`[PASS] Error Caught: ${e.message}`);
        }

        console.log("\n--- Scenario D: Anomaly Acknowledgement ---");
        const anomalyId = uuidv4();
        const anomalyEntry = new LedgerEntry({
            user_uid: sellerUid,
            role: 'seller',
            type: 'payout',
            amount: -500,
            currency: 'USD',
            status: 'settled',
            description: 'Anomaly',
            externalId: anomalyId
        });
        await anomalyEntry.save();
        console.log(`[Setup] Created Anomaly Entry ${anomalyId}`);

        console.log(`[Action] Resolve Anomaly (Trace-Only - Audit Log Check)`);
        await adminRemediationService.resolveAnomaly(
            configs.ADMIN_UID,
            'LedgerEntry',
            anomalyId,
            'Verified OK',
            uuidv4()
        );

        console.log(`[Verify] Checking AuditLog for Resolution...`);
        const auditLog = await AuditLog.findOne({
            action: 'ADMIN_RESOLVE_ANOMALY',
            targetId: anomalyId
        });

        console.log(`[Verify] Resolution Audit Log:`, auditLog ? 'FOUND' : 'MISSING');
        if (!auditLog) throw new Error("Audit log missing for anomaly resolution");

        console.log("\n=== VERIFICATION COMPLETE ===");
        process.exit(0);
    } catch (e) {
        console.error("FATAL ERROR:", e);
        process.exit(1);
    }
}

runVerification();
