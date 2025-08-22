const mongoose = require("mongoose");
const { User, hashPasswd } = require("../models/user");
const { configs } = require("../configs");
const crypto = require("crypto");

// Direct MongoDB connection function for scripts
async function connectToDB() {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    await mongoose.connect(configs.MONGO_URI, options);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    throw error;
  }
}

async function createTestSupportAdmin() {
  try {
    // Connect to database
    await connectToDB();
    console.log("📊 Database connection established");

    // Test users to create
    const testUsers = [
      {
        name: 'Support Staff',
        email: 'support@test.com',
        password: 'Test123456!',
        roles: ['support', 'buyer'],
        isEmailConfirmed: true,
        provider: 'email'
      },
      {
        name: 'Admin User',
        email: 'admin@test.com', 
        password: 'Test123456!',
        roles: ['admin', 'buyer', 'seller', 'support'],
        isEmailConfirmed: true,
        provider: 'email'
      },
      {
        name: 'Regular Buyer',
        email: 'buyer@test.com',
        password: 'Test123456!',
        roles: ['buyer'],
        isEmailConfirmed: true,
        provider: 'email'
      }
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      let user = await User.findOne({ email: userData.email });
      
      if (!user) {
        // Hash the password
        const hashedPassword = await hashPasswd(userData.password);
        
        // Create user
        user = await User.create({
          name: userData.name,
          uid: crypto.randomBytes(15).toString("hex"),
          email: userData.email,
          password: hashedPassword,
          roles: userData.roles,
          isEmailConfirmed: userData.isEmailConfirmed,
          provider: userData.provider,
          acquisitionSource: {
            channel: "organic",
            acquisitionDate: new Date()
          }
        });
        
        console.log(`✅ Created user: ${user.email} with roles: ${user.roles.join(', ')}`);
      } else {
        console.log(`⚠️  User already exists: ${user.email} with roles: ${user.roles.join(', ')}`);
      }
    }

    console.log("\n🎉 Test users created successfully!");
    console.log("\n📋 Available test accounts:");
    console.log("Support Dashboard (localhost:3003):");
    console.log("  Email: support@test.com");
    console.log("  Password: Test123456!");
    console.log("  Roles: support, buyer");
    console.log("");
    console.log("Admin Dashboard (localhost:3004):");
    console.log("  Email: admin@test.com");
    console.log("  Password: Test123456!");
    console.log("  Roles: admin, buyer, seller, support");
    console.log("");
    console.log("Regular user (should fail on dashboards):");
    console.log("  Email: buyer@test.com");
    console.log("  Password: Test123456!");
    console.log("  Roles: buyer");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating test users:", error);
    process.exit(1);
  }
}

createTestSupportAdmin();