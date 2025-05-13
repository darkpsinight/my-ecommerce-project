/**
 * Script to test the performance routes
 *
 * This script will:
 * 1. Create a test fastify instance
 * 2. Register the performance routes
 * 3. Verify that the routes are registered correctly
 *
 * Run this script with: node scripts/testPerformanceRoutes.js
 */

const fastify = require('fastify')({ logger: true });
const performanceRoutes = require('../routes/performanceRoutes');

// Mock the verifyAuth function to avoid authentication issues
const originalVerifyAuth = require('../plugins/authVerify').verifyAuth;

// Override the verifyAuth function
require('../plugins/authVerify').verifyAuth = function() {
  return function(request, reply, next) {
    if (next) next();
    return Promise.resolve();
  };
};

// Register the performance routes
fastify.register(performanceRoutes, { prefix: '/api/v1' });

// Start the server
const start = async () => {
  try {
    await fastify.ready();

    // Print all registered routes
    console.log('Registered routes:');
    console.log(fastify.printRoutes());

    console.log('Test completed successfully!');

    // Restore the original verifyAuth function
    require('../plugins/authVerify').verifyAuth = originalVerifyAuth;

    await fastify.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during test:', err);
    process.exit(1);
  }
};

start();
