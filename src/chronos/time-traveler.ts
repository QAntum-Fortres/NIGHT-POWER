/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM TIME TRAVELER                                                        ║
 * ║   "Mock time, freeze moments, travel through test timelines"                  ║
 * ║                                                                               ║
 * ║   TODO B #32 - Chronos: Time Manipulation                                     ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TimeSnapshot {
    id: string;
    timestamp: number;
    label?: string;
    createdAt: number;
}

export interface TimeTravelEvent {
    from: number;
    to: number;
    type: 'jump' | 'advance' | 'rewind';
    timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIME TRAVELER
// ═══════════════════════════════════════════════════════════════════════════════

export class TimeTraveler {
    private static instance: TimeTraveler;

    private originalDate = Date;
    private originalNow = Date.now;
    private originalTimeout = globalThis.setTimeout;
    private originalInterval = globalThis.setInterval;

    private frozen: boolean = false;
    private frozenTime: number = 0;
    private offset: number = 0;
    private speed: number = 1;

    private snapshots: Map<string, TimeSnapshot> = new Map();
    private history: TimeTravelEvent[] = [];

    private pendingTimers: Map<number, { callback: Function; time: number }> = new Map();
    private timerIdCounter: number = 0;

    static getInstance(): TimeTraveler {
        if (!TimeTraveler.instance) {
            TimeTraveler.instance = new TimeTraveler();
        }
        return TimeTraveler.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TIME CONTROL
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get current mock time
     */
    now(): number {
        if (this.frozen) {
            return this.frozenTime;
        }
        return this.originalNow() + this.offset;
    }

    /**
     * Get Date constructor that respects mock time
     */
    getDate(): typeof Date {
        const traveler = this;
        
        return class MockDate extends traveler.originalDate {
            constructor();
            constructor(value: number | string);
            constructor(year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number);
            constructor(...args: any[]) {
                if (args.length === 0) {
                    super(traveler.now());
                } else {
                    super(...args);
                }
            }

            static now(): number {
                return traveler.now();
            }
        } as typeof Date;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TIME MANIPULATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Jump to specific time
     */
    jumpTo(time: number | Date): void {
        const timestamp = time instanceof Date ? time.getTime() : time;
        const previousTime = this.now();

        this.offset = timestamp - this.originalNow();
        
        if (this.frozen) {
            this.frozenTime = timestamp;
        }

        this.recordEvent(previousTime, timestamp, 'jump');
        this.triggerPendingTimers();
    }

    /**
     * Advance time by duration
     */
    advance(ms: number): void {
        const previousTime = this.now();
        
        if (this.frozen) {
            this.frozenTime += ms;
        } else {
            this.offset += ms;
        }

        this.recordEvent(previousTime, this.now(), 'advance');
        this.triggerPendingTimers();
    }

    /**
     * Rewind time by duration
     */
    rewind(ms: number): void {
        const previousTime = this.now();
        
        if (this.frozen) {
            this.frozenTime -= ms;
        } else {
            this.offset -= ms;
        }

        this.recordEvent(previousTime, this.now(), 'rewind');
    }

    /**
     * Freeze time at current moment
     */
    freeze(at?: number | Date): void {
        this.frozen = true;
        this.frozenTime = at 
            ? (at instanceof Date ? at.getTime() : at)
            : this.now();
    }

    /**
     * Unfreeze time
     */
    unfreeze(): void {
        if (this.frozen) {
            this.offset = this.frozenTime - this.originalNow();
            this.frozen = false;
        }
    }

    /**
     * Set time speed multiplier
     */
    setSpeed(multiplier: number): void {
        if (multiplier <= 0) {
            throw new Error('Speed multiplier must be positive');
        }
        this.speed = multiplier;
    }

    /**
     * Reset to real time
     */
    reset(): void {
        this.frozen = false;
        this.frozenTime = 0;
        this.offset = 0;
        this.speed = 1;
        this.pendingTimers.clear();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SNAPSHOTS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Save current time as snapshot
     */
    snapshot(label?: string): string {
        const id = `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.snapshots.set(id, {
            id,
            timestamp: this.now(),
            label,
            createdAt: this.originalNow()
        });

        return id;
    }

    /**
     * Restore snapshot
     */
    restore(idOrLabel: string): boolean {
        // Find by ID or label
        let snapshot: TimeSnapshot | undefined;

        if (this.snapshots.has(idOrLabel)) {
            snapshot = this.snapshots.get(idOrLabel);
        } else {
            for (const snap of this.snapshots.values()) {
                if (snap.label === idOrLabel) {
                    snapshot = snap;
                    break;
                }
            }
        }

        if (!snapshot) return false;

        this.jumpTo(snapshot.timestamp);
        return true;
    }

    /**
     * Get all snapshots
     */
    getSnapshots(): TimeSnapshot[] {
        return [...this.snapshots.values()];
    }

    /**
     * Delete snapshot
     */
    deleteSnapshot(idOrLabel: string): boolean {
        if (this.snapshots.has(idOrLabel)) {
            this.snapshots.delete(idOrLabel);
            return true;
        }

        for (const [id, snap] of this.snapshots) {
            if (snap.label === idOrLabel) {
                this.snapshots.delete(id);
                return true;
            }
        }

        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TIMER MOCKING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Mock setTimeout
     */
    setTimeout(callback: Function, delay: number, ...args: any[]): number {
        const id = ++this.timerIdCounter;
        const triggerTime = this.now() + delay;

        this.pendingTimers.set(id, {
            callback: () => callback(...args),
            time: triggerTime
        });

        return id;
    }

    /**
     * Mock clearTimeout
     */
    clearTimeout(id: number): void {
        this.pendingTimers.delete(id);
    }

    /**
     * Run all pending timers
     */
    runAllTimers(): void {
        const timers = [...this.pendingTimers.entries()]
            .sort((a, b) => a[1].time - b[1].time);

        for (const [id, timer] of timers) {
            this.jumpTo(timer.time);
            timer.callback();
            this.pendingTimers.delete(id);
        }
    }

    /**
     * Run pending timers up to a point
     */
    runTimersTo(time: number | Date): void {
        const targetTime = time instanceof Date ? time.getTime() : time;
        const timers = [...this.pendingTimers.entries()]
            .filter(([, t]) => t.time <= targetTime)
            .sort((a, b) => a[1].time - b[1].time);

        for (const [id, timer] of timers) {
            this.jumpTo(timer.time);
            timer.callback();
            this.pendingTimers.delete(id);
        }

        this.jumpTo(targetTime);
    }

    /**
     * Get pending timers count
     */
    getPendingTimersCount(): number {
        return this.pendingTimers.size;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GLOBAL INSTALLATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Install mock time globally
     */
    install(): void {
        const traveler = this;

        // Mock Date
        (globalThis as any).Date = this.getDate();

        // Mock timers
        (globalThis as any).setTimeout = (cb: Function, delay: number, ...args: any[]) =>
            traveler.setTimeout(cb, delay, ...args);

        console.log('[TimeTraveler] Installed - time is now under control');
    }

    /**
     * Uninstall mock time
     */
    uninstall(): void {
        (globalThis as any).Date = this.originalDate;
        (globalThis as any).setTimeout = this.originalTimeout;

        this.reset();
        console.log('[TimeTraveler] Uninstalled - real time restored');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get travel history
     */
    getHistory(): TimeTravelEvent[] {
        return [...this.history];
    }

    /**
     * Check if time is frozen
     */
    isFrozen(): boolean {
        return this.frozen;
    }

    /**
     * Get current speed
     */
    getSpeed(): number {
        return this.speed;
    }

    /**
     * Get current offset from real time
     */
    getOffset(): number {
        return this.offset;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE
    // ─────────────────────────────────────────────────────────────────────────

    private recordEvent(from: number, to: number, type: 'jump' | 'advance' | 'rewind'): void {
        this.history.push({
            from,
            to,
            type,
            timestamp: this.originalNow()
        });

        // Keep last 1000 events
        if (this.history.length > 1000) {
            this.history = this.history.slice(-1000);
        }
    }

    private triggerPendingTimers(): void {
        const currentTime = this.now();
        const triggered: number[] = [];

        for (const [id, timer] of this.pendingTimers) {
            if (timer.time <= currentTime) {
                timer.callback();
                triggered.push(id);
            }
        }

        triggered.forEach(id => this.pendingTimers.delete(id));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const timeTraveler = TimeTraveler.getInstance();

export const freeze = (at?: number | Date) => timeTraveler.freeze(at);
export const unfreeze = () => timeTraveler.unfreeze();
export const advance = (ms: number) => timeTraveler.advance(ms);
export const rewind = (ms: number) => timeTraveler.rewind(ms);
export const jumpTo = (time: number | Date) => timeTraveler.jumpTo(time);
// ═══════════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @FrozenTime - Execute method with frozen time
 */
export function FrozenTime(at?: number | Date): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const traveler = TimeTraveler.getInstance();
            traveler.freeze(at);

            try {
                return await original.apply(this, args);
            } finally {
                traveler.unfreeze();
            }
        };

        return descriptor;
    };
}

/**
 * @MockTime - Execute method at specific mock time
 */
export function MockTime(time: number | Date | (() => number | Date)): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const traveler = TimeTraveler.getInstance();
            const targetTime = typeof time === 'function' ? time() : time;
            
            traveler.install();
            traveler.jumpTo(targetTime);

            try {
                return await original.apply(this, args);
            } finally {
                traveler.uninstall();
            }
        };

        return descriptor;
    };
}

export default TimeTraveler;
