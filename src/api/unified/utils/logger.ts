/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: PROFESSIONAL LOGGER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Production-grade logging with Winston
 * Structured logs, rotation, multiple transports
 * 
 * @author Dimitar Prodromov
 * @version 26.0.0
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug' | 'trace';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  context?: string;
  meta?: Record<string, unknown>;
  stack?: string;
  duration?: number;
}

export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'pretty';
  outputs: Array<'console' | 'file'>;
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
  colorize?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5
};

const COLORS: Record<LogLevel, string> = {
  error: '\x1b[31m',   // Red
  warn: '\x1b[33m',    // Yellow
  info: '\x1b[36m',    // Cyan
  http: '\x1b[35m',    // Magenta
  debug: '\x1b[32m',   // Green
  trace: '\x1b[90m'    // Gray
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// ═══════════════════════════════════════════════════════════════════════════════
// LOGGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class Logger extends EventEmitter {
  private config: LoggerConfig;
  private fileStream?: fs.WriteStream;
  private currentFileSize: number = 0;
  private fileIndex: number = 0;

  constructor(config?: Partial<LoggerConfig>) {
    super();
    
    this.config = {
      level: config?.level ?? 'info',
      format: config?.format ?? 'pretty',
      outputs: config?.outputs ?? ['console'],
      filePath: config?.filePath,
      maxFileSize: config?.maxFileSize ?? 10 * 1024 * 1024, // 10MB
      maxFiles: config?.maxFiles ?? 5,
      colorize: config?.colorize ?? true
    };

    if (this.config.outputs.includes('file') && this.config.filePath) {
      this.initFileStream();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  error(message: string, meta?: unknown): void {
    this.log('error', message, meta);
  }

  warn(message: string, meta?: unknown): void {
    this.log('warn', message, meta);
  }

  info(message: string, meta?: unknown): void {
    this.log('info', message, meta);
  }

  http(message: string, meta?: unknown): void {
    this.log('http', message, meta);
  }

  debug(message: string, meta?: unknown): void {
    this.log('debug', message, meta);
  }

  trace(message: string, meta?: unknown): void {
    this.log('trace', message, meta);
  }

  /**
   * Create child logger with context
   */
  child(context: string): ChildLogger {
    return new ChildLogger(this, context);
  }

  /**
   * Log with request ID for tracing
   */
  withRequestId(requestId: string): RequestLogger {
    return new RequestLogger(this, requestId);
  }

  /**
   * Flush and close file streams
   */
  async close(): Promise<void> {
    if (this.fileStream) {
      return new Promise((resolve) => {
        this.fileStream!.end(() => resolve());
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private log(
    level: LogLevel, 
    message: string, 
    meta?: unknown,
    requestId?: string,
    context?: string
  ): void {
    // Check if we should log this level
    if (LOG_LEVELS[level] > LOG_LEVELS[this.config.level]) {
      return;
    }

    const metaObj = (typeof meta === 'object' && meta !== null) ? meta as Record<string, unknown> : undefined;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(requestId && { requestId }),
      ...(context && { context }),
      ...(metaObj && Object.keys(metaObj).length > 0 && { meta: metaObj })
    };

    // Handle error objects
    if (metaObj?.error instanceof Error) {
      entry.stack = metaObj.error.stack;
      entry.meta = {
        ...(entry.meta || {}),
        errorName: metaObj.error.name,
        errorMessage: metaObj.error.message
      };
      delete (entry.meta as Record<string, unknown>).error;
    }

    // Output to configured destinations
    if (this.config.outputs.includes('console')) {
      this.writeConsole(entry);
    }

    if (this.config.outputs.includes('file') && this.fileStream) {
      this.writeFile(entry);
    }

    // Emit for external handlers
    this.emit('log', entry);
  }

  private writeConsole(entry: LogEntry): void {
    const { level, timestamp, message, requestId, context, meta, stack, duration } = entry;

    if (this.config.format === 'json') {
      console.log(JSON.stringify(entry));
      return;
    }

    // Pretty format
    const color = this.config.colorize ? COLORS[level] : '';
    const reset = this.config.colorize ? RESET : '';
    const bold = this.config.colorize ? BOLD : '';
    
    const time = timestamp.split('T')[1].slice(0, 12);
    const levelStr = level.toUpperCase().padEnd(5);
    
    let line = `${color}${time} ${bold}${levelStr}${reset}${color}`;
    
    if (context) {
      line += ` [${context}]`;
    }
    
    if (requestId) {
      line += ` (${requestId.slice(0, 8)})`;
    }
    
    line += ` ${message}`;
    
    if (duration !== undefined) {
      line += ` ${bold}+${duration}ms${reset}${color}`;
    }
    
    line += reset;

    console.log(line);

    if (meta && Object.keys(meta).length > 0) {
      console.log(`  ${JSON.stringify(meta)}`);
    }

    if (stack) {
      console.log(`  ${stack.split('\n').slice(1).join('\n  ')}`);
    }
  }

  private writeFile(entry: LogEntry): void {
    if (!this.fileStream) return;

    const line = JSON.stringify(entry) + '\n';
    const lineSize = Buffer.byteLength(line);

    // Check if rotation needed
    if (this.currentFileSize + lineSize > this.config.maxFileSize!) {
      this.rotateFile();
    }

    this.fileStream.write(line);
    this.currentFileSize += lineSize;
  }

  private initFileStream(): void {
    const dir = path.dirname(this.config.filePath!);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.fileStream = fs.createWriteStream(this.config.filePath!, { flags: 'a' });
    
    try {
      const stats = fs.statSync(this.config.filePath!);
      this.currentFileSize = stats.size;
    } catch {
      this.currentFileSize = 0;
    }
  }

  private rotateFile(): void {
    if (!this.fileStream || !this.config.filePath) return;

    this.fileStream.end();

    // Rotate existing files
    for (let i = this.config.maxFiles! - 1; i > 0; i--) {
      const oldPath = `${this.config.filePath}.${i}`;
      const newPath = `${this.config.filePath}.${i + 1}`;
      
      if (fs.existsSync(oldPath)) {
        if (i === this.config.maxFiles! - 1) {
          fs.unlinkSync(oldPath);
        } else {
          fs.renameSync(oldPath, newPath);
        }
      }
    }

    // Rename current file
    if (fs.existsSync(this.config.filePath)) {
      fs.renameSync(this.config.filePath, `${this.config.filePath}.1`);
    }

    // Create new file
    this.fileStream = fs.createWriteStream(this.config.filePath, { flags: 'a' });
    this.currentFileSize = 0;
  }

  // Internal method for child/request loggers
  _log(
    level: LogLevel, 
    message: string, 
    meta?: Record<string, unknown>,
    requestId?: string,
    context?: string
  ): void {
    this.log(level, message, meta, requestId, context);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHILD LOGGER
// ═══════════════════════════════════════════════════════════════════════════════

class ChildLogger {
  constructor(
    private parent: Logger,
    private context: string
  ) {}

  error(message: string, meta?: Record<string, unknown>): void {
    this.parent._log('error', message, meta, undefined, this.context);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.parent._log('warn', message, meta, undefined, this.context);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.parent._log('info', message, meta, undefined, this.context);
  }

  http(message: string, meta?: Record<string, unknown>): void {
    this.parent._log('http', message, meta, undefined, this.context);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.parent._log('debug', message, meta, undefined, this.context);
  }

  trace(message: string, meta?: Record<string, unknown>): void {
    this.parent._log('trace', message, meta, undefined, this.context);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST LOGGER
// ═══════════════════════════════════════════════════════════════════════════════

class RequestLogger {
  constructor(
    private parent: Logger,
    private requestId: string
  ) {}

  error(message: string, meta?: Record<string, unknown>): void {
    this.parent._log('error', message, meta, this.requestId);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.parent._log('warn', message, meta, this.requestId);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.parent._log('info', message, meta, this.requestId);
  }

  http(message: string, meta?: Record<string, unknown>): void {
    this.parent._log('http', message, meta, this.requestId);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.parent._log('debug', message, meta, this.requestId);
  }

  trace(message: string, meta?: Record<string, unknown>): void {
    this.parent._log('trace', message, meta, this.requestId);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

let defaultLogger: Logger | null = null;

export function getLogger(): Logger {
  if (!defaultLogger) {
    defaultLogger = new Logger({
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      format: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
      outputs: ['console'],
      colorize: process.env.NODE_ENV !== 'production'
    });
  }
  return defaultLogger;
}

export function createLogger(config: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL LOGGER INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════
// This is the default logger instance that can be imported directly:
// import { logger } from './logger';
// ═══════════════════════════════════════════════════════════════════════════════

export const logger = getLogger();

export default Logger;
