const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Order schema for tracking digital code purchases
const orderSchema = new mongoose.Schema({
  buyerId: {
    type: String, // UID string
    ref: "User",
    required: [true, "Buyer ID is required"],
    index: true
  },
  sellerId: {
    type: String, // UID string
    ref: "User",
    required: [true, "Seller ID is required"],
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
    expirationGroups: [{
      type: { type: String, required: true },
      date: { type: Date },
      count: { type: Number, required: true }
    }],
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

  // Customer Geographic Data
  customerLocation: {
    ipAddress: {
      type: String,
      required: false
    },
    country: {
      type: String,
      required: false
    },
    countryCode: {
      type: String,
      required: false
    },
    region: {
      type: String,
      required: false
    },
    city: {
      type: String,
      required: false
    },
    latitude: {
      type: Number,
      required: false
    },
    longitude: {
      type: Number,
      required: false
    },
    timezone: {
      type: String,
      required: false
    }
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
  // Group ID for multi-seller checkout sessions
  checkoutGroupId: {
    type: String,
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
  },
  // Escrow Status
  escrowStatus: {
    type: String,
    enum: ["held", "released", "refunded"],
    default: "held", // Default to held for new orders via Stripe
    index: true
  },
  escrowHeldAt: {
    type: Date
  },
  escrowReleasedAt: {
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
orderSchema.statics.createOrder = async function (orderData) {
  const {
    buyerId,
    sellerId,
    orderItems,
    totalAmount,
    currency = "USD",
    paymentMethod,
    paymentIntentId,
    transactionId,
    customerLocation
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
    customerLocation,
    status: "pending",
    deliveryStatus: "pending",
    externalId: uuidv4()
  });

  return await order.save();
};

// Instance method to mark order as completed
orderSchema.methods.markAsCompleted = async function () {
  this.status = "completed";
  this.deliveryStatus = "delivered";
  this.deliveredAt = new Date();
  this.processedAt = new Date();
  return await this.save();
};

// Instance method to mark order as failed
orderSchema.methods.markAsFailed = async function (errorMessage) {
  this.status = "failed";
  this.deliveryStatus = "failed";
  this.errorMessage = errorMessage;
  this.failedAt = new Date();
  return await this.save();
};

// Instance method to get buyer-safe order data (without codes for orders page)
orderSchema.methods.getBuyerOrderData = function () {
  const orderData = this.toObject();

  // Remove internal MongoDB ID
  delete orderData._id;
  delete orderData.__v;

  // Process order items to include listing details
  if (orderData.orderItems) {
    orderData.orderItems.forEach((item, index) => {
      // Remove purchased codes from order items for security
      if (item.purchasedCodes) {
        delete item.purchasedCodes;
      }

      // Keep listing information for buyer to see (safe fields only)
      if (item.listingId && typeof item.listingId === 'object') {
        item.listing = {
          _id: item.listingId._id,
          title: item.listingId.title,
          platform: item.listingId.platform,
          region: item.listingId.region,
          description: item.listingId.description,
          thumbnailUrl: item.listingId.thumbnailUrl
        };
        delete item.listingId;
      }
    });
  }

  // Keep seller information for buyer to see (safe fields only)
  if (orderData.sellerId && typeof orderData.sellerId === 'object') {
    orderData.seller = {
      name: orderData.sellerId.name
      // Email removed for privacy/security
    };
    delete orderData.sellerId;
  } else if (orderData.sellerId && typeof orderData.sellerId === 'string') {
    // sellerId is a uid string, remove it (seller data added manually in static method)
    delete orderData.sellerId;
  }

  return orderData;
};

// Instance method to get seller-safe order data (without codes)
orderSchema.methods.getSellerOrderData = function () {
  const orderData = this.toObject();

  // Remove buyer information, codes, and internal MongoDB ID
  delete orderData.buyerId;
  delete orderData._id;
  delete orderData.__v;

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
orderSchema.statics.getOrdersByBuyer = async function (buyerId, options = {}) {
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
    .populate("orderItems.listingId", "title platform region description thumbnailUrl")
    .select("+orderItems.purchasedCodes.code +orderItems.purchasedCodes.iv");

  const total = await this.countDocuments(query);

  // Get unique seller UIDs from orders
  const sellerUids = [...new Set(orders.map(order => order.sellerId))];

  // Fetch seller data manually using uid
  const User = mongoose.model("User");
  const sellers = await User.find({ uid: { $in: sellerUids } }).select("uid name");

  // Create a map of sellerUid -> seller data for quick lookup
  const sellerMap = {};
  sellers.forEach(seller => {
    sellerMap[seller.uid] = {
      name: seller.name
    };
  });

  const processedOrders = orders.map(order => {
    const processed = order.getBuyerOrderData();
    // Add seller info from the map
    if (order.sellerId && sellerMap[order.sellerId]) {
      processed.seller = sellerMap[order.sellerId];
    }
    return processed;
  });

  const finalResult = {
    orders: processedOrders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };

  return finalResult;
};

// Static method to get orders by seller
orderSchema.statics.getOrdersBySeller = async function (sellerId, options = {}) {
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
    .populate("orderItems.listingId", "title platform region");

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
