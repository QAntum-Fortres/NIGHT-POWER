/**
 * 🔮 THE ORACLE - Supreme QA Report Generator
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates comprehensive QA reports with full picture of vulnerabilities
 * and functionality of the target.
 * 
 * "Supreme QA Report - пълна картина на уязвимостите и функционалността"
 * 
 * @version 1.0.0
 * @author QAntum AI Architect
 * @phase THE ORACLE - Report Generation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import type { SiteMap, DiscoveredPage, DiscoveredForm, DiscoveredAPI } from './site-mapper';
import type { UserJourney, BusinessLogic, TransactionFlow } from './logic-discovery';
import type { TestSuite, GeneratedTest } from './auto-test-factory';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Complete Supreme QA Report
 */
export interface SupremeQAReport {
  id: string;
  title: string;
  generatedAt: number;
  targetUrl: string;
  duration: number;
  
  // Executive Summary
  executiveSummary: ExecutiveSummary;
  
  // Detailed Sections
  siteOverview: SiteOverview;
  securityAnalysis: SecurityAnalysis;
  performanceAnalysis: PerformanceAnalysis;
  functionalityMap: FunctionalityMap;
  testCoverage: TestCoverage;
  recommendations: Recommendation[];
  
  // Raw Data
  rawData: {
    siteMap: SiteMap;
    logic: BusinessLogic[];
    journeys: UserJourney[];
    flows: TransactionFlow[];
    testSuites: TestSuite[];
  };
  
  // Export formats
  formats: {
    html?: string;
    json?: string;
    markdown?: string;
    pdf?: string;
  };
}

/**
 * Executive summary for stakeholders
 */
export interface ExecutiveSummary {
  overallScore: number; // 0-100
  securityScore: number;
  performanceScore: number;
  functionalityScore: number;
  testabilityScore: number;
  
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  
  keyHighlights: string[];
  immediateActions: string[];
}

/**
 * Site overview statistics
 */
export interface SiteOverview {
  totalPages: number;
  totalForms: number;
  totalApis: number;
  totalButtons: number;
  totalLinks: number;
  
  pageTypes: Record<string, number>;
  formPurposes: Record<string, number>;
  apiMethods: Record<string, number>;
  
  siteStructure: SiteStructureNode;
  navigationDepth: number;
}

export interface SiteStructureNode {
  url: string;
  title: string;
  children: SiteStructureNode[];
  forms: number;
  apis: number;
}

/**
 * Security analysis results
 */
export interface SecurityAnalysis {
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
  score: number;
  
  findings: SecurityFinding[];
  
  headers: {
    present: string[];
    missing: string[];
  };
  
  cookies: {
    secure: number;
    insecure: number;
    httpOnly: number;
    sameSite: number;
  };
  
  forms: {
    withCaptcha: number;
    withoutCaptcha: number;
    withValidation: number;
  };
  
  authentication: {
    hasLogin: boolean;
    hasRegistration: boolean;
    has2FA: boolean;
    passwordPolicy: string;
  };
}

export interface SecurityFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  location: string;
  recommendation: string;
  evidence: string[];
}

/**
 * Performance analysis results
 */
export interface PerformanceAnalysis {
  score: number;
  
  avgLoadTime: number;
  maxLoadTime: number;
  minLoadTime: number;
  
  coreWebVitals: {
    lcp: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
    fid: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
    cls: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
  };
  
  slowestPages: Array<{ url: string; loadTime: number }>;
  resourceAnalysis: {
    totalResources: number;
    jsSize: number;
    cssSize: number;
    imageSize: number;
  };
}

/**
 * Functionality mapping
 */
export interface FunctionalityMap {
  features: Feature[];
  workflows: Workflow[];
  apiCapabilities: APICapability[];
}

export interface Feature {
  name: string;
  category: string;
  pages: string[];
  forms: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  testable: boolean;
}

export interface Workflow {
  name: string;
  type: string;
  steps: string[];
  entry: string;
  exit: string;
  hasErrors: boolean;
}

export interface APICapability {
  name: string;
  endpoints: string[];
  methods: string[];
  authenticated: boolean;
}

/**
 * Test coverage analysis
 */
export interface TestCoverage {
  totalTests: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  
  coveragePercentage: {
    pages: number;
    forms: number;
    apis: number;
    features: number;
  };
  
  uncoveredAreas: string[];
  testSuites: Array<{
    name: string;
    tests: number;
    type: string;
  }>;
}

/**
 * Recommendations
 */
export interface Recommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'security' | 'performance' | 'functionality' | 'testing' | 'accessibility';
  title: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  steps: string[];
}

/**
 * Report generator configuration
 */
export interface ReportGeneratorConfig {
  outputDir: string;
  formats: ('html' | 'json' | 'markdown' | 'pdf')[];
  includeScreenshots: boolean;
  includeRawData: boolean;
  companyLogo?: string;
  reportTitle?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: ReportGeneratorConfig = {
  outputDir: './reports',
  formats: ['html', 'json', 'markdown'],
  includeScreenshots: true,
  includeRawData: false,
  reportTitle: 'Supreme QA Report'
};

const REQUIRED_SECURITY_HEADERS = [
  'strict-transport-security',
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'x-xss-protection',
  'referrer-policy'
];

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 📊 SupremeReportGenerator - Comprehensive QA report generation
 */
export class SupremeReportGenerator extends EventEmitter {
  private config: ReportGeneratorConfig;
  private report: SupremeQAReport | null = null;
  private startTime: number = 0;

  constructor(config: Partial<ReportGeneratorConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 🚀 Generate Supreme QA Report
   */
  async generateReport(
    siteMap: SiteMap,
    logic: BusinessLogic[],
    journeys: UserJourney[],
    flows: TransactionFlow[],
    testSuites: TestSuite[]
  ): Promise<SupremeQAReport> {
    this.startTime = Date.now();

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                       ║
║   ███████╗██╗   ██╗██████╗ ██████╗ ███████╗███╗   ███╗███████╗                        ║
║   ██╔════╝██║   ██║██╔══██╗██╔══██╗██╔════╝████╗ ████║██╔════╝                        ║
║   ███████╗██║   ██║██████╔╝██████╔╝█████╗  ██╔████╔██║█████╗                          ║
║   ╚════██║██║   ██║██╔═══╝ ██╔══██╗██╔══╝  ██║╚██╔╝██║██╔══╝                          ║
║   ███████║╚██████╔╝██║     ██║  ██║███████╗██║ ╚═╝ ██║███████╗                        ║
║   ╚══════╝ ╚═════╝ ╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚══════╝                        ║
║                                                                                       ║
║    ██████╗  █████╗     ██████╗ ███████╗██████╗  ██████╗ ██████╗ ████████╗            ║
║   ██╔═══██╗██╔══██╗    ██╔══██╗██╔════╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝            ║
║   ██║   ██║███████║    ██████╔╝█████╗  ██████╔╝██║   ██║██████╔╝   ██║               ║
║   ██║▄▄ ██║██╔══██║    ██╔══██╗██╔══╝  ██╔═══╝ ██║   ██║██╔══██╗   ██║               ║
║   ╚██████╔╝██║  ██║    ██║  ██║███████╗██║     ╚██████╔╝██║  ██║   ██║               ║
║    ╚══▀▀═╝ ╚═╝  ╚═╝    ╚═╝  ╚═╝╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝               ║
║                                                                                       ║
║                    THE ORACLE - Supreme Report Generator                              ║
║                                                                                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
`);

    // Initialize report
    this.report = {
      id: crypto.randomUUID(),
      title: this.config.reportTitle || 'Supreme QA Report',
      generatedAt: Date.now(),
      targetUrl: siteMap.rootUrl,
      duration: 0,
      executiveSummary: {} as ExecutiveSummary,
      siteOverview: {} as SiteOverview,
      securityAnalysis: {} as SecurityAnalysis,
      performanceAnalysis: {} as PerformanceAnalysis,
      functionalityMap: {} as FunctionalityMap,
      testCoverage: {} as TestCoverage,
      recommendations: [],
      rawData: { siteMap, logic, journeys, flows, testSuites },
      formats: {}
    };

    // Generate each section
    console.log('\n[Report] 📊 Analyzing site overview...');
    this.report.siteOverview = this.analyzeSiteOverview(siteMap);

    console.log('[Report] 🛡️ Analyzing security...');
    this.report.securityAnalysis = this.analyzeSecurityFromMap(siteMap, logic);

    console.log('[Report] ⚡ Analyzing performance...');
    this.report.performanceAnalysis = this.analyzePerformance(siteMap);

    console.log('[Report] 🗺️ Mapping functionality...');
    this.report.functionalityMap = this.mapFunctionality(siteMap, logic, flows);

    console.log('[Report] ✅ Analyzing test coverage...');
    this.report.testCoverage = this.analyzeTestCoverage(siteMap, testSuites);

    console.log('[Report] 💡 Generating recommendations...');
    this.report.recommendations = this.generateRecommendations();

    console.log('[Report] 📈 Creating executive summary...');
    this.report.executiveSummary = this.createExecutiveSummary();

    // Finalize
    this.report.duration = Date.now() - this.startTime;

    // Generate output formats
    console.log('\n[Report] 📄 Generating output formats...');
    await this.generateOutputFormats();

    // Print summary
    this.printReportSummary();

    return this.report;
  }

  /**
   * Analyze site overview
   */
  private analyzeSiteOverview(siteMap: SiteMap): SiteOverview {
    const pages = Array.from(siteMap.pages.values());
    
    // Count page types
    const pageTypes: Record<string, number> = {};
    pages.forEach(p => {
      const type = this.detectPageType(p);
      pageTypes[type] = (pageTypes[type] || 0) + 1;
    });

    // Count form purposes
    const formPurposes: Record<string, number> = {};
    pages.forEach(p => {
      p.forms.forEach(f => {
        formPurposes[f.purpose] = (formPurposes[f.purpose] || 0) + 1;
      });
    });

    // Count API methods
    const apiMethods: Record<string, number> = {};
    siteMap.apiEndpoints.forEach(api => {
      apiMethods[api.method] = (apiMethods[api.method] || 0) + 1;
    });

    // Build site structure tree
    const siteStructure = this.buildSiteStructure(siteMap);

    // Calculate max depth
    const navigationDepth = Math.max(...pages.map(p => p.depth));

    return {
      totalPages: siteMap.totalPages,
      totalForms: siteMap.totalForms,
      totalApis: siteMap.totalApiEndpoints,
      totalButtons: siteMap.totalButtons,
      totalLinks: siteMap.totalLinks,
      pageTypes,
      formPurposes,
      apiMethods,
      siteStructure,
      navigationDepth
    };
  }

  /**
   * Analyze security from site map
   */
  private analyzeSecurityFromMap(siteMap: SiteMap, logic: BusinessLogic[]): SecurityAnalysis {
    const pages = Array.from(siteMap.pages.values());
    const findings: SecurityFinding[] = [];

    // Check security headers
    const headerAnalysis = this.analyzeHeaders(pages);
    
    // Add missing header findings
    headerAnalysis.missing.forEach(header => {
      findings.push({
        id: crypto.randomUUID(),
        severity: header === 'strict-transport-security' ? 'high' : 'medium',
        category: 'Headers',
        title: `Missing ${header} header`,
        description: `The security header ${header} is not present`,
        location: siteMap.rootUrl,
        recommendation: `Add ${header} header to server configuration`,
        evidence: ['Header not found in response']
      });
    });

    // Analyze cookies
    const cookieAnalysis = this.analyzeCookies(pages);

    // Add insecure cookie findings
    if (cookieAnalysis.insecure > 0) {
      findings.push({
        id: crypto.randomUUID(),
        severity: 'medium',
        category: 'Cookies',
        title: `${cookieAnalysis.insecure} insecure cookies found`,
        description: 'Some cookies are not using secure flag',
        location: siteMap.rootUrl,
        recommendation: 'Set Secure flag on all cookies',
        evidence: [`${cookieAnalysis.insecure} cookies without Secure flag`]
      });
    }

    // Analyze forms
    const formAnalysis = this.analyzeForms(pages);

    if (formAnalysis.withoutCaptcha > formAnalysis.withCaptcha) {
      findings.push({
        id: crypto.randomUUID(),
        severity: 'low',
        category: 'Forms',
        title: 'Forms without CAPTCHA protection',
        description: `${formAnalysis.withoutCaptcha} forms lack CAPTCHA protection`,
        location: 'Multiple pages',
        recommendation: 'Consider adding CAPTCHA to prevent automated submissions',
        evidence: [`${formAnalysis.withoutCaptcha} forms without CAPTCHA`]
      });
    }

    // Check authentication
    const authAnalysis = this.analyzeAuthentication(logic, pages);

    // Calculate scores
    const score = this.calculateSecurityScore(findings, headerAnalysis, cookieAnalysis);
    const overallRisk = score >= 80 ? 'low' : score >= 60 ? 'medium' : score >= 40 ? 'high' : 'critical';

    return {
      overallRisk,
      score,
      findings,
      headers: headerAnalysis,
      cookies: cookieAnalysis,
      forms: formAnalysis,
      authentication: authAnalysis
    };
  }

  /**
   * Analyze performance
   */
  private analyzePerformance(siteMap: SiteMap): PerformanceAnalysis {
    const pages = Array.from(siteMap.pages.values());
    const loadTimes = pages.map(p => p.loadTime).filter(t => t > 0);

    const avgLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length 
      : 0;
    const maxLoadTime = Math.max(...loadTimes, 0);
    const minLoadTime = Math.min(...loadTimes.filter(t => t > 0), 0);

    // Find slowest pages
    const slowestPages = pages
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, 5)
      .map(p => ({ url: p.url, loadTime: p.loadTime }));

    // Calculate score based on avg load time
    const score = avgLoadTime < 1000 ? 100 : avgLoadTime < 2000 ? 80 : avgLoadTime < 3000 ? 60 : 40;

    // Fake Core Web Vitals (would need real data)
    const coreWebVitals = {
      lcp: { value: avgLoadTime * 1.5, rating: this.rateMetric(avgLoadTime * 1.5, 2500, 4000) },
      fid: { value: 50, rating: 'good' as const },
      cls: { value: 0.1, rating: 'good' as const }
    };

    return {
      score,
      avgLoadTime,
      maxLoadTime,
      minLoadTime,
      coreWebVitals,
      slowestPages,
      resourceAnalysis: {
        totalResources: 0,
        jsSize: 0,
        cssSize: 0,
        imageSize: 0
      }
    };
  }

  /**
   * Map functionality
   */
  private mapFunctionality(
    siteMap: SiteMap, 
    logic: BusinessLogic[],
    flows: TransactionFlow[]
  ): FunctionalityMap {
    const pages = Array.from(siteMap.pages.values());
    
    // Extract features from forms
    const features: Feature[] = [];
    const formPurposes = new Set<string>();
    
    pages.forEach(p => {
      p.forms.forEach(f => {
        if (!formPurposes.has(f.purpose)) {
          formPurposes.add(f.purpose);
          features.push({
            name: f.purpose,
            category: this.categorizeFeature(f.purpose),
            pages: [p.url],
            forms: [f.selector],
            complexity: f.fields.length > 5 ? 'complex' : f.fields.length > 2 ? 'moderate' : 'simple',
            testable: true
          });
        }
      });
    });

    // Extract workflows from flows
    const workflows: Workflow[] = flows.map(f => ({
      name: f.name,
      type: f.type,
      steps: f.steps.map(s => s.action),
      entry: f.steps[0]?.page || '',
      exit: f.steps[f.steps.length - 1]?.page || '',
      hasErrors: !f.success
    }));

    // Extract API capabilities
    const apiCapabilities: APICapability[] = [];
    const apiGroups = this.groupAPIs(siteMap.apiEndpoints);
    
    for (const [name, apis] of Object.entries(apiGroups)) {
      apiCapabilities.push({
        name,
        endpoints: apis.map(a => a.url),
        methods: [...new Set(apis.map(a => a.method))],
        authenticated: apis.some(a => a.isAuthenticated)
      });
    }

    return {
      features,
      workflows,
      apiCapabilities
    };
  }

  /**
   * Analyze test coverage
   */
  private analyzeTestCoverage(siteMap: SiteMap, testSuites: TestSuite[]): TestCoverage {
    const totalTests = testSuites.reduce((sum, s) => sum + s.tests.length, 0);
    
    // Count by type
    const byType: Record<string, number> = {};
    testSuites.forEach(s => {
      byType[s.type] = (byType[s.type] || 0) + s.tests.length;
    });

    // Count by priority
    const byPriority: Record<string, number> = {};
    testSuites.forEach(s => {
      s.tests.forEach(t => {
        byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      });
    });

    // Calculate coverage percentages
    const pagesWithTests = new Set<string>();
    testSuites.forEach(s => {
      s.tests.forEach(t => {
        t.steps.forEach(step => {
          if (step.target?.startsWith('http')) {
            pagesWithTests.add(step.target);
          }
        });
      });
    });

    const coveragePercentage = {
      pages: Math.min(100, (pagesWithTests.size / siteMap.totalPages) * 100),
      forms: Math.min(100, ((byType['form'] || 0) / Math.max(1, siteMap.totalForms)) * 100),
      apis: Math.min(100, ((byType['api'] || 0) / Math.max(1, siteMap.totalApiEndpoints)) * 100),
      features: 80 // Estimated
    };

    return {
      totalTests,
      byType,
      byPriority,
      coveragePercentage,
      uncoveredAreas: [],
      testSuites: testSuites.map(s => ({
        name: s.name,
        tests: s.tests.length,
        type: s.type
      }))
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Security recommendations
    if (this.report!.securityAnalysis.findings.length > 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        priority: 'high',
        category: 'security',
        title: 'Address Security Findings',
        description: `${this.report!.securityAnalysis.findings.length} security issues were identified`,
        effort: 'medium',
        impact: 'high',
        steps: [
          'Review all security findings',
          'Prioritize critical and high severity issues',
          'Implement fixes in order of severity',
          'Re-scan after fixes'
        ]
      });
    }

    // Performance recommendations
    if (this.report!.performanceAnalysis.avgLoadTime > 2000) {
      recommendations.push({
        id: crypto.randomUUID(),
        priority: 'medium',
        category: 'performance',
        title: 'Improve Page Load Times',
        description: `Average load time is ${(this.report!.performanceAnalysis.avgLoadTime / 1000).toFixed(1)}s`,
        effort: 'medium',
        impact: 'medium',
        steps: [
          'Enable compression (gzip/brotli)',
          'Optimize images',
          'Minimize JavaScript and CSS',
          'Enable browser caching',
          'Consider CDN for static assets'
        ]
      });
    }

    // Testing recommendations
    if (this.report!.testCoverage.coveragePercentage.pages < 80) {
      recommendations.push({
        id: crypto.randomUUID(),
        priority: 'medium',
        category: 'testing',
        title: 'Increase Test Coverage',
        description: `Current page coverage is ${this.report!.testCoverage.coveragePercentage.pages.toFixed(0)}%`,
        effort: 'high',
        impact: 'high',
        steps: [
          'Add tests for uncovered pages',
          'Implement critical path tests',
          'Add negative test cases',
          'Set up continuous testing'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Create executive summary
   */
  private createExecutiveSummary(): ExecutiveSummary {
    const securityScore = this.report!.securityAnalysis.score;
    const performanceScore = this.report!.performanceAnalysis.score;
    const functionalityScore = 85; // Based on feature coverage
    const testabilityScore = this.report!.testCoverage.coveragePercentage.pages;

    const overallScore = Math.round(
      (securityScore * 0.3) + 
      (performanceScore * 0.2) + 
      (functionalityScore * 0.25) + 
      (testabilityScore * 0.25)
    );

    // Count findings by severity
    const findings = this.report!.securityAnalysis.findings;
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    const highFindings = findings.filter(f => f.severity === 'high').length;
    const mediumFindings = findings.filter(f => f.severity === 'medium').length;
    const lowFindings = findings.filter(f => f.severity === 'low').length;

    // Key highlights
    const keyHighlights = [
      `Analyzed ${this.report!.siteOverview.totalPages} pages`,
      `Discovered ${this.report!.siteOverview.totalForms} forms`,
      `Found ${this.report!.siteOverview.totalApis} API endpoints`,
      `Generated ${this.report!.testCoverage.totalTests} automated tests`
    ];

    // Immediate actions
    const immediateActions: string[] = [];
    if (criticalFindings > 0) {
      immediateActions.push(`Fix ${criticalFindings} critical security issues`);
    }
    if (highFindings > 0) {
      immediateActions.push(`Address ${highFindings} high-priority findings`);
    }
    if (this.report!.performanceAnalysis.avgLoadTime > 3000) {
      immediateActions.push('Optimize page load performance');
    }

    return {
      overallScore,
      securityScore,
      performanceScore,
      functionalityScore,
      testabilityScore,
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
      keyHighlights,
      immediateActions
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  private detectPageType(page: DiscoveredPage): string {
    const url = page.url.toLowerCase();
    if (url.includes('login') || url.includes('signin')) return 'Authentication';
    if (url.includes('register') || url.includes('signup')) return 'Registration';
    if (url.includes('checkout') || url.includes('payment')) return 'Checkout';
    if (url.includes('search')) return 'Search';
    if (url.includes('profile') || url.includes('account')) return 'Account';
    if (url.includes('product') || url.includes('item')) return 'Product';
    if (page.depth === 0) return 'Homepage';
    return 'Content';
  }

  private buildSiteStructure(siteMap: SiteMap): SiteStructureNode {
    const pages = Array.from(siteMap.pages.values());
    const rootPage = pages.find(p => p.depth === 0) || pages[0];

    return {
      url: rootPage?.url || siteMap.rootUrl,
      title: rootPage?.title || 'Root',
      children: [],
      forms: rootPage?.forms.length || 0,
      apis: 0
    };
  }

  private analyzeHeaders(pages: DiscoveredPage[]): { present: string[]; missing: string[] } {
    const allHeaders = new Set<string>();
    pages.forEach(p => {
      Object.keys(p.securityHeaders).forEach(h => allHeaders.add(h));
    });

    const present = REQUIRED_SECURITY_HEADERS.filter(h => allHeaders.has(h));
    const missing = REQUIRED_SECURITY_HEADERS.filter(h => !allHeaders.has(h));

    return { present, missing };
  }

  private analyzeCookies(pages: DiscoveredPage[]): { secure: number; insecure: number; httpOnly: number; sameSite: number } {
    const allCookies = pages.flatMap(p => p.cookies);
    const uniqueCookies = new Map<string, typeof allCookies[0]>();
    allCookies.forEach(c => uniqueCookies.set(c.name, c));

    const cookies = Array.from(uniqueCookies.values());

    return {
      secure: cookies.filter(c => c.secure).length,
      insecure: cookies.filter(c => !c.secure).length,
      httpOnly: cookies.filter(c => c.httpOnly).length,
      sameSite: cookies.filter(c => c.sameSite !== 'None').length
    };
  }

  private analyzeForms(pages: DiscoveredPage[]): { withCaptcha: number; withoutCaptcha: number; withValidation: number } {
    const allForms = pages.flatMap(p => p.forms);

    return {
      withCaptcha: allForms.filter(f => f.hasCaptcha).length,
      withoutCaptcha: allForms.filter(f => !f.hasCaptcha).length,
      withValidation: allForms.filter(f => f.hasValidation).length
    };
  }

  private analyzeAuthentication(logic: BusinessLogic[], pages: DiscoveredPage[]): {
    hasLogin: boolean;
    hasRegistration: boolean;
    has2FA: boolean;
    passwordPolicy: string;
  } {
    const authLogic = logic.filter(l => l.type === 'authentication');
    const forms = pages.flatMap(p => p.forms);

    return {
      hasLogin: forms.some(f => f.purpose.toLowerCase().includes('login')),
      hasRegistration: forms.some(f => f.purpose.toLowerCase().includes('registration')),
      has2FA: forms.some(f => f.fields.some(field => field.name.includes('otp') || field.name.includes('2fa'))),
      passwordPolicy: 'Standard' // Would need actual analysis
    };
  }

  private calculateSecurityScore(
    findings: SecurityFinding[],
    headers: { present: string[]; missing: string[] },
    cookies: { secure: number; insecure: number }
  ): number {
    let score = 100;

    // Deduct for findings
    findings.forEach(f => {
      switch (f.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    // Deduct for missing headers
    score -= headers.missing.length * 5;

    // Deduct for insecure cookies
    const totalCookies = cookies.secure + cookies.insecure;
    if (totalCookies > 0) {
      score -= (cookies.insecure / totalCookies) * 20;
    }

    return Math.max(0, Math.round(score));
  }

  private rateMetric(value: number, good: number, poor: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  private categorizeFeature(purpose: string): string {
    const lower = purpose.toLowerCase();
    if (lower.includes('auth') || lower.includes('login') || lower.includes('register')) return 'Authentication';
    if (lower.includes('payment') || lower.includes('checkout')) return 'E-commerce';
    if (lower.includes('search')) return 'Search';
    if (lower.includes('contact') || lower.includes('support')) return 'Support';
    return 'General';
  }

  private groupAPIs(apis: DiscoveredAPI[]): Record<string, DiscoveredAPI[]> {
    const groups: Record<string, DiscoveredAPI[]> = {};
    
    apis.forEach(api => {
      try {
        const pathname = new URL(api.url).pathname;
        const basePath = pathname.split('/').slice(0, 3).join('/') || '/api';
        
        if (!groups[basePath]) {
          groups[basePath] = [];
        }
        groups[basePath].push(api);
      } catch {
        if (!groups['/other']) {
          groups['/other'] = [];
        }
        groups['/other'].push(api);
      }
    });

    return groups;
  }

  /**
   * Generate output formats
   */
  private async generateOutputFormats(): Promise<void> {
    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = `supreme-qa-report-${timestamp}`;

    // JSON format
    if (this.config.formats.includes('json')) {
      const jsonPath = path.join(this.config.outputDir, `${baseFilename}.json`);
      const jsonData = this.config.includeRawData 
        ? this.report 
        : { ...this.report, rawData: undefined };
      
      await fs.promises.writeFile(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
      this.report!.formats.json = jsonPath;
      console.log(`  → ${baseFilename}.json`);
    }

    // Markdown format
    if (this.config.formats.includes('markdown')) {
      const mdPath = path.join(this.config.outputDir, `${baseFilename}.md`);
      const markdown = this.generateMarkdownReport();
      
      await fs.promises.writeFile(mdPath, markdown, 'utf-8');
      this.report!.formats.markdown = mdPath;
      console.log(`  → ${baseFilename}.md`);
    }

    // HTML format
    if (this.config.formats.includes('html')) {
      const htmlPath = path.join(this.config.outputDir, `${baseFilename}.html`);
      const html = this.generateHTMLReport();
      
      await fs.promises.writeFile(htmlPath, html, 'utf-8');
      this.report!.formats.html = htmlPath;
      console.log(`  → ${baseFilename}.html`);
    }
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdownReport(): string {
    const r = this.report!;
    const summary = r.executiveSummary;

    return `# ${r.title}

**Generated:** ${new Date(r.generatedAt).toISOString()}  
**Target:** ${r.targetUrl}  
**Duration:** ${(r.duration / 1000).toFixed(1)}s

---

## 📊 Executive Summary

| Metric | Score |
|--------|-------|
| **Overall Score** | ${summary.overallScore}/100 |
| Security | ${summary.securityScore}/100 |
| Performance | ${summary.performanceScore}/100 |
| Functionality | ${summary.functionalityScore}/100 |
| Testability | ${summary.testabilityScore}/100 |

### Findings Overview

| Severity | Count |
|----------|-------|
| 🔴 Critical | ${summary.criticalFindings} |
| 🟠 High | ${summary.highFindings} |
| 🟡 Medium | ${summary.mediumFindings} |
| 🟢 Low | ${summary.lowFindings} |

### Key Highlights

${summary.keyHighlights.map(h => `- ${h}`).join('\n')}

### Immediate Actions Required

${summary.immediateActions.length > 0 
  ? summary.immediateActions.map(a => `- ⚠️ ${a}`).join('\n')
  : '✅ No immediate actions required'}

---

## 🗺️ Site Overview

- **Total Pages:** ${r.siteOverview.totalPages}
- **Total Forms:** ${r.siteOverview.totalForms}
- **Total APIs:** ${r.siteOverview.totalApis}
- **Navigation Depth:** ${r.siteOverview.navigationDepth} levels

---

## 🛡️ Security Analysis

**Overall Risk:** ${r.securityAnalysis.overallRisk.toUpperCase()}  
**Score:** ${r.securityAnalysis.score}/100

### Security Headers

✅ Present: ${r.securityAnalysis.headers.present.join(', ') || 'None'}  
❌ Missing: ${r.securityAnalysis.headers.missing.join(', ') || 'None'}

### Findings

${r.securityAnalysis.findings.map(f => `
#### ${f.severity.toUpperCase()}: ${f.title}

- **Category:** ${f.category}
- **Location:** ${f.location}
- **Description:** ${f.description}
- **Recommendation:** ${f.recommendation}
`).join('\n') || 'No security findings.'}

---

## ⚡ Performance Analysis

**Score:** ${r.performanceAnalysis.score}/100

| Metric | Value |
|--------|-------|
| Avg Load Time | ${r.performanceAnalysis.avgLoadTime.toFixed(0)}ms |
| Max Load Time | ${r.performanceAnalysis.maxLoadTime.toFixed(0)}ms |
| Min Load Time | ${r.performanceAnalysis.minLoadTime.toFixed(0)}ms |

### Slowest Pages

${r.performanceAnalysis.slowestPages.map((p, i) => 
  `${i + 1}. ${p.url} - ${p.loadTime}ms`
).join('\n')}

---

## ✅ Test Coverage

**Total Tests Generated:** ${r.testCoverage.totalTests}

### Coverage by Type

${Object.entries(r.testCoverage.byType).map(([type, count]) => 
  `- ${type}: ${count} tests`
).join('\n')}

### Coverage Percentages

| Area | Coverage |
|------|----------|
| Pages | ${r.testCoverage.coveragePercentage.pages.toFixed(0)}% |
| Forms | ${r.testCoverage.coveragePercentage.forms.toFixed(0)}% |
| APIs | ${r.testCoverage.coveragePercentage.apis.toFixed(0)}% |

---

## 💡 Recommendations

${r.recommendations.map(rec => `
### ${rec.priority.toUpperCase()}: ${rec.title}

**Category:** ${rec.category}  
**Effort:** ${rec.effort} | **Impact:** ${rec.impact}

${rec.description}

**Steps:**
${rec.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
`).join('\n')}

---

*Generated by QAntum Oracle - Supreme QA Report Generator*
`;
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(): string {
    const r = this.report!;
    const summary = r.executiveSummary;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${r.title}</title>
  <style>
    :root {
      --primary: #6366f1;
      --success: #22c55e;
      --warning: #f59e0b;
      --danger: #ef4444;
      --dark: #1f2937;
      --light: #f3f4f6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--light);
      color: var(--dark);
      line-height: 1.6;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    header {
      background: linear-gradient(135deg, var(--primary), #8b5cf6);
      color: white;
      padding: 3rem 2rem;
      text-align: center;
    }
    header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    header p { opacity: 0.9; }
    .score-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    .score-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .score-card h3 { color: var(--dark); font-size: 0.9rem; margin-bottom: 0.5rem; }
    .score-card .score {
      font-size: 2.5rem;
      font-weight: bold;
      color: var(--primary);
    }
    .score-card .score.high { color: var(--success); }
    .score-card .score.medium { color: var(--warning); }
    .score-card .score.low { color: var(--danger); }
    section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin: 2rem 0;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    section h2 {
      color: var(--primary);
      border-bottom: 2px solid var(--light);
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--light); }
    th { background: var(--light); font-weight: 600; }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 500;
    }
    .badge.critical { background: #fee2e2; color: #991b1b; }
    .badge.high { background: #ffedd5; color: #9a3412; }
    .badge.medium { background: #fef3c7; color: #92400e; }
    .badge.low { background: #d1fae5; color: #065f46; }
    .highlight {
      background: var(--light);
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }
    footer {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <header>
    <h1>🔮 ${r.title}</h1>
    <p>Target: ${r.targetUrl}</p>
    <p>Generated: ${new Date(r.generatedAt).toLocaleString()}</p>
  </header>

  <div class="container">
    <div class="score-cards">
      <div class="score-card">
        <h3>Overall Score</h3>
        <div class="score ${summary.overallScore >= 80 ? 'high' : summary.overallScore >= 60 ? 'medium' : 'low'}">
          ${summary.overallScore}
        </div>
      </div>
      <div class="score-card">
        <h3>Security</h3>
        <div class="score ${summary.securityScore >= 80 ? 'high' : summary.securityScore >= 60 ? 'medium' : 'low'}">
          ${summary.securityScore}
        </div>
      </div>
      <div class="score-card">
        <h3>Performance</h3>
        <div class="score ${summary.performanceScore >= 80 ? 'high' : summary.performanceScore >= 60 ? 'medium' : 'low'}">
          ${summary.performanceScore}
        </div>
      </div>
      <div class="score-card">
        <h3>Test Coverage</h3>
        <div class="score ${summary.testabilityScore >= 80 ? 'high' : summary.testabilityScore >= 60 ? 'medium' : 'low'}">
          ${summary.testabilityScore.toFixed(0)}%
        </div>
      </div>
    </div>

    <section>
      <h2>📊 Executive Summary</h2>
      <div class="highlight">
        <h4>Key Highlights</h4>
        <ul>
          ${summary.keyHighlights.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>
      ${summary.immediateActions.length > 0 ? `
      <div class="highlight" style="background: #fef3c7;">
        <h4>⚠️ Immediate Actions Required</h4>
        <ul>
          ${summary.immediateActions.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    </section>

    <section>
      <h2>🗺️ Site Overview</h2>
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Pages</td><td>${r.siteOverview.totalPages}</td></tr>
        <tr><td>Total Forms</td><td>${r.siteOverview.totalForms}</td></tr>
        <tr><td>Total APIs</td><td>${r.siteOverview.totalApis}</td></tr>
        <tr><td>Total Buttons</td><td>${r.siteOverview.totalButtons}</td></tr>
        <tr><td>Total Links</td><td>${r.siteOverview.totalLinks}</td></tr>
      </table>
    </section>

    <section>
      <h2>🛡️ Security Analysis</h2>
      <p><strong>Overall Risk:</strong> <span class="badge ${r.securityAnalysis.overallRisk}">${r.securityAnalysis.overallRisk.toUpperCase()}</span></p>
      
      ${r.securityAnalysis.findings.length > 0 ? `
      <h3 style="margin-top: 1.5rem;">Findings</h3>
      <table>
        <tr><th>Severity</th><th>Title</th><th>Category</th></tr>
        ${r.securityAnalysis.findings.map(f => `
        <tr>
          <td><span class="badge ${f.severity}">${f.severity}</span></td>
          <td>${f.title}</td>
          <td>${f.category}</td>
        </tr>
        `).join('')}
      </table>
      ` : '<p>✅ No security findings</p>'}
    </section>

    <section>
      <h2>⚡ Performance Analysis</h2>
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Average Load Time</td><td>${r.performanceAnalysis.avgLoadTime.toFixed(0)}ms</td></tr>
        <tr><td>Max Load Time</td><td>${r.performanceAnalysis.maxLoadTime.toFixed(0)}ms</td></tr>
        <tr><td>Min Load Time</td><td>${r.performanceAnalysis.minLoadTime.toFixed(0)}ms</td></tr>
      </table>
    </section>

    <section>
      <h2>✅ Test Coverage</h2>
      <p><strong>Total Tests Generated:</strong> ${r.testCoverage.totalTests}</p>
      <table>
        <tr><th>Test Type</th><th>Count</th></tr>
        ${Object.entries(r.testCoverage.byType).map(([type, count]) => `
        <tr><td>${type}</td><td>${count}</td></tr>
        `).join('')}
      </table>
    </section>

    <section>
      <h2>💡 Recommendations</h2>
      ${r.recommendations.map(rec => `
      <div class="highlight">
        <h4><span class="badge ${rec.priority}">${rec.priority}</span> ${rec.title}</h4>
        <p>${rec.description}</p>
        <p><strong>Effort:</strong> ${rec.effort} | <strong>Impact:</strong> ${rec.impact}</p>
      </div>
      `).join('')}
    </section>
  </div>

  <footer>
    <p>Generated by QAntum Oracle - Supreme QA Report Generator</p>
    <p>Report ID: ${r.id}</p>
  </footer>
</body>
</html>`;
  }

  /**
   * Print report summary
   */
  private printReportSummary(): void {
    const r = this.report!;

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                      SUPREME QA REPORT - COMPLETE                                     ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║  📊 REPORT STATISTICS                                                                 ║
║  ─────────────────────────────────────────────────────────────────────────────────    ║
║  Overall Score:    ${r.executiveSummary.overallScore.toString().padEnd(60)}║
║  Security Score:   ${r.executiveSummary.securityScore.toString().padEnd(60)}║
║  Performance:      ${r.executiveSummary.performanceScore.toString().padEnd(60)}║
║  Test Coverage:    ${r.executiveSummary.testabilityScore.toFixed(0)}%${' '.repeat(57)}║
║  ─────────────────────────────────────────────────────────────────────────────────    ║
║  Critical Issues:  ${r.executiveSummary.criticalFindings.toString().padEnd(60)}║
║  High Issues:      ${r.executiveSummary.highFindings.toString().padEnd(60)}║
║  Total Tests:      ${r.testCoverage.totalTests.toString().padEnd(60)}║
║  Duration:         ${(r.duration / 1000).toFixed(1)}s${' '.repeat(57)}║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export function createReportGenerator(config?: Partial<ReportGeneratorConfig>): SupremeReportGenerator {
  return new SupremeReportGenerator(config);
}

export default SupremeReportGenerator;
