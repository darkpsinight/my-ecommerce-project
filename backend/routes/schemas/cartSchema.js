const { responseErrors } = require("./common");

const cartItemSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    listingId: { type: "string" },
    title: { type: "string" },
    price: { type: "number", minimum: 0 },
    discountedPrice: { type: "number", minimum: 0 },
    quantity: { type: "integer", minimum: 1 },
    imgs: {
      type: "object",
      properties: {
        thumbnails: {
          type: "array",
          items: { type: "string" }
        },
        previews: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    sellerId: { type: "string" },
    sellerName: { type: "string" },
    availableStock: { type: "integer", minimum: 0 },
    listingSnapshot: {
      type: "object",
      properties: {
        category: { type: "string" },
        subcategory: { type: "string" },
        platform: { type: "string" },
        region: { type: "string" }
      }
    }
  },
  required: ["listingId", "title", "price", "discountedPrice", "sellerId"]
};

const cartSchema = {
  type: "object",
  properties: {
    userId: { type: "string" },
    items: {
      type: "array",
      items: cartItemSchema
    },
    totalAmount: { type: "number", minimum: 0 },
    totalItems: { type: "integer", minimum: 0 },
    lastUpdated: { type: "string", format: "date-time" },
    createdAt: { type: "string", format: "date-time" }
  }
};

const getCartSchema = {
  summary: "Get user's cart",
  description: "Retrieve the current user's shopping cart with all items",
  tags: ["Cart"],
  response: {
    200: {
      description: "Cart retrieved successfully",
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: cartSchema
      }
    },
    ...responseErrors
  }
};

const addToCartSchema = {
  summary: "Add item to cart",
  description: "Add a product to the user's shopping cart",
  tags: ["Cart"],
  body: {
    type: "object",
    required: ["listingId", "title", "price", "discountedPrice", "sellerId"],
    properties: {
      listingId: { 
        type: "string",
        description: "The listing ID to add to cart"
      },
      title: { 
        type: "string",
        description: "Product title"
      },
      price: { 
        type: "number",
        minimum: 0,
        description: "Original price"
      },
      discountedPrice: { 
        type: "number",
        minimum: 0,
        description: "Discounted price"
      },
      quantity: { 
        type: "integer",
        minimum: 1,
        default: 1,
        description: "Quantity to add"
      },
      imgs: {
        type: "object",
        properties: {
          previews: {
            type: "array",
            items: { type: "string" }
          }
        }
      },
      sellerId: { 
        type: "string",
        description: "Seller ID"
      },
      listingSnapshot: {
        type: "object",
        properties: {
          category: { type: "string" },
          subcategory: { type: "string" },
          platform: { type: "string" },
          region: { type: "string" }
        }
      }
    }
  },
  response: {
    200: {
      description: "Item added to cart successfully",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: cartSchema
      }
    },
    ...responseErrors
  }
};

const updateCartItemSchema = {
  summary: "Update cart item quantity",
  description: "Update the quantity of an item in the user's cart",
  tags: ["Cart"],
  body: {
    type: "object",
    required: ["listingId", "quantity"],
    properties: {
      listingId: { 
        type: "string",
        description: "The listing ID to update"
      },
      quantity: { 
        type: "integer",
        minimum: 0,
        description: "New quantity (0 will remove the item)"
      }
    }
  },
  response: {
    200: {
      description: "Cart item updated successfully",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: cartSchema
      }
    },
    ...responseErrors
  }
};

const removeFromCartSchema = {
  summary: "Remove item from cart",
  description: "Remove a specific item from the user's cart",
  tags: ["Cart"],
  body: {
    type: "object",
    required: ["listingId"],
    properties: {
      listingId: { 
        type: "string",
        description: "The listing ID to remove from cart"
      }
    }
  },
  response: {
    200: {
      description: "Item removed from cart successfully",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: cartSchema
      }
    },
    ...responseErrors
  }
};

module.exports = {
  getCartSchema,
  addToCartSchema,
  updateCartItemSchema,
  removeFromCartSchema,
  cartSchema,
  cartItemSchema
};