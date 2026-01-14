const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { Order } = require('../models/order');
const { LedgerEntry } = require('../models/ledgerEntry');
const { SellerProfile } = require('../models/sellerProfile');
const { User } = require('../models/user');
const escrowService = require('../services/payment/escrowService');
const { v4: uuidv4 } = require('uuid');

async function verifyRefundExecution() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        // 1. Setup Data
        const suffix = uuidv4().substring(0, 6);
        const sellerUid = `refund_seller_${suffix}`;
        const buyerUid = `refund_buyer_${suffix}`;

        // Create Seller User & Profile
        await new User({ uid: sellerUid, name: 'Refund Seller', email: `sell${suffix}@test.com`, roles: ['seller'] }).save();
        await new SellerProfile({ userId: new mongoose.Types.ObjectId(), externalId: uuidv4(), nickname: 'SellerRef', sellerLevel: 'TIER_C', riskStatus: 'ACTIVE' }).save(); // Minimal

        // Create Order (Held)
        const order = new Order({
            buyerId: buyerUid,
            sellerId: sellerUid,
            totalAmount: 100.00, // $100
            currency: 'USD',
            paymentMethod: 'stripe',
            status: 'completed',
            deliveryStatus: 'delivered',
            escrowStatus: 'held',
            paymentIntentId: `pi_test_${suffix}`,
            externalId: uuidv4(),
            orderItems: [{
                listingId: new mongoose.Types.ObjectId(),
                title: 'Item',
                platform: 'PC',
                region: 'Global',
                quantity: 1,
                expirationGroups: [],
                unitPrice: 100.00,
                totalPrice: 100.00
            }]
        });
        await order.save();
        console.log(`\n📄 Created Test Order: ${order._id} (Escrow: ${order.escrowStatus})`);

        // Create Initial Ledger Lock (Simulating Payment Success)
        await new LedgerEntry({
            user_uid: sellerUid,
            role: 'seller',
            type: 'escrow_lock',
            amount: 10000,
            currency: 'USD',
            status: 'locked',
            related_order_id: order._id,
            description: 'Initial Lock',
            externalId: uuidv4()
        }).save();
        console.log('🔒 Created Initial Escrow Lock Entry');

        // MOCK Stripe Adapter to avoid 404
        escrowService.stripeAdapter.refundPayment = async (piId, amount, reason) => {
            console.log(`[MockStripe] Refund called for ${piId}`);
            return {
                refundId: `re_mock_${uuidv4()}`,
                amountCents: 10000,
                currency: 'USD',
                reason: reason
            };
        };

        // 2. Execute Refund
        console.log('\n🚀 Executing Admin Refund...');
        const result = await escrowService.refundEscrow(order._id.toString(), 'admin_user', 'Verification Test');
        console.log('✅ Refund Result:', result);

        // 3. Verify State
        const updatedOrder = await Order.findById(order._id);
        console.log(`\n📄 Updated Order Escrow Status: ${updatedOrder.escrowStatus}`);
        console.log(`   Order Status: ${updatedOrder.status}`);

        const ledgerEntries = await LedgerEntry.find({ related_order_id: order._id }).sort({ createdAt: 1 });
        console.log('\n📚 Ledger Entries:');
        ledgerEntries.forEach(e => {
            console.log(`   [${e.type}] ${e.amount} (${e.status}) - ${e.description}`);
        });

    } catch (err) {
        console.error('❌ CHECK FAILED:', err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyRefundExecution();
