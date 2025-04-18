const { verifyAuth } = require("../plugins/authVerify");
const { Listing } = require("../models/listing");
const { listingSchema } = require("./schemas/listingSchema");

const listingsRoutes = async (fastify, opts) => {
  // Create a new listing
  fastify.route({
    method: "POST",
    url: "/",
    preHandler: verifyAuth(["seller"]),
    schema: listingSchema.createListing,
    handler: async (request, reply) => {
      try {
        const listingData = request.body;
        
        // Add seller ID from authenticated user
        listingData.sellerId = request.user.uid;
        
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
            category: listing.category,
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
