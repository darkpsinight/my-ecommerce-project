const nodemailer = require("nodemailer");
const { configs } = require("../../configs");
const mustache = require("mustache");
const UAParser = require("ua-parser-js");
const { newLoginEmailTemplate } = require("../emailTemplates/newLoginEmail");
const {
	passwordChangedTemplate,
} = require("../emailTemplates/passwordChanged");
const { confirmEmailTemplate } = require("../emailTemplates/confirmEmail");
const { resetPasswordTemplate } = require("../emailTemplates/resetPassword");
const { loginWithEmailTemplate }= require("../emailTemplates/loginwithemail");
const { getLocationFromIP } = require("./ipGeolocation");

const sendEmail = async (options) => {
	if (configs.DISABLE_MAIL) {
		return emailStatus(false, "Mailing is disabled");
	}
	if (configs.IS_SMTP_CONFIGURED) {
		const transporter = nodemailer.createTransport({
			host: configs.SMTP_HOST,
			port: configs.SMTP_PORT,
			auth: {
				user: configs.SMTP_EMAIL,
				pass: configs.SMTP_PASSWORD,
			},
		});

		const message = {
			from: `${configs.FROM_NAME} <${configs.FROM_EMAIL}>`,
			to: options.email,
			subject: options.subject,
			html: options.html,
		};

		await transporter.sendMail(message);

		return emailStatus(true, "Email Sent");
	} else {
		return emailStatus(false, "Failed to send email. Please configure SMTP");
	}
};

// helper function to send
const emailStatus = (success, message) => {
	return {
		success,
		message,
	};
};

const renderTemplate = (view, template) => {
	return mustache.render(template, view);
};

// Helper function to parse user agent
const parseUserAgent = (userAgent) => {
	if (!userAgent) {
		return {
			browser: "Unknown Browser",
			device: "Unknown Device"
		};
	}

	const parser = new UAParser(userAgent);
	const browserInfo = parser.getBrowser();
	const osInfo = parser.getOS();
	const deviceInfo = parser.getDevice();

	const browser = browserInfo.name ? `${browserInfo.name}${browserInfo.version ? ` ${browserInfo.version}` : ''}` : "Unknown Browser";
	const os = osInfo.name || "Unknown OS";
	const deviceType = deviceInfo.type || "desktop";

	// Format device info
	let deviceString;
	if (deviceType === "desktop") {
		deviceString = `Desktop (${os})`;
	} else if (deviceType === "mobile") {
		deviceString = `Mobile (${os})`;
	} else if (deviceType === "tablet") {
		deviceString = `Tablet (${os})`;
	} else {
		deviceString = `${os} Device`;
	}
	
	return {
		browser,
		device: deviceString
	};
};

// Helper function to format IP address
const formatIPAddress = (ip) => {
	return ip === "::1" ? "127.0.0.1 (localhost)" : ip;
};

// Send Email confirmation mail to the user
const confirmationEmailHelper = async (user, request, confirmationToken) => {
	const confirmationUrl = `${configs.HTTP_PROTOCOL || request.protocol}://${
		request.hostname
	}/api/v1/auth/confirmEmail?token=${confirmationToken}`;

	const currentYear = new Date().getFullYear();

	return await sendEmail({
		email: user.email,
		subject: `Confirm your email address ${
			configs.APP_NAME ? `to get started on ${configs.APP_NAME}` : ""
		}`,
		html: renderTemplate(
			{
				username: user.name,
				buttonHREF: confirmationUrl,
				appName: configs.APP_NAME,
				appDomain: configs.APP_DOMAIN,
				currentYear
			},
			confirmEmailTemplate
		),
	});
};

// Send Login mail to the user
const loginWithEmailHelper = async (user, request, loginToken) => {
	const loginUrl = `${configs.HTTP_PROTOCOL || request.protocol}://${
		request.hostname
	}/api/v1/auth/emailLogin?token=${loginToken}`;

	const location = await getLocationFromIP(request.ipAddress);
	const { browser, device } = parseUserAgent(request.headers["user-agent"]);
	const currentYear = new Date().getFullYear();

	return await sendEmail({
		email: user.email,
		subject: `Login your email address ${
			configs.APP_NAME ? `to get started on ${configs.APP_NAME}` : ""
		}`,
		html: renderTemplate(
			{
				username: user.name,
				buttonHREF: loginUrl,
				appName: configs.APP_NAME,
				appDomain: configs.APP_DOMAIN,
				time: new Date().toLocaleString(),
				location: location || "Unknown Location",
				device: device,
				browser: browser,
				ipAddress: formatIPAddress(request.ipAddress),
				supportEmail: configs.SUPPORT_EMAIL || configs.FROM_EMAIL,
				currentYear
			},
			loginWithEmailTemplate.html
		),
	});
};

// Send Password Reset email to the user
const passwordResetEmailHelper = async (user, request, pwResetToken) => {
	const resetUrl = `${configs.HTTP_PROTOCOL || request.protocol}://${
		request.hostname
	}/api/v1/auth/resetPassword?token=${pwResetToken}`;

	const location = await getLocationFromIP(request.ipAddress);
	const { browser, device } = parseUserAgent(request.headers["user-agent"]);
	const currentYear = new Date().getFullYear();

	return await sendEmail({
		email: user.email,
		subject: `Password Reset Request ${
			configs.APP_NAME ? `for ${configs.APP_NAME}` : ""
		} `,
		html: renderTemplate(
			{
				username: user.name,
				resetLink: resetUrl,
				appName: configs.APP_NAME,
				appDomain: configs.APP_DOMAIN,
				time: new Date().toLocaleString(),
				location: location || "Unknown Location",
				device: device,
				ipAddress: formatIPAddress(request.ipAddress),
				browser: browser,
				supportEmail: configs.SUPPORT_EMAIL || configs.FROM_EMAIL,
				appAddress: configs.APP_ADDRESS || configs.APP_DOMAIN,
				currentYear
			},
			resetPasswordTemplate
		),
	});
};

// Send password changed email to the user
const passwordChangedEmailAlert = async (user, request) => {
	const reportUrl = `${configs.APP_DOMAIN}/security/report`;
	const location = await getLocationFromIP(request.ipAddress);
	const { browser, device } = parseUserAgent(request.headers["user-agent"]);
	const currentYear = new Date().getFullYear();
	
	return await sendEmail({
		email: user.email,
		subject: "Security Alert",
		html: renderTemplate(
			{
				username: user.name,
				appName: configs.APP_NAME,
				appDomain: configs.APP_DOMAIN,
				time: new Date().toLocaleString(),
				location: location || "Unknown Location",
				device: device,
				ipAddress: formatIPAddress(request.ipAddress),
				reportUrl: reportUrl,
				browser: browser,
				supportEmail: configs.SUPPORT_EMAIL || configs.FROM_EMAIL,
				currentYear
			},
			passwordChangedTemplate
		),
	});
};

const sendNewLoginEmail = async (user, request) => {
	if (configs.SEND_NEW_LOGIN_EMAIL) {
		const reportUrl = `${configs.APP_DOMAIN}/security/report`;
		const location = await getLocationFromIP(request.ipAddress);
		const { browser, device } = parseUserAgent(request.headers["user-agent"]);
		const currentYear = new Date().getFullYear();
		
		return await sendEmail({
			email: user.email,
			subject: `Important : New Login to your ${
				configs.APP_NAME || ""
			} account`,
			html: renderTemplate(
				{
					username: user.name,
					appName: configs.APP_NAME,
					appDomain: configs.APP_DOMAIN,
					time: new Date().toLocaleString(),
					ipAddress: formatIPAddress(request.ipAddress),
					location: location || "Unknown Location",
					device: device,
					browser: browser,
					buttonHREF: reportUrl,
					currentYear
				},
				newLoginEmailTemplate
			),
		});
	}
	return emailStatus(false, "New login email is disabled");
};

module.exports = {
	sendEmail,
	renderTemplate,
	confirmationEmailHelper,
	passwordResetEmailHelper,
	passwordChangedEmailAlert,
	sendNewLoginEmail,
	loginWithEmailHelper,
};
