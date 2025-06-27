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

// Rate limiting configurations
const rateLimits = {
  create: {
    max: 5, // 5 reviews
    timeWindow: "1 minute"
  },
  read: {
    max: 100, // 100 requests
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
      rateLimit: rateLimits.create
    },
    method: "POST",
    url: "/create",
    preHandler: verifyAuth(["buyer"]),
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
      rateLimit: rateLimits.read
    },
    method: "GET",
    url: "/can-review/:orderId",
    preHandler: verifyAuth(["buyer"]),
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