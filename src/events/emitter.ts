/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM EVENT EMITTER                                                        ║
 * ║   "TypeScript-first event emitter with type safety"                           ║
 * ║                                                                               ║
 * ║   TODO B #42 - Events: Typed emitter                                          ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type EventMap = Record<string, any>;
export type EventKey<T extends EventMap> = string & keyof T;
export type EventReceiver<T> = (payload: T) => void;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPED EMITTER
// ═══════════════════════════════════════════════════════════════════════════════

export class TypedEmitter<Events extends EventMap> {
    private listeners = new Map<keyof Events, Set<EventReceiver<any>>>();
    private onceListeners = new Map<keyof Events, Set<EventReceiver<any>>>();

    /**
     * Add listener
     */
    on<K extends EventKey<Events>>(event: K, listener: EventReceiver<Events[K]>): this {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);
        return this;
    }

    /**
     * Add one-time listener
     */
    once<K extends EventKey<Events>>(event: K, listener: EventReceiver<Events[K]>): this {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, new Set());
        }
        this.onceListeners.get(event)!.add(listener);
        return this;
    }

    /**
     * Remove listener
     */
    off<K extends EventKey<Events>>(event: K, listener: EventReceiver<Events[K]>): this {
        this.listeners.get(event)?.delete(listener);
        this.onceListeners.get(event)?.delete(listener);
        return this;
    }

    /**
     * Remove all listeners for event
     */
    removeAllListeners<K extends EventKey<Events>>(event?: K): this {
        if (event) {
            this.listeners.delete(event);
            this.onceListeners.delete(event);
        } else {
            this.listeners.clear();
            this.onceListeners.clear();
        }
        return this;
    }

    /**
     * Emit event
     */
    emit<K extends EventKey<Events>>(event: K, payload: Events[K]): boolean {
        const regularListeners = this.listeners.get(event);
        const onceListeners = this.onceListeners.get(event);

        let hadListeners = false;

        if (regularListeners?.size) {
            hadListeners = true;
            for (const listener of regularListeners) {
                listener(payload);
            }
        }

        if (onceListeners?.size) {
            hadListeners = true;
            for (const listener of onceListeners) {
                listener(payload);
            }
            this.onceListeners.delete(event);
        }

        return hadListeners;
    }

    /**
     * Emit async
     */
    async emitAsync<K extends EventKey<Events>>(event: K, payload: Events[K]): Promise<void> {
        const regularListeners = this.listeners.get(event);
        const onceListeners = this.onceListeners.get(event);

        const promises: Promise<void>[] = [];

        if (regularListeners) {
            for (const listener of regularListeners) {
                promises.push(Promise.resolve(listener(payload)));
            }
        }

        if (onceListeners) {
            for (const listener of onceListeners) {
                promises.push(Promise.resolve(listener(payload)));
            }
            this.onceListeners.delete(event);
        }

        await Promise.all(promises);
    }

    /**
     * Get listener count
     */
    listenerCount<K extends EventKey<Events>>(event: K): number {
        return (this.listeners.get(event)?.size || 0) + 
               (this.onceListeners.get(event)?.size || 0);
    }

    /**
     * Get registered events
     */
    eventNames(): (keyof Events)[] {
        const events = new Set<keyof Events>();
        for (const key of this.listeners.keys()) events.add(key);
        for (const key of this.onceListeners.keys()) events.add(key);
        return [...events];
    }

    /**
     * Wait for event
     */
    waitFor<K extends EventKey<Events>>(event: K, timeout?: number): Promise<Events[K]> {
        return new Promise((resolve, reject) => {
            const timeoutId = timeout ? setTimeout(() => {
                this.off(event, handler);
                reject(new Error(`Timeout waiting for event "${String(event)}"`));
            }, timeout) : null;

            const handler: EventReceiver<Events[K]> = (payload) => {
                if (timeoutId) clearTimeout(timeoutId);
                resolve(payload);
            };

            this.once(event, handler);
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OBSERVABLE EMITTER
// ═══════════════════════════════════════════════════════════════════════════════

export interface Observer<T> {
    next: (value: T) => void;
    error?: (error: Error) => void;
    complete?: () => void;
}

export interface Subscription {
    unsubscribe: () => void;
}

export class ObservableEmitter<T> {
    private observers = new Set<Observer<T>>();
    private completed = false;
    private lastValue?: T;
    private hasValue = false;

    /**
     * Subscribe to emissions
     */
    subscribe(observer: Observer<T> | ((value: T) => void)): Subscription {
        if (this.completed) {
            if (typeof observer === 'function') {
                return { unsubscribe: () => {} };
            }
            observer.complete?.();
            return { unsubscribe: () => {} };
        }

        const obs: Observer<T> = typeof observer === 'function'
            ? { next: observer }
            : observer;

        this.observers.add(obs);

        // Emit last value to new subscriber (behavior subject style)
        if (this.hasValue && this.lastValue !== undefined) {
            obs.next(this.lastValue);
        }

        return {
            unsubscribe: () => this.observers.delete(obs)
        };
    }

    /**
     * Emit value
     */
    next(value: T): void {
        if (this.completed) return;

        this.lastValue = value;
        this.hasValue = true;

        for (const observer of this.observers) {
            try {
                observer.next(value);
            } catch (error) {
                observer.error?.(error as Error);
            }
        }
    }

    /**
     * Emit error
     */
    error(error: Error): void {
        if (this.completed) return;

        for (const observer of this.observers) {
            observer.error?.(error);
        }
    }

    /**
     * Complete stream
     */
    complete(): void {
        if (this.completed) return;
        this.completed = true;

        for (const observer of this.observers) {
            observer.complete?.();
        }

        this.observers.clear();
    }

    /**
     * Get current value
     */
    getValue(): T | undefined {
        return this.lastValue;
    }

    /**
     * Is completed
     */
    isCompleted(): boolean {
        return this.completed;
    }

    /**
     * Map values
     */
    map<R>(transform: (value: T) => R): ObservableEmitter<R> {
        const mapped = new ObservableEmitter<R>();

        this.subscribe({
            next: (value) => mapped.next(transform(value)),
            error: (err) => mapped.error(err),
            complete: () => mapped.complete()
        });

        return mapped;
    }

    /**
     * Filter values
     */
    filter(predicate: (value: T) => boolean): ObservableEmitter<T> {
        const filtered = new ObservableEmitter<T>();

        this.subscribe({
            next: (value) => {
                if (predicate(value)) {
                    filtered.next(value);
                }
            },
            error: (err) => filtered.error(err),
            complete: () => filtered.complete()
        });

        return filtered;
    }

    /**
     * Take n values
     */
    take(count: number): ObservableEmitter<T> {
        const taken = new ObservableEmitter<T>();
        let remaining = count;

        this.subscribe({
            next: (value) => {
                if (remaining > 0) {
                    remaining--;
                    taken.next(value);
                    if (remaining === 0) {
                        taken.complete();
                    }
                }
            },
            error: (err) => taken.error(err),
            complete: () => taken.complete()
        });

        return taken;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export function createEmitter<Events extends EventMap>(): TypedEmitter<Events> {
    return new TypedEmitter<Events>();
}

export function createObservable<T>(initialValue?: T): ObservableEmitter<T> {
    const observable = new ObservableEmitter<T>();
    if (initialValue !== undefined) {
        observable.next(initialValue);
    }
    return observable;
}

export default TypedEmitter;
