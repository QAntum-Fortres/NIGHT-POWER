/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: PERFORMANCE TESTING
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Web Vitals, Lighthouse integration, load testing, profiling
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0-QANTUM-PRIME
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface WebVitals {
  LCP: number;   // Largest Contentful Paint
  FID: number;   // First Input Delay
  CLS: number;   // Cumulative Layout Shift
  FCP: number;   // First Contentful Paint
  TTFB: number;  // Time to First Byte
  TTI: number;   // Time to Interactive
  TBT: number;   // Total Blocking Time
  SI: number;    // Speed Index
}

export interface PerformanceThresholds {
  LCP?: number;
  FID?: number;
  CLS?: number;
  FCP?: number;
  TTFB?: number;
  TTI?: number;
  TBT?: number;
  SI?: number;
  loadTime?: number;
  resourceSize?: number;
  requestCount?: number;
}

export interface LighthouseConfig {
  categories?: ('performance' | 'accessibility' | 'best-practices' | 'seo' | 'pwa')[];
  device?: 'mobile' | 'desktop';
  throttling?: boolean;
  screenEmulation?: boolean;
}

export interface LighthouseReport {
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    pwa?: number;
  };
  metrics: WebVitals;
  audits: Record<string, {
    title: string;
    description: string;
    score: number | null;
    displayValue?: string;
  }>;
  timestamp: Date;
}

export interface LoadTestConfig {
  url: string;
  duration: number;        // ms
  rampUp?: number;         // ms
  concurrency: number;
  requestsPerSecond?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errors: Record<string, number>;
  duration: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEB VITALS COLLECTOR
// ═══════════════════════════════════════════════════════════════════════════════

export class WebVitalsCollector extends EventEmitter {
  private page: any;
  private metrics: Partial<WebVitals> = {};

  constructor(page: any) {
    super();
    this.page = page;
  }

  /**
   * Collect all Web Vitals
   */
  async collect(): Promise<WebVitals> {
    await this.injectCollector();
    
    // Wait for metrics to stabilize
    await new Promise(r => setTimeout(r, 3000));

    this.metrics = await this.page.evaluate(() => {
      return (window as any).__MIND_VITALS__ || {};
    });

    // Get additional metrics from Performance API
    const performanceMetrics = await this.getPerformanceMetrics();
    
    return {
      LCP: this.metrics.LCP || performanceMetrics.LCP || 0,
      FID: this.metrics.FID || 0,
      CLS: this.metrics.CLS || 0,
      FCP: performanceMetrics.FCP || 0,
      TTFB: performanceMetrics.TTFB || 0,
      TTI: performanceMetrics.TTI || 0,
      TBT: performanceMetrics.TBT || 0,
      SI: performanceMetrics.SI || 0
    };
  }

  /**
   * Inject Web Vitals collector script
   */
  private async injectCollector(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).__MIND_VITALS__ = {};

      // LCP Observer
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        (window as any).__MIND_VITALS__.LCP = lastEntry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // FID Observer
      new PerformanceObserver((entryList) => {
        const firstInput = entryList.getEntries()[0];
        if (firstInput) {
          (window as any).__MIND_VITALS__.FID = (firstInput as any).processingStart - firstInput.startTime;
        }
      }).observe({ type: 'first-input', buffered: true });

      // CLS Observer
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        (window as any).__MIND_VITALS__.CLS = clsValue;
      }).observe({ type: 'layout-shift', buffered: true });
    });
  }

  /**
   * Get metrics from Performance API
   */
  private async getPerformanceMetrics(): Promise<Partial<WebVitals>> {
    return this.page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (!timing) return {};

      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(p => p.name === 'first-contentful-paint');

      return {
        TTFB: timing.responseStart - timing.requestStart,
        FCP: fcp?.startTime || 0,
        TTI: timing.domInteractive - timing.fetchStart,
        TBT: 0, // Requires more complex calculation
        SI: 0   // Requires visual progress tracking
      };
    });
  }

  /**
   * Assert metrics meet thresholds
   */
  assertThresholds(thresholds: PerformanceThresholds): {
    passed: boolean;
    violations: Array<{ metric: string; actual: number; threshold: number }>;
  } {
    const violations: Array<{ metric: string; actual: number; threshold: number }> = [];

    for (const [metric, threshold] of Object.entries(thresholds)) {
      const actual = (this.metrics as any)[metric];
      
      if (actual !== undefined && threshold !== undefined) {
        // CLS is lower-is-better with different scale
        if (metric === 'CLS') {
          if (actual > threshold) {
            violations.push({ metric, actual, threshold });
          }
        } else {
          if (actual > threshold) {
            violations.push({ metric, actual, threshold });
          }
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIGHTHOUSE RUNNER
// ═══════════════════════════════════════════════════════════════════════════════

export class LighthouseRunner extends EventEmitter {
  private config: LighthouseConfig;

  constructor(config: LighthouseConfig = {}) {
    super();
    this.config = {
      categories: ['performance', 'accessibility', 'best-practices', 'seo'],
      device: 'mobile',
      throttling: true,
      screenEmulation: true,
      ...config
    };
  }

  /**
   * Run Lighthouse audit
   */
  async run(url: string): Promise<LighthouseReport> {
    this.emit('start', { url });

    // Simulated Lighthouse report
    // In real implementation, use lighthouse npm package
    const report: LighthouseReport = {
      scores: {
        performance: Math.floor(Math.random() * 30) + 70,
        accessibility: Math.floor(Math.random() * 20) + 80,
        bestPractices: Math.floor(Math.random() * 20) + 80,
        seo: Math.floor(Math.random() * 15) + 85
      },
      metrics: {
        LCP: Math.random() * 2000 + 1000,
        FID: Math.random() * 100 + 10,
        CLS: Math.random() * 0.1,
        FCP: Math.random() * 1000 + 500,
        TTFB: Math.random() * 500 + 100,
        TTI: Math.random() * 3000 + 2000,
        TBT: Math.random() * 200 + 50,
        SI: Math.random() * 2000 + 1000
      },
      audits: {
        'first-contentful-paint': {
          title: 'First Contentful Paint',
          description: 'First Contentful Paint marks the time at which the first text or image is painted.',
          score: 0.9,
          displayValue: '1.2 s'
        },
        'largest-contentful-paint': {
          title: 'Largest Contentful Paint',
          description: 'Largest Contentful Paint marks the time at which the largest text or image is painted.',
          score: 0.8,
          displayValue: '2.1 s'
        },
        'cumulative-layout-shift': {
          title: 'Cumulative Layout Shift',
          description: 'Cumulative Layout Shift measures the movement of visible elements within the viewport.',
          score: 0.95,
          displayValue: '0.05'
        }
      },
      timestamp: new Date()
    };

    this.emit('complete', report);
    return report;
  }

  /**
   * Compare two reports
   */
  compare(baseline: LighthouseReport, current: LighthouseReport): LighthouseComparison {
    const comparison: LighthouseComparison = {
      scores: {} as any,
      metrics: {} as any,
      improved: [],
      degraded: []
    };

    // Compare scores
    for (const [category, score] of Object.entries(current.scores)) {
      const baselineScore = (baseline.scores as any)[category];
      const diff = score - baselineScore;
      
      (comparison.scores as any)[category] = {
        baseline: baselineScore,
        current: score,
        diff,
        percentage: ((diff / baselineScore) * 100).toFixed(2) + '%'
      };

      if (diff > 5) {
        comparison.improved.push(category);
      } else if (diff < -5) {
        comparison.degraded.push(category);
      }
    }

    // Compare metrics
    for (const [metric, value] of Object.entries(current.metrics)) {
      const baselineValue = (baseline.metrics as any)[metric];
      const diff = value - baselineValue;
      const isImproved = metric === 'CLS' ? diff < 0 : diff < 0;

      (comparison.metrics as any)[metric] = {
        baseline: baselineValue,
        current: value,
        diff,
        improved: isImproved
      };
    }

    return comparison;
  }
}

export interface LighthouseComparison {
  scores: Record<string, {
    baseline: number;
    current: number;
    diff: number;
    percentage: string;
  }>;
  metrics: Record<string, {
    baseline: number;
    current: number;
    diff: number;
    improved: boolean;
  }>;
  improved: string[];
  degraded: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD TESTER
// ═══════════════════════════════════════════════════════════════════════════════

export class LoadTester extends EventEmitter {
  private config: LoadTestConfig;
  private running: boolean = false;
  private results: number[] = [];
  private errors: Record<string, number> = {};
  private successCount: number = 0;
  private failCount: number = 0;

  constructor(config: LoadTestConfig) {
    super();
    this.config = {
      rampUp: 0,
      timeout: 30000,
      ...config
    };
  }

  /**
   * Run load test
   */
  async run(): Promise<LoadTestResult> {
    this.running = true;
    this.results = [];
    this.errors = {};
    this.successCount = 0;
    this.failCount = 0;

    const startTime = Date.now();
    const endTime = startTime + this.config.duration;
    const workers: Promise<void>[] = [];

    this.emit('start', { config: this.config });

    // Create concurrent workers
    for (let i = 0; i < this.config.concurrency; i++) {
      const workerDelay = this.config.rampUp 
        ? (this.config.rampUp / this.config.concurrency) * i 
        : 0;

      workers.push(this.worker(endTime, workerDelay));
    }

    await Promise.all(workers);
    this.running = false;

    const result = this.calculateResults(Date.now() - startTime);
    this.emit('complete', result);
    
    return result;
  }

  /**
   * Stop load test
   */
  stop(): void {
    this.running = false;
  }

  private async worker(endTime: number, initialDelay: number): Promise<void> {
    await new Promise(r => setTimeout(r, initialDelay));

    while (this.running && Date.now() < endTime) {
      const requestStart = Date.now();

      try {
        // Simulate HTTP request
        await this.makeRequest();
        
        const duration = Date.now() - requestStart;
        this.results.push(duration);
        this.successCount++;

        this.emit('request', { 
          success: true, 
          duration,
          total: this.results.length 
        });

      } catch (error) {
        this.failCount++;
        const errorType = (error as Error).message || 'Unknown error';
        this.errors[errorType] = (this.errors[errorType] || 0) + 1;

        this.emit('request', { 
          success: false, 
          error: errorType,
          total: this.results.length + this.failCount
        });
      }

      // Rate limiting
      if (this.config.requestsPerSecond) {
        const delay = 1000 / this.config.requestsPerSecond;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  private async makeRequest(): Promise<void> {
    // Simulated request - in real implementation use fetch/axios
    const delay = Math.random() * 500 + 50;
    await new Promise(r => setTimeout(r, delay));

    // Simulate occasional failures
    if (Math.random() < 0.02) {
      throw new Error('Connection timeout');
    }
  }

  private calculateResults(duration: number): LoadTestResult {
    const sorted = [...this.results].sort((a, b) => a - b);
    const total = sorted.length;

    return {
      totalRequests: total + this.failCount,
      successfulRequests: this.successCount,
      failedRequests: this.failCount,
      avgResponseTime: total > 0 ? sorted.reduce((a, b) => a + b, 0) / total : 0,
      minResponseTime: sorted[0] || 0,
      maxResponseTime: sorted[total - 1] || 0,
      p50ResponseTime: sorted[Math.floor(total * 0.5)] || 0,
      p95ResponseTime: sorted[Math.floor(total * 0.95)] || 0,
      p99ResponseTime: sorted[Math.floor(total * 0.99)] || 0,
      requestsPerSecond: (total / duration) * 1000,
      errors: this.errors,
      duration
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESOURCE PROFILER
// ═══════════════════════════════════════════════════════════════════════════════

export class ResourceProfiler extends EventEmitter {
  private page: any;

  constructor(page: any) {
    super();
    this.page = page;
  }

  /**
   * Profile page resources
   */
  async profile(): Promise<ResourceProfile> {
    const resources = await this.page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      return entries.map((entry) => ({
        name: entry.name,
        type: entry.initiatorType,
        duration: entry.duration,
        size: entry.transferSize,
        startTime: entry.startTime
      }));
    });

    const byType: Record<string, { count: number; size: number; duration: number }> = {};

    for (const resource of resources) {
      if (!byType[resource.type]) {
        byType[resource.type] = { count: 0, size: 0, duration: 0 };
      }
      byType[resource.type].count++;
      byType[resource.type].size += resource.size || 0;
      byType[resource.type].duration += resource.duration || 0;
    }

    const totalSize = resources.reduce((sum: number, r: any) => sum + (r.size || 0), 0);
    const totalDuration = resources.reduce((sum: number, r: any) => sum + (r.duration || 0), 0);

    return {
      totalResources: resources.length,
      totalSize,
      totalDuration,
      byType,
      resources,
      largestResources: [...resources]
        .sort((a: any, b: any) => (b.size || 0) - (a.size || 0))
        .slice(0, 10),
      slowestResources: [...resources]
        .sort((a: any, b: any) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 10)
    };
  }

  /**
   * Monitor resources in real-time
   */
  async monitor(duration: number = 10000): Promise<ResourceTimeline> {
    const timeline: Array<{ time: number; resources: number; size: number }> = [];
    const startTime = Date.now();

    while (Date.now() - startTime < duration) {
      const profile = await this.profile();
      
      timeline.push({
        time: Date.now() - startTime,
        resources: profile.totalResources,
        size: profile.totalSize
      });

      await new Promise(r => setTimeout(r, 500));
    }

    return {
      duration,
      snapshots: timeline
    };
  }
}

export interface ResourceProfile {
  totalResources: number;
  totalSize: number;
  totalDuration: number;
  byType: Record<string, { count: number; size: number; duration: number }>;
  resources: any[];
  largestResources: any[];
  slowestResources: any[];
}

export interface ResourceTimeline {
  duration: number;
  snapshots: Array<{ time: number; resources: number; size: number }>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE BUDGET
// ═══════════════════════════════════════════════════════════════════════════════

export class PerformanceBudget {
  private budgets: PerformanceThresholds;

  constructor(budgets: PerformanceThresholds) {
    this.budgets = budgets;
  }

  /**
   * Check if metrics meet budget
   */
  check(metrics: Partial<WebVitals> & { loadTime?: number; resourceSize?: number; requestCount?: number }): BudgetResult {
    const violations: BudgetViolation[] = [];

    for (const [metric, budget] of Object.entries(this.budgets)) {
      const actual = (metrics as any)[metric];
      
      if (actual !== undefined && budget !== undefined && actual > budget) {
        violations.push({
          metric,
          budget,
          actual,
          overage: actual - budget,
          percentage: ((actual - budget) / budget * 100).toFixed(2) + '%'
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      summary: violations.length === 0 
        ? 'All metrics within budget' 
        : `${violations.length} metric(s) exceeded budget`
    };
  }

  /**
   * Generate budget report
   */
  generateReport(metrics: Partial<WebVitals>): string {
    const result = this.check(metrics);
    let report = '# Performance Budget Report\n\n';

    if (result.passed) {
      report += '✅ **All metrics within budget**\n\n';
    } else {
      report += `⚠️ **${result.violations.length} budget violations**\n\n`;
    }

    report += '## Metrics\n\n';
    report += '| Metric | Budget | Actual | Status |\n';
    report += '|--------|--------|--------|--------|\n';

    for (const [metric, budget] of Object.entries(this.budgets)) {
      const actual = (metrics as any)[metric] ?? 'N/A';
      const status = actual <= budget ? '✅' : '❌';
      report += `| ${metric} | ${budget} | ${actual} | ${status} |\n`;
    }

    return report;
  }
}

export interface BudgetResult {
  passed: boolean;
  violations: BudgetViolation[];
  summary: string;
}

export interface BudgetViolation {
  metric: string;
  budget: number;
  actual: number;
  overage: number;
  percentage: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export function createWebVitalsCollector(page: any): WebVitalsCollector {
  return new WebVitalsCollector(page);
}

export function createLighthouseRunner(config?: LighthouseConfig): LighthouseRunner {
  return new LighthouseRunner(config);
}

export function createLoadTester(config: LoadTestConfig): LoadTester {
  return new LoadTester(config);
}

export default {
  WebVitalsCollector,
  LighthouseRunner,
  LoadTester,
  ResourceProfiler,
  PerformanceBudget,
  createWebVitalsCollector,
  createLighthouseRunner,
  createLoadTester
};
