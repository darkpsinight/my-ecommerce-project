const cron = require('node-cron');
const { Listing } = require('../models/listing');

/**
 * Updates expired listings in the database
 * @param {Object} fastify - Fastify instance for logging
 * @returns {Promise<Object>} - Results of the update operation
 */
const updateExpiredListings = async (fastify) => {
  try {
    const now = new Date();
    
    // Find all active listings where expiration date has passed
    const expiredListings = await Listing.find({
      status: 'active',
      expirationDate: { $lt: now }
    }).select('+codes');
    
    if (expiredListings.length === 0) {
      fastify.log.debug('No expired listings found to update');
      return {
        success: true,
        modifiedCount: 0,
        matchedCount: 0
      };
    }
    
    let updatedListings = 0;
    let updatedCodes = 0;
    
    // Update each listing and its active codes
    for (const listing of expiredListings) {
      // Update listing status
      listing.status = 'expired';
      listing.updatedAt = now;
      
      // Update all active codes to expired
      if (listing.codes && listing.codes.length > 0) {
        for (const code of listing.codes) {
          if (code.soldStatus === 'active') {
            code.soldStatus = 'expired';
            updatedCodes++;
          }
        }
      }
      
      // Save the updated listing
      await listing.save();
      updatedListings++;
    }
    
    fastify.log.info(`Updated ${updatedListings} expired listings and ${updatedCodes} active codes to expired`);
    
    return {
      success: true,
      modifiedCount: updatedListings,
      matchedCount: updatedListings,
      updatedCodes: updatedCodes
    };
  } catch (error) {
    fastify.log.error(`Error updating expired listings: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Sets up a cron job to automatically update expired listings
 * @param {Object} fastify - Fastify instance for logging
 */
const setupListingExpirationCron = (fastify) => {
  // Run every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    fastify.log.info('Running scheduled task: updating expired listings');
    await updateExpiredListings(fastify);
  });
  
  fastify.log.info('Listing expiration cron job scheduled to run every 10 minutes');
};

module.exports = {
  setupListingExpirationCron,
  updateExpiredListings
};
