require("dotenv").config();
const mongoose = require("mongoose");
const { Order } = require("../models/order");
const { PayoutSchedule } = require("../models/PayoutSchedule");
const { User } = require("../models/user");
const payoutSchedulingService = require("../services/payout-scheduling/payoutScheduling.service");
const { v4: uuidv4 } = require("uuid");

const MONGO_URI = process.env.MONGO_URI;

async function runVerification() {
    console.log(">>> Connecting to DB...");
    await mongoose.connect(MONGO_URI);

    try {
        console.log(">>> Cleaning up previous test data (Step 20 verification)...");
        // Clean up test orders and schedules
        const testSellerId = "test_seller_step_20";
        await Order.deleteMany({ sellerId: testSellerId });
        await PayoutSchedule.deleteMany({ sellerId: testSellerId });

        console.log(">>> Seeding Test Data...");

        // 1. Create ELIGIBLE Order
        const eligibleOrder = await Order.create({
            buyerId: "test_buyer",
            sellerId: testSellerId,
            orderItems: [], // Minimal
            totalAmount: 50.00,
            currency: "USD",
            paymentMethod: "stripe",
            status: "completed",
            deliveryStatus: "delivered",
            eligibilityStatus: "ELIGIBLE", // Target status
            externalId: uuidv4()
        });

        // 2. Create INELIGIBLE Order (PENDING_MATURITY)
        const pendingOrder = await Order.create({
            buyerId: "test_buyer",
            sellerId: testSellerId,
            orderItems: [],
            totalAmount: 25.00,
            currency: "USD",
            paymentMethod: "stripe",
            status: "completed",
            deliveryStatus: "delivered",
            eligibilityStatus: "PENDING_MATURITY",
            externalId: uuidv4()
        });

        console.log(`>>> Created Eligible Order: ${eligibleOrder._id}`);
        console.log(`>>> Created Pending Order: ${pendingOrder._id}`);

        // 3. Run Scheduler Service (Round 1)
        console.log("\n>>> Running Scheduler (Round 1)...");
        const stats1 = await payoutSchedulingService.schedulePayouts();

        console.log(">>> Verify Round 1 Results:");
        console.log("Stats:", stats1);

        if (stats1.scheduled !== 1) throw new Error(`Expected 1 scheduled, got ${stats1.scheduled}`);
        if (stats1.scanned < 1) throw new Error(`Expected at least 1 scanned`);

        // Check PayoutSchedule
        const schedule = await PayoutSchedule.findOne({ orderId: eligibleOrder._id });
        if (!schedule) throw new Error("PayoutSchedule NOT created for eligible order");
        if (schedule.status !== "SCHEDULED") throw new Error(`Expected status SCHEDULED, got ${schedule.status}`);
        if (schedule.totalAmount !== 5000) throw new Error(`Expected amount 5000 (cents), got ${schedule.totalAmount}`);
        if (!schedule.includedOrderIds.includes(eligibleOrder._id)) throw new Error("includedOrderIds missing orderId");
        if (schedule.includedOrderIds.length !== 1) throw new Error("includedOrderIds length mismatch");

        // Check Order Status Update
        const updatedOrder = await Order.findById(eligibleOrder._id);
        if (updatedOrder.eligibilityStatus !== "ELIGIBLE_FOR_PAYOUT") {
            throw new Error(`Order status mismatch. Expected ELIGIBLE_FOR_PAYOUT, got ${updatedOrder.eligibilityStatus}`);
        }
        console.log(">>> Eligible Order processed correctly.");

        // Check Pending Order Ignored
        const pendingSchedule = await PayoutSchedule.findOne({ orderId: pendingOrder._id });
        if (pendingSchedule) throw new Error("Pending Order should NOT be scheduled");

        const updatedPendingOrder = await Order.findById(pendingOrder._id);
        if (updatedPendingOrder.eligibilityStatus !== "PENDING_MATURITY") throw new Error("Pending Order status should NOT change");
        console.log(">>> Pending Order ignored correctly.");


        // 4. Run Scheduler Service (Round 2 - Idempotency)
        console.log("\n>>> Running Scheduler (Round 2)...");
        const stats2 = await payoutSchedulingService.schedulePayouts();

        console.log(">>> Verify Round 2 Results:");
        console.log("Stats:", stats2);

        // Should be 0 scheduled as it's already done
        // Order is now 'ELIGIBLE_FOR_PAYOUT', so findEligibleOrders won't even find it if query is strict 'ELIGIBLE'.
        // Service query: find({ eligibilityStatus: 'ELIGIBLE' })
        // Since we changed it to 'ELIGIBLE_FOR_PAYOUT', it won't be scanned.
        // If query was loose, it might be scanned but skipped.
        // Let's verify scan count.
        // Expect scanned=0 (for this test user) effectively, unless there are other eligible orders in DB.

        // Wait, if it's not scanned, it's safe. 
        // But what if we force reset status to ELIGIBLE but keep schedule?

        console.log(">>> Force-Testing Idempotency: Resetting Order Status to ELIGIBLE but keeping Schedule...");
        updatedOrder.eligibilityStatus = 'ELIGIBLE';
        await updatedOrder.save();

        const stats3 = await payoutSchedulingService.schedulePayouts();
        console.log("Stats 3:", stats3);

        if (stats3.scheduled !== 0) throw new Error("Should SKIP already scheduled order even if marked ELIGIBLE");
        if (stats3.skipped !== 1) throw new Error("Should count as SKIPPED");

        console.log("\n>>> VERIFICATION SUCCESSFUL: Step 20 logic passed.");

    } catch (err) {
        console.error("\n>>> VERIFICATION FAILED:", err);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

runVerification();
