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
};

module.exports = { adminDisputeRoutes };
