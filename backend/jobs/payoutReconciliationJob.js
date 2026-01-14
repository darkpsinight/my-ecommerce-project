const cron = require('node-cron');
const payoutReconciliationService = require('../services/payment/payoutReconciliationService');

/**
 * Job: Reconcile Stuck Payouts
 * Frequency: Every 10 minutes
 * 
 * Logic:
 * Calls PayoutReconciliationService.reconcileStuckPayouts()
 */
const startPayoutReconciliationJob = () => {
    // Run every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
        console.log('[PayoutReconcilerJob] Starting execution...');
        try {
            const results = await payoutReconciliationService.reconcileStuckPayouts();
            console.log('[PayoutReconcilerJob] Finished.', results);
        } catch (error) {
            console.error('[PayoutReconcilerJob] Job failed:', error);
        }
    });
};

module.exports = { startPayoutReconciliationJob };
