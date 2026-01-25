require("dotenv").config({ path: "../../.env" });
const mongoose = require("mongoose");
const { configs } = require("../configs");
const { LedgerEntry } = require("../models/ledgerEntry");
const { User } = require("../models/user");
const walletFundingService = require("../services/payment/walletFunding");
const walletLedgerService = require("../services/payment/walletLedgerService");

// Mock Data
const TEST_UID = "user_verify_funding_safe";

async function runVerification() {
    console.log("🚀 Starting Verification: Step 23.5 - Safe Wallet Funding");

    try {
        await mongoose.connect(configs.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Cleanup
        await LedgerEntry.deleteMany({ user_uid: TEST_UID });
        console.log("🧹 Cleared ledger for test user");

        // 1. Attempt Funding (Should return Intent, NOT funds)
        console.log("\n--- Test 1: Initiate Funding ($20.00) ---");
        const fundingResult = await walletFundingService.fundWallet(TEST_UID, 2000, "USD");
        console.log("Funding Result:", JSON.stringify(fundingResult, null, 2));

        if (!fundingResult.clientSecret) throw new Error("Missing clientSecret");
        if (!fundingResult.paymentIntentId) throw new Error("Missing paymentIntentId");
        if (fundingResult.balance !== undefined) throw new Error("Should NOT return new balance yet");

        // 2. Verify NO Ledger Entry Created Yet
        const balanceBefore = await walletLedgerService.getBuyerBalance(TEST_UID, "USD");
        console.log(`Balance Before Confirmation: ${balanceBefore}`);
        if (balanceBefore !== 0) throw new Error("Wallet should still be empty");

        // 3. Simulate Client-Side Confirmation (Manual Trigger of processConfirmedFunding)
        // Since we can't actually confirm with a real card in this script without a UI, 
        // we will use a special approach:
        // We need 'processConfirmedFunding' to work, but it retrieves from Stripe.
        // The Intent created in Test 1 is 'requires_payment_method'.
        // We cannot transition it to 'succeeded' without a payment method.
        // 
        // WORKAROUND: For this verification script, we will mock the Stripe retrieval/status check 
        // inside the service OR we just use valid test credentials if we could.
        // OR we manually inject the 'succeeded' intent object into processFundingSuccess 
        // to prove the LOGIC works, assuming the webhook/handler would call it correctly.

        console.log("\n--- Test 2: Simulate Successful Confirmation ---");

        // Mock a succeeded intent object
        const mockSucceededIntent = {
            id: fundingResult.paymentIntentId,
            status: "succeeded",
            amount: 2000, // Gross amount (if fees applied, might be higher, but let's assume simple)
            currency: "usd",
            metadata: {
                buyerId: TEST_UID,
                type: "wallet_topup",
                originalAmount: "2000"
            }
        };

        // Call the idempotency core directly (since we can't easily force Stripe status in test)
        // Note: In real prod, processConfirmedFunding would call this after verifying with Stripe.
        const confirmResult = await walletFundingService.processFundingSuccess(mockSucceededIntent);
        console.log("Confirmation Result:", JSON.stringify(confirmResult, null, 2));

        if (confirmResult.balance !== 2000) throw new Error(`Balance mismatch: Expected 2000, got ${confirmResult.balance}`);

        // 4. Verify Ledger Entry Exists
        const balanceAfter = await walletLedgerService.getBuyerBalance(TEST_UID, "USD");
        console.log(`Balance After Confirmation: ${balanceAfter}`);
        if (balanceAfter !== 2000) throw new Error("Wallet should be funded now");

        // 5. Verify Idempotency
        console.log("\n--- Test 3: Idempotency Check ---");
        const duplicateResult = await walletFundingService.processFundingSuccess(mockSucceededIntent);
        console.log("Duplicate Result:", JSON.stringify(duplicateResult, null, 2));

        if (!duplicateResult.alreadyProcessed) throw new Error("Should report already processed");
        if (duplicateResult.balance !== 2000) throw new Error("Balance should remain 2000");


        console.log("\n✅ VERIFICATION SUCCESSFUL: Safe Wallet Funding Implemented!");

    } catch (error) {
        console.error("❌ Verification Failed:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

runVerification();
