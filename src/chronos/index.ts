/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM CHRONOS MODULE                                                       ║
 * ║   "Master of Time - Scheduling, Travel & Deadlines"                           ║
 * ║                                                                               ║
 * ║   TODO B #31-33 - Complete Chronos System                                     ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// RE-EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export * from './engine';
export * from './time-traveler';
export * from './deadline';

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════════════════════

import { ChronosEngine, getChronos, CronParser, Scheduled } from './engine';
import { 
    TimeTraveler, 
    timeTraveler, 
    freeze, 
    unfreeze, 
    advance, 
    rewind, 
    jumpTo, 
    resetTime,
    FrozenTime,
    MockTime
} from './time-traveler';
import { 
    DeadlineManager, 
    getDeadlineManager, 
    DeadlineContext, 
    DeadlineExpiredError,
    WithDeadline,
    AdaptiveDeadline
} from './deadline';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED CHRONOS FACADE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Unified Chronos - Master of Time
 */
export class Chronos {
    private static instance: Chronos;

    private engine: ChronosEngine;
    private traveler: TimeTraveler;
    private deadlineManager: DeadlineManager;

    private constructor() {
        this.engine = getChronos();
        this.traveler = TimeTraveler.getInstance();
        this.deadlineManager = getDeadlineManager();
    }

    static getInstance(): Chronos {
        if (!Chronos.instance) {
            Chronos.instance = new Chronos();
        }
        return Chronos.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCHEDULING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Schedule a one-time job
     */
    scheduleOnce(
        name: string,
        runAt: Date | number,
        handler: () => Promise<void>
    ): string {
        return this.engine.scheduleOnce(name, runAt, handler);
    }

    /**
     * Schedule a repeating job
     */
    scheduleInterval(
        name: string,
        intervalMs: number,
        handler: () => Promise<void>
    ): string {
        return this.engine.scheduleInterval(name, intervalMs, handler);
    }

    /**
     * Schedule a cron job
     */
    scheduleCron(
        name: string,
        cronExpression: string,
        handler: () => Promise<void>
    ): string {
        return this.engine.scheduleCron(name, cronExpression, handler);
    }

    /**
     * Schedule a delayed job
     */
    delay(
        name: string,
        delayMs: number,
        handler: () => Promise<void>
    ): string {
        return this.engine.scheduleDelay(name, delayMs, handler);
    }

    /**
     * Cancel a scheduled job
     */
    cancelJob(jobId: string): boolean {
        return this.engine.cancel(jobId);
    }

    /**
     * Start the scheduler
     */
    startScheduler(): void {
        this.engine.start();
    }

    /**
     * Stop the scheduler
     */
    stopScheduler(): void {
        this.engine.stop();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TIME TRAVEL
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get current time (respects mock time)
     */
    now(): number {
        return this.traveler.now();
    }

    /**
     * Jump to specific time
     */
    jumpTo(time: Date | number): void {
        this.traveler.jumpTo(time);
    }

    /**
     * Advance time
     */
    advance(ms: number): void {
        this.traveler.advance(ms);
    }

    /**
     * Rewind time
     */
    rewind(ms: number): void {
        this.traveler.rewind(ms);
    }

    /**
     * Freeze time
     */
    freeze(at?: Date | number): void {
        this.traveler.freeze(at);
    }

    /**
     * Unfreeze time
     */
    unfreeze(): void {
        this.traveler.unfreeze();
    }

    /**
     * Create time snapshot
     */
    snapshot(label?: string): string {
        return this.traveler.snapshot(label);
    }

    /**
     * Restore time snapshot
     */
    restoreSnapshot(idOrLabel: string): boolean {
        return this.traveler.restore(idOrLabel);
    }

    /**
     * Install mock time globally
     */
    installMockTime(): void {
        this.traveler.install();
    }

    /**
     * Uninstall mock time
     */
    uninstallMockTime(): void {
        this.traveler.uninstall();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEADLINES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Execute with deadline
     */
    async withDeadline<T>(
        name: string,
        timeoutMs: number,
        fn: (context: DeadlineContext) => Promise<T>
    ): Promise<T> {
        const result = await this.deadlineManager.withDeadline(name, timeoutMs, fn);
        
        if (result.expired) {
            throw new DeadlineExpiredError(name, timeoutMs);
        }
        
        return result.result!;
    }

    /**
     * Execute with adaptive deadline
     */
    async withAdaptiveDeadline<T>(
        name: string,
        baseTimeoutMs: number,
        fn: (context: DeadlineContext) => Promise<T>
    ): Promise<T> {
        const result = await this.deadlineManager.withAdaptiveDeadline(name, baseTimeoutMs, fn);
        
        if (result.expired) {
            throw new DeadlineExpiredError(name, baseTimeoutMs);
        }
        
        return result.result!;
    }

    /**
     * Create deadline context
     */
    createDeadline(name: string, timeoutMs: number): DeadlineContext {
        return this.deadlineManager.createContext(name, timeoutMs);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Parse cron expression
     */
    parseCron(expression: string): ReturnType<typeof CronParser.parse> {
        return CronParser.parse(expression);
    }

    /**
     * Get next cron run time
     */
    getNextCronRun(expression: string, from?: Date): Date {
        return CronParser.getNextRun(expression, from);
    }

    /**
     * Sleep helper
     */
    async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Run all pending mock timers
     */
    runAllTimers(): void {
        this.traveler.runAllTimers();
    }

    /**
     * Reset all time manipulation
     */
    reset(): void {
        this.traveler.reset();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const chronos = Chronos.getInstance();

// Re-export decorators
export {
    Scheduled,
    FrozenTime,
    MockTime,
    WithDeadline,
    AdaptiveDeadline
};

// Re-export time control functions
export {
    freeze,
    unfreeze,
    advance,
    rewind,
    jumpTo,
    resetTime
};

// Re-export classes
export {
    ChronosEngine,
    TimeTraveler,
    DeadlineManager,
    DeadlineContext,
    DeadlineExpiredError,
    CronParser
};

export default Chronos;
