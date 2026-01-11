const mongoose = require('mongoose');
const { LedgerEntry } = require('../../../models/ledgerEntry');
const { Order } = require('../../../models/order');
const { Payout } = require('../../../models/payout');
const ledgerService = require('../../../services/payment/ledgerService');
const { v4: uuidv4 } = require('uuid');

// Mock StripeAdapter methods if needed, but we focus on Ledger Logic mainly.
// We will test `recordRefund` and `recordDispute` directly for logic verification,
// and `getSellerBalance` for aggregation correctness.

describe("Step 5: Refunds & Disputes Ledger Logic", () => {
    let session;
    const sellerId = `seller_${uuidv4()}`;
    const orderId = new mongoose.Types.ObjectId();
    const paymentIntentId = "pi_test_123";
    const amountCents = 1000;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test_ledger_step5');
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await LedgerEntry.deleteMany({});
        await Order.deleteMany({});
        await Payout.deleteMany({});
    });

    const createOrder = async () => {
        return await Order.create({
            _id: orderId,
            sellerId,
            buyerId: "buyer_123",
            totalAmount: 10.00, // 1000 cents
            currency: "USD",
            paymentMethod: "stripe",
            status: "completed",
            paymentIntentId,
            externalId: `ord_${uuidv4()}`
        });
    };

    // 1. Test Aggregation (Step 4 Fix Verification)
    test("getSellerBalance correctly aggregates Locked balance using buckets", async () => {
        // Seed: Lock (+1000), Payout (-1000)
        await LedgerEntry.create([
            {
                user_uid: sellerId,
                role: "seller",
                type: "escrow_lock",
                status: "locked",
                amount: 1000,
                currency: "USD",
                related_payment_intent_id: paymentIntentId,
                description: "Test Lock",
                externalId: uuidv4()
            },
            {
                user_uid: sellerId,
                role: "seller",
                type: "payout",
                status: "settled",
                amount: -1000,
                currency: "USD",
                related_payment_intent_id: paymentIntentId,
                description: "Test Payout",
                externalId: uuidv4()
            }
        ]);

        const balance = await ledgerService.getSellerBalance(sellerId);

        // Locked should be 0 (1000 - 1000)
        expect(balance.locked).toBe(0);
        expect(balance.available).toBe(0);
        expect(balance.total).toBe(0);
    });

    // 2. Pre-Payout Refund (Escrow Reversal)
    test("recordRefund (Pre-Payout) creates escrow_reversal and zeroes lock", async () => {
        const order = await createOrder();

        // Setup Initial Lock
        await LedgerEntry.create({
            user_uid: sellerId,
            role: "seller",
            type: "escrow_lock",
            status: "locked",
            amount: 1000,
            currency: "USD",
            related_order_id: order._id,
            description: "Lock",
            externalId: uuidv4()
        });

        // Mock Stripe Objects
        const paymentIntent = { id: paymentIntentId, amount: 1000, currency: "usd" };
        const refundObject = { id: "re_123", amount: 1000, currency: "usd" };

        // Execute
        await ledgerService.recordRefund(paymentIntent, refundObject, [order]);

        // Verify Entries
        const reversed = await LedgerEntry.findOne({ type: "escrow_reversal" });
        expect(reversed).toBeTruthy();
        expect(reversed.amount).toBe(-1000);
        expect(reversed.status).toBe("settled");

        // Verify Balance
        const balance = await ledgerService.getSellerBalance(sellerId);
        expect(balance.locked).toBe(0);
    });

    // 3. Post-Payout Refund (Seller Debt)
    test("recordRefund (Post-Payout) creates seller_reversal (debt)", async () => {
        const order = await createOrder();

        // Creates Payout (simulating already paid)
        await Payout.create({
            payoutId: "po_123",
            orderId: order._id,
            sellerId,
            amount: 1000,
            currency: "USD",
            status: "COMPLETED",
            adminId: "admin",
        });

        // Current Ledger State: Lock + Payout (Net 0 Locked)
        await LedgerEntry.create([
            { user_uid: sellerId, role: "seller", type: "escrow_lock", amount: 1000, currency: "USD", status: "locked", externalId: uuidv4() },
            { user_uid: sellerId, role: "seller", type: "payout", amount: -1000, currency: "USD", status: "settled", externalId: uuidv4() } // Payout debit
        ]);

        // Mock Stripe Objects
        const paymentIntent = { id: paymentIntentId, amount: 1000, currency: "usd" };
        const refundObject = { id: "re_999", amount: 1000, currency: "usd" };

        // Execute Refund
        await ledgerService.recordRefund(paymentIntent, refundObject, [order]);

        // Verify Entries
        const debtEntry = await LedgerEntry.findOne({ type: "seller_reversal" });
        expect(debtEntry).toBeTruthy();
        expect(debtEntry.amount).toBe(-1000);
        expect(debtEntry.status).toBe("available");

        // Verify Balance
        const balance = await ledgerService.getSellerBalance(sellerId);
        expect(balance.locked).toBe(0);
        expect(balance.available).toBe(-1000); // Debt!
    });

    // 4. Dispute Lost (Seller Debt)
    test("recordDispute (Lost) creates seller_reversal", async () => {
        const order = await createOrder();

        const disputeObject = {
            id: "dp_123",
            payment_intent: paymentIntentId,
            status: "lost",
            amount: 1000,
            currency: "usd"
        };

        // Execute
        await ledgerService.recordDispute(disputeObject, order);

        // Verify
        const audit = await LedgerEntry.findOne({ type: "dispute_lost" });
        expect(audit).toBeTruthy();
        expect(audit.amount).toBe(0); // Audit has no value

        const debt = await LedgerEntry.findOne({ type: "seller_reversal" });
        expect(debt).toBeTruthy();
        expect(debt.amount).toBe(-1000);
        expect(debt.metadata.disputeId).toBe("dp_123");
    });
});
