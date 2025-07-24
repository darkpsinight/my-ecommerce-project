/**
 * Debug script to check time tracking data in the database
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

const ViewedProduct = require('../models/viewedProduct');
const { Listing } = require('../models/listing');
const { User } = require('../models/user');

async function debugTimeTrackingForProduct(productId) {
  console.log(`\n🔍 Debugging Time Tracking for Product: ${productId}...\n`);

  try {
    const product = await Listing.findOne({ externalId: productId });
    
    // 2. Check all ViewedProduct records for this product
    console.log('2️⃣ Checking ViewedProduct records...');
    
    const viewRecords = await ViewedProduct.find({ 
      productId: productId,
      isDeleted: false 
    }).sort({ viewedAt: -1 }).limit(10);
    
    console.log(`Found ${viewRecords.length} view records:`);
    viewRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. View ID: ${record.externalId}`);
      console.log(`     User: ${record.userUid || 'Anonymous: ' + record.anonymousId}`);
      console.log(`     Viewed At: ${record.viewedAt}`);
      console.log(`     Duration: ${record.metadata?.viewDuration || 'N/A'}ms`);
      console.log(`     Session: ${record.metadata?.sessionId || 'N/A'}`);
      console.log(`     Active: ${record.metadata?.isActiveSession || false}`);
      console.log('');
    });

    // 3. Check time analytics for this product
    console.log('3️⃣ Testing time analytics query...');
    
    const timeAnalytics = await ViewedProduct.getTimeAnalytics(
      [productId],
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      new Date()
    );
    
    console.log('Time analytics result:', timeAnalytics);

    return { product, viewRecords, timeAnalytics };
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    return null;
  }
}

async function debugTimeTracking() {
  console.log('🔍 Debugging Time Tracking Data...\n');

  try {
    // 1. Check what products actually exist in the database
    console.log('1️⃣ Checking what products exist in database...');
    
    const allProducts = await Listing.find({ status: { $ne: 'deleted' } })
      .select('externalId title sellerId platform')
      .limit(10)
      .lean();
    
    console.log(`Found ${allProducts.length} products in database:`);
    allProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} (${product.externalId})`);
      console.log(`     Seller: ${product.sellerId}, Platform: ${product.platform}`);
    });
    
    // Now check the specific product you're testing
    const productId = '5b27caae-954b-413a-887d-79729746e4ff';
    console.log(`\n1️⃣b. Checking specific product: ${productId}...`);
    
    const product = await Listing.findOne({ externalId: productId });
    if (product) {
      console.log('✅ Product found:', {
        id: product.externalId,
        title: product.title,
        sellerId: product.sellerId,
        platform: product.platform
      });
    } else {
      console.log('❌ Product not found in database');
      console.log('Using first available product for testing...');
      
      if (allProducts.length > 0) {
        const testProduct = allProducts[0];
        console.log('Using product:', testProduct.title, testProduct.externalId);
        // Continue with the first product for testing
        return await debugTimeTrackingForProduct(testProduct.externalId);
      } else {
        console.log('No products found in database at all!');
        return;
      }
    }

    // 2. Check all ViewedProduct records for this product
    console.log('\n2️⃣ Checking ViewedProduct records...');
    
    const viewRecords = await ViewedProduct.find({ 
      productId: productId,
      isDeleted: false 
    }).sort({ viewedAt: -1 }).limit(10);
    
    console.log(`Found ${viewRecords.length} view records:`);
    viewRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. View ID: ${record.externalId}`);
      console.log(`     User: ${record.userUid || 'Anonymous: ' + record.anonymousId}`);
      console.log(`     Viewed At: ${record.viewedAt}`);
      console.log(`     Duration: ${record.metadata?.viewDuration || 'N/A'}ms`);
      console.log(`     Session: ${record.metadata?.sessionId || 'N/A'}`);
      console.log(`     Active: ${record.metadata?.isActiveSession || false}`);
      console.log('');
    });

    // 3. Check time analytics for this product
    console.log('3️⃣ Testing time analytics query...');
    
    const timeAnalytics = await ViewedProduct.getTimeAnalytics(
      [productId],
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      new Date()
    );
    
    console.log('Time analytics result:', timeAnalytics);

    // 4. Check if there's a seller who owns this product
    console.log('\n4️⃣ Checking seller ownership...');
    
    const seller = await User.findOne({ uid: product.sellerId });
    if (seller) {
      console.log('✅ Seller found:', {
        uid: seller.uid,
        name: seller.name,
        email: seller.email,
        roles: seller.roles
      });
    } else {
      console.log('❌ Seller not found for sellerId:', product.sellerId);
    }

    // 5. Check all ViewedProduct records with duration data
    console.log('\n5️⃣ Checking all records with duration data...');
    
    const recordsWithDuration = await ViewedProduct.find({
      'metadata.viewDuration': { $exists: true, $gt: 0 },
      isDeleted: false
    }).sort({ viewedAt: -1 }).limit(20);
    
    console.log(`Found ${recordsWithDuration.length} records with duration data:`);
    recordsWithDuration.forEach((record, index) => {
      console.log(`  ${index + 1}. Product: ${record.productId}`);
      console.log(`     Duration: ${Math.round(record.metadata.viewDuration / 1000)}s`);
      console.log(`     Viewed At: ${record.viewedAt}`);
      console.log('');
    });

    // 6. Test the seller analytics query manually
    console.log('6️⃣ Testing seller analytics query...');
    
    if (seller) {
      // Get seller's listing IDs
      const sellerListings = await Listing.find({
        sellerId: seller.uid,
        status: { $ne: 'deleted' }
      }).select('externalId title platform').lean();

      console.log(`Seller has ${sellerListings.length} listings:`);
      sellerListings.forEach(listing => {
        console.log(`  - ${listing.title} (${listing.externalId})`);
      });

      const listingIds = sellerListings.map(listing => listing.externalId);
      
      if (listingIds.length > 0) {
        const sellerTimeAnalytics = await ViewedProduct.getTimeAnalytics(
          listingIds,
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          new Date()
        );
        
        console.log('\nSeller time analytics:', sellerTimeAnalytics);
      }
    }

    // 7. Summary
    console.log('\n📊 SUMMARY:');
    console.log(`- Product exists: ${!!product}`);
    console.log(`- View records: ${viewRecords.length}`);
    console.log(`- Records with duration: ${recordsWithDuration.length}`);
    console.log(`- Seller exists: ${!!seller}`);
    
    const totalDuration = viewRecords.reduce((sum, record) => {
      return sum + (record.metadata?.viewDuration || 0);
    }, 0);
    
    console.log(`- Total duration for this product: ${Math.round(totalDuration / 1000)}s`);
    console.log(`- Average duration: ${viewRecords.length > 0 ? Math.round(totalDuration / viewRecords.length / 1000) : 0}s`);

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Main execution
async function main() {
  await connectDB();
  await debugTimeTracking();
  await mongoose.connection.close();
  console.log('📦 Database connection closed');
  process.exit(0);
}

// Run the debug
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

module.exports = { debugTimeTracking };