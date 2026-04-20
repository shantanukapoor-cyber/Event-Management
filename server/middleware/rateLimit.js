/**
 * In-memory per-IP rate limiter.
 * No external dependencies — suitable for single-instance Cloud Run.
 */

/**
 * @typedef {Object} RateLimitOptions
 * @property {number} windowMs - Time window in milliseconds.
 * @property {number} max      - Max requests per IP within the window.
 */

/**
 * Creates an Express middleware that rate-limits requests per IP.
 * @param {RateLimitOptions} options
 * @returns {import('express').RequestHandler}
 */
export function createRateLimiter({ windowMs = 60_000, max = 60 } = {}) {
  /** @type {Map<string, { count: number, resetAt: number }>} */
  const clients = new Map();

  // Periodic cleanup to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of clients) {
      if (now > record.resetAt) {
        clients.delete(ip);
      }
    }
  }, windowMs * 2);

  // Allow GC if server shuts down
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  /**
   * Rate limiter middleware.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = clients.get(ip);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      clients.set(ip, record);
    }

    record.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - record.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));

    if (record.count > max) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfterMs: record.resetAt - now,
      });
    }

    next();
  }

  // Expose internals for testing
  rateLimitMiddleware._clients = clients;
  rateLimitMiddleware._cleanup = cleanupInterval;

  return rateLimitMiddleware;
}

/**
 * Standalone rate-limit checker for unit testing.
 * @param {RateLimitOptions} options
 * @returns {{ check: (ip: string) => boolean, reset: () => void }}
 */
export function createRateLimitChecker({ windowMs = 60_000, max = 10 } = {}) {
  /** @type {Map<string, { count: number, resetAt: number }>} */
  const clients = new Map();

  return {
    /**
     * Returns true if the request is allowed, false if rate-limited.
     * @param {string} ip
     * @returns {boolean}
     */
    check(ip) {
      const now = Date.now();
      let record = clients.get(ip);

      if (!record || now > record.resetAt) {
        record = { count: 0, resetAt: now + windowMs };
        clients.set(ip, record);
      }

      record.count++;
      return record.count <= max;
    },

    /** Clears all tracked clients. */
    reset() {
      clients.clear();
    },
  };
}
