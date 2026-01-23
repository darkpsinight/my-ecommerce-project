const cron = require("node-cron");
const EscrowMaturityService = require("../../services/escrow-maturity/escrow-maturity");

const { configs } = require("../../configs");

// Job configuration
const JOB_NAME = "ESCROW_MATURITY_MONITOR";

/**
 * Escrow Maturity Job
 * Periodically scans for orders that have matured and transitions them to ELIGIBLE.
 */
const escrowMaturityJob = {
    name: JOB_NAME,
    start: () => {
        const schedule = configs.ESCROW_MATURITY_CRON;
        console.log(`[Job] ${JOB_NAME} started (cron: ${schedule})`);

        cron.schedule(schedule, async () => {
            console.log(`[Job] Running ${JOB_NAME}...`);
            try {
                const stats = await EscrowMaturityService.processMaturityBatch();
                console.log(`[Job] ${JOB_NAME} completed. Scanned: ${stats.scanned}, Processed: ${stats.processed}, Errors: ${stats.errors}`);
            } catch (error) {
                console.error(`[Job] ${JOB_NAME} failed:`, error);
            }
        });
    }
};

module.exports = escrowMaturityJob;
