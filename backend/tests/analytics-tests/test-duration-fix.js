const mongoose = require('mongoose');
const ViewedProduct = require('../../models/viewedProduct');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testDurationFix() {
  try {
    console.log('🔍 DURATION FIX TEST: Starting...');
    
    // Test product ID - use your new listing
    const testProductId = '3cc46eb1-74b8-4dd0-9c81-9225b45c304e'; // "product for testing views duration analytics"
    
    console.log(`🔍 Testing with product: ${testProductId}`);
    
    // Check current views
    const currentViews = await ViewedProduct.countDocuments({
      productId: testProductId,
      isDeleted: false
    });
    
    const currentViewsWithDuration = await ViewedProduct.countDocuments({
      productId: testProductId,
      isDeleted: false,
      'metadata.viewDuration': { $exists: true, $gt: 0 }
    });
    
    console.log(`🔍 Current views: ${currentViews} (${currentViewsWithDuration} with duration)`);
    
    // Simulate the new unified tracking approach
    console.log('🔍 Simulating unified duration tracking...');
    
    const testView = await ViewedProduct.addOrUpdateView({
      userUid: null,
      anonymousId: 'test-duration-fix-' + Date.now(),
      productId: testProductId,
      metadata: {
        source: 'direct',
        deviceType: 'desktop',
        sessionId: 'test-session-duration-' + Date.now(),
        viewDuration: 15000 // 15 seconds
      }
    });
    
    console.log('✅ Test view created with duration:', {
      id: testView.externalId,
      productId: testView.productId,
      duration: testView.metadata?.viewDuration
    });
    
    // Check views again
    const newViews = await ViewedProduct.countDocuments({
      productId: testProductId,
      isDeleted: false
    });
    
    const newViewsWithDuration = await ViewedProduct.countDocuments({
      productId: testProductId,
      isDeleted: false,
      'metadata.viewDuration': { $exists: true, $gt: 0 }
    });
    
    console.log(`🔍 Views after test: ${newViews} (${newViewsWithDuration} with duration)`);
    
    if (newViewsWithDuration > currentViewsWithDuration) {
      console.log('✅ Duration tracking is working!');
      
      // Test analytics calculation
      const now = new Date();
      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const timeAnalytics = await ViewedProduct.getTimeAnalytics([testProductId], startDate, now);
      console.log('📊 Time analytics for test product:', timeAnalytics);
      
      if (timeAnalytics.length > 0) {
        const analytics = timeAnalytics[0];
        console.log('📊 Analytics summary:');
        console.log(`   - Total views with duration: ${analytics.totalViews}`);
        console.log(`   - Total time spent: ${analytics.totalTimeSpentMinutes.toFixed(1)}m`);
        console.log(`   - Average time on page: ${analytics.avgTimeOnPageSeconds.toFixed(1)}s`);
      }
    } else {
      console.log('❌ Duration tracking might not be working properly');
    }
    
  } catch (error) {
    console.error('🔍 DURATION FIX TEST: Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDurationFix();