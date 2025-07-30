const { verifyAuth } = require("../plugins/authVerify");
const {
  trackImpressions,
  markImpressionClicked,
  getImpressionAnalytics,
} = require("../handlers/impressionHandlers");

async function impressionRoutes(fastify, options) {
  // Public routes for impression tracking
  fastify.post("/impressions/track", {
    schema: {
      description: "Track listing impressions for CTR analytics",
      tags: ["Impressions"],
      body: {
        type: "object",
        required: ["impressions"],
        properties: {
          impressions: {
            type: "array",
            items: {
              type: "object",
              required: ["productId"],
              properties: {
                productId: { type: "string" },
                source: {
                  type: "string",
                  enum: [
                    "search_results",
                    "category_page",
                    "homepage_featured",
                    "recommendations",
                    "related_products",
                    "seller_profile",
                    "wishlist_page",
                    "trending",
                    "new_arrivals",
                    "other",
                  ],
                },
                position: { type: "number", minimum: 1 },
                totalItemsShown: { type: "number", minimum: 1 },
                searchQuery: { type: "string" },
                category: { type: "string" },
                platform: { type: "string" },
                deviceType: {
                  type: "string",
                  enum: ["desktop", "mobile", "tablet", "other"],
                },
                sessionId: { type: "string" },
                pageUrl: { type: "string" },
                referrer: { type: "string" },
                viewport: {
                  type: "object",
                  properties: {
                    isAboveFold: { type: "boolean" },
                    scrollPosition: { type: "number" },
                    viewportHeight: { type: "number" },
                    elementPosition: { type: "number" },
                  },
                },
                customerLocation: {
                  type: "object",
                  properties: {
                    country: { type: "string" },
                    countryCode: { type: "string" },
                    region: { type: "string" },
                    city: { type: "string" },
                    latitude: { type: "number" },
                    longitude: { type: "number" },
                    timezone: { type: "string" },
                  },
                },
              },
            },
          },
          anonymousId: { type: "string" },
        },
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
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      productId: { type: "string" },
                      impressionId: { type: "string" },
                      success: { type: "boolean" },
                      error: { type: "string" },
                    },
                  },
                },
                totalTracked: { type: "number" },
                totalFailed: { type: "number" },
              },
            },
          },
        },
      },
    },
    handler: trackImpressions,
  });

  fastify.post(
    "/impressions/click",
    {
      schema: {
        description: "Mark impression as clicked when user views product",
        tags: ["Impressions"],
        body: {
          type: "object",
          required: ["productId"],
          properties: {
            productId: { type: "string" },
            viewId: { type: "string" },
            anonymousId: { type: "string" },
          },
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
                  impressionId: { type: "string" },
                  productId: { type: "string" },
                  clickDelay: { type: "number" },
                  clickDelaySeconds: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    markImpressionClicked
  );

  // Protected routes for analytics
  fastify.get(
    "/impressions/analytics",
    {
      preHandler: verifyAuth(["seller", "admin"]),
      schema: {
        description: "Get impression and CTR analytics",
        tags: ["Impressions", "Analytics"],
        querystring: {
          type: "object",
          properties: {
            timeRange: {
              type: "string",
              enum: ["7d", "30d", "90d", "1y"],
              default: "30d",
            },
            groupBy: {
              type: "string",
              enum: ["product", "source"],
              default: "product",
            },
            includePosition: {
              type: "boolean",
              default: false,
            },
            productIds: { type: "string" },
          },
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
                  analytics: { type: "array" },
                  positionAnalysis: { type: "array" },
                  summary: {
                    type: "object",
                    properties: {
                      totalImpressions: { type: "number" },
                      totalClicks: { type: "number" },
                      overallCTR: { type: "number" },
                    },
                  },
                  timeRange: { type: "string" },
                  groupBy: { type: "string" },
                  generatedAt: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    getImpressionAnalytics
  );
}

module.exports = impressionRoutes;
