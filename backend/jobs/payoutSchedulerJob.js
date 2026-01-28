const cron = require('node-cron');
const payoutSchedulerService = require('../services/payout-scheduling/payoutScheduling');
const { assertCronEnabled } = require("../utils/cronGuard");
const { configs } = require('../configs');

/**
 * Sets up the Payout Scheduler Cron Job.
 * Schedule: Configurable via PAYOUT_SCHEDULER_CRON (Default: Daily at 02:00 UTC).
 * 
 * @param {Object} fastify - Fastify instance for logging
 */
const setupPayoutSchedulerJob = (fastify) => {
    const schedule = configs.PAYOUT_SCHEDULER_CRON;

    cron.schedule(schedule, async () => {
        if (!assertCronEnabled("PAYOUT_SCHEDULER")) return;
        fastify.log.info('[PayoutSchedulerJob] Starting daily payout scheduling...');

        try {
            await payoutSchedulerService.runDailySchedule();
            fastify.log.info('[PayoutSchedulerJob] Daily schedule completed successfully.');
        } catch (err) {
            fastify.log.error(`[PayoutSchedulerJob] Critical Error: ${err.message}`);
        }
    }, {
        scheduled: true,
        timezone: "UTC"
    });

    fastify.log.info(`[PayoutSchedulerJob] Job registered: ${schedule} UTC`);
};

module.exports = { setupPayoutSchedulerJob };
