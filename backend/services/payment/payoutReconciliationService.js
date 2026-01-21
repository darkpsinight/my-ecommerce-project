const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { Payout } = require("../../models/payout");
const { LedgerEntry } = require("../../models/ledgerEntry");
const { Order } = require("../../models/order");
const ledgerService = require("./ledgerService");
const { PaymentError } = require("./paymentErrors");

class PayoutReconciliationService {

    /**
     * Entry point for Stripe Transfer events.
     * Decides action based on event type.
     */
    async handleTransferEvent(event) {
        const transfer = event.data.object;
        const eventType = event.type;

        console.log(`[PayoutReconciliation] Received ${eventType} for Transfer ${transfer.id}`);

        // 1. Check Idempotency (Event Level)
        const isProcessed = await this.isEventProcessed(event.id);
        if (isProcessed) {
            console.log(`[PayoutReconciliation] Skipping duplicate event ${event.id}`);
            return;
        }

        // 2. Dispatch
        if (eventType === 'transfer.updated') {
            if (transfer.status === 'failed') {
                await this.processTransferFailure(transfer, event.id, "TRANSFER_FAILED");
            } else if (transfer.status === 'paid') {
                await this.processTransferSuccess(transfer, event.id);
            }
        } else if (eventType === 'transfer.reversed') {
            await this.processTransferFailure(transfer, event.id, "TRANSFER_REVERSED");
        }
    }

    /**
     * Handles transfer.failed or transfer.reversed.
     * Transitions Payout to FAILED/REVERSED and refunds Ledger.
     */
    async processTransferFailure(transfer, stripeEventId, failureType) {
        const metadata = transfer.metadata || {};
        const payoutId = metadata.payoutId;

        if (!payoutId) {
            console.error(`[PayoutReconciliation] Transfer ${transfer.id} missing payoutId metadata. Cannot reconcile.`);
            return;
        }

        console.log(`[PayoutReconciliation] Processing Failure (${failureType}) for Payout ${payoutId}`);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // A. Lock Payout
            const payout = await Payout.findOne({ payoutId }).session(session);
            if (!payout) {
                console.error(`[PayoutReconciliation] Payout ${payoutId} not found.`);
                await session.abortTransaction();
                return;
            }

            // B. State Guard (Double Reversal Protection)
            if (payout.status === 'FAILED' || payout.status === 'REVERSED') {
                console.log(`[PayoutReconciliation] Payout ${payoutId} is already ${payout.status}. Skipping.`);
                await session.abortTransaction();
                return;
            }

            // C. Transition State
            const previousStatus = payout.status;
            const newStatus = failureType === 'TRANSFER_REVERSED' ? 'REVERSED' : 'FAILED';
            const failureReason = transfer.failure_message || transfer.description || "Stripe Transfer Failed/Reversed";

            payout.status = newStatus;
            payout.failureReason = failureReason;
            payout.failureCode = transfer.failure_code || "unknown_stripe_error";

            // Add to history
            payout.payoutHistory.push({
                attemptAt: new Date(),
                status: newStatus,
                failureReason: `Reconciliation: ${failureReason} (Event: ${stripeEventId})`
            });

            await payout.save({ session });

            // D. Ledger Compensation (The "Double Money" Guard)
            // Guard: Must have a ledgerReservationId
            if (!payout.ledgerReservationId) {
                console.error(`[PayoutReconciliation] CRITICAL: Payout ${payoutId} missing ledgerReservationId. Cannot refund ledger safely. Alerting Admin.`);
                // In a real system, send high-priority alert.
                // We do NOT credit to avoid risk.
                await session.abortTransaction();
                return;
            }

            // Guard: Verify the original reservation exists and is a debit
            const originalDebits = await LedgerEntry.find({
                _id: payout.ledgerReservationId,
                type: 'payout_reservation',
                amount: { $lt: 0 },
                user_uid: payout.sellerId
            }).session(session);

            if (originalDebits.length === 0) {
                console.error(`[PayoutReconciliation] CRITICAL: Payout ${payoutId} references invalid/missing ledger reservation ${payout.ledgerReservationId}. Aborting reversal.`);
                await session.abortTransaction();
                return;
            }

            // Create Compensation Entry (Credit)
            const reversalEntry = new LedgerEntry({
                user_uid: payout.sellerId,
                role: 'seller',
                type: 'payout_fail_reversal',
                amount: Math.abs(payout.amount), // Force Positive
                currency: payout.currency,
                status: 'available',
                related_order_id: payout.orderId,
                description: `Reversal for Payout ${payoutId}: ${failureReason}`,
                metadata: {
                    payoutId: payout.payoutId,
                    stripeEventId: stripeEventId,
                    originalTransferId: transfer.id,
                    reason: failureReason
                },
                externalId: uuidv4()
            });

            await reversalEntry.save({ session });

            await session.commitTransaction();
            console.log(`[PayoutReconciliation] SUCCESS: Payout ${payoutId} transitioned to ${newStatus}. Funds Credited.`);

        } catch (error) {
            console.error(`[PayoutReconciliation] Error processing failure for ${payoutId}:`, error);
            await session.abortTransaction();
            // Do not throw, consumes the event. Retry policy would handle transient DB errors in a queue system,
            // but for webhook handler we log and alert.
        } finally {
            session.endSession();
        }
    }

    /**
     * Handles transfer.updated (status=paid).
     * Mostly for audit reassurance.
     */
    async processTransferSuccess(transfer, stripeEventId) {
        const metadata = transfer.metadata || {};
        const payoutId = metadata.payoutId;

        if (!payoutId) return;

        // Check if we are in a Trap State (FAILED/REVERSED)
        const payout = await Payout.findOne({ payoutId });
        if (!payout) return;

        if (payout.status === 'FAILED' || payout.status === 'REVERSED') {
            console.warn(`[PayoutReconciliation] WARNING: Received PAID event for ${payout.status} Payout ${payoutId}. Ignoring late success.`);
            return;
        }

        // Optional: Could add a history note, but generally we trust the optimism of Step 15.
        if (payout.status !== 'COMPLETED') {
            // It might be PROCESSING. If so, we could mark COMPLETED. 
            // But Step 15 execution usually handles this. 
            // This is a safety net.
            console.log(`[PayoutReconciliation] Payout ${payoutId} confirmed PAID via webhook.`);
            payout.status = 'COMPLETED';
            if (!payout.stripeTransferId) payout.stripeTransferId = transfer.id;
            await payout.save();
        }

        // Mark event as processed in ledger? We only write to ledger on REVERSAL.
        // But we should mark event processed in our idempotent store (which is the WebhookEvent model, handled by Adapter).
        // The LedgerEntry check is for *reversals*.
    }

    /**
     * Checks if a significant ledger action has already been taken for this event.
     */
    async isEventProcessed(stripeEventId) {
        // We assume 'payout_fail_reversal' entries in Ledger are the source of truth for "Action Taken".
        const exists = await LedgerEntry.exists({
            'metadata.stripeEventId': stripeEventId,
            type: 'payout_fail_reversal'
        });
        return !!exists;
    }
}

module.exports = new PayoutReconciliationService();
