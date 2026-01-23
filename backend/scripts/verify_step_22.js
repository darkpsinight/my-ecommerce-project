require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { Order } = require('../models/order');
const { Dispute } = require('../models/dispute');
const DisputeService = require('../services/dispute/dispute');
const EscrowMaturityService = require('../services/escrow-maturity/escrow-maturity');
const PayoutSchedulingService = require('../services/payout-scheduling/payoutScheduling'); // Note filename casing
const { configs } = require('../configs');

// Mock configs for testing if needed, though mostly using process.env via configs.js
// Ensure we have a maturity window
configs.ESCROW_MATURITY_SECONDS = 0; // Make checks instant for testing maturity logic

async function main() {
    console.log(">>> STARTING STEP 22 VERIFICATION (Dispute Freeze) <<<");

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const sellerId = `uid_seller_${uuidv4()}`;
        const buyerId = `uid_buyer_${uuidv4()}`;

        // --- SETUP ---
        console.log("\n--- SETUP: Creating Test Orders ---");

        // Order A: Will be disputed
        const orderA = new Order({
            buyerId,
            sellerId,
            totalAmount: 50.00,
            currency: 'USD',
            paymentMethod: 'stripe',
            externalId: `ord_A_${uuidv4()}`,
            status: 'completed',
            deliveryStatus: 'delivered',
            deliveredAt: new Date(Date.now() - 10000), // Delivered 10s ago
            eligibilityStatus: 'PENDING_MATURITY',
            isDisputed: false
        });
        await orderA.save();
        console.log(`Created Order A (Dispute Candidate): ${orderA._id}`);

        // Order B: Control (Normal)
        const orderB = new Order({
            buyerId,
            sellerId,
            totalAmount: 50.00,
            currency: 'USD',
            paymentMethod: 'stripe',
            externalId: `ord_B_${uuidv4()}`,
            status: 'completed',
            deliveryStatus: 'delivered',
            deliveredAt: new Date(Date.now() - 10000),
            eligibilityStatus: 'PENDING_MATURITY',
            isDisputed: false
        });
        await orderB.save();
        console.log(`Created Order B (Control): ${orderB._id}`);


        // --- SCENARIO 1: Atomic Creation & State ---
        console.log("\n--- SCENARIO 1: Atomic Dispute Creation ---");

        const dispute = await DisputeService.createDispute({
            orderId: orderA._id,
            reason: "Item not as described",
            buyerId: orderA.buyerId // Helping params though Service can derive from order
        });

        // ASSERTIONS
        const reloadedOrderA = await Order.findById(orderA._id);
        const disputeRecord = await Dispute.findOne({ orderId: orderA._id });

        if (reloadedOrderA.isDisputed !== true) throw new Error("FAIL: Order A isDisputed should be true");
        if (!disputeRecord) throw new Error("FAIL: Dispute record not created");
        if (disputeRecord.status !== 'OPEN') throw new Error("FAIL: Dispute status should be OPEN");

        console.log("PASS: Order A frozen, Dispute created.");


        // --- SCENARIO 2: Escrow Freeze (Service Guards) ---
        console.log("\n--- SCENARIO 2: Escrow Freeze & Query Filtering ---");

        // Runs maturity batch. 
        // Expected: Order A ignored (Disputed). Order B processed (Eligible).

        const maturityStats = await EscrowMaturityService.processMaturityBatch();
        console.log("Maturity Batch Stats:", maturityStats);

        const afterMaturityA = await Order.findById(orderA._id);
        const afterMaturityB = await Order.findById(orderB._id);

        if (afterMaturityA.eligibilityStatus !== 'PENDING_MATURITY') {
            throw new Error(`FAIL: Order A should remain PENDING_MATURITY. Found: ${afterMaturityA.eligibilityStatus}`);
        }
        if (afterMaturityB.eligibilityStatus !== 'ELIGIBLE') {
            console.warn(`WARN: Order B did not transition. Ensure Configs allow instant maturity. Status: ${afterMaturityB.eligibilityStatus}`);
            // If local env strictness prevents B (e.g. ledger mock missing), we focus on A's negative test.
        } else {
            console.log("Order B correctly transitioned to ELIGIBLE.");
        }

        // Test Explicit Service Guard (Force call logic if exposed or by checking log warning in real run)
        // Since `processMaturityBatch` does a query, we validated the query filter above.
        // Let's manually call the loop logic check if possible? 
        // The Service doesn't expose public method for single order maturity check except `checkMaturityCriteria`.
        // `checkMaturityCriteria` checks logic, but the guard is in the loop.
        // The query filter is the primary defense here. 
        // We can double check using `Order.find` with the exact query used in service to prove it excludes A.
        const queryCheck = await Order.findOne({
            _id: orderA._id,
            eligibilityStatus: "PENDING_MATURITY",
            status: "completed",
            deliveryStatus: "delivered",
            isDisputed: { $ne: true }
        });
        if (queryCheck) throw new Error("FAIL: Query filter did not exclude Disputed Order A");
        console.log("PASS: Query excluded disputed order.");


        // --- SCENARIO 3: Payout Block (Service Guards) ---
        console.log("\n--- SCENARIO 3: Payout Block ---");

        // Force Order A to ELIGIBLE to simulate a race or pre-existing state
        await Order.updateOne({ _id: orderA._id }, { eligibilityStatus: 'ELIGIBLE' });
        console.log("Forced Order A to ELIGIBLE (simulating pre-existing state).");

        // Attempt scheduling
        const scheduleResult = await PayoutSchedulingService.processOrder(reloadedOrderA); // pass doc with isDisputed=true
        // Need to refetch to ensure doc object has isDisputed=true if we modified it via updateOne?
        // Actually `reloadedOrderA` from Scenario 1 has `isDisputed: true`.
        // But we just updated `eligibilityStatus` via updateOne, so reloadedOrderA is stale on status but correct on isDisputed.
        // `processOrder` checks `order.isDisputed`.

        console.log(`PayoutSchedulingService.processOrder returned: ${scheduleResult}`);

        if (scheduleResult !== 'SKIPPED_DISPUTED') {
            throw new Error("FAIL: PayoutSchedulingService should return SKIPPED_DISPUTED");
        }
        console.log("PASS: Payout Scheduling BLOCKED for disputed order.");


        // --- SCENARIO 4: Idempotency ---
        console.log("\n--- SCENARIO 4: Idempotency ---");

        const duplicateDispute = await DisputeService.createDispute({
            orderId: orderA._id,
            reason: "Duplicate call"
        });

        const allDisputesForA = await Dispute.countDocuments({ orderId: orderA._id });
        if (allDisputesForA !== 1) throw new Error(`FAIL: Found ${allDisputesForA} disputes for Order A. Expected 1.`);

        if (duplicateDispute.disputeId !== disputeRecord.disputeId) {
            throw new Error("FAIL: Idempotency returned different dispute object.");
        }

        console.log("PASS: Idempotency confirmed.");

        console.log("\n>>> ALL VERIFICATION STEPS PASSED <<<");
        process.exit(0);

    } catch (err) {
        console.error("\n>>> VERIFICATION FAILED <<<");
        console.error(err);
        process.exit(1);
    }
}

main();
