const {
	getUserWishlist,
	addItemToWishlist,
	removeItemFromWishlist,
	clearWishlist,
	getWishlistAnalytics,
	markWishlistItemAsPurchased,
} = require("../handlers/wishlistHandlers");

const { verifyAuth } = require("../plugins/authVerify");

const wishlistRoutes = async (fastify, options) => {
	// Schema definitions
	const addItemSchema = {
		type: "object",
		required: ["listingId"],
		properties: {
			listingId: {
				type: "string",
				minLength: 1,
				maxLength: 50, // Allow for both UUIDs and MongoDB ObjectIds
				pattern: "^[0-9a-fA-F-]+$", // Allow UUIDs with dashes and ObjectIds
			},
		},
	};

	const removeItemSchema = {
		type: "object",
		required: ["listingId"],
		properties: {
			listingId: {
				type: "string",
				minLength: 1,
				maxLength: 50, // Allow for both UUIDs and MongoDB ObjectIds
				pattern: "^[0-9a-fA-F-]+$", // Allow UUIDs with dashes and ObjectIds
			},
		},
	};

	// Get user's wishlist
	fastify.get(
		"/",
		{
			preHandler: verifyAuth(["buyer"]),
		},
		getUserWishlist
	);

	// Add item to wishlist
	fastify.post(
		"/add",
		{
			preHandler: verifyAuth(["buyer"]),
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
			preHandler: verifyAuth(["buyer"]),
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
			preHandler: verifyAuth(["buyer"]),
		},
		clearWishlist
	);

	// Get wishlist analytics
	fastify.get(
		"/analytics",
		{
			preHandler: verifyAuth(["buyer"]),
		},
		getWishlistAnalytics
	);

	// Mark wishlist item as purchased
	fastify.post(
		"/purchased",
		{
			preHandler: verifyAuth(["buyer"]),
			schema: {
				body: addItemSchema, // Reuse the same schema since it requires listingId
			},
		},
		markWishlistItemAsPurchased
	);
};

module.exports = wishlistRoutes;