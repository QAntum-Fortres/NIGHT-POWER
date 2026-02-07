/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OMEGA CYCLE - Нощен Само-Подобряващ се Цикъл
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Всяка нощ в 03:00, докато светът спи, QAntum анализира работата си,
 *  сравнява се с идеалното си бъдеще и пренаписва по-слабите части."
 *
 * The Omega Cycle is a nightly self-improvement process:
 * 1. ANALYZE - Review all code written/modified that day
 * 2. COMPARE - Compare against mathematical perfection
 * 3. REWRITE - Evolve suboptimal components automatically
 * 4. VERIFY - Ensure no regression via Proof-of-Intent
 * 5. DEPLOY - Push improvements silently
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 28.5.0 OMEGA - THE AWAKENING
 */
import { EventEmitter } from 'events';
export interface CycleReport {
    id: string;
    startedAt: Date;
    completedAt: Date;
    phase: 'ANALYZE' | 'COMPARE' | 'REWRITE' | 'VERIFY' | 'DEPLOY';
    modulesAnalyzed: number;
    improvementsMade: ImprovementRecord[];
    overallImprovement: number;
    status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}
export interface ImprovementRecord {
    filePath: string;
    originalComplexity: number;
    newComplexity: number;
    improvementPercent: number;
    changeType: 'OPTIMIZATION' | 'SECURITY' | 'CLEANUP' | 'EVOLUTION';
    backupPath: string;
}
export interface EvolutionTarget {
    path: string;
    priority: number;
    lastModified: Date;
    currentQuality: number;
    idealQuality: number;
}
export declare class OmegaCycle extends EventEmitter {
    private static instance;
    private readonly chronos;
    private readonly integrity;
    private readonly nucleus;
    private readonly anchor;
    private readonly brain;
    private readonly immune;
    private cycleJob;
    private inactivityCheckInterval;
    private cycleHistory;
    private isRunning;
    private workspaceRoot;
    private lastActivityTime;
    private readonly CYCLE_HOUR;
    private readonly CYCLE_MINUTE;
    private readonly MAX_IMPROVEMENTS_PER_CYCLE;
    private readonly QUALITY_THRESHOLD;
    private readonly BACKUP_DIR;
    private readonly INACTIVITY_THRESHOLD_MS;
    private readonly INACTIVITY_CHECK_INTERVAL_MS;
    private useInactivityTrigger;
    private constructor();
    static getInstance(): OmegaCycle;
    /**
     * Record user activity (call this from IDE integration)
     */
    recordActivity(): void;
    /**
     * Get inactivity duration in milliseconds
     */
    getInactivityDuration(): number;
    /**
     * Check if inactivity threshold is exceeded
     */
    isInactivityThresholdExceeded(): boolean;
    /**
     * Start with fixed schedule (03:00 daily)
     */
    start(): void;
    /**
     * Start with inactivity-based trigger (3+ hours of no activity)
     * This is the preferred mode - cycle runs when you're not working
     */
    startInactivityMode(): void;
    /**
     * Stop all scheduling
     */
    stop(): void;
    /**
     * Run the cycle manually (for testing or on-demand improvement)
     */
    runManual(): Promise<CycleReport>;
    private runCycle;
    /**
     * PHASE 1: Analyze the codebase to find evolution targets
     */
    private analyzeCodebase;
    /**
     * Assess the quality of a file (0-100)
     */
    private assessQuality;
    /**
     * PHASE 2: Compare files to their ideal state
     */
    private compareToIdeal;
    /**
     * PHASE 3: Rewrite a module to improve it
     */
    private rewriteModule;
    /**
     * Create a backup of a file before modification
     */
    private createBackup;
    /**
     * PHASE 4: Verify improvements haven't broken anything
     */
    private verifyImprovements;
    /**
     * Rollback failed improvements
     */
    private rollbackFailed;
    /**
     * PHASE 5: Deploy the improvements
     */
    private deployImprovements;
    getStatus(): {
        isRunning: boolean;
        nextRun: Date | null;
        totalCycles: number;
        totalImprovements: number;
    };
    getHistory(): CycleReport[];
    getLastReport(): CycleReport | null;
}
export declare const omegaCycle: OmegaCycle;
export default OmegaCycle;
