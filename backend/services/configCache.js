const { Config } = require("../models/config");
const { configs } = require("../configs");

class ConfigCache {
    constructor() {
        this.cache = new Map();
        this.initialized = false;
        this.changeStream = null;
    }

    // Initialize the cache with configs from database
    async initialize(fastify) {
        try {
            if (this.initialized) {
                return;
            }

            const dbConfigs = await Config.find({}).lean();
            
            // Clear existing cache
            this.cache.clear();

            // Load configs into cache
            dbConfigs.forEach(config => {
                this.cache.set(config.key, config);
            });

            // Setup change stream
            await this.setupChangeStream(fastify);

            this.initialized = true;
            fastify.log.info("Config cache initialized successfully");
        } catch (error) {
            fastify.log.error({
                msg: "Error initializing config cache",
                error: error.message
            });
            throw error;
        }
    }

    // Setup MongoDB change stream
    async setupChangeStream(fastify) {
        try {
            // Close existing change stream if any
            if (this.changeStream) {
                await this.changeStream.close();
            }

            // Create new change stream
            this.changeStream = Config.watch();

            // Handle change events
            this.changeStream.on('change', async (change) => {
                fastify.log.info({
                    msg: "Config change detected",
                    operationType: change.operationType,
                    documentKey: change.documentKey
                });

                try {
                    switch (change.operationType) {
                        case 'insert':
                        case 'replace':
                            // Add or replace config in cache
                            const newConfig = change.fullDocument;
                            this.set(newConfig.key, newConfig);
                            this.updateRuntimeConfig(newConfig);
                            break;

                        case 'update':
                            // Update existing config in cache
                            const updatedDoc = await Config.findById(change.documentKey._id).lean();
                            if (updatedDoc) {
                                this.set(updatedDoc.key, updatedDoc);
                                this.updateRuntimeConfig(updatedDoc);
                            }
                            break;

                        case 'delete':
                            // Get the key from cache using _id
                            const deletedKey = Array.from(this.cache.entries())
                                .find(([_, value]) => value._id.toString() === change.documentKey._id.toString())?.[0];
                            
                            if (deletedKey) {
                                this.delete(deletedKey);
                                // Reset to environment value
                                configs[deletedKey] = process.env[deletedKey];
                            }
                            break;
                    }

                    // Update derived configurations
                    this.updateDerivedConfigs();

                    fastify.log.info("Config cache updated successfully");
                } catch (error) {
                    fastify.log.error({
                        msg: "Error processing config change",
                        error: error.message,
                        change
                    });
                }
            });

            this.changeStream.on('error', (error) => {
                fastify.log.error({
                    msg: "Error in config change stream",
                    error: error.message
                });
                
                // Attempt to reconnect after a delay
                setTimeout(() => {
                    this.setupChangeStream(fastify);
                }, 5000);
            });

        } catch (error) {
            fastify.log.error({
                msg: "Error setting up config change stream",
                error: error.message
            });
            throw error;
        }
    }

    // Update runtime config with new values
    updateRuntimeConfig(config) {
        const originalValue = configs[config.key];
        const valueType = typeof originalValue;
        
        // Convert value based on type
        let convertedValue = config.value;
        switch (valueType) {
            case 'boolean':
                convertedValue = config.value === true || config.value === 'true' || config.value === '1';
                break;
            case 'number':
                convertedValue = Number(config.value);
                break;
            case 'object':
                if (Array.isArray(originalValue)) {
                    convertedValue = Array.isArray(config.value) ? config.value : JSON.parse(config.value);
                } else {
                    convertedValue = typeof config.value === 'object' ? config.value : JSON.parse(config.value);
                }
                break;
        }

        configs[config.key] = convertedValue;
    }

    // Update derived configurations
    updateDerivedConfigs() {
        // Update SMTP configuration status
        configs.IS_SMTP_CONFIGURED = !!(
            configs.SMTP_HOST &&
            configs.SMTP_PORT &&
            configs.SMTP_EMAIL &&
            configs.SMTP_PASSWORD &&
            configs.FROM_EMAIL &&
            configs.FROM_NAME
        );

        // Update HTTP protocol
        if (configs.HTTP_PROTOCOL) {
            configs.HTTP_PROTOCOL = configs.HTTP_PROTOCOL.toLowerCase();
            if (!["http", "https"].includes(configs.HTTP_PROTOCOL)) {
                configs.HTTP_PROTOCOL = false;
            }
        }

        // Update app details configuration status
        configs.APP_DETAILS_CONFIGURED = !!(
            configs.APP_NAME &&
            configs.APP_DOMAIN &&
            configs.APP_CONFIRM_EMAIL_REDIRECT &&
            configs.APP_RESET_PASSWORD_REDIRECT &&
            configs.APP_REACTIVATE_ACCOUNT_URL
        );
    }

    // Get a config value from cache
    get(key) {
        const config = this.cache.get(key);
        return config ? config.value : null;
    }

    // Get all configs from cache
    getAll() {
        return Object.fromEntries(this.cache);
    }

    // Update or add a config in cache
    set(key, config) {
        this.cache.set(key, config);
    }

    // Remove a config from cache
    delete(key) {
        this.cache.delete(key);
    }

    // Check if a config exists in cache
    has(key) {
        return this.cache.has(key);
    }

    // Clear the entire cache
    clear() {
        this.cache.clear();
        this.initialized = false;
    }

    // Cleanup resources
    async cleanup() {
        if (this.changeStream) {
            await this.changeStream.close();
            this.changeStream = null;
        }
        this.clear();
    }
}

// Create a singleton instance
const configCache = new ConfigCache();

module.exports = {
    configCache
}; 