const { Wishlist } = require("../models/wishlist");
const { Listing } = require("../models/listing");
const { User } = require("../models/user");

// Get user's wishlist
const getUserWishlist = async (request, reply) => {
	try {
		const userId = request.user.uid;
		
		// Find user by uid to get MongoDB _id
		const user = await User.findOne({ uid: userId });
		if (!user) {
			return reply.status(404).send({
				error: true,
				message: "User not found",
			});
		}

		// Find or create wishlist for user
		const wishlist = await Wishlist.findOrCreateForUser(user._id);
		
		// Populate with current listing data
		await wishlist.populate({
			path: 'items.listingId',
			select: 'title price discountedPrice imgs categoryName platform region sellerId sellerMarketName quantityOfActiveCodes status'
		});

		// Filter out items where listing no longer exists or is inactive
		const activeItems = wishlist.items.filter(item => 
			item.listingId && 
			item.listingId.status === 'active'
		);

		// Format response
		const formattedItems = activeItems.map(item => ({
			id: item.listingId._id.toString(),
			title: item.listingId.title,
			price: item.listingId.price,
			discountedPrice: item.listingId.discountedPrice,
			quantity: 1,
			status: "available",
			imgs: item.listingId.imgs,
			categoryName: item.listingId.categoryName,
			platform: item.listingId.platform,
			region: item.listingId.region,
			sellerId: item.listingId.sellerId,
			sellerMarketName: item.listingId.sellerMarketName,
			quantityOfActiveCodes: item.listingId.quantityOfActiveCodes,
			addedAt: item.addedAt,
		}));

		return reply.send({
			error: false,
			data: {
				items: formattedItems,
				count: formattedItems.length,
			},
		});
	} catch (error) {
		console.error("Error getting user wishlist:", error);
		return reply.status(500).send({
			error: true,
			message: "Internal server error",
		});
	}
};

// Add item to wishlist
const addItemToWishlist = async (request, reply) => {
	try {
		const userId = request.user.uid;
		const { listingId } = request.body;

		// Find user by uid to get MongoDB _id
		const user = await User.findOne({ uid: userId });
		if (!user) {
			return reply.status(404).send({
				error: true,
				message: "User not found",
			});
		}

		// Check if listing exists and is active
		const listing = await Listing.findById(listingId);
		if (!listing || listing.status !== 'active') {
			return reply.status(404).send({
				error: true,
				message: "Listing not found or inactive",
			});
		}

		// Find or create wishlist for user
		const wishlist = await Wishlist.findOrCreateForUser(user._id);

		// Check if item already exists in wishlist
		if (wishlist.hasItem(listingId)) {
			return reply.status(400).send({
				error: true,
				message: "Item already in wishlist",
			});
		}

		// Add item to wishlist
		try {
			wishlist.addItem({
				listingId: listing._id,
				listingSnapshot: {
					title: listing.title,
					price: listing.price,
					discountedPrice: listing.discountedPrice,
					imgs: listing.imgs,
					categoryName: listing.categoryName,
					platform: listing.platform,
					region: listing.region,
					sellerId: listing.sellerId,
					sellerMarketName: listing.sellerMarketName,
				},
			});

			await wishlist.save();
		} catch (error) {
			if (error.message.includes('Wishlist is full')) {
				return reply.status(400).send({
					error: true,
					message: "Wishlist is full. You can have maximum 100 items in your wishlist.",
				});
			}
			throw error;
		}

		return reply.send({
			error: false,
			message: "Item added to wishlist successfully",
			data: {
				itemCount: wishlist.getItemCount(),
			},
		});
	} catch (error) {
		console.error("Error adding item to wishlist:", error);
		return reply.status(500).send({
			error: true,
			message: "Internal server error",
		});
	}
};

// Remove item from wishlist
const removeItemFromWishlist = async (request, reply) => {
	try {
		const userId = request.user.uid;
		const { listingId } = request.params;

		// Find user by uid to get MongoDB _id
		const user = await User.findOne({ uid: userId });
		if (!user) {
			return reply.status(404).send({
				error: true,
				message: "User not found",
			});
		}

		// Find wishlist for user
		const wishlist = await Wishlist.findOne({ userId: user._id });
		if (!wishlist) {
			return reply.status(404).send({
				error: true,
				message: "Wishlist not found",
			});
		}

		// Check if item exists in wishlist
		if (!wishlist.hasItem(listingId)) {
			return reply.status(404).send({
				error: true,
				message: "Item not found in wishlist",
			});
		}

		// Remove item from wishlist
		wishlist.removeItem(listingId);
		await wishlist.save();

		return reply.send({
			error: false,
			message: "Item removed from wishlist successfully",
			data: {
				itemCount: wishlist.getItemCount(),
			},
		});
	} catch (error) {
		console.error("Error removing item from wishlist:", error);
		return reply.status(500).send({
			error: true,
			message: "Internal server error",
		});
	}
};

// Clear entire wishlist
const clearWishlist = async (request, reply) => {
	try {
		const userId = request.user.uid;

		// Find user by uid to get MongoDB _id
		const user = await User.findOne({ uid: userId });
		if (!user) {
			return reply.status(404).send({
				error: true,
				message: "User not found",
			});
		}

		// Find wishlist for user
		const wishlist = await Wishlist.findOne({ userId: user._id });
		if (!wishlist) {
			return reply.status(404).send({
				error: true,
				message: "Wishlist not found",
			});
		}

		// Clear all items
		wishlist.items = [];
		await wishlist.save();

		return reply.send({
			error: false,
			message: "Wishlist cleared successfully",
			data: {
				itemCount: 0,
			},
		});
	} catch (error) {
		console.error("Error clearing wishlist:", error);
		return reply.status(500).send({
			error: true,
			message: "Internal server error",
		});
	}
};

// Get wishlist analytics
const getWishlistAnalytics = async (request, reply) => {
	try {
		const userId = request.user.uid;

		// Find user by uid to get MongoDB _id
		const user = await User.findOne({ uid: userId });
		if (!user) {
			return reply.status(404).send({
				error: true,
				message: "User not found",
			});
		}

		// Find wishlist for user
		const wishlist = await Wishlist.findOne({ userId: user._id });
		if (!wishlist) {
			return reply.send({
				error: false,
				data: {
					totalItems: 0,
					totalItemsAdded: 0,
					totalItemsRemoved: 0,
					itemsConvertedToPurchase: 0,
					mostRecentActivity: null,
					conversionRate: '0%'
				},
			});
		}

		return reply.send({
			error: false,
			data: wishlist.getAnalytics(),
		});
	} catch (error) {
		console.error("Error getting wishlist analytics:", error);
		return reply.status(500).send({
			error: true,
			message: "Internal server error",
		});
	}
};

// Mark wishlist item as purchased (for analytics)
const markWishlistItemAsPurchased = async (request, reply) => {
	try {
		const userId = request.user.uid;
		const { listingId } = request.body;

		// Find user by uid to get MongoDB _id
		const user = await User.findOne({ uid: userId });
		if (!user) {
			return reply.status(404).send({
				error: true,
				message: "User not found",
			});
		}

		// Find wishlist for user
		const wishlist = await Wishlist.findOne({ userId: user._id });
		if (!wishlist) {
			return reply.status(404).send({
				error: true,
				message: "Wishlist not found",
			});
		}

		// Mark item as purchased
		wishlist.markItemAsPurchased(listingId);
		await wishlist.save();

		return reply.send({
			error: false,
			message: "Item marked as purchased successfully",
		});
	} catch (error) {
		console.error("Error marking wishlist item as purchased:", error);
		return reply.status(500).send({
			error: true,
			message: "Internal server error",
		});
	}
};

module.exports = {
	getUserWishlist,
	addItemToWishlist,
	removeItemFromWishlist,
	clearWishlist,
	getWishlistAnalytics,
	markWishlistItemAsPurchased,
};