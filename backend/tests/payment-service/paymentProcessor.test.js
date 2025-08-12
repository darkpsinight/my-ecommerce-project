const PaymentProcessor = require("../../services/payment/paymentProcessor");
const StripeAdapter = require("../../services/payment/stripeAdapter");
const { PaymentOperation } = require("../../models/paymentOperation");
const { StripeAccount } = require("../../models/stripeAccount");
const { LegacyWallet } = require("../../models/legacyWallet");
const { PaymentError, InsufficientFundsError } = require("../../services/payment/paymentErrors");

// Mock dependencies
jest.mock("../../services/payment/stripeAdapter");
jest.mock("../../models/paymentOperation");
jest.mock("../../models/stripeAccount");
jest.mock("../../models/legacyWallet");

describe("PaymentProcessor", () => {
  let paymentProcessor;
  let mockStripeAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStripeAdapter = new StripeAdapter();
    paymentProcessor = new PaymentProcessor(mockStripeAdapter);
  });

  describe("createEscrowPaymentIntent", () => {
    const validRequest = {
      amountCents: 5000,
      currency: "USD",
      buyerId: "buyer123",
      escrowId: "escrow123",
      metadata: { productId: "product123" }
    };

    it("should create escrow payment intent successfully", async () => {
      const mockStripeResult = {
        paymentIntentId: "pi_123",
        clientSecret: "pi_123_secret",
        status: "requires_payment_method",
        amountCents: 5000,
        currency: "USD"
      };

      mockStripeAdapter.createPaymentIntentOnPlatform.mockResolvedValue(mockStripeResult);

      const result = await paymentProcessor.createEscrowPaymentIntent(validRequest);

      expect(mockStripeAdapter.createPaymentIntentOnPlatform).toHaveBeenCalledWith(
        5000,
        "USD",
        expect.objectContaining({
          buyerId: "buyer123",
          escrowId: "escrow123",
          type: "escrow_payment",
          createdBy: "payment_processor",
          productId: "product123"
        })
      );

      expect(result).toEqual({
        success: true,
        paymentIntentId: "pi_123",
        clientSecret: "pi_123_secret",
        status: "requires_payment_method",
        amountCents: 5000,
        currency: "USD",
        escrowId: "escrow123",
        requiresAction: false
      });
    });

    it("should handle requires_action status", async () => {
      const mockStripeResult = {
        paymentIntentId: "pi_123",
        clientSecret: "pi_123_secret",
        status: "requires_action",
        amountCents: 5000,
        currency: "USD"
      };

      mockStripeAdapter.createPaymentIntentOnPlatform.mockResolvedValue(mockStripeResult);

      const result = await paymentProcessor.createEscrowPaymentIntent(validRequest);

      expect(result.requiresAction).toBe(true);
    });

    it("should validate request parameters", async () => {
      const invalidRequest = {
        amountCents: 10, // Too small
        currency: "USD",
        buyerId: "buyer123",
        escrowId: "escrow123"
      };

      await expect(paymentProcessor.createEscrowPaymentIntent(invalidRequest))
        .rejects.toThrow("Amount must be at least 50 cents");
    });
  });

  describe("createWalletTopUpIntent", () => {
    const validRequest = {
      amountCents: 10000,
      currency: "USD",
      buyerId: "buyer123"
    };

    it("should create wallet top-up intent successfully", async () => {
      const mockStripeResult = {
        paymentIntentId: "pi_topup_123",
        clientSecret: "pi_topup_123_secret",
        status: "requires_payment_method",
        amountCents: 10000,
        currency: "USD"
      };

      mockStripeAdapter.createTopUpIntent.mockResolvedValue(mockStripeResult);

      const result = await paymentProcessor.createWalletTopUpIntent(validRequest);

      expect(mockStripeAdapter.createTopUpIntent).toHaveBeenCalledWith(
        "buyer123",
        10000,
        "USD",
        {}
      );

      expect(result).toEqual({
        success: true,
        paymentIntentId: "pi_topup_123",
        clientSecret: "pi_topup_123_secret",
        status: "requires_payment_method",
        amountCents: 10000,
        currency: "USD",
        type: "wallet_topup"
      });
    });

    it("should reject top-ups when legacy wallet is readonly", async () => {
      // Mock config to simulate readonly mode
      paymentProcessor.config.FEATURE_LEGACY_WALLET_READONLY = true;

      await expect(paymentProcessor.createWalletTopUpIntent(validRequest))
        .rejects.toThrow("New wallet top-ups are temporarily disabled during migration");
    });
  });

  describe("createTransferToSeller", () => {
    const validRequest = {
      escrowId: "escrow123",
      amountCents: 10000,
      sellerId: "seller123",
      currency: "USD",
      platformFeeRate: 0.05
    };

    const mockStripeAccount = {
      _id: "account123",
      stripeAccountId: "acct_123",
      status: "verified",
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
      currentlyDue: [],
      pastDue: []
    };

    beforeEach(() => {
      StripeAccount.getBySellerId.mockResolvedValue(mockStripeAccount);
    });

    it("should create transfer to seller successfully", async () => {
      const mockTransferResult = {
        transferId: "tr_123",
        amountCents: 9500, // After 5% platform fee
        platformFeeCents: 500,
        currency: "USD",
        status: "pending"
      };

      mockStripeAdapter.createTransferToSeller.mockResolvedValue(mockTransferResult);

      const result = await paymentProcessor.createTransferToSeller(validRequest);

      expect(mockStripeAdapter.createTransferToSeller).toHaveBeenCalledWith(
        "escrow123",
        10000,
        "seller123",
        "acct_123",
        expect.objectContaining({
          currency: "USD",
          platformFeeRate: 0.05,
          originalAmountCents: 10000,
          platformFeeCents: 500,
          netAmountCents: 9500
        })
      );

      expect(result).toEqual({
        success: true,
        transferId: "tr_123",
        amountCents: 9500,
        platformFeeCents: 500,
        netAmountCents: 9500,
        currency: "USD",
        status: "pending",
        stripeAccountId: "acct_123",
        feeCalculation: expect.objectContaining({
          originalAmountCents: 10000,
          platformFeeCents: 500,
          netAmountCents: 9500,
          platformFeeRate: 0.05,
          feePercentage: 5
        })
      });
    });

    it("should throw error for seller without Stripe account", async () => {
      StripeAccount.getBySellerId.mockResolvedValue(null);

      await expect(paymentProcessor.createTransferToSeller(validRequest))
        .rejects.toThrow("No Stripe Connect account found for seller seller123");
    });

    it("should validate account readiness for transfers", async () => {
      const unverifiedAccount = {
        ...mockStripeAccount,
        chargesEnabled: false,
        payoutsEnabled: false
      };

      StripeAccount.getBySellerId.mockResolvedValue(unverifiedAccount);

      await expect(paymentProcessor.createTransferToSeller(validRequest))
        .rejects.toThrow("Account not ready for transfers");
    });

    it("should handle custom platform fee rates", async () => {
      const customRequest = {
        ...validRequest,
        platformFeeRate: 0.1 // 10% fee
      };

      mockStripeAdapter.createTransferToSeller.mockResolvedValue({
        transferId: "tr_123",
        amountCents: 9000, // After 10% platform fee
        platformFeeCents: 1000,
        currency: "USD",
        status: "pending"
      });

      const result = await paymentProcessor.createTransferToSeller(customRequest);

      expect(result.feeCalculation.platformFeeCents).toBe(1000);
      expect(result.feeCalculation.feePercentage).toBe(10);
    });

    it("should reject transfers with excessive fees", async () => {
      const highFeeRequest = {
        ...validRequest,
        amountCents: 200, // Small amount
        platformFeeRate: 0.8 // 80% fee would leave too little
      };

      await expect(paymentProcessor.createTransferToSeller(highFeeRequest))
        .rejects.toThrow("Transfer amount after fees");
    });
  });

  describe("processRefund", () => {
    const validRequest = {
      paymentIntentId: "pi_123",
      amountCents: 5000,
      reason: "requested_by_customer"
    };

    const mockOriginalOperation = {
      _id: "op123",
      stripeId: "pi_123",
      amountCents: 10000,
      currency: "USD",
      status: "succeeded"
    };

    beforeEach(() => {
      PaymentOperation.getByStripeId.mockResolvedValue(mockOriginalOperation);
    });

    it("should process full refund successfully", async () => {
      const mockRefundResult = {
        refundId: "re_123",
        amountCents: 10000,
        currency: "USD",
        status: "succeeded",
        reason: "requested_by_customer"
      };

      mockStripeAdapter.refundPayment.mockResolvedValue(mockRefundResult);

      const fullRefundRequest = {
        paymentIntentId: "pi_123",
        reason: "requested_by_customer"
      };

      const result = await paymentProcessor.processRefund(fullRefundRequest);

      expect(mockStripeAdapter.refundPayment).toHaveBeenCalledWith(
        "pi_123",
        10000, // Full amount from original operation
        "requested_by_customer"
      );

      expect(result).toEqual({
        success: true,
        refundId: "re_123",
        amountCents: 10000,
        currency: "USD",
        status: "succeeded",
        reason: "requested_by_customer",
        originalAmountCents: 10000
      });
    });

    it("should process partial refund successfully", async () => {
      const mockRefundResult = {
        refundId: "re_123",
        amountCents: 5000,
        currency: "USD",
        status: "succeeded",
        reason: "requested_by_customer"
      };

      mockStripeAdapter.refundPayment.mockResolvedValue(mockRefundResult);

      const result = await paymentProcessor.processRefund(validRequest);

      expect(mockStripeAdapter.refundPayment).toHaveBeenCalledWith(
        "pi_123",
        5000,
        "requested_by_customer"
      );

      expect(result.amountCents).toBe(5000);
      expect(result.originalAmountCents).toBe(10000);
    });

    it("should throw error for non-existent payment operation", async () => {
      PaymentOperation.getByStripeId.mockResolvedValue(null);

      await expect(paymentProcessor.processRefund(validRequest))
        .rejects.toThrow("Payment operation not found for payment intent pi_123");
    });

    it("should validate refund amount doesn't exceed original", async () => {
      const excessiveRefundRequest = {
        paymentIntentId: "pi_123",
        amountCents: 15000, // More than original 10000
        reason: "requested_by_customer"
      };

      await expect(paymentProcessor.processRefund(excessiveRefundRequest))
        .rejects.toThrow("Refund amount 15000 cannot exceed original amount 10000");
    });
  });

  describe("processLegacyWalletSpending", () => {
    const validRequest = {
      buyerId: "buyer123",
      amountCents: 5000,
      escrowId: "escrow123"
    };

    const mockLegacyWallet = {
      _id: "wallet123",
      userId: "buyer123",
      balanceCents: 10000,
      currency: "USD",
      hasEnoughFunds: jest.fn(),
      spendBalance: jest.fn()
    };

    beforeEach(() => {
      LegacyWallet.getByUserId.mockResolvedValue(mockLegacyWallet);
      mockLegacyWallet.hasEnoughFunds.mockReturnValue(true);
      mockLegacyWallet.spendBalance.mockResolvedValue();
      PaymentOperation.create.mockResolvedValue({
        _id: "op123",
        stripeId: "legacy_123_buyer123"
      });
    });

    it("should process legacy wallet spending successfully", async () => {
      mockLegacyWallet.balanceCents = 5000; // Remaining after spending

      const result = await paymentProcessor.processLegacyWalletSpending(validRequest);

      expect(mockLegacyWallet.hasEnoughFunds).toHaveBeenCalledWith(5000);
      expect(mockLegacyWallet.spendBalance).toHaveBeenCalledWith(5000);

      expect(PaymentOperation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "charge",
          amountCents: 5000,
          currency: "USD",
          userId: "buyer123",
          escrowId: "escrow123",
          status: "succeeded",
          metadata: expect.objectContaining({
            source: "legacy_wallet",
            legacyWalletId: "wallet123"
          })
        })
      );

      expect(result).toEqual({
        success: true,
        operationId: "op123",
        amountCents: 5000,
        currency: "USD",
        remainingBalanceCents: 5000,
        source: "legacy_wallet"
      });
    });

    it("should throw error for non-existent legacy wallet", async () => {
      LegacyWallet.getByUserId.mockResolvedValue(null);

      await expect(paymentProcessor.processLegacyWalletSpending(validRequest))
        .rejects.toThrow(InsufficientFundsError);
    });

    it("should throw error for insufficient funds", async () => {
      mockLegacyWallet.hasEnoughFunds.mockReturnValue(false);

      await expect(paymentProcessor.processLegacyWalletSpending(validRequest))
        .rejects.toThrow(InsufficientFundsError);
    });
  });

  describe("processLegacyWalletRefund", () => {
    const validRequest = {
      buyerId: "buyer123",
      amountCents: 5000,
      originalOperationId: "op123"
    };

    const mockLegacyWallet = {
      _id: "wallet123",
      balanceCents: 15000, // After refund
      currency: "USD",
      refundToBalance: jest.fn()
    };

    it("should process legacy wallet refund successfully", async () => {
      LegacyWallet.getByUserId.mockResolvedValue(mockLegacyWallet);
      mockLegacyWallet.refundToBalance.mockResolvedValue();

      const result = await paymentProcessor.processLegacyWalletRefund(validRequest);

      expect(mockLegacyWallet.refundToBalance).toHaveBeenCalledWith(5000);

      expect(result).toEqual({
        success: true,
        amountCents: 5000,
        currency: "USD",
        newBalanceCents: 15000,
        refundedToLegacyWallet: true
      });
    });

    it("should create legacy wallet if none exists", async () => {
      LegacyWallet.getByUserId.mockResolvedValue(null);
      LegacyWallet.create.mockResolvedValue(mockLegacyWallet);
      mockLegacyWallet.refundToBalance.mockResolvedValue();

      const result = await paymentProcessor.processLegacyWalletRefund(validRequest);

      expect(LegacyWallet.create).toHaveBeenCalledWith({
        userId: "buyer123",
        balanceCents: 0,
        currency: "USD",
        source: "refund_created"
      });

      expect(result.success).toBe(true);
    });
  });

  describe("getPaymentStatus", () => {
    const paymentIntentId = "pi_123";

    it("should get payment status successfully", async () => {
      const mockOperation = {
        _id: "op123",
        status: "succeeded",
        createdAt: new Date()
      };

      const mockStripeStatus = {
        paymentIntentId: "pi_123",
        status: "succeeded",
        amountCents: 5000,
        currency: "USD"
      };

      PaymentOperation.getByStripeId.mockResolvedValue(mockOperation);
      mockStripeAdapter.confirmPaymentIntent.mockResolvedValue(mockStripeStatus);

      const result = await paymentProcessor.getPaymentStatus(paymentIntentId);

      expect(result).toEqual({
        success: true,
        paymentIntentId: "pi_123",
        status: "succeeded",
        amountCents: 5000,
        currency: "USD",
        databaseRecord: {
          id: "op123",
          status: "succeeded",
          createdAt: expect.any(Date)
        }
      });
    });

    it("should handle missing database record", async () => {
      PaymentOperation.getByStripeId.mockResolvedValue(null);
      mockStripeAdapter.confirmPaymentIntent.mockResolvedValue({
        paymentIntentId: "pi_123",
        status: "succeeded",
        amountCents: 5000,
        currency: "USD"
      });

      const result = await paymentProcessor.getPaymentStatus(paymentIntentId);

      expect(result.databaseRecord).toBeNull();
    });
  });

  describe("calculateTransferFees", () => {
    it("should calculate fees correctly", async () => {
      const result = paymentProcessor.calculateTransferFees(10000, 0.05);

      expect(result).toEqual({
        originalAmountCents: 10000,
        platformFeeCents: 500,
        netAmountCents: 9500,
        platformFeeRate: 0.05,
        feePercentage: 5
      });
    });

    it("should throw error for amount too small after fees", async () => {
      expect(() => {
        paymentProcessor.calculateTransferFees(150, 0.5); // 50% of 150 = 75, below minimum
      }).toThrow("Transfer amount after fees");
    });
  });
});