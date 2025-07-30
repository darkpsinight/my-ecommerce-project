const { test, before, after } = require('tap');
const { build } = require('../app');
const { User } = require('../../../models/user');
const { MarketingSpend } = require('../../../models/marketingSpend');
const { Order } = require('../../../models/order');
const mongoose = require('mongoose');

let app;
let sellerToken;
let sellerId;

before(async () => {
  app = await build({ logger: false });
  
  // Create a test seller user
  const testSeller = new User({
    name: 'Test Seller',
    uid: 'test-seller-cac-' + Date.now(),
    email: 'testseller.cac@example.com',
    roles: ['seller'],
    isEmailConfirmed: true,
    provider: 'email'
  });
  
  await testSeller.save();
  sellerId = testSeller._id;
  
  // Generate JWT token for the seller
  sellerToken = testSeller.getJWT();
});

after(async () => {
  // Clean up test data
  await User.deleteMany({ email: /testseller\.cac@example\.com/ });
  await MarketingSpend.deleteMany({ sellerId: sellerId });
  await Order.deleteMany({ sellerId: sellerId });
  
  await app.close();
});

test('CAC Analytics - Add Marketing Spend', async (t) => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/seller/analytics/marketing-spend',
    headers: {
      authorization: `Bearer ${sellerToken}`
    },
    payload: {
      amount: 100.50,
      currency: 'USD',
      channel: 'google_ads',
      campaignName: 'Test Campaign',
      description: 'Test marketing spend',
      spendDate: '2024-01-15',
      periodStart: '2024-01-15',
      periodEnd: '2024-01-31',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'test-campaign',
      impressions: 1000,
      clicks: 50,
      conversions: 5
    }
  });

  t.equal(response.statusCode, 201);
  const data = JSON.parse(response.body);
  t.equal(data.success, true);
  t.equal(data.data.amount, 100.50);
  t.equal(data.data.channel, 'google_ads');
});

test('CAC Analytics - Get Marketing Spend', async (t) => {
  const response = await app.inject({
    method: 'GET',
    url: '/api/v1/seller/analytics/marketing-spend',
    headers: {
      authorization: `Bearer ${sellerToken}`
    }
  });

  t.equal(response.statusCode, 200);
  const data = JSON.parse(response.body);
  t.equal(data.success, true);
  t.ok(Array.isArray(data.data.spendEntries));
  t.ok(data.data.pagination);
});

test('CAC Analytics - Get CAC Analytics', async (t) => {
  const response = await app.inject({
    method: 'GET',
    url: '/api/v1/seller/analytics/cac?timeRange=30d',
    headers: {
      authorization: `Bearer ${sellerToken}`
    }
  });

  t.equal(response.statusCode, 200);
  const data = JSON.parse(response.body);
  t.equal(data.success, true);
  t.ok(data.data.cac);
  t.ok(typeof data.data.cac.totalMarketingSpend === 'number');
  t.ok(typeof data.data.cac.newCustomersAcquired === 'number');
  t.ok(typeof data.data.cac.overallCAC === 'number');
});

test('CAC Analytics - Invalid Channel', async (t) => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/seller/analytics/marketing-spend',
    headers: {
      authorization: `Bearer ${sellerToken}`
    },
    payload: {
      amount: 50,
      channel: 'invalid_channel',
      spendDate: '2024-01-15',
      periodStart: '2024-01-15',
      periodEnd: '2024-01-31'
    }
  });

  t.equal(response.statusCode, 400);
});

test('CAC Analytics - Missing Required Fields', async (t) => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/seller/analytics/marketing-spend',
    headers: {
      authorization: `Bearer ${sellerToken}`
    },
    payload: {
      amount: 50
      // Missing required fields
    }
  });

  t.equal(response.statusCode, 400);
});

test('CAC Analytics - Unauthorized Access', async (t) => {
  const response = await app.inject({
    method: 'GET',
    url: '/api/v1/seller/analytics/cac',
    headers: {
      authorization: 'Bearer invalid-token'
    }
  });

  t.equal(response.statusCode, 401);
});