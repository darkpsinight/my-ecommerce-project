const mongoose = require("mongoose");

// Marketing Spend schema for tracking acquisition costs
const marketingSpendSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Seller ID is required"],
    index: true
  },
  // Spend details
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0, "Amount must be positive"]
  },
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP"]
  },
  // Channel/Source information
  channel: {
    type: String,
    required: [true, "Marketing channel is required"],
    enum: [
      "google_ads",
      "facebook_ads", 
      "instagram_ads",
      "twitter_ads",
      "linkedin_ads",
      "youtube_ads",
      "tiktok_ads",
      "reddit_ads",
      "influencer_marketing",
      "affiliate_marketing",
      "email_marketing",
      "content_marketing",
      "seo",
      "referral_program",
      "direct_mail",
      "events",
      "partnerships",
      "other"
    ],
    index: true
  },
  campaignName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Time period this spend covers
  spendDate: {
    type: Date,
    required: [true, "Spend date is required"],
    index: true
  },
  periodStart: {
    type: Date,
    required: [true, "Period start date is required"]
  },
  periodEnd: {
    type: Date,
    required: [true, "Period end date is required"]
  },
  // Tracking and attribution
  utmSource: {
    type: String,
    trim: true
  },
  utmMedium: {
    type: String,
    trim: true
  },
  utmCampaign: {
    type: String,
    trim: true
  },
  // Performance metrics (optional, can be updated later)
  impressions: {
    type: Number,
    min: 0
  },
  clicks: {
    type: Number,
    min: 0
  },
  conversions: {
    type: Number,
    min: 0
  },
  // Status and metadata
  status: {
    type: String,
    enum: ["active", "paused", "completed", "cancelled"],
    default: "active"
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
marketingSpendSchema.index({ sellerId: 1, spendDate: -1 });
marketingSpendSchema.index({ sellerId: 1, channel: 1 });
marketingSpendSchema.index({ sellerId: 1, periodStart: 1, periodEnd: 1 });

// Static method to get total spend by seller and time period
marketingSpendSchema.statics.getTotalSpendByPeriod = async function(sellerId, startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        sellerId: sellerId,
        $or: [
          // Spend that falls within the period
          {
            spendDate: { $gte: startDate, $lte: endDate }
          },
          // Spend periods that overlap with our target period
          {
            $and: [
              { periodStart: { $lte: endDate } },
              { periodEnd: { $gte: startDate } }
            ]
          }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalSpend: { $sum: "$amount" },
        spendCount: { $sum: 1 }
      }
    }
  ]);

  return result[0] || { totalSpend: 0, spendCount: 0 };
};

// Static method to get spend by channel
marketingSpendSchema.statics.getSpendByChannel = async function(sellerId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        sellerId: sellerId,
        $or: [
          { spendDate: { $gte: startDate, $lte: endDate } },
          {
            $and: [
              { periodStart: { $lte: endDate } },
              { periodEnd: { $gte: startDate } }
            ]
          }
        ]
      }
    },
    {
      $group: {
        _id: "$channel",
        totalSpend: { $sum: "$amount" },
        campaignCount: { $sum: 1 },
        avgSpend: { $avg: "$amount" }
      }
    },
    { $sort: { totalSpend: -1 } }
  ]);
};

// Instance method to validate period dates
marketingSpendSchema.pre('save', function(next) {
  if (this.periodEnd <= this.periodStart) {
    next(new Error('Period end date must be after period start date'));
  }
  next();
});

const MarketingSpend = mongoose.model("MarketingSpend", marketingSpendSchema);

module.exports = {
  MarketingSpend
};