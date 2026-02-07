/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM STORAGE MODULE                                                       ║
 * ║   "Unified storage facade - KV, File, Cache"                                  ║
 * ║                                                                               ║
 * ║   TODO B #30-32 - Storage: Complete Module                                    ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// RE-EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
    KeyValueStore,
    StoreEntry,
    getKVStore,
    kv
} from './kv-store';

export {
    FileStorage,
    FileInfo,
    DirectoryInfo,
    WriteOptions,
    ReadOptions,
    getFileStorage,
    file
} from './file-storage';

export {
    CacheStorage,
    CacheEntry,
    CacheOptions,
    CacheStats,
    createCache,
    memoize,
    Cached,
    ClearCache
} from './cache';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED STORAGE
// ═══════════════════════════════════════════════════════════════════════════════

import { KeyValueStore, getKVStore } from './kv-store';
import { FileStorage, getFileStorage } from './file-storage';
import { CacheStorage, createCache } from './cache';

export interface StorageConfig {
    kvOptions?: {
        prefix?: string;
    };
    fileOptions?: {
        basePath?: string;
    };
    cacheOptions?: {
        defaultTTL?: number;
        maxEntries?: number;
        maxSize?: number;
    };
}

/**
 * Unified QAntum Storage
 */
export class QAntumStorage {
    private static instance: QAntumStorage;
    
    private _kv: KeyValueStore;
    private _file: FileStorage;
    private _cache: CacheStorage;
    private namedCaches = new Map<string, CacheStorage>();

    private constructor(config: StorageConfig = {}) {
        this._kv = getKVStore();
        this._file = getFileStorage();
        
        if (config.fileOptions?.basePath) {
            this._file.setBasePath(config.fileOptions.basePath);
        }

        this._cache = createCache(config.cacheOptions);
    }

    static getInstance(config?: StorageConfig): QAntumStorage {
        if (!QAntumStorage.instance) {
            QAntumStorage.instance = new QAntumStorage(config);
        }
        return QAntumStorage.instance;
    }

    static configure(config: StorageConfig): QAntumStorage {
        QAntumStorage.instance = new QAntumStorage(config);
        return QAntumStorage.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STORAGE ACCESSORS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get Key-Value store
     */
    get kv(): KeyValueStore {
        return this._kv;
    }

    /**
     * Get File storage
     */
    get file(): FileStorage {
        return this._file;
    }

    /**
     * Get default cache
     */
    get cache(): CacheStorage {
        return this._cache;
    }

    /**
     * Get or create named cache
     */
    getCache(name: string, options?: { ttl?: number; maxSize?: number }): CacheStorage {
        if (!this.namedCaches.has(name)) {
            this.namedCaches.set(name, createCache({
                defaultTTL: options?.ttl,
                maxEntries: options?.maxSize
            }));
        }
        return this.namedCaches.get(name)!;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUICK METHODS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Store value (auto-detect best storage)
     */
    async store(key: string, value: any, options?: {
        persist?: boolean;
        ttl?: number;
    }): Promise<void> {
        if (options?.persist) {
            // Store to file
            await this._file.writeJSON(`data/${key}.json`, value);
        } else if (options?.ttl) {
            // Store to cache with TTL
            this._cache.set(key, value, options.ttl);
        } else {
            // Store to KV
            this._kv.set(key, value);
        }
    }

    /**
     * Retrieve value (check all storages)
     */
    async retrieve<T>(key: string): Promise<T | undefined> {
        // Check cache first
        const cached = this._cache.get(key);
        if (cached !== undefined) return cached as T;

        // Check KV
        const kvValue = this._kv.get<T>(key);
        if (kvValue !== undefined) return kvValue;

        // Check file
        try {
            const filePath = `data/${key}.json`;
            if (await this._file.exists(filePath)) {
                return await this._file.readJSON<T>(filePath);
            }
        } catch {
            // File doesn't exist
        }

        return undefined;
    }

    /**
     * Remove value from all storages
     */
    async remove(key: string): Promise<void> {
        this._cache.delete(key);
        this._kv.delete(key);
        
        try {
            const filePath = `data/${key}.json`;
            if (await this._file.exists(filePath)) {
                await this._file.delete(filePath);
            }
        } catch {
            // Ignore file errors
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CLEANUP
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Clear all storages
     */
    async clearAll(): Promise<void> {
        this._cache.clear();
        this._kv.clear();
        
        for (const cache of this.namedCaches.values()) {
            cache.clear();
        }
    }

    /**
     * Cleanup expired entries
     */
    cleanup(): number {
        let cleaned = 0;
        cleaned += this._cache.cleanup();
        cleaned += this._kv.cleanup();
        
        for (const cache of this.namedCaches.values()) {
            cleaned += cache.cleanup();
        }

        return cleaned;
    }

    /**
     * Get combined statistics
     */
    getStats(): {
        kv: { size: number };
        cache: { hits: number; misses: number; size: number; hitRate: number };
        file: { basePath: string };
        namedCaches: string[];
    } {
        return {
            kv: this._kv.getStats(),
            cache: this._cache.getStats(),
            file: { basePath: this._file.getBasePath() },
            namedCaches: [...this.namedCaches.keys()]
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getStorage = (): QAntumStorage => QAntumStorage.getInstance();
export const configureStorage = (config: StorageConfig): QAntumStorage => 
    QAntumStorage.configure(config);

// Quick storage operations
export const storage = {
    store: (key: string, value: any, options?: { persist?: boolean; ttl?: number }) => 
        QAntumStorage.getInstance().store(key, value, options),
    retrieve: <T>(key: string) => QAntumStorage.getInstance().retrieve<T>(key),
    remove: (key: string) => QAntumStorage.getInstance().remove(key),
    kv: () => QAntumStorage.getInstance().kv,
    file: () => QAntumStorage.getInstance().file,
    cache: () => QAntumStorage.getInstance().cache,
    namedCache: (name: string, options?: { ttl?: number; maxSize?: number }) => 
        QAntumStorage.getInstance().getCache(name, options)
};

export default QAntumStorage;
