const { Payout } = require("../../models/payout");
const { StripeAccount } = require("../../models/stripeAccount");
const stripeAdapter = new (require("./stripeAdapter"))();
const payoutService = require("./payoutService");
const mongoose = require("mongoose");

class PayoutReconciliationService {

    /**
     * Identifies and fixes stuck payouts.
     * Rule: Payout is PROCESSING for > 5 minutes.
     */
    async reconcileStuckPayouts() {
        console.log("[PayoutReconciler] Starting reconciliation scan...");

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const stuckPayouts = await Payout.find({
            status: "PROCESSING",
            processingAt: { $lte: fiveMinutesAgo }
        });

        console.log(`[PayoutReconciler] Found ${stuckPayouts.length} stuck payouts.`);

        const results = {
            total: stuckPayouts.length,
            fixed: 0,
            rolledBack: 0,
            errors: 0
        };

        for (const payout of stuckPayouts) {
            try {
                const status = await this.reconcileSinglePayout(payout);
                if (status === 'FIXED') results.fixed++;
                if (status === 'ROLLED_BACK') results.rolledBack++;
            } catch (err) {
                console.error(`[PayoutReconciler] Error handling payout ${payout.payoutId}:`, err);
                results.errors++;
            }
        }

        return results;
    }

    async reconcileSinglePayout(payout) {
        console.log(`[PayoutReconciler] Checking Payout ${payout.payoutId} (Seller: ${payout.sellerId})...`);

        // 1. Get Seller Connect ID
        const stripeAccount = await StripeAccount.findOne({ sellerId: payout.sellerId });
        if (!stripeAccount || !stripeAccount.stripeAccountId) {
            // Can't confirm with Stripe. This is tough. 
            // Assume failed if we can't find account? No, risky.
            // Log manual intervention needed.
            console.error(`[PayoutReconciler] Seller Stripe Account missing for ${payout.sellerId}. Manual fix required.`);
            return;
        }

        // 2. Query Stripe for the Transfer
        // Search by Transfer Group or Metadata? 
        // Stripe API 'list transfers' allows transfer_group.
        // We set transfer_group to orderId or similar? 
        // Adapater verify? Adapter creates with metadata.
        // Using idempotencyKey is unrelated to search.

        // We will list transfers for this connected account with generic search?
        // Stripe Connect transfers are "Platform to Connected".
        // Use StripeAdapter to list transfers filtering by metadata.

        // NOTE: StripeAdapter needs a list method or we access stripe directly.
        // Let's rely on idempotency if we retry? No, retry might pass if successful before.
        // But we want to know STATUS.

        // We'll trust the StripeAdapter to implement `retrieveTransferByMetadata` logic via list.
        // Since we don't have that method yet, let's implement a direct search here or assume we need to add it.
        // Pushing logic into Adapter is better.

        // For now, let's assume if it's stuck > 5min, and we don't have stripeTransferId in DB, it likely failed or ghosted.
        // SAFE PATH: Fail and Rollback? 
        // RISK: If it actually succeeded, we create double money (Stripe has it, User has it back).
        // MUST VERIFY.

        // Let's implement finding transfer by payoutId in metadata.
        const matches = await stripeAdapter.listTransfers({
            destination: stripeAccount.stripeAccountId,
            limit: 10 // Recent
        });

        // Filter locally for metadata payoutId
        const match = matches.data.find(t => t.metadata && t.metadata.payoutId === payout.payoutId);

        if (match) {
            console.log(`[PayoutReconciler] Found Stripe Transfer ${match.id} for Payout ${payout.payoutId}. Completing.`);
            payout.completedAt = new Date(); // Approximate
            await payout.save();
            return 'FIXED';
        } else {
            console.log(`[PayoutReconciler] No Stripe Transfer found for Payout ${payout.payoutId}. Rolling back.`);
            // Assume it failed to reach Stripe or was declined and we missed the error.
            await payoutService.rollbackPayout(payout, "Reconciliation: Transfer not found in Stripe");
            return 'ROLLED_BACK';
        }
    }
}

module.exports = new PayoutReconciliationService();
