const PaymentLogger = require("./paymentLogger");
const PaymentValidation = require("./paymentValidation");
const { PaymentError, InsufficientFundsError } = require("./paymentErrors");
const { LegacyWallet } = require("../../models/legacyWallet");
const { Wallet } = require("../../models/wallet");
const { Transaction } = require("../../models/transaction");
const { User } = require("../../models/user");
const { configs } = require("../../configs");

class LegacyWalletBridge {
  constructor() {
    this.logger = new PaymentLogger();
    this.config = {
      enableLegacySpending: configs.FEATURE_USE_LEGACY_WALLET || true,
      legacyWalletReadonly: configs.FEATURE_LEGACY_WALLET_READONLY || false,
      migrationBatchSize: 100,
      ...configs
    };
  }

  /**
   * Get combined wallet balance (legacy + new)
   */
  async getCombinedWalletBalance(userId) {
    try {
      PaymentValidation.validateUserId(userId);

      const correlationId = this.logger.logOperationStart(
        { type: "get_combined_wallet_balance", id: userId }
      );

      // Get legacy wallet balance
      const legacyWallet = await LegacyWallet.getByUserId(userId);
      const legacyBalanceCents = legacyWallet ? legacyWallet.balanceCents : 0;

      // Get new wallet balance
      const newWallet = await Wallet.getWalletByUserId(userId);
      const newBalanceCents = newWallet ? Math.round(newWallet.balance * 100) : 0;

      const totalBalanceCents = legacyBalanceCents + newBalanceCents;

      this.logger.logOperationSuccess(
        { type: "get_combined_wallet_balance", id: userId },
        {
          legacyBalanceCents,
          newBalanceCents,
          totalBalanceCents,
          hasLegacyBalance: legacyBalanceCents > 0,
          hasNewBalance: newBalanceCents > 0
        },
        correlationId
      );

      return {
        success: true,
        totalBalanceCents,
        legacyBalanceCents,
        newBalanceCents,
        currency: "USD",
        hasLegacyBalance: legacyBalanceCents > 0,
        hasNewBalance: newBalanceCents > 0,
        breakdown: {
          legacy: {
            balanceCents: legacyBalanceCents,
            source: legacyWallet?.source || null,
            migrated: legacyWallet?.migrated || false
          },
          new: {
            balanceCents: newBalanceCents,
            walletId: newWallet?._id || null
          }
        }
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "get_combined_wallet_balance", id: userId },
        error
      );
      throw error;
    }
  }

  /**
   * Spend from wallet with legacy-first priority
   */
  async spendFromWallet(userId, amountCents, metadata = {}) {
    try {
      PaymentValidation.validateUserId(userId);
      PaymentValidation.validateAmount(amountCents);

      if (!this.config.enableLegacySpending) {
        throw new PaymentError(
          "Legacy wallet spending is disabled",
          "LEGACY_SPENDING_DISABLED",
          403
        );
      }

      const correlationId = this.logger.logOperationStart(
        { type: "spend_from_wallet", id: userId, amountCents },
        metadata
      );

      // Get combined balance first
      const balanceInfo = await this.getCombinedWalletBalance(userId);
      
      if (balanceInfo.totalBalanceCents < amountCents) {
        throw new InsufficientFundsError(
          balanceInfo.totalBalanceCents,
          amountCents,
          "USD"
        );
      }

      let remainingAmount = amountCents;
      const spendingBreakdown = {
        legacy: { spent: 0, remaining: balanceInfo.legacyBalanceCents },
        new: { spent: 0, remaining: balanceInfo.newBalanceCents }
      };

      // Spend from legacy wallet first
      if (remainingAmount > 0 && balanceInfo.legacyBalanceCents > 0) {
        const legacySpendAmount = Math.min(remainingAmount, balanceInfo.legacyBalanceCents);
        await this.spendFromLegacyWallet(userId, legacySpendAmount, metadata);
        
        spendingBreakdown.legacy.spent = legacySpendAmount;
        spendingBreakdown.legacy.remaining -= legacySpendAmount;
        remainingAmount -= legacySpendAmount;
      }

      // Spend remaining from new wallet if needed
      if (remainingAmount > 0 && balanceInfo.newBalanceCents > 0) {
        const newSpendAmount = remainingAmount;
        await this.spendFromNewWallet(userId, newSpendAmount, metadata);
        
        spendingBreakdown.new.spent = newSpendAmount;
        spendingBreakdown.new.remaining -= newSpendAmount;
        remainingAmount -= newSpendAmount;
      }

      this.logger.logOperationSuccess(
        { type: "spend_from_wallet", id: userId, amountCents },
        { spendingBreakdown, totalSpent: amountCents },
        correlationId
      );

      return {
        success: true,
        totalSpentCents: amountCents,
        spendingBreakdown,
        remainingBalanceCents: balanceInfo.totalBalanceCents - amountCents
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "spend_from_wallet", id: userId },
        error
      );
      throw error;
    }
  }

  /**
   * Refund to wallet with appropriate distribution
   */
  async refundToWallet(userId, amountCents, originalSpendingBreakdown = null, metadata = {}) {
    try {
      PaymentValidation.validateUserId(userId);
      PaymentValidation.validateAmount(amountCents);

      const correlationId = this.logger.logOperationStart(
        { type: "refund_to_wallet", id: userId, amountCents },
        { originalSpendingBreakdown, ...metadata }
      );

      let refundBreakdown = {
        legacy: { refunded: 0 },
        new: { refunded: 0 }
      };

      // If we have original spending breakdown, refund proportionally
      if (originalSpendingBreakdown) {
        const totalOriginalSpent = originalSpendingBreakdown.legacy.spent + 
                                  originalSpendingBreakdown.new.spent;
        
        if (totalOriginalSpent > 0) {
          // Refund to legacy wallet proportionally
          if (originalSpendingBreakdown.legacy.spent > 0) {
            const legacyRefundAmount = Math.round(
              (originalSpendingBreakdown.legacy.spent / totalOriginalSpent) * amountCents
            );
            
            if (legacyRefundAmount > 0) {
              await this.refundToLegacyWallet(userId, legacyRefundAmount, metadata);
              refundBreakdown.legacy.refunded = legacyRefundAmount;
            }
          }

          // Refund remaining to new wallet
          const newRefundAmount = amountCents - refundBreakdown.legacy.refunded;
          if (newRefundAmount > 0) {
            await this.refundToNewWallet(userId, newRefundAmount, metadata);
            refundBreakdown.new.refunded = newRefundAmount;
          }
        } else {
          // No original breakdown, refund to new wallet
          await this.refundToNewWallet(userId, amountCents, metadata);
          refundBreakdown.new.refunded = amountCents;
        }
      } else {
        // No original breakdown provided, refund to new wallet by default
        await this.refundToNewWallet(userId, amountCents, metadata);
        refundBreakdown.new.refunded = amountCents;
      }

      this.logger.logOperationSuccess(
        { type: "refund_to_wallet", id: userId, amountCents },
        { refundBreakdown },
        correlationId
      );

      return {
        success: true,
        totalRefundedCents: amountCents,
        refundBreakdown
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "refund_to_wallet", id: userId },
        error
      );
      throw error;
    }
  }

  /**
   * Migrate legacy wallet to new wallet system
   */
  async migrateLegacyWallet(userId) {
    try {
      PaymentValidation.validateUserId(userId);

      const correlationId = this.logger.logOperationStart(
        { type: "migrate_legacy_wallet", id: userId }
      );

      // Get legacy wallet
      const legacyWallet = await LegacyWallet.getByUserId(userId);
      if (!legacyWallet) {
        return {
          success: false,
          reason: "no_legacy_wallet",
          message: "No legacy wallet found for user"
        };
      }

      if (legacyWallet.migrated) {
        return {
          success: false,
          reason: "already_migrated",
          message: "Legacy wallet already migrated",
          migratedAt: legacyWallet.migratedAt
        };
      }

      if (legacyWallet.balanceCents === 0) {
        // Mark as migrated even with zero balance
        await legacyWallet.markAsMigrated(null);
        
        return {
          success: true,
          reason: "zero_balance",
          message: "Legacy wallet had zero balance, marked as migrated",
          migratedBalanceCents: 0
        };
      }

      // Get or create new wallet
      let newWallet = await Wallet.getWalletByUserId(userId);
      if (!newWallet) {
        newWallet = await Wallet.createWalletForUser(userId, legacyWallet.currency);
      }

      // Transfer balance (convert cents to dollars for new wallet)
      const balanceDollars = legacyWallet.balanceCents / 100;
      await newWallet.addFunds(balanceDollars);

      // Create migration transaction record
      await Transaction.create({
        walletId: newWallet._id,
        userId: userId,
        type: "funding",
        amount: balanceDollars,
        currency: legacyWallet.currency,
        status: "completed",
        description: `Legacy wallet migration of ${balanceDollars} ${legacyWallet.currency}`,
        paymentProvider: "manual",
        balanceBefore: newWallet.balance - balanceDollars,
        balanceAfter: newWallet.balance,
        metadata: {
          source: "legacy_wallet_migration",
          legacyWalletId: legacyWallet._id,
          originalBalanceCents: legacyWallet.balanceCents
        },
        processedAt: new Date()
      });

      // Mark legacy wallet as migrated
      await legacyWallet.markAsMigrated(newWallet._id);

      this.logger.logOperationSuccess(
        { type: "migrate_legacy_wallet", id: userId },
        {
          migratedBalanceCents: legacyWallet.balanceCents,
          newWalletId: newWallet._id,
          newWalletBalance: newWallet.balance
        },
        correlationId
      );

      return {
        success: true,
        migratedBalanceCents: legacyWallet.balanceCents,
        newWalletId: newWallet._id,
        newWalletBalanceDollars: newWallet.balance,
        transactionCreated: true
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "migrate_legacy_wallet", id: userId },
        error
      );
      throw error;
    }
  }

  /**
   * Get migration status for user
   */
  async getMigrationStatus(userId) {
    try {
      PaymentValidation.validateUserId(userId);

      const legacyWallet = await LegacyWallet.getByUserId(userId);
      const newWallet = await Wallet.getWalletByUserId(userId);

      return {
        hasLegacyWallet: !!legacyWallet,
        hasNewWallet: !!newWallet,
        legacyMigrated: legacyWallet?.migrated || false,
        legacyBalanceCents: legacyWallet?.balanceCents || 0,
        newBalanceCents: newWallet ? Math.round(newWallet.balance * 100) : 0,
        migratedAt: legacyWallet?.migratedAt || null,
        requiresMigration: !!(legacyWallet && !legacyWallet.migrated && legacyWallet.balanceCents > 0)
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "get_migration_status", id: userId },
        error
      );
      throw error;
    }
  }

  /**
   * Batch migrate legacy wallets
   */
  async batchMigrateLegacyWallets(options = {}) {
    try {
      const {
        batchSize = this.config.migrationBatchSize,
        dryRun = false,
        minBalanceCents = 1
      } = options;

      const correlationId = this.logger.logMigrationStart("batch_legacy_wallet_migration", batchSize);

      // Get unmigrated legacy wallets with balance
      const legacyWallets = await LegacyWallet.find({
        migrated: false,
        balanceCents: { $gte: minBalanceCents }
      })
      .limit(batchSize)
      .lean();

      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        totalMigratedCents: 0,
        errors: []
      };

      for (const legacyWallet of legacyWallets) {
        try {
          results.processed++;

          if (!dryRun) {
            const migrationResult = await this.migrateLegacyWallet(legacyWallet.userId);
            
            if (migrationResult.success) {
              results.successful++;
              results.totalMigratedCents += migrationResult.migratedBalanceCents;
            } else {
              results.failed++;
              results.errors.push({
                userId: legacyWallet.userId,
                error: migrationResult.reason
              });
            }
          } else {
            // Dry run - just count what would be migrated
            results.successful++;
            results.totalMigratedCents += legacyWallet.balanceCents;
          }

        } catch (error) {
          results.failed++;
          results.errors.push({
            userId: legacyWallet.userId,
            error: error.message
          });

          this.logger.logOperationFailure(
            { type: "batch_migrate_single_wallet", id: legacyWallet.userId },
            error
          );
        }
      }

      this.logger.logMigrationComplete("batch_legacy_wallet_migration", {
        ...results,
        dryRun,
        batchSize
      });

      return {
        success: true,
        results,
        dryRun
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "batch_migrate_legacy_wallets" },
        error
      );
      throw error;
    }
  }

  // Private helper methods

  async spendFromLegacyWallet(userId, amountCents, metadata = {}) {
    const legacyWallet = await LegacyWallet.getByUserId(userId);
    if (!legacyWallet) {
      throw new PaymentError(
        "Legacy wallet not found",
        "LEGACY_WALLET_NOT_FOUND",
        404
      );
    }

    if (!legacyWallet.hasEnoughFunds(amountCents)) {
      throw new InsufficientFundsError(
        legacyWallet.balanceCents,
        amountCents,
        legacyWallet.currency
      );
    }

    await legacyWallet.spendBalance(amountCents);

    // Log the spending
    this.logger.logOperationSuccess(
      { type: "spend_from_legacy_wallet", id: userId },
      {
        spentCents: amountCents,
        remainingCents: legacyWallet.balanceCents,
        metadata
      }
    );
  }

  async spendFromNewWallet(userId, amountCents, metadata = {}) {
    const newWallet = await Wallet.getWalletByUserId(userId);
    if (!newWallet) {
      throw new PaymentError(
        "New wallet not found",
        "NEW_WALLET_NOT_FOUND",
        404
      );
    }

    const amountDollars = amountCents / 100;
    if (!newWallet.hasEnoughFunds(amountDollars)) {
      throw new InsufficientFundsError(
        Math.round(newWallet.balance * 100),
        amountCents,
        newWallet.currency
      );
    }

    await newWallet.deductFunds(amountDollars);

    // Create transaction record
    await Transaction.createPurchaseTransaction({
      walletId: newWallet._id,
      userId: userId,
      amount: amountDollars,
      currency: newWallet.currency,
      relatedOrderId: metadata.orderId,
      relatedListingId: metadata.listingId,
      balanceBefore: newWallet.balance + amountDollars
    });
  }

  async refundToLegacyWallet(userId, amountCents, metadata = {}) {
    let legacyWallet = await LegacyWallet.getByUserId(userId);
    
    if (!legacyWallet) {
      // Create a legacy wallet for refund purposes
      legacyWallet = await LegacyWallet.create({
        userId: userId,
        balanceCents: 0,
        currency: "USD",
        source: "refund_created",
        migrated: false
      });
    }

    await legacyWallet.refundToBalance(amountCents);

    this.logger.logOperationSuccess(
      { type: "refund_to_legacy_wallet", id: userId },
      {
        refundedCents: amountCents,
        newBalanceCents: legacyWallet.balanceCents,
        metadata
      }
    );
  }

  async refundToNewWallet(userId, amountCents, metadata = {}) {
    let newWallet = await Wallet.getWalletByUserId(userId);
    
    if (!newWallet) {
      newWallet = await Wallet.createWalletForUser(userId, "USD");
    }

    const amountDollars = amountCents / 100;
    await newWallet.addFunds(amountDollars);

    // Create refund transaction record
    await Transaction.create({
      walletId: newWallet._id,
      userId: userId,
      type: "refund",
      amount: amountDollars,
      currency: newWallet.currency,
      status: "completed",
      description: `Refund of ${amountDollars} ${newWallet.currency}`,
      paymentProvider: "manual",
      balanceBefore: newWallet.balance - amountDollars,
      balanceAfter: newWallet.balance,
      metadata: {
        source: "wallet_refund",
        ...metadata
      },
      processedAt: new Date()
    });
  }

  // Utility methods

  async getLegacyWalletStats() {
    try {
      const stats = await LegacyWallet.getMigrationStats();
      
      return {
        success: true,
        stats: {
          ...stats,
          migrationProgress: stats.migrationProgress,
          totalLegacyBalanceDollars: stats.totalLegacyBalanceCents / 100
        }
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "get_legacy_wallet_stats" },
        error
      );
      throw error;
    }
  }

  async validateWalletConsistency(userId) {
    try {
      const balanceInfo = await this.getCombinedWalletBalance(userId);
      const migrationStatus = await this.getMigrationStatus(userId);

      const issues = [];

      // Check for inconsistencies
      if (migrationStatus.legacyMigrated && migrationStatus.legacyBalanceCents > 0) {
        issues.push("Legacy wallet marked as migrated but still has balance");
      }

      if (!migrationStatus.legacyMigrated && migrationStatus.legacyBalanceCents === 0) {
        issues.push("Legacy wallet has zero balance but not marked as migrated");
      }

      return {
        consistent: issues.length === 0,
        issues,
        balanceInfo,
        migrationStatus
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "validate_wallet_consistency", id: userId },
        error
      );
      throw error;
    }
  }

  isLegacySpendingEnabled() {
    return this.config.enableLegacySpending && !this.config.legacyWalletReadonly;
  }

  isLegacyWalletReadonly() {
    return this.config.legacyWalletReadonly;
  }
}

module.exports = LegacyWalletBridge;