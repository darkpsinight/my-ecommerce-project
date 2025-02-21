const { Config } = require("../models/config");
const { configs } = require("../configs");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/responseHelpers");
const { configCache } = require("../services/configCache");

// Helper function to get environment variable type
const getValueType = (value) => {
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    if (typeof value === "string") return "string";
    if (Array.isArray(value)) return "array";
    if (typeof value === "object") return "object";
    return "string";
};

// Helper function to convert value based on type
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

// @route   GET /api/v1/admin/configs
// @desc    Get all configurations
// @access  Private (Admin only)
const getConfigs = async (request, reply) => {
    try {
        // Get configs from cache
        const cachedConfigs = configCache.getAll();
        
        // Get environment configs
        const envConfigs = Object.entries(configs).reduce((acc, [key, value]) => {
            // Skip function configs
            if (typeof value === "function") return acc;
            
            // Use cached value if available, otherwise use environment value
            const config = cachedConfigs[key] || {
                key,
                value,
                category: "system",
                isPublic: false,
                description: "System configuration from environment",
            };

            acc[key] = config;
            return acc;
        }, {});

        return sendSuccessResponse(reply, {
            statusCode: 200,
            message: "Configurations retrieved successfully",
            configs: envConfigs,
        });
    } catch (error) {
        request.log.error({
            msg: "Error retrieving configurations",
            error: error.message,
        });
        return sendErrorResponse(reply, 500, "Error retrieving configurations");
    }
};

// @route   POST /api/v1/admin/configs
// @desc    Update or create configuration
// @access  Private (Admin only)
const updateConfig = async (request, reply) => {
    try {
        const { key, value, description, category, isPublic } = request.body;

        // Get the original config value type from environment
        const originalValue = configs[key];
        const valueType = getValueType(originalValue);

        // Convert the value to the correct type
        const convertedValue = convertValue(value, valueType);

        // Update or create config in database
        const config = await Config.findOneAndUpdate(
            { key },
            {
                value: convertedValue,
                description,
                category,
                isPublic,
                lastModifiedBy: request.user._id,
                lastModifiedAt: new Date(),
            },
            {
                new: true,
                upsert: true,
            }
        );

        // Update the runtime config and cache
        configs[key] = convertedValue;
        configCache.set(key, config.toObject());

        return sendSuccessResponse(reply, {
            statusCode: 200,
            message: "Configuration updated successfully",
            config,
        });
    } catch (error) {
        request.log.error({
            msg: "Error updating configuration",
            error: error.message,
        });
        return sendErrorResponse(reply, 500, "Error updating configuration");
    }
};

// @route   DELETE /api/v1/admin/configs/:key
// @desc    Delete a configuration (reset to environment default)
// @access  Private (Admin only)
const deleteConfig = async (request, reply) => {
    try {
        const { key } = request.params;

        // Delete the config from database and get the result
        const result = await Config.deleteOne({ key });

        // Check if any document was actually deleted
        if (result.deletedCount === 0) {
            return sendErrorResponse(reply, 404, `Configuration with key '${key}' not found`);
        }

        // Reset to environment value and update cache
        configs[key] = process.env[key];
        configCache.delete(key);

        return sendSuccessResponse(reply, {
            statusCode: 200,
            message: "Configuration deleted; system now using environment default value.",
            details: {
                key,
                deletedCount: result.deletedCount
            }
        });
    } catch (error) {
        request.log.error({
            msg: "Error deleting configuration",
            error: error.message,
        });
        return sendErrorResponse(reply, 500, "Error deleting configuration");
    }
};

module.exports = {
    getConfigs,
    updateConfig,
    deleteConfig,
}; 