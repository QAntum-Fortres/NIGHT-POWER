/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM FEATURE FLAGS                                                        ║
 * ║   "Dynamic feature gating with A/B testing"                                   ║
 * ║                                                                               ║
 * ║   TODO B #49 - SaaS: Feature Flags                                            ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface FeatureFlag {
    key: string;
    name: string;
    description?: string;
    enabled: boolean;
    defaultValue: any;
    variations?: FlagVariation[];
    rules?: FlagRule[];
    targets?: FlagTarget[];
    percentage?: number;  // For percentage rollout
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface FlagVariation {
    id: string;
    name: string;
    value: any;
    weight?: number;  // For A/B testing
}

export interface FlagRule {
    id: string;
    conditions: FlagCondition[];
    variation: string;  // Variation ID
    priority: number;
}

export interface FlagCondition {
    attribute: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 
              'greater_than' | 'less_than' | 'in' | 'not_in' | 'regex';
    value: any;
}

export interface FlagTarget {
    userId: string;
    variation: string;
}

export interface EvaluationContext {
    userId?: string;
    userAttributes?: Record<string, any>;
    sessionId?: string;
    environment?: string;
}

export interface EvaluationResult {
    key: string;
    value: any;
    variationId?: string;
    reason: 'default' | 'target' | 'rule' | 'percentage' | 'fallback';
    evaluatedAt: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE FLAG SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class FeatureFlagService {
    private static instance: FeatureFlagService;

    private flags: Map<string, FeatureFlag> = new Map();
    private overrides: Map<string, any> = new Map();
    private evaluationCache: Map<string, EvaluationResult> = new Map();
    private listeners: Set<(key: string, value: any) => void> = new Set();

    static getInstance(): FeatureFlagService {
        if (!FeatureFlagService.instance) {
            FeatureFlagService.instance = new FeatureFlagService();
        }
        return FeatureFlagService.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FLAG MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Register a feature flag
     */
    register(flag: FeatureFlag): void {
        this.flags.set(flag.key, flag);
        this.invalidateCache(flag.key);
    }

    /**
     * Register multiple flags
     */
    registerAll(flags: FeatureFlag[]): void {
        for (const flag of flags) {
            this.register(flag);
        }
    }

    /**
     * Update a flag
     */
    update(key: string, updates: Partial<FeatureFlag>): void {
        const existing = this.flags.get(key);
        if (!existing) {
            throw new Error(`Flag not found: ${key}`);
        }

        this.flags.set(key, {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString()
        });

        this.invalidateCache(key);
        this.notifyListeners(key);
    }

    /**
     * Delete a flag
     */
    delete(key: string): boolean {
        const result = this.flags.delete(key);
        this.invalidateCache(key);
        return result;
    }

    /**
     * Get flag definition
     */
    getFlag(key: string): FeatureFlag | undefined {
        return this.flags.get(key);
    }

    /**
     * Get all flags
     */
    getAllFlags(): FeatureFlag[] {
        return [...this.flags.values()];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EVALUATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Evaluate a flag
     */
    evaluate(key: string, context: EvaluationContext = {}): EvaluationResult {
        const cacheKey = this.getCacheKey(key, context);
        const cached = this.evaluationCache.get(cacheKey);
        if (cached) return cached;

        const result = this.doEvaluate(key, context);
        this.evaluationCache.set(cacheKey, result);
        return result;
    }

    /**
     * Get boolean flag value
     */
    isEnabled(key: string, context: EvaluationContext = {}): boolean {
        return Boolean(this.evaluate(key, context).value);
    }

    /**
     * Get string flag value
     */
    getString(key: string, defaultValue: string, context: EvaluationContext = {}): string {
        const result = this.evaluate(key, context);
        return typeof result.value === 'string' ? result.value : defaultValue;
    }

    /**
     * Get number flag value
     */
    getNumber(key: string, defaultValue: number, context: EvaluationContext = {}): number {
        const result = this.evaluate(key, context);
        return typeof result.value === 'number' ? result.value : defaultValue;
    }

    /**
     * Get JSON flag value
     */
    getJSON<T>(key: string, defaultValue: T, context: EvaluationContext = {}): T {
        const result = this.evaluate(key, context);
        return result.value as T ?? defaultValue;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OVERRIDES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Set a local override
     */
    setOverride(key: string, value: any): void {
        this.overrides.set(key, value);
        this.invalidateCache(key);
    }

    /**
     * Remove an override
     */
    removeOverride(key: string): void {
        this.overrides.delete(key);
        this.invalidateCache(key);
    }

    /**
     * Clear all overrides
     */
    clearOverrides(): void {
        this.overrides.clear();
        this.evaluationCache.clear();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // A/B TESTING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get variation for A/B test
     */
    getVariation(key: string, context: EvaluationContext = {}): FlagVariation | null {
        const flag = this.flags.get(key);
        if (!flag?.variations?.length) return null;

        const result = this.evaluate(key, context);
        return flag.variations.find(v => v.id === result.variationId) || null;
    }

    /**
     * Track conversion for A/B test
     */
    trackConversion(key: string, context: EvaluationContext = {}): void {
        const result = this.evaluate(key, context);
        console.log(`[FeatureFlags] Conversion: ${key}, variation: ${result.variationId}`);
        // In real implementation, send to analytics
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LISTENERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Subscribe to flag changes
     */
    subscribe(callback: (key: string, value: any) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE
    // ─────────────────────────────────────────────────────────────────────────

    private doEvaluate(key: string, context: EvaluationContext): EvaluationResult {
        // Check override first
        if (this.overrides.has(key)) {
            return {
                key,
                value: this.overrides.get(key),
                reason: 'fallback',
                evaluatedAt: Date.now()
            };
        }

        const flag = this.flags.get(key);
        
        // Flag not found
        if (!flag) {
            return {
                key,
                value: undefined,
                reason: 'fallback',
                evaluatedAt: Date.now()
            };
        }

        // Flag disabled
        if (!flag.enabled) {
            return {
                key,
                value: flag.defaultValue,
                reason: 'default',
                evaluatedAt: Date.now()
            };
        }

        // Check user targets
        if (context.userId && flag.targets) {
            const target = flag.targets.find(t => t.userId === context.userId);
            if (target) {
                const variation = flag.variations?.find(v => v.id === target.variation);
                return {
                    key,
                    value: variation?.value ?? flag.defaultValue,
                    variationId: target.variation,
                    reason: 'target',
                    evaluatedAt: Date.now()
                };
            }
        }

        // Check rules
        if (flag.rules && context.userAttributes) {
            const sortedRules = [...flag.rules].sort((a, b) => a.priority - b.priority);
            
            for (const rule of sortedRules) {
                if (this.evaluateRule(rule, context)) {
                    const variation = flag.variations?.find(v => v.id === rule.variation);
                    return {
                        key,
                        value: variation?.value ?? flag.defaultValue,
                        variationId: rule.variation,
                        reason: 'rule',
                        evaluatedAt: Date.now()
                    };
                }
            }
        }

        // Percentage rollout
        if (flag.percentage !== undefined && context.userId) {
            const hash = this.hashUserId(context.userId + key);
            const bucket = hash % 100;
            
            if (bucket < flag.percentage) {
                // Select variation by weight
                const variation = this.selectVariation(flag.variations || [], context.userId, key);
                return {
                    key,
                    value: variation?.value ?? true,
                    variationId: variation?.id,
                    reason: 'percentage',
                    evaluatedAt: Date.now()
                };
            }
        }

        // Default value
        return {
            key,
            value: flag.defaultValue,
            reason: 'default',
            evaluatedAt: Date.now()
        };
    }

    private evaluateRule(rule: FlagRule, context: EvaluationContext): boolean {
        for (const condition of rule.conditions) {
            const value = context.userAttributes?.[condition.attribute];
            if (!this.evaluateCondition(condition, value)) {
                return false;
            }
        }
        return true;
    }

    private evaluateCondition(condition: FlagCondition, value: any): boolean {
        const { operator, value: conditionValue } = condition;

        switch (operator) {
            case 'equals':
                return value === conditionValue;
            case 'not_equals':
                return value !== conditionValue;
            case 'contains':
                return String(value).includes(String(conditionValue));
            case 'starts_with':
                return String(value).startsWith(String(conditionValue));
            case 'ends_with':
                return String(value).endsWith(String(conditionValue));
            case 'greater_than':
                return Number(value) > Number(conditionValue);
            case 'less_than':
                return Number(value) < Number(conditionValue);
            case 'in':
                return Array.isArray(conditionValue) && conditionValue.includes(value);
            case 'not_in':
                return Array.isArray(conditionValue) && !conditionValue.includes(value);
            case 'regex':
                return new RegExp(String(conditionValue)).test(String(value));
            default:
                return false;
        }
    }

    private selectVariation(
        variations: FlagVariation[],
        userId: string,
        flagKey: string
    ): FlagVariation | undefined {
        if (variations.length === 0) return undefined;
        if (variations.length === 1) return variations[0];

        const totalWeight = variations.reduce((sum, v) => sum + (v.weight || 1), 0);
        const hash = this.hashUserId(userId + flagKey + 'variation');
        const bucket = hash % totalWeight;

        let cumulative = 0;
        for (const variation of variations) {
            cumulative += variation.weight || 1;
            if (bucket < cumulative) {
                return variation;
            }
        }

        return variations[0];
    }

    private hashUserId(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    private getCacheKey(key: string, context: EvaluationContext): string {
        return `${key}:${context.userId || 'anon'}:${context.environment || 'default'}`;
    }

    private invalidateCache(key: string): void {
        for (const cacheKey of this.evaluationCache.keys()) {
            if (cacheKey.startsWith(key + ':')) {
                this.evaluationCache.delete(cacheKey);
            }
        }
    }

    private notifyListeners(key: string): void {
        const flag = this.flags.get(key);
        for (const listener of this.listeners) {
            try {
                listener(key, flag?.defaultValue);
            } catch (error) {
                console.error('[FeatureFlags] Listener error:', error);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @Feature - Guard method with feature flag
 */
export function Feature(flagKey: string, fallback?: any): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;

        descriptor.value = function (...args: any[]) {
            const flags = FeatureFlagService.getInstance();
            
            if (!flags.isEnabled(flagKey)) {
                if (fallback !== undefined) {
                    return typeof fallback === 'function' ? fallback() : fallback;
                }
                throw new Error(`Feature '${flagKey}' is disabled`);
            }

            return original.apply(this, args);
        };

        return descriptor;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════════════════════════════

export function createFlag(
    key: string,
    defaultValue: any,
    options: Partial<FeatureFlag> = {}
): FeatureFlag {
    return {
        key,
        name: options.name || key,
        enabled: options.enabled ?? true,
        defaultValue,
        ...options,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getFeatureFlags = (): FeatureFlagService => FeatureFlagService.getInstance();

export default FeatureFlagService;
