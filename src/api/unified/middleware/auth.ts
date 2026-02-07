/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: AUTHENTICATION MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Multi-strategy authentication: API Key, JWT, Basic Auth
 * Rate limiting per authentication level
 * 
 * @author Dimitar Prodromov
 * @version 1.0.0-QANTUM-PRIME
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as crypto from 'crypto';
import type { IncomingMessage } from 'http';
import { getLogger } from '../utils/logger';

const logger = getLogger().child('Auth');

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type AuthStrategy = 'none' | 'apikey' | 'jwt' | 'basic' | 'bearer';

export interface AuthConfig {
  strategy: AuthStrategy;
  apiKeys?: Map<string, ApiKeyInfo>;
  jwtSecret?: string;
  jwtIssuer?: string;
  jwtAudience?: string;
  users?: Map<string, UserInfo>;
  publicPaths?: string[];
  rateLimits?: {
    anonymous: number;
    authenticated: number;
    premium: number;
  };
}

export interface ApiKeyInfo {
  key: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  rateLimit: number;
  permissions: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface UserInfo {
  username: string;
  passwordHash: string;
  tier: 'free' | 'pro' | 'enterprise';
  permissions: string[];
}

export interface AuthResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  user?: AuthenticatedUser;
}

export interface AuthenticatedUser {
  id: string;
  type: 'apikey' | 'jwt' | 'basic';
  name: string;
  tier: 'free' | 'pro' | 'enterprise' | 'anonymous';
  permissions: string[];
  rateLimit: number;
}

export interface JWTPayload {
  sub: string;
  name: string;
  tier: string;
  permissions: string[];
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// JWT UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

class JWTUtil {
  /**
   * Decode JWT without verification (for debugging)
   */
  static decode(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }

  /**
   * Verify JWT signature using HMAC-SHA256
   */
  static verify(token: string, secret: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [headerB64, payloadB64, signatureB64] = parts;
      
      // Verify signature
      const signatureInput = `${headerB64}.${payloadB64}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signatureInput)
        .digest('base64url');

      if (signatureB64 !== expectedSignature) {
        return null;
      }

      // Decode payload
      const payload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf8')
      ) as JWTPayload;

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Create JWT token
   */
  static create(payload: Omit<JWTPayload, 'iat'>, secret: string, expiresIn: number = 3600): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    
    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: payload.exp || now + expiresIn
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    return `${headerB64}.${payloadB64}.${signature}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PASSWORD UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

class PasswordUtil {
  /**
   * Hash password with salt using PBKDF2
   */
  static hash(password: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, actualSalt, 100000, 64, 'sha512').toString('hex');
    return `${actualSalt}:${hash}`;
  }

  /**
   * Verify password against hash
   */
  static verify(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

export class AuthMiddleware {
  private config: AuthConfig;
  private defaultRateLimits = {
    anonymous: 60,
    authenticated: 1000,
    premium: 10000
  };

  constructor(config: AuthConfig) {
    this.config = {
      ...config,
      rateLimits: config.rateLimits || this.defaultRateLimits,
      publicPaths: config.publicPaths || ['/health', '/api/v1', '/api/v1/docs']
    };
  }

  /**
   * Authenticate request
   */
  authenticate(req: IncomingMessage, path: string): AuthResult {
    // Check if path is public
    if (this.isPublicPath(path)) {
      return {
        success: true,
        user: this.createAnonymousUser()
      };
    }

    // No auth required
    if (this.config.strategy === 'none') {
      return {
        success: true,
        user: this.createAnonymousUser()
      };
    }

    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] as string | undefined;

    // Try API Key first
    if (apiKey) {
      return this.authenticateApiKey(apiKey);
    }

    // Try Authorization header
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        return this.authenticateJWT(authHeader.slice(7));
      }
      if (authHeader.startsWith('Basic ')) {
        return this.authenticateBasic(authHeader.slice(6));
      }
    }

    // Check query parameter for API key
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const queryApiKey = url.searchParams.get('apiKey');
    if (queryApiKey) {
      return this.authenticateApiKey(queryApiKey);
    }

    return {
      success: false,
      error: 'Authentication required',
      errorCode: 'AUTH_REQUIRED'
    };
  }

  /**
   * Authenticate using API Key
   */
  private authenticateApiKey(key: string): AuthResult {
    if (!this.config.apiKeys) {
      return {
        success: false,
        error: 'API key authentication not configured',
        errorCode: 'AUTH_NOT_CONFIGURED'
      };
    }

    const keyInfo = this.config.apiKeys.get(key);
    
    if (!keyInfo) {
      logger.warn('Invalid API key attempted', { keyPrefix: key.slice(0, 8) });
      return {
        success: false,
        error: 'Invalid API key',
        errorCode: 'INVALID_API_KEY'
      };
    }

    // Check expiration
    if (keyInfo.expiresAt && keyInfo.expiresAt < new Date()) {
      logger.warn('Expired API key used', { name: keyInfo.name });
      return {
        success: false,
        error: 'API key has expired',
        errorCode: 'API_KEY_EXPIRED'
      };
    }

    logger.debug('API key authenticated', { name: keyInfo.name, tier: keyInfo.tier });

    return {
      success: true,
      user: {
        id: crypto.createHash('sha256').update(key).digest('hex').slice(0, 16),
        type: 'apikey',
        name: keyInfo.name,
        tier: keyInfo.tier,
        permissions: keyInfo.permissions,
        rateLimit: keyInfo.rateLimit
      }
    };
  }

  /**
   * Authenticate using JWT
   */
  private authenticateJWT(token: string): AuthResult {
    if (!this.config.jwtSecret) {
      return {
        success: false,
        error: 'JWT authentication not configured',
        errorCode: 'AUTH_NOT_CONFIGURED'
      };
    }

    const payload = JWTUtil.verify(token, this.config.jwtSecret);

    if (!payload) {
      logger.warn('Invalid JWT token attempted');
      return {
        success: false,
        error: 'Invalid or malformed token',
        errorCode: 'INVALID_TOKEN'
      };
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return {
        success: false,
        error: 'Token has expired',
        errorCode: 'TOKEN_EXPIRED'
      };
    }

    // Check issuer
    if (this.config.jwtIssuer && payload.iss !== this.config.jwtIssuer) {
      return {
        success: false,
        error: 'Invalid token issuer',
        errorCode: 'INVALID_ISSUER'
      };
    }

    // Check audience
    if (this.config.jwtAudience && payload.aud !== this.config.jwtAudience) {
      return {
        success: false,
        error: 'Invalid token audience',
        errorCode: 'INVALID_AUDIENCE'
      };
    }

    logger.debug('JWT authenticated', { sub: payload.sub, tier: payload.tier });

    return {
      success: true,
      user: {
        id: payload.sub,
        type: 'jwt',
        name: payload.name,
        tier: (payload.tier as 'free' | 'pro' | 'enterprise') || 'free',
        permissions: payload.permissions || [],
        rateLimit: this.getRateLimitForTier(payload.tier as string)
      }
    };
  }

  /**
   * Authenticate using Basic Auth
   */
  private authenticateBasic(encoded: string): AuthResult {
    if (!this.config.users) {
      return {
        success: false,
        error: 'Basic authentication not configured',
        errorCode: 'AUTH_NOT_CONFIGURED'
      };
    }

    let decoded: string;
    try {
      decoded = Buffer.from(encoded, 'base64').toString('utf8');
    } catch {
      return {
        success: false,
        error: 'Invalid credentials encoding',
        errorCode: 'INVALID_ENCODING'
      };
    }

    const [username, password] = decoded.split(':');
    
    if (!username || !password) {
      return {
        success: false,
        error: 'Invalid credentials format',
        errorCode: 'INVALID_FORMAT'
      };
    }

    const userInfo = this.config.users.get(username);
    
    if (!userInfo) {
      logger.warn('Unknown user attempted login', { username });
      return {
        success: false,
        error: 'Invalid credentials',
        errorCode: 'INVALID_CREDENTIALS'
      };
    }

    if (!PasswordUtil.verify(password, userInfo.passwordHash)) {
      logger.warn('Invalid password for user', { username });
      return {
        success: false,
        error: 'Invalid credentials',
        errorCode: 'INVALID_CREDENTIALS'
      };
    }

    logger.debug('Basic auth authenticated', { username, tier: userInfo.tier });

    return {
      success: true,
      user: {
        id: crypto.createHash('sha256').update(username).digest('hex').slice(0, 16),
        type: 'basic',
        name: username,
        tier: userInfo.tier,
        permissions: userInfo.permissions,
        rateLimit: this.getRateLimitForTier(userInfo.tier)
      }
    };
  }

  /**
   * Check if path is public
   */
  private isPublicPath(path: string): boolean {
    return this.config.publicPaths!.some(p => {
      if (p.endsWith('*')) {
        return path.startsWith(p.slice(0, -1));
      }
      return path === p;
    });
  }

  /**
   * Create anonymous user
   */
  private createAnonymousUser(): AuthenticatedUser {
    return {
      id: 'anonymous',
      type: 'apikey',
      name: 'Anonymous',
      tier: 'anonymous',
      permissions: ['read'],
      rateLimit: this.config.rateLimits!.anonymous
    };
  }

  /**
   * Get rate limit for tier
   */
  private getRateLimitForTier(tier: string): number {
    switch (tier) {
      case 'enterprise':
      case 'premium':
        return this.config.rateLimits!.premium;
      case 'pro':
      case 'authenticated':
        return this.config.rateLimits!.authenticated;
      default:
        return this.config.rateLimits!.anonymous;
    }
  }

  /**
   * Check if user has permission
   */
  hasPermission(user: AuthenticatedUser, permission: string): boolean {
    if (user.permissions.includes('*')) return true;
    if (user.permissions.includes(permission)) return true;
    
    // Check wildcard permissions (e.g., 'tests:*' matches 'tests:run')
    const [category] = permission.split(':');
    if (user.permissions.includes(`${category}:*`)) return true;
    
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create API key
 */
export function createApiKey(
  name: string, 
  tier: 'free' | 'pro' | 'enterprise' = 'free',
  permissions: string[] = ['read'],
  expiresInDays?: number
): ApiKeyInfo {
  const key = `mk_${tier}_${crypto.randomBytes(24).toString('hex')}`;
  
  return {
    key,
    name,
    tier,
    rateLimit: tier === 'enterprise' ? 10000 : tier === 'pro' ? 1000 : 100,
    permissions,
    createdAt: new Date(),
    expiresAt: expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) 
      : undefined
  };
}

/**
 * Create user
 */
export function createUser(
  username: string,
  password: string,
  tier: 'free' | 'pro' | 'enterprise' = 'free',
  permissions: string[] = ['read']
): UserInfo {
  return {
    username,
    passwordHash: PasswordUtil.hash(password),
    tier,
    permissions
  };
}

/**
 * Create JWT token
 */
export function createJWT(
  secret: string,
  payload: {
    sub: string;
    name: string;
    tier?: string;
    permissions?: string[];
  },
  expiresIn: number = 3600
): string {
  return JWTUtil.create({
    ...payload,
    tier: payload.tier || 'free',
    permissions: payload.permissions || ['read'],
    exp: Math.floor(Date.now() / 1000) + expiresIn
  }, secret, expiresIn);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { JWTUtil, PasswordUtil };

export default AuthMiddleware;
