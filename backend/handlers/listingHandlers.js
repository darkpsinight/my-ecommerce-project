const { Listing } = require("../models/listing");
const { Category } = require("../models/category");
const { validateCodeAgainstPatterns, getPatternsForPlatform } = require("../utils/patternValidator");
const { checkAndUpdateListingStatus, processListingsExpiration } = require("../utils/listingHelpers");
const uuidv4 = require('uuid').v4;

/**
 * Masks a code to show only first 3 and last 2 characters
 * @param {string} code - The code to mask
 * @returns {string} - Masked code
 */
const maskCode = (code) => {
  if (!code || code.length <= 5) {
    return code; // Return as is if too short to mask
  }
  
  const firstThree = code.substring(0, 3);
  const lastTwo = code.substring(code.length - 2);
  const maskedMiddle = '*'.repeat(10); // Fixed 10 asterisks for all codes
  
  return `${firstThree}${maskedMiddle}${lastTwo}`;
};

/**
 * Generates a user-friendly description of the required format
 * based on the pattern and platform without exposing regex
 * @param {Object} pattern - Pattern object with regex and example
 * @param {string} platformName - Name of the platform
 * @returns {string} - User-friendly format description
 */
const getFormatDescription = (pattern, platformName) => {
  if (!pattern || !pattern.regex) {
    return `${platformName} code format not available. Please contact support.`;
  }
  
  try {
    const regex = pattern.regex;
    let description = '';
    
    // Determine character types allowed
    const allowsUppercase = regex.includes('A-Z');
    const allowsLowercase = regex.includes('a-z');
    const allowsNumbers = regex.includes('0-9');
    
    // Determine format structure
    const hasSeparators = regex.includes('-');
    let charClasses = [];
    if (allowsUppercase) charClasses.push('uppercase letters');
    if (allowsLowercase) charClasses.push('lowercase letters');
    if (allowsNumbers) charClasses.push('numbers');
    
    // Try to determine length from regex (common pattern: {n} for exact length)
    let totalLength = null;
    let groupStructure = null;
    
    // Check for fixed-length pattern with groups (like XXXXX-XXXXX-XXXXX)
    const groupMatch = regex.match(/\[([A-Za-z0-9]+-)+[A-Za-z0-9]+\]\{([0-9]+)\}/);
    const exactLengthMatch = regex.match(/\{([0-9]+)\}$/);
    
    // Count hyphens in example to determine group structure
    const exampleHyphens = (pattern.example?.match(/-/g) || []).length;
    
    if (exactLengthMatch) {
      totalLength = parseInt(exactLengthMatch[1], 10);
    } else if (pattern.example) {
      // Determine length from example if regex analysis fails
      totalLength = pattern.example.replace(/-/g, '').length;
    }
    
    if (hasSeparators && exampleHyphens > 0) {
      // Calculate group size if there are separators
      const parts = pattern.example.split('-');
      if (parts.length > 1 && parts.every(p => p.length === parts[0].length)) {
        // All groups have same length
        const groupSize = parts[0].length;
        groupStructure = `${parts.length} groups of ${groupSize} characters separated by hyphens`;
      } else {
        groupStructure = `${exampleHyphens + 1} groups separated by ${exampleHyphens} hyphens`;
      }
    }
    
    // Build the description
    if (totalLength) {
      description += `${platformName} keys must be ${totalLength} characters`;
      if (charClasses.length > 0) {
        description += ` (${charClasses.join(' and ')})`;
      }
      if (groupStructure) {
        description += ` in ${groupStructure}`;
      }
    } else if (pattern.description) {
      // Fall back to the stored description if our analysis fails
      description = pattern.description;
    } else {
      description = `${platformName} keys must match a specific format. See example.`;
    }
    
    return description;
  } catch (error) {
    console.error('Error creating format description:', error);
    return pattern.description || `${platformName} code format - see example`;
  }
};

/**
 * Checks if any of the provided codes already exist in the database
 * @param {Array<string>} codes - Array of plaintext codes to check
 * @param {string} [excludeListingId] - Optional listing externalId to exclude from the check (for updates)
 * @returns {Promise<Object>} - Object with duplicates array and success status
 */
const checkForDuplicateCodes = async (codes, excludeListingId = null) => {
  try {
    // Validate input
    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return {
        success: false,
        error: "No codes provided for duplicate check",
        duplicates: []
      };
    }
    
    // Initialize duplicates array
    const duplicates = [];
    
    // Find all listings with codes
    const query = {};
    
    // If excludeListingId is provided, exclude that listing from the check
    if (excludeListingId) {
      query.externalId = { $ne: excludeListingId };
    }
    
    // Get all listings with their codes
    const listings = await Listing.find(query).select("+codes.code +codes.iv");
    
    // Check each listing for duplicate codes
    for (const listing of listings) {
      // Skip if listing has no codes
      if (!listing.codes || listing.codes.length === 0) {
        continue;
      }
      
      // For each code in the listing
      for (const codeObj of listing.codes) {
        // Decrypt the code
        const decryptedCode = listing.decryptCode(codeObj.code, codeObj.iv);
        
        // Check if this code exists in our input codes
        const duplicateIndex = codes.findIndex(code => code === decryptedCode);
        
        if (duplicateIndex !== -1) {
          // Found a duplicate
          duplicates.push({
            code: codes[duplicateIndex],
            index: duplicateIndex,
            existingListingId: listing.externalId,
            listingTitle: listing.title,
            sellerId: listing.sellerId
          });
        }
      }
    }
    
    return {
      success: duplicates.length === 0,
      duplicates
    };
  } catch (error) {
    console.error("Error checking for duplicate codes:", error);
    return {
      success: false,
      error: error.message,
      duplicates: []
    };
  }
};

// Create a new listing
const createListing = async (request, reply) => {
  try {
    const listingData = request.body;
    
    // Add seller ID from authenticated user
    listingData.sellerId = request.user.uid;
    
    // Generate externalId (UUID) for the new listing
    listingData.externalId = uuidv4();
    
    // Check for duplicate code
    if (listingData.code) {
      const duplicateCheck = await checkForDuplicateCodes([listingData.code]);
      
      if (!duplicateCheck.success) {
        // Found a duplicate code
        return reply.code(400).send({
          success: false,
          message: "Validation failed: The code already exists in another listing",
          error: {
            duplicates: duplicateCheck.duplicates.map(dup => ({
              code: maskCode(dup.code),
              listingTitle: dup.listingTitle,
              sellerId: dup.sellerId
            }))
          }
        });
      }
    }
    
    // Validate code against patterns if categoryId is provided
    if (listingData.code && listingData.categoryId && listingData.platform) {
      // Get patterns for this category and platform
      const patternResult = await getPatternsForPlatform(
        listingData.categoryId, 
        listingData.platform, 
        Category
      );
      
      // Check if we found patterns
      if (patternResult.error) {
        request.log.warn(`Pattern validation warning: ${patternResult.error}`);
        // We'll continue without validation if patterns aren't found
      } else if (patternResult.patterns && patternResult.patterns.length > 0) {
        // Validate the code against the patterns
        const validationResult = validateCodeAgainstPatterns(listingData.code, patternResult.patterns);
        
        // If code doesn't match any pattern, reject it
        if (!validationResult.isValid) {
          return reply.code(400).send({
            success: false,
            message: "The provided code doesn't match any valid pattern for this platform",
            details: {
              invalidPatterns: validationResult.invalidPatterns,
              platform: patternResult.platform,
              category: patternResult.category
            }
          });
        }
        
        // Log which patterns matched
        request.log.info(`Code validated successfully against ${validationResult.matchedPatterns.length} patterns`);
      }
    }
    
    // Get category information before creating the listing
    let categoryName = null;
    let categoryInfo = null;
    
    // Validate that categoryId exists in the database
    if (listingData.categoryId) {
      try {
        categoryInfo = await Category.findById(listingData.categoryId);
        if (!categoryInfo) {
          return reply.code(400).send({
            success: false,
            error: "Invalid category",
            message: "The specified categoryId does not exist"
          });
        }
        categoryName = categoryInfo.name;
      } catch (err) {
        request.log.error(`Error validating category: ${err.message}`);
        return reply.code(400).send({
          success: false,
          error: "Invalid category",
          message: "The specified categoryId is invalid"
        });
      }
    }
    
    // Create a new listing instance
    const listing = new Listing(listingData);
    
    // Add the code to the listing's codes array if provided
    if (listingData.code) {
      listing.addCodes([listingData.code]);
    }
    
    // Save the listing
    await listing.save();
    
    // Return success response without the code
    return reply.code(201).send({
      success: true,
      message: "Listing created successfully",
      data: {
        externalId: listing.externalId,
        title: listing.title,
        price: listing.price,
        category: categoryName, // Category name from the referenced categoryId
        platform: listing.platform,
        status: listing.status
      }
    });
  } catch (error) {
    request.log.error(`Error creating listing: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to create listing",
      message: error.message
    });
  }
};

// Update a listing
const updateListing = async (request, reply) => {
  try {
    const { id } = request.params;
    const updateData = request.body;
    const sellerId = request.user.uid;
    
    // Check if user is admin (admins can update any listing)
    const isAdmin = request.user.role === "admin";
    
    // Query to find the listing - use externalId instead of _id
    const query = isAdmin ? { externalId: id } : { externalId: id, sellerId };
    
    // Find the listing
    const listing = await Listing.findOne(query);
    
    if (!listing) {
      return reply.code(404).send({
        success: false,
        error: "Listing not found or you don't have permission to update it"
      });
    }
    
    // If code is provided, encrypt it
    if (updateData.code) {
      listing.encryptCode(updateData.code);
      // Remove code from updateData to prevent overwriting the encrypted value
      delete updateData.code;
    }
    
    // Define valid fields that can be updated
    const validFields = [
      'title', 'description', 'price', 'originalPrice',
      'region', 'isRegionLocked', 'expirationDate', 'quantity',
      'supportedLanguages', 'thumbnailUrl', 'autoDelivery', 'tags',
      'sellerNotes', 'status'
    ];
    
    // Check for invalid fields
    const invalidFields = Object.keys(updateData).filter(key => !validFields.includes(key));
    
    // Check specifically for category, categoryId, and platform which are not allowed to be updated
    const restrictedFields = ['category', 'categoryId', 'platform'].filter(field => updateData.hasOwnProperty(field));
    
    // Remove restricted fields from updateData
    restrictedFields.forEach(field => {
      delete updateData[field];
    });
    
    // Filter out restricted fields from invalidFields
    const otherInvalidFields = invalidFields.filter(field => !restrictedFields.includes(field));
    
    if (otherInvalidFields.length > 0) {
      return reply.code(400).send({
        success: false,
        error: "Invalid fields in request",
        invalidFields: otherInvalidFields
      });
    }
    
    // Check if there are any valid fields to update
    const fieldsToUpdate = Object.keys(updateData).filter(key => validFields.includes(key));
    if (fieldsToUpdate.length === 0) {
      return reply.code(400).send({
        success: false,
        error: "No valid fields to update"
      });
    }
    
    // Update only valid fields
    fieldsToUpdate.forEach(key => {
      listing[key] = updateData[key];
    });
    
    // Save the updated listing
    await listing.save();
    
    // Prepare response
    const response = {
      success: true,
      message: "Listing updated successfully",
      data: {
        externalId: listing.externalId,
        title: listing.title,
        price: listing.price,
        category: listing.category,
        status: listing.status
      }
    };
    
    // Add warning about restricted fields if any were attempted to be updated
    if (restrictedFields.length > 0) {
      response.warnings = {
        message: "Some fields cannot be updated after listing creation",
        restrictedFields: restrictedFields
      };
    }
    
    return reply.code(200).send(response);
  } catch (error) {
    request.log.error(`Error updating listing: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to update listing",
      message: error.message
    });
  }
};

// Delete a listing
const deleteListing = async (request, reply) => {
  try {
    const { id } = request.params;
    const sellerId = request.user.uid;
    
    // Check if user is admin (admins can delete any listing)
    const isAdmin = request.user.role === "admin";
    
    // Query to find the listing - use externalId instead of _id
    const query = isAdmin ? { externalId: id } : { externalId: id, sellerId };
    
    // Find and delete the listing
    const result = await Listing.findOneAndDelete(query);
    
    if (!result) {
      return reply.code(404).send({
        success: false,
        error: "Listing not found or you don't have permission to delete it"
      });
    }
    
    return reply.code(200).send({
      success: true,
      message: "Listing deleted successfully"
    });
  } catch (error) {
    request.log.error(`Error deleting listing: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to delete listing",
      message: error.message
    });
  }
};

// Get a listing by externalId
const getListingByExternalId = async (request, reply) => {
  try {
    const { externalId } = request.params;
    
    // Find the listing by externalId
    const listing = await Listing.findOne({ externalId });
    
    if (!listing) {
      return reply.code(404).send({
        success: false,
        error: "Listing not found"
      });
    }
    
    // Get category information
    let categoryName = "Unknown";
    if (listing.categoryId) {
      try {
        const categoryInfo = await Category.findById(listing.categoryId);
        if (categoryInfo) {
          categoryName = categoryInfo.name;
        }
      } catch (err) {
        request.log.error(`Error fetching category: ${err.message}`);
      }
    }
    
    // Return the listing without sensitive information
    return reply.code(200).send({
      success: true,
      data: {
        externalId: listing.externalId,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        originalPrice: listing.originalPrice,
        category: categoryName,
        platform: listing.platform,
        region: listing.region,
        isRegionLocked: listing.isRegionLocked,
        supportedLanguages: listing.supportedLanguages,
        thumbnailUrl: listing.thumbnailUrl,
        autoDelivery: listing.autoDelivery,
        tags: listing.tags,
        status: listing.status,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt
      }
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

module.exports = {
  createListing,
  updateListing,
  deleteListing,
  getListingByExternalId,
  maskCode,
  getFormatDescription,
  checkForDuplicateCodes
};

