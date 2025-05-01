const { Listing } = require("../models/listing");
const { Category } = require("../models/category");
const { validateCodeAgainstPatterns, getPatternsForPlatform } = require("../utils/patternValidator");
const { maskCode, getFormatDescription, checkForDuplicateCodes } = require("./listingHandlers");

// Admin endpoint to audit and fix inconsistent listings
const auditAndFixListings = async (request, reply) => {
  try {
    // Run the audit and fix function
    const result = await Listing.auditAndFixListings();
    
    return reply.code(200).send({
      success: true,
      message: `Audited ${result.total} listings and fixed ${result.fixed} inconsistencies`,
      data: result
    });
  } catch (error) {
    request.log.error(`Error auditing listings: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to audit listings",
      message: error.message
    });
  }
};

// Bulk upload listings (for multiple codes)
const bulkCreateListings = async (request, reply) => {
  try {
    const { listingTemplate, codes } = request.body;
    const sellerId = request.user.uid;
    // REMOVE sellerId from incoming template if present
    if (listingTemplate.sellerId) delete listingTemplate.sellerId;
    // Check for duplicate codes
    const duplicateCheck = await checkForDuplicateCodes(codes);
    
    if (!duplicateCheck.success) {
      // Found duplicate codes
      return reply.code(400).send({
        success: false,
        message: `Validation failed: ${duplicateCheck.duplicates.length} code(s) already exist in other listings`,
        error: {
          duplicates: duplicateCheck.duplicates.map(dup => ({
            code: maskCode(dup.code),
            index: dup.index,
            listingTitle: dup.listingTitle,
            sellerId: dup.sellerId
          }))
        }
      });
    }
    
    // Add seller ID to template (server-side only)
    const template = {
      ...listingTemplate,
      sellerId: sellerId
    };
    
    // Get the category to validate codes against patterns
    const category = await Category.findById(template.categoryId);
    
    if (!category) {
      return reply.code(400).send({
        success: false,
        message: "Invalid category ID"
      });
    }
    
    // Validate codes against patterns if category has patterns
    if (category.patterns && category.patterns.length > 0) {
      const patternResult = getPatternsForPlatform(category, template.platform);
      
      if (patternResult.error) {
        request.log.warn(`Pattern validation warning: ${patternResult.error}`);
      } else if (patternResult.patterns && patternResult.patterns.length > 0) {
        const invalidCodes = [];
        
        for (let i = 0; i < codes.length; i++) {
          const code = codes[i];
          const validationResult = validateCodeAgainstPatterns(code, patternResult.patterns);
          
          // If code doesn't match any pattern, add to invalid list with detailed errors
          if (!validationResult.isValid) {
            invalidCodes.push({
              code,
              index: i,
              errors: validationResult.validationErrors || []
            });
          }
        }
        
        // If any codes are invalid, return user-friendly error with details
        if (invalidCodes.length > 0) {
          // Get the first active pattern for formatting guidance
          const activePattern = patternResult.patterns.find(p => p.isActive) || {};
          
          // Extract key format characteristics for user guidance
          // This builds a user-friendly description without exposing regex
          const formatDescription = getFormatDescription(activePattern, patternResult.platform);
          
          // Prepare the error response with user-friendly formatting
          const errorResponse = {
            success: false,
            message: `Validation failed: ${invalidCodes.length} code(s) do not match ${patternResult.platform} requirements.`,
            error: {
              platform: patternResult.platform,
              category: patternResult.category,
              invalidCodes,
              validFormat: {
                description: formatDescription,
                example: activePattern.example || ""
              }
            }
          };

          // Log validation failure for debugging
          request.log.info(`Bulk listing validation failed for ${invalidCodes.length} codes`);              
          return reply.code(400).send(errorResponse);
        }
        
        // Log successful validation
        request.log.info(`All ${codes.length} codes validated successfully against platform patterns`);
      }
    }
    
    // Array to store created listings
    const createdListings = [];
    
    // Create a single listing with all codes instead of separate listings
    const listing = new Listing({
      ...template
    });
    
    // Add all codes to the listing
    // Check for duplicates before adding
    const uniqueCodes = [...new Set(codes)]; // Remove duplicates
    
    if (uniqueCodes.length !== codes.length) {
      request.log.info(`Removed ${codes.length - uniqueCodes.length} duplicate codes`);
    }
    
    // Add the unique codes to the listing
    listing.addCodes(uniqueCodes);
    
    // Save the listing
    await listing.save();
    
    // Add to created listings
    createdListings.push({
      id: listing._id,
      title: listing.title,
      codesCount: uniqueCodes.length
    });
    
    return reply.code(201).send({
      success: true,
      message: `Successfully created listing with ${uniqueCodes.length} codes`,
      data: {
        count: createdListings.length,
        listings: createdListings
      }
    });
  } catch (error) {
    request.log.error(`Error creating bulk listings: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to create bulk listings",
      message: error.message
    });
  }
};

module.exports = {
  auditAndFixListings,
  bulkCreateListings
};
