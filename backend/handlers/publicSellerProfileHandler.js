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

module.exports = {
  getPublicSellerProfileById
};
