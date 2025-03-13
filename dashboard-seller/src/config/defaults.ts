// Default configuration values for the seller dashboard

// API URL configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Default configuration values
export const defaultConfigs = {
  APP_NAME: 'CodeSale',
  APP_DESCRIPTION: 'E-commerce Seller Management Dashboard',
  APP_VERSION: '1.0.0',
  DEFAULT_LOCALE: 'en',
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_TIMEZONE: 'UTC',
  API_TIMEOUT: 30000, // 30 seconds
  MAX_FILE_SIZE: 5242880, // 5MB in bytes
  SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_PER_PAGE: 10,
    MAX_PER_PAGE: 100
  },
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:mm:ss',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss'
};