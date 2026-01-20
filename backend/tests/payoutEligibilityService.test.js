const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const payoutEligibilityService = require('../services/payment/payoutEligibilityService');
const ledgerService = require('../services/payment/ledgerService');
const { SellerProfile } = require('../models/sellerProfile');
const { User } = require('../models/user');
const { Payout } = require('../models/payout');
const { Dispute } = require('../models/dispute');
const { configs } = require('../configs');

// Mock Dependencies
jest.mock('../services/payment/ledgerService');
jest.mock('../models/sellerProfile');
jest.mock('../models/user');
jest.mock('../models/payout');
jest.mock('../models/dispute');
jest.mock('../services/payment/stripeAdapter'); // Mocked by service constructor logic usually, but here checking mock injection or prototype

describe('PayoutEligibilityService', () => {
    const mockSellerUid = 'seller_123';
    const mockCurrency = 'USD';
    const mockUserId = new mongoose.Types.ObjectId();

    beforeEach(() => {
        jest.clearAllMocks();
        configs.PAYOUTS_ENABLED = true;

        // Default Mocks
        User.findOne.mockResolvedValue({ _id: mockUserId, uid: mockSellerUid });
        SellerProfile.findOne.mockResolvedValue({ userId: mockUserId, riskStatus: 'ACTIVE' });
        Dispute.countDocuments.mockResolvedValue(0);
        ledgerService.getAvailableBalance.mockResolvedValue(1000); // $10.00
        Payout.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(null) });

        // Mock Stripe Adapter on the service instance
        payoutEligibilityService.paymentAdapter = {
            getPayoutCapabilities: jest.fn().mockResolvedValue({ payoutsEnabled: true, missingCapabilities: [] })
        };
    });

    test('Should return ELIGIBLE when all checks pass', async () => {
        const result = await payoutEligibilityService.checkSellerPayoutEligibility(mockSellerUid, mockCurrency);

        expect(result.eligibility_state).toBe('ELIGIBLE');
        expect(result.payout_allowed).toBe(true);
        expect(result.financials.net_eligible_amount_cents).toBe(1000);
        expect(result.blocking_reasons).toHaveLength(0);
    });

    test('Should match strictly defined JSON contract', async () => {
        const result = await payoutEligibilityService.checkSellerPayoutEligibility(mockSellerUid, mockCurrency);

        const keys = Object.keys(result);
        expect(keys).toEqual(expect.arrayContaining([
            'eligibility_state',
            'payout_allowed',
            'blocking_reasons',
            'next_possible_payout_at',
            'financials'
        ]));
        expect(result.financials).toHaveProperty('gross_available_balance_cents');
        expect(result.financials).toHaveProperty('net_eligible_amount_cents');
    });

    test('Should be INELIGIBLE_SUSPENDED if riskStatus is not ACTIVE', async () => {
        SellerProfile.findOne.mockResolvedValue({ userId: mockUserId, riskStatus: 'SUSPENDED' });

        const result = await payoutEligibilityService.checkSellerPayoutEligibility(mockSellerUid, mockCurrency);

        expect(result.eligibility_state).toBe('INELIGIBLE_SUSPENDED');
        expect(result.payout_allowed).toBe(false);
        expect(result.blocking_reasons).toContain('RISK_STATUS_SUSPENDED');
    });

    test('Should be INELIGIBLE_DISPUTE_LOCK if active disputes exist', async () => {
        Dispute.countDocuments.mockResolvedValue(1);

        const result = await payoutEligibilityService.checkSellerPayoutEligibility(mockSellerUid, mockCurrency);

        expect(result.eligibility_state).toBe('INELIGIBLE_DISPUTE_LOCK');
        expect(result.payout_allowed).toBe(false);
        expect(result.blocking_reasons).toContain('ACTIVE_DISPUTES_FOUND');
    });

    test('Should be INELIGIBLE_COOLDOWN if recent failed payout exists', async () => {
        const lastFailed = {
            status: 'FAILED',
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12) // 12 hours ago
        };
        // Mock chain: findOne().sort() -> lastFailed
        Payout.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(lastFailed) });

        const result = await payoutEligibilityService.checkSellerPayoutEligibility(mockSellerUid, mockCurrency);

        expect(result.eligibility_state).toBe('INELIGIBLE_COOLDOWN');
        expect(result.payout_allowed).toBe(false);
        expect(result.next_possible_payout_at).not.toBeNull();
    });

    test('Should ALLOW payout if failed payout was > 24h ago', async () => {
        const lastFailed = {
            status: 'FAILED',
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 25) // 25 hours ago
        };
        Payout.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(lastFailed) });

        const result = await payoutEligibilityService.checkSellerPayoutEligibility(mockSellerUid, mockCurrency);

        expect(result.eligibility_state).toBe('ELIGIBLE');
        expect(result.payout_allowed).toBe(true);
    });

    test('Should be INELIGIBLE_BALANCE_LOW if balance < threshold', async () => {
        ledgerService.getAvailableBalance.mockResolvedValue(50); // $0.50 (Threshold is 100)

        const result = await payoutEligibilityService.checkSellerPayoutEligibility(mockSellerUid, mockCurrency);

        expect(result.eligibility_state).toBe('INELIGIBLE_BALANCE_LOW');
        expect(result.payout_allowed).toBe(false);
        expect(result.financials.net_eligible_amount_cents).toBe(0);
    });

    test('Should be INELIGIBLE_NEGATIVE_BALANCE if balance is negative', async () => {
        ledgerService.getAvailableBalance.mockResolvedValue(-500);

        const result = await payoutEligibilityService.checkSellerPayoutEligibility(mockSellerUid, mockCurrency);

        expect(result.eligibility_state).toBe('INELIGIBLE_NEGATIVE_BALANCE');
        expect(result.blocking_reasons).toContain('NEGATIVE_LEDGER_BALANCE');
        expect(result.financials.net_eligible_amount_cents).toBe(0);
    });

    test('Should be INELIGIBLE_NO_CAPABILITIES if Stripe payouts disabled', async () => {
        payoutEligibilityService.paymentAdapter.getPayoutCapabilities.mockResolvedValue({
            payoutsEnabled: false,
            missingCapabilities: ['bank_account_missing']
        });

        const result = await payoutEligibilityService.checkSellerPayoutEligibility(mockSellerUid, mockCurrency);

        expect(result.eligibility_state).toBe('INELIGIBLE_NO_CAPABILITIES');
        expect(result.blocking_reasons).toContain('bank_account_missing');
    });

    test('Should be blocked if Global Killswitch is ACTIVE', async () => {
        configs.PAYOUTS_ENABLED = false;

        const result = await payoutEligibilityService.checkSellerPayoutEligibility(mockSellerUid, mockCurrency);

        expect(result.blocking_reasons).toContain('PLATFORM_PAYOUTS_DISABLED');
        expect(result.payout_allowed).toBe(false);
    });
});
