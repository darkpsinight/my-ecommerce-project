const PaymentLogger = require("../payment/paymentLogger");
const { configs } = require("../../configs");

/**
 * Wallet Feature Flag System
 * 
 * Controls the behavior of wallet operations during the Stripe Connect migration.
 * Provides granular control over which wallet features are enabled/disabled.
 */
class WalletFeatureFlags {
  constructor() {
    this.logger = new PaymentLogger();
    this.flags = this.loadFeatureFlags();
    this.userOverrides = new Map(); // Per-user feature flag overrides
    this.rolloutPercentages = new Map(); // Gradual rollout percentages
  }

  loadFeatureFlags() {
    return {
      // Legacy wallet system flags
      LEGACY_WALLET_ENABLED: this.getBooleanFlag("FEATURE_USE_LEGACY_WALLET", true),
      LEGACY_WALLET_READONLY: this.getBooleanFlag("FEATURE_LEGACY_WALLET_READONLY", false),
      LEGACY_WALLET_TOPUP_DISABLED: this.getBooleanFlag("FEATURE_LEGACY_WALLET_TOPUP_DISABLED", false),
      LEGACY_WALLET_SPENDING_ENABLED: this.getBooleanFlag("FEATURE_LEGACY_WALLET_SPENDING_ENABLED", true),

      // New Stripe Connect wallet flags
      STRIPE_CONNECT_ENABLED: this.getBooleanFlag("FEATURE_STRIPE_CONNECT_ENABLED", false),
      STRIPE_CONNECT_WALLET_TOPUP: this.getBooleanFlag("FEATURE_STRIPE_CONNECT_WALLET_TOPUP", false),
      STRIPE_CONNECT_ESCROW_PAYMENTS: this.getBooleanFlag("FEATURE_STRIPE_CONNECT_ESCROW_PAYMENTS", false),
      STRIPE_CONNECT_SELLER_PAYOUTS: this.getBooleanFlag("FEATURE_STRIPE_CONNECT_SELLER_PAYOUTS", false),

      // Migration control flags
      WALLET_MIGRATION_ENABLED: this.getBooleanFlag("FEATURE_WALLET_MIGRATION_ENABLED", false),
      AUTO_MIGRATE_ON_TOPUP: this.getBooleanFlag("FEATURE_AUTO_MIGRATE_ON_TOPUP", false),
      FORCE_LEGACY_MIGRATION: this.getBooleanFlag("FEATURE_FORCE_LEGACY_MIGRATION", false),

      // Hybrid mode flags (both systems running)
      HYBRID_WALLET_MODE: this.getBooleanFlag("FEATURE_HYBRID_WALLET_MODE", true),
      LEGACY_FIRST_SPENDING: this.getBooleanFlag("FEATURE_LEGACY_FIRST_SPENDING", true),
      COMBINED_BALANCE_DISPLAY: this.getBooleanFlag("FEATURE_COMBINED_BALANCE_DISPLAY", true),

      // Safety and rollback flags
      EMERGENCY_DISABLE_PAYMENTS: this.getBooleanFlag("FEATURE_EMERGENCY_DISABLE_PAYMENTS", false),
      EMERGENCY_LEGACY_ONLY: this.getBooleanFlag("FEATURE_EMERGENCY_LEGACY_ONLY", false),
      MAINTENANCE_MODE: this.getBooleanFlag("FEATURE_MAINTENANCE_MODE", false),

      // Testing and development flags
      ENABLE_PAYMENT_SIMULATION: this.getBooleanFlag("FEATURE_ENABLE_PAYMENT_SIMULATION", false),
      DETAILED_PAYMENT_LOGGING: this.getBooleanFlag("FEATURE_DETAILED_PAYMENT_LOGGING", false),
      SKIP_STRIPE_VALIDATION: this.getBooleanFlag("FEATURE_SKIP_STRIPE_VALIDATION", false),

      // Gradual rollout flags
      NEW_WALLET_ROLLOUT_PERCENTAGE: this.getNumericFlag("FEATURE_NEW_WALLET_ROLLOUT_PERCENTAGE", 0),
      SELLER_ONBOARDING_ROLLOUT_PERCENTAGE: this.getNumericFlag("FEATURE_SELLER_ONBOARDING_ROLLOUT_PERCENTAGE", 0),
      CONNECT_PAYMENTS_ROLLOUT_PERCENTAGE: this.getNumericFlag("FEATURE_CONNECT_PAYMENTS_ROLLOUT_PERCENTAGE", 0)
    };
  }

  getBooleanFlag(envVar, defaultValue = false) {
    const value = process.env[envVar] || configs[envVar];
    if (value === undefined || value === null) return defaultValue;
    return value === "true" || value === "1" || value === true;
  }

  getNumericFlag(envVar, defaultValue = 0) {
    const value = process.env[envVar] || configs[envVar];
    if (value === undefined || value === null) return defaultValue;
    const numValue = parseFloat(value);
    return isNaN(numValue) ? defaultValue : numValue;
  }

  // Core feature flag methods

  /**
   * Check if legacy wallet system is enabled
   */
  isLegacyWalletEnabled() {
    if (this.flags.EMERGENCY_LEGACY_ONLY) return true;
    if (this.flags.EMERGENCY_DISABLE_PAYMENTS) return false;
    return this.flags.LEGACY_WALLET_ENABLED;
  }

  /**
   * Check if legacy wallet is in read-only mode
   */
  isLegacyWalletReadonly() {
    return this.flags.LEGACY_WALLET_READONLY || this.flags.MAINTENANCE_MODE;
  }

  /**
   * Check if legacy wallet top-ups are allowed
   */
  canTopUpLegacyWallet() {
    if (this.flags.EMERGENCY_DISABLE_PAYMENTS) return false;
    if (this.flags.LEGACY_WALLET_TOPUP_DISABLED) return false;
    if (this.isLegacyWalletReadonly()) return false;
    return this.isLegacyWalletEnabled();
  }

  /**
   * Check if legacy wallet spending is allowed
   */
  canSpendFromLegacyWallet() {
    if (this.flags.EMERGENCY_DISABLE_PAYMENTS) return false;
    if (!this.flags.LEGACY_WALLET_SPENDING_ENABLED) return false;
    return this.isLegacyWalletEnabled();
  }

  /**
   * Check if Stripe Connect is enabled
   */
  isStripeConnectEnabled() {
    if (this.flags.EMERGENCY_LEGACY_ONLY) return false;
    if (this.flags.EMERGENCY_DISABLE_PAYMENTS) return false;
    return this.flags.STRIPE_CONNECT_ENABLED;
  }

  /**
   * Check if new wallet top-ups via Stripe Connect are enabled
   */
  canTopUpViaStripeConnect() {
    if (!this.isStripeConnectEnabled()) return false;
    return this.flags.STRIPE_CONNECT_WALLET_TOPUP;
  }

  /**
   * Check if escrow payments via Stripe Connect are enabled
   */
  canUseStripeConnectEscrow() {
    if (!this.isStripeConnectEnabled()) return false;
    return this.flags.STRIPE_CONNECT_ESCROW_PAYMENTS;
  }

  /**
   * Check if seller payouts via Stripe Connect are enabled
   */
  canPayoutViaSt ripeConnect() {
    if (!this.isStripeConnectEnabled()) return false;
    return this.flags.STRIPE_CONNECT_SELLER_PAYOUTS;
  }

  /**
   * Check if wallet migration is enabled
   */
  isWalletMigrationEnabled() {
    return this.flags.WALLET_MIGRATION_ENABLED && !this.flags.MAINTENANCE_MODE;
  }

  /**
   * Check if auto-migration on top-up is enabled
   */
  shouldAutoMigrateOnTopUp() {
    return this.flags.AUTO_MIGRATE_ON_TOPUP && this.isWalletMigrationEnabled();
  }

  /**
   * Check if hybrid wallet mode is enabled (both systems running)
   */
  isHybridWalletMode() {
    return this.flags.HYBRID_WALLET_MODE && !this.flags.EMERGENCY_LEGACY_ONLY;
  }

  /**
   * Check if legacy-first spending is enabled
   */
  shouldSpendLegacyFirst() {
    return this.flags.LEGACY_FIRST_SPENDING && this.isHybridWalletMode();
  }

  /**
   * Check if combined balance display is enabled
   */
  shouldShowCombinedBalance() {
    return this.flags.COMBINED_BALANCE_DISPLAY && this.isHybridWalletMode();
  }

  /**
   * Check if system is in maintenance mode
   */
  isMaintenanceMode() {
    return this.flags.MAINTENANCE_MODE;
  }

  /**
   * Check if payments are emergency disabled
   */
  arePaymentsEmergencyDisabled() {
    return this.flags.EMERGENCY_DISABLE_PAYMENTS;
  }

  // User-specific feature flag methods

  /**
   * Check if user is eligible for new wallet features based on rollout percentage
   */
  isUserEligibleForNewWallet(userId) {
    if (!this.isStripeConnectEnabled()) return false;
    
    const rolloutPercentage = this.flags.NEW_WALLET_ROLLOUT_PERCENTAGE;
    if (rolloutPercentage >= 100) return true;
    if (rolloutPercentage <= 0) return false;

    return this.isUserInRolloutGroup(userId, rolloutPercentage);
  }

  /**
   * Check if seller is eligible for Connect onboarding based on rollout percentage
   */
  isSellerEligibleForConnectOnboarding(sellerId) {
    if (!this.isStripeConnectEnabled()) return false;
    
    const rolloutPercentage = this.flags.SELLER_ONBOARDING_ROLLOUT_PERCENTAGE;
    if (rolloutPercentage >= 100) return true;
    if (rolloutPercentage <= 0) return false;

    return this.isUserInRolloutGroup(sellerId, rolloutPercentage);
  }

  /**
   * Check if user is eligible for Connect payments based on rollout percentage
   */
  isUserEligibleForConnectPayments(userId) {
    if (!this.isStripeConnectEnabled()) return false;
    
    const rolloutPercentage = this.flags.CONNECT_PAYMENTS_ROLLOUT_PERCENTAGE;
    if (rolloutPercentage >= 100) return true;
    if (rolloutPercentage <= 0) return false;

    return this.isUserInRolloutGroup(userId, rolloutPercentage);
  }

  /**
   * Determine if user is in rollout group based on user ID hash
   */
  isUserInRolloutGroup(userId, percentage) {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;

    // Use consistent hashing based on user ID
    const hash = this.hashUserId(userId.toString());
    const userPercentile = hash % 100;
    return userPercentile < percentage;
  }

  /**
   * Simple hash function for consistent user bucketing
   */
  hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // User override methods

  /**
   * Set feature flag override for specific user
   */
  setUserOverride(userId, flagName, value) {
    if (!this.userOverrides.has(userId)) {
      this.userOverrides.set(userId, new Map());
    }
    this.userOverrides.get(userId).set(flagName, value);

    this.logger.logOperationSuccess(
      { type: "set_user_feature_override", id: userId },
      { flagName, value }
    );
  }

  /**
   * Get feature flag value with user override consideration
   */
  getFlagForUser(userId, flagName) {
    // Check for user-specific override first
    if (this.userOverrides.has(userId)) {
      const userFlags = this.userOverrides.get(userId);
      if (userFlags.has(flagName)) {
        return userFlags.get(flagName);
      }
    }

    // Fall back to global flag
    return this.flags[flagName];
  }

  /**
   * Remove user override
   */
  removeUserOverride(userId, flagName) {
    if (this.userOverrides.has(userId)) {
      const userFlags = this.userOverrides.get(userId);
      userFlags.delete(flagName);
      
      if (userFlags.size === 0) {
        this.userOverrides.delete(userId);
      }
    }
  }

  // Wallet flow decision methods

  /**
   * Determine which wallet system to use for top-up
   */
  getTopUpMethod(userId) {
    if (this.arePaymentsEmergencyDisabled()) {
      return { method: "disabled", reason: "emergency_disabled" };
    }

    if (this.isMaintenanceMode()) {
      return { method: "disabled", reason: "maintenance_mode" };
    }

    // Check user eligibility for new wallet
    if (this.isUserEligibleForNewWallet(userId) && this.canTopUpViaStripeConnect()) {
      return { method: "stripe_connect", reason: "user_eligible_for_new_system" };
    }

    // Fall back to legacy if available
    if (this.canTopUpLegacyWallet()) {
      return { method: "legacy", reason: "legacy_system_available" };
    }

    return { method: "disabled", reason: "no_topup_methods_available" };
  }

  /**
   * Determine spending strategy for user
   */
  getSpendingStrategy(userId) {
    if (this.arePaymentsEmergencyDisabled()) {
      return { strategy: "disabled", reason: "emergency_disabled" };
    }

    if (this.isMaintenanceMode()) {
      return { strategy: "disabled", reason: "maintenance_mode" };
    }

    const canSpendLegacy = this.canSpendFromLegacyWallet();
    const canSpendConnect = this.isUserEligibleForConnectPayments(userId) && this.canUseStripeConnectEscrow();

    if (canSpendLegacy && canSpendConnect) {
      if (this.shouldSpendLegacyFirst()) {
        return { strategy: "legacy_first_hybrid", reason: "hybrid_mode_legacy_priority" };
      } else {
        return { strategy: "connect_first_hybrid", reason: "hybrid_mode_connect_priority" };
      }
    } else if (canSpendLegacy) {
      return { strategy: "legacy_only", reason: "legacy_system_only" };
    } else if (canSpendConnect) {
      return { strategy: "connect_only", reason: "connect_system_only" };
    }

    return { strategy: "disabled", reason: "no_spending_methods_available" };
  }

  /**
   * Determine seller payout method
   */
  getSellerPayoutMethod(sellerId) {
    if (this.arePaymentsEmergencyDisabled()) {
      return { method: "disabled", reason: "emergency_disabled" };
    }

    if (this.isMaintenanceMode()) {
      return { method: "manual", reason: "maintenance_mode" };
    }

    // Check if seller is eligible for Connect payouts
    if (this.isSellerEligibleForConnectOnboarding(sellerId) && this.canPayoutViaStripeConnect()) {
      return { method: "stripe_connect", reason: "seller_eligible_for_connect" };
    }

    // Fall back to manual payout
    return { method: "manual", reason: "connect_not_available" };
  }

  // Administrative methods

  /**
   * Get current feature flag status
   */
  getFeatureFlagStatus() {
    return {
      flags: { ...this.flags },
      userOverrides: this.userOverrides.size,
      lastUpdated: new Date().toISOString(),
      environment: configs.ENVIRONMENT
    };
  }

  /**
   * Update feature flag at runtime
   */
  updateFeatureFlag(flagName, value) {
    if (!(flagName in this.flags)) {
      throw new Error(`Unknown feature flag: ${flagName}`);
    }

    const oldValue = this.flags[flagName];
    this.flags[flagName] = value;

    this.logger.logOperationSuccess(
      { type: "update_feature_flag" },
      { flagName, oldValue, newValue: value }
    );

    return { success: true, flagName, oldValue, newValue: value };
  }

  /**
   * Emergency disable all payments
   */
  emergencyDisablePayments(reason = "manual_trigger") {
    this.flags.EMERGENCY_DISABLE_PAYMENTS = true;
    
    this.logger.logSecurityEvent("emergency_payments_disabled", {
      reason,
      timestamp: new Date().toISOString(),
      triggeredBy: "feature_flag_system"
    });

    return { success: true, reason, timestamp: new Date().toISOString() };
  }

  /**
   * Emergency enable legacy-only mode
   */
  emergencyEnableLegacyOnly(reason = "manual_trigger") {
    this.flags.EMERGENCY_LEGACY_ONLY = true;
    this.flags.STRIPE_CONNECT_ENABLED = false;
    
    this.logger.logSecurityEvent("emergency_legacy_only_enabled", {
      reason,
      timestamp: new Date().toISOString(),
      triggeredBy: "feature_flag_system"
    });

    return { success: true, reason, timestamp: new Date().toISOString() };
  }

  /**
   * Clear emergency flags
   */
  clearEmergencyFlags() {
    this.flags.EMERGENCY_DISABLE_PAYMENTS = false;
    this.flags.EMERGENCY_LEGACY_ONLY = false;
    
    this.logger.logOperationSuccess(
      { type: "clear_emergency_flags" },
      { timestamp: new Date().toISOString() }
    );

    return { success: true, timestamp: new Date().toISOString() };
  }

  /**
   * Reload feature flags from environment
   */
  reloadFeatureFlags() {
    const oldFlags = { ...this.flags };
    this.flags = this.loadFeatureFlags();

    const changes = [];
    for (const [key, newValue] of Object.entries(this.flags)) {
      if (oldFlags[key] !== newValue) {
        changes.push({ flag: key, oldValue: oldFlags[key], newValue });
      }
    }

    this.logger.logOperationSuccess(
      { type: "reload_feature_flags" },
      { changes: changes.length, changedFlags: changes }
    );

    return { success: true, changes };
  }
}

// Singleton instance
let walletFeatureFlags = null;

function getWalletFeatureFlags() {
  if (!walletFeatureFlags) {
    walletFeatureFlags = new WalletFeatureFlags();
  }
  return walletFeatureFlags;
}

module.exports = {
  WalletFeatureFlags,
  getWalletFeatureFlags
};