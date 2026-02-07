/**
 * 🔐 NEURAL FINGERPRINT ACTIVATOR
 * 
 * v1.0.0.0 Future Practice: Activate unique behavioral profiles for ALL accounts
 * 
 * This module bridges the NeuralFingerprintingEngine with account databases,
 * ensuring every single account has its own unique behavioral DNA:
 * - Typing speed jitter (unique per-account variation)
 * - Mouse path randomness (bezier curve signatures)
 * - Scroll patterns (unique acceleration/deceleration)
 * - Click timing signatures
 * - Hesitation patterns
 * 
 * "Every account is a unique human - no two behave the same"
 * 
 * @version 1.0.0-QANTUM-PRIME
 * @phase Future Practices - Neural Activation Layer
 * @author QANTUM AI Architect
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

import { logger } from '../api/unified/utils/logger';
// ============================================================
// TYPES (v1.0.0.0 - Exported for strict mode compatibility)
// ============================================================

/**
 * 🧬 Behavioral Jitter Configuration
 * Defines the unique variance patterns for human-like behavior
 */
export interface IBehavioralJitter {
    /** Typing speed variance in milliseconds */
    typingSpeedVariance: number;
    /** Mouse inertia factor (0-1 scale) */
    mouseInertia: number;
    /** Click delay range [min, max] in ms */
    clickDelayRange: [number, number];
    /** Scroll speed variance */
    scrollSpeedVariance: number;
    /** Hesitation probability (0-1) */
    hesitationProbability: number;
}

/**
 * 🪪 Fingerprint Profile Interface
 * Complete behavioral profile for an account
 */
export interface IFingerprintProfile {
    id: string;
    identity: {
        userAgent: string;
        platform: string;
        language: string;
        timezone: string;
        screenResolution: [number, number];
    };
    behavior: IBehavioralJitter;
    isActivated: boolean;
    lastUsed: Date;
    usageCount: number;
    createdAt: Date;
}

/**
 * 🔄 Activation Options
 */
export interface IActivationOptions {
    regenerate?: boolean;
    validateExisting?: boolean;
    applyImmediately?: boolean;
    logActivation?: boolean;
}

/**
 * 📊 Activation Result
 */
export interface IActivationResult {
    success: boolean;
    profileId: string;
    message: string;
    profile?: IFingerprintProfile;
    previousProfile?: IFingerprintProfile;
}

export interface AccountBehavioralDNA {
    accountId: string;
    dnaHash: string;
    createdAt: number;
    lastActivated: number;
    
    // Typing fingerprint
    typing: TypingDNA;
    
    // Mouse fingerprint
    mouse: MouseDNA;
    
    // Interaction fingerprint
    interaction: InteractionDNA;
    
    // Session patterns
    session: SessionDNA;
    
    // Activation state
    activated: boolean;
    usageCount: number;
}

export interface TypingDNA {
    // Base words-per-minute with unique jitter
    baseWPM: number;
    wpmJitter: number;           // Unique variance per account
    
    // Key hold duration fingerprint
    keyHoldMean: number;         // ms
    keyHoldStdDev: number;       // Unique standard deviation
    
    // Inter-key interval
    keyIntervalMean: number;     // ms
    keyIntervalStdDev: number;   // Unique variation
    
    // Character-specific timing (unique per account)
    charTimingOffsets: Map<string, number>;  // 'a' -> +5ms, 'z' -> -3ms, etc.
    
    // Bigram timing (letter pairs)
    bigramTimings: Map<string, number>;      // 'th' -> faster, 'qp' -> slower
    
    // Error patterns
    errorProbability: number;
    commonMistakes: string[];     // ['teh' -> 'the', 'adn' -> 'and']
    correctionStyle: 'backspace-each' | 'backspace-all' | 'select-replace' | 'mixed';
    correctionDelay: number;      // ms before noticing error
    
    // Rhythm patterns
    burstLength: number;          // How many chars before micro-pause
    burstPauseDuration: number;   // Micro-pause duration
    fatigueOnset: number;         // After how many chars typing slows
    fatigueMultiplier: number;    // How much slower when fatigued
}

export interface MouseDNA {
    // Movement speed fingerprint
    baseSpeed: number;            // pixels/ms
    speedJitter: number;          // Unique variance
    
    // Acceleration profile
    accelerationCurve: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'custom';
    accelerationFactor: number;
    decelerationFactor: number;
    
    // Path generation (Bezier curve signatures)
    bezierControlPointJitter: number;  // How much control points deviate
    pathOvershootProbability: number;  // Probability of overshooting target
    overshootMagnitude: number;        // How far past target
    
    // Micro-movements (unique tremor signature)
    microMovementAmplitude: number;
    microMovementFrequency: number;
    
    // Click fingerprint
    clickDurationMean: number;
    clickDurationStdDev: number;
    doubleClickInterval: number;
    clickPositionJitter: number;  // Slight offset from exact target
    
    // Scroll fingerprint
    scrollStyle: 'smooth' | 'stepped' | 'inertial';
    scrollSpeedBase: number;
    scrollAcceleration: number;
    scrollOverscrollProbability: number;
    
    // Hover behavior
    hoverDwellTime: number;
    hoverMicroMovements: boolean;
}

export interface InteractionDNA {
    // Hesitation patterns
    hesitationProbability: number;
    hesitationDuration: { min: number; max: number };
    hesitationTriggers: string[];  // 'button', 'form', 'link'
    
    // Reading behavior
    readingSpeed: number;         // chars per second
    scanPattern: 'f-pattern' | 'z-pattern' | 'random' | 'sequential';
    regressionProbability: number; // Going back to re-read
    
    // Focus patterns
    focusShiftFrequency: number;
    tabSwitchingRate: number;
    multitaskingScore: number;
    
    // Reaction times
    reactionTimeBase: number;
    reactionTimeVariance: number;
    
    // Frustration signature
    frustrationThreshold: number;
    frustrationBehaviors: ('rapid-click' | 'erratic-mouse' | 'scroll-spam')[];
}

export interface SessionDNA {
    // Activity patterns
    activeHours: number[];        // Hours of day typically active (0-23)
    sessionDurationMean: number;
    sessionDurationStdDev: number;
    
    // Break patterns
    microBreakFrequency: number;  // Per hour
    microBreakDuration: number;
    longBreakThreshold: number;   // After how long to take break
    
    // Energy curve throughout session
    energyCurve: 'constant' | 'declining' | 'u-shaped' | 'variable';
    peakEnergyTime: number;       // Minutes into session
}

export interface ActivatorConfig {
    databasePath: string;
    autoActivateNewAccounts: boolean;
    persistProfiles: boolean;
    profileStoragePath: string;
    regenerateExisting: boolean;
    batchSize: number;
}

export interface ActivationReport {
    totalAccounts: number;
    newlyActivated: number;
    alreadyActivated: number;
    failed: number;
    duration: number;
    timestamp: number;
}

// ============================================================
// NEURAL FINGERPRINT ACTIVATOR ENGINE
// ============================================================

export class NeuralFingerprintActivator extends EventEmitter {
    private config: ActivatorConfig;
    private activatedProfiles: Map<string, AccountBehavioralDNA> = new Map();
    private profilesLoaded: boolean = false;

    // Genetic variation pools for realistic distribution
    private static readonly TYPING_WPM_DISTRIBUTION = {
        min: 15,
        max: 120,
        mean: 55,
        stdDev: 20
    };

    private static readonly COMMON_TYPOS: Array<[string, string]> = [
        ['teh', 'the'], ['adn', 'and'], ['taht', 'that'], ['wiht', 'with'],
        ['hte', 'the'], ['form', 'from'], ['yoru', 'your'], ['thier', 'their'],
        ['recieve', 'receive'], ['occured', 'occurred'], ['seperate', 'separate']
    ];

    private static readonly HESITATION_TRIGGERS = [
        'submit-button', 'payment-form', 'delete-action', 'external-link',
        'checkbox-agreement', 'dropdown-complex', 'date-picker', 'file-upload'
    ];

    constructor(config: Partial<ActivatorConfig> = {}) {
        super();

        this.config = {
            databasePath: './accounts-database.json',
            autoActivateNewAccounts: true,
            persistProfiles: true,
            profileStoragePath: './neural-profiles',
            regenerateExisting: false,
            batchSize: 100,
            ...config
        };
    }

    /**
     * 🚀 Initialize Neural Fingerprint Activator
     */
    async initialize(): Promise<void> {
        logger.debug(`
╔═══════════════════════════════════════════════════════════════╗
║  🔐 NEURAL FINGERPRINT ACTIVATOR v1.0.0.0                      ║
║                                                               ║
║  "Every account gets its unique behavioral DNA"               ║
╚═══════════════════════════════════════════════════════════════╝
`);

        // Load existing profiles if persistence enabled
        if (this.config.persistProfiles) {
            await this.loadPersistedProfiles();
        }

        logger.debug(`   📁 Storage: ${this.config.profileStoragePath}`);
        logger.debug(`   📊 Loaded profiles: ${this.activatedProfiles.size}`);
        logger.debug(`   🔄 Auto-activate: ${this.config.autoActivateNewAccounts}`);
    }

    /**
     * Load persisted profiles from disk
     */
    private async loadPersistedProfiles(): Promise<void> {
        const storagePath = this.config.profileStoragePath;
        
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
            return;
        }

        const files = fs.readdirSync(storagePath).filter(f => f.endsWith('.json'));
        
        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(storagePath, file), 'utf-8');
                const profile: AccountBehavioralDNA = JSON.parse(content);
                
                // Restore Maps from JSON
                profile.typing.charTimingOffsets = new Map(
                    Object.entries(profile.typing.charTimingOffsets || {})
                );
                profile.typing.bigramTimings = new Map(
                    Object.entries(profile.typing.bigramTimings || {})
                );
                
                this.activatedProfiles.set(profile.accountId, profile);
            } catch (e) {
                logger.warn(`   ⚠️ Failed to load profile: ${file}`);
            }
        }

        this.profilesLoaded = true;
    }

    /**
     * 🎯 Activate ALL accounts from database
     */
    async activateAllAccounts(accounts: Array<{ id: string; [key: string]: any }>): Promise<ActivationReport> {
        const startTime = Date.now();
        
        logger.debug(`\n🔐 Activating behavioral DNA for ${accounts.length} accounts...`);

        const report: ActivationReport = {
            totalAccounts: accounts.length,
            newlyActivated: 0,
            alreadyActivated: 0,
            failed: 0,
            duration: 0,
            timestamp: startTime
        };

        // Process in batches
        for (let i = 0; i < accounts.length; i += this.config.batchSize) {
            const batch = accounts.slice(i, i + this.config.batchSize);
            
            await Promise.all(batch.map(async (account) => {
                try {
                    const existing = this.activatedProfiles.get(account.id);
                    
                    if (existing && !this.config.regenerateExisting) {
                        report.alreadyActivated++;
                        return;
                    }

                    const dna = await this.generateBehavioralDNA(account.id);
                    this.activatedProfiles.set(account.id, dna);
                    
                    // Persist if enabled
                    if (this.config.persistProfiles) {
                        await this.persistProfile(dna);
                    }

                    report.newlyActivated++;
                } catch (e) {
                    report.failed++;
                }
            }));

            // Progress update
            const progress = Math.min(i + this.config.batchSize, accounts.length);
            const percent = Math.round((progress / accounts.length) * 100);
            process.stdout.write(`\r   Progress: ${percent}% (${progress}/${accounts.length})`);
        }

        report.duration = Date.now() - startTime;

        logger.debug(`\n
   ✅ Activation Complete!
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 Total:     ${report.totalAccounts}
   🆕 Activated: ${report.newlyActivated}
   ✓ Existing:  ${report.alreadyActivated}
   ❌ Failed:    ${report.failed}
   ⏱️ Duration:  ${report.duration}ms
`);

        this.emit('activation:complete', report);
        return report;
    }

    /**
     * 🧬 Generate unique behavioral DNA for account
     */
    async generateBehavioralDNA(accountId: string): Promise<AccountBehavioralDNA> {
        // Use accountId as seed for reproducible but unique randomness
        const seedHash = crypto.createHash('sha256').update(accountId).digest('hex');
        const seededRandom = this.createSeededRandom(seedHash);

        const dna: AccountBehavioralDNA = {
            accountId,
            dnaHash: crypto.createHash('sha256')
                .update(accountId + Date.now())
                .digest('hex'),
            createdAt: Date.now(),
            lastActivated: Date.now(),
            typing: this.generateTypingDNA(seededRandom),
            mouse: this.generateMouseDNA(seededRandom),
            interaction: this.generateInteractionDNA(seededRandom),
            session: this.generateSessionDNA(seededRandom),
            activated: true,
            usageCount: 0
        };

        this.emit('dna:generated', { accountId, dnaHash: dna.dnaHash });
        return dna;
    }

    /**
     * ⌨️ Generate unique typing DNA
     */
    private generateTypingDNA(random: () => number): TypingDNA {
        const baseWPM = this.gaussianRandom(
            random,
            NeuralFingerprintActivator.TYPING_WPM_DISTRIBUTION.mean,
            NeuralFingerprintActivator.TYPING_WPM_DISTRIBUTION.stdDev
        );

        // Generate unique character timing offsets
        const charTimingOffsets = new Map<string, number>();
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for (const char of chars) {
            // Each character has unique timing offset (-30ms to +30ms)
            charTimingOffsets.set(char, (random() - 0.5) * 60);
        }

        // Generate bigram timings
        const bigramTimings = new Map<string, number>();
        const commonBigrams = ['th', 'he', 'in', 'er', 'an', 'on', 'en', 'at', 'es', 'ed',
                               'or', 'ti', 'is', 'it', 'al', 'as', 'ha', 'ng', 'nd', 're'];
        for (const bigram of commonBigrams) {
            // Each bigram pair has unique timing
            bigramTimings.set(bigram, 80 + (random() * 80));
        }

        // Select common mistakes for this account
        const mistakeCount = Math.floor(random() * 5) + 2;
        const commonMistakes = this.shuffleArray(
            [...NeuralFingerprintActivator.COMMON_TYPOS],
            random
        ).slice(0, mistakeCount).map(([typo]) => typo);

        return {
            baseWPM: Math.max(15, Math.min(120, baseWPM)),
            wpmJitter: random() * 15 + 3,
            keyHoldMean: 80 + random() * 60,
            keyHoldStdDev: 15 + random() * 25,
            keyIntervalMean: 100 + random() * 80,
            keyIntervalStdDev: 20 + random() * 40,
            charTimingOffsets,
            bigramTimings,
            errorProbability: 0.01 + random() * 0.08,
            commonMistakes,
            correctionStyle: this.pickRandomWeighted(random, [
                ['backspace-each', 0.4],
                ['backspace-all', 0.3],
                ['select-replace', 0.15],
                ['mixed', 0.15]
            ]) as TypingDNA['correctionStyle'],
            correctionDelay: 200 + random() * 800,
            burstLength: Math.floor(5 + random() * 20),
            burstPauseDuration: 50 + random() * 200,
            fatigueOnset: Math.floor(200 + random() * 500),
            fatigueMultiplier: 1.1 + random() * 0.4
        };
    }

    /**
     * 🖱️ Generate unique mouse DNA
     */
    private generateMouseDNA(random: () => number): MouseDNA {
        return {
            baseSpeed: 400 + random() * 1200,
            speedJitter: 50 + random() * 150,
            accelerationCurve: this.pickRandomWeighted(random, [
                ['ease-in-out', 0.4],
                ['ease-out', 0.25],
                ['ease-in', 0.15],
                ['linear', 0.1],
                ['custom', 0.1]
            ]) as MouseDNA['accelerationCurve'],
            accelerationFactor: 1.2 + random() * 1.5,
            decelerationFactor: 0.7 + random() * 0.5,
            bezierControlPointJitter: 10 + random() * 40,
            pathOvershootProbability: random() * 0.15,
            overshootMagnitude: 5 + random() * 25,
            microMovementAmplitude: 0.5 + random() * 2,
            microMovementFrequency: 0.02 + random() * 0.08,
            clickDurationMean: 70 + random() * 80,
            clickDurationStdDev: 15 + random() * 30,
            doubleClickInterval: 200 + random() * 250,
            clickPositionJitter: random() * 5,
            scrollStyle: this.pickRandomWeighted(random, [
                ['smooth', 0.4],
                ['stepped', 0.35],
                ['inertial', 0.25]
            ]) as MouseDNA['scrollStyle'],
            scrollSpeedBase: 100 + random() * 200,
            scrollAcceleration: 1 + random() * 0.5,
            scrollOverscrollProbability: random() * 0.2,
            hoverDwellTime: 200 + random() * 600,
            hoverMicroMovements: random() > 0.5
        };
    }

    /**
     * 🎯 Generate unique interaction DNA
     */
    private generateInteractionDNA(random: () => number): InteractionDNA {
        // Select hesitation triggers for this account
        const triggerCount = Math.floor(random() * 4) + 2;
        const hesitationTriggers = this.shuffleArray(
            [...NeuralFingerprintActivator.HESITATION_TRIGGERS],
            random
        ).slice(0, triggerCount);

        // Select frustration behaviors
        const frustrationBehaviors: InteractionDNA['frustrationBehaviors'] = [];
        if (random() > 0.3) frustrationBehaviors.push('rapid-click');
        if (random() > 0.4) frustrationBehaviors.push('erratic-mouse');
        if (random() > 0.5) frustrationBehaviors.push('scroll-spam');

        return {
            hesitationProbability: 0.05 + random() * 0.25,
            hesitationDuration: {
                min: 200 + random() * 300,
                max: 800 + random() * 1200
            },
            hesitationTriggers,
            readingSpeed: 150 + random() * 350,
            scanPattern: this.pickRandomWeighted(random, [
                ['f-pattern', 0.4],
                ['z-pattern', 0.25],
                ['sequential', 0.25],
                ['random', 0.1]
            ]) as InteractionDNA['scanPattern'],
            regressionProbability: random() * 0.15,
            focusShiftFrequency: 0.5 + random() * 2,
            tabSwitchingRate: random() * 0.1,
            multitaskingScore: random(),
            reactionTimeBase: 150 + random() * 300,
            reactionTimeVariance: 30 + random() * 70,
            frustrationThreshold: 3 + Math.floor(random() * 7),
            frustrationBehaviors
        };
    }

    /**
     * 📅 Generate unique session DNA
     */
    private generateSessionDNA(random: () => number): SessionDNA {
        // Generate active hours (when this account is typically online)
        const activeHours: number[] = [];
        const startHour = Math.floor(random() * 12) + 6; // 6 AM - 6 PM start
        const activeSpan = Math.floor(random() * 8) + 4;  // 4-12 hour span
        for (let h = 0; h < activeSpan; h++) {
            activeHours.push((startHour + h) % 24);
        }

        return {
            activeHours,
            sessionDurationMean: (20 + random() * 100) * 60 * 1000, // 20-120 minutes
            sessionDurationStdDev: (5 + random() * 30) * 60 * 1000,
            microBreakFrequency: 2 + random() * 6,
            microBreakDuration: 5000 + random() * 30000,
            longBreakThreshold: (30 + random() * 60) * 60 * 1000,
            energyCurve: this.pickRandomWeighted(random, [
                ['declining', 0.35],
                ['u-shaped', 0.25],
                ['constant', 0.25],
                ['variable', 0.15]
            ]) as SessionDNA['energyCurve'],
            peakEnergyTime: random() * 30 * 60 * 1000 // First 30 minutes
        };
    }

    /**
     * 🔍 Get behavioral DNA for account
     */
    getAccountDNA(accountId: string): AccountBehavioralDNA | undefined {
        return this.activatedProfiles.get(accountId);
    }

    /**
     * 🎲 Simulate typing sequence with account's DNA
     */
    simulateTypingSequence(accountId: string, text: string): Array<{ char: string; timestamp: number; keyHoldDuration: number }> {
        const dna = this.activatedProfiles.get(accountId);
        if (!dna) {
            throw new Error(`Account ${accountId} not activated`);
        }

        const sequence: Array<{ char: string; timestamp: number; keyHoldDuration: number }> = [];
        let currentTime = 0;
        let charsSinceLastPause = 0;
        let totalCharsTyped = 0;

        for (let i = 0; i < text.length; i++) {
            const char = text[i].toLowerCase();
            const prevChar = i > 0 ? text[i - 1].toLowerCase() : '';
            const bigram = prevChar + char;

            // Base interval with account-specific jitter
            let interval = dna.typing.keyIntervalMean +
                (Math.random() - 0.5) * dna.typing.keyIntervalStdDev * 2;

            // Apply character-specific timing offset
            const charOffset = dna.typing.charTimingOffsets.get(char) || 0;
            interval += charOffset;

            // Apply bigram timing if exists
            const bigramTiming = dna.typing.bigramTimings.get(bigram);
            if (bigramTiming) {
                interval = bigramTiming + (Math.random() - 0.5) * 30;
            }

            // Apply fatigue multiplier
            if (totalCharsTyped > dna.typing.fatigueOnset) {
                interval *= dna.typing.fatigueMultiplier;
            }

            // Burst pause
            charsSinceLastPause++;
            if (charsSinceLastPause >= dna.typing.burstLength) {
                interval += dna.typing.burstPauseDuration;
                charsSinceLastPause = 0;
            }

            currentTime += Math.max(30, interval);
            totalCharsTyped++;

            // Key hold duration with account-specific variance
            const keyHoldDuration = dna.typing.keyHoldMean +
                (Math.random() - 0.5) * dna.typing.keyHoldStdDev * 2;

            sequence.push({
                char: text[i],
                timestamp: currentTime,
                keyHoldDuration: Math.max(30, keyHoldDuration)
            });
        }

        return sequence;
    }

    /**
     * 🖱️ Simulate mouse path with account's DNA
     */
    simulateMousePath(
        accountId: string,
        from: { x: number; y: number },
        to: { x: number; y: number }
    ): Array<{ x: number; y: number; timestamp: number }> {
        const dna = this.activatedProfiles.get(accountId);
        if (!dna) {
            throw new Error(`Account ${accountId} not activated`);
        }

        const path: Array<{ x: number; y: number; timestamp: number }> = [];
        const distance = Math.hypot(to.x - from.x, to.y - from.y);
        
        // Calculate duration based on account's speed
        const baseDuration = distance / dna.mouse.baseSpeed * 1000;
        const duration = baseDuration + (Math.random() - 0.5) * dna.mouse.speedJitter;

        // Generate bezier control points with account-specific jitter
        const jitter = dna.mouse.bezierControlPointJitter;
        const cp1 = {
            x: from.x + (to.x - from.x) * 0.25 + (Math.random() - 0.5) * jitter,
            y: from.y + (to.y - from.y) * 0.25 + (Math.random() - 0.5) * jitter
        };
        const cp2 = {
            x: from.x + (to.x - from.x) * 0.75 + (Math.random() - 0.5) * jitter,
            y: from.y + (to.y - from.y) * 0.75 + (Math.random() - 0.5) * jitter
        };

        // Generate points along bezier curve
        const steps = Math.max(10, Math.floor(duration / 16)); // ~60fps
        for (let i = 0; i <= steps; i++) {
            let t = i / steps;

            // Apply acceleration curve
            switch (dna.mouse.accelerationCurve) {
                case 'ease-in':
                    t = t * t;
                    break;
                case 'ease-out':
                    t = 1 - (1 - t) * (1 - t);
                    break;
                case 'ease-in-out':
                    t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                    break;
            }

            // Cubic bezier calculation
            const mt = 1 - t;
            let x = mt * mt * mt * from.x +
                    3 * mt * mt * t * cp1.x +
                    3 * mt * t * t * cp2.x +
                    t * t * t * to.x;
            let y = mt * mt * mt * from.y +
                    3 * mt * mt * t * cp1.y +
                    3 * mt * t * t * cp2.y +
                    t * t * t * to.y;

            // Add micro-movements (unique tremor)
            if (dna.mouse.hoverMicroMovements && Math.random() < dna.mouse.microMovementFrequency) {
                x += (Math.random() - 0.5) * dna.mouse.microMovementAmplitude;
                y += (Math.random() - 0.5) * dna.mouse.microMovementAmplitude;
            }

            path.push({
                x: Math.round(x),
                y: Math.round(y),
                timestamp: Math.round(i * (duration / steps))
            });
        }

        // Apply overshoot if configured
        if (Math.random() < dna.mouse.pathOvershootProbability) {
            const overshoot = dna.mouse.overshootMagnitude;
            const dirX = (to.x - from.x) / distance;
            const dirY = (to.y - from.y) / distance;
            
            // Add overshoot point
            path.push({
                x: Math.round(to.x + dirX * overshoot),
                y: Math.round(to.y + dirY * overshoot),
                timestamp: Math.round(duration + 50)
            });
            
            // Return to target
            path.push({
                x: to.x,
                y: to.y,
                timestamp: Math.round(duration + 150)
            });
        }

        return path;
    }

    /**
     * 💾 Persist profile to disk
     */
    private async persistProfile(dna: AccountBehavioralDNA): Promise<void> {
        const storagePath = this.config.profileStoragePath;
        
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }

        // Convert Maps to objects for JSON serialization
        const serializable = {
            ...dna,
            typing: {
                ...dna.typing,
                charTimingOffsets: Object.fromEntries(dna.typing.charTimingOffsets),
                bigramTimings: Object.fromEntries(dna.typing.bigramTimings)
            }
        };

        const filePath = path.join(storagePath, `${dna.accountId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(serializable, null, 2));
    }

    /**
     * 📊 Get activation statistics
     */
    getStats(): {
        totalActivated: number;
        avgTypingWPM: number;
        avgMouseSpeed: number;
        profileDistribution: Record<string, number>;
    } {
        const profiles = Array.from(this.activatedProfiles.values());
        
        const avgTypingWPM = profiles.length > 0
            ? profiles.reduce((sum, p) => sum + p.typing.baseWPM, 0) / profiles.length
            : 0;
            
        const avgMouseSpeed = profiles.length > 0
            ? profiles.reduce((sum, p) => sum + p.mouse.baseSpeed, 0) / profiles.length
            : 0;

        // Categorize typing speeds
        const distribution: Record<string, number> = {
            slow: 0,      // < 30 WPM
            average: 0,   // 30-60 WPM
            fast: 0,      // 60-90 WPM
            expert: 0     // > 90 WPM
        };

        for (const profile of profiles) {
            if (profile.typing.baseWPM < 30) distribution.slow++;
            else if (profile.typing.baseWPM < 60) distribution.average++;
            else if (profile.typing.baseWPM < 90) distribution.fast++;
            else distribution.expert++;
        }

        return {
            totalActivated: profiles.length,
            avgTypingWPM: Math.round(avgTypingWPM),
            avgMouseSpeed: Math.round(avgMouseSpeed),
            profileDistribution: distribution
        };
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================

    private createSeededRandom(seed: string): () => number {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        return () => {
            hash = Math.sin(hash) * 10000;
            return hash - Math.floor(hash);
        };
    }

    private gaussianRandom(random: () => number, mean: number, stdDev: number): number {
        const u1 = random();
        const u2 = random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return mean + z0 * stdDev;
    }

    private pickRandomWeighted<T>(random: () => number, options: Array<[T, number]>): T {
        const total = options.reduce((sum, [, weight]) => sum + weight, 0);
        let r = random() * total;
        
        for (const [value, weight] of options) {
            r -= weight;
            if (r <= 0) return value;
        }
        
        return options[options.length - 1][0];
    }

    private shuffleArray<T>(array: T[], random: () => number): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}

// ============================================================
// EXPORTS
// ============================================================

export function createNeuralFingerprintActivator(config?: Partial<ActivatorConfig>): NeuralFingerprintActivator {
    return new NeuralFingerprintActivator(config);
}

// Note: All types are already exported at their definitions above (v1.0.0.0)
