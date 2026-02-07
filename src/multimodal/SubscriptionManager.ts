import LocalPaymentBridge from '../../../VeritasScanMobile/src/logic/LocalPaymentBridge';

/**
 * BIG O: O(1) - Singleton access to subscription state
 * SubscriptionManager: Core logic for Local Payments.
 * Replaces RevenueCat with our custom bridge.
 */
export class SubscriptionManager {
    private static instance: SubscriptionManager;
    private isInitialized: boolean = false;

    private constructor() { }

    static getInstance(): SubscriptionManager {
        if (!SubscriptionManager.instance) {
            SubscriptionManager.instance = new SubscriptionManager();
        }
        return SubscriptionManager.instance;
    }

    /**
     * Initialize Local Payment Bridge
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            await LocalPaymentBridge.initialize();
            this.isInitialized = true;
            console.log('✅ SubscriptionManager: Initialized with LocalPaymentBridge');
        } catch (error) {
            console.error('❌ SubscriptionManager Init Error:', error);
        }
    }

    /**
     * Check if user has active subscription
     */
    async updateSubscriptionStatus(): Promise<boolean> {
        return LocalPaymentBridge.getPremiumStatus();
    }

    /**
     * Get Premium Status (Sync)
     */
    isPremium(): boolean {
        return LocalPaymentBridge.getPremiumStatus();
    }

    /**
     * Mock Offerings for UI Compatibility
     */
    async getOfferings() {
        return {
            monthly: { identifier: 'premium_monthly', product: { price: 9.99, currencyCode: 'USD' } },
            annual: { identifier: 'premium_annual', product: { price: 99.99, currencyCode: 'USD' } }
        };
    }

    /**
     * Execute Purchase via Bridge
     */
    async purchasePackage(pkg: any): Promise<boolean> {
        return LocalPaymentBridge.processPayment({
            method: 'stripe', // Default to stripe for now
            planId: pkg.identifier,
            amount: pkg.product.price
        });
    }
}
