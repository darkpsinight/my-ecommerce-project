const mongoose = require('mongoose');
const ViewedProduct = require('./models/viewedProduct');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testViewTracking() {
  try {
    console.log('🔍 VIEW TRACKING TEST: Starting...');
    
    // Test product ID (the one with no views currently)
    const testProductId = '5b27caae-954b-413a-887d-79729746e4ff';
    
    console.log(`🔍 Testing with product: ${testProductId}`);
    
    // Check current views
    const currentViews = await ViewedProduct.countDocuments({
      productId: testProductId,
      isDeleted: false
    });
    
    console.log(`🔍 Current views for this product: ${currentViews}`);
    
    // Simulate a view being tracked
    console.log('🔍 Simulating a product view...');
    
    const testView = await ViewedProduct.addOrUpdateView({
      userUid: null,
      anonymousId: 'test-user-' + Date.now(),
      productId: testProductId,
      metadata: {
        source: 'direct',
        deviceType: 'desktop',
        sessionId: 'test-session-' + Date.now(),
        viewDuration: 45000 // 45 seconds
      }
    });
    
    console.log('✅ Test view created:', {
      id: testView.externalId,
      productId: testView.productId,
      duration: testView.metadata?.viewDuration
    });
    
    // Check views again
    const newViews = await ViewedProduct.countDocuments({
      productId: testProductId,
      isDeleted: false
    });
    
    console.log(`🔍 Views after test: ${newViews}`);
    
    if (newViews > currentViews) {
      console.log('✅ View tracking is working!');
    } else {
      console.log('❌ View tracking might not be working properly');
    }
    
    // Now test the analytics for this seller
    console.log('\n🔍 Testing analytics after new view...');
    
    const { User } = require('./models/user');
    const { Listing } = require('./models/listing');
    
    const seller = await User.findOne({ uid: 'test-seller-analytics' });
    if (seller) {
      const listings = await Listing.find({
        sellerId: seller.uid,
        status: { $ne: 'deleted' }
      }).select('externalId');
      
      const listingIds = listings.map(l => l.externalId);
      
      const totalViews = await ViewedProduct.countDocuments({
        productId: { $in: listingIds },
        isDeleted: false
      });
      
      const totalViewsWithDuration = await ViewedProduct.countDocuments({
        productId: { $in: listingIds },
        isDeleted: false,
        'metadata.viewDuration': { $exists: true, $gt: 0 }
      });
      
      console.log(`📊 Seller analytics after test:`);
      console.log(`   Total views: ${totalViews}`);
      console.log(`   Views with duration: ${totalViewsWithDuration}`);
      
      // Calculate time metrics
      const now = new Date();
      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const timeAnalytics = await ViewedProduct.getTimeAnalytics(listingIds, startDate, now);
      
      if (timeAnalytics.length > 0) {
        const timeStats = timeAnalytics.reduce((acc, item) => {
          acc.totalTime += item.totalTimeSpent || 0;
          acc.totalViews += item.totalViews || 0;
          return acc;
        }, { totalTime: 0, totalViews: 0 });
        
        console.log(`   Total time spent: ${(timeStats.totalTime / 60000).toFixed(1)}m`);
        console.log(`   Views with duration: ${timeStats.totalViews}`);
      }
    }
    
  } catch (error) {
    console.error('🔍 VIEW TRACKING TEST: Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testViewTracking();