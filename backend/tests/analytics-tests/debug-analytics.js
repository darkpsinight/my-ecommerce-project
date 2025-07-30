const mongoose = require('mongoose');
const ViewedProduct = require('../../models/viewedProduct');
const { Listing } = require('../../models/listing');
const { User } = require('../../models/user');
const { getSellerAnalyticsOverview } = require('../../handlers/sellerAnalyticsHandler');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugAnalytics() {
  try {
    console.log('🔍 DEBUG: Starting analytics debug...');
    
    // Get total viewed products count
    const totalViews = await ViewedProduct.countDocuments({ isDeleted: false });
    console.log('🔍 DEBUG: Total viewed products:', totalViews);
    
    // Get views with duration
    const viewsWithDuration = await ViewedProduct.countDocuments({
      isDeleted: false,
      'metadata.viewDuration': { $exists: true, $gt: 0 }
    });
    console.log('🔍 DEBUG: Views with duration:', viewsWithDuration);
    
    // Get active sessions
    const activeSessions = await ViewedProduct.countDocuments({
      isDeleted: false,
      'metadata.isActiveSession': true
    });
    console.log('🔍 DEBUG: Active sessions:', activeSessions);
    
    // Get sample viewed products
    const sampleViews = await ViewedProduct.find({ isDeleted: false })
      .sort({ viewedAt: -1 })
      .limit(5)
      .lean();
    
    console.log('🔍 DEBUG: Sample recent views:');
    sampleViews.forEach((view, index) => {
      console.log(`  ${index + 1}. Product: ${view.productId}`);
      console.log(`     User: ${view.userUid || 'anonymous'}`);
      console.log(`     Anonymous: ${view.anonymousId || 'none'}`);
      console.log(`     Viewed: ${view.viewedAt}`);
      console.log(`     Session: ${view.metadata?.sessionId || 'none'}`);
      console.log(`     Duration: ${view.metadata?.viewDuration || 'none'}`);
      console.log(`     Active: ${view.metadata?.isActiveSession}`);
      console.log('     ---');
    });
    
    // Test time analytics
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    // Get all product IDs
    const allProducts = await ViewedProduct.distinct('productId', { isDeleted: false });
    console.log('🔍 DEBUG: Unique products viewed:', allProducts.length);
    
    if (allProducts.length > 0) {
      console.log('🔍 DEBUG: Testing getTimeAnalytics...');
      const timeAnalytics = await ViewedProduct.getTimeAnalytics(allProducts, startDate, now);
      console.log('🔍 DEBUG: Time analytics result:', timeAnalytics);
    }
    
    // Check all sellers and their listings
    const sellers = await User.find({ roles: 'seller' });
    console.log('🔍 DEBUG: Total sellers:', sellers.length);
    
    for (const seller of sellers) {
      console.log(`🔍 DEBUG: Checking seller: ${seller.uid} (${seller.email})`);
      
      const sellerListings = await Listing.find({
        sellerId: seller.uid,
        status: { $ne: 'deleted' }
      }).select('externalId title platform').lean();
      
      console.log(`🔍 DEBUG: Seller ${seller.uid} has ${sellerListings.length} listings`);
      
      if (sellerListings.length > 0) {
        const listingIds = sellerListings.map(l => l.externalId);
        console.log('🔍 DEBUG: Sample listing IDs:', listingIds.slice(0, 3));
        
        const sellerViews = await ViewedProduct.countDocuments({
          productId: { $in: listingIds },
          isDeleted: false
        });
        console.log(`🔍 DEBUG: Views for seller ${seller.uid}:`, sellerViews);
        
        const sellerViewsWithDuration = await ViewedProduct.countDocuments({
          productId: { $in: listingIds },
          isDeleted: false,
          'metadata.viewDuration': { $exists: true, $gt: 0 }
        });
        console.log(`🔍 DEBUG: Views with duration for seller ${seller.uid}:`, sellerViewsWithDuration);
        
        if (sellerViewsWithDuration > 0) {
          const timeAnalytics = await ViewedProduct.getTimeAnalytics(listingIds, startDate, now);
          console.log(`🔍 DEBUG: Time analytics for seller ${seller.uid}:`, timeAnalytics);
          
          // Calculate the same metrics as the analytics handler
          let avgTimeOnPage = 0;
          let totalTimeSpent = 0;
          let viewsWithDuration = 0;
          
          if (timeAnalytics.length > 0) {
            const timeStats = timeAnalytics.reduce((acc, item) => {
              acc.totalTime += item.totalTimeSpent || 0;
              acc.totalViews += item.totalViews || 0;
              return acc;
            }, { totalTime: 0, totalViews: 0 });
            
            avgTimeOnPage = timeStats.totalViews > 0 ? timeStats.totalTime / timeStats.totalViews : 0;
            totalTimeSpent = timeStats.totalTime;
            viewsWithDuration = timeStats.totalViews;
          }
          
          console.log(`🔍 DEBUG: Final metrics for seller ${seller.uid}:`);
          console.log(`  - avgTimeOnPage: ${(avgTimeOnPage / 1000).toFixed(1)}s`);
          console.log(`  - totalTimeSpent: ${(totalTimeSpent / 60000).toFixed(1)}m`);
          console.log(`  - viewsWithDuration: ${viewsWithDuration}`);
        }
        console.log('---');
      }
    }
    
    // Test the actual API handler
    console.log('🔍 DEBUG: Testing actual API handler...');
    const testSeller = sellers[0];
    if (testSeller) {
      // Mock request and reply objects
      const mockRequest = {
        user: { uid: testSeller.uid },
        query: { timeRange: '30d' },
        log: { info: () => {}, error: () => {} }
      };
      
      const mockReply = {
        code: () => mockReply,
        send: (data) => {
          console.log('🔍 DEBUG: API Response:', JSON.stringify(data, null, 2));
          if (data.success && data.data && data.data.engagement) {
            const engagement = data.data.engagement;
            console.log('🔍 DEBUG: Engagement metrics from API:');
            console.log(`  - totalTimeSpent: ${engagement.totalTimeSpent}m`);
            console.log(`  - viewsWithDuration: ${engagement.viewsWithDuration}`);
            console.log(`  - avgTimeOnPage: ${engagement.avgTimeOnPage}s`);
          }
          return mockReply;
        }
      };
      
      try {
        await getSellerAnalyticsOverview(mockRequest, mockReply);
      } catch (error) {
        console.error('🔍 DEBUG: API handler error:', error);
      }
    }
    
  } catch (error) {
    console.error('🔍 DEBUG: Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugAnalytics();