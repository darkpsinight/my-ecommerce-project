const { Listing } = require("../models/listing");
const { processListingsExpiration } = require("../utils/listingHelpers");
const { maskCode } = require("./listingHandlers");

// Get all listings with filters
const getListings = async (request, reply) => {
  try {
    const { 
      category, platform, region, minPrice, maxPrice, 
      sellerId, status, page = 1, limit = 10 
    } = request.query;
    
    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (platform) filter.platform = platform;
    if (region) filter.region = region;
    if (sellerId) filter.sellerId = sellerId;
    if (status) filter.status = status;
    
    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }
    
    // If user is not authenticated or not an admin, only show active listings
    if (!request.user || request.user.role !== "admin") {
      filter.status = "active";
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Find listings with filters and pagination
    const listings = await Listing.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Perform real-time expiration check on the results
    processListingsExpiration(listings, request.server);
    
    // Count total listings matching the filter
    const total = await Listing.countDocuments(filter);
    
    return reply.code(200).send({
      success: true,
      data: {
        listings,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    request.log.error(`Error fetching listings: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to fetch listings",
      message: error.message
    });
  }
};

// Get a single listing by ID
const getListingById = async (request, reply) => {
  try {
    const { id } = request.params;
    
    // Find the listing by ID
    const listing = await Listing.findById(id);
    
    if (!listing) {
      return reply.code(404).send({
        success: false,
        error: "Listing not found"
      });
    }
    
    // Check if the listing is expired
    if (listing.expirationDate && new Date(listing.expirationDate) < new Date()) {
      listing.status = "expired";
      await listing.save();
    }
    
    // Check if user is the seller or an admin to show more details
    const isSeller = request.user && request.user.uid === listing.sellerId;
    const isAdmin = request.user && request.user.role === "admin";
    
    // If not active and not the seller or admin, don't show
    if (listing.status !== "active" && !isSeller && !isAdmin) {
      return reply.code(404).send({
        success: false,
        error: "Listing not found"
      });
    }
    
    return reply.code(200).send({
      success: true,
      data: listing
    });
  } catch (error) {
    request.log.error(`Error fetching listing: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to fetch listing",
      message: error.message
    });
  }
};

// Get seller listings with masked codes
const getSellerListings = async (request, reply) => {
  try {
    const { 
      categoryId, platform, region, minPrice, maxPrice, 
      status, page = 1, limit = 5, sortBy = "createdAt", sortOrder = "desc",
      startDate, endDate, title
    } = request.query;
    
    // Get the seller ID from the authenticated user
    const sellerId = request.user.uid;
    
    // Build filter object - always filter by the authenticated seller's ID
    const filter = { sellerId };
    
    // Handle category filtering with support for "all" option
    if (categoryId && categoryId.toLowerCase() !== 'all') {
      filter.categoryId = categoryId; 
    } else if (request.query.category && request.query.category.toLowerCase() !== 'all') {
      filter.categoryId = request.query.category;
    }
    
    // Handle platform filtering with support for "all" option
    if (platform && platform.toLowerCase() !== 'all') {
      filter.platform = platform;
    }
    
    if (region) filter.region = region;
    if (status) filter.status = status;
    
    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }
    
    // Add date range filter for createdAt
    let createdAtFilter = {};
    if (request.query.startDate) createdAtFilter.$gte = new Date(request.query.startDate);
    if (request.query.endDate) createdAtFilter.$lte = new Date(request.query.endDate);
    if (Object.keys(createdAtFilter).length > 0) {
      filter.createdAt = createdAtFilter;
    }
    
    // Title case-insensitive search filter
    if (request.query.title) {
      filter.title = { $regex: request.query.title, $options: 'i' };
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build sort object based on sortBy and sortOrder parameters
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    
    // Find listings with filters, pagination, and sorting
    // We need to explicitly select the codes field which is normally excluded
    const listings = await Listing.find(filter)
      .select('+codes.code +codes.iv')
      .populate('categoryId', 'name') // Populate category information
      .skip(skip)
      .limit(limit)
      .sort(sort);
    
    // Perform real-time expiration check on the results
    processListingsExpiration(listings, request.server);
    
    // Count total listings matching the filter
    const total = await Listing.countDocuments(filter);
    
    // Process listings to include masked codes
    const processedListings = listings.map(listing => {
      const listingObj = listing.toObject();
      
      // Add category name from the populated field
      if (listingObj.categoryId && listingObj.categoryId.name) {
        listingObj.categoryName = listingObj.categoryId.name;
      }
      
      // Process codes array to decrypt and mask each code
      if (listingObj.codes && listingObj.codes.length > 0) {
        // Calculate quantity metrics
        listingObj.quantityOfAllCodes = listingObj.codes.length;
        listingObj.quantityOfActiveCodes = listingObj.codes.filter(code => code.soldStatus === 'active').length;
        
        listingObj.codes = listingObj.codes.map(codeObj => {
          // Process all codes regardless of status
          try {
            // Decrypt the code if it exists
            if (codeObj.code && codeObj.iv) {
              const decryptedCode = listing.decryptCode(codeObj.code, codeObj.iv);
              
              // Return object with masked code and status information
              return {
                ...codeObj,
                code: maskCode(decryptedCode),
                iv: undefined // Remove IV for security
              };
            } else {
              // If code doesn't exist or can't be decrypted
              return {
                ...codeObj,
                code: codeObj.soldStatus === 'active' ? 'Code unavailable' : `${codeObj.soldStatus} code`,
                iv: undefined
              };
            }
          } catch (error) {
            request.log.error(`Error processing code: ${error.message}`);
            return {
              ...codeObj,
              code: 'Error processing code',
              iv: undefined
            };
          }
        });
      } else {
        // If no codes, set quantities to 0
        listingObj.quantityOfAllCodes = 0;
        listingObj.quantityOfActiveCodes = 0;
      }
      
      return listingObj;
    });
    
    return reply.code(200).send({
      success: true,
      data: {
        listings: processedListings,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    request.log.error(`Error fetching seller listings: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to fetch seller listings",
      message: error.message
    });
  }
};

// Get seller listings summary statistics
const getListingsSummary = async (request, reply) => {
  try {
    // Get the seller ID from the authenticated user
    const sellerId = request.user.uid;
    
    // Get count of active listings
    const activeListingsCount = await Listing.countDocuments({ 
      sellerId, 
      status: "active" 
    });
    
    // Get count of delivered/sold codes
    const soldCodesCount = await Listing.aggregate([
      { $match: { sellerId } },
      { $unwind: "$codes" },
      { $match: { "codes.soldStatus": "sold" } },
      { $count: "total" }
    ]);
    
    const totalSoldCodes = soldCodesCount.length > 0 ? soldCodesCount[0].total : 0;
    
    // Calculate total revenue (assuming each sold code generates revenue equal to the listing price)
    const revenueData = await Listing.aggregate([
      { $match: { sellerId } },
      { $unwind: "$codes" },
      { $match: { "codes.soldStatus": "sold" } },
      { $group: {
          _id: null,
          totalRevenue: { $sum: "$price" }
        }
      }
    ]);
    
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    
    return reply.code(200).send({
      success: true,
      data: {
        activeListings: activeListingsCount,
        soldCodes: totalSoldCodes,
        totalRevenue: totalRevenue
      }
    });
  } catch (error) {
    request.log.error(`Error fetching listings summary: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to fetch listings summary",
      message: error.message
    });
  }
};

module.exports = {
  getListings,
  getListingById,
  getSellerListings,
  getListingsSummary
};
