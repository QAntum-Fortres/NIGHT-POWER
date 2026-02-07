#!/usr/bin/env node
/**
 * 🧲 PHASE 2: NEURAL CORE MAGNET
 * 
 * Neural absorption system for vectorizing and analyzing unique modules:
 * 1. Semantic Search Engine - vector-based code search
 * 2. Pattern Recognition - identifies architectural patterns
 * 3. Auto-Documentation - generates intelligent descriptions
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface CodeVector {
  file: string;
  vector: number[];
  tokens: string[];
  embeddings: Map<string, number>;
}

interface ArchitecturalPattern {
  name: string;
  description: string;
  files: string[];
  confidence: number;
  features: string[];
}

interface ModuleDocumentation {
  file: string;
  description: string;
  purpose: string;
  dependencies: string[];
  exports: string[];
  complexity: number;
  category: string;
}

interface NeuralAbsorptionResult {
  vectors: CodeVector[];
  patterns: ArchitecturalPattern[];
  documentation: ModuleDocumentation[];
  searchIndex: Map<string, number[]>;
}

class NeuralCoreMagnet {
  private taxonomyPath: string;
  private taxonomy: any;
  private stopWords = new Set([
    'const', 'let', 'var', 'function', 'class', 'import', 'export', 'from',
    'return', 'if', 'else', 'for', 'while', 'this', 'new', 'async', 'await'
  ]);

  constructor(taxonomyPath?: string) {
    this.taxonomyPath = taxonomyPath || './analysis-output/TAXONOMY.json';
    this.loadTaxonomy();
  }

  /**
   * Load taxonomy file
   */
  private loadTaxonomy(): void {
    if (fs.existsSync(this.taxonomyPath)) {
      this.taxonomy = JSON.parse(fs.readFileSync(this.taxonomyPath, 'utf-8'));
      console.log('✅ Taxonomy loaded');
    } else {
      console.warn('⚠️  Taxonomy file not found, using all files');
      this.taxonomy = {};
    }
  }

  /**
   * Tokenize code content
   */
  private tokenize(content: string): string[] {
    // Remove comments
    content = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    
    // Extract meaningful tokens
    const tokens = content
      .split(/[\s\n\r\t{}()\[\];,.<>:'"=+\-*\/\\]+/)
      .map(t => t.toLowerCase().trim())
      .filter(t => t.length > 2 && !this.stopWords.has(t));
    
    return tokens;
  }

  /**
   * Create TF-IDF vector for code
   */
  private createVector(content: string, allTokens: Map<string, number>): CodeVector {
    const tokens = this.tokenize(content);
    const tokenFreq = new Map<string, number>();
    
    // Calculate term frequency
    tokens.forEach(token => {
      tokenFreq.set(token, (tokenFreq.get(token) || 0) + 1);
    });

    const embeddings = new Map<string, number>();
    const vector: number[] = [];

    // Calculate TF-IDF
    tokenFreq.forEach((freq, token) => {
      const tf = freq / tokens.length;
      const idf = Math.log((allTokens.size + 1) / ((allTokens.get(token) || 0) + 1));
      const tfidf = tf * idf;
      embeddings.set(token, tfidf);
      vector.push(tfidf);
    });

    return { file: '', vector, tokens, embeddings };
  }

  /**
   * Calculate global token frequencies
   */
  private calculateGlobalTokens(files: string[]): Map<string, number> {
    const globalTokens = new Map<string, number>();

    files.forEach(filePath => {
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const tokens = new Set(this.tokenize(content));
      
      tokens.forEach(token => {
        globalTokens.set(token, (globalTokens.get(token) || 0) + 1);
      });
    });

    return globalTokens;
  }

  /**
   * Vectorize unique modules
   */
  public vectorizeModules(uniqueFiles: string[]): CodeVector[] {
    console.log('🧲 Vectorizing modules...');
    
    const globalTokens = this.calculateGlobalTokens(uniqueFiles);
    const vectors: CodeVector[] = [];

    uniqueFiles.forEach(filePath => {
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const vector = this.createVector(content, globalTokens);
      vector.file = filePath;
      vectors.push(vector);
    });

    console.log(`✅ Vectorized ${vectors.length} modules`);
    return vectors;
  }

  /**
   * Identify architectural patterns
   */
  public recognizePatterns(files: string[]): ArchitecturalPattern[] {
    console.log('🔍 Recognizing architectural patterns...');
    
    const patterns: ArchitecturalPattern[] = [];

    // Pattern: Singleton
    const singletonFiles = files.filter(file => {
      const content = fs.readFileSync(file, 'utf-8');
      return content.includes('getInstance') || content.includes('instance');
    });
    if (singletonFiles.length > 0) {
      patterns.push({
        name: 'Singleton Pattern',
        description: 'Single instance pattern for shared resources',
        files: singletonFiles,
        confidence: 0.85,
        features: ['getInstance', 'static instance']
      });
    }

    // Pattern: Factory
    const factoryFiles = files.filter(file => {
      const content = fs.readFileSync(file, 'utf-8');
      return content.includes('Factory') || content.includes('create');
    });
    if (factoryFiles.length > 0) {
      patterns.push({
        name: 'Factory Pattern',
        description: 'Object creation abstraction',
        files: factoryFiles,
        confidence: 0.80,
        features: ['Factory', 'create', 'build']
      });
    }

    // Pattern: Observer/Event-Driven
    const observerFiles = files.filter(file => {
      const content = fs.readFileSync(file, 'utf-8');
      return content.includes('EventEmitter') || content.includes('subscribe') || 
             content.includes('addEventListener');
    });
    if (observerFiles.length > 0) {
      patterns.push({
        name: 'Observer Pattern',
        description: 'Event-driven architecture',
        files: observerFiles,
        confidence: 0.90,
        features: ['EventEmitter', 'subscribe', 'emit', 'on']
      });
    }

    // Pattern: Strategy
    const strategyFiles = files.filter(file => {
      const content = fs.readFileSync(file, 'utf-8');
      return content.includes('Strategy') || content.includes('algorithm');
    });
    if (strategyFiles.length > 0) {
      patterns.push({
        name: 'Strategy Pattern',
        description: 'Interchangeable algorithms',
        files: strategyFiles,
        confidence: 0.75,
        features: ['Strategy', 'execute', 'algorithm']
      });
    }

    // Pattern: Adapter
    const adapterFiles = files.filter(file => {
      const content = fs.readFileSync(file, 'utf-8');
      return content.includes('Adapter') || content.includes('Bridge');
    });
    if (adapterFiles.length > 0) {
      patterns.push({
        name: 'Adapter Pattern',
        description: 'Interface compatibility layer',
        files: adapterFiles,
        confidence: 0.82,
        features: ['Adapter', 'Bridge', 'wrap']
      });
    }

    // Pattern: Microservices
    const microserviceFiles = files.filter(file => {
      const content = fs.readFileSync(file, 'utf-8');
      return content.includes('microservice') || content.includes('api') || 
             content.includes('endpoint');
    });
    if (microserviceFiles.length > 5) {
      patterns.push({
        name: 'Microservices Architecture',
        description: 'Distributed service-oriented architecture',
        files: microserviceFiles,
        confidence: 0.88,
        features: ['api', 'endpoint', 'service', 'http']
      });
    }

    console.log(`✅ Identified ${patterns.length} architectural patterns`);
    return patterns;
  }

  /**
   * Generate auto-documentation for modules
   */
  public generateDocumentation(files: string[]): ModuleDocumentation[] {
    console.log('📝 Generating auto-documentation...');
    
    const docs: ModuleDocumentation[] = [];

    files.forEach(filePath => {
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      
      // Extract imports
      const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
      const dependencies: string[] = [];
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        dependencies.push(match[1]);
      }

      // Extract exports
      const exports: string[] = [];
      const exportClassRegex = /export\s+(?:class|interface|type)\s+(\w+)/g;
      while ((match = exportClassRegex.exec(content)) !== null) {
        exports.push(match[1]);
      }
      const exportFuncRegex = /export\s+(?:function|const)\s+(\w+)/g;
      while ((match = exportFuncRegex.exec(content)) !== null) {
        exports.push(match[1]);
      }

      // Calculate complexity (simple metric based on cyclomatic complexity indicators)
      const complexityIndicators = [
        /if\s*\(/g,
        /for\s*\(/g,
        /while\s*\(/g,
        /case\s+/g,
        /catch\s*\(/g,
        /&&|\|\|/g
      ];
      let complexity = 1;
      complexityIndicators.forEach(regex => {
        const matches = content.match(regex);
        if (matches) complexity += matches.length;
      });

      // Determine category from file path
      let category = 'other';
      for (const [cat, catFiles] of Object.entries(this.taxonomy || {})) {
        if ((catFiles as string[]).includes(filePath)) {
          category = cat;
          break;
        }
      }

      // Generate description based on file name and content
      let description = '';
      let purpose = '';

      if (fileName.includes('test')) {
        description = `Test suite for ${fileName.replace('.test', '').replace('.spec', '')}`;
        purpose = 'Automated testing and validation';
      } else if (fileName.includes('engine')) {
        description = `Core engine for ${fileName.replace('-engine', '').replace('.', ' ')}`;
        purpose = 'Processing and orchestration logic';
      } else if (fileName.includes('manager')) {
        description = `Manager for ${fileName.replace('-manager', '').replace('.', ' ')}`;
        purpose = 'Resource and state management';
      } else if (fileName.includes('adapter') || fileName.includes('bridge')) {
        description = `Integration adapter for ${fileName}`;
        purpose = 'External system integration';
      } else if (fileName.includes('controller')) {
        description = `Controller for ${fileName.replace('-controller', '')}`;
        purpose = 'Request handling and flow control';
      } else if (fileName.includes('service')) {
        description = `Service layer for ${fileName.replace('-service', '')}`;
        purpose = 'Business logic implementation';
      } else {
        description = `Module: ${fileName}`;
        purpose = 'Component implementation';
      }

      docs.push({
        file: filePath,
        description,
        purpose,
        dependencies,
        exports,
        complexity,
        category
      });
    });

    console.log(`✅ Generated documentation for ${docs.length} modules`);
    return docs;
  }

  /**
   * Build semantic search index
   */
  public buildSearchIndex(vectors: CodeVector[]): Map<string, number[]> {
    console.log('🔍 Building semantic search index...');
    
    const searchIndex = new Map<string, number[]>();

    vectors.forEach((vector, idx) => {
      vector.embeddings.forEach((score, token) => {
        if (!searchIndex.has(token)) {
          searchIndex.set(token, []);
        }
        searchIndex.get(token)!.push(idx);
      });
    });

    console.log(`✅ Search index built with ${searchIndex.size} tokens`);
    return searchIndex;
  }

  /**
   * Search code by semantic query
   */
  public semanticSearch(query: string, vectors: CodeVector[], topK: number = 10): string[] {
    const queryTokens = this.tokenize(query);
    const scores = new Map<number, number>();

    queryTokens.forEach(token => {
      vectors.forEach((vector, idx) => {
        if (vector.embeddings.has(token)) {
          scores.set(idx, (scores.get(idx) || 0) + vector.embeddings.get(token)!);
        }
      });
    });

    const sortedResults = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([idx]) => vectors[idx].file);

    return sortedResults;
  }

  /**
   * Run full neural absorption
   */
  public async absorb(targetDir: string, deduplicate: boolean = true): Promise<NeuralAbsorptionResult> {
    console.log('🧲 Starting Neural Absorption...');
    
    // Get unique files from taxonomy or scan directory
    let uniqueFiles: string[] = [];
    
    if (Object.keys(this.taxonomy).length > 0) {
      // Flatten taxonomy to get all unique files
      Object.values(this.taxonomy).forEach((files: any) => {
        uniqueFiles.push(...files);
      });
    } else {
      // Scan directory
      uniqueFiles = this.scanDirectory(targetDir);
    }

    console.log(`📁 Processing ${uniqueFiles.length} unique files`);

    const vectors = this.vectorizeModules(uniqueFiles);
    const patterns = this.recognizePatterns(uniqueFiles);
    const documentation = this.generateDocumentation(uniqueFiles);
    const searchIndex = this.buildSearchIndex(vectors);

    return {
      vectors,
      patterns,
      documentation,
      searchIndex
    };
  }

  /**
   * Scan directory for files
   */
  private scanDirectory(dir: string): string[] {
    const files: string[] = [];
    const extensions = ['.ts', '.js', '.go', '.py'];

    const scan = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }

        if (entry.isDirectory()) {
          scan(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    scan(dir);
    return files;
  }

  /**
   * Save neural absorption results
   */
  public saveResults(result: NeuralAbsorptionResult, outputDir: string): void {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save patterns
    const patternsPath = path.join(outputDir, 'architectural-patterns.json');
    fs.writeFileSync(patternsPath, JSON.stringify(result.patterns, null, 2));
    console.log(`✅ Patterns saved to ${patternsPath}`);

    // Save documentation
    const docsPath = path.join(outputDir, 'auto-documentation.json');
    fs.writeFileSync(docsPath, JSON.stringify(result.documentation, null, 2));
    console.log(`✅ Documentation saved to ${docsPath}`);

    // Save vectors (simplified)
    const vectorsPath = path.join(outputDir, 'code-vectors.json');
    const simplifiedVectors = result.vectors.map(v => ({
      file: v.file,
      tokenCount: v.tokens.length,
      topTokens: Array.from(v.embeddings.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([token, score]) => ({ token, score: score.toFixed(4) }))
    }));
    fs.writeFileSync(vectorsPath, JSON.stringify(simplifiedVectors, null, 2));
    console.log(`✅ Vectors saved to ${vectorsPath}`);

    // Save human-readable summary
    const summaryPath = path.join(outputDir, 'neural-absorption-summary.txt');
    const summary = this.generateSummary(result);
    fs.writeFileSync(summaryPath, summary);
    console.log(`✅ Summary saved to ${summaryPath}`);
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(result: NeuralAbsorptionResult): string {
    const lines: string[] = [];
    
    lines.push('🧲 NEURAL CORE MAGNET - ABSORPTION REPORT');
    lines.push('═'.repeat(60));
    lines.push('');
    
    lines.push('📊 VECTORIZATION STATISTICS:');
    lines.push(`  Total Modules Vectorized: ${result.vectors.length}`);
    lines.push(`  Average Tokens per Module: ${Math.round(result.vectors.reduce((sum, v) => sum + v.tokens.length, 0) / result.vectors.length)}`);
    lines.push(`  Search Index Size: ${result.searchIndex.size} unique tokens`);
    lines.push('');
    
    lines.push('🏗️  ARCHITECTURAL PATTERNS DETECTED:');
    result.patterns.forEach(pattern => {
      lines.push(`  ${pattern.name} (Confidence: ${(pattern.confidence * 100).toFixed(0)}%)`);
      lines.push(`    Description: ${pattern.description}`);
      lines.push(`    Files: ${pattern.files.length}`);
      lines.push(`    Features: ${pattern.features.join(', ')}`);
      lines.push('');
    });
    
    lines.push('📝 AUTO-DOCUMENTATION:');
    const categoryCounts = new Map<string, number>();
    result.documentation.forEach(doc => {
      categoryCounts.set(doc.category, (categoryCounts.get(doc.category) || 0) + 1);
    });
    categoryCounts.forEach((count, category) => {
      lines.push(`  ${category}: ${count} modules`);
    });
    lines.push('');
    
    lines.push('🔍 TOP COMPLEX MODULES:');
    const topComplex = result.documentation
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 10);
    topComplex.forEach((doc, idx) => {
      lines.push(`  ${idx + 1}. ${path.basename(doc.file)} (Complexity: ${doc.complexity})`);
    });
    
    return lines.join('\n');
  }
}

// Main execution
if (require.main === module) {
  const targetDir = process.argv[2] || process.cwd();
  const taxonomyPath = process.argv[3] || path.join(targetDir, 'analysis-output/TAXONOMY.json');
  const outputDir = process.argv[4] || path.join(targetDir, 'analysis-output');

  console.log('🚀 Starting Neural Core Magnet...');
  console.log(`📁 Target Directory: ${targetDir}`);
  console.log(`📚 Taxonomy: ${taxonomyPath}`);
  console.log('');

  const magnet = new NeuralCoreMagnet(taxonomyPath);
  
  magnet.absorb(targetDir, true).then(result => {
    console.log('');
    console.log('💾 Saving results...');
    magnet.saveResults(result, outputDir);
    
    console.log('');
    console.log('✨ Neural absorption complete!');
    console.log(`🧲 Vectorized ${result.vectors.length} modules`);
    console.log(`🏗️  Detected ${result.patterns.length} architectural patterns`);
    console.log(`📝 Generated ${result.documentation.length} documentation entries`);
  });
}

export { NeuralCoreMagnet, NeuralAbsorptionResult, ArchitecturalPattern, ModuleDocumentation };
