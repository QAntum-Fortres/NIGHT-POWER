/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║   🛰️ VERITAS APP CORE v1.0.0                                                   ║
 * ║   The Central Intelligence for VERITAS SCAN Mobile Suite                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { CognitiveBridge, getCognitiveBridge } from './CognitiveBridge';
import { CognitiveActionType, CognitiveObservation } from './types';
import { VeritasSentinel } from './veritas-sentinel';
import { VaultDecryptor } from './vault-decryptor';
import { MobileWealthBridge } from './mobile-wealth-bridge';

export class VeritasAppCore {
    private bridge: CognitiveBridge;

    constructor() {
        // Initialize the QANTUM Cognitive Bridge
        this.bridge = getCognitiveBridge({
            maxIterations: 5,
            enableLogging: true,
            temperature: 0.2 // Rigorous, deterministic thinking for security
        });

        this.registerMobileModules();
    }

    private registerMobileModules() {
        // We extend the bridge with our new mobile-specific modules
        this.bridge.registerModule(CognitiveActionType.SCAN_DEEPFAKE, new VeritasSentinel());
        this.bridge.registerModule(CognitiveActionType.DECRYPT_VAULT, new VaultDecryptor());
        this.bridge.registerModule(CognitiveActionType.SYNC_WEALTH, new MobileWealthBridge());
    }

    /**
     * Primary interface for the App's "HELIOS UI"
     */
    public async processSecurityEvent(type: CognitiveActionType, payload: unknown): Promise<CognitiveObservation> {
        console.log(`\n🛡️ [VERITAS CORE] Processing Event: ${type}`);

        // Execute targeting the specific module
        return await this.bridge.dispatch({
            type,
            payload
        });
    }

    public getSystemStatus() {
        return {
            status: 'ONLINE',
            substrate: 'QANTUM v3.0-SINGULARITY',
            modules: ['Sentinel', 'Vault', 'WealthBridge'],
            uptime: process.uptime()
        };
    }
}

// Singleton for the mobile application context
export const veritasCore = new VeritasAppCore();
