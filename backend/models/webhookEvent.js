const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Webhook Event schema for storing and tracking Stripe webhook events
const webhookEventSchema = new mongoose.Schema({
  stripeEventId: {
    type: String,
    required: [true, "Stripe event ID is required"],
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: [true, "Event type is required"],
    index: true
  },
  // Event source
  source: {
    type: String,
    enum: ["platform", "connect", "legacy"],
    default: "platform",
    index: true
  },
  // Raw event data from Stripe
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  // Processing status
  processed: {
    type: Boolean,
    default: false,
    index: true
  },
  processedAt: {
    type: Date
  },
  // Processing attempts
  processingAttempts: {
    type: Number,
    default: 0
  },
  lastProcessingAttempt: {
    type: Date
  },
  // Error tracking
  processingErrors: [{
    error: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    attempt: Number
  }],
  // Related entities (extracted from event data)
  relatedStripeAccountId: {
    type: String,
    index: true
  },
  relatedPaymentIntentId: {
    type: String,
    index: true
  },
  relatedTransferId: {
    type: String,
    index: true
  },
  relatedCustomerId: {
    type: String,
    index: true
  },
  // External tracking
  externalId: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4,
    index: true
  },
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
webhookEventSchema.index({ type: 1, processed: 1 });
webhookEventSchema.index({ source: 1, processed: 1 });
webhookEventSchema.index({ processed: 1, createdAt: -1 });
webhookEventSchema.index({ processingAttempts: 1, processed: 1 });

// Instance methods
webhookEventSchema.methods.markAsProcessed = function() {
  this.processed = true;
  this.processedAt = new Date();
  return this.save();
};

webhookEventSchema.methods.recordProcessingError = function(error) {
  this.processingAttempts += 1;
  this.lastProcessingAttempt = new Date();
  
  this.processingErrors.push({
    error: error.message || error.toString(),
    timestamp: new Date(),
    attempt: this.processingAttempts
  });
  
  return this.save();
};

webhookEventSchema.methods.shouldRetryProcessing = function() {
  const maxAttempts = 5;
  const retryDelay = 5 * 60 * 1000; // 5 minutes
  
  if (this.processingAttempts >= maxAttempts) {
    return false;
  }
  
  if (!this.lastProcessingAttempt) {
    return true;
  }
  
  const timeSinceLastAttempt = Date.now() - this.lastProcessingAttempt.getTime();
  return timeSinceLastAttempt >= retryDelay;
};

// Static methods
webhookEventSchema.statics.createFromStripeEvent = async function(stripeEvent, source = "platform") {
  // Extract related IDs from event data
  const relatedIds = this.extractRelatedIds(stripeEvent);
  
  const webhookEvent = new this({
    stripeEventId: stripeEvent.id,
    type: stripeEvent.type,
    source,
    rawData: stripeEvent,
    ...relatedIds,
    externalId: uuidv4()
  });
  
  return await webhookEvent.save();
};

webhookEventSchema.statics.extractRelatedIds = function(stripeEvent) {
  const relatedIds = {};
  
  // Extract IDs based on event type and data structure
  if (stripeEvent.data && stripeEvent.data.object) {
    const obj = stripeEvent.data.object;
    
    // Payment Intent related
    if (obj.object === "payment_intent" || obj.payment_intent) {
      relatedIds.relatedPaymentIntentId = obj.id || obj.payment_intent;
    }
    
    // Transfer related
    if (obj.object === "transfer" || obj.transfer) {
      relatedIds.relatedTransferId = obj.id || obj.transfer;
      if (obj.destination) {
        relatedIds.relatedStripeAccountId = obj.destination;
      }
    }
    
    // Account related
    if (obj.object === "account") {
      relatedIds.relatedStripeAccountId = obj.id;
    }
    
    // Customer related
    if (obj.customer) {
      relatedIds.relatedCustomerId = obj.customer;
    }
  }
  
  return relatedIds;
};

webhookEventSchema.statics.getUnprocessedEvents = async function(options = {}) {
  const { limit = 50, source, type } = options;
  
  const query = { processed: false };
  if (source) query.source = source;
  if (type) query.type = type;
  
  return await this.find(query)
    .sort({ createdAt: 1 }) // Process oldest first
    .limit(limit);
};

webhookEventSchema.statics.getEventByStripeId = async function(stripeEventId) {
  return await this.findOne({ stripeEventId });
};

webhookEventSchema.statics.getFailedEvents = async function(options = {}) {
  const { limit = 20 } = options;
  
  return await this.find({
    processed: false,
    processingAttempts: { $gte: 1 }
  })
    .sort({ lastProcessingAttempt: -1 })
    .limit(limit);
};

const WebhookEvent = mongoose.model("WebhookEvent", webhookEventSchema);

module.exports = {
  WebhookEvent,
  webhookEventSchema
};