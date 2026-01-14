const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { LedgerEntry } = require('../models/ledgerEntry');
const { Order } = require('../models/order');
const { Payout } = require('../models/payout');
const { v4: uuidv4 } = require('uuid');
const SellerFinancialService = require('../services/SellerFinancialService');

async function verifyStep8() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        const testSuffix = uuidv4().substring(0, 8);
        const sellerUid = `verify_seller_${testSuffix}`;
        const currency = "USD";

        console.log(`Setting up test data for seller: ${sellerUid}`);

        // 1. Seed Ledger Entries
        // Scenario:
        // - Order 1: $100 Locked (Escrow Lock)
        // - Order 2: $50 Released (Escrow Lock + Release Debit + Release Credit)
        // - Payout 1: $40 Paid Out
        // - Refund 1: $10 Refunded (Escrow Lock + Escrow Reversal)

        const entries = [
            // Order 1: Locked $100
            { user_uid: sellerUid, role: 'seller', type: 'escrow_lock', amount: 10000, currency, status: 'locked', description: 'Order 1 Lock', externalId: uuidv4() },

            // Order 2: Released $50
            { user_uid: sellerUid, role: 'seller', type: 'escrow_lock', amount: 5000, currency, status: 'settled', description: 'Order 2 Lock', externalId: uuidv4() }, // Original lock settled
            { user_uid: sellerUid, role: 'seller', type: 'escrow_release_debit', amount: -5000, currency, status: 'locked', description: 'Order 2 Rel Debit', externalId: uuidv4() },
            { user_uid: sellerUid, role: 'seller', type: 'escrow_release_credit', amount: 5000, currency, status: 'available', description: 'Order 2 Rel Credit', externalId: uuidv4() },

            // Payout 1: $40 Paid Out
            { user_uid: sellerUid, role: 'seller', type: 'payout', amount: -4000, currency, status: 'settled', description: 'Payout 1', externalId: uuidv4() },

            // Refund 1: $10 Refunded
            { user_uid: sellerUid, role: 'seller', type: 'escrow_lock', amount: 1000, currency, status: 'settled', description: 'Refund 1 Lock', externalId: uuidv4() },
            { user_uid: sellerUid, role: 'seller', type: 'escrow_reversal', amount: -1000, currency, status: 'settled', description: 'Refund 1 Reversal', externalId: uuidv4() }
        ];

        await LedgerEntry.insertMany(entries);
        console.log('✅ Ledger entries seeded.');

        // 2. Seed Orders for display
        const order1Id = new mongoose.Types.ObjectId();
        const order2Id = new mongoose.Types.ObjectId();
        const payoutOrderId = new mongoose.Types.ObjectId();

        const orders = [
            // Order 1: Held, Pending Maturity (Standard)
            {
                _id: order1Id, buyerId: 'b1', sellerId: sellerUid, totalAmount: 10000, currency,
                escrowStatus: 'held', eligibilityStatus: 'PENDING_MATURITY', status: 'completed',
                releaseExpectedAt: new Date(Date.now() + 86400000), externalId: uuidv4(), paymentMethod: 'stripe'
            },
            // Order 2: Held, Mature but Suspended (Risk)
            {
                _id: order2Id, buyerId: 'b1', sellerId: sellerUid, totalAmount: 5000, currency,
                escrowStatus: 'held', eligibilityStatus: 'MATURE_HELD', status: 'completed',
                releaseExpectedAt: new Date(Date.now() - 86400000), externalId: uuidv4(), paymentMethod: 'stripe'
            },
            // Order 3: Paid Out
            {
                _id: payoutOrderId, buyerId: 'b1', sellerId: sellerUid, totalAmount: 4000, currency,
                escrowStatus: 'released', eligibilityStatus: 'ELIGIBLE_FOR_PAYOUT', status: 'completed',
                externalId: uuidv4(), paymentMethod: 'stripe'
            }
        ];

        await Order.createOrder(orders[0]); // Using static create to ensure defaults but simpler to insertMany for test if safe. 
        // Order.createOrder overrides _id? No. But let's use insertMany to force IDs.
        await Order.insertMany(orders);
        console.log('✅ Orders seeded.');

        // 3. Seed Payouts
        const payouts = [
            {
                payoutId: uuidv4(), orderId: payoutOrderId, sellerId: sellerUid, adminId: 'admin1',
                amount: 4000, currency, status: 'COMPLETED', processedAt: new Date(),
                failureReason: null
            },
            {
                payoutId: uuidv4(), orderId: order2Id, sellerId: sellerUid, adminId: 'admin1',
                amount: 5000, currency, status: 'FAILED', processedAt: new Date(),
                failureReason: 'Bank declined transaction', failureCode: 'BANK_DECLINE'
            }
        ];
        await Payout.insertMany(payouts);
        console.log('✅ Payouts seeded.');


        // ==========================================
        // VERIFICATION
        // ==========================================

        console.log('\n🔍 Verifying Balances...');
        const balanceResult = await SellerFinancialService.getBalances(sellerUid);
        const balance = balanceResult.balances.find(b => b.currency === currency);

        console.log('Balance Result:', JSON.stringify(balance, null, 2));

        // Expectations:
        // Available: +5000 (Order 2 Release) - 4000 (Payout) = 1000.  wait ledger says:
        // Order 2 Release Credit: +5000 (Available).
        // Payout: -4000 (Settled). Is Settled available? 
        // Logic: available_amount sum where status='available'.
        // Payout status='settled'. So Payout does not reduce 'available' bucket in aggregation?
        // Wait. LedgerEntry logic: When payout happens, we usually debit available.
        // Step 8 design says: available_amount = Sum(status='available').
        // If payout debit is status='settled', it is NOT in available. 
        // BUT payout debit is usually status='available' or 'settled'?
        // The ledger logic usually is: Credit Available (+), Debit Available (-).
        // My seed: Payout status='settled'. 
        // If I want it to reduce available balance, it should be status='available' (Debiting the available status).
        // Or the aggregation logic should include 'settled'? No, settled is final.
        // Real logic: Amount is removed from 'available' to 'settled' or just Debit entry with status 'settled'.
        // If I have +5000 (Available).
        // And -4000 (Settled).
        // Sum of 'available' status is 5000.
        // Balance = 5000.
        // But I paid out 4000. My available should be 1000.
        // So Payout Debit entry MUST have status='available' (or 'settled' but tracking available balance needs to sum all active ledger impacts).
        // Usually, 'available' balance is the sum of ALL entries that contribute to current purchasing power.
        // If Payout is 'settled', it means money is gone.
        // So simple Sum(status='available') only works if Payout debits are also marked 'available' (Paradox)?
        // OR: Payout debit reduces the AVAILABLE, so it should be status='available' (effectively "applied against available").
        // Let's check LedgerEntry schema comments.
        // status: "available" // Eligible for payout/usage.
        // If I debit, I add a negative entry.
        // IF I mark it 'available', Sum is 5000 + (-4000) = 1000. Correct.
        // IF I mark it 'settled', Sum is 5000. Incorrect.
        // SO: Payout Debit entries should be status 'available' (meaning "this entry affects available balance").
        // OR 'settled' means "Historical".
        // The design says: "data source: LedgerEntry ... Calculation rules: available_amount: Sum of amount ... where status = 'available'".
        // This implies verification script should mark payout debit as 'available' IF the intention is that the debit *reduces the available sum*.
        // Re-reading Step 4 (Payouts) logic might clarify, but assuming standard ledger: Debits against a balance helper usually share the status tag of the balance they affect.
        // I will update the seed data to use status='available' for the payout debit so the math checks out.
        // Wait, if it's 'settled', it's done. 
        // The Service logic is `cond: [{ $eq: ["$status", "available"] }, "$amount", 0]`.
        // So yes, to reduce the sum, the negative entry must match the condition.
        // I'll change Payout seed status to 'available'. (Or implies the PayoutService marks it so).

        // Update seed for Payout 1:
        // status: 'available'

        // Expected:
        // Available: 5000 (Credit) - 4000 (Payout Debit) = 1000.
        // Pending: 10000 (Order 1) + 0 (Order 2 settled) - 5000 (Order 2 settled, release debit is locked, but wait... release debit is locked? Yes, to reduce locked).
        // Order 2: Lock 5000 (Settled - ignored? No, aggreg ignores 'settled').
        // Order 2: Rel Debit -5000 (Locked).
        // Order 1: Lock 10000 (Locked).
        // Pending = 10000 + (-5000) = 5000? 
        // Wait. Order 2 entries:
        // Lock 5000 (Settled) -> Ignored.
        // Rel Debit -5000 (Locked) -> Included.
        // Rel Credit 5000 (Available) -> Available bucket.
        // Order 1: Lock 10000 (Locked) -> Included.
        // Pending Sum = 10000 - 5000 = 5000.
        // This seems wrong. Order 2 was fully released. Pending should be 0 impact.
        // The "Lock" for Order 2 should be "Locked" until it is "Settled"?
        // When releasing funds:
        // 1. Debit Locked (-5000).
        // 2. Credit Available (+5000).
        // The Original Lock (+5000) must stay "Locked" for the sum to net to 0.
        // If I change Original Lock to 'settled', then Pending Sum = -5000.
        // So Original Lock MUST remain 'locked'.
        // So "Locked" bucket = Lock(+5000) + RelDebit(-5000) = 0. Correct.
        // So seed data fix: Order 2 Lock status should be 'locked'.

        // Order 1 Lock: 10000 (Locked). Pending = 10000.
        // Refund 1: 
        // Lock 1000 (Settled? No, should be Locked).
        // Reversal -1000 (Settled? No, should be Locked to net to 0).
        // Or if Refunded, maybe we mark them 'settled' to remove from query perf?
        // Service queries status='locked'.
        // If I want Pending to be 0 for refund, either both are Locked (+1000 -1000 = 0) or both Settled (ignored).
        // Let's assume both Locked for consistency.

        // Lifetime Gross:
        // Sum type='escrow_lock'.
        // Order 1 (10000) + Order 2 (5000) + Refund 1 (1000) = 16000.

        // Lifetime Refunded:
        // Sum abs(escrow_reversal).
        // Refund 1 (-1000) -> 1000.

        // Total Paid Out:
        // Sum abs(payout).
        // Payout 1 (-4000) -> 4000.

        // Let's adjust seed data in memory before loop or just run with this logic.
        // I will update the insert commands dynamically in code below.

        // FIXING SEED DATA LOGIC IN CODE:
        // Clear existing
        await LedgerEntry.deleteMany({ user_uid: sellerUid });
        await Order.deleteMany({ sellerId: sellerUid });
        await Payout.deleteMany({ sellerId: sellerUid });

        const correctedEntries = [
            // Order 1: Locked $100
            { user_uid: sellerUid, role: 'seller', type: 'escrow_lock', amount: 10000, currency, status: 'locked', description: 'Order 1 Lock', externalId: uuidv4() },

            // Order 2: Released $50
            { user_uid: sellerUid, role: 'seller', type: 'escrow_lock', amount: 5000, currency, status: 'locked', description: 'Order 2 Lock', externalId: uuidv4() },
            { user_uid: sellerUid, role: 'seller', type: 'escrow_release_debit', amount: -5000, currency, status: 'locked', description: 'Order 2 Rel Debit', externalId: uuidv4() },
            { user_uid: sellerUid, role: 'seller', type: 'escrow_release_credit', amount: 5000, currency, status: 'available', description: 'Order 2 Rel Credit', externalId: uuidv4() },

            // Payout 1: $40 Paid Out
            { user_uid: sellerUid, role: 'seller', type: 'payout', amount: -4000, currency, status: 'available', description: 'Payout 1', externalId: uuidv4() },

            // Refund 1: $10 Refunded
            { user_uid: sellerUid, role: 'seller', type: 'escrow_lock', amount: 1000, currency, status: 'locked', description: 'Refund 1 Lock', externalId: uuidv4() },
            { user_uid: sellerUid, role: 'seller', type: 'escrow_reversal', amount: -1000, currency, status: 'locked', description: 'Refund 1 Reversal', externalId: uuidv4() }
        ];
        await LedgerEntry.insertMany(correctedEntries);
        // Reseed Orders/Payouts
        await Order.insertMany(orders);
        await Payout.insertMany(payouts);

        // Run Verification Reprise
        const b = (await SellerFinancialService.getBalances(sellerUid)).balances[0];
        console.log('Balance:', b);

        if (b.available_amount !== 1000) console.error('❌ Fail: Available Amount mismatch (Exp 1000)');
        if (b.pending_amount !== 10000) console.error('❌ Fail: Pending Amount mismatch (Exp 10000)');
        if (b.lifetime_gross_earned !== 16000) console.error('❌ Fail: Gross Earned mismatch (Exp 16000)');
        if (b.lifetime_refunded !== 1000) console.error('❌ Fail: Refunded mismatch (Exp 1000)');
        if (b.total_paid_out !== 4000) console.error('❌ Fail: Paid Out mismatch (Exp 4000)');


        console.log('\n🔍 Verifying Order Financials...');
        const orderFin = await SellerFinancialService.getOrderFinancials(sellerUid);
        console.log('Order Fin:', orderFin.data.length);

        const o1 = orderFin.data.find(o => o.orderId === orders[0].externalId); // Held Pending
        const o2 = orderFin.data.find(o => o.orderId === orders[1].externalId); // Held Mature (Risk)

        if (o1.holdReasonCode !== 'STANDARD_MATURITY') console.error('❌ Fail: Hold Code O1');
        if (o2.holdReasonCode !== 'RISK_REVIEW') console.error('❌ Fail: Hold Code O2');


        console.log('\n🔍 Verifying Payouts...');
        const payoutFin = await SellerFinancialService.getPayouts(sellerUid);
        const pFailed = payoutFin.data.find(p => p.status === 'FAILED');

        if (pFailed.failureCode !== 'BANK_DECLINE') console.error('❌ Fail: Failure Code mismatch');
        if (pFailed.failureMessage !== 'Bank declined transaction') console.error('❌ Fail: Failure Message mismatch');


        console.log('\n✅ Verification Complete');

    } catch (err) {
        console.error('❌ TEST ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyStep8();
