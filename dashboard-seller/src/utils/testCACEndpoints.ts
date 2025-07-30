// Simple test utility to verify CAC endpoints from frontend
import { analyticsApi } from '../services/api/analytics';

export const testCACEndpoints = async () => {
  console.log('🧪 Testing CAC endpoints from frontend...');
  
  try {
    // Test 1: Get CAC Analytics
    console.log('1. Testing CAC Analytics endpoint...');
    const cacResponse = await analyticsApi.getCACAnalytics({ timeRange: '30d' });
    console.log('✅ CAC Analytics:', {
      totalSpend: cacResponse.data.cac.totalMarketingSpend,
      newCustomers: cacResponse.data.cac.newCustomersAcquired,
      overallCAC: cacResponse.data.cac.overallCAC,
      channelsCount: cacResponse.data.cac.spendByChannel.length
    });

    // Test 2: Get Marketing Spend
    console.log('2. Testing Marketing Spend endpoint...');
    const spendResponse = await analyticsApi.getMarketingSpend({ limit: 5 });
    console.log('✅ Marketing Spend:', {
      entriesCount: spendResponse.data.spendEntries.length,
      totalPages: spendResponse.data.pagination.pages
    });

    // Test 3: Add Marketing Spend (optional - uncomment to test)
    /*
    console.log('3. Testing Add Marketing Spend endpoint...');
    const testSpend = {
      amount: 75.50,
      currency: 'USD' as const,
      channel: 'facebook_ads',
      campaignName: 'Frontend Test Campaign',
      description: 'Test from frontend',
      spendDate: new Date().toISOString().split('T')[0],
      periodStart: new Date().toISOString().split('T')[0],
      periodEnd: new Date().toISOString().split('T')[0]
    };
    
    const addResponse = await analyticsApi.addMarketingSpend(testSpend);
    console.log('✅ Add Marketing Spend:', {
      success: addResponse.success,
      amount: addResponse.data.amount,
      channel: addResponse.data.channel
    });
    */

    console.log('🎉 All frontend CAC endpoint tests passed!');
    return true;
  } catch (error: any) {
    console.error('❌ Frontend CAC endpoint test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
};

// Function to test from browser console
(window as any).testCAC = testCACEndpoints;