/**
 * Step 21: End-to-End Automated Payout Validation
 * 
 * Verifies the full pipeline:
 * Order (DELIVERED) 
 * -> [Step 19] Escrow Maturity (ELIGIBLE)
 * -> [GAP FILL] Fund Release (Simulated)
 * -> [Step 20] Payout Scheduling (ELIGIBLE_FOR_PAYOUT + Schedule)
 * -> [Step 15] Payout Execution (Payout COMPLETED)
 * -> [Step 16] Reconciliation (Observability)
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Models
const { Order } = require('../models/order');
const { User } = require('../models/user');
const { SellerProfile } = require('../models/sellerProfile');
const { StripeAccount } = require('../models/stripeAccount');
const { LedgerEntry } = require('../models/ledgerEntry');
const { PayoutSchedule } = require('../models/PayoutSchedule');
const { Payout } = require('../models/payout');
const { WebhookEvent } = require('../models/webhookEvent');

// Services
const escrowMaturityService = require('../services/escrow-maturity/escrow-maturity');
const payoutSchedulingService = require('../services/payout-scheduling/payoutScheduling');
const payoutExecutionWorker = require('../services/payment/payoutExecutionWorker');
const payoutReconciliationService = require('../services/payment/payoutReconciliationService');
const ledgerService = require('../services/payment/ledgerService');
const payoutService = require('../services/payment/payoutService');

// Configs
const { configs } = require('../configs');

// Mock Stripe Adapter
const mockStripeAdapter = {
    createTransferToSeller: async (escrowId, amountCents, sellerId, stripeAccountId, metadata) => {
        console.log(`[MOCK Stripe] createTransferToSeller: ${amountCents} cents -> ${stripeAccountId}`);
        return {
            transferId: `tr_mock_${uuidv4()}`,
            amountCents,
            platformFeeCents: 0,
            currency: metadata.currency || 'USD',
            status: 'pending' // Stripe returns pending initially
        };
    },
    // Add other methods if needed by PayoutService or validation
};

// Inject Mock
payoutService.stripeAdapter = mockStripeAdapter;

// Main Verification Logic
async function verifyPipeline() {
    console.log("=== STARTING STEP 21 VERIFICATION ===");

    // Connect DB
    if (mongoose.connection.readyState === 0) {
        const uri = process.env.MONGO_URI || configs.MONGO_URI;
        await mongoose.connect(uri);
        console.log("DB Connected.");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let orderId, sellerId, buyerId, scheduleId, payoutId;

    try {
        // 1. SETUP DATA
        console.log("\n--- 1. SETUP ---");
        // FIX: SellerProfile requires ObjectId for userId, and ReleaseFundsJob queries it using order.sellerId.
        // So we must use ObjectId format, even if passed as string to Order.
        const sellerIdObj = new mongoose.Types.ObjectId();
        const buyerIdObj = new mongoose.Types.ObjectId();

        sellerId = sellerIdObj.toString();
        buyerId = buyerIdObj.toString();

        // Create Seller Profile & Stripe Account
        await new SellerProfile({
            userId: sellerIdObj,
            riskStatus: 'ACTIVE',
            nickname: 'VerifySeller' // Required field
        }).save({ session });

        await new StripeAccount({
            sellerId, // String
            stripeAccountId: `acct_mock_${Date.now()}`,
            status: 'verified',
            chargesEnabled: true,
            payoutsEnabled: true,
            country: 'US',
            currency: 'USD',
            currentlyDue: [],
            pastDue: []
        }).save({ session });

        // Create Order (Simulating DELIVERED 48h ago)
        const order = new Order({
            sellerId, // String (Hex 24 chars)
            buyerId,
            externalId: `ord_21_${Date.now()}`,
            totalAmount: 100.00, // $100.00
            currency: 'USD',
            status: 'completed',
            paymentStatus: 'paid',
            deliveryStatus: 'delivered',
            deliveredAt: new Date(Date.now() - (48 * 60 * 60 * 1000) - 1000), // > 48 hours ago
            orderItems: [{
                listingId: new mongoose.Types.ObjectId(),
                title: 'Test Verification Item',
                platform: 'TestPlatform',
                region: 'Global',
                quantity: 1,
                unitPrice: 100.00,
                totalPrice: 100.00
            }],
            paymentMethod: 'stripe', // Required field
            eligibilityStatus: 'PENDING_MATURITY', // Start state
            createdAt: new Date(Date.now() - (72 * 60 * 60 * 1000))
        });
        await order.save({ session });
        orderId = order._id;
        console.log(`Created Order ${order.externalId} (PENDING_MATURITY)`);

        // Record Initial Payment (Escrow Lock)
        // We simulate Step 3 logic to lock funds
        const paymentIntentMock = { id: `pi_mock_${Date.now()}`, amount: 10000, currency: 'usd' };
        await ledgerService.recordPaymentSuccess(paymentIntentMock, [order]); // Note: this method uses its own transaction/session

        // Commit setup so services can find data
        await session.commitTransaction();
        session.endSession(); // End the setup session

        // Verify Ledger Lock
        const balanceStart = await ledgerService.getSellerBalance(sellerId);
        console.log(`Initial Balance: Available=${balanceStart.available}, Locked=${balanceStart.locked}`);
        if (balanceStart.locked !== 10000) throw new Error("Funds not locked in escrow!");


        // 2. ESCROW MATURITY (Step 19)
        console.log("\n--- 2. ESCROW MATURITY (Step 19) ---");
        const maturityStats = await escrowMaturityService.processMaturityBatch();
        console.log("Maturity Stats:", maturityStats);

        const orderEligible = await Order.findById(orderId);
        console.log(`Order Status after Maturity: ${orderEligible.eligibilityStatus}`);
        if (orderEligible.eligibilityStatus !== 'ELIGIBLE') throw new Error("Order did not transition to ELIGIBLE");


        // 3. AUTOMATED FUND RELEASE (Step 19)
        // Funds should have been released automatically by EscrowMaturityService above.
        // We verify the balance to confirm automation worked.
        console.log("\n--- 3. VERIFY AUTOMATED FUND RELEASE ---");

        const balancereleased = await ledgerService.getSellerBalance(sellerId);
        console.log(`Balance after Maturity: Available=${balancereleased.available}, Locked=${balancereleased.locked}`);

        if (balancereleased.available !== 10000) {
            console.error("DEBUG: Available Balance is " + balancereleased.available + ", expected 10000");
            throw new Error("Funds not available! Automatic release failed.");
        }


        // 4. PAYOUT SCHEDULING (Step 20)
        console.log("\n--- 4. PAYOUT SCHEDULING (Step 20) ---");
        const scheduleStats = await payoutSchedulingService.schedulePayouts();
        console.log("Scheduling Stats:", scheduleStats);

        const schedule = await PayoutSchedule.findOne({ orderId });
        if (!schedule) throw new Error("PayoutSchedule not created!");
        console.log(`PayoutSchedule Created: ${schedule.scheduleId} (Status: ${schedule.status})`);
        scheduleId = schedule._id;

        const orderScheduled = await Order.findById(orderId);
        if (orderScheduled.eligibilityStatus !== 'ELIGIBLE_FOR_PAYOUT') throw new Error("Order status not updated to ELIGIBLE_FOR_PAYOUT");


        // 5. PAYOUT EXECUTION (Step 15)
        console.log("\n--- 5. PAYOUT EXECUTION (Step 15) ---");
        // Worker claims 'SCHEDULED' <= now.
        // Ensure schedule windowDate/scheduledAt matches logic.
        // PayoutSchedule defaults 'scheduledAt' to created time (implied). 
        // Worker query: scheduledAt: { $lte: now }
        // We just created it, so it should be eligible.



        await payoutExecutionWorker.execute();

        // Verify Payout
        const allPayouts = await Payout.find({});
        const payout = allPayouts.find(p => p.orderId.toString() === orderId.toString());

        if (!payout) throw new Error("Payout not created!");
        console.log(`Payout Created: ${payout.payoutId} (Status: ${payout.status})`);
        if (payout.status !== 'COMPLETED') throw new Error(`Payout status is ${payout.status}, expected COMPLETED`);
        payoutId = payout.payoutId;

        // Verify Schedule Consumed
        const scheduleConsumed = await PayoutSchedule.findById(scheduleId);
        if (scheduleConsumed.status !== 'CONSUMED') throw new Error(`PayoutSchedule status is ${scheduleConsumed.status}, expected CONSUMED`);
        console.log(`PayoutSchedule Consumed: ${scheduleConsumed.scheduleId}`);


        // 6. RECONCILLIATION (Step 16)
        console.log("\n--- 6. RECONCILIATION (Step 16) ---");
        // Simulate Stripe Webhook: transfer.updated (paid)
        // This confirms the optimistic success.
        const mockTransferEvent = {
            id: `evt_mock_${Date.now()}`,
            type: 'transfer.updated',
            data: {
                object: {
                    id: payout.stripeTransferId,
                    status: 'paid',
                    metadata: {
                        payoutId: payoutId
                    }
                }
            }
        };

        await payoutReconciliationService.handleTransferEvent(mockTransferEvent);
        console.log("Reconciliation Event Processed.");

        // Verify Persistence (Idempotency)
        const payoutFinal = await Payout.findOne({ orderId });
        if (payoutFinal.status !== 'COMPLETED') throw new Error("Payout status changed unexpectedly!");


        // 7. FINAL ASSERTIONS & LOGGING
        console.log("\n--- 7. FINAL ASSERTIONS ---");
        const balanceFinal = await ledgerService.getSellerBalance(sellerId);
        console.log(`Final Balance: Available=${balanceFinal.available}, Locked=${balanceFinal.locked}`);

        // Available should be 0 (10000 released - 10000 reserved/paid)
        if (balanceFinal.available !== 0) throw new Error(`Final Available Balance is ${balanceFinal.available}, expected 0`);

        console.log("\n=== LIFECYCLE LOG ===");
        console.log("ORDER_CREATED [x]");
        console.log("DELIVERED [x]");
        console.log("PENDING_MATURITY -> ELIGIBLE [x]");
        console.log("FUNDS_RELEASED [x] (Manual intervention)");
        console.log("ELIGIBLE -> ELIGIBLE_FOR_PAYOUT [x]");
        console.log("PAYOUT_SCHEDULED [x]");
        console.log("PAYOUT_PROCESSING -> COMPLETED [x]");
        console.log("RECONCILED [x]");

        console.log("\nSUCCESS: End-to-End Validation Passed.");

    } catch (err) {
        console.error("\nFAILED: Verification Script Error:", err);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

verifyPipeline();
