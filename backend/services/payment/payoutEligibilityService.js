const holdCalculator = require('./holdCalculator');
const { SellerProfile } = require('../../models/sellerProfile');
const { User } = require('../../models/user');
const { Payout } = require('../../models/payout');
const { Dispute } = require('../../models/dispute');
const ledgerService = require('./ledgerService');
const StripeAdapter = require('./stripeAdapter');
const { configs } = require('../../configs');

/**
 * Step 10: Strict Payout Eligibility
 */
const ELIGIBILITY_STATES = {
    ELIGIBLE: 'ELIGIBLE',
    INELIGIBLE_KYC_PENDING: 'INELIGIBLE_KYC_PENDING',
    INELIGIBLE_SUSPENDED: 'INELIGIBLE_SUSPENDED',
    INELIGIBLE_BALANCE_LOW: 'INELIGIBLE_BALANCE_LOW',
    INELIGIBLE_NEGATIVE_BALANCE: 'INELIGIBLE_NEGATIVE_BALANCE',
    INELIGIBLE_COOLDOWN: 'INELIGIBLE_COOLDOWN',
    INELIGIBLE_DISPUTE_LOCK: 'INELIGIBLE_DISPUTE_LOCK',
    INELIGIBLE_NO_CAPABILITIES: 'INELIGIBLE_NO_CAPABILITIES',
    INELIGIBLE_NO_FUNDS: 'INELIGIBLE_NO_FUNDS'
};

class PayoutEligibilityService {
    constructor() {
        this.paymentAdapter = new StripeAdapter();
        this.MIN_THRESHOLDS = {
            'USD': 100, // $1.00
            'EUR': 100, // €1.00
            'GBP': 100  // £1.00
        };
        this.COOLDOWN_HOURS = 24;
    }

    /**
     * Helper to resolve SellerProfile from UID string.
     */
    async _getSellerProfile(sellerUid) {
        const user = await User.findOne({ uid: sellerUid });
        if (!user) return null;
        return await SellerProfile.findOne({ userId: user._id });
    }

    /**
     * Main Entry Point: Deterministic Payout Eligibility Check
     * Answers: "Is payout allowed right now for this currency?"
     * 
     * @param {string} sellerUid 
     * @param {string} currency (ISO 3-letter)
     * @returns {Promise<Object>} Deterministic Eligibility Result
     */
    async checkSellerPayoutEligibility(sellerUid, orderCurrency) {
        const currency = orderCurrency.toUpperCase();
        const now = new Date();

        // 1. Initialize Response Structure
        const result = {
            eligibility_state: ELIGIBILITY_STATES.INELIGIBLE_SUSPENDED, // Default safe state
            payout_allowed: false,
            blocking_reasons: [],
            next_possible_payout_at: null,
            financials: {
                currency,
                gross_available_balance_cents: 0,
                net_eligible_amount_cents: 0,
                min_threshold_cents: this.MIN_THRESHOLDS[currency] || 100
            }
        };

        // 2. Killswitch Check (Global Config)
        if (configs.PAYOUTS_ENABLED === false) {
            result.blocking_reasons.push('PLATFORM_PAYOUTS_DISABLED');
            // Return immediately, nothing else matters
            return result;
        }

        // 3. Seller Profile Check (Suspension & KYC)
        const sellerProfile = await this._getSellerProfile(sellerUid);
        if (!sellerProfile) {
            result.blocking_reasons.push('SELLER_NOT_FOUND');
            return result;
        }

        if (sellerProfile.riskStatus !== 'ACTIVE') {
            result.eligibility_state = ELIGIBILITY_STATES.INELIGIBLE_SUSPENDED;
            result.blocking_reasons.push(`RISK_STATUS_${sellerProfile.riskStatus}`);
            // Hard Stop
            return result;
        }

        // 4. Dispute Lock (Canonical Source: Dispute Model)
        // Any active dispute blocks ALL payouts.
        const activeDisputes = await Dispute.countDocuments({
            sellerId: sellerUid,
            status: { $in: ['OPEN', 'UNDER_REVIEW', 'WARNING_NEEDS_RESPONSE', 'NEEDS_RESPONSE'] }
        });

        if (activeDisputes > 0) {
            result.eligibility_state = ELIGIBILITY_STATES.INELIGIBLE_DISPUTE_LOCK;
            result.blocking_reasons.push('ACTIVE_DISPUTES_FOUND');
            // Hard Stop
            return result;
        }

        // 5. Compliance Gate (Stripe Capabilities)
        // This is a compliance check, not a financial one.
        try {
            const capabilities = await this.paymentAdapter.getPayoutCapabilities(sellerUid);
            if (!capabilities.payoutsEnabled) {
                result.eligibility_state = ELIGIBILITY_STATES.INELIGIBLE_NO_CAPABILITIES;
                result.blocking_reasons.push(...(capabilities.missingCapabilities || ['STRIPE_RESTRICTED']));
                // Hard Stop
                return result;
            }
        } catch (err) {
            result.eligibility_state = ELIGIBILITY_STATES.INELIGIBLE_NO_CAPABILITIES;
            result.blocking_reasons.push('STRIPE_CONNECTION_ERROR');
            return result;
        }

        // 6. Cooldown Check (Last Failed Payout)
        // 24h cooldown after any failed payout for this currency
        const lastFailedPayout = await Payout.findOne({
            sellerId: sellerUid,
            currency: currency,
            status: 'FAILED'
        }).sort({ updatedAt: -1 });

        if (lastFailedPayout) {
            const cooldownMs = this.COOLDOWN_HOURS * 60 * 60 * 1000;
            const unlockTime = new Date(lastFailedPayout.updatedAt.getTime() + cooldownMs);

            if (now < unlockTime) {
                result.eligibility_state = ELIGIBILITY_STATES.INELIGIBLE_COOLDOWN;
                result.blocking_reasons.push('PAYOUT_FAILURE_COOLDOWN');
                result.next_possible_payout_at = unlockTime.toISOString();
                // Hard Stop
                return result;
            }
        }

        // 7. Financial Check (Strict Ledger Invariants)
        // Get Strict Available Balance (Sum of specific types)
        const availableBalance = await ledgerService.getAvailableBalance(sellerUid, currency);
        result.financials.gross_available_balance_cents = availableBalance;

        // Negative Balance Safety
        if (availableBalance < 0) {
            result.eligibility_state = ELIGIBILITY_STATES.INELIGIBLE_NEGATIVE_BALANCE;
            result.blocking_reasons.push('NEGATIVE_LEDGER_BALANCE');
            result.financials.net_eligible_amount_cents = 0; // Cannot pay out debt
            return result;
        }

        // Zero Funds
        if (availableBalance === 0) {
            result.eligibility_state = ELIGIBILITY_STATES.INELIGIBLE_NO_FUNDS;
            result.blocking_reasons.push('NO_FUNDS_AVAILABLE');
            return result;
        }

        // Threshold Check
        const minThreshold = result.financials.min_threshold_cents;
        if (availableBalance < minThreshold) {
            result.eligibility_state = ELIGIBILITY_STATES.INELIGIBLE_BALANCE_LOW;
            result.blocking_reasons.push('BELOW_MIN_THRESHOLD');
            result.financials.net_eligible_amount_cents = 0; // Not eligible yet
            return result;
        }

        // 8. Success: Eligible
        // Platform keeps 0%, so Net Eligible = Gross Available
        result.eligibility_state = ELIGIBILITY_STATES.ELIGIBLE;
        result.payout_allowed = true;
        result.financials.net_eligible_amount_cents = availableBalance;
        result.next_possible_payout_at = now.toISOString(); // Now

        return result;
    }

    /**
     * Checks if an order is eligible for payout release (Escrow -> Ledger).
     * This is the L2 Gatekeeper for funds BECOMING available.
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
                status: 'INELIGIBLE_SUSPENDED'
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
