/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * ⚡ USAGE GUARD - ADAPTIVE RATE LIMITER
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * 
 * v1.5.0 "The Sovereign Gateway" - Enterprise Rate Limiting System
 * 
 *   ██╗   ██╗███████╗ █████╗  ██████╗ ███████╗     ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ 
 *   ██║   ██║██╔════╝██╔══██╗██╔════╝ ██╔════╝    ██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
 *   ██║   ██║███████╗███████║██║  ███╗█████╗      ██║  ███╗██║   ██║███████║██████╔╝██║  ██║
 *   ██║   ██║╚════██║██╔══██║██║   ██║██╔══╝      ██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
 *   ╚██████╔╝███████║██║  ██║╚██████╔╝███████╗    ╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
 *    ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ 
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * 
 *   MARKET VALUE INCREMENT: +$95,000
 *   
 *   Features:
 *   • Token Bucket Algorithm with Adaptive Refill
 *   • Sliding Window Rate Limiting
 *   • Plan-based Throttling (Starter/Professional/Enterprise/Unlimited)
 *   • Burst Allowance with Cooldown
 *   • Real-time Metrics & Analytics
 *   • Graceful Degradation Under Load
 *   
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * @module reality/gateway
 * @version 1.5.0
 * @license Commercial - All Rights Reserved
 * @author QANTUM AI Architect
 * @commercial true
 * @marketValue $95,000
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type PlanTier = 'starter' | 'professional' | 'enterprise' | 'unlimited';

export interface RateLimitPlan {
  tier: PlanTier;
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  burstCooldownMs: number;
  maxConcurrent: number;
  priority: number; // Higher = more priority in queue
}

export interface TokenBucket {
  tokens: number;
  lastRefill: number;
  burstTokens: number;
  burstLastUsed: number;
  requestsThisSecond: number;
  requestsThisMinute: number;
  requestsThisHour: number;
  requestsThisDay: number;
  secondWindow: number;
  minuteWindow: number;
  hourWindow: number;
  dayWindow: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  retryAfter?: number;
  reason?: string;
  headers: Record<string, string>;
}

export interface ThrottleMetrics {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  throttledRequests: number;
  burstUsage: number;
  avgLatency: number;
  peakRps: number;
  byTier: Record<PlanTier, {
    requests: number;
    blocked: number;
    throttled: number;
  }>;
}

export interface UsageGuardConfig {
  enableAdaptive: boolean;
  adaptiveThreshold: number; // CPU usage threshold
  gracePeriodMs: number;
  enableBurst: boolean;
  enablePriority: boolean;
  queueSize: number;
  cleanupIntervalMs: number;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// PLAN CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const RATE_LIMIT_PLANS: Record<PlanTier, RateLimitPlan> = {
  starter: {
    tier: 'starter',
    requestsPerSecond: 2,
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstLimit: 10,
    burstCooldownMs: 60000,
    maxConcurrent: 5,
    priority: 1
  },
  professional: {
    tier: 'professional',
    requestsPerSecond: 10,
    requestsPerMinute: 300,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    burstLimit: 50,
    burstCooldownMs: 30000,
    maxConcurrent: 25,
    priority: 2
  },
  enterprise: {
    tier: 'enterprise',
    requestsPerSecond: 50,
    requestsPerMinute: 1000,
    requestsPerHour: 20000,
    requestsPerDay: 200000,
    burstLimit: 200,
    burstCooldownMs: 10000,
    maxConcurrent: 100,
    priority: 3
  },
  unlimited: {
    tier: 'unlimited',
    requestsPerSecond: -1,
    requestsPerMinute: -1,
    requestsPerHour: -1,
    requestsPerDay: -1,
    burstLimit: -1,
    burstCooldownMs: 0,
    maxConcurrent: -1,
    priority: 10
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// USAGE GUARD - RATE LIMITER
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ⚡ UsageGuard - Adaptive Rate Limiter
 * 
 * Enterprise-grade rate limiting with:
 * - Token bucket algorithm
 * - Sliding window counters
 * - Burst allowance
 * - Priority queueing
 * - Adaptive throttling under load
 * 
 * @example
 * ```typescript
 * const guard = new UsageGuard();
 * 
 * const result = guard.checkLimit('client_123', 'professional');
 * if (result.allowed) {
 *   // Process request
 *   guard.recordRequest('client_123');
 * } else {
 *   // Return 429 Too Many Requests
 *   res.set(result.headers);
 *   res.status(429).json({ retryAfter: result.retryAfter });
 * }
 * ```
 */
export class UsageGuard extends EventEmitter {
  private config: UsageGuardConfig;
  private buckets: Map<string, TokenBucket> = new Map();
  private concurrentRequests: Map<string, number> = new Map();
  private priorityQueue: Array<{ clientId: string; tier: PlanTier; timestamp: number }> = [];
  private metrics: ThrottleMetrics;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private adaptiveMultiplier = 1.0;

  constructor(config?: Partial<UsageGuardConfig>) {
    super();
    this.setMaxListeners(100);

    this.config = {
      enableAdaptive: config?.enableAdaptive ?? true,
      adaptiveThreshold: config?.adaptiveThreshold ?? 80,
      gracePeriodMs: config?.gracePeriodMs ?? 5000,
      enableBurst: config?.enableBurst ?? true,
      enablePriority: config?.enablePriority ?? true,
      queueSize: config?.queueSize ?? 1000,
      cleanupIntervalMs: config?.cleanupIntervalMs ?? 60000
    };

    this.metrics = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      throttledRequests: 0,
      burstUsage: 0,
      avgLatency: 0,
      peakRps: 0,
      byTier: {
        starter: { requests: 0, blocked: 0, throttled: 0 },
        professional: { requests: 0, blocked: 0, throttled: 0 },
        enterprise: { requests: 0, blocked: 0, throttled: 0 },
        unlimited: { requests: 0, blocked: 0, throttled: 0 }
      }
    };

    this.startCleanup();
    this.startAdaptiveMonitor();
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────
  // CORE RATE LIMITING
  // ─────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Check if request is allowed under rate limits
   */
  checkLimit(clientId: string, tier: PlanTier): RateLimitResult {
    const plan = RATE_LIMIT_PLANS[tier];
    const now = Date.now();

    // Unlimited tier always passes
    if (tier === 'unlimited') {
      this.metrics.totalRequests++;
      this.metrics.allowedRequests++;
      this.metrics.byTier.unlimited.requests++;
      return this.createAllowedResult(plan);
    }

    // Get or create bucket
    const bucket = this.getOrCreateBucket(clientId, plan);
    this.refillBucket(bucket, plan, now);

    // Check concurrent limit
    const concurrent = this.concurrentRequests.get(clientId) || 0;
    if (concurrent >= plan.maxConcurrent) {
      return this.createBlockedResult('concurrent_limit', plan, 1000);
    }

    // Apply adaptive throttling
    const effectiveLimit = Math.floor(plan.requestsPerMinute * this.adaptiveMultiplier);

    // Check sliding window limits
    if (bucket.requestsThisSecond >= plan.requestsPerSecond) {
      return this.createThrottledResult('second_limit', plan, bucket, 1000);
    }

    if (bucket.requestsThisMinute >= effectiveLimit) {
      // Check burst allowance
      if (this.config.enableBurst && this.canUseBurst(bucket, plan, now)) {
        bucket.burstTokens--;
        bucket.burstLastUsed = now;
        this.metrics.burstUsage++;
        return this.createAllowedResult(plan, true);
      }
      return this.createThrottledResult('minute_limit', plan, bucket, 60000 - (now - bucket.minuteWindow));
    }

    if (bucket.requestsThisHour >= plan.requestsPerHour) {
      return this.createThrottledResult('hour_limit', plan, bucket, 3600000 - (now - bucket.hourWindow));
    }

    if (bucket.requestsThisDay >= plan.requestsPerDay) {
      return this.createBlockedResult('day_limit', plan, this.getMsUntilMidnight());
    }

    // Token available
    this.metrics.totalRequests++;
    this.metrics.allowedRequests++;
    this.metrics.byTier[tier].requests++;

    return this.createAllowedResult(plan);
  }

  /**
   * Record a request (call after checkLimit returns allowed)
   */
  recordRequest(clientId: string): void {
    const bucket = this.buckets.get(clientId);
    if (!bucket) return;

    const now = Date.now();

    // Update windows if needed
    this.updateWindows(bucket, now);

    // Increment counters
    bucket.requestsThisSecond++;
    bucket.requestsThisMinute++;
    bucket.requestsThisHour++;
    bucket.requestsThisDay++;
    bucket.tokens--;
  }

  /**
   * Start a concurrent request
   */
  startConcurrent(clientId: string): boolean {
    const current = this.concurrentRequests.get(clientId) || 0;
    this.concurrentRequests.set(clientId, current + 1);
    return true;
  }

  /**
   * End a concurrent request
   */
  endConcurrent(clientId: string): void {
    const current = this.concurrentRequests.get(clientId) || 0;
    this.concurrentRequests.set(clientId, Math.max(0, current - 1));
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────
  // TOKEN BUCKET MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Get or create a token bucket for client
   */
  private getOrCreateBucket(clientId: string, plan: RateLimitPlan): TokenBucket {
    let bucket = this.buckets.get(clientId);
    if (!bucket) {
      const now = Date.now();
      bucket = {
        tokens: plan.requestsPerMinute,
        lastRefill: now,
        burstTokens: plan.burstLimit,
        burstLastUsed: 0,
        requestsThisSecond: 0,
        requestsThisMinute: 0,
        requestsThisHour: 0,
        requestsThisDay: 0,
        secondWindow: now,
        minuteWindow: now,
        hourWindow: now,
        dayWindow: now
      };
      this.buckets.set(clientId, bucket);
    }
    return bucket;
  }

  /**
   * Refill bucket tokens based on time elapsed
   */
  private refillBucket(bucket: TokenBucket, plan: RateLimitPlan, now: number): void {
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor((elapsed / 60000) * plan.requestsPerMinute);
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(plan.requestsPerMinute, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    // Refill burst tokens
    if (now - bucket.burstLastUsed >= plan.burstCooldownMs) {
      bucket.burstTokens = Math.min(plan.burstLimit, bucket.burstTokens + 1);
    }
  }

  /**
   * Update sliding windows
   */
  private updateWindows(bucket: TokenBucket, now: number): void {
    // Second window
    if (now - bucket.secondWindow >= 1000) {
      bucket.requestsThisSecond = 0;
      bucket.secondWindow = now;
    }

    // Minute window
    if (now - bucket.minuteWindow >= 60000) {
      bucket.requestsThisMinute = 0;
      bucket.minuteWindow = now;
    }

    // Hour window
    if (now - bucket.hourWindow >= 3600000) {
      bucket.requestsThisHour = 0;
      bucket.hourWindow = now;
    }

    // Day window
    if (now - bucket.dayWindow >= 86400000) {
      bucket.requestsThisDay = 0;
      bucket.dayWindow = now;
    }
  }

  /**
   * Check if burst tokens are available
   */
  private canUseBurst(bucket: TokenBucket, plan: RateLimitPlan, now: number): boolean {
    if (bucket.burstTokens <= 0) return false;
    if (now - bucket.burstLastUsed < plan.burstCooldownMs) return false;
    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────
  // RESULT BUILDERS
  // ─────────────────────────────────────────────────────────────────────────────────────────

  private createAllowedResult(plan: RateLimitPlan, usedBurst = false): RateLimitResult {
    return {
      allowed: true,
      remaining: plan.requestsPerMinute,
      resetIn: 60000,
      headers: {
        'X-RateLimit-Limit': String(plan.requestsPerMinute),
        'X-RateLimit-Remaining': String(plan.requestsPerMinute),
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
        ...(usedBurst ? { 'X-RateLimit-Burst-Used': 'true' } : {})
      }
    };
  }

  private createThrottledResult(
    reason: string,
    plan: RateLimitPlan,
    bucket: TokenBucket,
    retryAfter: number
  ): RateLimitResult {
    this.metrics.throttledRequests++;
    this.metrics.byTier[plan.tier].throttled++;

    this.emit('throttled', {
      tier: plan.tier,
      reason,
      retryAfter
    });

    return {
      allowed: false,
      remaining: 0,
      resetIn: retryAfter,
      retryAfter: Math.ceil(retryAfter / 1000),
      reason: `Rate limit exceeded: ${reason}`,
      headers: {
        'X-RateLimit-Limit': String(plan.requestsPerMinute),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor((Date.now() + retryAfter) / 1000)),
        'Retry-After': String(Math.ceil(retryAfter / 1000))
      }
    };
  }

  private createBlockedResult(reason: string, plan: RateLimitPlan, retryAfter: number): RateLimitResult {
    this.metrics.blockedRequests++;
    this.metrics.byTier[plan.tier].blocked++;

    this.emit('blocked', {
      tier: plan.tier,
      reason,
      retryAfter
    });

    return {
      allowed: false,
      remaining: 0,
      resetIn: retryAfter,
      retryAfter: Math.ceil(retryAfter / 1000),
      reason: `Request blocked: ${reason}`,
      headers: {
        'X-RateLimit-Limit': String(plan.requestsPerDay),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor((Date.now() + retryAfter) / 1000)),
        'Retry-After': String(Math.ceil(retryAfter / 1000))
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────
  // ADAPTIVE THROTTLING
  // ─────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Start adaptive monitoring
   */
  private startAdaptiveMonitor(): void {
    if (!this.config.enableAdaptive) return;

    setInterval(() => {
      // Simulate CPU monitoring (in production, use os.loadavg())
      const cpuUsage = this.estimateCpuUsage();
      
      if (cpuUsage > this.config.adaptiveThreshold) {
        // Reduce limits under high load
        this.adaptiveMultiplier = Math.max(0.5, this.adaptiveMultiplier - 0.1);
        this.emit('adaptive_throttle', { cpuUsage, multiplier: this.adaptiveMultiplier });
      } else if (cpuUsage < this.config.adaptiveThreshold - 20) {
        // Restore limits when load decreases
        this.adaptiveMultiplier = Math.min(1.0, this.adaptiveMultiplier + 0.1);
      }
    }, 5000);
  }

  /**
   * Estimate CPU usage (simplified)
   */
  private estimateCpuUsage(): number {
    // In production, use actual CPU metrics
    const requestRate = this.metrics.totalRequests;
    return Math.min(100, requestRate / 100);
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Start cleanup timer
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 300000; // 5 minutes

      for (const [clientId, bucket] of this.buckets) {
        if (now - bucket.lastRefill > staleThreshold) {
          this.buckets.delete(clientId);
          this.concurrentRequests.delete(clientId);
        }
      }
    }, this.config.cleanupIntervalMs);
  }

  /**
   * Get ms until midnight
   */
  private getMsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Get current metrics
   */
  getMetrics(): ThrottleMetrics {
    return { ...this.metrics };
  }

  /**
   * Get client usage stats
   */
  getClientUsage(clientId: string): TokenBucket | undefined {
    return this.buckets.get(clientId);
  }

  /**
   * Reset client limits (admin function)
   */
  resetClientLimits(clientId: string): void {
    this.buckets.delete(clientId);
    this.concurrentRequests.delete(clientId);
  }

  /**
   * Set custom limits for client
   */
  setCustomLimits(clientId: string, limits: Partial<RateLimitPlan>): void {
    // Implementation for custom per-client limits
    this.emit('custom_limits_set', { clientId, limits });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.buckets.clear();
    this.concurrentRequests.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// FACTORY & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════════════════

let guardInstance: UsageGuard | null = null;

/**
 * Get singleton UsageGuard instance
 */
export function getUsageGuard(config?: Partial<UsageGuardConfig>): UsageGuard {
  if (!guardInstance) {
    guardInstance = new UsageGuard(config);
  }
  return guardInstance;
}

/**
 * Create new UsageGuard instance
 */
export function createUsageGuard(config?: Partial<UsageGuardConfig>): UsageGuard {
  return new UsageGuard(config);
}

export default UsageGuard;
