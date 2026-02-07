/**
 * 🤖 AUTONOMOUS EXPLORER - Self-Discovery Engine
 * 
 * Automatically crawls websites, discovers business logic,
 * maps API dependencies, and prepares data for test generation.
 * 
 * Features:
 * - Intelligent page crawling with parallel workers
 * - Form detection and field analysis
 * - Transaction flow discovery
 * - API endpoint mapping
 * - Business logic inference
 * 
 * @version 1.0.0-QANTUM-PRIME
 * @phase 84-86
 */

import { chromium, Browser, Page, BrowserContext, Request, Response } from 'playwright';
import { NeuralMapEngine, CognitiveAnchor } from './neural-map-engine';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

import { logger } from '../api/unified/utils/logger';
// ============================================================
// TYPES
// ============================================================
interface ExplorerConfig {
    maxPages: number;
    maxDepth: number;
    parallelWorkers: number;
    timeout: number;
    respectRobotsTxt: boolean;
    captureNetworkTraffic: boolean;
    takeScreenshots: boolean;
    detectForms: boolean;
    detectAPIs: boolean;
    headless: boolean;
    outputDir: string;
}

interface DiscoveredPage {
    url: string;
    title: string;
    depth: number;
    parentUrl?: string;
    discoveredAt: number;
    crawledAt?: number;
    
    // Page analysis
    forms: DiscoveredForm[];
    links: DiscoveredLink[];
    buttons: DiscoveredButton[];
    inputs: DiscoveredInput[];
    
    // Cognitive anchors
    anchors: string[];  // Anchor IDs
    
    // API traffic
    apiCalls: ApiCall[];
    
    // Screenshot
    screenshot?: string;
    
    // Classification
    pageType: 'landing' | 'form' | 'list' | 'detail' | 'checkout' | 'auth' | 'dashboard' | 'other';
    businessFunction?: string;
}

interface DiscoveredForm {
    id: string;
    name?: string;
    action: string;
    method: string;
    fields: FormField[];
    submitButton?: string;
    purpose: 'login' | 'register' | 'search' | 'contact' | 'checkout' | 'data-entry' | 'other';
}

interface FormField {
    name: string;
    type: string;
    label?: string;
    placeholder?: string;
    required: boolean;
    validation?: string;
    autocomplete?: string;
}

interface DiscoveredLink {
    url: string;
    text: string;
    isExternal: boolean;
    isNavigation: boolean;
    anchorId?: string;
}

interface DiscoveredButton {
    text: string;
    type: 'submit' | 'button' | 'reset';
    onClick?: string;
    anchorId?: string;
    businessAction?: string;
}

interface DiscoveredInput {
    name: string;
    type: string;
    label?: string;
    anchorId?: string;
}

interface ApiCall {
    id: string;
    method: string;
    url: string;
    requestHeaders: Record<string, string>;
    requestBody?: any;
    responseStatus: number;
    responseBody?: any;
    timestamp: number;
    duration: number;
    triggeredBy?: string;
}

interface TransactionFlow {
    id: string;
    name: string;
    startPage: string;
    endPage: string;
    steps: FlowStep[];
    apiSequence: string[];
    businessPurpose: string;
}

interface FlowStep {
    pageUrl: string;
    action: 'click' | 'fill' | 'select' | 'submit' | 'navigate';
    target?: string;
    value?: string;
    apiCalls: string[];
}

interface SiteMap {
    baseUrl: string;
    exploredAt: number;
    totalPages: number;
    totalForms: number;
    totalApiEndpoints: number;
    
    pages: Map<string, DiscoveredPage>;
    forms: Map<string, DiscoveredForm>;
    apiEndpoints: Map<string, ApiEndpoint>;
    transactionFlows: TransactionFlow[];
    
    // Business logic summary
    authentication: AuthenticationInfo | null;
    userFlows: string[];
    criticalPaths: string[];
}

interface ApiEndpoint {
    url: string;
    method: string;
    requestSchema?: any;
    responseSchema?: any;
    usageCount: number;
    avgResponseTime: number;
    authentication: 'none' | 'bearer' | 'cookie' | 'api-key';
}

interface AuthenticationInfo {
    loginUrl: string;
    loginForm: string;
    usernameField: string;
    passwordField: string;
    submitButton: string;
    successIndicator: string;
    logoutUrl?: string;
}

// ============================================================
// AUTONOMOUS EXPLORER
// ============================================================
export class AutonomousExplorer extends EventEmitter {
    private config: ExplorerConfig;
    private neuralMap: NeuralMapEngine;
    private browser: Browser | null = null;
    private siteMap: SiteMap | null = null;
    private visitedUrls: Set<string> = new Set();
    private urlQueue: Array<{ url: string; depth: number; parent?: string }> = [];
    private activeWorkers = 0;

    constructor(config: Partial<ExplorerConfig> = {}) {
        super();
        
        this.config = {
            maxPages: 100,
            maxDepth: 5,
            parallelWorkers: 4,
            timeout: 30000,
            respectRobotsTxt: true,
            captureNetworkTraffic: true,
            takeScreenshots: true,
            detectForms: true,
            detectAPIs: true,
            headless: true,
            outputDir: './exploration-data',
            ...config
        };

        this.neuralMap = new NeuralMapEngine();
    }

    /**
     * 🚀 Start autonomous exploration
     */
    async explore(baseUrl: string): Promise<SiteMap> {
        logger.debug(`
╔═══════════════════════════════════════════════════════════════╗
║  🤖 AUTONOMOUS EXPLORER - Self-Discovery Mode                 ║
║                                                               ║
║  "QANTUM writes its own tests"                          ║
╚═══════════════════════════════════════════════════════════════╝
`);
        logger.debug(`🤖 [EXPLORER] Target: ${baseUrl}`);
        logger.debug(`🤖 [EXPLORER] Max Pages: ${this.config.maxPages}`);
        logger.debug(`🤖 [EXPLORER] Workers: ${this.config.parallelWorkers}`);
        logger.debug('');

        // Initialize
        this.siteMap = this.initializeSiteMap(baseUrl);
        this.visitedUrls.clear();
        this.urlQueue = [{ url: baseUrl, depth: 0 }];

        // Launch browser
        this.browser = await chromium.launch({
            headless: this.config.headless
        });

        const startTime = Date.now();
        this.emit('exploration:start', { baseUrl });

        // Start parallel crawling
        await this.runCrawlers();

        // Post-process discoveries
        this.detectTransactionFlows();
        this.identifyAuthentication();
        this.analyzeApiPatterns();

        // Save results
        await this.saveSiteMap();

        // Cleanup
        await this.browser.close();

        const duration = Date.now() - startTime;
        logger.debug('');
        logger.debug(`🤖 [EXPLORER] Exploration complete!`);
        logger.debug(`   Duration: ${(duration / 1000).toFixed(1)}s`);
        logger.debug(`   Pages discovered: ${this.siteMap.totalPages}`);
        logger.debug(`   Forms found: ${this.siteMap.totalForms}`);
        logger.debug(`   API endpoints: ${this.siteMap.totalApiEndpoints}`);
        logger.debug(`   Transaction flows: ${this.siteMap.transactionFlows.length}`);

        this.emit('exploration:complete', this.siteMap);
        return this.siteMap;
    }

    /**
     * Run parallel crawlers
     */
    private async runCrawlers(): Promise<void> {
        const workers: Promise<void>[] = [];

        for (let i = 0; i < this.config.parallelWorkers; i++) {
            workers.push(this.crawlerWorker(i));
        }

        await Promise.all(workers);
    }

    /**
     * Individual crawler worker
     */
    private async crawlerWorker(workerId: number): Promise<void> {
        if (!this.browser) return;

        const context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'QAntum-Explorer/26.0'
        });

        const page = await context.newPage();

        // Setup network interception
        if (this.config.captureNetworkTraffic) {
            this.setupNetworkCapture(page, workerId);
        }

        while (this.urlQueue.length > 0 || this.activeWorkers > 0) {
            const item = this.urlQueue.shift();
            if (!item) {
                await this.sleep(100);
                continue;
            }

            if (this.visitedUrls.has(item.url)) continue;
            if (this.visitedUrls.size >= this.config.maxPages) break;
            if (item.depth > this.config.maxDepth) continue;

            this.visitedUrls.add(item.url);
            this.activeWorkers++;

            try {
                await this.crawlPage(page, item.url, item.depth, item.parent);
            } catch (error: any) {
                logger.error(`🤖 [WORKER-${workerId}] Error crawling ${item.url}:`, error.message);
            }

            this.activeWorkers--;
        }

        await context.close();
    }

    /**
     * Crawl a single page
     */
    private async crawlPage(
        page: Page,
        url: string,
        depth: number,
        parentUrl?: string
    ): Promise<void> {
        logger.debug(`🤖 [EXPLORER] Crawling: ${url} (depth: ${depth})`);

        try {
            // Navigate
            await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: this.config.timeout
            });

            // Wait for dynamic content
            await this.sleep(500);

            // Analyze page
            const discoveredPage = await this.analyzePage(page, url, depth, parentUrl);

            // Store in sitemap
            this.siteMap!.pages.set(url, discoveredPage);

            // Update counts
            this.siteMap!.totalPages++;
            this.siteMap!.totalForms += discoveredPage.forms.length;

            // Queue new links
            for (const link of discoveredPage.links) {
                if (!link.isExternal && !this.visitedUrls.has(link.url)) {
                    this.urlQueue.push({
                        url: link.url,
                        depth: depth + 1,
                        parent: url
                    });
                }
            }

            // Take screenshot
            if (this.config.takeScreenshots) {
                const screenshotPath = await this.takeScreenshot(page, url);
                discoveredPage.screenshot = screenshotPath;
            }

            this.emit('page:crawled', discoveredPage);

        } catch (error) {
            throw error;
        }
    }

    /**
     * Analyze page content
     */
    private async analyzePage(
        page: Page,
        url: string,
        depth: number,
        parentUrl?: string
    ): Promise<DiscoveredPage> {
        const title = await page.title();

        // Discover forms
        const forms = this.config.detectForms 
            ? await this.discoverForms(page) 
            : [];

        // Discover links
        const links = await this.discoverLinks(page, url);

        // Discover buttons
        const buttons = await this.discoverButtons(page);

        // Discover inputs
        const inputs = await this.discoverInputs(page);

        // Create cognitive anchors for important elements
        const anchors = await this.createAnchors(page, forms, buttons, inputs);

        // Classify page type
        const pageType = this.classifyPageType(forms, buttons, url);

        // Infer business function
        const businessFunction = this.inferBusinessFunction(forms, buttons, title, url);

        return {
            url,
            title,
            depth,
            parentUrl,
            discoveredAt: Date.now(),
            crawledAt: Date.now(),
            forms,
            links,
            buttons,
            inputs,
            anchors,
            apiCalls: [],  // Filled by network capture
            pageType,
            businessFunction
        };
    }

    /**
     * Discover forms on page
     */
    private async discoverForms(page: Page): Promise<DiscoveredForm[]> {
        return await page.evaluate(() => {
            const forms: any[] = [];
            const formElements = document.querySelectorAll('form');

            for (const form of formElements) {
                const fields: any[] = [];
                const inputs = form.querySelectorAll('input, select, textarea');

                for (const input of inputs) {
                    const inp = input as HTMLInputElement;
                    const label = document.querySelector(`label[for="${inp.id}"]`);
                    
                    fields.push({
                        name: inp.name || inp.id || `field_${fields.length}`,
                        type: inp.type || 'text',
                        label: label?.textContent?.trim(),
                        placeholder: inp.placeholder,
                        required: inp.required,
                        validation: inp.pattern,
                        autocomplete: inp.autocomplete
                    });
                }

                // Find submit button
                const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
                
                // Determine form purpose
                const formText = form.textContent?.toLowerCase() || '';
                let purpose = 'other';
                if (formText.includes('login') || formText.includes('sign in')) purpose = 'login';
                else if (formText.includes('register') || formText.includes('sign up')) purpose = 'register';
                else if (formText.includes('search')) purpose = 'search';
                else if (formText.includes('contact')) purpose = 'contact';
                else if (formText.includes('checkout') || formText.includes('payment')) purpose = 'checkout';

                forms.push({
                    id: form.id || `form_${forms.length}`,
                    name: form.getAttribute('name'),
                    action: form.action,
                    method: form.method?.toUpperCase() || 'GET',
                    fields,
                    submitButton: submitBtn?.textContent?.trim() || 'Submit',
                    purpose
                });
            }

            return forms;
        });
    }

    /**
     * Discover links on page
     */
    private async discoverLinks(page: Page, currentUrl: string): Promise<DiscoveredLink[]> {
        const baseHost = new URL(currentUrl).host;

        return await page.evaluate((host) => {
            const links: any[] = [];
            const anchors = document.querySelectorAll('a[href]');

            for (const anchor of anchors) {
                const a = anchor as HTMLAnchorElement;
                const href = a.href;
                
                if (!href || href.startsWith('javascript:') || href.startsWith('#')) continue;

                try {
                    const linkUrl = new URL(href);
                    const isExternal = linkUrl.host !== host;
                    const isNavigation = a.closest('nav, header, [role="navigation"]') !== null;

                    links.push({
                        url: href,
                        text: a.textContent?.trim() || '',
                        isExternal,
                        isNavigation
                    });
                } catch {}
            }

            return links;
        }, baseHost);
    }

    /**
     * Discover buttons on page
     */
    private async discoverButtons(page: Page): Promise<DiscoveredButton[]> {
        return await page.evaluate(() => {
            const buttons: any[] = [];
            const btnElements = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');

            for (const btn of btnElements) {
                const text = btn.textContent?.trim() || (btn as HTMLInputElement).value || '';
                const type = (btn as HTMLButtonElement).type || 'button';
                
                // Infer business action
                const lowerText = text.toLowerCase();
                let businessAction: string | undefined;
                if (lowerText.includes('submit') || lowerText.includes('save')) businessAction = 'submit';
                else if (lowerText.includes('add to cart') || lowerText.includes('buy')) businessAction = 'purchase';
                else if (lowerText.includes('login') || lowerText.includes('sign in')) businessAction = 'login';
                else if (lowerText.includes('search')) businessAction = 'search';
                else if (lowerText.includes('delete') || lowerText.includes('remove')) businessAction = 'delete';
                else if (lowerText.includes('edit') || lowerText.includes('update')) businessAction = 'update';

                buttons.push({
                    text,
                    type,
                    onClick: btn.getAttribute('onclick'),
                    businessAction
                });
            }

            return buttons;
        });
    }

    /**
     * Discover inputs on page
     */
    private async discoverInputs(page: Page): Promise<DiscoveredInput[]> {
        return await page.evaluate(() => {
            const inputs: any[] = [];
            const inputElements = document.querySelectorAll('input:not([type="hidden"]), textarea, select');

            for (const inp of inputElements) {
                const input = inp as HTMLInputElement;
                const label = document.querySelector(`label[for="${input.id}"]`);

                inputs.push({
                    name: input.name || input.id || `input_${inputs.length}`,
                    type: input.type || 'text',
                    label: label?.textContent?.trim()
                });
            }

            return inputs;
        });
    }

    /**
     * Create cognitive anchors for important elements
     */
    private async createAnchors(
        page: Page,
        forms: DiscoveredForm[],
        buttons: DiscoveredButton[],
        inputs: DiscoveredInput[]
    ): Promise<string[]> {
        const anchorIds: string[] = [];

        // Create anchors for form submit buttons
        for (const form of forms) {
            try {
                const submitSelector = `form#${form.id} button[type="submit"], form#${form.id} input[type="submit"]`;
                const submitElement = await page.$(submitSelector);
                if (submitElement) {
                    const anchor = await this.neuralMap.createAnchor(
                        page,
                        submitElement,
                        `${form.purpose}_submit`,
                        form.purpose
                    );
                    anchorIds.push(anchor.id);
                }
            } catch {}
        }

        // Create anchors for action buttons
        for (const button of buttons.filter(b => b.businessAction)) {
            try {
                const btnSelector = `button:has-text("${button.text}"), [role="button"]:has-text("${button.text}")`;
                const btnElement = await page.$(btnSelector);
                if (btnElement) {
                    const anchor = await this.neuralMap.createAnchor(
                        page,
                        btnElement,
                        button.businessAction!,
                        button.businessAction
                    );
                    anchorIds.push(anchor.id);
                }
            } catch {}
        }

        return anchorIds;
    }

    /**
     * Setup network traffic capture
     */
    private setupNetworkCapture(page: Page, workerId: number): void {
        const apiCalls: ApiCall[] = [];
        const requestTimings = new Map<string, number>();

        page.on('request', (request: Request) => {
            const url = request.url();
            if (this.isApiRequest(url)) {
                requestTimings.set(url, Date.now());
            }
        });

        page.on('response', async (response: Response) => {
            const url = response.url();
            if (!this.isApiRequest(url)) return;

            const startTime = requestTimings.get(url) || Date.now();
            const request = response.request();

            try {
                const apiCall: ApiCall = {
                    id: `api_${crypto.randomBytes(4).toString('hex')}`,
                    method: request.method(),
                    url,
                    requestHeaders: request.headers(),
                    responseStatus: response.status(),
                    timestamp: startTime,
                    duration: Date.now() - startTime
                };

                // Try to get bodies
                try {
                    const postData = request.postData();
                    if (postData) {
                        apiCall.requestBody = JSON.parse(postData);
                    }
                } catch {}

                try {
                    if (response.headers()['content-type']?.includes('json')) {
                        apiCall.responseBody = await response.json();
                    }
                } catch {}

                apiCalls.push(apiCall);
                this.recordApiEndpoint(apiCall);

            } catch {}
        });

        // Store reference for the current page
        (page as any).__apiCalls = apiCalls;
    }

    /**
     * Record API endpoint for pattern analysis
     */
    private recordApiEndpoint(apiCall: ApiCall): void {
        if (!this.siteMap) return;

        // Normalize URL (remove query params for grouping)
        const urlObj = new URL(apiCall.url);
        const normalizedUrl = `${urlObj.origin}${urlObj.pathname}`;
        const key = `${apiCall.method}:${normalizedUrl}`;

        let endpoint = this.siteMap.apiEndpoints.get(key);
        if (!endpoint) {
            endpoint = {
                url: normalizedUrl,
                method: apiCall.method,
                usageCount: 0,
                avgResponseTime: 0,
                authentication: 'none'
            };
            this.siteMap.apiEndpoints.set(key, endpoint);
            this.siteMap.totalApiEndpoints++;
        }

        // Update stats
        endpoint.usageCount++;
        endpoint.avgResponseTime = 
            (endpoint.avgResponseTime * (endpoint.usageCount - 1) + apiCall.duration) / 
            endpoint.usageCount;

        // Detect authentication type
        if (apiCall.requestHeaders['authorization']?.startsWith('Bearer')) {
            endpoint.authentication = 'bearer';
        } else if (apiCall.requestHeaders['x-api-key']) {
            endpoint.authentication = 'api-key';
        } else if (apiCall.requestHeaders['cookie']) {
            endpoint.authentication = 'cookie';
        }
    }

    /**
     * Detect transaction flows from discovered data
     */
    private detectTransactionFlows(): void {
        if (!this.siteMap) return;

        const flows: TransactionFlow[] = [];

        // Detect login flow
        const loginForm = Array.from(this.siteMap.pages.values())
            .flatMap(p => p.forms)
            .find(f => f.purpose === 'login');

        if (loginForm) {
            flows.push({
                id: 'flow_login',
                name: 'User Login',
                startPage: loginForm.action,
                endPage: '/',  // Would need actual detection
                steps: [
                    { pageUrl: loginForm.action, action: 'fill', target: 'username', value: '{{username}}', apiCalls: [] },
                    { pageUrl: loginForm.action, action: 'fill', target: 'password', value: '{{password}}', apiCalls: [] },
                    { pageUrl: loginForm.action, action: 'submit', apiCalls: [] }
                ],
                apiSequence: [],
                businessPurpose: 'authentication'
            });
        }

        // Detect checkout flow
        const checkoutPages = Array.from(this.siteMap.pages.values())
            .filter(p => p.businessFunction === 'checkout' || p.pageType === 'checkout');

        if (checkoutPages.length > 0) {
            flows.push({
                id: 'flow_checkout',
                name: 'Checkout Process',
                startPage: checkoutPages[0].url,
                endPage: checkoutPages[checkoutPages.length - 1].url,
                steps: checkoutPages.map(p => ({
                    pageUrl: p.url,
                    action: 'navigate' as const,
                    apiCalls: p.apiCalls.map(a => a.id)
                })),
                apiSequence: checkoutPages.flatMap(p => p.apiCalls.map(a => a.id)),
                businessPurpose: 'purchase'
            });
        }

        this.siteMap.transactionFlows = flows;
    }

    /**
     * Identify authentication mechanism
     */
    private identifyAuthentication(): void {
        if (!this.siteMap) return;

        for (const page of this.siteMap.pages.values()) {
            const loginForm = page.forms.find(f => f.purpose === 'login');
            if (loginForm) {
                const usernameField = loginForm.fields.find(f => 
                    f.type === 'email' || f.name.includes('email') || 
                    f.name.includes('user') || f.autocomplete?.includes('username')
                );
                const passwordField = loginForm.fields.find(f => 
                    f.type === 'password' || f.autocomplete?.includes('password')
                );

                if (usernameField && passwordField) {
                    this.siteMap.authentication = {
                        loginUrl: page.url,
                        loginForm: loginForm.id,
                        usernameField: usernameField.name,
                        passwordField: passwordField.name,
                        submitButton: loginForm.submitButton || 'submit',
                        successIndicator: 'dashboard|home|profile'
                    };
                    break;
                }
            }
        }
    }

    /**
     * Analyze API patterns
     */
    private analyzeApiPatterns(): void {
        if (!this.siteMap) return;

        // Detect RESTful patterns
        for (const [key, endpoint] of this.siteMap.apiEndpoints) {
            // Detect CRUD operations
            const urlParts = endpoint.url.split('/').filter(Boolean);
            const lastPart = urlParts[urlParts.length - 1];

            if (/^\d+$/.test(lastPart) || /^[a-f0-9-]{36}$/.test(lastPart)) {
                // ID-based endpoint - likely detail/update/delete
                const resourceUrl = urlParts.slice(0, -1).join('/');
                logger.debug(`🤖 [EXPLORER] Detected resource: ${resourceUrl}`);
            }
        }
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    private initializeSiteMap(baseUrl: string): SiteMap {
        return {
            baseUrl,
            exploredAt: Date.now(),
            totalPages: 0,
            totalForms: 0,
            totalApiEndpoints: 0,
            pages: new Map(),
            forms: new Map(),
            apiEndpoints: new Map(),
            transactionFlows: [],
            authentication: null,
            userFlows: [],
            criticalPaths: []
        };
    }

    private isApiRequest(url: string): boolean {
        return url.includes('/api/') || 
               url.includes('/v1/') || 
               url.includes('/v2/') ||
               url.includes('.json') ||
               url.includes('/graphql');
    }

    private classifyPageType(
        forms: DiscoveredForm[],
        buttons: DiscoveredButton[],
        url: string
    ): DiscoveredPage['pageType'] {
        const urlLower = url.toLowerCase();

        if (forms.some(f => f.purpose === 'login')) return 'auth';
        if (forms.some(f => f.purpose === 'checkout')) return 'checkout';
        if (forms.length > 0) return 'form';
        if (urlLower.includes('dashboard') || urlLower.includes('admin')) return 'dashboard';
        if (urlLower.includes('list') || urlLower.includes('search')) return 'list';
        if (urlLower.match(/\/\d+$/) || urlLower.includes('/detail')) return 'detail';
        if (urlLower === '/' || urlLower.endsWith('/home')) return 'landing';

        return 'other';
    }

    private inferBusinessFunction(
        forms: DiscoveredForm[],
        buttons: DiscoveredButton[],
        title: string,
        url: string
    ): string | undefined {
        const text = (title + ' ' + url).toLowerCase();

        if (forms.some(f => f.purpose === 'login') || text.includes('login')) return 'login';
        if (forms.some(f => f.purpose === 'register') || text.includes('register')) return 'register';
        if (text.includes('checkout') || text.includes('cart')) return 'checkout';
        if (text.includes('search')) return 'search';
        if (text.includes('profile') || text.includes('account')) return 'profile';
        if (text.includes('dashboard')) return 'dashboard';

        return undefined;
    }

    private async takeScreenshot(page: Page, url: string): Promise<string> {
        const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 8);
        const filename = `screenshot_${hash}.png`;
        const filepath = path.join(this.config.outputDir, 'screenshots', filename);

        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        await page.screenshot({ path: filepath, fullPage: false });
        return filepath;
    }

    private async saveSiteMap(): Promise<void> {
        if (!this.siteMap) return;

        const dir = this.config.outputDir;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Convert Maps to objects for JSON serialization
        const serializable = {
            ...this.siteMap,
            pages: Object.fromEntries(this.siteMap.pages),
            forms: Object.fromEntries(this.siteMap.forms),
            apiEndpoints: Object.fromEntries(this.siteMap.apiEndpoints)
        };

        const filepath = path.join(dir, 'sitemap.json');
        fs.writeFileSync(filepath, JSON.stringify(serializable, null, 2));
        logger.debug(`🤖 [EXPLORER] Sitemap saved: ${filepath}`);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================================
// EXPORTS
// ============================================================
export function createExplorer(config?: Partial<ExplorerConfig>): AutonomousExplorer {
    return new AutonomousExplorer(config);
}

export { SiteMap, DiscoveredPage, DiscoveredForm, ApiCall, TransactionFlow };
