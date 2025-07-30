const { MarketingSpend } = require("../models/marketingSpend");
const { User } = require("../models/user");
const { Order } = require("../models/order");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/responseHelpers");

// @route   GET /api/v1/seller/analytics/cac
// @desc    Get Customer Acquisition Cost analytics for sellers
// @access  Private (seller role required)
const getCACAnalytics = async (request, reply) => {
  request.log.info("handlers/getCACAnalytics");

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

    // Get CAC analytics
    const cacData = await calculateCACAnalytics(sellerId, startDate, now);

    const responseData = {
      timeRange,
      cac: cacData,
      generatedAt: new Date(),
    };

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "CAC analytics retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    request.log.error(`Error getting CAC analytics: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to retrieve CAC analytics");
  }
};

// @route   POST /api/v1/seller/analytics/marketing-spend
// @desc    Add marketing spend entry
// @access  Private (seller role required)
const addMarketingSpend = async (request, reply) => {
  request.log.info("handlers/addMarketingSpend");

  try {
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return sendErrorResponse(reply, 404, "User not found");
    }

    if (!user.roles.includes("seller")) {
      return sendErrorResponse(reply, 403, "Seller role required");
    }

    const sellerId = user._id;
    const {
      amount,
      currency = "USD",
      channel,
      campaignName,
      description,
      spendDate,
      periodStart,
      periodEnd,
      utmSource,
      utmMedium,
      utmCampaign,
      impressions,
      clicks,
      conversions
    } = request.body;

    const marketingSpend = new MarketingSpend({
      sellerId,
      amount,
      currency,
      channel,
      campaignName,
      description,
      spendDate: new Date(spendDate),
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      utmSource,
      utmMedium,
      utmCampaign,
      impressions,
      clicks,
      conversions
    });

    await marketingSpend.save();

    return sendSuccessResponse(reply, {
      statusCode: 201,
      message: "Marketing spend added successfully",
      data: marketingSpend
    });
  } catch (error) {
    request.log.error(`Error adding marketing spend: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to add marketing spend");
  }
};

// @route   GET /api/v1/seller/analytics/marketing-spend
// @desc    Get marketing spend entries
// @access  Private (seller role required)
const getMarketingSpend = async (request, reply) => {
  request.log.info("handlers/getMarketingSpend");

  try {
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return sendErrorResponse(reply, 404, "User not found");
    }

    if (!user.roles.includes("seller")) {
      return sendErrorResponse(reply, 403, "Seller role required");
    }

    const sellerId = user._id;
    const { 
      page = 1, 
      limit = 20, 
      channel, 
      startDate, 
      endDate 
    } = request.query;

    const query = { sellerId };
    
    if (channel) {
      query.channel = channel;
    }
    
    if (startDate && endDate) {
      query.spendDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    
    const spendEntries = await MarketingSpend.find(query)
      .sort({ spendDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await MarketingSpend.countDocuments(query);

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Marketing spend retrieved successfully",
      data: {
        spendEntries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    request.log.error(`Error getting marketing spend: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to retrieve marketing spend");
  }
};

// Helper function to calculate CAC analytics
const calculateCACAnalytics = async (sellerId, startDate, endDate) => {
  // Get total marketing spend for the period
  const totalSpendData = await MarketingSpend.getTotalSpendByPeriod(sellerId, startDate, endDate);
  const totalMarketingSpend = totalSpendData.totalSpend || 0;

  // Get spend by channel
  const spendByChannel = await MarketingSpend.getSpendByChannel(sellerId, startDate, endDate);

  // Get new customers acquired in the period
  // For sellers, we track customers who made their first purchase from this seller
  const newCustomers = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId,
        status: "completed",
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: "$buyerId",
        firstPurchaseDate: { $min: "$createdAt" },
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$totalAmount" }
      }
    },
    {
      $lookup: {
        from: "orders",
        let: { buyerId: "$_id", sellerId: sellerId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$buyerId", "$$buyerId"] },
                  { $eq: ["$sellerId", "$$sellerId"] },
                  { $eq: ["$status", "completed"] }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              earliestOrder: { $min: "$createdAt" }
            }
          }
        ],
        as: "customerHistory"
      }
    },
    {
      $addFields: {
        isNewCustomer: {
          $cond: [
            { $eq: [{ $size: "$customerHistory" }, 0] },
            true,
            {
              $gte: [
                { $arrayElemAt: ["$customerHistory.earliestOrder", 0] },
                startDate
              ]
            }
          ]
        }
      }
    },
    {
      $match: {
        isNewCustomer: true
      }
    }
  ]);

  const newCustomerCount = newCustomers.length;

  // Calculate overall CAC
  const overallCAC = newCustomerCount > 0 ? totalMarketingSpend / newCustomerCount : 0;

  // Get customers by acquisition channel (if available)
  const customersByChannel = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId,
        status: "completed",
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "buyerId",
        foreignField: "_id",
        as: "buyer"
      }
    },
    {
      $unwind: "$buyer"
    },
    {
      $group: {
        _id: "$buyer.acquisitionSource.channel",
        customerCount: { $addToSet: "$buyerId" },
        totalRevenue: { $sum: "$totalAmount" }
      }
    },
    {
      $addFields: {
        customerCount: { $size: "$customerCount" }
      }
    },
    {
      $sort: { customerCount: -1 }
    }
  ]);

  // Calculate CAC by channel
  const cacByChannel = spendByChannel.map(channelSpend => {
    const channelCustomers = customersByChannel.find(
      c => c._id === channelSpend._id
    );
    const customerCount = channelCustomers ? channelCustomers.customerCount : 0;
    const cac = customerCount > 0 ? channelSpend.totalSpend / customerCount : 0;

    return {
      channel: channelSpend._id,
      totalSpend: Number(channelSpend.totalSpend),
      customerCount: Number(customerCount),
      cac: Number(cac.toFixed(2)),
      avgSpend: Number(channelSpend.avgSpend.toFixed(2))
    };
  });

  // Calculate CAC trend (daily)
  const dailyCACTrend = await calculateDailyCACTrend(sellerId, startDate, endDate);

  // Calculate CAC payback period (simplified)
  const avgOrderValue = newCustomers.length > 0 
    ? newCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0) / newCustomers.length
    : 0;
  
  const cacPaybackPeriod = avgOrderValue > 0 ? overallCAC / avgOrderValue : 0;

  return {
    totalMarketingSpend: Number(totalMarketingSpend),
    newCustomersAcquired: Number(newCustomerCount),
    overallCAC: Number(overallCAC.toFixed(2)),
    avgOrderValue: Number(avgOrderValue.toFixed(2)),
    cacPaybackPeriod: Number(cacPaybackPeriod.toFixed(1)), // in orders
    spendByChannel: spendByChannel.map(item => ({
      channel: String(item._id),
      totalSpend: Number(item.totalSpend),
      campaignCount: Number(item.campaignCount),
      avgSpend: Number(item.avgSpend.toFixed(2))
    })),
    cacByChannel,
    customersByChannel: customersByChannel.map(item => ({
      channel: String(item._id || 'unknown'),
      customerCount: Number(item.customerCount),
      totalRevenue: Number(item.totalRevenue)
    })),
    dailyTrend: dailyCACTrend
  };
};

// Helper function to calculate daily CAC trend
const calculateDailyCACTrend = async (sellerId, startDate, endDate) => {
  // Get daily spend
  const dailySpend = await MarketingSpend.aggregate([
    {
      $match: {
        sellerId: sellerId,
        spendDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$spendDate" },
          month: { $month: "$spendDate" },
          day: { $dayOfMonth: "$spendDate" }
        },
        totalSpend: { $sum: "$amount" }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
  ]);

  // Get daily new customers
  const dailyCustomers = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId,
        status: "completed",
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          buyerId: "$buyerId",
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        },
        firstPurchase: { $min: "$createdAt" }
      }
    },
    {
      $group: {
        _id: {
          year: "$_id.year",
          month: "$_id.month",
          day: "$_id.day"
        },
        newCustomers: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
  ]);

  // Combine daily spend and customers
  const dailyTrend = [];
  const spendMap = new Map();
  const customerMap = new Map();

  dailySpend.forEach(item => {
    const key = `${item._id.year}-${item._id.month}-${item._id.day}`;
    spendMap.set(key, item.totalSpend);
  });

  dailyCustomers.forEach(item => {
    const key = `${item._id.year}-${item._id.month}-${item._id.day}`;
    customerMap.set(key, item.newCustomers);
  });

  // Create combined daily trend
  const allDates = new Set([...spendMap.keys(), ...customerMap.keys()]);
  
  for (const dateKey of allDates) {
    const [year, month, day] = dateKey.split('-').map(Number);
    const spend = spendMap.get(dateKey) || 0;
    const customers = customerMap.get(dateKey) || 0;
    const cac = customers > 0 ? spend / customers : 0;

    dailyTrend.push({
      date: { year, month, day },
      totalSpend: Number(spend),
      newCustomers: Number(customers),
      cac: Number(cac.toFixed(2))
    });
  }

  return dailyTrend.sort((a, b) => {
    if (a.date.year !== b.date.year) return a.date.year - b.date.year;
    if (a.date.month !== b.date.month) return a.date.month - b.date.month;
    return a.date.day - b.date.day;
  });
};

module.exports = {
  getCACAnalytics,
  addMarketingSpend,
  getMarketingSpend
};