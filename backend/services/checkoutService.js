const { v4: uuidv4 } = require("uuid");
const { Order } = require("../models/order");
const { Cart } = require("../models/cart");
const { User } = require("../models/user");
const { StripeAccount } = require("../models/stripeAccount");
const { Listing } = require("../models/listing");
const StripeAdapter = require("./payment/stripeAdapter");

class CheckoutService {
    constructor() {
        this.stripeAdapter = new StripeAdapter();
    }

    /**
     * Process a checkout request for a user's cart
     * Split items by seller, create Stripe PaymentIntents, and create Orders
     */
    async createCheckoutSession(userId) {
        // 1. Get and Validate Cart
        const cart = await Cart.findByUserId(userId).populate({
            path: 'items.listingObjectId',
            select: 'title price discountedPrice imgs status isActive sellerId externalId codes platform region'
        });

        if (!cart || cart.items.length === 0) {
            throw new Error("Cart is empty");
        }

        // Filter invalid items
        const validItems = cart.items.filter(item =>
            item.listingObjectId && item.listingObjectId.status === 'active'
        );

        if (validItems.length !== cart.items.length) {
            // Auto-clean cart? For now just throw
            throw new Error("Cart contains invalid or unavailable items");
        }

        // 2. Group by Seller
        const sellerGroups = {};
        validItems.forEach(item => {
            const sellerId = item.sellerId.toString();
            if (!sellerGroups[sellerId]) {
                sellerGroups[sellerId] = {
                    items: [],
                    totalAmount: 0,
                    currency: 'USD' // Assuming USD allowed for now
                };
            }

            const itemTotal = (item.discountedPrice || item.price) * item.quantity;
            sellerGroups[sellerId].items.push(item);
            sellerGroups[sellerId].totalAmount += itemTotal;
        });

        const checkoutGroupId = uuidv4();
        const clientSecrets = [];
        const orders = [];

        // 3. Calculate Total and Create Single PaymentIntent
        let totalCartAmount = 0;
        let currency = 'USD'; // Default or derived from items

        validItems.forEach(item => {
            totalCartAmount += (item.discountedPrice || item.price) * item.quantity;
        });

        const amountCents = Math.round(totalCartAmount * 100);

        // Single Platform Charge
        const payment = await this.stripeAdapter.createPaymentIntentOnPlatform(
            amountCents,
            currency,
            {
                checkoutGroupId,
                orderType: "marketplace_checkout",
                buyerId: userId,
                // We don't link specific sellerId here because it's a multi-seller cart
                // We rely on the checkoutGroupId or subsequent Orders to track sellers
            }
        );

        // 4. Create Orders for each seller group
        for (const [sellerId, group] of Object.entries(sellerGroups)) {
            // Validate Seller Account exists in our DB (optional but good for consistency)
            // We don't strictly need them to be Stripe verified to TAKE money on the platform (Step 2),
            // but we need them verified to eventually PAY them (Step 3). 
            // Keeping the check to ensure we don't sell for invalid sellers.
            const stripeAccount = await StripeAccount.getBySellerId(sellerId);
            if (!stripeAccount) {
                // Soft error or skip? Requirements say "minimal changes". 
                // If we fail here, the whole checkout fails, which is safer.
                throw new Error(`Seller ${sellerId} account not found`);
            }

            const orderItems = group.items.map(item => ({
                listingId: item.listingObjectId._id,
                title: item.title,
                platform: item.listingObjectId.platform || "Unknown",
                region: item.listingObjectId.region || "Global",
                quantity: item.quantity,
                expirationGroups: item.expirationGroups,
                unitPrice: item.discountedPrice || item.price,
                totalPrice: (item.discountedPrice || item.price) * item.quantity,
                purchasedCodes: []
            }));

            const orderData = {
                buyerId: userId,
                sellerId,
                orderItems,
                totalAmount: group.totalAmount,
                currency: group.currency,
                paymentMethod: "stripe",
                paymentIntentId: payment.paymentIntentId, // Same PI for all orders
                checkoutGroupId,
                status: "pending"
            };

            const order = await Order.createOrder(orderData);
            orders.push(order);
        }

        // 5. Return result
        return {
            success: true,
            checkoutGroupId,
            clientSecrets: [payment.clientSecret], // Single secret
            orders: orders.map(o => o.externalId)
        };
    }

    /**
     * Handle PaymentIntent Success Webhook
     * Check if all orders in group are paid, then deliver
     */
    async handlePaymentSuccess(paymentIntentId) {
        console.log(`CheckoutService: Handling success for PI ${paymentIntentId}`);

        // Find ALL orders associated with this PaymentIntent
        const orders = await Order.find({ paymentIntentId });

        if (!orders || orders.length === 0) {
            console.log("CheckoutService: No orders found for payment intent");
            return;
        }

        console.log(`CheckoutService: Found ${orders.length} orders for payment intent`);

        for (const order of orders) {
            if (order.status === "completed" || order.status === "processing") {
                console.log(`CheckoutService: Order ${order._id} already processed`);
                continue;
            }

            // Mark as paid/processing
            order.status = "processing";
            order.processedAt = new Date();

            // Set Escrow Status clearly
            if (order.escrowStatus !== "held") {
                order.escrowStatus = "held";
                order.escrowHeldAt = new Date();
            }

            await order.save();

            // Deliver immediately since the PaymentIntent is confirmed successful for the whole batch
            await this.deliverOrder(order);
        }
    }

    /**
     * Check if all orders in a group are paid. If so, deliver them all.
     */
    async checkAndDeliverGroup(checkoutGroupId) {
        const groupOrders = await Order.find({ checkoutGroupId });

        // Check if ALL are processing (or completed)
        // We ignore failed/cancelled ones? 
        // Requirement: "If any seller payment fails -> cancel all, deliver nothing"
        // So distinct states: 'pending', 'processing' (paid), 'failed'.

        const allPaid = groupOrders.every(o => o.status === "processing" || o.status === "completed");
        const anyFailed = groupOrders.some(o => o.status === "failed" || o.status === "cancelled");

        if (anyFailed) {
            console.log(`CheckoutService: Group ${checkoutGroupId} has failed payments. Cancelling all.`);
            // TODO: Implement Refund Logic for the paid ones
            // For now, just mark them valid ones as cancelled? 
            // Requirement says "cancel all".
            await this.cancelGroup(checkoutGroupId);
            return;
        }

        if (allPaid) {
            console.log(`CheckoutService: All orders in group ${checkoutGroupId} paid. delivering.`);
            // Deliver all
            for (const ord of groupOrders) {
                if (ord.status !== "completed") {
                    await this.deliverOrder(ord);
                }
            }
        } else {
            console.log(`CheckoutService: Waiting for other payments in group ${checkoutGroupId}`);
        }
    }

    async cancelGroup(checkoutGroupId) {
        await Order.updateMany(
            { checkoutGroupId, status: { $ne: 'cancelled' } },
            { $set: { status: 'cancelled', deliveryStatus: 'failed' } }
        );
    }

    /**
     * Deliver digital codes for an order
     */
    async deliverOrder(order) {
        try {
            console.log(`CheckoutService: Delivering order ${order.externalId}`);
            console.log(`CheckoutService: Order has ${order.orderItems.length} item(s)`);

            const purchasedCodes = [];

            for (const item of order.orderItems) {
                console.log(`CheckoutService: Processing item: ${item.title} (quantity: ${item.quantity})`);

                const listing = await Listing.findById(item.listingId).select("+codes +codes.code +codes.iv");
                if (!listing) throw new Error(`Listing ${item.listingId} not found`);

                console.log(`CheckoutService: Listing found - ${listing.title}, available codes: ${listing.getAvailableCodesCount()}`);

                let codesForThisItem = [];

                // Use expiration groups if present
                if (item.expirationGroups && item.expirationGroups.length > 0) {
                    console.log(`CheckoutService: Using expiration groups: ${JSON.stringify(item.expirationGroups)}`);
                    const selectedCodeObjs = listing.getCodesFromExpirationGroups(item.expirationGroups);

                    // Now we must mark them as sold manually since getCodesFromExpirationGroups is readonly-ish
                    // Actually create a helper to "commit" these codes
                    codesForThisItem = await this.commitCodes(listing, selectedCodeObjs);
                    console.log(`CheckoutService: Committed ${codesForThisItem.length} codes from expiration groups`);

                } else {
                    // Standard valid purchase
                    console.log(`CheckoutService: Purchasing ${item.quantity} codes using standard method`);
                    codesForThisItem = await listing.purchaseCodes(item.quantity);
                    console.log(`CheckoutService: Successfully purchased ${codesForThisItem.length} codes`);
                }

                console.log(`CheckoutService: Codes allocated for item - codeIds: ${codesForThisItem.map(c => c.codeId).join(', ')}`);

                // Debug: Verify codes have iv and code fields
                codesForThisItem.forEach((c, idx) => {
                    console.log(`CheckoutService: Code ${idx}: has code=${!!c.code}, has iv=${!!c.iv}`);
                });

                // Add to item result
                // orderItems is an array in Mongoose. We need to find the specific item in the array to push codes to it?
                // Schema: orderItems: [ { ... purchasedCodes: [] } ]

                // Mongoose subdocument update
                const orderItem = order.orderItems.id(item._id);
                if (orderItem) {
                    console.log(`CheckoutService: Adding ${codesForThisItem.length} codes to order item ${item._id}`);
                    codesForThisItem.forEach(c => orderItem.purchasedCodes.push(c));
                    console.log(`CheckoutService: Order item now has ${orderItem.purchasedCodes.length} total codes`);
                } else {
                    console.error(`CheckoutService: Could not find order item ${item._id} in order`);
                }
            }

            console.log(`CheckoutService: Setting order status to completed/delivered`);
            order.status = "completed";
            order.deliveryStatus = "delivered";
            order.deliveredAt = new Date();
            await order.save();

            console.log(`CheckoutService: Order ${order.externalId} delivered successfully`);

            // Clear cart
            await Cart.createOrUpdate(order.buyerId, 'clear', {});
            console.log(`CheckoutService: Cleared cart for buyer ${order.buyerId}`);

        } catch (error) {
            console.error(`CheckoutService: Delivery failed for order ${order.externalId}`, error);
            console.error(`CheckoutService: Error stack:`, error.stack);
            order.status = "failed"; // Or specifically "delivery_failed"
            order.errorMessage = error.message;
            await order.save();
            console.log(`CheckoutService: Order marked as failed with error: ${error.message}`);
        }
    }

    async commitCodes(listing, codeObjs) {
        const purchased = [];
        const codeIdsToMark = new Set(codeObjs.map(c => c.codeId));

        // Update listing codes in place
        let modified = false;
        listing.codes.forEach(code => {
            if (codeIdsToMark.has(code.codeId) && code.soldStatus === 'active') {
                code.soldStatus = 'sold';
                code.soldAt = new Date();
                purchased.push({
                    codeId: code.codeId,
                    code: code.code,
                    iv: code.iv,
                    expirationDate: code.expirationDate
                });
                modified = true;
            }
        });

        if (modified) await listing.save();
        return purchased;
    }
    async confirmPayment(paymentIntentId) {
        console.log(`CheckoutService: Manual confirmation for PI ${paymentIntentId}`);
        // 1. Verify with Stripe
        const paymentIntent = await this.stripeAdapter.confirmPaymentIntent(paymentIntentId);

        // 2. If Succeeded, Trigger Delivery Logic
        if (paymentIntent.status === "succeeded") {
            await this.handlePaymentSuccess(paymentIntentId);
            return { success: true, status: "succeeded" };
        }

        return { success: false, status: paymentIntent.status };
    }
}

module.exports = new CheckoutService();
