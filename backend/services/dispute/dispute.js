const { v4: uuidv4 } = require('uuid');
const { Order } = require('../../models/order');
const { Dispute } = require('../../models/dispute');

class DisputeService {

    /**
     * Creates a dispute and atomically freezes the order.
     * Idempotent: If dispute exists for this order, returns it.
     * 
     * @param {Object} params
     * @param {string} params.orderId
     * @param {string} params.reason
     * @param {string} [params.stripeDisputeId] - Optional, generated if missing
     * @param {Object} [params.metadata]
     * @returns {Promise<Object>} The created or existing Dispute document
     */
    async createDispute({ orderId, reason, stripeDisputeId, metadata = {} }) {
        // 1. Check for existing dispute first (Idempotency)
        const existingDispute = await Dispute.findOne({ orderId });
        if (existingDispute) {
            console.log(`[DisputeService] Dispute already exists for order ${orderId}. Returning existing.`);
            // Ensure order is frozen just in case (self-healing)
            await Order.updateOne({ _id: orderId }, { $set: { isDisputed: true } });
            return existingDispute;
        }

        // 2. Atomically Freeze Order
        // We use findOneAndUpdate to ensure we have the latest version and set the flag
        const frozenOrder = await Order.findOneAndUpdate(
            { _id: orderId },
            { $set: { isDisputed: true } },
            { new: true }
        );

        if (!frozenOrder) {
            throw new Error(`Order ${orderId} not found.`);
        }

        console.log(`[DisputeService] Order ${orderId} frozen (isDisputed: true). Creating dispute record...`);

        // 3. Create Dispute Record
        // We derive required fields from the Order
        const newDispute = new Dispute({
            disputeId: uuidv4(),
            externalId: uuidv4(), // Explicit GEN
            stripeDisputeId: stripeDisputeId || `DIS_INT_${uuidv4()}`,
            paymentIntentId: frozenOrder.paymentIntentId || `PI_FALLBACK_${frozenOrder.externalId}`, // Handle wallet orders
            orderId: frozenOrder._id,
            sellerId: frozenOrder.sellerId, // UID
            buyerId: frozenOrder.buyerId,   // UID
            amount: Math.round(frozenOrder.totalAmount * 100), // Cents
            currency: frozenOrder.currency,
            status: 'OPEN',
            reason: reason || 'General Dispute',
            metadata: {
                ...metadata,
                frozenAt: new Date(),
                originalOrderStatus: frozenOrder.status,
                originalEligibility: frozenOrder.eligibilityStatus
            }
        });

        await newDispute.save();
        console.log(`[DisputeService] Dispute ${newDispute.disputeId} created for Order ${orderId}`);

        return newDispute;
    }
}

module.exports = new DisputeService();
