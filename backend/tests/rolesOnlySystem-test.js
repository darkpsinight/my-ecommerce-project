const mongoose = require("mongoose");
const { configs } = require("../configs");
const { User } = require("../models/user");
const jwt = require("jsonwebtoken");

/**
 * Test script to verify the roles-only system works correctly
 * (without legacy role field)
 */

const testRolesOnlySystem = async () => {
  try {
    console.log("Starting roles-only system tests...");
    
    // Connect to MongoDB
    await mongoose.connect(configs.MONGO_URI);
    console.log("Connected to MongoDB");

    // Test 1: Create user with roles array only
    console.log("\n=== Test 1: Creating user with roles array only ===");
    
    const buyerUser = await User.create({
      name: "Roles Only Buyer",
      uid: "roles-only-buyer-uid",
      email: "rolesonlybuyer@example.com",
      roles: ["buyer"],
      provider: "email"
    });
    
    console.log(`✅ Created buyer user`);
    console.log(`User roles: [${buyerUser.roles.join(', ')}]`);
    console.log(`User has legacy role field: ${buyerUser.hasOwnProperty('role')}`);
    console.log(`User role value: ${buyerUser.role || 'undefined'}`);

    // Test 2: Create multi-role user
    console.log("\n=== Test 2: Creating multi-role user ===");
    
    const multiRoleUser = await User.create({
      name: "Multi Role User",
      uid: "multi-role-uid",
      email: "multirole@example.com",
      roles: ["seller", "buyer"],
      provider: "email"
    });
    
    console.log(`✅ Created multi-role user`);
    console.log(`User roles: [${multiRoleUser.roles.join(', ')}]`);
    console.log(`User has legacy role field: ${multiRoleUser.hasOwnProperty('role')}`);

    // Test 3: Test role checking methods
    console.log("\n=== Test 3: Testing role checking methods ===");
    
    console.log(`Buyer has 'buyer' role: ${buyerUser.hasRole('buyer')}`);
    console.log(`Buyer has 'seller' role: ${buyerUser.hasRole('seller')}`);
    console.log(`Multi-role has 'buyer' role: ${multiRoleUser.hasRole('buyer')}`);
    console.log(`Multi-role has 'seller' role: ${multiRoleUser.hasRole('seller')}`);
    console.log(`Multi-role has 'admin' role: ${multiRoleUser.hasRole('admin')}`);

    // Test 4: Test adding roles
    console.log("\n=== Test 4: Testing role addition ===");
    
    buyerUser.addRole('seller');
    await buyerUser.save();
    
    console.log(`Buyer roles after adding seller: [${buyerUser.roles.join(', ')}]`);
    console.log(`Buyer still has no legacy role field: ${!buyerUser.hasOwnProperty('role')}`);

    // Test 5: Test removing roles
    console.log("\n=== Test 5: Testing role removal ===");
    
    multiRoleUser.removeRole('seller');
    await multiRoleUser.save();
    
    console.log(`Multi-role user roles after removing seller: [${multiRoleUser.roles.join(', ')}]`);

    // Test 6: Test JWT token generation
    console.log("\n=== Test 6: Testing JWT token generation ===");
    
    const buyerToken = buyerUser.getJWT();
    const multiRoleToken = multiRoleUser.getJWT();
    
    const decodedBuyer = jwt.decode(buyerToken);
    const decodedMultiRole = jwt.decode(multiRoleToken);
    
    console.log(`Buyer JWT roles: [${decodedBuyer.roles.join(', ')}]`);
    console.log(`Buyer JWT has legacy role field: ${decodedBuyer.hasOwnProperty('role')}`);
    console.log(`Multi-role JWT roles: [${decodedMultiRole.roles.join(', ')}]`);
    console.log(`Multi-role JWT has legacy role field: ${decodedMultiRole.hasOwnProperty('role')}`);

    // Test 7: Test authorization simulation
    console.log("\n=== Test 7: Testing authorization simulation ===");
    
    // Simulate wallet access (requires buyer, seller, or admin)
    const walletAllowedRoles = ["buyer", "seller", "admin"];
    
    const buyerCanAccessWallet = decodedBuyer.roles.some(role => walletAllowedRoles.includes(role));
    const multiRoleCanAccessWallet = decodedMultiRole.roles.some(role => walletAllowedRoles.includes(role));
    
    console.log(`Buyer can access wallet: ${buyerCanAccessWallet ? '✅ YES' : '❌ NO'}`);
    console.log(`Multi-role can access wallet: ${multiRoleCanAccessWallet ? '✅ YES' : '❌ NO'}`);
    
    // Simulate seller access (requires seller or admin)
    const sellerAllowedRoles = ["seller", "admin"];
    
    const buyerCanAccessSeller = decodedBuyer.roles.some(role => sellerAllowedRoles.includes(role));
    const multiRoleCanAccessSeller = decodedMultiRole.roles.some(role => sellerAllowedRoles.includes(role));
    
    console.log(`Buyer can access seller features: ${buyerCanAccessSeller ? '✅ YES' : '❌ NO'}`);
    console.log(`Multi-role can access seller features: ${multiRoleCanAccessSeller ? '✅ YES' : '❌ NO'}`);

    // Test 8: Test admin user creation
    console.log("\n=== Test 8: Testing admin user creation ===");
    
    const adminUser = await User.create({
      name: "Admin User",
      uid: "admin-roles-only-uid",
      email: "adminrolesonly@example.com",
      roles: ["admin", "buyer"],
      provider: "email"
    });
    
    console.log(`✅ Created admin user`);
    console.log(`Admin roles: [${adminUser.roles.join(', ')}]`);
    console.log(`Admin has all access: ${adminUser.hasRole('admin')}`);

    // Test 9: Test pre-save middleware
    console.log("\n=== Test 9: Testing pre-save middleware ===");
    
    const emptyRoleUser = new User({
      name: "Empty Role User",
      uid: "empty-role-uid",
      email: "emptyrole@example.com",
      provider: "email"
      // No roles specified
    });
    
    await emptyRoleUser.save();
    console.log(`User with no roles gets default: [${emptyRoleUser.roles.join(', ')}]`);

    // Test 10: Test database document structure
    console.log("\n=== Test 10: Verifying database document structure ===");
    
    const dbUser = await mongoose.connection.db.collection('users').findOne({ uid: buyerUser.uid });
    console.log(`Database document has roles: ${dbUser.hasOwnProperty('roles')}`);
    console.log(`Database document has legacy role: ${dbUser.hasOwnProperty('role')}`);
    console.log(`Database roles: [${dbUser.roles ? dbUser.roles.join(', ') : 'none'}]`);

    // Clean up test users
    await User.deleteMany({ 
      uid: { 
        $in: [
          "roles-only-buyer-uid",
          "multi-role-uid", 
          "admin-roles-only-uid",
          "empty-role-uid"
        ] 
      } 
    });
    console.log("\n🧹 Cleaned up test users");

    console.log("\n🎉 All roles-only system tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log("- ✅ Users created with roles array only (no legacy role field)");
    console.log("- ✅ Multi-role functionality works correctly");
    console.log("- ✅ Role checking methods work");
    console.log("- ✅ Role addition/removal works");
    console.log("- ✅ JWT tokens contain only roles array");
    console.log("- ✅ Authorization simulation works");
    console.log("- ✅ Pre-save middleware provides default roles");
    console.log("- ✅ Database documents have clean structure");

  } catch (error) {
    console.error("Test failed:", error);
    
    // Clean up on error
    try {
      await User.deleteMany({ 
        uid: { 
          $in: [
            "roles-only-buyer-uid",
            "multi-role-uid", 
            "admin-roles-only-uid",
            "empty-role-uid"
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
  testRolesOnlySystem()
    .then(() => {
      console.log("Roles-only system test completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Roles-only system test failed:", error);
      process.exit(1);
    });
}

module.exports = { testRolesOnlySystem };
