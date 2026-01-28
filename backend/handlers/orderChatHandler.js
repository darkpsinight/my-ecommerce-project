const { Order } = require("../models/order");
const { OrderMessage } = require("../models/orderMessage");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/responseHelpers");
const { User } = require("../models/user");

// @route   GET /api/v1/orders/:orderId/messages
// @desc    Get messages for an order
// @access  Private (Buyer or Seller of the order)
const getOrderMessages = async (request, reply) => {
    try {
        const { orderId } = request.params;
        const { uid } = request.user;

        // Resolve order (Strictly externalId only)
        const order = await Order.findOne({ externalId: orderId });

        if (!order) {
            return sendErrorResponse(reply, 404, "Order not found");
        }

        // Verify Access: Must be Buyer or Seller
        // Note: order.buyerId/sellerId are Strings (UIDs)
        const isBuyer = order.buyerId === uid;
        const isSeller = order.sellerId === uid;

        if (!isBuyer && !isSeller) {
            return sendErrorResponse(reply, 403, "Access denied. You are not a participant in this order.");
        }

        // Fetch messages
        const messages = await OrderMessage.find({ orderId: order._id })
            .sort({ createdAt: 1 }) // Oldest first
            .limit(100); // Reasonable limit for now

        return sendSuccessResponse(reply, {
            statusCode: 200,
            data: {
                messages,
                isDisputed: !!order.disputeId
            }
        });

    } catch (error) {
        request.log.error(`getOrderMessages error: ${error.message}`);
        return sendErrorResponse(reply, 500, "Failed to retrieve messages");
    }
};

// @route   POST /api/v1/orders/:orderId/messages
// @desc    Post a message to an order chat
// @access  Private (Buyer or Seller of the order)
const postOrderMessage = async (request, reply) => {
    try {
        const { orderId } = request.params;
        const { messageText } = request.body;
        const { uid } = request.user;

        // input validation
        if (!messageText || typeof messageText !== 'string' || !messageText.trim()) {
            return sendErrorResponse(reply, 400, "Message text is required");
        }

        if (messageText.length > 2000) {
            return sendErrorResponse(reply, 400, "Message exceeds 2000 characters");
        }

        // Resolve order (Strictly externalId only)
        const order = await Order.findOne({ externalId: orderId });

        if (!order) {
            return sendErrorResponse(reply, 404, "Order not found");
        }

        // Verify Access
        const isBuyer = order.buyerId === uid;
        const isSeller = order.sellerId === uid;

        if (!isBuyer && !isSeller) {
            return sendErrorResponse(reply, 403, "Access denied. You are not a participant in this order.");
        }

        // CHECK DISPUTE STATUS - READ ONLY IF DISPUTED
        if (order.disputeId) {
            return sendErrorResponse(reply, 403, "Chat is read-only because the order is in dispute.");
        }

        // Create Message
        const newMessage = await OrderMessage.create({
            orderId: order._id,
            senderUserId: request.user._id, // Internal Mongo ID
            senderUserUid: uid,             // External UID
            senderRole: isBuyer ? "buyer" : "seller",
            messageText: messageText.trim(),
            isSystem: false // User generated
        });

        return sendSuccessResponse(reply, {
            statusCode: 201,
            message: "Message sent",
            data: newMessage
        });

    } catch (error) {
        request.log.error(`postOrderMessage error: ${error.message}`);
        return sendErrorResponse(reply, 500, "Failed to send message");
    }
};

module.exports = {
    getOrderMessages,
    postOrderMessage
};
