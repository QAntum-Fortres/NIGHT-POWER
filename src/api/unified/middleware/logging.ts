/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: REQUEST LOGGING MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * HTTP request/response logging with timing
 * Request ID generation and propagation
 * 
 * @author Dimitar Prodromov
 * @version 1.0.0-QANTUM-PRIME
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import { getLogger } from '../utils/logger';

const logger = getLogger();

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RequestLogConfig {
  /** Log request body */
  logBody?: boolean;
  /** Log response body */
  logResponseBody?: boolean;
  /** Max body length to log */
  maxBodyLength?: number;
  /** Paths to skip logging */
  skipPaths?: string[];
  /** Headers to redact */
  redactHeaders?: string[];
  /** Fields to redact from body */
  redactFields?: string[];
  /** Request ID header name */
  requestIdHeader?: string;
  /** Generate request ID if not present */
  generateRequestId?: boolean;
}

export interface RequestLog {
  requestId: string;
  method: string;
  path: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
  ip: string;
  userAgent?: string;
  timestamp: string;
}

export interface ResponseLog {
  requestId: string;
  statusCode: number;
  headers?: Record<string, string>;
  body?: unknown;
  duration: number;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST LOGGER
// ═══════════════════════════════════════════════════════════════════════════════

export class RequestLogger {
  private config: Required<RequestLogConfig>;
  private static readonly DEFAULT_REDACT_HEADERS = [
    'authorization',
    'x-api-key',
    'cookie',
    'set-cookie'
  ];
  private static readonly DEFAULT_REDACT_FIELDS = [
    'password',
    'secret',
    'token',
    'apiKey',
    'creditCard',
    'ssn'
  ];

  constructor(config?: RequestLogConfig) {
    this.config = {
      logBody: config?.logBody ?? false,
      logResponseBody: config?.logResponseBody ?? false,
      maxBodyLength: config?.maxBodyLength ?? 10000,
      skipPaths: config?.skipPaths ?? ['/health', '/favicon.ico'],
      redactHeaders: [
        ...RequestLogger.DEFAULT_REDACT_HEADERS,
        ...(config?.redactHeaders ?? [])
      ],
      redactFields: [
        ...RequestLogger.DEFAULT_REDACT_FIELDS,
        ...(config?.redactFields ?? [])
      ],
      requestIdHeader: config?.requestIdHeader ?? 'x-request-id',
      generateRequestId: config?.generateRequestId ?? true
    };
  }

  /**
   * Generate or extract request ID
   */
  getRequestId(req: IncomingMessage): string {
    const existingId = req.headers[this.config.requestIdHeader] as string;
    
    if (existingId) {
      return existingId;
    }

    if (this.config.generateRequestId) {
      return this.generateId();
    }

    return 'unknown';
  }

  /**
   * Generate unique request ID
   */
  private generateId(): string {
    // Format: timestamp-random (sortable and unique)
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `${timestamp}-${random}`;
  }

  /**
   * Log incoming request
   */
  logRequest(
    req: IncomingMessage,
    requestId: string,
    body?: unknown
  ): void {
    const path = req.url?.split('?')[0] || '/';
    
    // Skip if path is in skip list
    if (this.shouldSkip(path)) {
      return;
    }

    const log: RequestLog = {
      requestId,
      method: req.method || 'GET',
      path,
      ip: this.getClientIP(req),
      timestamp: new Date().toISOString()
    };

    // Add query params
    if (req.url?.includes('?')) {
      const url = new URL(req.url, `http://${req.headers.host}`);
      log.query = Object.fromEntries(url.searchParams);
    }

    // Add user agent
    if (req.headers['user-agent']) {
      log.userAgent = req.headers['user-agent'];
    }

    // Add headers (redacted)
    log.headers = this.redactHeaders(req.headers as Record<string, string>);

    // Add body (redacted)
    if (this.config.logBody && body) {
      log.body = this.redactBody(body);
    }

    logger.http(`→ ${log.method} ${log.path}`, {
      requestId,
      ip: log.ip,
      userAgent: log.userAgent?.slice(0, 50)
    });
  }

  /**
   * Log outgoing response
   */
  logResponse(
    res: ServerResponse,
    requestId: string,
    startTime: number,
    body?: unknown
  ): void {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const log: ResponseLog = {
      requestId,
      statusCode,
      duration,
      timestamp: new Date().toISOString()
    };

    // Add body (redacted)
    if (this.config.logResponseBody && body) {
      log.body = this.redactBody(body);
    }

    // Choose log level based on status code
    const statusEmoji = this.getStatusEmoji(statusCode);
    const logMessage = `← ${statusCode} ${statusEmoji} (${duration}ms)`;

    if (statusCode >= 500) {
      logger.error(logMessage, { requestId, duration });
    } else if (statusCode >= 400) {
      logger.warn(logMessage, { requestId, duration });
    } else {
      logger.http(logMessage, { requestId, duration });
    }
  }

  /**
   * Check if path should be skipped
   */
  private shouldSkip(path: string): boolean {
    return this.config.skipPaths.some(skip => {
      if (skip.endsWith('*')) {
        return path.startsWith(skip.slice(0, -1));
      }
      return path === skip;
    });
  }

  /**
   * Redact sensitive headers
   */
  private redactHeaders(headers: Record<string, string>): Record<string, string> {
    const redacted: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      if (this.config.redactHeaders.includes(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * Redact sensitive fields from body
   */
  private redactBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const stringified = JSON.stringify(body);
    
    // Check max length
    if (stringified.length > this.config.maxBodyLength) {
      return { _truncated: true, _length: stringified.length };
    }

    return this.redactObject(body as Record<string, unknown>);
  }

  /**
   * Recursively redact object fields
   */
  private redactObject(obj: Record<string, unknown>): Record<string, unknown> {
    const redacted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      if (this.config.redactFields.some(f => lowerKey.includes(f.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else if (Array.isArray(value)) {
        redacted[key] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? this.redactObject(item as Record<string, unknown>) 
            : item
        );
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactObject(value as Record<string, unknown>);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * Get client IP from request
   */
  private getClientIP(req: IncomingMessage): string {
    const forwarded = req.headers['x-forwarded-for'];
    
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }

    const realIP = req.headers['x-real-ip'];
    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }

    return req.socket.remoteAddress || 'unknown';
  }

  /**
   * Get emoji for status code
   */
  private getStatusEmoji(statusCode: number): string {
    if (statusCode >= 500) return '💥';
    if (statusCode >= 400) return '⚠️';
    if (statusCode >= 300) return '↪️';
    if (statusCode >= 200) return '✅';
    return '📨';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE TIME TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

export class ResponseTimeTracker {
  private metrics: Map<string, number[]> = new Map();
  private maxSamples: number;

  constructor(maxSamples: number = 1000) {
    this.maxSamples = maxSamples;
  }

  /**
   * Record response time for endpoint
   */
  record(path: string, duration: number): void {
    let samples = this.metrics.get(path);
    
    if (!samples) {
      samples = [];
      this.metrics.set(path, samples);
    }

    samples.push(duration);

    // Keep only last N samples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }

  /**
   * Get statistics for endpoint
   */
  getStats(path: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const samples = this.metrics.get(path);
    
    if (!samples || samples.length === 0) {
      return null;
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const count = sorted.length;

    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      avg: sorted.reduce((a, b) => a + b, 0) / count,
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)]
    };
  }

  /**
   * Get all statistics
   */
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const result: Record<string, ReturnType<typeof this.getStats>> = {};
    
    for (const path of this.metrics.keys()) {
      result[path] = this.getStats(path);
    }

    return result;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export function createRequestLogger(config?: RequestLogConfig): RequestLogger {
  return new RequestLogger(config);
}

export function createResponseTimeTracker(maxSamples?: number): ResponseTimeTracker {
  return new ResponseTimeTracker(maxSamples);
}

export default RequestLogger;
