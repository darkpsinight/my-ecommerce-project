const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Payment Operation schema for tracking all Stripe Connect operations
const paymentOperationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["charge", "transfer", "refund", "topup", "payout"],
    required: [true, "Operation type is required"],
    index: true
  },
  stripeId: {
    type: String,
    required: [true, "Stripe ID is required"],
    unique: true,
    index: true
  },
  // Amount details
  amountCents: {
    type: Number,
    required: [true, "Amount in cents is required"],
    min: [1, "Amount must be at least 1 cent"]
  },
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP"]
  },
  // Status tracking
  status: {
    type: String,
    enum: ["pending", "succeeded", "failed", "canceled", "requires_action"],
    default: "pending",
    index: true
  },
  // Related entities
  userId: {
    type: String, // UID string
    ref: "User",
    index: true
  },
  sellerId: {
    type: String, // UID string
    ref: "User",
    index: true
  },
  escrowId: {
    type: String,
    ref: "Order", // Will be used for escrow tracking
    index: true
  },
  stripeAccountId: {
    type: String, // For Connect account operations
    index: true
  },
  // Payment details
  paymentIntentId: {
    type: String,
    index: true
  },
  transferId: {
    type: String,
    index: true
  },
  refundId: {
    type: String,
    index: true
  },
  // Fees and calculations
  platformFeeCents: {
    type: Number,
    default: 0,
    min: 0
  },
  stripeFeeCents: {
    type: Number,
    default: 0,
    min: 0
  },
  netAmountCents: {
    type: Number,
    min: 0
  },
  // Idempotency and tracking
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4,
    index: true
  },
  externalId: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4,
    index: true
  },
  // Metadata and context
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  description: {
    type: String,
    required: true
  },
  // Error tracking
  errorCode: {
    type: String
  },
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

// Compound indexes for efficient queries
paymentOperationSchema.index({ userId: 1, type: 1 });
paymentOperationSchema.index({ sellerId: 1, type: 1 });
paymentOperationSchema.index({ status: 1, createdAt: -1 });
paymentOperationSchema.index({ type: 1, status: 1 });

// Instance methods
paymentOperationSchema.methods.markAsSucceeded = function (stripeObject = {}) {
  this.status = "succeeded";
  this.processedAt = new Date();

  // Update fees if available from Stripe object
  if (stripeObject.charges && stripeObject.charges.data[0]) {
    const charge = stripeObject.charges.data[0];
    if (charge.balance_transaction) {
      this.stripeFeeCents = charge.balance_transaction.fee || 0;
      this.netAmountCents = charge.balance_transaction.net || this.amountCents;
    }
  }

  return this.save();
};

paymentOperationSchema.methods.markAsFailed = function (errorCode, errorMessage) {
  this.status = "failed";
  this.failedAt = new Date();
  this.errorCode = errorCode;
  this.errorMessage = errorMessage;
  this.retryCount += 1;

  return this.save();
};

paymentOperationSchema.methods.markAsCanceled = function () {
  this.status = "canceled";
  this.processedAt = new Date();

  return this.save();
};

// Static methods
paymentOperationSchema.statics.createCharge = async function (data) {
  const {
    stripeId,
    amountCents,
    currency,
    userId,
    escrowId,
    description,
    metadata = {}
  } = data;

  const operation = new this({
    type: "charge",
    stripeId,
    amountCents,
    currency,
    userId,
    escrowId,
    description,
    metadata,
    idempotencyKey: uuidv4(),
    externalId: uuidv4()
  });

  return await operation.save();
};

paymentOperationSchema.statics.createTransfer = async function (data) {
  const {
    stripeId,
    amountCents,
    currency,
    sellerId,
    stripeAccountId,
    escrowId,
    platformFeeCents,
    description,
    metadata = {}
  } = data;

  const operation = new this({
    type: "transfer",
    stripeId,
    amountCents,
    currency,
    sellerId,
    stripeAccountId,
    escrowId,
    platformFeeCents,
    netAmountCents: amountCents - platformFeeCents,
    description,
    metadata,
    idempotencyKey: uuidv4(),
    externalId: uuidv4()
  });

  return await operation.save();
};

paymentOperationSchema.statics.createRefund = async function (data) {
  const {
    stripeId,
    amountCents,
    currency,
    userId,
    paymentIntentId,
    description,
    metadata = {}
  } = data;

  const operation = new this({
    type: "refund",
    stripeId,
    amountCents,
    currency,
    userId,
    paymentIntentId,
    description,
    metadata,
    idempotencyKey: uuidv4(),
    externalId: uuidv4()
  });

  return await operation.save();
};

paymentOperationSchema.statics.getByStripeId = async function (stripeId) {
  return await this.findOne({ stripeId });
};

paymentOperationSchema.statics.getOperationsByUser = async function (userId, options = {}) {
  const { page = 1, limit = 20, type, status } = options;
  const skip = (page - 1) * limit;

  const query = { userId };
  if (type) query.type = type;
  if (status) query.status = status;

  return await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

const PaymentOperation = mongoose.model("PaymentOperation", paymentOperationSchema);

module.exports = {
  PaymentOperation,
  paymentOperationSchema
};