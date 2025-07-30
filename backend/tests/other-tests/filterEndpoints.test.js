const http = require('http');
const url = require('url');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = '/api/v1';

// Simple HTTP client
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${API_BASE}${path}`;
    const parsedUrl = url.parse(fullUrl);
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test functions
async function testFilterOptions() {
  console.log('\n=== Testing Filter Options Endpoint ===');
  
  try {
    const response = await makeRequest('/public/filter-options');
    
    console.log(`Status Code: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Filter options endpoint working!');
      console.log(`Categories found: ${response.data.data.categories.length}`);
      console.log(`Platforms found: ${response.data.data.platforms.length}`);
      console.log(`Regions found: ${response.data.data.regions.length}`);
      console.log(`Price range: ${response.data.data.priceRange.min} - ${response.data.data.priceRange.max}`);
    } else {
      console.log('❌ Filter options endpoint failed!');
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Error testing filter options:', error.message);
    console.log('Full error:', error);
  }
}

async function testPriceRange() {
  console.log('\n=== Testing Price Range Endpoint ===');
  
  try {
    const response = await makeRequest('/public/price-range');
    
    console.log(`Status Code: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Price range endpoint working!');
      console.log(`Price range: ${response.data.data.min} - ${response.data.data.max}`);
    } else {
      console.log('❌ Price range endpoint failed!');
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Error testing price range:', error.message);
  }
}

async function testPriceRangeWithFilters() {
  console.log('\n=== Testing Price Range with Filters ===');
  
  try {
    const response = await makeRequest('/public/price-range?search=game&platform=Steam');
    
    console.log(`Status Code: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Price range with filters endpoint working!');
      console.log(`Filtered price range: ${response.data.data.min} - ${response.data.data.max}`);
    } else {
      console.log('❌ Price range with filters endpoint failed!');
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Error testing price range with filters:', error.message);
  }
}

async function testListingsWithFilters() {
  console.log('\n=== Testing Listings with Enhanced Filters ===');
  
  try {
    const response = await makeRequest('/listings?sortBy=price_low&limit=5');
    
    console.log(`Status Code: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Listings with enhanced filters working!');
      console.log(`Found ${response.data.data.listings.length} listings`);
      if (response.data.data.listings.length > 0) {
        console.log(`First listing: ${response.data.data.listings[0].title} - $${response.data.data.listings[0].price}`);
      }
    } else {
      console.log('❌ Listings with enhanced filters failed!');
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Error testing listings with filters:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting Filter Endpoints Tests...');
  
  await testFilterOptions();
  await testPriceRange();
  await testPriceRangeWithFilters();
  await testListingsWithFilters();
  
  console.log('\n🏁 All tests completed!');
}

// Run the tests
runAllTests().catch(console.error);