const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { refundEscrow } = require('../handlers/escrowHandlers');
const escrowService = require('../services/payment/escrowService');

// Mock request/reply
const mockReq = {
    params: { orderId: 'scaffold_test_order' },
    user: { uid: 'admin_test' },
    body: { reason: 'Wiring Test' },
    log: { error: console.error }
};
const mockRep = {
    code: (c) => ({ send: (msg) => console.log(`[Response ${c}]`, msg) }),
    send: (msg) => console.log('[Response 200]', msg)
};

async function testWiring() {
    console.log('🧪 Testing wiring...');
    // We expect this to fail deeper in logic (DB connection etc) or succeed if we mock service.
    // But the goal is to pass the "escrowService is not defined" check.

    // We'll monkey-patch escrowService.refundEscrow to confirm it calls it.
    const originalRefund = escrowService.refundEscrow;
    escrowService.refundEscrow = async () => {
        console.log('✅ escrowService.refundEscrow was called!');
        return { success: true };
    };

    try {
        await refundEscrow(mockReq, mockRep);
    } catch (e) {
        console.error('❌ Failed:', e);
    } finally {
        escrowService.refundEscrow = originalRefund;
    }
}

testWiring();
