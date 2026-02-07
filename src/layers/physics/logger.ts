/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * PHYSICS LAYER LOGGER - Lightweight Logging for Infrastructure
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * UNIVERSAL SYNTHESIS LAW:
 *   PHYSICS layer imports ONLY from MATH layer.
 *   This logger uses NO external dependencies except Node.js primitives.
 * 
 * @module layers/physics/logger
 * @layer PHYSICS [Level 2]
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES (No external imports - PHYSICS purity)
// ═══════════════════════════════════════════════════════════════════════════════

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  module?: string;
  operation?: string;
  correlationId?: string;
  [key: string]: unknown;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
};

const LEVEL_PREFIXES: Record<LogLevel, string> = {
  debug: '[DEBUG]',
  info: '[INFO] ',
  warn: '[WARN] ',
  error: '[ERROR]',
  fatal: '[FATAL]'
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHYSICS LOGGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Lightweight logger for PHYSICS layer components.
 * Zero external dependencies. Pure Node.js console output.
 */
export class PhysicsLogger {
  private context: string;
  private minLevel: LogLevel;

  constructor(context: string, minLevel: LogLevel = 'info') {
    this.context = context;
    this.minLevel = this.resolveMinLevel(minLevel);
  }

  /**
   * Resolve minimum log level from environment or default
   */
  private resolveMinLevel(defaultLevel: LogLevel): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
    if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
      return envLevel;
    }
    // Production = warn, Development = debug
    if (process.env.NODE_ENV === 'production') {
      return 'warn';
    }
    return defaultLevel;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  /**
   * Format timestamp in ISO format
   */
  private timestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Format a log entry
   */
  private format(level: LogLevel, message: string, ctx?: LogContext): string {
    const ts = this.timestamp();
    const prefix = LEVEL_PREFIXES[level];
    const context = this.context + (ctx?.module ? `:${ctx.module}` : '');
    
    let line = `${ts} ${prefix} [${context}] ${message}`;
    
    // Add structured context if present
    if (ctx && Object.keys(ctx).length > 0) {
      const extras = { ...ctx };
      delete extras.module;
      if (Object.keys(extras).length > 0) {
        line += ` ${JSON.stringify(extras)}`;
      }
    }
    
    return line;
  }

  /**
   * Output log entry to appropriate stream
   */
  private output(level: LogLevel, formatted: string): void {
    if (level === 'error' || level === 'fatal') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Debug level - Development only
   */
  debug(message: string, ctx?: LogContext | unknown): void {
    if (this.shouldLog('debug')) {
      const context = this.normalizeContext(ctx);
      this.output('debug', this.format('debug', message, context));
    }
  }

  /**
   * Info level - Normal operations
   */
  info(message: string, ctx?: LogContext | unknown): void {
    if (this.shouldLog('info')) {
      const context = this.normalizeContext(ctx);
      this.output('info', this.format('info', message, context));
    }
  }

  /**
   * Warn level - Potential issues
   */
  warn(message: string, ctx?: LogContext | unknown): void {
    if (this.shouldLog('warn')) {
      const context = this.normalizeContext(ctx);
      this.output('warn', this.format('warn', message, context));
    }
  }

  /**
   * Normalize various context types to LogContext
   */
  private normalizeContext(ctx?: LogContext | unknown): LogContext | undefined {
    if (!ctx) return undefined;
    if (typeof ctx === 'object' && !Array.isArray(ctx)) return ctx as LogContext;
    if (Array.isArray(ctx)) return { data: ctx };
    return { data: ctx };
  }

  /**
   * Error level - Recoverable errors
   */
  error(message: string, ctx?: LogContext | unknown): void;
  error(message: string, error: Error, ctx?: LogContext | unknown): void;
  error(message: string, errorOrCtx?: Error | LogContext | unknown, ctx?: LogContext | unknown): void {
    if (!this.shouldLog('error')) return;
    
    let logCtx = this.normalizeContext(ctx);
    if (errorOrCtx instanceof Error) {
      logCtx = {
        ...logCtx,
        errorName: errorOrCtx.name,
        errorMessage: errorOrCtx.message,
        stack: errorOrCtx.stack?.split('\n').slice(0, 5).join('\n')
      };
    } else if (errorOrCtx) {
      logCtx = this.normalizeContext(errorOrCtx);
    }
    
    this.output('error', this.format('error', message, logCtx));
  }

  /**
   * Fatal level - Unrecoverable errors
   */
  fatal(message: string, ctx?: LogContext | unknown): void;
  fatal(message: string, error: Error, ctx?: LogContext | unknown): void;
  fatal(message: string, errorOrCtx?: Error | LogContext | unknown, ctx?: LogContext | unknown): void {
    let logCtx = this.normalizeContext(ctx);
    if (errorOrCtx instanceof Error) {
      logCtx = {
        ...logCtx,
        errorName: errorOrCtx.name,
        errorMessage: errorOrCtx.message,
        stack: errorOrCtx.stack
      };
    } else if (errorOrCtx) {
      logCtx = this.normalizeContext(errorOrCtx);
    }
    
    this.output('fatal', this.format('fatal', message, logCtx));
  }

  /**
   * Create child logger with additional context
   */
  child(module: string): PhysicsLogger {
    return new PhysicsLogger(`${this.context}:${module}`, this.minLevel);
  }

  /**
   * Measure execution time of async operation
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`${operation} completed`, { duration, operation });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${operation} failed`, error as Error, { duration, operation });
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

const loggerCache = new Map<string, PhysicsLogger>();

/**
 * Create or retrieve a logger for a PHYSICS layer component
 * 
 * @example
 * ```typescript
 * import { createLogger } from '../layers/physics/logger';
 * const log = createLogger('SwarmOrchestrator');
 * log.info('Starting swarm coordination');
 * ```
 */
export function createLogger(context: string): PhysicsLogger {
  if (!loggerCache.has(context)) {
    loggerCache.set(context, new PhysicsLogger(context));
  }
  return loggerCache.get(context)!;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL SINGLETON (Compatible with old logger interface)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Global singleton logger instance
 * 
 * @example
 * ```typescript
 * import { logger } from '../layers/physics/logger';
 * logger.info('Message');
 * logger.debug('Debug info');
 * logger.error('Error occurred', error);
 * ```
 */
export const logger = new PhysicsLogger('PHYSICS');

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default logger;
