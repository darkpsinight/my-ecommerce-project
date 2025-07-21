const { Order } = require("../models/order");
const { Listing } = require("../models/listing");
const { User } = require("../models/user");
const { Transaction } = require("../models/transaction");
const ViewedProduct = require("../models/viewedProduct");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/responseHelpers");

// @route   GET /api/v1/seller/analytics/overview
// @desc    Get seller analytics overview for VIP sellers
// @access  Private (seller role required)
const getSellerAnalyticsOverview = async (request, reply) => {
  request.log.info("handlers/getSellerAnalyticsOverview");

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
    const { timeRange = "30d" } = request.query;

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

    // Get revenue analytics
    const revenueData = await getRevenueAnalytics(sellerId, startDate, now);
    
    // Get sales analytics
    const salesData = await getSalesAnalytics(sellerId, startDate, now);
    
    // Get inventory analytics
    const inventoryData = await getInventoryAnalytics(sellerId);
    
    // Get customer analytics
    const customerData = await getCustomerAnalytics(sellerId, startDate, now);
    
    // Get engagement analytics (listing views)
    const engagementData = await getEngagementAnalytics(sellerId, startDate, now);

    const responseData = {
      timeRange,
      revenue: revenueData,
      sales: salesData,
      inventory: inventoryData,
      customers: customerData,
      engagement: engagementData,
      generatedAt: new Date(),
    };

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Seller analytics retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    request.log.error(`Error getting seller analytics: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to retrieve analytics");
  }
};

// Helper function to get revenue analytics
const getRevenueAnalytics = async (sellerId, startDate, endDate) => {
  // Total revenue in time period
  const revenueAggregation = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId,
        status: "completed",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: "$totalAmount" },
      },
    },
  ]);

  // Revenue by platform
  const revenueByPlatform = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId,
        status: "completed",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    { $unwind: "$orderItems" },
    {
      $group: {
        _id: "$orderItems.platform",
        revenue: { $sum: "$orderItems.totalPrice" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  // Daily revenue trend
  const dailyRevenue = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId,
        status: "completed",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  const baseStats = revenueAggregation[0] || {
    totalRevenue: 0,
    orderCount: 0,
    avgOrderValue: 0,
  };

  // Convert MongoDB objects to plain JavaScript objects
  return {
    totalRevenue: Number(baseStats.totalRevenue || 0),
    orderCount: Number(baseStats.orderCount || 0),
    avgOrderValue: Number(baseStats.avgOrderValue || 0),
    revenueByPlatform: revenueByPlatform.map((item) => ({
      platform: String(item._id),
      revenue: Number(item.revenue),
      orders: Number(item.orders),
    })),
    dailyTrend: dailyRevenue.map((item) => ({
      date: {
        year: Number(item._id.year),
        month: Number(item._id.month),
        day: Number(item._id.day),
      },
      revenue: Number(item.revenue),
      orders: Number(item.orders),
    })),
  };
};

// Helper function to get sales analytics
const getSalesAnalytics = async (sellerId, startDate, endDate) => {
  // Best selling products
  const bestSellers = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId,
        status: "completed",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    { $unwind: "$orderItems" },
    {
      $group: {
        _id: "$orderItems.listingId",
        title: { $first: "$orderItems.title" },
        platform: { $first: "$orderItems.platform" },
        totalSold: { $sum: "$orderItems.quantity" },
        revenue: { $sum: "$orderItems.totalPrice" },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
  ]);

  // Sales by region
  const salesByRegion = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId,
        status: "completed",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    { $unwind: "$orderItems" },
    {
      $group: {
        _id: "$orderItems.region",
        sales: { $sum: "$orderItems.quantity" },
        revenue: { $sum: "$orderItems.totalPrice" },
      },
    },
    { $sort: { sales: -1 } },
  ]);

  // Convert MongoDB objects to plain JavaScript objects
  return {
    bestSellers: bestSellers.map((item) => ({
      listingId: String(item._id),
      title: String(item.title),
      platform: String(item.platform),
      totalSold: Number(item.totalSold),
      revenue: Number(item.revenue),
    })),
    salesByRegion: salesByRegion.map((item) => ({
      region: String(item._id),
      sales: Number(item.sales),
      revenue: Number(item.revenue),
    })),
  };
};

// Helper function to get inventory analytics
const getInventoryAnalytics = async (sellerId) => {
  // Get seller's UID to match listings
  const seller = await User.findById(sellerId);
  if (!seller) {
    throw new Error("Seller not found");
  }

  // Inventory status
  const inventoryStats = await Listing.aggregate([
    {
      $match: {
        sellerId: seller.uid,
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalCodes: {
          $sum: {
            $size: {
              $ifNull: ["$codes", []],
            },
          },
        },
        activeCodes: {
          $sum: {
            $size: {
              $filter: {
                input: { $ifNull: ["$codes", []] },
                cond: { $eq: ["$$this.soldStatus", "active"] },
              },
            },
          },
        },
      },
    },
  ]);

  // Platform distribution
  const platformDistribution = await Listing.aggregate([
    {
      $match: {
        sellerId: seller.uid,
        status: { $in: ["active", "sold"] },
      },
    },
    {
      $group: {
        _id: "$platform",
        listings: { $sum: 1 },
        totalCodes: {
          $sum: {
            $size: {
              $ifNull: ["$codes", []],
            },
          },
        },
      },
    },
    { $sort: { listings: -1 } },
  ]);

  // Convert MongoDB objects to plain JavaScript objects
  return {
    inventoryStats: inventoryStats.map((item) => ({
      status: String(item._id),
      count: Number(item.count),
      totalCodes: Number(item.totalCodes),
      activeCodes: Number(item.activeCodes),
    })),
    platformDistribution: platformDistribution.map((item) => ({
      platform: String(item._id),
      listings: Number(item.listings),
      totalCodes: Number(item.totalCodes),
    })),
  };
};

// Helper function to get customer analytics
const getCustomerAnalytics = async (sellerId, startDate, endDate) => {
  // Unique customers
  const uniqueCustomers = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId,
        status: "completed",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$buyerId",
        orderCount: { $sum: 1 },
        totalSpent: { $sum: "$totalAmount" },
        firstOrder: { $min: "$createdAt" },
        lastOrder: { $max: "$createdAt" },
      },
    },
  ]);

  // Top customers
  const topCustomers = uniqueCustomers
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // Convert MongoDB objects to plain JavaScript objects
  return {
    uniqueCustomerCount: Number(uniqueCustomers.length),
    topCustomers: topCustomers.map((customer) => ({
      customerId: String(customer._id),
      orderCount: Number(customer.orderCount),
      totalSpent: Number(customer.totalSpent),
      firstOrder: new Date(customer.firstOrder),
      lastOrder: new Date(customer.lastOrder),
    })),
  };
};

// Helper function to get engagement analytics (listing views)
const getEngagementAnalytics = async (sellerId, startDate, endDate) => {
  console.log('getEngagementAnalytics called with:', { sellerId, startDate, endDate });
  console.log('ViewedProduct model:', ViewedProduct);
  
  // Get seller's UID to match listings
  const seller = await User.findById(sellerId);
  if (!seller) {
    throw new Error("Seller not found");
  }

  // Get seller's listing IDs
  const sellerListings = await Listing.find({ 
    sellerId: seller.uid,
    status: { $ne: 'deleted' }
  }).select('externalId title platform').lean();

  const listingIds = sellerListings.map(listing => listing.externalId);

  if (listingIds.length === 0) {
    return {
      totalViews: 0,
      uniqueViewers: 0,
      avgViewsPerListing: 0,
      topViewedListings: [],
      viewsBySource: [],
      dailyViews: [],
      conversionRate: 0
    };
  }

  // Total views and unique viewers (including both authenticated and anonymous)
  const viewsAggregation = await ViewedProduct.aggregate([
    {
      $match: {
        productId: { $in: listingIds },
        viewedAt: { $gte: startDate, $lte: endDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: 1 },
        uniqueAuthenticatedViewers: { 
          $addToSet: {
            $cond: [{ $ne: ["$userUid", null] }, "$userUid", null]
          }
        },
        uniqueAnonymousViewers: { 
          $addToSet: {
            $cond: [{ $ne: ["$anonymousId", null] }, "$anonymousId", null]
          }
        }
      }
    },
    {
      $addFields: {
        uniqueAuthenticatedCount: { 
          $size: { 
            $filter: { 
              input: "$uniqueAuthenticatedViewers", 
              cond: { $ne: ["$$this", null] } 
            } 
          } 
        },
        uniqueAnonymousCount: { 
          $size: { 
            $filter: { 
              input: "$uniqueAnonymousViewers", 
              cond: { $ne: ["$$this", null] } 
            } 
          } 
        }
      }
    },
    {
      $addFields: {
        uniqueViewerCount: { $add: ["$uniqueAuthenticatedCount", "$uniqueAnonymousCount"] }
      }
    }
  ]);

  const viewStats = viewsAggregation[0] || { totalViews: 0, uniqueViewerCount: 0 };

  // Top viewed listings
  const topViewedListings = await ViewedProduct.aggregate([
    {
      $match: {
        productId: { $in: listingIds },
        viewedAt: { $gte: startDate, $lte: endDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: "$productId",
        viewCount: { $sum: 1 },
        uniqueAuthenticatedViewers: { 
          $addToSet: {
            $cond: [{ $ne: ["$userUid", null] }, "$userUid", null]
          }
        },
        uniqueAnonymousViewers: { 
          $addToSet: {
            $cond: [{ $ne: ["$anonymousId", null] }, "$anonymousId", null]
          }
        }
      }
    },
    {
      $addFields: {
        uniqueAuthenticatedCount: { 
          $size: { 
            $filter: { 
              input: "$uniqueAuthenticatedViewers", 
              cond: { $ne: ["$$this", null] } 
            } 
          } 
        },
        uniqueAnonymousCount: { 
          $size: { 
            $filter: { 
              input: "$uniqueAnonymousViewers", 
              cond: { $ne: ["$$this", null] } 
            } 
          } 
        }
      }
    },
    {
      $addFields: {
        uniqueViewerCount: { $add: ["$uniqueAuthenticatedCount", "$uniqueAnonymousCount"] }
      }
    },
    { $sort: { viewCount: -1 } },
    { $limit: 10 }
  ]);

  // Add listing details to top viewed
  const topViewedWithDetails = topViewedListings.map(item => {
    const listing = sellerListings.find(l => l.externalId === item._id);
    return {
      listingId: String(item._id),
      title: listing ? listing.title : 'Unknown',
      platform: listing ? listing.platform : 'Unknown',
      viewCount: Number(item.viewCount),
      uniqueViewers: Number(item.uniqueViewerCount)
    };
  });

  // Views by source
  const viewsBySource = await ViewedProduct.aggregate([
    {
      $match: {
        productId: { $in: listingIds },
        viewedAt: { $gte: startDate, $lte: endDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: "$metadata.source",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Daily views trend
  const dailyViews = await ViewedProduct.aggregate([
    {
      $match: {
        productId: { $in: listingIds },
        viewedAt: { $gte: startDate, $lte: endDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$viewedAt" },
          month: { $month: "$viewedAt" },
          day: { $dayOfMonth: "$viewedAt" }
        },
        views: { $sum: 1 },
        uniqueAuthenticatedViewers: { 
          $addToSet: {
            $cond: [{ $ne: ["$userUid", null] }, "$userUid", null]
          }
        },
        uniqueAnonymousViewers: { 
          $addToSet: {
            $cond: [{ $ne: ["$anonymousId", null] }, "$anonymousId", null]
          }
        }
      }
    },
    {
      $addFields: {
        uniqueAuthenticatedCount: { 
          $size: { 
            $filter: { 
              input: "$uniqueAuthenticatedViewers", 
              cond: { $ne: ["$$this", null] } 
            } 
          } 
        },
        uniqueAnonymousCount: { 
          $size: { 
            $filter: { 
              input: "$uniqueAnonymousViewers", 
              cond: { $ne: ["$$this", null] } 
            } 
          } 
        }
      }
    },
    {
      $addFields: {
        uniqueViewerCount: { $add: ["$uniqueAuthenticatedCount", "$uniqueAnonymousCount"] }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
  ]);

  // Calculate conversion rate (views to purchases)
  const totalOrders = await Order.countDocuments({
    sellerId: sellerId,
    status: "completed",
    createdAt: { $gte: startDate, $lte: endDate }
  });

  const conversionRate = viewStats.totalViews > 0 ? (totalOrders / viewStats.totalViews) * 100 : 0;

  // Convert MongoDB objects to plain JavaScript objects
  return {
    totalViews: Number(viewStats.totalViews),
    uniqueViewers: Number(viewStats.uniqueViewerCount),
    avgViewsPerListing: listingIds.length > 0 ? Number((viewStats.totalViews / listingIds.length).toFixed(2)) : 0,
    topViewedListings: topViewedWithDetails,
    viewsBySource: viewsBySource.map(item => ({
      source: String(item._id || 'unknown'),
      count: Number(item.count)
    })),
    dailyViews: dailyViews.map(item => ({
      date: {
        year: Number(item._id.year),
        month: Number(item._id.month),
        day: Number(item._id.day)
      },
      views: Number(item.views),
      uniqueViewers: Number(item.uniqueViewerCount)
    })),
    conversionRate: Number(conversionRate.toFixed(2))
  };
};

// @route   GET /api/v1/seller/analytics/revenue-chart
// @desc    Get detailed revenue chart data for VIP sellers
// @access  Private (seller role required)
const getRevenueChartData = async (request, reply) => {
  request.log.info("handlers/getRevenueChartData");

  try {
    const user = await User.findOne({ uid: request.user.uid });
    if (!user || !user.roles.includes("seller")) {
      return sendErrorResponse(reply, 403, "Seller role required");
    }

    const sellerId = user._id;
    const { period = "daily", timeRange = "30d" } = request.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    let groupBy;

    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          week: { $week: "$createdAt" },
        };
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
    }

    const chartData = await Order.aggregate([
      {
        $match: {
          sellerId: sellerId,
          status: "completed",
          createdAt: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } },
    ]);

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Revenue chart data retrieved successfully",
      data: {
        chartData,
        period,
        timeRange,
      },
    });
  } catch (error) {
    request.log.error(`Error getting revenue chart data: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to retrieve chart data");
  }
};

module.exports = {
  getSellerAnalyticsOverview,
  getRevenueChartData,
};
