const ImageKit = require('imagekit');
const { v4: uuidv4 } = require('uuid');

/**
 * Initialize ImageKit with credentials from environment variables
 */
let imagekit;

try {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
  });

  // Log ImageKit configuration for debugging (without showing full private key)
  console.log('ImageKit Configuration:');
  console.log('- Public Key:', process.env.IMAGEKIT_PUBLIC_KEY);
  console.log('- Private Key:', process.env.IMAGEKIT_PRIVATE_KEY ?
    `${process.env.IMAGEKIT_PRIVATE_KEY.substring(0, 5)}...${process.env.IMAGEKIT_PRIVATE_KEY.substring(process.env.IMAGEKIT_PRIVATE_KEY.length - 5)}` :
    'Not configured');
  console.log('- URL Endpoint:', process.env.IMAGEKIT_URL_ENDPOINT);
} catch (error) {
  console.error('Error initializing ImageKit:', error);
}

/**
 * Upload an image to ImageKit
 * @param {Object} request - Fastify request object
 * @param {Object} reply - Fastify reply object
 * @returns {Promise<Object>} - Response object with uploaded image URL
 */
const uploadImage = async (request, reply) => {
  try {
    const { file } = request;

    // Log for debugging
    request.log.info(`Upload request received from user: ${request.user.email}`);

    if (!file) {
      request.log.error('No file found in request');
      return reply.code(400).send({
        success: false,
        message: 'No file uploaded'
      });
    }

    request.log.info(`File received: ${file.filename}, size: ${file.buffer ? file.buffer.length : 'unknown'} bytes`);

    // Generate a unique file name
    const fileName = `${uuidv4()}-${file.filename}`;

    // Check if ImageKit is properly initialized
    if (!imagekit) {
      request.log.error('ImageKit is not properly initialized');
      return reply.code(500).send({
        success: false,
        message: 'Image upload service is not available',
        error: 'ImageKit initialization failed'
      });
    }

    // Use direct buffer upload which is more efficient
    request.log.info(`Uploading to ImageKit: ${fileName}, size: ${file.buffer.length} bytes`);

    try {
      // Use the promise-based API directly
      const uploadResponse = await imagekit.upload({
        file: file.buffer,
        fileName: fileName,
        folder: '/product-thumbnails',
        useUniqueFileName: true
      });

      request.log.info(`ImageKit upload successful: ${uploadResponse.url}`);

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
    const authenticationParameters = imagekit.getAuthenticationParameters();

    return reply.code(200).send({
      success: true,
      data: authenticationParameters
    });
  } catch (error) {
    request.log.error(`Error getting auth params: ${error.message}`);
    return reply.code(500).send({
      success: false,
      message: 'Failed to get authentication parameters',
      error: error.message
    });
  }
};

module.exports = {
  uploadImage,
  getAuthParams
};
