const { verifyAuth } = require("../plugins/authVerify");
const {
  addViewedProduct,
  bulkAddViewedProducts,
  getViewedProducts,
  clearViewedProducts,
  removeViewedProduct,
  getViewingAnalytics
} = require("../handlers/viewedProductHandlers");

const {
  addViewedProductSchema,
  addAnonymousViewedProductSchema,
  bulkAddViewedProductsSchema,
  getViewedProductsSchema,
  clearViewedProductsSchema,
  removeViewedProductSchema,
  getViewingAnalyticsSchema
} = require("./schemas/viewedProductSchemas");

async function viewedProductRoutes(fastify, options) {

  // Add a viewed product (authenticated users)
  fastify.post('/', {
    preHandler: verifyAuth(["buyer"]),
    schema: addViewedProductSchema,
    handler: addViewedProduct
  });

  // Add a viewed product (anonymous users)
  fastify.post('/anonymous', {
    schema: addAnonymousViewedProductSchema,
    handler: addViewedProduct
  });

  // Bulk add viewed products (for localStorage migration)
  fastify.post('/bulk', {
    preHandler: verifyAuth(["buyer"]),
    schema: bulkAddViewedProductsSchema,
    handler: bulkAddViewedProducts
  });

  // Get user's viewed products
  fastify.get('/', {
    preHandler: verifyAuth(["buyer"]),
    schema: getViewedProductsSchema,
    handler: getViewedProducts
  });

  // Clear all viewed products for user
  fastify.delete('/', {
    preHandler: verifyAuth(["buyer"]),
    schema: clearViewedProductsSchema,
    handler: clearViewedProducts
  });

  // Remove a specific viewed product
  fastify.delete('/:viewId', {
    preHandler: verifyAuth(["buyer"]),
    schema: removeViewedProductSchema,
    handler: removeViewedProduct
  });

  // Get viewing analytics (admin/support only)
  fastify.get('/analytics', {
    preHandler: verifyAuth(["admin", "support"]),
    schema: getViewingAnalyticsSchema,
    handler: getViewingAnalytics
  });
}

module.exports = viewedProductRoutes;