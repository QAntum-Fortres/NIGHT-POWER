/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🧠 QANTUM HYBRID v1.0.0 - LocatorFactory
 * Fluent locator builder (By.css, By.xpath, By.testId, etc.)
 * Ported from: training-framework/architecture/pom-base.js
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { LocatorStrategy } from './BaseElement';

// ═══════════════════════════════════════════════════════════════════════════════
// LOCATOR FACTORY (By class)
// ═══════════════════════════════════════════════════════════════════════════════

export class LocatorFactory {
  /**
   * CSS selector
   */
  static css(selector: string): LocatorStrategy {
    return { type: 'css', value: selector };
  }

  /**
   * XPath selector
   */
  static xpath(expression: string): LocatorStrategy {
    return { type: 'xpath', value: expression };
  }

  /**
   * ID selector
   */
  static id(id: string): LocatorStrategy {
    return { type: 'id', value: id };
  }

  /**
   * Name attribute selector
   */
  static name(name: string): LocatorStrategy {
    return { type: 'name', value: name };
  }

  /**
   * Test ID selector (data-testid)
   */
  static testId(testId: string): LocatorStrategy {
    return { type: 'testId', value: testId };
  }

  /**
   * Data attribute selector
   */
  static data(attribute: string, value?: string): LocatorStrategy {
    const selector = value !== undefined
      ? `[data-${attribute}="${value}"]`
      : `[data-${attribute}]`;
    return { type: 'css', value: selector };
  }

  /**
   * ARIA role selector
   */
  static role(role: string, options?: { name?: string; exact?: boolean }): LocatorStrategy {
    return { type: 'role', value: role, options };
  }

  /**
   * Text content selector
   */
  static text(text: string, options?: { exact?: boolean }): LocatorStrategy {
    return { type: 'text', value: text, options };
  }

  /**
   * Label selector
   */
  static label(text: string): LocatorStrategy {
    return { type: 'label', value: text };
  }

  /**
   * Placeholder selector
   */
  static placeholder(text: string): LocatorStrategy {
    return { type: 'css', value: `[placeholder="${text}"]` };
  }

  /**
   * Title attribute selector
   */
  static title(text: string): LocatorStrategy {
    return { type: 'css', value: `[title="${text}"]` };
  }

  /**
   * Alt attribute selector (for images)
   */
  static alt(text: string): LocatorStrategy {
    return { type: 'css', value: `[alt="${text}"]` };
  }

  /**
   * Class name selector
   */
  static className(className: string): LocatorStrategy {
    return { type: 'css', value: `.${className}` };
  }

  /**
   * Tag name selector
   */
  static tagName(tag: string): LocatorStrategy {
    return { type: 'css', value: tag };
  }

  /**
   * Link text selector
   */
  static linkText(text: string, partial = false): LocatorStrategy {
    return partial
      ? { type: 'xpath', value: `//a[contains(text(), "${text}")]` }
      : { type: 'xpath', value: `//a[text()="${text}"]` };
  }

  /**
   * Partial link text selector
   */
  static partialLinkText(text: string): LocatorStrategy {
    return this.linkText(text, true);
  }

  /**
   * Button by text
   */
  static button(text: string): LocatorStrategy {
    return { 
      type: 'xpath', 
      value: `//button[contains(text(), "${text}")] | //input[@type="button" and @value="${text}"] | //input[@type="submit" and @value="${text}"]` 
    };
  }

  /**
   * Input by type
   */
  static input(type: string): LocatorStrategy {
    return { type: 'css', value: `input[type="${type}"]` };
  }

  /**
   * Form field by label
   */
  static fieldByLabel(labelText: string): LocatorStrategy {
    return { 
      type: 'xpath', 
      value: `//label[contains(text(), "${labelText}")]/following::input[1] | //label[contains(text(), "${labelText}")]/input` 
    };
  }

  /**
   * Nth child selector
   */
  static nthChild(selector: string, n: number): LocatorStrategy {
    return { type: 'css', value: `${selector}:nth-child(${n})` };
  }

  /**
   * First child selector
   */
  static firstChild(selector: string): LocatorStrategy {
    return { type: 'css', value: `${selector}:first-child` };
  }

  /**
   * Last child selector
   */
  static lastChild(selector: string): LocatorStrategy {
    return { type: 'css', value: `${selector}:last-child` };
  }

  /**
   * Contains text (XPath)
   */
  static containsText(text: string): LocatorStrategy {
    return { type: 'xpath', value: `//*[contains(text(), "${text}")]` };
  }

  /**
   * Attribute contains
   */
  static attributeContains(attr: string, value: string): LocatorStrategy {
    return { type: 'css', value: `[${attr}*="${value}"]` };
  }

  /**
   * Attribute starts with
   */
  static attributeStartsWith(attr: string, value: string): LocatorStrategy {
    return { type: 'css', value: `[${attr}^="${value}"]` };
  }

  /**
   * Attribute ends with
   */
  static attributeEndsWith(attr: string, value: string): LocatorStrategy {
    return { type: 'css', value: `[${attr}$="${value}"]` };
  }

  /**
   * Has attribute
   */
  static hasAttribute(attr: string): LocatorStrategy {
    return { type: 'css', value: `[${attr}]` };
  }

  /**
   * Chain multiple selectors (descendant)
   */
  static chain(...selectors: string[]): LocatorStrategy {
    return { type: 'css', value: selectors.join(' ') };
  }

  /**
   * Direct child selector
   */
  static child(parent: string, child: string): LocatorStrategy {
    return { type: 'css', value: `${parent} > ${child}` };
  }

  /**
   * Adjacent sibling selector
   */
  static adjacent(first: string, second: string): LocatorStrategy {
    return { type: 'css', value: `${first} + ${second}` };
  }

  /**
   * General sibling selector
   */
  static sibling(first: string, second: string): LocatorStrategy {
    return { type: 'css', value: `${first} ~ ${second}` };
  }

  /**
   * Multiple selectors (OR)
   */
  static or(...selectors: string[]): LocatorStrategy {
    return { type: 'css', value: selectors.join(', ') };
  }

  /**
   * Not selector
   */
  static not(selector: string, notSelector: string): LocatorStrategy {
    return { type: 'css', value: `${selector}:not(${notSelector})` };
  }

  /**
   * Visible only
   */
  static visible(selector: string): LocatorStrategy {
    return { type: 'css', value: `${selector}:visible` };
  }

  /**
   * Custom locator
   */
  static custom(value: string, type: LocatorStrategy['type'] = 'css'): LocatorStrategy {
    return { type, value };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BY ALIAS (Selenium-style)
// ═══════════════════════════════════════════════════════════════════════════════

export const By = LocatorFactory;

// ═══════════════════════════════════════════════════════════════════════════════
// LOCATOR BUILDER (Fluent API)
// ═══════════════════════════════════════════════════════════════════════════════

export class LocatorBuilder {
  private strategies: LocatorStrategy[] = [];
  private currentSelector = '';

  /**
   * Start with CSS selector
   */
  css(selector: string): this {
    this.currentSelector = selector;
    return this;
  }

  /**
   * Filter by attribute
   */
  withAttribute(attr: string, value?: string): this {
    if (value !== undefined) {
      this.currentSelector += `[${attr}="${value}"]`;
    } else {
      this.currentSelector += `[${attr}]`;
    }
    return this;
  }

  /**
   * Filter by class
   */
  withClass(className: string): this {
    this.currentSelector += `.${className}`;
    return this;
  }

  /**
   * Filter by ID
   */
  withId(id: string): this {
    this.currentSelector += `#${id}`;
    return this;
  }

  /**
   * Filter by nth-child
   */
  nth(n: number): this {
    this.currentSelector += `:nth-child(${n})`;
    return this;
  }

  /**
   * Filter first
   */
  first(): this {
    this.currentSelector += ':first-child';
    return this;
  }

  /**
   * Filter last
   */
  last(): this {
    this.currentSelector += ':last-child';
    return this;
  }

  /**
   * Child selector
   */
  find(selector: string): this {
    this.currentSelector += ` ${selector}`;
    return this;
  }

  /**
   * Direct child
   */
  directChild(selector: string): this {
    this.currentSelector += ` > ${selector}`;
    return this;
  }

  /**
   * Add as alternative
   */
  or(): this {
    if (this.currentSelector) {
      this.strategies.push({ type: 'css', value: this.currentSelector });
      this.currentSelector = '';
    }
    return this;
  }

  /**
   * Build locator strategy
   */
  build(): LocatorStrategy {
    if (this.currentSelector) {
      this.strategies.push({ type: 'css', value: this.currentSelector });
    }

    if (this.strategies.length === 0) {
      throw new Error('No locator defined');
    }

    if (this.strategies.length === 1) {
      return this.strategies[0];
    }

    // Return combined selector
    return {
      type: 'css',
      value: this.strategies.map(s => s.value).join(', '),
    };
  }

  /**
   * Build all strategies (for self-healing)
   */
  buildAll(): LocatorStrategy[] {
    if (this.currentSelector) {
      this.strategies.push({ type: 'css', value: this.currentSelector });
    }
    return [...this.strategies];
  }
}

/**
 * Create new locator builder
 */
export function locator(): LocatorBuilder {
  return new LocatorBuilder();
}

export default { LocatorFactory, By, LocatorBuilder, locator };
