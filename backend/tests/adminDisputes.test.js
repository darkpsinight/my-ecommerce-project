const { getDisputeDetail } = require('../handlers/adminDisputeHandler');
const { Dispute } = require('../models/dispute');
const { Order } = require('../models/order');
const { AuditLog } = require('../models/auditLog');
const mongoose = require('mongoose');

// Mock Mongoose Models
jest.mock('../models/dispute', () => ({
    Dispute: {
        findOne: jest.fn()
    }
}));
jest.mock('../models/order', () => ({
    Order: {
        findById: jest.fn()
    }
}));
jest.mock('../models/auditLog', () => ({
    AuditLog: {
        find: jest.fn()
    }
}));

// Mock Response Helper
jest.mock('../utils/responseHelpers', () => ({
    sendSuccessResponse: jest.fn((reply, data) => reply.send(data))
}));

describe('Step 25.2 - Admin Dispute Detail Handler', () => {
    let mockReq, mockReply;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {
            params: { disputeId: 'test_dispute_123' }
        };

        mockReply = {
            send: jest.fn()
        };
    });

    it('should return 404 if dispute not found', async () => {
        Dispute.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue(null)
        });

        await getDisputeDetail(mockReq, mockReply);

        expect(Dispute.findOne).toHaveBeenCalledWith(expect.objectContaining({
            disputeId: 'test_dispute_123'
        }));

        const responseData = mockReply.send.mock.calls[0][0];
        expect(responseData.statusCode).toBe(404);
    });

    it('should return dispute details with order snapshot and timeline', async () => {
        // Setup Mocks
        const disputeId = 'test_dispute_123';
        const orderId = 'order_123';

        const mockDispute = {
            _id: 'db_id_123',
            disputeId: 'test_dispute_123',
            orderId: 'order_123',
            paymentIntentId: 'pi_123',
            createdAt: new Date('2023-01-01T10:00:00Z'),
            reason: 'not_received'
        };

        const mockOrder = {
            _id: 'order_123_internal',
            externalId: 'order_pub_10101', // public ID
            totalAmount: 5000,
            currency: 'USD',
            escrowStatus: 'held',
            holdStartAt: new Date('2023-01-01T09:00:00Z'),
            escrowHeldAt: new Date('2023-01-01T09:05:00Z'),
            eligibilityStatus: 'PENDING_MATURITY' // Should be excluded
        };

        const mockLogs = [
            {
                _id: 'log_1',
                createdAt: new Date('2023-01-01T12:00:00Z'),
                action: 'ESCROW_HELD',
                actorId: 'SYSTEM',
                targetType: 'Order',
            }
        ];

        Dispute.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockDispute)
        });

        Order.findById.mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockOrder)
        });

        AuditLog.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockLogs)
        });

        // Execute
        await getDisputeDetail(mockReq, mockReply);

        // Assertions
        const responseWrapper = mockReply.send.mock.calls[0][0]; // get argument of first call
        expect(responseWrapper.statusCode).toBe(200);

        const data = responseWrapper.data;

        // Check Order Snapshot Scope
        expect(data.orderSnapshot).toBeDefined();
        expect(data.orderSnapshot.orderPublicId).toBe('order_pub_10101'); // Public ID check
        expect(data.orderSnapshot.orderId).toBeUndefined(); // Critical Fix 3: No internal ID
        expect(data.orderSnapshot._id).toBeUndefined(); // Contract Fix
        expect(data.orderSnapshot.totalAmount).toBe(5000);
        expect(data.orderSnapshot.escrowStatus).toBe('held');
        expect(data.orderSnapshot.eligibilityStatus).toBeUndefined(); // Strictly excluded

        // Check Dispute Sanitization
        expect(data.dispute._id).toBeUndefined(); // Contract Fix
        expect(data.dispute.externalId).toBeUndefined(); // Contract Fix
        expect(data.dispute.stripeDisputeId).toBeUndefined(); // Critical Fix 2
        expect(data.dispute.paymentIntentId).toBeUndefined(); // Critical Fix 2
        expect(data.dispute.orderId).toBeUndefined(); // Critical Fix 3: No internal ID
        expect(data.dispute.orderPublicId).toBe('order_pub_10101'); // Public ID presence
        expect(data.dispute.disputeId).toBe(disputeId);

        // Check Timeline
        expect(data.timeline).toBeInstanceOf(Array);
        expect(data.timeline.length).toBeGreaterThanOrEqual(2); // Created + AuditLog
        expect(data.timeline[0]._id).toBeUndefined(); // Contract Fix
        expect(data.timeline[0].id).toBeDefined();

        // Check strict empty messages
        expect(data.messages).toEqual([]);

        const creationEvent = data.timeline.find(e => e.action === 'DISPUTE_CREATED');
        expect(creationEvent).toBeDefined();
        expect(creationEvent.actor).toBe('SYSTEM');

        const logEvent = data.timeline.find(e => e.action === 'ESCROW_HELD');
        expect(logEvent).toBeDefined();

        // Verify correct sorting (Newest first)
        expect(data.timeline[0].action).toBe('ESCROW_HELD'); // 12:00
        expect(data.timeline[1].action).toBe('DISPUTE_CREATED'); // 10:00

        // Messages
        expect(data.messages).toEqual([]);
    });

    it('should handle missing order correctly (snapshot null)', async () => {
        const mockDispute = {
            _id: 'db_id_123',
            disputeId: 'test_dispute_123',
            orderId: 'missing_order',
            createdAt: new Date()
        };

        Dispute.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockDispute)
        });

        Order.findById.mockReturnValue({
            lean: jest.fn().mockResolvedValue(null)
        });

        AuditLog.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
        });

        await getDisputeDetail(mockReq, mockReply);

        const data = mockReply.send.mock.calls[0][0].data;
        expect(data.orderSnapshot).toBeNull();
    });
});
