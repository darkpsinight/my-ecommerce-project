const { connectDB } = require("../models/connectDB");
const { SellerProfile } = require("../models/sellerProfile");
const { User } = require("../models/user");
const { v4: uuidv4 } = require("uuid");

async function createTestSellers() {
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to database");

    // Create test users first (if they don't exist)
    const testUsers = [
      {
        email: 'seller1@test.com',
        username: 'seller1',
        password: 'hashedpassword1', // In real app, this would be properly hashed
        roles: ['seller'],
        isVerified: true
      },
      {
        email: 'seller2@test.com',
        username: 'seller2',
        password: 'hashedpassword2',
        roles: ['seller'],
        isVerified: true
      },
      {
        email: 'seller3@test.com',
        username: 'seller3',
        password: 'hashedpassword3',
        roles: ['seller'],
        isVerified: true
      }
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = new User(userData);
        await user.save();
        console.log(`Created user: ${user.email}`);
      }
      createdUsers.push(user);
    }

    // Create test seller profiles
    const testSellers = [
      {
        userId: createdUsers[0]._id,
        nickname: 'GameMaster Pro',
        profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
        bannerImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=200&fit=crop',
        marketName: 'Ultimate Gaming Store',
        about: 'Premium gaming codes and software licenses. Trusted seller with over 10,000 satisfied customers worldwide. Specializing in AAA game titles and productivity software.',
        badges: [
          {
            name: 'Verified Seller',
            description: 'Identity and business verified',
            icon: 'shield-check',
            earnedAt: new Date('2023-01-15')
          },
          {
            name: 'Top Seller',
            description: 'Over $100K in sales',
            icon: 'star',
            earnedAt: new Date('2023-06-20')
          }
        ],
        enterpriseDetails: {
          companyName: 'Ultimate Gaming LLC',
          website: 'https://ultimategaming.com',
          socialMedia: [
            { platform: 'Twitter', url: 'https://twitter.com/ultimategaming' },
            { platform: 'Discord', url: 'https://discord.gg/ultimategaming' },
            { platform: 'YouTube', url: 'https://youtube.com/ultimategaming' }
          ]
        },
        externalId: uuidv4()
      },
      {
        userId: createdUsers[1]._id,
        nickname: 'Digital Keys Hub',
        profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        bannerImageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=200&fit=crop',
        marketName: 'Digital Keys Marketplace',
        about: 'Your one-stop shop for digital software keys, game codes, and gift cards. Fast delivery, competitive prices, and excellent customer service since 2020.',
        badges: [
          {
            name: 'Verified Seller',
            description: 'Identity and business verified',
            icon: 'shield-check',
            earnedAt: new Date('2023-03-10')
          }
        ],
        enterpriseDetails: {
          companyName: 'Digital Keys Inc',
          website: 'https://digitalkeys.com',
          socialMedia: [
            { platform: 'Facebook', url: 'https://facebook.com/digitalkeys' },
            { platform: 'Instagram', url: 'https://instagram.com/digitalkeys' }
          ]
        },
        externalId: uuidv4()
      },
      {
        userId: createdUsers[2]._id,
        nickname: 'Code Vault',
        profileImageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
        bannerImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=200&fit=crop',
        marketName: 'The Code Vault',
        about: 'Secure digital code marketplace with instant delivery. We specialize in rare and hard-to-find software licenses and collector edition game codes.',
        badges: [
          {
            name: 'Verified Seller',
            description: 'Identity and business verified',
            icon: 'shield-check',
            earnedAt: new Date('2023-02-05')
          },
          {
            name: 'Security Expert',
            description: 'Advanced security measures',
            icon: 'lock',
            earnedAt: new Date('2023-07-15')
          }
        ],
        enterpriseDetails: {
          companyName: 'Code Vault Security LLC',
          website: 'https://codevault.com',
          socialMedia: [
            { platform: 'LinkedIn', url: 'https://linkedin.com/company/codevault' },
            { platform: 'Twitter', url: 'https://twitter.com/codevault' }
          ]
        },
        externalId: uuidv4()
      }
    ];

    // Create seller profiles
    for (const sellerData of testSellers) {
      const existingSeller = await SellerProfile.findOne({ userId: sellerData.userId });
      if (!existingSeller) {
        const seller = new SellerProfile(sellerData);
        await seller.save();
        console.log(`Created seller profile: ${seller.nickname}`);
      } else {
        console.log(`Seller profile already exists: ${existingSeller.nickname}`);
      }
    }

    console.log("Test sellers created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating test sellers:", error);
    process.exit(1);
  }
}

createTestSellers();