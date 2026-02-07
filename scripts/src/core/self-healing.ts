/**
 * 🧠 QANTUM HYBRID - Self-Healing Engine
 * Автоматично възстановяване на счупени селектори
 */

import type { Page, Locator } from 'playwright';

export interface HealingResult {
  healed: boolean;
  originalSelector: string;
  newSelector?: string;
  confidence: number;
  method: 'exact' | 'text' | 'testId' | 'role' | 'xpath' | 'fuzzy';
}

export class SelfHealingEngine {
  private healingHistory: Map<string, string> = new Map();
  
  /**
   * Опитва да намери елемент с различни стратегии
   */
  async heal(page: Page, selector: string): Promise<HealingResult> {
    // 1. Първо пробвай оригиналния селектор
    const original = page.locator(selector);
    if (await this.isVisible(original)) {
      return { healed: false, originalSelector: selector, confidence: 1, method: 'exact' };
    }

    // 2. Провери кеша за healing
    const cached = this.healingHistory.get(selector);
    if (cached) {
      const cachedLocator = page.locator(cached);
      if (await this.isVisible(cachedLocator)) {
        return { healed: true, originalSelector: selector, newSelector: cached, confidence: 0.9, method: 'exact' };
      }
    }

    // 3. Стратегии за healing
    const strategies = [
      () => this.healByTestId(page, selector),
      () => this.healByText(page, selector),
      () => this.healByRole(page, selector),
      () => this.healByPartialMatch(page, selector),
    ];

    for (const strategy of strategies) {
      const result = await strategy();
      if (result) {
        this.healingHistory.set(selector, result.newSelector!);
        return result;
      }
    }

    return { healed: false, originalSelector: selector, confidence: 0, method: 'exact' };
  }

  /**
   * Търси по data-testid
   */
  private async healByTestId(page: Page, selector: string): Promise<HealingResult | null> {
    // Извлечи възможен testId от селектора
    const testIdMatch = selector.match(/data-testid[=~*^$]*["']?([^"'\]]+)/);
    if (testIdMatch) {
      const testId = testIdMatch[1];
      const locator = page.getByTestId(testId);
      if (await this.isVisible(locator)) {
        return {
          healed: true,
          originalSelector: selector,
          newSelector: `[data-testid="${testId}"]`,
          confidence: 0.95,
          method: 'testId'
        };
      }
    }
    return null;
  }

  /**
   * Търси по текст
   */
  private async healByText(page: Page, selector: string): Promise<HealingResult | null> {
    // Извлечи текст от селектора (напр. button:has-text("Login"))
    const textMatch = selector.match(/has-text\(["']([^"']+)["']\)|:text\(["']([^"']+)["']\)/);
    if (textMatch) {
      const text = textMatch[1] || textMatch[2];
      const locator = page.getByText(text, { exact: false });
      if (await this.isVisible(locator)) {
        return {
          healed: true,
          originalSelector: selector,
          newSelector: `text="${text}"`,
          confidence: 0.8,
          method: 'text'
        };
      }
    }
    return null;
  }

  /**
   * Търси по ARIA role
   */
  private async healByRole(page: Page, selector: string): Promise<HealingResult | null> {
    const tagMatch = selector.match(/^(button|input|a|link|checkbox|radio)/i);
    if (tagMatch) {
      const tag = tagMatch[1].toLowerCase();
      const roleMap: Record<string, string> = {
        'button': 'button',
        'a': 'link',
        'link': 'link',
        'input': 'textbox',
        'checkbox': 'checkbox',
        'radio': 'radio'
      };
      const role = roleMap[tag];
      if (role) {
        const locator = page.getByRole(role as any);
        const count = await locator.count();
        if (count === 1 && await this.isVisible(locator)) {
          return {
            healed: true,
            originalSelector: selector,
            newSelector: `role=${role}`,
            confidence: 0.7,
            method: 'role'
          };
        }
      }
    }
    return null;
  }

  /**
   * Частично съвпадение (fuzzy)
   */
  private async healByPartialMatch(page: Page, selector: string): Promise<HealingResult | null> {
    // Опитай да намериш по клас или id частично
    const classMatch = selector.match(/\.([a-zA-Z0-9_-]+)/);
    if (classMatch) {
      const className = classMatch[1];
      const locator = page.locator(`[class*="${className}"]`);
      const count = await locator.count();
      if (count === 1 && await this.isVisible(locator)) {
        return {
          healed: true,
          originalSelector: selector,
          newSelector: `[class*="${className}"]`,
          confidence: 0.6,
          method: 'fuzzy'
        };
      }
    }
    return null;
  }

  /**
   * Проверява дали елементът е видим
   */
  private async isVisible(locator: Locator): Promise<boolean> {
    try {
      const count = await locator.count();
      if (count === 0) return false;
      return await locator.first().isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Изчисти историята
   */
  clearHistory(): void {
    this.healingHistory.clear();
  }

  /**
   * Вземи статистика
   */
  getStats(): { total: number; healed: number } {
    return {
      total: this.healingHistory.size,
      healed: this.healingHistory.size
    };
  }
}

// Singleton instance
export const selfHealer = new SelfHealingEngine();
