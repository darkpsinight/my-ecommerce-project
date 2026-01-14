const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { User } = require('../models/user');
const { SellerProfile } = require('../models/sellerProfile');
const { Order } = require('../models/order');
const { LedgerEntry } = require('../models/ledgerEntry');
const holdCalculator = require('../services/payment/holdCalculator');
const payoutEligibilityService = require('../services/payment/payoutEligibilityService');
const ledgerService = require('../services/payment/ledgerService');
const { v4: uuidv4 } = require('uuid');

async function testPayoutEligibility() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        // Note: Using the actual DB connection string from env
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        // 1. Setup Test Data
        const testSuffix = uuidv4().substring(0, 8);
        const sellerUid = `test_seller_${testSuffix}`;

        console.log(`Creating test seller: ${sellerUid}`);
        const sellerProfile = new SellerProfile({
            userId: new mongoose.Types.ObjectId(), // Fake User ObjectId
            nickname: `TestSeller_${testSuffix}`,
            externalId: uuidv4(),
            sellerLevel: 'TIER_C', // Start with New Seller
            riskStatus: 'ACTIVE'
        });
        // We need a User doc to satisfy schema reference if we were saving User, 
        // but SellerProfile refs User. Let's make a fake User if needed or just ObjectId.
        // Wait, SellerProfile requires userId.
        const user = new User({
            uid: sellerUid,
            name: `Test User ${testSuffix}`,
            email: `test_${testSuffix}@example.com`,
            roles: ['seller']
        });
        await user.save();
        sellerProfile.userId = user._id; // Link
        await sellerProfile.save();

        // 2. Test Hold Calculation (Tier C)
        console.log('\n🧪 Test 1: Hold Calculation (Tier C)');
        const orderC = new Order({
            buyerId: 'buyer123',
            sellerId: sellerUid,
            totalAmount: 50.00,
            currency: 'USD',
            paymentMethod: 'stripe',
            status: 'completed',
            deliveryStatus: 'delivered',
            deliveredAt: new Date(), // NOW
            processedAt: new Date(), // NOW
            externalId: uuidv4(),
            orderItems: [{
                listingId: new mongoose.Types.ObjectId(),
                title: 'Item',
                platform: 'PC',
                region: 'Global',
                quantity: 1,
                expirationGroups: [],
                unitPrice: 50.00,
                totalPrice: 50.00
            }]
        });

        const releaseDateC = holdCalculator.calculateHoldReleaseDate(orderC, sellerProfile);
        const daysDiff = (releaseDateC - new Date()) / (1000 * 60 * 60 * 24);
        console.log(`Tier C Release Delay: ${daysDiff.toFixed(2)} days (Exp: 14)`);

        if (Math.abs(daysDiff - 14) > 0.1) throw new Error('Tier C calculation failed');

        // 3. Test High Value Override
        console.log('\n🧪 Test 2: High Value Override');
        orderC.totalAmount = 600.00; // > $500
        const releaseDateHigh = holdCalculator.calculateHoldReleaseDate(orderC, sellerProfile);
        const daysDiffHigh = (releaseDateHigh - new Date()) / (1000 * 60 * 60 * 24);
        console.log(`High Value Release Delay: ${daysDiffHigh.toFixed(2)} days (Exp: 14, wait. Tier C is 14. High Value is 7. Max(14, 7) = 14)`);
        // Wait, High Value Override logic:
        // Tier C (14) vs High Value (7). Max is 14.
        // Should trigger if Tier A (1 day) vs High Value (7).

        sellerProfile.sellerLevel = 'TIER_A'; // Trusted
        const releaseDateAHigh = holdCalculator.calculateHoldReleaseDate(orderC, sellerProfile); // amount 600
        const daysDiffAHigh = (releaseDateAHigh - new Date()) / (1000 * 60 * 60 * 24);
        console.log(`Tier A + High Value: ${daysDiffAHigh.toFixed(2)} days (Exp: 7)`);
        if (Math.abs(daysDiffAHigh - 7) > 0.1) throw new Error('High Value Override failed');

        // 4. Test Eligibility Gate (Suspended)
        console.log('\n🧪 Test 3: Eligibility Gate (Suspended)');
        sellerProfile.riskStatus = 'SUSPENDED';
        orderC.releaseExpectedAt = new Date(Date.now() - 10000); // Past

        const check = payoutEligibilityService.checkEligibility(orderC, sellerProfile);
        console.log(`Suspended Check: ${JSON.stringify(check)}`);
        if (check.isEligible) throw new Error('Gate failed to block Suspended seller');
        if (check.status !== 'MATURE_HELD') throw new Error('Wrong status for Suspended seller');

        // 5. Test Ledger Release
        console.log('\n🧪 Test 4: Ledger Release');
        sellerProfile.riskStatus = 'ACTIVE';
        orderC._id = new mongoose.Types.ObjectId(); // Ensure ID
        orderC.externalId = uuidv4();
        // Mock Locked Balance
        // We don't strictly need existing balance to debit (ledger allows negative), but let's assume valid flow.
        const releaseResult = await ledgerService.releaseFunds(orderC, 60000); // 60000 cents
        console.log('Release Result:', releaseResult.success ? 'Success' : 'Failed');

        if (!releaseResult.success) throw new Error('Fast release failed');

        // Verify Entries
        console.log('Verifying entries...');
        const entries = await LedgerEntry.find({ related_order_id: orderC._id });
        console.log(`Found ${entries.length} entries.`);
        const debit = entries.find(e => e.type === 'escrow_release_debit');
        const credit = entries.find(e => e.type === 'escrow_release_credit');

        if (!debit || debit.amount !== -60000 || debit.status !== 'locked') throw new Error('Debit entry incorrect');
        if (!credit || credit.amount !== 60000 || credit.status !== 'available') throw new Error('Credit entry incorrect');

        // 6. Test Idempotency
        console.log('\n🧪 Test 5: Idempotency');
        const result2 = await ledgerService.releaseFunds(orderC, 60000);
        console.log('Second Release Result:', result2);
        if (!result2.skipped) throw new Error('Idempotency check failed');

        console.log('\n✅ ALL TESTS PASSED');

    } catch (err) {
        console.error('❌ TEST FAILED:', err);
    } finally {
        await mongoose.disconnect();
    }
}

testPayoutEligibility();
