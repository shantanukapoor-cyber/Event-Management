/**
 * Rate limiter tests.
 * Verifies per-IP limiting, window enforcement, and IP isolation.
 */

import { describe, it, expect } from 'vitest';
import { createRateLimitChecker } from '../../server/middleware/rateLimit.js';

describe('Rate Limiter', () => {
  it('allows requests within the limit', () => {
    const limiter = createRateLimitChecker({ windowMs: 60_000, max: 10 });

    for (let i = 0; i < 10; i++) {
      expect(limiter.check('127.0.0.1')).toBe(true);
    }
  });

  it('blocks the 11th request within the window', () => {
    const limiter = createRateLimitChecker({ windowMs: 60_000, max: 10 });

    for (let i = 0; i < 10; i++) {
      limiter.check('127.0.0.1');
    }

    expect(limiter.check('127.0.0.1')).toBe(false);
  });

  it('tracks IPs independently', () => {
    const limiter = createRateLimitChecker({ windowMs: 60_000, max: 2 });

    expect(limiter.check('10.0.0.1')).toBe(true);
    expect(limiter.check('10.0.0.1')).toBe(true);
    expect(limiter.check('10.0.0.1')).toBe(false);  // blocked

    // Different IP is still allowed
    expect(limiter.check('10.0.0.2')).toBe(true);
    expect(limiter.check('10.0.0.2')).toBe(true);
  });

  it('resets after window expires', async () => {
    const limiter = createRateLimitChecker({ windowMs: 100, max: 2 });

    expect(limiter.check('127.0.0.1')).toBe(true);
    expect(limiter.check('127.0.0.1')).toBe(true);
    expect(limiter.check('127.0.0.1')).toBe(false);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(limiter.check('127.0.0.1')).toBe(true);
  });

  it('reset() clears all tracked clients', () => {
    const limiter = createRateLimitChecker({ windowMs: 60_000, max: 1 });

    limiter.check('127.0.0.1');
    expect(limiter.check('127.0.0.1')).toBe(false);

    limiter.reset();
    expect(limiter.check('127.0.0.1')).toBe(true);
  });

  it('handles max=1 correctly', () => {
    const limiter = createRateLimitChecker({ windowMs: 60_000, max: 1 });

    expect(limiter.check('127.0.0.1')).toBe(true);
    expect(limiter.check('127.0.0.1')).toBe(false);
  });
});
