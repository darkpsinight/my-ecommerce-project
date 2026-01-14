const { addDays, addHours, isAfter } = require('date-fns');

/**
 * Service to calculate payout hold windows based on risk factors.
 * 
 * Rules:
 * - Tier C (New): +14 Days
 * - Tier B (Standard): +3 Days
 * - Tier A (Trusted): +24 Hours
 * - High Value (>$500): Minimum 7 Days (Overrides lower tier windows)
 * 
 * Anchor: max(deliveredAt, settledAt)
 */
class HoldCalculator {
    constructor() {
        this.TIER_WINDOWS = {
            'TIER_C': { days: 14 },
            'TIER_B': { days: 3 },
            'TIER_A': { hours: 24 }
        };
        this.HIGH_VALUE_THRESHOLD_CENTS = 50000; // $500.00
        this.HIGH_VALUE_MIN_DAYS = 7;
    }

    /**
     * Calculates the release date for an order.
     * @param {Object} order - The order document
     * @param {Object} sellerProfile - The seller's profile
     * @returns {Date} releaseDate
     */
    calculateHoldReleaseDate(order, sellerProfile) {
        if (!order.deliveredAt) {
            throw new Error("Cannot calculate hold date for undelivered order");
        }

        // 1. Determine Anchor Date
        // Anchor = max(deliveredAt, settledAt "payment_intent.succeeded")
        // Note: For now, we assume processedAt roughly equals settledAt for successful orders.
        // Step 6 Spec: hold_start_at = max(order.delivered_at, payment.settled_at)
        const settledAt = order.processedAt || order.createdAt; // Fallback if processedAt missing
        const anchorDate = new Date(Math.max(new Date(order.deliveredAt), new Date(settledAt)));

        // 2. Determine Base Window from Seller Tier
        const tier = sellerProfile.sellerLevel || 'TIER_C';
        const windowRule = this.TIER_WINDOWS[tier] || this.TIER_WINDOWS['TIER_C'];

        let releaseDate = new Date(anchorDate);

        if (windowRule.days) {
            releaseDate = addDays(releaseDate, windowRule.days);
        } else if (windowRule.hours) {
            releaseDate = addHours(releaseDate, windowRule.hours);
        }

        // 3. Check High Value Override
        const orderValue = order.totalAmount * 100; // Convert to cents if needed, order.totalAmount is usually dollars
        // Verify unit: LedgerService treats order.totalAmount as dollars/units.

        if (orderValue >= this.HIGH_VALUE_THRESHOLD_CENTS) {
            const highValueReleaseDate = addDays(anchorDate, this.HIGH_VALUE_MIN_DAYS);

            // If high value date is further out than tier date, use it.
            if (isAfter(highValueReleaseDate, releaseDate)) {
                releaseDate = highValueReleaseDate;
            }
        }

        return releaseDate;
    }
}

module.exports = new HoldCalculator();
