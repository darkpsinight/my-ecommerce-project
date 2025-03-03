const { configs } = require("../configs");
const { getRefreshTokenOptns } = require("../models/refreshToken");

const sendErrorResponse = (reply, statusCode, message, options = {}) => {
  let error = "Internal Server Error";
  switch (statusCode) {
    case 400:
      error = "Bad Request";
      break;
    case 404:
      error = "Not Found";
      break;
    case 403:
      error = "Forbidden";
      break;
    case 409:
      error = "Conflict";
      break;
    case 429:
      error = "Too many requests";
      break;
    default:
      break;
  }
  if (!options.redirectURL) {
    if (options.clearCookie) {
      reply.clearCookie("refreshToken", getRefreshTokenOptns());
    }
    const response = {
      statusCode,
      error,
      message,
      success: false,
    };

    // Add metadata if provided
    if (options.metadata) {
      response.metadata = options.metadata;
    }

    reply.status(statusCode).send(response);
  } else {
    reply
      .code(302)
      .redirect(
        `${options.redirectURL}/confirmation?error=${error}&message=${message}&success=false`
      );
  }
};

const sendSuccessResponse = (reply, response, options = {}) => {
  if (!options.redirectURL) {
    if (options.refreshToken) {
      reply.setCookie(
        "refreshToken",
        options.refreshToken,
        getRefreshTokenOptns()
      );

      // Add refreshToken to response if REFRESH_RESPONSE is enabled
      if (configs.REFRESH_RESPONSE) {
        response.refreshToken = options.refreshToken;
      }
    }
    if (options.clearCookie) {
      reply.clearCookie("refreshToken", getRefreshTokenOptns());
    }
    reply.code(response.statusCode).send({
      ...response,
      success: true,
    });
  } else {
    reply
      .code(302)
      .redirect(
        `${options.redirectURL}?statusCode=${response.statusCode}&message=${response.message}&success=true`
      );
  }
};

const redirectWithoutToken = (reply, token, options) => {
  reply
    .code(302)
    .redirect(`${options.redirectURL}/confirmation?success=true`);
};

const redirectWithToken = (reply, token, options) => {
  reply
    .code(302)
    .redirect(`${options.redirectURL}/change-password?token=${token}&success=true`);
};

module.exports = {
  sendErrorResponse,
  sendSuccessResponse,
  redirectWithToken,
  redirectWithoutToken
};
  