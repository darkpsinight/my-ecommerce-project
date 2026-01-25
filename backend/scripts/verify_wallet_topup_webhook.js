const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { LedgerEntry } = require('../models/ledgerEntry');
const { Wallet } = require('../models/wallet');
const { User } = require('../models/user');
const StripeAdapter = require('../services/payment/stripeAdapter');
const walletLedgerService = require('../services/payment/walletLedgerService');
const { configs } = require('../configs');
const { PaymentOperation } = require('../models/paymentOperation');

// Mock Stripe Adapter to avoid real calls
const stripeAdapter = new StripeAdapter();

async function runVerification() {
    console.log("🚀 Starting Wallet Topup Webhook Verification...");

    // Connect to DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    try {
        // 1. Setup Test User
        const testUid = `test_user_webhook_${Date.now()}`;
        const user = await User.create({
            uid: testUid,
            email: `${testUid}@example.com`,
            username: testUid,
            name: 'Test User',
            role: 'buyer'
        });
        console.log(`👤 Created test user: ${testUid}`);

        // 2. Simulate Payment Intent & Operation (Prerequisite for Webhook)
        const paymentIntentId = `pi_test_webhook_${Date.now()}`;
        const amountCents = 5000; // $50.00
        const currency = 'USD';

        // We must create a PaymentOperation because the webhook checks for it!
        await PaymentOperation.create({
            stripeId: paymentIntentId,
            type: 'charge',
            amountCents,
            currency,
            userId: testUid,
            status: 'pending',
            description: 'Wallet topup verification',
            metadata: {
                buyerId: testUid,
                type: 'wallet_topup',
                originalAmount: amountCents.toString()
            }
        });
        console.log(`📝 Created mock PaymentOperation for ${paymentIntentId}`);

        // 3. Construct Mock Webhook Event
        const event = {
            id: `evt_test_${Date.now()}`,
            type: 'payment_intent.succeeded',
            data: {
                object: {
                    id: paymentIntentId,
                    amount: amountCents,
                    currency: currency.toLowerCase(),
                    status: 'succeeded',
                    metadata: {
                        buyerId: testUid,
                        type: 'wallet_topup',
                        originalAmount: amountCents.toString()
                    }
                }
            }
        };

        // 4. Trigger Webhook Handler directly
        // We bypass signature verification by calling handlePaymentIntentSucceeded directly
        // or by wrapping it in a mock object for processWebhookEvent if we want to test that level.
        // Let's call handlePaymentIntentSucceeded directly for precision.

        console.log("🔄 Triggering handlePaymentIntentSucceeded...");
        await stripeAdapter.handlePaymentIntentSucceeded(event);

        // 5. Verify Ledger Entry
        console.log("🔍 Verifying Ledger Entry...");
        const ledgerEntry = await LedgerEntry.findOne({
            related_payment_intent_id: paymentIntentId,
            type: 'wallet_credit_placeholder'
        });

        if (!ledgerEntry) throw new Error("❌ Ledger entry NOT found!");
        console.log("✅ Ledger entry found:", ledgerEntry._id);

        if (ledgerEntry.amount !== amountCents) throw new Error(`❌ Amount mismatch: ${ledgerEntry.amount} !== ${amountCents}`);
        if (ledgerEntry.user_uid !== testUid) throw new Error(`❌ User UID mismatch`);

        // 6. Verify Wallet Balance
        console.log("🔍 Verifying Wallet Balance...");
        const balance = await walletLedgerService.getBuyerBalance(testUid, currency);
        console.log(`💰 Current Balance: ${balance}`);

        if (balance !== amountCents) throw new Error(`❌ Balance mismatch: ${balance} !== ${amountCents}`);
        console.log("✅ Wallet balance correct!");

        // 7. Verify Idempotency (Call again)
        console.log("🔄 Triggering Webhook AGAIN (Idempotency Check)...");
        await stripeAdapter.handlePaymentIntentSucceeded(event);

        const count = await LedgerEntry.countDocuments({ related_payment_intent_id: paymentIntentId });
        if (count !== 1) throw new Error(`❌ Idempotency failed! Found ${count} entries.`);
        console.log("✅ Idempotency verified (still 1 entry)");

        // Cleanup
        await User.deleteOne({ uid: testUid });
        await PaymentOperation.deleteOne({ stripeId: paymentIntentId });
        await LedgerEntry.deleteMany({ user_uid: testUid });

        console.log("✅ TEST PASSED SUCCESSFULLY");

    } catch (error) {
        console.error("❌ TEST FAILED:", error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

runVerification();
