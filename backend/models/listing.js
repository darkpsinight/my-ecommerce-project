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
    hashCode: {
      type: String,
      required: true,
      index: true // Add index for faster lookups
    },
    soldStatus: {
      type: String,
      enum: ["active", "sold", "expired", "suspended", "draft", "deleted"],
      default: "active"
    },
    soldAt: {
      type: Date
    },
    expirationDate: {
      type: Date
    },
    expirationGroup: {
      type: String,
      enum: ["never_expires", "expires"],
      default: function () {
        return this.expirationDate ? "expires" : "never_expires";
      }
    }
  }],
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
    enum: ["active", "sold", "expired", "suspended", "draft", "deleted"],
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

// Add compound indexes for efficient filtering and querying
listingSchema.index({ status: 1 });
listingSchema.index({ status: 1, categoryId: 1 });
listingSchema.index({ status: 1, platform: 1 });
listingSchema.index({ status: 1, region: 1 });
listingSchema.index({ status: 1, price: 1 });
listingSchema.index({ status: 1, categoryId: 1, price: 1 });
listingSchema.index({ status: 1, platform: 1, price: 1 });
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ price: 1 });
listingSchema.index({ price: -1 });

// Text index for search functionality
listingSchema.index({
  title: 'text',
  description: 'text',
  platform: 'text',
  region: 'text',
  tags: 'text'
}, {
  name: 'search_text_index',
  weights: {
    title: 10,
    platform: 5,
    description: 3,
    region: 2,
    tags: 1
  }
});

// Virtual field for quantity of active codes
listingSchema.virtual('quantityOfActiveCodes').get(function () {
  if (!this.codes || this.codes.length === 0) {
    return 0;
  }
  return this.codes.filter(code => code.soldStatus === "active").length;
});

// Virtual field for quantity of all codes
listingSchema.virtual('quantityOfAllCodes').get(function () {
  if (!this.codes || this.codes.length === 0) {
    return 0;
  }
  return this.codes.length;
});

// Ensure virtual fields are serialized when converting to JSON
listingSchema.set('toJSON', { virtuals: true });
listingSchema.set('toObject', { virtuals: true });

// Track status changes
listingSchema.pre("save", function (next) {
  // Store the previous status if the status field is being modified
  if (this.isModified('status')) {
    this._previousStatus = this.get('status', String);
  }
  next();
});

// Middleware to update the updatedAt field and handle code-related logic on save
listingSchema.pre("save", function (next) {
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
      draft: 0,
      deleted: 0
    };

    this.codes.forEach(code => {
      if (statusCounts.hasOwnProperty(code.soldStatus)) {
        statusCounts[code.soldStatus]++;
      }
    });

    // Check if any codes are expired by date
    const now = new Date();

    // Check each code for expiration
    if (statusCounts.active > 0) {
      this.codes.forEach(code => {
        if (code.soldStatus === "active" && code.expirationDate && new Date(code.expirationDate) < now) {
          code.soldStatus = "expired";
          statusCounts.active--;
          statusCounts.expired++;
        }
      });
    }

    // Check if this is an explicit status change from draft to active
    const isExplicitActivation = this.isModified('status') &&
      this._previousStatus === 'draft' &&
      this.status === 'active';

    if (this.status === "draft" || this.status === "deleted" || isExplicitActivation) {
      // Preserve draft status if explicitly set
      // Or preserve active status if explicitly changed from draft to active
      // Or preserve deleted status - once deleted, always deleted
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
    // Only update status if not in draft or deleted state
    if (this.status !== "draft" && this.status !== "deleted") {
      this.status = "suspended";
    }
  }

  next();
});

// Method to generate a hash for a code
listingSchema.methods.generateCodeHash = function (code) {
  // Create a hash of the code using SHA-256
  // This hash will be used for duplicate checking without decrypting
  return crypto
    .createHash('sha256')
    .update(code.toLowerCase()) // Convert to lowercase for case-insensitive comparison
    .digest('hex');
};

// Method to encrypt a single code
listingSchema.methods.encryptCode = function (code) {
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
listingSchema.methods.decryptCode = function (encryptedCode, iv) {
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
listingSchema.methods.addCodes = function (plainTextCodes, defaultExpirationDate = null) {
  if (!Array.isArray(plainTextCodes)) {
    plainTextCodes = [plainTextCodes];
  }

  // Keep track of added codes to prevent duplicates
  const addedCodes = new Set();

  // Get existing hashCodes from the listing
  const existingHashCodes = new Set();
  if (this.codes && this.codes.length > 0) {
    this.codes.forEach(codeObj => {
      if (codeObj.hashCode) {
        existingHashCodes.add(codeObj.hashCode);
      }
    });
  }

  // Encrypt each code and add to the codes array
  plainTextCodes.forEach(plainCodeItem => {
    // Check if the item is a string or an object with code and expirationDate
    let plainCode, expirationDate;

    if (typeof plainCodeItem === 'string') {
      plainCode = plainCodeItem;
      expirationDate = defaultExpirationDate;
    } else if (plainCodeItem && typeof plainCodeItem === 'object') {
      plainCode = plainCodeItem.code;

      // Use the code-specific expiration date if provided, otherwise use the default
      // Fix: Properly handle the expirationDate field
      if (plainCodeItem.expirationDate !== undefined && plainCodeItem.expirationDate !== null) {
        expirationDate = plainCodeItem.expirationDate;
      } else {
        expirationDate = defaultExpirationDate;
      }
    } else {
      // Skip invalid items
      console.warn('Invalid code item:', plainCodeItem);
      return;
    }

    // Skip empty codes
    if (!plainCode) {
      return;
    }

    // Generate hash first to check for duplicates
    const hashCode = this.generateCodeHash(plainCode);

    // Skip if this code has already been added in this batch
    if (addedCodes.has(hashCode)) {
      console.warn('Duplicate code detected in the same batch:', plainCode);
      return;
    }

    // Skip if this code already exists in the listing
    if (existingHashCodes.has(hashCode)) {
      console.warn('Code already exists in this listing:', plainCode);
      return;
    }

    // Add to tracking sets
    addedCodes.add(hashCode);
    existingHashCodes.add(hashCode);

    // Now encrypt the code
    const { code, iv } = this.encryptCode(plainCode);

    // Create the code object with all required fields
    const codeObj = {
      codeId: uuidv4(), // Generate a unique UUID for each code
      code,
      iv,
      hashCode,
      soldStatus: "active"
    };

    // Only add expirationDate if it's defined
    if (expirationDate !== undefined && expirationDate !== null) {
      codeObj.expirationDate = expirationDate;
      codeObj.expirationGroup = "expires";
    } else {
      codeObj.expirationGroup = "never_expires";
    }

    // Add the code to the listing
    this.codes.push(codeObj);
  });

  return this.codes.length;
};

// Method to get count of available codes
listingSchema.methods.getAvailableCodesCount = function () {
  if (!this.codes || this.codes.length === 0) {
    return 0;
  }
  return this.codes.filter(code => code.soldStatus === "active").length;
};

// Method to check if listing has available codes for purchase
listingSchema.methods.hasAvailableCodes = function (requestedQuantity = 1) {
  const availableCount = this.getAvailableCodesCount();
  return availableCount >= requestedQuantity;
};

// Method to get active codes sorted by expiration date priority
listingSchema.methods.getActiveCodesSortedByExpiration = function () {
  if (!this.codes || this.codes.length === 0) {
    return [];
  }

  // Filter active codes
  const activeCodes = this.codes.filter(code => code.soldStatus === "active");

  // Sort by expiration date priority
  // 1. Codes with expiration dates first (closest to expiration first)
  // 2. Codes without expiration dates last (by creation order)
  return activeCodes.sort((a, b) => {
    const aHasExpiration = a.expirationDate && a.expirationDate !== null;
    const bHasExpiration = b.expirationDate && b.expirationDate !== null;

    // If both have expiration dates, sort by closest expiration first
    if (aHasExpiration && bHasExpiration) {
      return new Date(a.expirationDate) - new Date(b.expirationDate);
    }

    // If only 'a' has expiration date, it gets priority
    if (aHasExpiration && !bHasExpiration) {
      return -1;
    }

    // If only 'b' has expiration date, it gets priority
    if (!aHasExpiration && bHasExpiration) {
      return 1;
    }

    // If neither has expiration date, maintain original order (stable sort)
    // We can't rely on array index here, so we'll use codeId as tie-breaker
    return a.codeId.localeCompare(b.codeId);
  });
};

// Method to get codes for purchase with expiration date priority
listingSchema.methods.getCodesForPurchase = function (quantity = 1) {
  // Get active codes sorted by expiration date priority
  const activeCodes = this.getActiveCodesSortedByExpiration();

  if (activeCodes.length < quantity) {
    throw new Error(`Not enough active codes available. Available: ${activeCodes.length}, Requested: ${quantity}`);
  }

  // Return the top N codes with highest priority
  return activeCodes.slice(0, quantity);
};

// Method to purchase a code - marks one active code as sold and returns the decrypted code
listingSchema.methods.purchaseCode = function () {
  // Get active codes sorted by expiration date priority
  const activeCodes = this.getActiveCodesSortedByExpiration();

  if (activeCodes.length === 0) {
    throw new Error("No active codes available for purchase");
  }

  // Get the first code (highest priority)
  const codeObj = activeCodes[0];

  // Find the index in the original codes array
  const activeCodeIndex = this.codes.findIndex(code => code.codeId === codeObj.codeId);

  if (activeCodeIndex === -1) {
    throw new Error("Code not found in listing");
  }

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

// Method to purchase multiple codes - marks active codes as sold and returns the encrypted code objects
listingSchema.methods.purchaseCodes = async function (quantity) {
  // Get active codes sorted by expiration date priority
  const activeCodes = this.getActiveCodesSortedByExpiration();

  if (activeCodes.length < quantity) {
    throw new Error(`Not enough active codes available. Available: ${activeCodes.length}, Requested: ${quantity}`);
  }

  // Get the top N codes (highest priority)
  const codesToPurchase = activeCodes.slice(0, quantity);
  const purchasedCodes = [];

  codesToPurchase.forEach(codeObj => {
    // Find the index in the original codes array
    const activeCodeIndex = this.codes.findIndex(code => code.codeId === codeObj.codeId);

    if (activeCodeIndex !== -1) {
      // Mark the code as sold
      this.codes[activeCodeIndex].soldStatus = "sold";
      this.codes[activeCodeIndex].soldAt = new Date(); // Use same timestamp?

      // Add to result list (Preserve encryption)
      purchasedCodes.push({
        codeId: codeObj.codeId,
        code: codeObj.code, // Encrypted
        iv: codeObj.iv,
        expirationDate: codeObj.expirationDate
      });
    }
  });

  // Save the listing to trigger the pre-save middleware
  await this.save();

  return purchasedCodes;
};

// Method to get expiration groups for a listing
listingSchema.methods.getExpirationGroups = function () {
  if (!this.codes || this.codes.length === 0) {
    return [];
  }

  // Filter active codes and group by expiration type
  const activeCodes = this.codes.filter(code => code.soldStatus === "active");

  if (activeCodes.length === 0) {
    return [];
  }

  // Group codes by expiration type and date
  const groups = {};

  activeCodes.forEach(code => {
    const groupType = code.expirationGroup || (code.expirationDate ? "expires" : "never_expires");

    // Create a unique key for each group (including date for expires)
    let groupKey;
    if (groupType === "expires" && code.expirationDate) {
      groupKey = `${groupType}_${code.expirationDate.toISOString()}`;
    } else {
      groupKey = groupType;
    }

    if (!groups[groupKey]) {
      groups[groupKey] = {
        type: groupType,
        quantity: 0,
        codes: []
      };

      // Add date for expires group
      if (groupType === "expires" && code.expirationDate) {
        groups[groupKey].date = code.expirationDate;
      }
    }

    groups[groupKey].quantity++;
    groups[groupKey].codes.push(code);
  });

  // Convert to array and format for API response
  const result = Object.values(groups).map(group => {
    const formatted = {
      type: group.type,
      quantity: group.quantity
    };

    if (group.type === "expires" && group.date) {
      formatted.date = group.date;
    }

    return formatted;
  });

  // Sort: never_expires first, then expires groups by date
  result.sort((a, b) => {
    if (a.type === "never_expires" && b.type === "expires") return -1;
    if (a.type === "expires" && b.type === "never_expires") return 1;
    if (a.type === "expires" && b.type === "expires") {
      return new Date(a.date || 0) - new Date(b.date || 0);
    }
    return 0;
  });

  return result;
};

// Method to get codes for purchase from specific expiration groups
listingSchema.methods.getCodesFromExpirationGroups = function (groupQuantities) {
  if (!this.codes || this.codes.length === 0) {
    throw new Error("No codes available");
  }

  // Filter active codes
  const activeCodes = this.codes.filter(code => code.soldStatus === "active");

  if (activeCodes.length === 0) {
    throw new Error("No active codes available");
  }

  // Group codes by expiration type and date
  const codeGroups = {};

  activeCodes.forEach(code => {
    const groupType = code.expirationGroup || (code.expirationDate ? "expires" : "never_expires");

    // Create a unique key for each group (including date for expires)
    let groupKey;
    if (groupType === "expires" && code.expirationDate) {
      groupKey = `${groupType}_${code.expirationDate.toISOString()}`;
    } else {
      groupKey = groupType;
    }

    if (!codeGroups[groupKey]) {
      codeGroups[groupKey] = [];
    }

    codeGroups[groupKey].push(code);
  });

  // Sort codes within each group (FEFO for expires, FIFO for never_expires)
  Object.keys(codeGroups).forEach(groupKey => {
    if (groupKey.startsWith("expires")) {
      // Sort by expiration date (earliest first)
      codeGroups[groupKey].sort((a, b) => {
        const aDate = a.expirationDate ? new Date(a.expirationDate) : new Date(0);
        const bDate = b.expirationDate ? new Date(b.expirationDate) : new Date(0);
        return aDate - bDate;
      });
    } else {
      // Sort by codeId for consistent ordering (FIFO)
      codeGroups[groupKey].sort((a, b) => a.codeId.localeCompare(b.codeId));
    }
  });

  // Select codes based on requested group quantities
  const selectedCodes = [];

  groupQuantities.forEach(groupRequest => {
    const { type, count, date } = groupRequest;

    // Create the groupKey to match the internal grouping
    let groupKey;
    if (type === "expires" && date) {
      // Convert date to ISO string if it's not already
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      groupKey = `${type}_${dateObj.toISOString()}`;
    } else {
      groupKey = type;
    }

    const availableCodes = codeGroups[groupKey] || [];

    if (availableCodes.length < count) {
      throw new Error(`Not enough codes available in ${type} group${date ? ` (${date})` : ''}. Available: ${availableCodes.length}, Requested: ${count}`);
    }

    // Take the required number of codes from this group
    const selectedFromGroup = availableCodes.slice(0, count);
    selectedCodes.push(...selectedFromGroup);
  });

  return selectedCodes;
};

/**
 * Determines the correct listing status based on the status of its codes
 * @param {Array} codes - Array of code objects with soldStatus property
 * @param {String} currentStatus - The current status of the listing
 * @returns {String} - The correct listing status
 */
listingSchema.statics.determineListingStatus = function (codes, currentStatus) {
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
    draft: 0,
    deleted: 0
  };

  codes.forEach(code => {
    if (statusCounts.hasOwnProperty(code.soldStatus)) {
      statusCounts[code.soldStatus]++;
    }
  });

  // Check if this is an explicit status change from draft to active
  const isExplicitActivation = currentStatus === "active" &&
    this._isExplicitStatusChange === true;

  // Preserve deleted status - once deleted, always deleted
  if (currentStatus === "deleted") {
    return "deleted";
  }

  // Preserve draft status if explicitly set, or active status if explicitly changed
  if (currentStatus === "draft" || isExplicitActivation) {
    return currentStatus;
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
listingSchema.statics.auditAndFixListings = async function () {
  const Listing = this;

  // Find all listings
  const listings = await Listing.find({}).select("+codes");
  let fixedCount = 0;

  for (const listing of listings) {
    let needsUpdate = false;

    // Check if any codes are expired by date
    const now = new Date();

    // Check each code for expiration
    if (listing.codes && listing.codes.length > 0) {
      for (const code of listing.codes) {
        if (code.soldStatus === "active" && code.expirationDate && new Date(code.expirationDate) < now) {
          code.soldStatus = "expired";
          needsUpdate = true;
        }
      }
    }

    // Determine correct status using the shared logic
    const correctStatus = Listing.determineListingStatus(listing.codes, listing.status);

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
