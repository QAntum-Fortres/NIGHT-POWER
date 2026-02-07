/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PUBLIC SCANNER - The Legal Intelligence Gatherer
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Ние не хакваме. Ние четем вестника, който те сами са публикували."
 * 
 * This module scans ONLY publicly accessible data:
 * - SSL certificates (publicly verifiable)
 * - HTTP security headers (returned with every request)
 * - robots.txt (public by definition)
 * - security.txt (RFC 9116 standard)
 * - DNS records (public infrastructure)
 * - Performance metrics (standard HTTP timing)
 * 
 * Legal Basis: Same as Google, Ahrefs, SSL Labs, SecurityHeaders.com
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 33.1.0 - THE ETHICAL PREDATOR
 */

import { EventEmitter } from 'events';
import * as https from 'https';
import * as http from 'http';
import * as dns from 'dns';
import { promisify } from 'util';

// Promisified DNS
const dnsResolve = promisify(dns.resolve);
const dnsResolve4 = promisify(dns.resolve4);
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolveTxt = promisify(dns.resolveTxt);

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ScanConfig {
  ssl?: boolean;
  headers?: boolean;
  securityTxt?: boolean;
  robotsTxt?: boolean;
  performance?: boolean;
  dns?: boolean;
  accessibility?: boolean;
}

export interface PublicScanResult {
  url: string;
  domain: string;
  scannedAt: Date;
  legalBasis: string;
  
  ssl?: SSLResult;
  headers?: HeadersResult;
  securityTxt?: SecurityTxtResult;
  robotsTxt?: RobotsTxtResult;
  performance?: PerformanceResult;
  dns?: DNSResult;
  
  overallScore: number;
  criticalIssues: Issue[];
  warnings: Issue[];
  recommendations: string[];
}

export interface SSLResult {
  valid: boolean;
  issuer: string;
  expiresIn: number;
  grade: string;
  protocols: string[];
  issues: string[];
}

export interface HeadersResult {
  present: string[];
  missing: string[];
  score: number;
  details: Record<string, string>;
}

export interface SecurityTxtResult {
  exists: boolean;
  contact?: string;
  encryption?: string;
  policy?: string;
  acknowledgments?: string;
  preferredLanguages?: string;
  canonical?: string;
  expires?: string;
}

export interface RobotsTxtResult {
  exists: boolean;
  allowsAll: boolean;
  disallowedPaths: string[];
  sitemapUrls: string[];
  crawlDelay?: number;
}

export interface PerformanceResult {
  ttfb: number;
  totalTime: number;
  contentSize: number;
  compressed: boolean;
  http2: boolean;
  score: number;
}

export interface DNSResult {
  aRecords: string[];
  mxRecords: { exchange: string; priority: number }[];
  txtRecords: string[];
  hasSPF: boolean;
  hasDMARC: boolean;
  hasDKIM: boolean;
}

export interface Issue {
  id: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  fix: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC SCANNER
// ═══════════════════════════════════════════════════════════════════════════════

export class PublicScanner extends EventEmitter {
  private static instance: PublicScanner;

  private static readonly SECURITY_HEADERS = [
    'strict-transport-security',
    'content-security-policy',
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'referrer-policy',
    'permissions-policy',
  ];

  private constructor() {
    super();
    console.log(`
🔍 ═══════════════════════════════════════════════════════════════════════════════
   PUBLIC SCANNER v33.1 - LEGAL INTELLIGENCE GATHERER
   ─────────────────────────────────────────────────────────────────────────────
   Legal Basis: Public data only (SSL, Headers, DNS, robots.txt, security.txt)
   Compliance:  CFAA ✅ | GDPR ✅ | CCPA ✅
═══════════════════════════════════════════════════════════════════════════════
    `);
  }

  static getInstance(): PublicScanner {
    if (!PublicScanner.instance) {
      PublicScanner.instance = new PublicScanner();
    }
    return PublicScanner.instance;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN SCAN METHOD
  // ═══════════════════════════════════════════════════════════════════════════

  async scan(targetUrl: string, config: ScanConfig = {}): Promise<PublicScanResult> {
    // Default: scan everything
    const cfg: Required<ScanConfig> = {
      ssl: config.ssl ?? true,
      headers: config.headers ?? true,
      securityTxt: config.securityTxt ?? true,
      robotsTxt: config.robotsTxt ?? true,
      performance: config.performance ?? true,
      dns: config.dns ?? true,
      accessibility: config.accessibility ?? false,
    };

    // Normalize URL
    const url = this.normalizeUrl(targetUrl);
    const domain = new URL(url).hostname;

    console.log(`\n🔍 [SCAN] Analyzing public surface of ${domain}...`);
    console.log(`   └─ Legal basis: PUBLIC_DATA (no authentication required)\n`);

    const result: PublicScanResult = {
      url,
      domain,
      scannedAt: new Date(),
      legalBasis: 'Public data analysis per RFC standards and industry practice',
      overallScore: 0,
      criticalIssues: [],
      warnings: [],
      recommendations: [],
    };

    // Parallel scans
    const scans: Promise<void>[] = [];

    if (cfg.ssl) scans.push(this.scanSSL(domain).then(r => { result.ssl = r; }));
    if (cfg.headers) scans.push(this.scanHeaders(url).then(r => { result.headers = r; }));
    if (cfg.securityTxt) scans.push(this.scanSecurityTxt(url).then(r => { result.securityTxt = r; }));
    if (cfg.robotsTxt) scans.push(this.scanRobotsTxt(url).then(r => { result.robotsTxt = r; }));
    if (cfg.performance) scans.push(this.scanPerformance(url).then(r => { result.performance = r; }));
    if (cfg.dns) scans.push(this.scanDNS(domain).then(r => { result.dns = r; }));

    await Promise.all(scans);

    // Calculate overall score and issues
    this.analyzeResults(result);

    console.log(`\n📊 Scan Complete: ${domain}`);
    console.log(`   └─ Score: ${result.overallScore}/100`);
    console.log(`   └─ Critical: ${result.criticalIssues.length}`);
    console.log(`   └─ Warnings: ${result.warnings.length}`);

    this.emit('scan:complete', result);
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INDIVIDUAL SCANNERS
  // ═══════════════════════════════════════════════════════════════════════════

  private async scanSSL(domain: string): Promise<SSLResult> {
    return new Promise((resolve) => {
      try {
        const req = https.request({
          hostname: domain,
          port: 443,
          method: 'HEAD',
          timeout: 10000,
        }, (res) => {
          const socket = res.socket as any;
          const cert = socket.getPeerCertificate?.();
          const protocol = socket.getProtocol?.() || 'unknown';

          if (cert && cert.valid_to) {
            const expiresAt = new Date(cert.valid_to);
            const now = new Date();
            const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            const issues: string[] = [];
            if (daysUntilExpiry < 30) issues.push('Certificate expires soon');
            if (daysUntilExpiry < 0) issues.push('Certificate expired');

            let grade = 'A';
            if (daysUntilExpiry < 7) grade = 'F';
            else if (daysUntilExpiry < 30) grade = 'C';
            else if (daysUntilExpiry < 60) grade = 'B';

            resolve({
              valid: daysUntilExpiry > 0,
              issuer: cert.issuer?.O || 'Unknown',
              expiresIn: daysUntilExpiry,
              grade,
              protocols: [protocol],
              issues,
            });
          } else {
            resolve({
              valid: false,
              issuer: 'Unknown',
              expiresIn: 0,
              grade: 'F',
              protocols: [],
              issues: ['Could not retrieve certificate'],
            });
          }
        });

        req.on('error', () => {
          resolve({
            valid: false,
            issuer: 'Unknown',
            expiresIn: 0,
            grade: 'F',
            protocols: [],
            issues: ['SSL connection failed'],
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({
            valid: false,
            issuer: 'Unknown',
            expiresIn: 0,
            grade: 'F',
            protocols: [],
            issues: ['Connection timeout'],
          });
        });

        req.end();
      } catch {
        resolve({
          valid: false,
          issuer: 'Unknown',
          expiresIn: 0,
          grade: 'F',
          protocols: [],
          issues: ['SSL scan failed'],
        });
      }
    });
  }

  private async scanHeaders(url: string): Promise<HeadersResult> {
    return new Promise((resolve) => {
      try {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.request(url, { method: 'HEAD', timeout: 10000 }, (res) => {
          const present: string[] = [];
          const missing: string[] = [];
          const details: Record<string, string> = {};

          for (const header of PublicScanner.SECURITY_HEADERS) {
            const value = res.headers[header];
            if (value) {
              present.push(header);
              details[header] = Array.isArray(value) ? value[0] : value;
            } else {
              missing.push(header);
            }
          }

          const score = Math.round((present.length / PublicScanner.SECURITY_HEADERS.length) * 100);

          resolve({ present, missing, score, details });
        });

        req.on('error', () => {
          resolve({
            present: [],
            missing: PublicScanner.SECURITY_HEADERS,
            score: 0,
            details: {},
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({
            present: [],
            missing: PublicScanner.SECURITY_HEADERS,
            score: 0,
            details: {},
          });
        });

        req.end();
      } catch {
        resolve({
          present: [],
          missing: PublicScanner.SECURITY_HEADERS,
          score: 0,
          details: {},
        });
      }
    });
  }

  private async scanSecurityTxt(baseUrl: string): Promise<SecurityTxtResult> {
    const urls = [
      `${new URL(baseUrl).origin}/.well-known/security.txt`,
      `${new URL(baseUrl).origin}/security.txt`,
    ];

    for (const url of urls) {
      const content = await this.fetchText(url);
      if (content) {
        return this.parseSecurityTxt(content);
      }
    }

    return { exists: false };
  }

  private parseSecurityTxt(content: string): SecurityTxtResult {
    const result: SecurityTxtResult = { exists: true };
    const lines = content.split('\n');

    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      switch (key.trim().toLowerCase()) {
        case 'contact': result.contact = value; break;
        case 'encryption': result.encryption = value; break;
        case 'policy': result.policy = value; break;
        case 'acknowledgments': result.acknowledgments = value; break;
        case 'preferred-languages': result.preferredLanguages = value; break;
        case 'canonical': result.canonical = value; break;
        case 'expires': result.expires = value; break;
      }
    }

    return result;
  }

  private async scanRobotsTxt(baseUrl: string): Promise<RobotsTxtResult> {
    const url = `${new URL(baseUrl).origin}/robots.txt`;
    const content = await this.fetchText(url);

    if (!content) {
      return {
        exists: false,
        allowsAll: true,
        disallowedPaths: [],
        sitemapUrls: [],
      };
    }

    const disallowedPaths: string[] = [];
    const sitemapUrls: string[] = [];
    let crawlDelay: number | undefined;

    const lines = content.split('\n');
    for (const line of lines) {
      const lower = line.toLowerCase().trim();
      
      if (lower.startsWith('disallow:')) {
        const path = line.substring(9).trim();
        if (path) disallowedPaths.push(path);
      } else if (lower.startsWith('sitemap:')) {
        sitemapUrls.push(line.substring(8).trim());
      } else if (lower.startsWith('crawl-delay:')) {
        crawlDelay = parseInt(line.substring(12).trim(), 10);
      }
    }

    return {
      exists: true,
      allowsAll: disallowedPaths.length === 0,
      disallowedPaths,
      sitemapUrls,
      crawlDelay,
    };
  }

  private async scanPerformance(url: string): Promise<PerformanceResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let ttfb = 0;

      try {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.request(url, { method: 'GET', timeout: 15000 }, (res) => {
          ttfb = Date.now() - startTime;
          
          let size = 0;
          res.on('data', (chunk) => { size += chunk.length; });
          
          res.on('end', () => {
            const totalTime = Date.now() - startTime;
            const compressed = !!res.headers['content-encoding'];
            const http2 = (res as any).httpVersion === '2.0';

            // Score based on Web Vitals
            let score = 100;
            if (ttfb > 800) score -= 30;
            else if (ttfb > 200) score -= 10;
            if (totalTime > 3000) score -= 30;
            else if (totalTime > 1000) score -= 15;
            if (!compressed) score -= 10;

            resolve({
              ttfb,
              totalTime,
              contentSize: size,
              compressed,
              http2,
              score: Math.max(0, score),
            });
          });
        });

        req.on('error', () => {
          resolve({ ttfb: 0, totalTime: 0, contentSize: 0, compressed: false, http2: false, score: 0 });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ ttfb: 15000, totalTime: 15000, contentSize: 0, compressed: false, http2: false, score: 0 });
        });

        req.end();
      } catch {
        resolve({ ttfb: 0, totalTime: 0, contentSize: 0, compressed: false, http2: false, score: 0 });
      }
    });
  }

  private async scanDNS(domain: string): Promise<DNSResult> {
    const result: DNSResult = {
      aRecords: [],
      mxRecords: [],
      txtRecords: [],
      hasSPF: false,
      hasDMARC: false,
      hasDKIM: false,
    };

    try {
      result.aRecords = await dnsResolve4(domain);
    } catch { /* no A records */ }

    try {
      const mx = await dnsResolveMx(domain);
      result.mxRecords = mx.map(r => ({ exchange: r.exchange, priority: r.priority }));
    } catch { /* no MX records */ }

    try {
      const txt = await dnsResolveTxt(domain);
      result.txtRecords = txt.flat();
      
      result.hasSPF = result.txtRecords.some(r => r.startsWith('v=spf1'));
      result.hasDMARC = result.txtRecords.some(r => r.startsWith('v=DMARC1'));
    } catch { /* no TXT records */ }

    // Check DMARC subdomain
    try {
      const dmarc = await dnsResolveTxt(`_dmarc.${domain}`);
      if (dmarc.flat().some(r => r.startsWith('v=DMARC1'))) {
        result.hasDMARC = true;
      }
    } catch { /* no DMARC */ }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  private analyzeResults(result: PublicScanResult): void {
    let totalScore = 0;
    let factors = 0;

    // SSL Score (30%)
    if (result.ssl) {
      const sslScore = result.ssl.grade === 'A' ? 100 : 
                       result.ssl.grade === 'B' ? 80 :
                       result.ssl.grade === 'C' ? 60 : 0;
      totalScore += sslScore * 0.3;
      factors += 0.3;

      if (!result.ssl.valid) {
        result.criticalIssues.push({
          id: 'SSL_INVALID',
          severity: 'CRITICAL',
          title: 'SSL Certificate Invalid',
          description: 'The SSL certificate is invalid or expired.',
          fix: 'Renew or replace the SSL certificate immediately.',
        });
      } else if (result.ssl.expiresIn < 30) {
        result.warnings.push({
          id: 'SSL_EXPIRING',
          severity: 'HIGH',
          title: `SSL Expires in ${result.ssl.expiresIn} Days`,
          description: 'Certificate will expire soon.',
          fix: 'Renew the certificate before expiration.',
        });
      }
    }

    // Headers Score (30%)
    if (result.headers) {
      totalScore += result.headers.score * 0.3;
      factors += 0.3;

      for (const missing of result.headers.missing) {
        const isImportant = ['strict-transport-security', 'content-security-policy'].includes(missing);
        result.warnings.push({
          id: `HEADER_MISSING_${missing.toUpperCase()}`,
          severity: isImportant ? 'HIGH' : 'MEDIUM',
          title: `Missing Header: ${missing}`,
          description: `The ${missing} security header is not configured.`,
          fix: `Add the ${missing} header to your server configuration.`,
        });
      }
    }

    // Performance Score (20%)
    if (result.performance) {
      totalScore += result.performance.score * 0.2;
      factors += 0.2;

      if (result.performance.ttfb > 800) {
        result.warnings.push({
          id: 'PERF_SLOW_TTFB',
          severity: result.performance.ttfb > 2000 ? 'HIGH' : 'MEDIUM',
          title: `Slow Server Response: ${result.performance.ttfb}ms`,
          description: 'Time to First Byte is above recommended threshold.',
          fix: 'Optimize server configuration, enable caching, or upgrade hosting.',
        });
      }
    }

    // DNS Score (20%)
    if (result.dns) {
      let dnsScore = 100;
      if (!result.dns.hasSPF) { dnsScore -= 30; result.recommendations.push('Add SPF record for email security'); }
      if (!result.dns.hasDMARC) { dnsScore -= 30; result.recommendations.push('Add DMARC record for email authentication'); }
      
      totalScore += dnsScore * 0.2;
      factors += 0.2;

      if (!result.dns.hasSPF || !result.dns.hasDMARC) {
        result.warnings.push({
          id: 'EMAIL_SECURITY',
          severity: 'MEDIUM',
          title: 'Email Security Not Configured',
          description: 'SPF and/or DMARC records are missing.',
          fix: 'Configure SPF and DMARC DNS records to prevent email spoofing.',
        });
      }
    }

    // Calculate final score
    result.overallScore = factors > 0 ? Math.round(totalScore / factors) : 0;

    // Add recommendations
    if (!result.securityTxt?.exists) {
      result.recommendations.push('Add security.txt file per RFC 9116');
    }
    if (result.robotsTxt && !result.robotsTxt.sitemapUrls.length) {
      result.recommendations.push('Add sitemap URL to robots.txt');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  private normalizeUrl(url: string): string {
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    return url;
  }

  private async fetchText(url: string): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.request(url, { method: 'GET', timeout: 5000 }, (res) => {
          if (res.statusCode !== 200) {
            resolve(null);
            return;
          }

          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => resolve(data));
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.end();
      } catch {
        resolve(null);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVENIENCE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Quick scan with defaults
   */
  async analyze(target: string): Promise<PublicScanResult> {
    return this.scan(target);
  }

  /**
   * Get top critical issues
   */
  static getCritical(result: PublicScanResult, count: number = 3): Issue[] {
    return [...result.criticalIssues, ...result.warnings]
      .sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
        return order[a.severity] - order[b.severity];
      })
      .slice(0, count);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default PublicScanner;
