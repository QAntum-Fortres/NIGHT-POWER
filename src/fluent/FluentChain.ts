/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🧠 QANTUM HYBRID v1.0.0 - Fluent Chain API
 * Cypress-style chaining: cy.get().should().click()
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { Page, Locator, ElementHandle } from 'playwright';

import { logger } from '../api/unified/utils/logger';
// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ChainCallback<T> = (value: T) => void | Promise<void>;
export type ShouldCallback = (subject: any) => void | boolean | Promise<void | boolean>;

export interface ChainOptions {
  timeout?: number;
  log?: boolean;
  force?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLUENT CHAIN
// ═══════════════════════════════════════════════════════════════════════════════

export class FluentChain {
  private page: Page;
  private selector: string;
  private locator: Locator;
  private parentChain?: FluentChain;
  private options: ChainOptions;
  private assertions: Array<() => Promise<void>> = [];

  constructor(page: Page, selector: string, options: ChainOptions = {}, parentChain?: FluentChain) {
    this.page = page;
    this.selector = selector;
    this.locator = page.locator(selector);
    this.parentChain = parentChain;
    this.options = {
      timeout: options.timeout ?? 30000,
      log: options.log ?? true,
      force: options.force ?? false,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRAVERSAL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get child element
   */
  find(selector: string): FluentChain {
    const newLocator = this.locator.locator(selector);
    const chain = new FluentChain(this.page, `${this.selector} ${selector}`, this.options, this);
    chain.locator = newLocator;
    return chain;
  }

  /**
   * Get first element
   */
  first(): FluentChain {
    const chain = new FluentChain(this.page, `${this.selector}:first`, this.options, this);
    chain.locator = this.locator.first();
    return chain;
  }

  /**
   * Get last element
   */
  last(): FluentChain {
    const chain = new FluentChain(this.page, `${this.selector}:last`, this.options, this);
    chain.locator = this.locator.last();
    return chain;
  }

  /**
   * Get nth element
   */
  eq(index: number): FluentChain {
    const chain = new FluentChain(this.page, `${this.selector}:eq(${index})`, this.options, this);
    chain.locator = this.locator.nth(index);
    return chain;
  }

  /**
   * Get parent element
   */
  parent(): FluentChain {
    const chain = new FluentChain(this.page, `${this.selector}/..`, this.options, this);
    chain.locator = this.locator.locator('..');
    return chain;
  }

  /**
   * Get siblings
   */
  siblings(selector?: string): FluentChain {
    const sibSelector = selector ?? '*';
    const chain = new FluentChain(this.page, `${this.selector}~${sibSelector}`, this.options, this);
    chain.locator = this.locator.locator(`xpath=following-sibling::${sibSelector}`);
    return chain;
  }

  /**
   * Get next sibling
   */
  next(): FluentChain {
    const chain = new FluentChain(this.page, `${this.selector}+*`, this.options, this);
    chain.locator = this.locator.locator('xpath=following-sibling::*[1]');
    return chain;
  }

  /**
   * Get previous sibling
   */
  prev(): FluentChain {
    const chain = new FluentChain(this.page, `${this.selector}-*`, this.options, this);
    chain.locator = this.locator.locator('xpath=preceding-sibling::*[1]');
    return chain;
  }

  /**
   * Filter by selector
   */
  filter(selector: string): FluentChain {
    const chain = new FluentChain(this.page, `${this.selector}:filter(${selector})`, this.options, this);
    chain.locator = this.locator.filter({ has: this.page.locator(selector) });
    return chain;
  }

  /**
   * Filter by text
   */
  contains(text: string): FluentChain {
    const chain = new FluentChain(this.page, `${this.selector}:contains("${text}")`, this.options, this);
    chain.locator = this.locator.filter({ hasText: text });
    return chain;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Click element
   */
  async click(options?: { force?: boolean; multiple?: boolean }): Promise<this> {
    await this.runAssertions();
    
    if (this.options.log) {
      logger.debug(`🖱️ click: ${this.selector}`);
    }

    await this.locator.click({
      timeout: this.options.timeout,
      force: options?.force ?? this.options.force,
    });

    return this;
  }

  /**
   * Double click
   */
  async dblclick(): Promise<this> {
    await this.runAssertions();
    
    if (this.options.log) {
      logger.debug(`🖱️🖱️ dblclick: ${this.selector}`);
    }

    await this.locator.dblclick({ timeout: this.options.timeout });
    return this;
  }

  /**
   * Right click
   */
  async rightclick(): Promise<this> {
    await this.runAssertions();
    
    if (this.options.log) {
      logger.debug(`🖱️ rightclick: ${this.selector}`);
    }

    await this.locator.click({ button: 'right', timeout: this.options.timeout });
    return this;
  }

  /**
   * Type text
   */
  async type(text: string, options?: { delay?: number; clear?: boolean }): Promise<this> {
    await this.runAssertions();
    
    if (this.options.log) {
      logger.debug(`⌨️ type: "${text}" → ${this.selector}`);
    }

    if (options?.clear) {
      await this.locator.clear();
    }

    await this.locator.fill(text);
    return this;
  }

  /**
   * Clear input
   */
  async clear(): Promise<this> {
    await this.runAssertions();
    
    if (this.options.log) {
      logger.debug(`🧹 clear: ${this.selector}`);
    }

    await this.locator.clear();
    return this;
  }

  /**
   * Check checkbox/radio
   */
  async check(): Promise<this> {
    await this.runAssertions();
    
    if (this.options.log) {
      logger.debug(`☑️ check: ${this.selector}`);
    }

    await this.locator.check({ timeout: this.options.timeout });
    return this;
  }

  /**
   * Uncheck checkbox
   */
  async uncheck(): Promise<this> {
    await this.runAssertions();
    
    if (this.options.log) {
      logger.debug(`☐ uncheck: ${this.selector}`);
    }

    await this.locator.uncheck({ timeout: this.options.timeout });
    return this;
  }

  /**
   * Select option from dropdown
   */
  async select(value: string | string[]): Promise<this> {
    await this.runAssertions();
    
    if (this.options.log) {
      logger.debug(`📋 select: ${value} → ${this.selector}`);
    }

    await this.locator.selectOption(value);
    return this;
  }

  /**
   * Hover over element
   */
  async hover(): Promise<this> {
    await this.runAssertions();
    
    if (this.options.log) {
      logger.debug(`👆 hover: ${this.selector}`);
    }

    await this.locator.hover({ timeout: this.options.timeout });
    return this;
  }

  /**
   * Focus element
   */
  async focus(): Promise<this> {
    await this.runAssertions();
    
    if (this.options.log) {
      logger.debug(`🎯 focus: ${this.selector}`);
    }

    await this.locator.focus();
    return this;
  }

  /**
   * Blur element
   */
  async blur(): Promise<this> {
    await this.runAssertions();
    
    if (this.options.log) {
      logger.debug(`💨 blur: ${this.selector}`);
    }

    await this.locator.blur();
    return this;
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(): Promise<this> {
    await this.runAssertions();
    
    if (this.options.log) {
      logger.debug(`📜 scrollIntoView: ${this.selector}`);
    }

    await this.locator.scrollIntoViewIfNeeded();
    return this;
  }

  /**
   * Trigger event
   */
  async trigger(event: string): Promise<this> {
    await this.runAssertions();
    
    if (this.options.log) {
      logger.debug(`⚡ trigger: ${event} → ${this.selector}`);
    }

    await this.locator.dispatchEvent(event);
    return this;
  }

  /**
   * Submit form
   */
  async submit(): Promise<this> {
    await this.runAssertions();
    
    if (this.options.log) {
      logger.debug(`📤 submit: ${this.selector}`);
    }

    await this.locator.evaluate((el) => {
      const form = el.closest('form');
      if (form) form.submit();
    });

    return this;
  }

  /**
   * Upload file
   */
  async attachFile(filePath: string | string[]): Promise<this> {
    await this.runAssertions();
    
    if (this.options.log) {
      logger.debug(`📎 attachFile: ${filePath} → ${this.selector}`);
    }

    await this.locator.setInputFiles(filePath);
    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSERTIONS (should)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add assertion (Cypress-style should)
   */
  should(assertion: string | ShouldCallback, ...args: any[]): this {
    if (typeof assertion === 'function') {
      this.assertions.push(async () => {
        const result = await assertion(this);
        if (result === false) {
          throw new Error('Custom assertion failed');
        }
      });
      return this;
    }

    // Parse Chai-style assertions
    const assertionMap: Record<string, () => Promise<void>> = {
      // Visibility
      'be.visible': async () => {
        await expect(this.locator).toBeVisible({ timeout: this.options.timeout });
      },
      'be.hidden': async () => {
        await expect(this.locator).toBeHidden({ timeout: this.options.timeout });
      },
      'not.be.visible': async () => {
        await expect(this.locator).toBeHidden({ timeout: this.options.timeout });
      },
      'exist': async () => {
        const count = await this.locator.count();
        if (count === 0) throw new Error(`Element does not exist: ${this.selector}`);
      },
      'not.exist': async () => {
        const count = await this.locator.count();
        if (count > 0) throw new Error(`Element exists: ${this.selector}`);
      },

      // State
      'be.enabled': async () => {
        await expect(this.locator).toBeEnabled({ timeout: this.options.timeout });
      },
      'be.disabled': async () => {
        await expect(this.locator).toBeDisabled({ timeout: this.options.timeout });
      },
      'be.checked': async () => {
        await expect(this.locator).toBeChecked({ timeout: this.options.timeout });
      },
      'not.be.checked': async () => {
        await expect(this.locator).not.toBeChecked({ timeout: this.options.timeout });
      },
      'be.focused': async () => {
        await expect(this.locator).toBeFocused({ timeout: this.options.timeout });
      },
      'be.empty': async () => {
        await expect(this.locator).toBeEmpty({ timeout: this.options.timeout });
      },

      // Content
      'have.text': async () => {
        const expected = args[0];
        await expect(this.locator).toHaveText(expected, { timeout: this.options.timeout });
      },
      'contain': async () => {
        const expected = args[0];
        await expect(this.locator).toContainText(expected, { timeout: this.options.timeout });
      },
      'contain.text': async () => {
        const expected = args[0];
        await expect(this.locator).toContainText(expected, { timeout: this.options.timeout });
      },
      'have.value': async () => {
        const expected = args[0];
        await expect(this.locator).toHaveValue(expected, { timeout: this.options.timeout });
      },
      'have.attr': async () => {
        const [attr, value] = args;
        await expect(this.locator).toHaveAttribute(attr, value, { timeout: this.options.timeout });
      },
      'have.class': async () => {
        const className = args[0];
        await expect(this.locator).toHaveClass(new RegExp(className), { timeout: this.options.timeout });
      },
      'have.css': async () => {
        const [prop, value] = args;
        await expect(this.locator).toHaveCSS(prop, value, { timeout: this.options.timeout });
      },

      // Count
      'have.length': async () => {
        const expected = args[0];
        await expect(this.locator).toHaveCount(expected, { timeout: this.options.timeout });
      },
      'have.length.gt': async () => {
        const expected = args[0];
        const count = await this.locator.count();
        if (count <= expected) throw new Error(`Expected length > ${expected}, got ${count}`);
      },
      'have.length.gte': async () => {
        const expected = args[0];
        const count = await this.locator.count();
        if (count < expected) throw new Error(`Expected length >= ${expected}, got ${count}`);
      },
      'have.length.lt': async () => {
        const expected = args[0];
        const count = await this.locator.count();
        if (count >= expected) throw new Error(`Expected length < ${expected}, got ${count}`);
      },
      'have.length.lte': async () => {
        const expected = args[0];
        const count = await this.locator.count();
        if (count > expected) throw new Error(`Expected length <= ${expected}, got ${count}`);
      },

      // Misc
      'match': async () => {
        const pattern = args[0] as RegExp;
        const text = await this.locator.textContent() ?? '';
        if (!pattern.test(text)) throw new Error(`Text "${text}" does not match ${pattern}`);
      },
      'include': async () => {
        const expected = args[0];
        const text = await this.locator.textContent() ?? '';
        if (!text.includes(expected)) throw new Error(`Text "${text}" does not include "${expected}"`);
      },
    };

    const assertFn = assertionMap[assertion];
    if (assertFn) {
      this.assertions.push(assertFn);
    } else {
      logger.warn(`Unknown assertion: ${assertion}`);
    }

    return this;
  }

  /**
   * Add negated assertion
   */
  and(assertion: string, ...args: any[]): this {
    return this.should(assertion, ...args);
  }

  /**
   * Run all pending assertions
   */
  private async runAssertions(): Promise<void> {
    for (const assertion of this.assertions) {
      await assertion();
    }
    this.assertions = [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get text content
   */
  async text(): Promise<string> {
    await this.runAssertions();
    return (await this.locator.textContent()) ?? '';
  }

  /**
   * Get inner text
   */
  async innerText(): Promise<string> {
    await this.runAssertions();
    return await this.locator.innerText();
  }

  /**
   * Get attribute value
   */
  async attr(name: string): Promise<string | null> {
    await this.runAssertions();
    return await this.locator.getAttribute(name);
  }

  /**
   * Get input value
   */
  async val(): Promise<string> {
    await this.runAssertions();
    return await this.locator.inputValue();
  }

  /**
   * Get element count
   */
  async length(): Promise<number> {
    return await this.locator.count();
  }

  /**
   * Check if visible
   */
  async isVisible(): Promise<boolean> {
    return await this.locator.isVisible();
  }

  /**
   * Check if enabled
   */
  async isEnabled(): Promise<boolean> {
    return await this.locator.isEnabled();
  }

  /**
   * Check if checked
   */
  async isChecked(): Promise<boolean> {
    return await this.locator.isChecked();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALLBACKS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Execute callback with element (then)
   */
  async then<T>(callback: (el: FluentChain) => T | Promise<T>): Promise<T> {
    await this.runAssertions();
    return await callback(this);
  }

  /**
   * Execute callback on each element
   */
  async each(callback: (el: FluentChain, index: number) => void | Promise<void>): Promise<this> {
    await this.runAssertions();
    
    const count = await this.locator.count();
    for (let i = 0; i < count; i++) {
      const chain = new FluentChain(this.page, `${this.selector}[${i}]`, this.options);
      chain.locator = this.locator.nth(i);
      await callback(chain, i);
    }

    return this;
  }

  /**
   * Execute callback with value (invoke)
   */
  async invoke<K extends keyof HTMLElement>(method: K): Promise<any> {
    await this.runAssertions();
    return await this.locator.evaluate((el, m) => (el as any)[m]?.(), method);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WAITING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Wait for element to appear
   */
  async wait(timeout?: number): Promise<this> {
    await this.locator.waitFor({ 
      state: 'visible', 
      timeout: timeout ?? this.options.timeout 
    });
    return this;
  }

  /**
   * Wait for element to disappear
   */
  async waitUntilGone(timeout?: number): Promise<this> {
    await this.locator.waitFor({ 
      state: 'hidden', 
      timeout: timeout ?? this.options.timeout 
    });
    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get underlying Playwright locator
   */
  getLocator(): Locator {
    return this.locator;
  }

  /**
   * Take screenshot of element
   */
  async screenshot(path?: string): Promise<Buffer> {
    await this.runAssertions();
    return await this.locator.screenshot({ path });
  }

  /**
   * Log element info
   */
  async debug(): Promise<this> {
    const count = await this.locator.count();
    const isVisible = count > 0 ? await this.locator.first().isVisible() : false;
    
    logger.debug(`🔍 Debug: ${this.selector}`);
    logger.debug(`   Count: ${count}`);
    logger.debug(`   Visible: ${isVisible}`);
    
    if (count > 0) {
      const text = await this.locator.first().textContent();
      logger.debug(`   Text: ${text?.substring(0, 50)}`);
    }

    return this;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPECT HELPERS (Playwright compatibility)
// ═══════════════════════════════════════════════════════════════════════════════

function expect(locator: Locator) {
  return {
    async toBeVisible(options?: { timeout?: number }) {
      await locator.waitFor({ state: 'visible', timeout: options?.timeout });
    },
    async toBeHidden(options?: { timeout?: number }) {
      await locator.waitFor({ state: 'hidden', timeout: options?.timeout });
    },
    async toBeEnabled(options?: { timeout?: number }) {
      const isEnabled = await locator.isEnabled();
      if (!isEnabled) throw new Error('Element is not enabled');
    },
    async toBeDisabled(options?: { timeout?: number }) {
      const isDisabled = await locator.isDisabled();
      if (!isDisabled) throw new Error('Element is not disabled');
    },
    async toBeChecked(options?: { timeout?: number }) {
      const isChecked = await locator.isChecked();
      if (!isChecked) throw new Error('Element is not checked');
    },
    async toBeFocused(options?: { timeout?: number }) {
      const isFocused = await locator.evaluate(el => el === document.activeElement);
      if (!isFocused) throw new Error('Element is not focused');
    },
    async toBeEmpty(options?: { timeout?: number }) {
      const text = await locator.textContent();
      if (text && text.trim()) throw new Error('Element is not empty');
    },
    async toHaveText(expected: string | RegExp, options?: { timeout?: number }) {
      const text = await locator.textContent() ?? '';
      if (typeof expected === 'string') {
        if (text !== expected) throw new Error(`Expected "${expected}", got "${text}"`);
      } else {
        if (!expected.test(text)) throw new Error(`Text "${text}" does not match ${expected}`);
      }
    },
    async toContainText(expected: string, options?: { timeout?: number }) {
      const text = await locator.textContent() ?? '';
      if (!text.includes(expected)) throw new Error(`"${text}" does not contain "${expected}"`);
    },
    async toHaveValue(expected: string, options?: { timeout?: number }) {
      const value = await locator.inputValue();
      if (value !== expected) throw new Error(`Expected value "${expected}", got "${value}"`);
    },
    async toHaveAttribute(name: string, value: string | RegExp, options?: { timeout?: number }) {
      const attr = await locator.getAttribute(name);
      if (typeof value === 'string') {
        if (attr !== value) throw new Error(`Expected ${name}="${value}", got "${attr}"`);
      } else {
        if (!attr || !value.test(attr)) throw new Error(`Attribute ${name}="${attr}" does not match ${value}`);
      }
    },
    async toHaveClass(expected: string | RegExp, options?: { timeout?: number }) {
      const className = await locator.getAttribute('class') ?? '';
      if (typeof expected === 'string') {
        if (!className.includes(expected)) throw new Error(`Expected class "${expected}" in "${className}"`);
      } else {
        if (!expected.test(className)) throw new Error(`Class "${className}" does not match ${expected}`);
      }
    },
    async toHaveCSS(property: string, value: string, options?: { timeout?: number }) {
      const css = await locator.evaluate((el, prop) => 
        window.getComputedStyle(el).getPropertyValue(prop), property
      );
      if (css !== value) throw new Error(`Expected CSS ${property}: ${value}, got ${css}`);
    },
    async toHaveCount(expected: number, options?: { timeout?: number }) {
      const count = await locator.count();
      if (count !== expected) throw new Error(`Expected ${expected} elements, found ${count}`);
    },
    not: {
      async toBeChecked(options?: { timeout?: number }) {
        const isChecked = await locator.isChecked();
        if (isChecked) throw new Error('Element is checked');
      },
    },
  };
}

export default FluentChain;
