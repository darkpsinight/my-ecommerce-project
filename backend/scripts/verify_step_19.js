const mongoose = require("mongoose");
const { Order } = require("../models/order");
const EscrowMaturityService = require("../services/escrow-maturity/escrow-maturity");
const { configs } = require("../configs");
require("dotenv").config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(configs.MONGO_URI);
        console.log("Connected to MongoDB for Verification");
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
        process.exit(1);
    }
};

const runVerification = async () => {
    await connectDB();

    console.log("========================================");
    console.log("VERIFYING STEP 19: ESCROW MATURITY");
    console.log("========================================");
    console.log(`Configured Maturity Seconds: ${configs.ESCROW_MATURITY_SECONDS}`);

    try {
        // 1. Setup Test Data
        const buyerId = "TEST_BUYER_" + Date.now();
        const sellerId = "TEST_SELLER_" + Date.now();

        // Create dummy users if needed by schema (Order checks string uids, but good to be safe if refs exist)
        // Order model refs 'User' but strictly stores strings. 

        // Create 4 orders

        // Case A: Recent Order (Should NOT mature)
        const recentOrder = await Order.createOrder({
            buyerId,
            sellerId,
            orderItems: [{
                listingId: new mongoose.Types.ObjectId(),
                title: "Item A",
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
            externalId: "ORD_RECENT_" + Date.now()
        });
        // Manually set deliveredAt to NOW
        recentOrder.status = "completed";
        recentOrder.deliveryStatus = "delivered";
        recentOrder.deliveredAt = new Date(); // Just delivered
        recentOrder.eligibilityStatus = "PENDING_MATURITY";
        await recentOrder.save();
        console.log(`[Setup] Created Recent Order: ${recentOrder.externalId}`);

        // Case B: Mature Order (Should MATURE)
        const matureOrder = await Order.createOrder({
            buyerId,
            sellerId,
            orderItems: [{
                listingId: new mongoose.Types.ObjectId(),
                title: "Item B",
                platform: "PC",
                region: "Global",
                quantity: 1,
                unitPrice: 20,
                totalPrice: 20,
                expirationGroups: [],
                purchasedCodes: [{ codeId: "c2", code: "secret", iv: "iv" }]
            }],
            totalAmount: 20,
            paymentMethod: "stripe",
            externalId: "ORD_MATURE_" + Date.now()
        });
        // Manually set deliveredAt to PAST
        const pastDate = new Date();
        pastDate.setSeconds(pastDate.getSeconds() - (configs.ESCROW_MATURITY_SECONDS + 10)); // Mature by 10 seconds
        matureOrder.status = "completed";
        matureOrder.deliveryStatus = "delivered";
        matureOrder.deliveredAt = pastDate;
        matureOrder.eligibilityStatus = "PENDING_MATURITY";
        await matureOrder.save();
        console.log(`[Setup] Created Mature Order: ${matureOrder.externalId} (Delivered at ${pastDate.toISOString()})`);

        // Case C: Already Eligible (Should UNCHANGED)
        // Note: 'ELIGIBLE' is the new enum value
        const alreadyEligibleOrder = await Order.createOrder({
            buyerId,
            sellerId,
            orderItems: [{
                listingId: new mongoose.Types.ObjectId(),
                title: "Item C",
                platform: "PC",
                region: "Global",
                quantity: 1,
                unitPrice: 30,
                totalPrice: 30,
                expirationGroups: [],
                purchasedCodes: [{ codeId: "c3", code: "secret", iv: "iv" }]
            }],
            totalAmount: 30,
            paymentMethod: "stripe",
            externalId: "ORD_EXISTING_" + Date.now()
        });
        alreadyEligibleOrder.status = "completed";
        alreadyEligibleOrder.deliveryStatus = "delivered";
        alreadyEligibleOrder.deliveredAt = pastDate;
        alreadyEligibleOrder.eligibilityStatus = "ELIGIBLE"; // Already processed
        alreadyEligibleOrder.eligibleAt = pastDate;
        await alreadyEligibleOrder.save();
        console.log(`[Setup] Created Already Eligible Order: ${alreadyEligibleOrder.externalId}`);

        // Case D: Legacy ELIGIBLE_FOR_PAYOUT (Should UNCHANGED)
        const legacyOrder = await Order.createOrder({
            buyerId,
            sellerId,
            orderItems: [{
                listingId: new mongoose.Types.ObjectId(),
                title: "Item D",
                platform: "PC",
                region: "Global",
                quantity: 1,
                unitPrice: 40,
                totalPrice: 40,
                expirationGroups: [],
                purchasedCodes: [{ codeId: "c4", code: "secret", iv: "iv" }]
            }],
            totalAmount: 40,
            paymentMethod: "stripe",
            externalId: "ORD_LEGACY_" + Date.now()
        });
        legacyOrder.status = "completed";
        legacyOrder.deliveryStatus = "delivered";
        legacyOrder.deliveredAt = pastDate;
        legacyOrder.eligibilityStatus = "ELIGIBLE_FOR_PAYOUT"; // Legacy status
        await legacyOrder.save();
        console.log(`[Setup] Created Legacy Order: ${legacyOrder.externalId}`);


        // 2. Run Process
        console.log("\n[Action] Running EscrowMaturityService.processMaturityBatch()...");
        const stats1 = await EscrowMaturityService.processMaturityBatch();
        console.log("Stats Run 1:", stats1);

        // 3. Verify States
        console.log("\n[Verification] Checking states...");

        const recentRefetched = await Order.findById(recentOrder._id);
        console.log(`Recent Order Status: ${recentRefetched.eligibilityStatus} (Expected: PENDING_MATURITY)`);
        if (recentRefetched.eligibilityStatus !== "PENDING_MATURITY") throw new Error("Recent order matured prematurely!");

        const matureRefetched = await Order.findById(matureOrder._id);
        console.log(`Mature Order Status: ${matureRefetched.eligibilityStatus} (Expected: ELIGIBLE)`);
        if (matureRefetched.eligibilityStatus !== "ELIGIBLE") throw new Error("Mature order did not transition to ELIGIBLE!");
        if (!matureRefetched.eligibleAt) throw new Error("Mature order missing eligibleAt timestamp!");

        const eligibleRefetched = await Order.findById(alreadyEligibleOrder._id);
        console.log(`Existing Eligible Status: ${eligibleRefetched.eligibilityStatus} (Expected: ELIGIBLE)`);
        // Ensure eligibleAt wasn't overwritten to NOW (should match original setup time roughly)
        if (eligibleRefetched.eligibilityStatus !== "ELIGIBLE") throw new Error("Existing eligible order changed status!");

        const legacyRefetched = await Order.findById(legacyOrder._id);
        console.log(`Legacy Order Status: ${legacyRefetched.eligibilityStatus} (Expected: ELIGIBLE_FOR_PAYOUT)`);
        if (legacyRefetched.eligibilityStatus !== "ELIGIBLE_FOR_PAYOUT") throw new Error("Legacy order was modified!");


        // 4. Test Idempotency (Run again)
        console.log("\n[Action] Running Batch AGAIN (Idempotency Check)...");
        const stats2 = await EscrowMaturityService.processMaturityBatch();
        console.log("Stats Run 2:", stats2);

        if (stats2.processed > 0) throw new Error("Idempotency failed: Processed orders in second run!");
        if (stats2.errors > 0) throw new Error("Errors in second run!");

        console.log("\nSUCCESS: All verification checks passed.");

    } catch (error) {
        console.error("VERIFICATION FAILED:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

runVerification();
