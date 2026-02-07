/**
 * 🔭 QANTUM DOMAIN MAPPER - MACRO-LENS ORCHESTRATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 *   ████████╗██╗  ██╗███████╗    ██████╗  ██████╗ ███╗   ███╗ █████╗ ██╗███╗   ██╗
 *   ╚══██╔══╝██║  ██║██╔════╝    ██╔══██╗██╔═══██╗████╗ ████║██╔══██╗██║████╗  ██║
 *      ██║   ███████║█████╗      ██║  ██║██║   ██║██╔████╔██║███████║██║██╔██╗ ██║
 *      ██║   ██╔══██║██╔══╝      ██║  ██║██║   ██║██║╚██╔╝██║██╔══██║██║██║╚██╗██║
 *      ██║   ██║  ██║███████╗    ██████╔╝╚██████╔╝██║ ╚═╝ ██║██║  ██║██║██║ ╚████║
 *      ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
 *
 *   ███╗   ███╗ █████╗ ██████╗ ██████╗ ███████╗██████╗ 
 *   ████╗ ████║██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗
 *   ██╔████╔██║███████║██████╔╝██████╔╝█████╗  ██████╔╝
 *   ██║╚██╔╝██║██╔══██║██╔═══╝ ██╔═══╝ ██╔══╝  ██╔══██╗
 *   ██║ ╚═╝ ██║██║  ██║██║     ██║     ███████╗██║  ██║
 *   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═╝  ╚═╝
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 *   "QAntum Prime вече не чете код. Той управлява Домейни."
 *   
 *   Macro-Lens Orchestration:
 *   - Сканира "гората", не "дърветата"
 *   - Поставя етикети на всеки домейн
 *   - Открива архитектурни аномалии
 *   - Валидира causal dependencies
 *
 * @version 1.0.0
 * @author QAntum AI Architect
 * @phase v1.2.0 Macro-Lens
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Domain Manifest - The "soul" of each domain
 */
export interface DomainManifest {
  domainName: string;
  layer: UniversalLayer;
  purpose: string;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'SUPREME';
  dependencies: string[];
  dependents: string[];
  fileCount: number;
  lineCount: number;
  healthScore: number;
  integrityHash: string;
  lastUpdated: string;
  violations: ArchitecturalViolation[];
}

/**
 * Universal Layer - The 5 layers of existence
 */
export type UniversalLayer = 
  | 'MATH'      // DNA - Pure algorithms, constants
  | 'PHYSICS'   // Body - Hardware interaction, threads
  | 'CHEMISTRY' // Reaction - API, transformations
  | 'BIOLOGY'   // Organism - Intelligence, healing
  | 'REALITY';  // Manifestation - Output, UI

/**
 * Architectural violation
 */
export interface ArchitecturalViolation {
  type: 'CIRCULAR_DEPENDENCY' | 'LAYER_VIOLATION' | 'ARCHITECTURAL_DRIFT' | 'ORPHAN_DOMAIN';
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  source: string;
  target?: string;
}

/**
 * Domain dependency graph
 */
export interface DomainGraph {
  nodes: DomainNode[];
  edges: DomainEdge[];
  cycles: string[][];
}

export interface DomainNode {
  id: string;
  layer: UniversalLayer;
  weight: number; // File count * criticality
}

export interface DomainEdge {
  source: string;
  target: string;
  strength: number; // Import count
  valid: boolean;
}

/**
 * Big Lens Report
 */
export interface BigLensReport {
  timestamp: string;
  totalDomains: number;
  totalFiles: number;
  totalLines: number;
  healthScore: number;
  
  layerDistribution: Record<UniversalLayer, number>;
  criticalityMap: Record<string, DomainManifest['criticality']>;
  
  overloadedDomains: string[];
  optimizedDomains: string[];
  orphanDomains: string[];
  
  violations: ArchitecturalViolation[];
  recommendations: string[];
}

/**
 * Domain Mapper configuration
 */
export interface DomainMapperConfig {
  rootPath: string;
  generateManifests: boolean;
  strictMode: boolean;
  ignoredPaths: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: DomainMapperConfig = {
  rootPath: process.cwd(),
  generateManifests: true,
  strictMode: true,
  ignoredPaths: ['node_modules', 'dist', '.git', 'coverage']
};

/**
 * Layer hierarchy - defines valid dependency directions
 * A layer can only depend on layers BELOW it
 */
const LAYER_HIERARCHY: Record<UniversalLayer, number> = {
  'MATH': 1,      // Foundation - depends on nothing
  'PHYSICS': 2,   // Depends on Math
  'CHEMISTRY': 3, // Depends on Math, Physics
  'BIOLOGY': 4,   // Depends on Math, Physics, Chemistry
  'REALITY': 5    // Depends on all
};

/**
 * Domain to Layer mapping
 */
const DOMAIN_LAYER_MAP: Record<string, UniversalLayer> = {
  // MATH Layer - Pure algorithms
  'chronos': 'MATH',
  'crypto': 'MATH',
  'algorithms': 'MATH',
  'math': 'MATH',
  
  // PHYSICS Layer - Hardware & threads
  'swarm': 'PHYSICS',
  'performance': 'PHYSICS',
  'queue': 'PHYSICS',
  'workers': 'PHYSICS',
  'physics': 'PHYSICS',
  
  // CHEMISTRY Layer - Transformations & APIs
  'ghost': 'CHEMISTRY',
  'network': 'CHEMISTRY',
  'api': 'CHEMISTRY',
  'adapters': 'CHEMISTRY',
  'chemistry': 'CHEMISTRY',
  
  // BIOLOGY Layer - Intelligence & healing
  'oracle': 'BIOLOGY',
  'intelligence': 'BIOLOGY',
  'cognitive': 'BIOLOGY',
  'healing': 'BIOLOGY',
  'security': 'BIOLOGY',
  'biology': 'BIOLOGY',
  
  // REALITY Layer - Output & manifestation
  'cli': 'REALITY',
  'reporters': 'REALITY',
  'visual': 'REALITY',
  'singularity': 'REALITY',
  'reality': 'REALITY'
};

/**
 * Purpose inference patterns
 */
const PURPOSE_PATTERNS: Record<string, string> = {
  'ghost': 'Invisibility & Stealth Layer - Zero-detection automation',
  'oracle': 'Autonomous Discovery & Analysis - Site intelligence',
  'chronos': 'Time-Paradox & Predictive Simulation - Future prediction',
  'swarm': 'Parallel Execution Engine - Distributed power',
  'intelligence': 'Neural Backpack & Context - Second brain',
  'security': 'FATALITY Defense System - Predatory protection',
  'cognitive': 'AI Intelligence Core - Neural mapping',
  'healing': 'Self-Healing System - Autonomous recovery',
  'core': 'QAntum Core Engine - Central nervous system',
  'api': 'API Integration Layer - External communication',
  'visual': 'Visual Testing Module - Screenshot comparison',
  'cli': 'Command Line Interface - User interaction',
  'singularity': 'Auto-Optimization Engine - Self-improvement'
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOMAIN MAPPER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🔭 DomainMapper - Macro-Lens Orchestration Engine
 */
export class DomainMapper extends EventEmitter {
  private config: DomainMapperConfig;
  private manifests: Map<string, DomainManifest> = new Map();
  private dependencyGraph: DomainGraph = { nodes: [], edges: [], cycles: [] };

  constructor(config: Partial<DomainMapperConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 🚀 Execute full domain mapping
   */
  async mapProjectDomains(): Promise<BigLensReport> {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                       ║
║   ████████╗██╗  ██╗███████╗    ██████╗  ██████╗ ███╗   ███╗ █████╗ ██╗███╗   ██╗      ║
║   ╚══██╔══╝██║  ██║██╔════╝    ██╔══██╗██╔═══██╗████╗ ████║██╔══██╗██║████╗  ██║      ║
║      ██║   ███████║█████╗      ██║  ██║██║   ██║██╔████╔██║███████║██║██╔██╗ ██║      ║
║      ██║   ██╔══██║██╔══╝      ██║  ██║██║   ██║██║╚██╔╝██║██╔══██║██║██║╚██╗██║      ║
║      ██║   ██║  ██║███████╗    ██████╔╝╚██████╔╝██║ ╚═╝ ██║██║  ██║██║██║ ╚████║      ║
║      ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝      ║
║                                                                                       ║
║                    MACRO-LENS ORCHESTRATION ACTIVATED                                 ║
║                         "Сканираме гората, не дърветата"                              ║
║                                                                                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
`);

    const startTime = Date.now();

    // Phase 1: Discover all domains
    console.log('\n[DomainMapper] 📡 Phase 1: Discovering domains...');
    const domains = await this.discoverDomains();
    console.log(`  → Found ${domains.length} domains`);

    // Phase 2: Analyze each domain
    console.log('\n[DomainMapper] 🔬 Phase 2: Analyzing domain internals...');
    for (const domain of domains) {
      const manifest = await this.analyzeDomain(domain);
      this.manifests.set(domain, manifest);
      console.log(`  → ${domain}: ${manifest.fileCount} files, ${manifest.lineCount} lines [${manifest.layer}]`);
    }

    // Phase 3: Build dependency graph
    console.log('\n[DomainMapper] 🕸️ Phase 3: Building dependency graph...');
    await this.buildDependencyGraph();
    console.log(`  → ${this.dependencyGraph.edges.length} dependencies found`);

    // Phase 4: Detect violations
    console.log('\n[DomainMapper] 🚨 Phase 4: Detecting architectural violations...');
    const violations = this.detectViolations();
    console.log(`  → ${violations.length} violations detected`);

    // Phase 5: Generate manifests
    if (this.config.generateManifests) {
      console.log('\n[DomainMapper] 📝 Phase 5: Generating domain manifests...');
      await this.generateManifests();
      console.log(`  → Generated ${this.manifests.size} .domain.json files`);
    }

    // Phase 6: Generate Big Lens Report
    console.log('\n[DomainMapper] 📊 Phase 6: Generating Big Lens Report...');
    const report = this.generateBigLensReport();

    const duration = Date.now() - startTime;
    console.log(`\n[DomainMapper] ✅ Mapping complete in ${(duration / 1000).toFixed(1)}s`);

    this.printBigLensReport(report);

    return report;
  }

  /**
   * Discover all domains (folders) in src/
   */
  private async discoverDomains(): Promise<string[]> {
    const srcPath = path.join(this.config.rootPath, 'src');
    const domains: string[] = [];

    if (!fs.existsSync(srcPath)) {
      return domains;
    }

    const entries = await fs.promises.readdir(srcPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && !this.config.ignoredPaths.includes(entry.name)) {
        domains.push(entry.name);
      }
    }

    return domains;
  }

  /**
   * Analyze a single domain
   */
  private async analyzeDomain(domainName: string): Promise<DomainManifest> {
    const domainPath = path.join(this.config.rootPath, 'src', domainName);
    
    // Count files and lines
    const { fileCount, lineCount } = await this.countDomainStats(domainPath);
    
    // Determine layer
    const layer = this.inferLayer(domainName);
    
    // Infer purpose
    const purpose = this.inferPurpose(domainName);
    
    // Determine criticality
    const criticality = this.inferCriticality(domainName, fileCount);
    
    // Generate integrity hash
    const integrityHash = await this.generateDomainHash(domainPath);

    return {
      domainName,
      layer,
      purpose,
      criticality,
      dependencies: [],
      dependents: [],
      fileCount,
      lineCount,
      healthScore: 100, // Will be calculated later
      integrityHash,
      lastUpdated: new Date().toISOString(),
      violations: []
    };
  }

  /**
   * Count files and lines in a domain
   */
  private async countDomainStats(domainPath: string): Promise<{ fileCount: number; lineCount: number }> {
    let fileCount = 0;
    let lineCount = 0;

    const countRecursive = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await countRecursive(fullPath);
          } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
            fileCount++;
            try {
              const content = await fs.promises.readFile(fullPath, 'utf-8');
              lineCount += content.split('\n').length;
            } catch {
              // Skip unreadable files
            }
          }
        }
      } catch {
        // Skip unreadable directories
      }
    };

    await countRecursive(domainPath);
    return { fileCount, lineCount };
  }

  /**
   * Infer the universal layer for a domain
   */
  private inferLayer(domainName: string): UniversalLayer {
    const lower = domainName.toLowerCase();
    
    // Check direct mapping
    if (DOMAIN_LAYER_MAP[lower]) {
      return DOMAIN_LAYER_MAP[lower];
    }
    
    // Pattern matching
    if (lower.includes('math') || lower.includes('algo') || lower.includes('chrono')) return 'MATH';
    if (lower.includes('swarm') || lower.includes('thread') || lower.includes('perf')) return 'PHYSICS';
    if (lower.includes('ghost') || lower.includes('api') || lower.includes('network')) return 'CHEMISTRY';
    if (lower.includes('neural') || lower.includes('heal') || lower.includes('cogn')) return 'BIOLOGY';
    if (lower.includes('ui') || lower.includes('report') || lower.includes('cli')) return 'REALITY';
    
    // Default to CHEMISTRY (middle layer)
    return 'CHEMISTRY';
  }

  /**
   * Infer purpose from domain name
   */
  private inferPurpose(domainName: string): string {
    const lower = domainName.toLowerCase();
    return PURPOSE_PATTERNS[lower] || `${domainName} Module - General functionality`;
  }

  /**
   * Infer criticality based on domain characteristics
   */
  private inferCriticality(domainName: string, fileCount: number): DomainManifest['criticality'] {
    const lower = domainName.toLowerCase();
    
    // Supreme criticality domains
    if (['security', 'core', 'intelligence'].includes(lower)) return 'SUPREME';
    
    // High criticality domains
    if (['oracle', 'ghost', 'chronos', 'swarm'].includes(lower)) return 'HIGH';
    
    // Based on size
    if (fileCount > 10) return 'HIGH';
    if (fileCount > 5) return 'MEDIUM';
    
    return 'LOW';
  }

  /**
   * Generate integrity hash for a domain
   */
  private async generateDomainHash(domainPath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    
    const hashRecursive = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        entries.sort((a, b) => a.name.localeCompare(b.name));
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await hashRecursive(fullPath);
          } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
            try {
              const content = await fs.promises.readFile(fullPath, 'utf-8');
              hash.update(content);
            } catch {
              // Skip
            }
          }
        }
      } catch {
        // Skip
      }
    };

    await hashRecursive(domainPath);
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Build dependency graph by analyzing imports
   */
  private async buildDependencyGraph(): Promise<void> {
    const nodes: DomainNode[] = [];
    const edges: DomainEdge[] = [];
    const edgeMap = new Map<string, number>();

    // Create nodes
    for (const [name, manifest] of this.manifests) {
      nodes.push({
        id: name,
        layer: manifest.layer,
        weight: manifest.fileCount * (manifest.criticality === 'SUPREME' ? 4 : manifest.criticality === 'HIGH' ? 3 : manifest.criticality === 'MEDIUM' ? 2 : 1)
      });
    }

    // Analyze imports to create edges
    for (const [domainName] of this.manifests) {
      const domainPath = path.join(this.config.rootPath, 'src', domainName);
      const imports = await this.analyzeImports(domainPath);
      
      for (const [targetDomain, count] of Object.entries(imports)) {
        if (targetDomain !== domainName && this.manifests.has(targetDomain)) {
          const key = `${domainName}->${targetDomain}`;
          edgeMap.set(key, (edgeMap.get(key) || 0) + count);
          
          // Update dependencies
          const sourceManifest = this.manifests.get(domainName);
          const targetManifest = this.manifests.get(targetDomain);
          
          if (sourceManifest && !sourceManifest.dependencies.includes(targetDomain)) {
            sourceManifest.dependencies.push(targetDomain);
          }
          if (targetManifest && !targetManifest.dependents.includes(domainName)) {
            targetManifest.dependents.push(domainName);
          }
        }
      }
    }

    // Create edges with validation
    for (const [key, strength] of edgeMap) {
      const [source, target] = key.split('->');
      const sourceManifest = this.manifests.get(source);
      const targetManifest = this.manifests.get(target);
      
      const valid = sourceManifest && targetManifest 
        ? LAYER_HIERARCHY[sourceManifest.layer] >= LAYER_HIERARCHY[targetManifest.layer]
        : true;
      
      edges.push({ source, target, strength, valid });
    }

    // Detect cycles
    const cycles = this.detectCycles(edges);

    this.dependencyGraph = { nodes, edges, cycles };
  }

  /**
   * Analyze imports in a domain
   */
  private async analyzeImports(domainPath: string): Promise<Record<string, number>> {
    const imports: Record<string, number> = {};
    
    const analyzeFile = async (filePath: string): Promise<void> => {
      try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        
        // Match import statements
        const importRegex = /from\s+['"]\.\.\/([^/'"\s]+)/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
          const importedDomain = match[1];
          imports[importedDomain] = (imports[importedDomain] || 0) + 1;
        }
      } catch {
        // Skip
      }
    };

    const analyzeRecursive = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await analyzeRecursive(fullPath);
          } else if (entry.name.endsWith('.ts')) {
            await analyzeFile(fullPath);
          }
        }
      } catch {
        // Skip
      }
    };

    await analyzeRecursive(domainPath);
    return imports;
  }

  /**
   * Detect cycles in dependency graph
   */
  private detectCycles(edges: DomainEdge[]): string[][] {
    const cycles: string[][] = [];
    const adjacency = new Map<string, string[]>();
    
    // Build adjacency list
    for (const edge of edges) {
      if (!adjacency.has(edge.source)) {
        adjacency.set(edge.source, []);
      }
      adjacency.get(edge.source)!.push(edge.target);
    }

    // DFS for cycle detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = adjacency.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          // Found cycle
          const cycleStart = path.indexOf(neighbor);
          cycles.push(path.slice(cycleStart));
          return true;
        }
      }

      path.pop();
      recursionStack.delete(node);
      return false;
    };

    for (const node of adjacency.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  /**
   * Detect architectural violations
   */
  private detectViolations(): ArchitecturalViolation[] {
    const violations: ArchitecturalViolation[] = [];

    // Check for circular dependencies
    for (const cycle of this.dependencyGraph.cycles) {
      violations.push({
        type: 'CIRCULAR_DEPENDENCY',
        severity: 'CRITICAL',
        message: `Circular dependency detected: ${cycle.join(' -> ')} -> ${cycle[0]}`,
        source: cycle[0],
        target: cycle[cycle.length - 1]
      });
    }

    // Check for layer violations
    for (const edge of this.dependencyGraph.edges) {
      if (!edge.valid) {
        const sourceManifest = this.manifests.get(edge.source);
        const targetManifest = this.manifests.get(edge.target);
        
        violations.push({
          type: 'LAYER_VIOLATION',
          severity: 'ERROR',
          message: `${edge.source} (${sourceManifest?.layer}) depends on ${edge.target} (${targetManifest?.layer}) - violates causal hierarchy`,
          source: edge.source,
          target: edge.target
        });
      }
    }

    // Check for orphan domains
    for (const [name, manifest] of this.manifests) {
      if (manifest.dependencies.length === 0 && manifest.dependents.length === 0 && manifest.fileCount > 0) {
        violations.push({
          type: 'ORPHAN_DOMAIN',
          severity: 'WARNING',
          message: `${name} is isolated - no dependencies or dependents`,
          source: name
        });
      }
    }

    // Update manifests with violations
    for (const violation of violations) {
      const manifest = this.manifests.get(violation.source);
      if (manifest) {
        manifest.violations.push(violation);
        manifest.healthScore -= violation.severity === 'CRITICAL' ? 30 : violation.severity === 'ERROR' ? 20 : 10;
      }
    }

    return violations;
  }

  /**
   * Generate .domain.json manifests
   */
  private async generateManifests(): Promise<void> {
    for (const [domainName, manifest] of this.manifests) {
      const domainPath = path.join(this.config.rootPath, 'src', domainName);
      const manifestPath = path.join(domainPath, '.domain.json');
      
      try {
        await fs.promises.writeFile(
          manifestPath,
          JSON.stringify(manifest, null, 2),
          'utf-8'
        );
      } catch (error) {
        console.error(`  ⚠️ Failed to write manifest for ${domainName}`);
      }
    }
  }

  /**
   * Generate Big Lens Report
   */
  private generateBigLensReport(): BigLensReport {
    let totalFiles = 0;
    let totalLines = 0;
    let totalHealth = 0;
    
    const layerDistribution: Record<UniversalLayer, number> = {
      'MATH': 0,
      'PHYSICS': 0,
      'CHEMISTRY': 0,
      'BIOLOGY': 0,
      'REALITY': 0
    };
    
    const criticalityMap: Record<string, DomainManifest['criticality']> = {};
    const overloadedDomains: string[] = [];
    const optimizedDomains: string[] = [];
    const orphanDomains: string[] = [];
    const allViolations: ArchitecturalViolation[] = [];

    for (const [name, manifest] of this.manifests) {
      totalFiles += manifest.fileCount;
      totalLines += manifest.lineCount;
      totalHealth += manifest.healthScore;
      
      layerDistribution[manifest.layer]++;
      criticalityMap[name] = manifest.criticality;
      
      // Overloaded: > 1000 lines or > 10 files
      if (manifest.lineCount > 1000 || manifest.fileCount > 10) {
        overloadedDomains.push(name);
      }
      
      // Optimized: health 90+
      if (manifest.healthScore >= 90) {
        optimizedDomains.push(name);
      }
      
      // Orphan
      if (manifest.violations.some(v => v.type === 'ORPHAN_DOMAIN')) {
        orphanDomains.push(name);
      }
      
      allViolations.push(...manifest.violations);
    }

    const healthScore = this.manifests.size > 0 
      ? Math.round(totalHealth / this.manifests.size) 
      : 100;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (allViolations.some(v => v.type === 'CIRCULAR_DEPENDENCY')) {
      recommendations.push('🔴 CRITICAL: Break circular dependencies to ensure clean architecture');
    }
    
    if (allViolations.some(v => v.type === 'LAYER_VIOLATION')) {
      recommendations.push('🟠 HIGH: Fix layer violations - ensure Math→Physics→Chemistry→Biology→Reality flow');
    }
    
    if (overloadedDomains.length > 0) {
      recommendations.push(`🟡 MEDIUM: Consider splitting overloaded domains: ${overloadedDomains.join(', ')}`);
    }
    
    if (orphanDomains.length > 0) {
      recommendations.push(`🟢 LOW: Review orphan domains for integration or removal: ${orphanDomains.join(', ')}`);
    }

    return {
      timestamp: new Date().toISOString(),
      totalDomains: this.manifests.size,
      totalFiles,
      totalLines,
      healthScore,
      layerDistribution,
      criticalityMap,
      overloadedDomains,
      optimizedDomains,
      orphanDomains,
      violations: allViolations,
      recommendations
    };
  }

  /**
   * Print Big Lens Report
   */
  private printBigLensReport(report: BigLensReport): void {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                         🔭 THE BIG LENS REPORT                                        ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║  "Какво виждам в гората?"                                                             ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                       ║
║  📊 MACRO STATISTICS                                                                  ║
║  ─────────────────────────────────────────────────────────────────────────────────    ║
║  Total Domains:    ${report.totalDomains.toString().padEnd(60)}║
║  Total Files:      ${report.totalFiles.toString().padEnd(60)}║
║  Total Lines:      ${report.totalLines.toString().padEnd(60)}║
║  Health Score:     ${report.healthScore}/100${' '.repeat(55)}║
║                                                                                       ║
║  🏛️ UNIVERSAL LAYER DISTRIBUTION                                                      ║
║  ─────────────────────────────────────────────────────────────────────────────────    ║
║  MATH (DNA):       ${report.layerDistribution.MATH.toString().padEnd(60)}║
║  PHYSICS (Body):   ${report.layerDistribution.PHYSICS.toString().padEnd(60)}║
║  CHEMISTRY (React):${report.layerDistribution.CHEMISTRY.toString().padEnd(60)}║
║  BIOLOGY (Org):    ${report.layerDistribution.BIOLOGY.toString().padEnd(60)}║
║  REALITY (Output): ${report.layerDistribution.REALITY.toString().padEnd(60)}║
║                                                                                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
`);

    // Print violations
    if (report.violations.length > 0) {
      console.log('🚨 ARCHITECTURAL VIOLATIONS:');
      for (const v of report.violations) {
        const icon = v.severity === 'CRITICAL' ? '🔴' : v.severity === 'ERROR' ? '🟠' : '🟡';
        console.log(`  ${icon} [${v.type}] ${v.message}`);
      }
    } else {
      console.log('✅ No architectural violations detected!');
    }

    // Print recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      for (const rec of report.recommendations) {
        console.log(`  ${rec}`);
      }
    }

    // Print domain status
    console.log('\n📋 DOMAIN STATUS:');
    if (report.overloadedDomains.length > 0) {
      console.log(`  ⚠️ Overloaded: ${report.overloadedDomains.join(', ')}`);
    }
    if (report.optimizedDomains.length > 0) {
      console.log(`  ✅ Optimized: ${report.optimizedDomains.join(', ')}`);
    }
    if (report.orphanDomains.length > 0) {
      console.log(`  🔍 Orphan: ${report.orphanDomains.join(', ')}`);
    }
  }

  /**
   * Get all manifests
   */
  getManifests(): Map<string, DomainManifest> {
    return this.manifests;
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph(): DomainGraph {
    return this.dependencyGraph;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export function createDomainMapper(config?: Partial<DomainMapperConfig>): DomainMapper {
  return new DomainMapper(config);
}

export default DomainMapper;
