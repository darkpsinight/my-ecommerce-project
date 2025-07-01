/**
 * Migration script to backfill expiration groups for existing listings
 * 
 * This script:
 * 1. Finds all listings with codes
 * 2. Sets expirationGroup field based on expirationDate
 * 3. Ensures backward compatibility
 * 
 * Run with: node migrations/backfill-expiration-groups.js
 */

const mongoose = require('mongoose');
const { Listing } = require('../models/listing');

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/digital-marketplace';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Migration function
const backfillExpirationGroups = async () => {
  try {
    console.log('Starting expiration groups backfill migration...');
    
    // Find all listings with codes
    const listings = await Listing.find({
      codes: { $exists: true, $ne: [] }
    }).select('+codes');
    
    console.log(`Found ${listings.length} listings with codes to process`);
    
    let processedListings = 0;
    let updatedCodes = 0;
    
    for (const listing of listings) {
      let listingModified = false;
      
      // Process each code in the listing
      for (const code of listing.codes) {
        // Only update if expirationGroup is not already set
        if (!code.expirationGroup) {
          if (code.expirationDate) {
            code.expirationGroup = 'expires';
          } else {
            code.expirationGroup = 'never_expires';
          }
          listingModified = true;
          updatedCodes++;
        }
      }
      
      // Save the listing if any codes were modified
      if (listingModified) {
        await listing.save();
        processedListings++;
        
        if (processedListings % 100 === 0) {
          console.log(`Processed ${processedListings} listings...`);
        }
      }
    }
    
    console.log('Migration completed successfully!');
    console.log(`- Processed listings: ${processedListings}`);
    console.log(`- Updated codes: ${updatedCodes}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Verification function
const verifyMigration = async () => {
  try {
    console.log('Verifying migration results...');
    
    // Count codes without expiration groups
    const codesWithoutGroups = await Listing.aggregate([
      { $unwind: '$codes' },
      { $match: { 'codes.expirationGroup': { $exists: false } } },
      { $count: 'total' }
    ]);
    
    const missingGroups = codesWithoutGroups[0]?.total || 0;
    
    // Count codes by group type
    const groupStats = await Listing.aggregate([
      { $unwind: '$codes' },
      { $group: {
          _id: '$codes.expirationGroup',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Verification Results:');
    console.log(`- Codes without expiration groups: ${missingGroups}`);
    console.log('- Group distribution:');
    groupStats.forEach(stat => {
      console.log(`  - ${stat._id || 'undefined'}: ${stat.count}`);
    });
    
    if (missingGroups === 0) {
      console.log('✅ Migration verification successful - all codes have expiration groups');
    } else {
      console.log('❌ Migration verification failed - some codes still missing expiration groups');
    }
    
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    
    // Check if migration is needed
    const sampleListing = await Listing.findOne({
      codes: { $exists: true, $ne: [] }
    }).select('+codes');
    
    if (sampleListing && sampleListing.codes.length > 0) {
      const hasExpirationGroups = sampleListing.codes.some(code => code.expirationGroup);
      
      if (!hasExpirationGroups) {
        console.log('Expiration groups not found, starting migration...');
        await backfillExpirationGroups();
        await verifyMigration();
      } else {
        console.log('Expiration groups already exist, running verification only...');
        await verifyMigration();
      }
    } else {
      console.log('No listings with codes found, nothing to migrate');
    }
    
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Handle script execution
if (require.main === module) {
  main();
}

module.exports = {
  backfillExpirationGroups,
  verifyMigration
};