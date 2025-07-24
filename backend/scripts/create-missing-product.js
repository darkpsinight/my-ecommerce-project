/**
 * Script to create the missing product that exists on frontend but not in database
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce"
    );
    console.log("📦 Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

const { Listing } = require("../models/listing");
const { User } = require("../models/user");

async function createMissingProduct() {
  console.log("🔧 Creating Missing Product...\n");

  try {
    const productId = "5b27caae-954b-413a-887d-79729746e4ff";

    // Check if product already exists
    const existingProduct = await Listing.findOne({ externalId: productId });
    if (existingProduct) {
      console.log("✅ Product already exists:", existingProduct.title);
      return existingProduct;
    }

    // Find or create a seller
    let seller = await User.findOne({ roles: "seller" });
    if (!seller) {
      seller = new User({
        uid: "real-seller-uid",
        email: "real-seller@test.com",
        name: "Real Seller",
        displayName: "Real Seller",
        roles: ["seller"],
        isEmailConfirmed: true,
        isActive: true,
      });
      await seller.save();
      console.log("✅ Created seller user");
    } else {
      console.log("✅ Using existing seller:", seller.name);
    }

    // Find an existing category
    const { Category } = require("../models/category");
    let category = await Category.findOne({ isActive: true });
    if (!category) {
      // Create a simple category
      category = new Category({
        name: "Games",
        description: "Digital game codes",
        isActive: true,
        createdBy: seller._id,
      });
      await category.save();
      console.log("✅ Created Games category");
    } else {
      console.log("✅ Using existing category:", category.name);
    }

    // Create the missing product
    const newProduct = new Listing({
      title: "01/07/2025",
      description: "Steam game code for testing time tracking",
      price: 29.99,
      sellerId: seller.uid,
      externalId: productId,
      categoryId: category._id,
      platform: "Steam",
      region: "Global",
      status: "active",
      codes: [
        {
          code: "STEAM-CODE-123",
          hashCode: "hash_" + Date.now(),
          soldStatus: "active",
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    await newProduct.save();
    console.log("✅ Created missing product:", {
      id: newProduct.externalId,
      title: newProduct.title,
      sellerId: newProduct.sellerId,
      platform: newProduct.platform,
    });

    return newProduct;
  } catch (error) {
    console.error("❌ Failed to create product:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Main execution
async function main() {
  await connectDB();
  await createMissingProduct();
  await mongoose.connection.close();
  console.log("📦 Database connection closed");
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});

module.exports = { createMissingProduct };
