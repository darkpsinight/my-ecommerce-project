const { verifyAuth } = require("../plugins/authVerify");

const supportRoutes = async (fastify, opts) => {
	// Get support profile
	fastify.route({
		method: "GET",
		url: "/profile",
		preHandler: verifyAuth(["support"]),
		handler: async (request, reply) => {
			try {
				return reply.code(200).send({
					success: true,
					data: request.user
				});
			} catch (error) {
				request.log.error(`Error in support profile: ${error.message}`);
				return reply.code(500).send({
					success: false,
					error: "Internal server error"
				});
			}
		}
	});

	// Add more support-specific routes here
};

module.exports = {
	supportRoutes,
};