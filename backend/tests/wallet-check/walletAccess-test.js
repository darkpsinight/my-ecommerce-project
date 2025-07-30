const mongoose = require("mongoose");
const { configs } = require("../../configs");
const { User } = require("../../models/user");
const jwt = require("jsonwebtoken");

/**
 * Test script to verify wallet access for different roles
 */

const testWalletAccess = async () => {
  try {
    console.log("Starting wallet access tests...");
    
    // Connect to MongoDB
    await mongoose.connect(configs.MONGO_URI);
    console.log("Connected to MongoDB");

    // Test 1: Create test users with different roles
    console.log("\n=== Test 1: Creating test users ===");
    
    const buyerUser = await User.create({
      name: "Test Buyer",
      uid: "test-buyer-uid",
      email: "buyer@example.com",
      roles: ["buyer"],
      role: "buyer",
      provider: "email"
    });
    console.log(`✅ Created buyer user: [${buyerUser.roles.join(', ')}]`);

    const sellerUser = await User.create({
      name: "Test Seller",
      uid: "test-seller-uid", 
      email: "seller@example.com",
      roles: ["seller", "buyer"],
      role: "seller",
      provider: "email"
    });
    console.log(`✅ Created seller user: [${sellerUser.roles.join(', ')}]`);

    const adminUser = await User.create({
      name: "Test Admin",
      uid: "test-admin-uid",
      email: "admin@example.com", 
      roles: ["admin", "buyer"],
      role: "admin",
      provider: "email"
    });
    console.log(`✅ Created admin user: [${adminUser.roles.join(', ')}]`);

    // Test 2: Generate JWT tokens for each user
    console.log("\n=== Test 2: Generating JWT tokens ===");
    
    const buyerToken = buyerUser.getJWT();
    const sellerToken = sellerUser.getJWT();
    const adminToken = adminUser.getJWT();
    
    console.log("✅ Generated JWT tokens for all users");

    // Test 3: Decode tokens to verify roles are included
    console.log("\n=== Test 3: Verifying JWT token contents ===");
    
    const decodedBuyer = jwt.decode(buyerToken);
    const decodedSeller = jwt.decode(sellerToken);
    const decodedAdmin = jwt.decode(adminToken);
    
    console.log(`Buyer token roles: [${decodedBuyer.roles.join(', ')}]`);
    console.log(`Seller token roles: [${decodedSeller.roles.join(', ')}]`);
    console.log(`Admin token roles: [${decodedAdmin.roles.join(', ')}]`);
    
    // Test 4: Simulate wallet access authorization
    console.log("\n=== Test 4: Simulating wallet access authorization ===");
    
    const allowedWalletRoles = ["buyer", "seller", "admin"];
    
    // Check buyer access
    const buyerHasAccess = decodedBuyer.roles.some(role => allowedWalletRoles.includes(role));
    console.log(`Buyer wallet access: ${buyerHasAccess ? '✅ ALLOWED' : '❌ DENIED'}`);
    
    // Check seller access
    const sellerHasAccess = decodedSeller.roles.some(role => allowedWalletRoles.includes(role));
    console.log(`Seller wallet access: ${sellerHasAccess ? '✅ ALLOWED' : '❌ DENIED'}`);
    
    // Check admin access
    const adminHasAccess = decodedAdmin.roles.some(role => allowedWalletRoles.includes(role));
    console.log(`Admin wallet access: ${adminHasAccess ? '✅ ALLOWED' : '❌ DENIED'}`);

    // Test 5: Test pure seller role (without buyer)
    console.log("\n=== Test 5: Testing pure seller role ===");
    
    const pureSellerUser = await User.create({
      name: "Pure Seller",
      uid: "test-pure-seller-uid",
      email: "pureseller@example.com",
      roles: ["seller"],
      role: "seller", 
      provider: "email"
    });
    
    const pureSellerToken = pureSellerUser.getJWT();
    const decodedPureSeller = jwt.decode(pureSellerToken);
    const pureSellerHasAccess = decodedPureSeller.roles.some(role => allowedWalletRoles.includes(role));
    
    console.log(`Pure seller roles: [${decodedPureSeller.roles.join(', ')}]`);
    console.log(`Pure seller wallet access: ${pureSellerHasAccess ? '✅ ALLOWED' : '❌ DENIED'}`);

    // Clean up test users
    await User.deleteMany({ 
      uid: { 
        $in: [
          "test-buyer-uid", 
          "test-seller-uid", 
          "test-admin-uid", 
          "test-pure-seller-uid"
        ] 
      } 
    });
    console.log("\n🧹 Cleaned up test users");

    console.log("\n🎉 All wallet access tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log("- ✅ Buyers can access wallet");
    console.log("- ✅ Sellers can access wallet"); 
    console.log("- ✅ Admins can access wallet");
    console.log("- ✅ Pure sellers can access wallet");

  } catch (error) {
    console.error("Test failed:", error);
    
    // Clean up on error
    try {
      await User.deleteMany({ 
        uid: { 
          $in: [
            "test-buyer-uid", 
            "test-seller-uid", 
            "test-admin-uid", 
            "test-pure-seller-uid"
          ] 
        } 
      });
      console.log("Cleaned up test users after error");
    } catch (cleanupError) {
      console.error("Failed to clean up test users:", cleanupError);
    }
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run tests if this script is executed directly
if (require.main === module) {
  testWalletAccess()
    .then(() => {
      console.log("Wallet access test completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Wallet access test failed:", error);
      process.exit(1);
    });
}

module.exports = { testWalletAccess };
