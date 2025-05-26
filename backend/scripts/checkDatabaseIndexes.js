const mongoose = require("mongoose");
const { configs } = require("../configs");

/**
 * Script to check and clean up database indexes
 */

const checkDatabaseIndexes = async () => {
  try {
    console.log("Checking database indexes...");
    
    // Connect to MongoDB
    await mongoose.connect(configs.MONGO_URI);
    console.log("Connected to MongoDB");

    // Get database instance
    const db = mongoose.connection.db;
    
    // Check collections
    const collections = await db.listCollections().toArray();
    console.log("\nCollections in database:");
    collections.forEach(col => console.log(`- ${col.name}`));

    // Check wallets collection indexes
    console.log("\n=== Wallets Collection Indexes ===");
    try {
      const walletIndexes = await db.collection('wallets').indexes();
      console.log("Wallet indexes:");
      walletIndexes.forEach(index => {
        console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
      });
    } catch (error) {
      console.log("Wallets collection doesn't exist yet");
    }

    // Check transactions collection indexes
    console.log("\n=== Transactions Collection Indexes ===");
    try {
      const transactionIndexes = await db.collection('transactions').indexes();
      console.log("Transaction indexes:");
      transactionIndexes.forEach(index => {
        console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
      });
    } catch (error) {
      console.log("Transactions collection doesn't exist yet");
    }

    // Check users collection indexes
    console.log("\n=== Users Collection Indexes ===");
    try {
      const userIndexes = await db.collection('users').indexes();
      console.log("User indexes:");
      userIndexes.forEach(index => {
        console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
      });
    } catch (error) {
      console.log("Users collection doesn't exist yet");
    }

    // Check for any problematic indexes
    console.log("\n=== Checking for problematic indexes ===");
    
    // Look for any indexes that might be causing issues
    const allCollections = ['wallets', 'transactions', 'users', 'listings'];
    
    for (const collectionName of allCollections) {
      try {
        const indexes = await db.collection(collectionName).indexes();
        const problematicIndexes = indexes.filter(index => 
          index.name.includes('transactionId') || 
          index.name.includes('transaction') ||
          (index.key && Object.keys(index.key).some(key => key.includes('transaction')))
        );
        
        if (problematicIndexes.length > 0) {
          console.log(`Found problematic indexes in ${collectionName}:`);
          problematicIndexes.forEach(index => {
            console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
          });
        }
      } catch (error) {
        // Collection doesn't exist, skip
      }
    }

    // Try to create a test wallet to see the exact error
    console.log("\n=== Testing wallet creation ===");
    
    const { Wallet } = require("../models/wallet");
    const { User } = require("../models/user");
    
    // Create a test user
    const testUser = await User.create({
      name: "Index Test User",
      uid: "index-test-uid",
      email: "indextest@example.com",
      roles: ["buyer"],
      role: "buyer",
      provider: "email"
    });
    
    console.log(`Created test user: ${testUser._id}`);
    
    try {
      // Try to create wallet directly without the helper method
      const wallet = new Wallet({
        userId: testUser._id,
        currency: 'USD'
      });
      
      const savedWallet = await wallet.save();
      console.log(`✅ Direct wallet creation successful: ${savedWallet._id}`);
      
      // Clean up
      await Wallet.deleteOne({ _id: savedWallet._id });
      
    } catch (walletError) {
      console.log(`❌ Direct wallet creation failed: ${walletError.message}`);
      console.log(`Error code: ${walletError.code}`);
      console.log(`Error details:`, walletError);
    }
    
    // Clean up test user
    await User.deleteOne({ _id: testUser._id });
    console.log("Cleaned up test user");

  } catch (error) {
    console.error("Script failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run script
checkDatabaseIndexes()
  .then(() => {
    console.log("Database index check completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Database index check failed:", error);
    process.exit(1);
  });
