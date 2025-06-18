const { verifyAuth } = require("../plugins/authVerify");
const { orderSchema } = require("./schemas/orderSchema");
const {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  getBuyerPurchasedCodes,
  getOrderById,
  decryptCode
} = require("../handlers/orderHandlers");

// Rate limiting configurations
const rateLimits = {
  create: {
    max: 10, // 10 requests
    timeWindow: "1 minute"
  },
  read: {
    max: 100, // 100 requests
    timeWindow: "1 minute"
  }
};

const orderRoutes = async (fastify, opts) => {
  // Create a new order
  fastify.route({
    config: {
      rateLimit: rateLimits.create
    },
    method: "POST",
    url: "/create",
    preHandler: verifyAuth(["buyer"]),
    schema: orderSchema.createOrder,
    handler: createOrder
  });

  // Get buyer orders
  fastify.route({
    config: {
      rateLimit: rateLimits.read
    },
    method: "GET",
    url: "/buyer",
    preHandler: verifyAuth(["buyer"]),
    schema: orderSchema.getBuyerOrders,
    handler: getBuyerOrders
  });

  // Get seller orders
  fastify.route({
    config: {
      rateLimit: rateLimits.read
    },
    method: "GET",
    url: "/seller",
    preHandler: verifyAuth(["seller"]),
    schema: orderSchema.getSellerOrders,
    handler: getSellerOrders
  });

  // Get buyer purchased codes
  fastify.route({
    config: {
      rateLimit: rateLimits.read
    },
    method: "GET",
    url: "/buyer/codes",
    preHandler: verifyAuth(["buyer"]),
    schema: orderSchema.getBuyerPurchasedCodes,
    handler: getBuyerPurchasedCodes
  });

  // Get specific order by ID
  fastify.route({
    config: {
      rateLimit: rateLimits.read
    },
    method: "GET",
    url: "/:orderId",
    preHandler: verifyAuth(["buyer"]),
    schema: orderSchema.getOrderById,
    handler: getOrderById
  });

  // Decrypt a specific code
  fastify.route({
    config: {
      rateLimit: rateLimits.read
    },
    method: "POST",
    url: "/decrypt-code",
    preHandler: verifyAuth(["buyer"]),
    schema: orderSchema.decryptCode,
    handler: decryptCode
  });
};

module.exports = {
  orderRoutes
};
