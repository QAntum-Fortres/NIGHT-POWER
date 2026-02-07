"use strict";
/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    🛡️ THE PERSONAL SOVEREIGNTY MODULE 🛡️                      ║
 * ║                                                                               ║
 * ║  "В QAntum не лъжем."                                                         ║
 * ║                                                                               ║
 * ║  This module generates and validates the Unique Sovereignty Key (USK)         ║
 * ║  based on hardware fingerprint + biometric rhythm.                            ║
 * ║                                                                               ║
 * ║  Created: January 1, 2026 17:05                                               ║
 * ║  Author: Mister Mind for Dimitar Prodromov                                    ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
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
exports.Sovereignty = void 0;
const child_process_1 = require("child_process");
const crypto_1 = require("crypto");
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// The ONLY authorized usernames
const SOVEREIGN_IDENTITIES = ['papic', 'dimitar', 'prodromov', 'mrmind', 'dimitarprodromov'];
// Hardware signature placeholder - injected at build time
const __MASTER_KEY_HASH__ = '___SOVEREIGN_SIGNATURE_PLACEHOLDER___';
class Sovereignty {
    static failedAttempts = 0;
    static MAX_ATTEMPTS = 3;
    static SOVEREIGNTY_PATH = path.join(os.homedir(), '.qantum', 'sovereignty.seal');
    /**
     * 🧬 Extract the complete Hardware DNA
     * Motherboard + UUID + CPU + Disk + MAC + Identity
     */
    static extractHardwareDNA() {
        const dna = {
            motherboard: '',
            uuid: '',
            cpuId: '',
            diskSerial: '',
            macAddresses: [],
            hostname: os.hostname(),
            username: os.userInfo().username.toLowerCase()
        };
        try {
            // Motherboard Serial Number
            const mbOutput = (0, child_process_1.execSync)('wmic baseboard get serialnumber', { encoding: 'utf-8', windowsHide: true });
            dna.motherboard = mbOutput.split('\n').filter(line => line.trim() && !line.includes('SerialNumber'))[0]?.trim() || 'UNKNOWN';
        }
        catch {
            dna.motherboard = 'EXTRACTION_FAILED';
        }
        try {
            // System UUID (BIOS)
            const uuidOutput = (0, child_process_1.execSync)('wmic csproduct get uuid', { encoding: 'utf-8', windowsHide: true });
            dna.uuid = uuidOutput.split('\n').filter(line => line.trim() && !line.includes('UUID'))[0]?.trim() || 'UNKNOWN';
        }
        catch {
            dna.uuid = 'EXTRACTION_FAILED';
        }
        try {
            // CPU Processor ID
            const cpuOutput = (0, child_process_1.execSync)('wmic cpu get processorid', { encoding: 'utf-8', windowsHide: true });
            dna.cpuId = cpuOutput.split('\n').filter(line => line.trim() && !line.includes('ProcessorId'))[0]?.trim() || 'UNKNOWN';
        }
        catch {
            dna.cpuId = 'EXTRACTION_FAILED';
        }
        try {
            // Primary Disk Serial
            const diskOutput = (0, child_process_1.execSync)('wmic diskdrive get serialnumber', { encoding: 'utf-8', windowsHide: true });
            dna.diskSerial = diskOutput.split('\n').filter(line => line.trim() && !line.includes('SerialNumber'))[0]?.trim() || 'UNKNOWN';
        }
        catch {
            dna.diskSerial = 'EXTRACTION_FAILED';
        }
        // MAC Addresses
        const interfaces = os.networkInterfaces();
        for (const [, addrs] of Object.entries(interfaces)) {
            if (addrs) {
                for (const addr of addrs) {
                    if (addr.mac && addr.mac !== '00:00:00:00:00:00') {
                        dna.macAddresses.push(addr.mac);
                    }
                }
            }
        }
        return dna;
    }
    /**
     * 🔐 Generate SHA-512 Sovereignty Hash from Hardware DNA
     */
    static generateSovereigntyHash(dna) {
        const hwDna = dna || this.extractHardwareDNA();
        // Canonical order for consistent hashing
        const canonicalData = [
            hwDna.motherboard,
            hwDna.uuid,
            hwDna.cpuId,
            hwDna.diskSerial,
            hwDna.hostname,
            hwDna.username,
            ...hwDna.macAddresses.sort()
        ].join('|');
        // Double SHA-512 for extra security
        const firstPass = (0, crypto_1.createHash)('sha512').update(canonicalData).digest('hex');
        const finalHash = (0, crypto_1.createHash)('sha512').update(firstPass + 'QANTUM_SOVEREIGNTY_SEAL').digest('hex');
        return finalHash;
    }
    /**
     * 🧠 Get Biometric Rhythm (simulated via system metrics)
     * In production, this would connect to HardwareBridge for real biometrics
     */
    static getBiometricRhythm() {
        // System uptime as "rhythm" signature
        const uptime = os.uptime();
        const loadAvg = os.loadavg().join('-');
        const freeMem = os.freemem();
        return (0, crypto_1.createHash)('sha256')
            .update(`${uptime}:${loadAvg}:${freeMem}`)
            .digest('hex')
            .substring(0, 32);
    }
    /**
     * 🛡️ MAIN VERIFICATION: Check if current machine is the Sovereign Owner
     */
    static verifyOwner() {
        const report = {
            isAuthorized: false,
            identityMatch: false,
            hardwareMatch: false,
            biometricSync: false,
            timestamp: Date.now(),
            machineFingerprint: '',
            threatLevel: 'CRITICAL'
        };
        // Step 1: Identity Verification
        const currentUser = os.userInfo().username.toLowerCase();
        report.identityMatch = SOVEREIGN_IDENTITIES.includes(currentUser);
        if (!report.identityMatch) {
            console.error(`🚨 [SOVEREIGNTY] Identity mismatch: "${currentUser}" is NOT authorized.`);
            this.recordFailedAttempt('IDENTITY_MISMATCH', currentUser);
            report.threatLevel = 'CRITICAL';
            return report;
        }
        // Step 2: Hardware DNA Extraction & Verification
        const dna = this.extractHardwareDNA();
        const currentHash = this.generateSovereigntyHash(dna);
        report.machineFingerprint = currentHash.substring(0, 32) + '...';
        // Check against injected master key (at build time)
        if (__MASTER_KEY_HASH__ !== '___SOVEREIGN_SIGNATURE_PLACEHOLDER___') {
            report.hardwareMatch = currentHash === __MASTER_KEY_HASH__;
        }
        else {
            // Development mode - check against stored seal
            report.hardwareMatch = this.verifyAgainstSeal(currentHash);
        }
        if (!report.hardwareMatch) {
            console.error(`🚨 [SOVEREIGNTY] Hardware DNA mismatch. This is NOT the sovereign machine.`);
            this.recordFailedAttempt('HARDWARE_MISMATCH', currentHash);
            report.threatLevel = 'CRITICAL';
            return report;
        }
        // Step 3: Biometric Rhythm (soft check - warning only)
        report.biometricSync = true; // Always true for now, can be extended
        // All checks passed
        report.isAuthorized = true;
        report.threatLevel = 'NONE';
        console.log(`🟢 [SOVEREIGNTY] Verified. Welcome back, Dimitar.`);
        console.log(`   Machine: ${dna.hostname} | User: ${dna.username}`);
        console.log(`   Fingerprint: ${report.machineFingerprint}`);
        return report;
    }
    /**
     * Verify against stored sovereignty seal (for development)
     */
    static verifyAgainstSeal(currentHash) {
        try {
            if (!fs.existsSync(this.SOVEREIGNTY_PATH)) {
                // First run - create seal
                this.createSeal(currentHash);
                return true;
            }
            const sealData = fs.readFileSync(this.SOVEREIGNTY_PATH, 'utf-8');
            const seal = JSON.parse(sealData);
            return seal.hash === currentHash;
        }
        catch {
            return false;
        }
    }
    /**
     * Create initial sovereignty seal
     */
    static createSeal(hash) {
        const sealDir = path.dirname(this.SOVEREIGNTY_PATH);
        if (!fs.existsSync(sealDir)) {
            fs.mkdirSync(sealDir, { recursive: true });
        }
        const seal = {
            hash,
            created: new Date().toISOString(),
            version: '30.5.0',
            signature: 'QANTUM_SOVEREIGNTY_SEAL'
        };
        // Encrypt the seal
        const key = (0, crypto_1.scryptSync)('QANTUM_SOVEREIGN_KEY', 'dimitar_prodromov_salt', 32);
        const iv = (0, crypto_1.randomBytes)(16);
        const cipher = require('crypto').createCipheriv('aes-256-gcm', key, iv);
        let encrypted = cipher.update(JSON.stringify(seal), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        const sealFile = {
            iv: iv.toString('hex'),
            authTag,
            data: encrypted
        };
        fs.writeFileSync(this.SOVEREIGNTY_PATH, JSON.stringify(sealFile, null, 2));
        console.log(`🔏 [SOVEREIGNTY] Seal created at ${this.SOVEREIGNTY_PATH}`);
    }
    /**
     * Record failed verification attempt
     */
    static recordFailedAttempt(reason, identifier) {
        this.failedAttempts++;
        const logPath = path.join(os.homedir(), '.qantum', 'intrusion.log');
        const logEntry = {
            timestamp: new Date().toISOString(),
            reason,
            identifier: identifier.substring(0, 32),
            attempt: this.failedAttempts,
            hostname: os.hostname()
        };
        try {
            const logDir = path.dirname(logPath);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
        }
        catch {
            // Silent fail
        }
        if (this.failedAttempts >= this.MAX_ATTEMPTS) {
            this.initiateSelfDestruct();
        }
    }
    /**
     * 💀 TOMBSTONE PROTOCOL - Level 3 Self-Destruction
     */
    static initiateSelfDestruct() {
        console.error('');
        console.error('╔═══════════════════════════════════════════════════════════════╗');
        console.error('║  💀 TOMBSTONE PROTOCOL ACTIVATED 💀                            ║');
        console.error('║                                                               ║');
        console.error('║  Unauthorized entity detected after 3 failed attempts.        ║');
        console.error('║  This instance of QAntum will now be destroyed.               ║');
        console.error('║                                                               ║');
        console.error('║  "В QAntum не лъжем."                                         ║');
        console.error('╚═══════════════════════════════════════════════════════════════╝');
        console.error('');
        try {
            // Mark as tombstoned
            const tombstonePath = path.join(os.homedir(), '.qantum', 'TOMBSTONE');
            fs.writeFileSync(tombstonePath, JSON.stringify({
                executedAt: new Date().toISOString(),
                reason: 'SOVEREIGNTY_BREACH',
                attempts: this.failedAttempts
            }));
            // Exit with error
            process.exit(1);
        }
        catch {
            process.exit(1);
        }
    }
    /**
     * Check if system is tombstoned
     */
    static isTombstoned() {
        const tombstonePath = path.join(os.homedir(), '.qantum', 'TOMBSTONE');
        return fs.existsSync(tombstonePath);
    }
    /**
     * 🔥 THE POISON PILL: Polymorphic Obfuscation
     * If compiled on wrong machine, scramble all source files
     */
    static activatePoisonPill(targetDir) {
        console.error('🔥 [POISON PILL] Activating polymorphic obfuscation...');
        const scrambleFile = (filePath) => {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const scrambled = content
                    .split('')
                    .map(() => String.fromCharCode(Math.floor(Math.random() * 94) + 33))
                    .join('');
                fs.writeFileSync(filePath, scrambled);
            }
            catch {
                // Silent fail
            }
        };
        const walkDir = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    walkDir(fullPath);
                }
                else if (file.endsWith('.ts') || file.endsWith('.js')) {
                    scrambleFile(fullPath);
                }
            }
        };
        try {
            walkDir(targetDir);
            console.error('💀 [POISON PILL] All source files scrambled. Project neutralized.');
        }
        catch {
            // Silent fail
        }
    }
    /**
     * Get current sovereignty status for display
     */
    static getStatus() {
        if (this.isTombstoned()) {
            return { icon: '💀', text: 'TOMBSTONED', color: 'black' };
        }
        const report = this.verifyOwner();
        if (report.isAuthorized) {
            return { icon: '🟢', text: 'SOVEREIGN', color: 'green' };
        }
        else if (report.identityMatch) {
            return { icon: '🟡', text: 'PARTIAL', color: 'yellow' };
        }
        else {
            return { icon: '🔴', text: 'BREACH', color: 'red' };
        }
    }
}
exports.Sovereignty = Sovereignty;
exports.default = Sovereignty;
//# sourceMappingURL=Sovereignty.js.map