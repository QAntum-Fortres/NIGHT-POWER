/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: BROWSER ORCHESTRATOR
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Multi-browser orchestration, parallel execution, browser pool
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0-QANTUM-PRIME
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export type BrowserType = 'chromium' | 'firefox' | 'webkit' | 'chrome' | 'edge';

export interface BrowserConfig {
  type: BrowserType;
  headless?: boolean;
  args?: string[];
  timeout?: number;
  slowMo?: number;
  devtools?: boolean;
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  viewport?: {
    width: number;
    height: number;
  };
  userAgent?: string;
  locale?: string;
  timezone?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface BrowserInstance {
  id: string;
  type: BrowserType;
  browser: any;
  createdAt: Date;
  lastUsed: Date;
  inUse: boolean;
  pagesCount: number;
}

export interface PoolConfig {
  browsers: Array<{
    type: BrowserType;
    count: number;
    config?: Partial<BrowserConfig>;
  }>;
  maxTotal?: number;
  idleTimeout?: number;
  acquireTimeout?: number;
}

export interface OrchestratorConfig {
  pool?: PoolConfig;
  maxConcurrency?: number;
  defaultBrowser?: BrowserType;
  retries?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BROWSER POOL
// ═══════════════════════════════════════════════════════════════════════════════

export class BrowserPool extends EventEmitter {
  private instances: Map<string, BrowserInstance> = new Map();
  private queue: Array<{
    type: BrowserType;
    resolve: (instance: BrowserInstance) => void;
    reject: (error: Error) => void;
  }> = [];
  private config: PoolConfig;
  private cleanupTimer?: ReturnType<typeof setInterval>;
  private idCounter: number = 0;

  constructor(config: PoolConfig) {
    super();
    this.config = {
      maxTotal: 10,
      idleTimeout: 60000,
      acquireTimeout: 30000,
      ...config
    };
  }

  /**
   * Initialize pool with browsers
   */
  async initialize(): Promise<void> {
    for (const browserConfig of this.config.browsers) {
      for (let i = 0; i < browserConfig.count; i++) {
        await this.createInstance(browserConfig.type, browserConfig.config);
      }
    }

    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleInstances();
    }, this.config.idleTimeout! / 2);

    this.emit('initialized', this.getStats());
  }

  /**
   * Acquire browser instance
   */
  async acquire(type: BrowserType): Promise<BrowserInstance> {
    // Find available instance
    for (const [_, instance] of this.instances) {
      if (instance.type === type && !instance.inUse) {
        instance.inUse = true;
        instance.lastUsed = new Date();
        this.emit('acquired', instance.id);
        return instance;
      }
    }

    // Check if we can create new
    if (this.instances.size < this.config.maxTotal!) {
      const instance = await this.createInstance(type);
      instance.inUse = true;
      return instance;
    }

    // Wait in queue
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const idx = this.queue.findIndex(q => q.resolve === resolve);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
        }
        reject(new Error(`Acquire timeout for browser: ${type}`));
      }, this.config.acquireTimeout!);

      this.queue.push({
        type,
        resolve: (instance) => {
          clearTimeout(timeout);
          resolve(instance);
        },
        reject
      });
    });
  }

  /**
   * Release browser instance
   */
  release(id: string): void {
    const instance = this.instances.get(id);
    
    if (!instance) return;

    instance.inUse = false;
    instance.lastUsed = new Date();

    // Check if someone is waiting
    const waitingIdx = this.queue.findIndex(q => q.type === instance.type);
    
    if (waitingIdx !== -1) {
      const waiting = this.queue.splice(waitingIdx, 1)[0];
      instance.inUse = true;
      waiting.resolve(instance);
    }

    this.emit('released', id);
  }

  /**
   * Destroy browser instance
   */
  async destroy(id: string): Promise<void> {
    const instance = this.instances.get(id);
    
    if (!instance) return;

    try {
      await instance.browser?.close?.();
    } catch {}

    this.instances.delete(id);
    this.emit('destroyed', id);
  }

  /**
   * Shutdown pool
   */
  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    const destroyPromises: Promise<void>[] = [];
    
    for (const [id] of this.instances) {
      destroyPromises.push(this.destroy(id));
    }

    await Promise.all(destroyPromises);
    this.emit('shutdown');
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    total: number;
    available: number;
    inUse: number;
    byType: Record<BrowserType, { total: number; available: number }>;
  } {
    const byType: Record<string, { total: number; available: number }> = {};
    let inUse = 0;

    for (const instance of this.instances.values()) {
      if (!byType[instance.type]) {
        byType[instance.type] = { total: 0, available: 0 };
      }
      byType[instance.type].total++;
      
      if (instance.inUse) {
        inUse++;
      } else {
        byType[instance.type].available++;
      }
    }

    return {
      total: this.instances.size,
      available: this.instances.size - inUse,
      inUse,
      byType: byType as Record<BrowserType, { total: number; available: number }>
    };
  }

  private async createInstance(type: BrowserType, config?: Partial<BrowserConfig>): Promise<BrowserInstance> {
    const id = `${type}-${++this.idCounter}`;

    // In real implementation, launch actual browser
    const browser = {
      id,
      type,
      close: async () => {}
    };

    const instance: BrowserInstance = {
      id,
      type,
      browser,
      createdAt: new Date(),
      lastUsed: new Date(),
      inUse: false,
      pagesCount: 0
    };

    this.instances.set(id, instance);
    this.emit('created', id);

    return instance;
  }

  private cleanupIdleInstances(): void {
    const now = Date.now();
    const minInstances = this.config.browsers.reduce((sum, b) => sum + b.count, 0);

    for (const [id, instance] of this.instances) {
      if (
        !instance.inUse &&
        this.instances.size > minInstances &&
        now - instance.lastUsed.getTime() > this.config.idleTimeout!
      ) {
        this.destroy(id);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BROWSER ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class BrowserOrchestrator extends EventEmitter {
  private pool?: BrowserPool;
  private config: OrchestratorConfig;
  private activeTasks: Map<string, Task> = new Map();
  private taskQueue: Task[] = [];
  private running: boolean = false;
  private taskCounter: number = 0;

  constructor(config: OrchestratorConfig = {}) {
    super();
    this.config = {
      maxConcurrency: 4,
      defaultBrowser: 'chromium',
      retries: 2,
      ...config
    };
  }

  /**
   * Initialize orchestrator
   */
  async initialize(): Promise<void> {
    if (this.config.pool) {
      this.pool = new BrowserPool(this.config.pool);
      await this.pool.initialize();
    }
    this.running = true;
    this.processQueue();
    this.emit('initialized');
  }

  /**
   * Execute task on browser
   */
  async execute<T>(
    handler: (browser: any, page: any) => Promise<T>,
    options: { browser?: BrowserType; timeout?: number } = {}
  ): Promise<T> {
    const task: Task = {
      id: `task-${++this.taskCounter}`,
      browser: options.browser || this.config.defaultBrowser!,
      handler,
      timeout: options.timeout || 30000,
      retries: this.config.retries!,
      resolve: () => {},
      reject: () => {}
    };

    return new Promise((resolve, reject) => {
      task.resolve = resolve as any;
      task.reject = reject;
      this.taskQueue.push(task);
      this.processQueue();
    });
  }

  /**
   * Execute tasks in parallel
   */
  async parallel<T>(
    tasks: Array<{
      handler: (browser: any, page: any) => Promise<T>;
      browser?: BrowserType;
    }>
  ): Promise<T[]> {
    return Promise.all(
      tasks.map(task => this.execute(task.handler, { browser: task.browser }))
    );
  }

  /**
   * Execute task on all browsers
   */
  async onAllBrowsers<T>(
    handler: (browser: any, page: any, browserType: BrowserType) => Promise<T>,
    browsers: BrowserType[] = ['chromium', 'firefox', 'webkit']
  ): Promise<Map<BrowserType, T>> {
    const results = new Map<BrowserType, T>();

    await Promise.all(
      browsers.map(async (type) => {
        const result = await this.execute(
          (browser, page) => handler(browser, page, type),
          { browser: type }
        );
        results.set(type, result);
      })
    );

    return results;
  }

  /**
   * Shutdown orchestrator
   */
  async shutdown(): Promise<void> {
    this.running = false;
    
    // Wait for active tasks
    while (this.activeTasks.size > 0) {
      await new Promise(r => setTimeout(r, 100));
    }

    if (this.pool) {
      await this.pool.shutdown();
    }

    this.emit('shutdown');
  }

  private async processQueue(): Promise<void> {
    while (
      this.running &&
      this.taskQueue.length > 0 &&
      this.activeTasks.size < this.config.maxConcurrency!
    ) {
      const task = this.taskQueue.shift()!;
      this.activeTasks.set(task.id, task);
      this.runTask(task);
    }
  }

  private async runTask(task: Task): Promise<void> {
    let lastError: Error | undefined;
    let retries = task.retries;

    while (retries >= 0) {
      try {
        // Get browser from pool
        const instance = this.pool 
          ? await this.pool.acquire(task.browser)
          : { browser: {}, id: 'temp' };

        try {
          // Execute with timeout
          const result = await Promise.race([
            task.handler(instance.browser, {}),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Task timeout')), task.timeout)
            )
          ]);

          task.resolve(result);
          this.emit('taskComplete', { id: task.id, success: true });
          
        } finally {
          if (this.pool) {
            this.pool.release(instance.id);
          }
        }

        break;

      } catch (error) {
        lastError = error as Error;
        retries--;

        if (retries >= 0) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    if (lastError && retries < 0) {
      task.reject(lastError);
      this.emit('taskComplete', { id: task.id, success: false, error: lastError.message });
    }

    this.activeTasks.delete(task.id);
    this.processQueue();
  }
}

interface Task {
  id: string;
  browser: BrowserType;
  handler: (browser: any, page: any) => Promise<any>;
  timeout: number;
  retries: number;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BROWSER MATRIX
// ═══════════════════════════════════════════════════════════════════════════════

export class BrowserMatrix {
  private orchestrator: BrowserOrchestrator;

  constructor(orchestrator: BrowserOrchestrator) {
    this.orchestrator = orchestrator;
  }

  /**
   * Run test across browser matrix
   */
  async run<T>(
    test: (browser: any, page: any, context: MatrixContext) => Promise<T>,
    matrix: MatrixConfig
  ): Promise<MatrixResult<T>> {
    const combinations = this.generateCombinations(matrix);
    const results: MatrixResult<T> = {
      total: combinations.length,
      passed: 0,
      failed: 0,
      results: []
    };

    await Promise.all(
      combinations.map(async (combo) => {
        try {
          const result = await this.orchestrator.execute(
            (browser, page) => test(browser, page, combo),
            { browser: combo.browser }
          );

          results.passed++;
          results.results.push({
            context: combo,
            success: true,
            result
          });

        } catch (error) {
          results.failed++;
          results.results.push({
            context: combo,
            success: false,
            error: (error as Error).message
          });
        }
      })
    );

    return results;
  }

  private generateCombinations(matrix: MatrixConfig): MatrixContext[] {
    const combinations: MatrixContext[] = [];

    for (const browser of matrix.browsers || ['chromium']) {
      for (const viewport of matrix.viewports || [{ width: 1920, height: 1080 }]) {
        for (const locale of matrix.locales || ['en-US']) {
          combinations.push({
            browser,
            viewport,
            locale
          });
        }
      }
    }

    return combinations;
  }
}

export interface MatrixConfig {
  browsers?: BrowserType[];
  viewports?: Array<{ width: number; height: number }>;
  locales?: string[];
}

export interface MatrixContext {
  browser: BrowserType;
  viewport: { width: number; height: number };
  locale: string;
}

export interface MatrixResult<T> {
  total: number;
  passed: number;
  failed: number;
  results: Array<{
    context: MatrixContext;
    success: boolean;
    result?: T;
    error?: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export function createOrchestrator(config?: OrchestratorConfig): BrowserOrchestrator {
  return new BrowserOrchestrator(config);
}

export function createPool(config: PoolConfig): BrowserPool {
  return new BrowserPool(config);
}

export default {
  BrowserPool,
  BrowserOrchestrator,
  BrowserMatrix,
  createOrchestrator,
  createPool
};
