/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM REPORT GENERATOR                                                     ║
 * ║   "Beautiful test reports in any format"                                      ║
 * ║                                                                               ║
 * ║   TODO B #17 - Reporting: Multi-Format Reports                                ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ReportFormat = 'html' | 'json' | 'xml' | 'junit' | 'markdown' | 'csv';

export interface TestResult {
    id: string;
    name: string;
    suite?: string;
    status: 'passed' | 'failed' | 'skipped' | 'pending';
    duration: number;
    startedAt: number;
    endedAt: number;
    error?: {
        message: string;
        stack?: string;
        type?: string;
    };
    screenshots?: string[];
    videos?: string[];
    logs?: string[];
    metadata?: Record<string, any>;
}

export interface SuiteResult {
    name: string;
    tests: TestResult[];
    duration: number;
    passed: number;
    failed: number;
    skipped: number;
}

export interface ReportData {
    title: string;
    timestamp: number;
    duration: number;
    environment: Record<string, string>;
    suites: SuiteResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        passRate: number;
    };
    metadata?: Record<string, any>;
}

export interface ReportOptions {
    format: ReportFormat;
    outputPath?: string;
    includeScreenshots?: boolean;
    includeVideos?: boolean;
    includeLogs?: boolean;
    templatePath?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class ReportGenerator {
    private static instance: ReportGenerator;

    static getInstance(): ReportGenerator {
        if (!ReportGenerator.instance) {
            ReportGenerator.instance = new ReportGenerator();
        }
        return ReportGenerator.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GENERATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate report
     */
    generate(data: ReportData, options: ReportOptions): string {
        switch (options.format) {
            case 'html':
                return this.generateHTML(data, options);
            case 'json':
                return this.generateJSON(data);
            case 'xml':
                return this.generateXML(data);
            case 'junit':
                return this.generateJUnit(data);
            case 'markdown':
                return this.generateMarkdown(data);
            case 'csv':
                return this.generateCSV(data);
            default:
                throw new Error(`Unsupported format: ${options.format}`);
        }
    }

    /**
     * Generate multiple formats
     */
    generateMultiple(data: ReportData, formats: ReportFormat[]): Map<ReportFormat, string> {
        const reports = new Map<ReportFormat, string>();

        for (const format of formats) {
            reports.set(format, this.generate(data, { format }));
        }

        return reports;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HTML
    // ─────────────────────────────────────────────────────────────────────────

    private generateHTML(data: ReportData, options: ReportOptions): string {
        const passRate = data.summary.passRate * 100;
        const statusColor = passRate >= 90 ? '#22c55e' : passRate >= 70 ? '#f59e0b' : '#ef4444';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} - QAntum Test Report</title>
    <style>
        :root {
            --primary: #6366f1;
            --success: #22c55e;
            --warning: #f59e0b;
            --danger: #ef4444;
            --bg: #0f172a;
            --surface: #1e293b;
            --text: #f8fafc;
            --text-muted: #94a3b8;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        header {
            text-align: center;
            padding: 3rem 0;
            border-bottom: 1px solid var(--surface);
        }
        h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .subtitle { color: var(--text-muted); font-size: 1.1rem; }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        .stat-card {
            background: var(--surface);
            padding: 1.5rem;
            border-radius: 12px;
            text-align: center;
        }
        .stat-value { font-size: 2.5rem; font-weight: bold; }
        .stat-label { color: var(--text-muted); font-size: 0.9rem; }
        .pass-rate {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: conic-gradient(${statusColor} ${passRate}%, var(--surface) 0);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
        }
        .pass-rate-inner {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: var(--bg);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        }
        .suite { margin: 2rem 0; }
        .suite-header {
            background: var(--surface);
            padding: 1rem 1.5rem;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .suite-name { font-weight: 600; font-size: 1.1rem; }
        .suite-stats { display: flex; gap: 1rem; }
        .test-list { background: var(--surface); border-radius: 0 0 8px 8px; }
        .test {
            padding: 1rem 1.5rem;
            border-top: 1px solid rgba(255,255,255,0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-name { display: flex; align-items: center; gap: 0.75rem; }
        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-passed { background: rgba(34, 197, 94, 0.2); color: var(--success); }
        .status-failed { background: rgba(239, 68, 68, 0.2); color: var(--danger); }
        .status-skipped { background: rgba(245, 158, 11, 0.2); color: var(--warning); }
        .duration { color: var(--text-muted); font-size: 0.9rem; }
        .error-details {
            background: rgba(239, 68, 68, 0.1);
            border-left: 3px solid var(--danger);
            padding: 1rem;
            margin-top: 0.5rem;
            font-family: monospace;
            font-size: 0.85rem;
            white-space: pre-wrap;
            word-break: break-all;
        }
        footer {
            text-align: center;
            padding: 2rem;
            color: var(--text-muted);
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${data.title}</h1>
            <p class="subtitle">Generated on ${new Date(data.timestamp).toLocaleString()}</p>
        </header>

        <section class="summary">
            <div class="stat-card">
                <div class="pass-rate">
                    <div class="pass-rate-inner">
                        <div class="stat-value" style="color: ${statusColor}">${passRate.toFixed(1)}%</div>
                        <div class="stat-label">Pass Rate</div>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.summary.total}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: var(--success)">${data.summary.passed}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: var(--danger)">${data.summary.failed}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: var(--warning)">${data.summary.skipped}</div>
                <div class="stat-label">Skipped</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.formatDuration(data.duration)}</div>
                <div class="stat-label">Duration</div>
            </div>
        </section>

        ${data.suites.map(suite => `
        <section class="suite">
            <div class="suite-header">
                <span class="suite-name">${suite.name}</span>
                <div class="suite-stats">
                    <span style="color: var(--success)">✓ ${suite.passed}</span>
                    <span style="color: var(--danger)">✗ ${suite.failed}</span>
                    <span style="color: var(--warning)">○ ${suite.skipped}</span>
                </div>
            </div>
            <div class="test-list">
                ${suite.tests.map(test => `
                <div class="test">
                    <div class="test-name">
                        <span class="status-badge status-${test.status}">${test.status}</span>
                        <span>${test.name}</span>
                    </div>
                    <span class="duration">${this.formatDuration(test.duration)}</span>
                </div>
                ${test.error ? `<div class="error-details">${this.escapeHtml(test.error.message)}\n${this.escapeHtml(test.error.stack || '')}</div>` : ''}
                `).join('')}
            </div>
        </section>
        `).join('')}

        <footer>
            <p>Generated by QAntum Test Framework v28.4</p>
            <p>© 2025-2026 QAntum | Dimitar Prodromov</p>
        </footer>
    </div>
</body>
</html>`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // JSON
    // ─────────────────────────────────────────────────────────────────────────

    private generateJSON(data: ReportData): string {
        return JSON.stringify(data, null, 2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // XML
    // ─────────────────────────────────────────────────────────────────────────

    private generateXML(data: ReportData): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<testReport>
    <title>${this.escapeXml(data.title)}</title>
    <timestamp>${new Date(data.timestamp).toISOString()}</timestamp>
    <duration>${data.duration}</duration>
    <summary>
        <total>${data.summary.total}</total>
        <passed>${data.summary.passed}</passed>
        <failed>${data.summary.failed}</failed>
        <skipped>${data.summary.skipped}</skipped>
        <passRate>${data.summary.passRate}</passRate>
    </summary>
    <suites>
        ${data.suites.map(suite => `
        <suite name="${this.escapeXml(suite.name)}">
            <duration>${suite.duration}</duration>
            <tests>
                ${suite.tests.map(test => `
                <test id="${this.escapeXml(test.id)}" name="${this.escapeXml(test.name)}" status="${test.status}">
                    <duration>${test.duration}</duration>
                    ${test.error ? `<error type="${this.escapeXml(test.error.type || 'Error')}">${this.escapeXml(test.error.message)}</error>` : ''}
                </test>
                `).join('')}
            </tests>
        </suite>
        `).join('')}
    </suites>
</testReport>`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // JUNIT
    // ─────────────────────────────────────────────────────────────────────────

    private generateJUnit(data: ReportData): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="${this.escapeXml(data.title)}" tests="${data.summary.total}" failures="${data.summary.failed}" errors="0" skipped="${data.summary.skipped}" time="${data.duration / 1000}">
    ${data.suites.map(suite => `
    <testsuite name="${this.escapeXml(suite.name)}" tests="${suite.tests.length}" failures="${suite.failed}" errors="0" skipped="${suite.skipped}" time="${suite.duration / 1000}">
        ${suite.tests.map(test => `
        <testcase name="${this.escapeXml(test.name)}" classname="${this.escapeXml(suite.name)}" time="${test.duration / 1000}">
            ${test.status === 'failed' ? `<failure type="${this.escapeXml(test.error?.type || 'AssertionError')}" message="${this.escapeXml(test.error?.message || 'Test failed')}"><![CDATA[${test.error?.stack || ''}]]></failure>` : ''}
            ${test.status === 'skipped' ? '<skipped/>' : ''}
        </testcase>
        `).join('')}
    </testsuite>
    `).join('')}
</testsuites>`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MARKDOWN
    // ─────────────────────────────────────────────────────────────────────────

    private generateMarkdown(data: ReportData): string {
        const passRate = (data.summary.passRate * 100).toFixed(1);

        return `# ${data.title}

> Generated on ${new Date(data.timestamp).toLocaleString()}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${data.summary.total} |
| Passed | ${data.summary.passed} ✅ |
| Failed | ${data.summary.failed} ❌ |
| Skipped | ${data.summary.skipped} ⏭️ |
| Pass Rate | ${passRate}% |
| Duration | ${this.formatDuration(data.duration)} |

## Test Results

${data.suites.map(suite => `
### ${suite.name}

| Test | Status | Duration |
|------|--------|----------|
${suite.tests.map(test => `| ${test.name} | ${this.getStatusEmoji(test.status)} ${test.status} | ${this.formatDuration(test.duration)} |`).join('\n')}

${suite.tests.filter(t => t.error).map(test => `
<details>
<summary>❌ ${test.name}</summary>

\`\`\`
${test.error?.message}
${test.error?.stack || ''}
\`\`\`

</details>
`).join('')}
`).join('')}

---
*Generated by QAntum Test Framework v28.4*
`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CSV
    // ─────────────────────────────────────────────────────────────────────────

    private generateCSV(data: ReportData): string {
        const rows = ['id,name,suite,status,duration,error'];

        for (const suite of data.suites) {
            for (const test of suite.tests) {
                rows.push([
                    this.escapeCSV(test.id),
                    this.escapeCSV(test.name),
                    this.escapeCSV(suite.name),
                    test.status,
                    test.duration.toString(),
                    this.escapeCSV(test.error?.message || '')
                ].join(','));
            }
        }

        return rows.join('\n');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private formatDuration(ms: number): string {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}m ${seconds}s`;
    }

    private getStatusEmoji(status: string): string {
        switch (status) {
            case 'passed': return '✅';
            case 'failed': return '❌';
            case 'skipped': return '⏭️';
            default: return '⏳';
        }
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    private escapeXml(str: string): string {
        return this.escapeHtml(str);
    }

    private escapeCSV(str: string): string {
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getReportGenerator = (): ReportGenerator => ReportGenerator.getInstance();

export default ReportGenerator;
