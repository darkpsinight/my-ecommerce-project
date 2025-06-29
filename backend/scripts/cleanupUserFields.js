require('dotenv').config();
const mongoose = require('mongoose');

// Get MongoDB URI directly from environment variables
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI environment variable is not set');
  process.exit(1);
}

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for migration');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Migration function to clean up user fields
const cleanupUserFields = async () => {
  try {
    console.log('Starting cleanup of redundant user fields...');
    
    // Get the users collection directly
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find all users with displayName or username fields
    const usersToUpdate = await usersCollection.find({
      $or: [
        { displayName: { $exists: true } },
        { username: { $exists: true } }
      ]
    }).toArray();
    
    console.log(`Found ${usersToUpdate.length} users to clean up`);
    
    let updatedCount = 0;
    
    for (const user of usersToUpdate) {
      const updates = {};
      const fieldsToUnset = {};
      
      // If displayName exists and is not empty, use it to update the name field
      if (user.displayName && user.displayName.trim() !== '') {
        updates.name = user.displayName.trim();
        console.log(`User ${user.email}: Using displayName "${user.displayName}" as name`);
      }
      
      // Remove displayName and username fields
      if (user.displayName !== undefined) {
        fieldsToUnset.displayName = "";
      }
      if (user.username !== undefined) {
        fieldsToUnset.username = "";
      }
      
      // Prepare the update operation
      const updateOperation = {};
      if (Object.keys(updates).length > 0) {
        updateOperation.$set = updates;
      }
      if (Object.keys(fieldsToUnset).length > 0) {
        updateOperation.$unset = fieldsToUnset;
      }
      
      if (Object.keys(updateOperation).length > 0) {
        await usersCollection.updateOne(
          { _id: user._id },
          updateOperation
        );
        updatedCount++;
        console.log(`Updated user: ${user.email}`);
      }
    }
    
    console.log(`\nMigration completed successfully!`);
    console.log(`- Total users processed: ${usersToUpdate.length}`);
    console.log(`- Users updated: ${updatedCount}`);
    console.log(`- displayName and username fields removed from all processed users`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Main execution
const runMigration = async () => {
  try {
    await connectDB();
    await cleanupUserFields();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { cleanupUserFields };