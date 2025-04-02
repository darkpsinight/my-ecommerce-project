const { verifyAuth } = require("../plugins/authVerify");
const { rateLimiter } = require("../plugins/rateLimiter");
const { sendErrorResponse } = require("../utils/responseHelpers");
const { configs } = require("../configs");

// Rate limit configurations using environment variables
const rateLimits = {
    standardRead: {
        windowMs: parseInt(configs.RATE_LIMIT_STANDARD_READ_WINDOW_MS),
        max: parseInt(configs.RATE_LIMIT_STANDARD_READ_MAX_REQUESTS)
    }
};

const userRoutes = async (fastify, opts) => {
    // Route to get user public information
    fastify.route({
        method: "GET",
        url: "/info",
        schema: {
            description: "Get user public information",
            tags: ["user"],
            response: {
                200: {
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        data: {
                            type: "object",
                            properties: {
                                email: { type: "string" },
                                name: { type: "string" },
                                role: { type: "string" }
                            }
                        }
                    }
                }
            },
            security: [{ JWTToken: [] }]
        },
        preHandler: [
            rateLimiter(rateLimits.standardRead),
            verifyAuth(["admin", "buyer", "seller", "support"])
        ],
        handler: async (request, reply) => {
            try {
                const { email, name, role } = request.user;
                return reply.code(200).send({
                    success: true,
                    data: {
                        email,
                        name,
                        role
                    }
                });
            } catch (error) {
                request.log.error(`Error getting user info: ${error.message}`);
                return sendErrorResponse(
                    reply,
                    500,
                    "Internal Server Error: Failed to get user information"
                );
            }
        }
    });
};

module.exports = {
    userRoutes
}; 