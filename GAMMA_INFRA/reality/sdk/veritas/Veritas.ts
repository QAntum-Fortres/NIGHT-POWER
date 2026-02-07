/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🎯 VERITAS - Truth Verification & Identity Layer
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Metaphysical Principle: Truth is not merely the absence of falsehood, but the presence
 * of verified correspondence between claim and reality. Veritas embodies the zero-trust
 * philosophy - every claim must be verified, every identity must prove itself.
 * 
 * "Veritas vos liberabit" - The truth shall set you free. In security, truth means
 * verified identity, validated permissions, and authenticated actions.
 * 
 * @author Dimitar Prodromov
 * @version 17.0.0
 */

import { createHash, timingSafeEqual, randomBytes, createHmac } from 'crypto';
import { EventEmitter } from 'events';
import type {
  Identity,
  Action,
  VerificationRequest,
  VerificationResult,
  ThreatLevel,
  AuditLog,
} from '../../../../types/security.types';

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🔐 VERIFICATION POLICY TYPES
// ═══════════════════════════════════════════════════════════════════════════════════════

interface VerificationPolicy {
  resource: string | RegExp;
  allowedActions: Action[];
  requiredPermissions: string[];
  requireSession: boolean;
  maxAge?: number; // Max time since last verification
}

interface SessionInfo {
  sessionId: string;
  identityId: string;
  createdAt: number;
  lastActivity: number;
  fingerprint: string;
  verified: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// ⚖️ VERITAS VERIFICATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════════════

export class Veritas extends EventEmitter {
  private policies: VerificationPolicy[];
  private sessions: Map<string, SessionInfo>;
  private auditLog: AuditLog[];
  private verificationCache: Map<string, { result: VerificationResult; timestamp: number }>;
  private readonly CACHE_TTL_MS = 60000; // 1 minute cache
  private readonly SESSION_TIMEOUT_MS = 1800000; // 30 minutes
  private readonly MAX_AUDIT_LOG = 10000;
  private readonly hmacSecret: Buffer;

  constructor() {
    super();
    this.policies = [];
    this.sessions = new Map();
    this.auditLog = [];
    this.verificationCache = new Map();
    this.hmacSecret = randomBytes(32);
    
    this.initializeDefaultPolicies();
    this.startSessionCleanup();
  }

  /**
   * Initialize default security policies
   */
  private initializeDefaultPolicies(): void {
    // Default deny-all for sensitive paths
    this.addPolicy({
      resource: /^\/admin/,
      allowedActions: ['READ', 'WRITE', 'DELETE', 'EXECUTE', 'ADMIN'],
      requiredPermissions: ['admin'],
      requireSession: true,
      maxAge: 300000, // 5 minutes
    });
    
    // System resources
    this.addPolicy({
      resource: /^\/system/,
      allowedActions: ['READ', 'EXECUTE'],
      requiredPermissions: ['system'],
      requireSession: true,
    });
    
    // User data
    this.addPolicy({
      resource: /^\/users\//,
      allowedActions: ['READ', 'WRITE'],
      requiredPermissions: ['user'],
      requireSession: true,
    });
  }

  /**
   * Add verification policy
   */
  public addPolicy(policy: VerificationPolicy): void {
    this.policies.push(policy);
    this.emit('policyAdded', { policy });
  }

  /**
   * Remove policy for resource
   */
  public removePolicy(resource: string | RegExp): boolean {
    const index = this.policies.findIndex((p) => {
      if (typeof p.resource === 'string' && typeof resource === 'string') {
        return p.resource === resource;
      }
      if (p.resource instanceof RegExp && resource instanceof RegExp) {
        return p.resource.source === resource.source;
      }
      return false;
    });
    
    if (index !== -1) {
      const removed = this.policies.splice(index, 1)[0];
      this.emit('policyRemoved', { policy: removed });
      return true;
    }
    return false;
  }

  /**
   * Verify identity and action
   * 
   * The core verification logic that implements zero-trust principles:
   * 1. Validate identity exists and is well-formed
   * 2. Check session validity if required
   * 3. Match resource against policies
   * 4. Verify permissions
   * 5. Log and return result
   */
  public verify(request: VerificationRequest): VerificationResult {
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache
    const cached = this.verificationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.result;
    }
    
    let result: VerificationResult;
    
    try {
      // Step 1: Validate identity
      if (!this.validateIdentity(request.identity)) {
        result = {
          allowed: false,
          reason: 'Invalid identity structure',
          verifiedAt: Date.now(),
        };
        this.logVerification(request, result, 'failure');
        return result;
      }
      
      // Step 2: Find matching policy
      const policy = this.findMatchingPolicy(request.resource);
      
      if (!policy) {
        // Default deny for unmatched resources
        result = {
          allowed: false,
          reason: 'No policy matches resource',
          verifiedAt: Date.now(),
        };
        this.logVerification(request, result, 'blocked');
        return result;
      }
      
      // Step 3: Check session if required
      if (policy.requireSession) {
        if (!request.identity.sessionId) {
          result = {
            allowed: false,
            reason: 'Session required but not provided',
            verifiedAt: Date.now(),
          };
          this.logVerification(request, result, 'failure');
          return result;
        }
        
        const sessionValid = this.validateSession(request.identity.sessionId);
        if (!sessionValid) {
          result = {
            allowed: false,
            reason: 'Invalid or expired session',
            verifiedAt: Date.now(),
          };
          this.logVerification(request, result, 'failure');
          return result;
        }
      }
      
      // Step 4: Check action is allowed
      if (!policy.allowedActions.includes(request.action)) {
        result = {
          allowed: false,
          reason: `Action '${request.action}' not allowed for resource`,
          verifiedAt: Date.now(),
        };
        this.logVerification(request, result, 'blocked');
        return result;
      }
      
      // Step 5: Check permissions
      const hasPermissions = this.checkPermissions(
        request.identity.permissions,
        policy.requiredPermissions
      );
      
      if (!hasPermissions) {
        result = {
          allowed: false,
          reason: 'Insufficient permissions',
          verifiedAt: Date.now(),
        };
        this.logVerification(request, result, 'blocked');
        return result;
      }
      
      // Step 6: Check max age if specified
      if (policy.maxAge && request.identity.lastVerified) {
        const age = Date.now() - request.identity.lastVerified;
        if (age > policy.maxAge) {
          result = {
            allowed: false,
            reason: 'Verification expired, re-authentication required',
            verifiedAt: Date.now(),
          };
          this.logVerification(request, result, 'failure');
          return result;
        }
      }
      
      // All checks passed
      result = {
        allowed: true,
        reason: 'All verification checks passed',
        verifiedAt: Date.now(),
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      };
      
      this.logVerification(request, result, 'success');
      
    } catch (error) {
      result = {
        allowed: false,
        reason: `Verification error: ${error instanceof Error ? error.message : 'Unknown'}`,
        verifiedAt: Date.now(),
      };
      this.logVerification(request, result, 'failure');
    }
    
    // Cache result
    this.verificationCache.set(cacheKey, { result, timestamp: Date.now() });
    
    return result;
  }

  /**
   * Generate cache key for verification request
   */
  private generateCacheKey(request: VerificationRequest): string {
    const data = JSON.stringify({
      identityId: request.identity.id,
      action: request.action,
      resource: request.resource,
    });
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Validate identity structure
   */
  private validateIdentity(identity: Identity): boolean {
    if (!identity) return false;
    if (!identity.id || typeof identity.id !== 'string') return false;
    if (!identity.type || !['user', 'service', 'system'].includes(identity.type)) return false;
    if (!Array.isArray(identity.permissions)) return false;
    
    return true;
  }

  /**
   * Find matching policy for resource
   */
  private findMatchingPolicy(resource: string): VerificationPolicy | null {
    for (const policy of this.policies) {
      if (typeof policy.resource === 'string') {
        if (resource.startsWith(policy.resource)) {
          return policy;
        }
      } else if (policy.resource instanceof RegExp) {
        if (policy.resource.test(resource)) {
          return policy;
        }
      }
    }
    return null;
  }

  /**
   * Check if identity has required permissions
   */
  private checkPermissions(
    identityPermissions: string[],
    requiredPermissions: string[]
  ): boolean {
    for (const required of requiredPermissions) {
      if (!identityPermissions.includes(required)) {
        // Check for wildcard permissions
        const hasWildcard = identityPermissions.some((p) => {
          if (p.endsWith('*')) {
            const prefix = p.slice(0, -1);
            return required.startsWith(prefix);
          }
          return false;
        });
        
        if (!hasWildcard) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Create new session
   */
  public createSession(identity: Identity): SessionInfo {
    const sessionId = randomBytes(32).toString('hex');
    const fingerprint = this.generateFingerprint(identity);
    
    const session: SessionInfo = {
      sessionId,
      identityId: identity.id,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      fingerprint,
      verified: true,
    };
    
    this.sessions.set(sessionId, session);
    this.emit('sessionCreated', { sessionId, identityId: identity.id });
    
    return session;
  }

  /**
   * Validate session
   */
  public validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }
    
    const now = Date.now();
    
    // Check timeout
    if (now - session.lastActivity > this.SESSION_TIMEOUT_MS) {
      this.sessions.delete(sessionId);
      this.emit('sessionExpired', { sessionId });
      return false;
    }
    
    // Update last activity
    session.lastActivity = now;
    
    return session.verified;
  }

  /**
   * Invalidate session
   */
  public invalidateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      this.sessions.delete(sessionId);
      this.emit('sessionInvalidated', { sessionId });
      return true;
    }
    
    return false;
  }

  /**
   * Generate identity fingerprint
   */
  private generateFingerprint(identity: Identity): string {
    const data = JSON.stringify({
      id: identity.id,
      type: identity.type,
      permissions: identity.permissions.sort(),
    });
    
    return createHmac('sha256', this.hmacSecret)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify fingerprint hasn't changed
   */
  public verifyFingerprint(identity: Identity, expectedFingerprint: string): boolean {
    const actualFingerprint = this.generateFingerprint(identity);
    
    const actualBuffer = Buffer.from(actualFingerprint, 'hex');
    const expectedBuffer = Buffer.from(expectedFingerprint, 'hex');
    
    if (actualBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(actualBuffer, expectedBuffer);
  }

  /**
   * Log verification event
   */
  private logVerification(
    request: VerificationRequest,
    result: VerificationResult,
    outcome: 'success' | 'failure' | 'blocked'
  ): void {
    const log: AuditLog = {
      id: randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      eventType: 'verification',
      actor: request.identity.id,
      action: request.action,
      resource: request.resource,
      outcome,
      details: {
        reason: result.reason,
        identityType: request.identity.type,
        context: request.context,
      },
      checksum: '', // Will be set below
    };
    
    // Generate checksum for integrity
    log.checksum = this.generateLogChecksum(log);
    
    this.auditLog.push(log);
    
    // Trim log if too large
    if (this.auditLog.length > this.MAX_AUDIT_LOG) {
      this.auditLog = this.auditLog.slice(-this.MAX_AUDIT_LOG);
    }
    
    this.emit('verificationLogged', { log });
  }

  /**
   * Generate checksum for audit log integrity
   */
  private generateLogChecksum(log: Omit<AuditLog, 'checksum'>): string {
    const data = JSON.stringify({
      id: log.id,
      timestamp: log.timestamp,
      eventType: log.eventType,
      actor: log.actor,
      action: log.action,
      resource: log.resource,
      outcome: log.outcome,
    });
    
    return createHmac('sha256', this.hmacSecret)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify audit log integrity
   */
  public verifyLogIntegrity(log: AuditLog): boolean {
    const expectedChecksum = this.generateLogChecksum(log);
    
    const actualBuffer = Buffer.from(log.checksum, 'hex');
    const expectedBuffer = Buffer.from(expectedChecksum, 'hex');
    
    if (actualBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(actualBuffer, expectedBuffer);
  }

  /**
   * Get audit log entries
   */
  public getAuditLog(options: {
    limit?: number;
    outcome?: 'success' | 'failure' | 'blocked';
    actor?: string;
    since?: number;
  } = {}): AuditLog[] {
    let logs = [...this.auditLog];
    
    if (options.outcome) {
      logs = logs.filter((l) => l.outcome === options.outcome);
    }
    
    if (options.actor) {
      logs = logs.filter((l) => l.actor === options.actor);
    }
    
    if (options.since !== undefined) {
      const since = options.since;
      logs = logs.filter((l) => l.timestamp >= since);
    }
    
    if (options.limit) {
      logs = logs.slice(-options.limit);
    }
    
    return logs;
  }

  /**
   * Get security statistics
   */
  public getStatistics(): {
    totalVerifications: number;
    successRate: number;
    activeSessions: number;
    blockedAttempts: number;
    threatLevel: ThreatLevel;
  } {
    const total = this.auditLog.length;
    const successes = this.auditLog.filter((l) => l.outcome === 'success').length;
    const blocked = this.auditLog.filter((l) => l.outcome === 'blocked').length;
    const failures = this.auditLog.filter((l) => l.outcome === 'failure').length;
    
    const successRate = total > 0 ? (successes / total) * 100 : 100;
    
    // Calculate threat level based on recent activity
    const recentFailures = this.auditLog
      .filter((l) => l.outcome !== 'success' && Date.now() - l.timestamp < 3600000)
      .length;
    
    let threatLevel: ThreatLevel = 'none';
    if (recentFailures > 100) threatLevel = 'critical';
    else if (recentFailures > 50) threatLevel = 'high';
    else if (recentFailures > 20) threatLevel = 'medium';
    else if (recentFailures > 5) threatLevel = 'low';
    
    return {
      totalVerifications: total,
      successRate,
      activeSessions: this.sessions.size,
      blockedAttempts: blocked + failures,
      threatLevel,
    };
  }

  /**
   * Start session cleanup interval
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      for (const [sessionId, session] of this.sessions) {
        if (now - session.lastActivity > this.SESSION_TIMEOUT_MS) {
          this.sessions.delete(sessionId);
          this.emit('sessionExpired', { sessionId });
        }
      }
      
      // Clean verification cache
      for (const [key, cached] of this.verificationCache) {
        if (now - cached.timestamp > this.CACHE_TTL_MS * 2) {
          this.verificationCache.delete(key);
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Clear all sessions (emergency)
   */
  public clearAllSessions(): void {
    const count = this.sessions.size;
    this.sessions.clear();
    this.emit('allSessionsCleared', { count });
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.sessions.clear();
    this.verificationCache.clear();
    this.auditLog = [];
    this.policies = [];
    this.removeAllListeners();
  }
}

export default Veritas;
