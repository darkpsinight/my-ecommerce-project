
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { User } = require('../models/user');
const { Listing } = require('../models/listing');
const { Order } = require('../models/order');
const { LedgerEntry } = require('../models/ledgerEntry');
const { createOrder } = require('../handlers/orderHandlers');
const walletLedgerService = require('../services/payment/walletLedgerService');

// Mock helpers
const mockLog = {
    info: () => { },
    error: console.error,
    warn: console.warn
};

const mockReply = () => {
    let statusCode = 200;
    let responseData = null;
    return {
        code: (code) => { statusCode = code; return mockReply(); },
        send: (data) => { responseData = data; return { statusCode, data }; },
        // Capture the final response
        getResponse: () => responseData,
        getStatusCode: () => statusCode
    };
};

async function runVerification() {
    console.log("🚀 Starting Wallet Checkout Escrow Verification...");

    if (!process.env.MONGO_URI) {
        console.error("❌ MONGO_URI not found");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const session = `verify_escrow_${Date.now()}`;
    const buyerUid = `buyer_${session}`;
    const sellerUid = `seller_${session}`;

    try {
        // ----------------------------------------------------------------
        // 1. SETUP
        // ----------------------------------------------------------------
        console.log("🛠️ Step 1: Setup Buyer, Seller, Listing");

        // Buyer
        const buyer = await User.create({
            uid: buyerUid,
            email: `${buyerUid}@example.com`,
            username: buyerUid,
            name: 'Test Buyer',
            roles: ['buyer']
        });

        // Seller
        const seller = await User.create({
            uid: sellerUid,
            email: `${sellerUid}@example.com`,
            username: sellerUid,
            name: 'Test Seller',
            roles: ['seller']
        });

        // Fund Buyer ($10.00)
        // We use a manually created credit ledger entry to fund them
        await LedgerEntry.create({
            user_uid: buyerUid,
            role: 'buyer',
            type: 'wallet_credit_deposit', // Treat as deposit for test
            amount: 1000,
            currency: 'USD',
            status: 'available',
            description: 'Test Funding'
        });
        console.log(`💰 Funded buyer with $10.00`);

        // Listing ($3.40)
        const validCategoryId = new mongoose.Types.ObjectId();
        const listing = await Listing.create({
            sellerId: sellerUid,
            title: `Escrow Test Item ${session}`,
            description: 'Test Item',
            price: 3.40,
            categoryId: validCategoryId,
            platform: 'Steam',
            region: 'Global',
            codes: [{ code: 'TEST-CODE-123', iv: 'testIV', hashCode: 'hash123', isSold: false, soldStatus: 'active' }]
        });
        console.log(`📦 Created listing: ${listing._id} ($3.40)`);

        // ----------------------------------------------------------------
        // 2. EXECUTE WALLET CHECKOUT
        // ----------------------------------------------------------------
        console.log("💳 Step 2: Executing Wallet Checkout");

        const req = {
            user: { uid: buyerUid, roles: ['buyer'] },
            body: {
                cartItems: [{ listingId: listing.externalId, quantity: 1 }],
                paymentMethod: 'wallet'
            },
            log: mockLog,
            ipAddress: '127.0.0.1'
        };

        const reply = mockReply();
        // Since createOrder calls 'reply' methods, we need to pass our mock object
        // But our mockReply creates a new object on call. We need a stable one.
        const resObj = {
            statusCode: 200,
            data: null,
            code(c) { this.statusCode = c; return this; },
            send(d) { this.data = d; return this; }
        };

        await createOrder(req, resObj);

        if (resObj.statusCode !== 201) {
            throw new Error(`Checkout failed with status ${resObj.statusCode}: ${JSON.stringify(resObj.data)}`);
        }

        const orderId = resObj.data.data.orderId; // External ID
        console.log(`✅ Order created: ${orderId}`);

        // ----------------------------------------------------------------
        // 3. ASSERTIONS
        // ----------------------------------------------------------------
        console.log("🔍 Step 3: Assertions");

        const order = await Order.findOne({ externalId: orderId });
        if (!order) throw new Error("Order not found in DB");

        // A. Buyer Ledger (Debit)
        const buyerDebit = await LedgerEntry.findOne({
            user_uid: buyerUid,
            type: 'wallet_debit_purchase',
            amount: -340
        });

        if (buyerDebit) {
            console.log("✅ PASS: Buyer Ledger Debit found (-340 cents)");
        } else {
            console.error("❌ FAIL: Buyer Ledger Debit NOT found");
            throw new Error("Missing buyer debit");
        }

        // B. Seller Ledger (Escrow Lock)
        // This is where we expect FAILURE if generic Wallet Logic is used directly without Escrow Service
        const sellerEscrow = await LedgerEntry.findOne({
            user_uid: sellerUid,
            type: 'escrow_lock', // or whatever type represents escrow holding
            amount: 340
        });

        // Wait, typical flow: 
        // 1. Buyer Debit (-340) -> goes to Platform (or hold)?
        // 2. Or Seller Credit pending?
        // Let's check what entries EXIST.

        const allEntries = await LedgerEntry.find({
            $or: [{ user_uid: buyerUid }, { user_uid: sellerUid }],
            related_order_external_id: orderId // if linking is by order
        });
        // If not by order external id, filter by timestamp/type

        // Let's look for ANY escrow lock for this seller
        const recentSellerEntries = await LedgerEntry.find({
            user_uid: sellerUid,
            createdAt: { $gt: new Date(Date.now() - 10000) }
        });

        const lockedEntry = recentSellerEntries.find(e => e.type === 'escrow_lock'); // Checking expected type name
        const RELEASED_TYPES = ['escrow_release', 'wallet_credit_sale', 'payout'];
        const releasedEntry = recentSellerEntries.find(e => RELEASED_TYPES.includes(e.type));

        if (lockedEntry) {
            console.log("✅ PASS: Seller Escrow Lock found");
        } else {
            console.error("❌ FAIL: Seller Escrow Lock MISSING");
            console.log("Found Seller Entries:", recentSellerEntries);
        }

        if (releasedEntry) {
            console.error("❌ FAIL: Premature Release Detected!", releasedEntry);
        } else {
            console.log("✅ PASS: No premature release found");
        }

        // C. Order State
        console.log(`Order Status: ${order.status}`);
        console.log(`Escrow Status: ${order.escrowStatus}`);

        let orderEscrowPass = false;
        if (order.escrowStatus === 'held' && !order.escrowReleasedAt) {
            orderEscrowPass = true;
            console.log("✅ PASS: Order Escrow Status is 'held'");
        } else {
            console.error("❌ FAIL: Order Escrow Status is NOT 'held'");
        }

        // Final Verification Summary
        if (buyerDebit && lockedEntry && !releasedEntry && orderEscrowPass) {
            console.log("✅ ESCROW VERIFICATION PASSED");
        } else {
            console.error("❌ ESCROW VERIFICATION FAILED");
            process.exit(1);
        }

    } catch (error) {
        console.error("❌ ERROR:", error);
        process.exit(1);
    } finally {
        // Cleanup
        await User.deleteMany({ uid: { $in: [buyerUid, sellerUid] } });
        await Listing.deleteMany({ sellerId: sellerUid });
        await Order.deleteMany({ buyerId: buyerUid });
        await LedgerEntry.deleteMany({ user_uid: { $in: [buyerUid, sellerUid] } });

        await mongoose.connection.close();
    }
}

runVerification();
