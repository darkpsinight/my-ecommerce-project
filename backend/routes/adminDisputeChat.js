const { verifyAuth } = require('../plugins/authVerify');
const { getDisputeMessages, postDisputeMessage } = require('../handlers/disputeChatHandler');

const adminDisputeChatRoutes = async (fastify, opts) => {
    // GET messages (Admin/Support)
    fastify.route({
        method: 'GET',
        url: '/:disputeId/messages',
        preHandler: verifyAuth(['admin', 'support']),
        handler: getDisputeMessages
    });

    // POST message (Admin/Support)
    fastify.route({
        method: 'POST',
        url: '/:disputeId/messages',
        preHandler: verifyAuth(['admin', 'support']),
        handler: postDisputeMessage
    });
};

module.exports = { adminDisputeChatRoutes };
