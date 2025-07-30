const axios = require('axios');

// Test data - using existing seller account
const testUser = {
  email: "darkpsinight@gmail.com",
  password: "12345678000aA!",
};

async function testTransactionSuccessRateAPI() {
  try {
    console.log('🔍 Testing Transaction Success Rate API...');
    
    // First, login to get auth token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', testUser);
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const authToken = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    
    // Test the transaction success rate endpoint
    console.log('📊 Testing transaction success rate analytics...');
    
    const response = await axios.get('http://localhost:3000/api/v1/seller/analytics/transaction-success-rate', {
      params: {
        timeRange: '30d',
        groupBy: 'day'
      },
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Success:', response.data.success);
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      console.log('\n📈 Transaction Success Rate Analytics:');
      console.log('==========================================');
      
      // Overall stats
      console.log('\n🎯 Overall Statistics:');
      console.log(`  - Total Transactions: ${data.overall.totalTransactions}`);
      console.log(`  - Successful Transactions: ${data.overall.successfulTransactions}`);
      console.log(`  - Failed Transactions: ${data.overall.failedTransactions}`);
      console.log(`  - Success Rate: ${data.overall.successRate}%`);
      console.log(`  - Failure Rate: ${data.overall.failureRate}%`);
      
      // By transaction type
      console.log('\n💳 By Transaction Type:');
      console.log('  Funding Transactions:');
      console.log(`    - Total: ${data.byTransactionType.funding.totalTransactions}`);
      console.log(`    - Success Rate: ${data.byTransactionType.funding.successRate}%`);
      console.log('  Purchase Transactions:');
      console.log(`    - Total: ${data.byTransactionType.purchase.totalTransactions}`);
      console.log(`    - Success Rate: ${data.byTransactionType.purchase.successRate}%`);
      
      // By payment method
      console.log('\n💰 By Payment Method:');
      if (data.byPaymentMethod && data.byPaymentMethod.length > 0) {
        data.byPaymentMethod.forEach(method => {
          console.log(`  ${method.paymentMethod}:`);
          console.log(`    - Total: ${method.totalTransactions}`);
          console.log(`    - Success Rate: ${method.successRate}%`);
        });
      } else {
        console.log('  No payment method data available');
      }
      
      // Time trends
      console.log('\n📅 Time Trends:');
      if (data.timeTrends && data.timeTrends.length > 0) {
        console.log(`  Found ${data.timeTrends.length} time periods`);
        // Show last 3 periods
        const recentTrends = data.timeTrends.slice(-3);
        recentTrends.forEach(trend => {
          const periodStr = JSON.stringify(trend.period);
          console.log(`    ${periodStr}: ${trend.successRate}% success rate (${trend.totalTransactions} transactions)`);
        });
      } else {
        console.log('  No time trend data available');
      }
      
      // Failure analysis
      console.log('\n❌ Failure Analysis:');
      console.log(`  - Total Failures: ${data.failureAnalysis.totalFailures}`);
      if (data.failureAnalysis.topFailureReasons && data.failureAnalysis.topFailureReasons.length > 0) {
        console.log('  Top Failure Reasons:');
        data.failureAnalysis.topFailureReasons.forEach((reason, index) => {
          console.log(`    ${index + 1}. ${reason.reason}: ${reason.count} occurrences (${reason.percentage}%)`);
        });
      } else {
        console.log('  No failure reasons available');
      }
      
      console.log('\n✅ Transaction Success Rate API test completed successfully!');
    } else {
      console.log('❌ No data returned from API');
    }
    
    // Test different parameters
    console.log('\n🔄 Testing different parameters...');
    
    const testParams = [
      { timeRange: '7d', groupBy: 'day' },
      { timeRange: '90d', groupBy: 'week' },
      { timeRange: '1y', groupBy: 'month' }
    ];
    
    for (const params of testParams) {
      try {
        const testResponse = await axios.get('http://localhost:3000/api/v1/seller/analytics/transaction-success-rate', {
          params,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ ${params.timeRange} / ${params.groupBy}: ${testResponse.data.success ? 'Success' : 'Failed'}`);
        if (testResponse.data.data) {
          console.log(`   Total transactions: ${testResponse.data.data.overall.totalTransactions}`);
          console.log(`   Success rate: ${testResponse.data.data.overall.successRate}%`);
        }
      } catch (error) {
        console.log(`❌ ${params.timeRange} / ${params.groupBy}: ${error.response?.data?.error || error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔍 Authentication failed. Check credentials.');
    } else if (error.response?.status === 403) {
      console.log('🔍 Access denied. User might not have seller role.');
    } else if (error.response?.status === 404) {
      console.log('🔍 Endpoint not found. Check if the route is properly registered.');
    }
  }
}

// Test error cases
async function testErrorCases() {
  try {
    console.log('\n🧪 Testing error cases...');
    
    // Test without authentication
    try {
      await axios.get('http://localhost:3000/api/v1/seller/analytics/transaction-success-rate');
      console.log('❌ Should have failed without auth');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected request without authentication');
      } else {
        console.log(`❌ Unexpected error: ${error.response?.status}`);
      }
    }
    
    // Test with invalid parameters
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', testUser);
    const authToken = loginResponse.data.data.accessToken;
    
    try {
      await axios.get('http://localhost:3000/api/v1/seller/analytics/transaction-success-rate?timeRange=invalid', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      console.log('❌ Should have failed with invalid timeRange');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected invalid timeRange parameter');
      } else {
        console.log(`❌ Unexpected error for invalid timeRange: ${error.response?.status}`);
      }
    }
    
    try {
      await axios.get('http://localhost:3000/api/v1/seller/analytics/transaction-success-rate?groupBy=invalid', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      console.log('❌ Should have failed with invalid groupBy');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected invalid groupBy parameter');
      } else {
        console.log(`❌ Unexpected error for invalid groupBy: ${error.response?.status}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing error cases:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Transaction Success Rate API Tests');
  console.log('==============================================\n');
  
  await testTransactionSuccessRateAPI();
  await testErrorCases();
  
  console.log('\n🏁 All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testTransactionSuccessRateAPI,
  testErrorCases,
  runAllTests
};