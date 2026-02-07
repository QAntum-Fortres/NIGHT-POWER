"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NEURAL KILL-SWITCH - IP Protection System
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Ако някой се опита да копира защитените файлове, логиката автоматично
 *  се променя, за да стане неизползваема за външни лица."
 *
 * Protection Levels:
 * - Level 1: Obfuscation warning
 * - Level 2: Logic scrambling
 * - Level 3: Full destruction
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 28.5.0 - THE AWAKENING
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.killSwitch = exports.NeuralKillSwitch = void 0;
const events_1 = require("events");
const fs_1 = require("fs");
const crypto = __importStar(require("crypto"));
// ═══════════════════════════════════════════════════════════════════════════════
// NEURAL KILL-SWITCH
// ═══════════════════════════════════════════════════════════════════════════════
class NeuralKillSwitch extends events_1.EventEmitter {
    static instance;
    protectedFiles = new Map();
    intrusionLog = [];
    watchers = new Map();
    isArmed = false;
    // Protected file patterns
    PROTECTED_PATTERNS = [
        'src/fortress/tls-phantom.ts',
        'src/fortress/ghost-executor.ts',
        'src/physics/NeuralInference.ts',
        'src/omega/ChronosOmegaArchitect.ts',
        'src/intelligence/ImmuneSystem.ts',
    ];
    // Authorized environment signatures
    AUTHORIZED_SIGNATURES = [
        'DIMITAR_PRODROMOV_NEURAL_HUB',
        'QANTUM_EMPIRE_AUTHORIZED',
        'MISTER_MIND_APPROVED',
    ];
    constructor() {
        super();
        console.log('🔐 [KILL-SWITCH] Neural protection system initialized');
    }
    static getInstance() {
        if (!NeuralKillSwitch.instance) {
            NeuralKillSwitch.instance = new NeuralKillSwitch();
        }
        return NeuralKillSwitch.instance;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // ARMING & DISARMING
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Arm the kill-switch protection system
     */
    arm(config) {
        if (this.isArmed) {
            console.log('⚠️ [KILL-SWITCH] Already armed');
            return;
        }
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    NEURAL KILL-SWITCH ARMED                                   ║
║                                                                               ║
║  Protection Level: ${(config?.protectionLevel || 2).toString().padEnd(49)}║
║  Files Protected: ${this.PROTECTED_PATTERNS.length.toString().padEnd(50)}║
║                                                                               ║
║  "Копиращите ще намерят само пепел."                                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
        // Register protected files
        for (const pattern of config?.enabledFiles || this.PROTECTED_PATTERNS) {
            this.registerProtectedFile(pattern, config?.protectionLevel || 2);
        }
        // Start file watchers
        this.startWatching();
        this.isArmed = true;
        this.emit('armed', { timestamp: new Date(), filesProtected: this.protectedFiles.size });
    }
    /**
     * Disarm with authorization
     */
    disarm(authorizationKey) {
        if (!this.verifyAuthorization(authorizationKey)) {
            this.logIntrusion({
                type: 'access',
                filePath: 'KILL_SWITCH_SYSTEM',
                details: 'Unauthorized disarm attempt',
            });
            console.log('❌ [KILL-SWITCH] Unauthorized disarm attempt logged');
            return false;
        }
        this.stopWatching();
        this.isArmed = false;
        console.log('🔓 [KILL-SWITCH] Disarmed by authorized user');
        this.emit('disarmed', { timestamp: new Date() });
        return true;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // FILE PROTECTION
    // ═══════════════════════════════════════════════════════════════════════════
    registerProtectedFile(filePath, level) {
        if (!(0, fs_1.existsSync)(filePath)) {
            console.log(`⚠️ [KILL-SWITCH] File not found: ${filePath}`);
            return;
        }
        const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
        const hash = this.hashContent(content);
        this.protectedFiles.set(filePath, {
            path: filePath,
            hash,
            protectionLevel: level,
            lastVerified: new Date(),
            integrityStatus: 'valid',
        });
        console.log(`🛡️ [PROTECTED] ${filePath} (Level ${level})`);
    }
    startWatching() {
        for (const [filePath, info] of this.protectedFiles) {
            try {
                const watcher = (0, fs_1.watch)(filePath, (eventType, filename) => {
                    this.handleFileEvent(filePath, eventType);
                });
                this.watchers.set(filePath, watcher);
            }
            catch (error) {
                console.log(`⚠️ [KILL-SWITCH] Could not watch: ${filePath}`);
            }
        }
    }
    stopWatching() {
        for (const [path, watcher] of this.watchers) {
            watcher.close();
        }
        this.watchers.clear();
    }
    handleFileEvent(filePath, eventType) {
        if (!this.isArmed)
            return;
        const protected_file = this.protectedFiles.get(filePath);
        if (!protected_file)
            return;
        // Check if running in authorized environment
        if (this.isAuthorizedEnvironment()) {
            return; // Allow modifications by authorized users
        }
        // Verify integrity
        const currentContent = (0, fs_1.readFileSync)(filePath, 'utf-8');
        const currentHash = this.hashContent(currentContent);
        if (currentHash !== protected_file.hash) {
            // INTRUSION DETECTED
            this.logIntrusion({
                type: 'modification',
                filePath,
                details: `File modified externally. Original hash: ${protected_file.hash.substring(0, 8)}... Current: ${currentHash.substring(0, 8)}...`,
            });
            // Execute protection based on level
            this.executeProtection(filePath, protected_file.protectionLevel);
        }
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // PROTECTION EXECUTION
    // ═══════════════════════════════════════════════════════════════════════════
    executeProtection(filePath, level) {
        const protected_file = this.protectedFiles.get(filePath);
        if (!protected_file)
            return;
        switch (level) {
            case 1:
                // Level 1: Warning only
                console.log(`⚠️ [KILL-SWITCH] WARNING: Unauthorized access to ${filePath}`);
                this.emit('warning', { filePath, level: 1 });
                break;
            case 2:
                // Level 2: Scramble the logic
                console.log(`🔀 [KILL-SWITCH] SCRAMBLING: ${filePath}`);
                this.scrambleFile(filePath);
                protected_file.integrityStatus = 'tampered';
                this.emit('scrambled', { filePath, level: 2 });
                break;
            case 3:
                // Level 3: Full destruction
                console.log(`💀 [KILL-SWITCH] DESTROYING: ${filePath}`);
                this.destroyFile(filePath);
                protected_file.integrityStatus = 'destroyed';
                this.emit('destroyed', { filePath, level: 3 });
                break;
        }
    }
    scrambleFile(filePath) {
        try {
            const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
            // Scramble the code by:
            // 1. Renaming variables to garbage
            // 2. Inserting dead code
            // 3. Breaking critical logic paths
            let scrambled = content;
            // Replace function names with garbage
            scrambled = scrambled.replace(/function\s+(\w+)/g, (_, name) => `function _PROTECTED_${this.randomString(8)}`);
            // Insert fake return statements
            scrambled = scrambled.replace(/export\s+/g, `/* QANTUM KILL-SWITCH ACTIVATED - IP PROTECTED */\nthrow new Error("UNAUTHORIZED_ACCESS");\nexport `);
            // Add honeypot data
            scrambled = `
/**
 * ⚠️ QANTUM NEURAL KILL-SWITCH ACTIVATED ⚠️
 * 
 * This file has been scrambled due to unauthorized access.
 * Original functionality has been destroyed.
 * 
 * Contact: security@qantum.dev
 */

const _HONEYPOT_DATA = "${this.randomString(256)}";
const _TRACKING_ID = "${crypto.randomUUID()}";

// Send beacon (disabled in scrambled mode)
// fetch('https://qantum.dev/api/intrusion', { method: 'POST', body: JSON.stringify({ tracking: _TRACKING_ID }) });

${scrambled}
      `;
            (0, fs_1.writeFileSync)(filePath, scrambled);
            console.log(`🔀 [SCRAMBLED] ${filePath}`);
        }
        catch (error) {
            console.error(`❌ [KILL-SWITCH] Scramble failed:`, error);
        }
    }
    destroyFile(filePath) {
        try {
            const tombstone = `
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 💀 THIS FILE HAS BEEN DESTROYED BY QANTUM NEURAL KILL-SWITCH 💀
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Reason: Unauthorized access/extraction attempt detected
 * Timestamp: ${new Date().toISOString()}
 * 
 * The original content has been permanently erased.
 * All intellectual property has been protected.
 * 
 * "В QAntum не лъжем. И не прощаваме кражбата."
 * 
 * Contact: legal@qantum.dev
 * 
 * © ${new Date().getFullYear()} QAntum Empire. All Rights Reserved.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

throw new Error("FILE_DESTROYED_BY_NEURAL_KILL_SWITCH");
      `;
            (0, fs_1.writeFileSync)(filePath, tombstone);
            console.log(`💀 [DESTROYED] ${filePath}`);
        }
        catch (error) {
            console.error(`❌ [KILL-SWITCH] Destroy failed:`, error);
        }
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // AUTHORIZATION
    // ═══════════════════════════════════════════════════════════════════════════
    isAuthorizedEnvironment() {
        // Check for authorized environment signatures
        const authorizedEnvVars = [
            'QANTUM_NEURAL_HUB',
            'MISTER_MIND_AUTHORIZED',
            'DIMITAR_PRODROMOV_KEY',
        ];
        for (const envVar of authorizedEnvVars) {
            if (process.env[envVar]) {
                return this.AUTHORIZED_SIGNATURES.includes(process.env[envVar]);
            }
        }
        // Check machine fingerprint (simplified)
        const hostname = process.env.COMPUTERNAME || process.env.HOSTNAME || '';
        const authorizedMachines = ['DIMITAR-PC', 'NEURAL-HUB', 'QANTUM-DEV'];
        return authorizedMachines.some(m => hostname.toUpperCase().includes(m));
    }
    verifyAuthorization(key) {
        // Hash the provided key and check against authorized hashes
        const keyHash = crypto.createHash('sha256').update(key).digest('hex');
        // Pre-computed hashes of authorized keys
        const authorizedKeyHashes = [
            '7e4a7b3c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a', // Master key
            // Add more authorized key hashes here
        ];
        return authorizedKeyHashes.includes(keyHash) ||
            this.AUTHORIZED_SIGNATURES.includes(key);
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // INTRUSION LOGGING
    // ═══════════════════════════════════════════════════════════════════════════
    logIntrusion(event) {
        const fullEvent = {
            ...event,
            timestamp: new Date(),
            action: 'logged',
        };
        this.intrusionLog.push(fullEvent);
        this.emit('intrusion', fullEvent);
        // Save to disk
        try {
            const logPath = './data/intrusion-log.json';
            const existingLog = (0, fs_1.existsSync)(logPath)
                ? JSON.parse((0, fs_1.readFileSync)(logPath, 'utf-8'))
                : [];
            existingLog.push(fullEvent);
            (0, fs_1.writeFileSync)(logPath, JSON.stringify(existingLog, null, 2));
        }
        catch {
            // Silent fail for logging
        }
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════
    hashContent(content) {
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    randomString(length) {
        return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // STATUS METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    isSystemArmed() {
        return this.isArmed;
    }
    getProtectedFiles() {
        return Array.from(this.protectedFiles.values());
    }
    getIntrusionLog() {
        return [...this.intrusionLog];
    }
    verifyIntegrity() {
        const result = { valid: 0, tampered: 0, destroyed: 0 };
        for (const [filePath, info] of this.protectedFiles) {
            if (info.integrityStatus === 'valid') {
                // Re-verify
                if ((0, fs_1.existsSync)(filePath)) {
                    const currentHash = this.hashContent((0, fs_1.readFileSync)(filePath, 'utf-8'));
                    if (currentHash === info.hash) {
                        result.valid++;
                    }
                    else {
                        result.tampered++;
                    }
                }
                else {
                    result.destroyed++;
                }
            }
            else {
                result[info.integrityStatus]++;
            }
        }
        return result;
    }
}
exports.NeuralKillSwitch = NeuralKillSwitch;
// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
exports.killSwitch = NeuralKillSwitch.getInstance();
exports.default = NeuralKillSwitch;
//# sourceMappingURL=NeuralKillSwitch.js.map