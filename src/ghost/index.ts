/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM GHOST MODULE                                                         ║
 * ║   "Stealth Testing & Anti-Detection"                                          ║
 * ║                                                                               ║
 * ║   TODO B #21-24 - Ghost Protocol Complete                                     ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export {
    GhostProtocol,
    SelectorObfuscator,
    getGhostProtocol,
    type StealthLevel,
    type StealthConfig,
    type GhostSession,
    type BrowserFingerprint,
    type TimingProfile
} from './protocol';

// ═══════════════════════════════════════════════════════════════════════════════
// ANTI-DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

export {
    AntiDetection,
    getAntiDetection,
    type DetectionRisk,
    type EvasionStrategy,
    type BotSignature
} from './anti-detection';

// ═══════════════════════════════════════════════════════════════════════════════
// NETWORK
// ═══════════════════════════════════════════════════════════════════════════════

export {
    NetworkInterceptor,
    getNetworkInterceptor,
    type NetworkRequest,
    type NetworkResponse,
    type InterceptedCall,
    type MockRule,
    type InterceptionOptions
} from './network-interceptor';

// ═══════════════════════════════════════════════════════════════════════════════
// PROXY
// ═══════════════════════════════════════════════════════════════════════════════

export {
    ProxyChain,
    getProxyChain,
    type ProxyConfig,
    type ProxyPool,
    type RotationStrategy,
    type ProxyStats,
    type ProxyChainConfig
} from './proxy-chain';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED GHOST FACADE
// ═══════════════════════════════════════════════════════════════════════════════

import { GhostProtocol, StealthLevel, GhostSession, BrowserFingerprint } from './protocol';
import { AntiDetection, DetectionRisk } from './anti-detection';
import { NetworkInterceptor, InterceptedCall, MockRule } from './network-interceptor';
import { ProxyChain, ProxyConfig, ProxyPool } from './proxy-chain';

export class Ghost {
    readonly protocol: GhostProtocol;
    readonly antiDetection: AntiDetection;
    readonly network: NetworkInterceptor;
    readonly proxy: ProxyChain;

    constructor() {
        this.protocol = GhostProtocol.getInstance();
        this.antiDetection = AntiDetection.getInstance();
        this.network = NetworkInterceptor.getInstance();
        this.proxy = ProxyChain.getInstance();
    }

    /**
     * Start stealth session with anti-detection
     */
    start(level: StealthLevel = 'medium'): GhostSession {
        // Apply anti-detection first
        this.antiDetection.applyAll();
        
        // Start ghost session
        return this.protocol.startSession(level);
    }

    /**
     * Execute action in stealth mode
     */
    async execute<T>(
        sessionId: string,
        action: () => Promise<T>,
        name?: string
    ): Promise<T> {
        return this.protocol.executeStealthAction(sessionId, action, name);
    }

    /**
     * End session
     */
    end(sessionId: string): void {
        this.protocol.endSession(sessionId);
    }

    /**
     * Check current stealth status
     */
    getStatus(sessionId?: string): {
        riskLevel: 'low' | 'medium' | 'high';
        risks: DetectionRisk[];
        session?: GhostSession;
    } {
        return {
            riskLevel: this.antiDetection.getOverallRisk(),
            risks: this.antiDetection.assessRisk(),
            session: sessionId ? this.protocol.getSession(sessionId) : undefined
        };
    }

    /**
     * Get browser launch configuration
     */
    getBrowserConfig(proxyPoolId?: string): {
        args: string[];
        contextOptions: Record<string, any>;
        proxy?: object;
    } {
        return {
            args: this.antiDetection.getBrowserArgs(),
            contextOptions: this.antiDetection.getContextOptions(),
            proxy: proxyPoolId ? this.proxy.getPlaywrightConfig(proxyPoolId) : undefined
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NETWORK SHORTCUTS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Mock API endpoint
     */
    mockApi(endpoint: string, data: any, options?: { status?: number; delay?: number }): string {
        this.network.enable();
        return this.network.mockApi(endpoint, data, options);
    }

    /**
     * Block requests to pattern
     */
    blockRequests(pattern: string | RegExp): string {
        this.network.enable();
        return this.network.block(pattern);
    }

    /**
     * Start recording network traffic
     */
    startRecording(): void {
        this.network.enable();
        this.network.startRecording();
    }

    /**
     * Stop recording and get traffic
     */
    stopRecording(): InterceptedCall[] {
        return this.network.stopRecording();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROXY SHORTCUTS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create proxy pool
     */
    createProxyPool(name: string, proxies: ProxyConfig[]): string {
        this.proxy.enable();
        return this.proxy.createPool(name, proxies);
    }

    /**
     * Get proxy URL for pool
     */
    getProxyUrl(poolId: string): string | null {
        return this.proxy.getProxyUrl(poolId);
    }
}

// Singleton
let ghostInstance: Ghost | null = null;

export function getGhost(): Ghost {
    if (!ghostInstance) {
        ghostInstance = new Ghost();
    }
    return ghostInstance;
}

export default Ghost;
