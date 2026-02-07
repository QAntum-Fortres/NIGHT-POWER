/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM SEMANTIC MEMORY BANK                                                 ║
 * ║   "Векторна база данни за научени модели"                                     ║
 * ║                                                                               ║
 * ║   TODO A #4 - Semantic Memory Bank                                            ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// ТИПОВЕ
// ═══════════════════════════════════════════════════════════════════════════════

export interface MemoryEntry {
    id: string;
    vector: number[];
    content: string;
    metadata: {
        type: MemoryType;
        domain: string;
        tags: string[];
        confidence: number;
        timestamp: string;
        source?: string;
    };
    relations: MemoryRelation[];
}

export interface MemoryRelation {
    targetId: string;
    type: RelationType;
    strength: number;
}

export type MemoryType = 'pattern' | 'principle' | 'fact' | 'procedure' | 'concept' | 'experience' | 'error';
export type RelationType = 'similar' | 'causes' | 'prerequisite' | 'contradicts' | 'supports' | 'part-of';

export interface QueryResult {
    entry: MemoryEntry;
    similarity: number;
    relevance: number;
}

export interface MemoryStats {
    totalEntries: number;
    byType: Record<MemoryType, number>;
    byDomain: Record<string, number>;
    avgConfidence: number;
    lastUpdated: string;
}

export interface SemanticMemoryConfig {
    persistPath: string;
    vectorDimension: number;
    maxEntries: number;
    similarityThreshold: number;
    autoSave: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLE VECTOR OPERATIONS (NO EXTERNAL DEPENDENCIES)
// ═══════════════════════════════════════════════════════════════════════════════

class VectorOps {
    /**
     * Генерира семантичен вектор от текст (опростен TF-IDF стил)
     */
    static textToVector(text: string, dimension: number): number[] {
        const vector = new Array(dimension).fill(0);
        const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const hash = this.hashString(word);
            const idx = hash % dimension;
            vector[idx] += 1 / (1 + Math.log(1 + i)); // Position decay
        }

        // Нормализация
        const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
        return vector.map(v => v / magnitude);
    }

    /**
     * Косинусова прилика между два вектора
     */
    static cosineSimilarity(a: number[], b: number[]): number {
        let dot = 0;
        let magA = 0;
        let magB = 0;

        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }

        const denom = Math.sqrt(magA) * Math.sqrt(magB);
        return denom === 0 ? 0 : dot / denom;
    }

    /**
     * Евклидово разстояние
     */
    static euclideanDistance(a: number[], b: number[]): number {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            const diff = a[i] - b[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }

    /**
     * Средно претеглен вектор
     */
    static weightedAverage(vectors: number[][], weights: number[]): number[] {
        const dimension = vectors[0]?.length || 0;
        const result = new Array(dimension).fill(0);
        const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;

        for (let i = 0; i < vectors.length; i++) {
            const w = weights[i] / totalWeight;
            for (let j = 0; j < dimension; j++) {
                result[j] += vectors[i][j] * w;
            }
        }

        return result;
    }

    private static hashString(str: string): number {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
        }
        return Math.abs(hash);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEMANTIC MEMORY BANK
// ═══════════════════════════════════════════════════════════════════════════════

export class SemanticMemoryBank {
    private config: SemanticMemoryConfig;
    private entries: Map<string, MemoryEntry> = new Map();
    private dirty: boolean = false;

    constructor(config: Partial<SemanticMemoryConfig> = {}) {
        this.config = {
            persistPath: './data/semantic-memory.json',
            vectorDimension: 256,
            maxEntries: 10000,
            similarityThreshold: 0.6,
            autoSave: true,
            ...config
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ОСНОВНИ ОПЕРАЦИИ
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Зареждане от файл
     */
    async load(): Promise<void> {
        try {
            if (fs.existsSync(this.config.persistPath)) {
                const data = JSON.parse(fs.readFileSync(this.config.persistPath, 'utf-8'));
                this.entries = new Map(Object.entries(data.entries || {}));
                console.log(`[SemanticMemory] Loaded ${this.entries.size} memories`);
            }
        } catch (error) {
            console.error('[SemanticMemory] Load error:', error);
        }
    }

    /**
     * Запазване във файл
     */
    async save(): Promise<void> {
        try {
            const dir = path.dirname(this.config.persistPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const data = {
                entries: Object.fromEntries(this.entries),
                stats: this.getStats(),
                savedAt: new Date().toISOString()
            };

            fs.writeFileSync(this.config.persistPath, JSON.stringify(data, null, 2));
            this.dirty = false;
            console.log(`[SemanticMemory] Saved ${this.entries.size} memories`);
        } catch (error) {
            console.error('[SemanticMemory] Save error:', error);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MEMORIZE - Добавяне на нов спомен
    // ─────────────────────────────────────────────────────────────────────────

    memorize(content: string, metadata: Partial<MemoryEntry['metadata']> = {}): MemoryEntry {
        // Генериране на вектор
        const vector = VectorOps.textToVector(content, this.config.vectorDimension);

        // Проверка за дубликати
        const existing = this.findDuplicate(vector);
        if (existing) {
            // Обновяване на съществуващ спомен
            existing.metadata.confidence = Math.min(1, existing.metadata.confidence + 0.1);
            existing.metadata.timestamp = new Date().toISOString();
            this.dirty = true;
            return existing;
        }

        // Създаване на нов спомен
        const entry: MemoryEntry = {
            id: this.generateId(),
            vector,
            content,
            metadata: {
                type: metadata.type || 'fact',
                domain: metadata.domain || 'general',
                tags: metadata.tags || [],
                confidence: metadata.confidence ?? 0.7,
                timestamp: new Date().toISOString(),
                source: metadata.source
            },
            relations: []
        };

        // Намиране и създаване на релации
        const similar = this.query(content, { limit: 5, threshold: 0.5 });
        for (const result of similar) {
            if (result.similarity > 0.7) {
                entry.relations.push({
                    targetId: result.entry.id,
                    type: 'similar',
                    strength: result.similarity
                });
            }
        }

        // Добавяне в базата
        this.entries.set(entry.id, entry);
        this.dirty = true;

        // Ограничаване на размера
        if (this.entries.size > this.config.maxEntries) {
            this.evictLowValue();
        }

        // Auto-save
        if (this.config.autoSave && this.dirty) {
            this.save().catch(() => {});
        }

        return entry;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RECALL - Търсене по съдържание
    // ─────────────────────────────────────────────────────────────────────────

    recall(query: string, options: { limit?: number; type?: MemoryType; domain?: string } = {}): MemoryEntry[] {
        const results = this.query(query, {
            limit: options.limit || 10,
            threshold: this.config.similarityThreshold,
            filter: entry => {
                if (options.type && entry.metadata.type !== options.type) return false;
                if (options.domain && entry.metadata.domain !== options.domain) return false;
                return true;
            }
        });

        return results.map(r => r.entry);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY - Семантично търсене
    // ─────────────────────────────────────────────────────────────────────────

    query(
        queryText: string,
        options: {
            limit?: number;
            threshold?: number;
            filter?: (entry: MemoryEntry) => boolean;
        } = {}
    ): QueryResult[] {
        const queryVector = VectorOps.textToVector(queryText, this.config.vectorDimension);
        const results: QueryResult[] = [];

        for (const entry of this.entries.values()) {
            if (options.filter && !options.filter(entry)) continue;

            const similarity = VectorOps.cosineSimilarity(queryVector, entry.vector);
            if (similarity >= (options.threshold ?? 0)) {
                // Relevance combines similarity with confidence
                const relevance = similarity * entry.metadata.confidence;
                results.push({ entry, similarity, relevance });
            }
        }

        // Сортиране по релевантност
        results.sort((a, b) => b.relevance - a.relevance);

        return results.slice(0, options.limit || 10);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ASSOCIATE - Създаване на връзки
    // ─────────────────────────────────────────────────────────────────────────

    associate(sourceId: string, targetId: string, type: RelationType, strength: number = 0.5): void {
        const source = this.entries.get(sourceId);
        if (!source) return;

        const existingIdx = source.relations.findIndex(r => r.targetId === targetId && r.type === type);
        if (existingIdx >= 0) {
            source.relations[existingIdx].strength = Math.max(source.relations[existingIdx].strength, strength);
        } else {
            source.relations.push({ targetId, type, strength });
        }

        this.dirty = true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FORGET - Премахване на спомен
    // ─────────────────────────────────────────────────────────────────────────

    forget(id: string): boolean {
        const deleted = this.entries.delete(id);
        if (deleted) {
            // Премахване на релации към този ID
            for (const entry of this.entries.values()) {
                entry.relations = entry.relations.filter(r => r.targetId !== id);
            }
            this.dirty = true;
        }
        return deleted;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REINFORCE - Засилване на спомен
    // ─────────────────────────────────────────────────────────────────────────

    reinforce(id: string, amount: number = 0.1): void {
        const entry = this.entries.get(id);
        if (entry) {
            entry.metadata.confidence = Math.min(1, entry.metadata.confidence + amount);
            entry.metadata.timestamp = new Date().toISOString();
            this.dirty = true;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DECAY - Естествено отслабване на спомени
    // ─────────────────────────────────────────────────────────────────────────

    decay(rate: number = 0.01): void {
        const now = Date.now();
        
        for (const entry of this.entries.values()) {
            const age = now - new Date(entry.metadata.timestamp).getTime();
            const daysOld = age / (1000 * 60 * 60 * 24);
            const decayAmount = rate * Math.log(1 + daysOld);
            entry.metadata.confidence = Math.max(0.1, entry.metadata.confidence - decayAmount);
        }

        this.dirty = true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONSOLIDATE - Обединяване на подобни спомени
    // ─────────────────────────────────────────────────────────────────────────

    consolidate(): number {
        let consolidated = 0;
        const processed = new Set<string>();

        for (const entry of this.entries.values()) {
            if (processed.has(entry.id)) continue;
            processed.add(entry.id);

            const similar = this.query(entry.content, {
                threshold: 0.85,
                filter: e => e.id !== entry.id && !processed.has(e.id)
            });

            for (const result of similar) {
                // Обединяване - запазваме по-стария с по-висок confidence
                processed.add(result.entry.id);
                entry.metadata.confidence = Math.max(
                    entry.metadata.confidence,
                    result.entry.metadata.confidence
                );
                entry.metadata.tags = [...new Set([...entry.metadata.tags, ...result.entry.metadata.tags])];
                entry.relations.push(...result.entry.relations);
                this.entries.delete(result.entry.id);
                consolidated++;
            }
        }

        if (consolidated > 0) {
            this.dirty = true;
            console.log(`[SemanticMemory] Consolidated ${consolidated} memories`);
        }

        return consolidated;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TRAVERSE - Обхождане по релации
    // ─────────────────────────────────────────────────────────────────────────

    traverse(startId: string, type?: RelationType, depth: number = 3): MemoryEntry[] {
        const result: MemoryEntry[] = [];
        const visited = new Set<string>();
        const queue: { id: string; currentDepth: number }[] = [{ id: startId, currentDepth: 0 }];

        while (queue.length > 0) {
            const { id, currentDepth } = queue.shift()!;
            if (visited.has(id) || currentDepth > depth) continue;
            visited.add(id);

            const entry = this.entries.get(id);
            if (!entry) continue;

            result.push(entry);

            for (const relation of entry.relations) {
                if (!type || relation.type === type) {
                    queue.push({ id: relation.targetId, currentDepth: currentDepth + 1 });
                }
            }
        }

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATS
    // ─────────────────────────────────────────────────────────────────────────

    getStats(): MemoryStats {
        const byType: Record<string, number> = {};
        const byDomain: Record<string, number> = {};
        let totalConfidence = 0;

        for (const entry of this.entries.values()) {
            byType[entry.metadata.type] = (byType[entry.metadata.type] || 0) + 1;
            byDomain[entry.metadata.domain] = (byDomain[entry.metadata.domain] || 0) + 1;
            totalConfidence += entry.metadata.confidence;
        }

        return {
            totalEntries: this.entries.size,
            byType: byType as Record<MemoryType, number>,
            byDomain,
            avgConfidence: this.entries.size > 0 ? totalConfidence / this.entries.size : 0,
            lastUpdated: new Date().toISOString()
        };
    }

    get size(): number {
        return this.entries.size;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private generateId(): string {
        return crypto.randomBytes(12).toString('hex');
    }

    private findDuplicate(vector: number[]): MemoryEntry | null {
        for (const entry of this.entries.values()) {
            const similarity = VectorOps.cosineSimilarity(vector, entry.vector);
            if (similarity > 0.95) {
                return entry;
            }
        }
        return null;
    }

    private evictLowValue(): void {
        // Намиране на най-ниската стойност = низък confidence + стар
        let lowestId: string | null = null;
        let lowestScore = Infinity;

        for (const entry of this.entries.values()) {
            const age = Date.now() - new Date(entry.metadata.timestamp).getTime();
            const score = entry.metadata.confidence - (age / (1000 * 60 * 60 * 24 * 30)); // Months
            if (score < lowestScore) {
                lowestScore = score;
                lowestId = entry.id;
            }
        }

        if (lowestId) {
            this.forget(lowestId);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const createSemanticMemory = (config?: Partial<SemanticMemoryConfig>): SemanticMemoryBank => {
    return new SemanticMemoryBank(config);
};

export { VectorOps };
export default SemanticMemoryBank;
