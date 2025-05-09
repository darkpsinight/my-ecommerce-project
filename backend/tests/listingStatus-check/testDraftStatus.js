/**
 * Test script for verifying that draft status is preserved in the listing expiration cron job
 *
 * This script tests:
 * 1. Creating a listing with draft status and active codes
 * 2. Running the updateListingStatuses function
 * 3. Verifying that the draft status is preserved
 */

const { Listing } = require('../../models/listing');
const { updateListingStatuses } = require('../../jobs/listingExpirationCron');
const mongoose = require('mongoose');
const { configs } = require('../../configs');
const crypto = require('crypto');
const uuidv4 = require('uuid').v4;

// Mock fastify logger
const mockFastify = {
  log: {
    info: console.log,
    error: console.error,
    debug: console.log
  }
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(configs.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create a test listing with draft status and active codes
const createTestListing = async () => {
  try {
    // First, delete any existing test listings
    await Listing.deleteMany({ title: 'Test Draft Status Listing' });

    // Create a new listing with draft status
    const listing = new Listing({
      title: 'Test Draft Status Listing',
      description: 'This is a test listing to verify draft status preservation',
      price: 10.99,
      categoryId: new mongoose.Types.ObjectId(),
      platform: 'Test Platform',
      region: 'Global',
      sellerId: 'test-seller-id',
      externalId: uuidv4(),
      status: 'draft',
      codes: [
        {
          code: 'encrypted-code-1',
          iv: crypto.randomBytes(16).toString('hex'),
          soldStatus: 'active',
          expirationDate: new Date(Date.now() + 86400000) // 1 day in the future
        },
        {
          code: 'encrypted-code-2',
          iv: crypto.randomBytes(16).toString('hex'),
          soldStatus: 'active',
          expirationDate: new Date(Date.now() + 86400000) // 1 day in the future
        }
      ]
    });

    // Skip status calculation in pre-save hook to ensure we start with draft status
    listing._skipStatusCalculation = true;
    await listing.save();

    console.log('Created test listing with draft status and active codes');
    return listing;
  } catch (error) {
    console.error('Error creating test listing:', error);
    throw error;
  }
};

// Run the test
const runTest = async () => {
  try {
    // Connect to the database
    await connectDB();

    // Create a test listing
    const createdListing = await createTestListing();
    console.log('Initial listing status:', createdListing.status);

    // Run the updateListingStatuses function
    console.log('Running updateListingStatuses...');
    const result = await updateListingStatuses(mockFastify);
    console.log('Update result:', result);

    // Check if the listing status is still draft
    const updatedListing = await Listing.findOne({ externalId: createdListing.externalId });
    console.log('Final listing status:', updatedListing.status);

    if (updatedListing.status === 'draft') {
      console.log('✅ TEST PASSED: Draft status was preserved');
    } else {
      console.error('❌ TEST FAILED: Draft status was changed to', updatedListing.status);
    }

    // Clean up
    await Listing.deleteMany({ title: 'Test Draft Status Listing' });

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Run the test
runTest();
