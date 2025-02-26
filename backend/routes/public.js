const { configCache } = require("../services/configCache");

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
}

module.exports = publicRoutes; 