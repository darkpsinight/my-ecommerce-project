const { startReleaseFundsJob } = require('../jobs/releaseFundsJob');
const { configs } = require('../configs');

console.log("=== Verifying Job Config ===");
console.log(`Expected Schedule: ${configs.RELEASE_FUNDS_CRON}`);

try {
    startReleaseFundsJob();
    console.log("Job bootstrapped successfully.");
} catch (error) {
    console.error("Job failed to bootstrap:", error);
    process.exit(1);
}
process.exit(0);
