const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { Order } = require("../../models/order");
const { Payout } = require("../../models/payout");
const { LedgerEntry } = require("../../models/ledgerEntry");
const { StripeAccount } = require("../../models/stripeAccount");
const StripeAdapter = require("./stripeAdapter");
const { PaymentError } = require("./paymentErrors");
const ledgerService = require("./ledgerService");

class PayoutService {
    constructor() {
        this.stripeAdapter = new StripeAdapter();
    }

    /**
     * Process a payout for a specific order to the seller.
     * STRICT: One order -> One payout.
     * Implements Step 7: Safe 3-Phase Commit Protocol
     */
    async processOrderPayout(orderId, adminId, options = {}) {
        console.log("[PayoutService] Starting 3-Phase Payout for Order:", orderId);

        // 1. Validation & Order Retrieval
        const order = await Order.findById(orderId);
        if (!order) throw new PaymentError("Order not found", "ORDER_NOT_FOUND", 404);

        if (order.deliveryStatus !== "delivered") {
            throw new PaymentError("Order not delivered", "ORDER_NOT_DELIVERED", 400);
        }

        // 1b. Check Eligibility (Step 6 Gate)
        if (order.eligibilityStatus !== 'ELIGIBLE_FOR_PAYOUT') {
            throw new PaymentError(`Funds not released. Status: ${order.eligibilityStatus}`, "FUNDS_NOT_RELEASED", 400);
        }

        const payoutAmountCents = Math.round(order.totalAmount * 100);

        // 2. Validate Stripe Account
        const sellerStripeAccount = await StripeAccount.findOne({ sellerId: order.sellerId });
        if (!sellerStripeAccount || !sellerStripeAccount.isFullyVerified()) {
            throw new PaymentError("Seller Stripe account invalid", "SELLER_ACCOUNT_INVALID", 400);
        }

        // 3. Idempotency & Active Payout Check
        const existingPayout = await Payout.findOne({
            orderId,
            status: { $in: ['PENDING', 'PROCESSING', 'COMPLETED'] }
        });

        if (existingPayout) {
            if (existingPayout.status === 'COMPLETED') {
                throw new PaymentError("Payout already completed", "PAYMENT_ALREADY_EXISTS", 409);
            }
            if (existingPayout.status === 'PROCESSING') {
                // Check timestamp for stuck processing? Or just block.
                // Step 7 Design: Block duplicate attempts. Reconciliation Job handles stuck ones.
                throw new PaymentError("Payout currently processing", "PAYOUT_PROCESSING", 409);
            }
        }

        // ---------------------------------------------------------
        // PHASE 1: PREPARATION & RESERVATION (The "DEBIT FIRST" Rule)
        // ---------------------------------------------------------

        // A. Solvency Check
        const balance = await ledgerService.getSellerBalance(order.sellerId);
        if (balance.available < payoutAmountCents) {
            throw new PaymentError(
                `Insufficient funds. Available: ${balance.available}, Required: ${payoutAmountCents}`,
                "INSUFFICIENT_FUNDS",
                400
            );
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        let payout;
        let reservationLedgerEntry;

        try {
            // B. Create Payout Record (PROCESSING)
            payout = new Payout({
                adminId,
                sellerId: order.sellerId,
                amount: payoutAmountCents,
                currency: order.currency.toUpperCase(),
                orderId: order._id,
                status: "PROCESSING",
                idempotencyKey: `payout_${order._id}_${Date.now()}`, // Unique key
                reservedAt: new Date(),
                processingAt: new Date(),
                // Metadata from Automation
                scheduleId: options.scheduleId,
                executionSource: options.executionSource || "MANUAL"
            });
            await payout.save({ session });

            // C. Create Ledger Reservation (Debit Available)
            // Type: payout_reservation, Amount: -X
            reservationLedgerEntry = new LedgerEntry({
                user_uid: order.sellerId,
                role: "seller",
                type: "payout_reservation",
                amount: -Math.abs(payoutAmountCents), // DEBIT
                currency: order.currency.toUpperCase(),
                status: "locked", // Semantically held
                related_order_id: order._id,
                description: `Payout Reservation for Order ${order.externalId}`,
                metadata: { payoutId: payout.payoutId },
                externalId: uuidv4()
            });
            await reservationLedgerEntry.save({ session });

            // Link reservation to payout
            payout.ledgerReservationId = reservationLedgerEntry.externalId;
            await payout.save({ session });

            await session.commitTransaction();
            session.endSession();

            console.log(`[PayoutService] Phase 1 Complete. Reserved ${payoutAmountCents} for Payout ${payout.payoutId}`);

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }

        // ---------------------------------------------------------
        // PHASE 2: EXECUTION (External Stripe Call)
        // ---------------------------------------------------------
        let transfer;
        try {
            console.log(`[PayoutService] Executing Stripe Transfer for Payout ${payout.payoutId}`);
            transfer = await this.stripeAdapter.createTransferToSeller(
                order.externalId,
                payoutAmountCents,
                order.sellerId,
                sellerStripeAccount.stripeAccountId,
                {
                    payoutId: payout.payoutId,
                    orderId: order._id.toString(),
                    idempotencyKey: payout.idempotencyKey // Pass explicit key if adapter supports, or just metadata
                }
            );
        } catch (stripeError) {
            console.error(`[PayoutService] Stripe Failure for Payout ${payout.payoutId}:`, stripeError.message);

            // ---------------------------------------------------------
            // FAILURE HANDLING: ROLLBACK
            // ---------------------------------------------------------
            await this.rollbackPayout(payout, stripeError.message);
            throw stripeError;
        }

        // ---------------------------------------------------------
        // PHASE 3: FINALIZATION (Success)
        // ---------------------------------------------------------
        // Note: Ledger is ALREADY debited (Reference: Reservation).
        // We just need to mark Payout as COMPLETED. 
        // We do NOT create another "payout" ledger entry because "payout_reservation" IS the debit.
        // Wait - typically "payout_reservation" vs "payout". 
        // If we want the final record to be type="payout", we could update the entry type?
        // OR we just accept "payout_reservation" as the debit record.
        // Decision: Keep "payout_reservation" as the debit. It's semantically clear.

        payout.status = "COMPLETED";
        payout.stripeTransferId = transfer.transferId;
        payout.completedAt = new Date();
        await payout.save();

        console.log(`[PayoutService] Phase 3 Complete. Payout ${payout.payoutId} COMPLETED.`);
        return payout;
    }

    /**
     * Rolls back a failed payout by creating a compensating credit ledger entry.
     */
    async rollbackPayout(payout, failureReason) {
        console.log(`[PayoutService] Rolling back Payout ${payout.payoutId}`);
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Update Payout Status
            payout.status = "FAILED";
            payout.failureReason = failureReason;
            await payout.save({ session });

            // 2. Compensating Transaction (Credit Available)
            const reversalEntry = new LedgerEntry({
                user_uid: payout.sellerId,
                role: "seller",
                type: "payout_fail_reversal",
                amount: Math.abs(payout.amount), // CREDIT BACK
                currency: payout.currency,
                status: "available",
                related_order_id: payout.orderId,
                description: `Rollback for failed Payout ${payout.payoutId}`,
                metadata: {
                    payoutId: payout.payoutId,
                    reason: failureReason
                },
                externalId: uuidv4()
            });
            await reversalEntry.save({ session });

            await session.commitTransaction();
            session.endSession();
            console.log(`[PayoutService] Rollback Successful. Funds returned to Available.`);
        } catch (err) {
            // Double Fault: Rollback Failed. This is bad but rare.
            await session.abortTransaction();
            session.endSession();
            console.error(`[PayoutService] CRITICAL: Rollback Failed for Payout ${payout.payoutId}`, err);
            // We swallow this error to verify the original Stripe error is returned to user, 
            // but this needs alerting in a real system.
        }
    }
}

module.exports = new PayoutService();
