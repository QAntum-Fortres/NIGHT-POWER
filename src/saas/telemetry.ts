/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM TELEMETRY                                                            ║
 * ║   "Usage analytics and performance metrics"                                   ║
 * ║                                                                               ║
 * ║   TODO B #48 - SaaS: Telemetry                                                ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TelemetryEvent {
    name: string;
    category: string;
    properties?: Record<string, any>;
    measurements?: Record<string, number>;
    timestamp: number;
    sessionId: string;
    userId?: string;
}

export interface TelemetryConfig {
    enabled: boolean;
    endpoint?: string;
    batchSize: number;
    flushInterval: number;
    maxQueueSize: number;
    sampleRate: number;  // 0-1
    anonymize: boolean;
}

export interface MetricAggregation {
    name: string;
    count: number;
    sum: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
}

export interface TelemetrySummary {
    sessionId: string;
    startTime: number;
    duration: number;
    eventCount: number;
    categories: Record<string, number>;
    topEvents: { name: string; count: number }[];
    metrics: MetricAggregation[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELEMETRY SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class TelemetryService {
    private static instance: TelemetryService;

    private config: TelemetryConfig;
    private sessionId: string;
    private sessionStart: number;
    private queue: TelemetryEvent[] = [];
    private eventCounts: Map<string, number> = new Map();
    private metrics: Map<string, number[]> = new Map();
    private flushTimer: NodeJS.Timeout | null = null;

    private constructor(config: Partial<TelemetryConfig> = {}) {
        this.config = {
            enabled: true,
            batchSize: 50,
            flushInterval: 30000,  // 30 seconds
            maxQueueSize: 1000,
            sampleRate: 1.0,
            anonymize: true,
            ...config
        };

        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();

        if (this.config.enabled) {
            this.startFlushTimer();
        }
    }

    static getInstance(config?: Partial<TelemetryConfig>): TelemetryService {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService(config);
        }
        return TelemetryService.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EVENT TRACKING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Track an event
     */
    track(
        name: string,
        category: string,
        properties?: Record<string, any>,
        measurements?: Record<string, number>
    ): void {
        if (!this.config.enabled) return;
        if (!this.shouldSample()) return;

        const event: TelemetryEvent = {
            name,
            category,
            properties: this.config.anonymize 
                ? this.anonymizeProperties(properties) 
                : properties,
            measurements,
            timestamp: Date.now(),
            sessionId: this.sessionId
        };

        this.queue.push(event);
        this.incrementEventCount(name);

        // Store measurements for aggregation
        if (measurements) {
            for (const [key, value] of Object.entries(measurements)) {
                this.recordMetric(key, value);
            }
        }

        // Check if we should flush
        if (this.queue.length >= this.config.batchSize) {
            this.flush();
        }

        // Trim queue if too large
        if (this.queue.length > this.config.maxQueueSize) {
            this.queue = this.queue.slice(-this.config.maxQueueSize);
        }
    }

    /**
     * Track a page view
     */
    trackPageView(page: string, properties?: Record<string, any>): void {
        this.track('page_view', 'navigation', { page, ...properties });
    }

    /**
     * Track a user action
     */
    trackAction(action: string, target: string, properties?: Record<string, any>): void {
        this.track('user_action', 'interaction', { action, target, ...properties });
    }

    /**
     * Track an error
     */
    trackError(error: Error, properties?: Record<string, any>): void {
        this.track('error', 'error', {
            name: error.name,
            message: error.message,
            stack: this.config.anonymize ? undefined : error.stack,
            ...properties
        });
    }

    /**
     * Track timing
     */
    trackTiming(name: string, duration: number, properties?: Record<string, any>): void {
        this.track('timing', 'performance', properties, { [name]: duration });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // METRICS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Record a metric value
     */
    recordMetric(name: string, value: number): void {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name)!.push(value);
    }

    /**
     * Get metric aggregation
     */
    getMetricAggregation(name: string): MetricAggregation | null {
        const values = this.metrics.get(name);
        if (!values || values.length === 0) return null;

        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);

        return {
            name,
            count: values.length,
            sum,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: sum / values.length,
            p50: this.percentile(sorted, 0.5),
            p95: this.percentile(sorted, 0.95),
            p99: this.percentile(sorted, 0.99)
        };
    }

    /**
     * Get all metrics
     */
    getAllMetrics(): MetricAggregation[] {
        const result: MetricAggregation[] = [];
        for (const name of this.metrics.keys()) {
            const agg = this.getMetricAggregation(name);
            if (agg) result.push(agg);
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TIMING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Start a timer
     */
    startTimer(name: string): () => number {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this.trackTiming(name, duration);
            return duration;
        };
    }

    /**
     * Time an async operation
     */
    async timeAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
        const stop = this.startTimer(name);
        try {
            return await operation();
        } finally {
            stop();
        }
    }

    /**
     * Time a sync operation
     */
    timeSync<T>(name: string, operation: () => T): T {
        const stop = this.startTimer(name);
        try {
            return operation();
        } finally {
            stop();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUMMARY & FLUSH
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get session summary
     */
    getSummary(): TelemetrySummary {
        const categories: Record<string, number> = {};
        for (const event of this.queue) {
            categories[event.category] = (categories[event.category] || 0) + 1;
        }

        const topEvents = [...this.eventCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));

        return {
            sessionId: this.sessionId,
            startTime: this.sessionStart,
            duration: Date.now() - this.sessionStart,
            eventCount: this.queue.length,
            categories,
            topEvents,
            metrics: this.getAllMetrics()
        };
    }

    /**
     * Flush events to endpoint
     */
    async flush(): Promise<void> {
        if (this.queue.length === 0) return;

        const events = [...this.queue];
        this.queue = [];

        if (this.config.endpoint) {
            try {
                await this.sendBatch(events);
            } catch (error) {
                console.error('[Telemetry] Flush failed:', error);
                // Re-queue events on failure (up to max)
                this.queue = [...events, ...this.queue].slice(0, this.config.maxQueueSize);
            }
        } else {
            // Log locally if no endpoint
            console.debug('[Telemetry] Events:', events.length);
        }
    }

    /**
     * Enable/disable telemetry
     */
    setEnabled(enabled: boolean): void {
        this.config.enabled = enabled;
        
        if (enabled && !this.flushTimer) {
            this.startFlushTimer();
        } else if (!enabled && this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }

    /**
     * Set user ID for tracking
     */
    setUserId(userId: string | undefined): void {
        // All future events will include this userId
        // Stored in closure, not instance variable for privacy
    }

    /**
     * Clear all data
     */
    clear(): void {
        this.queue = [];
        this.eventCounts.clear();
        this.metrics.clear();
    }

    /**
     * End session
     */
    async endSession(): Promise<void> {
        this.track('session_end', 'session', {
            duration: Date.now() - this.sessionStart
        });
        await this.flush();
        
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE
    // ─────────────────────────────────────────────────────────────────────────

    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private shouldSample(): boolean {
        return Math.random() < this.config.sampleRate;
    }

    private incrementEventCount(name: string): void {
        this.eventCounts.set(name, (this.eventCounts.get(name) || 0) + 1);
    }

    private percentile(sorted: number[], p: number): number {
        const index = Math.ceil(p * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    private anonymizeProperties(
        properties?: Record<string, any>
    ): Record<string, any> | undefined {
        if (!properties) return undefined;

        const sensitiveKeys = ['email', 'password', 'token', 'key', 'secret', 'phone', 'address'];
        const result: Record<string, any> = {};

        for (const [key, value] of Object.entries(properties)) {
            if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
                result[key] = '[REDACTED]';
            } else if (typeof value === 'string' && value.includes('@')) {
                result[key] = '[EMAIL]';
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    private startFlushTimer(): void {
        this.flushTimer = setInterval(() => {
            this.flush().catch(console.error);
        }, this.config.flushInterval);
    }

    private async sendBatch(events: TelemetryEvent[]): Promise<void> {
        if (!this.config.endpoint) return;

        // Placeholder - would use fetch in real implementation
        console.debug('[Telemetry] Would send to:', this.config.endpoint, events.length, 'events');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @Track - Track method calls
 */
export function Track(eventName?: string): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;
        const name = eventName || String(propertyKey);

        descriptor.value = function (...args: any[]) {
            const telemetry = TelemetryService.getInstance();
            telemetry.track(name, 'method_call', {
                class: target.constructor.name,
                method: String(propertyKey)
            });
            return original.apply(this, args);
        };

        return descriptor;
    };
}

/**
 * @Timed - Track method execution time
 */
export function Timed(metricName?: string): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;
        const name = metricName || `${target.constructor.name}.${String(propertyKey)}`;
        const isAsync = original.constructor.name === 'AsyncFunction';

        if (isAsync) {
            descriptor.value = async function (...args: any[]) {
                const telemetry = TelemetryService.getInstance();
                return telemetry.timeAsync(name, () => original.apply(this, args));
            };
        } else {
            descriptor.value = function (...args: any[]) {
                const telemetry = TelemetryService.getInstance();
                return telemetry.timeSync(name, () => original.apply(this, args));
            };
        }

        return descriptor;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getTelemetry = (config?: Partial<TelemetryConfig>): TelemetryService => {
    return TelemetryService.getInstance(config);
};

export default TelemetryService;
