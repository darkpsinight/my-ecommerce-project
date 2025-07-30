const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Define the listing impression schema for CTR analytics
const listingImpressionSchema = new mongoose.Schema({
  // External ID for frontend use (never expose MongoDB _id)
  externalId: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4,
    index: true
  },
  
  // User who saw the impression (using uid from user model, or sessionId for anonymous)
  userUid: {
    type: String,
    required: false, // Allow null for anonymous users
    index: true
  },
  
  // For anonymous users, we'll use sessionId or IP-based tracking
  anonymousId: {
    type: String,
    required: false,
    index: true
  },
  
  // Product that was shown (using externalId from listing model)
  productId: {
    type: String,
    required: true,
    index: true
  },
  
  // Timestamp of when the impression occurred
  impressionAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  // Whether this impression resulted in a click (view)
  wasClicked: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Reference to the ViewedProduct if clicked
  clickedViewId: {
    type: String,
    required: false,
    index: true
  },
  
  // Time between impression and click (if clicked)
  clickDelay: {
    type: Number, // in milliseconds
    required: false
  },
  
  // Impression context and metadata
  metadata: {
    // Source of the impression (search results, category page, homepage, etc.)
    source: {
      type: String,
      enum: [
        'search_results', 'category_page', 'homepage_featured', 
        'recommendations', 'related_products', 'seller_profile',
        'wishlist_page', 'trending', 'new_arrivals', 'other'
      ],
      default: 'other',
      index: true
    },
    
    // Position in the list/grid (for position-based CTR analysis)
    position: {
      type: Number,
      min: 1,
      index: true
    },
    
    // Total items shown in the same context (for relative position analysis)
    totalItemsShown: {
      type: Number,
      min: 1
    },
    
    // Search query if from search results
    searchQuery: {
      type: String,
      required: false
    },
    
    // Category if from category page
    category: {
      type: String,
      required: false
    },
    
    // Platform where the impression occurred
    platform: {
      type: String,
      required: false
    },
    
    // User agent information for device analytics
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'other'],
      default: 'other'
    },
    
    // Session information for behavior analysis
    sessionId: String,
    
    // Page URL where impression occurred
    pageUrl: String,
    
    // Referrer URL if available
    referrer: String,
    
    // Viewport information (for above/below fold analysis)
    viewport: {
      isAboveFold: {
        type: Boolean,
        default: false
      },
      scrollPosition: Number,
      viewportHeight: Number,
      elementPosition: Number
    },
    
    // Customer Geographic Data
    customerLocation: {
      ipAddress: {
        type: String,
        required: false
      },
      country: {
        type: String,
        required: false
      },
      countryCode: {
        type: String,
        required: false
      },
      region: {
        type: String,
        required: false
      },
      city: {
        type: String,
        required: false
      },
      latitude: {
        type: Number,
        required: false
      },
      longitude: {
        type: Number,
        required: false
      },
      timezone: {
        type: String,
        required: false
      }
    }
  },
  
  // Soft delete functionality for GDPR compliance
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Automatic deletion date for data retention policies
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 } // TTL index
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Compound indexes for efficient CTR queries
listingImpressionSchema.index({ productId: 1, impressionAt: -1 }); // Product impression history
listingImpressionSchema.index({ userUid: 1, impressionAt: -1 }); // User impression history
listingImpressionSchema.index({ anonymousId: 1, impressionAt: -1 }); // Anonymous user impressions
listingImpressionSchema.index({ 'metadata.source': 1, impressionAt: -1 }); // Source analysis
listingImpressionSchema.index({ productId: 1, wasClicked: 1 }); // CTR calculation
listingImpressionSchema.index({ productId: 1, 'metadata.source': 1, wasClicked: 1 }); // CTR by source
listingImpressionSchema.index({ 'metadata.position': 1, wasClicked: 1 }); // Position-based CTR
listingImpressionSchema.index({ isDeleted: 1, impressionAt: -1 }); // Active impressions only

// Static methods for impression tracking
listingImpressionSchema.statics.trackImpression = async function(impressionData) {
  const { userUid, anonymousId, productId, metadata = {} } = impressionData;
  
  console.log('🔍 trackImpression called with:', {
    userUid,
    anonymousId,
    productId,
    source: metadata.source,
    position: metadata.position
  });
  
  // Create new impression record
  const newImpression = new this({
    userUid: userUid || null,
    anonymousId: anonymousId || null,
    productId,
    metadata: {
      ...metadata,
      // Ensure required fields have defaults
      source: metadata.source || 'other',
      deviceType: metadata.deviceType || 'other'
    },
    // Set expiration date (e.g., 1 year from now for data retention)
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  });
  
  const savedImpression = await newImpression.save();
  console.log('✅ Created impression record:', {
    id: savedImpression.externalId,
    productId: savedImpression.productId,
    source: savedImpression.metadata?.source,
    position: savedImpression.metadata?.position
  });
  
  return savedImpression;
};

// Mark impression as clicked when user views the product
listingImpressionSchema.statics.markAsClicked = async function(productId, userUid, anonymousId, clickedViewId) {
  console.log('🔍 markAsClicked called with:', { productId, userUid, anonymousId, clickedViewId });
  
  // Find recent unclicked impression for this user/product combination
  let query = {
    productId,
    wasClicked: false,
    isDeleted: false,
    impressionAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Within last hour
  };
  
  // Add user identification to query
  if (userUid) {
    query.userUid = userUid;
  } else if (anonymousId) {
    query.anonymousId = anonymousId;
  } else {
    console.log('⚠️ No user identification provided for click tracking');
    return null;
  }
  
  // Find the most recent impression
  const recentImpression = await this.findOne(query).sort({ impressionAt: -1 });
  
  if (recentImpression) {
    const clickDelay = Date.now() - recentImpression.impressionAt.getTime();
    
    recentImpression.wasClicked = true;
    recentImpression.clickedViewId = clickedViewId;
    recentImpression.clickDelay = clickDelay;
    
    const updatedImpression = await recentImpression.save();
    console.log('✅ Marked impression as clicked:', {
      id: updatedImpression.externalId,
      clickDelay: Math.round(clickDelay / 1000) + 's'
    });
    
    return updatedImpression;
  } else {
    console.log('⚠️ No recent impression found to mark as clicked');
    return null;
  }
};

// Get CTR analytics for products
listingImpressionSchema.statics.getCTRAnalytics = function(productIds, startDate, endDate, options = {}) {
  const { groupBy = 'product', includePosition = false } = options;
  
  let matchStage = {
    productId: { $in: productIds },
    impressionAt: { $gte: startDate, $lte: endDate },
    isDeleted: false
  };
  
  let groupStage = {
    _id: groupBy === 'source' ? '$metadata.source' : '$productId',
    totalImpressions: { $sum: 1 },
    totalClicks: { $sum: { $cond: ['$wasClicked', 1, 0] } },
    avgClickDelay: { 
      $avg: { 
        $cond: [
          { $and: ['$wasClicked', { $ne: ['$clickDelay', null] }] },
          '$clickDelay',
          null
        ]
      }
    }
  };
  
  if (includePosition) {
    groupStage.avgPosition = { $avg: '$metadata.position' };
    groupStage.positionBreakdown = {
      $push: {
        $cond: [
          { $ne: ['$metadata.position', null] },
          {
            position: '$metadata.position',
            wasClicked: '$wasClicked'
          },
          null
        ]
      }
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    { $group: groupStage },
    {
      $addFields: {
        clickThroughRate: {
          $cond: [
            { $gt: ['$totalImpressions', 0] },
            { $multiply: [{ $divide: ['$totalClicks', '$totalImpressions'] }, 100] },
            0
          ]
        },
        avgClickDelaySeconds: {
          $cond: [
            { $ne: ['$avgClickDelay', null] },
            { $divide: ['$avgClickDelay', 1000] },
            null
          ]
        }
      }
    },
    { $sort: { clickThroughRate: -1 } }
  ]);
};

// Get position-based CTR analysis
listingImpressionSchema.statics.getPositionCTRAnalysis = function(productIds, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        productId: { $in: productIds },
        impressionAt: { $gte: startDate, $lte: endDate },
        isDeleted: false,
        'metadata.position': { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$metadata.position',
        totalImpressions: { $sum: 1 },
        totalClicks: { $sum: { $cond: ['$wasClicked', 1, 0] } },
        avgClickDelay: { 
          $avg: { 
            $cond: [
              { $and: ['$wasClicked', { $ne: ['$clickDelay', null] }] },
              '$clickDelay',
              null
            ]
          }
        }
      }
    },
    {
      $addFields: {
        position: '$_id',
        clickThroughRate: {
          $cond: [
            { $gt: ['$totalImpressions', 0] },
            { $multiply: [{ $divide: ['$totalClicks', '$totalImpressions'] }, 100] },
            0
          ]
        },
        avgClickDelaySeconds: {
          $cond: [
            { $ne: ['$avgClickDelay', null] },
            { $divide: ['$avgClickDelay', 1000] },
            null
          ]
        }
      }
    },
    { $sort: { position: 1 } },
    { $project: { _id: 0 } }
  ]);
};

// Instance methods
listingImpressionSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

listingImpressionSchema.methods.restore = function() {
  this.isDeleted = false;
  return this.save();
};

// Middleware to ensure data consistency
listingImpressionSchema.pre('save', function(next) {
  // Ensure impressionAt is not in the future
  if (this.impressionAt > new Date()) {
    this.impressionAt = new Date();
  }
  
  // Set default expiration if not set
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year default
  }
  
  // Validate position if provided
  if (this.metadata.position && this.metadata.position < 1) {
    this.metadata.position = 1;
  }
  
  next();
});

// Middleware for logging (optional, for debugging)
listingImpressionSchema.post('save', function(doc) {
  console.log(`Listing impression saved: User ${doc.userUid || doc.anonymousId} saw product ${doc.productId} at position ${doc.metadata?.position || 'unknown'}`);
});

const ListingImpression = mongoose.model("ListingImpression", listingImpressionSchema);

module.exports = ListingImpression;