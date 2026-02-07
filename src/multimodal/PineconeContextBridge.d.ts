/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM PINECONE BRIDGE v1.0 - ETERNAL CONTEXT MEMORY                        ║
 * ║   "The Bridge That Never Forgets"                                             ║
 * ║                                                                               ║
 * ║   Връзка към 52,573+ вектора в Pinecone Cloud                                 ║
 * ║   Постоянен контекст между сесии                                              ║
 * ║   Семантично търсене с Universal Sentence Encoder                             ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum Empire | Dimitar Prodromov                               ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */
import { EventEmitter } from 'events';
export interface BridgeConfig {
    apiKey: string;
    indexName: string;
    namespace: string;
    dimension: number;
    topK: number;
    minScore: number;
    cacheEnabled: boolean;
    cacheTTL: number;
    retryAttempts: number;
    retryDelay: number;
}
export interface VectorMatch {
    id: string;
    score: number;
    content: string;
    filePath: string;
    project: string;
    startLine: number;
    endLine: number;
    metadata: Record<string, any>;
}
export interface QueryResult {
    query: string;
    matches: VectorMatch[];
    totalVectors: number;
    queryTimeMs: number;
    cached: boolean;
    sessionId?: string;
}
export interface SessionContext {
    sessionId: string;
    createdAt: number;
    lastAccessedAt: number;
    queryHistory: string[];
    contextVectors: number[][];
    activeFilters: Record<string, any>;
    projectScope: string[];
}
export interface BridgeStats {
    isConnected: boolean;
    indexName: string;
    namespace: string;
    totalVectors: number;
    dimension: number;
    queriesExecuted: number;
    cacheHits: number;
    avgQueryTimeMs: number;
    activeSessions: number;
    uptime: number;
}
export declare class PineconeContextBridge extends EventEmitter {
    private config;
    private client;
    private index;
    private sessions;
    private queryCache;
    private stats;
    private isConnected;
    private totalVectors;
    constructor(config?: Partial<BridgeConfig>);
    /**
     * Initialize connection to Pinecone
     */
    connect(): Promise<void>;
    /**
     * Disconnect from Pinecone
     */
    disconnect(): Promise<void>;
    /**
     * Check if connected
     */
    connected(): boolean;
    /**
     * Create a new session for context persistence
     */
    createSession(sessionId?: string, projectScope?: string[]): SessionContext;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): SessionContext | undefined;
    /**
     * Update session context with new query
     */
    updateSessionContext(sessionId: string, query: string, contextVector?: number[]): void;
    /**
     * Set active filters for session
     */
    setSessionFilters(sessionId: string, filters: Record<string, any>): void;
    /**
     * Clear session
     */
    clearSession(sessionId: string): void;
    /**
     * Get all active sessions
     */
    getAllSessions(): SessionContext[];
    /**
     * Query Pinecone with a vector
     */
    queryByVector(vector: number[], options?: {
        topK?: number;
        minScore?: number;
        filter?: Record<string, any>;
        sessionId?: string;
        includeMetadata?: boolean;
    }): Promise<QueryResult>;
    /**
     * Query Pinecone with text (requires external embedding)
     */
    queryByText(text: string, embedFn: (text: string) => Promise<number[]>, options?: {
        topK?: number;
        minScore?: number;
        filter?: Record<string, any>;
        sessionId?: string;
        useCache?: boolean;
    }): Promise<QueryResult>;
    /**
     * Contextual query - uses session history to improve results
     */
    queryContextual(text: string, sessionId: string, embedFn: (text: string) => Promise<number[]>, options?: {
        topK?: number;
        minScore?: number;
        contextWeight?: number;
    }): Promise<QueryResult>;
    /**
     * Search for code by functionality
     */
    searchCode(description: string, embedFn: (text: string) => Promise<number[]>, options?: {
        project?: string;
        fileType?: string;
        sessionId?: string;
        topK?: number;
    }): Promise<QueryResult>;
    /**
     * Find similar code to a given snippet
     */
    findSimilarCode(codeSnippet: string, embedFn: (text: string) => Promise<number[]>, options?: {
        excludeFile?: string;
        sessionId?: string;
        topK?: number;
    }): Promise<QueryResult>;
    /**
     * Get context for a specific file
     */
    getFileContext(filePath: string, embedFn: (text: string) => Promise<number[]>, sessionId?: string): Promise<QueryResult>;
    /**
     * Get bridge statistics
     */
    getStats(): BridgeStats;
    /**
     * Get last error
     */
    getLastError(): Error | null;
    /**
     * Clear query cache
     */
    clearCache(): void;
    /**
     * Refresh index stats
     */
    refreshStats(): Promise<void>;
    private getCacheKey;
    private log;
}
export declare const pineconeContextBridge: PineconeContextBridge;
export default PineconeContextBridge;
//# sourceMappingURL=PineconeContextBridge.d.ts.map