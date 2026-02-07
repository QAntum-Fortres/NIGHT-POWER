/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: UNIFIED API SERVER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Production-ready HTTP server combining REST API + WebSocket Dashboard
 * Enterprise features: Auth, Rate Limiting, Logging, Error Handling
 * 
 * @author Dimitar Prodromov
 * @version 1.0.0
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as crypto from 'crypto';
import * as os from 'os';
import { EventEmitter } from 'events';

import { Logger, createLogger, type LogLevel } from './utils/logger.js';
import { Schema, ValidationException, RequestSchemas } from './utils/validation.js';
import { AuthMiddleware, type AuthConfig, type AuthenticatedUser } from './middleware/auth.js';
import { TieredRateLimiter, type RateLimitResult } from './middleware/rateLimit.js';
import { ErrorHandler, AppError, NotFoundError, BadRequestError, UnauthorizedError, TooManyRequestsError } from './middleware/errorHandler.js';
import { RequestLogger, ResponseTimeTracker } from './middleware/logging.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ServerConfig {
  port: number;
  host?: string;
  ssl?: {
    key: string;
    cert: string;
  };
  cors?: CorsConfig;
  auth?: AuthConfig;
  rateLimit?: {
    windowMs: number;
    tiers: {
      anonymous: number;
      free: number;
      pro: number;
      enterprise: number;
    };
  };
  logging?: {
    level: LogLevel;
    requestBody?: boolean;
    responseBody?: boolean;
  };
  timeouts?: {
    request?: number;
    keepAlive?: number;
  };
  trustProxy?: boolean;
}

export interface CorsConfig {
  enabled: boolean;
  origins?: string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export interface Request {
  raw: http.IncomingMessage;
  method: string;
  path: string;
  url: URL;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: unknown;
  requestId: string;
  startTime: number;
  user?: AuthenticatedUser;
}

export interface Response {
  raw: http.ServerResponse;
  statusCode: number;
  headers: Map<string, string>;
  sent: boolean;
  
  status(code: number): Response;
  header(name: string, value: string): Response;
  json(data: unknown): void;
  send(data: string | Buffer): void;
  redirect(url: string, status?: number): void;
  stream(readable: NodeJS.ReadableStream): void;
}

export type RouteHandler = (req: Request, res: Response) => Promise<void> | void;
export type Middleware = (req: Request, res: Response, next: () => Promise<void>) => Promise<void> | void;

interface Route {
  method: string;
  path: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
  middlewares: Middleware[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED SERVER
// ═══════════════════════════════════════════════════════════════════════════════

export class UnifiedServer extends EventEmitter {
  private server?: http.Server | https.Server;
  private config: ServerConfig;
  private routes: Route[] = [];
  private globalMiddlewares: Middleware[] = [];
  
  private logger: Logger;
  private auth?: AuthMiddleware;
  private rateLimiter?: TieredRateLimiter;
  private errorHandler: ErrorHandler;
  private requestLogger: RequestLogger;
  private responseTimeTracker: ResponseTimeTracker;
  
  // State
  private isShuttingDown: boolean = false;
  private activeConnections: Set<http.IncomingMessage> = new Set();

  constructor(config: ServerConfig) {
    super();
    
    this.config = {
      host: '0.0.0.0',
      cors: { enabled: true },
      trustProxy: false,
      ...config,
      timeouts: {
        request: 30000,
        keepAlive: 5000,
        ...config.timeouts
      }
    };

    // Initialize components
    this.logger = createLogger({
      level: config.logging?.level || 'info',
      format: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
      outputs: ['console']
    });

    if (config.auth && config.auth.strategy !== 'none') {
      this.auth = new AuthMiddleware(config.auth);
    }

    if (config.rateLimit) {
      this.rateLimiter = new TieredRateLimiter({
        windowMs: config.rateLimit.windowMs,
        tiers: config.rateLimit.tiers
      });
    }

    this.errorHandler = new ErrorHandler({
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      includeStack: process.env.NODE_ENV !== 'production'
    });

    this.requestLogger = new RequestLogger({
      logBody: config.logging?.requestBody,
      logResponseBody: config.logging?.responseBody
    });

    this.responseTimeTracker = new ResponseTimeTracker();

    // Register built-in routes
    this.registerBuiltInRoutes();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTE REGISTRATION
  // ═══════════════════════════════════════════════════════════════════════════

  get(path: string, ...handlers: (Middleware | RouteHandler)[]): this {
    return this.addRoute('GET', path, handlers);
  }

  post(path: string, ...handlers: (Middleware | RouteHandler)[]): this {
    return this.addRoute('POST', path, handlers);
  }

  put(path: string, ...handlers: (Middleware | RouteHandler)[]): this {
    return this.addRoute('PUT', path, handlers);
  }

  delete(path: string, ...handlers: (Middleware | RouteHandler)[]): this {
    return this.addRoute('DELETE', path, handlers);
  }

  patch(path: string, ...handlers: (Middleware | RouteHandler)[]): this {
    return this.addRoute('PATCH', path, handlers);
  }

  options(path: string, ...handlers: (Middleware | RouteHandler)[]): this {
    return this.addRoute('OPTIONS', path, handlers);
  }

  all(path: string, ...handlers: (Middleware | RouteHandler)[]): this {
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].forEach(method => {
      this.addRoute(method, path, handlers);
    });
    return this;
  }

  use(middleware: Middleware): this {
    this.globalMiddlewares.push(middleware);
    return this;
  }

  private addRoute(method: string, path: string, handlers: (Middleware | RouteHandler)[]): this {
    const paramNames: string[] = [];
    const patternStr = path.replace(/:(\w+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });

    const middlewares = handlers.slice(0, -1) as Middleware[];
    const handler = handlers[handlers.length - 1] as RouteHandler;

    this.routes.push({
      method,
      path,
      pattern: new RegExp(`^${patternStr}$`),
      paramNames,
      handler,
      middlewares
    });

    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVER LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const handler = this.handleRequest.bind(this);

      if (this.config.ssl) {
        this.server = https.createServer({
          key: this.config.ssl.key,
          cert: this.config.ssl.cert
        }, handler);
      } else {
        this.server = http.createServer(handler);
      }

      // Configure server
      this.server.timeout = this.config.timeouts!.request;
      this.server.keepAliveTimeout = this.config.timeouts!.keepAlive;

      // Track connections for graceful shutdown
      this.server.on('connection', (socket) => {
        const req = socket as unknown as http.IncomingMessage;
        this.activeConnections.add(req);
        socket.on('close', () => this.activeConnections.delete(req));
      });

      this.server.on('error', (error) => {
        this.logger.error('Server error', { error });
        reject(error);
      });

      this.server.listen(this.config.port, this.config.host, () => {
        const protocol = this.config.ssl ? 'https' : 'http';
        const address = `${protocol}://${this.config.host}:${this.config.port}`;
        
        this.logger.info(`🚀 Mind-Engine API Server started`, {
          address,
          environment: process.env.NODE_ENV || 'development',
          pid: process.pid
        });

        this.emit('start', { address, port: this.config.port });
        resolve();
      });

      // Graceful shutdown handlers
      this.setupShutdownHandlers();
    });
  }

  async stop(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    this.logger.info('🛑 Shutting down server...');

    return new Promise((resolve) => {
      // Stop accepting new connections
      this.server?.close(() => {
        this.logger.info('✅ Server closed');
        
        // Cleanup
        this.rateLimiter?.destroy();
        this.logger.close();
        
        this.emit('stop');
        resolve();
      });

      // Force close after timeout
      setTimeout(() => {
        this.logger.warn('⚠️ Forcing shutdown after timeout');
        this.activeConnections.forEach((conn) => {
          (conn as any).destroy?.();
        });
        resolve();
      }, 10000);
    });
  }

  private setupShutdownHandlers(): void {
    const shutdown = async (signal: string) => {
      this.logger.info(`Received ${signal}`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', { error });
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      this.logger.error('Unhandled rejection', { reason });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUEST HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  private async handleRequest(
    rawReq: http.IncomingMessage,
    rawRes: http.ServerResponse
  ): Promise<void> {
    if (this.isShuttingDown) {
      rawRes.writeHead(503, { 'Retry-After': '30' });
      rawRes.end(JSON.stringify({ error: 'Server is shutting down' }));
      return;
    }

    const startTime = Date.now();
    const requestId = this.requestLogger.getRequestId(rawReq);

    // Parse URL
    const parsedUrl = new URL(
      rawReq.url || '/',
      `http://${rawReq.headers.host || 'localhost'}`
    );
    
    const path = parsedUrl.pathname;
    const method = rawReq.method || 'GET';

    // Build request object
    const req: Request = {
      raw: rawReq,
      method,
      path,
      url: parsedUrl,
      params: {},
      query: Object.fromEntries(parsedUrl.searchParams),
      headers: rawReq.headers as Record<string, string>,
      body: null,
      requestId,
      startTime
    };

    // Build response object
    const res = this.createResponse(rawRes);

    try {
      // CORS preflight
      if (this.config.cors?.enabled) {
        this.handleCors(req, res);
        if (method === 'OPTIONS') {
          res.status(204).send('');
          return;
        }
      }

      // Security headers
      this.setSecurityHeaders(res);

      // Set request ID header
      res.header('X-Request-Id', requestId);

      // Parse body
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        req.body = await this.parseBody(rawReq);
      }

      // Log request
      this.requestLogger.logRequest(rawReq, requestId, req.body);

      // Authentication
      if (this.auth) {
        const authResult = this.auth.authenticate(rawReq, path);
        if (!authResult.success) {
          throw new UnauthorizedError(authResult.error, authResult.errorCode);
        }
        req.user = authResult.user;
      }

      // Rate limiting
      if (this.rateLimiter && req.user) {
        const tier = req.user.tier as 'anonymous' | 'free' | 'pro' | 'enterprise';
        const limitResult = this.rateLimiter.check(rawReq, tier);
        
        // Set rate limit headers
        const headers = this.rateLimiter.getHeaders(limitResult);
        Object.entries(headers).forEach(([k, v]) => res.header(k, v));
        
        if (!limitResult.allowed) {
          throw new TooManyRequestsError(limitResult.retryAfter);
        }
      }

      // Find matching route
      const route = this.findRoute(method, path);
      
      if (!route) {
        throw new NotFoundError(`Route ${method} ${path}`);
      }

      // Extract path params
      const match = path.match(route.pattern);
      if (match) {
        route.paramNames.forEach((name, i) => {
          req.params[name] = decodeURIComponent(match[i + 1]);
        });
      }

      // Run middlewares
      await this.runMiddlewares(req, res, [
        ...this.globalMiddlewares,
        ...route.middlewares
      ]);

      // Run handler
      if (!res.sent) {
        await route.handler(req, res);
      }

    } catch (error) {
      this.errorHandler.handle(error, rawRes, requestId, path);
    } finally {
      // Log response
      const duration = Date.now() - startTime;
      this.requestLogger.logResponse(rawRes, requestId, startTime);
      this.responseTimeTracker.record(path, duration);
    }
  }

  private createResponse(raw: http.ServerResponse): Response {
    const res: Response = {
      raw,
      statusCode: 200,
      headers: new Map(),
      sent: false,

      status(code: number): Response {
        res.statusCode = code;
        return res;
      },

      header(name: string, value: string): Response {
        res.headers.set(name, value);
        return res;
      },

      json(data: unknown): void {
        if (res.sent) return;
        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify(data));
      },

      send(data: string | Buffer): void {
        if (res.sent) return;
        res.sent = true;
        
        res.headers.forEach((value, key) => {
          raw.setHeader(key, value);
        });
        
        raw.statusCode = res.statusCode;
        raw.end(data);
      },

      redirect(url: string, status: number = 302): void {
        res.status(status).header('Location', url).send('');
      },

      stream(readable: NodeJS.ReadableStream): void {
        if (res.sent) return;
        res.sent = true;
        
        res.headers.forEach((value, key) => {
          raw.setHeader(key, value);
        });
        
        raw.statusCode = res.statusCode;
        readable.pipe(raw);
      }
    };

    return res;
  }

  private findRoute(method: string, path: string): Route | undefined {
    return this.routes.find(r => 
      r.method === method && r.pattern.test(path)
    );
  }

  private async parseBody(req: http.IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let size = 0;
      const maxSize = 10 * 1024 * 1024; // 10MB

      req.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxSize) {
          reject(new BadRequestError('Request body too large'));
          return;
        }
        chunks.push(chunk);
      });

      req.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        
        if (!body) {
          resolve(null);
          return;
        }

        const contentType = req.headers['content-type'] || '';

        if (contentType.includes('application/json')) {
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new BadRequestError('Invalid JSON body'));
          }
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          resolve(Object.fromEntries(new URLSearchParams(body)));
        } else {
          resolve(body);
        }
      });

      req.on('error', reject);
    });
  }

  private async runMiddlewares(
    req: Request,
    res: Response,
    middlewares: Middleware[]
  ): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (res.sent || index >= middlewares.length) return;
      
      const middleware = middlewares[index++];
      await middleware(req, res, next);
    };

    await next();
  }

  private handleCors(req: Request, res: Response): void {
    const cors = this.config.cors!;
    const origin = req.headers['origin'];

    // Determine allowed origin
    let allowedOrigin = '*';
    if (cors.origins && origin) {
      if (cors.origins.includes(origin) || cors.origins.includes('*')) {
        allowedOrigin = origin;
      }
    }

    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Methods', 
      cors.methods?.join(', ') || 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 
      cors.headers?.join(', ') || 'Content-Type, Authorization, X-API-Key, X-Request-Id');
    
    if (cors.credentials) {
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    if (cors.maxAge) {
      res.header('Access-Control-Max-Age', cors.maxAge.toString());
    }
  }

  private setSecurityHeaders(res: Response): void {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    if (this.config.ssl) {
      res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILT-IN ROUTES
  // ═══════════════════════════════════════════════════════════════════════════

  private registerBuiltInRoutes(): void {
    // Health check
    this.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Ready check
    this.get('/ready', (req, res) => {
      if (this.isShuttingDown) {
        res.status(503).json({ status: 'shutting_down' });
      } else {
        res.json({ status: 'ready' });
      }
    });

    // API info
    this.get('/api/v1', (req, res) => {
      res.json({
        name: 'Mind-Engine API',
        version: '1.0.0',
        documentation: '/api/v1/docs',
        endpoints: {
          sessions: '/api/v1/sessions',
          tests: '/api/v1/tests',
          jobs: '/api/v1/jobs',
          reports: '/api/v1/reports'
        }
      });
    });

    // Metrics
    this.get('/api/v1/metrics', (req, res) => {
      const metrics = {
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        },
        system: {
          platform: os.platform(),
          arch: os.arch(),
          cpus: os.cpus().length,
          totalMemory: os.totalmem(),
          freeMemory: os.freemem(),
          loadAvg: os.loadavg()
        },
        responseTime: this.responseTimeTracker.getAllStats()
      };

      res.json(metrics);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  getLogger(): Logger {
    return this.logger;
  }

  getMetrics(): Record<string, unknown> {
    return {
      activeConnections: this.activeConnections.size,
      responseTime: this.responseTimeTracker.getAllStats()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export function createServer(config: ServerConfig): UnifiedServer {
  return new UnifiedServer(config);
}

export default UnifiedServer;
