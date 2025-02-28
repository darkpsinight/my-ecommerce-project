const { configs } = require("../../configs");
const { default: axios } = require("axios");

// Class to handle all the functions related to Oauth Provider login
// Returns 0 when the functions cannot get required information
class OauthProviderLogin {
	constructor(provider) {
		this.provider = provider;
	}

	// Function to get the initial login url
	getRedirectUrl = (state) => {
		if (!configs.SUPPORTED_PROVIDERS.includes(this.provider)) {
			return 0;
		}

		let queryParams;
		switch (this.provider) {
			case configs.PROVIDER_GOOGLE:
				queryParams = [
					`client_id=${configs.GOOGLE_CONFIGS.CLIENT_ID}`,
					`redirect_uri=${configs.GOOGLE_CONFIGS.REDIRECT_URI}`,
					`scope=${configs.GOOGLE_CONFIGS.SCOPE}`,
					`state=${state}`,
					`response_type=code`,
				].join("&");
				return `${configs.GOOGLE_CONFIGS.AUTHORIZE}?${queryParams}`;
			default:
				return 0;
		}
	};

	// function to get name and email, and if the email is verified
	async getUserDetails(code) {
		if (!code) {
			return 0;
		}
		switch (this.provider) {
			case configs.PROVIDER_GOOGLE:
				return await getDetailsGoogle(code);
			default:
				return 0;
		}
	}
}

// Function to get user details from Google
const getDetailsGoogle = async (code) => {
	const provider = configs.PROVIDER_GOOGLE;

	let email, verified;

	// Request body for access token request
	const requestBody = {
		grant_type: "authorization_code",
		client_id: configs.GOOGLE_CONFIGS.CLIENT_ID,
		client_secret: configs.GOOGLE_CONFIGS.CLIENT_SECRET,
		code: code,
		redirect_uri: configs.GOOGLE_CONFIGS.REDIRECT_URI,
	};

	try {
		// get Access token from code
		const accessTokenResponse = await axios.post(
			configs.GOOGLE_CONFIGS.ACCESS_TOKEN,
			requestBody
		);

		const accessToken = accessTokenResponse.data.access_token;

		const resourceResponse = await axios.get(
			"https://people.googleapis.com/v1/people/me\
			?requestMask.includeField=person.emailAddresses%2Cperson.names",
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: "application/json",
				},
			}
		);

		let name = resourceResponse.data.names[0]["displayName"];
		const emailList = resourceResponse.data.emailAddresses;

		let primaryEmail = null;

		// Find primary email from the list of emails
		for (let i = 0; i < emailList.length; i++) {
			if (emailList[i]["metadata"]["primary"]) {
				primaryEmail = emailList[i];
				break;
			}
		}

		// Return information if it finds valid user details
		if (primaryEmail && primaryEmail["value"]) {
			email = primaryEmail["value"];
			verified = primaryEmail["metadata"]["verified"];
			return {
				name,
				email,
				provider,
				verified,
			};
		} else {
			throw new Error('No primary email found');
		}
	} catch (error) {
		console.error('Error fetching user details from Google:', error.response ? error.response.data : error.message);
		return { error: 'Failed to fetch user details from Google' };
	}
	return 0;
};

module.exports = {
	OauthProviderLogin,
};
