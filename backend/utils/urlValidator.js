/**
 * URL validation utility functions
 * Provides consistent URL validation across the application
 */

/**
 * Validates if a string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if the URL is valid, false otherwise
 */
const isValidUrl = (url) => {
  if (!url) return false;

  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validates if a string is a valid image URL based on common image extensions
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if the URL is a valid image URL, false otherwise
 */
const isValidImageUrl = (url) => {
  if (!isValidUrl(url)) return false;

  // Check if the URL has a common image extension
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const urlLower = url.toLowerCase();

  // Common image service domains and patterns
  const knownImageServices = [
    'placehold.co',
    'placeholder.com',
    'placekitten.com',
    'picsum.photos',
    'loremflickr.com',
    'dummyimage.com',
    'via.placeholder.com',
    'cloudinary.com',
    'imgix.net',
    'imagekit.io'
  ];

  try {
    const urlObj = new URL(url);

    // Check for known image service domains
    if (knownImageServices.some(service => urlObj.hostname.includes(service))) {
      return true;
    }

    // Check for dimensions in path (common in placeholder services)
    if (/\/\d+x\d+/.test(urlObj.pathname)) {
      return true;
    }

    // If the URL has a query string, consider it valid as it might be a dynamic image
    if (urlObj.search.length > 0) {
      return true;
    }

    // Check for common image extensions
    if (imageExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext))) {
      return true;
    }

    // If the path doesn't contain a dot (likely no file extension), consider it a valid dynamic image URL
    if (!urlObj.pathname.includes('.')) {
      return true;
    }

    // If none of the above conditions match, check if the URL ends with a known image extension
    return imageExtensions.some(ext => urlLower.endsWith(ext));
  } catch (error) {
    // If URL parsing fails (which shouldn't happen since we already checked isValidUrl)
    return false;
  }
};

/**
 * Validates a URL and returns an error message if invalid
 * @param {string} url - The URL to validate
 * @param {boolean} requireImage - Whether to require an image URL
 * @returns {string} - Error message if invalid, empty string if valid
 */
const validateUrl = (url, requireImage = false) => {
  if (!url) return '';

  if (!isValidUrl(url)) {
    return 'Please enter a valid URL';
  }

  if (requireImage && !isValidImageUrl(url)) {
    return 'Please enter a valid image URL';
  }

  return '';
};

module.exports = {
  isValidUrl,
  isValidImageUrl,
  validateUrl
};
