/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🧠 QANTUM HYBRID v26.0 - BasePage
 * Enterprise POM (Page Object Model) base class
 * Ported from: training-framework/architecture/pom-base.js
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import type { Page, BrowserContext, Response } from 'playwright';
import { BaseElement, LocatorStrategy, ElementOptions } from './BaseElement';
import { BaseComponent } from './BaseComponent';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PageOptions {
  baseUrl?: string;
  timeout?: number;
  waitForLoad?: boolean;
  loadStrategy?: 'load' | 'domcontentloaded' | 'networkidle';
}

export interface PageMetadata {
  name: string;
  url: string;
  description?: string;
  version?: string;
}

export interface ActionOptions {
  timeout?: number;
  retries?: number;
}

export type ActionFunction = (page: BasePage, params?: Record<string, unknown>) => Promise<void>;

export interface PageAction {
  name: string;
  description?: string;
  fn: ActionFunction;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASE PAGE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class BasePage extends EventEmitter {
  public page?: Page;
  public context?: BrowserContext;

  public elements: Map<string, BaseElement> = new Map();
  public components: Map<string, BaseComponent> = new Map();
  public actions: Map<string, PageAction> = new Map();

  public metadata: PageMetadata;
  public options: Required<PageOptions>;

  protected initialized: boolean = false;

  constructor(metadata: Partial<PageMetadata> = {}, options: PageOptions = {}) {
    super();

    this.metadata = {
      name: metadata.name ?? 'UnnamedPage',
      url: metadata.url ?? '/',
      description: metadata.description,
      version: metadata.version,
    };

    this.options = {
      baseUrl: options.baseUrl ?? '',
      timeout: options.timeout ?? 30000,
      waitForLoad: options.waitForLoad ?? true,
      loadStrategy: options.loadStrategy ?? 'domcontentloaded',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Set Playwright page instance
   */
  setPage(page: Page): this {
    this.page = page;
    this.context = page.context();

    // Update all elements with page reference
    for (const element of this.elements.values()) {
      element.setPage(page);
    }

    // Update all components with page reference
    for (const component of this.components.values()) {
      component.setPage(page);
    }

    this.initialized = true;
    this.emit('pageSet', { page, metadata: this.metadata });

    return this;
  }

  /**
   * Navigate to page URL
   */
  async navigate(path?: string): Promise<Response | null> {
    if (!this.page) {
      throw new Error('Page not set. Call setPage() first.');
    }

    const url = path ?? this.metadata.url;
    const fullUrl = this.options.baseUrl ? `${this.options.baseUrl}${url}` : url;

    this.emit('navigating', { url: fullUrl });

    const response = await this.page.goto(fullUrl, {
      timeout: this.options.timeout,
      waitUntil: this.options.loadStrategy,
    });

    if (this.options.waitForLoad) {
      await this.waitForLoad();
    }

    this.emit('navigated', { url: fullUrl, response });

    return response;
  }

  /**
   * Wait for page to load
   */
  async waitForLoad(): Promise<void> {
    if (!this.page) return;

    await this.page.waitForLoadState(this.options.loadStrategy);
    this.emit('loaded');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ELEMENT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Define an element on the page
   */
  element(name: string, locator: string | LocatorStrategy, options: ElementOptions = {}): BaseElement {
    const strategy: LocatorStrategy = typeof locator === 'string'
      ? { type: 'css', value: locator }
      : locator;

    const element = new BaseElement(strategy, {
      ...options,
      name,
    });

    if (this.page) {
      element.setPage(this.page);
    }

    this.elements.set(name, element);
    return element;
  }

  /**
   * Get element by name (shorthand)
   */
  $(name: string): BaseElement {
    const element = this.elements.get(name);
    if (!element) {
      throw new Error(`Element not found: ${name}. Available: ${Array.from(this.elements.keys()).join(', ')}`);
    }
    return element;
  }

  /**
   * Get element by name (alias)
   */
  getElement(name: string): BaseElement {
    return this.$(name);
  }

  /**
   * Check if element exists in definition
   */
  hasElement(name: string): boolean {
    return this.elements.has(name);
  }

  /**
   * Get all element names
   */
  getElementNames(): string[] {
    return Array.from(this.elements.keys());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPONENT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Define a component on the page
   */
  component<T extends BaseComponent>(
    name: string,
    ComponentClass: new (root: LocatorStrategy, options?: ElementOptions) => T,
    rootLocator: string | LocatorStrategy,
    options?: ElementOptions
  ): T {
    const strategy: LocatorStrategy = typeof rootLocator === 'string'
      ? { type: 'css', value: rootLocator }
      : rootLocator;

    const comp = new ComponentClass(strategy, { ...options, name });

    if (this.page) {
      comp.setPage(this.page);
    }

    this.components.set(name, comp);
    return comp;
  }

  /**
   * Get component by name
   */
  getComponent<T extends BaseComponent>(name: string): T {
    const comp = this.components.get(name);
    if (!comp) {
      throw new Error(`Component not found: ${name}. Available: ${Array.from(this.components.keys()).join(', ')}`);
    }
    return comp as T;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Define a page action
   */
  action(name: string, fn: ActionFunction, description?: string): this {
    this.actions.set(name, { name, fn, description });
    return this;
  }

  /**
   * Execute a page action
   */
  async execute(name: string, params?: Record<string, unknown>): Promise<void> {
    const action = this.actions.get(name);
    if (!action) {
      throw new Error(`Action not found: ${name}. Available: ${Array.from(this.actions.keys()).join(', ')}`);
    }

    this.emit('actionStart', { name, params });

    try {
      await action.fn(this, params);
      this.emit('actionComplete', { name, params });
    } catch (error) {
      this.emit('actionError', { name, params, error });
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get current URL
   */
  async getUrl(): Promise<string> {
    if (!this.page) throw new Error('Page not set');
    return this.page.url();
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    if (!this.page) throw new Error('Page not set');
    return await this.page.title();
  }

  /**
   * Take screenshot
   */
  async screenshot(options?: {
    path?: string;
    fullPage?: boolean;
    type?: 'png' | 'jpeg';
  }): Promise<Buffer> {
    if (!this.page) throw new Error('Page not set');
    return await this.page.screenshot(options);
  }

  /**
   * Execute script in page context
   */
  async evaluate<T>(script: string | ((arg?: unknown) => T), arg?: unknown): Promise<T> {
    if (!this.page) throw new Error('Page not set');
    return await this.page.evaluate(script, arg);
  }

  /**
   * Wait for network idle
   */
  async waitForNetworkIdle(timeout?: number): Promise<void> {
    if (!this.page) return;
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Wait for selector
   */
  async waitForSelector(selector: string, options?: { state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number }): Promise<void> {
    if (!this.page) return;
    await this.page.waitForSelector(selector, options as Parameters<typeof this.page.waitForSelector>[1]);
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation(options?: { url?: string | RegExp; timeout?: number }): Promise<void> {
    if (!this.page) return;
    await this.page.waitForURL(options?.url ?? '**/*', { timeout: options?.timeout });
  }

  /**
   * Reload page
   */
  async reload(): Promise<Response | null> {
    if (!this.page) throw new Error('Page not set');
    const response = await this.page.reload({
      timeout: this.options.timeout,
      waitUntil: this.options.loadStrategy,
    });
    await this.waitForLoad();
    return response;
  }

  /**
   * Go back
   */
  async goBack(): Promise<Response | null> {
    if (!this.page) throw new Error('Page not set');
    return await this.page.goBack({ timeout: this.options.timeout });
  }

  /**
   * Go forward
   */
  async goForward(): Promise<Response | null> {
    if (!this.page) throw new Error('Page not set');
    return await this.page.goForward({ timeout: this.options.timeout });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FRAME HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get frame by name or URL
   */
  frame(nameOrUrl: string | RegExp): BasePage | null {
    if (!this.page) return null;

    const frame = typeof nameOrUrl === 'string'
      ? this.page.frame(nameOrUrl)
      : this.page.frames().find(f => nameOrUrl.test(f.url()));

    if (!frame) return null;

    // Create new BasePage instance for frame
    const framePage = new BasePage({
      name: `Frame:${frame.name() || frame.url()}`,
      url: frame.url(),
    }, this.options);

    // Frames can't be directly set as Page, but we can access via locator
    // Return proxy that works with frame
    return framePage;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DIALOG HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handle dialogs
   */
  onDialog(handler: (dialog: { type: string; message: string; accept: (text?: string) => Promise<void>; dismiss: () => Promise<void> }) => void): void {
    if (!this.page) return;

    this.page.on('dialog', async (dialog) => {
      handler({
        type: dialog.type(),
        message: dialog.message(),
        accept: async (text?: string) => await dialog.accept(text),
        dismiss: async () => await dialog.dismiss(),
      });
    });
  }

  /**
   * Auto-accept dialogs
   */
  autoAcceptDialogs(): void {
    this.onDialog(async (dialog) => {
      await dialog.accept();
    });
  }

  /**
   * Auto-dismiss dialogs
   */
  autoDismissDialogs(): void {
    this.onDialog(async (dialog) => {
      await dialog.dismiss();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE INFO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get page state summary
   */
  getState(): {
    metadata: PageMetadata;
    initialized: boolean;
    elementCount: number;
    componentCount: number;
    actionCount: number;
    elements: string[];
    components: string[];
    actions: string[];
  } {
    return {
      metadata: this.metadata,
      initialized: this.initialized,
      elementCount: this.elements.size,
      componentCount: this.components.size,
      actionCount: this.actions.size,
      elements: Array.from(this.elements.keys()),
      components: Array.from(this.components.keys()),
      actions: Array.from(this.actions.keys()),
    };
  }

  /**
   * Get underlying Playwright page
   */
  getPlaywrightPage(): Page {
    if (!this.page) {
      throw new Error('Page not set');
    }
    return this.page;
  }
}

export default BasePage;
