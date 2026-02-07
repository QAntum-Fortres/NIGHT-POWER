// [PURIFIED_BY_AETERNA: 156cdd53-770a-4870-9d7d-606acad67e28]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 6665cccd-e87d-4b45-ab42-6cce20ec6b43]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 5bc600fe-2743-4ada-80ed-d61fd7a36c9c]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 5bc600fe-2743-4ada-80ed-d61fd7a36c9c]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: c582c1b4-1268-472b-aa00-2ca221968896]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: dfaffeed-eb71-4402-b3c5-7fc1320d7a9c]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: dfaffeed-eb71-4402-b3c5-7fc1320d7a9c]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 59951bfc-d989-444e-bdff-df851d77470b]
// Suggestion: Review and entrench stable logic.
/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM EVENT BUS                                                            ║
 * ║   "Event-Driven архитектура за decoupling"                                    ║
 * ║                                                                               ║
 * ║   TODO B #5 - Event-Driven Decoupling                                         ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ТИПОВЕ
// ═══════════════════════════════════════════════════════════════════════════════

export type EventHandler<T = unknown> = (payload: T, meta: EventMeta) => void | Promise<void>;
export type EventFilter<T = unknown> = (payload: T) => boolean;

export interface EventMeta {
  eventId: string;
  timestamp: Date;
  source: string;
  correlationId?: string;
  causationId?: string;
}

export interface EventSubscription {
  id: string;
  event: string;
  handler: EventHandler;
  filter?: EventFilter;
  priority: number;
  once: boolean;
}

export interface EventBusConfig {
  maxListeners: number;
  enableLogging: boolean;
  asyncHandlers: boolean;
  retryOnError: boolean;
  retryAttempts: number;
}

export interface EventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  avgProcessingTime: number;
  errors: number;
  lastEvent?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDEFINED EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const QAntumEvents = {
  // System Events
  SYSTEM_READY: 'system:ready',
  SYSTEM_SHUTDOWN: 'system:shutdown',
  SYSTEM_ERROR: 'system:error',

  // Test Events
  TEST_STARTED: 'test:started',
  TEST_COMPLETED: 'test:completed',
  TEST_FAILED: 'test:failed',
  TEST_SKIPPED: 'test:skipped',

  // Suite Events
  SUITE_STARTED: 'suite:started',
  SUITE_COMPLETED: 'suite:completed',

  // Oracle Events
  ORACLE_QUERY: 'oracle:query',
  ORACLE_RESPONSE: 'oracle:response',
  ORACLE_ERROR: 'oracle:error',

  // Learning Events
  LEARNING_PATTERN_FOUND: 'learning:pattern:found',
  LEARNING_RULE_CREATED: 'learning:rule:created',
  LEARNING_MEMORY_STORED: 'learning:memory:stored',

  // Cognition Events
  COGNITION_THOUGHT_START: 'cognition:thought:start',
  COGNITION_THOUGHT_END: 'cognition:thought:end',
  COGNITION_CRITIQUE: 'cognition:critique',
  COGNITION_INFERENCE: 'cognition:inference',

  // Report Events
  REPORT_GENERATED: 'report:generated',
  REPORT_EXPORTED: 'report:exported',

  // Plugin Events
  PLUGIN_LOADED: 'plugin:loaded',
  PLUGIN_UNLOADED: 'plugin:unloaded',
  PLUGIN_ERROR: 'plugin:error',
} as const;

export type QAntumEventType = (typeof QAntumEvents)[keyof typeof QAntumEvents];

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT BUS
// ═══════════════════════════════════════════════════════════════════════════════

export class EventBus {
  private static instance: EventBus;

  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private config: EventBusConfig;
  private stats: EventStats;
  private history: { event: string; timestamp: Date; payload: unknown }[] = [];
  private maxHistorySize = 100;

  private constructor(config: Partial<EventBusConfig> = {}) {
    this.config = {
      maxListeners: 100,
      enableLogging: true,
      asyncHandlers: true,
      retryOnError: false,
      retryAttempts: 3,
      ...config,
    };

    this.stats = {
      totalEvents: 0,
      eventsByType: {},
      avgProcessingTime: 0,
      errors: 0,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SINGLETON
  // ─────────────────────────────────────────────────────────────────────────

  static getInstance(config?: Partial<EventBusConfig>): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus(config);
    }
    return EventBus.instance;
  }

  static resetInstance(): void {
    EventBus.instance = undefined as any;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUBSCRIBE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Абонира се за събитие
   */
  on<T = unknown>(
    event: string,
    handler: EventHandler<T>,
    options: { filter?: EventFilter<T>; priority?: number } = {}
  ): () => void {
    const subscription: EventSubscription = {
      id: this.generateId(),
      event,
      handler: handler as EventHandler,
      filter: options.filter as EventFilter | undefined,
      priority: options.priority ?? 0,
      once: false,
    };

    this.addSubscription(event, subscription);
    this.log(`[EventBus] Subscribed to "${event}"`);

    // Return unsubscribe function
    return () => this.off(event, subscription.id);
  }

  /**
   * Абонира се за еднократно събитие
   */
  once<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    const subscription: EventSubscription = {
      id: this.generateId(),
      event,
      handler: handler as EventHandler,
      priority: 0,
      once: true,
    };

    this.addSubscription(event, subscription);
    return () => this.off(event, subscription.id);
  }

  /**
   * Отписване от събитие
   */
  off(event: string, subscriptionId?: string): void {
    if (subscriptionId) {
      const subs = this.subscriptions.get(event);
      if (subs) {
        const idx = subs.findIndex((s) => s.id === subscriptionId);
        if (idx >= 0) {
          subs.splice(idx, 1);
        }
      }
    } else {
      this.subscriptions.delete(event);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EMIT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Emit събитие
   */
  async emit<T = unknown>(
    event: string,
    payload: T,
    options: { source?: string; correlationId?: string; causationId?: string } = {}
  ): Promise<void> {
    const startTime = Date.now();

    const meta: EventMeta = {
      eventId: this.generateId(),
      timestamp: new Date(),
      source: options.source || 'unknown',
      correlationId: options.correlationId,
      causationId: options.causationId,
    };

    this.log(`[EventBus] Emitting "${event}"`);

    // Update stats
    this.stats.totalEvents++;
    this.stats.eventsByType[event] = (this.stats.eventsByType[event] || 0) + 1;
    this.stats.lastEvent = event;

    // Add to history
    this.addToHistory(event, payload);

    // Get subscribers sorted by priority
    const subs = this.subscriptions.get(event) || [];
    const wildcardSubs = this.subscriptions.get('*') || [];
    const allSubs = [...subs, ...wildcardSubs].sort((a, b) => b.priority - a.priority);

    const toRemove: string[] = [];

    for (const sub of allSubs) {
      // Apply filter if exists
      if (sub.filter && !sub.filter(payload)) {
        continue;
      }

      try {
        if (this.config.asyncHandlers) {
          await sub.handler(payload, meta);
        } else {
          sub.handler(payload, meta);
        }
      } catch (error) {
        this.stats.errors++;
        console.error(`[EventBus] Handler error for "${event}":`, error);

        if (this.config.retryOnError) {
          await this.retryHandler(sub, payload, meta);
        }
      }

      if (sub.once) {
        toRemove.push(sub.id);
      }
    }

    // Remove once subscriptions
    for (const id of toRemove) {
      this.off(event, id);
    }

    // Update avg processing time
    const duration = Date.now() - startTime;
    this.stats.avgProcessingTime =
      (this.stats.avgProcessingTime * (this.stats.totalEvents - 1) + duration) /
      this.stats.totalEvents;
  }

  /**
   * Emit без await (fire-and-forget)
   */
  fire<T = unknown>(event: string, payload: T, source?: string): void {
    this.emit(event, payload, { source }).catch((err) => {
      console.error('[EventBus] Fire error:', err);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Изчаква събитие
   */
  waitFor<T = unknown>(event: string, timeout: number = 5000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for event "${event}"`));
      }, timeout);

      this.once<T>(event, (payload) => {
        clearTimeout(timer);
        resolve(payload);
      });
    });
  }

  /**
   * Проверява дали има listeners
   */
  hasListeners(event: string): boolean {
    return (this.subscriptions.get(event)?.length || 0) > 0;
  }

  /**
   * Брой listeners за събитие
   */
  listenerCount(event?: string): number {
    if (event) {
      return this.subscriptions.get(event)?.length || 0;
    }
    let total = 0;
    for (const subs of this.subscriptions.values()) {
      total += subs.length;
    }
    return total;
  }

  /**
   * Списък на всички събития с listeners
   */
  eventNames(): string[] {
    return [...this.subscriptions.keys()];
  }

  /**
   * Изчистване на всички subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
    this.history = [];
  }

  /**
   * Статистики
   */
  getStats(): EventStats {
    return { ...this.stats };
  }

  /**
   * История на събитията
   */
  getHistory(): typeof this.history {
    return [...this.history];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE
  // ─────────────────────────────────────────────────────────────────────────

  private addSubscription(event: string, subscription: EventSubscription): void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }

    const subs = this.subscriptions.get(event)!;

    if (subs.length >= this.config.maxListeners) {
      console.warn(`[EventBus] Max listeners (${this.config.maxListeners}) reached for "${event}"`);
    }

    subs.push(subscription);
  }

  private async retryHandler(
    sub: EventSubscription,
    payload: unknown,
    meta: EventMeta
  ): Promise<void> {
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        await new Promise((resolve) => setTimeout(resolve, attempt * 100));
        await sub.handler(payload, meta);
        return;
      } catch (error) {
        console.error(`[EventBus] Retry ${attempt}/${this.config.retryAttempts} failed`);
      }
    }
  }

  private addToHistory(event: string, payload: unknown): void {
    this.history.push({ event, timestamp: new Date(), payload });
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(message);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Decorator за автоматичен emit при извикване на метод
 */
export function EmitsEvent(eventName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      EventBus.getInstance().fire(eventName, {
        method: propertyKey,
        args,
        result,
      });
      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator за автоматичен subscribe при инстанциране
 */
export function OnEvent(eventName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!target.constructor.__eventSubscriptions) {
      target.constructor.__eventSubscriptions = [];
    }

    target.constructor.__eventSubscriptions.push({
      event: eventName,
      method: propertyKey,
    });

    return descriptor;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getEventBus = (config?: Partial<EventBusConfig>): EventBus => {
  return EventBus.getInstance(config);
};

export default EventBus;
