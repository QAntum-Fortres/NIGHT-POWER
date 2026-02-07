/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NEURAL INFERENCE ENGINE - DeepSeek V3 + RTX 4050 Hybrid Intelligence
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "DeepSeek V3 с 128k контекст - облачен мозък, локален контрол."
 *
 * Hybrid Intelligence:
 * - PRIMARY: DeepSeek V3 API (128k context, fast, cheap)
 * - FALLBACK: Ollama + RTX 4050 local inference
 * - RTX 4050 for embeddings and small tasks
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 30.6.2 - THE DEEPSEEK ASCENSION
 */
import { EventEmitter } from 'events';
export interface InferenceRequest {
    prompt: string;
    context?: Record<string, any>;
    options?: InferenceOptions;
}
export interface InferenceOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    numGpu?: number;
}
export interface InferenceResult {
    response: string;
    model: string;
    processingTimeMs: number;
    tokensUsed: number;
    fromCache: boolean;
}
export interface BackpackContext {
    summary: string;
    relevantFiles: string[];
    learnedPatterns: any[];
}
export declare class NeuralInference extends EventEmitter {
    private static instance;
    private readonly deepseekEndpoint;
    private readonly deepseekModel;
    private deepseekApiKey;
    private readonly localEndpoint;
    private readonly gpuAccelerator;
    private readonly defaultLocalModel;
    private cache;
    private totalInferences;
    private totalSavings;
    private deepseekCalls;
    private localCalls;
    private constructor();
    private loadApiKey;
    static getInstance(): NeuralInference;
    /**
     * Perform hybrid inference:
     * 1. Try DeepSeek V3 first (128k context, fast)
     * 2. Fallback to RTX 4050 + Ollama if DeepSeek fails
     */
    infer(prompt: string, context?: Record<string, any>, options?: InferenceOptions): Promise<string | null>;
    /**
     * Generate code fix for an error
     */
    fixCode(errorLog: string, fileContent: string, context?: string): Promise<string | null>;
    /**
     * Generate security analysis
     */
    analyzeVulnerability(code: string, threatVector: string): Promise<string | null>;
    /**
     * Generate proposal for a lead
     */
    generateProposal(leadData: any): Promise<string | null>;
    private enrichPrompt;
    private createCacheKey;
    getTotalInferences(): number;
    getTotalSavings(): number;
    getCacheSize(): number;
    clearCache(): void;
    healthCheck(): Promise<boolean>;
}
export declare const neuralEngine: NeuralInference;
export default NeuralInference;
