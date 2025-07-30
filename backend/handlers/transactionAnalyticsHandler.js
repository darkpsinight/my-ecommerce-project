const { Transaction } = require("../models/transaction");
const { Order } = require("../models/order");
const { User } = require("../models/user");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/responseHelpers");

/**
 * Get transaction success rate analytics for a seller
 * @route   GET /api/v1/seller/analytics/transaction-success-rate
 * @desc    Get transaction success rate metrics for seller
 * @access  Private (seller role required)
 */
const getTransactionSuccessRate = async (request, reply) => {
  request.log.info("handlers/getTransactionSuccessRate");

  try {
    // Get user by uid from JWT token
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return sendErrorResponse(reply, 404, "User not found");
    }

    if (!user.roles.includes("seller")) {
      return sendErrorResponse(reply, 403, "Seller role required");
    }

    const sellerId = user._id;
    const { timeRange = "30d", groupBy = "day" } = request.query;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get transaction success rate analytics
    const analyticsData = await getTransactionSuccessRateAnalytics(
      sellerId,
      startDate,
      now,
      groupBy
    );

    const responseData = {
      timeRange,
      groupBy,
      ...analyticsData,
      generatedAt: new Date(),
    };

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Transaction success rate analytics retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    request.log.error(`Error getting transaction success rate: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to retrieve transaction success rate analytics");
  }
};

/**
 * Helper function to get transaction success rate analytics
 */
const getTransactionSuccessRateAnalytics = async (sellerId, startDate, endDate, groupBy) => {
  // Get all transactions related to seller's orders
  const sellerOrders = await Order.find({
    sellerId: sellerId,
    createdAt: { $gte: startDate, $lte: endDate },
  }).select("_id transactionId paymentMethod status");

  const orderIds = sellerOrders.map(order => order._id);
  const transactionIds = sellerOrders
    .filter(order => order.transactionId)
    .map(order => order.transactionId);

  // Get transactions for funding (buyer wallet funding) and purchases
  const [fundingTransactions, purchaseTransactions] = await Promise.all([
    // Funding transactions (Stripe payments)
    Transaction.find({
      type: "funding",
      createdAt: { $gte: startDate, $lte: endDate },
    }),
    // Purchase transactions (wallet to seller)
    Transaction.find({
      $or: [
        { _id: { $in: transactionIds } },
        { relatedOrderId: { $in: orderIds } }
      ],
      type: "purchase",
      createdAt: { $gte: startDate, $lte: endDate },
    })
  ]);

  // Calculate overall success rates
  const fundingStats = calculateSuccessRate(fundingTransactions);
  const purchaseStats = calculateSuccessRate(purchaseTransactions);

  // Calculate combined success rate (all transaction types)
  const allTransactions = [...fundingTransactions, ...purchaseTransactions];
  const overallStats = calculateSuccessRate(allTransactions);

  // Get success rate by payment method
  const paymentMethodStats = await getSuccessRateByPaymentMethod(
    sellerId,
    startDate,
    endDate
  );

  // Get time-based trends
  const timeTrends = await getSuccessRateTrends(
    sellerId,
    startDate,
    endDate,
    groupBy
  );

  // Get failure analysis
  const failureAnalysis = await getFailureAnalysis(
    sellerId,
    startDate,
    endDate
  );

  return {
    overall: {
      totalTransactions: overallStats.total,
      successfulTransactions: overallStats.successful,
      failedTransactions: overallStats.failed,
      successRate: overallStats.successRate,
      failureRate: overallStats.failureRate,
    },
    byTransactionType: {
      funding: {
        totalTransactions: fundingStats.total,
        successfulTransactions: fundingStats.successful,
        failedTransactions: fundingStats.failed,
        successRate: fundingStats.successRate,
        failureRate: fundingStats.failureRate,
      },
      purchase: {
        totalTransactions: purchaseStats.total,
        successfulTransactions: purchaseStats.successful,
        failedTransactions: purchaseStats.failed,
        successRate: purchaseStats.successRate,
        failureRate: purchaseStats.failureRate,
      },
    },
    byPaymentMethod: paymentMethodStats,
    timeTrends: timeTrends,
    failureAnalysis: failureAnalysis,
  };
};

/**
 * Calculate success rate from transaction array
 */
const calculateSuccessRate = (transactions) => {
  const total = transactions.length;
  const successful = transactions.filter(t => t.status === "completed").length;
  const failed = transactions.filter(t => 
    ["failed", "cancelled"].includes(t.status)
  ).length;

  return {
    total,
    successful,
    failed,
    successRate: total > 0 ? Number(((successful / total) * 100).toFixed(2)) : 0,
    failureRate: total > 0 ? Number(((failed / total) * 100).toFixed(2)) : 0,
  };
};

/**
 * Get success rate by payment method
 */
const getSuccessRateByPaymentMethod = async (sellerId, startDate, endDate) => {
  // Get orders with their payment methods
  const orderStats = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$paymentMethod",
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        failedOrders: {
          $sum: { $cond: [{ $in: ["$status", ["failed", "cancelled"]] }, 1, 0] },
        },
      },
    },
  ]);

  // Get funding transaction stats by payment provider
  const fundingStats = await Transaction.aggregate([
    {
      $match: {
        type: "funding",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$paymentProvider",
        totalTransactions: { $sum: 1 },
        completedTransactions: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        failedTransactions: {
          $sum: { $cond: [{ $in: ["$status", ["failed", "cancelled"]] }, 1, 0] },
        },
      },
    },
  ]);

  // Combine and format results
  const paymentMethodMap = new Map();

  // Process order stats
  orderStats.forEach(stat => {
    const method = stat._id || "unknown";
    if (!paymentMethodMap.has(method)) {
      paymentMethodMap.set(method, {
        paymentMethod: method,
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
      });
    }
    
    const existing = paymentMethodMap.get(method);
    existing.totalTransactions += stat.totalOrders;
    existing.successfulTransactions += stat.completedOrders;
    existing.failedTransactions += stat.failedOrders;
  });

  // Process funding stats
  fundingStats.forEach(stat => {
    const method = stat._id || "unknown";
    if (!paymentMethodMap.has(method)) {
      paymentMethodMap.set(method, {
        paymentMethod: method,
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
      });
    }
    
    const existing = paymentMethodMap.get(method);
    existing.totalTransactions += stat.totalTransactions;
    existing.successfulTransactions += stat.completedTransactions;
    existing.failedTransactions += stat.failedTransactions;
  });

  // Calculate success rates
  return Array.from(paymentMethodMap.values()).map(stat => ({
    paymentMethod: stat.paymentMethod,
    totalTransactions: stat.totalTransactions,
    successfulTransactions: stat.successfulTransactions,
    failedTransactions: stat.failedTransactions,
    successRate: stat.totalTransactions > 0 
      ? Number(((stat.successfulTransactions / stat.totalTransactions) * 100).toFixed(2))
      : 0,
    failureRate: stat.totalTransactions > 0 
      ? Number(((stat.failedTransactions / stat.totalTransactions) * 100).toFixed(2))
      : 0,
  }));
};

/**
 * Get success rate trends over time
 */
const getSuccessRateTrends = async (sellerId, startDate, endDate, groupBy) => {
  // Determine grouping format based on groupBy parameter
  let groupFormat;
  switch (groupBy) {
    case "hour":
      groupFormat = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
        hour: { $hour: "$createdAt" },
      };
      break;
    case "day":
      groupFormat = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
      };
      break;
    case "week":
      groupFormat = {
        year: { $year: "$createdAt" },
        week: { $week: "$createdAt" },
      };
      break;
    case "month":
      groupFormat = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      };
      break;
    default:
      groupFormat = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
      };
  }

  // Get order trends
  const orderTrends = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: groupFormat,
        totalOrders: { $sum: 1 },
        successfulOrders: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        failedOrders: {
          $sum: { $cond: [{ $in: ["$status", ["failed", "cancelled"]] }, 1, 0] },
        },
      },
    },
    { $sort: { "_id": 1 } },
  ]);

  // Get funding transaction trends
  const fundingTrends = await Transaction.aggregate([
    {
      $match: {
        type: "funding",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: groupFormat,
        totalTransactions: { $sum: 1 },
        successfulTransactions: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        failedTransactions: {
          $sum: { $cond: [{ $in: ["$status", ["failed", "cancelled"]] }, 1, 0] },
        },
      },
    },
    { $sort: { "_id": 1 } },
  ]);

  // Combine trends and calculate success rates
  const trendMap = new Map();

  // Process order trends
  orderTrends.forEach(trend => {
    const key = JSON.stringify(trend._id);
    if (!trendMap.has(key)) {
      trendMap.set(key, {
        period: trend._id,
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
      });
    }
    
    const existing = trendMap.get(key);
    existing.totalTransactions += trend.totalOrders;
    existing.successfulTransactions += trend.successfulOrders;
    existing.failedTransactions += trend.failedOrders;
  });

  // Process funding trends
  fundingTrends.forEach(trend => {
    const key = JSON.stringify(trend._id);
    if (!trendMap.has(key)) {
      trendMap.set(key, {
        period: trend._id,
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
      });
    }
    
    const existing = trendMap.get(key);
    existing.totalTransactions += trend.totalTransactions;
    existing.successfulTransactions += trend.successfulTransactions;
    existing.failedTransactions += trend.failedTransactions;
  });

  // Calculate success rates and format results
  return Array.from(trendMap.values())
    .sort((a, b) => {
      // Sort by period
      const aKey = JSON.stringify(a.period);
      const bKey = JSON.stringify(b.period);
      return aKey.localeCompare(bKey);
    })
    .map(trend => ({
      period: trend.period,
      totalTransactions: trend.totalTransactions,
      successfulTransactions: trend.successfulTransactions,
      failedTransactions: trend.failedTransactions,
      successRate: trend.totalTransactions > 0 
        ? Number(((trend.successfulTransactions / trend.totalTransactions) * 100).toFixed(2))
        : 0,
      failureRate: trend.totalTransactions > 0 
        ? Number(((trend.failedTransactions / trend.totalTransactions) * 100).toFixed(2))
        : 0,
    }));
};

/**
 * Get failure analysis
 */
const getFailureAnalysis = async (sellerId, startDate, endDate) => {
  // Get failed transactions with error messages
  const failedTransactions = await Transaction.find({
    status: { $in: ["failed", "cancelled"] },
    createdAt: { $gte: startDate, $lte: endDate },
    errorMessage: { $exists: true, $ne: null },
  }).select("type errorMessage paymentProvider createdAt");

  // Get failed orders
  const failedOrders = await Order.find({
    sellerId: sellerId,
    status: { $in: ["failed", "cancelled"] },
    createdAt: { $gte: startDate, $lte: endDate },
    errorMessage: { $exists: true, $ne: null },
  }).select("paymentMethod errorMessage createdAt");

  // Analyze failure reasons
  const failureReasons = new Map();
  
  [...failedTransactions, ...failedOrders].forEach(item => {
    const reason = item.errorMessage || "Unknown error";
    if (!failureReasons.has(reason)) {
      failureReasons.set(reason, {
        reason,
        count: 0,
        percentage: 0,
      });
    }
    failureReasons.get(reason).count++;
  });

  const totalFailures = failedTransactions.length + failedOrders.length;
  
  // Calculate percentages and sort by frequency
  const failureAnalysis = Array.from(failureReasons.values())
    .map(item => ({
      ...item,
      percentage: totalFailures > 0 
        ? Number(((item.count / totalFailures) * 100).toFixed(2))
        : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 failure reasons

  return {
    totalFailures,
    topFailureReasons: failureAnalysis,
    failuresByType: {
      transactionFailures: failedTransactions.length,
      orderFailures: failedOrders.length,
    },
  };
};

module.exports = {
  getTransactionSuccessRate,
  getTransactionSuccessRateAnalytics,
};