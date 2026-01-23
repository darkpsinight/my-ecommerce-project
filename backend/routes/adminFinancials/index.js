const FinancialObservabilityService = require("../../services/financialObservability.service");
const { verifyAuth } = require("../../plugins/authVerify");

// Schema definitions for documentation/validation (Simplified for internal admin use)
const snapshotSchema = {
    response: {
        200: {
            type: "object",
            properties: {
                timestamp: { type: "string" },
                global_ledger: { type: "object", additionalProperties: true },
                payout_health: { type: "object", additionalProperties: true },
                integrity_check: { type: "object", additionalProperties: true }
            }
        }
    }
};

const traceSchema = {
    querystring: {
        type: "object",
        properties: {
            payoutId: { type: "string" },
            orderId: { type: "string" }
        }
    }
};

const auditLogSchema = {
    querystring: {
        type: "object",
        properties: {
            actorId: { type: "string" },
            targetId: { type: "string" },
            action: { type: "string" },
            startDate: { type: "string" },
            endDate: { type: "string" },
            limit: { type: "integer" },
            offset: { type: "integer" }
        }
    }
};

async function adminFinancialRoutes(fastify, options) {

    // 1. Financial Health Snapshot
    // Roles: admin, super_admin
    fastify.get("/financials/snapshot", {
        schema: snapshotSchema,
        preHandler: verifyAuth(["admin", "super_admin"])
    }, async (request, reply) => {
        try {
            const snapshot = await FinancialObservabilityService.getFinancialSnapshot();
            return snapshot;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ message: "Failed to generate snapshot" });
        }
    });

    // 2. Payout Lifecycle Trace
    // Roles: admin, support, super_admin
    fastify.get("/financials/trace", {
        schema: traceSchema,
        preHandler: verifyAuth(["admin", "support", "super_admin"])
    }, async (request, reply) => {
        try {
            const { payoutId, orderId } = request.query;
            const trace = await FinancialObservabilityService.getPayoutTrace({ payoutId, orderId });
            return trace;
        } catch (error) {
            request.log.error(error);
            return reply.code(400).send({ message: error.message });
        }
    });

    // 3. Admin Audit Logs
    // Roles: super_admin ONLY
    fastify.get("/audit-logs", {
        schema: auditLogSchema,
        preHandler: verifyAuth(["super_admin"])
    }, async (request, reply) => {
        try {
            const logs = await FinancialObservabilityService.getAuditLogs(request.query);
            return logs;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ message: "Failed to fetch audit logs" });
        }
    });

}

module.exports = adminFinancialRoutes;
