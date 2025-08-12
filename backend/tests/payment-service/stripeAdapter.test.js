const StripeAdapter = require("../../services/payment/stripeAdapter");
const { PaymentOperation } = require("../../models/paymentOperation");
const { StripeAccount } = require("../../models/stripeAccount");
const { WebhookEvent } = require("../../models/webhookEvent");
const { PaymentError, StripeError } = require("../../services/payment/paymentErrors");

// Mock Stripe
const mockStripe = {
  accounts: {
    create: jest.fn(),
    retrieve: jest.fn()
  },
  accountLinks: {
    create: jest.fn()
  },
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn()
  },
  transfers: {
    create: jest.fn()
  },
  refunds: {
    create: jest.fn()
  },
  webhooks: {
    constructEvent: jest.fn()
  }
};

jest.mock("stripe", () => {
  return jest.fn(() => mockStripe);
});

// Mock database models
jest.mock("../../models/paymentOperation");
jest.mock("../../models/stripeAccount");
jest.mock("../../models/webhookEvent");

describe("StripeAdapter", () => {
  let stripeAdapter;
  
  beforeEach(() => {
    jest.clearAllMocks();
    stripeAdapter = new StripeAdapter({
      secretKey: "sk_test_123",
      apiVersion: "2023-10-16"
    });
  });

  describe("createStripeAccountForSeller", () => {
    it("should create a new Stripe Connect account for seller", async () => {
      const sellerId = "seller123";
      const mockAccount = {
        id: "acct_123",
        details_submitted: false,
        charges_enabled: false,
        payouts_enabled: false,
        country: "US"
      };

      StripeAccount.getBySellerId.mockResolvedValue(null);
      mockStripe.accounts.create.mockResolvedValue(mockAccount);
      StripeAccount.createForSeller.mockResolvedValue({
        stripeAccountId: mockAccount.id,
        status: "pending",
        updateFromStripeAccount: jest.fn().mockResolvedValue()
      });

      const result = await stripeAdapter.createStripeAccountForSeller(sellerId);

      expect(mockStripe.accounts.create).toHaveBeenCalledWith({
        type: "custom",
        country: "US",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: "individual",
        metadata: {
          sellerId: sellerId,
          createdBy: "stripe-connect-migration"
        }
      }, expect.objectContaining({
        idempotencyKey: expect.any(String)
      }));

      expect(result).toEqual({
        stripeAccountId: "acct_123",
        status: "pending",
        existing: false
      });
    });

    it("should return existing account if already exists", async () => {
      const sellerId = "seller123";
      const existingAccount = {
        stripeAccountId: "acct_existing",
        status: "verified"
      };

      StripeAccount.getBySellerId.mockResolvedValue(existingAccount);

      const result = await stripeAdapter.createStripeAccountForSeller(sellerId);

      expect(mockStripe.accounts.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        stripeAccountId: "acct_existing",
        status: "verified",
        existing: true
      });
    });

    it("should handle Stripe errors", async () => {
      const sellerId = "seller123";
      const stripeError = new Error("Invalid country");
      stripeError.type = "StripeInvalidRequestError";

      StripeAccount.getBySellerId.mockResolvedValue(null);
      mockStripe.accounts.create.mockRejectedValue(stripeError);

      await expect(stripeAdapter.createStripeAccountForSeller(sellerId))
        .rejects.toThrow(StripeError);
    });
  });

  describe("createAccountLink", () => {
    it("should create account onboarding link", async () => {
      const accountId = "acct_123";
      const refreshUrl = "https://example.com/refresh";
      const returnUrl = "https://example.com/return";
      
      const mockAccountLink = {
        url: "https://connect.stripe.com/setup/...",
        expires_at: 1234567890
      };

      StripeAccount.getByStripeAccountId.mockResolvedValue({ id: accountId });
      mockStripe.accountLinks.create.mockResolvedValue(mockAccountLink);

      const result = await stripeAdapter.createAccountLink(accountId, refreshUrl, returnUrl);

      expect(mockStripe.accountLinks.create).toHaveBeenCalledWith({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding"
      });

      expect(result).toEqual({
        url: mockAccountLink.url,
        expiresAt: mockAccountLink.expires_at
      });
    });

    it("should throw error if account not found in database", async () => {
      const accountId = "acct_nonexistent";
      
      StripeAccount.getByStripeAccountId.mockResolvedValue(null);

      await expect(stripeAdapter.createAccountLink(accountId, "refresh", "return"))
        .rejects.toThrow(PaymentError);
    });
  });

  describe("createPaymentIntentOnPlatform", () => {
    it("should create payment intent on platform account", async () => {
      const amountCents = 5000;
      const currency = "USD";
      const metadata = { userId: "user123", escrowId: "escrow123" };

      const mockPaymentIntent = {
        id: "pi_123",
        client_secret: "pi_123_secret",
        status: "requires_payment_method",
        amount: amountCents,
        currency: "usd"
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);
      PaymentOperation.createCharge.mockResolvedValue({});

      const result = await stripeAdapter.createPaymentIntentOnPlatform(amountCents, currency, metadata);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: amountCents,
        currency: "usd",
        metadata: {
          ...metadata,
          createdBy: "stripe-connect-migration",
          type: "platform_charge"
        },
        automatic_payment_methods: {
          enabled: true
        }
      }, expect.objectContaining({
        idempotencyKey: expect.any(String)
      }));

      expect(PaymentOperation.createCharge).toHaveBeenCalledWith({
        stripeId: "pi_123",
        amountCents,
        currency,
        userId: metadata.userId,
        escrowId: metadata.escrowId,
        description: `Platform charge of ${amountCents/100} ${currency}`,
        metadata
      });

      expect(result).toEqual({
        paymentIntentId: "pi_123",
        clientSecret: "pi_123_secret",
        status: "requires_payment_method",
        amountCents,
        currency
      });
    });

    it("should validate amount", async () => {
      await expect(stripeAdapter.createPaymentIntentOnPlatform(10, "USD"))
        .rejects.toThrow("Amount must be an integer of at least 50 cents");
    });

    it("should validate currency", async () => {
      await expect(stripeAdapter.createPaymentIntentOnPlatform(5000, "INVALID"))
        .rejects.toThrow("Currency INVALID is not supported");
    });
  });

  describe("createTransferToSeller", () => {
    it("should create transfer to verified seller account", async () => {
      const escrowId = "escrow123";
      const amountCents = 10000;
      const sellerId = "seller123";
      const stripeAccountId = "acct_123";
      const metadata = { currency: "USD" };

      const mockStripeAccount = {
        isFullyVerified: jest.fn().mockReturnValue(true)
      };

      const mockTransfer = {
        id: "tr_123",
        amount: 9500, // After 5% platform fee
        currency: "usd"
      };

      StripeAccount.getByStripeAccountId.mockResolvedValue(mockStripeAccount);
      mockStripe.transfers.create.mockResolvedValue(mockTransfer);
      PaymentOperation.createTransfer.mockResolvedValue({});

      const result = await stripeAdapter.createTransferToSeller(
        escrowId, amountCents, sellerId, stripeAccountId, metadata
      );

      expect(mockStripe.transfers.create).toHaveBeenCalledWith({
        amount: 9500, // 10000 - 500 (5% fee)
        currency: "usd",
        destination: stripeAccountId,
        metadata: {
          ...metadata,
          escrowId: escrowId.toString(),
          sellerId: sellerId.toString(),
          platformFeeCents: "500",
          createdBy: "stripe-connect-migration"
        }
      }, expect.objectContaining({
        idempotencyKey: expect.any(String)
      }));

      expect(result).toEqual({
        transferId: "tr_123",
        amountCents: 9500,
        platformFeeCents: 500,
        currency: "USD",
        status: "pending"
      });
    });

    it("should throw error for unverified account", async () => {
      const mockStripeAccount = {
        isFullyVerified: jest.fn().mockReturnValue(false),
        currentlyDue: ["individual.first_name"]
      };

      StripeAccount.getByStripeAccountId.mockResolvedValue(mockStripeAccount);

      await expect(stripeAdapter.createTransferToSeller(
        "escrow123", 10000, "seller123", "acct_123"
      )).rejects.toThrow("Stripe account acct_123 is not fully verified");
    });
  });

  describe("refundPayment", () => {
    it("should create refund for payment intent", async () => {
      const paymentIntentId = "pi_123";
      const amountCents = 5000;

      const mockPaymentIntent = {
        id: paymentIntentId,
        status: "succeeded",
        amount: 10000,
        metadata: { userId: "user123" }
      };

      const mockRefund = {
        id: "re_123",
        amount: amountCents,
        currency: "usd",
        status: "succeeded"
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      mockStripe.refunds.create.mockResolvedValue(mockRefund);
      PaymentOperation.createRefund.mockResolvedValue({});

      const result = await stripeAdapter.refundPayment(paymentIntentId, amountCents);

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: paymentIntentId,
        amount: amountCents,
        reason: "requested_by_customer",
        metadata: {
          createdBy: "stripe-connect-migration",
          originalAmount: "10000"
        }
      }, expect.objectContaining({
        idempotencyKey: expect.any(String)
      }));

      expect(result).toEqual({
        refundId: "re_123",
        amountCents,
        currency: "USD",
        status: "succeeded",
        reason: "requested_by_customer"
      });
    });

    it("should not refund unsuccessful payment", async () => {
      const mockPaymentIntent = {
        status: "requires_payment_method"
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      await expect(stripeAdapter.refundPayment("pi_123", 5000))
        .rejects.toThrow("Cannot refund payment intent");
    });
  });

  describe("handleWebhookEvent", () => {
    it("should verify and store webhook event", async () => {
      const rawBody = "webhook_body";
      const signature = "signature";
      const endpointSecret = "whsec_123";

      const mockEvent = {
        id: "evt_123",
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_123" } }
      };

      const mockWebhookEvent = {
        id: "webhook_123"
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      WebhookEvent.createFromStripeEvent.mockResolvedValue(mockWebhookEvent);

      const result = await stripeAdapter.handleWebhookEvent(rawBody, signature, endpointSecret);

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        rawBody, signature, endpointSecret
      );
      expect(WebhookEvent.createFromStripeEvent).toHaveBeenCalledWith(mockEvent, "platform");
      expect(result).toEqual({ received: true, eventId: "evt_123" });
    });

    it("should throw webhook verification error for invalid signature", async () => {
      const error = new Error("Invalid signature");
      error.type = "StripeSignatureVerificationError";

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw error;
      });

      await expect(stripeAdapter.handleWebhookEvent("body", "sig", "secret"))
        .rejects.toThrow("Webhook signature verification failed");
    });
  });

  describe("processWebhookEvent", () => {
    it("should process payment_intent.succeeded event", async () => {
      const webhookEvent = {
        rawData: {
          type: "payment_intent.succeeded",
          data: { object: { id: "pi_123" } }
        },
        markAsProcessed: jest.fn().mockResolvedValue()
      };

      const mockOperation = {
        markAsSucceeded: jest.fn().mockResolvedValue()
      };

      PaymentOperation.getByStripeId.mockResolvedValue(mockOperation);

      await stripeAdapter.processWebhookEvent(webhookEvent);

      expect(mockOperation.markAsSucceeded).toHaveBeenCalled();
      expect(webhookEvent.markAsProcessed).toHaveBeenCalled();
    });

    it("should handle processing errors", async () => {
      const webhookEvent = {
        rawData: {
          type: "payment_intent.succeeded",
          data: { object: { id: "pi_123" } }
        },
        recordProcessingError: jest.fn().mockResolvedValue()
      };

      PaymentOperation.getByStripeId.mockRejectedValue(new Error("Database error"));

      await stripeAdapter.processWebhookEvent(webhookEvent);

      expect(webhookEvent.recordProcessingError).toHaveBeenCalledWith(
        expect.any(Error)
      );
    });
  });
});