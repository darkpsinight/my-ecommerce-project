const { configs } = require("../../configs");

const getLocationFromIP = async (ip) => {
    try {
        // Skip API call for localhost/development IPs
        if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
            return "Local Development";
        }

        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };

        const response = await fetch(
            `https://api.ipgeolocation.io/ipgeo?apiKey=${configs.IPGEOLOCATION_API_KEY}&ip=${ip}`,
            requestOptions
        );

        if (!response.ok) {
            throw new Error('Failed to fetch location data');
        }

        const result = await response.text();
        const data = JSON.parse(result);
        
        // Format the location string
        const location = [
            data.city,
            data.state_prov,
            data.country_name
        ].filter(Boolean).join(", ");

        return location || "Unknown Location";
    } catch (error) {
        console.error("IP Geolocation Error:", error);
        return "Unknown Location";
    }
};

module.exports = {
    getLocationFromIP
}; 