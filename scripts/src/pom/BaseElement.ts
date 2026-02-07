/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🧠 QANTUM HYBRID v1.0.0 - BaseElement
 * Enterprise-grade element with self-healing capabilities
 * Ported from: training-framework/architecture/pom-base.js
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import type { Page, Locator } from 'playwright';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface LocatorStrategy {
  type: 'css' | 'xpath' | 'id' | 'name' | 'testId' | 'text' | 'role' | 'label' | 'custom';
  value: string;
  priority?: number;
  options?: Record<string, unknown>;
}

export interface ElementOptions {
  timeout?: number;
  retries?: number;
  waitBetweenRetries?: number;
  selfHealing?: boolean;
  cacheEnabled?: boolean;
  name?: string;
  type?: string;
  description?: string;
}

export interface ElementMetadata {
  name: string;
  type: string;
  description: string;
  createdAt: number;
}

export interface ElementState {
  lastInteraction: InteractionRecord | null;
  interactionCount: number;
  errors: ErrorRecord[];
  healingHistory: HealingRecord[];
}

export interface InteractionRecord {
  type: string;
  timestamp: number;
  details?: Record<string, unknown>;
}

export interface ErrorRecord {
  timestamp: number;
  attempt: number;
  error: string;
}

export interface HealingRecord {
  timestamp: number;
  originalLocator: LocatorStrategy;
  usedLocator: LocatorStrategy;
  successful: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASE ELEMENT CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class BaseElement extends EventEmitter {
  public locator: LocatorStrategy;
  public options: Required<ElementOptions>;
  public alternativeLocators: Array<{ locator: LocatorStrategy; priority: number }>;
  public metadata: ElementMetadata;
  public state: ElementState;

  private page?: Page;
  private cachedLocator?: Locator;

  constructor(locator: LocatorStrategy, options: ElementOptions = {}) {
    super();

    this.locator = locator;
    this.options = {
      timeout: options.timeout ?? 30000,
      retries: options.retries ?? 3,
      waitBetweenRetries: options.waitBetweenRetries ?? 500,
      selfHealing: options.selfHealing ?? true,
      cacheEnabled: options.cacheEnabled ?? true,
      name: options.name ?? 'unnamed',
      type: options.type ?? 'generic',
      description: options.description ?? '',
    };

    this.alternativeLocators = [];
    this.metadata = {
      name: this.options.name,
      type: this.options.type,
      description: this.options.description,
      createdAt: Date.now(),
    };

    this.state = {
      lastInteraction: null,
      interactionCount: 0,
      errors: [],
      healingHistory: [],
    };
  }

  /**
   * Set page context
   */
  setPage(page: Page): this {
    this.page = page;
    this.cachedLocator = undefined;
    return this;
  }

  /**
   * Add alternative locator for self-healing
   */
  addAlternative(locator: LocatorStrategy, priority = 0): this {
    this.alternativeLocators.push({ locator, priority });
    this.alternativeLocators.sort((a, b) => b.priority - a.priority);
    return this;
  }

  /**
   * Get all locators (primary + alternatives)
   */
  getAllLocators(): Array<{ locator: LocatorStrategy; priority: number }> {
    return [
      { locator: this.locator, priority: 100 },
      ...this.alternativeLocators,
    ];
  }

  /**
   * Find element with self-healing
   */
  async find(): Promise<Locator> {
    if (!this.page) {
      throw new Error('Page not set. Call setPage() first.');
    }

    // Use cached locator if available
    if (this.options.cacheEnabled && this.cachedLocator) {
      try {
        const count = await this.cachedLocator.count();
        if (count > 0) {
          return this.cachedLocator;
        }
      } catch {
        // Cache invalid, continue to find
      }
    }

    const locators = this.getAllLocators();
    let lastError: Error | null = null;

    for (const { locator, priority } of locators) {
      try {
        const playwrightLocator = this.toPlaywrightLocator(locator);
        const count = await playwrightLocator.count();

        if (count > 0) {
          // If healed (not primary locator), record it
          if (locator !== this.locator) {
            this.recordHealing(locator);
          }

          this.cachedLocator = playwrightLocator;
          return playwrightLocator;
        }
      } catch (error) {
        lastError = error as Error;
      }
    }

    throw lastError || new Error(`Element not found: ${this.metadata.name}`);
  }

  /**
   * Convert LocatorStrategy to Playwright Locator
   */
  private toPlaywrightLocator(strategy: LocatorStrategy): Locator {
    if (!this.page) {
      throw new Error('Page not set');
    }

    switch (strategy.type) {
      case 'css':
        return this.page.locator(strategy.value);
      case 'xpath':
        return this.page.locator(`xpath=${strategy.value}`);
      case 'id':
        return this.page.locator(`#${strategy.value}`);
      case 'name':
        return this.page.locator(`[name="${strategy.value}"]`);
      case 'testId':
        return this.page.getByTestId(strategy.value);
      case 'text':
        return this.page.getByText(strategy.value, { exact: strategy.options?.exact as boolean });
      case 'role':
        return this.page.getByRole(strategy.value as any, strategy.options as any);
      case 'label':
        return this.page.getByLabel(strategy.value);
      default:
        return this.page.locator(strategy.value);
    }
  }

  /**
   * Record healing event
   */
  private recordHealing(usedLocator: LocatorStrategy): void {
    const event: HealingRecord = {
      timestamp: Date.now(),
      originalLocator: this.locator,
      usedLocator,
      successful: true,
    };

    this.state.healingHistory.push(event);
    this.emit('healed', event);

    console.log(`🔧 Self-healed: ${this.metadata.name}`);
  }

  /**
   * Record interaction
   */
  private recordInteraction(type: string, details: Record<string, unknown> = {}): void {
    this.state.lastInteraction = {
      type,
      timestamp: Date.now(),
      details,
    };
    this.state.interactionCount++;
    this.emit('interaction', this.state.lastInteraction);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Click element
   */
  async click(): Promise<void> {
    const locator = await this.find();
    await this.retry(async () => {
      await locator.click({ timeout: this.options.timeout });
    });
    this.recordInteraction('click');
  }

  /**
   * Double click
   */
  async dblclick(): Promise<void> {
    const locator = await this.find();
    await this.retry(async () => {
      await locator.dblclick({ timeout: this.options.timeout });
    });
    this.recordInteraction('dblclick');
  }

  /**
   * Right click
   */
  async rightclick(): Promise<void> {
    const locator = await this.find();
    await this.retry(async () => {
      await locator.click({ button: 'right', timeout: this.options.timeout });
    });
    this.recordInteraction('rightclick');
  }

  /**
   * Type text
   */
  async type(text: string, options?: { clear?: boolean; delay?: number }): Promise<void> {
    const locator = await this.find();
    await this.retry(async () => {
      if (options?.clear) {
        await locator.clear();
      }
      await locator.fill(text);
    });
    this.recordInteraction('type', { text });
  }

  /**
   * Press key
   */
  async press(key: string): Promise<void> {
    const locator = await this.find();
    await locator.press(key);
    this.recordInteraction('press', { key });
  }

  /**
   * Clear input
   */
  async clear(): Promise<void> {
    const locator = await this.find();
    await locator.clear();
    this.recordInteraction('clear');
  }

  /**
   * Hover over element
   */
  async hover(): Promise<void> {
    const locator = await this.find();
    await locator.hover({ timeout: this.options.timeout });
    this.recordInteraction('hover');
  }

  /**
   * Focus element
   */
  async focus(): Promise<void> {
    const locator = await this.find();
    await locator.focus();
    this.recordInteraction('focus');
  }

  /**
   * Blur element
   */
  async blur(): Promise<void> {
    const locator = await this.find();
    await locator.blur();
    this.recordInteraction('blur');
  }

  /**
   * Scroll into view
   */
  async scrollIntoView(): Promise<void> {
    const locator = await this.find();
    await locator.scrollIntoViewIfNeeded();
    this.recordInteraction('scrollIntoView');
  }

  /**
   * Select option from dropdown
   */
  async select(value: string | string[]): Promise<void> {
    const locator = await this.find();
    await locator.selectOption(value);
    this.recordInteraction('select', { value });
  }

  /**
   * Check checkbox/radio
   */
  async check(): Promise<void> {
    const locator = await this.find();
    await locator.check();
    this.recordInteraction('check');
  }

  /**
   * Uncheck checkbox
   */
  async uncheck(): Promise<void> {
    const locator = await this.find();
    await locator.uncheck();
    this.recordInteraction('uncheck');
  }

  /**
   * Upload file
   */
  async upload(filePath: string | string[]): Promise<void> {
    const locator = await this.find();
    await locator.setInputFiles(filePath);
    this.recordInteraction('upload', { filePath });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get text content
   */
  async getText(): Promise<string> {
    const locator = await this.find();
    return (await locator.textContent()) ?? '';
  }

  /**
   * Get inner text
   */
  async getInnerText(): Promise<string> {
    const locator = await this.find();
    return await locator.innerText();
  }

  /**
   * Get input value
   */
  async getValue(): Promise<string> {
    const locator = await this.find();
    return await locator.inputValue();
  }

  /**
   * Get attribute
   */
  async getAttribute(name: string): Promise<string | null> {
    const locator = await this.find();
    return await locator.getAttribute(name);
  }

  /**
   * Get CSS property
   */
  async getCssValue(property: string): Promise<string> {
    const locator = await this.find();
    return await locator.evaluate((el, prop) => {
      return window.getComputedStyle(el).getPropertyValue(prop);
    }, property);
  }

  /**
   * Get bounding box
   */
  async getRect(): Promise<{ x: number; y: number; width: number; height: number } | null> {
    const locator = await this.find();
    return await locator.boundingBox();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE CHECKS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if visible
   */
  async isVisible(): Promise<boolean> {
    try {
      const locator = await this.find();
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if enabled
   */
  async isEnabled(): Promise<boolean> {
    const locator = await this.find();
    return await locator.isEnabled();
  }

  /**
   * Check if disabled
   */
  async isDisabled(): Promise<boolean> {
    const locator = await this.find();
    return await locator.isDisabled();
  }

  /**
   * Check if checked
   */
  async isChecked(): Promise<boolean> {
    const locator = await this.find();
    return await locator.isChecked();
  }

  /**
   * Check if element exists
   */
  async exists(): Promise<boolean> {
    try {
      const locator = await this.find();
      return (await locator.count()) > 0;
    } catch {
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WAITS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Wait for element to be visible
   */
  async waitForVisible(timeout?: number): Promise<void> {
    const locator = await this.find();
    await locator.waitFor({ state: 'visible', timeout: timeout ?? this.options.timeout });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(timeout?: number): Promise<void> {
    const locator = await this.find();
    await locator.waitFor({ state: 'hidden', timeout: timeout ?? this.options.timeout });
  }

  /**
   * Wait for element to be attached
   */
  async waitForAttached(timeout?: number): Promise<void> {
    const locator = await this.find();
    await locator.waitFor({ state: 'attached', timeout: timeout ?? this.options.timeout });
  }

  /**
   * Wait for element to be detached
   */
  async waitForDetached(timeout?: number): Promise<void> {
    const locator = await this.find();
    await locator.waitFor({ state: 'detached', timeout: timeout ?? this.options.timeout });
  }

  /**
   * Wait for custom condition
   */
  async waitFor(condition: () => Promise<boolean>, timeout?: number): Promise<void> {
    const actualTimeout = timeout ?? this.options.timeout;
    const startTime = Date.now();

    while (Date.now() - startTime < actualTimeout) {
      try {
        const result = await condition();
        if (result) return;
      } catch {
        // Continue waiting
      }
      await this.sleep(100);
    }

    throw new Error(`Wait timeout for ${this.metadata.name}: ${actualTimeout}ms`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Retry operation
   */
  async retry<T>(operation: () => Promise<T>, retries?: number): Promise<T> {
    const maxRetries = retries ?? this.options.retries;
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        this.state.errors.push({
          timestamp: Date.now(),
          attempt: i + 1,
          error: lastError.message,
        });

        await this.sleep(this.options.waitBetweenRetries);
      }
    }

    throw lastError;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get element state info
   */
  getState(): ElementState & { metadata: ElementMetadata; locatorCount: number } {
    return {
      ...this.state,
      metadata: this.metadata,
      locatorCount: this.getAllLocators().length,
    };
  }

  /**
   * Get Playwright locator directly
   */
  async getLocator(): Promise<Locator> {
    return await this.find();
  }
}

export default BaseElement;
