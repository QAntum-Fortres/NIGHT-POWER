/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM RATE LIMITER                                                         ║
 * ║   "Token bucket and sliding window rate limiting"                             ║
 * ║                                                                               ║
 * ║   TODO B #44 - API: Rate Limiting                                             ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RateLimitConfig {
    windowMs: number;          // Time window in milliseconds
    maxRequests: number;       // Max requests per window
    keyPrefix?: string;        // Prefix for storage keys
    skipFailedRequests?: boolean;
    skipSuccessfulRequests?: boolean;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;       // Seconds until retry
}

export interface RateLimitInfo {
    key: string;
    requests: number;
    windowStart: number;
    windowEnd: number;
    remaining: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN BUCKET ALGORITHM
// ═══════════════════════════════════════════════════════════════════════════════

export class TokenBucket {
    private tokens: number;
    private lastRefill: number;

    constructor(
        private capacity: number,
        private refillRate: number,  // tokens per second
        private refillAmount: number = 1
    ) {
        this.tokens = capacity;
        this.lastRefill = Date.now();
    }

    /**
     * Try to consume tokens
     */
    consume(amount: number = 1): RateLimitResult {
        this.refill();

        if (this.tokens >= amount) {
            this.tokens -= amount;
            return {
                allowed: true,
                remaining: Math.floor(this.tokens),
                resetAt: this.lastRefill + (this.capacity / this.refillRate) * 1000
            };
        }

        const tokensNeeded = amount - this.tokens;
        const waitTime = (tokensNeeded / this.refillRate) * 1000;

        return {
            allowed: false,
            remaining: 0,
            resetAt: Date.now() + waitTime,
            retryAfter: Math.ceil(waitTime / 1000)
        };
    }

    /**
     * Refill tokens based on elapsed time
     */
    private refill(): void {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000;
        const tokensToAdd = elapsed * this.refillRate * this.refillAmount;

        this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }

    /**
     * Get current state
     */
    getState(): { tokens: number; capacity: number; refillRate: number } {
        this.refill();
        return {
            tokens: Math.floor(this.tokens),
            capacity: this.capacity,
            refillRate: this.refillRate
        };
    }

    /**
     * Reset bucket to full capacity
     */
    reset(): void {
        this.tokens = this.capacity;
        this.lastRefill = Date.now();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDING WINDOW COUNTER
// ═══════════════════════════════════════════════════════════════════════════════

export class SlidingWindowCounter {
    private windows: Map<number, number> = new Map();

    constructor(
        private windowMs: number,
        private maxRequests: number
    ) {}

    /**
     * Record a request and check if allowed
     */
    hit(timestamp: number = Date.now()): RateLimitResult {
        const currentWindow = Math.floor(timestamp / this.windowMs);
        const previousWindow = currentWindow - 1;

        // Clean old windows
        this.cleanup(currentWindow);

        // Get counts
        const currentCount = this.windows.get(currentWindow) || 0;
        const previousCount = this.windows.get(previousWindow) || 0;

        // Calculate weighted count (sliding window approximation)
        const windowProgress = (timestamp % this.windowMs) / this.windowMs;
        const weightedCount = previousCount * (1 - windowProgress) + currentCount;

        if (weightedCount < this.maxRequests) {
            // Allowed - increment counter
            this.windows.set(currentWindow, currentCount + 1);

            return {
                allowed: true,
                remaining: Math.floor(this.maxRequests - weightedCount - 1),
                resetAt: (currentWindow + 1) * this.windowMs
            };
        }

        // Rate limited
        const resetAt = (currentWindow + 1) * this.windowMs;
        return {
            allowed: false,
            remaining: 0,
            resetAt,
            retryAfter: Math.ceil((resetAt - timestamp) / 1000)
        };
    }

    /**
     * Get current window info
     */
    getInfo(timestamp: number = Date.now()): RateLimitInfo {
        const currentWindow = Math.floor(timestamp / this.windowMs);
        const count = this.windows.get(currentWindow) || 0;

        return {
            key: `window-${currentWindow}`,
            requests: count,
            windowStart: currentWindow * this.windowMs,
            windowEnd: (currentWindow + 1) * this.windowMs,
            remaining: Math.max(0, this.maxRequests - count)
        };
    }

    /**
     * Reset all windows
     */
    reset(): void {
        this.windows.clear();
    }

    private cleanup(currentWindow: number): void {
        // Keep only current and previous window
        for (const window of this.windows.keys()) {
            if (window < currentWindow - 1) {
                this.windows.delete(window);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITER SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export type RateLimitStrategy = 'token-bucket' | 'sliding-window' | 'fixed-window';

export interface RateLimiterConfig {
    strategy: RateLimitStrategy;
    windowMs: number;
    maxRequests: number;
    burstCapacity?: number;  // For token bucket
}

export class RateLimiter {
    private limiters: Map<string, TokenBucket | SlidingWindowCounter> = new Map();
    private config: RateLimiterConfig;

    constructor(config: RateLimiterConfig) {
        this.config = {
            burstCapacity: config.maxRequests,
            ...config
        };
    }

    /**
     * Check if request is allowed for a key
     */
    check(key: string): RateLimitResult {
        const limiter = this.getOrCreateLimiter(key);

        if (limiter instanceof TokenBucket) {
            return limiter.consume(1);
        } else {
            return limiter.hit();
        }
    }

    /**
     * Check without consuming
     */
    peek(key: string): RateLimitResult {
        const limiter = this.limiters.get(key);
        
        if (!limiter) {
            return {
                allowed: true,
                remaining: this.config.maxRequests,
                resetAt: Date.now() + this.config.windowMs
            };
        }

        if (limiter instanceof TokenBucket) {
            const state = limiter.getState();
            return {
                allowed: state.tokens > 0,
                remaining: state.tokens,
                resetAt: Date.now() + (state.capacity / state.refillRate) * 1000
            };
        } else {
            const info = limiter.getInfo();
            return {
                allowed: info.remaining > 0,
                remaining: info.remaining,
                resetAt: info.windowEnd
            };
        }
    }

    /**
     * Reset rate limit for a key
     */
    reset(key: string): void {
        const limiter = this.limiters.get(key);
        if (limiter) {
            limiter.reset();
        }
    }

    /**
     * Reset all rate limits
     */
    resetAll(): void {
        this.limiters.clear();
    }

    /**
     * Get info for a key
     */
    getInfo(key: string): RateLimitInfo | null {
        const limiter = this.limiters.get(key);
        
        if (!limiter) return null;

        if (limiter instanceof SlidingWindowCounter) {
            return limiter.getInfo();
        }

        const state = (limiter as TokenBucket).getState();
        return {
            key,
            requests: state.capacity - state.tokens,
            windowStart: Date.now(),
            windowEnd: Date.now() + this.config.windowMs,
            remaining: state.tokens
        };
    }

    private getOrCreateLimiter(key: string): TokenBucket | SlidingWindowCounter {
        let limiter = this.limiters.get(key);

        if (!limiter) {
            if (this.config.strategy === 'token-bucket') {
                // tokens per second = max requests / window in seconds
                const refillRate = this.config.maxRequests / (this.config.windowMs / 1000);
                limiter = new TokenBucket(
                    this.config.burstCapacity!,
                    refillRate
                );
            } else {
                limiter = new SlidingWindowCounter(
                    this.config.windowMs,
                    this.config.maxRequests
                );
            }
            this.limiters.set(key, limiter);
        }

        return limiter;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════════

const defaultLimiter = new RateLimiter({
    strategy: 'sliding-window',
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 100
});

/**
 * @RateLimit - Apply rate limiting to a method
 */
export function RateLimit(
    maxRequests: number,
    windowMs: number = 60000,
    keyExtractor?: (args: any[]) => string
): MethodDecorator {
    const limiter = new RateLimiter({
        strategy: 'sliding-window',
        windowMs,
        maxRequests
    });

    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;
        const methodName = String(propertyKey);

        descriptor.value = function (...args: any[]) {
            const key = keyExtractor 
                ? keyExtractor(args) 
                : `${methodName}-default`;

            const result = limiter.check(key);

            if (!result.allowed) {
                throw new RateLimitError(
                    `Rate limit exceeded. Retry after ${result.retryAfter} seconds.`,
                    result
                );
            }

            return original.apply(this, args);
        };

        return descriptor;
    };
}

/**
 * @ThrottleMethod - Simple throttle (one call per interval)
 */
export function ThrottleMethod(intervalMs: number): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;
        let lastCall = 0;

        descriptor.value = function (...args: any[]) {
            const now = Date.now();
            
            if (now - lastCall < intervalMs) {
                throw new Error(`Method throttled. Wait ${intervalMs - (now - lastCall)}ms`);
            }

            lastCall = now;
            return original.apply(this, args);
        };

        return descriptor;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR
// ═══════════════════════════════════════════════════════════════════════════════

export class RateLimitError extends Error {
    constructor(
        message: string,
        public readonly result: RateLimitResult
    ) {
        super(message);
        this.name = 'RateLimitError';
    }

    get retryAfter(): number {
        return this.result.retryAfter || 0;
    }

    get resetAt(): Date {
        return new Date(this.result.resetAt);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════════════════════

export const RateLimitPresets = {
    /** Standard API: 100 req/min */
    api: (): RateLimiter => new RateLimiter({
        strategy: 'sliding-window',
        windowMs: 60 * 1000,
        maxRequests: 100
    }),

    /** Strict: 10 req/min */
    strict: (): RateLimiter => new RateLimiter({
        strategy: 'sliding-window',
        windowMs: 60 * 1000,
        maxRequests: 10
    }),

    /** Burst: 1000 req/min with 50 burst */
    burst: (): RateLimiter => new RateLimiter({
        strategy: 'token-bucket',
        windowMs: 60 * 1000,
        maxRequests: 1000,
        burstCapacity: 50
    }),

    /** Auth: 5 req/15min (login attempts) */
    auth: (): RateLimiter => new RateLimiter({
        strategy: 'fixed-window',
        windowMs: 15 * 60 * 1000,
        maxRequests: 5
    }),

    /** Daily: 10000 req/day */
    daily: (): RateLimiter => new RateLimiter({
        strategy: 'sliding-window',
        windowMs: 24 * 60 * 60 * 1000,
        maxRequests: 10000
    })
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
    return new RateLimiter(config);
}

export function createTokenBucket(
    capacity: number,
    refillRate: number
): TokenBucket {
    return new TokenBucket(capacity, refillRate);
}

export default RateLimiter;
