const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testRoutes() {
  console.log('🔍 Testing view tracking routes...\n');

  // Test 1: Check if anonymous route exists
  console.log('🧪 TEST 1: Anonymous Route Availability');
  console.log('=====================================');
  
  try {
    // This should fail with validation error (missing required fields)
    // but it proves the route exists
    const response = await axios.post(`${BASE_URL}/viewed-products/anonymous`, {});
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Anonymous route exists (got validation error as expected)');
      console.log('   Error:', error.response.data.message);
    } else if (error.response?.status === 404) {
      console.log('❌ Anonymous route NOT FOUND');
    } else {
      console.log('❓ Unexpected error:', error.response?.data || error.message);
    }
  }

  console.log('\n🧪 TEST 2: Authenticated Route Availability');
  console.log('==========================================');
  
  try {
    // This should fail with auth error (no token provided)
    const response = await axios.post(`${BASE_URL}/viewed-products`, {});
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('✅ Authenticated route exists (got auth error as expected)');
      console.log('   Error:', error.response.data.message);
    } else if (error.response?.status === 404) {
      console.log('❌ Authenticated route NOT FOUND');
    } else {
      console.log('❓ Unexpected error:', error.response?.data || error.message);
    }
  }

  console.log('\n🧪 TEST 3: Route Registration Check');
  console.log('==================================');
  
  try {
    // Check if the base route exists
    const response = await axios.get(`${BASE_URL}/viewed-products`);
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('✅ Base route exists (got auth error as expected)');
    } else if (error.response?.status === 404) {
      console.log('❌ Base route NOT FOUND - routes may not be registered');
    } else {
      console.log('❓ Unexpected error:', error.response?.data || error.message);
    }
  }

  console.log('\n🏁 Route tests completed!');
}

testRoutes().catch(console.error);