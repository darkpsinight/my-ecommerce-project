const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Transaction schema for tracking all wallet operations
const transactionSchema = new mongoose.Schema({
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
    required: [true, "Wallet ID is required"],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
    index: true
  },
  type: {
    type: String,
    enum: ["funding", "purchase", "refund", "withdrawal"],
    required: [true, "Transaction type is required"],
    index: true
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0.01, "Amount must be at least 0.01"]
  },
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP"]
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled", "refunded"],
    default: "pending",
    index: true
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true
  },
  // Payment provider details
  paymentProvider: {
    type: String,
    enum: ["stripe", "paypal", "manual"],
    default: "stripe"
  },
  paymentIntentId: {
    type: String, // Stripe Payment Intent ID
    index: true
  },
  paymentMethodId: {
    type: String // Stripe Payment Method ID
  },
  // Reference to related entities
  relatedOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order" // For purchase transactions
  },
  relatedListingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing" // For purchase transactions
  },
  // Balance tracking
  balanceBefore: {
    type: Number,
    required: [true, "Balance before transaction is required"]
  },
  balanceAfter: {
    type: Number,
    required: [true, "Balance after transaction is required"]
  },
  // Metadata for additional information
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // External tracking
  externalId: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4,
    index: true
  },
  // Error tracking
  errorMessage: {
    type: String
  },
  retryCount: {
    type: Number,
    default: 0
  },
  // Timestamps
  processedAt: {
    type: Date
  },
  failedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create compound indexes for efficient queries
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, status: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ walletId: 1, createdAt: -1 });
transactionSchema.index({ paymentIntentId: 1 });

// Instance methods
transactionSchema.methods.markAsCompleted = function() {
  this.status = "completed";
  this.processedAt = new Date();
  return this.save();
};

transactionSchema.methods.markAsFailed = function(errorMessage) {
  this.status = "failed";
  this.failedAt = new Date();
  this.errorMessage = errorMessage;
  return this.save();
};

transactionSchema.methods.markAsCancelled = function() {
  this.status = "cancelled";
  this.processedAt = new Date();
  return this.save();
};

// Static methods
transactionSchema.statics.createFundingTransaction = async function(data) {
  const { walletId, userId, amount, currency, paymentIntentId, balanceBefore } = data;
  
  const transaction = new this({
    walletId,
    userId,
    type: "funding",
    amount,
    currency,
    status: "pending",
    description: `Wallet funding of ${amount} ${currency}`,
    paymentProvider: "stripe",
    paymentIntentId,
    balanceBefore,
    balanceAfter: balanceBefore + amount,
    externalId: uuidv4()
  });
  
  return await transaction.save();
};

transactionSchema.statics.createPurchaseTransaction = async function(data) {
  const { walletId, userId, amount, currency, relatedOrderId, relatedListingId, balanceBefore } = data;
  
  const transaction = new this({
    walletId,
    userId,
    type: "purchase",
    amount,
    currency,
    status: "completed",
    description: `Purchase transaction of ${amount} ${currency}`,
    paymentProvider: "manual", // Internal wallet transaction
    relatedOrderId,
    relatedListingId,
    balanceBefore,
    balanceAfter: balanceBefore - amount,
    processedAt: new Date(),
    externalId: uuidv4()
  });
  
  return await transaction.save();
};

transactionSchema.statics.getTransactionsByUserId = async function(userId, options = {}) {
  const { page = 1, limit = 20, type, status } = options;
  const skip = (page - 1) * limit;
  
  const query = { userId };
  if (type) query.type = type;
  if (status) query.status = status;
  
  return await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('walletId', 'balance currency')
    .lean();
};

transactionSchema.statics.getTransactionByPaymentIntent = async function(paymentIntentId) {
  return await this.findOne({ paymentIntentId });
};

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = {
  Transaction,
  transactionSchema
};
