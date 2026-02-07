/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🧠 QANTUM HYBRID v1.0.0 - Advanced Self-Healing Engine
 * 15+ healing strategies ported from QANTUM-mind-v8.js
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { Page, Locator } from 'playwright';
import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface HealingStrategy {
  name: string;
  priority: number;
  generate: (original: string, context: ElementContext) => string[];
}

export interface ElementContext {
  id?: string;
  name?: string;
  className?: string;
  text?: string;
  ariaLabel?: string;
  ariaRole?: string;
  placeholder?: string;
  dataTestId?: string;
  tagName?: string;
  type?: string;
  href?: string;
  title?: string;
  value?: string;
  position?: { x: number; y: number };
  dimensions?: { width: number; height: number };
  attributes?: Record<string, string>;
}

export interface HealingResult {
  success: boolean;
  originalSelector: string;
  healedSelector?: string;
  strategyUsed?: string;
  attempts: number;
  timeMs: number;
  context?: ElementContext;
}

export interface HealingConfig {
  enabled: boolean;
  maxAttempts: number;
  timeout: number;
  strategies: string[];
  learnFromSuccess: boolean;
  learnFromFailure: boolean;
  reportEnabled: boolean;
}

export interface HealingRecord {
  timestamp: number;
  originalSelector: string;
  healedSelector: string;
  strategyUsed: string;
  pageUrl: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELF-HEALING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class SelfHealingEngine extends EventEmitter {
  private page?: Page;
  private config: HealingConfig;
  private strategies: Map<string, HealingStrategy> = new Map();
  private healingHistory: HealingRecord[] = [];
  private failedSelectors: Map<string, string[]> = new Map();
  private learnedMappings: Map<string, string> = new Map();

  constructor(config: Partial<HealingConfig> = {}) {
    super();

    this.config = {
      enabled: config.enabled ?? true,
      maxAttempts: config.maxAttempts ?? 15,
      timeout: config.timeout ?? 30000,
      strategies: config.strategies ?? [
        'testId', 'id', 'name', 'aria', 'role', 'text', 
        'placeholder', 'title', 'class', 'xpath', 'css',
        'proximity', 'visual', 'semantic', 'fuzzy'
      ],
      learnFromSuccess: config.learnFromSuccess ?? true,
      learnFromFailure: config.learnFromFailure ?? true,
      reportEnabled: config.reportEnabled ?? true,
    };

    this.registerDefaultStrategies();
  }

  /**
   * Set Playwright page instance
   */
  setPage(page: Page): this {
    this.page = page;
    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 15 HEALING STRATEGIES
  // ═══════════════════════════════════════════════════════════════════════════

  private registerDefaultStrategies(): void {
    // Strategy 1: Test ID (data-testid, data-test, data-cy)
    this.registerStrategy({
      name: 'testId',
      priority: 100,
      generate: (original, ctx) => {
        const alternatives: string[] = [];
        if (ctx.dataTestId) {
          alternatives.push(`[data-testid="${ctx.dataTestId}"]`);
          alternatives.push(`[data-test="${ctx.dataTestId}"]`);
          alternatives.push(`[data-cy="${ctx.dataTestId}"]`);
          alternatives.push(`[data-test-id="${ctx.dataTestId}"]`);
        }
        // Extract from original
        const testIdMatch = original.match(/data-testid=["']([^"']+)["']/);
        if (testIdMatch) {
          alternatives.push(`[data-testid="${testIdMatch[1]}"]`);
          alternatives.push(`[data-testid*="${testIdMatch[1]}"]`);
        }
        return alternatives;
      }
    });

    // Strategy 2: ID-based
    this.registerStrategy({
      name: 'id',
      priority: 95,
      generate: (original, ctx) => {
        const alternatives: string[] = [];
        if (ctx.id) {
          alternatives.push(`#${ctx.id}`);
          alternatives.push(`[id="${ctx.id}"]`);
          alternatives.push(`[id*="${ctx.id}"]`);
          alternatives.push(`xpath=//*[@id="${ctx.id}"]`);
        }
        // Extract from original
        if (original.startsWith('#')) {
          const id = original.substring(1);
          alternatives.push(`[id="${id}"]`);
          alternatives.push(`[id*="${id}"]`);
          alternatives.push(`xpath=//*[@id="${id}"]`);
        }
        return alternatives;
      }
    });

    // Strategy 3: Name attribute
    this.registerStrategy({
      name: 'name',
      priority: 90,
      generate: (original, ctx) => {
        const alternatives: string[] = [];
        if (ctx.name) {
          alternatives.push(`[name="${ctx.name}"]`);
          alternatives.push(`[name*="${ctx.name}"]`);
          alternatives.push(`xpath=//*[@name="${ctx.name}"]`);
          alternatives.push(`input[name="${ctx.name}"]`);
          alternatives.push(`select[name="${ctx.name}"]`);
        }
        return alternatives;
      }
    });

    // Strategy 4: ARIA attributes
    this.registerStrategy({
      name: 'aria',
      priority: 85,
      generate: (original, ctx) => {
        const alternatives: string[] = [];
        if (ctx.ariaLabel) {
          alternatives.push(`[aria-label="${ctx.ariaLabel}"]`);
          alternatives.push(`[aria-label*="${ctx.ariaLabel}"]`);
          alternatives.push(`xpath=//*[@aria-label="${ctx.ariaLabel}"]`);
        }
        if (ctx.ariaRole) {
          alternatives.push(`[role="${ctx.ariaRole}"]`);
        }
        return alternatives;
      }
    });

    // Strategy 5: Role-based (Playwright's getByRole)
    this.registerStrategy({
      name: 'role',
      priority: 80,
      generate: (original, ctx) => {
        const alternatives: string[] = [];
        if (ctx.ariaRole) {
          alternatives.push(`role=${ctx.ariaRole}`);
          if (ctx.text) {
            alternatives.push(`role=${ctx.ariaRole}[name="${ctx.text}"]`);
          }
        }
        // Infer role from tag
        const tagRoleMap: Record<string, string> = {
          button: 'button',
          a: 'link',
          input: 'textbox',
          select: 'combobox',
          checkbox: 'checkbox',
          radio: 'radio',
          img: 'img',
          nav: 'navigation',
          header: 'banner',
          footer: 'contentinfo',
          main: 'main',
          aside: 'complementary',
        };
        if (ctx.tagName && tagRoleMap[ctx.tagName.toLowerCase()]) {
          alternatives.push(`role=${tagRoleMap[ctx.tagName.toLowerCase()]}`);
        }
        return alternatives;
      }
    });

    // Strategy 6: Text content
    this.registerStrategy({
      name: 'text',
      priority: 75,
      generate: (original, ctx) => {
        const alternatives: string[] = [];
        if (ctx.text) {
          const text = ctx.text.substring(0, 100);
          alternatives.push(`text=${text}`);
          alternatives.push(`text=${text} >> visible=true`);
          alternatives.push(`xpath=//*[contains(text(),"${text}")]`);
          alternatives.push(`xpath=//*[normalize-space()="${text}"]`);
          alternatives.push(`xpath=//button[contains(.,"${text}")]`);
          alternatives.push(`xpath=//a[contains(.,"${text}")]`);
          alternatives.push(`xpath=//span[contains(.,"${text}")]`);
        }
        return alternatives;
      }
    });

    // Strategy 7: Placeholder
    this.registerStrategy({
      name: 'placeholder',
      priority: 70,
      generate: (original, ctx) => {
        const alternatives: string[] = [];
        if (ctx.placeholder) {
          alternatives.push(`[placeholder="${ctx.placeholder}"]`);
          alternatives.push(`[placeholder*="${ctx.placeholder}"]`);
          alternatives.push(`input[placeholder="${ctx.placeholder}"]`);
          alternatives.push(`xpath=//*[@placeholder="${ctx.placeholder}"]`);
        }
        return alternatives;
      }
    });

    // Strategy 8: Title attribute
    this.registerStrategy({
      name: 'title',
      priority: 65,
      generate: (original, ctx) => {
        const alternatives: string[] = [];
        if (ctx.title) {
          alternatives.push(`[title="${ctx.title}"]`);
          alternatives.push(`[title*="${ctx.title}"]`);
          alternatives.push(`xpath=//*[@title="${ctx.title}"]`);
        }
        return alternatives;
      }
    });

    // Strategy 9: Class-based
    this.registerStrategy({
      name: 'class',
      priority: 60,
      generate: (original, ctx) => {
        const alternatives: string[] = [];
        if (ctx.className) {
          const classes = ctx.className.split(' ').filter(c => c && !c.match(/^(ng-|_|css-)/));
          for (const cls of classes.slice(0, 5)) {
            alternatives.push(`.${cls}`);
            alternatives.push(`[class*="${cls}"]`);
          }
          // Combined classes
          if (classes.length >= 2) {
            alternatives.push(`.${classes.slice(0, 2).join('.')}`);
          }
        }
        // Extract from original
        if (original.startsWith('.')) {
          const cls = original.substring(1).split('.')[0];
          alternatives.push(`[class*="${cls}"]`);
          alternatives.push(`xpath=//*[contains(@class,"${cls}")]`);
        }
        return alternatives;
      }
    });

    // Strategy 10: XPath variations
    this.registerStrategy({
      name: 'xpath',
      priority: 55,
      generate: (original, ctx) => {
        const alternatives: string[] = [];
        
        if (ctx.tagName) {
          const tag = ctx.tagName.toLowerCase();
          
          // By tag + attributes
          if (ctx.id) {
            alternatives.push(`xpath=//${tag}[@id="${ctx.id}"]`);
          }
          if (ctx.text) {
            alternatives.push(`xpath=//${tag}[contains(text(),"${ctx.text.substring(0, 50)}")]`);
            alternatives.push(`xpath=//${tag}[contains(.,"${ctx.text.substring(0, 50)}")]`);
          }
          if (ctx.className) {
            const cls = ctx.className.split(' ')[0];
            alternatives.push(`xpath=//${tag}[contains(@class,"${cls}")]`);
          }
          
          // Position-based
          if (ctx.position) {
            alternatives.push(`xpath=//${tag}[position()=${Math.max(1, Math.floor(ctx.position.y / 100))}]`);
          }
        }
        
        // Ancestor-based
        if (ctx.id) {
          alternatives.push(`xpath=//*[@id="${ctx.id}"]//..`);
        }
        
        return alternatives;
      }
    });

    // Strategy 11: CSS variations
    this.registerStrategy({
      name: 'css',
      priority: 50,
      generate: (original, ctx) => {
        const alternatives: string[] = [];
        
        if (ctx.tagName) {
          const tag = ctx.tagName.toLowerCase();
          
          // Tag + attribute combinations
          if (ctx.type) {
            alternatives.push(`${tag}[type="${ctx.type}"]`);
          }
          if (ctx.href) {
            alternatives.push(`${tag}[href="${ctx.href}"]`);
            alternatives.push(`${tag}[href*="${ctx.href.split('/').pop()}"]`);
          }
          if (ctx.value) {
            alternatives.push(`${tag}[value="${ctx.value}"]`);
          }
          
          // Structural selectors
          alternatives.push(`${tag}:first-of-type`);
          alternatives.push(`${tag}:last-of-type`);
        }
        
        // Attribute selectors from original
        const attrMatch = original.match(/\[([^\]]+)\]/);
        if (attrMatch) {
          const attr = attrMatch[1];
          if (attr.includes('=')) {
            const [name, value] = attr.split('=');
            alternatives.push(`[${name}*=${value}]`);
            alternatives.push(`[${name}^=${value}]`);
            alternatives.push(`[${name}$=${value}]`);
          }
        }
        
        return alternatives;
      }
    });

    // Strategy 12: Proximity-based (near other elements)
    this.registerStrategy({
      name: 'proximity',
      priority: 45,
      generate: (original, ctx) => {
        const alternatives: string[] = [];
        
        if (ctx.text) {
          // Near label with text
          alternatives.push(`xpath=//label[contains(.,"${ctx.text}")]/following-sibling::input[1]`);
          alternatives.push(`xpath=//label[contains(.,"${ctx.text}")]/following::input[1]`);
          alternatives.push(`xpath=//label[contains(.,"${ctx.text}")]//input`);
          
          // Near heading
          alternatives.push(`xpath=//h1[contains(.,"${ctx.text}")]/following::*[1]`);
          alternatives.push(`xpath=//h2[contains(.,"${ctx.text}")]/following::*[1]`);
        }
        
        if (ctx.ariaLabel) {
          alternatives.push(`xpath=//*[@aria-label="${ctx.ariaLabel}"]/parent::*`);
          alternatives.push(`xpath=//*[@aria-label="${ctx.ariaLabel}"]/ancestor::*[1]`);
        }
        
        return alternatives;
      }
    });

    // Strategy 13: Visual/Position-based
    this.registerStrategy({
      name: 'visual',
      priority: 40,
      generate: (original, ctx) => {
        const alternatives: string[] = [];
        
        if (ctx.dimensions && ctx.position) {
          // Approximate size-based selectors
          const { width, height } = ctx.dimensions;
          
          // Buttons tend to have specific dimensions
          if (width > 50 && width < 200 && height > 30 && height < 60) {
            alternatives.push('button:visible');
            alternatives.push('input[type="submit"]:visible');
            alternatives.push('[role="button"]:visible');
          }
          
          // Large elements (likely containers)
          if (width > 500) {
            alternatives.push('main:visible');
            alternatives.push('[role="main"]:visible');
            alternatives.push('.container:visible');
          }
        }
        
        // Visibility filter
        if (ctx.tagName) {
          alternatives.push(`${ctx.tagName.toLowerCase()} >> visible=true`);
        }
        
        return alternatives;
      }
    });

    // Strategy 14: Semantic (element meaning)
    this.registerStrategy({
      name: 'semantic',
      priority: 35,
      generate: (original, ctx) => {
        const alternatives: string[] = [];
        
        // Infer meaning from text
        if (ctx.text) {
          const text = ctx.text.toLowerCase();
          
          // Login/Sign in
          if (text.includes('login') || text.includes('sign in') || text.includes('log in')) {
            alternatives.push('button:has-text("Login")');
            alternatives.push('button:has-text("Sign in")');
            alternatives.push('input[type="submit"][value*="Login"]');
            alternatives.push('[data-testid*="login"]');
          }
          
          // Submit
          if (text.includes('submit') || text.includes('send') || text.includes('save')) {
            alternatives.push('button[type="submit"]');
            alternatives.push('input[type="submit"]');
            alternatives.push('button:has-text("Submit")');
          }
          
          // Cancel/Close
          if (text.includes('cancel') || text.includes('close') || text.includes('dismiss')) {
            alternatives.push('button:has-text("Cancel")');
            alternatives.push('[aria-label="Close"]');
            alternatives.push('.close-button');
          }
          
          // Search
          if (text.includes('search')) {
            alternatives.push('input[type="search"]');
            alternatives.push('[role="searchbox"]');
            alternatives.push('input[placeholder*="Search"]');
          }
          
          // Email
          if (text.includes('email') || text.includes('e-mail')) {
            alternatives.push('input[type="email"]');
            alternatives.push('input[name="email"]');
            alternatives.push('input[placeholder*="email"]');
          }
          
          // Password
          if (text.includes('password')) {
            alternatives.push('input[type="password"]');
            alternatives.push('input[name="password"]');
          }
        }
        
        return alternatives;
      }
    });

    // Strategy 15: Fuzzy matching
    this.registerStrategy({
      name: 'fuzzy',
      priority: 30,
      generate: (original, ctx) => {
        const alternatives: string[] = [];
        
        // Remove strict equality, use contains
        const idMatch = original.match(/\[id="([^"]+)"\]/);
        if (idMatch) {
          const id = idMatch[1];
          // Partial matches
          alternatives.push(`[id*="${id.substring(0, Math.ceil(id.length / 2))}"]`);
          // Case insensitive via xpath
          alternatives.push(`xpath=//*[contains(translate(@id,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),"${id.toLowerCase()}")]`);
        }
        
        // Fuzzy class matching
        const classMatch = original.match(/\.([a-zA-Z0-9_-]+)/);
        if (classMatch) {
          const cls = classMatch[1];
          alternatives.push(`[class*="${cls.substring(0, Math.ceil(cls.length / 2))}"]`);
        }
        
        // Fuzzy text matching
        if (ctx.text && ctx.text.length > 5) {
          const words = ctx.text.split(' ').filter(w => w.length > 3);
          for (const word of words.slice(0, 3)) {
            alternatives.push(`xpath=//*[contains(text(),"${word}")]`);
          }
        }
        
        return alternatives;
      }
    });
  }

  /**
   * Register a custom healing strategy
   */
  registerStrategy(strategy: HealingStrategy): this {
    this.strategies.set(strategy.name, strategy);
    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALING EXECUTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Heal a broken selector
   */
  async heal(selector: string, context?: ElementContext): Promise<HealingResult> {
    if (!this.page) {
      throw new Error('Page not set. Call setPage() first.');
    }

    const startTime = Date.now();
    const result: HealingResult = {
      success: false,
      originalSelector: selector,
      attempts: 0,
      timeMs: 0,
    };

    // Check learned mappings first
    const learned = this.learnedMappings.get(selector);
    if (learned) {
      try {
        const locator = this.page.locator(learned);
        if (await locator.count() > 0) {
          result.success = true;
          result.healedSelector = learned;
          result.strategyUsed = 'learned';
          result.timeMs = Date.now() - startTime;
          this.emit('healed', result);
          return result;
        }
      } catch {
        // Learned mapping no longer valid
        this.learnedMappings.delete(selector);
      }
    }

    // Get element context if not provided
    if (!context) {
      context = await this.extractContext(selector);
    }
    result.context = context;

    // Generate all alternatives
    const alternatives = this.generateAllAlternatives(selector, context);
    
    // Try each alternative
    for (const { selector: altSelector, strategy } of alternatives) {
      result.attempts++;
      
      try {
        const locator = this.createLocator(altSelector);
        const count = await locator.count();
        
        if (count > 0) {
          result.success = true;
          result.healedSelector = altSelector;
          result.strategyUsed = strategy;
          result.timeMs = Date.now() - startTime;

          // Learn from success
          if (this.config.learnFromSuccess) {
            this.learnedMappings.set(selector, altSelector);
          }

          // Record healing
          this.recordHealing(selector, altSelector, strategy);
          this.emit('healed', result);

          console.log(`🔧 Healed: ${selector} → ${altSelector} (${strategy})`);
          return result;
        }
      } catch {
        // Continue to next alternative
      }

      if (result.attempts >= this.config.maxAttempts) {
        break;
      }
    }

    // Record failure
    if (this.config.learnFromFailure) {
      const failed = this.failedSelectors.get(selector) || [];
      failed.push(...alternatives.map(a => a.selector));
      this.failedSelectors.set(selector, failed);
    }

    result.timeMs = Date.now() - startTime;
    this.emit('healingFailed', result);
    
    console.log(`❌ Healing failed for: ${selector} (${result.attempts} attempts)`);
    return result;
  }

  /**
   * Find element with auto-healing
   */
  async findWithHealing(selector: string, options?: { timeout?: number }): Promise<Locator | null> {
    if (!this.page) {
      throw new Error('Page not set');
    }

    // Try original first
    try {
      const locator = this.createLocator(selector);
      await locator.waitFor({ state: 'attached', timeout: options?.timeout ?? 5000 });
      return locator;
    } catch {
      // Original failed, try healing
    }

    if (!this.config.enabled) {
      return null;
    }

    const result = await this.heal(selector);
    if (result.success && result.healedSelector) {
      return this.createLocator(result.healedSelector);
    }

    return null;
  }

  /**
   * Create Playwright locator from selector string
   */
  private createLocator(selector: string): Locator {
    if (!this.page) throw new Error('Page not set');

    // Handle prefixed selectors
    if (selector.startsWith('xpath=')) {
      return this.page.locator(selector);
    }
    if (selector.startsWith('text=')) {
      return this.page.locator(selector);
    }
    if (selector.startsWith('role=')) {
      const roleMatch = selector.match(/role=(\w+)(?:\[name="([^"]+)"\])?/);
      if (roleMatch) {
        const [, role, name] = roleMatch;
        return name 
          ? this.page.getByRole(role as any, { name })
          : this.page.getByRole(role as any);
      }
    }
    
    // Default CSS
    return this.page.locator(selector);
  }

  /**
   * Generate all alternatives from all strategies
   */
  private generateAllAlternatives(selector: string, context: ElementContext): Array<{ selector: string; strategy: string }> {
    const alternatives: Array<{ selector: string; strategy: string; priority: number }> = [];
    const seen = new Set<string>();

    // Get enabled strategies sorted by priority
    const enabledStrategies = Array.from(this.strategies.values())
      .filter(s => this.config.strategies.includes(s.name))
      .sort((a, b) => b.priority - a.priority);

    for (const strategy of enabledStrategies) {
      const generated = strategy.generate(selector, context);
      
      for (const sel of generated) {
        if (!seen.has(sel) && sel !== selector) {
          seen.add(sel);
          alternatives.push({
            selector: sel,
            strategy: strategy.name,
            priority: strategy.priority,
          });
        }
      }
    }

    // Sort by priority
    alternatives.sort((a, b) => b.priority - a.priority);

    return alternatives;
  }

  /**
   * Extract context from existing element or DOM
   */
  private async extractContext(selector: string): Promise<ElementContext> {
    if (!this.page) return {};

    try {
      const context = await this.page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return {};

        const rect = el.getBoundingClientRect();
        
        return {
          id: el.id || undefined,
          name: (el as HTMLInputElement).name || undefined,
          className: el.className || undefined,
          text: el.textContent?.trim().substring(0, 100) || undefined,
          ariaLabel: el.getAttribute('aria-label') || undefined,
          ariaRole: el.getAttribute('role') || undefined,
          placeholder: el.getAttribute('placeholder') || undefined,
          dataTestId: el.getAttribute('data-testid') || el.getAttribute('data-test') || undefined,
          tagName: el.tagName,
          type: (el as HTMLInputElement).type || undefined,
          href: (el as HTMLAnchorElement).href || undefined,
          title: el.getAttribute('title') || undefined,
          value: (el as HTMLInputElement).value || undefined,
          position: { x: rect.x, y: rect.y },
          dimensions: { width: rect.width, height: rect.height },
        };
      }, selector);

      return context;
    } catch {
      return {};
    }
  }

  /**
   * Record healing event
   */
  private recordHealing(original: string, healed: string, strategy: string): void {
    const record: HealingRecord = {
      timestamp: Date.now(),
      originalSelector: original,
      healedSelector: healed,
      strategyUsed: strategy,
      pageUrl: this.page?.url() ?? 'unknown',
    };

    this.healingHistory.push(record);
    this.emit('recorded', record);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get healing statistics
   */
  getStatistics(): {
    totalHealings: number;
    successRate: number;
    topStrategies: Array<{ strategy: string; count: number }>;
    recentHealings: HealingRecord[];
    learnedMappings: number;
    failedSelectors: number;
  } {
    const strategyCount = new Map<string, number>();
    
    for (const record of this.healingHistory) {
      const count = strategyCount.get(record.strategyUsed) || 0;
      strategyCount.set(record.strategyUsed, count + 1);
    }

    const topStrategies = Array.from(strategyCount.entries())
      .map(([strategy, count]) => ({ strategy, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalHealings: this.healingHistory.length,
      successRate: this.healingHistory.length > 0 ? 100 : 0, // Only successful healings are recorded
      topStrategies,
      recentHealings: this.healingHistory.slice(-10),
      learnedMappings: this.learnedMappings.size,
      failedSelectors: this.failedSelectors.size,
    };
  }

  /**
   * Get healing history
   */
  getHistory(): HealingRecord[] {
    return [...this.healingHistory];
  }

  /**
   * Export learned mappings
   */
  exportMappings(): Record<string, string> {
    return Object.fromEntries(this.learnedMappings);
  }

  /**
   * Import learned mappings
   */
  importMappings(mappings: Record<string, string>): this {
    for (const [key, value] of Object.entries(mappings)) {
      this.learnedMappings.set(key, value);
    }
    return this;
  }

  /**
   * Clear all data
   */
  clear(): this {
    this.healingHistory = [];
    this.learnedMappings.clear();
    this.failedSelectors.clear();
    return this;
  }
}

export default SelfHealingEngine;
