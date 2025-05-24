const { User } = require("../models/user");
const { SellerProfile } = require("../models/sellerProfile");
const mongoose = require("mongoose");

/**
 * Get the seller's profile (basic user info + extended profile)
 */
const getSellerProfile = async (request, reply) => {
  try {
    const uid = request.user.uid;

    // Find the user by uid
    const user = await User.findOne({ uid });

    if (!user) {
      return reply.code(404).send({
        success: false,
        error: "User not found",
      });
    }

    // Find or create seller profile
    let sellerProfile = await SellerProfile.findOne({ userId: user._id });

    // If no profile exists yet, return just the basic user info
    if (!sellerProfile) {
      return reply.code(200).send({
        success: true,
        data: {
          user: {
            name: user.name,
            email: user.email,
            role: user.role,
          },
          profile: null,
          hasProfile: false
        },
      });
    }

    // Return combined user and profile data
    return reply.code(200).send({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
        profile: sellerProfile,
        hasProfile: true
      },
    });
  } catch (error) {
    request.log.error(`Error in seller profile: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * Update basic seller information
 */
const updateBasicSellerInfo = async (request, reply) => {
  try {
    // Get user ID from authenticated user
    const uid = request.user.uid;
    const updateData = request.body;

    // Find the user by uid
    const user = await User.findOne({ uid });

    if (!user) {
      return reply.code(404).send({
        success: false,
        error: "User not found",
      });
    }

    // Update allowed fields
    if (updateData.name) {
      user.name = updateData.name;
    }

    // Save the updated user
    await user.save();

    return reply.code(200).send({
      success: true,
      message: "Basic profile updated successfully",
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    request.log.error(`Error updating basic seller profile: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * Create or update seller profile
 */
const updateExtendedSellerProfile = async (request, reply) => {
  try {
    // Get user ID from authenticated user
    const uid = request.user.uid;
    const profileData = request.body;

    // Find the user by uid
    const user = await User.findOne({ uid });

    if (!user) {
      return reply.code(404).send({
        success: false,
        error: "User not found",
      });
    }

    // Find existing profile or create new one
    let sellerProfile = await SellerProfile.findOne({ userId: user._id });

    if (!sellerProfile) {
      // Create new profile with default badges
      const defaultBadges = [
        {
          name: 'New Seller',
          description: 'Welcome to our marketplace! Start your selling journey.',
          icon: 'verified',
          earnedAt: new Date()
        }
      ];

      sellerProfile = new SellerProfile({
        userId: user._id,
        nickname: profileData.nickname,
        profileImageUrl: profileData.profileImageUrl || "",
        bannerImageUrl: profileData.bannerImageUrl || "",
        marketName: profileData.marketName || "",
        about: profileData.about || "",
        badges: profileData.badges || defaultBadges,
        enterpriseDetails: profileData.enterpriseDetails || {}
      });
    } else {
      // Update existing profile
      sellerProfile.nickname = profileData.nickname;

      if (profileData.profileImageUrl !== undefined) {
        sellerProfile.profileImageUrl = profileData.profileImageUrl;
      }

      if (profileData.bannerImageUrl !== undefined) {
        sellerProfile.bannerImageUrl = profileData.bannerImageUrl;
      }

      if (profileData.marketName !== undefined) {
        sellerProfile.marketName = profileData.marketName;
      }

      if (profileData.about !== undefined) {
        sellerProfile.about = profileData.about;
      }

      if (profileData.badges !== undefined) {
        sellerProfile.badges = profileData.badges;
      }

      if (profileData.enterpriseDetails !== undefined) {
        sellerProfile.enterpriseDetails = profileData.enterpriseDetails;
      }
    }

    // Save the profile
    await sellerProfile.save();

    return reply.code(200).send({
      success: true,
      message: "Seller profile updated successfully",
      data: sellerProfile
    });
  } catch (error) {
    request.log.error(`Error updating seller profile: ${error.message}`);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return reply.code(400).send({
        success: false,
        error: "Validation error",
        details: validationErrors
      });
    }

    return reply.code(500).send({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * Get seller profile by ID (authenticated endpoint)
 */
const getSellerProfileById = async (request, reply) => {
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
    request.log.error(`Error fetching seller profile by ID: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Internal server error"
    });
  }
};

module.exports = {
  getSellerProfile,
  updateBasicSellerInfo,
  updateExtendedSellerProfile,
  getSellerProfileById
};
