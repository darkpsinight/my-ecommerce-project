// listings.js
const { verifyAuth } = require("../plugins/authVerify");
const { listingSchema } = require("./schemas/listingSchema");
const {
  createListing,
  updateListing,
  deleteListing,
  getListingByExternalId,
  deleteListingCode
} = require("../handlers/listingHandlers");
const {
  getListings,
  getListingById,
  getSellerListings,
  getListingsSummary
} = require("../handlers/listingQueryHandlers");
const {
  auditAndFixListings,
  bulkCreateListings
} = require("../handlers/listingAdminHandlers");
const {
  uploadCodesCSV
} = require("../handlers/listingCSVHandlers");

const listingsRoutes = async (fastify, opts) => {
  // Configure rate limits for different operations
  const createRateLimit = {
    max: 15,
    timeWindow: '1 minute',
    errorResponseBuilder: function (req, context) {
      return {
        success: false,
        error: 'Too many listing creation requests',
        message: `Rate limit exceeded: maximum of 15 listings per minute. Please try again in ${context.after}`,
        retryAfter: context.after
      };
    }
  };

  const bulkCreateRateLimit = {
    max: 5,
    timeWindow: '1 minute',
    errorResponseBuilder: function (req, context) {
      return {
        success: false,
        error: 'Too many bulk listing creation requests',
        message: `Rate limit exceeded: maximum of 5 bulk uploads per minute. Please try again in ${context.after}`,
        retryAfter: context.after
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
    handler: createListing
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
    handler: updateListing
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
    handler: deleteListing
  });

  // Get all listings with filters
  fastify.route({
    config: {
      rateLimit: readRateLimit
    },
    method: "GET",
    url: "/",
    schema: listingSchema.getListings,
    handler: getListings
  });

  // Get a single listing by ID
  fastify.route({
    config: {
      rateLimit: readRateLimit
    },
    method: "GET",
    url: "/:id",
    schema: listingSchema.getListing,
    handler: getListingById
  });

  // Get seller listings with masked codes
  fastify.route({
    config: {
      rateLimit: readRateLimit
    },
    method: "GET",
    url: "/seller",
    preHandler: verifyAuth(["seller"]),
    schema: listingSchema.getListings,
    handler: getSellerListings
  });

  // Get seller listings summary statistics
  fastify.route({
    config: {
      rateLimit: readRateLimit
    },
    method: "GET",
    url: "/summary",
    preHandler: verifyAuth(["seller"]),
    handler: getListingsSummary
  });

  // Admin endpoint to audit and fix inconsistent listings
  fastify.route({
    method: "POST",
    url: "/audit-fix",
    preHandler: verifyAuth(["admin"]),
    handler: auditAndFixListings
  });

  // Bulk upload listings (for multiple codes)
  fastify.route({
    config: {
      rateLimit: bulkCreateRateLimit
    },
    method: "POST",
    url: "/bulk",
    preHandler: verifyAuth(["seller"]),
    schema: listingSchema.bulkCreateListings,
    handler: bulkCreateListings
  });

  // Upload codes from CSV file to an existing listing
  fastify.route({
    config: {
      rateLimit: updateRateLimit
    },
    method: "POST",
    url: "/:id/upload-codes-csv",
    preHandler: verifyAuth(["seller"]),
    schema: listingSchema.uploadCodesCSV,
    handler: uploadCodesCSV
  });

  // Delete a specific code from a listing
  fastify.route({
    config: {
      rateLimit: updateRateLimit
    },
    method: "DELETE",
    url: "/:id/codes/:codeId",
    preHandler: verifyAuth(["seller"]),
    handler: deleteListingCode
  });
};

module.exports = {
  listingsRoutes,
};