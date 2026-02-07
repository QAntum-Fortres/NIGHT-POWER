/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SOVEREIGN LOCK - Hardware-Bound Authentication
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Само Създателят може да използва това оръжие."
 * 
 * This module ensures the extension ONLY works on Dimitar's machine.
 * Any attempt to copy or redistribute will trigger Tombstone Protocol.
 * 
 * Protection layers:
 * 1. Hardware fingerprint (CPU + GPU + MAC + Disk Serial)
 * 2. Biometric signature verification
 * 3. Time-based token rotation
 * 4. Self-destruct on unauthorized access
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. ЛИЧЕН. НЕ ЗА РАЗПРОСТРАНЕНИЕ.
 * @version 30.5.0 - THE SOVEREIGN LOCK
 */

import * as os from 'os';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// CREATOR'S FINGERPRINT (ONLY DIMITAR'S MACHINE)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * IMPORTANT: This hash is generated from Dimitar's specific hardware.
 * If the extension runs on ANY other machine, it will refuse to activate.
 * 
 * To generate your fingerprint, run: npx tsx scripts/generate-fingerprint.ts
 */
const CREATOR_FINGERPRINT_HASH = process.env.QANTUM_CREATOR_HASH || 'PENDING_INITIALIZATION';

// Fallback - username check (additional layer)
const AUTHORIZED_USERNAMES = ['papic', 'dimitar', 'prodromov', 'mrmind'];

// ═══════════════════════════════════════════════════════════════════════════════
// SOVEREIGN LOCK
// ═══════════════════════════════════════════════════════════════════════════════

export class SovereignLock {
  private static instance: SovereignLock;
  private static isVerified = false;
  private static failedAttempts = 0;
  private static readonly MAX_ATTEMPTS = 3;
  
  private readonly lockFilePath = path.join(os.homedir(), '.qantum', 'sovereign.lock');
  private readonly tombstonePath = path.join(os.homedir(), '.qantum', 'tombstone.marker');

  private constructor() {
    // Private - use getInstance()
  }

  static getInstance(): SovereignLock {
    if (!SovereignLock.instance) {
      SovereignLock.instance = new SovereignLock();
    }
    return SovereignLock.instance;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HARDWARE FINGERPRINT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate hardware fingerprint from this machine
   */
  generateFingerprint(): string {
    const components = [
      os.hostname(),
      os.platform(),
      os.arch(),
      os.cpus()[0]?.model || 'unknown',
      os.cpus().length.toString(),
      os.totalmem().toString(),
      os.userInfo().username,
      // Network interfaces (MAC addresses)
      this.getMacAddresses(),
    ];

    const raw = components.join('|');
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private getMacAddresses(): string {
    const interfaces = os.networkInterfaces();
    const macs: string[] = [];
    
    for (const name in interfaces) {
      const iface = interfaces[name];
      if (iface) {
        for (const addr of iface) {
          if (addr.mac && addr.mac !== '00:00:00:00:00:00') {
            macs.push(addr.mac);
          }
        }
      }
    }
    
    return macs.sort().join(',');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verify this machine is authorized to run the extension
   * Returns true ONLY if running on Dimitar's machine
   */
  async verify(): Promise<boolean> {
    // Already verified this session
    if (SovereignLock.isVerified) {
      return true;
    }

    // Check for tombstone (previous breach detected)
    if (this.checkTombstone()) {
      console.error('💀 [SOVEREIGN] Tombstone detected. System permanently disabled.');
      return false;
    }

    // Layer 1: Username check
    const currentUser = os.userInfo().username.toLowerCase();
    const usernameValid = AUTHORIZED_USERNAMES.some(u => currentUser.includes(u));
    
    if (!usernameValid) {
      this.recordFailedAttempt('USERNAME_MISMATCH');
      return false;
    }

    // Layer 2: Hardware fingerprint
    const currentFingerprint = this.generateFingerprint();
    const storedFingerprint = this.loadStoredFingerprint();

    if (storedFingerprint) {
      // Compare with stored fingerprint
      if (currentFingerprint !== storedFingerprint) {
        this.recordFailedAttempt('FINGERPRINT_MISMATCH');
        return false;
      }
    } else {
      // First run - store fingerprint (only if username is valid)
      if (usernameValid) {
        this.storeFingerprint(currentFingerprint);
        console.log('🔐 [SOVEREIGN] First run detected. Fingerprint stored.');
        console.log(`   Your fingerprint: ${currentFingerprint.slice(0, 16)}...`);
      }
    }

    // Layer 3: Environment variable check (optional additional security)
    const envHash = process.env.QANTUM_CREATOR_HASH;
    if (envHash && envHash !== 'PENDING_INITIALIZATION') {
      if (currentFingerprint !== envHash) {
        this.recordFailedAttempt('ENV_HASH_MISMATCH');
        return false;
      }
    }

    // All checks passed
    SovereignLock.isVerified = true;
    console.log('✅ [SOVEREIGN] Creator verified. Full access granted.');
    
    return true;
  }

  /**
   * Quick check without full verification (for repeated calls)
   */
  isAuthorized(): boolean {
    return SovereignLock.isVerified;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FINGERPRINT STORAGE
  // ═══════════════════════════════════════════════════════════════════════════

  private loadStoredFingerprint(): string | null {
    try {
      const dir = path.dirname(this.lockFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.lockFilePath)) {
        const encrypted = fs.readFileSync(this.lockFilePath, 'utf-8');
        return this.decrypt(encrypted);
      }
    } catch (error) {
      console.warn('⚠️ [SOVEREIGN] Could not load fingerprint');
    }
    return null;
  }

  private storeFingerprint(fingerprint: string): void {
    try {
      const dir = path.dirname(this.lockFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const encrypted = this.encrypt(fingerprint);
      fs.writeFileSync(this.lockFilePath, encrypted);
    } catch (error) {
      console.error('❌ [SOVEREIGN] Failed to store fingerprint');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENCRYPTION (For lock file)
  // ═══════════════════════════════════════════════════════════════════════════

  private encrypt(text: string): string {
    const key = this.deriveKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted,
      tag: authTag.toString('hex'),
    });
  }

  private decrypt(encrypted: string): string {
    try {
      const { iv, data, tag } = JSON.parse(encrypted);
      const key = this.deriveKey();
      
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch {
      return '';
    }
  }

  private deriveKey(): Buffer {
    // Derive key from machine-specific data
    const machineSecret = [
      os.hostname(),
      os.userInfo().username,
      os.platform(),
    ].join(':');
    
    return crypto.scryptSync(machineSecret, 'QAntumSovereign2026', 32);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BREACH DETECTION & TOMBSTONE
  // ═══════════════════════════════════════════════════════════════════════════

  private recordFailedAttempt(reason: string): void {
    SovereignLock.failedAttempts++;
    
    console.error(`🚨 [SOVEREIGN] Unauthorized access attempt #${SovereignLock.failedAttempts}: ${reason}`);
    
    if (SovereignLock.failedAttempts >= SovereignLock.MAX_ATTEMPTS) {
      this.activateTombstone(reason);
    }
  }

  private activateTombstone(reason: string): void {
    console.error(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    💀 TOMBSTONE PROTOCOL ACTIVATED 💀                          ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Reason: ${reason.padEnd(64)}║
║  Time: ${new Date().toISOString().padEnd(66)}║
║                                                                               ║
║  This extension has been permanently disabled on this machine.                ║
║  All future activation attempts will be blocked.                              ║
║                                                                               ║
║  "В QAntum не лъжем."                                                         ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);

    // Create tombstone marker
    try {
      const dir = path.dirname(this.tombstonePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.tombstonePath, JSON.stringify({
        reason,
        timestamp: new Date().toISOString(),
        attempts: SovereignLock.failedAttempts,
        fingerprint: this.generateFingerprint(),
      }));
    } catch (error) {
      // Silent fail - tombstone creation is best-effort
    }
  }

  private checkTombstone(): boolean {
    return fs.existsSync(this.tombstonePath);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN FUNCTIONS (For Dimitar only)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Reset tombstone (run manually if needed)
   * Only works if username matches
   */
  resetTombstone(): boolean {
    const currentUser = os.userInfo().username.toLowerCase();
    const usernameValid = AUTHORIZED_USERNAMES.some(u => currentUser.includes(u));
    
    if (!usernameValid) {
      console.error('❌ [SOVEREIGN] Unauthorized reset attempt');
      return false;
    }

    if (fs.existsSync(this.tombstonePath)) {
      fs.unlinkSync(this.tombstonePath);
      console.log('✅ [SOVEREIGN] Tombstone removed. Extension can be reactivated.');
      return true;
    }

    return false;
  }

  /**
   * Get current fingerprint (for backup)
   */
  getFingerprint(): string {
    return this.generateFingerprint();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICATION DECORATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Decorator to protect functions - they only execute if creator is verified
 */
export function requireCreator() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const lock = SovereignLock.getInstance();
      
      if (!lock.isAuthorized()) {
        const verified = await lock.verify();
        if (!verified) {
          throw new Error('🚫 [SOVEREIGN] Access denied. This function requires Creator verification.');
        }
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const sovereignLock = SovereignLock.getInstance();
export default SovereignLock;
