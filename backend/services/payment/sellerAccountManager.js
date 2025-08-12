const StripeAdapter = require("./stripeAdapter");
const PaymentValidation = require("./paymentValidation");
const PaymentLogger = require("./paymentLogger");
const { PaymentError, AccountNotVerifiedError } = require("./paymentErrors");
const { StripeAccount } = require("../../models/stripeAccount");
const { User } = require("../../models/user");
const { configs } = require("../../configs");

class SellerAccountManager {
  constructor(stripeAdapter = null) {
    this.stripeAdapter = stripeAdapter || new StripeAdapter();
    this.logger = new PaymentLogger();
  }

  /**
   * Create Stripe Connect account for seller with comprehensive validation
   */
  async createStripeAccountForSeller(sellerId, options = {}) {
    try {
      // Validate seller exists and is eligible
      const seller = await this.validateSellerEligibility(sellerId);
      
      const {
        country = "US",
        businessType = "individual",
        capabilities = ["card_payments", "transfers"]
      } = options;

      // Validate inputs
      PaymentValidation.validateUserId(sellerId);
      PaymentValidation.validateCountry(country);

      const correlationId = this.logger.logOperationStart(
        { type: "create_seller_account", id: sellerId },
        { country, businessType, capabilities }
      );

      // Check if account already exists
      const existingAccount = await StripeAccount.getBySellerId(sellerId);
      if (existingAccount) {
        this.logger.logOperationSuccess(
          { type: "create_seller_account", id: sellerId },
          { existing: true, stripeAccountId: existingAccount.stripeAccountId },
          correlationId
        );
        
        return {
          success: true,
          stripeAccountId: existingAccount.stripeAccountId,
          status: existingAccount.status,
          existing: true,
          requiresOnboarding: !existingAccount.detailsSubmitted
        };
      }

      // Create the Stripe Connect account
      const result = await this.stripeAdapter.createStripeAccountForSeller(sellerId, country);

      // Update seller record with Stripe account ID
      await this.updateSellerWithStripeAccount(sellerId, result.stripeAccountId);

      this.logger.logOperationSuccess(
        { type: "create_seller_account", id: sellerId },
        result,
        correlationId
      );

      return {
        success: true,
        ...result,
        requiresOnboarding: true
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "create_seller_account", id: sellerId },
        error
      );
      throw error;
    }
  }

  /**
   * Create account onboarding link for seller
   */
  async createAccountLink(sellerId, options = {}) {
    try {
      PaymentValidation.validateUserId(sellerId);

      const {
        refreshUrl = `${configs.APP_DOMAIN}/seller/onboarding/refresh`,
        returnUrl = `${configs.APP_DOMAIN}/seller/onboarding/complete`,
        type = "account_onboarding"
      } = options;

      // Validate URLs
      PaymentValidation.validateUrl(refreshUrl, "Refresh URL");
      PaymentValidation.validateUrl(returnUrl, "Return URL");

      const correlationId = this.logger.logOperationStart(
        { type: "create_account_link", id: sellerId },
        { refreshUrl, returnUrl, type }
      );

      // Get seller's Stripe account
      const stripeAccount = await StripeAccount.getBySellerId(sellerId);
      if (!stripeAccount) {
        throw new PaymentError(
          `No Stripe account found for seller ${sellerId}`,
          "STRIPE_ACCOUNT_NOT_FOUND",
          404
        );
      }

      // Create the account link
      const result = await this.stripeAdapter.createAccountLink(
        stripeAccount.stripeAccountId,
        refreshUrl,
        returnUrl
      );

      this.logger.logOperationSuccess(
        { type: "create_account_link", id: sellerId },
        { url: result.url, expiresAt: result.expiresAt },
        correlationId
      );

      return {
        success: true,
        onboardingUrl: result.url,
        expiresAt: result.expiresAt,
        stripeAccountId: stripeAccount.stripeAccountId
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "create_account_link", id: sellerId },
        error
      );
      throw error;
    }
  }

  /**
   * Get comprehensive seller account status
   */
  async getSellerAccountStatus(sellerId) {
    try {
      PaymentValidation.validateUserId(sellerId);

      const correlationId = this.logger.logOperationStart(
        { type: "get_seller_status", id: sellerId }
      );

      // Get seller's Stripe account from database
      const stripeAccount = await StripeAccount.getBySellerId(sellerId);
      if (!stripeAccount) {
        return {
          success: true,
          hasStripeAccount: false,
          requiresAccountCreation: true
        };
      }

      // Get fresh status from Stripe
      const stripeStatus = await this.stripeAdapter.getAccountStatus(stripeAccount.stripeAccountId);

      // Calculate comprehensive status
      const status = this.calculateAccountStatus(stripeAccount, stripeStatus);

      this.logger.logOperationSuccess(
        { type: "get_seller_status", id: sellerId },
        status,
        correlationId
      );

      return {
        success: true,
        hasStripeAccount: true,
        stripeAccountId: stripeAccount.stripeAccountId,
        ...status
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "get_seller_status", id: sellerId },
        error
      );
      throw error;
    }
  }

  /**
   * Update seller account information from Stripe webhook
   */
  async updateSellerAccountFromWebhook(stripeAccountId, stripeAccountData) {
    try {
      const correlationId = this.logger.logOperationStart(
        { type: "update_from_webhook", id: stripeAccountId }
      );

      const stripeAccount = await StripeAccount.getByStripeAccountId(stripeAccountId);
      if (!stripeAccount) {
        throw new PaymentError(
          `Stripe account ${stripeAccountId} not found in database`,
          "STRIPE_ACCOUNT_NOT_FOUND",
          404
        );
      }

      // Update account with fresh Stripe data
      await stripeAccount.updateFromStripeAccount(stripeAccountData);

      // Log significant status changes
      const previousStatus = stripeAccount.status;
      const newStatus = stripeAccount.status;
      
      if (previousStatus !== newStatus) {
        this.logger.logOperationSuccess(
          { type: "account_status_change", id: stripeAccountId },
          { from: previousStatus, to: newStatus }
        );
      }

      this.logger.logOperationSuccess(
        { type: "update_from_webhook", id: stripeAccountId },
        { updated: true },
        correlationId
      );

      return {
        success: true,
        updated: true,
        statusChanged: previousStatus !== newStatus,
        newStatus
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "update_from_webhook", id: stripeAccountId },
        error
      );
      throw error;
    }
  }

  /**
   * Check if seller can receive transfers
   */
  async canSellerReceiveTransfers(sellerId) {
    try {
      const status = await this.getSellerAccountStatus(sellerId);
      
      if (!status.hasStripeAccount) {
        return {
          canReceive: false,
          reason: "NO_STRIPE_ACCOUNT",
          message: "Seller has not set up Stripe Connect account"
        };
      }

      if (!status.isFullyVerified) {
        return {
          canReceive: false,
          reason: "ACCOUNT_NOT_VERIFIED",
          message: "Seller account is not fully verified",
          requirements: status.requirements
        };
      }

      if (!status.payoutsEnabled) {
        return {
          canReceive: false,
          reason: "PAYOUTS_DISABLED",
          message: "Payouts are not enabled for this account"
        };
      }

      return {
        canReceive: true,
        stripeAccountId: status.stripeAccountId
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "check_transfer_eligibility", id: sellerId },
        error
      );
      throw error;
    }
  }

  /**
   * Get sellers requiring account migration
   */
  async getSellersRequiringMigration(options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      // Find sellers who don't have Stripe Connect accounts yet
      const sellers = await User.find({
        role: "seller",
        isActive: true
      })
      .select("_id email name createdAt")
      .skip(offset)
      .limit(limit)
      .lean();

      const sellersWithStatus = await Promise.all(
        sellers.map(async (seller) => {
          const stripeAccount = await StripeAccount.getBySellerId(seller._id);
          return {
            ...seller,
            hasStripeAccount: !!stripeAccount,
            stripeAccountStatus: stripeAccount?.status || null,
            requiresMigration: !stripeAccount
          };
        })
      );

      const requiresMigration = sellersWithStatus.filter(s => s.requiresMigration);

      return {
        success: true,
        sellers: sellersWithStatus,
        requiresMigration,
        stats: {
          total: sellersWithStatus.length,
          withStripeAccount: sellersWithStatus.filter(s => s.hasStripeAccount).length,
          requiresMigration: requiresMigration.length
        }
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "get_migration_candidates" },
        error
      );
      throw error;
    }
  }

  // Private helper methods

  async validateSellerEligibility(sellerId) {
    const seller = await User.findById(sellerId);
    if (!seller) {
      throw new PaymentError(
        `Seller ${sellerId} not found`,
        "SELLER_NOT_FOUND",
        404
      );
    }

    if (seller.role !== "seller") {
      throw new PaymentError(
        `User ${sellerId} is not a seller`,
        "NOT_A_SELLER",
        400
      );
    }

    if (!seller.isActive) {
      throw new PaymentError(
        `Seller ${sellerId} account is not active`,
        "SELLER_INACTIVE",
        400
      );
    }

    return seller;
  }

  async updateSellerWithStripeAccount(sellerId, stripeAccountId) {
    try {
      await User.findByIdAndUpdate(sellerId, {
        stripeConnectAccountId: stripeAccountId,
        stripeConnectSetupAt: new Date()
      });
    } catch (error) {
      // Log but don't fail the operation
      this.logger.logOperationFailure(
        { type: "update_seller_record", id: sellerId },
        error
      );
    }
  }

  calculateAccountStatus(stripeAccount, stripeStatus) {
    const isFullyVerified = stripeAccount.isFullyVerified();
    const hasRequirements = stripeAccount.currentlyDue.length > 0 || stripeAccount.pastDue.length > 0;

    return {
      status: stripeAccount.status,
      isFullyVerified,
      detailsSubmitted: stripeAccount.detailsSubmitted,
      chargesEnabled: stripeAccount.chargesEnabled,
      payoutsEnabled: stripeAccount.payoutsEnabled,
      requiresOnboarding: !stripeAccount.detailsSubmitted,
      hasRequirements,
      requirements: {
        currentlyDue: stripeAccount.currentlyDue,
        eventuallyDue: stripeAccount.eventuallyDue,
        pastDue: stripeAccount.pastDue,
        pendingVerification: stripeAccount.pendingVerification
      },
      capabilities: stripeAccount.capabilities,
      country: stripeAccount.country,
      currency: stripeAccount.currency,
      lastUpdated: stripeAccount.updatedAt
    };
  }
}

module.exports = SellerAccountManager;