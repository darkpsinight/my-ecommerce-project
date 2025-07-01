const { Listing } = require("../models/listing");
const { SellerProfile } = require("../models/sellerProfile");
const { User } = require("../models/user");
const { processListingsExpiration } = require("../utils/listingHelpers");
const { maskCode } = require("./listingHandlers");

// Get all listings with filters
const getListings = async (request, reply) => {
  try {
    const {
      category, platform, region, minPrice, maxPrice,
      sellerId, status, page = 1, limit = 10, search
    } = request.query;

    // Build filter object
    const filter = {};

    if (category) filter.category = category;
    if (platform) filter.platform = platform;
    if (region) filter.region = region;
    if (status) filter.status = status;

    // Add search functionality
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { platform: searchRegex },
        { region: searchRegex }
      ];
    }

    // Handle sellerId - could be user UID or seller profile externalId
    if (sellerId) {
      // First try to find if sellerId is a seller profile externalId
      const sellerProfile = await SellerProfile.findOne({ externalId: sellerId });
      if (sellerProfile) {
        // Get the user's uid from the seller profile's userId
        const user = await User.findById(sellerProfile.userId);
        if (user) {
          filter.sellerId = user.uid;
        } else {
          // If user not found, this will result in no matches
          filter.sellerId = 'user-not-found';
        }
      } else {
        // Assume it's a direct user UID
        filter.sellerId = sellerId;
      }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // If user is not authenticated or not an admin, only show active listings
    const userRoles = request.user ? request.user.roles : [];
    if (!request.user || !userRoles.includes("admin")) {
      filter.status = "active";
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Find listings with filters and pagination
    const listings = await Listing.find(filter)
      .select("+codes") // Include codes for virtual field calculations
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Perform real-time expiration check on the results
    processListingsExpiration(listings, request.server);

    // Count total listings matching the filter
    const total = await Listing.countDocuments(filter);

    // Transform listings to use externalId as primary identifier and add market name
    const transformedListings = await Promise.all(listings.map(async (listing) => {
      const listingObj = listing.toObject();
      const { _id, codes, ...cleanedListing } = listingObj;
      
      // Get seller profile to add market name
      try {
        const user = await User.findOne({ uid: listing.sellerId });
        if (user) {
          const sellerProfile = await SellerProfile.findOne({ userId: user._id });
          if (sellerProfile) {
            cleanedListing.sellerMarketName = sellerProfile.marketName || sellerProfile.nickname || 'Unknown Seller';
          }
        }
      } catch (error) {
        request.log.error(`Error fetching seller profile for listing ${listing.externalId}: ${error.message}`);
      }
      
      return cleanedListing;
    }));

    return reply.code(200).send({
      success: true,
      data: {
        listings: transformedListings,
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

    // Find the listing by externalId instead of _id
    const listing = await Listing.findOne({ externalId: id }).select("+codes");

    if (!listing) {
      return reply.code(404).send({
        success: false,
        error: "Listing not found"
      });
    }

    // Check if any codes are expired
    const now = new Date();
    let needsUpdate = false;

    if (listing.codes && listing.codes.length > 0) {
      for (const code of listing.codes) {
        if (code.soldStatus === 'active' && code.expirationDate && new Date(code.expirationDate) < now) {
          code.soldStatus = 'expired';
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await listing.save();
      }
    }

    // Check if user is the seller or an admin to show more details
    const isSeller = request.user && request.user.uid === listing.sellerId;
    const userRoles = request.user ? request.user.roles : [];
    const isAdmin = request.user && userRoles.includes("admin");

    // If not active and not the seller or admin, don't show
    if (listing.status !== "active" && !isSeller && !isAdmin) {
      return reply.code(404).send({
        success: false,
        error: "Listing not found"
      });
    }

    // Transform listing to use externalId as primary identifier and add market name
    const listingObj = listing.toObject();
    const { _id, codes, ...cleanedListing } = listingObj;

    // Get seller profile to add market name
    try {
      const user = await User.findOne({ uid: listing.sellerId });
      if (user) {
        const sellerProfile = await SellerProfile.findOne({ userId: user._id });
        if (sellerProfile) {
          cleanedListing.sellerMarketName = sellerProfile.marketName || sellerProfile.nickname || 'Unknown Seller';
        }
      }
    } catch (error) {
      request.log.error(`Error fetching seller profile for listing ${listing.externalId}: ${error.message}`);
    }

    return reply.code(200).send({
      success: true,
      data: cleanedListing
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

    // Build filter object - always filter by the authenticated seller's ID and exclude deleted listings
    const filter = { 
      sellerId,
      status: { $ne: 'deleted' } // Exclude soft deleted listings
    };

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
    
    // Handle status filtering - if status is explicitly provided and it's 'deleted', 
    // override the default exclusion of deleted listings
    if (status) {
      if (status === 'deleted') {
        // If explicitly requesting deleted listings, remove the $ne filter and set status to deleted
        delete filter.status;
        filter.status = 'deleted';
      } else {
        // For other statuses, combine with the existing filter
        filter.status = { $ne: 'deleted', $eq: status };
      }
    }

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
      .select('+codes.code +codes.iv +sellerNotes')
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
                soldStatus: codeObj.soldStatus,
                soldAt: codeObj.soldAt,
                codeId: codeObj.codeId, // Include only the codeId for external reference
                code: maskCode(decryptedCode),
                expirationDate: codeObj.expirationDate, // Include the expiration date
              };
            } else {
              // If code doesn't exist or can't be decrypted
              return {
                soldStatus: codeObj.soldStatus,
                soldAt: codeObj.soldAt,
                codeId: codeObj.codeId, // Include only the codeId for external reference
                code: codeObj.soldStatus === 'active' ? 'Code unavailable' : `${codeObj.soldStatus} code`,
                expirationDate: codeObj.expirationDate, // Include the expiration date
              };
            }
          } catch (error) {
            request.log.error(`Error processing code: ${error.message}`);
            return {
              soldStatus: codeObj.soldStatus,
              soldAt: codeObj.soldAt,
              codeId: codeObj.codeId, // Include only the codeId for external reference
              code: 'Error processing code',
              expirationDate: codeObj.expirationDate, // Include the expiration date
            };
          }
        });
      } else {
        // If no codes, set quantities to 0
        listingObj.quantityOfAllCodes = 0;
        listingObj.quantityOfActiveCodes = 0;
      }

      // Use externalId as the primary identifier and remove _id
      const { _id, ...cleanedListing } = listingObj;

      return cleanedListing;
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

// Get expiration groups for a listing
const getListingExpirationGroups = async (request, reply) => {
  try {
    const { id } = request.params;

    if (!id) {
      return reply.code(400).send({
        success: false,
        error: "Listing ID is required"
      });
    }

    // Find the listing by external ID and include codes
    const listing = await Listing.findOne({ externalId: id }).select("+codes");

    if (!listing) {
      return reply.code(404).send({
        success: false,
        error: "Listing not found"
      });
    }

    // Check if listing is active
    if (listing.status !== 'active') {
      return reply.code(400).send({
        success: false,
        error: "Listing is not active"
      });
    }

    // Get expiration groups
    const expirationGroups = listing.getExpirationGroups();

    return reply.code(200).send({
      success: true,
      data: {
        listingId: listing.externalId,
        expirationGroups: expirationGroups
      }
    });

  } catch (error) {
    request.log.error(`Error fetching expiration groups: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to fetch expiration groups",
      message: error.message
    });
  }
};

module.exports = {
  getListings,
  getListingById,
  getSellerListings,
  getListingsSummary,
  getListingExpirationGroups
};
