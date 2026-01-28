const cron = require('node-cron');
const { Listing } = require('../models/listing');
const { determineListingStatus } = require('../utils/listingHelpers');
const { assertCronEnabled } = require('../utils/cronGuard');
const { configs } = require('../configs');

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

      // Check each code for expiration
      if (listing.codes && listing.codes.length > 0) {
        for (const code of listing.codes) {
          if (code.soldStatus === 'active' && code.expirationDate && new Date(code.expirationDate) < now) {
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
        } else {
          // Use the standard determination logic from listingHelpers
          newStatus = determineListingStatus(listing.codes, listing.status);
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
  // Run every 10 minutes
  cron.schedule(configs.LISTING_EXPIRATION_CRON, async () => {
    if (!assertCronEnabled("LISTING_EXPIRATION")) return;
    fastify.log.info('Running scheduled task: updating listing statuses');
    await updateListingStatuses(fastify);
  });

  fastify.log.info('Listing status update cron job scheduled to run every 10 minutes');
};

module.exports = {
  setupListingExpirationCron,
  updateListingStatuses
};
