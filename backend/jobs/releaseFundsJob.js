const cron = require('node-cron');
const { Order } = require('../models/order');
const { SellerProfile } = require('../models/sellerProfile');
const ledgerService = require('../services/payment/ledgerService');
const payoutEligibilityService = require('../services/payment/payoutEligibilityService');
const mongoose = require('mongoose');

/**
 * Job: Release Funds for Mature Orders
 * Frequency: Every 1 hour (0 * * * *)
 * 
 * Logic:
 * 1. Find orders PENDING_MATURITY or MATURE_HELD
 * 2. Check if releaseExpectedAt <= NOW
 * 3. Check Seller Status (Active vs Suspended)
 * 4. Execute Ledger Release (Atomic)
 * 5. Update Order Status (ELIGIBLE_FOR_PAYOUT)
 */
const startReleaseFundsJob = () => {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        console.log('[ReleaseFundsJob] Starting execution...');

        try {
            const now = new Date();

            // 1. Find candidates
            const query = {
                status: 'completed',
                deliveryStatus: 'delivered',
                releaseExpectedAt: { $lte: now },
                eligibilityStatus: { $in: ['PENDING_MATURITY', 'MATURE_HELD'] }
            };

            const candidates = await Order.find(query);
            console.log(`[ReleaseFundsJob] Found ${candidates.length} candidates for release.`);

            for (const order of candidates) {
                try {
                    // 2. Fetch Seller Profile for Risk Check (L1 Gate)
                    const sellerProfile = await SellerProfile.findOne({ userId: order.sellerId });

                    if (!sellerProfile) {
                        console.error(`[ReleaseFundsJob] SellerProfile not found for order ${order._id}`);
                        continue;
                    }

                    // 3. Check Eligibility (L1 + L2)
                    // We re-use the centralized service logic
                    const eligibility = payoutEligibilityService.checkEligibility(order, sellerProfile);

                    if (!eligibility.isEligible) {
                        console.log(`[ReleaseFundsJob] Order ${order._id} ineligible: ${eligibility.reason}`);

                        // If blocked by Seller Status (but time passed), update to MATURE_HELD
                        if (sellerProfile.riskStatus !== 'ACTIVE' && order.eligibilityStatus !== 'MATURE_HELD') {
                            order.eligibilityStatus = 'MATURE_HELD';
                            await order.save();
                        }

                        continue;
                    }

                    // 4. Execute Ledger Release
                    // Amount in cents. Calculate carefully.
                    // Order.totalAmount is usually float dollars. Ledger expects CENTS integer.
                    // We use the exact same logic as escrow_lock creation: Math.round(order.totalAmount * 100)
                    const releaseAmountCents = Math.round(order.totalAmount * 100);

                    const ledgerResult = await ledgerService.releaseFunds(order, releaseAmountCents);

                    // 5. Update Order Status
                    // Only if ledger transaction committed (or was already released)
                    if (ledgerResult.success || (ledgerResult.skipped && ledgerResult.reason === 'Already released')) {
                        order.eligibilityStatus = 'ELIGIBLE_FOR_PAYOUT';
                        order.escrowReleasedAt = new Date();
                        await order.save();
                        console.log(`[ReleaseFundsJob] SUCCESS: Released ${releaseAmountCents} cents for Order ${order._id}`);
                    } else {
                        console.error(`[ReleaseFundsJob] FAILED: Ledger transaction failed for Order ${order._id}`);
                    }

                } catch (err) {
                    console.error(`[ReleaseFundsJob] Error processing order ${order._id}:`, err);
                }
            }

        } catch (error) {
            console.error('[ReleaseFundsJob] Job failed:', error);
        }

        console.log('[ReleaseFundsJob] Execution finished.');
    });
};

module.exports = { startReleaseFundsJob };
