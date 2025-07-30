const mongoose = require("mongoose");
const { configs } = require("../../configs");
const { User } = require("../../models/user");
const { Wallet } = require("../../models/wallet");

/**
 * Simple test to debug wallet creation
 */

const testWalletCreation = async () => {
  try {
    console.log("Starting simple wallet creation test...");

    // Connect to MongoDB
    await mongoose.connect(configs.MONGO_URI);
    console.log("Connected to MongoDB");

    // Test 1: Create a test user
    console.log("\n=== Test 1: Creating test user ===");

    const testUser = await User.create({
      name: "Simple Test User",
      uid: "simple-test-uid",
      email: "simpletest@example.com",
      roles: ["buyer"],
      role: "buyer",
      provider: "email",
      isEmailConfirmed: false
    });

    console.log(`✅ Created user: ${testUser.email}`);
    console.log(`User ID: ${testUser._id}`);
    console.log(`User ID type: ${typeof testUser._id}`);

    // Test 2: Check for existing wallets first
    console.log("\n=== Test 2: Checking for existing wallets ===");

    const existingWallet = await Wallet.findOne({ userId: testUser._id });
    console.log(`Existing wallet: ${existingWallet ? existingWallet._id : 'none'}`);

    if (existingWallet) {
      await Wallet.deleteOne({ _id: existingWallet._id });
      console.log("Deleted existing wallet");
    }

    // Test 3: Test wallet creation method directly
    console.log("\n=== Test 3: Testing wallet creation method ===");

    console.log(`WALLET_DEFAULT_CURRENCY: ${configs.WALLET_DEFAULT_CURRENCY}`);

    try {
      const wallet = await Wallet.createWalletForUser(
        testUser._id,
        configs.WALLET_DEFAULT_CURRENCY || 'USD'
      );

      if (wallet) {
        console.log(`✅ Wallet created successfully`);
        console.log(`Wallet ID: ${wallet._id}`);
        console.log(`Wallet User ID: ${wallet.userId}`);
        console.log(`Wallet Currency: ${wallet.currency}`);
        console.log(`Wallet Balance: ${wallet.balance}`);
        console.log(`Wallet External ID: ${wallet.externalId}`);
      } else {
        console.log("❌ Wallet creation returned null");
      }

    } catch (walletError) {
      console.error("❌ Wallet creation failed:", walletError.message);
      console.error("Stack:", walletError.stack);
    }

    // Test 4: Test with string user ID
    console.log("\n=== Test 4: Testing with string user ID ===");

    try {
      const wallet2 = await Wallet.createWalletForUser(
        testUser._id.toString(),
        'USD'
      );

      console.log(`✅ Wallet 2 created successfully`);
      console.log(`Wallet 2 ID: ${wallet2._id}`);

    } catch (walletError2) {
      console.error("❌ Wallet 2 creation failed:", walletError2.message);
    }

    // Clean up
    await User.deleteOne({ uid: "simple-test-uid" });
    await Wallet.deleteMany({ userId: testUser._id });
    console.log("\n🧹 Cleaned up test data");

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run test
testWalletCreation()
  .then(() => {
    console.log("Simple wallet test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Simple wallet test failed:", error);
    process.exit(1);
  });
