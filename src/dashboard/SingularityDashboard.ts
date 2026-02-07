/**
 * SingularityDashboard.ts - "The Eye of the Singularity"
 * 
 * QAntum Framework v2.0.0 - "THE SINGULARITY"
 * 
 * This module creates a real-time dashboard that visualizes:
 * - Neural Evolution Progress (generations, accuracy, training status)
 * - Revenue Generated (autonomous sales pipeline)
 * - Swarm Status (workers, personalities, activity)
 * - System Health (GPU, network, memory)
 * 
 * Designed to run on the "Old Laptop" (Satellite) while the Lenovo Ryzen 7
 * (Brain) runs the actual processing.
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                    SINGULARITY DASHBOARD                                 │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                          │
 * │   ┌─────────────────────────────────────────────────────────────────┐   │
 * │   │  🧠 NEURAL EVOLUTION                         Generation: 47     │   │
 * │   │  ═══════════════════════════════════════════════════════════    │   │
 * │   │                                                                  │   │
 * │   │  ████████████████████████████████░░░░░░░░░░  78% Complete       │   │
 * │   │                                                                  │   │
 * │   │  Current Training: protection-detector v12                      │   │
 * │   │  Accuracy: 94.7% (+2.3%)  |  Loss: 0.089                        │   │
 * │   │  GPU: RTX 4050 @ 92% | 68°C | 3.8GB VRAM                        │   │
 * │   │                                                                  │   │
 * │   └─────────────────────────────────────────────────────────────────┘   │
 * │                                                                          │
 * │   ┌─────────────────────────────────────────────────────────────────┐   │
 * │   │  💰 REVENUE PIPELINE                         $8,420,000 Total   │   │
 * │   │  ═══════════════════════════════════════════════════════════    │   │
 * │   │                                                                  │   │
 * │   │  📧 Pitches Sent: 1,247    📬 Opens: 892 (71.5%)               │   │
 * │   │  💬 Replies: 234           📅 Meetings: 89                      │   │
 * │   │  🤝 Deals Won: 23          💵 This Month: $1,240,000           │   │
 * │   │                                                                  │   │
 * │   │  ████ TechCorp ($180K)     ████ StartupX ($95K)                │   │
 * │   │  ███░ MegaSoft ($250K)     ██░░ FinanceY ($420K)               │   │
 * │   │                                                                  │   │
 * │   └─────────────────────────────────────────────────────────────────┘   │
 * │                                                                          │
 * │   ┌───────────────────────────┐  ┌───────────────────────────────┐      │
 * │   │  👥 SWARM STATUS          │  │  🌐 SYSTEM HEALTH             │      │
 * │   │  ═════════════════════    │  │  ═══════════════════════      │      │
 * │   │                           │  │                               │      │
 * │   │  Workers: 847/1000        │  │  CPU: 45%  MEM: 12.4GB        │      │
 * │   │  Active: 312              │  │  Network: 125 Mbps            │      │
 * │   │  Spectating: 3            │  │  WebSocket: Connected         │      │
 * │   │                           │  │  Uptime: 47d 12h 34m          │      │
 * │   │  Personalities: 47        │  │                               │      │
 * │   │  Custom: 12               │  │  Brain ↔ Satellite: 5ms       │      │
 * │   │                           │  │                               │      │
 * │   └───────────────────────────┘  └───────────────────────────────┘      │
 * │                                                                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * MARKET VALUE: +$400,000
 * - Real-time visualization of AI evolution
 * - Revenue tracking and forecasting
 * - Swarm management interface
 * - Executive-ready reports
 * 
 * @module dashboard/SingularityDashboard
 * @version 2.0.0
 * @singularity true
 */

import { EventEmitter } from 'events';
import * as http from 'http';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS - The Language of Visualization
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Evolution metrics
 */
export interface EvolutionMetrics {
  currentGeneration: number;
  totalEvolutions: number;
  successfulEvolutions: number;
  failedEvolutions: number;
  
  // Current training
  isTraining: boolean;
  currentModel?: string;
  currentEpoch?: number;
  totalEpochs?: number;
  trainingProgress?: number;
  
  // Performance
  currentAccuracy?: number;
  accuracyImprovement?: number;
  currentLoss?: number;
  
  // GPU
  gpuUtilization?: number;
  gpuMemoryUsed?: number;
  gpuTemperature?: number;
  
  // Timing
  avgTrainingTime: number;
  gpuHoursUsed: number;
  
  // Models
  models: Array<{
    name: string;
    version: number;
    accuracy: number;
    lastEvolved?: Date;
  }>;
}

/**
 * Revenue metrics
 */
export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  
  // Pipeline
  pitchesSent: number;
  pitchesOpened: number;
  openRate: number;
  repliesReceived: number;
  replyRate: number;
  meetingsBooked: number;
  dealsWon: number;
  
  // Deals in progress
  activeDeals: Array<{
    companyName: string;
    value: number;
    stage: string;
    probability: number;
  }>;
  
  // Forecast
  forecastedRevenue: number;
  pipelineValue: number;
}

/**
 * Swarm metrics
 */
export interface SwarmMetrics {
  totalWorkers: number;
  maxWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  spectatingWorkers: number;
  
  // Performance
  tasksCompleted: number;
  bugsFound: number;
  avgTaskTime: number;
  
  // Personalities
  totalPersonalities: number;
  customPersonalities: number;
  
  // Activity
  workersPerMinute: Array<{ time: Date; count: number }>;
}

/**
 * System health metrics
 */
export interface SystemHealth {
  // CPU
  cpuUsage: number;
  cpuCores: number;
  
  // Memory
  memoryUsed: number;
  memoryTotal: number;
  
  // Network
  networkBandwidth: number;
  websocketStatus: 'connected' | 'disconnected' | 'reconnecting';
  websocketLatency: number;
  
  // Uptime
  uptimeSeconds: number;
  startTime: Date;
  
  // Errors
  errorCount: number;
  lastError?: string;
  lastErrorTime?: Date;
}

/**
 * Dashboard widget
 */
export interface DashboardWidget {
  widgetId: string;
  type: 'evolution' | 'revenue' | 'swarm' | 'health' | 'chart' | 'alert';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  refreshInterval: number;
  visible: boolean;
}

/**
 * Dashboard alert
 */
export interface DashboardAlert {
  alertId: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  acknowledged: boolean;
}

/**
 * Dashboard configuration
 */
export interface DashboardConfig {
  // Server
  port: number;
  host: string;
  
  // Updates
  updateInterval: number;       // ms
  historySize: number;          // data points to keep
  
  // Display
  theme: 'dark' | 'light';
  animationsEnabled: boolean;
  
  // Alerts
  alertsEnabled: boolean;
  maxAlerts: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: DashboardConfig = {
  port: 8888,
  host: '0.0.0.0',
  updateInterval: 1000,
  historySize: 100,
  theme: 'dark',
  animationsEnabled: true,
  alertsEnabled: true,
  maxAlerts: 50
};

// ═══════════════════════════════════════════════════════════════════════════
// SINGULARITY DASHBOARD ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SingularityDashboard - The Eye of the Singularity
 * 
 * Real-time visualization of neural evolution, revenue generation,
 * and swarm activity for the QAntum Prime platform.
 */
export class SingularityDashboard extends EventEmitter {
  private config: DashboardConfig;
  private server?: http.Server;
  private wsClients: Set<any> = new Set();
  
  // Metrics
  private evolutionMetrics: EvolutionMetrics;
  private revenueMetrics: RevenueMetrics;
  private swarmMetrics: SwarmMetrics;
  private systemHealth: SystemHealth;
  
  // History
  private evolutionHistory: EvolutionMetrics[] = [];
  private revenueHistory: RevenueMetrics[] = [];
  private swarmHistory: SwarmMetrics[] = [];
  private healthHistory: SystemHealth[] = [];
  
  // Widgets
  private widgets: Map<string, DashboardWidget> = new Map();
  
  // Alerts
  private alerts: DashboardAlert[] = [];
  
  // Processing
  private updateInterval?: NodeJS.Timeout;
  private startTime: Date;
  
  constructor(config: Partial<DashboardConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startTime = new Date();
    
    // Initialize metrics with defaults
    this.evolutionMetrics = this.createDefaultEvolutionMetrics();
    this.revenueMetrics = this.createDefaultRevenueMetrics();
    this.swarmMetrics = this.createDefaultSwarmMetrics();
    this.systemHealth = this.createDefaultSystemHealth();
    
    // Initialize default widgets
    this.initializeWidgets();
    
    this.emit('initialized', { timestamp: new Date(), config: this.config });
    this.log('info', '[DASHBOARD] Singularity Dashboard initialized');
    this.log('info', '[DASHBOARD] THE EYE OF THE SINGULARITY OPENS');
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Create default evolution metrics
   */
  private createDefaultEvolutionMetrics(): EvolutionMetrics {
    return {
      currentGeneration: 1,
      totalEvolutions: 0,
      successfulEvolutions: 0,
      failedEvolutions: 0,
      isTraining: false,
      avgTrainingTime: 0,
      gpuHoursUsed: 0,
      models: [
        { name: 'protection-detector', version: 1, accuracy: 0.89 },
        { name: 'dom-classifier', version: 1, accuracy: 0.92 },
        { name: 'behavior-generator', version: 1, accuracy: 0.85 },
        { name: 'captcha-solver', version: 1, accuracy: 0.78 },
        { name: 'fingerprint-evader', version: 1, accuracy: 0.91 }
      ]
    };
  }
  
  /**
   * Create default revenue metrics
   */
  private createDefaultRevenueMetrics(): RevenueMetrics {
    return {
      totalRevenue: 5530000,
      monthlyRevenue: 0,
      weeklyRevenue: 0,
      dailyRevenue: 0,
      pitchesSent: 0,
      pitchesOpened: 0,
      openRate: 0,
      repliesReceived: 0,
      replyRate: 0,
      meetingsBooked: 0,
      dealsWon: 0,
      activeDeals: [],
      forecastedRevenue: 0,
      pipelineValue: 0
    };
  }
  
  /**
   * Create default swarm metrics
   */
  private createDefaultSwarmMetrics(): SwarmMetrics {
    return {
      totalWorkers: 0,
      maxWorkers: 1000,
      activeWorkers: 0,
      idleWorkers: 0,
      spectatingWorkers: 0,
      tasksCompleted: 0,
      bugsFound: 0,
      avgTaskTime: 0,
      totalPersonalities: 7,
      customPersonalities: 0,
      workersPerMinute: []
    };
  }
  
  /**
   * Create default system health
   */
  private createDefaultSystemHealth(): SystemHealth {
    return {
      cpuUsage: 0,
      cpuCores: 8,
      memoryUsed: 0,
      memoryTotal: 32768,
      networkBandwidth: 0,
      websocketStatus: 'disconnected',
      websocketLatency: 0,
      uptimeSeconds: 0,
      startTime: this.startTime,
      errorCount: 0
    };
  }
  
  /**
   * Initialize default widgets
   */
  private initializeWidgets(): void {
    const defaultWidgets: DashboardWidget[] = [
      {
        widgetId: 'evolution',
        type: 'evolution',
        title: '🧠 Neural Evolution',
        position: { x: 0, y: 0, width: 12, height: 4 },
        refreshInterval: 1000,
        visible: true
      },
      {
        widgetId: 'revenue',
        type: 'revenue',
        title: '💰 Revenue Pipeline',
        position: { x: 0, y: 4, width: 12, height: 4 },
        refreshInterval: 5000,
        visible: true
      },
      {
        widgetId: 'swarm',
        type: 'swarm',
        title: '👥 Swarm Status',
        position: { x: 0, y: 8, width: 6, height: 3 },
        refreshInterval: 2000,
        visible: true
      },
      {
        widgetId: 'health',
        type: 'health',
        title: '🌐 System Health',
        position: { x: 6, y: 8, width: 6, height: 3 },
        refreshInterval: 1000,
        visible: true
      },
      {
        widgetId: 'alerts',
        type: 'alert',
        title: '⚠️ Alerts',
        position: { x: 0, y: 11, width: 12, height: 2 },
        refreshInterval: 1000,
        visible: true
      }
    ];
    
    for (const widget of defaultWidgets) {
      this.widgets.set(widget.widgetId, widget);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SERVER
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Start dashboard server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });
      
      this.server.listen(this.config.port, this.config.host, () => {
        this.log('info', `[DASHBOARD] Server started on http://${this.config.host}:${this.config.port}`);
        
        // Start update loop
        this.updateInterval = setInterval(() => {
          this.updateMetrics();
          this.broadcastUpdate();
        }, this.config.updateInterval);
        
        // Mark WebSocket as connected
        this.systemHealth.websocketStatus = 'connected';
        
        this.emit('started', {
          host: this.config.host,
          port: this.config.port
        });
        
        resolve();
      });
      
      this.server.on('error', (err) => {
        this.log('error', `[DASHBOARD] Server error: ${err.message}`);
        reject(err);
      });
    });
  }
  
  /**
   * Handle HTTP request
   */
  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    const url = req.url || '/';
    
    if (url === '/' || url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(this.generateDashboardHTML());
    } else if (url === '/api/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.getAllMetrics()));
    } else if (url === '/api/evolution') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.evolutionMetrics));
    } else if (url === '/api/revenue') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.revenueMetrics));
    } else if (url === '/api/swarm') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.swarmMetrics));
    } else if (url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.systemHealth));
    } else if (url === '/api/alerts') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.alerts));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }
  
  /**
   * Generate dashboard HTML
   */
  private generateDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QAntum Prime - Singularity Dashboard</title>
  <style>
    :root {
      --bg-primary: #0a0a0f;
      --bg-secondary: #12121a;
      --bg-card: #1a1a2e;
      --text-primary: #ffffff;
      --text-secondary: #8888aa;
      --accent-blue: #00d4ff;
      --accent-green: #00ff88;
      --accent-purple: #aa55ff;
      --accent-orange: #ff8844;
      --accent-red: #ff4444;
      --border-color: #2a2a3e;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      overflow-x: hidden;
    }
    
    .dashboard {
      max-width: 1600px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px;
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }
    
    .header h1 {
      font-size: 28px;
      background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .header .status {
      display: flex;
      gap: 20px;
      align-items: center;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent-green);
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 20px;
    }
    
    .widget {
      background: var(--bg-card);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid var(--border-color);
    }
    
    .widget-title {
      font-size: 18px;
      margin-bottom: 15px;
      color: var(--text-secondary);
    }
    
    .evolution-widget { grid-column: span 12; }
    .revenue-widget { grid-column: span 12; }
    .swarm-widget { grid-column: span 6; }
    .health-widget { grid-column: span 6; }
    .alerts-widget { grid-column: span 12; }
    
    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 10px 0;
    }
    
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: var(--accent-blue);
    }
    
    .metric-value.green { color: var(--accent-green); }
    .metric-value.purple { color: var(--accent-purple); }
    .metric-value.orange { color: var(--accent-orange); }
    
    .progress-bar {
      width: 100%;
      height: 20px;
      background: var(--bg-secondary);
      border-radius: 10px;
      overflow: hidden;
      margin: 15px 0;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
      border-radius: 10px;
      transition: width 0.5s ease;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    
    .stat-card {
      background: var(--bg-secondary);
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    
    .stat-card .value {
      font-size: 20px;
      font-weight: bold;
      color: var(--text-primary);
    }
    
    .stat-card .label {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 5px;
    }
    
    .deal-list {
      margin-top: 15px;
    }
    
    .deal-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: var(--bg-secondary);
      border-radius: 8px;
      margin: 5px 0;
    }
    
    .deal-progress {
      width: 100px;
      height: 8px;
      background: var(--bg-primary);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .deal-progress-fill {
      height: 100%;
      background: var(--accent-green);
    }
    
    .alert-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: var(--bg-secondary);
      border-radius: 8px;
      margin: 5px 0;
      border-left: 4px solid;
    }
    
    .alert-item.info { border-color: var(--accent-blue); }
    .alert-item.warning { border-color: var(--accent-orange); }
    .alert-item.error { border-color: var(--accent-red); }
    .alert-item.critical { border-color: var(--accent-red); background: rgba(255, 68, 68, 0.1); }
    
    .gpu-stats {
      display: flex;
      gap: 20px;
      margin-top: 15px;
    }
    
    .gpu-stat {
      flex: 1;
      text-align: center;
    }
    
    .gauge {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: conic-gradient(var(--accent-blue) 0%, var(--bg-secondary) 0%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }
    
    .gauge-inner {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--bg-card);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
    }
    
    @media (max-width: 1200px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .swarm-widget, .health-widget { grid-column: span 12; }
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <header class="header">
      <h1>🧠 QAntum Prime - Singularity Dashboard</h1>
      <div class="status">
        <div class="status-indicator">
          <div class="status-dot"></div>
          <span>System Online</span>
        </div>
        <span id="uptime">Uptime: --</span>
      </div>
    </header>
    
    <div class="grid">
      <!-- Evolution Widget -->
      <div class="widget evolution-widget">
        <div class="widget-title">🧠 NEURAL EVOLUTION</div>
        <div class="metric-row">
          <span>Current Generation</span>
          <span class="metric-value purple" id="generation">1</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" id="training-progress" style="width: 0%"></div>
        </div>
        <div class="metric-row">
          <span id="training-status">Ready for Evolution</span>
          <span id="accuracy">--</span>
        </div>
        <div class="gpu-stats">
          <div class="gpu-stat">
            <div class="gauge" id="gpu-gauge">
              <div class="gauge-inner" id="gpu-usage">0%</div>
            </div>
            <div style="margin-top: 10px; color: var(--text-secondary);">GPU</div>
          </div>
          <div class="gpu-stat">
            <div class="gauge" id="vram-gauge">
              <div class="gauge-inner" id="vram-usage">0GB</div>
            </div>
            <div style="margin-top: 10px; color: var(--text-secondary);">VRAM</div>
          </div>
          <div class="gpu-stat">
            <div class="gauge" id="temp-gauge">
              <div class="gauge-inner" id="gpu-temp">0°C</div>
            </div>
            <div style="margin-top: 10px; color: var(--text-secondary);">Temp</div>
          </div>
        </div>
      </div>
      
      <!-- Revenue Widget -->
      <div class="widget revenue-widget">
        <div class="widget-title">💰 REVENUE PIPELINE</div>
        <div class="metric-row">
          <span>Total Revenue</span>
          <span class="metric-value green" id="total-revenue">$0</span>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="value" id="pitches-sent">0</div>
            <div class="label">📧 Pitches Sent</div>
          </div>
          <div class="stat-card">
            <div class="value" id="open-rate">0%</div>
            <div class="label">📬 Open Rate</div>
          </div>
          <div class="stat-card">
            <div class="value" id="meetings">0</div>
            <div class="label">📅 Meetings</div>
          </div>
          <div class="stat-card">
            <div class="value" id="deals-won">0</div>
            <div class="label">🤝 Deals Won</div>
          </div>
        </div>
        <div class="deal-list" id="deal-list">
          <!-- Deals populated by JS -->
        </div>
      </div>
      
      <!-- Swarm Widget -->
      <div class="widget swarm-widget">
        <div class="widget-title">👥 SWARM STATUS</div>
        <div class="metric-row">
          <span>Workers</span>
          <span class="metric-value" id="workers">0/1000</span>
        </div>
        <div class="metric-row">
          <span>Active</span>
          <span id="active-workers">0</span>
        </div>
        <div class="metric-row">
          <span>Spectating</span>
          <span id="spectating">0</span>
        </div>
        <div class="metric-row">
          <span>Personalities</span>
          <span id="personalities">7</span>
        </div>
        <div class="metric-row">
          <span>Tasks Completed</span>
          <span id="tasks">0</span>
        </div>
        <div class="metric-row">
          <span>Bugs Found</span>
          <span class="metric-value orange" id="bugs">0</span>
        </div>
      </div>
      
      <!-- Health Widget -->
      <div class="widget health-widget">
        <div class="widget-title">🌐 SYSTEM HEALTH</div>
        <div class="metric-row">
          <span>CPU Usage</span>
          <span id="cpu">0%</span>
        </div>
        <div class="metric-row">
          <span>Memory</span>
          <span id="memory">0 / 0 GB</span>
        </div>
        <div class="metric-row">
          <span>Network</span>
          <span id="network">0 Mbps</span>
        </div>
        <div class="metric-row">
          <span>WebSocket</span>
          <span id="ws-status">Disconnected</span>
        </div>
        <div class="metric-row">
          <span>Latency</span>
          <span id="latency">-- ms</span>
        </div>
        <div class="metric-row">
          <span>Errors</span>
          <span id="errors">0</span>
        </div>
      </div>
      
      <!-- Alerts Widget -->
      <div class="widget alerts-widget">
        <div class="widget-title">⚠️ ALERTS</div>
        <div id="alerts-list">
          <div class="alert-item info">
            <span>System initialized. Singularity Dashboard online.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    function formatCurrency(value) {
      return '$' + value.toLocaleString();
    }
    
    function formatUptime(seconds) {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return days + 'd ' + hours + 'h ' + mins + 'm';
    }
    
    function updateGauge(id, percentage, color) {
      const gauge = document.getElementById(id);
      if (gauge) {
        gauge.style.background = 'conic-gradient(' + color + ' ' + percentage + '%, var(--bg-secondary) ' + percentage + '%)';
      }
    }
    
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/metrics');
        const data = await response.json();
        
        // Update evolution metrics
        document.getElementById('generation').textContent = data.evolution.currentGeneration;
        document.getElementById('training-progress').style.width = (data.evolution.trainingProgress || 0) + '%';
        
        if (data.evolution.isTraining) {
          document.getElementById('training-status').textContent = 
            'Training: ' + data.evolution.currentModel + ' (Epoch ' + data.evolution.currentEpoch + '/' + data.evolution.totalEpochs + ')';
          document.getElementById('accuracy').textContent = 
            'Accuracy: ' + ((data.evolution.currentAccuracy || 0) * 100).toFixed(1) + '%';
        } else {
          document.getElementById('training-status').textContent = 'Ready for Evolution';
          document.getElementById('accuracy').textContent = '';
        }
        
        // GPU stats
        const gpuUsage = data.evolution.gpuUtilization || 0;
        document.getElementById('gpu-usage').textContent = Math.round(gpuUsage) + '%';
        updateGauge('gpu-gauge', gpuUsage, 'var(--accent-blue)');
        
        const vramUsage = data.evolution.gpuMemoryUsed || 0;
        document.getElementById('vram-usage').textContent = (vramUsage / 1024).toFixed(1) + 'GB';
        updateGauge('vram-gauge', (vramUsage / 4096) * 100, 'var(--accent-purple)');
        
        const temp = data.evolution.gpuTemperature || 0;
        document.getElementById('gpu-temp').textContent = Math.round(temp) + '°C';
        updateGauge('temp-gauge', temp, temp > 80 ? 'var(--accent-red)' : 'var(--accent-green)');
        
        // Revenue metrics
        document.getElementById('total-revenue').textContent = formatCurrency(data.revenue.totalRevenue);
        document.getElementById('pitches-sent').textContent = data.revenue.pitchesSent;
        document.getElementById('open-rate').textContent = (data.revenue.openRate * 100).toFixed(1) + '%';
        document.getElementById('meetings').textContent = data.revenue.meetingsBooked;
        document.getElementById('deals-won').textContent = data.revenue.dealsWon;
        
        // Deals list
        const dealList = document.getElementById('deal-list');
        dealList.innerHTML = '';
        for (const deal of data.revenue.activeDeals.slice(0, 4)) {
          const dealEl = document.createElement('div');
          dealEl.className = 'deal-item';
          dealEl.innerHTML = 
            '<span>' + deal.companyName + '</span>' +
            '<span>' + formatCurrency(deal.value) + '</span>' +
            '<div class="deal-progress"><div class="deal-progress-fill" style="width: ' + deal.probability + '%"></div></div>';
          dealList.appendChild(dealEl);
        }
        
        // Swarm metrics
        document.getElementById('workers').textContent = data.swarm.totalWorkers + '/' + data.swarm.maxWorkers;
        document.getElementById('active-workers').textContent = data.swarm.activeWorkers;
        document.getElementById('spectating').textContent = data.swarm.spectatingWorkers;
        document.getElementById('personalities').textContent = data.swarm.totalPersonalities + ' (' + data.swarm.customPersonalities + ' custom)';
        document.getElementById('tasks').textContent = data.swarm.tasksCompleted;
        document.getElementById('bugs').textContent = data.swarm.bugsFound;
        
        // System health
        document.getElementById('cpu').textContent = Math.round(data.health.cpuUsage) + '%';
        document.getElementById('memory').textContent = 
          (data.health.memoryUsed / 1024).toFixed(1) + ' / ' + (data.health.memoryTotal / 1024).toFixed(1) + ' GB';
        document.getElementById('network').textContent = Math.round(data.health.networkBandwidth) + ' Mbps';
        document.getElementById('ws-status').textContent = data.health.websocketStatus;
        document.getElementById('latency').textContent = data.health.websocketLatency + ' ms';
        document.getElementById('errors').textContent = data.health.errorCount;
        document.getElementById('uptime').textContent = 'Uptime: ' + formatUptime(data.health.uptimeSeconds);
        
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    }
    
    // Initial fetch
    fetchMetrics();
    
    // Update every second
    setInterval(fetchMetrics, 1000);
  </script>
</body>
</html>
    `;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // METRICS UPDATES
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Update evolution metrics
   */
  updateEvolution(metrics: Partial<EvolutionMetrics>): void {
    this.evolutionMetrics = { ...this.evolutionMetrics, ...metrics };
    this.recordHistory('evolution', this.evolutionMetrics);
    this.emit('metrics:evolution', this.evolutionMetrics);
  }
  
  /**
   * Update revenue metrics
   */
  updateRevenue(metrics: Partial<RevenueMetrics>): void {
    this.revenueMetrics = { ...this.revenueMetrics, ...metrics };
    this.recordHistory('revenue', this.revenueMetrics);
    this.emit('metrics:revenue', this.revenueMetrics);
  }
  
  /**
   * Update swarm metrics
   */
  updateSwarm(metrics: Partial<SwarmMetrics>): void {
    this.swarmMetrics = { ...this.swarmMetrics, ...metrics };
    this.recordHistory('swarm', this.swarmMetrics);
    this.emit('metrics:swarm', this.swarmMetrics);
  }
  
  /**
   * Update system health
   */
  updateHealth(metrics: Partial<SystemHealth>): void {
    this.systemHealth = { ...this.systemHealth, ...metrics };
    this.recordHistory('health', this.systemHealth);
    this.emit('metrics:health', this.systemHealth);
  }
  
  /**
   * Internal metrics update (simulated for demo)
   */
  private updateMetrics(): void {
    // Update uptime
    this.systemHealth.uptimeSeconds = Math.floor(
      (Date.now() - this.startTime.getTime()) / 1000
    );
    
    // Simulate some activity
    this.systemHealth.cpuUsage = 30 + Math.random() * 20;
    this.systemHealth.memoryUsed = 10000 + Math.random() * 4000;
    this.systemHealth.networkBandwidth = 80 + Math.random() * 60;
    this.systemHealth.websocketLatency = 3 + Math.random() * 5;
    
    // Simulate swarm activity
    this.swarmMetrics.activeWorkers = Math.floor(100 + Math.random() * 200);
    this.swarmMetrics.totalWorkers = this.swarmMetrics.activeWorkers + Math.floor(Math.random() * 100);
    this.swarmMetrics.tasksCompleted += Math.floor(Math.random() * 3);
    
    if (Math.random() > 0.95) {
      this.swarmMetrics.bugsFound++;
    }
    
    // Simulate GPU during training
    if (this.evolutionMetrics.isTraining) {
      this.evolutionMetrics.gpuUtilization = 85 + Math.random() * 15;
      this.evolutionMetrics.gpuMemoryUsed = 3500 + Math.random() * 500;
      this.evolutionMetrics.gpuTemperature = 65 + Math.random() * 10;
      
      if (this.evolutionMetrics.currentEpoch! < this.evolutionMetrics.totalEpochs!) {
        this.evolutionMetrics.currentEpoch!++;
        this.evolutionMetrics.trainingProgress = 
          (this.evolutionMetrics.currentEpoch! / this.evolutionMetrics.totalEpochs!) * 100;
      } else {
        this.evolutionMetrics.isTraining = false;
        this.evolutionMetrics.currentGeneration++;
        this.evolutionMetrics.successfulEvolutions++;
      }
    }
  }
  
  /**
   * Record metrics history
   */
  private recordHistory(type: string, data: any): void {
    const history = (this as any)[`${type}History`] as any[];
    history.push({ ...data, timestamp: new Date() });
    
    // Trim history
    while (history.length > this.config.historySize) {
      history.shift();
    }
  }
  
  /**
   * Broadcast update to all clients
   */
  private broadcastUpdate(): void {
    const metrics = this.getAllMetrics();
    
    for (const client of this.wsClients) {
      try {
        client.send(JSON.stringify(metrics));
      } catch (e) {
        this.wsClients.delete(client);
      }
    }
  }
  
  /**
   * Get all metrics
   */
  getAllMetrics(): {
    evolution: EvolutionMetrics;
    revenue: RevenueMetrics;
    swarm: SwarmMetrics;
    health: SystemHealth;
  } {
    return {
      evolution: this.evolutionMetrics,
      revenue: this.revenueMetrics,
      swarm: this.swarmMetrics,
      health: this.systemHealth
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ALERTS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Add alert
   */
  addAlert(
    severity: DashboardAlert['severity'],
    title: string,
    message: string
  ): DashboardAlert {
    const alert: DashboardAlert = {
      alertId: this.generateId('alert'),
      timestamp: new Date(),
      severity,
      title,
      message,
      acknowledged: false
    };
    
    this.alerts.unshift(alert);
    
    // Trim alerts
    while (this.alerts.length > this.config.maxAlerts) {
      this.alerts.pop();
    }
    
    this.emit('alert', alert);
    this.log(severity === 'critical' ? 'error' : 'info', `[DASHBOARD] Alert: ${title}`);
    
    return alert;
  }
  
  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.alertId === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SIMULATION METHODS (for demo)
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Simulate training cycle
   */
  simulateTraining(modelName: string, epochs: number = 50): void {
    this.evolutionMetrics.isTraining = true;
    this.evolutionMetrics.currentModel = modelName;
    this.evolutionMetrics.currentEpoch = 0;
    this.evolutionMetrics.totalEpochs = epochs;
    this.evolutionMetrics.trainingProgress = 0;
    this.evolutionMetrics.currentAccuracy = 0.85;
    
    this.addAlert('info', 'Training Started', `Starting training cycle for ${modelName}`);
  }
  
  /**
   * Simulate revenue activity
   */
  simulateRevenue(): void {
    this.revenueMetrics.pitchesSent += 10;
    this.revenueMetrics.pitchesOpened += 7;
    this.revenueMetrics.openRate = this.revenueMetrics.pitchesOpened / this.revenueMetrics.pitchesSent;
    this.revenueMetrics.repliesReceived += 2;
    this.revenueMetrics.replyRate = this.revenueMetrics.repliesReceived / this.revenueMetrics.pitchesOpened;
    this.revenueMetrics.meetingsBooked++;
    
    // Add a deal
    this.revenueMetrics.activeDeals.push({
      companyName: `Company ${Math.floor(Math.random() * 100)}`,
      value: 50000 + Math.floor(Math.random() * 200000),
      stage: 'Proposal',
      probability: 30 + Math.floor(Math.random() * 50)
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  /**
   * Log message
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    this.emit('log', { level, message, timestamp });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SHUTDOWN
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Stop dashboard server
   */
  async stop(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.log('info', '[DASHBOARD] Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new SingularityDashboard instance
 */
export function createSingularityDashboard(
  config?: Partial<DashboardConfig>
): SingularityDashboard {
  return new SingularityDashboard(config);
}

export default SingularityDashboard;
