const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Define the viewed product schema optimized for analytics and retrieval
const viewedProductSchema = new mongoose.Schema({
  // External ID for frontend use (never expose MongoDB _id)
  externalId: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4,
    index: true
  },
  
  // User who viewed the product (using uid from user model, or sessionId for anonymous)
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
  
  // Product that was viewed (using externalId from listing model)
  productId: {
    type: String,
    required: true,
    index: true
  },
  
  // Timestamp of when the product was viewed
  viewedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  // Additional metadata for analytics
  metadata: {
    // Source of the view (homepage, search, category, recommendation, etc.)
    source: {
      type: String,
      enum: [
        'homepage', 'search', 'category', 'recommendation', 
        'related', 'seller_profile', 'wishlist', 'direct', 'other'
      ],
      default: 'other'
    },
    
    // User agent information for device analytics
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'other'],
      default: 'other'
    },
    
    // Session information for behavior analysis
    sessionId: String,
    
    // Referrer URL if available
    referrer: String,
    
    // View duration tracking
    viewDuration: {
      type: Number, // in milliseconds
      min: 0
    },
    
    // Session tracking for time on page
    sessionStart: {
      type: Date,
      default: Date.now
    },
    
    // Last activity timestamp for calculating active time
    lastActivity: {
      type: Date,
      default: Date.now
    },
    
    // Whether this is an active session (user still on page)
    isActiveSession: {
      type: Boolean,
      default: true
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

// Compound indexes for efficient queries
viewedProductSchema.index({ userUid: 1, viewedAt: -1 }); // Recent views by user
viewedProductSchema.index({ userUid: 1, productId: 1 }); // Check if user viewed product
viewedProductSchema.index({ anonymousId: 1, productId: 1 }); // Check if anonymous user viewed product
viewedProductSchema.index({ anonymousId: 1, viewedAt: -1 }); // Recent views by anonymous user
viewedProductSchema.index({ productId: 1, viewedAt: -1 }); // Product popularity analysis
viewedProductSchema.index({ viewedAt: -1 }); // Global recent views
viewedProductSchema.index({ isDeleted: 1, viewedAt: -1 }); // Active views only
viewedProductSchema.index({ 'metadata.source': 1, viewedAt: -1 }); // Source analysis
viewedProductSchema.index({ userUid: 1, isDeleted: 1, viewedAt: -1 }); // User's active views

// Static methods for common operations
viewedProductSchema.statics.getRecentViewsByUser = function(userUid, limit = 20, includeDeleted = false) {
  const query = { userUid };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  
  return this.find(query)
    .sort({ viewedAt: -1 })
    .limit(limit)
    .lean(); // Use lean() for better performance when not modifying documents
};

viewedProductSchema.statics.addOrUpdateView = async function(viewData) {
  const { userUid, anonymousId, productId, metadata = {} } = viewData;
  
  console.log('🔍 addOrUpdateView called with:', {
    userUid,
    anonymousId,
    productId,
    metadata
  });
  
  // Build query for checking recent views
  let query = {
    productId,
    isDeleted: false,
    viewedAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // 30 minutes ago
  };
  
  // Add user identification to query
  if (userUid) {
    query.userUid = userUid;
    console.log('🔍 Using authenticated user query:', query);
  } else if (anonymousId) {
    query.anonymousId = anonymousId;
    console.log('🔍 Using anonymous user query:', query);
  } else {
    // If no user identification provided, create new view anyway
    query = null;
    console.log('🔍 No user identification provided, will create new view');
  }
  
  let recentView = null;
  if (query) {
    recentView = await this.findOne(query);
    console.log('🔍 Recent view found:', recentView ? 'YES' : 'NO');
    if (recentView) {
      console.log('🔍 Recent view details:', {
        id: recentView.externalId,
        viewedAt: recentView.viewedAt,
        userUid: recentView.userUid,
        anonymousId: recentView.anonymousId
      });
    }
  }
  
  if (recentView) {
    // Update existing recent view (don't create duplicate)
    console.log('✅ Updating existing view record');
    recentView.viewedAt = new Date();
    
    // Update metadata fields individually to avoid validation issues
    if (metadata.source) recentView.metadata.source = metadata.source;
    if (metadata.deviceType) recentView.metadata.deviceType = metadata.deviceType;
    if (metadata.sessionId) recentView.metadata.sessionId = metadata.sessionId;
    if (metadata.referrer) recentView.metadata.referrer = metadata.referrer;
    if (metadata.viewDuration !== undefined) recentView.metadata.viewDuration = metadata.viewDuration;
    if (metadata.customerLocation) recentView.metadata.customerLocation = metadata.customerLocation;
    
    // Update session tracking fields
    recentView.metadata.lastActivity = new Date();
    
    const savedView = await recentView.save();
    console.log('✅ Updated view record:', savedView.externalId);
    return savedView;
  } else {
    // Create new view record
    console.log('✅ Creating new view record');
    const newView = new this({
      userUid: userUid || null,
      anonymousId: anonymousId || null,
      productId,
      metadata: {
        ...metadata,
        sessionStart: new Date(),
        lastActivity: new Date(),
        isActiveSession: true
      },
      // Set expiration date (e.g., 1 year from now for data retention)
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
    const savedView = await newView.save();
    console.log('✅ Created new view record:', {
      id: savedView.externalId,
      productId: savedView.productId,
      userUid: savedView.userUid,
      anonymousId: savedView.anonymousId,
      sessionId: savedView.metadata?.sessionId,
      isActiveSession: savedView.metadata?.isActiveSession,
      viewDuration: savedView.metadata?.viewDuration
    });
    return savedView;
  }
};

viewedProductSchema.statics.getPopularProducts = function(timeframe = '7d', limit = 100) {
  const timeframes = {
    '1d': 1 * 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  };
  
  const timeframeMs = timeframes[timeframe] || timeframes['7d'];
  const startDate = new Date(Date.now() - timeframeMs);
  
  return this.aggregate([
    {
      $match: {
        viewedAt: { $gte: startDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$productId',
        viewCount: { $sum: 1 },
        uniqueViewers: { $addToSet: '$userUid' },
        lastViewed: { $max: '$viewedAt' }
      }
    },
    {
      $addFields: {
        uniqueViewerCount: { $size: '$uniqueViewers' }
      }
    },
    {
      $sort: { viewCount: -1, uniqueViewerCount: -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        productId: '$_id',
        viewCount: 1,
        uniqueViewerCount: 1,
        lastViewed: 1,
        _id: 0
      }
    }
  ]);
};

viewedProductSchema.statics.getUserViewingPatterns = function(userUid, timeframe = '30d') {
  const timeframes = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  };
  
  const timeframeMs = timeframes[timeframe] || timeframes['30d'];
  const startDate = new Date(Date.now() - timeframeMs);
  
  return this.aggregate([
    {
      $match: {
        userUid,
        viewedAt: { $gte: startDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$viewedAt' } },
          source: '$metadata.source'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        totalViews: { $sum: '$count' },
        sourceBreakdown: {
          $push: {
            source: '$_id.source',
            count: '$count'
          }
        }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
};

// Update session activity (heartbeat from frontend)
viewedProductSchema.statics.updateSessionActivity = async function(sessionData) {
  const { userUid, anonymousId, productId, sessionId } = sessionData;
  
  // Find active session for this user/product combination
  let query = {
    productId,
    isDeleted: false,
    'metadata.isActiveSession': true
  };
  
  if (userUid) {
    query.userUid = userUid;
  } else if (anonymousId) {
    query.anonymousId = anonymousId;
  }
  
  if (sessionId) {
    query['metadata.sessionId'] = sessionId;
  }
  
  const activeSession = await this.findOne(query).sort({ viewedAt: -1 });
  
  if (activeSession) {
    activeSession.metadata.lastActivity = new Date();
    await activeSession.save();
    return activeSession;
  }
  
  return null;
};

// End session and calculate final duration
viewedProductSchema.statics.endSession = async function(sessionData) {
  const { userUid, anonymousId, productId, sessionId, finalDuration } = sessionData;
  
  // Find active session
  let query = {
    productId,
    isDeleted: false,
    'metadata.isActiveSession': true
  };
  
  if (userUid) {
    query.userUid = userUid;
  } else if (anonymousId) {
    query.anonymousId = anonymousId;
  }
  
  if (sessionId) {
    query['metadata.sessionId'] = sessionId;
  }
  
  const activeSession = await this.findOne(query).sort({ viewedAt: -1 });
  
  if (activeSession) {
    // Calculate duration if not provided
    let duration = finalDuration;
    if (!duration && activeSession.metadata.sessionStart) {
      duration = Date.now() - activeSession.metadata.sessionStart.getTime();
    }
    
    activeSession.metadata.isActiveSession = false;
    activeSession.metadata.viewDuration = duration;
    activeSession.metadata.lastActivity = new Date();
    
    await activeSession.save();
    return activeSession;
  }
  
  return null;
};

// Get time-based analytics for products
viewedProductSchema.statics.getTimeAnalytics = function(productIds, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        productId: { $in: productIds },
        viewedAt: { $gte: startDate, $lte: endDate },
        isDeleted: false,
        'metadata.viewDuration': { $exists: true, $gt: 0 }
      }
    },
    {
      $group: {
        _id: '$productId',
        totalViews: { $sum: 1 },
        totalTimeSpent: { $sum: '$metadata.viewDuration' },
        avgTimeOnPage: { $avg: '$metadata.viewDuration' },
        minTimeOnPage: { $min: '$metadata.viewDuration' },
        maxTimeOnPage: { $max: '$metadata.viewDuration' },
        uniqueViewers: { 
          $addToSet: {
            $cond: [
              { $ne: ['$userUid', null] },
              '$userUid',
              '$anonymousId'
            ]
          }
        }
      }
    },
    {
      $addFields: {
        uniqueViewerCount: { $size: '$uniqueViewers' },
        avgTimeOnPageSeconds: { $divide: ['$avgTimeOnPage', 1000] },
        totalTimeSpentMinutes: { $divide: ['$totalTimeSpent', 60000] }
      }
    },
    {
      $sort: { avgTimeOnPage: -1 }
    }
  ]);
};

// Instance methods
viewedProductSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

viewedProductSchema.methods.restore = function() {
  this.isDeleted = false;
  return this.save();
};

// Middleware to ensure data consistency
viewedProductSchema.pre('save', function(next) {
  // Ensure viewedAt is not in the future
  if (this.viewedAt > new Date()) {
    this.viewedAt = new Date();
  }
  
  // Set default expiration if not set
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year default
  }
  
  next();
});

// Middleware for logging (optional, for debugging)
viewedProductSchema.post('save', function(doc) {
  console.log(`Viewed product saved: User ${doc.userUid} viewed product ${doc.productId} at ${doc.viewedAt}`);
});

const ViewedProduct = mongoose.model("ViewedProduct", viewedProductSchema);

module.exports = ViewedProduct;