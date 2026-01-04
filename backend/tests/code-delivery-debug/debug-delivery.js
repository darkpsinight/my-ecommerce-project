const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

const orderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model("Order", orderSchema);

async function checkDeliveryIssue() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // Get the most recent processing order
        const processingOrder = await Order.findOne({ status: "processing" })
            .sort({ createdAt: -1 })
            .lean();

        if (!processingOrder) {
            console.log("No processing orders found");
            return;
        }

        console.log("\n=== Processing Order Details ===");
        console.log(`External ID: ${processingOrder.externalId}`);
        console.log(`Status: ${processingOrder.status}`);
        console.log(`Delivery Status: ${processingOrder.deliveryStatus}`);
        console.log(`Checkout Group ID: ${processingOrder.checkoutGroupId || "NONE"}`);
        console.log(`Created: ${processingOrder.createdAt}`);
        console.log(`Processed: ${processingOrder.processedAt || "N/A"}`);
        console.log(`Delivered: ${processingOrder.deliveredAt || "N/A"}`);

        if (processingOrder.checkoutGroupId) {
            console.log("\n=== Checking Group Orders ===");
            const groupOrders = await Order.find({
                checkoutGroupId: processingOrder.checkoutGroupId
            }).lean();

            console.log(`Total orders in group: ${groupOrders.length}`);
            groupOrders.forEach((order, i) => {
                console.log(`  Order ${i + 1}: status=${order.status}, deliveryStatus=${order.deliveryStatus}`);
            });

            const allProcessing = groupOrders.every(o => o.status === "processing" || o.status === "completed");
            const anyFailed = groupOrders.some(o => o.status === "failed" || o.status === "cancelled");

            console.log(`\nAll paid/processing? ${allProcessing}`);
            console.log(`Any failed? ${anyFailed}`);
            console.log(`Should deliver? ${allProcessing && !anyFailed}`);
        } else {
            console.log("\n=== Single Order (No Group) ===");
            console.log("This order has no checkoutGroupId");
            console.log("Should have been delivered immediately after payment");
        }

        console.log("\n=== Order Items ===");
        if (processingOrder.orderItems && processingOrder.orderItems.length > 0) {
            processingOrder.orderItems.forEach((item, i) => {
                console.log(`\nItem ${i + 1}:`);
                console.log(`  Title: ${item.title}`);
                console.log(`  Listing ID: ${item.listingId}`);
                console.log(`  Quantity: ${item.quantity}`);
                console.log(`  Purchased Codes: ${item.purchasedCodes?.length || 0}`);
                console.log(`  Expiration Groups: ${JSON.stringify(item.expirationGroups || [])}`);
            });
        }

    } catch (error) {
        console.error("Error:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log("\nDisconnected from MongoDB");
    }
}

checkDeliveryIssue();
