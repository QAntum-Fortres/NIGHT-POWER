/**
 * 🌍 GLOBAL DASHBOARD V3 - World Map Visualization
 * 
 * Real-time visualization of Swarm instances across the globe:
 * - Interactive world map with node locations
 * - WebSocket-powered live updates
 * - Performance metrics per region
 * - Animated data flows
 * 
 * "See your tests run across the planet"
 * 
 * @version 1.0.0
 * @phase 96-100 - The Singularity
 */

import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

// ============================================================
// TYPES
// ============================================================
interface DashboardConfig {
    port: number;
    wsPort: number;
    refreshRate: number;
    enableAnimations: boolean;
    theme: 'neon' | 'dark' | 'light';
}

interface SwarmNode {
    id: string;
    provider: 'aws' | 'azure' | 'gcp' | 'local';
    region: string;
    location: { lat: number; lng: number };
    status: 'active' | 'idle' | 'error' | 'scaling';
    workers: number;
    maxWorkers: number;
    currentTasks: number;
    completedTasks: number;
    avgResponseTime: number;
    lastHeartbeat: number;
    metrics: NodeMetrics;
}

interface NodeMetrics {
    cpu: number;
    memory: number;
    network: number;
    testsPerSecond: number;
    errorRate: number;
    uptime: number;
}

interface GlobalMetrics {
    totalNodes: number;
    activeNodes: number;
    totalWorkers: number;
    activeWorkers: number;
    testsRunning: number;
    testsCompleted: number;
    testsPerSecond: number;
    avgLatency: number;
    errorRate: number;
    regionsActive: string[];
}

interface TestFlow {
    id: string;
    from: string;
    to: string;
    testName: string;
    status: 'running' | 'complete' | 'failed';
    progress: number;
    startTime: number;
}

// ============================================================
// REGION COORDINATES
// ============================================================
const REGION_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
    // AWS Regions
    'us-east-1': { lat: 37.4, lng: -79.0, name: 'N. Virginia' },
    'us-east-2': { lat: 40.0, lng: -83.0, name: 'Ohio' },
    'us-west-1': { lat: 37.4, lng: -122.0, name: 'N. California' },
    'us-west-2': { lat: 45.8, lng: -119.6, name: 'Oregon' },
    'eu-west-1': { lat: 53.3, lng: -6.3, name: 'Ireland' },
    'eu-west-2': { lat: 51.5, lng: -0.1, name: 'London' },
    'eu-central-1': { lat: 50.1, lng: 8.7, name: 'Frankfurt' },
    'ap-northeast-1': { lat: 35.7, lng: 139.7, name: 'Tokyo' },
    'ap-southeast-1': { lat: 1.3, lng: 103.8, name: 'Singapore' },
    'ap-southeast-2': { lat: -33.9, lng: 151.2, name: 'Sydney' },
    // Azure Regions
    'eastus': { lat: 37.4, lng: -79.0, name: 'East US' },
    'westus': { lat: 37.4, lng: -122.4, name: 'West US' },
    'westeurope': { lat: 52.4, lng: 4.9, name: 'Amsterdam' },
    'northeurope': { lat: 53.3, lng: -6.3, name: 'Dublin' },
    // GCP Regions
    'us-central1': { lat: 41.3, lng: -95.9, name: 'Iowa' },
    'europe-west1': { lat: 50.4, lng: 3.8, name: 'Belgium' },
    'asia-east1': { lat: 24.0, lng: 121.0, name: 'Taiwan' },
    // Local
    'local': { lat: 42.7, lng: 23.3, name: 'Sofia, Bulgaria' }
};

// ============================================================
// GLOBAL DASHBOARD V3
// ============================================================
export class GlobalDashboardV3 extends EventEmitter {
    private config: DashboardConfig;
    private httpServer: http.Server | null = null;
    private wsServer: WebSocketServer | null = null;
    private clients: Set<WebSocket> = new Set();
    private nodes: Map<string, SwarmNode> = new Map();
    private testFlows: Map<string, TestFlow> = new Map();
    private globalMetrics: GlobalMetrics;
    private updateInterval: NodeJS.Timer | null = null;

    constructor(config: Partial<DashboardConfig> = {}) {
        super();

        this.config = {
            port: 3000,
            wsPort: 3001,
            refreshRate: 100,
            enableAnimations: true,
            theme: 'neon',
            ...config
        };

        this.globalMetrics = this.initializeMetrics();
    }

    /**
     * 🚀 Start the dashboard server
     */
    async start(): Promise<void> {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🌍 GLOBAL DASHBOARD V3 - World Map                           ║
║                                                               ║
║  "See your tests run across the planet"                      ║
╚═══════════════════════════════════════════════════════════════╝
`);

        // Start HTTP server
        await this.startHttpServer();

        // Start WebSocket server
        await this.startWebSocketServer();

        // Start update loop
        this.startUpdateLoop();

        // Initialize demo nodes
        this.initializeDemoNodes();

        console.log(`🌍 [DASHBOARD] HTTP Server: http://localhost:${this.config.port}`);
        console.log(`🌍 [DASHBOARD] WebSocket: ws://localhost:${this.config.wsPort}`);
        console.log(`🌍 [DASHBOARD] Theme: ${this.config.theme.toUpperCase()}`);
        console.log('');
    }

    /**
     * Start HTTP server with dashboard
     */
    private async startHttpServer(): Promise<void> {
        const html = this.generateDashboardHTML();

        this.httpServer = http.createServer((req, res) => {
            if (req.url === '/' || req.url === '/index.html') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            } else if (req.url === '/api/metrics') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.globalMetrics));
            } else if (req.url === '/api/nodes') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(Array.from(this.nodes.values())));
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });

        return new Promise((resolve) => {
            this.httpServer!.listen(this.config.port, () => resolve());
        });
    }

    /**
     * Start WebSocket server for real-time updates
     */
    private async startWebSocketServer(): Promise<void> {
        this.wsServer = new WebSocketServer({ port: this.config.wsPort });

        this.wsServer.on('connection', (ws) => {
            this.clients.add(ws);
            console.log(`🌍 [DASHBOARD] Client connected (${this.clients.size} total)`);

            // Send initial state
            ws.send(JSON.stringify({
                type: 'init',
                data: {
                    nodes: Array.from(this.nodes.values()),
                    metrics: this.globalMetrics,
                    flows: Array.from(this.testFlows.values())
                }
            }));

            ws.on('close', () => {
                this.clients.delete(ws);
                console.log(`🌍 [DASHBOARD] Client disconnected (${this.clients.size} total)`);
            });
        });
    }

    /**
     * Start update loop
     */
    private startUpdateLoop(): void {
        this.updateInterval = setInterval(() => {
            this.updateSimulation();
            this.broadcastUpdate();
        }, this.config.refreshRate);
    }

    /**
     * Broadcast update to all clients
     */
    private broadcastUpdate(): void {
        const update = {
            type: 'update',
            timestamp: Date.now(),
            data: {
                nodes: Array.from(this.nodes.values()),
                metrics: this.globalMetrics,
                flows: Array.from(this.testFlows.values())
            }
        };

        const message = JSON.stringify(update);
        for (const client of this.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    }

    /**
     * Update simulation (for demo purposes)
     */
    private updateSimulation(): void {
        // Update node metrics
        for (const node of this.nodes.values()) {
            node.metrics.cpu = Math.min(100, Math.max(10, node.metrics.cpu + (Math.random() - 0.5) * 10));
            node.metrics.memory = Math.min(100, Math.max(20, node.metrics.memory + (Math.random() - 0.5) * 5));
            node.metrics.testsPerSecond = Math.max(0, node.metrics.testsPerSecond + (Math.random() - 0.5) * 2);
            node.currentTasks = Math.floor(Math.random() * node.maxWorkers);
            node.completedTasks += Math.floor(Math.random() * 5);
            node.avgResponseTime = Math.max(50, node.avgResponseTime + (Math.random() - 0.5) * 20);
            node.lastHeartbeat = Date.now();
        }

        // Update global metrics
        this.updateGlobalMetrics();

        // Update test flows
        this.updateTestFlows();
    }

    /**
     * Update global metrics
     */
    private updateGlobalMetrics(): void {
        const nodes = Array.from(this.nodes.values());
        const activeNodes = nodes.filter(n => n.status === 'active');

        this.globalMetrics = {
            totalNodes: nodes.length,
            activeNodes: activeNodes.length,
            totalWorkers: nodes.reduce((sum, n) => sum + n.maxWorkers, 0),
            activeWorkers: nodes.reduce((sum, n) => sum + n.workers, 0),
            testsRunning: nodes.reduce((sum, n) => sum + n.currentTasks, 0),
            testsCompleted: nodes.reduce((sum, n) => sum + n.completedTasks, 0),
            testsPerSecond: nodes.reduce((sum, n) => sum + n.metrics.testsPerSecond, 0),
            avgLatency: nodes.reduce((sum, n) => sum + n.avgResponseTime, 0) / nodes.length,
            errorRate: Math.random() * 2,
            regionsActive: [...new Set(nodes.map(n => n.region))]
        };
    }

    /**
     * Update test flows animation
     */
    private updateTestFlows(): void {
        // Update existing flows
        for (const flow of this.testFlows.values()) {
            flow.progress = Math.min(100, flow.progress + Math.random() * 10);
            if (flow.progress >= 100) {
                flow.status = Math.random() > 0.1 ? 'complete' : 'failed';
            }
        }

        // Remove completed flows occasionally
        if (Math.random() > 0.9) {
            const flowIds = Array.from(this.testFlows.keys());
            const completedFlows = flowIds.filter(id => {
                const flow = this.testFlows.get(id);
                return flow && flow.status !== 'running';
            });
            if (completedFlows.length > 5) {
                this.testFlows.delete(completedFlows[0]);
            }
        }

        // Add new flows occasionally
        if (Math.random() > 0.7 && this.testFlows.size < 20) {
            const nodes = Array.from(this.nodes.values());
            if (nodes.length >= 2) {
                const from = nodes[Math.floor(Math.random() * nodes.length)];
                const to = nodes[Math.floor(Math.random() * nodes.length)];
                if (from.id !== to.id) {
                    this.addTestFlow(from.id, to.id, `Test_${Date.now()}`);
                }
            }
        }
    }

    /**
     * Initialize demo nodes
     */
    private initializeDemoNodes(): void {
        const demoNodes: Partial<SwarmNode>[] = [
            { provider: 'aws', region: 'us-east-1', workers: 50, maxWorkers: 100 },
            { provider: 'aws', region: 'eu-west-1', workers: 30, maxWorkers: 50 },
            { provider: 'aws', region: 'ap-northeast-1', workers: 25, maxWorkers: 50 },
            { provider: 'azure', region: 'westeurope', workers: 40, maxWorkers: 80 },
            { provider: 'gcp', region: 'us-central1', workers: 35, maxWorkers: 60 },
            { provider: 'local', region: 'local', workers: 8, maxWorkers: 16 }
        ];

        for (const demo of demoNodes) {
            this.registerNode({
                id: `node_${demo.provider}_${demo.region}`,
                provider: demo.provider!,
                region: demo.region!,
                location: REGION_COORDINATES[demo.region!] || { lat: 0, lng: 0 },
                status: 'active',
                workers: demo.workers!,
                maxWorkers: demo.maxWorkers!,
                currentTasks: Math.floor(Math.random() * demo.workers!),
                completedTasks: Math.floor(Math.random() * 1000),
                avgResponseTime: 150 + Math.random() * 100,
                lastHeartbeat: Date.now(),
                metrics: {
                    cpu: 30 + Math.random() * 40,
                    memory: 40 + Math.random() * 30,
                    network: 20 + Math.random() * 50,
                    testsPerSecond: 5 + Math.random() * 10,
                    errorRate: Math.random() * 2,
                    uptime: 86400 + Math.random() * 86400
                }
            });
        }
    }

    /**
     * Register a new swarm node
     */
    registerNode(node: SwarmNode): void {
        this.nodes.set(node.id, node);
        this.emit('node:registered', node);
    }

    /**
     * Add a test flow (animation)
     */
    addTestFlow(fromNodeId: string, toNodeId: string, testName: string): void {
        const flow: TestFlow = {
            id: `flow_${Date.now()}`,
            from: fromNodeId,
            to: toNodeId,
            testName,
            status: 'running',
            progress: 0,
            startTime: Date.now()
        };
        this.testFlows.set(flow.id, flow);
        this.emit('flow:started', flow);
    }

    /**
     * Generate the dashboard HTML
     */
    private generateDashboardHTML(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌍 QANTUM - Global Dashboard V3</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%);
            color: #00d4ff;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .header {
            background: rgba(0, 212, 255, 0.1);
            border-bottom: 1px solid rgba(0, 212, 255, 0.3);
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
        }
        
        .status-bar {
            display: flex;
            gap: 30px;
        }
        
        .status-item {
            text-align: center;
        }
        
        .status-value {
            font-size: 24px;
            font-weight: bold;
            color: #00ff88;
            text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }
        
        .status-label {
            font-size: 12px;
            color: #888;
            text-transform: uppercase;
        }
        
        .main-container {
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 20px;
            padding: 20px;
            height: calc(100vh - 100px);
        }
        
        .map-container {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 10px;
            position: relative;
            overflow: hidden;
        }
        
        #globe {
            width: 100%;
            height: 100%;
        }
        
        .node-marker {
            position: absolute;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, #00ff88 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: pulse 2s infinite;
            cursor: pointer;
        }
        
        .node-marker.error {
            background: radial-gradient(circle, #ff4444 0%, transparent 70%);
        }
        
        .node-marker.idle {
            background: radial-gradient(circle, #ffaa00 0%, transparent 70%);
        }
        
        @keyframes pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.5; }
        }
        
        .sidebar {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .panel {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 10px;
            padding: 15px;
        }
        
        .panel-title {
            font-size: 14px;
            text-transform: uppercase;
            color: #00d4ff;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(0, 212, 255, 0.2);
        }
        
        .metric-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .metric-label { color: #888; }
        .metric-value { color: #00ff88; font-weight: bold; }
        
        .node-list {
            max-height: 200px;
            overflow-y: auto;
        }
        
        .node-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px;
            background: rgba(0, 212, 255, 0.05);
            border-radius: 5px;
            margin-bottom: 5px;
        }
        
        .node-status {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #00ff88;
        }
        
        .node-status.error { background: #ff4444; }
        .node-status.idle { background: #ffaa00; }
        
        .progress-bar {
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
            margin-top: 5px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ff88, #00d4ff);
            transition: width 0.3s ease;
        }
        
        .flow-line {
            position: absolute;
            height: 2px;
            background: linear-gradient(90deg, #00ff88, #00d4ff);
            transform-origin: left center;
            animation: flowPulse 1s infinite;
            pointer-events: none;
        }
        
        @keyframes flowPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .world-map {
            width: 100%;
            height: 100%;
            background: url('data:image/svg+xml,${encodeURIComponent(this.generateWorldMapSVG())}') center/contain no-repeat;
            opacity: 0.3;
        }
        
        .test-counter {
            font-size: 48px;
            font-weight: bold;
            text-align: center;
            background: linear-gradient(180deg, #00ff88, #00d4ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🌍 QANTUM - GLOBAL SWARM</div>
        <div class="status-bar">
            <div class="status-item">
                <div class="status-value" id="totalNodes">0</div>
                <div class="status-label">Nodes</div>
            </div>
            <div class="status-item">
                <div class="status-value" id="activeWorkers">0</div>
                <div class="status-label">Workers</div>
            </div>
            <div class="status-item">
                <div class="status-value" id="testsPerSecond">0</div>
                <div class="status-label">Tests/sec</div>
            </div>
            <div class="status-item">
                <div class="status-value" id="avgLatency">0ms</div>
                <div class="status-label">Latency</div>
            </div>
        </div>
    </div>
    
    <div class="main-container">
        <div class="map-container">
            <div class="world-map"></div>
            <div id="nodeMarkers"></div>
            <div id="flowLines"></div>
        </div>
        
        <div class="sidebar">
            <div class="panel">
                <div class="panel-title">📊 Tests Completed</div>
                <div class="test-counter" id="testsCompleted">0</div>
            </div>
            
            <div class="panel">
                <div class="panel-title">🌐 Global Metrics</div>
                <div class="metric-row">
                    <span class="metric-label">Active Regions</span>
                    <span class="metric-value" id="regionsActive">0</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Tests Running</span>
                    <span class="metric-value" id="testsRunning">0</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Error Rate</span>
                    <span class="metric-value" id="errorRate">0%</span>
                </div>
            </div>
            
            <div class="panel">
                <div class="panel-title">🖥️ Active Nodes</div>
                <div class="node-list" id="nodeList"></div>
            </div>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.config.wsPort}');
        const regions = ${JSON.stringify(REGION_COORDINATES)};
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'init' || message.type === 'update') {
                updateDashboard(message.data);
            }
        };
        
        function updateDashboard(data) {
            // Update metrics
            document.getElementById('totalNodes').textContent = data.metrics.totalNodes;
            document.getElementById('activeWorkers').textContent = data.metrics.activeWorkers;
            document.getElementById('testsPerSecond').textContent = data.metrics.testsPerSecond.toFixed(1);
            document.getElementById('avgLatency').textContent = Math.round(data.metrics.avgLatency) + 'ms';
            document.getElementById('testsCompleted').textContent = data.metrics.testsCompleted.toLocaleString();
            document.getElementById('regionsActive').textContent = data.metrics.regionsActive.length;
            document.getElementById('testsRunning').textContent = data.metrics.testsRunning;
            document.getElementById('errorRate').textContent = data.metrics.errorRate.toFixed(2) + '%';
            
            // Update node markers
            updateNodeMarkers(data.nodes);
            
            // Update node list
            updateNodeList(data.nodes);
            
            // Update flow lines
            updateFlowLines(data.flows, data.nodes);
        }
        
        function updateNodeMarkers(nodes) {
            const container = document.getElementById('nodeMarkers');
            container.innerHTML = '';
            
            nodes.forEach(node => {
                const coords = regions[node.region];
                if (!coords) return;
                
                const x = ((coords.lng + 180) / 360) * 100;
                const y = ((90 - coords.lat) / 180) * 100;
                
                const marker = document.createElement('div');
                marker.className = 'node-marker ' + (node.status !== 'active' ? node.status : '');
                marker.style.left = x + '%';
                marker.style.top = y + '%';
                marker.title = coords.name + ' (' + node.provider.toUpperCase() + ')';
                marker.dataset.nodeId = node.id;
                
                container.appendChild(marker);
            });
        }
        
        function updateNodeList(nodes) {
            const list = document.getElementById('nodeList');
            list.innerHTML = nodes.map(node => {
                const coords = regions[node.region] || { name: node.region };
                return \`
                    <div class="node-item">
                        <div class="node-status \${node.status !== 'active' ? node.status : ''}"></div>
                        <div>
                            <div>\${coords.name}</div>
                            <div style="font-size: 11px; color: #666">\${node.provider.toUpperCase()} • \${node.workers}/\${node.maxWorkers} workers</div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: \${(node.metrics.cpu)}%"></div>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        function updateFlowLines(flows, nodes) {
            const container = document.getElementById('flowLines');
            container.innerHTML = '';
            
            flows.filter(f => f.status === 'running').forEach(flow => {
                const fromNode = nodes.find(n => n.id === flow.from);
                const toNode = nodes.find(n => n.id === flow.to);
                if (!fromNode || !toNode) return;
                
                const fromCoords = regions[fromNode.region];
                const toCoords = regions[toNode.region];
                if (!fromCoords || !toCoords) return;
                
                const x1 = ((fromCoords.lng + 180) / 360) * 100;
                const y1 = ((90 - fromCoords.lat) / 180) * 100;
                const x2 = ((toCoords.lng + 180) / 360) * 100;
                const y2 = ((90 - toCoords.lat) / 180) * 100;
                
                const dx = x2 - x1;
                const dy = y2 - y1;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                
                const line = document.createElement('div');
                line.className = 'flow-line';
                line.style.left = x1 + '%';
                line.style.top = y1 + '%';
                line.style.width = (length * flow.progress / 100) + '%';
                line.style.transform = 'rotate(' + angle + 'deg)';
                
                container.appendChild(line);
            });
        }
    </script>
</body>
</html>`;
    }

    /**
     * Generate simplified world map SVG
     */
    private generateWorldMapSVG(): string {
        return `<svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg">
            <rect fill="#0a0a1a" width="1000" height="500"/>
            <g stroke="#00d4ff" stroke-width="0.5" fill="none" opacity="0.3">
                <!-- Grid lines -->
                ${Array.from({ length: 19 }, (_, i) => 
                    `<line x1="0" y1="${i * 27.78}" x2="1000" y2="${i * 27.78}"/>`
                ).join('')}
                ${Array.from({ length: 37 }, (_, i) => 
                    `<line x1="${i * 27.78}" y1="0" x2="${i * 27.78}" y2="500"/>`
                ).join('')}
            </g>
            <!-- Simplified continents outline -->
            <g stroke="#00d4ff" stroke-width="1" fill="rgba(0,212,255,0.1)">
                <!-- North America -->
                <path d="M150,100 Q200,80 250,100 L280,150 Q260,200 220,220 L180,200 Q150,180 150,100"/>
                <!-- South America -->
                <path d="M220,250 Q250,260 260,300 L250,380 Q230,400 210,350 L200,280 Q210,260 220,250"/>
                <!-- Europe -->
                <path d="M450,100 Q500,90 520,110 L510,150 Q490,160 470,150 Q450,130 450,100"/>
                <!-- Africa -->
                <path d="M470,180 Q510,170 530,200 L520,300 Q500,320 480,300 L460,250 Q460,200 470,180"/>
                <!-- Asia -->
                <path d="M550,80 Q650,70 750,100 L780,180 Q760,220 700,200 L600,150 Q560,120 550,80"/>
                <!-- Australia -->
                <path d="M750,300 Q800,290 830,320 L820,370 Q780,380 750,350 Q740,330 750,300"/>
            </g>
        </svg>`;
    }

    /**
     * Initialize empty metrics
     */
    private initializeMetrics(): GlobalMetrics {
        return {
            totalNodes: 0,
            activeNodes: 0,
            totalWorkers: 0,
            activeWorkers: 0,
            testsRunning: 0,
            testsCompleted: 0,
            testsPerSecond: 0,
            avgLatency: 0,
            errorRate: 0,
            regionsActive: []
        };
    }

    /**
     * Stop the dashboard
     */
    stop(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval as unknown as number);
        }
        if (this.wsServer) {
            this.wsServer.close();
        }
        if (this.httpServer) {
            this.httpServer.close();
        }
        console.log('🌍 [DASHBOARD] Stopped');
    }
}

// ============================================================
// EXPORTS
// ============================================================
export function createGlobalDashboard(config?: Partial<DashboardConfig>): GlobalDashboardV3 {
    return new GlobalDashboardV3(config);
}

export type { SwarmNode, GlobalMetrics, TestFlow };
