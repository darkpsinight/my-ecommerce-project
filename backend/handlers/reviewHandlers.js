const { Review } = require("../models/review");
const { Order } = require("../models/order");
const { Listing } = require("../models/listing");
const { User } = require("../models/user");
const mongoose = require("mongoose");

// Create a new review
const createReview = async (request, reply) => {
  try {
    const { orderId, rating, comment } = request.body;
    
    // Get user by uid from JWT token
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return reply.status(404).send({
        success: false,
        message: "User not found"
      });
    }
    
    const reviewerId = user._id;

    // Enhanced input validation
    if (!orderId) {
      return reply.status(400).send({
        success: false,
        message: "Order ID is required"
      });
    }

    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return reply.status(400).send({
        success: false,
        message: "Rating must be an integer between 1 and 5"
      });
    }

    if (comment && (typeof comment !== 'string' || comment.length > 1000)) {
      return reply.status(400).send({
        success: false,
        message: "Comment must be a string with maximum 1000 characters"
      });
    }

    // Convert orderId to ObjectId if it's a string
    let orderObjectId;
    try {
      orderObjectId = new mongoose.Types.ObjectId(orderId);
    } catch (error) {
      // If orderId is not a valid ObjectId, try to find by externalId
      const order = await Order.findOne({ externalId: orderId });
      if (!order) {
        return reply.status(404).send({
          success: false,
          message: "Order not found"
        });
      }
      orderObjectId = order._id;
    }

    // Verify order exists, belongs to the user, and is completed
    const order = await Order.findOne({
      _id: orderObjectId,
      buyerId: reviewerId,
      status: "completed"
    }).populate("orderItems.listingId");

    if (!order) {
      return reply.status(403).send({
        success: false,
        message: "Order not found, not completed, or you don't have permission to review this order"
      });
    }

    // Additional security check: Ensure order was completed recently enough to review
    // For example, within the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    if (order.createdAt < sixMonthsAgo) {
      return reply.status(400).send({
        success: false,
        message: "This order is too old to review. Reviews can only be submitted within 6 months of purchase."
      });
    }

    // Check if user already reviewed this order (double-check for race conditions)
    const existingReview = await Review.findOne({
      reviewerId,
      orderId: orderObjectId
    });

    if (existingReview) {
      return reply.status(409).send({
        success: false,
        message: "You have already reviewed this order"
      });
    }

    // Get the first listing from the order (assuming one listing per order for reviews)
    const firstOrderItem = order.orderItems[0];
    if (!firstOrderItem || !firstOrderItem.listingId) {
      return reply.status(400).send({
        success: false,
        message: "Order has no valid items to review"
      });
    }

    // Verify the listing still exists and is not deleted
    if (!firstOrderItem.listingId || firstOrderItem.listingId.deleted) {
      return reply.status(400).send({
        success: false,
        message: "The item in this order is no longer available for review"
      });
    }

    // Create the review with additional security measures
    const review = await Review.createReview({
      reviewerId,
      orderId: orderObjectId,
      listingId: firstOrderItem.listingId._id,
      sellerId: order.sellerId,
      rating,
      comment: comment ? comment.trim() : undefined,
      // Add IP address for abuse prevention (if available)
      reviewerIp: request.ip || request.connection.remoteAddress
    });

    // Log the review creation for security monitoring
    console.log(`Review created: ${review._id} by user ${reviewerId} for order ${order.externalId}`);

    // Return success response with minimal data
    return reply.send({
      success: true,
      message: "Review created successfully",
      data: {
        reviewId: review._id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      }
    });

  } catch (error) {
    console.error("Error creating review:", error);
    
    // Handle specific errors
    if (error.message === "You have already reviewed this order") {
      return reply.status(409).send({
        success: false,
        message: error.message
      });
    }

    if (error.code === 11000) { // MongoDB duplicate key error
      return reply.status(409).send({
        success: false,
        message: "You have already reviewed this order"
      });
    }

    return reply.status(500).send({
      success: false,
      message: "Error creating review. Please try again later."
    });
  }
};

// Get reviews for a specific listing
const getListingReviews = async (request, reply) => {
  try {
    const { listingId } = request.params;
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      minRating,
      maxRating
    } = request.query;

    // Verify listing exists using external ID
    const listing = await Listing.findOne({ externalId: listingId });
    if (!listing) {
      return reply.status(404).send({
        success: false,
        message: "Listing not found"
      });
    }

    // Debug logging
    console.log('getListingReviews debug:', {
      externalId: listingId,
      listingMongoId: listing._id,
      listingTitle: listing.title
    });

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      minRating: minRating ? parseInt(minRating) : undefined,
      maxRating: maxRating ? parseInt(maxRating) : undefined
    };

    const result = await Review.getListingReviews(listing._id, options);
    
    // Debug logging
    console.log('Review query result:', {
      reviewsCount: result.reviews.length,
      totalReviews: result.statistics.totalReviews
    });

    return reply.send({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Error getting listing reviews:", error);
    return reply.status(500).send({
      success: false,
      message: "Error retrieving reviews"
    });
  }
};

// Get reviews by seller
const getSellerReviews = async (request, reply) => {
  try {
    // Get user by uid from JWT token
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return reply.status(404).send({
        success: false,
        message: "User not found"
      });
    }
    
    const sellerId = user._id;
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = request.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };

    const result = await Review.getSellerReviews(sellerId, options);

    return reply.send({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Error getting seller reviews:", error);
    return reply.status(500).send({
      success: false,
      message: "Error retrieving reviews"
    });
  }
};

// Check if user can review an order
const canUserReviewOrder = async (request, reply) => {
  try {
    const { orderId } = request.params;
    
    // Get user by uid from JWT token
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return reply.send({
        success: true,
        data: {
          canReview: false,
          reason: "User not found"
        }
      });
    }
    
    const userId = user._id;

    // Enhanced input validation
    if (!orderId) {
      return reply.status(400).send({
        success: false,
        message: "Order ID is required"
      });
    }

    // Convert orderId to ObjectId if it's a string
    let orderObjectId;
    try {
      orderObjectId = new mongoose.Types.ObjectId(orderId);
    } catch (error) {
      // If orderId is not a valid ObjectId, try to find by externalId
      const order = await Order.findOne({ externalId: orderId });
      if (!order) {
        return reply.send({
          success: true,
          data: {
            canReview: false,
            reason: "Order not found"
          }
        });
      }
      orderObjectId = order._id;
    }

    // Check if order exists, belongs to user, and is completed
    const order = await Order.findOne({
      _id: orderObjectId,
      buyerId: userId,
      status: "completed"
    }).populate("orderItems.listingId");

    if (!order) {
      return reply.send({
        success: true,
        data: {
          canReview: false,
          reason: "Order not found, not completed, or you don't have permission to review this order"
        }
      });
    }

    // Additional security check: Ensure order was completed recently enough to review
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    if (order.createdAt < sixMonthsAgo) {
      return reply.send({
        success: true,
        data: {
          canReview: false,
          reason: "This order is too old to review. Reviews can only be submitted within 6 months of purchase."
        }
      });
    }

    // Verify that the order has valid items to review
    const validOrderItems = order.orderItems.filter(item => 
      item.listingId && !item.listingId.deleted
    );

    if (validOrderItems.length === 0) {
      return reply.send({
        success: true,
        data: {
          canReview: false,
          reason: "The items in this order are no longer available for review"
        }
      });
    }

    // Check if user already reviewed this order
    const existingReview = await Review.findOne({
      reviewerId: userId,
      orderId: orderObjectId
    });

    if (existingReview) {
      return reply.send({
        success: true,
        data: {
          canReview: false,
          reason: "Already reviewed",
          existingReview: {
            rating: existingReview.rating,
            comment: existingReview.comment,
            createdAt: existingReview.createdAt
          }
        }
      });
    }

    // Log the review eligibility check for security monitoring
    console.log(`Review eligibility checked for order ${order.externalId} by user ${userId}`);

    return reply.send({
      success: true,
      data: {
        canReview: true,
        reason: "Order completed - eligible for review",
        order: {
          externalId: order.externalId,
          totalAmount: order.totalAmount,
          currency: order.currency,
          createdAt: order.createdAt,
          orderItems: validOrderItems.map(item => ({
            title: item.title,
            platform: item.platform,
            region: item.region,
            quantity: item.quantity,
            totalPrice: item.totalPrice
          }))
        }
      }
    });

  } catch (error) {
    console.error("Error checking review eligibility:", error);
    return reply.status(500).send({
      success: false,
      message: "Error checking review eligibility. Please try again later."
    });
  }
};

// Mark review as helpful
const markReviewAsHelpful = async (request, reply) => {
  try {
    const { reviewId } = request.params;
    
    // Get user by uid from JWT token
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return reply.status(404).send({
        success: false,
        message: "User not found"
      });
    }
    
    const userId = user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return reply.status(404).send({
        success: false,
        message: "Review not found"
      });
    }

    // Check if user is trying to mark their own review
    if (review.reviewerId.toString() === userId.toString()) {
      return reply.status(400).send({
        success: false,
        message: "You cannot mark your own review as helpful"
      });
    }

    await review.markAsHelpful(userId);

    return reply.send({
      success: true,
      message: "Review marked as helpful",
      data: {
        helpfulVotes: review.helpfulVotes
      }
    });

  } catch (error) {
    console.error("Error marking review as helpful:", error);
    
    if (error.message === "You have already marked this review as helpful") {
      return reply.status(400).send({
        success: false,
        message: error.message
      });
    }

    return reply.status(500).send({
      success: false,
      message: "Error marking review as helpful"
    });
  }
};

// Remove helpful mark from review
const removeHelpfulMark = async (request, reply) => {
  try {
    const { reviewId } = request.params;
    
    // Get user by uid from JWT token
    const user = await User.findOne({ uid: request.user.uid });
    if (!user) {
      return reply.status(404).send({
        success: false,
        message: "User not found"
      });
    }
    
    const userId = user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return reply.status(404).send({
        success: false,
        message: "Review not found"
      });
    }

    await review.removeHelpfulMark(userId);

    return reply.send({
      success: true,
      message: "Helpful mark removed",
      data: {
        helpfulVotes: review.helpfulVotes
      }
    });

  } catch (error) {
    console.error("Error removing helpful mark:", error);
    
    if (error.message === "You haven't marked this review as helpful") {
      return reply.status(400).send({
        success: false,
        message: error.message
      });
    }

    return reply.status(500).send({
      success: false,
      message: "Error removing helpful mark"
    });
  }
};

module.exports = {
  createReview,
  getListingReviews,
  getSellerReviews,
  canUserReviewOrder,
  markReviewAsHelpful,
  removeHelpfulMark
};