require("dotenv").config({ path: "../../.env" }); // Adjust path if needed
const mongoose = require("mongoose");
const { configs } = require("../configs");
const { User } = require("../models/user");
const { LedgerEntry } = require("../models/ledgerEntry");
const { walletRoutes } = require("../routes/wallet");
const fastify = require("fastify")({ logger: true });

// Mock Auth
fastify.decorateRequest("user", null);
fastify.addHook("preHandler", async (request, reply) => {
    // Mock user injection for test
    request.user = { uid: "user_verify_wallet_get", email: "verify_wallet@test.com", role: "buyer" };
});

async function runVerification() {
    console.log("🚀 Starting Verification: Step 23 - Wallet GET Fix");

    try {
        await mongoose.connect(configs.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // 0. Setup User
        const testUid = "user_verify_wallet_get";
        await LedgerEntry.deleteMany({ user_uid: testUid });
        console.log("🧹 Cleared ledger for test user");

        // 1. Register Route (Simulate Server)
        // We need to register the specific handler logic or mock the request to the handler directly?
        // Actually, importing the handler logic is better or setting up a minimal fastify instance.
        // Let's rely on calling the handler FUNCTION direction if possible, OR use fastify inject.
        // The route relies on `walletRoutes` which registers handlers. 
        // We'll use fastify.inject.

        // Register the real wallet routes - BUT we need to mock authentication middleware!
        // The `walletRoutes` uses `verifyAuth`. We need to mock that plugin or bypass it.
        // `backend/plugins/authVerify.js` usually decorates.
        // For this test, let's just create a direct test harness for the handler logic OR 
        // use a "test server" approach if `walletRoutes` allows mocking auth.
        // `walletRoutes` calls `require("../plugins/authVerify")`. 

        // EASIER PATH: Call the handler function directly if exported?
        // Handler `getWallet` is in `walletHandlers.js`.
        const walletHandlers = require("../handlers/walletHandlers");

        // Mock Request/Reply
        const mockRequest = {
            log: console,
            user: { uid: testUid, role: "buyer" }
        };

        const callHandler = async () => {
            let capturedData = null;
            const mockReply = {
                send: (payload) => {
                    capturedData = payload;
                    return mockReply;
                },
                status: (code) => mockReply,
                code: (code) => mockReply,
                setCookie: () => mockReply,
                clearCookie: () => mockReply
            };
            await walletHandlers.getWallet(mockRequest, mockReply);
            return capturedData;
        };

        // 2. Initial State Check
        console.log("\n--- Test 1: Initial Empty Wallet ---");
        let response = await callHandler();
        console.log("Response:", JSON.stringify(response, null, 2));

        if (response.data.wallet.balance !== 0) throw new Error("Balance should be 0");
        if (response.data.wallet.totalFunded !== 0) throw new Error("TotalFunded should be 0");

        // 3. Fund Wallet
        console.log("\n--- Test 2: Fund Wallet ($50.00) ---");
        await LedgerEntry.create({
            user_uid: testUid,
            role: "buyer",
            type: "wallet_credit_placeholder",
            amount: 5000,
            currency: "USD",
            status: "available",
            description: "Test Funding",
            externalId: "fund_" + Date.now()
        });

        response = await callHandler();
        console.log("Response:", JSON.stringify(response, null, 2));

        if (response.data.wallet.balance !== 5000) throw new Error(`Balance mismatch: Expected 5000, got ${response.data.wallet.balance}`);
        if (response.data.wallet.totalFunded !== 5000) throw new Error("TotalFunded mismatch");

        // 4. Spend Funds
        console.log("\n--- Test 3: Spend Funds ($10.00) ---");
        await LedgerEntry.create({
            user_uid: testUid,
            role: "buyer",
            type: "wallet_debit_purchase",
            amount: -1000,
            currency: "USD",
            status: "available",
            description: "Test Purchase",
            externalId: "spend_" + Date.now()
        });

        response = await callHandler();
        console.log("Response:", JSON.stringify(response, null, 2));

        if (response.data.wallet.balance !== 4000) throw new Error(`Balance mismatch: Expected 4000, got ${response.data.wallet.balance}`);
        if (response.data.wallet.totalSpent !== 1000) throw new Error(`TotalSpent mismatch: Expected 1000, got ${response.data.wallet.totalSpent}`); // Note: totalSpent should be positive 1000 in logic

        // 5. Structure Check
        const tx = response.data.recentTransactions[0];
        if (!tx) throw new Error("Missing transactions");
        if (tx.amount === undefined) throw new Error("Missing transaction amount");
        if (tx.type !== "wallet_debit_purchase") throw new Error("Incorrect transaction type order");

        console.log("\n✅ VERIFICATION SUCCESSFUL: GET /wallet uses Ledger Correctly!");

    } catch (error) {
        console.error("❌ Verification Failed:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

runVerification();
