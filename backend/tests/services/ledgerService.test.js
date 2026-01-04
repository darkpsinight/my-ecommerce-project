const ledgerService = require("../../services/payment/ledgerService");
const { LedgerEntry } = require("../../models/ledgerEntry");
const mongoose = require("mongoose");

// Mock Mongoose models
jest.mock("../../models/ledgerEntry");

// Mock Mongoose Transaction
const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn()
};

jest.mock("mongoose", () => {
    const MockObjectId = jest.fn();
    class MockSchema {
        constructor() {
            this.index = jest.fn();
            this.pre = jest.fn();
            this.post = jest.fn();
            this.methods = {};
            this.statics = {};
        }
        static Types = {
            ObjectId: MockObjectId,
            Mixed: Object
        }
    }
    return {
        startSession: jest.fn(() => Promise.resolve(mockSession)),
        Schema: MockSchema,
        model: jest.fn(() => jest.fn()),
        Types: { ObjectId: MockObjectId }
    };
});

describe("LedgerService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("recordPaymentSuccess", () => {
        it("should create platform and multiple seller entries", async () => {
            const paymentIntent = {
                id: "pi_123",
                amount: 2500, // $25.00
                currency: "usd"
            };

            const orders = [
                {
                    _id: "order_1_id",
                    sellerId: "seller_A",
                    totalAmount: 10.00,
                    currency: "USD",
                    externalId: "ord_1"
                },
                {
                    _id: "order_2_id",
                    sellerId: "seller_B",
                    totalAmount: 15.00,
                    currency: "USD",
                    externalId: "ord_2"
                }
            ];

            // Mock save implementation
            const mockSave = jest.fn().mockResolvedValue(true);
            LedgerEntry.mockImplementation((data) => ({
                ...data,
                save: mockSave
            }));

            const result = await ledgerService.recordPaymentSuccess(paymentIntent, orders);

            expect(mongoose.startSession).toHaveBeenCalled();
            expect(mockSession.startTransaction).toHaveBeenCalled();
            expect(mockSession.commitTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();

            // Should have 3 entries (1 platform + 2 sellers)
            expect(result.length).toBe(3);
            expect(LedgerEntry).toHaveBeenCalledTimes(3);

            // Verify Platform Entry
            expect(LedgerEntry).toHaveBeenCalledWith(expect.objectContaining({
                user_uid: "PLATFORM",
                role: "platform",
                type: "payment_capture",
                amount: 2500,
                status: "settled"
            }));

            // Verify Seller Entries
            expect(LedgerEntry).toHaveBeenCalledWith(expect.objectContaining({
                user_uid: "seller_A",
                role: "seller",
                type: "escrow_lock",
                amount: 1000, // 10.00 * 100
                status: "locked"
            }));

            expect(LedgerEntry).toHaveBeenCalledWith(expect.objectContaining({
                user_uid: "seller_B",
                role: "seller",
                type: "escrow_lock",
                amount: 1500, // 15.00 * 100
                status: "locked"
            }));
        });

        it("should rollback transaction on error", async () => {
            const paymentIntent = { id: "pi_err", amount: 100, currency: "usd" };
            const orders = [{ sellerId: "s1", totalAmount: 1, currency: "USD" }];

            // Mock save failure
            LedgerEntry.mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(new Error("Save failed"))
            }));

            await expect(ledgerService.recordPaymentSuccess(paymentIntent, orders))
                .rejects.toThrow("Save failed");

            expect(mockSession.abortTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
        });
    });

    describe("getSellerBalance", () => {
        it("should aggregate locked and available funds", async () => {
            const sellerId = "seller_123";

            // Mock aggregate result
            LedgerEntry.aggregate = jest.fn().mockResolvedValue([
                { _id: "locked", totalAmount: 5000 },
                { _id: "available", totalAmount: 1000 }
            ]);

            const balance = await ledgerService.getSellerBalance(sellerId);

            expect(LedgerEntry.aggregate).toHaveBeenCalledWith([
                { $match: { user_uid: sellerId, role: "seller" } },
                { $group: { _id: "$status", totalAmount: { $sum: "$amount" } } }
            ]);

            expect(balance).toEqual({
                locked: 5000,
                available: 1000,
                settled: 0,
                total: 6000
            });
        });
    });
});
