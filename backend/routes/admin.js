const { getConfigs, updateConfig, deleteConfig } = require("../handlers/configHandler");
const { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } = require("../handlers/categoryHandler");
const { addPlatform, getPlatforms, getPlatformByName, updatePlatform, deletePlatform } = require("../handlers/platformHandler");
const { verifyAuth } = require("../plugins/authVerify");
const { adminSchema } = require("./schemas/adminSchema");
const { configSchema } = require("./schemas/configSchema");
const { categorySchema } = require("./schemas/categorySchema");
const { platformSchema } = require("./schemas/platformSchema");

const adminRoutes = async (fastify, opts) => {
	// Config Routes
	// Get all configs
	fastify.route({
		method: "GET",
		url: "/configs",
		schema: configSchema.configsGet,
		preHandler: verifyAuth(["admin"], true),
		handler: getConfigs,
	});

	// Update or create config
	fastify.route({
		method: "POST",
		url: "/configs",
		schema: configSchema.configUpdate,
		preHandler: verifyAuth(["admin"], true),
		handler: updateConfig,
	});

	// Delete config (reset to default)
	fastify.route({
		method: "DELETE",
		url: "/configs/:key",
		schema: configSchema.configDelete,
		preHandler: verifyAuth(["admin"], true),
		handler: deleteConfig,
	});

	// Category Management Routes
	// Register rate limiting specific to category endpoints
	const categoryRateLimit = {
		create: {
			max: 20,
			timeWindow: "1 minute",
		},
		read: {
			max: 60,
			timeWindow: "1 minute",
		},
		update: {
			max: 30,
			timeWindow: "1 minute",
		},
		delete: {
			max: 10,
			timeWindow: "1 minute",
		},
	};

	// Create a new category
	fastify.route({
		method: "POST",
		url: "/categories",
		schema: categorySchema.categoryCreate,
		preHandler: [
			verifyAuth(["admin"], true),
			fastify.rateLimit(categoryRateLimit.create),
		],
		handler: createCategory,
	});

	// Get all categories with pagination
	fastify.route({
		method: "GET",
		url: "/categories",
		schema: categorySchema.categoriesGet,
		preHandler: [
			verifyAuth(["admin"], true),
			fastify.rateLimit(categoryRateLimit.read),
		],
		handler: getCategories,
	});

	// Get category by ID
	fastify.route({
		method: "GET",
		url: "/categories/:id",
		schema: categorySchema.categoryGet,
		preHandler: [
			verifyAuth(["admin"], true),
			fastify.rateLimit(categoryRateLimit.read),
		],
		handler: getCategoryById,
	});

	// Update category
	fastify.route({
		method: "PUT",
		url: "/categories/:id",
		schema: categorySchema.categoryUpdate,
		preHandler: [
			verifyAuth(["admin"], true),
			fastify.rateLimit(categoryRateLimit.update),
		],
		handler: updateCategory,
	});

	// Delete category
	fastify.route({
		method: "DELETE",
		url: "/categories/:id",
		schema: categorySchema.categoryDelete,
		preHandler: [
			verifyAuth(["admin"], true),
			fastify.rateLimit(categoryRateLimit.delete),
		],
		handler: deleteCategory,
	});

	// Platform Management Routes
	// Register rate limiting specific to platform endpoints
	const platformRateLimit = {
		create: {
			max: 20,
			timeWindow: "1 minute",
		},
		read: {
			max: 60,
			timeWindow: "1 minute",
		},
		update: {
			max: 30,
			timeWindow: "1 minute",
		},
		delete: {
			max: 10,
			timeWindow: "1 minute",
		},
	};

	// Add a new platform to a category
	fastify.route({
		method: "POST",
		url: "/categories/:categoryId/platforms",
		schema: platformSchema.platformAdd,
		preHandler: [
			verifyAuth(["admin"], true),
			fastify.rateLimit(platformRateLimit.create),
		],
		handler: addPlatform,
	});

	// Get all platforms for a category
	fastify.route({
		method: "GET",
		url: "/categories/:categoryId/platforms",
		schema: platformSchema.platformsGet,
		preHandler: [
			verifyAuth(["admin"], true),
			fastify.rateLimit(platformRateLimit.read),
		],
		handler: getPlatforms,
	});

	// Get platform by name
	fastify.route({
		method: "GET",
		url: "/categories/:categoryId/platforms/:platformName",
		schema: platformSchema.platformGet,
		preHandler: [
			verifyAuth(["admin"], true),
			fastify.rateLimit(platformRateLimit.read),
		],
		handler: getPlatformByName,
	});

	// Update platform
	fastify.route({
		method: "PUT",
		url: "/categories/:categoryId/platforms/:platformName",
		schema: platformSchema.platformUpdate,
		preHandler: [
			verifyAuth(["admin"], true),
			fastify.rateLimit(platformRateLimit.update),
		],
		handler: updatePlatform,
	});

	// Delete platform
	fastify.route({
		method: "DELETE",
		url: "/categories/:categoryId/platforms/:platformName",
		schema: platformSchema.platformDelete,
		preHandler: [
			verifyAuth(["admin"], true),
			fastify.rateLimit(platformRateLimit.delete),
		],
		handler: deletePlatform,
	});

	// Escrow Management Routes
	const { releaseEscrow, refundEscrow } = require("../handlers/escrowHandlers");

	fastify.route({
		method: "POST",
		url: "/orders/:orderId/escrow/release",
		schema: {
			params: {
				type: "object",
				properties: { orderId: { type: "string" } },
				required: ["orderId"]
			}
		},
		preHandler: verifyAuth(["admin"], true),
		handler: releaseEscrow,
	});

	fastify.route({
		method: "POST",
		url: "/orders/:orderId/escrow/refund",
		schema: {
			params: {
				type: "object",
				properties: { orderId: { type: "string" } },
				required: ["orderId"]
			},
			body: {
				type: "object",
				properties: { reason: { type: "string" } }
			}
		},
		preHandler: verifyAuth(["admin"], true),
		handler: refundEscrow,
	});
};

module.exports = {
	adminRoutes,
};
