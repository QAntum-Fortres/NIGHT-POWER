/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHRONOS-OMEGA ARCHITECT - The Self-Evolving Intelligence Core
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Системата не просто се подобрява. Тя побеждава бъдещето."
 *
 * Mathematical Guarantee:
 * - Version N+1 is ALWAYS superior to Version N
 * - Code that cannot defeat future threats is NEVER born
 * - The RTX 4050 cycles until perfection is achieved
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 28.5.0 - THE AWAKENING
 */
import { EventEmitter } from 'events';
export interface CodeDNA {
    filePath: string;
    content: string;
    hash: string;
    metrics: CodeMetrics;
    generation: number;
}
export interface CodeMetrics {
    cyclomaticComplexity: number;
    predictiveCoverage: number;
    executionLatency: number;
    securityScore: number;
    futureProofIndex: number;
    linesOfCode: number;
    dependencies: number;
}
export interface EvolutionResult {
    success: boolean;
    generation: number;
    improvements: string[];
    metrics: {
        before: CodeMetrics;
        after: CodeMetrics;
    };
    futureThreatsDefeated: number;
    timestamp: Date;
}
export interface FutureThreat {
    id: string;
    name: string;
    category: 'quantum' | 'ai-attack' | 'zero-day' | 'supply-chain' | 'temporal';
    severity: number;
    yearOfOrigin: number;
    attackVector: string;
    defenseRequired: string;
}
export declare class ChronosOmegaArchitect extends EventEmitter {
    private static instance;
    private readonly EVOLUTION_THRESHOLD;
    private readonly MAX_MUTATIONS;
    private readonly FUTURE_HORIZON;
    private currentGeneration;
    private evolutionLog;
    private isEvolving;
    private constructor();
    static getInstance(): ChronosOmegaArchitect;
    /**
     * Initiates the Ascending Intelligence Loop
     * Code will evolve until it defeats all future threats
     */
    evolve(targetPath: string): Promise<EvolutionResult>;
    private extractCodeDNA;
    private analyzeFile;
    private generateFutureThreats;
    private mutate;
    private validateInPurgatory;
    private calculateMetrics;
    private validateImprovement;
    private calculateImprovements;
    private logMetrics;
    private applyEvolution;
    getEvolutionHistory(): EvolutionResult[];
    getCurrentGeneration(): number;
    isCurrentlyEvolving(): boolean;
}
export declare const chronosOmega: ChronosOmegaArchitect;
export default ChronosOmegaArchitect;
