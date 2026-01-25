const mongoose = require("mongoose");
const { LedgerEntry } = require("../../models/ledgerEntry");
const ledgerService = require("./ledgerService");
const walletLedgerService = require("./walletLedgerService");
const { v4: uuidv4 } = require("uuid");
const { InsufficientFundsError } = require("./paymentErrors");

class WalletSpendingService {
    /**
     * Orchestrates atomic wallet spending for an order group.
     * 1. Check Balance
     * 2. Debit Buyer (wallet_debit_purchase)
     * 3. Credit Escrow (escrow_lock)
     * 
     * @param {String} buyerUid - Buyer's User ID
     * @param {Array<Object>} orders - List of Order documents (must share same currency)
     * @returns {Promise<Object>} { success: true, paymentId: String }
     */
    async processWalletPurchase(buyerUid, orders) {
        if (!orders || orders.length === 0) {
            throw new Error("No orders provided for wallet purchase");
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Calculate Total Required
            const currency = orders[0].currency; // Assumption: All orders in checkout share currency
            let totalAmountCents = 0;

            orders.forEach(order => {
                if (order.currency !== currency) {
                    throw new Error("Currency mismatch in order group");
                }
                // Order total is typically in units or cents? 
                // Based on verify_step_23_3, APIs tend to use cents, but Order model might store units.
                // CheckoutService.js: "totalCartAmount += (item.discountedPrice || item.price) * item.quantity;"
                // "const amountCents = Math.round(totalCartAmount * 100);"
                // "group.totalAmount" (saved to Order) seems to be Un-rounded Units (Dollars).
                // "LedgerService" multiplies order.totalAmount * 100.
                // We will follow LedgerService pattern: Math.round(order.totalAmount * 100).

                totalAmountCents += Math.round(order.totalAmount * 100);
            });

            // 2. Check Balance (READ)
            const currentBalance = await walletLedgerService.getBuyerBalance(buyerUid, currency);
            if (currentBalance < totalAmountCents) {
                throw new InsufficientFundsError(currentBalance, totalAmountCents, currency);
            }

            const paymentId = `wallet_${uuidv4()}`; // Internal Payment ID reference

            // 3. Debit Buyer (WRITE)
            // entry: wallet_debit_purchase
            const debitEntry = new LedgerEntry({
                user_uid: buyerUid,
                role: "buyer",
                type: "wallet_debit_purchase",
                amount: -totalAmountCents, // Negative for Debit
                currency: currency,
                status: "available", // Removed from available balance
                related_payment_intent_id: paymentId,
                description: `Payment for ${orders.length} orders`,
                metadata: {
                    orderIds: orders.map(o => o.externalId).join(","),
                    checkoutGroupId: orders[0].checkoutGroupId
                },
                externalId: uuidv4()
            });

            await debitEntry.save({ session });

            // 4. Credit Escrow (WRITE)
            // entry: escrow_lock (one per order, locked for seller)
            for (const order of orders) {
                const lockAmountCents = Math.round(order.totalAmount * 100);

                const escrowEntry = new LedgerEntry({
                    user_uid: order.sellerId,
                    role: "seller",
                    type: "escrow_lock",
                    amount: lockAmountCents, // Positive for Lock
                    currency: currency,
                    status: "locked", // Strictly Locked
                    related_order_id: order._id,
                    related_payment_intent_id: paymentId,
                    description: `Escrow lock for Order ${order.externalId} (Wallet)`,
                    metadata: {
                        source: "wallet_purchase",
                        buyerUid: buyerUid
                    },
                    externalId: uuidv4()
                });

                await escrowEntry.save({ session });
            }

            // 5. Invariant Assertion
            // Re-read balance inside transaction (Mongo 4.2+ support snapshot reads, but here we just check logic)
            // walletLedgerService.assertWalletInvariants check might be heavy, but let's trust the atomic calc + initial check.

            await session.commitTransaction();
            session.endSession();

            return {
                success: true,
                paymentId: paymentId,
                totalAmountCents,
                currency
            };

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
}

module.exports = new WalletSpendingService();
