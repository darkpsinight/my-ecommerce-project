const mongoose = require("mongoose");

/**
 * Simplified User model for database scripts to avoid circular dependencies
 * This is a read-only version focused on querying user data
 */

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
  },
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  bio: {
    type: String,
    maxlength: 500,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  dateOfBirth: Date,
  profilePicture: String,
  provider: {
    type: String,
    enum: ["email", "google"],
  },
  roles: {
    type: [String],
    enum: ["buyer", "admin", "support", "seller"],
    default: ["buyer"],
  },
  isEmailConfirmed: {
    type: Boolean,
    default: false,
  },
  isDeactivated: {
    type: Boolean,
    default: false,
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet"
  },
  stripeCustomerId: String,
  acquisitionSource: {
    channel: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmContent: String,
    utmTerm: String,
    referralCode: String,
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    acquisitionDate: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deactivatedAt: Date,
});

// Instance method to check if user has a specific role
userSchema.methods.hasRole = function(roleToCheck) {
  return this.roles && this.roles.includes(roleToCheck);
};

const User = mongoose.model("User", userSchema);

module.exports = { User };