/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM LAZY LOADER                                                          ║
 * ║   "On-demand module loading for better startup"                               ║
 * ║                                                                               ║
 * ║   TODO B #12 - Lazy Loading                                                   ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ТИПОВЕ
// ═══════════════════════════════════════════════════════════════════════════════

export type ModuleLoader<T> = () => Promise<T>;
export type ModuleFactory<T, R> = (module: T) => R;

export interface LazyModule<T> {
    isLoaded: boolean;
    load(): Promise<T>;
    get(): T | undefined;
    getOrLoad(): Promise<T>;
    reset(): void;
}

export interface LazyLoaderConfig {
    preloadOnIdle: boolean;
    retryOnError: boolean;
    maxRetries: number;
    retryDelay: number;
    timeout: number;
}

export interface LoadStats {
    moduleName: string;
    loadTime: number;
    loadedAt: string;
    retries: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAZY MODULE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

class LazyModuleImpl<T> implements LazyModule<T> {
    private module: T | undefined;
    private loading: Promise<T> | null = null;
    private config: LazyLoaderConfig;
    private retryCount: number = 0;
    private loadStartTime: number = 0;

    constructor(
        private name: string,
        private loader: ModuleLoader<T>,
        config: Partial<LazyLoaderConfig> = {}
    ) {
        this.config = {
            preloadOnIdle: false,
            retryOnError: true,
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 30000,
            ...config
        };

        if (this.config.preloadOnIdle) {
            this.schedulePreload();
        }
    }

    get isLoaded(): boolean {
        return this.module !== undefined;
    }

    async load(): Promise<T> {
        // Return cached if already loaded
        if (this.module !== undefined) {
            return this.module;
        }

        // Return existing loading promise if in progress
        if (this.loading) {
            return this.loading;
        }

        // Start loading
        this.loadStartTime = Date.now();
        this.loading = this.executeLoad();

        try {
            this.module = await this.loading;
            const loadTime = Date.now() - this.loadStartTime;
            console.log(`[LazyLoader] "${this.name}" loaded in ${loadTime}ms`);
            return this.module;
        } finally {
            this.loading = null;
        }
    }

    get(): T | undefined {
        return this.module;
    }

    async getOrLoad(): Promise<T> {
        return this.module !== undefined ? this.module : this.load();
    }

    reset(): void {
        this.module = undefined;
        this.loading = null;
        this.retryCount = 0;
    }

    private async executeLoad(): Promise<T> {
        while (this.retryCount <= this.config.maxRetries) {
            try {
                return await this.loadWithTimeout();
            } catch (error) {
                this.retryCount++;
                
                if (!this.config.retryOnError || this.retryCount > this.config.maxRetries) {
                    throw error;
                }

                console.warn(
                    `[LazyLoader] "${this.name}" load failed, retry ${this.retryCount}/${this.config.maxRetries}`
                );
                
                await this.delay(this.config.retryDelay * this.retryCount);
            }
        }

        throw new Error(`Failed to load module "${this.name}" after ${this.config.maxRetries} retries`);
    }

    private async loadWithTimeout(): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Module "${this.name}" load timed out after ${this.config.timeout}ms`));
            }, this.config.timeout);

            this.loader()
                .then(module => {
                    clearTimeout(timer);
                    resolve(module);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    private schedulePreload(): void {
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => this.load().catch(() => {}));
        } else {
            setTimeout(() => this.load().catch(() => {}), 100);
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAZY LOADER MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class LazyLoader {
    private static instance: LazyLoader;
    private modules: Map<string, LazyModule<unknown>> = new Map();
    private stats: LoadStats[] = [];

    private constructor() {}

    static getInstance(): LazyLoader {
        if (!LazyLoader.instance) {
            LazyLoader.instance = new LazyLoader();
        }
        return LazyLoader.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REGISTRATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Register a lazy module
     */
    register<T>(
        name: string,
        loader: ModuleLoader<T>,
        config?: Partial<LazyLoaderConfig>
    ): LazyModule<T> {
        const lazyModule = new LazyModuleImpl<T>(name, loader, config);
        this.modules.set(name, lazyModule as LazyModule<unknown>);
        return lazyModule;
    }

    /**
     * Get a registered module
     */
    get<T>(name: string): LazyModule<T> | undefined {
        return this.modules.get(name) as LazyModule<T> | undefined;
    }

    /**
     * Load a module by name
     */
    async load<T>(name: string): Promise<T> {
        const module = this.get<T>(name);
        if (!module) {
            throw new Error(`Module "${name}" not registered`);
        }
        const startTime = Date.now();
        const result = await module.load();
        
        this.stats.push({
            moduleName: name,
            loadTime: Date.now() - startTime,
            loadedAt: new Date().toISOString(),
            retries: 0
        });

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRELOADING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Preload specific modules
     */
    async preload(names: string[]): Promise<void> {
        const promises = names.map(name => this.load(name).catch(() => {}));
        await Promise.all(promises);
    }

    /**
     * Preload all registered modules
     */
    async preloadAll(): Promise<void> {
        const names = [...this.modules.keys()];
        await this.preload(names);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATUS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get loading statistics
     */
    getStats(): LoadStats[] {
        return [...this.stats];
    }

    /**
     * Check if a module is loaded
     */
    isLoaded(name: string): boolean {
        return this.modules.get(name)?.isLoaded ?? false;
    }

    /**
     * Get all module names
     */
    listModules(): string[] {
        return [...this.modules.keys()];
    }

    /**
     * Clear all modules
     */
    clear(): void {
        this.modules.clear();
        this.stats = [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a lazy function that only executes on first call
 */
export function lazyFn<T>(fn: () => T): () => T {
    let result: T;
    let executed = false;

    return () => {
        if (!executed) {
            result = fn();
            executed = true;
        }
        return result;
    };
}

/**
 * Create a lazy async function
 */
export function lazyAsync<T>(fn: () => Promise<T>): () => Promise<T> {
    let result: T;
    let promise: Promise<T> | null = null;

    return async () => {
        if (result !== undefined) {
            return result;
        }
        if (promise) {
            return promise;
        }
        promise = fn().then(r => {
            result = r;
            return r;
        });
        return promise;
    };
}

/**
 * Create a lazy property descriptor
 */
export function LazyProperty<T>(initializer: () => T): PropertyDecorator {
    return (target: any, propertyKey: string | symbol) => {
        const key = Symbol(`__lazy_${String(propertyKey)}`);
        
        Object.defineProperty(target, propertyKey, {
            get() {
                if (!(key in this)) {
                    (this as any)[key] = initializer.call(this);
                }
                return (this as any)[key];
            },
            configurable: true,
            enumerable: true
        });
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDEFINED LAZY MODULES FOR QANTUM
// ═══════════════════════════════════════════════════════════════════════════════

export const QAntumModules = {
    // Cognition modules (heavy, load on demand)
    registerCognitionModules(loader: LazyLoader): void {
        loader.register('cognition/thought-chain', async () => {
            const { ThoughtChain } = await import('../cognition/thought-chain');
            return ThoughtChain;
        });

        loader.register('cognition/self-critique', async () => {
            const { SelfCritique } = await import('../cognition/self-critique');
            return SelfCritique;
        });

        loader.register('cognition/inference-engine', async () => {
            const { LogicalInferenceEngine } = await import('../cognition/inference-engine');
            return LogicalInferenceEngine;
        });

        loader.register('cognition/semantic-memory', async () => {
            const { SemanticMemoryBank } = await import('../cognition/semantic-memory');
            return SemanticMemoryBank;
        });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getLazyLoader = (): LazyLoader => LazyLoader.getInstance();

export default LazyLoader;
