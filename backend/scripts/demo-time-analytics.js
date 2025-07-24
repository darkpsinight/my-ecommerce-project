/**
 * Demo script to show the new time-based analytics
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { User } = require('../models/user');
const { Listing } = require('../models/listing');
const ViewedProduct = require('../models/viewedProduct');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function demoTimeAnalytics() {
  console.log('🎯 Demo: New Time-Based Analytics\n');

  try {
    // Find an existing seller
    const seller = await User.findOne({ roles: 'seller' });
    if (!seller) {
      console.log('❌ No seller found. Please create a seller account first.');
      return;
    }

    console.log(`✅ Found seller: ${seller.displayName || seller.name}`);

    // Create demo data if needed
    console.log('\n📊 Creating demo time tracking data...');
    
    const demoListing = {
      title: 'Demo Game - Time Analytics',
      description: 'Demo listing to show time analytics',
      price: 29.99,
      sellerId: seller.uid,
      externalId: 'demo-time-analytics',
      category: 'games',
      platform: 'Steam',
      region: 'Global',
      status: 'active',
      codes: [{
        code: 'DEMO-TIME-123',
        soldStatus: 'active',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }]
    };

    await Listing.findOneAndUpdate(
      { externalId: 'demo-time-analytics' },
      demoListing,
      { upsert: true, new: true }
    );

    // Create sample view records with different time durations
    const sampleViews = [
      { user: 'demo-user-1', duration: 45000, source: 'search' },     // 45 seconds
      { user: 'demo-user-2', duration: 120000, source: 'homepage' },  // 2 minutes
      { user: 'demo-user-3', duration: 30000, source: 'direct' },     // 30 seconds
      { user: 'demo-user-4', duration: 180000, source: 'category' },  // 3 minutes
      { user: 'demo-user-5', duration: 90000, source: 'search' },     // 1.5 minutes
    ];

    // Clean up old demo views
    await ViewedProduct.deleteMany({ 
      productId: 'demo-time-analytics',
      anonymousId: { $regex: /^demo-user-/ }
    });

    // Create new demo views
    for (let i = 0; i < sampleViews.length; i++) {
      const view = sampleViews[i];
      const viewRecord = new ViewedProduct({
        anonymousId: view.user,
        productId: 'demo-time-analytics',
        viewedAt: new Date(Date.now() - (i * 300000)), // 5 minutes apart
        metadata: {
          source: view.source,
          sessionId: `demo-session-${i}`,
          deviceType: 'desktop',
          sessionStart: new Date(Date.now() - (i * 300000) - view.duration),
          lastActivity: new Date(Date.now() - (i * 300000)),
          isActiveSession: false,
          viewDuration: view.duration
        }
      });
      
      await viewRecord.save();
    }

    console.log('✅ Created 5 demo view records with time tracking');

    // Now demonstrate the time analytics
    console.log('\n🔍 Getting Time Analytics...');
    
    const timeAnalytics = await ViewedProduct.getTimeAnalytics(
      ['demo-time-analytics'],
      new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      new Date()
    );

    if (timeAnalytics.length > 0) {
      const analytics = timeAnalytics[0];
      
      console.log('\n📈 NEW TIME-BASED METRICS:');
      console.log('=' .repeat(50));
      console.log(`📊 Product ID: ${analytics._id}`);
      console.log(`👥 Total Views: ${analytics.totalViews}`);
      console.log(`👤 Unique Viewers: ${analytics.uniqueViewerCount}`);
      console.log(`⏱️  Average Time on Page: ${Math.round(analytics.avgTimeOnPageSeconds || 0)} seconds`);
      console.log(`🕐 Total Time Spent: ${Math.round(analytics.totalTimeSpentMinutes || 0)} minutes`);
      console.log(`⏰ Min Time on Page: ${Math.round((analytics.minTimeOnPage || 0) / 1000)} seconds`);
      console.log(`⏰ Max Time on Page: ${Math.round((analytics.maxTimeOnPage || 0) / 1000)} seconds`);
      
      console.log('\n💡 What this means:');
      console.log(`   • Users spend an average of ${Math.round(analytics.avgTimeOnPageSeconds || 0)} seconds viewing this listing`);
      console.log(`   • Total engagement time: ${Math.round(analytics.totalTimeSpentMinutes || 0)} minutes across all views`);
      console.log(`   • Engagement range: ${Math.round((analytics.minTimeOnPage || 0) / 1000)}-${Math.round((analytics.maxTimeOnPage || 0) / 1000)} seconds`);
    }

    // Generate seller token for API testing
    console.log('\n🔑 Generating Seller Token for API Testing...');
    const sellerToken = seller.getJWT();
    
    console.log('\n📋 HOW TO SEE THE NEW ANALYTICS:');
    console.log('=' .repeat(60));
    
    console.log('\n1️⃣ VIA SELLER DASHBOARD:');
    console.log('   • Go to: http://localhost:3002');
    console.log('   • Login with your seller account');
    console.log('   • Navigate to Analytics/Dashboard section');
    console.log('   • Look for "Engagement Metrics" section');
    console.log('   • New fields: Average Time on Page, Total Time Spent');
    
    console.log('\n2️⃣ VIA API CALL:');
    console.log('   • Use this token in Authorization header:');
    console.log(`   • Bearer ${sellerToken.substring(0, 50)}...`);
    console.log('   • GET http://localhost:3000/api/v1/seller/analytics/overview?timeRange=30d');
    
    console.log('\n3️⃣ VIA POSTMAN/CURL:');
    console.log('   curl -H "Authorization: Bearer YOUR_TOKEN" \\');
    console.log('        "http://localhost:3000/api/v1/seller/analytics/overview?timeRange=30d"');
    
    console.log('\n4️⃣ WHAT TO LOOK FOR IN RESPONSE:');
    console.log('   {');
    console.log('     "data": {');
    console.log('       "engagement": {');
    console.log('         "totalViews": 5,');
    console.log('         "avgTimeOnPage": 93,     // ← NEW: Average seconds');
    console.log('         "totalTimeSpent": 7.75,  // ← NEW: Total minutes');
    console.log('         "viewsWithDuration": 5,  // ← NEW: Views tracked');
    console.log('         "topViewedListings": [');
    console.log('           {');
    console.log('             "title": "Demo Game",');
    console.log('             "avgTimeOnPage": 93,  // ← NEW: Per-listing time');
    console.log('             "totalTimeSpent": 7.75 // ← NEW: Per-listing total');
    console.log('           }');
    console.log('         ]');
    console.log('       }');
    console.log('     }');
    console.log('   }');

    console.log('\n🎯 TESTING THE FRONTEND:');
    console.log('   • Go to buyer frontend: http://localhost:3001');
    console.log('   • Browse product pages to generate time tracking data');
    console.log('   • Time tracking starts automatically when viewing products');
    console.log('   • Check seller analytics after browsing to see updated metrics');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

async function main() {
  await connectDB();
  await demoTimeAnalytics();
  await mongoose.connection.close();
  console.log('\n📦 Database connection closed');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});