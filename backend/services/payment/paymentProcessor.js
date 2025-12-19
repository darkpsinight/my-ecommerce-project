const StripeAdapter = require("./stripeAdapter");
const PaymentValidation = require("./paymentValidation");
const AccountValidation = require("./accountValidation");
const PaymentLogger = require("./paymentLogger");
const {
  PaymentError,
  InsufficientFundsError,
  AccountNotVerifiedError,
  PaymentErrorHandler
} = require("./paymentErrors");
const { PaymentOperation } = require("../../models/paymentOperation");
const { StripeAccount } = require("../../models/stripeAccount");
const { LegacyWallet } = require("../../models/legacyWallet");
const { configs } = require("../../configs");

class PaymentProcessor {
  constructor(stripeAdapter = null) {
    this.stripeAdapter = stripeAdapter || new StripeAdapter();
    this.logger = new PaymentLogger();
    this.config = {
      defaultPlatformFeeRate: 0, // 0% platform fee (Buyer pays Stripe fees, Platform takes 0%)
      minTransferAmount: 100, // $1.00 minimum
      maxTransferAmount: 100000000, // $1M maximum
      ...configs
    };
  }

  /**
   * Create payment intent on platform account for escrow
   */
  async createEscrowPaymentIntent(request) {
    try {
      const {
        amountCents,
        currency = "USD",
        buyerId,
        escrowId,
        metadata = {}
      } = request;

      // Validate request
      PaymentValidation.validatePaymentRequest({
        amountCents,
        currency,
        userId: buyerId,
        metadata
      });

      const correlationId = this.logger.logOperationStart(
        { type: "create_escrow_payment", id: escrowId, amountCents, currency },
        { buyerId, escrowId }
      );

      // Create payment intent with escrow metadata
      const escrowMetadata = {
        ...metadata,
        buyerId: buyerId.toString(),
        escrowId: escrowId.toString(),
        type: "escrow_payment",
        createdBy: "payment_processor"
      };

      const result = await this.stripeAdapter.createPaymentIntentOnPlatform(
        amountCents,
        currency,
        escrowMetadata
      );

      this.logger.logOperationSuccess(
        { type: "create_escrow_payment", id: escrowId, amountCents, currency },
        result,
        correlationId
      );

      return {
        success: true,
        paymentIntentId: result.paymentIntentId,
        clientSecret: result.clientSecret,
        status: result.status,
        amountCents,
        currency,
        escrowId,
        requiresAction: result.status === "requires_action"
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "create_escrow_payment", id: request.escrowId },
        error
      );
      throw error;
    }
  }

  /**
   * Create wallet top-up payment intent
   */
  async createWalletTopUpIntent(request) {
    try {
      const {
        amountCents,
        currency = "USD",
        buyerId,
        metadata = {}
      } = request;

      // Validate request
      PaymentValidation.validatePaymentRequest({
        amountCents,
        currency,
        userId: buyerId,
        metadata
      });

      // Check if legacy wallet system is disabled for new top-ups
      if (configs.FEATURE_LEGACY_WALLET_READONLY) {
        throw new PaymentError(
          "New wallet top-ups are temporarily disabled during migration",
          "TOPUP_DISABLED_MIGRATION",
          503
        );
      }

      const correlationId = this.logger.logOperationStart(
        { type: "create_wallet_topup", id: buyerId, amountCents, currency },
        { buyerId }
      );

      const result = await this.stripeAdapter.createTopUpIntent(
        buyerId,
        amountCents,
        currency,
        metadata
      );

      this.logger.logOperationSuccess(
        { type: "create_wallet_topup", id: buyerId, amountCents, currency },
        result,
        correlationId
      );

      return {
        success: true,
        paymentIntentId: result.paymentIntentId,
        clientSecret: result.clientSecret,
        status: result.status,
        amountCents,
        currency,
        type: "wallet_topup"
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "create_wallet_topup", id: request.buyerId },
        error
      );
      throw error;
    }
  }

  /**
   * Process transfer to seller after escrow release
   */
  async createTransferToSeller(request) {
    try {
      const {
        escrowId,
        amountCents,
        sellerId,
        currency = "USD",
        platformFeeRate = this.config.defaultPlatformFeeRate,
        metadata = {}
      } = request;

      // Validate request
      PaymentValidation.validateTransferRequest({
        amountCents,
        sellerId,
        stripeAccountId: "placeholder" // Will be validated below
      });

      AccountValidation.validatePlatformFeeRate(platformFeeRate);

      const correlationId = this.logger.logOperationStart(
        { type: "create_seller_transfer", id: escrowId, amountCents, currency },
        { sellerId, platformFeeRate }
      );

      // Get seller's Stripe account
      const stripeAccount = await StripeAccount.getBySellerId(sellerId);
      if (!stripeAccount) {
        throw new PaymentError(
          `No Stripe Connect account found for seller ${sellerId}`,
          "SELLER_NO_STRIPE_ACCOUNT",
          404
        );
      }

      // Validate account is ready for transfers
      AccountValidation.validateAccountForTransfers(stripeAccount);

      // Calculate fees
      const feeCalculation = this.calculateTransferFees(amountCents, platformFeeRate);

      // Create the transfer
      const result = await this.stripeAdapter.createTransferToSeller(
        escrowId,
        amountCents,
        sellerId,
        stripeAccount.stripeAccountId,
        {
          ...metadata,
          currency,
          platformFeeRate,
          ...feeCalculation
        }
      );

      this.logger.logOperationSuccess(
        { type: "create_seller_transfer", id: escrowId, amountCents, currency },
        { ...result, feeCalculation },
        correlationId
      );

      return {
        success: true,
        transferId: result.transferId,
        amountCents: result.amountCents,
        platformFeeCents: result.platformFeeCents,
        netAmountCents: result.amountCents,
        currency: result.currency,
        status: result.status,
        stripeAccountId: stripeAccount.stripeAccountId,
        feeCalculation
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "create_seller_transfer", id: request.escrowId },
        error
      );
      throw error;
    }
  }

  /**
   * Process refund for platform payment
   */
  async processRefund(request) {
    try {
      const {
        paymentIntentId,
        amountCents = null,
        reason = "requested_by_customer",
        metadata = {}
      } = request;

      // Validate payment intent ID
      PaymentValidation.validatePaymentIntentId(paymentIntentId);

      if (amountCents !== null) {
        PaymentValidation.validateAmount(amountCents);
      }

      const correlationId = this.logger.logOperationStart(
        { type: "process_refund", id: paymentIntentId, amountCents },
        { reason }
      );

      // Get the original payment operation
      const originalOperation = await PaymentOperation.getByStripeId(paymentIntentId);
      if (!originalOperation) {
        throw new PaymentError(
          `Payment operation not found for payment intent ${paymentIntentId}`,
          "PAYMENT_OPERATION_NOT_FOUND",
          404
        );
      }

      // Validate refund amount
      const refundAmount = amountCents || originalOperation.amountCents;
      if (refundAmount > originalOperation.amountCents) {
        throw new PaymentError(
          `Refund amount ${refundAmount} cannot exceed original amount ${originalOperation.amountCents}`,
          "REFUND_AMOUNT_EXCEEDS_ORIGINAL",
          400
        );
      }

      const result = await this.stripeAdapter.refundPayment(
        paymentIntentId,
        refundAmount,
        reason
      );

      this.logger.logOperationSuccess(
        { type: "process_refund", id: paymentIntentId, amountCents: refundAmount },
        result,
        correlationId
      );

      return {
        success: true,
        refundId: result.refundId,
        amountCents: result.amountCents,
        currency: result.currency,
        status: result.status,
        reason: result.reason,
        originalAmountCents: originalOperation.amountCents
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "process_refund", id: request.paymentIntentId },
        error
      );
      throw error;
    }
  }

  /**
   * Process legacy wallet spending for backward compatibility
   */
  async processLegacyWalletSpending(request) {
    try {
      const {
        buyerId,
        amountCents,
        escrowId,
        description = "Legacy wallet spending"
      } = request;

      // Validate request
      PaymentValidation.validateUserId(buyerId);
      PaymentValidation.validateAmount(amountCents);

      const correlationId = this.logger.logOperationStart(
        { type: "legacy_wallet_spending", id: buyerId, amountCents },
        { escrowId }
      );

      // Get legacy wallet
      const legacyWallet = await LegacyWallet.getByUserId(buyerId);
      if (!legacyWallet) {
        throw new InsufficientFundsError(0, amountCents, "USD");
      }

      // Check if sufficient funds
      if (!legacyWallet.hasEnoughFunds(amountCents)) {
        throw new InsufficientFundsError(
          legacyWallet.balanceCents,
          amountCents,
          legacyWallet.currency
        );
      }

      // Deduct from legacy wallet
      await legacyWallet.spendBalance(amountCents);

      // Create a record of the operation (not in Stripe)
      const operation = await PaymentOperation.create({
        type: "charge",
        stripeId: `legacy_${Date.now()}_${buyerId}`,
        amountCents,
        currency: legacyWallet.currency,
        userId: buyerId,
        escrowId,
        description,
        status: "succeeded",
        metadata: {
          source: "legacy_wallet",
          legacyWalletId: legacyWallet._id
        }
      });

      this.logger.logOperationSuccess(
        { type: "legacy_wallet_spending", id: buyerId, amountCents },
        { operationId: operation._id, remainingBalance: legacyWallet.balanceCents },
        correlationId
      );

      return {
        success: true,
        operationId: operation._id,
        amountCents,
        currency: legacyWallet.currency,
        remainingBalanceCents: legacyWallet.balanceCents,
        source: "legacy_wallet"
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "legacy_wallet_spending", id: request.buyerId },
        error
      );
      throw error;
    }
  }

  /**
   * Process legacy wallet refund
   */
  async processLegacyWalletRefund(request) {
    try {
      const {
        buyerId,
        amountCents,
        originalOperationId,
        reason = "refund_to_legacy_wallet"
      } = request;

      // Validate request
      PaymentValidation.validateUserId(buyerId);
      PaymentValidation.validateAmount(amountCents);

      const correlationId = this.logger.logOperationStart(
        { type: "legacy_wallet_refund", id: buyerId, amountCents },
        { originalOperationId, reason }
      );

      // Get or create legacy wallet
      let legacyWallet = await LegacyWallet.getByUserId(buyerId);
      if (!legacyWallet) {
        // Create a legacy wallet for refund purposes
        legacyWallet = await LegacyWallet.create({
          userId: buyerId,
          balanceCents: 0,
          currency: "USD",
          source: "refund_created"
        });
      }

      // Add refund to legacy wallet
      await legacyWallet.refundToBalance(amountCents);

      this.logger.logOperationSuccess(
        { type: "legacy_wallet_refund", id: buyerId, amountCents },
        { newBalance: legacyWallet.balanceCents },
        correlationId
      );

      return {
        success: true,
        amountCents,
        currency: legacyWallet.currency,
        newBalanceCents: legacyWallet.balanceCents,
        refundedToLegacyWallet: true
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "legacy_wallet_refund", id: request.buyerId },
        error
      );
      throw error;
    }
  }

  /**
   * Get payment status and details
   */
  async getPaymentStatus(paymentIntentId) {
    try {
      PaymentValidation.validatePaymentIntentId(paymentIntentId);

      const correlationId = this.logger.logOperationStart(
        { type: "get_payment_status", id: paymentIntentId }
      );

      // Get from database first
      const operation = await PaymentOperation.getByStripeId(paymentIntentId);

      // Get fresh status from Stripe
      const stripeStatus = await this.stripeAdapter.confirmPaymentIntent(paymentIntentId);

      this.logger.logOperationSuccess(
        { type: "get_payment_status", id: paymentIntentId },
        stripeStatus,
        correlationId
      );

      return {
        success: true,
        paymentIntentId,
        status: stripeStatus.status,
        amountCents: stripeStatus.amountCents,
        currency: stripeStatus.currency,
        databaseRecord: operation ? {
          id: operation._id,
          status: operation.status,
          createdAt: operation.createdAt
        } : null
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "get_payment_status", id: paymentIntentId },
        error
      );
      throw error;
    }
  }

  // Private helper methods

  calculateTransferFees(amountCents, platformFeeRate) {
    const platformFeeCents = Math.round(amountCents * platformFeeRate);
    const netAmountCents = amountCents - platformFeeCents;

    // Ensure minimum transfer amount after fees
    if (netAmountCents < this.config.minTransferAmount) {
      throw new PaymentError(
        `Transfer amount after fees (${netAmountCents} cents) is below minimum (${this.config.minTransferAmount} cents)`,
        "TRANSFER_AMOUNT_TOO_SMALL",
        400
      );
    }

    return {
      originalAmountCents: amountCents,
      platformFeeCents,
      netAmountCents,
      platformFeeRate,
      feePercentage: (platformFeeCents / amountCents) * 100
    };
  }

  validateTransferAmount(amountCents) {
    if (amountCents < this.config.minTransferAmount) {
      throw new PaymentError(
        `Transfer amount ${amountCents} cents is below minimum ${this.config.minTransferAmount} cents`,
        "TRANSFER_AMOUNT_TOO_SMALL",
        400
      );
    }

    if (amountCents > this.config.maxTransferAmount) {
      throw new PaymentError(
        `Transfer amount ${amountCents} cents exceeds maximum ${this.config.maxTransferAmount} cents`,
        "TRANSFER_AMOUNT_TOO_LARGE",
        400
      );
    }

    return true;
  }

  // Utility methods for payment operations

  async getOperationHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 20, type, status } = options;

      PaymentValidation.validateUserId(userId);

      const operations = await PaymentOperation.getOperationsByUser(userId, {
        page,
        limit,
        type,
        status
      });

      return {
        success: true,
        operations,
        pagination: {
          page,
          limit,
          total: operations.length
        }
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "get_operation_history", id: userId },
        error
      );
      throw error;
    }
  }

  async retryFailedOperation(operationId) {
    try {
      const operation = await PaymentOperation.findById(operationId);
      if (!operation) {
        throw new PaymentError(
          `Operation ${operationId} not found`,
          "OPERATION_NOT_FOUND",
          404
        );
      }

      if (operation.status !== "failed") {
        throw new PaymentError(
          `Operation ${operationId} is not in failed status`,
          "OPERATION_NOT_FAILED",
          400
        );
      }

      // Implement retry logic based on operation type
      // This would involve re-calling the appropriate method
      // with the original parameters stored in metadata

      return {
        success: true,
        operationId,
        retryAttempted: true
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "retry_failed_operation", id: operationId },
        error
      );
      throw error;
    }
  }
}

module.exports = PaymentProcessor;