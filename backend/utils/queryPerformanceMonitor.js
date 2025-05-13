/**
 * Utility for monitoring database query performance
 *
 * This module provides functions to:
 * 1. Measure query execution time
 * 2. Log slow queries
 * 3. Track performance metrics over time
 */
const { configCache } = require('../services/configCache');

// Store performance metrics
const performanceMetrics = {
  queries: [],
  slowQueries: [],
  lastReset: Date.now()
};

// Configuration
const config = {
  slowQueryThreshold: 100, // ms
  maxStoredQueries: 1000,
  maxStoredSlowQueries: 100,
  enabled: false // Default to disabled, will be updated from config
};

// Function to check if monitoring is enabled
function isMonitoringEnabled() {
  // First check the database config
  const dbConfig = configCache.get('MONITOR_QUERY_PERFORMANCE');
  if (dbConfig !== undefined) {
    return dbConfig === 'true';
  }

  // Fall back to environment variable if database config is not available
  return process.env.MONITOR_QUERY_PERFORMANCE === 'true';
}

/**
 * Measure the execution time of a database query
 *
 * @param {Function} queryFn - Async function that performs the database query
 * @param {string} queryName - Name/description of the query for logging
 * @param {Object} queryParams - Parameters used in the query (for debugging)
 * @returns {Promise<any>} - The result of the query function
 */
async function measureQueryTime(queryFn, queryName, queryParams = {}) {
  // Check if monitoring is enabled from database config or environment variable
  if (!isMonitoringEnabled()) {
    return queryFn();
  }

  const startTime = Date.now();
  try {
    const result = await queryFn();
    const executionTime = Date.now() - startTime;

    // Record the query performance
    recordQueryPerformance(queryName, executionTime, queryParams);

    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;

    // Record the failed query
    recordQueryPerformance(queryName, executionTime, queryParams, error);

    // Re-throw the error
    throw error;
  }
}

/**
 * Record query performance metrics
 *
 * @param {string} queryName - Name/description of the query
 * @param {number} executionTime - Execution time in milliseconds
 * @param {Object} queryParams - Parameters used in the query
 * @param {Error} [error] - Error object if the query failed
 */
function recordQueryPerformance(queryName, executionTime, queryParams, error = null) {
  // Create the performance record
  const record = {
    queryName,
    executionTime,
    timestamp: Date.now(),
    params: JSON.stringify(queryParams).substring(0, 200), // Limit param size
    error: error ? error.message : null
  };

  // Add to the queries array (limit size)
  performanceMetrics.queries.push(record);
  if (performanceMetrics.queries.length > config.maxStoredQueries) {
    performanceMetrics.queries.shift();
  }

  // Check if it's a slow query
  if (executionTime > config.slowQueryThreshold) {
    console.warn(`Slow query detected: ${queryName} took ${executionTime}ms`);

    // Add to slow queries array (limit size)
    performanceMetrics.slowQueries.push(record);
    if (performanceMetrics.slowQueries.length > config.maxStoredSlowQueries) {
      performanceMetrics.slowQueries.shift();
    }
  }
}

/**
 * Get performance metrics for all recorded queries
 *
 * @returns {Object} - Performance metrics
 */
function getPerformanceMetrics() {
  // Calculate summary statistics
  const allExecutionTimes = performanceMetrics.queries.map(q => q.executionTime);
  const totalQueries = allExecutionTimes.length;

  // Get current monitoring state
  const monitoringEnabled = isMonitoringEnabled();

  if (totalQueries === 0) {
    return {
      totalQueries: 0,
      averageExecutionTime: 0,
      maxExecutionTime: 0,
      slowQueries: 0,
      errorQueries: 0,
      since: new Date(performanceMetrics.lastReset).toISOString(),
      monitoringEnabled
    };
  }

  const sum = allExecutionTimes.reduce((a, b) => a + b, 0);
  const average = sum / totalQueries;
  const max = Math.max(...allExecutionTimes);
  const slowQueries = performanceMetrics.slowQueries.length;
  const errorQueries = performanceMetrics.queries.filter(q => q.error).length;

  return {
    totalQueries,
    averageExecutionTime: average.toFixed(2),
    maxExecutionTime: max,
    slowQueries,
    errorQueries,
    since: new Date(performanceMetrics.lastReset).toISOString(),
    monitoringEnabled
  };
}

/**
 * Get detailed information about slow queries
 *
 * @returns {Array} - Array of slow query records
 */
function getSlowQueries() {
  return performanceMetrics.slowQueries;
}

/**
 * Reset all performance metrics
 */
function resetMetrics() {
  performanceMetrics.queries = [];
  performanceMetrics.slowQueries = [];
  performanceMetrics.lastReset = Date.now();
}

/**
 * Update configuration settings
 *
 * @param {Object} newConfig - New configuration settings
 */
function updateConfig(newConfig) {
  // Update local config object
  Object.assign(config, newConfig);

  // If enabled state is being updated, check if it matches the database config
  if (newConfig.hasOwnProperty('enabled')) {
    const dbEnabled = isMonitoringEnabled();
    if (config.enabled !== dbEnabled) {
      console.log(`Performance monitoring enabled state overridden by API call: ${config.enabled}`);
    }
  }
}

module.exports = {
  measureQueryTime,
  getPerformanceMetrics,
  getSlowQueries,
  resetMetrics,
  updateConfig
};
