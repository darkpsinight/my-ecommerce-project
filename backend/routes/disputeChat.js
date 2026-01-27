const { verifyAuth } = require('../plugins/authVerify');
const { getDisputeMessages, postDisputeMessage } = require('../handlers/disputeChatHandler');

// Rate limiting for chat posts
const chatRateLimits = {
    post: {
        max: 20, // 20 messages
        timeWindow: "1 minute"
    }
};

const disputeChatRoutes = async (fastify, opts) => {
    // GET messages
    fastify.route({
        method: 'GET',
        url: '/:disputeId/messages',
        preHandler: verifyAuth(['buyer', 'seller']),
        handler: getDisputeMessages
    });

    // POST message
    fastify.route({
        config: {
            rateLimit: chatRateLimits.post
        },
        method: 'POST',
        url: '/:disputeId/messages',
        preHandler: verifyAuth(['buyer', 'seller']),
        handler: postDisputeMessage
    });
};

module.exports = { disputeChatRoutes };
