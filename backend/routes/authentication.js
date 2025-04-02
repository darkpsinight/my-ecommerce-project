const {
	registerUser,
	confirmEmail,
	requestResetPasswordToken,
	requestConfirmationEmail,
	resetPasswordTokenRedirect,
	resetPasswordFromToken,
	updatePassword,
	signin,
	getJWTFromRefresh,
	revokeRefreshToken,
	revokeAllRefreshTokens,
	getAccount,
	deleteAccount,
	requestLoginWithEmail,
	loginWithEmail,
	reactivateAccount,
	logout,
	updateUserRole,
	sellerSignin,
} = require("../handlers/authenticationHandler");
const { verifyAuth } = require("../plugins/authVerify");
const {
	checkDeactivated,
	checkEmailConfirmed,
	attachUser,
	attachUserWithPassword,
	checkPasswordLength,
	checkMailingDisabled,
	recaptchaVerification,
	attachUserForPasswordReset,
} = require("../plugins/authHelperPlugins");
const { tokenCheck } = require("../plugins/tokenCheck");
const { authenticationSchema } = require("./schemas/authSchema");
const { configs } = require("../configs");
const { verifyRefresh } = require("../plugins/refreshVerify");
const { rateLimiter } = require("../plugins/rateLimiter");

// Rate limit configurations using environment variables
const rateLimits = {
	auth: {
		windowMs: parseInt(configs.RATE_LIMIT_AUTH_WINDOW_MS),
		max: parseInt(configs.RATE_LIMIT_AUTH_MAX_REQUESTS)
	},
	sensitive: {
		windowMs: parseInt(configs.RATE_LIMIT_SENSITIVE_WINDOW_MS),
		max: parseInt(configs.RATE_LIMIT_SENSITIVE_MAX_REQUESTS)
	},
	email: {
		windowMs: parseInt(configs.RATE_LIMIT_EMAIL_WINDOW_MS),
		max: parseInt(configs.RATE_LIMIT_EMAIL_MAX_REQUESTS)
	},
	standardRead: {
		windowMs: parseInt(configs.RATE_LIMIT_STANDARD_READ_WINDOW_MS),
		max: parseInt(configs.RATE_LIMIT_STANDARD_READ_MAX_REQUESTS)
	},
	standardWrite: {
		windowMs: parseInt(configs.RATE_LIMIT_STANDARD_WRITE_WINDOW_MS),
		max: parseInt(configs.RATE_LIMIT_STANDARD_WRITE_MAX_REQUESTS)
	},
	passwordReset: {
		windowMs: parseInt(configs.RATE_LIMIT_PASSWORD_RESET_WINDOW_MS),
		max: parseInt(configs.RATE_LIMIT_PASSWORD_RESET_MAX_REQUESTS)
	}
};

const authenticationRoutes = async (fastify, opts) => {
	if (!configs.DISABLE_EMAIL_LOGIN) {
		// signup and sign in routes
		fastify.route({
			method: "POST",
			url: "/signup",
			schema: authenticationSchema.signup,
			preHandler: [
				rateLimiter(rateLimits.auth),
				recaptchaVerification
			],
			handler: registerUser,
		});

		fastify.route({
			method: "POST",
			url: "/signin",
			preHandler: [
				rateLimiter(rateLimits.auth),
				recaptchaVerification,
				attachUserWithPassword(true),
				checkDeactivated,
				checkEmailConfirmed,
			],
			schema: authenticationSchema.signin,
			handler: signin,
		});

		// Seller/Admin login route
		fastify.route({
			method: "POST",
			url: "/seller-signin",
			preHandler: [
				rateLimiter(rateLimits.auth),
				recaptchaVerification,
				attachUserWithPassword(true),
				checkDeactivated,
				checkEmailConfirmed,
			],
			schema: authenticationSchema.signin, // Reuse the signin schema
			handler: sellerSignin,
		});

		// Route to check reset password token and redirect to frontend
		fastify.route({
			method: "GET",
			url: "/reset-password",
			preHandler: [
				rateLimiter(rateLimits.standardRead),
				tokenCheck("password", true)
			],
			schema: authenticationSchema.resetPasswordGet,
			handler: resetPasswordTokenRedirect,
		});

		// Request for reset password token
		fastify.route({
			method: "POST",
			url: "/reset-password",
			schema: authenticationSchema.resetPasswordPost,
			preHandler: [
				rateLimiter(rateLimits.passwordReset),  // Use the new password reset specific rate limit
				recaptchaVerification,
				checkMailingDisabled,
				attachUserForPasswordReset(true),
				checkDeactivated,
			],
			handler: requestResetPasswordToken,
		});

		// Route to reset password from token
		fastify.route({
			method: "PUT",
			url: "/reset-password",
			schema: authenticationSchema.resetPasswordPut,
			preHandler: [
				rateLimiter(rateLimits.sensitive),
				tokenCheck("password"),
				checkPasswordLength
			],
			handler: resetPasswordFromToken,
		});

		// Route to update the password when the user is logged in
		fastify.route({
			method: "PUT",
			url: "/updatePassword",
			preHandler: [
				rateLimiter(rateLimits.sensitive),
				verifyAuth(["admin", "seller", "buyer", "support"]),
				checkDeactivated,
				checkEmailConfirmed,
				attachUserWithPassword(false),
				checkPasswordLength,
			],
			schema: authenticationSchema.updatePassword,
			handler: updatePassword,
		});
	}

	// Route to redirect user to the frontend
	fastify.route({
		method: "GET",
		url: "/confirmEmail",
		preHandler: [
			rateLimiter(rateLimits.standardRead),
			tokenCheck("confirmEmail", true)
		],
		schema: authenticationSchema.confirmEmailGet,
		handler: confirmEmail,
	});

	// Route to request to resend confirmation email
	fastify.route({
		method: "POST",
		url: "/confirmEmail",
		schema: authenticationSchema.confirmEmailPost,
		preHandler: [
			rateLimiter(rateLimits.email),
			recaptchaVerification,
			checkMailingDisabled,
			attachUser(true),
			checkDeactivated,
		],
		handler: requestConfirmationEmail,
	});

	fastify.route({
		method: "POST",
		url: "/emailLogin",
		schema: authenticationSchema.loginWithEmailPost,
		preHandler: [
			rateLimiter(rateLimits.email),
			recaptchaVerification,
			checkMailingDisabled
		],
		handler: requestLoginWithEmail,
	});

	fastify.route({
		method: "GET",
		url: "/emailLogin",
		preHandler: [
			rateLimiter(rateLimits.standardRead),
			tokenCheck("loginWithEmail", true)
		],
		schema: authenticationSchema.loginWithEmailGet,
		handler: loginWithEmail,
	});

	// Route to get account information
	fastify.route({
		method: "GET",
		url: "/account",
		preHandler: [
			rateLimiter(rateLimits.standardRead),
			verifyAuth(["admin", "seller", "buyer", "support"]),
			attachUser(false),
			checkEmailConfirmed,
			checkDeactivated,
		],
		schema: authenticationSchema.getAccount,
		handler: getAccount,
	});

	// Route to delete account
	fastify.route({
		method: "DELETE",
		url: "/account",
		preHandler: [
			rateLimiter(rateLimits.sensitive),
			verifyAuth(["admin", "seller", "buyer", "support"]),
			checkDeactivated,
			checkEmailConfirmed,
			attachUserWithPassword(false),
		],
		schema: authenticationSchema.deleteAccount,
		handler: deleteAccount,
	});

	// Route to reactivate a deactivated account
	fastify.route({
		method: "POST",
		url: "/reactivate",
		schema: authenticationSchema.reactivateAccount,
		preHandler: [
			rateLimiter(rateLimits.sensitive),
			recaptchaVerification
		],
		handler: reactivateAccount,
	});

	// Route to get new JWT & refresh token
	fastify.route({
		method: "POST",
		url: "/refresh",
		schema: authenticationSchema.refreshJWTToken,
		preValidation: fastify.csrfProtection,
		preHandler: [
			rateLimiter(rateLimits.auth),
			verifyRefresh
		],
		handler: getJWTFromRefresh,
	});

	// Route for user logout
	fastify.route({
		method: "POST",
		url: "/logout",
		schema: {
			response: {
				200: {
					type: 'object',
					properties: {
						success: { type: 'boolean' },
						message: { type: 'string' }
					}
				}
			}
		},
		preHandler: [
			rateLimiter(rateLimits.auth),
			verifyAuth(["admin", "seller", "buyer", "support"]),
			attachUser(false)
		],
		handler: logout,
	});

	fastify.route({
		method: "PUT",
		url: "/refresh/revoke",
		schema: authenticationSchema.revokeRefreshToken,
		preValidation: fastify.csrfProtection,
		preHandler: [
			rateLimiter(rateLimits.sensitive),
			verifyAuth(["admin", "seller", "buyer", "support"]),
			checkDeactivated,
			verifyRefresh,
		],
		handler: revokeRefreshToken,
	});

	// Route to revoke all refresh tokens
	fastify.route({
		method: "PUT",
		url: "/revokeAll",
		schema: authenticationSchema.revokeAll,
		preHandler: [
			rateLimiter(rateLimits.sensitive),
			verifyAuth(["admin", "seller", "buyer", "support"]),
			checkDeactivated,
			attachUser(false),
		],
		handler: revokeAllRefreshTokens,
	});

	// Route to update user role (admin/support only)
	fastify.route({
		method: "PUT",
		url: "/role/:uid",
		schema: authenticationSchema.updateUserRole,
		preHandler: [
			rateLimiter(rateLimits.sensitive),
			verifyAuth(["admin", "support"]),
			checkDeactivated,
			checkEmailConfirmed
		],
		handler: updateUserRole,
	});

	// Route to get user public information
	fastify.route({
		method: "GET",
		url: "/user-info",
		schema: {
			description: "Get user public information",
			tags: ["authentication"],
			response: {
				200: {
					type: "object",
					properties: {
						success: { type: "boolean" },
						data: {
							type: "object",
							properties: {
								email: { type: "string" },
								name: { type: "string" },
								role: { type: "string" }
							}
						}
					}
				}
			},
			security: [{ JWTToken: [] }]
		},
		preHandler: [
			rateLimiter(rateLimits.standardRead),
			verifyAuth(["admin", "seller", "buyer", "support"])
		],
		handler: async (request, reply) => {
			try {
				const { email, name, role } = request.user;
				return reply.code(200).send({
					success: true,
					data: {
						email,
						name,
						role
					}
				});
			} catch (error) {
				request.log.error(`Error getting user info: ${error.message}`);
				return sendErrorResponse(
					reply,
					500,
					"Internal Server Error: Failed to get user information"
				);
			}
		}
	});
};

module.exports = {
	authenticationRoutes,
};
