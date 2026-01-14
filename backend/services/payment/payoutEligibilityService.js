const holdCalculator = require('./holdCalculator');
const { SellerProfile } = require('../../models/sellerProfile');

class PayoutEligibilityService {
    /**
     * Checks if an order is eligible for payout release.
     * This is the L2 Gatekeeper.
     * 
     * @param {Object} order - The Order document
     * @param {Object} sellerProfile - The SellerProfile document
     * @returns {Object} { isEligible: boolean, reason: string, status: string }
     */
    checkEligibility(order, sellerProfile) {
        // 1. Global Safety Check (L1)
        if (sellerProfile.riskStatus !== 'ACTIVE') {
            return {
                isEligible: false,
                reason: `Seller is ${sellerProfile.riskStatus}`,
                status: 'MATURE_HELD' // Mature date might be passed, but blocked globally
            };
        }

        // 2. Order Status Check
        if (order.status !== 'completed' || order.deliveryStatus !== 'delivered') {
            return {
                isEligible: false,
                reason: 'Order not completed/delivered',
                status: 'PENDING_MATURITY'
            };
        }

        // 3. Hold Window Check
        const now = new Date();
        if (!order.releaseExpectedAt) {
            // Should have been set at delivery. If missing, assume ineligible/pending calc.
            return {
                isEligible: false,
                reason: 'Release date not set',
                status: 'PENDING_MATURITY'
            };
        }

        if (now < new Date(order.releaseExpectedAt)) {
            return {
                isEligible: false,
                reason: 'Hold window active',
                status: 'PENDING_MATURITY'
            };
        }

        // 4. Ledger Check (Implicit)
        // If we are here, it's time to release.
        // We do NOT check "Available Balance" here; this service says "You are allowed to move TO available".
        // PayoutService checks Available Balance.

        return {
            isEligible: true,
            reason: 'Eligible for release',
            status: 'ELIGIBLE_FOR_PAYOUT'
        };
    }

    /**
     * Calculates and sets the initial hold dates for an order.
     * Should be called when Order is delivered.
     * @param {Object} order - Populated order
     */
    async setInitialHoldDates(order) {
        const sellerProfile = await SellerProfile.findOne({ userId: order.sellerId });
        if (!sellerProfile) {
            throw new Error(`Seller Profile not found for ${order.sellerId}`);
        }

        const releaseDate = holdCalculator.calculateHoldReleaseDate(order, sellerProfile);

        // Update Order (in memory, caller saves)
        order.releaseExpectedAt = releaseDate;

        // Set Anchor (max(delivered, settled))
        const settledAt = order.processedAt || order.createdAt;
        order.holdStartAt = new Date(Math.max(new Date(order.deliveredAt), new Date(settledAt)));

        order.eligibilityStatus = 'PENDING_MATURITY';
    }
}

module.exports = new PayoutEligibilityService();
