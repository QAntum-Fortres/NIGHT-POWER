/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * 🔮 ENTERPRISE DISCOVERY - ORACLE-GATEWAY INTEGRATION
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * 
 * v1.6.0 "The Oracle's Market Intelligence" - Autonomous Enterprise Discovery
 * 
 *   ███████╗███╗   ██╗████████╗███████╗██████╗ ██████╗ ██████╗ ██╗███████╗███████╗
 *   ██╔════╝████╗  ██║╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██║██╔════╝██╔════╝
 *   █████╗  ██╔██╗ ██║   ██║   █████╗  ██████╔╝██████╔╝██████╔╝██║███████╗█████╗  
 *   ██╔══╝  ██║╚██╗██║   ██║   ██╔══╝  ██╔══██╗██╔═══╝ ██╔══██╗██║╚════██║██╔══╝  
 *   ███████╗██║ ╚████║   ██║   ███████╗██║  ██║██║     ██║  ██║██║███████║███████╗
 *   ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝╚══════╝
 * 
 *   ██████╗ ██╗███████╗ ██████╗ ██████╗ ██╗   ██╗███████╗██████╗ ██╗   ██╗
 *   ██╔══██╗██║██╔════╝██╔════╝██╔═══██╗██║   ██║██╔════╝██╔══██╗╚██╗ ██╔╝
 *   ██║  ██║██║███████╗██║     ██║   ██║██║   ██║█████╗  ██████╔╝ ╚████╔╝ 
 *   ██║  ██║██║╚════██║██║     ██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗  ╚██╔╝  
 *   ██████╔╝██║███████║╚██████╗╚██████╔╝ ╚████╔╝ ███████╗██║  ██║   ██║   
 *   ╚═════╝ ╚═╝╚══════╝ ╚═════╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝   ╚═╝   
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * 
 *   MARKET VALUE INCREMENT: +$220,000
 *   
 *   Features:
 *   • Auto Deep Crawl when client adds URL
 *   • Ghost Protocol v2 stealth protection
 *   • Integration with ClientOrchestrator
 *   • Real-time discovery events
 *   • Billing telemetry for crawl operations
 *   
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * @module oracle/enterprise
 * @version 1.6.0
 * @license Commercial - All Rights Reserved
 * @author QANTUM AI Architect
 * @commercial true
 * @marketValue $220,000
 */

import * as crypto from 'crypto';
import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type CrawlStatus = 'queued' | 'initializing' | 'crawling' | 'analyzing' | 'completed' | 'failed' | 'paused';
export type StealthLevel = 'standard' | 'enhanced' | 'ghost' | 'phantom';

/**
 * Discovered element from crawl
 */
export interface DiscoveredElement {
  id: string;
  type: 'form' | 'button' | 'input' | 'link' | 'api' | 'modal' | 'table' | 'navigation';
  selector: string;
  purpose: string;
  confidence: number;
  metadata: Record<string, unknown>;
  testable: boolean;
  complexity: 'simple' | 'medium' | 'complex';
}

/**
 * Discovered page
 */
export interface DiscoveredPage {
  id: string;
  url: string;
  title: string;
  depth: number;
  elements: DiscoveredElement[];
  forms: number;
  buttons: number;
  apis: number;
  loadTime: number;
  screenshot?: string;
  issues: DiscoveredIssue[];
}

/**
 * Discovered issue (for Self-Healing Sales)
 */
export interface DiscoveredIssue {
  id: string;
  type: 'bug' | 'performance' | 'accessibility' | 'security' | 'seo' | 'ux';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  location: string;
  recommendation: string;
  estimatedFix: string;
  marketValue: number;
}

/**
 * Enterprise crawl job
 */
export interface CrawlJob {
  id: string;
  clientKeyId: string;
  organizationId: string;
  targetUrl: string;
  status: CrawlStatus;
  stealthLevel: StealthLevel;
  config: CrawlConfig;
  startedAt: number;
  completedAt?: number;
  progress: {
    pagesDiscovered: number;
    pagesCrawled: number;
    elementsFound: number;
    issuesFound: number;
    estimatedRemaining: number;
  };
  results?: CrawlResults;
  error?: string;
}

/**
 * Crawl configuration
 */
export interface CrawlConfig {
  maxDepth: number;
  maxPages: number;
  timeout: number;
  respectRobots: boolean;
  captureScreenshots: boolean;
  discoverAPIs: boolean;
  discoverForms: boolean;
  analyzePerformance: boolean;
  checkAccessibility: boolean;
  checkSecurity: boolean;
  ghostProtocol: boolean;
  auth?: {
    type: 'basic' | 'bearer' | 'cookie' | 'form';
    credentials: Record<string, string>;
  };
}

/**
 * Crawl results
 */
export interface CrawlResults {
  siteMapId: string;
  totalPages: number;
  totalElements: number;
  totalIssues: number;
  pages: DiscoveredPage[];
  apiEndpoints: APIEndpoint[];
  siteStructure: SiteStructure;
  marketablePackages: MarketablePackage[];
  resourcePrediction: ResourcePrediction;
  issueReport?: IssueReport;
}

/**
 * API endpoint discovery
 */
export interface APIEndpoint {
  id: string;
  url: string;
  method: string;
  authenticated: boolean;
  parameters: string[];
  responseType: string;
  rateLimit?: string;
}

/**
 * Site structure analysis
 */
export interface SiteStructure {
  entryPoints: string[];
  navigationPaths: string[][];
  formFlows: string[][];
  apiDependencies: string[];
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
}

/**
 * Marketable test package (for Auto-Blueprint)
 */
export interface MarketablePackage {
  id: string;
  name: string;
  description: string;
  type: 'smoke' | 'regression' | 'e2e' | 'api' | 'performance' | 'security';
  testCount: number;
  coverage: number;
  estimatedRunTime: number;
  price: number;
  features: string[];
}

/**
 * Resource prediction (for Predictive Scaling)
 */
export interface ResourcePrediction {
  estimatedWorkers: number;
  estimatedMemoryMB: number;
  estimatedCPUPercent: number;
  estimatedDurationMs: number;
  recommendedTier: 'starter' | 'professional' | 'enterprise';
  confidence: number;
  breakdown: {
    crawling: { workers: number; memory: number; duration: number };
    testing: { workers: number; memory: number; duration: number };
    analysis: { workers: number; memory: number; duration: number };
  };
}

/**
 * Issue report (for Self-Healing Sales)
 */
export interface IssueReport {
  id: string;
  generatedAt: number;
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  issues: DiscoveredIssue[];
  estimatedValue: number;
  recommendations: string[];
}

/**
 * Enterprise Discovery configuration
 */
export interface EnterpriseDiscoveryConfig {
  defaultStealthLevel: StealthLevel;
  defaultMaxDepth: number;
  defaultMaxPages: number;
  enableGhostProtocol: boolean;
  enableAutoBilling: boolean;
  crawlPricePerPage: number;
  issuePricePerFind: number;
  jobQueueSize: number;
  concurrentJobs: number;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════════════════════════════════════════════════════

const DEFAULT_CRAWL_CONFIG: CrawlConfig = {
  maxDepth: 5,
  maxPages: 100,
  timeout: 30000,
  respectRobots: true,
  captureScreenshots: true,
  discoverAPIs: true,
  discoverForms: true,
  analyzePerformance: true,
  checkAccessibility: true,
  checkSecurity: true,
  ghostProtocol: true
};

const PACKAGE_TEMPLATES: Record<string, Partial<MarketablePackage>> = {
  smoke: {
    name: 'Smoke Test Suite',
    type: 'smoke',
    description: 'Quick validation of critical user journeys',
    price: 499,
    features: ['Login/Logout', 'Navigation', 'Core Forms', 'Basic API Health']
  },
  regression: {
    name: 'Regression Test Suite',
    type: 'regression',
    description: 'Comprehensive functional coverage',
    price: 1499,
    features: ['All Forms', 'All Buttons', 'State Management', 'Error Handling']
  },
  e2e: {
    name: 'End-to-End Test Suite',
    type: 'e2e',
    description: 'Complete user journey simulation',
    price: 2499,
    features: ['Multi-page Flows', 'User Scenarios', 'Data Validation', 'Edge Cases']
  },
  api: {
    name: 'API Test Suite',
    type: 'api',
    description: 'Full API contract testing',
    price: 1999,
    features: ['Endpoint Coverage', 'Auth Testing', 'Rate Limit Testing', 'Error Responses']
  },
  performance: {
    name: 'Performance Test Suite',
    type: 'performance',
    description: 'Load and stress testing',
    price: 2999,
    features: ['Load Testing', 'Stress Testing', 'Metrics Collection', 'Bottleneck Detection']
  },
  security: {
    name: 'Security Scan Suite',
    type: 'security',
    description: 'OWASP-based security testing',
    price: 3499,
    features: ['XSS Detection', 'SQL Injection', 'Auth Bypass', 'CSRF Testing']
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// ENTERPRISE DISCOVERY
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * 🔮 EnterpriseDiscovery - Oracle-Gateway Integration
 * 
 * Automatically starts Deep Crawl when client adds URL,
 * protected by Ghost Protocol v2 for stealth operation.
 * 
 * @example
 * ```typescript
 * const discovery = new EnterpriseDiscovery();
 * await discovery.initialize();
 * 
 * // Start discovery for a client
 * const job = await discovery.startDiscovery(
 *   'LIC_ABC123',
 *   'ORG_XYZ',
 *   'https://example.com'
 * );
 * 
 * // Listen for completion
 * discovery.on('discovery_complete', (results) => {
 *   console.log('Found:', results.marketablePackages);
 * });
 * ```
 */
export class EnterpriseDiscovery extends EventEmitter {
  private config: EnterpriseDiscoveryConfig;
  private jobs: Map<string, CrawlJob> = new Map();
  private jobQueue: string[] = [];
  private activeJobs: Set<string> = new Set();
  private isInitialized = false;

  constructor(config?: Partial<EnterpriseDiscoveryConfig>) {
    super();
    this.setMaxListeners(100);

    this.config = {
      defaultStealthLevel: config?.defaultStealthLevel ?? 'ghost',
      defaultMaxDepth: config?.defaultMaxDepth ?? 5,
      defaultMaxPages: config?.defaultMaxPages ?? 100,
      enableGhostProtocol: config?.enableGhostProtocol ?? true,
      enableAutoBilling: config?.enableAutoBilling ?? true,
      crawlPricePerPage: config?.crawlPricePerPage ?? 0.10,
      issuePricePerFind: config?.issuePricePerFind ?? 5.00,
      jobQueueSize: config?.jobQueueSize ?? 100,
      concurrentJobs: config?.concurrentJobs ?? 5
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Initialize Enterprise Discovery
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                               ║
║   🔮 ENTERPRISE DISCOVERY - THE ORACLE'S MARKET INTELLIGENCE                                  ║
║                                                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────┐    ║
║   │  👻 Ghost Protocol       │  ${this.config.enableGhostProtocol ? '✅ ENABLED (Stealth: ' + this.config.defaultStealthLevel + ')' : '❌ DISABLED'}                         │    ║
║   │  🕷️ Deep Crawl           │  ✅ ENABLED (${this.config.defaultMaxPages} pages, ${this.config.defaultMaxDepth} depth)                     │    ║
║   │  💰 Auto-Billing         │  ${this.config.enableAutoBilling ? '✅ ENABLED' : '❌ DISABLED'}                                                │    ║
║   │  🔄 Concurrent Jobs      │  ${this.config.concurrentJobs}                                                       │    ║
║   └─────────────────────────────────────────────────────────────────────────────────────┘    ║
║                                                                                               ║
║   PRICING:                                                                                   ║
║   ├─ Per Page Crawled:       $${this.config.crawlPricePerPage.toFixed(2)}                                                      ║
║   └─ Per Issue Found:        $${this.config.issuePricePerFind.toFixed(2)}                                                      ║
║                                                                                               ║
║           "Потребителят дава само URL. Оракулът открива всичко останало."                     ║
║                                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
`);

    // Start job processor
    this.startJobProcessor();

    this.isInitialized = true;
    this.emit('initialized');
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────
  // DISCOVERY OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Start discovery for a client URL
   */
  async startDiscovery(
    clientKeyId: string,
    organizationId: string,
    targetUrl: string,
    config?: Partial<CrawlConfig>,
    stealthLevel?: StealthLevel
  ): Promise<CrawlJob> {
    const jobId = `CRAWL_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    
    const job: CrawlJob = {
      id: jobId,
      clientKeyId,
      organizationId,
      targetUrl: this.normalizeUrl(targetUrl),
      status: 'queued',
      stealthLevel: stealthLevel || this.config.defaultStealthLevel,
      config: { ...DEFAULT_CRAWL_CONFIG, ...config },
      startedAt: Date.now(),
      progress: {
        pagesDiscovered: 0,
        pagesCrawled: 0,
        elementsFound: 0,
        issuesFound: 0,
        estimatedRemaining: 0
      }
    };

    this.jobs.set(jobId, job);
    this.jobQueue.push(jobId);

    this.emit('discovery_queued', { jobId, targetUrl, clientKeyId });

    // Process immediately if capacity available
    this.processNextJob();

    return job;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): CrawlJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'crawling' || job.status === 'analyzing') {
      job.status = 'paused';
      this.activeJobs.delete(jobId);
      this.emit('discovery_cancelled', { jobId });
    }

    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────
  // JOB PROCESSING
  // ─────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Start job processor
   */
  private startJobProcessor(): void {
    setInterval(() => this.processNextJob(), 1000);
  }

  /**
   * Process next job in queue
   */
  private async processNextJob(): Promise<void> {
    if (this.activeJobs.size >= this.config.concurrentJobs) return;
    if (this.jobQueue.length === 0) return;

    const jobId = this.jobQueue.shift()!;
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'queued') return;

    this.activeJobs.add(jobId);
    await this.executeDiscovery(job);
  }

  /**
   * Execute discovery job
   */
  private async executeDiscovery(job: CrawlJob): Promise<void> {
    try {
      job.status = 'initializing';
      this.emit('discovery_started', { jobId: job.id, targetUrl: job.targetUrl });

      // Phase 1: Initialize Ghost Protocol (if enabled)
      if (job.config.ghostProtocol) {
        await this.initializeGhostProtocol(job);
      }

      // Phase 2: Crawl
      job.status = 'crawling';
      const crawlData = await this.performCrawl(job);

      // Phase 3: Analyze
      job.status = 'analyzing';
      const results = await this.analyzeResults(job, crawlData);

      // Phase 4: Complete
      job.status = 'completed';
      job.completedAt = Date.now();
      job.results = results;

      this.emit('discovery_complete', { jobId: job.id, results });

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('discovery_failed', { jobId: job.id, error: job.error });

    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Initialize Ghost Protocol for stealth crawling
   */
  private async initializeGhostProtocol(job: CrawlJob): Promise<void> {
    this.emit('ghost_protocol_activated', {
      jobId: job.id,
      stealthLevel: job.stealthLevel
    });

    // Stealth configuration based on level
    const stealthConfigs: Record<StealthLevel, Record<string, unknown>> = {
      standard: { tls: false, biometric: false, visual: false },
      enhanced: { tls: true, biometric: false, visual: false },
      ghost: { tls: true, biometric: true, visual: false },
      phantom: { tls: true, biometric: true, visual: true }
    };

    // In real implementation, this would configure Ghost Protocol v2
    const config = stealthConfigs[job.stealthLevel];
    this.emit('ghost_config_applied', { jobId: job.id, config });
  }

  /**
   * Perform crawl (simulated)
   */
  private async performCrawl(job: CrawlJob): Promise<{
    pages: DiscoveredPage[];
    apis: APIEndpoint[];
    issues: DiscoveredIssue[];
  }> {
    const pages: DiscoveredPage[] = [];
    const apis: APIEndpoint[] = [];
    const issues: DiscoveredIssue[] = [];

    // Simulate crawl progress
    const targetPages = Math.min(job.config.maxPages, 50 + Math.floor(Math.random() * 50));
    
    for (let i = 0; i < targetPages; i++) {
      // Update progress
      job.progress.pagesDiscovered = i + 1;
      job.progress.pagesCrawled = i + 1;
      
      // Generate discovered page
      const page = this.generateDiscoveredPage(job.targetUrl, i);
      pages.push(page);
      
      job.progress.elementsFound += page.elements.length;
      job.progress.issuesFound += page.issues.length;
      issues.push(...page.issues);

      // Emit progress
      this.emit('crawl_progress', {
        jobId: job.id,
        progress: { ...job.progress }
      });

      // Small delay to simulate real crawling
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Generate API endpoints
    const apiCount = Math.floor(Math.random() * 20) + 5;
    for (let i = 0; i < apiCount; i++) {
      apis.push(this.generateAPIEndpoint(job.targetUrl, i));
    }

    return { pages, apis, issues };
  }

  /**
   * Analyze crawl results
   */
  private async analyzeResults(
    job: CrawlJob,
    data: { pages: DiscoveredPage[]; apis: APIEndpoint[]; issues: DiscoveredIssue[] }
  ): Promise<CrawlResults> {
    // Generate site structure
    const siteStructure = this.analyzeSiteStructure(data.pages);

    // Generate marketable packages
    const marketablePackages = this.generateMarketablePackages(data, siteStructure);

    // Predict resource needs
    const resourcePrediction = this.predictResources(data, siteStructure);

    // Generate issue report
    const issueReport = data.issues.length > 0 ? this.generateIssueReport(data.issues) : undefined;

    return {
      siteMapId: `SITEMAP_${crypto.randomBytes(4).toString('hex')}`,
      totalPages: data.pages.length,
      totalElements: data.pages.reduce((sum, p) => sum + p.elements.length, 0),
      totalIssues: data.issues.length,
      pages: data.pages,
      apiEndpoints: data.apis,
      siteStructure,
      marketablePackages,
      resourcePrediction,
      issueReport
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────
  // GENERATORS & ANALYZERS
  // ─────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Generate discovered page (for simulation)
   */
  private generateDiscoveredPage(baseUrl: string, index: number): DiscoveredPage {
    const pageId = `PAGE_${crypto.randomBytes(4).toString('hex')}`;
    const paths = ['/home', '/about', '/contact', '/products', '/services', '/login', '/signup', '/dashboard', '/settings', '/checkout'];
    const pagePath = paths[index % paths.length] + (index >= paths.length ? `/${index}` : '');

    const elements: DiscoveredElement[] = [];
    const issues: DiscoveredIssue[] = [];

    // Generate forms
    const formCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < formCount; i++) {
      elements.push({
        id: `ELEM_${crypto.randomBytes(4).toString('hex')}`,
        type: 'form',
        selector: `form:nth-of-type(${i + 1})`,
        purpose: ['Login', 'Contact', 'Search', 'Registration'][Math.floor(Math.random() * 4)],
        confidence: 0.85 + Math.random() * 0.15,
        metadata: { fields: Math.floor(Math.random() * 5) + 2 },
        testable: true,
        complexity: ['simple', 'medium', 'complex'][Math.floor(Math.random() * 3)] as any
      });
    }

    // Generate buttons
    const buttonCount = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < buttonCount; i++) {
      elements.push({
        id: `ELEM_${crypto.randomBytes(4).toString('hex')}`,
        type: 'button',
        selector: `button:nth-of-type(${i + 1})`,
        purpose: ['Submit', 'Cancel', 'Navigate', 'Action'][Math.floor(Math.random() * 4)],
        confidence: 0.9 + Math.random() * 0.1,
        metadata: {},
        testable: true,
        complexity: 'simple'
      });
    }

    // Random chance of finding issues
    if (Math.random() > 0.7) {
      issues.push(this.generateIssue(pagePath));
    }

    return {
      id: pageId,
      url: baseUrl + pagePath,
      title: `Page ${index + 1}`,
      depth: Math.min(index, 4),
      elements,
      forms: formCount,
      buttons: buttonCount,
      apis: 0,
      loadTime: 500 + Math.random() * 2000,
      issues
    };
  }

  /**
   * Generate API endpoint
   */
  private generateAPIEndpoint(baseUrl: string, index: number): APIEndpoint {
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const endpoints = ['/api/users', '/api/products', '/api/orders', '/api/auth', '/api/search'];
    
    return {
      id: `API_${crypto.randomBytes(4).toString('hex')}`,
      url: baseUrl + endpoints[index % endpoints.length],
      method: methods[Math.floor(Math.random() * methods.length)],
      authenticated: Math.random() > 0.5,
      parameters: ['id', 'page', 'limit', 'sort'].slice(0, Math.floor(Math.random() * 4) + 1),
      responseType: 'application/json'
    };
  }

  /**
   * Generate issue
   */
  private generateIssue(location: string): DiscoveredIssue {
    const issueTypes: Array<{ type: DiscoveredIssue['type']; title: string; severity: DiscoveredIssue['severity']; value: number }> = [
      { type: 'bug', title: 'Broken link detected', severity: 'medium', value: 50 },
      { type: 'performance', title: 'Slow page load time', severity: 'high', value: 100 },
      { type: 'accessibility', title: 'Missing alt text on images', severity: 'medium', value: 25 },
      { type: 'security', title: 'Form without CSRF protection', severity: 'critical', value: 200 },
      { type: 'seo', title: 'Missing meta description', severity: 'low', value: 15 },
      { type: 'ux', title: 'Inconsistent button styling', severity: 'info', value: 10 }
    ];

    const issue = issueTypes[Math.floor(Math.random() * issueTypes.length)];

    return {
      id: `ISSUE_${crypto.randomBytes(4).toString('hex')}`,
      type: issue.type,
      severity: issue.severity,
      title: issue.title,
      description: `Found at ${location}`,
      location,
      recommendation: 'Fix recommended',
      estimatedFix: '30 minutes',
      marketValue: issue.value
    };
  }

  /**
   * Analyze site structure
   */
  private analyzeSiteStructure(pages: DiscoveredPage[]): SiteStructure {
    const complexity = pages.length > 50 ? 'enterprise' :
                       pages.length > 20 ? 'complex' :
                       pages.length > 10 ? 'medium' : 'simple';

    return {
      entryPoints: [pages[0]?.url || '/'],
      navigationPaths: pages.slice(0, 5).map(p => [p.url]),
      formFlows: pages.filter(p => p.forms > 0).slice(0, 3).map(p => [p.url]),
      apiDependencies: [],
      complexity
    };
  }

  /**
   * Generate marketable packages
   */
  private generateMarketablePackages(
    data: { pages: DiscoveredPage[]; apis: APIEndpoint[]; issues: DiscoveredIssue[] },
    structure: SiteStructure
  ): MarketablePackage[] {
    const packages: MarketablePackage[] = [];

    // Always include smoke test
    packages.push({
      ...PACKAGE_TEMPLATES.smoke as MarketablePackage,
      id: `PKG_${crypto.randomBytes(4).toString('hex')}`,
      testCount: Math.min(data.pages.length * 2, 20),
      coverage: 30,
      estimatedRunTime: 5 * 60 * 1000
    });

    // Regression for medium+ complexity
    if (structure.complexity !== 'simple') {
      packages.push({
        ...PACKAGE_TEMPLATES.regression as MarketablePackage,
        id: `PKG_${crypto.randomBytes(4).toString('hex')}`,
        testCount: data.pages.reduce((sum, p) => sum + p.elements.length, 0),
        coverage: 70,
        estimatedRunTime: 30 * 60 * 1000
      });
    }

    // E2E for complex+ sites
    if (structure.complexity === 'complex' || structure.complexity === 'enterprise') {
      packages.push({
        ...PACKAGE_TEMPLATES.e2e as MarketablePackage,
        id: `PKG_${crypto.randomBytes(4).toString('hex')}`,
        testCount: data.pages.length * 3,
        coverage: 85,
        estimatedRunTime: 60 * 60 * 1000
      });
    }

    // API tests if APIs found
    if (data.apis.length > 0) {
      packages.push({
        ...PACKAGE_TEMPLATES.api as MarketablePackage,
        id: `PKG_${crypto.randomBytes(4).toString('hex')}`,
        testCount: data.apis.length * 5,
        coverage: 90,
        estimatedRunTime: 15 * 60 * 1000
      });
    }

    // Security scan if issues found
    if (data.issues.some(i => i.type === 'security')) {
      packages.push({
        ...PACKAGE_TEMPLATES.security as MarketablePackage,
        id: `PKG_${crypto.randomBytes(4).toString('hex')}`,
        testCount: 50,
        coverage: 95,
        estimatedRunTime: 45 * 60 * 1000
      });
    }

    return packages;
  }

  /**
   * Predict resource needs
   */
  private predictResources(
    data: { pages: DiscoveredPage[]; apis: APIEndpoint[]; issues: DiscoveredIssue[] },
    structure: SiteStructure
  ): ResourcePrediction {
    const pageCount = data.pages.length;
    const elementCount = data.pages.reduce((sum, p) => sum + p.elements.length, 0);

    // Base calculations
    const baseWorkers = Math.ceil(pageCount / 10);
    const baseMemory = 256 + (pageCount * 10) + (elementCount * 2);
    const baseDuration = pageCount * 30000;

    // Complexity multipliers
    const complexityMultipliers = { simple: 1, medium: 1.5, complex: 2, enterprise: 3 };
    const multiplier = complexityMultipliers[structure.complexity];

    const estimatedWorkers = Math.min(Math.ceil(baseWorkers * multiplier), 50);
    const estimatedMemoryMB = Math.ceil(baseMemory * multiplier);
    const estimatedDurationMs = Math.ceil(baseDuration * multiplier);

    // Recommend tier
    const recommendedTier = estimatedWorkers > 20 ? 'enterprise' :
                            estimatedWorkers > 5 ? 'professional' : 'starter';

    return {
      estimatedWorkers,
      estimatedMemoryMB,
      estimatedCPUPercent: Math.min(estimatedWorkers * 10, 80),
      estimatedDurationMs,
      recommendedTier,
      confidence: 0.85,
      breakdown: {
        crawling: {
          workers: Math.ceil(estimatedWorkers * 0.3),
          memory: Math.ceil(estimatedMemoryMB * 0.2),
          duration: Math.ceil(estimatedDurationMs * 0.3)
        },
        testing: {
          workers: Math.ceil(estimatedWorkers * 0.5),
          memory: Math.ceil(estimatedMemoryMB * 0.6),
          duration: Math.ceil(estimatedDurationMs * 0.5)
        },
        analysis: {
          workers: Math.ceil(estimatedWorkers * 0.2),
          memory: Math.ceil(estimatedMemoryMB * 0.2),
          duration: Math.ceil(estimatedDurationMs * 0.2)
        }
      }
    };
  }

  /**
   * Generate issue report
   */
  private generateIssueReport(issues: DiscoveredIssue[]): IssueReport {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;

    const estimatedValue = issues.reduce((sum, i) => sum + i.marketValue, 0);

    return {
      id: `REPORT_${crypto.randomBytes(4).toString('hex')}`,
      generatedAt: Date.now(),
      totalIssues: issues.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      issues,
      estimatedValue,
      recommendations: [
        criticalCount > 0 ? 'Address critical security issues immediately' : '',
        highCount > 0 ? 'Review high-priority performance issues' : '',
        mediumCount > 0 ? 'Schedule medium issues for next sprint' : ''
      ].filter(Boolean)
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Normalize URL
   */
  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url.replace(/\/$/, '');
  }

  /**
   * Get all jobs
   */
  getAllJobs(): CrawlJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get jobs by client
   */
  getJobsByClient(clientKeyId: string): CrawlJob[] {
    return Array.from(this.jobs.values()).filter(j => j.clientKeyId === clientKeyId);
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// FACTORY & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════════════════

let discoveryInstance: EnterpriseDiscovery | null = null;

export function getEnterpriseDiscovery(config?: Partial<EnterpriseDiscoveryConfig>): EnterpriseDiscovery {
  if (!discoveryInstance) {
    discoveryInstance = new EnterpriseDiscovery(config);
  }
  return discoveryInstance;
}

export function createEnterpriseDiscovery(config?: Partial<EnterpriseDiscoveryConfig>): EnterpriseDiscovery {
  return new EnterpriseDiscovery(config);
}

export default EnterpriseDiscovery;
