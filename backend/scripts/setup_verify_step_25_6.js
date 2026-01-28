const mongoose = require('mongoose');
const { Order } = require('../models/order');
const { Dispute } = require('../models/dispute');
const { StripeAccount } = require('../models/stripeAccount');
const { User } = require('../models/user');
const { SellerProfile } = require('../models/sellerProfile');
const { LedgerEntry } = require('../models/ledgerEntry');

// Load env
const path = require('path');
const fs = require('fs');

async function setup() {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });

    // Check MONGO_URI
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/codesale";
    await mongoose.connect(uri);
    console.log("Connected to MongoDB:", uri);
}

async function createPendingMaturityDispute() {
    await setup();

    try {
        // 1. Find or Create Seller
        // We need a seller with a linked Stripe account
        let seller = await User.findOne({ email: 'seller_verify@example.com' });
        if (!seller) {
            seller = await User.create({
                uid: 'seller_verify_' + Date.now(),
                name: 'Seller Verify', // REQUIRED field
                email: 'seller_verify@example.com',
                role: 'seller'
            });
            console.log("Created Mock Seller:", seller.uid);
        }

        let stripeAccount = await StripeAccount.findOne({ sellerId: seller.uid });
        if (!stripeAccount) {
            stripeAccount = await StripeAccount.create({
                sellerId: seller.uid,
                stripeAccountId: 'acct_MOCK_VERIFY_' + Date.now(),
                chargesEnabled: true,
                payoutsEnabled: true,
                detailsSubmitted: true,
                country: 'US' // REQUIRED field
            });
            console.log("Created Mock Stripe Account:", stripeAccount.stripeAccountId);
        }

        // Ledger check - Ensure seller has some balance to avoid "INSUFFICIENT_FUNDS" during Payout Preparation
        // PayoutService Phase 1 checks available balance.
        // We need to inject funds into Ledger for this user.
        await LedgerEntry.create({
            user_uid: seller.uid,
            role: 'seller',
            type: 'escrow_release_credit', // Valid bucket for available balance
            amount: 50000, // $500.00
            currency: 'USD',
            status: 'available',
            description: 'Seed for testing',
            externalId: 'seed_' + Date.now()
        });
        console.log("Seeded Ledger for Seller");

        // 2. Create Order in PENDING_MATURITY state
        const orderId = new mongoose.Types.ObjectId();
        const order = await Order.create({
            _id: orderId,
            externalId: 'ord_verify_' + Date.now(),
            sellerId: seller.uid,
            buyerId: 'buyer_verify_uid',
            totalAmount: 100.00,
            currency: 'USD',
            status: 'completed', // Valid status (e.g. paid/delivered)
            deliveryStatus: 'delivered',
            paymentStatus: 'paid',
            escrowStatus: 'held', // HELD for Dispute
            eligibilityStatus: 'PENDING_MATURITY', // THE KEY TEST CONDITION
            paymentIntentId: 'pi_mock_verify_' + Date.now(),
            paymentMethod: 'stripe',
            createdAt: new Date(),
            orderItems: [{
                listingId: new mongoose.Types.ObjectId(), // Mock Listing ID
                title: 'Test Item',
                platform: 'Steam',
                region: 'Global',
                quantity: 1,
                expirationGroups: [],
                unitPrice: 100.00,
                totalPrice: 100.00,
                purchasedCodes: [{
                    codeId: 'code_' + Date.now(),
                    code: 'MOCK_CODE',
                    iv: 'MOCK_IV'
                }]
            }]
        });
        console.log(`Created Order ${order.externalId} [${order.eligibilityStatus}]`);

        // 3. Create Dispute
        const dispute = await Dispute.create({
            disputeId: 'dp_verify_' + Date.now(),
            stripeDisputeId: 'dp_stripe_' + Date.now(), // REQUIRED
            orderId: order._id,
            paymentIntentId: order.paymentIntentId, // Likely required or useful
            reason: 'item_not_received', // arbitrary
            status: 'OPEN',
            amount: 10000, // 100.00 USD cents
            currency: 'USD',
            sellerId: seller.uid, // REQUIRED
            buyerId: order.buyerId // REQUIRED
        });
        console.log(`Created Dispute ${dispute.disputeId}`);

        console.log("\n--- TEST DATA READY ---");
        console.log(`Dispute ID: ${dispute.disputeId}`);
        console.log(`Order ID:   ${order.externalId}`);
        console.log(`Seller UID: ${seller.uid}`);
        console.log(`\nRun this command to verify (replace TOKEN):`);
        console.log(`curl -X POST http://localhost:3001/api/v1/admin/disputes/${dispute.disputeId}/release \\
  -H "Authorization: Bearer <ADMIN_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{ "justification": "Manual Verification Release" }'`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

createPendingMaturityDispute();
