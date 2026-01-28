const { verifyAuth } = require('../plugins/authVerify');
const { listDisputes } = require('../handlers/adminDisputeHandler');

const adminDisputeRoutes = async (fastify, opts) => {
    // List Disputes
    fastify.route({
        method: 'GET',
        url: '/',
        preHandler: verifyAuth(['admin'], true),
        handler: listDisputes
    });

    // Get Dispute Detail
    fastify.route({
        method: 'GET',
        url: '/:disputeId',
        preHandler: verifyAuth(['admin', 'support'], true), // Allow support too
        handler: require('../handlers/adminDisputeHandler').getDisputeDetail
    });

    // Release Escrow
    fastify.route({
        method: 'POST',
        url: '/:disputeId/release',
        preHandler: verifyAuth(['admin', 'support'], true),
        handler: require('../handlers/adminDisputeHandler').releaseEscrow
    });

    // Refund to Wallet
    fastify.route({
        method: 'POST',
        url: '/:disputeId/refund-wallet',
        preHandler: verifyAuth(['admin', 'support'], true),
        handler: require('../handlers/adminDisputeHandler').refundToWallet
    });

    // Extend Dispute
    fastify.route({
        method: 'POST',
        url: '/:disputeId/extend',
        preHandler: verifyAuth(['admin', 'support'], true),
        handler: require('../handlers/adminDisputeHandler').extendDispute
    });
};

module.exports = { adminDisputeRoutes };
