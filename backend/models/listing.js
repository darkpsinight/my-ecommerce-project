const mongoose = require("mongoose");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
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
    codeId: {
      type: String,
      required: true,
      default: uuidv4
    },
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
  externalId: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4,
    index: true
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

// Add compound index for status and expirationDate to optimize expiration queries
listingSchema.index({ status: 1, expirationDate: 1 });

// Middleware to update the updatedAt field and handle code-related logic on save
listingSchema.pre("save", function(next) {
  // Update the updatedAt timestamp
  this.updatedAt = Date.now();

  // Skip status calculation if explicitly set to not recalculate
  if (this._skipStatusCalculation) {
    return next();
  }

  // Calculate status based on codes
  if (this.codes && this.codes.length > 0) {
    // Count codes by status
    const statusCounts = {
      active: 0,
      sold: 0,
      expired: 0,
      suspended: 0,
      draft: 0
    };

    this.codes.forEach(code => {
      if (statusCounts.hasOwnProperty(code.soldStatus)) {
        statusCounts[code.soldStatus]++;
      }
    });

    // Check if listing is expired by date
    const isExpired = this.expirationDate && new Date(this.expirationDate) < new Date();

    if (isExpired) {
      // If expired by date, set status to expired regardless of other conditions
      this.status = "expired";

      // Also mark all active codes as expired
      if (statusCounts.active > 0) {
        this.codes.forEach(code => {
          if (code.soldStatus === "active") {
            code.soldStatus = "expired";
          }
        });
      }
    } else if (this.status === "draft") {
      // Preserve draft status if explicitly set
      // Do nothing to change the status
    } else {
      // Apply the status rules based on the scenarios
      if (statusCounts.active > 0) {
        // Any active code means the listing is active, regardless of other statuses
        this.status = "active";
      } else if (statusCounts.suspended > 0) {
        // No active codes, but some suspended codes means the listing is suspended
        this.status = "suspended";
      } else if (statusCounts.expired > 0) {
        // No active or suspended codes, but some expired codes means the listing is expired
        this.status = "expired";
      } else if (statusCounts.sold === this.codes.length) {
        // All codes are sold
        this.status = "sold";
      } else if (statusCounts.draft === this.codes.length) {
        // All codes are draft
        this.status = "draft";
      } else if (statusCounts.sold > 0 && statusCounts.draft > 0) {
        // Mix of sold and draft codes
        this.status = "expired";
      } else {
        // Default fallback (shouldn't reach here with proper data)
        this.status = "expired";
      }
    }
  } else {
    // No codes at all
    // Only update status if not in draft state
    if (this.status !== "draft") {
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
      codeId: uuidv4(), // Generate a unique UUID for each code
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

/**
 * Determines the correct listing status based on the status of its codes
 * @param {Array} codes - Array of code objects with soldStatus property
 * @param {Boolean} isExpired - Whether the listing's expiration date has passed
 * @param {String} currentStatus - The current status of the listing
 * @returns {String} - The correct listing status
 */
listingSchema.statics.determineListingStatus = function(codes, isExpired, currentStatus) {
  // If expired by date, always return expired
  if (isExpired) {
    return "expired";
  }

  // If no codes, return draft if it's already draft, otherwise suspended
  if (!codes || codes.length === 0) {
    return currentStatus === "draft" ? "draft" : "suspended";
  }

  // Count codes by status
  const statusCounts = {
    active: 0,
    sold: 0,
    expired: 0,
    suspended: 0,
    draft: 0
  };

  codes.forEach(code => {
    if (statusCounts.hasOwnProperty(code.soldStatus)) {
      statusCounts[code.soldStatus]++;
    }
  });

  // Preserve draft status if explicitly set
  if (currentStatus === "draft") {
    return "draft";
  }

  // Apply the status rules based on the scenarios
  if (statusCounts.active > 0) {
    // Any active code means the listing is active, regardless of other statuses
    return "active";
  } else if (statusCounts.suspended > 0) {
    // No active codes, but some suspended codes means the listing is suspended
    return "suspended";
  } else if (statusCounts.expired > 0) {
    // No active or suspended codes, but some expired codes means the listing is expired
    return "expired";
  } else if (statusCounts.sold === codes.length) {
    // All codes are sold
    return "sold";
  } else if (statusCounts.draft === codes.length) {
    // All codes are draft
    return "draft";
  } else if (statusCounts.sold > 0 && statusCounts.draft > 0) {
    // Mix of sold and draft codes
    return "expired";
  }

  // Default fallback (shouldn't reach here with proper data)
  return "expired";
};

// Add a static method to fix inconsistent listings
listingSchema.statics.auditAndFixListings = async function() {
  const Listing = this;

  // Find all listings
  const listings = await Listing.find({}).select("+codes");
  let fixedCount = 0;

  for (const listing of listings) {
    let needsUpdate = false;

    // Check if expired by date
    const isExpired = listing.expirationDate && new Date(listing.expirationDate) < new Date();

    // If expired, mark active codes as expired
    if (isExpired && listing.codes && listing.codes.length > 0) {
      for (const code of listing.codes) {
        if (code.soldStatus === "active") {
          code.soldStatus = "expired";
          needsUpdate = true;
        }
      }
    }

    // Determine correct status using the shared logic
    const correctStatus = Listing.determineListingStatus(listing.codes, isExpired, listing.status);

    if (listing.status !== correctStatus) {
      listing.status = correctStatus;
      needsUpdate = true;
    }

    // Save if changes were made
    if (needsUpdate) {
      // Skip status recalculation in pre-save hook since we just did it
      listing._skipStatusCalculation = true;
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
