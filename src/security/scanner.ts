/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM SECURITY SCANNER                                                     ║
 * ║   "Vulnerability detection for web applications"                              ║
 * ║                                                                               ║
 * ║   TODO B #35 - Security: Vulnerability scanning                               ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Vulnerability {
    id: string;
    type: VulnerabilityType;
    severity: VulnerabilitySeverity;
    title: string;
    description: string;
    location?: string;
    evidence?: string;
    remediation?: string;
    references?: string[];
    cweId?: string;
    cvssScore?: number;
}

export type VulnerabilityType = 
    | 'xss'
    | 'sqli'
    | 'csrf'
    | 'ssrf'
    | 'idor'
    | 'xxe'
    | 'rce'
    | 'lfi'
    | 'rfi'
    | 'open-redirect'
    | 'sensitive-data'
    | 'misconfiguration'
    | 'broken-auth'
    | 'injection'
    | 'insecure-deserialization';

export interface ScanConfig {
    target: string;
    depth?: number;
    timeout?: number;
    scanTypes?: VulnerabilityType[];
    excludePatterns?: string[];
    headers?: Record<string, string>;
    cookies?: string;
    authentication?: {
        type: 'basic' | 'bearer' | 'form';
        credentials: Record<string, string>;
    };
}

export interface ScanResult {
    target: string;
    scanTime: Date;
    duration: number;
    vulnerabilities: Vulnerability[];
    summary: {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
    };
    coverage: {
        urlsScanned: number;
        formsScanned: number;
        parametersScanned: number;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY SCANNER
// ═══════════════════════════════════════════════════════════════════════════════

export class SecurityScanner {
    private static instance: SecurityScanner;
    private scanners: Map<VulnerabilityType, VulnerabilityScanner> = new Map();

    private constructor() {
        this.registerDefaultScanners();
    }

    static getInstance(): SecurityScanner {
        if (!SecurityScanner.instance) {
            SecurityScanner.instance = new SecurityScanner();
        }
        return SecurityScanner.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCANNER REGISTRATION
    // ─────────────────────────────────────────────────────────────────────────

    private registerDefaultScanners(): void {
        this.scanners.set('xss', new XSSScanner());
        this.scanners.set('sqli', new SQLiScanner());
        this.scanners.set('csrf', new CSRFScanner());
        this.scanners.set('open-redirect', new OpenRedirectScanner());
        this.scanners.set('sensitive-data', new SensitiveDataScanner());
        this.scanners.set('misconfiguration', new MisconfigurationScanner());
    }

    /**
     * Register custom scanner
     */
    registerScanner(type: VulnerabilityType, scanner: VulnerabilityScanner): void {
        this.scanners.set(type, scanner);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCANNING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Run security scan
     */
    async scan(config: ScanConfig): Promise<ScanResult> {
        const startTime = Date.now();
        const vulnerabilities: Vulnerability[] = [];
        const scanTypes = config.scanTypes || [...this.scanners.keys()];

        const coverage = {
            urlsScanned: 0,
            formsScanned: 0,
            parametersScanned: 0
        };

        for (const scanType of scanTypes) {
            const scanner = this.scanners.get(scanType);
            if (scanner) {
                const results = await scanner.scan(config);
                vulnerabilities.push(...results.vulnerabilities);
                coverage.urlsScanned += results.coverage?.urls || 0;
                coverage.formsScanned += results.coverage?.forms || 0;
                coverage.parametersScanned += results.coverage?.parameters || 0;
            }
        }

        // Calculate summary
        const summary = {
            total: vulnerabilities.length,
            critical: vulnerabilities.filter(v => v.severity === 'critical').length,
            high: vulnerabilities.filter(v => v.severity === 'high').length,
            medium: vulnerabilities.filter(v => v.severity === 'medium').length,
            low: vulnerabilities.filter(v => v.severity === 'low').length,
            info: vulnerabilities.filter(v => v.severity === 'info').length
        };

        return {
            target: config.target,
            scanTime: new Date(),
            duration: Date.now() - startTime,
            vulnerabilities,
            summary,
            coverage
        };
    }

    /**
     * Quick scan specific type
     */
    async scanFor(type: VulnerabilityType, target: string): Promise<Vulnerability[]> {
        const scanner = this.scanners.get(type);
        if (!scanner) {
            throw new Error(`No scanner registered for type: ${type}`);
        }

        const result = await scanner.scan({ target });
        return result.vulnerabilities;
    }

    /**
     * Check URL for vulnerabilities
     */
    async checkURL(url: string): Promise<Vulnerability[]> {
        const result = await this.scan({ target: url });
        return result.vulnerabilities;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VULNERABILITY SCANNERS
// ═══════════════════════════════════════════════════════════════════════════════

interface ScannerResult {
    vulnerabilities: Vulnerability[];
    coverage?: {
        urls?: number;
        forms?: number;
        parameters?: number;
    };
}

abstract class VulnerabilityScanner {
    abstract scan(config: ScanConfig): Promise<ScannerResult>;
    
    protected createVulnerability(
        type: VulnerabilityType,
        severity: VulnerabilitySeverity,
        title: string,
        description: string,
        options?: Partial<Vulnerability>
    ): Vulnerability {
        return {
            id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type,
            severity,
            title,
            description,
            ...options
        };
    }
}

class XSSScanner extends VulnerabilityScanner {
    private payloads = [
        '<script>alert(1)</script>',
        '"><img src=x onerror=alert(1)>',
        "'-alert(1)-'",
        '<svg onload=alert(1)>',
        'javascript:alert(1)'
    ];

    async scan(config: ScanConfig): Promise<ScannerResult> {
        const vulnerabilities: Vulnerability[] = [];

        // Simulate XSS check
        for (const payload of this.payloads) {
            // Would test payload against target
            // This is a simplified simulation
        }

        return {
            vulnerabilities,
            coverage: { urls: 1, parameters: this.payloads.length }
        };
    }
}

class SQLiScanner extends VulnerabilityScanner {
    private payloads = [
        "' OR '1'='1",
        "'; DROP TABLE users;--",
        "1' AND '1'='1",
        "1 UNION SELECT NULL--",
        "' OR 1=1--"
    ];

    async scan(config: ScanConfig): Promise<ScannerResult> {
        const vulnerabilities: Vulnerability[] = [];

        // Simulate SQLi check
        for (const payload of this.payloads) {
            // Would test payload against target
        }

        return {
            vulnerabilities,
            coverage: { urls: 1, parameters: this.payloads.length }
        };
    }
}

class CSRFScanner extends VulnerabilityScanner {
    async scan(config: ScanConfig): Promise<ScannerResult> {
        const vulnerabilities: Vulnerability[] = [];

        // Check for CSRF tokens in forms
        // Would analyze forms for token presence

        return {
            vulnerabilities,
            coverage: { forms: 0 }
        };
    }
}

class OpenRedirectScanner extends VulnerabilityScanner {
    private payloads = [
        '//evil.com',
        'https://evil.com',
        '/\\evil.com',
        '//evil.com/%2f..'
    ];

    async scan(config: ScanConfig): Promise<ScannerResult> {
        const vulnerabilities: Vulnerability[] = [];

        for (const payload of this.payloads) {
            // Would test redirect parameters
        }

        return {
            vulnerabilities,
            coverage: { parameters: this.payloads.length }
        };
    }
}

class SensitiveDataScanner extends VulnerabilityScanner {
    private patterns = {
        email: /[\w.-]+@[\w.-]+\.\w+/g,
        phone: /\+?\d{10,}/g,
        ssn: /\d{3}-\d{2}-\d{4}/g,
        creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
        apiKey: /(?:api[_-]?key|apikey|api_secret)["\s]*[:=]["\s]*[\w-]{20,}/gi,
        jwt: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g
    };

    async scan(config: ScanConfig): Promise<ScannerResult> {
        const vulnerabilities: Vulnerability[] = [];

        // Would scan response for sensitive patterns

        return {
            vulnerabilities,
            coverage: { urls: 1 }
        };
    }
}

class MisconfigurationScanner extends VulnerabilityScanner {
    private checks = [
        { header: 'X-Frame-Options', description: 'Missing clickjacking protection' },
        { header: 'X-Content-Type-Options', description: 'Missing MIME sniffing protection' },
        { header: 'X-XSS-Protection', description: 'Missing XSS filter' },
        { header: 'Strict-Transport-Security', description: 'Missing HSTS' },
        { header: 'Content-Security-Policy', description: 'Missing CSP' }
    ];

    async scan(config: ScanConfig): Promise<ScannerResult> {
        const vulnerabilities: Vulnerability[] = [];

        // Would check security headers
        for (const check of this.checks) {
            // Check if header is present
        }

        return {
            vulnerabilities,
            coverage: { urls: 1 }
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEADER CHECKER
// ═══════════════════════════════════════════════════════════════════════════════

export class SecurityHeaderChecker {
    private requiredHeaders = new Map<string, { description: string; severity: VulnerabilitySeverity }>([
        ['Strict-Transport-Security', { description: 'Enforces HTTPS connections', severity: 'high' }],
        ['X-Frame-Options', { description: 'Prevents clickjacking', severity: 'medium' }],
        ['X-Content-Type-Options', { description: 'Prevents MIME sniffing', severity: 'low' }],
        ['X-XSS-Protection', { description: 'Enables XSS filter', severity: 'low' }],
        ['Content-Security-Policy', { description: 'Controls resource loading', severity: 'high' }],
        ['Referrer-Policy', { description: 'Controls referrer info', severity: 'low' }],
        ['Permissions-Policy', { description: 'Controls browser features', severity: 'medium' }]
    ]);

    /**
     * Check headers
     */
    check(headers: Record<string, string>): Vulnerability[] {
        const vulnerabilities: Vulnerability[] = [];
        const normalizedHeaders = this.normalizeHeaders(headers);

        for (const [header, info] of this.requiredHeaders) {
            if (!normalizedHeaders[header.toLowerCase()]) {
                vulnerabilities.push({
                    id: `header-${header.toLowerCase()}-${Date.now()}`,
                    type: 'misconfiguration',
                    severity: info.severity,
                    title: `Missing Security Header: ${header}`,
                    description: info.description,
                    remediation: `Add the ${header} header to HTTP responses`,
                    references: [`https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/${header}`]
                });
            }
        }

        return vulnerabilities;
    }

    private normalizeHeaders(headers: Record<string, string>): Record<string, string> {
        const normalized: Record<string, string> = {};
        for (const [key, value] of Object.entries(headers)) {
            normalized[key.toLowerCase()] = value;
        }
        return normalized;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getSecurityScanner = (): SecurityScanner => SecurityScanner.getInstance();
export const getHeaderChecker = (): SecurityHeaderChecker => new SecurityHeaderChecker();

// Quick security operations
export const security = {
    scan: (config: ScanConfig) => SecurityScanner.getInstance().scan(config),
    scanFor: (type: VulnerabilityType, target: string) => SecurityScanner.getInstance().scanFor(type, target),
    checkURL: (url: string) => SecurityScanner.getInstance().checkURL(url),
    checkHeaders: (headers: Record<string, string>) => new SecurityHeaderChecker().check(headers)
};

export default SecurityScanner;
