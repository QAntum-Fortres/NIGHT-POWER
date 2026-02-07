/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM PROXY CHAIN                                                          ║
 * ║   "Route through proxies, stay invisible"                                     ║
 * ║                                                                               ║
 * ║   TODO B #24 - Ghost: Proxy Chains                                            ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProxyConfig {
    host: string;
    port: number;
    protocol: 'http' | 'https' | 'socks4' | 'socks5';
    username?: string;
    password?: string;
    country?: string;
    region?: string;
    city?: string;
    latency?: number;
    lastChecked?: number;
    active?: boolean;
}

export interface ProxyPool {
    id: string;
    name: string;
    proxies: ProxyConfig[];
    rotationStrategy: RotationStrategy;
    currentIndex: number;
    failedProxies: Set<string>;
}

export type RotationStrategy = 
    | 'round-robin'
    | 'random'
    | 'weighted'
    | 'sticky'
    | 'geo-based'
    | 'latency-based';

export interface ProxyStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgLatency: number;
    byProxy: Map<string, { requests: number; failures: number; avgLatency: number }>;
}

export interface ProxyChainConfig {
    enabled: boolean;
    defaultPool?: string;
    retryOnFail: boolean;
    maxRetries: number;
    healthCheckInterval: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROXY CHAIN MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class ProxyChain {
    private static instance: ProxyChain;

    private pools: Map<string, ProxyPool> = new Map();
    private config: ProxyChainConfig = {
        enabled: false,
        retryOnFail: true,
        maxRetries: 3,
        healthCheckInterval: 60000
    };
    private stats: ProxyStats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgLatency: 0,
        byProxy: new Map()
    };
    private stickyMap: Map<string, string> = new Map();
    private healthCheckTimer?: NodeJS.Timeout;

    static getInstance(): ProxyChain {
        if (!ProxyChain.instance) {
            ProxyChain.instance = new ProxyChain();
        }
        return ProxyChain.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LIFECYCLE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Enable proxy chain
     */
    enable(config?: Partial<ProxyChainConfig>): void {
        this.config = { ...this.config, ...config, enabled: true };
        this.startHealthChecks();
        console.log('[ProxyChain] Enabled');
    }

    /**
     * Disable proxy chain
     */
    disable(): void {
        this.config.enabled = false;
        this.stopHealthChecks();
        console.log('[ProxyChain] Disabled');
    }

    /**
     * Check if enabled
     */
    isEnabled(): boolean {
        return this.config.enabled;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POOL MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create a proxy pool
     */
    createPool(
        name: string,
        proxies: ProxyConfig[],
        strategy: RotationStrategy = 'round-robin'
    ): string {
        const id = `pool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        this.pools.set(id, {
            id,
            name,
            proxies: proxies.map(p => ({ ...p, active: true })),
            rotationStrategy: strategy,
            currentIndex: 0,
            failedProxies: new Set()
        });

        return id;
    }

    /**
     * Add proxy to pool
     */
    addToPool(poolId: string, proxy: ProxyConfig): boolean {
        const pool = this.pools.get(poolId);
        if (!pool) return false;

        pool.proxies.push({ ...proxy, active: true });
        return true;
    }

    /**
     * Remove proxy from pool
     */
    removeFromPool(poolId: string, host: string, port: number): boolean {
        const pool = this.pools.get(poolId);
        if (!pool) return false;

        const index = pool.proxies.findIndex(p => p.host === host && p.port === port);
        if (index >= 0) {
            pool.proxies.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Get pool
     */
    getPool(poolId: string): ProxyPool | undefined {
        return this.pools.get(poolId);
    }

    /**
     * Delete pool
     */
    deletePool(poolId: string): boolean {
        return this.pools.delete(poolId);
    }

    /**
     * Set default pool
     */
    setDefaultPool(poolId: string): void {
        this.config.defaultPool = poolId;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROXY SELECTION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get next proxy from pool
     */
    getProxy(poolId?: string, sessionId?: string): ProxyConfig | null {
        const pool = this.pools.get(poolId || this.config.defaultPool || '');
        if (!pool || pool.proxies.length === 0) return null;

        const activeProxies = pool.proxies.filter(
            p => p.active && !pool.failedProxies.has(`${p.host}:${p.port}`)
        );
        
        if (activeProxies.length === 0) {
            // Reset failed proxies if all failed
            pool.failedProxies.clear();
            return this.getProxy(poolId, sessionId);
        }

        switch (pool.rotationStrategy) {
            case 'round-robin':
                return this.roundRobinSelect(pool, activeProxies);
            case 'random':
                return this.randomSelect(activeProxies);
            case 'weighted':
                return this.weightedSelect(activeProxies);
            case 'sticky':
                return this.stickySelect(pool, activeProxies, sessionId);
            case 'geo-based':
                return this.geoSelect(activeProxies);
            case 'latency-based':
                return this.latencySelect(activeProxies);
            default:
                return activeProxies[0];
        }
    }

    /**
     * Get proxy URL string
     */
    getProxyUrl(poolId?: string, sessionId?: string): string | null {
        const proxy = this.getProxy(poolId, sessionId);
        if (!proxy) return null;
        return this.formatProxyUrl(proxy);
    }

    /**
     * Mark proxy as failed
     */
    markFailed(poolId: string, host: string, port: number): void {
        const pool = this.pools.get(poolId);
        if (pool) {
            pool.failedProxies.add(`${host}:${port}`);
            this.stats.failedRequests++;
        }
    }

    /**
     * Mark proxy as successful
     */
    markSuccess(poolId: string, host: string, port: number, latency: number): void {
        const pool = this.pools.get(poolId);
        if (pool) {
            pool.failedProxies.delete(`${host}:${port}`);
            
            // Update proxy latency
            const proxy = pool.proxies.find(p => p.host === host && p.port === port);
            if (proxy) {
                proxy.latency = latency;
                proxy.lastChecked = Date.now();
            }

            this.stats.successfulRequests++;
            this.updateLatencyStats(latency);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BROWSER CONFIGURATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get Playwright proxy config
     */
    getPlaywrightConfig(poolId?: string, sessionId?: string): object | undefined {
        const proxy = this.getProxy(poolId, sessionId);
        if (!proxy) return undefined;

        const config: any = {
            server: `${proxy.protocol}://${proxy.host}:${proxy.port}`
        };

        if (proxy.username && proxy.password) {
            config.username = proxy.username;
            config.password = proxy.password;
        }

        return config;
    }

    /**
     * Get Puppeteer proxy args
     */
    getPuppeteerArgs(poolId?: string, sessionId?: string): string[] {
        const proxy = this.getProxy(poolId, sessionId);
        if (!proxy) return [];

        return [`--proxy-server=${proxy.protocol}://${proxy.host}:${proxy.port}`];
    }

    /**
     * Get Selenium proxy config
     */
    getSeleniumConfig(poolId?: string, sessionId?: string): object | undefined {
        const proxy = this.getProxy(poolId, sessionId);
        if (!proxy) return undefined;

        return {
            proxyType: 'manual',
            httpProxy: `${proxy.host}:${proxy.port}`,
            sslProxy: `${proxy.host}:${proxy.port}`,
            socksProxy: proxy.protocol.startsWith('socks') ? `${proxy.host}:${proxy.port}` : undefined,
            socksVersion: proxy.protocol === 'socks5' ? 5 : 4
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HEALTH CHECKS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Check proxy health
     */
    async checkHealth(proxy: ProxyConfig): Promise<boolean> {
        const startTime = Date.now();

        try {
            // Simulated health check - in real implementation would make HTTP request
            const latency = Date.now() - startTime;
            proxy.latency = latency;
            proxy.lastChecked = Date.now();
            proxy.active = true;
            return true;
        } catch {
            proxy.active = false;
            return false;
        }
    }

    /**
     * Check all proxies in pool
     */
    async checkPoolHealth(poolId: string): Promise<{ healthy: number; total: number }> {
        const pool = this.pools.get(poolId);
        if (!pool) return { healthy: 0, total: 0 };

        let healthy = 0;
        
        for (const proxy of pool.proxies) {
            if (await this.checkHealth(proxy)) {
                healthy++;
            }
        }

        return { healthy, total: pool.proxies.length };
    }

    /**
     * Start health check timer
     */
    private startHealthChecks(): void {
        if (this.healthCheckTimer) return;

        this.healthCheckTimer = setInterval(async () => {
            for (const [id] of this.pools) {
                await this.checkPoolHealth(id);
            }
        }, this.config.healthCheckInterval);
    }

    /**
     * Stop health check timer
     */
    private stopHealthChecks(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = undefined;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATISTICS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get statistics
     */
    getStatistics(): ProxyStats {
        return { ...this.stats, byProxy: new Map(this.stats.byProxy) };
    }

    /**
     * Reset statistics
     */
    resetStatistics(): void {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            avgLatency: 0,
            byProxy: new Map()
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE SELECTION STRATEGIES
    // ─────────────────────────────────────────────────────────────────────────

    private roundRobinSelect(pool: ProxyPool, proxies: ProxyConfig[]): ProxyConfig {
        pool.currentIndex = (pool.currentIndex + 1) % proxies.length;
        this.stats.totalRequests++;
        return proxies[pool.currentIndex];
    }

    private randomSelect(proxies: ProxyConfig[]): ProxyConfig {
        this.stats.totalRequests++;
        return proxies[Math.floor(Math.random() * proxies.length)];
    }

    private weightedSelect(proxies: ProxyConfig[]): ProxyConfig {
        // Weight by inverse latency (faster = higher weight)
        const weights = proxies.map(p => 1000 / (p.latency || 100));
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        
        let random = Math.random() * totalWeight;
        for (let i = 0; i < proxies.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                this.stats.totalRequests++;
                return proxies[i];
            }
        }
        
        this.stats.totalRequests++;
        return proxies[0];
    }

    private stickySelect(pool: ProxyPool, proxies: ProxyConfig[], sessionId?: string): ProxyConfig {
        if (sessionId) {
            const stickyKey = `${pool.id}:${sessionId}`;
            const cachedProxy = this.stickyMap.get(stickyKey);
            
            if (cachedProxy) {
                const proxy = proxies.find(p => `${p.host}:${p.port}` === cachedProxy);
                if (proxy) {
                    this.stats.totalRequests++;
                    return proxy;
                }
            }

            // Assign new proxy
            const proxy = proxies[Math.floor(Math.random() * proxies.length)];
            this.stickyMap.set(stickyKey, `${proxy.host}:${proxy.port}`);
            this.stats.totalRequests++;
            return proxy;
        }

        return this.randomSelect(proxies);
    }

    private geoSelect(proxies: ProxyConfig[]): ProxyConfig {
        // Prefer proxies from different regions for diversity
        const byCountry = new Map<string, ProxyConfig[]>();
        
        for (const proxy of proxies) {
            const country = proxy.country || 'unknown';
            const list = byCountry.get(country) || [];
            list.push(proxy);
            byCountry.set(country, list);
        }

        // Random country, then random proxy from that country
        const countries = [...byCountry.keys()];
        const country = countries[Math.floor(Math.random() * countries.length)];
        const countryProxies = byCountry.get(country)!;
        
        this.stats.totalRequests++;
        return countryProxies[Math.floor(Math.random() * countryProxies.length)];
    }

    private latencySelect(proxies: ProxyConfig[]): ProxyConfig {
        // Sort by latency, pick from top 3
        const sorted = [...proxies].sort((a, b) => (a.latency || 999) - (b.latency || 999));
        const top = sorted.slice(0, Math.min(3, sorted.length));
        
        this.stats.totalRequests++;
        return top[Math.floor(Math.random() * top.length)];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private formatProxyUrl(proxy: ProxyConfig): string {
        const auth = proxy.username && proxy.password
            ? `${proxy.username}:${proxy.password}@`
            : '';
        return `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`;
    }

    private updateLatencyStats(latency: number): void {
        const totalLatency = this.stats.avgLatency * (this.stats.successfulRequests - 1);
        this.stats.avgLatency = (totalLatency + latency) / this.stats.successfulRequests;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getProxyChain = (): ProxyChain => ProxyChain.getInstance();

export default ProxyChain;
