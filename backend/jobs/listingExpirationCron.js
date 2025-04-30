const cron = require('node-cron');
const { Listing } = require('../models/listing');

/**
 * Determines the correct listing status based on the status of its codes
 * @param {Array} codes - Array of code objects with soldStatus property
 * @returns {String} - The correct listing status
 */
const determineListingStatus = (codes) => {
  if (!codes || codes.length === 0) {
    return 'draft';
  }

  // Count codes by status
  const statusCounts = {
    active: 0,
    sold: 0,
    expired: 0,
    suspended: 0,
    draft: 0
  };

  codes.forEach(code => {
    if (statusCounts.hasOwnProperty(code.soldStatus)) {
      statusCounts[code.soldStatus]++;
    }
  });

  // Apply the status rules based on the scenarios
  if (statusCounts.active > 0) {
    // Any active code means the listing is active, regardless of other statuses
    return 'active';
  } else if (statusCounts.suspended > 0) {
    // No active codes, but some suspended codes means the listing is suspended
    return 'suspended';
  } else if (statusCounts.expired > 0) {
    // No active or suspended codes, but some expired codes means the listing is expired
    return 'expired';
  } else if (statusCounts.sold === codes.length) {
    // All codes are sold
    return 'sold';
  } else if (statusCounts.draft === codes.length) {
    // All codes are draft
    return 'draft';
  } else if (statusCounts.sold > 0 && statusCounts.draft > 0) {
    // Mix of sold and draft codes
    return 'expired';
  }

  // Default fallback (shouldn't reach here with proper data)
  return 'expired';
};

/**
 * Updates listing statuses based on their codes and expiration dates
 * @param {Object} fastify - Fastify instance for logging
 * @returns {Promise<Object>} - Results of the update operation
 */
const updateListingStatuses = async (fastify) => {
  try {
    const now = new Date();
    
    // Get all listings with their codes
    const allListings = await Listing.find({}).select('+codes');
    
    if (allListings.length === 0) {
      fastify.log.debug('No listings found to update');
      return {
        success: true,
        modifiedCount: 0,
        matchedCount: 0
      };
    }
    
    let updatedListings = 0;
    let updatedCodes = 0;
    let statusChanges = {
      toActive: 0,
      toSold: 0,
      toExpired: 0,
      toSuspended: 0,
      toDraft: 0
    };
    
    // Process each listing
    for (const listing of allListings) {
      let statusChanged = false;
      const isExpired = listing.expirationDate && new Date(listing.expirationDate) < now;
      
      // If expired, update all active codes to expired
      if (isExpired && listing.codes && listing.codes.length > 0) {
        for (const code of listing.codes) {
          if (code.soldStatus === 'active') {
            code.soldStatus = 'expired';
            updatedCodes++;
            statusChanged = true;
          }
        }
      }
      
      // Determine the correct listing status based on all code statuses
      // First, check if all codes are sold (special case that needs immediate attention)
      let newStatus;
      
      if (listing.codes && listing.codes.length > 0) {
        const allSold = listing.codes.every(code => code.soldStatus === 'sold');
        if (allSold) {
          newStatus = 'sold';
        } else if (isExpired) {
          // If expired by date, mark as expired
          newStatus = 'expired';
        } else {
          // Otherwise use the standard determination logic
          newStatus = determineListingStatus(listing.codes);
        }
      } else {
        // No codes
        newStatus = listing.status === 'draft' ? 'draft' : 'suspended';
      }
      
      // Update listing status if it's changed
      if (listing.status !== newStatus || statusChanged) {
        // Track which status it changed to
        if (listing.status !== newStatus) {
          statusChanges[`to${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`]++;
        }
        
        listing.status = newStatus;
        listing.updatedAt = now;
        
        // Save the updated listing
        await listing.save();
        updatedListings++;
      }
    }
    
    fastify.log.info(`Updated ${updatedListings} listings (${statusChanges.toActive} to active, ${statusChanges.toSold} to sold, ${statusChanges.toExpired} to expired, ${statusChanges.toSuspended} to suspended, ${statusChanges.toDraft} to draft) and ${updatedCodes} active codes to expired`);
    
    return {
      success: true,
      modifiedCount: updatedListings,
      matchedCount: updatedListings,
      updatedCodes: updatedCodes,
      statusChanges
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
 * Sets up a cron job to automatically update listing statuses
 * @param {Object} fastify - Fastify instance for logging
 */
const setupListingExpirationCron = (fastify) => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    fastify.log.info('Running scheduled task: updating listing statuses');
    await updateListingStatuses(fastify);
  });
  
  fastify.log.info('Listing status update cron job scheduled to run every minute');
};

module.exports = {
  setupListingExpirationCron,
  updateListingStatuses
};
