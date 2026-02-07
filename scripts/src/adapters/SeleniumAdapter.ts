/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: SELENIUM ADAPTER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Full WebDriver API compatibility layer for migrating from Selenium
 * Drop-in replacement for selenium-webdriver with Playwright backend
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0
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
  Locator,
  Frame,
  ElementHandle
} from 'playwright';

// ═══════════════════════════════════════════════════════════════════════════════
// BY LOCATOR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class By {
  private constructor(
    public readonly using: string,
    public readonly value: string
  ) {}

  static id(id: string): By {
    return new By('id', id);
  }

  static name(name: string): By {
    return new By('name', name);
  }

  static className(className: string): By {
    return new By('className', className);
  }

  static css(selector: string): By {
    return new By('css', selector);
  }

  static xpath(xpath: string): By {
    return new By('xpath', xpath);
  }

  static linkText(text: string): By {
    return new By('linkText', text);
  }

  static partialLinkText(text: string): By {
    return new By('partialLinkText', text);
  }

  static tagName(tagName: string): By {
    return new By('tagName', tagName);
  }

  static js(script: string): By {
    return new By('js', script);
  }

  /**
   * Convert to Playwright selector
   */
  toPlaywright(): string {
    switch (this.using) {
      case 'id':
        return `#${this.value}`;
      case 'name':
        return `[name="${this.value}"]`;
      case 'className':
        return `.${this.value.split(' ').join('.')}`;
      case 'css':
        return this.value;
      case 'xpath':
        return `xpath=${this.value}`;
      case 'linkText':
        return `text="${this.value}"`;
      case 'partialLinkText':
        return `text=${this.value}`;
      case 'tagName':
        return this.value;
      default:
        return this.value;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// KEY CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export const Key = {
  NULL: '\uE000',
  CANCEL: '\uE001',
  HELP: '\uE002',
  BACK_SPACE: 'Backspace',
  TAB: 'Tab',
  CLEAR: '\uE005',
  RETURN: 'Enter',
  ENTER: 'Enter',
  SHIFT: 'Shift',
  CONTROL: 'Control',
  ALT: 'Alt',
  PAUSE: 'Pause',
  ESCAPE: 'Escape',
  SPACE: ' ',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  END: 'End',
  HOME: 'Home',
  ARROW_LEFT: 'ArrowLeft',
  LEFT: 'ArrowLeft',
  ARROW_UP: 'ArrowUp',
  UP: 'ArrowUp',
  ARROW_RIGHT: 'ArrowRight',
  RIGHT: 'ArrowRight',
  ARROW_DOWN: 'ArrowDown',
  DOWN: 'ArrowDown',
  INSERT: 'Insert',
  DELETE: 'Delete',
  SEMICOLON: ';',
  EQUALS: '=',
  NUMPAD0: '0',
  NUMPAD1: '1',
  NUMPAD2: '2',
  NUMPAD3: '3',
  NUMPAD4: '4',
  NUMPAD5: '5',
  NUMPAD6: '6',
  NUMPAD7: '7',
  NUMPAD8: '8',
  NUMPAD9: '9',
  MULTIPLY: '*',
  ADD: '+',
  SEPARATOR: ',',
  SUBTRACT: '-',
  DECIMAL: '.',
  DIVIDE: '/',
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12',
  META: 'Meta',
  COMMAND: 'Meta',

  chord(...keys: string[]): string {
    return keys.join('');
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// WEB ELEMENT CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class WebElement {
  private locator: Locator;
  private driver: WebDriver;

  constructor(locator: Locator, driver: WebDriver) {
    this.locator = locator;
    this.driver = driver;
  }

  /**
   * Click element
   */
  async click(): Promise<void> {
    await this.locator.click();
  }

  /**
   * Send keys to element
   */
  async sendKeys(...keys: string[]): Promise<void> {
    const text = keys.join('');
    
    // Check for special keys
    if (text.includes(Key.ENTER)) {
      await this.locator.press('Enter');
    } else if (text.includes(Key.TAB)) {
      await this.locator.press('Tab');
    } else if (text.includes(Key.ESCAPE)) {
      await this.locator.press('Escape');
    } else {
      await this.locator.fill(text);
    }
  }

  /**
   * Clear element
   */
  async clear(): Promise<void> {
    await this.locator.clear();
  }

  /**
   * Get text content
   */
  async getText(): Promise<string> {
    return (await this.locator.textContent()) || '';
  }

  /**
   * Get attribute
   */
  async getAttribute(name: string): Promise<string | null> {
    return this.locator.getAttribute(name);
  }

  /**
   * Get CSS property
   */
  async getCssValue(propertyName: string): Promise<string> {
    return this.locator.evaluate((el, prop) => {
      return window.getComputedStyle(el).getPropertyValue(prop);
    }, propertyName);
  }

  /**
   * Get tag name
   */
  async getTagName(): Promise<string> {
    return this.locator.evaluate(el => el.tagName.toLowerCase());
  }

  /**
   * Check if displayed
   */
  async isDisplayed(): Promise<boolean> {
    return this.locator.isVisible();
  }

  /**
   * Check if enabled
   */
  async isEnabled(): Promise<boolean> {
    return this.locator.isEnabled();
  }

  /**
   * Check if selected
   */
  async isSelected(): Promise<boolean> {
    return this.locator.isChecked();
  }

  /**
   * Submit form
   */
  async submit(): Promise<void> {
    await this.locator.evaluate((el) => {
      const form = el.closest('form');
      if (form) form.submit();
    });
  }

  /**
   * Get element rect
   */
  async getRect(): Promise<{ x: number; y: number; width: number; height: number }> {
    const box = await this.locator.boundingBox();
    return box || { x: 0, y: 0, width: 0, height: 0 };
  }

  /**
   * Get location
   */
  async getLocation(): Promise<{ x: number; y: number }> {
    const rect = await this.getRect();
    return { x: rect.x, y: rect.y };
  }

  /**
   * Get size
   */
  async getSize(): Promise<{ width: number; height: number }> {
    const rect = await this.getRect();
    return { width: rect.width, height: rect.height };
  }

  /**
   * Find child element
   */
  async findElement(by: By): Promise<WebElement> {
    const selector = by.toPlaywright();
    const child = this.locator.locator(selector).first();
    return new WebElement(child, this.driver);
  }

  /**
   * Find child elements
   */
  async findElements(by: By): Promise<WebElement[]> {
    const selector = by.toPlaywright();
    const children = this.locator.locator(selector);
    const count = await children.count();
    const elements: WebElement[] = [];
    
    for (let i = 0; i < count; i++) {
      elements.push(new WebElement(children.nth(i), this.driver));
    }
    
    return elements;
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(): Promise<Buffer> {
    return this.locator.screenshot();
  }

  /**
   * Get ID
   */
  async getId(): Promise<string> {
    return (await this.getAttribute('id')) || '';
  }

  /**
   * Get underlying Playwright locator
   */
  getLocator(): Locator {
    return this.locator;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPECTED CONDITIONS (until)
// ═══════════════════════════════════════════════════════════════════════════════

export const until = {
  elementLocated(by: By): (driver: WebDriver) => Promise<WebElement> {
    return async (driver: WebDriver) => {
      return driver.findElement(by);
    };
  },

  elementsLocated(by: By): (driver: WebDriver) => Promise<WebElement[]> {
    return async (driver: WebDriver) => {
      const elements = await driver.findElements(by);
      if (elements.length > 0) return elements;
      throw new Error('Elements not found');
    };
  },

  elementIsVisible(element: WebElement): () => Promise<WebElement> {
    return async () => {
      if (await element.isDisplayed()) return element;
      throw new Error('Element not visible');
    };
  },

  elementIsNotVisible(element: WebElement): () => Promise<boolean> {
    return async () => {
      if (!(await element.isDisplayed())) return true;
      throw new Error('Element still visible');
    };
  },

  elementIsEnabled(element: WebElement): () => Promise<WebElement> {
    return async () => {
      if (await element.isEnabled()) return element;
      throw new Error('Element not enabled');
    };
  },

  elementIsDisabled(element: WebElement): () => Promise<WebElement> {
    return async () => {
      if (!(await element.isEnabled())) return element;
      throw new Error('Element still enabled');
    };
  },

  elementIsSelected(element: WebElement): () => Promise<WebElement> {
    return async () => {
      if (await element.isSelected()) return element;
      throw new Error('Element not selected');
    };
  },

  elementTextIs(element: WebElement, text: string): () => Promise<boolean> {
    return async () => {
      if ((await element.getText()) === text) return true;
      throw new Error('Text does not match');
    };
  },

  elementTextContains(element: WebElement, text: string): () => Promise<boolean> {
    return async () => {
      if ((await element.getText()).includes(text)) return true;
      throw new Error('Text not found');
    };
  },

  titleIs(title: string): (driver: WebDriver) => Promise<boolean> {
    return async (driver: WebDriver) => {
      if (await driver.getTitle() === title) return true;
      throw new Error('Title does not match');
    };
  },

  titleContains(text: string): (driver: WebDriver) => Promise<boolean> {
    return async (driver: WebDriver) => {
      if ((await driver.getTitle()).includes(text)) return true;
      throw new Error('Title does not contain text');
    };
  },

  urlIs(url: string): (driver: WebDriver) => Promise<boolean> {
    return async (driver: WebDriver) => {
      if (await driver.getCurrentUrl() === url) return true;
      throw new Error('URL does not match');
    };
  },

  urlContains(text: string): (driver: WebDriver) => Promise<boolean> {
    return async (driver: WebDriver) => {
      if ((await driver.getCurrentUrl()).includes(text)) return true;
      throw new Error('URL does not contain text');
    };
  },

  alertIsPresent(): (driver: WebDriver) => Promise<Alert> {
    return async (driver: WebDriver) => {
      // Playwright handles dialogs differently
      throw new Error('Use page.on("dialog") for alerts in Playwright');
    };
  },

  stalenessOf(element: WebElement): () => Promise<boolean> {
    return async () => {
      try {
        await element.getTagName();
        throw new Error('Element still attached');
      } catch {
        return true;
      }
    };
  },

  elementToBeClickable(by: By): (driver: WebDriver) => Promise<WebElement> {
    return async (driver: WebDriver) => {
      const element = await driver.findElement(by);
      if (await element.isDisplayed() && await element.isEnabled()) {
        return element;
      }
      throw new Error('Element not clickable');
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ALERT CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class Alert {
  private dialog: any;

  constructor(dialog: any) {
    this.dialog = dialog;
  }

  async accept(): Promise<void> {
    await this.dialog.accept();
  }

  async dismiss(): Promise<void> {
    await this.dialog.dismiss();
  }

  async getText(): Promise<string> {
    return this.dialog.message();
  }

  async sendKeys(text: string): Promise<void> {
    await this.dialog.accept(text);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIONS CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class Actions {
  private driver: WebDriver;
  private actions: Array<() => Promise<void>> = [];

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  click(element?: WebElement): Actions {
    this.actions.push(async () => {
      if (element) {
        await element.click();
      } else {
        await this.driver.getPage().mouse.click(0, 0);
      }
    });
    return this;
  }

  doubleClick(element?: WebElement): Actions {
    this.actions.push(async () => {
      if (element) {
        await element.getLocator().dblclick();
      } else {
        await this.driver.getPage().mouse.dblclick(0, 0);
      }
    });
    return this;
  }

  contextClick(element?: WebElement): Actions {
    this.actions.push(async () => {
      if (element) {
        await element.getLocator().click({ button: 'right' });
      } else {
        await this.driver.getPage().mouse.click(0, 0, { button: 'right' });
      }
    });
    return this;
  }

  moveToElement(element: WebElement, xOffset?: number, yOffset?: number): Actions {
    this.actions.push(async () => {
      const rect = await element.getRect();
      const x = rect.x + (xOffset || rect.width / 2);
      const y = rect.y + (yOffset || rect.height / 2);
      await this.driver.getPage().mouse.move(x, y);
    });
    return this;
  }

  sendKeys(...keys: string[]): Actions {
    this.actions.push(async () => {
      const text = keys.join('');
      await this.driver.getPage().keyboard.type(text);
    });
    return this;
  }

  keyDown(key: string): Actions {
    this.actions.push(async () => {
      await this.driver.getPage().keyboard.down(key);
    });
    return this;
  }

  keyUp(key: string): Actions {
    this.actions.push(async () => {
      await this.driver.getPage().keyboard.up(key);
    });
    return this;
  }

  dragAndDrop(source: WebElement, target: WebElement): Actions {
    this.actions.push(async () => {
      await source.getLocator().dragTo(target.getLocator());
    });
    return this;
  }

  pause(ms: number): Actions {
    this.actions.push(async () => {
      await new Promise(r => setTimeout(r, ms));
    });
    return this;
  }

  async perform(): Promise<void> {
    for (const action of this.actions) {
      await action();
    }
    this.actions = [];
  }

  clear(): Actions {
    this.actions = [];
    return this;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TARGET LOCATOR (for switching)
// ═══════════════════════════════════════════════════════════════════════════════

export class TargetLocator {
  private driver: WebDriver;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async frame(idOrElement: string | number | WebElement): Promise<WebDriver> {
    const page = this.driver.getPage();
    
    if (typeof idOrElement === 'number') {
      const frames = page.frames();
      if (frames[idOrElement]) {
        // Playwright doesn't switch frames the same way
        // Store the frame reference
      }
    } else if (typeof idOrElement === 'string') {
      await page.frameLocator(`[name="${idOrElement}"], #${idOrElement}`);
    } else {
      // WebElement - get frame from element
    }
    
    return this.driver;
  }

  async defaultContent(): Promise<WebDriver> {
    // Reset to main frame
    return this.driver;
  }

  async parentFrame(): Promise<WebDriver> {
    return this.driver;
  }

  async window(handle: string): Promise<WebDriver> {
    const context = this.driver.getContext();
    const pages = context.pages();
    const targetPage = pages.find(p => p.url() === handle || p.url().includes(handle));
    
    if (targetPage) {
      (this.driver as any).page = targetPage;
    }
    
    return this.driver;
  }

  async newWindow(type: 'tab' | 'window' = 'tab'): Promise<WebDriver> {
    const context = this.driver.getContext();
    const newPage = await context.newPage();
    (this.driver as any).page = newPage;
    return this.driver;
  }

  async alert(): Promise<Alert> {
    // This is a simplified implementation
    // Real alert handling requires dialog event listeners
    throw new Error('Use page.on("dialog") for handling alerts in Playwright');
  }

  async activeElement(): Promise<WebElement> {
    const page = this.driver.getPage();
    const activeSelector = ':focus';
    return new WebElement(page.locator(activeSelector), this.driver);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTIONS (Cookies, Timeouts, Window)
// ═══════════════════════════════════════════════════════════════════════════════

export class Options {
  private driver: WebDriver;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async addCookie(cookie: {
    name: string;
    value: string;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    expiry?: number;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }): Promise<void> {
    const context = this.driver.getContext();
    await context.addCookies([{
      name: cookie.name,
      value: cookie.value,
      path: cookie.path || '/',
      domain: cookie.domain,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      expires: cookie.expiry,
      sameSite: cookie.sameSite
    }]);
  }

  async getCookie(name: string): Promise<any | null> {
    const context = this.driver.getContext();
    const cookies = await context.cookies();
    return cookies.find(c => c.name === name) || null;
  }

  async getCookies(): Promise<any[]> {
    const context = this.driver.getContext();
    return context.cookies();
  }

  async deleteAllCookies(): Promise<void> {
    const context = this.driver.getContext();
    await context.clearCookies();
  }

  async deleteCookie(name: string): Promise<void> {
    // Playwright doesn't have deleteCookie, clear and re-add
    const context = this.driver.getContext();
    const cookies = await context.cookies();
    await context.clearCookies();
    await context.addCookies(cookies.filter(c => c.name !== name));
  }

  timeouts(): Timeouts {
    return new Timeouts(this.driver);
  }

  window(): WindowOptions {
    return new WindowOptions(this.driver);
  }
}

export class Timeouts {
  private driver: WebDriver;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async implicitlyWait(ms: number): Promise<void> {
    this.driver.getContext().setDefaultTimeout(ms);
  }

  async setScriptTimeout(ms: number): Promise<void> {
    // Playwright doesn't have separate script timeout
  }

  async pageLoadTimeout(ms: number): Promise<void> {
    this.driver.getContext().setDefaultNavigationTimeout(ms);
  }
}

export class WindowOptions {
  private driver: WebDriver;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async getRect(): Promise<{ x: number; y: number; width: number; height: number }> {
    const viewport = this.driver.getPage().viewportSize();
    return {
      x: 0,
      y: 0,
      width: viewport?.width || 1280,
      height: viewport?.height || 720
    };
  }

  async setRect(rect: { x?: number; y?: number; width?: number; height?: number }): Promise<void> {
    if (rect.width && rect.height) {
      await this.driver.getPage().setViewportSize({
        width: rect.width,
        height: rect.height
      });
    }
  }

  async maximize(): Promise<void> {
    await this.driver.getPage().setViewportSize({ width: 1920, height: 1080 });
  }

  async minimize(): Promise<void> {
    // Not directly supported in Playwright
  }

  async fullscreen(): Promise<void> {
    await this.driver.getPage().setViewportSize({ width: 1920, height: 1080 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

export class Navigation {
  private driver: WebDriver;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async to(url: string): Promise<void> {
    await this.driver.getPage().goto(url);
  }

  async back(): Promise<void> {
    await this.driver.getPage().goBack();
  }

  async forward(): Promise<void> {
    await this.driver.getPage().goForward();
  }

  async refresh(): Promise<void> {
    await this.driver.getPage().reload();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEB DRIVER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export interface WebDriverOptions {
  browser?: 'chrome' | 'chromium' | 'firefox' | 'safari' | 'webkit' | 'edge';
  headless?: boolean;
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  args?: string[];
  userAgent?: string;
  viewport?: { width: number; height: number };
  timeout?: number;
}

export class WebDriver extends EventEmitter {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private options: WebDriverOptions;

  constructor(options: WebDriverOptions = {}) {
    super();
    this.options = {
      browser: 'chromium',
      headless: false,
      timeout: 30000,
      ...options
    };
  }

  /**
   * Build and launch driver
   */
  async build(): Promise<WebDriver> {
    const browserType = this.getBrowserType();
    
    this.browser = await browserType.launch({
      headless: this.options.headless,
      args: this.options.args
    });

    const contextOptions: any = {};
    
    if (this.options.proxy) {
      contextOptions.proxy = this.options.proxy;
    }
    
    if (this.options.userAgent) {
      contextOptions.userAgent = this.options.userAgent;
    }
    
    if (this.options.viewport) {
      contextOptions.viewport = this.options.viewport;
    }

    this.context = await this.browser.newContext(contextOptions);
    this.context.setDefaultTimeout(this.options.timeout || 30000);
    
    this.page = await this.context.newPage();

    return this;
  }

  private getBrowserType() {
    switch (this.options.browser) {
      case 'firefox':
        return firefox;
      case 'safari':
      case 'webkit':
        return webkit;
      default:
        return chromium;
    }
  }

  /**
   * Navigate to URL
   */
  async get(url: string): Promise<void> {
    await this.page!.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page!.url();
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return this.page!.title();
  }

  /**
   * Get page source
   */
  async getPageSource(): Promise<string> {
    return this.page!.content();
  }

  /**
   * Find element
   */
  async findElement(by: By): Promise<WebElement> {
    const selector = by.toPlaywright();
    const locator = this.page!.locator(selector).first();
    await locator.waitFor({ state: 'visible', timeout: this.options.timeout });
    return new WebElement(locator, this);
  }

  /**
   * Find elements
   */
  async findElements(by: By): Promise<WebElement[]> {
    const selector = by.toPlaywright();
    const locators = this.page!.locator(selector);
    const count = await locators.count();
    const elements: WebElement[] = [];
    
    for (let i = 0; i < count; i++) {
      elements.push(new WebElement(locators.nth(i), this));
    }
    
    return elements;
  }

  /**
   * Execute JavaScript
   */
  async executeScript<T = any>(script: string, ...args: any[]): Promise<T> {
    return this.page!.evaluate(script, ...args);
  }

  /**
   * Execute async JavaScript
   */
  async executeAsyncScript<T = any>(script: string, ...args: any[]): Promise<T> {
    return this.page!.evaluate(script, ...args);
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(): Promise<Buffer> {
    return this.page!.screenshot();
  }

  /**
   * Wait for condition
   */
  async wait<T>(
    condition: (driver: WebDriver) => Promise<T>,
    timeout: number = 10000,
    message?: string
  ): Promise<T> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    while (Date.now() - startTime < timeout) {
      try {
        const result = await condition(this);
        return result;
      } catch (error) {
        lastError = error as Error;
        await new Promise(r => setTimeout(r, 100));
      }
    }

    throw new Error(message || lastError?.message || 'Wait timeout');
  }

  /**
   * Sleep
   */
  async sleep(ms: number): Promise<void> {
    await new Promise(r => setTimeout(r, ms));
  }

  /**
   * Get window handle
   */
  async getWindowHandle(): Promise<string> {
    return this.page!.url();
  }

  /**
   * Get all window handles
   */
  async getAllWindowHandles(): Promise<string[]> {
    return this.context!.pages().map(p => p.url());
  }

  /**
   * Close current window
   */
  async close(): Promise<void> {
    await this.page!.close();
    const pages = this.context!.pages();
    if (pages.length > 0) {
      this.page = pages[0];
    }
  }

  /**
   * Quit driver
   */
  async quit(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    this.page = null;
    this.context = null;
    this.browser = null;
  }

  /**
   * Get actions builder
   */
  actions(): Actions {
    return new Actions(this);
  }

  /**
   * Get target locator (for switching)
   */
  switchTo(): TargetLocator {
    return new TargetLocator(this);
  }

  /**
   * Get options (cookies, timeouts)
   */
  manage(): Options {
    return new Options(this);
  }

  /**
   * Get navigation
   */
  navigate(): Navigation {
    return new Navigation(this);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RAW ACCESS
  // ═══════════════════════════════════════════════════════════════════════════

  getPage(): Page {
    if (!this.page) throw new Error('Driver not initialized');
    return this.page;
  }

  getContext(): BrowserContext {
    if (!this.context) throw new Error('Driver not initialized');
    return this.context;
  }

  getBrowser(): Browser {
    if (!this.browser) throw new Error('Driver not initialized');
    return this.browser;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class Builder {
  private options: WebDriverOptions = {};

  forBrowser(browser: string): Builder {
    this.options.browser = browser as any;
    return this;
  }

  setProxy(proxy: { server: string; username?: string; password?: string }): Builder {
    this.options.proxy = proxy;
    return this;
  }

  headless(value: boolean = true): Builder {
    this.options.headless = value;
    return this;
  }

  setChromeOptions(options: any): Builder {
    if (options.args) {
      this.options.args = options.args;
    }
    if (options.headless) {
      this.options.headless = true;
    }
    return this;
  }

  setFirefoxOptions(options: any): Builder {
    if (options.args) {
      this.options.args = options.args;
    }
    return this;
  }

  withCapabilities(caps: any): Builder {
    if (caps.browserName) {
      this.options.browser = caps.browserName;
    }
    return this;
  }

  usingServer(url: string): Builder {
    // For Selenium Grid compatibility - not directly supported
    return this;
  }

  async build(): Promise<WebDriver> {
    const driver = new WebDriver(this.options);
    return driver.build();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  Builder,
  By,
  Key,
  until,
  WebDriver,
  WebElement,
  Actions,
  Alert
};
