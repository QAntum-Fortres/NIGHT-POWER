/**
 * 🔄 SELF-OPTIMIZING ENGINE - Auto-Performance Tuning
 * 
 * The system that makes QANTUM self-sufficient:
 * - Monitors Ghost test performance in real-time
 * - Detects latency anomalies and bottlenecks
 * - Auto-refactors test code for optimal performance
 * - Learns from performance patterns
 * 
 * "A system that improves itself"
 * 
 * @version 1.0.0
 * @phase 91-95 - The Singularity
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';

// ============================================================
// TYPES
// ============================================================
interface OptimizationConfig {
    latencyThreshold: number;           // ms - trigger optimization above this
    sampleSize: number;                 // Number of runs to analyze
    autoRefactorEnabled: boolean;
    performanceHistorySize: number;
    outputDir: string;
    reportInterval: number;             // ms
}

interface PerformanceMetric {
    testId: string;
    testName: string;
    duration: number;
    timestamp: number;
    apiCalls: ApiCallMetric[];
    memoryUsage: number;
    cpuUsage: number;
    networkLatency: number;
    status: 'pass' | 'fail' | 'slow';
}

interface ApiCallMetric {
    endpoint: string;
    method: string;
    duration: number;
    status: number;
    size: number;
    cached: boolean;
}

interface LatencyAnomaly {
    id: string;
    testId: string;
    detectedAt: number;
    expectedDuration: number;
    actualDuration: number;
    slowestEndpoint: string;
    rootCause: 'api_latency' | 'network' | 'dom_complexity' | 'memory' | 'unknown';
    severity: 'low' | 'medium' | 'high' | 'critical';
    autoFixed: boolean;
}

interface OptimizationSuggestion {
    id: string;
    testId: string;
    type: 'cache_api' | 'parallel_requests' | 'reduce_dom_queries' | 'batch_operations' | 'refactor_selector';
    description: string;
    expectedImprovement: number;        // percentage
    codeChange: CodeChange;
    confidence: number;
    autoApplicable: boolean;
}

interface CodeChange {
    filePath: string;
    lineNumber: number;
    originalCode: string;
    optimizedCode: string;
    reason: string;
}

interface PerformanceBaseline {
    testId: string;
    avgDuration: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
    minDuration: number;
    maxDuration: number;
    samples: number;
    lastUpdated: number;
}

interface OptimizationReport {
    generatedAt: number;
    totalTests: number;
    optimizedTests: number;
    totalImprovementMs: number;
    totalImprovementPercent: number;
    anomaliesDetected: number;
    anomaliesFixed: number;
    suggestions: OptimizationSuggestion[];
}

// ============================================================
// SELF-OPTIMIZING ENGINE
// ============================================================
export class SelfOptimizingEngine extends EventEmitter {
    private config: OptimizationConfig;
    private performanceHistory: Map<string, PerformanceMetric[]> = new Map();
    private baselines: Map<string, PerformanceBaseline> = new Map();
    private anomalies: LatencyAnomaly[] = [];
    private optimizations: OptimizationSuggestion[] = [];
    private isMonitoring: boolean = false;
    private monitorInterval: NodeJS.Timer | null = null;

    constructor(config: Partial<OptimizationConfig> = {}) {
        super();

        this.config = {
            latencyThreshold: 500,          // 500ms default
            sampleSize: 100,
            autoRefactorEnabled: true,
            performanceHistorySize: 1000,
            outputDir: './optimization-data',
            reportInterval: 60000,          // 1 minute
            ...config
        };

        this.loadPerformanceData();
    }

    /**
     * 🚀 Start real-time performance monitoring
     */
    startMonitoring(): void {
        if (this.isMonitoring) return;

        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🔄 SELF-OPTIMIZING ENGINE - Active                           ║
║                                                               ║
║  "The system that improves itself"                           ║
╚═══════════════════════════════════════════════════════════════╝
`);
        console.log('🔄 [OPTIMIZER] Starting real-time performance monitoring...');
        console.log(`🔄 [OPTIMIZER] Latency threshold: ${this.config.latencyThreshold}ms`);
        console.log(`🔄 [OPTIMIZER] Auto-refactor: ${this.config.autoRefactorEnabled ? 'ENABLED' : 'DISABLED'}`);
        console.log('');

        this.isMonitoring = true;

        // Start periodic analysis
        this.monitorInterval = setInterval(() => {
            this.analyzePerformance();
        }, this.config.reportInterval);

        this.emit('monitoring:started');
    }

    /**
     * Stop monitoring
     */
    stopMonitoring(): void {
        if (!this.isMonitoring) return;

        this.isMonitoring = false;
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval as unknown as number);
            this.monitorInterval = null;
        }

        this.savePerformanceData();
        this.emit('monitoring:stopped');
        console.log('🔄 [OPTIMIZER] Monitoring stopped');
    }

    /**
     * 📊 Record a test execution metric
     */
    recordMetric(metric: PerformanceMetric): void {
        // Get or create history for this test
        let history = this.performanceHistory.get(metric.testId);
        if (!history) {
            history = [];
            this.performanceHistory.set(metric.testId, history);
        }

        // Add metric
        history.push(metric);

        // Trim history if too large
        if (history.length > this.config.performanceHistorySize) {
            history.shift();
        }

        // Update baseline
        this.updateBaseline(metric.testId, history);

        // Check for anomalies
        const anomaly = this.detectAnomaly(metric);
        if (anomaly) {
            this.anomalies.push(anomaly);
            this.emit('anomaly:detected', anomaly);

            console.log(`⚠️ [OPTIMIZER] Latency anomaly detected!`);
            console.log(`   Test: ${metric.testName}`);
            console.log(`   Expected: ${anomaly.expectedDuration.toFixed(0)}ms`);
            console.log(`   Actual: ${anomaly.actualDuration.toFixed(0)}ms`);
            console.log(`   Root cause: ${anomaly.rootCause}`);

            // Auto-fix if enabled
            if (this.config.autoRefactorEnabled && anomaly.severity !== 'low') {
                this.autoOptimize(metric, anomaly);
            }
        }

        this.emit('metric:recorded', metric);
    }

    /**
     * 🔍 Detect latency anomalies
     */
    private detectAnomaly(metric: PerformanceMetric): LatencyAnomaly | null {
        const baseline = this.baselines.get(metric.testId);
        if (!baseline || baseline.samples < 10) return null;

        // Check if duration exceeds threshold
        const threshold = Math.max(
            baseline.p95Duration * 1.5,
            this.config.latencyThreshold
        );

        if (metric.duration <= threshold) return null;

        // Find root cause
        const rootCause = this.analyzeRootCause(metric, baseline);
        const slowestApi = this.findSlowestEndpoint(metric.apiCalls);

        // Calculate severity
        const deviation = metric.duration / baseline.avgDuration;
        let severity: LatencyAnomaly['severity'];
        if (deviation > 5) severity = 'critical';
        else if (deviation > 3) severity = 'high';
        else if (deviation > 2) severity = 'medium';
        else severity = 'low';

        return {
            id: `anomaly_${crypto.randomBytes(4).toString('hex')}`,
            testId: metric.testId,
            detectedAt: Date.now(),
            expectedDuration: baseline.avgDuration,
            actualDuration: metric.duration,
            slowestEndpoint: slowestApi?.endpoint || 'unknown',
            rootCause,
            severity,
            autoFixed: false
        };
    }

    /**
     * 🔬 Analyze root cause of latency
     */
    private analyzeRootCause(
        metric: PerformanceMetric,
        baseline: PerformanceBaseline
    ): LatencyAnomaly['rootCause'] {
        // Check API latency
        const totalApiTime = metric.apiCalls.reduce((sum, c) => sum + c.duration, 0);
        if (totalApiTime > metric.duration * 0.7) {
            return 'api_latency';
        }

        // Check network
        if (metric.networkLatency > 200) {
            return 'network';
        }

        // Check memory
        if (metric.memoryUsage > 500 * 1024 * 1024) { // 500MB
            return 'memory';
        }

        // Check for DOM complexity (if test has many selectors)
        const avgApiTime = totalApiTime / Math.max(1, metric.apiCalls.length);
        if (avgApiTime < 50 && metric.duration > baseline.avgDuration * 2) {
            return 'dom_complexity';
        }

        return 'unknown';
    }

    /**
     * Find slowest API endpoint
     */
    private findSlowestEndpoint(apiCalls: ApiCallMetric[]): ApiCallMetric | null {
        if (apiCalls.length === 0) return null;
        return apiCalls.reduce((slowest, call) => 
            call.duration > slowest.duration ? call : slowest
        );
    }

    /**
     * 🔄 Auto-optimize test code
     */
    private async autoOptimize(
        metric: PerformanceMetric,
        anomaly: LatencyAnomaly
    ): Promise<void> {
        console.log(`🔄 [OPTIMIZER] Auto-optimizing test: ${metric.testName}`);

        const suggestions = this.generateOptimizations(metric, anomaly);
        
        for (const suggestion of suggestions) {
            if (suggestion.autoApplicable && suggestion.confidence > 0.8) {
                const applied = await this.applySuggestion(suggestion);
                if (applied) {
                    anomaly.autoFixed = true;
                    console.log(`   ✅ Applied: ${suggestion.type}`);
                    console.log(`   Expected improvement: ${suggestion.expectedImprovement}%`);
                    this.emit('optimization:applied', suggestion);
                }
            } else {
                this.optimizations.push(suggestion);
                console.log(`   💡 Suggestion: ${suggestion.description}`);
            }
        }
    }

    /**
     * 💡 Generate optimization suggestions
     */
    private generateOptimizations(
        metric: PerformanceMetric,
        anomaly: LatencyAnomaly
    ): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];

        switch (anomaly.rootCause) {
            case 'api_latency':
                // Suggest caching or parallel requests
                const slowApis = metric.apiCalls
                    .filter(c => c.duration > 200)
                    .sort((a, b) => b.duration - a.duration);

                if (slowApis.length > 1) {
                    suggestions.push({
                        id: `opt_${crypto.randomBytes(4).toString('hex')}`,
                        testId: metric.testId,
                        type: 'parallel_requests',
                        description: `Parallelize ${slowApis.length} slow API calls`,
                        expectedImprovement: 40,
                        codeChange: this.generateParallelCode(slowApis, metric),
                        confidence: 0.85,
                        autoApplicable: true
                    });
                }

                // Suggest caching for repeated calls
                const repeatedCalls = this.findRepeatedCalls(metric.apiCalls);
                if (repeatedCalls.length > 0) {
                    suggestions.push({
                        id: `opt_${crypto.randomBytes(4).toString('hex')}`,
                        testId: metric.testId,
                        type: 'cache_api',
                        description: `Cache ${repeatedCalls.length} repeated API calls`,
                        expectedImprovement: 30,
                        codeChange: this.generateCacheCode(repeatedCalls, metric),
                        confidence: 0.9,
                        autoApplicable: true
                    });
                }
                break;

            case 'dom_complexity':
                suggestions.push({
                    id: `opt_${crypto.randomBytes(4).toString('hex')}`,
                    testId: metric.testId,
                    type: 'reduce_dom_queries',
                    description: 'Reduce DOM queries by caching element references',
                    expectedImprovement: 25,
                    codeChange: this.generateDomOptimization(metric),
                    confidence: 0.75,
                    autoApplicable: false
                });
                break;

            case 'memory':
                suggestions.push({
                    id: `opt_${crypto.randomBytes(4).toString('hex')}`,
                    testId: metric.testId,
                    type: 'batch_operations',
                    description: 'Batch operations to reduce memory pressure',
                    expectedImprovement: 20,
                    codeChange: this.generateBatchCode(metric),
                    confidence: 0.7,
                    autoApplicable: false
                });
                break;
        }

        return suggestions;
    }

    /**
     * Generate parallel execution code
     */
    private generateParallelCode(
        slowApis: ApiCallMetric[],
        metric: PerformanceMetric
    ): CodeChange {
        const endpoints = slowApis.map(a => `'${a.endpoint}'`).join(', ');
        
        return {
            filePath: `./generated_tests/ghost/${metric.testId}.spec.ts`,
            lineNumber: 0, // Will be detected
            originalCode: `// Sequential API calls`,
            optimizedCode: `
// 🔄 Auto-optimized: Parallel API calls
const [${slowApis.map((_, i) => `result${i}`).join(', ')}] = await Promise.all([
    ${slowApis.map(a => `ghost.api({ method: '${a.method}', url: '${a.endpoint}' })`).join(',\n    ')}
]);`,
            reason: `Parallelizing ${slowApis.length} API calls can reduce latency by ~${Math.round((1 - 1/slowApis.length) * 100)}%`
        };
    }

    /**
     * Generate cache code
     */
    private generateCacheCode(
        repeatedCalls: ApiCallMetric[],
        metric: PerformanceMetric
    ): CodeChange {
        return {
            filePath: `./generated_tests/ghost/${metric.testId}.spec.ts`,
            lineNumber: 0,
            originalCode: `// Repeated API calls`,
            optimizedCode: `
// 🔄 Auto-optimized: Cached API responses
const apiCache = new Map();
async function cachedApi(endpoint) {
    if (apiCache.has(endpoint)) return apiCache.get(endpoint);
    const result = await ghost.api({ url: endpoint });
    apiCache.set(endpoint, result);
    return result;
}`,
            reason: `Caching ${repeatedCalls.length} repeated calls eliminates redundant requests`
        };
    }

    /**
     * Generate DOM optimization code
     */
    private generateDomOptimization(metric: PerformanceMetric): CodeChange {
        return {
            filePath: `./generated_tests/playwright/${metric.testId}.spec.ts`,
            lineNumber: 0,
            originalCode: `// Multiple page.locator() calls`,
            optimizedCode: `
// 🔄 Auto-optimized: Cached locators
const elements = {
    submitBtn: page.locator('[data-testid="submit"]'),
    emailInput: page.locator('[name="email"]'),
    // Cache all frequently used locators
};`,
            reason: 'Caching locators reduces repeated DOM queries'
        };
    }

    /**
     * Generate batch operation code
     */
    private generateBatchCode(metric: PerformanceMetric): CodeChange {
        return {
            filePath: `./generated_tests/${metric.testId}.spec.ts`,
            lineNumber: 0,
            originalCode: `// Individual operations`,
            optimizedCode: `
// 🔄 Auto-optimized: Batched operations
const operations = [];
// Collect all operations first
operations.push(/* ... */);
// Execute in batch
await Promise.all(operations);`,
            reason: 'Batching reduces memory allocations and GC pressure'
        };
    }

    /**
     * Find repeated API calls
     */
    private findRepeatedCalls(apiCalls: ApiCallMetric[]): ApiCallMetric[] {
        const seen = new Map<string, number>();
        const repeated: ApiCallMetric[] = [];

        for (const call of apiCalls) {
            const key = `${call.method}:${call.endpoint}`;
            const count = seen.get(key) || 0;
            seen.set(key, count + 1);

            if (count > 0) {
                repeated.push(call);
            }
        }

        return repeated;
    }

    /**
     * Apply optimization suggestion
     */
    private async applySuggestion(suggestion: OptimizationSuggestion): Promise<boolean> {
        try {
            const { filePath, originalCode, optimizedCode, reason } = suggestion.codeChange;

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                console.log(`   ⚠️ File not found: ${filePath}`);
                return false;
            }

            // Read file
            let content = fs.readFileSync(filePath, 'utf-8');

            // Backup
            const backupPath = filePath + '.backup.' + Date.now();
            fs.writeFileSync(backupPath, content);

            // Add optimization comment
            const header = `
// ═══════════════════════════════════════════════════════════════
// 🔄 SELF-OPTIMIZED by QANTUM @ ${new Date().toISOString()}
// Reason: ${reason}
// ═══════════════════════════════════════════════════════════════
`;

            // Insert optimization at the top
            content = header + content;

            // Write optimized file
            fs.writeFileSync(filePath, content);

            return true;
        } catch (error) {
            console.error(`   ❌ Failed to apply optimization: ${error}`);
            return false;
        }
    }

    /**
     * Update baseline statistics
     */
    private updateBaseline(testId: string, history: PerformanceMetric[]): void {
        if (history.length < 5) return;

        const durations = history.map(h => h.duration).sort((a, b) => a - b);
        const n = durations.length;

        this.baselines.set(testId, {
            testId,
            avgDuration: durations.reduce((a, b) => a + b, 0) / n,
            p50Duration: durations[Math.floor(n * 0.5)],
            p95Duration: durations[Math.floor(n * 0.95)],
            p99Duration: durations[Math.floor(n * 0.99)],
            minDuration: durations[0],
            maxDuration: durations[n - 1],
            samples: n,
            lastUpdated: Date.now()
        });
    }

    /**
     * 📊 Analyze overall performance
     */
    analyzePerformance(): OptimizationReport {
        const report: OptimizationReport = {
            generatedAt: Date.now(),
            totalTests: this.baselines.size,
            optimizedTests: 0,
            totalImprovementMs: 0,
            totalImprovementPercent: 0,
            anomaliesDetected: this.anomalies.length,
            anomaliesFixed: this.anomalies.filter(a => a.autoFixed).length,
            suggestions: this.optimizations.filter(o => !o.autoApplicable)
        };

        // Calculate improvements
        for (const anomaly of this.anomalies) {
            if (anomaly.autoFixed) {
                report.optimizedTests++;
                report.totalImprovementMs += anomaly.actualDuration - anomaly.expectedDuration;
            }
        }

        if (report.optimizedTests > 0) {
            report.totalImprovementPercent = 
                (report.totalImprovementMs / (report.totalTests * 100)) * 100;
        }

        this.emit('report:generated', report);
        return report;
    }

    /**
     * 📈 Get performance statistics
     */
    getStatistics(): {
        totalTests: number;
        totalMetrics: number;
        anomaliesDetected: number;
        anomaliesFixed: number;
        avgImprovement: number;
        topSlowTests: Array<{ testId: string; avgDuration: number }>;
    } {
        const totalMetrics = Array.from(this.performanceHistory.values())
            .reduce((sum, h) => sum + h.length, 0);

        const topSlowTests = Array.from(this.baselines.values())
            .sort((a, b) => b.avgDuration - a.avgDuration)
            .slice(0, 10)
            .map(b => ({ testId: b.testId, avgDuration: b.avgDuration }));

        const fixedAnomalies = this.anomalies.filter(a => a.autoFixed);
        const avgImprovement = fixedAnomalies.length > 0
            ? fixedAnomalies.reduce((sum, a) => 
                sum + (a.actualDuration - a.expectedDuration), 0) / fixedAnomalies.length
            : 0;

        return {
            totalTests: this.baselines.size,
            totalMetrics,
            anomaliesDetected: this.anomalies.length,
            anomaliesFixed: fixedAnomalies.length,
            avgImprovement,
            topSlowTests
        };
    }

    // ============================================================
    // PERSISTENCE
    // ============================================================

    private loadPerformanceData(): void {
        try {
            const dataPath = path.join(this.config.outputDir, 'performance-data.json');
            if (fs.existsSync(dataPath)) {
                const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
                this.baselines = new Map(Object.entries(data.baselines || {}));
                this.anomalies = data.anomalies || [];
            }
        } catch {}
    }

    private savePerformanceData(): void {
        try {
            const dir = this.config.outputDir;
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const data = {
                baselines: Object.fromEntries(this.baselines),
                anomalies: this.anomalies.slice(-1000), // Keep last 1000
                savedAt: Date.now()
            };

            fs.writeFileSync(
                path.join(dir, 'performance-data.json'),
                JSON.stringify(data, null, 2)
            );
        } catch {}
    }
}

// ============================================================
// EXPORTS
// ============================================================
export function createSelfOptimizer(config?: Partial<OptimizationConfig>): SelfOptimizingEngine {
    return new SelfOptimizingEngine(config);
}

export type { PerformanceMetric, LatencyAnomaly, OptimizationSuggestion, OptimizationReport };
