/**
 * Utility functions for handling listing operations
 */

/**
 * Determines the correct listing status based on the status of its codes
 * @param {Array} codes - Array of code objects with soldStatus property
 * @param {String} currentStatus - The current status of the listing
 * @returns {String} - The correct listing status
 */
const determineListingStatus = (codes, currentStatus) => {
  // If no codes, return draft if it's already draft, otherwise suspended
  if (!codes || codes.length === 0) {
    return currentStatus === 'draft' ? 'draft' : 'suspended';
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

  // Preserve draft status if explicitly set
  if (currentStatus === 'draft') {
    return 'draft';
  }

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
 * Checks and updates a listing's status based on its codes and expiration date
 * This function modifies the listing object directly
 *
 * @param {Object} listing - The listing object to check
 * @returns {Boolean} - True if the listing status was updated, false otherwise
 */
const checkAndUpdateListingStatus = (listing) => {
  if (!listing) {
    return false;
  }

  const now = new Date();

  // Check each code for expiration
  let codesUpdated = false;
  if (listing.codes && listing.codes.length > 0) {
    for (const code of listing.codes) {
      if (code.soldStatus === 'active' && code.expirationDate && new Date(code.expirationDate) < now) {
        code.soldStatus = 'expired';
        codesUpdated = true;
      }
    }
  }

  // Special case: check if all codes are sold
  const allCodesSold = listing.codes &&
                      listing.codes.length > 0 &&
                      listing.codes.every(code => code.soldStatus === 'sold');

  // Determine correct status
  let correctStatus;
  if (allCodesSold) {
    correctStatus = 'sold';
  } else {
    correctStatus = determineListingStatus(listing.codes, listing.status);
  }

  // Update if status changed
  if (listing.status !== correctStatus || codesUpdated) {
    listing.status = correctStatus;
    listing.updatedAt = now;
    return true;
  }

  return false;
};

/**
 * Processes an array of listings to check and update their statuses
 * Updates their status in the response if needed
 *
 * @param {Array} listings - Array of listing objects
 * @param {Object} fastify - Fastify instance for logging (optional)
 * @returns {Number} - Number of listings that were updated
 */
const processListingsExpiration = (listings, fastify = null) => {
  if (!Array.isArray(listings) || listings.length === 0) {
    return 0;
  }

  let updatedCount = 0;
  let statusChanges = {
    toActive: 0,
    toSold: 0,
    toExpired: 0,
    toSuspended: 0,
    toDraft: 0
  };

  listings.forEach(listing => {
    const oldStatus = listing.status;
    if (checkAndUpdateListingStatus(listing)) {
      updatedCount++;

      // Track status changes
      if (oldStatus !== listing.status) {
        const statusKey = `to${listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}`;
        if (statusChanges[statusKey] !== undefined) {
          statusChanges[statusKey]++;
        }
      }
    }
  });

  if (updatedCount > 0 && fastify) {
    fastify.log.info(`Real-time status check: Updated ${updatedCount} listings in response (${statusChanges.toActive} to active, ${statusChanges.toSold} to sold, ${statusChanges.toExpired} to expired, ${statusChanges.toSuspended} to suspended, ${statusChanges.toDraft} to draft)`);
  }

  return updatedCount;
};

module.exports = {
  determineListingStatus,
  checkAndUpdateListingStatus,
  processListingsExpiration
};
