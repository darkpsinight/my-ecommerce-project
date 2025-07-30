const mongoose = require('mongoose');
const { User } = require('../../models/user');

mongoose.connect('mongodb://localhost:27017/ecommerce');

setTimeout(async () => {
  try {
    console.log('🔍 Checking all sellers in database...');
    
    const sellers = await User.find({ roles: 'seller' });
    console.log(`Found ${sellers.length} sellers:`);
    
    sellers.forEach((seller, index) => {
      console.log(`${index + 1}. UID: ${seller.uid}`);
      console.log(`   Email: ${seller.email}`);
      console.log(`   Name: ${seller.firstName} ${seller.lastName}`);
      console.log('   ---');
    });
    
    console.log('\n💡 To see CTR data in dashboard:');
    console.log('1. Make sure you\'re logged in as one of these sellers');
    console.log('2. The seller must own the listing: 5b27caae-954b-413a-887d-79729746e4ff');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}, 1000);