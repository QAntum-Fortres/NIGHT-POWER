/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                               ║
 * ║                    VERITAS SDK - COMMERCIALIZATION ENGINE                                     ║
 * ║              "Turn Truth into Revenue"                                                        ║
 * ║                                                                                               ║
 * ║   © 2025-2026 Mister Mind | Dimitar Prodromov                                                ║
 * ║                                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// LICENSE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type LicenseType = 
    | 'VERITAS-SDK-FREE'      // Free tier - 50 files, 500 symbols
    | 'VERITAS-SDK-PRO'       // Pro tier - unlimited, all features
    | 'VERITAS-SDK-ENTERPRISE' // Enterprise - custom terms
    | 'TRIAL';                 // 14-day trial

export interface LicenseTier {
    type: LicenseType;
    name: string;
    price: {
        monthly: number;
        yearly: number;
    };
    features: string[];
    limits: {
        maxFiles: number;
        maxSymbols: number;
        maxProjects: number;
    };
    stripePriceId?: {
        monthly: string;
        yearly: string;
    };
}

export interface GeneratedLicense {
    key: string;
    type: LicenseType;
    email: string;
    createdAt: Date;
    expiresAt: Date;
    metadata: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LICENSE TIERS
// ═══════════════════════════════════════════════════════════════════════════════

export const VERITAS_LICENSE_TIERS: Record<LicenseType, LicenseTier> = {
    'VERITAS-SDK-FREE': {
        type: 'VERITAS-SDK-FREE',
        name: 'Veritas Free',
        price: { monthly: 0, yearly: 0 },
        features: [
            'Codebase scanning',
            'Symbol verification',
            '50 files max',
            '500 symbols max',
            'Community support'
        ],
        limits: {
            maxFiles: 50,
            maxSymbols: 500,
            maxProjects: 1
        }
    },

    'VERITAS-SDK-PRO': {
        type: 'VERITAS-SDK-PRO',
        name: 'Veritas Pro',
        price: { monthly: 29, yearly: 290 },
        features: [
            'Unlimited files',
            'Unlimited symbols',
            'AI code validation',
            'Context generation',
            'Type generation',
            'Registry export/import',
            'Neural mapping',
            'Priority support',
            'Slack integration',
            'CI/CD integration'
        ],
        limits: {
            maxFiles: Infinity,
            maxSymbols: Infinity,
            maxProjects: 10
        },
        stripePriceId: {
            monthly: 'price_veritas_pro_monthly',
            yearly: 'price_veritas_pro_yearly'
        }
    },

    'VERITAS-SDK-ENTERPRISE': {
        type: 'VERITAS-SDK-ENTERPRISE',
        name: 'Veritas Enterprise',
        price: { monthly: 199, yearly: 1990 },
        features: [
            'Everything in Pro',
            'Unlimited projects',
            'Custom integrations',
            'SLA guarantees',
            'Dedicated support',
            'On-premise option',
            'Custom training',
            'White-label option'
        ],
        limits: {
            maxFiles: Infinity,
            maxSymbols: Infinity,
            maxProjects: Infinity
        },
        stripePriceId: {
            monthly: 'price_veritas_enterprise_monthly',
            yearly: 'price_veritas_enterprise_yearly'
        }
    },

    'TRIAL': {
        type: 'TRIAL',
        name: 'Veritas Trial',
        price: { monthly: 0, yearly: 0 },
        features: [
            'All Pro features',
            '14 days free',
            '100 files',
            '1000 symbols'
        ],
        limits: {
            maxFiles: 100,
            maxSymbols: 1000,
            maxProjects: 1
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// LICENSE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class VeritasLicenseEngine {
    private static instance: VeritasLicenseEngine;
    private secretKey: string;

    private constructor() {
        // Use environment variable or generate from machine ID
        this.secretKey = process.env.VERITAS_LICENSE_SECRET || 'MISTER-MIND-VERITAS-2026';
    }

    static getInstance(): VeritasLicenseEngine {
        if (!VeritasLicenseEngine.instance) {
            VeritasLicenseEngine.instance = new VeritasLicenseEngine();
        }
        return VeritasLicenseEngine.instance;
    }

    /**
     * Generate a license key
     */
    generateLicense(type: LicenseType, email: string, durationDays: number = 365): GeneratedLicense {
        const timestamp = Date.now();
        const expiresAt = new Date(timestamp + durationDays * 24 * 60 * 60 * 1000);

        // Create payload
        const payload = {
            t: type.replace('VERITAS-SDK-', ''),
            e: email,
            c: timestamp,
            x: expiresAt.getTime()
        };

        // Generate signature
        const payloadStr = JSON.stringify(payload);
        const signature = crypto
            .createHmac('sha256', this.secretKey)
            .update(payloadStr)
            .digest('hex')
            .slice(0, 12)
            .toUpperCase();

        // Format license key
        let key: string;
        if (type === 'VERITAS-SDK-FREE') {
            key = `VERITAS-SDK-FREE-${signature.slice(0, 8)}`;
        } else if (type === 'VERITAS-SDK-PRO') {
            key = `VERITAS-SDK-PRO-${signature.slice(0, 4)}-${signature.slice(4, 8)}-${signature.slice(8, 12)}`;
        } else if (type === 'VERITAS-SDK-ENTERPRISE') {
            const customId = crypto.randomBytes(4).toString('hex').toUpperCase();
            key = `VERITAS-SDK-ENT-${customId}-${signature.slice(0, 8)}`;
        } else {
            key = `VERITAS-TRIAL-${signature.slice(0, 8)}`;
        }

        return {
            key,
            type,
            email,
            createdAt: new Date(timestamp),
            expiresAt,
            metadata: { payload: Buffer.from(payloadStr).toString('base64') }
        };
    }

    /**
     * Validate a license key
     */
    validateLicense(key: string): {
        valid: boolean;
        type?: LicenseType;
        tier?: LicenseTier;
        expiresAt?: Date;
        error?: string;
    } {
        // Parse key format
        const proMatch = key.match(/^VERITAS-SDK-PRO-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/);
        const freeMatch = key.match(/^VERITAS-SDK-FREE-([A-Z0-9]{8})$/);
        const entMatch = key.match(/^VERITAS-SDK-ENT-([A-Z0-9]{8})-([A-Z0-9]{8})$/);
        const trialMatch = key.match(/^VERITAS-TRIAL-([A-Z0-9]{8})$/);

        if (proMatch) {
            return {
                valid: true,
                type: 'VERITAS-SDK-PRO',
                tier: VERITAS_LICENSE_TIERS['VERITAS-SDK-PRO'],
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            };
        }

        if (freeMatch) {
            return {
                valid: true,
                type: 'VERITAS-SDK-FREE',
                tier: VERITAS_LICENSE_TIERS['VERITAS-SDK-FREE'],
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            };
        }

        if (entMatch) {
            return {
                valid: true,
                type: 'VERITAS-SDK-ENTERPRISE',
                tier: VERITAS_LICENSE_TIERS['VERITAS-SDK-ENTERPRISE'],
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            };
        }

        if (trialMatch) {
            return {
                valid: true,
                type: 'TRIAL',
                tier: VERITAS_LICENSE_TIERS['TRIAL'],
                expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            };
        }

        return {
            valid: false,
            error: 'Invalid license key format. Get a valid key at https://mistermind.dev/veritas'
        };
    }

    /**
     * Check if a feature is available for a license type
     */
    hasFeature(type: LicenseType, feature: string): boolean {
        const tier = VERITAS_LICENSE_TIERS[type];
        if (!tier) return false;

        const featureMap: Record<string, LicenseType[]> = {
            'assimilate': ['VERITAS-SDK-FREE', 'VERITAS-SDK-PRO', 'VERITAS-SDK-ENTERPRISE', 'TRIAL'],
            'verify': ['VERITAS-SDK-FREE', 'VERITAS-SDK-PRO', 'VERITAS-SDK-ENTERPRISE', 'TRIAL'],
            'validate': ['VERITAS-SDK-PRO', 'VERITAS-SDK-ENTERPRISE', 'TRIAL'],
            'context': ['VERITAS-SDK-PRO', 'VERITAS-SDK-ENTERPRISE', 'TRIAL'],
            'types': ['VERITAS-SDK-PRO', 'VERITAS-SDK-ENTERPRISE', 'TRIAL'],
            'export': ['VERITAS-SDK-PRO', 'VERITAS-SDK-ENTERPRISE', 'TRIAL'],
            'neural-map': ['VERITAS-SDK-PRO', 'VERITAS-SDK-ENTERPRISE'],
            'ci-cd': ['VERITAS-SDK-PRO', 'VERITAS-SDK-ENTERPRISE'],
            'white-label': ['VERITAS-SDK-ENTERPRISE'],
            'on-premise': ['VERITAS-SDK-ENTERPRISE']
        };

        return featureMap[feature]?.includes(type) || false;
    }

    /**
     * Get pricing info for display
     */
    getPricingInfo(): Array<{
        tier: string;
        price: string;
        features: string[];
        cta: string;
    }> {
        return [
            {
                tier: 'Free',
                price: '$0/mo',
                features: VERITAS_LICENSE_TIERS['VERITAS-SDK-FREE'].features,
                cta: 'Get Started'
            },
            {
                tier: 'Pro',
                price: '$29/mo',
                features: VERITAS_LICENSE_TIERS['VERITAS-SDK-PRO'].features,
                cta: 'Start Pro Trial'
            },
            {
                tier: 'Enterprise',
                price: '$199/mo',
                features: VERITAS_LICENSE_TIERS['VERITAS-SDK-ENTERPRISE'].features,
                cta: 'Contact Sales'
            }
        ];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRIPE INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface StripeCheckoutOptions {
    email: string;
    tier: LicenseType;
    billingCycle: 'monthly' | 'yearly';
    successUrl: string;
    cancelUrl: string;
}

export async function createStripeCheckout(options: StripeCheckoutOptions): Promise<string> {
    // This would integrate with actual Stripe API
    // For now, return a placeholder URL
    const tier = VERITAS_LICENSE_TIERS[options.tier];
    const priceId = tier.stripePriceId?.[options.billingCycle];

    if (!priceId) {
        throw new Error(`No Stripe price configured for ${options.tier} ${options.billingCycle}`);
    }

    // In production, this would call Stripe API:
    // const session = await stripe.checkout.sessions.create({...});
    // return session.url;

    return `https://checkout.stripe.com/pay/${priceId}?email=${encodeURIComponent(options.email)}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getVeritasLicenseEngine = () => VeritasLicenseEngine.getInstance();

export default VeritasLicenseEngine;
