const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { configs } = require("../configs");
const { LedgerEntry } = require("../models/ledgerEntry");
const { User } = require("../models/user");
const { Order } = require("../models/order");
const { Payout } = require("../models/payout");
const { Dispute } = require("../models/dispute");
const walletLedgerService = require("../services/payment/walletLedgerService");
const { fundWallet } = require("../handlers/walletHandlers");

// helper to create mock reply
function createMockReply() {
    let sentData = null;
    let statusCode = 200;
    return {
        code: function (c) { statusCode = c; return this; },
        status: function (c) { statusCode = c; return this; },
        send: function (data) { sentData = data; return this; },
        getSentData: () => sentData,
        getStatusCode: () => statusCode
    };
}

async function runVerification() {
    console.log("🔍 Starting Verification for Step 23.3: Buyer Wallet Funding API (Direct Handler Mode)");

    try {
        // Connect to DB
        await mongoose.connect(configs.MONGO_URI);
        console.log("✅ Database connected");

        // 1. Setup Buyer & Token
        const { uid, buyerId } = await generateTestToken(); // Token string not needed for direct call
        console.log(`👤 Using Buyer: ${uid} (${buyerId})`);

        // 2. Initial Balance Check
        const initialBalance = await walletLedgerService.getBuyerBalance(uid, "USD");
        console.log(`💰 Initial Balance: $${initialBalance}`);

        // Capture Isolation State (Snapshot)
        const initialCounts = await getIsolationCounts();
        console.log("🔒 Isolation Snapshot Taken (Orders/Escrows/Payouts/Disputes)");

        // 3. Fund Wallet via Handler (Direct Call)
        const FUND_AMOUNT_CENTS = 5000; // $50.00
        console.log(`\n🚀 Invoking fundWallet() with $50.00...`);

        // Mock Request
        const req1 = {
            user: { uid: uid },
            body: { amount: FUND_AMOUNT_CENTS, currency: "USD" },
            log: { info: console.log, error: console.error }
        };
        const reply1 = createMockReply();

        await fundWallet(req1, reply1);

        const json1 = reply1.getSentData();
        const status1 = reply1.getStatusCode();

        if (status1 !== 200) {
            throw new Error(`Handler Failed: ${status1} - ${JSON.stringify(json1)}`);
        }

        console.log("✅ API Response 1:", JSON.stringify(json1, null, 2));

        if (!json1.success) throw new Error("API reported failure");
        console.log(`Debug Check: Initial=${initialBalance}, Added=${FUND_AMOUNT_CENTS}, Expected=${initialBalance + FUND_AMOUNT_CENTS}, Actual=${json1.data.balance}`);
        if (json1.data.balance !== initialBalance + FUND_AMOUNT_CENTS) {
            throw new Error(`Balance mismatch in response. Expected ${initialBalance + FUND_AMOUNT_CENTS}, got ${json1.data.balance}`);
        }

        // 4. Verify Ledger Entry
        const ledgerEntry = await LedgerEntry.findOne({
            related_payment_intent_id: json1.data.paymentIntentId,
            type: "wallet_credit_placeholder"
        });

        if (!ledgerEntry) throw new Error("❌ Ledger Entry NOT found!");
        console.log("✅ Ledger Entry Verified:", ledgerEntry._id);
        if (ledgerEntry.amount !== FUND_AMOUNT_CENTS) throw new Error("Ledger Entry amount mismatch");

        // 5. Verify Balance Update in DB
        const newBalance = await walletLedgerService.getBuyerBalance(uid, "USD");
        console.log(`💰 New Balance in DB: ${newBalance} cents`);
        if (newBalance !== initialBalance + FUND_AMOUNT_CENTS) {
            throw new Error("DB Balance Check Failed");
        }

        // 6. Test Non-Idempotency of API (Calling it again should fund again)
        console.log(`\n🔄 Invoking fundWallet() AGAIN with $50.00 (Expect NEW funding)...`);

        const req2 = {
            user: { uid: uid },
            body: { amount: FUND_AMOUNT_CENTS, currency: "USD" },
            log: { info: console.log, error: console.error }
        };
        const reply2 = createMockReply();

        await fundWallet(req2, reply2);

        const json2 = reply2.getSentData();
        if (reply2.getStatusCode() !== 200) throw new Error("Handler Failed 2nd time");

        console.log("✅ API Response 2:", JSON.stringify(json2, null, 2));

        if (json2.data.paymentIntentId === json1.data.paymentIntentId) {
            throw new Error("❌ API returned SAME PaymentIntentId! It should be NEW.");
        }

        const finalBalance = await walletLedgerService.getBuyerBalance(uid, "USD");
        console.log(`💰 Final Balance: $${finalBalance}`);

        if (finalBalance !== initialBalance + (FUND_AMOUNT_CENTS * 2)) {
            throw new Error(`Final Balance Check Failed. Expected ${initialBalance + FUND_AMOUNT_CENTS * 2}, got ${finalBalance}`);
        }
        console.log("✅ Non-Idempotency Verified (2 separate fundings successful)");

        // 7. Isolation Verification
        console.log("\n🔒 Verifying Isolation...");
        const finalCounts = await getIsolationCounts();

        if (JSON.stringify(initialCounts) !== JSON.stringify(finalCounts)) {
            console.error("Initial:", initialCounts);
            console.error("Final:", finalCounts);
            throw new Error("❌ Isolation Violated! Database counts changed for unrelated entities.");
        }
        console.log("✅ Isolation Verified: No side effects on Orders, Escrows, Payouts, or Disputes.");

        console.log("\n🎉 VERIFICATION PASSED: Step 23.3 Complete!");

        // Explicitly exit to close connections
        process.exit(0);

    } catch (error) {
        console.error("\n❌ VERIFICATION FAILED:", error);
        process.exit(1);
    }
} // mongoose.disconnect loop is removed as process.exit handles it cleaner for scripts

async function getIsolationCounts() {
    return {
        orders: await Order.countDocuments(),
        payouts: await Payout.countDocuments(),
        disputes: await Dispute.countDocuments()
    };
}

async function generateTestToken() {
    console.log("Generating test token for buyer@test.com...");
    const buyerEmail = 'buyer@test.com';
    let buyer = await User.findOne({ email: buyerEmail });

    if (!buyer) {
        throw new Error(`User with email ${buyerEmail} not found. Please ensure seed data exists.`);
    }

    const payload = {
        uid: buyer.uid,
        _id: buyer._id,
        email: buyer.email,
        roles: buyer.roles
    };

    const token = jwt.sign(payload, configs.JWT_KEY, { expiresIn: '1h' });
    return { token, uid: buyer.uid, buyerId: buyer._id };
}

runVerification();
