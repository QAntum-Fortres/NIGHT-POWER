/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM CACHE STORAGE                                                        ║
 * ║   "High-performance caching with multiple backends"                           ║
 * ║                                                                               ║
 * ║   TODO B #32 - Storage: Cache Operations                                      ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CacheEntry<T = any> {
    value: T;
    createdAt: number;
    expiresAt?: number;
    hits: number;
    lastAccess: number;
    tags: string[];
    size: number;
}

export interface CacheOptions {
    defaultTTL?: number;
    maxEntries?: number;
    maxSize?: number;
    onEvict?: (key: string, value: any) => void;
    evictionPolicy?: 'LRU' | 'LFU' | 'FIFO' | 'TTL';
}

export interface CacheStats {
    hits: number;
    misses: number;
    entries: number;
    size: number;
    hitRate: number;
    evictions: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

export class CacheStorage<T = any> {
    private cache = new Map<string, CacheEntry<T>>();
    private options: Required<CacheOptions>;
    private stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        totalSize: 0
    };

    constructor(options: CacheOptions = {}) {
        this.options = {
            defaultTTL: options.defaultTTL || 0,
            maxEntries: options.maxEntries || 10000,
            maxSize: options.maxSize || 100 * 1024 * 1024, // 100MB
            onEvict: options.onEvict || (() => {}),
            evictionPolicy: options.evictionPolicy || 'LRU'
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BASIC OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get value from cache
     */
    get(key: string): T | undefined {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return undefined;
        }

        // Check expiration
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.delete(key);
            this.stats.misses++;
            return undefined;
        }

        // Update stats
        entry.hits++;
        entry.lastAccess = Date.now();
        this.stats.hits++;

        return entry.value;
    }

    /**
     * Set value in cache
     */
    set(key: string, value: T, ttl?: number, tags: string[] = []): void {
        // Estimate size
        const size = this.estimateSize(value);

        // Check if we need to evict
        this.ensureCapacity(size);

        const now = Date.now();
        const actualTTL = ttl !== undefined ? ttl : this.options.defaultTTL;

        this.cache.set(key, {
            value,
            createdAt: now,
            expiresAt: actualTTL > 0 ? now + actualTTL : undefined,
            hits: 0,
            lastAccess: now,
            tags,
            size
        });

        this.stats.totalSize += size;
    }

    /**
     * Check if key exists
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Delete key
     */
    delete(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        this.stats.totalSize -= entry.size;
        this.options.onEvict(key, entry.value);
        return this.cache.delete(key);
    }

    /**
     * Clear cache
     */
    clear(): void {
        for (const [key, entry] of this.cache) {
            this.options.onEvict(key, entry.value);
        }
        this.cache.clear();
        this.stats.totalSize = 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADVANCED OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get or set with callback
     */
    async getOrSet(key: string, factory: () => T | Promise<T>, ttl?: number): Promise<T> {
        const cached = this.get(key);
        if (cached !== undefined) return cached;

        const value = await factory();
        this.set(key, value, ttl);
        return value;
    }

    /**
     * Get multiple values
     */
    getMany(keys: string[]): Map<string, T | undefined> {
        const result = new Map<string, T | undefined>();
        for (const key of keys) {
            result.set(key, this.get(key));
        }
        return result;
    }

    /**
     * Set multiple values
     */
    setMany(entries: Map<string, T>, ttl?: number): void {
        for (const [key, value] of entries) {
            this.set(key, value, ttl);
        }
    }

    /**
     * Delete by tags
     */
    deleteByTags(tags: string[]): number {
        let deleted = 0;
        const tagsSet = new Set(tags);

        for (const [key, entry] of this.cache) {
            if (entry.tags.some(t => tagsSet.has(t))) {
                this.delete(key);
                deleted++;
            }
        }

        return deleted;
    }

    /**
     * Get entries by tags
     */
    getByTags(tags: string[]): Map<string, T> {
        const result = new Map<string, T>();
        const tagsSet = new Set(tags);

        for (const [key, entry] of this.cache) {
            if (entry.tags.some(t => tagsSet.has(t))) {
                const value = this.get(key);
                if (value !== undefined) {
                    result.set(key, value);
                }
            }
        }

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EVICTION
    // ─────────────────────────────────────────────────────────────────────────

    private ensureCapacity(additionalSize: number): void {
        // Check entry limit
        while (this.cache.size >= this.options.maxEntries) {
            this.evictOne();
        }

        // Check size limit
        while (this.stats.totalSize + additionalSize > this.options.maxSize && this.cache.size > 0) {
            this.evictOne();
        }
    }

    private evictOne(): void {
        const keyToEvict = this.selectEvictionCandidate();
        if (keyToEvict) {
            this.delete(keyToEvict);
            this.stats.evictions++;
        }
    }

    private selectEvictionCandidate(): string | null {
        if (this.cache.size === 0) return null;

        let candidate: string | null = null;
        let candidateScore = Infinity;

        switch (this.options.evictionPolicy) {
            case 'LRU':
                // Least Recently Used
                for (const [key, entry] of this.cache) {
                    if (entry.lastAccess < candidateScore) {
                        candidateScore = entry.lastAccess;
                        candidate = key;
                    }
                }
                break;

            case 'LFU':
                // Least Frequently Used
                for (const [key, entry] of this.cache) {
                    if (entry.hits < candidateScore) {
                        candidateScore = entry.hits;
                        candidate = key;
                    }
                }
                break;

            case 'FIFO':
                // First In First Out
                for (const [key, entry] of this.cache) {
                    if (entry.createdAt < candidateScore) {
                        candidateScore = entry.createdAt;
                        candidate = key;
                    }
                }
                break;

            case 'TTL':
                // Shortest TTL first
                const now = Date.now();
                for (const [key, entry] of this.cache) {
                    const ttl = entry.expiresAt ? entry.expiresAt - now : Infinity;
                    if (ttl < candidateScore) {
                        candidateScore = ttl;
                        candidate = key;
                    }
                }
                break;
        }

        return candidate;
    }

    /**
     * Cleanup expired entries
     */
    cleanup(): number {
        let cleaned = 0;
        const now = Date.now();

        for (const [key, entry] of this.cache) {
            if (entry.expiresAt && now > entry.expiresAt) {
                this.delete(key);
                cleaned++;
            }
        }

        return cleaned;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATS & INFO
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const total = this.stats.hits + this.stats.misses;
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            entries: this.cache.size,
            size: this.stats.totalSize,
            hitRate: total > 0 ? this.stats.hits / total : 0,
            evictions: this.stats.evictions
        };
    }

    /**
     * Get size
     */
    get size(): number {
        return this.cache.size;
    }

    /**
     * Get all keys
     */
    keys(): string[] {
        return [...this.cache.keys()];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private estimateSize(value: any): number {
        if (typeof value === 'string') {
            return value.length * 2;
        }
        if (typeof value === 'number') {
            return 8;
        }
        if (typeof value === 'boolean') {
            return 4;
        }
        if (value === null || value === undefined) {
            return 0;
        }
        if (Buffer.isBuffer(value)) {
            return value.length;
        }
        // Estimate object size
        return JSON.stringify(value).length * 2;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMOIZATION
// ═══════════════════════════════════════════════════════════════════════════════

export function memoize<T extends (...args: any[]) => any>(
    fn: T,
    options: {
        ttl?: number;
        maxSize?: number;
        keyGenerator?: (...args: Parameters<T>) => string;
    } = {}
): T {
    const cache = new CacheStorage({
        defaultTTL: options.ttl,
        maxEntries: options.maxSize || 1000
    });

    const keyGen = options.keyGenerator || ((...args: any[]) => JSON.stringify(args));

    return ((...args: Parameters<T>): ReturnType<T> => {
        const key = keyGen(...args);
        const cached = cache.get(key);
        if (cached !== undefined) return cached;

        const result = fn(...args);
        cache.set(key, result);
        return result;
    }) as T;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════════

const methodCaches = new Map<string, CacheStorage>();

/**
 * Cache method results
 */
export function Cached(options: { ttl?: number; maxSize?: number } = {}): MethodDecorator {
    return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const cacheKey = `${target.constructor.name}.${String(propertyKey)}`;

        if (!methodCaches.has(cacheKey)) {
            methodCaches.set(cacheKey, new CacheStorage({
                defaultTTL: options.ttl,
                maxEntries: options.maxSize || 1000
            }));
        }

        descriptor.value = function(...args: any[]) {
            const cache = methodCaches.get(cacheKey)!;
            const key = JSON.stringify(args);
            const cached = cache.get(key);
            if (cached !== undefined) return cached;

            const result = originalMethod.apply(this, args);
            cache.set(key, result);
            return result;
        };

        return descriptor;
    };
}

/**
 * Clear cache decorator
 */
export function ClearCache(cacheKey: string): MethodDecorator {
    return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = function(...args: any[]) {
            const fullKey = `${target.constructor.name}.${cacheKey}`;
            const cache = methodCaches.get(fullKey);
            if (cache) cache.clear();

            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const createCache = <T = any>(options?: CacheOptions): CacheStorage<T> => {
    return new CacheStorage<T>(options);
};

export default CacheStorage;
