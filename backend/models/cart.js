const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  listingId: {
    type: String,
    required: true,
    // Store the external UUID, not the MongoDB ObjectId
  },
  listingObjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    // This will be populated when needed for joins
  },
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  discountedPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  imgs: {
    thumbnails: {
      type: [String],
      default: [],
    },
    previews: {
      type: [String],
      default: [],
    },
  },
  // Store seller info for quick access without populating
  sellerId: {
    type: String,
    required: true,
  },
  // Snapshot of listing data to prevent issues if listing changes
  listingSnapshot: {
    category: String,
    subcategory: String,
    platform: String,
    region: String,
    // Add other critical listing fields that might affect pricing
  },
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true, // Each user has only one cart
  },
  items: [cartItemSchema],
  // Track when cart was last updated for cleanup purposes
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  // Optional: Track cart creation for analytics
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Update lastUpdated on save
cartSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Index for efficient queries
cartSchema.index({ userId: 1 });
cartSchema.index({ lastUpdated: 1 }); // For cleanup operations
cartSchema.index({ 'items.listingId': 1 }); // For checking item availability

// Instance methods
cartSchema.methods.getTotalAmount = function() {
  return this.items.reduce((total, item) => {
    return total + (item.discountedPrice * item.quantity);
  }, 0);
};

cartSchema.methods.getTotalItems = function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
};

cartSchema.methods.addItem = function(itemData) {
  const existingItemIndex = this.items.findIndex(
    item => item.listingId === itemData.listingId
  );

  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += itemData.quantity || 1;
  } else {
    // Add new item
    this.items.push({
      listingId: itemData.listingId, // External UUID
      listingObjectId: itemData.listingObjectId, // MongoDB ObjectId
      title: itemData.title,
      price: itemData.price,
      discountedPrice: itemData.discountedPrice,
      quantity: itemData.quantity || 1,
      imgs: itemData.imgs || { thumbnails: [], previews: [] },
      sellerId: itemData.sellerId,
      listingSnapshot: itemData.listingSnapshot || {},
    });
  }
};

cartSchema.methods.removeItem = function(listingId) {
  this.items = this.items.filter(
    item => item.listingId !== listingId
  );
};

cartSchema.methods.updateItemQuantity = function(listingId, quantity) {
  const item = this.items.find(
    item => item.listingId === listingId
  );
  if (item) {
    if (quantity <= 0) {
      this.removeItem(listingId);
    } else {
      item.quantity = quantity;
    }
  }
};

cartSchema.methods.clearItems = function() {
  this.items = [];
};

// Static methods
cartSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

cartSchema.statics.createOrUpdate = async function(userId, operation, itemData) {
  let cart = await this.findByUserId(userId);
  
  if (!cart) {
    cart = new this({ userId, items: [] });
  }

  switch (operation) {
    case 'add':
      cart.addItem(itemData);
      break;
    case 'remove':
      cart.removeItem(itemData.listingId);
      break;
    case 'updateQuantity':
      cart.updateItemQuantity(itemData.listingId, itemData.quantity);
      break;
    case 'clear':
      cart.clearItems();
      break;
    default:
      throw new Error('Invalid cart operation');
  }

  return await cart.save();
};

const Cart = mongoose.model("Cart", cartSchema);

module.exports = {
  Cart,
};