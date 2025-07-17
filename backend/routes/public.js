const { configCache } = require("../services/configCache");
const { Category } = require("../models/category");
const { getPublicSellerProfileById, getAllPublicSellerProfiles } = require("../handlers/publicSellerProfileHandler");
const { getFilterOptions, getPriceRange } = require("../handlers/publicFilterHandler");

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

  // Get all seller profiles (public endpoint)
  fastify.get("/sellers", {
    schema: {
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1, default: 1 },
          limit: { type: "integer", minimum: 1, maximum: 100, default: 24 },
          search: { type: "string" },
          sort: { type: "string", enum: ["newest", "oldest", "name"], default: "newest" }
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
                sellers: {
                  type: "array",
                  items: {
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
                            earnedAt: { type: "string" }
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
                      externalId: { type: "string" },
                      createdAt: { type: "string" }
                    }
                  }
                },
                total: { type: "integer" },
                totalPages: { type: "integer" },
                currentPage: { type: "integer" },
                hasNext: { type: "boolean" },
                hasPrevious: { type: "boolean" }
              }
            }
          }
        }
      }
    },
    handler: getAllPublicSellerProfiles
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
                about: { type: "string" },
                badges: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      icon: { type: "string" },
                      earnedAt: { type: "string" }
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
    handler: getPublicSellerProfileById
  });

  // Get dynamic filter options for products
  fastify.get("/filter-options", {
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
        errorResponseBuilder: function (req, context) {
          return {
            success: false,
            error: 'Too many filter requests',
            message: `Rate limit exceeded: maximum of 30 requests per minute. Please try again in ${context.after}`,
            retryAfter: context.after
          };
        }
      }
    },
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      _id: { type: "string" },
                      name: { type: "string" },
                      count: { type: "integer" }
                    }
                  }
                },
                platforms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      count: { type: "integer" }
                    }
                  }
                },
                regions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      count: { type: "integer" }
                    }
                  }
                },
                priceRange: {
                  type: "object",
                  properties: {
                    min: { type: "number" },
                    max: { type: "number" }
                  }
                }
              }
            }
          }
        }
      }
    },
    handler: getFilterOptions
  });

  // Get price range (separate endpoint for debounced requests)
  fastify.get("/price-range", {
    config: {
      rateLimit: {
        max: 60,
        timeWindow: '1 minute',
        errorResponseBuilder: function (req, context) {
          return {
            success: false,
            error: 'Too many price range requests',
            message: `Rate limit exceeded: maximum of 60 requests per minute. Please try again in ${context.after}`,
            retryAfter: context.after
          };
        }
      }
    },
    schema: {
      querystring: {
        type: "object",
        properties: {
          categoryId: { type: "string" },
          platform: { type: "string" },
          region: { type: "string" },
          search: { type: "string" }
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
                min: { type: "number" },
                max: { type: "number" }
              }
            }
          }
        }
      }
    },
    handler: getPriceRange
  });
}

module.exports = publicRoutes;