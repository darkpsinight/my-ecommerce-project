const { configs, keywords } = require("../configs");
const { sendErrorResponse } = require("../utils/responseHelpers");

const getErrorHandler = (fastify) => {
  return function (err, request, reply) {
    if (configs.ENVIRONMENT === keywords.DEVELOPMENT_ENV) {
      fastify.log.error(err);
    } else {
      fastify.log.error(err.message);
    }

    if (err.request || err.response) {
      axiosErrorHandler(reply, err);
    }

    //Default Status code and error message
    let statusCode = 500;
    let message = "Error in the server";

    //Send messages as response in development environment
    if (configs.ENVIRONMENT.toLowerCase() === keywords.DEVELOPMENT_ENV) {
      message = err.message;
    }

    //Fastify Schema validation errors
    if (err.validation) {
      message = err.message;
      statusCode = 400;
    }

    if (reply.statusCode === 429) {
      statusCode = 429;
      // Use the original error message from the rate limiter if it exists
      message =
        err.message ||
        "You've exceeded the rate limit. Please wait a moment before sending another message.";
    }

    switch (err.name) {
      case "CastError":
        message = `Resource not found`;
        statusCode = 404;
        break;
      case "TokenExpiredError":
        message =
          request.JWT_TYPE === "auth"
            ? "Session Expired"
            : "Refresh Token Expired";
        statusCode = 403;
        break;
      case "JsonWebTokenError":
        message =
          request.JWT_TYPE === "auth" ? "Token error" : "Refresh Token error";
        statusCode = 403;
        break;
      case "ValidationError":
        // Mongoose validation error
        message = Object.values(err.errors).map((val) => val.message);
        statusCode = 400;
        break;
      case "ForbiddenError":
        message = err.message;
        statusCode = 403;
        break;
      case "TypeError":
        // Handle the case where verifyPassword is called on undefined
        if (err.message === "Illegal arguments: string, undefined") {
          message = "This account was created with Google Sign-In. Please use the 'Sign in with Google' button instead of email/password.";
          statusCode = 400;
        }
        break;
    }

    // MONGODB : unique key violation
    if (err.code === 11000) {
      message = "Duplicate field value entered";
      statusCode = 400;
    }

    return sendErrorResponse(reply, statusCode, message);
  };
};

// Function used to handle axios errors
const axiosErrorHandler = (reply, err) => {
  switch (err.config.url) {
    case configs.HCAPTCHA_VERIFY_URL:
      return sendErrorResponse(reply, 400, "Robot verification unsuccessful");
      break;
    case configs.GOOGLE_CONFIGS.ACCESS_TOKEN ||
      configs.GOOGLE_CONFIGS.AUTHORIZE:
      return sendErrorResponse(reply, 400, "Could not Login with Google");
      break;
    default:
      return sendErrorResponse(
        reply,
        500,
        "Could not send axios request. Internal Server Error"
      );
      break;
  }
};

module.exports = {
  getErrorHandler,
};
