#!/usr/bin/env node

/**
 * Wallet Migration Validation Script
 * 
 * This script validates the integrity of the wallet migration process
 * and generates detailed reports on migration status.
 * 
 * Usage:
 *   node scripts/validate_wallet_migration.js [options]
 * 
 * Options:
 *   --detailed         Show detailed validation results
 *   --fix-issues       Attempt to fix detected issues
 *   --export-report    Export validation report to JSON file
 */

const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const { Wallet } = require("../models/wallet");
const { LegacyWallet } = require("../models/legacyWallet");
const { Transaction } = require("../models/transaction");
const { User } = require("../models/user");
const { configs } = require("../configs");

class WalletMigrationValidator {
  constructor(options = {}) {
    this.options = {
      detailed: options.detailed || false,
      fixIssues: options.fixIssues || false,
      exportReport: options.exportReport || false,
      ...options
    };

    this.validationResults = {
      summary: {
        totalOriginalWallets: 0,
        totalLegacyWallets: 0,
        migratedWallets: 0,
        unmigrated: 0,
        issues: 0,
        warnings: 0
      },
      balanceValidation: {
        totalOriginalBalance: 0,
        totalLegacyBalance: 0,
        balanceDifference: 0,
        balanceMatches: true
      },
      issues: [],
      warnings: [],
      userValidation: [],
      transactionValidation: {
        originalTransactions: 0,
        migratedTransactions: 0,
        orphanedTransactions: 0
      }
    };
  }

  async run() {
    try {
      console.log("🔍 Starting Wallet Migration Validation");
      console.log("=" * 50);

      await this.connectDatabase();
      await this.loadData();
      await this.validateMigration();
      await this.generateReport();

      if (this.options.fixIssues) {
        await this.fixIssues();
      }

      if (this.options.exportReport) {
        await this.exportReport();
      }

    } catch (error) {
      console.error("❌ Validation failed:", error);
      process.exit(1);
    } finally {
      await this.disconnectDatabase();
    }
  }

  async connectDatabase() {
    try {
      await mongoose.connect(configs.MONGO_URI);
      console.log("✅ Connected to database");
    } catch (error) {
      throw new Error(`Failed to connect to database: ${error.message}`);
    }
  }

  async disconnectDatabase() {
    try {
      await mongoose.disconnect();
      console.log("✅ Disconnected from database");
    } catch (error) {
      console.error("⚠️  Error disconnecting from database:", error);
    }
  }

  async loadData() {
    console.log("📊 Loading wallet data...");

    this.originalWallets = await Wallet.find({}).lean();
    this.legacyWallets = await LegacyWallet.find({}).lean();
    this.users = await User.find({}).lean();
    this.transactions = await Transaction.find({}).lean();

    this.validationResults.summary.totalOriginalWallets = this.originalWallets.length;
    this.validationResults.summary.totalLegacyWallets = this.legacyWallets.length;

    console.log(`  📈 Original wallets: ${this.originalWallets.length}`);
    console.log(`  📈 Legacy wallets: ${this.legacyWallets.length}`);
    console.log(`  📈 Users: ${this.users.length}`);
    console.log(`  📈 Transactions: ${this.transactions.length}`);
  }

  async validateMigration() {
    console.log("\n🔍 Validating migration...");

    await this.validateBalances();
    await this.validateUserWallets();
    await this.validateTransactions();
    await this.validateDataIntegrity();
    await this.checkOrphanedRecords();
  }

  async validateBalances() {
    console.log("💰 Validating balances...");

    let totalOriginalBalance = 0;
    let totalLegacyBalance = 0;

    // Calculate total original balance
    for (const wallet of this.originalWallets) {
      totalOriginalBalance += wallet.balance || 0;
    }

    // Calculate total legacy balance
    for (const legacyWallet of this.legacyWallets) {
      totalLegacyBalance += (legacyWallet.balanceCents || 0) / 100;
    }

    this.validationResults.balanceValidation.totalOriginalBalance = totalOriginalBalance;
    this.validationResults.balanceValidation.totalLegacyBalance = totalLegacyBalance;
    this.validationResults.balanceValidation.balanceDifference = Math.abs(totalOriginalBalance - totalLegacyBalance);

    const tolerance = 0.01; // $0.01 tolerance for rounding
    const balanceMatches = this.validationResults.balanceValidation.balanceDifference <= tolerance;
    this.validationResults.balanceValidation.balanceMatches = balanceMatches;

    console.log(`  💵 Total original balance: $${totalOriginalBalance.toFixed(2)}`);
    console.log(`  💵 Total legacy balance: $${totalLegacyBalance.toFixed(2)}`);
    console.log(`  💵 Difference: $${this.validationResults.balanceValidation.balanceDifference.toFixed(2)}`);

    if (!balanceMatches) {
      this.addIssue("BALANCE_MISMATCH", `Total balance mismatch: $${this.validationResults.balanceValidation.balanceDifference.toFixed(2)} difference`);
    } else {
      console.log("  ✅ Balance validation passed");
    }
  }

  async validateUserWallets() {
    console.log("👤 Validating user wallets...");

    let migratedCount = 0;
    let unmigratedCount = 0;

    for (const user of this.users) {
      const originalWallet = this.originalWallets.find(w => w.userId.toString() === user._id.toString());
      const legacyWallet = this.legacyWallets.find(lw => lw.userId.toString() === user._id.toString());

      const userValidation = {
        userId: user._id,
        email: user.email,
        hasOriginalWallet: !!originalWallet,
        hasLegacyWallet: !!legacyWallet,
        originalBalance: originalWallet?.balance || 0,
        legacyBalance: legacyWallet ? legacyWallet.balanceCents / 100 : 0,
        migrated: !!legacyWallet,
        issues: []
      };

      // Check for migration issues
      if (originalWallet && originalWallet.balance > 0.01) {
        if (!legacyWallet) {
          userValidation.issues.push("Missing legacy wallet for user with balance");
          this.addIssue("MISSING_LEGACY_WALLET", `User ${user._id} has original wallet balance $${originalWallet.balance} but no legacy wallet`);
          unmigratedCount++;
        } else {
          const balanceDiff = Math.abs(originalWallet.balance - (legacyWallet.balanceCents / 100));
          if (balanceDiff > 0.01) {
            userValidation.issues.push(`Balance mismatch: original $${originalWallet.balance}, legacy $${legacyWallet.balanceCents / 100}`);
            this.addIssue("USER_BALANCE_MISMATCH", `User ${user._id} balance mismatch: $${balanceDiff.toFixed(2)}`);
          }
          migratedCount++;
        }
      } else if (legacyWallet) {
        migratedCount++;
      }

      // Check for orphaned legacy wallets
      if (legacyWallet && !originalWallet) {
        userValidation.issues.push("Orphaned legacy wallet");
        this.addWarning("ORPHANED_LEGACY_WALLET", `Legacy wallet ${legacyWallet._id} has no corresponding original wallet`);
      }

      if (this.options.detailed || userValidation.issues.length > 0) {
        this.validationResults.userValidation.push(userValidation);
      }
    }

    this.validationResults.summary.migratedWallets = migratedCount;
    this.validationResults.summary.unmigrated = unmigratedCount;

    console.log(`  ✅ Migrated wallets: ${migratedCount}`);
    console.log(`  ⚠️  Unmigrated wallets: ${unmigratedCount}`);
  }

  async validateTransactions() {
    console.log("📝 Validating transactions...");

    const originalTransactions = this.transactions.filter(t => !t.metadata?.migratedFrom);
    const migratedTransactions = this.transactions.filter(t => t.metadata?.migratedFrom);
    const orphanedTransactions = [];

    // Check for orphaned migrated transactions
    for (const transaction of migratedTransactions) {
      const originalWalletId = transaction.metadata?.originalWalletId;
      const legacyWalletId = transaction.walletId;

      const legacyWallet = this.legacyWallets.find(lw => lw._id.toString() === legacyWalletId.toString());
      if (!legacyWallet) {
        orphanedTransactions.push(transaction);
        this.addIssue("ORPHANED_TRANSACTION", `Transaction ${transaction._id} references non-existent legacy wallet ${legacyWalletId}`);
      }
    }

    this.validationResults.transactionValidation = {
      originalTransactions: originalTransactions.length,
      migratedTransactions: migratedTransactions.length,
      orphanedTransactions: orphanedTransactions.length
    };

    console.log(`  📊 Original transactions: ${originalTransactions.length}`);
    console.log(`  📊 Migrated transactions: ${migratedTransactions.length}`);
    console.log(`  📊 Orphaned transactions: ${orphanedTransactions.length}`);

    if (orphanedTransactions.length > 0) {
      console.log(`  ⚠️  Found ${orphanedTransactions.length} orphaned transactions`);
    }
  }

  async validateDataIntegrity() {
    console.log("🔒 Validating data integrity...");

    // Check for duplicate legacy wallets
    const userIds = this.legacyWallets.map(lw => lw.userId.toString());
    const duplicateUserIds = userIds.filter((id, index) => userIds.indexOf(id) !== index);

    if (duplicateUserIds.length > 0) {
      this.addIssue("DUPLICATE_LEGACY_WALLETS", `Found duplicate legacy wallets for users: ${duplicateUserIds.join(", ")}`);
    }

    // Check for negative balances
    const negativeBalanceWallets = this.legacyWallets.filter(lw => lw.balanceCents < 0);
    if (negativeBalanceWallets.length > 0) {
      this.addIssue("NEGATIVE_BALANCE", `Found ${negativeBalanceWallets.length} legacy wallets with negative balances`);
    }

    // Check for missing required fields
    for (const legacyWallet of this.legacyWallets) {
      if (!legacyWallet.userId) {
        this.addIssue("MISSING_USER_ID", `Legacy wallet ${legacyWallet._id} missing userId`);
      }
      if (legacyWallet.balanceCents === undefined || legacyWallet.balanceCents === null) {
        this.addIssue("MISSING_BALANCE", `Legacy wallet ${legacyWallet._id} missing balanceCents`);
      }
      if (!legacyWallet.currency) {
        this.addWarning("MISSING_CURRENCY", `Legacy wallet ${legacyWallet._id} missing currency`);
      }
    }

    console.log("  ✅ Data integrity validation completed");
  }

  async checkOrphanedRecords() {
    console.log("🔍 Checking for orphaned records...");

    // Check for legacy wallets without users
    for (const legacyWallet of this.legacyWallets) {
      const user = this.users.find(u => u._id.toString() === legacyWallet.userId.toString());
      if (!user) {
        this.addWarning("ORPHANED_LEGACY_WALLET_NO_USER", `Legacy wallet ${legacyWallet._id} references non-existent user ${legacyWallet.userId}`);
      }
    }

    // Check for original wallets without users
    for (const wallet of this.originalWallets) {
      const user = this.users.find(u => u._id.toString() === wallet.userId.toString());
      if (!user) {
        this.addWarning("ORPHANED_ORIGINAL_WALLET_NO_USER", `Original wallet ${wallet._id} references non-existent user ${wallet.userId}`);
      }
    }

    console.log("  ✅ Orphaned records check completed");
  }

  async generateReport() {
    console.log("\n📊 VALIDATION REPORT");
    console.log("=" * 50);

    const { summary, balanceValidation, issues, warnings } = this.validationResults;

    // Summary
    console.log("📈 SUMMARY:");
    console.log(`  Total original wallets: ${summary.totalOriginalWallets}`);
    console.log(`  Total legacy wallets: ${summary.totalLegacyWallets}`);
    console.log(`  Migrated wallets: ${summary.migratedWallets}`);
    console.log(`  Unmigrated wallets: ${summary.unmigrated}`);
    console.log(`  Issues found: ${issues.length}`);
    console.log(`  Warnings: ${warnings.length}`);

    // Balance validation
    console.log("\n💰 BALANCE VALIDATION:");
    console.log(`  Original total: $${balanceValidation.totalOriginalBalance.toFixed(2)}`);
    console.log(`  Legacy total: $${balanceValidation.totalLegacyBalance.toFixed(2)}`);
    console.log(`  Difference: $${balanceValidation.balanceDifference.toFixed(2)}`);
    console.log(`  Balance matches: ${balanceValidation.balanceMatches ? "✅ YES" : "❌ NO"}`);

    // Issues
    if (issues.length > 0) {
      console.log("\n❌ ISSUES:");
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. [${issue.type}] ${issue.message}`);
      });
    }

    // Warnings
    if (warnings.length > 0) {
      console.log("\n⚠️  WARNINGS:");
      warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. [${warning.type}] ${warning.message}`);
      });
    }

    // Overall status
    console.log("\n🎯 OVERALL STATUS:");
    if (issues.length === 0) {
      console.log("✅ Migration validation PASSED - No critical issues found");
    } else {
      console.log(`❌ Migration validation FAILED - ${issues.length} critical issues found`);
    }

    if (warnings.length > 0) {
      console.log(`⚠️  ${warnings.length} warnings require attention`);
    }

    // Recommendations
    console.log("\n💡 RECOMMENDATIONS:");
    if (summary.unmigrated > 0) {
      console.log(`  - Migrate ${summary.unmigrated} remaining wallets`);
    }
    if (issues.length > 0) {
      console.log("  - Fix critical issues before proceeding with migration");
      if (this.options.fixIssues) {
        console.log("  - Run with --fix-issues to attempt automatic fixes");
      }
    }
    if (warnings.length > 0) {
      console.log("  - Review warnings for potential data quality issues");
    }
    if (issues.length === 0 && warnings.length === 0) {
      console.log("  - Migration is ready for production deployment");
    }
  }

  async fixIssues() {
    console.log("\n🔧 Attempting to fix issues...");

    let fixedCount = 0;

    for (const issue of this.validationResults.issues) {
      try {
        switch (issue.type) {
          case "NEGATIVE_BALANCE":
            // Fix negative balances by setting to 0
            await this.fixNegativeBalances();
            fixedCount++;
            break;
          
          case "MISSING_CURRENCY":
            // Set default currency to USD
            await this.fixMissingCurrency();
            fixedCount++;
            break;
          
          default:
            console.log(`  ⚠️  Cannot auto-fix issue type: ${issue.type}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to fix issue ${issue.type}:`, error.message);
      }
    }

    console.log(`  ✅ Fixed ${fixedCount} issues`);
  }

  async fixNegativeBalances() {
    const negativeBalanceWallets = await LegacyWallet.find({ balanceCents: { $lt: 0 } });
    
    for (const wallet of negativeBalanceWallets) {
      wallet.balanceCents = 0;
      await wallet.save();
      console.log(`  🔧 Fixed negative balance for wallet ${wallet._id}`);
    }
  }

  async fixMissingCurrency() {
    const missingCurrencyWallets = await LegacyWallet.find({ 
      $or: [{ currency: null }, { currency: { $exists: false } }] 
    });
    
    for (const wallet of missingCurrencyWallets) {
      wallet.currency = "USD";
      await wallet.save();
      console.log(`  🔧 Set currency to USD for wallet ${wallet._id}`);
    }
  }

  async exportReport() {
    const reportPath = path.join(__dirname, `../reports/wallet_migration_validation_${Date.now()}.json`);
    
    try {
      // Ensure reports directory exists
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      
      const report = {
        timestamp: new Date().toISOString(),
        validationResults: this.validationResults,
        options: this.options
      };

      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Report exported to: ${reportPath}`);
    } catch (error) {
      console.error("❌ Failed to export report:", error.message);
    }
  }

  addIssue(type, message) {
    this.validationResults.issues.push({ type, message, timestamp: new Date() });
    this.validationResults.summary.issues++;
  }

  addWarning(type, message) {
    this.validationResults.warnings.push({ type, message, timestamp: new Date() });
    this.validationResults.summary.warnings++;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (const arg of args) {
    if (arg === "--detailed") {
      options.detailed = true;
    } else if (arg === "--fix-issues") {
      options.fixIssues = true;
    } else if (arg === "--export-report") {
      options.exportReport = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Wallet Migration Validation Script

Usage: node scripts/validate_wallet_migration.js [options]

Options:
  --detailed         Show detailed validation results
  --fix-issues       Attempt to fix detected issues
  --export-report    Export validation report to JSON file
  --help, -h         Show this help message

Examples:
  node scripts/validate_wallet_migration.js
  node scripts/validate_wallet_migration.js --detailed --export-report
  node scripts/validate_wallet_migration.js --fix-issues
      `);
      process.exit(0);
    }
  }

  return options;
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const validator = new WalletMigrationValidator(options);
  validator.run();
}

module.exports = WalletMigrationValidator;