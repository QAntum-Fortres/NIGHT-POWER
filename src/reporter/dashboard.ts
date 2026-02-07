/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM DASHBOARD SERVER                                                     ║
 * ║   "Real-time test monitoring dashboard"                                       ║
 * ║                                                                               ║
 * ║   TODO B #19 - Dashboard: Real-Time Monitoring                                ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from '../core/event-emitter.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DashboardConfig {
    port: number;
    host?: string;
    title?: string;
    refreshInterval?: number;
    maxHistoryItems?: number;
}

export interface TestUpdate {
    id: string;
    name: string;
    suite: string;
    status: 'running' | 'passed' | 'failed' | 'skipped';
    duration?: number;
    error?: string;
    timestamp: number;
}

export interface SuiteUpdate {
    name: string;
    status: 'running' | 'completed';
    tests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration?: number;
}

export interface RunUpdate {
    id: string;
    status: 'running' | 'completed' | 'failed';
    startTime: number;
    endTime?: number;
    total: number;
    passed: number;
    failed: number;
    skipped: number;
}

export interface DashboardState {
    currentRun?: RunUpdate;
    suites: Map<string, SuiteUpdate>;
    recentTests: TestUpdate[];
    history: RunUpdate[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD SERVER
// ═══════════════════════════════════════════════════════════════════════════════

export class DashboardServer extends EventEmitter {
    private static instance: DashboardServer;
    private config: DashboardConfig;
    private state: DashboardState;
    private clients: Set<any> = new Set();
    private server: any = null;

    private constructor() {
        super();
        this.config = {
            port: 9090,
            host: 'localhost',
            title: 'QAntum Dashboard',
            refreshInterval: 1000,
            maxHistoryItems: 100
        };
        this.state = {
            suites: new Map(),
            recentTests: [],
            history: []
        };
    }

    static getInstance(): DashboardServer {
        if (!DashboardServer.instance) {
            DashboardServer.instance = new DashboardServer();
        }
        return DashboardServer.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SERVER MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Configure dashboard
     */
    configure(config: Partial<DashboardConfig>): this {
        this.config = { ...this.config, ...config };
        return this;
    }

    /**
     * Start dashboard server
     */
    async start(): Promise<void> {
        // In a real implementation, this would start an HTTP/WebSocket server
        // For now, we'll simulate the server functionality
        console.log(`📊 Dashboard starting on http://${this.config.host}:${this.config.port}`);
        this.emit('server:started', { port: this.config.port });
    }

    /**
     * Stop dashboard server
     */
    async stop(): Promise<void> {
        this.clients.clear();
        console.log('📊 Dashboard stopped');
        this.emit('server:stopped');
    }

    /**
     * Get dashboard HTML
     */
    getDashboardHTML(): string {
        return this.generateDashboardHTML();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST UPDATES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Start new test run
     */
    startRun(id: string, totalTests: number): void {
        this.state.currentRun = {
            id,
            status: 'running',
            startTime: Date.now(),
            total: totalTests,
            passed: 0,
            failed: 0,
            skipped: 0
        };
        this.state.suites.clear();
        this.broadcast({ type: 'run:started', data: this.state.currentRun });
    }

    /**
     * End test run
     */
    endRun(success: boolean): void {
        if (this.state.currentRun) {
            this.state.currentRun.status = success ? 'completed' : 'failed';
            this.state.currentRun.endTime = Date.now();
            
            // Add to history
            this.state.history.unshift({ ...this.state.currentRun });
            if (this.state.history.length > this.config.maxHistoryItems!) {
                this.state.history.pop();
            }

            this.broadcast({ type: 'run:ended', data: this.state.currentRun });
        }
    }

    /**
     * Update suite
     */
    updateSuite(suite: SuiteUpdate): void {
        this.state.suites.set(suite.name, suite);
        this.broadcast({ type: 'suite:updated', data: suite });
    }

    /**
     * Update test
     */
    updateTest(test: TestUpdate): void {
        // Add to recent tests
        this.state.recentTests.unshift(test);
        if (this.state.recentTests.length > 50) {
            this.state.recentTests.pop();
        }

        // Update run counters
        if (this.state.currentRun && test.status !== 'running') {
            switch (test.status) {
                case 'passed':
                    this.state.currentRun.passed++;
                    break;
                case 'failed':
                    this.state.currentRun.failed++;
                    break;
                case 'skipped':
                    this.state.currentRun.skipped++;
                    break;
            }
        }

        this.broadcast({ type: 'test:updated', data: test });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BROADCASTING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Broadcast message to all clients
     */
    private broadcast(message: { type: string; data: any }): void {
        const payload = JSON.stringify(message);
        for (const client of this.clients) {
            try {
                client.send(payload);
            } catch {
                this.clients.delete(client);
            }
        }
        this.emit(message.type, message.data);
    }

    /**
     * Get current state
     */
    getState(): object {
        return {
            currentRun: this.state.currentRun,
            suites: Array.from(this.state.suites.values()),
            recentTests: this.state.recentTests.slice(0, 20),
            history: this.state.history.slice(0, 10)
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HTML GENERATION
    // ─────────────────────────────────────────────────────────────────────────

    private generateDashboardHTML(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.config.title}</title>
    <style>
        :root {
            --bg: #0f172a;
            --surface: #1e293b;
            --primary: #6366f1;
            --success: #22c55e;
            --warning: #f59e0b;
            --danger: #ef4444;
            --text: #f8fafc;
            --muted: #94a3b8;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
        }
        .dashboard { display: grid; grid-template-rows: auto 1fr; height: 100vh; }
        header {
            background: var(--surface);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        h1 { font-size: 1.5rem; display: flex; align-items: center; gap: 0.5rem; }
        .status { display: flex; gap: 1rem; align-items: center; }
        .status-indicator {
            width: 12px; height: 12px; border-radius: 50%;
            animation: pulse 2s infinite;
        }
        .status-indicator.running { background: var(--success); }
        .status-indicator.idle { background: var(--muted); animation: none; }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        main { display: grid; grid-template-columns: 300px 1fr 300px; gap: 1px; background: rgba(255,255,255,0.1); }
        .panel { background: var(--bg); padding: 1rem; overflow-y: auto; }
        .panel h2 { font-size: 0.9rem; text-transform: uppercase; color: var(--muted); margin-bottom: 1rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; padding: 1rem; }
        .stat-card {
            background: var(--surface);
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
        }
        .stat-value { font-size: 2rem; font-weight: bold; }
        .stat-label { color: var(--muted); font-size: 0.85rem; margin-top: 0.25rem; }
        .progress-ring {
            width: 200px; height: 200px;
            margin: 2rem auto;
            position: relative;
        }
        .progress-ring svg { transform: rotate(-90deg); }
        .progress-ring circle {
            fill: none;
            stroke-width: 20;
            stroke-linecap: round;
        }
        .progress-ring .bg { stroke: var(--surface); }
        .progress-ring .progress { stroke: var(--success); transition: stroke-dashoffset 0.5s; }
        .progress-text {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }
        .progress-text .value { font-size: 2.5rem; font-weight: bold; }
        .progress-text .label { color: var(--muted); }
        .test-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .test-item {
            background: var(--surface);
            padding: 0.75rem 1rem;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .test-status {
            width: 8px; height: 8px;
            border-radius: 50%;
        }
        .test-status.passed { background: var(--success); }
        .test-status.failed { background: var(--danger); }
        .test-status.running { background: var(--warning); animation: pulse 1s infinite; }
        .test-status.skipped { background: var(--muted); }
        .test-name { flex: 1; font-size: 0.9rem; }
        .test-duration { color: var(--muted); font-size: 0.8rem; }
        .suite-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .suite-item {
            background: var(--surface);
            padding: 1rem;
            border-radius: 8px;
        }
        .suite-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
        .suite-name { font-weight: 500; }
        .suite-progress {
            height: 4px;
            background: var(--bg);
            border-radius: 2px;
            overflow: hidden;
        }
        .suite-progress-bar {
            height: 100%;
            background: var(--success);
            transition: width 0.3s;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <header>
            <h1>📊 ${this.config.title}</h1>
            <div class="status">
                <div class="status-indicator" id="status"></div>
                <span id="statusText">Idle</span>
            </div>
        </header>
        <main>
            <div class="panel">
                <h2>Suites</h2>
                <div class="suite-list" id="suites"></div>
            </div>
            <div class="panel">
                <div class="progress-ring">
                    <svg viewBox="0 0 200 200">
                        <circle class="bg" cx="100" cy="100" r="90"/>
                        <circle class="progress" id="progressCircle" cx="100" cy="100" r="90" 
                            stroke-dasharray="565" stroke-dashoffset="565"/>
                    </svg>
                    <div class="progress-text">
                        <div class="value" id="passRate">0%</div>
                        <div class="label">Pass Rate</div>
                    </div>
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value" id="total">0</div>
                        <div class="stat-label">Total</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" style="color: var(--success)" id="passed">0</div>
                        <div class="stat-label">Passed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" style="color: var(--danger)" id="failed">0</div>
                        <div class="stat-label">Failed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" style="color: var(--warning)" id="skipped">0</div>
                        <div class="stat-label">Skipped</div>
                    </div>
                </div>
            </div>
            <div class="panel">
                <h2>Recent Tests</h2>
                <div class="test-list" id="tests"></div>
            </div>
        </main>
    </div>
    <script>
        const ws = new WebSocket('ws://${this.config.host}:${this.config.port}/ws');
        
        ws.onmessage = (event) => {
            const { type, data } = JSON.parse(event.data);
            
            switch (type) {
                case 'run:started':
                    document.getElementById('status').className = 'status-indicator running';
                    document.getElementById('statusText').textContent = 'Running';
                    document.getElementById('total').textContent = data.total;
                    break;
                case 'run:ended':
                    document.getElementById('status').className = 'status-indicator idle';
                    document.getElementById('statusText').textContent = data.status === 'completed' ? 'Completed' : 'Failed';
                    break;
                case 'test:updated':
                    updateTest(data);
                    break;
                case 'suite:updated':
                    updateSuite(data);
                    break;
            }
        };

        function updateTest(test) {
            document.getElementById('passed').textContent = 
                parseInt(document.getElementById('passed').textContent) + (test.status === 'passed' ? 1 : 0);
            document.getElementById('failed').textContent = 
                parseInt(document.getElementById('failed').textContent) + (test.status === 'failed' ? 1 : 0);
            
            const total = parseInt(document.getElementById('total').textContent);
            const passed = parseInt(document.getElementById('passed').textContent);
            const completed = passed + parseInt(document.getElementById('failed').textContent) + 
                            parseInt(document.getElementById('skipped').textContent);
            const passRate = completed > 0 ? Math.round((passed / completed) * 100) : 0;
            
            document.getElementById('passRate').textContent = passRate + '%';
            document.getElementById('progressCircle').style.strokeDashoffset = 565 - (565 * passRate / 100);
            
            const testsEl = document.getElementById('tests');
            testsEl.innerHTML = '<div class="test-item">' +
                '<div class="test-status ' + test.status + '"></div>' +
                '<span class="test-name">' + test.name + '</span>' +
                '<span class="test-duration">' + (test.duration || 0) + 'ms</span>' +
                '</div>' + testsEl.innerHTML;
        }

        function updateSuite(suite) {
            const suitesEl = document.getElementById('suites');
            const progress = suite.tests > 0 ? ((suite.passed + suite.failed + suite.skipped) / suite.tests) * 100 : 0;
            
            let suiteEl = document.getElementById('suite-' + suite.name);
            if (!suiteEl) {
                suiteEl = document.createElement('div');
                suiteEl.id = 'suite-' + suite.name;
                suiteEl.className = 'suite-item';
                suitesEl.appendChild(suiteEl);
            }
            
            suiteEl.innerHTML = 
                '<div class="suite-header">' +
                    '<span class="suite-name">' + suite.name + '</span>' +
                    '<span>' + suite.passed + '/' + suite.tests + '</span>' +
                '</div>' +
                '<div class="suite-progress">' +
                    '<div class="suite-progress-bar" style="width: ' + progress + '%"></div>' +
                '</div>';
        }
    </script>
</body>
</html>`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getDashboard = (): DashboardServer => DashboardServer.getInstance();

export default DashboardServer;
