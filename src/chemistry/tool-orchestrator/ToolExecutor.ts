/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   ████████╗ ██████╗  ██████╗ ██╗                                              ║
 * ║   ╚══██╔══╝██╔═══██╗██╔═══██╗██║                                              ║
 * ║      ██║   ██║   ██║██║   ██║██║                                              ║
 * ║      ██║   ██║   ██║██║   ██║██║                                              ║
 * ║      ██║   ╚██████╔╝╚██████╔╝███████╗                                         ║
 * ║      ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝                                         ║
 * ║                                                                               ║
 * ║   ███████╗██╗  ██╗███████╗ ██████╗██╗   ██╗████████╗ ██████╗ ██████╗          ║
 * ║   ██╔════╝╚██╗██╔╝██╔════╝██╔════╝██║   ██║╚══██╔══╝██╔═══██╗██╔══██╗         ║
 * ║   █████╗   ╚███╔╝ █████╗  ██║     ██║   ██║   ██║   ██║   ██║██████╔╝         ║
 * ║   ██╔══╝   ██╔██╗ ██╔══╝  ██║     ██║   ██║   ██║   ██║   ██║██╔══██╗         ║
 * ║   ███████╗██╔╝ ██╗███████╗╚██████╗╚██████╔╝   ██║   ╚██████╔╝██║  ██║         ║
 * ║   ╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝    ╚═╝    ╚═════╝ ╚═╝  ╚═╝         ║
 * ║                                                                               ║
 * ║   QAntum v29.0 "THE OMNIPOTENT NEXUS" - Secure Tool Executor                  ║
 * ║   "Сигурно изпълнение с Fortress защита и Fatality мониторинг"                ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                      ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';
import {
  MCPTool,
  MCPOperation,
  ToolExecutionRequest,
  ToolExecutionResult,
  ToolExecutionError,
  ToolExecutorConfig,
  GhostProtocolConfig,
  LessonLearned,
} from './types';
import { ToolRegistry, getToolRegistry } from './ToolRegistry';

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: ToolExecutorConfig = {
  defaultTimeoutMs: 30000,
  maxTimeoutMs: 120000,
  defaultRetries: 3,
  maxRetries: 5,
  retryDelayMs: 1000,
  exponentialBackoff: true,
  enableGhostProtocol: true,
  enableFatalityMonitoring: true,
  fatalityThreshold: 5,
  enableRateLimiting: true,
  globalRateLimit: {
    requests: 100,
    windowMs: 60000
  }
};

const DEFAULT_GHOST_CONFIG: GhostProtocolConfig = {
  enableTLSPhantom: true,
  ja3Fingerprint: 'chrome_120',
  enableWebGLSpoofing: true,
  gpuVendor: 'Google Inc. (NVIDIA)',
  gpuRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4050 Direct3D11 vs_5_0 ps_5_0)',
  enableBiometricInjection: false,
  rotateUserAgent: true,
  customHeaders: {
    'Accept-Language': 'en-US,en;q=0.9,bg;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// USER AGENTS FOR ROTATION
// ═══════════════════════════════════════════════════════════════════════════════

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL EXECUTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ToolExecutor - Secure Tool Execution Engine
 * 
 * Executes MCP tools with:
 * - Fortress-level API key encryption
 * - Ghost Protocol for stealth requests
 * - Fatality Engine for abuse monitoring
 * - Automatic retries with exponential backoff
 * - Learning from execution outcomes
 * 
 * @example
 * ```typescript
 * const executor = ToolExecutor.getInstance();
 * 
 * const result = await executor.execute({
 *   toolId: 'mcp-apify',
 *   operationId: 'runActor',
 *   parameters: {
 *     actorId: 'apify/web-scraper',
 *     input: { startUrls: [{ url: 'https://example.com' }] }
 *   }
 * });
 * 
 * if (result.success) {
 *   console.log('Data:', result.data);
 * }
 * ```
 */
export class ToolExecutor extends EventEmitter {
  private static instance: ToolExecutor;
  
  private config: ToolExecutorConfig;
  private ghostConfig: GhostProtocolConfig;
  private registry: ToolRegistry;
  
  // API Keys (encrypted in memory)
  private encryptedKeys: Map<string, Buffer> = new Map();
  private encryptionKey: Buffer;
  
  // Rate limiting
  private requestCounts: Map<string, { count: number; windowStart: Date }> = new Map();
  
  // Fatality tracking
  private failureCounts: Map<string, number> = new Map();
  private circuitBroken: Set<string> = new Set();
  
  // Execution history
  private executionHistory: ToolExecutionResult[] = [];
  private lessonsLearned: LessonLearned[] = [];
  
  private constructor(
    config: Partial<ToolExecutorConfig> = {},
    ghostConfig: Partial<GhostProtocolConfig> = {}
  ) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ghostConfig = { ...DEFAULT_GHOST_CONFIG, ...ghostConfig };
    this.registry = getToolRegistry();
    
    // Generate encryption key for API keys in memory
    this.encryptionKey = crypto.randomBytes(32);
    
    // Load API keys from environment
    this.loadApiKeys();
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(
    config?: Partial<ToolExecutorConfig>,
    ghostConfig?: Partial<GhostProtocolConfig>
  ): ToolExecutor {
    if (!ToolExecutor.instance) {
      ToolExecutor.instance = new ToolExecutor(config, ghostConfig);
    }
    return ToolExecutor.instance;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // API KEY MANAGEMENT (Fortress Layer)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Load and encrypt API keys from environment
   */
  private loadApiKeys(): void {
    const tools = this.registry.getAllTools();
    
    for (const tool of tools) {
      if (tool.envKeyName) {
        const key = process.env[tool.envKeyName];
        if (key) {
          this.encryptAndStore(tool.id, key);
        }
      }
    }
    
    console.log(`🔐 Loaded ${this.encryptedKeys.size} API keys (encrypted in memory)`);
  }
  
  /**
   * Encrypt and store API key
   */
  private encryptAndStore(toolId: string, apiKey: string): void {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    const encrypted = Buffer.concat([
      iv,
      cipher.update(apiKey, 'utf8'),
      cipher.final(),
      cipher.getAuthTag()
    ]);
    
    this.encryptedKeys.set(toolId, encrypted);
  }
  
  /**
   * Decrypt API key for use
   */
  private decryptKey(toolId: string): string | null {
    const encrypted = this.encryptedKeys.get(toolId);
    if (!encrypted) return null;
    
    try {
      const iv = encrypted.subarray(0, 16);
      const authTag = encrypted.subarray(-16);
      const data = encrypted.subarray(16, -16);
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(authTag);
      
      return decipher.update(data) + decipher.final('utf8');
    } catch (error) {
      console.error(`🔓 Failed to decrypt key for ${toolId}`);
      return null;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN EXECUTION API
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Execute a tool operation
   */
  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const requestId = request.requestId || crypto.randomUUID();
    
    // Get tool and operation
    const tool = this.registry.getTool(request.toolId);
    if (!tool) {
      return this.createErrorResult(request, requestId, startTime, {
        code: 'TOOL_NOT_FOUND',
        message: `Tool ${request.toolId} not found`,
        isRetryable: false
      });
    }
    
    const operation = tool.operations.find(op => op.id === request.operationId);
    if (!operation) {
      return this.createErrorResult(request, requestId, startTime, {
        code: 'OPERATION_NOT_FOUND',
        message: `Operation ${request.operationId} not found in ${request.toolId}`,
        isRetryable: false
      });
    }
    
    // Check circuit breaker
    if (this.isCircuitBroken(request.toolId)) {
      return this.createErrorResult(request, requestId, startTime, {
        code: 'CIRCUIT_BROKEN',
        message: `Tool ${request.toolId} is temporarily disabled due to repeated failures`,
        isRetryable: false,
        suggestedAction: 'Wait 5 minutes and try again'
      });
    }
    
    // Check rate limit
    if (!this.checkRateLimit(request.toolId, operation)) {
      return this.createErrorResult(request, requestId, startTime, {
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded for ${request.toolId}`,
        isRetryable: true,
        suggestedAction: 'Wait and retry'
      });
    }
    
    // Execute with retries
    const timeout = Math.min(
      request.timeout || this.config.defaultTimeoutMs,
      this.config.maxTimeoutMs
    );
    const retries = Math.min(
      request.retries || this.config.defaultRetries,
      this.config.maxRetries
    );
    
    let lastError: ToolExecutionError | undefined;
    let retryCount = 0;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const data = await this.executeOperation(tool, operation, request, timeout);
        
        // Success!
        this.resetFailureCount(request.toolId);
        
        const result: ToolExecutionResult = {
          success: true,
          toolId: request.toolId,
          operationId: request.operationId,
          data,
          executionMs: Date.now() - startTime,
          retryCount,
          requestId,
          timestamp: new Date()
        };
        
        // Update metrics
        this.registry.updateMetrics(request.toolId, true, result.executionMs);
        
        // Record history
        this.recordExecution(result);
        
        this.emit('execution:success', result);
        return result;
        
      } catch (error) {
        retryCount++;
        lastError = this.parseError(error);
        
        if (!lastError.isRetryable || attempt >= retries) {
          break;
        }
        
        // Wait before retry
        const delay = this.config.exponentialBackoff
          ? this.config.retryDelayMs * Math.pow(2, attempt)
          : this.config.retryDelayMs;
        
        await this.sleep(delay);
      }
    }
    
    // All retries failed
    this.incrementFailureCount(request.toolId);
    
    const result = this.createErrorResult(request, requestId, startTime, lastError!);
    result.retryCount = retryCount;
    
    // Update metrics
    this.registry.updateMetrics(request.toolId, false, result.executionMs);
    
    // Record history
    this.recordExecution(result);
    
    // Learn from failure
    result.lessonLearned = this.learnFromFailure(request, lastError!);
    
    this.emit('execution:failure', result);
    return result;
  }
  
  /**
   * Execute the actual operation
   */
  private async executeOperation(
    tool: MCPTool,
    operation: MCPOperation,
    request: ToolExecutionRequest,
    timeout: number
  ): Promise<unknown> {
    // Handle stdio tools (local MCP servers)
    if (tool.endpoint.startsWith('stdio://')) {
      return this.executeStdioTool(tool, operation, request);
    }
    
    // Handle HTTP tools
    return this.executeHttpTool(tool, operation, request, timeout);
  }
  
  /**
   * Execute stdio-based MCP tool
   */
  private async executeStdioTool(
    tool: MCPTool,
    operation: MCPOperation,
    request: ToolExecutionRequest
  ): Promise<unknown> {
    // Stdio tools are executed via child_process
    // For now, return simulated response
    this.emit('stdio:execute', { tool, operation, request });
    
    return {
      success: true,
      message: `Executed ${operation.name} via stdio`,
      toolId: tool.id,
      operationId: operation.id,
      parameters: request.parameters
    };
  }
  
  /**
   * Execute HTTP-based MCP tool
   */
  private async executeHttpTool(
    tool: MCPTool,
    operation: MCPOperation,
    request: ToolExecutionRequest,
    timeout: number
  ): Promise<unknown> {
    // Build URL
    let url = tool.endpoint + operation.path;
    
    // Replace path parameters
    for (const [key, value] of Object.entries(request.parameters)) {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    }
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getGhostHeaders(tool)
    };
    
    // Add authentication
    const apiKey = this.decryptKey(tool.id);
    if (apiKey) {
      switch (tool.authType) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${apiKey}`;
          break;
        case 'api-key':
          headers['X-API-Key'] = apiKey;
          break;
        case 'basic':
          headers['Authorization'] = `Basic ${Buffer.from(apiKey).toString('base64')}`;
          break;
      }
    }
    
    // Make request
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const lib = isHttps ? https : http;
      
      const options: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: operation.httpMethod,
        headers,
        timeout
      };
      
      const req = lib.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      // Send body for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(operation.httpMethod)) {
        req.write(JSON.stringify(request.parameters));
      }
      
      req.end();
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GHOST PROTOCOL
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Get Ghost Protocol headers
   */
  private getGhostHeaders(tool: MCPTool): Record<string, string> {
    if (!this.config.enableGhostProtocol || !tool.requiresGhostProtocol) {
      return {};
    }
    
    const headers: Record<string, string> = {};
    
    // Rotate User Agent
    if (this.ghostConfig.rotateUserAgent) {
      headers['User-Agent'] = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    }
    
    // Add custom headers
    if (this.ghostConfig.customHeaders) {
      Object.assign(headers, this.ghostConfig.customHeaders);
    }
    
    // Add fingerprint-related headers
    headers['Sec-CH-UA'] = '"Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="99"';
    headers['Sec-CH-UA-Mobile'] = '?0';
    headers['Sec-CH-UA-Platform'] = '"Windows"';
    headers['Sec-Fetch-Dest'] = 'empty';
    headers['Sec-Fetch-Mode'] = 'cors';
    headers['Sec-Fetch-Site'] = 'cross-site';
    
    return headers;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RATE LIMITING
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Check if request is within rate limit
   */
  private checkRateLimit(toolId: string, operation: MCPOperation): boolean {
    if (!this.config.enableRateLimiting) return true;
    
    const key = `${toolId}:${operation.id}`;
    const now = new Date();
    
    // Get operation-specific or global rate limit
    const limit = operation.rateLimit || this.config.globalRateLimit;
    if (!limit) return true;
    
    let record = this.requestCounts.get(key);
    
    // Reset if window expired
    if (!record || now.getTime() - record.windowStart.getTime() > limit.windowMs) {
      record = { count: 0, windowStart: now };
    }
    
    // Check limit
    if (record.count >= limit.requests) {
      return false;
    }
    
    // Increment count
    record.count++;
    this.requestCounts.set(key, record);
    
    return true;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FATALITY ENGINE (Circuit Breaker)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Check if circuit is broken for tool
   */
  private isCircuitBroken(toolId: string): boolean {
    return this.circuitBroken.has(toolId);
  }
  
  /**
   * Increment failure count
   */
  private incrementFailureCount(toolId: string): void {
    const count = (this.failureCounts.get(toolId) || 0) + 1;
    this.failureCounts.set(toolId, count);
    
    // Break circuit if threshold exceeded
    if (this.config.enableFatalityMonitoring && count >= this.config.fatalityThreshold) {
      this.circuitBroken.add(toolId);
      this.emit('fatality:circuit-broken', { toolId, failureCount: count });
      
      // Auto-reset after 5 minutes
      setTimeout(() => {
        this.circuitBroken.delete(toolId);
        this.failureCounts.delete(toolId);
        this.emit('fatality:circuit-reset', { toolId });
      }, 300000);
    }
  }
  
  /**
   * Reset failure count on success
   */
  private resetFailureCount(toolId: string): void {
    this.failureCounts.delete(toolId);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LEARNING & HISTORY
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Record execution in history
   */
  private recordExecution(result: ToolExecutionResult): void {
    this.executionHistory.push(result);
    
    // Keep only last 1000
    if (this.executionHistory.length > 1000) {
      this.executionHistory = this.executionHistory.slice(-1000);
    }
  }
  
  /**
   * Learn from failure
   */
  private learnFromFailure(
    request: ToolExecutionRequest,
    error: ToolExecutionError
  ): LessonLearned {
    const lesson: LessonLearned = {
      id: crypto.randomUUID(),
      toolId: request.toolId,
      operationId: request.operationId,
      taskDescription: `Execute ${request.operationId}`,
      inputParameters: request.parameters,
      success: false,
      outcome: error.message,
      executionMs: 0,
      whatFailed: [error.code, error.message],
      improvements: error.suggestedAction ? [error.suggestedAction] : [],
      timestamp: new Date()
    };
    
    this.lessonsLearned.push(lesson);
    this.emit('lesson:learned', lesson);
    
    return lesson;
  }
  
  /**
   * Get lessons for a tool
   */
  getLessons(toolId: string): LessonLearned[] {
    return this.lessonsLearned.filter(l => l.toolId === toolId);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Parse error into structured format
   */
  private parseError(error: unknown): ToolExecutionError {
    if (error instanceof Error) {
      const isTimeout = error.message.includes('timeout');
      const isNetwork = error.message.includes('ECONNREFUSED') || 
                        error.message.includes('ENOTFOUND');
      const isAuth = error.message.includes('401') || 
                     error.message.includes('403');
      
      return {
        code: isTimeout ? 'TIMEOUT' : isNetwork ? 'NETWORK_ERROR' : isAuth ? 'AUTH_ERROR' : 'UNKNOWN',
        message: error.message,
        isRetryable: isTimeout || isNetwork,
        suggestedAction: isAuth ? 'Check API key configuration' : undefined
      };
    }
    
    return {
      code: 'UNKNOWN',
      message: String(error),
      isRetryable: false
    };
  }
  
  /**
   * Create error result
   */
  private createErrorResult(
    request: ToolExecutionRequest,
    requestId: string,
    startTime: number,
    error: ToolExecutionError
  ): ToolExecutionResult {
    return {
      success: false,
      toolId: request.toolId,
      operationId: request.operationId,
      error,
      executionMs: Date.now() - startTime,
      retryCount: 0,
      requestId,
      timestamp: new Date()
    };
  }
  
  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get execution statistics
   */
  getStats(): {
    totalExecutions: number;
    successRate: number;
    avgLatencyMs: number;
    circuitBrokenTools: string[];
    lessonsLearned: number;
  } {
    const successful = this.executionHistory.filter(e => e.success);
    const totalLatency = this.executionHistory.reduce((sum, e) => sum + e.executionMs, 0);
    
    return {
      totalExecutions: this.executionHistory.length,
      successRate: this.executionHistory.length > 0 
        ? successful.length / this.executionHistory.length 
        : 1.0,
      avgLatencyMs: this.executionHistory.length > 0 
        ? totalLatency / this.executionHistory.length 
        : 0,
      circuitBrokenTools: Array.from(this.circuitBroken),
      lessonsLearned: this.lessonsLearned.length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getToolExecutor = (
  config?: Partial<ToolExecutorConfig>,
  ghostConfig?: Partial<GhostProtocolConfig>
): ToolExecutor => {
  return ToolExecutor.getInstance(config, ghostConfig);
};

export default ToolExecutor;
