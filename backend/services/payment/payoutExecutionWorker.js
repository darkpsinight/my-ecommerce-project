const mongoose = require("mongoose");
const { PayoutSchedule } = require("../../models/PayoutSchedule");
const payoutService = require("./payoutService");
const { Payout } = require("../../models/payout"); // For Idempotency Checks directly if needed, though PayoutService handles it.
const { PaymentError } = require("./paymentErrors");

// Configuration
const BATCH_LIMIT = 1; // Process one schedule at a time per worker instance for safety
const EXECUTION_TIMEOUT_MS = 30 * 60 * 1000; // 30 Minutes
const WORKER_ACTOR_ID = "SYSTEM_WORKER";

class PayoutExecutionWorker {
    /**
     * Main entry point for the Cron Job.
     * Executes the "At-Least-Once" payout processing logic.
     */
    async execute() {
        console.log("[PayoutExecutionWorker] Starting execution cycle...");

        try {
            // 1. Try to claim a NEW schedule
            let schedule = await this.claimScheduled();

            // 2. If no new schedule, try to RESUME a stuck/crashed schedule
            if (!schedule) {
                schedule = await this.resumeStuckProcessing();
            }

            if (!schedule) {
                console.log("[PayoutExecutionWorker] No work found. Idle.");
                return;
            }

            console.log(`[PayoutExecutionWorker] Processing Schedule ${schedule.scheduleId} (Seller: ${schedule.sellerId})`);

            // 3. Process the claimed schedule
            await this.processSchedule(schedule);

        } catch (err) {
            console.error("[PayoutExecutionWorker] Critical Error in execution cycle:", err);
            // Non-blocking catch to ensure cron doesn't crash entirely.
        }
    }

    /**
     * ATOMIC CLAIM: SCHEDULED -> PROCESSING
     */
    async claimScheduled() {
        const now = new Date();
        const schedule = await PayoutSchedule.findOneAndUpdate(
            {
                status: "SCHEDULED",
                scheduledAt: { $lte: now }
            },
            {
                $set: {
                    status: "PROCESSING",
                    updatedAt: now // Initialize constraints
                }
            },
            { new: true, sort: { scheduledAt: 1 } } // FIFO
        );

        if (schedule) {
            console.log(`[PayoutExecutionWorker] Claimed NEW Schedule: ${schedule.scheduleId}`);
        }
        return schedule;
    }

    /**
     * ATOMIC RESUME: PROCESSING (stuck) -> PROCESSING (renewed)
     * Reclaims a schedule if it hasn't been updated in EXECUTION_TIMEOUT_MS.
     */
    async resumeStuckProcessing() {
        const timeoutThreshold = new Date(Date.now() - EXECUTION_TIMEOUT_MS);

        const schedule = await PayoutSchedule.findOneAndUpdate(
            {
                status: "PROCESSING",
                updatedAt: { $lt: timeoutThreshold }
            },
            {
                $set: { updatedAt: new Date() } // Renew Lease
            },
            { new: true }
        );

        if (schedule) {
            console.warn(`[PayoutExecutionWorker] RESUMED stuck Schedule: ${schedule.scheduleId} (Last active: ${schedule.updatedAt})`);
        }
        return schedule;
    }

    /**
     * Core Processing Logic
     * Iterates orders, maintains heartbeat, executes payouts.
     */
    async processSchedule(schedule) {
        const orderIds = schedule.includedOrderIds || [];
        console.log(`[PayoutExecutionWorker] Schedule ${schedule.scheduleId} contains ${orderIds.length} orders.`);

        for (const orderId of orderIds) {
            // A. Heartbeat: Maintain Lock for this batch
            await this.sendHeartbeat(schedule._id);

            // B. Execute Payout (Idempotent 3-Phase Commit)
            await this.executeSinglePayout(orderId, schedule);
        }

        // C. Finalize Batch
        await this.finalizeSchedule(schedule._id);
    }

    /**
     * Updates the Schedule's updatedAt to prevent timeout reclaim during long-running batches.
     */
    async sendHeartbeat(scheduleId) {
        await PayoutSchedule.updateOne(
            { _id: scheduleId },
            { $set: { updatedAt: new Date() } }
        );
    }

    /**
     * Wraps PayoutService.processOrderPayout with worker-specific error handling.
     */
    async executeSinglePayout(orderId, schedule) {
        try {
            // Existing Logic from Step 11, now automated.
            await payoutService.processOrderPayout(orderId, WORKER_ACTOR_ID, {
                scheduleId: schedule.scheduleId,
                executionSource: "AUTOMATED"
            });
            console.log(`[PayoutExecutionWorker] Success: Order ${orderId}`);

        } catch (err) {
            // IDEMPOTENCY CHECK
            // If the error confirms the payout already exists, we treat it as Success (Skip)
            const isAlreadyExists =
                err.code === "PAYMENT_ALREADY_EXISTS" ||
                err.code === "PAYOUT_PROCESSING" || // Should trigger manual review if stuck, but safe to skip for auto-worker
                err.message.includes("already completed");

            if (isAlreadyExists) {
                console.log(`[PayoutExecutionWorker] Idempotent Skip: Order ${orderId} already handled.`);
                return;
            }

            // FAILURE HANDLING
            // For other errors (e.g. Stripe Account Invalid, Insufficient Funds), we LOG and CONTINUE.
            // We do NOT stop the batch. We do NOT retry automatically (Manual Fix required).
            console.error(`[PayoutExecutionWorker] Failed to process Order ${orderId}:`, err.message);
        }
    }

    /**
     * Marks schedule as CONSUMED.
     */
    async finalizeSchedule(scheduleId) {
        await PayoutSchedule.updateOne(
            { _id: scheduleId },
            {
                $set: {
                    status: "CONSUMED",
                    updatedAt: new Date()
                }
            }
        );
        console.log(`[PayoutExecutionWorker] Schedule ${scheduleId} marked CONSUMED.`);
    }
}

module.exports = new PayoutExecutionWorker();
