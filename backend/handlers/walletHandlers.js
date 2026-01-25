// Initialize Stripe lazily to avoid environment variable issues
let stripe = null;
const getStripe = () => {
  if (!stripe) {
    const stripeSecretKey = configs.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY configuration is not set");
    }
    stripe = require("stripe")(stripeSecretKey);
  }
  return stripe;
};
const { Wallet } = require("../models/wallet");
const { Transaction } = require("../models/transaction");
const { User } = require("../models/user");
const { LegacyWallet } = require("../models/legacyWallet");
const PaymentProcessor = require("../services/payment/paymentProcessor");
const WalletService = require("../services/wallet/walletService");
const { getWalletFeatureFlags } = require("../services/featureFlags/walletFeatureFlags");
const { configs } = require("../configs");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/responseHelpers");

// @route   GET /api/v1/wallet
// @desc    Get user's wallet information
// @access  Private (buyer role required)
const getWallet = async (request, reply) => {
  request.log.info("handlers/getWallet");

  try {
    // Get user by uid from JWT token to get MongoDB _id
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return sendErrorResponse(reply, 404, "User not found");
    }
    const userId = user._id;

    // Use wallet service to get comprehensive wallet information
    const walletService = new WalletService();
    const walletInfo = await walletService.getWalletInfo(userId);

    // Get recent transactions (last 5)
    const transactionHistory = await walletService.getTransactionHistory(userId, { limit: 5 });

    // Get or create platform wallet for backward compatibility
    let wallet = await Wallet.getWalletByUserId(userId);
    if (!wallet) {
      wallet = await Wallet.createWalletForUser(userId, configs.WALLET_DEFAULT_CURRENCY);
    }

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Wallet information retrieved successfully",
      data: {
        wallet: {
          externalId: wallet.externalId,
          balance: walletInfo.breakdown.platform.balanceDollars,
          legacyBalance: walletInfo.breakdown.legacy.balanceDollars,
          combinedBalance: walletInfo.totalBalanceDollars,
          currency: walletInfo.currency,
          totalFunded: wallet.totalFunded,
          totalSpent: wallet.totalSpent,
          lastFundedAt: wallet.lastFundedAt,
          lastSpentAt: wallet.lastSpentAt,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt
        },
        recentTransactions: transactionHistory.transactions.map(tx => ({
          externalId: tx.externalId,
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          description: tx.description,
          createdAt: tx.createdAt,
          source: tx.source
        })),
        featureFlags: walletInfo.featureFlags,
        spendingStrategy: walletInfo.spendingStrategy,
        migrationStatus: walletInfo.migrationStatus
      }
    });
  } catch (error) {
    request.log.error(`Error getting wallet: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to retrieve wallet information", {
      metadata: { hint: "Please try again later" }
    });
  }
};

// @route   POST /api/v1/wallet/fund
// @desc    Fund wallet using Stripe (DEV ONLY)
// @access  Private (buyer role required)
const fundWallet = async (request, reply) => {
  request.log.info("handlers/fundWallet");

  try {
    const { amount, currency = "USD" } = request.body;
    const buyerUid = request.user.uid;

    if (!amount || !Number.isInteger(amount) || amount <= 0) {
      return sendErrorResponse(reply, 400, "Amount must be a positive integer (cents)");
    }

    // Delegate to WalletFundingService
    const WalletFundingService = require("../services/payment/walletFunding");
    const result = await WalletFundingService.fundWallet(buyerUid, amount, currency);

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Wallet funded successfully",
      data: result
    });

  } catch (error) {
    request.log.error(`Error funding wallet: ${error.message}`);

    // Handle specific errors potentially thrown by service
    // For now generic 500 is safe as this is DEV-only
    return sendErrorResponse(reply, 500, "Failed to fund wallet", {
      metadata: { error: error.message }
    });
  }
};


// @route   POST /api/v1/wallet/topup_request
// @desc    Create wallet top-up request using new payment adapter with feature flag routing
// @access  Private (buyer role required)
const createTopUpRequest = async (request, reply) => {
  request.log.info("handlers/createTopUpRequest");

  try {
    const { amount, currency = configs.WALLET_DEFAULT_CURRENCY } = request.body;

    // Get user by uid from JWT token to get MongoDB _id
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return sendErrorResponse(reply, 404, "User not found");
    }
    const userId = user._id;

    // Validate amount
    const minAmount = configs.WALLET_MIN_FUNDING_AMOUNT;
    const maxAmount = configs.WALLET_MAX_FUNDING_AMOUNT;

    if (amount < minAmount || amount > maxAmount) {
      return sendErrorResponse(reply, 400, `Amount must be between ${minAmount} and ${maxAmount}`, {
        metadata: { hint: `Please enter an amount between ${minAmount} and ${maxAmount}` }
      });
    }

    // Get feature flags and determine topup method
    const featureFlags = getWalletFeatureFlags();
    const topUpMethod = featureFlags.getTopUpMethod(userId.toString());

    if (topUpMethod.method === "disabled") {
      return sendErrorResponse(reply, 503, "Wallet top-ups are currently disabled", {
        code: "TOPUP_DISABLED",
        reason: topUpMethod.reason
      });
    }

    // Get legacy balance for display
    let legacyBalance = 0;
    if (featureFlags.isLegacyWalletEnabled()) {
      try {
        const legacyWallet = await LegacyWallet.getByUserId(userId);
        if (legacyWallet) {
          legacyBalance = legacyWallet.balanceCents / 100;
        }
      } catch (error) {
        request.log.warn(`Could not retrieve legacy wallet for user ${userId}: ${error.message}`);
      }
    }

    let result;

    if (topUpMethod.method === "stripe_connect") {
      // Use new payment processor
      const paymentProcessor = new PaymentProcessor();

      const topUpRequest = {
        amountCents: Math.round(amount * 100),
        currency: currency.toUpperCase(),
        buyerId: userId.toString(),
        metadata: {
          source: "wallet_topup_request",
          userAgent: request.headers["user-agent"] || "unknown"
        }
      };

      const processorResult = await paymentProcessor.createWalletTopUpIntent(topUpRequest);

      result = {
        clientSecret: processorResult.clientSecret,
        paymentIntentId: processorResult.paymentIntentId,
        amount,
        currency: currency.toUpperCase(),
        method: "stripe_connect",
        legacyBalance
      };

    } else if (topUpMethod.method === "legacy") {
      // Fall back to legacy payment intent creation
      // Get or create wallet
      let wallet = await Wallet.getWalletByUserId(userId);
      if (!wallet) {
        wallet = await Wallet.createWalletForUser(userId, currency);
      }

      // Get or create Stripe customer
      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const stripeInstance = getStripe();
        const customer = await stripeInstance.customers.create({
          email: user.email,
          metadata: {
            userId: userId.toString(),
            walletId: wallet._id.toString()
          }
        });

        customerId = customer.id;
        user.stripeCustomerId = customerId;
        await user.save();
      }

      // Create payment intent using legacy method
      const stripeInstance = getStripe();
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        customer: customerId,
        metadata: {
          userId: userId.toString(),
          walletId: wallet._id.toString(),
          type: "wallet_funding",
          source: "legacy_topup_request"
        },
        automatic_payment_methods: {
          enabled: true
        }
      });

      // Create pending transaction record
      await Transaction.createFundingTransaction({
        walletId: wallet._id,
        userId,
        amount,
        currency,
        paymentIntentId: paymentIntent.id,
        balanceBefore: wallet.balance
      });

      result = {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        currency: currency.toUpperCase(),
        method: "legacy",
        legacyBalance
      };
    } else {
      return sendErrorResponse(reply, 503, "No available top-up methods", {
        code: "NO_TOPUP_METHODS",
        reason: topUpMethod.reason
      });
    }

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Top-up request created successfully",
      data: result
    });

  } catch (error) {
    request.log.error(`Error creating top-up request: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to create top-up request", {
      metadata: { hint: "Please try again later" }
    });
  }
};

// @route   POST /api/v1/wallet/payment-intent
// @desc    Create Stripe payment intent for wallet funding (legacy)
// @access  Private (buyer role required)
const createPaymentIntent = async (request, reply) => {
  request.log.info("handlers/createPaymentIntent");

  try {
    const { amount, currency = configs.WALLET_DEFAULT_CURRENCY } = request.body;

    // Get user by uid from JWT token to get MongoDB _id
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return sendErrorResponse(reply, 404, "User not found");
    }
    const userId = user._id;
    const userEmail = user.email;

    // Validate amount
    const minAmount = configs.WALLET_MIN_FUNDING_AMOUNT;
    const maxAmount = configs.WALLET_MAX_FUNDING_AMOUNT;

    if (amount < minAmount || amount > maxAmount) {
      return sendErrorResponse(reply, 400, `Amount must be between ${minAmount} and ${maxAmount}`, {
        metadata: { hint: `Please enter an amount between $${minAmount} and $${maxAmount}` }
      });
    }

    // Get or create wallet
    let wallet = await Wallet.getWalletByUserId(userId);
    if (!wallet) {
      wallet = await Wallet.createWalletForUser(userId, currency);
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const stripeInstance = getStripe();
      const customer = await stripeInstance.customers.create({
        email: userEmail,
        metadata: {
          userId: userId.toString(),
          walletId: wallet._id.toString()
        }
      });

      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Create payment intent
    const stripeInstance = getStripe();
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata: {
        userId: userId.toString(),
        walletId: wallet._id.toString(),
        type: "wallet_funding"
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    // Create pending transaction record
    await Transaction.createFundingTransaction({
      walletId: wallet._id,
      userId,
      amount,
      currency,
      paymentIntentId: paymentIntent.id,
      balanceBefore: wallet.balance
    });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Payment intent created successfully",
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        currency
      }
    });
  } catch (error) {
    request.log.error(`Error creating payment intent: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to create payment intent", {
      metadata: { hint: "Please try again later" }
    });
  }
};

// @route   POST /api/v1/wallet/confirm-payment
// @desc    Confirm payment and update wallet balance
// @access  Private (buyer role required)
const confirmPayment = async (request, reply) => {
  request.log.info("handlers/confirmPayment");

  try {
    const { paymentIntentId } = request.body;

    // Get user by uid from JWT token to get MongoDB _id
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return sendErrorResponse(reply, 404, "User not found");
    }
    const userId = user._id;

    // Retrieve payment intent from Stripe
    const stripeInstance = getStripe();
    const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return sendErrorResponse(reply, 400, "Payment not completed", {
        metadata: { hint: "Payment must be completed before confirming" }
      });
    }

    // Find the transaction
    const transaction = await Transaction.getTransactionByPaymentIntent(paymentIntentId);

    if (!transaction) {
      return sendErrorResponse(reply, 404, "Transaction not found");
    }

    if (transaction.userId.toString() !== userId.toString()) {
      return sendErrorResponse(reply, 403, "Unauthorized access to transaction");
    }

    if (transaction.status === "completed") {
      return sendErrorResponse(reply, 400, "Transaction already completed");
    }

    // Get wallet and update balance
    const wallet = await Wallet.findById(transaction.walletId);
    if (!wallet) {
      return sendErrorResponse(reply, 404, "Wallet not found");
    }

    // Update wallet balance
    await wallet.addFunds(transaction.amount);

    // Mark transaction as completed
    await transaction.markAsCompleted();

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Payment confirmed and wallet updated successfully",
      data: {
        transaction: {
          externalId: transaction.externalId,
          type: transaction.type,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          description: transaction.description,
          createdAt: transaction.createdAt
        },
        newBalance: wallet.balance
      }
    });
  } catch (error) {
    request.log.error(`Error confirming payment: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to confirm payment", {
      metadata: { hint: "Please try again later" }
    });
  }
};

// @route   GET /api/v1/wallet/transactions
// @desc    Get user's wallet transaction history
// @access  Private (buyer role required)
const getTransactions = async (request, reply) => {
  request.log.info("handlers/getTransactions");

  try {
    // Get user by uid from JWT token to get MongoDB _id
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return sendErrorResponse(reply, 404, "User not found");
    }
    const userId = user._id;
    const { page = 1, limit = 20, type, status } = request.query;

    // Get transactions with pagination
    const transactions = await Transaction.getTransactionsByUserId(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      status
    });

    // Get total count for pagination
    const query = { userId };
    if (type) query.type = type;
    if (status) query.status = status;

    const total = await Transaction.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Transaction history retrieved successfully",
      data: {
        transactions: transactions.map(tx => ({
          externalId: tx.externalId,
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          description: tx.description,
          balanceBefore: tx.balanceBefore,
          balanceAfter: tx.balanceAfter,
          createdAt: tx.createdAt,
          processedAt: tx.processedAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages
        }
      }
    });
  } catch (error) {
    request.log.error(`Error getting transactions: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to retrieve transaction history", {
      metadata: { hint: "Please try again later" }
    });
  }
};

// @route   POST /api/v1/wallet/checkout-session
// @desc    Create Stripe Checkout session for wallet funding
// @access  Private (buyer role required)
const createCheckoutSession = async (request, reply) => {
  request.log.info("handlers/createCheckoutSession");

  try {
    const { amount, currency = configs.WALLET_DEFAULT_CURRENCY } = request.body;

    // Get user by uid from JWT token to get MongoDB _id
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return sendErrorResponse(reply, 404, "User not found");
    }
    const userId = user._id;

    // Validate amount
    const minAmount = configs.WALLET_MIN_FUNDING_AMOUNT;
    const maxAmount = configs.WALLET_MAX_FUNDING_AMOUNT;

    if (amount < minAmount || amount > maxAmount) {
      return sendErrorResponse(reply, 400, `Amount must be between ${minAmount} and ${maxAmount}`, {
        metadata: { hint: `Please enter an amount between ${minAmount} and ${maxAmount}` }
      });
    }

    // Get or create wallet
    let wallet = await Wallet.getWalletByUserId(userId);
    if (!wallet) {
      wallet = await Wallet.createWalletForUser(userId, currency);
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const stripeInstance = getStripe();
      const customer = await stripeInstance.customers.create({
        email: user.email,
        metadata: {
          userId: userId.toString(),
          walletId: wallet._id.toString()
        }
      });

      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Create Stripe Checkout session
    const stripeInstance = getStripe();
    const session = await stripeInstance.checkout.sessions.create({
      customer_email: user.email, // Pre-fill email but allow editing
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: 'Digital Wallet Funding',
            description: `Add $${amount} to your digital wallet`
          },
          unit_amount: Math.round(amount * 100) // Convert to cents
        },
        quantity: 1
      }],
      mode: 'payment',
      ui_mode: 'embedded', // Use embedded checkout
      redirect_on_completion: 'never', // Prevent redirect
      metadata: {
        userId: userId.toString(),
        walletId: wallet._id.toString(),
        type: "wallet_funding",
        amount: amount.toString()
      }
    });

    // Create pending transaction record
    await Transaction.createFundingTransaction({
      walletId: wallet._id,
      userId,
      amount,
      currency,
      paymentIntentId: session.payment_intent, // Stripe Checkout creates a payment intent
      balanceBefore: wallet.balance
    });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Checkout session created successfully",
      data: {
        sessionId: session.id,
        clientSecret: session.client_secret, // For embedded checkout
        amount,
        currency: currency.toUpperCase()
      }
    });
  } catch (error) {
    request.log.error(`Error creating checkout session: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to create checkout session", {
      metadata: { hint: "Please try again later" }
    });
  }
};

module.exports = {
  getWallet,
  createPaymentIntent,
  createTopUpRequest,
  createCheckoutSession,
  confirmPayment,
  getTransactions,
  fundWallet
};
