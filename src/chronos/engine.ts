/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM CHRONOS ENGINE                                                       ║
 * ║   "Time-based test scheduling and orchestration"                              ║
 * ║                                                                               ║
 * ║   TODO B #31 - Chronos: Time Management                                       ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ScheduleType = 'once' | 'interval' | 'cron' | 'delay';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ScheduledJob {
    id: string;
    name: string;
    type: ScheduleType;
    schedule: string | number;
    handler: () => Promise<void>;
    status: JobStatus;
    lastRun?: number;
    nextRun?: number;
    runCount: number;
    maxRuns?: number;
    timeout?: number;
    retries?: number;
    createdAt: number;
    metadata?: Record<string, any>;
}

export interface JobResult {
    jobId: string;
    status: 'success' | 'failure';
    duration: number;
    startedAt: number;
    completedAt: number;
    error?: string;
}

export interface CronExpression {
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRON PARSER
// ═══════════════════════════════════════════════════════════════════════════════

export class CronParser {
    /**
     * Parse cron expression
     */
    static parse(expression: string): CronExpression {
        const parts = expression.split(' ');
        if (parts.length !== 5) {
            throw new Error('Invalid cron expression. Expected 5 parts.');
        }

        return {
            minute: parts[0],
            hour: parts[1],
            dayOfMonth: parts[2],
            month: parts[3],
            dayOfWeek: parts[4]
        };
    }

    /**
     * Get next execution time
     */
    static getNextRun(expression: string, from: Date = new Date()): Date {
        const cron = this.parse(expression);
        const next = new Date(from);
        next.setSeconds(0, 0);
        next.setMinutes(next.getMinutes() + 1);

        // Simple implementation - find next matching time
        for (let i = 0; i < 525600; i++) { // Max 1 year ahead
            if (this.matches(next, cron)) {
                return next;
            }
            next.setMinutes(next.getMinutes() + 1);
        }

        throw new Error('Could not find next execution time');
    }

    /**
     * Check if date matches cron expression
     */
    static matches(date: Date, cron: CronExpression): boolean {
        return (
            this.matchField(date.getMinutes(), cron.minute) &&
            this.matchField(date.getHours(), cron.hour) &&
            this.matchField(date.getDate(), cron.dayOfMonth) &&
            this.matchField(date.getMonth() + 1, cron.month) &&
            this.matchField(date.getDay(), cron.dayOfWeek)
        );
    }

    private static matchField(value: number, field: string): boolean {
        if (field === '*') return true;

        // Handle ranges (1-5)
        if (field.includes('-')) {
            const [min, max] = field.split('-').map(Number);
            return value >= min && value <= max;
        }

        // Handle lists (1,3,5)
        if (field.includes(',')) {
            return field.split(',').map(Number).includes(value);
        }

        // Handle steps (*/5)
        if (field.includes('/')) {
            const [, step] = field.split('/');
            return value % parseInt(step, 10) === 0;
        }

        // Exact match
        return value === parseInt(field, 10);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHRONOS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class ChronosEngine {
    private static instance: ChronosEngine;

    private jobs: Map<string, ScheduledJob> = new Map();
    private results: Map<string, JobResult[]> = new Map();
    private timers: Map<string, NodeJS.Timeout> = new Map();
    private running: boolean = false;

    static getInstance(): ChronosEngine {
        if (!ChronosEngine.instance) {
            ChronosEngine.instance = new ChronosEngine();
        }
        return ChronosEngine.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // JOB SCHEDULING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Schedule a one-time job
     */
    scheduleOnce(
        name: string,
        runAt: Date | number,
        handler: () => Promise<void>,
        options?: Partial<ScheduledJob>
    ): string {
        const timestamp = runAt instanceof Date ? runAt.getTime() : runAt;
        const delay = timestamp - Date.now();

        if (delay < 0) {
            throw new Error('Cannot schedule job in the past');
        }

        return this.createJob(name, 'once', timestamp, handler, options);
    }

    /**
     * Schedule a repeating job
     */
    scheduleInterval(
        name: string,
        intervalMs: number,
        handler: () => Promise<void>,
        options?: Partial<ScheduledJob>
    ): string {
        return this.createJob(name, 'interval', intervalMs, handler, options);
    }

    /**
     * Schedule a cron job
     */
    scheduleCron(
        name: string,
        cronExpression: string,
        handler: () => Promise<void>,
        options?: Partial<ScheduledJob>
    ): string {
        // Validate cron expression
        CronParser.parse(cronExpression);
        return this.createJob(name, 'cron', cronExpression, handler, options);
    }

    /**
     * Schedule a delayed job
     */
    scheduleDelay(
        name: string,
        delayMs: number,
        handler: () => Promise<void>,
        options?: Partial<ScheduledJob>
    ): string {
        return this.createJob(name, 'delay', delayMs, handler, options);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // JOB MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get job by ID
     */
    getJob(jobId: string): ScheduledJob | undefined {
        return this.jobs.get(jobId);
    }

    /**
     * Get all jobs
     */
    getAllJobs(): ScheduledJob[] {
        return [...this.jobs.values()];
    }

    /**
     * Get job results
     */
    getResults(jobId: string): JobResult[] {
        return this.results.get(jobId) || [];
    }

    /**
     * Cancel a job
     */
    cancel(jobId: string): boolean {
        const job = this.jobs.get(jobId);
        if (!job) return false;

        job.status = 'cancelled';
        
        const timer = this.timers.get(jobId);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(jobId);
        }

        return true;
    }

    /**
     * Pause a job
     */
    pause(jobId: string): boolean {
        const job = this.jobs.get(jobId);
        if (!job) return false;

        const timer = this.timers.get(jobId);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(jobId);
        }

        return true;
    }

    /**
     * Resume a job
     */
    resume(jobId: string): boolean {
        const job = this.jobs.get(jobId);
        if (!job || job.status === 'cancelled') return false;

        this.scheduleNextRun(job);
        return true;
    }

    /**
     * Trigger job immediately
     */
    async trigger(jobId: string): Promise<JobResult | null> {
        const job = this.jobs.get(jobId);
        if (!job) return null;

        return this.executeJob(job);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENGINE CONTROL
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Start the engine
     */
    start(): void {
        if (this.running) return;
        this.running = true;

        // Schedule all pending jobs
        for (const job of this.jobs.values()) {
            if (job.status === 'pending') {
                this.scheduleNextRun(job);
            }
        }

        console.log('[Chronos] Engine started');
    }

    /**
     * Stop the engine
     */
    stop(): void {
        this.running = false;

        // Clear all timers
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.timers.clear();

        console.log('[Chronos] Engine stopped');
    }

    /**
     * Check if running
     */
    isRunning(): boolean {
        return this.running;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE
    // ─────────────────────────────────────────────────────────────────────────

    private createJob(
        name: string,
        type: ScheduleType,
        schedule: string | number,
        handler: () => Promise<void>,
        options?: Partial<ScheduledJob>
    ): string {
        const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const job: ScheduledJob = {
            id,
            name,
            type,
            schedule,
            handler,
            status: 'pending',
            runCount: 0,
            createdAt: Date.now(),
            ...options
        };

        // Calculate next run
        job.nextRun = this.calculateNextRun(job);

        this.jobs.set(id, job);
        this.results.set(id, []);

        if (this.running) {
            this.scheduleNextRun(job);
        }

        return id;
    }

    private calculateNextRun(job: ScheduledJob): number {
        const now = Date.now();

        switch (job.type) {
            case 'once':
                return job.schedule as number;
            case 'delay':
                return now + (job.schedule as number);
            case 'interval':
                return now + (job.schedule as number);
            case 'cron':
                return CronParser.getNextRun(job.schedule as string).getTime();
            default:
                return now;
        }
    }

    private scheduleNextRun(job: ScheduledJob): void {
        if (!job.nextRun) return;

        const delay = Math.max(0, job.nextRun - Date.now());

        const timer = setTimeout(async () => {
            await this.executeJob(job);

            // Schedule next run if repeating
            if (job.type === 'interval' || job.type === 'cron') {
                if (job.maxRuns && job.runCount >= job.maxRuns) {
                    job.status = 'completed';
                } else {
                    job.nextRun = this.calculateNextRun(job);
                    this.scheduleNextRun(job);
                }
            }
        }, delay);

        this.timers.set(job.id, timer);
    }

    private async executeJob(job: ScheduledJob): Promise<JobResult> {
        const startedAt = Date.now();
        job.status = 'running';
        job.lastRun = startedAt;

        const result: JobResult = {
            jobId: job.id,
            status: 'success',
            duration: 0,
            startedAt,
            completedAt: 0
        };

        try {
            // Execute with timeout if specified
            if (job.timeout) {
                await Promise.race([
                    job.handler(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Job timeout')), job.timeout)
                    )
                ]);
            } else {
                await job.handler();
            }

            job.runCount++;
            job.status = job.type === 'once' || job.type === 'delay' ? 'completed' : 'pending';

        } catch (error) {
            result.status = 'failure';
            result.error = (error as Error).message;
            job.status = 'failed';

            // Retry if configured
            if (job.retries && job.retries > 0) {
                job.retries--;
                job.nextRun = Date.now() + 5000; // Retry in 5 seconds
                this.scheduleNextRun(job);
            }
        }

        result.completedAt = Date.now();
        result.duration = result.completedAt - result.startedAt;

        // Store result
        const results = this.results.get(job.id) || [];
        results.push(result);
        this.results.set(job.id, results.slice(-100)); // Keep last 100 results

        return result;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @Scheduled - Mark method as scheduled job
 */
export function Scheduled(
    type: ScheduleType,
    schedule: string | number
): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;

        // Store metadata for registration
        if (!target._scheduledJobs) target._scheduledJobs = [];
        target._scheduledJobs.push({
            method: propertyKey,
            type,
            schedule
        });

        return descriptor;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getChronos = (): ChronosEngine => ChronosEngine.getInstance();

export default ChronosEngine;
