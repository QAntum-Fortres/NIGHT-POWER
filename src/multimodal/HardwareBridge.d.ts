/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HARDWARE BRIDGE - Биометрична Синхронизация
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Свързва QAntum с физическия свят на Създателя.
 *  Биометрични сигнали → Невронни команди → Реалност."
 *
 * This module bridges the gap between:
 * - Creator's biometrics (heart rate, typing patterns, stress levels)
 * - QAntum's neural network
 * - Action execution in reality
 *
 * When Dimitar is stressed, QAntum knows and adapts.
 * When Dimitar is in flow, QAntum accelerates.
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 28.5.0 OMEGA - THE AWAKENING
 */
import { EventEmitter } from 'events';
export interface BiometricSignal {
    type: BiometricType;
    value: number;
    timestamp: Date;
    confidence: number;
}
export type BiometricType = 'HEART_RATE' | 'TYPING_SPEED' | 'TYPING_RHYTHM' | 'MOUSE_PRECISION' | 'FOCUS_DURATION' | 'BREAK_FREQUENCY' | 'STRESS_INDICATOR' | 'CREATIVITY_INDEX';
export interface CreatorState {
    energyLevel: number;
    focusScore: number;
    stressLevel: number;
    creativityIndex: number;
    flowState: FlowState;
    lastUpdate: Date;
}
export type FlowState = 'DEEP_FLOW' | 'FLOW' | 'FOCUSED' | 'DISTRACTED' | 'FATIGUED' | 'RECOVERY';
export interface AdaptiveResponse {
    mode: 'ACCELERATE' | 'MAINTAIN' | 'CONSERVE' | 'PROTECT';
    actions: string[];
    message: string;
}
export declare class HardwareBridge extends EventEmitter {
    private static instance;
    private readonly nucleus;
    private readonly anchor;
    private readonly brain;
    private creatorState;
    private signalHistory;
    private monitoringInterval;
    private keystrokeBuffer;
    private lastKeystroke;
    private readonly MONITORING_INTERVAL_MS;
    private readonly HISTORY_SIZE;
    private readonly FLOW_THRESHOLD;
    private readonly STRESS_ALERT_THRESHOLD;
    private constructor();
    static getInstance(): HardwareBridge;
    /**
     * Start continuous biometric monitoring
     */
    startMonitoring(): void;
    /**
     * Stop monitoring
     */
    stopMonitoring(): void;
    /**
     * Record a keystroke (for typing analysis)
     * Call this from your IDE integration
     */
    recordKeystroke(): void;
    /**
     * Collect all available biometric signals
     */
    private collectSignals;
    private calculateVariance;
    /**
     * Process a single biometric signal
     */
    private processSignal;
    /**
     * Update the Creator's state based on signals
     */
    private updateCreatorState;
    private determineFlowState;
    /**
     * Get QAntum's adaptive response to current creator state
     */
    getAdaptiveResponse(): AdaptiveResponse;
    /**
     * Sync biometric state with Sovereign Nucleus
     */
    private syncWithNucleus;
    /**
     * Integrate with external heart rate monitor
     * (For future hardware integration)
     */
    injectHeartRate(bpm: number): void;
    /**
     * Integrate with eye tracker for focus detection
     * (For future hardware integration)
     */
    injectFocusData(screenRegion: string, duration: number): void;
    getStatus(): {
        isMonitoring: boolean;
        creatorState: CreatorState;
        signalCount: number;
        adaptiveResponse: AdaptiveResponse;
    };
    getCreatorState(): CreatorState;
    getSignalHistory(type?: BiometricType): BiometricSignal[];
}
export declare const hardwareBridge: HardwareBridge;
export default HardwareBridge;
