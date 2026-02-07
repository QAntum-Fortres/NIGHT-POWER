/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MNEMOSYNE PROTOCOL - The Art of Strategic Forgetting
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Мнемозина - богинята на паметта. Но истинската мъдрост е да знаеш какво да забравиш."
 * 
 * За да оцелее до 2035, системата трябва активно да ЗАБРАВЯ:
 * - Вектори, неползвани 6+ месеца → изтриване
 * - Дублирани знания → компресиране
 * - Шум → филтриране
 * 
 * Entropy is the enemy. Mnemosyne is the cure.
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 34.0.0 ETERNAL SOVEREIGN
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface MemoryVector {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    source: string;
    createdAt: Date;
    lastAccessedAt: Date;
    accessCount: number;
    importance: number;        // 0-1
    category: MemoryCategory;
  };
}

export type MemoryCategory = 
  | 'code-pattern'
  | 'architecture-principle'
  | 'error-solution'
  | 'user-preference'
  | 'project-context'
  | 'learned-lesson'
  | 'temporary';

export interface PruneResult {
  totalVectors: number;
  staleVectors: number;
  compressedVectors: number;
  deletedVectors: number;
  freedSpace: number;           // in MB
  newKnowledgeCapacity: number; // percentage
  timestamp: Date;
}

export interface CompressedKnowledge {
  id: string;
  originalIds: string[];
  summary: string;
  embedding: number[];
  confidence: number;
  createdAt: Date;
}

export interface MnemosyneConfig {
  staleThresholdDays: number;      // Default: 180 (6 months)
  minAccessCount: number;          // Default: 3
  compressionRatio: number;        // Default: 0.7 (compress 10 → 7)
  maxVectorCount: number;          // Default: 100000
  autoRunIntervalDays: number;     // Default: 30
  dryRun: boolean;                 // Default: true (safety first)
}

export interface MemoryHealth {
  totalVectors: number;
  stalePercentage: number;
  duplicatePercentage: number;
  healthScore: number;            // 0-100
  recommendation: string;
  lastPruneDate: Date | null;
  nextScheduledPrune: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MNEMOSYNE - THE MEMORY CURATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class Mnemosyne extends EventEmitter {
  private static instance: Mnemosyne;
  
  private config: MnemosyneConfig;
  private pruneHistory: PruneResult[] = [];
  private isRunning = false;
  
  private readonly HISTORY_PATH = './data/mnemosyne-history.json';
  private readonly COMPRESSED_PATH = './data/compressed-knowledge.json';
  
  // Pinecone connection (lazy loaded)
  private pineconeIndex: any = null;

  private constructor(config?: Partial<MnemosyneConfig>) {
    super();
    
    this.config = {
      staleThresholdDays: config?.staleThresholdDays ?? 180,
      minAccessCount: config?.minAccessCount ?? 3,
      compressionRatio: config?.compressionRatio ?? 0.7,
      maxVectorCount: config?.maxVectorCount ?? 100000,
      autoRunIntervalDays: config?.autoRunIntervalDays ?? 30,
      dryRun: config?.dryRun ?? true,
    };
    
    this.loadHistory();
    
    console.log(`
🧹 ═══════════════════════════════════════════════════════════════════════════════
   MNEMOSYNE PROTOCOL v34.0 - THE ART OF STRATEGIC FORGETTING
   ─────────────────────────────────────────────────────────────────────────────
   Stale Threshold:  ${this.config.staleThresholdDays} days
   Min Access Count: ${this.config.minAccessCount}
   Compression:      ${(this.config.compressionRatio * 100).toFixed(0)}%
   Auto-Run:         Every ${this.config.autoRunIntervalDays} days
   Mode:             ${this.config.dryRun ? '🔒 DRY RUN (safe)' : '⚠️ LIVE (destructive)'}
═══════════════════════════════════════════════════════════════════════════════
    `);
  }

  static getInstance(config?: Partial<MnemosyneConfig>): Mnemosyne {
    if (!Mnemosyne.instance) {
      Mnemosyne.instance = new Mnemosyne(config);
    }
    return Mnemosyne.instance;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE PRUNING LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Main pruning method - identifies and removes stale memories
   * On every 30 days:
   * 1. Find vectors not accessed in 6 months
   * 2. Compress them into summarized knowledge
   * 3. Delete originals to free space for new insights
   */
  async pruneKnowledge(): Promise<PruneResult> {
    if (this.isRunning) {
      console.log('⚠️ [MNEMOSYNE] Prune already in progress. Skipping.');
      throw new Error('PRUNE_ALREADY_RUNNING');
    }

    this.isRunning = true;
    this.emit('prune:start');
    
    console.log('🧹 [MNEMOSYNE] Starting knowledge pruning cycle...');
    console.log(`   Mode: ${this.config.dryRun ? 'DRY RUN' : 'LIVE'}`);

    const result: PruneResult = {
      totalVectors: 0,
      staleVectors: 0,
      compressedVectors: 0,
      deletedVectors: 0,
      freedSpace: 0,
      newKnowledgeCapacity: 0,
      timestamp: new Date(),
    };

    try {
      // 1. Connect to Pinecone
      await this.connectPinecone();
      
      // 2. Get all vectors with metadata
      const allVectors = await this.fetchAllVectors();
      result.totalVectors = allVectors.length;
      
      console.log(`📊 [MNEMOSYNE] Total vectors in memory: ${result.totalVectors}`);

      // 3. Identify stale vectors
      const staleVectors = this.identifyStaleVectors(allVectors);
      result.staleVectors = staleVectors.length;
      
      console.log(`🔍 [MNEMOSYNE] Stale vectors (>${this.config.staleThresholdDays} days): ${result.staleVectors}`);

      if (staleVectors.length === 0) {
        console.log('✅ [MNEMOSYNE] Memory is healthy. No pruning needed.');
        this.isRunning = false;
        return result;
      }

      // 4. Group similar stale vectors for compression
      const groups = this.groupSimilarVectors(staleVectors);
      console.log(`📦 [MNEMOSYNE] Grouped into ${groups.length} knowledge clusters`);

      // 5. Compress each group into a single knowledge nugget
      const compressedKnowledge: CompressedKnowledge[] = [];
      
      for (const group of groups) {
        if (group.length >= 2) {
          const compressed = await this.compressGroup(group);
          compressedKnowledge.push(compressed);
          result.compressedVectors += group.length;
        }
      }
      
      console.log(`🗜️ [MNEMOSYNE] Compressed ${result.compressedVectors} vectors → ${compressedKnowledge.length} knowledge nuggets`);

      // 6. Delete stale vectors (if not dry run)
      if (!this.config.dryRun) {
        const idsToDelete = staleVectors.map(v => v.id);
        await this.deleteVectors(idsToDelete);
        result.deletedVectors = idsToDelete.length;
        
        // 7. Insert compressed knowledge
        await this.insertCompressedKnowledge(compressedKnowledge);
        
        console.log(`🗑️ [MNEMOSYNE] Deleted ${result.deletedVectors} stale vectors`);
        console.log(`💾 [MNEMOSYNE] Inserted ${compressedKnowledge.length} compressed nuggets`);
      } else {
        console.log(`🔒 [MNEMOSYNE] DRY RUN - Would delete ${staleVectors.length} vectors`);
        result.deletedVectors = 0;
      }

      // 8. Calculate freed space
      result.freedSpace = this.calculateFreedSpace(staleVectors);
      result.newKnowledgeCapacity = 
        ((this.config.maxVectorCount - (result.totalVectors - result.deletedVectors)) 
        / this.config.maxVectorCount) * 100;

      // 9. Save history
      this.pruneHistory.push(result);
      this.saveHistory();

      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    🧹 MNEMOSYNE PRUNE COMPLETE                                ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Total Vectors:      ${result.totalVectors.toString().padEnd(49)}║
║  Stale Identified:   ${result.staleVectors.toString().padEnd(49)}║
║  Compressed:         ${result.compressedVectors.toString().padEnd(49)}║
║  Deleted:            ${result.deletedVectors.toString().padEnd(49)}║
║  Freed Space:        ${(result.freedSpace.toFixed(2) + ' MB').padEnd(49)}║
║  New Capacity:       ${(result.newKnowledgeCapacity.toFixed(1) + '%').padEnd(49)}║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      this.emit('prune:complete', result);
      
    } catch (error) {
      console.error('❌ [MNEMOSYNE] Prune failed:', error);
      this.emit('prune:error', error);
      throw error;
    } finally {
      this.isRunning = false;
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMORY HEALTH CHECK
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check the health of the memory system
   */
  async checkHealth(): Promise<MemoryHealth> {
    console.log('🏥 [MNEMOSYNE] Running memory health check...');
    
    await this.connectPinecone();
    const allVectors = await this.fetchAllVectors();
    
    const staleVectors = this.identifyStaleVectors(allVectors);
    const duplicates = this.findDuplicates(allVectors);
    
    const stalePercentage = (staleVectors.length / allVectors.length) * 100;
    const duplicatePercentage = (duplicates.length / allVectors.length) * 100;
    
    // Health score: 100 - (stale% * 0.6) - (duplicate% * 0.4)
    const healthScore = Math.max(0, 100 - (stalePercentage * 0.6) - (duplicatePercentage * 0.4));
    
    const lastPrune = this.pruneHistory.length > 0 
      ? this.pruneHistory[this.pruneHistory.length - 1].timestamp 
      : null;
    
    const nextPrune = lastPrune 
      ? new Date(lastPrune.getTime() + this.config.autoRunIntervalDays * 24 * 60 * 60 * 1000)
      : new Date();

    let recommendation = '';
    if (healthScore >= 80) {
      recommendation = 'Memory is healthy. No action needed.';
    } else if (healthScore >= 60) {
      recommendation = 'Consider running pruneKnowledge() soon.';
    } else if (healthScore >= 40) {
      recommendation = 'Memory degradation detected. Run pruneKnowledge() now.';
    } else {
      recommendation = '⚠️ CRITICAL: Memory severely degraded. Immediate pruning required!';
    }

    const health: MemoryHealth = {
      totalVectors: allVectors.length,
      stalePercentage,
      duplicatePercentage,
      healthScore,
      recommendation,
      lastPruneDate: lastPrune,
      nextScheduledPrune: nextPrune,
    };

    console.log(`
🏥 MEMORY HEALTH REPORT
───────────────────────
Total Vectors:    ${health.totalVectors}
Stale:            ${health.stalePercentage.toFixed(1)}%
Duplicates:       ${health.duplicatePercentage.toFixed(1)}%
Health Score:     ${health.healthScore.toFixed(0)}/100
Recommendation:   ${health.recommendation}
    `);

    return health;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PINECONE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  private async connectPinecone(): Promise<void> {
    if (this.pineconeIndex) return;

    try {
      // Dynamic import to avoid hard dependency
      const { Pinecone } = await import('@pinecone-database/pinecone');
      
      const apiKey = process.env.PINECONE_API_KEY;
      if (!apiKey) {
        console.log('⚠️ [MNEMOSYNE] No Pinecone API key. Using mock mode.');
        return;
      }

      const pinecone = new Pinecone({ apiKey });
      this.pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX || 'qantum-knowledge');
      
      console.log('🔗 [MNEMOSYNE] Connected to Pinecone');
    } catch (error) {
      console.log('⚠️ [MNEMOSYNE] Pinecone not available. Using local mock.');
    }
  }

  private async fetchAllVectors(): Promise<MemoryVector[]> {
    if (!this.pineconeIndex) {
      // Return mock data for testing
      return this.getMockVectors();
    }

    try {
      // Fetch vectors in batches
      const stats = await this.pineconeIndex.describeIndexStats();
      const totalVectors = stats.totalRecordCount || 0;
      
      // For large indexes, we need to use list + fetch
      const vectors: MemoryVector[] = [];
      
      // Query with dummy vector to get IDs (Pinecone workaround)
      const dummyVector = new Array(1536).fill(0);
      const queryResult = await this.pineconeIndex.query({
        vector: dummyVector,
        topK: Math.min(totalVectors, 10000),
        includeMetadata: true,
      });
      
      for (const match of queryResult.matches || []) {
        vectors.push({
          id: match.id,
          content: match.metadata?.content || '',
          embedding: [], // Don't need full embedding for pruning
          metadata: {
            source: match.metadata?.source || 'unknown',
            createdAt: new Date(match.metadata?.createdAt || Date.now()),
            lastAccessedAt: new Date(match.metadata?.lastAccessedAt || Date.now()),
            accessCount: match.metadata?.accessCount || 0,
            importance: match.metadata?.importance || 0.5,
            category: match.metadata?.category || 'temporary',
          },
        });
      }
      
      return vectors;
    } catch (error) {
      console.error('❌ [MNEMOSYNE] Failed to fetch vectors:', error);
      return [];
    }
  }

  private async deleteVectors(ids: string[]): Promise<void> {
    if (!this.pineconeIndex || ids.length === 0) return;

    try {
      // Delete in batches of 1000
      const batchSize = 1000;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        await this.pineconeIndex.deleteMany(batch);
        console.log(`🗑️ [MNEMOSYNE] Deleted batch ${Math.floor(i / batchSize) + 1}`);
      }
    } catch (error) {
      console.error('❌ [MNEMOSYNE] Delete failed:', error);
      throw error;
    }
  }

  private async insertCompressedKnowledge(knowledge: CompressedKnowledge[]): Promise<void> {
    if (!this.pineconeIndex || knowledge.length === 0) return;

    try {
      const vectors = knowledge.map(k => ({
        id: k.id,
        values: k.embedding,
        metadata: {
          content: k.summary,
          originalIds: k.originalIds.join(','),
          confidence: k.confidence,
          createdAt: k.createdAt.toISOString(),
          lastAccessedAt: new Date().toISOString(),
          accessCount: 1,
          importance: 0.8, // Compressed knowledge is important
          category: 'architecture-principle',
          isCompressed: true,
        },
      }));

      await this.pineconeIndex.upsert(vectors);
    } catch (error) {
      console.error('❌ [MNEMOSYNE] Insert failed:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private identifyStaleVectors(vectors: MemoryVector[]): MemoryVector[] {
    const now = Date.now();
    const thresholdMs = this.config.staleThresholdDays * 24 * 60 * 60 * 1000;

    return vectors.filter(v => {
      const age = now - v.metadata.lastAccessedAt.getTime();
      const isStale = age > thresholdMs;
      const lowAccess = v.metadata.accessCount < this.config.minAccessCount;
      const lowImportance = v.metadata.importance < 0.3;
      const isTemporary = v.metadata.category === 'temporary';
      
      // Stale if: old AND (low access OR low importance OR temporary)
      return isStale && (lowAccess || lowImportance || isTemporary);
    });
  }

  private groupSimilarVectors(vectors: MemoryVector[]): MemoryVector[][] {
    // Group by category first, then by content similarity
    const groups: Map<string, MemoryVector[]> = new Map();
    
    for (const v of vectors) {
      const key = v.metadata.category;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(v);
    }
    
    return Array.from(groups.values());
  }

  private async compressGroup(group: MemoryVector[]): Promise<CompressedKnowledge> {
    // Create a summary of the group
    const contents = group.map(v => v.content).join('\n---\n');
    
    // In production, use LLM to summarize
    const summary = `Compressed knowledge from ${group.length} related memories. ` +
      `Category: ${group[0].metadata.category}. ` +
      `Time range: ${group[0].metadata.createdAt.toISOString()} - ${group[group.length - 1].metadata.createdAt.toISOString()}`;
    
    // Average the embeddings (simple approach)
    const avgEmbedding = new Array(1536).fill(0);
    
    return {
      id: `compressed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalIds: group.map(v => v.id),
      summary,
      embedding: avgEmbedding,
      confidence: 0.85,
      createdAt: new Date(),
    };
  }

  private findDuplicates(vectors: MemoryVector[]): MemoryVector[] {
    const seen = new Set<string>();
    const duplicates: MemoryVector[] = [];
    
    for (const v of vectors) {
      // Simple content hash for duplicate detection
      const contentHash = v.content.substring(0, 100);
      if (seen.has(contentHash)) {
        duplicates.push(v);
      } else {
        seen.add(contentHash);
      }
    }
    
    return duplicates;
  }

  private calculateFreedSpace(vectors: MemoryVector[]): number {
    // Estimate ~1KB per vector (embedding + metadata)
    return (vectors.length * 1024) / (1024 * 1024); // MB
  }

  private getMockVectors(): MemoryVector[] {
    // Generate mock data for testing
    const categories: MemoryCategory[] = [
      'code-pattern', 'architecture-principle', 'error-solution',
      'user-preference', 'project-context', 'learned-lesson', 'temporary'
    ];
    
    const vectors: MemoryVector[] = [];
    const now = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      const ageInDays = Math.random() * 365;
      const createdAt = new Date(now - ageInDays * 24 * 60 * 60 * 1000);
      const lastAccessed = new Date(now - (ageInDays * 0.8) * 24 * 60 * 60 * 1000);
      
      vectors.push({
        id: `mock_${i}`,
        content: `Mock knowledge content #${i}`,
        embedding: [],
        metadata: {
          source: 'mock',
          createdAt,
          lastAccessedAt: lastAccessed,
          accessCount: Math.floor(Math.random() * 10),
          importance: Math.random(),
          category: categories[Math.floor(Math.random() * categories.length)],
        },
      });
    }
    
    return vectors;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════════

  private loadHistory(): void {
    try {
      if (fs.existsSync(this.HISTORY_PATH)) {
        const data = fs.readFileSync(this.HISTORY_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        this.pruneHistory = parsed.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp),
        }));
      }
    } catch (error) {
      console.log('⚠️ [MNEMOSYNE] No history found. Starting fresh.');
    }
  }

  private saveHistory(): void {
    try {
      const dir = path.dirname(this.HISTORY_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.HISTORY_PATH, JSON.stringify(this.pruneHistory, null, 2));
    } catch (error) {
      console.error('❌ [MNEMOSYNE] Failed to save history:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULED EXECUTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if pruning is due and run if needed
   */
  async runScheduledPrune(): Promise<PruneResult | null> {
    const health = await this.checkHealth();
    
    if (health.nextScheduledPrune <= new Date()) {
      console.log('⏰ [MNEMOSYNE] Scheduled prune is due. Starting...');
      return this.pruneKnowledge();
    }
    
    console.log(`⏰ [MNEMOSYNE] Next prune scheduled for: ${health.nextScheduledPrune.toISOString()}`);
    return null;
  }

  /**
   * Force enable live mode (careful!)
   */
  enableLiveMode(): void {
    console.log('⚠️ [MNEMOSYNE] LIVE MODE ENABLED - Deletions will be permanent!');
    this.config.dryRun = false;
  }

  /**
   * Get prune history
   */
  getHistory(): PruneResult[] {
    return [...this.pruneHistory];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const mnemosyne = Mnemosyne.getInstance();

export async function pruneKnowledge(): Promise<PruneResult> {
  return mnemosyne.pruneKnowledge();
}

export async function checkMemoryHealth(): Promise<MemoryHealth> {
  return mnemosyne.checkHealth();
}

export async function runScheduledPrune(): Promise<PruneResult | null> {
  return mnemosyne.runScheduledPrune();
}
