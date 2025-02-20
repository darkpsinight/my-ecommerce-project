const { getConfigs, updateConfig, deleteConfig } = require("../handlers/configHandler");
const { verifyAuth } = require("../plugins/authVerify");
const { adminSchema } = require("./schemas/adminSchema");
const { configSchema } = require("./schemas/configSchema");

const adminRoutes = async (fastify, opts) => {
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
};

module.exports = {
	adminRoutes,
};
