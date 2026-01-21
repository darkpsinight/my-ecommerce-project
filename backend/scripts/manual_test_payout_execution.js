const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const { PayoutSchedule } = require("../models/PayoutSchedule");
const { Order } = require("../models/order");
const { Payout } = require("../models/payout");
const { LedgerEntry } = require("../models/ledgerEntry");
const { StripeAccount } = require("../models/stripeAccount");
const payoutExecutionWorker = require("../services/payment/payoutExecutionWorker");
const stripeAdapter = require("../services/payment/stripeAdapter");

// Mock Stripe Adapter
stripeAdapter.createTransferToSeller = async () => {
    return { transferId: "tr_mock_" + Date.now() };
};

const TEST_SELLER_ID = "test_verified_seller_001";

async function logState(label, scheduleId) {
    const timestamp = new Date().toISOString();
    console.log(`\n--- [${timestamp}] STATE SNAPSHOT: ${label} ---`);
    if (scheduleId) {
        const sched = await PayoutSchedule.findOne({ scheduleId });
        console.log("SCHEDULE:", JSON.stringify(sched ? {
            status: sched.status,
            updatedAt: sched.updatedAt,
            scheduleId: sched.scheduleId,
            includedOrderIds: sched.includedOrderIds
        } : "null", null, 2));

        const payouts = await Payout.find({ scheduleId: sched?.scheduleId }).select("payoutId status orderId scheduleId executionSource amount");
        console.log(`PAYOUTS (${payouts.length}):`, JSON.stringify(payouts, null, 2));
    }
}

async function setupBaseData() {
    await PayoutSchedule.deleteMany({ sellerId: TEST_SELLER_ID });
    await Payout.deleteMany({ sellerId: TEST_SELLER_ID });
    await Order.deleteMany({ sellerId: TEST_SELLER_ID });
    await StripeAccount.deleteMany({ sellerId: TEST_SELLER_ID });
    await LedgerEntry.deleteMany({ user_uid: TEST_SELLER_ID });

    // 1. Stripe Account
    await StripeAccount.create({
        sellerId: TEST_SELLER_ID,
        stripeAccountId: "acct_verif_" + Date.now(),
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        country: "US",
        status: "verified"
    });

    // 2. Ledger Balance
    await LedgerEntry.create({
        user_uid: TEST_SELLER_ID,
        role: "seller",
        type: "escrow_release_credit",
        amount: 500000, // $5000
        currency: "USD",
        status: "available",
        description: "Initial Balance"
    });

    return {};
}

async function createScheduleWithOrders(count = 3, failOne = false, windowDateStr = "2025-01-01") {
    const orders = [];
    for (let i = 1; i <= count; i++) {
        const order = await Order.create({
            sellerId: TEST_SELLER_ID,
            buyerId: "buyer_verif",
            externalId: `ord_verif_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`, // Unique External ID
            totalAmount: 100,
            currency: "USD",
            paymentMethod: "stripe",
            deliveryStatus: "delivered",
            eligibilityStatus: "ELIGIBLE_FOR_PAYOUT",
            status: "completed"
        });
        orders.push(order);
    }

    if (failOne && orders.length > 1) {
        // Tamper Order 2 to be ineligible
        await Order.updateOne({ _id: orders[1]._id }, { eligibilityStatus: "PENDING_MATURITY" });
        console.log(`[Setup] Tampered Order ${orders[1].externalId} to force failure.`);
    }

    const schedule = await PayoutSchedule.create({
        sellerId: TEST_SELLER_ID,
        currency: "USD",
        windowDate: windowDateStr,
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() - 1000),
        includedOrderIds: orders.map(o => o._id),
        totalAmount: orders.length * 10000,
        totalCount: orders.length
    });

    return schedule;
}

async function runTests() {
    if (!process.env.MONGO_URI) { console.error("Missing MONGO_URI"); process.exit(1); }
    await mongoose.connect(process.env.MONGO_URI);

    await setupBaseData();

    // ==========================================
    // SCENARIO A: SUCCESSFUL EXECUTION
    // ==========================================
    console.log("\n\n>>> SCENARIO A: SUCCESSFUL EXECUTION <<<");
    const schedA = await createScheduleWithOrders(3, false, "2025-01-01");
    await logState("BEFORE EXECUTION", schedA.scheduleId);

    await payoutExecutionWorker.execute();

    await logState("AFTER EXECUTION", schedA.scheduleId);

    // Verify Ledger
    const ledgerEntriesA = await LedgerEntry.find({ user_uid: TEST_SELLER_ID, type: "payout_reservation" });
    console.log(`Ledger payout_reservations: ${ledgerEntriesA.length} (Expected 3)`);

    // ==========================================
    // SCENARIO B: IDEMPOTENT RE-RUN
    // ==========================================
    console.log("\n\n>>> SCENARIO B: IDEMPOTENT RE-RUN <<<");
    // Reset to SCHEDULED (Illegal state normally, but simulates "didn't finish update" or "retry logic")
    // Or simpler: Just run execute again. The schedule is CONSUMED, so it should be IGNORED.
    // If we want to test "mid-crash" idempotency, we set it to PROCESSING.
    // Let's set it to PROCESSING with old timestamp to simulate a re-run of a crashed, half-done job? 
    // No, Scenario B requests "worker restarted, zero new payouts".
    // If I just run `execute()` now, it finds nothing.
    // To test idempotency, I must force it to look at the schedule again.
    // I will set it to SCHEDULED but keep the Payouts existing.
    await PayoutSchedule.updateOne({ _id: schedA._id }, { status: "SCHEDULED" });
    console.log("[Setup] Reset Schedule A to SCHEDULED (Simulating re-queue)");

    await payoutExecutionWorker.execute();

    await logState("AFTER IDEMPOTENT RUN", schedA.scheduleId);
    const payoutsB = await Payout.find({ scheduleId: schedA.scheduleId });
    if (payoutsB.length === 3) console.log("✅ Verification: Payout count remains 3.");

    // ==========================================
    // SCENARIO C: CRASH RECOVERY
    // ==========================================
    console.log("\n\n>>> SCENARIO C: CRASH RECOVERY <<<");
    // Setup: Schedule Stuck in PROCESSING, Payouts 1 & 2 done, 3 pending.
    // I need a NEW schedule for clean test.
    const schedC = await createScheduleWithOrders(3, false, "2025-01-02");
    // Manually create Payouts for orders 0 and 1
    await payoutExecutionWorker.executeSinglePayout(schedC.includedOrderIds[0], schedC);

    // Set Schedule to Stale PROCESSING
    await PayoutSchedule.updateOne({ _id: schedC._id }, {
        status: "PROCESSING",
        updatedAt: new Date(Date.now() - 40 * 60 * 1000)
    }, { timestamps: false });
    console.log("[Setup] Schedule C stuck in PROCESSING (stale)");

    await logState("BEFORE RECOVERY", schedC.scheduleId);

    await payoutExecutionWorker.execute();

    await logState("AFTER RECOVERY", schedC.scheduleId);

    // ==========================================
    // SCENARIO D: PARTIAL FAILURE
    // ==========================================
    console.log("\n\n>>> SCENARIO D: PARTIAL FAILURE <<<");
    const schedD = await createScheduleWithOrders(3, true, "2025-01-03"); // Fail mid one

    await logState("BEFORE PARTIAL FAIL RUN", schedD.scheduleId);

    await payoutExecutionWorker.execute();

    await logState("AFTER PARTIAL FAIL RUN", schedD.scheduleId);
    // Expect: Consumed. 2 Payouts.

    // ==========================================
    // SCENARIO E: CONCURRENCY
    // ==========================================
    console.log("\n\n>>> SCENARIO E: CONCURRENCY <<<");
    const schedE = await createScheduleWithOrders(3, false, "2025-01-04");
    console.log(`[Setup] Created Schedule E: ${schedE.scheduleId}`);

    console.log("Starting 2 Workers concurrently...");
    const p1 = payoutExecutionWorker.execute();
    const p2 = payoutExecutionWorker.execute();

    await Promise.all([p1, p2]);
    console.log("Both workers finished.");

    await logState("AFTER CONCURRENCY", schedE.scheduleId);
    // Check duplication
    const payoutsE = await Payout.find({ scheduleId: schedE.scheduleId });
    console.log(`Total Payouts for E: ${payoutsE.length} (Expected 3)`);

    mongoose.disconnect();
}

runTests();
