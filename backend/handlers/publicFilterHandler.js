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

    // Get price range with filters
    let priceRangePipeline = [{ $match: filter }];
    
    // Add search functionality if search term is provided
    if (search) {
      priceRangePipeline = [
        { $match: filter },
        
        // Lookup user data
        {
          $lookup: {
            from: 'users',
            localField: 'sellerId',
            foreignField: 'uid',
            as: 'user'
          }
        },
        
        // Lookup seller profile data
        {
          $lookup: {
            from: 'sellerprofiles',
            localField: 'user._id',
            foreignField: 'userId',
            as: 'sellerProfile'
          }
        },
        
        // Add computed fields
        {
          $addFields: {
            sellerMarketName: {
              $ifNull: [
                { $arrayElemAt: ['$sellerProfile.marketName', 0] },
                { $arrayElemAt: ['$sellerProfile.nickname', 0] }
              ]
            }
          }
        },
        
        // Apply search filter
        {
          $match: {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
              { platform: { $regex: search, $options: 'i' } },
              { region: { $regex: search, $options: 'i' } },
              { tags: { $elemMatch: { $regex: search, $options: 'i' } } },
              { sellerMarketName: { $regex: search, $options: 'i' } }
            ]
          }
        }
      ];
    }
    
    // Add the group stage for price range calculation
    priceRangePipeline.push({
      $group: {
        _id: null,
        min: { $min: "$price" },
        max: { $max: "$price" }
      }
    });

    const priceRange = await Listing.aggregate(priceRangePipeline);

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

// Get search autocomplete suggestions
const getSearchSuggestions = async (request, reply) => {
  try {
    const { q: query, limit = 10 } = request.query;
    
    if (!query || query.trim().length === 0) {
      return reply.code(400).send({
        success: false,
        error: "Query parameter 'q' is required"
      });
    }

    const searchTerm = query.trim();
    const suggestions = [];
    const seenSuggestions = new Set();

    // Base filter to only show active listings
    const baseFilter = { status: "active" };

    // Create regex for case-insensitive search
    const searchRegex = { $regex: searchTerm, $options: 'i' };

    // 1. Get title suggestions with images
    const titleSuggestions = await Listing.aggregate([
      { $match: { ...baseFilter, title: searchRegex } },
      {
        $project: {
          title: 1,
          thumbnailUrl: 1,
          _id: 0
        }
      },
      { $limit: limit }
    ]);

    titleSuggestions.forEach(item => {
      if (!seenSuggestions.has(item.title.toLowerCase())) {
        suggestions.push({
          text: item.title,
          type: "title",
          category: "Product",
          imageUrl: item.thumbnailUrl || null
        });
        seenSuggestions.add(item.title.toLowerCase());
      }
    });

    // 2. Get platform suggestions with sample image
    const platformSuggestions = await Listing.aggregate([
      { $match: { ...baseFilter, platform: searchRegex } },
      {
        $group: {
          _id: "$platform",
          count: { $sum: 1 },
          sampleImage: { $first: "$thumbnailUrl" }
        }
      },
      {
        $project: {
          platform: "$_id",
          count: 1,
          sampleImage: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    platformSuggestions.forEach(item => {
      if (!seenSuggestions.has(item.platform.toLowerCase())) {
        suggestions.push({
          text: item.platform,
          type: "platform",
          category: "Platform",
          imageUrl: item.sampleImage || null
        });
        seenSuggestions.add(item.platform.toLowerCase());
      }
    });

    // 3. Get tag suggestions with sample image
    const tagSuggestions = await Listing.aggregate([
      { $match: { ...baseFilter, tags: { $elemMatch: searchRegex } } },
      { $unwind: "$tags" },
      { $match: { tags: searchRegex } },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
          sampleImage: { $first: "$thumbnailUrl" }
        }
      },
      {
        $project: {
          tag: "$_id",
          count: 1,
          sampleImage: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    tagSuggestions.forEach(item => {
      if (!seenSuggestions.has(item.tag.toLowerCase())) {
        suggestions.push({
          text: item.tag,
          type: "tag",
          category: "Tag",
          imageUrl: item.sampleImage || null
        });
        seenSuggestions.add(item.tag.toLowerCase());
      }
    });

    // 4. Get listings that match in description but show the listing title
    const descriptionSuggestions = await Listing.aggregate([
      { $match: { ...baseFilter, description: searchRegex } },
      {
        $project: {
          title: 1,
          thumbnailUrl: 1,
          _id: 0
        }
      },
      { $limit: 5 }
    ]);

    descriptionSuggestions.forEach(item => {
      // Show the listing title instead of description phrases
      if (item.title && !seenSuggestions.has(item.title.toLowerCase())) {
        suggestions.push({
          text: item.title,
          type: "description",
          category: "Product",
          imageUrl: item.thumbnailUrl || null
        });
        seenSuggestions.add(item.title.toLowerCase());
      }
    });

    // 5. Get seller suggestions with profile images
    const sellerSuggestions = await Listing.aggregate([
      { $match: baseFilter },
      
      // Lookup user data
      {
        $lookup: {
          from: 'users',
          localField: 'sellerId',
          foreignField: 'uid',
          as: 'user'
        }
      },
      
      // Lookup seller profile data
      {
        $lookup: {
          from: 'sellerprofiles',
          localField: 'user._id',
          foreignField: 'userId',
          as: 'sellerProfile'
        }
      },
      
      // Add computed fields
      {
        $addFields: {
          sellerMarketName: {
            $ifNull: [
              { $arrayElemAt: ['$sellerProfile.marketName', 0] },
              { $arrayElemAt: ['$sellerProfile.nickname', 0] }
            ]
          },
          sellerProfileImage: { $arrayElemAt: ['$sellerProfile.profileImageUrl', 0] }
        }
      },
      
      // Match sellers with search term
      {
        $match: {
          sellerMarketName: searchRegex
        }
      },
      
      {
        $group: {
          _id: "$sellerMarketName",
          count: { $sum: 1 },
          profileImage: { $first: "$sellerProfileImage" }
        }
      },
      
      {
        $project: {
          sellerName: "$_id",
          count: 1,
          profileImage: 1,
          _id: 0
        }
      },
      
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    sellerSuggestions.forEach(item => {
      if (item.sellerName && !seenSuggestions.has(item.sellerName.toLowerCase())) {
        suggestions.push({
          text: item.sellerName,
          type: "seller",
          category: "Seller",
          imageUrl: item.profileImage || null
        });
        seenSuggestions.add(item.sellerName.toLowerCase());
      }
    });

    // Sort suggestions by relevance (prioritize exact matches and shorter text)
    suggestions.sort((a, b) => {
      const aLower = a.text.toLowerCase();
      const bLower = b.text.toLowerCase();
      const queryLower = searchTerm.toLowerCase();
      
      // Exact matches first
      const aExact = aLower === queryLower;
      const bExact = bLower === queryLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Starts with query
      const aStarts = aLower.startsWith(queryLower);
      const bStarts = bLower.startsWith(queryLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      // Shorter text first (more relevant)
      return a.text.length - b.text.length;
    });

    // Limit final results
    const finalSuggestions = suggestions.slice(0, limit);

    request.log.info(`Public API: Generated ${finalSuggestions.length} search suggestions for query: "${searchTerm}"`);

    return reply.code(200).send({
      success: true,
      data: finalSuggestions
    });
  } catch (error) {
    request.log.error(`Error generating search suggestions: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to generate search suggestions",
      message: error.message
    });
  }
};

module.exports = {
  getFilterOptions,
  getPriceRange,
  getSearchSuggestions
};