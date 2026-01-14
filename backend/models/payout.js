const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const payoutSchema = new mongoose.Schema({
  // Payout Identifier
  payoutId: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4,
    index: true
  },

  // Targeted Order (One payout per order)
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: [true, "Order ID is required"],
    unique: true, // Ensures one payout per order
    index: true
  },

  // Recipient
  sellerId: {
    type: String, // UID
    required: [true, "Seller ID is required"],
    index: true
  },

  // Approver
  adminId: {
    type: String, // UID of the admin who approved/initiated it
    required: [true, "Admin ID is required"]
  },

  // Money
  amount: {
    type: Number, // Integer cents
    required: true,
    min: 1
  },

  currency: {
    type: String,
    required: true,
    uppercase: true
  },

  // External Reference
  stripeTransferId: {
    type: String,
    index: true
  },

  // State
  status: {
    type: String,
    enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"],
    default: "PENDING",
    required: true,
    index: true
  },

  // Step 7: Execution Hardening Fields
  reservedAt: {
    type: Date
  },
  processingAt: {
    type: Date
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true // Allow null for old records or pending ones if generated late
  },
  ledgerReservationId: {
    type: String // ID of the 'payout_reservation' ledger entry
  },

  failureReason: {
    type: String
  },
  failureCode: {
    type: String
  },

  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Retry Mechanism Fields
  retryAttemptCount: {
    type: Number,
    default: 0
  },

  payoutHistory: [{
    attemptAt: { type: Date, default: Date.now },
    adminId: { type: String },
    stripeTransferId: { type: String },
    failureReason: { type: String },
    status: { type: String }
  }]
}, {
  timestamps: true
});

// Indexes
payoutSchema.index({ sellerId: 1, status: 1 });
payoutSchema.index({ createdAt: -1 });

const Payout = mongoose.model("Payout", payoutSchema);

module.exports = {
  Payout
};
