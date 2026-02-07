/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: UNIFIED API - EXPORTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Main entry point for the unified API module
 * 
 * @author Dimitar Prodromov
 * @version 1.0.0
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Server
export { 
  UnifiedServer, 
  createServer,
  type ServerConfig,
  type Request,
  type Response,
  type RouteHandler,
  type Middleware,
  type CorsConfig
} from './server.js';

// Logger
export { 
  Logger, 
  createLogger, 
  getLogger,
  type LogLevel,
  type LogEntry,
  type LoggerConfig
} from './utils/logger.js';

// Validation
export { 
  Schema, 
  ValidationException,
  CommonSchemas,
  RequestSchemas,
  v,
  type ValidationResult,
  type ValidationError,
  type SchemaInfer
} from './utils/validation.js';

// Auth
export { 
  AuthMiddleware,
  createApiKey,
  createUser,
  createJWT,
  JWTUtil,
  PasswordUtil,
  type AuthConfig,
  type AuthStrategy,
  type AuthResult,
  type AuthenticatedUser,
  type ApiKeyInfo,
  type UserInfo,
  type JWTPayload
} from './middleware/auth.js';

// Rate Limiting
export {
  RateLimiter,
  SlidingWindowRateLimiter,
  TieredRateLimiter,
  createRateLimiter,
  createSlidingWindowRateLimiter,
  createTieredRateLimiter,
  type RateLimitConfig,
  type RateLimitResult,
  type TieredRateLimitConfig
} from './middleware/rateLimit.js';

// Error Handling
export {
  ErrorHandler,
  createErrorHandler,
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  InternalServerError,
  ServiceUnavailableError,
  asyncHandler,
  tryCatch,
  type ErrorResponse,
  type ErrorHandlerConfig
} from './middleware/errorHandler.js';

// Request Logging
export {
  RequestLogger,
  ResponseTimeTracker,
  createRequestLogger,
  createResponseTimeTracker,
  type RequestLogConfig,
  type RequestLog,
  type ResponseLog
} from './middleware/logging.js';

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK START FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

import { createServer, type ServerConfig } from './server.js';
import { createApiKey, type ApiKeyInfo } from './middleware/auth.js';

/**
 * Quick start a production-ready API server
 */
export function quickStart(options: {
  port?: number;
  apiKeys?: string[];
  rateLimit?: boolean;
  cors?: boolean;
}): { server: ReturnType<typeof createServer>; keys: ApiKeyInfo[] } {
  const keys: ApiKeyInfo[] = [];
  const apiKeyMap = new Map<string, ApiKeyInfo>();

  // Generate API keys
  if (options.apiKeys) {
    options.apiKeys.forEach((name) => {
      const key = createApiKey(name, 'pro', ['*']);
      keys.push(key);
      apiKeyMap.set(key.key, key);
    });
  } else {
    // Generate default key
    const key = createApiKey('default', 'pro', ['*']);
    keys.push(key);
    apiKeyMap.set(key.key, key);
  }

  const config: ServerConfig = {
    port: options.port || 3000,
    cors: {
      enabled: options.cors ?? true
    },
    auth: {
      strategy: 'apikey',
      apiKeys: apiKeyMap,
      publicPaths: ['/health', '/ready', '/api/v1']
    },
    ...(options.rateLimit !== false && {
      rateLimit: {
        windowMs: 60000,
        tiers: {
          anonymous: 60,
          free: 300,
          pro: 3000,
          enterprise: 30000
        }
      }
    })
  };

  const server = createServer(config);

  return { server, keys };
}

// Default export
export default {
  createServer,
  quickStart
};
