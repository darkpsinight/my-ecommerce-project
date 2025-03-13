const { verifyAuth } = require("../plugins/authVerify");

const sellerRoutes = async (fastify, opts) => {
	// Get seller profile
	fastify.route({
		method: "GET",
		url: "/profile",
		preHandler: verifyAuth(["seller"]),
		handler: async (request, reply) => {
			try {
				return reply.code(200).send({
					success: true,
					data: request.user
				});
			} catch (error) {
				request.log.error(`Error in seller profile: ${error.message}`);
				return reply.code(500).send({
					success: false,
					error: "Internal server error"
				});
			}
		}
	});

	// Update seller profile
	fastify.route({
		method: "PUT",
		url: "/profile",
		preHandler: verifyAuth(["seller"]),
		handler: async (request, reply) => {
			try {
				// Add logic to update seller profile
				return reply.code(200).send({
					success: true,
					message: "Profile updated successfully"
				});
			} catch (error) {
				request.log.error(`Error updating seller profile: ${error.message}`);
				return reply.code(500).send({
					success: false,
					error: "Internal server error"
				});
			}
		}
	});

	// Get seller's products
	fastify.route({
		method: "GET",
		url: "/products",
		preHandler: verifyAuth(["seller"]),
		handler: async (request, reply) => {
			try {
				// Add logic to fetch seller's products
				return reply.code(200).send({
					success: true,
					data: []
				});
			} catch (error) {
				request.log.error(`Error fetching seller products: ${error.message}`);
				return reply.code(500).send({
					success: false,
					error: "Internal server error"
				});
			}
		}
	});

	// Get seller's orders
	fastify.route({
		method: "GET",
		url: "/orders",
		preHandler: verifyAuth(["seller"]),
		handler: async (request, reply) => {
			try {
				// Add logic to fetch seller's orders
				return reply.code(200).send({
					success: true,
					data: []
				});
			} catch (error) {
				request.log.error(`Error fetching seller orders: ${error.message}`);
				return reply.code(500).send({
					success: false,
					error: "Internal server error"
				});
			}
		}
	});
};

module.exports = {
	sellerRoutes,
};