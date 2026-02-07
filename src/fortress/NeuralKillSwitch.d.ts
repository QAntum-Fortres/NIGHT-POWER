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
import { EventEmitter } from 'events';
export interface ProtectedFile {
    path: string;
    hash: string;
    protectionLevel: 1 | 2 | 3;
    lastVerified: Date;
    integrityStatus: 'valid' | 'tampered' | 'destroyed';
}
export interface IntrusionEvent {
    timestamp: Date;
    type: 'access' | 'copy' | 'modification' | 'extraction';
    filePath: string;
    action: 'logged' | 'scrambled' | 'destroyed';
    details: string;
}
export interface KillSwitchConfig {
    enabledFiles: string[];
    protectionLevel: 1 | 2 | 3;
    alertOnIntrusion: boolean;
    autoScramble: boolean;
    authorizedHashes: string[];
}
export declare class NeuralKillSwitch extends EventEmitter {
    private static instance;
    private protectedFiles;
    private intrusionLog;
    private watchers;
    private isArmed;
    private readonly PROTECTED_PATTERNS;
    private readonly AUTHORIZED_SIGNATURES;
    private constructor();
    static getInstance(): NeuralKillSwitch;
    /**
     * Arm the kill-switch protection system
     */
    arm(config?: Partial<KillSwitchConfig>): void;
    /**
     * Disarm with authorization
     */
    disarm(authorizationKey: string): boolean;
    private registerProtectedFile;
    private startWatching;
    private stopWatching;
    private handleFileEvent;
    private executeProtection;
    private scrambleFile;
    private destroyFile;
    private isAuthorizedEnvironment;
    private verifyAuthorization;
    private logIntrusion;
    private hashContent;
    private randomString;
    isSystemArmed(): boolean;
    getProtectedFiles(): ProtectedFile[];
    getIntrusionLog(): IntrusionEvent[];
    verifyIntegrity(): {
        valid: number;
        tampered: number;
        destroyed: number;
    };
}
export declare const killSwitch: NeuralKillSwitch;
export default NeuralKillSwitch;
