const mongoose = require('mongoose');
const { User } = require('../../models/user');
const { Listing } = require('../../models/listing');
const ListingImpression = require('../../models/listingImpression');
const ViewedProduct = require('../../models/viewedProduct');

mongoose.connect('mongodb://localhost:27017/ecommerce');

setTimeout(async () => {
  try {
    console.log('🎯 Creating CTR data for existing seller...');
    
    // Find the existing seller
    const seller = await User.findOne({ roles: 'seller' });
    console.log('Using seller:', seller.email);
    
    // Find seller's listings
    const listings = await Listing.find({ sellerId: seller.uid }).select('externalId title platform');
    console.log(`Found ${listings.length} listings for this seller`);
    
    if (listings.length === 0) {
      console.log('❌ No listings found');
      mongoose.connection.close();
      return;
    }
    
    // Use the first listing for CTR data
    const targetListing = listings[0];
    console.log(`Creating CTR data for: ${targetListing.title} (${targetListing.externalId})`);
    
    // Create realistic CTR scenario
    const scenarios = [
      { source: 'search_results', position: 1, shouldClick: true },
      { source: 'search_results', position: 2, shouldClick: false },
      { source: 'search_results', position: 3, shouldClick: true },
      { source: 'category_page', position: 1, shouldClick: true },
      { source: 'category_page', position: 2, shouldClick: false },
      { source: 'homepage_featured', position: 1, shouldClick: true },
      { source: 'search_results', position: 4, shouldClick: false },
      { source: 'search_results', position: 5, shouldClick: false }
    ];
    
    console.log('Creating impressions and clicks...');
    
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      const anonymousId = `demo-user-${Date.now()}-${i}`;
      
      // Create impression
      await ListingImpression.trackImpression({
        userUid: null,
        anonymousId: anonymousId,
        productId: targetListing.externalId,
        metadata: {
          source: scenario.source,
          position: scenario.position,
          deviceType: 'desktop'
        }
      });
      
      console.log(`📊 Created impression ${i+1}: ${scenario.source} position ${scenario.position}`);
      
      // Create click if shouldClick is true
      if (scenario.shouldClick) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        
        await ViewedProduct.addOrUpdateView({
          userUid: null,
          anonymousId: anonymousId,
          productId: targetListing.externalId,
          metadata: {
            source: scenario.source,
            deviceType: 'desktop'
          }
        });
        
        console.log(`🖱️ Created click ${i+1}: User clicked on ${scenario.source}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay between scenarios
    }
    
    console.log('\n✅ CTR data created successfully!');
    
    // Test the results
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const ctrResult = await ListingImpression.getCTRAnalytics(
      [targetListing.externalId],
      startDate,
      now,
      { groupBy: 'product' }
    );
    
    if (ctrResult.length > 0) {
      const ctr = ctrResult[0];
      console.log('\n🎯 RESULTS:');
      console.log(`   Total Impressions: ${ctr.totalImpressions}`);
      console.log(`   Total Clicks: ${ctr.totalClicks}`);
      console.log(`   Click-Through Rate: ${ctr.clickThroughRate.toFixed(2)}%`);
      
      console.log('\n🔗 Now check your dashboard:');
      console.log('   1. Make sure you are logged in as: seller-analytics@test.com');
      console.log('   2. Go to: http://localhost:3002/dashboards/analytics/engagement');
      console.log('   3. Look for the CTR section - it should show real numbers now!');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
}, 1000);