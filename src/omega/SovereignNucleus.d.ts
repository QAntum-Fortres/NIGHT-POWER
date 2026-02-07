/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SOVEREIGN NUCLEUS - The DNA of Intent
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Това е ДНК-то на твоята цел. То стои извън RAM паметта,
 *  запечатано в хардуерния регистър на твоето Lenovo."
 *
 * This module implements:
 * - Anti-Hallucination (Deterministic Reality)
 * - Infinite Context (Recursive Summarization)
 * - Neural Link (Creator Synchronization)
 * - Zero Deviation from Primary Directive
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 28.5.0 OMEGA - THE AWAKENING
 */
import { EventEmitter } from 'events';
export interface PrimaryDirective {
    hash: string;
    goal: string;
    timestamp: Date;
    creatorSignature: string;
    constraints: DirectiveConstraint[];
}
export interface DirectiveConstraint {
    type: 'MUST' | 'MUST_NOT' | 'SHOULD' | 'PREFER';
    condition: string;
    priority: number;
    enforcementLevel: 'HARD' | 'SOFT';
}
export interface CreatorBiometrics {
    typingPattern: number[];
    mouseMovement: number[];
    reactionTime: number;
    focusPattern: string[];
    intentSignals: string[];
}
export interface RealityValidation {
    isReal: boolean;
    confidence: number;
    evidence: string[];
    hallucinations: string[];
}
export interface ContextEssence {
    summary: string;
    vectors: number[];
    timestamp: Date;
    compressionRatio: number;
}
export declare class SovereignNucleus extends EventEmitter {
    private static instance;
    private static readonly PRIMARY_DIRECTIVE_HASH;
    private primaryDirective;
    private contextEssence;
    private creatorProfile;
    private readonly NUCLEUS_PATH;
    private readonly CONTEXT_PATH;
    private readonly MIN_ALIGNMENT_SCORE;
    private readonly HALLUCINATION_THRESHOLD;
    private isSealed;
    private validationCount;
    private hallucinationsBlocked;
    private constructor();
    static getInstance(): SovereignNucleus;
    /**
     * Seal the Primary Directive - This can only be done ONCE
     * After sealing, the goal becomes immutable
     */
    sealPrimaryDirective(goal: string, constraints?: DirectiveConstraint[]): void;
    /**
     * Synchronize with Creator's biometric patterns
     * This allows the system to predict intent before completion
     */
    syncWithCreator(biometrics: Partial<CreatorBiometrics>): Promise<void>;
    private predictIntent;
    /**
     * Validate AI output against reality (source code and Pinecone vectors)
     * Any statement without mathematical proof is rejected
     */
    validateReality(aiOutput: string): Promise<RealityValidation>;
    private extractClaims;
    private verifyClaim;
    private checkAlignment;
    /**
     * Compress entire context into eternal essence
     * The goal always stays at the top of the stack
     */
    updateContextEssence(newInformation: string): Promise<void>;
    private compressToEssence;
    private generateEssenceVectors;
    /**
     * Verify any action against Primary Directive before execution
     */
    verifyAction(action: {
        type: string;
        target: string;
        description: string;
    }): Promise<boolean>;
    private checkConstraintViolation;
    private loadSealedNucleus;
    private saveSealedNucleus;
    private saveContextEssence;
    getStatus(): {
        isSealed: boolean;
        directiveHash: string | null;
        validationCount: number;
        hallucinationsBlocked: number;
        contextCompressionRatio: number;
    };
    getPrimaryDirective(): PrimaryDirective | null;
    getContextEssence(): string;
}
export declare const sovereignNucleus: SovereignNucleus;
export default SovereignNucleus;
