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

			let token = null;

			// 1. Check Authorization header
			const authorizationHeader = request.headers["authorization"];
			if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
				token = authorizationHeader.substring(7);
			}

			// 2. Fallback to cookies if no valid header token
			// Check both admin_auth_token and token (common names)
			if (!token && request.cookies) {
				if (request.cookies.admin_auth_token) {
					token = request.cookies.admin_auth_token;
				} else if (request.cookies.token) {
					token = request.cookies.token;
				}
			}

			// If no token found
			if (!token) {
				return sendErrorResponse(
					reply,
					401,
					"Unauthorized: Authentication token missing"
				);
			}

			// 3. Sanitize token (remove quotes and whitespace)
			// This fixes the issue where cookies or headers might contain double-quoted strings
			token = token.trim().replace(/^"+|"+$/g, '');

			if (!token) {
				return sendErrorResponse(
					reply,
					401,
					"Unauthorized: Invalid token format"
				);
			}

			// 4. Verify token
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
				// Catch all other errors as 401/403 to prevent 500s during auth
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
