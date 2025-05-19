require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models/user');
const { SellerProfile } = require('../models/sellerProfile');
const crypto = require('crypto');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create a test user with seller role
const createTestUser = async () => {
  try {
    // First, delete any existing test users
    await User.deleteMany({ email: 'test-seller@example.com' });
    
    // Create a new test user
    const user = new User({
      name: 'Test Seller',
      uid: crypto.randomBytes(15).toString('hex'),
      email: 'test-seller@example.com',
      role: 'seller',
      provider: 'email',
      isEmailConfirmed: true
    });
    
    await user.save();
    console.log('Test user created:', user._id);
    return user;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
};

// Create a test seller profile
const createTestSellerProfile = async (userId) => {
  try {
    // First, delete any existing test profiles
    await SellerProfile.deleteMany({ userId });
    
    // Create a new test profile
    const profile = new SellerProfile({
      userId,
      nickname: 'CoolSeller123',
      profileImageUrl: 'https://example.com/profile.jpg',
      bannerImageUrl: 'https://example.com/banner.jpg',
      marketName: 'CoolSeller\'s Market',
      enterpriseDetails: {
        companyName: 'CoolSeller Inc.',
        website: 'https://coolseller.com',
        socialMedia: [
          { platform: 'Twitter', url: 'https://twitter.com/coolseller' },
          { platform: 'LinkedIn', url: 'https://linkedin.com/company/coolseller' }
        ]
      }
    });
    
    await profile.save();
    console.log('Test seller profile created:', profile._id);
    console.log('External ID:', profile.externalId);
    return profile;
  } catch (error) {
    console.error('Error creating test seller profile:', error);
    throw error;
  }
};

// Test retrieving a seller profile
const testGetSellerProfile = async (profileId) => {
  try {
    const profile = await SellerProfile.findById(profileId);
    console.log('Retrieved profile by ID:', profile ? 'Success' : 'Failed');
    
    if (profile) {
      console.log('Profile data:', {
        nickname: profile.nickname,
        marketName: profile.marketName,
        externalId: profile.externalId
      });
    }
  } catch (error) {
    console.error('Error retrieving seller profile:', error);
  }
};

// Main function
const main = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Create test user
    const user = await createTestUser();
    
    // Create test seller profile
    const profile = await createTestSellerProfile(user._id);
    
    // Test retrieving the profile
    await testGetSellerProfile(profile._id);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the main function
main();
