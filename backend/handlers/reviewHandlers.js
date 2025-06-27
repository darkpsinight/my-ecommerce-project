const { Review } = require("../models/review");
const { Order } = require("../models/order");
const { Listing } = require("../models/listing");
const mongoose = require("mongoose");

// Create a new review
const createReview = async (request, reply) => {
  try {
    const { orderId, rating, comment } = request.body;
    const reviewerId = request.user.id;

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

    // Verify order exists and belongs to the user
    const order = await Order.findOne({
      _id: orderObjectId,
      buyerId: reviewerId,
      status: "completed"
    }).populate("orderItems.listingId");

    if (!order) {
      return reply.status(404).send({
        success: false,
        message: "Order not found or not eligible for review"
      });
    }

    // Check if user already reviewed this order
    const existingReview = await Review.findOne({
      reviewerId,
      orderId: orderObjectId
    });

    if (existingReview) {
      return reply.status(400).send({
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

    // Create the review
    const review = await Review.createReview({
      reviewerId,
      orderId: orderObjectId,
      listingId: firstOrderItem.listingId._id,
      sellerId: order.sellerId,
      rating,
      comment
    });

    // Return success response
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
    
    if (error.message === "You have already reviewed this order") {
      return reply.status(400).send({
        success: false,
        message: error.message
      });
    }

    return reply.status(500).send({
      success: false,
      message: "Error creating review"
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

    // Verify listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return reply.status(404).send({
        success: false,
        message: "Listing not found"
      });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      minRating: minRating ? parseInt(minRating) : undefined,
      maxRating: maxRating ? parseInt(maxRating) : undefined
    };

    const result = await Review.getListingReviews(listingId, options);

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
    const sellerId = request.user.id;
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
    const userId = request.user.id;

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

    // Check if order exists and is completed
    const order = await Order.findOne({
      _id: orderObjectId,
      buyerId: userId,
      status: "completed"
    });

    if (!order) {
      return reply.send({
        success: true,
        data: {
          canReview: false,
          reason: "Order not found or not completed"
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

    return reply.send({
      success: true,
      data: {
        canReview: true,
        order: {
          externalId: order.externalId,
          totalAmount: order.totalAmount,
          currency: order.currency,
          createdAt: order.createdAt,
          orderItems: order.orderItems.map(item => ({
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
      message: "Error checking review eligibility"
    });
  }
};

// Mark review as helpful
const markReviewAsHelpful = async (request, reply) => {
  try {
    const { reviewId } = request.params;
    const userId = request.user.id;

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
    const userId = request.user.id;

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