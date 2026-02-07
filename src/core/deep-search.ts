/**
 * 🧠 QANTUM HYBRID - Deep Search Engine
 * Пробива Shadow DOM и Iframes автоматично
 */

import type { Page, Locator } from 'playwright';

export interface DeepSearchResult {
  found: boolean;
  locator?: Locator;
  path: string[];
  inShadow: boolean;
  inIframe: boolean;
}

export class DeepSearchEngine {
  private maxDepth = 5;
  
  /**
   * Търси елемент навсякъде - Shadow DOM, Iframes, навсякъде
   */
  async find(page: Page, selector: string): Promise<DeepSearchResult> {
    // 1. Първо пробвай директно
    const direct = page.locator(selector);
    if (await this.exists(direct)) {
      return { found: true, locator: direct, path: ['page'], inShadow: false, inIframe: false };
    }

    // 2. Търси в Shadow DOM
    const shadowResult = await this.searchShadowDOM(page, selector);
    if (shadowResult.found) {
      return shadowResult;
    }

    // 3. Търси в Iframes
    const iframeResult = await this.searchIframes(page, selector);
    if (iframeResult.found) {
      return iframeResult;
    }

    return { found: false, path: [], inShadow: false, inIframe: false };
  }

  /**
   * Рекурсивно търсене в Shadow DOM
   */
  private async searchShadowDOM(page: Page, selector: string, depth = 0): Promise<DeepSearchResult> {
    if (depth > this.maxDepth) {
      return { found: false, path: [], inShadow: false, inIframe: false };
    }

    // Намери всички елементи със Shadow Root
    const shadowHosts = await page.locator('*').evaluateAll((elements) => {
      return elements
        .filter(el => el.shadowRoot)
        .map((el, i) => ({
          index: i,
          tagName: el.tagName.toLowerCase(),
          id: el.id || '',
          className: el.className || ''
        }));
    });

    for (const host of shadowHosts) {
      // Създай селектор за хоста
      let hostSelector = host.tagName;
      if (host.id) hostSelector += `#${host.id}`;
      else if (host.className) hostSelector += `.${host.className.split(' ')[0]}`;

      // Пробвай да намериш в shadow root чрез evaluate
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const found = await page.evaluate(`
        (function() {
          const hostEl = document.querySelector('${hostSelector}');
          if (!hostEl || !hostEl.shadowRoot) return false;
          const target = hostEl.shadowRoot.querySelector('${selector}');
          return !!target;
        })()
      `);

      if (found) {
        // Playwright поддържа >> за Shadow DOM piercing
        const locator = page.locator(`${hostSelector} >> ${selector}`);
        return {
          found: true,
          locator,
          path: ['page', `shadow(${hostSelector})`],
          inShadow: true,
          inIframe: false
        };
      }
    }

    return { found: false, path: [], inShadow: false, inIframe: false };
  }

  /**
   * Търсене в Iframes
   */
  private async searchIframes(page: Page, selector: string, depth = 0): Promise<DeepSearchResult> {
    if (depth > this.maxDepth) {
      return { found: false, path: [], inShadow: false, inIframe: false };
    }

    // Вземи брой iframes
    const count = await page.locator('iframe').count();
    
    for (let i = 0; i < count; i++) {
      const frame = page.frameLocator(`iframe >> nth=${i}`);
      
      try {
        const locator = frame.locator(selector);
        const exists = await locator.count() > 0;
        
        if (exists) {
          return {
            found: true,
            locator,
            path: ['page', `iframe[${i}]`],
            inShadow: false,
            inIframe: true
          };
        }
      } catch {
        // Iframe може да е cross-origin
        continue;
      }
    }

    return { found: false, path: [], inShadow: false, inIframe: false };
  }

  /**
   * Проверява дали локаторът съществува
   */
  private async exists(locator: Locator): Promise<boolean> {
    try {
      return await locator.count() > 0;
    } catch {
      return false;
    }
  }

  /**
   * Задай максимална дълбочина на търсене
   */
  setMaxDepth(depth: number): void {
    this.maxDepth = depth;
  }
}

export const deepSearch = new DeepSearchEngine();
