const { configs } = require("../configs");

/**
 * Asserts that global cron execution is enabled.
 * Default: ENABLED (returns true) unless CRON_ENABLED=0.
 * If disabled, logs a skip message and returns false.
 *
 * @param {string} jobName - The unique name of the job (e.g. "PAYOUT_SCHEDULER")
 * @returns {boolean} - true if cron is enabled, false if skipped
 */
const assertCronEnabled = (jobName) => {
    if (!configs.CRON_ENABLED) {
        console.log(`[CRON:SKIPPED] ${jobName} — CRON_ENABLED=0`);
        return false;
    }
    return true;
};

module.exports = { assertCronEnabled };
