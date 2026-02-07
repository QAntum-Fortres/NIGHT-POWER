/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM SHARDING ENGINE                                                      ║
 * ║   "Split tests intelligently across shards"                                   ║
 * ║                                                                               ║
 * ║   TODO B #16 - Performance: Test Sharding                                     ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Test {
    id: string;
    name: string;
    file: string;
    duration?: number;
    tags?: string[];
    priority?: number;
    dependencies?: string[];
}

export interface Shard {
    index: number;
    total: number;
    tests: Test[];
    estimatedDuration: number;
    weight: number;
}

export type ShardingStrategy = 
    | 'count'           // Equal number of tests per shard
    | 'duration'        // Balance by estimated duration
    | 'file'            // Group by file
    | 'round-robin'     // Simple round-robin
    | 'hash'            // Consistent hashing
    | 'weighted';       // Custom weights

export interface ShardingConfig {
    strategy: ShardingStrategy;
    preserveOrder: boolean;
    respectDependencies: boolean;
    seed?: number;
}

export interface ShardReport {
    shardIndex: number;
    totalShards: number;
    testsRun: number;
    duration: number;
    passed: number;
    failed: number;
    skipped: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARDING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class ShardingEngine {
    private static instance: ShardingEngine;

    private testHistory: Map<string, number[]> = new Map();
    private config: ShardingConfig = {
        strategy: 'duration',
        preserveOrder: false,
        respectDependencies: true
    };

    static getInstance(): ShardingEngine {
        if (!ShardingEngine.instance) {
            ShardingEngine.instance = new ShardingEngine();
        }
        return ShardingEngine.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONFIGURATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Configure sharding
     */
    configure(config: Partial<ShardingConfig>): void {
        this.config = { ...this.config, ...config };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SHARDING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create shards from tests
     */
    createShards(tests: Test[], shardCount: number): Shard[] {
        if (shardCount <= 0) {
            throw new Error('Shard count must be positive');
        }

        if (tests.length === 0) {
            return this.createEmptyShards(shardCount);
        }

        // Estimate durations from history if not provided
        const testsWithDurations = tests.map(test => ({
            ...test,
            duration: test.duration || this.estimateDuration(test.id)
        }));

        switch (this.config.strategy) {
            case 'count':
                return this.shardByCount(testsWithDurations, shardCount);
            case 'duration':
                return this.shardByDuration(testsWithDurations, shardCount);
            case 'file':
                return this.shardByFile(testsWithDurations, shardCount);
            case 'round-robin':
                return this.shardRoundRobin(testsWithDurations, shardCount);
            case 'hash':
                return this.shardByHash(testsWithDurations, shardCount);
            case 'weighted':
                return this.shardByWeight(testsWithDurations, shardCount);
            default:
                return this.shardByCount(testsWithDurations, shardCount);
        }
    }

    /**
     * Get shard for specific index
     */
    getShard(tests: Test[], shardIndex: number, totalShards: number): Shard {
        const shards = this.createShards(tests, totalShards);
        return shards[shardIndex] || this.createEmptyShard(shardIndex, totalShards);
    }

    /**
     * Calculate optimal shard count
     */
    calculateOptimalShardCount(
        tests: Test[],
        options: {
            targetDuration?: number;
            maxDuration?: number;
            minTestsPerShard?: number;
            maxShards?: number;
        } = {}
    ): number {
        const {
            targetDuration = 300000, // 5 minutes
            maxDuration = 600000,    // 10 minutes
            minTestsPerShard = 1,
            maxShards = 50
        } = options;

        const totalDuration = tests.reduce(
            (sum, t) => sum + (t.duration || this.estimateDuration(t.id)),
            0
        );

        // Calculate based on target duration
        let optimalByDuration = Math.ceil(totalDuration / targetDuration);

        // Ensure minimum tests per shard
        const optimalByCount = Math.ceil(tests.length / minTestsPerShard);

        // Take the larger to satisfy both constraints
        let optimal = Math.max(optimalByDuration, 1);
        
        // But don't exceed max shards or test count
        optimal = Math.min(optimal, maxShards, tests.length);

        return optimal;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DURATION TRACKING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Record test duration for future estimation
     */
    recordDuration(testId: string, duration: number): void {
        const history = this.testHistory.get(testId) || [];
        history.push(duration);
        
        // Keep last 10 runs
        if (history.length > 10) {
            history.shift();
        }
        
        this.testHistory.set(testId, history);
    }

    /**
     * Estimate duration based on history
     */
    estimateDuration(testId: string): number {
        const history = this.testHistory.get(testId);
        if (!history || history.length === 0) {
            return 60000; // Default 1 minute
        }

        // Use median for robustness
        const sorted = [...history].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

    /**
     * Import duration history
     */
    importHistory(history: Record<string, number[]>): void {
        for (const [testId, durations] of Object.entries(history)) {
            this.testHistory.set(testId, durations);
        }
    }

    /**
     * Export duration history
     */
    exportHistory(): Record<string, number[]> {
        return Object.fromEntries(this.testHistory);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REPORTING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Merge shard reports
     */
    mergeReports(reports: ShardReport[]): {
        totalTests: number;
        totalDuration: number;
        passed: number;
        failed: number;
        skipped: number;
        shardBalance: number;
    } {
        const merged = {
            totalTests: 0,
            totalDuration: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            shardBalance: 0
        };

        for (const report of reports) {
            merged.totalTests += report.testsRun;
            merged.totalDuration = Math.max(merged.totalDuration, report.duration);
            merged.passed += report.passed;
            merged.failed += report.failed;
            merged.skipped += report.skipped;
        }

        // Calculate balance (how evenly distributed durations are)
        if (reports.length > 1) {
            const durations = reports.map(r => r.duration);
            const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
            const variance = durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / durations.length;
            const stdDev = Math.sqrt(variance);
            merged.shardBalance = 1 - (stdDev / avg); // 1 = perfect balance, 0 = very unbalanced
        } else {
            merged.shardBalance = 1;
        }

        return merged;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE - SHARDING STRATEGIES
    // ─────────────────────────────────────────────────────────────────────────

    private shardByCount(tests: Test[], shardCount: number): Shard[] {
        const shards = this.createEmptyShards(shardCount);
        const testsPerShard = Math.ceil(tests.length / shardCount);

        for (let i = 0; i < tests.length; i++) {
            const shardIndex = Math.floor(i / testsPerShard);
            if (shardIndex < shardCount) {
                shards[shardIndex].tests.push(tests[i]);
                shards[shardIndex].estimatedDuration += tests[i].duration || 0;
            }
        }

        return shards;
    }

    private shardByDuration(tests: Test[], shardCount: number): Shard[] {
        const shards = this.createEmptyShards(shardCount);

        // Sort tests by duration (longest first) for better balancing
        const sortedTests = [...tests].sort((a, b) => 
            (b.duration || 0) - (a.duration || 0)
        );

        // Greedy assignment: always add to shard with lowest total duration
        for (const test of sortedTests) {
            const targetShard = shards.reduce((min, shard) => 
                shard.estimatedDuration < min.estimatedDuration ? shard : min
            );

            targetShard.tests.push(test);
            targetShard.estimatedDuration += test.duration || 0;
        }

        return shards;
    }

    private shardByFile(tests: Test[], shardCount: number): Shard[] {
        // Group tests by file
        const byFile = new Map<string, Test[]>();
        for (const test of tests) {
            const file = test.file;
            const existing = byFile.get(file) || [];
            existing.push(test);
            byFile.set(file, existing);
        }

        // Create file groups
        const fileGroups = [...byFile.entries()].map(([file, fileTests]) => ({
            file,
            tests: fileTests,
            duration: fileTests.reduce((sum, t) => sum + (t.duration || 0), 0)
        }));

        // Sort by duration and distribute
        fileGroups.sort((a, b) => b.duration - a.duration);

        const shards = this.createEmptyShards(shardCount);
        
        for (const group of fileGroups) {
            const targetShard = shards.reduce((min, shard) =>
                shard.estimatedDuration < min.estimatedDuration ? shard : min
            );

            targetShard.tests.push(...group.tests);
            targetShard.estimatedDuration += group.duration;
        }

        return shards;
    }

    private shardRoundRobin(tests: Test[], shardCount: number): Shard[] {
        const shards = this.createEmptyShards(shardCount);

        for (let i = 0; i < tests.length; i++) {
            const shardIndex = i % shardCount;
            shards[shardIndex].tests.push(tests[i]);
            shards[shardIndex].estimatedDuration += tests[i].duration || 0;
        }

        return shards;
    }

    private shardByHash(tests: Test[], shardCount: number): Shard[] {
        const shards = this.createEmptyShards(shardCount);
        const seed = this.config.seed || 42;

        for (const test of tests) {
            const hash = this.hashString(test.id + seed);
            const shardIndex = Math.abs(hash) % shardCount;
            shards[shardIndex].tests.push(test);
            shards[shardIndex].estimatedDuration += test.duration || 0;
        }

        return shards;
    }

    private shardByWeight(tests: Test[], shardCount: number): Shard[] {
        const shards = this.createEmptyShards(shardCount);

        // Use priority as weight
        const sortedTests = [...tests].sort((a, b) => 
            (b.priority || 0) - (a.priority || 0)
        );

        // High priority tests first, distributed across shards
        for (let i = 0; i < sortedTests.length; i++) {
            const test = sortedTests[i];
            const targetShard = shards.reduce((min, shard) =>
                shard.weight < min.weight ? shard : min
            );

            targetShard.tests.push(test);
            targetShard.estimatedDuration += test.duration || 0;
            targetShard.weight += test.priority || 1;
        }

        return shards;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private createEmptyShards(count: number): Shard[] {
        return Array.from({ length: count }, (_, i) => this.createEmptyShard(i, count));
    }

    private createEmptyShard(index: number, total: number): Shard {
        return {
            index,
            total,
            tests: [],
            estimatedDuration: 0,
            weight: 0
        };
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getShardingEngine = (): ShardingEngine => ShardingEngine.getInstance();

export default ShardingEngine;
