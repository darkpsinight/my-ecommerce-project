const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const { configs } = require("../configs");
const walletFundingService = require("../services/payment/walletFunding");
const walletLedgerService = require("../services/payment/walletLedgerService");
const stripeAdapter = require("../services/payment/stripeAdapter"); // Need adapter to fetch PI for replay
const { LedgerEntry } = require("../models/ledgerEntry");

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m"
};

const LOG_TAG = `${colors.blue}[VERIFY_STEP_23_2]${colors.reset}`;

async function runVerification() {
    console.log(`${LOG_TAG} Starting Verification...`);
    const buyerId = "test_buyer_step_23_2_" + Date.now();
    const currency = "USD";
    const fundingAmount = 1000; // $10.00

    try {
        // Connect to MongoDB
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(configs.MONGO_URI);
            console.log(`${LOG_TAG} Connected to MongoDB`);
        }

        const stripe = new (require("../services/payment/stripeAdapter"))().getStripe();


        // =================================================================
        // SCENARIO 1: Baseline Check (Initial Balance = 0)
        // =================================================================
        console.log(`\n${colors.cyan}--- SCENARIO 1: Initial Balance Check ---${colors.reset}`);

        const initialBalance = await walletLedgerService.getBuyerBalance(buyerId, currency);
        console.log(`${LOG_TAG} Initial Balance: ${initialBalance}`);

        if (initialBalance !== 0) {
            throw new Error(`FAILED: Expected initial balance 0, got ${initialBalance}`);
        }
        console.log(`${colors.green}PASS: Initial balance is 0${colors.reset}`);


        // =================================================================
        // SCENARIO 2: Successful Funding
        // =================================================================
        console.log(`\n${colors.cyan}--- SCENARIO 2: Successful Funding ($10.00) ---${colors.reset}`);

        const fundResult = await walletFundingService.fundWallet(buyerId, fundingAmount, currency);

        console.log(`${LOG_TAG} Fund Result:`, fundResult);

        if (!fundResult.success) throw new Error("FAILED: Funding returned success=false");
        if (fundResult.balance !== fundingAmount) throw new Error(`FAILED: Expected balance ${fundingAmount}, got ${fundResult.balance}`);

        // Use raw ledger check to ensure entry type is correct
        const entryCount = await LedgerEntry.countDocuments({
            user_uid: buyerId,
            type: "wallet_credit_placeholder",
            amount: fundingAmount
        });

        if (entryCount !== 1) throw new Error(`FAILED: Expected 1 ledger entry, found ${entryCount}`);

        console.log(`${colors.green}PASS: Funding successful, balance updated, ledger entry created${colors.reset}`);

        const paymentIntentId = fundResult.paymentIntentId;


        // =================================================================
        // SCENARIO 3: Idempotency Check (Replay Same PaymentIntent)
        // =================================================================
        console.log(`\n${colors.cyan}--- SCENARIO 3: Idempotency (Replay) ---${colors.reset}`);

        // Fetch the REAL PaymentIntent object to pass to processFundingSuccess
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        console.log(`${LOG_TAG} Replaying processFundingSuccess with PI: ${paymentIntentId}`);

        // Call Idempotency Boundary directly
        const replayResult = await walletFundingService.processFundingSuccess(paymentIntent);

        console.log(`${LOG_TAG} Replay Result:`, replayResult);

        if (!replayResult.success) throw new Error("FAILED: Replay returned success=false");
        if (!replayResult.alreadyProcessed) throw new Error("FAILED: Replay did not indicate 'alreadyProcessed'");
        if (replayResult.balance !== fundingAmount) throw new Error(`FAILED: Balance changed! Expected ${fundingAmount}, got ${replayResult.balance}`);

        // Double check ledger count
        const entryCountAfter = await LedgerEntry.countDocuments({
            user_uid: buyerId,
            type: "wallet_credit_placeholder"
        });

        if (entryCountAfter !== 1) throw new Error(`FAILED: Ledger entry duplicated! Count: ${entryCountAfter}`);

        console.log(`${colors.green}PASS: Idempotency enforced, no duplicate entry, balance stable${colors.reset}`);


        // =================================================================
        // SCENARIO 4: Invariant Verification
        // =================================================================
        console.log(`\n${colors.cyan}--- SCENARIO 4: Invariant Check ---${colors.reset}`);

        try {
            await walletLedgerService.assertWalletInvariants(buyerId, currency);
            console.log(`${colors.green}PASS: Wallet invariants verified${colors.reset}`);
        } catch (error) {
            throw new Error(`FAILED: Invariant check failed: ${error.message}`);
        }


        // =================================================================
        // SCENARIO 5: Isolation Check (Unrelated Ledger Entries)
        // =================================================================
        console.log(`\n${colors.cyan}--- SCENARIO 5: Isolation Check ---${colors.reset}`);

        // Manually insert an "Escrow" entry for this user to ensure it's ignored by wallet balance
        await LedgerEntry.create({
            user_uid: buyerId,
            role: "buyer",
            type: "escrow_lock", // NOT wallet_credit_placeholder
            amount: -500,
            currency: currency,
            status: "locked",
            related_payment_intent_id: "pi_fake_" + Date.now(),
            description: "Fake Escrow Lock"
        });

        const isolationBalance = await walletLedgerService.getBuyerBalance(buyerId, currency);
        console.log(`${LOG_TAG} Balance after adding unrelated escrow entry: ${isolationBalance}`);

        if (isolationBalance !== fundingAmount) {
            throw new Error(`FAILED: Balance affected by unrelated entry! Expected ${fundingAmount}, got ${isolationBalance}`);
        }

        console.log(`${colors.green}PASS: Isolation verified (Balance ignores escrow types)${colors.reset}`);

        console.log(`\n${colors.green}=== ALL VERIFICATION SCENARIOS PASSED ===${colors.reset}`);

    } catch (error) {
        console.error(`\n${colors.red}!!! VERIFICATION FAILED !!!${colors.reset}`);
        console.error(error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

runVerification();
