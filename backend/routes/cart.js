const { verifyAuth } = require("../plugins/authVerify");
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require("../handlers/cartHandlers");
const { getCartSchema, addToCartSchema, updateCartItemSchema, removeFromCartSchema } = require("./schemas/cartSchema");

// Rate limiting configurations
const rateLimits = {
  read: {
    max: 50, // 50 requests
    timeWindow: "1 minute"
  },
  write: {
    max: 20, // 20 requests
    timeWindow: "1 minute"
  }
};

const cartRoutes = async (fastify, options) => {
  // Get user's cart
  fastify.route({
    config: {
      rateLimit: rateLimits.read
    },
    method: "GET",
    url: "/",
    preHandler: verifyAuth(["buyer"]),
    schema: getCartSchema,
    handler: getCart
  });

  // Add item to cart
  fastify.route({
    config: {
      rateLimit: rateLimits.write
    },
    method: "POST",
    url: "/add",
    preHandler: verifyAuth(["buyer"]),
    schema: addToCartSchema,
    handler: addToCart
  });

  // Update cart item quantity
  fastify.route({
    config: {
      rateLimit: rateLimits.write
    },
    method: "PUT",
    url: "/update",
    preHandler: verifyAuth(["buyer"]),
    schema: updateCartItemSchema,
    handler: updateCartItem
  });

  // Remove item from cart
  fastify.route({
    config: {
      rateLimit: rateLimits.write
    },
    method: "DELETE",
    url: "/remove",
    preHandler: verifyAuth(["buyer"]),
    schema: removeFromCartSchema,
    handler: removeFromCart
  });

  // Clear entire cart
  fastify.route({
    config: {
      rateLimit: rateLimits.write
    },
    method: "DELETE",
    url: "/clear",
    preHandler: verifyAuth(["buyer"]),
    schema: getCartSchema,
    handler: clearCart
  });

  // Get cart summary (total items, total amount)
  fastify.route({
    config: {
      rateLimit: rateLimits.read
    },
    method: "GET",
    url: "/summary",
    preHandler: verifyAuth(["buyer"]),
    schema: getCartSchema,
    handler: async (request, reply) => {
      const { Cart } = require("../models/cart");
      
      try {
        const cart = await Cart.findByUserId(request.user.uid);
        
        if (!cart) {
          return reply.code(200).send({
            success: true,
            data: {
              totalItems: 0,
              totalAmount: 0,
              itemCount: 0,
            },
          });
        }

        return reply.code(200).send({
          success: true,
          data: {
            totalItems: cart.getTotalItems(),
            totalAmount: cart.getTotalAmount(),
            itemCount: cart.items.length,
          },
        });
      } catch (error) {
        console.error("Error fetching cart summary:", error);
        return reply.code(500).send({
          success: false,
          message: "Failed to fetch cart summary",
          error: error.message,
        });
      }
    }
  });
};

module.exports = cartRoutes;