// Test script to check if impression handlers are properly exported
console.log('Testing impression handlers...');

try {
  const handlers = require('../../handlers/impressionHandlers');
  
  console.log('Handlers object:', Object.keys(handlers));
  console.log('trackImpressions type:', typeof handlers.trackImpressions);
  console.log('markImpressionClicked type:', typeof handlers.markImpressionClicked);
  console.log('getImpressionAnalytics type:', typeof handlers.getImpressionAnalytics);
  
  if (typeof handlers.trackImpressions === 'function') {
    console.log('✅ trackImpressions is a function');
  } else {
    console.log('❌ trackImpressions is not a function');
  }
  
  if (typeof handlers.markImpressionClicked === 'function') {
    console.log('✅ markImpressionClicked is a function');
  } else {
    console.log('❌ markImpressionClicked is not a function');
  }
  
  if (typeof handlers.getImpressionAnalytics === 'function') {
    console.log('✅ getImpressionAnalytics is a function');
  } else {
    console.log('❌ getImpressionAnalytics is not a function');
  }
  
} catch (error) {
  console.error('❌ Error importing handlers:', error.message);
  console.error(error.stack);
}

console.log('\nTesting routes...');

try {
  const impressionRoutes = require('../../routes/impressions');
  console.log('Routes function type:', typeof impressionRoutes);
  
  if (typeof impressionRoutes === 'function') {
    console.log('✅ impressionRoutes is a function');
  } else {
    console.log('❌ impressionRoutes is not a function');
  }
  
} catch (error) {
  console.error('❌ Error importing routes:', error.message);
  console.error(error.stack);
}