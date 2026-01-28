const { sendSuccessResponse } = require('../utils/responseHelpers');
const { Dispute } = require('../models/dispute');

// Helper to sanitize pagination params
const getPaginationParams = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

// Helper to sanitize dispute object and normalize IDs
// Note: requires distinct logic depending on if order is populated or separate
const formatDisputeResponse = (dispute, orderExternalId = null) => {
    // If dispute.orderId is populated (is an object), use its externalId
    // If not, explicitly rely on the passed orderExternalId
    // If strictly neither, field is null (safe fallback)

    let publicOrderId = orderExternalId;

    if (!publicOrderId && dispute.orderId && typeof dispute.orderId === 'object' && dispute.orderId.externalId) {
        publicOrderId = dispute.orderId.externalId;
    }

    const { _id, externalId, stripeDisputeId, paymentIntentId, orderId, ...rest } = dispute;

    return {
        ...rest,
        orderPublicId: publicOrderId
    };
};

/**
 * Lists all disputes with pagination and optional filtering
 * GET /api/v1/admin/disputes
 */
const listDisputes = async (request, reply) => {
    const { page, limit, skip } = getPaginationParams(request.query);
    const { status, orderId } = request.query;

    const filter = {};
    if (status) filter.status = status;
    // Note: filtering by orderId now requires careful handling if the input is public ID vs internal ID.
    // Assuming admin passes internal IDs for now or we might need to look up internal ID from public ID if filtering.
    // For this strict observability step, we assume standard filtering.
    if (orderId) filter.orderId = orderId;

    const [disputesRaw, total] = await Promise.all([
        Dispute.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('orderId', 'externalId') // Fetch externalId for public exposure
            .lean(),
        Dispute.countDocuments(filter)
    ]);

    const disputes = disputesRaw.map(d => formatDisputeResponse(d));

    return sendSuccessResponse(reply, {
        statusCode: 200,
        message: 'Disputes retrieved successfully',
        data: {
            disputes,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
};

/**
 * Gets a single dispute detail for admin view
 * GET /api/v1/admin/disputes/:disputeId
 */
const getDisputeDetail = async (request, reply) => {
    const { disputeId } = request.params;
    const { Order } = require('../models/order');
    const { AuditLog } = require('../models/auditLog');

    // 1. Fetch Dispute (Strict Lookup by disputeId)
    const disputeRaw = await Dispute.findOne({ disputeId }).lean();


    if (!disputeRaw) {
        return sendSuccessResponse(reply, {
            statusCode: 404,
            message: 'Dispute not found'
        });
    }

    // 2. Fetch Order
    const order = await Order.findById(disputeRaw.orderId).lean();

    // 3. Format Dispute with public order ID
    const dispute = formatDisputeResponse(disputeRaw, order ? order.externalId : null);

    // 4. Build Order Snapshot
    const orderSnapshot = order ? {
        orderPublicId: order.externalId, // Strict replacement for orderId
        totalAmount: order.totalAmount,
        currency: order.currency,
        escrowStatus: order.escrowStatus,
        holdStartAt: order.holdStartAt,
        escrowHeldAt: order.escrowHeldAt,
    } : null;

    // 5. Fetch Audit Logs
    const auditLogs = await AuditLog.find({
        $or: [
            { targetId: disputeRaw.disputeId },
            { targetId: disputeRaw._id.toString() },
            { targetId: disputeRaw.orderId.toString() },
            { targetId: disputeRaw.paymentIntentId }
        ]
    }).lean();

    // 5. Construct Timeline
    const timeline = [];

    // Source 1: Dispute Creation
    timeline.push({
        id: `created_${disputeRaw.disputeId}`,
        timestamp: disputeRaw.createdAt,
        actor: 'SYSTEM',
        action: 'DISPUTE_CREATED',
        message: 'Dispute opened via Stripe',
        metadata: {
            reason: disputeRaw.reason
        }
    });

    // Source 2: System/Admin Events from AuditLog
    auditLogs.forEach(log => {
        timeline.push({
            id: log._id.toString(), // Map _id to id string
            timestamp: log.createdAt,
            actor: log.actorId === 'SYSTEM' ? 'SYSTEM' : 'ADMIN',
            action: log.action,
            message: log.errorMessage || log.action,
            metadata: log.metadata
        });
    });

    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return sendSuccessResponse(reply, {
        statusCode: 200,
        message: 'Dispute retrieved successfully',
        data: {
            dispute,
            orderSnapshot,
            timeline,
            messages: []
        }
    });
};



/**
 * Release Escrow to Seller (Dispute Resolution)
 * POST /api/v1/admin/disputes/:disputeId/release
 */
const releaseEscrow = async (request, reply) => {
    const { disputeId } = request.params;
    const { justification } = request.body;
    const adminUid = request.user.uid;

    if (!justification) {
        return sendSuccessResponse(reply, { statusCode: 400, message: "Justification is required" });
    }

    const dispute = await Dispute.findOne({ disputeId });
    if (!dispute) {
        return sendSuccessResponse(reply, { statusCode: 404, message: "Dispute not found" });
    }

    // Call Escrow Service
    // Note: EscrowService expects internal Order ID often, but we can pass external if it handles it.
    // Looking at EscrowService.releaseEscrow logic: it takes orderId and tries to find by externalId or internalId.
    // Dispute stores orderId as ObjectId. We should resolve specifically to be safe.

    // Actually, EscrowService.releaseEscrow takes (orderId, adminId). 
    // It does `Order.findOne({ externalId: orderId })`.
    // It's safer to pass the externalId if we have it, or the ObjectId string. 
    // Dispute model has orderId (ObjectId).
    // Let's rely on EscrowService strict lookup.

    // We need the order's externalId to be clean? 
    // EscrowService: "Fallback to internal ID if valid objectId". So passing dispute.orderId.toString() works.

    try {
        const escrowResult = await require('../services/payment/escrowService').releaseEscrow(dispute.orderId.toString(), adminUid);

        // Update Dispute to CLOSED/RESOLVED
        dispute.status = 'CLOSED'; // or WON/LOST based on context, but release to seller usually implies Seller Won
        dispute.metadata = {
            ...dispute.metadata,
            resolution: 'RELEASE_TO_SELLER',
            resolvedAt: new Date(),
            resolvedBy: adminUid,
            justification
        };
        await dispute.save();

        // Audit Log
        await require('../models/auditLog').AuditLog.create({
            action: 'ADMIN_RELEASE_ESCROW',
            status: 'SUCCESS',
            actorId: adminUid,
            actorRole: 'admin', // or support
            targetId: disputeId,
            targetType: 'Dispute',
            metadata: {
                orderId: dispute.orderId.toString(),
                escrowStatusBefore: 'held',
                escrowStatusAfter: 'released',
                justification,
                payoutId: escrowResult.payoutId
            }
        });

        return sendSuccessResponse(reply, {
            statusCode: 200,
            message: "Escrow released to seller",
            data: { disputeStatus: dispute.status }
        });
    } catch (error) {
        request.log.error(error);
        return sendSuccessResponse(reply, {
            statusCode: error.statusCode || 500,
            message: error.message
        });
    }
};

/**
 * Refund to Buyer Wallet (Dispute Resolution)
 * POST /api/v1/admin/disputes/:disputeId/refund-wallet
 */
const refundToWallet = async (request, reply) => {
    const { disputeId } = request.params;
    const { justification } = request.body;
    const adminUid = request.user.uid;

    if (!justification) {
        return sendSuccessResponse(reply, { statusCode: 400, message: "Justification is required" });
    }

    const dispute = await Dispute.findOne({ disputeId });
    if (!dispute) {
        return sendSuccessResponse(reply, { statusCode: 404, message: "Dispute not found" });
    }

    try {
        const result = await require('../services/payment/escrowService').refundToWallet(dispute.orderId.toString(), adminUid, justification);

        // Audit Log
        await require('../models/auditLog').AuditLog.create({
            action: 'ADMIN_REFUND_TO_WALLET',
            status: 'SUCCESS',
            actorId: adminUid,
            actorRole: 'admin',
            targetId: disputeId,
            targetType: 'Dispute',
            metadata: {
                orderId: dispute.orderId.toString(),
                escrowStatusBefore: 'held',
                escrowStatusAfter: result.newStatus,
                ledgerEntryId: result.ledgerEntryId,
                justification
            }
        });

        return sendSuccessResponse(reply, {
            statusCode: 200,
            message: "Refunded to buyer wallet",
            data: result
        });
    } catch (error) {
        request.log.error(error);
        return sendSuccessResponse(reply, {
            statusCode: error.statusCode || 500,
            message: error.message
        });
    }
};

/**
 * Extend Dispute Hold
 * POST /api/v1/admin/disputes/:disputeId/extend
 */
const extendDispute = async (request, reply) => {
    const { disputeId } = request.params;
    const { days, justification } = request.body;
    const adminUid = request.user.uid;

    if (!days || !Number.isInteger(days) || days <= 0) {
        return sendSuccessResponse(reply, { statusCode: 400, message: "Valid days (positive integer) required" });
    }

    const dispute = await Dispute.findOne({ disputeId });
    if (!dispute) {
        return sendSuccessResponse(reply, { statusCode: 404, message: "Dispute not found" });
    }

    const oldDate = dispute.evidenceDueBy || new Date();
    const newDate = new Date(oldDate);
    newDate.setDate(newDate.getDate() + days);

    dispute.evidenceDueBy = newDate;
    await dispute.save();

    // Audit Log
    await require('../models/auditLog').AuditLog.create({
        action: 'ADMIN_EXTEND_DISPUTE',
        status: 'SUCCESS',
        actorId: adminUid,
        actorRole: 'admin',
        targetId: disputeId,
        targetType: 'Dispute',
        metadata: {
            daysExtended: days,
            oldDate,
            newDate,
            justification
        }
    });

    return sendSuccessResponse(reply, {
        statusCode: 200,
        message: `Dispute extended by ${days} days`,
        data: { evidenceDueBy: newDate }
    });
};

module.exports = {
    listDisputes,
    getDisputeDetail,
    releaseEscrow,
    refundToWallet,
    extendDispute
};
