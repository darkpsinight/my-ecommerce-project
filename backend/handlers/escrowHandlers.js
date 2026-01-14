const { Order } = require("../models/order");
const { User } = require("../models/user");
const { SellerProfile } = require("../models/sellerProfile");
const ledgerService = require("../services/payment/ledgerService");

const releaseEscrow = async (request, reply) => {
    // ... identifying existing code ...
    const { orderId } = request.params;
    const adminId = request.user.uid;

    try {
        const result = await escrowService.releaseEscrow(orderId, adminId);
        reply.code(200).send(result);
    } catch (error) {
        // ...
        request.log.error(error);
        reply.code(500).send({ message: error.message });
    }
};

// ADMIN SAFETY VALVE - OPERATIONAL ENDPOINT
// FORCE RELEASE ESCROW (Bypasses Time Holds, Respects Seller Status)
// Use Case: Admin manually releasing funds for an order that is stuck or approved for early release.
// Constraints: 
// 1. Seller MUST be ACTIVE.
// 2. Order MUST NOT be already eligible.
// 3. Creates strict Ledger Entries (Debit Locked / Credit Available).
const forceReleaseFunds = async (request, reply) => {
    const { orderId } = request.params;
    const adminId = request.user.uid;
    const { reason } = request.body || {}; // Optional reason for audit

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return reply.code(404).send({ message: "Order not found", code: "ORDER_NOT_FOUND" });
        }

        // Idempotency / Logic Guard
        if (order.eligibilityStatus === 'ELIGIBLE_FOR_PAYOUT') {
            return reply.code(400).send({ message: "Order already eligible for payout", code: "ALREADY_ELIGIBLE" });
        }

        // 1. Check Seller Status (Strict: MUST BE ACTIVE)
        // SellerProfile is linked via ObjectId, but Order uses UID. Resolve first.
        const sellerUser = await User.findOne({ uid: order.sellerId });
        if (!sellerUser) {
            return reply.code(404).send({ message: "Seller User not found", code: "SELLER_NOT_FOUND" });
        }

        const sellerProfile = await SellerProfile.findOne({ userId: sellerUser._id });
        if (!sellerProfile || sellerProfile.riskStatus !== 'ACTIVE') {
            // Strict check: Fail if missing or not ACTIVE. 
            // Admin cannot bypass suspension via this endpoint (requires separate Seller Override).
            return reply.code(403).send({
                message: `Cannot force release. Seller is ${sellerProfile ? sellerProfile.riskStatus : 'UNKNOWN'}. Must be ACTIVE.`,
                code: "SELLER_STATUS_BLOCK"
            });
        }

        // 2. Update Timestamps (Bypass Time Holds)
        order.releaseExpectedAt = new Date();

        // 3. Execute Ledger Release (Atomic)
        // Creates 'escrow_release_debit' (Locked) & 'escrow_release_credit' (Available)
        const amountCents = Math.round(order.totalAmount * 100);
        const result = await ledgerService.releaseFunds(order, amountCents);

        if (result.success || result.skipped) {
            order.eligibilityStatus = 'ELIGIBLE_FOR_PAYOUT';
            order.escrowReleasedAt = new Date();

            // Audit Metadata
            order.metadata = {
                ...order.metadata,
                forceReleasedBy: adminId,
                forceReleasedAt: new Date(),
                releaseType: "ADMIN_FORCE_RELEASE", // Formal Production Tag
                releaseReason: reason || "Admin manual intervention"
            };
            await order.save();

            return reply.send({
                success: true,
                message: "Funds force released successfully",
                status: order.eligibilityStatus,
                result
            });
        } else {
            return reply.code(500).send({ message: "Ledger transaction failed to commit" });
        }

    } catch (error) {
        request.log.error(error);
        reply.code(500).send({ message: error.message || "Internal Server Error" });
    }
};

const refundEscrow = async (request, reply) => {
    // ... existing ...
    const { orderId } = request.params;
    // ...
    try {
        const result = await escrowService.refundEscrow(orderId, request.user.uid, request.body?.reason);
        reply.send(result);
    } catch (err) {
        reply.code(500).send({ message: err.message });
    }
};

module.exports = {
    releaseEscrow,
    refundEscrow,
    forceReleaseFunds
};
