const ImageKit = require('imagekit');
const { v4: uuidv4 } = require('uuid');
const { configs } = require('../configs');

/**
 * Define allowed folders for image uploads
 */
const ALLOWED_FOLDERS = {
  PRODUCT_THUMBNAILS: '/listing-thumbnails',
  CATEGORY_IMAGES: '/categories-placeholder-pictures',
  SELLER_PROFILE_IMAGES: '/seller-profile-pictures',
  SELLER_BANNER_IMAGES: '/seller-profile-banners',
  BUYER_PROFILE_IMAGES: '/buyer-profile-pictures'
};

/**
 * Initialize ImageKit with credentials from configuration system
 * This will be initialized when the module is loaded, and can be re-initialized
 * if configuration changes are detected
 */
let imagekit = null;

/**
 * Initialize or re-initialize the ImageKit instance with current configuration values
 * @param {Object} fastify - Fastify instance for logging (optional)
 * @returns {boolean} - Whether initialization was successful
 */
const initializeImageKit = (fastify) => {
  try {
    // Get ImageKit configuration from the centralized config system
    const publicKey = configs.IMAGEKIT_PUBLIC_KEY;
    const privateKey = configs.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = configs.IMAGEKIT_URL_ENDPOINT;

    // Check if all required configuration values are available
    if (!publicKey || !privateKey || !urlEndpoint) {
      if (fastify) {
        fastify.log.error('ImageKit configuration is incomplete. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in the configuration system.');
      } else {
        console.error('ImageKit configuration is incomplete. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in the configuration system.');
      }
      return false;
    }

    // Create a new ImageKit instance
    imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint
    });

    // Log ImageKit configuration for debugging (without showing full private key)
    if (fastify) {
      fastify.log.info('ImageKit Configuration:');
      fastify.log.info(`- Public Key: ${publicKey}`);
      fastify.log.info(`- Private Key: ${privateKey ? `${privateKey.substring(0, 5)}...${privateKey.substring(privateKey.length - 5)}` : 'Not configured'}`);
      fastify.log.info(`- URL Endpoint: ${urlEndpoint}`);
    } else {
      console.log('ImageKit Configuration:');
      console.log(`- Public Key: ${publicKey}`);
      console.log(`- Private Key: ${privateKey ? `${privateKey.substring(0, 5)}...${privateKey.substring(privateKey.length - 5)}` : 'Not configured'}`);
      console.log(`- URL Endpoint: ${urlEndpoint}`);
    }

    return true;
  } catch (error) {
    if (fastify) {
      fastify.log.error(`Error initializing ImageKit: ${error.message}`);
      fastify.log.error(error.stack);
    } else {
      console.error('Error initializing ImageKit:', error);
    }
    return false;
  }
};

// We'll initialize ImageKit when it's first needed rather than at module load time
// This ensures that configuration values have been loaded from the database

/**
 * Upload an image to ImageKit
 * @param {Object} request - Fastify request object
 * @param {Object} reply - Fastify reply object
 * @returns {Promise<Object>} - Response object with uploaded image URL
 */
const uploadImage = async (request, reply) => {
  try {
    const { file } = request;
    // Get folder from query parameters or body, default to product-thumbnails
    let folder = request.query.folder || request.body?.folder || ALLOWED_FOLDERS.PRODUCT_THUMBNAILS;

    // Log for debugging
    request.log.info(`Upload request received from user: ${request.user.email}, folder: ${folder}`);

    // Validate folder - ensure it's one of the allowed folders
    const allowedFolderValues = Object.values(ALLOWED_FOLDERS);
    if (!allowedFolderValues.includes(folder)) {
      request.log.warn(`Invalid folder specified: ${folder}, using default: ${ALLOWED_FOLDERS.PRODUCT_THUMBNAILS}`);
      folder = ALLOWED_FOLDERS.PRODUCT_THUMBNAILS;
    }

    // Ensure folder path doesn't have spaces or special characters
    folder = folder.trim().replace(/\s+/g, '-').toLowerCase();

    if (!file) {
      request.log.error('No file found in request');
      return reply.code(400).send({
        success: false,
        message: 'No file uploaded'
      });
    }

    request.log.info(`File received: ${file.filename}, size: ${file.buffer ? file.buffer.length : 'unknown'} bytes`);

    // Extract file extension from original filename
    let fileExtension = file.filename.split('.').pop() || 'jpg';

    // Validate and sanitize file extension
    // Only allow common image extensions
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    fileExtension = fileExtension.toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      request.log.warn(`Invalid file extension: ${fileExtension}, defaulting to jpg`);
      fileExtension = 'jpg';
    }

    // Generate a unique file name using only UUID and the sanitized extension
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Check if ImageKit is properly initialized, if not, try to initialize it
    if (!imagekit) {
      request.log.warn('ImageKit is not initialized, attempting to initialize...');
      const initialized = initializeImageKit(request.server);

      if (!initialized) {
        request.log.error('ImageKit initialization failed. Please check configuration values.');
        return reply.code(500).send({
          success: false,
          message: 'Image upload service is not available',
          error: 'ImageKit configuration is missing or invalid. Please configure IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in the system.'
        });
      }
    }

    // Use direct buffer upload which is more efficient
    request.log.info(`Uploading to ImageKit: ${fileName}, size: ${file.buffer.length} bytes, folder: ${folder}`);

    try {
      // Use the promise-based API directly
      const uploadResponse = await imagekit.upload({
        file: file.buffer,
        fileName: fileName,
        folder: folder,
        useUniqueFileName: false // Set to false since we're already using UUID for the filename
      });

      request.log.info(`ImageKit upload successful: ${uploadResponse.url}`);
      request.log.info(`Uploaded with filename: ${uploadResponse.name}, fileId: ${uploadResponse.fileId}`);

      return reply.code(200).send({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: uploadResponse.url,
          fileId: uploadResponse.fileId,
          name: uploadResponse.name
        }
      });
    } catch (uploadError) {
      request.log.error(`ImageKit upload error: ${uploadError.message}`);
      request.log.error(uploadError.stack);

      // If the error is related to authentication, try to re-initialize ImageKit
      if (uploadError.message.includes('authentication') || uploadError.message.includes('auth') || uploadError.message.includes('credentials')) {
        request.log.warn('Authentication error detected, attempting to re-initialize ImageKit with latest configuration...');

        // Log current configuration values (partially masked for security)
        const publicKey = configs.IMAGEKIT_PUBLIC_KEY;
        const privateKey = configs.IMAGEKIT_PRIVATE_KEY;
        const urlEndpoint = configs.IMAGEKIT_URL_ENDPOINT;

        request.log.info('Current ImageKit configuration:');
        request.log.info(`- Public Key: ${publicKey || 'Not configured'}`);
        request.log.info(`- Private Key: ${privateKey ? `${privateKey.substring(0, 5)}...${privateKey.substring(privateKey.length - 5)}` : 'Not configured'}`);
        request.log.info(`- URL Endpoint: ${urlEndpoint || 'Not configured'}`);

        // Try to re-initialize
        const initialized = initializeImageKit(request.server);
        request.log.info(`Re-initialization ${initialized ? 'successful' : 'failed'}`);
      }

      return reply.code(500).send({
        success: false,
        message: 'Failed to upload image to ImageKit',
        error: uploadError.message
      });
    }
  } catch (error) {
    request.log.error(`Error in upload handler: ${error.message}`);
    request.log.error(error.stack);

    return reply.code(500).send({
      success: false,
      message: 'Failed to process image upload',
      error: error.message
    });
  }
};

/**
 * Get ImageKit authentication parameters for client-side uploads
 * @param {Object} request - Fastify request object
 * @param {Object} reply - Fastify reply object
 * @returns {Object} - Authentication parameters
 */
const getAuthParams = async (request, reply) => {
  try {
    // Check if ImageKit is properly initialized, if not, try to initialize it
    if (!imagekit) {
      request.log.warn('ImageKit is not initialized, attempting to initialize...');
      const initialized = initializeImageKit(request.server);

      if (!initialized) {
        request.log.error('ImageKit initialization failed. Please check configuration values.');
        return reply.code(500).send({
          success: false,
          message: 'Image upload service is not available',
          error: 'ImageKit configuration is missing or invalid. Please configure IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in the system.'
        });
      }
    }

    const authenticationParameters = imagekit.getAuthenticationParameters();

    return reply.code(200).send({
      success: true,
      data: authenticationParameters
    });
  } catch (error) {
    request.log.error(`Error getting auth params: ${error.message}`);

    // If the error is related to authentication, try to re-initialize ImageKit
    if (error.message.includes('authentication') || error.message.includes('auth') || error.message.includes('credentials')) {
      request.log.warn('Authentication error detected, attempting to re-initialize ImageKit with latest configuration...');

      // Log current configuration values (partially masked for security)
      const publicKey = configs.IMAGEKIT_PUBLIC_KEY;
      const privateKey = configs.IMAGEKIT_PRIVATE_KEY;
      const urlEndpoint = configs.IMAGEKIT_URL_ENDPOINT;

      request.log.info('Current ImageKit configuration:');
      request.log.info(`- Public Key: ${publicKey || 'Not configured'}`);
      request.log.info(`- Private Key: ${privateKey ? `${privateKey.substring(0, 5)}...${privateKey.substring(privateKey.length - 5)}` : 'Not configured'}`);
      request.log.info(`- URL Endpoint: ${urlEndpoint || 'Not configured'}`);

      // Try to re-initialize
      const initialized = initializeImageKit(request.server);
      request.log.info(`Re-initialization ${initialized ? 'successful' : 'failed'}`);
    }

    return reply.code(500).send({
      success: false,
      message: 'Failed to get authentication parameters',
      error: error.message
    });
  }
};

/**
 * Register with Fastify to initialize ImageKit after configuration is loaded
 * @param {Object} fastify - Fastify instance
 */
const registerWithFastify = (fastify) => {
  // Initialize ImageKit after the server has started and configs are loaded
  fastify.addHook('onReady', async () => {
    fastify.log.info('Initializing ImageKit with configuration values...');
    const initialized = initializeImageKit(fastify);

    if (initialized) {
      fastify.log.info('ImageKit initialized successfully');
    } else {
      fastify.log.warn('ImageKit initialization failed. Image upload functionality may not work correctly.');
    }
  });
};

module.exports = {
  uploadImage,
  getAuthParams,
  ALLOWED_FOLDERS,
  initializeImageKit,
  registerWithFastify
};
