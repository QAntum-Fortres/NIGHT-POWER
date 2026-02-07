/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM AUTH GUARD                                                           ║
 * ║   "Token-based authentication with role management"                           ║
 * ║                                                                               ║
 * ║   TODO B #42 - Security: Authentication                                       ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    salt: string;
    roles: Role[];
    createdAt: string;
    lastLoginAt?: string;
    isActive: boolean;
    mfaEnabled: boolean;
    mfaSecret?: string;
}

export enum Role {
    GUEST = 'guest',
    USER = 'user',
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin'
}

export interface Permission {
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'execute' | '*';
}

export interface Token {
    token: string;
    userId: string;
    type: 'access' | 'refresh';
    expiresAt: number;
    issuedAt: number;
    fingerprint: string;
}

export interface AuthResult {
    success: boolean;
    user?: Omit<User, 'passwordHash' | 'salt' | 'mfaSecret'>;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
}

export interface Session {
    id: string;
    userId: string;
    fingerprint: string;
    createdAt: number;
    expiresAt: number;
    lastActivityAt: number;
    ipAddress?: string;
    userAgent?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE-BASED ACCESS CONTROL
// ═══════════════════════════════════════════════════════════════════════════════

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [Role.GUEST]: [
        { resource: 'docs', action: 'read' }
    ],
    [Role.USER]: [
        { resource: 'docs', action: 'read' },
        { resource: 'tests', action: '*' },
        { resource: 'reports', action: 'read' },
        { resource: 'profile', action: '*' }
    ],
    [Role.ADMIN]: [
        { resource: '*', action: 'read' },
        { resource: 'tests', action: '*' },
        { resource: 'reports', action: '*' },
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'update' },
        { resource: 'settings', action: '*' }
    ],
    [Role.SUPER_ADMIN]: [
        { resource: '*', action: '*' }
    ]
};

export class RBAC {
    private customPermissions: Map<string, Permission[]> = new Map();

    /**
     * Check if user has permission
     */
    hasPermission(user: { roles: Role[] }, resource: string, action: Permission['action']): boolean {
        for (const role of user.roles) {
            const permissions = this.getPermissions(role);
            
            for (const perm of permissions) {
                // Wildcard match
                if (perm.resource === '*' && perm.action === '*') return true;
                if (perm.resource === '*' && perm.action === action) return true;
                if (perm.resource === resource && perm.action === '*') return true;
                if (perm.resource === resource && perm.action === action) return true;
            }
        }
        
        return false;
    }

    /**
     * Get all permissions for a role
     */
    getPermissions(role: Role): Permission[] {
        const base = ROLE_PERMISSIONS[role] || [];
        const custom = this.customPermissions.get(role) || [];
        return [...base, ...custom];
    }

    /**
     * Add custom permission to a role
     */
    addPermission(role: Role, permission: Permission): void {
        const existing = this.customPermissions.get(role) || [];
        existing.push(permission);
        this.customPermissions.set(role, existing);
    }

    /**
     * Check if role has higher privilege
     */
    isHigherRole(role1: Role, role2: Role): boolean {
        const hierarchy = [Role.GUEST, Role.USER, Role.ADMIN, Role.SUPER_ADMIN];
        return hierarchy.indexOf(role1) > hierarchy.indexOf(role2);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH GUARD
// ═══════════════════════════════════════════════════════════════════════════════

export class AuthGuard {
    private static instance: AuthGuard;
    
    private users: Map<string, User> = new Map();
    private sessions: Map<string, Session> = new Map();
    private tokens: Map<string, Token> = new Map();
    private rbac: RBAC = new RBAC();

    private readonly ACCESS_TOKEN_TTL = 15 * 60 * 1000;    // 15 minutes
    private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;  // 7 days
    private readonly SESSION_TTL = 24 * 60 * 60 * 1000;    // 24 hours
    private readonly SALT_ROUNDS = 32;
    private readonly PBKDF2_ITERATIONS = 100000;

    static getInstance(): AuthGuard {
        if (!AuthGuard.instance) {
            AuthGuard.instance = new AuthGuard();
        }
        return AuthGuard.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // USER MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Register new user
     */
    async register(
        username: string,
        email: string,
        password: string,
        roles: Role[] = [Role.USER]
    ): Promise<AuthResult> {
        // Validate
        if (this.findUserByUsername(username)) {
            return { success: false, error: 'Username already exists' };
        }
        if (this.findUserByEmail(email)) {
            return { success: false, error: 'Email already registered' };
        }
        if (!this.validatePassword(password)) {
            return { success: false, error: 'Password does not meet requirements' };
        }

        // Hash password
        const salt = crypto.randomBytes(this.SALT_ROUNDS).toString('hex');
        const passwordHash = await this.hashPassword(password, salt);

        // Create user
        const user: User = {
            id: crypto.randomUUID(),
            username,
            email,
            passwordHash,
            salt,
            roles,
            createdAt: new Date().toISOString(),
            isActive: true,
            mfaEnabled: false
        };

        this.users.set(user.id, user);

        return {
            success: true,
            user: this.sanitizeUser(user)
        };
    }

    /**
     * Authenticate user
     */
    async login(
        usernameOrEmail: string,
        password: string,
        fingerprint: string
    ): Promise<AuthResult> {
        const user = this.findUserByUsername(usernameOrEmail) || 
                     this.findUserByEmail(usernameOrEmail);

        if (!user) {
            return { success: false, error: 'Invalid credentials' };
        }

        if (!user.isActive) {
            return { success: false, error: 'Account is deactivated' };
        }

        // Verify password
        const hash = await this.hashPassword(password, user.salt);
        if (!this.secureCompare(hash, user.passwordHash)) {
            return { success: false, error: 'Invalid credentials' };
        }

        // Generate tokens
        const accessToken = this.generateToken(user.id, 'access', fingerprint);
        const refreshToken = this.generateToken(user.id, 'refresh', fingerprint);

        // Create session
        this.createSession(user.id, fingerprint);

        // Update last login
        user.lastLoginAt = new Date().toISOString();

        return {
            success: true,
            user: this.sanitizeUser(user),
            accessToken: accessToken.token,
            refreshToken: refreshToken.token
        };
    }

    /**
     * Logout user
     */
    logout(token: string): boolean {
        const tokenData = this.tokens.get(token);
        if (!tokenData) return false;

        // Revoke all tokens for this session
        for (const [key, t] of this.tokens) {
            if (t.fingerprint === tokenData.fingerprint && t.userId === tokenData.userId) {
                this.tokens.delete(key);
            }
        }

        // End session
        for (const [key, s] of this.sessions) {
            if (s.fingerprint === tokenData.fingerprint && s.userId === tokenData.userId) {
                this.sessions.delete(key);
            }
        }

        return true;
    }

    /**
     * Refresh access token
     */
    refreshAccessToken(refreshToken: string, fingerprint: string): AuthResult {
        const tokenData = this.tokens.get(refreshToken);

        if (!tokenData) {
            return { success: false, error: 'Invalid refresh token' };
        }

        if (tokenData.type !== 'refresh') {
            return { success: false, error: 'Not a refresh token' };
        }

        if (Date.now() > tokenData.expiresAt) {
            this.tokens.delete(refreshToken);
            return { success: false, error: 'Refresh token expired' };
        }

        if (!this.secureCompare(tokenData.fingerprint, fingerprint)) {
            return { success: false, error: 'Fingerprint mismatch' };
        }

        const user = this.users.get(tokenData.userId);
        if (!user || !user.isActive) {
            return { success: false, error: 'User not found or inactive' };
        }

        // Generate new access token
        const newAccessToken = this.generateToken(user.id, 'access', fingerprint);

        return {
            success: true,
            user: this.sanitizeUser(user),
            accessToken: newAccessToken.token
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TOKEN VERIFICATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Verify access token
     */
    verifyToken(token: string): { valid: boolean; userId?: string; error?: string } {
        const tokenData = this.tokens.get(token);

        if (!tokenData) {
            return { valid: false, error: 'Token not found' };
        }

        if (Date.now() > tokenData.expiresAt) {
            this.tokens.delete(token);
            return { valid: false, error: 'Token expired' };
        }

        return { valid: true, userId: tokenData.userId };
    }

    /**
     * Validate access to resource
     */
    authorize(
        token: string,
        resource: string,
        action: Permission['action']
    ): { authorized: boolean; error?: string } {
        const { valid, userId, error } = this.verifyToken(token);
        
        if (!valid) {
            return { authorized: false, error };
        }

        const user = this.users.get(userId!);
        if (!user) {
            return { authorized: false, error: 'User not found' };
        }

        if (!this.rbac.hasPermission(user, resource, action)) {
            return { authorized: false, error: 'Permission denied' };
        }

        return { authorized: true };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // USER QUERIES
    // ─────────────────────────────────────────────────────────────────────────

    getUser(userId: string): Omit<User, 'passwordHash' | 'salt' | 'mfaSecret'> | null {
        const user = this.users.get(userId);
        return user ? this.sanitizeUser(user) : null;
    }

    findUserByUsername(username: string): User | undefined {
        for (const user of this.users.values()) {
            if (user.username.toLowerCase() === username.toLowerCase()) {
                return user;
            }
        }
        return undefined;
    }

    findUserByEmail(email: string): User | undefined {
        for (const user of this.users.values()) {
            if (user.email.toLowerCase() === email.toLowerCase()) {
                return user;
            }
        }
        return undefined;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SESSION MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    getUserSessions(userId: string): Session[] {
        const sessions: Session[] = [];
        for (const session of this.sessions.values()) {
            if (session.userId === userId) {
                sessions.push(session);
            }
        }
        return sessions;
    }

    revokeSession(sessionId: string): boolean {
        return this.sessions.delete(sessionId);
    }

    revokeAllSessions(userId: string): number {
        let count = 0;
        for (const [key, session] of this.sessions) {
            if (session.userId === userId) {
                this.sessions.delete(key);
                count++;
            }
        }
        return count;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private async hashPassword(password: string, salt: string): Promise<string> {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(
                password,
                salt,
                this.PBKDF2_ITERATIONS,
                64,
                'sha512',
                (err, key) => {
                    if (err) reject(err);
                    else resolve(key.toString('hex'));
                }
            );
        });
    }

    private validatePassword(password: string): boolean {
        // Minimum 8 characters, at least one uppercase, one lowercase, one number
        const minLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        
        return minLength && hasUpper && hasLower && hasNumber;
    }

    private generateToken(userId: string, type: 'access' | 'refresh', fingerprint: string): Token {
        const ttl = type === 'access' ? this.ACCESS_TOKEN_TTL : this.REFRESH_TOKEN_TTL;
        const now = Date.now();
        
        const token: Token = {
            token: crypto.randomBytes(32).toString('hex'),
            userId,
            type,
            issuedAt: now,
            expiresAt: now + ttl,
            fingerprint
        };

        this.tokens.set(token.token, token);
        return token;
    }

    private createSession(userId: string, fingerprint: string): Session {
        const now = Date.now();
        
        const session: Session = {
            id: crypto.randomUUID(),
            userId,
            fingerprint,
            createdAt: now,
            expiresAt: now + this.SESSION_TTL,
            lastActivityAt: now
        };

        this.sessions.set(session.id, session);
        return session;
    }

    private sanitizeUser(user: User): Omit<User, 'passwordHash' | 'salt' | 'mfaSecret'> {
        const { passwordHash, salt, mfaSecret, ...safe } = user;
        return safe;
    }

    private secureCompare(a: string, b: string): boolean {
        const bufA = Buffer.from(a);
        const bufB = Buffer.from(b);
        
        if (bufA.length !== bufB.length) return false;
        
        return crypto.timingSafeEqual(bufA, bufB);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @Secured - Require authentication
 */
export function Secured(): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;

        descriptor.value = function (...args: any[]) {
            const token = args[0]?.token || args[0];
            const auth = AuthGuard.getInstance();
            const { valid, error } = auth.verifyToken(token);

            if (!valid) {
                throw new Error(`Authentication required: ${error}`);
            }

            return original.apply(this, args);
        };

        return descriptor;
    };
}

/**
 * @RequireRole - Require specific role
 */
export function RequireRole(...roles: Role[]): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;

        descriptor.value = function (...args: any[]) {
            const token = args[0]?.token || args[0];
            const auth = AuthGuard.getInstance();
            const { valid, userId, error } = auth.verifyToken(token);

            if (!valid) {
                throw new Error(`Authentication required: ${error}`);
            }

            const user = auth.getUser(userId!);
            if (!user) {
                throw new Error('User not found');
            }

            const hasRole = roles.some(role => user.roles.includes(role));
            if (!hasRole) {
                throw new Error(`Required role: ${roles.join(' or ')}`);
            }

            return original.apply(this, args);
        };

        return descriptor;
    };
}

/**
 * @RequirePermission - Require specific permission
 */
export function RequirePermission(resource: string, action: Permission['action']): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;

        descriptor.value = function (...args: any[]) {
            const token = args[0]?.token || args[0];
            const auth = AuthGuard.getInstance();
            const { authorized, error } = auth.authorize(token, resource, action);

            if (!authorized) {
                throw new Error(`Authorization failed: ${error}`);
            }

            return original.apply(this, args);
        };

        return descriptor;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getAuthGuard = (): AuthGuard => AuthGuard.getInstance();
export const getRBAC = (): RBAC => new RBAC();

export default AuthGuard;
