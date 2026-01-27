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

module.exports = {
    listDisputes,
    getDisputeDetail
};
