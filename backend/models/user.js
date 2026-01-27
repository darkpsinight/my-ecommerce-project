const crypto = require("crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { configs } = require("../configs");

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Please submit the name"],
		maxlength: 50,
		trim: true,
	},
	uid: {
		type: String,
		required: true,
		unique: true,
	},
	email: {
		// validation was removed since fastify validates
		// it using schema
		type: String,
		unique: true,
		required: [true, "Please submit an email"],
	},
	// Profile Information Fields
	bio: {
		type: String,
		maxlength: 500,
		trim: true,
	},
	phone: {
		type: String,
		trim: true,
		match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
	},
	dateOfBirth: {
		type: Date,
		validate: {
			validator: function (value) {
				// Must be at least 13 years old
				if (!value) return true; // Allow null/undefined
				const thirteenYearsAgo = new Date();
				thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);
				return value <= thirteenYearsAgo;
			},
			message: 'You must be at least 13 years old'
		}
	},
	profilePicture: {
		type: String,
		trim: true,
	},
	provider: {
		// Provider used during sign up
		// This is not updated if the user uses a different
		// oauth provider for sign in
		type: String,
		enum: ["email", ...configs.SUPPORTED_PROVIDERS],
	},
	password: {
		type: String,
		minlength: 8,
		select: false, // this will not be selected in query
	},
	roles: {
		type: [String],
		enum: ["buyer", "admin", "support", "seller"],
		default: ["buyer"],
		validate: {
			validator: function (roles) {
				// Ensure at least one role is present
				return roles && roles.length > 0;
			},
			message: "User must have at least one role"
		}
	},
	isEmailConfirmed: {
		type: Boolean,
		default: false,
	},
	pwResetToken: String,
	pwResetExpire: Date,
	confirmEmailToken: String,
	confirmEmailTokenExpire: Date,
	loginWithEmailToken: String,
	loginWithEmailTokenExpire: Date,

	// No support as of now

	// isAccountVerified: {
	// 	type: Boolean,
	// 	default: false,
	// },
	// twoFACode: String, // No support as of now
	// twoFAExpire: Date, // No support as of now
	// twoFAEnabled: {
	// 	// No support as of now
	// 	type: Boolean,
	// 	default: false,
	// },

	isDeactivated: {
		type: Boolean,
		default: false,
	},
	// Wallet reference
	walletId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Wallet"
	},
	// Stripe customer ID for payment processing
	stripeCustomerId: {
		type: String
	},
	// Customer acquisition tracking
	acquisitionSource: {
		channel: {
			type: String,
			enum: [
				"organic",
				"google_ads",
				"facebook_ads",
				"instagram_ads",
				"twitter_ads",
				"linkedin_ads",
				"youtube_ads",
				"tiktok_ads",
				"reddit_ads",
				"influencer_marketing",
				"affiliate_marketing",
				"email_marketing",
				"referral_program",
				"direct",
				"other"
			],
			default: "organic"
		},
		utmSource: String,
		utmMedium: String,
		utmCampaign: String,
		utmContent: String,
		utmTerm: String,
		referralCode: String,
		referredBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		acquisitionDate: {
			type: Date,
			default: Date.now
		}
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	deactivatedAt: Date,
});

// Pre-save middleware for validation
userSchema.pre('save', function (next) {
	// Ensure roles array is not empty
	if (!this.roles || this.roles.length === 0) {
		this.roles = ["buyer"]; // Default to buyer role
	}
	next();
});

// Instance method to check if user has a specific role
userSchema.methods.hasRole = function (roleToCheck) {
	return this.roles && this.roles.includes(roleToCheck);
};

// Instance method to add a role
userSchema.methods.addRole = function (newRole) {
	if (!this.roles) {
		this.roles = [];
	}
	if (!this.roles.includes(newRole)) {
		this.roles.push(newRole);
	}
};

// Instance method to remove a role
userSchema.methods.removeRole = function (roleToRemove) {
	if (this.roles && this.roles.length > 1) { // Ensure at least one role remains
		this.roles = this.roles.filter(role => role !== roleToRemove);
	}
};

// Function attached to userSchema to get the JWT token
userSchema.methods.getJWT = function () {
	return jwt.sign(
		{
			// id: this._id,
			uid: this.uid,
			name: this.name,
			email: this.email,
			roles: this.roles,
			isEmailConfirmed: this.isEmailConfirmed,
			// isDeactivated: this.isDeactivated,
		},
		configs.JWT_KEY,
		{
			expiresIn: configs.JWT_ACCESS_EXPIRATION,
		}
	);
};

// Function to match the password entered by the user and stored password
userSchema.methods.matchPasswd = async function (enteredPasswd) {
	console.log(`Entered password: ${enteredPasswd}`);
	console.log(`Stored password: ${this.password}`);
	return await bcrypt.compare(enteredPasswd, this.password);
};

// To get the token to reset the password
userSchema.methods.getPwResetToken = function () {
	const resetToken = crypto.randomBytes(50).toString("hex");

	// Store the hash of the resetPasswdToken
	this.pwResetToken = crypto
		.createHash("sha256")
		.update(resetToken)
		.digest("hex");

	// Set token expiration using config value
	this.pwResetExpire = Date.now() + configs.PASSWORD_RESET_TOKEN_EXPIRATION;

	return resetToken;
};

userSchema.methods.isPwResetTokenExpired = function () {
	if (!this.pwResetExpire) {
		return true;
	}
	return Date.now() >= this.pwResetExpire;
};

userSchema.methods.getEmailConfirmationToken = function () {
	const confirmationToken = crypto.randomBytes(30).toString("hex");

	// Store the hash of the confirmationToken
	this.confirmEmailToken = crypto
		.createHash("sha256")
		.update(confirmationToken)
		.digest("hex");

	// Set token expiration using config value
	this.confirmEmailTokenExpire = Date.now() + configs.EMAIL_CONFIRMATION_TOKEN_EXPIRATION;

	return confirmationToken;
};

userSchema.methods.getLoginEmailToken = function () {
	const loginWithEmailToken = crypto.randomBytes(30).toString("hex");

	// Store the hash of the loginWithEmailToken
	this.loginWithEmailToken = crypto
		.createHash("sha256")
		.update(loginWithEmailToken)
		.digest("hex");

	// Set token expiration using config value
	this.loginWithEmailTokenExpire = Date.now() + configs.LOGIN_EMAIL_TOKEN_EXPIRATION;

	return loginWithEmailToken;
};

userSchema.methods.isLoginEmailTokenExpired = function () {
	if (!this.loginWithEmailTokenExpire) {
		return true;
	}
	return Date.now() >= this.loginWithEmailTokenExpire;
};

userSchema.methods.isConfirmEmailTokenExpired = function () {
	if (!this.confirmEmailTokenExpire) {
		return true;
	}
	return Date.now() >= this.confirmEmailTokenExpire;
};

// Helper Functions

const User = mongoose.model("User", userSchema);

const hashPasswd = async (passwd) => {
	const salt = await bcrypt.genSalt(10);
	const hashedPasswd = await bcrypt.hash(passwd, salt);
	console.log(`Password hashed: ${hashedPasswd}`);
	return hashedPasswd;
};

module.exports = {
	User,
	hashPasswd,
};
