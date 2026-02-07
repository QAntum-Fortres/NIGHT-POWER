/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    VECTOR SYNC - THE CLOUD MEMORY ENGINE                      ║
 * ║                                                                               ║
 * ║   "1.1 милиона реда код, превърнати в семантични отпечатъци."                 ║
 * ║                                                                               ║
 * ║   Синхронизира трите армии (MisteMind, MrMindQATool, MisterMindPage)          ║
 * ║   в единен облачен мозък чрез Pinecone Vector Database.                       ║
 * ║                                                                               ║
 * ║  Created: 2026-01-01 | QAntum Prime v28.1.0 SUPREME - Empire Architect        ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface VectorChunk {
  id: string;
  values: number[];
  metadata: {
    project: string;
    filePath: string;
    type: 'function' | 'class' | 'interface' | 'module' | 'comment' | 'export';
    name: string;
    content: string;
    lineStart: number;
    lineEnd: number;
    dependencies: string[];
    hash: string;
  };
}

export interface SyncConfig {
  pineconeApiKey: string;
  pineconeIndex: string;
  pineconeEnvironment: string;
  embeddingModel: 'local' | 'openai' | 'deepseek';
  chunkSize: number;
  overlapSize: number;
  projects: ProjectConfig[];
}

export interface ProjectConfig {
  name: string;
  path: string;
  include: string[];
  exclude: string[];
}

export interface SyncStats {
  project: string;
  filesScanned: number;
  chunksCreated: number;
  vectorsUpserted: number;
  duration: number;
  errors: string[];
}

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: VectorChunk['metadata'];
}

// ═══════════════════════════════════════════════════════════════════════════════
// VECTOR SYNC ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class VectorSync {
  private config: SyncConfig;
  private embeddingCache: Map<string, number[]> = new Map();
  private indexStats = {
    totalVectors: 0,
    lastSync: 0,
    projects: new Map<string, number>(),
  };

  // Default project configurations
  private static readonly DEFAULT_PROJECTS: ProjectConfig[] = [
    {
      name: 'MisteMind',
      path: 'C:/MisteMind',
      include: ['src/**/*.ts', 'src/**/*.js'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.spec.ts', '**/*.test.ts'],
    },
    {
      name: 'MrMindQATool',
      path: 'C:/MrMindQATool',
      include: ['src/**/*.ts', 'src/**/*.js', 'webapp/**/*.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
    {
      name: 'MisterMindPage',
      path: 'C:/MisterMindPage',
      include: ['**/*.html', '**/*.js', '**/*.css'],
      exclude: ['**/node_modules/**'],
    },
  ];

  constructor(config?: Partial<SyncConfig>) {
    this.config = {
      pineconeApiKey: config?.pineconeApiKey || process.env.PINECONE_API_KEY || '',
      pineconeIndex: config?.pineconeIndex || 'qantum-empire-v28',
      pineconeEnvironment: config?.pineconeEnvironment || 'us-east-1',
      embeddingModel: config?.embeddingModel || 'local',
      chunkSize: config?.chunkSize || 1000,
      overlapSize: config?.overlapSize || 200,
      projects: config?.projects || VectorSync.DEFAULT_PROJECTS,
    };

    this.log('🧠 VectorSync initialized');
    this.log(`   Index: ${this.config.pineconeIndex}`);
    this.log(`   Projects: ${this.config.projects.map(p => p.name).join(', ')}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Синхронизира всички проекти към Pinecone
   */
  public async syncEmpire(): Promise<SyncStats[]> {
    this.log('\n╔═══════════════════════════════════════════════════════════════╗');
    this.log('║               🏛️ EMPIRE SYNC - INITIATED                       ║');
    this.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const stats: SyncStats[] = [];

    for (const project of this.config.projects) {
      const projectStats = await this.syncProject(project);
      stats.push(projectStats);
    }

    // Print summary
    this.printSyncSummary(stats);

    // Save sync state
    await this.saveSyncState(stats);

    return stats;
  }

  /**
   * Синхронизира един проект
   */
  public async syncProject(project: ProjectConfig): Promise<SyncStats> {
    const startTime = Date.now();
    const stats: SyncStats = {
      project: project.name,
      filesScanned: 0,
      chunksCreated: 0,
      vectorsUpserted: 0,
      duration: 0,
      errors: [],
    };

    this.log(`📡 Синхронизиране на ${project.name}...`);

    try {
      // 1. Scan files
      const files = await this.scanProjectFiles(project);
      stats.filesScanned = files.length;
      this.log(`   📁 Намерени файлове: ${files.length}`);

      // 2. Extract and chunk content
      const chunks: VectorChunk[] = [];
      for (const file of files) {
        try {
          const fileChunks = await this.extractChunks(file, project.name);
          chunks.push(...fileChunks);
        } catch (error) {
          stats.errors.push(`${file}: ${error}`);
        }
      }
      stats.chunksCreated = chunks.length;
      this.log(`   🧩 Създадени chunks: ${chunks.length}`);

      // 3. Generate embeddings
      this.log(`   🔢 Генериране на embeddings...`);
      const vectors = await this.generateEmbeddings(chunks);

      // 4. Upsert to Pinecone (or local storage for demo)
      await this.upsertVectors(vectors, project.name);
      stats.vectorsUpserted = vectors.length;

      this.indexStats.projects.set(project.name, vectors.length);

    } catch (error) {
      stats.errors.push(`Project error: ${error}`);
      this.log(`   ❌ Грешка: ${error}`);
    }

    stats.duration = Date.now() - startTime;
    this.log(`   ✅ ${project.name} синхронизиран за ${stats.duration}ms`);

    return stats;
  }

  /**
   * Търсене в семантичната памет
   */
  public async search(query: string, options: { topK?: number; filter?: any } = {}): Promise<SearchResult[]> {
    const topK = options.topK || 5;
    
    this.log(`\n🔍 Търсене: "${query.slice(0, 50)}..."`);

    // Generate query embedding
    const queryEmbedding = await this.generateSingleEmbedding(query);

    // Search in local index (for demo) or Pinecone
    const results = await this.searchVectors(queryEmbedding, topK, options.filter);

    this.log(`   📊 Намерени ${results.length} резултата`);

    return results;
  }

  /**
   * Получаване на контекст за заявка към AI
   */
  public async getContextForQuery(query: string, maxTokens: number = 4000): Promise<string> {
    const results = await this.search(query, { topK: 10 });
    
    let context = '';
    let currentTokens = 0;
    const tokenEstimate = (text: string) => Math.ceil(text.length / 4);

    for (const result of results) {
      const chunkText = `// File: ${result.metadata.filePath}\n// ${result.metadata.type}: ${result.metadata.name}\n${result.content}\n\n`;
      const chunkTokens = tokenEstimate(chunkText);

      if (currentTokens + chunkTokens > maxTokens) break;

      context += chunkText;
      currentTokens += chunkTokens;
    }

    return context;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // FILE SCANNING
  // ═══════════════════════════════════════════════════════════════════════════════

  private async scanProjectFiles(project: ProjectConfig): Promise<string[]> {
    const files: string[] = [];

    const walkDir = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(project.path, fullPath);

          // Check excludes
          if (this.matchesPattern(relativePath, project.exclude)) continue;

          if (entry.isDirectory()) {
            walkDir(fullPath);
          } else if (entry.isFile()) {
            // Check includes
            if (this.matchesPattern(relativePath, project.include)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Directory might not exist
      }
    };

    if (fs.existsSync(project.path)) {
      walkDir(project.path);
    }

    return files;
  }

  private matchesPattern(filePath: string, patterns: string[]): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    for (const pattern of patterns) {
      const regexPattern = pattern
        .replace(/\*\*/g, '{{GLOBSTAR}}')
        .replace(/\*/g, '[^/]*')
        .replace(/{{GLOBSTAR}}/g, '.*')
        .replace(/\./g, '\\.');
      
      if (new RegExp(`^${regexPattern}$`).test(normalizedPath)) {
        return true;
      }
    }
    
    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SEMANTIC CHUNKING
  // ═══════════════════════════════════════════════════════════════════════════════

  private async extractChunks(filePath: string, projectName: string): Promise<VectorChunk[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(this.getProjectPath(projectName), filePath);
    const chunks: VectorChunk[] = [];

    // Determine file type and use appropriate chunking strategy
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.ts' || ext === '.js') {
      chunks.push(...this.chunkTypeScript(content, relativePath, projectName));
    } else if (ext === '.html') {
      chunks.push(...this.chunkHTML(content, relativePath, projectName));
    } else if (ext === '.css') {
      chunks.push(...this.chunkCSS(content, relativePath, projectName));
    } else {
      // Generic chunking
      chunks.push(...this.chunkGeneric(content, relativePath, projectName));
    }

    return chunks;
  }

  /**
   * Семантично разделяне на TypeScript/JavaScript
   */
  private chunkTypeScript(content: string, filePath: string, project: string): VectorChunk[] {
    const chunks: VectorChunk[] = [];
    const lines = content.split('\n');

    // Extract functions
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
    const classRegex = /(?:export\s+)?class\s+(\w+)/g;
    const interfaceRegex = /(?:export\s+)?interface\s+(\w+)/g;
    const constRegex = /(?:export\s+)?const\s+(\w+)\s*=/g;

    // Extract all symbols with their positions
    const symbols: { type: string; name: string; start: number; content: string }[] = [];

    // Find functions
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const start = content.slice(0, match.index).split('\n').length;
      const funcContent = this.extractBlock(content, match.index);
      symbols.push({ type: 'function', name: match[1], start, content: funcContent });
    }

    // Find classes
    while ((match = classRegex.exec(content)) !== null) {
      const start = content.slice(0, match.index).split('\n').length;
      const classContent = this.extractBlock(content, match.index);
      symbols.push({ type: 'class', name: match[1], start, content: classContent });
    }

    // Find interfaces
    while ((match = interfaceRegex.exec(content)) !== null) {
      const start = content.slice(0, match.index).split('\n').length;
      const interfaceContent = this.extractBlock(content, match.index);
      symbols.push({ type: 'interface', name: match[1], start, content: interfaceContent });
    }

    // Create chunks for each symbol
    for (const symbol of symbols) {
      const chunk = this.createChunk({
        project,
        filePath,
        type: symbol.type as VectorChunk['metadata']['type'],
        name: symbol.name,
        content: symbol.content,
        lineStart: symbol.start,
        lineEnd: symbol.start + symbol.content.split('\n').length,
        dependencies: this.extractDependencies(symbol.content),
      });
      chunks.push(chunk);
    }

    // If no symbols found, create a generic chunk
    if (chunks.length === 0 && content.trim().length > 0) {
      chunks.push(this.createChunk({
        project,
        filePath,
        type: 'module',
        name: path.basename(filePath, path.extname(filePath)),
        content: content.slice(0, this.config.chunkSize),
        lineStart: 1,
        lineEnd: Math.min(lines.length, 50),
        dependencies: this.extractDependencies(content),
      }));
    }

    return chunks;
  }

  /**
   * Extract a code block starting from a position
   */
  private extractBlock(content: string, startIndex: number): string {
    let braceCount = 0;
    let started = false;
    let endIndex = startIndex;

    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];
      
      if (char === '{') {
        braceCount++;
        started = true;
      } else if (char === '}') {
        braceCount--;
        if (started && braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }

    return content.slice(startIndex, Math.min(endIndex, startIndex + this.config.chunkSize));
  }

  /**
   * Extract import dependencies
   */
  private extractDependencies(content: string): string[] {
    const deps: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      deps.push(match[1]);
    }
    
    return deps;
  }

  private chunkHTML(content: string, filePath: string, project: string): VectorChunk[] {
    // Extract sections, scripts, styles
    return [this.createChunk({
      project,
      filePath,
      type: 'module',
      name: path.basename(filePath),
      content: content.slice(0, this.config.chunkSize),
      lineStart: 1,
      lineEnd: content.split('\n').length,
      dependencies: [],
    })];
  }

  private chunkCSS(content: string, filePath: string, project: string): VectorChunk[] {
    return [this.createChunk({
      project,
      filePath,
      type: 'module',
      name: path.basename(filePath),
      content: content.slice(0, this.config.chunkSize),
      lineStart: 1,
      lineEnd: content.split('\n').length,
      dependencies: [],
    })];
  }

  private chunkGeneric(content: string, filePath: string, project: string): VectorChunk[] {
    return [this.createChunk({
      project,
      filePath,
      type: 'module',
      name: path.basename(filePath),
      content: content.slice(0, this.config.chunkSize),
      lineStart: 1,
      lineEnd: content.split('\n').length,
      dependencies: [],
    })];
  }

  private createChunk(metadata: Omit<VectorChunk['metadata'], 'hash'>): VectorChunk {
    const hash = crypto.createHash('md5').update(metadata.content).digest('hex');
    
    return {
      id: `${metadata.project}:${metadata.filePath}:${metadata.name}:${hash.slice(0, 8)}`,
      values: [], // Will be filled by embedding generation
      metadata: {
        ...metadata,
        hash,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // EMBEDDING GENERATION
  // ═══════════════════════════════════════════════════════════════════════════════

  private async generateEmbeddings(chunks: VectorChunk[]): Promise<VectorChunk[]> {
    for (const chunk of chunks) {
      // Check cache first
      if (this.embeddingCache.has(chunk.metadata.hash)) {
        chunk.values = this.embeddingCache.get(chunk.metadata.hash)!;
        continue;
      }

      // Generate embedding based on configured model
      if (this.config.embeddingModel === 'local') {
        chunk.values = this.generateLocalEmbedding(chunk.metadata.content);
      } else {
        // Would call OpenAI/DeepSeek API here
        chunk.values = this.generateLocalEmbedding(chunk.metadata.content);
      }

      // Cache the embedding
      this.embeddingCache.set(chunk.metadata.hash, chunk.values);
    }

    return chunks;
  }

  private async generateSingleEmbedding(text: string): Promise<number[]> {
    return this.generateLocalEmbedding(text);
  }

  /**
   * Simple local embedding using TF-IDF-like approach
   * In production, replace with OpenAI ada-002 or similar
   */
  private generateLocalEmbedding(text: string): number[] {
    const EMBEDDING_SIZE = 384;
    const embedding = new Array(EMBEDDING_SIZE).fill(0);

    // Tokenize
    const tokens = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);

    // Generate pseudo-embedding based on token hashes
    for (const token of tokens) {
      const hash = this.simpleHash(token);
      for (let i = 0; i < EMBEDDING_SIZE; i++) {
        embedding[i] += Math.sin(hash * (i + 1)) / tokens.length;
      }
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < EMBEDDING_SIZE; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // VECTOR STORAGE
  // ═══════════════════════════════════════════════════════════════════════════════

  private async upsertVectors(vectors: VectorChunk[], project: string): Promise<void> {
    // For demo, save to local JSON file
    // In production, use Pinecone client
    const storagePath = path.join(process.cwd(), 'data', 'vector-index');
    
    try {
      fs.mkdirSync(storagePath, { recursive: true });
      
      const indexFile = path.join(storagePath, `${project.toLowerCase()}-index.json`);
      fs.writeFileSync(indexFile, JSON.stringify({
        project,
        timestamp: Date.now(),
        count: vectors.length,
        vectors: vectors.map(v => ({
          id: v.id,
          values: v.values.slice(0, 10), // Store truncated for demo
          metadata: v.metadata,
        })),
      }, null, 2));

      this.indexStats.totalVectors += vectors.length;
    } catch (error) {
      this.log(`   ⚠️ Грешка при записване: ${error}`);
    }
  }

  private async searchVectors(queryEmbedding: number[], topK: number, filter?: any): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const storagePath = path.join(process.cwd(), 'data', 'vector-index');

    try {
      const files = fs.readdirSync(storagePath).filter(f => f.endsWith('-index.json'));

      for (const file of files) {
        const indexData = JSON.parse(fs.readFileSync(path.join(storagePath, file), 'utf-8'));
        
        for (const vector of indexData.vectors) {
          // Calculate cosine similarity
          const score = this.cosineSimilarity(queryEmbedding, this.generateLocalEmbedding(vector.metadata.content));
          
          results.push({
            id: vector.id,
            score,
            content: vector.metadata.content,
            metadata: vector.metadata,
          });
        }
      }

      // Sort by score and return top K
      results.sort((a, b) => b.score - a.score);
      return results.slice(0, topK);
    } catch (error) {
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  private async saveSyncState(stats: SyncStats[]): Promise<void> {
    const statePath = path.join(process.cwd(), 'data', 'vector-sync-state.json');
    
    try {
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      fs.writeFileSync(statePath, JSON.stringify({
        lastSync: Date.now(),
        stats,
        totalVectors: this.indexStats.totalVectors,
      }, null, 2));
    } catch (error) {
      this.log(`⚠️ Не можах да запиша състоянието: ${error}`);
    }
  }

  public async loadSyncState(): Promise<any> {
    const statePath = path.join(process.cwd(), 'data', 'vector-sync-state.json');
    
    try {
      return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    } catch {
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  private getProjectPath(projectName: string): string {
    const project = this.config.projects.find(p => p.name === projectName);
    return project?.path || process.cwd();
  }

  private printSyncSummary(stats: SyncStats[]): void {
    const totalFiles = stats.reduce((sum, s) => sum + s.filesScanned, 0);
    const totalChunks = stats.reduce((sum, s) => sum + s.chunksCreated, 0);
    const totalVectors = stats.reduce((sum, s) => sum + s.vectorsUpserted, 0);
    const totalDuration = stats.reduce((sum, s) => sum + s.duration, 0);
    const totalErrors = stats.reduce((sum, s) => sum + s.errors.length, 0);

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           🏛️ EMPIRE SYNC COMPLETE                             ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║   📁 Files Scanned:     ${String(totalFiles).padStart(8)}                                       ║
║   🧩 Chunks Created:    ${String(totalChunks).padStart(8)}                                       ║
║   🔢 Vectors Upserted:  ${String(totalVectors).padStart(8)}                                       ║
║   ⏱️  Duration:          ${String(totalDuration).padStart(6)}ms                                       ║
║   ❌ Errors:            ${String(totalErrors).padStart(8)}                                       ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║   Projects:                                                                   ║`);

    for (const stat of stats) {
      console.log(`║   • ${stat.project.padEnd(15)} ${String(stat.vectorsUpserted).padStart(6)} vectors                              ║`);
    }

    console.log(`╚═══════════════════════════════════════════════════════════════════════════════╝`);
  }

  private log(message: string): void {
    console.log(message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI RUNNER
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                     🧠 VECTOR SYNC - CLOUD MEMORY ENGINE                      ║
║                                                                               ║
║                    QAntum Prime v28.1.0 - Empire Architect                    ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);

  const vectorSync = new VectorSync();

  if (process.argv.includes('--sync')) {
    vectorSync.syncEmpire().catch(console.error);
  } else if (process.argv.includes('--search')) {
    const query = process.argv.slice(process.argv.indexOf('--search') + 1).join(' ');
    vectorSync.search(query).then(results => {
      console.log('\n📊 Резултати:');
      results.forEach((r, i) => {
        console.log(`${i + 1}. [${r.score.toFixed(3)}] ${r.metadata.filePath} - ${r.metadata.name}`);
      });
    });
  } else {
    console.log('Usage:');
    console.log('  npx tsx VectorSync.ts --sync         Sync all projects');
    console.log('  npx tsx VectorSync.ts --search <q>   Search the index');
  }
}

export default VectorSync;
