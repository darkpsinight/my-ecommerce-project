const StripeReconciliationService = require("../../jobs/reconcileStripe");
const StripeAdapter = require("../../services/payment/stripeAdapter");
const { PaymentOperation } = require("../../models/paymentOperation");
const { StripeAccount } = require("../../models/stripeAccount");
const { LegacyWallet } = require("../../models/legacyWallet");
const { WebhookEvent } = require("../../models/webhookEvent");

// Mock dependencies
jest.mock("../../services/payment/stripeAdapter");
jest.mock("../../models/paymentOperation");
jest.mock("../../models/stripeAccount");
jest.mock("../../models/legacyWallet");
jest.mock("../../models/webhookEvent");

describe("StripeReconciliationService", () => {
  let reconciliationService;
  let mockStripeAdapter;
  let mockStripe;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockStripe = {
      paymentIntents: {
        retrieve: jest.fn()
      },
      transfers: {
        retrieve: jest.fn()
      },
      accounts: {
        retrieve: jest.fn()
      },
      balance: {
        retrieve: jest.fn()
      }
    };

    mockStripeAdapter = new StripeAdapter();
    mockStripeAdapter.getStripe = jest.fn().mockReturnValue(mockStripe);
    
    reconciliationService = new StripeReconciliationService();
    reconciliationService.stripeAdapter = mockStripeAdapter;
  });

  describe("runFullReconciliation", () => {
    it("should run full reconciliation successfully", async () => {
      // Mock empty results for all checks
      PaymentOperation.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });

      StripeAccount.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });

      WebhookEvent.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });

      mockStripe.balance.retrieve.mockResolvedValue({
        available: [{ currency: "usd", amount: 0 }]
      });

      PaymentOperation.aggregate.mockResolvedValue([]);
      LegacyWallet.getTotalLegacyBalance.mockResolvedValue(0);

      const result = await reconciliationService.runFullReconciliation({
        timeRange: 1,
        batchSize: 10,
        includeBalances: true,
        includeWebhooks: true,
        dryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.dryRun).toBe(true);
    });

    it("should handle reconciliation errors gracefully", async () => {
      PaymentOperation.find.mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      await expect(reconciliationService.runFullReconciliation())
        .rejects.toThrow("Database connection failed");
    });
  });

  describe("reconcilePaymentOperation", () => {
    const mockOperation = {
      _id: "op123",
      stripeId: "pi_123",
      amountCents: 5000,
      currency: "USD",
      status: "succeeded"
    };

    it("should detect no discrepancies for matching data", async () => {
      const mockPaymentIntent = {
        id: "pi_123",
        amount: 5000,
        currency: "usd",
        status: "succeeded"
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      await reconciliationService.reconcilePaymentOperation(mockOperation, true);

      expect(reconciliationService.reconciliationResults.payments.checked).toBe(1);
      expect(reconciliationService.reconciliationResults.payments.discrepancies).toBe(0);
    });

    it("should detect amount discrepancy", async () => {
      const mockPaymentIntent = {
        id: "pi_123",
        amount: 6000, // Different amount
        currency: "usd",
        status: "succeeded"
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      await reconciliationService.reconcilePaymentOperation(mockOperation, true);

      expect(reconciliationService.reconciliationResults.payments.checked).toBe(1);
      expect(reconciliationService.reconciliationResults.payments.discrepancies).toBe(1);
    });

    it("should detect status discrepancy", async () => {
      const mockPaymentIntent = {
        id: "pi_123",
        amount: 5000,
        currency: "usd",
        status: "requires_payment_method" // Different status
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      await reconciliationService.reconcilePaymentOperation(mockOperation, true);

      expect(reconciliationService.reconciliationResults.payments.discrepancies).toBe(1);
    });

    it("should fix discrepancies when not in dry run mode", async () => {
      const mockPaymentIntent = {
        id: "pi_123",
        amount: 6000,
        currency: "usd",
        status: "succeeded"
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      PaymentOperation.findByIdAndUpdate.mockResolvedValue();

      await reconciliationService.reconcilePaymentOperation(mockOperation, false);

      expect(PaymentOperation.findByIdAndUpdate).toHaveBeenCalledWith(
        "op123",
        expect.objectContaining({
          amountCents: 6000
        })
      );
    });

    it("should handle Stripe API errors", async () => {
      mockStripe.paymentIntents.retrieve.mockRejectedValue(new Error("Stripe API error"));

      await reconciliationService.reconcilePaymentOperation(mockOperation, true);

      expect(reconciliationService.reconciliationResults.payments.errors).toBe(1);
    });
  });

  describe("reconcileTransferOperation", () => {
    const mockOperation = {
      _id: "op456",
      stripeId: "tr_123",
      amountCents: 9500,
      currency: "USD",
      status: "succeeded",
      stripeAccountId: "acct_123"
    };

    it("should detect no discrepancies for matching transfer data", async () => {
      const mockTransfer = {
        id: "tr_123",
        amount: 9500,
        currency: "usd",
        status: "paid",
        destination: "acct_123"
      };

      mockStripe.transfers.retrieve.mockResolvedValue(mockTransfer);

      await reconciliationService.reconcileTransferOperation(mockOperation, true);

      expect(reconciliationService.reconciliationResults.transfers.checked).toBe(1);
      expect(reconciliationService.reconciliationResults.transfers.discrepancies).toBe(0);
    });

    it("should detect destination discrepancy", async () => {
      const mockTransfer = {
        id: "tr_123",
        amount: 9500,
        currency: "usd",
        status: "paid",
        destination: "acct_different" // Different destination
      };

      mockStripe.transfers.retrieve.mockResolvedValue(mockTransfer);

      await reconciliationService.reconcileTransferOperation(mockOperation, true);

      expect(reconciliationService.reconciliationResults.transfers.discrepancies).toBe(1);
    });
  });

  describe("reconcileStripeAccount", () => {
    const mockAccount = {
      _id: "acc123",
      stripeAccountId: "acct_123",
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
      currentlyDue: []
    };

    it("should detect no discrepancies for matching account data", async () => {
      const mockStripeAccount = {
        id: "acct_123",
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        requirements: {
          currently_due: []
        }
      };

      mockStripe.accounts.retrieve.mockResolvedValue(mockStripeAccount);

      await reconciliationService.reconcileStripeAccount(mockAccount, true);

      expect(reconciliationService.reconciliationResults.accounts.checked).toBe(1);
      expect(reconciliationService.reconciliationResults.accounts.discrepancies).toBe(0);
    });

    it("should detect charges enabled discrepancy", async () => {
      const mockStripeAccount = {
        id: "acct_123",
        charges_enabled: false, // Different from database
        payouts_enabled: true,
        details_submitted: true,
        requirements: {
          currently_due: []
        }
      };

      mockStripe.accounts.retrieve.mockResolvedValue(mockStripeAccount);

      await reconciliationService.reconcileStripeAccount(mockAccount, true);

      expect(reconciliationService.reconciliationResults.accounts.discrepancies).toBe(1);
    });

    it("should fix account discrepancies when not in dry run mode", async () => {
      const mockStripeAccount = {
        id: "acct_123",
        charges_enabled: false,
        payouts_enabled: true,
        details_submitted: true,
        requirements: {
          currently_due: ["individual.first_name"]
        }
      };

      const mockDbAccount = {
        updateFromStripeAccount: jest.fn().mockResolvedValue()
      };

      mockStripe.accounts.retrieve.mockResolvedValue(mockStripeAccount);
      StripeAccount.findById.mockResolvedValue(mockDbAccount);

      await reconciliationService.reconcileStripeAccount(mockAccount, false);

      expect(mockDbAccount.updateFromStripeAccount).toHaveBeenCalledWith(mockStripeAccount);
    });
  });

  describe("reconcilePlatformBalance", () => {
    it("should detect no discrepancy when balances match", async () => {
      const mockBalance = {
        available: [{ currency: "usd", amount: 10000 }]
      };

      mockStripe.balance.retrieve.mockResolvedValue(mockBalance);
      
      // Mock expected balance calculation
      PaymentOperation.aggregate.mockResolvedValue([
        { _id: "charge", totalAmount: 15000, count: 3 },
        { _id: "transfer", totalAmount: 5000, count: 1 }
      ]);

      await reconciliationService.reconcilePlatformBalance(true);

      expect(reconciliationService.reconciliationResults.balances.checked).toBe(1);
      expect(reconciliationService.reconciliationResults.balances.discrepancies).toBe(0);
    });

    it("should detect balance discrepancy", async () => {
      const mockBalance = {
        available: [{ currency: "usd", amount: 5000 }] // Different from expected
      };

      mockStripe.balance.retrieve.mockResolvedValue(mockBalance);
      
      PaymentOperation.aggregate.mockResolvedValue([
        { _id: "charge", totalAmount: 15000, count: 3 },
        { _id: "transfer", totalAmount: 5000, count: 1 }
      ]);

      await reconciliationService.reconcilePlatformBalance(true);

      expect(reconciliationService.reconciliationResults.balances.discrepancies).toBe(1);
    });
  });

  describe("reconcileWebhookEvent", () => {
    const mockWebhookEvent = {
      _id: "webhook123",
      stripeEventId: "evt_123",
      type: "payment_intent.succeeded",
      processingAttempts: 2,
      shouldRetryProcessing: jest.fn()
    };

    it("should identify webhook ready for retry", async () => {
      mockWebhookEvent.shouldRetryProcessing.mockReturnValue(true);

      await reconciliationService.reconcileWebhookEvent(mockWebhookEvent, true);

      expect(reconciliationService.reconciliationResults.webhooks.checked).toBe(1);
      expect(reconciliationService.reconciliationResults.webhooks.discrepancies).toBe(1);
    });

    it("should skip webhook not ready for retry", async () => {
      mockWebhookEvent.shouldRetryProcessing.mockReturnValue(false);

      await reconciliationService.reconcileWebhookEvent(mockWebhookEvent, true);

      expect(reconciliationService.reconciliationResults.webhooks.checked).toBe(1);
      expect(reconciliationService.reconciliationResults.webhooks.discrepancies).toBe(0);
    });
  });

  describe("calculateExpectedPlatformBalance", () => {
    it("should calculate expected balance correctly", async () => {
      PaymentOperation.aggregate.mockResolvedValue([
        { _id: "charge", totalAmount: 20000, count: 4 },
        { _id: "transfer", totalAmount: 8000, count: 2 },
        { _id: "refund", totalAmount: 2000, count: 1 }
      ]);

      const result = await reconciliationService.calculateExpectedPlatformBalance();

      expect(result.availableCents).toBe(10000); // 20000 - 8000 - 2000
      expect(result.breakdown).toEqual({
        charge: { amount: 20000, count: 4 },
        transfer: { amount: 8000, count: 2 },
        refund: { amount: 2000, count: 1 }
      });
    });

    it("should handle database errors", async () => {
      PaymentOperation.aggregate.mockRejectedValue(new Error("Database error"));

      const result = await reconciliationService.calculateExpectedPlatformBalance();

      expect(result.availableCents).toBe(0);
      expect(result.error).toBe("Database error");
    });
  });

  describe("status mapping", () => {
    it("should map Stripe payment intent statuses correctly", () => {
      expect(reconciliationService.mapStripeStatusToOperationStatus("succeeded")).toBe("succeeded");
      expect(reconciliationService.mapStripeStatusToOperationStatus("requires_payment_method")).toBe("pending");
      expect(reconciliationService.mapStripeStatusToOperationStatus("failed")).toBe("failed");
      expect(reconciliationService.mapStripeStatusToOperationStatus("canceled")).toBe("canceled");
      expect(reconciliationService.mapStripeStatusToOperationStatus("unknown_status")).toBe("pending");
    });

    it("should map Stripe transfer statuses correctly", () => {
      expect(reconciliationService.mapStripeTransferStatusToOperationStatus("paid")).toBe("succeeded");
      expect(reconciliationService.mapStripeTransferStatusToOperationStatus("pending")).toBe("pending");
      expect(reconciliationService.mapStripeTransferStatusToOperationStatus("failed")).toBe("failed");
      expect(reconciliationService.mapStripeTransferStatusToOperationStatus("canceled")).toBe("canceled");
    });
  });

  describe("generateReconciliationSummary", () => {
    it("should generate correct summary", () => {
      reconciliationService.reconciliationResults = {
        payments: { checked: 100, discrepancies: 2, errors: 1 },
        transfers: { checked: 50, discrepancies: 1, errors: 0 },
        accounts: { checked: 25, discrepancies: 0, errors: 0 },
        balances: { checked: 1, discrepancies: 0, errors: 0 },
        webhooks: { checked: 20, discrepancies: 1, errors: 0 }
      };

      const summary = reconciliationService.generateReconciliationSummary();

      expect(summary.totalChecked).toBe(196);
      expect(summary.totalDiscrepancies).toBe(4);
      expect(summary.totalErrors).toBe(1);
      expect(summary.successRate).toBe(97.45); // (196-4-1)/196 * 100
      expect(summary.details).toEqual(reconciliationService.reconciliationResults);
    });
  });
});