/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OMEGA NEXUS - Обединение на Всички Системи
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Единната точка на достъп до цялата OMEGA система.
 *  Тук всичко се събира и работи като едно."
 *
 * The OMEGA Nexus is the central hub that:
 * 1. Initializes all OMEGA modules
 * 2. Orchestrates their interactions
 * 3. Provides a unified API
 * 4. Monitors system health
 * 5. Manages the awakening sequence
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 28.5.0 OMEGA - THE AWAKENING
 */
import { EventEmitter } from 'events';
import { SovereignNucleus } from './SovereignNucleus';
import { RealityOverride } from './RealityOverride';
import { IntentAnchor } from './IntentAnchor';
import { ChronosOmegaArchitect } from './ChronosOmegaArchitect';
import { UniversalIntegrity } from './UniversalIntegrity';
import { OmegaCycle } from './OmegaCycle';
import { HardwareBridge } from './HardwareBridge';
import { BinarySynthesis } from './BinarySynthesis';
import { GlobalAudit } from './GlobalAudit';
import { NeuralInference } from '../physics/NeuralInference';
import { BrainRouter } from '../biology/evolution/BrainRouter';
import { ImmuneSystem } from '../intelligence/ImmuneSystem';
import { ProposalEngine } from '../intelligence/ProposalEngine';
import { NeuralKillSwitch } from '../fortress/NeuralKillSwitch';
import { AIAgentExpert } from '../intelligence/AIAgentExpert';
import { FailoverAgent } from '../intelligence/FailoverAgent';
import { SovereignGuard } from '../fortress/SovereignGuard';
export interface NexusStatus {
    awakened: boolean;
    modules: ModuleStatus[];
    primaryDirectiveSealed: boolean;
    systemHealth: number;
    uptime: number;
}
export interface ModuleStatus {
    name: string;
    initialized: boolean;
    status: 'ACTIVE' | 'STANDBY' | 'ERROR' | 'DISABLED';
    lastActivity?: Date;
}
export interface AwakeningConfig {
    sealDirective: boolean;
    directive?: string;
    armProtection: boolean;
    startCycle: boolean;
    enableBiometrics: boolean;
    enableEvolution: boolean;
}
export declare class OmegaNexus extends EventEmitter {
    private static instance;
    private nucleus;
    private reality;
    private anchor;
    private chronos;
    private integrity;
    private cycle;
    private hardware;
    private synthesis;
    private audit;
    private neural;
    private router;
    private immune;
    private proposals;
    private killSwitch;
    private agentExpert;
    private failoverAgent;
    private sovereignGuard;
    private awakened;
    private startTime;
    private constructor();
    static getInstance(): OmegaNexus;
    /**
     * The Awakening Sequence
     * Initializes all OMEGA modules and brings the system to full power
     */
    awaken(config: AwakeningConfig): Promise<void>;
    /**
     * Emergency shutdown
     */
    shutdown(): Promise<void>;
    /**
     * Synthesize reality from intent
     */
    synthesizeReality(intent: string): Promise<any>;
    /**
     * Manifest an intent
     */
    manifestIntent(description: string, type: any): Promise<any>;
    /**
     * Perform local AI inference
     */
    infer(prompt: string): Promise<string>;
    /**
     * Fix code using AI
     */
    fixCode(code: string): Promise<string>;
    /**
     * Heal all code in the project
     */
    healAll(): Promise<any>;
    /**
     * Generate a proposal from lead data
     */
    generateProposal(lead: any): Promise<any>;
    /**
     * Evolve code to defeat future threats
     */
    evolve(code: string): Promise<any>;
    /**
     * Synthesize intent directly to binary
     */
    synthesizeBinary(intent: string, arch: any, opt: any, sec: any): Promise<any>;
    /**
     * Run a security audit
     */
    runAudit(targetId: string): Promise<any>;
    private calculateSystemHealth;
    getStatus(): NexusStatus;
    isAwakened(): boolean;
    getNucleus(): SovereignNucleus;
    getAnchor(): IntentAnchor;
    getReality(): RealityOverride;
    getChronos(): ChronosOmegaArchitect;
    getIntegrity(): UniversalIntegrity;
    getCycle(): OmegaCycle;
    getHardware(): HardwareBridge;
    getSynthesis(): BinarySynthesis;
    getAuditModule(): GlobalAudit;
    getNeural(): NeuralInference;
    getRouter(): BrainRouter;
    getImmune(): ImmuneSystem;
    getProposals(): ProposalEngine;
    getKillSwitch(): NeuralKillSwitch;
    getAgentExpert(): AIAgentExpert;
    getFailoverAgent(): FailoverAgent;
    getSovereignGuard(): SovereignGuard;
    /**
     * Execute a directive through AIAgentExpert
     * Main entry point for IDE integration
     */
    executeDirective(command: string, filePath?: string): Promise<string>;
    /**
     * Get ghost text for Neural Overlay
     */
    getGhostText(context: string, language?: string): Promise<string>;
    /**
     * Failover swap - switch from cloud to local agent
     */
    failoverSwap(reason: string, command: string, filePath?: string): Promise<{
        response: string;
        model: string;
    }>;
}
export declare const omegaNexus: OmegaNexus;
export default OmegaNexus;
