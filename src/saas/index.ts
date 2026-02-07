/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM SAAS MODULE                                                          ║
 * ║   "Telemetry, Feature Flags & Subscriptions"                                  ║
 * ║                                                                               ║
 * ║   TODO B #48-50 - SaaS Complete                                               ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TELEMETRY
// ═══════════════════════════════════════════════════════════════════════════════

export {
    TelemetryService,
    getTelemetry,
    Track,
    Timed,
    type TelemetryEvent,
    type TelemetryConfig,
    type MetricAggregation,
    type TelemetrySummary
} from './telemetry';

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE FLAGS
// ═══════════════════════════════════════════════════════════════════════════════

export {
    FeatureFlagService,
    getFeatureFlags,
    createFlag,
    Feature,
    type FeatureFlag,
    type FlagVariation,
    type FlagRule,
    type FlagCondition,
    type EvaluationContext,
    type EvaluationResult
} from './feature-flags';

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION
// ═══════════════════════════════════════════════════════════════════════════════

export {
    SubscriptionService,
    getSubscriptions,
    PLANS,
    type Plan,
    type PlanTier,
    type PlanFeature,
    type PlanLimits,
    type Subscription,
    type SubscriptionStatus,
    type BillingCycle,
    type Usage,
    type Invoice,
    type InvoiceItem
} from './subscription';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED SAAS FACADE
// ═══════════════════════════════════════════════════════════════════════════════

import { TelemetryService } from './telemetry';
import { FeatureFlagService, EvaluationContext } from './feature-flags';
import { SubscriptionService, PlanTier, BillingCycle } from './subscription';

export class SaaS {
    readonly telemetry: TelemetryService;
    readonly features: FeatureFlagService;
    readonly subscriptions: SubscriptionService;

    constructor() {
        this.telemetry = TelemetryService.getInstance();
        this.features = FeatureFlagService.getInstance();
        this.subscriptions = SubscriptionService.getInstance();
    }

    /**
     * Check if feature is enabled for user
     */
    isFeatureEnabled(
        featureKey: string,
        userId?: string,
        attributes?: Record<string, any>
    ): boolean {
        return this.features.isEnabled(featureKey, { userId, userAttributes: attributes });
    }

    /**
     * Check if user can perform action within limits
     */
    canPerformAction(
        subscriptionId: string,
        action: 'projects' | 'users' | 'testsPerMonth' | 'apiCallsPerDay'
    ): boolean {
        const result = this.subscriptions.checkLimit(subscriptionId, action);
        return result.allowed;
    }

    /**
     * Track feature usage
     */
    trackUsage(
        subscriptionId: string,
        metric: 'projects' | 'users' | 'tests' | 'storageBytes' | 'apiCalls',
        amount: number = 1
    ): void {
        this.subscriptions.recordUsage(subscriptionId, metric, amount);
        this.telemetry.track('usage', 'metering', { metric, amount, subscriptionId });
    }

    /**
     * Get user tier
     */
    getUserTier(subscriptionId: string): PlanTier {
        const sub = this.subscriptions.get(subscriptionId);
        return sub?.tier || 'free';
    }

    /**
     * Quick subscription
     */
    subscribe(
        userId: string,
        tier: PlanTier,
        billingCycle: BillingCycle = 'monthly'
    ): string {
        const plan = this.subscriptions.getPlanByTier(tier);
        if (!plan) throw new Error(`Plan not found for tier: ${tier}`);
        
        const subscription = this.subscriptions.create(userId, plan.id, billingCycle);
        this.telemetry.track('subscription_created', 'billing', {
            tier,
            billingCycle,
            planId: plan.id
        });
        
        return subscription.id;
    }
}

// Singleton
let saasInstance: SaaS | null = null;

export function getSaaS(): SaaS {
    if (!saasInstance) {
        saasInstance = new SaaS();
    }
    return saasInstance;
}

export default SaaS;
