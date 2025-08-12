#!/usr/bin/env node

/**
 * Legacy Wallet Migration Script
 * 
 * This script migrates existing wallet data to the legacy wallet system
 * to preserve balances during the Stripe Connect migration.
 * 
 * Usage:
 *   node scripts/migrate_legacy_wallets.js [options]
 * 
 * Options:
 *   --dry-run          Run without making changes
 *   --batch-size=N     Process N wallets at a time (default: 100)
 *   --min-balance=N    Only migrate wallets with balance >= N (default: 0.01)
 *   --force            Skip confirmation prompts
 *   --rollback         Rollback the migration
 *   --validate         Validate migration integrity
 */

const mongoose = require("mongoose");
const { Wallet } = require("../models/wallet");
const { LegacyWallet } = require("../models/legacyWallet");
const { Transaction } = require("../models/transaction");
const { User } = require("../models/user");
const { configs } = require("../configs");

class WalletMigrationScript {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      batchSize: options.batchSize || 100,
      minBalance: options.minBalance || 0.01,
      force: options.force || false,
      rollback: options.rollback || false,
      validate: options.validate || false,
      ...options
    };

    this.stats = {
      processed: 0,
      migrated: 0,
      skipped: 0,
      errors: 0,
      totalBalanceMigrated: 0,
      startTime: null,
      endTime: null
    };

    this.errors = [];
  }

  async run() {
    try {
      console.log("🚀 Starting Legacy Wallet Migration Script");
      console.log("Options:", this.options);
      console.log("=" * 50);

      // Connect to database
      await this.connectDatabase();

      // Validate environment
      await this.validateEnvironment();

      if (this.options.rollback) {
        await this.runRollback();
      } else if (this.options.validate) {
        await this.runValidation();
      } else {
        await this.runMigration();
      }

    } catch (error) {
      console.error("❌ Migration script failed:", error);
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

  async validateEnvironment() {
    console.log("🔍 Validating environment...");

    // Check if we're in development
    if (configs.ENVIRONMENT !== "development") {
      if (!this.options.force) {
        throw new Error("Migration should only run in development environment. Use --force to override.");
      }
      console.log("⚠️  Running in non-development environment with --force flag");
    }

    // Check if legacy wallet collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const hasLegacyWallets = collections.some(col => col.name === "legacywallets");
    
    if (hasLegacyWallets && !this.options.rollback) {
      const existingCount = await LegacyWallet.countDocuments();
      if (existingCount > 0 && !this.options.force) {
        throw new Error(`Legacy wallets collection already has ${existingCount} records. Use --force to proceed or --rollback to undo.`);
      }
    }

    console.log("✅ Environment validation passed");
  }

  async runMigration() {
    this.stats.startTime = new Date();
    console.log("🔄 Starting wallet migration...");

    if (!this.options.force && !this.options.dryRun) {
      await this.confirmMigration();
    }

    // Get total count for progress tracking
    const totalWallets = await Wallet.countDocuments({
      balance: { $gte: this.options.minBalance }
    });

    console.log(`📊 Found ${totalWallets} wallets to migrate`);

    if (totalWallets === 0) {
      console.log("✅ No wallets to migrate");
      return;
    }

    // Process wallets in batches
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const wallets = await Wallet.find({
        balance: { $gte: this.options.minBalance }
      })
      .skip(offset)
      .limit(this.options.batchSize)
      .lean();

      if (wallets.length === 0) {
        hasMore = false;
        continue;
      }

      console.log(`\n📦 Processing batch ${Math.floor(offset / this.options.batchSize) + 1} (${wallets.length} wallets)`);

      for (const wallet of wallets) {
        await this.migrateWallet(wallet);
      }

      offset += this.options.batchSize;
      hasMore = wallets.length === this.options.batchSize;

      // Progress update
      const progress = Math.min(100, (this.stats.processed / totalWallets) * 100);
      console.log(`📈 Progress: ${progress.toFixed(1)}% (${this.stats.processed}/${totalWallets})`);
    }

    this.stats.endTime = new Date();
    await this.printMigrationSummary();
  }

  async migrateWallet(wallet) {
    try {
      this.stats.processed++;

      // Check if already migrated
      const existingLegacyWallet = await LegacyWallet.findOne({ userId: wallet.userId });
      if (existingLegacyWallet) {
        this.stats.skipped++;
        console.log(`⏭️  Skipped wallet ${wallet._id} (already migrated)`);
        return;
      }

      // Skip wallets below minimum balance
      if (wallet.balance < this.options.minBalance) {
        this.stats.skipped++;
        return;
      }

      if (!this.options.dryRun) {
        // Create legacy wallet record
        const legacyWallet = await LegacyWallet.create({
          userId: wallet.userId,
          balanceCents: Math.round(wallet.balance * 100),
          currency: wallet.currency,
          source: "unified_stripe_dev",
          migrated: false,
          totalFundedCents: Math.round(wallet.totalFunded * 100),
          totalSpentCents: Math.round(wallet.totalSpent * 100),
          lastFundedAt: wallet.lastFundedAt,
          lastSpentAt: wallet.lastSpentAt,
          originalWalletData: {
            _id: wallet._id,
            externalId: wallet.externalId,
            isActive: wallet.isActive,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt
          },
          metadata: {
            migratedBy: "migration_script",
            migratedAt: new Date(),
            originalBalance: wallet.balance
          }
        });

        // Migrate associated transactions
        await this.migrateWalletTransactions(wallet._id, legacyWallet._id);

        console.log(`✅ Migrated wallet ${wallet._id} ($${wallet.balance}) -> Legacy ${legacyWallet._id}`);
      } else {
        console.log(`🔍 [DRY RUN] Would migrate wallet ${wallet._id} ($${wallet.balance})`);
      }

      this.stats.migrated++;
      this.stats.totalBalanceMigrated += wallet.balance;

    } catch (error) {
      this.stats.errors++;
      this.errors.push({
        walletId: wallet._id,
        userId: wallet.userId,
        error: error.message,
        timestamp: new Date()
      });

      console.error(`❌ Failed to migrate wallet ${wallet._id}:`, error.message);
    }
  }

  async migrateWalletTransactions(walletId, legacyWalletId) {
    try {
      // Get transactions for this wallet
      const transactions = await Transaction.find({ walletId }).lean();

      if (transactions.length === 0) {
        return;
      }

      // Create legacy transaction records
      const legacyTransactions = transactions.map(tx => ({
        ...tx,
        _id: undefined, // Let MongoDB generate new ID
        walletId: legacyWalletId,
        metadata: {
          ...tx.metadata,
          migratedFrom: tx._id,
          originalWalletId: walletId,
          migratedBy: "migration_script"
        }
      }));

      if (!this.options.dryRun) {
        await Transaction.insertMany(legacyTransactions);
      }

      console.log(`  📝 Migrated ${transactions.length} transactions`);

    } catch (error) {
      console.error(`  ⚠️  Failed to migrate transactions for wallet ${walletId}:`, error.message);
    }
  }

  async runRollback() {
    console.log("🔄 Starting migration rollback...");

    if (!this.options.force) {
      await this.confirmRollback();
    }

    const legacyWalletCount = await LegacyWallet.countDocuments();
    console.log(`📊 Found ${legacyWalletCount} legacy wallets to rollback`);

    if (legacyWalletCount === 0) {
      console.log("✅ No legacy wallets to rollback");
      return;
    }

    let rolledBack = 0;
    let errors = 0;

    // Process in batches
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const legacyWallets = await LegacyWallet.find({})
        .skip(offset)
        .limit(this.options.batchSize)
        .lean();

      if (legacyWallets.length === 0) {
        hasMore = false;
        continue;
      }

      for (const legacyWallet of legacyWallets) {
        try {
          if (!this.options.dryRun) {
            // Remove migrated transactions
            await Transaction.deleteMany({
              "metadata.migratedFrom": { $exists: true },
              "metadata.originalWalletId": { $exists: true }
            });

            // Remove legacy wallet
            await LegacyWallet.findByIdAndDelete(legacyWallet._id);
          }

          rolledBack++;
          console.log(`✅ Rolled back legacy wallet ${legacyWallet._id}`);

        } catch (error) {
          errors++;
          console.error(`❌ Failed to rollback legacy wallet ${legacyWallet._id}:`, error.message);
        }
      }

      offset += this.options.batchSize;
      hasMore = legacyWallets.length === this.options.batchSize;
    }

    console.log(`\n📊 Rollback Summary:`);
    console.log(`  Rolled back: ${rolledBack}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Dry run: ${this.options.dryRun}`);
  }

  async runValidation() {
    console.log("🔍 Starting migration validation...");

    const originalWallets = await Wallet.find({}).lean();
    const legacyWallets = await LegacyWallet.find({}).lean();

    console.log(`📊 Original wallets: ${originalWallets.length}`);
    console.log(`📊 Legacy wallets: ${legacyWallets.length}`);

    const issues = [];

    // Check balance consistency
    let totalOriginalBalance = 0;
    let totalLegacyBalance = 0;

    for (const wallet of originalWallets) {
      if (wallet.balance >= this.options.minBalance) {
        totalOriginalBalance += wallet.balance;

        const legacyWallet = legacyWallets.find(lw => lw.userId.toString() === wallet.userId.toString());
        if (!legacyWallet) {
          issues.push(`Missing legacy wallet for user ${wallet.userId} (balance: $${wallet.balance})`);
        } else {
          const legacyBalanceDollars = legacyWallet.balanceCents / 100;
          if (Math.abs(wallet.balance - legacyBalanceDollars) > 0.01) {
            issues.push(`Balance mismatch for user ${wallet.userId}: original $${wallet.balance}, legacy $${legacyBalanceDollars}`);
          }
        }
      }
    }

    for (const legacyWallet of legacyWallets) {
      totalLegacyBalance += legacyWallet.balanceCents / 100;
    }

    console.log(`💰 Total original balance: $${totalOriginalBalance.toFixed(2)}`);
    console.log(`💰 Total legacy balance: $${totalLegacyBalance.toFixed(2)}`);

    if (Math.abs(totalOriginalBalance - totalLegacyBalance) > 0.01) {
      issues.push(`Total balance mismatch: original $${totalOriginalBalance.toFixed(2)}, legacy $${totalLegacyBalance.toFixed(2)}`);
    }

    // Check for orphaned legacy wallets
    for (const legacyWallet of legacyWallets) {
      const originalWallet = originalWallets.find(w => w.userId.toString() === legacyWallet.userId.toString());
      if (!originalWallet) {
        issues.push(`Orphaned legacy wallet ${legacyWallet._id} for user ${legacyWallet.userId}`);
      }
    }

    console.log(`\n📊 Validation Results:`);
    if (issues.length === 0) {
      console.log("✅ Migration validation passed - no issues found");
    } else {
      console.log(`❌ Found ${issues.length} issues:`);
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }

    return issues.length === 0;
  }

  async confirmMigration() {
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question("⚠️  This will migrate wallet data to legacy format. Continue? (y/N): ", (answer) => {
        rl.close();
        if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
          console.log("❌ Migration cancelled");
          process.exit(0);
        }
        resolve();
      });
    });
  }

  async confirmRollback() {
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question("⚠️  This will DELETE all legacy wallet data. Continue? (y/N): ", (answer) => {
        rl.close();
        if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
          console.log("❌ Rollback cancelled");
          process.exit(0);
        }
        resolve();
      });
    });
  }

  async printMigrationSummary() {
    const duration = this.stats.endTime - this.stats.startTime;
    const durationSeconds = Math.round(duration / 1000);

    console.log("\n" + "=".repeat(50));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`Total processed: ${this.stats.processed}`);
    console.log(`Successfully migrated: ${this.stats.migrated}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`Total balance migrated: $${this.stats.totalBalanceMigrated.toFixed(2)}`);
    console.log(`Duration: ${durationSeconds}s`);
    console.log(`Dry run: ${this.options.dryRun}`);

    if (this.errors.length > 0) {
      console.log("\n❌ ERRORS:");
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. Wallet ${error.walletId}: ${error.error}`);
      });
    }

    if (this.stats.errors === 0 && this.stats.migrated > 0) {
      console.log("\n✅ Migration completed successfully!");
      
      if (!this.options.dryRun) {
        console.log("\n📋 Next steps:");
        console.log("1. Run validation: node scripts/migrate_legacy_wallets.js --validate");
        console.log("2. Update feature flags to enable legacy wallet bridge");
        console.log("3. Test wallet functionality with existing users");
      }
    }
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (const arg of args) {
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--rollback") {
      options.rollback = true;
    } else if (arg === "--validate") {
      options.validate = true;
    } else if (arg.startsWith("--batch-size=")) {
      options.batchSize = parseInt(arg.split("=")[1]);
    } else if (arg.startsWith("--min-balance=")) {
      options.minBalance = parseFloat(arg.split("=")[1]);
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Legacy Wallet Migration Script

Usage: node scripts/migrate_legacy_wallets.js [options]

Options:
  --dry-run          Run without making changes
  --batch-size=N     Process N wallets at a time (default: 100)
  --min-balance=N    Only migrate wallets with balance >= N (default: 0.01)
  --force            Skip confirmation prompts
  --rollback         Rollback the migration
  --validate         Validate migration integrity
  --help, -h         Show this help message

Examples:
  node scripts/migrate_legacy_wallets.js --dry-run
  node scripts/migrate_legacy_wallets.js --batch-size=50 --min-balance=1.00
  node scripts/migrate_legacy_wallets.js --validate
  node scripts/migrate_legacy_wallets.js --rollback --force
      `);
      process.exit(0);
    }
  }

  return options;
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const migration = new WalletMigrationScript(options);
  migration.run();
}

module.exports = WalletMigrationScript;