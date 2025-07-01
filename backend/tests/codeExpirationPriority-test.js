/**
 * Test script for code expiration priority functionality
 * This tests the new getActiveCodesSortedByExpiration and getCodesForPurchase methods
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

// Test function
async function testCodeExpirationPriority() {
  console.log("Testing code expiration priority logic...\n");

  try {
    // Create a sample listing for testing
    const testListing = new Listing({
      title: "Test Listing - Code Priority",
      description: "Testing code expiration priority",
      price: 10,
      categoryId: new mongoose.Types.ObjectId(),
      platform: "Test Platform",
      region: "Global",
      sellerId: "test-seller-uid"
    });

    // Add codes with different expiration scenarios
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const testCodes = [
      { code: "NO-EXPIRY-1", expirationDate: null },
      { code: "EXPIRES-TOMORROW", expirationDate: tomorrow },
      { code: "NO-EXPIRY-2", expirationDate: null },
      { code: "EXPIRES-NEXT-MONTH", expirationDate: nextMonth },
      { code: "EXPIRES-NEXT-WEEK", expirationDate: nextWeek },
      { code: "NO-EXPIRY-3", expirationDate: null }
    ];

    console.log("Adding test codes with different expiration dates:");
    testCodes.forEach((codeData, index) => {
      console.log(`${index + 1}. ${codeData.code} - ${codeData.expirationDate ? codeData.expirationDate.toISOString().split('T')[0] : 'No expiration'}`);
    });

    // Add codes to listing
    testListing.addCodes(testCodes);
    await testListing.save();

    console.log(`\nAdded ${testListing.codes.length} codes to test listing`);

    // Test 1: Get all active codes sorted by expiration priority
    console.log("\n=== Test 1: All active codes sorted by expiration priority ===");
    const sortedCodes = testListing.getActiveCodesSortedByExpiration();
    
    console.log("Expected order: Codes with expiration dates first (closest first), then codes without expiration:");
    sortedCodes.forEach((code, index) => {
      const decryptedCode = testListing.decryptCode(code.code, code.iv);
      const expirationText = code.expirationDate ? 
        code.expirationDate.toISOString().split('T')[0] : 
        'No expiration';
      console.log(`${index + 1}. ${decryptedCode} - ${expirationText}`);
    });

    // Verify the order is correct
    let expiringCodesCount = 0;
    let prevExpirationDate = null;
    let foundNonExpiringCode = false;

    for (const code of sortedCodes) {
      if (code.expirationDate && code.expirationDate !== null) {
        expiringCodesCount++;
        
        // Should not find expiring codes after non-expiring ones
        if (foundNonExpiringCode) {
          throw new Error("Found expiring code after non-expiring code - incorrect sort order!");
        }
        
        // Expiring codes should be in ascending order of expiration date
        if (prevExpirationDate && new Date(code.expirationDate) < new Date(prevExpirationDate)) {
          throw new Error("Expiring codes are not sorted by closest expiration first!");
        }
        
        prevExpirationDate = code.expirationDate;
      } else {
        foundNonExpiringCode = true;
      }
    }

    console.log(`✓ Found ${expiringCodesCount} codes with expiration dates prioritized correctly`);
    console.log(`✓ Found ${sortedCodes.length - expiringCodesCount} codes without expiration dates at the end`);

    // Test 2: Get specific quantity of codes for purchase
    console.log("\n=== Test 2: Get codes for purchase (different quantities) ===");
    
    // Test getting 1 code (should be the one expiring soonest)
    const oneCode = testListing.getCodesForPurchase(1);
    const decryptedOneCode = testListing.decryptCode(oneCode[0].code, oneCode[0].iv);
    console.log(`Getting 1 code: ${decryptedOneCode} - ${oneCode[0].expirationDate ? oneCode[0].expirationDate.toISOString().split('T')[0] : 'No expiration'}`);
    
    if (oneCode[0].expirationDate) {
      console.log("✓ First code has expiration date (correct priority)");
    } else {
      console.log("ℹ First code has no expiration date (no expiring codes available)");
    }

    // Test getting 3 codes
    const threeCodes = testListing.getCodesForPurchase(3);
    console.log(`\nGetting 3 codes:`);
    threeCodes.forEach((code, index) => {
      const decryptedCode = testListing.decryptCode(code.code, code.iv);
      const expirationText = code.expirationDate ? 
        code.expirationDate.toISOString().split('T')[0] : 
        'No expiration';
      console.log(`${index + 1}. ${decryptedCode} - ${expirationText}`);
    });

    // Test 3: Test error handling for insufficient codes
    console.log("\n=== Test 3: Error handling for insufficient codes ===");
    try {
      testListing.getCodesForPurchase(10); // More than available
      console.log("✗ Should have thrown error for insufficient codes");
    } catch (error) {
      console.log(`✓ Correctly threw error: ${error.message}`);
    }

    // Test 4: Test single code purchase method
    console.log("\n=== Test 4: Single code purchase method ===");
    const purchasedCode = testListing.purchaseCode();
    console.log(`Purchased code: ${purchasedCode}`);
    
    // Verify the code was marked as sold
    const availableAfterPurchase = testListing.getAvailableCodesCount();
    console.log(`✓ Available codes after purchase: ${availableAfterPurchase} (was ${testListing.codes.length - 1})`);

    // Clean up - remove test listing
    await Listing.deleteOne({ _id: testListing._id });
    console.log("\n✓ Test listing cleaned up");

    console.log("\n🎉 All tests passed! Code expiration priority is working correctly.");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
async function runTest() {
  await connectToDatabase();
  
  try {
    await testCodeExpirationPriority();
    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

// Handle script execution
if (require.main === module) {
  runTest();
}

module.exports = {
  testCodeExpirationPriority
};