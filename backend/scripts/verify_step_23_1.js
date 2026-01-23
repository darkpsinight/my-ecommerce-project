require("dotenv").config({ path: "backend/.env" }); // Load usage configs from backend folder
const mongoose = require("mongoose");
const { LedgerEntry } = require("../models/ledgerEntry");
const walletLedgerService = require("../services/payment/walletLedgerService");
const { v4: uuidv4 } = require("uuid");

// Test Configuration
const TEST_BUYER_UID = `verify_23_1_buyer_${Date.now()}`;
const TEST_CURRENCY = "USD";

async function runVerification() {
    console.log(">>> STARTING STEP 23.1 VERIFICATION (Buyer Wallet Ledger) <<<\n");

    try {
        // 1. Connect to DB
        if (mongoose.connection.readyState === 0) {
            const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
            if (!uri) throw new Error("MONGO_URI is undefined. Check .env file.");
            await mongoose.connect(uri);
            console.log("✅ DB Connected");
        }

        // ---------------------------------------------------------
        // Scenario 1: Verify Initial State (Balance = 0)
        // ---------------------------------------------------------
        console.log("\n--- Scenario 1: Initial Balance Check ---");
        const initialBalance = await walletLedgerService.getBuyerBalance(TEST_BUYER_UID, TEST_CURRENCY);
        console.log(`Initial Balance: ${initialBalance}`);

        if (initialBalance !== 0) throw new Error("Initial balance should be 0");
        await walletLedgerService.assertWalletInvariants(TEST_BUYER_UID, TEST_CURRENCY);
        console.log("✅ Initial Invariants Passed");


        // ---------------------------------------------------------
        // Scenario 2: Structural Deposit (Direct DB Insert - Simulated)
        // ---------------------------------------------------------
        console.log("\n--- Scenario 2: Structural Deposit (Placeholder) ---");
        const depositAmount = 5000; // $50.00

        const depositEntry = new LedgerEntry({
            user_uid: TEST_BUYER_UID,
            role: "buyer",
            type: "wallet_credit_placeholder",
            amount: depositAmount,
            currency: TEST_CURRENCY,
            status: "available",
            description: "Test Deposit Step 23.1",
            externalId: uuidv4(),
            metadata: { test: true }
        });
        await depositEntry.save();
        console.log(`Simulated Deposit: +${depositAmount} cents`);

        const balanceAfterDeposit = await walletLedgerService.getBuyerBalance(TEST_BUYER_UID, TEST_CURRENCY);
        console.log(`Balance after deposit: ${balanceAfterDeposit}`);

        if (balanceAfterDeposit !== depositAmount) throw new Error(`Expected balance ${depositAmount}, got ${balanceAfterDeposit}`);
        await walletLedgerService.assertWalletInvariants(TEST_BUYER_UID, TEST_CURRENCY);
        console.log("✅ Deposit & Invariant Passed");


        // ---------------------------------------------------------
        // Scenario 3: Structural Debit (Direct DB Insert - Simulated)
        // ---------------------------------------------------------
        console.log("\n--- Scenario 3: Structural Debit (Placeholder) ---");
        const debitAmount = -2000; // -$20.00

        const debitEntry = new LedgerEntry({
            user_uid: TEST_BUYER_UID,
            role: "buyer",
            type: "wallet_debit_placeholder",
            amount: debitAmount,
            currency: TEST_CURRENCY,
            status: "available", // Must be 'available' to impact balance
            description: "Test Debit Step 23.1",
            externalId: uuidv4(),
            metadata: { test: true }
        });
        await debitEntry.save();
        console.log(`Simulated Debit: ${debitAmount} cents`);

        const balanceAfterDebit = await walletLedgerService.getBuyerBalance(TEST_BUYER_UID, TEST_CURRENCY);
        console.log(`Balance after debit: ${balanceAfterDebit}`);

        const expectedBalance = depositAmount + debitAmount; // 5000 - 2000 = 3000
        if (balanceAfterDebit !== expectedBalance) throw new Error(`Expected balance ${expectedBalance}, got ${balanceAfterDebit}`);
        await walletLedgerService.assertWalletInvariants(TEST_BUYER_UID, TEST_CURRENCY);
        console.log("✅ Debit & Invariant Passed");


        // ---------------------------------------------------------
        // Scenario 4: Invariant Violation Check (Negative Balance)
        // ---------------------------------------------------------
        console.log("\n--- Scenario 4: Negative Balance Invariant Violation ---");
        const excessiveDebitAmount = -10000; // -$100.00 (Exceeds remaining 3000)

        const violationEntry = new LedgerEntry({
            user_uid: TEST_BUYER_UID,
            role: "buyer",
            type: "wallet_debit_placeholder", // Using placeholder to sim bad state
            amount: excessiveDebitAmount,
            currency: TEST_CURRENCY,
            status: "available",
            description: "Invariant Violation Test",
            externalId: uuidv4(),
            metadata: { test: true }
        });
        await violationEntry.save();
        console.log(`Simulated Excessive Debit: ${excessiveDebitAmount} cents`);

        const badBalance = await walletLedgerService.getBuyerBalance(TEST_BUYER_UID, TEST_CURRENCY);
        console.log(`Current (Bad) Balance: ${badBalance}`);

        try {
            await walletLedgerService.assertWalletInvariants(TEST_BUYER_UID, TEST_CURRENCY);
            throw new Error("❌ assertWalletInvariants SHOULD have thrown an error but didn't!");
        } catch (error) {
            if (error.message.includes("negative balance")) {
                console.log(`✅ Invariant check correctly caught negative balance: "${error.message}"`);
            } else {
                throw error; // Unexpected error
            }
        }

        // Cleanup bad entry
        await LedgerEntry.findByIdAndDelete(violationEntry._id);
        console.log("Cleaned up violation entry");


        // ---------------------------------------------------------
        // Scenario 5: Isolation Verification (No Order Interaction)
        // ---------------------------------------------------------
        console.log("\n--- Scenario 5: Isolation Verification ---");
        // Verify we didn't touch unrelated collections (conceptual check)
        // Verify our test buyer has no interactions with random stuff
        // We already confirmed getBuyerBalance uses strict role="buyer" and allowed types.
        // Let's verify a random type doesn't count.

        const ignoredTypeEntry = new LedgerEntry({
            user_uid: TEST_BUYER_UID,
            role: "buyer", // Role is buyer
            type: "admin_correction_credit", // Valid Enum, but NOT in walletLedgerService.ALLOWED_TYPES
            amount: 99999,
            currency: TEST_CURRENCY,
            status: "available",
            description: "Ignored Type Test",
            externalId: uuidv4()
        });
        await ignoredTypeEntry.save();
        console.log("Simulated 'admin_correction_credit' entry (Should be ignored by getBuyerBalance)");

        const balanceAfterIgnored = await walletLedgerService.getBuyerBalance(TEST_BUYER_UID, TEST_CURRENCY);
        console.log(`Balance after ignored entry: ${balanceAfterIgnored}`);

        if (balanceAfterIgnored !== expectedBalance) throw new Error(`Balance changed! Expected ${expectedBalance}, got ${balanceAfterIgnored}`);
        console.log("✅ Isolation Verified (Balance ignored unrelated types)");

        // Cleanup
        await LedgerEntry.findByIdAndDelete(ignoredTypeEntry._id);


        console.log("\n>>> VERIFICATION COMPLETE: ALL SUCCESS <<<");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ VERIFICATION FAILED:", error);
        process.exit(1);
    }
}

runVerification();
