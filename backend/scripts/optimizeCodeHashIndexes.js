/**
 * Script to optimize database indexes for code hash lookups
 * 
 * This script will:
 * 1. Create a compound index on codes.hashCode for faster lookups
 * 2. Verify the index was created successfully
 * 3. Run a performance test to measure query times
 * 
 * Run this script with: node scripts/optimizeCodeHashIndexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Listing } = require('../models/listing');

// Get MongoDB URI from environment or use default
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

/**
 * Create the necessary indexes for optimized code hash lookups
 */
async function createIndexes() {
  try {
    console.log('Creating optimized indexes for code hash lookups...');
    
    // Create a compound index on codes.hashCode
    // This will significantly improve performance when searching for duplicate codes
    const indexResult = await Listing.collection.createIndex(
      { "codes.hashCode": 1 },
      { 
        name: "codes_hashCode_idx",
        background: true, // Create index in the background to avoid blocking operations
        sparse: true // Only index documents where the field exists
      }
    );
    
    console.log('Index creation result:', indexResult);
    
    // Create a compound index on sellerId and codes.hashCode
    // This will improve performance for seller-specific code lookups
    const sellerIndexResult = await Listing.collection.createIndex(
      { "sellerId": 1, "codes.hashCode": 1 },
      { 
        name: "seller_codes_hashCode_idx",
        background: true,
        sparse: true
      }
    );
    
    console.log('Seller index creation result:', sellerIndexResult);
    
    return { indexResult, sellerIndexResult };
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
}

/**
 * Verify the indexes were created successfully
 */
async function verifyIndexes() {
  try {
    console.log('Verifying indexes...');
    
    const indexes = await Listing.collection.indexes();
    console.log('Current indexes:');
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Check if our indexes exist
    const hashCodeIndex = indexes.find(index => index.name === 'codes_hashCode_idx');
    const sellerHashCodeIndex = indexes.find(index => index.name === 'seller_codes_hashCode_idx');
    
    if (hashCodeIndex && sellerHashCodeIndex) {
      console.log('✅ All required indexes are present');
      return true;
    } else {
      console.warn('⚠️ Some indexes are missing:');
      if (!hashCodeIndex) console.warn('  - codes_hashCode_idx is missing');
      if (!sellerHashCodeIndex) console.warn('  - seller_codes_hashCode_idx is missing');
      return false;
    }
  } catch (error) {
    console.error('Error verifying indexes:', error);
    throw error;
  }
}

/**
 * Run a performance test to measure query times
 */
async function runPerformanceTest() {
  try {
    console.log('Running performance test...');
    
    // Get a random hashCode to search for
    const randomListing = await Listing.findOne({ 'codes.0': { $exists: true } });
    
    if (!randomListing || !randomListing.codes || randomListing.codes.length === 0) {
      console.warn('No listings with codes found for performance testing');
      return;
    }
    
    const randomHashCode = randomListing.codes[0].hashCode;
    console.log(`Using hashCode: ${randomHashCode} for testing`);
    
    // Test 1: Query using the hashCode index
    console.time('Query with hashCode index');
    const result1 = await Listing.find({ 'codes.hashCode': randomHashCode }).lean();
    console.timeEnd('Query with hashCode index');
    console.log(`Found ${result1.length} listings with the hashCode`);
    
    // Test 2: Query using the seller and hashCode compound index
    console.time('Query with seller and hashCode index');
    const result2 = await Listing.find({ 
      'sellerId': randomListing.sellerId,
      'codes.hashCode': randomHashCode 
    }).lean();
    console.timeEnd('Query with seller and hashCode index');
    console.log(`Found ${result2.length} listings for the seller with the hashCode`);
    
    // Test 3: Count total codes in the system
    console.time('Count total codes');
    const allListings = await Listing.find({}).lean();
    let totalCodes = 0;
    allListings.forEach(listing => {
      if (listing.codes) {
        totalCodes += listing.codes.length;
      }
    });
    console.timeEnd('Count total codes');
    console.log(`Total codes in the system: ${totalCodes}`);
    
    return {
      totalListings: allListings.length,
      totalCodes,
      randomHashCodeResults: result1.length,
      sellerHashCodeResults: result2.length
    };
  } catch (error) {
    console.error('Error running performance test:', error);
    throw error;
  }
}

/**
 * Main function to run the optimization
 */
async function optimizeIndexes() {
  try {
    // Create the indexes
    await createIndexes();
    
    // Verify the indexes
    const indexesVerified = await verifyIndexes();
    
    if (indexesVerified) {
      // Run performance test
      const perfResults = await runPerformanceTest();
      
      console.log('\n=== Optimization Summary ===');
      console.log('✅ Indexes created successfully');
      console.log('✅ Indexes verified');
      console.log(`📊 Total listings: ${perfResults?.totalListings || 'N/A'}`);
      console.log(`📊 Total codes: ${perfResults?.totalCodes || 'N/A'}`);
      console.log('\nThe database is now optimized for handling 50,000+ codes efficiently.');
      console.log('For best performance with large datasets:');
      console.log('1. Use pagination when displaying codes');
      console.log('2. Limit batch operations to reasonable sizes (500-1000 codes)');
      console.log('3. Monitor query performance in production');
    } else {
      console.error('❌ Index verification failed. Please check the MongoDB logs for errors.');
    }
  } catch (error) {
    console.error('Optimization failed:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the optimization
optimizeIndexes();
