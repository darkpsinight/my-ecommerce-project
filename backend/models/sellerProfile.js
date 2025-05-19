const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Social media link schema
const socialMediaLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: [true, "Platform name is required"],
    trim: true
  },
  url: {
    type: String,
    required: [true, "URL is required"],
    trim: true
  }
}, { _id: false });

// Enterprise details schema
const enterpriseDetailsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  socialMedia: {
    type: [socialMediaLinkSchema],
    default: []
  }
}, { _id: false });

// Seller profile schema
const sellerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
    unique: true
  },
  nickname: {
    type: String,
    required: [true, "Nickname is required"],
    trim: true,
    maxlength: [50, "Nickname cannot be more than 50 characters"]
  },
  profileImageUrl: {
    type: String,
    trim: true
  },
  bannerImageUrl: {
    type: String,
    trim: true
  },
  marketName: {
    type: String,
    trim: true,
    maxlength: [100, "Market name cannot be more than 100 characters"]
  },
  enterpriseDetails: {
    type: enterpriseDetailsSchema,
    default: {}
  },
  externalId: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4,
    index: true
  }
}, {
  timestamps: true
});

// Create indexes for performance
sellerProfileSchema.index({ userId: 1 });
sellerProfileSchema.index({ nickname: 1 });
sellerProfileSchema.index({ externalId: 1 });

const SellerProfile = mongoose.model("SellerProfile", sellerProfileSchema);

module.exports = {
  SellerProfile,
  sellerProfileSchema
};
