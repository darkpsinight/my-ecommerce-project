const axios = require('axios');

async function testAutocomplete() {
  try {
    console.log('Testing autocomplete endpoint...');
    
    // Test with different search terms
    const testQueries = ['steam', 'play', 'game', 'xbox'];
    
    for (const query of testQueries) {
      console.log(`\nTesting query: "${query}"`);
      
      try {
        const response = await axios.get(`http://localhost:3000/api/v1/public/search-suggestions?q=${query}&limit=5`);
        
        if (response.data.success) {
          console.log(`✅ Success! Found ${response.data.data.length} suggestions:`);
          response.data.data.forEach((suggestion, index) => {
            console.log(`  ${index + 1}. ${suggestion.text} (${suggestion.category})`);
          });
        } else {
          console.log('❌ API returned unsuccessful response:', response.data);
        }
      } catch (error) {
        if (error.response) {
          console.log('❌ API Error:', error.response.status, error.response.data);
        } else {
          console.log('❌ Network Error:', error.message);
        }
      }
    }
    
    // Test listings endpoint to see if there's any data
    console.log('\n\nTesting listings endpoint...');
    try {
      const response = await axios.get('http://localhost:3000/api/v1/listings?limit=3');
      if (response.data.success) {
        console.log(`✅ Found ${response.data.data.listings.length} listings`);
        response.data.data.listings.forEach((listing, index) => {
          console.log(`  ${index + 1}. ${listing.title} - ${listing.platform}`);
        });
      } else {
        console.log('❌ Listings API returned unsuccessful response:', response.data);
      }
    } catch (error) {
      if (error.response) {
        console.log('❌ Listings API Error:', error.response.status, error.response.data);
      } else {
        console.log('❌ Listings Network Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAutocomplete();