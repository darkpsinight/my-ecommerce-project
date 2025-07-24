const { Order } = require("../models/order");
const { Listing } = require("../models/listing");
const { User } = require("../models/user");
const { Transaction } = require("../models/transaction");
const ViewedProduct = require("../models/viewedProduct");
const { Wishlist } = require("../models/wishlist");
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
    const engagementData = await getEngagementAnalytics(
      sellerId,
      startDate,
      now
    );

    // Get wishlist analytics
    const wishlistData = await getWishlistAnalytics(sellerId, startDate, now);

    // Get geographic analytics (existing product region data)
    const geographicData = await getGeographicAnalytics(
      sellerId,
      startDate,
      now
    );

    // Get customer geographic analytics (real customer locations)
    const customerGeographicData = await getCustomerGeographicAnalytics(
      sellerId,
      startDate,
      now
    );

    const responseData = {
      timeRange,
      revenue: revenueData,
      sales: salesData,
      inventory: inventoryData,
      customers: customerData,
      engagement: engagementData,
      wishlist: wishlistData,
      geographic: geographicData,
      customerGeographic: customerGeographicData,
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
  console.log("getEngagementAnalytics called with:", {
    sellerId,
    startDate,
    endDate,
  });
  console.log("ViewedProduct model:", ViewedProduct);

  // Get seller's UID to match listings
  const seller = await User.findById(sellerId);
  if (!seller) {
    throw new Error("Seller not found");
  }

  // Get seller's listing IDs
  const sellerListings = await Listing.find({
    sellerId: seller.uid,
    status: { $ne: "deleted" },
  })
    .select("externalId title platform")
    .lean();

  const listingIds = sellerListings.map((listing) => listing.externalId);

  if (listingIds.length === 0) {
    return {
      totalViews: 0,
      uniqueViewers: 0,
      avgViewsPerListing: 0,
      topViewedListings: [],
      viewsBySource: [],
      dailyViews: [],
      conversionRate: 0,
    };
  }

  // Total views and unique viewers (including both authenticated and anonymous)
  const viewsAggregation = await ViewedProduct.aggregate([
    {
      $match: {
        productId: { $in: listingIds },
        viewedAt: { $gte: startDate, $lte: endDate },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: 1 },
        uniqueAuthenticatedViewers: {
          $addToSet: {
            $cond: [{ $ne: ["$userUid", null] }, "$userUid", null],
          },
        },
        uniqueAnonymousViewers: {
          $addToSet: {
            $cond: [{ $ne: ["$anonymousId", null] }, "$anonymousId", null],
          },
        },
      },
    },
    {
      $addFields: {
        uniqueAuthenticatedCount: {
          $size: {
            $filter: {
              input: "$uniqueAuthenticatedViewers",
              cond: { $ne: ["$$this", null] },
            },
          },
        },
        uniqueAnonymousCount: {
          $size: {
            $filter: {
              input: "$uniqueAnonymousViewers",
              cond: { $ne: ["$$this", null] },
            },
          },
        },
      },
    },
    {
      $addFields: {
        uniqueViewerCount: {
          $add: ["$uniqueAuthenticatedCount", "$uniqueAnonymousCount"],
        },
      },
    },
  ]);

  const viewStats = viewsAggregation[0] || {
    totalViews: 0,
    uniqueViewerCount: 0,
  };

  // Top viewed listings
  const topViewedListings = await ViewedProduct.aggregate([
    {
      $match: {
        productId: { $in: listingIds },
        viewedAt: { $gte: startDate, $lte: endDate },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$productId",
        viewCount: { $sum: 1 },
        uniqueAuthenticatedViewers: {
          $addToSet: {
            $cond: [{ $ne: ["$userUid", null] }, "$userUid", null],
          },
        },
        uniqueAnonymousViewers: {
          $addToSet: {
            $cond: [{ $ne: ["$anonymousId", null] }, "$anonymousId", null],
          },
        },
      },
    },
    {
      $addFields: {
        uniqueAuthenticatedCount: {
          $size: {
            $filter: {
              input: "$uniqueAuthenticatedViewers",
              cond: { $ne: ["$$this", null] },
            },
          },
        },
        uniqueAnonymousCount: {
          $size: {
            $filter: {
              input: "$uniqueAnonymousViewers",
              cond: { $ne: ["$$this", null] },
            },
          },
        },
      },
    },
    {
      $addFields: {
        uniqueViewerCount: {
          $add: ["$uniqueAuthenticatedCount", "$uniqueAnonymousCount"],
        },
      },
    },
    { $sort: { viewCount: -1 } },
    { $limit: 10 },
  ]);

  // Add listing details to top viewed
  const topViewedWithDetails = topViewedListings.map((item) => {
    const listing = sellerListings.find((l) => l.externalId === item._id);
    return {
      listingId: String(item._id),
      title: listing ? listing.title : "Unknown",
      platform: listing ? listing.platform : "Unknown",
      viewCount: Number(item.viewCount),
      uniqueViewers: Number(item.uniqueViewerCount),
    };
  });

  // Views by source
  const viewsBySource = await ViewedProduct.aggregate([
    {
      $match: {
        productId: { $in: listingIds },
        viewedAt: { $gte: startDate, $lte: endDate },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$metadata.source",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Daily views trend
  const dailyViews = await ViewedProduct.aggregate([
    {
      $match: {
        productId: { $in: listingIds },
        viewedAt: { $gte: startDate, $lte: endDate },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$viewedAt" },
          month: { $month: "$viewedAt" },
          day: { $dayOfMonth: "$viewedAt" },
        },
        views: { $sum: 1 },
        uniqueAuthenticatedViewers: {
          $addToSet: {
            $cond: [{ $ne: ["$userUid", null] }, "$userUid", null],
          },
        },
        uniqueAnonymousViewers: {
          $addToSet: {
            $cond: [{ $ne: ["$anonymousId", null] }, "$anonymousId", null],
          },
        },
      },
    },
    {
      $addFields: {
        uniqueAuthenticatedCount: {
          $size: {
            $filter: {
              input: "$uniqueAuthenticatedViewers",
              cond: { $ne: ["$$this", null] },
            },
          },
        },
        uniqueAnonymousCount: {
          $size: {
            $filter: {
              input: "$uniqueAnonymousViewers",
              cond: { $ne: ["$$this", null] },
            },
          },
        },
      },
    },
    {
      $addFields: {
        uniqueViewerCount: {
          $add: ["$uniqueAuthenticatedCount", "$uniqueAnonymousCount"],
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  // Calculate conversion rate (views to purchases)
  const totalOrders = await Order.countDocuments({
    sellerId: sellerId,
    status: "completed",
    createdAt: { $gte: startDate, $lte: endDate },
  });

  const conversionRate =
    viewStats.totalViews > 0 ? (totalOrders / viewStats.totalViews) * 100 : 0;

  // Get time-based analytics for seller's listings
  const timeAnalytics = await ViewedProduct.getTimeAnalytics(listingIds, startDate, endDate);
  
  // Calculate overall time metrics
  let avgTimeOnPage = 0;
  let totalTimeSpent = 0;
  let viewsWithDuration = 0;
  
  if (timeAnalytics.length > 0) {
    const timeStats = timeAnalytics.reduce((acc, item) => {
      acc.totalTime += item.totalTimeSpent || 0;
      acc.totalViews += item.totalViews || 0;
      return acc;
    }, { totalTime: 0, totalViews: 0 });
    
    avgTimeOnPage = timeStats.totalViews > 0 ? timeStats.totalTime / timeStats.totalViews : 0;
    totalTimeSpent = timeStats.totalTime;
    viewsWithDuration = timeStats.totalViews;
  }

  // Add time metrics to top viewed listings
  const topViewedWithTimeDetails = topViewedWithDetails.map((listing) => {
    const timeData = timeAnalytics.find(t => t._id === listing.listingId);
    return {
      ...listing,
      avgTimeOnPage: timeData ? Number((timeData.avgTimeOnPageSeconds || 0).toFixed(1)) : 0,
      totalTimeSpent: timeData ? Number((timeData.totalTimeSpentMinutes || 0).toFixed(1)) : 0
    };
  });

  // Convert MongoDB objects to plain JavaScript objects
  return {
    totalViews: Number(viewStats.totalViews),
    uniqueViewers: Number(viewStats.uniqueViewerCount),
    avgViewsPerListing:
      listingIds.length > 0
        ? Number((viewStats.totalViews / listingIds.length).toFixed(2))
        : 0,
    avgTimeOnPage: Number((avgTimeOnPage / 1000).toFixed(1)), // Convert to seconds
    totalTimeSpent: Number((totalTimeSpent / 60000).toFixed(1)), // Convert to minutes
    viewsWithDuration: Number(viewsWithDuration),
    topViewedListings: topViewedWithTimeDetails,
    viewsBySource: viewsBySource.map((item) => ({
      source: String(item._id || "unknown"),
      count: Number(item.count),
    })),
    dailyViews: dailyViews.map((item) => ({
      date: {
        year: Number(item._id.year),
        month: Number(item._id.month),
        day: Number(item._id.day),
      },
      views: Number(item.views),
      uniqueViewers: Number(item.uniqueViewerCount),
    })),
    conversionRate: Number(conversionRate.toFixed(2)),
  };
};

// Helper function to get wishlist analytics
const getWishlistAnalytics = async (sellerId, startDate, endDate) => {
  // Get seller's UID to match listings
  const seller = await User.findById(sellerId);
  if (!seller) {
    throw new Error("Seller not found");
  }

  // Get seller's listing IDs
  const sellerListings = await Listing.find({
    sellerId: seller.uid,
    status: { $ne: "deleted" },
  })
    .select("_id externalId title platform")
    .lean();

  const listingObjectIds = sellerListings.map((listing) => listing._id);

  if (listingObjectIds.length === 0) {
    return {
      totalWishlistAdditions: 0,
      uniqueWishlisters: 0,
      wishlistConversionRate: 0,
      mostWishlistedProducts: [],
      wishlistAbandonmentRate: 0,
      dailyWishlistActivity: [],
    };
  }

  // Get all wishlists that contain seller's products
  const wishlistsWithSellerProducts = await Wishlist.find({
    "items.listingId": { $in: listingObjectIds },
  }).lean();

  // Calculate total wishlist additions for seller's products in time range
  let totalAdditions = 0;
  let totalRemovals = 0;
  let totalConversions = 0;
  const uniqueWishlisters = new Set();
  const productWishlistCounts = {};
  const dailyActivity = {};

  // Process each wishlist
  for (const wishlist of wishlistsWithSellerProducts) {
    uniqueWishlisters.add(wishlist.userId.toString());

    // Count current items from seller
    const sellerItems = wishlist.items.filter(
      (item) =>
        listingObjectIds.some(
          (id) => id.toString() === item.listingId.toString()
        ) &&
        item.addedAt >= startDate &&
        item.addedAt <= endDate
    );

    totalAdditions += sellerItems.length;

    // Count wishlist additions by product
    sellerItems.forEach((item) => {
      const listingId = item.listingId.toString();
      if (!productWishlistCounts[listingId]) {
        productWishlistCounts[listingId] = 0;
      }
      productWishlistCounts[listingId]++;

      // Track daily activity
      const dateKey = item.addedAt.toISOString().split("T")[0];
      if (!dailyActivity[dateKey]) {
        dailyActivity[dateKey] = { additions: 0, removals: 0 };
      }
      dailyActivity[dateKey].additions++;
    });

    // Add analytics data from wishlist model
    if (wishlist.analytics) {
      // Note: These are total analytics, not filtered by time range or seller
      // We'll use them as approximations
      totalConversions += wishlist.analytics.itemsConvertedToPurchase || 0;
    }
  }

  // Get most wishlisted products
  const mostWishlistedProducts = Object.entries(productWishlistCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([listingId, count]) => {
      const listing = sellerListings.find(
        (l) => l._id.toString() === listingId
      );
      return {
        listingId: listing ? listing.externalId : listingId,
        title: listing ? listing.title : "Unknown",
        platform: listing ? listing.platform : "Unknown",
        wishlistCount: count,
      };
    });

  // Calculate conversion rate (wishlist additions to purchases)
  // Get actual purchases from wishlisted items
  const purchasedWishlistItems = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId,
        status: "completed",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    { $unwind: "$orderItems" },
    {
      $lookup: {
        from: "listings",
        let: { listingExternalId: "$orderItems.listingId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$externalId", "$$listingExternalId"] },
            },
          },
        ],
        as: "listingData",
      },
    },
    { $unwind: "$listingData" },
    {
      $match: {
        "listingData._id": { $in: listingObjectIds },
      },
    },
    {
      $group: {
        _id: null,
        totalPurchases: { $sum: "$orderItems.quantity" },
      },
    },
  ]);

  const actualConversions = purchasedWishlistItems[0]?.totalPurchases || 0;
  const conversionRate =
    totalAdditions > 0 ? (actualConversions / totalAdditions) * 100 : 0;

  // Calculate abandonment rate (items removed vs added)
  // This is an approximation since we don't track historical removals by time range
  const abandonmentRate =
    totalAdditions > 0 ? (totalRemovals / totalAdditions) * 100 : 0;

  // Format daily activity
  const dailyWishlistActivity = Object.entries(dailyActivity)
    .map(([date, activity]) => {
      const dateObj = new Date(date);
      return {
        date: {
          year: dateObj.getFullYear(),
          month: dateObj.getMonth() + 1,
          day: dateObj.getDate(),
        },
        additions: activity.additions,
        removals: activity.removals,
      };
    })
    .sort((a, b) => {
      const dateA = new Date(a.date.year, a.date.month - 1, a.date.day);
      const dateB = new Date(b.date.year, b.date.month - 1, b.date.day);
      return dateA - dateB;
    });

  return {
    totalWishlistAdditions: Number(totalAdditions),
    uniqueWishlisters: Number(uniqueWishlisters.size),
    wishlistConversionRate: Number(conversionRate.toFixed(2)),
    mostWishlistedProducts: mostWishlistedProducts,
    wishlistAbandonmentRate: Number(abandonmentRate.toFixed(2)),
    dailyWishlistActivity: dailyWishlistActivity,
  };
};

// Helper function to get geographic analytics
const getGeographicAnalytics = async (sellerId, startDate, endDate) => {
  // Get seller's UID to match listings
  const seller = await User.findById(sellerId);
  if (!seller) {
    throw new Error("Seller not found");
  }

  // Sales Heatmap Data - Sales by region with coordinates
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
        orders: { $sum: 1 },
        avgOrderValue: { $avg: "$orderItems.totalPrice" },
      },
    },
    { $sort: { sales: -1 } },
  ]);

  // Add geographic coordinates for regions
  const regionCoordinates = {
    Global: { lat: 0, lng: 0, name: "Global" },
    "North America": { lat: 45.0, lng: -100.0, name: "North America" },
    Europe: { lat: 54.0, lng: 15.0, name: "Europe" },
    Asia: { lat: 35.0, lng: 100.0, name: "Asia" },
    Oceania: { lat: -25.0, lng: 140.0, name: "Oceania" },
    "South America": { lat: -15.0, lng: -60.0, name: "South America" },
    Africa: { lat: 0.0, lng: 20.0, name: "Africa" },
    Other: { lat: 0, lng: 0, name: "Other" },
  };

  const salesHeatmapData = salesByRegion.map((item) => ({
    region: String(item._id),
    sales: Number(item.sales),
    revenue: Number(item.revenue),
    orders: Number(item.orders),
    avgOrderValue: Number(item.avgOrderValue.toFixed(2)),
    coordinates: regionCoordinates[item._id] || regionCoordinates["Other"],
  }));

  // Regional Pricing Optimization - Price performance by region
  const pricingByRegion = await Order.aggregate([
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
        _id: {
          region: "$orderItems.region",
          priceRange: {
            $switch: {
              branches: [
                {
                  case: { $lt: ["$orderItems.unitPrice", 10] },
                  then: "Under $10",
                },
                {
                  case: { $lt: ["$orderItems.unitPrice", 25] },
                  then: "$10-$25",
                },
                {
                  case: { $lt: ["$orderItems.unitPrice", 50] },
                  then: "$25-$50",
                },
                {
                  case: { $lt: ["$orderItems.unitPrice", 100] },
                  then: "$50-$100",
                },
              ],
              default: "Over $100",
            },
          },
        },
        sales: { $sum: "$orderItems.quantity" },
        revenue: { $sum: "$orderItems.totalPrice" },
        avgPrice: { $avg: "$orderItems.unitPrice" },
        conversionRate: { $avg: 1 }, // Simplified - all completed orders have 100% conversion
      },
    },
    { $sort: { "_id.region": 1, sales: -1 } },
  ]);

  // Market Penetration - Your presence in different markets
  const marketPenetration = await Order.aggregate([
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
        _id: {
          region: "$orderItems.region",
          platform: "$orderItems.platform",
        },
        sales: { $sum: "$orderItems.quantity" },
        revenue: { $sum: "$orderItems.totalPrice" },
        uniqueProducts: { $addToSet: "$orderItems.listingId" },
        orders: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.region",
        platforms: {
          $push: {
            platform: "$_id.platform",
            sales: "$sales",
            revenue: "$revenue",
            uniqueProducts: { $size: "$uniqueProducts" },
            orders: "$orders",
          },
        },
        totalSales: { $sum: "$sales" },
        totalRevenue: { $sum: "$revenue" },
        totalOrders: { $sum: "$orders" },
      },
    },
    { $sort: { totalSales: -1 } },
  ]);

  // Currency Impact Analysis (USD only for now)
  const currencyAnalysis = await Order.aggregate([
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
        _id: {
          region: "$orderItems.region",
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        sales: { $sum: "$orderItems.quantity" },
        revenue: { $sum: "$orderItems.totalPrice" },
        avgPrice: { $avg: "$orderItems.unitPrice" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, sales: -1 } },
  ]);

  // Regional Performance Trends
  const regionalTrends = await Order.aggregate([
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
        _id: {
          region: "$orderItems.region",
          date: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
        },
        sales: { $sum: "$orderItems.quantity" },
        revenue: { $sum: "$orderItems.totalPrice" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.date.year": 1, "_id.date.month": 1, "_id.date.day": 1 } },
  ]);

  // Calculate total metrics for percentages
  const totalSales = salesHeatmapData.reduce(
    (sum, item) => sum + item.sales,
    0
  );
  const totalRevenue = salesHeatmapData.reduce(
    (sum, item) => sum + item.revenue,
    0
  );

  return {
    // Sales Heatmap - Visual map data
    salesHeatmap: {
      regions: salesHeatmapData.map((item) => ({
        ...item,
        salesPercentage:
          totalSales > 0
            ? Number(((item.sales / totalSales) * 100).toFixed(2))
            : 0,
        revenuePercentage:
          totalRevenue > 0
            ? Number(((item.revenue / totalRevenue) * 100).toFixed(2))
            : 0,
      })),
      totalSales: Number(totalSales),
      totalRevenue: Number(totalRevenue),
      totalRegions: salesHeatmapData.length,
    },

    // Regional Pricing Optimization
    pricingOptimization: pricingByRegion.map((item) => ({
      region: String(item._id.region),
      priceRange: String(item._id.priceRange),
      sales: Number(item.sales),
      revenue: Number(item.revenue),
      avgPrice: Number(item.avgPrice.toFixed(2)),
      conversionRate: Number((item.conversionRate * 100).toFixed(2)),
    })),

    // Market Penetration
    marketPenetration: marketPenetration.map((item) => ({
      region: String(item._id),
      platforms: item.platforms.map((platform) => ({
        platform: String(platform.platform),
        sales: Number(platform.sales),
        revenue: Number(platform.revenue),
        uniqueProducts: Number(platform.uniqueProducts),
        orders: Number(platform.orders),
      })),
      totalSales: Number(item.totalSales),
      totalRevenue: Number(item.totalRevenue),
      totalOrders: Number(item.totalOrders),
      marketShare:
        totalSales > 0
          ? Number(((item.totalSales / totalSales) * 100).toFixed(2))
          : 0,
    })),

    // Currency Impact Analysis (USD focus)
    currencyAnalysis: {
      currency: "USD",
      regionalPerformance: currencyAnalysis.map((item) => ({
        region: String(item._id.region),
        period: {
          year: Number(item._id.year),
          month: Number(item._id.month),
        },
        sales: Number(item.sales),
        revenue: Number(item.revenue),
        avgPrice: Number(item.avgPrice.toFixed(2)),
        orders: Number(item.orders),
      })),
      // Price sensitivity analysis
      priceImpact: salesHeatmapData.map((item) => ({
        region: item.region,
        avgOrderValue: item.avgOrderValue,
        priceElasticity:
          item.avgOrderValue > 0
            ? Number((item.sales / item.avgOrderValue).toFixed(2))
            : 0,
      })),
    },

    // Regional Trends
    regionalTrends: regionalTrends.map((item) => ({
      region: String(item._id.region),
      date: {
        year: Number(item._id.date.year),
        month: Number(item._id.date.month),
        day: Number(item._id.date.day),
      },
      sales: Number(item.sales),
      revenue: Number(item.revenue),
      orders: Number(item.orders),
    })),
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


// Helper function to get customer geographic analytics (real customer locations)
const getCustomerGeographicAnalytics = async (sellerId, startDate, endDate) => {
  // Get seller's UID to match listings
  const seller = await User.findById(sellerId);
  if (!seller) {
    throw new Error("Seller not found");
  }

  // Customer Sales Heatmap - Real customer locations from orders
  const customerSalesHeatmap = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId,
        status: "completed",
        createdAt: { $gte: startDate, $lte: endDate },
        "customerLocation.country": { $exists: true, $ne: null }
      },
    },
    { $unwind: "$orderItems" },
    {
      $group: {
        _id: {
          country: "$customerLocation.country",
          countryCode: "$customerLocation.countryCode",
          region: "$customerLocation.region",
          city: "$customerLocation.city"
        },
        sales: { $sum: "$orderItems.quantity" },
        revenue: { $sum: "$orderItems.totalPrice" },
        orders: { $sum: 1 },
        avgOrderValue: { $avg: "$orderItems.totalPrice" },
        coordinates: {
          $first: {
            lat: "$customerLocation.latitude",
            lng: "$customerLocation.longitude"
          }
        }
      },
    },
    { $sort: { sales: -1 } },
  ]);

  // Customer Views Heatmap - Real customer locations from product views
  const sellerListings = await Listing.find({ 
    sellerId: seller.uid,
    status: { $ne: 'deleted' }
  }).select('externalId').lean();

  const listingIds = sellerListings.map(listing => listing.externalId);

  const customerViewsHeatmap = await ViewedProduct.aggregate([
    {
      $match: {
        productId: { $in: listingIds },
        viewedAt: { $gte: startDate, $lte: endDate },
        isDeleted: false,
        "metadata.customerLocation.country": { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: {
          country: "$metadata.customerLocation.country",
          countryCode: "$metadata.customerLocation.countryCode",
          region: "$metadata.customerLocation.region",
          city: "$metadata.customerLocation.city"
        },
        views: { $sum: 1 },
        uniqueViewers: { 
          $addToSet: {
            $cond: [
              { $ne: ["$userUid", null] }, 
              "$userUid", 
              "$anonymousId"
            ]
          }
        },
        coordinates: {
          $first: {
            lat: "$metadata.customerLocation.latitude",
            lng: "$metadata.customerLocation.longitude"
          }
        }
      }
    },
    {
      $addFields: {
        uniqueViewerCount: { $size: "$uniqueViewers" }
      }
    },
    { $sort: { views: -1 } }
  ]);

  // Regional Customer Analysis - Purchasing behavior by region
  const regionalCustomerAnalysis = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId,
        status: "completed",
        createdAt: { $gte: startDate, $lte: endDate },
        "customerLocation.country": { $exists: true, $ne: null }
      },
    },
    { $unwind: "$orderItems" },
    {
      $group: {
        _id: {
          country: "$customerLocation.country",
          priceRange: {
            $switch: {
              branches: [
                { case: { $lt: ["$orderItems.unitPrice", 10] }, then: "Under $10" },
                { case: { $lt: ["$orderItems.unitPrice", 25] }, then: "$10-$25" },
                { case: { $lt: ["$orderItems.unitPrice", 50] }, then: "$25-$50" },
                { case: { $lt: ["$orderItems.unitPrice", 100] }, then: "$50-$100" },
              ],
              default: "Over $100"
            }
          }
        },
        sales: { $sum: "$orderItems.quantity" },
        revenue: { $sum: "$orderItems.totalPrice" },
        avgPrice: { $avg: "$orderItems.unitPrice" },
        orders: { $sum: 1 }
      },
    },
    { $sort: { "_id.country": 1, sales: -1 } },
  ]);

  // Customer Market Penetration - Countries where you have customers
  const customerMarketPenetration = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId,
        status: "completed",
        createdAt: { $gte: startDate, $lte: endDate },
        "customerLocation.country": { $exists: true, $ne: null }
      },
    },
    {
      $group: {
        _id: "$customerLocation.country",
        countryCode: { $first: "$customerLocation.countryCode" },
        totalCustomers: { $addToSet: "$buyerId" },
        totalSales: { $sum: { $sum: "$orderItems.quantity" } },
        totalRevenue: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: "$totalAmount" },
        coordinates: {
          $first: {
            lat: "$customerLocation.latitude",
            lng: "$customerLocation.longitude"
          }
        }
      }
    },
    {
      $addFields: {
        customerCount: { $size: "$totalCustomers" }
      }
    },
    { $sort: { totalSales: -1 } }
  ]);

  // Calculate totals for percentages
  const totalCustomerSales = customerSalesHeatmap.reduce((sum, item) => sum + item.sales, 0);
  const totalCustomerRevenue = customerSalesHeatmap.reduce((sum, item) => sum + item.revenue, 0);
  const totalCustomerViews = customerViewsHeatmap.reduce((sum, item) => sum + item.views, 0);

  return {
    // Customer Sales Heatmap - Real customer locations
    customerSalesHeatmap: {
      countries: customerSalesHeatmap.map(item => ({
        country: String(item._id.country),
        countryCode: String(item._id.countryCode || 'XX'),
        region: String(item._id.region || 'Unknown'),
        city: String(item._id.city || 'Unknown'),
        sales: Number(item.sales),
        revenue: Number(item.revenue),
        orders: Number(item.orders),
        avgOrderValue: Number(item.avgOrderValue.toFixed(2)),
        salesPercentage: totalCustomerSales > 0 ? Number(((item.sales / totalCustomerSales) * 100).toFixed(2)) : 0,
        revenuePercentage: totalCustomerRevenue > 0 ? Number(((item.revenue / totalCustomerRevenue) * 100).toFixed(2)) : 0,
        coordinates: item.coordinates || { lat: null, lng: null }
      })),
      totalSales: Number(totalCustomerSales),
      totalRevenue: Number(totalCustomerRevenue),
      totalCountries: customerSalesHeatmap.length
    },

    // Customer Views Heatmap - Real customer locations
    customerViewsHeatmap: {
      countries: customerViewsHeatmap.map(item => ({
        country: String(item._id.country),
        countryCode: String(item._id.countryCode || 'XX'),
        region: String(item._id.region || 'Unknown'),
        city: String(item._id.city || 'Unknown'),
        views: Number(item.views),
        uniqueViewers: Number(item.uniqueViewerCount),
        viewsPercentage: totalCustomerViews > 0 ? Number(((item.views / totalCustomerViews) * 100).toFixed(2)) : 0,
        coordinates: item.coordinates || { lat: null, lng: null }
      })),
      totalViews: Number(totalCustomerViews),
      totalCountries: customerViewsHeatmap.length
    },

    // Regional Customer Analysis - Price sensitivity by country
    regionalCustomerAnalysis: regionalCustomerAnalysis.map(item => ({
      country: String(item._id.country),
      priceRange: String(item._id.priceRange),
      sales: Number(item.sales),
      revenue: Number(item.revenue),
      avgPrice: Number(item.avgPrice.toFixed(2)),
      orders: Number(item.orders)
    })),

    // Customer Market Penetration - Countries with customers
    customerMarketPenetration: customerMarketPenetration.map(item => ({
      country: String(item._id),
      countryCode: String(item.countryCode || 'XX'),
      customerCount: Number(item.customerCount),
      totalSales: Number(item.totalSales),
      totalRevenue: Number(item.totalRevenue),
      totalOrders: Number(item.totalOrders),
      avgOrderValue: Number(item.avgOrderValue.toFixed(2)),
      coordinates: item.coordinates || { lat: null, lng: null }
    }))
  };
};

module.exports = {
  getSellerAnalyticsOverview,
  getRevenueChartData,
};