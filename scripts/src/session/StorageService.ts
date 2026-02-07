/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: SESSION & STORAGE MANAGEMENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Browser session management, storage persistence, caching layer
 * Cookie management, localStorage/sessionStorage handling
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SessionData {
  id: string;
  name: string;
  cookies: Cookie[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  userAgent?: string;
  viewport?: { width: number; height: number };
  geolocation?: { latitude: number; longitude: number };
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface SessionManagerConfig {
  storagePath: string;
  encryptionKey?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
  maxSessions?: number;
  sessionTTL?: number; // milliseconds
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: Date;
  expiresAt?: Date;
  hits: number;
  size?: number;
}

export interface CacheConfig {
  maxSize?: number; // Max entries
  maxMemory?: number; // Max bytes
  defaultTTL?: number; // milliseconds
  cleanupInterval?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class SessionManager extends EventEmitter {
  private config: SessionManagerConfig;
  private sessions: Map<string, SessionData> = new Map();
  private activeSession?: string;
  private autoSaveTimer?: ReturnType<typeof setInterval>;

  constructor(config: Partial<SessionManagerConfig> = {}) {
    super();
    this.config = {
      storagePath: './sessions',
      autoSave: true,
      autoSaveInterval: 30000,
      maxSessions: 100,
      sessionTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
      ...config
    };

    this.ensureStoragePath();
    this.loadSessions();
    
    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * Create new session
   */
  createSession(options: {
    name?: string;
    cookies?: Cookie[];
    localStorage?: Record<string, string>;
    sessionStorage?: Record<string, string>;
    userAgent?: string;
    viewport?: { width: number; height: number };
    metadata?: Record<string, any>;
  } = {}): SessionData {
    const id = this.generateSessionId();
    const now = new Date();

    const session: SessionData = {
      id,
      name: options.name || `session_${id}`,
      cookies: options.cookies || [],
      localStorage: options.localStorage || {},
      sessionStorage: options.sessionStorage || {},
      userAgent: options.userAgent,
      viewport: options.viewport,
      createdAt: now,
      updatedAt: now,
      expiresAt: this.config.sessionTTL 
        ? new Date(now.getTime() + this.config.sessionTTL) 
        : undefined,
      metadata: options.metadata
    };

    // Enforce max sessions
    if (this.sessions.size >= this.config.maxSessions!) {
      this.pruneOldestSession();
    }

    this.sessions.set(id, session);
    this.emit('session:created', session);

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(id: string): SessionData | undefined {
    const session = this.sessions.get(id);
    
    if (session && this.isExpired(session)) {
      this.deleteSession(id);
      return undefined;
    }

    return session;
  }

  /**
   * Get or create session by name
   */
  getOrCreateSession(name: string): SessionData {
    for (const session of this.sessions.values()) {
      if (session.name === name && !this.isExpired(session)) {
        return session;
      }
    }
    return this.createSession({ name });
  }

  /**
   * Update session
   */
  updateSession(id: string, updates: Partial<Omit<SessionData, 'id' | 'createdAt'>>): SessionData | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const updated: SessionData = {
      ...session,
      ...updates,
      updatedAt: new Date()
    };

    this.sessions.set(id, updated);
    this.emit('session:updated', updated);

    return updated;
  }

  /**
   * Delete session
   */
  deleteSession(id: string): boolean {
    const existed = this.sessions.delete(id);
    
    if (existed) {
      this.emit('session:deleted', { id });
      
      // Delete file
      const filePath = this.getSessionFilePath(id);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (this.activeSession === id) {
      this.activeSession = undefined;
    }

    return existed;
  }

  /**
   * Set active session
   */
  setActiveSession(id: string): void {
    if (!this.sessions.has(id)) {
      throw new Error(`Session ${id} not found`);
    }
    this.activeSession = id;
    this.emit('session:activated', { id });
  }

  /**
   * Get active session
   */
  getActiveSession(): SessionData | undefined {
    if (!this.activeSession) return undefined;
    return this.getSession(this.activeSession);
  }

  /**
   * List all sessions
   */
  listSessions(filter?: {
    name?: string;
    hasMetadata?: string;
    notExpired?: boolean;
  }): SessionData[] {
    let sessions = Array.from(this.sessions.values());

    if (filter) {
      if (filter.name) {
        sessions = sessions.filter(s => s.name.includes(filter.name!));
      }
      if (filter.hasMetadata) {
        sessions = sessions.filter(s => s.metadata?.[filter.hasMetadata!] !== undefined);
      }
      if (filter.notExpired) {
        sessions = sessions.filter(s => !this.isExpired(s));
      }
    }

    return sessions;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // COOKIE MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Add cookies to session
   */
  addCookies(sessionId: string, cookies: Cookie[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    for (const cookie of cookies) {
      const existingIndex = session.cookies.findIndex(
        c => c.name === cookie.name && c.domain === cookie.domain
      );

      if (existingIndex >= 0) {
        session.cookies[existingIndex] = cookie;
      } else {
        session.cookies.push(cookie);
      }
    }

    session.updatedAt = new Date();
    this.emit('cookies:updated', { sessionId, count: cookies.length });
  }

  /**
   * Get cookies for domain
   */
  getCookies(sessionId: string, domain?: string): Cookie[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    let cookies = session.cookies;

    if (domain) {
      cookies = cookies.filter(c => {
        // Match domain and subdomains
        return domain.endsWith(c.domain) || c.domain.endsWith(domain);
      });
    }

    // Filter expired cookies
    const now = Date.now() / 1000;
    return cookies.filter(c => !c.expires || c.expires > now);
  }

  /**
   * Delete cookie
   */
  deleteCookie(sessionId: string, name: string, domain?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.cookies = session.cookies.filter(c => {
      if (c.name !== name) return true;
      if (domain && c.domain !== domain) return true;
      return false;
    });

    session.updatedAt = new Date();
  }

  /**
   * Clear all cookies for session
   */
  clearCookies(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.cookies = [];
    session.updatedAt = new Date();
    this.emit('cookies:cleared', { sessionId });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STORAGE MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Set localStorage item
   */
  setLocalStorage(sessionId: string, key: string, value: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    session.localStorage[key] = value;
    session.updatedAt = new Date();
  }

  /**
   * Get localStorage item
   */
  getLocalStorage(sessionId: string, key: string): string | undefined {
    const session = this.sessions.get(sessionId);
    return session?.localStorage[key];
  }

  /**
   * Remove localStorage item
   */
  removeLocalStorage(sessionId: string, key: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      delete session.localStorage[key];
      session.updatedAt = new Date();
    }
  }

  /**
   * Clear localStorage
   */
  clearLocalStorage(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.localStorage = {};
      session.updatedAt = new Date();
    }
  }

  /**
   * Set sessionStorage item
   */
  setSessionStorage(sessionId: string, key: string, value: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    session.sessionStorage[key] = value;
    session.updatedAt = new Date();
  }

  /**
   * Get sessionStorage item
   */
  getSessionStorage(sessionId: string, key: string): string | undefined {
    const session = this.sessions.get(sessionId);
    return session?.sessionStorage[key];
  }

  /**
   * Clear sessionStorage
   */
  clearSessionStorage(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.sessionStorage = {};
      session.updatedAt = new Date();
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PERSISTENCE
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Save session to disk
   */
  saveSession(id: string): void {
    const session = this.sessions.get(id);
    if (!session) return;

    const filePath = this.getSessionFilePath(id);
    const data = JSON.stringify(session, null, 2);
    
    // TODO: Encrypt if key provided
    fs.writeFileSync(filePath, data, 'utf-8');
    
    this.emit('session:saved', { id });
  }

  /**
   * Save all sessions
   */
  saveAllSessions(): void {
    for (const id of this.sessions.keys()) {
      this.saveSession(id);
    }
    this.emit('sessions:saved', { count: this.sessions.size });
  }

  /**
   * Load sessions from disk
   */
  loadSessions(): void {
    const storagePath = this.config.storagePath;
    
    if (!fs.existsSync(storagePath)) return;

    const files = fs.readdirSync(storagePath).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const filePath = path.join(storagePath, file);
        const data = fs.readFileSync(filePath, 'utf-8');
        // TODO: Decrypt if key provided
        const session: SessionData = JSON.parse(data);
        
        // Convert dates
        session.createdAt = new Date(session.createdAt);
        session.updatedAt = new Date(session.updatedAt);
        if (session.expiresAt) {
          session.expiresAt = new Date(session.expiresAt);
        }

        if (!this.isExpired(session)) {
          this.sessions.set(session.id, session);
        }
      } catch (error) {
        // Skip corrupted files
        console.warn(`Failed to load session file: ${file}`);
      }
    }

    this.emit('sessions:loaded', { count: this.sessions.size });
  }

  /**
   * Export session to Playwright format
   */
  exportToPlaywright(sessionId: string): {
    cookies: any[];
    origins: any[];
  } {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const cookies = session.cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      expires: c.expires || -1,
      httpOnly: c.httpOnly || false,
      secure: c.secure || false,
      sameSite: c.sameSite || 'Lax'
    }));

    // Group localStorage by origin
    const origins: any[] = [];
    
    // Extract origins from cookies
    const uniqueDomains = new Set(session.cookies.map(c => c.domain));
    
    for (const domain of uniqueDomains) {
      const origin = `https://${domain.startsWith('.') ? domain.slice(1) : domain}`;
      origins.push({
        origin,
        localStorage: Object.entries(session.localStorage).map(([name, value]) => ({
          name,
          value
        }))
      });
    }

    return { cookies, origins };
  }

  /**
   * Import from Playwright format
   */
  importFromPlaywright(sessionId: string, state: { cookies: any[]; origins: any[] }): void {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    // Import cookies
    session.cookies = state.cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      expires: c.expires,
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite
    }));

    // Import localStorage
    session.localStorage = {};
    for (const origin of state.origins) {
      for (const item of origin.localStorage) {
        session.localStorage[item.name] = item.value;
      }
    }

    session.updatedAt = new Date();
    this.emit('session:imported', { sessionId });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  private ensureStoragePath(): void {
    const storagePath = this.config.storagePath;
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
  }

  private getSessionFilePath(id: string): string {
    return path.join(this.config.storagePath, `${id}.json`);
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isExpired(session: SessionData): boolean {
    if (!session.expiresAt) return false;
    return new Date() > session.expiresAt;
  }

  private pruneOldestSession(): void {
    let oldest: { id: string; date: Date } | null = null;

    for (const [id, session] of this.sessions.entries()) {
      if (!oldest || session.updatedAt < oldest.date) {
        oldest = { id, date: session.updatedAt };
      }
    }

    if (oldest) {
      this.deleteSession(oldest.id);
    }
  }

  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      this.saveAllSessions();
    }, this.config.autoSaveInterval);
  }

  /**
   * Cleanup and stop auto-save
   */
  destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    this.saveAllSessions();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE LAYER
// ═══════════════════════════════════════════════════════════════════════════════

export class CacheLayer<T = any> extends EventEmitter {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private cleanupTimer?: ReturnType<typeof setInterval>;
  private currentMemory: number = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    super();
    this.config = {
      maxSize: 10000,
      maxMemory: 100 * 1024 * 1024, // 100MB
      defaultTTL: 3600000, // 1 hour
      cleanupInterval: 60000,
      ...config
    };

    this.startCleanup();
  }

  /**
   * Set cache value
   */
  set(key: string, value: T, options: { ttl?: number } = {}): void {
    const ttl = options.ttl ?? this.config.defaultTTL;
    const size = this.calculateSize(value);

    // Check memory limit
    while (this.currentMemory + size > this.config.maxMemory!) {
      this.evictOne();
    }

    // Check size limit
    while (this.cache.size >= this.config.maxSize!) {
      this.evictOne();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: new Date(),
      expiresAt: ttl ? new Date(Date.now() + ttl) : undefined,
      hits: 0,
      size
    };

    // Update memory tracking
    const existing = this.cache.get(key);
    if (existing) {
      this.currentMemory -= existing.size || 0;
    }
    this.currentMemory += size;

    this.cache.set(key, entry);
    this.emit('set', { key, size });
  }

  /**
   * Get cache value
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.emit('miss', { key });
      return undefined;
    }

    if (entry.expiresAt && new Date() > entry.expiresAt) {
      this.delete(key);
      this.emit('miss', { key, reason: 'expired' });
      return undefined;
    }

    entry.hits++;
    this.emit('hit', { key, hits: entry.hits });
    
    return entry.value;
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet(key: string, factory: () => Promise<T>, options: { ttl?: number } = {}): Promise<T> {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const value = await factory();
    this.set(key, value, options);
    return value;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.expiresAt && new Date() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentMemory -= entry.size || 0;
      this.cache.delete(key);
      this.emit('delete', { key });
      return true;
    }
    return false;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    const count = this.cache.size;
    this.cache.clear();
    this.currentMemory = 0;
    this.emit('clear', { count });
  }

  /**
   * Get cache stats
   */
  getStats(): {
    size: number;
    memory: number;
    maxSize: number;
    maxMemory: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      memory: this.currentMemory,
      maxSize: this.config.maxSize!,
      maxMemory: this.config.maxMemory!
    };
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all entries (for debugging)
   */
  entries(): Array<{ key: string; hits: number; size: number; expiresAt?: Date }> {
    return Array.from(this.cache.values()).map(entry => ({
      key: entry.key,
      hits: entry.hits,
      size: entry.size || 0,
      expiresAt: entry.expiresAt
    }));
  }

  /**
   * Invalidate by pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  private evictOne(): void {
    // LRU eviction - find entry with fewest hits
    let leastHits = Infinity;
    let evictKey: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits;
        evictKey = key;
      }
    }

    if (evictKey) {
      this.delete(evictKey);
      this.emit('evict', { key: evictKey, reason: 'lru' });
    }
  }

  private calculateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate
    } catch {
      return 1000; // Default size for non-serializable
    }
  }

  private cleanup(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.emit('cleanup', { count: cleaned });
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Destroy cache
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE ADAPTER (FOR PLAYWRIGHT)
// ═══════════════════════════════════════════════════════════════════════════════

export class StorageAdapter {
  private sessionManager: SessionManager;
  private sessionId: string;

  constructor(sessionManager: SessionManager, sessionId: string) {
    this.sessionManager = sessionManager;
    this.sessionId = sessionId;
  }

  /**
   * Apply storage state to Playwright context
   */
  async applyToContext(context: any): Promise<void> {
    const state = this.sessionManager.exportToPlaywright(this.sessionId);
    
    // Add cookies
    if (state.cookies.length > 0) {
      await context.addCookies(state.cookies);
    }

    // Add localStorage via page
    const pages = context.pages();
    if (pages.length > 0) {
      const page = pages[0];
      
      for (const origin of state.origins) {
        await page.goto(origin.origin);
        
        for (const item of origin.localStorage) {
          await page.evaluate(({ key, value }) => {
            localStorage.setItem(key, value);
          }, { key: item.name, value: item.value });
        }
      }
    }
  }

  /**
   * Save context state to session
   */
  async saveFromContext(context: any): Promise<void> {
    const cookies = await context.cookies();
    
    // Get localStorage from pages
    const pages = context.pages();
    const localStorage: Record<string, string> = {};
    
    for (const page of pages) {
      const items = await page.evaluate(() => {
        const result: Record<string, string> = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) {
            result[key] = window.localStorage.getItem(key) || '';
          }
        }
        return result;
      });
      
      Object.assign(localStorage, items);
    }

    this.sessionManager.updateSession(this.sessionId, {
      cookies,
      localStorage
    });
  }

  /**
   * Create storage state file for Playwright
   */
  createStorageStateFile(filePath: string): void {
    const state = this.sessionManager.exportToPlaywright(this.sessionId);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED STORAGE SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class StorageService extends EventEmitter {
  public sessions: SessionManager;
  public cache: CacheLayer;

  constructor(config: {
    sessions?: Partial<SessionManagerConfig>;
    cache?: Partial<CacheConfig>;
  } = {}) {
    super();

    this.sessions = new SessionManager(config.sessions);
    this.cache = new CacheLayer(config.cache);

    // Forward events
    this.sessions.on('session:created', (data) => this.emit('session:created', data));
    this.sessions.on('session:deleted', (data) => this.emit('session:deleted', data));
    this.cache.on('evict', (data) => this.emit('cache:evict', data));
  }

  /**
   * Create storage adapter for session
   */
  createAdapter(sessionId: string): StorageAdapter {
    return new StorageAdapter(this.sessions, sessionId);
  }

  /**
   * Destroy all resources
   */
  destroy(): void {
    this.sessions.destroy();
    this.cache.destroy();
  }
}

export default StorageService;
