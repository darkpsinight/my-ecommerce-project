const { Listing } = require("../models/listing");
const { Category } = require("../models/category");
const { validateCodeAgainstPatterns, getPatternsForPlatform } = require("../utils/patternValidator");
const { checkAndUpdateListingStatus, processListingsExpiration } = require("../utils/listingHelpers");
const { measureQueryTime } = require("../utils/queryPerformanceMonitor");
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
 * @param {boolean} [checkWithinListing=true] - Whether to check for duplicates within the same listing
 * @returns {Promise<Object>} - Object with duplicates array and success status
 */
const checkForDuplicateCodes = async (codes, excludeListingId = null, checkWithinListing = true) => {
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

    // Create a temporary listing instance to generate hash codes
    const tempListing = new Listing({
      title: "Temporary",
      description: "Temporary",
      price: 0,
      categoryId: "000000000000000000000000", // Dummy ID
      platform: "Temporary",
      region: "Global",
      sellerId: "Temporary"
    });

    // Generate hash codes for all input codes
    const codeHashes = codes.map(code => tempListing.generateCodeHash(code));

    // Check for duplicates within the input codes themselves
    if (checkWithinListing) {
      const hashesSet = new Set();
      const duplicateIndices = new Set();

      codeHashes.forEach((hash, index) => {
        if (hashesSet.has(hash)) {
          // This is a duplicate within the input codes
          duplicateIndices.add(index);
        } else {
          hashesSet.add(hash);
        }
      });

      // Add duplicates within the input to the duplicates array
      duplicateIndices.forEach(index => {
        duplicates.push({
          code: codes[index],
          index: index,
          existingListingId: 'same-batch',
          listingTitle: 'Current Batch',
          sellerId: 'current-user'
        });
      });

      // If we already found duplicates within the input, return early
      if (duplicates.length > 0) {
        return {
          success: false,
          duplicates
        };
      }
    }

    // If excludeListingId is provided, exclude that listing from the check
    // but we'll check it separately
    let excludedListing = null;
    if (excludeListingId) {
      // Get the excluded listing to check for duplicates within it
      excludedListing = await measureQueryTime(
        () => Listing.findOne({ externalId: excludeListingId }),
        'findExcludedListing',
        { excludeListingId }
      );
    }

    // OPTIMIZATION: Instead of fetching all listings and then checking each code,
    // use the hashCode index to directly query for matching codes
    // This is much more efficient with large datasets
    const duplicateResults = await measureQueryTime(
      async () => {
        const results = [];

        // Process in batches of 100 hashes to avoid query size limits
        const batchSize = 100;
        for (let i = 0; i < codeHashes.length; i += batchSize) {
          const batchHashes = codeHashes.slice(i, i + batchSize);

          // Query for listings that contain any of the hash codes in this batch
          const query = {
            'codes.hashCode': { $in: batchHashes }
          };

          // Exclude the specified listing if provided
          if (excludeListingId) {
            query.externalId = { $ne: excludeListingId };
          }

          // Find listings with matching hash codes
          // Only select the fields we need to minimize data transfer
          const matchingListings = await Listing.find(query)
            .select('externalId title sellerId codes.hashCode')
            .lean();

          results.push(...matchingListings);
        }

        return results;
      },
      'findDuplicateCodesByHash',
      { codesCount: codeHashes.length, excludeListingId }
    );

    // Process the results to find which specific codes are duplicates
    for (const listing of duplicateResults) {
      // Skip if listing has no codes
      if (!listing.codes || listing.codes.length === 0) {
        continue;
      }

      // Create a set of hash codes in this listing for faster lookup
      const listingHashCodes = new Set(
        listing.codes.map(codeObj => codeObj.hashCode)
      );

      // Check each input hash against this listing's hash codes
      codeHashes.forEach((hash, index) => {
        if (listingHashCodes.has(hash)) {
          // Found a duplicate
          duplicates.push({
            code: codes[index],
            index: index,
            existingListingId: listing.externalId,
            listingTitle: listing.title,
            sellerId: listing.sellerId
          });
        }
      });
    }

    // Now check for duplicates within the excluded listing if it exists
    if (excludedListing && excludedListing.codes && excludedListing.codes.length > 0) {
      // Create a set of existing hash codes in the excluded listing
      const existingHashCodes = new Set();

      // Collect all hash codes from the excluded listing
      for (const codeObj of excludedListing.codes) {
        if (codeObj.hashCode) {
          existingHashCodes.add(codeObj.hashCode);
        }
      }

      // Check each input code against the existing hash codes
      codeHashes.forEach((hash, index) => {
        if (existingHashCodes.has(hash)) {
          // Found a duplicate within the excluded listing
          duplicates.push({
            code: codes[index],
            index: index,
            existingListingId: excludedListing.externalId,
            listingTitle: excludedListing.title,
            sellerId: excludedListing.sellerId,
            inSameListing: true // Flag to indicate it's in the same listing
          });
        }
      });
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

    // Extract codes from the request
    let codesToAdd = [];

    // Handle all possible code formats
    if (listingData.codes && Array.isArray(listingData.codes) && listingData.codes.length > 0) {
      // New format: array of code objects
      codesToAdd = listingData.codes;
    } else if (listingData.code) {
      // Legacy format: single code with optional expiration date
      codesToAdd = [{
        code: listingData.code,
        expirationDate: listingData.codeExpirationDate
      }];

      // Check for additional codes
      if (listingData.additionalCodes && Array.isArray(listingData.additionalCodes) && listingData.additionalCodes.length > 0) {
        // Add additional codes to the codesToAdd array
        codesToAdd = [...codesToAdd, ...listingData.additionalCodes];
      }
    }

    // Check for duplicate codes
    if (codesToAdd.length > 0) {
      // Extract just the code strings for duplicate checking
      const codeStrings = codesToAdd.map(codeItem =>
        typeof codeItem === 'string' ? codeItem : codeItem.code
      );

      const duplicateCheck = await checkForDuplicateCodes(codeStrings);

      if (!duplicateCheck.success) {
        // Found duplicate codes
        return reply.code(400).send({
          success: false,
          message: "Validation failed: One or more codes already exist in another listing",
          error: {
            duplicates: duplicateCheck.duplicates.map(dup => ({
              code: maskCode(dup.code),
              listingTitle: dup.listingTitle,
              sellerId: dup.sellerId
            }))
          }
        });
      }

      // Validate codes against patterns if categoryId is provided
      if (listingData.categoryId && listingData.platform) {
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
          // Validate each code against the patterns
          const invalidCodes = [];

          for (let i = 0; i < codeStrings.length; i++) {
            const codeString = codeStrings[i];
            const validationResult = validateCodeAgainstPatterns(codeString, patternResult.patterns);

            // If code doesn't match any pattern, add to invalid list
            if (!validationResult.isValid) {
              invalidCodes.push({
                code: maskCode(codeString),
                index: i,
                errors: validationResult.invalidPatterns
              });
            }
          }

          // If any codes are invalid, reject the request
          if (invalidCodes.length > 0) {
            return reply.code(400).send({
              success: false,
              message: "One or more codes don't match any valid pattern for this platform",
              details: {
                invalidCodes,
                platform: patternResult.platform,
                category: patternResult.category
              }
            });
          }

          // Log success
          request.log.info(`All codes validated successfully against patterns`);
        }
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

    // Remove code-related fields from listingData before creating the listing instance
    // This prevents the codes from being added directly to the listing document
    const listingDataCopy = { ...listingData };
    delete listingDataCopy.code;
    delete listingDataCopy.codeExpirationDate;
    delete listingDataCopy.codes;
    delete listingDataCopy.additionalCodes;

    // Create a new listing instance without the codes
    const listing = new Listing(listingDataCopy);

    // Add codes to the listing if provided
    if (codesToAdd.length > 0) {
      // Add the codes to the listing using the addCodes method which encrypts them
      listing.addCodes(codesToAdd);
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
    let updateData = request.body;
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

    // Handle codes in the update
    let codesToAdd = [];

    // Remove code-related fields from updateData before processing
    // This prevents the codes from being added directly to the listing document
    const updateDataCopy = { ...updateData };

    // Handle all possible code formats
    if (updateData.codes && Array.isArray(updateData.codes) && updateData.codes.length > 0) {
      // New format: array of code objects
      codesToAdd = updateData.codes;

      // Check for duplicate codes
      const codeStrings = codesToAdd.map(codeItem =>
        typeof codeItem === 'string' ? codeItem : codeItem.code
      );

      const duplicateCheck = await checkForDuplicateCodes(codeStrings, id);

      if (!duplicateCheck.success) {
        // Found duplicate codes
        return reply.code(400).send({
          success: false,
          message: "Validation failed: One or more codes already exist in another listing",
          error: {
            duplicates: duplicateCheck.duplicates.map(dup => ({
              code: maskCode(dup.code),
              listingTitle: dup.listingTitle,
              sellerId: dup.sellerId
            }))
          }
        });
      }

      // Add the codes to the listing
      listing.addCodes(codesToAdd);

      // Remove codes from updateData to prevent overwriting
      delete updateDataCopy.codes;
    } else if (updateData.code) {
      // Legacy format: single code with optional expiration date
      let codesToCheck = [updateData.code];
      let singleCodeToAdd = [{
        code: updateData.code,
        expirationDate: updateData.codeExpirationDate
      }];

      // Check for additional codes
      if (updateData.additionalCodes && Array.isArray(updateData.additionalCodes) && updateData.additionalCodes.length > 0) {
        // Add additional codes to the arrays
        codesToCheck = [...codesToCheck, ...updateData.additionalCodes.map(c => c.code)];
        singleCodeToAdd = [...singleCodeToAdd, ...updateData.additionalCodes];
      }

      const duplicateCheck = await checkForDuplicateCodes(codesToCheck, id);

      if (!duplicateCheck.success) {
        // Found a duplicate code
        return reply.code(400).send({
          success: false,
          message: "Validation failed: One or more codes already exist in another listing",
          error: {
            duplicates: duplicateCheck.duplicates.map(dup => ({
              code: maskCode(dup.code),
              listingTitle: dup.listingTitle,
              sellerId: dup.sellerId
            }))
          }
        });
      }

      // Add the codes to the listing
      listing.addCodes(singleCodeToAdd);

      // Remove code-related fields from updateData
      delete updateDataCopy.code;
      delete updateDataCopy.codeExpirationDate;
      delete updateDataCopy.additionalCodes;
    }

    // Use the cleaned updateDataCopy for the rest of the function
    updateData = updateDataCopy;

    // Define valid fields that can be updated
    const validFields = [
      'title', 'description', 'price', 'originalPrice',
      'region', 'isRegionLocked', 'quantity',
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
        categoryId: listing.categoryId,
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

// Delete a specific code from a listing
const deleteListingCode = async (request, reply) => {
  try {
    const { id, codeId } = request.params;
    const sellerId = request.user.uid;

    // Check if user is admin (admins can update any listing)
    const isAdmin = request.user.role === "admin";

    // Query to find the listing - use externalId instead of _id
    const query = isAdmin ? { externalId: id } : { externalId: id, sellerId };

    // Find the listing - explicitly select the code and iv fields which are hidden by default
    const listing = await Listing.findOne(query).select('+codes.code +codes.iv');

    if (!listing) {
      return reply.code(404).send({
        success: false,
        error: "Listing not found or you don't have permission to update it"
      });
    }

    // Log the listing codes before deletion for debugging
    console.log('Listing codes before deletion:', listing.codes.map(c => ({
      codeId: c.codeId,
      hasCode: !!c.code,
      hasIv: !!c.iv,
      soldStatus: c.soldStatus
    })));

    // Check if the listing has codes
    if (!listing.codes || listing.codes.length === 0) {
      return reply.code(404).send({
        success: false,
        error: "No codes found in this listing"
      });
    }

    // Find the code in the listing
    const codeIndex = listing.codes.findIndex(code => code.codeId === codeId);

    if (codeIndex === -1) {
      return reply.code(404).send({
        success: false,
        error: "Code not found in this listing"
      });
    }

    // Check if the code is already sold
    if (listing.codes[codeIndex].soldStatus === 'sold') {
      return reply.code(400).send({
        success: false,
        error: "Cannot delete a sold code"
      });
    }

    // Remove the code from the listing
    listing.codes.splice(codeIndex, 1);

    // Check if this was the last code and update status accordingly
    if (listing.codes.length === 0 && listing.status !== 'draft') {
      listing.status = 'suspended';
    }

    // Save the updated listing - allow the pre-save middleware to recalculate status
    await listing.save();

    // Log the updated listing for debugging
    console.log('Updated listing after code deletion:', {
      externalId: listing.externalId,
      codesCount: listing.codes.length,
      codes: listing.codes.map(c => ({
        codeId: c.codeId,
        hasCode: !!c.code,
        hasIv: !!c.iv,
        soldStatus: c.soldStatus
      }))
    });

    return reply.code(200).send({
      success: true,
      message: "Code deleted successfully",
      data: {
        externalId: listing.externalId,
        title: listing.title,
        codesCount: listing.codes.length,
        status: listing.status
      }
    });
  } catch (error) {
    request.log.error(`Error deleting code: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to delete code",
      message: error.message
    });
  }
};

/**
 * Check if a code exists in any listing
 * @param {string} code - The code to check
 * @param {string} [excludeListingId] - Optional listing externalId to exclude from the check
 * @returns {Promise<Object>} - Object with exists flag and listing details if found
 */
const checkCodeExists = async (request, reply) => {
  try {
    const { code } = request.body;
    const { excludeListingId } = request.query;
    const currentUserId = request.user.uid; // Get the current user's ID

    if (!code) {
      return reply.code(400).send({
        success: false,
        error: "No code provided for check"
      });
    }

    // Use the existing checkForDuplicateCodes function with performance monitoring
    const result = await measureQueryTime(
      () => checkForDuplicateCodes([code], excludeListingId, true),
      'checkCodeExists',
      { excludeListingId }
    );

    if (!result.success && result.duplicates && result.duplicates.length > 0) {
      // Code exists in another listing or is a duplicate within the same batch
      const duplicate = result.duplicates[0];

      // Check if it's a duplicate within the same batch
      if (duplicate.existingListingId === 'same-batch') {
        return reply.code(200).send({
          success: true,
          exists: true,
          listing: {
            title: 'Current Batch',
            id: 'same-batch',
            code: maskCode(duplicate.code),
            isSameBatch: true
          }
        });
      }

      // Check if it's a duplicate within the same listing
      if (duplicate.inSameListing) {
        return reply.code(200).send({
          success: true,
          exists: true,
          listing: {
            title: duplicate.listingTitle,
            id: duplicate.existingListingId,
            code: maskCode(duplicate.code),
            inSameListing: true
          }
        });
      }

      // Code exists in another listing
      // Check if the current user is the owner of the listing where the code exists
      const isOwner = currentUserId === duplicate.sellerId;

      // Create response object
      const responseObj = {
        success: true,
        exists: true,
        listing: {
          id: duplicate.existingListingId,
          code: maskCode(duplicate.code)
        }
      };

      // Only include the title if the user owns the listing
      if (isOwner) {
        responseObj.listing.title = duplicate.listingTitle;
      }

      return reply.code(200).send(responseObj);
    }

    // Code doesn't exist in any other listing
    return reply.code(200).send({
      success: true,
      exists: false
    });
  } catch (error) {
    request.log.error(`Error checking if code exists: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to check if code exists",
      message: error.message
    });
  }
};

module.exports = {
  createListing,
  updateListing,
  deleteListing,
  getListingByExternalId,
  deleteListingCode,
  maskCode,
  getFormatDescription,
  checkForDuplicateCodes,
  checkCodeExists
};

