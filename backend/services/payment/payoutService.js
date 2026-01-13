const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { Order } = require("../../models/order");
const { Payout } = require("../../models/payout");
const { LedgerEntry } = require("../../models/ledgerEntry");
const { StripeAccount } = require("../../models/stripeAccount");
const StripeAdapter = require("./stripeAdapter");
const { PaymentError } = require("./paymentErrors");

class PayoutService {
    constructor() {
        this.stripeAdapter = new StripeAdapter();
    }

    /**
     * Process a payout for a specific order to the seller.
     * STRICT: One order -> One payout.
     * 
     * @param {String} orderId - The MongoDB ObjectId of the order
     * @param {String} adminId - The UID of the admin initiating the payout
     * @returns {Promise<Object>} - The completed payout object
     */
    async processOrderPayout(orderId, adminId) {
        console.log("[DEBUG] processOrderPayout entered");
        // 1. Validation & Order Retrieval
        const order = await Order.findById(orderId);
        if (!order) {
            throw new PaymentError("Order not found", "ORDER_NOT_FOUND", 404);
        }

        // STRICT: Only delivered orders can be paid out
        if (order.deliveryStatus !== "delivered") {
            throw new PaymentError(
                `Order ${orderId} is not delivered. Status: ${order.deliveryStatus}`,
                "ORDER_NOT_DELIVERED",
                400
            );
        }

        // Calculate expected payout amount (cents)
        const payoutAmountCents = Math.round(order.totalAmount * 100);
        console.log("[DEBUG] payoutAmountCents defined:", payoutAmountCents);

        // 2. Validate Stripe Account (Explicit Lookup)
        const sellerStripeAccount = await StripeAccount.findOne({ sellerId: order.sellerId });
        if (!sellerStripeAccount || !sellerStripeAccount.isFullyVerified()) {
            throw new PaymentError(
                `Seller ${order.sellerId} does not have a verified Stripe account.`,
                "SELLER_ACCOUNT_INVALID",
                400
            );
        }

        // 3. Check for Existing Payout & Handle Retry
        let payout = await Payout.findOne({ orderId });

        if (payout) {
            // BRANCH 1: Active Payout Exists (BLOCK)
            if (payout.status === "COMPLETED" || payout.status === "PENDING") {
                throw new PaymentError(
                    `Payout already exists for order ${orderId}. Status: ${payout.status}`,
                    "PAYMENT_ALREADY_EXISTS",
                    409
                );
            }

            // BRANCH 2: Failed Payout Exists (RETRY)
            if (payout.status === "FAILED") {
                // Safety: Limit max retries
                const MAX_RETRIES = 3;
                const currentRetries = payout.retryAttemptCount || 0;

                if (currentRetries >= MAX_RETRIES) {
                    throw new PaymentError(
                        `Max retry attempts (${MAX_RETRIES}) exceeded for order ${orderId}. Protocol requires manual database intervention.`,
                        "MAX_RETRIES_EXCEEDED",
                        409
                    );
                }

                // Archive the failure details
                payout.payoutHistory.push({
                    attemptAt: payout.updatedAt,
                    adminId: payout.adminId,
                    stripeTransferId: payout.stripeTransferId,
                    failureReason: payout.failureReason,
                    status: payout.status
                });

                // Reset for new attempt
                payout.status = "PENDING";
                payout.retryAttemptCount = currentRetries + 1;
                payout.adminId = adminId; // Set to CURRENT admin retrying
                payout.failureReason = undefined;
                payout.stripeTransferId = undefined; // Will be set on success
                payout.metadata = {
                    ...payout.metadata,
                    lastRetryBy: adminId,
                    lastRetryAt: new Date(),
                    retryReason: "admin_manual_retry"
                };

                await payout.save();
            }
        } else {
            // BRANCH 3: No Payout Exists (NEW)
            console.log("[DEBUG] creating new payout record with amount:", payoutAmountCents);
            payout = new Payout({
                adminId,
                sellerId: order.sellerId,
                amount: payoutAmountCents,
                currency: order.currency.toUpperCase(),
                orderId: order._id,
                status: "PENDING"
            });
            await payout.save();
        }

        // 4. Execute Stripe Transfer
        let transfer;
        try {
            console.log("[DEBUG] calling createTransferToSeller with amount:", payoutAmountCents);
            // metadata includes payoutId and orderId mandatory fields
            transfer = await this.stripeAdapter.createTransferToSeller(
                order.externalId, // escrowId reference
                payoutAmountCents,
                order.sellerId,
                sellerStripeAccount.stripeAccountId,
                {
                    payoutId: payout.payoutId,
                    orderId: order._id.toString(),
                    orderExternalId: order.externalId
                }
            );
        } catch (stripeError) {
            // Update Payout to FAILED
            payout.status = "FAILED";
            payout.failureReason = stripeError.message;
            await payout.save();
            throw stripeError; // Re-throw to caller
        }

        // 5. Atomic Transaction: Ledger Update + Payout Complete
        // This is the "Stripe Success -> Ledger Debit" phase.
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Create Ledger Entry
            console.log("[DEBUG] creating LedgerEntry with amount:", payoutAmountCents);
            const ledgerEntry = new LedgerEntry({
                user_uid: order.sellerId,
                role: "seller",
                type: "payout",
                amount: payoutAmountCents, // POSITIVE per instruction
                currency: order.currency.toUpperCase(),
                status: "settled",
                related_order_id: order._id,
                related_payment_intent_id: order.paymentIntentId, // Trace back to source funds
                stripe_transfer_id: transfer.transferId, // Future proofing schema if we add this field, else put in metadata
                description: `Payout for Order ${order.externalId}`,
                metadata: {
                    payoutId: payout.payoutId,
                    stripeTransferId: transfer.transferId,
                    adminId
                },
                externalId: uuidv4()
            });

            await ledgerEntry.save({ session });

            // Update Payout Status
            payout.status = "COMPLETED";
            payout.stripeTransferId = transfer.transferId;
            await payout.save({ session });

            await session.commitTransaction();
            session.endSession();

            return payout;

        } catch (dbError) {
            // CRITICAL: Stripe succeeded but DB failed.
            await session.abortTransaction();
            session.endSession();

            console.error("🚨 CRITICAL: FLOATING STRIPE TRANSFER", {
                payoutId: payout.payoutId,
                stripeTransferId: transfer.transferId,
                orderId: order._id,
                amount: payoutAmountCents,
                error: dbError.message
            });

            const criticalError = new Error("CRITICAL: Stripe Transfer succeeded but DB update failed. Manual Reconciliation Required.");
            criticalError.type = "CRITICAL_RECONCILIATION_REQUIRED";
            criticalError.details = {
                payoutId: payout.payoutId,
                stripeTransferId: transfer.transferId,
                dbError: dbError.message
            };
            throw criticalError;
        }
    }
}

module.exports = new PayoutService();
