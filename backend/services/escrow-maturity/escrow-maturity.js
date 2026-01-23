const mongoose = require("mongoose");
const { Order } = require("../../models/order");
const { configs } = require("../../configs");

class EscrowMaturityService {
    /**
     * Checks if an order meets all criteria for maturity.
     * STRICTLY checks:
     * 1. Status is 'completed'
     * 2. Delivery status is 'delivered'
     * 3. deliveredAt exists
     * 4. Time since deliveredAt >= ESCROW_MATURITY_SECONDS
     * 
     * @param {Object} order - The order document
     * @returns {boolean}
     */
    static checkMaturityCriteria(order) {
        if (order.status !== "completed") return false;
        if (order.deliveryStatus !== "delivered") return false;
        if (!order.deliveredAt) return false;

        const now = new Date();
        const deliveredAt = new Date(order.deliveredAt);
        const maturitySeconds = configs.ESCROW_MATURITY_SECONDS;

        // Calculate elapsed seconds
        const elapsedSeconds = (now - deliveredAt) / 1000;

        return elapsedSeconds >= maturitySeconds;
    }

    /**
     * Process a batch of potential orders for maturity transition.
     * Transitions PENDING_MATURITY -> ELIGIBLE
     * @returns {Promise<Object>} stats
     */
    static async processMaturityBatch() {
        const stats = {
            scanned: 0,
            eligible: 0,
            processed: 0,
            errors: 0
        };

        try {
            // Find candidate orders
            // Only look for PENDING_MATURITY and delivered status to optimize
            const candidates = await Order.find({
                eligibilityStatus: "PENDING_MATURITY",
                status: "completed",
                deliveryStatus: "delivered",
                deliveredAt: { $exists: true }
            }).limit(100); // Batch limit for safety

            stats.scanned = candidates.length;

            for (const order of candidates) {
                try {
                    if (this.checkMaturityCriteria(order)) {
                        stats.eligible++;

                        // Perform transition
                        order.eligibilityStatus = "ELIGIBLE";
                        order.eligibleAt = new Date();

                        await order.save();

                        console.log(`[EscrowMaturity] Order ${order.externalId} matured. PENDING_MATURITY -> ELIGIBLE`);
                        stats.processed++;
                    }
                } catch (err) {
                    console.error(`[EscrowMaturity] Error processing order ${order._id}:`, err);
                    stats.errors++;
                }
            }
        } catch (error) {
            console.error("[EscrowMaturity] Batch process failed:", error);
            throw error;
        }

        return stats;
    }
}

module.exports = EscrowMaturityService;
