const WalletService = require("../../services/wallet/walletService");
const LegacyWalletBridge = require("../../services/payment/legacyWalletBridge");
const { getWalletFeatureFlags } = require("../../services/featureFlags/walletFeatureFlags");
const { Wallet } = require("../../models/wallet");
const { LegacyWallet } = require("../../models/legacyWallet");
const { Transaction } = require("../../models/transaction");

// Mock dependencies
jest.mock("../../services/payment/legacyWalletBridge");
jest.mock("../../services/featureFlags/walletFeatureFlags");
jest.mock("../../models/wallet");
jest.mock("../../models/legacyWallet");
jest.mock("../../models/transaction");

describe("WalletService", () => {
  let walletService;
  let mockLegacyBridge;
  let mockFeatureFlags;

  beforeEach(() => {
    walletService = new WalletService();
    
    // Mock legacy bridge
    mockLegacyBridge = {
      getCombinedWalletBalance: jest.fn(),
      getMigrationStatus: jest.fn(),
      spendFromWallet: jest.fn(),
      refundToWallet: jest.fn(),
      migrateLegacyWallet: jest.fn(),
      validateWalletConsistency: jest.fn(),
      getLegacyWalletStats: jest.fn(),
      isLegacySpendingEnabled: jest.fn(),
      isLegacyWalletReadonly: jest.fn()
    };
    LegacyWalletBridge.mockImplementation(() => mockLegacyBridge);

    // Mock feature flags
    mockFeatureFlags = {
      isLegacyWalletEnabled: jest.fn().mockReturnValue(true),
      isStripeConnectEnabled: jest.fn().mockReturnValue(true),
      isHybridWalletMode: jest.fn().mockReturnValue(true),
      shouldSpendLegacyFirst: jest.fn().mockReturnValue(true),
      isLegacyWalletReadonly: jest.fn().mockReturnValue(false),
      getSpendingStrategy: jest.fn().mockReturnValue({ strategy: "legacy_first" })
    };
    getWalletFeatureFlags.mockReturnValue(mockFeatureFlags);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("getWalletInfo", () => {
    it("should return comprehensive wallet information", async () => {
      const userId = "user123";
      
      // Mock combined balance
      mockLegacyBridge.getCombinedWalletBalance.mockResolvedValue({
        totalBalanceCents: 7500, // $75.00
        legacyBalanceCents: 2500, // $25.00
        newBalanceCents: 5000, // $50.00
        currency: "USD",
        hasLegacyBalance: true,
        hasNewBalance: true,
        breakdown: {
          legacy: {
            balanceCents: 2500,
            source: "unified_stripe_dev",
            migrated: false
          },
          new: {
            balanceCents: 5000,
            walletId: "wallet123"
          }
        }
      });

      // Mock migration status
      mockLegacyBridge.getMigrationStatus.mockResolvedValue({
        hasLegacyWallet: true,
        hasNewWallet: true,
        legacyMigrated: false,
        requiresMigration: true
      });

      const result = await walletService.getWalletInfo(userId);

      expect(result.success).toBe(true);
      expect(result.totalBalanceCents).toBe(7500);
      expect(result.totalBalanceDollars).toBe(75);
      expect(result.breakdown.legacy.balanceDollars).toBe(25);
      expect(result.breakdown.platform.balanceDollars).toBe(50);
      expect(result.spendingStrategy).toBe("legacy_first");
      expect(result.featureFlags.legacyFirstSpending).toBe(true);
    });
  });

  describe("spendFromWallet", () => {
    it("should spend legacy balance first when strategy is legacy_first", async () => {
      const userId = "user123";
      const amountCents = 3000; // $30.00
      const metadata = { orderId: "order123" };

      // Mock wallet info
      mockLegacyBridge.getCombinedWalletBalance.mockResolvedValue({
        totalBalanceCents: 7500,
        legacyBalanceCents: 2500,
        newBalanceCents: 5000
      });

      // Mock spending result
      mockLegacyBridge.spendFromWallet.mockResolvedValue({
        success: true,
        totalSpentCents: 3000,
        spendingBreakdown: {
          legacy: { spent: 2500, remaining: 0 },
          new: { spent: 500, remaining: 4500 }
        },
        remainingBalanceCents: 4500
      });

      const result = await walletService.spendFromWallet(userId, amountCents, metadata);

      expect(mockLegacyBridge.spendFromWallet).toHaveBeenCalledWith(userId, amountCents, metadata);
      expect(result.success).toBe(true);
      expect(result.totalSpentCents).toBe(3000);
      expect(result.totalSpentDollars).toBe(30);
      expect(result.spendingStrategy).toBe("legacy_first");
      expect(result.spendingBreakdown.legacy.spentCents).toBe(2500);
      expect(result.spendingBreakdown.platform.spentCents).toBe(500);
    });

    it("should throw insufficient funds error when balance is too low", async () => {
      const userId = "user123";
      const amountCents = 10000; // $100.00

      // Mock wallet info with insufficient balance
      mockLegacyBridge.getCombinedWalletBalance.mockResolvedValue({
        totalBalanceCents: 5000, // Only $50.00 available
        legacyBalanceCents: 2000,
        newBalanceCents: 3000
      });

      await expect(walletService.spendFromWallet(userId, amountCents))
        .rejects.toThrow("Insufficient funds");
    });

    it("should respect disabled spending strategy", async () => {
      const userId = "user123";
      const amountCents = 1000;

      mockFeatureFlags.getSpendingStrategy.mockReturnValue({ strategy: "disabled" });

      await expect(walletService.spendFromWallet(userId, amountCents))
        .rejects.toThrow("Wallet spending is currently disabled");
    });
  });

  describe("addFundsToWallet", () => {
    it("should add funds to platform wallet by default", async () => {
      const userId = "user123";
      const amountCents = 5000; // $50.00

      const mockWallet = {
        _id: "wallet123",
        balance: 100,
        addFunds: jest.fn().mockResolvedValue(),
        currency: "USD"
      };

      Wallet.getWalletByUserId.mockResolvedValue(mockWallet);
      Transaction.create.mockResolvedValue();

      const result = await walletService.addFundsToWallet(userId, amountCents);

      expect(mockWallet.addFunds).toHaveBeenCalledWith(50);
      expect(Transaction.create).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.addedAmountCents).toBe(5000);
      expect(result.addedToPlatform).toBe(true);
      expect(result.addedToLegacy).toBe(false);
    });

    it("should add funds to legacy wallet when source is legacy", async () => {
      const userId = "user123";
      const amountCents = 3000; // $30.00

      const mockLegacyWallet = {
        balanceCents: 5000,
        refundToBalance: jest.fn().mockResolvedValue()
      };

      LegacyWallet.getByUserId.mockResolvedValue(mockLegacyWallet);

      const result = await walletService.addFundsToWallet(userId, amountCents, "legacy");

      expect(mockLegacyWallet.refundToBalance).toHaveBeenCalledWith(3000);
      expect(result.success).toBe(true);
      expect(result.addedToLegacy).toBe(true);
      expect(result.addedToPlatform).toBe(false);
    });

    it("should reject legacy funding when legacy wallet is readonly", async () => {
      const userId = "user123";
      const amountCents = 1000;

      mockFeatureFlags.isLegacyWalletReadonly.mockReturnValue(true);

      await expect(walletService.addFundsToWallet(userId, amountCents, "legacy"))
        .rejects.toThrow("Legacy wallet funding is not available");
    });
  });

  describe("refundToWallet", () => {
    it("should distribute refund based on original spending breakdown", async () => {
      const userId = "user123";
      const amountCents = 2000; // $20.00
      const originalSpendingBreakdown = {
        legacy: { spent: 1500 },
        new: { spent: 500 }
      };

      mockLegacyBridge.refundToWallet.mockResolvedValue({
        success: true,
        totalRefundedCents: 2000,
        refundBreakdown: {
          legacy: { refunded: 1500 },
          new: { refunded: 500 }
        }
      });

      const result = await walletService.refundToWallet(
        userId, 
        amountCents, 
        originalSpendingBreakdown
      );

      expect(mockLegacyBridge.refundToWallet).toHaveBeenCalledWith(
        userId,
        amountCents,
        originalSpendingBreakdown,
        {}
      );
      expect(result.success).toBe(true);
      expect(result.totalRefundedCents).toBe(2000);
      expect(result.refundBreakdown.legacy.refundedCents).toBe(1500);
      expect(result.refundBreakdown.platform.refundedCents).toBe(500);
    });
  });

  describe("hasEnoughFunds", () => {
    it("should check combined balance availability", async () => {
      const userId = "user123";
      const amountCents = 3000;

      // Mock wallet info
      walletService.getWalletInfo = jest.fn().mockResolvedValue({
        totalBalanceCents: 5000
      });

      const result = await walletService.hasEnoughFunds(userId, amountCents);

      expect(result.hasEnoughFunds).toBe(true);
      expect(result.availableBalanceCents).toBe(5000);
      expect(result.requiredAmountCents).toBe(3000);
      expect(result.shortfallCents).toBe(0);
    });

    it("should calculate shortfall when insufficient funds", async () => {
      const userId = "user123";
      const amountCents = 8000;

      walletService.getWalletInfo = jest.fn().mockResolvedValue({
        totalBalanceCents: 5000
      });

      const result = await walletService.hasEnoughFunds(userId, amountCents);

      expect(result.hasEnoughFunds).toBe(false);
      expect(result.shortfallCents).toBe(3000);
    });
  });

  describe("migrateLegacyWallet", () => {
    it("should delegate to legacy bridge", async () => {
      const userId = "user123";
      const expectedResult = {
        success: true,
        migratedBalanceCents: 2500
      };

      mockLegacyBridge.migrateLegacyWallet.mockResolvedValue(expectedResult);

      const result = await walletService.migrateLegacyWallet(userId);

      expect(mockLegacyBridge.migrateLegacyWallet).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("getTransactionHistory", () => {
    it("should return transaction history with cents conversion", async () => {
      const userId = "user123";
      const options = { page: 1, limit: 10 };

      const mockTransactions = [
        {
          toObject: () => ({
            externalId: "tx123",
            type: "funding",
            amount: 50.00,
            currency: "USD",
            status: "completed",
            balanceBefore: 25.00,
            balanceAfter: 75.00
          })
        }
      ];

      Transaction.getTransactionsByUserId.mockResolvedValue(mockTransactions);

      const result = await walletService.getTransactionHistory(userId, options);

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].amountCents).toBe(5000);
      expect(result.transactions[0].balanceBeforeCents).toBe(2500);
      expect(result.transactions[0].balanceAfterCents).toBe(7500);
      expect(result.transactions[0].source).toBe("platform");
    });
  });
});