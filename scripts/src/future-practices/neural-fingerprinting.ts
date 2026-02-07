/**
 * 🧠 NEURAL FINGERPRINTING ENGINE
 * 
 * Advanced Practice #3: Unique human-like behavioral profiles for each test session.
 * 
 * Uses neuro-sentinel patterns to create realistic user fingerprints that
 * bypass bot detection while maintaining consistent behavioral signatures.
 * 
 * Features:
 * - Behavioral biometrics simulation
 * - Device fingerprint generation
 * - Mouse/keyboard pattern synthesis
 * - Session persistence across tests
 * - Anti-bot evasion techniques
 * 
 * @version 1.0.0
 * @phase Future Practices - Beyond Phase 100
 * @author QANTUM AI Architect
 */

import * as crypto from 'crypto';
import { EventEmitter } from 'events';

// ============================================================
// TYPES
// ============================================================

interface NeuralFingerprint {
    fingerprintId: string;
    sessionId: string;
    createdAt: number;
    expiresAt: number;
    
    // Device fingerprint
    device: DeviceFingerprint;
    
    // Behavioral patterns
    behavior: BehavioralProfile;
    
    // Network characteristics
    network: NetworkProfile;
    
    // Browser characteristics
    browser: BrowserProfile;
    
    // Usage statistics
    stats: FingerprintStats;
}

interface DeviceFingerprint {
    screenResolution: { width: number; height: number };
    colorDepth: number;
    pixelRatio: number;
    timezone: string;
    timezoneOffset: number;
    language: string;
    languages: string[];
    platform: string;
    hardwareConcurrency: number;
    deviceMemory: number;
    maxTouchPoints: number;
    vendor: string;
    renderer: string;
    webglHash: string;
    canvasHash: string;
    audioHash: string;
    fontsHash: string;
}

interface BehavioralProfile {
    // Mouse behavior
    mouseSpeed: { min: number; max: number; avg: number };
    mouseAcceleration: { min: number; max: number };
    clickDuration: { min: number; max: number; avg: number };
    doubleClickSpeed: number;
    scrollSpeed: { min: number; max: number };
    scrollPattern: 'smooth' | 'stepped' | 'variable';
    
    // Keyboard behavior
    typingSpeed: { wpm: number; variance: number };
    keyHoldDuration: { min: number; max: number };
    keyInterval: { min: number; max: number };
    errorRate: number;
    correctionPattern: 'backspace' | 'select-delete' | 'mixed';
    
    // Navigation patterns
    readingSpeed: number; // chars per second
    dwellTime: { min: number; max: number };
    tabSwitchFrequency: number;
    
    // Interaction quirks
    hesitationProbability: number;
    microPauseDuration: { min: number; max: number };
    frustrationIndicators: string[];
}

interface NetworkProfile {
    connectionType: 'wifi' | '4g' | '5g' | 'ethernet' | 'unknown';
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
    downlink: number; // Mbps
    rtt: number; // milliseconds
    saveData: boolean;
    ipGeolocation: {
        country: string;
        region: string;
        city: string;
        isp: string;
    };
}

interface BrowserProfile {
    userAgent: string;
    appVersion: string;
    vendor: string;
    product: string;
    productSub: string;
    buildID: string;
    cookieEnabled: boolean;
    doNotTrack: string | null;
    plugins: PluginInfo[];
    mimeTypes: string[];
    webRTC: {
        enabled: boolean;
        localIPs: string[];
    };
    canvas: {
        supported: boolean;
        hash: string;
    };
    webGL: {
        supported: boolean;
        vendor: string;
        renderer: string;
        hash: string;
    };
    audio: {
        supported: boolean;
        hash: string;
    };
    features: BrowserFeatures;
}

interface PluginInfo {
    name: string;
    filename: string;
    description: string;
}

interface BrowserFeatures {
    webAssembly: boolean;
    webWorkers: boolean;
    serviceWorkers: boolean;
    webSockets: boolean;
    webRTC: boolean;
    indexedDB: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    notifications: boolean;
    geolocation: boolean;
    mediaDevices: boolean;
    bluetooth: boolean;
    usb: boolean;
    payment: boolean;
}

interface FingerprintStats {
    sessionsUsed: number;
    testsExecuted: number;
    pagesVisited: number;
    detectionsEvaded: number;
    avgSessionDuration: number;
    lastUsed: number;
}

interface FingerprintConfig {
    basePersonality: 'casual' | 'professional' | 'power-user' | 'novice';
    deviceCategory: 'desktop' | 'laptop' | 'tablet' | 'mobile';
    region: string;
    sessionDuration: number;
    persistFingerprint: boolean;
    rotationStrategy: 'fixed' | 'per-session' | 'time-based';
    rotationInterval?: number;
}

// ============================================================
// NEURAL FINGERPRINTING ENGINE
// ============================================================

export class NeuralFingerprintingEngine extends EventEmitter {
    private config: FingerprintConfig;
    private fingerprints: Map<string, NeuralFingerprint> = new Map();
    private activeFingerprint: NeuralFingerprint | null = null;
    
    // Data pools for realistic generation
    private static readonly USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    private static readonly SCREEN_RESOLUTIONS = [
        { width: 1920, height: 1080 },
        { width: 2560, height: 1440 },
        { width: 1366, height: 768 },
        { width: 1536, height: 864 },
        { width: 1440, height: 900 },
        { width: 3840, height: 2160 },
        { width: 1280, height: 720 }
    ];

    private static readonly TIMEZONES = [
        'Europe/Sofia', 'Europe/London', 'Europe/Berlin', 'America/New_York',
        'America/Los_Angeles', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney'
    ];

    private static readonly LANGUAGES = [
        ['en-US', 'en'], ['en-GB', 'en'], ['de-DE', 'de', 'en'],
        ['fr-FR', 'fr', 'en'], ['bg-BG', 'bg', 'en'], ['es-ES', 'es', 'en']
    ];

    private static readonly GPU_VENDORS = [
        'NVIDIA Corporation',
        'AMD',
        'Intel Inc.',
        'Apple Inc.'
    ];

    private static readonly GPU_RENDERERS = [
        'NVIDIA GeForce RTX 4090',
        'NVIDIA GeForce RTX 3080',
        'NVIDIA GeForce GTX 1660',
        'AMD Radeon RX 7900 XTX',
        'AMD Radeon RX 6800 XT',
        'Intel(R) UHD Graphics 770',
        'Apple M2 Pro'
    ];

    constructor(config: Partial<FingerprintConfig> = {}) {
        super();

        this.config = {
            basePersonality: 'professional',
            deviceCategory: 'desktop',
            region: 'Europe/Sofia',
            sessionDuration: 3600000, // 1 hour
            persistFingerprint: true,
            rotationStrategy: 'per-session',
            ...config
        };
    }

    /**
     * 🚀 Initialize fingerprinting engine
     */
    async initialize(): Promise<void> {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🧠 NEURAL FINGERPRINTING ENGINE                              ║
║                                                               ║
║  "Every session, a unique human"                              ║
╚═══════════════════════════════════════════════════════════════╝
`);

        console.log(`   Base personality: ${this.config.basePersonality}`);
        console.log(`   Device category: ${this.config.deviceCategory}`);
        console.log(`   Region: ${this.config.region}`);
        console.log(`   Rotation: ${this.config.rotationStrategy}`);
    }

    /**
     * 🎭 Generate new neural fingerprint
     */
    async generateFingerprint(sessionId?: string): Promise<NeuralFingerprint> {
        const id = sessionId || crypto.randomBytes(16).toString('hex');
        
        console.log(`\n🎭 Generating neural fingerprint for session: ${id.substring(0, 8)}...`);

        const fingerprint: NeuralFingerprint = {
            fingerprintId: `fp_${crypto.randomBytes(8).toString('hex')}`,
            sessionId: id,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.config.sessionDuration,
            device: this.generateDeviceFingerprint(),
            behavior: this.generateBehavioralProfile(),
            network: this.generateNetworkProfile(),
            browser: this.generateBrowserProfile(),
            stats: {
                sessionsUsed: 0,
                testsExecuted: 0,
                pagesVisited: 0,
                detectionsEvaded: 0,
                avgSessionDuration: 0,
                lastUsed: Date.now()
            }
        };

        this.fingerprints.set(fingerprint.fingerprintId, fingerprint);
        this.activeFingerprint = fingerprint;

        console.log(`   ✅ Fingerprint generated: ${fingerprint.fingerprintId}`);
        console.log(`   📱 Device: ${fingerprint.device.screenResolution.width}x${fingerprint.device.screenResolution.height}`);
        console.log(`   🌐 Browser: ${fingerprint.browser.userAgent.split(' ')[0]}`);
        console.log(`   ⌨️ Typing: ${fingerprint.behavior.typingSpeed.wpm} WPM`);

        this.emit('fingerprint:generated', fingerprint);
        return fingerprint;
    }

    /**
     * 📱 Generate device fingerprint
     */
    private generateDeviceFingerprint(): DeviceFingerprint {
        const resolution = this.pickRandom(NeuralFingerprintingEngine.SCREEN_RESOLUTIONS);
        const timezone = this.config.region || this.pickRandom(NeuralFingerprintingEngine.TIMEZONES);
        const languages = this.pickRandom(NeuralFingerprintingEngine.LANGUAGES);
        
        return {
            screenResolution: resolution,
            colorDepth: this.pickRandom([24, 30, 32]),
            pixelRatio: this.pickRandom([1, 1.25, 1.5, 2, 2.5, 3]),
            timezone,
            timezoneOffset: this.getTimezoneOffset(timezone),
            language: languages[0],
            languages,
            platform: this.getPlatformForCategory(),
            hardwareConcurrency: this.pickRandom([4, 6, 8, 12, 16, 24, 32]),
            deviceMemory: this.pickRandom([4, 8, 16, 32, 64]),
            maxTouchPoints: this.config.deviceCategory === 'mobile' ? this.pickRandom([5, 10]) : 0,
            vendor: this.pickRandom(NeuralFingerprintingEngine.GPU_VENDORS),
            renderer: this.pickRandom(NeuralFingerprintingEngine.GPU_RENDERERS),
            webglHash: this.generateHash('webgl'),
            canvasHash: this.generateHash('canvas'),
            audioHash: this.generateHash('audio'),
            fontsHash: this.generateHash('fonts')
        };
    }

    /**
     * 🎭 Generate behavioral profile based on personality
     */
    private generateBehavioralProfile(): BehavioralProfile {
        const profiles: Record<FingerprintConfig['basePersonality'], Partial<BehavioralProfile>> = {
            casual: {
                mouseSpeed: { min: 200, max: 800, avg: 450 },
                typingSpeed: { wpm: 35, variance: 15 },
                readingSpeed: 200,
                hesitationProbability: 0.25,
                errorRate: 0.08
            },
            professional: {
                mouseSpeed: { min: 300, max: 1200, avg: 650 },
                typingSpeed: { wpm: 65, variance: 10 },
                readingSpeed: 350,
                hesitationProbability: 0.1,
                errorRate: 0.03
            },
            'power-user': {
                mouseSpeed: { min: 500, max: 2000, avg: 1100 },
                typingSpeed: { wpm: 90, variance: 8 },
                readingSpeed: 500,
                hesitationProbability: 0.05,
                errorRate: 0.02
            },
            novice: {
                mouseSpeed: { min: 100, max: 400, avg: 200 },
                typingSpeed: { wpm: 20, variance: 20 },
                readingSpeed: 150,
                hesitationProbability: 0.4,
                errorRate: 0.15
            }
        };

        const base = profiles[this.config.basePersonality];

        return {
            mouseSpeed: base.mouseSpeed!,
            mouseAcceleration: { min: 0.8, max: 1.5 },
            clickDuration: { min: 50, max: 150, avg: 90 },
            doubleClickSpeed: this.randomInRange(200, 400),
            scrollSpeed: { min: 50, max: 300 },
            scrollPattern: this.pickRandom(['smooth', 'stepped', 'variable'] as const),
            typingSpeed: base.typingSpeed!,
            keyHoldDuration: { min: 50, max: 150 },
            keyInterval: { min: 80, max: 200 },
            errorRate: base.errorRate!,
            correctionPattern: this.pickRandom(['backspace', 'select-delete', 'mixed'] as const),
            readingSpeed: base.readingSpeed!,
            dwellTime: { min: 500, max: 3000 },
            tabSwitchFrequency: this.randomInRange(0.1, 0.5),
            hesitationProbability: base.hesitationProbability!,
            microPauseDuration: { min: 100, max: 500 },
            frustrationIndicators: ['rapid-clicks', 'erratic-movement', 'quick-scroll-up']
        };
    }

    /**
     * 🌐 Generate network profile
     */
    private generateNetworkProfile(): NetworkProfile {
        return {
            connectionType: this.pickRandom(['wifi', 'ethernet', '4g'] as const),
            effectiveType: this.pickRandom(['3g', '4g'] as const),
            downlink: this.randomInRange(5, 100),
            rtt: this.randomInRange(20, 150),
            saveData: Math.random() < 0.1,
            ipGeolocation: this.generateGeolocation()
        };
    }

    /**
     * Generate geolocation based on region
     */
    private generateGeolocation(): NetworkProfile['ipGeolocation'] {
        const geoData: Record<string, NetworkProfile['ipGeolocation']> = {
            'Europe/Sofia': { country: 'BG', region: 'Sofia', city: 'Sofia', isp: 'Vivacom' },
            'Europe/London': { country: 'GB', region: 'England', city: 'London', isp: 'BT' },
            'Europe/Berlin': { country: 'DE', region: 'Berlin', city: 'Berlin', isp: 'Deutsche Telekom' },
            'America/New_York': { country: 'US', region: 'New York', city: 'New York', isp: 'Verizon' },
            'America/Los_Angeles': { country: 'US', region: 'California', city: 'Los Angeles', isp: 'AT&T' }
        };

        return geoData[this.config.region] || geoData['Europe/Sofia'];
    }

    /**
     * 🖥️ Generate browser profile
     */
    private generateBrowserProfile(): BrowserProfile {
        const userAgent = this.pickRandom(NeuralFingerprintingEngine.USER_AGENTS);
        
        return {
            userAgent,
            appVersion: userAgent.split('Mozilla/')[1] || '5.0',
            vendor: this.detectVendorFromUA(userAgent),
            product: 'Gecko',
            productSub: '20100101',
            buildID: this.generateBuildId(),
            cookieEnabled: true,
            doNotTrack: Math.random() < 0.3 ? '1' : null,
            plugins: this.generatePlugins(),
            mimeTypes: ['application/pdf', 'text/plain'],
            webRTC: {
                enabled: Math.random() > 0.2,
                localIPs: ['192.168.1.' + Math.floor(Math.random() * 254)]
            },
            canvas: {
                supported: true,
                hash: this.generateHash('canvas')
            },
            webGL: {
                supported: true,
                vendor: this.pickRandom(NeuralFingerprintingEngine.GPU_VENDORS),
                renderer: this.pickRandom(NeuralFingerprintingEngine.GPU_RENDERERS),
                hash: this.generateHash('webgl')
            },
            audio: {
                supported: true,
                hash: this.generateHash('audio')
            },
            features: this.generateBrowserFeatures()
        };
    }

    /**
     * Generate realistic plugin list
     */
    private generatePlugins(): PluginInfo[] {
        const plugins: PluginInfo[] = [
            { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: 'Chrome PDF Viewer' }
        ];

        if (Math.random() > 0.5) {
            plugins.push({ name: 'Widevine Content Decryption Module', filename: 'widevinecdm', description: 'DRM' });
        }

        return plugins;
    }

    /**
     * Generate browser features
     */
    private generateBrowserFeatures(): BrowserFeatures {
        return {
            webAssembly: true,
            webWorkers: true,
            serviceWorkers: true,
            webSockets: true,
            webRTC: Math.random() > 0.2,
            indexedDB: true,
            localStorage: true,
            sessionStorage: true,
            notifications: Math.random() > 0.3,
            geolocation: Math.random() > 0.4,
            mediaDevices: true,
            bluetooth: Math.random() > 0.7,
            usb: Math.random() > 0.8,
            payment: Math.random() > 0.5
        };
    }

    /**
     * 🎮 Simulate human-like mouse movement
     */
    generateMousePath(
        start: { x: number; y: number },
        end: { x: number; y: number },
        options: { steps?: number; includeOvershoot?: boolean } = {}
    ): { x: number; y: number; timestamp: number }[] {
        const steps = options.steps || Math.ceil(Math.random() * 20 + 10);
        const path: { x: number; y: number; timestamp: number }[] = [];
        
        const behavior = this.activeFingerprint?.behavior || this.generateBehavioralProfile();
        let timestamp = Date.now();

        // Calculate control points for Bezier curve
        const controlPoint1 = {
            x: start.x + (end.x - start.x) * 0.25 + (Math.random() - 0.5) * 100,
            y: start.y + (end.y - start.y) * 0.25 + (Math.random() - 0.5) * 100
        };
        const controlPoint2 = {
            x: start.x + (end.x - start.x) * 0.75 + (Math.random() - 0.5) * 100,
            y: start.y + (end.y - start.y) * 0.75 + (Math.random() - 0.5) * 100
        };

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            
            // Cubic Bezier curve
            const point = this.cubicBezier(start, controlPoint1, controlPoint2, end, t);
            
            // Add micro-jitter for realism
            point.x += (Math.random() - 0.5) * 2;
            point.y += (Math.random() - 0.5) * 2;

            // Variable speed (slower at start and end)
            const speedFactor = Math.sin(t * Math.PI);
            const baseInterval = behavior.mouseSpeed.avg / steps;
            timestamp += baseInterval * (0.5 + speedFactor * 1.5);

            path.push({
                x: Math.round(point.x),
                y: Math.round(point.y),
                timestamp: Math.round(timestamp)
            });

            // Occasional micro-pause (hesitation)
            if (Math.random() < behavior.hesitationProbability * 0.1) {
                timestamp += this.randomInRange(
                    behavior.microPauseDuration.min,
                    behavior.microPauseDuration.max
                );
            }
        }

        // Add overshoot and correction
        if (options.includeOvershoot && Math.random() < 0.3) {
            const overshoot = {
                x: end.x + (end.x - start.x) * 0.1 * (Math.random() - 0.5) * 2,
                y: end.y + (end.y - start.y) * 0.1 * (Math.random() - 0.5) * 2,
                timestamp: timestamp + 50
            };
            path.push(overshoot);
            path.push({ x: end.x, y: end.y, timestamp: timestamp + 100 });
        }

        return path;
    }

    /**
     * Cubic Bezier interpolation
     */
    private cubicBezier(
        p0: { x: number; y: number },
        p1: { x: number; y: number },
        p2: { x: number; y: number },
        p3: { x: number; y: number },
        t: number
    ): { x: number; y: number } {
        const t2 = t * t;
        const t3 = t2 * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;

        return {
            x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
            y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
        };
    }

    /**
     * ⌨️ Simulate human-like typing
     */
    generateTypingSequence(
        text: string,
        options: { includeErrors?: boolean; includeCorrections?: boolean } = {}
    ): { char: string; delay: number; isBackspace?: boolean }[] {
        const sequence: { char: string; delay: number; isBackspace?: boolean }[] = [];
        const behavior = this.activeFingerprint?.behavior || this.generateBehavioralProfile();
        
        const baseDelay = 60000 / (behavior.typingSpeed.wpm * 5); // ms per character

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            // Calculate delay with variance
            let delay = baseDelay + (Math.random() - 0.5) * behavior.typingSpeed.variance * 10;
            
            // Longer delay after punctuation
            if (['.', ',', '!', '?', ';', ':'].includes(text[i - 1])) {
                delay *= 1.5 + Math.random() * 0.5;
            }
            
            // Longer delay for capital letters (shift key)
            if (char !== char.toLowerCase()) {
                delay *= 1.2;
            }

            // Occasional hesitation
            if (Math.random() < behavior.hesitationProbability * 0.05) {
                delay += this.randomInRange(200, 800);
            }

            // Simulate typing errors
            if (options.includeErrors && Math.random() < behavior.errorRate) {
                // Type wrong character
                const wrongChar = String.fromCharCode(
                    char.charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1)
                );
                sequence.push({ char: wrongChar, delay });
                
                // Correction
                if (options.includeCorrections) {
                    sequence.push({
                        char: '',
                        delay: this.randomInRange(100, 300),
                        isBackspace: true
                    });
                    sequence.push({
                        char,
                        delay: delay * 0.8 // Faster on correction
                    });
                }
            } else {
                sequence.push({ char, delay: Math.max(30, delay) });
            }
        }

        return sequence;
    }

    /**
     * 📜 Simulate human-like scrolling
     */
    generateScrollSequence(
        totalDistance: number,
        direction: 'up' | 'down'
    ): { delta: number; timestamp: number }[] {
        const sequence: { delta: number; timestamp: number }[] = [];
        const behavior = this.activeFingerprint?.behavior || this.generateBehavioralProfile();
        
        let remaining = Math.abs(totalDistance);
        let timestamp = Date.now();
        const sign = direction === 'down' ? 1 : -1;

        while (remaining > 0) {
            // Variable scroll distance
            let delta: number;
            
            switch (behavior.scrollPattern) {
                case 'smooth':
                    delta = this.randomInRange(30, 80);
                    break;
                case 'stepped':
                    delta = this.randomInRange(100, 200);
                    break;
                case 'variable':
                default:
                    delta = this.randomInRange(20, 150);
            }

            delta = Math.min(delta, remaining);
            remaining -= delta;

            // Variable timing
            const interval = this.randomInRange(
                behavior.scrollSpeed.min,
                behavior.scrollSpeed.max
            );
            timestamp += interval;

            sequence.push({
                delta: delta * sign,
                timestamp
            });

            // Occasional pause while reading
            if (Math.random() < 0.1) {
                timestamp += behavior.readingSpeed * 50; // Reading pause
            }
        }

        return sequence;
    }

    /**
     * 🔄 Rotate fingerprint
     */
    async rotateFingerprint(): Promise<NeuralFingerprint> {
        console.log('🔄 Rotating fingerprint...');
        
        if (this.activeFingerprint) {
            // Update stats before rotation
            this.activeFingerprint.stats.lastUsed = Date.now();
        }

        return this.generateFingerprint();
    }

    /**
     * 📊 Get fingerprint for injection
     */
    getFingerprintPayload(): Record<string, any> {
        if (!this.activeFingerprint) {
            throw new Error('No active fingerprint. Call generateFingerprint first.');
        }

        const fp = this.activeFingerprint;

        return {
            // Navigator overrides
            navigator: {
                userAgent: fp.browser.userAgent,
                language: fp.device.language,
                languages: fp.device.languages,
                platform: fp.device.platform,
                hardwareConcurrency: fp.device.hardwareConcurrency,
                deviceMemory: fp.device.deviceMemory,
                maxTouchPoints: fp.device.maxTouchPoints,
                vendor: fp.browser.vendor,
                doNotTrack: fp.browser.doNotTrack,
                cookieEnabled: fp.browser.cookieEnabled,
                plugins: fp.browser.plugins
            },
            
            // Screen overrides
            screen: {
                width: fp.device.screenResolution.width,
                height: fp.device.screenResolution.height,
                availWidth: fp.device.screenResolution.width,
                availHeight: fp.device.screenResolution.height - 40,
                colorDepth: fp.device.colorDepth,
                pixelDepth: fp.device.colorDepth
            },
            
            // WebGL overrides
            webgl: {
                vendor: fp.browser.webGL.vendor,
                renderer: fp.browser.webGL.renderer
            },
            
            // Timezone
            timezone: fp.device.timezone,
            timezoneOffset: fp.device.timezoneOffset,
            
            // Connection
            connection: {
                effectiveType: fp.network.effectiveType,
                downlink: fp.network.downlink,
                rtt: fp.network.rtt,
                saveData: fp.network.saveData
            }
        };
    }

    /**
     * Get active fingerprint
     */
    getActiveFingerprint(): NeuralFingerprint | null {
        return this.activeFingerprint;
    }

    /**
     * Update fingerprint stats
     */
    updateStats(updates: Partial<FingerprintStats>): void {
        if (this.activeFingerprint) {
            Object.assign(this.activeFingerprint.stats, updates);
        }
    }

    // Helper methods
    private pickRandom<T>(arr: readonly T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    private randomInRange(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    private generateHash(seed: string): string {
        return crypto
            .createHash('sha256')
            .update(seed + Math.random().toString())
            .digest('hex')
            .substring(0, 32);
    }

    private getTimezoneOffset(timezone: string): number {
        const offsets: Record<string, number> = {
            'Europe/Sofia': -120,
            'Europe/London': 0,
            'Europe/Berlin': -60,
            'America/New_York': 300,
            'America/Los_Angeles': 480,
            'Asia/Tokyo': -540
        };
        return offsets[timezone] || 0;
    }

    private getPlatformForCategory(): string {
        switch (this.config.deviceCategory) {
            case 'desktop':
            case 'laptop':
                return this.pickRandom(['Win32', 'MacIntel', 'Linux x86_64']);
            case 'tablet':
            case 'mobile':
                return this.pickRandom(['iPhone', 'iPad', 'Linux armv81']);
            default:
                return 'Win32';
        }
    }

    private detectVendorFromUA(ua: string): string {
        if (ua.includes('Chrome')) return 'Google Inc.';
        if (ua.includes('Firefox')) return '';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Apple Computer, Inc.';
        return 'Google Inc.';
    }

    private generateBuildId(): string {
        return Math.floor(Date.now() / 1000).toString();
    }
}

// ============================================================
// EXPORTS
// ============================================================

export function createNeuralFingerprinting(config?: Partial<FingerprintConfig>): NeuralFingerprintingEngine {
    return new NeuralFingerprintingEngine(config);
}

export type {
    NeuralFingerprint,
    DeviceFingerprint,
    BehavioralProfile,
    NetworkProfile,
    BrowserProfile,
    FingerprintConfig
};
