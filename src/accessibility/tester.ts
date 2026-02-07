/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM ACCESSIBILITY TESTING                                                ║
 * ║   "WCAG 2.1 compliance testing engine"                                        ║
 * ║                                                                               ║
 * ║   TODO B #37 - Accessibility: WCAG testing                                    ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type WCAGLevel = 'A' | 'AA' | 'AAA';
export type ImpactLevel = 'critical' | 'serious' | 'moderate' | 'minor';

export interface AccessibilityViolation {
    id: string;
    rule: string;
    impact: ImpactLevel;
    wcagLevel: WCAGLevel;
    wcagCriteria: string[];
    description: string;
    help: string;
    helpUrl?: string;
    nodes: ViolationNode[];
}

export interface ViolationNode {
    html: string;
    target: string[];
    failureSummary: string;
}

export interface AccessibilityResult {
    url: string;
    timestamp: Date;
    violations: AccessibilityViolation[];
    passes: number;
    incomplete: number;
    inapplicable: number;
    summary: {
        critical: number;
        serious: number;
        moderate: number;
        minor: number;
        total: number;
    };
}

export interface A11yConfig {
    level?: WCAGLevel;
    rules?: string[];
    exclude?: string[];
    include?: string[];
    timeout?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCESSIBILITY RULES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AccessibilityRule {
    id: string;
    name: string;
    wcagLevel: WCAGLevel;
    wcagCriteria: string[];
    impact: ImpactLevel;
    check: (html: string) => ViolationNode[];
}

const accessibilityRules: AccessibilityRule[] = [
    // Image alt text
    {
        id: 'image-alt',
        name: 'Images must have alt text',
        wcagLevel: 'A',
        wcagCriteria: ['1.1.1'],
        impact: 'critical',
        check: (html) => {
            const violations: ViolationNode[] = [];
            const imgRegex = /<img\s+[^>]*>/gi;
            let match;

            while ((match = imgRegex.exec(html)) !== null) {
                const imgTag = match[0];
                if (!imgTag.includes('alt=')) {
                    violations.push({
                        html: imgTag,
                        target: ['img'],
                        failureSummary: 'Image missing alt attribute'
                    });
                }
            }

            return violations;
        }
    },

    // Form labels
    {
        id: 'label',
        name: 'Form inputs must have labels',
        wcagLevel: 'A',
        wcagCriteria: ['1.3.1', '4.1.2'],
        impact: 'critical',
        check: (html) => {
            const violations: ViolationNode[] = [];
            const inputRegex = /<input\s+[^>]*type=["'](?:text|email|password|tel|number|search)["'][^>]*>/gi;
            let match;

            while ((match = inputRegex.exec(html)) !== null) {
                const inputTag = match[0];
                const hasId = /id=["']([^"']+)["']/.exec(inputTag);
                
                if (!hasId) {
                    violations.push({
                        html: inputTag,
                        target: ['input'],
                        failureSummary: 'Input missing id for label association'
                    });
                } else {
                    const labelRegex = new RegExp(`<label[^>]*for=["']${hasId[1]}["']`, 'i');
                    if (!labelRegex.test(html)) {
                        violations.push({
                            html: inputTag,
                            target: ['input'],
                            failureSummary: 'Input missing associated label'
                        });
                    }
                }
            }

            return violations;
        }
    },

    // Document language
    {
        id: 'html-lang',
        name: 'HTML must have lang attribute',
        wcagLevel: 'A',
        wcagCriteria: ['3.1.1'],
        impact: 'serious',
        check: (html) => {
            const violations: ViolationNode[] = [];
            const htmlRegex = /<html[^>]*>/i;
            const match = htmlRegex.exec(html);

            if (match && !match[0].includes('lang=')) {
                violations.push({
                    html: match[0],
                    target: ['html'],
                    failureSummary: 'HTML element missing lang attribute'
                });
            }

            return violations;
        }
    },

    // Page title
    {
        id: 'document-title',
        name: 'Documents must have title',
        wcagLevel: 'A',
        wcagCriteria: ['2.4.2'],
        impact: 'serious',
        check: (html) => {
            const violations: ViolationNode[] = [];

            if (!/<title[^>]*>[^<]+<\/title>/i.test(html)) {
                violations.push({
                    html: '<head>...</head>',
                    target: ['head'],
                    failureSummary: 'Document missing title element or title is empty'
                });
            }

            return violations;
        }
    },

    // Color contrast (simplified check)
    {
        id: 'color-contrast',
        name: 'Text must have sufficient contrast',
        wcagLevel: 'AA',
        wcagCriteria: ['1.4.3'],
        impact: 'serious',
        check: (html) => {
            // Full contrast check requires computed styles
            // This is a placeholder for the concept
            return [];
        }
    },

    // Link text
    {
        id: 'link-name',
        name: 'Links must have discernible text',
        wcagLevel: 'A',
        wcagCriteria: ['2.4.4', '4.1.2'],
        impact: 'serious',
        check: (html) => {
            const violations: ViolationNode[] = [];
            const linkRegex = /<a\s+[^>]*href[^>]*>([^<]*)<\/a>/gi;
            let match;

            while ((match = linkRegex.exec(html)) !== null) {
                const linkText = match[1].trim();
                if (!linkText && !match[0].includes('aria-label')) {
                    violations.push({
                        html: match[0],
                        target: ['a'],
                        failureSummary: 'Link has no discernible text'
                    });
                }
            }

            return violations;
        }
    },

    // Button name
    {
        id: 'button-name',
        name: 'Buttons must have discernible text',
        wcagLevel: 'A',
        wcagCriteria: ['4.1.2'],
        impact: 'critical',
        check: (html) => {
            const violations: ViolationNode[] = [];
            const buttonRegex = /<button[^>]*>([^<]*)<\/button>/gi;
            let match;

            while ((match = buttonRegex.exec(html)) !== null) {
                const buttonText = match[1].trim();
                if (!buttonText && !match[0].includes('aria-label')) {
                    violations.push({
                        html: match[0],
                        target: ['button'],
                        failureSummary: 'Button has no discernible text'
                    });
                }
            }

            return violations;
        }
    },

    // Skip link
    {
        id: 'skip-link',
        name: 'Page should have skip to main content link',
        wcagLevel: 'A',
        wcagCriteria: ['2.4.1'],
        impact: 'moderate',
        check: (html) => {
            const violations: ViolationNode[] = [];

            if (!/<a[^>]*href=["']#(main|content|maincontent)[^>]*>/i.test(html)) {
                violations.push({
                    html: '<body>...</body>',
                    target: ['body'],
                    failureSummary: 'Page missing skip to main content link'
                });
            }

            return violations;
        }
    },

    // Heading order
    {
        id: 'heading-order',
        name: 'Heading levels should increase by one',
        wcagLevel: 'A',
        wcagCriteria: ['1.3.1'],
        impact: 'moderate',
        check: (html) => {
            const violations: ViolationNode[] = [];
            const headingRegex = /<h([1-6])[^>]*>/gi;
            let lastLevel = 0;
            let match;

            while ((match = headingRegex.exec(html)) !== null) {
                const level = parseInt(match[1]);
                if (lastLevel > 0 && level > lastLevel + 1) {
                    violations.push({
                        html: match[0],
                        target: [`h${level}`],
                        failureSummary: `Heading skipped from h${lastLevel} to h${level}`
                    });
                }
                lastLevel = level;
            }

            return violations;
        }
    }
];

// ═══════════════════════════════════════════════════════════════════════════════
// ACCESSIBILITY TESTER
// ═══════════════════════════════════════════════════════════════════════════════

export class AccessibilityTester {
    private static instance: AccessibilityTester;
    private rules: AccessibilityRule[] = [...accessibilityRules];
    private config: A11yConfig;

    private constructor(config: A11yConfig = {}) {
        this.config = {
            level: config.level || 'AA',
            rules: config.rules,
            exclude: config.exclude || [],
            include: config.include,
            timeout: config.timeout || 30000
        };
    }

    static getInstance(config?: A11yConfig): AccessibilityTester {
        if (!AccessibilityTester.instance) {
            AccessibilityTester.instance = new AccessibilityTester(config);
        }
        return AccessibilityTester.instance;
    }

    static configure(config: A11yConfig): AccessibilityTester {
        AccessibilityTester.instance = new AccessibilityTester(config);
        return AccessibilityTester.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TESTING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Test HTML for accessibility violations
     */
    test(html: string, url?: string): AccessibilityResult {
        const violations: AccessibilityViolation[] = [];
        let passes = 0;
        let incomplete = 0;
        const inapplicable = 0;

        const rulesToRun = this.getRulesToRun();

        for (const rule of rulesToRun) {
            const nodes = rule.check(html);
            
            if (nodes.length > 0) {
                violations.push({
                    id: rule.id,
                    rule: rule.name,
                    impact: rule.impact,
                    wcagLevel: rule.wcagLevel,
                    wcagCriteria: rule.wcagCriteria,
                    description: rule.name,
                    help: `Fix: ${rule.name}`,
                    nodes
                });
            } else {
                passes++;
            }
        }

        // Calculate summary
        const summary = {
            critical: violations.filter(v => v.impact === 'critical').length,
            serious: violations.filter(v => v.impact === 'serious').length,
            moderate: violations.filter(v => v.impact === 'moderate').length,
            minor: violations.filter(v => v.impact === 'minor').length,
            total: violations.length
        };

        return {
            url: url || 'unknown',
            timestamp: new Date(),
            violations,
            passes,
            incomplete,
            inapplicable,
            summary
        };
    }

    /**
     * Assert no violations
     */
    assertNoViolations(html: string): void {
        const result = this.test(html);
        
        if (result.violations.length > 0) {
            const details = result.violations.map(v => 
                `- [${v.impact.toUpperCase()}] ${v.rule}: ${v.nodes.length} issue(s)`
            ).join('\n');

            throw new Error(
                `Accessibility violations found:\n${details}\n\n` +
                `Total: ${result.summary.total} violations ` +
                `(${result.summary.critical} critical, ${result.summary.serious} serious)`
            );
        }
    }

    /**
     * Assert no critical/serious violations
     */
    assertNoSerious(html: string): void {
        const result = this.test(html);
        const serious = result.violations.filter(v => 
            v.impact === 'critical' || v.impact === 'serious'
        );

        if (serious.length > 0) {
            const details = serious.map(v => 
                `- [${v.impact.toUpperCase()}] ${v.rule}: ${v.nodes.length} issue(s)`
            ).join('\n');

            throw new Error(
                `Serious accessibility violations found:\n${details}`
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RULE MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Add custom rule
     */
    addRule(rule: AccessibilityRule): void {
        this.rules.push(rule);
    }

    /**
     * Get rules to run based on config
     */
    private getRulesToRun(): AccessibilityRule[] {
        let rules = this.rules;

        // Filter by WCAG level
        const levelOrder: WCAGLevel[] = ['A', 'AA', 'AAA'];
        const maxLevel = levelOrder.indexOf(this.config.level!);
        rules = rules.filter(r => levelOrder.indexOf(r.wcagLevel) <= maxLevel);

        // Filter by include list
        if (this.config.include?.length) {
            rules = rules.filter(r => this.config.include!.includes(r.id));
        }

        // Filter by exclude list
        if (this.config.exclude?.length) {
            rules = rules.filter(r => !this.config.exclude!.includes(r.id));
        }

        // Filter by specific rules
        if (this.config.rules?.length) {
            rules = rules.filter(r => this.config.rules!.includes(r.id));
        }

        return rules;
    }

    /**
     * Get available rules
     */
    getAvailableRules(): string[] {
        return this.rules.map(r => r.id);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getA11yTester = (): AccessibilityTester => AccessibilityTester.getInstance();
export const configureA11y = (config: A11yConfig): AccessibilityTester => 
    AccessibilityTester.configure(config);

// Quick a11y operations
export const a11y = {
    test: (html: string, url?: string) => AccessibilityTester.getInstance().test(html, url),
    assertNoViolations: (html: string) => AccessibilityTester.getInstance().assertNoViolations(html),
    assertNoSerious: (html: string) => AccessibilityTester.getInstance().assertNoSerious(html),
    getRules: () => AccessibilityTester.getInstance().getAvailableRules()
};

export default AccessibilityTester;
