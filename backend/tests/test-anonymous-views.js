const axios = require('axios');

// Test script to add anonymous views
async function testAnonymousViews() {
  const baseUrl = 'http://localhost:3000/api/v1';
  
  // Test data
  const testViews = [
    {
      productId: 'your-listing-external-id', // Replace with actual listing external ID
      anonymousId: 'anon-user-1',
      metadata: {
        source: 'homepage',
        deviceType: 'desktop',
        sessionId: 'session-123',
        referrer: 'https://google.com'
      }
    },
    {
      productId: 'your-listing-external-id', // Replace with actual listing external ID
      anonymousId: 'anon-user-2',
      metadata: {
        source: 'search',
        deviceType: 'mobile',
        sessionId: 'session-456'
      }
    }
  ];

  try {
    console.log('Testing anonymous view tracking...');
    
    for (const viewData of testViews) {
      const response = await axios.post(`${baseUrl}/viewed-products/anonymous`, viewData);
      console.log(`✅ Added view for ${viewData.anonymousId}:`, response.data);
    }
    
    // Test duplicate view (should not create new record within 30 minutes)
    console.log('\nTesting duplicate view prevention...');
    const duplicateResponse = await axios.post(`${baseUrl}/viewed-products/anonymous`, testViews[0]);
    console.log('✅ Duplicate view handled:', duplicateResponse.data);
    
  } catch (error) {
    console.error('❌ Error testing anonymous views:', error.response?.data || error.message);
  }
}

// Run the test
testAnonymousViews();