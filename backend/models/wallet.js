const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Wallet schema for managing user balances
const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: [0, "Balance cannot be negative"]
  },
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP"] // Add more currencies as needed
  },
  isActive: {
    type: Boolean,
    default: true
  },
  externalId: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4,
    index: true
  },
  // Track total amounts for analytics
  totalFunded: {
    type: Number,
    default: 0,
    min: [0, "Total funded cannot be negative"]
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: [0, "Total spent cannot be negative"]
  },
  lastFundedAt: {
    type: Date
  },
  lastSpentAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for performance
walletSchema.index({ userId: 1 });
walletSchema.index({ externalId: 1 });
walletSchema.index({ isActive: 1 });

// Instance methods
walletSchema.methods.addFunds = function(amount) {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  this.balance += amount;
  this.totalFunded += amount;
  this.lastFundedAt = new Date();

  return this.save();
};

walletSchema.methods.deductFunds = function(amount) {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  if (this.balance < amount) {
    throw new Error("Insufficient funds");
  }

  this.balance -= amount;
  this.totalSpent += amount;
  this.lastSpentAt = new Date();

  return this.save();
};

walletSchema.methods.hasEnoughFunds = function(amount) {
  return this.balance >= amount;
};

// Static methods
walletSchema.statics.createWalletForUser = async function(userId, currency = "USD") {
  try {
    // First check if wallet already exists
    const existingWallet = await this.findOne({ userId });
    if (existingWallet) {
      return existingWallet;
    }

    const wallet = new this({
      userId,
      currency,
      externalId: uuidv4()
    });

    const savedWallet = await wallet.save();
    return savedWallet;
  } catch (error) {
    if (error.code === 11000) {
      // Wallet already exists for this user, try to find it
      const existingWallet = await this.findOne({ userId });
      if (existingWallet) {
        return existingWallet;
      }
      // If we still can't find it, there might be a database issue
      throw new Error(`Wallet creation failed due to duplicate key error, but existing wallet not found for user ${userId}`);
    }
    throw error;
  }
};

walletSchema.statics.getWalletByUserId = async function(userId) {
  return await this.findOne({ userId, isActive: true });
};

walletSchema.statics.getWalletByExternalId = async function(externalId) {
  return await this.findOne({ externalId, isActive: true });
};

const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = {
  Wallet,
  walletSchema
};
