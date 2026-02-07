/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM SUBSCRIPTION MANAGEMENT                                              ║
 * ║   "Multi-tier plans with metering and billing"                                ║
 * ║                                                                               ║
 * ║   TODO B #50 - SaaS: Subscription & Billing                                   ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';

export interface Plan {
    id: string;
    tier: PlanTier;
    name: string;
    description: string;
    price: {
        monthly: number;
        yearly: number;
    };
    features: PlanFeature[];
    limits: PlanLimits;
    popular?: boolean;
}

export interface PlanFeature {
    key: string;
    name: string;
    included: boolean;
    limit?: number;
    description?: string;
}

export interface PlanLimits {
    projects: number;
    users: number;
    testsPerMonth: number;
    storageGB: number;
    apiCallsPerDay: number;
    retentionDays: number;
}

export interface Subscription {
    id: string;
    userId: string;
    planId: string;
    tier: PlanTier;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    trialEndsAt?: string;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Usage {
    subscriptionId: string;
    period: string;  // YYYY-MM
    metrics: {
        projects: number;
        users: number;
        tests: number;
        storageBytes: number;
        apiCalls: number;
    };
    limits: PlanLimits;
    percentages: {
        projects: number;
        users: number;
        tests: number;
        storage: number;
        apiCalls: number;
    };
}

export interface Invoice {
    id: string;
    subscriptionId: string;
    amount: number;
    currency: string;
    status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
    periodStart: string;
    periodEnd: string;
    items: InvoiceItem[];
    createdAt: string;
    paidAt?: string;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitAmount: number;
    amount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT PLANS
// ═══════════════════════════════════════════════════════════════════════════════

export const PLANS: Plan[] = [
    {
        id: 'plan_free',
        tier: 'free',
        name: 'Free',
        description: 'Perfect for trying out QAntum',
        price: { monthly: 0, yearly: 0 },
        features: [
            { key: 'projects', name: 'Projects', included: true, limit: 1 },
            { key: 'tests', name: 'Tests per month', included: true, limit: 100 },
            { key: 'history', name: 'Test history', included: true, limit: 7 },
            { key: 'support', name: 'Community support', included: true },
            { key: 'api', name: 'API access', included: false }
        ],
        limits: {
            projects: 1,
            users: 1,
            testsPerMonth: 100,
            storageGB: 1,
            apiCallsPerDay: 100,
            retentionDays: 7
        }
    },
    {
        id: 'plan_starter',
        tier: 'starter',
        name: 'Starter',
        description: 'For small teams getting started',
        price: { monthly: 29, yearly: 290 },
        features: [
            { key: 'projects', name: 'Projects', included: true, limit: 5 },
            { key: 'tests', name: 'Tests per month', included: true, limit: 1000 },
            { key: 'history', name: 'Test history', included: true, limit: 30 },
            { key: 'support', name: 'Email support', included: true },
            { key: 'api', name: 'API access', included: true }
        ],
        limits: {
            projects: 5,
            users: 3,
            testsPerMonth: 1000,
            storageGB: 5,
            apiCallsPerDay: 1000,
            retentionDays: 30
        }
    },
    {
        id: 'plan_professional',
        tier: 'professional',
        name: 'Professional',
        description: 'For growing teams',
        price: { monthly: 99, yearly: 990 },
        popular: true,
        features: [
            { key: 'projects', name: 'Projects', included: true, limit: 20 },
            { key: 'tests', name: 'Tests per month', included: true, limit: 10000 },
            { key: 'history', name: 'Test history', included: true, limit: 90 },
            { key: 'support', name: 'Priority support', included: true },
            { key: 'api', name: 'API access', included: true },
            { key: 'sso', name: 'SSO', included: true },
            { key: 'analytics', name: 'Advanced analytics', included: true }
        ],
        limits: {
            projects: 20,
            users: 10,
            testsPerMonth: 10000,
            storageGB: 25,
            apiCallsPerDay: 10000,
            retentionDays: 90
        }
    },
    {
        id: 'plan_enterprise',
        tier: 'enterprise',
        name: 'Enterprise',
        description: 'For large organizations',
        price: { monthly: 499, yearly: 4990 },
        features: [
            { key: 'projects', name: 'Unlimited projects', included: true },
            { key: 'tests', name: 'Unlimited tests', included: true },
            { key: 'history', name: 'Unlimited history', included: true },
            { key: 'support', name: 'Dedicated support', included: true },
            { key: 'api', name: 'API access', included: true },
            { key: 'sso', name: 'SSO + SCIM', included: true },
            { key: 'analytics', name: 'Custom analytics', included: true },
            { key: 'sla', name: '99.9% SLA', included: true },
            { key: 'audit', name: 'Audit logs', included: true }
        ],
        limits: {
            projects: -1,  // Unlimited
            users: -1,
            testsPerMonth: -1,
            storageGB: 1000,
            apiCallsPerDay: -1,
            retentionDays: 365
        }
    }
];

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class SubscriptionService {
    private static instance: SubscriptionService;

    private subscriptions: Map<string, Subscription> = new Map();
    private usage: Map<string, Usage> = new Map();
    private invoices: Map<string, Invoice[]> = new Map();
    private plans: Map<string, Plan> = new Map();

    private constructor() {
        // Register default plans
        for (const plan of PLANS) {
            this.plans.set(plan.id, plan);
        }
    }

    static getInstance(): SubscriptionService {
        if (!SubscriptionService.instance) {
            SubscriptionService.instance = new SubscriptionService();
        }
        return SubscriptionService.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PLANS
    // ─────────────────────────────────────────────────────────────────────────

    getPlan(planId: string): Plan | undefined {
        return this.plans.get(planId);
    }

    getPlanByTier(tier: PlanTier): Plan | undefined {
        for (const plan of this.plans.values()) {
            if (plan.tier === tier) return plan;
        }
        return undefined;
    }

    getAllPlans(): Plan[] {
        return [...this.plans.values()];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUBSCRIPTIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create a subscription
     */
    create(
        userId: string,
        planId: string,
        billingCycle: BillingCycle = 'monthly',
        trial: boolean = false
    ): Subscription {
        const plan = this.plans.get(planId);
        if (!plan) {
            throw new Error(`Plan not found: ${planId}`);
        }

        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

        const subscription: Subscription = {
            id: `sub_${Date.now()}`,
            userId,
            planId,
            tier: plan.tier,
            status: trial ? 'trialing' : 'active',
            billingCycle,
            currentPeriodStart: now.toISOString(),
            currentPeriodEnd: periodEnd.toISOString(),
            trialEndsAt: trial 
                ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                : undefined,
            cancelAtPeriodEnd: false,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };

        this.subscriptions.set(subscription.id, subscription);
        this.initializeUsage(subscription);

        return subscription;
    }

    /**
     * Get subscription by ID
     */
    get(subscriptionId: string): Subscription | undefined {
        return this.subscriptions.get(subscriptionId);
    }

    /**
     * Get subscription by user ID
     */
    getByUser(userId: string): Subscription | undefined {
        for (const sub of this.subscriptions.values()) {
            if (sub.userId === userId) return sub;
        }
        return undefined;
    }

    /**
     * Upgrade subscription
     */
    upgrade(subscriptionId: string, newPlanId: string): Subscription {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            throw new Error(`Subscription not found: ${subscriptionId}`);
        }

        const newPlan = this.plans.get(newPlanId);
        if (!newPlan) {
            throw new Error(`Plan not found: ${newPlanId}`);
        }

        const currentPlan = this.plans.get(subscription.planId);
        if (currentPlan && PLANS.indexOf(newPlan) <= PLANS.indexOf(currentPlan)) {
            throw new Error('Can only upgrade to a higher tier');
        }

        subscription.planId = newPlanId;
        subscription.tier = newPlan.tier;
        subscription.updatedAt = new Date().toISOString();

        return subscription;
    }

    /**
     * Downgrade subscription (at period end)
     */
    downgrade(subscriptionId: string, newPlanId: string): Subscription {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            throw new Error(`Subscription not found: ${subscriptionId}`);
        }

        // Schedule downgrade for end of period
        (subscription as any).scheduledPlanId = newPlanId;
        subscription.updatedAt = new Date().toISOString();

        return subscription;
    }

    /**
     * Cancel subscription
     */
    cancel(subscriptionId: string, immediate: boolean = false): Subscription {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            throw new Error(`Subscription not found: ${subscriptionId}`);
        }

        if (immediate) {
            subscription.status = 'canceled';
        } else {
            subscription.cancelAtPeriodEnd = true;
        }

        subscription.updatedAt = new Date().toISOString();
        return subscription;
    }

    /**
     * Resume subscription
     */
    resume(subscriptionId: string): Subscription {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            throw new Error(`Subscription not found: ${subscriptionId}`);
        }

        subscription.cancelAtPeriodEnd = false;
        subscription.status = 'active';
        subscription.updatedAt = new Date().toISOString();

        return subscription;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // USAGE & METERING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get current usage
     */
    getUsage(subscriptionId: string): Usage | undefined {
        return this.usage.get(subscriptionId);
    }

    /**
     * Record usage
     */
    recordUsage(
        subscriptionId: string,
        metric: keyof Usage['metrics'],
        amount: number = 1
    ): void {
        const usage = this.usage.get(subscriptionId);
        if (!usage) return;

        usage.metrics[metric] += amount;
        this.updatePercentages(usage);
    }

    /**
     * Check if within limits
     */
    checkLimit(subscriptionId: string, metric: keyof PlanLimits): {
        allowed: boolean;
        current: number;
        limit: number;
        percentage: number;
    } {
        const usage = this.usage.get(subscriptionId);
        if (!usage) {
            return { allowed: false, current: 0, limit: 0, percentage: 0 };
        }

        const limit = usage.limits[metric];
        if (limit === -1) {
            // Unlimited
            return { allowed: true, current: 0, limit: -1, percentage: 0 };
        }

        const current = this.getMetricValue(usage, metric);
        const percentage = (current / limit) * 100;

        return {
            allowed: current < limit,
            current,
            limit,
            percentage
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INVOICES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get invoices for subscription
     */
    getInvoices(subscriptionId: string): Invoice[] {
        return this.invoices.get(subscriptionId) || [];
    }

    /**
     * Generate invoice
     */
    generateInvoice(subscriptionId: string): Invoice {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            throw new Error(`Subscription not found: ${subscriptionId}`);
        }

        const plan = this.plans.get(subscription.planId);
        if (!plan) {
            throw new Error(`Plan not found: ${subscription.planId}`);
        }

        const price = subscription.billingCycle === 'yearly' 
            ? plan.price.yearly 
            : plan.price.monthly;

        const invoice: Invoice = {
            id: `inv_${Date.now()}`,
            subscriptionId,
            amount: price * 100,  // In cents
            currency: 'USD',
            status: 'open',
            periodStart: subscription.currentPeriodStart,
            periodEnd: subscription.currentPeriodEnd,
            items: [{
                description: `${plan.name} - ${subscription.billingCycle}`,
                quantity: 1,
                unitAmount: price * 100,
                amount: price * 100
            }],
            createdAt: new Date().toISOString()
        };

        const existing = this.invoices.get(subscriptionId) || [];
        existing.push(invoice);
        this.invoices.set(subscriptionId, existing);

        return invoice;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Check if user has feature
     */
    hasFeature(subscriptionId: string, featureKey: string): boolean {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) return false;

        const plan = this.plans.get(subscription.planId);
        if (!plan) return false;

        const feature = plan.features.find(f => f.key === featureKey);
        return feature?.included ?? false;
    }

    /**
     * Get feature limit
     */
    getFeatureLimit(subscriptionId: string, featureKey: string): number {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) return 0;

        const plan = this.plans.get(subscription.planId);
        if (!plan) return 0;

        const feature = plan.features.find(f => f.key === featureKey);
        return feature?.limit ?? 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE
    // ─────────────────────────────────────────────────────────────────────────

    private initializeUsage(subscription: Subscription): void {
        const plan = this.plans.get(subscription.planId);
        if (!plan) return;

        const now = new Date();
        const usage: Usage = {
            subscriptionId: subscription.id,
            period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
            metrics: {
                projects: 0,
                users: 0,
                tests: 0,
                storageBytes: 0,
                apiCalls: 0
            },
            limits: plan.limits,
            percentages: {
                projects: 0,
                users: 0,
                tests: 0,
                storage: 0,
                apiCalls: 0
            }
        };

        this.usage.set(subscription.id, usage);
    }

    private updatePercentages(usage: Usage): void {
        const { metrics, limits } = usage;
        
        usage.percentages = {
            projects: limits.projects === -1 ? 0 : (metrics.projects / limits.projects) * 100,
            users: limits.users === -1 ? 0 : (metrics.users / limits.users) * 100,
            tests: limits.testsPerMonth === -1 ? 0 : (metrics.tests / limits.testsPerMonth) * 100,
            storage: limits.storageGB === -1 ? 0 : (metrics.storageBytes / (limits.storageGB * 1024 * 1024 * 1024)) * 100,
            apiCalls: limits.apiCallsPerDay === -1 ? 0 : (metrics.apiCalls / limits.apiCallsPerDay) * 100
        };
    }

    private getMetricValue(usage: Usage, metric: keyof PlanLimits): number {
        switch (metric) {
            case 'projects': return usage.metrics.projects;
            case 'users': return usage.metrics.users;
            case 'testsPerMonth': return usage.metrics.tests;
            case 'storageGB': return usage.metrics.storageBytes / (1024 * 1024 * 1024);
            case 'apiCallsPerDay': return usage.metrics.apiCalls;
            case 'retentionDays': return 0;
            default: return 0;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getSubscriptions = (): SubscriptionService => SubscriptionService.getInstance();

export default SubscriptionService;
