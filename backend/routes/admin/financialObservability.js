const financialObservabilityController = require("../../controllers/financialObservabilityController");

async function financialObservabilityRoutes(fastify, options) {

    // Authorization Hook: Ensure Admin
    fastify.addHook("preHandler", async (req, reply) => {
        // Assume 'verifyAdmin' or similar exists in global decorators or we check user role
        // For now, adhering to existing pattern seen in other admin routes
        if (!req.user || req.user.role !== 'admin') {
            return reply.status(403).send({ error: "Admin access required" });
        }
    });

    fastify.get("/snapshot", financialObservabilityController.getFinancialSnapshot);
    fastify.get("/trace/:id", financialObservabilityController.getPayoutTrace);
    fastify.get("/audit-logs", financialObservabilityController.getAuditLogs);
}

module.exports = financialObservabilityRoutes;
