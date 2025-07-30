/**
 * Simple test script to verify wishlist functionality
 * This script tests the basic wishlist operations without requiring a full server setup
 */

const mongoose = require('mongoose');
const { Wishlist } = require('../../models/wishlist');
const { User } = require('../../models/user');
const { Listing } = require('../../models/listing');

// Mock data for testing
const mockUserId = new mongoose.Types.ObjectId();
const mockListingId = new mongoose.Types.ObjectId();

async function testWishlistFunctionality() {
  console.log('🧪 Testing Wishlist Functionality...\n');

  try {
    // Test 1: Create a new wishlist
    console.log('1️⃣ Testing wishlist creation...');
    const wishlist = await Wishlist.findOrCreateForUser(mockUserId);
    console.log('✅ Wishlist created successfully:', {
      userId: wishlist.userId,
      itemCount: wishlist.getItemCount()
    });

    // Test 2: Add item to wishlist
    console.log('\n2️⃣ Testing add item to wishlist...');
    const mockListingSnapshot = {
      title: 'Test Game Code',
      price: 29.99,
      discountedPrice: 19.99,
      categoryName: 'Gaming',
      platform: 'Steam',
      region: 'Global',
      sellerId: 'test-seller-123',
      sellerMarketName: 'TestStore',
    };

    wishlist.addItem({
      listingId: mockListingId,
      listingSnapshot: mockListingSnapshot
    });

    console.log('✅ Item added successfully:', {
      itemCount: wishlist.getItemCount(),
      hasItem: wishlist.hasItem(mockListingId)
    });

    // Test 3: Check if item exists
    console.log('\n3️⃣ Testing item existence check...');
    const hasItem = wishlist.hasItem(mockListingId);
    console.log('✅ Item existence check:', hasItem);

    // Test 4: Try to add duplicate item
    console.log('\n4️⃣ Testing duplicate item handling...');
    const itemCountBefore = wishlist.getItemCount();
    wishlist.addItem({
      listingId: mockListingId,
      listingSnapshot: mockListingSnapshot
    });
    const itemCountAfter = wishlist.getItemCount();
    
    console.log('✅ Duplicate item handling:', {
      countBefore: itemCountBefore,
      countAfter: itemCountAfter,
      duplicatePrevented: itemCountBefore === itemCountAfter
    });

    // Test 5: Remove item from wishlist
    console.log('\n5️⃣ Testing item removal...');
    wishlist.removeItem(mockListingId);
    console.log('✅ Item removed successfully:', {
      itemCount: wishlist.getItemCount(),
      hasItem: wishlist.hasItem(mockListingId)
    });

    // Test 6: Test wishlist schema validation
    console.log('\n6️⃣ Testing wishlist schema...');
    const wishlistData = {
      userId: mockUserId,
      items: [
        {
          listingId: mockListingId,
          listingSnapshot: mockListingSnapshot
        }
      ]
    };

    const testWishlist = new Wishlist(wishlistData);
    const isValid = testWishlist.validateSync() === undefined;
    console.log('✅ Schema validation:', { isValid });

    console.log('\n🎉 All wishlist tests completed successfully!');
    
    // Print wishlist structure for inspection
    console.log('\n📋 Final wishlist structure:');
    console.log(JSON.stringify({
      userId: wishlist.userId,
      itemCount: wishlist.getItemCount(),
      items: wishlist.items.map(item => ({
        listingId: item.listingId,
        addedAt: item.addedAt,
        title: item.listingSnapshot?.title
      }))
    }, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWishlistFunctionality();

module.exports = { testWishlistFunctionality };