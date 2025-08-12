const { getWalletFeatureFlags } = require("../services/featureFlags/walletFeatureFlags");
const { sendErrorResponse } = require("../utils/responseHelpers");

/**
 * Middleware to enforce wallet feature flags on routes
 */
class WalletFeatureFlagMiddleware {
  /**
   * Check if legacy wallet operations are allowed
   */
  static requireLegacyWalletEnabled() {
    return (request, reply, done) => {
      const featureFlags = getWalletFeatureFlags();
      
      if (!featureFlags.isLegacyWalletEnabled()) {
        return sendErrorResponse(reply, 503, "Legacy wallet system is currently disabled", {
          code: "LEGACY_WALLET_DISABLED",
          featureFlag: "LEGACY_WALLET_ENABLED"
        });
      }
      
      done();
    };
  }

  /**
   * Check if legacy wallet top-ups are allowed
   */
  static requireLegacyWalletTopUp() {
    return (request, reply, done) => {
      const featureFlags = getWalletFeatureFlags();
      
      if (!featureFlags.canTopUpLegacyWallet()) {
        const reason = featureFlags.isLegacyWalletReadonly() ? "read_only_mode" : "topup_disabled";
        return sendErrorResponse(reply, 503, "Legacy wallet top-ups are currently disabled", {
          code: "LEGACY_WALLET_TOPUP_DISABLED",
          reason,
          featureFlag: "LEGACY_WALLET_TOPUP_DISABLED"
        });
      }
      
      done();
    };
  }

  /**
   * Check if legacy wallet spending is allowed
   */
  static requireLegacyWalletSpending() {
    return (request, reply, done) => {
      const featureFlags = getWalletFeatureFlags();
      
      if (!featureFlags.canSpendFromLegacyWallet()) {
        return sendErrorResponse(reply, 503, "Legacy wallet spending is currently disabled", {
          code: "LEGACY_WALLET_SPENDING_DISABLED",
          featureFlag: "LEGACY_WALLET_SPENDING_ENABLED"
        });
      }
      
      done();
    };
  }

  /**
   * Check if Stripe Connect operations are allowed
   */
  static requireStripeConnectEnabled() {
    return (request, reply, done) => {
      const featureFlags = getWalletFeatureFlags();
      
      if (!featureFlags.isStripeConnectEnabled()) {
        return sendErrorResponse(reply, 503, "Stripe Connect is currently disabled", {
          code: "STRIPE_CONNECT_DISABLED",
          featureFlag: "STRIPE_CONNECT_ENABLED"
        });
      }
      
      done();
    };
  }

  /**
   * Check if Stripe Connect wallet top-ups are allowed
   */
  static requireStripeConnectTopUp() {
    return (request, reply, done) => {
      const featureFlags = getWalletFeatureFlags();
      
      if (!featureFlags.canTopUpViaStripeConnect()) {
        return sendErrorResponse(reply, 503, "Stripe Connect wallet top-ups are currently disabled", {
          code: "STRIPE_CONNECT_TOPUP_DISABLED",
          featureFlag: "STRIPE_CONNECT_WALLET_TOPUP"
        });
      }
      
      done();
    };
  }

  /**
   * Check if user is eligible for new wallet features
   */
  static requireNewWalletEligibility() {
    return (request, reply, done) => {
      const featureFlags = getWalletFeatureFlags();
      const userId = request.user?.uid;
      
      if (!userId) {
        return sendErrorResponse(reply, 401, "Authentication required");
      }
      
      if (!featureFlags.isUserEligibleForNewWallet(userId)) {
        return sendErrorResponse(reply, 403, "User not eligible for new wallet features", {
          code: "NEW_WALLET_NOT_ELIGIBLE",
          featureFlag: "NEW_WALLET_ROLLOUT_PERCENTAGE"
        });
      }
      
      done();
    };
  }

  /**
   * Check if seller is eligible for Connect onboarding
   */
  static requireSellerConnectEligibility() {
    return (request, reply, done) => {
      const featureFlags = getWalletFeatureFlags();
      const userId = request.user?.uid;
      
      if (!userId) {
        return sendErrorResponse(reply, 401, "Authentication required");
      }
      
      if (!featureFlags.isSellerEligibleForConnectOnboarding(userId)) {
        return sendErrorResponse(reply, 403, "Seller not eligible for Connect onboarding", {
          code: "SELLER_CONNECT_NOT_ELIGIBLE",
          featureFlag: "SELLER_ONBOARDING_ROLLOUT_PERCENTAGE"
        });
      }
      
      done();
    };
  }

  /**
   * Check if payments are not emergency disabled
   */
  static requirePaymentsEnabled() {
    return (request, reply, done) => {
      const featureFlags = getWalletFeatureFlags();
      
      if (featureFlags.arePaymentsEmergencyDisabled()) {
        return sendErrorResponse(reply, 503, "Payments are temporarily disabled for maintenance", {
          code: "PAYMENTS_EMERGENCY_DISABLED",
          featureFlag: "EMERGENCY_DISABLE_PAYMENTS"
        });
      }
      
      done();
    };
  }

  /**
   * Check if system is not in maintenance mode
   */
  static requireNotMaintenanceMode() {
    return (request, reply, done) => {
      const featureFlags = getWalletFeatureFlags();
      
      if (featureFlags.isMaintenanceMode()) {
        return sendErrorResponse(reply, 503, "System is currently in maintenance mode", {
          code: "MAINTENANCE_MODE",
          featureFlag: "MAINTENANCE_MODE"
        });
      }
      
      done();
    };
  }

  /**
   * Add wallet feature flag context to request
   */
  static addWalletContext() {
    return (request, reply, done) => {
      const featureFlags = getWalletFeatureFlags();
      const userId = request.user?.uid;
      
      // Add wallet context to request
      request.walletContext = {
        // System-wide flags
        legacyWalletEnabled: featureFlags.isLegacyWalletEnabled(),
        stripeConnectEnabled: featureFlags.isStripeConnectEnabled(),
        hybridMode: featureFlags.isHybridWalletMode(),
        maintenanceMode: featureFlags.isMaintenanceMode(),
        
        // User-specific flags (if user is authenticated)
        ...(userId && {
          topUpMethod: featureFlags.getTopUpMethod(userId),
          spendingStrategy: featureFlags.getSpendingStrategy(userId),
          newWalletEligible: featureFlags.isUserEligibleForNewWallet(userId),
          connectPaymentsEligible: featureFlags.isUserEligibleForConnectPayments(userId)
        }),
        
        // Display flags
        showCombinedBalance: featureFlags.shouldShowCombinedBalance(),
        legacyFirstSpending: featureFlags.shouldSpendLegacyFirst()
      };
      
      done();
    };
  }

  /**
   * Validate wallet operation based on feature flags
   */
  static validateWalletOperation(operationType) {
    return (request, reply, done) => {
      const featureFlags = getWalletFeatureFlags();
      const userId = request.user?.uid;
      
      // Check emergency flags first
      if (featureFlags.arePaymentsEmergencyDisabled()) {
        return sendErrorResponse(reply, 503, "All wallet operations are temporarily disabled", {
          code: "EMERGENCY_DISABLED"
        });
      }
      
      if (featureFlags.isMaintenanceMode()) {
        return sendErrorResponse(reply, 503, "Wallet operations are disabled during maintenance", {
          code: "MAINTENANCE_MODE"
        });
      }
      
      // Validate specific operation types
      switch (operationType) {
        case "topup":
          const topUpMethod = featureFlags.getTopUpMethod(userId);
          if (topUpMethod.method === "disabled") {
            return sendErrorResponse(reply, 503, "Wallet top-ups are currently disabled", {
              code: "TOPUP_DISABLED",
              reason: topUpMethod.reason
            });
          }
          request.walletContext.recommendedTopUpMethod = topUpMethod.method;
          break;
          
        case "spending":
          const spendingStrategy = featureFlags.getSpendingStrategy(userId);
          if (spendingStrategy.strategy === "disabled") {
            return sendErrorResponse(reply, 503, "Wallet spending is currently disabled", {
              code: "SPENDING_DISABLED",
              reason: spendingStrategy.reason
            });
          }
          request.walletContext.spendingStrategy = spendingStrategy.strategy;
          break;
          
        case "seller_payout":
          const payoutMethod = featureFlags.getSellerPayoutMethod(userId);
          if (payoutMethod.method === "disabled") {
            return sendErrorResponse(reply, 503, "Seller payouts are currently disabled", {
              code: "PAYOUT_DISABLED",
              reason: payoutMethod.reason
            });
          }
          request.walletContext.payoutMethod = payoutMethod.method;
          break;
          
        default:
          // Unknown operation type, allow but log warning
          console.warn(`Unknown wallet operation type: ${operationType}`);
      }
      
      done();
    };
  }

  /**
   * Admin-only middleware for feature flag management
   */
  static requireAdmin() {
    return (request, reply, done) => {
      const userRole = request.user?.role;
      
      if (userRole !== "admin") {
        return sendErrorResponse(reply, 403, "Admin access required", {
          code: "ADMIN_REQUIRED"
        });
      }
      
      done();
    };
  }

  /**
   * Middleware to log feature flag usage for analytics
   */
  static logFeatureFlagUsage(operationType) {
    return (request, reply, done) => {
      const featureFlags = getWalletFeatureFlags();
      const userId = request.user?.uid;
      
      // Log feature flag usage for analytics
      const flagUsage = {
        operationType,
        userId,
        timestamp: new Date().toISOString(),
        flags: {
          legacyEnabled: featureFlags.isLegacyWalletEnabled(),
          connectEnabled: featureFlags.isStripeConnectEnabled(),
          hybridMode: featureFlags.isHybridWalletMode()
        }
      };
      
      // In a real implementation, this would go to an analytics service
      request.log.info({ featureFlagUsage: flagUsage }, "Feature flag usage logged");
      
      done();
    };
  }
}

module.exports = WalletFeatureFlagMiddleware;