const { verifyAuth } = require("../plugins/authVerify");
const { Listing } = require("../models/listing");
const { Category } = require("../models/category");
const { listingSchema } = require("./schemas/listingSchema");
const { validateCodeAgainstPatterns, getPatternsForPlatform } = require("../utils/patternValidator");

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

const listingsRoutes = async (fastify, opts) => {
  // Configure rate limits for different operations
  const createRateLimit = {
    max: 20,
    timeWindow: '1 minute',
    errorResponseBuilder: function (req, context) {
      return {
        success: false,
        error: 'Too many listing creation requests',
        message: `Rate limit exceeded, retry in ${context.after}`
      };
    }
  };
  
  const updateRateLimit = {
    max: 30,
    timeWindow: '1 minute',
    errorResponseBuilder: function (req, context) {
      return {
        success: false,
        error: 'Too many listing update requests',
        message: `Rate limit exceeded, retry in ${context.after}`
      };
    }
  };
  
  const readRateLimit = {
    max: 60,
    timeWindow: '1 minute',
    errorResponseBuilder: function (req, context) {
      return {
        success: false,
        error: 'Too many listing read requests',
        message: `Rate limit exceeded, retry in ${context.after}`
      };
    }
  };
  
  const deleteRateLimit = {
    max: 10,
    timeWindow: '1 minute',
    errorResponseBuilder: function (req, context) {
      return {
        success: false,
        error: 'Too many listing deletion requests',
        message: `Rate limit exceeded, retry in ${context.after}`
      };
    }
  };
  // Create a new listing
  fastify.route({
    config: {
      rateLimit: createRateLimit
    },
    method: "POST",
    url: "/",
    preHandler: verifyAuth(["seller"]),
    schema: listingSchema.createListing,
    handler: async (request, reply) => {
      try {
        const listingData = request.body;
        
        // Add seller ID from authenticated user
        listingData.sellerId = request.user.uid;
        
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
        
        // Encrypt the code before saving
        if (listingData.code) {
          listing.encryptCode(listingData.code);
        }
        
        // Save the listing
        await listing.save();
        
        // Return success response without the code
        return reply.code(201).send({
          success: true,
          message: "Listing created successfully",
          data: {
            id: listing._id,
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
    }
  });

  // Update a listing
  fastify.route({
    config: {
      rateLimit: updateRateLimit
    },
    method: "PUT",
    url: "/:id",
    preHandler: verifyAuth(["seller"]),
    schema: listingSchema.updateListing,
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const updateData = request.body;
        const sellerId = request.user.uid;
        
        // Find the listing by ID and seller ID
        const listing = await Listing.findOne({ _id: id, sellerId }).select("+code +iv");
        
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
          'title', 'description', 'price', 'originalPrice', 'category',
          'platform', 'region', 'isRegionLocked', 'expirationDate', 'quantity',
          'supportedLanguages', 'thumbnailUrl', 'autoDelivery', 'tags',
          'sellerNotes', 'status'
        ];
        
        // Check for invalid fields
        const invalidFields = Object.keys(updateData).filter(key => !validFields.includes(key));
        if (invalidFields.length > 0) {
          return reply.code(400).send({
            success: false,
            error: "Invalid fields in request",
            invalidFields
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
        
        return reply.code(200).send({
          success: true,
          message: "Listing updated successfully",
          data: {
            id: listing._id,
            title: listing.title,
            price: listing.price,
            category: listing.category,
            status: listing.status
          }
        });
      } catch (error) {
        request.log.error(`Error updating listing: ${error.message}`);
        return reply.code(500).send({
          success: false,
          error: "Failed to update listing",
          message: error.message
        });
      }
    }
  });

  // Delete a listing
  fastify.route({
    config: {
      rateLimit: deleteRateLimit
    },
    method: "DELETE",
    url: "/:id",
    preHandler: verifyAuth(["seller", "admin"]),
    schema: listingSchema.deleteListing,
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const sellerId = request.user.uid;
        
        // Check if user is admin (admins can delete any listing)
        const isAdmin = request.user.role === "admin";
        
        // Query to find the listing
        const query = isAdmin ? { _id: id } : { _id: id, sellerId };
        
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
    }
  });

  // Get all listings with filters
  fastify.route({
    config: {
      rateLimit: readRateLimit
    },
    method: "GET",
    url: "/",
    schema: listingSchema.getListings,
    handler: async (request, reply) => {
      try {
        const { 
          category, platform, region, minPrice, maxPrice, 
          sellerId, status, page = 1, limit = 10 
        } = request.query;
        
        // Build filter object
        const filter = {};
        
        if (category) filter.category = category;
        if (platform) filter.platform = platform;
        if (region) filter.region = region;
        if (sellerId) filter.sellerId = sellerId;
        if (status) filter.status = status;
        
        // Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
          filter.price = {};
          if (minPrice !== undefined) filter.price.$gte = minPrice;
          if (maxPrice !== undefined) filter.price.$lte = maxPrice;
        }
        
        // If user is not authenticated or not an admin, only show active listings
        if (!request.user || request.user.role !== "admin") {
          filter.status = "active";
        }
        
        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Find listings with filters and pagination
        const listings = await Listing.find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 });
        
        // Count total listings matching the filter
        const total = await Listing.countDocuments(filter);
        
        return reply.code(200).send({
          success: true,
          data: {
            listings,
            pagination: {
              total,
              page,
              limit,
              pages: Math.ceil(total / limit)
            }
          }
        });
      } catch (error) {
        request.log.error(`Error fetching listings: ${error.message}`);
        return reply.code(500).send({
          success: false,
          error: "Failed to fetch listings",
          message: error.message
        });
      }
    }
  });

  // Get a single listing by ID
  fastify.route({
    config: {
      rateLimit: readRateLimit
    },
    method: "GET",
    url: "/:id",
    schema: listingSchema.getListing,
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        
        // Find the listing by ID
        const listing = await Listing.findById(id);
        
        if (!listing) {
          return reply.code(404).send({
            success: false,
            error: "Listing not found"
          });
        }
        
        // Check if user is the seller or an admin to show more details
        const isSeller = request.user && request.user.uid === listing.sellerId;
        const isAdmin = request.user && request.user.role === "admin";
        
        // If not active and not the seller or admin, don't show
        if (listing.status !== "active" && !isSeller && !isAdmin) {
          return reply.code(404).send({
            success: false,
            error: "Listing not found"
          });
        }
        
        return reply.code(200).send({
          success: true,
          data: listing
        });
      } catch (error) {
        request.log.error(`Error fetching listing: ${error.message}`);
        return reply.code(500).send({
          success: false,
          error: "Failed to fetch listing",
          message: error.message
        });
      }
    }
  });

  // Get seller's own listings
  fastify.route({
    config: {
      rateLimit: readRateLimit
    },
    method: "GET",
    url: "/my-listings",
    preHandler: verifyAuth(["seller"]),
    schema: {
      querystring: {
        type: "object",
        properties: {
          status: { type: "string" },
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 10 }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const { status, page = 1, limit = 10 } = request.query;
        const sellerId = request.user.uid;
        
        // Build filter object
        const filter = { sellerId };
        if (status) filter.status = status;
        
        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Find listings with filters and pagination
        const listings = await Listing.find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 });
        
        // Count total listings matching the filter
        const total = await Listing.countDocuments(filter);
        
        return reply.code(200).send({
          success: true,
          data: {
            listings,
            pagination: {
              total,
              page,
              limit,
              pages: Math.ceil(total / limit)
            }
          }
        });
      } catch (error) {
        request.log.error(`Error fetching seller listings: ${error.message}`);
        return reply.code(500).send({
          success: false,
          error: "Failed to fetch listings",
          message: error.message
        });
      }
    }
  });

  // Bulk upload listings (for multiple codes)
  fastify.route({
    config: {
      rateLimit: createRateLimit
    },
    method: "POST",
    url: "/bulk",
    preHandler: verifyAuth(["seller"]),
    schema: listingSchema.bulkCreateListings,
    handler: async (request, reply) => {
      try {
        const { listingTemplate, codes } = request.body;
        const sellerId = request.user.uid;
        
        // Add seller ID to template
        listingTemplate.sellerId = sellerId;
        
        // Validate codes against patterns if categoryId is provided
        if (listingTemplate.categoryId && listingTemplate.platform) {
          // Get patterns for this category and platform
          const patternResult = await getPatternsForPlatform(
            listingTemplate.categoryId, 
            listingTemplate.platform, 
            Category
          );
          
          // Check if we found patterns
          if (patternResult.error) {
            request.log.warn(`Pattern validation warning: ${patternResult.error}`);
            // Continue without validation if patterns aren't found
          } else if (patternResult.patterns && patternResult.patterns.length > 0) {
            // Validate all codes against the patterns before proceeding
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
        
        // Create a listing for each code
        for (const code of codes) {
          // Create a new listing instance with the template
          const listing = new Listing({
            ...listingTemplate,
            quantity: 1 // Each code gets its own listing with quantity 1
          });
          
          // Encrypt the code
          listing.encryptCode(code);
          
          // Save the listing
          await listing.save();
          
          // Add to created listings
          createdListings.push({
            id: listing._id,
            title: listing.title
          });
        }
        
        return reply.code(201).send({
          success: true,
          message: `Successfully created ${createdListings.length} listings`,
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
    }
  });
};

module.exports = {
  listingsRoutes,
};
