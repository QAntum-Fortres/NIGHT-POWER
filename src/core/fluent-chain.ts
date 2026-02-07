/**
 * 🧠 QANTUM HYBRID - Fluent Chain
 * Cypress-style method chaining: mm.click().type().should()
 */

import type { Page, Locator } from 'playwright';
import { SelfHealingEngine } from './self-healing.js';
import { DeepSearchEngine } from './deep-search.js';

import { logger } from '../api/unified/utils/logger';
export class FluentChain {
  private page: Page;
  private currentLocator?: Locator;
  private currentSelector?: string;
  private selfHealer: SelfHealingEngine;
  private deepSearch: DeepSearchEngine;
  private timeout: number;

  constructor(
    page: Page, 
    selfHealer: SelfHealingEngine, 
    deepSearch: DeepSearchEngine,
    timeout = 30000
  ) {
    this.page = page;
    this.selfHealer = selfHealer;
    this.deepSearch = deepSearch;
    this.timeout = timeout;
  }

  /**
   * Избери елемент
   */
  get(selector: string): FluentChain {
    this.currentSelector = selector;
    this.currentLocator = this.page.locator(selector);
    return this;
  }

  /**
   * Намери с Deep Search (Shadow DOM, Iframes)
   */
  async find(selector: string): Promise<FluentChain> {
    this.currentSelector = selector;
    
    const result = await this.deepSearch.find(this.page, selector);
    if (result.found && result.locator) {
      this.currentLocator = result.locator;
    } else {
      // Self-healing опит
      const healed = await this.selfHealer.heal(this.page, selector);
      if (healed.healed && healed.newSelector) {
        this.currentLocator = this.page.locator(healed.newSelector);
        logger.debug(`🩹 Self-healed: "${selector}" → "${healed.newSelector}"`);
      } else {
        this.currentLocator = this.page.locator(selector);
      }
    }
    
    return this;
  }

  /**
   * Кликни
   */
  async click(): Promise<FluentChain> {
    await this.ensureLocator();
    await this.currentLocator!.click({ timeout: this.timeout });
    return this;
  }

  /**
   * Double click
   */
  async dblclick(): Promise<FluentChain> {
    await this.ensureLocator();
    await this.currentLocator!.dblclick({ timeout: this.timeout });
    return this;
  }

  /**
   * Right click
   */
  async rightclick(): Promise<FluentChain> {
    await this.ensureLocator();
    await this.currentLocator!.click({ button: 'right', timeout: this.timeout });
    return this;
  }

  /**
   * Въведи текст
   */
  async type(text: string, options?: { delay?: number; clear?: boolean }): Promise<FluentChain> {
    await this.ensureLocator();
    
    if (options?.clear) {
      await this.currentLocator!.clear();
    }
    
    await this.currentLocator!.fill(text);
    return this;
  }

  /**
   * Натисни клавиш
   */
  async press(key: string): Promise<FluentChain> {
    await this.ensureLocator();
    await this.currentLocator!.press(key);
    return this;
  }

  /**
   * Hover
   */
  async hover(): Promise<FluentChain> {
    await this.ensureLocator();
    await this.currentLocator!.hover({ timeout: this.timeout });
    return this;
  }

  /**
   * Focus
   */
  async focus(): Promise<FluentChain> {
    await this.ensureLocator();
    await this.currentLocator!.focus();
    return this;
  }

  /**
   * Scroll into view
   */
  async scrollIntoView(): Promise<FluentChain> {
    await this.ensureLocator();
    await this.currentLocator!.scrollIntoViewIfNeeded();
    return this;
  }

  /**
   * Избери от dropdown
   */
  async select(value: string | string[]): Promise<FluentChain> {
    await this.ensureLocator();
    await this.currentLocator!.selectOption(value);
    return this;
  }

  /**
   * Check checkbox/radio
   */
  async check(): Promise<FluentChain> {
    await this.ensureLocator();
    await this.currentLocator!.check();
    return this;
  }

  /**
   * Uncheck
   */
  async uncheck(): Promise<FluentChain> {
    await this.ensureLocator();
    await this.currentLocator!.uncheck();
    return this;
  }

  /**
   * Upload file
   */
  async upload(filePath: string | string[]): Promise<FluentChain> {
    await this.ensureLocator();
    await this.currentLocator!.setInputFiles(filePath);
    return this;
  }

  /**
   * Изчакай елемент
   */
  async wait(timeout?: number): Promise<FluentChain> {
    await this.ensureLocator();
    await this.currentLocator!.waitFor({ 
      state: 'visible', 
      timeout: timeout || this.timeout 
    });
    return this;
  }

  /**
   * Cypress-style should() assertions
   */
  async should(assertion: string, expected?: unknown): Promise<FluentChain> {
    await this.ensureLocator();
    const locator = this.currentLocator!;

    switch (assertion) {
      case 'be.visible':
        await expect(locator).toBeVisible({ timeout: this.timeout });
        break;
      case 'be.hidden':
      case 'not.be.visible':
        await expect(locator).toBeHidden({ timeout: this.timeout });
        break;
      case 'exist':
        await expect(locator).toHaveCount(1, { timeout: this.timeout });
        break;
      case 'not.exist':
        await expect(locator).toHaveCount(0, { timeout: this.timeout });
        break;
      case 'be.enabled':
        await expect(locator).toBeEnabled({ timeout: this.timeout });
        break;
      case 'be.disabled':
        await expect(locator).toBeDisabled({ timeout: this.timeout });
        break;
      case 'be.checked':
        await expect(locator).toBeChecked({ timeout: this.timeout });
        break;
      case 'have.text':
        await expect(locator).toHaveText(expected as string, { timeout: this.timeout });
        break;
      case 'contain.text':
      case 'contain':
        await expect(locator).toContainText(expected as string, { timeout: this.timeout });
        break;
      case 'have.value':
        await expect(locator).toHaveValue(expected as string, { timeout: this.timeout });
        break;
      case 'have.attr':
        if (Array.isArray(expected)) {
          await expect(locator).toHaveAttribute(expected[0], expected[1], { timeout: this.timeout });
        }
        break;
      case 'have.class':
        await expect(locator).toHaveClass(new RegExp(expected as string), { timeout: this.timeout });
        break;
      case 'have.count':
        await expect(locator).toHaveCount(expected as number, { timeout: this.timeout });
        break;
      default:
        throw new Error(`Unknown assertion: ${assertion}`);
    }

    return this;
  }

  /**
   * Вземи текст
   */
  async getText(): Promise<string> {
    await this.ensureLocator();
    return await this.currentLocator!.textContent() || '';
  }

  /**
   * Вземи атрибут
   */
  async getAttribute(name: string): Promise<string | null> {
    await this.ensureLocator();
    return await this.currentLocator!.getAttribute(name);
  }

  /**
   * Вземи стойност
   */
  async getValue(): Promise<string> {
    await this.ensureLocator();
    return await this.currentLocator!.inputValue();
  }

  /**
   * Провери дали е видим
   */
  async isVisible(): Promise<boolean> {
    await this.ensureLocator();
    return await this.currentLocator!.isVisible();
  }

  /**
   * Вземи Playwright locator директно
   */
  getLocator(): Locator | undefined {
    return this.currentLocator;
  }

  /**
   * Осигури че имаме локатор
   */
  private async ensureLocator(): Promise<void> {
    if (!this.currentLocator) {
      throw new Error('No element selected. Use .get() or .find() first.');
    }

    // Опитай self-healing ако елементът не съществува
    const count = await this.currentLocator.count();
    if (count === 0 && this.currentSelector) {
      const healed = await this.selfHealer.heal(this.page, this.currentSelector);
      if (healed.healed && healed.newSelector) {
        this.currentLocator = this.page.locator(healed.newSelector);
        logger.debug(`🩹 Auto-healed: "${this.currentSelector}" → "${healed.newSelector}"`);
      }
    }
  }
}

// Import Playwright expect
import { expect } from '@playwright/test';
