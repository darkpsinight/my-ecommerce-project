const mongoose = require("mongoose");
const { multiplyCurrency, sumCurrency } = require("../utils/currency");

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
  // Store available stock at the time of adding to cart
  availableStock: {
    type: Number,
    default: 0,
  },
  // Snapshot of listing data to prevent issues if listing changes
  listingSnapshot: {
    category: String,
    subcategory: String,
    platform: String,
    region: String,
    // Add other critical listing fields that might affect pricing
  },
  // Expiration group-based quantities
  expirationGroups: [{
    type: {
      type: String,
      enum: ["never_expires", "expires"],
      required: true
    },
    count: {
      type: Number,
      required: true,
      min: 1
    },
    date: {
      type: Date
      // Only present for "expires" type
    }
  }],
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
  const itemTotals = this.items.map(item => multiplyCurrency(item.discountedPrice, item.quantity));
  return sumCurrency(itemTotals);
};

cartSchema.methods.getTotalItems = function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
};

cartSchema.methods.addItem = function(itemData) {
  const existingItemIndex = this.items.findIndex(
    item => item.listingId === itemData.listingId
  );

  if (existingItemIndex > -1) {
    // Update existing item
    const existingItem = this.items[existingItemIndex];
    
    if (itemData.expirationGroups && itemData.expirationGroups.length > 0) {
      // Handle expiration group-based addition
      if (!existingItem.expirationGroups) {
        existingItem.expirationGroups = [];
      }
      
      // Merge expiration groups
      itemData.expirationGroups.forEach(newGroup => {
        const existingGroupIndex = existingItem.expirationGroups.findIndex(
          g => g.type === newGroup.type && 
               (g.type === "never_expires" || 
                (g.date && newGroup.date && new Date(g.date).getTime() === new Date(newGroup.date).getTime()))
        );
        
        if (existingGroupIndex > -1) {
          existingItem.expirationGroups[existingGroupIndex].count += newGroup.count;
        } else {
          existingItem.expirationGroups.push({ ...newGroup });
        }
      });
      
      // Recalculate total quantity
      existingItem.quantity = existingItem.expirationGroups.reduce((sum, group) => sum + group.count, 0);
    } else {
      // Traditional quantity-based addition
      existingItem.quantity += itemData.quantity || 1;
    }
    
    // Update available stock info when adding more of existing item
    if (itemData.availableStock !== undefined) {
      existingItem.availableStock = itemData.availableStock;
    }
  } else {
    // Add new item
    const newItem = {
      listingId: itemData.listingId, // External UUID
      listingObjectId: itemData.listingObjectId, // MongoDB ObjectId
      title: itemData.title,
      price: itemData.price,
      discountedPrice: itemData.discountedPrice,
      quantity: itemData.quantity || 1,
      imgs: itemData.imgs || { thumbnails: [], previews: [] },
      sellerId: itemData.sellerId,
      availableStock: itemData.availableStock || 0,
      listingSnapshot: itemData.listingSnapshot || {},
    };
    
    // Add expiration groups if provided
    if (itemData.expirationGroups && itemData.expirationGroups.length > 0) {
      newItem.expirationGroups = itemData.expirationGroups.map(group => ({ ...group }));
      // Ensure quantity matches total from groups
      newItem.quantity = newItem.expirationGroups.reduce((sum, group) => sum + group.count, 0);
    }
    
    this.items.push(newItem);
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