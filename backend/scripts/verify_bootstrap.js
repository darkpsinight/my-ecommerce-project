const mongoose = require("mongoose");
const { Order } = require("../models/order");
const { initializeJobs } = require("../jobs/index");
const { configs } = require("../configs");
require("dotenv").config();

// Mock Fastify for logging
const mockFastify = {
    log: {
        info: (msg) => console.log(`[Fastify Info] ${msg}`),
        error: (msg) => console.error(`[Fastify Error] ${msg}`)
    }
};

const runVerification = async () => {
    // Override Cron to run every 5 seconds for testing purposes (node-cron supports 6 fields)
    // configs object is mutable
    configs.ESCROW_MATURITY_CRON = "*/5 * * * * *"; // Every 5 seconds
    configs.ESCROW_MATURITY_SECONDS = 5; // Mature quickly for test

    await mongoose.connect(configs.MONGO_URI);
    console.log("Connected to MongoDB");

    try {
        // 1. Setup Test Data (Mature Order)
        const orderId = "JOB_TEST_" + Date.now();
        const order = await Order.createOrder({
            buyerId: "TEST_BUYER",
            sellerId: "TEST_SELLER",
            orderItems: [{
                listingId: new mongoose.Types.ObjectId(),
                title: "Job Test Item",
                platform: "PC",
                region: "Global",
                quantity: 1,
                unitPrice: 10,
                totalPrice: 10,
                expirationGroups: [],
                purchasedCodes: [{ codeId: "c1", code: "secret", iv: "iv" }]
            }],
            totalAmount: 10,
            paymentMethod: "stripe",
            externalId: orderId
        });

        // Make it mature
        const past = new Date();
        past.setSeconds(past.getSeconds() - 10);
        order.status = "completed";
        order.deliveryStatus = "delivered";
        order.deliveredAt = past;
        order.eligibilityStatus = "PENDING_MATURITY";
        await order.save();
        console.log(`[Setup] Created Mature Order: ${orderId}`);

        // 2. Initialize Jobs
        console.log("[Action] Initializing Jobs...");
        initializeJobs(mockFastify);

        // 3. Wait for Cron to trigger (Wait 7 seconds)
        console.log("[Wait] Waiting 7s for cron execution...");
        await new Promise(resolve => setTimeout(resolve, 7000));

        // 4. Verify
        const updated = await Order.findOne({ externalId: orderId });
        console.log(`[Verify] Order Status: ${updated.eligibilityStatus}`);

        if (updated.eligibilityStatus !== "ELIGIBLE") {
            throw new Error("Job did not process the order! Status is still " + updated.eligibilityStatus);
        }

        console.log("SUCCESS: Job bootstrapped and executed successfully.");

    } catch (error) {
        console.error("VERIFICATION FAILED:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        // Force exit because cron is running
        process.exit(0);
    }
};

runVerification();
