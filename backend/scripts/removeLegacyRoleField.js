const mongoose = require("mongoose");
const { configs } = require("../configs");

/**
 * Migration script to remove the legacy 'role' field from all users
 * Now that we're using the 'roles' array exclusively
 */

const removeLegacyRoleField = async () => {
  try {
    console.log("Starting legacy role field removal...");
    
    // Connect to MongoDB
    await mongoose.connect(configs.MONGO_URI);
    console.log("Connected to MongoDB");

    // Get database instance
    const db = mongoose.connection.db;
    
    // Check current state
    console.log("\n=== Checking current user documents ===");
    const sampleUsers = await db.collection('users').find({}).limit(3).toArray();
    
    console.log("Sample user documents before migration:");
    sampleUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Roles: [${user.roles ? user.roles.join(', ') : 'none'}]`);
      console.log(`  - Legacy Role: ${user.role || 'none'}`);
      console.log(`  - Has role field: ${user.hasOwnProperty('role')}`);
    });

    // Count users with legacy role field
    const usersWithRoleField = await db.collection('users').countDocuments({ role: { $exists: true } });
    console.log(`\nUsers with legacy 'role' field: ${usersWithRoleField}`);

    if (usersWithRoleField === 0) {
      console.log("✅ No users have legacy role field. Migration not needed.");
      return;
    }

    // Verify all users have roles array before removing role field
    console.log("\n=== Verifying users have roles array ===");
    const usersWithoutRoles = await db.collection('users').countDocuments({
      $or: [
        { roles: { $exists: false } },
        { roles: { $size: 0 } },
        { roles: null }
      ]
    });

    if (usersWithoutRoles > 0) {
      console.log(`❌ Found ${usersWithoutRoles} users without proper roles array.`);
      console.log("Please run the role migration script first: node scripts/migrateUserRoles.js");
      return;
    }

    console.log("✅ All users have proper roles array");

    // Remove the legacy role field from all users
    console.log("\n=== Removing legacy role field ===");
    
    const result = await db.collection('users').updateMany(
      { role: { $exists: true } },
      { $unset: { role: "" } }
    );

    console.log(`✅ Updated ${result.modifiedCount} users`);
    console.log(`Matched ${result.matchedCount} users`);

    // Verify removal
    console.log("\n=== Verifying removal ===");
    const remainingUsersWithRole = await db.collection('users').countDocuments({ role: { $exists: true } });
    
    if (remainingUsersWithRole === 0) {
      console.log("✅ Successfully removed legacy role field from all users");
    } else {
      console.log(`⚠️  ${remainingUsersWithRole} users still have legacy role field`);
    }

    // Show sample users after migration
    console.log("\n=== Sample user documents after migration ===");
    const updatedSampleUsers = await db.collection('users').find({}).limit(3).toArray();
    
    updatedSampleUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Roles: [${user.roles ? user.roles.join(', ') : 'none'}]`);
      console.log(`  - Has role field: ${user.hasOwnProperty('role')}`);
    });

    // Test user creation with new schema
    console.log("\n=== Testing user creation with new schema ===");
    
    const { User } = require("../models/user");
    
    try {
      const testUser = new User({
        name: "Test User No Role",
        uid: "test-no-role-uid",
        email: "testnoRole@example.com",
        roles: ["buyer"],
        provider: "email"
      });
      
      await testUser.save();
      console.log("✅ Successfully created user with new schema (roles only)");
      console.log(`Test user roles: [${testUser.roles.join(', ')}]`);
      console.log(`Test user has role field: ${testUser.hasOwnProperty('role')}`);
      
      // Clean up test user
      await User.deleteOne({ uid: "test-no-role-uid" });
      console.log("Cleaned up test user");
      
    } catch (error) {
      console.log(`❌ Failed to create user with new schema: ${error.message}`);
    }

    console.log("\n🎉 Legacy role field removal completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`- Removed legacy 'role' field from ${result.modifiedCount} users`);
    console.log("- All users now use 'roles' array exclusively");
    console.log("- User model schema updated to remove role field");
    console.log("- JWT tokens now only include 'roles' array");

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run migration if this script is executed directly
if (require.main === module) {
  removeLegacyRoleField()
    .then(() => {
      console.log("Legacy role field removal completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Legacy role field removal failed:", error);
      process.exit(1);
    });
}

module.exports = { removeLegacyRoleField };
