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
import { Pinecone } from '@pinecone-database/pinecone';
import { EventEmitter } from 'events';
// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════
const DEFAULT_CONFIG = {
    apiKey: process.env.PINECONE_API_KEY || '',
    indexName: 'qantum-empire',
    namespace: 'empire',
    dimension: 512,
    topK: 10,
    minScore: 0.5,
    cacheEnabled: true,
    cacheTTL: 300000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 1000,
};
// ═══════════════════════════════════════════════════════════════════════════════
// PINECONE CONTEXT BRIDGE - THE ETERNAL MEMORY
// ═══════════════════════════════════════════════════════════════════════════════
export class PineconeContextBridge extends EventEmitter {
    config;
    client = null;
    index = null;
    // Sessions & Context
    sessions = new Map();
    queryCache = new Map();
    // Statistics
    stats = {
        queriesExecuted: 0,
        cacheHits: 0,
        totalQueryTime: 0,
        startTime: Date.now(),
        lastError: null,
    };
    // Connection state
    isConnected = false;
    totalVectors = 0;
    constructor(config = {}) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // CONNECTION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Initialize connection to Pinecone
     */
    async connect() {
        if (!this.config.apiKey) {
            throw new Error('PINECONE_API_KEY is required');
        }
        try {
            this.log('info', '🔌 Connecting to Pinecone Cloud...');
            this.client = new Pinecone({
                apiKey: this.config.apiKey,
            });
            this.index = this.client.index(this.config.indexName);
            // Get index stats
            const stats = await this.index.describeIndexStats();
            this.totalVectors = stats.totalRecordCount || 0;
            this.isConnected = true;
            this.log('success', `✅ Connected to Pinecone!`);
            this.log('info', `   Index: ${this.config.indexName}`);
            this.log('info', `   Namespace: ${this.config.namespace}`);
            this.log('info', `   Vectors: ${this.totalVectors.toLocaleString()}`);
            this.log('info', `   Dimension: ${this.config.dimension}`);
            this.emit('connected', { totalVectors: this.totalVectors });
        }
        catch (error) {
            this.stats.lastError = error;
            this.log('error', `❌ Connection failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Disconnect from Pinecone
     */
    async disconnect() {
        this.isConnected = false;
        this.client = null;
        this.index = null;
        this.log('info', '🔌 Disconnected from Pinecone');
        this.emit('disconnected');
    }
    /**
     * Check if connected
     */
    connected() {
        return this.isConnected;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // SESSION MANAGEMENT (CONTEXT PERSISTENCE)
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Create a new session for context persistence
     */
    createSession(sessionId, projectScope) {
        const id = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const session = {
            sessionId: id,
            createdAt: Date.now(),
            lastAccessedAt: Date.now(),
            queryHistory: [],
            contextVectors: [],
            activeFilters: {},
            projectScope: projectScope || ['MisteMind', 'MrMindQATool', 'MisterMindPage'],
        };
        this.sessions.set(id, session);
        this.log('info', `📋 Session created: ${id}`);
        this.emit('session:created', session);
        return session;
    }
    /**
     * Get session by ID
     */
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastAccessedAt = Date.now();
        }
        return session;
    }
    /**
     * Update session context with new query
     */
    updateSessionContext(sessionId, query, contextVector) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        session.lastAccessedAt = Date.now();
        session.queryHistory.push(query);
        // Keep last 50 queries for context
        if (session.queryHistory.length > 50) {
            session.queryHistory.shift();
        }
        if (contextVector) {
            session.contextVectors.push(contextVector);
            // Keep last 10 context vectors
            if (session.contextVectors.length > 10) {
                session.contextVectors.shift();
            }
        }
        this.emit('session:updated', session);
    }
    /**
     * Set active filters for session
     */
    setSessionFilters(sessionId, filters) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        session.activeFilters = filters;
        session.lastAccessedAt = Date.now();
    }
    /**
     * Clear session
     */
    clearSession(sessionId) {
        this.sessions.delete(sessionId);
        this.log('info', `🗑️ Session cleared: ${sessionId}`);
        this.emit('session:cleared', sessionId);
    }
    /**
     * Get all active sessions
     */
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // VECTOR QUERY ENGINE
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Query Pinecone with a vector
     */
    async queryByVector(vector, options = {}) {
        if (!this.isConnected || !this.index) {
            throw new Error('Not connected to Pinecone. Call connect() first.');
        }
        const startTime = Date.now();
        const topK = options.topK || this.config.topK;
        const minScore = options.minScore || this.config.minScore;
        // Build filter
        let filter = options.filter || {};
        // Apply session filters if sessionId provided
        if (options.sessionId) {
            const session = this.sessions.get(options.sessionId);
            if (session) {
                filter = { ...session.activeFilters, ...filter };
                // Apply project scope
                if (session.projectScope.length > 0) {
                    filter.project = { $in: session.projectScope };
                }
            }
        }
        try {
            const response = await this.index.namespace(this.config.namespace).query({
                vector,
                topK,
                includeMetadata: options.includeMetadata !== false,
                filter: Object.keys(filter).length > 0 ? filter : undefined,
            });
            const matches = (response.matches || [])
                .filter(match => (match.score || 0) >= minScore)
                .map(match => ({
                id: match.id,
                score: match.score || 0,
                content: match.metadata?.content || '',
                filePath: match.metadata?.filePath || '',
                project: match.metadata?.project || '',
                startLine: match.metadata?.startLine || 0,
                endLine: match.metadata?.endLine || 0,
                metadata: match.metadata || {},
            }));
            const queryTimeMs = Date.now() - startTime;
            this.stats.queriesExecuted++;
            this.stats.totalQueryTime += queryTimeMs;
            const result = {
                query: '[vector]',
                matches,
                totalVectors: this.totalVectors,
                queryTimeMs,
                cached: false,
                sessionId: options.sessionId,
            };
            this.emit('query:completed', result);
            return result;
        }
        catch (error) {
            this.stats.lastError = error;
            this.log('error', `Query failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Query Pinecone with text (requires external embedding)
     */
    async queryByText(text, embedFn, options = {}) {
        const useCache = options.useCache !== false && this.config.cacheEnabled;
        const cacheKey = this.getCacheKey(text, options);
        // Check cache
        if (useCache) {
            const cached = this.queryCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
                this.stats.cacheHits++;
                return { ...cached.result, cached: true };
            }
        }
        const startTime = Date.now();
        // Generate embedding
        const vector = await embedFn(text);
        // Query Pinecone
        const result = await this.queryByVector(vector, {
            ...options,
            includeMetadata: true,
        });
        result.query = text;
        result.queryTimeMs = Date.now() - startTime;
        // Update session context
        if (options.sessionId) {
            this.updateSessionContext(options.sessionId, text, vector);
        }
        // Cache result
        if (useCache) {
            this.queryCache.set(cacheKey, { result, timestamp: Date.now() });
        }
        return result;
    }
    /**
     * Contextual query - uses session history to improve results
     */
    async queryContextual(text, sessionId, embedFn, options = {}) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        const contextWeight = options.contextWeight || 0.3;
        // Build contextual query from history
        const contextQueries = session.queryHistory.slice(-5);
        const fullContext = [...contextQueries, text].join(' ');
        // Get embedding for contextual query
        const contextVector = await embedFn(fullContext);
        const queryVector = await embedFn(text);
        // Blend vectors (weighted average)
        const blendedVector = queryVector.map((val, i) => {
            const contextVal = contextVector[i] || 0;
            return val * (1 - contextWeight) + contextVal * contextWeight;
        });
        return this.queryByVector(blendedVector, {
            topK: options.topK,
            minScore: options.minScore,
            sessionId,
        });
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // SPECIALIZED QUERIES
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Search for code by functionality
     */
    async searchCode(description, embedFn, options = {}) {
        const filter = {};
        if (options.project) {
            filter.project = options.project;
        }
        if (options.fileType) {
            filter.filePath = { $contains: options.fileType };
        }
        return this.queryByText(description, embedFn, {
            filter,
            sessionId: options.sessionId,
            topK: options.topK || 15,
        });
    }
    /**
     * Find similar code to a given snippet
     */
    async findSimilarCode(codeSnippet, embedFn, options = {}) {
        const filter = {};
        if (options.excludeFile) {
            filter.filePath = { $ne: options.excludeFile };
        }
        return this.queryByText(codeSnippet, embedFn, {
            filter,
            sessionId: options.sessionId,
            topK: options.topK || 10,
        });
    }
    /**
     * Get context for a specific file
     */
    async getFileContext(filePath, embedFn, sessionId) {
        const description = `Code from file ${filePath} and related functionality`;
        return this.queryByText(description, embedFn, {
            filter: { filePath: { $contains: filePath.replace(/\\/g, '/') } },
            sessionId,
            topK: 20,
        });
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // STATISTICS & MONITORING
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Get bridge statistics
     */
    getStats() {
        return {
            isConnected: this.isConnected,
            indexName: this.config.indexName,
            namespace: this.config.namespace,
            totalVectors: this.totalVectors,
            dimension: this.config.dimension,
            queriesExecuted: this.stats.queriesExecuted,
            cacheHits: this.stats.cacheHits,
            avgQueryTimeMs: this.stats.queriesExecuted > 0
                ? Math.round(this.stats.totalQueryTime / this.stats.queriesExecuted)
                : 0,
            activeSessions: this.sessions.size,
            uptime: Date.now() - this.stats.startTime,
        };
    }
    /**
     * Get last error
     */
    getLastError() {
        return this.stats.lastError;
    }
    /**
     * Clear query cache
     */
    clearCache() {
        this.queryCache.clear();
        this.log('info', '🗑️ Query cache cleared');
    }
    /**
     * Refresh index stats
     */
    async refreshStats() {
        if (!this.isConnected || !this.index) {
            throw new Error('Not connected to Pinecone');
        }
        const stats = await this.index.describeIndexStats();
        this.totalVectors = stats.totalRecordCount || 0;
        this.log('info', `📊 Stats refreshed: ${this.totalVectors.toLocaleString()} vectors`);
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════
    getCacheKey(text, options) {
        return `${text}:${JSON.stringify(options)}`;
    }
    log(level, message) {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '📘',
            success: '✅',
            error: '❌',
            warn: '⚠️',
        }[level];
        console.log(`[${timestamp}] ${prefix} [PineconeBridge] ${message}`);
        this.emit('log', { level, message, timestamp });
    }
}
// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════
export const pineconeContextBridge = new PineconeContextBridge();
export default PineconeContextBridge;
//# sourceMappingURL=PineconeContextBridge.js.map