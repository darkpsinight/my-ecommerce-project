const mongoose = require("mongoose");
const { Order } = require("../models/order");
const { Payout } = require("../models/payout");
const { LedgerEntry } = require("../models/ledgerEntry");
const { StripeAccount } = require("../models/stripeAccount");
const stripeAdapter = require("../services/payment/stripeAdapter");
const payoutEligibilityService = require("../services/payment/payoutEligibilityService");
const ledgerService = require("../services/payment/ledgerService");
const { v4: uuidv4 } = require("uuid");

const executeManualPayout = async (request, reply) => {
    const { orderId, currency } = request.body;

    // 1. Validate Inputs
    if (!orderId || !currency) {
        return reply.code(400).send({ error: "orderId and currency are required" });
    }

    // 2. Lookup Order & Seller
    const order = await Order.findById(orderId);
    if (!order) {
        return reply.code(404).send({ error: "Order not found" });
    }

    // Validate Currency Match
    if (order.currency.toUpperCase() !== currency.toUpperCase()) {
        return reply.code(400).send({ error: `Currency mismatch. Order is ${order.currency}, requested ${currency}` });
    }

    const sellerUid = order.sellerId;

    // 3. Check Existing Payouts (Idempotency & Retry Logic)
    let payoutToReuse = null;
    const existingPayout = await Payout.findOne({ orderId: order._id });

    if (existingPayout) {
        if (['PENDING', 'PROCESSING', 'COMPLETED'].includes(existingPayout.status)) {
            // Active or already successful - BLOCK
            return reply.code(409).send({
                error: `Active or Completed Payout exists: ${existingPayout.payoutId} [${existingPayout.status}]`
            });
        }
        if (existingPayout.status === 'FAILED') {
            // Failed state - ALLOW RETRY (Reuse Record)
            payoutToReuse = existingPayout;
        }
    }

    // 4. Step 10 Eligibility Check (Gatekeeper)
    // Check Seller Level
    const eligibility = await payoutEligibilityService.checkSellerPayoutEligibility(sellerUid, currency);
    if (!eligibility.payout_allowed) {
        return reply.code(400).send({
            error: "Seller is ineligible for payout",
            details: eligibility.blocking_reasons
        });
    }

    // Check Order Level
    if (order.eligibilityStatus !== 'ELIGIBLE_FOR_PAYOUT') {
        return reply.code(400).send({
            error: `Order is not eligible for payout. Status: ${order.eligibilityStatus}`,
            details: order.holdReasonCode
        });
    }

    // 5. Solvency Check (Available >= Check)
    // We check against the strictly defined available balance.
    const availableBalance = await ledgerService.getAvailableBalance(sellerUid, currency);
    const payoutAmountCents = Math.round(order.totalAmount * 100);

    if (availableBalance < payoutAmountCents) {
        return reply.code(400).send({
            error: "Insufficient Funds",
            available: availableBalance,
            required: payoutAmountCents
        });
    }

    // 6. Verify Stripe Account
    const sellerStripeAccount = await StripeAccount.findOne({ sellerId: sellerUid });
    if (!sellerStripeAccount || !sellerStripeAccount.isFullyVerified()) {
        return reply.code(400).send({ error: "Seller Stripe Account not fully verified" });
    }

    const adapter = new stripeAdapter(); // Use instanced adapter
    let payoutId;
    let reservationLedgerId;
    let payout; // Valid across scopes

    // ---------------------------------------------------------
    // PHASE A: RESERVATION (Option A: Amount 0, Lock)
    // ---------------------------------------------------------
    const sessionA = await mongoose.startSession();
    sessionA.startTransaction();
    try {
        const idempotencyKey = `payout_sim_${order._id}_${Date.now()}`;

        if (payoutToReuse) {
            // REUSE Existing Record (Retry)
            payout = payoutToReuse;
            payout.status = "PROCESSING";
            payout.idempotencyKey = idempotencyKey; // New Idempotency Key for new attempt
            payout.processingAt = new Date();
            payout.adminId = request.user.uid; // Update Admin who triggered retry
            // Amount/Currency/OrderId remain same (invariant)
        } else {
            // CREATE New Record
            payout = new Payout({
                adminId: request.user.uid,
                sellerId: sellerUid,
                amount: payoutAmountCents,
                currency: currency.toUpperCase(),
                orderId: order._id,
                status: "PROCESSING",
                idempotencyKey: idempotencyKey,
                reservedAt: new Date(),
                processingAt: new Date()
            });
        }

        await payout.save({ session: sessionA });
        payoutId = payout.payoutId;

        // A2. Ledger Reservation (Zero Value Lock)
        // CHECK REUSE: If Payout already has a reservation, do not duplicate it.
        if (payout.ledgerReservationId) {
            reservationLedgerId = payout.ledgerReservationId;
            // Reservation already exists (locked 0), no new ledger entry needed.
        } else {
            const reservationEntry = new LedgerEntry({
                user_uid: sellerUid,
                role: "seller",
                type: "payout_reservation",
                amount: 0, // OPTION A: ZERO VALUE
                currency: currency.toUpperCase(),
                status: "locked",
                related_order_id: order._id,
                description: `Payout Reservation (Sim) for Order ${order.externalId}`,
                metadata: { payoutId: payout.payoutId },
                externalId: uuidv4()
            });
            await reservationEntry.save({ session: sessionA });
            reservationLedgerId = reservationEntry._id;

            // Link
            payout.ledgerReservationId = reservationEntry._id;
            await payout.save({ session: sessionA });
        }

        await sessionA.commitTransaction();
    } catch (err) {
        await sessionA.abortTransaction();
        sessionA.endSession();
        request.log.error(err, "Phase A (Reservation) Failed");
        return reply.code(500).send({ error: "Phase A (Reservation) Failed", message: err.message });
    } finally {
        sessionA.endSession();
    }

    // ---------------------------------------------------------
    // PHASE B: EXECUTION (Synchronous Stripe Call)
    // ---------------------------------------------------------
    let stripeTransfer;
    let executionError;

    try {
        // Use Payout's Idempotency Key (Generated in Phase A, guaranteed unique per attempt)
        // This ensures Stripe Idempotency is Attempt-Scoped, not Payout-Scoped.
        const attemptScopedIdempotencyKey = `tr_${payout.idempotencyKey}`;

        stripeTransfer = await adapter.createTransferToSeller(
            order.externalId, // EscrowId / Transfer Group
            payoutAmountCents,
            sellerUid,
            sellerStripeAccount.stripeAccountId,
            {
                payoutId: payoutId,
                orderId: order._id.toString(),
                idempotencyKey: attemptScopedIdempotencyKey
            }
        );
    } catch (err) {
        executionError = err;
        request.log.error(err, "Phase B (Execution) Failed");
    }

    // ---------------------------------------------------------
    // PHASE C: FINALIZATION (Success or Failure)
    // ---------------------------------------------------------
    const sessionC = await mongoose.startSession();
    sessionC.startTransaction();
    try {
        const payout = await Payout.findOne({ payoutId }).session(sessionC);

        if (!executionError && stripeTransfer) {
            // --- SUCCESS PATH ---
            // 1. Update Payout
            payout.status = "COMPLETED";
            payout.stripeTransferId = stripeTransfer.transferId;
            payout.completedAt = new Date();
            await payout.save({ session: sessionC });

            // 2. Ledger: Final Debit (-X)
            const finalDebit = new LedgerEntry({
                user_uid: sellerUid,
                role: "seller",
                type: "payout",
                amount: -payoutAmountCents, // DEBIT
                currency: currency.toUpperCase(),
                status: "settled",
                related_order_id: order._id,
                description: `Payout Finalization for Order ${order.externalId}`,
                metadata: { payoutId: payoutId, stripeTransferId: stripeTransfer.transferId },
                externalId: uuidv4()
            });
            await finalDebit.save({ session: sessionC });

            // 3. Ledger: Release Reservation Marker (0)
            const releaseEntry = new LedgerEntry({
                user_uid: sellerUid,
                role: "seller",
                type: "payout_reservation_release",
                amount: 0, // ZERO VALUE
                currency: currency.toUpperCase(),
                status: "settled",
                related_order_id: order._id,
                description: `Release Reservation for Order ${order.externalId}`,
                metadata: { payoutId: payoutId },
                externalId: uuidv4()
            });
            await releaseEntry.save({ session: sessionC });

            await sessionC.commitTransaction();
            return reply.send({
                success: true,
                payoutId: payoutId,
                status: "COMPLETED",
                transferId: stripeTransfer.transferId
            });

        } else {
            // --- FAILURE PATH ---
            // 1. Update Payout
            payout.status = "FAILED";
            payout.failureReason = executionError ? executionError.message : "Unknown Error";
            await payout.save({ session: sessionC });

            // 2. Ledger: Release Reservation Marker (0)
            // No Debit occurred, so we just release the lock.
            // Option A: "Release valid even on failure"
            const releaseEntry = new LedgerEntry({
                user_uid: sellerUid,
                role: "seller",
                type: "payout_reservation_release",
                amount: 0, // ZERO VALUE
                currency: currency.toUpperCase(),
                status: "settled",
                related_order_id: order._id,
                description: `Release Reservation (Failed Payout) for Order ${order.externalId}`,
                metadata: { payoutId: payoutId, failure: true },
                externalId: uuidv4()
            });
            await releaseEntry.save({ session: sessionC });

            await sessionC.commitTransaction();
            return reply.code(500).send({
                success: false,
                payoutId: payoutId,
                status: "FAILED",
                error: executionError ? executionError.message : "Stripe Execution Failed"
            });
        }
    } catch (err) {
        await sessionC.abortTransaction();
        request.log.error(err, "Phase C (Finalization) Critical Failure");
        // This is a "Double Fault" state (Stripe might have worked, but DB failed).
        // Since we wrap Success Ops in Sync Transaction, if DB fails here, 
        // we might have a drift (Transfer exists, but Payout not Succeeded).
        // In manual simulation, we report 500. Reconciliation job handles drift.
        return reply.code(500).send({ error: "Critical Error during Finalization", message: err.message });
    } finally {
        sessionC.endSession();
    }
};

module.exports = { executeManualPayout };
