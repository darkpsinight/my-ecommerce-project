const crypto = require("crypto");
const { configs } = require("../configs");
const {
  confirmationEmailHelper,
  passwordChangedEmailAlert,
  sendNewLoginEmail,
  passwordResetEmailHelper,
  loginWithEmailHelper,
  accountDeactivationEmailHelper,
  sendEmail,
} = require("../utils/services/sendEmail");
const {
  RefreshToken,
  getRefreshToken,
  revokeAllRfTokenByUser,
  getRftById,
  getRefreshTokenOptns,
} = require("../models/refreshToken");
const { User, hashPasswd } = require("../models/user");
const { Wallet } = require("../models/wallet");
const {
  sendErrorResponse,
  sendSuccessResponse,
  redirectWithToken,
  redirectWithoutToken,
} = require("../utils/responseHelpers");
const {
  validatePassword,
  getPasswordRequirements,
} = require("../utils/passwordValidation");
const { BlacklistedToken } = require("../models/blacklistedToken");
const jwt = require("jsonwebtoken");

// @route	POST /api/v1/auth/signup
// @desc	handler for registering user to database, returns
// 			jwt and refresh token
// @access	Public
const registerUser = async (request, reply) => {
  request.log.info("handlers/registerUser");

  let { name, email, password } = request.body;
  let roles = ["buyer"];
  let provider = "email";

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return sendErrorResponse(
      reply,
      400,
      "Password does not meet requirements",
      {
        metadata: {
          errors: passwordValidation.errors,
          requirements: getPasswordRequirements(),
        },
      }
    );
  }

  // Use the trimmed password from validation
  password = passwordValidation.trimmedPassword;

  // Check if there is an account with the same email
  const userExists = await User.findOne({
    email: email,
  });

  if (userExists) {
    return sendErrorResponse(reply, 409, "Account creation failed", {
      metadata: {
        hint: "If you already have an account, try signing in or resetting your password",
        links: {
          login: "/signin",
          passwordReset: "/forgot-password",
        },
      },
    });
  }

  password = await hashPasswd(password);

  // Set Role to admin if no users exist
  if (configs.CHECK_ADMIN) {
    const count = await User.countDocuments();
    if (!count) {
      roles = ["admin", "buyer", "seller", "support"]; // first user should have access to all roles and all resources
    }
  }

  const user = await User.create({
    name,
    uid: crypto.randomBytes(15).toString("hex"),
    email,
    password,
    roles,
    provider,
  });

  const confirmationToken = user.getEmailConfirmationToken();
  user.save({ validateBeforeSave: true });

  const refreshToken = await getRefreshToken(user, request.ipAddress);

  const emailStatus = await confirmationEmailHelper(
    user,
    request,
    confirmationToken
  );

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
    {
      refreshToken,
    }
  );
};

// @route 	 POST /api/v1/auth/signin
// @desc	 Validates username and password and send a
//			 response with JWT and Refresh token
// @access 	 Public
// Helper function to handle sign-in process
const handleSignIn = async (request, reply) => {
  const { email, password } = request.body;

  // Find user by email
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    sendErrorResponse(reply, 401, "Invalid credentials", {
      metadata: {
        hint: "Please check your email and password",
        links: {
          forgotPassword: "/forgot-password",
          signup: "/signup",
        },
      },
    });
    return null;
  }

  // If user signed up with OAuth, prevent password login
  if (user.provider !== "email") {
    sendErrorResponse(reply, 401, "Invalid login method", {
      metadata: {
        hint: `This account uses ${user.provider} authentication. Please sign in with ${user.provider}.`,
        links: {
          oauth: `/auth/${user.provider}`,
        },
      },
    });
    return null;
  }

  // Validate password for email-based accounts
  if (!(await user.matchPasswd(password))) {
    sendErrorResponse(reply, 401, "Invalid email or password", {
      metadata: {
        hint: "Please check your email address and password or consider creating an account.",
        links: {
          forgotPassword: "/forgot-password",
          signup: "/signup",
        },
      },
    });
    return null;
  }

  // Check if account is deactivated
  if (user.isDeactivated) {
    sendErrorResponse(reply, 403, "Account is deactivated", {
      metadata: {
        hint: "Please contact support to reactivate your account",
      },
    });
    return null;
  }

  // Check if email is confirmed for email-based accounts
  if (user.provider === "email" && !user.isEmailConfirmed) {
    sendErrorResponse(reply, 403, "Email not verified", {
      metadata: {
        hint: "Please verify your email before signing in",
        links: {
          resendVerification: "/resend-verification",
        },
      },
    });
    return null;
  }

  return user;
};

const signin = async (request, reply) => {
  request.log.info("handlers/signin");
  const user = await handleSignIn(request, reply);

  if (!user) return; // Error response already sent by handleSignIn

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
    {
      refreshToken,
    }
  );
};

// @route   POST /api/v1/auth/seller-signin
// @desc    Login handler for sellers and admins only
// @access  Public
const sellerSignin = async (request, reply) => {
  request.log.info("handlers/sellerSignin");
  const user = await handleSignIn(request, reply);

  if (!user) return; // Error response already sent by handleSignIn

  // Check if user has seller or admin role
  if (!user.hasRole("seller") && !user.hasRole("admin")) {
    return sendErrorResponse(reply, 403, "Access denied", {
      metadata: {
        hint: "Only sellers can access this login",
      },
    });
  }

  const refreshToken = await getRefreshToken(user, request.ipAddress);
  const emailStatus = await sendNewLoginEmail(user, request);
  const verifyToken = await reply.generateCsrf();

  return sendSuccessResponse(
    reply,
    {
      statusCode: 200,
      message: "Seller signed in successfully",
      token: user.getJWT(),
      emailSuccess: emailStatus.success,
      emailMessage: emailStatus.message,
      verifyToken,
    },
    {
      refreshToken,
    }
  );
};

// @route	POST /api/v1/auth/emailLogin
// @desc	Request to sign in or sign up with email
// @access 	Public
const requestLoginWithEmail = async (request, reply) => {
  request.log.info("handlers/requestLoginWithEmail");

  const { name, email } = request.body;
  let roles = ["buyer"];
  let provider = "email-passwordless";

  let user = await User.findOne({
    email: email,
  });

  if (!user && !name) {
    return sendErrorResponse(
      reply,
      400,
      "Account not found. Please create your account."
    );
  } else if (!user) {
    // Set Role to admin if no users exist
    if (configs.CHECK_ADMIN) {
      const count = await User.countDocuments();
      if (!count) {
        roles = ["admin", "buyer"];
      }
    }

    user = await User.create({
      name,
      uid: crypto.randomBytes(15).toString("hex"),
      email,
      roles,
      provider,
    });
  }
  if (!user.isLoginEmailTokenExpired()) {
    return sendErrorResponse(
      reply,
      400,
      "Login email was recently sent to your email. Check Spam/Promotions folder.\
			 Please request again after some time."
    );
  }
  const loginWithEmailToken = user.getLoginEmailToken();
  user.save({ validateBeforeSave: false });

  const emailStatus = await loginWithEmailHelper(
    user,
    request,
    loginWithEmailToken
  );

  if (!emailStatus.success) {
    return sendErrorResponse(reply, 500, emailStatus.message);
  }

  return sendSuccessResponse(reply, {
    statusCode: 200,
    message:
      "Login link was sent to your email address. Please check your inbox to continue.",
    emailSuccess: emailStatus.success,
    emailMessage: emailStatus.message,
  });
};

// @route 	GET /api/v1/auth/emailLogin
// @desc	Endpoint set token and redirect user to login
// @access	Public (confirm email with the token . JWT is NOT required)
const loginWithEmail = async (request, reply) => {
  request.log.info("handlers/loginWithEmail");
  const user = request.userModel;

  // Check if this is the first time email is being confirmed
  const wasEmailUnconfirmed = !user.isEmailConfirmed;

  const newRefreshToken = await getRefreshToken(user, request.ipAddress);
  const verifyToken = await reply.generateCsrf();
  user.loginWithEmailToken = undefined;
  user.loginWithEmailTokenExpire = undefined;
  user.isEmailConfirmed = true;
  await user.save({ validateBeforeSave: false });

  // Automatically create wallet if email was just confirmed for the first time
  if (wasEmailUnconfirmed) {
    try {
      // Check if user already has a wallet to prevent duplicates
      if (!user.walletId) {
        request.log.info(
          `Creating wallet for newly confirmed user via email login: ${user.email}`
        );

        // Create wallet using the existing wallet system
        const wallet = await Wallet.createWalletForUser(
          user._id,
          configs.WALLET_DEFAULT_CURRENCY || "USD"
        );

        // Link wallet to user
        user.walletId = wallet._id;
        await user.save({ validateBeforeSave: false });

        request.log.info(
          `Wallet created successfully for user via email login: ${user.email}, walletId: ${wallet._id}`
        );
      } else {
        request.log.info(
          `User ${user.email} already has a wallet: ${user.walletId}`
        );
      }
    } catch (walletError) {
      // Log error but don't prevent email confirmation
      request.log.error({
        msg: "Failed to create wallet during email login confirmation",
        error: walletError.message,
        stack: walletError.stack,
        userId: user._id,
        email: user.email,
      });
      // Continue with email confirmation even if wallet creation fails
    }
  }

  reply.setCookie("refreshToken", newRefreshToken, getRefreshTokenOptns());
  return redirectWithoutToken(reply, verifyToken, {
    redirectURL: configs.APP_LOGIN_WTH_EMAIL_REDIRECT,
  });
};

// @route 	GET /api/v1/auth/confirmEmail
// @desc	Endpoint to confirm the email of the user and redirect to frontend
// @access	Public (confirm email with the token . JWT is NOT required)
const confirmEmail = async (request, reply) => {
  request.log.info("handlers/confirmEmail");
  const user = request.userModel;

  // Check if this is the first time email is being confirmed
  const wasEmailUnconfirmed = !user.isEmailConfirmed;

  user.confirmEmailToken = undefined;
  user.confirmEmailTokenExpire = undefined;
  user.isEmailConfirmed = true;
  await user.save({ validateBeforeSave: false });

  // Automatically create wallet if email was just confirmed for the first time
  if (wasEmailUnconfirmed) {
    try {
      // Check if user already has a wallet to prevent duplicates
      if (!user.walletId) {
        request.log.info(
          `Creating wallet for newly confirmed user: ${user.email}`
        );

        // Create wallet using the existing wallet system
        const wallet = await Wallet.createWalletForUser(
          user._id,
          configs.WALLET_DEFAULT_CURRENCY || "USD"
        );

        // Link wallet to user
        user.walletId = wallet._id;
        await user.save({ validateBeforeSave: false });

        request.log.info(
          `Wallet created successfully for user: ${user.email}, walletId: ${wallet._id}`
        );
      } else {
        request.log.info(
          `User ${user.email} already has a wallet: ${user.walletId}`
        );
      }
    } catch (walletError) {
      // Log error but don't prevent email confirmation
      request.log.error({
        msg: "Failed to create wallet during email confirmation",
        error: walletError.message,
        stack: walletError.stack,
        userId: user._id,
        email: user.email,
      });
      // Continue with email confirmation even if wallet creation fails
    }
  }

  return redirectWithoutToken(reply, request.query.token, {
    redirectURL: configs.APP_CONFIRM_EMAIL_REDIRECT,
  });
};

// @route	POST /api/v1/auth/confirmEmail
// @desc	Request to send confirmation email again
// @access 	Public
const requestConfirmationEmail = async (request, reply) => {
  request.log.info("handlers/requestConfirmationEmail");

  const user = request.userModel;
  if (user.isEmailConfirmed) {
    return sendErrorResponse(reply, 400, "Email already confirmed");
  }
  if (!user.isConfirmEmailTokenExpired()) {
    return sendErrorResponse(
      reply,
      400,
      "Confirmation email was recently sent to your email. Check Spam/Promotions folder.\
			 Please request again after some time."
    );
  }
  const confirmationToken = user.getEmailConfirmationToken();
  user.save({ validateBeforeSave: false });

  const emailStatus = await confirmationEmailHelper(
    user,
    request,
    confirmationToken
  );

  if (!emailStatus.success) {
    return sendErrorResponse(reply, 500, emailStatus.message);
  }

  return sendSuccessResponse(reply, {
    statusCode: 200,
    message: emailStatus.message,
    emailSuccess: emailStatus.success,
    emailMessage: emailStatus.message,
  });
};

// @route 	 POST /api/v1/auth/reset-password
// @desc	 Request to send reset password email
// @access	 Public
const requestResetPasswordToken = async (request, reply) => {
  request.log.info("handlers/requestResetPasswordToken");

  const user = request.userModel;

  // Standard success response for both existing and non-existing emails
  const standardResponse = {
    statusCode: 200,
    message: "Email Sent",
    success: true,
    metadata: {
      hint: "If this email is registered, you'll receive instructions to reset your password shortly. Check Spam/Promotions folder.",
      links: {
        forgotPassword: "/forgot-password",
        signin: "/signin",
      },
    },
  };

  // If user doesn't exist, wait 2000ms before responding to prevent timing attacks
  if (!user) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return sendSuccessResponse(reply, standardResponse);
  }

  // Generate new reset token and send email regardless of existing token
  const pwResetToken = user.getPwResetToken();
  await user.save({ validateBeforeSave: false });

  const emailResult = await passwordResetEmailHelper(
    user,
    request,
    pwResetToken
  );

  if (!emailResult.success) {
    request.log.error(
      `Failed to send password reset email: ${emailResult.message}`
    );
    return sendErrorResponse(reply, 500, "Failed to send password reset email");
  }

  return sendSuccessResponse(reply, standardResponse);
};

// @route 	GET /api/v1/auth/reset-password
// @desc  	This is executed when user clicks the link sent via email
//		  	verifies the token and redirects to frontend
// @access 	Public
const resetPasswordTokenRedirect = async (request, reply) => {
  request.log.info("handlers/resetPasswordTokenRedirect");

  return redirectWithToken(reply, request.query.token, {
    redirectURL: configs.APP_RESET_PASSWORD_REDIRECT,
  });
};

// @route 	PUT /api/v1/auth/reset-password
// @desc 	Reset password from token (requested from frontend)
// @access	Public
const resetPasswordFromToken = async (request, reply) => {
  request.log.info("handlers/resetPasswordFromToken");

  // Get user with password field
  const user = await User.findById(request.userModel._id).select("+password");
  if (!user) {
    return sendErrorResponse(reply, 404, "User not found");
  }

  let { password, confirmPassword } = request.body;

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return sendErrorResponse(
      reply,
      400,
      "Password does not meet requirements",
      {
        metadata: {
          errors: passwordValidation.errors,
          requirements: getPasswordRequirements(),
        },
      }
    );
  }

  // Use the trimmed password from validation
  password = passwordValidation.trimmedPassword;

  if (password !== confirmPassword) {
    return sendErrorResponse(
      reply,
      400,
      "Password and confirmed password are different"
    );
  }

  // Check if new password is same as old password
  const isSamePassword = await user.matchPasswd(password);
  if (isSamePassword) {
    return sendErrorResponse(
      reply,
      400,
      "New password cannot be the same as your old password",
      {
        metadata: {
          hint: "Choose a new password you haven't used before",
        },
      }
    );
  }

  await revokeAllRfTokenByUser(user, request.ipAddress);

  password = await hashPasswd(password);
  user.password = password;
  user.pwResetToken = undefined;
  user.pwResetExpire = undefined;
  user.save({ validateBeforeSave: true });

  const emailStatus = await passwordChangedEmailAlert(user, request);

  return sendSuccessResponse(reply, {
    statusCode: 200,
    message: "Password Updated",
    emailSuccess: emailStatus.success,
    emailMessage: emailStatus.message,
    metadata: {
      hint: "Your password has been successfully updated. You can now sign in with your new password.",
      links: {
        login: "/signin",
      },
    },
  });
};

// @route  	PUT /api/v1/auth/updatePassword
// @desc 	Reset the password with current password when the user
//			user is logged in
// @access	Private (JWT TOKEN is required)
const updatePassword = async (request, reply) => {
  request.log.info("handlers/updatePassword");

  const user = request.userModel;
  let { currentPassword, password, confirmPassword } = request.body;

  const checkPassword = await user.matchPasswd(currentPassword);
  if (!checkPassword) {
    return sendErrorResponse(reply, 400, "Your entered the wrong password");
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return sendErrorResponse(
      reply,
      400,
      "Password does not meet requirements",
      {
        metadata: {
          errors: passwordValidation.errors,
          requirements: getPasswordRequirements(),
        },
      }
    );
  }

  // Use the trimmed password from validation
  password = passwordValidation.trimmedPassword;

  if (password !== confirmPassword) {
    return sendErrorResponse(
      reply,
      400,
      "Password and confirmed password are different"
    );
  }

  await revokeAllRfTokenByUser(user, request.ipAddress);

  user.password = await hashPasswd(password);
  user.save();

  const emailStatus = await passwordChangedEmailAlert(user, request);

  return sendSuccessResponse(reply, {
    statusCode: 200,
    message: "Password Updated",
    emailSuccess: emailStatus.success,
    emailMessage: emailStatus.message,
  });
};

// @route 	GET /api/v1/auth/account
// @desc 	Route used to get user Info
// @access	Private(requires JWT token in header)
const getAccount = async (request, reply) => {
  request.log.info("handlers/getAccount");

  const user = request.user;
  const userModel = request.userModel;
  
  return sendSuccessResponse(reply, {
    statusCode: 200,
    message: "User Found",
    name: userModel.name,
    email: userModel.email,
    roles: user.roles,
    isEmailConfirmed: user.isEmailConfirmed,
    isDeactivated: user.isDeactivated,
    // Profile fields
    bio: userModel.bio,
    phone: userModel.phone,
    dateOfBirth: userModel.dateOfBirth,
    profilePicture: userModel.profilePicture,
  });
};

// @route 	DELETE /api/v1/auth/account
// @desc 	Route used to DELETE user account
// @access	Private(requires JWT token in header)
const deleteAccount = async (request, reply) => {
  request.log.info({
    msg: "handlers/deleteAccount",
    uid: request.userModel.uid,
    email: request.userModel.email,
  });

  try {
    const user = request.userModel;
    const { password } = request.body;

    // Verify password
    const checkPassword = await user.matchPasswd(password);
    if (!checkPassword) {
      request.log.warn({
        msg: "Failed account deletion attempt - Invalid password",
        uid: user.uid,
        email: user.email,
      });
      return sendErrorResponse(
        reply,
        400,
        "We could not delete your account. You entered the wrong password"
      );
    }

    // Log out of all devices first
    request.log.info({
      msg: "Revoking all refresh tokens before account deactivation",
      uid: user.uid,
    });
    await revokeAllRfTokenByUser(user, request.ipAddress);

    // Calculate deletion date based on configured delay
    const deactivationTime = Date.now();
    const deletionDate = new Date(
      deactivationTime + configs.ACCOUNT_DELETION_DELAY
    );

    // Deactivate account
    user.isDeactivated = true;
    user.deactivatedAt = deactivationTime;

    await user.save();

    // Log the deactivation details
    request.log.info({
      msg: "Account deactivated successfully",
      uid: user.uid,
      email: user.email,
      deactivatedAt: new Date(deactivationTime).toISOString(),
      scheduledDeletionDate: deletionDate.toISOString(),
      deletionDelay:
        configs.ACCOUNT_DELETION_DELAY_ONE_MINUTE > 0
          ? `${configs.ACCOUNT_DELETION_DELAY_ONE_MINUTE} minutes`
          : `${configs.ACCOUNT_DELETION_DELAY_DAYS} days`,
    });

    // Send email notification about account deactivation
    const emailStatus = await accountDeactivationEmailHelper(
      user,
      deletionDate
    );

    if (!emailStatus.success) {
      request.log.warn({
        msg: "Failed to send deactivation email",
        uid: user.uid,
        email: user.email,
        emailError: emailStatus.message,
      });
    }

    const deletionTimeframe =
      configs.ACCOUNT_DELETION_DELAY_ONE_MINUTE > 0
        ? `${configs.ACCOUNT_DELETION_DELAY_ONE_MINUTE} minutes`
        : `${configs.ACCOUNT_DELETION_DELAY_DAYS} days`;

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: `Account deactivated. Your account will be deleted from the database after ${deletionTimeframe}`,
      details: {
        deactivatedAt: user.deactivatedAt,
        scheduledDeletionDate: deletionDate,
        deletionDelay: deletionTimeframe,
        canReactivate: true,
        emailSuccess: emailStatus.success,
        emailMessage: emailStatus.message,
      },
    });
  } catch (error) {
    request.log.error({
      msg: "Error during account deactivation",
      error: error.message,
      stack: error.stack,
      uid: request.userModel?.uid,
      email: request.userModel?.email,
    });
    return sendErrorResponse(
      reply,
      500,
      "An error occurred while deactivating your account"
    );
  }
};

// @route   POST /api/v1/auth/reactivate
// @desc    Reactivate a deactivated account within the grace period
// @access  Public
const reactivateAccount = async (request, reply) => {
  request.log.info("handlers/reactivateAccount");

  try {
    const { email, password } = request.body;

    // Find the deactivated user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      request.log.warn({
        msg: "Reactivation attempt for non-existent account",
        email,
      });
      return sendErrorResponse(reply, 400, "Invalid credentials");
    }

    // Check if account is actually deactivated
    if (!user.isDeactivated) {
      request.log.warn({
        msg: "Reactivation attempt for active account",
        email,
        uid: user.uid,
      });
      return sendErrorResponse(reply, 400, "Account is not deactivated");
    }

    // Verify password
    const isValidPassword = await user.matchPasswd(password);
    if (!isValidPassword) {
      request.log.warn({
        msg: "Failed reactivation attempt - Invalid password",
        email,
        uid: user.uid,
      });
      return sendErrorResponse(reply, 400, "Invalid credentials");
    }

    // Check if within grace period
    const gracePeriod = configs.ACCOUNT_DELETION_DELAY;
    const now = Date.now();
    const deactivationTime = user.deactivatedAt.getTime();

    if (now - deactivationTime >= gracePeriod) {
      request.log.warn({
        msg: "Reactivation attempt after grace period",
        email,
        uid: user.uid,
        deactivatedAt: user.deactivatedAt,
        gracePeriodDays: configs.ACCOUNT_DELETION_DELAY_DAYS,
      });
      return sendErrorResponse(
        reply,
        400,
        `Account cannot be reactivated. The ${configs.ACCOUNT_DELETION_DELAY_DAYS}-day grace period has expired.`
      );
    }

    // Reactivate the account
    user.isDeactivated = false;
    user.deactivatedAt = undefined;
    await user.save();

    request.log.info({
      msg: "Account successfully reactivated",
      email,
      uid: user.uid,
    });

    // Generate new tokens
    const refreshToken = await getRefreshToken(user, request.ipAddress);
    const verifyToken = await reply.generateCsrf();

    return sendSuccessResponse(
      reply,
      {
        statusCode: 200,
        message: "Account successfully reactivated",
        token: user.getJWT(),
        verifyToken,
      },
      {
        refreshToken,
      }
    );
  } catch (error) {
    request.log.error({
      msg: "Error during account reactivation",
      error: error.message,
      stack: error.stack,
    });
    return sendErrorResponse(
      reply,
      500,
      "An error occurred while reactivating your account"
    );
  }
};

// @route 	POST /api/v1/auth/refresh
// @desc 	Get new jwt token and refresh token from unused refresh token
//		 	(refresh token should be used only once)
// @access 	Private (JWT is not required but refresh token is required)
const getJWTFromRefresh = async (request, reply) => {
  request.log.info("handlers/getJWTFromRefresh");

  // Fastify-cookie has a function which can be used to sign & unsign tokens
  // unsignCookie returns valid, renew & false
  // valid (boolean) : the cookie has been unsigned successfully
  // renew (boolean) : the cookie has been unsigned with an old secret
  // value (string/null) : if the cookie is valid then returns string else null

  const rft = await getRftById(request.rtid);
  if (!rft) {
    return sendErrorResponse(reply, 400, "Invalid Refresh Token");
  }
  if (rft.isExpired()) {
    return sendErrorResponse(reply, 400, "Refresh Token Expired");
  }
  const user = await User.findById(rft.user);

  if (!user) {
    return sendErrorResponse(reply, 400, "Invalid Refresh Token");
  }

  const jwtToken = user.getJWT();
  rft.revoke(request.ipAddress);
  rft.save();
  const newRefreshToken = await getRefreshToken(user, request.ipAddress);
  const verifyToken = await reply.generateCsrf();
  return sendSuccessResponse(
    reply,
    {
      statusCode: 200,
      message: "Refresh token : successful",
      token: jwtToken,
      verifyToken,
    },
    {
      refreshToken: newRefreshToken,
    }
  );
};

// @route 	PUT /api/v1/auth/refresh/revoke
// @desc	revokes the refresh token. Used when logging out
// @access  Private(required JWT in authorization header)
const revokeRefreshToken = async (request, reply) => {
  request.log.info("handlers/revokeRefreshToken");

  const rft = await getRftById(request.rtid);

  const sendInvalidToken = () => {
    return sendErrorResponse(reply, 400, "Invalid Refresh Token", {
      clearCookie: true,
    });
  };

  if (!rft) {
    sendInvalidToken();
  }

  const user = await User.findById(rft.user);

  if (!user) {
    sendInvalidToken();
  }

  if (user.uid !== request.user.uid) {
    // Check whether the refresh token was created by the same user
    sendInvalidToken();
  }

  if (rft.isExpired()) {
    return sendErrorResponse(reply, 400, "Refresh Token Expired", {
      clearCookie: true,
    });
  }
  rft.revoke(request.ipAddress);
  rft.save();
  return sendSuccessResponse(
    reply,
    {
      statusCode: 200,
      message: "Refresh token successfully revoked",
    },
    { clearCookie: true }
  );
};

// @route 	PUT /api/v1/auth/revokeAll
// @desc 	Route used to log out of all devices , i.e
// 			revoke all refreshTokens
// @access	Private(requires JWT token in header)
const revokeAllRefreshTokens = async (request, reply) => {
  request.log.info("handlers/revokeAllRefreshTokens");

  const user = request.userModel;
  await revokeAllRfTokenByUser(user);
  return sendSuccessResponse(reply, {
    statusCode: 200,
    message: "Successfully revoked all tokens",
  });
};

const logout = async (request, reply) => {
  try {
    const user = request.user;
    const refreshToken = request.cookies.refreshToken;
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return sendErrorResponse(reply, 400, "Authorization header missing");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return sendErrorResponse(
        reply,
        400,
        "Token missing from Authorization header"
      );
    }

    // Get user email either from token or from database
    let userEmail;
    try {
      const decoded = jwt.decode(token);
      if (!decoded) {
        return sendErrorResponse(reply, 400, "Invalid token format");
      }

      // If email is not in token, fetch from database
      if (!decoded.email && decoded.id) {
        const userFromDb = await User.findById(decoded.id);
        if (!userFromDb) {
          return sendErrorResponse(reply, 404, "User not found", {
            metadata: {
              errors: passwordValidation.errors,
              requirements: getPasswordRequirements(),
            },
          });
        }
        userEmail = userFromDb.email;
      } else {
        userEmail = decoded.email;
      }

      if (!userEmail) {
        return sendErrorResponse(reply, 400, "Could not determine user email");
      }

      // Log the logout attempt
      request.log.info(
        `Logout attempt for user: ${userEmail} with token: ${token.substring(
          0,
          10
        )}...`
      );

      // Check if token is already blacklisted
      const existingBlacklist = await BlacklistedToken.findOne({ token });
      if (existingBlacklist) {
        return sendErrorResponse(reply, 400, "Token already invalidated");
      }

      // Add token to blacklist
      const blacklistedToken = await BlacklistedToken.create({
        token,
        userEmail,
        expiresAt: new Date(decoded.exp * 1000),
      });

      if (!blacklistedToken) {
        throw new Error("Failed to blacklist token");
      }

      request.log.info(`Token blacklisted successfully for user: ${userEmail}`);

      // Revoke refresh token if it exists
      if (refreshToken) {
        const rft = await getRftById(request.rtid);
        if (rft) {
          // Use the existing revoke mechanism
          rft.revoke(request.ipAddress);
          await rft.save();
          request.log.info(
            `Refresh token revoked successfully for user: ${userEmail}`
          );
        }
      }

      // Clear all cookies
      reply.clearCookie("refreshToken", {
        path: "/",
        httpOnly: true,
        secure: configs.NODE_ENV === "production",
        sameSite: "lax",
      });
      reply.clearCookie("sessionToken", {
        path: "/",
        httpOnly: true,
        secure: configs.NODE_ENV === "production",
        sameSite: "lax",
      });

      // Verify token was actually blacklisted
      const verifyBlacklist = await BlacklistedToken.findOne({ token });
      if (!verifyBlacklist) {
        request.log.error("Token blacklisting verification failed");
        return sendErrorResponse(
          reply,
          500,
          "Error verifying token invalidation"
        );
      }

      // Log successful logout
      request.log.info(`User ${userEmail} successfully logged out`);

      return sendSuccessResponse(reply, {
        statusCode: 200,
        message: "Successfully logged out",
        details: {
          accessTokenBlacklisted: true,
          refreshTokenRevoked: !!refreshToken,
        },
      });
    } catch (error) {
      request.log.error(`Token decode/blacklist error: ${error.message}`);
      return sendErrorResponse(reply, 500, "Error processing token");
    }
  } catch (error) {
    request.log.error(`Logout error: ${error.message}`);
    return sendErrorResponse(reply, 500, "Error during logout process");
  }
};

// @route   PUT /api/v1/auth/role/:uid
// @desc    Update user roles (admin/support only)
// @access  Private (requires JWT token with admin/support role)
const updateUserRole = async (request, reply) => {
  request.log.info("handlers/updateUserRole");

  const { roles } = request.body;
  const { uid } = request.params;

  // Ensure roles is an array
  let newRoles = roles;
  if (!Array.isArray(newRoles)) {
    newRoles = [newRoles];
  }

  // Validate roles
  const validRoles = ["buyer", "admin", "support", "seller"];
  const invalidRoles = newRoles.filter((r) => !validRoles.includes(r));
  if (invalidRoles.length > 0) {
    return sendErrorResponse(
      reply,
      400,
      `Invalid roles specified: ${invalidRoles.join(", ")}`
    );
  }

  // Ensure at least one role is provided
  if (newRoles.length === 0) {
    return sendErrorResponse(reply, 400, "At least one role must be specified");
  }

  // Find user by uid
  const targetUser = await User.findOne({ uid });
  if (!targetUser) {
    return sendErrorResponse(reply, 404, "User not found");
  }

  // Don't allow changing own role (to prevent accidental removal of admin access)
  if (targetUser.uid === request.user.uid) {
    return sendErrorResponse(reply, 403, "Cannot modify your own role");
  }

  // Update roles
  targetUser.roles = newRoles;
  await targetUser.save();

  return sendSuccessResponse(reply, {
    statusCode: 200,
    message: "User roles updated successfully",
    updatedRoles: targetUser.roles,
    user: {
      uid: targetUser.uid,
      email: targetUser.email,
      name: targetUser.name,
    },
  });
};

// @route 	POST /api/v1/generate-seller-token
// @desc	Generates a short-lived token for seller authentication handoff
// @access	Private (requires valid JWT with seller role)
const generateSellerToken = async (request, reply) => {
  request.log.info("handlers/generateSellerToken");

  try {
    const user = request.user;

    // Get seller domain from configs
    const sellerDomain = configs.APP_DOMAIN_SELLER;
    if (!sellerDomain) {
      return sendErrorResponse(reply, 500, "Seller domain not configured");
    }

    // Generate short-lived token (1 minute)
    const token = jwt.sign(
      {
        userId: user.uid,
        redirectTo: sellerDomain,
        purpose: "seller_auth_handoff",
      },
      configs.JWT_KEY,
      {
        expiresIn: "1m",
      }
    );

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Seller token generated successfully",
      token,
    });
  } catch (error) {
    request.log.error(`Error generating seller token: ${error.message}`);
    return sendErrorResponse(reply, 500, "Failed to generate seller token");
  }
};

// @route   POST /api/v1/auth/validate-seller-token
// @desc    Validates seller token and returns a new access token
// @access  Public
const validateSellerToken = async (request, reply) => {
  request.log.info("handlers/validateSellerToken");

  try {
    const { token } = request.body;

    // Get seller domain from configs
    const sellerDomain = configs.APP_DOMAIN_SELLER;
    if (!sellerDomain) {
      return sendErrorResponse(reply, 500, "Seller domain not configured");
    }

    if (!token) {
      return sendErrorResponse(reply, 400, "Token is required");
    }

    // Verify the handoff token
    const decoded = jwt.verify(token, configs.JWT_KEY);

    // Validate token claims
    if (
      decoded.redirectTo !== sellerDomain ||
      decoded.purpose !== "seller_auth_handoff"
    ) {
      return sendErrorResponse(reply, 401, "Invalid token claims");
    }

    // Find the user to include in the new token
    const user = await User.findOne({ uid: decoded.userId });
    if (!user) {
      return sendErrorResponse(reply, 404, "User not found");
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      configs.JWT_KEY,
      {
        expiresIn: "1h",
      }
    );

    // Add the handoff token to blacklist
    await BlacklistedToken.create({
      token,
      userEmail: user.email,
      expiresAt: new Date(decoded.exp * 1000),
    });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Seller token validated successfully",
      token: accessToken,
    });
  } catch (error) {
    request.log.error(`Error validating seller token: ${error.message}`);
    return sendErrorResponse(reply, 401, "Invalid token");
  }
};

// @route 	PUT /api/v1/auth/profile
// @desc 	Update user profile information
// @access	Private(requires JWT token in header)
const updateProfile = async (request, reply) => {
  request.log.info("handlers/updateProfile");

  try {
    const user = request.userModel;
    const { name, bio, phone, dateOfBirth } = request.body;

    // Validate and sanitize inputs
    const updates = {};

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return sendErrorResponse(reply, 400, "Name is required");
      }
      if (name.trim().length > 50) {
        return sendErrorResponse(reply, 400, "Name must be 50 characters or less");
      }
      updates.name = name.trim();
    }

    if (bio !== undefined) {
      if (bio && bio.trim().length > 500) {
        return sendErrorResponse(reply, 400, "Bio must be 500 characters or less");
      }
      updates.bio = bio ? bio.trim() : null;
    }

    if (phone !== undefined) {
      if (phone) {
        const trimmedPhone = phone.trim();
        if (!/^\+?[\d\s\-\(\)]+$/.test(trimmedPhone)) {
          return sendErrorResponse(reply, 400, "Please enter a valid phone number");
        }
        updates.phone = trimmedPhone;
      } else {
        updates.phone = null;
      }
    }

    if (dateOfBirth !== undefined) {
      if (dateOfBirth) {
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) {
          return sendErrorResponse(reply, 400, "Please enter a valid date of birth");
        }
        
        // Must be at least 13 years old
        const thirteenYearsAgo = new Date();
        thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);
        
        if (dob > thirteenYearsAgo) {
          return sendErrorResponse(reply, 400, "You must be at least 13 years old");
        }
        
        updates.dateOfBirth = dob;
      } else {
        updates.dateOfBirth = null;
      }
    }

    // Update the user with validated data
    Object.assign(user, updates);
    await user.save({ validateBeforeSave: true });

    request.log.info({
      msg: "Profile updated successfully",
      uid: user.uid,
      email: user.email,
      updatedFields: Object.keys(updates)
    });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Profile updated successfully",
      profile: {
        name: user.name,
        bio: user.bio,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        email: user.email
      }
    });

  } catch (error) {
    request.log.error({
      msg: "Error updating profile",
      error: error.message,
      stack: error.stack,
      uid: request.userModel?.uid,
      email: request.userModel?.email,
    });

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return sendErrorResponse(reply, 400, `Validation error: ${validationErrors.join(', ')}`);
    }

    if (error.code === 11000) {
      // Duplicate key error - though name shouldn't have unique constraint
      return sendErrorResponse(reply, 400, "A duplicate value was detected");
    }

    return sendErrorResponse(reply, 500, "An error occurred while updating your profile");
  }
};

module.exports = {
  registerUser,
  confirmEmail,
  requestConfirmationEmail,
  requestResetPasswordToken,
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
  generateSellerToken,
  validateSellerToken,
  updateProfile,
};
