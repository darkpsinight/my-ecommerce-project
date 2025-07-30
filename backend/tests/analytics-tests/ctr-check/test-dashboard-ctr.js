const mongoose = require('mongoose');
const { User } = require('../../../models/user');
const { Listing } = require('../../../models/listing');
const ListingImpression = require('../../../models/listingImpression');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testDashboardCTR() {
  try {
    console.log('🔍 Testing Dashboard CTR Data...');
    
    // Find the seller (same as in analytics handler)
    const seller = await User.findOne({ email: 'darkpsinight@gmail.com' });
    console.log('Seller found:', seller?.uid);
    
    if (!seller) {
      console.log('❌ No seller found');
      return;
    }
    
    // Get seller's listings (same as in analytics handler)
    const sellerListings = await Listing.find({
      sellerId: seller.uid,
      status: { $ne: 'deleted' }
    }).select('externalId title platform').lean();
    
    console.log('Seller listings:', sellerListings.length);
    const listingIds = sellerListings.map(listing => listing.externalId);
    console.log('Listing IDs:', listingIds);
    
    if (listingIds.length === 0) {
      console.log('❌ No listings found for seller');
      return;
    }
    
    // Test CTR analytics (same as in analytics handler)
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    console.log('\n📊 Testing CTR Analytics...');
    const ctrAnalytics = await ListingImpression.getCTRAnalytics(
      listingIds,
      startDate,
      now,
      { groupBy: 'product', includePosition: false }
    );
    
    console.log('CTR Analytics Result:', JSON.stringify(ctrAnalytics, null, 2));
    
    if (ctrAnalytics.length > 0) {
      const ctr = ctrAnalytics[0];
      console.log('\n🎯 DASHBOARD SHOULD SHOW:');
      console.log(`   Total Impressions: ${ctr.totalImpressions}`);
      console.log(`   Total Clicks: ${ctr.totalClicks}`);
      console.log(`   Overall CTR: ${ctr.clickThroughRate.toFixed(2)}%`);
      
      console.log('\n✅ CTR data is available! If dashboard shows 0s, there might be a frontend issue.');
    } else {
      console.log('❌ No CTR data found for seller listings');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

testDashboardCTR();