/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM KEY-VALUE STORE                                                      ║
 * ║   "Fast and flexible key-value storage"                                       ║
 * ║                                                                               ║
 * ║   TODO B #30 - Storage: Key-Value Store                                       ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface StoreEntry<T = any> {
    value: T;
    createdAt: number;
    updatedAt: number;
    expiresAt?: number;
    tags?: string[];
    metadata?: Record<string, any>;
}

export interface StoreConfig {
    maxSize?: number;
    defaultTTL?: number;
    cleanupInterval?: number;
    serializer?: (value: any) => string;
    deserializer?: (data: string) => any;
}

export interface StoreStats {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    expired: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// KEY-VALUE STORE
// ═══════════════════════════════════════════════════════════════════════════════

export class KeyValueStore<T = any> {
    private data: Map<string, StoreEntry<T>> = new Map();
    private config: StoreConfig;
    private cleanupTimer?: ReturnType<typeof setInterval>;
    private stats = { hits: 0, misses: 0, expired: 0 };

    constructor(config: StoreConfig = {}) {
        this.config = {
            maxSize: config.maxSize || 10000,
            defaultTTL: config.defaultTTL,
            cleanupInterval: config.cleanupInterval || 60000,
            serializer: config.serializer || JSON.stringify,
            deserializer: config.deserializer || JSON.parse
        };

        if (this.config.cleanupInterval) {
            this.startCleanup();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BASIC OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Set value
     */
    set(key: string, value: T, options: { ttl?: number; tags?: string[]; metadata?: Record<string, any> } = {}): this {
        const now = Date.now();

        // Evict if at capacity
        if (this.data.size >= this.config.maxSize! && !this.data.has(key)) {
            this.evictOldest();
        }

        const ttl = options.ttl ?? this.config.defaultTTL;

        this.data.set(key, {
            value,
            createdAt: now,
            updatedAt: now,
            expiresAt: ttl ? now + ttl : undefined,
            tags: options.tags,
            metadata: options.metadata
        });

        return this;
    }

    /**
     * Get value
     */
    get(key: string): T | undefined {
        const entry = this.data.get(key);

        if (!entry) {
            this.stats.misses++;
            return undefined;
        }

        // Check expiration
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.data.delete(key);
            this.stats.misses++;
            this.stats.expired++;
            return undefined;
        }

        this.stats.hits++;
        return entry.value;
    }

    /**
     * Get with default
     */
    getOrDefault(key: string, defaultValue: T): T {
        const value = this.get(key);
        return value !== undefined ? value : defaultValue;
    }

    /**
     * Get or set
     */
    getOrSet(key: string, factory: () => T, options?: { ttl?: number; tags?: string[] }): T {
        const existing = this.get(key);
        if (existing !== undefined) {
            return existing;
        }

        const value = factory();
        this.set(key, value, options);
        return value;
    }

    /**
     * Check if key exists
     */
    has(key: string): boolean {
        const entry = this.data.get(key);
        if (!entry) return false;
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.data.delete(key);
            return false;
        }
        return true;
    }

    /**
     * Delete key
     */
    delete(key: string): boolean {
        return this.data.delete(key);
    }

    /**
     * Clear all data
     */
    clear(): void {
        this.data.clear();
        this.stats = { hits: 0, misses: 0, expired: 0 };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BULK OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Set multiple values
     */
    setMany(entries: Array<{ key: string; value: T; ttl?: number; tags?: string[] }>): this {
        for (const entry of entries) {
            this.set(entry.key, entry.value, { ttl: entry.ttl, tags: entry.tags });
        }
        return this;
    }

    /**
     * Get multiple values
     */
    getMany(keys: string[]): Map<string, T | undefined> {
        const results = new Map<string, T | undefined>();
        for (const key of keys) {
            results.set(key, this.get(key));
        }
        return results;
    }

    /**
     * Delete multiple keys
     */
    deleteMany(keys: string[]): number {
        let count = 0;
        for (const key of keys) {
            if (this.delete(key)) count++;
        }
        return count;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TAG OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get keys by tag
     */
    getByTag(tag: string): Map<string, T> {
        const results = new Map<string, T>();
        const now = Date.now();

        for (const [key, entry] of this.data) {
            if (entry.tags?.includes(tag)) {
                if (!entry.expiresAt || entry.expiresAt > now) {
                    results.set(key, entry.value);
                }
            }
        }

        return results;
    }

    /**
     * Delete by tag
     */
    deleteByTag(tag: string): number {
        let count = 0;

        for (const [key, entry] of this.data) {
            if (entry.tags?.includes(tag)) {
                this.data.delete(key);
                count++;
            }
        }

        return count;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXPIRATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Set TTL for key
     */
    setTTL(key: string, ttl: number): boolean {
        const entry = this.data.get(key);
        if (!entry) return false;

        entry.expiresAt = Date.now() + ttl;
        return true;
    }

    /**
     * Get remaining TTL
     */
    getTTL(key: string): number | undefined {
        const entry = this.data.get(key);
        if (!entry || !entry.expiresAt) return undefined;

        const remaining = entry.expiresAt - Date.now();
        return remaining > 0 ? remaining : 0;
    }

    /**
     * Remove expiration
     */
    persist(key: string): boolean {
        const entry = this.data.get(key);
        if (!entry) return false;

        delete entry.expiresAt;
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ITERATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get all keys
     */
    keys(): string[] {
        return Array.from(this.data.keys());
    }

    /**
     * Get all values
     */
    values(): T[] {
        const now = Date.now();
        const results: T[] = [];

        for (const entry of this.data.values()) {
            if (!entry.expiresAt || entry.expiresAt > now) {
                results.push(entry.value);
            }
        }

        return results;
    }

    /**
     * Get all entries
     */
    entries(): Array<[string, T]> {
        const now = Date.now();
        const results: Array<[string, T]> = [];

        for (const [key, entry] of this.data) {
            if (!entry.expiresAt || entry.expiresAt > now) {
                results.push([key, entry.value]);
            }
        }

        return results;
    }

    /**
     * Iterate over entries
     */
    forEach(callback: (value: T, key: string) => void): void {
        const now = Date.now();

        for (const [key, entry] of this.data) {
            if (!entry.expiresAt || entry.expiresAt > now) {
                callback(entry.value, key);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SEARCH
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Find by predicate
     */
    find(predicate: (value: T, key: string) => boolean): T | undefined {
        const now = Date.now();

        for (const [key, entry] of this.data) {
            if (!entry.expiresAt || entry.expiresAt > now) {
                if (predicate(entry.value, key)) {
                    return entry.value;
                }
            }
        }

        return undefined;
    }

    /**
     * Filter by predicate
     */
    filter(predicate: (value: T, key: string) => boolean): Map<string, T> {
        const now = Date.now();
        const results = new Map<string, T>();

        for (const [key, entry] of this.data) {
            if (!entry.expiresAt || entry.expiresAt > now) {
                if (predicate(entry.value, key)) {
                    results.set(key, entry.value);
                }
            }
        }

        return results;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MAINTENANCE
    // ─────────────────────────────────────────────────────────────────────────

    private startCleanup(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
    }

    /**
     * Clean up expired entries
     */
    cleanup(): number {
        const now = Date.now();
        let count = 0;

        for (const [key, entry] of this.data) {
            if (entry.expiresAt && entry.expiresAt < now) {
                this.data.delete(key);
                count++;
            }
        }

        this.stats.expired += count;
        return count;
    }

    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.data) {
            if (entry.updatedAt < oldestTime) {
                oldestTime = entry.updatedAt;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.data.delete(oldestKey);
        }
    }

    /**
     * Destroy store
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.data.clear();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATISTICS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get store statistics
     */
    getStats(): StoreStats {
        const total = this.stats.hits + this.stats.misses;
        return {
            size: this.data.size,
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: total > 0 ? this.stats.hits / total : 0,
            expired: this.stats.expired
        };
    }

    /**
     * Get size
     */
    get size(): number {
        return this.data.size;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const createStore = <T>(config?: StoreConfig): KeyValueStore<T> => 
    new KeyValueStore<T>(config);

export default KeyValueStore;
