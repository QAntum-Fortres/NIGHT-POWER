/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🧠 QANTUM HYBRID v1.0.0 - Network Interceptor
 * HAR recording/playback, GraphQL filtering, request mocking
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { Page, Route, Request, Response } from 'playwright';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

import { logger } from '../api/unified/utils/logger';
// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface NetworkConfig {
  enabled: boolean;
  recordHar: boolean;
  harPath?: string;
  mockEnabled: boolean;
  stubEnabled: boolean;
  graphQLEnabled: boolean;
  blockPatterns: string[];
  allowPatterns: string[];
}

export interface HarEntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    headers: Array<{ name: string; value: string }>;
    postData?: {
      mimeType: string;
      text: string;
    };
  };
  response: {
    status: number;
    statusText: string;
    headers: Array<{ name: string; value: string }>;
    content: {
      size: number;
      mimeType: string;
      text?: string;
    };
  };
  timings: {
    wait: number;
    receive: number;
  };
}

export interface HarLog {
  version: string;
  creator: {
    name: string;
    version: string;
  };
  entries: HarEntry[];
}

export interface MockConfig {
  url: string | RegExp;
  method?: string;
  status?: number;
  headers?: Record<string, string>;
  body?: string | object;
  delay?: number;
}

export interface StubConfig {
  url: string | RegExp;
  fixture?: string;
  response?: {
    status?: number;
    headers?: Record<string, string>;
    body?: string | object;
  };
  times?: number;
}

export interface GraphQLConfig {
  operationName?: string;
  query?: string | RegExp;
  variables?: Record<string, unknown>;
  response?: object;
  alias?: string;
}

export interface RequestLog {
  timestamp: number;
  method: string;
  url: string;
  resourceType: string;
  status?: number;
  duration?: number;
  size?: number;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NETWORK INTERCEPTOR
// ═══════════════════════════════════════════════════════════════════════════════

export class NetworkInterceptor extends EventEmitter {
  private page?: Page;
  private config: NetworkConfig;
  
  private harEntries: HarEntry[] = [];
  private mocks: Map<string, MockConfig> = new Map();
  private stubs: Map<string, StubConfig & { remaining: number }> = new Map();
  private graphQLMocks: Map<string, GraphQLConfig> = new Map();
  private requestLog: RequestLog[] = [];
  private pendingRequests: Map<string, { start: number; request: Request }> = new Map();
  
  private isRecording = false;
  private interceptActive = false;

  constructor(config?: Partial<NetworkConfig>) {
    super();

    this.config = {
      enabled: config?.enabled ?? true,
      recordHar: config?.recordHar ?? false,
      harPath: config?.harPath,
      mockEnabled: config?.mockEnabled ?? true,
      stubEnabled: config?.stubEnabled ?? true,
      graphQLEnabled: config?.graphQLEnabled ?? true,
      blockPatterns: config?.blockPatterns ?? [],
      allowPatterns: config?.allowPatterns ?? ['**/*'],
    };
  }

  /**
   * Set Playwright page and start intercepting
   */
  async setPage(page: Page): Promise<this> {
    this.page = page;
    await this.setupInterception();
    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERCEPTION SETUP
  // ═══════════════════════════════════════════════════════════════════════════

  private async setupInterception(): Promise<void> {
    if (!this.page || !this.config.enabled || this.interceptActive) return;

    // Listen to requests
    this.page.on('request', (request) => this.onRequest(request));
    this.page.on('response', (response) => this.onResponse(response));
    this.page.on('requestfailed', (request) => this.onRequestFailed(request));

    // Setup route handler for mocking
    await this.page.route('**/*', async (route) => {
      await this.handleRoute(route);
    });

    this.interceptActive = true;
    logger.debug('🌐 Network interceptor active');
  }

  private onRequest(request: Request): void {
    const id = `${request.method()}-${request.url()}-${Date.now()}`;
    
    this.pendingRequests.set(id, {
      start: Date.now(),
      request,
    });

    this.emit('request', {
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType(),
    });
  }

  private onResponse(response: Response): void {
    const request = response.request();
    const url = request.url();
    
    // Find pending request
    for (const [id, pending] of this.pendingRequests.entries()) {
      if (pending.request.url() === url) {
        const duration = Date.now() - pending.start;
        
        const log: RequestLog = {
          timestamp: pending.start,
          method: request.method(),
          url,
          resourceType: request.resourceType(),
          status: response.status(),
          duration,
        };

        this.requestLog.push(log);
        this.pendingRequests.delete(id);

        // Record HAR entry
        if (this.isRecording) {
          this.recordHarEntry(request, response, duration);
        }

        this.emit('response', log);
        break;
      }
    }
  }

  private onRequestFailed(request: Request): void {
    const url = request.url();
    
    for (const [id, pending] of this.pendingRequests.entries()) {
      if (pending.request.url() === url) {
        const log: RequestLog = {
          timestamp: pending.start,
          method: request.method(),
          url,
          resourceType: request.resourceType(),
          error: request.failure()?.errorText,
        };

        this.requestLog.push(log);
        this.pendingRequests.delete(id);
        this.emit('requestFailed', log);
        break;
      }
    }
  }

  private async handleRoute(route: Route): Promise<void> {
    const request = route.request();
    const url = request.url();
    const method = request.method();

    // Check blocked patterns
    for (const pattern of this.config.blockPatterns) {
      if (this.matchPattern(url, pattern)) {
        await route.abort();
        this.emit('blocked', { url, pattern });
        return;
      }
    }

    // Check mocks
    for (const [, mock] of this.mocks) {
      if (this.matchPattern(url, mock.url) && (!mock.method || mock.method === method)) {
        await this.fulfillMock(route, mock);
        return;
      }
    }

    // Check stubs
    for (const [id, stub] of this.stubs) {
      if (this.matchPattern(url, stub.url)) {
        if (stub.remaining > 0 || stub.remaining === -1) {
          await this.fulfillStub(route, stub);
          if (stub.remaining > 0) stub.remaining--;
          if (stub.remaining === 0) this.stubs.delete(id);
          return;
        }
      }
    }

    // Check GraphQL mocks
    if (this.config.graphQLEnabled && url.includes('graphql')) {
      const graphqlResult = await this.handleGraphQL(route);
      if (graphqlResult) return;
    }

    // Continue normally
    await route.continue();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOCKING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a mock (intercept and replace response)
   */
  mock(config: MockConfig): this {
    const id = `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.mocks.set(id, config);
    logger.debug(`🎭 Mock registered: ${config.url}`);
    return this;
  }

  /**
   * Add a stub (Cypress-style fixture-based mock)
   */
  stub(config: StubConfig): this {
    const id = `stub-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.stubs.set(id, { ...config, remaining: config.times ?? -1 });
    logger.debug(`📌 Stub registered: ${config.url}`);
    return this;
  }

  /**
   * Intercept (alias for mock, Cypress-style)
   */
  intercept(url: string | RegExp, response?: MockConfig['body'] | ((route: Route) => Promise<void>)): this {
    if (typeof response === 'function') {
      // Custom handler - not implemented in this version
      logger.warn('Custom route handlers not yet supported');
      return this;
    }

    return this.mock({
      url,
      body: response,
    });
  }

  /**
   * Clear all mocks and stubs
   */
  clearMocks(): this {
    this.mocks.clear();
    this.stubs.clear();
    this.graphQLMocks.clear();
    logger.debug('🧹 All mocks cleared');
    return this;
  }

  private async fulfillMock(route: Route, mock: MockConfig): Promise<void> {
    if (mock.delay) {
      await new Promise((r) => setTimeout(r, mock.delay));
    }

    const body = typeof mock.body === 'object' ? JSON.stringify(mock.body) : mock.body;

    await route.fulfill({
      status: mock.status ?? 200,
      headers: {
        'Content-Type': 'application/json',
        ...mock.headers,
      },
      body: body ?? '',
    });

    this.emit('mocked', { url: route.request().url(), mock });
  }

  private async fulfillStub(route: Route, stub: StubConfig): Promise<void> {
    let body: string;

    if (stub.fixture) {
      // Load from fixture file
      const fixturePath = path.resolve(stub.fixture);
      if (fs.existsSync(fixturePath)) {
        body = fs.readFileSync(fixturePath, 'utf-8');
      } else {
        logger.warn(`Fixture not found: ${fixturePath}`);
        await route.continue();
        return;
      }
    } else if (stub.response?.body) {
      body = typeof stub.response.body === 'object' 
        ? JSON.stringify(stub.response.body) 
        : stub.response.body;
    } else {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: stub.response?.status ?? 200,
      headers: {
        'Content-Type': 'application/json',
        ...stub.response?.headers,
      },
      body,
    });

    this.emit('stubbed', { url: route.request().url() });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GRAPHQL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Mock a GraphQL operation
   */
  mockGraphQL(config: GraphQLConfig): this {
    const id = config.alias ?? config.operationName ?? `gql-${Date.now()}`;
    this.graphQLMocks.set(id, config);
    logger.debug(`🔷 GraphQL mock registered: ${id}`);
    return this;
  }

  private async handleGraphQL(route: Route): Promise<boolean> {
    const request = route.request();
    
    try {
      const postData = request.postData();
      if (!postData) return false;

      const body = JSON.parse(postData);
      const operationName = body.operationName;
      const query = body.query;

      for (const [, config] of this.graphQLMocks) {
        // Match by operation name
        if (config.operationName && config.operationName !== operationName) {
          continue;
        }

        // Match by query
        if (config.query) {
          const queryPattern = config.query instanceof RegExp 
            ? config.query 
            : new RegExp(config.query);
          
          if (!queryPattern.test(query)) {
            continue;
          }
        }

        // Match by variables
        if (config.variables) {
          const requestVars = body.variables || {};
          let varsMatch = true;
          
          for (const [key, value] of Object.entries(config.variables)) {
            if (requestVars[key] !== value) {
              varsMatch = false;
              break;
            }
          }
          
          if (!varsMatch) continue;
        }

        // Match found - fulfill
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config.response ?? { data: {} }),
        });

        this.emit('graphqlMocked', { operationName, alias: config.alias });
        return true;
      }
    } catch {
      // Not valid GraphQL
    }

    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HAR RECORDING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Start recording HAR
   */
  startRecording(): this {
    this.isRecording = true;
    this.harEntries = [];
    logger.debug('🔴 HAR recording started');
    return this;
  }

  /**
   * Stop recording HAR
   */
  stopRecording(): this {
    this.isRecording = false;
    logger.debug('⏹️ HAR recording stopped');
    return this;
  }

  /**
   * Save HAR file
   */
  saveHar(filepath?: string): string {
    const outputPath = filepath ?? this.config.harPath ?? `./har-${Date.now()}.har`;

    const har: HarLog = {
      version: '1.2',
      creator: {
        name: 'QANTUM Hybrid',
        version: '26.0',
      },
      entries: this.harEntries,
    };

    fs.writeFileSync(outputPath, JSON.stringify(har, null, 2));
    logger.debug(`💾 HAR saved: ${outputPath}`);
    return outputPath;
  }

  /**
   * Load and replay HAR
   */
  async loadHar(filepath: string): Promise<this> {
    const content = fs.readFileSync(filepath, 'utf-8');
    const har: HarLog = JSON.parse(content);

    for (const entry of har.entries) {
      this.mock({
        url: entry.request.url,
        method: entry.request.method,
        status: entry.response.status,
        headers: Object.fromEntries(entry.response.headers.map(h => [h.name, h.value])),
        body: entry.response.content.text,
      });
    }

    logger.debug(`📂 HAR loaded: ${har.entries.length} entries`);
    return this;
  }

  private async recordHarEntry(request: Request, response: Response, duration: number): Promise<void> {
    try {
      const entry: HarEntry = {
        startedDateTime: new Date().toISOString(),
        time: duration,
        request: {
          method: request.method(),
          url: request.url(),
          headers: Object.entries(request.headers()).map(([name, value]) => ({ name, value })),
          postData: request.postData() ? {
            mimeType: 'application/json',
            text: request.postData()!,
          } : undefined,
        },
        response: {
          status: response.status(),
          statusText: response.statusText(),
          headers: Object.entries(response.headers()).map(([name, value]) => ({ name, value })),
          content: {
            size: 0,
            mimeType: response.headers()['content-type'] ?? 'text/plain',
            text: undefined,
          },
        },
        timings: {
          wait: 0,
          receive: duration,
        },
      };

      // Try to get body
      try {
        const body = await response.text();
        entry.response.content.text = body;
        entry.response.content.size = body.length;
      } catch {}

      this.harEntries.push(entry);
    } catch {}
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCKING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Block requests matching pattern
   */
  block(pattern: string): this {
    this.config.blockPatterns.push(pattern);
    logger.debug(`🚫 Blocking: ${pattern}`);
    return this;
  }

  /**
   * Block common tracking/analytics
   */
  blockTrackers(): this {
    const trackers = [
      '**/google-analytics.com/**',
      '**/googletagmanager.com/**',
      '**/facebook.net/**',
      '**/doubleclick.net/**',
      '**/hotjar.com/**',
      '**/mixpanel.com/**',
      '**/segment.io/**',
      '**/amplitude.com/**',
    ];

    trackers.forEach(t => this.block(t));
    return this;
  }

  /**
   * Block images (for faster tests)
   */
  blockImages(): this {
    this.block('**/*.png');
    this.block('**/*.jpg');
    this.block('**/*.jpeg');
    this.block('**/*.gif');
    this.block('**/*.svg');
    this.block('**/*.webp');
    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WAITING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Wait for specific request
   */
  async waitForRequest(urlPattern: string | RegExp, options?: { timeout?: number }): Promise<Request | null> {
    if (!this.page) return null;

    try {
      return await this.page.waitForRequest(urlPattern, {
        timeout: options?.timeout ?? 30000,
      });
    } catch {
      return null;
    }
  }

  /**
   * Wait for specific response
   */
  async waitForResponse(urlPattern: string | RegExp, options?: { timeout?: number }): Promise<Response | null> {
    if (!this.page) return null;

    try {
      return await this.page.waitForResponse(urlPattern, {
        timeout: options?.timeout ?? 30000,
      });
    } catch {
      return null;
    }
  }

  /**
   * Wait for network idle
   */
  async waitForNetworkIdle(options?: { timeout?: number; idleTime?: number }): Promise<void> {
    if (!this.page) return;

    await this.page.waitForLoadState('networkidle', {
      timeout: options?.timeout ?? 30000,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  private matchPattern(url: string, pattern: string | RegExp): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(url);
    }

    // Convert glob to regex
    const regex = new RegExp(
      pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
    );

    return regex.test(url);
  }

  /**
   * Get request log
   */
  getRequestLog(): RequestLog[] {
    return [...this.requestLog];
  }

  /**
   * Get requests by resource type
   */
  getRequestsByType(type: string): RequestLog[] {
    return this.requestLog.filter(r => r.resourceType === type);
  }

  /**
   * Get failed requests
   */
  getFailedRequests(): RequestLog[] {
    return this.requestLog.filter(r => r.error || (r.status && r.status >= 400));
  }

  /**
   * Clear request log
   */
  clearLog(): this {
    this.requestLog = [];
    return this;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalRequests: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    avgDuration: number;
    totalSize: number;
  } {
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalDuration = 0;
    let totalSize = 0;
    let countWithDuration = 0;

    for (const log of this.requestLog) {
      byType[log.resourceType] = (byType[log.resourceType] || 0) + 1;
      
      const statusGroup = log.status ? `${Math.floor(log.status / 100)}xx` : 'error';
      byStatus[statusGroup] = (byStatus[statusGroup] || 0) + 1;

      if (log.duration) {
        totalDuration += log.duration;
        countWithDuration++;
      }

      if (log.size) {
        totalSize += log.size;
      }
    }

    return {
      totalRequests: this.requestLog.length,
      byType,
      byStatus,
      avgDuration: countWithDuration > 0 ? Math.round(totalDuration / countWithDuration) : 0,
      totalSize,
    };
  }
}

export default NetworkInterceptor;
