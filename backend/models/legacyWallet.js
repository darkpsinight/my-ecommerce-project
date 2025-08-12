const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Legacy Wallet schema for preserving existing wallet balances during migration
const legacyWalletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
    unique: true,
    index: true
  },
  balanceCents: {
    type: Number,
    required: [true, "Balance in cents is required"],
    min: [0, "Balance cannot be negative"]
  },
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP"]
  },
  source: {
    type: String,
    enum: ["unified_stripe_dev", "unified_stripe_prod", "manual"],
    default: "unified_stripe_dev",
    index: true
  },
  // Migration tracking
  migrated: {
    type: Boolean,
    default: false,
    index: true
  },
  migratedAt: {
    type: Date
  },
  migratedToWalletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet"
  },
  // Original wallet data
  originalWalletData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Transaction history preservation
  totalFundedCents: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpentCents: {
    type: Number,
    default: 0,
    min: 0
  },
  lastFundedAt: {
    type: Date
  },
  lastSpentAt: {
    type: Date
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
legacyWalletSchema.index({ userId: 1 });
legacyWalletSchema.index({ migrated: 1 });
legacyWalletSchema.index({ source: 1 });

// Instance methods
legacyWalletSchema.methods.spendBalance = function(amountCents) {
  if (amountCents <= 0) {
    throw new Error("Amount must be positive");
  }
  
  if (this.balanceCents < amountCents) {
    throw new Error("Insufficient legacy wallet funds");
  }
  
  this.balanceCents -= amountCents;
  this.totalSpentCents += amountCents;
  this.lastSpentAt = new Date();
  
  return this.save();
};

legacyWalletSchema.methods.refundToBalance = function(amountCents) {
  if (amountCents <= 0) {
    throw new Error("Refund amount must be positive");
  }
  
  this.balanceCents += amountCents;
  // Don't update totalSpentCents for refunds
  
  return this.save();
};

legacyWalletSchema.methods.hasEnoughFunds = function(amountCents) {
  return this.balanceCents >= amountCents;
};

legacyWalletSchema.methods.markAsMigrated = function(newWalletId) {
  this.migrated = true;
  this.migratedAt = new Date();
  this.migratedToWalletId = newWalletId;
  
  return this.save();
};

// Static methods
legacyWalletSchema.statics.createFromWallet = async function(wallet, source = "unified_stripe_dev") {
  // Convert balance from dollars to cents
  const balanceCents = Math.round(wallet.balance * 100);
  const totalFundedCents = Math.round(wallet.totalFunded * 100);
  const totalSpentCents = Math.round(wallet.totalSpent * 100);
  
  const legacyWallet = new this({
    userId: wallet.userId,
    balanceCents,
    currency: wallet.currency,
    source,
    totalFundedCents,
    totalSpentCents,
    lastFundedAt: wallet.lastFundedAt,
    lastSpentAt: wallet.lastSpentAt,
    originalWalletData: wallet.toObject(),
    externalId: uuidv4()
  });
  
  return await legacyWallet.save();
};

legacyWalletSchema.statics.getByUserId = async function(userId) {
  return await this.findOne({ userId, migrated: false });
};

legacyWalletSchema.statics.getAllUnmigrated = async function(options = {}) {
  const { limit = 100, source } = options;
  
  const query = { migrated: false };
  if (source) query.source = source;
  
  return await this.find(query)
    .sort({ createdAt: 1 })
    .limit(limit);
};

legacyWalletSchema.statics.getTotalLegacyBalance = async function(source) {
  const pipeline = [
    { $match: { migrated: false, ...(source && { source }) } },
    { $group: { _id: null, totalBalance: { $sum: "$balanceCents" } } }
  ];
  
  const result = await this.aggregate(pipeline);
  return result.length > 0 ? result[0].totalBalance : 0;
};

legacyWalletSchema.statics.getMigrationStats = async function() {
  const [migrated, unmigrated] = await Promise.all([
    this.countDocuments({ migrated: true }),
    this.countDocuments({ migrated: false })
  ]);
  
  const totalLegacyBalance = await this.getTotalLegacyBalance();
  
  return {
    migrated,
    unmigrated,
    total: migrated + unmigrated,
    migrationProgress: migrated + unmigrated > 0 ? (migrated / (migrated + unmigrated)) * 100 : 0,
    totalLegacyBalanceCents: totalLegacyBalance
  };
};

const LegacyWallet = mongoose.model("LegacyWallet", legacyWalletSchema);

module.exports = {
  LegacyWallet,
  legacyWalletSchema
};