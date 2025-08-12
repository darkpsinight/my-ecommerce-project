const { WalletFeatureFlags } = require("../../services/featureFlags/walletFeatureFlags");

describe("WalletFeatureFlags", () => {
  let featureFlags;

  beforeEach(() => {
    // Reset environment variables
    delete process.env.FEATURE_USE_LEGACY_WALLET;
    delete process.env.FEATURE_STRIPE_CONNECT_ENABLED;
    delete process.env.FEATURE_EMERGENCY_DISABLE_PAYMENTS;
    
    featureFlags = new WalletFeatureFlags();
  });

  describe("Basic flag loading", () => {
    it("should load default feature flags", () => {
      expect(featureFlags.flags.LEGACY_WALLET_ENABLED).toBe(true);
      expect(featureFlags.flags.STRIPE_CONNECT_ENABLED).toBe(false);
      expect(featureFlags.flags.HYBRID_WALLET_MODE).toBe(true);
    });

    it("should load flags from environment variables", () => {
      process.env.FEATURE_USE_LEGACY_WALLET = "false";
      process.env.FEATURE_STRIPE_CONNECT_ENABLED = "true";
      
      const envFeatureFlags = new WalletFeatureFlags();
      
      expect(envFeatureFlags.flags.LEGACY_WALLET_ENABLED).toBe(false);
      expect(envFeatureFlags.flags.STRIPE_CONNECT_ENABLED).toBe(true);
    });

    it("should handle boolean flag parsing correctly", () => {
      expect(featureFlags.getBooleanFlag("NONEXISTENT_FLAG", true)).toBe(true);
      expect(featureFlags.getBooleanFlag("NONEXISTENT_FLAG", false)).toBe(false);
      
      process.env.TEST_FLAG_TRUE = "true";
      process.env.TEST_FLAG_1 = "1";
      process.env.TEST_FLAG_FALSE = "false";
      process.env.TEST_FLAG_0 = "0";
      
      expect(featureFlags.getBooleanFlag("TEST_FLAG_TRUE")).toBe(true);
      expect(featureFlags.getBooleanFlag("TEST_FLAG_1")).toBe(true);
      expect(featureFlags.getBooleanFlag("TEST_FLAG_FALSE")).toBe(false);
      expect(featureFlags.getBooleanFlag("TEST_FLAG_0")).toBe(false);
    });

    it("should handle numeric flag parsing correctly", () => {
      expect(featureFlags.getNumericFlag("NONEXISTENT_FLAG", 50)).toBe(50);
      
      process.env.TEST_NUMERIC_FLAG = "75.5";
      expect(featureFlags.getNumericFlag("TEST_NUMERIC_FLAG")).toBe(75.5);
      
      process.env.TEST_INVALID_NUMERIC = "invalid";
      expect(featureFlags.getNumericFlag("TEST_INVALID_NUMERIC", 25)).toBe(25);
    });
  });

  describe("Legacy wallet flags", () => {
    it("should check legacy wallet enabled correctly", () => {
      expect(featureFlags.isLegacyWalletEnabled()).toBe(true);
      
      featureFlags.flags.LEGACY_WALLET_ENABLED = false;
      expect(featureFlags.isLegacyWalletEnabled()).toBe(false);
      
      featureFlags.flags.EMERGENCY_LEGACY_ONLY = true;
      expect(featureFlags.isLegacyWalletEnabled()).toBe(true);
      
      featureFlags.flags.EMERGENCY_DISABLE_PAYMENTS = true;
      expect(featureFlags.isLegacyWalletEnabled()).toBe(false);
    });

    it("should check legacy wallet readonly correctly", () => {
      expect(featureFlags.isLegacyWalletReadonly()).toBe(false);
      
      featureFlags.flags.LEGACY_WALLET_READONLY = true;
      expect(featureFlags.isLegacyWalletReadonly()).toBe(true);
      
      featureFlags.flags.LEGACY_WALLET_READONLY = false;
      featureFlags.flags.MAINTENANCE_MODE = true;
      expect(featureFlags.isLegacyWalletReadonly()).toBe(true);
    });

    it("should check legacy wallet topup permissions", () => {
      expect(featureFlags.canTopUpLegacyWallet()).toBe(true);
      
      featureFlags.flags.EMERGENCY_DISABLE_PAYMENTS = true;
      expect(featureFlags.canTopUpLegacyWallet()).toBe(false);
      
      featureFlags.flags.EMERGENCY_DISABLE_PAYMENTS = false;
      featureFlags.flags.LEGACY_WALLET_TOPUP_DISABLED = true;
      expect(featureFlags.canTopUpLegacyWallet()).toBe(false);
      
      featureFlags.flags.LEGACY_WALLET_TOPUP_DISABLED = false;
      featureFlags.flags.LEGACY_WALLET_READONLY = true;
      expect(featureFlags.canTopUpLegacyWallet()).toBe(false);
    });

    it("should check legacy wallet spending permissions", () => {
      expect(featureFlags.canSpendFromLegacyWallet()).toBe(true);
      
      featureFlags.flags.EMERGENCY_DISABLE_PAYMENTS = true;
      expect(featureFlags.canSpendFromLegacyWallet()).toBe(false);
      
      featureFlags.flags.EMERGENCY_DISABLE_PAYMENTS = false;
      featureFlags.flags.LEGACY_WALLET_SPENDING_ENABLED = false;
      expect(featureFlags.canSpendFromLegacyWallet()).toBe(false);
    });
  });

  describe("Stripe Connect flags", () => {
    it("should check Stripe Connect enabled correctly", () => {
      expect(featureFlags.isStripeConnectEnabled()).toBe(false);
      
      featureFlags.flags.STRIPE_CONNECT_ENABLED = true;
      expect(featureFlags.isStripeConnectEnabled()).toBe(true);
      
      featureFlags.flags.EMERGENCY_LEGACY_ONLY = true;
      expect(featureFlags.isStripeConnectEnabled()).toBe(false);
      
      featureFlags.flags.EMERGENCY_LEGACY_ONLY = false;
      featureFlags.flags.EMERGENCY_DISABLE_PAYMENTS = true;
      expect(featureFlags.isStripeConnectEnabled()).toBe(false);
    });

    it("should check Stripe Connect topup permissions", () => {
      featureFlags.flags.STRIPE_CONNECT_ENABLED = true;
      featureFlags.flags.STRIPE_CONNECT_WALLET_TOPUP = true;
      
      expect(featureFlags.canTopUpViaStripeConnect()).toBe(true);
      
      featureFlags.flags.STRIPE_CONNECT_ENABLED = false;
      expect(featureFlags.canTopUpViaStripeConnect()).toBe(false);
    });

    it("should check Stripe Connect escrow permissions", () => {
      featureFlags.flags.STRIPE_CONNECT_ENABLED = true;
      featureFlags.flags.STRIPE_CONNECT_ESCROW_PAYMENTS = true;
      
      expect(featureFlags.canUseStripeConnectEscrow()).toBe(true);
      
      featureFlags.flags.STRIPE_CONNECT_ENABLED = false;
      expect(featureFlags.canUseStripeConnectEscrow()).toBe(false);
    });
  });

  describe("User rollout and eligibility", () => {
    it("should determine user eligibility based on rollout percentage", () => {
      const userId1 = "user123";
      const userId2 = "user456";
      
      // 0% rollout - no users eligible
      featureFlags.flags.NEW_WALLET_ROLLOUT_PERCENTAGE = 0;
      featureFlags.flags.STRIPE_CONNECT_ENABLED = true;
      
      expect(featureFlags.isUserEligibleForNewWallet(userId1)).toBe(false);
      expect(featureFlags.isUserEligibleForNewWallet(userId2)).toBe(false);
      
      // 100% rollout - all users eligible
      featureFlags.flags.NEW_WALLET_ROLLOUT_PERCENTAGE = 100;
      
      expect(featureFlags.isUserEligibleForNewWallet(userId1)).toBe(true);
      expect(featureFlags.isUserEligibleForNewWallet(userId2)).toBe(true);
      
      // Stripe Connect disabled - no users eligible
      featureFlags.flags.STRIPE_CONNECT_ENABLED = false;
      expect(featureFlags.isUserEligibleForNewWallet(userId1)).toBe(false);
    });

    it("should use consistent hashing for user bucketing", () => {
      const userId = "consistent_user";
      
      // Hash should be consistent across calls
      const hash1 = featureFlags.hashUserId(userId);
      const hash2 = featureFlags.hashUserId(userId);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toBeGreaterThanOrEqual(0);
      
      // Different users should have different hashes (usually)
      const hash3 = featureFlags.hashUserId("different_user");
      expect(hash3).not.toBe(hash1);
    });

    it("should determine rollout group membership correctly", () => {
      const userId = "test_user";
      
      // User should be in 100% rollout
      expect(featureFlags.isUserInRolloutGroup(userId, 100)).toBe(true);
      
      // User should not be in 0% rollout
      expect(featureFlags.isUserInRolloutGroup(userId, 0)).toBe(false);
      
      // User should have consistent rollout group membership
      const inGroup50_1 = featureFlags.isUserInRolloutGroup(userId, 50);
      const inGroup50_2 = featureFlags.isUserInRolloutGroup(userId, 50);
      expect(inGroup50_1).toBe(inGroup50_2);
    });
  });

  describe("User overrides", () => {
    it("should set and get user overrides", () => {
      const userId = "user123";
      const flagName = "LEGACY_WALLET_ENABLED";
      
      // Initially should use global flag
      expect(featureFlags.getFlagForUser(userId, flagName)).toBe(featureFlags.flags[flagName]);
      
      // Set override
      featureFlags.setUserOverride(userId, flagName, false);
      expect(featureFlags.getFlagForUser(userId, flagName)).toBe(false);
      
      // Global flag should be unchanged
      expect(featureFlags.flags[flagName]).toBe(true);
    });

    it("should remove user overrides", () => {
      const userId = "user123";
      const flagName = "LEGACY_WALLET_ENABLED";
      
      featureFlags.setUserOverride(userId, flagName, false);
      expect(featureFlags.getFlagForUser(userId, flagName)).toBe(false);
      
      featureFlags.removeUserOverride(userId, flagName);
      expect(featureFlags.getFlagForUser(userId, flagName)).toBe(featureFlags.flags[flagName]);
    });

    it("should clean up empty user override maps", () => {
      const userId = "user123";
      
      featureFlags.setUserOverride(userId, "FLAG1", true);
      featureFlags.setUserOverride(userId, "FLAG2", false);
      
      expect(featureFlags.userOverrides.has(userId)).toBe(true);
      
      featureFlags.removeUserOverride(userId, "FLAG1");
      expect(featureFlags.userOverrides.has(userId)).toBe(true);
      
      featureFlags.removeUserOverride(userId, "FLAG2");
      expect(featureFlags.userOverrides.has(userId)).toBe(false);
    });
  });

  describe("Wallet flow decisions", () => {
    it("should determine topup method correctly", () => {
      const userId = "user123";
      
      // Emergency disabled
      featureFlags.flags.EMERGENCY_DISABLE_PAYMENTS = true;
      let method = featureFlags.getTopUpMethod(userId);
      expect(method.method).toBe("disabled");
      expect(method.reason).toBe("emergency_disabled");
      
      // Maintenance mode
      featureFlags.flags.EMERGENCY_DISABLE_PAYMENTS = false;
      featureFlags.flags.MAINTENANCE_MODE = true;
      method = featureFlags.getTopUpMethod(userId);
      expect(method.method).toBe("disabled");
      expect(method.reason).toBe("maintenance_mode");
      
      // User eligible for new wallet
      featureFlags.flags.MAINTENANCE_MODE = false;
      featureFlags.flags.STRIPE_CONNECT_ENABLED = true;
      featureFlags.flags.STRIPE_CONNECT_WALLET_TOPUP = true;
      featureFlags.flags.NEW_WALLET_ROLLOUT_PERCENTAGE = 100;
      method = featureFlags.getTopUpMethod(userId);
      expect(method.method).toBe("stripe_connect");
      
      // Fall back to legacy
      featureFlags.flags.NEW_WALLET_ROLLOUT_PERCENTAGE = 0;
      featureFlags.flags.LEGACY_WALLET_ENABLED = true;
      method = featureFlags.getTopUpMethod(userId);
      expect(method.method).toBe("legacy");
      
      // No methods available
      featureFlags.flags.LEGACY_WALLET_ENABLED = false;
      method = featureFlags.getTopUpMethod(userId);
      expect(method.method).toBe("disabled");
      expect(method.reason).toBe("no_topup_methods_available");
    });

    it("should determine spending strategy correctly", () => {
      const userId = "user123";
      
      // Both systems available - legacy first
      featureFlags.flags.LEGACY_WALLET_ENABLED = true;
      featureFlags.flags.LEGACY_WALLET_SPENDING_ENABLED = true;
      featureFlags.flags.STRIPE_CONNECT_ENABLED = true;
      featureFlags.flags.STRIPE_CONNECT_ESCROW_PAYMENTS = true;
      featureFlags.flags.CONNECT_PAYMENTS_ROLLOUT_PERCENTAGE = 100;
      featureFlags.flags.LEGACY_FIRST_SPENDING = true;
      
      let strategy = featureFlags.getSpendingStrategy(userId);
      expect(strategy.strategy).toBe("legacy_first_hybrid");
      
      // Connect first
      featureFlags.flags.LEGACY_FIRST_SPENDING = false;
      strategy = featureFlags.getSpendingStrategy(userId);
      expect(strategy.strategy).toBe("connect_first_hybrid");
      
      // Legacy only
      featureFlags.flags.STRIPE_CONNECT_ENABLED = false;
      strategy = featureFlags.getSpendingStrategy(userId);
      expect(strategy.strategy).toBe("legacy_only");
      
      // Connect only
      featureFlags.flags.STRIPE_CONNECT_ENABLED = true;
      featureFlags.flags.LEGACY_WALLET_ENABLED = false;
      strategy = featureFlags.getSpendingStrategy(userId);
      expect(strategy.strategy).toBe("connect_only");
      
      // No methods available
      featureFlags.flags.STRIPE_CONNECT_ENABLED = false;
      strategy = featureFlags.getSpendingStrategy(userId);
      expect(strategy.strategy).toBe("disabled");
    });

    it("should determine seller payout method correctly", () => {
      const sellerId = "seller123";
      
      // Connect available
      featureFlags.flags.STRIPE_CONNECT_ENABLED = true;
      featureFlags.flags.STRIPE_CONNECT_SELLER_PAYOUTS = true;
      featureFlags.flags.SELLER_ONBOARDING_ROLLOUT_PERCENTAGE = 100;
      
      let method = featureFlags.getSellerPayoutMethod(sellerId);
      expect(method.method).toBe("stripe_connect");
      
      // Connect not available
      featureFlags.flags.STRIPE_CONNECT_ENABLED = false;
      method = featureFlags.getSellerPayoutMethod(sellerId);
      expect(method.method).toBe("manual");
      
      // Maintenance mode
      featureFlags.flags.MAINTENANCE_MODE = true;
      method = featureFlags.getSellerPayoutMethod(sellerId);
      expect(method.method).toBe("manual");
      expect(method.reason).toBe("maintenance_mode");
    });
  });

  describe("Administrative methods", () => {
    it("should update feature flags", () => {
      const result = featureFlags.updateFeatureFlag("LEGACY_WALLET_ENABLED", false);
      
      expect(result.success).toBe(true);
      expect(result.flagName).toBe("LEGACY_WALLET_ENABLED");
      expect(result.oldValue).toBe(true);
      expect(result.newValue).toBe(false);
      expect(featureFlags.flags.LEGACY_WALLET_ENABLED).toBe(false);
    });

    it("should throw error for unknown feature flags", () => {
      expect(() => {
        featureFlags.updateFeatureFlag("UNKNOWN_FLAG", true);
      }).toThrow("Unknown feature flag: UNKNOWN_FLAG");
    });

    it("should emergency disable payments", () => {
      const result = featureFlags.emergencyDisablePayments("test_reason");
      
      expect(result.success).toBe(true);
      expect(result.reason).toBe("test_reason");
      expect(featureFlags.flags.EMERGENCY_DISABLE_PAYMENTS).toBe(true);
    });

    it("should emergency enable legacy only", () => {
      const result = featureFlags.emergencyEnableLegacyOnly("test_reason");
      
      expect(result.success).toBe(true);
      expect(result.reason).toBe("test_reason");
      expect(featureFlags.flags.EMERGENCY_LEGACY_ONLY).toBe(true);
      expect(featureFlags.flags.STRIPE_CONNECT_ENABLED).toBe(false);
    });

    it("should clear emergency flags", () => {
      featureFlags.flags.EMERGENCY_DISABLE_PAYMENTS = true;
      featureFlags.flags.EMERGENCY_LEGACY_ONLY = true;
      
      const result = featureFlags.clearEmergencyFlags();
      
      expect(result.success).toBe(true);
      expect(featureFlags.flags.EMERGENCY_DISABLE_PAYMENTS).toBe(false);
      expect(featureFlags.flags.EMERGENCY_LEGACY_ONLY).toBe(false);
    });

    it("should get feature flag status", () => {
      const status = featureFlags.getFeatureFlagStatus();
      
      expect(status.flags).toBeDefined();
      expect(status.userOverrides).toBe(0);
      expect(status.lastUpdated).toBeDefined();
      expect(status.environment).toBeDefined();
    });

    it("should reload feature flags", () => {
      // Change a flag
      featureFlags.flags.LEGACY_WALLET_ENABLED = false;
      
      // Set environment variable
      process.env.FEATURE_USE_LEGACY_WALLET = "true";
      
      const result = featureFlags.reloadFeatureFlags();
      
      expect(result.success).toBe(true);
      expect(result.changes.length).toBeGreaterThan(0);
      expect(featureFlags.flags.LEGACY_WALLET_ENABLED).toBe(true);
    });
  });
});