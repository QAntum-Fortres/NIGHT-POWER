/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * IMMUNE SYSTEM - Self-Healing Code Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Системата се поправя сама. 3000+ грешки → 0, докато спиш."
 *
 * Capabilities:
 * - Automatic error detection
 * - RTX 4050 powered code healing
 * - Pinecone context injection for intelligent fixes
 * - Rollback safety
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 28.5.0 - THE AWAKENING
 */
import { EventEmitter } from 'events';
export interface HealingResult {
    filePath: string;
    success: boolean;
    errorType: string;
    originalHash: string;
    newHash: string;
    healingTimeMs: number;
    rollbackAvailable: boolean;
}
export interface ErrorDiagnosis {
    filePath: string;
    line: number;
    column: number;
    errorCode: string;
    message: string;
    severity: 'error' | 'warning';
    suggestedFix?: string;
}
export interface HealingSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    totalErrors: number;
    healed: number;
    failed: number;
    results: HealingResult[];
}
export declare class ImmuneSystem extends EventEmitter {
    private static instance;
    private readonly brain;
    private readonly BACKUP_DIR;
    private readonly MAX_RETRIES;
    private currentSession?;
    private healingHistory;
    private constructor();
    static getInstance(): ImmuneSystem;
    /**
     * Heal a single file based on an error log
     */
    heal(errorLog: string, filePath: string): Promise<HealingResult>;
    /**
     * Run full diagnostic scan and heal all errors
     */
    healAll(targetDir?: string): Promise<HealingSession>;
    private runDiagnostics;
    private diagnoseError;
    private gatherContext;
    private validateFix;
    private extractCode;
    private createBackup;
    private ensureBackupDir;
    private hashContent;
    /**
     * Rollback a file to its backup
     */
    rollback(filePath: string): boolean;
    getHealingHistory(): HealingSession[];
    getCurrentSession(): HealingSession | undefined;
    getHealingStats(): {
        total: number;
        healed: number;
        failed: number;
        successRate: number;
    };
}
export declare const immuneSystem: ImmuneSystem;
export default ImmuneSystem;
