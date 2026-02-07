/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: REPORTERS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Multi-format reporting: HTML, JSON, JUnit, Allure, Console
 * Real-time dashboard support
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TestResult {
  id: string;
  name: string;
  suite?: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration: number;
  startTime: Date;
  endTime?: Date;
  error?: {
    message: string;
    stack?: string;
    screenshot?: string;
  };
  steps?: StepResult[];
  attachments?: Attachment[];
  metadata?: Record<string, any>;
  retries?: number;
  browser?: string;
  tags?: string[];
}

export interface StepResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}

export interface Attachment {
  name: string;
  type: 'screenshot' | 'video' | 'log' | 'trace' | 'html' | 'json' | 'other';
  path?: string;
  content?: string;
  contentType?: string;
}

export interface SuiteResult {
  name: string;
  tests: TestResult[];
  startTime: Date;
  endTime: Date;
  duration: number;
  passed: number;
  failed: number;
  skipped: number;
  suites?: SuiteResult[];
}

export interface ReportConfig {
  outputDir: string;
  reportName?: string;
  timestamp?: boolean;
  embedScreenshots?: boolean;
  embedVideos?: boolean;
  includeSteps?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASE REPORTER
// ═══════════════════════════════════════════════════════════════════════════════

export abstract class BaseReporter extends EventEmitter {
  protected config: ReportConfig;
  protected results: TestResult[] = [];
  protected suites: Map<string, SuiteResult> = new Map();
  protected startTime: Date = new Date();

  constructor(config: Partial<ReportConfig> = {}) {
    super();
    this.config = {
      outputDir: './reports',
      reportName: 'report',
      timestamp: true,
      embedScreenshots: true,
      embedVideos: false,
      includeSteps: true,
      ...config
    };
    this.ensureOutputDir();
  }

  /**
   * Add test result
   */
  addResult(result: TestResult): void {
    this.results.push(result);
    
    // Add to suite
    const suiteName = result.suite || 'Default';
    if (!this.suites.has(suiteName)) {
      this.suites.set(suiteName, {
        name: suiteName,
        tests: [],
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      });
    }
    
    const suite = this.suites.get(suiteName)!;
    suite.tests.push(result);
    suite.endTime = new Date();
    suite.duration = suite.endTime.getTime() - suite.startTime.getTime();
    
    if (result.status === 'passed') suite.passed++;
    else if (result.status === 'failed') suite.failed++;
    else if (result.status === 'skipped') suite.skipped++;

    this.emit('result:added', result);
  }

  /**
   * Get summary
   */
  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    passRate: number;
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const duration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return { total, passed, failed, skipped, duration, passRate };
  }

  /**
   * Generate report
   */
  abstract generate(): Promise<string>;

  /**
   * Get report filename
   */
  protected getReportPath(extension: string): string {
    let filename = this.config.reportName!;
    if (this.config.timestamp) {
      filename += `_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    }
    return path.join(this.config.outputDir, `${filename}.${extension}`);
  }

  protected ensureOutputDir(): void {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HTML REPORTER
// ═══════════════════════════════════════════════════════════════════════════════

export class HTMLReporter extends BaseReporter {
  async generate(): Promise<string> {
    const summary = this.getSummary();
    const reportPath = this.getReportPath('html');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - Mind Engine</title>
    <style>
        :root {
            --bg-dark: #1a1a2e;
            --bg-card: #16213e;
            --text-primary: #eee;
            --text-secondary: #aaa;
            --accent: #e94560;
            --success: #00d26a;
            --warning: #ffc107;
            --info: #17a2b8;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: var(--bg-dark);
            color: var(--text-primary);
            min-height: 100vh;
            padding: 2rem;
        }
        
        .container { max-width: 1400px; margin: 0 auto; }
        
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid var(--accent);
        }
        
        h1 { font-size: 2rem; color: var(--accent); }
        
        .timestamp { color: var(--text-secondary); }
        
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .card {
            background: var(--bg-card);
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
        }
        
        .card h3 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .card.passed h3 { color: var(--success); }
        .card.failed h3 { color: var(--accent); }
        .card.skipped h3 { color: var(--warning); }
        .card.total h3 { color: var(--info); }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #333;
            border-radius: 4px;
            overflow: hidden;
            margin: 1rem 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--success), var(--accent));
            transition: width 0.5s ease;
        }
        
        .tests-table {
            width: 100%;
            border-collapse: collapse;
            background: var(--bg-card);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .tests-table th,
        .tests-table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid #333;
        }
        
        .tests-table th {
            background: rgba(233, 69, 96, 0.1);
            font-weight: 600;
        }
        
        .status {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        
        .status.passed { background: rgba(0, 210, 106, 0.2); color: var(--success); }
        .status.failed { background: rgba(233, 69, 96, 0.2); color: var(--accent); }
        .status.skipped { background: rgba(255, 193, 7, 0.2); color: var(--warning); }
        
        .duration { color: var(--text-secondary); font-size: 0.9rem; }
        
        .error-message {
            background: rgba(233, 69, 96, 0.1);
            padding: 1rem;
            border-radius: 4px;
            margin-top: 0.5rem;
            font-family: monospace;
            font-size: 0.85rem;
            white-space: pre-wrap;
            word-break: break-all;
        }
        
        .steps {
            margin-top: 0.5rem;
            padding-left: 1rem;
        }
        
        .step {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0;
            font-size: 0.9rem;
        }
        
        .step-icon { font-size: 1rem; }
        .step-icon.passed { color: var(--success); }
        .step-icon.failed { color: var(--accent); }
        
        .screenshot {
            max-width: 100%;
            border-radius: 4px;
            margin-top: 0.5rem;
        }
        
        .collapsible {
            cursor: pointer;
            user-select: none;
        }
        
        .collapsible::before {
            content: '▶';
            display: inline-block;
            margin-right: 0.5rem;
            transition: transform 0.2s;
        }
        
        .collapsible.open::before {
            transform: rotate(90deg);
        }
        
        .collapsible-content {
            display: none;
            padding: 1rem;
        }
        
        .collapsible-content.open {
            display: block;
        }
        
        @media (max-width: 768px) {
            .summary-cards { grid-template-columns: repeat(2, 1fr); }
            .tests-table { display: block; overflow-x: auto; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🧠 Mind Engine Test Report</h1>
            <span class="timestamp">${new Date().toLocaleString()}</span>
        </header>
        
        <section class="summary-cards">
            <div class="card total">
                <h3>${summary.total}</h3>
                <p>Total Tests</p>
            </div>
            <div class="card passed">
                <h3>${summary.passed}</h3>
                <p>Passed</p>
            </div>
            <div class="card failed">
                <h3>${summary.failed}</h3>
                <p>Failed</p>
            </div>
            <div class="card skipped">
                <h3>${summary.skipped}</h3>
                <p>Skipped</p>
            </div>
        </section>
        
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${summary.passRate}%"></div>
        </div>
        <p style="text-align: center; margin-bottom: 2rem;">
            Pass Rate: <strong>${summary.passRate.toFixed(1)}%</strong> | 
            Duration: <strong>${this.formatDuration(summary.duration)}</strong>
        </p>
        
        <table class="tests-table">
            <thead>
                <tr>
                    <th>Test</th>
                    <th>Suite</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
                ${this.results.map(r => this.renderTestRow(r)).join('')}
            </tbody>
        </table>
    </div>
    
    <script>
        document.querySelectorAll('.collapsible').forEach(el => {
            el.addEventListener('click', () => {
                el.classList.toggle('open');
                el.nextElementSibling?.classList.toggle('open');
            });
        });
    </script>
</body>
</html>`;

    fs.writeFileSync(reportPath, html);
    this.emit('report:generated', { path: reportPath, format: 'html' });
    
    return reportPath;
  }

  private renderTestRow(result: TestResult): string {
    const hasDetails = result.error || (result.steps && result.steps.length > 0);
    
    return `
      <tr>
        <td>${result.name}</td>
        <td>${result.suite || '-'}</td>
        <td><span class="status ${result.status}">${result.status.toUpperCase()}</span></td>
        <td class="duration">${this.formatDuration(result.duration)}</td>
        <td>
          ${hasDetails ? `
            <span class="collapsible">View Details</span>
            <div class="collapsible-content">
              ${result.error ? `<div class="error-message">${this.escapeHtml(result.error.message)}</div>` : ''}
              ${result.steps ? `
                <div class="steps">
                  ${result.steps.map(s => `
                    <div class="step">
                      <span class="step-icon ${s.status}">${s.status === 'passed' ? '✓' : '✗'}</span>
                      <span>${this.escapeHtml(s.name)}</span>
                      <span class="duration">(${s.duration}ms)</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              ${result.error?.screenshot ? `<img class="screenshot" src="${result.error.screenshot}" alt="Error Screenshot">` : ''}
            </div>
          ` : '-'}
        </td>
      </tr>
    `;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000).toFixed(0)}s`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JSON REPORTER
// ═══════════════════════════════════════════════════════════════════════════════

export class JSONReporter extends BaseReporter {
  async generate(): Promise<string> {
    const reportPath = this.getReportPath('json');
    
    const report = {
      metadata: {
        reportName: this.config.reportName,
        generatedAt: new Date().toISOString(),
        duration: this.getSummary().duration
      },
      summary: this.getSummary(),
      suites: Array.from(this.suites.values()),
      results: this.results
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.emit('report:generated', { path: reportPath, format: 'json' });
    
    return reportPath;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JUNIT REPORTER
// ═══════════════════════════════════════════════════════════════════════════════

export class JUnitReporter extends BaseReporter {
  async generate(): Promise<string> {
    const reportPath = this.getReportPath('xml');
    const summary = this.getSummary();
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Mind Engine Tests" tests="${summary.total}" failures="${summary.failed}" errors="0" skipped="${summary.skipped}" time="${summary.duration / 1000}">
${Array.from(this.suites.values()).map(suite => `
  <testsuite name="${this.escapeXml(suite.name)}" tests="${suite.tests.length}" failures="${suite.failed}" errors="0" skipped="${suite.skipped}" time="${suite.duration / 1000}">
    ${suite.tests.map(test => `
    <testcase name="${this.escapeXml(test.name)}" classname="${this.escapeXml(test.suite || 'Default')}" time="${test.duration / 1000}"${test.status === 'skipped' ? '>' : test.status === 'failed' ? '>' : '/>'}
      ${test.status === 'skipped' ? '<skipped/></testcase>' : ''}
      ${test.status === 'failed' ? `<failure message="${this.escapeXml(test.error?.message || 'Unknown error')}">${this.escapeXml(test.error?.stack || '')}</failure></testcase>` : ''}
    `).join('')}
  </testsuite>
`).join('')}
</testsuites>`;

    fs.writeFileSync(reportPath, xml);
    this.emit('report:generated', { path: reportPath, format: 'junit' });
    
    return reportPath;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSOLE REPORTER
// ═══════════════════════════════════════════════════════════════════════════════

export class ConsoleReporter extends BaseReporter {
  private colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  };

  async generate(): Promise<string> {
    const summary = this.getSummary();
    const { colors: c } = this;

    console.log('\n');
    console.log(`${c.bright}${c.cyan}═══════════════════════════════════════════════════════════════${c.reset}`);
    console.log(`${c.bright}${c.cyan}   🧠 MIND ENGINE TEST REPORT${c.reset}`);
    console.log(`${c.bright}${c.cyan}═══════════════════════════════════════════════════════════════${c.reset}`);
    console.log('');

    // Summary
    console.log(`${c.bright}📊 SUMMARY${c.reset}`);
    console.log(`   Total:   ${c.bright}${summary.total}${c.reset}`);
    console.log(`   ${c.green}✓ Passed: ${summary.passed}${c.reset}`);
    console.log(`   ${c.red}✗ Failed: ${summary.failed}${c.reset}`);
    console.log(`   ${c.yellow}○ Skipped: ${summary.skipped}${c.reset}`);
    console.log(`   Duration: ${this.formatDuration(summary.duration)}`);
    console.log(`   Pass Rate: ${c.bright}${summary.passRate.toFixed(1)}%${c.reset}`);
    console.log('');

    // Progress bar
    const barWidth = 50;
    const filledWidth = Math.round((summary.passRate / 100) * barWidth);
    const emptyWidth = barWidth - filledWidth;
    const bar = `${c.green}${'█'.repeat(filledWidth)}${c.reset}${c.dim}${'░'.repeat(emptyWidth)}${c.reset}`;
    console.log(`   [${bar}]`);
    console.log('');

    // Failed tests
    const failed = this.results.filter(r => r.status === 'failed');
    if (failed.length > 0) {
      console.log(`${c.bright}${c.red}❌ FAILED TESTS${c.reset}`);
      console.log('');
      
      for (const test of failed) {
        console.log(`   ${c.red}✗${c.reset} ${test.name}`);
        if (test.error) {
          console.log(`     ${c.dim}${test.error.message}${c.reset}`);
        }
        console.log('');
      }
    }

    // Test list
    console.log(`${c.bright}📋 TEST RESULTS${c.reset}`);
    console.log('');
    
    for (const test of this.results) {
      const icon = test.status === 'passed' ? `${c.green}✓${c.reset}` 
                 : test.status === 'failed' ? `${c.red}✗${c.reset}`
                 : `${c.yellow}○${c.reset}`;
      const duration = `${c.dim}(${test.duration}ms)${c.reset}`;
      console.log(`   ${icon} ${test.name} ${duration}`);
    }

    console.log('');
    console.log(`${c.bright}${c.cyan}═══════════════════════════════════════════════════════════════${c.reset}`);
    console.log('');

    return 'console';
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000).toFixed(0)}s`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALLURE-COMPATIBLE REPORTER
// ═══════════════════════════════════════════════════════════════════════════════

export class AllureReporter extends BaseReporter {
  private allureDir: string;

  constructor(config: Partial<ReportConfig> = {}) {
    super(config);
    this.allureDir = path.join(this.config.outputDir, 'allure-results');
    if (!fs.existsSync(this.allureDir)) {
      fs.mkdirSync(this.allureDir, { recursive: true });
    }
  }

  async generate(): Promise<string> {
    // Generate individual result files
    for (const result of this.results) {
      const allureResult = this.convertToAllure(result);
      const fileName = `${result.id}-result.json`;
      fs.writeFileSync(
        path.join(this.allureDir, fileName),
        JSON.stringify(allureResult, null, 2)
      );
    }

    // Generate container files for suites
    for (const [name, suite] of this.suites) {
      const container = {
        uuid: this.generateUUID(),
        name,
        children: suite.tests.map(t => t.id),
        start: suite.startTime.getTime(),
        stop: suite.endTime.getTime()
      };
      fs.writeFileSync(
        path.join(this.allureDir, `${container.uuid}-container.json`),
        JSON.stringify(container, null, 2)
      );
    }

    this.emit('report:generated', { path: this.allureDir, format: 'allure' });
    return this.allureDir;
  }

  private convertToAllure(result: TestResult): any {
    return {
      uuid: result.id,
      historyId: this.hashString(result.name),
      name: result.name,
      fullName: `${result.suite || 'Default'}.${result.name}`,
      status: this.convertStatus(result.status),
      statusDetails: result.error ? {
        message: result.error.message,
        trace: result.error.stack
      } : undefined,
      start: result.startTime.getTime(),
      stop: result.endTime?.getTime() || Date.now(),
      steps: result.steps?.map(s => ({
        name: s.name,
        status: this.convertStatus(s.status),
        start: 0,
        stop: s.duration
      })),
      attachments: result.attachments?.map(a => ({
        name: a.name,
        source: a.path,
        type: this.getAllureType(a.type)
      })),
      labels: [
        { name: 'suite', value: result.suite || 'Default' },
        ...(result.tags?.map(t => ({ name: 'tag', value: t })) || [])
      ]
    };
  }

  private convertStatus(status: string): string {
    const map: Record<string, string> = {
      'passed': 'passed',
      'failed': 'failed',
      'skipped': 'skipped',
      'pending': 'broken'
    };
    return map[status] || 'unknown';
  }

  private getAllureType(type: string): string {
    const map: Record<string, string> = {
      'screenshot': 'image/png',
      'video': 'video/mp4',
      'log': 'text/plain',
      'trace': 'application/json',
      'html': 'text/html',
      'json': 'application/json'
    };
    return map[type] || 'application/octet-stream';
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI REPORTER
// ═══════════════════════════════════════════════════════════════════════════════

export class MultiReporter extends EventEmitter {
  private reporters: BaseReporter[] = [];

  /**
   * Add reporter
   */
  addReporter(reporter: BaseReporter): this {
    this.reporters.push(reporter);
    return this;
  }

  /**
   * Add result to all reporters
   */
  addResult(result: TestResult): void {
    for (const reporter of this.reporters) {
      reporter.addResult(result);
    }
    this.emit('result:added', result);
  }

  /**
   * Generate all reports
   */
  async generate(): Promise<string[]> {
    const paths: string[] = [];
    
    for (const reporter of this.reporters) {
      const path = await reporter.generate();
      paths.push(path);
    }

    this.emit('reports:generated', { paths });
    return paths;
  }

  /**
   * Get combined summary
   */
  getSummary(): ReturnType<BaseReporter['getSummary']> {
    if (this.reporters.length > 0) {
      return this.reporters[0].getSummary();
    }
    return { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0, passRate: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTER FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export class ReporterFactory {
  static create(
    type: 'html' | 'json' | 'junit' | 'console' | 'allure',
    config?: Partial<ReportConfig>
  ): BaseReporter {
    switch (type) {
      case 'html': return new HTMLReporter(config);
      case 'json': return new JSONReporter(config);
      case 'junit': return new JUnitReporter(config);
      case 'console': return new ConsoleReporter(config);
      case 'allure': return new AllureReporter(config);
      default: throw new Error(`Unknown reporter type: ${type}`);
    }
  }

  static createMulti(
    types: Array<'html' | 'json' | 'junit' | 'console' | 'allure'>,
    config?: Partial<ReportConfig>
  ): MultiReporter {
    const multi = new MultiReporter();
    for (const type of types) {
      multi.addReporter(this.create(type, config));
    }
    return multi;
  }
}

export default {
  HTMLReporter,
  JSONReporter,
  JUnitReporter,
  ConsoleReporter,
  AllureReporter,
  MultiReporter,
  ReporterFactory
};
