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
  // Reference to the actual category document
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, "Please provide a category for the listing"]
  },
  platform: {
    type: String,
    required: [true, "Please provide a platform/store for the listing"]
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
  // Replace single code with codes array
  codes: [{
    code: {
      type: String,
      required: [true, "Please provide a code"],
      select: false // This will not be selected in query by default
    },
    iv: {
      type: String,
      select: false
    },
    soldStatus: {
      type: String,
      enum: ["active", "sold", "expired", "suspended", "draft"],
      default: "active"
    },
    soldAt: {
      type: Date
    }
  }],
  expirationDate: {
    type: Date
  },
  quantity: {
    type: Number,
    min: [0, "Quantity cannot be negative"],
    default: 0 // Will be calculated based on active codes
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

// Middleware to update the updatedAt field and handle code-related logic on save
listingSchema.pre("save", function(next) {
  // Update the updatedAt timestamp
  this.updatedAt = Date.now();
  
  // Calculate quantity based on active codes
  if (this.codes && this.codes.length > 0) {
    // Count only active codes
    const activeCodes = this.codes.filter(code => code.soldStatus === "active");
    this.quantity = activeCodes.length;
    
    // Check if listing is expired
    const isExpired = this.expirationDate && new Date(this.expirationDate) < new Date();
    
    if (isExpired) {
      // If expired, set status to expired regardless of other conditions
      this.status = "expired";
    } else if (this.status !== "draft") {
      // Only update status if not in draft state
      if (this.quantity > 0) {
        // Has active codes and not expired or draft
        this.status = "active";
      } else {
        // No active codes - determine if sold or suspended
        const hasSoldCodes = this.codes.some(code => code.soldStatus === "sold");
        this.status = hasSoldCodes ? "sold" : "suspended";
      }
    }
  } else {
    // No codes at all
    this.quantity = 0;
    
    // Only update status if not in draft or expired state
    if (this.status !== "draft" && this.status !== "expired") {
      this.status = "suspended";
    }
  }
  
  next();
});

// Method to encrypt a single code
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
  
  return {
    code: encrypted,
    iv: iv.toString("hex")
  };
};

// Method to decrypt a specific code
listingSchema.methods.decryptCode = function(encryptedCode, iv) {
  try {
    // Create decipher using the secret key from configs and the provided iv
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(configs.CODE_ENCRYPTION_KEY || crypto.randomBytes(32)),
      Buffer.from(iv, "hex")
    );
    
    // Decrypt the code
    let decrypted = decipher.update(encryptedCode, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Error decrypting code:", error);
    return null;
  }
};

// Method to add codes to the listing
listingSchema.methods.addCodes = function(plainTextCodes) {
  if (!Array.isArray(plainTextCodes)) {
    plainTextCodes = [plainTextCodes];
  }
  
  // Encrypt each code and add to the codes array
  plainTextCodes.forEach(plainCode => {
    const { code, iv } = this.encryptCode(plainCode);
    this.codes.push({
      code,
      iv,
      soldStatus: "active"
    });
  });
  
  return this.codes.length;
};

// Method to purchase a code - marks one active code as sold and returns the decrypted code
listingSchema.methods.purchaseCode = function() {
  // Find the first active code
  const activeCodeIndex = this.codes.findIndex(code => code.soldStatus === "active");
  
  if (activeCodeIndex === -1) {
    throw new Error("No active codes available for purchase");
  }
  
  // Get the active code
  const codeObj = this.codes[activeCodeIndex];
  
  // Decrypt the code
  const decryptedCode = this.decryptCode(codeObj.code, codeObj.iv);
  
  if (!decryptedCode) {
    throw new Error("Failed to decrypt the code");
  }
  
  // Mark the code as sold
  this.codes[activeCodeIndex].soldStatus = "sold";
  this.codes[activeCodeIndex].soldAt = new Date();
  
  // Save the listing to trigger the pre-save middleware
  // This will update quantity and status automatically
  this.save();
  
  return decryptedCode;
};

// Add a static method to fix inconsistent listings
listingSchema.statics.auditAndFixListings = async function() {
  const Listing = this;
  
  // Find all listings
  const listings = await Listing.find({});
  let fixedCount = 0;
  
  for (const listing of listings) {
    let needsUpdate = false;
    
    // Recalculate active codes count
    if (listing.codes && listing.codes.length > 0) {
      const activeCodes = listing.codes.filter(code => code.soldStatus === "active");
      const correctQuantity = activeCodes.length;
      
      if (listing.quantity !== correctQuantity) {
        listing.quantity = correctQuantity;
        needsUpdate = true;
      }
      
      // Check if expired
      const isExpired = listing.expirationDate && new Date(listing.expirationDate) < new Date();
      
      // Determine correct status
      let correctStatus;
      if (isExpired) {
        correctStatus = "expired";
      } else if (listing.status === "draft") {
        correctStatus = "draft"; // Preserve draft status
      } else if (correctQuantity > 0) {
        correctStatus = "active";
      } else {
        const hasSoldCodes = listing.codes.some(code => code.soldStatus === "sold");
        correctStatus = hasSoldCodes ? "sold" : "suspended";
      }
      
      if (listing.status !== correctStatus) {
        listing.status = correctStatus;
        needsUpdate = true;
      }
    } else {
      // No codes
      if (listing.quantity !== 0) {
        listing.quantity = 0;
        needsUpdate = true;
      }
      
      if (listing.status !== "draft" && listing.status !== "expired" && listing.status !== "suspended") {
        listing.status = "suspended";
        needsUpdate = true;
      }
    }
    
    // Save if changes were made
    if (needsUpdate) {
      await listing.save();
      fixedCount++;
    }
  }
  
  return {
    total: listings.length,
    fixed: fixedCount
  };
};

// Create the Listing model
const Listing = mongoose.model("Listing", listingSchema);

module.exports = {
  Listing
};
