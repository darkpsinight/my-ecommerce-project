const { setupAccountDeletionCron } = require("./accountDeletionCron");
const { setupListingExpirationCron } = require("./listingExpirationCron");
const { setupPayoutSchedulerJob } = require("./payoutSchedulerJob");
const { setupIntegrityMonitor } = require("./financial-integrity/integrity-monitor.job");
const escrowMaturityJob = require("./escrow-maturity/escrow-maturity.job");

/**
 * Initialize all background jobs
 * @param {Object} fastify - Fastify instance
 */
const initializeJobs = (fastify) => {
    fastify.log.info("Initializing background jobs...");

    // Legacy jobs (using function setup pattern)
    setupAccountDeletionCron(fastify);
    setupListingExpirationCron(fastify);
    setupPayoutSchedulerJob(fastify);
    setupIntegrityMonitor(fastify);

    // New Pattern Jobs (Start method)
    escrowMaturityJob.start();

    fastify.log.info("All background jobs initialized.");
};

module.exports = {
    initializeJobs
};
