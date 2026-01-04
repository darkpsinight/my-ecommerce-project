const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

const orderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model("Order", orderSchema);

async function checkOrders() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // Get the most recent orders
        const recentOrders = await Order.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        console.log("\n=== Recent Orders ===");
        recentOrders.forEach((order, index) => {
            console.log(`\nOrder ${index + 1}:`);
            console.log(`  External ID: ${order.externalId}`);
            console.log(`  Buyer ID: ${order.buyerId}`);
            console.log(`  Seller ID: ${order.sellerId}`);
            console.log(`  Status: ${order.status}`);
            console.log(`  Delivery Status: ${order.deliveryStatus}`);
            console.log(`  Created At: ${order.createdAt}`);
            console.log(`  Delivered At: ${order.deliveredAt || 'N/A'}`);
            console.log(`  Checkout Group ID: ${order.checkoutGroupId || 'N/A'}`);
            console.log(`  Payment Intent ID: ${order.paymentIntentId || 'N/A'}`);
            console.log(`  Order Items Count: ${order.orderItems?.length || 0}`);

            if (order.orderItems && order.orderItems.length > 0) {
                order.orderItems.forEach((item, itemIndex) => {
                    console.log(`    Item ${itemIndex + 1}:`);
                    console.log(`      Title: ${item.title}`);
                    console.log(`      Quantity: ${item.quantity}`);
                    console.log(`      Purchased Codes Count: ${item.purchasedCodes?.length || 0}`);
                    if (item.purchasedCodes && item.purchasedCodes.length > 0) {
                        console.log(`      Sample Code ID: ${item.purchasedCodes[0].codeId}`);
                    }
                });
            }
        });

        // Check for completed orders
        console.log("\n\n=== Completed Orders ===");
        const completedOrders = await Order.find({
            status: "completed",
            deliveryStatus: "delivered"
        }).countDocuments();
        console.log(`Total completed & delivered orders: ${completedOrders}`);

        // Check for orders with codes
        console.log("\n=== Orders with Codes ===");
        const ordersWithCodes = await Order.find({
            "orderItems.purchasedCodes.0": { $exists: true }
        }).countDocuments();
        console.log(`Total orders with codes: ${ordersWithCodes}`);

        // Check for processing orders
        console.log("\n=== Processing Orders ===");
        const processingOrders = await Order.find({ status: "processing" }).lean();
        console.log(`Total processing orders: ${processingOrders.length}`);
        processingOrders.forEach((order) => {
            console.log(`  Order ${order.externalId}: status=${order.status}, deliveryStatus=${order.deliveryStatus}`);
        });

    } catch (error) {
        console.error("Error:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log("\nDisconnected from MongoDB");
    }
}

checkOrders();
