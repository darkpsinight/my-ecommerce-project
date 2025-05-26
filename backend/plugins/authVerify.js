const jwt = require("jsonwebtoken");
const { configs } = require("../configs");
const { sendErrorResponse } = require("../utils/responseHelpers");
const { BlacklistedToken } = require("../models/blacklistedToken");

/**
 * Plugin to verify if the user is authenticated/authorized to access
 * route.
 * @param {Array} roles Example ['user'] , ['admin'] , ['user','admin']
 * @returns
 */
const verifyAuth = (roles = []) => {
	return async (request, reply) => {
		try {
			request.log.info(`Verifying user auth roles: ${roles}`);
			request.JWT_TYPE = "auth";

			// Get the authorization header
			const authorizationHeader = request.headers["authorization"];

			// If the token is not sent in authorization header send error
			if (!authorizationHeader) {
				return sendErrorResponse(
					reply,
					401,
					"Unauthorized: Token in the authorization header missing"
				);
			}

			if (!authorizationHeader.startsWith("Bearer ")) {
				return sendErrorResponse(
					reply,
					401,
					"Unauthorized: Invalid token format. Please send the token as Bearer token"
				);
			}

			// Get the token from header
			const token = authorizationHeader.substring(7, authorizationHeader.length);

			// First verify if the token is valid before checking blacklist
			const decoded = jwt.verify(token, configs.JWT_KEY);

			// Check if token is blacklisted
			const isBlacklisted = await BlacklistedToken.findOne({ token });
			request.log.info(`Checking if token is blacklisted for user: ${decoded.email}`);

			if (isBlacklisted) {
				request.log.warn(`Attempt to use blacklisted token by user: ${decoded.email}`);
				return sendErrorResponse(
					reply,
					401,
					"Unauthorized: Token has been invalidated due to logout"
				);
			}

			// Check if user has any of the required roles
			const userRoles = decoded.roles || [];
			const hasRequiredRole = roles.some(requiredRole => userRoles.includes(requiredRole));

			if (!hasRequiredRole) {
				request.log.warn(`Unauthorized role access attempt by user: ${decoded.email}, user roles: ${userRoles.join(',')}, required roles: ${roles.join(',')}`);
				return sendErrorResponse(
					reply,
					403,
					"Forbidden: You have no permission to access this resource"
				);
			}

			request.user = decoded;
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				return sendErrorResponse(
					reply,
					401,
					"Unauthorized: Token has expired"
				);
			} else if (error instanceof jwt.JsonWebTokenError) {
				return sendErrorResponse(
					reply,
					401,
					"Unauthorized: Invalid token"
				);
			} else {
				request.log.error(`Auth verification error: ${error.message}`);
				return sendErrorResponse(
					reply,
					401,
					"Unauthorized: Token verification failed"
				);
			}
		}
	};
};

module.exports = {
	verifyAuth,
};
