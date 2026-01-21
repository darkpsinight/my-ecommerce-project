const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const { Payout } = require("../models/payout");
const { LedgerEntry } = require("../models/ledgerEntry");
// Remove connectDB import
const payoutReconciliationService = require("../services/payment/payoutReconciliationService");
const { v4: uuidv4 } = require("uuid");

const TEST_SELLER_ID = "seller_recon_test_001";
const TEST_ORDER_ID = new mongoose.Types.ObjectId();
const TEST_AMOUNT_CENTS = 5000;
const TEST_CURRENCY = "USD";

async function runTest() {
    if (!process.env.MONGO_URI) { console.error("Missing MONGO_URI"); process.exit(1); }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 Starting Payout Reconciliation Verification...");

    try {
        // =========================================================================
        // SETUP: Create a "COMPLETED" Payout (Simulating Step 15 success)
        // =========================================================================
        console.log("\n--- SETUP: Creating Initial State ---");

        // 1. Create Ledger Reservation (The Debit)
        const reservationEntry = await LedgerEntry.create({
            user_uid: TEST_SELLER_ID,
            role: "seller",
            type: "payout_reservation",
            amount: -TEST_AMOUNT_CENTS,
            currency: TEST_CURRENCY,
            status: "locked",
            related_order_id: TEST_ORDER_ID,
            description: "Test Reservation",
            externalId: uuidv4()
        });
        console.log(`✅ Created Ledger Reservation: ${reservationEntry._id}`);

        // 2. Create Payout (COMPLETED)
        const payout = await Payout.create({
            payoutId: `po_test_${uuidv4()}`,
            orderId: TEST_ORDER_ID,
            sellerId: TEST_SELLER_ID,
            adminId: "admin_test",
            amount: TEST_AMOUNT_CENTS,
            currency: TEST_CURRENCY,
            status: "COMPLETED",
            stripeTransferId: `tr_test_${uuidv4()}`,
            ledgerReservationId: reservationEntry._id,
            executionSource: "MANUAL"
        });
        console.log(`✅ Created Initial Payout: ${payout.payoutId} (Status: ${payout.status})`);

        // =========================================================================
        // SCENARIO A: Late Rejection (transfer.updated status=failed)
        // =========================================================================
        console.log("\n--- SCENARIO A: Late Rejection ---");
        const failEventId = `evt_fail_${uuidv4()}`;
        const failEvent = {
            id: failEventId,
            type: "transfer.updated",
            data: {
                object: {
                    id: payout.stripeTransferId,
                    status: "failed",
                    failure_code: "account_closed",
                    failure_message: "The bank account has been closed.",
                    metadata: { payoutId: payout.payoutId }
                }
            }
        };

        await payoutReconciliationService.handleTransferEvent(failEvent);

        // VERIFY A
        const payoutA = await Payout.findById(payout._id);
        const ledgerA = await LedgerEntry.findOne({ "metadata.stripeEventId": failEventId });

        if (payoutA.status === "FAILED" && ledgerA && ledgerA.amount === TEST_AMOUNT_CENTS) {
            console.log("✅ SCENARIO A PASSED: Payout FAILED, Ledger Credited.");
        } else {
            console.error("❌ SCENARIO A FAILED:", { status: payoutA.status, ledger: !!ledgerA });
        }

        // =========================================================================
        // SCENARIO C: Idempotency (Replay A)
        // =========================================================================
        console.log("\n--- SCENARIO C: Idempotency ---");
        await payoutReconciliationService.handleTransferEvent(failEvent);

        const ledgerCountC = await LedgerEntry.countDocuments({ "metadata.stripeEventId": failEventId });
        if (ledgerCountC === 1) {
            console.log("✅ SCENARIO C PASSED: Duplicate event ignored (Ledger count 1).");
        } else {
            console.error("❌ SCENARIO C FAILED: Ledger count is " + ledgerCountC);
        }

        // =========================================================================
        // SCENARIO D: Out-of-Order Webhook (Late PAID after FAILED)
        // =========================================================================
        console.log("\n--- SCENARIO D: Out-of-Order (Late PAID) ---");
        // We send a 'paid' event for the same payout which is now FAILED
        const paidEventId2 = `evt_paid_late_${uuidv4()}`;
        const paidEventLate = {
            id: paidEventId2,
            type: "transfer.updated",
            data: {
                object: {
                    id: payout.stripeTransferId,
                    status: "paid",
                    metadata: { payoutId: payout.payoutId }
                }
            }
        };

        await payoutReconciliationService.handleTransferEvent(paidEventLate);

        const payoutD = await Payout.findById(payout._id);
        if (payoutD.status === "FAILED") {
            console.log("✅ SCENARIO D PASSED: Payout remained FAILED despite late PAID event.");
        } else {
            console.error("❌ SCENARIO D FAILED: Payout changed to " + payoutD.status);
        }

        // =========================================================================
        // SCENARIO B: Explicit Reversal
        // =========================================================================
        console.log("\n--- SCENARIO B: Explicit Reversal ---");
        // Create NEW Payout and Reservation for this test
        const resB = await LedgerEntry.create({
            user_uid: TEST_SELLER_ID,
            role: "seller",
            type: "payout_reservation",
            amount: -TEST_AMOUNT_CENTS,
            currency: TEST_CURRENCY,
            status: "locked",
            related_order_id: new mongoose.Types.ObjectId(), // New order
            description: "Test Reservation B",
            externalId: uuidv4()
        });

        const payoutB = await Payout.create({
            payoutId: `po_test_b_${uuidv4()}`,
            orderId: resB.related_order_id,
            sellerId: TEST_SELLER_ID,
            adminId: "admin_test",
            amount: TEST_AMOUNT_CENTS,
            currency: TEST_CURRENCY,
            status: "COMPLETED",
            stripeTransferId: `tr_test_b_${uuidv4()}`,
            ledgerReservationId: resB._id,
            executionSource: "MANUAL"
        });

        const revEventId = `evt_rev_${uuidv4()}`;
        const revEvent = {
            id: revEventId,
            type: "transfer.reversed",
            data: {
                object: {
                    id: payoutB.stripeTransferId,
                    metadata: { payoutId: payoutB.payoutId }
                }
            }
        };

        await payoutReconciliationService.handleTransferEvent(revEvent);

        const payoutB2 = await Payout.findById(payoutB._id);
        const ledgerB2 = await LedgerEntry.findOne({ "metadata.stripeEventId": revEventId });

        if (payoutB2.status === "REVERSED" && ledgerB2 && ledgerB2.amount === TEST_AMOUNT_CENTS) {
            console.log("✅ SCENARIO B PASSED: Payout REVERSED, Ledger Credited.");
        } else {
            console.error("❌ SCENARIO B FAILED:", { status: payoutB2.status, ledger: !!ledgerB2 });
        }

    } catch (err) {
        console.error("❌ TEST FAILED WITH ERROR:", err);
    } finally {
        console.log("Test finished.");
        process.exit(0);
    }
}

runTest();
