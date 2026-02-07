/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 📊 MARKET WATCHER - Anomaly Detection & System Monitoring
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Metaphysical Principle: Normality is a construct, anomaly is deviation from the expected.
 * By establishing a baseline of "normal" behavior, we can detect the abnormal - the shadow
 * of potential threats. The Market Watcher observes without judgment, reports without bias,
 * and enables response without delay.
 * 
 * Like a sentinel standing watch over the city, it sees patterns invisible to the untrained
 * eye and sounds the alarm when those patterns break.
 * 
 * @author Dimitar Prodromov
 * @version 17.0.0
 */

import { EventEmitter } from 'events';
import * as os from 'os';
import type {
  MonitoringConfig,
  AnomalyEvent,
  ThreatLevel,
  SystemMetrics,
} from '../../../types/security.types';

// ═══════════════════════════════════════════════════════════════════════════════════════
// 📈 MONITORING TYPES
// ═══════════════════════════════════════════════════════════════════════════════════════

interface MetricBaseline {
  metric: string;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  samples: number;
}

interface AlertRule {
  metric: string;
  condition: 'above' | 'below' | 'deviation';
  threshold: number;
  severity: ThreatLevel;
  cooldownMs: number;
  lastTriggered?: number;
}

interface MonitoringState {
  active: boolean;
  startedAt: number | null;
  metricsCollected: number;
  anomaliesDetected: number;
  baselines: Map<string, MetricBaseline>;
  history: Map<string, number[]>;
  alerts: Map<string, AnomalyEvent[]>;
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// 👁️ MARKET WATCHER ENGINE
// ═══════════════════════════════════════════════════════════════════════════════════════

export class MarketWatcher extends EventEmitter {
  private config: MonitoringConfig;
  private state: MonitoringState;
  private rules: AlertRule[];
  private collectionInterval: ReturnType<typeof setInterval> | null = null;
  private analysisInterval: ReturnType<typeof setInterval> | null = null;
  private readonly HISTORY_SIZE = 1000;
  private readonly BASELINE_SAMPLES = 100;
  private readonly COLLECTION_INTERVAL_MS = 1000;
  private readonly ANALYSIS_INTERVAL_MS = 5000;

  constructor() {
    super();
    this.config = this.getDefaultConfig();
    this.state = this.initializeState();
    this.rules = this.getDefaultRules();
  }

  /**
   * Get default monitoring configuration
   */
  private getDefaultConfig(): MonitoringConfig {
    return {
      cpuUsage: true,
      memoryLeaks: true,
      networkSpikes: true,
      apiRateLimits: true,
      fileSystemChanges: false,
      processSpawning: false,
    };
  }

  /**
   * Initialize monitoring state
   */
  private initializeState(): MonitoringState {
    return {
      active: false,
      startedAt: null,
      metricsCollected: 0,
      anomaliesDetected: 0,
      baselines: new Map(),
      history: new Map(),
      alerts: new Map(),
    };
  }

  /**
   * Get default alert rules
   */
  private getDefaultRules(): AlertRule[] {
    return [
      // CPU rules
      {
        metric: 'cpu.usage',
        condition: 'above',
        threshold: 90,
        severity: 'high',
        cooldownMs: 60000,
      },
      {
        metric: 'cpu.usage',
        condition: 'above',
        threshold: 70,
        severity: 'medium',
        cooldownMs: 300000,
      },
      
      // Memory rules
      {
        metric: 'memory.usage',
        condition: 'above',
        threshold: 90,
        severity: 'critical',
        cooldownMs: 30000,
      },
      {
        metric: 'memory.usage',
        condition: 'above',
        threshold: 80,
        severity: 'high',
        cooldownMs: 60000,
      },
      {
        metric: 'memory.growth',
        condition: 'deviation',
        threshold: 3, // 3 standard deviations
        severity: 'medium',
        cooldownMs: 300000,
      },
      
      // Network rules
      {
        metric: 'network.connections',
        condition: 'deviation',
        threshold: 4,
        severity: 'high',
        cooldownMs: 60000,
      },
      
      // Event loop
      {
        metric: 'eventloop.lag',
        condition: 'above',
        threshold: 100, // ms
        severity: 'medium',
        cooldownMs: 30000,
      },
    ];
  }

  /**
   * Configure monitoring options
   */
  public monitor(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configured', { config: this.config });
  }

  /**
   * Start monitoring
   */
  public start(): void {
    if (this.state.active) {
      return;
    }
    
    this.state.active = true;
    this.state.startedAt = Date.now();
    
    // Start metric collection
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, this.COLLECTION_INTERVAL_MS);
    
    // Start anomaly analysis
    this.analysisInterval = setInterval(() => {
      this.analyzeMetrics();
    }, this.ANALYSIS_INTERVAL_MS);
    
    this.emit('started', { timestamp: Date.now() });
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (!this.state.active) {
      return;
    }
    
    this.state.active = false;
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    
    this.emit('stopped', { timestamp: Date.now() });
  }

  /**
   * Collect system metrics
   */
  private collectMetrics(): void {
    const metrics = this.gatherSystemMetrics();
    
    // Store in history
    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === 'number') {
        this.recordMetric(`system.${key}`, value);
      }
    }
    
    // Collect specific metrics based on config
    if (this.config.cpuUsage) {
      this.collectCpuMetrics();
    }
    
    if (this.config.memoryLeaks) {
      this.collectMemoryMetrics();
    }
    
    this.state.metricsCollected++;
    this.emit('metricsCollected', { count: this.state.metricsCollected });
  }

  /**
   * Gather system metrics
   */
  private gatherSystemMetrics(): SystemMetrics {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    
    // Calculate CPU usage
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    }
    
    const cpuUsage = totalTick > 0 ? 100 - (totalIdle / totalTick * 100) : 0;
    
    return {
      cpuUsage,
      memoryUsage: ((totalMem - freeMem) / totalMem) * 100,
      memoryTotal: totalMem,
      networkIn: 0, // Would require network interface monitoring
      networkOut: 0,
      activeConnections: 0,
      openFiles: 0,
      uptime: os.uptime(),
    };
  }

  /**
   * Collect CPU-specific metrics
   */
  private collectCpuMetrics(): void {
    const cpus = os.cpus();
    
    let totalUser = 0;
    let totalSystem = 0;
    let totalIdle = 0;
    
    for (const cpu of cpus) {
      totalUser += cpu.times.user;
      totalSystem += cpu.times.sys;
      totalIdle += cpu.times.idle;
    }
    
    const total = totalUser + totalSystem + totalIdle;
    
    if (total > 0) {
      this.recordMetric('cpu.user', (totalUser / total) * 100);
      this.recordMetric('cpu.system', (totalSystem / total) * 100);
      this.recordMetric('cpu.idle', (totalIdle / total) * 100);
      this.recordMetric('cpu.usage', ((totalUser + totalSystem) / total) * 100);
    }
  }

  /**
   * Collect memory-specific metrics
   */
  private collectMemoryMetrics(): void {
    const used = process.memoryUsage();
    
    this.recordMetric('memory.heapUsed', used.heapUsed);
    this.recordMetric('memory.heapTotal', used.heapTotal);
    this.recordMetric('memory.rss', used.rss);
    this.recordMetric('memory.external', used.external);
    
    // Calculate memory growth rate
    const heapHistory = this.state.history.get('memory.heapUsed') || [];
    if (heapHistory.length >= 2) {
      const growth = heapHistory[heapHistory.length - 1] - heapHistory[heapHistory.length - 2];
      this.recordMetric('memory.growth', growth);
    }
    
    // Calculate usage percentage
    this.recordMetric('memory.usage', (used.heapUsed / used.heapTotal) * 100);
  }

  /**
   * Record a metric value
   */
  private recordMetric(name: string, value: number): void {
    // Get or create history array
    let history = this.state.history.get(name);
    if (!history) {
      history = [];
      this.state.history.set(name, history);
    }
    
    // Add value
    history.push(value);
    
    // Trim if needed
    if (history.length > this.HISTORY_SIZE) {
      history.shift();
    }
    
    // Update baseline if we have enough samples
    if (history.length >= this.BASELINE_SAMPLES) {
      this.updateBaseline(name, history);
    }
  }

  /**
   * Update baseline statistics for a metric
   */
  private updateBaseline(name: string, values: number[]): void {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
    const stdDev = Math.sqrt(variance);
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    this.state.baselines.set(name, {
      metric: name,
      mean,
      stdDev,
      min,
      max,
      samples: n,
    });
  }

  /**
   * Analyze collected metrics for anomalies
   */
  private analyzeMetrics(): void {
    const now = Date.now();
    
    for (const rule of this.rules) {
      // Check cooldown
      if (rule.lastTriggered && now - rule.lastTriggered < rule.cooldownMs) {
        continue;
      }
      
      const history = this.state.history.get(rule.metric);
      if (!history || history.length === 0) {
        continue;
      }
      
      const currentValue = history[history.length - 1];
      const baseline = this.state.baselines.get(rule.metric);
      
      let isAnomaly = false;
      let deviation = 0;
      
      switch (rule.condition) {
        case 'above':
          isAnomaly = currentValue > rule.threshold;
          deviation = rule.threshold > 0 ? ((currentValue - rule.threshold) / rule.threshold) * 100 : 0;
          break;
          
        case 'below':
          isAnomaly = currentValue < rule.threshold;
          deviation = rule.threshold > 0 ? ((rule.threshold - currentValue) / rule.threshold) * 100 : 0;
          break;
          
        case 'deviation':
          if (baseline && baseline.stdDev > 0) {
            const zScore = Math.abs(currentValue - baseline.mean) / baseline.stdDev;
            isAnomaly = zScore > rule.threshold;
            deviation = zScore;
          }
          break;
      }
      
      if (isAnomaly) {
        this.reportAnomaly(rule, currentValue, baseline?.mean || rule.threshold, deviation);
        rule.lastTriggered = now;
      }
    }
  }

  /**
   * Report detected anomaly
   */
  private reportAnomaly(
    rule: AlertRule,
    actualValue: number,
    expectedValue: number,
    deviation: number
  ): void {
    const anomaly: AnomalyEvent = {
      id: `anomaly_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: `${rule.metric}_${rule.condition}`,
      severity: rule.severity,
      timestamp: Date.now(),
      metric: rule.metric,
      expectedValue,
      actualValue,
      deviation,
      context: {
        threshold: rule.threshold,
        condition: rule.condition,
      },
    };
    
    // Store in alerts
    let alerts = this.state.alerts.get(rule.metric);
    if (!alerts) {
      alerts = [];
      this.state.alerts.set(rule.metric, alerts);
    }
    alerts.push(anomaly);
    
    // Trim alerts
    if (alerts.length > 100) {
      alerts.shift();
    }
    
    this.state.anomaliesDetected++;
    this.emit('anomaly', anomaly);
  }

  /**
   * Add custom alert rule
   */
  public addRule(rule: AlertRule): void {
    this.rules.push(rule);
    this.emit('ruleAdded', { rule });
  }

  /**
   * Remove alert rule
   */
  public removeRule(metric: string): boolean {
    const index = this.rules.findIndex((r) => r.metric === metric);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get current metrics snapshot
   */
  public getMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    for (const [name, history] of this.state.history) {
      if (history.length > 0) {
        metrics[name] = history[history.length - 1];
      }
    }
    
    return metrics;
  }

  /**
   * Get baseline statistics
   */
  public getBaselines(): Record<string, MetricBaseline> {
    const baselines: Record<string, MetricBaseline> = {};
    
    for (const [name, baseline] of this.state.baselines) {
      baselines[name] = baseline;
    }
    
    return baselines;
  }

  /**
   * Get recent alerts
   */
  public getAlerts(options: {
    metric?: string;
    severity?: ThreatLevel;
    limit?: number;
    since?: number;
  } = {}): AnomalyEvent[] {
    let alerts: AnomalyEvent[] = [];
    
    // Collect all alerts
    for (const [metric, metricAlerts] of this.state.alerts) {
      if (options.metric && metric !== options.metric) {
        continue;
      }
      alerts = alerts.concat(metricAlerts);
    }
    
    // Filter by severity
    if (options.severity) {
      alerts = alerts.filter((a) => a.severity === options.severity);
    }
    
    // Filter by time
    if (options.since !== undefined) {
      const since = options.since;
      alerts = alerts.filter((a) => a.timestamp >= since);
    }
    
    // Sort by timestamp (newest first)
    alerts.sort((a, b) => b.timestamp - a.timestamp);
    
    // Limit results
    if (options.limit) {
      alerts = alerts.slice(0, options.limit);
    }
    
    return alerts;
  }

  /**
   * Get monitoring statistics
   */
  public getStatistics(): {
    active: boolean;
    uptime: number | null;
    metricsCollected: number;
    anomaliesDetected: number;
    activeRules: number;
    baselineMetrics: number;
    currentThreatLevel: ThreatLevel;
  } {
    // Calculate current threat level based on recent anomalies
    const recentAlerts = this.getAlerts({ since: Date.now() - 300000 }); // Last 5 minutes
    const criticalCount = recentAlerts.filter((a) => a.severity === 'critical').length;
    const highCount = recentAlerts.filter((a) => a.severity === 'high').length;
    
    let threatLevel: ThreatLevel = 'none';
    if (criticalCount > 0) threatLevel = 'critical';
    else if (highCount > 0) threatLevel = 'high';
    else if (recentAlerts.length > 5) threatLevel = 'medium';
    else if (recentAlerts.length > 0) threatLevel = 'low';
    
    return {
      active: this.state.active,
      uptime: this.state.startedAt ? Date.now() - this.state.startedAt : null,
      metricsCollected: this.state.metricsCollected,
      anomaliesDetected: this.state.anomaliesDetected,
      activeRules: this.rules.length,
      baselineMetrics: this.state.baselines.size,
      currentThreatLevel: threatLevel,
    };
  }

  /**
   * Force immediate analysis
   */
  public analyze(): AnomalyEvent[] {
    this.analyzeMetrics();
    return this.getAlerts({ limit: 10 });
  }

  /**
   * Reset monitoring state
   */
  public reset(): void {
    this.state = this.initializeState();
    this.emit('reset', { timestamp: Date.now() });
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stop();
    this.state = this.initializeState();
    this.rules = [];
    this.removeAllListeners();
  }
}

export default MarketWatcher;
