/**
 * 🧠 QANTUM HYBRID - Legacy Test Adapter
 * Използва съществуващите 1000+ теста с новия framework
 */

import { createQA, QAntum, MMConfig } from '../index.js';

// ============== SELENIUM TO PLAYWRIGHT ADAPTER ==============

/**
 * Адаптира Selenium WebDriver API към QANTUM Hybrid
 */
export class SeleniumAdapter {
  private mm: QAntum;

  constructor(mm: QAntum) {
    this.mm = mm;
  }

  /**
   * Selenium: driver.get(url)
   */
  async get(url: string): Promise<void> {
    await this.mm.visit(url);
  }

  /**
   * Selenium: driver.findElement(By.css(selector))
   */
  findElement(locator: { css?: string; xpath?: string; id?: string; name?: string }) {
    const selector = this.convertLocator(locator);
    return new SeleniumElement(this.mm, selector);
  }

  /**
   * Selenium: driver.findElements(By.css(selector))
   */
  async findElements(locator: { css?: string; xpath?: string }) {
    const selector = this.convertLocator(locator);
    const page = this.mm.getPage();
    const count = await page.locator(selector).count();
    const elements: SeleniumElement[] = [];
    for (let i = 0; i < count; i++) {
      elements.push(new SeleniumElement(this.mm, `${selector} >> nth=${i}`));
    }
    return elements;
  }

  /**
   * Selenium: driver.wait(until.elementLocated(...))
   */
  async wait(condition: () => Promise<boolean>, timeout = 10000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) return;
      await new Promise(r => setTimeout(r, 100));
    }
    throw new Error(`Wait timeout after ${timeout}ms`);
  }

  /**
   * Selenium: driver.getTitle()
   */
  async getTitle(): Promise<string> {
    return await this.mm.getTitle();
  }

  /**
   * Selenium: driver.getCurrentUrl()
   */
  getCurrentUrl(): string {
    return this.mm.getUrl();
  }

  /**
   * Selenium: driver.takeScreenshot()
   */
  async takeScreenshot(): Promise<string> {
    return await this.mm.screenshot();
  }

  /**
   * Selenium: driver.quit()
   */
  async quit(): Promise<void> {
    await this.mm.close();
  }

  /**
   * Конвертира Selenium локатор към CSS/XPath
   */
  private convertLocator(locator: { css?: string; xpath?: string; id?: string; name?: string }): string {
    if (locator.css) return locator.css;
    if (locator.xpath) return `xpath=${locator.xpath}`;
    if (locator.id) return `#${locator.id}`;
    if (locator.name) return `[name="${locator.name}"]`;
    throw new Error('Unknown locator type');
  }
}

/**
 * Selenium Element wrapper
 */
class SeleniumElement {
  private mm: QAntum;
  private selector: string;

  constructor(mm: QAntum, selector: string) {
    this.mm = mm;
    this.selector = selector;
  }

  async click(): Promise<void> {
    await this.mm.get(this.selector).click();
  }

  async sendKeys(text: string): Promise<void> {
    await this.mm.get(this.selector).type(text);
  }

  async getText(): Promise<string> {
    return await this.mm.get(this.selector).getText();
  }

  async getAttribute(name: string): Promise<string | null> {
    return await this.mm.get(this.selector).getAttribute(name);
  }

  async isDisplayed(): Promise<boolean> {
    return await this.mm.get(this.selector).isVisible();
  }

  async clear(): Promise<void> {
    await this.mm.get(this.selector).type('', { clear: true });
  }
}

// ============== CYPRESS TO PLAYWRIGHT ADAPTER ==============

/**
 * Адаптира Cypress API към QANTUM Hybrid
 */
export class CypressAdapter {
  private mm: QAntum;

  constructor(mm: QAntum) {
    this.mm = mm;
  }

  /**
   * cy.visit(url)
   */
  visit(url: string) {
    return {
      then: async (callback?: () => void) => {
        await this.mm.visit(url);
        callback?.();
      }
    };
  }

  /**
   * cy.get(selector)
   */
  get(selector: string) {
    return new CypressChain(this.mm, selector);
  }

  /**
   * cy.contains(text)
   */
  contains(text: string) {
    return new CypressChain(this.mm, `text="${text}"`);
  }

  /**
   * cy.intercept(url, response)
   */
  async intercept(url: string | RegExp, response?: unknown) {
    if (response) {
      await this.mm.stub(url, response);
    }
    return this;
  }

  /**
   * cy.wait(ms)
   */
  async wait(ms: number): Promise<void> {
    await this.mm.pause(ms);
  }

  /**
   * cy.screenshot()
   */
  async screenshot(name?: string): Promise<string> {
    return await this.mm.screenshot(name);
  }
}

/**
 * Cypress chain wrapper
 */
class CypressChain {
  private mm: QAntum;
  private selector: string;

  constructor(mm: QAntum, selector: string) {
    this.mm = mm;
    this.selector = selector;
  }

  async click() {
    await this.mm.get(this.selector).click();
    return this;
  }

  async type(text: string) {
    await this.mm.get(this.selector).type(text);
    return this;
  }

  async should(assertion: string, expected?: unknown) {
    await this.mm.get(this.selector).should(assertion, expected);
    return this;
  }

  async clear() {
    await this.mm.get(this.selector).type('', { clear: true });
    return this;
  }

  first() {
    this.selector = `${this.selector} >> nth=0`;
    return this;
  }

  last() {
    this.selector = `${this.selector} >> nth=-1`;
    return this;
  }

  eq(index: number) {
    this.selector = `${this.selector} >> nth=${index}`;
    return this;
  }
}

// ============== BUILDER (Selenium-style) ==============

/**
 * Selenium Builder pattern за съвместимост
 */
export class Builder {
  private config: Partial<MMConfig> = {};
  private browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium';

  forBrowser(browser: string): Builder {
    if (browser === 'chrome') this.browserType = 'chromium';
    else if (browser === 'firefox') this.browserType = 'firefox';
    else if (browser === 'safari') this.browserType = 'webkit';
    return this;
  }

  setChromeOptions(options: { headless?: boolean }): Builder {
    this.config.browser = {
      browser: this.browserType,
      headless: options.headless ?? true,
      timeout: 30000
    };
    return this;
  }

  async build(): Promise<SeleniumAdapter> {
    const mm = createQA(this.config);
    await mm.launch();
    return new SeleniumAdapter(mm);
  }
}

// ============== BY (Selenium-style locators) ==============

export const By = {
  css: (selector: string) => ({ css: selector }),
  xpath: (xpath: string) => ({ xpath }),
  id: (id: string) => ({ id }),
  name: (name: string) => ({ name }),
  className: (className: string) => ({ css: `.${className}` }),
  tagName: (tag: string) => ({ css: tag }),
  linkText: (text: string) => ({ css: `a:has-text("${text}")` }),
  partialLinkText: (text: string) => ({ css: `a:has-text("${text}")` })
};

// ============== UNTIL (Selenium-style waits) ==============

export const until = {
  elementLocated: (locator: { css?: string }) => async (driver: SeleniumAdapter) => {
    try {
      await driver.findElement(locator);
      return true;
    } catch {
      return false;
    }
  },
  elementIsVisible: (element: SeleniumElement) => async () => {
    return await element.isDisplayed();
  },
  titleContains: (text: string) => async (driver: SeleniumAdapter) => {
    const title = await driver.getTitle();
    return title.includes(text);
  },
  urlContains: (text: string) => (driver: SeleniumAdapter) => {
    return driver.getCurrentUrl().includes(text);
  }
};
