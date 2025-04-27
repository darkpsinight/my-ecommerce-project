require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const crypto = require('crypto');
const mongoose = require('mongoose');
const { configs } = require('../../configs');
const { Listing } = require('../../models/listing');
const { connectDB } = require('../../models/connectDB');

// Test code to encrypt and decrypt
const originalCode = 'ABCD-1234-EFGH-5678';
console.log(`Original Code: ${originalCode}`);

// Function to test encryption and decryption without saving to database
function testEncryptionWithoutDB() {
  console.log('\n--- Testing Encryption/Decryption Without DB ---');
  
  // Create initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher using the secret key and iv
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(configs.CODE_ENCRYPTION_KEY),
    iv
  );
  
  // Encrypt the code
  let encrypted = cipher.update(originalCode, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  console.log(`Encrypted Code: ${encrypted}`);
  console.log(`IV (hex): ${iv.toString('hex')}`);
  
  // Create decipher using the same key and iv
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(configs.CODE_ENCRYPTION_KEY),
    iv
  );
  
  // Decrypt the code
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  console.log(`Decrypted Code: ${decrypted}`);
  console.log(`Decryption Successful: ${decrypted === originalCode}`);
}



// Function to test multiple encryptions of the same code
function testMultipleEncryptions() {
  console.log('\n--- Testing Multiple Encryptions of Same Code ---');
  
  // Test multiple encryptions to show they produce different results
  for (let i = 0; i < 3; i++) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(configs.CODE_ENCRYPTION_KEY),
      iv
    );
    
    let encrypted = cipher.update(originalCode, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    console.log(`Encryption #${i+1}: ${encrypted} (IV: ${iv.toString('hex')})`);
  }
}

// Function to test with existing listings in the database
async function testWithExistingListings() {
  console.log('\n--- Testing With Existing Listings in Database ---');
  
  try {
    // Connect to MongoDB with a mock fastify object
    const mockFastify = {
      log: {
        info: console.log,
        error: console.error,
        warn: console.warn,
        debug: console.debug
      }
    };
    await connectDB(mockFastify);
    console.log('Connected to MongoDB');
    
    // Find all listings that have a code (they'll be hidden by default)
    const listings = await Listing.find({}).select('+code +iv');
    
    if (listings.length === 0) {
      console.log('No listings found in the database. Creating a test listing...');
      
      // Create a test listing if none exist
      const testCode = 'TEST-CODE-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log(`Creating test listing with code: ${testCode}`);
      
      const testListing = new Listing({
        title: 'Test Listing',
        description: 'This is a test listing created by the encryption test script',
        price: 9.99,
        category: 'Game Key',
        platform: 'Steam',
        region: 'Global',
        sellerId: 'test-seller-id',
        quantity: 1,
        status: 'draft' // Use draft so it doesn't show up in public listings
      });
      
      // Encrypt the code
      testListing.encryptCode(testCode);
      
      // Save to database
      await testListing.save();
      console.log(`Test listing created with ID: ${testListing._id}`);
      
      // Add the test listing to our array
      listings.push(testListing);
    }
    
    // Test each listing
    console.log(`Found ${listings.length} listings with codes in the database.`);
    
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      
      console.log(`\nListing #${i+1} - ID: ${listing._id}`);
      console.log(`Title: ${listing.title}`);
      console.log(`Encrypted Code: ${listing.code}`);
      console.log(`IV: ${listing.iv}`);
      
      // Try to decrypt the code
      const decryptedCode = listing.decryptCode();
      
      if (decryptedCode) {
        console.log(`Decrypted Code: ${decryptedCode}`);
        console.log('Decryption successful!');
      } else {
        console.log('Failed to decrypt code.');
      }
    }
    
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  } catch (error) {
    console.error('Error in database test:', error);
  }
}

// Run the tests
async function runTests() {
  console.log('=== CODE ENCRYPTION/DECRYPTION TEST ===');
  console.log(`Using encryption key: ${configs.CODE_ENCRYPTION_KEY.substring(0, 3)}...${configs.CODE_ENCRYPTION_KEY.substring(configs.CODE_ENCRYPTION_KEY.length - 3)}`);
  
  // Test encryption without DB
  testEncryptionWithoutDB();
  
  // Test multiple encryptions
  testMultipleEncryptions();
  
  // Test with existing listings
  await testWithExistingListings();
  
  console.log('\n=== TEST COMPLETE ===');
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
