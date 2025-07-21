const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Test scenarios
async function debugViewTracking() {
  console.log('🔍 Starting view tracking debug tests...\n');

  // You need to replace these with actual values from your system
  const LISTING_ID = process.argv[2] || 'your-actual-listing-external-id'; // Pass as command line argument
  const AUTH_TOKEN = process.argv[3] || 'your-actual-jwt-token'; // Pass as command line argument

  console.log('📋 Test Configuration:');
  console.log(`- Listing ID: ${LISTING_ID}`);
  console.log(`- Auth Token: ${AUTH_TOKEN ? 'PROVIDED' : 'MISSING'}`);
  console.log('');

  // Test 1: Anonymous user view tracking
  console.log('🧪 TEST 1: Anonymous User View Tracking');
  console.log('==========================================');
  
  try {
    const anonymousId = 'debug-anon-' + Date.now();
    console.log(`Using anonymous ID: ${anonymousId}`);
    
    // First anonymous view
    console.log('\n📤 Making first anonymous view request...');
    const response1 = await axios.post(`${BASE_URL}/viewed-products/anonymous`, {
      productId: LISTING_ID,
      anonymousId: anonymousId,
      metadata: {
        source: 'debug-test',
        deviceType: 'desktop',
        sessionId: 'debug-session-1'
      }
    });
    console.log('✅ First anonymous view response:', response1.data);

    // Wait 2 seconds and try again (should update existing record)
    console.log('\n⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📤 Making second anonymous view request (should update existing)...');
    const response2 = await axios.post(`${BASE_URL}/viewed-products/anonymous`, {
      productId: LISTING_ID,
      anonymousId: anonymousId,
      metadata: {
        source: 'debug-test',
        deviceType: 'desktop',
        sessionId: 'debug-session-1'
      }
    });
    console.log('✅ Second anonymous view response:', response2.data);
    
    // Check if the viewedAt times are different (should be updated)
    const time1 = new Date(response1.data.data.viewedAt);
    const time2 = new Date(response2.data.data.viewedAt);
    console.log(`\n🕐 First view time: ${time1.toISOString()}`);
    console.log(`🕐 Second view time: ${time2.toISOString()}`);
    console.log(`📊 Time difference: ${time2 - time1}ms`);
    
    if (response1.data.data.viewId === response2.data.data.viewId) {
      console.log('✅ PASS: Same view record updated (no duplicate created)');
    } else {
      console.log('❌ FAIL: Different view records created (duplicate issue)');
    }

  } catch (error) {
    console.error('❌ Anonymous view test failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Authenticated user view tracking
  console.log('🧪 TEST 2: Authenticated User View Tracking');
  console.log('==========================================');
  
  if (!AUTH_TOKEN || AUTH_TOKEN === 'your-actual-jwt-token') {
    console.log('⚠️  SKIPPED: No valid auth token provided');
    console.log('   Please replace AUTH_TOKEN in the script with a real JWT token');
  } else {
    try {
      // First authenticated view
      console.log('\n📤 Making first authenticated view request...');
      const response1 = await axios.post(`${BASE_URL}/viewed-products`, {
        productId: LISTING_ID,
        metadata: {
          source: 'debug-test',
          deviceType: 'desktop',
          sessionId: 'debug-session-auth-1'
        }
      }, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ First authenticated view response:', response1.data);

      // Wait 2 seconds and try again (should update existing record)
      console.log('\n⏳ Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('📤 Making second authenticated view request (should update existing)...');
      const response2 = await axios.post(`${BASE_URL}/viewed-products`, {
        productId: LISTING_ID,
        metadata: {
          source: 'debug-test',
          deviceType: 'desktop',
          sessionId: 'debug-session-auth-1'
        }
      }, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Second authenticated view response:', response2.data);
      
      // Check if the viewedAt times are different (should be updated)
      const time1 = new Date(response1.data.data.viewedAt);
      const time2 = new Date(response2.data.data.viewedAt);
      console.log(`\n🕐 First view time: ${time1.toISOString()}`);
      console.log(`🕐 Second view time: ${time2.toISOString()}`);
      console.log(`📊 Time difference: ${time2 - time1}ms`);
      
      if (response1.data.data.viewId === response2.data.data.viewId) {
        console.log('✅ PASS: Same view record updated (no duplicate created)');
      } else {
        console.log('❌ FAIL: Different view records created (duplicate issue)');
      }

    } catch (error) {
      console.error('❌ Authenticated view test failed:', error.response?.data || error.message);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');
  console.log('🏁 Debug tests completed!');
  console.log('\n📝 Instructions:');
  console.log('1. Check the server logs for detailed debugging information');
  console.log('2. Replace LISTING_ID and AUTH_TOKEN with real values');
  console.log('3. Run this script while monitoring server logs');
  console.log('4. Check your seller analytics dashboard to see if view counts are correct');
}

// Helper function to get a real listing ID from the database
async function getTestListingId() {
  console.log('🔍 Fetching a test listing ID...');
  try {
    // This would require database connection, but for now just return placeholder
    return 'your-actual-listing-external-id';
  } catch (error) {
    console.error('Failed to get test listing ID:', error.message);
    return null;
  }
}

// Run the debug tests
debugViewTracking().catch(console.error);