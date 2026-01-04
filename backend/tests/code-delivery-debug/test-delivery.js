const mongoose = require("mongoose");
const CheckoutService = require("../../services/checkoutService");
const { Order } = require("../../models/order");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

async function testDelivery() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        // Find the specific stuck order
        const order = await Order.findOne({
            externalId: "1bad313d-30f1-41d4-83d1-d422e3f9f1d6"
        });

        if (!order) {
            console.log("❌ Order not found");
            return;
        }

        console.log(`📦 Found order: ${order.externalId}`);
        console.log(`Status: ${order.status} / ${order.deliveryStatus}`);
        console.log(`Items: ${order.orderItems.length}`);
        console.log(`Current codes in order: ${order.orderItems[0]?.purchasedCodes?.length || 0}\n`);

        console.log("🚀 Attempting delivery...\n");

        try {
            await CheckoutService.deliverOrder(order);
            console.log("\n✅ Delivery method completed");
        } catch (error) {
            console.error("\n❌ Delivery error:", error.message);
            console.error("Stack:", error.stack);
        }

        // Reload order to check final status
        const updatedOrder = await Order.findOne({
            externalId: "1bad313d-30f1-41d4-83d1-d422e3f9f1d6"
        }).select("+orderItems.purchasedCodes");

        console.log("\n📊 Final Status:");
        console.log(`   Status: ${updatedOrder.status} / ${updatedOrder.deliveryStatus}`);
        console.log(`   Delivered At: ${updatedOrder.deliveredAt || "N/A"}`);
        console.log(`   Error Message: ${updatedOrder.errorMessage || "None"}`);

        if (updatedOrder.orderItems && updatedOrder.orderItems.length > 0) {
            updatedOrder.orderItems.forEach((item, i) => {
                console.log(`   Item ${i + 1}: ${item.purchasedCodes?.length || 0} codes`);
            });
        }

    } catch (error) {
        console.error("\n❌ Error:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log("\nDisconnected from MongoDB");
    }
}

testDelivery();
