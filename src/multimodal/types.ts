/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║   🛰️ COGNITIVE ARCHITECTURE TYPE DEFINITIONS                                  ║
 * ║   Version: 3.0.0-SINGULARITY                                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

export enum CognitiveActionType {
    AUTONOMOUS_THINK = 'autonomous-think',
    SELF_AUDIT = 'self-audit',
    VERIFY_SYMBOL = 'verify-symbol',
    LOOKUP_MAP = 'lookup-map',
    SELF_HEAL = 'self-heal',
    PATTERN_ANALYSIS = 'pattern-analysis',
    DECRYPT_VAULT = 'decrypt-vault',
    SWARM_TASK = 'swarm-task',
    NETWORK_RECON = 'network-recon',
    SELF_OPTIMIZE = 'self-optimize',
    PREDICT_RISK = 'predict-risk',
    ENGAGE_DEFENSE = 'engage-defense',
    SCAN_DEEPFAKE = 'scan-deepfake',
    SYNC_WEALTH = 'sync-wealth',
    ANALYZE_SIGNAL = 'analyze-signal'
}

export interface CognitiveAction {
    type: CognitiveActionType;
    payload: unknown;
    department?: string;
}

export interface CognitiveObservation {
    action: CognitiveActionType;
    result: unknown;
    timestamp: number;
    success: boolean;
    error?: string;
}

export interface ICognitiveModule {
    id: string;
    getName(): string;
    execute(action: CognitiveAction): Promise<CognitiveObservation>;
}

export interface CognitiveState {
    step: number;
    thought: string;
    action?: CognitiveAction;
    observation?: CognitiveObservation;
    reflection?: string;
}

export interface CognitiveBridgeConfig {
    maxIterations: number;
    temperature: number;
    abortOnError: boolean;
    enableLogging: boolean;
    enableEventBus: boolean;
}

export const DEFAULT_COGNITIVE_CONFIG: CognitiveBridgeConfig = {
    maxIterations: 10,
    temperature: 0.7,
    abortOnError: false,
    enableLogging: true,
    enableEventBus: true
};
