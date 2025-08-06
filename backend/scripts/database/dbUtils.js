const { connectDB, disconnectDB } = require("./dbConnection");
const { User } = require("./userModel");

/**
 * Database utility functions for user management
 * This module provides reusable functions for common database operations
 */

class DatabaseUtils {
  constructor() {
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    if (!this.isConnected) {
      await connectDB();
      this.isConnected = true;
    }
    return this;
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    if (this.isConnected) {
      await disconnectDB();
      this.isConnected = false;
    }
  }

  /**
   * Get all users with their roles
   */
  async getAllUsersWithRoles() {
    await this.connect();
    
    return await User.find(
      { isDeactivated: { $ne: true } },
      {
        name: 1,
        email: 1,
        roles: 1,
        isEmailConfirmed: 1,
        provider: 1,
        createdAt: 1,
        _id: 1
      }
    ).sort({ createdAt: -1 });
  }

  /**
   * Get users by specific role
   */
  async getUsersByRole(role) {
    await this.connect();
    
    return await User.find(
      { 
        roles: role,
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
  }

  /**
   * Get users by multiple roles
   */
  async getUsersByRoles(roles) {
    await this.connect();
    
    return await User.find(
      { 
        roles: { $in: roles },
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
  }

  /**
   * Get user count by role
   */
  async getUserCountByRole() {
    await this.connect();
    
    const pipeline = [
      { $match: { isDeactivated: { $ne: true } } },
      { $unwind: "$roles" },
      { $group: { _id: "$roles", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ];

    return await User.aggregate(pipeline);
  }

  /**
   * Get users with unconfirmed emails
   */
  async getUnconfirmedUsers() {
    await this.connect();
    
    return await User.find(
      { 
        isEmailConfirmed: false,
        isDeactivated: { $ne: true }
      },
      {
        name: 1,
        email: 1,
        roles: 1,
        createdAt: 1
      }
    ).sort({ createdAt: -1 });
  }

  /**
   * Get recently registered users (last N days)
   */
  async getRecentUsers(days = 7) {
    await this.connect();
    
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return await User.find(
      { 
        createdAt: { $gte: dateThreshold },
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
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    await this.connect();
    
    const totalUsers = await User.countDocuments({ isDeactivated: { $ne: true } });
    const confirmedUsers = await User.countDocuments({ 
      isEmailConfirmed: true, 
      isDeactivated: { $ne: true } 
    });
    const deactivatedUsers = await User.countDocuments({ isDeactivated: true });
    
    const roleStats = await this.getUserCountByRole();
    
    const providerStats = await User.aggregate([
      { $match: { isDeactivated: { $ne: true } } },
      { $group: { _id: "$provider", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return {
      total: totalUsers,
      confirmed: confirmedUsers,
      deactivated: deactivatedUsers,
      roles: roleStats,
      providers: providerStats
    };
  }

  /**
   * Search users by name or email
   */
  async searchUsers(searchTerm) {
    await this.connect();
    
    return await User.find(
      {
        $and: [
          { isDeactivated: { $ne: true } },
          {
            $or: [
              { name: { $regex: searchTerm, $options: 'i' } },
              { email: { $regex: searchTerm, $options: 'i' } }
            ]
          }
        ]
      },
      {
        name: 1,
        email: 1,
        roles: 1,
        isEmailConfirmed: 1,
        createdAt: 1
      }
    ).sort({ createdAt: -1 });
  }

  /**
   * Get users with wallet information
   */
  async getUsersWithWallets() {
    await this.connect();
    
    return await User.find(
      { 
        walletId: { $exists: true, $ne: null },
        isDeactivated: { $ne: true }
      },
      {
        name: 1,
        email: 1,
        roles: 1,
        walletId: 1,
        stripeCustomerId: 1,
        createdAt: 1
      }
    ).populate('walletId').sort({ createdAt: -1 });
  }

  /**
   * Format users for display
   */
  formatUsersForDisplay(users) {
    return users.map((user, index) => ({
      index: index + 1,
      name: user.name,
      email: user.email,
      roles: user.roles ? user.roles.join(', ') : 'No roles',
      emailConfirmed: user.isEmailConfirmed ? '✅' : '❌',
      provider: user.provider || 'N/A',
      created: user.createdAt.toLocaleDateString(),
      id: user._id.toString()
    }));
  }

  /**
   * Print users in a formatted table
   */
  printUsersTable(users, title = "Users List") {
    console.log(`\n${"=".repeat(80)}`);
    console.log(title.toUpperCase());
    console.log(`${"=".repeat(80)}`);

    if (users.length === 0) {
      console.log("No users found.");
      return;
    }

    const formatted = this.formatUsersForDisplay(users);
    
    formatted.forEach(user => {
      console.log(`${user.index}. ${user.name}`);
      console.log(`   Email: ${user.email} ${user.emailConfirmed}`);
      console.log(`   Roles: ${user.roles}`);
      console.log(`   Provider: ${user.provider}`);
      console.log(`   Created: ${user.created}`);
      console.log(`   ID: ${user.id}`);
      console.log("-".repeat(50));
    });

    console.log(`\nTotal: ${users.length} users`);
  }
}

// Export singleton instance
const dbUtils = new DatabaseUtils();

module.exports = {
  DatabaseUtils,
  dbUtils
};