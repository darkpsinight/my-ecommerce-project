const { verifyAuth } = require("../plugins/authVerify");
const { reviewSchema } = require("./schemas/reviewSchema");
const {
  createReview,
  getListingReviews,
  getSellerReviews,
  canUserReviewOrder,
  markReviewAsHelpful,
  removeHelpfulMark
} = require("../handlers/reviewHandlers");

// Custom middleware for additional review security checks
const reviewSecurityMiddleware = async (request, reply) => {
  try {
    // Ensure user is properly authenticated
    if (!request.user || !request.user.uid) {
      return reply.status(401).send({
        success: false,
        message: "Authentication required"
      });
    }

    // Check if user account is active (not banned/suspended)
    if (request.user.status && request.user.status !== 'active') {
      return reply.status(403).send({
        success: false,
        message: "Account access restricted"
      });
    }

    // Log security-sensitive operations
    console.log(`Review operation attempted by user ${request.user.uid} at ${new Date().toISOString()}`);
    
    return;
  } catch (error) {
    console.error("Review security middleware error:", error);
    return reply.status(500).send({
      success: false,
      message: "Security check failed"
    });
  }
};

// Rate limiting configurations - Enhanced for security
const rateLimits = {
  create: {
    max: 3, // 3 reviews per minute (reduced for security)
    timeWindow: "1 minute"
  },
  createDaily: {
    max: 10, // Maximum 10 reviews per day per user
    timeWindow: "24 hours"
  },
  read: {
    max: 100, // 100 requests
    timeWindow: "1 minute"
  },
  eligibilityCheck: {
    max: 30, // 30 eligibility checks per minute
    timeWindow: "1 minute"
  },
  action: {
    max: 20, // 20 actions (helpful marks)
    timeWindow: "1 minute"
  }
};

const reviewRoutes = async (fastify, opts) => {
  // Create a new review
  fastify.route({
    config: {
      rateLimit: [rateLimits.create, rateLimits.createDaily]
    },
    method: "POST",
    url: "/create",
    preHandler: [verifyAuth(["buyer"]), reviewSecurityMiddleware],
    schema: reviewSchema.createReview,
    handler: createReview
  });

  // Get reviews for a specific listing (public endpoint)
  fastify.route({
    config: {
      rateLimit: rateLimits.read
    },
    method: "GET",
    url: "/listing/:listingId",
    schema: reviewSchema.getListingReviews,
    handler: getListingReviews
  });

  // Get reviews for seller (seller only)
  fastify.route({
    config: {
      rateLimit: rateLimits.read
    },
    method: "GET",
    url: "/seller",
    preHandler: verifyAuth(["seller"]),
    schema: reviewSchema.getSellerReviews,
    handler: getSellerReviews
  });

  // Check if user can review an order
  fastify.route({
    config: {
      rateLimit: rateLimits.eligibilityCheck
    },
    method: "GET",
    url: "/can-review/:orderId",
    preHandler: [verifyAuth(["buyer"]), reviewSecurityMiddleware],
    schema: reviewSchema.canUserReviewOrder,
    handler: canUserReviewOrder
  });

  // Mark review as helpful
  fastify.route({
    config: {
      rateLimit: rateLimits.action
    },
    method: "POST",
    url: "/:reviewId/helpful",
    preHandler: verifyAuth(["buyer"]),
    schema: reviewSchema.markReviewAsHelpful,
    handler: markReviewAsHelpful
  });

  // Remove helpful mark from review
  fastify.route({
    config: {
      rateLimit: rateLimits.action
    },
    method: "DELETE",
    url: "/:reviewId/helpful",
    preHandler: verifyAuth(["buyer"]),
    schema: reviewSchema.removeHelpfulMark,
    handler: removeHelpfulMark
  });
};

module.exports = {
  reviewRoutes
};