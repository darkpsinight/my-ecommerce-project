const requestCounts = new Map();

const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 60 * 1000; // default 1 hour
  const max = options.max || 5; // default 5 requests per window

  return async (request, reply) => {
    const ip = request.ip;
    const now = Date.now();
    let userRequests = requestCounts.get(ip) || [];

    // Debug logging
    request.log.info({
      msg: "Rate limiter debug",
      ip,
      currentRequests: userRequests.length,
      max,
      windowMs,
      now,
      existingRequests: userRequests,
    });

    // Clear all requests if none exist or if window has expired
    const windowStart = now - windowMs;
    const hasExpired =
      userRequests.length === 0 ||
      (userRequests.length > 0 && userRequests[0] < windowStart);

    if (hasExpired) {
      userRequests = [];
      requestCounts.set(ip, userRequests);
      request.log.info({
        msg: "Rate limit window reset",
        ip,
        reason: "Window expired",
      });
    } else {
      // Only keep requests within current window
      userRequests = userRequests.filter((ts) => ts > windowStart);
      requestCounts.set(ip, userRequests);
    }

    // Check rate limit
    if (userRequests.length >= max) {
      const oldestRequest = userRequests[0];
      const resetTime = oldestRequest + windowMs;
      const remainingMs = resetTime - now;
      const remainingMinutes = Math.ceil(remainingMs / 60000);

      // Debug logging for rate limit exceeded
      request.log.warn({
        msg: "Rate limit exceeded",
        ip,
        requestCount: userRequests.length,
        max,
        resetTime,
        remainingMs,
      });

      reply.code(429);
      reply.header("X-RateLimit-Limit", max);
      reply.header("X-RateLimit-Remaining", 0);
      reply.header("X-RateLimit-Reset", Math.ceil(resetTime / 1000));
      reply.header("Retry-After", Math.ceil(remainingMs / 1000));

      throw new Error(
        `You've exceeded the rate limit. Please wait ${remainingMinutes} minutes before sending another message.`
      );
    }

    // Add current request
    userRequests.push(now);
    requestCounts.set(ip, userRequests);

    // Clean up old entries periodically (1% chance)
    if (Math.random() < 0.01) {
      for (const [key, timestamps] of requestCounts.entries()) {
        const validTimestamps = timestamps.filter((ts) => ts > windowStart);
        if (validTimestamps.length === 0) {
          requestCounts.delete(key);
        } else {
          requestCounts.set(key, validTimestamps);
        }
      }
    }

    // Add rate limit info to response headers
    const remaining = Math.max(0, max - userRequests.length);
    const resetTime = now + windowMs;

    reply.header("X-RateLimit-Limit", max);
    reply.header("X-RateLimit-Remaining", remaining);
    reply.header("X-RateLimit-Reset", Math.ceil(resetTime / 1000));

    // Debug logging for successful request
    request.log.info({
      msg: "Rate limit status",
      ip,
      remaining,
      total: userRequests.length,
      nextReset: new Date(resetTime).toISOString(),
    });
  };
};

module.exports = {
  rateLimiter,
};
