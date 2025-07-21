const { configs } = require("../../configs");

const getLocationFromIP = async (ip) => {
    // Check if IP geolocation is disabled
    if (configs.DISABLE_IP_GEOLOCATION === "1") {
        return "Location Service Disabled";
    }

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

// Enhanced function to get detailed geographic data
const getDetailedLocationFromIP = async (ip) => {
    // Check if IP geolocation is disabled
    if (configs.DISABLE_IP_GEOLOCATION === "1") {
        return {
            ipAddress: ip,
            country: "Unknown",
            countryCode: "XX",
            region: "Unknown",
            city: "Unknown",
            latitude: null,
            longitude: null,
            timezone: "Unknown",
            locationString: "Location Service Disabled"
        };
    }

    try {
        // Skip API call for localhost/development IPs
        if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
            return {
                ipAddress: ip,
                country: "Local",
                countryCode: "LC",
                region: "Local",
                city: "Local",
                latitude: null,
                longitude: null,
                timezone: "Local",
                locationString: "Local Development"
            };
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
        const locationString = [
            data.city,
            data.state_prov,
            data.country_name
        ].filter(Boolean).join(", ");

        return {
            ipAddress: ip,
            country: data.country_name || "Unknown",
            countryCode: data.country_code2 || "XX",
            region: data.state_prov || "Unknown",
            city: data.city || "Unknown",
            latitude: data.latitude ? parseFloat(data.latitude) : null,
            longitude: data.longitude ? parseFloat(data.longitude) : null,
            timezone: data.time_zone?.name || "Unknown",
            locationString: locationString || "Unknown Location"
        };

    } catch (error) {
        console.error("IP Geolocation Error:", error);
        return {
            ipAddress: ip,
            country: "Unknown",
            countryCode: "XX",
            region: "Unknown",
            city: "Unknown",
            latitude: null,
            longitude: null,
            timezone: "Unknown",
            locationString: "Unknown Location"
        };
    }
};

module.exports = {
    getLocationFromIP,
    getDetailedLocationFromIP
}; 