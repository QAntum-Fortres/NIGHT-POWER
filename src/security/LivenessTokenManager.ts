import * as crypto from 'crypto';

/**
 * 🛡️ LIVENESS_TOKEN_MANAGER: SINGLETON PATTERN / SINGLE SOURCE OF TRUTH
 * Reference: Sovereign Architect Diagram [AEGIS_PHASE_7]
 */
export class LivenessTokenManager {
    private static instance: LivenessTokenManager;
    private readonly SECRET: string;
    private activeTokens: Map<string, string> = new Map();

    private constructor() {
        // In a real scenario, this would be loaded from a hardware-sealed enclave
        this.SECRET = process.env.LIVENESS_TOKEN_SECRET || process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
    }

    public static getInstance(): LivenessTokenManager {
        if (!LivenessTokenManager.instance) {
            LivenessTokenManager.instance = new LivenessTokenManager();
        }
        return LivenessTokenManager.instance;
    }

    /**
     * Generate LivenessToken (moduleID : timestamp : status)
     * Signed with HMAC-SHA256
     */
    public generateToken(moduleId: string, status: 'HEALTHY' | 'ANOMALY' = 'HEALTHY'): string {
        const timestamp = Date.now();
        const payload = `${moduleId}:${timestamp}:${status}`;
        const signature = crypto
            .createHmac('sha256', this.SECRET)
            .update(payload)
            .digest('hex');

        const token = `${payload}.${signature}`;
        this.activeTokens.set(moduleId, token);
        return token;
    }

    /**
     * Verify LivenessToken Integrity
     */
    public verifyToken(token: string): { valid: boolean; moduleId?: string; status?: string } {
        try {
            const [payload, signature] = token.split('.');
            if (!payload || !signature) return { valid: false };

            const recreatedSignature = crypto
                .createHmac('sha256', this.SECRET)
                .update(payload)
                .digest('hex');

            if (recreatedSignature !== signature) return { valid: false };

            const [moduleId, timestamp, status] = payload.split(':');

            // Check expiry (e.g., 5 seconds for high-security liveness)
            const age = Date.now() - parseInt(timestamp);
            if (age > 5000) return { valid: false, moduleId, status: 'EXPIRED' };

            return { valid: true, moduleId, status };
        } catch (e) {
            return { valid: false };
        }
    }

    public getSecretId(): string {
        // Return a masked ID for the secret being used
        return `SECRET_HMAC_${this.SECRET.substring(0, 4)}...`;
    }
}
