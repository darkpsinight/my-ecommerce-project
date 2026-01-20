
const mongoose = require('mongoose');
const { Payout } = require('../models/payout');
const { LedgerEntry } = require('../models/ledgerEntry');
const { Order } = require('../models/order');
const { listPayouts, getPayoutDetail } = require('../handlers/payoutReadHandler');
const { v4: uuidv4 } = require('uuid');

// Mock Fastify Reply
const mockReply = {
    send: (data) => console.log('RESPONSE:', JSON.stringify(data, null, 2)),
    code: (statusCode) => {
        console.log('STATUS:', statusCode);
        return mockReply;
    }
};

async function runTest() {
    console.log('--- STARTING ADMIN PAYOUT VISIBILITY TEST ---');

    // 1. Connect to DB (User must provide connection string if not local default)
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/codesale_test');

    // Clear test data
    await Payout.deleteMany({ adminId: 'TEST_ADMIN' });
    await LedgerEntry.deleteMany({ description: /TEST_PAYOUT/ });

    // 2. Seed Data
    const orderId = new mongoose.Types.ObjectId();
    const sellerId = 'seller_test_' + Date.now();
    const payoutId = 'po_test_' + Date.now();

    console.log('Seeding Payout:', payoutId);

    const payout = new Payout({
        payoutId,
        orderId,
        sellerId,
        adminId: 'TEST_ADMIN',
        amount: 1000,
        currency: 'USD',
        status: 'FAILED',
        failureReason: 'Simulated Stripe Error',
        createdAt: new Date()
    });
    await payout.save();

    console.log('Seeding Ledger Entries...');
    const l1 = new LedgerEntry({
        user_uid: sellerId,
        role: 'seller',
        type: 'payout_reservation',
        amount: 0,
        currency: 'USD',
        status: 'locked',
        related_order_id: orderId,
        description: 'TEST_PAYOUT Reservation',
        externalId: uuidv4()
    });
    const l2 = new LedgerEntry({
        user_uid: sellerId,
        role: 'seller',
        type: 'payout_reservation_release',
        amount: 0,
        currency: 'USD',
        status: 'settled',
        related_order_id: orderId,
        description: 'TEST_PAYOUT Release',
        externalId: uuidv4()
    });
    await l1.save();
    await l2.save();

    // 3. Test List API
    console.log('\n--- TESTING LIST API ---');
    await listPayouts({
        query: {
            status: 'FAILED',
            limit: 10
        }
    }, mockReply);

    // 4. Test Detail API
    console.log('\n--- TESTING DETAIL API ---');
    await getPayoutDetail({
        params: { payoutId }
    }, mockReply);

    console.log('\n--- CLEANUP ---');
    await Payout.deleteOne({ payoutId });
    await LedgerEntry.deleteOne({ _id: l1._id });
    await LedgerEntry.deleteOne({ _id: l2._id });

    await mongoose.disconnect();
    console.log('--- TEST COMPLETE ---');
}

runTest().catch(console.error);
