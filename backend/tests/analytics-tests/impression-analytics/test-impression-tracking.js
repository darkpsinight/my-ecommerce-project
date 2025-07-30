const mongoose = require('mongoose');
const ListingImpression = require('../../../models/listingImpression');
const ViewedProduct = require('../../../models/viewedProduct');
const { Listing } = require('../../../models/listing');
const { User } = require('../../../models/user');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testImpressionTracking() {
  try {
    console.log('🔍 IMPRESSION TRACKING TEST: Starting...');
    
    // Test data
    const testProductId = '5b27caae-954b-413a-887d-79729746e4ff';
    const testAnonymousId = 'test-anon-' + Date.now();
    
    console.log(`🔍 Testing with product: ${testProductId}`);
    console.log(`🔍 Testing with anonymous ID: ${testAnonymousId}`);
    
    // 1. Test impression tracking
    console.log('\n📊 Testing impression tracking...');
    
    const impressionData = {
      userUid: null,
      anonymousId: testAnonymousId,
      productId: testProductId,
      metadata: {
        source: 'search_results',
        position: 1,
        totalItemsShown: 10,
        searchQuery: 'test game',
        deviceType: 'desktop',
        sessionId: 'test-session-' + Date.now(),
        viewport: {
          isAboveFold: true,
          scrollPosition: 0,
          viewportHeight: 800,
          elementPosition: 100
        }
      }
    };
    
    const impression = await ListingImpression.trackImpression(impressionData);
    console.log('✅ Impression tracked:', {
      id: impression.externalId,
      productId: impression.productId,
      source: impression.metadata.source,
      position: impression.metadata.position
    });
    
    // 2. Test view tracking (which should mark impression as clicked)
    console.log('\n👁️ Testing view tracking...');
    
    const viewRecord = await ViewedProduct.addOrUpdateView({
      userUid: null,
      anonymousId: testAnonymousId,
      productId: testProductId,
      metadata: {
        source: 'search_results',
        deviceType: 'desktop',
        sessionId: 'test-session-' + Date.now(),
        viewDuration: 30000 // 30 seconds
      }
    });
    
    console.log('✅ View tracked:', {
      id: viewRecord.externalId,
      productId: viewRecord.productId,
      viewDuration: viewRecord.metadata?.viewDuration
    });
    
    // 3. Check if impression was marked as clicked
    console.log('\n🖱️ Checking if impression was marked as clicked...');
    
    const updatedImpression = await ListingImpression.findOne({
      externalId: impression.externalId
    });
    
    if (updatedImpression.wasClicked) {
      console.log('✅ Impression successfully marked as clicked:', {
        clickDelay: updatedImpression.clickDelay,
        clickDelaySeconds: Math.round(updatedImpression.clickDelay / 1000) + 's',
        clickedViewId: updatedImpression.clickedViewId
      });
    } else {
      console.log('❌ Impression was not marked as clicked');
    }
    
    // 4. Test CTR analytics
    console.log('\n📈 Testing CTR analytics...');
    
    const now = new Date();
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const ctrAnalytics = await ListingImpression.getCTRAnalytics(
      [testProductId],
      startDate,
      now,
      { groupBy: 'product', includePosition: false }
    );
    
    console.log('📊 CTR Analytics:', ctrAnalytics);
    
    // 5. Test position-based CTR analysis
    console.log('\n📍 Testing position-based CTR analysis...');
    
    const positionAnalysis = await ListingImpression.getPositionCTRAnalysis(
      [testProductId],
      startDate,
      now
    );
    
    console.log('📊 Position Analysis:', positionAnalysis);
    
    // 6. Test multiple impressions for the same product
    console.log('\n📊 Testing multiple impressions...');
    
    // Create more impressions at different positions
    for (let i = 2; i <= 5; i++) {
      await ListingImpression.trackImpression({
        userUid: null,
        anonymousId: 'test-anon-' + Date.now() + '-' + i,
        productId: testProductId,
        metadata: {
          source: 'category_page',
          position: i,
          totalItemsShown: 20,
          deviceType: 'mobile'
        }
      });
      
      // Simulate some clicks (50% CTR)
      if (i % 2 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        await ViewedProduct.addOrUpdateView({
          userUid: null,
          anonymousId: 'test-anon-' + Date.now() + '-' + i,
          productId: testProductId,
          metadata: {
            source: 'category_page',
            deviceType: 'mobile'
          }
        });
      }
    }
    
    console.log('✅ Created additional impressions and views');
    
    // 7. Get updated analytics
    console.log('\n📈 Getting updated CTR analytics...');
    
    const updatedCTRAnalytics = await ListingImpression.getCTRAnalytics(
      [testProductId],
      startDate,
      now,
      { groupBy: 'product', includePosition: false }
    );
    
    console.log('📊 Updated CTR Analytics:', updatedCTRAnalytics);
    
    const updatedPositionAnalysis = await ListingImpression.getPositionCTRAnalysis(
      [testProductId],
      startDate,
      now
    );
    
    console.log('📊 Updated Position Analysis:', updatedPositionAnalysis);
    
    // 8. Test CTR by source
    console.log('\n📊 Testing CTR by source...');
    
    const ctrBySource = await ListingImpression.getCTRAnalytics(
      [testProductId],
      startDate,
      now,
      { groupBy: 'source', includePosition: false }
    );
    
    console.log('📊 CTR by Source:', ctrBySource);
    
    // 9. Summary statistics
    console.log('\n📊 SUMMARY STATISTICS:');
    
    const totalImpressions = await ListingImpression.countDocuments({
      productId: testProductId,
      isDeleted: false,
      impressionAt: { $gte: startDate, $lte: now }
    });
    
    const totalClicks = await ListingImpression.countDocuments({
      productId: testProductId,
      wasClicked: true,
      isDeleted: false,
      impressionAt: { $gte: startDate, $lte: now }
    });
    
    const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
    
    console.log(`Total Impressions: ${totalImpressions}`);
    console.log(`Total Clicks: ${totalClicks}`);
    console.log(`Overall CTR: ${overallCTR}%`);
    
    // 10. Test seller analytics integration
    console.log('\n🏪 Testing seller analytics integration...');
    
    const sellers = await User.find({ roles: 'seller' });
    if (sellers.length > 0) {
      const testSeller = sellers[0];
      console.log(`Testing with seller: ${testSeller.uid}`);
      
      // Check if the test product belongs to this seller
      const sellerListings = await Listing.find({
        sellerId: testSeller.uid,
        status: { $ne: 'deleted' }
      }).select('externalId title').lean();
      
      const listingIds = sellerListings.map(l => l.externalId);
      
      if (listingIds.includes(testProductId)) {
        console.log('✅ Test product belongs to seller, testing analytics...');
        
        const sellerCTRAnalytics = await ListingImpression.getCTRAnalytics(
          listingIds,
          startDate,
          now,
          { groupBy: 'product', includePosition: false }
        );
        
        console.log('📊 Seller CTR Analytics:', sellerCTRAnalytics);
      } else {
        console.log('ℹ️ Test product does not belong to this seller');
      }
    }
    
    console.log('\n✅ IMPRESSION TRACKING TEST COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ IMPRESSION TRACKING TEST ERROR:', error);
  } finally {
    mongoose.connection.close();
  }
}

testImpressionTracking();