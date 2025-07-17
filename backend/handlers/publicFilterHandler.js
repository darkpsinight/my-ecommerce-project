const { Listing } = require("../models/listing");
const { Category } = require("../models/category");

// Cache for filter options (5 minutes cache)
let filterOptionsCache = null;
let filterOptionsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for price range requests (1 minute cache to handle rapid calls)
const priceRangeCache = new Map();
const PRICE_RANGE_CACHE_DURATION = 60 * 1000; // 1 minute

// Get dynamic filter options for products
const getFilterOptions = async (request, reply) => {
  try {
    // Check cache first
    const now = Date.now();
    if (filterOptionsCache && (now - filterOptionsCacheTime) < CACHE_DURATION) {
      request.log.info("Public API: Returning cached filter options");
      return reply.code(200).send({
        success: true,
        data: filterOptionsCache
      });
    }

    // Base filter to only show active listings
    const baseFilter = { status: "active" };

    // Get categories with counts
    const categoriesAggregation = await Listing.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$categoryId",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $unwind: "$category"
      },
      {
        $match: {
          "category.isActive": true
        }
      },
      {
        $project: {
          _id: 1,
          name: "$category.name",
          count: 1
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    // Get platforms with counts
    const platformsAggregation = await Listing.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$platform",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          count: 1
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    // Get regions with counts
    const regionsAggregation = await Listing.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$region",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          count: 1
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    // Get price range
    const priceRange = await Listing.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          min: { $min: "$price" },
          max: { $max: "$price" }
        }
      }
    ]);

    const result = {
      categories: categoriesAggregation,
      platforms: platformsAggregation,
      regions: regionsAggregation,
      priceRange: priceRange.length > 0 ? {
        min: priceRange[0].min,
        max: priceRange[0].max
      } : { min: 0, max: 0 }
    };

    // Cache the result
    filterOptionsCache = result;
    filterOptionsCacheTime = now;

    request.log.info(`Public API: Fetching filter options. Found ${result.categories.length} categories, ${result.platforms.length} platforms, ${result.regions.length} regions`);

    return reply.code(200).send({
      success: true,
      data: result
    });
  } catch (error) {
    request.log.error(`Error fetching filter options: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to fetch filter options",
      message: error.message
    });
  }
};

// Get price range based on filters (for debounced requests)
const getPriceRange = async (request, reply) => {
  try {
    const { categoryId, platform, region, search } = request.query;
    
    // Create cache key from query parameters
    const cacheKey = JSON.stringify({ categoryId, platform, region, search });
    const now = Date.now();
    
    // Check if we have a cached result
    if (priceRangeCache.has(cacheKey)) {
      const cached = priceRangeCache.get(cacheKey);
      if (now - cached.timestamp < PRICE_RANGE_CACHE_DURATION) {
        request.log.info("Public API: Returning cached price range");
        return reply.code(200).send({
          success: true,
          data: cached.data
        });
      }
    }

    // Build filter object
    const filter = { status: "active" };

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (platform) {
      filter.platform = platform;
    }

    if (region) {
      filter.region = region;
    }

    // Add search functionality
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { platform: searchRegex },
        { region: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    // Get price range with filters
    const priceRange = await Listing.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          min: { $min: "$price" },
          max: { $max: "$price" }
        }
      }
    ]);

    const result = priceRange.length > 0 ? {
      min: priceRange[0].min,
      max: priceRange[0].max
    } : { min: 0, max: 0 };

    // Cache the result
    priceRangeCache.set(cacheKey, {
      data: result,
      timestamp: now
    });

    // Clean up old cache entries (keep only last 100 entries)
    if (priceRangeCache.size > 100) {
      const oldestKey = priceRangeCache.keys().next().value;
      priceRangeCache.delete(oldestKey);
    }

    request.log.info(`Public API: Fetching price range with filters. Range: ${result.min} - ${result.max}`);

    return reply.code(200).send({
      success: true,
      data: result
    });
  } catch (error) {
    request.log.error(`Error fetching price range: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to fetch price range",
      message: error.message
    });
  }
};

module.exports = {
  getFilterOptions,
  getPriceRange
};