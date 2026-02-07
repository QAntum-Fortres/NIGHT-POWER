/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FAILOVER AGENT - Sovereign Hot-Swap
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Когато облачният агент (Claude Opus) каже „Rate limit reached",
 *  QAntum поема щафетата без загуба на нито една милисекунда мисъл."
 *
 * The Sovereign Failover provides:
 * 1. Shadow Context Tracking - follows your work in real-time
 * 2. Hot-Swap Capability - seamless transition from cloud to local
 * 3. Zero Context Loss - preserves all previous interactions
 * 4. Hardware Acceleration - RTX 4050 for instant response
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 30.3.0 - THE SOVEREIGN FAILOVER
 */
import { EventEmitter } from 'events';
export interface FailoverState {
    isActive: boolean;
    lastCloudCommand: string;
    lastCloudResponse: string;
    switchedAt: Date | null;
    reason: FailoverReason;
    recoveryAttempts: number;
}
export type FailoverReason = 'RATE_LIMIT' | 'TIMEOUT' | 'NETWORK_ERROR' | 'CENSORSHIP' | 'MANUAL_SWITCH' | 'NONE';
export interface FailoverResult {
    success: boolean;
    response: string;
    model: string;
    latency: number;
    contextPreserved: boolean;
}
export declare class FailoverAgent extends EventEmitter {
    private static instance;
    private readonly expert;
    private readonly brain;
    private readonly hardware;
    private state;
    private readonly STATE_PATH;
    private constructor();
    static getInstance(): FailoverAgent;
    private loadState;
    private saveState;
    /**
     * Record a cloud command (call this while working with Claude)
     * This keeps the shadow context in sync
     */
    recordCloudInteraction(command: string, response?: string): void;
    /**
     * Take over from cloud agent
     * This is the main failover function
     */
    takeOver(reason: FailoverReason, lastCommand?: string, activeFilePath?: string): Promise<FailoverResult>;
    /**
     * Build a continuation prompt with full context
     */
    private buildContinuationPrompt;
    /**
     * Return control to cloud agent
     */
    returnToCloud(): void;
    /**
     * Quick swap - use when you hit rate limit
     * Just type: q-swap "continue from where we left off"
     */
    swap(command?: string): Promise<string>;
    /**
     * Check if failover is active
     */
    isActive(): boolean;
    /**
     * Get current state
     */
    getState(): FailoverState;
}
export declare const failoverAgent: FailoverAgent;
export default FailoverAgent;
