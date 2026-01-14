const holdCalculator = require('./holdCalculator');
const { SellerProfile } = require('../../models/sellerProfile');
const { User } = require('../../models/user');
const ledgerService = require('./ledgerService');
const StripeAdapter = require('./stripeAdapter');
const { configs } = require('../../configs');

class PayoutEligibilityService {
    constructor() {
        this.paymentAdapter = new StripeAdapter();
        this.MIN_THRESHOLDS = {
            'USD': 100, // $1.00
            'EUR': 100, // €1.00
            'GBP': 100  // £1.00
        };
    }

    /**
     * Helper to resolve SellerProfile from UID string.
     */
    async _getSellerProfile(sellerUid) {
        // UID -> User -> SellerProfile
        const user = await User.findOne({ uid: sellerUid });
        if (!user) return null;
        return await SellerProfile.findOne({ userId: user._id });
    }

    /**
     * Step 10: Check if a Seller is Eligible for Payout (Global Level).
     * Answers: "Is payout allowed right now for this currency?"
     * 
     * @param {string} sellerUid 
     * @param {string} currency (ISO 3-letter)
     * @returns {Promise<PayoutEligibilityResult>}
     */
    async checkSellerPayoutEligibility(sellerUid, orderCurrency) {
        const currency = orderCurrency.toUpperCase();
        const now = new Date();

        // 1. Default Response Structure
        const result = {
            isEligible: false,
            state: 'ELIGIBLE', // Tentative
            context: {
                currency,
                availableBalance: 0,
                minThreshold: this.MIN_THRESHOLDS[currency] || 100,
                missingCapabilities: []
            },
            checkedAt: now
        };

        // 2. Killswitch Check
        // Assuming config might have a global killswitch, defaulted to true here
        // if (configs.PAYOUTS_ENABLED === false) return ineligible...

        // 3. Seller Profile Check (Suspension)
        const sellerProfile = await this._getSellerProfile(sellerUid);
        if (!sellerProfile) {
            result.state = 'INELIGIBLE_SUSPENDED'; // Or Not Found
            result.context.missingCapabilities.push('PROFILE_NOT_FOUND');
            return result;
        }

        if (sellerProfile.riskStatus !== 'ACTIVE') {
            result.state = 'INELIGIBLE_SUSPENDED';
            result.context.sellerStatus = sellerProfile.riskStatus;
            return result;
        }

        // 4. Compliance/Capability Check (Abstracted)
        const capabilities = await this.paymentAdapter.getPayoutCapabilities(sellerUid);
        if (!capabilities.payoutsEnabled) {
            result.state = 'INELIGIBLE_COMPLIANCE';
            result.context.missingCapabilities = capabilities.missingCapabilities;
            return result;
        }

        // 5. Ledger Balance Check (Per Currency)
        const availableBalance = await ledgerService.getAvailableBalance(sellerUid, currency);
        result.context.availableBalance = availableBalance;

        if (availableBalance <= 0) {
            result.state = 'INELIGIBLE_NO_FUNDS';
            return result;
        }

        if (availableBalance < result.context.minThreshold) {
            result.state = 'INELIGIBLE_BALANCE';
            return result;
        }

        // 6. All Gates Passed
        result.isEligible = true;
        result.state = 'ELIGIBLE';

        return result;
    }

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
                status: 'INELIGIBLE_SUSPENDED' // Strict Step 10 State
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
        const sellerProfile = await this._getSellerProfile(order.sellerId);
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
