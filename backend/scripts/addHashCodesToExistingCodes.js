/**
 * Migration script to add hash codes to existing codes in the database
 *
 * This script will:
 * 1. Find all listings with codes
 * 2. Decrypt each code
 * 3. Generate a hash for each code
 * 4. Add the hash to the code object
 * 5. Save the listing
 *
 * Run this script with: node scripts/addHashCodesToExistingCodes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Listing } = require('../models/listing');

// Hardcoded MongoDB URI for testing
const MONGODB_URI = 'mongodb://localhost:27017/ecommerce';

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

async function migrateHashCodes() {
  try {
    console.log('Starting migration to add hash codes to existing codes...');

    // Find all listings with codes
    const listings = await Listing.find({}).select('+codes.code +codes.iv');
    console.log(`Found ${listings.length} listings to process`);

    let totalCodesProcessed = 0;
    let totalListingsUpdated = 0;

    // Process each listing
    for (const listing of listings) {
      let listingUpdated = false;

      // Skip if listing has no codes
      if (!listing.codes || listing.codes.length === 0) {
        continue;
      }

      // Process each code in the listing
      for (const codeObj of listing.codes) {
        // Skip if code already has a hash
        if (codeObj.hashCode) {
          continue;
        }

        // Decrypt the code
        const decryptedCode = listing.decryptCode(codeObj.code, codeObj.iv);

        if (!decryptedCode) {
          console.warn(`Failed to decrypt code in listing ${listing.externalId}`);
          continue;
        }

        // Generate a hash for the code
        const hashCode = listing.generateCodeHash(decryptedCode);

        // Add the hash to the code object
        codeObj.hashCode = hashCode;

        listingUpdated = true;
        totalCodesProcessed++;
      }

      // Save the listing if updated
      if (listingUpdated) {
        await listing.save();
        totalListingsUpdated++;

        // Log progress every 10 listings
        if (totalListingsUpdated % 10 === 0) {
          console.log(`Processed ${totalListingsUpdated} listings, ${totalCodesProcessed} codes`);
        }
      }
    }

    console.log(`Migration complete! Updated ${totalListingsUpdated} listings, added hash codes to ${totalCodesProcessed} codes`);

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the migration
migrateHashCodes();
