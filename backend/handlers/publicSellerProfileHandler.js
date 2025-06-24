const { SellerProfile } = require("../models/sellerProfile");
const mongoose = require("mongoose");

/**
 * Get seller profile by ID (public endpoint)
 */
const getPublicSellerProfileById = async (request, reply) => {
  try {
    const { id } = request.params;
    
    // Check if ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      // Try to find by externalId
      const sellerProfile = await SellerProfile.findOne({ externalId: id });
      
      if (!sellerProfile) {
        return reply.code(404).send({
          success: false,
          error: "Seller profile not found"
        });
      }
      
      return reply.code(200).send({
        success: true,
        data: sellerProfile
      });
    }
    
    // Find by MongoDB ObjectId
    const sellerProfile = await SellerProfile.findById(id);
    
    if (!sellerProfile) {
      return reply.code(404).send({
        success: false,
        error: "Seller profile not found"
      });
    }
    
    return reply.code(200).send({
      success: true,
      data: sellerProfile
    });
  } catch (error) {
    request.log.error(`Error fetching public seller profile by ID: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Internal server error"
    });
  }
};

/**
 * Get all seller profiles (public endpoint)
 */
const getAllPublicSellerProfiles = async (request, reply) => {
  try {
    const { page = 1, limit = 24, search = "", sort = "createdAt" } = request.query;
    
    // Build query
    const query = {};
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { nickname: { $regex: search, $options: "i" } },
        { marketName: { $regex: search, $options: "i" } },
        { "enterpriseDetails.companyName": { $regex: search, $options: "i" } }
      ];
    }
    
    // Calculate pagination
    const skipAmount = (parseInt(page) - 1) * parseInt(limit);
    
    // Determine sort order
    let sortOption = {};
    switch (sort) {
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "name":
        sortOption = { nickname: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    // Fetch seller profiles with pagination
    const sellerProfiles = await SellerProfile.find(query)
      .select('nickname profileImageUrl bannerImageUrl marketName about badges enterpriseDetails externalId createdAt')
      .sort(sortOption)
      .skip(skipAmount)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalCount = await SellerProfile.countDocuments(query);
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    return reply.code(200).send({
      success: true,
      data: {
        sellers: sellerProfiles,
        total: totalCount,
        totalPages,
        currentPage: parseInt(page),
        hasNext: parseInt(page) < totalPages,
        hasPrevious: parseInt(page) > 1
      }
    });
  } catch (error) {
    request.log.error(`Error fetching public seller profiles: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Internal server error"
    });
  }
};

module.exports = {
  getPublicSellerProfileById,
  getAllPublicSellerProfiles
};
