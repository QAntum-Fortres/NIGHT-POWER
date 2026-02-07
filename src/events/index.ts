/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM EVENTS MODULE                                                        ║
 * ║   "Unified event system facade"                                               ║
 * ║                                                                               ║
 * ║   TODO B #41-42 - Events Module Complete                                      ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// RE-EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
    EventBus,
    QAntumEvent,
    EventHandler,
    EventFilter,
    Subscription as BusSubscription,
    EventBusConfig,
    EventMiddleware,
    getEventBus,
    configureEventBus,
    events
} from './bus';

export {
    TypedEmitter,
    ObservableEmitter,
    EventMap,
    EventKey,
    EventReceiver,
    Observer,
    Subscription,
    createEmitter,
    createObservable
} from './emitter';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

import { EventBus, events } from './bus';
import { TypedEmitter, ObservableEmitter, createEmitter, createObservable } from './emitter';

/**
 * Standard QAntum events
 */
export interface QAntumStandardEvents {
    // Test lifecycle
    'test:start': { name: string; suite?: string };
    'test:end': { name: string; passed: boolean; duration: number };
    'test:skip': { name: string; reason?: string };
    'test:error': { name: string; error: Error };

    // Suite lifecycle
    'suite:start': { name: string; testCount: number };
    'suite:end': { name: string; passed: number; failed: number; duration: number };

    // Runner lifecycle
    'runner:start': { suites: string[] };
    'runner:end': { total: number; passed: number; failed: number; duration: number };

    // Assertions
    'assertion:pass': { message: string };
    'assertion:fail': { message: string; expected: any; actual: any };

    // Performance
    'perf:measurement': { name: string; value: number; unit: string };
    'perf:threshold': { name: string; value: number; threshold: number; exceeded: boolean };

    // Coverage
    'coverage:report': { lines: number; branches: number; functions: number; statements: number };

    // Custom
    [key: string]: any;
}

/**
 * Unified QAntum Events
 */
export class QAntumEvents {
    private static instance: QAntumEvents;
    
    readonly bus: EventBus;
    readonly emitter: TypedEmitter<QAntumStandardEvents>;

    private constructor() {
        this.bus = EventBus.getInstance();
        this.emitter = createEmitter<QAntumStandardEvents>();
    }

    static getInstance(): QAntumEvents {
        if (!QAntumEvents.instance) {
            QAntumEvents.instance = new QAntumEvents();
        }
        return QAntumEvents.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TYPED EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Listen to typed event
     */
    on<K extends keyof QAntumStandardEvents>(
        event: K,
        handler: (payload: QAntumStandardEvents[K]) => void
    ): this {
        this.emitter.on(event, handler);
        return this;
    }

    /**
     * Listen once
     */
    once<K extends keyof QAntumStandardEvents>(
        event: K,
        handler: (payload: QAntumStandardEvents[K]) => void
    ): this {
        this.emitter.once(event, handler);
        return this;
    }

    /**
     * Remove listener
     */
    off<K extends keyof QAntumStandardEvents>(
        event: K,
        handler: (payload: QAntumStandardEvents[K]) => void
    ): this {
        this.emitter.off(event, handler);
        return this;
    }

    /**
     * Emit typed event
     */
    emit<K extends keyof QAntumStandardEvents>(event: K, payload: QAntumStandardEvents[K]): void {
        this.emitter.emit(event, payload);
        // Also emit to bus for middleware/history
        this.bus.emitSync(event as string, payload);
    }

    /**
     * Wait for event
     */
    waitFor<K extends keyof QAntumStandardEvents>(
        event: K,
        timeout?: number
    ): Promise<QAntumStandardEvents[K]> {
        return this.emitter.waitFor(event, timeout);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OBSERVABLES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create observable for event
     */
    observe<K extends keyof QAntumStandardEvents>(event: K): ObservableEmitter<QAntumStandardEvents[K]> {
        const observable = createObservable<QAntumStandardEvents[K]>();

        this.emitter.on(event, (payload) => {
            observable.next(payload);
        });

        return observable;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMMON EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Emit test start
     */
    testStart(name: string, suite?: string): void {
        this.emit('test:start', { name, suite });
    }

    /**
     * Emit test end
     */
    testEnd(name: string, passed: boolean, duration: number): void {
        this.emit('test:end', { name, passed, duration });
    }

    /**
     * Emit test error
     */
    testError(name: string, error: Error): void {
        this.emit('test:error', { name, error });
    }

    /**
     * Emit suite start
     */
    suiteStart(name: string, testCount: number): void {
        this.emit('suite:start', { name, testCount });
    }

    /**
     * Emit suite end
     */
    suiteEnd(name: string, passed: number, failed: number, duration: number): void {
        this.emit('suite:end', { name, passed, failed, duration });
    }

    /**
     * Emit runner start
     */
    runnerStart(suites: string[]): void {
        this.emit('runner:start', { suites });
    }

    /**
     * Emit runner end
     */
    runnerEnd(total: number, passed: number, failed: number, duration: number): void {
        this.emit('runner:end', { total, passed, failed, duration });
    }

    /**
     * Emit performance measurement
     */
    perfMeasurement(name: string, value: number, unit: string = 'ms'): void {
        this.emit('perf:measurement', { name, value, unit });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get history
     */
    getHistory(event?: string): any[] {
        return this.bus.getHistory(event);
    }

    /**
     * Clear history
     */
    clearHistory(): void {
        this.bus.clearHistory();
    }

    /**
     * Remove all listeners
     */
    reset(): void {
        this.emitter.removeAllListeners();
        this.bus.removeAllListeners();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getQAntumEvents = (): QAntumEvents => QAntumEvents.getInstance();

export default QAntumEvents;
