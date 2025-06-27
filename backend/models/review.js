const mongoose = require("mongoose");

// Review schema for buyers to review their purchased products
const reviewSchema = new mongoose.Schema({
  // User who wrote the review
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Reviewer ID is required"],
    index: true
  },
  // Order this review is for
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: [true, "Order ID is required"],
    index: true
  },
  // Listing/product being reviewed
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: [true, "Listing ID is required"],
    index: true
  },
  // Seller being reviewed
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Seller ID is required"],
    index: true
  },
  // Review content
  rating: {
    type: Number,
    required: [true, "Rating is required"],
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating must be at most 5"]
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [1000, "Comment must be less than 1000 characters"]
  },
  // Review status
  status: {
    type: String,
    enum: ["published", "hidden", "reported"],
    default: "published",
    index: true
  },
  // Helpful votes
  helpfulVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  // Users who found this review helpful
  helpfulBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  // Admin response to the review
  adminResponse: {
    type: String,
    trim: true,
    maxlength: [500, "Admin response must be less than 500 characters"]
  },
  adminResponseDate: {
    type: Date
  },
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for performance
reviewSchema.index({ listingId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ reviewerId: 1, orderId: 1 }, { unique: true }); // One review per order per user
reviewSchema.index({ rating: 1, status: 1 });

// Static method to create a review
reviewSchema.statics.createReview = async function(reviewData) {
  const {
    reviewerId,
    orderId,
    listingId,
    sellerId,
    rating,
    comment
  } = reviewData;

  // Check if user already reviewed this order
  const existingReview = await this.findOne({
    reviewerId,
    orderId
  });

  if (existingReview) {
    throw new Error("You have already reviewed this order");
  }

  const review = new this({
    reviewerId,
    orderId,
    listingId,
    sellerId,
    rating,
    comment: comment || "",
    status: "published"
  });

  return await review.save();
};

// Static method to get reviews for a listing
reviewSchema.statics.getListingReviews = async function(listingId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    minRating,
    maxRating
  } = options;

  const query = { 
    listingId, 
    status: "published" 
  };

  if (minRating) {
    query.rating = { $gte: minRating };
  }
  if (maxRating) {
    if (query.rating) {
      query.rating.$lte = maxRating;
    } else {
      query.rating = { $lte: maxRating };
    }
  }

  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const skip = (page - 1) * limit;

  const reviews = await this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate("reviewerId", "name")
    .select("-helpfulBy -metadata");

  const total = await this.countDocuments(query);

  // Calculate rating statistics
  const ratingStats = await this.aggregate([
    { $match: { listingId: new mongoose.Types.ObjectId(listingId), status: "published" } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: "$rating"
        }
      }
    }
  ]);

  // Calculate rating distribution
  let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (ratingStats.length > 0) {
    ratingStats[0].ratingDistribution.forEach(rating => {
      ratingDistribution[rating]++;
    });
  }

  return {
    reviews: reviews.map(review => {
      const reviewData = review.toObject();
      // Remove internal fields
      delete reviewData._id;
      delete reviewData.__v;
      return reviewData;
    }),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    statistics: {
      averageRating: ratingStats.length > 0 ? Math.round(ratingStats[0].averageRating * 10) / 10 : 0,
      totalReviews: ratingStats.length > 0 ? ratingStats[0].totalReviews : 0,
      ratingDistribution
    }
  };
};

// Static method to get reviews by seller
reviewSchema.statics.getSellerReviews = async function(sellerId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = options;

  const query = { sellerId, status: "published" };

  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const skip = (page - 1) * limit;

  const reviews = await this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate("reviewerId", "name")
    .populate("listingId", "title platform region")
    .select("-helpfulBy -metadata");

  const total = await this.countDocuments(query);

  return {
    reviews: reviews.map(review => {
      const reviewData = review.toObject();
      // Remove internal fields
      delete reviewData._id;
      delete reviewData.__v;
      return reviewData;
    }),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Instance method to mark review as helpful
reviewSchema.methods.markAsHelpful = async function(userId) {
  if (this.helpfulBy.includes(userId)) {
    throw new Error("You have already marked this review as helpful");
  }

  this.helpfulBy.push(userId);
  this.helpfulVotes += 1;
  return await this.save();
};

// Instance method to remove helpful mark
reviewSchema.methods.removeHelpfulMark = async function(userId) {
  const index = this.helpfulBy.indexOf(userId);
  if (index === -1) {
    throw new Error("You haven't marked this review as helpful");
  }

  this.helpfulBy.splice(index, 1);
  this.helpfulVotes = Math.max(0, this.helpfulVotes - 1);
  return await this.save();
};

// Instance method to hide review
reviewSchema.methods.hideReview = async function() {
  this.status = "hidden";
  return await this.save();
};

// Instance method to add admin response
reviewSchema.methods.addAdminResponse = async function(response) {
  this.adminResponse = response;
  this.adminResponseDate = new Date();
  return await this.save();
};

const Review = mongoose.model("Review", reviewSchema);

module.exports = {
  Review
};