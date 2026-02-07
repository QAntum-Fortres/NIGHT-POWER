/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                               ║
 * ║  ██████╗ ███████╗██████╗ ███████╗███╗   ██╗██████╗ ███████╗███╗   ██╗ ██████╗██╗   ██╗        ║
 * ║  ██╔══██╗██╔════╝██╔══██╗██╔════╝████╗  ██║██╔══██╗██╔════╝████╗  ██║██╔════╝╚██╗ ██╔╝        ║
 * ║  ██║  ██║█████╗  ██████╔╝█████╗  ██╔██╗ ██║██║  ██║█████╗  ██╔██╗ ██║██║      ╚████╔╝         ║
 * ║  ██║  ██║██╔══╝  ██╔═══╝ ██╔══╝  ██║╚██╗██║██║  ██║██╔══╝  ██║╚██╗██║██║       ╚██╔╝          ║
 * ║  ██████╔╝███████╗██║     ███████╗██║ ╚████║██████╔╝███████╗██║ ╚████║╚██████╗   ██║           ║
 * ║  ╚═════╝ ╚══════╝╚═╝     ╚══════╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝   ╚═╝           ║
 * ║                                                                                               ║
 * ║   ██████╗ ██████╗  █████╗ ██████╗ ██╗  ██╗                                                    ║
 * ║  ██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██║  ██║                                                    ║
 * ║  ██║  ███╗██████╔╝███████║██████╔╝███████║                                                    ║
 * ║  ██║   ██║██╔══██╗██╔══██║██╔═══╝ ██╔══██║                                                    ║
 * ║  ╚██████╔╝██║  ██║██║  ██║██║     ██║  ██║                                                    ║
 * ║   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝                                                    ║
 * ║                                                                                               ║
 * ║              DEPENDENCY GRAPH VISUALIZER                                                      ║
 * ║         "Виж връзките. Открий циклите. Оптимизирай."                                          ║
 * ║                                                                                               ║
 * ║   Features:                                                                                   ║
 * ║     • Build dependency graph from imports                                                     ║
 * ║     • Detect circular dependencies (Tarjan's algorithm)                                       ║
 * ║     • Generate Mermaid diagrams                                                               ║
 * ║     • Generate DOT format (Graphviz)                                                          ║
 * ║     • Module coupling analysis                                                                ║
 * ║     • Layer violation detection                                                               ║
 * ║                                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                                        ║
 * ║                                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { readdir, readFile, stat, writeFile } from 'fs/promises';
import { join, extname, relative, dirname, basename, resolve } from 'path';
import { existsSync } from 'fs';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DependencyNode {
    id: string;                    // Unique identifier (relative path)
    name: string;                  // Display name
    path: string;                  // Full path
    module: string;                // Parent module/layer
    layer: ArchitectureLayer;      // Architecture layer
    imports: ImportEdge[];         // Outgoing edges
    importedBy: string[];          // Incoming edges (reverse lookup)
    exports: string[];             // What this file exports
    linesOfCode: number;
    complexity: number;            // Cyclomatic complexity estimate
}

export interface ImportEdge {
    target: string;                // Target file/module
    symbols: string[];             // Imported symbols
    isRelative: boolean;           // Is relative import
    isExternal: boolean;           // Is external package
    line: number;                  // Line number of import
}

export interface CircularDependency {
    cycle: string[];               // Files in the cycle
    severity: 'low' | 'medium' | 'high' | 'critical';
    suggestion: string;
}

export interface LayerViolation {
    source: string;
    target: string;
    sourceLayer: ArchitectureLayer;
    targetLayer: ArchitectureLayer;
    rule: string;
    severity: 'warning' | 'error';
}

export interface ModuleMetrics {
    name: string;
    files: number;
    totalLines: number;
    internalDependencies: number;
    externalDependencies: number;
    afferentCoupling: number;      // Ca - Who depends on this module
    efferentCoupling: number;      // Ce - What this module depends on
    instability: number;           // I = Ce / (Ca + Ce)
    abstractness: number;          // A = abstract classes / total classes
    distanceFromMain: number;      // D = |A + I - 1|
}

export interface GraphAnalysis {
    timestamp: string;
    projectRoot: string;
    totalNodes: number;
    totalEdges: number;
    modules: ModuleMetrics[];
    circularDependencies: CircularDependency[];
    layerViolations: LayerViolation[];
    orphanFiles: string[];         // Files with no dependencies
    hubFiles: string[];            // Files with most connections
    healthScore: number;           // 0-100
}

export type ArchitectureLayer = 
    | 'physics'      // Layer 1: Core physics/engine
    | 'biology'      // Layer 2: Evolution, adaptation
    | 'cognition'    // Layer 3: Intelligence, learning
    | 'chemistry'    // Layer 4: Orchestration
    | 'quantum'      // Layer 5: Advanced features
    | 'ui'           // UI components
    | 'utils'        // Utilities
    | 'external'     // External packages
    | 'unknown';

// Layer dependency rules (lower can import from higher, not vice versa)
const LAYER_HIERARCHY: Record<ArchitectureLayer, number> = {
    'physics': 1,
    'biology': 2,
    'cognition': 3,
    'chemistry': 4,
    'quantum': 5,
    'ui': 6,
    'utils': 0,      // Utils can be imported by anyone
    'external': -1,  // External is special
    'unknown': 99
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEPENDENCY GRAPH
// ═══════════════════════════════════════════════════════════════════════════════

export class DependencyGraph {
    private static instance: DependencyGraph;
    
    private nodes: Map<string, DependencyNode> = new Map();
    private modules: Map<string, Set<string>> = new Map();
    private projectRoot: string;
    private lastAnalysis: GraphAnalysis | null = null;

    private constructor(projectRoot: string) {
        this.projectRoot = projectRoot;
    }

    static getInstance(projectRoot?: string): DependencyGraph {
        if (!DependencyGraph.instance) {
            DependencyGraph.instance = new DependencyGraph(projectRoot || process.cwd());
        }
        return DependencyGraph.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MAIN API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Build the dependency graph from source files
     */
    async build(sourceDir?: string): Promise<GraphAnalysis> {
        const srcPath = sourceDir || join(this.projectRoot, 'src');
        console.log(`\n📊 DEPENDENCY GRAPH: Building from ${srcPath}...`);
        
        const startTime = Date.now();
        this.nodes.clear();
        this.modules.clear();

        // 1. Scan all files
        await this.scanDirectory(srcPath);
        console.log(`   ✓ ${this.nodes.size} files scanned`);

        // 2. Resolve import targets
        this.resolveImports();
        console.log(`   ✓ Import targets resolved`);

        // 3. Build reverse lookup (importedBy)
        this.buildReverseLookup();
        console.log(`   ✓ Reverse lookup built`);

        // 4. Detect circular dependencies
        const circularDeps = this.detectCircularDependencies();
        console.log(`   ✓ ${circularDeps.length} circular dependencies found`);

        // 5. Detect layer violations
        const violations = this.detectLayerViolations();
        console.log(`   ✓ ${violations.length} layer violations found`);

        // 6. Calculate metrics
        const moduleMetrics = this.calculateModuleMetrics();
        console.log(`   ✓ ${moduleMetrics.length} modules analyzed`);

        // 7. Build analysis result
        const analysis: GraphAnalysis = {
            timestamp: new Date().toISOString(),
            projectRoot: this.projectRoot,
            totalNodes: this.nodes.size,
            totalEdges: this.countEdges(),
            modules: moduleMetrics,
            circularDependencies: circularDeps,
            layerViolations: violations,
            orphanFiles: this.findOrphanFiles(),
            hubFiles: this.findHubFiles(10),
            healthScore: this.calculateHealthScore(circularDeps, violations)
        };

        this.lastAnalysis = analysis;
        
        console.log(`   ⏱️ ${Date.now() - startTime}ms`);
        console.log(`   🏥 Health Score: ${analysis.healthScore}/100\n`);

        return analysis;
    }

    /**
     * Generate Mermaid diagram
     */
    generateMermaid(options: {
        showModulesOnly?: boolean;
        highlightCycles?: boolean;
        maxNodes?: number;
    } = {}): string {
        const lines: string[] = ['flowchart TB'];
        const { showModulesOnly = false, highlightCycles = true, maxNodes = 50 } = options;

        // Get cycle nodes for highlighting
        const cycleNodes = new Set<string>();
        if (highlightCycles && this.lastAnalysis) {
            for (const cycle of this.lastAnalysis.circularDependencies) {
                cycle.cycle.forEach(n => cycleNodes.add(n));
            }
        }

        if (showModulesOnly) {
            // Show module-level dependencies
            lines.push('');
            lines.push('    %% Modules');
            
            const moduleEdges = new Map<string, Set<string>>();
            
            for (const [_, node] of this.nodes) {
                for (const imp of node.imports) {
                    if (imp.isExternal) continue;
                    
                    const targetNode = this.nodes.get(imp.target);
                    if (!targetNode) continue;
                    
                    if (node.module !== targetNode.module) {
                        if (!moduleEdges.has(node.module)) {
                            moduleEdges.set(node.module, new Set());
                        }
                        moduleEdges.get(node.module)!.add(targetNode.module);
                    }
                }
            }

            // Add module nodes
            for (const module of this.modules.keys()) {
                const files = this.modules.get(module)!;
                lines.push(`    ${this.sanitizeId(module)}["${module}<br/>${files.size} files"]`);
            }

            lines.push('');
            lines.push('    %% Dependencies');

            // Add edges
            for (const [source, targets] of moduleEdges) {
                for (const target of targets) {
                    lines.push(`    ${this.sanitizeId(source)} --> ${this.sanitizeId(target)}`);
                }
            }
        } else {
            // Show file-level dependencies
            const nodesToShow = Array.from(this.nodes.values())
                .sort((a, b) => b.importedBy.length - a.importedBy.length)
                .slice(0, maxNodes);

            lines.push('');
            lines.push('    %% Subgraphs by Layer');

            // Group by layer
            const byLayer = new Map<ArchitectureLayer, DependencyNode[]>();
            for (const node of nodesToShow) {
                if (!byLayer.has(node.layer)) {
                    byLayer.set(node.layer, []);
                }
                byLayer.get(node.layer)!.push(node);
            }

            // Add subgraphs
            for (const [layer, nodes] of byLayer) {
                if (layer === 'external') continue;
                
                lines.push(`    subgraph ${layer}["${layer.toUpperCase()}"]`);
                for (const node of nodes) {
                    const style = cycleNodes.has(node.id) ? ':::cycle' : '';
                    lines.push(`        ${this.sanitizeId(node.id)}["${node.name}"]${style}`);
                }
                lines.push('    end');
            }

            lines.push('');
            lines.push('    %% Dependencies');

            // Add edges
            const nodeIds = new Set(nodesToShow.map(n => n.id));
            for (const node of nodesToShow) {
                for (const imp of node.imports) {
                    if (imp.isExternal) continue;
                    if (!nodeIds.has(imp.target)) continue;
                    
                    const isCycleEdge = cycleNodes.has(node.id) && cycleNodes.has(imp.target);
                    const style = isCycleEdge ? ' -.->|cycle|' : ' -->';
                    lines.push(`    ${this.sanitizeId(node.id)}${style} ${this.sanitizeId(imp.target)}`);
                }
            }
        }

        // Add styles
        lines.push('');
        lines.push('    %% Styles');
        lines.push('    classDef cycle fill:#ff6b6b,stroke:#c92a2a,stroke-width:3px');
        lines.push('    classDef physics fill:#74c0fc,stroke:#1971c2');
        lines.push('    classDef biology fill:#69db7c,stroke:#2f9e44');
        lines.push('    classDef cognition fill:#ffd43b,stroke:#f59f00');
        lines.push('    classDef chemistry fill:#da77f2,stroke:#9c36b5');
        lines.push('    classDef quantum fill:#ff922b,stroke:#e8590c');

        return lines.join('\n');
    }

    /**
     * Generate DOT format for Graphviz
     */
    generateDot(showModulesOnly: boolean = true): string {
        const lines: string[] = [
            'digraph DependencyGraph {',
            '    rankdir=TB;',
            '    node [shape=box, style=filled];',
            '    edge [color="#666666"];',
            ''
        ];

        if (showModulesOnly) {
            // Module colors
            const colors: Record<string, string> = {
                physics: '#74c0fc',
                biology: '#69db7c',
                cognition: '#ffd43b',
                chemistry: '#da77f2',
                quantum: '#ff922b',
                ui: '#ff8787',
                utils: '#868e96'
            };

            // Add module nodes
            for (const [module, files] of this.modules) {
                const color = colors[module] || '#e9ecef';
                lines.push(`    "${module}" [label="${module}\\n${files.size} files", fillcolor="${color}"];`);
            }

            lines.push('');

            // Add edges
            const moduleEdges = new Set<string>();
            for (const [_, node] of this.nodes) {
                for (const imp of node.imports) {
                    if (imp.isExternal) continue;
                    const targetNode = this.nodes.get(imp.target);
                    if (!targetNode || node.module === targetNode.module) continue;
                    
                    const edgeKey = `${node.module}->${targetNode.module}`;
                    if (!moduleEdges.has(edgeKey)) {
                        moduleEdges.add(edgeKey);
                        lines.push(`    "${node.module}" -> "${targetNode.module}";`);
                    }
                }
            }
        } else {
            // File-level graph
            for (const [id, node] of this.nodes) {
                lines.push(`    "${id}" [label="${node.name}"];`);
            }
            lines.push('');
            for (const [_, node] of this.nodes) {
                for (const imp of node.imports) {
                    if (imp.isExternal) continue;
                    lines.push(`    "${node.id}" -> "${imp.target}";`);
                }
            }
        }

        lines.push('}');
        return lines.join('\n');
    }

    /**
     * Generate ASCII visualization for terminal
     */
    generateAscii(): string {
        const lines: string[] = [];
        
        lines.push('╔══════════════════════════════════════════════════════════════════════════╗');
        lines.push('║                    DEPENDENCY GRAPH VISUALIZATION                        ║');
        lines.push('╠══════════════════════════════════════════════════════════════════════════╣');
        
        // Show modules with their dependencies
        const moduleEdges = new Map<string, Set<string>>();
        
        for (const [_, node] of this.nodes) {
            for (const imp of node.imports) {
                if (imp.isExternal) continue;
                const targetNode = this.nodes.get(imp.target);
                if (!targetNode || node.module === targetNode.module) continue;
                
                if (!moduleEdges.has(node.module)) {
                    moduleEdges.set(node.module, new Set());
                }
                moduleEdges.get(node.module)!.add(targetNode.module);
            }
        }

        // Sort modules by layer
        const sortedModules = Array.from(this.modules.keys()).sort((a, b) => {
            const layerA = LAYER_HIERARCHY[a as ArchitectureLayer] || 99;
            const layerB = LAYER_HIERARCHY[b as ArchitectureLayer] || 99;
            return layerA - layerB;
        });

        lines.push('║                                                                          ║');
        
        for (const module of sortedModules) {
            const files = this.modules.get(module)!;
            const deps = moduleEdges.get(module);
            const depStr = deps && deps.size > 0 ? ` → [${Array.from(deps).join(', ')}]` : '';
            const line = `  📦 ${module.padEnd(15)} (${String(files.size).padStart(3)} files)${depStr}`;
            lines.push(`║ ${line.padEnd(72)} ║`);
        }

        lines.push('║                                                                          ║');

        // Show circular dependencies
        if (this.lastAnalysis && this.lastAnalysis.circularDependencies.length > 0) {
            lines.push('╠══════════════════════════════════════════════════════════════════════════╣');
            lines.push('║  ⚠️  CIRCULAR DEPENDENCIES                                               ║');
            lines.push('║                                                                          ║');
            
            for (const cycle of this.lastAnalysis.circularDependencies.slice(0, 5)) {
                const cycleStr = cycle.cycle.map(c => basename(c)).join(' → ');
                const truncated = cycleStr.length > 65 ? cycleStr.slice(0, 62) + '...' : cycleStr;
                lines.push(`║  🔄 ${truncated.padEnd(67)} ║`);
            }
            
            if (this.lastAnalysis.circularDependencies.length > 5) {
                lines.push(`║  ... and ${this.lastAnalysis.circularDependencies.length - 5} more                                                      ║`);
            }
        }

        // Show layer violations
        if (this.lastAnalysis && this.lastAnalysis.layerViolations.length > 0) {
            lines.push('╠══════════════════════════════════════════════════════════════════════════╣');
            lines.push('║  🚨 LAYER VIOLATIONS                                                     ║');
            lines.push('║                                                                          ║');
            
            for (const violation of this.lastAnalysis.layerViolations.slice(0, 5)) {
                const line = `${basename(violation.source)} (${violation.sourceLayer}) → ${basename(violation.target)} (${violation.targetLayer})`;
                const truncated = line.length > 65 ? line.slice(0, 62) + '...' : line;
                lines.push(`║  ❌ ${truncated.padEnd(67)} ║`);
            }
        }

        lines.push('╠══════════════════════════════════════════════════════════════════════════╣');
        
        // Health score bar
        const score = this.lastAnalysis?.healthScore || 0;
        const barLength = 50;
        const filledLength = Math.round((score / 100) * barLength);
        const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
        const scoreColor = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
        
        lines.push(`║  ${scoreColor} Health Score: [${bar}] ${score}%      ║`);
        lines.push('╚══════════════════════════════════════════════════════════════════════════╝');

        return lines.join('\n');
    }

    /**
     * Get analysis report
     */
    getReport(): string {
        if (!this.lastAnalysis) {
            return 'No analysis available. Run build() first.';
        }

        const a = this.lastAnalysis;
        const lines: string[] = [];

        lines.push('# Dependency Graph Analysis Report');
        lines.push(`Generated: ${a.timestamp}`);
        lines.push('');
        lines.push('## Overview');
        lines.push(`- **Total Files:** ${a.totalNodes}`);
        lines.push(`- **Total Dependencies:** ${a.totalEdges}`);
        lines.push(`- **Modules:** ${a.modules.length}`);
        lines.push(`- **Health Score:** ${a.healthScore}/100`);
        lines.push('');

        lines.push('## Module Metrics');
        lines.push('| Module | Files | Lines | Ca | Ce | Instability |');
        lines.push('|--------|-------|-------|----|----|-------------|');
        for (const m of a.modules) {
            lines.push(`| ${m.name} | ${m.files} | ${m.totalLines} | ${m.afferentCoupling} | ${m.efferentCoupling} | ${m.instability.toFixed(2)} |`);
        }
        lines.push('');

        if (a.circularDependencies.length > 0) {
            lines.push('## ⚠️ Circular Dependencies');
            for (const c of a.circularDependencies) {
                lines.push(`- **${c.severity.toUpperCase()}:** ${c.cycle.join(' → ')}`);
                lines.push(`  - Suggestion: ${c.suggestion}`);
            }
            lines.push('');
        }

        if (a.layerViolations.length > 0) {
            lines.push('## 🚨 Layer Violations');
            for (const v of a.layerViolations) {
                lines.push(`- **${v.severity.toUpperCase()}:** ${v.source} (${v.sourceLayer}) → ${v.target} (${v.targetLayer})`);
                lines.push(`  - Rule: ${v.rule}`);
            }
            lines.push('');
        }

        if (a.hubFiles.length > 0) {
            lines.push('## Hub Files (Most Dependencies)');
            for (const hub of a.hubFiles) {
                const node = this.nodes.get(hub);
                if (node) {
                    lines.push(`- **${node.name}:** ${node.importedBy.length} dependents, ${node.imports.length} dependencies`);
                }
            }
            lines.push('');
        }

        if (a.orphanFiles.length > 0) {
            lines.push('## Orphan Files (No Dependencies)');
            for (const orphan of a.orphanFiles.slice(0, 10)) {
                lines.push(`- ${orphan}`);
            }
            if (a.orphanFiles.length > 10) {
                lines.push(`- ... and ${a.orphanFiles.length - 10} more`);
            }
        }

        return lines.join('\n');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE METHODS
    // ─────────────────────────────────────────────────────────────────────────

    private async scanDirectory(dir: string, depth: number = 0): Promise<void> {
        if (!existsSync(dir)) return;

        const entries = await readdir(dir);

        for (const entry of entries) {
            if (entry.startsWith('.') || entry === 'node_modules') continue;

            const fullPath = join(dir, entry);
            const stats = await stat(fullPath);

            if (stats.isDirectory()) {
                await this.scanDirectory(fullPath, depth + 1);
            } else if (stats.isFile()) {
                const ext = extname(entry);
                if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
                    await this.processFile(fullPath);
                }
            }
        }
    }

    private async processFile(filePath: string): Promise<void> {
        const content = await readFile(filePath, 'utf-8');
        const relativePath = relative(this.projectRoot, filePath).replace(/\\/g, '/');
        const lines = content.split('\n');

        // Determine module and layer
        const parts = relativePath.split('/');
        const module = parts[1] || 'root'; // src/MODULE/...
        const layer = this.determineLayer(module, relativePath);

        // Extract imports
        const imports = this.extractImports(content, filePath);

        // Extract exports
        const exports = this.extractExports(content);

        // Create node
        const node: DependencyNode = {
            id: relativePath,
            name: basename(filePath),
            path: filePath,
            module,
            layer,
            imports,
            importedBy: [],
            exports,
            linesOfCode: lines.length,
            complexity: this.estimateComplexity(content)
        };

        this.nodes.set(relativePath, node);

        // Track module membership
        if (!this.modules.has(module)) {
            this.modules.set(module, new Set());
        }
        this.modules.get(module)!.add(relativePath);
    }

    private extractImports(content: string, filePath: string): ImportEdge[] {
        const imports: ImportEdge[] = [];
        const lines = content.split('\n');

        const importRegex = /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            const symbols = match[1] 
                ? match[1].split(',').map(s => s.trim().split(' as ')[0])
                : [match[2]];
            const importPath = match[3];
            const isRelative = importPath.startsWith('.');
            const isExternal = !isRelative && !importPath.startsWith('@/');

            // Find line number
            const lineIndex = content.slice(0, match.index).split('\n').length;

            imports.push({
                target: importPath,
                symbols,
                isRelative,
                isExternal,
                line: lineIndex
            });
        }

        return imports;
    }

    private extractExports(content: string): string[] {
        const exports: string[] = [];
        
        const patterns = [
            /export\s+(?:class|interface|type|enum|function|const|let|var)\s+(\w+)/g,
            /export\s+default\s+(?:class|function)?\s*(\w+)/g,
            /export\s+\{\s*([^}]+)\s*\}/g
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1]) {
                    if (match[1].includes(',')) {
                        exports.push(...match[1].split(',').map(s => s.trim()));
                    } else {
                        exports.push(match[1]);
                    }
                }
            }
        }

        return [...new Set(exports)];
    }

    private determineLayer(module: string, path: string): ArchitectureLayer {
        const layerMap: Record<string, ArchitectureLayer> = {
            'physics': 'physics',
            'biology': 'biology',
            'cognition': 'cognition',
            'chemistry': 'chemistry',
            'quantum': 'quantum',
            'ui': 'ui',
            'utils': 'utils',
            'scripts': 'utils',
            'modules': 'biology'
        };

        return layerMap[module] || 'unknown';
    }

    private resolveImports(): void {
        for (const [id, node] of this.nodes) {
            for (const imp of node.imports) {
                if (imp.isExternal) continue;

                // Resolve relative import
                if (imp.isRelative) {
                    const baseDir = dirname(node.path);
                    let resolved = resolve(baseDir, imp.target);
                    
                    // Try different extensions
                    const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
                    for (const ext of extensions) {
                        const candidate = relative(this.projectRoot, resolved + ext).replace(/\\/g, '/');
                        if (this.nodes.has(candidate)) {
                            imp.target = candidate;
                            break;
                        }
                    }
                }
            }
        }
    }

    private buildReverseLookup(): void {
        for (const [id, node] of this.nodes) {
            for (const imp of node.imports) {
                if (imp.isExternal) continue;
                
                const targetNode = this.nodes.get(imp.target);
                if (targetNode) {
                    targetNode.importedBy.push(id);
                }
            }
        }
    }

    private detectCircularDependencies(): CircularDependency[] {
        const cycles: CircularDependency[] = [];
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const path: string[] = [];

        const dfs = (nodeId: string): void => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);

            const node = this.nodes.get(nodeId);
            if (node) {
                for (const imp of node.imports) {
                    if (imp.isExternal) continue;
                    
                    if (!visited.has(imp.target)) {
                        dfs(imp.target);
                    } else if (recursionStack.has(imp.target)) {
                        // Found a cycle
                        const cycleStart = path.indexOf(imp.target);
                        const cycle = [...path.slice(cycleStart), imp.target];
                        
                        cycles.push({
                            cycle,
                            severity: this.assessCycleSeverity(cycle),
                            suggestion: this.suggestCycleFix(cycle)
                        });
                    }
                }
            }

            path.pop();
            recursionStack.delete(nodeId);
        };

        for (const [id] of this.nodes) {
            if (!visited.has(id)) {
                dfs(id);
            }
        }

        return cycles;
    }

    private assessCycleSeverity(cycle: string[]): 'low' | 'medium' | 'high' | 'critical' {
        // Cross-module cycles are more severe
        const modules = new Set(cycle.map(c => this.nodes.get(c)?.module));
        if (modules.size > 2) return 'critical';
        if (modules.size > 1) return 'high';
        if (cycle.length > 3) return 'medium';
        return 'low';
    }

    private suggestCycleFix(cycle: string[]): string {
        const nodes = cycle.map(c => this.nodes.get(c)).filter(Boolean) as DependencyNode[];
        
        // Find the node with fewest incoming dependencies - best candidate to extract
        const candidate = nodes.reduce((min, node) => 
            node.importedBy.length < min.importedBy.length ? node : min
        );

        return `Consider extracting shared functionality from ${candidate.name} into a new utility module`;
    }

    private detectLayerViolations(): LayerViolation[] {
        const violations: LayerViolation[] = [];

        for (const [id, node] of this.nodes) {
            for (const imp of node.imports) {
                if (imp.isExternal) continue;
                
                const targetNode = this.nodes.get(imp.target);
                if (!targetNode) continue;

                const sourceLevel = LAYER_HIERARCHY[node.layer];
                const targetLevel = LAYER_HIERARCHY[targetNode.layer];

                // Lower layers should not import from higher layers
                if (sourceLevel < targetLevel && targetLevel !== 0 && targetLevel !== -1) {
                    violations.push({
                        source: node.id,
                        target: targetNode.id,
                        sourceLayer: node.layer,
                        targetLayer: targetNode.layer,
                        rule: `Layer ${node.layer} (level ${sourceLevel}) should not import from ${targetNode.layer} (level ${targetLevel})`,
                        severity: Math.abs(targetLevel - sourceLevel) > 2 ? 'error' : 'warning'
                    });
                }
            }
        }

        return violations;
    }

    private calculateModuleMetrics(): ModuleMetrics[] {
        const metrics: ModuleMetrics[] = [];

        for (const [moduleName, fileIds] of this.modules) {
            let totalLines = 0;
            let internalDeps = 0;
            let externalDeps = 0;
            const dependents = new Set<string>();
            const dependencies = new Set<string>();

            for (const fileId of fileIds) {
                const node = this.nodes.get(fileId);
                if (!node) continue;

                totalLines += node.linesOfCode;

                for (const imp of node.imports) {
                    if (imp.isExternal) {
                        externalDeps++;
                    } else {
                        const targetNode = this.nodes.get(imp.target);
                        if (targetNode && targetNode.module !== moduleName) {
                            internalDeps++;
                            dependencies.add(targetNode.module);
                        }
                    }
                }

                // Track who depends on this module
                for (const depId of node.importedBy) {
                    const depNode = this.nodes.get(depId);
                    if (depNode && depNode.module !== moduleName) {
                        dependents.add(depNode.module);
                    }
                }
            }

            const Ca = dependents.size;      // Afferent coupling
            const Ce = dependencies.size;    // Efferent coupling
            const instability = (Ca + Ce) > 0 ? Ce / (Ca + Ce) : 0;

            metrics.push({
                name: moduleName,
                files: fileIds.size,
                totalLines,
                internalDependencies: internalDeps,
                externalDependencies: externalDeps,
                afferentCoupling: Ca,
                efferentCoupling: Ce,
                instability,
                abstractness: 0, // Would need AST analysis
                distanceFromMain: Math.abs(0 + instability - 1)
            });
        }

        return metrics.sort((a, b) => b.files - a.files);
    }

    private countEdges(): number {
        let count = 0;
        for (const [_, node] of this.nodes) {
            count += node.imports.filter(i => !i.isExternal).length;
        }
        return count;
    }

    private findOrphanFiles(): string[] {
        return Array.from(this.nodes.values())
            .filter(n => n.imports.filter(i => !i.isExternal).length === 0 && n.importedBy.length === 0)
            .map(n => n.id);
    }

    private findHubFiles(limit: number): string[] {
        return Array.from(this.nodes.values())
            .sort((a, b) => (b.importedBy.length + b.imports.length) - (a.importedBy.length + a.imports.length))
            .slice(0, limit)
            .map(n => n.id);
    }

    private calculateHealthScore(cycles: CircularDependency[], violations: LayerViolation[]): number {
        let score = 100;

        // Deduct for circular dependencies
        for (const cycle of cycles) {
            switch (cycle.severity) {
                case 'critical': score -= 15; break;
                case 'high': score -= 10; break;
                case 'medium': score -= 5; break;
                case 'low': score -= 2; break;
            }
        }

        // Deduct for layer violations
        for (const violation of violations) {
            score -= violation.severity === 'error' ? 5 : 2;
        }

        // Deduct for highly coupled modules
        for (const [_, files] of this.modules) {
            if (files.size > 50) score -= 2; // Very large modules
        }

        return Math.max(0, Math.min(100, score));
    }

    private estimateComplexity(content: string): number {
        // Simple cyclomatic complexity estimate
        const conditions = (content.match(/if\s*\(|else\s+if|while\s*\(|for\s*\(|switch\s*\(|\?\s*:/g) || []).length;
        return conditions + 1;
    }

    private sanitizeId(id: string): string {
        return id.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC GETTERS
    // ─────────────────────────────────────────────────────────────────────────

    getNodes(): Map<string, DependencyNode> {
        return this.nodes;
    }

    getModules(): Map<string, Set<string>> {
        return this.modules;
    }

    getLastAnalysis(): GraphAnalysis | null {
        return this.lastAnalysis;
    }

    /**
     * Save all outputs
     */
    async saveAll(outputDir: string): Promise<void> {
        const { mkdir } = await import('fs/promises');
        await mkdir(outputDir, { recursive: true });

        await writeFile(join(outputDir, 'graph.mermaid'), this.generateMermaid({ showModulesOnly: true }));
        await writeFile(join(outputDir, 'graph.dot'), this.generateDot(true));
        await writeFile(join(outputDir, 'report.md'), this.getReport());
        await writeFile(join(outputDir, 'ascii.txt'), this.generateAscii());
        
        if (this.lastAnalysis) {
            await writeFile(join(outputDir, 'analysis.json'), JSON.stringify(this.lastAnalysis, null, 2));
        }

        console.log(`📁 Saved all outputs to ${outputDir}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getDependencyGraph = (projectRoot?: string) => 
    DependencyGraph.getInstance(projectRoot);

export default DependencyGraph;

// ═══════════════════════════════════════════════════════════════════════════════
// CLI EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    (async () => {
        console.log('\n📊 DEPENDENCY GRAPH ANALYZER');
        console.log('═'.repeat(50));
        
        const graph = getDependencyGraph();
        await graph.build();

        // Print ASCII visualization
        console.log(graph.generateAscii());

        // Save all outputs
        await graph.saveAll('./data/dependency-graph');

        console.log('\n✅ Analysis complete!');
    })();
}
