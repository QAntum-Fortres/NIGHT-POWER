/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: METRICS & MONITORING
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Prometheus-compatible metrics, performance monitoring, alerting
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export interface MetricConfig {
  name: string;
  help: string;
  type: MetricType;
  labels?: string[];
  buckets?: number[];  // For histogram
  percentiles?: number[];  // For summary
}

export interface MetricValue {
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

export interface AlertRule {
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration?: number;  // ms
  labels?: Record<string, string>;
  handler: (alert: Alert) => void;
}

export interface Alert {
  rule: string;
  metric: string;
  value: number;
  threshold: number;
  labels: Record<string, string>;
  timestamp: Date;
  status: 'firing' | 'resolved';
}

// ═══════════════════════════════════════════════════════════════════════════════
// METRIC IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

abstract class Metric {
  protected config: MetricConfig;
  protected values: Map<string, number> = new Map();

  constructor(config: MetricConfig) {
    this.config = config;
  }

  abstract collect(): string;

  protected labelsKey(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  protected formatLabels(labelsKey: string): string {
    return labelsKey ? `{${labelsKey}}` : '';
  }
}

export class Counter extends Metric {
  constructor(config: Omit<MetricConfig, 'type'>) {
    super({ ...config, type: 'counter' });
  }

  inc(labels?: Record<string, string>, value: number = 1): void {
    if (value < 0) {
      throw new Error('Counter can only be incremented');
    }
    const key = this.labelsKey(labels);
    this.values.set(key, (this.values.get(key) || 0) + value);
  }

  get(labels?: Record<string, string>): number {
    return this.values.get(this.labelsKey(labels)) || 0;
  }

  reset(labels?: Record<string, string>): void {
    this.values.delete(this.labelsKey(labels));
  }

  collect(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.config.name} ${this.config.help}`);
    lines.push(`# TYPE ${this.config.name} counter`);

    for (const [key, value] of this.values) {
      lines.push(`${this.config.name}${this.formatLabels(key)} ${value}`);
    }

    return lines.join('\n');
  }
}

export class Gauge extends Metric {
  constructor(config: Omit<MetricConfig, 'type'>) {
    super({ ...config, type: 'gauge' });
  }

  set(value: number, labels?: Record<string, string>): void {
    this.values.set(this.labelsKey(labels), value);
  }

  inc(labels?: Record<string, string>, value: number = 1): void {
    const key = this.labelsKey(labels);
    this.values.set(key, (this.values.get(key) || 0) + value);
  }

  dec(labels?: Record<string, string>, value: number = 1): void {
    const key = this.labelsKey(labels);
    this.values.set(key, (this.values.get(key) || 0) - value);
  }

  get(labels?: Record<string, string>): number {
    return this.values.get(this.labelsKey(labels)) || 0;
  }

  setToCurrentTime(labels?: Record<string, string>): void {
    this.set(Date.now() / 1000, labels);
  }

  collect(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.config.name} ${this.config.help}`);
    lines.push(`# TYPE ${this.config.name} gauge`);

    for (const [key, value] of this.values) {
      lines.push(`${this.config.name}${this.formatLabels(key)} ${value}`);
    }

    return lines.join('\n');
  }
}

export class Histogram extends Metric {
  private bucketValues: Map<string, Map<number, number>> = new Map();
  private sums: Map<string, number> = new Map();
  private counts: Map<string, number> = new Map();
  private buckets: number[];

  constructor(config: Omit<MetricConfig, 'type'> & { buckets?: number[] }) {
    super({ ...config, type: 'histogram' });
    this.buckets = config.buckets || [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
  }

  observe(value: number, labels?: Record<string, string>): void {
    const key = this.labelsKey(labels);

    // Update sum and count
    this.sums.set(key, (this.sums.get(key) || 0) + value);
    this.counts.set(key, (this.counts.get(key) || 0) + 1);

    // Update buckets
    if (!this.bucketValues.has(key)) {
      this.bucketValues.set(key, new Map());
    }
    const buckets = this.bucketValues.get(key)!;

    for (const bucket of this.buckets) {
      if (value <= bucket) {
        buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
      }
    }
  }

  timer(labels?: Record<string, string>): () => number {
    const start = process.hrtime.bigint();
    return () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1e9;
      this.observe(duration, labels);
      return duration;
    };
  }

  collect(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.config.name} ${this.config.help}`);
    lines.push(`# TYPE ${this.config.name} histogram`);

    for (const [key, buckets] of this.bucketValues) {
      let cumulativeCount = 0;
      
      for (const bucket of [...this.buckets, Infinity]) {
        cumulativeCount += buckets.get(bucket) || 0;
        const le = bucket === Infinity ? '+Inf' : bucket.toString();
        const labelsStr = key 
          ? `{${key},le="${le}"}` 
          : `{le="${le}"}`;
        lines.push(`${this.config.name}_bucket${labelsStr} ${cumulativeCount}`);
      }

      const labelsFormatted = key ? `{${key}}` : '';
      lines.push(`${this.config.name}_sum${labelsFormatted} ${this.sums.get(key) || 0}`);
      lines.push(`${this.config.name}_count${labelsFormatted} ${this.counts.get(key) || 0}`);
    }

    return lines.join('\n');
  }
}

export class Summary extends Metric {
  private observations: Map<string, number[]> = new Map();
  private percentiles: number[];

  constructor(config: Omit<MetricConfig, 'type'> & { percentiles?: number[] }) {
    super({ ...config, type: 'summary' });
    this.percentiles = config.percentiles || [0.5, 0.9, 0.95, 0.99];
  }

  observe(value: number, labels?: Record<string, string>): void {
    const key = this.labelsKey(labels);

    if (!this.observations.has(key)) {
      this.observations.set(key, []);
    }

    this.observations.get(key)!.push(value);
  }

  collect(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.config.name} ${this.config.help}`);
    lines.push(`# TYPE ${this.config.name} summary`);

    for (const [key, values] of this.observations) {
      if (values.length === 0) continue;

      const sorted = [...values].sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);

      for (const p of this.percentiles) {
        const idx = Math.ceil(p * sorted.length) - 1;
        const labelsStr = key 
          ? `{${key},quantile="${p}"}` 
          : `{quantile="${p}"}`;
        lines.push(`${this.config.name}${labelsStr} ${sorted[Math.max(0, idx)]}`);
      }

      const labelsFormatted = key ? `{${key}}` : '';
      lines.push(`${this.config.name}_sum${labelsFormatted} ${sum}`);
      lines.push(`${this.config.name}_count${labelsFormatted} ${values.length}`);
    }

    return lines.join('\n');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// METRICS REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

export class MetricsRegistry {
  private metrics: Map<string, Metric> = new Map();
  private prefix: string;

  constructor(prefix: string = 'mind_engine') {
    this.prefix = prefix;
  }

  createCounter(config: Omit<MetricConfig, 'type'>): Counter {
    const counter = new Counter({
      ...config,
      name: `${this.prefix}_${config.name}`
    });
    this.metrics.set(config.name, counter);
    return counter;
  }

  createGauge(config: Omit<MetricConfig, 'type'>): Gauge {
    const gauge = new Gauge({
      ...config,
      name: `${this.prefix}_${config.name}`
    });
    this.metrics.set(config.name, gauge);
    return gauge;
  }

  createHistogram(config: Omit<MetricConfig, 'type'> & { buckets?: number[] }): Histogram {
    const histogram = new Histogram({
      ...config,
      name: `${this.prefix}_${config.name}`
    });
    this.metrics.set(config.name, histogram);
    return histogram;
  }

  createSummary(config: Omit<MetricConfig, 'type'> & { percentiles?: number[] }): Summary {
    const summary = new Summary({
      ...config,
      name: `${this.prefix}_${config.name}`
    });
    this.metrics.set(config.name, summary);
    return summary;
  }

  getMetric(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  collect(): string {
    const outputs: string[] = [];

    for (const metric of this.metrics.values()) {
      outputs.push(metric.collect());
    }

    return outputs.join('\n\n');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALERT MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class AlertManager extends EventEmitter {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private checkInterval?: ReturnType<typeof setInterval>;
  private registry: MetricsRegistry;

  constructor(registry: MetricsRegistry) {
    super();
    this.registry = registry;
  }

  addRule(rule: AlertRule): this {
    this.rules.set(rule.name, rule);
    return this;
  }

  removeRule(name: string): boolean {
    return this.rules.delete(name);
  }

  start(intervalMs: number = 10000): void {
    this.checkInterval = setInterval(() => {
      this.checkAlerts();
    }, intervalMs);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  private checkAlerts(): void {
    for (const [name, rule] of this.rules) {
      const metric = this.registry.getMetric(rule.metric);
      if (!metric) continue;

      const value = (metric as any).get?.(rule.labels) ?? 0;
      const shouldFire = this.evaluateCondition(value, rule.condition, rule.threshold);

      const alertKey = `${name}-${JSON.stringify(rule.labels || {})}`;
      const existingAlert = this.activeAlerts.get(alertKey);

      if (shouldFire && !existingAlert) {
        const alert: Alert = {
          rule: name,
          metric: rule.metric,
          value,
          threshold: rule.threshold,
          labels: rule.labels || {},
          timestamp: new Date(),
          status: 'firing'
        };

        this.activeAlerts.set(alertKey, alert);
        rule.handler(alert);
        this.emit('alert', alert);

      } else if (!shouldFire && existingAlert) {
        existingAlert.status = 'resolved';
        rule.handler(existingAlert);
        this.activeAlerts.delete(alertKey);
        this.emit('resolved', existingAlert);
      }
    }
  }

  private evaluateCondition(value: number, condition: AlertRule['condition'], threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIND ENGINE METRICS
// ═══════════════════════════════════════════════════════════════════════════════

export class MindEngineMetrics {
  private registry: MetricsRegistry;
  
  // Test metrics
  readonly testsTotal: Counter;
  readonly testsPassed: Counter;
  readonly testsFailed: Counter;
  readonly testsSkipped: Counter;
  readonly testDuration: Histogram;

  // Browser metrics
  readonly browsersActive: Gauge;
  readonly pagesActive: Gauge;
  readonly navigationDuration: Histogram;

  // Action metrics
  readonly actionsTotal: Counter;
  readonly actionDuration: Histogram;
  readonly actionErrors: Counter;

  // Self-healing metrics
  readonly healingAttempts: Counter;
  readonly healingSuccess: Counter;
  readonly healingDuration: Histogram;

  // System metrics
  readonly memoryUsage: Gauge;
  readonly cpuUsage: Gauge;
  readonly uptime: Gauge;

  constructor(prefix: string = 'mind') {
    this.registry = new MetricsRegistry(prefix);

    // Test metrics
    this.testsTotal = this.registry.createCounter({
      name: 'tests_total',
      help: 'Total number of tests executed',
      labels: ['project', 'browser', 'status']
    });

    this.testsPassed = this.registry.createCounter({
      name: 'tests_passed_total',
      help: 'Total number of passed tests'
    });

    this.testsFailed = this.registry.createCounter({
      name: 'tests_failed_total',
      help: 'Total number of failed tests'
    });

    this.testsSkipped = this.registry.createCounter({
      name: 'tests_skipped_total',
      help: 'Total number of skipped tests'
    });

    this.testDuration = this.registry.createHistogram({
      name: 'test_duration_seconds',
      help: 'Test execution duration in seconds',
      buckets: [0.5, 1, 2, 5, 10, 30, 60, 120, 300]
    });

    // Browser metrics
    this.browsersActive = this.registry.createGauge({
      name: 'browsers_active',
      help: 'Number of active browser instances'
    });

    this.pagesActive = this.registry.createGauge({
      name: 'pages_active',
      help: 'Number of active browser pages'
    });

    this.navigationDuration = this.registry.createHistogram({
      name: 'navigation_duration_seconds',
      help: 'Page navigation duration in seconds',
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    });

    // Action metrics
    this.actionsTotal = this.registry.createCounter({
      name: 'actions_total',
      help: 'Total number of actions executed',
      labels: ['type', 'status']
    });

    this.actionDuration = this.registry.createHistogram({
      name: 'action_duration_seconds',
      help: 'Action execution duration in seconds',
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
    });

    this.actionErrors = this.registry.createCounter({
      name: 'action_errors_total',
      help: 'Total number of action errors',
      labels: ['type', 'error']
    });

    // Self-healing metrics
    this.healingAttempts = this.registry.createCounter({
      name: 'healing_attempts_total',
      help: 'Total number of self-healing attempts'
    });

    this.healingSuccess = this.registry.createCounter({
      name: 'healing_success_total',
      help: 'Total number of successful self-healing operations'
    });

    this.healingDuration = this.registry.createHistogram({
      name: 'healing_duration_seconds',
      help: 'Self-healing operation duration'
    });

    // System metrics
    this.memoryUsage = this.registry.createGauge({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes'
    });

    this.cpuUsage = this.registry.createGauge({
      name: 'cpu_usage_percent',
      help: 'CPU usage percentage'
    });

    this.uptime = this.registry.createGauge({
      name: 'uptime_seconds',
      help: 'Process uptime in seconds'
    });

    // Start system metrics collection
    this.startSystemMetrics();
  }

  private startSystemMetrics(): void {
    setInterval(() => {
      const mem = process.memoryUsage();
      this.memoryUsage.set(mem.heapUsed);
      this.uptime.set(process.uptime());
    }, 5000);
  }

  collect(): string {
    return this.registry.collect();
  }

  getRegistry(): MetricsRegistry {
    return this.registry;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export function createMetrics(prefix?: string): MindEngineMetrics {
  return new MindEngineMetrics(prefix);
}

export default {
  MetricsRegistry,
  Counter,
  Gauge,
  Histogram,
  Summary,
  AlertManager,
  MindEngineMetrics,
  createMetrics
};
