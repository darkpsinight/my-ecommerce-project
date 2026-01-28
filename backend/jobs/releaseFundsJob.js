const cron = require('node-cron');
const { configs } = require("../configs");
const { assertCronEnabled } = require("../utils/cronGuard");
const EscrowMaturityService = require('../services/escrow-maturity/escrow-maturity');

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
    console.log(`[Job] Starting RELEASE_FUNDS_JOB with schedule: ${configs.RELEASE_FUNDS_CRON}`);

    // Run per config schedule (e.g. every 5 min)
    cron.schedule(configs.RELEASE_FUNDS_CRON, async () => {
        if (!assertCronEnabled("RELEASE_FUNDS")) return;
        console.log('[ReleaseFundsJob] Starting execution (Delegating to EscrowMaturityService)...');

        try {
            // DEPRECATION NOTICE:
            // This job no longer holds business logic.
            // It strictly delegates to the authoritative EscrowMaturityService.

            // Step 21: Integrated Fund Release
            const stats = await EscrowMaturityService.processMaturityBatch();

            console.log(`[ReleaseFundsJob] Delegation Complete. Stats:`, stats);

        } catch (error) {
            console.error('[ReleaseFundsJob] Delegation failed:', error);
        }

        console.log('[ReleaseFundsJob] Execution finished.');
    });
};



module.exports = { startReleaseFundsJob };
