/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * REALITY OVERRIDE ENGINE - Temporal Inversion Logic
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Този модул не съществува като статичен код.
 *  Той се генерира в RAM паметта на RTX 4050 на всеки 100ms."
 *
 * This is the module that makes QAntum "невиждано" (unseen):
 * - Code that doesn't "execute" but "happens"
 * - Temporal Inversion: Fix the past to prevent future attacks
 * - Reality Manifestation: Transform Intent into actual system changes
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 28.5.0 OMEGA - THE AWAKENING
 */
import { EventEmitter } from 'events';
export interface Intent {
    id: string;
    goal: string;
    priority: 'ABSOLUTE' | 'HIGH' | 'MEDIUM' | 'LOW';
    type: IntentType;
    constraints: string[];
    deadline?: Date;
}
export type IntentType = 'ABSOLUTE_STEALTH' | 'ECONOMIC_SOVEREIGNTY' | 'TEMPORAL_DEFENSE' | 'REALITY_SYNTHESIS' | 'SYSTEM_EVOLUTION' | 'GLOBAL_AUDIT';
export interface TemporalThreat {
    id: string;
    name: string;
    predictedDate: Date;
    severity: number;
    attackVector: string;
    preventionStrategy: string;
}
export interface RealityManifest {
    intentId: string;
    success: boolean;
    changes: RealityChange[];
    temporalAdjustments: number;
    timestamp: Date;
}
export interface RealityChange {
    target: string;
    type: 'FILE' | 'MEMORY' | 'NETWORK' | 'PROCESS' | 'KERNEL';
    before: string;
    after: string;
    reason: string;
}
export declare class RealityOverride extends EventEmitter {
    private static instance;
    private readonly nucleus;
    private readonly UPDATE_INTERVAL;
    private activeIntents;
    private temporalThreats;
    private manifestLog;
    private isRunning;
    private cycleCount;
    private constructor();
    static getInstance(): RealityOverride;
    /**
     * Manifest an Intent into Reality
     * This is where thoughts become code, and code becomes reality
     */
    manifestIntent(goal: string, type?: IntentType): Promise<RealityManifest>;
    /**
     * Scan future timeline for threats
     * Uses Chronos-Omega to simulate attacks that haven't been invented yet
     */
    private scanFutureTimeline;
    /**
     * Prevent future threats by modifying present code
     * This is Temporal Inversion in action
     */
    private preventFutureThreats;
    private generateDefensiveCode;
    /**
     * ABSOLUTE_STEALTH - Complete system invisibility
     */
    private executeStealthProtocol;
    /**
     * ECONOMIC_SOVEREIGNTY - Financial independence
     */
    private executeEconomicProtocol;
    /**
     * TEMPORAL_DEFENSE - Defense against future threats
     */
    private executeTemporalDefense;
    /**
     * REALITY_SYNTHESIS - Create new functionality from intent
     */
    private executeSynthesis;
    private parseGoalToComponents;
    /**
     * SYSTEM_EVOLUTION - Self-improvement cycle
     */
    private executeEvolution;
    /**
     * GLOBAL_AUDIT - Scan external systems
     */
    private executeGlobalAudit;
    private verifyEconomicSovereignty;
    /**
     * Start the continuous reality override loop
     * Reality is refreshed every 100ms
     */
    startRealityLoop(): void;
    stopRealityLoop(): void;
    private realityLoop;
    getStatus(): {
        isRunning: boolean;
        cycleCount: number;
        activeIntents: number;
        temporalThreats: number;
        manifestCount: number;
    };
    getManifestLog(): RealityManifest[];
}
export declare const realityOverride: RealityOverride;
export default RealityOverride;
