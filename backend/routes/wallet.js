const { verifyAuth } = require("../plugins/authVerify");
const { walletSchema } = require("./schemas/walletSchema");
const {
  getWallet,
  createPaymentIntent,
  confirmPayment,
  getTransactions
} = require("../handlers/walletHandlers");
const { configs } = require("../configs");

// Rate limiting configurations
const rateLimits = {
  read: {
    windowMs: parseInt(configs.RATE_LIMIT_STANDARD_READ_WINDOW_MS),
    max: parseInt(configs.RATE_LIMIT_STANDARD_READ_MAX_REQUESTS),
  },
  write: {
    windowMs: parseInt(configs.RATE_LIMIT_STANDARD_WRITE_WINDOW_MS),
    max: parseInt(configs.RATE_LIMIT_STANDARD_WRITE_MAX_REQUESTS),
  },
  sensitive: {
    windowMs: parseInt(configs.RATE_LIMIT_SENSITIVE_WINDOW_MS),
    max: parseInt(configs.RATE_LIMIT_SENSITIVE_MAX_REQUESTS),
  }
};

const walletRoutes = async (fastify, opts) => {
  // Get wallet information
  fastify.route({
    config: {
      rateLimit: rateLimits.read
    },
    method: "GET",
    url: "/",
    preHandler: verifyAuth(["buyer", "seller", "admin"]), // Allow buyer, seller, and admin access
    schema: walletSchema.getWallet,
    handler: getWallet
  });

  // Create payment intent for wallet funding
  fastify.route({
    config: {
      rateLimit: rateLimits.sensitive
    },
    method: "POST",
    url: "/payment-intent",
    preHandler: verifyAuth(["buyer", "seller", "admin"]), // Allow buyer, seller, and admin access
    schema: walletSchema.createPaymentIntent,
    handler: createPaymentIntent
  });

  // Confirm payment and update wallet
  fastify.route({
    config: {
      rateLimit: rateLimits.write
    },
    method: "POST",
    url: "/confirm-payment",
    preHandler: verifyAuth(["buyer", "seller", "admin"]), // Allow buyer, seller, and admin access
    schema: walletSchema.confirmPayment,
    handler: confirmPayment
  });

  // Get transaction history
  fastify.route({
    config: {
      rateLimit: rateLimits.read
    },
    method: "GET",
    url: "/transactions",
    preHandler: verifyAuth(["buyer", "seller", "admin"]), // Allow buyer, seller, and admin access
    schema: walletSchema.getTransactions,
    handler: getTransactions
  });
};

module.exports = {
  walletRoutes
};
