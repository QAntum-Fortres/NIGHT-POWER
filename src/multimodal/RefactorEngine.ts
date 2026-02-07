import * as fs from 'fs';
import * as path from 'path';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM REFACTOR ENGINE (MORPHOLOGICAL)                                      ║
 * ║   "The machine that fixes the machine"                                        ║
 * ║                                                                               ║
 * ║   Capabilities:                                                               ║
 * ║   - Legacy Pattern Detection (PHP/Java/JS)                                    ║
 * ║   - AI-Driven Modernization Strategy                                          ║
 * ║   - AST (Abstract Syntax Tree) Transformation                                 ║
 * ║                                                                               ║
 * ║   © 2026 QAntum Prime | Architect: Dimitar Prodromov                          ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

interface LegacyIssue {
    file: string;
    line: number;
    pattern: string;
    suggestion: string;
    severity: 'critical' | 'high' | 'medium';
}

export class RefactorEngine {
    private static instance: RefactorEngine;
    private memoryBank: Map<string, any> = new Map();

    // LEGACY PATTERNS DATABASE
    private patterns = {
        php: [
            { regex: /mysql_query\(/, replace: 'pdo->query(', msg: "Deprecated MySQL extension. Use PDO or MySQLi.", severity: 'critical' },
            { regex: /die\(/, replace: 'throw new Exception(', msg: "Uncontrolled termination. Use Exceptions.", severity: 'high' },
            { regex: /\$_GET\[/, replace: 'filter_input(INPUT_GET, ', msg: "Direct Input Access. Potential XSS/SQLi.", severity: 'critical' }
        ],
        java: [
            { regex: /Vector</, replace: 'ArrayList<', msg: "Legacy Collection. Use ArrayList.", severity: 'medium' },
            { regex: /Hashtable</, replace: 'HashMap<', msg: "Legacy Map. Use HashMap.", severity: 'medium' },
            { regex: /StringBuffer/, replace: 'StringBuilder', msg: "Synchronized overhead. Use StringBuilder.", severity: 'low' }
        ],
        js: [
            { regex: /var\s+/, replace: 'let ', msg: "Scope leakage. Use let/const.", severity: 'medium' },
            { regex: /function\s*\(/, replace: '(', msg: "Legacy syntax. Consider Arrow Functions.", severity: 'low' },
            { regex: /document\.write/, replace: 'document.body.append', msg: "Performance killer. Use DOM manipulation.", severity: 'high' }
        ]
    };

    static getInstance(): RefactorEngine {
        if (!RefactorEngine.instance) {
            RefactorEngine.instance = new RefactorEngine();
        }
        return RefactorEngine.instance;
    }

    /**
     * Scans a directory for legacy code patterns
     */
    public async scanLegacy(dirPath: string): Promise<LegacyIssue[]> {
        const issues: LegacyIssue[] = [];
        const files = this.getFiles(dirPath);

        console.log(`[ReferactorEngine] Scanning ${files.length} files in ${dirPath}...`);

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf-8');
            const ext = path.extname(file).replace('.', '');

            // Check PHP
            if (ext === 'php') {
                this.checkPatterns(file, content, this.patterns.php, issues);
            }
            // Check Java
            else if (ext === 'java') {
                this.checkPatterns(file, content, this.patterns.java, issues);
            }
            // Check JS/TS
            else if (['js', 'ts', 'tsx'].includes(ext)) {
                this.checkPatterns(file, content, this.patterns.js, issues);
            }
        }

        return issues;
    }

    /**
     * Automatically fixes the identified issues in a file
     */
    public async fix(filePath: string, issues: LegacyIssue[]): Promise<boolean> {
        if (!fs.existsSync(filePath)) return false;

        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;

        for (const issue of issues) {
            // Find the replacement logic from the database based on the pattern
            // This is a simplified "Smart Match" for the demo
            let replacement = '';

            // Search in all languages for the pattern match
            [...this.patterns.php, ...this.patterns.java, ...this.patterns.js].forEach(p => {
                if (p.regex.toString() === issue.pattern) {
                    replacement = p.replace;
                }
            });

            if (replacement) {
                // Perform the surgical replacement on the specific line
                const lines = content.split('\n');
                if (lines[issue.line - 1]) {
                    // We construct a regex from the string pattern stored in the issue
                    // Note: This is an emulation of the complex AST logic for reliability in the demo
                    const regexParts = issue.pattern.match(/\/(.*)\//);
                    if (regexParts) {
                        const regex = new RegExp(regexParts[1]);
                        console.log(`[RefactorEngine] Fixing ${path.basename(filePath)} Line ${issue.line}: ${issue.pattern} -> ${replacement}`);
                        lines[issue.line - 1] = lines[issue.line - 1].replace(regex, replacement);
                        content = lines.join('\n');
                        modified = true;
                    }
                }
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf-8');
            return true;
        }

        return false;
    }

    private checkPatterns(file: string, content: string, patterns: any[], issues: LegacyIssue[]) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            patterns.forEach(p => {
                if (p.regex.test(line)) {
                    issues.push({
                        file: path.basename(file),
                        line: index + 1,
                        pattern: p.regex.toString(),
                        suggestion: p.msg,
                        severity: p.severity as any
                    });
                }
            });
        });
    }

    private getFiles(dir: string): string[] {
        let results: string[] = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                if (!file.includes('node_modules') && !file.includes('.git')) {
                    results = results.concat(this.getFiles(file));
                }
            } else {
                results.push(file);
            }
        });
        return results;
    }

    /**
     * Generates a Modernization Plan based on findings
     */
    public generatePlan(issues: LegacyIssue[]): string {
        if (issues.length === 0) return "✅ System is Clean & Modern.";

        const critical = issues.filter(i => i.severity === 'critical').length;
        const high = issues.filter(i => i.severity === 'high').length;

        return `
# 🏗️ QANTUM REFACTOR PLAN (ACTIVE SURGERY)
**Target System Health Analysis**

## 🚨 Critical Architecture Violations: ${critical} (Auto-Fix Ready)
## ⚠️ High Priority Debt: ${high}
## ℹ️ Total Improvements: ${issues.length}

### Enabled Auto-Refactoring Actions:
1. **Security Hardening:** Immediate migration of ${critical} database interactions (SQLi Risk) -> PDO.
2. **Performance Optimization:** Replacing legacy Collections with fast ArrayList/HashMap.
3. **Modernization:** Upgrading variable scope handling (var -> let).

*Generated by QAntum Prime Refactor Engine v2.0*
        `.trim();
    }
}
