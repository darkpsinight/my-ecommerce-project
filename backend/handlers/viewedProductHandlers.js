const ViewedProduct = require("../models/viewedProduct");
const { User } = require("../models/user");
const { Listing } = require("../models/listing");
const { sendErrorResponse, sendSuccessResponse } = require("../utils/responseHelpers");

// Helper functions to match expected interface
const errorResponse = (reply, message, statusCode = 500, options = {}) => {
  return sendErrorResponse(reply, statusCode, message, options);
};

const successResponse = (reply, message, data = null, statusCode = 200) => {
  return sendSuccessResponse(reply, {
    statusCode,
    message,
    data
  });
};

/**
 * Add a viewed product record for authenticated or anonymous user
 * POST /api/v1/viewed-products
 */
const addViewedProduct = async (request, reply) => {
  try {
    const { productId, metadata = {}, anonymousId } = request.body;
    const userUid = request.user?.uid; // Optional for anonymous users

    console.log('🚀 addViewedProduct called with:', {
      productId,
      userUid,
      anonymousId,
      metadata,
      isAuthenticated: !!request.user,
      route: request.url
    });

    // Validate required fields
    if (!productId) {
      console.log('❌ Missing productId');
      return errorResponse(reply, "Product ID is required", 400);
    }

    // For anonymous users, require anonymousId
    if (!userUid && !anonymousId) {
      console.log('❌ Missing user identification');
      return errorResponse(reply, "Anonymous ID is required for non-authenticated users", 400);
    }

    // Verify product exists
    const product = await Listing.findOne({ 
      externalId: productId, 
      status: { $ne: 'deleted' } 
    }).lean();
    
    if (!product) {
      console.log('❌ Product not found:', productId);
      return errorResponse(reply, "Product not found", 404);
    }

    console.log('✅ Product found:', product.title);

    // Add or update the view record
    const viewRecord = await ViewedProduct.addOrUpdateView({
      userUid,
      anonymousId,
      productId,
      metadata: {
        source: metadata.source || 'other',
        deviceType: metadata.deviceType || 'other',
        sessionId: metadata.sessionId,
        referrer: metadata.referrer,
        viewDuration: metadata.viewDuration
      }
    });

    console.log('✅ View record processed:', {
      viewId: viewRecord.externalId,
      viewedAt: viewRecord.viewedAt,
      wasUpdated: viewRecord.updatedAt > viewRecord.createdAt
    });

    return successResponse(reply, "Product view recorded successfully", {
      viewId: viewRecord.externalId,
      viewedAt: viewRecord.viewedAt
    });

  } catch (error) {
    console.error("Error adding viewed product:", error);
    return errorResponse(reply, "Failed to record product view", 500);
  }
};

/**
 * Bulk add viewed products (used for localStorage migration)
 * POST /api/v1/viewed-products/bulk
 */
const bulkAddViewedProducts = async (request, reply) => {
  try {
    const { products } = request.body;
    const userUid = request.user.uid;

    // Validate input
    if (!Array.isArray(products) || products.length === 0) {
      return errorResponse(reply, "Products array is required and cannot be empty", 400);
    }

    if (products.length > 100) {
      return errorResponse(reply, "Cannot process more than 100 products at once", 400);
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each product
    for (const productData of products) {
      try {
        const { productId, viewedAt, metadata = {} } = productData;

        if (!productId) {
          results.failed++;
          results.errors.push({ productId: 'unknown', error: 'Product ID is required' });
          continue;
        }

        // Verify product exists
        const product = await Listing.findOne({ 
          externalId: productId, 
          status: { $ne: 'deleted' } 
        }).lean();
        
        if (!product) {
          results.failed++;
          results.errors.push({ productId, error: 'Product not found' });
          continue;
        }

        // Create view record with provided timestamp or current time
        const viewRecord = new ViewedProduct({
          userUid,
          productId,
          viewedAt: viewedAt ? new Date(viewedAt) : new Date(),
          metadata: {
            source: metadata.source || 'migration',
            deviceType: metadata.deviceType || 'other',
            sessionId: metadata.sessionId,
            referrer: metadata.referrer,
            viewDuration: metadata.viewDuration
          },
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        });

        await viewRecord.save();
        results.successful++;

      } catch (error) {
        results.failed++;
        results.errors.push({ 
          productId: productData.productId || 'unknown', 
          error: error.message 
        });
      }
    }

    return successResponse(reply, "Bulk import completed", results);

  } catch (error) {
    console.error("Error in bulk add viewed products:", error);
    return errorResponse(reply, "Failed to process bulk import", 500);
  }
};

/**
 * Get user's recently viewed products
 * GET /api/v1/viewed-products
 */
const getViewedProducts = async (request, reply) => {
  try {
    const userUid = request.user.uid;
    const { 
      limit = 20, 
      offset = 0, 
      includeProductDetails = true,
      timeframe = '90d' 
    } = request.query;

    // Validate limits
    const parsedLimit = Math.min(parseInt(limit) || 20, 100);
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);

    // Calculate timeframe filter
    const timeframes = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      'all': null
    };
    
    const timeframeMs = timeframes[timeframe];
    const query = { 
      userUid, 
      isDeleted: false 
    };
    
    if (timeframeMs) {
      query.viewedAt = { $gte: new Date(Date.now() - timeframeMs) };
    }

    // Get viewed products
    const viewedProducts = await ViewedProduct.find(query)
      .sort({ viewedAt: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .lean();

    let result = viewedProducts.map(view => ({
      viewId: view.externalId,
      productId: view.productId,
      viewedAt: view.viewedAt,
      metadata: view.metadata
    }));

    // Include product details if requested
    if (includeProductDetails && viewedProducts.length > 0) {
      const productIds = viewedProducts.map(view => view.productId);
      
      // Fetch product details
      const products = await Listing.find({ 
        externalId: { $in: productIds },
        status: { $ne: 'deleted' }
      })
      .populate('categoryId', 'name')
      .lean();

      // Create product lookup map
      const productMap = products.reduce((map, product) => {
        map[product.externalId] = {
          id: product.externalId,
          title: product.title,
          description: product.description,
          price: product.price,
          originalPrice: product.originalPrice,
          categoryName: product.categoryId?.name,
          platform: product.platform,
          region: product.region,
          thumbnailUrl: product.thumbnailUrl,
          quantityOfActiveCodes: product.codes?.filter(code => code.soldStatus === 'active').length || 0,
          status: product.status
        };
        return map;
      }, {});

      // Merge view data with product details
      result = result.map(view => ({
        ...view,
        product: productMap[view.productId] || null
      }));
    }

    // Get total count for pagination
    const totalCount = await ViewedProduct.countDocuments(query);

    return successResponse(reply, "Recently viewed products retrieved successfully", {
      views: result,
      pagination: {
        total: totalCount,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < totalCount
      }
    });

  } catch (error) {
    console.error("Error getting viewed products:", error);
    return errorResponse(reply, "Failed to retrieve viewed products", 500);
  }
};

/**
 * Clear user's viewed products history
 * DELETE /api/v1/viewed-products
 */
const clearViewedProducts = async (request, reply) => {
  try {
    const userUid = request.user.uid;
    const { olderThan } = request.query;

    let query = { userUid, isDeleted: false };
    
    // If olderThan is specified, only clear views older than that date
    if (olderThan) {
      const olderThanDate = new Date(olderThan);
      if (isNaN(olderThanDate.getTime())) {
        return errorResponse(reply, "Invalid olderThan date format", 400);
      }
      query.viewedAt = { $lt: olderThanDate };
    }

    // Soft delete (mark as deleted instead of removing)
    const result = await ViewedProduct.updateMany(
      query,
      { 
        isDeleted: true,
        deletedAt: new Date()
      }
    );

    return successResponse(reply, "Viewed products history cleared successfully", {
      deletedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Error clearing viewed products:", error);
    return errorResponse(reply, "Failed to clear viewed products history", 500);
  }
};

/**
 * Remove a specific viewed product
 * DELETE /api/v1/viewed-products/:viewId
 */
const removeViewedProduct = async (request, reply) => {
  try {
    const { viewId } = request.params;
    const userUid = request.user.uid;

    const viewedProduct = await ViewedProduct.findOne({
      externalId: viewId,
      userUid,
      isDeleted: false
    });

    if (!viewedProduct) {
      return errorResponse(reply, "Viewed product not found", 404);
    }

    // Soft delete
    await viewedProduct.softDelete();

    return successResponse(reply, "Viewed product removed successfully");

  } catch (error) {
    console.error("Error removing viewed product:", error);
    return errorResponse(reply, "Failed to remove viewed product", 500);
  }
};

/**
 * Get viewing analytics for admin/support (future feature)
 * GET /api/v1/viewed-products/analytics
 */
const getViewingAnalytics = async (request, reply) => {
  try {
    // Check if user has admin or support role
    if (!request.user.roles.includes('admin') && !request.user.roles.includes('support')) {
      return errorResponse(reply, "Insufficient permissions", 403);
    }

    const { timeframe = '7d', type = 'popular' } = request.query;

    let result = {};

    switch (type) {
      case 'popular':
        result.popularProducts = await ViewedProduct.getPopularProducts(timeframe, 50);
        break;
      
      case 'trends':
        // Get viewing trends over time
        result.trends = await ViewedProduct.aggregate([
          {
            $match: {
              viewedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
              isDeleted: false
            }
          },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$viewedAt' } }
              },
              totalViews: { $sum: 1 },
              uniqueViewers: { $addToSet: '$userUid' }
            }
          },
          {
            $addFields: {
              uniqueViewerCount: { $size: '$uniqueViewers' }
            }
          },
          {
            $sort: { '_id.date': 1 }
          },
          {
            $project: {
              date: '$_id.date',
              totalViews: 1,
              uniqueViewerCount: 1,
              _id: 0
            }
          }
        ]);
        break;

      default:
        return errorResponse(reply, "Invalid analytics type", 400);
    }

    return successResponse(reply, "Analytics retrieved successfully", result);

  } catch (error) {
    console.error("Error getting viewing analytics:", error);
    return errorResponse(reply, "Failed to retrieve analytics", 500);
  }
};

module.exports = {
  addViewedProduct,
  bulkAddViewedProducts,
  getViewedProducts,
  clearViewedProducts,
  removeViewedProduct,
  getViewingAnalytics
};