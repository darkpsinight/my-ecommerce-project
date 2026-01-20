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
                    limit: parseInt(request.query.limit) || 20,
                    status: request.query.status,
                    currency: request.query.currency,
                    startDate: request.query.startDate,
                    endDate: request.query.endDate
                };

                const result = await SellerFinancialService.getPayouts(request.user.uid, options);
                return reply.send(result);
            } catch (error) {
                request.log.error(`Error fetching payouts: ${error}`);
                return reply.code(500).send({ message: 'Server Error' });
            }
        }
    });

    // GET /seller/payouts/:payoutId
    fastify.route({
        method: "GET",
        url: "/payouts/:payoutId",
        preHandler: verifyAuth(["seller"]),
        handler: async (request, reply) => {
            try {
                const { payoutId } = request.params;
                const result = await SellerFinancialService.getPayoutDetail(request.user.uid, payoutId);

                if (!result) {
                    return reply.code(404).send({ message: 'Payout not found' });
                }

                return reply.send(result);
            } catch (error) {
                request.log.error(`Error fetching payout detail: ${error}`);
                return reply.code(500).send({ message: 'Server Error' });
            }
        }
    });
};

module.exports = { sellerFinancialRoutes };
