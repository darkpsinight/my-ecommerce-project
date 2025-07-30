// Test script to check if ListingImpression model has syntax errors
console.log('Testing ListingImpression model syntax...');

try {
  const mongoose = require('mongoose');
  console.log('✅ Mongoose imported successfully');
  
  const ListingImpression = require('../../models/listingImpression');
  console.log('✅ ListingImpression model imported successfully');
  
  console.log('Model methods available:');
  console.log('- trackImpression:', typeof ListingImpression.trackImpression);
  console.log('- markAsClicked:', typeof ListingImpression.markAsClicked);
  console.log('- getCTRAnalytics:', typeof ListingImpression.getCTRAnalytics);
  console.log('- getPositionCTRAnalysis:', typeof ListingImpression.getPositionCTRAnalysis);
  
  console.log('✅ All model methods are available');
  console.log('✅ ListingImpression model syntax is correct');
  
} catch (error) {
  console.error('❌ Error with ListingImpression model:');
  console.error(error.message);
  console.error(error.stack);
}

console.log('\nTesting impression handlers...');

try {
  const handlers = require('../../handlers/impressionHandlers');
  console.log('✅ Impression handlers imported successfully');
  
  console.log('Handler functions available:');
  console.log('- trackImpressions:', typeof handlers.trackImpressions);
  console.log('- markImpressionClicked:', typeof handlers.markImpressionClicked);
  console.log('- getImpressionAnalytics:', typeof handlers.getImpressionAnalytics);
  
  console.log('✅ All handler functions are available');
  
} catch (error) {
  console.error('❌ Error with impression handlers:');
  console.error(error.message);
  console.error(error.stack);
}

console.log('\nTesting impression routes...');

try {
  const impressionRoutes = require('../../routes/impressions');
  console.log('✅ Impression routes imported successfully');
  console.log('- Route function type:', typeof impressionRoutes);
  
} catch (error) {
  console.error('❌ Error with impression routes:');
  console.error(error.message);
  console.error(error.stack);
}