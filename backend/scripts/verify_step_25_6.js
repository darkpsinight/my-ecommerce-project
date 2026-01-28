const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { configs } = require('../configs');
const { Order } = require('../models/order');
const { Dispute } = require('../models/dispute');
const { User } = require('../models/user');
const { LedgerEntry } = require('../models/ledgerEntry');
const { AuditLog } = require('../models/auditLog');
const escrowService = require('../services/payment/escrowService');
const walletLedgerService = require('../services/payment/walletLedgerService');
const { v4: uuidv4 } = require('uuid');

async function verifyStep25_6() {
    console.log('--- STARTING VERIFICATION Step 25.6 ---');

    // Connect to DB
    await mongoose.connect(configs.MONGO_URI);
    console.log('Connected to DB');

    let session = null;
    try {
        // Setup Test Data
        const buyerUid = `verify_buy_${uuidv4()}`;
        const sellerUid = `verify_sell_${uuidv4()}`;
        const adminUid = `verify_admin_${uuidv4()}`;

        // Create Order
        const order = await Order.create({
            buyerId: buyerUid,
            sellerId: sellerUid,
            totalAmount: 5000, // $50.00
            currency: 'USD',
            status: 'processing', // Valid enum value
            paymentMethod: 'stripe',
            escrowStatus: 'held',
            paymentIntentId: `pi_test_${uuidv4()}`,
            externalId: uuidv4(),
            items: []
        });
        console.log('Created Order:', order.externalId);

        // Create Dispute
        const dispute = await Dispute.create({
            disputeId: uuidv4(),
            externalId: uuidv4(),
            stripeDisputeId: `dp_test_${uuidv4()}`,
            paymentIntentId: order.paymentIntentId,
            orderId: order._id,
            sellerId: sellerUid,
            buyerId: buyerUid,
            amount: 5000,
            currency: 'USD',
            status: 'OPEN',
            reason: 'fraudulent'
        });
        console.log('Created Dispute:', dispute.disputeId);

        // --- TEST 1: REFUND TO WALLET ---
        console.log('\n--- TEST 1: Refund to Wallet ---');

        const initialBalance = await walletLedgerService.getBuyerBalance(buyerUid, 'USD');
        console.log('Initial Buyer Balance:', initialBalance); // Should be 0

        const refundResult = await escrowService.refundToWallet(order.externalId, adminUid, 'Verification Refund');

        console.log('Refund Result:', refundResult);

        // Assertions
        if (!refundResult.success) throw new Error('Refund failed');
        if (refundResult.newStatus !== 'refunded') throw new Error('Order status not updated');
        if (refundResult.disputeStatus !== 'CLOSED') throw new Error('Dispute status not updated');

        // Check Ledger
        const ledgerEntry = await LedgerEntry.findOne({ externalId: refundResult.ledgerEntryId });
        if (!ledgerEntry) throw new Error('Ledger entry not found');
        if (ledgerEntry.type !== 'wallet_credit_refund') throw new Error(`Invalid ledger type: ${ledgerEntry.type}`);
        if (ledgerEntry.amount !== 5000) throw new Error('Invalid ledger amount');
        console.log('Ledger Entry Verified:', ledgerEntry.type, ledgerEntry.amount);

        // Check Balance
        const newBalance = await walletLedgerService.getBuyerBalance(buyerUid, 'USD');
        console.log('New Buyer Balance:', newBalance);
        if (newBalance !== initialBalance + 5000) throw new Error('Balance update incorrect');

        const updatedDispute = await Dispute.findById(dispute._id);
        console.log('Updated Dispute Status:', updatedDispute.status);
        console.log('Updated Dispute Metadata:', updatedDispute.metadata);

        if (updatedDispute.status !== 'CLOSED') throw new Error('Dispute status mismatch in DB');
        if (updatedDispute.metadata.resolution !== 'REFUND_TO_WALLET') throw new Error('Resolution metadata mismatch');

        // --- TEST 2: IDEMPOTENCY / DOUBLE ACTION ---
        console.log('\n--- TEST 2: Idempotency / Double Action ---');
        try {
            await escrowService.refundToWallet(order.externalId, adminUid, 'Retry');
            throw new Error('Should have failed on second refund attempt');
        } catch (err) {
            console.log('Caught expected error:', err.message);
            if (!err.message.includes('not in held status')) throw new Error('Unexpected error message: ' + err.message);
        }

        console.log('\n--- VERIFICATION SUCCESSFUL ---');

    } catch (error) {
        console.error('VERIFICATION FAILED:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

verifyStep25_6();
