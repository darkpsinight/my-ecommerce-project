const {
	getUserWishlist,
	addItemToWishlist,
	removeItemFromWishlist,
	clearWishlist,
	getWishlistAnalytics,
	markWishlistItemAsPurchased,
} = require("../handlers/wishlistHandlers");

const { authVerify } = require("../plugins/authVerify");

const wishlistRoutes = async (fastify, options) => {
	// Schema definitions
	const addItemSchema = {
		type: "object",
		required: ["listingId"],
		properties: {
			listingId: {
				type: "string",
				minLength: 24,
				maxLength: 24,
				pattern: "^[0-9a-fA-F]{24}$",
			},
		},
	};

	const removeItemSchema = {
		type: "object",
		required: ["listingId"],
		properties: {
			listingId: {
				type: "string",
				minLength: 24,
				maxLength: 24,
				pattern: "^[0-9a-fA-F]{24}$",
			},
		},
	};

	// Get user's wishlist
	fastify.get(
		"/",
		{
			preHandler: authVerify,
		},
		getUserWishlist
	);

	// Add item to wishlist
	fastify.post(
		"/add",
		{
			preHandler: authVerify,
			schema: {
				body: addItemSchema,
			},
		},
		addItemToWishlist
	);

	// Remove item from wishlist
	fastify.delete(
		"/remove/:listingId",
		{
			preHandler: authVerify,
			schema: {
				params: removeItemSchema,
			},
		},
		removeItemFromWishlist
	);

	// Clear entire wishlist
	fastify.delete(
		"/clear",
		{
			preHandler: authVerify,
		},
		clearWishlist
	);

	// Get wishlist analytics
	fastify.get(
		"/analytics",
		{
			preHandler: authVerify,
		},
		getWishlistAnalytics
	);

	// Mark wishlist item as purchased
	fastify.post(
		"/purchased",
		{
			preHandler: authVerify,
			schema: {
				body: addItemSchema, // Reuse the same schema since it requires listingId
			},
		},
		markWishlistItemAsPurchased
	);
};

module.exports = wishlistRoutes;