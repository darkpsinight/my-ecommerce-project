const { User } = require('../../models/user');
const { SellerProfile } = require('../../models/sellerProfile');
const { Order } = require('../../models/order');
const { PayoutSchedule } = require('../../models/PayoutSchedule');
const payoutEligibilityService = require('./payoutEligibilityService');

class PayoutSchedulerService {
    constructor() {
        this.SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP'];
    }

    /**
     * Main Scheduler Trigger
     * Runs the daily payout scheduling for all active sellers.
     * Should be called by Cron at 02:00 UTC.
     */
    async runDailySchedule() {
        console.log('[PayoutScheduler] Starting Daily Schedule Run...');
        const windowDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // 1. Get all candidates (Active Sellers)
        // Optimization: Find Sellers with ACTIVE risk status.
        // We need their UIDs.
        const activeProfiles = await SellerProfile.find({ riskStatus: 'ACTIVE' });
        const userIds = activeProfiles.map(p => p.userId);

        // Fetch UIDs in batch
        const users = await User.find({ _id: { $in: userIds } }).select('uid');
        const sellerUids = users.map(u => u.uid);

        console.log(`[PayoutScheduler] Found ${sellerUids.length} active sellers to evaluate.`);

        let processedCount = 0;
        let scheduledCount = 0;
        let skippedCount = 0;

        // 2. Process each seller
        for (const sellerUid of sellerUids) {
            for (const currency of this.SUPPORTED_CURRENCIES) {
                try {
                    const result = await this.processSellerForWindow(sellerUid, currency, windowDate);
                    if (result === 'SCHEDULED') scheduledCount++;
                    else if (result === 'SKIPPED') skippedCount++;
                } catch (err) {
                    console.error(`[PayoutScheduler] Error processing seller ${sellerUid} for ${currency}:`, err);
                }
            }
            processedCount++;
        }

        console.log(`[PayoutScheduler] Daily Run Complete. Processed: ${processedCount}, Scheduled: ${scheduledCount}, Skipped: ${skippedCount}`);
    }

    /**
     * Evaluates and Schedules a single seller for a specific window/currency.
     * IDEMPOTENT: Returns immediately if schedule exists.
     */
    async processSellerForWindow(sellerUid, currency, windowDate) {
        // 1. Idempotency Check (Level 1)
        const existingSchedule = await PayoutSchedule.findOne({
            sellerId: sellerUid,
            currency: currency,
            windowDate: windowDate
        });

        if (existingSchedule) {
            // Already processed for this window
            return 'EXISTING';
        }

        // 2. Eligibility Check (Step 10 Logic)
        const eligibility = await payoutEligibilityService.checkSellerPayoutEligibility(sellerUid, currency);

        // 3. IF INELIGIBLE -> Create SKIPPED Schedule
        if (eligibility.eligibility_state !== 'ELIGIBLE') {
            await PayoutSchedule.create({
                sellerId: sellerUid,
                currency: currency,
                windowDate: windowDate,
                status: 'SKIPPED',
                eligibilitySnapshot: eligibility,
                includedOrderIds: [],
                totalCount: 0,
                totalAmount: 0
            });
            return 'SKIPPED';
        }

        // 4. IF ELIGIBLE -> Find Orders
        // Query Criteria:
        // - Seller + Currency
        // - Completed + Delivered
        // - Eligible For Payout
        // - NOT in any other active PayoutSchedule (Level 2 Idempotency)
        //   *Actually, checking ALL PayoutSchedules is expensive. 
        //   *But since we have Window Idempotency, we only need to ensure we don't pick up orders 
        //   *that were included in a PREVIOUS window but not yet executed? 
        //   *No, if they weren't executed, they are still eligible?
        //   *Wait, if a schedule is "SCHEDULED", the orders are "locked" in it.
        //   *So we must exclude IDs present in ANY 'SCHEDULED' PayoutSchedule.

        // Optimization: Get IDs of currently SCHEDULED items to exclude?
        // Or relies on 'eligibilityStatus'? No, 'ELIGIBLE_FOR_PAYOUT' is state.

        // Let's implement the Exclusion Check.
        // Find all orders for this seller that are POTENTIALLY eligible.
        const candidateOrders = await Order.find({
            sellerId: sellerUid,
            currency: currency,
            status: 'completed',
            deliveryStatus: 'delivered',
            eligibilityStatus: 'ELIGIBLE_FOR_PAYOUT'
        }).select('_id totalAmount');

        if (candidateOrders.length === 0) {
            // No orders ready
            await PayoutSchedule.create({
                sellerId: sellerUid,
                currency: currency,
                windowDate: windowDate,
                status: 'SKIPPED',
                eligibilitySnapshot: eligibility, // It was Eligible generally, but no orders
                includedOrderIds: [],
                totalCount: 0,
                totalAmount: 0
            });
            return 'SKIPPED';
        }

        // Filter out orders active in other SCHEDULED/CONSUMED schedules
        // This prevents double-scheduling if the previous schedule hasn't been executed yet.
        // (If it WAS executed, the Order would ideally be marked 'PAID' or similar, but Step 14 says "No Payout mutations")
        // Step 14 says "No execution artifacts".
        // SO: We must check `PayoutSchedule` collection for these order IDs.

        const candidateIds = candidateOrders.map(o => o._id);

        const conflictingSchedules = await PayoutSchedule.find({
            includedOrderIds: { $in: candidateIds },
            status: { $in: ['SCHEDULED', 'CONSUMED'] } // Active states
            // If it was SKIPPED or CANCELLED, we CAN reschedule.
        }).select('includedOrderIds');

        const lockedOrderIds = new Set();
        conflictingSchedules.forEach(sch => {
            sch.includedOrderIds.forEach(id => lockedOrderIds.add(id.toString()));
        });

        // Filter candidates
        const finalOrders = candidateOrders.filter(o => !lockedOrderIds.has(o._id.toString()));

        if (finalOrders.length === 0) {
            await PayoutSchedule.create({
                sellerId: sellerUid,
                currency: currency,
                windowDate: windowDate,
                status: 'SKIPPED', // Eligible but all orders locked
                eligibilitySnapshot: eligibility,
                includedOrderIds: [],
                totalCount: 0,
                totalAmount: 0
            });
            return 'SKIPPED';
        }

        // 5. Create SCHEDULED Record
        const totalAmount = finalOrders.reduce((sum, o) => sum + Math.round(o.totalAmount * 100), 0); // Cents

        await PayoutSchedule.create({
            sellerId: sellerUid,
            currency: currency,
            windowDate: windowDate,
            status: 'SCHEDULED',
            eligibilitySnapshot: eligibility,
            includedOrderIds: finalOrders.map(o => o._id),
            totalCount: finalOrders.length,
            totalAmount: totalAmount
        });

        return 'SCHEDULED';
    }
}

module.exports = new PayoutSchedulerService();
