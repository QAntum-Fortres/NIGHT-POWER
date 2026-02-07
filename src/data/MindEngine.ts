/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: CORE ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The heart of Mind-Engine - combining Playwright power with Data-Driven automation
 * Anti-detection, context isolation, fingerprint randomization
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0-QANTUM-PRIME
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import {
  chromium,
  firefox,
  webkit,
  Browser,
  BrowserContext,
  Page,
  BrowserType,
  LaunchOptions,
  BrowserContextOptions
} from 'playwright';
import { DataProvider, DataProviderConfig } from './DataProviders';
import { DatabaseHandler, Account, Proxy, Card } from './DatabaseHandler';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type BrowserName = 'chromium' | 'firefox' | 'webkit';

export interface FingerprintConfig {
  userAgent?: string;
  viewport?: { width: number; height: number };
  locale?: string;
  timezone?: string;
  geolocation?: { latitude: number; longitude: number };
  permissions?: string[];
  colorScheme?: 'light' | 'dark' | 'no-preference';
  reducedMotion?: 'reduce' | 'no-preference';
  forcedColors?: 'active' | 'none';
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  javaScriptEnabled?: boolean;
  extraHTTPHeaders?: Record<string, string>;
}

export interface AntiDetectionConfig {
  randomizeFingerprint?: boolean;
  spoofWebGL?: boolean;
  spoofCanvas?: boolean;
  spoofAudioContext?: boolean;
  maskAutomation?: boolean;
  humanizeActions?: boolean;
  humanDelayMs?: { min: number; max: number };
}

export interface MindEngineConfig {
  browser?: BrowserName;
  headless?: boolean;
  slowMo?: number;
  devtools?: boolean;
  
  // Data-driven config
  database?: DatabaseHandler;
  dataProvider?: DataProviderConfig;
  
  // Anti-detection
  antiDetection?: AntiDetectionConfig;
  fingerprint?: FingerprintConfig;
  
  // Proxy
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  
  // Recording
  recordVideo?: boolean;
  videoDir?: string;
  recordHar?: boolean;
  harPath?: string;
  
  // Screenshots
  screenshotOnError?: boolean;
  screenshotDir?: string;
  
  // Timeouts
  defaultTimeout?: number;
  navigationTimeout?: number;
  
  // Context options
  contextOptions?: BrowserContextOptions;
  launchOptions?: LaunchOptions;
}

export interface SessionState {
  cookies: any[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  origins: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINGERPRINT GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class FingerprintGenerator {
  private static USER_AGENTS = {
    windows: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
    ],
    mac: [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
    ],
    linux: [
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
    ]
  };

  private static VIEWPORTS = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 2560, height: 1440 }
  ];

  private static TIMEZONES = [
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai'
  ];

  private static LOCALES = [
    'en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'ja-JP', 'zh-CN'
  ];

  static generate(platform: 'windows' | 'mac' | 'linux' = 'windows'): FingerprintConfig {
    return {
      userAgent: this.randomFrom(this.USER_AGENTS[platform]),
      viewport: this.randomFrom(this.VIEWPORTS),
      timezone: this.randomFrom(this.TIMEZONES),
      locale: this.randomFrom(this.LOCALES),
      colorScheme: this.randomFrom(['light', 'dark'] as const),
      deviceScaleFactor: this.randomFrom([1, 1.25, 1.5, 2]),
      isMobile: false,
      hasTouch: false
    };
  }

  static generateMobile(): FingerprintConfig {
    const mobileUserAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    ];

    const mobileViewports = [
      { width: 390, height: 844 },  // iPhone 14
      { width: 412, height: 915 },  // Pixel 7
      { width: 360, height: 780 }   // Samsung Galaxy
    ];

    return {
      userAgent: this.randomFrom(mobileUserAgents),
      viewport: this.randomFrom(mobileViewports),
      timezone: this.randomFrom(this.TIMEZONES),
      locale: this.randomFrom(this.LOCALES),
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: this.randomFrom([2, 3])
    };
  }

  private static randomFrom<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANTI-DETECTION SCRIPTS
// ═══════════════════════════════════════════════════════════════════════════════

const STEALTH_SCRIPTS = {
  maskWebDriver: `
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });
    
    // Remove webdriver from navigator
    delete navigator.__proto__.webdriver;
  `,

  maskChrome: `
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    };
  `,

  maskPermissions: `
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  `,

  maskPlugins: `
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        const plugins = [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' }
        ];
        const pluginArray = Object.create(PluginArray.prototype);
        plugins.forEach((p, i) => {
          pluginArray[i] = p;
        });
        pluginArray.length = plugins.length;
        pluginArray.namedItem = (name) => plugins.find(p => p.name === name) || null;
        pluginArray.item = (i) => plugins[i] || null;
        pluginArray.refresh = () => {};
        return pluginArray;
      }
    });
  `,

  maskLanguages: `
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en', 'de']
    });
  `,

  spoofWebGL: `
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) {
        return 'Intel Inc.';
      }
      if (parameter === 37446) {
        return 'Intel Iris OpenGL Engine';
      }
      return getParameter.call(this, parameter);
    };
  `,

  spoofCanvas: `
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type) {
      if (type === 'image/png' && this.width === 16 && this.height === 16) {
        // Fingerprint canvas - add noise
        const ctx = this.getContext('2d');
        const imageData = ctx.getImageData(0, 0, this.width, this.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] += Math.floor(Math.random() * 5);
        }
        ctx.putImageData(imageData, 0, 0);
      }
      return originalToDataURL.apply(this, arguments);
    };
  `,

  humanizeConsole: `
    // Make console look more human
    console.debug = console.log;
    console.table = console.log;
  `
};

// ═══════════════════════════════════════════════════════════════════════════════
// MIND ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class MindEngine extends EventEmitter {
  private config: MindEngineConfig;
  private browserType: BrowserType;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private dataProvider: DataProvider | null = null;

  private currentAccount: Account | null = null;
  private currentProxy: Proxy | null = null;
  private currentCard: Card | null = null;
  private fingerprint: FingerprintConfig;
  private sessionId: string;

  constructor(config: MindEngineConfig = {}) {
    super();
    this.config = {
      browser: 'chromium',
      headless: false,
      slowMo: 0,
      devtools: false,
      antiDetection: {
        randomizeFingerprint: true,
        spoofWebGL: true,
        spoofCanvas: true,
        maskAutomation: true,
        humanizeActions: true,
        humanDelayMs: { min: 50, max: 200 }
      },
      screenshotOnError: true,
      screenshotDir: './screenshots',
      defaultTimeout: 30000,
      navigationTimeout: 60000,
      ...config
    };

    // Set browser type
    this.browserType = this.getBrowserType();

    // Generate session ID
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate fingerprint
    this.fingerprint = config.fingerprint || (
      this.config.antiDetection?.randomizeFingerprint
        ? FingerprintGenerator.generate()
        : {}
    );

    // Initialize data provider if database provided
    if (config.database) {
      this.dataProvider = new DataProvider({
        database: config.database,
        ...config.dataProvider
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  private getBrowserType(): BrowserType {
    switch (this.config.browser) {
      case 'firefox': return firefox;
      case 'webkit': return webkit;
      default: return chromium;
    }
  }

  /**
   * Initialize engine with data from database
   */
  async initWithData(): Promise<{
    account: Account;
    proxy: Proxy | null;
    card: Card | null;
  }> {
    if (!this.dataProvider) {
      throw new Error('DataProvider not configured. Pass database in config.');
    }

    // Get automation profile
    const profile = await this.dataProvider.getAutomationProfile();
    if (!profile) {
      throw new Error('No available account in database');
    }

    this.currentAccount = profile.account;
    this.currentProxy = profile.proxy;
    this.currentCard = profile.card;

    // Initialize with proxy if available
    const proxyConfig = this.currentProxy
      ? this.dataProvider.proxies.getPlaywrightConfig()
      : undefined;

    await this.init(proxyConfig || undefined);

    this.emit('engine:init_with_data', {
      account: this.currentAccount.email,
      proxy: this.currentProxy?.host,
      card: this.currentCard ? '****' + this.currentCard.card_number.slice(-4) : null
    });

    return {
      account: this.currentAccount,
      proxy: this.currentProxy,
      card: this.currentCard
    };
  }

  /**
   * Initialize browser with optional proxy
   */
  async init(proxy?: { server: string; username?: string; password?: string }): Promise<void> {
    // Merge proxy config
    const proxyConfig = proxy || this.config.proxy;

    // Build launch options
    const launchOptions: LaunchOptions = {
      headless: this.config.headless,
      slowMo: this.config.slowMo,
      devtools: this.config.devtools,
      ...this.config.launchOptions
    };

    if (proxyConfig) {
      launchOptions.proxy = proxyConfig;
    }

    // Launch browser
    this.browser = await this.browserType.launch(launchOptions);
    this.emit('browser:launched', { browser: this.config.browser });

    // Create context with fingerprint
    await this.createContext();
  }

  /**
   * Create browser context with anti-detection
   */
  private async createContext(): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');

    // Build context options
    const contextOptions: BrowserContextOptions = {
      ...this.fingerprint,
      ...this.config.contextOptions
    };

    // Add video recording
    if (this.config.recordVideo) {
      contextOptions.recordVideo = {
        dir: this.config.videoDir || './videos',
        size: this.fingerprint.viewport || { width: 1280, height: 720 }
      };
    }

    // Add HAR recording
    if (this.config.recordHar) {
      contextOptions.recordHar = {
        path: this.config.harPath || `./har/${this.sessionId}.har`
      };
    }

    // Create context
    this.context = await this.browser.newContext(contextOptions);

    // Set timeouts
    this.context.setDefaultTimeout(this.config.defaultTimeout || 30000);
    this.context.setDefaultNavigationTimeout(this.config.navigationTimeout || 60000);

    // Apply anti-detection scripts
    await this.applyAntiDetection();

    // Create page
    this.page = await this.context.newPage();
    this.emit('context:created', { sessionId: this.sessionId });
  }

  /**
   * Apply anti-detection scripts to context
   */
  private async applyAntiDetection(): Promise<void> {
    if (!this.context) return;

    const antiConfig = this.config.antiDetection;
    if (!antiConfig) return;

    const scripts: string[] = [];

    if (antiConfig.maskAutomation) {
      scripts.push(STEALTH_SCRIPTS.maskWebDriver);
      scripts.push(STEALTH_SCRIPTS.maskChrome);
      scripts.push(STEALTH_SCRIPTS.maskPermissions);
      scripts.push(STEALTH_SCRIPTS.maskPlugins);
      scripts.push(STEALTH_SCRIPTS.maskLanguages);
    }

    if (antiConfig.spoofWebGL) {
      scripts.push(STEALTH_SCRIPTS.spoofWebGL);
    }

    if (antiConfig.spoofCanvas) {
      scripts.push(STEALTH_SCRIPTS.spoofCanvas);
    }

    scripts.push(STEALTH_SCRIPTS.humanizeConsole);

    // Add init script that runs before each page load
    await this.context.addInitScript(scripts.join('\n'));

    this.emit('antidetection:applied', { 
      scripts: scripts.length,
      features: Object.keys(antiConfig).filter(k => (antiConfig as any)[k])
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Navigate to URL
   */
  async goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    await this.humanDelay();
    await this.page.goto(url, { 
      waitUntil: options?.waitUntil || 'domcontentloaded' 
    });

    this.emit('page:navigated', { url });
  }

  /**
   * Click element with human-like behavior
   */
  async click(selector: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    await this.humanDelay();
    
    const element = await this.page.locator(selector).first();
    
    if (this.config.antiDetection?.humanizeActions) {
      // Move to element before clicking
      await element.hover();
      await this.humanDelay('short');
    }

    await element.click();
    this.emit('element:clicked', { selector });
  }

  /**
   * Type text with human-like delays
   */
  async type(selector: string, text: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    await this.humanDelay();
    
    const element = await this.page.locator(selector).first();
    await element.click();

    if (this.config.antiDetection?.humanizeActions) {
      // Type character by character with delays
      for (const char of text) {
        await element.pressSequentially(char, {
          delay: Math.random() * 100 + 30
        });
      }
    } else {
      await element.fill(text);
    }

    this.emit('element:typed', { selector, length: text.length });
  }

  /**
   * Fill form field (faster than type)
   */
  async fill(selector: string, value: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    await this.humanDelay('short');
    await this.page.locator(selector).first().fill(value);
    this.emit('element:filled', { selector });
  }

  /**
   * Wait for element
   */
  async waitFor(selector: string, options?: { timeout?: number; state?: 'visible' | 'hidden' | 'attached' }): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.locator(selector).first().waitFor({
      timeout: options?.timeout || this.config.defaultTimeout,
      state: options?.state || 'visible'
    });
  }

  /**
   * Check if element exists
   */
  async exists(selector: string): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');
    return (await this.page.locator(selector).count()) > 0;
  }

  /**
   * Get text content
   */
  async getText(selector: string): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');
    return (await this.page.locator(selector).first().textContent()) || '';
  }

  /**
   * Get attribute value
   */
  async getAttribute(selector: string, name: string): Promise<string | null> {
    if (!this.page) throw new Error('Page not initialized');
    return this.page.locator(selector).first().getAttribute(name);
  }

  /**
   * Take screenshot
   */
  async screenshot(name?: string): Promise<Buffer> {
    if (!this.page) throw new Error('Page not initialized');

    const fileName = name || `screenshot_${Date.now()}.png`;
    const path = `${this.config.screenshotDir}/${fileName}`;

    const buffer = await this.page.screenshot({ path, fullPage: true });
    this.emit('screenshot:taken', { path });
    return buffer;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA-DRIVEN HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Fill form with current account data
   */
  async fillAccountData(mapping: {
    email?: string;
    password?: string;
    username?: string;
    phone?: string;
    [key: string]: string | undefined;
  }): Promise<void> {
    if (!this.currentAccount) {
      throw new Error('No current account. Call initWithData() first.');
    }

    for (const [field, selector] of Object.entries(mapping)) {
      if (!selector) continue;

      const value = (this.currentAccount as any)[field];
      if (value) {
        await this.fill(selector, value);
      }
    }

    this.emit('account:data_filled', { email: this.currentAccount.email });
  }

  /**
   * Fill form with current card data
   */
  async fillCardData(mapping: {
    number?: string;
    holder?: string;
    expiry?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvv?: string;
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
  }): Promise<void> {
    if (!this.currentCard) {
      throw new Error('No current card. Call initWithData() first.');
    }

    const fieldMap: Record<string, string> = {
      number: this.currentCard.card_number,
      holder: this.currentCard.holder_name,
      expiryMonth: this.currentCard.expiry_month,
      expiryYear: this.currentCard.expiry_year,
      expiry: `${this.currentCard.expiry_month}/${this.currentCard.expiry_year}`,
      cvv: this.currentCard.cvv,
      address: this.currentCard.billing_address || '',
      city: this.currentCard.billing_city || '',
      zip: this.currentCard.billing_zip || '',
      country: this.currentCard.billing_country || ''
    };

    for (const [field, selector] of Object.entries(mapping)) {
      if (!selector) continue;

      const value = fieldMap[field];
      if (value) {
        await this.fill(selector, value);
      }
    }

    this.emit('card:data_filled', { last4: this.currentCard.card_number.slice(-4) });
  }

  /**
   * Get current account
   */
  getAccount(): Account | null {
    return this.currentAccount;
  }

  /**
   * Get current card
   */
  getCard(): Card | null {
    return this.currentCard;
  }

  /**
   * Get current proxy
   */
  getProxy(): Proxy | null {
    return this.currentProxy;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Save session state
   */
  async saveSession(): Promise<SessionState> {
    if (!this.context || !this.page) {
      throw new Error('Context not initialized');
    }

    const cookies = await this.context.cookies();
    
    const storage = await this.page.evaluate(() => ({
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage }
    }));

    const state: SessionState = {
      cookies,
      localStorage: storage.localStorage,
      sessionStorage: storage.sessionStorage,
      origins: [new URL(this.page.url()).origin]
    };

    this.emit('session:saved', { cookies: cookies.length });
    return state;
  }

  /**
   * Restore session state
   */
  async restoreSession(state: SessionState): Promise<void> {
    if (!this.context || !this.page) {
      throw new Error('Context not initialized');
    }

    // Restore cookies
    await this.context.addCookies(state.cookies);

    // Restore storage (requires navigating to origin first)
    for (const origin of state.origins) {
      await this.page.goto(origin);
      await this.page.evaluate((storage) => {
        for (const [key, value] of Object.entries(storage.localStorage)) {
          localStorage.setItem(key, value);
        }
        for (const [key, value] of Object.entries(storage.sessionStorage)) {
          sessionStorage.setItem(key, value);
        }
      }, state);
    }

    this.emit('session:restored', { cookies: state.cookies.length });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HUMAN-LIKE BEHAVIOR
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add human-like delay
   */
  private async humanDelay(type: 'short' | 'normal' | 'long' = 'normal'): Promise<void> {
    if (!this.config.antiDetection?.humanizeActions) return;

    const delays = {
      short: { min: 30, max: 100 },
      normal: this.config.antiDetection.humanDelayMs || { min: 50, max: 200 },
      long: { min: 200, max: 500 }
    };

    const { min, max } = delays[type];
    const delay = Math.random() * (max - min) + min;
    await this.sleep(delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Scroll page with human-like behavior
   */
  async scroll(direction: 'up' | 'down' | 'top' | 'bottom', amount?: number): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    await this.humanDelay();

    switch (direction) {
      case 'down':
        await this.page.evaluate((px) => window.scrollBy(0, px), amount || 300);
        break;
      case 'up':
        await this.page.evaluate((px) => window.scrollBy(0, -px), amount || 300);
        break;
      case 'top':
        await this.page.evaluate(() => window.scrollTo(0, 0));
        break;
      case 'bottom':
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        break;
    }
  }

  /**
   * Random mouse movement
   */
  async randomMouseMove(): Promise<void> {
    if (!this.page) return;

    const viewport = this.fingerprint.viewport || { width: 1280, height: 720 };
    const x = Math.random() * viewport.width;
    const y = Math.random() * viewport.height;

    await this.page.mouse.move(x, y, { steps: Math.floor(Math.random() * 10) + 5 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLETION & CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Mark automation as successful
   */
  async markSuccess(): Promise<void> {
    if (this.dataProvider) {
      await this.dataProvider.markProfileSuccess();
    }
    this.emit('automation:success', { account: this.currentAccount?.email });
  }

  /**
   * Mark automation as failed
   */
  async markFailed(error?: string): Promise<void> {
    // Take screenshot on error if enabled
    if (this.config.screenshotOnError && this.page) {
      try {
        await this.screenshot(`error_${Date.now()}.png`);
      } catch (e) {
        // Ignore screenshot errors
      }
    }

    if (this.dataProvider) {
      await this.dataProvider.markProfileFailed(error);
    }

    this.emit('automation:failed', { account: this.currentAccount?.email, error });
  }

  /**
   * Close browser and cleanup
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    this.page = null;
    this.currentAccount = null;
    this.currentProxy = null;
    this.currentCard = null;

    this.emit('engine:closed', { sessionId: this.sessionId });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RAW ACCESS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get raw Playwright page
   */
  getPage(): Page {
    if (!this.page) throw new Error('Page not initialized');
    return this.page;
  }

  /**
   * Get raw Playwright context
   */
  getContext(): BrowserContext {
    if (!this.context) throw new Error('Context not initialized');
    return this.context;
  }

  /**
   * Get raw Playwright browser
   */
  getBrowser(): Browser {
    if (!this.browser) throw new Error('Browser not initialized');
    return this.browser;
  }

  /**
   * Get data provider
   */
  getData(): DataProvider {
    if (!this.dataProvider) throw new Error('DataProvider not configured');
    return this.dataProvider;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

export default MindEngine;
