import { Listing } from '../../../types';

// Get quantity values from API or calculate as fallback
export const getActiveCodes = (listing: Listing | null): number => {
  if (!listing) return 0;
  return listing.quantityOfActiveCodes !== undefined
    ? listing.quantityOfActiveCodes
    : listing.codes
    ? listing.codes.filter((code) => code.soldStatus === 'active').length
    : 0;
};

export const getTotalCodes = (listing: Listing | null): number => {
  if (!listing) return 0;
  return listing.quantityOfAllCodes !== undefined
    ? listing.quantityOfAllCodes
    : listing.codes
    ? listing.codes.length
    : 0;
};

// Calculate discount percentage if applicable
export const getDiscountPercentage = (listing: Listing | null): number | null => {
  if (
    !listing ||
    !listing.originalPrice ||
    !listing.price ||
    listing.originalPrice <= listing.price
  ) {
    return null;
  }
  return Math.round(
    ((listing.originalPrice - listing.price) / listing.originalPrice) * 100
  );
};
