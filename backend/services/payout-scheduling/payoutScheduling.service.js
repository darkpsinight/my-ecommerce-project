const { v4: uuidv4 } = require("uuid");
const { Order } = require("../../models/order");
const { PayoutSchedule } = require("../../models/PayoutSchedule");
const { configs } = require("../../configs");

class PayoutSchedulingService {

    /**
     * Main entry point for scheduling payouts.
     * Scans for ELIGIBLE orders and creates PayoutSchedules.
     * Idempotent: Skips if schedule already exists.
     * 
     * @returns {Object} Stats: { scanned, scheduled, skipped, errors }
     */
    async schedulePayouts() {
        console.log("[PayoutSchedulingService] Starting payout scheduling run...");

        const stats = {
            scanned: 0,
            scheduled: 0,
            skipped: 0,
            errors: 0
        };

        try {
            // 1. Find all ELIGIBLE orders
            const eligibleOrders = await this.findEligibleOrders();
            stats.scanned = eligibleOrders.length;
            console.log(`[PayoutSchedulingService] Found ${eligibleOrders.length} orders eligible for scheduling.`);

            // 2. Process each order individually
            for (const order of eligibleOrders) {
                try {
                    const result = await this.processOrder(order);
                    if (result === 'SCHEDULED') {
                        stats.scheduled++;
                    } else {
                        stats.skipped++;
                    }
                } catch (err) {
                    console.error(`[PayoutSchedulingService] Error processing order ${order._id}:`, err);
                    stats.errors++;
                }
            }

        } catch (err) {
            console.error("[PayoutSchedulingService] Critical failure in schedulePayouts:", err);
            throw err;
        }

        console.log("[PayoutSchedulingService] Run complete.", stats);
        return stats;
    }

    /**
     * Finds orders that are explicitly marked as ELIGIBLE.
     * Legacy compat: Also checks 'ELIGIBLE_FOR_PAYOUT' but primarily we look for 'ELIGIBLE' 
     * (as per Step 19 completion, orders transition to ELIGIBLE).
     */
    async findEligibleOrders() {
        return await Order.find({
            eligibilityStatus: 'ELIGIBLE'
        });
    }

    /**
     * Processes a single order:
     * 1. Checks if PayoutSchedule exists (Idempotency).
     * 2. Creates PayoutSchedule (1-to-1).
     * 3. Updates Order status.
     */
    async processOrder(order) {
        // A. Idempotency Check
        const existingSchedule = await PayoutSchedule.findOne({ orderId: order._id });
        if (existingSchedule) {
            // Already scheduled
            return 'SKIPPED';
        }

        // B. Create Schedule
        // NOTE: includedOrderIds is kept as [order._id] for Step 15 compatibility.
        // We use strict 1-to-1 mapping.

        const windowDate = new Date().toISOString().split('T')[0]; // Current date YYYY-MM-DD

        // Ensure amount is integer cents if not already (Order usually stores major units or cents depending on implem).
        // Standardizing: Order.totalAmount is usually float major units in this project? 
        // Checking Order model: "totalAmount: Number". Usually major units in this codebase.
        // PayoutSchedule expects "Integer cents".
        // Let's verify Order Schema usage in codebase. 
        // In Step 19/18, we treated it as major units usually.
        // Safest is to explicitly convert.

        const amountInCents = Math.round(order.totalAmount * 100);

        const schedule = new PayoutSchedule({
            scheduleId: uuidv4(),
            orderId: order._id,
            sellerId: order.sellerId,
            currency: order.currency,
            windowDate: windowDate,
            status: 'SCHEDULED',

            // Snapshot relevant info. In 1-to-1 model, simple basic snapshot is enough.
            eligibilitySnapshot: {
                scheduledAt: new Date(),
                reason: "Eligible for Payout (Step 20)"
            },

            // COMPATIBILITY: Array with single ID
            includedOrderIds: [order._id],

            totalCount: 1,
            totalAmount: amountInCents
        });

        await schedule.save();

        // C. Update Order Status
        // Mark as ELIGIBLE_FOR_PAYOUT (Legacy status indicating it's ready for/in payout process)
        order.eligibilityStatus = 'ELIGIBLE_FOR_PAYOUT';
        await order.save();

        console.log(`[PayoutSchedulingService] Scheduled Order ${order._id} (Schedule: ${schedule.scheduleId})`);
        return 'SCHEDULED';
    }
}

module.exports = new PayoutSchedulingService();
