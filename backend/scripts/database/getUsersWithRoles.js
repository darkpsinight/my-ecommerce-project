const { connectDB, disconnectDB } = require("./dbConnection");
const { User } = require("./userModel");

/**
 * Script to connect to database and retrieve all users with their roles
 * Usage: node backend/scripts/database/getUsersWithRoles.js
 */

const getUsersWithRoles = async () => {
  try {
    console.log("Connecting to database...");
    
    // Connect to MongoDB
    await connectDB();

    // Fetch all users with selected fields
    const users = await User.find(
      { isDeactivated: { $ne: true } }, // Exclude deactivated users
      {
        name: 1,
        email: 1,
        roles: 1,
        isEmailConfirmed: 1,
        provider: 1,
        createdAt: 1,
        _id: 1
      }
    ).sort({ createdAt: -1 }); // Sort by newest first

    console.log(`\n📊 Found ${users.length} active users\n`);
    console.log("=" .repeat(80));
    console.log("USER LIST WITH ROLES");
    console.log("=" .repeat(80));

    if (users.length === 0) {
      console.log("No users found in the database.");
      return [];
    }

    // Display users in a formatted table
    users.forEach((user, index) => {
      const rolesDisplay = user.roles ? user.roles.join(", ") : "No roles";
      const emailStatus = user.isEmailConfirmed ? "✅" : "❌";
      const createdDate = user.createdAt.toLocaleDateString();
      
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email} ${emailStatus}`);
      console.log(`   Roles: ${rolesDisplay}`);
      console.log(`   Provider: ${user.provider || "N/A"}`);
      console.log(`   Created: ${createdDate}`);
      console.log(`   ID: ${user._id}`);
      console.log("-" .repeat(50));
    });

    // Summary statistics
    const roleStats = {};
    users.forEach(user => {
      if (user.roles) {
        user.roles.forEach(role => {
          roleStats[role] = (roleStats[role] || 0) + 1;
        });
      }
    });

    console.log("\n📈 ROLE STATISTICS:");
    console.log("=" .repeat(30));
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`${role}: ${count} users`);
    });

    const confirmedUsers = users.filter(user => user.isEmailConfirmed).length;
    console.log(`\n📧 Email Confirmation: ${confirmedUsers}/${users.length} confirmed`);

    return users;

  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Export for use in other scripts
const getUsersByRole = async (targetRole) => {
  try {
    await connectDB();
    
    const users = await User.find(
      { 
        roles: targetRole,
        isDeactivated: { $ne: true }
      },
      {
        name: 1,
        email: 1,
        roles: 1,
        isEmailConfirmed: 1,
        createdAt: 1
      }
    ).sort({ createdAt: -1 });

    return users;
  } catch (error) {
    console.error(`Error fetching users with role ${targetRole}:`, error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Run script if executed directly
if (require.main === module) {
  getUsersWithRoles()
    .then((users) => {
      console.log(`\n✅ Script completed successfully. Retrieved ${users.length} users.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = {
  getUsersWithRoles,
  getUsersByRole
};