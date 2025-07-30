const mongoose = require('mongoose');
const ListingImpression = require('../../models/listingImpression');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

async function createTestImpressions() {
  try {
    console.log('🔍 Creating test impression data for your listings...');
    
    // Your seller's listing IDs (from the check-your-seller.js output)
    const yourListingIds = [
      'fa1a33cd-1092-4fac-ad5e-a016c0260d3c', // Steam Gift Card 6$
      '205f9079-dcc1-4642-8806-3c0fa4c6c09c', // 28/06/2025
      '5dcbf318-0d87-44af-9022-3556d580c162', // product 1
      '6675d888-e643-4cd1-ad4d-3d10ac20a391', // test amazon boycotted
      'd6ffd645-ddbc-4eb0-95f1-56d81fea3fc8', // demo testing views duration
    ];
    
    const sources = ['search_results', 'category_page', 'homepage_featured', 'other'];
    const anonymousIds = ['anon_user_1', 'anon_user_2', 'anon_user_3', 'anon_user_4'];
    
    console.log('Creating impressions for listings:', yourListingIds);
    
    const impressions = [];
    const now = new Date();
    
    // Create impressions for the last 7 days
    for (let day = 0; day < 7; day++) {
      const impressionDate = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000));
      
      for (const listingId of yourListingIds) {
        // Create 5-15 impressions per listing per day
        const impressionCount = Math.floor(Math.random() * 10) + 5;
        
        for (let i = 0; i < impressionCount; i++) {
          const source = sources[Math.floor(Math.random() * sources.length)];
          const anonymousId = anonymousIds[Math.floor(Math.random() * anonymousIds.length)];
          const position = Math.floor(Math.random() * 10) + 1;
          
          // Random time within the day
          const randomTime = new Date(impressionDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
          
          const impressionData = {
            productId: listingId,
            anonymousId: anonymousId,
            impressionAt: randomTime,
            wasClicked: Math.random() < 0.15, // 15% click-through rate
            metadata: {
              source: source,
              position: position,
              totalItemsShown: Math.floor(Math.random() * 20) + 10,
              deviceType: Math.random() < 0.7 ? 'desktop' : 'mobile',
              pageUrl: `http://localhost:3001/${source}`,
            }
          };
          
          // Add click delay if it was clicked
          if (impressionData.wasClicked) {
            impressionData.clickDelay = Math.floor(Math.random() * 30000) + 2000; // 2-32 seconds
          }
          
          impressions.push(impressionData);
        }
      }
    }
    
    console.log(`Creating ${impressions.length} test impressions...`);
    
    // Insert all impressions
    const result = await ListingImpression.insertMany(impressions);
    console.log(`✅ Created ${result.length} impression records!`);
    
    // Calculate summary
    const totalImpressions = result.length;
    const totalClicks = result.filter(imp => imp.wasClicked).length;
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
    
    console.log('\n📊 Test Data Summary:');
    console.log(`   Total Impressions: ${totalImpressions}`);
    console.log(`   Total Clicks: ${totalClicks}`);
    console.log(`   Overall CTR: ${ctr}%`);
    
    console.log('\n🎉 SUCCESS! Now check your dashboard:');
    console.log('   🔗 http://localhost:3002/dashboards/analytics/engagement');
    console.log('   🔗 Or API: http://localhost:3000/api/v1/seller/analytics/overview?timeRange=30d');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error creating test impressions:', error);
    mongoose.connection.close();
  }
}

createTestImpressions();