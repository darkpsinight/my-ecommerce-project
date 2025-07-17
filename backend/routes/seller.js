const { verifyAuth } = require("../plugins/authVerify");
const { Category } = require("../models/category");
const { getPatternsForPlatform } = require("../utils/patternValidator");
const {
  getSellerProfile,
  updateBasicSellerInfo,
  updateExtendedSellerProfile,
  getSellerProfileById
} = require("../handlers/sellerProfileHandler");
const {
  getSellerAnalyticsOverview,
  getRevenueChartData
} = require("../handlers/sellerAnalyticsHandler");

const sellerRoutes = async (fastify, opts) => {
  // Get seller profile (basic user info + extended profile)
  fastify.route({
    method: "GET",
    url: "/profile",
    preHandler: verifyAuth(["seller", "admin"]),
    handler: getSellerProfile
  });

  // Update basic seller info
  fastify.route({
    method: "PUT",
    url: "/profile/basic",
    preHandler: verifyAuth(["seller", "admin"]),
    schema: {
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          // Email updates require additional verification, so we'll skip for now
        },
      },
    },
    handler: updateBasicSellerInfo
  });

  // Create or update seller profile
  fastify.route({
    method: "PUT",
    url: "/profile/extended",
    preHandler: verifyAuth(["seller", "admin"]),
    schema: {
      body: {
        type: "object",
        properties: {
          nickname: { type: "string", maxLength: 50 },
          profileImageUrl: { type: "string" },
          bannerImageUrl: { type: "string" },
          marketName: { type: "string", maxLength: 100 },
          about: { type: "string", maxLength: 500 },
          badges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                icon: { type: "string" },
                earnedAt: { type: "string", format: "date-time" }
              },
              required: ["name", "description", "icon"]
            }
          },
          enterpriseDetails: {
            type: "object",
            properties: {
              companyName: { type: "string" },
              website: { type: "string" },
              socialMedia: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    platform: { type: "string" },
                    url: { type: "string" }
                  },
                  required: ["platform", "url"]
                }
              }
            }
          }
        },
        required: ["nickname"]
      },
    },
    handler: updateExtendedSellerProfile
  });

  // Get seller profile by ID (authenticated endpoint)
  fastify.route({
    method: "GET",
    url: "/profile/:id",
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                nickname: { type: "string" },
                profileImageUrl: { type: "string" },
                bannerImageUrl: { type: "string" },
                marketName: { type: "string" },
                about: { type: "string" },
                badges: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      icon: { type: "string" },
                      earnedAt: { type: "string", format: "date-time" }
                    }
                  }
                },
                enterpriseDetails: {
                  type: "object",
                  properties: {
                    companyName: { type: "string" },
                    website: { type: "string" },
                    socialMedia: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          platform: { type: "string" },
                          url: { type: "string" }
                        }
                      }
                    }
                  }
                },
                externalId: { type: "string" }
              }
            }
          }
        },
        404: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string" }
          }
        }
      }
    },
    handler: getSellerProfileById
  });

  // Get seller's products
  fastify.route({
    method: "GET",
    url: "/products",
    preHandler: verifyAuth(["seller", "admin"]),
    handler: async (request, reply) => {
      try {
        // Add logic to fetch seller's products
        return reply.code(200).send({
          success: true,
          data: [],
        });
      } catch (error) {
        request.log.error(`Error fetching seller products: ${error.message}`);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
        });
      }
    },
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
          data: [],
        });
      } catch (error) {
        request.log.error(`Error fetching seller orders: ${error.message}`);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
        });
      }
    },
  });

  // Get validation patterns for a specific category and platform
  fastify.route({
    method: "GET",
    url: "/validation-patterns/:categoryId/:platformName",
    preHandler: verifyAuth(["seller"]),
    schema: {
      params: {
        type: "object",
        required: ["categoryId", "platformName"],
        properties: {
          categoryId: { type: "string" },
          platformName: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                patterns: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      regex: { type: "string" },
                      description: { type: "string" },
                      example: { type: "string" },
                      isActive: { type: "boolean" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { categoryId, platformName } = request.params;

        // Get patterns using the existing utility function
        const result = await getPatternsForPlatform(categoryId, platformName, Category);

        if (result.error) {
          return reply.code(404).send({
            success: false,
            error: result.error
          });
        }

        // Return only the patterns, not the full platform information
        return reply.code(200).send({
          success: true,
          data: {
            patterns: result.patterns || [],
            categoryId,
            platformName
          }
        });
      } catch (error) {
        request.log.error(`Error fetching validation patterns: ${error.message}`);
        return reply.code(500).send({
          success: false,
          error: "Internal server error"
        });
      }
    }
  });

  // Get active categories (for sellers to use in listings)
  fastify.route({
    method: "GET",
    url: "/categories",
    preHandler: verifyAuth(["seller"]),
    schema: {
      querystring: {
        type: "object",
        properties: {
          isActive: { type: "boolean", default: true },
          search: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string" },
                  imageUrl: { type: "string" },
                  platforms: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        imageUrl: { type: "string" },
                        isActive: { type: "boolean" }
                      }
                    }
                  },
                  isActive: { type: "boolean" }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { isActive = true, search } = request.query;

        // Build the query
        const query = { isActive };

        // Add search functionality if provided
        if (search) {
          query.name = { $regex: search, $options: 'i' };
        }

        // Find categories matching the query and include platforms information
        const categories = await Category.find(query).select('name description imageUrl platforms isActive');

        return reply.code(200).send({
          success: true,
          data: categories
        });
      } catch (error) {
        request.log.error(`Error fetching categories: ${error.message}`);
        return reply.code(500).send({
          success: false,
          error: "Failed to fetch categories",
          message: error.message
        });
      }
    }
  });

  // VIP Analytics Routes
  
  // Get seller analytics overview (VIP feature)
  fastify.route({
    method: "GET",
    url: "/analytics/overview",
    preHandler: verifyAuth(["seller"]),
    schema: {
      querystring: {
        type: "object",
        properties: {
          timeRange: { 
            type: "string", 
            enum: ["7d", "30d", "90d", "1y"],
            default: "30d" 
          }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                timeRange: { type: "string" },
                revenue: { type: "object" },
                sales: { type: "object" },
                inventory: { type: "object" },
                customers: { type: "object" },
                generatedAt: { type: "string", format: "date-time" }
              }
            }
          }
        }
      }
    },
    handler: getSellerAnalyticsOverview
  });

  // Get revenue chart data (VIP feature)
  fastify.route({
    method: "GET",
    url: "/analytics/revenue-chart",
    preHandler: verifyAuth(["seller"]),
    schema: {
      querystring: {
        type: "object",
        properties: {
          period: { 
            type: "string", 
            enum: ["daily", "weekly", "monthly"],
            default: "daily" 
          },
          timeRange: { 
            type: "string", 
            enum: ["7d", "30d", "90d", "1y"],
            default: "30d" 
          }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                chartData: { type: "array" },
                period: { type: "string" },
                timeRange: { type: "string" }
              }
            }
          }
        }
      }
    },
    handler: getRevenueChartData
  });
};

module.exports = {
  sellerRoutes,
};
