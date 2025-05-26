const mongoose = require("mongoose");
const { configs } = require("../configs");
const { User } = require("../models/user");

/**
 * Migration script to convert single role field to roles array
 * This script ensures backward compatibility during the transition
 */

const migrateUserRoles = async () => {
  try {
    console.log("Starting user roles migration...");
    
    // Connect to MongoDB
    await mongoose.connect(configs.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find all users that don't have roles array or have empty roles array
    const usersToMigrate = await User.find({
      $or: [
        { roles: { $exists: false } },
        { roles: { $size: 0 } },
        { roles: null }
      ]
    });

    console.log(`Found ${usersToMigrate.length} users to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const user of usersToMigrate) {
      try {
        // Initialize roles array based on existing role field
        if (user.role && !user.roles) {
          user.roles = [user.role];
          
          // Special cases for enhanced functionality
          if (user.role === "admin") {
            // Admin should also have buyer role for wallet access
            user.roles = ["admin", "buyer"];
          } else if (user.role === "seller") {
            // Seller should also have buyer role for wallet access
            user.roles = ["seller", "buyer"];
          }
          
          await user.save();
          migratedCount++;
          console.log(`Migrated user ${user.email}: ${user.role} -> [${user.roles.join(', ')}]`);
        }
      } catch (error) {
        console.error(`Error migrating user ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log(`Migration completed:`);
    console.log(`- Successfully migrated: ${migratedCount} users`);
    console.log(`- Errors: ${errorCount} users`);

    // Verify migration
    const usersWithoutRoles = await User.countDocuments({
      $or: [
        { roles: { $exists: false } },
        { roles: { $size: 0 } },
        { roles: null }
      ]
    });

    if (usersWithoutRoles === 0) {
      console.log("✅ All users now have roles array!");
    } else {
      console.log(`⚠️  ${usersWithoutRoles} users still need migration`);
    }

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run migration if this script is executed directly
if (require.main === module) {
  migrateUserRoles()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateUserRoles };
