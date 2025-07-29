const mongoose = require('mongoose');
const { User } = require('./models/user');
const { Listing } = require('./models/listing');
const ViewedProduct = require('./models/viewedProduct');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkCurrentSeller() {
  try {
    console.log('🔍 SELLER CHECK: Finding all sellers and their data...');
    
    const sellers = await User.find({ roles: 'seller' });
    console.log(`🔍 SELLER CHECK: Found ${sellers.length} sellers`);
    
    for (const seller of sellers) {
      console.log(`\n📊 SELLER: ${seller.email} (UID: ${seller.uid})`);
      console.log(`   Name: ${seller.firstName} ${seller.lastName}`);
      console.log(`   Created: ${seller.createdAt}`);
      
      // Get seller's listings
      const listings = await Listing.find({
        sellerId: seller.uid,
        status: { $ne: 'deleted' }
      }).sort({ createdAt: -1 });
      
      console.log(`   📦 Listings: ${listings.length}`);
      
      if (listings.length > 0) {
        console.log('   Recent listings:');
        for (const listing of listings.slice(0, 3)) {
          console.log(`     - ${listing.title} (${listing.externalId})`);
          console.log(`       Platform: ${listing.platform}, Status: ${listing.status}`);
          console.log(`       Created: ${listing.createdAt}`);
          
          // Check views for this listing
          const views = await ViewedProduct.countDocuments({
            productId: listing.externalId,
            isDeleted: false
          });
          
          const viewsWithDuration = await ViewedProduct.countDocuments({
            productId: listing.externalId,
            isDeleted: false,
            'metadata.viewDuration': { $exists: true, $gt: 0 }
          });
          
          console.log(`       Views: ${views} (${viewsWithDuration} with duration)`);
        }
      }
      
      // Get total views for all seller's listings
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
      
      console.log(`   👀 Total Views: ${totalViews} (${totalViewsWithDuration} with duration)`);
      
      // Calculate time metrics
      if (totalViewsWithDuration > 0) {
        const now = new Date();
        const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const timeAnalytics = await ViewedProduct.getTimeAnalytics(listingIds, startDate, now);
        
        if (timeAnalytics.length > 0) {
          const timeStats = timeAnalytics.reduce((acc, item) => {
            acc.totalTime += item.totalTimeSpent || 0;
            acc.totalViews += item.totalViews || 0;
            return acc;
          }, { totalTime: 0, totalViews: 0 });
          
          const avgTimeOnPage = timeStats.totalViews > 0 ? timeStats.totalTime / timeStats.totalViews : 0;
          const totalTimeSpent = timeStats.totalTime;
          const viewsWithDuration = timeStats.totalViews;
          
          console.log(`   ⏱️  Analytics:`);
          console.log(`       Avg Time on Page: ${(avgTimeOnPage / 1000).toFixed(1)}s`);
          console.log(`       Total Time Spent: ${(totalTimeSpent / 60000).toFixed(1)}m`);
          console.log(`       Views with Duration: ${viewsWithDuration}`);
        }
      }
      
      console.log('   ' + '='.repeat(50));
    }
    
    // Check for recent viewed products
    console.log('\n🔍 RECENT ACTIVITY: Last 10 product views');
    const recentViews = await ViewedProduct.find({ isDeleted: false })
      .sort({ viewedAt: -1 })
      .limit(10)
      .lean();
    
    for (const view of recentViews) {
      console.log(`   📱 ${view.productId}`);
      console.log(`      User: ${view.userUid || 'anonymous'} (${view.anonymousId || 'no-anon-id'})`);
      console.log(`      Viewed: ${view.viewedAt}`);
      console.log(`      Duration: ${view.metadata?.viewDuration || 'none'}ms`);
      console.log(`      Source: ${view.metadata?.source || 'unknown'}`);
    }
    
  } catch (error) {
    console.error('🔍 SELLER CHECK: Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkCurrentSeller();