/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM GHOST PROTOCOL                                                       ║
 * ║   "Stealth testing with zero footprint"                                       ║
 * ║                                                                               ║
 * ║   TODO B #21 - Ghost Protocol: Stealth Mode                                   ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type StealthLevel = 'normal' | 'low' | 'medium' | 'high' | 'ghost';

export interface StealthConfig {
    level: StealthLevel;
    obfuscateSelectors: boolean;
    randomizeTimings: boolean;
    mimicHumanBehavior: boolean;
    useProxyChain: boolean;
    rotateFingerpint: boolean;
    disableTracking: boolean;
}

export interface GhostSession {
    id: string;
    level: StealthLevel;
    fingerprint: BrowserFingerprint;
    startedAt: number;
    requestCount: number;
    lastActivityAt: number;
}

export interface BrowserFingerprint {
    userAgent: string;
    screenResolution: string;
    timezone: string;
    language: string;
    platform: string;
    hardwareConcurrency: number;
    deviceMemory: number;
    colorDepth: number;
    webGLVendor: string;
    webGLRenderer: string;
}

export interface TimingProfile {
    minDelay: number;
    maxDelay: number;
    typeSpeed: [number, number];  // min, max ms per char
    scrollSpeed: [number, number];
    clickDelay: [number, number];
    pageLoadWait: [number, number];
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINGERPRINT DATABASE
// ═══════════════════════════════════════════════════════════════════════════════

const USER_AGENTS: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

const SCREEN_RESOLUTIONS = [
    '1920x1080', '2560x1440', '1366x768', '1536x864', '1440x900',
    '1680x1050', '1280x720', '1600x900', '2560x1080', '3840x2160'
];

const TIMEZONES = [
    'America/New_York', 'America/Los_Angeles', 'Europe/London',
    'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai'
];

const LANGUAGES = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'ja-JP', 'zh-CN'];

const PLATFORMS = ['Win32', 'MacIntel', 'Linux x86_64'];

const WEBGL_VENDORS = ['Google Inc.', 'Intel Inc.', 'NVIDIA Corporation', 'AMD'];
const WEBGL_RENDERERS = [
    'ANGLE (Intel HD Graphics 630 Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (NVIDIA GeForce GTX 1080 Direct3D11 vs_5_0 ps_5_0)',
    'AMD Radeon Pro 5500 OpenGL Engine',
    'Intel Iris OpenGL Engine'
];

// ═══════════════════════════════════════════════════════════════════════════════
// TIMING PROFILES
// ═══════════════════════════════════════════════════════════════════════════════

const TIMING_PROFILES: Record<StealthLevel, TimingProfile> = {
    normal: {
        minDelay: 0,
        maxDelay: 100,
        typeSpeed: [30, 80],
        scrollSpeed: [10, 50],
        clickDelay: [50, 150],
        pageLoadWait: [100, 500]
    },
    low: {
        minDelay: 100,
        maxDelay: 300,
        typeSpeed: [50, 120],
        scrollSpeed: [30, 80],
        clickDelay: [100, 300],
        pageLoadWait: [300, 800]
    },
    medium: {
        minDelay: 200,
        maxDelay: 500,
        typeSpeed: [80, 180],
        scrollSpeed: [50, 120],
        clickDelay: [200, 500],
        pageLoadWait: [500, 1500]
    },
    high: {
        minDelay: 500,
        maxDelay: 1500,
        typeSpeed: [100, 250],
        scrollSpeed: [100, 200],
        clickDelay: [500, 1000],
        pageLoadWait: [1000, 3000]
    },
    ghost: {
        minDelay: 1000,
        maxDelay: 3000,
        typeSpeed: [150, 350],
        scrollSpeed: [150, 300],
        clickDelay: [800, 2000],
        pageLoadWait: [2000, 5000]
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GHOST PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export class GhostProtocol {
    private static instance: GhostProtocol;

    private sessions: Map<string, GhostSession> = new Map();
    private config: StealthConfig;

    private constructor() {
        this.config = {
            level: 'medium',
            obfuscateSelectors: true,
            randomizeTimings: true,
            mimicHumanBehavior: true,
            useProxyChain: false,
            rotateFingerpint: true,
            disableTracking: true
        };
    }

    static getInstance(): GhostProtocol {
        if (!GhostProtocol.instance) {
            GhostProtocol.instance = new GhostProtocol();
        }
        return GhostProtocol.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SESSION MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Start a ghost session
     */
    startSession(level?: StealthLevel): GhostSession {
        const sessionLevel = level || this.config.level;
        
        const session: GhostSession = {
            id: this.generateSessionId(),
            level: sessionLevel,
            fingerprint: this.generateFingerprint(),
            startedAt: Date.now(),
            requestCount: 0,
            lastActivityAt: Date.now()
        };

        this.sessions.set(session.id, session);
        console.log(`[GhostProtocol] Session started: ${session.id} (Level: ${sessionLevel})`);

        return session;
    }

    /**
     * End a ghost session
     */
    endSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            const duration = Date.now() - session.startedAt;
            console.log(`[GhostProtocol] Session ended: ${sessionId}, Duration: ${duration}ms, Requests: ${session.requestCount}`);
            this.sessions.delete(sessionId);
        }
    }

    /**
     * Get session
     */
    getSession(sessionId: string): GhostSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Rotate fingerprint
     */
    rotateFingerprint(sessionId: string): BrowserFingerprint {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        session.fingerprint = this.generateFingerprint();
        return session.fingerprint;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEALTH ACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Execute action with stealth
     */
    async executeStealthAction<T>(
        sessionId: string,
        action: () => Promise<T>,
        name: string = 'action'
    ): Promise<T> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        // Pre-action delay
        await this.delay(session.level);

        // Track activity
        session.requestCount++;
        session.lastActivityAt = Date.now();

        // Rotate fingerprint periodically
        if (this.config.rotateFingerpint && session.requestCount % 10 === 0) {
            this.rotateFingerprint(sessionId);
        }

        try {
            const result = await action();
            
            // Post-action delay
            await this.delay(session.level, 'micro');
            
            return result;
        } catch (error) {
            console.warn(`[GhostProtocol] Action failed: ${name}`, error);
            throw error;
        }
    }

    /**
     * Type text like a human
     */
    async typeHuman(
        sessionId: string,
        text: string,
        typeCallback: (char: string) => Promise<void>
    ): Promise<void> {
        const session = this.sessions.get(sessionId);
        const profile = TIMING_PROFILES[session?.level || 'medium'];

        for (const char of text) {
            await typeCallback(char);
            
            // Random delay between keystrokes
            const delay = this.randomBetween(profile.typeSpeed[0], profile.typeSpeed[1]);
            await this.sleep(delay);

            // Occasional pause (thinking)
            if (Math.random() < 0.05) {
                await this.sleep(this.randomBetween(200, 500));
            }
        }
    }

    /**
     * Scroll like a human
     */
    async scrollHuman(
        sessionId: string,
        distance: number,
        scrollCallback: (delta: number) => Promise<void>
    ): Promise<void> {
        const session = this.sessions.get(sessionId);
        const profile = TIMING_PROFILES[session?.level || 'medium'];

        let scrolled = 0;
        const direction = distance > 0 ? 1 : -1;
        const totalDistance = Math.abs(distance);

        while (scrolled < totalDistance) {
            const step = Math.min(
                this.randomBetween(50, 150),
                totalDistance - scrolled
            );
            
            await scrollCallback(step * direction);
            scrolled += step;

            const delay = this.randomBetween(profile.scrollSpeed[0], profile.scrollSpeed[1]);
            await this.sleep(delay);
        }
    }

    /**
     * Click with human-like behavior
     */
    async clickHuman(
        sessionId: string,
        clickCallback: () => Promise<void>
    ): Promise<void> {
        const session = this.sessions.get(sessionId);
        const profile = TIMING_PROFILES[session?.level || 'medium'];

        // Pre-click hover delay
        await this.sleep(this.randomBetween(profile.clickDelay[0] / 2, profile.clickDelay[1] / 2));

        await clickCallback();

        // Post-click delay
        await this.sleep(this.randomBetween(profile.clickDelay[0], profile.clickDelay[1]));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONFIGURATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Set stealth level
     */
    setLevel(level: StealthLevel): void {
        this.config.level = level;
    }

    /**
     * Get current config
     */
    getConfig(): StealthConfig {
        return { ...this.config };
    }

    /**
     * Update config
     */
    configure(updates: Partial<StealthConfig>): void {
        this.config = { ...this.config, ...updates };
    }

    /**
     * Get timing profile
     */
    getTimingProfile(level?: StealthLevel): TimingProfile {
        return TIMING_PROFILES[level || this.config.level];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FINGERPRINT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate random fingerprint
     */
    generateFingerprint(): BrowserFingerprint {
        return {
            userAgent: this.randomFrom(USER_AGENTS),
            screenResolution: this.randomFrom(SCREEN_RESOLUTIONS),
            timezone: this.randomFrom(TIMEZONES),
            language: this.randomFrom(LANGUAGES),
            platform: this.randomFrom(PLATFORMS),
            hardwareConcurrency: this.randomFrom([2, 4, 6, 8, 12, 16]),
            deviceMemory: this.randomFrom([4, 8, 16, 32]),
            colorDepth: this.randomFrom([24, 32]),
            webGLVendor: this.randomFrom(WEBGL_VENDORS),
            webGLRenderer: this.randomFrom(WEBGL_RENDERERS)
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private async delay(level: StealthLevel, type: 'normal' | 'micro' = 'normal'): Promise<void> {
        const profile = TIMING_PROFILES[level];
        const min = type === 'micro' ? profile.minDelay / 4 : profile.minDelay;
        const max = type === 'micro' ? profile.maxDelay / 4 : profile.maxDelay;
        await this.sleep(this.randomBetween(min, max));
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private randomBetween(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private randomFrom<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    private generateSessionId(): string {
        return `ghost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELECTOR OBFUSCATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class SelectorObfuscator {
    private selectorMap: Map<string, string[]> = new Map();

    /**
     * Register alternative selectors
     */
    register(primary: string, alternatives: string[]): void {
        this.selectorMap.set(primary, alternatives);
    }

    /**
     * Get obfuscated selector
     */
    obfuscate(selector: string): string {
        const alternatives = this.selectorMap.get(selector);
        if (alternatives && alternatives.length > 0) {
            return alternatives[Math.floor(Math.random() * alternatives.length)];
        }
        return selector;
    }

    /**
     * Generate data-testid alternative
     */
    generateTestId(baseName: string): string {
        const suffix = Math.random().toString(36).substr(2, 4);
        return `[data-testid="${baseName}-${suffix}"]`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getGhostProtocol = (): GhostProtocol => GhostProtocol.getInstance();

export default GhostProtocol;
