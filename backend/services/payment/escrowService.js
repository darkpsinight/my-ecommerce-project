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
        const order = await Order.findById(orderId);
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
        const payout = await payoutService.processOrderPayout(orderId, adminId);

        // Update Order Escrow Status
        order.escrowStatus = "released";
        order.escrowReleasedAt = new Date();
        await order.save();

        return {
            success: true,
            orderId: order._id,
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
        const order = await Order.findById(orderId);
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
}

module.exports = new EscrowService();
