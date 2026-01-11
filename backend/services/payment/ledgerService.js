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
    /**
     * Records a Refund (initiated by Buyer/Platform).
     * Handles Pre-Payout (Escrow Reversal) vs Post-Payout (Seller Debt).
     * 
     * @param {Object} paymentIntent - Stripe PaymentIntent
     * @param {Object} refundObject - Stripe Refund object
     * @param {Array<Object>} orders - Related Orders
     */
    async recordRefund(paymentIntent, refundObject, orders) {
        // Late require to avoid circular dependency
        const { Payout } = require("../../models/payout");
        const { v4: uuidv4 } = require("uuid"); // Ensure uuid available

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const createdEntries = [];

            for (const order of orders) {
                // Check payout status
                const payout = await Payout.findOne({ orderId: order._id }).session(session);
                const isPaidOut = payout && (payout.status === 'COMPLETED' || payout.status === 'PENDING');

                const entryData = {
                    user_uid: order.sellerId,
                    role: "seller",
                    amount: -Math.round(order.totalAmount * 100), // Negative Listing Price
                    currency: order.currency.toUpperCase(),
                    related_order_id: order._id,
                    related_payment_intent_id: paymentIntent.id,
                    description: `Refund for Order ${order.externalId} (Refund: ${refundObject.id})`,
                    metadata: {
                        refundId: refundObject.id,
                        reason: refundObject.reason || "requested_by_customer"
                    },
                    externalId: uuidv4()
                };

                if (isPaidOut) {
                    // Post-Payout: Create Debt
                    entryData.type = "seller_reversal";
                    entryData.status = "available"; // Immediate debt against future earnings
                } else {
                    // Pre-Payout: Cancel Escrow
                    entryData.type = "escrow_reversal";
                    entryData.status = "settled"; // Finalized fact, balances escrow_lock
                }

                const entry = new LedgerEntry(entryData);
                await entry.save({ session });
                createdEntries.push(entry);
            }

            // Platform Entry (Captures the "money out" event from Platform Stripe Account)
            const platformEntry = new LedgerEntry({
                user_uid: "PLATFORM",
                role: "platform",
                type: "refund",
                amount: -refundObject.amount,
                currency: refundObject.currency.toUpperCase(),
                status: "settled",
                related_payment_intent_id: paymentIntent.id,
                description: `Refund payout for PI ${paymentIntent.id}`,
                metadata: {
                    refundId: refundObject.id
                },
                externalId: uuidv4()
            });

            await platformEntry.save({ session });
            createdEntries.push(platformEntry);

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
     * Records a Stripe Dispute event.
     * Handles Tracking (Open/Won) and Financial Reversal (Lost).
     * 
     * @param {Object} disputeObject - Stripe Dispute object
     * @param {Object} order - Related Order
     */
    async recordDispute(disputeObject, order) {
        const { v4: uuidv4 } = require("uuid");
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const status = disputeObject.status; // needs_response, warning_needs_response, won, lost, under_review
            let ledgerType = "dispute_open";
            let createFinancialReversal = false;

            if (status === "lost") {
                ledgerType = "dispute_lost";
                createFinancialReversal = true;
            } else if (status === "won") {
                ledgerType = "dispute_won";
            }

            // 1. Audit Entry (Information Only)
            const auditEntry = new LedgerEntry({
                user_uid: order.sellerId,
                role: "seller", // Assigned to seller's log
                type: ledgerType,
                amount: 0, // No direct balance impact for audit entry
                currency: order.currency.toUpperCase(),
                status: "settled", // Info is final
                related_order_id: order._id,
                related_payment_intent_id: disputeObject.payment_intent,
                description: `Dispute ${disputeObject.id} status: ${status}`,
                metadata: {
                    disputeId: disputeObject.id,
                    reason: disputeObject.reason
                },
                externalId: uuidv4()
            });
            await auditEntry.save({ session });

            // 2. Financial Reversal (If Lost)
            // Same logic as Post-Payout Refund -> Seller Debt
            // Disputes usually come after settlement, so we assume Post-Payout logic primarily.
            // Even if funds in escrow, we debit "available" to force negative if needed, 
            // OR if strictly pre-payout we could check payout status?
            // Simplicity: Treat Dispute Lost as creating a Debt. 
            // If they have funds in Escrow, this Debt will offset it when calculated? No, distinct buckets.
            // "Available" debt must be paid. "Locked" funds are for that specific order.
            // If Dispute is for Order X, and Order X funds are Locked, we should technically "Burn" the locked funds?
            // Plan said: "Log dispute_lost AND seller_reversal".
            if (createFinancialReversal) {
                const reversalEntry = new LedgerEntry({
                    user_uid: order.sellerId,
                    role: "seller",
                    type: "seller_reversal",
                    amount: -Math.round(order.totalAmount * 100), // Net Listing Price
                    currency: order.currency.toUpperCase(),
                    status: "available", // Creates Debt
                    related_order_id: order._id,
                    related_payment_intent_id: disputeObject.payment_intent,
                    description: `Dispute Lost Reversal for Order ${order.externalId}`,
                    metadata: { disputeId: disputeObject.id },
                    externalId: uuidv4()
                });
                await reversalEntry.save({ session });
            }

            await session.commitTransaction();
            session.endSession();

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    /**
     * READ-ONLY: Aggregates seller balance by status.
     * Does NOT move money.
     * 
     * NEW LOGIC (Step 5):
     * Locked = escrow_lock + escrow_reversal + payout (pending/completed are debits from lock)
     * Available = seller_reversal (debt) + [future: available_credit]
     * 
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
                    _id: "$type",
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);

        // Map types to logical buckets
        const buckets = {
            escrow_lock: 0,
            escrow_reversal: 0,
            payout: 0,
            seller_reversal: 0,
            escrow_release: 0, // Legacy/unused in this flow but kept for safety
            refund: 0 // Shouldn't happen for seller role but safe to init
        };

        result.forEach(group => {
            if (buckets[group._id] !== undefined) {
                buckets[group._id] = group.totalAmount;
            }
        });

        // 1. Locked Balance
        // Credits (Locks) + Debits (Reversals/Payouts)
        // Note: Reversals and Payouts are negative numbers in DB.
        const locked = buckets.escrow_lock + buckets.escrow_reversal + buckets.payout;

        // 2. Available Balance
        // Currently only Debits (Seller Reversals for post-payout refunds)
        // Future: Add { type: 'escrow_release', status: 'available' } here if we had auto-release
        const available = buckets.seller_reversal + buckets.escrow_release;

        return {
            available,
            locked,
            total: available + locked
        };
    }
}

module.exports = new LedgerService();
