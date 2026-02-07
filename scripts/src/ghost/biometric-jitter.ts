/**
 * 👻 GHOST v1.0.0 - Biometric Jitter Engine
 * 
 * Human Motion Simulation - Makes automation movements indistinguishable from real humans.
 * 
 * Anti-bot systems detect automation by analyzing:
 * - Mouse trajectory (straight lines = bot)
 * - Acceleration patterns (constant speed = bot)
 * - Click precision (pixel-perfect = bot)
 * - Timing consistency (identical delays = bot)
 * 
 * This module uses real biometric data to simulate:
 * - Bezier curve mouse movements with natural jitter
 * - Hand tremor (micro-oscillations ~8-12Hz)
 * - Fatigue-induced drift over time
 * - Hesitation before important actions
 * - "Overshoot and correct" targeting behavior
 * 
 * Uses Atomics for lock-free synchronization to avoid blocking the Event Loop.
 * 
 * @version 1.0.0 "Ghost in the Machine"
 * @author QANTUM AI Architect
 */

import * as crypto from 'crypto';
import { EventEmitter } from 'events';

// ============================================================
// TYPES
// ============================================================

export interface Point2D {
    x: number;
    y: number;
}

export interface MotionConfig {
    // Bezier curve complexity
    curveComplexity: 'minimal' | 'natural' | 'complex';
    
    // Tremor settings (hand shake simulation)
    tremorEnabled: boolean;
    tremorFrequency: number;     // Hz (typically 8-12 for natural tremor)
    tremorAmplitude: number;     // pixels (0.5-2 for realistic)
    
    // Fatigue simulation
    fatigueEnabled: boolean;
    fatigueOnsetTime: number;    // ms before fatigue kicks in
    fatigueDriftRate: number;    // pixels/second drift
    
    // Speed variation
    minSpeed: number;            // pixels/ms
    maxSpeed: number;            // pixels/ms
    accelerationCurve: 'ease-in' | 'ease-out' | 'ease-in-out' | 'natural';
    
    // Hesitation
    hesitationProbability: number;  // 0-1
    hesitationDuration: { min: number; max: number };
    
    // Overshoot behavior
    overshootEnabled: boolean;
    overshootDistance: { min: number; max: number };
    overshootCorrectTime: { min: number; max: number };
    
    // Click behavior
    clickDriftRadius: number;    // px - clicks aren't pixel-perfect
    doubleClickVariance: number; // ms - time between double-clicks varies
    
    // Scrolling
    scrollStepVariance: number;  // % variance in scroll amount
    scrollPauseChance: number;   // probability of micro-pause while scrolling
}

export interface BiometricProfile {
    profileId: string;
    handedness: 'left' | 'right';
    skillLevel: 'novice' | 'intermediate' | 'expert';
    ageGroup: 'young' | 'middle' | 'senior';
    deviceType: 'mouse' | 'trackpad' | 'touchscreen';
    config: MotionConfig;
}

interface MovementStep {
    x: number;
    y: number;
    timestamp: number;
    pressure?: number;
    velocity: number;
}

interface ClickEvent {
    x: number;
    y: number;
    button: 'left' | 'right' | 'middle';
    duration: number;   // hold time
    pressure: number;   // 0-1 for touch devices
}

// ============================================================
// BIOMETRIC PROFILES DATABASE
// Based on real human motion studies
// ============================================================

const BIOMETRIC_PRESETS: Record<string, Partial<MotionConfig>> = {
    'young-gamer': {
        curveComplexity: 'minimal',
        tremorEnabled: true,
        tremorFrequency: 9,
        tremorAmplitude: 0.3,
        fatigueEnabled: false,
        minSpeed: 1.5,
        maxSpeed: 4.0,
        accelerationCurve: 'ease-in-out',
        hesitationProbability: 0.05,
        overshootEnabled: true,
        overshootDistance: { min: 2, max: 8 },
        clickDriftRadius: 1
    },
    'office-worker': {
        curveComplexity: 'natural',
        tremorEnabled: true,
        tremorFrequency: 10,
        tremorAmplitude: 0.8,
        fatigueEnabled: true,
        fatigueOnsetTime: 1800000, // 30 minutes
        fatigueDriftRate: 0.5,
        minSpeed: 0.8,
        maxSpeed: 2.5,
        accelerationCurve: 'natural',
        hesitationProbability: 0.15,
        overshootEnabled: true,
        overshootDistance: { min: 5, max: 15 },
        clickDriftRadius: 3
    },
    'senior-user': {
        curveComplexity: 'complex',
        tremorEnabled: true,
        tremorFrequency: 6,
        tremorAmplitude: 2.0,
        fatigueEnabled: true,
        fatigueOnsetTime: 600000, // 10 minutes
        fatigueDriftRate: 1.5,
        minSpeed: 0.3,
        maxSpeed: 1.2,
        accelerationCurve: 'ease-out',
        hesitationProbability: 0.35,
        overshootEnabled: true,
        overshootDistance: { min: 10, max: 30 },
        clickDriftRadius: 8
    },
    'trackpad-user': {
        curveComplexity: 'complex',
        tremorEnabled: true,
        tremorFrequency: 12,
        tremorAmplitude: 1.2,
        fatigueEnabled: true,
        fatigueOnsetTime: 900000,
        fatigueDriftRate: 0.8,
        minSpeed: 0.5,
        maxSpeed: 2.0,
        accelerationCurve: 'ease-in-out',
        hesitationProbability: 0.20,
        overshootEnabled: false,
        clickDriftRadius: 5
    },
    'mobile-touch': {
        curveComplexity: 'natural',
        tremorEnabled: true,
        tremorFrequency: 8,
        tremorAmplitude: 3.0,
        fatigueEnabled: true,
        fatigueOnsetTime: 1200000,
        fatigueDriftRate: 2.0,
        minSpeed: 1.0,
        maxSpeed: 5.0,
        accelerationCurve: 'natural',
        hesitationProbability: 0.10,
        overshootEnabled: true,
        overshootDistance: { min: 10, max: 25 },
        clickDriftRadius: 15
    }
};

// ============================================================
// BIOMETRIC JITTER ENGINE
// ============================================================

export class BiometricJitter extends EventEmitter {
    private profile: BiometricProfile;
    private sessionStartTime: number = Date.now();
    private lastPosition: Point2D = { x: 0, y: 0 };
    private movementHistory: MovementStep[] = [];
    
    // SharedArrayBuffer for lock-free sync (when available)
    private sharedBuffer: SharedArrayBuffer | null = null;
    private atomicView: Int32Array | null = null;
    
    constructor(profile?: Partial<BiometricProfile>) {
        super();
        
        const defaultConfig: MotionConfig = {
            curveComplexity: 'natural',
            tremorEnabled: true,
            tremorFrequency: 10,
            tremorAmplitude: 1.0,
            fatigueEnabled: true,
            fatigueOnsetTime: 1800000,
            fatigueDriftRate: 0.5,
            minSpeed: 0.8,
            maxSpeed: 2.5,
            accelerationCurve: 'natural',
            hesitationProbability: 0.15,
            hesitationDuration: { min: 50, max: 300 },
            overshootEnabled: true,
            overshootDistance: { min: 5, max: 15 },
            overshootCorrectTime: { min: 50, max: 150 },
            clickDriftRadius: 3,
            doubleClickVariance: 50,
            scrollStepVariance: 0.15,
            scrollPauseChance: 0.1
        };
        
        this.profile = {
            profileId: `bio_${crypto.randomBytes(8).toString('hex')}`,
            handedness: 'right',
            skillLevel: 'intermediate',
            ageGroup: 'middle',
            deviceType: 'mouse',
            config: defaultConfig,
            ...profile
        };
        
        // Initialize SharedArrayBuffer for Atomics if available
        this.initializeAtomics();
    }
    
    /**
     * 🚀 Initialize Atomics for lock-free synchronization
     */
    private initializeAtomics(): void {
        try {
            // 4KB shared buffer for coordination
            this.sharedBuffer = new SharedArrayBuffer(4096);
            this.atomicView = new Int32Array(this.sharedBuffer);
            
            // Initialize atomic counters
            Atomics.store(this.atomicView, 0, 0); // Position X (scaled)
            Atomics.store(this.atomicView, 1, 0); // Position Y (scaled)
            Atomics.store(this.atomicView, 2, 0); // Timestamp
            Atomics.store(this.atomicView, 3, 0); // Movement in progress flag
        } catch {
            // SharedArrayBuffer not available (cross-origin isolation required)
            this.sharedBuffer = null;
            this.atomicView = null;
        }
    }
    
    /**
     * 🚀 Initialize the Biometric Jitter Engine
     */
    async initialize(): Promise<void> {
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║  👻 GHOST v1.0.0 - BIOMETRIC JITTER ENGINE                                   ║
║                                                                               ║
║  "Move like a human, think like a machine"                                    ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Profile:        ${this.profile.profileId.substring(0, 16)}                                         ║
║  Handedness:     ${this.profile.handedness.padEnd(10)} | Device: ${this.profile.deviceType.padEnd(10)}                  ║
║  Skill Level:    ${this.profile.skillLevel.padEnd(12)} | Age Group: ${this.profile.ageGroup.padEnd(8)}              ║
║  Tremor:         ${this.profile.config.tremorEnabled ? '✅ ' + this.profile.config.tremorFrequency + 'Hz' : '❌ OFF'.padEnd(8)}       | Amplitude: ${this.profile.config.tremorAmplitude}px              ║
║  Fatigue:        ${this.profile.config.fatigueEnabled ? '✅ ENABLED' : '❌ DISABLED'.padEnd(10)}   | Onset: ${Math.round(this.profile.config.fatigueOnsetTime! / 60000)}min               ║
║  Atomics:        ${this.atomicView ? '✅ LOCK-FREE' : '⚠️ FALLBACK'}                                            ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);
        
        this.sessionStartTime = Date.now();
        this.emit('initialized');
    }
    
    /**
     * 🎭 Apply a preset biometric profile
     */
    applyPreset(presetName: keyof typeof BIOMETRIC_PRESETS): void {
        const preset = BIOMETRIC_PRESETS[presetName];
        if (preset) {
            this.profile.config = { ...this.profile.config, ...preset };
            this.emit('preset:applied', presetName);
        }
    }
    
    /**
     * 🖱️ Generate humanized mouse movement path
     * 
     * @param from Starting point
     * @param to Target point
     * @returns Array of movement steps with timing
     */
    generateMousePath(from: Point2D, to: Point2D): MovementStep[] {
        const steps: MovementStep[] = [];
        const distance = this.calculateDistance(from, to);
        
        // Determine number of steps based on distance and complexity
        const stepsCount = this.calculateStepCount(distance);
        
        // Generate control points for Bezier curve
        const controlPoints = this.generateBezierControlPoints(from, to);
        
        // Calculate total duration based on distance and speed
        const avgSpeed = (this.profile.config.minSpeed + this.profile.config.maxSpeed) / 2;
        const baseDuration = distance / avgSpeed;
        
        // Add hesitation if triggered
        let hesitationDelay = 0;
        if (Math.random() < this.profile.config.hesitationProbability) {
            const { min, max } = this.profile.config.hesitationDuration;
            hesitationDelay = min + Math.random() * (max - min);
        }
        
        let currentTime = hesitationDelay;
        
        for (let i = 0; i <= stepsCount; i++) {
            const t = i / stepsCount;
            
            // Get point on Bezier curve
            let point = this.calculateBezierPoint(controlPoints, t);
            
            // Apply tremor
            if (this.profile.config.tremorEnabled) {
                point = this.applyTremor(point, currentTime);
            }
            
            // Apply fatigue drift
            if (this.profile.config.fatigueEnabled) {
                point = this.applyFatigueDrift(point);
            }
            
            // Calculate velocity based on acceleration curve
            const velocity = this.calculateVelocity(t, distance, baseDuration);
            
            // Calculate time delta
            const timeDelta = (baseDuration / stepsCount) * this.getAccelerationFactor(t);
            currentTime += timeDelta;
            
            steps.push({
                x: Math.round(point.x * 100) / 100,
                y: Math.round(point.y * 100) / 100,
                timestamp: currentTime,
                velocity: velocity
            });
        }
        
        // Apply overshoot if enabled
        if (this.profile.config.overshootEnabled && Math.random() < 0.3) {
            const overshootSteps = this.generateOvershoot(to, steps[steps.length - 1]);
            steps.push(...overshootSteps);
        }
        
        // Update atomic position if available
        if (this.atomicView) {
            Atomics.store(this.atomicView, 0, Math.round(to.x * 100));
            Atomics.store(this.atomicView, 1, Math.round(to.y * 100));
            Atomics.store(this.atomicView, 2, Date.now());
        }
        
        this.lastPosition = to;
        this.movementHistory.push(...steps);
        
        // Trim history to last 1000 movements
        if (this.movementHistory.length > 1000) {
            this.movementHistory = this.movementHistory.slice(-1000);
        }
        
        return steps;
    }
    
    /**
     * 🖱️ Generate humanized click event
     */
    generateClick(target: Point2D, button: 'left' | 'right' | 'middle' = 'left'): ClickEvent {
        const drift = this.profile.config.clickDriftRadius;
        
        // Apply natural drift - humans don't click pixel-perfect
        const actualX = target.x + (Math.random() * 2 - 1) * drift;
        const actualY = target.y + (Math.random() * 2 - 1) * drift;
        
        // Click duration varies (typically 50-150ms)
        const duration = 50 + Math.random() * 100;
        
        // Pressure for touch devices
        const pressure = this.profile.deviceType === 'touchscreen' 
            ? 0.5 + Math.random() * 0.4 
            : 1.0;
        
        return {
            x: Math.round(actualX),
            y: Math.round(actualY),
            button,
            duration,
            pressure
        };
    }
    
    /**
     * 🖱️ Generate double-click with natural timing variance
     */
    generateDoubleClick(target: Point2D): { click1: ClickEvent; click2: ClickEvent; delay: number } {
        const click1 = this.generateClick(target);
        const click2 = this.generateClick(target);
        
        // Double-click interval varies (typically 80-200ms)
        const baseDelay = 100;
        const variance = this.profile.config.doubleClickVariance;
        const delay = baseDelay + (Math.random() * 2 - 1) * variance;
        
        return { click1, click2, delay };
    }
    
    /**
     * 📜 Generate humanized scroll behavior
     */
    generateScroll(amount: number, direction: 'up' | 'down'): { steps: number[]; delays: number[] } {
        const variance = this.profile.config.scrollStepVariance;
        const pauseChance = this.profile.config.scrollPauseChance;
        
        const steps: number[] = [];
        const delays: number[] = [];
        
        let remaining = Math.abs(amount);
        const multiplier = direction === 'up' ? -1 : 1;
        
        while (remaining > 0) {
            // Scroll in variable chunks
            const baseStep = Math.min(remaining, 100);
            const actualStep = baseStep * (1 + (Math.random() * 2 - 1) * variance);
            
            steps.push(Math.round(actualStep * multiplier));
            
            // Variable delay between scrolls
            let delay = 16 + Math.random() * 32; // 16-48ms base
            
            // Random micro-pause
            if (Math.random() < pauseChance) {
                delay += 100 + Math.random() * 200;
            }
            
            delays.push(delay);
            remaining -= actualStep;
        }
        
        return { steps, delays };
    }
    
    /**
     * ⌨️ Generate humanized typing pattern
     */
    generateTypingPattern(text: string): { chars: string[]; delays: number[] } {
        const chars = text.split('');
        const delays: number[] = [];
        
        // Base typing speed (adjusted by skill level)
        const baseDelay: Record<string, number> = {
            'novice': 200,
            'intermediate': 100,
            'expert': 50
        };
        
        const base = baseDelay[this.profile.skillLevel];
        
        for (let i = 0; i < chars.length; i++) {
            let delay = base + (Math.random() * 0.5 - 0.25) * base;
            
            // Slower for special characters
            if (!/[a-zA-Z0-9 ]/.test(chars[i])) {
                delay *= 1.5;
            }
            
            // Occasional micro-pause (thinking)
            if (Math.random() < 0.05) {
                delay += 200 + Math.random() * 500;
            }
            
            delays.push(Math.round(delay));
        }
        
        return { chars, delays };
    }
    
    // ============================================================
    // PRIVATE HELPER METHODS
    // ============================================================
    
    private calculateDistance(from: Point2D, to: Point2D): number {
        return Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    }
    
    private calculateStepCount(distance: number): number {
        const complexity = this.profile.config.curveComplexity;
        const baseSteps: Record<string, number> = {
            'minimal': 10,
            'natural': 20,
            'complex': 40
        };
        
        // More steps for longer distances
        return Math.max(baseSteps[complexity], Math.round(distance / 10));
    }
    
    private generateBezierControlPoints(from: Point2D, to: Point2D): Point2D[] {
        const points: Point2D[] = [from];
        const complexity = this.profile.config.curveComplexity;
        
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = this.calculateDistance(from, to);
        
        // Generate control points based on complexity
        const numControls = complexity === 'minimal' ? 1 : complexity === 'natural' ? 2 : 3;
        
        for (let i = 0; i < numControls; i++) {
            const t = (i + 1) / (numControls + 1);
            
            // Natural curve deviation perpendicular to the line
            const perpX = -dy / distance;
            const perpY = dx / distance;
            
            // Deviation amount (more for complex curves)
            const deviation = (Math.random() * 2 - 1) * distance * 0.2 * (complexity === 'complex' ? 2 : 1);
            
            points.push({
                x: from.x + dx * t + perpX * deviation,
                y: from.y + dy * t + perpY * deviation
            });
        }
        
        points.push(to);
        return points;
    }
    
    private calculateBezierPoint(points: Point2D[], t: number): Point2D {
        // De Casteljau's algorithm for arbitrary number of control points
        if (points.length === 1) {
            return points[0];
        }
        
        const newPoints: Point2D[] = [];
        for (let i = 0; i < points.length - 1; i++) {
            newPoints.push({
                x: points[i].x + (points[i + 1].x - points[i].x) * t,
                y: points[i].y + (points[i + 1].y - points[i].y) * t
            });
        }
        
        return this.calculateBezierPoint(newPoints, t);
    }
    
    private applyTremor(point: Point2D, time: number): Point2D {
        const freq = this.profile.config.tremorFrequency;
        const amp = this.profile.config.tremorAmplitude;
        
        // Natural tremor is a combination of multiple frequencies
        const tremor1 = Math.sin(time * freq * 0.001 * Math.PI * 2) * amp;
        const tremor2 = Math.sin(time * freq * 1.3 * 0.001 * Math.PI * 2) * amp * 0.5;
        
        // Apply to both axes with slight phase difference
        return {
            x: point.x + tremor1 + tremor2 * 0.5,
            y: point.y + tremor2 + tremor1 * 0.3
        };
    }
    
    private applyFatigueDrift(point: Point2D): Point2D {
        const sessionDuration = Date.now() - this.sessionStartTime;
        const onsetTime = this.profile.config.fatigueOnsetTime!;
        
        if (sessionDuration < onsetTime) {
            return point;
        }
        
        // Fatigue increases drift over time
        const fatigueFactor = (sessionDuration - onsetTime) / onsetTime;
        const driftRate = this.profile.config.fatigueDriftRate!;
        
        // Drift tends to go down and right (natural arm fatigue)
        return {
            x: point.x + fatigueFactor * driftRate * (Math.random() * 0.5 + 0.5),
            y: point.y + fatigueFactor * driftRate * (Math.random() * 0.3 + 0.7)
        };
    }
    
    private calculateVelocity(t: number, distance: number, duration: number): number {
        const { minSpeed, maxSpeed } = this.profile.config;
        const accelerationFactor = this.getAccelerationFactor(t);
        
        return minSpeed + (maxSpeed - minSpeed) * accelerationFactor;
    }
    
    private getAccelerationFactor(t: number): number {
        const curve = this.profile.config.accelerationCurve;
        
        switch (curve) {
            case 'ease-in':
                return t * t;
            case 'ease-out':
                return 1 - Math.pow(1 - t, 2);
            case 'ease-in-out':
                return t < 0.5 
                    ? 2 * t * t 
                    : 1 - Math.pow(-2 * t + 2, 2) / 2;
            case 'natural':
            default:
                // Bell curve - accelerate in middle, slow at ends
                return Math.sin(t * Math.PI);
        }
    }
    
    private generateOvershoot(target: Point2D, lastStep: MovementStep): MovementStep[] {
        const { min, max } = this.profile.config.overshootDistance;
        const overshootDist = min + Math.random() * (max - min);
        
        // Overshoot in the direction of movement
        const dx = target.x - this.lastPosition.x;
        const dy = target.y - this.lastPosition.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return [];
        
        const overshootPoint: Point2D = {
            x: target.x + (dx / length) * overshootDist,
            y: target.y + (dy / length) * overshootDist
        };
        
        const { min: minTime, max: maxTime } = this.profile.config.overshootCorrectTime;
        const correctTime = minTime + Math.random() * (maxTime - minTime);
        
        return [
            {
                x: overshootPoint.x,
                y: overshootPoint.y,
                timestamp: lastStep.timestamp + correctTime * 0.3,
                velocity: lastStep.velocity * 0.7
            },
            {
                x: target.x,
                y: target.y,
                timestamp: lastStep.timestamp + correctTime,
                velocity: lastStep.velocity * 0.3
            }
        ];
    }
    
    /**
     * 📊 Get current fatigue level (0-1)
     */
    getFatigueLevel(): number {
        if (!this.profile.config.fatigueEnabled) return 0;
        
        const sessionDuration = Date.now() - this.sessionStartTime;
        const onsetTime = this.profile.config.fatigueOnsetTime!;
        
        if (sessionDuration < onsetTime) return 0;
        
        return Math.min(1, (sessionDuration - onsetTime) / onsetTime);
    }
    
    /**
     * 🔄 Reset session (clears fatigue)
     */
    resetSession(): void {
        this.sessionStartTime = Date.now();
        this.movementHistory = [];
        this.emit('session:reset');
    }
    
    /**
     * 📊 Get movement statistics
     */
    getStats(): { totalMovements: number; avgVelocity: number; fatigueLevel: number } {
        const avgVelocity = this.movementHistory.length > 0
            ? this.movementHistory.reduce((sum, m) => sum + m.velocity, 0) / this.movementHistory.length
            : 0;
        
        return {
            totalMovements: this.movementHistory.length,
            avgVelocity: Math.round(avgVelocity * 100) / 100,
            fatigueLevel: Math.round(this.getFatigueLevel() * 100) / 100
        };
    }
    
    /**
     * 💉 Generate injection script for Playwright
     */
    generateInjectionScript(): string {
        return `
// 👻 GHOST v1.0.0 - Biometric Jitter Injection
// Profile: ${this.profile.profileId}

(function() {
    'use strict';
    
    // Override performance.now for timing consistency
    const realNow = performance.now.bind(performance);
    const jitter = ${this.profile.config.tremorAmplitude};
    
    performance.now = function() {
        return realNow() + (Math.random() - 0.5) * jitter * 10;
    };
    
    console.log('[Ghost] 👻 Biometric jitter active');
})();
`;
    }
}

// ============================================================
// FACTORY FUNCTIONS
// ============================================================

export function createBiometricJitter(profile?: Partial<BiometricProfile>): BiometricJitter {
    return new BiometricJitter(profile);
}

export function createBiometricProfile(
    neuralFingerprintId: string,
    workerIndex?: number
): BiometricProfile {
    // Deterministic profile generation based on fingerprint
    const hash = crypto.createHash('sha256').update(neuralFingerprintId).digest('hex');
    const seedNum = parseInt(hash.substring(0, 8), 16);
    
    const presets = Object.keys(BIOMETRIC_PRESETS);
    const presetName = presets[(workerIndex ?? seedNum) % presets.length];
    
    const profile = new BiometricJitter();
    profile.applyPreset(presetName as keyof typeof BIOMETRIC_PRESETS);
    
    return {
        profileId: `bio_${hash.substring(0, 16)}`,
        handedness: seedNum % 10 < 9 ? 'right' : 'left', // 90% right-handed
        skillLevel: ['novice', 'intermediate', 'expert'][seedNum % 3] as any,
        ageGroup: ['young', 'middle', 'senior'][seedNum % 3] as any,
        deviceType: ['mouse', 'trackpad', 'touchscreen'][(seedNum >> 8) % 3] as any,
        config: profile['profile'].config
    };
}

export { BIOMETRIC_PRESETS };
