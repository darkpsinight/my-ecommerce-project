/**
 * Test script to simulate a real Stripe webhook call for legacy wallet funding
 * This tests the complete webhook processing pipeline
 */

const crypto = require('crypto');
const request = require('supertest');
const { configs } = require('../configs');

// Mock Stripe webhook payload for successful wallet funding
const createMockWebhookPayload = (paymentIntentId, userId, walletId, amount = 5000) => {
  return {
    id: `evt_test_${Date.now()}`,
    object: "event",
    api_version: "2020-08-27",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: paymentIntentId,
        object: "payment_intent",
        amount: amount,
        currency: "usd",
        status: "succeeded",
        metadata: {
          userId: userId,
          walletId: walletId,
          type: "wallet_funding",
          source: "legacy_topup_request"
        },
        created: Math.floor(Date.now() / 1000)
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_test_${Date.now()}`,
      idempotency_key: null
    },
    type: process.argv.includes('--type') ? process.argv[process.argv.indexOf('--type') + 1] : "payment_intent.succeeded"
  };
};

// Generate Stripe webhook signature
const generateStripeSignature = (payload, secret) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  return {
    signature: `t=${timestamp},v1=${signature}`,
    timestamp,
    payload: payloadString
  };
};

async function testWebhookEndpoint() {
  try {
    console.log("Testing Stripe webhook endpoint for legacy wallet funding...");

    // Test parameters - replace with actual values from your test environment
    const testPaymentIntentId = "pi_test_legacy_" + Date.now();
    const testUserId = "507f1f77bcf86cd799439011"; // Replace with actual test user ID
    const testWalletId = "507f1f77bcf86cd799439012"; // Replace with actual test wallet ID
    const testAmount = 5000; // $50.00 in cents

    // Create mock webhook payload
    const payload = createMockWebhookPayload(testPaymentIntentId, testUserId, testWalletId, testAmount);

    // Generate signature (you'll need your webhook secret)
    const webhookSecret = configs.STRIPE_WEBHOOK_SECRET || "whsec_test_secret";
    const { signature, payload: payloadString } = generateStripeSignature(payload, webhookSecret);

    console.log("Generated webhook payload:");
    console.log(JSON.stringify(payload, null, 2));
    console.log("\\nGenerated signature:", signature);

    // If you want to test against a running server, uncomment the following:
    /*
    const serverUrl = 'http://localhost:3000'; // Adjust port as needed
    
    const response = await request(serverUrl)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', signature)
      .send(payloadString)
      .expect(200);
      
    console.log("\\nWebhook response:", response.body);
    */

    console.log("\\n📋 Manual Testing Instructions:");
    console.log("1. Start your backend server");
    console.log("2. Use a tool like curl or Postman to send a POST request to:");
    console.log("   URL: http://localhost:3000/api/v1/webhooks/stripe");
    console.log("   Headers:");
    console.log("     Content-Type: application/json");
    console.log("     Stripe-Signature:", signature);
    console.log("   Body:", payloadString);
    console.log("\\n3. Check your wallet balance before and after the request");
    console.log("4. Verify transaction status in the database");

    // Example curl command
    console.log("\\n🔧 Example curl command:");
    console.log(`curl -X POST http://localhost:3000/api/v1/webhooks/stripe \\\\`);
    console.log(`  -H "Content-Type: application/json" \\\\`);
    console.log(`  -H "Stripe-Signature: ${signature}" \\\\`);
    console.log(`  -d '${payloadString}'`);

  } catch (error) {
    console.error("Test preparation failed:", error);
  }
}

// Run the test
testWebhookEndpoint();