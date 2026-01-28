const mongoose = require('mongoose');
const { Dispute } = require('../models/dispute');
const { Order } = require('../models/order');
const { Payout } = require('../models/payout');
const { AuditLog } = require('../models/auditLog');
const adminDisputeHandler = require('../handlers/adminDisputeHandler');

// Load env
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verifyAdminRelease() {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/codesale";
    await mongoose.connect(uri);
    console.log("Connected to MongoDB for Verification");

    try {
        // 1. Find the Test Dispute (most recent one from setup)
        const dispute = await Dispute.findOne({ reason: 'item_not_received', status: 'OPEN' }).sort({ createdAt: -1 });
        if (!dispute) {
            console.error("No test dispute found! Run setup script first.");
            process.exit(1);
        }
        console.log(`Found Test Dispute: ${dispute.disputeId} [${dispute.status}]`);
        console.log(`Linked Order: ${dispute.orderId}`);

        // MOCK STRIPE ADAPTER
        const payoutService = require('../services/payment/payoutService');
        payoutService.stripeAdapter.createTransferToSeller = async () => {
            console.log(">>> [MOCK] Stripe Transfer Successful");
            return { transferId: 'tr_mock_' + Date.now() };
        };

        // PRE-REQ: Ensure Seller Stripe Account is Valid
        const { StripeAccount } = require('../models/stripeAccount');
        await StripeAccount.updateOne(
            { sellerId: dispute.sellerId },
            {
                $set: {
                    status: 'verified',
                    chargesEnabled: true,
                    payoutsEnabled: true,
                    currentlyDue: [],
                    pastDue: []
                }
            }
        );
        console.log("Patched Seller Stripe Account to VERIFIED");

        // 2. Mock Request/Reply
        const req = {
            params: { disputeId: dispute.disputeId },
            body: { justification: "Automated Verification of Admin Bypass" },
            user: { uid: "admin_tester_001" }, // Mock Admin
            log: {
                error: (err) => console.error("Logged Error:", err),
                info: (msg) => console.log("Logged Info:", msg),
                warn: (msg) => console.warn("Logged Warn:", msg)
            }
        };

        const reply = {
            send: (payload) => {
                console.log("\n--- API RESPONSE ---");
                console.log(JSON.stringify(payload, null, 2));
                return payload;
            },
            code: (statusCode) => {
                console.log(`Response Code: ${statusCode}`);
                return reply; // chainable
            }
        };

        // 3. EXECUTE HANDLER
        console.log("\n>>> Executing releaseEscrow Handler...");
        // This is where the magic happens - calling the handler directly
        await adminDisputeHandler.releaseEscrow(req, reply);

        // 4. VERIFY DB STATE
        console.log("\n--- DB STATE VERIFICATION ---");

        // Check Order
        const order = await Order.findById(dispute.orderId);
        console.log(`Order Escrow Status: ${order.escrowStatus} (Expected: released)`);
        console.log(`Order Eligibility: ${order.eligibilityStatus} (Expected: PENDING_MATURITY)`); // Should remain PENDING_MATURITY, but funds released!

        if (order.escrowStatus !== 'released') throw new Error("Order escrow was NOT released!");

        // Check Dispute
        const updatedDispute = await Dispute.findById(dispute._id);
        console.log(`Dispute Status: ${updatedDispute.status} (Expected: CLOSED)`);
        if (updatedDispute.status !== 'CLOSED') throw new Error("Dispute was NOT closed!");

        // Check Payout
        const payout = await Payout.findOne({ orderId: order._id });
        if (payout) {
            console.log(`Payout Created: ${payout.payoutId} [${payout.status}]`);
        } else {
            throw new Error("Payout was NOT created!");
        }

        // Check Audit Log
        const log = await AuditLog.findOne({
            action: 'ADMIN_RELEASE_ESCROW',
            targetId: dispute.disputeId
        });
        if (log) {
            console.log(`Audit Log Found: ${log.action} - ${log.status}`);
        } else {
            throw new Error("Audit Log Missing!");
        }

        console.log("\n✅ VERIFICATION PASSED: Admin successfully bypassed maturity check!");

    } catch (err) {
        console.error("\n❌ VERIFICATION FAILED:", err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyAdminRelease();
