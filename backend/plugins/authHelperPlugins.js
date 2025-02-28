const { configs } = require("../configs");
const { default: axios } = require("axios");
const { sendErrorResponse } = require("../utils/responseHelpers");
const { User } = require("../models/user");

/**
 * This should be used only after the JWT tokens are verified
 * Can be in the array of preHandlers after verifyAuth
 */
const checkDeactivated = async (request, reply) => {
	request.log.info("Checking if the user account is deactivated");
	const user = request.user || request.userModel;
	if (user.isDeactivated) {
		return sendErrorResponse(reply, 400, "User account is deactivated, please reactivate your account by clicking on the link sent to your email address");
	}
};

/**
 * This should be used only after the JWT tokens are verified
 * Can be in the array of preHandlers after verifyAuth
 */
const checkEmailConfirmed = async (request, reply) => {
	request.log.info("Checking if the user email is confirmed");
	const user = request.user || request.userModel;
	if (!user.isEmailConfirmed) {
		return sendErrorResponse(
			reply,
			400,
			"Please confirm the your email by clicking on the link sent to your email address"
		);
	}
};

/**
 * Attaches user to request object (request.userModel)
 * @param {Boolean} byEmail true if email is being sent in request body.
 * 	false if the route is protected (uses uid from the jwt token)
 * @returns
 */
const attachUser = (byEmail) => {
	return async (request, reply) => {
		request.log.info(
			`Attaching user by ${byEmail ? "email" : "user id in the token"}`
		);
		let user;
		if (!byEmail) {
			user = await User.findOne({
				uid: request.user.uid,
			});
		} else {
			user = await User.findOne({
				email: request.body.email,
			});
		}
		if (!user) {
			return sendErrorResponse(reply, 400, "User not found", {
				metadata: {
					hint: "Please check your credentials or consider creating an account",
					links: {
						signup: "/signup",
						oauth: "/auth/google",
						forgotPassword: "/forgot-password"
					}
				}
			});
		}
		request.userModel = user;
	};
};

/**
 * Attaches user (with password) to request object (request.userModel)
 * @param {Boolean} byEmail true if email is being sent in request body.
 * 	false if the route is protected (uses uid from the jwt token)
 * @returns
 */
const attachUserWithPassword = (byEmail) => {
	return async (request, reply) => {
		request.log.info(
			`Attaching user with password by ${
				byEmail ? "email" : " user id in the token"
			}`
		);
		let user;
		if (!byEmail) {
			user = await User.findOne({
				uid: request.user.uid,
			}).select("+password");
		} else {
			user = await User.findOne({
				email: request.body.email,
			}).select("+password");
		}
		request.log.info(`User retrieved: ${JSON.stringify(user)}`);
		if (!user) {
			return sendErrorResponse(reply, 401, "User not found", {
				metadata: {
					hint: `Please check your email address and password or consider creating an account.`,
					links: {
						oauth: `/auth`
					}
				}
			});
		}
		request.userModel = user;
	};
};

const checkPasswordLength = async (request, reply) => {
	request.log.info("Checking password length");
	const password = request.body.password;
	if (password.length < 8) {
		return sendErrorResponse(reply, 400, "Minimum password length should be 8");
	}
};

const checkMailingDisabled = async (request, reply) => {
	request.log.info("Checking if mailing is disabled in the server");
	if (configs.DISABLE_MAIL) {
		return sendErrorResponse(reply, 500, "Mailing is disabled in the server");
	}
	if (!configs.IS_SMTP_CONFIGURED) {
		return sendErrorResponse(
			reply,
			500,
			"Mailing is not configured in the server"
		);
	}
};

/**
 * Function used to verify reCAPTCHA token
 * @returns
 */
const recaptchaVerification = async (request, reply) => {
	request.log.info("Verifying reCAPTCHA token");
	if (!configs.DISABLE_CAPTCHA) {
		if (!configs.RECAPTCHA_SECRET_KEY) {
			return sendErrorResponse(
				reply,
				500,
				"Robot verification not configured in the server (reCAPTCHA)"
			);
		}
		const recaptchaToken = request.body.recaptchaToken;
		must(reply, recaptchaToken, "Robot verification token missing");
		
		const tokenVerify = await axios({
			method: "POST",
			url: configs.RECAPTCHA_VERIFY_URL,
			params: {
				secret: configs.RECAPTCHA_SECRET_KEY,
				response: recaptchaToken
			}
		});
		
		if (!tokenVerify.data.success) {
			return sendErrorResponse(reply, 400, "Robot verification unsuccessful");
		}
	}
};

// /**
//  *
//  * checkEmailLoginDisabled is used to enable login
//  * with only oauth providers
//  * @returns
//  */
// const checkEmailLoginDisabled = async (request, reply) => {
// 	request.log.info("Checking if email login is disabled");
// 	if (configs.DISABLE_EMAIL_LOGIN) {
// 		return sendErrorResponse(reply, 400, "Email login is disabled");
// 	}
// };

const must = (reply, parameter, message) => {
	if (!parameter) {
		return sendErrorResponse(reply, 400, message);
	}
};

const handleSignIn = async (request, reply) => {
    const { email, password } = request.body;
    request.log.info(`Sign-in attempt with email: ${email}`);

    // Check if the user exists
    const user = await User.findOne({ email }).select('+password');
    request.log.info(`User found: ${user ? 'Yes' : 'No'}`);
    if (!user) {
        sendErrorResponse(reply, 401, "Invalid credentials", {
            metadata: {
                hint: "Please check your email and password",
                links: {
                    forgotPassword: "/forgot-password",
                    signup: "/signup"
                }
            }
        });
        return null;
    }

    // Check if the user is trying to log in with a Google account
    if (user.provider === 'google') {
        request.log.warn(`OAuth user attempted password login: ${email}`);
        return sendErrorResponse(reply, 401, "Invalid login method", {
            metadata: {
                hint: `This account uses ${user.provider} authentication. Please sign in with ${user.provider}.`,
                links: {
                    oauth: `/auth/${user.provider}`
                }
            }
        });
        return null;
    }

    // For non-Google users, verify the password
    if (!user.password) {
        request.log.error(`User ${email} has no password set`);
        return sendErrorResponse(reply, 401, "Invalid login method for this account");
    }

    // Check if the password is correct
    const isPasswordValid = await user.matchPasswd(password);
    request.log.info(`Password validation result for ${email}: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
        sendErrorResponse(reply, 401, "Invalid credentials", {
            metadata: {
                hint: "Please check your email and password",
                links: {
                    forgotPassword: "/forgot-password",
                    signup: "/signup"
                }
            }
        });
        return null;
    }

    // Check if account is deactivated
    if (user.isDeactivated) {
        sendErrorResponse(reply, 403, "Account is deactivated", {
            metadata: {
                hint: "Please contact support to reactivate your account"
            }
        });
        return null;
    }

    // Check if email is confirmed for email-based accounts
    if (user.provider === "email" && !user.isEmailConfirmed) {
        sendErrorResponse(reply, 403, "Email not verified", {
            metadata: {
                hint: "Please verify your email before signing in",
                links: {
                    resendVerification: "/resend-verification"
                }
            }
        });
        return null;
    }

    return user;
};

module.exports = {
	checkDeactivated,
	checkEmailConfirmed,
	attachUser,
	attachUserWithPassword,
	checkPasswordLength,
	checkMailingDisabled,
	recaptchaVerification,
	//checkEmailLoginDisabled,
	handleSignIn,
};
