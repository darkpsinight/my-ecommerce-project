const mongoose = require("mongoose");
const { configs } = require("../configs");

/**
 * Script to clean up problematic wallet indexes
 */

const cleanupWalletIndexes = async () => {
  try {
    console.log("Cleaning up problematic wallet indexes...");
    
    // Connect to MongoDB
    await mongoose.connect(configs.MONGO_URI);
    console.log("Connected to MongoDB");

    // Get database instance
    const db = mongoose.connection.db;
    
    // List of problematic indexes to remove
    const problematicIndexes = [
      'transactions.transactionId_1',
      'transactions.relatedId_1', 
      'transactions.stripePaymentIntentId_1',
      'transactions.createdAt_1',
      'transactions.createdAt_-1',
      'transactions.type_1',
      'transactions.status_1',
      'transactions.paymentIntentId_1',
      'transactions.timestamp_-1',
      'userID_1' // This looks like a typo (should be userId_1)
    ];

    console.log("\n=== Current wallet indexes ===");
    const currentIndexes = await db.collection('wallets').indexes();
    currentIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log("\n=== Removing problematic indexes ===");
    
    for (const indexName of problematicIndexes) {
      try {
        await db.collection('wallets').dropIndex(indexName);
        console.log(`✅ Dropped index: ${indexName}`);
      } catch (error) {
        if (error.code === 27) {
          console.log(`⚠️  Index ${indexName} doesn't exist (already removed)`);
        } else {
          console.log(`❌ Failed to drop index ${indexName}: ${error.message}`);
        }
      }
    }

    console.log("\n=== Remaining wallet indexes ===");
    const remainingIndexes = await db.collection('wallets').indexes();
    remainingIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Test wallet creation after cleanup
    console.log("\n=== Testing wallet creation after cleanup ===");
    
    const { Wallet } = require("../models/wallet");
    const { User } = require("../models/user");
    
    // Create a test user
    const testUser = await User.create({
      name: "Cleanup Test User",
      uid: "cleanup-test-uid",
      email: "cleanuptest@example.com",
      roles: ["buyer"],
      role: "buyer",
      provider: "email"
    });
    
    console.log(`Created test user: ${testUser._id}`);
    
    try {
      // Try to create wallet using the helper method
      const wallet = await Wallet.createWalletForUser(testUser._id, 'USD');
      
      if (wallet) {
        console.log(`✅ Wallet creation successful: ${wallet._id}`);
        console.log(`Wallet details:`, {
          userId: wallet.userId,
          currency: wallet.currency,
          balance: wallet.balance,
          externalId: wallet.externalId
        });
        
        // Clean up
        await Wallet.deleteOne({ _id: wallet._id });
        console.log("Cleaned up test wallet");
      } else {
        console.log(`❌ Wallet creation returned null`);
      }
      
    } catch (walletError) {
      console.log(`❌ Wallet creation failed: ${walletError.message}`);
    }
    
    // Clean up test user
    await User.deleteOne({ _id: testUser._id });
    console.log("Cleaned up test user");

    console.log("\n🎉 Wallet index cleanup completed successfully!");

  } catch (error) {
    console.error("Script failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run script
cleanupWalletIndexes()
  .then(() => {
    console.log("Wallet index cleanup completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Wallet index cleanup failed:", error);
    process.exit(1);
  });
