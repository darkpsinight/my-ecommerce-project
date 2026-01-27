const { DisputeMessage } = require('../models/disputeMessage');
const { Dispute } = require('../models/dispute');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/responseHelpers');

// @route   GET /api/v1/disputes/:disputeId/messages
// @route   GET /api/v1/admin/disputes/:disputeId/messages
// @desc    Get all messages for a dispute
// @access  Private (Buyer/Seller/Admin/Support)
const getDisputeMessages = async (request, reply) => {
    request.log.info("handlers/getDisputeMessages - START");
    try {
        const { disputeId } = request.params;
        const { uid, roles } = request.user;

        // 1. Verify Access
        const dispute = await Dispute.findOne({ disputeId });

        if (!dispute) {
            return sendErrorResponse(reply, 404, "Dispute not found");
        }

        const isAdminOrSupport = roles.includes('admin') || roles.includes('support');
        const isBuyer = roles.includes('buyer') && dispute.buyerId === uid;
        const isSeller = roles.includes('seller') && dispute.sellerId === uid;

        if (!isAdminOrSupport && !isBuyer && !isSeller) {
            request.log.warn(`Access denied for dispute chat ${disputeId} by user ${uid}`);
            return sendErrorResponse(reply, 403, "Access denied");
        }

        // 2. Fetch Messages (Sorted Chronologically)
        const messages = await DisputeMessage.find({ disputeId })
            .sort({ createdAt: 1 })
            .lean();

        return sendSuccessResponse(reply, {
            statusCode: 200,
            message: "Messages retrieved successfully",
            data: messages
        });

    } catch (error) {
        request.log.error(`Error getting dispute messages: ${error.message}`);
        return sendErrorResponse(reply, 500, "Failed to get messages");
    }
};

// @route   POST /api/v1/disputes/:disputeId/messages
// @route   POST /api/v1/admin/disputes/:disputeId/messages
// @desc    Post a new message to a dispute
// @access  Private (Buyer/Seller/Admin/Support)
const postDisputeMessage = async (request, reply) => {
    request.log.info("handlers/postDisputeMessage - START");
    try {
        const { disputeId } = request.params;
        const { messageBody } = request.body;
        const { uid, roles } = request.user;

        // 1. Validate Input
        if (!messageBody || typeof messageBody !== 'string' || !messageBody.trim()) {
            return sendErrorResponse(reply, 400, "Message body is required");
        }

        if (messageBody.length > 2000) {
            return sendErrorResponse(reply, 400, "Message too long (max 2000 chars)");
        }

        // 2. Verify Dispute Existence & Access
        const dispute = await Dispute.findOne({ disputeId });

        if (!dispute) {
            return sendErrorResponse(reply, 404, "Dispute not found");
        }

        let senderRole;
        const isAdminOrSupport = roles.includes('admin') || roles.includes('support');
        const isBuyer = roles.includes('buyer') && dispute.buyerId === uid;
        const isSeller = roles.includes('seller') && dispute.sellerId === uid;

        if (isAdminOrSupport) {
            senderRole = 'ADMIN';
        } else if (isBuyer) {
            senderRole = 'BUYER';
        } else if (isSeller) {
            senderRole = 'SELLER';
        } else {
            request.log.warn(`Write access denied for dispute chat ${disputeId} by user ${uid}`);
            return sendErrorResponse(reply, 403, "Access denied");
        }

        // 3. Create Message (Append-Only)
        // Status Agnostic: We allow messages in any status (OPEN, CLOSED, etc.)

        const newMessage = await DisputeMessage.create({
            disputeId,
            senderRole,
            senderId: uid, // Derived strictly from auth
            messageBody: messageBody.trim()
        });

        request.log.info(`Message posted to dispute ${disputeId} by ${senderRole} (${uid})`);

        return sendSuccessResponse(reply, {
            statusCode: 201,
            message: "Message sent",
            data: newMessage
        });

    } catch (error) {
        request.log.error(`Error posting dispute message: ${error.message}`);
        return sendErrorResponse(reply, 500, "Failed to send message");
    }
};

module.exports = {
    getDisputeMessages,
    postDisputeMessage
};
