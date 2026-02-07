/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: RATE LIMITER MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Token bucket algorithm with sliding window
 * Per-user and per-IP rate limiting
 * 
 * @author Dimitar Prodromov
 * @version 1.0.0
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { IncomingMessage } from 'http';
import { getLogger } from '../utils/logger.js';

const logger = getLogger().child('RateLimiter');

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Max requests per window */
  max: number;
  /** Message when rate limited */
  message?: string;
  /** Header prefix for rate limit headers */
  headerPrefix?: string;
  /** Skip rate limiting for certain conditions */
  skip?: (req: IncomingMessage) => boolean;
  /** Key generator function */
  keyGenerator?: (req: IncomingMessage) => string;
  /** Behavior when rate limit exceeded */
  onRateLimited?: (req: IncomingMessage, result: RateLimitResult) => void;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  windowStart: number;
  requestCount: number;
}

interface SlidingWindowEntry {
  timestamp: number;
  count: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITER (TOKEN BUCKET)
// ═══════════════════════════════════════════════════════════════════════════════

export class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private config: Required<RateLimitConfig>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      max: config.max,
      message: config.message ?? 'Too many requests, please try again later',
      headerPrefix: config.headerPrefix ?? 'X-RateLimit',
      skip: config.skip ?? (() => false),
      keyGenerator: config.keyGenerator ?? this.defaultKeyGenerator.bind(this),
      onRateLimited: config.onRateLimited ?? (() => {})
    };

    // Cleanup old buckets every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check rate limit for request
   */
  check(req: IncomingMessage, customLimit?: number): RateLimitResult {
    // Skip if configured
    if (this.config.skip(req)) {
      return {
        allowed: true,
        limit: this.config.max,
        remaining: this.config.max,
        resetTime: Date.now() + this.config.windowMs,
        retryAfter: 0
      };
    }

    const key = this.config.keyGenerator(req);
    const limit = customLimit ?? this.config.max;
    const now = Date.now();

    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: limit,
        lastRefill: now,
        windowStart: now,
        requestCount: 0
      };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on time passed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = (timePassed / this.config.windowMs) * limit;
    bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Reset window if needed
    if (now - bucket.windowStart >= this.config.windowMs) {
      bucket.windowStart = now;
      bucket.requestCount = 0;
    }

    // Check if request is allowed
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      bucket.requestCount += 1;

      return {
        allowed: true,
        limit,
        remaining: Math.floor(bucket.tokens),
        resetTime: bucket.windowStart + this.config.windowMs,
        retryAfter: 0
      };
    }

    // Rate limited
    const resetTime = bucket.windowStart + this.config.windowMs;
    const retryAfter = Math.ceil((resetTime - now) / 1000);

    const result: RateLimitResult = {
      allowed: false,
      limit,
      remaining: 0,
      resetTime,
      retryAfter
    };

    logger.warn('Rate limit exceeded', {
      key,
      limit,
      windowMs: this.config.windowMs,
      retryAfter
    });

    this.config.onRateLimited(req, result);

    return result;
  }

  /**
   * Get rate limit headers
   */
  getHeaders(result: RateLimitResult): Record<string, string> {
    const prefix = this.config.headerPrefix;
    return {
      [`${prefix}-Limit`]: result.limit.toString(),
      [`${prefix}-Remaining`]: result.remaining.toString(),
      [`${prefix}-Reset`]: result.resetTime.toString(),
      ...(result.retryAfter > 0 && {
        'Retry-After': result.retryAfter.toString()
      })
    };
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string): void {
    this.buckets.delete(key);
  }

  /**
   * Get current status for key
   */
  getStatus(key: string): TokenBucket | undefined {
    return this.buckets.get(key);
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Default key generator using IP
   */
  private defaultKeyGenerator(req: IncomingMessage): string {
    return this.getClientIP(req);
  }

  /**
   * Get client IP from request
   */
  private getClientIP(req: IncomingMessage): string {
    const forwarded = req.headers['x-forwarded-for'];
    
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }

    const realIP = req.headers['x-real-ip'];
    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }

    return req.socket.remoteAddress || 'unknown';
  }

  /**
   * Cleanup expired buckets
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, bucket] of this.buckets) {
      if (now - bucket.lastRefill > this.config.windowMs * 2) {
        this.buckets.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cleaned expired rate limit buckets', { count: cleaned });
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDING WINDOW RATE LIMITER (More accurate)
// ═══════════════════════════════════════════════════════════════════════════════

export class SlidingWindowRateLimiter {
  private windows: Map<string, SlidingWindowEntry[]> = new Map();
  private config: Required<RateLimitConfig>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      max: config.max,
      message: config.message ?? 'Too many requests, please try again later',
      headerPrefix: config.headerPrefix ?? 'X-RateLimit',
      skip: config.skip ?? (() => false),
      keyGenerator: config.keyGenerator ?? this.defaultKeyGenerator.bind(this),
      onRateLimited: config.onRateLimited ?? (() => {})
    };

    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check rate limit using sliding window
   */
  check(req: IncomingMessage, customLimit?: number): RateLimitResult {
    if (this.config.skip(req)) {
      return {
        allowed: true,
        limit: this.config.max,
        remaining: this.config.max,
        resetTime: Date.now() + this.config.windowMs,
        retryAfter: 0
      };
    }

    const key = this.config.keyGenerator(req);
    const limit = customLimit ?? this.config.max;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let entries = this.windows.get(key) || [];
    
    // Remove expired entries
    entries = entries.filter(e => e.timestamp > windowStart);
    
    // Count requests in window
    const requestCount = entries.reduce((sum, e) => sum + e.count, 0);

    if (requestCount < limit) {
      // Add new entry
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry && now - lastEntry.timestamp < 1000) {
        // Aggregate within same second
        lastEntry.count++;
      } else {
        entries.push({ timestamp: now, count: 1 });
      }
      
      this.windows.set(key, entries);

      return {
        allowed: true,
        limit,
        remaining: limit - requestCount - 1,
        resetTime: now + this.config.windowMs,
        retryAfter: 0
      };
    }

    // Rate limited
    const oldestEntry = entries[0];
    const resetTime = oldestEntry ? oldestEntry.timestamp + this.config.windowMs : now + this.config.windowMs;
    const retryAfter = Math.ceil((resetTime - now) / 1000);

    const result: RateLimitResult = {
      allowed: false,
      limit,
      remaining: 0,
      resetTime,
      retryAfter: Math.max(1, retryAfter)
    };

    this.config.onRateLimited(req, result);

    return result;
  }

  /**
   * Get rate limit headers
   */
  getHeaders(result: RateLimitResult): Record<string, string> {
    const prefix = this.config.headerPrefix;
    return {
      [`${prefix}-Limit`]: result.limit.toString(),
      [`${prefix}-Remaining`]: result.remaining.toString(),
      [`${prefix}-Reset`]: result.resetTime.toString(),
      ...(result.retryAfter > 0 && {
        'Retry-After': result.retryAfter.toString()
      })
    };
  }

  reset(key: string): void {
    this.windows.delete(key);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private defaultKeyGenerator(req: IncomingMessage): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.config.windowMs * 2;
    
    for (const [key, entries] of this.windows) {
      const filtered = entries.filter(e => e.timestamp > cutoff);
      if (filtered.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, filtered);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIERED RATE LIMITER
// ═══════════════════════════════════════════════════════════════════════════════

export interface TieredRateLimitConfig {
  windowMs: number;
  tiers: {
    anonymous: number;
    free: number;
    pro: number;
    enterprise: number;
  };
  headerPrefix?: string;
}

export class TieredRateLimiter {
  private limiter: SlidingWindowRateLimiter;
  private tiers: TieredRateLimitConfig['tiers'];

  constructor(config: TieredRateLimitConfig) {
    this.tiers = config.tiers;
    this.limiter = new SlidingWindowRateLimiter({
      windowMs: config.windowMs,
      max: config.tiers.anonymous, // Default to lowest tier
      headerPrefix: config.headerPrefix
    });
  }

  /**
   * Check rate limit for specific tier
   */
  check(req: IncomingMessage, tier: keyof TieredRateLimitConfig['tiers']): RateLimitResult {
    const limit = this.tiers[tier] || this.tiers.anonymous;
    return this.limiter.check(req, limit);
  }

  getHeaders(result: RateLimitResult): Record<string, string> {
    return this.limiter.getHeaders(result);
  }

  destroy(): void {
    this.limiter.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}

export function createSlidingWindowRateLimiter(config: RateLimitConfig): SlidingWindowRateLimiter {
  return new SlidingWindowRateLimiter(config);
}

export function createTieredRateLimiter(config: TieredRateLimitConfig): TieredRateLimiter {
  return new TieredRateLimiter(config);
}

export default RateLimiter;
