/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  QAntum Prime v28.0 - LIVE WALLET MANAGER                                 ║
 * ║  "Fortress Protocol" - 256-bit AES Encrypted Key Management               ║
 * ║                                                                           ║
 * ║  ⚠️  WARNING: THIS MODULE HANDLES REAL MONEY                              ║
 * ║  ⚠️  NEVER share your master password or API keys                         ║
 * ║  ⚠️  Test thoroughly in PAPER mode before going LIVE                      ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface ExchangeCredentials {
  exchange: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string;  // For exchanges like Coinbase Pro
  subAccountId?: string;
  permissions: ('read' | 'trade' | 'withdraw')[];
  createdAt: number;
  lastUsed: number;
}

export interface WalletConfig {
  id: string;
  name: string;
  exchange: string;
  type: 'spot' | 'futures' | 'margin';
  isActive: boolean;
  dailyLimit: number;
  maxPositionSize: number;
  allowedSymbols: string[];
}

export interface WalletBalance {
  exchange: string;
  asset: string;
  free: number;
  locked: number;
  total: number;
  usdValue: number;
  lastUpdated: number;
}

export interface WithdrawalTarget {
  id: string;
  name: string;
  address: string;
  network: string;
  isWhitelisted: boolean;
  addedAt: number;
}

export interface FortressConfig {
  masterPasswordHash: string;
  encryptionAlgorithm: 'aes-256-gcm';
  keyDerivation: 'pbkdf2';
  iterations: number;
  saltLength: number;
  ivLength: number;
  tagLength: number;
  vaultPath: string;
  autoLockMinutes: number;
  maxFailedAttempts: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORTRESS ENCRYPTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

class FortressEncryption {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16;
  private readonly saltLength = 32;
  private readonly tagLength = 16;
  private readonly iterations = 100000;
  
  /**
   * Derive a 256-bit key from password using PBKDF2
   */
  private deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.iterations,
      this.keyLength,
      'sha512'
    );
  }
  
  /**
   * Encrypt data with AES-256-GCM
   */
  public encrypt(plaintext: string, password: string): string {
    const salt = crypto.randomBytes(this.saltLength);
    const iv = crypto.randomBytes(this.ivLength);
    const key = this.deriveKey(password, salt);
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv, {
      authTagLength: this.tagLength,
    });
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    // Format: salt:iv:authTag:ciphertext
    return [
      salt.toString('hex'),
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted,
    ].join(':');
  }
  
  /**
   * Decrypt data with AES-256-GCM
   */
  public decrypt(encryptedData: string, password: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [saltHex, ivHex, authTagHex, ciphertext] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = this.deriveKey(password, salt);
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv, {
      authTagLength: this.tagLength,
    });
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * Hash password for verification
   */
  public hashPassword(password: string): string {
    const salt = crypto.randomBytes(32);
    const hash = crypto.pbkdf2Sync(password, salt, this.iterations, 64, 'sha512');
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }
  
  /**
   * Verify password against hash
   */
  public verifyPassword(password: string, storedHash: string): boolean {
    const [saltHex, hashHex] = storedHash.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const computedHash = crypto.pbkdf2Sync(password, salt, this.iterations, 64, 'sha512');
    return computedHash.toString('hex') === hashHex;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVE WALLET MANAGER
// ═══════════════════════════════════════════════════════════════════════════

export class LiveWalletManager extends EventEmitter {
  private fortress: FortressEncryption;
  private isUnlocked: boolean = false;
  private masterPassword: string | null = null;
  private credentials: Map<string, ExchangeCredentials> = new Map();
  private wallets: Map<string, WalletConfig> = new Map();
  private balances: Map<string, WalletBalance[]> = new Map();
  private withdrawalTargets: Map<string, WithdrawalTarget> = new Map();
  
  // Security
  private failedAttempts: number = 0;
  private lockoutUntil: number = 0;
  private autoLockTimeout: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  
  // Configuration
  private readonly vaultPath: string;
  private readonly maxFailedAttempts = 5;
  private readonly lockoutDurationMs = 300000; // 5 minutes
  private readonly autoLockMs = 600000; // 10 minutes
  
  constructor(vaultPath: string = './data/fortress') {
    super();
    this.fortress = new FortressEncryption();
    this.vaultPath = vaultPath;
    
    // Ensure vault directory exists
    if (!fs.existsSync(vaultPath)) {
      fs.mkdirSync(vaultPath, { recursive: true });
    }
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║  🏰 FORTRESS PROTOCOL - Live Wallet Manager                               ║
║                                                                           ║
║  ⚠️  REAL MONEY MODE                                                      ║
║  • 256-bit AES-GCM encryption                                             ║
║  • PBKDF2 key derivation (100,000 iterations)                             ║
║  • Auto-lock after 10 minutes inactivity                                  ║
║  • Max 5 failed unlock attempts                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
    `);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // VAULT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Initialize new vault with master password
   */
  public initializeVault(masterPassword: string): boolean {
    if (masterPassword.length < 12) {
      console.error('[Fortress] ❌ Password must be at least 12 characters');
      return false;
    }
    
    // Check password strength
    const hasUpper = /[A-Z]/.test(masterPassword);
    const hasLower = /[a-z]/.test(masterPassword);
    const hasNumber = /[0-9]/.test(masterPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(masterPassword);
    
    if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
      console.error('[Fortress] ❌ Password must contain uppercase, lowercase, number, and special character');
      return false;
    }
    
    const passwordHash = this.fortress.hashPassword(masterPassword);
    
    const config: FortressConfig = {
      masterPasswordHash: passwordHash,
      encryptionAlgorithm: 'aes-256-gcm',
      keyDerivation: 'pbkdf2',
      iterations: 100000,
      saltLength: 32,
      ivLength: 16,
      tagLength: 16,
      vaultPath: this.vaultPath,
      autoLockMinutes: 10,
      maxFailedAttempts: 5,
    };
    
    fs.writeFileSync(
      path.join(this.vaultPath, 'config.json'),
      JSON.stringify(config, null, 2)
    );
    
    console.log('[Fortress] ✅ Vault initialized successfully');
    this.emit('vault-initialized');
    
    return true;
  }
  
  /**
   * Unlock vault with master password
   */
  public unlock(masterPassword: string): boolean {
    // Check lockout
    if (Date.now() < this.lockoutUntil) {
      const remaining = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
      console.error(`[Fortress] 🔒 Locked out. Try again in ${remaining} seconds`);
      return false;
    }
    
    // Load config
    const configPath = path.join(this.vaultPath, 'config.json');
    if (!fs.existsSync(configPath)) {
      console.error('[Fortress] ❌ Vault not initialized. Call initializeVault() first');
      return false;
    }
    
    const config: FortressConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Verify password
    if (!this.fortress.verifyPassword(masterPassword, config.masterPasswordHash)) {
      this.failedAttempts++;
      console.error(`[Fortress] ❌ Invalid password. Attempt ${this.failedAttempts}/${this.maxFailedAttempts}`);
      
      if (this.failedAttempts >= this.maxFailedAttempts) {
        this.lockoutUntil = Date.now() + this.lockoutDurationMs;
        console.error(`[Fortress] 🔒 Too many failed attempts. Locked for 5 minutes`);
        this.emit('lockout', { until: this.lockoutUntil });
      }
      
      return false;
    }
    
    // Success
    this.failedAttempts = 0;
    this.isUnlocked = true;
    this.masterPassword = masterPassword;
    this.lastActivity = Date.now();
    
    // Load encrypted credentials
    this.loadCredentials();
    
    // Start auto-lock timer
    this.startAutoLockTimer();
    
    console.log('[Fortress] ✅ Vault unlocked successfully');
    this.emit('unlocked');
    
    return true;
  }
  
  /**
   * Lock vault immediately
   */
  public lock(): void {
    this.isUnlocked = false;
    this.masterPassword = null;
    this.credentials.clear();
    
    if (this.autoLockTimeout) {
      clearTimeout(this.autoLockTimeout);
      this.autoLockTimeout = null;
    }
    
    console.log('[Fortress] 🔒 Vault locked');
    this.emit('locked');
  }
  
  private startAutoLockTimer(): void {
    if (this.autoLockTimeout) {
      clearTimeout(this.autoLockTimeout);
    }
    
    this.autoLockTimeout = setTimeout(() => {
      if (Date.now() - this.lastActivity > this.autoLockMs) {
        console.log('[Fortress] ⏰ Auto-locking due to inactivity');
        this.lock();
      } else {
        this.startAutoLockTimer();
      }
    }, 60000); // Check every minute
  }
  
  private touchActivity(): void {
    this.lastActivity = Date.now();
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // CREDENTIALS MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Add exchange credentials (encrypted)
   */
  public addCredentials(creds: Omit<ExchangeCredentials, 'createdAt' | 'lastUsed'>): boolean {
    if (!this.isUnlocked || !this.masterPassword) {
      console.error('[Fortress] ❌ Vault is locked');
      return false;
    }
    
    this.touchActivity();
    
    const credentials: ExchangeCredentials = {
      ...creds,
      createdAt: Date.now(),
      lastUsed: 0,
    };
    
    this.credentials.set(creds.exchange, credentials);
    this.saveCredentials();
    
    console.log(`[Fortress] ✅ Added credentials for ${creds.exchange}`);
    this.emit('credentials-added', { exchange: creds.exchange });
    
    return true;
  }
  
  /**
   * Get decrypted credentials for an exchange
   */
  public getCredentials(exchange: string): ExchangeCredentials | null {
    if (!this.isUnlocked) {
      console.error('[Fortress] ❌ Vault is locked');
      return null;
    }
    
    this.touchActivity();
    
    const creds = this.credentials.get(exchange);
    if (creds) {
      creds.lastUsed = Date.now();
    }
    
    return creds || null;
  }
  
  /**
   * Remove credentials
   */
  public removeCredentials(exchange: string): boolean {
    if (!this.isUnlocked) {
      console.error('[Fortress] ❌ Vault is locked');
      return false;
    }
    
    this.touchActivity();
    
    const deleted = this.credentials.delete(exchange);
    if (deleted) {
      this.saveCredentials();
      console.log(`[Fortress] ✅ Removed credentials for ${exchange}`);
    }
    
    return deleted;
  }
  
  private loadCredentials(): void {
    const credsPath = path.join(this.vaultPath, 'credentials.enc');
    
    if (!fs.existsSync(credsPath)) {
      return;
    }
    
    try {
      const encrypted = fs.readFileSync(credsPath, 'utf8');
      const decrypted = this.fortress.decrypt(encrypted, this.masterPassword!);
      const credsArray: ExchangeCredentials[] = JSON.parse(decrypted);
      
      this.credentials.clear();
      for (const cred of credsArray) {
        this.credentials.set(cred.exchange, cred);
      }
      
      console.log(`[Fortress] 📥 Loaded ${this.credentials.size} exchange credentials`);
    } catch (error) {
      console.error('[Fortress] ❌ Failed to load credentials:', error);
    }
  }
  
  private saveCredentials(): void {
    if (!this.masterPassword) return;
    
    const credsArray = Array.from(this.credentials.values());
    const plaintext = JSON.stringify(credsArray);
    const encrypted = this.fortress.encrypt(plaintext, this.masterPassword);
    
    fs.writeFileSync(
      path.join(this.vaultPath, 'credentials.enc'),
      encrypted
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // WALLET CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Configure a wallet for trading
   */
  public configureWallet(config: WalletConfig): void {
    if (!this.isUnlocked) {
      console.error('[Fortress] ❌ Vault is locked');
      return;
    }
    
    this.touchActivity();
    this.wallets.set(config.id, config);
    this.saveWallets();
    
    console.log(`[Fortress] ✅ Configured wallet: ${config.name} (${config.exchange})`);
  }
  
  public getWallet(id: string): WalletConfig | undefined {
    return this.wallets.get(id);
  }
  
  public getActiveWallets(): WalletConfig[] {
    return Array.from(this.wallets.values()).filter(w => w.isActive);
  }
  
  private saveWallets(): void {
    if (!this.masterPassword) return;
    
    const walletsArray = Array.from(this.wallets.values());
    const plaintext = JSON.stringify(walletsArray);
    const encrypted = this.fortress.encrypt(plaintext, this.masterPassword);
    
    fs.writeFileSync(
      path.join(this.vaultPath, 'wallets.enc'),
      encrypted
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // WITHDRAWAL TARGETS (WHITELIST)
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Add a withdrawal target address (with delay for security)
   */
  public addWithdrawalTarget(target: Omit<WithdrawalTarget, 'addedAt' | 'isWhitelisted'>): void {
    if (!this.isUnlocked) {
      console.error('[Fortress] ❌ Vault is locked');
      return;
    }
    
    this.touchActivity();
    
    const fullTarget: WithdrawalTarget = {
      ...target,
      isWhitelisted: false, // Requires 24h cooling period
      addedAt: Date.now(),
    };
    
    this.withdrawalTargets.set(target.id, fullTarget);
    this.saveWithdrawalTargets();
    
    console.log(`[Fortress] ⏳ Added withdrawal target: ${target.name}`);
    console.log(`[Fortress] ⚠️  24-hour cooling period before withdrawal is enabled`);
    
    this.emit('withdrawal-target-added', { target: fullTarget });
  }
  
  /**
   * Get whitelisted withdrawal targets (only those past cooling period)
   */
  public getWhitelistedTargets(): WithdrawalTarget[] {
    const coolingPeriod = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    
    return Array.from(this.withdrawalTargets.values())
      .filter(t => now - t.addedAt >= coolingPeriod)
      .map(t => ({ ...t, isWhitelisted: true }));
  }
  
  private saveWithdrawalTargets(): void {
    if (!this.masterPassword) return;
    
    const targetsArray = Array.from(this.withdrawalTargets.values());
    const plaintext = JSON.stringify(targetsArray);
    const encrypted = this.fortress.encrypt(plaintext, this.masterPassword);
    
    fs.writeFileSync(
      path.join(this.vaultPath, 'withdrawal-targets.enc'),
      encrypted
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // BALANCE TRACKING
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Update balance from exchange
   */
  public updateBalance(exchange: string, balances: WalletBalance[]): void {
    this.balances.set(exchange, balances);
    this.emit('balance-updated', { exchange, balances });
  }
  
  public getBalance(exchange: string): WalletBalance[] {
    return this.balances.get(exchange) || [];
  }
  
  public getTotalBalance(): { total: number; byExchange: Map<string, number> } {
    let total = 0;
    const byExchange = new Map<string, number>();
    
    for (const [exchange, balances] of this.balances) {
      const exchangeTotal = balances.reduce((sum, b) => sum + b.usdValue, 0);
      byExchange.set(exchange, exchangeTotal);
      total += exchangeTotal;
    }
    
    return { total, byExchange };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // STATUS & INFO
  // ═══════════════════════════════════════════════════════════════════════
  
  public isVaultUnlocked(): boolean {
    return this.isUnlocked;
  }
  
  public getStatus(): {
    isUnlocked: boolean;
    exchangeCount: number;
    walletCount: number;
    totalBalance: number;
    failedAttempts: number;
    isLockedOut: boolean;
  } {
    return {
      isUnlocked: this.isUnlocked,
      exchangeCount: this.credentials.size,
      walletCount: this.wallets.size,
      totalBalance: this.getTotalBalance().total,
      failedAttempts: this.failedAttempts,
      isLockedOut: Date.now() < this.lockoutUntil,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const liveWalletManager = new LiveWalletManager('./data/fortress');

export default LiveWalletManager;
