/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM RESOURCE POOL                                                        ║
 * ║   "Efficient resource management and pooling"                                 ║
 * ║                                                                               ║
 * ║   TODO B #21 - Performance: Resource Pooling                                  ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from '../core/event-emitter.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PoolConfig {
    minSize: number;
    maxSize: number;
    acquireTimeout: number;
    idleTimeout: number;
    maxWaitingClients: number;
    evictionInterval: number;
    validateOnBorrow?: boolean;
    validateOnReturn?: boolean;
}

export interface ResourceFactory<T> {
    create(): Promise<T>;
    destroy(resource: T): Promise<void>;
    validate?(resource: T): Promise<boolean>;
    reset?(resource: T): Promise<T>;
}

export interface PooledResource<T> {
    resource: T;
    createdAt: number;
    lastUsedAt: number;
    useCount: number;
    id: string;
}

export interface PoolStats {
    size: number;
    available: number;
    borrowed: number;
    waiting: number;
    created: number;
    destroyed: number;
    acquireCount: number;
    releaseCount: number;
    avgAcquireTime: number;
    avgUseTime: number;
}

interface WaitingClient<T> {
    resolve: (resource: T) => void;
    reject: (error: Error) => void;
    timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESOURCE POOL
// ═══════════════════════════════════════════════════════════════════════════════

export class ResourcePool<T> extends EventEmitter {
    private config: PoolConfig;
    private factory: ResourceFactory<T>;
    private available: PooledResource<T>[] = [];
    private borrowed: Map<T, PooledResource<T>> = new Map();
    private waiting: WaitingClient<T>[] = [];
    private evictionTimer?: ReturnType<typeof setInterval>;
    private stats: {
        created: number;
        destroyed: number;
        acquireCount: number;
        releaseCount: number;
        totalAcquireTime: number;
        totalUseTime: number;
    };

    constructor(factory: ResourceFactory<T>, config: Partial<PoolConfig> = {}) {
        super();
        this.factory = factory;
        this.config = {
            minSize: config.minSize || 2,
            maxSize: config.maxSize || 10,
            acquireTimeout: config.acquireTimeout || 30000,
            idleTimeout: config.idleTimeout || 300000,
            maxWaitingClients: config.maxWaitingClients || 100,
            evictionInterval: config.evictionInterval || 60000,
            validateOnBorrow: config.validateOnBorrow ?? true,
            validateOnReturn: config.validateOnReturn ?? false
        };
        this.stats = {
            created: 0,
            destroyed: 0,
            acquireCount: 0,
            releaseCount: 0,
            totalAcquireTime: 0,
            totalUseTime: 0
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LIFECYCLE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Initialize pool with minimum resources
     */
    async initialize(): Promise<void> {
        const promises: Promise<void>[] = [];

        for (let i = 0; i < this.config.minSize; i++) {
            promises.push(this.createResource());
        }

        await Promise.all(promises);
        this.startEviction();
        this.emit('pool:initialized', { size: this.available.length });
    }

    /**
     * Shutdown pool
     */
    async shutdown(): Promise<void> {
        this.stopEviction();

        // Reject waiting clients
        for (const client of this.waiting) {
            client.reject(new Error('Pool is shutting down'));
        }
        this.waiting = [];

        // Destroy all resources
        const destroyPromises: Promise<void>[] = [];

        for (const pooled of this.available) {
            destroyPromises.push(this.destroyResource(pooled));
        }

        for (const [, pooled] of this.borrowed) {
            destroyPromises.push(this.destroyResource(pooled));
        }

        await Promise.all(destroyPromises);
        this.available = [];
        this.borrowed.clear();

        this.emit('pool:shutdown');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESOURCE MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Acquire resource from pool
     */
    async acquire(): Promise<T> {
        const startTime = Date.now();
        this.stats.acquireCount++;

        // Try to get available resource
        while (this.available.length > 0) {
            const pooled = this.available.pop()!;

            // Validate if needed
            if (this.config.validateOnBorrow && this.factory.validate) {
                const valid = await this.factory.validate(pooled.resource);
                if (!valid) {
                    await this.destroyResource(pooled);
                    continue;
                }
            }

            this.borrowed.set(pooled.resource, pooled);
            pooled.lastUsedAt = Date.now();
            pooled.useCount++;

            this.stats.totalAcquireTime += Date.now() - startTime;
            this.emit('resource:acquired', { id: pooled.id });

            return pooled.resource;
        }

        // Try to create new resource
        if (this.getSize() < this.config.maxSize) {
            await this.createResource();
            return this.acquire();
        }

        // Wait for available resource
        if (this.waiting.length >= this.config.maxWaitingClients) {
            throw new Error('Pool is exhausted and max waiting clients reached');
        }

        return new Promise<T>((resolve, reject) => {
            const client: WaitingClient<T> = {
                resolve: (resource: T) => {
                    this.stats.totalAcquireTime += Date.now() - startTime;
                    resolve(resource);
                },
                reject,
                timestamp: Date.now()
            };

            this.waiting.push(client);

            // Set timeout
            setTimeout(() => {
                const index = this.waiting.indexOf(client);
                if (index !== -1) {
                    this.waiting.splice(index, 1);
                    reject(new Error(`Acquire timeout after ${this.config.acquireTimeout}ms`));
                }
            }, this.config.acquireTimeout);
        });
    }

    /**
     * Release resource back to pool
     */
    async release(resource: T): Promise<void> {
        const pooled = this.borrowed.get(resource);
        
        if (!pooled) {
            console.warn('Attempting to release unknown resource');
            return;
        }

        this.borrowed.delete(resource);
        this.stats.releaseCount++;
        this.stats.totalUseTime += Date.now() - pooled.lastUsedAt;

        // Validate if needed
        if (this.config.validateOnReturn && this.factory.validate) {
            const valid = await this.factory.validate(resource);
            if (!valid) {
                await this.destroyResource(pooled);
                return;
            }
        }

        // Reset if available
        if (this.factory.reset) {
            try {
                pooled.resource = await this.factory.reset(resource);
            } catch {
                await this.destroyResource(pooled);
                return;
            }
        }

        pooled.lastUsedAt = Date.now();

        // Give to waiting client or return to pool
        if (this.waiting.length > 0) {
            const client = this.waiting.shift()!;
            this.borrowed.set(pooled.resource, pooled);
            pooled.useCount++;
            client.resolve(pooled.resource);
        } else {
            this.available.push(pooled);
        }

        this.emit('resource:released', { id: pooled.id });
    }

    /**
     * Use resource with automatic release
     */
    async use<R>(fn: (resource: T) => R | Promise<R>): Promise<R> {
        const resource = await this.acquire();
        try {
            return await fn(resource);
        } finally {
            await this.release(resource);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERNAL
    // ─────────────────────────────────────────────────────────────────────────

    private async createResource(): Promise<void> {
        const resource = await this.factory.create();
        const pooled: PooledResource<T> = {
            resource,
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
            useCount: 0,
            id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        this.available.push(pooled);
        this.stats.created++;
        this.emit('resource:created', { id: pooled.id });
    }

    private async destroyResource(pooled: PooledResource<T>): Promise<void> {
        try {
            await this.factory.destroy(pooled.resource);
        } catch (error) {
            console.warn('Error destroying resource:', error);
        }
        this.stats.destroyed++;
        this.emit('resource:destroyed', { id: pooled.id });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EVICTION
    // ─────────────────────────────────────────────────────────────────────────

    private startEviction(): void {
        this.evictionTimer = setInterval(() => {
            this.evict();
        }, this.config.evictionInterval);
    }

    private stopEviction(): void {
        if (this.evictionTimer) {
            clearInterval(this.evictionTimer);
            this.evictionTimer = undefined;
        }
    }

    private async evict(): Promise<void> {
        const now = Date.now();
        const toEvict: PooledResource<T>[] = [];

        // Find idle resources beyond min size
        while (this.available.length > this.config.minSize) {
            const pooled = this.available[0];
            const idleTime = now - pooled.lastUsedAt;

            if (idleTime > this.config.idleTimeout) {
                this.available.shift();
                toEvict.push(pooled);
            } else {
                break;
            }
        }

        // Destroy evicted resources
        for (const pooled of toEvict) {
            await this.destroyResource(pooled);
        }

        if (toEvict.length > 0) {
            this.emit('pool:evicted', { count: toEvict.length });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATISTICS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get pool statistics
     */
    getStats(): PoolStats {
        return {
            size: this.getSize(),
            available: this.available.length,
            borrowed: this.borrowed.size,
            waiting: this.waiting.length,
            created: this.stats.created,
            destroyed: this.stats.destroyed,
            acquireCount: this.stats.acquireCount,
            releaseCount: this.stats.releaseCount,
            avgAcquireTime: this.stats.acquireCount > 0 
                ? this.stats.totalAcquireTime / this.stats.acquireCount 
                : 0,
            avgUseTime: this.stats.releaseCount > 0 
                ? this.stats.totalUseTime / this.stats.releaseCount 
                : 0
        };
    }

    /**
     * Get total pool size
     */
    getSize(): number {
        return this.available.length + this.borrowed.size;
    }

    /**
     * Check if pool is healthy
     */
    isHealthy(): boolean {
        return this.available.length > 0 || this.getSize() < this.config.maxSize;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALIZED POOLS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Browser pool for Playwright/Puppeteer
 */
export class BrowserPool extends ResourcePool<any> {
    constructor(
        browserLauncher: () => Promise<any>,
        config: Partial<PoolConfig> = {}
    ) {
        super({
            create: browserLauncher,
            destroy: async (browser) => {
                try {
                    await browser.close();
                } catch {}
            },
            validate: async (browser) => {
                try {
                    return browser.isConnected?.() ?? true;
                } catch {
                    return false;
                }
            }
        }, config);
    }
}

/**
 * Page pool for browser pages
 */
export class PagePool extends ResourcePool<any> {
    constructor(
        browser: any,
        config: Partial<PoolConfig> = {}
    ) {
        super({
            create: async () => {
                const context = await browser.newContext();
                return context.newPage();
            },
            destroy: async (page) => {
                try {
                    const context = page.context();
                    await page.close();
                    await context.close();
                } catch {}
            },
            reset: async (page) => {
                await page.goto('about:blank');
                return page;
            },
            validate: async (page) => {
                try {
                    return !page.isClosed();
                } catch {
                    return false;
                }
            }
        }, config);
    }
}

/**
 * Connection pool for databases
 */
export class ConnectionPool extends ResourcePool<any> {
    constructor(
        connectionFactory: () => Promise<any>,
        config: Partial<PoolConfig> = {}
    ) {
        super({
            create: connectionFactory,
            destroy: async (conn) => {
                try {
                    await conn.close?.() || conn.end?.() || conn.disconnect?.();
                } catch {}
            },
            validate: async (conn) => {
                try {
                    // Try a simple query
                    await conn.query?.('SELECT 1') || conn.ping?.();
                    return true;
                } catch {
                    return false;
                }
            }
        }, config);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default ResourcePool;
