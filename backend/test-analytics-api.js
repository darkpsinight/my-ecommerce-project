const axios = require('axios');

async function testAnalyticsAPI() {
  try {
    console.log('🔍 Testing analytics API...');
    
    // You'll need to get a valid JWT token for a seller
    // For now, let's try without auth to see the error
    const response = await axios.get('http://localhost:3000/api/v1/seller/analytics/overview', {
      params: {
        timeRange: '30d'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response:', response.data);
    
    if (response.data.success && response.data.data.engagement) {
      const engagement = response.data.data.engagement;
      console.log('🔍 Engagement data:');
      console.log(`  - totalTimeSpent: ${engagement.totalTimeSpent}m`);
      console.log(`  - viewsWithDuration: ${engagement.viewsWithDuration}`);
      console.log(`  - avgTimeOnPage: ${engagement.avgTimeOnPage}s`);
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔍 Need authentication. The API requires a valid JWT token.');
    }
  }
}

testAnalyticsAPI();