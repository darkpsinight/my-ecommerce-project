const mongoose = require('mongoose');
const ListingImpression = require('../../../models/listingImpression');
const ViewedProduct = require('../../../models/viewedProduct');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testCTRSimple() {
  try {
    console.log('🎯 SIMPLE CTR TEST: Creating impressions and clicks...');
    
    const testProductId = '5b27caae-954b-413a-887d-79729746e4ff';
    const testAnonymousId = 'test-user-ctr-' + Date.now();
    
    console.log(`Testing with product: ${testProductId}`);
    console.log(`Testing with anonymous ID: ${testAnonymousId}`);
    
    // 1. Create an impression
    console.log('\n📊 Creating impression...');
    const impression = await ListingImpression.trackImpression({
      userUid: null,
      anonymousId: testAnonymousId,
      productId: testProductId,
      metadata: {
        source: 'search_results',
        position: 1,
        deviceType: 'desktop'
      }
    });
    
    console.log('✅ Impression created:', impression.externalId);
    
    // 2. Create a view (which should mark the impression as clicked)
    console.log('\n👁️ Creating view...');
    const view = await ViewedProduct.addOrUpdateView({
      userUid: null,
      anonymousId: testAnonymousId, // Same anonymous ID!
      productId: testProductId,
      metadata: {
        source: 'search_results',
        deviceType: 'desktop'
      }
    });
    
    console.log('✅ View created:', view.externalId);
    
    // 3. Check if impression was marked as clicked
    console.log('\n🖱️ Checking impression status...');
    const updatedImpression = await ListingImpression.findOne({
      externalId: impression.externalId
    });
    
    console.log('Impression clicked status:', updatedImpression.wasClicked);
    console.log('Click delay:', updatedImpression.clickDelay);
    
    // 4. Get CTR analytics
    console.log('\n📈 Getting CTR analytics...');
    const now = new Date();
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const ctrAnalytics = await ListingImpression.getCTRAnalytics(
      [testProductId],
      startDate,
      now,
      { groupBy: 'product' }
    );
    
    console.log('📊 CTR Analytics:', JSON.stringify(ctrAnalytics, null, 2));
    
    if (ctrAnalytics.length > 0) {
      const ctr = ctrAnalytics[0];
      console.log(`\n🎯 RESULTS:`);
      console.log(`   Total Impressions: ${ctr.totalImpressions}`);
      console.log(`   Total Clicks: ${ctr.totalClicks}`);
      console.log(`   Click-Through Rate: ${ctr.clickThroughRate}%`);
      
      if (ctr.clickThroughRate > 0) {
        console.log('🎉 SUCCESS! CTR tracking is working!');
      } else {
        console.log('⚠️ CTR is still 0, investigating...');
      }
    }
    
    // 5. Create a few more impressions and clicks for better data
    console.log('\n📊 Creating more test data...');
    
    for (let i = 2; i <= 5; i++) {
      const anonId = `test-user-ctr-${Date.now()}-${i}`;
      
      // Create impression
      await ListingImpression.trackImpression({
        userUid: null,
        anonymousId: anonId,
        productId: testProductId,
        metadata: {
          source: i % 2 === 0 ? 'category_page' : 'search_results',
          position: i,
          deviceType: 'desktop'
        }
      });
      
      // 50% chance of clicking (viewing)
      if (i % 2 === 0) {
        await ViewedProduct.addOrUpdateView({
          userUid: null,
          anonymousId: anonId,
          productId: testProductId,
          metadata: {
            source: 'category_page',
            deviceType: 'desktop'
          }
        });
      }
      
      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ Created additional test data');
    
    // 6. Get final CTR analytics
    console.log('\n📈 Final CTR analytics...');
    const finalCTR = await ListingImpression.getCTRAnalytics(
      [testProductId],
      startDate,
      now,
      { groupBy: 'product' }
    );
    
    if (finalCTR.length > 0) {
      const final = finalCTR[0];
      console.log(`\n🎯 FINAL RESULTS:`);
      console.log(`   Total Impressions: ${final.totalImpressions}`);
      console.log(`   Total Clicks: ${final.totalClicks}`);
      console.log(`   Click-Through Rate: ${final.clickThroughRate}%`);
      
      if (final.clickThroughRate > 0) {
        console.log('🎉 SUCCESS! Your CTR dashboard should now show these numbers!');
        console.log('🔗 Check: http://localhost:3002/dashboards/analytics/engagement');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testCTRSimple();