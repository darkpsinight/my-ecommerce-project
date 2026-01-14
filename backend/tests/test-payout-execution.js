const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { User } = require('../models/user');
const { SellerProfile } = require('../models/sellerProfile');
const { Order } = require('../models/order');
const { LedgerEntry } = require('../models/ledgerEntry');
const { Payout } = require('../models/payout');
const { StripeAccount } = require('../models/stripeAccount');
const payoutService = require('../services/payment/payoutService');
const payoutReconciliationService = require('../services/payment/payoutReconciliationService');
const { v4: uuidv4 } = require('uuid');

async function testPayoutExecution() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        // 1. Setup Test Seller & Order
        const testSuffix = uuidv4().substring(0, 8);
        const sellerId = `seller_${testSuffix}`;

        // Mock Stripe Account
        const stripeAccount = new StripeAccount({
            sellerId: sellerId,
            stripeAccountId: 'acct_TEST_' + testSuffix,
            chargesEnabled: true,
            payoutsEnabled: true,
            detailsSubmitted: true,
            status: 'verified', // Required
            currentlyDue: [],
            pastDue: [],
            country: 'US' // Required field
        });
        await stripeAccount.save();

        const order = new Order({
            buyerId: 'buyer123',
            sellerId: sellerId,
            totalAmount: 100.00, // $100
            currency: 'USD',
            paymentMethod: 'stripe',
            status: 'completed',
            deliveryStatus: 'delivered',
            eligibilityStatus: 'ELIGIBLE_FOR_PAYOUT', // PRE-REQ
            externalId: uuidv4(),
            orderItems: []
        });
        await order.save();

        // 2. Fund the Seller (Mock Release)
        // We need existing "Available" balance >= 10000 cents.
        const fundEntry = new LedgerEntry({
            user_uid: sellerId,
            role: "seller",
            type: "escrow_release_credit",
            amount: 10000,
            currency: "USD",
            status: "available",
            related_order_id: order._id,
            description: "Test Funding",
            externalId: uuidv4()
        });
        await fundEntry.save();

        // 3. Test: Safe Payout Success
        console.log('\n🧪 Test 1: Safe Payout (Success Flow)');
        // Mock Stripe Adapter methods? PayoutService uses stripeAdapter instance.
        // We need to Mock the adapter inside PayoutService or trust it fails if real creds missing?
        // With real creds it will fail "No such account".
        // Use Mocking for Stripe Call.

        payoutService.stripeAdapter.createTransferToSeller = async (escrowId, amount, sellerId, acctId, meta) => {
            console.log('   [MockStripe] Transfer created:', amount);
            return { transferId: 'tr_mock_' + uuidv4() };
        };

        const payout = await payoutService.processOrderPayout(order._id, 'admin123');
        console.log('Payout Status:', payout.status);

        if (payout.status !== 'COMPLETED') throw new Error('Payout should be COMPLETED');
        if (!payout.reservedAt) throw new Error('reservedAt missing');
        if (!payout.ledgerReservationId) throw new Error('ledgerReservationId missing');

        // Check Ledger: Should have Reservation (Debit)
        const entries = await LedgerEntry.find({ related_order_id: order._id });
        const reservation = entries.find(e => e.type === 'payout_reservation');
        if (!reservation || reservation.amount !== -10000) throw new Error('Reservation Debit missing or wrong amount');

        // 4. Test: Insufficient Funds
        console.log('\n🧪 Test 2: Insufficient Funds');
        // Try another payout for same order (should be blocked by idempotency first, but different order needed for funds check?)
        // Let's create new order.
        const order2 = new Order({
            sellerId: sellerId,
            buyerId: 'buyer456',
            totalAmount: 50.00,
            paymentMethod: 'stripe',
            currency: 'USD',
            status: 'completed',
            deliveryStatus: 'delivered',
            eligibilityStatus: 'ELIGIBLE_FOR_PAYOUT',
            externalId: uuidv4()
        });
        await order2.save();

        // Balance is now 0 (10000 credit - 10000 reservation).
        try {
            await payoutService.processOrderPayout(order2._id, 'admin123');
            throw new Error('Should have failed with Insufficient Funds');
        } catch (err) {
            console.log('Caught Expected Error:', err.code || err.message);
            if (err.code !== 'INSUFFICIENT_FUNDS') throw new Error(`Wrong error code: ${err.code}`);
        }

        // 5. Test: Stripe Failure & Rollback
        console.log('\n🧪 Test 3: Stripe Failure & Rollback');
        // Fund again
        const fundEntry2 = new LedgerEntry({
            user_uid: sellerId,
            role: "seller",
            type: "escrow_release_credit",
            amount: 5000, // $50
            currency: "USD",
            status: "available",
            related_order_id: order2._id,
            description: "Test Funding 2",
            externalId: uuidv4()
        });
        await fundEntry2.save();

        // Mock Stripe Failure
        payoutService.stripeAdapter.createTransferToSeller = async () => {
            throw new Error('Stripe API Error: Account Invalid');
        };

        try {
            await payoutService.processOrderPayout(order2._id, 'admin123');
        } catch (err) {
            console.log('Caught Mock Stripe Error:', err.message);
        }

        // Check Payout Status: FAILED
        const payoutFail = await Payout.findOne({ orderId: order2._id });
        if (payoutFail.status !== 'FAILED') throw new Error('Payout should be FAILED');

        // Check Ledger: Reservation AND Reversal
        const entries2 = await LedgerEntry.find({ related_order_id: order2._id });
        const res = entries2.find(e => e.type === 'payout_reservation');
        const rev = entries2.find(e => e.type === 'payout_fail_reversal');

        if (!res) throw new Error('Reservation missing');
        if (!rev) throw new Error('Reversal missing');
        if (res.amount + rev.amount !== 0) throw new Error('Amounts do not offset');

        // 6. Test: Reconciliation Stuck Payout
        console.log('\n🧪 Test 4: Reconciliation');
        // Create a stuck payout manually
        const order3 = new Order({
            sellerId: sellerId,
            buyerId: 'buyer789',
            totalAmount: 20.00,
            paymentMethod: 'stripe',
            currency: 'USD',
            status: 'completed',
            deliveryStatus: 'delivered',
            eligibilityStatus: 'ELIGIBLE_FOR_PAYOUT',
            externalId: uuidv4()
        });
        await order3.save();

        const stuckPayout = new Payout({
            adminId: 'admin123',
            sellerId: sellerId,
            amount: 2000,
            currency: 'USD',
            orderId: order3._id,
            status: 'PROCESSING',
            payoutId: 'payout_stuck_' + testSuffix,
            processingAt: new Date(Date.now() - 10 * 60 * 1000) // 10 mins ago
        });
        await stuckPayout.save();

        // Mock Stripe Adapter List
        payoutReconciliationService.stripeAdapter = { // Overwrite implicit adapter in service? No, it requires one.
            // We need to inject mock into reconciler. 
            // It imports new StripeAdapter. Hard to mock unless we mock the file or property.
            // PayoutReconciliationService imports stripeAdapter instance? No: `const stripeAdapter = new (require("./stripeAdapter"))();`
        };
        // Hack: The service uses internal `stripeAdapter`. 
        // Let's modify the service to expose it or reload it?
        // Or assume we can't test Reconciler mock easily without DI.
        // Let's assume fail path (Transfer not found).

        // Mocking listTransfers via prototype if convenient?
        const StripeAdapter = require('../services/payment/stripeAdapter');
        const origList = StripeAdapter.prototype.listTransfers;
        StripeAdapter.prototype.listTransfers = async () => { return { data: [] }; }; // No match

        const results = await payoutReconciliationService.reconcileStuckPayouts();
        console.log('Reconcile Results:', results);

        const finalStuck = await Payout.findById(stuckPayout._id);
        console.log('Final Stuck Status:', finalStuck.status);
        if (finalStuck.status !== 'FAILED') throw new Error('Should have failed and rolled back');

        StripeAdapter.prototype.listTransfers = origList; // Restore

        console.log('\n✅ ALL PAYOUT TESTS PASSED');

    } catch (err) {
        console.error('❌ TEST FAILED:', err);
    } finally {
        await mongoose.disconnect();
    }
}

testPayoutExecution();
