/**
 * Integration test to verify code expiration priority in real purchasing scenario
 * This test simulates the complete order flow with expiration date prioritization
 */

const mongoose = require("mongoose");
const { Listing } = require("../models/listing");
const { User } = require("../models/user");
const { Order } = require("../models/order");
const { Wallet } = require("../models/wallet");
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

// Integration test function
async function integrationTestCodeExpiration() {
  console.log("Starting integration test for code expiration priority...\n");

  let testListing = null;
  let testSeller = null;
  let testBuyer = null;

  try {
    // 1. Create test seller and buyer
    console.log("=== Step 1: Creating test users ===");
    
    testSeller = await User.create({
      name: "Test Seller",
      uid: "integration-test-seller-uid",
      email: "testseller@example.com",
      roles: ["seller"],
      provider: "email",
      isEmailConfirmed: true
    });

    testBuyer = await User.create({
      name: "Test Buyer",
      uid: "integration-test-buyer-uid",
      email: "testbuyer@example.com",
      roles: ["buyer"],
      provider: "email",
      isEmailConfirmed: true
    });

    console.log(`✓ Created seller: ${testSeller.name} (${testSeller._id})`);
    console.log(`✓ Created buyer: ${testBuyer.name} (${testBuyer._id})`);

    // 2. Create buyer wallet with funds
    console.log("\n=== Step 2: Setting up buyer wallet ===");
    
    const wallet = await Wallet.create({
      userId: testBuyer._id,
      balance: 100.00,
      currency: "USD"
    });

    console.log(`✓ Created wallet with $${wallet.balance} balance`);

    // 3. Create test listing with mixed expiration codes
    console.log("\n=== Step 3: Creating test listing with mixed expiration codes ===");
    
    testListing = new Listing({
      title: "Integration Test - Mixed Expiration Codes",
      description: "Testing code priority in real purchase flow",
      price: 5.00,
      categoryId: new mongoose.Types.ObjectId(),
      platform: "Test Platform",
      region: "Global",
      sellerId: testSeller.uid
    });

    // Add codes with strategic expiration dates
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Expired (should not be sold)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const testCodes = [
      { code: "NO-EXPIRY-CODE-1", expirationDate: null },
      { code: "EXPIRES-TOMORROW", expirationDate: tomorrow },
      { code: "NO-EXPIRY-CODE-2", expirationDate: null },
      { code: "EXPIRED-CODE", expirationDate: yesterday }, // This should be marked as expired
      { code: "EXPIRES-NEXT-WEEK", expirationDate: nextWeek },
      { code: "NO-EXPIRY-CODE-3", expirationDate: null }
    ];

    testListing.addCodes(testCodes);
    await testListing.save();

    console.log(`✓ Created listing with ${testListing.codes.length} codes`);
    
    // Check initial code statuses
    const activeCodes = testListing.getAvailableCodesCount();
    console.log(`✓ Active codes: ${activeCodes} (should be 5, excluding expired code)`);

    // 4. Test code prioritization
    console.log("\n=== Step 4: Testing code prioritization ===");
    
    const sortedCodes = testListing.getActiveCodesSortedByExpiration();
    console.log("Code purchase order:");
    sortedCodes.forEach((code, index) => {
      const decryptedCode = testListing.decryptCode(code.code, code.iv);
      const expirationText = code.expirationDate ? 
        code.expirationDate.toISOString().split('T')[0] : 
        'No expiration';
      console.log(`${index + 1}. ${decryptedCode} - ${expirationText}`);
    });

    // Verify expiring codes come first
    const firstCode = sortedCodes[0];
    const firstCodeDecrypted = testListing.decryptCode(firstCode.code, firstCode.iv);
    if (firstCodeDecrypted === "EXPIRES-TOMORROW") {
      console.log("✓ Closest expiring code is prioritized correctly");
    } else {
      throw new Error(`Expected first code to be 'EXPIRES-TOMORROW', got '${firstCodeDecrypted}'`);
    }

    // 5. Simulate single code purchase
    console.log("\n=== Step 5: Testing single code purchase ===");
    
    const purchasedCode = testListing.purchaseCode();
    console.log(`✓ Purchased code: ${purchasedCode}`);
    
    if (purchasedCode === "EXPIRES-TOMORROW") {
      console.log("✓ Correct code was purchased (closest to expiration)");
    } else {
      throw new Error(`Expected to purchase 'EXPIRES-TOMORROW', got '${purchasedCode}'`);
    }

    // Verify code was marked as sold
    const codeAfterPurchase = testListing.codes.find(code => {
      return testListing.decryptCode(code.code, code.iv) === "EXPIRES-TOMORROW";
    });
    
    if (codeAfterPurchase && codeAfterPurchase.soldStatus === "sold") {
      console.log("✓ Purchased code was correctly marked as sold");
    } else {
      throw new Error("Purchased code was not marked as sold");
    }

    // 6. Test getting multiple codes for purchase
    console.log("\n=== Step 6: Testing multiple codes for purchase ===");
    
    const multipleCodesForPurchase = testListing.getCodesForPurchase(2);
    console.log("Next 2 codes that would be purchased:");
    multipleCodesForPurchase.forEach((code, index) => {
      const decryptedCode = testListing.decryptCode(code.code, code.iv);
      const expirationText = code.expirationDate ? 
        code.expirationDate.toISOString().split('T')[0] : 
        'No expiration';
      console.log(`${index + 1}. ${decryptedCode} - ${expirationText}`);
    });

    // Verify the next code with expiration is prioritized
    const nextCodeDecrypted = testListing.decryptCode(multipleCodesForPurchase[0].code, multipleCodesForPurchase[0].iv);
    if (nextCodeDecrypted === "EXPIRES-NEXT-WEEK") {
      console.log("✓ Next expiring code is correctly prioritized");
    } else {
      throw new Error(`Expected next code to be 'EXPIRES-NEXT-WEEK', got '${nextCodeDecrypted}'`);
    }

    console.log("\n🎉 All integration tests passed!");
    console.log("✅ Code expiration priority is working correctly in the complete purchase flow");

  } catch (error) {
    console.error("❌ Integration test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Clean up test data
    console.log("\n=== Cleanup ===");
    
    if (testListing) {
      await Listing.deleteOne({ _id: testListing._id });
      console.log("✓ Test listing cleaned up");
    }
    
    if (testSeller) {
      await User.deleteOne({ _id: testSeller._id });
      console.log("✓ Test seller cleaned up");
    }
    
    if (testBuyer) {
      await User.deleteOne({ _id: testBuyer._id });
      await Wallet.deleteOne({ userId: testBuyer._id });
      console.log("✓ Test buyer and wallet cleaned up");
    }
  }
}

// Run the integration test
async function runIntegrationTest() {
  await connectToDatabase();
  
  try {
    await integrationTestCodeExpiration();
    console.log("\n✅ Integration test completed successfully!");
  } catch (error) {
    console.error("\n❌ Integration test failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

// Handle script execution
if (require.main === module) {
  runIntegrationTest();
}

module.exports = {
  integrationTestCodeExpiration
};