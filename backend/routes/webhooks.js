const {
  handleStripeWebhook,
  handleStripeConnectWebhook,
  getWebhookEvents,
  retryWebhookEvent,
  webhookHealthCheck
} = require("./webhooks/stripe");
const { verifyAuth } = require("../plugins/authVerify");

// Webhook routes configuration
async function webhookRoutes(fastify, options) {
  // Option A: Custom content type parser to capture raw body
  fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, function (req, body, done) {
    try {
      req.rawBody = body;
      const json = JSON.parse(body.toString());
      done(null, json);
    } catch (err) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  // Stripe platform webhook endpoint
  fastify.post("/stripe", {
    config: {
      rawBody: true // Preserve raw body for signature verification
    },
    schema: {
      description: "Handle Stripe platform webhook events",
      tags: ["webhooks"],
      headers: {
        type: "object",
        properties: {
          "stripe-signature": {
            type: "string",
            description: "Stripe webhook signature header"
          }
        },
        required: ["stripe-signature"]
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                received: { type: "boolean" },
                eventId: { type: "string" },
                processingTime: { type: "number" }
              }
            }
          }
        },
        400: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" }
          }
        },
        401: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" }
          }
        },
        500: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" }
          }
        }
      }
    }
  }, handleStripeWebhook);

  // Stripe Connect webhook endpoint
  fastify.post("/stripe/connect", {
    config: {
      rawBody: true
    },
    schema: {
      description: "Handle Stripe Connect webhook events",
      tags: ["webhooks"],
      headers: {
        type: "object",
        properties: {
          "stripe-signature": {
            type: "string",
            description: "Stripe webhook signature header"
          }
        },
        required: ["stripe-signature"]
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                received: { type: "boolean" },
                eventId: { type: "string" },
                processingTime: { type: "number" },
                source: { type: "string" }
              }
            }
          }
        }
      }
    }
  }, handleStripeConnectWebhook);

  // Get webhook events (admin only)
  fastify.get("/stripe/events", {
    preHandler: [
      verifyAuth(["admin"])
    ],
    schema: {
      description: "Get webhook event history",
      tags: ["webhooks", "admin"],
      security: [{ JWTToken: [] }],
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1, default: 1 },
          limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
          type: { type: "string", description: "Filter by event type" },
          source: {
            type: "string",
            enum: ["platform", "connect", "legacy"],
            description: "Filter by event source"
          },
          processed: {
            type: "boolean",
            description: "Filter by processing status"
          },
          startDate: {
            type: "string",
            format: "date-time",
            description: "Filter events after this date"
          },
          endDate: {
            type: "string",
            format: "date-time",
            description: "Filter events before this date"
          }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                events: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      _id: { type: "string" },
                      stripeEventId: { type: "string" },
                      type: { type: "string" },
                      source: { type: "string" },
                      processed: { type: "boolean" },
                      processingAttempts: { type: "number" },
                      createdAt: { type: "string", format: "date-time" },
                      processedAt: { type: "string", format: "date-time" }
                    }
                  }
                },
                pagination: {
                  type: "object",
                  properties: {
                    page: { type: "number" },
                    limit: { type: "number" },
                    total: { type: "number" },
                    pages: { type: "number" }
                  }
                },
                statistics: {
                  type: "object",
                  properties: {
                    total: { type: "number" },
                    processed: { type: "number" },
                    failed: { type: "number" },
                    avgProcessingAttempts: { type: "number" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, getWebhookEvents);

  // Retry webhook event processing (admin only)
  fastify.post("/stripe/events/:eventId/retry", {
    preHandler: [
      verifyAuth(["admin"])
    ],
    schema: {
      description: "Retry processing a failed webhook event",
      tags: ["webhooks", "admin"],
      security: [{ JWTToken: [] }],
      params: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "Webhook event ID to retry"
          }
        },
        required: ["eventId"]
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                eventId: { type: "string" },
                stripeEventId: { type: "string" },
                processingAttempts: { type: "number" },
                retryInitiated: { type: "boolean" }
              }
            }
          }
        },
        400: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" }
          }
        },
        404: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" }
          }
        }
      }
    }
  }, retryWebhookEvent);

  // Webhook system health check
  fastify.get("/stripe/health", {
    schema: {
      description: "Check webhook system health",
      tags: ["webhooks", "health"],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["healthy", "degraded", "unhealthy"]
                },
                processingRate: { type: "number" },
                recentEvents: { type: "number" },
                failedEvents: { type: "number" },
                configuredSecrets: {
                  type: "object",
                  properties: {
                    platform: { type: "boolean" },
                    connect: { type: "boolean" }
                  }
                },
                timestamp: { type: "string", format: "date-time" }
              }
            }
          }
        },
        503: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" }
          }
        }
      }
    }
  }, webhookHealthCheck);
}

module.exports = webhookRoutes;