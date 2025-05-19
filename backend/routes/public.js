const { configCache } = require("../services/configCache");
const { Category } = require("../models/category");
const { getPublicSellerProfileById } = require("../handlers/publicSellerProfileHandler");

async function publicRoutes(fastify, options) {
  // Get all public configs
  fastify.get("/configs", {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            configs: {
              type: "object",
              additionalProperties: true
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const publicConfigs = {};

        // Iterate through all configs and filter public ones
        for (const [key, config] of configCache.cache.entries()) {
          if (config.isPublic) {
            publicConfigs[key] = config.value;
          }
        }

        fastify.log.info(`Public API: Fetching public configs. Found ${Object.keys(publicConfigs).length} configs`);

        return {
          configs: publicConfigs
        };
      } catch (error) {
        fastify.log.error(`Error fetching public configs: ${error.message}`);
        throw error;
      }
    }
  });

  // Get specific APP_NAME config (keeping for backward compatibility)
  fastify.get("/app-name", {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            appName: { type: "string" }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const appNameConfig = configCache.cache.get("APP_NAME");
        const appName = appNameConfig?.value || "My E-commerce App";

        fastify.log.info(`Public API: Fetching APP_NAME: ${appName}`);

        return {
          appName
        };
      } catch (error) {
        fastify.log.error(`Error fetching APP_NAME: ${error.message}`);
        throw error;
      }
    }
  });

  // Get active categories for public display
  fastify.get("/categories", {
    schema: {
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
                  imageUrl: { type: "string" }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        // Only fetch active categories with basic info needed for display
        const categories = await Category.find({ isActive: true })
          .select('_id name description imageUrl')
          .sort({ name: 1 });

        fastify.log.info(`Public API: Fetching categories. Found ${categories.length} active categories`);

        return {
          success: true,
          data: categories
        };
      } catch (error) {
        fastify.log.error(`Error fetching public categories: ${error.message}`);
        return reply.code(500).send({
          success: false,
          error: "Failed to fetch categories",
          message: error.message
        });
      }
    }
  });

  // Get seller profile by ID (public endpoint)
  fastify.get("/seller/:id", {
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
    handler: getPublicSellerProfileById
  });
}

module.exports = publicRoutes;