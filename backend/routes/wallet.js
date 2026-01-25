const { verifyAuth } = require("../plugins/authVerify");
const { walletSchema } = require("./schemas/walletSchema");
const {
  getWallet,
  createPaymentIntent,
  createTopUpRequest,
  createCheckoutSession,
  confirmPayment,
  getTransactions,
  fundWallet
} = require("../handlers/walletHandlers");
const WalletFeatureFlagMiddleware = require("../middleware/walletFeatureFlagMiddleware");
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
  // Fund Wallet (Step 23.3 - Controlled Exposure for DEV)
  fastify.route({
    config: {
      rateLimit: rateLimits.sensitive
    },
    method: "POST",
    url: "/fund",
    preHandler: verifyAuth(["buyer"]), // Strictly buyer only
    schema: {
      description: "Fund wallet (DEV ONLY - Step 23.3)",
      tags: ["Wallet"],
      body: {
        type: "object",
        properties: {
          amount: { type: "integer", minimum: 1 },
          currency: { type: "string", default: "USD" }
        },
        required: ["amount"]
      }
    },
    handler: fundWallet
  });

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

  // Create payment intent for wallet funding (legacy)
  fastify.route({
    config: {
      rateLimit: rateLimits.sensitive
    },
    method: "POST",
    url: "/payment-intent",
    preHandler: [
      verifyAuth(["buyer", "seller", "admin"]),
      WalletFeatureFlagMiddleware.requirePaymentsEnabled(),
      WalletFeatureFlagMiddleware.addWalletContext()
    ],
    schema: walletSchema.createPaymentIntent,
    handler: createPaymentIntent
  });

  // Create wallet top-up request using new payment adapter
  fastify.route({
    config: {
      rateLimit: rateLimits.sensitive
    },
    method: "POST",
    url: "/topup_request",
    preHandler: [
      verifyAuth(["buyer", "seller", "admin"]),
      WalletFeatureFlagMiddleware.requirePaymentsEnabled(),
      WalletFeatureFlagMiddleware.validateWalletOperation("topup"),
      WalletFeatureFlagMiddleware.addWalletContext()
    ],
    schema: walletSchema.createTopUpRequest,
    handler: createTopUpRequest
  });

  // Create Stripe Checkout session for wallet funding
  fastify.route({
    config: {
      rateLimit: rateLimits.sensitive
    },
    method: "POST",
    url: "/checkout-session",
    preHandler: [
      verifyAuth(["buyer", "seller", "admin"]),
      WalletFeatureFlagMiddleware.requirePaymentsEnabled(),
      WalletFeatureFlagMiddleware.addWalletContext()
    ],
    schema: walletSchema.createCheckoutSession,
    handler: createCheckoutSession
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
