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

const { Order } = require("../models/order");
const { Listing } = require("../models/listing");
const { User } = require("../models/user");
const { Wallet } = require("../models/wallet");
const { Transaction } = require("../models/transaction");
const { configs } = require("../configs");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/responseHelpers");

// @route   POST /api/v1/orders/create
// @desc    Create a new order for digital codes
// @access  Private (buyer role required)
const createOrder = async (request, reply) => {
  request.log.info("handlers/createOrder - START");
  try {
    request.log.info("handlers/createOrder - Inside try block");
    const { cartItems, paymentMethod } = request.body;

    // Get user by uid from JWT token
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      request.log.error("handlers/createOrder - User not found");
      return sendErrorResponse(reply, 404, "User not found");
    }

    if (!user.roles.includes("buyer")) {
      request.log.error("handlers/createOrder - Buyer role required");
      return sendErrorResponse(reply, 403, "Buyer role required");
    }

    const buyerId = user._id;

    // Validate cart items
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      request.log.error("handlers/createOrder - Cart items are required");
      return sendErrorResponse(reply, 400, "Cart items are required");
    }

    let totalAmount = 0;
    const orderItems = [];
    const listingUpdates = [];

    // Process each cart item
    for (const cartItem of cartItems) {
      const { listingId, quantity } = cartItem;

      // Get listing with codes using externalId
      const listing = await Listing.findOne({ externalId: listingId }).select("+codes.code +codes.iv");
      if (!listing) {
        request.log.error(`handlers/createOrder - Listing ${listingId} not found`);
        return sendErrorResponse(reply, 404, `Listing ${listingId} not found`);
      }

      // Check if listing has enough active codes
      const activeCodes = listing.codes.filter(code => code.soldStatus === "active");
      if (activeCodes.length < quantity) {
        request.log.error(`handlers/createOrder - Not enough codes available for ${listing.title}`);
        return sendErrorResponse(reply, 400, `Not enough codes available for ${listing.title}. Available: ${activeCodes.length}, Requested: ${quantity}`);
      }

      // Select codes to purchase
      const codesToPurchase = activeCodes.slice(0, quantity);
      const itemTotal = listing.price * quantity;
      totalAmount += itemTotal;

      // Prepare order item
      const orderItem = {
        listingId: listing._id,
        title: listing.title,
        platform: listing.platform,
        region: listing.region,
        quantity,
        unitPrice: listing.price,
        totalPrice: itemTotal,
        purchasedCodes: codesToPurchase.map(code => ({
          codeId: code.codeId,
          code: code.code,
          iv: code.iv,
          expirationDate: code.expirationDate
        }))
      };

      console.log("Listing found:", {
        id: listing._id,
        externalId: listing.externalId,
        sellerId: listing.sellerId,
        title: listing.title,
        activeCodes: activeCodes.length
      });

      orderItems.push(orderItem);

      // Prepare listing updates (mark codes as sold)
      listingUpdates.push({
        listing,
        codeIds: codesToPurchase.map(code => code.codeId)
      });
    }

    // Get seller ID from the first listing (for now, assume single seller)
    // We already have the listing from the loop above, so we can get the seller ID from there
    const firstListingFromLoop = listingUpdates[0].listing;
    const seller = await User.findOne({ uid: firstListingFromLoop.sellerId });
    if (!seller) {
      request.log.error(`handlers/createOrder - Seller not found for uid: ${firstListingFromLoop.sellerId}`);
      return sendErrorResponse(reply, 404, "Seller not found");
    }

    // Create order
    const order = await Order.createOrder({
      buyerId,
      sellerId: seller._id, // Use seller's ObjectId
      orderItems,
      totalAmount,
      currency: "USD",
      paymentMethod
    });

    // Process payment based on method
    let paymentResult;
    if (paymentMethod === "stripe") {
      paymentResult = await processStripePayment(user, order, totalAmount);
    } else if (paymentMethod === "wallet") {
      paymentResult = await processWalletPayment(user, order, totalAmount);
    } else {
      request.log.error("handlers/createOrder - Invalid payment method");
      return sendErrorResponse(reply, 400, "Invalid payment method");
    }

    if (!paymentResult.success) {
      request.log.error(`handlers/createOrder - Payment failed: ${paymentResult.error}`);
      await order.markAsFailed(paymentResult.error);
      return sendErrorResponse(reply, 400, paymentResult.error);
    }

    // Update order with payment details
    order.paymentIntentId = paymentResult.paymentIntentId;
    order.transactionId = paymentResult.transactionId;
    await order.save();

    // Mark codes as sold in listings
    for (const update of listingUpdates) {
      for (const codeId of update.codeIds) {
        const codeIndex = update.listing.codes.findIndex(code => code.codeId === codeId);
        if (codeIndex !== -1) {
          update.listing.codes[codeIndex].soldStatus = "sold";
          update.listing.codes[codeIndex].soldAt = new Date();
        }
      }
      await update.listing.save();
    }

    // Mark order as completed
    await order.markAsCompleted();

    return sendSuccessResponse(reply, {
      statusCode: 201,
      message: "Order created successfully",
      data: {
        orderId: order.externalId,
        status: order.status,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        ...(paymentMethod === "stripe" && {
          clientSecret: paymentResult.clientSecret,
          paymentIntentId: paymentResult.paymentIntentId
        })
      }
    });

  } catch (error) {
    request.log.error(`handlers/createOrder - CATCH BLOCK: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to create order", {
      metadata: { hint: "Please try again later" }
    });
  }
};

// Helper function to process Stripe payment
const processStripePayment = async (user, order, amount) => {
  try {
    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const stripeInstance = getStripe();
      const customer = await stripeInstance.customers.create({
        email: user.email,
        metadata: {
          userId: user._id.toString(),
          orderId: order._id.toString()
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
      currency: "usd",
      customer: customerId,
      metadata: {
        userId: user._id.toString(),
        orderId: order._id.toString(),
        type: "digital_code_purchase"
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret
    };

  } catch (error) {
    return {
      success: false,
      error: `Stripe payment failed: ${error.message}`
    };
  }
};

// Helper function to process wallet payment
const processWalletPayment = async (user, order, amount) => {
  try {
    // Get user wallet
    const wallet = await Wallet.getWalletByUserId(user._id);
    if (!wallet) {
      return {
        success: false,
        error: "Wallet not found"
      };
    }

    // Check if wallet has sufficient balance
    if (wallet.balance < amount) {
      return {
        success: false,
        error: `Insufficient wallet balance. Available: $${wallet.balance}, Required: $${amount}`
      };
    }

    // Deduct amount from wallet
    await wallet.deductFunds(amount);

    // Create transaction record
    const transaction = await Transaction.createPurchaseTransaction({
      walletId: wallet._id,
      userId: user._id,
      amount,
      currency: "USD",
      relatedOrderId: order._id,
      balanceBefore: wallet.balance + amount // Balance before deduction
    });

    return {
      success: true,
      transactionId: transaction._id
    };

  } catch (error) {
    return {
      success: false,
      error: `Wallet payment failed: ${error.message}`
    };
  }
};

// @route   GET /api/v1/orders/buyer
// @desc    Get orders for the authenticated buyer
// @access  Private (buyer role required)
const getBuyerOrders = async (request, reply) => {
  request.log.info("handlers/getBuyerOrders");

  try {
    const { page = 1, limit = 10, status } = request.query;

    // Get user by uid from JWT token
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return sendErrorResponse(reply, 404, "User not found");
    }

    if (!user.roles.includes("buyer")) {
      return sendErrorResponse(reply, 403, "Buyer role required");
    }

    const result = await Order.getOrdersByBuyer(user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Orders retrieved successfully",
      data: result
    });

  } catch (error) {
    request.log.error(`Error getting buyer orders: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to get orders");
  }
};

// @route   GET /api/v1/orders/seller
// @desc    Get orders for the authenticated seller
// @access  Private (seller role required)
const getSellerOrders = async (request, reply) => {
  request.log.info("handlers/getSellerOrders");

  try {
    const { page = 1, limit = 10, status } = request.query;

    // Get user by uid from JWT token
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return sendErrorResponse(reply, 404, "User not found");
    }

    if (!user.roles.includes("seller")) {
      return sendErrorResponse(reply, 403, "Seller role required");
    }

    const result = await Order.getOrdersBySeller(user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Orders retrieved successfully",
      data: result
    });

  } catch (error) {
    request.log.error(`Error getting seller orders: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to get orders");
  }
};

module.exports = {
  createOrder,
  getBuyerOrders,
  getSellerOrders
};
