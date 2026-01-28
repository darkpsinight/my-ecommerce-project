const { Payout } = require("../../models/payout");
const { Order } = require("../../models/order");
const payoutService = require("./payoutService");
const stripeAdapter = require("./stripeAdapter"); // Assuming instance export or new instance
const ledgerService = require("./ledgerService");
const { PaymentError } = require("./paymentErrors");

class EscrowService {
    constructor() {
        this.stripeAdapter = new (require("./stripeAdapter"))();
    }

    /**
     * Release escrow for a specific order.
     * - Verifies order is currently held.
     * - Triggers PayoutService to transfer funds to seller.
     * - Updates order escrow status to 'released'.
     * 
     * @param {String} orderId 
     * @param {String} adminId 
     * @returns {Promise<Object>}
     */
    async releaseEscrow(orderId, adminId) {
        let order = await Order.findOne({ externalId: orderId });
        if (!order && orderId.match(/^[0-9a-fA-F]{24}$/)) {
            // Fallback to internal ID if valid objectId and not found by externalId
            order = await Order.findById(orderId);
        }

        if (!order) {
            throw new PaymentError("Order not found", "ORDER_NOT_FOUND", 404);
        }

        if (order.escrowStatus !== "held") {
            throw new PaymentError(
                `Order is not in held status (current: ${order.escrowStatus})`,
                "INVALID_ESCROW_STATUS",
                400
            );
        }

        // Call PayoutService to handle the actual money movement
        // This will validate seller account, balance, and create Payout record + Stripe Transfer
        // Payout service expects orderId (internal _id), so we pass order._id
        const payout = await payoutService.processOrderPayout(order._id, adminId);

        // Update Order Escrow Status
        order.escrowStatus = "released";
        order.escrowReleasedAt = new Date();
        await order.save();

        return {
            success: true,
            orderId: order._id, // Return internal ID
            escrowStatus: "released",
            payoutId: payout.payoutId,
            stripeTransferId: payout.stripeTransferId
        };
    }

    /**
     * Refund escrow for a specific order.
     * - Verifies order is currently held.
     * - Triggers Stripe Refund.
     * - Records Ledger Refund.
     * - Updates order escrow status to 'refunded' and status to 'refunded'.
     * 
     * @param {String} orderId 
     * @param {String} adminId 
     * @param {String} reason 
     * @returns {Promise<Object>}
     */
    async refundEscrow(orderId, adminId, reason = "admin_check_refund") {
        let order = await Order.findOne({ externalId: orderId });
        if (!order && orderId.match(/^[0-9a-fA-F]{24}$/)) {
            // Fallback to internal ID
            order = await Order.findById(orderId);
        }

        if (!order) {
            throw new PaymentError("Order not found", "ORDER_NOT_FOUND", 404);
        }

        if (order.escrowStatus !== "held") {
            throw new PaymentError(
                `Order is not in held status (current: ${order.escrowStatus})`,
                "INVALID_ESCROW_STATUS",
                400
            );
        }

        // execute refund via Stripe
        if (!order.paymentIntentId) {
            throw new PaymentError("Order missing paymentIntentId", "MISSING_PAYMENT_INTENT", 400);
        }

        // 1. Stripe Refund
        // Assuming full refund for simplicity as per requirement scope
        const refundResult = await this.stripeAdapter.refundPayment(
            order.paymentIntentId,
            null, // null = full amount
            reason
        );

        // 2. Ledger Update
        // Need to pass [order] as array because ledgerService expects list
        // We recreate the 'refundObject' shape that recordRefund expects or fetch it? 
        // ledgerService.recordRefund(paymentIntent, refundObject, orders)
        // We already have refundResult which mimics refundObject enough?
        // refundResult has { refundId, amountCents, currency, ... }
        const refundObject = {
            id: refundResult.refundId,
            amount: refundResult.amountCents,
            currency: refundResult.currency,
            reason: refundResult.reason
        };

        // We need paymentIntent object for ledgerService... or just ID?
        // recordRefund uses paymentIntent.id. 
        // Let's pass { id: order.paymentIntentId } as a mock if that's all it needs
        // Checking ledgerService.js... yes it uses paymentIntent.id.
        await ledgerService.recordRefund(
            { id: order.paymentIntentId },
            refundObject,
            [order]
        );

        // 3. Order Status Update
        order.escrowStatus = "refunded";
        order.status = "refunded"; // Also update main status as per plan
        order.errorMessage = `Refunded by admin ${adminId}: ${reason}`;
        await order.save();

        return {
            success: true,
            orderId: order._id,
            escrowStatus: "refunded",
            refundId: refundResult.refundId
        };
    }
    /**
     * Refunds the order amount to the buyer's wallet.
     * STRICTLY:
     * - No Stripe Refund.
     * - Credit Buyer Wallet.
     * - Update Order & Dispute status.
     * 
     * @param {String} orderId - External ID or Internal ID
     * @param {String} adminUid 
     * @param {String} justification 
     * @returns {Promise<Object>}
     */
    async refundToWallet(orderId, adminUid, justification) {
        const { Dispute } = require("../../models/dispute");
        const { v4: uuidv4 } = require('uuid');

        let order = await Order.findOne({ externalId: orderId });
        if (!order && orderId.match(/^[0-9a-fA-F]{24}$/)) {
            order = await Order.findById(orderId);
        }

        if (!order) {
            throw new PaymentError("Order not found", "ORDER_NOT_FOUND", 404);
        }

        // 1. Prerequisite Checks
        if (order.escrowStatus !== "held") {
            throw new PaymentError(
                `Order is not in held status (current: ${order.escrowStatus})`,
                "INVALID_ESCROW_STATUS",
                400
            );
        }

        // Check for OPEN dispute
        const dispute = await Dispute.findOne({ orderId: order._id, status: 'OPEN' });
        if (!dispute) {
            throw new PaymentError("No OPEN dispute found for this order", "NO_OPEN_DISPUTE", 400);
        }

        // 2. Create Ledger Entry (Credit Buyer Wallet)
        // We do NOT call Stripe. Funds remain in platform Stripe account (Platform Liability).
        const ledgerEntryId = uuidv4();
        const amount = dispute.amount; // Use integer minor units from Dispute

        const ledgerEntry = new (require("../../models/ledgerEntry").LedgerEntry)({
            user_uid: order.buyerId, // Assuming string UID stored on order or we resolve it. order.buyerId is listed in order schema as String (user uid) usually.
            role: "buyer",
            type: "wallet_credit_refund",
            amount: amount, // Positive
            currency: order.currency,
            status: "available",
            description: `Refund to Wallet: ${justification}`,
            related_order_id: order._id,
            metadata: {
                paymentIntentId: order.paymentIntentId, // Reference original payment
                disputeId: dispute.disputeId,
                adminUid: adminUid,
                justification: justification,
                source: "admin_dispute_resolution"
            },
            externalId: ledgerEntryId
        });

        await ledgerEntry.save();

        // 3. Update Order Status
        order.escrowStatus = "refunded";
        order.status = "refunded";
        order.escrowReleasedAt = new Date();
        order.errorMessage = `Refunded to Wallet by admin ${adminUid}: ${justification}`;
        await order.save();

        // 4. Update Dispute Status
        dispute.status = 'CLOSED';
        dispute.metadata = {
            ...dispute.metadata,
            resolution: 'REFUND_TO_WALLET',
            resolvedAt: new Date(),
            resolvedBy: adminUid,
            justification: justification
        };
        await dispute.save();

        return {
            success: true,
            ledgerEntryId: ledgerEntryId,
            newStatus: "refunded",
            disputeStatus: "CLOSED"
        };
    }
}

module.exports = new EscrowService();
