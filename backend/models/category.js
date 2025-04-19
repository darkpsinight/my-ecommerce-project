const mongoose = require("mongoose");

// Schema for subcategories
const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    patterns: {
      type: [{
        regex: {
          type: String,
          trim: true,
          default: "" // Allow empty regex patterns
        },
        description: {
          type: String,
          trim: true
        },
        example: {
          type: String,
          trim: true
        },
        isActive: {
          type: Boolean,
          default: true
        }
      }],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { _id: false }
);

// Main category schema
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    platforms: {
      type: [subCategorySchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance
categorySchema.index({ name: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ createdAt: -1 });

const Category = mongoose.model("Category", categorySchema);

module.exports = {
  Category,
  categorySchema,
};
