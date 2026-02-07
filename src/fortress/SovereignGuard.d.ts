/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SOVEREIGN GUARD - Дигитален Имунитет от Висш Порядък
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Това е първият в света код, който активно се защитава от неоторизиран
 *  достъп чрез Математическа Ентропия. Софтуер с инстинкт за самосъхранение."
 *
 * Enhanced version combining:
 * - NeuralKillSwitch functionality (Level 1-3 retaliation)
 * - Biometric verification
 * - Intent signature monitoring
 * - AST-level code scrambling
 * - Tombstone protocol
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 30.1.0 - SOVEREIGN GUARD PROTOCOL
 */
import { EventEmitter } from 'events';
export interface AccessAttempt {
    timestamp: Date;
    action: 'READ' | 'WRITE' | 'COPY' | 'EXTRACT' | 'EXECUTE';
    file: string;
    source: string;
    biometricSignature?: string;
    intentSignature?: string;
}
export interface ProtectionConfig {
    target: string;
    level: 1 | 2 | 3;
    strategy: 'Warning' | 'Scramble' | 'Tombstone';
    backupEnabled: boolean;
}
export interface TombstoneRecord {
    status: 'OBLITERATED';
    reason: string;
    originalHash: string;
    timestamp: string;
    perpetrator?: string;
}
export interface IntrusionLog {
    id: string;
    timestamp: Date;
    level: 1 | 2 | 3;
    file: string;
    action: 'LOGGED' | 'SCRAMBLED' | 'DESTROYED';
    details: string;
}
export declare class SovereignGuard extends EventEmitter {
    private static instance;
    private readonly PROTECTED_FILES;
    private readonly AUTHORIZED_SIGNATURES;
    private readonly BACKUP_DIR;
    private readonly LOG_PATH;
    private intrusionLog;
    private fileHashes;
    private isArmed;
    private constructor();
    static getInstance(): SovereignGuard;
    /**
     * Arm the Sovereign Guard with specified protection
     */
    arm(config?: Partial<ProtectionConfig>): Promise<void>;
    /**
     * Disarm with biometric verification
     */
    disarm(biometricKey: string): boolean;
    /**
     * Monitor an access attempt and respond accordingly
     */
    monitorIntegrity(accessAttempt: AccessAttempt): Promise<void>;
    /**
     * Verify biometric signature
     */
    private verifyBiometric;
    /**
     * Calculate retaliation level based on threat severity
     */
    private calculateRetaliationLevel;
    /**
     * Execute retaliation at specified level
     */
    private executeRetaliation;
    /**
     * Scramble code using mathematical entropy
     * Makes the code look valid but completely non-functional
     */
    private scrambleCode;
    /**
     * Apply mathematical entropy to code
     * This makes code look syntactically valid but logically broken
     */
    private applyMathematicalEntropy;
    /**
     * Obliterate file and leave tombstone
     */
    private obliterate;
    private createBackup;
    /**
     * Recover a file from backup (requires authorization)
     */
    recover(filePath: string, biometricKey: string): Promise<boolean>;
    private computeFileHash;
    private logIntrusion;
    private loadIntrusionLog;
    private saveIntrusionLog;
    getStatus(): {
        isArmed: boolean;
        protectedFiles: number;
        intrusionCount: number;
        lastIntrusion: IntrusionLog | null;
    };
    getIntrusionLog(): IntrusionLog[];
}
export declare const sovereignGuard: SovereignGuard;
export default SovereignGuard;
