/**
 * 🏢 QANTUM ENTERPRISE LOGGER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Centralized logging system with environment-based filtering.
 * Replaces 148+ console.log calls with structured, performant logging.
 * 
 * Features:
 * - Environment-based log levels (DEBUG, INFO, WARN, ERROR)
 * - Structured JSON output for production
 * - Performance-optimized (no-op in production for debug)
 * - Color-coded console output for development
 * - Automatic context injection
 * - Log rotation ready
 * 
 * @version 1.0.0
 * @author QAntum AI Architect
 * @phase Quick Win #1
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
  correlationId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'pretty' | 'minimal';
  colorize: boolean;
  includeTimestamp: boolean;
  includeContext: boolean;
  outputFile?: string;
  maxFileSize?: number; // bytes
  maxFiles?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
  silent: 5
};

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: COLORS.dim + COLORS.cyan,
  info: COLORS.green,
  warn: COLORS.yellow,
  error: COLORS.red,
  fatal: COLORS.bgRed + COLORS.white + COLORS.bright,
  silent: ''
};

const LEVEL_ICONS: Record<LogLevel, string> = {
  debug: '🔍',
  info: '📘',
  warn: '⚠️',
  error: '❌',
  fatal: '💀',
  silent: ''
};

const DEFAULT_CONFIG: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  format: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
  colorize: process.env.NODE_ENV !== 'production',
  includeTimestamp: true,
  includeContext: true
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENTERPRISE LOGGER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🏢 EnterpriseLogger - Production-grade logging
 */
export class EnterpriseLogger extends EventEmitter {
  private config: LoggerConfig;
  private context: string;
  private correlationId?: string;
  private fileStream?: fs.WriteStream;
  private buffer: LogEntry[] = [];
  private flushInterval?: NodeJS.Timeout;

  constructor(context: string = 'QAntum', config: Partial<LoggerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.context = context;

    // Setup file output if configured
    if (this.config.outputFile) {
      this.setupFileOutput();
    }

    // Setup periodic flush
    this.flushInterval = setInterval(() => this.flush(), 5000);
  }

  /**
   * Create a child logger with inherited context
   */
  child(childContext: string): EnterpriseLogger {
    const childLogger = new EnterpriseLogger(
      `${this.context}:${childContext}`,
      this.config
    );
    childLogger.correlationId = this.correlationId;
    return childLogger;
  }

  /**
   * Set correlation ID for request tracing
   */
  setCorrelationId(id: string): this {
    this.correlationId = id;
    return this;
  }

  /**
   * 🔍 Debug - Only in development
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  /**
   * 📘 Info - General information
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  /**
   * ⚠️ Warn - Potential issues
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  /**
   * ❌ Error - Errors with optional error object
   */
  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined;
    
    this.log('error', message, data, errorData);
  }

  /**
   * 💀 Fatal - Critical errors
   */
  fatal(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined;
    
    this.log('fatal', message, data, errorData);
  }

  /**
   * ⏱️ Timer - Measure operation duration
   */
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.info(`${label} completed`, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  /**
   * 📊 Table - Log structured data as table
   */
  table(data: Record<string, unknown>[] | Record<string, unknown>): void {
    if (this.config.format === 'pretty' && !this.isLevelEnabled('debug')) return;
    console.table(data);
  }

  /**
   * 📦 Group - Start a log group
   */
  group(label: string): void {
    if (this.config.format === 'pretty') {
      console.group(`${COLORS.bright}${label}${COLORS.reset}`);
    }
  }

  /**
   * 📦 GroupEnd - End a log group
   */
  groupEnd(): void {
    if (this.config.format === 'pretty') {
      console.groupEnd();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL
  // ═══════════════════════════════════════════════════════════════════════════

  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: { name: string; message: string; stack?: string }
  ): void {
    // Early exit if level is below threshold
    if (!this.isLevelEnabled(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.config.includeContext ? this.context : undefined,
      data,
      error,
      correlationId: this.correlationId
    };

    // Emit event for external handlers
    this.emit('log', entry);

    // Output based on format
    switch (this.config.format) {
      case 'json':
        this.outputJSON(entry);
        break;
      case 'pretty':
        this.outputPretty(entry);
        break;
      case 'minimal':
        this.outputMinimal(entry);
        break;
    }

    // Buffer for file output
    if (this.config.outputFile) {
      this.buffer.push(entry);
    }
  }

  private isLevelEnabled(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private outputJSON(entry: LogEntry): void {
    const output = JSON.stringify(entry);
    
    if (entry.level === 'error' || entry.level === 'fatal') {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  private outputPretty(entry: LogEntry): void {
    const color = this.config.colorize ? LEVEL_COLORS[entry.level] : '';
    const reset = this.config.colorize ? COLORS.reset : '';
    const icon = LEVEL_ICONS[entry.level];
    
    let output = '';
    
    // Timestamp
    if (this.config.includeTimestamp) {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      output += `${COLORS.dim}[${time}]${reset} `;
    }
    
    // Level
    output += `${color}${icon} ${entry.level.toUpperCase().padEnd(5)}${reset} `;
    
    // Context
    if (entry.context) {
      output += `${COLORS.cyan}[${entry.context}]${reset} `;
    }
    
    // Message
    output += entry.message;
    
    // Data
    if (entry.data && Object.keys(entry.data).length > 0) {
      output += ` ${COLORS.dim}${JSON.stringify(entry.data)}${reset}`;
    }
    
    // Error
    if (entry.error) {
      output += `\n${COLORS.red}  └─ ${entry.error.name}: ${entry.error.message}${reset}`;
      if (entry.error.stack && this.config.level === 'debug') {
        output += `\n${COLORS.dim}${entry.error.stack}${reset}`;
      }
    }

    console.log(output);
  }

  private outputMinimal(entry: LogEntry): void {
    const prefix = `[${entry.level.charAt(0).toUpperCase()}]`;
    console.log(`${prefix} ${entry.message}`);
  }

  private setupFileOutput(): void {
    const dir = path.dirname(this.config.outputFile!);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    this.fileStream = fs.createWriteStream(this.config.outputFile!, { flags: 'a' });
  }

  private flush(): void {
    if (this.buffer.length === 0 || !this.fileStream) return;
    
    const entries = this.buffer.splice(0, this.buffer.length);
    const output = entries.map(e => JSON.stringify(e)).join('\n') + '\n';
    
    this.fileStream.write(output);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    this.flush();
    
    if (this.fileStream) {
      this.fileStream.end();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

let globalLogger: EnterpriseLogger | null = null;

/**
 * Get the global logger instance (Singleton)
 */
export function getLogger(): EnterpriseLogger {
  if (!globalLogger) {
    globalLogger = new EnterpriseLogger('QAntum');
  }
  return globalLogger;
}

/**
 * Create a new logger with custom context
 */
export function createLogger(context: string, config?: Partial<LoggerConfig>): EnterpriseLogger {
  return new EnterpriseLogger(context, config);
}

/**
 * Configure the global logger
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  globalLogger = new EnterpriseLogger('QAntum', config);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const logger = getLogger();

// Quick access functions
export const debug = (msg: string, data?: Record<string, unknown>) => logger.debug(msg, data);
export const info = (msg: string, data?: Record<string, unknown>) => logger.info(msg, data);
export const warn = (msg: string, data?: Record<string, unknown>) => logger.warn(msg, data);
export const error = (msg: string, err?: Error, data?: Record<string, unknown>) => logger.error(msg, err, data);
export const fatal = (msg: string, err?: Error, data?: Record<string, unknown>) => logger.fatal(msg, err, data);

export default EnterpriseLogger;
