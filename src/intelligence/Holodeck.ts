/**
 * 🌌 HOLODECK v35.0 - 3D VISUAL DASHBOARD
 * Real-time 3D визуализация на DependencyGraph
 * 
 * @department INTELLIGENCE 🧠
 * @version 35.0.0
 * @author QAntum Empire
 * 
 * TECH: D3.js + Three.js compatible data structures
 * OUTPUT: JSON for frontend visualization
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface GraphNode {
    id: string;
    label: string;
    department: string;
    type: 'module' | 'script' | 'data' | 'config';
    size: number;      // Lines of code / importance
    color: string;     // Department color
    x?: number;
    y?: number;
    z?: number;
    connections: number;
    health: number;    // 0-100
    lastUpdated: number;
    metadata: Record<string, any>;
}

interface GraphEdge {
    id: string;
    source: string;
    target: string;
    type: 'import' | 'export' | 'call' | 'data' | 'event';
    weight: number;
    bidirectional: boolean;
}

interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
    stats: {
        totalNodes: number;
        totalEdges: number;
        avgConnections: number;
        clusters: number;
        density: number;
    };
    generated: number;
}

interface HolodeckConfig {
    dataDir: string;
    sourceDirs: string[];
    outputFile: string;
    includeTypes: string[];
    maxNodes: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: HolodeckConfig = {
    dataDir: path.join(process.cwd(), 'data/holodeck'),
    sourceDirs: [
        path.join(process.cwd(), 'src'),
        path.join(process.cwd(), 'scripts')
    ],
    outputFile: 'dependency-graph.json',
    includeTypes: ['.ts', '.js'],
    maxNodes: 500
};

const DEPARTMENT_COLORS: Record<string, string> = {
    'INTELLIGENCE': '#8B5CF6',  // Purple
    'OMEGA': '#F59E0B',         // Amber
    'PHYSICS': '#3B82F6',       // Blue
    'FORTRESS': '#EF4444',      // Red
    'BIOLOGY': '#10B981',       // Green
    'GUARDIANS': '#6366F1',     // Indigo
    'REALITY': '#EC4899',       // Pink
    'CHEMISTRY': '#14B8A6',     // Teal
    'CORE': '#6B7280'           // Gray
};

const DEPARTMENT_PATTERNS: Record<string, RegExp> = {
    'INTELLIGENCE': /intelligence|neural|inference|hive|cognitive|brain|memory|context|vector/i,
    'OMEGA': /omega|chronos|entangle|sovereign|warp|magnet|quantum|time/i,
    'PHYSICS': /physics|cable|atom|module|hardware|gpu|performance|predictive/i,
    'FORTRESS': /fortress|bastion|vault|security|encrypt|evidence|auth|kill/i,
    'BIOLOGY': /biology|mnemosyne|memory|evolve|heal|organism|mutate/i,
    'GUARDIANS': /guardian|watchdog|monitor|health|protect|patrol|collar|eternal/i,
    'REALITY': /reality|growth|lead|value|business|outreach|revenue|economy|midas/i,
    'CHEMISTRY': /chemistry|sync|bond|harmonize|ecosystem|validator|connect/i
};

// ============================================================================
// HOLODECK CLASS
// ============================================================================

export class Holodeck {
    private config: HolodeckConfig;
    private nodes: Map<string, GraphNode> = new Map();
    private edges: Map<string, GraphEdge> = new Map();

    constructor(config: Partial<HolodeckConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        
        if (!fs.existsSync(this.config.dataDir)) {
            fs.mkdirSync(this.config.dataDir, { recursive: true });
        }
    }

    /**
     * Scan codebase and build dependency graph
     */
    async scan(): Promise<GraphData> {
        console.log('🌌 Holodeck scanning codebase...');
        
        this.nodes.clear();
        this.edges.clear();

        // Collect all files
        const files: string[] = [];
        for (const dir of this.config.sourceDirs) {
            if (fs.existsSync(dir)) {
                this.collectFiles(dir, files);
            }
        }

        console.log(`📂 Found ${files.length} files`);

        // First pass: Create nodes
        for (const file of files.slice(0, this.config.maxNodes)) {
            const node = this.createNode(file);
            if (node) {
                this.nodes.set(node.id, node);
            }
        }

        // Second pass: Create edges from imports
        for (const file of files.slice(0, this.config.maxNodes)) {
            this.extractEdges(file);
        }

        // Calculate positions (force-directed layout simulation)
        this.calculatePositions();

        // Update connection counts
        for (const node of this.nodes.values()) {
            node.connections = this.countConnections(node.id);
        }

        const graphData = this.exportGraph();
        this.saveGraph(graphData);

        console.log(`✅ Graph generated: ${graphData.stats.totalNodes} nodes, ${graphData.stats.totalEdges} edges`);
        
        return graphData;
    }

    /**
     * Generate HTML visualization
     */
    generateVisualization(): string {
        const graphData = this.exportGraph();
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌌 Holodeck - QAntum Empire v35.0</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: #0a0a0f; 
            color: #fff; 
            font-family: 'Segoe UI', monospace;
            overflow: hidden;
        }
        #header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            padding: 15px 20px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2));
            border-bottom: 1px solid rgba(139, 92, 246, 0.3);
            z-index: 100;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #header h1 { 
            font-size: 24px; 
            background: linear-gradient(90deg, #8B5CF6, #3B82F6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        #stats {
            display: flex;
            gap: 30px;
        }
        .stat { text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #8B5CF6; }
        .stat-label { font-size: 12px; opacity: 0.7; }
        #graph { width: 100vw; height: 100vh; }
        .node { cursor: pointer; }
        .node circle { stroke: #fff; stroke-width: 1.5px; }
        .node text { fill: #fff; font-size: 10px; text-anchor: middle; }
        .link { stroke: rgba(139, 92, 246, 0.3); stroke-width: 1px; }
        .link:hover { stroke: #8B5CF6; stroke-width: 2px; }
        #tooltip {
            position: fixed;
            background: rgba(10, 10, 15, 0.95);
            border: 1px solid #8B5CF6;
            padding: 10px 15px;
            border-radius: 8px;
            display: none;
            z-index: 200;
            max-width: 300px;
        }
        #legend {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(10, 10, 15, 0.9);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid rgba(139, 92, 246, 0.3);
        }
        .legend-item { display: flex; align-items: center; gap: 8px; margin: 5px 0; }
        .legend-color { width: 12px; height: 12px; border-radius: 50%; }
    </style>
</head>
<body>
    <div id="header">
        <h1>🌌 HOLODECK v35.0 - QAntum Empire</h1>
        <div id="stats">
            <div class="stat">
                <div class="stat-value">${graphData.stats.totalNodes}</div>
                <div class="stat-label">NODES</div>
            </div>
            <div class="stat">
                <div class="stat-value">${graphData.stats.totalEdges}</div>
                <div class="stat-label">EDGES</div>
            </div>
            <div class="stat">
                <div class="stat-value">${graphData.stats.avgConnections.toFixed(1)}</div>
                <div class="stat-label">AVG CONNECTIONS</div>
            </div>
            <div class="stat">
                <div class="stat-value">${(graphData.stats.density * 100).toFixed(1)}%</div>
                <div class="stat-label">DENSITY</div>
            </div>
        </div>
    </div>
    
    <svg id="graph"></svg>
    
    <div id="tooltip"></div>
    
    <div id="legend">
        <strong>Departments</strong>
        ${Object.entries(DEPARTMENT_COLORS).map(([dept, color]) => 
            `<div class="legend-item"><div class="legend-color" style="background: ${color}"></div>${dept}</div>`
        ).join('')}
    </div>
    
    <script>
        const data = ${JSON.stringify(graphData)};
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        const svg = d3.select("#graph")
            .attr("width", width)
            .attr("height", height);
        
        // Create zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            });
        
        svg.call(zoom);
        
        const container = svg.append("g");
        
        // Create force simulation
        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.edges).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => Math.sqrt(d.size) + 10));
        
        // Create links
        const link = container.append("g")
            .selectAll("line")
            .data(data.edges)
            .join("line")
            .attr("class", "link");
        
        // Create nodes
        const node = container.append("g")
            .selectAll("g")
            .data(data.nodes)
            .join("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
        
        node.append("circle")
            .attr("r", d => Math.max(5, Math.sqrt(d.size / 10)))
            .attr("fill", d => d.color);
        
        node.append("text")
            .attr("dy", d => Math.max(5, Math.sqrt(d.size / 10)) + 12)
            .text(d => d.label.split('/').pop().replace(/\\.[tj]s$/, ''));
        
        // Tooltip
        const tooltip = d3.select("#tooltip");
        
        node.on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(\`
                    <strong>\${d.label}</strong><br>
                    Department: \${d.department}<br>
                    Size: \${d.size} lines<br>
                    Connections: \${d.connections}<br>
                    Health: \${d.health}%
                \`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        }).on("mouseout", () => {
            tooltip.style("display", "none");
        });
        
        // Update positions on tick
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            
            node.attr("transform", d => \`translate(\${d.x},\${d.y})\`);
        });
        
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
    </script>
</body>
</html>`;

        const outputPath = path.join(this.config.dataDir, 'holodeck.html');
        fs.writeFileSync(outputPath, html);
        
        return outputPath;
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
                if (this.config.includeTypes.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }
    }

    private createNode(filePath: string): GraphNode | null {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const stats = fs.statSync(filePath);
            const relativePath = path.relative(process.cwd(), filePath);
            const lines = content.split('\n').length;
            
            const department = this.detectDepartment(relativePath, content);
            const type = this.detectType(filePath);

            return {
                id: relativePath,
                label: relativePath,
                department,
                type,
                size: lines,
                color: DEPARTMENT_COLORS[department] || DEPARTMENT_COLORS['CORE'],
                connections: 0,
                health: 100,
                lastUpdated: stats.mtimeMs,
                metadata: {
                    exports: this.extractExports(content),
                    hasTests: content.includes('describe(') || content.includes('test(')
                }
            };
        } catch (err) {
            return null;
        }
    }

    private extractEdges(filePath: string): void {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const relativePath = path.relative(process.cwd(), filePath);
            
            // Extract imports
            const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
            let match;
            
            while ((match = importRegex.exec(content)) !== null) {
                const importPath = match[1];
                
                // Resolve relative imports
                if (importPath.startsWith('.')) {
                    const resolved = this.resolveImport(filePath, importPath);
                    if (resolved && this.nodes.has(resolved)) {
                        const edgeId = `${relativePath}->${resolved}`;
                        if (!this.edges.has(edgeId)) {
                            this.edges.set(edgeId, {
                                id: edgeId,
                                source: relativePath,
                                target: resolved,
                                type: 'import',
                                weight: 1,
                                bidirectional: false
                            });
                        }
                    }
                }
            }
        } catch (err) {
            // Ignore
        }
    }

    private resolveImport(fromFile: string, importPath: string): string | null {
        const dir = path.dirname(fromFile);
        let resolved = path.join(dir, importPath);
        
        // Try with extensions
        for (const ext of ['.ts', '.js', '/index.ts', '/index.js']) {
            const withExt = resolved + ext;
            const relativePath = path.relative(process.cwd(), withExt);
            if (this.nodes.has(relativePath)) {
                return relativePath;
            }
        }
        
        return null;
    }

    private detectDepartment(filePath: string, content: string): string {
        const combined = filePath + ' ' + content.substring(0, 500);
        
        for (const [dept, pattern] of Object.entries(DEPARTMENT_PATTERNS)) {
            if (pattern.test(combined)) {
                return dept;
            }
        }
        return 'CORE';
    }

    private detectType(filePath: string): 'module' | 'script' | 'data' | 'config' {
        if (filePath.includes('scripts/')) return 'script';
        if (filePath.includes('data/')) return 'data';
        if (filePath.includes('config') || filePath.includes('.json')) return 'config';
        return 'module';
    }

    private extractExports(content: string): string[] {
        const exports: string[] = [];
        const regex = /export\s+(?:class|function|const|interface|type)\s+(\w+)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            exports.push(match[1]);
        }
        return exports;
    }

    private countConnections(nodeId: string): number {
        let count = 0;
        for (const edge of this.edges.values()) {
            if (edge.source === nodeId || edge.target === nodeId) {
                count++;
            }
        }
        return count;
    }

    private calculatePositions(): void {
        // Simple radial layout by department
        const departments = [...new Set([...this.nodes.values()].map(n => n.department))];
        const angleStep = (2 * Math.PI) / departments.length;
        
        let i = 0;
        for (const dept of departments) {
            const deptNodes = [...this.nodes.values()].filter(n => n.department === dept);
            const baseAngle = angleStep * i;
            const radius = 300;
            
            let j = 0;
            for (const node of deptNodes) {
                const angle = baseAngle + (j * 0.2);
                const r = radius + (j * 30);
                node.x = 500 + r * Math.cos(angle);
                node.y = 400 + r * Math.sin(angle);
                node.z = Math.random() * 100;
                j++;
            }
            i++;
        }
    }

    private exportGraph(): GraphData {
        const nodes = [...this.nodes.values()];
        const edges = [...this.edges.values()];
        
        const totalConnections = edges.length * 2;
        const maxPossibleEdges = nodes.length * (nodes.length - 1) / 2;
        
        return {
            nodes,
            edges,
            stats: {
                totalNodes: nodes.length,
                totalEdges: edges.length,
                avgConnections: nodes.length > 0 ? totalConnections / nodes.length : 0,
                clusters: new Set(nodes.map(n => n.department)).size,
                density: maxPossibleEdges > 0 ? edges.length / maxPossibleEdges : 0
            },
            generated: Date.now()
        };
    }

    private saveGraph(data: GraphData): void {
        const outputPath = path.join(this.config.dataDir, this.config.outputFile);
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
    const args = process.argv.slice(2);
    const holodeck = new Holodeck();

    if (args.includes('--scan')) {
        const graph = await holodeck.scan();
        console.log('\n📊 Graph Statistics:');
        console.log(JSON.stringify(graph.stats, null, 2));
    }
    else if (args.includes('--html')) {
        await holodeck.scan();
        const htmlPath = holodeck.generateVisualization();
        console.log(`\n🌐 Visualization saved to: ${htmlPath}`);
        console.log('Open in browser to view the 3D dependency graph!');
    }
    else {
        console.log(`
🌌 HOLODECK v35.0 - 3D Visual Dashboard
======================================

Usage:
  npx ts-node src/intelligence/Holodeck.ts --scan   # Scan and generate graph
  npx ts-node src/intelligence/Holodeck.ts --html   # Generate HTML visualization

Output:
  data/holodeck/dependency-graph.json   # Graph data
  data/holodeck/holodeck.html           # Interactive visualization

Features:
  ✅ Force-directed graph layout
  ✅ Department color coding
  ✅ Connection analysis
  ✅ Interactive D3.js visualization
  ✅ Zoom & drag support
        `);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

export { GraphNode, GraphEdge, GraphData };
