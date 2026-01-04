const mongoose = require("mongoose");
const CheckoutService = require("../services/checkoutService");
const { Order } = require("../models/order");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

/**
 * Migration script to fix orders stuck in processing/pending status
 * by re-running the delivery process
 */
async function migrateStuckOrders(dryRun = true) {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        // Find all orders stuck in processing with pending delivery
        const stuckOrders = await Order.find({
            status: "processing",
            deliveryStatus: "pending"
        }).sort({ createdAt: 1 });

        console.log(`📊 Found ${stuckOrders.length} stuck order(s)\n`);

        if (stuckOrders.length === 0) {
            console.log("✨ No stuck orders to migrate!");
            return;
        }

        // Display stuck orders
        console.log("=".repeat(80));
        console.log("STUCK ORDERS TO MIGRATE:");
        console.log("=".repeat(80));

        stuckOrders.forEach((order, index) => {
            console.log(`\n${index + 1}. Order: ${order.externalId}`);
            console.log(`   Buyer: ${order.buyerId}`);
            console.log(`   Seller: ${order.sellerId}`);
            console.log(`   Status: ${order.status} / ${order.deliveryStatus}`);
            console.log(`   Created: ${order.createdAt}`);
            console.log(`   Items: ${order.orderItems?.length || 0}`);
            if (order.orderItems && order.orderItems.length > 0) {
                order.orderItems.forEach((item, i) => {
                    console.log(`     ${i + 1}. ${item.title} (qty: ${item.quantity})`);
                    console.log(`        Current codes: ${item.purchasedCodes?.length || 0}`);
                });
            }
        });

        console.log("\n" + "=".repeat(80));

        if (dryRun) {
            console.log("\n🔍 DRY RUN MODE - No changes will be made");
            console.log("Run with --execute flag to actually migrate orders\n");
            return;
        }

        console.log("\n🚀 EXECUTING MIGRATION...\n");

        let successCount = 0;
        let failCount = 0;

        for (const order of stuckOrders) {
            try {
                console.log(`\n📦 Migrating order ${order.externalId}...`);

                // Re-run the delivery process
                await CheckoutService.deliverOrder(order);

                // Reload to check status
                await order.reload();

                if (order.status === "completed" && order.deliveryStatus === "delivered") {
                    console.log(`   ✅ SUCCESS - Order delivered`);
                    successCount++;
                } else if (order.status === "failed") {
                    console.log(`   ❌ FAILED - ${order.errorMessage || "Unknown error"}`);
                    failCount++;
                } else {
                    console.log(`   ⚠️  PARTIAL - Status: ${order.status}/${order.deliveryStatus}`);
                }
            } catch (error) {
                console.error(`   ❌ ERROR - ${error.message}`);
                failCount++;
            }
        }

        console.log("\n" + "=".repeat(80));
        console.log("MIGRATION RESULTS:");
        console.log("=".repeat(80));
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log(`📊 Total: ${stuckOrders.length}`);
        console.log("=".repeat(80) + "\n");

    } catch (error) {
        console.error("\n❌ Migration Error:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log("Disconnected from MongoDB");
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = !args.includes("--execute");

console.log("╔═══════════════════════════════════════════════════════════════════╗");
console.log("║         MIGRATE STUCK ORDERS - Buyer Library Fix                 ║");
console.log("╚═══════════════════════════════════════════════════════════════════╝\n");

if (isDryRun) {
    console.log("Mode: DRY RUN (preview only)\n");
} else {
    console.log("Mode: EXECUTE (will make changes)\n");
}

migrateStuckOrders(isDryRun);
