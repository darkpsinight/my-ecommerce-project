const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Order schema for tracking digital code purchases
const orderSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Buyer ID is required"],
    index: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Seller ID is required"],
    index: true
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: [true, "Listing ID is required"],
    index: true
  },
  // Order details
  orderItems: [{
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true
    },
    title: {
      type: String,
      required: true
    },
    platform: {
      type: String,
      required: true
    },
    region: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    // The purchased codes
    purchasedCodes: [{
      codeId: {
        type: String,
        required: true
      },
      code: {
        type: String,
        required: true,
        select: false // Encrypted code, only shown to buyer
      },
      iv: {
        type: String,
        required: true,
        select: false
      },
      expirationDate: {
        type: Date
      },
      deliveredAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  // Payment details
  totalAmount: {
    type: Number,
    required: [true, "Total amount is required"],
    min: 0
  },
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP"]
  },
  paymentMethod: {
    type: String,
    enum: ["stripe", "wallet"],
    required: true
  },
  paymentIntentId: {
    type: String, // Stripe Payment Intent ID
    index: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction"
  },
  // Order status
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed", "refunded", "cancelled"],
    default: "pending",
    index: true
  },
  // Delivery status
  deliveryStatus: {
    type: String,
    enum: ["pending", "delivered", "failed"],
    default: "pending",
    index: true
  },
  deliveredAt: {
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
  // Error tracking
  errorMessage: {
    type: String
  },
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Timestamps
  processedAt: {
    type: Date
  },
  failedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
orderSchema.index({ buyerId: 1, status: 1 });
orderSchema.index({ sellerId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ deliveryStatus: 1, createdAt: -1 });

// Static method to create a new order
orderSchema.statics.createOrder = async function(orderData) {
  const {
    buyerId,
    sellerId,
    orderItems,
    totalAmount,
    currency = "USD",
    paymentMethod,
    paymentIntentId,
    transactionId
  } = orderData;

  const order = new this({
    buyerId,
    sellerId,
    orderItems,
    totalAmount,
    currency,
    paymentMethod,
    paymentIntentId,
    transactionId,
    status: "pending",
    deliveryStatus: "pending",
    externalId: uuidv4()
  });

  return await order.save();
};

// Instance method to mark order as completed
orderSchema.methods.markAsCompleted = async function() {
  this.status = "completed";
  this.deliveryStatus = "delivered";
  this.deliveredAt = new Date();
  this.processedAt = new Date();
  return await this.save();
};

// Instance method to mark order as failed
orderSchema.methods.markAsFailed = async function(errorMessage) {
  this.status = "failed";
  this.deliveryStatus = "failed";
  this.errorMessage = errorMessage;
  this.failedAt = new Date();
  return await this.save();
};

// Instance method to get buyer-safe order data (with decrypted codes)
orderSchema.methods.getBuyerOrderData = function() {
  const orderData = this.toObject();
  
  // Remove sensitive seller information
  delete orderData.sellerId;
  
  return orderData;
};

// Instance method to get seller-safe order data (without codes)
orderSchema.methods.getSellerOrderData = function() {
  const orderData = this.toObject();
  
  // Remove buyer information and codes
  delete orderData.buyerId;
  
  // Remove actual codes from order items
  if (orderData.orderItems) {
    orderData.orderItems.forEach(item => {
      if (item.purchasedCodes) {
        item.purchasedCodes = item.purchasedCodes.map(code => ({
          codeId: code.codeId,
          expirationDate: code.expirationDate,
          deliveredAt: code.deliveredAt
          // Remove actual code and iv
        }));
      }
    });
  }
  
  return orderData;
};

// Static method to get orders by buyer
orderSchema.statics.getOrdersByBuyer = async function(buyerId, options = {}) {
  const {
    page = 1,
    limit = 10,
    status,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = options;

  const query = { buyerId };
  if (status) {
    query.status = status;
  }

  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const skip = (page - 1) * limit;

  const orders = await this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate("listingId", "title platform region")
    .select("+orderItems.purchasedCodes.code +orderItems.purchasedCodes.iv");

  const total = await this.countDocuments(query);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get orders by seller
orderSchema.statics.getOrdersBySeller = async function(sellerId, options = {}) {
  const {
    page = 1,
    limit = 10,
    status,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = options;

  const query = { sellerId };
  if (status) {
    query.status = status;
  }

  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const skip = (page - 1) * limit;

  const orders = await this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate("listingId", "title platform region")
    .populate("buyerId", "email"); // Only email for seller

  const total = await this.countDocuments(query);

  return {
    orders: orders.map(order => order.getSellerOrderData()),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const Order = mongoose.model("Order", orderSchema);

module.exports = {
  Order
};
