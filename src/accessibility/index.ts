/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM ACCESSIBILITY MODULE                                                 ║
 * ║   "Unified accessibility testing facade"                                      ║
 * ║                                                                               ║
 * ║   TODO B #37 - Accessibility Testing Module                                   ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// RE-EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
    AccessibilityTester,
    WCAGLevel,
    ImpactLevel,
    AccessibilityViolation,
    ViolationNode,
    AccessibilityResult,
    A11yConfig,
    AccessibilityRule,
    getA11yTester,
    configureA11y,
    a11y
} from './tester';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED ACCESSIBILITY
// ═══════════════════════════════════════════════════════════════════════════════

import { AccessibilityTester, A11yConfig, AccessibilityResult, WCAGLevel } from './tester';

export interface A11yReportConfig {
    format?: 'html' | 'json' | 'text';
    includePassingRules?: boolean;
    groupByImpact?: boolean;
}

/**
 * Unified QAntum Accessibility
 */
export class QAntumAccessibility {
    private static instance: QAntumAccessibility;
    private tester: AccessibilityTester;

    private constructor(config?: A11yConfig) {
        this.tester = config 
            ? AccessibilityTester.configure(config)
            : AccessibilityTester.getInstance();
    }

    static getInstance(config?: A11yConfig): QAntumAccessibility {
        if (!QAntumAccessibility.instance) {
            QAntumAccessibility.instance = new QAntumAccessibility(config);
        }
        return QAntumAccessibility.instance;
    }

    static configure(config: A11yConfig): QAntumAccessibility {
        QAntumAccessibility.instance = new QAntumAccessibility(config);
        return QAntumAccessibility.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TESTING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Test HTML
     */
    test(html: string, url?: string): AccessibilityResult {
        return this.tester.test(html, url);
    }

    /**
     * Test at WCAG level
     */
    testAtLevel(html: string, level: WCAGLevel): AccessibilityResult {
        const configured = AccessibilityTester.configure({ level });
        return configured.test(html);
    }

    /**
     * Assert compliance
     */
    assertCompliant(html: string): void {
        this.tester.assertNoViolations(html);
    }

    /**
     * Assert WCAG AA compliance
     */
    assertWCAGAA(html: string): void {
        const configured = AccessibilityTester.configure({ level: 'AA' });
        configured.assertNoViolations(html);
    }

    /**
     * Assert WCAG AAA compliance
     */
    assertWCAGAAA(html: string): void {
        const configured = AccessibilityTester.configure({ level: 'AAA' });
        configured.assertNoViolations(html);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REPORTING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate report
     */
    generateReport(result: AccessibilityResult, config: A11yReportConfig = {}): string {
        const format = config.format || 'text';

        switch (format) {
            case 'json':
                return JSON.stringify(result, null, 2);
            case 'html':
                return this.generateHTMLReport(result, config);
            case 'text':
            default:
                return this.generateTextReport(result, config);
        }
    }

    private generateHTMLReport(result: AccessibilityResult, config: A11yReportConfig): string {
        const violationRows = result.violations.map(v => `
            <tr class="impact-${v.impact}">
                <td>${v.rule}</td>
                <td class="impact">${v.impact}</td>
                <td>${v.wcagLevel}</td>
                <td>${v.wcagCriteria.join(', ')}</td>
                <td>${v.nodes.length}</td>
            </tr>
        `).join('');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Accessibility Report - ${result.url}</title>
    <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; }
        h1 { color: #1a1a2e; }
        .summary { display: flex; gap: 1rem; margin: 1rem 0; }
        .summary-item { padding: 1rem; border-radius: 8px; }
        .critical { background: #fee2e2; color: #991b1b; }
        .serious { background: #fef3c7; color: #92400e; }
        .moderate { background: #e0f2fe; color: #075985; }
        .minor { background: #f0fdf4; color: #166534; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; }
        .impact-critical td { border-left: 4px solid #ef4444; }
        .impact-serious td { border-left: 4px solid #f59e0b; }
        .impact-moderate td { border-left: 4px solid #3b82f6; }
        .impact-minor td { border-left: 4px solid #22c55e; }
    </style>
</head>
<body>
    <h1>Accessibility Report</h1>
    <p><strong>URL:</strong> ${result.url}</p>
    <p><strong>Date:</strong> ${result.timestamp.toISOString()}</p>

    <div class="summary">
        <div class="summary-item critical">
            <strong>${result.summary.critical}</strong> Critical
        </div>
        <div class="summary-item serious">
            <strong>${result.summary.serious}</strong> Serious
        </div>
        <div class="summary-item moderate">
            <strong>${result.summary.moderate}</strong> Moderate
        </div>
        <div class="summary-item minor">
            <strong>${result.summary.minor}</strong> Minor
        </div>
    </div>

    <h2>Violations (${result.summary.total})</h2>
    ${result.violations.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>Rule</th>
                    <th>Impact</th>
                    <th>Level</th>
                    <th>WCAG</th>
                    <th>Issues</th>
                </tr>
            </thead>
            <tbody>
                ${violationRows}
            </tbody>
        </table>
    ` : '<p>No violations found!</p>'}

    <h2>Statistics</h2>
    <ul>
        <li>Rules Passed: ${result.passes}</li>
        <li>Rules Incomplete: ${result.incomplete}</li>
        <li>Rules Inapplicable: ${result.inapplicable}</li>
    </ul>
</body>
</html>`;
    }

    private generateTextReport(result: AccessibilityResult, config: A11yReportConfig): string {
        const lines: string[] = [
            '═══════════════════════════════════════════════════════════════════',
            '                    ACCESSIBILITY REPORT                            ',
            '═══════════════════════════════════════════════════════════════════',
            '',
            `URL: ${result.url}`,
            `Date: ${result.timestamp.toISOString()}`,
            '',
            '───────────────────────────────────────────────────────────────────',
            '                          SUMMARY                                  ',
            '───────────────────────────────────────────────────────────────────',
            '',
            `Total Violations: ${result.summary.total}`,
            `  Critical: ${result.summary.critical}`,
            `  Serious:  ${result.summary.serious}`,
            `  Moderate: ${result.summary.moderate}`,
            `  Minor:    ${result.summary.minor}`,
            '',
            `Passed: ${result.passes}`,
            ''
        ];

        if (result.violations.length > 0) {
            lines.push(
                '───────────────────────────────────────────────────────────────────',
                '                         VIOLATIONS                                ',
                '───────────────────────────────────────────────────────────────────',
                ''
            );

            for (const violation of result.violations) {
                lines.push(
                    `[${violation.impact.toUpperCase()}] ${violation.rule}`,
                    `  WCAG: ${violation.wcagCriteria.join(', ')} (Level ${violation.wcagLevel})`,
                    `  Issues: ${violation.nodes.length}`,
                    ''
                );

                for (const node of violation.nodes) {
                    lines.push(
                        `    Target: ${node.target.join(' > ')}`,
                        `    Problem: ${node.failureSummary}`,
                        ''
                    );
                }
            }
        }

        lines.push(
            '═══════════════════════════════════════════════════════════════════'
        );

        return lines.join('\n');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMPLIANCE SCORE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Calculate compliance score
     */
    getComplianceScore(result: AccessibilityResult): {
        score: number;
        grade: string;
        compliant: boolean;
    } {
        // Weight violations by impact
        const weights = {
            critical: 10,
            serious: 5,
            moderate: 2,
            minor: 1
        };

        const weightedViolations = 
            result.summary.critical * weights.critical +
            result.summary.serious * weights.serious +
            result.summary.moderate * weights.moderate +
            result.summary.minor * weights.minor;

        const totalChecks = result.passes + result.violations.length;
        const maxPenalty = totalChecks * weights.critical;

        const score = Math.max(0, Math.round((1 - weightedViolations / maxPenalty) * 100));

        let grade: string;
        if (score >= 95) grade = 'A';
        else if (score >= 85) grade = 'B';
        else if (score >= 70) grade = 'C';
        else if (score >= 50) grade = 'D';
        else grade = 'F';

        const compliant = result.summary.critical === 0 && result.summary.serious === 0;

        return { score, grade, compliant };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getQAntumA11y = (): QAntumAccessibility => QAntumAccessibility.getInstance();
export const configureQAntumA11y = (config: A11yConfig): QAntumAccessibility => 
    QAntumAccessibility.configure(config);

export default QAntumAccessibility;
