const mongoose = require('mongoose');
const ListingImpression = require('../../../models/listingImpression');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

setTimeout(async () => {
  try {
    console.log('🗑️ Clearing test impression data...');
    
    const result = await ListingImpression.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} impression records`);
    
    console.log('\n🎯 Now test the real impression tracking:');
    console.log('1. Go to http://localhost:3001/products');
    console.log('2. Browse products and click on some');
    console.log('3. Check your dashboard: http://localhost:3002/dashboards/analytics/engagement');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error clearing impressions:', error);
    mongoose.connection.close();
  }
}, 1000);