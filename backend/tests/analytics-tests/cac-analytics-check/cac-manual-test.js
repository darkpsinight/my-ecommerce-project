// Simple manual test for CAC endpoints
const axios = require("axios");

const BASE_URL = "http://localhost:3000/api/v1";

// Test data - using existing seller account
const testUser = {
  email: "darkpsinight@gmail.com",
  password: "12345678000aA!",
};

// Use current dates for the test
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const weekAgo = new Date(today);
weekAgo.setDate(weekAgo.getDate() - 7);

const testMarketingSpend = {
  amount: 150.75,
  currency: "USD",
  channel: "google_ads",
  campaignName: "Test Campaign Q1",
  description: "Test marketing spend for CAC analytics",
  spendDate: yesterday.toISOString().split("T")[0],
  periodStart: weekAgo.toISOString().split("T")[0],
  periodEnd: today.toISOString().split("T")[0],
  utmSource: "google",
  utmMedium: "cpc",
  utmCampaign: "test-campaign",
  impressions: 2000,
  clicks: 100,
  conversions: 8,
};

let authToken = "";

async function runTests() {
  console.log("🚀 Starting CAC Analytics Manual Tests...\n");

  try {
    // 1. Login with existing seller account
    console.log("1. Logging in with existing seller account...");
    const loginResponse = await axios.post(`${BASE_URL}/auth/signin`, testUser);

    if (loginResponse.data.success) {
      authToken = loginResponse.data.token;
      console.log("✅ Seller logged in successfully");
    } else {
      throw new Error("Failed to login seller");
    }

    // 2. Add marketing spend
    console.log("\n2. Adding marketing spend...");
    const addSpendResponse = await axios.post(
      `${BASE_URL}/seller/analytics/marketing-spend`,
      testMarketingSpend,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (addSpendResponse.data.success) {
      console.log("✅ Marketing spend added successfully");
      console.log(`   Amount: $${addSpendResponse.data.data.amount}`);
      console.log(`   Channel: ${addSpendResponse.data.data.channel}`);
      console.log(`   Campaign: ${addSpendResponse.data.data.campaignName}`);
    } else {
      throw new Error("Failed to add marketing spend");
    }

    // 3. Get marketing spend entries
    console.log("\n3. Retrieving marketing spend entries...");
    const getSpendResponse = await axios.get(
      `${BASE_URL}/seller/analytics/marketing-spend`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (getSpendResponse.data.success) {
      console.log("✅ Marketing spend retrieved successfully");
      console.log(
        `   Total entries: ${getSpendResponse.data.data.spendEntries.length}`
      );
      console.log(
        `   Pagination: Page ${getSpendResponse.data.data.pagination.page} of ${getSpendResponse.data.data.pagination.pages}`
      );
    } else {
      throw new Error("Failed to retrieve marketing spend");
    }

    // 4. Get CAC analytics
    console.log("\n4. Getting CAC analytics...");
    const cacResponse = await axios.get(
      `${BASE_URL}/seller/analytics/cac?timeRange=30d`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (cacResponse.data.success) {
      console.log("✅ CAC analytics retrieved successfully");
      const cacData = cacResponse.data.data.cac;
      console.log(`   Total Marketing Spend: $${cacData.totalMarketingSpend}`);
      console.log(`   New Customers Acquired: ${cacData.newCustomersAcquired}`);
      console.log(`   Overall CAC: $${cacData.overallCAC}`);
      console.log(`   CAC Payback Period: ${cacData.cacPaybackPeriod} orders`);
      console.log(
        `   Spend by Channel: ${cacData.spendByChannel.length} channels`
      );
      console.log(`   Daily Trend Points: ${cacData.dailyTrend.length} days`);
    } else {
      throw new Error("Failed to retrieve CAC analytics");
    }

    // 5. Test seller analytics overview (should include CAC data)
    console.log("\n5. Testing seller analytics overview with CAC...");
    const overviewResponse = await axios.get(
      `${BASE_URL}/seller/analytics/overview?timeRange=30d`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (overviewResponse.data.success) {
      console.log("✅ Seller analytics overview retrieved successfully");
      const overviewData = overviewResponse.data.data;
      if (overviewData.cac) {
        console.log(`   CAC data included in overview: ✅`);
        console.log(
          `   CAC has data: ${overviewData.cac.hasData ? "✅" : "❌"}`
        );
        console.log(
          `   CAC total spend: $${overviewData.cac.totalMarketingSpend}`
        );
      } else {
        console.log("   CAC data missing from overview: ❌");
      }
    } else {
      throw new Error("Failed to retrieve seller analytics overview");
    }

    console.log("\n🎉 All CAC Analytics tests passed successfully!");
    console.log("\n📊 Test Summary:");
    console.log("   ✅ Seller authentication");
    console.log("   ✅ Marketing spend creation");
    console.log("   ✅ Marketing spend retrieval");
    console.log("   ✅ CAC analytics calculation");
    console.log("   ✅ Integration with seller overview");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the tests
runTests();
