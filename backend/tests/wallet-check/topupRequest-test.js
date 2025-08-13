const { createTopUpRequest } = require("../../handlers/walletHandlers");
const { User } = require("../../models/user");
const { LegacyWallet } = require("../../models/legacyWallet");
const { getWalletFeatureFlags } = require("../../services/featureFlags/walletFeatureFlags");

// Mock dependencies
jest.mock("../../models/user");
jest.mock("../../models/legacyWallet");
jest.mock("../../services/featureFlags/walletFeatureFlags");
jest.mock("../../services/payment/paymentProcessor");

describe("createTopUpRequest", () => {
  let mockRequest, mockReply;

  beforeEach(() => {
    mockRequest = {
      log: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      },
      body: {
        amount: 50,
        currency: "USD"
      },
      user: {
        uid: "test-user-uid"
      },
      headers: {
        "user-agent": "test-agent"
      }
    };

    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  it("should create topup request using stripe connect when feature flag is enabled", async () => {
    // Mock user
    const mockUser = {
      _id: "user123",
      uid: "test-user-uid",
      email: "test@example.com"
    };
    User.findOne.mockResolvedValue(mockUser);

    // Mock feature flags
    const mockFeatureFlags = {
      getTopUpMethod: jest.fn().mockReturnValue({ method: "stripe_connect" }),
      isLegacyWalletEnabled: jest.fn().mockReturnValue(true)
    };
    getWalletFeatureFlags.mockReturnValue(mockFeatureFlags);

    // Mock legacy wallet
    const mockLegacyWallet = {
      balanceCents: 2500 // $25.00
    };
    LegacyWallet.getByUserId.mockResolvedValue(mockLegacyWallet);

    // Mock payment processor
    const PaymentProcessor = require("../../services/payment/paymentProcessor");
    const mockPaymentProcessor = {
      createWalletTopUpIntent: jest.fn().mockResolvedValue({
        success: true,
        paymentIntentId: "pi_test123",
        clientSecret: "pi_test123_secret",
        status: "requires_payment_method"
      })
    };
    PaymentProcessor.mockImplementation(() => mockPaymentProcessor);

    await createTopUpRequest(mockRequest, mockReply);

    expect(mockPaymentProcessor.createWalletTopUpIntent).toHaveBeenCalledWith({
      amountCents: 5000,
      currency: "USD",
      buyerId: "user123",
      metadata: {
        source: "wallet_topup_request",
        userAgent: "test-agent"
      }
    });

    expect(mockReply.send).toHaveBeenCalledWith({
      success: true,
      message: "Top-up request created successfully",
      data: {
        clientSecret: "pi_test123_secret",
        paymentIntentId: "pi_test123",
        amount: 50,
        currency: "USD",
        method: "stripe_connect",
        legacyBalance: 25
      }
    });
  });

  it("should return error when topup method is disabled", async () => {
    // Mock user
    const mockUser = {
      _id: "user123",
      uid: "test-user-uid",
      email: "test@example.com"
    };
    User.findOne.mockResolvedValue(mockUser);

    // Mock feature flags - disabled
    const mockFeatureFlags = {
      getTopUpMethod: jest.fn().mockReturnValue({ 
        method: "disabled", 
        reason: "maintenance_mode" 
      }),
      isLegacyWalletEnabled: jest.fn().mockReturnValue(false)
    };
    getWalletFeatureFlags.mockReturnValue(mockFeatureFlags);

    await createTopUpRequest(mockRequest, mockReply);

    expect(mockReply.code).toHaveBeenCalledWith(503);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      message: "Wallet top-ups are currently disabled",
      error: {
        code: "TOPUP_DISABLED",
        reason: "maintenance_mode"
      }
    });
  });

  it("should validate amount limits", async () => {
    mockRequest.body.amount = 5; // Below minimum

    // Mock user
    const mockUser = {
      _id: "user123",
      uid: "test-user-uid",
      email: "test@example.com"
    };
    User.findOne.mockResolvedValue(mockUser);

    await createTopUpRequest(mockRequest, mockReply);

    expect(mockReply.code).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("Amount must be between")
      })
    );
  });
});