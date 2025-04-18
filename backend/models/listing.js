const mongoose = require("mongoose");
const crypto = require("crypto");
const { configs } = require("../configs");

// Define the listing schema
const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a title for the listing"],
    trim: true,
    maxlength: [100, "Title cannot be more than 100 characters"]
  },
  description: {
    type: String,
    required: [true, "Please provide a description for the listing"],
    trim: true
  },
  price: {
    type: Number,
    required: [true, "Please provide a price for the listing"],
    min: [0, "Price cannot be negative"]
  },
  originalPrice: {
    type: Number,
    min: [0, "Original price cannot be negative"]
  },
  category: {
    type: String,
    required: [true, "Please provide a category for the listing"],
    enum: ["Gift Card", "Game Key", "Software License", "Subscription", "In-Game Currency", "Other"]
  },
  platform: {
    type: String,
    required: [true, "Please provide a platform/store for the listing"],
    enum: ["Steam", "Xbox", "PlayStation", "Nintendo", "Epic Games", "Origin", "Uplay", "GOG", "Battle.net", "iTunes", "Google Play", "Amazon", "Other"]
  },
  region: {
    type: String,
    required: [true, "Please provide a region for the listing"],
    enum: ["Global", "North America", "Europe", "Asia", "Oceania", "South America", "Africa", "Other"]
  },
  isRegionLocked: {
    type: Boolean,
    default: false
  },
  code: {
    type: String,
    required: [true, "Please provide a code for the listing"],
    select: false // This will not be selected in query by default
  },
  // Initialization vector for encryption
  iv: {
    type: String,
    select: false
  },
  expirationDate: {
    type: Date
  },
  quantity: {
    type: Number,
    required: [true, "Please provide a quantity for the listing"],
    default: 1,
    min: [0, "Quantity cannot be negative"]
  },
  supportedLanguages: {
    type: [String],
    default: ["English"]
  },
  thumbnailUrl: {
    type: String
  },
  autoDelivery: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    default: []
  },
  sellerNotes: {
    type: String,
    select: false // Private notes not shown to buyers
  },
  status: {
    type: String,
    enum: ["active", "sold", "expired", "suspended", "draft"],
    default: "active"
  },
  sellerId: {
    type: String,
    required: [true, "Seller ID is required"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the updatedAt field on save
listingSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to encrypt the code before saving
listingSchema.methods.encryptCode = function(code) {
  // Create an initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher using the secret key from configs and the iv
  const cipher = crypto.createCipheriv(
    "aes-256-cbc", 
    Buffer.from(configs.CODE_ENCRYPTION_KEY || crypto.randomBytes(32)), 
    iv
  );
  
  // Encrypt the code
  let encrypted = cipher.update(code, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  // Save the encrypted code and iv
  this.code = encrypted;
  this.iv = iv.toString("hex");
  
  return encrypted;
};

// Method to decrypt the code
listingSchema.methods.decryptCode = function() {
  try {
    // Create decipher using the secret key from configs and the stored iv
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(configs.CODE_ENCRYPTION_KEY || crypto.randomBytes(32)),
      Buffer.from(this.iv, "hex")
    );
    
    // Decrypt the code
    let decrypted = decipher.update(this.code, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Error decrypting code:", error);
    return null;
  }
};

// Create the Listing model
const Listing = mongoose.model("Listing", listingSchema);

module.exports = {
  Listing
};
