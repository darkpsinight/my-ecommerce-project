const { configs } = require("../configs");
const {
	sendNewLoginEmail,
	confirmationEmailHelper,
} = require("../utils/services/sendEmail");
const { OauthProviderLogin } = require("../utils/services/oauthProviderLogin");
const crypto = require("crypto");
const {
	sendErrorResponse,
	sendSuccessResponse,
} = require("../utils/responseHelpers");
const { User } = require("../models/user");
const { getRefreshToken } = require("../models/refreshToken");

// @route 	GET /api/v1/auth/oauth/:provider
// @desc	Route which accepts state and returns
//			oauth provider login uri
const getOauthProviderLogin = async (request, reply) => {
	let state = request.query.state;
	const provider = request.provider;
	if (!state) {
		state = crypto.randomBytes(10).toString("hex");
	}
	const oauthHandler = new OauthProviderLogin(provider);
	const loginUrl = oauthHandler.getRedirectUrl(state);
	if (!loginUrl) {
		return sendErrorResponse(reply, 400, "Invalid Login Provider");
	}
	return sendSuccessResponse(reply, {
		statusCode: 200,
		state,
		message: "Successful",
		loginUrl,
	});
};

// @route 	POST /api/v1/auth/oauth/:provider
// @desc	Route which accepts code and returns
//			jwt and refresh token if the code is valid
const postOauthProviderLogin = async (request, reply) => {
	const provider = request.provider;
	const { code } = request.body;
	const oauthHandler = new OauthProviderLogin(provider);
	try {
		const userDetails = await oauthHandler.getUserDetails(code);
		let role;

		if (!userDetails || userDetails.error) {
			return sendErrorResponse(
				reply,
				userDetails.error ? 400 : 404,
				userDetails.error ||
					"Could not get the required details from Oauth provider."
			);
		}

		// Check if the user already exists
		let user = await User.findOne({ email: userDetails.email });

		if (user) {
			// User exists, log them in
			const refreshToken = await getRefreshToken(user, request.ipAddress);
			// Log before setting the cookie
			console.log('Setting refresh token cookie:', refreshToken);
			// Set refresh token in cookie with expiration and path
			reply.setCookie('refreshToken', refreshToken, {
				signed: true,
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
				path: '/', // Available across the entire application
			});
			// Generate CSRF token
			const verifyToken = await reply.generateCsrf();
			return sendSuccessResponse(
				reply,
				{
					statusCode: 200,
					message: "Logged in successfully",
					token: user.getJWT(),
					verifyToken,
				},
			);
		} else {
			// User does not exist, proceed with registration
			if (configs.CHECK_ADMIN) {
				const count = await User.countDocuments();
				if (!count) {
					role = "admin";
				}
			}
			await oauthLoginHelper(request, reply, {
				...userDetails,
				role,
			});
		}
	} catch (error) {
		reply.log.error('Error during OAuth process:', error);
		return sendErrorResponse(reply, 500, 'Internal Server Error');
	}
};

/**
 * Helper Function to sign in or sign up using oauth
 *
 *  userInfo keys :
 * name : User's name
 * email : User's email
 * provider : Oauth2 Provider (example : "github" , "google")
 * verified : If the email of the user is verified
 * role : User's role (example : "user" , "admin")
 */
const oauthLoginHelper = async (request, reply, userInfo) => {
	const { name, email, provider, verified, role } = userInfo;
	let confirmationToken;
	let emailStatus = {
		success: true,
		message: "Email was not sent, since user email was already verified",
	};
	let user = await User.findOne({
		email,
		isDeactivated: false,
	});
	if (user) {
		if (configs.PROVIDER_LOGIN_EMAIL_CONFIRMATION_REQUIRED) {
			if (!user.isEmailConfirmed) {
				return sendErrorResponse(
					reply,
					400,
					"Please confirm the your email by clicking on the link sent to your email address"
				);
			}
		} else {
			const refreshToken = await getRefreshToken(user, request.ipAddress);

			const emailStatus = await sendNewLoginEmail(user, request);
			const verifyToken = await reply.generateCsrf();
			return sendSuccessResponse(
				reply,
				{
					statusCode: 200,
					message: "Signed in",
					token: user.getJWT(),
					emailSuccess: emailStatus.success,
					emailMessage: emailStatus.message,
					verifyToken,
				},
				{ refreshToken }
			);
		}
	} else {
		user = await User.create({
			name,
			email,
			uid: crypto.randomBytes(15).toString("hex"),
			isEmailConfirmed: verified,
			provider,
			role,
		});
		if (!verified) {
			confirmationToken = user.getEmailConfirmationToken();
		}
		user.save({ validateBeforeSave: true });
		if (confirmationToken) {
			emailStatus = await confirmationEmailHelper(
				user,
				request,
				confirmationToken
			);
		}
		const refreshToken = await getRefreshToken(user, request.ipAddress);
		const verifyToken = await reply.generateCsrf();
		return sendSuccessResponse(
			reply,
			{
				statusCode: 201,
				message: "Sign up successful",
				token: user.getJWT(),
				emailSuccess: emailStatus.success,
				emailMessage: emailStatus.message,
				verifyToken,
			},
			{ refreshToken }
		);
	}
};

module.exports = {
	getOauthProviderLogin,
	postOauthProviderLogin,
};
