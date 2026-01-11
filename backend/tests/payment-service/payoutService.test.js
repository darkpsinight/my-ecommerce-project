const mongoose = require("mongoose");
const PayoutService = require("../../services/payment/payoutService");
const { Order } = require("../../models/order");
const { Payout } = require("../../models/payout");
const { LedgerEntry } = require("../../models/ledgerEntry");
const { StripeAccount } = require("../../models/stripeAccount");
const StripeAdapter = require("../../services/payment/stripeAdapter");
const { PaymentError } = require("../../services/payment/paymentErrors");

// Mock dependencies
jest.mock("../../models/order");
jest.mock("../../models/payout");
jest.mock("../../models/ledgerEntry");
jest.mock("../../models/stripeAccount");
jest.mock("../../services/payment/stripeAdapter");

describe("PayoutService", () => {
    let mockStripeAdapterInstance;
    let sessionMock;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock Mongoose Session
        sessionMock = {
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn()
        };
        mongoose.startSession = jest.fn().mockResolvedValue(sessionMock);

        // Mock StripeAdapter Instance
        mockStripeAdapterInstance = {
            createTransferToSeller: jest.fn()
        };
        StripeAdapter.mockImplementation(() => mockStripeAdapterInstance);

        // Re-instantiate service to get fresh mock
        // Note: PayoutService exports a singleton `new PayoutService()`. 
        // Ideally we should export class for testing or rely on jest module cache invalidation.
        // Since it's a singleton exported as `new`, we can't easily swap the internal adapter 
        // UNLESS we use `require` inside the test after mock setup.
        // However, since we mock the module `stripeAdapter`, the cached instance in `payoutService` 
        // (if not re-required) might hold the old one if we are not careful.
        // But Jest mocks happen at module load time. 
        // Let's assume standard Jest behavior. 
        // To be safe, we can manually inject the mock if possible, or assume `new StripeAdapter()` inside the service constructor picked up the mock.
        // PayoutService was instantiated at require time. 
        // We might need to modify PayoutService to allow injection or rely on jest.mock hoisting.

        // Wait, `PayoutService` is instance. `StripeAdapter` is mocked. 
        // If `PayoutService` is imported at top level, it runs `new StripeAdapter()` then.
        // The `jest.mock` call is hoisted. So it should be fine.
        // BUT we need to access `mockStripeAdapterInstance` which is created inside the mock factory?
        // No, standard `jest.mock` auto-mocks class. 
        // We can access the instance via `StripeAdapter.mock.instances[0]`.
    });

    // Helper to access the mock instance used by the service
    const getStripeAdapterMock = () => {
        // PayoutService is a singleton instantiated on load.
        // We need to ensure we can control its `stripeAdapter`.
        // A hacky connection: PayoutService.stripeAdapter = mockStripeAdapterInstance;
        // but PayoutService is imported.
        return PayoutService.stripeAdapter;
    };

    describe("processOrderPayout", () => {
        const adminId = "admin-123";
        const orderId = "order-123";
        const sellerId = "seller-456";
        const orderData = {
            _id: orderId,
            externalId: "ext-order-123",
            sellerId: sellerId,
            deliveryStatus: "delivered",
            totalAmount: 100, // $100.00
            currency: "USD",
            paymentIntentId: "pi_123"
        };

        it("should process a valid payout successfully", async () => {
            // Setup
            Order.findById.mockResolvedValue(orderData);
            Payout.findOne.mockResolvedValue(null); // No existing payout
            StripeAccount.getBySellerId.mockResolvedValue({
                stripeAccountId: "acct_123",
                isFullyVerified: () => true
            });

            // Ledger Mock: Sufficient funds (10000 cents)
            LedgerEntry.aggregate.mockResolvedValue([{ totalAmount: 10000 }]);

            // Payout Save Mock
            const saveMock = jest.fn().mockResolvedValue(true);
            Payout.mockImplementation(() => ({
                payoutId: "payout-abc",
                save: saveMock,
                status: "PENDING"
            }));

            // Ledger Entry Mock
            LedgerEntry.mockImplementation(() => ({
                save: jest.fn()
            }));

            // Stripe Success
            getStripeAdapterMock().createTransferToSeller.mockResolvedValue({
                transferId: "tr_123"
            });

            // Execute
            const result = await PayoutService.processOrderPayout(orderId, adminId);

            // Verify
            expect(Order.findById).toHaveBeenCalledWith(orderId);
            expect(LedgerEntry.aggregate).toHaveBeenCalled(); // Balance check
            expect(getStripeAdapterMock().createTransferToSeller).toHaveBeenCalledWith(
                "ext-order-123",
                10000,
                sellerId,
                "acct_123",
                expect.objectContaining({
                    payoutId: "payout-abc",
                    orderId: orderId
                })
            );

            // Verify Atomic Transaction
            expect(mongoose.startSession).toHaveBeenCalled();
            expect(sessionMock.startTransaction).toHaveBeenCalled();
            expect(sessionMock.commitTransaction).toHaveBeenCalled();

            // Verify Payout Status Update (COMPLETED)
            expect(result.status).toBe("COMPLETED");
            expect(result.stripeTransferId).toBe("tr_123");
        });

        it("should fail validation if order is not delivered", async () => {
            Order.findById.mockResolvedValue({ ...orderData, deliveryStatus: "pending" });

            await expect(PayoutService.processOrderPayout(orderId, adminId))
                .rejects.toThrow("Order order-123 is not delivered");

            expect(getStripeAdapterMock().createTransferToSeller).not.toHaveBeenCalled();
        });

        it("should fail validation if payout already exists", async () => {
            Order.findById.mockResolvedValue(orderData);
            Payout.findOne.mockResolvedValue({ status: "COMPLETED" });

            await expect(PayoutService.processOrderPayout(orderId, adminId))
                .rejects.toThrow("Payout already exists");
        });

        it("should fail if ledger balance is insufficient", async () => {
            Order.findById.mockResolvedValue(orderData);
            Payout.findOne.mockResolvedValue(null);
            StripeAccount.getBySellerId.mockResolvedValue({ isFullyVerified: () => true });

            // Ledger Mock: only 5000 cents vs 10000 needed
            LedgerEntry.aggregate.mockResolvedValue([{ totalAmount: 5000 }]);

            await expect(PayoutService.processOrderPayout(orderId, adminId))
                .rejects.toThrow("Insufficient locked escrow balance");
        });

        it("should handle CRITICAL failure (Stripe Success, DB Fail)", async () => {
            // Setup similar to happy path
            Order.findById.mockResolvedValue(orderData);
            Payout.findOne.mockResolvedValue(null);
            StripeAccount.getBySellerId.mockResolvedValue({
                stripeAccountId: "acct_123", isFullyVerified: () => true
            });
            LedgerEntry.aggregate.mockResolvedValue([{ totalAmount: 10000 }]);

            const saveMock = jest.fn();
            Payout.mockImplementation(() => ({
                payoutId: "payout-abc",
                save: saveMock,
                status: "PENDING"
            }));

            // Stripe Success
            getStripeAdapterMock().createTransferToSeller.mockResolvedValue({
                transferId: "tr_123"
            });

            // DB Failure on Ledger Save (inside transaction)
            LedgerEntry.mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(new Error("DB Connection Lost"))
            }));

            // Expect specific Critical Error
            try {
                await PayoutService.processOrderPayout(orderId, adminId);
                fail("Should have thrown critical error");
            } catch (error) {
                expect(error.type).toBe("CRITICAL_RECONCILIATION_REQUIRED");
                expect(error.details).toMatchObject({
                    payoutId: "payout-abc",
                    stripeTransferId: "tr_123",
                    dbError: "DB Connection Lost"
                });
            }

            // Verify Transaction Aborted
            expect(sessionMock.abortTransaction).toHaveBeenCalled();

            // Verify Stripe WAS called (money moved)
            expect(getStripeAdapterMock().createTransferToSeller).toHaveBeenCalled();
        });
    });
});
