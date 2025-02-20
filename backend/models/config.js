const mongoose = require("mongoose");

const configSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "email",
        "security",
        "application",
        "authentication",
        "rate_limiting",
        "oauth",
        "system",
      ],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastModifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
configSchema.index({ key: 1 });
configSchema.index({ category: 1 });

const Config = mongoose.model("Config", configSchema);

module.exports = {
  Config,
};
