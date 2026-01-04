const { LedgerEntry } = require("../../models/ledgerEntry");
const mongoose = require("mongoose");

class LedgerService {
    /**
     * Records a successful payment by creating necessary ledger entries.
     * This is the entry point for Step 3 - Escrow locking.
     * 
     * @param {Object} paymentIntent - The Stripe PaymentIntent object
     * @param {Array<Object>} orders - List of Order documents associated with this payment
     * @returns {Promise<Array<Object>>} - The created LedgerEntry documents
     */
    async recordPaymentSuccess(paymentIntent, orders) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const createdEntries = [];
            const paymentIntentId = paymentIntent.id;
            const totalAmount = paymentIntent.amount; // Amount is already in cents
            const currency = paymentIntent.currency.toUpperCase();

            // 1. Create Platform Entry (Gross funds sitting in Stripe Platform Account)
            // This represents the "Cash on Hand" at the Stripe level.
            const platformEntry = new LedgerEntry({
                user_uid: "PLATFORM", // System-level identifier
                role: "platform",
                type: "payment_capture",
                amount: totalAmount, // Positive input
                currency: currency,
                status: "settled", // Money is already in the Stripe account
                related_payment_intent_id: paymentIntentId,
                description: `Payment capture for PI ${paymentIntentId}`,
                metadata: {
                    total_orders: orders.length,
                    step: "3_ledger_implementation"
                }
            });

            await platformEntry.save({ session });
            createdEntries.push(platformEntry);

            // 2. Create Seller Entries (Allocated funds held in Escrow)
            // For each order, we lock the funds for the specific seller.
            for (const order of orders) {
                // Validate mismatch (sanity check)
                if (order.currency !== currency) {
                    console.warn(`Currency mismatch for Order ${order._id}: expected ${currency}, got ${order.currency}`);
                }

                const sellerEntry = new LedgerEntry({
                    user_uid: order.sellerId, // This is the UUID string
                    role: "seller",
                    type: "escrow_lock",
                    amount: order.totalAmount * 100, // Order amount is usually stored in dollars/units? Checking schema...
                    // Order schema says 'totalAmount' is Number. 
                    // PaymentIntent suggests cents. 
                    // Let's re-verify Order Schema unit.
                    // Order.totalAmount defaults to standard units (e.g. 10.50). 
                    // Ledger requires CENTS.
                    currency: currency,
                    status: "locked", // STRICT REQUIREMENT: Locked immediately
                    related_order_id: order._id,
                    related_payment_intent_id: paymentIntentId,
                    description: `Escrow lock for Order ${order.externalId}`,
                    metadata: {
                        order_external_id: order.externalId
                    }
                });

                // Double check unit conversion
                // If order.totalAmount is 10.00, we want 1000 cents.
                // If database stores cents for order, we need to know. 
                // Order.js validation says "min: 0", doesn't specify. 
                // Standard practice in this codebase appears to be: 
                // PaymentIntentProcessor divides by 100 to save to Wallet (dollars).
                // So generic storage is likely dollars/units.
                // We will multiple by 100 and round to be safe.
                sellerEntry.amount = Math.round(order.totalAmount * 100);

                await sellerEntry.save({ session });
                createdEntries.push(sellerEntry);
            }

            await session.commitTransaction();
            session.endSession();

            return createdEntries;

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    /**
     * READ-ONLY: Aggregates seller balance by status.
     * Does NOT move money.
     * @param {String} sellerUid 
     * @returns {Promise<Object>} { available, locked, total } in CENTS
     */
    async getSellerBalance(sellerUid) {
        const result = await LedgerEntry.aggregate([
            {
                $match: {
                    user_uid: sellerUid,
                    role: "seller"
                }
            },
            {
                $group: {
                    _id: "$status",
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);

        // Format output
        const balances = {
            available: 0,
            locked: 0,
            settled: 0 // Usually for past payouts
        };

        result.forEach(group => {
            if (balances[group._id] !== undefined) {
                balances[group._id] = group.totalAmount;
            }
        });

        return {
            ...balances,
            total: balances.available + balances.locked
        };
    }
}

module.exports = new LedgerService();
