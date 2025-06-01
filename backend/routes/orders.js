const { verifyAuth } = require("../plugins/authVerify");
const { orderSchema } = require("./schemas/orderSchema");
const {
  createOrder,
  getBuyerOrders,
  getSellerOrders
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
};

module.exports = {
  orderRoutes
};
