/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM DISTRIBUTED MODULE                                                   ║
 * ║   "Scale Testing Across Infrastructure"                                       ║
 * ║                                                                               ║
 * ║   TODO B #14-16 - Complete Distributed System                                 ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// RE-EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export * from './runner';
export * from './load-balancer';
export * from './sharding';

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════════════════════

import { 
    DistributedRunner, 
    getDistributedRunner,
    WorkerNode,
    NodeCapabilities,
    DistributedTask,
    TaskResult,
    DistributionStrategy
} from './runner';

import { 
    LoadBalancer, 
    getLoadBalancer,
    Worker,
    BalancingAlgorithm
} from './load-balancer';

import { 
    ShardingEngine, 
    getShardingEngine,
    Test,
    Shard,
    ShardingStrategy,
    ShardReport
} from './sharding';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED DISTRIBUTED FACADE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Unified Distributed System
 */
export class Distributed {
    private static instance: Distributed;

    readonly runner: DistributedRunner;
    readonly balancer: LoadBalancer;
    readonly sharding: ShardingEngine;

    private constructor() {
        this.runner = getDistributedRunner();
        this.balancer = getLoadBalancer();
        this.sharding = getShardingEngine();
    }

    static getInstance(): Distributed {
        if (!Distributed.instance) {
            Distributed.instance = new Distributed();
        }
        return Distributed.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUICK SETUP
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Quick setup with nodes
     */
    setup(
        nodes: Array<{ name: string; host: string; port: number; capabilities?: NodeCapabilities }>,
        options?: {
            strategy?: DistributionStrategy;
            shardingStrategy?: ShardingStrategy;
            balancingAlgorithm?: BalancingAlgorithm;
        }
    ): void {
        // Configure strategies
        if (options?.strategy) {
            this.runner.configure({ strategy: options.strategy });
        }
        if (options?.shardingStrategy) {
            this.sharding.configure({ strategy: options.shardingStrategy });
        }
        if (options?.balancingAlgorithm) {
            this.balancer.configure({ algorithm: options.balancingAlgorithm });
        }

        // Register nodes
        for (const node of nodes) {
            const capabilities = node.capabilities || {
                browsers: ['chromium', 'firefox'],
                os: 'linux',
                memory: 8192,
                cpuCores: 4,
                tags: []
            };

            this.runner.registerNode(node.name, node.host, node.port, capabilities);
            this.balancer.addWorker(`${node.host}:${node.port}`);
        }

        console.log(`[Distributed] Setup complete with ${nodes.length} nodes`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST EXECUTION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Run tests distributed across nodes
     */
    async run(
        tests: Test[],
        options?: {
            shardCount?: number;
            timeout?: number;
        }
    ): Promise<{
        results: Map<string, TaskResult>;
        duration: number;
        shardReports: ShardReport[];
    }> {
        const startTime = Date.now();
        const nodeCount = this.runner.getAllNodes().length;
        
        if (nodeCount === 0) {
            throw new Error('No nodes registered. Call setup() first.');
        }

        // Calculate optimal shard count
        const shardCount = options?.shardCount || 
            this.sharding.calculateOptimalShardCount(tests, {
                maxShards: nodeCount
            });

        // Create shards
        const shards = this.sharding.createShards(tests, shardCount);

        // Start runner
        this.runner.start();

        // Submit all tests
        const taskIds: string[] = [];
        for (const shard of shards) {
            for (const test of shard.tests) {
                const taskId = this.runner.submitTask(test.id, test.name, {
                    priority: test.priority
                });
                taskIds.push(taskId);
            }
        }

        // Wait for completion
        await this.runner.waitForCompletion(options?.timeout);

        // Collect results
        const results = new Map<string, TaskResult>();
        const shardReports: ShardReport[] = [];

        for (const shard of shards) {
            let shardPassed = 0;
            let shardFailed = 0;
            let shardDuration = 0;

            for (const test of shard.tests) {
                const tasks = [...this.runner.getTasksByStatus('completed'), 
                              ...this.runner.getTasksByStatus('failed')]
                    .filter(t => t.testId === test.id);

                if (tasks.length > 0) {
                    const task = tasks[0];
                    results.set(test.id, task.result!);
                    
                    if (task.result?.success) {
                        shardPassed++;
                    } else {
                        shardFailed++;
                    }
                    shardDuration += task.result?.duration || 0;
                }
            }

            shardReports.push({
                shardIndex: shard.index,
                totalShards: shard.total,
                testsRun: shard.tests.length,
                duration: shardDuration,
                passed: shardPassed,
                failed: shardFailed,
                skipped: 0
            });
        }

        this.runner.stop();

        return {
            results,
            duration: Date.now() - startTime,
            shardReports
        };
    }

    /**
     * Run tests in specific shard
     */
    async runShard(
        tests: Test[],
        shardIndex: number,
        totalShards: number
    ): Promise<Shard> {
        const shard = this.sharding.getShard(tests, shardIndex, totalShards);
        return shard;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NODE MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Add a node at runtime
     */
    addNode(
        name: string,
        host: string,
        port: number,
        capabilities?: NodeCapabilities
    ): string {
        const caps = capabilities || {
            browsers: ['chromium'],
            os: 'linux',
            memory: 4096,
            cpuCores: 2,
            tags: []
        };

        const nodeId = this.runner.registerNode(name, host, port, caps);
        this.balancer.addWorker(`${host}:${port}`);

        return nodeId;
    }

    /**
     * Remove a node at runtime
     */
    removeNode(nodeId: string): boolean {
        const node = this.runner.getNode(nodeId);
        if (node) {
            this.balancer.removeWorker(`${node.host}:${node.port}`);
        }
        return this.runner.unregisterNode(nodeId);
    }

    /**
     * Get cluster status
     */
    getStatus(): {
        nodes: WorkerNode[];
        runnerStats: ReturnType<typeof DistributedRunner.prototype.getStatistics>;
        balancerStats: ReturnType<typeof LoadBalancer.prototype.getStatistics>;
    } {
        return {
            nodes: this.runner.getAllNodes(),
            runnerStats: this.runner.getStatistics(),
            balancerStats: this.balancer.getStatistics()
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SHARDING UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Preview shard distribution
     */
    previewShards(tests: Test[], shardCount?: number): Shard[] {
        const count = shardCount || this.sharding.calculateOptimalShardCount(tests);
        return this.sharding.createShards(tests, count);
    }

    /**
     * Calculate optimal shards
     */
    calculateShards(
        tests: Test[],
        options?: { targetDuration?: number; maxShards?: number }
    ): number {
        return this.sharding.calculateOptimalShardCount(tests, options);
    }

    /**
     * Record test duration for future optimization
     */
    recordDuration(testId: string, duration: number): void {
        this.sharding.recordDuration(testId, duration);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CLEANUP
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Shutdown the distributed system
     */
    shutdown(): void {
        this.runner.stop();
        this.balancer.stopHealthChecks();
        console.log('[Distributed] Shutdown complete');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const distributed = Distributed.getInstance();

// Re-export classes
export {
    DistributedRunner,
    LoadBalancer,
    ShardingEngine
};

// Re-export types
export type {
    WorkerNode,
    NodeCapabilities,
    DistributedTask,
    TaskResult,
    DistributionStrategy,
    Worker,
    BalancingAlgorithm,
    Test,
    Shard,
    ShardingStrategy,
    ShardReport
};

export default Distributed;
