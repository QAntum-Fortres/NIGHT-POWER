/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   EMBEDDING ENGINE v1.0                                                       ║
 * ║   "Transforming Words into Vectors"                                           ║
 * ║                                                                               ║
 * ║   Universal Sentence Encoder wrapper for generating 512-dim embeddings        ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum Empire | Dimitar Prodromov                               ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */
import { EventEmitter } from 'events';
export interface EmbeddingEngineConfig {
    modelPath?: string;
    batchSize: number;
    cacheEnabled: boolean;
    maxCacheSize: number;
}
export type EmbeddingConfig = EmbeddingEngineConfig;
export type EmbedFunction = (texts: string[]) => Promise<number[][]>;
export interface EmbeddingResult {
    text: string;
    vector: number[];
    cached: boolean;
    timeMs: number;
}
export declare class EmbeddingEngine extends EventEmitter {
    private config;
    private model;
    private isLoading;
    private isReady;
    private cache;
    private stats;
    constructor(config?: Partial<EmbeddingEngineConfig>);
    /**
     * Load the Universal Sentence Encoder model
     */
    load(): Promise<void>;
    /**
     * Check if model is ready
     */
    ready(): boolean;
    /**
     * Wait for model to be ready
     */
    waitForReady(): Promise<void>;
    /**
     * Generate embedding for a single text
     */
    embed(text: string): Promise<number[]>;
    /**
     * Generate embeddings for multiple texts
     */
    embedBatch(texts: string[]): Promise<number[][]>;
    /**
     * Generate embedding with metadata
     */
    embedWithInfo(text: string): Promise<EmbeddingResult>;
    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(a: number[], b: number[]): number;
    /**
     * Calculate similarity between two texts
     */
    textSimilarity(text1: string, text2: string): Promise<number>;
    /**
     * Find most similar texts from a list
     */
    findMostSimilar(query: string, candidates: string[], topK?: number): Promise<Array<{
        text: string;
        score: number;
    }>>;
    private addToCache;
    /**
     * Clear the embedding cache
     */
    clearCache(): void;
    /**
     * Preload texts into cache
     */
    preloadCache(texts: string[]): Promise<void>;
    /**
     * Get engine statistics
     */
    getStats(): {
        isReady: boolean;
        embeddings: number;
        cacheHits: number;
        cacheSize: number;
        avgTimeMs: number;
        loadTimeMs: number;
        hitRate: number;
    };
}
/**
 * Get or create the singleton embedding engine
 */
export declare function getEmbeddingEngine(): Promise<EmbeddingEngine>;
/**
 * Create embed function for PineconeContextBridge
 */
export declare function createEmbedFunction(engine: EmbeddingEngine): (text: string) => Promise<number[]>;
export default EmbeddingEngine;
//# sourceMappingURL=EmbeddingEngine.d.ts.map