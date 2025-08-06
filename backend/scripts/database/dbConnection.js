require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");

/**
 * Simple database connection utility to avoid circular dependencies
 */

let isConnected = false;

const connectDB = async () => {
  if (!isConnected) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      isConnected = true;
      console.log("✅ Connected to MongoDB successfully");
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
      throw error;
    }
  }
  return mongoose.connection;
};

const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log("🔌 Disconnected from MongoDB");
  }
};

const getConnectionStatus = () => isConnected;

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus
};