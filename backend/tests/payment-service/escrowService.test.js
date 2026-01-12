const mongoose = require("mongoose");
const EscrowService = require("../../services/payment/escrowService");
const { Order } = require("../../models/order");
const PayoutService = require("../../services/payment/payoutService");
const StripeAdapter = require("../../services/payment/stripeAdapter");
const LedgerService = require("../../services/payment/ledgerService");
const { PaymentError } = require("../../services/payment/paymentErrors");

// Mock dependencies
jest.mock("../../models/order");
jest.mock("../../services/payment/payoutService");
jest.mock("../../services/payment/stripeAdapter");
jest.mock("../../services/payment/ledgerService");

describe("EscrowService", () => {
    let mockStripeAdapterInstance;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock StripeAdapter instance method
        mockStripeAdapterInstance = {
            refundPayment: jest.fn()
        };
        // Setup the mock to assume EscrowService uses the mocked class
        // Note: EscrowService requires StripeAdapter inside. 
        // Jest mocks module factory, so new StripeAdapter() returns the auto-mock.
        // We need to ensure we target the instance that EscrowService gets.
        StripeAdapter.mockImplementation(() => mockStripeAdapterInstance);

        // However, EscrowService is a singleton instantiated at module level.
        // It likely already instantiated StripeAdapter 'before' this test file ran if assumed singleton.
        // Similar issue to PayoutService.
        // We will assume that since we are mocking the module, and Jest hoisting, 
        // if we require properly, it works. 

        // Since EscrowService.stripeAdapter is assigned in constructor, 
        // we can forcibly inject it if needed, or rely on Jest magic.
        // Let's inject for safety:
        EscrowService.stripeAdapter = mockStripeAdapterInstance;
    });

    describe("releaseEscrow", () => {
        const orderId = "order-123";
        const adminId = "admin-999";
        const orderMock = {
            _id: orderId,
            escrowStatus: "held",
            save: jest.fn()
        };

        it("should successfully release escrow", async () => {
            Order.findById.mockResolvedValue(orderMock);

            // Mock PayoutService success
            PayoutService.processOrderPayout.mockResolvedValue({
                payoutId: "payout-abc",
                stripeTransferId: "tr-xyz"
            });

            const result = await EscrowService.releaseEscrow(orderId, adminId);

            expect(Order.findById).toHaveBeenCalledWith(orderId);
            expect(orderMock.escrowStatus).toBe("released"); // Verified mutation
            expect(orderMock.save).toHaveBeenCalled();
            expect(PayoutService.processOrderPayout).toHaveBeenCalledWith(orderId, adminId);

            expect(result).toMatchObject({
                success: true,
                escrowStatus: "released",
                payoutId: "payout-abc"
            });
        });

        it("should fail if order not found", async () => {
            Order.findById.mockResolvedValue(null);
            await expect(EscrowService.releaseEscrow(orderId, adminId))
                .rejects.toThrow("Order not found");
        });

        it("should fail if escrowStatus is not held", async () => {
            Order.findById.mockResolvedValue({ ...orderMock, escrowStatus: "released" });
            await expect(EscrowService.releaseEscrow(orderId, adminId))
                .rejects.toThrow("Order is not in held status");
            expect(PayoutService.processOrderPayout).not.toHaveBeenCalled();
        });
    });

    describe("refundEscrow", () => {
        const orderId = "order-456";
        const adminId = "admin-999";
        const paymentIntentId = "pi_test_123";
        let orderMock;

        beforeEach(() => {
            orderMock = {
                _id: orderId,
                paymentIntentId,
                escrowStatus: "held",
                status: "completed",
                totalAmount: 50,
                currency: "USD",
                save: jest.fn()
            };
        });

        it("should successfully refund escrow", async () => {
            Order.findById.mockResolvedValue(orderMock);

            // Mock Stripe Refund
            mockStripeAdapterInstance.refundPayment.mockResolvedValue({
                refundId: "re_123",
                amountCents: 5000,
                currency: "USD",
                reason: "requested_by_customer"
            });

            // Mock Ledger Record
            LedgerService.recordRefund.mockResolvedValue(true);

            const result = await EscrowService.refundEscrow(orderId, adminId);

            expect(Order.findById).toHaveBeenCalledWith(orderId);
            expect(mockStripeAdapterInstance.refundPayment).toHaveBeenCalledWith(
                paymentIntentId, null, "admin_check_refund"
            );
            expect(LedgerService.recordRefund).toHaveBeenCalled();

            expect(orderMock.escrowStatus).toBe("refunded");
            expect(orderMock.status).toBe("refunded");
            expect(orderMock.save).toHaveBeenCalled();

            expect(result).toMatchObject({
                success: true,
                escrowStatus: "refunded",
                refundId: "re_123"
            });
        });

        it("should fail if paymentIntentId is missing", async () => {
            Order.findById.mockResolvedValue({ ...orderMock, paymentIntentId: null });
            await expect(EscrowService.refundEscrow(orderId, adminId))
                .rejects.toThrow("Order missing paymentIntentId");
        });
    });
});
