/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM API MODULE                                                           ║
 * ║   "Rate Limiting & Versioning"                                                ║
 * ║                                                                               ║
 * ║   TODO B #44-45 - API Complete                                                ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════════

export {
    RateLimiter,
    TokenBucket,
    SlidingWindowCounter,
    RateLimitPresets,
    RateLimitError,
    RateLimit,
    ThrottleMethod,
    createRateLimiter,
    createTokenBucket,
    type RateLimitConfig,
    type RateLimitResult,
    type RateLimitInfo,
    type RateLimiterConfig,
    type RateLimitStrategy
} from './rate-limiter';

// ═══════════════════════════════════════════════════════════════════════════════
// VERSIONING
// ═══════════════════════════════════════════════════════════════════════════════

export {
    APIVersionManager,
    VersionParser,
    MigrationManager,
    Version,
    Deprecated,
    Since,
    createVersionManager,
    createMigrationManager,
    type SemanticVersion,
    type VersionedRoute,
    type VersionConfig,
    type VersionNegotiationResult,
    type Migration,
    type DeprecationInfo
} from './versioning';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED API CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

import { RateLimiter, RateLimitPresets } from './rate-limiter';
import { APIVersionManager, VersionParser } from './versioning';

export interface APIClientConfig {
    baseUrl: string;
    version?: string;
    rateLimit?: {
        maxRequests: number;
        windowMs: number;
    };
    timeout?: number;
    headers?: Record<string, string>;
}

/**
 * Unified API Client with versioning and rate limiting
 */
export class APIClient {
    private config: APIClientConfig;
    private rateLimiter: RateLimiter;
    private versionManager: APIVersionManager;

    constructor(config: APIClientConfig) {
        this.config = {
            version: '1.0.0',
            timeout: 30000,
            ...config
        };

        this.rateLimiter = config.rateLimit
            ? new RateLimiter({
                strategy: 'sliding-window',
                windowMs: config.rateLimit.windowMs,
                maxRequests: config.rateLimit.maxRequests
            })
            : RateLimitPresets.api();

        this.versionManager = new APIVersionManager({
            defaultVersion: this.config.version,
            supportedVersions: [this.config.version!]
        });
    }

    /**
     * Make a request
     */
    async request<T>(
        method: string,
        path: string,
        options: {
            body?: any;
            headers?: Record<string, string>;
            query?: Record<string, string>;
        } = {}
    ): Promise<T> {
        // Check rate limit
        const rateLimitResult = this.rateLimiter.check(path);
        if (!rateLimitResult.allowed) {
            throw new Error(
                `Rate limit exceeded. Retry after ${rateLimitResult.retryAfter}s`
            );
        }

        // Build URL
        const url = this.buildUrl(path, options.query);

        // Build headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-API-Version': this.config.version!,
            ...this.config.headers,
            ...options.headers
        };

        // Make request (placeholder - would use fetch/axios in real impl)
        const response = await this.makeRequest(method, url, {
            headers,
            body: options.body
        });

        return response as T;
    }

    /**
     * GET request
     */
    get<T>(path: string, query?: Record<string, string>): Promise<T> {
        return this.request('GET', path, { query });
    }

    /**
     * POST request
     */
    post<T>(path: string, body?: any): Promise<T> {
        return this.request('POST', path, { body });
    }

    /**
     * PUT request
     */
    put<T>(path: string, body?: any): Promise<T> {
        return this.request('PUT', path, { body });
    }

    /**
     * DELETE request
     */
    delete<T>(path: string): Promise<T> {
        return this.request('DELETE', path);
    }

    /**
     * Set API version
     */
    setVersion(version: string): this {
        this.config.version = version;
        return this;
    }

    /**
     * Get current version
     */
    getVersion(): string {
        return this.config.version!;
    }

    /**
     * Get rate limit info
     */
    getRateLimitInfo(path: string = 'default'): any {
        return this.rateLimiter.getInfo(path);
    }

    private buildUrl(path: string, query?: Record<string, string>): string {
        let url = `${this.config.baseUrl}${path}`;
        
        if (query) {
            const params = new URLSearchParams(query);
            url += `?${params.toString()}`;
        }
        
        return url;
    }

    private async makeRequest(
        method: string,
        url: string,
        options: any
    ): Promise<any> {
        // This is a placeholder - in real implementation would use fetch
        console.log(`[APIClient] ${method} ${url}`);
        return { success: true };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export function createAPIClient(config: APIClientConfig): APIClient {
    return new APIClient(config);
}

export default {
    APIClient,
    RateLimiter,
    APIVersionManager,
    VersionParser,
    RateLimitPresets
};
