const LegacyWalletBridge = require("../../services/payment/legacyWalletBridge");
const { LegacyWallet } = require("../../models/legacyWallet");
const { Wallet } = require("../../models/wallet");
const { Transaction } = require("../../models/transaction");
const { User } = require("../../models/user");
const { PaymentError, InsufficientFundsError } = require("../../services/payment/paymentErrors");

// Mock dependencies
jest.mock("../../models/legacyWallet");
jest.mock("../../models/wallet");
jest.mock("../../models/transaction");
jest.mock("../../models/user");

describe("LegacyWalletBridge", () => {
  let legacyWalletBridge;
  let mockLegacyWallet;
  let mockNewWallet;

  beforeEach(() => {
    jest.clearAllMocks();
    legacyWalletBridge = new LegacyWalletBridge();

    mockLegacyWallet = {
      _id: "legacy123",
      userId: "user123",
      balanceCents: 5000,
      currency: "USD",
      migrated: false,
      hasEnoughFunds: jest.fn(),
      spendBalance: jest.fn(),
      refundToBalance: jest.fn(),
      markAsMigrated: jest.fn()
    };

    mockNewWallet = {
      _id: "wallet123",
      userId: "user123",
      balance: 25.00,
      currency: "USD",
      hasEnoughFunds: jest.fn(),
      addFunds: jest.fn(),
      deductFunds: jest.fn()
    };
  });

  describe("getCombinedWalletBalance", () => {
    it("should return combined balance from both wallets", async () => {
      LegacyWallet.getByUserId.mockResolvedValue(mockLegacyWallet);
      Wallet.getWalletByUserId.mockResolvedValue(mockNewWallet);

      const result = await legacyWalletBridge.getCombinedWalletBalance("user123");

      expect(result).toEqual({
        success: true,
        totalBalanceCents: 7500, // 5000 + 2500 (25.00 * 100)
        legacyBalanceCents: 5000,
        newBalanceCents: 2500,
        currency: "USD",
        hasLegacyBalance: true,
        hasNewBalance: true,
        breakdown: {
          legacy: {
            balanceCents: 5000,
            source: undefined,
            migrated: false
          },
          new: {
            balanceCents: 2500,
            walletId: "wallet123"
          }
        }
      });
    });

    it("should handle user with only legacy wallet", async () => {
      LegacyWallet.getByUserId.mockResolvedValue(mockLegacyWallet);
      Wallet.getWalletByUserId.mockResolvedValue(null);

      const result = await legacyWalletBridge.getCombinedWalletBalance("user123");

      expect(result.totalBalanceCents).toBe(5000);
      expect(result.hasLegacyBalance).toBe(true);
      expect(result.hasNewBalance).toBe(false);
    });

    it("should handle user with only new wallet", async () => {
      LegacyWallet.getByUserId.mockResolvedValue(null);
      Wallet.getWalletByUserId.mockResolvedValue(mockNewWallet);

      const result = await legacyWalletBridge.getCombinedWalletBalance("user123");

      expect(result.totalBalanceCents).toBe(2500);
      expect(result.hasLegacyBalance).toBe(false);
      expect(result.hasNewBalance).toBe(true);
    });

    it("should handle user with no wallets", async () => {
      LegacyWallet.getByUserId.mockResolvedValue(null);
      Wallet.getWalletByUserId.mockResolvedValue(null);

      const result = await legacyWalletBridge.getCombinedWalletBalance("user123");

      expect(result.totalBalanceCents).toBe(0);
      expect(result.hasLegacyBalance).toBe(false);
      expect(result.hasNewBalance).toBe(false);
    });

    it("should validate user ID", async () => {
      await expect(legacyWalletBridge.getCombinedWalletBalance("invalid"))
        .rejects.toThrow("Invalid user ID format");
    });
  });

  describe("spendFromWallet", () => {
    beforeEach(() => {
      legacyWalletBridge.config.enableLegacySpending = true;
    });

    it("should spend from legacy wallet first", async () => {
      LegacyWallet.getByUserId.mockResolvedValue(mockLegacyWallet);
      Wallet.getWalletByUserId.mockResolvedValue(mockNewWallet);
      mockLegacyWallet.hasEnoughFunds.mockReturnValue(true);
      mockLegacyWallet.spendBalance.mockResolvedValue();

      // Mock the getCombinedWalletBalance call
      jest.spyOn(legacyWalletBridge, 'getCombinedWalletBalance').mockResolvedValue({
        totalBalanceCents: 7500,
        legacyBalanceCents: 5000,
        newBalanceCents: 2500
      });

      const result = await legacyWalletBridge.spendFromWallet("user123", 3000);

      expect(mockLegacyWallet.spendBalance).toHaveBeenCalledWith(3000);
      expect(result.success).toBe(true);
      expect(result.totalSpentCents).toBe(3000);
      expect(result.spendingBreakdown.legacy.spent).toBe(3000);
      expect(result.spendingBreakdown.new.spent).toBe(0);
    });

    it("should spend from both wallets when legacy is insufficient", async () => {
      LegacyWallet.getByUserId.mockResolvedValue(mockLegacyWallet);
      Wallet.getWalletByUserId.mockResolvedValue(mockNewWallet);
      mockLegacyWallet.hasEnoughFunds.mockReturnValue(true);
      mockLegacyWallet.spendBalance.mockResolvedValue();
      mockNewWallet.hasEnoughFunds.mockReturnValue(true);
      mockNewWallet.deductFunds.mockResolvedValue();
      Transaction.createPurchaseTransaction.mockResolvedValue();

      jest.spyOn(legacyWalletBridge, 'getCombinedWalletBalance').mockResolvedValue({
        totalBalanceCents: 7500,
        legacyBalanceCents: 5000,
        newBalanceCents: 2500
      });

      const result = await legacyWalletBridge.spendFromWallet("user123", 6000);

      expect(mockLegacyWallet.spendBalance).toHaveBeenCalledWith(5000);
      expect(mockNewWallet.deductFunds).toHaveBeenCalledWith(10.00); // 1000 cents = $10
      expect(result.spendingBreakdown.legacy.spent).toBe(5000);
      expect(result.spendingBreakdown.new.spent).toBe(1000);
    });

    it("should throw insufficient funds error", async () => {
      jest.spyOn(legacyWalletBridge, 'getCombinedWalletBalance').mockResolvedValue({
        totalBalanceCents: 5000,
        legacyBalanceCents: 5000,
        newBalanceCents: 0
      });

      await expect(legacyWalletBridge.spendFromWallet("user123", 6000))
        .rejects.toThrow(InsufficientFundsError);
    });

    it("should throw error when legacy spending is disabled", async () => {
      legacyWalletBridge.config.enableLegacySpending = false;

      await expect(legacyWalletBridge.spendFromWallet("user123", 1000))
        .rejects.toThrow("Legacy wallet spending is disabled");
    });
  });

  describe("refundToWallet", () => {
    it("should refund proportionally based on original spending", async () => {
      const originalSpendingBreakdown = {
        legacy: { spent: 3000 },
        new: { spent: 2000 }
      };

      LegacyWallet.getByUserId.mockResolvedValue(mockLegacyWallet);
      Wallet.getWalletByUserId.mockResolvedValue(mockNewWallet);
      mockLegacyWallet.refundToBalance.mockResolvedValue();
      mockNewWallet.addFunds.mockResolvedValue();
      Transaction.create.mockResolvedValue();

      const result = await legacyWalletBridge.refundToWallet(
        "user123", 
        4000, 
        originalSpendingBreakdown
      );

      // Should refund 2400 to legacy (3000/5000 * 4000) and 1600 to new
      expect(mockLegacyWallet.refundToBalance).toHaveBeenCalledWith(2400);
      expect(mockNewWallet.addFunds).toHaveBeenCalledWith(16.00); // 1600 cents = $16
      expect(result.refundBreakdown.legacy.refunded).toBe(2400);
      expect(result.refundBreakdown.new.refunded).toBe(1600);
    });

    it("should refund to new wallet when no original breakdown provided", async () => {
      Wallet.getWalletByUserId.mockResolvedValue(mockNewWallet);
      mockNewWallet.addFunds.mockResolvedValue();
      Transaction.create.mockResolvedValue();

      const result = await legacyWalletBridge.refundToWallet("user123", 3000);

      expect(mockNewWallet.addFunds).toHaveBeenCalledWith(30.00);
      expect(result.refundBreakdown.legacy.refunded).toBe(0);
      expect(result.refundBreakdown.new.refunded).toBe(3000);
    });

    it("should create new wallet if none exists for refund", async () => {
      Wallet.getWalletByUserId.mockResolvedValue(null);
      Wallet.createWalletForUser.mockResolvedValue(mockNewWallet);
      mockNewWallet.addFunds.mockResolvedValue();
      Transaction.create.mockResolvedValue();

      await legacyWalletBridge.refundToWallet("user123", 2000);

      expect(Wallet.createWalletForUser).toHaveBeenCalledWith("user123", "USD");
      expect(mockNewWallet.addFunds).toHaveBeenCalledWith(20.00);
    });
  });

  describe("migrateLegacyWallet", () => {
    it("should migrate legacy wallet successfully", async () => {
      LegacyWallet.getByUserId.mockResolvedValue(mockLegacyWallet);
      Wallet.getWalletByUserId.mockResolvedValue(mockNewWallet);
      mockNewWallet.addFunds.mockResolvedValue();
      mockLegacyWallet.markAsMigrated.mockResolvedValue();
      Transaction.create.mockResolvedValue();

      const result = await legacyWalletBridge.migrateLegacyWallet("user123");

      expect(mockNewWallet.addFunds).toHaveBeenCalledWith(50.00); // 5000 cents = $50
      expect(mockLegacyWallet.markAsMigrated).toHaveBeenCalledWith("wallet123");
      expect(Transaction.create).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.migratedBalanceCents).toBe(5000);
    });

    it("should create new wallet if none exists", async () => {
      LegacyWallet.getByUserId.mockResolvedValue(mockLegacyWallet);
      Wallet.getWalletByUserId.mockResolvedValue(null);
      Wallet.createWalletForUser.mockResolvedValue(mockNewWallet);
      mockNewWallet.addFunds.mockResolvedValue();
      mockLegacyWallet.markAsMigrated.mockResolvedValue();
      Transaction.create.mockResolvedValue();

      const result = await legacyWalletBridge.migrateLegacyWallet("user123");

      expect(Wallet.createWalletForUser).toHaveBeenCalledWith("user123", "USD");
      expect(result.success).toBe(true);
    });

    it("should handle zero balance migration", async () => {
      const zeroBalanceLegacyWallet = {
        ...mockLegacyWallet,
        balanceCents: 0
      };

      LegacyWallet.getByUserId.mockResolvedValue(zeroBalanceLegacyWallet);
      zeroBalanceLegacyWallet.markAsMigrated = jest.fn().mockResolvedValue();

      const result = await legacyWalletBridge.migrateLegacyWallet("user123");

      expect(result.success).toBe(true);
      expect(result.reason).toBe("zero_balance");
      expect(result.migratedBalanceCents).toBe(0);
    });

    it("should return false for non-existent legacy wallet", async () => {
      LegacyWallet.getByUserId.mockResolvedValue(null);

      const result = await legacyWalletBridge.migrateLegacyWallet("user123");

      expect(result.success).toBe(false);
      expect(result.reason).toBe("no_legacy_wallet");
    });

    it("should return false for already migrated wallet", async () => {
      const migratedLegacyWallet = {
        ...mockLegacyWallet,
        migrated: true,
        migratedAt: new Date()
      };

      LegacyWallet.getByUserId.mockResolvedValue(migratedLegacyWallet);

      const result = await legacyWalletBridge.migrateLegacyWallet("user123");

      expect(result.success).toBe(false);
      expect(result.reason).toBe("already_migrated");
    });
  });

  describe("getMigrationStatus", () => {
    it("should return complete migration status", async () => {
      LegacyWallet.getByUserId.mockResolvedValue(mockLegacyWallet);
      Wallet.getWalletByUserId.mockResolvedValue(mockNewWallet);

      const result = await legacyWalletBridge.getMigrationStatus("user123");

      expect(result).toEqual({
        hasLegacyWallet: true,
        hasNewWallet: true,
        legacyMigrated: false,
        legacyBalanceCents: 5000,
        newBalanceCents: 2500,
        migratedAt: null,
        requiresMigration: true
      });
    });

    it("should indicate no migration required for zero balance", async () => {
      const zeroBalanceLegacyWallet = {
        ...mockLegacyWallet,
        balanceCents: 0
      };

      LegacyWallet.getByUserId.mockResolvedValue(zeroBalanceLegacyWallet);
      Wallet.getWalletByUserId.mockResolvedValue(mockNewWallet);

      const result = await legacyWalletBridge.getMigrationStatus("user123");

      expect(result.requiresMigration).toBe(false);
    });
  });

  describe("batchMigrateLegacyWallets", () => {
    it("should migrate multiple legacy wallets", async () => {
      const mockLegacyWallets = [
        { userId: "user1", balanceCents: 1000 },
        { userId: "user2", balanceCents: 2000 },
        { userId: "user3", balanceCents: 3000 }
      ];

      LegacyWallet.find.mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockLegacyWallets)
      });

      // Mock successful migrations
      jest.spyOn(legacyWalletBridge, 'migrateLegacyWallet')
        .mockResolvedValueOnce({ success: true, migratedBalanceCents: 1000 })
        .mockResolvedValueOnce({ success: true, migratedBalanceCents: 2000 })
        .mockResolvedValueOnce({ success: true, migratedBalanceCents: 3000 });

      const result = await legacyWalletBridge.batchMigrateLegacyWallets({
        batchSize: 10,
        dryRun: false
      });

      expect(result.success).toBe(true);
      expect(result.results.processed).toBe(3);
      expect(result.results.successful).toBe(3);
      expect(result.results.failed).toBe(0);
      expect(result.results.totalMigratedCents).toBe(6000);
    });

    it("should handle migration failures gracefully", async () => {
      const mockLegacyWallets = [
        { userId: "user1", balanceCents: 1000 },
        { userId: "user2", balanceCents: 2000 }
      ];

      LegacyWallet.find.mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockLegacyWallets)
      });

      jest.spyOn(legacyWalletBridge, 'migrateLegacyWallet')
        .mockResolvedValueOnce({ success: true, migratedBalanceCents: 1000 })
        .mockRejectedValueOnce(new Error("Migration failed"));

      const result = await legacyWalletBridge.batchMigrateLegacyWallets();

      expect(result.results.processed).toBe(2);
      expect(result.results.successful).toBe(1);
      expect(result.results.failed).toBe(1);
      expect(result.results.errors).toHaveLength(1);
    });

    it("should perform dry run without actual migration", async () => {
      const mockLegacyWallets = [
        { userId: "user1", balanceCents: 1000 }
      ];

      LegacyWallet.find.mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockLegacyWallets)
      });

      const migrateSpy = jest.spyOn(legacyWalletBridge, 'migrateLegacyWallet');

      const result = await legacyWalletBridge.batchMigrateLegacyWallets({
        dryRun: true
      });

      expect(migrateSpy).not.toHaveBeenCalled();
      expect(result.dryRun).toBe(true);
      expect(result.results.successful).toBe(1);
      expect(result.results.totalMigratedCents).toBe(1000);
    });
  });

  describe("validateWalletConsistency", () => {
    it("should detect inconsistencies", async () => {
      const migratedLegacyWallet = {
        ...mockLegacyWallet,
        migrated: true,
        balanceCents: 1000 // Still has balance but marked as migrated
      };

      jest.spyOn(legacyWalletBridge, 'getCombinedWalletBalance').mockResolvedValue({
        totalBalanceCents: 3500,
        legacyBalanceCents: 1000,
        newBalanceCents: 2500
      });

      jest.spyOn(legacyWalletBridge, 'getMigrationStatus').mockResolvedValue({
        legacyMigrated: true,
        legacyBalanceCents: 1000
      });

      const result = await legacyWalletBridge.validateWalletConsistency("user123");

      expect(result.consistent).toBe(false);
      expect(result.issues).toContain("Legacy wallet marked as migrated but still has balance");
    });

    it("should return consistent for valid state", async () => {
      jest.spyOn(legacyWalletBridge, 'getCombinedWalletBalance').mockResolvedValue({
        totalBalanceCents: 2500,
        legacyBalanceCents: 0,
        newBalanceCents: 2500
      });

      jest.spyOn(legacyWalletBridge, 'getMigrationStatus').mockResolvedValue({
        legacyMigrated: true,
        legacyBalanceCents: 0
      });

      const result = await legacyWalletBridge.validateWalletConsistency("user123");

      expect(result.consistent).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe("configuration methods", () => {
    it("should return correct legacy spending status", () => {
      legacyWalletBridge.config.enableLegacySpending = true;
      legacyWalletBridge.config.legacyWalletReadonly = false;

      expect(legacyWalletBridge.isLegacySpendingEnabled()).toBe(true);
    });

    it("should return false when readonly mode is enabled", () => {
      legacyWalletBridge.config.enableLegacySpending = true;
      legacyWalletBridge.config.legacyWalletReadonly = true;

      expect(legacyWalletBridge.isLegacySpendingEnabled()).toBe(false);
    });

    it("should return readonly status", () => {
      legacyWalletBridge.config.legacyWalletReadonly = true;

      expect(legacyWalletBridge.isLegacyWalletReadonly()).toBe(true);
    });
  });
});