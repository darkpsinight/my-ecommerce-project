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
        preHandler: verifyAuth(['admin'], true),
        handler: require('../handlers/adminDisputeHandler').getDisputeDetail
    });
};

module.exports = { adminDisputeRoutes };
