/**
 * Routes for monitoring database query performance
 */
const { getPerformanceMetrics, getSlowQueries, resetMetrics, updateConfig } = require('../utils/queryPerformanceMonitor');
const { verifyAuth } = require('../plugins/authVerify');

// Schema for performance metrics response
const performanceMetricsSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            totalQueries: { type: 'number' },
            averageExecutionTime: { type: 'string' },
            maxExecutionTime: { type: 'number' },
            slowQueries: { type: 'number' },
            errorQueries: { type: 'number' },
            since: { type: 'string' }
          }
        }
      }
    }
  }
};

// Schema for slow queries response
const slowQueriesSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              queryName: { type: 'string' },
              executionTime: { type: 'number' },
              timestamp: { type: 'number' },
              params: { type: 'string' },
              error: { type: ['string', 'null'] }
            }
          }
        }
      }
    }
  }
};

// Schema for reset metrics response
const resetMetricsSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

// Schema for update config request
const updateConfigSchema = {
  body: {
    type: 'object',
    properties: {
      slowQueryThreshold: { type: 'number' },
      maxStoredQueries: { type: 'number' },
      maxStoredSlowQueries: { type: 'number' },
      enabled: { type: 'boolean' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

/**
 * Register performance monitoring routes
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 * @param {Function} done - Callback to signal completion
 */
const performanceRoutes = (fastify, options, done) => {
  // Get performance metrics
  fastify.get('/admin/performance/metrics', {
    schema: performanceMetricsSchema,
    preHandler: verifyAuth(['admin'])
  }, async (request, reply) => {
    try {
      const metrics = getPerformanceMetrics();

      return reply.code(200).send({
        success: true,
        data: metrics
      });
    } catch (error) {
      request.log.error(`Error getting performance metrics: ${error.message}`);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get performance metrics',
        message: error.message
      });
    }
  });

  // Get slow queries
  fastify.get('/admin/performance/slow-queries', {
    schema: slowQueriesSchema,
    preHandler: verifyAuth(['admin'])
  }, async (request, reply) => {
    try {
      const slowQueries = getSlowQueries();

      return reply.code(200).send({
        success: true,
        data: slowQueries
      });
    } catch (error) {
      request.log.error(`Error getting slow queries: ${error.message}`);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get slow queries',
        message: error.message
      });
    }
  });

  // Reset metrics
  fastify.post('/admin/performance/reset', {
    schema: resetMetricsSchema,
    preHandler: verifyAuth(['admin'])
  }, async (request, reply) => {
    try {
      resetMetrics();

      return reply.code(200).send({
        success: true,
        message: 'Performance metrics reset successfully'
      });
    } catch (error) {
      request.log.error(`Error resetting performance metrics: ${error.message}`);
      return reply.code(500).send({
        success: false,
        error: 'Failed to reset performance metrics',
        message: error.message
      });
    }
  });

  // Update configuration
  fastify.post('/admin/performance/config', {
    schema: updateConfigSchema,
    preHandler: verifyAuth(['admin'])
  }, async (request, reply) => {
    try {
      updateConfig(request.body);

      return reply.code(200).send({
        success: true,
        message: 'Performance monitoring configuration updated successfully'
      });
    } catch (error) {
      request.log.error(`Error updating performance config: ${error.message}`);
      return reply.code(500).send({
        success: false,
        error: 'Failed to update performance configuration',
        message: error.message
      });
    }
  });

  done();
};

module.exports = performanceRoutes;
