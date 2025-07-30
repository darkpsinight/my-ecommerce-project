const mongoose = require('mongoose');
const ListingImpression = require('../../../models/listingImpression');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testManualClick() {
  try {
    console.log('🖱️ MANUAL CLICK TEST: Marking impressions as clicked...');
    
    // Find all unclicked impressions
    const unclickedImpressions = await ListingImpression.find({
      wasClicked: false,
      isDeleted: false
    }).limit(5);
    
    console.log(`Found ${unclickedImpressions.length} unclicked impressions`);
    
    // Manually mark some as clicked
    let clickedCount = 0;
    for (const impression of unclickedImpressions) {
      if (clickedCount < 3) { // Mark 3 out of 5 as clicked (60% CTR)
        impression.wasClicked = true;
        impression.clickDelay = Math.random() * 5000 + 1000; // Random delay 1-6 seconds
        await impression.save();
        clickedCount++;
        
        console.log(`✅ Marked impression ${impression.externalId} as clicked`);
      }
    }
    
    console.log(`\n📊 Manually marked ${clickedCount} impressions as clicked`);
    
    // Get updated CTR analytics
    const testProductId = '5b27caae-954b-413a-887d-79729746e4ff';
    const now = new Date();
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const ctrAnalytics = await ListingImpression.getCTRAnalytics(
      [testProductId],
      startDate,
      now,
      { groupBy: 'product' }
    );
    
    if (ctrAnalytics.length > 0) {
      const ctr = ctrAnalytics[0];
      console.log(`\n🎯 UPDATED RESULTS:`);
      console.log(`   Total Impressions: ${ctr.totalImpressions}`);
      console.log(`   Total Clicks: ${ctr.totalClicks}`);
      console.log(`   Click-Through Rate: ${ctr.clickThroughRate}%`);
      
      if (ctr.clickThroughRate > 0) {
        console.log('🎉 SUCCESS! CTR is now showing!');
        console.log('🔗 Check your dashboard: http://localhost:3002/dashboards/analytics/engagement');
        console.log('🔗 Or API: http://localhost:3000/api/v1/seller/analytics/overview?timeRange=30d');
      }
    }
    
    // Also get CTR by source
    const ctrBySource = await ListingImpression.getCTRAnalytics(
      [testProductId],
      startDate,
      now,
      { groupBy: 'source' }
    );
    
    console.log('\n📊 CTR by Source:');
    ctrBySource.forEach(source => {
      console.log(`   ${source._id}: ${source.clickThroughRate}% (${source.totalClicks}/${source.totalImpressions})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testManualClick();