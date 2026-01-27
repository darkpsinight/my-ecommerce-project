const { sendSuccessResponse } = require('../utils/responseHelpers');
const { Dispute } = require('../models/dispute');

// Helper to sanitize pagination params
const getPaginationParams = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/**
 * Lists all disputes with pagination and optional filtering
 * GET /api/v1/admin/disputes
 * 
 * Query Params:
 * - page: number (default 1)
 * - limit: number (default 20, max 100)
 * - status: string (optional)
 * - orderId: string (optional)
 */
const listDisputes = async (request, reply) => {
    const { page, limit, skip } = getPaginationParams(request.query);
    const { status, orderId } = request.query;

    // Build filter object
    const filter = {};

    if (status) {
        filter.status = status;
    }

    if (orderId) {
        filter.orderId = orderId;
    }

    // Fetch Data
    const [disputes, total] = await Promise.all([
        Dispute.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Dispute.countDocuments(filter)
    ]);

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

module.exports = {
    listDisputes
};
