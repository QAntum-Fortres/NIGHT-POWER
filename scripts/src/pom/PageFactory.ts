/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🧠 QANTUM HYBRID v1.0.0 - PageFactory
 * Page Object factory and registry
 * Ported from: training-framework/architecture/pom-base.js
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { Page, Browser, BrowserContext } from 'playwright';
import { BasePage, PageOptions, PageMetadata } from './BasePage';
import { BaseElement, LocatorStrategy, ElementOptions } from './BaseElement';
import { BaseComponent, ComponentOptions } from './BaseComponent';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PageDefinition {
  name: string;
  url?: string;
  options?: PageOptions;
  elements?: Record<string, string | LocatorStrategy | { locator: string | LocatorStrategy; options?: ElementOptions }>;
  components?: Record<string, {
    type: string;
    root: string | LocatorStrategy;
    options?: ComponentOptions;
  }>;
  actions?: Record<string, (page: BasePage, params?: Record<string, unknown>) => Promise<void>>;
  setup?: (page: BasePage) => void | Promise<void>;
}

export interface PageFactoryOptions {
  baseUrl?: string;
  defaultTimeout?: number;
  autoSetup?: boolean;
}

type PageClass<T extends BasePage> = new (metadata?: Partial<PageMetadata>, options?: PageOptions) => T;
type ComponentClass<T extends BaseComponent> = new (root: LocatorStrategy, options?: ComponentOptions) => T;

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export class PageFactory {
  private static instance: PageFactory;
  
  private pages: Map<string, PageClass<BasePage>> = new Map();
  private pageInstances: Map<string, BasePage> = new Map();
  private definitions: Map<string, PageDefinition> = new Map();
  private components: Map<string, ComponentClass<BaseComponent>> = new Map();
  
  private options: Required<PageFactoryOptions>;
  private currentPage?: Page;
  private currentContext?: BrowserContext;

  private constructor(options: PageFactoryOptions = {}) {
    this.options = {
      baseUrl: options.baseUrl ?? '',
      defaultTimeout: options.defaultTimeout ?? 30000,
      autoSetup: options.autoSetup ?? true,
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(options?: PageFactoryOptions): PageFactory {
    if (!PageFactory.instance) {
      PageFactory.instance = new PageFactory(options);
    }
    return PageFactory.instance;
  }

  /**
   * Reset factory (for testing)
   */
  static reset(): void {
    PageFactory.instance = undefined as any;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTRATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Register a page class
   */
  register<T extends BasePage>(name: string, PageClass: PageClass<T>): this {
    this.pages.set(name, PageClass as PageClass<BasePage>);
    return this;
  }

  /**
   * Register page from definition (JSON/object)
   */
  registerDefinition(definition: PageDefinition): this {
    this.definitions.set(definition.name, definition);
    return this;
  }

  /**
   * Register multiple definitions
   */
  registerDefinitions(definitions: PageDefinition[]): this {
    for (const def of definitions) {
      this.registerDefinition(def);
    }
    return this;
  }

  /**
   * Register a component class
   */
  registerComponent<T extends BaseComponent>(name: string, ComponentClass: ComponentClass<T>): this {
    this.components.set(name, ComponentClass as ComponentClass<BaseComponent>);
    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE CREATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get or create page instance
   */
  get<T extends BasePage>(name: string): T {
    // Check if already instantiated
    let instance = this.pageInstances.get(name);
    
    if (!instance) {
      instance = this.create<T>(name);
      this.pageInstances.set(name, instance);
    }

    // Update with current page if available
    if (this.currentPage) {
      instance.setPage(this.currentPage);
    }

    return instance as T;
  }

  /**
   * Create new page instance (always new)
   */
  create<T extends BasePage>(name: string): T {
    // Try registered class first
    const PageClass = this.pages.get(name);
    if (PageClass) {
      const instance = new PageClass(
        { name },
        { baseUrl: this.options.baseUrl, timeout: this.options.defaultTimeout }
      );
      
      if (this.currentPage) {
        instance.setPage(this.currentPage);
      }
      
      return instance as T;
    }

    // Try definition
    const definition = this.definitions.get(name);
    if (definition) {
      return this.createFromDefinition<T>(definition);
    }

    throw new Error(`Page not registered: ${name}. Available: ${this.getRegisteredPages().join(', ')}`);
  }

  /**
   * Create page from definition
   */
  createFromDefinition<T extends BasePage>(definition: PageDefinition): T {
    const page = new BasePage(
      { name: definition.name, url: definition.url ?? '/' },
      { 
        ...definition.options,
        baseUrl: definition.options?.baseUrl ?? this.options.baseUrl,
        timeout: definition.options?.timeout ?? this.options.defaultTimeout,
      }
    );

    // Add elements
    if (definition.elements) {
      for (const [name, config] of Object.entries(definition.elements)) {
        if (typeof config === 'string') {
          page.element(name, config);
        } else if ('locator' in config) {
          page.element(name, config.locator, config.options);
        } else {
          page.element(name, config);
        }
      }
    }

    // Add components
    if (definition.components) {
      for (const [name, config] of Object.entries(definition.components)) {
        const ComponentClass = this.components.get(config.type);
        if (ComponentClass) {
          const locator: LocatorStrategy = typeof config.root === 'string'
            ? { type: 'css', value: config.root }
            : config.root;
          page.component(name, ComponentClass, locator, config.options);
        }
      }
    }

    // Add actions
    if (definition.actions) {
      for (const [name, fn] of Object.entries(definition.actions)) {
        page.action(name, fn);
      }
    }

    // Run setup
    if (definition.setup && this.options.autoSetup) {
      definition.setup(page);
    }

    // Set current page
    if (this.currentPage) {
      page.setPage(this.currentPage);
    }

    return page as T;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAYWRIGHT INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Set current Playwright page
   */
  setPage(page: Page): this {
    this.currentPage = page;
    this.currentContext = page.context();

    // Update all existing instances
    for (const instance of this.pageInstances.values()) {
      instance.setPage(page);
    }

    return this;
  }

  /**
   * Get current Playwright page
   */
  getPlaywrightPage(): Page | undefined {
    return this.currentPage;
  }

  /**
   * Set browser context
   */
  setContext(context: BrowserContext): this {
    this.currentContext = context;
    return this;
  }

  /**
   * Create new page in context
   */
  async newPage(): Promise<Page> {
    if (!this.currentContext) {
      throw new Error('Browser context not set. Call setContext() first.');
    }
    
    const page = await this.currentContext.newPage();
    this.setPage(page);
    return page;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get all registered page names
   */
  getRegisteredPages(): string[] {
    return [
      ...this.pages.keys(),
      ...this.definitions.keys(),
    ];
  }

  /**
   * Get all registered component names
   */
  getRegisteredComponents(): string[] {
    return [...this.components.keys()];
  }

  /**
   * Check if page is registered
   */
  hasPage(name: string): boolean {
    return this.pages.has(name) || this.definitions.has(name);
  }

  /**
   * Check if component is registered
   */
  hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  /**
   * Clear all page instances (keeps registrations)
   */
  clearInstances(): this {
    this.pageInstances.clear();
    return this;
  }

  /**
   * Clear everything
   */
  clear(): this {
    this.pages.clear();
    this.pageInstances.clear();
    this.definitions.clear();
    this.components.clear();
    return this;
  }

  /**
   * Update factory options
   */
  configure(options: Partial<PageFactoryOptions>): this {
    Object.assign(this.options, options);
    return this;
  }

  /**
   * Get factory state
   */
  getState(): {
    pageCount: number;
    definitionCount: number;
    componentCount: number;
    instanceCount: number;
    pages: string[];
    definitions: string[];
    components: string[];
    hasCurrentPage: boolean;
  } {
    return {
      pageCount: this.pages.size,
      definitionCount: this.definitions.size,
      componentCount: this.components.size,
      instanceCount: this.pageInstances.size,
      pages: [...this.pages.keys()],
      definitions: [...this.definitions.keys()],
      components: [...this.components.keys()],
      hasCurrentPage: !!this.currentPage,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get factory instance (shorthand)
 */
export function getFactory(options?: PageFactoryOptions): PageFactory {
  return PageFactory.getInstance(options);
}

/**
 * Get page from factory (shorthand)
 */
export function getPage<T extends BasePage>(name: string): T {
  return getFactory().get<T>(name);
}

/**
 * Register page definition (shorthand)
 */
export function definePage(definition: PageDefinition): void {
  getFactory().registerDefinition(definition);
}

/**
 * Define multiple pages from JSON
 */
export function definePages(definitions: PageDefinition[]): void {
  getFactory().registerDefinitions(definitions);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE DECORATOR (for TypeScript classes)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Decorator to auto-register page class
 */
export function RegisterPage(name: string): ClassDecorator {
  return function <T extends Function>(target: T): T {
    getFactory().register(name, target as unknown as PageClass<BasePage>);
    return target;
  };
}

/**
 * Decorator to auto-register component class
 */
export function RegisterComponent(name: string): ClassDecorator {
  return function <T extends Function>(target: T): T {
    getFactory().registerComponent(name, target as unknown as ComponentClass<BaseComponent>);
    return target;
  };
}

export default PageFactory;
