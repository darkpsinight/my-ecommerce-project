import { ADMIN_API } from 'src/config/api';

interface Config {
  APP_NAME: string;
  [key: string]: any;
}

interface ConfigResponse {
  configs: Config;
}

interface CacheData {
  configs: Config;
  timestamp: number;
}

const defaultConfigs: Config = {
  APP_NAME: 'DigitalMarket',
};

const CACHE_KEY = 'app_config_cache';
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export async function getPublicConfigs(): Promise<Config> {
  // Try to get cached data from localStorage
  const cachedData = localStorage.getItem(CACHE_KEY);
  const now = Date.now();

  if (cachedData) {
    try {
      const cache: CacheData = JSON.parse(cachedData);
      // Check if cache is still valid
      if (now - cache.timestamp < CACHE_DURATION) {
        return cache.configs;
      }
    } catch (error) {
      console.error('Error parsing cached config:', error);
      // If there's an error parsing the cache, we'll fetch fresh data
    }
  }

  try {
    const response = await fetch(ADMIN_API.CONFIGS, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch configurations');
    }

    const data: ConfigResponse = await response.json();

    // Validate that we received the expected data structure
    if (!data?.configs?.APP_NAME) {
      throw new Error('Invalid configuration data');
    }

    // Update cache in localStorage
    const cacheData: CacheData = {
      configs: data.configs,
      timestamp: now,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

    return data.configs;
  } catch (error) {
    console.error('Error fetching configurations:', error);
    // If we have cached data, return it even if expired
    if (cachedData) {
      try {
        const cache: CacheData = JSON.parse(cachedData);
        return cache.configs;
      } catch {
        // If we can't parse the cached data, return defaults
        return defaultConfigs;
      }
    }
    return defaultConfigs;
  }
}