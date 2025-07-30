const ListingImpression = require("../models/listingImpression");
const ViewedProduct = require("../models/viewedProduct");
const { Listing } = require("../models/listing");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/responseHelpers");

// @route   POST /api/v1/impressions/track
// @desc    Track listing impressions for CTR analytics
// @access  Public (works for both authenticated and anonymous users)
const trackImpressions = async (request, reply) => {
  request.log.info("handlers/trackImpressions");

  try {
    const { impressions } = request.body;

    if (!impressions || !Array.isArray(impressions) || impressions.length === 0) {
      return sendErrorResponse(reply, 400, "Impressions array is required");
    }

    // Validate impressions data
    for (const impression of impressions) {
      if (!impression.productId) {
        return sendErrorResponse(reply, 400, "Product ID is required for each impression");
      }
    }

    // Get user identification
    const userUid = request.user?.uid || null;
    const anonymousId = request.body.anonymousId || request.headers['x-anonymous-id'] || null;

    if (!userUid && !anonymousId) {
      return sendErrorResponse(reply, 400, "User identification required (either authenticated user or anonymous ID)");
    }

    // Get IP-based location data (you might want to integrate with a geolocation service)
    const clientIP = request.headers['x-forwarded-for'] || 
                     request.headers['x-real-ip'] || 
                     request.connection.remoteAddress || 
                     request.socket.remoteAddress ||
                     (request.connection.socket ? request.connection.socket.remoteAddress : null);

    const results = [];

    // Track each impression
    for (const impressionData of impressions) {
      try {
        const impression = await ListingImpression.trackImpression({
          userUid,
          anonymousId,
          productId: impressionData.productId,
          metadata: {
            source: impressionData.source || 'other',
            position: impressionData.position,
            totalItemsShown: impressionData.totalItemsShown,
            searchQuery: impressionData.searchQuery,
            category: impressionData.category,
            platform: impressionData.platform,
            deviceType: impressionData.deviceType || 'other',
            sessionId: impressionData.sessionId,
            pageUrl: impressionData.pageUrl,
            referrer: impressionData.referrer,
            viewport: impressionData.viewport,
            customerLocation: {
              ipAddress: clientIP,
              // Add geolocation data here if you have a service
              ...impressionData.customerLocation
            }
          }
        });

        results.push({
          productId: impressionData.productId,
          impressionId: impression.externalId,
          success: true
        });
      } catch (error) {
        request.log.error(`Error tracking impression for product ${impressionData.productId}: ${error.message}`);
        results.push({
          productId: impressionData.productId,
          success: false,
          error: error.message
        });
      }
    }

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: `Tracked ${results.filter(r => r.success).length} of ${impressions.length} impressions`,
      data: {
        results,
        totalTracked: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    request.log.error(`Error tracking impressions: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to track impressions");
  }
};

// @route   POST /api/v1/impressions/click
// @desc    Mark impression as clicked when user views product
// @access  Public (works for both authenticated and anonymous users)
const markImpressionClicked = async (request, reply) => {
  request.log.info("handlers/markImpressionClicked");

  try {
    const { productId, viewId } = request.body;

    if (!productId) {
      return sendErrorResponse(reply, 400, "Product ID is required");
    }

    // Get user identification
    const userUid = request.user?.uid || null;
    const anonymousId = request.body.anonymousId || request.headers['x-anonymous-id'] || null;

    if (!userUid && !anonymousId) {
      return sendErrorResponse(reply, 400, "User identification required");
    }

    // Mark the impression as clicked
    const updatedImpression = await ListingImpression.markAsClicked(
      productId,
      userUid,
      anonymousId,
      viewId
    );

    if (updatedImpression) {
      return sendSuccessResponse(reply, {
        statusCode: 200,
        message: "Impression marked as clicked",
        data: {
          impressionId: updatedImpression.externalId,
          productId: updatedImpression.productId,
          clickDelay: updatedImpression.clickDelay,
          clickDelaySeconds: Math.round(updatedImpression.clickDelay / 1000)
        }
      });
    } else {
      // This is not necessarily an error - user might have clicked without a recent impression
      return sendSuccessResponse(reply, {
        statusCode: 200,
        message: "No recent impression found to mark as clicked",
        data: { productId }
      });
    }

  } catch (error) {
    request.log.error(`Error marking impression as clicked: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to mark impression as clicked");
  }
};

// @route   GET /api/v1/impressions/analytics
// @desc    Get impression and CTR analytics (for admin/seller use)
// @access  Private (admin or seller role required)
const getImpressionAnalytics = async (request, reply) => {
  request.log.info("handlers/getImpressionAnalytics");

  try {
    // Check if user has appropriate permissions
    if (!request.user || (!request.user.roles?.includes('admin') && !request.user.roles?.includes('seller'))) {
      return sendErrorResponse(reply, 403, "Admin or seller role required");
    }

    const { 
      timeRange = '30d',
      groupBy = 'product',
      includePosition = false,
      productIds 
    } = request.query;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // If seller, get their product IDs
    let targetProductIds = productIds ? productIds.split(',') : [];
    
    if (request.user.roles?.includes('seller') && !request.user.roles?.includes('admin')) {
      // For sellers, only show their own products
      const { User } = require("../models/user");
      const user = await User.findOne({ uid: request.user.uid });
      if (!user) {
        return sendErrorResponse(reply, 404, "User not found");
      }

      const sellerListings = await Listing.find({
        sellerId: user.uid,
        status: { $ne: 'deleted' }
      }).select('externalId').lean();

      targetProductIds = sellerListings.map(listing => listing.externalId);
    }

    if (targetProductIds.length === 0) {
      return sendSuccessResponse(reply, {
        statusCode: 200,
        message: "No products found for analytics",
        data: {
          analytics: [],
          positionAnalysis: [],
          summary: {
            totalImpressions: 0,
            totalClicks: 0,
            overallCTR: 0
          }
        }
      });
    }

    // Get CTR analytics
    const analytics = await ListingImpression.getCTRAnalytics(
      targetProductIds,
      startDate,
      now,
      { groupBy, includePosition }
    );

    // Get position-based analysis if requested
    let positionAnalysis = [];
    if (includePosition) {
      positionAnalysis = await ListingImpression.getPositionCTRAnalysis(
        targetProductIds,
        startDate,
        now
      );
    }

    // Calculate summary statistics
    const summary = analytics.reduce((acc, item) => {
      acc.totalImpressions += item.totalImpressions || 0;
      acc.totalClicks += item.totalClicks || 0;
      return acc;
    }, { totalImpressions: 0, totalClicks: 0 });

    summary.overallCTR = summary.totalImpressions > 0 
      ? Number(((summary.totalClicks / summary.totalImpressions) * 100).toFixed(2))
      : 0;

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Impression analytics retrieved successfully",
      data: {
        analytics,
        positionAnalysis,
        summary,
        timeRange,
        groupBy,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    request.log.error(`Error getting impression analytics: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to retrieve impression analytics");
  }
};

module.exports = {
  trackImpressions,
  markImpressionClicked,
  getImpressionAnalytics
};