/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: DATABASE HANDLER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Enterprise-grade database handler supporting PostgreSQL, MySQL, SQLite
 * Manages accounts, cards, proxies, emails - all data-driven automation needs
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import Knex, { Knex as KnexType } from 'knex';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite' | 'mssql';

export interface DatabaseConfig {
  type: DatabaseType;
  host?: string;
  port?: number;
  database: string;
  user?: string;
  password?: string;
  filename?: string; // For SQLite
  ssl?: boolean | object;
  pool?: {
    min: number;
    max: number;
    acquireTimeoutMillis?: number;
    createTimeoutMillis?: number;
    idleTimeoutMillis?: number;
  };
  debug?: boolean;
}

export interface Account {
  id: number;
  email: string;
  password: string;
  username?: string;
  phone?: string;
  status: 'active' | 'used' | 'failed' | 'banned' | 'cooldown' | 'pending';
  usage_count: number;
  last_used_at?: Date;
  created_at: Date;
  updated_at?: Date;
  proxy_id?: number;
  card_id?: number;
  profile_data?: Record<string, any>;
  cookies?: string;
  session_data?: string;
  notes?: string;
  tags?: string[];
  priority?: number;
  cooldown_until?: Date;
}

export interface Card {
  id: number;
  card_number: string;
  holder_name: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  billing_address?: string;
  billing_city?: string;
  billing_zip?: string;
  billing_country?: string;
  card_type?: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
  status: 'active' | 'used' | 'declined' | 'expired' | 'invalid';
  usage_count: number;
  max_usage?: number;
  last_used_at?: Date;
  created_at: Date;
  balance?: number;
  notes?: string;
}

export interface Proxy {
  id: number;
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  username?: string;
  password?: string;
  country?: string;
  city?: string;
  isp?: string;
  status: 'active' | 'dead' | 'slow' | 'banned' | 'testing';
  response_time?: number;
  last_checked_at?: Date;
  fail_count: number;
  success_count: number;
  created_at: Date;
  expires_at?: Date;
  rotation_group?: string;
  sticky_session?: boolean;
  tags?: string[];
}

export interface Email {
  id: number;
  email: string;
  password?: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'temp' | 'custom';
  imap_host?: string;
  imap_port?: number;
  smtp_host?: string;
  smtp_port?: number;
  status: 'active' | 'used' | 'blocked' | 'expired';
  verified: boolean;
  created_at: Date;
  last_used_at?: Date;
  recovery_email?: string;
  recovery_phone?: string;
  notes?: string;
}

export interface TaskRecord {
  id: number;
  task_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  account_id?: number;
  card_id?: number;
  proxy_id?: number;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
  retry_count: number;
  priority: number;
  worker_id?: string;
}

export interface DatabaseStats {
  accounts: {
    total: number;
    active: number;
    used: number;
    failed: number;
    banned: number;
  };
  cards: {
    total: number;
    active: number;
    used: number;
    declined: number;
  };
  proxies: {
    total: number;
    active: number;
    dead: number;
    avgResponseTime: number;
  };
  emails: {
    total: number;
    active: number;
    verified: number;
  };
  tasks: {
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export class DatabaseHandler extends EventEmitter {
  private knex: KnexType | null = null;
  private config: DatabaseConfig;
  private connected: boolean = false;
  private transactionStack: KnexType.Transaction[] = [];

  constructor(config: DatabaseConfig) {
    super();
    this.config = config;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONNECTION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    try {
      const knexConfig = this.buildKnexConfig();
      this.knex = Knex(knexConfig);

      // Test connection
      await this.knex.raw('SELECT 1');
      this.connected = true;

      this.emit('connected', { type: this.config.type, database: this.config.database });
      console.log(`✅ Database connected: ${this.config.type}://${this.config.database}`);
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Database connection failed: ${error}`);
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    if (this.knex) {
      await this.knex.destroy();
      this.knex = null;
      this.connected = false;
      this.emit('disconnected');
      console.log('🔌 Database disconnected');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.knex !== null;
  }

  /**
   * Build Knex configuration from our config
   */
  private buildKnexConfig(): KnexType.Config {
    const clientMap: Record<DatabaseType, string> = {
      postgresql: 'pg',
      mysql: 'mysql2',
      sqlite: 'sqlite3',
      mssql: 'mssql'
    };

    const config: KnexType.Config = {
      client: clientMap[this.config.type],
      debug: this.config.debug || false,
      pool: this.config.pool || { min: 2, max: 10 }
    };

    if (this.config.type === 'sqlite') {
      config.connection = {
        filename: this.config.filename || './mind-engine.db'
      };
      config.useNullAsDefault = true;
    } else {
      config.connection = {
        host: this.config.host || 'localhost',
        port: this.config.port || (this.config.type === 'postgresql' ? 5432 : 3306),
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        ssl: this.config.ssl
      };
    }

    return config;
  }

  /**
   * Get raw Knex instance for advanced queries
   */
  raw(): KnexType {
    if (!this.knex) {
      throw new Error('Database not connected');
    }
    return this.knex;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSACTION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Begin transaction
   */
  async beginTransaction(): Promise<KnexType.Transaction> {
    if (!this.knex) throw new Error('Database not connected');
    
    const trx = await this.knex.transaction();
    this.transactionStack.push(trx);
    this.emit('transaction:begin');
    return trx;
  }

  /**
   * Commit current transaction
   */
  async commit(): Promise<void> {
    const trx = this.transactionStack.pop();
    if (trx) {
      await trx.commit();
      this.emit('transaction:commit');
    }
  }

  /**
   * Rollback current transaction
   */
  async rollback(): Promise<void> {
    const trx = this.transactionStack.pop();
    if (trx) {
      await trx.rollback();
      this.emit('transaction:rollback');
    }
  }

  /**
   * Execute within transaction
   */
  async withTransaction<T>(callback: (trx: KnexType.Transaction) => Promise<T>): Promise<T> {
    if (!this.knex) throw new Error('Database not connected');
    
    return this.knex.transaction(async (trx) => {
      return callback(trx);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCOUNT OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get next available account
   */
  async getNextAccount(options: {
    status?: Account['status'];
    minPriority?: number;
    tags?: string[];
    withProxy?: boolean;
    withCard?: boolean;
    excludeIds?: number[];
    lockForUpdate?: boolean;
  } = {}): Promise<Account | null> {
    if (!this.knex) throw new Error('Database not connected');

    let query = this.knex('accounts')
      .where('status', options.status || 'active')
      .whereNull('cooldown_until')
      .orWhere('cooldown_until', '<', new Date());

    if (options.minPriority !== undefined) {
      query = query.where('priority', '>=', options.minPriority);
    }

    if (options.excludeIds?.length) {
      query = query.whereNotIn('id', options.excludeIds);
    }

    if (options.withProxy) {
      query = query.whereNotNull('proxy_id');
    }

    if (options.withCard) {
      query = query.whereNotNull('card_id');
    }

    query = query.orderBy('priority', 'desc')
      .orderBy('usage_count', 'asc')
      .orderBy('last_used_at', 'asc');

    if (options.lockForUpdate) {
      query = query.forUpdate();
    }

    const account = await query.first();

    if (account) {
      this.emit('account:fetched', account);
    }

    return account || null;
  }

  /**
   * Get account by ID
   */
  async getAccountById(id: number): Promise<Account | null> {
    if (!this.knex) throw new Error('Database not connected');
    return this.knex('accounts').where({ id }).first();
  }

  /**
   * Get account by email
   */
  async getAccountByEmail(email: string): Promise<Account | null> {
    if (!this.knex) throw new Error('Database not connected');
    return this.knex('accounts').where({ email }).first();
  }

  /**
   * Create new account
   */
  async createAccount(account: Partial<Account>): Promise<Account> {
    if (!this.knex) throw new Error('Database not connected');

    const [id] = await this.knex('accounts').insert({
      ...account,
      status: account.status || 'active',
      usage_count: 0,
      created_at: new Date()
    }).returning('id');

    const created = await this.getAccountById(typeof id === 'object' ? id.id : id);
    this.emit('account:created', created);
    return created!;
  }

  /**
   * Update account
   */
  async updateAccount(id: number, updates: Partial<Account>): Promise<Account> {
    if (!this.knex) throw new Error('Database not connected');

    await this.knex('accounts').where({ id }).update({
      ...updates,
      updated_at: new Date()
    });

    const updated = await this.getAccountById(id);
    this.emit('account:updated', updated);
    return updated!;
  }

  /**
   * Mark account as used
   */
  async markAccountUsed(id: number, status: Account['status'] = 'used'): Promise<void> {
    await this.knex!('accounts').where({ id }).update({
      status,
      usage_count: this.knex!.raw('usage_count + 1'),
      last_used_at: new Date(),
      updated_at: new Date()
    });

    this.emit('account:used', { id, status });
  }

  /**
   * Mark account as failed
   */
  async markAccountFailed(id: number, errorMessage?: string): Promise<void> {
    await this.knex!('accounts').where({ id }).update({
      status: 'failed',
      notes: errorMessage,
      updated_at: new Date()
    });

    this.emit('account:failed', { id, error: errorMessage });
  }

  /**
   * Set account cooldown
   */
  async setAccountCooldown(id: number, minutes: number): Promise<void> {
    const cooldownUntil = new Date(Date.now() + minutes * 60 * 1000);
    await this.knex!('accounts').where({ id }).update({
      status: 'cooldown',
      cooldown_until: cooldownUntil,
      updated_at: new Date()
    });

    this.emit('account:cooldown', { id, until: cooldownUntil });
  }

  /**
   * Bulk create accounts
   */
  async bulkCreateAccounts(accounts: Partial<Account>[]): Promise<number> {
    if (!this.knex) throw new Error('Database not connected');

    const prepared = accounts.map(a => ({
      ...a,
      status: a.status || 'active',
      usage_count: 0,
      created_at: new Date()
    }));

    const result = await this.knex('accounts').insert(prepared);
    this.emit('accounts:bulk_created', { count: accounts.length });
    return accounts.length;
  }

  /**
   * Get accounts by status
   */
  async getAccountsByStatus(status: Account['status'], limit?: number): Promise<Account[]> {
    if (!this.knex) throw new Error('Database not connected');

    let query = this.knex('accounts').where({ status });
    if (limit) query = query.limit(limit);
    return query;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CARD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get next available card
   */
  async getNextCard(options: {
    cardType?: Card['card_type'];
    excludeIds?: number[];
    minBalance?: number;
    lockForUpdate?: boolean;
  } = {}): Promise<Card | null> {
    if (!this.knex) throw new Error('Database not connected');

    let query = this.knex('cards')
      .where('status', 'active');

    if (options.cardType) {
      query = query.where('card_type', options.cardType);
    }

    if (options.excludeIds?.length) {
      query = query.whereNotIn('id', options.excludeIds);
    }

    if (options.minBalance !== undefined) {
      query = query.where('balance', '>=', options.minBalance);
    }

    // Check max usage
    query = query.whereRaw('usage_count < COALESCE(max_usage, 999999)');

    query = query.orderBy('usage_count', 'asc')
      .orderBy('last_used_at', 'asc');

    if (options.lockForUpdate) {
      query = query.forUpdate();
    }

    const card = await query.first();

    if (card) {
      this.emit('card:fetched', { id: card.id, type: card.card_type });
    }

    return card || null;
  }

  /**
   * Get card by ID
   */
  async getCardById(id: number): Promise<Card | null> {
    if (!this.knex) throw new Error('Database not connected');
    return this.knex('cards').where({ id }).first();
  }

  /**
   * Create card
   */
  async createCard(card: Partial<Card>): Promise<Card> {
    if (!this.knex) throw new Error('Database not connected');

    const [id] = await this.knex('cards').insert({
      ...card,
      status: card.status || 'active',
      usage_count: 0,
      created_at: new Date()
    }).returning('id');

    const created = await this.getCardById(typeof id === 'object' ? id.id : id);
    this.emit('card:created', { id: created!.id });
    return created!;
  }

  /**
   * Mark card as used
   */
  async markCardUsed(id: number, success: boolean = true): Promise<void> {
    await this.knex!('cards').where({ id }).update({
      status: success ? 'active' : 'declined',
      usage_count: this.knex!.raw('usage_count + 1'),
      last_used_at: new Date()
    });

    this.emit('card:used', { id, success });
  }

  /**
   * Validate card (check expiry)
   */
  async validateCard(card: Card): Promise<boolean> {
    const now = new Date();
    const expiryDate = new Date(
      parseInt(card.expiry_year),
      parseInt(card.expiry_month) - 1,
      1
    );

    if (expiryDate < now) {
      await this.knex!('cards').where({ id: card.id }).update({ status: 'expired' });
      return false;
    }

    return card.status === 'active';
  }

  /**
   * Bulk create cards
   */
  async bulkCreateCards(cards: Partial<Card>[]): Promise<number> {
    if (!this.knex) throw new Error('Database not connected');

    const prepared = cards.map(c => ({
      ...c,
      status: c.status || 'active',
      usage_count: 0,
      created_at: new Date()
    }));

    await this.knex('cards').insert(prepared);
    this.emit('cards:bulk_created', { count: cards.length });
    return cards.length;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROXY OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get next available proxy
   */
  async getNextProxy(options: {
    protocol?: Proxy['protocol'];
    country?: string;
    maxResponseTime?: number;
    rotationGroup?: string;
    excludeIds?: number[];
    lockForUpdate?: boolean;
  } = {}): Promise<Proxy | null> {
    if (!this.knex) throw new Error('Database not connected');

    let query = this.knex('proxies')
      .where('status', 'active');

    if (options.protocol) {
      query = query.where('protocol', options.protocol);
    }

    if (options.country) {
      query = query.where('country', options.country);
    }

    if (options.maxResponseTime) {
      query = query.where('response_time', '<=', options.maxResponseTime);
    }

    if (options.rotationGroup) {
      query = query.where('rotation_group', options.rotationGroup);
    }

    if (options.excludeIds?.length) {
      query = query.whereNotIn('id', options.excludeIds);
    }

    // Check expiry
    query = query.where(function() {
      this.whereNull('expires_at').orWhere('expires_at', '>', new Date());
    });

    query = query.orderBy('fail_count', 'asc')
      .orderBy('response_time', 'asc')
      .orderBy('success_count', 'desc');

    if (options.lockForUpdate) {
      query = query.forUpdate();
    }

    const proxy = await query.first();

    if (proxy) {
      this.emit('proxy:fetched', { id: proxy.id, host: proxy.host });
    }

    return proxy || null;
  }

  /**
   * Get proxy by ID
   */
  async getProxyById(id: number): Promise<Proxy | null> {
    if (!this.knex) throw new Error('Database not connected');
    return this.knex('proxies').where({ id }).first();
  }

  /**
   * Create proxy
   */
  async createProxy(proxy: Partial<Proxy>): Promise<Proxy> {
    if (!this.knex) throw new Error('Database not connected');

    const [id] = await this.knex('proxies').insert({
      ...proxy,
      status: proxy.status || 'active',
      fail_count: 0,
      success_count: 0,
      created_at: new Date()
    }).returning('id');

    const created = await this.getProxyById(typeof id === 'object' ? id.id : id);
    this.emit('proxy:created', { id: created!.id });
    return created!;
  }

  /**
   * Update proxy stats after use
   */
  async updateProxyStats(id: number, success: boolean, responseTime?: number): Promise<void> {
    const updates: any = {
      last_checked_at: new Date()
    };

    if (success) {
      updates.success_count = this.knex!.raw('success_count + 1');
      updates.fail_count = 0; // Reset fail count on success
      if (responseTime) {
        updates.response_time = responseTime;
      }
    } else {
      updates.fail_count = this.knex!.raw('fail_count + 1');
    }

    await this.knex!('proxies').where({ id }).update(updates);

    // Auto-mark as dead if too many failures
    const proxy = await this.getProxyById(id);
    if (proxy && proxy.fail_count >= 5) {
      await this.knex!('proxies').where({ id }).update({ status: 'dead' });
      this.emit('proxy:dead', { id });
    }

    this.emit('proxy:stats_updated', { id, success });
  }

  /**
   * Get proxy connection string
   */
  getProxyUrl(proxy: Proxy): string {
    const auth = proxy.username && proxy.password
      ? `${proxy.username}:${proxy.password}@`
      : '';
    return `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`;
  }

  /**
   * Bulk create proxies
   */
  async bulkCreateProxies(proxies: Partial<Proxy>[]): Promise<number> {
    if (!this.knex) throw new Error('Database not connected');

    const prepared = proxies.map(p => ({
      ...p,
      status: p.status || 'active',
      fail_count: 0,
      success_count: 0,
      created_at: new Date()
    }));

    await this.knex('proxies').insert(prepared);
    this.emit('proxies:bulk_created', { count: proxies.length });
    return proxies.length;
  }

  /**
   * Test proxy connectivity
   */
  async testProxy(proxy: Proxy): Promise<{ success: boolean; responseTime: number }> {
    const start = Date.now();
    try {
      // Simple connectivity test - would need actual HTTP client in real implementation
      // This is a placeholder for the actual proxy test logic
      const responseTime = Date.now() - start;
      return { success: true, responseTime };
    } catch {
      return { success: false, responseTime: 0 };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMAIL OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get next available email
   */
  async getNextEmail(options: {
    provider?: Email['provider'];
    verified?: boolean;
    excludeIds?: number[];
    lockForUpdate?: boolean;
  } = {}): Promise<Email | null> {
    if (!this.knex) throw new Error('Database not connected');

    let query = this.knex('emails')
      .where('status', 'active');

    if (options.provider) {
      query = query.where('provider', options.provider);
    }

    if (options.verified !== undefined) {
      query = query.where('verified', options.verified);
    }

    if (options.excludeIds?.length) {
      query = query.whereNotIn('id', options.excludeIds);
    }

    query = query.orderBy('last_used_at', 'asc');

    if (options.lockForUpdate) {
      query = query.forUpdate();
    }

    const email = await query.first();

    if (email) {
      this.emit('email:fetched', { id: email.id, provider: email.provider });
    }

    return email || null;
  }

  /**
   * Create email
   */
  async createEmail(email: Partial<Email>): Promise<Email> {
    if (!this.knex) throw new Error('Database not connected');

    const [id] = await this.knex('emails').insert({
      ...email,
      status: email.status || 'active',
      verified: email.verified || false,
      created_at: new Date()
    }).returning('id');

    const created = await this.knex('emails').where({ id: typeof id === 'object' ? id.id : id }).first();
    this.emit('email:created', { id: created!.id });
    return created!;
  }

  /**
   * Mark email as used
   */
  async markEmailUsed(id: number): Promise<void> {
    await this.knex!('emails').where({ id }).update({
      status: 'used',
      last_used_at: new Date()
    });
    this.emit('email:used', { id });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TASK OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create task record
   */
  async createTask(task: Partial<TaskRecord>): Promise<TaskRecord> {
    if (!this.knex) throw new Error('Database not connected');

    const [id] = await this.knex('tasks').insert({
      ...task,
      status: 'pending',
      retry_count: 0,
      priority: task.priority || 0,
      created_at: new Date()
    }).returning('id');

    const created = await this.knex('tasks').where({ id: typeof id === 'object' ? id.id : id }).first();
    this.emit('task:created', { id: created!.id, type: created!.task_type });
    return created!;
  }

  /**
   * Get next pending task
   */
  async getNextTask(taskType?: string, workerId?: string): Promise<TaskRecord | null> {
    if (!this.knex) throw new Error('Database not connected');

    let query = this.knex('tasks')
      .where('status', 'pending');

    if (taskType) {
      query = query.where('task_type', taskType);
    }

    const task = await query
      .orderBy('priority', 'desc')
      .orderBy('created_at', 'asc')
      .first();

    if (task) {
      await this.knex('tasks').where({ id: task.id }).update({
        status: 'running',
        worker_id: workerId,
        started_at: new Date()
      });
      this.emit('task:started', { id: task.id, workerId });
    }

    return task || null;
  }

  /**
   * Complete task
   */
  async completeTask(id: number, outputData?: Record<string, any>): Promise<void> {
    await this.knex!('tasks').where({ id }).update({
      status: 'completed',
      output_data: JSON.stringify(outputData),
      completed_at: new Date()
    });
    this.emit('task:completed', { id });
  }

  /**
   * Fail task
   */
  async failTask(id: number, errorMessage: string): Promise<void> {
    await this.knex!('tasks').where({ id }).update({
      status: 'failed',
      error_message: errorMessage,
      retry_count: this.knex!.raw('retry_count + 1'),
      completed_at: new Date()
    });
    this.emit('task:failed', { id, error: errorMessage });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATISTICS & REPORTING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get database statistics
   */
  async getStats(): Promise<DatabaseStats> {
    if (!this.knex) throw new Error('Database not connected');

    const [accounts, cards, proxies, emails, tasks] = await Promise.all([
      this.getAccountStats(),
      this.getCardStats(),
      this.getProxyStats(),
      this.getEmailStats(),
      this.getTaskStats()
    ]);

    return { accounts, cards, proxies, emails, tasks };
  }

  private async getAccountStats() {
    const rows = await this.knex!('accounts')
      .select('status')
      .count('* as count')
      .groupBy('status');

    const stats = { total: 0, active: 0, used: 0, failed: 0, banned: 0 };
    for (const row of rows) {
      const count = Number(row.count);
      stats.total += count;
      if (row.status in stats) {
        (stats as any)[row.status] = count;
      }
    }
    return stats;
  }

  private async getCardStats() {
    const rows = await this.knex!('cards')
      .select('status')
      .count('* as count')
      .groupBy('status');

    const stats = { total: 0, active: 0, used: 0, declined: 0 };
    for (const row of rows) {
      const count = Number(row.count);
      stats.total += count;
      if (row.status in stats) {
        (stats as any)[row.status] = count;
      }
    }
    return stats;
  }

  private async getProxyStats() {
    const rows = await this.knex!('proxies')
      .select('status')
      .count('* as count')
      .avg('response_time as avg_time')
      .groupBy('status');

    const stats = { total: 0, active: 0, dead: 0, avgResponseTime: 0 };
    let totalTime = 0;
    let activeCount = 0;

    for (const row of rows) {
      const count = Number(row.count);
      stats.total += count;
      if (row.status === 'active') {
        stats.active = count;
        activeCount = count;
        totalTime = Number(row.avg_time) || 0;
      } else if (row.status === 'dead') {
        stats.dead = count;
      }
    }

    stats.avgResponseTime = activeCount > 0 ? totalTime : 0;
    return stats;
  }

  private async getEmailStats() {
    const [statusRows, verifiedRow] = await Promise.all([
      this.knex!('emails')
        .select('status')
        .count('* as count')
        .groupBy('status'),
      this.knex!('emails')
        .where('verified', true)
        .count('* as count')
        .first()
    ]);

    const stats = { total: 0, active: 0, verified: Number(verifiedRow?.count) || 0 };
    for (const row of statusRows) {
      const count = Number(row.count);
      stats.total += count;
      if (row.status === 'active') {
        stats.active = count;
      }
    }
    return stats;
  }

  private async getTaskStats() {
    const rows = await this.knex!('tasks')
      .select('status')
      .count('* as count')
      .groupBy('status');

    const stats = { pending: 0, running: 0, completed: 0, failed: 0 };
    for (const row of rows) {
      if (row.status in stats) {
        (stats as any)[row.status] = Number(row.count);
      }
    }
    return stats;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEMA MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Initialize database schema (create tables if not exist)
   */
  async initializeSchema(): Promise<void> {
    if (!this.knex) throw new Error('Database not connected');

    // Accounts table
    if (!await this.knex.schema.hasTable('accounts')) {
      await this.knex.schema.createTable('accounts', (table) => {
        table.increments('id').primary();
        table.string('email').notNullable().unique();
        table.string('password').notNullable();
        table.string('username');
        table.string('phone');
        table.enum('status', ['active', 'used', 'failed', 'banned', 'cooldown', 'pending']).defaultTo('active');
        table.integer('usage_count').defaultTo(0);
        table.timestamp('last_used_at');
        table.timestamp('created_at').defaultTo(this.knex.fn.now());
        table.timestamp('updated_at');
        table.integer('proxy_id').references('id').inTable('proxies');
        table.integer('card_id').references('id').inTable('cards');
        table.json('profile_data');
        table.text('cookies');
        table.text('session_data');
        table.text('notes');
        table.specificType('tags', 'text[]');
        table.integer('priority').defaultTo(0);
        table.timestamp('cooldown_until');
        table.index(['status', 'priority']);
        table.index('email');
      });
      console.log('✅ Created accounts table');
    }

    // Cards table
    if (!await this.knex.schema.hasTable('cards')) {
      await this.knex.schema.createTable('cards', (table) => {
        table.increments('id').primary();
        table.string('card_number').notNullable();
        table.string('holder_name').notNullable();
        table.string('expiry_month', 2).notNullable();
        table.string('expiry_year', 4).notNullable();
        table.string('cvv', 4).notNullable();
        table.string('billing_address');
        table.string('billing_city');
        table.string('billing_zip');
        table.string('billing_country');
        table.enum('card_type', ['visa', 'mastercard', 'amex', 'discover', 'other']);
        table.enum('status', ['active', 'used', 'declined', 'expired', 'invalid']).defaultTo('active');
        table.integer('usage_count').defaultTo(0);
        table.integer('max_usage');
        table.timestamp('last_used_at');
        table.timestamp('created_at').defaultTo(this.knex.fn.now());
        table.decimal('balance', 10, 2);
        table.text('notes');
        table.index('status');
      });
      console.log('✅ Created cards table');
    }

    // Proxies table
    if (!await this.knex.schema.hasTable('proxies')) {
      await this.knex.schema.createTable('proxies', (table) => {
        table.increments('id').primary();
        table.string('host').notNullable();
        table.integer('port').notNullable();
        table.enum('protocol', ['http', 'https', 'socks4', 'socks5']).defaultTo('http');
        table.string('username');
        table.string('password');
        table.string('country');
        table.string('city');
        table.string('isp');
        table.enum('status', ['active', 'dead', 'slow', 'banned', 'testing']).defaultTo('active');
        table.integer('response_time');
        table.timestamp('last_checked_at');
        table.integer('fail_count').defaultTo(0);
        table.integer('success_count').defaultTo(0);
        table.timestamp('created_at').defaultTo(this.knex.fn.now());
        table.timestamp('expires_at');
        table.string('rotation_group');
        table.boolean('sticky_session').defaultTo(false);
        table.specificType('tags', 'text[]');
        table.index('status');
        table.index('country');
        table.unique(['host', 'port']);
      });
      console.log('✅ Created proxies table');
    }

    // Emails table
    if (!await this.knex.schema.hasTable('emails')) {
      await this.knex.schema.createTable('emails', (table) => {
        table.increments('id').primary();
        table.string('email').notNullable().unique();
        table.string('password');
        table.enum('provider', ['gmail', 'outlook', 'yahoo', 'temp', 'custom']).defaultTo('custom');
        table.string('imap_host');
        table.integer('imap_port');
        table.string('smtp_host');
        table.integer('smtp_port');
        table.enum('status', ['active', 'used', 'blocked', 'expired']).defaultTo('active');
        table.boolean('verified').defaultTo(false);
        table.timestamp('created_at').defaultTo(this.knex.fn.now());
        table.timestamp('last_used_at');
        table.string('recovery_email');
        table.string('recovery_phone');
        table.text('notes');
        table.index('status');
        table.index('provider');
      });
      console.log('✅ Created emails table');
    }

    // Tasks table
    if (!await this.knex.schema.hasTable('tasks')) {
      await this.knex.schema.createTable('tasks', (table) => {
        table.increments('id').primary();
        table.string('task_type').notNullable();
        table.enum('status', ['pending', 'running', 'completed', 'failed', 'cancelled']).defaultTo('pending');
        table.integer('account_id').references('id').inTable('accounts');
        table.integer('card_id').references('id').inTable('cards');
        table.integer('proxy_id').references('id').inTable('proxies');
        table.json('input_data');
        table.json('output_data');
        table.text('error_message');
        table.timestamp('started_at');
        table.timestamp('completed_at');
        table.timestamp('created_at').defaultTo(this.knex.fn.now());
        table.integer('retry_count').defaultTo(0);
        table.integer('priority').defaultTo(0);
        table.string('worker_id');
        table.index(['status', 'priority']);
        table.index('task_type');
      });
      console.log('✅ Created tasks table');
    }

    this.emit('schema:initialized');
    console.log('✅ Database schema initialized');
  }

  /**
   * Drop all tables (use with caution!)
   */
  async dropAllTables(): Promise<void> {
    if (!this.knex) throw new Error('Database not connected');

    await this.knex.schema.dropTableIfExists('tasks');
    await this.knex.schema.dropTableIfExists('accounts');
    await this.knex.schema.dropTableIfExists('cards');
    await this.knex.schema.dropTableIfExists('proxies');
    await this.knex.schema.dropTableIfExists('emails');

    this.emit('schema:dropped');
    console.log('⚠️ All tables dropped');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Execute raw SQL query
   */
  async query<T = any>(sql: string, bindings?: any[]): Promise<T[]> {
    if (!this.knex) throw new Error('Database not connected');
    const result = await this.knex.raw(sql, bindings);
    return result.rows || result;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.knex!.raw('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get table row count
   */
  async getTableCount(table: string): Promise<number> {
    const result = await this.knex!(table).count('* as count').first();
    return Number(result?.count) || 0;
  }

  /**
   * Cleanup old records
   */
  async cleanup(options: {
    olderThanDays: number;
    tables?: ('accounts' | 'cards' | 'proxies' | 'emails' | 'tasks')[];
  }): Promise<{ [table: string]: number }> {
    const cutoff = new Date(Date.now() - options.olderThanDays * 24 * 60 * 60 * 1000);
    const tables = options.tables || ['tasks'];
    const results: { [table: string]: number } = {};

    for (const table of tables) {
      const deleted = await this.knex!(table)
        .where('created_at', '<', cutoff)
        .whereIn('status', ['completed', 'failed', 'used', 'dead', 'expired'])
        .del();
      results[table] = deleted;
    }

    this.emit('cleanup:completed', results);
    return results;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create database handler from environment
 */
export function createDatabaseHandler(config?: Partial<DatabaseConfig>): DatabaseHandler {
  const defaultConfig: DatabaseConfig = {
    type: (process.env.DB_TYPE as DatabaseType) || 'postgresql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'mind_engine',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    debug: process.env.DB_DEBUG === 'true'
  };

  return new DatabaseHandler({ ...defaultConfig, ...config });
}

/**
 * Create SQLite database handler (for local testing)
 */
export function createSQLiteHandler(filename: string = './mind-engine.db'): DatabaseHandler {
  return new DatabaseHandler({
    type: 'sqlite',
    database: 'sqlite',
    filename
  });
}

export default DatabaseHandler;
