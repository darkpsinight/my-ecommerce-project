const mongoose = require('mongoose');
const ListingImpression = require('../../../models/listingImpression');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

let lastCount = 0;

async function checkImpressions() {
  try {
    const currentCount = await ListingImpression.countDocuments();
    
    if (currentCount !== lastCount) {
      console.log(`📊 Impression count changed: ${lastCount} → ${currentCount}`);
      
      if (currentCount > lastCount) {
        // Get the latest impressions
        const newImpressions = await ListingImpression.find()
          .sort({ impressionAt: -1 })
          .limit(currentCount - lastCount);
        
        console.log('🆕 New impressions:');
        newImpressions.reverse().forEach((imp, index) => {
          console.log(`   ${index + 1}. Product: ${imp.productId}, Source: ${imp.metadata?.source}, Position: ${imp.metadata?.position}, Clicked: ${imp.wasClicked}`);
        });
      }
      
      lastCount = currentCount;
    }
  } catch (error) {
    console.error('❌ Error checking impressions:', error);
  }
}

console.log('🔍 Monitoring impressions in real-time...');
console.log('👀 Go browse products at http://localhost:3001/products');
console.log('Press Ctrl+C to stop monitoring\n');

// Check every 2 seconds
setInterval(checkImpressions, 2000);

// Initial check
checkImpressions();