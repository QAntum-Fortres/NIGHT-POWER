/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM METRICS COLLECTOR                                                    ║
 * ║   "Collect, aggregate, and analyze test metrics"                              ║
 * ║                                                                               ║
 * ║   TODO B #18 - Metrics: Collection & Aggregation                              ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export interface Metric {
    name: string;
    type: MetricType;
    value: number;
    labels?: Record<string, string>;
    timestamp: number;
}

export interface HistogramBucket {
    le: number;
    count: number;
}

export interface SummaryQuantile {
    quantile: number;
    value: number;
}

export interface MetricSeries {
    name: string;
    type: MetricType;
    samples: Array<{ value: number; timestamp: number }>;
    labels?: Record<string, string>;
}

export interface AggregatedMetric {
    name: string;
    count: number;
    sum: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// METRICS COLLECTOR
// ═══════════════════════════════════════════════════════════════════════════════

export class MetricsCollector {
    private static instance: MetricsCollector;
    private metrics: Map<string, MetricSeries> = new Map();
    private histogramBuckets: Map<string, HistogramBucket[]> = new Map();

    static getInstance(): MetricsCollector {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COUNTERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Increment counter
     */
    increment(name: string, value: number = 1, labels?: Record<string, string>): void {
        const key = this.getKey(name, labels);
        const series = this.getOrCreateSeries(key, name, 'counter', labels);
        
        const lastValue = series.samples.length > 0 
            ? series.samples[series.samples.length - 1].value 
            : 0;

        series.samples.push({
            value: lastValue + value,
            timestamp: Date.now()
        });
    }

    /**
     * Get counter value
     */
    getCounter(name: string, labels?: Record<string, string>): number {
        const key = this.getKey(name, labels);
        const series = this.metrics.get(key);
        
        if (!series || series.samples.length === 0) return 0;
        return series.samples[series.samples.length - 1].value;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GAUGES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Set gauge value
     */
    setGauge(name: string, value: number, labels?: Record<string, string>): void {
        const key = this.getKey(name, labels);
        const series = this.getOrCreateSeries(key, name, 'gauge', labels);

        series.samples.push({
            value,
            timestamp: Date.now()
        });
    }

    /**
     * Increment gauge
     */
    incGauge(name: string, value: number = 1, labels?: Record<string, string>): void {
        const current = this.getGauge(name, labels);
        this.setGauge(name, current + value, labels);
    }

    /**
     * Decrement gauge
     */
    decGauge(name: string, value: number = 1, labels?: Record<string, string>): void {
        const current = this.getGauge(name, labels);
        this.setGauge(name, current - value, labels);
    }

    /**
     * Get gauge value
     */
    getGauge(name: string, labels?: Record<string, string>): number {
        const key = this.getKey(name, labels);
        const series = this.metrics.get(key);
        
        if (!series || series.samples.length === 0) return 0;
        return series.samples[series.samples.length - 1].value;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HISTOGRAMS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Observe histogram value
     */
    observe(name: string, value: number, labels?: Record<string, string>): void {
        const key = this.getKey(name, labels);
        const series = this.getOrCreateSeries(key, name, 'histogram', labels);

        series.samples.push({
            value,
            timestamp: Date.now()
        });

        // Update buckets
        const bucketKey = `${key}:buckets`;
        let buckets = this.histogramBuckets.get(bucketKey);
        
        if (!buckets) {
            buckets = this.createDefaultBuckets();
            this.histogramBuckets.set(bucketKey, buckets);
        }

        for (const bucket of buckets) {
            if (value <= bucket.le) {
                bucket.count++;
            }
        }
    }

    /**
     * Get histogram buckets
     */
    getHistogram(name: string, labels?: Record<string, string>): HistogramBucket[] {
        const key = this.getKey(name, labels);
        return this.histogramBuckets.get(`${key}:buckets`) || [];
    }

    private createDefaultBuckets(): HistogramBucket[] {
        const boundaries = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, Infinity];
        return boundaries.map(le => ({ le, count: 0 }));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TIMING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Time a function
     */
    async time<T>(name: string, fn: () => T | Promise<T>, labels?: Record<string, string>): Promise<T> {
        const start = performance.now();
        try {
            return await fn();
        } finally {
            const duration = (performance.now() - start) / 1000;
            this.observe(name, duration, labels);
        }
    }

    /**
     * Create timer
     */
    startTimer(name: string, labels?: Record<string, string>): () => number {
        const start = performance.now();
        
        return () => {
            const duration = (performance.now() - start) / 1000;
            this.observe(name, duration, labels);
            return duration;
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AGGREGATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Aggregate metrics
     */
    aggregate(name: string, labels?: Record<string, string>): AggregatedMetric | null {
        const key = this.getKey(name, labels);
        const series = this.metrics.get(key);

        if (!series || series.samples.length === 0) return null;

        const values = series.samples.map(s => s.value).sort((a, b) => a - b);
        const sum = values.reduce((acc, v) => acc + v, 0);

        return {
            name,
            count: values.length,
            sum,
            min: values[0],
            max: values[values.length - 1],
            avg: sum / values.length,
            p50: this.percentile(values, 0.5),
            p90: this.percentile(values, 0.9),
            p95: this.percentile(values, 0.95),
            p99: this.percentile(values, 0.99)
        };
    }

    /**
     * Get all aggregated metrics
     */
    aggregateAll(): AggregatedMetric[] {
        const results: AggregatedMetric[] = [];

        for (const [key, series] of this.metrics) {
            if (series.samples.length > 0) {
                const agg = this.aggregate(series.name, series.labels);
                if (agg) results.push(agg);
            }
        }

        return results;
    }

    private percentile(sortedValues: number[], p: number): number {
        const index = Math.ceil(sortedValues.length * p) - 1;
        return sortedValues[Math.max(0, index)];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXPORT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Export as Prometheus format
     */
    exportPrometheus(): string {
        const lines: string[] = [];

        for (const [key, series] of this.metrics) {
            const labelStr = series.labels 
                ? `{${Object.entries(series.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
                : '';

            if (series.type === 'counter' || series.type === 'gauge') {
                const lastValue = series.samples[series.samples.length - 1]?.value || 0;
                lines.push(`# TYPE ${series.name} ${series.type}`);
                lines.push(`${series.name}${labelStr} ${lastValue}`);
            } else if (series.type === 'histogram') {
                const buckets = this.histogramBuckets.get(`${key}:buckets`) || [];
                const sum = series.samples.reduce((acc, s) => acc + s.value, 0);
                
                lines.push(`# TYPE ${series.name} histogram`);
                for (const bucket of buckets) {
                    const bucketLabel = bucket.le === Infinity ? '+Inf' : bucket.le.toString();
                    lines.push(`${series.name}_bucket{le="${bucketLabel}"${labelStr ? ',' + labelStr.slice(1, -1) : ''}} ${bucket.count}`);
                }
                lines.push(`${series.name}_sum${labelStr} ${sum}`);
                lines.push(`${series.name}_count${labelStr} ${series.samples.length}`);
            }
        }

        return lines.join('\n');
    }

    /**
     * Export as JSON
     */
    exportJSON(): object {
        const result: Record<string, any> = {};

        for (const [key, series] of this.metrics) {
            result[key] = {
                name: series.name,
                type: series.type,
                labels: series.labels,
                samples: series.samples,
                aggregated: this.aggregate(series.name, series.labels)
            };
        }

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Clear all metrics
     */
    clear(): void {
        this.metrics.clear();
        this.histogramBuckets.clear();
    }

    /**
     * Remove specific metric
     */
    remove(name: string, labels?: Record<string, string>): void {
        const key = this.getKey(name, labels);
        this.metrics.delete(key);
        this.histogramBuckets.delete(`${key}:buckets`);
    }

    /**
     * Get all metric names
     */
    getNames(): string[] {
        return [...new Set([...this.metrics.values()].map(s => s.name))];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private getKey(name: string, labels?: Record<string, string>): string {
        if (!labels || Object.keys(labels).length === 0) {
            return name;
        }
        const labelParts = Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join(',');
        return `${name}{${labelParts}}`;
    }

    private getOrCreateSeries(
        key: string, 
        name: string, 
        type: MetricType, 
        labels?: Record<string, string>
    ): MetricSeries {
        let series = this.metrics.get(key);
        
        if (!series) {
            series = { name, type, samples: [], labels };
            this.metrics.set(key, series);
        }

        return series;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Count method calls
 */
export function Counted(name?: string): MethodDecorator {
    return function(_target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const original = descriptor.value;
        const metricName = name || `method_calls_${String(propertyKey)}`;

        descriptor.value = function(...args: any[]) {
            MetricsCollector.getInstance().increment(metricName);
            return original.apply(this, args);
        };

        return descriptor;
    };
}

/**
 * Time method execution
 */
export function Timed(name?: string): MethodDecorator {
    return function(_target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const original = descriptor.value;
        const metricName = name || `method_duration_${String(propertyKey)}`;

        descriptor.value = async function(...args: any[]) {
            const endTimer = MetricsCollector.getInstance().startTimer(metricName);
            try {
                return await original.apply(this, args);
            } finally {
                endTimer();
            }
        };

        return descriptor;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getMetricsCollector = (): MetricsCollector => MetricsCollector.getInstance();

export default MetricsCollector;
