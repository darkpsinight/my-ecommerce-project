const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const LISTING_ID = '04a00933-5ff4-43f6-8744-0efb2d56f2e1'; // Your test listing

async function testViewTrackingFixes() {
  console.log('🔍 Testing View Tracking Fixes...\n');
  console.log(`Using listing ID: ${LISTING_ID}\n`);

  // Test 1: Anonymous user view tracking
  console.log('🧪 TEST 1: Anonymous User View Tracking');
  console.log('==========================================');
  
  try {
    const anonymousId = `test-anon-${Date.now()}`;
    console.log(`Using anonymous ID: ${anonymousId}`);
    
    // First anonymous view
    console.log('\n📤 Making first anonymous view request...');
    const response1 = await axios.post(`${BASE_URL}/viewed-products/anonymous`, {
      productId: LISTING_ID,
      anonymousId: anonymousId,
      metadata: {
        source: 'direct',
        deviceType: 'desktop',
        sessionId: 'test-session-1'
      }
    });
    console.log('✅ First anonymous view response:', response1.data);

    // Wait 2 seconds and try again (should update existing record, not create new)
    console.log('\n⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📤 Making second anonymous view request (should update existing)...');
    const response2 = await axios.post(`${BASE_URL}/viewed-products/anonymous`, {
      productId: LISTING_ID,
      anonymousId: anonymousId,
      metadata: {
        source: 'direct',
        deviceType: 'desktop',
        sessionId: 'test-session-1'
      }
    });
    console.log('✅ Second anonymous view response:', response2.data);
    
    // Check if the same view record was updated
    if (response1.data.data.viewId === response2.data.data.viewId) {
      console.log('✅ SUCCESS: Same view record updated (no duplicate created)');
    } else {
      console.log('❌ ISSUE: Different view records created (duplicate issue still exists)');
    }

  } catch (error) {
    console.error('❌ Anonymous view test failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Check analytics to see if views are counted
  console.log('🧪 TEST 2: Check Analytics (requires seller auth token)');
  console.log('====================================================');
  
  console.log('⚠️  To test analytics, you need to:');
  console.log('1. Get a valid JWT token for the seller who owns this listing');
  console.log('2. Run: curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/v1/seller/analytics/overview?timeRange=30d');
  console.log('3. Check the "engagement" section in the response');

  console.log('\n🏁 Tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Check the backend server logs for detailed debugging info');
  console.log('2. Test the frontend by browsing the product page while not logged in');
  console.log('3. Test the frontend by browsing the product page while logged in');
  console.log('4. Check the seller analytics dashboard for updated view counts');
}

testViewTrackingFixes().catch(console.error);