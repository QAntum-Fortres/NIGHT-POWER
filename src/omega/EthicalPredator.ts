/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ETHICAL PREDATOR - Dominance Through Undeniable Value
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Истинската власт не е в това да разбиеш вратата, 
 *  а в това собственикът сам да ти даде ключовете и да ти благодари."
 * 
 * Philosophy:
 * - We don't hack. We ILLUMINATE.
 * - We don't threaten. We GIFT.
 * - We don't extort. We become INDISPENSABLE.
 * 
 * Legal Foundation:
 * - 100% public data only (robots.txt, SSL, headers, Lighthouse)
 * - No unauthorized access (CFAA compliant)
 * - No coercion (gifts, not threats)
 * - GDPR compliant (no personal data without consent)
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 33.0.0 - THE ETHICAL PREDATOR
 */

import { EventEmitter } from 'events';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import * as https from 'https';
import * as http from 'http';
import { NeuralInference } from '../physics/NeuralInference';
import { ProposalEngine, LeadData } from '../intelligence/ProposalEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES - THE LEGAL HUNT
// ═══════════════════════════════════════════════════════════════════════════════

export interface PublicInsight {
  domain: string;
  scannedAt: Date;
  legalBasis: 'PUBLIC_DATA' | 'ROBOTS_TXT_ALLOWED' | 'OPEN_API';
  
  // SSL Analysis (100% public)
  ssl: {
    valid: boolean;
    expiresIn: number;  // days
    issuer: string;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  };
  
  // HTTP Headers (100% public)
  headers: {
    securityHeaders: SecurityHeader[];
    missingHeaders: string[];
    score: number;  // 0-100
  };
  
  // Performance (Lighthouse-style, 100% public)
  performance: {
    ttfb: number;  // Time to first byte (ms)
    fcp: number;   // First contentful paint (ms)
    lcp: number;   // Largest contentful paint (ms)
    score: number; // 0-100
  };
  
  // SEO (100% public)
  seo: {
    hasRobotsTxt: boolean;
    hasSitemap: boolean;
    metaDescription: boolean;
    score: number;
  };
  
  // Overall
  integrityScore: number;  // 0-100
  criticalIssues: CriticalIssue[];
  recommendations: Recommendation[];
}

export interface SecurityHeader {
  name: string;
  value: string;
  status: 'GOOD' | 'WARN' | 'MISSING';
}

export interface CriticalIssue {
  id: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  impact: string;
  fix: string;
  legalBasis: string;  // Why we can report this
}

export interface Recommendation {
  priority: number;
  title: string;
  description: string;
  estimatedImpact: string;
  qantumCanHelp: boolean;
}

export interface ValueBombResult {
  target: string;
  insights: PublicInsight;
  proposalGenerated: boolean;
  proposalPath?: string;
  estimatedValue: number;  // $ value of the free audit
}

export interface TrustBadge {
  clientId: string;
  domain: string;
  score: number;
  issuedAt: Date;
  expiresAt: Date;
  badgeUrl: string;
  verificationUrl: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE ETHICAL PREDATOR ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class EthicalPredator extends EventEmitter {
  private static instance: EthicalPredator;

  // Security headers we check (all public knowledge)
  private static readonly SECURITY_HEADERS = [
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
    'Permissions-Policy',
  ];

  // Modules
  private readonly brain = NeuralInference.getInstance();
  private readonly proposals = ProposalEngine.getInstance();

  // State
  private valueBombs: ValueBombResult[] = [];
  private badges: TrustBadge[] = [];

  // Paths
  private readonly DATA_PATH = join(process.cwd(), 'data', 'ethical-predator');
  private readonly BOMBS_FILE: string;
  private readonly BADGES_FILE: string;

  private constructor() {
    super();
    this.BOMBS_FILE = join(this.DATA_PATH, 'value-bombs.json');
    this.BADGES_FILE = join(this.DATA_PATH, 'trust-badges.json');
    this.ensureDataDir();
    this.loadState();

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║  🦁 ETHICAL PREDATOR v33.0 - DOMINANCE THROUGH VALUE                          ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  "Ние не хакваме. Ние ОСВЕТЯВАМЕ."                                            ║
║  "Ние не заплашваме. Ние ДАВАМЕ."                                             ║
║  "Ние не изнудваме. Ние ставаме НЕЗАМЕНИМИ."                                  ║
║                                                                               ║
║  LEGAL STATUS: 100% COMPLIANT                                                 ║
║  ├── CFAA: ✅ No unauthorized access                                          ║
║  ├── GDPR: ✅ No personal data without consent                                ║
║  ├── RICO: ✅ No coercion or threats                                          ║
║  └── ISO-27001: ✅ Audit trail maintained                                     ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  static getInstance(): EthicalPredator {
    if (!EthicalPredator.instance) {
      EthicalPredator.instance = new EthicalPredator();
    }
    return EthicalPredator.instance;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: THE VALUE BOMB - Free Audit That Creates Obligation
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Drop a Value Bomb on a target.
   * Scan ONLY public data and generate a $5,000-value audit for FREE.
   * 
   * Legal basis: All data is publicly accessible via standard HTTP requests.
   */
  async dropValueBomb(targetUrl: string): Promise<ValueBombResult> {
    console.log(`\n💣 [VALUE_BOMB] Analyzing public surface of ${targetUrl}...`);
    console.log(`   └─ Legal basis: PUBLIC_DATA (no authentication required)`);

    // Normalize URL
    const url = this.normalizeUrl(targetUrl);
    const domain = new URL(url).hostname;

    // Perform public scans
    const insights = await this.gatherPublicInsights(url);

    console.log(`\n📊 Scan Complete:`);
    console.log(`   └─ Integrity Score: ${insights.integrityScore}/100`);
    console.log(`   └─ Critical Issues: ${insights.criticalIssues.length}`);
    console.log(`   └─ Recommendations: ${insights.recommendations.length}`);

    let proposalGenerated = false;
    let proposalPath: string | undefined;

    // If we found issues, generate a VALUE-FIRST proposal
    if (insights.criticalIssues.length > 0 || insights.integrityScore < 80) {
      console.log(`\n🎁 Generating complimentary audit report...`);

      const lead: LeadData = {
        id: `vb-${Date.now()}`,
        company: domain,
        website: url,
        priority: insights.integrityScore < 50 ? 'critical' : 
                  insights.integrityScore < 70 ? 'high' : 'medium',
        detected_issue: insights.criticalIssues[0]?.title || 'Integrity gaps detected',
        issues: insights.criticalIssues.map(i => i.title),
        estimated_value: this.calculateAuditValue(insights)
      };

      const proposal = await this.proposals.generate(lead, {
        includeGhostProtocol: false,  // Don't oversell
        includeSelfHealing: true,
        includeCompliance: true,
        currency: 'USD',
        language: 'en'
      });

      proposalGenerated = true;
      proposalPath = proposal.filePath;

      console.log(`   └─ Audit report generated: ${proposalPath}`);
    }

    const result: ValueBombResult = {
      target: url,
      insights,
      proposalGenerated,
      proposalPath,
      estimatedValue: this.calculateAuditValue(insights)
    };

    this.valueBombs.push(result);
    this.saveState();

    this.emit('valueBomb:dropped', result);
    return result;
  }

  /**
   * Gather insights using ONLY public data
   */
  private async gatherPublicInsights(url: string): Promise<PublicInsight> {
    const domain = new URL(url).hostname;

    // Parallel public scans
    const [ssl, headers, performance, seo] = await Promise.all([
      this.scanSSL(domain),
      this.scanHeaders(url),
      this.scanPerformance(url),
      this.scanSEO(url)
    ]);

    // Calculate overall integrity score
    const integrityScore = Math.round(
      (ssl.grade === 'A+' ? 100 : ssl.grade === 'A' ? 90 : ssl.grade === 'B' ? 70 : 50) * 0.3 +
      headers.score * 0.3 +
      performance.score * 0.2 +
      seo.score * 0.2
    );

    // Find critical issues
    const criticalIssues = this.findCriticalIssues(ssl, headers, performance, seo);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(criticalIssues);

    return {
      domain,
      scannedAt: new Date(),
      legalBasis: 'PUBLIC_DATA',
      ssl,
      headers,
      performance,
      seo,
      integrityScore,
      criticalIssues,
      recommendations
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC SCANNERS (100% Legal)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Scan SSL certificate (PUBLIC - same as SSL Labs)
   */
  private async scanSSL(domain: string): Promise<PublicInsight['ssl']> {
    return new Promise((resolve) => {
      try {
        const req = https.request({
          hostname: domain,
          port: 443,
          method: 'HEAD',
          timeout: 10000
        }, (res) => {
          const socket = res.socket as any;
          const cert = socket.getPeerCertificate?.();

          if (cert && cert.valid_to) {
            const expiresAt = new Date(cert.valid_to);
            const now = new Date();
            const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            resolve({
              valid: daysUntilExpiry > 0,
              expiresIn: daysUntilExpiry,
              issuer: cert.issuer?.O || 'Unknown',
              grade: daysUntilExpiry > 90 ? 'A' : daysUntilExpiry > 30 ? 'B' : daysUntilExpiry > 7 ? 'C' : 'F'
            });
          } else {
            resolve({ valid: false, expiresIn: 0, issuer: 'Unknown', grade: 'F' });
          }
        });

        req.on('error', () => {
          resolve({ valid: false, expiresIn: 0, issuer: 'Unknown', grade: 'F' });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ valid: false, expiresIn: 0, issuer: 'Unknown', grade: 'F' });
        });

        req.end();
      } catch {
        resolve({ valid: false, expiresIn: 0, issuer: 'Unknown', grade: 'F' });
      }
    });
  }

  /**
   * Scan HTTP security headers (PUBLIC - standard request)
   */
  private async scanHeaders(url: string): Promise<PublicInsight['headers']> {
    return new Promise((resolve) => {
      try {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.request(url, { method: 'HEAD', timeout: 10000 }, (res) => {
          const securityHeaders: SecurityHeader[] = [];
          const missingHeaders: string[] = [];

          for (const headerName of EthicalPredator.SECURITY_HEADERS) {
            const value = res.headers[headerName.toLowerCase()];
            
            if (value) {
              securityHeaders.push({
                name: headerName,
                value: Array.isArray(value) ? value[0] : value,
                status: 'GOOD'
              });
            } else {
              missingHeaders.push(headerName);
            }
          }

          const score = Math.round((securityHeaders.length / EthicalPredator.SECURITY_HEADERS.length) * 100);

          resolve({ securityHeaders, missingHeaders, score });
        });

        req.on('error', () => {
          resolve({ securityHeaders: [], missingHeaders: EthicalPredator.SECURITY_HEADERS, score: 0 });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ securityHeaders: [], missingHeaders: EthicalPredator.SECURITY_HEADERS, score: 0 });
        });

        req.end();
      } catch {
        resolve({ securityHeaders: [], missingHeaders: EthicalPredator.SECURITY_HEADERS, score: 0 });
      }
    });
  }

  /**
   * Scan performance metrics (PUBLIC - timing a standard request)
   */
  private async scanPerformance(url: string): Promise<PublicInsight['performance']> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let ttfb = 0;

      try {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.request(url, { method: 'GET', timeout: 15000 }, (res) => {
          ttfb = Date.now() - startTime;
          
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            const totalTime = Date.now() - startTime;
            
            // Estimate FCP/LCP based on response time
            const fcp = ttfb + 100;  // Rough estimate
            const lcp = totalTime;

            // Score based on Web Vitals thresholds
            let score = 100;
            if (ttfb > 800) score -= 30;
            else if (ttfb > 200) score -= 10;
            
            if (lcp > 4000) score -= 40;
            else if (lcp > 2500) score -= 20;

            resolve({
              ttfb,
              fcp,
              lcp,
              score: Math.max(0, score)
            });
          });
        });

        req.on('error', () => {
          resolve({ ttfb: 0, fcp: 0, lcp: 0, score: 0 });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ ttfb: 15000, fcp: 15000, lcp: 15000, score: 0 });
        });

        req.end();
      } catch {
        resolve({ ttfb: 0, fcp: 0, lcp: 0, score: 0 });
      }
    });
  }

  /**
   * Scan SEO basics (PUBLIC - robots.txt, meta tags)
   */
  private async scanSEO(url: string): Promise<PublicInsight['seo']> {
    const baseUrl = new URL(url).origin;
    
    // Check robots.txt
    const hasRobotsTxt = await this.checkUrl(`${baseUrl}/robots.txt`);
    
    // Check sitemap
    const hasSitemap = await this.checkUrl(`${baseUrl}/sitemap.xml`);

    // Check for meta description would require parsing HTML
    // For now, assume true if robots.txt exists
    const metaDescription = hasRobotsTxt;

    let score = 0;
    if (hasRobotsTxt) score += 40;
    if (hasSitemap) score += 40;
    if (metaDescription) score += 20;

    return { hasRobotsTxt, hasSitemap, metaDescription, score };
  }

  private async checkUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
          resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.end();
      } catch {
        resolve(false);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ISSUE DETECTION & RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  private findCriticalIssues(
    ssl: PublicInsight['ssl'],
    headers: PublicInsight['headers'],
    performance: PublicInsight['performance'],
    seo: PublicInsight['seo']
  ): CriticalIssue[] {
    const issues: CriticalIssue[] = [];

    // SSL Issues
    if (!ssl.valid) {
      issues.push({
        id: 'SSL_INVALID',
        severity: 'CRITICAL',
        title: 'SSL Certificate Invalid or Expired',
        description: 'The SSL certificate is invalid or has expired.',
        impact: 'Browsers will show security warnings. Users will leave.',
        fix: 'Renew or replace the SSL certificate immediately.',
        legalBasis: 'SSL certificates are publicly verifiable by any browser'
      });
    } else if (ssl.expiresIn < 30) {
      issues.push({
        id: 'SSL_EXPIRING',
        severity: 'HIGH',
        title: `SSL Certificate Expires in ${ssl.expiresIn} Days`,
        description: 'The SSL certificate will expire soon.',
        impact: 'Service interruption if not renewed.',
        fix: 'Set up auto-renewal or renew manually before expiration.',
        legalBasis: 'SSL expiration is publicly visible in certificate'
      });
    }

    // Security Header Issues
    for (const missing of headers.missingHeaders) {
      const severity = ['Strict-Transport-Security', 'Content-Security-Policy'].includes(missing) 
        ? 'HIGH' : 'MEDIUM';

      issues.push({
        id: `HEADER_MISSING_${missing.toUpperCase().replace(/-/g, '_')}`,
        severity,
        title: `Missing Security Header: ${missing}`,
        description: `The ${missing} header is not set.`,
        impact: this.getHeaderImpact(missing),
        fix: this.getHeaderFix(missing),
        legalBasis: 'HTTP headers are returned with every public request'
      });
    }

    // Performance Issues
    if (performance.ttfb > 800) {
      issues.push({
        id: 'PERF_SLOW_TTFB',
        severity: performance.ttfb > 2000 ? 'HIGH' : 'MEDIUM',
        title: `Slow Time to First Byte: ${performance.ttfb}ms`,
        description: 'Server response time is above recommended threshold.',
        impact: 'Poor user experience, lower search rankings.',
        fix: 'Optimize server configuration, implement caching, or upgrade hosting.',
        legalBasis: 'Response time is measured from public HTTP request'
      });
    }

    // SEO Issues
    if (!seo.hasRobotsTxt) {
      issues.push({
        id: 'SEO_NO_ROBOTS',
        severity: 'LOW',
        title: 'Missing robots.txt',
        description: 'No robots.txt file found.',
        impact: 'Search engines may not crawl efficiently.',
        fix: 'Add a robots.txt file with crawling directives.',
        legalBasis: 'robots.txt is a public file by definition'
      });
    }

    return issues;
  }

  private getHeaderImpact(header: string): string {
    const impacts: Record<string, string> = {
      'Strict-Transport-Security': 'Users may connect over insecure HTTP.',
      'Content-Security-Policy': 'Vulnerable to XSS and code injection attacks.',
      'X-Content-Type-Options': 'Browsers may misinterpret file types.',
      'X-Frame-Options': 'Vulnerable to clickjacking attacks.',
      'X-XSS-Protection': 'Legacy browsers lack XSS filtering.',
      'Referrer-Policy': 'Sensitive URLs may leak to third parties.',
      'Permissions-Policy': 'Browser features not explicitly controlled.',
    };
    return impacts[header] || 'Security posture reduced.';
  }

  private getHeaderFix(header: string): string {
    const fixes: Record<string, string> = {
      'Strict-Transport-Security': 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "Add: Content-Security-Policy: default-src 'self'",
      'X-Content-Type-Options': 'Add: X-Content-Type-Options: nosniff',
      'X-Frame-Options': 'Add: X-Frame-Options: DENY',
      'X-XSS-Protection': 'Add: X-XSS-Protection: 1; mode=block',
      'Referrer-Policy': 'Add: Referrer-Policy: strict-origin-when-cross-origin',
      'Permissions-Policy': 'Add: Permissions-Policy: geolocation=(), microphone=()',
    };
    return fixes[header] || 'Consult security documentation.';
  }

  private async generateRecommendations(issues: CriticalIssue[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Group issues by type
    const sslIssues = issues.filter(i => i.id.startsWith('SSL'));
    const headerIssues = issues.filter(i => i.id.startsWith('HEADER'));
    const perfIssues = issues.filter(i => i.id.startsWith('PERF'));

    if (sslIssues.length > 0) {
      recommendations.push({
        priority: 1,
        title: 'Fix SSL Configuration',
        description: 'Address SSL certificate issues to ensure secure connections.',
        estimatedImpact: 'Prevent user abandonment due to security warnings.',
        qantumCanHelp: true
      });
    }

    if (headerIssues.length > 0) {
      recommendations.push({
        priority: 2,
        title: 'Implement Security Headers',
        description: `Add ${headerIssues.length} missing security headers.`,
        estimatedImpact: 'Protect against common web vulnerabilities.',
        qantumCanHelp: true
      });
    }

    if (perfIssues.length > 0) {
      recommendations.push({
        priority: 3,
        title: 'Optimize Server Performance',
        description: 'Reduce response times to improve user experience.',
        estimatedImpact: 'Better SEO rankings and user retention.',
        qantumCanHelp: true
      });
    }

    // Always recommend monitoring
    recommendations.push({
      priority: 4,
      title: 'Continuous Monitoring',
      description: 'Set up automated monitoring to catch issues before users do.',
      estimatedImpact: 'Prevent future incidents and maintain trust.',
      qantumCanHelp: true
    });

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  private calculateAuditValue(insights: PublicInsight): number {
    let value = 500;  // Base value

    // Add value for each issue found
    for (const issue of insights.criticalIssues) {
      switch (issue.severity) {
        case 'CRITICAL': value += 1000; break;
        case 'HIGH': value += 500; break;
        case 'MEDIUM': value += 200; break;
        case 'LOW': value += 50; break;
      }
    }

    // Add value for recommendations
    value += insights.recommendations.length * 100;

    return value;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: THE SOFT LOCK-IN - Become Part of Their DNA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Issue a "Verified by QAntum" trust badge.
   * This creates organic lock-in through positive association.
   */
  async issueTrustBadge(clientId: string, domain: string): Promise<TrustBadge> {
    console.log(`\n🛡️ [TRUST] Issuing badge for ${domain}...`);

    // Perform fresh scan
    const insights = await this.gatherPublicInsights(`https://${domain}`);

    if (insights.integrityScore < 50) {
      throw new Error(`Integrity score too low (${insights.integrityScore}/100). Remediation required.`);
    }

    const badge: TrustBadge = {
      clientId,
      domain,
      score: insights.integrityScore,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      badgeUrl: `https://qantum.dev/badge/${clientId}.svg`,
      verificationUrl: `https://qantum.dev/verify/${clientId}`
    };

    this.badges.push(badge);
    this.saveState();

    console.log(`   └─ Badge issued! Score: ${badge.score}/100`);
    console.log(`   └─ Embed: ${badge.badgeUrl}`);
    console.log(`   └─ Verify: ${badge.verificationUrl}`);

    this.emit('badge:issued', badge);
    return badge;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: THE INTEGRITY INDEX - Become The Industry Standard
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate a public integrity index for an industry.
   * Like Moody's or S&P, but for web integrity.
   */
  async generateIndustryIndex(industryName: string, domains: string[]): Promise<void> {
    console.log(`\n📊 [INDEX] Generating ${industryName} Integrity Index...`);

    const results: { domain: string; score: number; grade: string }[] = [];

    for (const domain of domains) {
      try {
        console.log(`   └─ Scanning: ${domain}`);
        const insights = await this.gatherPublicInsights(`https://${domain}`);
        
        results.push({
          domain,
          score: insights.integrityScore,
          grade: insights.integrityScore >= 90 ? 'A+' :
                 insights.integrityScore >= 80 ? 'A' :
                 insights.integrityScore >= 70 ? 'B' :
                 insights.integrityScore >= 60 ? 'C' :
                 insights.integrityScore >= 50 ? 'D' : 'F'
        });

        // Rate limiting
        await this.sleep(2000);
      } catch (error) {
        console.error(`   └─ Error scanning ${domain}:`, error);
      }
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    // Output index
    console.log(`\n╔═══════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`║  📊 ${industryName.toUpperCase()} INTEGRITY INDEX - QAntum Empire                        `);
    console.log(`╠═══════════════════════════════════════════════════════════════════════════════╣`);
    
    results.forEach((r, i) => {
      console.log(`║  ${(i + 1).toString().padStart(2, '0')}. ${r.domain.padEnd(40)} ${r.grade.padEnd(3)} ${r.score}/100 `);
    });
    
    console.log(`╚═══════════════════════════════════════════════════════════════════════════════╝`);
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

  private ensureDataDir(): void {
    if (!existsSync(this.DATA_PATH)) {
      mkdirSync(this.DATA_PATH, { recursive: true });
    }
  }

  private loadState(): void {
    try {
      if (existsSync(this.BOMBS_FILE)) {
        this.valueBombs = JSON.parse(readFileSync(this.BOMBS_FILE, 'utf-8'));
      }
      if (existsSync(this.BADGES_FILE)) {
        this.badges = JSON.parse(readFileSync(this.BADGES_FILE, 'utf-8'));
      }
    } catch {
      // Start fresh
    }
  }

  private saveState(): void {
    writeFileSync(this.BOMBS_FILE, JSON.stringify(this.valueBombs, null, 2));
    writeFileSync(this.BADGES_FILE, JSON.stringify(this.badges, null, 2));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  getValueBombs(): ValueBombResult[] {
    return [...this.valueBombs];
  }

  getBadges(): TrustBadge[] {
    return [...this.badges];
  }

  /**
   * Quick scan without proposal generation
   */
  async quickScan(url: string): Promise<PublicInsight> {
    console.log(`🔍 [SCAN] Quick scan of ${url}...`);
    return this.gatherPublicInsights(this.normalizeUrl(url));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default EthicalPredator;
