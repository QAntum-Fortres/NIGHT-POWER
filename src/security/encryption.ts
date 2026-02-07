/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM ENCRYPTION LAYER                                                     ║
 * ║   "AES-256-GCM encryption for sensitive data"                                 ║
 * ║                                                                               ║
 * ║   TODO B #41 - Security: Encryption                                           ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// ТИПОВЕ
// ═══════════════════════════════════════════════════════════════════════════════

export interface EncryptedData {
    ciphertext: string;  // Base64 encoded
    iv: string;          // Base64 encoded
    authTag: string;     // Base64 encoded
    algorithm: string;
    version: number;
}

export interface EncryptionConfig {
    algorithm: 'aes-256-gcm' | 'aes-256-cbc';
    keyDerivation: 'pbkdf2' | 'scrypt';
    iterations: number;
    saltLength: number;
    ivLength: number;
}

export interface KeyInfo {
    id: string;
    createdAt: string;
    expiresAt: string;
    algorithm: string;
    usageCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENCRYPTION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class EncryptionService {
    private static instance: EncryptionService;
    
    private config: EncryptionConfig;
    private masterKey: Buffer | null = null;
    private keyInfo: KeyInfo | null = null;

    private constructor(config: Partial<EncryptionConfig> = {}) {
        this.config = {
            algorithm: 'aes-256-gcm',
            keyDerivation: 'pbkdf2',
            iterations: 100000,
            saltLength: 32,
            ivLength: 16,
            ...config
        };
    }

    static getInstance(config?: Partial<EncryptionConfig>): EncryptionService {
        if (!EncryptionService.instance) {
            EncryptionService.instance = new EncryptionService(config);
        }
        return EncryptionService.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // KEY MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Initialize with a password (derives key using PBKDF2)
     */
    async initializeWithPassword(password: string, salt?: Buffer): Promise<void> {
        const actualSalt = salt || crypto.randomBytes(this.config.saltLength);
        
        this.masterKey = await this.deriveKey(password, actualSalt);
        
        this.keyInfo = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            algorithm: this.config.algorithm,
            usageCount: 0
        };
    }

    /**
     * Initialize with raw key (must be 32 bytes for AES-256)
     */
    initializeWithKey(key: Buffer): void {
        if (key.length !== 32) {
            throw new Error('Key must be 32 bytes (256 bits) for AES-256');
        }
        
        this.masterKey = key;
        
        this.keyInfo = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            algorithm: this.config.algorithm,
            usageCount: 0
        };
    }

    /**
     * Generate a random key
     */
    generateKey(): Buffer {
        return crypto.randomBytes(32);
    }

    /**
     * Clear the key from memory
     */
    clearKey(): void {
        if (this.masterKey) {
            this.masterKey.fill(0);
            this.masterKey = null;
        }
        this.keyInfo = null;
    }

    /**
     * Get key info (not the key itself)
     */
    getKeyInfo(): KeyInfo | null {
        return this.keyInfo ? { ...this.keyInfo } : null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENCRYPTION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Encrypt data
     */
    encrypt(data: string | Buffer): EncryptedData {
        this.ensureKey();

        const iv = crypto.randomBytes(this.config.ivLength);
        const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;

        if (this.config.algorithm === 'aes-256-gcm') {
            const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey!, iv);
            
            const encrypted = Buffer.concat([
                cipher.update(dataBuffer),
                cipher.final()
            ]);

            const authTag = cipher.getAuthTag();

            if (this.keyInfo) this.keyInfo.usageCount++;

            return {
                ciphertext: encrypted.toString('base64'),
                iv: iv.toString('base64'),
                authTag: authTag.toString('base64'),
                algorithm: this.config.algorithm,
                version: 1
            };
        } else {
            // AES-256-CBC
            const cipher = crypto.createCipheriv('aes-256-cbc', this.masterKey!, iv);
            
            const encrypted = Buffer.concat([
                cipher.update(dataBuffer),
                cipher.final()
            ]);

            if (this.keyInfo) this.keyInfo.usageCount++;

            return {
                ciphertext: encrypted.toString('base64'),
                iv: iv.toString('base64'),
                authTag: '',
                algorithm: this.config.algorithm,
                version: 1
            };
        }
    }

    /**
     * Decrypt data
     */
    decrypt(encryptedData: EncryptedData): Buffer {
        this.ensureKey();

        const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
        const iv = Buffer.from(encryptedData.iv, 'base64');

        if (encryptedData.algorithm === 'aes-256-gcm') {
            const authTag = Buffer.from(encryptedData.authTag, 'base64');
            const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey!, iv);
            decipher.setAuthTag(authTag);

            return Buffer.concat([
                decipher.update(ciphertext),
                decipher.final()
            ]);
        } else {
            const decipher = crypto.createDecipheriv('aes-256-cbc', this.masterKey!, iv);

            return Buffer.concat([
                decipher.update(ciphertext),
                decipher.final()
            ]);
        }
    }

    /**
     * Decrypt to string
     */
    decryptToString(encryptedData: EncryptedData): string {
        return this.decrypt(encryptedData).toString('utf-8');
    }

    /**
     * Encrypt object (JSON serializable)
     */
    encryptObject(obj: unknown): EncryptedData {
        const json = JSON.stringify(obj);
        return this.encrypt(json);
    }

    /**
     * Decrypt to object
     */
    decryptObject<T>(encryptedData: EncryptedData): T {
        const json = this.decryptToString(encryptedData);
        return JSON.parse(json);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HASHING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * SHA-256 hash
     */
    hash(data: string | Buffer): string {
        return crypto.createHash('sha256')
            .update(typeof data === 'string' ? Buffer.from(data) : data)
            .digest('hex');
    }

    /**
     * SHA-512 hash
     */
    hash512(data: string | Buffer): string {
        return crypto.createHash('sha512')
            .update(typeof data === 'string' ? Buffer.from(data) : data)
            .digest('hex');
    }

    /**
     * HMAC
     */
    hmac(data: string | Buffer, key?: Buffer): string {
        const hmacKey = key || this.masterKey;
        if (!hmacKey) throw new Error('No key available for HMAC');
        
        return crypto.createHmac('sha256', hmacKey)
            .update(typeof data === 'string' ? Buffer.from(data) : data)
            .digest('hex');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate random bytes
     */
    randomBytes(length: number): Buffer {
        return crypto.randomBytes(length);
    }

    /**
     * Generate random hex string
     */
    randomHex(length: number): string {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Constant-time comparison
     */
    secureCompare(a: Buffer | string, b: Buffer | string): boolean {
        const bufA = typeof a === 'string' ? Buffer.from(a) : a;
        const bufB = typeof b === 'string' ? Buffer.from(b) : b;
        
        if (bufA.length !== bufB.length) return false;
        
        return crypto.timingSafeEqual(bufA, bufB);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE
    // ─────────────────────────────────────────────────────────────────────────

    private ensureKey(): void {
        if (!this.masterKey) {
            throw new Error('Encryption key not initialized. Call initializeWithPassword() or initializeWithKey() first.');
        }
    }

    private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            if (this.config.keyDerivation === 'pbkdf2') {
                crypto.pbkdf2(
                    password,
                    salt,
                    this.config.iterations,
                    32,
                    'sha256',
                    (err, key) => {
                        if (err) reject(err);
                        else resolve(key);
                    }
                );
            } else {
                crypto.scrypt(password, salt, 32, (err, key) => {
                    if (err) reject(err);
                    else resolve(key);
                });
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VAULT - Encrypted storage
// ═══════════════════════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';

export class SecureVault {
    private encryption: EncryptionService;
    private vaultPath: string;
    private data: Map<string, unknown> = new Map();
    private loaded: boolean = false;

    constructor(vaultPath: string, encryption?: EncryptionService) {
        this.vaultPath = vaultPath;
        this.encryption = encryption || EncryptionService.getInstance();
    }

    /**
     * Load vault from disk
     */
    async load(password: string): Promise<void> {
        await this.encryption.initializeWithPassword(password);

        if (fs.existsSync(this.vaultPath)) {
            const encrypted = JSON.parse(fs.readFileSync(this.vaultPath, 'utf-8'));
            const decrypted = this.encryption.decryptObject<Record<string, unknown>>(encrypted);
            this.data = new Map(Object.entries(decrypted));
        }

        this.loaded = true;
    }

    /**
     * Save vault to disk
     */
    async save(): Promise<void> {
        this.ensureLoaded();

        const obj = Object.fromEntries(this.data);
        const encrypted = this.encryption.encryptObject(obj);

        const dir = path.dirname(this.vaultPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(this.vaultPath, JSON.stringify(encrypted, null, 2));
    }

    /**
     * Get a secret
     */
    get<T>(key: string): T | undefined {
        this.ensureLoaded();
        return this.data.get(key) as T | undefined;
    }

    /**
     * Set a secret
     */
    set(key: string, value: unknown): void {
        this.ensureLoaded();
        this.data.set(key, value);
    }

    /**
     * Delete a secret
     */
    delete(key: string): boolean {
        this.ensureLoaded();
        return this.data.delete(key);
    }

    /**
     * List all keys
     */
    keys(): string[] {
        this.ensureLoaded();
        return [...this.data.keys()];
    }

    /**
     * Clear vault from memory
     */
    clear(): void {
        this.data.clear();
        this.loaded = false;
        this.encryption.clearKey();
    }

    private ensureLoaded(): void {
        if (!this.loaded) {
            throw new Error('Vault not loaded. Call load() first.');
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getEncryption = (config?: Partial<EncryptionConfig>): EncryptionService => {
    return EncryptionService.getInstance(config);
};

export default EncryptionService;
