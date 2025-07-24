/**
 * Test script to verify time tracking functionality
 */

const mongoose = require('mongoose');
require('dotenv').config();

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

const { Listing } = require('../models/listing');
const ViewedProduct = require('../models/viewedProduct');

// Mock data
const mockSellerId = 'test-seller-uid';
const mockListingId = 'test-listing-time-tracking';
const mockAnonymousId = 'test-anon-user-123';

async function testTimeTracking() {
  console.log('🧪 Testing Time Tracking Functionality...\n');

  try {
    // Test 1: Create a mock listing for testing
    console.log('1️⃣ Creating mock listing...');
    
    const mockListing = new Listing({
      title: 'Test Game for Time Tracking',
      description: 'A test game to verify time tracking works',
      price: 29.99,
      sellerId: mockSellerId,
      externalId: mockListingId,
      category: 'games',
      platform: 'Steam',
      region: 'Global',
      status: 'active',
      codes: [
        {
          code: 'TEST-CODE-123',
          soldStatus: 'active',
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      ]
    });

    // Save or update the listing
    const listingData = mockListing.toObject();
    delete listingData._id; // Remove _id to avoid immutable field error
    
    await Listing.findOneAndUpdate(
      { externalId: mockListingId },
      listingData,
      { upsert: true, new: true }
    );

    console.log('✅ Mock listing created/updated:', mockListingId);

    // Test 2: Create a view with session tracking
    console.log('\n2️⃣ Creating view with session tracking...');
    
    const viewRecord = await ViewedProduct.addOrUpdateView({
      anonymousId: mockAnonymousId,
      productId: mockListingId,
      metadata: {
        source: 'direct',
        sessionId: 'test-session-123',
        deviceType: 'desktop'
      }
    });

    console.log('✅ View record created:', {
      viewId: viewRecord.externalId,
      productId: viewRecord.productId,
      sessionStart: viewRecord.metadata.sessionStart,
      isActiveSession: viewRecord.metadata.isActiveSession
    });

    // Test 3: Simulate session activity updates
    console.log('\n3️⃣ Testing session activity updates...');
    
    // Wait 2 seconds to simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const updatedSession = await ViewedProduct.updateSessionActivity({
      anonymousId: mockAnonymousId,
      productId: mockListingId,
      sessionId: 'test-session-123'
    });

    if (updatedSession) {
      console.log('✅ Session activity updated:', {
        lastActivity: updatedSession.metadata.lastActivity,
        timeSinceStart: Date.now() - updatedSession.metadata.sessionStart.getTime()
      });
    } else {
      console.log('❌ Failed to update session activity');
    }

    // Test 4: End session with duration
    console.log('\n4️⃣ Testing session end...');
    
    const sessionDuration = 45000; // 45 seconds
    const endedSession = await ViewedProduct.endSession({
      anonymousId: mockAnonymousId,
      productId: mockListingId,
      sessionId: 'test-session-123',
      finalDuration: sessionDuration
    });

    if (endedSession) {
      console.log('✅ Session ended successfully:', {
        duration: endedSession.metadata.viewDuration,
        durationSeconds: Math.round(endedSession.metadata.viewDuration / 1000),
        isActiveSession: endedSession.metadata.isActiveSession
      });
    } else {
      console.log('❌ Failed to end session');
    }

    // Test 5: Test time analytics
    console.log('\n5️⃣ Testing time analytics...');
    
    const timeAnalytics = await ViewedProduct.getTimeAnalytics(
      [mockListingId],
      new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      new Date()
    );

    console.log('✅ Time analytics calculated:', timeAnalytics.map(item => ({
      productId: item._id,
      totalViews: item.totalViews,
      avgTimeOnPageSeconds: item.avgTimeOnPageSeconds,
      totalTimeSpentMinutes: item.totalTimeSpentMinutes,
      uniqueViewerCount: item.uniqueViewerCount
    })));

    // Test 6: Create multiple views with different durations for better analytics
    console.log('\n6️⃣ Creating additional test views...');
    
    const testDurations = [30000, 60000, 120000, 90000]; // 30s, 1m, 2m, 1.5m
    
    for (let i = 0; i < testDurations.length; i++) {
      const testView = new ViewedProduct({
        anonymousId: `test-anon-${i}`,
        productId: mockListingId,
        metadata: {
          source: 'direct',
          sessionId: `test-session-${i}`,
          deviceType: 'desktop',
          sessionStart: new Date(Date.now() - testDurations[i] - 1000),
          lastActivity: new Date(),
          isActiveSession: false,
          viewDuration: testDurations[i]
        }
      });
      
      await testView.save();
    }

    console.log('✅ Additional test views created');

    // Test 7: Get updated time analytics
    console.log('\n7️⃣ Getting updated time analytics...');
    
    const updatedAnalytics = await ViewedProduct.getTimeAnalytics(
      [mockListingId],
      new Date(Date.now() - 24 * 60 * 60 * 1000),
      new Date()
    );

    if (updatedAnalytics.length > 0) {
      const analytics = updatedAnalytics[0];
      console.log('✅ Updated time analytics:', {
        productId: analytics._id,
        totalViews: analytics.totalViews,
        avgTimeOnPageSeconds: Math.round(analytics.avgTimeOnPageSeconds || 0),
        totalTimeSpentMinutes: Math.round(analytics.totalTimeSpentMinutes || 0),
        minTimeSeconds: Math.round((analytics.minTimeOnPage || 0) / 1000),
        maxTimeSeconds: Math.round((analytics.maxTimeOnPage || 0) / 1000),
        uniqueViewers: analytics.uniqueViewerCount
      });
    }

    console.log('\n🎉 All time tracking tests completed successfully!');
    
    // Print API endpoints for manual testing
    console.log('\n📋 API Endpoints for Manual Testing:');
    console.log('1. Create view:');
    console.log(`   POST http://localhost:3000/api/v1/viewed-products/anonymous`);
    console.log(`   Body: {"productId":"${mockListingId}","anonymousId":"test-user","metadata":{"source":"direct","sessionId":"manual-test"}}`);
    
    console.log('\n2. Update session activity:');
    console.log(`   PUT http://localhost:3000/api/v1/viewed-products/session/activity`);
    console.log(`   Body: {"productId":"${mockListingId}","anonymousId":"test-user","sessionId":"manual-test"}`);
    
    console.log('\n3. End session:');
    console.log(`   POST http://localhost:3000/api/v1/viewed-products/session/end`);
    console.log(`   Body: {"productId":"${mockListingId}","anonymousId":"test-user","sessionId":"manual-test","finalDuration":60000}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Main execution
async function main() {
  await connectDB();
  await testTimeTracking();
  await mongoose.connection.close();
  console.log('📦 Database connection closed');
  process.exit(0);
}

// Run the test
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

module.exports = { testTimeTracking };