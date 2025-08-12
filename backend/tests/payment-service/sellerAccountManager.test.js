const SellerAccountManager = require("../../services/payment/sellerAccountManager");
const StripeAdapter = require("../../services/payment/stripeAdapter");
const { StripeAccount } = require("../../models/stripeAccount");
const { User } = require("../../models/user");
const { PaymentError } = require("../../services/payment/paymentErrors");

// Mock dependencies
jest.mock("../../services/payment/stripeAdapter");
jest.mock("../../models/stripeAccount");
jest.mock("../../models/user");

describe("SellerAccountManager", () => {
  let sellerAccountManager;
  let mockStripeAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStripeAdapter = new StripeAdapter();
    sellerAccountManager = new SellerAccountManager(mockStripeAdapter);
  });

  describe("createStripeAccountForSeller", () => {
    const sellerId = "seller123";
    const mockSeller = {
      _id: sellerId,
      role: "seller",
      isActive: true,
      email: "seller@example.com"
    };

    beforeEach(() => {
      User.findById.mockResolvedValue(mockSeller);
    });

    it("should create new Stripe account for eligible seller", async () => {
      const mockStripeResult = {
        stripeAccountId: "acct_123",
        status: "pending",
        existing: false
      };

      StripeAccount.getBySellerId.mockResolvedValue(null);
      mockStripeAdapter.createStripeAccountForSeller.mockResolvedValue(mockStripeResult);
      User.findByIdAndUpdate.mockResolvedValue();

      const result = await sellerAccountManager.createStripeAccountForSeller(sellerId);

      expect(mockStripeAdapter.createStripeAccountForSeller).toHaveBeenCalledWith(sellerId, "US");
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(sellerId, {
        stripeConnectAccountId: "acct_123",
        stripeConnectSetupAt: expect.any(Date)
      });

      expect(result).toEqual({
        success: true,
        stripeAccountId: "acct_123",
        status: "pending",
        existing: false,
        requiresOnboarding: true
      });
    });

    it("should return existing account if already exists", async () => {
      const existingAccount = {
        stripeAccountId: "acct_existing",
        status: "verified",
        detailsSubmitted: true
      };

      StripeAccount.getBySellerId.mockResolvedValue(existingAccount);

      const result = await sellerAccountManager.createStripeAccountForSeller(sellerId);

      expect(mockStripeAdapter.createStripeAccountForSeller).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        stripeAccountId: "acct_existing",
        status: "verified",
        existing: true,
        requiresOnboarding: false
      });
    });

    it("should throw error for non-existent seller", async () => {
      User.findById.mockResolvedValue(null);

      await expect(sellerAccountManager.createStripeAccountForSeller(sellerId))
        .rejects.toThrow("Seller seller123 not found");
    });

    it("should throw error for non-seller user", async () => {
      User.findById.mockResolvedValue({
        ...mockSeller,
        role: "buyer"
      });

      await expect(sellerAccountManager.createStripeAccountForSeller(sellerId))
        .rejects.toThrow("User seller123 is not a seller");
    });

    it("should throw error for inactive seller", async () => {
      User.findById.mockResolvedValue({
        ...mockSeller,
        isActive: false
      });

      await expect(sellerAccountManager.createStripeAccountForSeller(sellerId))
        .rejects.toThrow("Seller seller123 account is not active");
    });

    it("should handle custom country and business type", async () => {
      const options = {
        country: "CA",
        businessType: "company",
        capabilities: ["card_payments", "transfers", "tax_reporting_us_1099_k"]
      };

      StripeAccount.getBySellerId.mockResolvedValue(null);
      mockStripeAdapter.createStripeAccountForSeller.mockResolvedValue({
        stripeAccountId: "acct_123",
        status: "pending",
        existing: false
      });
      User.findByIdAndUpdate.mockResolvedValue();

      await sellerAccountManager.createStripeAccountForSeller(sellerId, options);

      expect(mockStripeAdapter.createStripeAccountForSeller).toHaveBeenCalledWith(sellerId, "CA");
    });
  });

  describe("createAccountLink", () => {
    const sellerId = "seller123";
    const stripeAccountId = "acct_123";

    it("should create account onboarding link", async () => {
      const mockStripeAccount = {
        stripeAccountId,
        status: "pending"
      };

      const mockLinkResult = {
        url: "https://connect.stripe.com/setup/...",
        expiresAt: 1234567890
      };

      StripeAccount.getBySellerId.mockResolvedValue(mockStripeAccount);
      mockStripeAdapter.createAccountLink.mockResolvedValue(mockLinkResult);

      const result = await sellerAccountManager.createAccountLink(sellerId);

      expect(mockStripeAdapter.createAccountLink).toHaveBeenCalledWith(
        stripeAccountId,
        expect.stringContaining("/seller/onboarding/refresh"),
        expect.stringContaining("/seller/onboarding/complete")
      );

      expect(result).toEqual({
        success: true,
        onboardingUrl: mockLinkResult.url,
        expiresAt: mockLinkResult.expiresAt,
        stripeAccountId
      });
    });

    it("should throw error if no Stripe account exists", async () => {
      StripeAccount.getBySellerId.mockResolvedValue(null);

      await expect(sellerAccountManager.createAccountLink(sellerId))
        .rejects.toThrow("No Stripe account found for seller seller123");
    });

    it("should handle custom URLs", async () => {
      const options = {
        refreshUrl: "https://custom.com/refresh",
        returnUrl: "https://custom.com/return"
      };

      const mockStripeAccount = { stripeAccountId };
      StripeAccount.getBySellerId.mockResolvedValue(mockStripeAccount);
      mockStripeAdapter.createAccountLink.mockResolvedValue({
        url: "https://connect.stripe.com/setup/...",
        expiresAt: 1234567890
      });

      await sellerAccountManager.createAccountLink(sellerId, options);

      expect(mockStripeAdapter.createAccountLink).toHaveBeenCalledWith(
        stripeAccountId,
        "https://custom.com/refresh",
        "https://custom.com/return"
      );
    });

    it("should validate URLs", async () => {
      const options = {
        refreshUrl: "invalid-url",
        returnUrl: "https://valid.com/return"
      };

      await expect(sellerAccountManager.createAccountLink(sellerId, options))
        .rejects.toThrow("Invalid Refresh URL format");
    });
  });

  describe("getSellerAccountStatus", () => {
    const sellerId = "seller123";
    const stripeAccountId = "acct_123";

    it("should return status for seller without Stripe account", async () => {
      StripeAccount.getBySellerId.mockResolvedValue(null);

      const result = await sellerAccountManager.getSellerAccountStatus(sellerId);

      expect(result).toEqual({
        success: true,
        hasStripeAccount: false,
        requiresAccountCreation: true
      });
    });

    it("should return comprehensive status for seller with Stripe account", async () => {
      const mockStripeAccount = {
        stripeAccountId,
        status: "verified",
        detailsSubmitted: true,
        chargesEnabled: true,
        payoutsEnabled: true,
        currentlyDue: [],
        eventuallyDue: [],
        pastDue: [],
        pendingVerification: [],
        capabilities: ["card_payments", "transfers"],
        country: "US",
        currency: "USD",
        updatedAt: new Date(),
        isFullyVerified: jest.fn().mockReturnValue(true)
      };

      const mockStripeStatus = {
        id: stripeAccountId,
        detailsSubmitted: true,
        chargesEnabled: true,
        payoutsEnabled: true,
        requirements: {
          currently_due: [],
          eventually_due: [],
          past_due: [],
          pending_verification: []
        },
        capabilities: {
          card_payments: "active",
          transfers: "active"
        }
      };

      StripeAccount.getBySellerId.mockResolvedValue(mockStripeAccount);
      mockStripeAdapter.getAccountStatus.mockResolvedValue(mockStripeStatus);

      const result = await sellerAccountManager.getSellerAccountStatus(sellerId);

      expect(result).toEqual({
        success: true,
        hasStripeAccount: true,
        stripeAccountId,
        status: "verified",
        isFullyVerified: true,
        detailsSubmitted: true,
        chargesEnabled: true,
        payoutsEnabled: true,
        requiresOnboarding: false,
        hasRequirements: false,
        requirements: {
          currentlyDue: [],
          eventuallyDue: [],
          pastDue: [],
          pendingVerification: []
        },
        capabilities: ["card_payments", "transfers"],
        country: "US",
        currency: "USD",
        lastUpdated: expect.any(Date)
      });
    });
  });

  describe("canSellerReceiveTransfers", () => {
    const sellerId = "seller123";

    it("should return false for seller without Stripe account", async () => {
      StripeAccount.getBySellerId.mockResolvedValue(null);

      const result = await sellerAccountManager.canSellerReceiveTransfers(sellerId);

      expect(result).toEqual({
        canReceive: false,
        reason: "NO_STRIPE_ACCOUNT",
        message: "Seller has not set up Stripe Connect account"
      });
    });

    it("should return false for unverified account", async () => {
      const mockStripeAccount = {
        stripeAccountId: "acct_123",
        status: "pending",
        isFullyVerified: jest.fn().mockReturnValue(false),
        currentlyDue: ["individual.first_name"]
      };

      StripeAccount.getBySellerId.mockResolvedValue(mockStripeAccount);
      mockStripeAdapter.getAccountStatus.mockResolvedValue({});

      const result = await sellerAccountManager.canSellerReceiveTransfers(sellerId);

      expect(result).toEqual({
        canReceive: false,
        reason: "ACCOUNT_NOT_VERIFIED",
        message: "Seller account is not fully verified",
        requirements: expect.any(Object)
      });
    });

    it("should return true for fully verified account", async () => {
      const mockStripeAccount = {
        stripeAccountId: "acct_123",
        status: "verified",
        payoutsEnabled: true,
        isFullyVerified: jest.fn().mockReturnValue(true)
      };

      StripeAccount.getBySellerId.mockResolvedValue(mockStripeAccount);
      mockStripeAdapter.getAccountStatus.mockResolvedValue({});

      const result = await sellerAccountManager.canSellerReceiveTransfers(sellerId);

      expect(result).toEqual({
        canReceive: true,
        stripeAccountId: "acct_123"
      });
    });
  });

  describe("getSellersRequiringMigration", () => {
    it("should return sellers without Stripe accounts", async () => {
      const mockSellers = [
        { _id: "seller1", email: "seller1@example.com", name: "Seller 1", createdAt: new Date() },
        { _id: "seller2", email: "seller2@example.com", name: "Seller 2", createdAt: new Date() }
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockSellers)
      });

      // First seller has no Stripe account, second has one
      StripeAccount.getBySellerId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ status: "verified" });

      const result = await sellerAccountManager.getSellersRequiringMigration();

      expect(result.success).toBe(true);
      expect(result.sellers).toHaveLength(2);
      expect(result.requiresMigration).toHaveLength(1);
      expect(result.requiresMigration[0]._id).toBe("seller1");
      expect(result.stats).toEqual({
        total: 2,
        withStripeAccount: 1,
        requiresMigration: 1
      });
    });
  });

  describe("updateSellerAccountFromWebhook", () => {
    const stripeAccountId = "acct_123";

    it("should update account from webhook data", async () => {
      const mockStripeAccount = {
        status: "pending",
        updateFromStripeAccount: jest.fn().mockResolvedValue()
      };

      const webhookData = {
        id: stripeAccountId,
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: false
      };

      StripeAccount.getByStripeAccountId.mockResolvedValue(mockStripeAccount);

      const result = await sellerAccountManager.updateSellerAccountFromWebhook(
        stripeAccountId,
        webhookData
      );

      expect(mockStripeAccount.updateFromStripeAccount).toHaveBeenCalledWith(webhookData);
      expect(result).toEqual({
        success: true,
        updated: true,
        statusChanged: false,
        newStatus: "pending"
      });
    });

    it("should throw error for non-existent account", async () => {
      StripeAccount.getByStripeAccountId.mockResolvedValue(null);

      await expect(sellerAccountManager.updateSellerAccountFromWebhook(
        stripeAccountId,
        {}
      )).rejects.toThrow("Stripe account acct_123 not found in database");
    });
  });
});