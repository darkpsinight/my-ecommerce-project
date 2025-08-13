const { getWallet } = require("../../handlers/walletHandlers");
const { User } = require("../../models/user");
const { Wallet } = require("../../models/wallet");
const WalletService = require("../../services/wallet/walletService");

// Mock dependencies
jest.mock("../../models/user");
jest.mock("../../models/wallet");
jest.mock("../../services/wallet/walletService");

describe("walletHandlers - getWallet", () => {
  let mockRequest, mockReply;
  let mockWalletService;

  beforeEach(() => {
    mockRequest = {
      log: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      },
      user: {
        uid: "test-user-uid"
      }
    };

    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    // Mock wallet service
    mockWalletService = {
      getWalletInfo: jest.fn(),
      getTransactionHistory: jest.fn()
    };
    WalletService.mockImplementation(() => mockWalletService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it("should return comprehensive wallet information using wallet service", async () => {
    // Mock user
    const mockUser = {
      _id: "user123",
      uid: "test-user-uid",
      email: "test@example.com"
    };
    User.findOne.mockResolvedValue(mockUser);

    // Mock platform wallet
    const mockWallet = {
      externalId: "wallet-ext-123",
      balance: 50.00,
      currency: "USD",
      totalFunded: 100.00,
      totalSpent: 50.00,
      lastFundedAt: new Date("2024-01-01"),
      lastSpentAt: new Date("2024-01-02"),
      createdAt: new Date("2023-12-01"),
      updatedAt: new Date("2024-01-03")
    };
    Wallet.getWalletByUserId.mockResolvedValue(mockWallet);

    // Mock wallet service responses
    mockWalletService.getWalletInfo.mockResolvedValue({
      success: true,
      totalBalanceCents: 7500, // $75.00
      totalBalanceDollars: 75.00,
      currency: "USD",
      breakdown: {
        legacy: {
          balanceCents: 2500,
          balanceDollars: 25.00,
          enabled: true,
          readonly: false,
          source: "unified_stripe_dev",
          migrated: false
        },
        platform: {
          balanceCents: 5000,
          balanceDollars: 50.00,
          enabled: true,
          walletId: "wallet123"
        }
      },
      spendingStrategy: "legacy_first",
      migrationStatus: {
        hasLegacyWallet: true,
        hasNewWallet: true,
        legacyMigrated: false,
        requiresMigration: true
      },
      featureFlags: {
        legacyWalletEnabled: true,
        stripeConnectEnabled: true,
        hybridMode: true,
        legacyFirstSpending: true
      }
    });

    mockWalletService.getTransactionHistory.mockResolvedValue({
      success: true,
      transactions: [
        {
          externalId: "tx123",
          type: "funding",
          amount: 25.00,
          currency: "USD",
          status: "completed",
          description: "Wallet funding",
          createdAt: new Date("2024-01-01"),
          source: "platform"
        }
      ]
    });

    await getWallet(mockRequest, mockReply);

    expect(mockWalletService.getWalletInfo).toHaveBeenCalledWith("user123");
    expect(mockWalletService.getTransactionHistory).toHaveBeenCalledWith("user123", { limit: 5 });

    expect(mockReply.send).toHaveBeenCalledWith({
      success: true,
      message: "Wallet information retrieved successfully",
      data: {
        wallet: {
          externalId: "wallet-ext-123",
          balance: 50.00, // Platform balance
          legacyBalance: 25.00, // Legacy balance
          combinedBalance: 75.00, // Combined balance
          currency: "USD",
          totalFunded: 100.00,
          totalSpent: 50.00,
          lastFundedAt: mockWallet.lastFundedAt,
          lastSpentAt: mockWallet.lastSpentAt,
          createdAt: mockWallet.createdAt,
          updatedAt: mockWallet.updatedAt
        },
        recentTransactions: [
          {
            externalId: "tx123",
            type: "funding",
            amount: 25.00,
            currency: "USD",
            status: "completed",
            description: "Wallet funding",
            createdAt: expect.any(Date),
            source: "platform"
          }
        ],
        featureFlags: {
          legacyWalletEnabled: true,
          stripeConnectEnabled: true,
          hybridMode: true,
          legacyFirstSpending: true
        },
        spendingStrategy: "legacy_first",
        migrationStatus: {
          hasLegacyWallet: true,
          hasNewWallet: true,
          legacyMigrated: false,
          requiresMigration: true
        }
      }
    });
  });

  it("should create wallet if it doesn't exist", async () => {
    const mockUser = {
      _id: "user123",
      uid: "test-user-uid"
    };
    User.findOne.mockResolvedValue(mockUser);

    // No existing wallet
    Wallet.getWalletByUserId.mockResolvedValue(null);

    // Mock wallet creation
    const mockCreatedWallet = {
      externalId: "new-wallet-123",
      balance: 0,
      currency: "USD",
      totalFunded: 0,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    Wallet.createWalletForUser.mockResolvedValue(mockCreatedWallet);

    // Mock wallet service responses
    mockWalletService.getWalletInfo.mockResolvedValue({
      success: true,
      totalBalanceCents: 0,
      totalBalanceDollars: 0,
      currency: "USD",
      breakdown: {
        legacy: { balanceDollars: 0 },
        platform: { balanceDollars: 0 }
      },
      spendingStrategy: "legacy_first",
      migrationStatus: {},
      featureFlags: {
        legacyWalletEnabled: true,
        stripeConnectEnabled: true,
        hybridMode: true,
        legacyFirstSpending: true
      }
    });

    mockWalletService.getTransactionHistory.mockResolvedValue({
      success: true,
      transactions: []
    });

    await getWallet(mockRequest, mockReply);

    expect(Wallet.createWalletForUser).toHaveBeenCalledWith("user123", "USD");
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          wallet: expect.objectContaining({
            externalId: "new-wallet-123",
            balance: 0,
            legacyBalance: 0,
            combinedBalance: 0
          })
        })
      })
    );
  });

  it("should handle user not found", async () => {
    User.findOne.mockResolvedValue(null);

    await getWallet(mockRequest, mockReply);

    expect(mockReply.code).toHaveBeenCalledWith(404);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      message: "User not found"
    });
  });

  it("should handle wallet service errors", async () => {
    const mockUser = {
      _id: "user123",
      uid: "test-user-uid"
    };
    User.findOne.mockResolvedValue(mockUser);

    const mockWallet = {
      externalId: "wallet-123",
      balance: 0,
      currency: "USD"
    };
    Wallet.getWalletByUserId.mockResolvedValue(mockWallet);

    // Mock wallet service error
    mockWalletService.getWalletInfo.mockRejectedValue(new Error("Service error"));

    await getWallet(mockRequest, mockReply);

    expect(mockRequest.log.error).toHaveBeenCalledWith(
      expect.stringContaining("Error getting wallet: Service error")
    );
    expect(mockReply.code).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      message: "Failed to retrieve wallet information",
      error: {
        metadata: { hint: "Please try again later" }
      }
    });
  });
});