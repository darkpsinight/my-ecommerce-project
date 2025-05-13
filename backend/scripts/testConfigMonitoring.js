/**
 * Script to test the performance monitoring configuration
 * 
 * This script will:
 * 1. Initialize the config cache
 * 2. Check if monitoring is enabled from database config
 * 3. Test a monitored query
 * 
 * Run this script with: node scripts/testConfigMonitoring.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { configCache } = require('../services/configCache');
const { Config } = require('../models/config');
const { measureQueryTime, getPerformanceMetrics } = require('../utils/queryPerformanceMonitor');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return false;
  }
}

// Initialize config cache
async function initConfigCache() {
  try {
    // Load all configs from database
    const configs = await Config.find({});
    
    // Initialize the config cache
    configs.forEach(config => {
      configCache.set(config.key, config.value);
    });
    
    console.log(`Loaded ${configs.length} configs into cache`);
    
    // Check if monitoring is enabled
    const monitoringEnabled = configCache.get('MONITOR_QUERY_PERFORMANCE');
    console.log(`MONITOR_QUERY_PERFORMANCE from database: ${monitoringEnabled}`);
    console.log(`MONITOR_QUERY_PERFORMANCE from env: ${process.env.MONITOR_QUERY_PERFORMANCE}`);
    
    return true;
  } catch (error) {
    console.error('Failed to initialize config cache:', error);
    return false;
  }
}

// Test a monitored query
async function testMonitoredQuery() {
  try {
    // Run a simple query with monitoring
    console.log('Running a test query with monitoring...');
    
    const result = await measureQueryTime(
      () => Config.findOne({ key: 'MONITOR_QUERY_PERFORMANCE' }),
      'testQuery',
      { key: 'MONITOR_QUERY_PERFORMANCE' }
    );
    
    console.log('Query result:', result ? result.key : 'No result');
    
    // Get performance metrics
    const metrics = getPerformanceMetrics();
    console.log('Performance metrics:', metrics);
    
    return true;
  } catch (error) {
    console.error('Failed to run test query:', error);
    return false;
  }
}

// Main function
async function main() {
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      process.exit(1);
    }
    
    // Initialize config cache
    const cacheInitialized = await initConfigCache();
    if (!cacheInitialized) {
      process.exit(1);
    }
    
    // Test a monitored query
    const queryTested = await testMonitoredQuery();
    if (!queryTested) {
      process.exit(1);
    }
    
    console.log('Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the main function
main();
