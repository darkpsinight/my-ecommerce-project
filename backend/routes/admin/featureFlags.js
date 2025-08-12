const { getWalletFeatureFlags } = require("../../services/featureFlags/walletFeatureFlags");
const WalletFeatureFlagMiddleware = require("../../middleware/walletFeatureFlagMiddleware");
const { sendSuccessResponse, sendErrorResponse } = require("../../utils/responseHelpers");

/**
 * Admin routes for managing wallet feature flags
 */

/**
 * GET /api/v1/admin/feature-flags/wallet
 * Get current wallet feature flag status
 */
const getWalletFeatureFlags = async (request, reply) => {
  try {
    const featureFlags = getWalletFeatureFlags();
    const status = featureFlags.getFeatureFlagStatus();

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Wallet feature flags retrieved successfully",
      data: status
    });

  } catch (error) {
    request.log.error({
      msg: "Failed to get wallet feature flags",
      error: error.message,
      userId: request.user?.uid
    });

    return sendErrorResponse(reply, 500, "Failed to retrieve feature flags");
  }
};

/**
 * PUT /api/v1/admin/feature-flags/wallet/:flagName
 * Update a specific wallet feature flag
 */
const updateWalletFeatureFlag = async (request, reply) => {
  try {
    const { flagName } = request.params;
    const { value } = request.body;

    if (value === undefined || value === null) {
      return sendErrorResponse(reply, 400, "Flag value is required");
    }

    const featureFlags = getWalletFeatureFlags();
    const result = featureFlags.updateFeatureFlag(flagName, value);

    request.log.info({
      msg: "Feature flag updated",
      flagName,
      oldValue: result.oldValue,
      newValue: result.newValue,
      userId: request.user?.uid
    });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Feature flag updated successfully",
      data: result
    });

  } catch (error) {
    request.log.error({
      msg: "Failed to update feature flag",
      error: error.message,
      flagName: request.params.flagName,
      userId: request.user?.uid
    });

    if (error.message.includes("Unknown feature flag")) {
      return sendErrorResponse(reply, 404, error.message);
    }

    return sendErrorResponse(reply, 500, "Failed to update feature flag");
  }
};

/**
 * POST /api/v1/admin/feature-flags/wallet/emergency-disable
 * Emergency disable all payments
 */
const emergencyDisablePayments = async (request, reply) => {
  try {
    const { reason } = request.body;
    const featureFlags = getWalletFeatureFlags();
    
    const result = featureFlags.emergencyDisablePayments(reason || "admin_manual_trigger");

    request.log.warn({
      msg: "Emergency payments disabled",
      reason: result.reason,
      userId: request.user?.uid,
      timestamp: result.timestamp
    });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Payments emergency disabled successfully",
      data: result
    });

  } catch (error) {
    request.log.error({
      msg: "Failed to emergency disable payments",
      error: error.message,
      userId: request.user?.uid
    });

    return sendErrorResponse(reply, 500, "Failed to emergency disable payments");
  }
};

/**
 * POST /api/v1/admin/feature-flags/wallet/emergency-legacy-only
 * Emergency enable legacy-only mode
 */
const emergencyEnableLegacyOnly = async (request, reply) => {
  try {
    const { reason } = request.body;
    const featureFlags = getWalletFeatureFlags();
    
    const result = featureFlags.emergencyEnableLegacyOnly(reason || "admin_manual_trigger");

    request.log.warn({
      msg: "Emergency legacy-only mode enabled",
      reason: result.reason,
      userId: request.user?.uid,
      timestamp: result.timestamp
    });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Legacy-only mode enabled successfully",
      data: result
    });

  } catch (error) {
    request.log.error({
      msg: "Failed to enable legacy-only mode",
      error: error.message,
      userId: request.user?.uid
    });

    return sendErrorResponse(reply, 500, "Failed to enable legacy-only mode");
  }
};

/**
 * POST /api/v1/admin/feature-flags/wallet/clear-emergency
 * Clear all emergency flags
 */
const clearEmergencyFlags = async (request, reply) => {
  try {
    const featureFlags = getWalletFeatureFlags();
    const result = featureFlags.clearEmergencyFlags();

    request.log.info({
      msg: "Emergency flags cleared",
      userId: request.user?.uid,
      timestamp: result.timestamp
    });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Emergency flags cleared successfully",
      data: result
    });

  } catch (error) {
    request.log.error({
      msg: "Failed to clear emergency flags",
      error: error.message,
      userId: request.user?.uid
    });

    return sendErrorResponse(reply, 500, "Failed to clear emergency flags");
  }
};

/**
 * POST /api/v1/admin/feature-flags/wallet/reload
 * Reload feature flags from environment
 */
const reloadFeatureFlags = async (request, reply) => {
  try {
    const featureFlags = getWalletFeatureFlags();
    const result = featureFlags.reloadFeatureFlags();

    request.log.info({
      msg: "Feature flags reloaded",
      changes: result.changes,
      userId: request.user?.uid
    });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Feature flags reloaded successfully",
      data: result
    });

  } catch (error) {
    request.log.error({
      msg: "Failed to reload feature flags",
      error: error.message,
      userId: request.user?.uid
    });

    return sendErrorResponse(reply, 500, "Failed to reload feature flags");
  }
};

/**
 * PUT /api/v1/admin/feature-flags/wallet/user/:userId/:flagName
 * Set user-specific feature flag override
 */
const setUserFeatureFlagOverride = async (request, reply) => {
  try {
    const { userId, flagName } = request.params;
    const { value } = request.body;

    if (value === undefined || value === null) {
      return sendErrorResponse(reply, 400, "Flag value is required");
    }

    const featureFlags = getWalletFeatureFlags();
    featureFlags.setUserOverride(userId, flagName, value);

    request.log.info({
      msg: "User feature flag override set",
      targetUserId: userId,
      flagName,
      value,
      adminUserId: request.user?.uid
    });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "User feature flag override set successfully",
      data: {
        userId,
        flagName,
        value,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    request.log.error({
      msg: "Failed to set user feature flag override",
      error: error.message,
      targetUserId: request.params.userId,
      flagName: request.params.flagName,
      adminUserId: request.user?.uid
    });

    return sendErrorResponse(reply, 500, "Failed to set user feature flag override");
  }
};

/**
 * DELETE /api/v1/admin/feature-flags/wallet/user/:userId/:flagName
 * Remove user-specific feature flag override
 */
const removeUserFeatureFlagOverride = async (request, reply) => {
  try {
    const { userId, flagName } = request.params;

    const featureFlags = getWalletFeatureFlags();
    featureFlags.removeUserOverride(userId, flagName);

    request.log.info({
      msg: "User feature flag override removed",
      targetUserId: userId,
      flagName,
      adminUserId: request.user?.uid
    });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "User feature flag override removed successfully",
      data: {
        userId,
        flagName,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    request.log.error({
      msg: "Failed to remove user feature flag override",
      error: error.message,
      targetUserId: request.params.userId,
      flagName: request.params.flagName,
      adminUserId: request.user?.uid
    });

    return sendErrorResponse(reply, 500, "Failed to remove user feature flag override");
  }
};

/**
 * GET /api/v1/admin/feature-flags/wallet/user/:userId
 * Get user's effective feature flags
 */
const getUserFeatureFlags = async (request, reply) => {
  try {
    const { userId } = request.params;
    const featureFlags = getWalletFeatureFlags();

    const userFlags = {
      userId,
      effectiveFlags: {
        legacyWalletEnabled: featureFlags.getFlagForUser(userId, "LEGACY_WALLET_ENABLED"),
        stripeConnectEnabled: featureFlags.getFlagForUser(userId, "STRIPE_CONNECT_ENABLED"),
        newWalletEligible: featureFlags.isUserEligibleForNewWallet(userId),
        connectPaymentsEligible: featureFlags.isUserEligibleForConnectPayments(userId),
        sellerConnectEligible: featureFlags.isSellerEligibleForConnectOnboarding(userId)
      },
      strategies: {
        topUpMethod: featureFlags.getTopUpMethod(userId),
        spendingStrategy: featureFlags.getSpendingStrategy(userId),
        payoutMethod: featureFlags.getSellerPayoutMethod(userId)
      },
      rolloutStatus: {
        newWalletRollout: featureFlags.flags.NEW_WALLET_ROLLOUT_PERCENTAGE,
        sellerOnboardingRollout: featureFlags.flags.SELLER_ONBOARDING_ROLLOUT_PERCENTAGE,
        connectPaymentsRollout: featureFlags.flags.CONNECT_PAYMENTS_ROLLOUT_PERCENTAGE,
        userHash: featureFlags.hashUserId(userId) % 100
      }
    };

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "User feature flags retrieved successfully",
      data: userFlags
    });

  } catch (error) {
    request.log.error({
      msg: "Failed to get user feature flags",
      error: error.message,
      targetUserId: request.params.userId,
      adminUserId: request.user?.uid
    });

    return sendErrorResponse(reply, 500, "Failed to retrieve user feature flags");
  }
};

module.exports = {
  getWalletFeatureFlags,
  updateWalletFeatureFlag,
  emergencyDisablePayments,
  emergencyEnableLegacyOnly,
  clearEmergencyFlags,
  reloadFeatureFlags,
  setUserFeatureFlagOverride,
  removeUserFeatureFlagOverride,
  getUserFeatureFlags
};