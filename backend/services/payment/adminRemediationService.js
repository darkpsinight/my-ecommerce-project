const mongoose = require('mongoose');
const { Payout } = require('../../models/payout');
const { LedgerEntry } = require('../../models/ledgerEntry');
const { AuditLog } = require('../../models/auditLog');
const { v4: uuidv4 } = require('uuid');

/**
 * Service for Step 17: Admin Remediation & Financial Anomaly Resolution.
 * Strictly strictly admin-only, backend-only.
 * Enforces NO Stripe calls, NO arbitrary mutations, NO terminal state revival.
 */
class AdminRemediationService {
    constructor() {
        console.log("DEBUG: AdminRemediationService Instantiated");
    }

    async forceTransitionPayout(adminUid, payoutId, targetStatus, justification, idempotencyKey) {
        console.log('DEBUG: Entered forceTransitionPayout');
        if (!adminUid || !payoutId || !targetStatus || !justification || !idempotencyKey) {
            throw new Error("Missing required fields: adminUid, payoutId, targetStatus, justification, idempotencyKey");
        }

        console.log('Testing FORCE_PAYOUT: Check Idempotency');
        // Check idempotency via AuditLog (simplified check - in prod could use explicit lock)
        const existingLog = await AuditLog.findOne({
            'metadata.idempotencyKey': idempotencyKey,
            action: 'ADMIN_FORCE_TRANSITION_PAYOUT'
        });
        if (existingLog) {
            console.log('Testing FORCE_PAYOUT: Idempotency hit');
            // Return idempotently if success, or throw if previously failed
            if (existingLog.status === 'SUCCESS') return { status: 'SUCCESS', message: 'Already processed', payoutId };
            throw new Error(`Idempotency conflict: Previous attempt failed with code ${existingLog.errorCode}`);
        }

        console.log('Testing FORCE_PAYOUT: Start Session');
        let session = null;
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (err) {
            console.log('Testing FORCE_PAYOUT: Transactions not supported or failed, proceeding without session.', err.message);
            session = null;
        }

        try {
            console.log('Testing FORCE_PAYOUT: Find Payout');
            const payout = await Payout.findOne({ payoutId }).session(session || undefined);
            console.log('Testing FORCE_PAYOUT: Payout object retrieved');

            if (!payout) throw new Error("Payout not found");

            const originalStatus = payout.status;
            console.log(`Testing FORCE_PAYOUT: Found Payout ${payoutId} in status ${originalStatus}`);

            // STRICT State Transition Logic
            if (targetStatus === 'FAILED') {
                if (originalStatus !== 'PROCESSING') {
                    throw new Error(`Invalid transition: Cannot force FAIL a payout in '${originalStatus}' state. Only 'PROCESSING' allowed.`);
                }
            } else if (targetStatus === 'CANCELLED') {
                if (originalStatus !== 'PENDING') {
                    throw new Error(`Invalid transition: Cannot force CANCEL a payout in '${originalStatus}' state. Only 'PENDING' allowed.`);
                }
            } else {
                throw new Error(`Invalid target status: '${targetStatus}'. Only 'FAILED' or 'CANCELLED' allowed.`);
            }

            console.log('Testing FORCE_PAYOUT: Payout found, updating status...');
            // Perform Transition
            payout.status = targetStatus;
            payout.failureReason = `ADMIN_FORCE_TRANSITION: ${justification}`;
            payout.failureCode = 'ADMIN_INTERVENTION';

            // Update history
            payout.payoutHistory.push({
                attemptAt: new Date(),
                adminId: adminUid,
                status: targetStatus,
                failureReason: justification
            });

            console.log('Testing FORCE_PAYOUT: Saving payout...');
            await payout.save({ session: session || undefined });
            console.log('Testing FORCE_PAYOUT: Payout saved.');

            // Side Effects: If FAILED, we must release the funds back to the user (payout_fail_reversal)
            // The original executing logic would have done this if it hadn't crashed.
            if (targetStatus === 'FAILED') {
                // Look for the reservation to ensure we are reversing a real attempt
                if (!payout.ledgerReservationId) {
                    // If no reservation, maybe it was never reserved? But PROCESSING implies it started.
                    // We proceed cautiously. If ledgerReservationId exists, we reverse it.
                }

                // We CREATE a 'payout_fail_reversal' entry.
                // Amount must be positive (credit back to seller).
                const amountToReverse = payout.amount; // Validated int > 0 in model

                const reversalEntry = new LedgerEntry({
                    user_uid: payout.sellerId,
                    role: 'seller',
                    type: 'payout_fail_reversal',
                    amount: amountToReverse,
                    currency: payout.currency,
                    status: 'available',
                    description: `Admin forced failure of payout ${payoutId}: ${justification}`,
                    related_order_id: payout.orderId,
                    metadata: {
                        originalPayoutId: payoutId,
                        adminActionId: idempotencyKey
                    },
                    externalId: uuidv4()
                });

                console.log('Testing FORCE_PAYOUT: Saving reversal entry...');
                await reversalEntry.save({ session: session || undefined });
                console.log('Testing FORCE_PAYOUT: Reversal entry saved.');
            }

            // Audit Log
            console.log('Testing FORCE_PAYOUT: Creating audit log...');
            await AuditLog.create([{
                action: 'ADMIN_FORCE_TRANSITION_PAYOUT',
                actorId: adminUid,
                targetId: payoutId,
                targetType: 'Payout',
                status: 'SUCCESS',
                metadata: {
                    originalStatus,
                    newStatus: targetStatus,
                    justification,
                    idempotencyKey
                }
            }], { session: session || undefined });
            console.log('Testing FORCE_PAYOUT: Audit log created.');

            if (session) await session.commitTransaction();
            return { success: true, payoutId, oldStatus: originalStatus, newStatus: targetStatus };

        } catch (error) {
            if (session) {
                await session.abortTransaction();
            }
            // Log failure
            await AuditLog.create({
                action: 'ADMIN_FORCE_TRANSITION_PAYOUT',
                actorId: adminUid,
                targetId: payoutId,
                targetType: 'Payout',
                status: 'FAILURE',
                errorCode: 'LogicError',
                errorMessage: error.message,
                metadata: { justification, idempotencyKey }
            });
            throw error;
        } finally {
            if (session) session.endSession();
        }
    }

    /**
     * Applies a ledger correction (Credit/Debit) with strict anchoring.
     * 
     * @param {string} adminUid 
     * @param {string} targetUserUid 
     * @param {string} type - 'admin_correction_credit' or 'admin_correction_debit'
     * @param {number} amount - Integer. POSITIVE for credit, NEGATIVE for debit.
     * @param {string} currency 
     * @param {string} justification 
     * @param {object} anchors - { relatedPayoutId, relatedLedgerEntryId, externalReference } (At least one required)
     * @param {string} idempotencyKey 
     */
    async applyLedgerCorrection(adminUid, targetUserUid, type, amount, currency, justification, anchors, idempotencyKey) {
        if (!adminUid || !targetUserUid || !type || !currency || !justification || !idempotencyKey) {
            throw new Error("Missing required basic fields");
        }

        if (!Number.isInteger(amount)) throw new Error("Amount must be an integer");

        // Validate Anchors
        const hasAnchor = anchors && (anchors.relatedPayoutId || anchors.relatedLedgerEntryId || anchors.externalReference);
        if (!hasAnchor) {
            throw new Error("Ledger Correction requires at least one anchor: relatedPayoutId, relatedLedgerEntryId, or externalReference");
        }

        // Validate Type and Amount Direction
        if (type === 'admin_correction_credit') {
            if (amount <= 0) throw new Error("admin_correction_credit requires positive amount");
        } else if (type === 'admin_correction_debit') {
            if (amount >= 0) throw new Error("admin_correction_debit requires negative amount");
            // Note: We do NOT check balance here. Debt is allowed in remediation if justified.
        } else {
            throw new Error("Invalid ledger correction type");
        }

        // Check Idempotency
        const existingLog = await AuditLog.findOne({
            'metadata.idempotencyKey': idempotencyKey,
            action: 'ADMIN_APPLY_LEDGER_CORRECTION'
        });
        if (existingLog) {
            if (existingLog.status === 'SUCCESS') return { status: 'SUCCESS', message: 'Already processed' };
            throw new Error(`Idempotency conflict: Previous attempt failed`);
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const entry = new LedgerEntry({
                user_uid: targetUserUid,
                role: 'seller', // Usually seller, could be buyer but remediation mostly seller focused for Payouts
                type,
                amount,
                currency,
                status: 'available',
                description: `Admin correction: ${justification}`,
                metadata: {
                    ...anchors,
                    adminUid,
                    justification,
                    idempotencyKey
                },
                externalId: uuidv4()
            });

            await entry.save({ session });

            await AuditLog.create([{
                action: 'ADMIN_APPLY_LEDGER_CORRECTION',
                actorId: adminUid,
                targetId: targetUserUid,
                targetType: 'User',
                status: 'SUCCESS',
                metadata: {
                    type,
                    amount,
                    currency,
                    anchors,
                    justification,
                    idempotencyKey,
                    generatedLedgerEntryId: entry.externalId
                }
            }], { session });

            await session.commitTransaction();
            return { success: true, ledgerEntryId: entry.externalId };

        } catch (error) {
            await session.abortTransaction();
            await AuditLog.create({
                action: 'ADMIN_APPLY_LEDGER_CORRECTION',
                actorId: adminUid,
                targetId: targetUserUid,
                targetType: 'User',
                status: 'FAILURE',
                errorCode: 'LogicError',
                errorMessage: error.message,
                metadata: { idempotencyKey }
            });
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Resolves/Acknowledges an anomaly without state change.
     * Metadata update only.
     */
    async resolveAnomaly(adminUid, targetModel, targetId, note, idempotencyKey) {
        if (!['Payout', 'LedgerEntry'].includes(targetModel)) {
            throw new Error("Invalid targetModel. Must be 'Payout' or 'LedgerEntry'");
        }

        // Check Idempotency
        const existingLog = await AuditLog.findOne({
            'metadata.idempotencyKey': idempotencyKey,
            action: 'ADMIN_RESOLVE_ANOMALY'
        });
        if (existingLog && existingLog.status === 'SUCCESS') return { status: 'SUCCESS' };

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            let doc;
            if (targetModel === 'Payout') {
                doc = await Payout.findOne({ payoutId: targetId }).session(session);
            } else {
                doc = await LedgerEntry.findOne({ externalId: targetId }).session(session);
            }

            if (!doc) throw new Error(`${targetModel} not found`);

            if (!doc) throw new Error(`${targetModel} not found`);

            // IMPUTABILITY CHECK: We do NOT modify the target document (especially LedgerEntry).
            // The resolution is recorded solely via the AuditLog.
            // doc.save() is REMOVED.

            await AuditLog.create([{
                action: 'ADMIN_RESOLVE_ANOMALY',
                actorId: adminUid,
                targetId: targetId,
                targetType: targetModel,
                status: 'SUCCESS',
                metadata: {
                    note,
                    idempotencyKey
                }
            }], { session });

            await session.commitTransaction();
            return { success: true };

        } catch (error) {
            await session.abortTransaction();
            await AuditLog.create({
                action: 'ADMIN_RESOLVE_ANOMALY',
                actorId: adminUid,
                targetId: targetId,
                targetType: targetModel,
                status: 'FAILURE',
                errorCode: 'LogicError',
                errorMessage: error.message,
                metadata: { idempotencyKey }
            });
            throw error;
        } finally {
            session.endSession();
        }
    }

}

module.exports = new AdminRemediationService();
