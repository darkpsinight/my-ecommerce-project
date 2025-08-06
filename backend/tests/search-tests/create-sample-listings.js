const { connectDB } = require('../../models/connectDB');
const { Listing } = require('../../models/listing');
const { Category } = require('../../models/category');
const { User } = require('../../models/user');
const { SellerProfile } = require('../../models/sellerProfile');

async function createSampleListings() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    // Find or create a category
    let category = await Category.findOne({ name: 'Gaming' });
    if (!category) {
      category = new Category({
        name: 'Gaming',
        description: 'Gaming codes and digital products',
        isActive: true
      });
      await category.save();
      console.log('Created Gaming category');
    }
    
    // Find or create a test user/seller
    let user = await User.findOne({ email: 'testseller@example.com' });
    if (!user) {
      user = new User({
        name: 'Test Seller',
        email: 'testseller@example.com',
        uid: 'test-seller-uid-' + Date.now(),
        roles: ['seller'],
        isEmailConfirmed: true
      });
      await user.save();
      console.log('Created test user');
    }
    
    // Find or create seller profile
    let sellerProfile = await SellerProfile.findOne({ userId: user._id });
    if (!sellerProfile) {
      sellerProfile = new SellerProfile({
        userId: user._id,
        nickname: 'GameMaster',
        marketName: 'GameMaster Store',
        about: 'Your trusted source for digital game codes',
        externalId: 'gamemaster-' + Date.now()
      });
      await sellerProfile.save();
      console.log('Created seller profile');
    }
    
    // Sample listings data
    const sampleListings = [
      {
        title: 'Steam Gift Card $20',
        description: 'Digital Steam gift card worth $20. Perfect for purchasing games on Steam platform. Instant delivery after purchase.',
        price: 18.99,
        originalPrice: 20.00,
        platform: 'Steam',
        region: 'Global',
        tags: ['steam', 'gift card', 'gaming', 'digital', 'instant']
      },
      {
        title: 'PlayStation Plus 1 Month Subscription',
        description: 'Get access to PlayStation Plus benefits including free monthly games, online multiplayer, and exclusive discounts.',
        price: 9.99,
        originalPrice: 12.99,
        platform: 'PlayStation',
        region: 'North America',
        tags: ['playstation', 'ps plus', 'subscription', 'gaming', 'online']
      },
      {
        title: 'Xbox Game Pass Ultimate 3 Months',
        description: 'Access to hundreds of games on Xbox and PC, plus Xbox Live Gold and EA Play membership included.',
        price: 39.99,
        originalPrice: 44.99,
        platform: 'Xbox',
        region: 'Global',
        tags: ['xbox', 'game pass', 'ultimate', 'subscription', 'pc gaming']
      },
      {
        title: 'Netflix Premium Account 1 Month',
        description: 'Premium Netflix subscription with 4K streaming and multiple device support. Works worldwide.',
        price: 12.99,
        originalPrice: 15.99,
        platform: 'Netflix',
        region: 'Global',
        tags: ['netflix', 'streaming', 'premium', '4k', 'entertainment']
      },
      {
        title: 'Spotify Premium Family 6 Months',
        description: 'Spotify Premium Family plan for up to 6 accounts. Ad-free music streaming with offline downloads.',
        price: 59.99,
        originalPrice: 69.99,
        platform: 'Spotify',
        region: 'Global',
        tags: ['spotify', 'music', 'premium', 'family', 'streaming']
      },
      {
        title: 'Google Play Gift Card $25',
        description: 'Google Play Store credit for apps, games, movies, and more. Valid for Android devices and Google services.',
        price: 23.99,
        originalPrice: 25.00,
        platform: 'Google Play',
        region: 'Global',
        tags: ['google play', 'android', 'gift card', 'apps', 'games']
      },
      {
        title: 'Cyberpunk 2077 Steam Key',
        description: 'Open-world action-adventure RPG set in Night City. Experience the future in this immersive cyberpunk world.',
        price: 29.99,
        originalPrice: 59.99,
        platform: 'Steam',
        region: 'Global',
        tags: ['cyberpunk', 'rpg', 'action', 'adventure', 'steam key']
      },
      {
        title: 'FIFA 24 PlayStation Digital Code',
        description: 'The latest FIFA football simulation game for PlayStation. Experience realistic gameplay and updated teams.',
        price: 49.99,
        originalPrice: 69.99,
        platform: 'PlayStation',
        region: 'Europe',
        tags: ['fifa', 'football', 'sports', 'playstation', 'simulation']
      }
    ];
    
    console.log('Creating sample listings...');
    
    for (const listingData of sampleListings) {
      // Check if listing already exists
      const existingListing = await Listing.findOne({ title: listingData.title });
      if (existingListing) {
        console.log(`Listing "${listingData.title}" already exists, skipping...`);
        continue;
      }
      
      const listing = new Listing({
        ...listingData,
        categoryId: category._id,
        sellerId: user.uid,
        externalId: 'sample-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
        status: 'active',
        codes: [
          {
            codeId: 'code-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
            code: 'SAMPLE-CODE-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            hashCode: 'hash-' + Date.now(),
            soldStatus: 'active'
          }
        ]
      });
      
      await listing.save();
      console.log(`✅ Created listing: ${listingData.title}`);
    }
    
    console.log('\n🎉 Sample listings created successfully!');
    console.log('You can now test the autocomplete functionality.');
    
  } catch (error) {
    console.error('Error creating sample listings:', error);
  } finally {
    process.exit(0);
  }
}

createSampleListings();