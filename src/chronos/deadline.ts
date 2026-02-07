/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM DEADLINE MANAGER                                                     ║
 * ║   "Smart timeout handling and deadline enforcement"                           ║
 * ║                                                                               ║
 * ║   TODO B #33 - Chronos: Deadline Management                                   ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type TimeoutStrategy = 
    | 'hard' // Kill immediately
    | 'soft' // Signal but allow cleanup
    | 'adaptive'; // Adjust based on progress

export interface Deadline {
    id: string;
    name: string;
    timeout: number;
    strategy: TimeoutStrategy;
    startedAt: number;
    expiresAt: number;
    status: 'active' | 'expired' | 'completed' | 'cancelled';
    onExpire?: () => void;
    onWarning?: (remaining: number) => void;
    warningThreshold?: number;
    metadata?: Record<string, any>;
}

export interface DeadlineOptions {
    strategy?: TimeoutStrategy;
    warningThreshold?: number;
    onExpire?: () => void;
    onWarning?: (remaining: number) => void;
    metadata?: Record<string, any>;
}

export interface DeadlineResult<T> {
    success: boolean;
    result?: T;
    expired: boolean;
    duration: number;
    remaining: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEADLINE MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class DeadlineManager {
    private static instance: DeadlineManager;

    private deadlines: Map<string, Deadline> = new Map();
    private timers: Map<string, NodeJS.Timeout[]> = new Map();
    private adaptiveHistory: Map<string, number[]> = new Map();

    static getInstance(): DeadlineManager {
        if (!DeadlineManager.instance) {
            DeadlineManager.instance = new DeadlineManager();
        }
        return DeadlineManager.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEADLINE CREATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create a deadline
     */
    create(name: string, timeoutMs: number, options: DeadlineOptions = {}): string {
        const id = `deadline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();

        const deadline: Deadline = {
            id,
            name,
            timeout: timeoutMs,
            strategy: options.strategy || 'hard',
            startedAt: now,
            expiresAt: now + timeoutMs,
            status: 'active',
            onExpire: options.onExpire,
            onWarning: options.onWarning,
            warningThreshold: options.warningThreshold || 0.8,
            metadata: options.metadata
        };

        this.deadlines.set(id, deadline);
        this.setupTimers(deadline);

        return id;
    }

    /**
     * Create deadline from context (AbortController-like)
     */
    createContext(name: string, timeoutMs: number): DeadlineContext {
        const id = this.create(name, timeoutMs);
        return new DeadlineContext(id, this);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXECUTION WITH DEADLINE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Execute function with deadline
     */
    async withDeadline<T>(
        name: string,
        timeoutMs: number,
        fn: (context: DeadlineContext) => Promise<T>,
        options: DeadlineOptions = {}
    ): Promise<DeadlineResult<T>> {
        const context = this.createContext(name, timeoutMs);
        const startTime = Date.now();

        try {
            const result = await Promise.race([
                fn(context),
                this.createTimeoutPromise(context.id, timeoutMs)
            ]);

            const duration = Date.now() - startTime;
            this.complete(context.id);

            // Record for adaptive strategy
            this.recordExecution(name, duration);

            return {
                success: true,
                result: result as T,
                expired: false,
                duration,
                remaining: Math.max(0, timeoutMs - duration)
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            const deadline = this.deadlines.get(context.id);
            const expired = deadline?.status === 'expired';

            return {
                success: false,
                expired,
                duration,
                remaining: 0
            };
        } finally {
            this.cleanup(context.id);
        }
    }

    /**
     * Execute with adaptive timeout
     */
    async withAdaptiveDeadline<T>(
        name: string,
        baseTimeoutMs: number,
        fn: (context: DeadlineContext) => Promise<T>,
        options: DeadlineOptions = {}
    ): Promise<DeadlineResult<T>> {
        const adaptiveTimeout = this.calculateAdaptiveTimeout(name, baseTimeoutMs);
        
        return this.withDeadline(
            name,
            adaptiveTimeout,
            fn,
            { ...options, strategy: 'adaptive' }
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEADLINE MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get deadline
     */
    get(id: string): Deadline | undefined {
        return this.deadlines.get(id);
    }

    /**
     * Get remaining time
     */
    getRemaining(id: string): number {
        const deadline = this.deadlines.get(id);
        if (!deadline || deadline.status !== 'active') return 0;
        return Math.max(0, deadline.expiresAt - Date.now());
    }

    /**
     * Extend deadline
     */
    extend(id: string, additionalMs: number): boolean {
        const deadline = this.deadlines.get(id);
        if (!deadline || deadline.status !== 'active') return false;

        deadline.expiresAt += additionalMs;
        deadline.timeout += additionalMs;

        // Reset timers
        this.clearTimers(id);
        this.setupTimers(deadline);

        return true;
    }

    /**
     * Mark deadline as complete
     */
    complete(id: string): void {
        const deadline = this.deadlines.get(id);
        if (deadline) {
            deadline.status = 'completed';
            this.clearTimers(id);
        }
    }

    /**
     * Cancel deadline
     */
    cancel(id: string): boolean {
        const deadline = this.deadlines.get(id);
        if (!deadline) return false;

        deadline.status = 'cancelled';
        this.clearTimers(id);
        return true;
    }

    /**
     * Check if expired
     */
    isExpired(id: string): boolean {
        const deadline = this.deadlines.get(id);
        if (!deadline) return true;
        
        if (deadline.status === 'expired') return true;
        if (Date.now() >= deadline.expiresAt) {
            deadline.status = 'expired';
            return true;
        }
        
        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BATCH OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create multiple deadlines with shared parent
     */
    createGroup(
        parentName: string,
        parentTimeoutMs: number,
        children: Array<{ name: string; timeout: number }>
    ): { parent: string; children: string[] } {
        const parentId = this.create(parentName, parentTimeoutMs);
        const childIds: string[] = [];

        for (const child of children) {
            // Child cannot exceed parent
            const childTimeout = Math.min(child.timeout, parentTimeoutMs);
            const childId = this.create(
                `${parentName}/${child.name}`,
                childTimeout,
                { metadata: { parent: parentId } }
            );
            childIds.push(childId);
        }

        return { parent: parentId, children: childIds };
    }

    /**
     * Cancel all deadlines in group
     */
    cancelGroup(parentId: string): number {
        let cancelled = 0;
        
        for (const [id, deadline] of this.deadlines) {
            if (id === parentId || deadline.metadata?.parent === parentId) {
                this.cancel(id);
                cancelled++;
            }
        }

        return cancelled;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE
    // ─────────────────────────────────────────────────────────────────────────

    private setupTimers(deadline: Deadline): void {
        const timers: NodeJS.Timeout[] = [];

        // Warning timer
        if (deadline.onWarning && deadline.warningThreshold) {
            const warningTime = deadline.timeout * deadline.warningThreshold;
            const warningTimer = setTimeout(() => {
                if (deadline.status === 'active') {
                    deadline.onWarning!(this.getRemaining(deadline.id));
                }
            }, warningTime);
            timers.push(warningTimer);
        }

        // Expiration timer
        const expirationTimer = setTimeout(() => {
            if (deadline.status === 'active') {
                deadline.status = 'expired';
                deadline.onExpire?.();
            }
        }, deadline.timeout);
        timers.push(expirationTimer);

        this.timers.set(deadline.id, timers);
    }

    private clearTimers(id: string): void {
        const timers = this.timers.get(id);
        if (timers) {
            timers.forEach(clearTimeout);
            this.timers.delete(id);
        }
    }

    private cleanup(id: string): void {
        this.clearTimers(id);
        // Keep deadline for history but mark as done
        const deadline = this.deadlines.get(id);
        if (deadline && deadline.status === 'active') {
            deadline.status = 'completed';
        }
    }

    private createTimeoutPromise(id: string, timeoutMs: number): Promise<never> {
        return new Promise((_, reject) => {
            const timer = setTimeout(() => {
                const deadline = this.deadlines.get(id);
                if (deadline) {
                    deadline.status = 'expired';
                }
                reject(new DeadlineExpiredError(id, timeoutMs));
            }, timeoutMs);

            // Store for cleanup
            const timers = this.timers.get(id) || [];
            timers.push(timer);
            this.timers.set(id, timers);
        });
    }

    private recordExecution(name: string, duration: number): void {
        const history = this.adaptiveHistory.get(name) || [];
        history.push(duration);
        
        // Keep last 100 executions
        if (history.length > 100) {
            history.shift();
        }
        
        this.adaptiveHistory.set(name, history);
    }

    private calculateAdaptiveTimeout(name: string, baseTimeout: number): number {
        const history = this.adaptiveHistory.get(name);
        if (!history || history.length < 5) {
            return baseTimeout;
        }

        // Calculate P95 of historical durations
        const sorted = [...history].sort((a, b) => a - b);
        const p95Index = Math.floor(sorted.length * 0.95);
        const p95 = sorted[p95Index];

        // Use max of P95 + 20% buffer or base timeout
        return Math.max(baseTimeout, p95 * 1.2);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEADLINE CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

export class DeadlineContext {
    constructor(
        public readonly id: string,
        private manager: DeadlineManager
    ) {}

    /**
     * Get remaining time
     */
    get remaining(): number {
        return this.manager.getRemaining(this.id);
    }

    /**
     * Check if expired
     */
    get isExpired(): boolean {
        return this.manager.isExpired(this.id);
    }

    /**
     * Throw if expired
     */
    checkDeadline(): void {
        if (this.isExpired) {
            throw new DeadlineExpiredError(this.id, 0);
        }
    }

    /**
     * Extend deadline
     */
    extend(additionalMs: number): boolean {
        return this.manager.extend(this.id, additionalMs);
    }

    /**
     * Cancel
     */
    cancel(): void {
        this.manager.cancel(this.id);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERRORS
// ═══════════════════════════════════════════════════════════════════════════════

export class DeadlineExpiredError extends Error {
    constructor(
        public readonly deadlineId: string,
        public readonly timeout: number
    ) {
        super(`Deadline ${deadlineId} expired after ${timeout}ms`);
        this.name = 'DeadlineExpiredError';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @WithDeadline - Add deadline to method
 */
export function WithDeadline(timeoutMs: number, options: DeadlineOptions = {}): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;
        const methodName = String(propertyKey);

        descriptor.value = async function (...args: any[]) {
            const manager = DeadlineManager.getInstance();
            const result = await manager.withDeadline(
                methodName,
                timeoutMs,
                async () => original.apply(this, args),
                options
            );

            if (result.expired) {
                throw new DeadlineExpiredError(methodName, timeoutMs);
            }

            return result.result;
        };

        return descriptor;
    };
}

/**
 * @AdaptiveDeadline - Add adaptive deadline to method
 */
export function AdaptiveDeadline(baseTimeoutMs: number): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;
        const methodName = String(propertyKey);

        descriptor.value = async function (...args: any[]) {
            const manager = DeadlineManager.getInstance();
            const result = await manager.withAdaptiveDeadline(
                methodName,
                baseTimeoutMs,
                async () => original.apply(this, args)
            );

            if (result.expired) {
                throw new DeadlineExpiredError(methodName, baseTimeoutMs);
            }

            return result.result;
        };

        return descriptor;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getDeadlineManager = (): DeadlineManager => DeadlineManager.getInstance();

export default DeadlineManager;
