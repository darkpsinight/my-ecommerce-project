/**
 * Test script to verify seller analytics with time tracking
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

const { User } = require('../models/user');
const { Listing } = require('../models/listing');
const ViewedProduct = require('../models/viewedProduct');

async function testSellerAnalytics() {
  console.log('🧪 Testing Seller Analytics with Time Tracking...\n');

  try {
    // Test 1: Find or create a seller user
    console.log('1️⃣ Finding/creating seller user...');
    
    let seller = await User.findOne({ roles: 'seller' });
    
    if (!seller) {
      // Create a test seller
      seller = new User({
        uid: 'test-seller-analytics',
        email: 'seller-analytics@test.com',
        name: 'Test Seller Analytics',
        displayName: 'Test Seller Analytics',
        roles: ['seller'],
        isEmailConfirmed: true,
        isActive: true
      });
      await seller.save();
      console.log('✅ Created test seller user');
    } else {
      console.log('✅ Found existing seller user:', seller.displayName);
    }

    // Test 2: Create/update a listing for this seller
    console.log('\n2️⃣ Creating/updating seller listing...');
    
    const listingData = {
      title: 'Analytics Test Game',
      description: 'A test game for analytics verification',
      price: 39.99,
      sellerId: seller.uid,
      externalId: 'analytics-test-listing',
      category: 'games',
      platform: 'Steam',
      region: 'Global',
      status: 'active',
      codes: [
        {
          code: 'ANALYTICS-TEST-123',
          soldStatus: 'active',
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ]
    };

    await Listing.findOneAndUpdate(
      { externalId: 'analytics-test-listing' },
      listingData,
      { upsert: true, new: true }
    );

    console.log('✅ Listing created/updated: analytics-test-listing');

    // Test 3: Create multiple view records with different durations
    console.log('\n3️⃣ Creating view records with time tracking...');
    
    const viewData = [
      { anonymousId: 'analytics-user-1', duration: 45000, source: 'search' },    // 45 seconds
      { anonymousId: 'analytics-user-2', duration: 120000, source: 'homepage' }, // 2 minutes
      { anonymousId: 'analytics-user-3', duration: 30000, source: 'direct' },    // 30 seconds
      { anonymousId: 'analytics-user-4', duration: 180000, source: 'category' }, // 3 minutes
      { anonymousId: 'analytics-user-5', duration: 90000, source: 'search' },    // 1.5 minutes
    ];

    for (let i = 0; i < viewData.length; i++) {
      const view = viewData[i];
      const viewRecord = new ViewedProduct({
        anonymousId: view.anonymousId,
        productId: 'analytics-test-listing',
        viewedAt: new Date(Date.now() - (i * 60000)), // Spread views over time
        metadata: {
          source: view.source,
          sessionId: `analytics-session-${i}`,
          deviceType: 'desktop',
          sessionStart: new Date(Date.now() - (i * 60000) - view.duration),
          lastActivity: new Date(Date.now() - (i * 60000)),
          isActiveSession: false,
          viewDuration: view.duration
        }
      });
      
      await viewRecord.save();
    }

    console.log('✅ Created 5 view records with time tracking data');

    // Test 4: Generate seller JWT token
    console.log('\n4️⃣ Generating seller JWT token...');
    
    const sellerToken = seller.getJWT();
    console.log('✅ Seller JWT token generated');
    console.log('Token (first 50 chars):', sellerToken.substring(0, 50) + '...');

    // Test 5: Test analytics API call
    console.log('\n5️⃣ Testing analytics API...');
    
    const fetch = (await import('node-fetch')).default;
    
    try {
      const response = await fetch('http://localhost:3000/api/v1/seller/analytics/overview?timeRange=30d', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sellerToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const analyticsData = await response.json();
        
        if (analyticsData.success && analyticsData.data.engagement) {
          const engagement = analyticsData.data.engagement;
          
          console.log('✅ Analytics API call successful!');
          console.log('\n📊 Engagement Metrics:');
          console.log(`   Total Views: ${engagement.totalViews}`);
          console.log(`   Unique Viewers: ${engagement.uniqueViewers}`);
          console.log(`   Average Time on Page: ${engagement.avgTimeOnPage}s`);
          console.log(`   Total Time Spent: ${engagement.totalTimeSpent} minutes`);
          console.log(`   Views with Duration: ${engagement.viewsWithDuration}`);
          console.log(`   Conversion Rate: ${engagement.conversionRate}%`);
          
          if (engagement.topViewedListings && engagement.topViewedListings.length > 0) {
            console.log('\n📈 Top Viewed Listings:');
            engagement.topViewedListings.forEach((listing, index) => {
              console.log(`   ${index + 1}. ${listing.title}`);
              console.log(`      Views: ${listing.viewCount}, Time: ${listing.avgTimeOnPage}s`);
            });
          }
          
          if (engagement.viewsBySource && engagement.viewsBySource.length > 0) {
            console.log('\n🔍 Views by Source:');
            engagement.viewsBySource.forEach(source => {
              console.log(`   ${source.source}: ${source.count} views`);
            });
          }
          
        } else {
          console.log('❌ Analytics data structure unexpected:', analyticsData);
        }
      } else {
        const errorData = await response.text();
        console.log('❌ Analytics API call failed:', response.status, errorData);
      }
    } catch (error) {
      console.log('❌ Analytics API call error:', error.message);
    }

    console.log('\n🎉 Seller analytics test completed!');
    
    // Print manual test instructions
    console.log('\n📋 Manual Testing Instructions:');
    console.log('1. Use this token in your API client:');
    console.log(`   Authorization: Bearer ${sellerToken}`);
    console.log('\n2. Test these endpoints:');
    console.log('   GET http://localhost:3000/api/v1/seller/analytics/overview?timeRange=30d');
    console.log('   GET http://localhost:3000/api/v1/seller/analytics/revenue-chart?timeRange=30d&period=daily');
    console.log('\n3. Check the "engagement" section for time tracking metrics');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Main execution
async function main() {
  await connectDB();
  await testSellerAnalytics();
  await mongoose.connection.close();
  console.log('📦 Database connection closed');
  process.exit(0);
}

// Run the test
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

module.exports = { testSellerAnalytics };