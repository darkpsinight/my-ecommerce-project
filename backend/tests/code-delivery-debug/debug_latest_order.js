const mongoose = require('mongoose');

// Adjust paths as necessary
const { Order } = require('../../models/order');

async function debugLatestOrder() {
    try {
        console.log("Connecting to DB...");
        // Using standard local URI
        await mongoose.connect("mongodb://localhost:27017/qoder_db");
        console.log("Connected.");

        const order = await Order.findOne({}).sort({ createdAt: -1 });

        if (!order) {
            console.log("No orders found.");
            return;
        }

        console.log("--------------------------------------------------");
        console.log(`LATEST ORDER: ${order.externalId}`);
        console.log(`ID: ${order._id}`);
        console.log(`Status: ${order.status}`);
        console.log(`Delivery Status: ${order.deliveryStatus}`);
        console.log(`Created At: ${order.createdAt}`);
        console.log(`Error Message: ${order.errorMessage || "None"}`);
        console.log("--------------------------------------------------");
        console.log("Order Items:");
        order.orderItems.forEach((item, idx) => {
            console.log(`  Item ${idx + 1}: ${item.title}`);
            console.log(`  Purchased Codes Count: ${item.purchasedCodes ? item.purchasedCodes.length : 0}`);
        });
        console.log("--------------------------------------------------");

    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

debugLatestOrder();
