const axios = require('axios');

async function simpleTest() {
  try {
    console.log('🔍 Testing login...');
    
    // test login with seller account
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: "darkpsinight@gmail.com",
      password: "12345678000aA!"
    });
    
    console.log('Login status:', loginResponse.status);
    console.log('Login success:', loginResponse.data.success);
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.accessToken;
      console.log('Got token, testing transaction success rate...');
      
      const analyticsResponse = await axios.get('http://localhost:3000/api/v1/seller/analytics/transaction-success-rate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Analytics status:', analyticsResponse.status);
      console.log('Analytics success:', analyticsResponse.data.success);
      console.log('Analytics data:', JSON.stringify(analyticsResponse.data.data, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

simpleTest();