const cron = require("node-cron");
const { configs } = require("../configs");
const { assertCronEnabled } = require("../utils/cronGuard");
const { User } = require("../models/user");
const { RefreshToken } = require("../models/refreshToken");

/**
 * Sets up a cron job to delete deactivated user accounts
 * @param {FastifyInstance} fastify - The Fastify instance for logging
 * @returns {void}
 */
const setupAccountDeletionCron = (fastify) => {
    // Use configurable cron schedule
    cron.schedule(configs.ACCOUNT_DELETION_CRON, async () => {
        if (!assertCronEnabled("ACCOUNT_DELETION")) return;
        try {
            const now = new Date();
            fastify.log.info({
                msg: "Starting scheduled job: Delete deactivated accounts",
                cronSchedule: configs.ACCOUNT_DELETION_CRON,
                currentTime: now.toISOString(),
                deletionDelay: configs.ACCOUNT_DELETION_DELAY_ONE_MINUTE > 0
                    ? `${configs.ACCOUNT_DELETION_DELAY_ONE_MINUTE} minutes`
                    : `${configs.ACCOUNT_DELETION_DELAY_DAYS} days`
            });

            // Calculate cutoff time: accounts deactivated before this time should be deleted
            const cutoffTime = new Date(Date.now() - configs.ACCOUNT_DELETION_DELAY);

            // Find accounts to be deleted for logging purposes
            const accountsToDelete = await User.find({
                isDeactivated: true,
                deactivatedAt: { $lte: cutoffTime }
            }).select('_id email deactivatedAt');

            if (accountsToDelete.length > 0) {
                fastify.log.info({
                    msg: "Found deactivated accounts to delete",
                    count: accountsToDelete.length,
                    accounts: accountsToDelete.map(acc => ({
                        email: acc.email,
                        deactivatedAt: acc.deactivatedAt,
                        deactivatedFor: Math.round((Date.now() - acc.deactivatedAt) / (1000 * 60)) + ' minutes'
                    })),
                    cutoffTime: cutoffTime.toISOString()
                });

                // Delete all refresh tokens for users being deleted
                const userIds = accountsToDelete.map(user => user._id);
                const refreshTokenResult = await RefreshToken.deleteMany({ user: { $in: userIds } });

                fastify.log.info({
                    msg: "Deleted refresh tokens for deactivated accounts",
                    deletedTokenCount: refreshTokenResult.deletedCount,
                    affectedUserCount: userIds.length
                });
            } else {
                fastify.log.info({
                    msg: "No accounts found to delete",
                    cutoffTime: cutoffTime.toISOString()
                });
            }

            // Perform the deletion
            const result = await User.deleteMany({
                isDeactivated: true,
                deactivatedAt: { $lte: cutoffTime }
            });

            fastify.log.info({
                msg: "Account deletion job completed",
                deletedCount: result.deletedCount,
                cutoffTime: cutoffTime.toISOString(),
                currentTime: new Date().toISOString(),
                deletionDelay: configs.ACCOUNT_DELETION_DELAY_ONE_MINUTE > 0
                    ? `${configs.ACCOUNT_DELETION_DELAY_ONE_MINUTE} minutes`
                    : `${configs.ACCOUNT_DELETION_DELAY_DAYS} days`
            });
        } catch (error) {
            fastify.log.error({
                msg: "Error in account deletion cron job",
                error: error.message,
                stack: error.stack
            });
        }
    });

    // Log initial setup
    fastify.log.info({
        msg: "Account deletion cron job scheduled",
        schedule: configs.ACCOUNT_DELETION_CRON,
        currentTime: new Date().toISOString(),
        deletionDelay: configs.ACCOUNT_DELETION_DELAY_ONE_MINUTE > 0
            ? `${configs.ACCOUNT_DELETION_DELAY_ONE_MINUTE} minutes`
            : `${configs.ACCOUNT_DELETION_DELAY_DAYS} days`
    });
};

module.exports = { setupAccountDeletionCron };
