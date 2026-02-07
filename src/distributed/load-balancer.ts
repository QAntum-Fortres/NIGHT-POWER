/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM LOAD BALANCER                                                        ║
 * ║   "Smart test distribution across workers"                                    ║
 * ║                                                                               ║
 * ║   TODO B #15 - Performance: Load Balancing                                    ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Worker {
    id: string;
    weight: number;
    healthy: boolean;
    activeConnections: number;
    maxConnections: number;
    responseTime: number;
    failureCount: number;
    lastUsed: number;
    metadata?: Record<string, any>;
}

export type BalancingAlgorithm = 
    | 'round-robin'
    | 'weighted-round-robin'
    | 'least-connections'
    | 'weighted-least-connections'
    | 'ip-hash'
    | 'random'
    | 'response-time';

export interface HealthCheckConfig {
    enabled: boolean;
    interval: number;
    timeout: number;
    healthyThreshold: number;
    unhealthyThreshold: number;
    path?: string;
}

export interface LoadBalancerConfig {
    algorithm: BalancingAlgorithm;
    healthCheck: HealthCheckConfig;
    maxFailures: number;
    failureResetTime: number;
    stickySession: boolean;
    sessionTTL: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD BALANCER
// ═══════════════════════════════════════════════════════════════════════════════

export class LoadBalancer {
    private static instance: LoadBalancer;

    private workers: Map<string, Worker> = new Map();
    private roundRobinIndex: number = 0;
    private sessionMap: Map<string, { workerId: string; expires: number }> = new Map();
    private healthCheckTimer?: NodeJS.Timeout;

    private config: LoadBalancerConfig = {
        algorithm: 'weighted-round-robin',
        healthCheck: {
            enabled: true,
            interval: 10000,
            timeout: 5000,
            healthyThreshold: 2,
            unhealthyThreshold: 3
        },
        maxFailures: 5,
        failureResetTime: 60000,
        stickySession: false,
        sessionTTL: 3600000
    };

    static getInstance(): LoadBalancer {
        if (!LoadBalancer.instance) {
            LoadBalancer.instance = new LoadBalancer();
        }
        return LoadBalancer.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONFIGURATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Configure the load balancer
     */
    configure(config: Partial<LoadBalancerConfig>): void {
        this.config = { 
            ...this.config, 
            ...config,
            healthCheck: { ...this.config.healthCheck, ...config.healthCheck }
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WORKER MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Add worker to pool
     */
    addWorker(id: string, options?: Partial<Worker>): void {
        this.workers.set(id, {
            id,
            weight: options?.weight ?? 1,
            healthy: true,
            activeConnections: 0,
            maxConnections: options?.maxConnections ?? 100,
            responseTime: 0,
            failureCount: 0,
            lastUsed: 0,
            metadata: options?.metadata
        });

        console.log(`[LoadBalancer] Worker added: ${id}`);
    }

    /**
     * Remove worker from pool
     */
    removeWorker(id: string): boolean {
        return this.workers.delete(id);
    }

    /**
     * Get worker by ID
     */
    getWorker(id: string): Worker | undefined {
        return this.workers.get(id);
    }

    /**
     * Get all workers
     */
    getWorkers(): Worker[] {
        return [...this.workers.values()];
    }

    /**
     * Get healthy workers
     */
    getHealthyWorkers(): Worker[] {
        return [...this.workers.values()].filter(w => 
            w.healthy && w.activeConnections < w.maxConnections
        );
    }

    /**
     * Update worker weight
     */
    setWeight(id: string, weight: number): boolean {
        const worker = this.workers.get(id);
        if (!worker) return false;
        worker.weight = weight;
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOAD BALANCING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get next worker
     */
    getNext(sessionId?: string): Worker | null {
        // Check sticky session
        if (this.config.stickySession && sessionId) {
            const session = this.sessionMap.get(sessionId);
            if (session && session.expires > Date.now()) {
                const worker = this.workers.get(session.workerId);
                if (worker && worker.healthy) {
                    return worker;
                }
            }
        }

        const healthyWorkers = this.getHealthyWorkers();
        if (healthyWorkers.length === 0) return null;

        let selected: Worker;

        switch (this.config.algorithm) {
            case 'round-robin':
                selected = this.roundRobin(healthyWorkers);
                break;
            case 'weighted-round-robin':
                selected = this.weightedRoundRobin(healthyWorkers);
                break;
            case 'least-connections':
                selected = this.leastConnections(healthyWorkers);
                break;
            case 'weighted-least-connections':
                selected = this.weightedLeastConnections(healthyWorkers);
                break;
            case 'ip-hash':
                selected = this.ipHash(healthyWorkers, sessionId || '');
                break;
            case 'random':
                selected = this.random(healthyWorkers);
                break;
            case 'response-time':
                selected = this.responseTime(healthyWorkers);
                break;
            default:
                selected = healthyWorkers[0];
        }

        // Update sticky session
        if (this.config.stickySession && sessionId) {
            this.sessionMap.set(sessionId, {
                workerId: selected.id,
                expires: Date.now() + this.config.sessionTTL
            });
        }

        selected.lastUsed = Date.now();
        return selected;
    }

    /**
     * Mark connection start
     */
    connectionStart(workerId: string): void {
        const worker = this.workers.get(workerId);
        if (worker) {
            worker.activeConnections++;
        }
    }

    /**
     * Mark connection end
     */
    connectionEnd(workerId: string, responseTime?: number): void {
        const worker = this.workers.get(workerId);
        if (worker) {
            worker.activeConnections = Math.max(0, worker.activeConnections - 1);
            if (responseTime !== undefined) {
                // Exponential moving average
                worker.responseTime = worker.responseTime * 0.8 + responseTime * 0.2;
            }
        }
    }

    /**
     * Mark worker failure
     */
    markFailure(workerId: string): void {
        const worker = this.workers.get(workerId);
        if (!worker) return;

        worker.failureCount++;
        
        if (worker.failureCount >= this.config.maxFailures) {
            worker.healthy = false;
            console.log(`[LoadBalancer] Worker ${workerId} marked unhealthy`);
        }

        // Reset failure count after time
        setTimeout(() => {
            worker.failureCount = Math.max(0, worker.failureCount - 1);
        }, this.config.failureResetTime);
    }

    /**
     * Mark worker success
     */
    markSuccess(workerId: string): void {
        const worker = this.workers.get(workerId);
        if (!worker) return;

        worker.failureCount = Math.max(0, worker.failureCount - 1);
        
        if (!worker.healthy && worker.failureCount === 0) {
            worker.healthy = true;
            console.log(`[LoadBalancer] Worker ${workerId} restored to healthy`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HEALTH CHECKS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Start health checks
     */
    startHealthChecks(): void {
        if (!this.config.healthCheck.enabled) return;
        if (this.healthCheckTimer) return;

        this.healthCheckTimer = setInterval(() => {
            this.runHealthChecks();
        }, this.config.healthCheck.interval);

        console.log('[LoadBalancer] Health checks started');
    }

    /**
     * Stop health checks
     */
    stopHealthChecks(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = undefined;
        }
    }

    /**
     * Run health checks manually
     */
    async runHealthChecks(): Promise<void> {
        for (const worker of this.workers.values()) {
            const healthy = await this.checkWorkerHealth(worker);
            
            if (healthy && !worker.healthy) {
                worker.healthy = true;
                console.log(`[LoadBalancer] Worker ${worker.id} now healthy`);
            } else if (!healthy && worker.healthy) {
                worker.healthy = false;
                console.log(`[LoadBalancer] Worker ${worker.id} now unhealthy`);
            }
        }
    }

    private async checkWorkerHealth(worker: Worker): Promise<boolean> {
        // Simulated health check - in real implementation would make HTTP request
        return worker.failureCount < this.config.healthCheck.unhealthyThreshold;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATISTICS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get statistics
     */
    getStatistics(): {
        totalWorkers: number;
        healthyWorkers: number;
        totalConnections: number;
        avgResponseTime: number;
        distribution: Record<string, number>;
    } {
        const workers = this.getWorkers();
        const healthy = workers.filter(w => w.healthy);

        const totalConnections = workers.reduce((sum, w) => sum + w.activeConnections, 0);
        const avgResponseTime = healthy.length > 0
            ? healthy.reduce((sum, w) => sum + w.responseTime, 0) / healthy.length
            : 0;

        const distribution: Record<string, number> = {};
        for (const worker of workers) {
            distribution[worker.id] = worker.activeConnections;
        }

        return {
            totalWorkers: workers.length,
            healthyWorkers: healthy.length,
            totalConnections,
            avgResponseTime,
            distribution
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ALGORITHMS
    // ─────────────────────────────────────────────────────────────────────────

    private roundRobin(workers: Worker[]): Worker {
        this.roundRobinIndex = (this.roundRobinIndex + 1) % workers.length;
        return workers[this.roundRobinIndex];
    }

    private weightedRoundRobin(workers: Worker[]): Worker {
        const totalWeight = workers.reduce((sum, w) => sum + w.weight, 0);
        let random = Math.random() * totalWeight;

        for (const worker of workers) {
            random -= worker.weight;
            if (random <= 0) return worker;
        }

        return workers[0];
    }

    private leastConnections(workers: Worker[]): Worker {
        return workers.sort((a, b) => a.activeConnections - b.activeConnections)[0];
    }

    private weightedLeastConnections(workers: Worker[]): Worker {
        return workers.sort((a, b) => {
            const scoreA = a.activeConnections / a.weight;
            const scoreB = b.activeConnections / b.weight;
            return scoreA - scoreB;
        })[0];
    }

    private ipHash(workers: Worker[], key: string): Worker {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = ((hash << 5) - hash) + key.charCodeAt(i);
            hash = hash & hash;
        }
        return workers[Math.abs(hash) % workers.length];
    }

    private random(workers: Worker[]): Worker {
        return workers[Math.floor(Math.random() * workers.length)];
    }

    private responseTime(workers: Worker[]): Worker {
        return workers.sort((a, b) => {
            // Prefer workers with lower response time and fewer connections
            const scoreA = a.responseTime * (1 + a.activeConnections / 10);
            const scoreB = b.responseTime * (1 + b.activeConnections / 10);
            return scoreA - scoreB;
        })[0];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getLoadBalancer = (): LoadBalancer => LoadBalancer.getInstance();

export default LoadBalancer;
