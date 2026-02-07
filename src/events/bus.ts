/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM EVENT BUS                                                            ║
 * ║   "Enterprise event-driven architecture"                                      ║
 * ║                                                                               ║
 * ║   TODO B #41 - Events: Event bus system                                       ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type EventHandler<T = any> = (event: QAntumEvent<T>) => void | Promise<void>;
export type EventFilter<T = any> = (event: QAntumEvent<T>) => boolean;

export interface QAntumEvent<T = any> {
    type: string;
    payload: T;
    timestamp: number;
    id: string;
    source?: string;
    metadata?: Record<string, any>;
}

export interface Subscription {
    id: string;
    type: string;
    handler: EventHandler;
    filter?: EventFilter;
    once: boolean;
    priority: number;
    unsubscribe: () => void;
}

export interface EventBusConfig {
    maxListeners?: number;
    asyncMode?: boolean;
    errorHandler?: (error: Error, event: QAntumEvent) => void;
    middleware?: EventMiddleware[];
}

export type EventMiddleware = (
    event: QAntumEvent,
    next: () => Promise<void>
) => Promise<void>;

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT BUS
// ═══════════════════════════════════════════════════════════════════════════════

export class EventBus {
    private static instance: EventBus;
    private subscriptions = new Map<string, Subscription[]>();
    private wildcardSubscriptions: Subscription[] = [];
    private config: Required<EventBusConfig>;
    private middleware: EventMiddleware[] = [];
    private eventHistory: QAntumEvent[] = [];
    private subscriptionCounter = 0;

    private constructor(config: EventBusConfig = {}) {
        this.config = {
            maxListeners: config.maxListeners || 100,
            asyncMode: config.asyncMode ?? true,
            errorHandler: config.errorHandler || this.defaultErrorHandler,
            middleware: config.middleware || []
        };
        this.middleware = [...this.config.middleware];
    }

    static getInstance(config?: EventBusConfig): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus(config);
        }
        return EventBus.instance;
    }

    static configure(config: EventBusConfig): EventBus {
        EventBus.instance = new EventBus(config);
        return EventBus.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUBSCRIPTION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Subscribe to event
     */
    on<T = any>(
        type: string,
        handler: EventHandler<T>,
        options?: { filter?: EventFilter<T>; priority?: number }
    ): Subscription {
        return this.subscribe(type, handler, {
            filter: options?.filter,
            priority: options?.priority || 0,
            once: false
        });
    }

    /**
     * Subscribe once
     */
    once<T = any>(type: string, handler: EventHandler<T>): Subscription {
        return this.subscribe(type, handler, { once: true, priority: 0 });
    }

    /**
     * Subscribe to all events
     */
    onAll(handler: EventHandler): Subscription {
        return this.subscribe('*', handler, { once: false, priority: 0 });
    }

    private subscribe(
        type: string,
        handler: EventHandler,
        options: { filter?: EventFilter; once: boolean; priority: number }
    ): Subscription {
        const id = `sub_${++this.subscriptionCounter}`;

        const subscription: Subscription = {
            id,
            type,
            handler,
            filter: options.filter,
            once: options.once,
            priority: options.priority,
            unsubscribe: () => this.unsubscribe(id)
        };

        if (type === '*') {
            this.wildcardSubscriptions.push(subscription);
            this.wildcardSubscriptions.sort((a, b) => b.priority - a.priority);
        } else {
            if (!this.subscriptions.has(type)) {
                this.subscriptions.set(type, []);
            }
            const subs = this.subscriptions.get(type)!;
            
            if (subs.length >= this.config.maxListeners) {
                console.warn(`Max listeners (${this.config.maxListeners}) reached for event "${type}"`);
            }

            subs.push(subscription);
            subs.sort((a, b) => b.priority - a.priority);
        }

        return subscription;
    }

    /**
     * Unsubscribe
     */
    off(type: string, handler?: EventHandler): void {
        if (type === '*') {
            if (handler) {
                this.wildcardSubscriptions = this.wildcardSubscriptions.filter(
                    s => s.handler !== handler
                );
            } else {
                this.wildcardSubscriptions = [];
            }
            return;
        }

        if (!this.subscriptions.has(type)) return;

        if (handler) {
            const subs = this.subscriptions.get(type)!;
            this.subscriptions.set(type, subs.filter(s => s.handler !== handler));
        } else {
            this.subscriptions.delete(type);
        }
    }

    private unsubscribe(id: string): void {
        for (const [type, subs] of this.subscriptions) {
            const filtered = subs.filter(s => s.id !== id);
            if (filtered.length !== subs.length) {
                this.subscriptions.set(type, filtered);
                return;
            }
        }

        this.wildcardSubscriptions = this.wildcardSubscriptions.filter(s => s.id !== id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EMISSION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Emit event
     */
    async emit<T = any>(type: string, payload: T, metadata?: Record<string, any>): Promise<void> {
        const event: QAntumEvent<T> = {
            type,
            payload,
            timestamp: Date.now(),
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            metadata
        };

        // Store in history
        this.eventHistory.push(event);
        if (this.eventHistory.length > 1000) {
            this.eventHistory.shift();
        }

        // Run through middleware
        await this.runMiddleware(event, async () => {
            await this.notifySubscribers(event);
        });
    }

    /**
     * Emit sync
     */
    emitSync<T = any>(type: string, payload: T): void {
        const event: QAntumEvent<T> = {
            type,
            payload,
            timestamp: Date.now(),
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        };

        this.notifySubscribersSync(event);
    }

    private async notifySubscribers(event: QAntumEvent): Promise<void> {
        const subscribers = this.getSubscribers(event.type);

        const toRemove: string[] = [];

        for (const sub of subscribers) {
            // Check filter
            if (sub.filter && !sub.filter(event)) {
                continue;
            }

            try {
                if (this.config.asyncMode) {
                    await sub.handler(event);
                } else {
                    sub.handler(event);
                }
            } catch (error) {
                this.config.errorHandler(error as Error, event);
            }

            if (sub.once) {
                toRemove.push(sub.id);
            }
        }

        // Remove once subscriptions
        for (const id of toRemove) {
            this.unsubscribe(id);
        }
    }

    private notifySubscribersSync(event: QAntumEvent): void {
        const subscribers = this.getSubscribers(event.type);

        for (const sub of subscribers) {
            if (sub.filter && !sub.filter(event)) continue;

            try {
                sub.handler(event);
            } catch (error) {
                this.config.errorHandler(error as Error, event);
            }
        }
    }

    private getSubscribers(type: string): Subscription[] {
        const specific = this.subscriptions.get(type) || [];
        return [...specific, ...this.wildcardSubscriptions];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MIDDLEWARE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Add middleware
     */
    use(middleware: EventMiddleware): void {
        this.middleware.push(middleware);
    }

    private async runMiddleware(event: QAntumEvent, final: () => Promise<void>): Promise<void> {
        const middlewares = [...this.middleware];
        let index = 0;

        const next = async (): Promise<void> => {
            if (index < middlewares.length) {
                const mw = middlewares[index++];
                await mw(event, next);
            } else {
                await final();
            }
        };

        await next();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get event history
     */
    getHistory(type?: string): QAntumEvent[] {
        if (type) {
            return this.eventHistory.filter(e => e.type === type);
        }
        return [...this.eventHistory];
    }

    /**
     * Clear history
     */
    clearHistory(): void {
        this.eventHistory = [];
    }

    /**
     * Get listener count
     */
    listenerCount(type?: string): number {
        if (type) {
            return (this.subscriptions.get(type)?.length || 0) + this.wildcardSubscriptions.length;
        }
        let count = this.wildcardSubscriptions.length;
        for (const subs of this.subscriptions.values()) {
            count += subs.length;
        }
        return count;
    }

    /**
     * Get event types
     */
    eventTypes(): string[] {
        return [...this.subscriptions.keys()];
    }

    /**
     * Remove all listeners
     */
    removeAllListeners(type?: string): void {
        if (type) {
            this.subscriptions.delete(type);
        } else {
            this.subscriptions.clear();
            this.wildcardSubscriptions = [];
        }
    }

    /**
     * Wait for event
     */
    waitFor<T = any>(type: string, timeout?: number): Promise<QAntumEvent<T>> {
        return new Promise((resolve, reject) => {
            const timeoutId = timeout ? setTimeout(() => {
                this.off(type, handler);
                reject(new Error(`Timeout waiting for event "${type}"`));
            }, timeout) : null;

            const handler: EventHandler<T> = (event) => {
                if (timeoutId) clearTimeout(timeoutId);
                resolve(event);
            };

            this.once(type, handler);
        });
    }

    private defaultErrorHandler(error: Error, event: QAntumEvent): void {
        console.error(`Error handling event "${event.type}":`, error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getEventBus = (): EventBus => EventBus.getInstance();
// Quick event operations
export const events = {
    on: <T>(type: string, handler: EventHandler<T>) => EventBus.getInstance().on(type, handler),
    once: <T>(type: string, handler: EventHandler<T>) => EventBus.getInstance().once(type, handler),
    off: (type: string, handler?: EventHandler) => EventBus.getInstance().off(type, handler),
    emit: <T>(type: string, payload: T) => EventBus.getInstance().emit(type, payload),
    emitSync: <T>(type: string, payload: T) => EventBus.getInstance().emitSync(type, payload),
    waitFor: <T>(type: string, timeout?: number) => EventBus.getInstance().waitFor<T>(type, timeout),
    history: (type?: string) => EventBus.getInstance().getHistory(type)
};

export default EventBus;
