/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║           G E N E S I S   B R I D G E   A D A P T E R                         ║
 * ║        ИНТЕГРАЦИЯ НА GENESIS С ВЕЧНИЯ КОНТЕКСТ НА PINECONE                   ║
 * ║                                                                              ║
 * ║  "Реалностите се раждат от контекст. Контекстът е вечен."                    ║
 * ║  "Realities are born from context. Context is eternal."                      ║
 * ║                                                                              ║
 * ║  Purpose: Bridge between Genesis (OntoGenerator, PhenomenonWeaver) and       ║
 * ║           Pinecone eternal context, enabling:                                ║
 * ║           - Storage of generated axioms and realities as vectors             ║
 * ║           - Context-aware axiom generation based on historical data          ║
 * ║           - Self-optimizing reality synthesis from collective experience     ║
 * ║                                                                              ║
 * ║  © 2025-2026 QAntum Empire | Dimitar Prodromov                               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */
import { EventEmitter } from 'events';
import { BridgeSystem } from '../index.js';
export declare enum AxiomType {
    ONTOLOGICAL = "ONTOLOGICAL",
    LOGICAL = "LOGICAL",
    CAUSAL = "CAUSAL",
    TEMPORAL = "TEMPORAL",
    MODAL = "MODAL",
    META = "META",
    QUANTUM = "QUANTUM",
    TRANSCENDENT = "TRANSCENDENT",
    ENS_DERIVED = "ENS_DERIVED"
}
export interface Axiom {
    id: string;
    name: string;
    type: AxiomType;
    statement: string;
    formalNotation: string;
    consequences: string[];
    isConsistent: boolean;
    completenessStatus: 'complete' | 'incomplete' | 'godel-limited' | 'transcendent';
    selfReferenceLevel: number;
    createdAt: Date;
}
export interface AxiomSystem {
    id: string;
    name: string;
    axioms: Axiom[];
    derivedTheorems: string[];
    consistency: {
        isConsistent: boolean;
        proofMethod: string;
        godelNumber?: bigint;
    };
    completeness: {
        isComplete: boolean;
        undecidableStatements: string[];
    };
}
export interface GeneratedReality {
    realityId: string;
    name: string;
    axiomSystem: AxiomSystem;
    coherenceScore: number;
    createdAt: Date;
    metadata?: Record<string, any>;
}
export interface AxiomGenerationContext {
    failedAxioms: Axiom[];
    successfulAxioms: Axiom[];
    historicalPatterns: string[];
    avoidPatterns: string[];
    preferPatterns: string[];
}
export interface RealityEvaluation {
    realityId: string;
    performanceScore: number;
    stabilityScore: number;
    utilityScore: number;
    issues: string[];
    recommendations: string[];
    evaluatedAt: Date;
}
export interface GenesisBridgeConfig {
    bridgeSystem: BridgeSystem;
    sessionId?: string;
    enableContextualGeneration?: boolean;
    enableHistoricalAnalysis?: boolean;
    maxHistoricalAxioms?: number;
    minAxiomSimilarity?: number;
}
export declare class GenesisBridgeAdapter extends EventEmitter {
    private bridgeSystem;
    private magnet;
    private meditation;
    private sessionId;
    private config;
    private axiomCache;
    private realityCache;
    private metrics;
    constructor(config: GenesisBridgeConfig);
    /**
     * Store an axiom in eternal memory
     */
    storeAxiom(axiom: Axiom): Promise<string>;
    /**
     * Store multiple axioms
     */
    storeAxiomSystem(system: AxiomSystem): Promise<string[]>;
    /**
     * Retrieve similar axioms from eternal memory
     */
    findSimilarAxioms(query: string, options?: {
        type?: AxiomType;
        topK?: number;
        minScore?: number;
        excludeFailed?: boolean;
    }): Promise<Array<{
        axiom: Axiom;
        similarity: number;
    }>>;
    /**
     * Store a generated reality
     */
    storeReality(reality: GeneratedReality): Promise<void>;
    /**
     * Store reality evaluation/performance data
     */
    storeRealityEvaluation(evaluation: RealityEvaluation): Promise<void>;
    /**
     * Get context for axiom generation
     * This enables Genesis to learn from past failures and successes
     */
    getAxiomGenerationContext(intendedType: AxiomType, intendedStatement?: string): Promise<AxiomGenerationContext>;
    /**
     * Analyze axiom for potential issues before storing
     * Uses historical context to predict problems
     */
    analyzeAxiomBeforeGeneration(proposedAxiom: Partial<Axiom>): Promise<{
        isLikelySafe: boolean;
        confidence: number;
        warnings: string[];
        suggestions: string[];
        similarFailures: Axiom[];
    }>;
    /**
     * Suggest optimizations for a reality based on historical performance
     */
    suggestRealityOptimizations(realityId: string): Promise<{
        optimizations: string[];
        riskAssessment: string;
        historicalComparison: string;
        confidence: number;
    }>;
    /**
     * Convert axiom to searchable text
     */
    private axiomToText;
    /**
     * Convert reality to searchable text
     */
    private realityToText;
    /**
     * Parse axiom from vector match
     */
    private parseAxiomFromVector;
    /**
     * Get metrics
     */
    getMetrics(): {
        axiomsStored: number;
        realitiesStored: number;
        contextQueriesMade: number;
        contextEnrichedGenerations: number;
    };
    /**
     * Flush pending data
     */
    flush(): Promise<void>;
    /**
     * Start the adapter (starts magnet)
     */
    start(): void;
    /**
     * Stop the adapter
     */
    stop(): Promise<void>;
}
export declare function createGenesisBridgeAdapter(bridgeSystem: BridgeSystem, config?: Partial<GenesisBridgeConfig>): GenesisBridgeAdapter;
export default GenesisBridgeAdapter;
//# sourceMappingURL=GenesisBridgeAdapter.d.ts.map