/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM CACHING SYSTEM                                                       ║
 * ║   "Multi-layer caching with TTL and LRU"                                      ║
 * ║                                                                               ║
 * ║   TODO B #13 - Caching                                                        ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ТИПОВЕ
// ═══════════════════════════════════════════════════════════════════════════════

export interface CacheEntry<T> {
    value: T;
    createdAt: number;
    expiresAt: number;
    lastAccessed: number;
    accessCount: number;
    size: number;
}

export interface CacheConfig {
    maxSize: number;           // Max entries
    maxMemory: number;         // Max memory in bytes
    defaultTTL: number;        // Default TTL in ms
    evictionPolicy: 'lru' | 'lfu' | 'fifo';
    onEvict?: (key: string, value: unknown) => void;
}

export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    memoryUsed: number;
    evictions: number;
    oldestEntry: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

export class Cache<T = unknown> {
    private entries: Map<string, CacheEntry<T>> = new Map();
    private config: CacheConfig;
    private stats = { hits: 0, misses: 0, evictions: 0 };
    private memoryUsed: number = 0;

    constructor(config: Partial<CacheConfig> = {}) {
        this.config = {
            maxSize: 1000,
            maxMemory: 50 * 1024 * 1024, // 50MB
            defaultTTL: 5 * 60 * 1000,   // 5 minutes
            evictionPolicy: 'lru',
            ...config
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ОСНОВНИ ОПЕРАЦИИ
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Set a value in cache
     */
    set(key: string, value: T, ttl?: number): void {
        // Remove existing entry if present
        if (this.entries.has(key)) {
            this.delete(key);
        }

        const size = this.estimateSize(value);
        const now = Date.now();
        const effectiveTTL = ttl ?? this.config.defaultTTL;

        // Ensure space is available
        this.ensureSpace(size);

        const entry: CacheEntry<T> = {
            value,
            createdAt: now,
            expiresAt: now + effectiveTTL,
            lastAccessed: now,
            accessCount: 0,
            size
        };

        this.entries.set(key, entry);
        this.memoryUsed += size;
    }

    /**
     * Get a value from cache
     */
    get(key: string): T | undefined {
        const entry = this.entries.get(key);
        
        if (!entry) {
            this.stats.misses++;
            return undefined;
        }

        // Check expiration
        if (Date.now() > entry.expiresAt) {
            this.delete(key);
            this.stats.misses++;
            return undefined;
        }

        // Update access metadata
        entry.lastAccessed = Date.now();
        entry.accessCount++;
        this.stats.hits++;

        return entry.value;
    }

    /**
     * Get or set with factory function
     */
    async getOrSet(key: string, factory: () => T | Promise<T>, ttl?: number): Promise<T> {
        const existing = this.get(key);
        if (existing !== undefined) {
            return existing;
        }

        const value = await factory();
        this.set(key, value, ttl);
        return value;
    }

    /**
     * Check if key exists
     */
    has(key: string): boolean {
        const entry = this.entries.get(key);
        if (!entry) return false;
        if (Date.now() > entry.expiresAt) {
            this.delete(key);
            return false;
        }
        return true;
    }

    /**
     * Delete a key
     */
    delete(key: string): boolean {
        const entry = this.entries.get(key);
        if (!entry) return false;

        this.memoryUsed -= entry.size;
        this.entries.delete(key);
        
        if (this.config.onEvict) {
            this.config.onEvict(key, entry.value);
        }

        return true;
    }

    /**
     * Clear all entries
     */
    clear(): void {
        this.entries.clear();
        this.memoryUsed = 0;
        this.stats = { hits: 0, misses: 0, evictions: 0 };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BULK OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get multiple keys
     */
    mget(keys: string[]): Map<string, T> {
        const result = new Map<string, T>();
        for (const key of keys) {
            const value = this.get(key);
            if (value !== undefined) {
                result.set(key, value);
            }
        }
        return result;
    }

    /**
     * Set multiple entries
     */
    mset(entries: { key: string; value: T; ttl?: number }[]): void {
        for (const entry of entries) {
            this.set(entry.key, entry.value, entry.ttl);
        }
    }

    /**
     * Delete multiple keys
     */
    mdelete(keys: string[]): number {
        let count = 0;
        for (const key of keys) {
            if (this.delete(key)) count++;
        }
        return count;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CACHE MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Remove expired entries
     */
    prune(): number {
        const now = Date.now();
        let pruned = 0;

        for (const [key, entry] of this.entries) {
            if (now > entry.expiresAt) {
                this.delete(key);
                pruned++;
            }
        }

        return pruned;
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const total = this.stats.hits + this.stats.misses;
        
        let oldestEntry = Infinity;
        for (const entry of this.entries.values()) {
            if (entry.createdAt < oldestEntry) {
                oldestEntry = entry.createdAt;
            }
        }

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: total > 0 ? this.stats.hits / total : 0,
            size: this.entries.size,
            memoryUsed: this.memoryUsed,
            evictions: this.stats.evictions,
            oldestEntry: oldestEntry === Infinity ? 0 : oldestEntry
        };
    }

    /**
     * Get all keys
     */
    keys(): string[] {
        return [...this.entries.keys()];
    }

    /**
     * Get size
     */
    get size(): number {
        return this.entries.size;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private ensureSpace(requiredSize: number): void {
        // Check size limit
        while (this.entries.size >= this.config.maxSize) {
            this.evictOne();
        }

        // Check memory limit
        while (this.memoryUsed + requiredSize > this.config.maxMemory && this.entries.size > 0) {
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
        if (this.entries.size === 0) return null;

        switch (this.config.evictionPolicy) {
            case 'lru':
                return this.selectLRU();
            case 'lfu':
                return this.selectLFU();
            case 'fifo':
                return this.selectFIFO();
            default:
                return this.selectLRU();
        }
    }

    private selectLRU(): string {
        let oldest = Infinity;
        let oldestKey = '';

        for (const [key, entry] of this.entries) {
            if (entry.lastAccessed < oldest) {
                oldest = entry.lastAccessed;
                oldestKey = key;
            }
        }

        return oldestKey;
    }

    private selectLFU(): string {
        let minAccess = Infinity;
        let minKey = '';

        for (const [key, entry] of this.entries) {
            if (entry.accessCount < minAccess) {
                minAccess = entry.accessCount;
                minKey = key;
            }
        }

        return minKey;
    }

    private selectFIFO(): string {
        let oldest = Infinity;
        let oldestKey = '';

        for (const [key, entry] of this.entries) {
            if (entry.createdAt < oldest) {
                oldest = entry.createdAt;
                oldestKey = key;
            }
        }

        return oldestKey;
    }

    private estimateSize(value: T): number {
        // Rough estimate - in production use sizeof or similar
        if (value === null || value === undefined) return 8;
        if (typeof value === 'boolean') return 4;
        if (typeof value === 'number') return 8;
        if (typeof value === 'string') return (value as string).length * 2;
        if (Array.isArray(value)) return JSON.stringify(value).length;
        if (typeof value === 'object') return JSON.stringify(value).length;
        return 64;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALIZED CACHES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Cache with namespace support
 */
export class NamespacedCache<T = unknown> {
    private cache: Cache<T>;
    private namespace: string;

    constructor(namespace: string, config?: Partial<CacheConfig>) {
        this.namespace = namespace;
        this.cache = new Cache<T>(config);
    }

    private key(key: string): string {
        return `${this.namespace}:${key}`;
    }

    set(key: string, value: T, ttl?: number): void {
        this.cache.set(this.key(key), value, ttl);
    }

    get(key: string): T | undefined {
        return this.cache.get(this.key(key));
    }

    has(key: string): boolean {
        return this.cache.has(this.key(key));
    }

    delete(key: string): boolean {
        return this.cache.delete(this.key(key));
    }

    clear(): void {
        // Only clear keys in this namespace
        for (const key of this.cache.keys()) {
            if (key.startsWith(this.namespace + ':')) {
                this.cache.delete(key);
            }
        }
    }
}

/**
 * Memoization decorator using cache
 */
export function Memoize(ttl?: number) {
    const cache = new Cache<unknown>();

    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const key = `${propertyKey}:${JSON.stringify(args)}`;
            
            return cache.getOrSet(key, () => originalMethod.apply(this, args), ttl);
        };

        return descriptor;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL CACHE REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

export class CacheRegistry {
    private static instance: CacheRegistry;
    private caches: Map<string, Cache> = new Map();

    private constructor() {}

    static getInstance(): CacheRegistry {
        if (!CacheRegistry.instance) {
            CacheRegistry.instance = new CacheRegistry();
        }
        return CacheRegistry.instance;
    }

    /**
     * Get or create a named cache
     */
    getCache<T>(name: string, config?: Partial<CacheConfig>): Cache<T> {
        if (!this.caches.has(name)) {
            this.caches.set(name, new Cache<T>(config));
        }
        return this.caches.get(name) as Cache<T>;
    }

    /**
     * Clear all caches
     */
    clearAll(): void {
        for (const cache of this.caches.values()) {
            cache.clear();
        }
    }

    /**
     * Get stats for all caches
     */
    getAllStats(): Record<string, CacheStats> {
        const stats: Record<string, CacheStats> = {};
        for (const [name, cache] of this.caches) {
            stats[name] = cache.getStats();
        }
        return stats;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getCache = <T>(name: string, config?: Partial<CacheConfig>): Cache<T> => {
    return CacheRegistry.getInstance().getCache<T>(name, config);
};

export default Cache;
