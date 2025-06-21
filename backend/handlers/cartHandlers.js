const { Cart } = require("../models/cart");
const { Listing } = require("../models/listing");
const { User } = require("../models/user");

/**
 * Get user's cart
 */
const getCart = async (request, reply) => {
  try {
    const userId = request.user.uid;
    
    let cart = await Cart.findByUserId(userId).populate({
      path: 'items.listingObjectId',
      select: 'title price discountedPrice imgs status isActive sellerId externalId codes',
      populate: {
        path: 'sellerId',
        select: 'name'
      }
    });

    if (!cart) {
      // Create empty cart if doesn't exist
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }

    // Filter out items where listing is no longer active or doesn't exist
    const validItems = cart.items.filter(item => {
      return item.listingObjectId && 
             item.listingObjectId.status === 'active';
    });

    // Update cart if items were filtered out
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    // Transform cart data for response
    const transformedCart = {
      userId: cart.userId,
      items: cart.items.map(item => ({
        id: item.listingId, // Use the external UUID
        listingId: item.listingId, // Use the external UUID
        title: item.title,
        price: item.price,
        discountedPrice: item.discountedPrice,
        quantity: item.quantity,
        imgs: item.imgs,
        sellerId: item.sellerId,
        sellerName: item.listingObjectId?.sellerId?.name || 'Unknown Seller',
        listingSnapshot: item.listingSnapshot,
        // Use stored available stock information, fallback to listing's current stock
        availableStock: item.availableStock !== undefined ? item.availableStock : 
                       (item.listingObjectId ? item.listingObjectId.getAvailableCodesCount() : 0)
      })),
      totalAmount: cart.getTotalAmount(),
      totalItems: cart.getTotalItems(),
      lastUpdated: cart.lastUpdated,
      createdAt: cart.createdAt
    };

    return reply.code(200).send({
      success: true,
      data: transformedCart
    });

  } catch (error) {
    console.error("Error fetching cart:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to fetch cart",
      error: error.message
    });
  }
};

/**
 * Add item to cart
 */
const addToCart = async (request, reply) => {
  try {
    const userId = request.user.uid;
    const { listingId, title, price, discountedPrice, quantity = 1, imgs, sellerId, listingSnapshot, availableStock } = request.body;

    // Verify listing exists and is active (need to select codes to check availability)
    const listing = await Listing.findOne({ externalId: listingId }).select("+codes");
    
    if (!listing || listing.status !== 'active') {
      return reply.code(400).send({
        success: false,
        message: "Product is not available"
      });
    }

    // Check if listing has available codes for the requested quantity
    if (!listing.hasAvailableCodes(quantity)) {
      return reply.code(400).send({
        success: false,
        message: "Insufficient stock available"
      });
    }

    // Verify seller exists
    const seller = await User.findOne({ uid: sellerId });
    if (!seller || !seller.roles.includes('seller')) {
      return reply.code(400).send({
        success: false,
        message: "Invalid seller"
      });
    }

    // Check if user is trying to add their own listing
    if (listing.sellerId.toString() === userId) {
      return reply.code(400).send({
        success: false,
        message: "You cannot add your own product to cart"
      });
    }

    // Add item to cart
    const cart = await Cart.createOrUpdate(userId, 'add', {
      listingId, // This is the external UUID
      listingObjectId: listing._id, // This is the MongoDB ObjectId for joins
      title,
      price,
      discountedPrice,
      quantity,
      imgs: imgs || { thumbnails: [], previews: [] },
      sellerId,
      availableStock: availableStock || listing.getAvailableCodesCount(), // Use provided stock or get from listing
      listingSnapshot: listingSnapshot || {
        category: listing.category,
        subcategory: listing.subcategory,
        platform: listing.platform,
        region: listing.region
      }
    });

    // Populate the updated cart for response
    await cart.populate({
      path: 'items.listingObjectId',
      select: 'title price discountedPrice imgs status isActive sellerId externalId codes'
    });

    const transformedCart = {
      userId: cart.userId,
      items: cart.items.map(item => ({
        id: item.listingId, // Use the external UUID
        listingId: item.listingId, // Use the external UUID
        title: item.title,
        price: item.price,
        discountedPrice: item.discountedPrice,
        quantity: item.quantity,
        imgs: item.imgs,
        sellerId: item.sellerId,
        listingSnapshot: item.listingSnapshot,
        // Use stored available stock information, fallback to listing's current stock
        availableStock: item.availableStock !== undefined ? item.availableStock : 
                       (item.listingObjectId ? item.listingObjectId.getAvailableCodesCount() : 0)
      })),
      totalAmount: cart.getTotalAmount(),
      totalItems: cart.getTotalItems(),
      lastUpdated: cart.lastUpdated,
      createdAt: cart.createdAt
    };

    return reply.code(200).send({
      success: true,
      message: "Item added to cart successfully",
      data: transformedCart
    });

  } catch (error) {
    console.error("Error adding to cart:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to add item to cart",
      error: error.message
    });
  }
};

/**
 * Update cart item quantity
 */
const updateCartItem = async (request, reply) => {
  try {
    const userId = request.user.uid;
    const { listingId, quantity } = request.body;

    // Validate quantity is positive integer
    if (quantity < 0 || !Number.isInteger(quantity)) {
      return reply.code(400).send({
        success: false,
        message: "Quantity must be a positive integer"
      });
    }

    // If quantity > 0, validate against available stock
    if (quantity > 0) {
      const listing = await Listing.findOne({ externalId: listingId }).select("+codes");
      
      if (!listing || listing.status !== 'active') {
        return reply.code(400).send({
          success: false,
          message: "Product is not available"
        });
      }

      // Check if listing has available codes for the requested quantity
      if (!listing.hasAvailableCodes(quantity)) {
        const availableCount = listing.getAvailableCodesCount();
        return reply.code(400).send({
          success: false,
          message: `Only ${availableCount} codes available for this product`
        });
      }
    }

    const cart = await Cart.createOrUpdate(userId, 'updateQuantity', {
      listingId,
      quantity
    });

    // Populate the updated cart for response
    await cart.populate({
      path: 'items.listingObjectId',
      select: 'title price discountedPrice imgs status isActive sellerId externalId codes'
    });

    const transformedCart = {
      userId: cart.userId,
      items: cart.items.map(item => ({
        id: item.listingId, // Use the external UUID
        listingId: item.listingId, // Use the external UUID
        title: item.title,
        price: item.price,
        discountedPrice: item.discountedPrice,
        quantity: item.quantity,
        imgs: item.imgs,
        sellerId: item.sellerId,
        listingSnapshot: item.listingSnapshot,
        // Use stored available stock information, fallback to listing's current stock
        availableStock: item.availableStock !== undefined ? item.availableStock : 
                       (item.listingObjectId ? item.listingObjectId.getAvailableCodesCount() : 0)
      })),
      totalAmount: cart.getTotalAmount(),
      totalItems: cart.getTotalItems(),
      lastUpdated: cart.lastUpdated,
      createdAt: cart.createdAt
    };

    return reply.code(200).send({
      success: true,
      message: quantity > 0 ? "Cart item updated successfully" : "Item removed from cart",
      data: transformedCart
    });

  } catch (error) {
    console.error("Error updating cart item:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to update cart item",
      error: error.message
    });
  }
};

/**
 * Remove item from cart
 */
const removeFromCart = async (request, reply) => {
  try {
    const userId = request.user.uid;
    const { listingId } = request.body;

    const cart = await Cart.createOrUpdate(userId, 'remove', {
      listingId
    });

    // Populate the updated cart for response
    await cart.populate({
      path: 'items.listingObjectId',
      select: 'title price discountedPrice imgs status isActive sellerId externalId codes'
    });

    const transformedCart = {
      userId: cart.userId,
      items: cart.items.map(item => ({
        id: item.listingId, // Use the external UUID
        listingId: item.listingId, // Use the external UUID
        title: item.title,
        price: item.price,
        discountedPrice: item.discountedPrice,
        quantity: item.quantity,
        imgs: item.imgs,
        sellerId: item.sellerId,
        listingSnapshot: item.listingSnapshot,
        // Use stored available stock information, fallback to listing's current stock
        availableStock: item.availableStock !== undefined ? item.availableStock : 
                       (item.listingObjectId ? item.listingObjectId.getAvailableCodesCount() : 0)
      })),
      totalAmount: cart.getTotalAmount(),
      totalItems: cart.getTotalItems(),
      lastUpdated: cart.lastUpdated,
      createdAt: cart.createdAt
    };

    return reply.code(200).send({
      success: true,
      message: "Item removed from cart successfully",
      data: transformedCart
    });

  } catch (error) {
    console.error("Error removing from cart:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to remove item from cart",
      error: error.message
    });
  }
};

/**
 * Clear entire cart
 */
const clearCart = async (request, reply) => {
  try {
    const userId = request.user.uid;

    const cart = await Cart.createOrUpdate(userId, 'clear', {});

    const transformedCart = {
      userId: cart.userId,
      items: [],
      totalAmount: 0,
      totalItems: 0,
      lastUpdated: cart.lastUpdated,
      createdAt: cart.createdAt
    };

    return reply.code(200).send({
      success: true,
      message: "Cart cleared successfully",
      data: transformedCart
    });

  } catch (error) {
    console.error("Error clearing cart:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to clear cart",
      error: error.message
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};