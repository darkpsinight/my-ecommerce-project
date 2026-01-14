const { verifyAuth } = require("../plugins/authVerify");
const SellerFinancialService = require('../services/SellerFinancialService');

const sellerFinancialRoutes = async (fastify, opts) => {

    // GET /seller/balance
    fastify.route({
        method: "GET",
        url: "/balance",
        preHandler: verifyAuth(["seller"]),
        handler: async (request, reply) => {
            try {
                // request.user.uid comes from verifyAuth JWT decoding
                const balances = await SellerFinancialService.getBalances(request.user.uid);
                return reply.send(balances);
            } catch (error) {
                request.log.error(`Error fetching seller balance: ${error}`);
                return reply.code(500).send({ message: 'Server Error' });
            }
        }
    });

    // GET /seller/orders/financials
    fastify.route({
        method: "GET",
        url: "/orders/financials",
        preHandler: verifyAuth(["seller"]),
        handler: async (request, reply) => {
            try {
                const options = {
                    page: parseInt(request.query.page) || 1,
                    limit: parseInt(request.query.limit) || 20,
                    currency: request.query.currency,
                    escrowStatus: request.query.escrowStatus,
                    eligibilityStatus: request.query.eligibilityStatus
                };

                const result = await SellerFinancialService.getOrderFinancials(request.user.uid, options);
                return reply.send(result);
            } catch (error) {
                request.log.error(`Error fetching order financials: ${error}`);
                return reply.code(500).send({ message: 'Server Error' });
            }
        }
    });

    // GET /seller/payouts
    fastify.route({
        method: "GET",
        url: "/payouts",
        preHandler: verifyAuth(["seller"]),
        handler: async (request, reply) => {
            try {
                const options = {
                    page: parseInt(request.query.page) || 1,
                    limit: parseInt(request.query.limit) || 20
                };

                const result = await SellerFinancialService.getPayouts(request.user.uid, options);
                return reply.send(result);
            } catch (error) {
                request.log.error(`Error fetching payouts: ${error}`);
                return reply.code(500).send({ message: 'Server Error' });
            }
        }
    });
};

module.exports = { sellerFinancialRoutes };
