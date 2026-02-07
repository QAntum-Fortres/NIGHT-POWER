/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: ERROR HANDLER MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Centralized error handling with proper HTTP responses
 * Error classification, logging, and sanitization
 * 
 * @author Dimitar Prodromov
 * @version 26.0.0
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { ServerResponse } from 'http';
import { getLogger } from '../utils/logger';
import { ValidationException } from '../utils/validation';

const logger = getLogger().child('ErrorHandler');

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', true, details);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    super(message, 401, code, true);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
    super(message, 403, code, true);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND', true);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT', true);
    this.name = 'ConflictError';
  }
}

export class TooManyRequestsError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED', true, { retryAfter });
    this.name = 'TooManyRequestsError';
    this.retryAfter = retryAfter;
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR', false);
    this.name = 'InternalServerError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE', true);
    this.name = 'ServiceUnavailableError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR RESPONSE
// ═══════════════════════════════════════════════════════════════════════════════

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: unknown;
    requestId?: string;
    timestamp: string;
    path?: string;
    stack?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export interface ErrorHandlerConfig {
  /** Include stack trace in response */
  includeStack?: boolean;
  /** Include details in response */
  includeDetails?: boolean;
  /** Log all errors */
  logErrors?: boolean;
  /** Environment (development shows more info) */
  environment?: 'development' | 'production';
  /** Custom error transformer */
  transformError?: (error: Error) => AppError;
}

export class ErrorHandler {
  private config: Required<ErrorHandlerConfig>;

  constructor(config?: ErrorHandlerConfig) {
    const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    
    this.config = {
      includeStack: config?.includeStack ?? (env === 'development'),
      includeDetails: config?.includeDetails ?? true,
      logErrors: config?.logErrors ?? true,
      environment: config?.environment ?? env,
      transformError: config?.transformError ?? this.defaultTransform.bind(this)
    };
  }

  /**
   * Handle error and send response
   */
  handle(
    error: Error | unknown,
    res: ServerResponse,
    requestId?: string,
    path?: string
  ): void {
    const appError = this.normalize(error);
    
    if (this.config.logErrors) {
      this.logError(appError, requestId);
    }

    const response = this.formatResponse(appError, requestId, path);
    
    this.sendResponse(res, appError.statusCode, response);
  }

  /**
   * Normalize any error to AppError
   */
  normalize(error: Error | unknown): AppError {
    // Already an AppError
    if (error instanceof AppError) {
      return error;
    }

    // Validation error
    if (error instanceof ValidationException) {
      return new BadRequestError('Validation failed', error.errors);
    }

    // Standard Error
    if (error instanceof Error) {
      return this.config.transformError(error);
    }

    // Unknown error
    return new InternalServerError('An unexpected error occurred');
  }

  /**
   * Default error transformer
   */
  private defaultTransform(error: Error): AppError {
    // Handle common error types
    const message = error.message.toLowerCase();

    if (message.includes('not found')) {
      return new NotFoundError(error.message);
    }

    if (message.includes('unauthorized') || message.includes('unauthenticated')) {
      return new UnauthorizedError(error.message);
    }

    if (message.includes('forbidden') || message.includes('permission denied')) {
      return new ForbiddenError(error.message);
    }

    if (message.includes('invalid') || message.includes('malformed')) {
      return new BadRequestError(error.message);
    }

    if (message.includes('timeout')) {
      return new ServiceUnavailableError('Request timed out');
    }

    if (message.includes('econnrefused') || message.includes('enotfound')) {
      return new ServiceUnavailableError('External service unavailable');
    }

    // Default to internal error
    const appError = new InternalServerError(
      this.config.environment === 'development' 
        ? error.message 
        : 'An unexpected error occurred'
    );
    
    appError.stack = error.stack;
    return appError;
  }

  /**
   * Format error response
   */
  private formatResponse(
    error: AppError,
    requestId?: string,
    path?: string
  ): ErrorResponse {
    const response: ErrorResponse = {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        timestamp: new Date().toISOString()
      }
    };

    if (requestId) {
      response.error.requestId = requestId;
    }

    if (path) {
      response.error.path = path;
    }

    if (this.config.includeDetails && error.details) {
      response.error.details = error.details;
    }

    if (this.config.includeStack && error.stack) {
      response.error.stack = error.stack;
    }

    return response;
  }

  /**
   * Send HTTP response
   */
  private sendResponse(
    res: ServerResponse,
    statusCode: number,
    body: ErrorResponse
  ): void {
    if (res.writableEnded) {
      logger.warn('Attempted to send error response after response ended');
      return;
    }

    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    });
    
    res.end(JSON.stringify(body));
  }

  /**
   * Log error
   */
  private logError(error: AppError, requestId?: string): void {
    const meta: Record<string, unknown> = {
      statusCode: error.statusCode,
      code: error.code,
      isOperational: error.isOperational,
    };
    if (requestId) meta.requestId = requestId;
    if (error.details) meta.details = error.details;

    if (error.isOperational) {
      // Expected errors - log as warning
      if (error.statusCode >= 500) {
        logger.error(error.message, { ...meta, stack: error.stack });
      } else if (error.statusCode >= 400) {
        logger.warn(error.message, meta);
      }
    } else {
      // Unexpected errors - always log as error with stack
      logger.error(error.message, { ...meta, stack: error.stack });
    }
  }

  /**
   * Create middleware function
   */
  middleware(): (
    error: Error,
    res: ServerResponse,
    requestId?: string,
    path?: string
  ) => void {
    return (error, res, requestId, path) => {
      this.handle(error, res, requestId, path);
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASYNC HANDLER WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════

type AsyncHandler<T> = (...args: unknown[]) => Promise<T>;

/**
 * Wrap async handler to catch errors
 */
export function asyncHandler<T>(fn: AsyncHandler<T>): AsyncHandler<T> {
  return async (...args: unknown[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error; // Re-throw to be caught by error handler
    }
  };
}

/**
 * Try-catch wrapper that returns result or error
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<[T, null] | [null, Error]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export function createErrorHandler(config?: ErrorHandlerConfig): ErrorHandler {
  return new ErrorHandler(config);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default ErrorHandler;
