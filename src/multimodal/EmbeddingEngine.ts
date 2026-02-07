/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   EMBEDDING ENGINE v2.0 - XENOVA TRANSFORMERS                                 ║
 * ║   "Neural Vectorization at Light Speed"                                       ║
 * ║                                                                               ║
 * ║   Xenova Transformers.js wrapper for generating 384-dim embeddings            ║
 * ║   Optimized for all-MiniLM-L6-v2 model and Pinecone                           ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum Empire | Dimitar Prodromov                               ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface EmbeddingEngineConfig {
  modelName: string;
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

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: EmbeddingEngineConfig = {
  modelName: 'Xenova/all-MiniLM-L6-v2', // 384-dim
  batchSize: 32,
  cacheEnabled: true,
  maxCacheSize: 10000,
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMBEDDING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class EmbeddingEngine extends EventEmitter {
  private config: EmbeddingEngineConfig;
  private extractor: any = null;
  private isLoading = false;
  private isReady = false;

  // Cache
  private cache: Map<string, number[]> = new Map();

  // Stats
  private stats = {
    embeddings: 0,
    cacheHits: 0,
    totalTimeMs: 0,
    loadTimeMs: 0,
  };

  constructor(config: Partial<EmbeddingEngineConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODEL MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Load the Transformers model via Xenova
   */
  async load(): Promise<void> {
    if (this.isReady || this.isLoading) return;

    this.isLoading = true;
    const startTime = Date.now();

    try {
      console.log(`[EmbeddingEngine] ⏳ Loading ${this.config.modelName}...`);

      const { pipeline } = await import('@xenova/transformers');

      this.extractor = await pipeline('feature-extraction', this.config.modelName);

      this.stats.loadTimeMs = Date.now() - startTime;
      this.isReady = true;
      this.isLoading = false;

      console.log(`[EmbeddingEngine] ✅ Model loaded in ${this.stats.loadTimeMs}ms`);
      this.emit('loaded', { loadTimeMs: this.stats.loadTimeMs });

    } catch (error) {
      this.isLoading = false;
      console.error('[EmbeddingEngine] ❌ Failed to load model:', error);
      throw error;
    }
  }

  /**
   * Check if model is ready
   */
  ready(): boolean {
    return this.isReady;
  }

  /**
   * Wait for model to be ready
   */
  async waitForReady(): Promise<void> {
    if (this.isReady) return;
    if (!this.isLoading) {
      await this.load();
      return;
    }

    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (this.isReady) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMBEDDING GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<number[]> {
    await this.waitForReady();

    if (this.config.cacheEnabled) {
      const cached = this.cache.get(text);
      if (cached) {
        this.stats.cacheHits++;
        return cached;
      }
    }

    const startTime = Date.now();

    try {
      const output = await this.extractor(text, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data) as number[];

      this.stats.embeddings++;
      this.stats.totalTimeMs += Date.now() - startTime;

      if (this.config.cacheEnabled) {
        this.addToCache(text, vector);
      }

      return vector;
    } catch (error) {
      console.error('[EmbeddingEngine] ❌ Embedding failed:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    await this.waitForReady();
    const results: number[][] = [];
    const toEmbed: { index: number; text: string }[] = [];

    for (let i = 0; i < texts.length; i++) {
      if (this.config.cacheEnabled) {
        const cached = this.cache.get(texts[i]);
        if (cached) {
          results[i] = cached;
          this.stats.cacheHits++;
          continue;
        }
      }
      toEmbed.push({ index: i, text: texts[i] });
    }

    if (toEmbed.length > 0) {
      const startTime = Date.now();

      // Transformers.js handles batching internally when an array is passed
      // We still iterate to populate results and cache
      for (let i = 0; i < toEmbed.length; i++) {
        const vector = await this.embed(toEmbed[i].text);
        results[toEmbed[i].index] = vector;
      }

      this.stats.totalTimeMs += Date.now() - startTime;
    }

    return results;
  }

  async embedWithInfo(text: string): Promise<EmbeddingResult> {
    const startTime = Date.now();
    const vector = await this.embed(text);

    return {
      text,
      vector,
      cached: false,
      timeMs: Date.now() - startTime,
    };
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error('Vectors must have the same length');
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private addToCache(text: string, vector: number[]): void {
    if (this.cache.size >= this.config.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(text, vector);
  }

  getStats() {
    return {
      isReady: this.isReady,
      embeddings: this.stats.embeddings,
      cacheHits: this.stats.cacheHits,
      cacheSize: this.cache.size,
      avgTimeMs: this.stats.embeddings > 0 ? Math.round(this.stats.totalTimeMs / this.stats.embeddings) : 0,
      loadTimeMs: this.stats.loadTimeMs,
    };
  }
}

let instance: EmbeddingEngine | null = null;
export async function getEmbeddingEngine(): Promise<EmbeddingEngine> {
  if (!instance) {
    instance = new EmbeddingEngine();
    await instance.load();
  }
  return instance;
}

export default EmbeddingEngine;
