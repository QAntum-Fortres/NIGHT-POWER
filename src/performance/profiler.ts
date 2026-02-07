/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM PERFORMANCE PROFILER                                                 ║
 * ║   "Detailed performance metrics and bottleneck detection"                     ║
 * ║                                                                               ║
 * ║   TODO B #11 - Performance Profiling                                          ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ТИПОВЕ
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProfileMeasurement {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    memory?: MemorySnapshot;
    metadata?: Record<string, unknown>;
    children: ProfileMeasurement[];
}

export interface MemorySnapshot {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
}

export interface ProfileReport {
    measurements: ProfileMeasurement[];
    summary: ProfileSummary;
    hotspots: Hotspot[];
    recommendations: string[];
    generatedAt: string;
}

export interface ProfileSummary {
    totalDuration: number;
    totalMeasurements: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
    p50: number;
    p90: number;
    p99: number;
    memoryDelta: number;
}

export interface Hotspot {
    name: string;
    totalTime: number;
    calls: number;
    avgTime: number;
    percentage: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE PROFILER
// ═══════════════════════════════════════════════════════════════════════════════

export class PerformanceProfiler {
    private static instance: PerformanceProfiler;
    
    private measurements: ProfileMeasurement[] = [];
    private activeStack: ProfileMeasurement[] = [];
    private enabled: boolean = true;
    private initialMemory: MemorySnapshot | null = null;

    private constructor() {
        this.captureInitialMemory();
    }

    static getInstance(): PerformanceProfiler {
        if (!PerformanceProfiler.instance) {
            PerformanceProfiler.instance = new PerformanceProfiler();
        }
        return PerformanceProfiler.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MEASUREMENT API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Start measuring a named operation
     */
    start(name: string, metadata?: Record<string, unknown>): void {
        if (!this.enabled) return;

        const measurement: ProfileMeasurement = {
            name,
            startTime: this.now(),
            memory: this.captureMemory(),
            metadata,
            children: []
        };

        if (this.activeStack.length > 0) {
            // Add as child of current active measurement
            this.activeStack[this.activeStack.length - 1].children.push(measurement);
        } else {
            this.measurements.push(measurement);
        }

        this.activeStack.push(measurement);
    }

    /**
     * End measuring the most recent operation
     */
    end(name?: string): number {
        if (!this.enabled || this.activeStack.length === 0) return 0;

        const measurement = this.activeStack.pop()!;
        
        if (name && measurement.name !== name) {
            console.warn(`[Profiler] Mismatched end: expected "${measurement.name}", got "${name}"`);
        }

        measurement.endTime = this.now();
        measurement.duration = measurement.endTime - measurement.startTime;

        return measurement.duration;
    }

    /**
     * Measure an async operation
     */
    async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
        this.start(name);
        try {
            return await fn();
        } finally {
            this.end(name);
        }
    }

    /**
     * Measure a sync operation
     */
    measureSync<T>(name: string, fn: () => T): T {
        this.start(name);
        try {
            return fn();
        } finally {
            this.end(name);
        }
    }

    /**
     * Mark a point in time (instant event)
     */
    mark(name: string, metadata?: Record<string, unknown>): void {
        if (!this.enabled) return;

        const measurement: ProfileMeasurement = {
            name,
            startTime: this.now(),
            endTime: this.now(),
            duration: 0,
            memory: this.captureMemory(),
            metadata,
            children: []
        };

        if (this.activeStack.length > 0) {
            this.activeStack[this.activeStack.length - 1].children.push(measurement);
        } else {
            this.measurements.push(measurement);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ANALYSIS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate a detailed profile report
     */
    generateReport(): ProfileReport {
        const allDurations = this.collectAllDurations(this.measurements);
        const hotspots = this.calculateHotspots();
        const recommendations = this.generateRecommendations(hotspots);

        const sorted = [...allDurations].sort((a, b) => a - b);
        const summary: ProfileSummary = {
            totalDuration: allDurations.reduce((a, b) => a + b, 0),
            totalMeasurements: allDurations.length,
            avgDuration: allDurations.length > 0 
                ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length 
                : 0,
            maxDuration: Math.max(...allDurations, 0),
            minDuration: Math.min(...allDurations, Infinity) === Infinity 
                ? 0 
                : Math.min(...allDurations),
            p50: this.percentile(sorted, 50),
            p90: this.percentile(sorted, 90),
            p99: this.percentile(sorted, 99),
            memoryDelta: this.calculateMemoryDelta()
        };

        return {
            measurements: this.measurements,
            summary,
            hotspots,
            recommendations,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Find the slowest operations
     */
    getSlowest(n: number = 10): ProfileMeasurement[] {
        const all = this.flattenMeasurements(this.measurements);
        return all
            .filter(m => m.duration !== undefined)
            .sort((a, b) => (b.duration || 0) - (a.duration || 0))
            .slice(0, n);
    }

    /**
     * Get measurements by name pattern
     */
    getByName(pattern: string | RegExp): ProfileMeasurement[] {
        const all = this.flattenMeasurements(this.measurements);
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        return all.filter(m => regex.test(m.name));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONTROL
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Enable profiling
     */
    enable(): void {
        this.enabled = true;
    }

    /**
     * Disable profiling
     */
    disable(): void {
        this.enabled = false;
    }

    /**
     * Clear all measurements
     */
    clear(): void {
        this.measurements = [];
        this.activeStack = [];
        this.captureInitialMemory();
    }

    /**
     * Export to JSON
     */
    toJSON(): string {
        return JSON.stringify(this.generateReport(), null, 2);
    }

    /**
     * Print summary to console
     */
    printSummary(): void {
        const report = this.generateReport();
        
        console.log('\n' + '═'.repeat(60));
        console.log('📊 PERFORMANCE PROFILE SUMMARY');
        console.log('═'.repeat(60));
        
        console.log(`\nTotal Duration: ${report.summary.totalDuration.toFixed(2)}ms`);
        console.log(`Measurements: ${report.summary.totalMeasurements}`);
        console.log(`Avg Duration: ${report.summary.avgDuration.toFixed(2)}ms`);
        console.log(`P50: ${report.summary.p50.toFixed(2)}ms`);
        console.log(`P90: ${report.summary.p90.toFixed(2)}ms`);
        console.log(`P99: ${report.summary.p99.toFixed(2)}ms`);
        console.log(`Memory Delta: ${(report.summary.memoryDelta / 1024 / 1024).toFixed(2)}MB`);

        if (report.hotspots.length > 0) {
            console.log('\n🔥 TOP HOTSPOTS:');
            for (const hotspot of report.hotspots.slice(0, 5)) {
                console.log(`  • ${hotspot.name}: ${hotspot.totalTime.toFixed(2)}ms (${hotspot.percentage.toFixed(1)}%)`);
            }
        }

        if (report.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            for (const rec of report.recommendations) {
                console.log(`  • ${rec}`);
            }
        }

        console.log('\n' + '═'.repeat(60) + '\n');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE
    // ─────────────────────────────────────────────────────────────────────────

    private now(): number {
        if (typeof performance !== 'undefined') {
            return performance.now();
        }
        return Date.now();
    }

    private captureMemory(): MemorySnapshot | undefined {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const mem = process.memoryUsage();
            return {
                heapUsed: mem.heapUsed,
                heapTotal: mem.heapTotal,
                external: mem.external,
                rss: mem.rss
            };
        }
        return undefined;
    }

    private captureInitialMemory(): void {
        this.initialMemory = this.captureMemory() || null;
    }

    private calculateMemoryDelta(): number {
        if (!this.initialMemory) return 0;
        const current = this.captureMemory();
        if (!current) return 0;
        return current.heapUsed - this.initialMemory.heapUsed;
    }

    private collectAllDurations(measurements: ProfileMeasurement[]): number[] {
        const durations: number[] = [];
        
        const collect = (m: ProfileMeasurement): void => {
            if (m.duration !== undefined) {
                durations.push(m.duration);
            }
            m.children.forEach(collect);
        };

        measurements.forEach(collect);
        return durations;
    }

    private flattenMeasurements(measurements: ProfileMeasurement[]): ProfileMeasurement[] {
        const result: ProfileMeasurement[] = [];
        
        const flatten = (m: ProfileMeasurement): void => {
            result.push(m);
            m.children.forEach(flatten);
        };

        measurements.forEach(flatten);
        return result;
    }

    private calculateHotspots(): Hotspot[] {
        const byName = new Map<string, { totalTime: number; calls: number }>();
        const totalTime = this.collectAllDurations(this.measurements).reduce((a, b) => a + b, 0);

        const process = (m: ProfileMeasurement): void => {
            if (m.duration !== undefined) {
                const existing = byName.get(m.name) || { totalTime: 0, calls: 0 };
                existing.totalTime += m.duration;
                existing.calls += 1;
                byName.set(m.name, existing);
            }
            m.children.forEach(process);
        };

        this.measurements.forEach(process);

        return [...byName.entries()]
            .map(([name, data]) => ({
                name,
                totalTime: data.totalTime,
                calls: data.calls,
                avgTime: data.totalTime / data.calls,
                percentage: totalTime > 0 ? (data.totalTime / totalTime) * 100 : 0
            }))
            .sort((a, b) => b.totalTime - a.totalTime);
    }

    private generateRecommendations(hotspots: Hotspot[]): string[] {
        const recommendations: string[] = [];

        // Check for slow operations
        for (const hotspot of hotspots.slice(0, 3)) {
            if (hotspot.percentage > 30) {
                recommendations.push(
                    `"${hotspot.name}" takes ${hotspot.percentage.toFixed(1)}% of total time - consider optimization`
                );
            }
            if (hotspot.calls > 100 && hotspot.avgTime > 1) {
                recommendations.push(
                    `"${hotspot.name}" called ${hotspot.calls} times with ${hotspot.avgTime.toFixed(2)}ms avg - consider caching`
                );
            }
        }

        // Memory recommendations
        const memDelta = this.calculateMemoryDelta();
        if (memDelta > 50 * 1024 * 1024) { // > 50MB
            recommendations.push(
                `Memory increased by ${(memDelta / 1024 / 1024).toFixed(1)}MB - check for memory leaks`
            );
        }

        return recommendations;
    }

    private percentile(sorted: number[], p: number): number {
        if (sorted.length === 0) return 0;
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Decorator to automatically profile a method
 */
export function Profile(name?: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;
        const profileName = name || `${target.constructor.name}.${propertyKey}`;

        descriptor.value = async function (...args: any[]) {
            const profiler = PerformanceProfiler.getInstance();
            return profiler.measure(profileName, () => originalMethod.apply(this, args));
        };

        return descriptor;
    };
}

/**
 * Decorator for sync methods
 */
export function ProfileSync(name?: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;
        const profileName = name || `${target.constructor.name}.${propertyKey}`;

        descriptor.value = function (...args: any[]) {
            const profiler = PerformanceProfiler.getInstance();
            return profiler.measureSync(profileName, () => originalMethod.apply(this, args));
        };

        return descriptor;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getProfiler = (): PerformanceProfiler => PerformanceProfiler.getInstance();

export default PerformanceProfiler;
