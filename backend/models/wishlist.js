const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema({
	listingId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Listing",
		required: true,
	},
	addedAt: {
		type: Date,
		default: Date.now,
	},
	// Store snapshot of listing data to avoid issues if listing is deleted
	listingSnapshot: {
		title: String,
		price: Number,
		discountedPrice: Number,
		imgs: {
			thumbnails: [String],
			previews: [String],
		},
		categoryName: String,
		platform: String,
		region: String,
		sellerId: String,
		sellerMarketName: String,
	},
});

const wishlistSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
		unique: true,
	},
	items: [wishlistItemSchema],
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
	// Wishlist analytics for future use
	analytics: {
		totalItemsAdded: {
			type: Number,
			default: 0,
		},
		totalItemsRemoved: {
			type: Number,
			default: 0,
		},
		mostRecentActivity: {
			type: Date,
			default: Date.now,
		},
		itemsConvertedToPurchase: {
			type: Number,
			default: 0,
		},
	},
});

// Update the updatedAt field before saving
wishlistSchema.pre('save', function(next) {
	this.updatedAt = Date.now();
	next();
});

// Instance method to add item to wishlist
wishlistSchema.methods.addItem = function(itemData) {
	// Check if item already exists
	const existingItem = this.items.find(item => 
		item.listingId.toString() === itemData.listingId.toString()
	);
	
	if (!existingItem) {
		// Check wishlist limit (max 100 items)
		if (this.items.length >= 100) {
			throw new Error('Wishlist is full. Maximum 100 items allowed.');
		}
		
		this.items.push({
			listingId: itemData.listingId,
			listingSnapshot: itemData.listingSnapshot,
		});
		
		// Update analytics
		this.analytics.totalItemsAdded += 1;
		this.analytics.mostRecentActivity = new Date();
	}
	
	return this;
};

// Instance method to remove item from wishlist
wishlistSchema.methods.removeItem = function(listingId) {
	const initialCount = this.items.length;
	this.items = this.items.filter(item => 
		item.listingId.toString() !== listingId.toString()
	);
	
	// Update analytics if item was actually removed
	if (this.items.length < initialCount) {
		this.analytics.totalItemsRemoved += 1;
		this.analytics.mostRecentActivity = new Date();
	}
	
	return this;
};

// Instance method to check if item is in wishlist
wishlistSchema.methods.hasItem = function(listingId) {
	return this.items.some(item => 
		item.listingId.toString() === listingId.toString()
	);
};

// Instance method to get item count
wishlistSchema.methods.getItemCount = function() {
	return this.items.length;
};

// Instance method to mark item as converted to purchase
wishlistSchema.methods.markItemAsPurchased = function(listingId) {
	const item = this.items.find(item => 
		item.listingId.toString() === listingId.toString()
	);
	
	if (item) {
		this.analytics.itemsConvertedToPurchase += 1;
		this.analytics.mostRecentActivity = new Date();
		// Remove the item from wishlist after purchase
		this.removeItem(listingId);
	}
	
	return this;
};

// Instance method to get wishlist analytics
wishlistSchema.methods.getAnalytics = function() {
	return {
		totalItems: this.items.length,
		totalItemsAdded: this.analytics.totalItemsAdded,
		totalItemsRemoved: this.analytics.totalItemsRemoved,
		itemsConvertedToPurchase: this.analytics.itemsConvertedToPurchase,
		mostRecentActivity: this.analytics.mostRecentActivity,
		conversionRate: this.analytics.totalItemsAdded > 0 
			? (this.analytics.itemsConvertedToPurchase / this.analytics.totalItemsAdded * 100).toFixed(2) + '%'
			: '0%'
	};
};

// Static method to find or create wishlist for user
wishlistSchema.statics.findOrCreateForUser = async function(userId) {
	let wishlist = await this.findOne({ userId });
	
	if (!wishlist) {
		wishlist = new this({
			userId,
			items: []
		});
		await wishlist.save();
	}
	
	return wishlist;
};

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

module.exports = {
	Wishlist,
};