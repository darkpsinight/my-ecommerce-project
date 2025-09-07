/**
 * Test script for legacy wallet funding webhook processing
 * This script simulates a Stripe webhook event for wallet funding
 */

const PaymentIntentProcessor = require("../services/payment/eventProcessors/paymentIntentProcessor");
const { Transaction } = require("../models/transaction");
const { Wallet } = require("../models/wallet");
const { User } = require("../models/user");
const { connectDB } = require("../models/connectDB");

async function testLegacyWalletFundingWebhook() {
  try {
    console.log("Starting legacy wallet funding webhook test...");
    
    // Connect to database
    await connectDB();
    
    // Create processor
    const processor = new PaymentIntentProcessor();
    
    // Mock payment intent data (similar to what Stripe sends)
    const mockPaymentIntent = {
      id: "pi_test_legacy_wallet_funding",
      amount: 5000, // $50.00 in cents
      currency: "usd",
      status: "succeeded",
      metadata: {
        userId: "507f1f77bcf86cd799439011", // Mock user ID
        walletId: "507f1f77bcf86cd799439012", // Mock wallet ID
        type: "wallet_funding",
        source: "legacy_topup_request"
      }
    };
    
    // Create test user and wallet for testing
    console.log("Setting up test data...");
    
    // Find existing test user or skip if not found
    const testUser = await User.findById(mockPaymentIntent.metadata.userId);
    if (!testUser) {
      console.log("Test user not found, skipping test");
      return;
    }
    
    // Get or create wallet
    let wallet = await Wallet.findById(mockPaymentIntent.metadata.walletId);
    if (!wallet) {
      wallet = await Wallet.getWalletByUserId(mockPaymentIntent.metadata.userId);
      if (!wallet) {
        console.log("No wallet found for test user, skipping test");
        return;
      }
    }
    
    const initialBalance = wallet.balance;
    console.log(`Initial wallet balance: $${initialBalance}`);
    
    // Create a pending transaction (simulating what happens when payment intent is created)
    await Transaction.create({
      walletId: wallet._id,
      userId: mockPaymentIntent.metadata.userId,
      type: "funding",
      amount: mockPaymentIntent.amount / 100,
      currency: mockPaymentIntent.currency.toUpperCase(),
      status: "pending",
      description: `Wallet funding of ${mockPaymentIntent.amount / 100} USD`,
      paymentProvider: "stripe",
      paymentIntentId: mockPaymentIntent.id,
      balanceBefore: initialBalance,
      balanceAfter: initialBalance + (mockPaymentIntent.amount / 100)
    });
    
    // Mock event structure
    const mockEvent = {
      data: {
        object: mockPaymentIntent
      }
    };
    
    console.log("Processing payment intent succeeded event...");
    
    // Process the webhook event
    const result = await processor.processPaymentIntentSucceeded(mockEvent);
    
    console.log("Webhook processing result:", result);
    
    // Verify the results
    const updatedWallet = await Wallet.findById(wallet._id);
    const transaction = await Transaction.getTransactionByPaymentIntent(mockPaymentIntent.id);
    
    console.log(`Updated wallet balance: $${updatedWallet.balance}`);
    console.log(`Transaction status: ${transaction.status}`);
    
    const expectedBalance = initialBalance + (mockPaymentIntent.amount / 100);
    if (Math.abs(updatedWallet.balance - expectedBalance) < 0.01) {
      console.log("✅ Wallet balance updated correctly!");
    } else {
      console.log(`❌ Wallet balance incorrect. Expected: $${expectedBalance}, Got: $${updatedWallet.balance}`);
    }
    
    if (transaction.status === "completed") {
      console.log("✅ Transaction marked as completed!");
    } else {
      console.log(`❌ Transaction status incorrect. Expected: completed, Got: ${transaction.status}`);
    }
    
    // Cleanup test data
    await Transaction.deleteOne({ paymentIntentId: mockPaymentIntent.id });
    
    console.log("Test completed successfully!");
    
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testLegacyWalletFundingWebhook();