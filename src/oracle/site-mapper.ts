/**
 * 🔮 THE ORACLE - Site Mapper Module
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 *   ████████╗██╗  ██╗███████╗     ██████╗ ██████╗  █████╗  ██████╗██╗     ███████╗
 *   ╚══██╔══╝██║  ██║██╔════╝    ██╔═══██╗██╔══██╗██╔══██╗██╔════╝██║     ██╔════╝
 *      ██║   ███████║█████╗      ██║   ██║██████╔╝███████║██║     ██║     █████╗  
 *      ██║   ██╔══██║██╔══╝      ██║   ██║██╔══██╗██╔══██║██║     ██║     ██╔══╝  
 *      ██║   ██║  ██║███████╗    ╚██████╔╝██║  ██║██║  ██║╚██████╗███████╗███████╗
 *      ╚═╝   ╚═╝  ╚═╝╚══════╝     ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚══════╝╚══════╝
 * 
 * AI-powered autonomous site mapping - discovers forms, buttons, APIs, hidden endpoints.
 * 
 * "Потребителят дава само URL. QAntum Prime прави всичко останало."
 * 
 * @version 1.0.0
 * @author QAntum AI Architect
 * @phase THE ORACLE - Autonomous Discovery
 */

import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import type { Page, Browser, BrowserContext, Locator } from 'playwright';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Discovered page information
 */
export interface DiscoveredPage {
  id: string;
  url: string;
  title: string;
  depth: number;
  parentId: string | null;
  discoveredAt: number;
  loadTime: number;
  statusCode: number;
  contentType: string;
  screenshot?: string;
  
  // Elements discovered
  forms: DiscoveredForm[];
  buttons: DiscoveredButton[];
  links: DiscoveredLink[];
  inputs: DiscoveredInput[];
  
  // API discovery
  apiEndpoints: DiscoveredAPI[];
  
  // Security findings
  securityHeaders: Record<string, string>;
  cookies: DiscoveredCookie[];
  
  // Accessibility
  a11yIssues: string[];
  
  // Performance
  performanceMetrics: PerformanceMetrics;
}

/**
 * Discovered form
 */
export interface DiscoveredForm {
  id: string;
  action: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  name: string;
  fields: FormField[];
  hasValidation: boolean;
  hasFileUpload: boolean;
  hasCaptcha: boolean;
  selector: string;
  purpose: string; // AI-detected purpose
}

/**
 * Form field
 */
export interface FormField {
  name: string;
  type: string;
  required: boolean;
  placeholder: string;
  validation: string | null;
  options?: string[]; // For select/radio
  selector: string;
}

/**
 * Discovered button
 */
export interface DiscoveredButton {
  id: string;
  text: string;
  type: 'submit' | 'button' | 'reset' | 'link';
  onClick: string | null;
  selector: string;
  purpose: string;
  isDisabled: boolean;
  isVisible: boolean;
}

/**
 * Discovered link
 */
export interface DiscoveredLink {
  id: string;
  text: string;
  href: string;
  isInternal: boolean;
  isExternal: boolean;
  opensNewTab: boolean;
  selector: string;
}

/**
 * Discovered input
 */
export interface DiscoveredInput {
  id: string;
  name: string;
  type: string;
  placeholder: string;
  required: boolean;
  selector: string;
  validation: string | null;
}

/**
 * Discovered API endpoint
 */
export interface DiscoveredAPI {
  id: string;
  url: string;
  method: string;
  discoveredFrom: string; // How it was found
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseStatus?: number;
  responseType?: string;
  isAuthenticated: boolean;
  rateLimit?: string;
}

/**
 * Discovered cookie
 */
export interface DiscoveredCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string;
  expires?: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
}

/**
 * Complete site map
 */
export interface SiteMap {
  id: string;
  rootUrl: string;
  startedAt: number;
  completedAt?: number;
  totalPages: number;
  totalForms: number;
  totalApiEndpoints: number;
  totalButtons: number;
  totalLinks: number;
  
  pages: Map<string, DiscoveredPage>;
  apiEndpoints: DiscoveredAPI[];
  
  // Graph representation
  graph: PageGraph;
  
  // Discovery statistics
  stats: DiscoveryStats;
}

/**
 * Page graph for navigation paths
 */
export interface PageGraph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  url: string;
  depth: number;
  isEntry: boolean;
  isExit: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'link' | 'form' | 'button' | 'redirect' | 'api';
  label: string;
}

/**
 * Discovery statistics
 */
export interface DiscoveryStats {
  pagesDiscovered: number;
  pagesCrawled: number;
  formsFound: number;
  apisFound: number;
  errorsEncountered: number;
  avgLoadTime: number;
  totalDuration: number;
}

/**
 * Site mapper configuration
 */
export interface SiteMapperConfig {
  maxDepth: number;
  maxPages: number;
  timeout: number;
  concurrency: number;
  respectRobotsTxt: boolean;
  followExternalLinks: boolean;
  captureScreenshots: boolean;
  discoverAPIs: boolean;
  discoverForms: boolean;
  userAgent: string;
  viewport: { width: number; height: number };
  // Authentication
  auth?: {
    type: 'basic' | 'bearer' | 'cookie' | 'form';
    credentials: Record<string, string>;
  };
  // Filters
  includePatterns?: RegExp[];
  excludePatterns?: RegExp[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: SiteMapperConfig = {
  maxDepth: 5,
  maxPages: 100,
  timeout: 30000,
  concurrency: 5,
  respectRobotsTxt: true,
  followExternalLinks: false,
  captureScreenshots: true,
  discoverAPIs: true,
  discoverForms: true,
  userAgent: 'QAntum-Oracle/1.0 (Autonomous Discovery)',
  viewport: { width: 1920, height: 1080 }
};

// AI-powered purpose detection patterns
const FORM_PURPOSE_PATTERNS: Array<{ pattern: RegExp; purpose: string }> = [
  { pattern: /login|signin|sign-in/i, purpose: 'Authentication - Login' },
  { pattern: /register|signup|sign-up|create.*account/i, purpose: 'Registration' },
  { pattern: /search/i, purpose: 'Search' },
  { pattern: /contact|feedback|support/i, purpose: 'Contact/Support' },
  { pattern: /checkout|payment|pay/i, purpose: 'Payment/Checkout' },
  { pattern: /subscribe|newsletter/i, purpose: 'Newsletter Subscription' },
  { pattern: /comment|review|rating/i, purpose: 'User Feedback' },
  { pattern: /upload|import/i, purpose: 'File Upload' },
  { pattern: /profile|settings|preferences/i, purpose: 'User Settings' },
  { pattern: /filter|sort/i, purpose: 'Data Filtering' },
];

const BUTTON_PURPOSE_PATTERNS: Array<{ pattern: RegExp; purpose: string }> = [
  { pattern: /submit|send|save/i, purpose: 'Form Submission' },
  { pattern: /cancel|close|back/i, purpose: 'Navigation/Cancel' },
  { pattern: /delete|remove|trash/i, purpose: 'Deletion' },
  { pattern: /add|create|new/i, purpose: 'Creation' },
  { pattern: /edit|modify|update/i, purpose: 'Modification' },
  { pattern: /download|export/i, purpose: 'Data Export' },
  { pattern: /upload|import/i, purpose: 'Data Import' },
  { pattern: /cart|buy|purchase/i, purpose: 'E-commerce' },
  { pattern: /share|social/i, purpose: 'Social Sharing' },
  { pattern: /login|signin/i, purpose: 'Authentication' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SITE MAPPER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🔮 SiteMapper - AI-powered autonomous site mapping
 * 
 * Discovers:
 * - All navigable pages
 * - Forms and their fields
 * - Buttons and actions
 * - API endpoints (from network traffic)
 * - Security headers and cookies
 * - Performance metrics
 */
export class SiteMapper extends EventEmitter {
  private config: SiteMapperConfig;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private siteMap: SiteMap | null = null;
  private visitedUrls: Set<string> = new Set();
  private pendingUrls: Array<{ url: string; depth: number; parentId: string | null }> = [];
  private activeWorkers: number = 0;
  private discoveredApis: Map<string, DiscoveredAPI> = new Map();
  private aborted: boolean = false;

  constructor(config: Partial<SiteMapperConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 🚀 Start mapping a site from the root URL
   */
  async mapSite(rootUrl: string, browser: Browser): Promise<SiteMap> {
    this.browser = browser;
    this.aborted = false;
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                       ║
║   ████████╗██╗  ██╗███████╗     ██████╗ ██████╗  █████╗  ██████╗██╗     ███████╗      ║
║   ╚══██╔══╝██║  ██║██╔════╝    ██╔═══██╗██╔══██╗██╔══██╗██╔════╝██║     ██╔════╝      ║
║      ██║   ███████║█████╗      ██║   ██║██████╔╝███████║██║     ██║     █████╗        ║
║      ██║   ██╔══██║██╔══╝      ██║   ██║██╔══██╗██╔══██║██║     ██║     ██╔══╝        ║
║      ██║   ██║  ██║███████╗    ╚██████╔╝██║  ██║██║  ██║╚██████╗███████╗███████╗      ║
║      ╚═╝   ╚═╝  ╚═╝╚══════╝     ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚══════╝╚══════╝      ║
║                                                                                       ║
║                          SITE MAPPER - Autonomous Discovery                           ║
║                                                                                       ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║  Target: ${rootUrl.padEnd(70)}║
║  Max Depth: ${this.config.maxDepth.toString().padEnd(66)}║
║  Max Pages: ${this.config.maxPages.toString().padEnd(66)}║
║  Concurrency: ${this.config.concurrency.toString().padEnd(64)}║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
`);

    // Initialize site map
    this.siteMap = {
      id: crypto.randomUUID(),
      rootUrl,
      startedAt: Date.now(),
      totalPages: 0,
      totalForms: 0,
      totalApiEndpoints: 0,
      totalButtons: 0,
      totalLinks: 0,
      pages: new Map(),
      apiEndpoints: [],
      graph: { nodes: new Map(), edges: [] },
      stats: {
        pagesDiscovered: 0,
        pagesCrawled: 0,
        formsFound: 0,
        apisFound: 0,
        errorsEncountered: 0,
        avgLoadTime: 0,
        totalDuration: 0
      }
    };

    // Create browser context with API interception
    this.context = await browser.newContext({
      userAgent: this.config.userAgent,
      viewport: this.config.viewport,
      ignoreHTTPSErrors: true
    });

    // Setup API discovery listener
    if (this.config.discoverAPIs) {
      await this.setupApiDiscovery();
    }

    // Add root URL to queue
    this.pendingUrls.push({ url: rootUrl, depth: 0, parentId: null });

    // Start crawling
    await this.crawl();

    // Finalize
    this.siteMap.completedAt = Date.now();
    this.siteMap.apiEndpoints = Array.from(this.discoveredApis.values());
    this.siteMap.totalApiEndpoints = this.siteMap.apiEndpoints.length;
    this.siteMap.stats.totalDuration = this.siteMap.completedAt - this.siteMap.startedAt;

    // Print summary
    this.printSummary();

    // Cleanup
    if (this.context) {
      await this.context.close();
    }

    this.emit('mapping:complete', this.siteMap);
    return this.siteMap;
  }

  /**
   * Setup API discovery through network interception
   */
  private async setupApiDiscovery(): Promise<void> {
    if (!this.context) return;

    this.context.on('request', request => {
      const url = request.url();
      const method = request.method();
      
      // Skip static resources
      if (this.isStaticResource(url)) return;
      
      // Track API calls
      if (this.isApiCall(url, method)) {
        const api: DiscoveredAPI = {
          id: crypto.randomUUID(),
          url,
          method,
          discoveredFrom: 'network_intercept',
          requestHeaders: request.headers(),
          isAuthenticated: this.hasAuthHeader(request.headers())
        };
        
        this.discoveredApis.set(`${method}:${url}`, api);
        this.emit('api:discovered', api);
      }
    });

    this.context.on('response', async response => {
      const url = response.url();
      const method = response.request().method();
      const key = `${method}:${url}`;
      
      if (this.discoveredApis.has(key)) {
        const api = this.discoveredApis.get(key)!;
        api.responseStatus = response.status();
        api.responseType = response.headers()['content-type'];
        
        // Check for rate limit headers
        const rateLimitHeader = response.headers()['x-ratelimit-limit'] || 
                                response.headers()['x-rate-limit-limit'];
        if (rateLimitHeader) {
          api.rateLimit = rateLimitHeader;
        }
      }
    });
  }

  /**
   * Main crawling loop
   */
  private async crawl(): Promise<void> {
    while ((this.pendingUrls.length > 0 || this.activeWorkers > 0) && !this.aborted) {
      // Check if we've hit limits
      if (this.siteMap!.totalPages >= this.config.maxPages) {
        console.log(`[Oracle] ⚠️ Max pages limit (${this.config.maxPages}) reached`);
        break;
      }

      // Process URLs up to concurrency limit
      while (
        this.pendingUrls.length > 0 && 
        this.activeWorkers < this.config.concurrency &&
        this.siteMap!.totalPages < this.config.maxPages
      ) {
        const item = this.pendingUrls.shift();
        if (item && !this.visitedUrls.has(item.url)) {
          this.visitedUrls.add(item.url);
          this.activeWorkers++;
          
          // Don't await - let it run concurrently
          this.crawlPage(item.url, item.depth, item.parentId)
            .catch(err => {
              console.error(`[Oracle] Error crawling ${item.url}:`, err.message);
              this.siteMap!.stats.errorsEncountered++;
            })
            .finally(() => {
              this.activeWorkers--;
            });
        }
      }

      // Small delay to prevent overwhelming
      await this.sleep(100);
    }
  }

  /**
   * Crawl a single page
   */
  private async crawlPage(url: string, depth: number, parentId: string | null): Promise<void> {
    if (depth > this.config.maxDepth) return;

    const page = await this.context!.newPage();
    const pageId = crypto.randomUUID();
    
    try {
      console.log(`[Oracle] 🔍 Crawling (depth ${depth}): ${url}`);
      
      const startTime = Date.now();
      
      // Navigate with timeout
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.config.timeout
      });

      const loadTime = Date.now() - startTime;

      // Get page info
      const title = await page.title();
      const statusCode = response?.status() ?? 0;
      const contentType = response?.headers()['content-type'] ?? '';

      // Create discovered page object
      const discoveredPage: DiscoveredPage = {
        id: pageId,
        url,
        title,
        depth,
        parentId,
        discoveredAt: Date.now(),
        loadTime,
        statusCode,
        contentType,
        forms: [],
        buttons: [],
        links: [],
        inputs: [],
        apiEndpoints: [],
        securityHeaders: this.extractSecurityHeaders(response?.headers() ?? {}),
        cookies: await this.extractCookies(page),
        a11yIssues: [],
        performanceMetrics: await this.getPerformanceMetrics(page)
      };

      // Discover forms
      if (this.config.discoverForms) {
        discoveredPage.forms = await this.discoverForms(page);
        this.siteMap!.totalForms += discoveredPage.forms.length;
        this.siteMap!.stats.formsFound += discoveredPage.forms.length;
      }

      // Discover buttons
      discoveredPage.buttons = await this.discoverButtons(page);
      this.siteMap!.totalButtons += discoveredPage.buttons.length;

      // Discover links (and add to queue)
      discoveredPage.links = await this.discoverLinks(page, url);
      this.siteMap!.totalLinks += discoveredPage.links.length;

      // Discover inputs
      discoveredPage.inputs = await this.discoverInputs(page);

      // Capture screenshot
      if (this.config.captureScreenshots) {
        const screenshotBuffer = await page.screenshot({ 
          type: 'png',
          fullPage: false
        }).catch(() => undefined);
        discoveredPage.screenshot = screenshotBuffer ? screenshotBuffer.toString('base64') : undefined;
      }

      // Add internal links to queue
      for (const link of discoveredPage.links) {
        if (link.isInternal && !this.visitedUrls.has(link.href)) {
          this.pendingUrls.push({
            url: link.href,
            depth: depth + 1,
            parentId: pageId
          });
          
          // Add edge to graph
          this.siteMap!.graph.edges.push({
            from: pageId,
            to: link.href,
            type: 'link',
            label: link.text
          });
        }
      }

      // Add to site map
      this.siteMap!.pages.set(pageId, discoveredPage);
      this.siteMap!.totalPages++;
      this.siteMap!.stats.pagesCrawled++;

      // Add node to graph
      this.siteMap!.graph.nodes.set(pageId, {
        id: pageId,
        url,
        depth,
        isEntry: depth === 0,
        isExit: discoveredPage.links.filter(l => l.isInternal).length === 0
      });

      // Update avg load time
      const totalLoadTime = Array.from(this.siteMap!.pages.values())
        .reduce((sum, p) => sum + p.loadTime, 0);
      this.siteMap!.stats.avgLoadTime = totalLoadTime / this.siteMap!.pages.size;

      this.emit('page:crawled', discoveredPage);

    } catch (error) {
      this.siteMap!.stats.errorsEncountered++;
      this.emit('page:error', { url, error });
    } finally {
      await page.close();
    }
  }

  /**
   * Discover all forms on a page
   */
  private async discoverForms(page: Page): Promise<DiscoveredForm[]> {
    const forms: DiscoveredForm[] = [];

    const formElements = await page.locator('form').all();
    
    for (const form of formElements) {
      try {
        const action = await form.getAttribute('action') || '';
        const method = (await form.getAttribute('method') || 'GET').toUpperCase() as DiscoveredForm['method'];
        const name = await form.getAttribute('name') || await form.getAttribute('id') || '';
        
        // Get all fields
        const fields = await this.discoverFormFields(form);
        
        // Check for special elements
        const hasFileUpload = fields.some(f => f.type === 'file');
        const hasCaptcha = await form.locator('[class*="captcha"], [id*="captcha"], [class*="recaptcha"]').count() > 0;
        const hasValidation = fields.some(f => f.required || f.validation);

        // Generate selector
        const selector = await this.generateSelector(form);

        // Detect purpose using AI patterns
        const formText = `${name} ${action} ${fields.map(f => f.name).join(' ')}`;
        const purpose = this.detectFormPurpose(formText);

        forms.push({
          id: crypto.randomUUID(),
          action,
          method,
          name,
          fields,
          hasValidation,
          hasFileUpload,
          hasCaptcha,
          selector,
          purpose
        });

      } catch (e) {
        // Skip problematic forms
      }
    }

    return forms;
  }

  /**
   * Discover form fields
   */
  private async discoverFormFields(form: Locator): Promise<FormField[]> {
    const fields: FormField[] = [];
    
    const inputs = await form.locator('input, select, textarea').all();
    
    for (const input of inputs) {
      try {
        const type = await input.getAttribute('type') || 'text';
        
        // Skip hidden and submit types
        if (['hidden', 'submit', 'button', 'image'].includes(type)) continue;

        const name = await input.getAttribute('name') || '';
        const required = await input.getAttribute('required') !== null;
        const placeholder = await input.getAttribute('placeholder') || '';
        const pattern = await input.getAttribute('pattern');
        const selector = await this.generateSelector(input);

        // Get options for select elements
        let options: string[] | undefined;
        const tagName = await input.evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'select') {
          options = await input.locator('option').allTextContents();
        }

        fields.push({
          name,
          type,
          required,
          placeholder,
          validation: pattern,
          options,
          selector
        });

      } catch (e) {
        // Skip problematic inputs
      }
    }

    return fields;
  }

  /**
   * Discover all buttons on a page
   */
  private async discoverButtons(page: Page): Promise<DiscoveredButton[]> {
    const buttons: DiscoveredButton[] = [];
    
    const buttonElements = await page.locator('button, [role="button"], input[type="submit"], input[type="button"], a.btn, a.button').all();
    
    for (const button of buttonElements) {
      try {
        const text = await button.textContent() || await button.getAttribute('value') || '';
        const type = await button.getAttribute('type') as DiscoveredButton['type'] || 'button';
        const onClick = await button.getAttribute('onclick');
        const isDisabled = await button.isDisabled();
        const isVisible = await button.isVisible();
        const selector = await this.generateSelector(button);

        // Detect purpose
        const purpose = this.detectButtonPurpose(text);

        buttons.push({
          id: crypto.randomUUID(),
          text: text.trim(),
          type,
          onClick,
          selector,
          purpose,
          isDisabled,
          isVisible
        });

      } catch (e) {
        // Skip problematic buttons
      }
    }

    return buttons;
  }

  /**
   * Discover all links on a page
   */
  private async discoverLinks(page: Page, currentUrl: string): Promise<DiscoveredLink[]> {
    const links: DiscoveredLink[] = [];
    const currentDomain = new URL(currentUrl).hostname;
    
    const linkElements = await page.locator('a[href]').all();
    
    for (const link of linkElements) {
      try {
        const href = await link.getAttribute('href') || '';
        const text = await link.textContent() || '';
        const target = await link.getAttribute('target');
        
        // Skip empty/invalid hrefs
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) continue;

        // Resolve relative URLs
        const absoluteUrl = new URL(href, currentUrl).href;
        const linkDomain = new URL(absoluteUrl).hostname;

        const isInternal = linkDomain === currentDomain;
        const isExternal = !isInternal;
        const opensNewTab = target === '_blank';

        // Check filters
        if (!this.config.followExternalLinks && isExternal) continue;
        if (this.config.excludePatterns?.some(p => p.test(absoluteUrl))) continue;
        if (this.config.includePatterns && !this.config.includePatterns.some(p => p.test(absoluteUrl))) continue;

        const selector = await this.generateSelector(link);

        links.push({
          id: crypto.randomUUID(),
          text: text.trim(),
          href: absoluteUrl,
          isInternal,
          isExternal,
          opensNewTab,
          selector
        });

      } catch (e) {
        // Skip problematic links
      }
    }

    return links;
  }

  /**
   * Discover all inputs on a page (not in forms)
   */
  private async discoverInputs(page: Page): Promise<DiscoveredInput[]> {
    const inputs: DiscoveredInput[] = [];
    
    // Get inputs not inside forms
    const inputElements = await page.locator('input:not(form input), textarea:not(form textarea)').all();
    
    for (const input of inputElements) {
      try {
        const type = await input.getAttribute('type') || 'text';
        if (['hidden', 'submit', 'button'].includes(type)) continue;

        const name = await input.getAttribute('name') || '';
        const placeholder = await input.getAttribute('placeholder') || '';
        const required = await input.getAttribute('required') !== null;
        const pattern = await input.getAttribute('pattern');
        const selector = await this.generateSelector(input);

        inputs.push({
          id: crypto.randomUUID(),
          name,
          type,
          placeholder,
          required,
          selector,
          validation: pattern
        });

      } catch (e) {
        // Skip
      }
    }

    return inputs;
  }

  /**
   * Extract security headers
   */
  private extractSecurityHeaders(headers: Record<string, string>): Record<string, string> {
    const securityHeaders: Record<string, string> = {};
    const headerNames = [
      'strict-transport-security',
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy',
      'permissions-policy'
    ];

    for (const name of headerNames) {
      if (headers[name]) {
        securityHeaders[name] = headers[name];
      }
    }

    return securityHeaders;
  }

  /**
   * Extract cookies
   */
  private async extractCookies(page: Page): Promise<DiscoveredCookie[]> {
    const cookies = await page.context().cookies();
    
    return cookies.map(c => ({
      name: c.name,
      value: c.value.substring(0, 50) + (c.value.length > 50 ? '...' : ''),
      domain: c.domain,
      path: c.path,
      secure: c.secure,
      httpOnly: c.httpOnly,
      sameSite: c.sameSite,
      expires: c.expires
    }));
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
    try {
      const metrics = await page.evaluate(() => {
        const perf = performance;
        const navigation = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = perf.getEntriesByType('paint');
        
        return {
          loadTime: navigation?.loadEventEnd - navigation?.startTime || 0,
          domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.startTime || 0,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          largestContentfulPaint: 0,
          timeToInteractive: 0,
          totalBlockingTime: 0,
          cumulativeLayoutShift: 0
        };
      });
      
      return metrics;
    } catch {
      return {
        loadTime: 0,
        domContentLoaded: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        timeToInteractive: 0,
        totalBlockingTime: 0,
        cumulativeLayoutShift: 0
      };
    }
  }

  /**
   * Generate robust selector for element
   */
  private async generateSelector(element: Locator): Promise<string> {
    try {
      // Try data-testid first
      const testId = await element.getAttribute('data-testid');
      if (testId) return `[data-testid="${testId}"]`;

      // Try id
      const id = await element.getAttribute('id');
      if (id) return `#${id}`;

      // Try unique class combination
      const className = await element.getAttribute('class');
      if (className) {
        const classes = className.split(' ').filter(c => c.length > 0).slice(0, 2);
        if (classes.length > 0) {
          return `.${classes.join('.')}`;
        }
      }

      // Try name
      const name = await element.getAttribute('name');
      if (name) return `[name="${name}"]`;

      // Fallback to tag + text
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      const text = await element.textContent();
      if (text && text.length < 30) {
        return `${tagName}:has-text("${text.trim()}")`;
      }

      return tagName;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Detect form purpose using AI patterns
   */
  private detectFormPurpose(text: string): string {
    for (const { pattern, purpose } of FORM_PURPOSE_PATTERNS) {
      if (pattern.test(text)) {
        return purpose;
      }
    }
    return 'General Form';
  }

  /**
   * Detect button purpose using AI patterns
   */
  private detectButtonPurpose(text: string): string {
    for (const { pattern, purpose } of BUTTON_PURPOSE_PATTERNS) {
      if (pattern.test(text)) {
        return purpose;
      }
    }
    return 'Action Button';
  }

  /**
   * Check if URL is a static resource
   */
  private isStaticResource(url: string): boolean {
    const staticPatterns = /\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|webp|mp4|webm)(\?|$)/i;
    return staticPatterns.test(url);
  }

  /**
   * Check if URL is an API call
   */
  private isApiCall(url: string, method: string): boolean {
    // POST/PUT/DELETE are usually API calls
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) return true;
    
    // Check for API patterns
    const apiPatterns = /\/api\/|\/v\d+\/|\/graphql|\.json(\?|$)/i;
    return apiPatterns.test(url);
  }

  /**
   * Check if request has authentication header
   */
  private hasAuthHeader(headers: Record<string, string>): boolean {
    return !!(headers['authorization'] || headers['x-api-key'] || headers['x-auth-token']);
  }

  /**
   * Print summary after mapping
   */
  private printSummary(): void {
    const sm = this.siteMap!;
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                          THE ORACLE - MAPPING COMPLETE                                ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║  📊 DISCOVERY STATISTICS                                                              ║
║  ─────────────────────────────────────────────────────────────────────────────────    ║
║  Pages Crawled:    ${sm.totalPages.toString().padEnd(60)}║
║  Forms Found:      ${sm.totalForms.toString().padEnd(60)}║
║  API Endpoints:    ${sm.totalApiEndpoints.toString().padEnd(60)}║
║  Buttons:          ${sm.totalButtons.toString().padEnd(60)}║
║  Links:            ${sm.totalLinks.toString().padEnd(60)}║
║  Errors:           ${sm.stats.errorsEncountered.toString().padEnd(60)}║
║  ─────────────────────────────────────────────────────────────────────────────────    ║
║  Total Duration:   ${(sm.stats.totalDuration / 1000).toFixed(2)}s${' '.repeat(55)}║
║  Avg Load Time:    ${sm.stats.avgLoadTime.toFixed(0)}ms${' '.repeat(55)}║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
`);
  }

  /**
   * Abort current mapping
   */
  abort(): void {
    this.aborted = true;
    console.log('[Oracle] ⚠️ Mapping aborted');
  }

  /**
   * Get current site map state
   */
  getSiteMap(): SiteMap | null {
    return this.siteMap;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new SiteMapper instance
 */
export function createSiteMapper(config?: Partial<SiteMapperConfig>): SiteMapper {
  return new SiteMapper(config);
}

export default SiteMapper;
