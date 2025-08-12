const WebhookProcessor = require("../../services/payment/webhookProcessor");
const { PaymentOperation } = require("../../models/paymentOperation");
const { StripeAccount } = require("../../models/stripeAccount");
const { WebhookEvent } = require("../../models/webhookEvent");

// Mock dependencies
jest.mock("../../models/paymentOperation");
jest.mock("../../models/stripeAccount");
jest.mock("../../models/webhookEvent");

describe("WebhookProcessor", () => {
  let webhookProcessor;
  let mockWebhookEvent;

  beforeEach(() => {
    jest.clearAllMocks();
    webhookProcessor = new WebhookProcessor();
    
    mockWebhookEvent = {
      _id: "webhook123",
      stripeEventId: "evt_123",
      type: "payment_intent.succeeded",
      source: "platform",
      rawData: {},
      processingAttempts: 0,
      markAsProcessed: jest.fn().mockResolvedValue(),
      recordProcessingError: jest.fn().mockResolvedValue()
    };
  });

  describe("processEvent", () => {
    it("should process supported event successfully", async () => {
      const mockEvent = {
        id: "evt_123",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_123",
            amount: 5000,
            currency: "usd",
            status: "succeeded"
          }
        }
      };

      mockWebhookEvent.rawData = mockEvent;
      
      const mockOperation = {
        markAsSucceeded: jest.fn().mockResolvedValue()
      };

      PaymentOperation.getByStripeId.mockResolvedValue(mockOperation);

      const result = await webhookProcessor.processEvent(mockWebhookEvent);

      expect(mockOperation.markAsSucceeded).toHaveBeenCalledWith(mockEvent.data.object);
      expect(mockWebhookEvent.markAsProcessed).toHaveBeenCalled();
      expect(result).toEqual({
        processed: true,
        handled: true,
        processingTime: expect.any(Number)
      });
    });

    it("should handle unsupported event types gracefully", async () => {
      const mockEvent = {
        id: "evt_123",
        type: "unsupported.event.type",
        data: { object: {} }
      };

      mockWebhookEvent.rawData = mockEvent;
      mockWebhookEvent.type = "unsupported.event.type";

      const result = await webhookProcessor.processEvent(mockWebhookEvent);

      expect(mockWebhookEvent.markAsProcessed).toHaveBeenCalled();
      expect(result).toEqual({
        processed: true,
        handled: false
      });
    });

    it("should handle processing errors", async () => {
      const mockEvent = {
        id: "evt_123",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_123",
            amount: 5000,
            currency: "usd",
            status: "succeeded"
          }
        }
      };

      mockWebhookEvent.rawData = mockEvent;
      
      const error = new Error("Database connection failed");
      PaymentOperation.getByStripeId.mockRejectedValue(error);

      await expect(webhookProcessor.processEvent(mockWebhookEvent))
        .rejects.toThrow("Database connection failed");

      expect(mockWebhookEvent.recordProcessingError).toHaveBeenCalledWith(error);
      expect(mockWebhookEvent.markAsProcessed).not.toHaveBeenCalled();
    });
  });

  describe("handlePaymentIntentSucceeded", () => {
    it("should handle successful payment intent", async () => {
      const mockEvent = {
        data: {
          object: {
            id: "pi_123",
            amount: 5000,
            currency: "usd",
            status: "succeeded",
            metadata: {
              type: "escrow_payment",
              buyerId: "buyer123",
              escrowId: "escrow123"
            }
          }
        }
      };

      const mockOperation = {
        markAsSucceeded: jest.fn().mockResolvedValue()
      };

      PaymentOperation.getByStripeId.mockResolvedValue(mockOperation);

      await webhookProcessor.handlePaymentIntentSucceeded(mockEvent, mockWebhookEvent);

      expect(mockOperation.markAsSucceeded).toHaveBeenCalledWith(mockEvent.data.object);
    });

    it("should handle wallet topup success", async () => {
      const mockEvent = {
        data: {
          object: {
            id: "pi_topup_123",
            amount: 10000,
            currency: "usd",
            status: "succeeded",
            metadata: {
              type: "wallet_topup",
              buyerId: "buyer123"
            }
          }
        }
      };

      const mockOperation = {
        markAsSucceeded: jest.fn().mockResolvedValue()
      };

      PaymentOperation.getByStripeId.mockResolvedValue(mockOperation);

      await webhookProcessor.handlePaymentIntentSucceeded(mockEvent, mockWebhookEvent);

      expect(mockOperation.markAsSucceeded).toHaveBeenCalled();
    });

    it("should handle missing operation gracefully", async () => {
      const mockEvent = {
        data: {
          object: {
            id: "pi_nonexistent",
            amount: 5000,
            currency: "usd",
            status: "succeeded"
          }
        }
      };

      PaymentOperation.getByStripeId.mockResolvedValue(null);

      // Should not throw error
      await expect(webhookProcessor.handlePaymentIntentSucceeded(mockEvent, mockWebhookEvent))
        .resolves.toBeUndefined();
    });
  });

  describe("handlePaymentIntentFailed", () => {
    it("should handle failed payment intent", async () => {
      const mockEvent = {
        data: {
          object: {
            id: "pi_failed_123",
            status: "failed",
            last_payment_error: {
              code: "card_declined",
              message: "Your card was declined."
            }
          }
        }
      };

      const mockOperation = {
        markAsFailed: jest.fn().mockResolvedValue()
      };

      PaymentOperation.getByStripeId.mockResolvedValue(mockOperation);

      await webhookProcessor.handlePaymentIntentFailed(mockEvent, mockWebhookEvent);

      expect(mockOperation.markAsFailed).toHaveBeenCalledWith(
        "card_declined",
        "Your card was declined."
      );
    });

    it("should handle failed payment with no error details", async () => {
      const mockEvent = {
        data: {
          object: {
            id: "pi_failed_123",
            status: "failed",
            last_payment_error: null
          }
        }
      };

      const mockOperation = {
        markAsFailed: jest.fn().mockResolvedValue()
      };

      PaymentOperation.getByStripeId.mockResolvedValue(mockOperation);

      await webhookProcessor.handlePaymentIntentFailed(mockEvent, mockWebhookEvent);

      expect(mockOperation.markAsFailed).toHaveBeenCalledWith(
        "payment_failed",
        "Payment failed"
      );
    });
  });

  describe("handleTransferUpdated", () => {
    it("should handle successful transfer", async () => {
      const mockEvent = {
        data: {
          object: {
            id: "tr_123",
            status: "paid",
            amount: 9500,
            destination: "acct_seller123"
          }
        }
      };

      const mockOperation = {
        markAsSucceeded: jest.fn().mockResolvedValue()
      };

      PaymentOperation.getByStripeId.mockResolvedValue(mockOperation);

      await webhookProcessor.handleTransferUpdated(mockEvent, mockWebhookEvent);

      expect(mockOperation.markAsSucceeded).toHaveBeenCalledWith(mockEvent.data.object);
    });

    it("should handle failed transfer", async () => {
      const mockEvent = {
        data: {
          object: {
            id: "tr_failed_123",
            status: "failed",
            failure_message: "Insufficient funds in source"
          }
        }
      };

      const mockOperation = {
        markAsFailed: jest.fn().mockResolvedValue()
      };

      PaymentOperation.getByStripeId.mockResolvedValue(mockOperation);

      await webhookProcessor.handleTransferUpdated(mockEvent, mockWebhookEvent);

      expect(mockOperation.markAsFailed).toHaveBeenCalledWith(
        "transfer_failed",
        "Transfer failed"
      );
    });
  });

  describe("handleAccountUpdated", () => {
    it("should update account from webhook data", async () => {
      const mockEvent = {
        data: {
          object: {
            id: "acct_123",
            charges_enabled: true,
            payouts_enabled: true,
            details_submitted: true,
            requirements: {
              currently_due: [],
              past_due: []
            }
          }
        }
      };

      const mockStripeAccount = {
        status: "pending",
        migrated: false,
        updateFromStripeAccount: jest.fn().mockResolvedValue(),
        save: jest.fn().mockResolvedValue()
      };

      // Mock the status change
      mockStripeAccount.updateFromStripeAccount.mockImplementation(() => {
        mockStripeAccount.status = "verified";
      });

      StripeAccount.getByStripeAccountId.mockResolvedValue(mockStripeAccount);

      await webhookProcessor.handleAccountUpdated(mockEvent, mockWebhookEvent);

      expect(mockStripeAccount.updateFromStripeAccount).toHaveBeenCalledWith(mockEvent.data.object);
    });

    it("should handle account verification completion", async () => {
      const mockEvent = {
        data: {
          object: {
            id: "acct_123",
            charges_enabled: true,
            payouts_enabled: true,
            details_submitted: true
          }
        }
      };

      const mockStripeAccount = {
        status: "verified",
        migrated: false,
        updateFromStripeAccount: jest.fn().mockResolvedValue(),
        save: jest.fn().mockResolvedValue()
      };

      StripeAccount.getByStripeAccountId.mockResolvedValue(mockStripeAccount);

      await webhookProcessor.handleAccountUpdated(mockEvent, mockWebhookEvent);

      expect(mockStripeAccount.migrated).toBe(true);
      expect(mockStripeAccount.migratedAt).toBeInstanceOf(Date);
      expect(mockStripeAccount.save).toHaveBeenCalled();
    });

    it("should handle missing account gracefully", async () => {
      const mockEvent = {
        data: {
          object: {
            id: "acct_nonexistent",
            charges_enabled: true,
            payouts_enabled: true
          }
        }
      };

      StripeAccount.getByStripeAccountId.mockResolvedValue(null);

      // Should not throw error
      await expect(webhookProcessor.handleAccountUpdated(mockEvent, mockWebhookEvent))
        .resolves.toBeUndefined();
    });
  });

  describe("handleAccountDeauthorized", () => {
    it("should handle account deauthorization", async () => {
      const mockEvent = {
        data: {
          object: {
            id: "acct_deauth_123"
          }
        }
      };

      const mockStripeAccount = {
        status: "verified",
        metadata: {},
        save: jest.fn().mockResolvedValue()
      };

      StripeAccount.getByStripeAccountId.mockResolvedValue(mockStripeAccount);

      await webhookProcessor.handleAccountDeauthorized(mockEvent, mockWebhookEvent);

      expect(mockStripeAccount.status).toBe("restricted");
      expect(mockStripeAccount.metadata.deauthorized).toBe(true);
      expect(mockStripeAccount.metadata.deauthorizedAt).toBeInstanceOf(Date);
      expect(mockStripeAccount.save).toHaveBeenCalled();
    });
  });

  describe("handleDisputeCreated", () => {
    it("should handle dispute creation", async () => {
      const mockEvent = {
        data: {
          object: {
            id: "dp_123",
            charge: "ch_123",
            amount: 5000,
            reason: "fraudulent",
            status: "warning_needs_response"
          }
        }
      };

      // Should not throw error and should log security event
      await expect(webhookProcessor.handleDisputeCreated(mockEvent, mockWebhookEvent))
        .resolves.toBeUndefined();
    });
  });

  describe("getSupportedEventTypes", () => {
    it("should return list of supported event types", () => {
      const supportedTypes = webhookProcessor.getSupportedEventTypes();

      expect(supportedTypes).toContain("payment_intent.succeeded");
      expect(supportedTypes).toContain("payment_intent.payment_failed");
      expect(supportedTypes).toContain("transfer.created");
      expect(supportedTypes).toContain("transfer.updated");
      expect(supportedTypes).toContain("account.updated");
      expect(supportedTypes).toContain("charge.dispute.created");
      expect(supportedTypes.length).toBeGreaterThan(10);
    });
  });

  describe("getProcessingStats", () => {
    it("should return processing statistics", async () => {
      const mockStats = [
        {
          _id: "payment_intent.succeeded",
          total: 100,
          processed: 98,
          failed: 2,
          avgProcessingTime: 150
        },
        {
          _id: "transfer.updated",
          total: 50,
          processed: 50,
          failed: 0,
          avgProcessingTime: 75
        }
      ];

      WebhookEvent.aggregate.mockResolvedValue(mockStats);

      const stats = await webhookProcessor.getProcessingStats(24);

      expect(WebhookEvent.aggregate).toHaveBeenCalledWith([
        { $match: { createdAt: { $gte: expect.any(Date) } } },
        {
          $group: {
            _id: "$type",
            total: { $sum: 1 },
            processed: { $sum: { $cond: ["$processed", 1, 0] } },
            failed: { $sum: { $cond: [{ $gt: ["$processingAttempts", 0] }, 1, 0] } },
            avgProcessingTime: { $avg: "$processingTime" }
          }
        },
        { $sort: { total: -1 } }
      ]);

      expect(stats).toEqual(mockStats);
    });
  });
});