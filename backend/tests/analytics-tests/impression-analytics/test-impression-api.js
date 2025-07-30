const axios = require('axios');

async function testImpressionAPI() {
  try {
    console.log('🔍 Testing impression tracking API...');
    
    const testData = {
      impressions: [{
        productId: 'test-product-123',
        source: 'search_results',
        position: 1,
        deviceType: 'desktop',
        sessionId: 'test-session',
        pageUrl: 'http://localhost:3001/products',
        referrer: '',
        viewport: {
          isAboveFold: true,
          scrollPosition: 0,
          viewportHeight: 945,
          elementPosition: 502
        }
      }],
      anonymousId: 'test-anon-id'
    };
    
    console.log('📤 Sending test impression to: http://localhost:3000/api/v1/impressions/track');
    
    const response = await axios.post('http://localhost:3000/api/v1/impressions/track', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response:', response.status, response.data);
    
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running on port 3000');
    }
  }
}

testImpressionAPI();