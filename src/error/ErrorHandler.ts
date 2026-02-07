/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: ERROR HANDLING & RETRY SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Comprehensive error classification, retry strategies, recovery mechanisms
 * Dead letter queue for failed operations
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0-QANTUM-PRIME
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export enum ErrorCategory {
  NETWORK = 'network',
  ELEMENT = 'element',
  TIMEOUT = 'timeout',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  CAPTCHA = 'captcha',
  RATE_LIMIT = 'rate_limit',
  BLOCKED = 'blocked',
  SESSION = 'session',
  DATA = 'data',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ClassifiedError {
  original: Error;
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  retryDelay: number;
  maxRetries: number;
  recoveryAction?: RecoveryAction;
  context?: Record<string, any>;
}

export type RecoveryAction = 
  | 'retry'
  | 'wait_and_retry'
  | 'refresh_page'
  | 'clear_cookies'
  | 'rotate_proxy'
  | 'solve_captcha'
  | 'new_session'
  | 'escalate'
  | 'abort';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  strategy: 'fixed' | 'linear' | 'exponential' | 'fibonacci' | 'decorrelated_jitter';
  jitter: boolean;
  retryableErrors?: ErrorCategory[];
  onRetry?: (attempt: number, error: ClassifiedError) => Promise<void>;
}

export interface DeadLetterItem {
  id: string;
  error: ClassifiedError;
  operation: string;
  args: any[];
  attempts: number;
  firstFailure: Date;
  lastFailure: Date;
  context?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR CLASSIFIER
// ═══════════════════════════════════════════════════════════════════════════════

export class ErrorClassifier {
  private static patterns: Array<{
    pattern: RegExp;
    category: ErrorCategory;
    severity: ErrorSeverity;
    retryable: boolean;
    recovery?: RecoveryAction;
  }> = [
    // Network errors
    { pattern: /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET/i, category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM, retryable: true, recovery: 'wait_and_retry' },
    { pattern: /net::ERR_|NetworkError|fetch failed/i, category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM, retryable: true, recovery: 'wait_and_retry' },
    { pattern: /socket hang up|connection refused/i, category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM, retryable: true, recovery: 'rotate_proxy' },
    
    // Timeout errors
    { pattern: /timeout|timed out|TimeoutError/i, category: ErrorCategory.TIMEOUT, severity: ErrorSeverity.LOW, retryable: true, recovery: 'retry' },
    { pattern: /navigation timeout|waiting for selector/i, category: ErrorCategory.TIMEOUT, severity: ErrorSeverity.LOW, retryable: true, recovery: 'refresh_page' },
    
    // Element errors
    { pattern: /element not found|no such element|locator resolved to/i, category: ErrorCategory.ELEMENT, severity: ErrorSeverity.LOW, retryable: true, recovery: 'retry' },
    { pattern: /element is not attached|stale element/i, category: ErrorCategory.ELEMENT, severity: ErrorSeverity.LOW, retryable: true, recovery: 'refresh_page' },
    { pattern: /element not visible|element not interactable/i, category: ErrorCategory.ELEMENT, severity: ErrorSeverity.LOW, retryable: true, recovery: 'retry' },
    { pattern: /detached from DOM/i, category: ErrorCategory.ELEMENT, severity: ErrorSeverity.LOW, retryable: true, recovery: 'refresh_page' },
    
    // Rate limiting
    { pattern: /rate limit|too many requests|429/i, category: ErrorCategory.RATE_LIMIT, severity: ErrorSeverity.MEDIUM, retryable: true, recovery: 'wait_and_retry' },
    { pattern: /quota exceeded|throttle/i, category: ErrorCategory.RATE_LIMIT, severity: ErrorSeverity.MEDIUM, retryable: true, recovery: 'wait_and_retry' },
    
    // Blocking/Detection
    { pattern: /blocked|banned|forbidden|403/i, category: ErrorCategory.BLOCKED, severity: ErrorSeverity.HIGH, retryable: false, recovery: 'rotate_proxy' },
    { pattern: /access denied|unauthorized|401/i, category: ErrorCategory.AUTHENTICATION, severity: ErrorSeverity.HIGH, retryable: false, recovery: 'new_session' },
    { pattern: /captcha|recaptcha|hcaptcha|challenge/i, category: ErrorCategory.CAPTCHA, severity: ErrorSeverity.MEDIUM, retryable: true, recovery: 'solve_captcha' },
    { pattern: /bot detected|automation detected/i, category: ErrorCategory.BLOCKED, severity: ErrorSeverity.CRITICAL, retryable: false, recovery: 'abort' },
    
    // Session errors
    { pattern: /session expired|invalid session|session not found/i, category: ErrorCategory.SESSION, severity: ErrorSeverity.MEDIUM, retryable: true, recovery: 'new_session' },
    { pattern: /cookie|localStorage|sessionStorage/i, category: ErrorCategory.SESSION, severity: ErrorSeverity.MEDIUM, retryable: true, recovery: 'clear_cookies' },
    
    // Validation errors
    { pattern: /validation|invalid|required field/i, category: ErrorCategory.VALIDATION, severity: ErrorSeverity.LOW, retryable: false, recovery: 'abort' },
    
    // Data errors
    { pattern: /parse error|JSON|syntax error/i, category: ErrorCategory.DATA, severity: ErrorSeverity.LOW, retryable: false, recovery: 'abort' },
    { pattern: /database|query failed|SQL/i, category: ErrorCategory.DATA, severity: ErrorSeverity.HIGH, retryable: true, recovery: 'retry' },
    
    // System errors
    { pattern: /out of memory|heap|stack overflow/i, category: ErrorCategory.SYSTEM, severity: ErrorSeverity.CRITICAL, retryable: false, recovery: 'abort' },
    { pattern: /ENOSPC|disk full/i, category: ErrorCategory.SYSTEM, severity: ErrorSeverity.CRITICAL, retryable: false, recovery: 'abort' }
  ];

  /**
   * Classify error
   */
  static classify(error: Error | string, context?: Record<string, any>): ClassifiedError {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? '' : error.stack || '';
    const fullText = `${errorMessage} ${errorStack}`;

    for (const { pattern, category, severity, retryable, recovery } of this.patterns) {
      if (pattern.test(fullText)) {
        return {
          original: typeof error === 'string' ? new Error(error) : error,
          category,
          severity,
          retryable,
          retryDelay: this.getRetryDelay(category),
          maxRetries: this.getMaxRetries(category),
          recoveryAction: recovery,
          context
        };
      }
    }

    // Default classification
    return {
      original: typeof error === 'string' ? new Error(error) : error,
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      retryDelay: 1000,
      maxRetries: 3,
      recoveryAction: 'retry',
      context
    };
  }

  /**
   * Get default retry delay for category
   */
  private static getRetryDelay(category: ErrorCategory): number {
    const delays: Record<ErrorCategory, number> = {
      [ErrorCategory.NETWORK]: 2000,
      [ErrorCategory.ELEMENT]: 500,
      [ErrorCategory.TIMEOUT]: 1000,
      [ErrorCategory.VALIDATION]: 0,
      [ErrorCategory.AUTHENTICATION]: 0,
      [ErrorCategory.CAPTCHA]: 5000,
      [ErrorCategory.RATE_LIMIT]: 30000,
      [ErrorCategory.BLOCKED]: 60000,
      [ErrorCategory.SESSION]: 2000,
      [ErrorCategory.DATA]: 0,
      [ErrorCategory.SYSTEM]: 0,
      [ErrorCategory.UNKNOWN]: 1000
    };
    return delays[category];
  }

  /**
   * Get default max retries for category
   */
  private static getMaxRetries(category: ErrorCategory): number {
    const retries: Record<ErrorCategory, number> = {
      [ErrorCategory.NETWORK]: 5,
      [ErrorCategory.ELEMENT]: 10,
      [ErrorCategory.TIMEOUT]: 3,
      [ErrorCategory.VALIDATION]: 0,
      [ErrorCategory.AUTHENTICATION]: 1,
      [ErrorCategory.CAPTCHA]: 3,
      [ErrorCategory.RATE_LIMIT]: 2,
      [ErrorCategory.BLOCKED]: 0,
      [ErrorCategory.SESSION]: 2,
      [ErrorCategory.DATA]: 0,
      [ErrorCategory.SYSTEM]: 0,
      [ErrorCategory.UNKNOWN]: 3
    };
    return retries[category];
  }

  /**
   * Add custom pattern
   */
  static addPattern(
    pattern: RegExp,
    category: ErrorCategory,
    severity: ErrorSeverity,
    retryable: boolean,
    recovery?: RecoveryAction
  ): void {
    this.patterns.unshift({ pattern, category, severity, retryable, recovery });
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: Error | string): boolean {
    return this.classify(error).retryable;
  }

  /**
   * Get recovery action for error
   */
  static getRecoveryAction(error: Error | string): RecoveryAction {
    return this.classify(error).recoveryAction || 'retry';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RETRY MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class RetryManager extends EventEmitter {
  private config: RetryConfig;
  private fibonacciCache: number[] = [0, 1];

  constructor(config: Partial<RetryConfig> = {}) {
    super();
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      strategy: 'exponential',
      jitter: true,
      ...config
    };
  }

  /**
   * Execute with retry
   */
  async execute<T>(
    operation: () => Promise<T>,
    options: Partial<RetryConfig> = {}
  ): Promise<T> {
    const config = { ...this.config, ...options };
    let lastError: ClassifiedError | undefined;

    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        this.emit('attempt', { attempt, maxRetries: config.maxRetries });
        return await operation();
      } catch (error) {
        lastError = ErrorClassifier.classify(error as Error);
        
        this.emit('error', { attempt, error: lastError });

        // Check if retryable
        if (!this.shouldRetry(lastError, attempt, config)) {
          this.emit('failed', { attempts: attempt, error: lastError });
          throw lastError.original;
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt, config, lastError);
        
        this.emit('retry', { attempt, delay, error: lastError });

        // Execute onRetry callback
        if (config.onRetry) {
          await config.onRetry(attempt, lastError);
        }

        // Wait before retry
        await this.sleep(delay);
      }
    }

    this.emit('failed', { attempts: config.maxRetries + 1, error: lastError });
    throw lastError?.original || new Error('Retry failed');
  }

  /**
   * Check if should retry
   */
  private shouldRetry(error: ClassifiedError, attempt: number, config: RetryConfig): boolean {
    if (attempt > config.maxRetries) return false;
    if (!error.retryable) return false;
    
    if (config.retryableErrors && !config.retryableErrors.includes(error.category)) {
      return false;
    }

    return true;
  }

  /**
   * Calculate retry delay
   */
  calculateDelay(attempt: number, config: RetryConfig, error?: ClassifiedError): number {
    let delay: number;

    switch (config.strategy) {
      case 'fixed':
        delay = config.baseDelay;
        break;
      
      case 'linear':
        delay = config.baseDelay * attempt;
        break;
      
      case 'exponential':
        delay = config.baseDelay * Math.pow(2, attempt - 1);
        break;
      
      case 'fibonacci':
        delay = config.baseDelay * this.fibonacci(attempt);
        break;
      
      case 'decorrelated_jitter':
        delay = Math.min(
          config.maxDelay,
          Math.random() * (config.baseDelay * Math.pow(3, attempt - 1) - config.baseDelay) + config.baseDelay
        );
        break;
      
      default:
        delay = config.baseDelay;
    }

    // Apply jitter
    if (config.jitter && config.strategy !== 'decorrelated_jitter') {
      const jitterRange = delay * 0.3;
      delay = delay - jitterRange + Math.random() * jitterRange * 2;
    }

    // Apply category-specific delay
    if (error?.retryDelay) {
      delay = Math.max(delay, error.retryDelay);
    }

    // Cap at maxDelay
    return Math.min(delay, config.maxDelay);
  }

  /**
   * Fibonacci sequence
   */
  private fibonacci(n: number): number {
    while (this.fibonacciCache.length <= n) {
      const len = this.fibonacciCache.length;
      this.fibonacciCache.push(this.fibonacciCache[len - 1] + this.fibonacciCache[len - 2]);
    }
    return this.fibonacciCache[n];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECOVERY STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RecoveryContext {
  page?: any; // Playwright page
  browser?: any; // Playwright browser
  proxyRotator?: { rotateProxy: () => Promise<string> };
  captchaSolver?: { solve: (page: any) => Promise<string> };
  sessionManager?: { createSession: () => Promise<void>; clearSession: () => Promise<void> };
}

export class RecoveryStrategies extends EventEmitter {
  private context: RecoveryContext;

  constructor(context: RecoveryContext = {}) {
    super();
    this.context = context;
  }

  /**
   * Execute recovery action
   */
  async execute(action: RecoveryAction, error: ClassifiedError): Promise<boolean> {
    this.emit('recovery:start', { action, error });

    try {
      let success = false;

      switch (action) {
        case 'retry':
          success = true; // Just retry
          break;
        
        case 'wait_and_retry':
          await this.waitAndRetry(error);
          success = true;
          break;
        
        case 'refresh_page':
          success = await this.refreshPage();
          break;
        
        case 'clear_cookies':
          success = await this.clearCookies();
          break;
        
        case 'rotate_proxy':
          success = await this.rotateProxy();
          break;
        
        case 'solve_captcha':
          success = await this.solveCaptcha();
          break;
        
        case 'new_session':
          success = await this.newSession();
          break;
        
        case 'escalate':
          this.emit('recovery:escalate', error);
          success = false;
          break;
        
        case 'abort':
          this.emit('recovery:abort', error);
          success = false;
          break;
      }

      this.emit('recovery:complete', { action, success, error });
      return success;
    } catch (recoveryError) {
      this.emit('recovery:failed', { action, error, recoveryError });
      return false;
    }
  }

  private async waitAndRetry(error: ClassifiedError): Promise<void> {
    const delay = error.retryDelay || 5000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async refreshPage(): Promise<boolean> {
    if (!this.context.page) return false;
    
    try {
      await this.context.page.reload({ waitUntil: 'networkidle' });
      return true;
    } catch {
      return false;
    }
  }

  private async clearCookies(): Promise<boolean> {
    if (!this.context.page) return false;
    
    try {
      const context = this.context.page.context();
      await context.clearCookies();
      return true;
    } catch {
      return false;
    }
  }

  private async rotateProxy(): Promise<boolean> {
    if (!this.context.proxyRotator) return false;
    
    try {
      const newProxy = await this.context.proxyRotator.rotateProxy();
      this.emit('proxy:rotated', { proxy: newProxy });
      return true;
    } catch {
      return false;
    }
  }

  private async solveCaptcha(): Promise<boolean> {
    if (!this.context.captchaSolver || !this.context.page) return false;
    
    try {
      await this.context.captchaSolver.solve(this.context.page);
      return true;
    } catch {
      return false;
    }
  }

  private async newSession(): Promise<boolean> {
    if (!this.context.sessionManager) return false;
    
    try {
      await this.context.sessionManager.clearSession();
      await this.context.sessionManager.createSession();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update context
   */
  setContext(context: Partial<RecoveryContext>): void {
    this.context = { ...this.context, ...context };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEAD LETTER QUEUE
// ═══════════════════════════════════════════════════════════════════════════════

export class DeadLetterQueue extends EventEmitter {
  private queue: Map<string, DeadLetterItem> = new Map();
  private maxSize: number;
  private retentionMs: number;

  constructor(options: {
    maxSize?: number;
    retentionHours?: number;
  } = {}) {
    super();
    this.maxSize = options.maxSize || 10000;
    this.retentionMs = (options.retentionHours || 24) * 60 * 60 * 1000;
  }

  /**
   * Add failed operation
   */
  add(item: Omit<DeadLetterItem, 'id' | 'firstFailure' | 'lastFailure' | 'attempts'>): string {
    const id = this.generateId();
    const now = new Date();

    const dlqItem: DeadLetterItem = {
      ...item,
      id,
      attempts: 1,
      firstFailure: now,
      lastFailure: now
    };

    // Check size limit
    if (this.queue.size >= this.maxSize) {
      this.pruneOldest();
    }

    this.queue.set(id, dlqItem);
    this.emit('item:added', dlqItem);

    return id;
  }

  /**
   * Get item by ID
   */
  get(id: string): DeadLetterItem | undefined {
    return this.queue.get(id);
  }

  /**
   * Get all items
   */
  getAll(filter?: {
    category?: ErrorCategory;
    operation?: string;
    minAttempts?: number;
  }): DeadLetterItem[] {
    let items = Array.from(this.queue.values());

    if (filter) {
      if (filter.category) {
        items = items.filter(i => i.error.category === filter.category);
      }
      if (filter.operation) {
        items = items.filter(i => i.operation === filter.operation);
      }
      if (filter.minAttempts) {
        items = items.filter(i => i.attempts >= (filter.minAttempts ?? 0));
      }
    }

    return items;
  }

  /**
   * Retry item
   */
  async retry<T>(id: string, operation: (...args: any[]) => Promise<T>): Promise<T | null> {
    const item = this.queue.get(id);
    if (!item) return null;

    try {
      this.emit('item:retrying', item);
      const result = await operation(...item.args);
      this.remove(id);
      this.emit('item:succeeded', { id, result });
      return result;
    } catch (error) {
      item.attempts++;
      item.lastFailure = new Date();
      item.error = ErrorClassifier.classify(error as Error);
      this.emit('item:failed', item);
      return null;
    }
  }

  /**
   * Retry all items of category
   */
  async retryCategory<T>(
    category: ErrorCategory,
    operation: (...args: any[]) => Promise<T>,
    options: {
      maxConcurrent?: number;
      delayBetween?: number;
    } = {}
  ): Promise<{ succeeded: number; failed: number }> {
    const items = this.getAll({ category });
    const { maxConcurrent = 5, delayBetween = 1000 } = options;

    let succeeded = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < items.length; i += maxConcurrent) {
      const batch = items.slice(i, i + maxConcurrent);
      
      const results = await Promise.all(
        batch.map(item => this.retry(item.id, operation))
      );

      results.forEach(r => r !== null ? succeeded++ : failed++);

      if (i + maxConcurrent < items.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetween));
      }
    }

    return { succeeded, failed };
  }

  /**
   * Remove item
   */
  remove(id: string): boolean {
    const existed = this.queue.delete(id);
    if (existed) {
      this.emit('item:removed', { id });
    }
    return existed;
  }

  /**
   * Clear all items
   */
  clear(): void {
    const count = this.queue.size;
    this.queue.clear();
    this.emit('cleared', { count });
  }

  /**
   * Get stats
   */
  getStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    byOperation: Record<string, number>;
    avgAttempts: number;
    oldestItem?: Date;
  } {
    const items = Array.from(this.queue.values());
    
    const byCategory: Partial<Record<ErrorCategory, number>> = {};
    const byOperation: Record<string, number> = {};
    let totalAttempts = 0;
    let oldestItem: Date | undefined;

    for (const item of items) {
      byCategory[item.error.category] = (byCategory[item.error.category] || 0) + 1;
      byOperation[item.operation] = (byOperation[item.operation] || 0) + 1;
      totalAttempts += item.attempts;
      
      if (!oldestItem || item.firstFailure < oldestItem) {
        oldestItem = item.firstFailure;
      }
    }

    return {
      total: items.length,
      byCategory: byCategory as Record<ErrorCategory, number>,
      byOperation,
      avgAttempts: items.length > 0 ? totalAttempts / items.length : 0,
      oldestItem
    };
  }

  /**
   * Prune expired items
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [id, item] of this.queue.entries()) {
      if (now - item.lastFailure.getTime() > this.retentionMs) {
        this.queue.delete(id);
        pruned++;
      }
    }

    if (pruned > 0) {
      this.emit('pruned', { count: pruned });
    }

    return pruned;
  }

  /**
   * Export to JSON
   */
  export(): string {
    const items = Array.from(this.queue.values());
    return JSON.stringify(items, null, 2);
  }

  /**
   * Import from JSON
   */
  import(json: string): number {
    const items: DeadLetterItem[] = JSON.parse(json);
    
    for (const item of items) {
      item.firstFailure = new Date(item.firstFailure);
      item.lastFailure = new Date(item.lastFailure);
      this.queue.set(item.id, item);
    }

    return items.length;
  }

  private pruneOldest(): void {
    let oldest: { id: string; date: Date } | null = null;

    for (const [id, item] of this.queue.entries()) {
      if (!oldest || item.firstFailure < oldest.date) {
        oldest = { id, date: item.firstFailure };
      }
    }

    if (oldest) {
      this.queue.delete(oldest.id);
    }
  }

  private generateId(): string {
    return `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER
// ═══════════════════════════════════════════════════════════════════════════════

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;

  constructor(private options: {
    failureThreshold?: number;
    successThreshold?: number;
    timeout?: number;
    resetTimeout?: number;
  } = {}) {
    super();
    this.options = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
      resetTimeout: 60000,
      ...options
    };
  }

  /**
   * Execute with circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.nextAttemptTime && Date.now() < this.nextAttemptTime.getTime()) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = CircuitState.HALF_OPEN;
      this.emit('state:change', { state: this.state });
    }

    try {
      const result = await this.withTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Force reset
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    this.emit('reset');
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      
      if (this.successes >= this.options.successThreshold!) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.emit('state:change', { state: this.state });
      }
    } else {
      this.failures = 0;
    }

    this.emit('success');
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();
    this.successes = 0;

    if (this.state === CircuitState.HALF_OPEN || this.failures >= this.options.failureThreshold!) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = new Date(Date.now() + this.options.resetTimeout!);
      this.emit('state:change', { state: this.state, nextAttempt: this.nextAttemptTime });
    }

    this.emit('failure', { failures: this.failures });
  }

  private withTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Circuit breaker timeout'));
      }, this.options.timeout);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export class ErrorHandler extends EventEmitter {
  public classifier = ErrorClassifier;
  public retry: RetryManager;
  public recovery: RecoveryStrategies;
  public deadLetter: DeadLetterQueue;
  public circuitBreaker: CircuitBreaker;

  constructor(options: {
    retry?: Partial<RetryConfig>;
    recovery?: RecoveryContext;
    deadLetter?: { maxSize?: number; retentionHours?: number };
    circuitBreaker?: { failureThreshold?: number; timeout?: number };
  } = {}) {
    super();

    this.retry = new RetryManager(options.retry);
    this.recovery = new RecoveryStrategies(options.recovery);
    this.deadLetter = new DeadLetterQueue(options.deadLetter);
    this.circuitBreaker = new CircuitBreaker(options.circuitBreaker);

    // Forward events
    this.retry.on('failed', (data) => this.emit('operation:failed', data));
    this.recovery.on('recovery:complete', (data) => this.emit('recovery:complete', data));
    this.deadLetter.on('item:added', (data) => this.emit('deadletter:added', data));
    this.circuitBreaker.on('state:change', (data) => this.emit('circuit:state', data));
  }

  /**
   * Execute operation with full error handling
   */
  async execute<T>(
    operation: () => Promise<T>,
    options: {
      name?: string;
      args?: any[];
      retry?: Partial<RetryConfig>;
      useCircuitBreaker?: boolean;
    } = {}
  ): Promise<T> {
    const { name = 'unknown', args = [], retry = {}, useCircuitBreaker = true } = options;

    try {
      if (useCircuitBreaker) {
        return await this.circuitBreaker.execute(() => this.retry.execute(operation, retry));
      }
      return await this.retry.execute(operation, retry);
    } catch (error) {
      const classified = ErrorClassifier.classify(error as Error);
      
      // Try recovery
      if (classified.recoveryAction && classified.recoveryAction !== 'abort') {
        const recovered = await this.recovery.execute(classified.recoveryAction, classified);
        
        if (recovered) {
          // Retry after recovery
          try {
            return await operation();
          } catch (retryError) {
            // Add to dead letter queue
            this.deadLetter.add({
              error: ErrorClassifier.classify(retryError as Error),
              operation: name,
              args,
              context: { recoveryAttempted: classified.recoveryAction }
            });
          }
        }
      }

      // Add to dead letter queue
      this.deadLetter.add({
        error: classified,
        operation: name,
        args
      });

      throw error;
    }
  }
}

export default ErrorHandler;
