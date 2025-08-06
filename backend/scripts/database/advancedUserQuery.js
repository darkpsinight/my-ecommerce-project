const fs = require("fs");
const path = require("path");
const { connectDB, disconnectDB } = require("./dbConnection");
const { User } = require("./userModel");

/**
 * Advanced script for querying users with various filters and export options
 * Usage: node backend/scripts/database/advancedUserQuery.js [options]
 */

class UserQueryTool {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    if (!this.isConnected) {
      await connectDB();
      this.isConnected = true;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await disconnectDB();
      this.isConnected = false;
    }
  }

  /**
   * Get users with advanced filtering options
   */
  async getUsers(options = {}) {
    await this.connect();

    const {
      role = null,
      emailConfirmed = null,
      provider = null,
      includeDeactivated = false,
      limit = null,
      sortBy = "createdAt",
      sortOrder = -1,
      search = null,
    } = options;

    // Build query
    const query = {};

    if (!includeDeactivated) {
      query.isDeactivated = { $ne: true };
    }

    if (role) {
      query.roles = role;
    }

    if (emailConfirmed !== null) {
      query.isEmailConfirmed = emailConfirmed;
    }

    if (provider) {
      query.provider = provider;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    // Execute query
    let userQuery = User.find(query, {
      name: 1,
      email: 1,
      roles: 1,
      isEmailConfirmed: 1,
      provider: 1,
      createdAt: 1,
      isDeactivated: 1,
      walletId: 1,
      stripeCustomerId: 1,
      _id: 1,
    }).sort(sort);

    if (limit) {
      userQuery = userQuery.limit(limit);
    }

    const users = await userQuery;
    return users;
  }

  /**
   * Display users in console with formatting
   */
  displayUsers(users, title = "USER LIST") {
    console.log("\n" + "=".repeat(80));
    console.log(title.toUpperCase());
    console.log("=".repeat(80));

    if (users.length === 0) {
      console.log("No users found matching the criteria.");
      return;
    }

    users.forEach((user, index) => {
      const rolesDisplay = user.roles ? user.roles.join(", ") : "No roles";
      const emailStatus = user.isEmailConfirmed ? "✅" : "❌";
      const deactivatedStatus = user.isDeactivated ? " (DEACTIVATED)" : "";
      const createdDate = user.createdAt.toLocaleDateString();
      const hasWallet = user.walletId ? "💰" : "❌";
      const hasStripe = user.stripeCustomerId ? "💳" : "❌";

      console.log(`${index + 1}. ${user.name}${deactivatedStatus}`);
      console.log(`   Email: ${user.email} ${emailStatus}`);
      console.log(`   Roles: ${rolesDisplay}`);
      console.log(`   Provider: ${user.provider || "N/A"}`);
      console.log(`   Wallet: ${hasWallet} | Stripe: ${hasStripe}`);
      console.log(`   Created: ${createdDate}`);
      console.log(`   ID: ${user._id}`);
      console.log("-".repeat(50));
    });
  }

  /**
   * Generate statistics from user data
   */
  generateStats(users) {
    const stats = {
      total: users.length,
      roles: {},
      providers: {},
      emailConfirmed: 0,
      deactivated: 0,
      withWallet: 0,
      withStripe: 0,
    };

    users.forEach((user) => {
      // Role statistics
      if (user.roles) {
        user.roles.forEach((role) => {
          stats.roles[role] = (stats.roles[role] || 0) + 1;
        });
      }

      // Provider statistics
      if (user.provider) {
        stats.providers[user.provider] =
          (stats.providers[user.provider] || 0) + 1;
      }

      // Other statistics
      if (user.isEmailConfirmed) stats.emailConfirmed++;
      if (user.isDeactivated) stats.deactivated++;
      if (user.walletId) stats.withWallet++;
      if (user.stripeCustomerId) stats.withStripe++;
    });

    return stats;
  }

  /**
   * Display statistics
   */
  displayStats(stats) {
    console.log("\n📈 STATISTICS:");
    console.log("=".repeat(40));
    console.log(`Total Users: ${stats.total}`);

    console.log("\n👥 Roles:");
    Object.entries(stats.roles).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

    console.log("\n🔐 Providers:");
    Object.entries(stats.providers).forEach(([provider, count]) => {
      console.log(`  ${provider}: ${count}`);
    });

    console.log(`\n📧 Email Confirmed: ${stats.emailConfirmed}/${stats.total}`);
    console.log(`🚫 Deactivated: ${stats.deactivated}/${stats.total}`);
    console.log(`💰 With Wallet: ${stats.withWallet}/${stats.total}`);
    console.log(`💳 With Stripe: ${stats.withStripe}/${stats.total}`);
  }

  /**
   * Export users to JSON file
   */
  async exportToJSON(users, filename = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const defaultFilename = `users_export_${timestamp}.json`;
    const exportFilename = filename || defaultFilename;
    const exportPath = path.join(__dirname, "exports", exportFilename);

    // Ensure exports directory exists
    const exportsDir = path.dirname(exportPath);
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Prepare data for export
    const exportData = {
      exportDate: new Date().toISOString(),
      totalUsers: users.length,
      users: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        roles: user.roles,
        isEmailConfirmed: user.isEmailConfirmed,
        provider: user.provider,
        isDeactivated: user.isDeactivated,
        hasWallet: !!user.walletId,
        hasStripe: !!user.stripeCustomerId,
        createdAt: user.createdAt,
      })),
    };

    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Exported ${users.length} users to: ${exportPath}`);
    return exportPath;
  }

  /**
   * Export users to CSV file
   */
  async exportToCSV(users, filename = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const defaultFilename = `users_export_${timestamp}.csv`;
    const exportFilename = filename || defaultFilename;
    const exportPath = path.join(__dirname, "exports", exportFilename);

    // Ensure exports directory exists
    const exportsDir = path.dirname(exportPath);
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Prepare CSV content
    const headers = [
      "ID",
      "Name",
      "Email",
      "Roles",
      "Email Confirmed",
      "Provider",
      "Deactivated",
      "Has Wallet",
      "Has Stripe",
      "Created At",
    ];
    const csvContent = [
      headers.join(","),
      ...users.map((user) =>
        [
          user._id.toString(),
          `"${user.name}"`,
          user.email,
          `"${user.roles ? user.roles.join(";") : ""}"`,
          user.isEmailConfirmed,
          user.provider || "",
          user.isDeactivated || false,
          !!user.walletId,
          !!user.stripeCustomerId,
          user.createdAt.toISOString(),
        ].join(",")
      ),
    ].join("\n");

    fs.writeFileSync(exportPath, csvContent);
    console.log(`\n💾 Exported ${users.length} users to: ${exportPath}`);
    return exportPath;
  }
}

// Command line interface
async function runCLI() {
  const args = process.argv.slice(2);
  const tool = new UserQueryTool();

  try {
    // Parse command line arguments
    const options = {};
    let exportFormat = null;
    let exportFilename = null;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case "--role":
          options.role = args[++i];
          break;
        case "--email-confirmed":
          options.emailConfirmed = args[++i] === "true";
          break;
        case "--provider":
          options.provider = args[++i];
          break;
        case "--include-deactivated":
          options.includeDeactivated = true;
          break;
        case "--limit":
          options.limit = parseInt(args[++i]);
          break;
        case "--search":
          options.search = args[++i];
          break;
        case "--export":
          exportFormat = args[++i];
          break;
        case "--filename":
          exportFilename = args[++i];
          break;
        case "--help":
          console.log(`
Usage: node advancedUserQuery.js [options]

Options:
  --role <role>              Filter by role (buyer, seller, admin, support)
  --email-confirmed <bool>   Filter by email confirmation status (true/false)
  --provider <provider>      Filter by auth provider (email, google)
  --include-deactivated      Include deactivated users
  --limit <number>           Limit number of results
  --search <term>            Search in name and email
  --export <format>          Export to file (json, csv)
  --filename <name>          Custom export filename
  --help                     Show this help message

Examples:
  node advancedUserQuery.js --role admin
  node advancedUserQuery.js --email-confirmed false --limit 10
  node advancedUserQuery.js --search "john" --export json
  node advancedUserQuery.js --role seller --export csv --filename sellers.csv
          `);
          process.exit(0);
      }
    }

    // Get users with specified options
    const users = await tool.getUsers(options);

    // Display results
    tool.displayUsers(users, `Users Query Results (${users.length} found)`);

    // Generate and display statistics
    const stats = tool.generateStats(users);
    tool.displayStats(stats);

    // Export if requested
    if (exportFormat) {
      if (exportFormat === "json") {
        await tool.exportToJSON(users, exportFilename);
      } else if (exportFormat === "csv") {
        await tool.exportToCSV(users, exportFilename);
      } else {
        console.log(`❌ Unsupported export format: ${exportFormat}`);
      }
    }

    console.log(
      `\n✅ Query completed successfully. Found ${users.length} users.`
    );
  } catch (error) {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  } finally {
    await tool.disconnect();
  }
}

// Run CLI if executed directly
if (require.main === module) {
  runCLI();
}

module.exports = UserQueryTool;
