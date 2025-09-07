const LegacyWalletBridge = require("../payment/legacyWalletBridge");
const PaymentProcessor = require("../payment/paymentProcessor");
const { getWalletFeatureFlags } = require("../featureFlags/walletFeatureFlags");
const { Wallet } = require("../../models/wallet");
const { LegacyWallet } = require("../../models/legacyWallet");
const { Transaction } = require("../../models/transaction");
const PaymentLogger = require("../payment/paymentLogger");
const PaymentValidation = require("../payment/paymentValidation");
const { PaymentError, InsufficientFundsError } = require("../payment/paymentErrors");

class WalletService {
  constructor() {
    this.legacyBridge = new LegacyWalletBridge();
    this.paymentProcessor = new PaymentProcessor();
    this.logger = new PaymentLogger();
  }

  /**
   * Get comprehensive wallet information including legacy and platform balances
   */
  async getWalletInfo(userId) {
    try {
      PaymentValidation.validateUserId(userId);

      const correlationId = this.logger.logOperationStart(
        { type: "get_wallet_info", id: userId }
      );

      const featureFlags = getWalletFeatureFlags();
      
      // Get combined balance information
      const balanceInfo = await this.legacyBridge.getCombinedWalletBalance(userId);
      
      // Get migration status
      const migrationStatus = await this.legacyBridge.getMigrationStatus(userId);

      // Get spending strategy for this user
      const spendingStrategy = featureFlags.getSpendingStrategy(userId);

      this.logger.logOperationSuccess(
        { type: "get_wallet_info", id: userId },
        {
          totalBalance: balanceInfo.totalBalanceCents,
          hasLegacy: balanceInfo.hasLegacyBalance,
          hasNew: balanceInfo.hasNewBalance,
          spendingStrategy: spendingStrategy.strategy
        },
        correlationId
      );

      return {
        success: true,
        userId,
        totalBalanceCents: balanceInfo.totalBalanceCents,
        totalBalanceDollars: balanceInfo.totalBalanceCents / 100,
        currency: balanceInfo.currency,
        breakdown: {
          legacy: {
            balanceCents: balanceInfo.legacyBalanceCents,
            balanceDollars: balanceInfo.legacyBalanceCents / 100,
            enabled: featureFlags.isLegacyWalletEnabled(),
            readonly: featureFlags.isLegacyWalletReadonly(),
            source: balanceInfo.breakdown.legacy.source,
            migrated: balanceInfo.breakdown.legacy.migrated
          },
          platform: {
            balanceCents: balanceInfo.newBalanceCents,
            balanceDollars: balanceInfo.newBalanceCents / 100,
            enabled: featureFlags.isStripeConnectEnabled(),
            walletId: balanceInfo.breakdown.new.walletId
          }
        },
        spendingStrategy: spendingStrategy.strategy,
        migrationStatus,
        featureFlags: {
          legacyWalletEnabled: featureFlags.isLegacyWalletEnabled(),
          stripeConnectEnabled: featureFlags.isStripeConnectEnabled(),
          hybridMode: featureFlags.isHybridWalletMode(),
          legacyFirstSpending: featureFlags.shouldSpendLegacyFirst()
        }
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "get_wallet_info", id: userId },
        error
      );
      throw error;
    }
  }

  /**
   * Spend from wallet with legacy-first priority
   * This is the main method that implements the requirement to spend legacy balance first
   */
  async spendFromWallet(userId, amountCents, metadata = {}) {
    try {
      PaymentValidation.validateUserId(userId);
      PaymentValidation.validateAmount(amountCents);

      const correlationId = this.logger.logOperationStart(
        { type: "spend_from_wallet", id: userId, amountCents },
        metadata
      );

      const featureFlags = getWalletFeatureFlags();
      const spendingStrategy = featureFlags.getSpendingStrategy(userId);

      // Check if spending is allowed
      if (spendingStrategy.strategy === "disabled") {
        throw new PaymentError(
          "Wallet spending is currently disabled",
          "WALLET_SPENDING_DISABLED",
          503
        );
      }

      // Get current balance info
      const walletInfo = await this.getWalletInfo(userId);
      
      if (walletInfo.totalBalanceCents < amountCents) {
        throw new InsufficientFundsError(
          walletInfo.totalBalanceCents,
          amountCents,
          walletInfo.currency
        );
      }

      let spendingResult;

      // Determine spending strategy
      if (spendingStrategy.strategy === "legacy_first" || featureFlags.shouldSpendLegacyFirst()) {
        // Use legacy bridge which implements legacy-first spending
        spendingResult = await this.legacyBridge.spendFromWallet(userId, amountCents, metadata);
      } else if (spendingStrategy.strategy === "platform_only") {
        // Spend only from platform wallet
        spendingResult = await this.spendFromPlatformWalletOnly(userId, amountCents, metadata);
      } else if (spendingStrategy.strategy === "legacy_only") {
        // Spend only from legacy wallet
        spendingResult = await this.spendFromLegacyWalletOnly(userId, amountCents, metadata);
      } else {
        // Default to legacy-first
        spendingResult = await this.legacyBridge.spendFromWallet(userId, amountCents, metadata);
      }

      this.logger.logOperationSuccess(
        { type: "spend_from_wallet", id: userId, amountCents },
        {
          strategy: spendingStrategy.strategy,
          spendingBreakdown: spendingResult.spendingBreakdown,
          totalSpent: spendingResult.totalSpentCents
        },
        correlationId
      );

      return {
        success: true,
        userId,
        totalSpentCents: spendingResult.totalSpentCents,
        totalSpentDollars: spendingResult.totalSpentCents / 100,
        spendingStrategy: spendingStrategy.strategy,
        spendingBreakdown: {
          legacy: {
            spentCents: spendingResult.spendingBreakdown.legacy.spent,
            spentDollars: spendingResult.spendingBreakdown.legacy.spent / 100,
            remainingCents: spendingResult.spendingBreakdown.legacy.remaining,
            remainingDollars: spendingResult.spendingBreakdown.legacy.remaining / 100
          },
          platform: {
            spentCents: spendingResult.spendingBreakdown.new.spent,
            spentDollars: spendingResult.spendingBreakdown.new.spent / 100,
            remainingCents: spendingResult.spendingBreakdown.new.remaining,
            remainingDollars: spendingResult.spendingBreakdown.new.remaining / 100
          }
        },
        remainingBalanceCents: spendingResult.remainingBalanceCents,
        remainingBalanceDollars: spendingResult.remainingBalanceCents / 100,
        metadata
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
   * Add funds to wallet (topup)
   */
  async addFundsToWallet(userId, amountCents, source = "platform", metadata = {}) {
    try {
      PaymentValidation.validateUserId(userId);
      PaymentValidation.validateAmount(amountCents);

      const correlationId = this.logger.logOperationStart(
        { type: "add_funds_to_wallet", id: userId, amountCents },
        { source, ...metadata }
      );

      const featureFlags = getWalletFeatureFlags();
      const amountDollars = amountCents / 100;

      let result;

      if (source === "legacy") {
        // Add to legacy wallet
        if (!featureFlags.isLegacyWalletEnabled() || featureFlags.isLegacyWalletReadonly()) {
          throw new PaymentError(
            "Legacy wallet funding is not available",
            "LEGACY_WALLET_FUNDING_DISABLED",
            403
          );
        }

        let legacyWallet = await LegacyWallet.getByUserId(userId);
        if (!legacyWallet) {
          legacyWallet = await LegacyWallet.create({
            userId,
            balanceCents: 0,
            currency: "USD",
            source: "manual"
          });
        }

        await legacyWallet.refundToBalance(amountCents);

        result = {
          addedToLegacy: true,
          addedToPlatform: false,
          newLegacyBalanceCents: legacyWallet.balanceCents
        };

      } else {
        // Add to platform wallet (default)
        let wallet = await Wallet.getWalletByUserId(userId);
        if (!wallet) {
          wallet = await Wallet.createWalletForUser(userId, "USD");
        }

        await wallet.addFunds(amountDollars);

        // Create transaction record
        await Transaction.create({
          walletId: wallet._id,
          userId,
          type: "funding",
          amount: amountDollars,
          currency: wallet.currency,
          status: "completed",
          description: `Wallet funding of ${amountDollars} USD`,
          paymentProvider: metadata.paymentProvider || "stripe",
          balanceBefore: wallet.balance - amountDollars,
          balanceAfter: wallet.balance,
          metadata: {
            source: "wallet_service_funding",
            ...metadata
          },
          processedAt: new Date()
        });

        result = {
          addedToLegacy: false,
          addedToPlatform: true,
          newPlatformBalanceDollars: wallet.balance
        };
      }

      this.logger.logOperationSuccess(
        { type: "add_funds_to_wallet", id: userId, amountCents },
        { source, result },
        correlationId
      );

      return {
        success: true,
        userId,
        addedAmountCents: amountCents,
        addedAmountDollars: amountDollars,
        source,
        ...result
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "add_funds_to_wallet", id: userId },
        error
      );
      throw error;
    }
  }

  /**
   * Refund to wallet with smart distribution
   */
  async refundToWallet(userId, amountCents, originalSpendingBreakdown = null, metadata = {}) {
    try {
      PaymentValidation.validateUserId(userId);
      PaymentValidation.validateAmount(amountCents);

      const correlationId = this.logger.logOperationStart(
        { type: "refund_to_wallet", id: userId, amountCents },
        { originalSpendingBreakdown, ...metadata }
      );

      // Use legacy bridge for smart refund distribution
      const refundResult = await this.legacyBridge.refundToWallet(
        userId,
        amountCents,
        originalSpendingBreakdown,
        metadata
      );

      this.logger.logOperationSuccess(
        { type: "refund_to_wallet", id: userId, amountCents },
        refundResult,
        correlationId
      );

      return {
        success: true,
        userId,
        totalRefundedCents: refundResult.totalRefundedCents,
        totalRefundedDollars: refundResult.totalRefundedCents / 100,
        refundBreakdown: {
          legacy: {
            refundedCents: refundResult.refundBreakdown.legacy.refunded,
            refundedDollars: refundResult.refundBreakdown.legacy.refunded / 100
          },
          platform: {
            refundedCents: refundResult.refundBreakdown.new.refunded,
            refundedDollars: refundResult.refundBreakdown.new.refunded / 100
          }
        },
        metadata
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
   * Check if user has sufficient funds
   */
  async hasEnoughFunds(userId, amountCents) {
    try {
      const walletInfo = await this.getWalletInfo(userId);
      return {
        hasEnoughFunds: walletInfo.totalBalanceCents >= amountCents,
        availableBalanceCents: walletInfo.totalBalanceCents,
        requiredAmountCents: amountCents,
        shortfallCents: Math.max(0, amountCents - walletInfo.totalBalanceCents)
      };
    } catch (error) {
      this.logger.logOperationFailure(
        { type: "has_enough_funds", id: userId },
        error
      );
      throw error;
    }
  }

  /**
   * Migrate legacy wallet to platform wallet
   */
  async migrateLegacyWallet(userId) {
    try {
      return await this.legacyBridge.migrateLegacyWallet(userId);
    } catch (error) {
      this.logger.logOperationFailure(
        { type: "migrate_legacy_wallet", id: userId },
        error
      );
      throw error;
    }
  }

  /**
   * Get wallet transaction history with combined view
   */
  async getTransactionHistory(userId, options = {}) {
    try {
      PaymentValidation.validateUserId(userId);

      const { page = 1, limit = 20, type, status } = options;

      // Get platform wallet transactions
      const platformTransactions = await Transaction.getTransactionsByUserId(userId, {
        page,
        limit,
        type,
        status
      });

      // TODO: In the future, we could also include legacy wallet transaction history
      // For now, we focus on platform transactions as legacy transactions are handled separately

      return {
        success: true,
        transactions: platformTransactions.map(tx => ({
          ...tx, // tx is already a plain object from .lean()
          source: "platform",
          amountCents: Math.round(tx.amount * 100),
          balanceBeforeCents: Math.round(tx.balanceBefore * 100),
          balanceAfterCents: Math.round(tx.balanceAfter * 100)
        })),
        pagination: {
          page,
          limit,
          // Note: This is simplified - in a full implementation we'd need to combine
          // legacy and platform transaction counts
        }
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "get_transaction_history", id: userId },
        error
      );
      throw error;
    }
  }

  // Private helper methods

  async spendFromPlatformWalletOnly(userId, amountCents, metadata = {}) {
    const wallet = await Wallet.getWalletByUserId(userId);
    if (!wallet) {
      throw new PaymentError("Platform wallet not found", "PLATFORM_WALLET_NOT_FOUND", 404);
    }

    const amountDollars = amountCents / 100;
    if (!wallet.hasEnoughFunds(amountDollars)) {
      throw new InsufficientFundsError(
        Math.round(wallet.balance * 100),
        amountCents,
        wallet.currency
      );
    }

    await wallet.deductFunds(amountDollars);

    // Create transaction record
    await Transaction.createPurchaseTransaction({
      walletId: wallet._id,
      userId,
      amount: amountDollars,
      currency: wallet.currency,
      relatedOrderId: metadata.orderId,
      relatedListingId: metadata.listingId,
      balanceBefore: wallet.balance + amountDollars
    });

    return {
      totalSpentCents: amountCents,
      spendingBreakdown: {
        legacy: { spent: 0, remaining: 0 },
        new: { spent: amountCents, remaining: Math.round(wallet.balance * 100) }
      },
      remainingBalanceCents: Math.round(wallet.balance * 100)
    };
  }

  async spendFromLegacyWalletOnly(userId, amountCents, metadata = {}) {
    const legacyWallet = await LegacyWallet.getByUserId(userId);
    if (!legacyWallet) {
      throw new PaymentError("Legacy wallet not found", "LEGACY_WALLET_NOT_FOUND", 404);
    }

    if (!legacyWallet.hasEnoughFunds(amountCents)) {
      throw new InsufficientFundsError(
        legacyWallet.balanceCents,
        amountCents,
        legacyWallet.currency
      );
    }

    await legacyWallet.spendBalance(amountCents);

    return {
      totalSpentCents: amountCents,
      spendingBreakdown: {
        legacy: { spent: amountCents, remaining: legacyWallet.balanceCents },
        new: { spent: 0, remaining: 0 }
      },
      remainingBalanceCents: legacyWallet.balanceCents
    };
  }

  // Utility methods

  async validateWalletConsistency(userId) {
    return await this.legacyBridge.validateWalletConsistency(userId);
  }

  async getLegacyWalletStats() {
    return await this.legacyBridge.getLegacyWalletStats();
  }

  isLegacySpendingEnabled() {
    return this.legacyBridge.isLegacySpendingEnabled();
  }

  isLegacyWalletReadonly() {
    return this.legacyBridge.isLegacyWalletReadonly();
  }
}

module.exports = WalletService;