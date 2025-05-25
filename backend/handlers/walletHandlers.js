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

    // Get or create wallet for user
    let wallet = await Wallet.getWalletByUserId(userId);

    if (!wallet) {
      wallet = await Wallet.createWalletForUser(userId, configs.WALLET_DEFAULT_CURRENCY);
    }

    // Get recent transactions (last 5)
    const recentTransactions = await Transaction.getTransactionsByUserId(userId, { limit: 5 });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Wallet information retrieved successfully",
      data: {
        wallet: {
          externalId: wallet.externalId,
          balance: wallet.balance,
          currency: wallet.currency,
          totalFunded: wallet.totalFunded,
          totalSpent: wallet.totalSpent,
          lastFundedAt: wallet.lastFundedAt,
          lastSpentAt: wallet.lastSpentAt,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt
        },
        recentTransactions: recentTransactions.map(tx => ({
          externalId: tx.externalId,
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          description: tx.description,
          createdAt: tx.createdAt
        }))
      }
    });
  } catch (error) {
    request.log.error(`Error getting wallet: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to retrieve wallet information", {
      metadata: { hint: "Please try again later" }
    });
  }
};

// @route   POST /api/v1/wallet/payment-intent
// @desc    Create Stripe payment intent for wallet funding
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

module.exports = {
  getWallet,
  createPaymentIntent,
  confirmPayment,
  getTransactions
};
