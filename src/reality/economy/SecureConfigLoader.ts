/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  QAntum Prime v28.1 - SECURE CONFIG LOADER                                ║
 * ║  "Ключалката" - Environment Variables with Fortress Encryption            ║
 * ║                                                                           ║
 * ║  🔐 Loads and encrypts sensitive configuration                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface QAntumConfig {
  // Payment Gateways
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
  };
  paypal: {
    clientId: string;
    clientSecret: string;
    mode: 'sandbox' | 'live';
  };
  
  // Exchanges
  exchanges: {
    binance?: { apiKey: string; apiSecret: string };
    kraken?: { apiKey: string; apiSecret: string };
    coinbase?: { apiKey: string; apiSecret: string; passphrase: string };
    bybit?: { apiKey: string; apiSecret: string };
    okx?: { apiKey: string; apiSecret: string; passphrase: string };
  };
  
  // Email
  sendgrid: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  
  // Emergency
  emergency: {
    walletAddress: string;
    walletNetwork: string;
  };
  
  // Telemetry
  telemetry: {
    url: string;
    authToken: string;
  };
  
  // Trading Limits
  limits: {
    maxDailyLossUSD: number;
    maxDrawdownPercent: number;
    maxPositionSizeUSD: number;
    maxConcurrentTrades: number;
    minProfitPercent: number;
  };
  
  // Mode
  tradingMode: 'dry-run' | 'paper' | 'live';
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURE CONFIG LOADER
// ═══════════════════════════════════════════════════════════════════════════

export class SecureConfigLoader extends EventEmitter {
  private config: QAntumConfig | null = null;
  private encryptedConfig: string | null = null;
  private isLocked: boolean = true;
  private masterKey: Buffer | null = null;
  private autoLockTimer: NodeJS.Timeout | null = null;
  private autoLockMinutes: number = 10;
  
  constructor() {
    super();
    console.log('[SecureConfig] 🔐 Initialized');
  }
  
  /**
   * Load configuration from .env.fortress file
   */
  loadFromFile(filePath: string = '.env.fortress'): boolean {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`[SecureConfig] ❌ Config file not found: ${fullPath}`);
      console.log('[SecureConfig] 💡 Copy .env.fortress.example to .env.fortress and fill in your keys');
      return false;
    }
    
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const env = this.parseEnvFile(content);
      
      this.config = this.mapEnvToConfig(env);
      this.autoLockMinutes = parseInt(env.FORTRESS_AUTO_LOCK_MINUTES || '10');
      
      console.log('[SecureConfig] ✅ Configuration loaded');
      console.log(`[SecureConfig] 📊 Mode: ${this.config.tradingMode}`);
      console.log(`[SecureConfig] 🏦 Exchanges: ${Object.keys(this.config.exchanges).filter(e => this.config!.exchanges[e as keyof typeof this.config.exchanges]).join(', ')}`);
      
      return true;
    } catch (error) {
      console.error('[SecureConfig] ❌ Failed to load config:', error);
      return false;
    }
  }
  
  /**
   * Parse .env file content
   */
  private parseEnvFile(content: string): Record<string, string> {
    const env: Record<string, string> = {};
    
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        env[key] = value;
      }
    }
    
    return env;
  }
  
  /**
   * Map environment variables to config object
   */
  private mapEnvToConfig(env: Record<string, string>): QAntumConfig {
    return {
      stripe: {
        secretKey: env.STRIPE_SECRET_KEY || '',
        publishableKey: env.STRIPE_PUBLISHABLE_KEY || '',
        webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
      },
      paypal: {
        clientId: env.PAYPAL_CLIENT_ID || '',
        clientSecret: env.PAYPAL_CLIENT_SECRET || '',
        mode: (env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox',
      },
      exchanges: {
        ...(env.BINANCE_API_KEY && {
          binance: {
            apiKey: env.BINANCE_API_KEY,
            apiSecret: env.BINANCE_API_SECRET || '',
          },
        }),
        ...(env.KRAKEN_API_KEY && {
          kraken: {
            apiKey: env.KRAKEN_API_KEY,
            apiSecret: env.KRAKEN_API_SECRET || '',
          },
        }),
        ...(env.COINBASE_API_KEY && {
          coinbase: {
            apiKey: env.COINBASE_API_KEY,
            apiSecret: env.COINBASE_API_SECRET || '',
            passphrase: env.COINBASE_PASSPHRASE || '',
          },
        }),
        ...(env.BYBIT_API_KEY && {
          bybit: {
            apiKey: env.BYBIT_API_KEY,
            apiSecret: env.BYBIT_API_SECRET || '',
          },
        }),
        ...(env.OKX_API_KEY && {
          okx: {
            apiKey: env.OKX_API_KEY,
            apiSecret: env.OKX_API_SECRET || '',
            passphrase: env.OKX_PASSPHRASE || '',
          },
        }),
      },
      sendgrid: {
        apiKey: env.SENDGRID_API_KEY || '',
        fromEmail: env.SENDGRID_FROM_EMAIL || '',
        fromName: env.SENDGRID_FROM_NAME || '',
      },
      emergency: {
        walletAddress: env.EMERGENCY_WALLET_ADDRESS || '',
        walletNetwork: env.EMERGENCY_WALLET_NETWORK || 'ETH',
      },
      telemetry: {
        url: env.TELEMETRY_URL || 'ws://192.168.0.6:8888',
        authToken: env.TELEMETRY_AUTH_TOKEN || '',
      },
      limits: {
        maxDailyLossUSD: parseFloat(env.MAX_DAILY_LOSS_USD || '500'),
        maxDrawdownPercent: parseFloat(env.MAX_DRAWDOWN_PERCENT || '15'),
        maxPositionSizeUSD: parseFloat(env.MAX_POSITION_SIZE_USD || '1000'),
        maxConcurrentTrades: parseInt(env.MAX_CONCURRENT_TRADES || '3'),
        minProfitPercent: parseFloat(env.MIN_PROFIT_PERCENT || '1.5'),
      },
      tradingMode: (env.TRADING_MODE as 'dry-run' | 'paper' | 'live') || 'dry-run',
    };
  }
  
  /**
   * Encrypt config in memory with master password
   */
  encrypt(masterPassword: string): void {
    if (!this.config) {
      throw new Error('No configuration loaded');
    }
    
    // Derive key from password
    const salt = crypto.randomBytes(32);
    this.masterKey = crypto.pbkdf2Sync(masterPassword, salt, 100000, 32, 'sha512');
    
    // Encrypt config
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    
    const configJson = JSON.stringify(this.config);
    let encrypted = cipher.update(configJson, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    this.encryptedConfig = JSON.stringify({
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted,
    });
    
    // Clear plaintext config
    this.config = null;
    this.isLocked = false;
    
    // Set auto-lock timer
    this.resetAutoLockTimer();
    
    console.log('[SecureConfig] 🔒 Configuration encrypted and secured');
  }
  
  /**
   * Decrypt config with master password
   */
  decrypt(masterPassword: string): QAntumConfig {
    if (!this.encryptedConfig) {
      throw new Error('No encrypted configuration');
    }
    
    const { salt, iv, authTag, data } = JSON.parse(this.encryptedConfig);
    
    // Derive key from password
    this.masterKey = crypto.pbkdf2Sync(
      masterPassword,
      Buffer.from(salt, 'hex'),
      100000,
      32,
      'sha512'
    );
    
    // Decrypt
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.masterKey,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    this.config = JSON.parse(decrypted);
    this.isLocked = false;
    
    // Reset auto-lock timer
    this.resetAutoLockTimer();
    
    console.log('[SecureConfig] 🔓 Configuration decrypted');
    
    return this.config!;
  }
  
  /**
   * Lock the config (clear from memory)
   */
  lock(): void {
    this.config = null;
    this.masterKey = null;
    this.isLocked = true;
    
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = null;
    }
    
    console.log('[SecureConfig] 🔒 Configuration locked');
    this.emit('locked');
  }
  
  /**
   * Reset auto-lock timer
   */
  private resetAutoLockTimer(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
    }
    
    this.autoLockTimer = setTimeout(() => {
      console.log('[SecureConfig] ⏰ Auto-lock triggered');
      this.lock();
    }, this.autoLockMinutes * 60 * 1000);
  }
  
  /**
   * Get config (must be unlocked)
   */
  getConfig(): QAntumConfig {
    if (this.isLocked || !this.config) {
      throw new Error('Configuration is locked. Call decrypt() first.');
    }
    
    // Reset auto-lock on access
    this.resetAutoLockTimer();
    
    return this.config;
  }
  
  /**
   * Check if config is loaded and unlocked
   */
  isReady(): boolean {
    return !this.isLocked && this.config !== null;
  }
  
  /**
   * Check if config is locked
   */
  isConfigLocked(): boolean {
    return this.isLocked;
  }
  
  /**
   * Validate configuration completeness
   */
  validate(): { valid: boolean; missing: string[]; warnings: string[] } {
    const config = this.getConfig();
    const missing: string[] = [];
    const warnings: string[] = [];
    
    // Check required fields based on mode
    if (config.tradingMode === 'live') {
      // Exchanges
      if (Object.keys(config.exchanges).length === 0) {
        missing.push('At least one exchange must be configured for live trading');
      }
      
      // Emergency wallet
      if (!config.emergency.walletAddress) {
        missing.push('Emergency wallet address is required for live trading');
      }
    }
    
    // Payment gateways (for sales)
    if (!config.stripe.secretKey && !config.paypal.clientId) {
      warnings.push('No payment gateway configured - cannot accept payments');
    }
    
    // Email (for outreach)
    if (!config.sendgrid.apiKey) {
      warnings.push('SendGrid not configured - email outreach disabled');
    }
    
    return {
      valid: missing.length === 0,
      missing,
      warnings,
    };
  }
  
  /**
   * Print configuration summary (without secrets)
   */
  printSummary(): void {
    const config = this.getConfig();
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║  QAntum Prime Configuration Summary                                                   ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                       ║
║  MODE: ${config.tradingMode.toUpperCase().padEnd(15)}                                                          ║
║                                                                                       ║
║  PAYMENT GATEWAYS:                                                                    ║
║    • Stripe:   ${config.stripe.secretKey ? '✅ Configured' : '❌ Not configured'}                                                   ║
║    • PayPal:   ${config.paypal.clientId ? '✅ Configured (' + config.paypal.mode + ')' : '❌ Not configured'}                                         ║
║                                                                                       ║
║  EXCHANGES:                                                                           ║
║    • Binance:  ${config.exchanges.binance ? '✅ Configured' : '❌ Not configured'}                                                   ║
║    • Kraken:   ${config.exchanges.kraken ? '✅ Configured' : '❌ Not configured'}                                                   ║
║    • Coinbase: ${config.exchanges.coinbase ? '✅ Configured' : '❌ Not configured'}                                                   ║
║    • Bybit:    ${config.exchanges.bybit ? '✅ Configured' : '❌ Not configured'}                                                   ║
║    • OKX:      ${config.exchanges.okx ? '✅ Configured' : '❌ Not configured'}                                                   ║
║                                                                                       ║
║  EMAIL:                                                                               ║
║    • SendGrid: ${config.sendgrid.apiKey ? '✅ Configured' : '❌ Not configured'}                                                   ║
║                                                                                       ║
║  SAFETY LIMITS:                                                                       ║
║    • Max Daily Loss:    $${config.limits.maxDailyLossUSD.toString().padEnd(10)}                                           ║
║    • Max Drawdown:      ${config.limits.maxDrawdownPercent}%                                                          ║
║    • Max Position Size: $${config.limits.maxPositionSizeUSD.toString().padEnd(10)}                                           ║
║    • Min Profit:        ${config.limits.minProfitPercent}%                                                           ║
║                                                                                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
    `);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const secureConfig = new SecureConfigLoader();

export default SecureConfigLoader;
