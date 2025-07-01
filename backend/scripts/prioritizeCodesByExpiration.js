/**
 * Script to prioritize codes by expiration date in existing listings
 * This script will reorder codes in each listing so that:
 * 1. Codes with expiration dates come first (closest to expiration first)
 * 2. Codes without expiration dates come last (maintaining their relative order)
 * 
 * Run this script after updating the code purchase logic to ensure
 * existing data follows the new prioritization rules.
 */

const mongoose = require("mongoose");
const { Listing } = require("../models/listing");
const { configs } = require("../configs");

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(configs.MONGO_URI);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

// Function to sort codes by expiration date priority
function sortCodesByExpirationPriority(codes) {
  return codes.sort((a, b) => {
    const aHasExpiration = a.expirationDate && a.expirationDate !== null;
    const bHasExpiration = b.expirationDate && b.expirationDate !== null;

    // If both have expiration dates, sort by closest expiration first
    if (aHasExpiration && bHasExpiration) {
      return new Date(a.expirationDate) - new Date(b.expirationDate);
    }

    // If only 'a' has expiration date, it gets priority
    if (aHasExpiration && !bHasExpiration) {
      return -1;
    }

    // If only 'b' has expiration date, it gets priority
    if (!aHasExpiration && bHasExpiration) {
      return 1;
    }

    // If neither has expiration date, maintain original order (stable sort)
    // Use codeId as tie-breaker for consistent ordering
    return a.codeId.localeCompare(b.codeId);
  });
}

// Main migration function
async function prioritizeCodesByExpiration() {
  console.log("Starting codes prioritization by expiration date...");
  
  let processedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  try {
    // Find all listings with codes
    const listings = await Listing.find({
      codes: { $exists: true, $not: { $size: 0 } }
    }).select("+codes");

    console.log(`Found ${listings.length} listings with codes to process`);

    for (const listing of listings) {
      try {
        processedCount++;

        // Check if codes need reordering
        const originalCodes = [...listing.codes];
        const sortedCodes = sortCodesByExpirationPriority([...listing.codes]);

        // Compare if order changed
        const orderChanged = !originalCodes.every((code, index) => {
          return code.codeId === sortedCodes[index].codeId;
        });

        if (orderChanged) {
          // Update the codes array with sorted order
          listing.codes = sortedCodes;
          
          // Skip status recalculation in pre-save hook since we're just reordering
          listing._skipStatusCalculation = true;
          
          await listing.save();
          updatedCount++;

          console.log(`Updated listing: ${listing.title} (${listing.externalId})`);
          
          // Log details for listings with mixed expiration dates
          const codesWithExpiration = sortedCodes.filter(code => 
            code.expirationDate && code.expirationDate !== null
          ).length;
          const codesWithoutExpiration = sortedCodes.length - codesWithExpiration;
          
          if (codesWithExpiration > 0 && codesWithoutExpiration > 0) {
            console.log(`  - ${codesWithExpiration} codes with expiration dates (prioritized)`);
            console.log(`  - ${codesWithoutExpiration} codes without expiration dates`);
          }
        }

        // Progress update every 100 listings
        if (processedCount % 100 === 0) {
          console.log(`Progress: ${processedCount}/${listings.length} listings processed`);
        }

      } catch (error) {
        errorCount++;
        console.error(`Error processing listing ${listing.externalId}:`, error.message);
        
        // Continue processing other listings
        continue;
      }
    }

    console.log("\n=== Migration Summary ===");
    console.log(`Total listings processed: ${processedCount}`);
    console.log(`Listings updated: ${updatedCount}`);
    console.log(`Listings with errors: ${errorCount}`);
    console.log(`Listings unchanged: ${processedCount - updatedCount - errorCount}`);

    if (updatedCount > 0) {
      console.log(`\nSuccessfully prioritized codes by expiration date in ${updatedCount} listings.`);
      console.log("Codes with expiration dates now have priority over codes without expiration dates.");
    } else {
      console.log("\nNo listings required code reordering.");
    }

  } catch (error) {
    console.error("Fatal error during migration:", error);
    process.exit(1);
  }
}

// Run the migration
async function runMigration() {
  await connectToDatabase();
  
  try {
    await prioritizeCodesByExpiration();
    console.log("\nMigration completed successfully!");
  } catch (error) {
    console.error("\nMigration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

// Handle script execution
if (require.main === module) {
  runMigration();
}

module.exports = {
  prioritizeCodesByExpiration,
  sortCodesByExpirationPriority
};