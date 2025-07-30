const axios = require("axios");

// Test configuration
const BASE_URL = "http://localhost:3000";
const TEST_USER = {
  email: "darkpsinight@gmail.com",
  password: "12345678000aA!",
};

async function testTransactionSuccessRate() {
  console.log("🚀 Testing Transaction Success Rate API Implementation");
  console.log("====================================================\n");

  try {
    // Step 1: Login
    console.log("1️⃣ Logging in...");
    const loginResponse = await axios.post(
      `${BASE_URL}/api/v1/auth/seller-signin`,
      TEST_USER
    );

    if (!loginResponse.data.success) {
      throw new Error("Login failed");
    }

    const token = loginResponse.data.token;
    console.log("✅ Login successful\n");

    // Step 2: Test Transaction Success Rate endpoint
    console.log("2️⃣ Testing Transaction Success Rate endpoint...");
    const analyticsResponse = await axios.get(
      `${BASE_URL}/api/v1/seller/analytics/transaction-success-rate`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: {
          timeRange: "30d",
          groupBy: "day",
        },
      }
    );

    console.log("✅ API Response Status:", analyticsResponse.status);
    console.log("✅ API Response Success:", analyticsResponse.data.success);

    if (analyticsResponse.data.success) {
      const data = analyticsResponse.data.data;

      console.log("\n📊 Transaction Success Rate Data:");
      console.log("=====================================");

      // Overall statistics
      console.log("\n🎯 Overall Statistics:");
      console.log(`   Total Transactions: ${data.overall.totalTransactions}`);
      console.log(`   Successful: ${data.overall.successfulTransactions}`);
      console.log(`   Failed: ${data.overall.failedTransactions}`);
      console.log(`   Success Rate: ${data.overall.successRate}%`);
      console.log(`   Failure Rate: ${data.overall.failureRate}%`);

      // By transaction type
      console.log("\n💳 By Transaction Type:");
      console.log("   Funding Transactions:");
      console.log(
        `     Total: ${data.byTransactionType.funding.totalTransactions}`
      );
      console.log(
        `     Success Rate: ${data.byTransactionType.funding.successRate}%`
      );
      console.log("   Purchase Transactions:");
      console.log(
        `     Total: ${data.byTransactionType.purchase.totalTransactions}`
      );
      console.log(
        `     Success Rate: ${data.byTransactionType.purchase.successRate}%`
      );

      // Payment methods
      console.log("\n💰 Payment Methods:");
      if (data.byPaymentMethod && data.byPaymentMethod.length > 0) {
        data.byPaymentMethod.forEach((method) => {
          console.log(
            `   ${method.paymentMethod}: ${method.totalTransactions} transactions (${method.successRate}% success)`
          );
        });
      } else {
        console.log("   No payment method data available");
      }

      // Time trends
      console.log("\n📈 Time Trends:");
      if (data.timeTrends && data.timeTrends.length > 0) {
        console.log(`   Found ${data.timeTrends.length} time periods`);
        const recentTrends = data.timeTrends.slice(-3);
        recentTrends.forEach((trend) => {
          const periodStr = JSON.stringify(trend.period);
          console.log(
            `   ${periodStr}: ${trend.successRate}% success (${trend.totalTransactions} transactions)`
          );
        });
      } else {
        console.log("   No time trend data available");
      }

      // Failure analysis
      console.log("\n❌ Failure Analysis:");
      console.log(`   Total Failures: ${data.failureAnalysis.totalFailures}`);
      console.log(
        `   Transaction Failures: ${data.failureAnalysis.failuresByType.transactionFailures}`
      );
      console.log(
        `   Order Failures: ${data.failureAnalysis.failuresByType.orderFailures}`
      );

      if (
        data.failureAnalysis.topFailureReasons &&
        data.failureAnalysis.topFailureReasons.length > 0
      ) {
        console.log("   Top Failure Reasons:");
        data.failureAnalysis.topFailureReasons
          .slice(0, 3)
          .forEach((reason, index) => {
            console.log(
              `     ${index + 1}. ${reason.reason}: ${reason.count} (${
                reason.percentage
              }%)`
            );
          });
      }

      console.log(
        "\n✅ Transaction Success Rate API test completed successfully!"
      );
    } else {
      console.log("❌ API returned success: false");
      console.log("Response:", JSON.stringify(analyticsResponse.data, null, 2));
    }

    // Step 3: Test different parameters
    console.log("\n3️⃣ Testing different parameters...");

    const testParams = [
      { timeRange: "7d", groupBy: "day" },
      { timeRange: "90d", groupBy: "week" },
      { timeRange: "1y", groupBy: "month" },
    ];

    for (const params of testParams) {
      try {
        const testResponse = await axios.get(
          `${BASE_URL}/api/v1/seller/analytics/transaction-success-rate`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params,
          }
        );

        console.log(
          `✅ ${params.timeRange}/${params.groupBy}: Success (${testResponse.data.data.overall.totalTransactions} transactions)`
        );
      } catch (error) {
        console.log(
          `❌ ${params.timeRange}/${params.groupBy}: ${
            error.response?.data?.error || error.message
          }`
        );
      }
    }

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log("🔍 Authentication issue - check credentials");
    } else if (error.response?.status === 403) {
      console.log("🔍 Permission denied - user might not have seller role");
    } else if (error.response?.status === 404) {
      console.log("🔍 Endpoint not found - check if route is registered");
    } else if (error.response?.status === 500) {
      console.log("🔍 Server error - check backend logs");
    }
  }
}

// Run the test
testTransactionSuccessRate();
