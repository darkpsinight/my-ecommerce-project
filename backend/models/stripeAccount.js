const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Stripe Account schema for managing seller Connect accounts
const stripeAccountSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Seller ID is required"],
    unique: true,
    index: true
  },
  stripeAccountId: {
    type: String,
    required: [true, "Stripe account ID is required"],
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ["pending", "verified", "restricted", "rejected"],
    default: "pending",
    index: true
  },
  capabilities: [{
    type: String
  }],
  // Account details
  country: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP"]
  },
  // KYC and verification status
  detailsSubmitted: {
    type: Boolean,
    default: false
  },
  chargesEnabled: {
    type: Boolean,
    default: false
  },
  payoutsEnabled: {
    type: Boolean,
    default: false
  },
  // Requirements tracking
  currentlyDue: [{
    type: String
  }],
  eventuallyDue: [{
    type: String
  }],
  pastDue: [{
    type: String
  }],
  pendingVerification: [{
    type: String
  }],
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
  },
  // Migration tracking
  migrated: {
    type: Boolean,
    default: false
  },
  migratedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
stripeAccountSchema.index({ sellerId: 1 });
stripeAccountSchema.index({ stripeAccountId: 1 });
stripeAccountSchema.index({ status: 1 });
stripeAccountSchema.index({ migrated: 1 });

// Instance methods
stripeAccountSchema.methods.updateFromStripeAccount = function (stripeAccount) {
  this.status = stripeAccount.details_submitted ?
    (stripeAccount.charges_enabled && stripeAccount.payouts_enabled ? "verified" : "pending") :
    "pending";

  this.detailsSubmitted = stripeAccount.details_submitted;
  this.chargesEnabled = stripeAccount.charges_enabled;
  this.payoutsEnabled = stripeAccount.payouts_enabled;
  this.country = stripeAccount.country;
  this.currency = stripeAccount.default_currency ? stripeAccount.default_currency.toUpperCase() : "USD";

  if (stripeAccount.capabilities) {
    this.capabilities = Object.keys(stripeAccount.capabilities).filter(
      cap => stripeAccount.capabilities[cap] === "active"
    );
  }

  if (stripeAccount.requirements) {
    this.currentlyDue = stripeAccount.requirements.currently_due || [];
    this.eventuallyDue = stripeAccount.requirements.eventually_due || [];
    this.pastDue = stripeAccount.requirements.past_due || [];
    this.pendingVerification = stripeAccount.requirements.pending_verification || [];
  }

  return this.save();
};

stripeAccountSchema.methods.isFullyVerified = function () {
  return this.status === "verified" &&
    this.chargesEnabled &&
    this.payoutsEnabled &&
    this.currentlyDue.length === 0 &&
    this.pastDue.length === 0;
};

// Static methods
stripeAccountSchema.statics.createForSeller = async function (sellerId, stripeAccountId, country = "US") {
  const account = new this({
    sellerId,
    stripeAccountId,
    country,
    externalId: uuidv4()
  });

  return await account.save();
};

stripeAccountSchema.statics.getByStripeAccountId = async function (stripeAccountId) {
  return await this.findOne({ stripeAccountId });
};

stripeAccountSchema.statics.getBySellerId = async function (sellerId) {
  return await this.findOne({ sellerId });
};

const StripeAccount = mongoose.model("StripeAccount", stripeAccountSchema);

module.exports = {
  StripeAccount,
  stripeAccountSchema
};