/**
 * 🧠 VECTOR MEMORY v35.0 - THE SINGULARITY
 * Semantic search система за QAntum Empire
 * Замества project-map.json с vector embeddings
 * 
 * @department INTELLIGENCE 🧠
 * @version 35.0.0
 * @author QAntum Empire
 * 
 * FEATURES:
 * - TF-IDF базирани embeddings (без външни зависимости)
 * - Cosine similarity за семантично търсене
 * - Автоматично индексиране на codebase
 * - Real-time re-indexing при промени
 * - Department-aware search boost
 * - Bulgarian + English support
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

interface VectorDocument {
    id: string;
    path: string;
    relativePath: string;
    department: string;
    content: string;
    summary: string;
    exports: string[];
    imports: string[];
    lines: number;
    lastModified: number;
    hash: string;
    embedding: number[];
}

interface SearchResult {
    document: VectorDocument;
    score: number;
    highlights: string[];
}

interface VectorIndex {
    version: string;
    created: number;
    updated: number;
    documentCount: number;
    vocabulary: Map<string, number>;  // term -> index
    idfScores: Map<string, number>;   // term -> idf
    documents: Map<string, VectorDocument>;
}

interface VectorMemoryConfig {
    dataDir: string;
    sourceDirs: string[];
    fileExtensions: string[];
    maxDocumentSize: number;
    embeddingDimension: number;
    departmentBoost: number;
    minTermFrequency: number;
    stopWords: Set<string>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: VectorMemoryConfig = {
    dataDir: path.join(process.cwd(), 'data/memoryals'),
    sourceDirs: [
        path.join(process.cwd(), 'src'),
        path.join(process.cwd(), 'scripts'),
        path.join(process.cwd(), 'docs')
    ],
    fileExtensions: ['.ts', '.js', '.md', '.json'],
    maxDocumentSize: 100000,  // 100KB max per file
    embeddingDimension: 512,  // Vector size
    departmentBoost: 0.2,     // Extra score for same department
    minTermFrequency: 2,      // Minimum occurrences to include in vocab
    stopWords: new Set([
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
        'in', 'to', 'for', 'of', 'with', 'as', 'by', 'from', 'that', 'this',
        'it', 'be', 'are', 'was', 'were', 'been', 'being', 'have', 'has',
        'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
        'may', 'might', 'must', 'shall', 'can', 'need', 'if', 'then',
        'import', 'export', 'const', 'let', 'var', 'function', 'class',
        'return', 'new', 'null', 'undefined', 'true', 'false', 'void'
    ])
};

const DEPARTMENT_PATTERNS: Record<string, RegExp[]> = {
    'INTELLIGENCE 🧠': [/intelligence|neural|inference|hive|cognitive|brain|memory|context/i],
    'OMEGA ⚡': [/omega|chronos|entangle|sovereign|warp|magnet|quantum|time/i],
    'PHYSICS 🔬': [/physics|cable|atom|module|hardware|gpu|performance/i],
    'FORTRESS 🏰': [/fortress|bastion|vault|security|encrypt|evidence|auth/i],
    'BIOLOGY 🧬': [/biology|mnemosyne|memory|evolve|heal|organism|mutate/i],
    'GUARDIANS 🛡️': [/guardian|watchdog|monitor|health|protect|patrol|collar/i],
    'REALITY 🌐': [/reality|growth|lead|value|business|outreach|revenue|economy/i],
    'CHEMISTRY 🔗': [/chemistry|sync|bond|harmonize|ecosystem|validator|connect/i]
};

// ============================================================================
// VECTOR MEMORY CLASS
// ============================================================================

export class VectorMemory {
    private config: VectorMemoryConfig;
    private index: VectorIndex;
    private indexFile: string;
    private initialized: boolean = false;

    constructor(config: Partial<VectorMemoryConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.indexFile = path.join(this.config.dataDir, 'vector-index.json');
        this.index = this.createEmptyIndex();
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    /**
     * Initialize vector memory - load or create index
     */
    async initialize(): Promise<void> {
        console.log('🧠 VectorMemory v35.0 initializing...');
        
        // Ensure data directory exists
        if (!fs.existsSync(this.config.dataDir)) {
            fs.mkdirSync(this.config.dataDir, { recursive: true });
        }

        // Try to load existing index
        if (fs.existsSync(this.indexFile)) {
            const loaded = this.loadIndex();
            if (loaded) {
                console.log(`📊 Loaded ${this.index.documentCount} documents from cache`);
                this.initialized = true;
                return;
            }
        }

        // Build new index
        await this.rebuildIndex();
        this.initialized = true;
    }

    /**
     * Search for documents semantically similar to query
     */
    search(query: string, options: {
        limit?: number;
        department?: string;
        minScore?: number;
    } = {}): SearchResult[] {
        const { limit = 10, department, minScore = 0.1 } = options;

        if (!this.initialized) {
            throw new Error('VectorMemory not initialized. Call initialize() first.');
        }

        // Create query embedding
        const queryTokens = this.tokenize(query);
        const queryEmbedding = this.createEmbedding(queryTokens);

        // Calculate similarity for all documents
        const results: SearchResult[] = [];
        
        for (const doc of this.index.documents.values()) {
            let score = this.cosineSimilarity(queryEmbedding, doc.embedding);

            // Department boost
            if (department && doc.department.includes(department)) {
                score += this.config.departmentBoost;
            }

            // Exact match boost
            const exactMatches = this.findExactMatches(query, doc.content);
            if (exactMatches.length > 0) {
                score += 0.3;
            }

            if (score >= minScore) {
                results.push({
                    document: doc,
                    score,
                    highlights: exactMatches
                });
            }
        }

        // Sort by score descending
        results.sort((a, b) => b.score - a.score);

        return results.slice(0, limit);
    }

    /**
     * Add or update a single document
     */
    async indexDocument(filePath: string): Promise<void> {
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            return;
        }

        const doc = await this.processFile(filePath);
        if (doc) {
            this.index.documents.set(doc.id, doc);
            this.index.documentCount = this.index.documents.size;
            this.index.updated = Date.now();
            this.saveIndex();
        }
    }

    /**
     * Remove a document from the index
     */
    removeDocument(filePath: string): void {
        const id = this.createDocumentId(filePath);
        if (this.index.documents.has(id)) {
            this.index.documents.delete(id);
            this.index.documentCount = this.index.documents.size;
            this.index.updated = Date.now();
            this.saveIndex();
        }
    }

    /**
     * Full index rebuild
     */
    async rebuildIndex(): Promise<void> {
        console.log('🔄 Rebuilding vector index...');
        
        this.index = this.createEmptyIndex();
        const allFiles: string[] = [];

        // Collect all files
        for (const sourceDir of this.config.sourceDirs) {
            if (fs.existsSync(sourceDir)) {
                this.collectFiles(sourceDir, allFiles);
            }
        }

        console.log(`📂 Found ${allFiles.length} files to index`);

        // First pass: build vocabulary
        const allTokens: string[] = [];
        const fileContents: Map<string, string> = new Map();

        for (const file of allFiles) {
            const content = this.readFile(file);
            if (content) {
                fileContents.set(file, content);
                allTokens.push(...this.tokenize(content));
            }
        }

        this.buildVocabulary(allTokens);
        console.log(`📚 Vocabulary size: ${this.index.vocabulary.size}`);

        // Second pass: create documents with embeddings
        for (const [file, content] of fileContents) {
            const doc = this.createDocument(file, content);
            if (doc) {
                this.index.documents.set(doc.id, doc);
            }
        }

        this.index.documentCount = this.index.documents.size;
        this.index.updated = Date.now();
        
        this.saveIndex();
        console.log(`✅ Indexed ${this.index.documentCount} documents`);
    }

    /**
     * Get index statistics
     */
    getStats(): {
        documents: number;
        vocabulary: number;
        departments: Record<string, number>;
        lastUpdated: Date;
    } {
        const departments: Record<string, number> = {};
        
        for (const doc of this.index.documents.values()) {
            departments[doc.department] = (departments[doc.department] || 0) + 1;
        }

        return {
            documents: this.index.documentCount,
            vocabulary: this.index.vocabulary.size,
            departments,
            lastUpdated: new Date(this.index.updated)
        };
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private createEmptyIndex(): VectorIndex {
        return {
            version: '35.0.0',
            created: Date.now(),
            updated: Date.now(),
            documentCount: 0,
            vocabulary: new Map(),
            idfScores: new Map(),
            documents: new Map()
        };
    }

    private loadIndex(): boolean {
        try {
            const raw = fs.readFileSync(this.indexFile, 'utf-8');
            const data = JSON.parse(raw);
            
            this.index = {
                ...data,
                vocabulary: new Map(Object.entries(data.vocabulary)),
                idfScores: new Map(Object.entries(data.idfScores)),
                documents: new Map(Object.entries(data.documents))
            };
            
            return true;
        } catch (err) {
            console.warn('Failed to load vector index:', err);
            return false;
        }
    }

    private saveIndex(): void {
        const serializable = {
            ...this.index,
            vocabulary: Object.fromEntries(this.index.vocabulary),
            idfScores: Object.fromEntries(this.index.idfScores),
            documents: Object.fromEntries(this.index.documents)
        };
        
        fs.writeFileSync(this.indexFile, JSON.stringify(serializable, null, 2));
    }

    private collectFiles(dir: string, files: string[]): void {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                if (!entry.name.startsWith('.') && 
                    entry.name !== 'node_modules' && 
                    entry.name !== 'dist') {
                    this.collectFiles(fullPath, files);
                }
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name);
                if (this.config.fileExtensions.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }
    }

    private readFile(filePath: string): string | null {
        try {
            const stats = fs.statSync(filePath);
            if (stats.size > this.config.maxDocumentSize) {
                return null;  // Skip large files
            }
            return fs.readFileSync(filePath, 'utf-8');
        } catch (err) {
            return null;
        }
    }

    private async processFile(filePath: string): Promise<VectorDocument | null> {
        const content = this.readFile(filePath);
        if (!content) return null;
        
        // Ensure vocabulary exists
        if (this.index.vocabulary.size === 0) {
            this.buildVocabulary(this.tokenize(content));
        }
        
        return this.createDocument(filePath, content);
    }

    private createDocument(filePath: string, content: string): VectorDocument | null {
        const tokens = this.tokenize(content);
        if (tokens.length === 0) return null;

        const id = this.createDocumentId(filePath);
        const relativePath = path.relative(process.cwd(), filePath);
        const lines = content.split('\n').length;
        const hash = crypto.createHash('md5').update(content).digest('hex');
        
        return {
            id,
            path: filePath,
            relativePath,
            department: this.detectDepartment(filePath, content),
            content: content.substring(0, 5000),  // Store preview only
            summary: this.extractSummary(content),
            exports: this.extractExports(content),
            imports: this.extractImports(content),
            lines,
            lastModified: fs.statSync(filePath).mtimeMs,
            hash,
            embedding: this.createEmbedding(tokens)
        };
    }

    private createDocumentId(filePath: string): string {
        return crypto.createHash('md5').update(filePath).digest('hex').substring(0, 16);
    }

    private tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9а-яА-Я\s]/g, ' ')  // Keep Bulgarian too
            .split(/\s+/)
            .filter(token => 
                token.length >= 2 && 
                token.length <= 30 &&
                !this.config.stopWords.has(token)
            );
    }

    private buildVocabulary(tokens: string[]): void {
        // Count term frequencies
        const termFreq = new Map<string, number>();
        for (const token of tokens) {
            termFreq.set(token, (termFreq.get(token) || 0) + 1);
        }

        // Filter by minimum frequency
        const filteredTerms = [...termFreq.entries()]
            .filter(([_, count]) => count >= this.config.minTermFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.config.embeddingDimension);

        // Create vocabulary index
        let index = 0;
        for (const [term] of filteredTerms) {
            this.index.vocabulary.set(term, index++);
        }

        // Calculate IDF scores
        const docCount = this.index.documents.size || 1;
        for (const [term, freq] of termFreq) {
            const idf = Math.log(1 + docCount / (1 + freq));
            this.index.idfScores.set(term, idf);
        }
    }

    private createEmbedding(tokens: string[]): number[] {
        const embedding = new Array(this.config.embeddingDimension).fill(0);
        
        // Count term frequencies in this document
        const termFreq = new Map<string, number>();
        for (const token of tokens) {
            termFreq.set(token, (termFreq.get(token) || 0) + 1);
        }

        // Create TF-IDF vector
        for (const [term, tf] of termFreq) {
            const vocabIndex = this.index.vocabulary.get(term);
            if (vocabIndex !== undefined && vocabIndex < this.config.embeddingDimension) {
                const idf = this.index.idfScores.get(term) || 1;
                embedding[vocabIndex] = tf * idf;
            }
        }

        // L2 normalize
        return this.normalizeVector(embedding);
    }

    private normalizeVector(vec: number[]): number[] {
        const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
        if (magnitude === 0) return vec;
        return vec.map(val => val / magnitude);
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;
        
        let dotProduct = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
        }
        
        // Vectors are already normalized
        return dotProduct;
    }

    private findExactMatches(query: string, content: string): string[] {
        const highlights: string[] = [];
        const queryLower = query.toLowerCase();
        const contentLower = content.toLowerCase();
        
        let index = contentLower.indexOf(queryLower);
        while (index !== -1 && highlights.length < 3) {
            const start = Math.max(0, index - 30);
            const end = Math.min(content.length, index + query.length + 30);
            highlights.push('...' + content.substring(start, end) + '...');
            index = contentLower.indexOf(queryLower, index + 1);
        }
        
        return highlights;
    }

    private detectDepartment(filePath: string, content: string): string {
        const combined = filePath + ' ' + content.substring(0, 500);
        
        for (const [dept, patterns] of Object.entries(DEPARTMENT_PATTERNS)) {
            if (patterns.some(p => p.test(combined))) {
                return dept;
            }
        }
        return 'CORE ⚙️';
    }

    private extractSummary(content: string): string {
        const jsdocMatch = content.match(/\/\*\*[\s\S]*?\*\//);
        if (jsdocMatch) {
            return jsdocMatch[0]
                .replace(/\/\*\*|\*\//g, '')
                .replace(/\s*\*\s*/g, ' ')
                .trim()
                .substring(0, 200);
        }
        
        const lines = content.split('\n');
        return lines.slice(0, 5).join(' ').substring(0, 200);
    }

    private extractExports(content: string): string[] {
        const exports: string[] = [];
        const regex = /export\s+(?:class|function|const|interface|type|enum)\s+(\w+)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            exports.push(match[1]);
        }
        return exports;
    }

    private extractImports(content: string): string[] {
        const imports: string[] = [];
        const regex = /import\s+.*?from\s+['"](.+?)['"]/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        return imports;
    }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
    const args = process.argv.slice(2);
    const memory = new VectorMemory();

    if (args.includes('--rebuild')) {
        await memory.initialize();
        await memory.rebuildIndex();
        console.log('\n📊 Index Statistics:');
        console.log(JSON.stringify(memory.getStats(), null, 2));
    }
    else if (args.includes('--search')) {
        const queryIndex = args.indexOf('--search') + 1;
        const query = args[queryIndex];
        
        if (!query) {
            console.error('Usage: --search "your query"');
            process.exit(1);
        }

        await memory.initialize();
        const results = memory.search(query, { limit: 5 });
        
        console.log(`\n🔍 Search results for: "${query}"\n`);
        for (const result of results) {
            console.log(`  📄 ${result.document.relativePath}`);
            console.log(`     Score: ${result.score.toFixed(3)} | Dept: ${result.document.department}`);
            console.log(`     ${result.document.summary.substring(0, 80)}...`);
            if (result.highlights.length > 0) {
                console.log(`     Highlights: ${result.highlights[0]}`);
            }
            console.log('');
        }
    }
    else if (args.includes('--stats')) {
        await memory.initialize();
        console.log('\n📊 Vector Memory Statistics:\n');
        console.log(JSON.stringify(memory.getStats(), null, 2));
    }
    else {
        console.log(`
🧠 VectorMemory v35.0 - THE SINGULARITY
=====================================

Usage:
  npx ts-node src/intelligence/VectorMemory.ts --rebuild    # Rebuild index
  npx ts-node src/intelligence/VectorMemory.ts --search "query"  # Search
  npx ts-node src/intelligence/VectorMemory.ts --stats      # Show statistics

Features:
  ✅ TF-IDF based embeddings (no external dependencies)
  ✅ Cosine similarity semantic search
  ✅ Auto-indexing of codebase
  ✅ Department-aware search boost
  ✅ Bulgarian + English support
        `);
    }
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

export { VectorDocument, SearchResult, VectorMemoryConfig };
