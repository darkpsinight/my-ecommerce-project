const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const ledgerEntrySchema = new mongoose.Schema({
  // Core identifier
  user_uid: {
    type: String,
    required: [true, "User UID is required"],
    index: true
    // references User.uid, or 'PLATFORM' for platform entries
  },

  // Role of the entity in this transaction
  role: {
    type: String,
    enum: ["seller", "buyer", "platform"],
    required: true,
    index: true
  },

  // Type of ledger operation (Strictly defined)
  type: {
    type: String,
    enum: [
      "payment_capture", // Initial capture of funds (Platform credit)
      "escrow_lock",     // Funds locked for seller (Seller credit, locked)
      "escrow_release",  // Funds released to seller (Seller locked->available transition)
      "refund",          // Money returned to buyer
      "payout",          // Money sent out to external bank
      "escrow_reversal", // Pre-payout refund (Locked -> Finalized Reversal)
      "seller_reversal", // Post-payout refund (Available -> Debt)
      "dispute_open",    // Notification only
      "dispute_won",     // Notification only
      "dispute_lost",    // Notification only
      // Step 6: Payout Eligibility
      "escrow_release_debit",  // Debit from Locked (-X)
      "escrow_release_credit", // Credit to Available (+X)
      // Step 7: Payout Execution Hardening
      "payout_reservation",    // Debit from Available (-X) [Phase 1]
      "payout_fail_reversal",   // Credit to Available (+X) [Rollback]
      "payout_reservation_release" // Release of Reservation Marker (0) [Step 11]
    ],
    required: true,
    index: true
  },

  // Monetary Value
  // Signed integer: Positive (+) = Credit, Negative (-) = Debit
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value"
    }
  },

  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP"],
    required: true
  },

  // State of the funds
  status: {
    type: String,
    enum: [
      "locked",    // Held in escrow, not withdrawable
      "available", // Eligible for payout/usage
      "settled"    // Final state (e.g., paid out or platform revenue secured)
    ],
    required: true,
    index: true
  },

  // Relationships
  related_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    index: true
  },

  related_payment_intent_id: {
    type: String,
    index: true
  },

  // Metadata & Tracking
  description: {
    type: String,
    required: true
  },

  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Immutability enforcement (via unique ID and external ID)
  externalId: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4,
    index: true
  }
}, {
  timestamps: true,
  immutable: true // Mongoose level hint, though we enforce via application logic mostly
});

// Compound Indexes for frequent access patterns
ledgerEntrySchema.index({ user_uid: 1, status: 1 }); // Get user's available balance
ledgerEntrySchema.index({ user_uid: 1, type: 1 });   // Audit log filter
ledgerEntrySchema.index({ related_order_id: 1, type: 1 }); // Order history

// Prevent updates to existing documents - Append Only!
ledgerEntrySchema.pre('save', function (next) {
  if (!this.isNew) {
    const err = new Error('LedgerEntry documents are immutable and cannot be modified.');
    next(err);
  } else {
    next();
  }
});

const LedgerEntry = mongoose.model("LedgerEntry", ledgerEntrySchema);

module.exports = {
  LedgerEntry
};
