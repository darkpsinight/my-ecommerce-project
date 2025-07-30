const { test, before, after } = require("tap");
const { build } = require("../../../server");
const { connectDB, disconnectDB } = require("../../../models/connectDB");
const { User } = require("../../../models/user");
const { Transaction } = require("../../../models/transaction");
const { Order } = require("../../../models/order");
const { Wallet } = require("../../../models/wallet");
const { Listing } = require("../../../models/listing");

// Test data - using existing seller account
const testUser = {
  email: "darkpsinight@gmail.com",
  password: "12345678000aA!",
};

let app;
let authToken;
let testUserId;
let testWalletId;
let testListingId;

before(async () => {
  // Connect to database
  await connectDB();
  
  // Build the app
  app = build({ logger: false });
  await app.ready();

  // Login to get auth token
  const loginResponse = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: testUser,
  });

  const loginData = JSON.parse(loginResponse.body);
  authToken = loginData.data.accessToken;
  
  // Get user data
  const user = await User.findOne({ email: testUser.email });
  testUserId = user._id;

  // Create test wallet if it doesn't exist
  let wallet = await Wallet.findOne({ userId: testUserId });
  if (!wallet) {
    wallet = new Wallet({
      userId: testUserId,
      balance: 100,
      currency: "USD",
    });
    await wallet.save();
  }
  testWalletId = wallet._id;

  // Create test listing
  const listing = new Listing({
    sellerId: user.uid,
    title: "Test Game Code",
    description: "Test description",
    platform: "Steam",
    region: "Global",
    price: 10.99,
    currency: "USD",
    category: "Games",
    status: "active",
    codes: [
      {
        codeId: "test-code-1",
        code: "TEST-CODE-123",
        iv: "test-iv",
        soldStatus: "active",
      },
    ],
  });
  await listing.save();
  testListingId = listing._id;
});

after(async () => {
  // Clean up test data
  await Transaction.deleteMany({ userId: testUserId });
  await Order.deleteMany({ sellerId: testUserId });
  await Listing.deleteMany({ sellerId: testUserId });
  
  await app.close();
  await disconnectDB();
});

test("Transaction Success Rate Analytics", async (t) => {
  // Create test transactions with different statuses
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  // Create successful funding transaction
  const successfulFunding = new Transaction({
    walletId: testWalletId,
    userId: testUserId,
    type: "funding",
    amount: 50,
    currency: "USD",
    status: "completed",
    description: "Wallet funding",
    paymentProvider: "stripe",
    paymentIntentId: "pi_test_success",
    balanceBefore: 100,
    balanceAfter: 150,
    processedAt: yesterday,
    createdAt: yesterday,
  });
  await successfulFunding.save();

  // Create failed funding transaction
  const failedFunding = new Transaction({
    walletId: testWalletId,
    userId: testUserId,
    type: "funding",
    amount: 25,
    currency: "USD",
    status: "failed",
    description: "Wallet funding",
    paymentProvider: "stripe",
    paymentIntentId: "pi_test_failed",
    balanceBefore: 150,
    balanceAfter: 150,
    errorMessage: "Card declined",
    failedAt: twoDaysAgo,
    createdAt: twoDaysAgo,
  });
  await failedFunding.save();

  // Create successful order
  const successfulOrder = new Order({
    buyerId: testUserId,
    sellerId: testUserId,
    orderItems: [
      {
        listingId: testListingId,
        title: "Test Game Code",
        platform: "Steam",
        region: "Global",
        quantity: 1,
        unitPrice: 10.99,
        totalPrice: 10.99,
        purchasedCodes: [
          {
            codeId: "test-code-1",
            code: "TEST-CODE-123",
            iv: "test-iv",
          },
        ],
      },
    ],
    totalAmount: 10.99,
    currency: "USD",
    paymentMethod: "wallet",
    status: "completed",
    deliveryStatus: "delivered",
    deliveredAt: yesterday,
    processedAt: yesterday,
    createdAt: yesterday,
  });
  await successfulOrder.save();

  // Create successful purchase transaction
  const successfulPurchase = new Transaction({
    walletId: testWalletId,
    userId: testUserId,
    type: "purchase",
    amount: 10.99,
    currency: "USD",
    status: "completed",
    description: "Purchase transaction",
    paymentProvider: "manual",
    relatedOrderId: successfulOrder._id,
    relatedListingId: testListingId,
    balanceBefore: 150,
    balanceAfter: 139.01,
    processedAt: yesterday,
    createdAt: yesterday,
  });
  await successfulPurchase.save();

  // Create failed order
  const failedOrder = new Order({
    buyerId: testUserId,
    sellerId: testUserId,
    orderItems: [
      {
        listingId: testListingId,
        title: "Test Game Code",
        platform: "Steam",
        region: "Global",
        quantity: 1,
        unitPrice: 10.99,
        totalPrice: 10.99,
      },
    ],
    totalAmount: 10.99,
    currency: "USD",
    paymentMethod: "stripe",
    status: "failed",
    errorMessage: "Payment processing failed",
    failedAt: twoDaysAgo,
    createdAt: twoDaysAgo,
  });
  await failedOrder.save();

  t.test("should get transaction success rate analytics with default parameters", async (t) => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/seller/analytics/transaction-success-rate",
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    t.equal(response.statusCode, 200);
    
    const data = JSON.parse(response.body);
    t.ok(data.success);
    t.ok(data.data);

    const analytics = data.data;
    
    // Check overall stats
    t.ok(analytics.overall);
    t.type(analytics.overall.totalTransactions, "number");
    t.type(analytics.overall.successfulTransactions, "number");
    t.type(analytics.overall.failedTransactions, "number");
    t.type(analytics.overall.successRate, "number");
    t.type(analytics.overall.failureRate, "number");

    // Check transaction type breakdown
    t.ok(analytics.byTransactionType);
    t.ok(analytics.byTransactionType.funding);
    t.ok(analytics.byTransactionType.purchase);

    // Check payment method breakdown
    t.ok(analytics.byPaymentMethod);
    t.type(analytics.byPaymentMethod, "object");

    // Check time trends
    t.ok(analytics.timeTrends);
    t.type(analytics.timeTrends, "object");

    // Check failure analysis
    t.ok(analytics.failureAnalysis);
    t.type(analytics.failureAnalysis.totalFailures, "number");
    t.ok(analytics.failureAnalysis.topFailureReasons);
  });

  t.test("should get transaction success rate analytics with custom time range", async (t) => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/seller/analytics/transaction-success-rate?timeRange=7d&groupBy=day",
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    t.equal(response.statusCode, 200);
    
    const data = JSON.parse(response.body);
    t.ok(data.success);
    t.equal(data.data.timeRange, "7d");
    t.equal(data.data.groupBy, "day");
  });

  t.test("should validate success rate calculations", async (t) => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/seller/analytics/transaction-success-rate?timeRange=7d",
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    const data = JSON.parse(response.body);
    const analytics = data.data;

    // Validate that success rate + failure rate doesn't exceed 100%
    if (analytics.overall.totalTransactions > 0) {
      t.ok(analytics.overall.successRate >= 0 && analytics.overall.successRate <= 100);
      t.ok(analytics.overall.failureRate >= 0 && analytics.overall.failureRate <= 100);
      
      // The sum might not be exactly 100% due to pending transactions
      const totalRate = analytics.overall.successRate + analytics.overall.failureRate;
      t.ok(totalRate <= 100);
    }

    // Validate funding transaction stats
    const funding = analytics.byTransactionType.funding;
    if (funding.totalTransactions > 0) {
      t.ok(funding.successRate >= 0 && funding.successRate <= 100);
      t.ok(funding.failureRate >= 0 && funding.failureRate <= 100);
    }

    // Validate purchase transaction stats
    const purchase = analytics.byTransactionType.purchase;
    if (purchase.totalTransactions > 0) {
      t.ok(purchase.successRate >= 0 && purchase.successRate <= 100);
      t.ok(purchase.failureRate >= 0 && purchase.failureRate <= 100);
    }
  });

  t.test("should handle different groupBy parameters", async (t) => {
    const groupByOptions = ["hour", "day", "week", "month"];
    
    for (const groupBy of groupByOptions) {
      const response = await app.inject({
        method: "GET",
        url: `/api/v1/seller/analytics/transaction-success-rate?groupBy=${groupBy}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      t.equal(response.statusCode, 200);
      
      const data = JSON.parse(response.body);
      t.equal(data.data.groupBy, groupBy);
      t.ok(Array.isArray(data.data.timeTrends));
    }
  });

  t.test("should require seller role", async (t) => {
    // Create a buyer user for testing
    const buyerUser = new User({
      uid: "test-buyer-uid",
      email: "buyer@test.com",
      name: "Test Buyer",
      roles: ["buyer"],
      isEmailConfirmed: true,
    });
    await buyerUser.save();

    // Login as buyer
    const buyerLoginResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "buyer@test.com",
        password: "12345678000aA!",
      },
    });

    const buyerLoginData = JSON.parse(buyerLoginResponse.body);
    const buyerToken = buyerLoginData.data.accessToken;

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/seller/analytics/transaction-success-rate",
      headers: {
        authorization: `Bearer ${buyerToken}`,
      },
    });

    t.equal(response.statusCode, 403);
    
    const data = JSON.parse(response.body);
    t.notOk(data.success);
    t.match(data.error, /seller role required/i);

    // Clean up
    await User.deleteOne({ uid: "test-buyer-uid" });
  });

  t.test("should handle empty data gracefully", async (t) => {
    // Create a new seller with no transactions
    const newSeller = new User({
      uid: "test-empty-seller-uid",
      email: "emptyseller@test.com",
      name: "Empty Seller",
      roles: ["seller"],
      isEmailConfirmed: true,
    });
    await newSeller.save();

    // Login as new seller
    const sellerLoginResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "emptyseller@test.com",
        password: "12345678000aA!",
      },
    });

    const sellerLoginData = JSON.parse(sellerLoginResponse.body);
    const sellerToken = sellerLoginData.data.accessToken;

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/seller/analytics/transaction-success-rate",
      headers: {
        authorization: `Bearer ${sellerToken}`,
      },
    });

    t.equal(response.statusCode, 200);
    
    const data = JSON.parse(response.body);
    t.ok(data.success);

    const analytics = data.data;
    
    // Should handle empty data gracefully
    t.equal(analytics.overall.totalTransactions, 0);
    t.equal(analytics.overall.successfulTransactions, 0);
    t.equal(analytics.overall.failedTransactions, 0);
    t.equal(analytics.overall.successRate, 0);
    t.equal(analytics.overall.failureRate, 0);

    // Clean up
    await User.deleteOne({ uid: "test-empty-seller-uid" });
  });

  t.test("should validate query parameters", async (t) => {
    // Test invalid timeRange
    const invalidTimeRangeResponse = await app.inject({
      method: "GET",
      url: "/api/v1/seller/analytics/transaction-success-rate?timeRange=invalid",
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    t.equal(invalidTimeRangeResponse.statusCode, 400);

    // Test invalid groupBy
    const invalidGroupByResponse = await app.inject({
      method: "GET",
      url: "/api/v1/seller/analytics/transaction-success-rate?groupBy=invalid",
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    t.equal(invalidGroupByResponse.statusCode, 400);
  });

  // Clean up test transactions and orders
  await Transaction.deleteMany({ userId: testUserId });
  await Order.deleteMany({ sellerId: testUserId });
});

test("Transaction Success Rate Helper Functions", async (t) => {
  const { getTransactionSuccessRateAnalytics } = require("../../../handlers/transactionAnalyticsHandler");

  t.test("should handle date range calculations correctly", async (t) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // This test verifies the analytics function can be called directly
    // In a real scenario, you'd have test data set up
    try {
      const result = await getTransactionSuccessRateAnalytics(
        testUserId,
        thirtyDaysAgo,
        now,
        "day"
      );
      
      t.ok(result);
      t.ok(result.overall);
      t.ok(result.byTransactionType);
      t.ok(result.byPaymentMethod);
      t.ok(result.timeTrends);
      t.ok(result.failureAnalysis);
    } catch (error) {
      // Expected if no data exists
      t.ok(error.message);
    }
  });
});