const { Order } = require("../models/order");
const payoutService = require("../services/payment/payoutService");
const payoutEligibilityService = require("../services/payment/payoutEligibilityService");

// OFFICIAL PAYOUT EXECUTION ENTRY POINT
// Step 7: 3-Phase Commit Payout Trigger
// Purpose: Initiates the payout process for an eligible order.
// Constraints: Admin Only. Strict Eligibility. Debit-First.
const triggerManualPayout = async (request, reply) => {
    const { orderId } = request.params;
    const adminId = request.user.uid;

    try {
        request.log.info(`[Admin] Payout Execution Initiated for Order ${orderId} by Admin ${adminId}`);

        // 1. Basic Existence Check (Service does this too, but fails fast here)
        const order = await Order.findById(orderId);
        if (!order) {
            return reply.code(404).send({ message: "Order not found", code: "ORDER_NOT_FOUND" });
        }

        // 2. Delegate execution to PayoutService (Step 7 Logic)
        // This handles:
        // - Eligibility Check (Step 6 Gate)
        // - Solvency Check (Debit-First)
        // - Idempotency
        // - Stripe Execution (Phase 2)
        // - Finalization (Phase 3)
        const payout = await payoutService.processOrderPayout(orderId, adminId);

        return reply.send({
            success: true,
            message: "Payout processed successfully",
            payoutId: payout.payoutId,
            status: payout.status,
            stripeTransferId: payout.stripeTransferId,
            debug: {
                reservedAt: payout.reservedAt,
                completedAt: payout.completedAt
            }
        });

    } catch (error) {
        request.log.error(`[Admin] Payout Trigger Failed: ${error.message}`, error);

        // Handle specific PaymentErrors
        if (error.type) {
            // Map known error codes to HTTP status
            const statusMap = {
                "ORDER_NOT_FOUND": 404,
                "ORDER_NOT_DELIVERED": 400,
                "FUNDS_NOT_RELEASED": 400, // Eligibility Gate
                "SELLER_ACCOUNT_INVALID": 400,
                "PAYMENT_ALREADY_EXISTS": 409, // Idempotency
                "PAYOUT_PROCESSING": 409,
                "INSUFFICIENT_FUNDS": 400
            };
            const statusCode = statusMap[error.code] || 400;

            return reply.code(statusCode).send({
                success: false,
                message: error.message,
                code: error.code,
                // Include critical details if available (e.g. for reconciliation)
                details: error.details
            });
        }

        // Generic / Unexpected Errors
        return reply.code(500).send({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};

// READ-ONLY: Check Payout Eligibility
// Exposes Step 10 Logic to Admin
const checkPayoutEligibility = async (request, reply) => {
    const { sellerUid, currency } = request.body;
    // validation is handled by schema or basic check here
    if (!sellerUid || !currency) {
        return reply.code(400).send({ message: "sellerUid and currency are required" });
    }

    try {
        const result = await payoutEligibilityService.checkSellerPayoutEligibility(sellerUid, currency);
        return reply.send(result);
    } catch (error) {
        request.log.error(`[Admin] Eligibility Check Failed: ${error.message}`, error);
        return reply.code(500).send({ message: "Internal Server Error" });
    }
};

module.exports = {
    triggerManualPayout,
    checkPayoutEligibility
};
