require("dotenv").config();
const { configCache } = require("./services/configCache");

const keywords = {
	DEVELOPMENT_ENV: "development",
	PRODUCTION_ENV: "production",
};

// Initial config object from environment variables
const configs = {
	MONGO_URI: process.env.MONGO_URI,
	ENVIRONMENT: process.env.ENVIRONMENT || keywords.DEVELOPMENT_ENV,
	CHECK_ADMIN: process.env.CHECK_ADMIN === "0" ? false : true,
	DISABLE_IP_GEOLOCATION: process.env.DISABLE_IP_GEOLOCATION || "0",

	// Fastify will run on 127.0.0.1 if not set
	// Set this to 0.0.0.0 when deploying using docker
	// Check https://www.fastify.io/docs/latest/Getting-Started/#your-first-server
	HOST: process.env.HOST,
	JWT_KEY: process.env.JWT_KEY,
	REFRESH_KEY: process.env.REFRESH_KEY,
	COOKIE_SECRET: process.env.COOKIE_SECRET,
	PORT: Number(process.env.PORT) || 5000,

	AUTH_SERVICE_HOST:
		process.env.AUTH_SERVICE_HOST ||
		`http://localhost:${process.env.PORT || 5000}`,

	ALLOW_CORS_ORIGIN: process.env.ALLOW_CORS_ORIGIN,
	SEND_NEW_LOGIN_EMAIL: process.env.SEND_NEW_LOGIN_EMAIL === "1",
	HTTP_PROTOCOL: process.env.HTTP_PROTOCOL,
	REFRESH_RESPONSE: false,

	SMTP_HOST: process.env.SMTP_HOST,
	SMTP_PORT: process.env.SMTP_PORT,
	SMTP_EMAIL: process.env.SMTP_EMAIL,
	SMTP_PASSWORD: process.env.SMTP_PASSWORD,
	FROM_NAME: process.env.FROM_NAME,
	FROM_EMAIL: process.env.FROM_EMAIL,
	DISABLE_MAIL: process.env.DISABLE_MAIL === "1",

	ACCOUNT_DELETION_DELAY_DAYS: Number(process.env.ACCOUNT_DELETION_DELAY_DAYS) || 10,
	ACCOUNT_DELETION_DELAY_ONE_MINUTE: Number(process.env.ACCOUNT_DELETION_DELAY_ONE_MINUTE) || 0,
	ACCOUNT_DELETION_CRON: process.env.ACCOUNT_DELETION_CRON || "0 0 * * *",

	CODE_ENCRYPTION_KEY:
		process.env.CODE_ENCRYPTION_KEY || "AdV7ya6ehyDaO48VYCyndi2LWkFiupZf",

	// Stripe Configuration
	STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
	STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
	STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
	STRIPE_API_VERSION: process.env.STRIPE_API_VERSION || "2023-10-16",

	// Stripe Connect Configuration
	STRIPE_CONNECT_MODE: process.env.STRIPE_CONNECT_MODE || "test",
	STRIPE_CONNECT_WEBHOOK_SECRET: process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
	STRIPE_ACCOUNT_TYPE: process.env.STRIPE_ACCOUNT_TYPE || "express",

	// Feature Flags
	FEATURE_USE_LEGACY_WALLET: process.env.FEATURE_USE_LEGACY_WALLET === "true",
	FEATURE_LEGACY_WALLET_READONLY: process.env.FEATURE_LEGACY_WALLET_READONLY === "true",
	FEATURE_STRIPE_CONNECT_ENABLED: process.env.FEATURE_STRIPE_CONNECT_ENABLED === "true",

	// Wallet & Escrow
	WALLET_DEFAULT_CURRENCY: process.env.WALLET_DEFAULT_CURRENCY || "USD",
	WALLET_MIN_FUNDING_AMOUNT: Number(process.env.WALLET_MIN_FUNDING_AMOUNT) || 5,
	WALLET_MAX_FUNDING_AMOUNT: Number(process.env.WALLET_MAX_FUNDING_AMOUNT) || 1000,

	PAYOUT_FAILURE_COOLDOWN_SECONDS:
		Number(process.env.PAYOUT_FAILURE_COOLDOWN_SECONDS) || 900,

	PAYOUT_SCHEDULER_CRON:
		process.env.PAYOUT_SCHEDULER_CRON || "0 2 * * *",

	ESCROW_MATURITY_SECONDS:
		Number(process.env.ESCROW_MATURITY_SECONDS) || 60,

	ESCROW_MATURITY_CRON:
		process.env.ESCROW_MATURITY_CRON || "* * * * *",

	RELEASE_FUNDS_CRON:
		process.env.RELEASE_FUNDS_CRON || "*/5 * * * *",

	get ACCOUNT_DELETION_DELAY() {
		if (this.ACCOUNT_DELETION_DELAY_ONE_MINUTE > 0) {
			return this.ACCOUNT_DELETION_DELAY_ONE_MINUTE * 60 * 1000;
		}
		return this.ACCOUNT_DELETION_DELAY_DAYS * 24 * 60 * 60 * 1000;
	},

	// Captcha
	RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY,
	RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
	DISABLE_CAPTCHA:
		process.env.DISABLE_CAPTCHA === "1" || !process.env.RECAPTCHA_SECRET_KEY,
	RECAPTCHA_VERIFY_URL: "https://www.google.com/recaptcha/api/siteverify",

	// App Info
	IS_SMTP_CONFIGURED: false,
	APP_NAME: process.env.APP_NAME || "",
	APP_DOMAIN: process.env.APP_DOMAIN || "",
	SELLER_DASHBOARD_URL: process.env.SELLER_DASHBOARD_URL || "http://localhost:3002",
	APP_CONFIRM_EMAIL_REDIRECT: process.env.APP_CONFIRM_EMAIL_REDIRECT,
	APP_RESET_PASSWORD_REDIRECT: process.env.APP_RESET_PASSWORD_REDIRECT,
	APP_LOGIN_WTH_EMAIL_REDIRECT: process.env.APP_LOGIN_WTH_EMAIL_REDIRECT,
	APP_REACTIVATE_ACCOUNT_URL: process.env.APP_REACTIVATE_ACCOUNT_URL,

	APP_DETAILS_CONFIGURED:
		process.env.APP_NAME &&
		process.env.APP_DOMAIN &&
		process.env.APP_CONFIRM_EMAIL_REDIRECT &&
		process.env.APP_RESET_PASSWORD_REDIRECT &&
		process.env.APP_REACTIVATE_ACCOUNT_URL,

	IPGEOLOCATION_API_KEY: process.env.IPGEOLOCATION_API_KEY,

	// OAuth
	PROVIDER_GOOGLE: "google",
	SUPPORTED_PROVIDERS: ["google", "email-passwordless"],

	GOOGLE_CONFIGS: {
		ACCESS_TOKEN: "https://www.googleapis.com/oauth2/v4/token",
		AUTHORIZE: "https://accounts.google.com/o/oauth2/v2/auth",
		SCOPE: "profile email openid",
		CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
		CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
		CONFIGURED:
			process.env.GOOGLE_CLIENT_ID &&
			process.env.GOOGLE_CLIENT_SECRET &&
			process.env.GOOGLE_REDIRECT_URI,
	},

	// Rate Limiting
	RATE_LIMIT_AUTH_WINDOW_MS: process.env.RATE_LIMIT_AUTH_WINDOW_MS || 900000,
	RATE_LIMIT_AUTH_MAX_REQUESTS: process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || 30,
	RATE_LIMIT_SENSITIVE_WINDOW_MS: process.env.RATE_LIMIT_SENSITIVE_WINDOW_MS || 3600000,
	RATE_LIMIT_SENSITIVE_MAX_REQUESTS: process.env.RATE_LIMIT_SENSITIVE_MAX_REQUESTS || 5,
	RATE_LIMIT_EMAIL_WINDOW_MS: process.env.RATE_LIMIT_EMAIL_WINDOW_MS || 3600000,
	RATE_LIMIT_EMAIL_MAX_REQUESTS: process.env.RATE_LIMIT_EMAIL_MAX_REQUESTS || 3,
	RATE_LIMIT_STANDARD_READ_WINDOW_MS: process.env.RATE_LIMIT_STANDARD_READ_WINDOW_MS || 60000,
	RATE_LIMIT_STANDARD_READ_MAX_REQUESTS: process.env.RATE_LIMIT_STANDARD_READ_MAX_REQUESTS || 120,
	RATE_LIMIT_STANDARD_WRITE_WINDOW_MS: process.env.RATE_LIMIT_STANDARD_WRITE_WINDOW_MS || 60000,
	RATE_LIMIT_STANDARD_WRITE_MAX_REQUESTS: process.env.RATE_LIMIT_STANDARD_WRITE_MAX_REQUESTS || 30,
	RATE_LIMIT_PASSWORD_RESET_WINDOW_MS: process.env.RATE_LIMIT_PASSWORD_RESET_WINDOW_MS || 900000,
	RATE_LIMIT_PASSWORD_RESET_MAX_REQUESTS: process.env.RATE_LIMIT_PASSWORD_RESET_MAX_REQUESTS || 3,

	// Token Expiration
	PASSWORD_RESET_TOKEN_EXPIRATION:
		(parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRATION) || 15) * 60 * 1000,
	EMAIL_CONFIRMATION_TOKEN_EXPIRATION:
		(parseInt(process.env.EMAIL_CONFIRMATION_TOKEN_EXPIRATION) || 60) * 60 * 1000,
	LOGIN_EMAIL_TOKEN_EXPIRATION:
		(parseInt(process.env.LOGIN_EMAIL_TOKEN_EXPIRATION) || 10) * 60 * 1000,

	// ======================================================
	// Background Jobs & Cron (NEW — ADDED ONLY)
	// ======================================================

	CRON_ENABLED: process.env.CRON_ENABLED === "1",
	APP_TIMEZONE: process.env.APP_TIMEZONE || "UTC",

	// Stripe Reconciliation
	STRIPE_RECONCILIATION_ENABLED:
		process.env.STRIPE_RECONCILIATION_ENABLED === "1",

	STRIPE_RECONCILE_CRON: {
		hourly: process.env.STRIPE_RECONCILE_CRON_HOURLY || "15 * * * *",
		daily: process.env.STRIPE_RECONCILE_CRON_DAILY || "30 2 * * *",
		weekly: process.env.STRIPE_RECONCILE_CRON_WEEKLY || "0 3 * * 0",
		webhook: process.env.STRIPE_RECONCILE_CRON_WEBHOOK || "*/30 * * * *",
	},

	STRIPE_RECONCILE_LIMITS: {
		hourly: {
			timeRangeHours:
				Number(process.env.STRIPE_RECONCILE_HOURLY_TIMERANGE_HOURS) || 2,
			batchSize:
				Number(process.env.STRIPE_RECONCILE_HOURLY_BATCH_SIZE) || 50,
		},
		daily: {
			timeRangeHours:
				Number(process.env.STRIPE_RECONCILE_DAILY_TIMERANGE_HOURS) || 25,
			batchSize:
				Number(process.env.STRIPE_RECONCILE_DAILY_BATCH_SIZE) || 100,
		},
		weekly: {
			timeRangeHours:
				Number(process.env.STRIPE_RECONCILE_WEEKLY_TIMERANGE_HOURS) || 168,
			batchSize:
				Number(process.env.STRIPE_RECONCILE_WEEKLY_BATCH_SIZE) || 200,
		},
		webhook: {
			timeRangeHours:
				Number(process.env.STRIPE_RECONCILE_WEBHOOK_TIMERANGE_HOURS) || 1,
			batchSize:
				Number(process.env.STRIPE_RECONCILE_WEBHOOK_BATCH_SIZE) || 100,
		},
	},

	STRIPE_RECONCILE_ALERTS: {
		hourlyMinSuccessRate:
			Number(process.env.STRIPE_RECONCILE_ALERT_HOURLY_MIN_SUCCESS_RATE) || 95,
		dailyMinSuccessRate:
			Number(process.env.STRIPE_RECONCILE_ALERT_DAILY_MIN_SUCCESS_RATE) || 90,
		weeklyMinSuccessRate:
			Number(process.env.STRIPE_RECONCILE_ALERT_WEEKLY_MIN_SUCCESS_RATE) || 95,
		dailyMaxDiscrepancies:
			Number(process.env.STRIPE_RECONCILE_ALERT_DAILY_MAX_DISCREPANCIES) || 10,
	},

	// Payout Reconciliation
	PAYOUT_RECONCILIATION_ENABLED:
		process.env.PAYOUT_RECONCILIATION_ENABLED === "1",

	PAYOUT_RECONCILIATION_CRON:
		process.env.PAYOUT_RECONCILIATION_CRON || "*/10 * * * *",

	PAYOUT_RECONCILIATION_MAX_ITEMS_PER_RUN:
		Number(process.env.PAYOUT_RECONCILIATION_MAX_ITEMS_PER_RUN) || 100,

	// Listing Expiration
	LISTING_EXPIRATION_ENABLED:
		process.env.LISTING_EXPIRATION_ENABLED === "1",

	LISTING_EXPIRATION_CRON:
		process.env.LISTING_EXPIRATION_CRON || "*/10 * * * *",

	LISTING_EXPIRATION_MAX_LISTINGS_PER_RUN:
		Number(process.env.LISTING_EXPIRATION_MAX_LISTINGS_PER_RUN) || 500,
};

// -----------------------------
// Remaining code unchanged
// -----------------------------

const convertValue = (value, type) => {
	switch (type) {
		case "boolean":
			return value === "true" || value === "1" || value === true;
		case "number":
			return Number(value);
		case "array":
			return Array.isArray(value) ? value : JSON.parse(value);
		case "object":
			return typeof value === "object" ? value : JSON.parse(value);
		default:
			return value;
	}
};

const loadConfigsFromDB = async (fastify) => {
	try {
		await configCache.initialize(fastify);
		const cachedConfigs = configCache.getAll();

		Object.entries(cachedConfigs).forEach(([key, config]) => {
			const originalValue = configs[key];
			const valueType = typeof originalValue;
			configs[key] = convertValue(config.value, valueType);
		});

		if (
			configs.SMTP_HOST &&
			configs.SMTP_PORT &&
			configs.SMTP_EMAIL &&
			configs.SMTP_PASSWORD &&
			configs.FROM_EMAIL &&
			configs.FROM_NAME
		) {
			configs.IS_SMTP_CONFIGURED = true;
		}

		if (configs.HTTP_PROTOCOL) {
			configs.HTTP_PROTOCOL = configs.HTTP_PROTOCOL.toLowerCase();
			if (!["http", "https"].includes(configs.HTTP_PROTOCOL)) {
				configs.HTTP_PROTOCOL = false;
			}
		}

		configs.APP_DETAILS_CONFIGURED =
			configs.APP_NAME &&
			configs.APP_DOMAIN &&
			configs.APP_CONFIRM_EMAIL_REDIRECT &&
			configs.APP_RESET_PASSWORD_REDIRECT &&
			configs.APP_REACTIVATE_ACCOUNT_URL;

		fastify.log.info("Configurations loaded from database successfully");
	} catch (error) {
		fastify.log.error({
			msg: "Error loading configs from database",
			error: error.message,
		});
		throw error;
	}
};

const checkConfigs = {
	isSMTPconfigured: configs.IS_SMTP_CONFIGURED,
	isOauthProviderConfigured: {
		google: configs.GOOGLE_CONFIGS.CONFIGURED,
	},
	isAppDetailsConfigured: configs.APP_DETAILS_CONFIGURED,
	environment: configs.ENVIRONMENT,
	isCORSEnabled: !!configs.ALLOW_CORS_ORIGIN,
};

module.exports = {
	configs,
	checkConfigs,
	keywords,
	loadConfigsFromDB,
};
