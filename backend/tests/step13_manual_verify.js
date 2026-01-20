
const mongoose = require('mongoose');
const { Payout } = require('../models/payout');
const SellerFinancialService = require('../services/SellerFinancialService');
const { v4: uuidv4 } = require('uuid');

async function runTest() {
    console.log('--- STARTING SELLER PAYOUT VISIBILITY TEST (STEP 13) ---');

    // 1. Connect to DB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/codesale_test');

    // 2. Setup Data
    const sellerA = 'uid_seller_A_' + Date.now();
    const sellerB = 'uid_seller_B_' + Date.now();

    // Payout A (Completed)
    const payoutA = new Payout({
        payoutId: 'po_A_' + Date.now(),
        orderId: new mongoose.Types.ObjectId(), // Fake ID
        sellerId: sellerA,
        adminId: 'TEST_ADMIN', // Should be hidden
        amount: 5000,
        currency: 'USD',
        status: 'COMPLETED',
        stripeTransferId: 'tr_fake_123',
        createdAt: new Date(),
        updatedAt: new Date()
    });

    // Payout B (Failed)
    const payoutB = new Payout({
        payoutId: 'po_B_' + Date.now(),
        orderId: new mongoose.Types.ObjectId(), // Fake ID
        sellerId: sellerB,
        adminId: 'TEST_ADMIN', // Should be hidden
        amount: 2500,
        currency: 'EUR',
        status: 'FAILED',
        failureReason: 'Account restricted', // Should be shown
        createdAt: new Date(),
        updatedAt: new Date()
    });

    await payoutA.save();
    await payoutB.save();
    console.log('Seeded Payouts:', payoutA.payoutId, payoutB.payoutId);

    try {
        // 3. Test List (Seller A)
        console.log('\n--- TESTING LIST (Seller A) ---');
        const listA = await SellerFinancialService.getPayouts(sellerA, { limit: 10 });
        console.log('Count:', listA.data.length);
        if (listA.data.length !== 1) throw new Error('Seller A should see exactly 1 payout');
        if (listA.data[0].payoutId !== payoutA.payoutId) throw new Error('Seller A seeing wrong payout');
        if (listA.data[0].adminId) throw new Error('Admin ID leaked in list!');
        console.log('Only Seller A payout visible. fields:', Object.keys(listA.data[0]));

        // 4. Test List (Seller B)
        console.log('\n--- TESTING LIST (Seller B) ---');
        const listB = await SellerFinancialService.getPayouts(sellerB, { limit: 10 });
        if (listB.data[0].payoutId !== payoutB.payoutId) throw new Error('Seller B seeing wrong payout');
        console.log('Seller B sees own payout.');

        // 5. Test Detail (Seller A -> Own)
        console.log('\n--- TESTING DETAIL (Seller A -> Own) ---');
        const detailA = await SellerFinancialService.getPayoutDetail(sellerA, payoutA.payoutId);
        if (!detailA) throw new Error('Detail should be found');
        if (detailA.stripeTransferId !== 'tr_fake_123') throw new Error('Stripe ID missing');
        if (detailA.adminId) throw new Error('Admin ID leaked in detail!');
        console.log('Detail A retrieved successfully.');

        // 6. Test Detail (Seller A -> Other)
        console.log('\n--- TESTING DETAIL (Seller A -> Other) ---');
        const detailOther = await SellerFinancialService.getPayoutDetail(sellerA, payoutB.payoutId);
        if (detailOther !== null) throw new Error('Security Breach: Seller A saw Seller B payout!');
        console.log('Access blocked correctly (returned null).');

        // 7. Test Detail (Seller B -> Own Failed)
        console.log('\n--- TESTING DETAIL (Seller B -> Own Failed) ---');
        const detailB = await SellerFinancialService.getPayoutDetail(sellerB, payoutB.payoutId);
        if (!detailB) throw new Error('Detail B not found');
        if (detailB.failureReason !== 'Account restricted') throw new Error('Failure reason missing');
        console.log('Failure reason visible.');

    } catch (err) {
        console.error('TEST FAILED:', err);
    } finally {
        // Cleanup
        console.log('\n--- CLEANUP ---');
        await Payout.deleteMany({ payoutId: { $in: [payoutA.payoutId, payoutB.payoutId] } });
        await mongoose.disconnect();
    }
}

runTest();
