require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../models/user');
const { SellerProfile } = require('../models/sellerProfile');
const { Order } = require('../models/order');
const { PayoutSchedule } = require('../models/PayoutSchedule');
const { Payout } = require('../models/payout');
const { LedgerEntry } = require('../models/ledgerEntry');
const payoutSchedulerService = require('../services/payment/payoutSchedulerService');
const payoutEligibilityService = require('../services/payment/payoutEligibilityService');
const { configs } = require('../configs');

// Mock Stripe Adapter Capabilities
payoutEligibilityService.paymentAdapter.getPayoutCapabilities = async (uid) => {
    console.log(`[MOCK] Returning positive Stripe capabilities for ${uid}`);
    return { payoutsEnabled: true, missingCapabilities: [] };
};

// Mock Configs if needed (Environment variables should be loaded)
if (!configs.MONGO_URI) {
    console.error("❌ MONGO_URI is missing in .env");
    process.exit(1);
}

const runVerification = async () => {
    console.log("==========================================");
    console.log("STEP 14: MANUAL VERIFICATION - SCHEDULING");
    console.log("==========================================");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clean slate for testing
    const TEST_SELLER_UID = `test_scheduler_${uuidv4().substring(0, 8)}`;
    const TEST_BUYER_UID = `test_buyer_${uuidv4().substring(0, 8)}`;
    const WINDOW_DATE = new Date().toISOString().split('T')[0];

    try {
        // ------------------------------------------------------------------
        // SETUP: Create Test Seller & Orders
        // ------------------------------------------------------------------
        console.log(`\n[SETUP] Creating Test Seller: ${TEST_SELLER_UID}`);

        const sellerUser = await User.create({
            uid: TEST_SELLER_UID,
            name: TEST_SELLER_UID, // Added required name
            email: `${TEST_SELLER_UID}@example.com`,
            username: TEST_SELLER_UID,
            role: 'seller',
            isEmailVerified: true
        });

        await SellerProfile.create({
            userId: sellerUser._id,
            nickname: TEST_SELLER_UID, // Added required field
            riskStatus: 'ACTIVE',
            onboardingStatus: 'COMPLETED'
        });

        // Create Ledger Balance to Ensure Eligibility
        await LedgerEntry.create({
            user_uid: TEST_SELLER_UID,
            role: 'seller',
            type: 'escrow_release_credit',
            amount: 50000, // $500.00
            currency: 'USD',
            status: 'available',
            description: 'Seed funds',
            externalId: uuidv4()
        });

        // Create 2 ELIGIBLE Orders
        const orders = [];
        for (let i = 0; i < 2; i++) {
            orders.push(await Order.create({
                buyerId: TEST_BUYER_UID,
                sellerId: TEST_SELLER_UID,
                orderItems: [{
                    listingId: new mongoose.Types.ObjectId(),
                    title: 'Item',
                    platform: 'PC',
                    region: 'Global',
                    quantity: 1,
                    unitPrice: 1000,
                    totalPrice: 1000
                }],
                totalAmount: 10.00,
                currency: 'USD',
                paymentMethod: 'stripe',
                status: 'completed',
                deliveryStatus: 'delivered',
                eligibilityStatus: 'ELIGIBLE_FOR_PAYOUT', // Crucial
                externalId: uuidv4(),
                createdAt: new Date(Date.now() - 86400000) // Yesterday
            }));
        }
        console.log(`✅ Created ${orders.length} Eligible Orders`);

        // ------------------------------------------------------------------
        // TEST 1: Run Scheduler (Scenario: Eligible Seller)
        // ------------------------------------------------------------------
        console.log(`\n[TEST 1] Running Scheduler for Window: ${WINDOW_DATE}`);

        await payoutSchedulerService.processSellerForWindow(TEST_SELLER_UID, 'USD', WINDOW_DATE);

        // Verify PayoutSchedule
        const schedule = await PayoutSchedule.findOne({
            sellerId: TEST_SELLER_UID,
            currency: 'USD',
            windowDate: WINDOW_DATE
        });

        if (!schedule) throw new Error("❌ PayoutSchedule NOT created!");
        if (schedule.status !== 'SCHEDULED') {
            console.log("❌ Status mismatch details:", JSON.stringify(schedule, null, 2));
            throw new Error(`❌ Status mismatch. Expected SCHEDULED, got ${schedule.status}`);
        }
        if (schedule.includedOrderIds.length !== 2) throw new Error(`❌ Order count mismatch. Expected 2, got ${schedule.includedOrderIds.length}`);

        console.log("✅ PayoutSchedule Created Successfully:");
        console.log(`   ID: ${schedule.scheduleId}`);
        console.log(`   Status: ${schedule.status}`);
        console.log(`   Orders: ${schedule.includedOrderIds.length}`);

        // ------------------------------------------------------------------
        // TEST 2: Strict Constraints Check (NO EXECUTION)
        // ------------------------------------------------------------------
        console.log(`\n[TEST 2] Verifying Constraints (NO SIDE EFFECTS)`);

        // Check Payout Collection (Should be empty for these orders)
        // Step 14 must NOT create Payout records.
        const payouts = await Payout.find({ orderId: { $in: orders.map(o => o._id) } });
        if (payouts.length > 0) throw new Error("❌ CRITICAL: Payout records were created! Execution Logic Leaked!");
        console.log("✅ Constraint Passed: No Payout records created.");

        // ------------------------------------------------------------------
        // TEST 3: Idempotency (Re-run)
        // ------------------------------------------------------------------
        console.log(`\n[TEST 3] Testing Idempotency (Re-run same window)`);

        const result = await payoutSchedulerService.processSellerForWindow(TEST_SELLER_UID, 'USD', WINDOW_DATE);

        if (result !== 'EXISTING') throw new Error(`❌ Idempotency Failed. Expected 'EXISTING', got '${result}'`);

        const count = await PayoutSchedule.countDocuments({
            sellerId: TEST_SELLER_UID,
            currency: 'USD',
            windowDate: WINDOW_DATE
        });

        if (count !== 1) throw new Error(`❌ Duplicate Schedule Created! Count: ${count}`);
        console.log("✅ Idempotency Passed: Request ignored, record count is 1.");

        // ------------------------------------------------------------------
        // TEST 4: Cleanup
        // ------------------------------------------------------------------
        console.log(`\n[CLEANUP] Removing test data...`);
        await User.deleteMany({ uid: { $in: [TEST_SELLER_UID, TEST_BUYER_UID] } });
        await SellerProfile.deleteMany({ userId: sellerUser._id });
        await Order.deleteMany({ sellerId: TEST_SELLER_UID });
        await PayoutSchedule.deleteMany({ sellerId: TEST_SELLER_UID });
        await LedgerEntry.deleteMany({ user_uid: TEST_SELLER_UID });

        console.log("✅ Verification Complete. Step 14 is Valid.");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ VERIFICATION FAILED:", err);
        process.exit(1);
    }
};

runVerification();
