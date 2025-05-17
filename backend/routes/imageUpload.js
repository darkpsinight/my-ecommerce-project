// imageUpload.js
const { verifyAuth } = require("../plugins/authVerify");
const { uploadImage, getAuthParams } = require("../handlers/imageUploadHandler");

/**
 * Routes for image upload functionality
 * @param {Object} fastify - Fastify instance
 * @param {Object} options - Route options
 */
const imageUploadRoutes = async (fastify, options) => {
  // Configure rate limits for different operations
  const uploadRateLimit = {
    max: 30,
    timeWindow: '1 minute',
    errorResponseBuilder: function (req, context) {
      return {
        success: false,
        error: 'Too many image upload requests',
        message: `Rate limit exceeded, retry in ${context.after}`
      };
    }
  };

  const readRateLimit = {
    max: 60,
    timeWindow: '1 minute',
    errorResponseBuilder: function (req, context) {
      return {
        success: false,
        error: 'Too many auth parameter requests',
        message: `Rate limit exceeded, retry in ${context.after}`
      };
    }
  };

  // Upload an image to ImageKit
  fastify.route({
    config: {
      rateLimit: uploadRateLimit
    },
    method: "POST",
    url: "/upload",
    preHandler: [
      verifyAuth(["seller", "admin"]),
      // Use the multipart content parser
      async (request, reply) => {
        try {
          request.log.info('Processing multipart file upload');

          // Simplified approach using the multipart plugin directly
          const data = await request.file();

          if (!data || !data.file) {
            request.log.error('No file found in the multipart request');
            return reply.code(400).send({
              success: false,
              message: "No file found in the request"
            });
          }

          request.log.info(`File received: ${data.filename}, mimetype: ${data.mimetype}`);

          // Create a buffer from the file
          const fileBuffer = await data.toBuffer();
          request.log.info(`File read complete: ${fileBuffer.length} bytes`);

          // Create a file object
          request.file = {
            filename: data.filename,
            mimetype: data.mimetype,
            buffer: fileBuffer
          };

          request.log.info('File data attached to request');
        } catch (error) {
          request.log.error(`File upload processing error: ${error.message}`);
          return reply.code(400).send({
            success: false,
            message: "Invalid file upload request: " + error.message
          });
        }
      }
    ],
    handler: uploadImage
  });

  // Get ImageKit authentication parameters for client-side uploads
  fastify.route({
    config: {
      rateLimit: readRateLimit
    },
    method: "GET",
    url: "/auth-params",
    preHandler: verifyAuth(["seller", "admin"]),
    handler: getAuthParams
  });
};

module.exports = {
  imageUploadRoutes
};
