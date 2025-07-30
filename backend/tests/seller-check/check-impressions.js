const mongoose = require('mongoose');
const ListingImpression = require('../../models/listingImpression');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

setTimeout(async () => {
  try {
    console.log('🔍 Checking impression records...');
    
    // Count total impressions
    const totalImpressions = await ListingImpression.countDocuments();
    console.log(`Total impressions in database: ${totalImpressions}`);
    
    if (totalImpressions > 0) {
      // Get some sample impressions
      const sampleImpressions = await ListingImpression.find()
        .limit(5)
        .sort({ impressionAt: -1 });
      
      console.log('\nSample impressions:');
      sampleImpressions.forEach((imp, index) => {
        console.log(`  ${index + 1}. Product: ${imp.productId}, Source: ${imp.metadata?.source}, Clicked: ${imp.wasClicked}, Date: ${imp.impressionAt}`);
      });
      
      // Check for your specific products
      const yourProductIds = [
        'fa1a33cd-1092-4fac-ad5e-a016c0260d3c',
        '205f9079-dcc1-4642-8806-3c0fa4c6c09c',
        '5dcbf318-0d87-44af-9022-3556d580c162'
      ];
      
      const yourImpressions = await ListingImpression.find({
        productId: { $in: yourProductIds }
      });
      
      console.log(`\nImpressions for your products: ${yourImpressions.length}`);
      if (yourImpressions.length > 0) {
        yourImpressions.forEach((imp, index) => {
          console.log(`  ${index + 1}. Product: ${imp.productId}, Source: ${imp.metadata?.source}, Clicked: ${imp.wasClicked}`);
        });
      }
    } else {
      console.log('\n❌ No impression records found in database!');
      console.log('This means impression tracking is not working when you browse products.');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    mongoose.connection.close();
  }
}, 1000);