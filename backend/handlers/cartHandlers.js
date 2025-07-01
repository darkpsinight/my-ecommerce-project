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
      select: 'title price discountedPrice imgs status isActive sellerId externalId +codes',
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
        availableStock: (() => {
          if (item.availableStock !== undefined) {
            return item.availableStock;
          }
          
          if (item.listingObjectId) {
            if (typeof item.listingObjectId.getAvailableCodesCount === 'function') {
              return item.listingObjectId.getAvailableCodesCount();
            }
            return 0;
          }
          
          return 0;
        })()
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
    let { listingId, title, price, discountedPrice, quantity = 1, imgs, sellerId, listingSnapshot, availableStock, expirationGroups } = request.body;

    // Verify listing exists and is active (need to select codes to check availability)
    const listing = await Listing.findOne({ externalId: listingId }).select("+codes");
    
    if (!listing || listing.status !== 'active') {
      return reply.code(400).send({
        success: false,
        message: "Product is not available"
      });
    }

    // Validate quantity based on expiration groups or total availability
    if (expirationGroups && expirationGroups.length > 0) {
      // Validate each expiration group
      try {
        const listingGroups = listing.getExpirationGroups();
        
        const groupsMap = new Map();
        
        // Create map with simplified approach - use the group object directly for matching
        listingGroups.forEach((g, index) => {
          // For never_expires, use type as key
          if (g.type === "never_expires") {
            groupsMap.set(g.type, g);
          } else if (g.type === "expires") {
            // For expires, use the exact date string as received from database
            const dateKey = g.date ? new Date(g.date).toISOString() : 'no-date';
            groupsMap.set(`expires_${dateKey}`, g);
          }

        });
        
        let totalRequestedQuantity = 0;
        
        for (const requestedGroup of expirationGroups) {
          if (!requestedGroup.type || !requestedGroup.count || requestedGroup.count <= 0) {
            return reply.code(400).send({
              success: false,
              message: "Invalid expiration group format. Each group must have 'type' and positive 'count'"
            });
          }
          
          // Create groupKey to match the internal grouping
          let groupKey;
          if (requestedGroup.type === "expires" && requestedGroup.date) {
            const dateObj = typeof requestedGroup.date === 'string' ? new Date(requestedGroup.date) : requestedGroup.date;
            groupKey = `expires_${dateObj.toISOString()}`;
          } else {
            groupKey = requestedGroup.type;
          }
          
          console.log(`Looking for group key: ${groupKey} for requested group:`, requestedGroup);
          console.log('Available group keys:', Array.from(groupsMap.keys()));
          
          const availableGroup = groupsMap.get(groupKey);
          
          if (!availableGroup) {
            // Try alternative matching approach for expires groups
            if (requestedGroup.type === "expires" && requestedGroup.date) {
              // Find a matching expires group by comparing dates
              let foundGroup = null;
              for (const [key, group] of groupsMap.entries()) {
                if (key.startsWith("expires_") && group.date) {
                  const groupDate = new Date(group.date).toISOString();
                  const requestedDate = new Date(requestedGroup.date).toISOString();
                  if (groupDate === requestedDate) {
                    foundGroup = group;
                    break;
                  }
                }
              }
              
              if (foundGroup) {
                console.log('Found matching group through alternative method:', foundGroup);
                // Use the found group for validation
                if (requestedGroup.count > foundGroup.quantity) {
                  return reply.code(400).send({
                    success: false,
                    message: `Insufficient stock in ${requestedGroup.type} group. Available: ${foundGroup.quantity}, Requested: ${requestedGroup.count}`
                  });
                }
                totalRequestedQuantity += requestedGroup.count;
                continue; // Skip the normal validation for this group
              }
            }
            
            return reply.code(400).send({
              success: false,
              message: `Expiration group ${requestedGroup.type}${requestedGroup.date ? ` (${requestedGroup.date})` : ''} not found`
            });
          }
          
          if (requestedGroup.count > availableGroup.quantity) {
            console.log(`Stock check failed: Requested ${requestedGroup.count}, Available ${availableGroup.quantity}`);
            return reply.code(400).send({
              success: false,
              message: `Insufficient stock in ${requestedGroup.type} group. Available: ${availableGroup.quantity}, Requested: ${requestedGroup.count}`
            });
          }
          
          console.log(`Stock check passed for group: ${requestedGroup.type}, requested: ${requestedGroup.count}, available: ${availableGroup.quantity}`);
          totalRequestedQuantity += requestedGroup.count;
        }
        
        // Update quantity to match expiration groups total
        quantity = totalRequestedQuantity;
        
        if (totalRequestedQuantity === 0) {
          console.log('Total requested quantity is 0');
          return reply.code(400).send({
            success: false,
            message: "Total quantity from expiration groups must be greater than 0"
          });
        }
        
        console.log(`Total requested quantity: ${totalRequestedQuantity}, proceeding with cart addition`);
      } catch (error) {
        return reply.code(400).send({
          success: false,
          message: `Error validating expiration groups: ${error.message}`
        });
      }
    } else {
      // Traditional quantity validation
      if (!listing.hasAvailableCodes(quantity)) {
        return reply.code(400).send({
          success: false,
          message: "Insufficient stock available"
        });
      }
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
    const cartItemData = {
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
    };

    // Add expiration groups if provided
    if (expirationGroups && expirationGroups.length > 0) {
      cartItemData.expirationGroups = expirationGroups;
    }

    const cart = await Cart.createOrUpdate(userId, 'add', cartItemData);

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