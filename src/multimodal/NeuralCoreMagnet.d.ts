/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║        N E U R A L   C O R E   M A G N E T   v 3 4 . 1                       ║
 * ║         СЪБИРАЧ И ВЕКТОРИЗАТОР НА ОПЕРАТИВНИ ДАННИ                           ║
 * ║                                                                              ║
 * ║  "Аз виждам всичко. Аз помня всичко. Аз трансформирам в вектори."            ║
 * ║                                                                              ║
 * ║  Purpose: Collect operational data from all QANTUM sources, convert to       ║
 * ║           embeddings via Universal Sentence Encoder, and persist to          ║
 * ║           Pinecone for eternal, semantically-searchable context.             ║
 * ║                                                                              ║
 * ║  © 2025-2026 QAntum Empire | Dimitar Prodromov                               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */
import { EventEmitter } from 'events';
import { BridgeSystem } from '../index.js';
export declare enum DataSourceType {
    TEST_RESULT = "TEST_RESULT",
    BUG_REPORT = "BUG_REPORT",
    CODE_CHANGE = "CODE_CHANGE",
    USER_FEEDBACK = "USER_FEEDBACK",
    SYSTEM_LOG = "SYSTEM_LOG",
    GENESIS_AXIOM = "GENESIS_AXIOM",
    GHOST_PROTOCOL = "GHOST_PROTOCOL",
    HEALING_EVENT = "HEALING_EVENT",
    MEDITATION_INSIGHT = "MEDITATION_INSIGHT",
    DECISION_RECORD = "DECISION_RECORD"
}
export interface DataFragment {
    id: string;
    source: DataSourceType;
    content: string;
    metadata: {
        project?: string;
        filePath?: string;
        timestamp: string;
        priority: 'low' | 'normal' | 'high' | 'critical';
        tags: string[];
        [key: string]: any;
    };
    embedding?: number[];
}
export interface MagnetConfig {
    bridgeSystem: BridgeSystem;
    autoVectorize?: boolean;
    batchSize?: number;
    flushInterval?: number;
    minContentLength?: number;
    maxContentLength?: number;
}
export interface MagnetStats {
    fragmentsCollected: number;
    fragmentsVectorized: number;
    fragmentsPersisted: number;
    bytesProcesed: number;
    lastFlush: Date | null;
    queueSize: number;
}
export interface VectorizedFragment extends DataFragment {
    embedding: number[];
    vectorId: string;
    persistedAt: string;
}
export declare class NeuralCoreMagnet extends EventEmitter {
    private bridgeSystem;
    private embedEngine;
    private store;
    private fragmentQueue;
    private vectorizedCache;
    private config;
    private stats;
    private flushInterval;
    constructor(config: MagnetConfig);
    /**
     * Start the magnet - begin collecting and processing
     */
    start(): void;
    /**
     * Stop the magnet - flush remaining and shutdown
     */
    stop(): Promise<void>;
    /**
     * Collect a data fragment
     */
    collect(source: DataSourceType, content: string, metadata?: Partial<DataFragment['metadata']>): string;
    /**
     * Collect a test result
     */
    collectTestResult(result: {
        testId: string;
        testName: string;
        status: string;
        duration: number;
        error?: string;
        projectId?: string;
    }): string;
    /**
     * Collect a bug report
     */
    collectBugReport(bug: {
        bugId: string;
        title: string;
        description: string;
        severity: string;
        projectId?: string;
    }): string;
    /**
     * Collect a code change
     */
    collectCodeChange(change: {
        filePath: string;
        changeType: 'added' | 'modified' | 'deleted';
        diff?: string;
        commitId?: string;
        projectId?: string;
    }): string;
    /**
     * Collect a Genesis axiom
     */
    collectGenesisAxiom(axiom: {
        axiomId: string;
        name: string;
        type: string;
        statement: string;
        consequences: string[];
    }): string;
    /**
     * Collect meditation insight
     */
    collectMeditationInsight(insight: {
        insightId: string;
        topic: string;
        conclusion: string;
        confidence: number;
        relatedQueries: string[];
    }): string;
    /**
     * Flush queue - vectorize and persist
     */
    flush(): Promise<number>;
    /**
     * Search collected fragments by semantic similarity
     */
    searchFragments(query: string, options?: {
        source?: DataSourceType;
        topK?: number;
        minScore?: number;
    }): Promise<Array<{
        fragment: DataFragment;
        score: number;
    }>>;
    /**
     * Get fragments by source type
     */
    getFragmentsBySource(source: DataSourceType): DataFragment[];
    /**
     * Calculate cosine similarity
     */
    private cosineSimilarity;
    /**
     * Get statistics
     */
    getStats(): MagnetStats;
    /**
     * Get queue size
     */
    getQueueSize(): number;
}
export declare function createNeuralCoreMagnet(bridgeSystem: BridgeSystem, config?: Partial<MagnetConfig>): NeuralCoreMagnet;
export default NeuralCoreMagnet;
//# sourceMappingURL=NeuralCoreMagnet.d.ts.map