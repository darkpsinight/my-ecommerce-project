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
const { decryptData, simpleDecrypt } = require("../utils/encryption");

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
        request.log.error(`handlers/createOrder - Not enough codes available for ${listing.title}. Available: ${activeCodes.length}, Requested: ${quantity}`);
        return sendErrorResponse(reply, 400, `Not enough codes available for ${listing.title}. Available: ${activeCodes.length}, Requested: ${quantity}`);
      }

      // Select codes to purchase
      const codesToPurchase = activeCodes.slice(0, quantity);
      const unitPrice = listing.discountedPrice || listing.price;
      const itemTotal = unitPrice * quantity;
      totalAmount += itemTotal;

      // Prepare order item
      const orderItem = {
        listingId: listing._id,
        title: listing.title,
        platform: listing.platform,
        region: listing.region,
        quantity,
        unitPrice: unitPrice,
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

    // Process payment based on method - Only wallet payments allowed
    let paymentResult;
    if (paymentMethod === "wallet") {
      paymentResult = await processWalletPayment(user, order, totalAmount);
    } else {
      request.log.error(`handlers/createOrder - Invalid payment method: ${paymentMethod}. Only wallet payments are allowed.`);
      return sendErrorResponse(reply, 400, "Only wallet payments are allowed for security reasons");
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

// @route   GET /api/v1/orders/buyer/codes
// @desc    Get all purchased codes for a buyer
// @access  Private (buyer role required)
const getBuyerPurchasedCodes = async (request, reply) => {
  request.log.info("handlers/getBuyerPurchasedCodes - START");
  try {
    // Get user by uid from JWT token
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      request.log.error("handlers/getBuyerPurchasedCodes - User not found");
      return sendErrorResponse(reply, 404, "User not found");
    }

    if (!user.roles.includes("buyer")) {
      request.log.error("handlers/getBuyerPurchasedCodes - Buyer role required");
      return sendErrorResponse(reply, 403, "Buyer role required");
    }

    const { 
      page = 1, 
      limit = 20, 
      search = "", 
      sortBy = "createdAt", 
      sortOrder = "desc" 
    } = request.query;

    // Build query for completed orders
    const query = { 
      buyerId: user._id, 
      status: "completed",
      deliveryStatus: "delivered"
    };

    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    const skip = (page - 1) * limit;

    // Get all completed orders with codes
    let orders = await Order.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .select("+orderItems.purchasedCodes.code +orderItems.purchasedCodes.iv")
      .populate("orderItems.listingId", "title platform region");

    // Transform orders into flattened codes array
    let codes = [];
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.purchasedCodes && item.purchasedCodes.length > 0) {
          item.purchasedCodes.forEach(purchasedCode => {
            // Decrypt the code before returning it
            let decryptedCode;
            try {
              if (purchasedCode.code && purchasedCode.iv) {
                decryptedCode = decryptData(purchasedCode.code, purchasedCode.iv);
                request.log.info(`Successfully decrypted code ${purchasedCode.codeId}`);
              } else {
                request.log.warn(`Missing code or IV for code ${purchasedCode.codeId}`);
                decryptedCode = "Error: Unable to decrypt code";
              }
            } catch (error) {
              request.log.error(`Failed to decrypt code ${purchasedCode.codeId}: ${error.message}`);
              decryptedCode = "Error: Failed to decrypt code";
            }

            codes.push({
              _id: purchasedCode._id,
              externalOrderId: order.externalId,
              productName: item.title,
              platform: item.platform,
              region: item.region,
              codeId: purchasedCode.codeId,
              code: decryptedCode, // Return the decrypted code
              expirationDate: purchasedCode.expirationDate,
              purchaseDate: order.createdAt,
              deliveredAt: purchasedCode.deliveredAt || order.deliveredAt
            });
          });
        }
      });
    });

    // Apply search filter if provided
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      codes = codes.filter(code => 
        code.productName.toLowerCase().includes(searchLower) ||
        code.platform.toLowerCase().includes(searchLower) ||
        code.region.toLowerCase().includes(searchLower)
      );
    }

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    
    // Estimate total codes (this is approximate)
    const totalCodes = codes.length;

    const result = {
      codes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCodes,
        pages: Math.ceil(totalCodes / limit),
        totalOrders
      }
    };

    request.log.info("handlers/getBuyerPurchasedCodes - SUCCESS");
    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Purchased codes retrieved successfully",
      data: result
    });

  } catch (error) {
    request.log.error(`Error getting buyer purchased codes: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to get purchased codes");
  }
};

// @route   GET /api/v1/orders/:orderId
// @desc    Get a specific order with codes
// @access  Private (buyer role required, must be order owner)
const getOrderById = async (request, reply) => {
  request.log.info("handlers/getOrderById - START");
  try {
    const { orderId } = request.params;

    // Get user by uid from JWT token
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      request.log.error("handlers/getOrderById - User not found");
      return sendErrorResponse(reply, 404, "User not found");
    }

    if (!user.roles.includes("buyer")) {
      request.log.error("handlers/getOrderById - Buyer role required");
      return sendErrorResponse(reply, 403, "Buyer role required");
    }

    // Find order by external ID or MongoDB ID
    let order;
    if (orderId.length === 24) {
      // MongoDB ObjectId
      order = await Order.findOne({ _id: orderId, buyerId: user._id });
    } else {
      // External UUID
      order = await Order.findOne({ externalId: orderId, buyerId: user._id });
    }

    if (!order) {
      request.log.error("handlers/getOrderById - Order not found");
      return sendErrorResponse(reply, 404, "Order not found");
    }

    // Include codes in response for completed orders
    if (order.status === "completed" && order.deliveryStatus === "delivered") {
      order = await Order.findById(order._id)
        .select("+orderItems.purchasedCodes.code +orderItems.purchasedCodes.iv")
        .populate("orderItems.listingId", "title platform region");
    }

    const result = {
      order: order.getBuyerOrderData()
    };

    request.log.info("handlers/getOrderById - SUCCESS");
    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Order retrieved successfully",
      data: result
    });

  } catch (error) {
    request.log.error(`Error getting order by ID: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to get order");
  }
};

// @route   POST /api/v1/orders/decrypt-code
// @desc    Decrypt a specific activation code
// @access  Private (buyer role required)
const decryptCode = async (request, reply) => {
  request.log.info("handlers/decryptCode - START");
  try {
    const { codeId, orderId } = request.body;
    const userId = request.user.userId;
    const userRole = request.user.role;

    // Find the order to verify ownership
    let order;
    if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
      // MongoDB ObjectId
      order = await Order.findById(orderId);
    } else {
      // External UUID
      order = await Order.findOne({ externalId: orderId });
    }

    if (!order) {
      request.log.error("handlers/decryptCode - Order not found");
      return sendErrorResponse(reply, 404, "Order not found");
    }

    // Authorization check - only buyers can decrypt their own codes
    if (userRole !== 'buyer' || order.buyerId.toString() !== userId) {
      request.log.error("handlers/decryptCode - Access denied");
      return sendErrorResponse(reply, 403, "Access denied");
    }

    // Find the specific code in the order
    let foundCode = null;
    for (const item of order.orderItems) {
      if (item.purchasedCodes) {
        foundCode = item.purchasedCodes.find(code => code.codeId === codeId);
        if (foundCode) break;
      }
    }

    if (!foundCode) {
      request.log.error("handlers/decryptCode - Code not found in order");
      return sendErrorResponse(reply, 404, "Code not found in this order");
    }

    // Decrypt the code
    let decryptedCode;
    try {
      if (foundCode.code && foundCode.iv) {
        // Code is encrypted with IV
        decryptedCode = decryptData(foundCode.code, foundCode.iv);
      } else {
        // Code might not be encrypted (legacy or plain text)
        decryptedCode = foundCode.code;
      }
    } catch (decryptError) {
      request.log.error('Decryption error:', decryptError);
      return sendErrorResponse(reply, 500, "Failed to decrypt code");
    }

    // Log the decryption access for security/audit purposes
    request.log.info(`Code decrypted - User: ${userId}, Order: ${order.externalId}, Code ID: ${codeId}`);

    return sendSuccessResponse(reply, 200, "Code decrypted successfully", {
      codeId,
      decryptedCode,
      expirationDate: foundCode.expirationDate
    });

  } catch (error) {
    request.log.error('Error in decryptCode handler:', error);
    return sendErrorResponse(reply, 500, "Internal server error");
  }
};

module.exports = {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  getBuyerPurchasedCodes,
  getOrderById,
  decryptCode
};
