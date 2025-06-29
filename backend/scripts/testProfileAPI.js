require('dotenv').config();
const axios = require('axios');

// Test the profile API endpoints
const testProfileAPI = async () => {
  try {
    console.log('Testing Profile API endpoints...\n');
    
    const baseURL = 'http://localhost:3000/api/v1/auth';
    
    // Test data for sign in
    const loginData = {
      email: 'barhoumi.ragheb@gmail.com', // Use the email from the migration
      password: '12345678000aA!' // You'll need to replace this with the actual password
    };
    
    console.log('1. Testing signin to get token...');
    let token;
    
    try {
      const signinResponse = await axios.post(`${baseURL}/signin`, loginData);
      token = signinResponse.data.accessToken;
      console.log('✅ Sign in successful');
    } catch (error) {
      console.log('❌ Sign in failed - you may need to update the password in the test script');
      console.log('   Or test manually by signing in through the UI first');
      console.log('   Error:', error.response?.data?.message || error.message);
      return;
    }
    
    console.log('\n2. Testing GET /account endpoint...');
    try {
      const accountResponse = await axios.get(`${baseURL}/account`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ GET /account successful');
      console.log('   Account data:', JSON.stringify(accountResponse.data, null, 2));
      
      // Check if displayName and username are NOT in response
      if (accountResponse.data.displayName === undefined && accountResponse.data.username === undefined) {
        console.log('✅ Confirmed: displayName and username fields are removed from response');
      } else {
        console.log('❌ Warning: displayName or username fields still present in response');
      }
      
    } catch (error) {
      console.log('❌ GET /account failed:', error.response?.data?.message || error.message);
      return;
    }
    
    console.log('\n3. Testing PUT /profile endpoint...');
    try {
      const updateData = {
        name: 'Updated Display Name',
        bio: 'This is my updated bio after the field cleanup'
      };
      
      const updateResponse = await axios.put(`${baseURL}/profile`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ PUT /profile successful');
      console.log('   Updated profile:', JSON.stringify(updateResponse.data, null, 2));
      
      // Verify the update worked
      if (updateResponse.data.profile && updateResponse.data.profile.name === updateData.name) {
        console.log('✅ Confirmed: name field updated correctly');
      } else {
        console.log('❌ Warning: name field update may not have worked correctly');
      }
      
    } catch (error) {
      console.log('❌ PUT /profile failed:', error.response?.data?.message || error.message);
      console.log('   Full error:', error.response?.data);
    }
    
    console.log('\n4. Testing GET /account again to verify changes...');
    try {
      const finalAccountResponse = await axios.get(`${baseURL}/account`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Final GET /account successful');
      console.log('   Final account data:', JSON.stringify(finalAccountResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ Final GET /account failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Profile API testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Instructions for manual testing
console.log('='.repeat(60));
console.log('PROFILE API TEST SCRIPT');
console.log('='.repeat(60));
console.log('');
console.log('BEFORE RUNNING THIS SCRIPT:');
console.log('1. Make sure the backend server is running on port 3000');
console.log('2. Update the password in this script or sign in manually first');
console.log('3. You can also test manually by:');
console.log('   - Going to http://localhost:3001/my-account');
console.log('   - Signing in with your account');
console.log('   - Testing the profile edit functionality');
console.log('');
console.log('Running automated tests...');
console.log('');

// Run the test
testProfileAPI();