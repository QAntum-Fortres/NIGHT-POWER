/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM ANTI-DETECTION                                                       ║
 * ║   "Evade bot detection systems"                                               ║
 * ║                                                                               ║
 * ║   TODO B #22 - Ghost Protocol: Anti-Detection                                 ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DetectionRisk {
    category: string;
    risk: 'low' | 'medium' | 'high';
    description: string;
    mitigation?: string;
}

export interface EvasionStrategy {
    name: string;
    enabled: boolean;
    apply: () => void;
}

export interface BotSignature {
    pattern: string | RegExp;
    type: 'header' | 'behavior' | 'fingerprint' | 'timing';
    severity: 'low' | 'medium' | 'high';
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOT SIGNATURES TO AVOID
// ═══════════════════════════════════════════════════════════════════════════════

const BOT_SIGNATURES: BotSignature[] = [
    // Header-based
    { pattern: /HeadlessChrome/i, type: 'header', severity: 'high' },
    { pattern: /PhantomJS/i, type: 'header', severity: 'high' },
    { pattern: /Selenium/i, type: 'header', severity: 'high' },
    { pattern: /Puppeteer/i, type: 'header', severity: 'high' },
    { pattern: /webdriver/i, type: 'header', severity: 'high' },

    // Behavior-based
    { pattern: 'no_mouse_movement', type: 'behavior', severity: 'medium' },
    { pattern: 'perfect_timing', type: 'behavior', severity: 'medium' },
    { pattern: 'instant_form_fill', type: 'behavior', severity: 'high' },
    { pattern: 'no_scroll', type: 'behavior', severity: 'medium' },

    // Fingerprint-based
    { pattern: 'navigator.webdriver', type: 'fingerprint', severity: 'high' },
    { pattern: 'missing_plugins', type: 'fingerprint', severity: 'medium' },
    { pattern: 'no_language', type: 'fingerprint', severity: 'medium' },
    { pattern: 'headless_ua', type: 'fingerprint', severity: 'high' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// ANTI-DETECTION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class AntiDetection {
    private static instance: AntiDetection;
    
    private strategies: Map<string, EvasionStrategy> = new Map();
    private enabled: boolean = true;

    static getInstance(): AntiDetection {
        if (!AntiDetection.instance) {
            AntiDetection.instance = new AntiDetection();
            AntiDetection.instance.registerDefaultStrategies();
        }
        return AntiDetection.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STRATEGIES
    // ─────────────────────────────────────────────────────────────────────────

    private registerDefaultStrategies(): void {
        // WebDriver flag removal
        this.registerStrategy({
            name: 'removeWebdriver',
            enabled: true,
            apply: () => {
                if (typeof window !== 'undefined') {
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined
                    });
                }
            }
        });

        // Chrome runtime injection
        this.registerStrategy({
            name: 'injectChrome',
            enabled: true,
            apply: () => {
                if (typeof window !== 'undefined' && !(window as any).chrome) {
                    (window as any).chrome = {
                        runtime: {},
                        loadTimes: () => {},
                        csi: () => {},
                        app: {}
                    };
                }
            }
        });

        // Plugin spoofing
        this.registerStrategy({
            name: 'spoofPlugins',
            enabled: true,
            apply: () => {
                if (typeof window !== 'undefined') {
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => [
                            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                            { name: 'Native Client', filename: 'internal-nacl-plugin' }
                        ]
                    });
                }
            }
        });

        // Language spoofing
        this.registerStrategy({
            name: 'spoofLanguages',
            enabled: true,
            apply: () => {
                if (typeof window !== 'undefined') {
                    Object.defineProperty(navigator, 'languages', {
                        get: () => ['en-US', 'en']
                    });
                }
            }
        });

        // WebGL vendor spoofing
        this.registerStrategy({
            name: 'spoofWebGL',
            enabled: true,
            apply: () => {
                // WebGL spoofing would be applied via browser launch args
            }
        });

        // Permissions spoofing
        this.registerStrategy({
            name: 'spoofPermissions',
            enabled: true,
            apply: () => {
                if (typeof window !== 'undefined' && (navigator as any).permissions) {
                    const originalQuery = (navigator as any).permissions.query;
                    (navigator as any).permissions.query = (parameters: any) => {
                        if (parameters.name === 'notifications') {
                            return Promise.resolve({ state: 'denied', onchange: null });
                        }
                        return originalQuery(parameters);
                    };
                }
            }
        });
    }

    /**
     * Register a custom strategy
     */
    registerStrategy(strategy: EvasionStrategy): void {
        this.strategies.set(strategy.name, strategy);
    }

    /**
     * Apply all enabled strategies
     */
    applyAll(): void {
        if (!this.enabled) return;

        for (const strategy of this.strategies.values()) {
            if (strategy.enabled) {
                try {
                    strategy.apply();
                } catch (error) {
                    console.warn(`[AntiDetection] Failed to apply ${strategy.name}:`, error);
                }
            }
        }
    }

    /**
     * Enable/disable a strategy
     */
    setStrategyEnabled(name: string, enabled: boolean): void {
        const strategy = this.strategies.get(name);
        if (strategy) {
            strategy.enabled = enabled;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RISK ASSESSMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Assess detection risk
     */
    assessRisk(): DetectionRisk[] {
        const risks: DetectionRisk[] = [];

        // Check for webdriver
        if (typeof navigator !== 'undefined' && (navigator as any).webdriver) {
            risks.push({
                category: 'Fingerprint',
                risk: 'high',
                description: 'navigator.webdriver is true',
                mitigation: 'Enable removeWebdriver strategy'
            });
        }

        // Check for Chrome
        if (typeof window !== 'undefined' && !(window as any).chrome) {
            risks.push({
                category: 'Fingerprint',
                risk: 'medium',
                description: 'Chrome runtime not present',
                mitigation: 'Enable injectChrome strategy'
            });
        }

        // Check plugins
        if (typeof navigator !== 'undefined' && navigator.plugins?.length === 0) {
            risks.push({
                category: 'Fingerprint',
                risk: 'medium',
                description: 'No plugins detected',
                mitigation: 'Enable spoofPlugins strategy'
            });
        }

        // Check languages
        if (typeof navigator !== 'undefined' && !navigator.languages?.length) {
            risks.push({
                category: 'Fingerprint',
                risk: 'low',
                description: 'No languages defined',
                mitigation: 'Enable spoofLanguages strategy'
            });
        }

        return risks;
    }

    /**
     * Get overall risk level
     */
    getOverallRisk(): 'low' | 'medium' | 'high' {
        const risks = this.assessRisk();
        
        if (risks.some(r => r.risk === 'high')) return 'high';
        if (risks.some(r => r.risk === 'medium')) return 'medium';
        return 'low';
    }

    /**
     * Check user agent for bot signatures
     */
    checkUserAgent(userAgent: string): boolean {
        for (const sig of BOT_SIGNATURES.filter(s => s.type === 'header')) {
            if (sig.pattern instanceof RegExp) {
                if (sig.pattern.test(userAgent)) return true;
            } else if (userAgent.includes(sig.pattern)) {
                return true;
            }
        }
        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BROWSER ARGS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get recommended browser launch args
     */
    getBrowserArgs(): string[] {
        return [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--disable-infobars',
            '--disable-notifications',
            '--disable-popup-blocking',
            '--disable-extensions',
            '--no-sandbox',
            '--start-maximized',
            '--window-size=1920,1080',
            '--disable-gpu',
            '--ignore-certificate-errors',
            '--disable-accelerated-2d-canvas',
            '--disable-background-networking',
            '--metrics-recording-only',
            '--mute-audio'
        ];
    }

    /**
     * Get stealth browser context options
     */
    getContextOptions(): Record<string, any> {
        return {
            ignoreHTTPSErrors: true,
            javaScriptEnabled: true,
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'en-US',
            timezoneId: 'America/New_York',
            permissions: ['geolocation'],
            colorScheme: 'light',
            deviceScaleFactor: 1,
            hasTouch: false,
            isMobile: false
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONTROL
    // ─────────────────────────────────────────────────────────────────────────

    enable(): void {
        this.enabled = true;
    }

    disable(): void {
        this.enabled = false;
    }

    isEnabled(): boolean {
        return this.enabled;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getAntiDetection = (): AntiDetection => AntiDetection.getInstance();

export default AntiDetection;
