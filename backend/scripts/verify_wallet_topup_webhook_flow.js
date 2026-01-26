const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
console.log("DEBUG: process.env.MONGODB_URI =", process.env.MONGODB_URI);
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../models/user');
const { LedgerEntry } = require('../models/ledgerEntry');
const { PaymentOperation } = require('../models/paymentOperation');
const StripeAdapter = require('../services/payment/stripeAdapter');
const walletLedgerService = require('../services/payment/walletLedgerService');
const { configs } = require('../configs');

// Mock Stripe Adapter to avoid actual Stripe calls but allow internal processing
class MockStripeAdapter extends StripeAdapter {
    constructor() {
        super();
    }
    getStripe() {
        return {
            paymentIntents: {
                retrieve: async (id) => ({
                    id,
                    status: 'succeeded',
                    amount: 1000,
                    currency: 'usd',
                    metadata: {
                        type: 'wallet_topup',
                        buyerId: 'test_buyer_verify_webhook',
                        originalAmount: '1000'
                    }
                })
            }
        };
    }
}

async function runVerification() {
    console.log("🚀 Starting Wallet Topup Webhook Verification");

    // Connect to DB
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(configs.MONGO_URI);
    }

    const testBuyerId = `verify_webhook_${Date.now()}`;
    const paymentIntentId = `pi_verify_${Date.now()}`;
    const amountCents = 1000;

    try {
        // 1. Create Test User
        await User.create({
            uid: testBuyerId,
            email: `verify_${Date.now()}@example.com`,
            role: 'buyer',
            username: `verify_user_${Date.now()}`,
            name: 'Test Verify User'
        });
        console.log(`✅ Created test user: ${testBuyerId}`);

        // 2. Mock Payment Intent Succeeded Event
        // We use the real StripeAdapter logic but it will use our Mock's getStripe() if it calls it,
        // though handlePaymentIntentSucceeded passes the event object directly so getStripe might not be called in this path
        // unless it goes deep.

        // Wait, handlePaymentIntentSucceeded is in StripeAdapter. 
        // We need to instantiate the REAL StripeAdapter but we want it to function safely using our mock payload.
        // The method handlePaymentIntentSucceeded receives an EVENT object.

        const adapter = new StripeAdapter();

        const mockEvent = {
            id: `evt_${Date.now()}`,
            type: 'payment_intent.succeeded',
            data: {
                object: {
                    id: paymentIntentId,
                    amount: amountCents,
                    currency: 'usd',
                    status: 'succeeded',
                    metadata: {
                        type: 'wallet_topup', // STRICT CHECK
                        buyerId: testBuyerId,
                        originalAmount: amountCents.toString()
                    }
                }
            }
        };

        console.log("🔄 Triggering handlePaymentIntentSucceeded (1st time)...");
        await adapter.handlePaymentIntentSucceeded(mockEvent);

        // 3. Verify Ledger Entry Created
        const ledgerEntry = await LedgerEntry.findOne({
            related_payment_intent_id: paymentIntentId,
            type: 'wallet_credit_placeholder'
        });

        if (!ledgerEntry) {
            throw new Error("❌ Ledger entry not found!");
        }
        console.log("✅ Ledger entry created:", ledgerEntry._id);
        console.log(`   Amount: ${ledgerEntry.amount}, Type: ${ledgerEntry.type}`);

        if (ledgerEntry.amount !== 1000) throw new Error(`Expected amount 1000, got ${ledgerEntry.amount}`);
        if (ledgerEntry.user_uid !== testBuyerId) throw new Error(`Expected user ${testBuyerId}, got ${ledgerEntry.user_uid}`);

        // 4. Verify Wallet Balance
        const balance = await walletLedgerService.getBuyerBalance(testBuyerId, 'USD');
        console.log(`✅ Wallet Balance: ${balance} cents`);
        if (balance !== 1000) throw new Error(`Expected balance 1000, got ${balance}`);

        // 5. Test Idempotency (Call again)
        console.log("🔄 Triggering handlePaymentIntentSucceeded (2nd time - Idempotency Check)...");
        await adapter.handlePaymentIntentSucceeded(mockEvent);

        const entries = await LedgerEntry.find({
            related_payment_intent_id: paymentIntentId,
            type: 'wallet_credit_placeholder'
        });

        if (entries.length !== 1) {
            throw new Error(`❌ Idempotency failed! Found ${entries.length} entries.`);
        }
        console.log("✅ Idempotency verified: Only 1 ledger entry exists.");

        // 6. Verify No Double Credit
        const balance2 = await walletLedgerService.getBuyerBalance(testBuyerId, 'USD');
        console.log(`✅ Verified Balance unchanged: ${balance2} cents`);
        if (balance2 !== 1000) throw new Error(`Expected balance 1000 after 2nd call, got ${balance2}`);

        // 7. Verify NO Order Lookup (Implicit)
        // If the code tried to find orders, it might log "No orders found" or crash if dependencies missing.
        // Since we didn't create PaymentOperation, if it tried to find it via paymentIntentId, it would be null.
        // The code change we made returns EARLY if wallet_topup is detected, so it shouldn't look for PaymentOperation or Orders.

        console.log("\n✅ VERIFICATION SUCCESSFUL");

    } catch (error) {
        console.error("❌ VERIFICATION FAILED:", error);
        process.exit(1);
    } finally {
        // Cleanup
        await User.deleteOne({ uid: testBuyerId });
        await LedgerEntry.deleteMany({ user_uid: testBuyerId });
        console.log("🧹 Cleanup complete");
        try {
            await mongoose.connection.close();
        } catch (e) { }
    }
}

runVerification();
