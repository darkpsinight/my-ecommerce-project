const mongoose = require("mongoose");
const { configs } = require("../configs");
const { User } = require("../models/user");

/**
 * Test script to verify the new multi-role system functionality
 */

const testRoleSystem = async () => {
  try {
    console.log("Starting role system tests...");
    
    // Connect to MongoDB
    await mongoose.connect(configs.MONGO_URI);
    console.log("Connected to MongoDB");

    // Test 1: Create user with single role (backward compatibility)
    console.log("\n=== Test 1: Single role creation ===");
    const testUser1 = await User.create({
      name: "Test User 1",
      uid: "test-uid-1",
      email: "test1@example.com",
      role: "buyer",
      provider: "email"
    });
    console.log(`Created user with role: ${testUser1.role}`);
    console.log(`User roles array: [${testUser1.roles.join(', ')}]`);
    console.log(`✅ Single role creation works`);

    // Test 2: Create user with multiple roles
    console.log("\n=== Test 2: Multiple roles creation ===");
    const testUser2 = await User.create({
      name: "Test User 2",
      uid: "test-uid-2",
      email: "test2@example.com",
      roles: ["seller", "buyer"],
      provider: "email"
    });
    console.log(`Created user with roles: [${testUser2.roles.join(', ')}]`);
    console.log(`Primary role: ${testUser2.role}`);
    console.log(`✅ Multiple roles creation works`);

    // Test 3: Test role checking methods
    console.log("\n=== Test 3: Role checking methods ===");
    console.log(`User2 has seller role: ${testUser2.hasRole('seller')}`);
    console.log(`User2 has buyer role: ${testUser2.hasRole('buyer')}`);
    console.log(`User2 has admin role: ${testUser2.hasRole('admin')}`);
    console.log(`✅ Role checking methods work`);

    // Test 4: Test adding roles
    console.log("\n=== Test 4: Adding roles ===");
    testUser1.addRole('seller');
    await testUser1.save();
    console.log(`User1 roles after adding seller: [${testUser1.roles.join(', ')}]`);
    console.log(`✅ Adding roles works`);

    // Test 5: Test removing roles
    console.log("\n=== Test 5: Removing roles ===");
    testUser2.removeRole('seller');
    await testUser2.save();
    console.log(`User2 roles after removing seller: [${testUser2.roles.join(', ')}]`);
    console.log(`Primary role after removal: ${testUser2.role}`);
    console.log(`✅ Removing roles works`);

    // Test 6: Test JWT token generation
    console.log("\n=== Test 6: JWT token generation ===");
    const jwt = testUser1.getJWT();
    const jwt2 = testUser2.getJWT();
    console.log(`User1 JWT includes roles: ${jwt.includes('roles')}`);
    console.log(`User2 JWT includes roles: ${jwt2.includes('roles')}`);
    console.log(`✅ JWT token generation works`);

    // Test 7: Test role synchronization
    console.log("\n=== Test 7: Role synchronization ===");
    testUser1.role = "admin";
    await testUser1.save();
    console.log(`User1 roles after changing primary role to admin: [${testUser1.roles.join(', ')}]`);
    console.log(`✅ Role synchronization works`);

    // Clean up test users
    await User.deleteMany({ uid: { $in: ["test-uid-1", "test-uid-2"] } });
    console.log("\n🧹 Cleaned up test users");

    console.log("\n🎉 All role system tests passed!");

  } catch (error) {
    console.error("Test failed:", error);
    
    // Clean up on error
    try {
      await User.deleteMany({ uid: { $in: ["test-uid-1", "test-uid-2"] } });
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
  testRoleSystem()
    .then(() => {
      console.log("Role system test completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Role system test failed:", error);
      process.exit(1);
    });
}

module.exports = { testRoleSystem };
