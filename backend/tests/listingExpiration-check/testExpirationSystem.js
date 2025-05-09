/**
 * Test script for the listing expiration system
 *
 * This script tests:
 * 1. The scheduled task that updates expired listings
 * 2. The real-time expiration check in API responses
 */

const { Listing } = require('../../models/listing');
const { updateListingStatuses } = require('../../jobs/listingExpirationCron');
const { checkAndUpdateListingStatus, processListingsExpiration } = require('../../utils/listingHelpers');
const mongoose = require('mongoose');
const { configs } = require('../../configs');

// Mock fastify logger
const mockFastify = {
  log: {
    info: (msg) => console.log(`[INFO] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
    debug: (msg) => console.log(`[DEBUG] ${msg}`)
  }
};

/**
 * Creates a test listing with the specified expiration date
 */
const createTestListing = async (expirationDate) => {
  const listing = new Listing({
    title: `Test Listing ${Date.now()}`,
    description: 'Test description for expiration system',
    price: 19.99,
    categoryId: new mongoose.Types.ObjectId(), // Mock ID
    platform: 'Steam',
    region: 'Global',
    sellerId: 'test-seller',
    status: 'active'
  });

  // Add a test code with the specified expiration date
  listing.addCodes(['TEST-CODE-12345'], expirationDate);

  await listing.save();
  return listing;
};

/**
 * Main test function
 */
const runTests = async () => {
  try {
    // Connect to the database
    await mongoose.connect(configs.MONGO_URI);
    console.log('Connected to MongoDB');

    // Test 1: Create listings with different expiration dates
    console.log('\n--- Test 1: Creating test listings ---');

    // Create an already expired listing (1 day ago)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const expiredListing = await createTestListing(pastDate);
    console.log(`Created expired listing with ID: ${expiredListing._id}`);

    // Create a future listing (1 day from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const activeListing = await createTestListing(futureDate);
    console.log(`Created active listing with ID: ${activeListing._id}`);

    // Test 2: Test the scheduled task
    console.log('\n--- Test 2: Testing scheduled task ---');
    const result = await updateListingStatuses(mockFastify);
    console.log('Scheduled task result:', result);

    // Verify the expired listing was updated
    const updatedListing = await Listing.findById(expiredListing._id);
    console.log(`Expired listing status after scheduled task: ${updatedListing.status}`);

    // Test 3: Test real-time expiration check
    console.log('\n--- Test 3: Testing real-time expiration check ---');

    // Reset the expired listing to active for testing
    updatedListing.status = 'active';
    await updatedListing.save();
    console.log('Reset listing to active status');

    // Test the real-time check
    const wasUpdated = checkAndUpdateListingStatus(updatedListing);
    console.log(`Real-time check updated status: ${wasUpdated}`);
    console.log(`Listing status after real-time check: ${updatedListing.status}`);

    // Test batch processing
    const listings = await Listing.find({ _id: { $in: [expiredListing._id, activeListing._id] } });
    const updatedCount = processListingsExpiration(listings, mockFastify);
    console.log(`Batch processing updated ${updatedCount} listings`);
    listings.forEach(listing => {
      console.log(`Listing ${listing._id}: status = ${listing.status}`);
    });

    console.log('\nTests completed successfully!');
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Clean up test data
    await Listing.deleteMany({
      title: { $regex: /^Test Listing/ }
    });
    console.log('Test data cleaned up');

    // Close the database connection
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
};

// Run the tests
runTests();
