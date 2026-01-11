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

        // STRICT: No existing payout for this order
        const existingPayout = await Payout.findOne({ orderId });
        if (existingPayout) {
            // If failed, we might allow retry, but for now strict "One Payout" per order unless handled.
            // Plan says: "No existing Payout for this orderId". 
            // If previous failed, Admin might need to manually intervene or we delete the failed one? 
            // For now, block.
            if (existingPayout.status === "FAILED") {
                // Re-throw specific error so admin knows it failed before
                throw new PaymentError(
                    `Payout previously failed for order ${orderId}. Protocol requires manual intervention.`,
                    "PAYMENT_PREVIOUSLY_FAILED",
                    409
                );
            }
            throw new PaymentError(
                `Payout already exists for order ${orderId}. Status: ${existingPayout.status}`,
                "PAYMENT_ALREADY_EXISTS",
                409
            );
        }

        // 2. Validate Stripe Account
        const sellerStripeAccount = await StripeAccount.getBySellerId(order.sellerId);
        if (!sellerStripeAccount || !sellerStripeAccount.isFullyVerified()) {
            throw new PaymentError(
                `Seller ${order.sellerId} does not have a verified Stripe account.`,
                "SELLER_ACCOUNT_INVALID",
                400
            );
        }

        // STRICT: Currency Match
        // We assume Stripe Account currency matches Order currency for simplicity in this step, 
        // or Stripe handles conversion. But Requirement 8 says: 
        // "Currency must exactly match the original charge currency."
        // So we validate Payout Currency (Order Currency) == Stripe Account Default Currency? 
        // Or just ensure we send Order Currency. 
        // We will fail if they don't match only if we know for sure. 
        // For Custom accounts, 'default_currency' is a good check.
        // However, Stripe Clean accounts can accept multiple currencies. 
        // We'll enforce that we are sending the Order.currency.

        // 3. Ledger Balance Check
        // We need to verify that we have "locked" funds for this SPECIFIC order.
        // Aggregation: Sum(amount) where type='escrow_lock', status='locked', related_order_id=order._id
        const ledgerBalance = await LedgerEntry.aggregate([
            {
                $match: {
                    user_uid: order.sellerId,
                    role: "seller",
                    type: "escrow_lock",
                    status: "locked",
                    related_order_id: order._id
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);

        const lockedAmount = ledgerBalance.length > 0 ? ledgerBalance[0].totalAmount : 0;

        // We expect Order.totalAmount (units) -> Ledger (cents).
        // LedgerService creates it as Math.round(order.totalAmount * 100).
        // So we compare lockedAmount vs payoutAmount.

        // Calculate expected payout amount
        const payoutAmountCents = Math.round(order.totalAmount * 100);

        if (lockedAmount < payoutAmountCents) {
            throw new PaymentError(
                `Insufficient locked escrow balance. Locked: ${lockedAmount}, Required: ${payoutAmountCents}`,
                "INSUFFICIENT_ESCROW_FUNDS",
                400
            );
        }

        // 4. Create Payout Record (PENDING)
        const payout = new Payout({
            adminId,
            sellerId: order.sellerId,
            amount: payoutAmountCents,
            currency: order.currency.toUpperCase(),
            orderId: order._id,
            status: "PENDING"
        });

        await payout.save();

        // 5. Execute Stripe Transfer
        let transfer;
        try {
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

        // 6. Atomic Transaction: Ledger Update + Payout Complete
        // This is the "Stripe Success -> Ledger Debit" phase.
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Create Ledger Entry (Debit)
            const ledgerEntry = new LedgerEntry({
                user_uid: order.sellerId,
                role: "seller",
                type: "payout",
                amount: -payoutAmountCents, // Debit
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
            // The Payout is left as PENDING (since we didn't save COMPLETED outside transaction).
            // Ledger Entry is NOT created (rolled back).
            // Funds are moved in Stripe but not recorded in Ledger.
            await session.abortTransaction();
            session.endSession();

            console.error("🚨 CRITICAL: FLOATING STRIPE TRANSFER", {
                payoutId: payout.payoutId,
                stripeTransferId: transfer.transferId,
                orderId: order._id,
                amount: payoutAmountCents,
                error: dbError.message
            });

            // We do NOT fail the response entirely if possible, or we throw a specific Critical Error?
            // Requirement: "Emit CRITICAL error for reconciliation". 
            // We throw a wrapper error so the caller knows it's a critical reconcile state.
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
