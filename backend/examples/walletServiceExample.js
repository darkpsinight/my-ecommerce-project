/**
 * Example demonstrating the WalletService with combined balance handling
 * This shows how the service implements legacy-first spending logic
 */

const WalletService = require("../services/wallet/walletService");

async function demonstrateWalletService() {
  console.log("=== Wallet Service Combined Balance Management Demo ===\n");

  const walletService = new WalletService();
  const userId = "demo-user-123";

  try {
    // 1. Get comprehensive wallet information
    console.log("1. Getting wallet information...");
    const walletInfo = await walletService.getWalletInfo(userId);
    
    console.log(`Total Balance: $${walletInfo.totalBalanceDollars}`);
    console.log(`Legacy Balance: $${walletInfo.breakdown.legacy.balanceDollars}`);
    console.log(`Platform Balance: $${walletInfo.breakdown.platform.balanceDollars}`);
    console.log(`Spending Strategy: ${walletInfo.spendingStrategy}`);
    console.log(`Legacy First Spending: ${walletInfo.featureFlags.legacyFirstSpending}\n`);

    // 2. Demonstrate spending with legacy-first priority
    console.log("2. Spending $30 with legacy-first priority...");
    const spendingResult = await walletService.spendFromWallet(userId, 3000, {
      orderId: "order-123",
      description: "Product purchase"
    });

    console.log(`Total Spent: $${spendingResult.totalSpentDollars}`);
    console.log(`Legacy Spent: $${spendingResult.spendingBreakdown.legacy.spentDollars}`);
    console.log(`Platform Spent: $${spendingResult.spendingBreakdown.platform.spentDollars}`);
    console.log(`Remaining Balance: $${spendingResult.remainingBalanceDollars}\n`);

    // 3. Check if user has enough funds for another purchase
    console.log("3. Checking if user has enough funds for $50 purchase...");
    const fundsCheck = await walletService.hasEnoughFunds(userId, 5000);
    
    console.log(`Has Enough Funds: ${fundsCheck.hasEnoughFunds}`);
    console.log(`Available Balance: $${fundsCheck.availableBalanceCents / 100}`);
    if (!fundsCheck.hasEnoughFunds) {
      console.log(`Shortfall: $${fundsCheck.shortfallCents / 100}`);
    }
    console.log();

    // 4. Add funds to wallet
    console.log("4. Adding $25 to platform wallet...");
    const addFundsResult = await walletService.addFundsToWallet(userId, 2500, "platform", {
      paymentProvider: "stripe",
      paymentIntentId: "pi_demo_123"
    });

    console.log(`Added to Platform: ${addFundsResult.addedToPlatform}`);
    console.log(`Added Amount: $${addFundsResult.addedAmountDollars}\n`);

    // 5. Demonstrate refund with proportional distribution
    console.log("5. Refunding $15 with proportional distribution...");
    const originalSpending = {
      legacy: { spent: 1000 }, // $10 from legacy
      new: { spent: 500 }      // $5 from platform
    };

    const refundResult = await walletService.refundToWallet(
      userId, 
      1500, 
      originalSpending,
      { reason: "customer_request" }
    );

    console.log(`Total Refunded: $${refundResult.totalRefundedDollars}`);
    console.log(`Legacy Refunded: $${refundResult.refundBreakdown.legacy.refundedDollars}`);
    console.log(`Platform Refunded: $${refundResult.refundBreakdown.platform.refundedDollars}\n`);

    // 6. Get migration status
    console.log("6. Checking migration status...");
    const migrationStatus = await walletService.legacyBridge.getMigrationStatus(userId);
    
    console.log(`Has Legacy Wallet: ${migrationStatus.hasLegacyWallet}`);
    console.log(`Legacy Migrated: ${migrationStatus.legacyMigrated}`);
    console.log(`Requires Migration: ${migrationStatus.requiresMigration}\n`);

    // 7. Get transaction history
    console.log("7. Getting recent transaction history...");
    const transactionHistory = await walletService.getTransactionHistory(userId, { limit: 3 });
    
    console.log(`Found ${transactionHistory.transactions.length} recent transactions:`);
    transactionHistory.transactions.forEach((tx, index) => {
      console.log(`  ${index + 1}. ${tx.type} - $${tx.amount} (${tx.source})`);
    });

  } catch (error) {
    console.error("Demo Error:", error.message);
    
    // Show what the error handling looks like
    if (error.code === "INSUFFICIENT_FUNDS") {
      console.log("This would trigger insufficient funds handling in the UI");
    } else if (error.code === "WALLET_SPENDING_DISABLED") {
      console.log("This would show a maintenance message to the user");
    }
  }

  console.log("\n=== Demo Complete ===");
}

// Example of how spending strategy affects behavior
function explainSpendingStrategies() {
  console.log("\n=== Spending Strategy Examples ===");
  
  console.log("1. legacy_first (default):");
  console.log("   - User has $25 legacy + $50 platform = $75 total");
  console.log("   - Spending $30 → $25 from legacy + $5 from platform");
  console.log("   - Remaining: $0 legacy + $45 platform = $45 total\n");

  console.log("2. platform_only:");
  console.log("   - User has $25 legacy + $50 platform = $75 total");
  console.log("   - Spending $30 → $0 from legacy + $30 from platform");
  console.log("   - Remaining: $25 legacy + $20 platform = $45 total\n");

  console.log("3. legacy_only:");
  console.log("   - User has $25 legacy + $50 platform = $75 total");
  console.log("   - Spending $30 → Would fail (insufficient legacy funds)");
  console.log("   - Spending $20 → $20 from legacy + $0 from platform");
  console.log("   - Remaining: $5 legacy + $50 platform = $55 total\n");
}

// Example of feature flag integration
function explainFeatureFlagIntegration() {
  console.log("\n=== Feature Flag Integration ===");
  
  console.log("The WalletService respects feature flags for:");
  console.log("- Legacy wallet enabled/disabled");
  console.log("- Legacy wallet readonly mode");
  console.log("- Stripe Connect enabled/disabled");
  console.log("- Spending strategy per user");
  console.log("- Emergency payment disable");
  console.log("- Maintenance mode\n");

  console.log("Example scenarios:");
  console.log("- If legacy is readonly → No legacy topups allowed");
  console.log("- If spending disabled → All wallet spending blocked");
  console.log("- If maintenance mode → All operations return maintenance error");
  console.log("- If user not eligible → Fallback to legacy methods\n");
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateWalletService()
    .then(() => {
      explainSpendingStrategies();
      explainFeatureFlagIntegration();
    })
    .catch(console.error);
}

module.exports = {
  demonstrateWalletService,
  explainSpendingStrategies,
  explainFeatureFlagIntegration
};