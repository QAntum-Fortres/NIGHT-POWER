/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM REPORTER MODULE                                                      ║
 * ║   "Comprehensive test reporting and monitoring"                               ║
 * ║                                                                               ║
 * ║   TODO B #17-19 - Reporter: Generation, Metrics, Dashboard                    ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export * from './generator.js';
export * from './metrics.js';
export * from './dashboard.js';

import { ReportGenerator, ReportData, ReportOptions, ReportFormat, TestResult, SuiteResult } from './generator.js';
import { MetricsCollector, AggregatedMetric } from './metrics.js';
import { DashboardServer, DashboardConfig, TestUpdate, SuiteUpdate, RunUpdate } from './dashboard.js';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED REPORTER FACADE
// ═══════════════════════════════════════════════════════════════════════════════

export class QAntumReporter {
    private static instance: QAntumReporter;

    private generator: ReportGenerator;
    private metrics: MetricsCollector;
    private dashboard: DashboardServer;

    private runId: string = '';
    private startTime: number = 0;
    private results: TestResult[] = [];
    private suites: Map<string, SuiteResult> = new Map();

    private constructor() {
        this.generator = ReportGenerator.getInstance();
        this.metrics = MetricsCollector.getInstance();
        this.dashboard = DashboardServer.getInstance();
    }

    static getInstance(): QAntumReporter {
        if (!QAntumReporter.instance) {
            QAntumReporter.instance = new QAntumReporter();
        }
        return QAntumReporter.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RUN LIFECYCLE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Start test run
     */
    startRun(totalTests: number): string {
        this.runId = `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.startTime = Date.now();
        this.results = [];
        this.suites.clear();

        this.metrics.setGauge('test_run_active', 1);
        this.metrics.increment('test_runs_total');
        this.dashboard.startRun(this.runId, totalTests);

        return this.runId;
    }

    /**
     * End test run
     */
    endRun(): ReportData {
        const endTime = Date.now();
        const duration = endTime - this.startTime;

        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const skipped = this.results.filter(r => r.status === 'skipped').length;
        const total = this.results.length;

        this.metrics.setGauge('test_run_active', 0);
        this.metrics.observe('test_run_duration_seconds', duration / 1000);
        this.metrics.increment('tests_passed_total', passed);
        this.metrics.increment('tests_failed_total', failed);
        this.metrics.increment('tests_skipped_total', skipped);

        this.dashboard.endRun(failed === 0);

        return {
            title: `QAntum Test Run - ${this.runId}`,
            timestamp: this.startTime,
            duration,
            environment: this.getEnvironment(),
            suites: Array.from(this.suites.values()),
            summary: {
                total,
                passed,
                failed,
                skipped,
                passRate: total > 0 ? passed / total : 0
            }
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST REPORTING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Report test start
     */
    testStarted(id: string, name: string, suite: string): void {
        this.dashboard.updateTest({
            id,
            name,
            suite,
            status: 'running',
            timestamp: Date.now()
        });

        // Ensure suite exists
        if (!this.suites.has(suite)) {
            this.suites.set(suite, {
                name: suite,
                tests: [],
                duration: 0,
                passed: 0,
                failed: 0,
                skipped: 0
            });
        }
    }

    /**
     * Report test passed
     */
    testPassed(id: string, name: string, suite: string, duration: number): void {
        const result = this.createResult(id, name, suite, 'passed', duration);
        this.addResult(result);

        this.metrics.increment('tests_passed_total', 1, { suite });
        this.metrics.observe('test_duration_seconds', duration / 1000, { suite, status: 'passed' });
    }

    /**
     * Report test failed
     */
    testFailed(
        id: string, 
        name: string, 
        suite: string, 
        duration: number,
        error: { message: string; stack?: string; type?: string }
    ): void {
        const result = this.createResult(id, name, suite, 'failed', duration, error);
        this.addResult(result);

        this.metrics.increment('tests_failed_total', 1, { suite });
        this.metrics.observe('test_duration_seconds', duration / 1000, { suite, status: 'failed' });
    }

    /**
     * Report test skipped
     */
    testSkipped(id: string, name: string, suite: string): void {
        const result = this.createResult(id, name, suite, 'skipped', 0);
        this.addResult(result);

        this.metrics.increment('tests_skipped_total', 1, { suite });
    }

    private createResult(
        id: string,
        name: string,
        suite: string,
        status: TestResult['status'],
        duration: number,
        error?: TestResult['error']
    ): TestResult {
        const now = Date.now();
        return {
            id,
            name,
            suite,
            status,
            duration,
            startedAt: now - duration,
            endedAt: now,
            error
        };
    }

    private addResult(result: TestResult): void {
        this.results.push(result);

        const suiteResult = this.suites.get(result.suite!);
        if (suiteResult) {
            suiteResult.tests.push(result);
            suiteResult.duration += result.duration;
            
            switch (result.status) {
                case 'passed': suiteResult.passed++; break;
                case 'failed': suiteResult.failed++; break;
                case 'skipped': suiteResult.skipped++; break;
            }

            this.dashboard.updateSuite({
                name: suiteResult.name,
                status: 'running',
                tests: suiteResult.tests.length,
                passed: suiteResult.passed,
                failed: suiteResult.failed,
                skipped: suiteResult.skipped,
                duration: suiteResult.duration
            });
        }

        this.dashboard.updateTest({
            id: result.id,
            name: result.name,
            suite: result.suite!,
            status: result.status,
            duration: result.duration,
            error: result.error?.message,
            timestamp: result.endedAt
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REPORT GENERATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate report
     */
    generateReport(format: ReportFormat, data?: ReportData): string {
        const reportData = data || this.endRun();
        return this.generator.generate(reportData, { format });
    }

    /**
     * Generate multiple reports
     */
    generateReports(formats: ReportFormat[], data?: ReportData): Map<ReportFormat, string> {
        const reportData = data || this.endRun();
        return this.generator.generateMultiple(reportData, formats);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // METRICS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get metrics collector
     */
    getMetrics(): MetricsCollector {
        return this.metrics;
    }

    /**
     * Get aggregated metrics
     */
    getAggregatedMetrics(): AggregatedMetric[] {
        return this.metrics.aggregateAll();
    }

    /**
     * Export Prometheus metrics
     */
    exportPrometheusMetrics(): string {
        return this.metrics.exportPrometheus();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DASHBOARD
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Configure dashboard
     */
    configureDashboard(config: Partial<DashboardConfig>): this {
        this.dashboard.configure(config);
        return this;
    }

    /**
     * Start dashboard
     */
    async startDashboard(): Promise<void> {
        await this.dashboard.start();
    }

    /**
     * Stop dashboard
     */
    async stopDashboard(): Promise<void> {
        await this.dashboard.stop();
    }

    /**
     * Get dashboard HTML
     */
    getDashboardHTML(): string {
        return this.dashboard.getDashboardHTML();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private getEnvironment(): Record<string, string> {
        return {
            nodeVersion: process.version || 'unknown',
            platform: process.platform || 'unknown',
            arch: process.arch || 'unknown',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Reset reporter
     */
    reset(): void {
        this.runId = '';
        this.startTime = 0;
        this.results = [];
        this.suites.clear();
        this.metrics.clear();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getReporter = (): QAntumReporter => QAntumReporter.getInstance();

// Quick report generation
export const report = {
    html: (data: ReportData) => ReportGenerator.getInstance().generate(data, { format: 'html' }),
    json: (data: ReportData) => ReportGenerator.getInstance().generate(data, { format: 'json' }),
    junit: (data: ReportData) => ReportGenerator.getInstance().generate(data, { format: 'junit' }),
    markdown: (data: ReportData) => ReportGenerator.getInstance().generate(data, { format: 'markdown' }),
    xml: (data: ReportData) => ReportGenerator.getInstance().generate(data, { format: 'xml' }),
    csv: (data: ReportData) => ReportGenerator.getInstance().generate(data, { format: 'csv' })
};

// Quick metrics
export const metrics = {
    increment: (name: string, value?: number, labels?: Record<string, string>) => 
        MetricsCollector.getInstance().increment(name, value, labels),
    gauge: (name: string, value: number, labels?: Record<string, string>) => 
        MetricsCollector.getInstance().setGauge(name, value, labels),
    observe: (name: string, value: number, labels?: Record<string, string>) => 
        MetricsCollector.getInstance().observe(name, value, labels),
    time: <T>(name: string, fn: () => T | Promise<T>, labels?: Record<string, string>) => 
        MetricsCollector.getInstance().time(name, fn, labels)
};

export default QAntumReporter;
