/**
 * 🧠 QANTUM HYBRID - Main Class
 * Унифициран API: mm.visit().click().type().should()
 */

import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright';
import { MMConfig, DEFAULT_CONFIG, BrowserType, InterceptConfig } from '../types/index.js';
import { SelfHealingEngine } from './self-healing.js';
import { DeepSearchEngine } from './deep-search.js';
import { NetworkInterceptor } from './network-interceptor.js';
import { FluentChain } from './fluent-chain.js';

export class QAntum {
  private config: MMConfig;
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;
  
  // Core engines
  private selfHealer: SelfHealingEngine;
  private deepSearch: DeepSearchEngine;
  private networkInterceptor: NetworkInterceptor;

  constructor(config: Partial<MMConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.selfHealer = new SelfHealingEngine();
    this.deepSearch = new DeepSearchEngine();
    this.networkInterceptor = new NetworkInterceptor();
  }

  // ============== BROWSER LIFECYCLE ==============

  /**
   * Стартирай браузър
   */
  async launch(): Promise<QAntum> {
    const browserType = this.getBrowserType();
    
    this.browser = await browserType.launch({
      headless: this.config.browser.headless,
      slowMo: this.config.browser.slowMo
    });

    // Нов контекст за изолация (като Cypress)
    this.context = await this.browser.newContext({
      viewport: this.config.browser.viewport,
      baseURL: this.config.baseUrl
    });

    this.page = await this.context.newPage();
    
    // Инициализирай network interceptor
    await this.networkInterceptor.init(this.page);

    // Включи tracing ако е конфигурирано
    if (this.config.reporting.traces) {
      await this.context.tracing.start({ 
        screenshots: true, 
        snapshots: true 
      });
    }

    return this;
  }

  /**
   * Затвори браузър
   */
  async close(): Promise<void> {
    if (this.config.reporting.traces && this.context) {
      await this.context.tracing.stop({ 
        path: `traces/trace-${Date.now()}.zip` 
      });
    }
    
    await this.context?.close();
    await this.browser?.close();
  }

  /**
   * Вземи правилния браузър тип
   */
  private getBrowserType() {
    const browsers: Record<BrowserType, typeof chromium> = {
      chromium,
      firefox,
      webkit
    };
    return browsers[this.config.browser.browser];
  }

  // ============== NAVIGATION ==============

  /**
   * Отиди на URL
   */
  async visit(url: string): Promise<QAntum> {
    this.ensurePage();
    await this.page!.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: this.config.browser.timeout 
    });
    return this;
  }

  /**
   * Презареди страницата
   */
  async reload(): Promise<QAntum> {
    this.ensurePage();
    await this.page!.reload();
    return this;
  }

  /**
   * Назад
   */
  async goBack(): Promise<QAntum> {
    this.ensurePage();
    await this.page!.goBack();
    return this;
  }

  /**
   * Напред
   */
  async goForward(): Promise<QAntum> {
    this.ensurePage();
    await this.page!.goForward();
    return this;
  }

  // ============== ELEMENT SELECTION (Fluent API) ==============

  /**
   * Избери елемент (връща FluentChain за chaining)
   */
  get(selector: string): FluentChain {
    this.ensurePage();
    return new FluentChain(
      this.page!, 
      this.selfHealer, 
      this.deepSearch,
      this.config.browser.timeout
    ).get(selector);
  }

  /**
   * Намери елемент с Deep Search
   */
  async find(selector: string): Promise<FluentChain> {
    this.ensurePage();
    const chain = new FluentChain(
      this.page!, 
      this.selfHealer, 
      this.deepSearch,
      this.config.browser.timeout
    );
    return await chain.find(selector);
  }

  /**
   * Селектори по различни стратегии
   */
  getByTestId(testId: string): FluentChain {
    return this.get(`[data-testid="${testId}"]`);
  }

  getByText(text: string): FluentChain {
    return this.get(`text="${text}"`);
  }

  getByRole(role: string, options?: { name?: string }): FluentChain {
    this.ensurePage();
    const chain = new FluentChain(
      this.page!, 
      this.selfHealer, 
      this.deepSearch,
      this.config.browser.timeout
    );
    // @ts-ignore
    chain['currentLocator'] = this.page!.getByRole(role as any, options);
    return chain;
  }

  getByPlaceholder(placeholder: string): FluentChain {
    return this.get(`[placeholder="${placeholder}"]`);
  }

  getByLabel(label: string): FluentChain {
    this.ensurePage();
    const chain = new FluentChain(
      this.page!, 
      this.selfHealer, 
      this.deepSearch,
      this.config.browser.timeout
    );
    // @ts-ignore
    chain['currentLocator'] = this.page!.getByLabel(label);
    return chain;
  }

  // ============== QUICK ACTIONS (Direct, no chaining) ==============

  /**
   * Бърз клик
   */
  async click(selector: string): Promise<QAntum> {
    await this.get(selector).click();
    return this;
  }

  /**
   * Бързо въвеждане
   */
  async type(selector: string, text: string): Promise<QAntum> {
    await this.get(selector).type(text);
    return this;
  }

  /**
   * Изчакай елемент
   */
  async waitFor(selector: string, timeout?: number): Promise<QAntum> {
    this.ensurePage();
    await this.page!.waitForSelector(selector, { 
      timeout: timeout || this.config.browser.timeout 
    });
    return this;
  }

  /**
   * Изчакай URL
   */
  async waitForUrl(url: string | RegExp): Promise<QAntum> {
    this.ensurePage();
    await this.page!.waitForURL(url);
    return this;
  }

  /**
   * Изчакай навигация
   */
  async waitForNavigation(): Promise<QAntum> {
    this.ensurePage();
    await this.page!.waitForLoadState('domcontentloaded');
    return this;
  }

  // ============== NETWORK (Cypress-style) ==============

  /**
   * Интерцептирай заявка
   */
  async intercept(config: InterceptConfig): Promise<QAntum> {
    await this.networkInterceptor.intercept(config);
    return this;
  }

  /**
   * Stub API response
   */
  async stub(url: string | RegExp, body: unknown, status = 200): Promise<QAntum> {
    await this.networkInterceptor.stub(url, body, status);
    return this;
  }

  /**
   * Изчакай заявка
   */
  async waitForRequest(url: string | RegExp): Promise<QAntum> {
    await this.networkInterceptor.waitForRequest(url);
    return this;
  }

  // ============== SCREENSHOTS & TRACES ==============

  /**
   * Направи screenshot
   */
  async screenshot(name?: string): Promise<string> {
    this.ensurePage();
    const path = `screenshots/${name || `screenshot-${Date.now()}`}.png`;
    await this.page!.screenshot({ path, fullPage: true });
    return path;
  }

  /**
   * Вземи HTML на страницата
   */
  async getHtml(): Promise<string> {
    this.ensurePage();
    return await this.page!.content();
  }

  /**
   * Вземи заглавие
   */
  async getTitle(): Promise<string> {
    this.ensurePage();
    return await this.page!.title();
  }

  /**
   * Вземи URL
   */
  getUrl(): string {
    this.ensurePage();
    return this.page!.url();
  }

  // ============== UTILITIES ==============

  /**
   * Изпълни JavaScript
   */
  async evaluate<T>(fn: () => T): Promise<T> {
    this.ensurePage();
    return await this.page!.evaluate(fn);
  }

  /**
   * Пауза (за дебъгване)
   */
  async pause(ms: number): Promise<QAntum> {
    await new Promise(resolve => setTimeout(resolve, ms));
    return this;
  }

  /**
   * Директен достъп до Page
   */
  getPage(): Page {
    this.ensurePage();
    return this.page!;
  }

  /**
   * Директен достъп до Context
   */
  getContext(): BrowserContext {
    if (!this.context) throw new Error('Browser not launched');
    return this.context;
  }

  /**
   * Осигури че има страница
   */
  private ensurePage(): void {
    if (!this.page) {
      throw new Error('Browser not launched. Call mm.launch() first.');
    }
  }
}

// ============== FACTORY FUNCTION ==============

/**
 * Създай нова инстанция на QANTUM
 */
export function createQA(config?: Partial<MMConfig>): QAntum {
  return new QAntum(config);
}

// Default export
export default QAntum;
