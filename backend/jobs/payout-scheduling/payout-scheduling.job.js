const cron = require('node-cron');
const payoutSchedulingService = require('../../services/payout-scheduling/payoutScheduling');
const { configs } = require('../../configs');

/**
 * Sets up the Payout Scheduling Cron Job (Step 20).
 * Scans ELIGIBLE orders and creates PayoutSchedules.
 * 
 * @param {Object} fastify - Fastify instance for logging
 */
const setupPayoutSchedulingJob = (fastify) => {
    // Config default: "0 2 * * *" (2 AM UTC)
    const schedule = configs.PAYOUT_SCHEDULER_CRON || "0 2 * * *";

    cron.schedule(schedule, async () => {
        fastify.log.info('[PayoutSchedulingJob] Starting payout scheduling cycle...');

        try {
            const stats = await payoutSchedulingService.schedulePayouts();
            fastify.log.info(`[PayoutSchedulingJob] Cycle completed. Stats: ${JSON.stringify(stats)}`);
        } catch (err) {
            fastify.log.error(`[PayoutSchedulingJob] Critical Error: ${err.message}`);
        }
    }, {
        scheduled: true,
        timezone: "UTC"
    });

    fastify.log.info(`[PayoutSchedulingJob] Job registered: ${schedule} UTC`);
};

module.exports = { setupPayoutSchedulingJob };
