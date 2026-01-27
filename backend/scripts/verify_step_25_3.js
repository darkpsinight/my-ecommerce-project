const { v4: uuidv4 } = require("uuid");
require('dotenv').config({ path: 'backend/.env' });
const mongoose = require("mongoose");
const { Dispute } = require("../models/dispute");
const { DisputeMessage } = require("../models/disputeMessage");
const { getDisputeMessages, postDisputeMessage } = require("../handlers/disputeChatHandler");
const { configs } = require("../configs");

// Mock Objects
const mockLogger = {
    info: () => { },
    warn: () => { },
    error: (msg) => console.error("    [Handler Error]", msg)
};

class MockReply {
    constructor() {
        this.statusCode = 200;
        this.payload = null;
    }
    code(c) { this.statusCode = c; return this; }
    status(c) { this.statusCode = c; return this; }
    send(d) { this.payload = d; return this; }
}

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || configs.MONGO_URI;
        if (!mongoUri) throw new Error("Missing MONGO_URI in env");
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("DB Connection Failed", err);
        process.exit(1);
    }
};

async function verifyStep25_3() {
    await connectDB();
    console.log("\n--- STARTING VERIFICATION Step 25.3 (Dispute Chat) ---");

    // DATA SETUP (No Transaction, so handlers can see it)
    const buyerId = `buyer_${uuidv4()}`;
    const sellerId = `seller_${uuidv4()}`;
    const randomId = `random_${uuidv4()}`;
    const adminId = `admin_${uuidv4()}`;
    const disputeId = uuidv4();

    try {
        console.log("1. Setting up Test Dispute...");
        const dispute = new Dispute({
            disputeId: disputeId,
            externalId: uuidv4(),
            stripeDisputeId: `dis_test_${uuidv4()}`,
            paymentIntentId: `pi_test_${uuidv4()}`,
            orderId: new mongoose.Types.ObjectId(),
            buyerId: buyerId,
            sellerId: sellerId,
            amount: 5000,
            currency: 'USD',
            status: 'OPEN',
            reason: 'Test Dispute Chat'
        });
        await dispute.save();

        // HELPER FOR CALLING HANDLER
        const callHandler = async (handler, user, body = {}, params = { disputeId }) => {
            const req = {
                params,
                body,
                user,
                log: mockLogger,
                headers: {}
            };
            const reply = new MockReply();
            await handler(req, reply);
            return reply;
        };

        // SCENARIO 1: Buyer Posts Message
        console.log("2. Verifying Buyer Post...");
        const buyerPost = await callHandler(postDisputeMessage, { uid: buyerId, roles: ['buyer'] }, { messageBody: "Hello Seller" });
        if (buyerPost.statusCode !== 201) {
            console.error("Buyer Post Response:", buyerPost);
            throw new Error("Buyer Post Failed");
        }
        if (buyerPost.payload.data.senderId !== buyerId) throw new Error("Sender ID Mismatch");
        console.log("   ✅ Buyer posted successfully.");

        // SCENARIO 2: Access Control
        console.log("3. Verifying Access Control...");
        const randomPost = await callHandler(postDisputeMessage, { uid: randomId, roles: ['buyer'] }, { messageBody: "Hacker" }); // Random buyer
        if (randomPost.statusCode !== 403) throw new Error(`Random user should get 403, got ${randomPost.statusCode}`);
        console.log("   ✅ Random user blocked (403).");

        const sellerPost = await callHandler(postDisputeMessage, { uid: sellerId, roles: ['seller'] }, { messageBody: "Hello Buyer" });
        if (sellerPost.statusCode !== 201) throw new Error("Seller Post Failed");
        console.log("   ✅ Seller posted successfully.");

        const adminPost = await callHandler(postDisputeMessage, { uid: adminId, roles: ['admin'] }, { messageBody: "Admin here" });
        if (adminPost.statusCode !== 201) throw new Error("Admin Post Failed");
        console.log("   ✅ Admin posted successfully.");

        // SCENARIO 3: Validation & Spoofing
        console.log("4. Verifying Validation & Spoofing...");
        const emptyPost = await callHandler(postDisputeMessage, { uid: buyerId, roles: ['buyer'] }, { messageBody: "   " });
        if (emptyPost.statusCode !== 400) throw new Error("Empty body should fail");

        const spoofPost = await callHandler(postDisputeMessage, { uid: buyerId, roles: ['buyer'] }, {
            messageBody: "Spoofing ID",
            senderId: "fake_id" // Attempt to inject different ID
        });
        if (spoofPost.payload.data.senderId !== buyerId) throw new Error("Sender ID spoofing succeeded!");
        console.log("   ✅ Validation & Anti-Spoofing passed.");

        // SCENARIO 4: Ordering & Retrieval
        console.log("5. Verifying Retrieval Order...");
        const getResult = await callHandler(getDisputeMessages, { uid: buyerId, roles: ['buyer'] });
        const messages = getResult.payload.data;

        if (messages.length !== 4) throw new Error(`Expected 4 messages, got ${messages.length}`);

        const bodies = messages.map(m => m.messageBody);
        const expected = ["Hello Seller", "Hello Buyer", "Admin here", "Spoofing ID"];

        // Simple check
        if (JSON.stringify(bodies) !== JSON.stringify(expected)) {
            throw new Error(`Order mismatch. Got: ${JSON.stringify(bodies)}`);
        }

        console.log("   ✅ Messages retrieved in correct order.");

        // SCENARIO 5: Status Agnostic
        console.log("6. Verifying Status Agnostic...");
        dispute.status = 'CLOSED';
        await dispute.save();

        const closedPost = await callHandler(postDisputeMessage, { uid: buyerId, roles: ['buyer'] }, { messageBody: "Post in closed" });
        if (closedPost.statusCode !== 201) throw new Error("Should allow posting in CLOSED state");
        console.log("   ✅ Posted in CLOSED state successfully.");

        console.log("\n--- VERIFICATION SUCCESSFUL ---");

    } catch (err) {
        console.error("\n❌ VERIFICATION FAILED", err);
        process.exit(1);
    } finally {
        // CLEANUP
        console.log("Cleaning up...");
        await Dispute.deleteOne({ disputeId: disputeId });
        await DisputeMessage.deleteMany({ disputeId: disputeId });
        await mongoose.disconnect();
    }
}

verifyStep25_3();
