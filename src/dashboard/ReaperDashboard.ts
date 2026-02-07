/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  QAntum Prime v28.0 - REAPER DASHBOARD                                    ║
 * ║  "Economic Sovereign" - Revenue Monitoring Panel                          ║
 * ║                                                                           ║
 * ║  Arbitrage Profit секция за мониторинг на стария лаптоп                   ║
 * ║  Telemetry: ws://192.168.0.6:8888                                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface ReaperMetrics {
  // Core Stats
  totalProfit: number;
  todayProfit: number;
  hourProfit: number;
  
  // Trade Stats
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  winRate: number;
  
  // Performance
  avgProfitPerTrade: number;
  bestTrade: number;
  worstTrade: number;
  sharpeRatio: number;
  
  // Capital
  currentCapital: number;
  initialCapital: number;
  roi: number;
  
  // System
  uptime: number;
  latencyMs: number;
  chronosAccuracy: number;
  
  // Markets
  activeMarkets: string[];
  activeOpportunities: number;
}

export interface TradeLog {
  id: string;
  timestamp: number;
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  profit: number;
  status: 'success' | 'failed' | 'blocked';
  reason?: string;
}

export interface AlertConfig {
  profitThreshold: number;      // Alert when profit > X
  lossThreshold: number;        // Alert when loss > X
  opportunityThreshold: number; // Alert when opportunities > X
  enableSound: boolean;
  enableDesktopNotification: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// REAPER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export class ReaperDashboard extends EventEmitter {
  private metrics: ReaperMetrics;
  private tradeLogs: TradeLog[] = [];
  private alertConfig: AlertConfig;
  private telemetryUrl: string;
  private isConnected: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;
  
  constructor(telemetryUrl: string = 'ws://192.168.0.6:8888') {
    super();
    
    this.telemetryUrl = telemetryUrl;
    
    this.metrics = {
      totalProfit: 0,
      todayProfit: 0,
      hourProfit: 0,
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      winRate: 0,
      avgProfitPerTrade: 0,
      bestTrade: 0,
      worstTrade: 0,
      sharpeRatio: 0,
      currentCapital: 10000,
      initialCapital: 10000,
      roi: 0,
      uptime: 0,
      latencyMs: 0,
      chronosAccuracy: 0,
      activeMarkets: [],
      activeOpportunities: 0,
    };
    
    this.alertConfig = {
      profitThreshold: 100,
      lossThreshold: 50,
      opportunityThreshold: 5,
      enableSound: true,
      enableDesktopNotification: true,
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // RENDER DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════
  
  public render(): string {
    const m = this.metrics;
    const now = new Date().toLocaleTimeString('bg-BG');
    
    // Calculate ROI color
    const roiColor = m.roi >= 0 ? '🟢' : '🔴';
    const profitColor = m.todayProfit >= 0 ? '💚' : '❤️';
    
    return `
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║  ⚛️  QAntum-Market-Reaper v28.0 - REVENUE DASHBOARD                                   ║
║  📡 Telemetry: ${this.telemetryUrl.padEnd(25)} | Time: ${now.padEnd(10)} | Status: ${this.isConnected ? '🟢 LIVE' : '🔴 OFFLINE'}      ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                       ║
║  💰 PROFIT CENTER                           📊 TRADE STATISTICS                       ║
║  ┌───────────────────────────────────┐      ┌───────────────────────────────────┐    ║
║  │ Total Profit:    ${this.formatMoney(m.totalProfit).padStart(12)}    │      │ Total Trades:     ${m.totalTrades.toString().padStart(8)}      │    ║
║  │ Today:     ${profitColor}    ${this.formatMoney(m.todayProfit).padStart(12)}    │      │ Successful:       ${m.successfulTrades.toString().padStart(8)}      │    ║
║  │ This Hour:       ${this.formatMoney(m.hourProfit).padStart(12)}    │      │ Failed:           ${m.failedTrades.toString().padStart(8)}      │    ║
║  │ Best Trade:      ${this.formatMoney(m.bestTrade).padStart(12)}    │      │ Win Rate:         ${m.winRate.toFixed(1).padStart(7)}%     │    ║
║  │ Worst Trade:     ${this.formatMoney(m.worstTrade).padStart(12)}    │      │ Avg Profit:       ${this.formatMoney(m.avgProfitPerTrade).padStart(8)}      │    ║
║  └───────────────────────────────────┘      └───────────────────────────────────┘    ║
║                                                                                       ║
║  💼 CAPITAL STATUS                          ⚡ PERFORMANCE                             ║
║  ┌───────────────────────────────────┐      ┌───────────────────────────────────┐    ║
║  │ Initial:         ${this.formatMoney(m.initialCapital).padStart(12)}    │      │ Uptime:           ${this.formatUptime(m.uptime).padStart(8)}      │    ║
║  │ Current:         ${this.formatMoney(m.currentCapital).padStart(12)}    │      │ Latency:          ${m.latencyMs.toFixed(3).padStart(6)}ms      │    ║
║  │ ROI:       ${roiColor}    ${m.roi.toFixed(2).padStart(10)}%    │      │ Chronos Accuracy: ${m.chronosAccuracy.toFixed(1).padStart(7)}%     │    ║
║  │ Sharpe Ratio:    ${m.sharpeRatio.toFixed(2).padStart(12)}    │      │ Active Opps:      ${m.activeOpportunities.toString().padStart(8)}      │    ║
║  └───────────────────────────────────┘      └───────────────────────────────────┘    ║
║                                                                                       ║
║  🌐 ACTIVE MARKETS: ${m.activeMarkets.slice(0, 6).join(' | ').padEnd(55)}             ║
║                                                                                       ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║  📜 RECENT TRADES                                                                     ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
${this.renderTradeLog()}
╚═══════════════════════════════════════════════════════════════════════════════════════╝
    `;
  }
  
  private renderTradeLog(): string {
    if (this.tradeLogs.length === 0) {
      return '║  No trades yet...                                                                     ║';
    }
    
    const recent = this.tradeLogs.slice(-5).reverse();
    const lines: string[] = [];
    
    for (const trade of recent) {
      const time = new Date(trade.timestamp).toLocaleTimeString('bg-BG');
      const status = trade.status === 'success' ? '✅' : trade.status === 'blocked' ? '🚫' : '❌';
      const profit = trade.profit >= 0 ? `+$${trade.profit.toFixed(2)}` : `-$${Math.abs(trade.profit).toFixed(2)}`;
      
      lines.push(`║  ${status} ${time} | ${trade.symbol.padEnd(6)} | ${trade.buyExchange.padEnd(8)} → ${trade.sellExchange.padEnd(8)} | ${profit.padStart(10)} ║`);
    }
    
    return lines.join('\n');
  }
  
  private formatMoney(amount: number): string {
    if (amount >= 0) {
      return `$${amount.toFixed(2)}`;
    }
    return `-$${Math.abs(amount).toFixed(2)}`;
  }
  
  private formatUptime(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // LIVE UPDATE HTML DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════
  
  public generateHTML(): string {
    const m = this.metrics;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⚛️ QAntum Market Reaper - Dashboard</title>
  <style>
    :root {
      --bg-dark: #0a0a1a;
      --bg-card: #12122a;
      --accent: #00ff88;
      --accent-red: #ff4444;
      --text: #ffffff;
      --text-dim: #888899;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'JetBrains Mono', 'Consolas', monospace;
      background: var(--bg-dark);
      color: var(--text);
      min-height: 100vh;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid var(--accent);
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 2rem;
      background: linear-gradient(90deg, #00ff88, #00aaff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .status-bar {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 10px;
      font-size: 0.9rem;
      color: var(--text-dim);
    }
    
    .status-live { color: #00ff88; font-weight: bold; }
    .status-offline { color: #ff4444; font-weight: bold; }
    
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .card {
      background: var(--bg-card);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid rgba(0, 255, 136, 0.2);
    }
    
    .card h2 {
      font-size: 1rem;
      color: var(--accent);
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .metric {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .metric:last-child { border: none; }
    
    .metric-label { color: var(--text-dim); }
    .metric-value { font-weight: bold; }
    .metric-positive { color: var(--accent); }
    .metric-negative { color: var(--accent-red); }
    
    .profit-display {
      font-size: 2.5rem;
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,170,255,0.1));
      border-radius: 8px;
      margin-bottom: 15px;
    }
    
    .trade-log {
      max-height: 300px;
      overflow-y: auto;
    }
    
    .trade-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: rgba(0,0,0,0.3);
      border-radius: 8px;
      margin-bottom: 8px;
      font-size: 0.85rem;
    }
    
    .trade-success { border-left: 3px solid var(--accent); }
    .trade-failed { border-left: 3px solid var(--accent-red); }
    .trade-blocked { border-left: 3px solid #ff9900; }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .live-indicator {
      width: 10px;
      height: 10px;
      background: var(--accent);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚛️ QAntum-Market-Reaper v28.0</h1>
    <div class="status-bar">
      <span>📡 Telemetry: ${this.telemetryUrl}</span>
      <span class="${this.isConnected ? 'status-live' : 'status-offline'}">
        ${this.isConnected ? '🟢 LIVE' : '🔴 OFFLINE'}
      </span>
      <span id="clock">${new Date().toLocaleTimeString('bg-BG')}</span>
    </div>
  </div>
  
  <div class="dashboard">
    <!-- Profit Card -->
    <div class="card">
      <h2>💰 Profit Center</h2>
      <div class="profit-display ${m.totalProfit >= 0 ? 'metric-positive' : 'metric-negative'}">
        ${m.totalProfit >= 0 ? '+' : ''}$${m.totalProfit.toFixed(2)}
      </div>
      <div class="metric">
        <span class="metric-label">Today</span>
        <span class="metric-value ${m.todayProfit >= 0 ? 'metric-positive' : 'metric-negative'}">
          ${m.todayProfit >= 0 ? '+' : ''}$${m.todayProfit.toFixed(2)}
        </span>
      </div>
      <div class="metric">
        <span class="metric-label">This Hour</span>
        <span class="metric-value">${m.hourProfit >= 0 ? '+' : ''}$${m.hourProfit.toFixed(2)}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Best Trade</span>
        <span class="metric-value metric-positive">+$${m.bestTrade.toFixed(2)}</span>
      </div>
    </div>
    
    <!-- Stats Card -->
    <div class="card">
      <h2>📊 Trade Statistics</h2>
      <div class="metric">
        <span class="metric-label">Total Trades</span>
        <span class="metric-value">${m.totalTrades}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Successful</span>
        <span class="metric-value metric-positive">${m.successfulTrades}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Failed</span>
        <span class="metric-value metric-negative">${m.failedTrades}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Win Rate</span>
        <span class="metric-value">${m.winRate.toFixed(1)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Avg Profit/Trade</span>
        <span class="metric-value">$${m.avgProfitPerTrade.toFixed(2)}</span>
      </div>
    </div>
    
    <!-- Capital Card -->
    <div class="card">
      <h2>💼 Capital Status</h2>
      <div class="metric">
        <span class="metric-label">Initial Capital</span>
        <span class="metric-value">$${m.initialCapital.toLocaleString()}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Current Capital</span>
        <span class="metric-value">$${m.currentCapital.toLocaleString()}</span>
      </div>
      <div class="metric">
        <span class="metric-label">ROI</span>
        <span class="metric-value ${m.roi >= 0 ? 'metric-positive' : 'metric-negative'}">
          ${m.roi >= 0 ? '+' : ''}${m.roi.toFixed(2)}%
        </span>
      </div>
      <div class="metric">
        <span class="metric-label">Sharpe Ratio</span>
        <span class="metric-value">${m.sharpeRatio.toFixed(2)}</span>
      </div>
    </div>
    
    <!-- Performance Card -->
    <div class="card">
      <h2>⚡ Performance</h2>
      <div class="metric">
        <span class="metric-label">Uptime</span>
        <span class="metric-value">${this.formatUptime(m.uptime)}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Avg Latency</span>
        <span class="metric-value">${m.latencyMs.toFixed(3)}ms</span>
      </div>
      <div class="metric">
        <span class="metric-label">Chronos Accuracy</span>
        <span class="metric-value">${m.chronosAccuracy.toFixed(1)}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">Active Opportunities</span>
        <span class="metric-value metric-positive">${m.activeOpportunities}</span>
      </div>
    </div>
    
    <!-- Markets Card -->
    <div class="card" style="grid-column: span 2;">
      <h2>🌐 Active Markets</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        ${m.activeMarkets.map(market => `
          <span style="background: rgba(0,255,136,0.2); padding: 5px 12px; border-radius: 20px;">
            ${market}
          </span>
        `).join('')}
      </div>
    </div>
    
    <!-- Trade Log -->
    <div class="card" style="grid-column: span 2;">
      <h2>📜 Recent Trades</h2>
      <div class="trade-log" id="trade-log">
        ${this.tradeLogs.slice(-10).reverse().map(trade => `
          <div class="trade-item trade-${trade.status}">
            <span>${trade.status === 'success' ? '✅' : trade.status === 'blocked' ? '🚫' : '❌'}</span>
            <span style="color: var(--text-dim);">${new Date(trade.timestamp).toLocaleTimeString('bg-BG')}</span>
            <span><strong>${trade.symbol}</strong></span>
            <span>${trade.buyExchange} → ${trade.sellExchange}</span>
            <span class="${trade.profit >= 0 ? 'metric-positive' : 'metric-negative'}" style="margin-left: auto;">
              ${trade.profit >= 0 ? '+' : ''}$${trade.profit.toFixed(2)}
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
  
  <script>
    // Update clock
    setInterval(() => {
      document.getElementById('clock').textContent = new Date().toLocaleTimeString('bg-BG');
    }, 1000);
    
    // WebSocket connection for live updates
    const ws = new WebSocket('${this.telemetryUrl}');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Update dashboard with live data
      console.log('Received telemetry:', data);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  </script>
</body>
</html>`;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // UPDATE METHODS
  // ═══════════════════════════════════════════════════════════════════════
  
  public updateMetrics(metrics: Partial<ReaperMetrics>): void {
    this.metrics = { ...this.metrics, ...metrics };
    
    // Calculate derived metrics
    if (metrics.currentCapital !== undefined || metrics.initialCapital !== undefined) {
      this.metrics.roi = ((this.metrics.currentCapital - this.metrics.initialCapital) / this.metrics.initialCapital) * 100;
    }
    
    if (metrics.totalTrades !== undefined || metrics.successfulTrades !== undefined) {
      this.metrics.winRate = this.metrics.totalTrades > 0 
        ? (this.metrics.successfulTrades / this.metrics.totalTrades) * 100 
        : 0;
    }
    
    // Check alerts
    this.checkAlerts();
    
    this.emit('metrics-updated', this.metrics);
  }
  
  public addTrade(trade: TradeLog): void {
    this.tradeLogs.push(trade);
    
    // Keep last 1000 trades
    if (this.tradeLogs.length > 1000) {
      this.tradeLogs.shift();
    }
    
    // Update best/worst
    if (trade.profit > this.metrics.bestTrade) {
      this.metrics.bestTrade = trade.profit;
    }
    if (trade.profit < this.metrics.worstTrade) {
      this.metrics.worstTrade = trade.profit;
    }
    
    this.emit('trade-added', trade);
  }
  
  private checkAlerts(): void {
    if (this.metrics.todayProfit > this.alertConfig.profitThreshold) {
      this.emit('alert', {
        type: 'profit',
        message: `🎉 Daily profit exceeded $${this.alertConfig.profitThreshold}!`,
        value: this.metrics.todayProfit,
      });
    }
    
    if (this.metrics.todayProfit < -this.alertConfig.lossThreshold) {
      this.emit('alert', {
        type: 'loss',
        message: `⚠️ Daily loss exceeded $${this.alertConfig.lossThreshold}!`,
        value: this.metrics.todayProfit,
      });
    }
    
    if (this.metrics.activeOpportunities > this.alertConfig.opportunityThreshold) {
      this.emit('alert', {
        type: 'opportunity',
        message: `🎯 ${this.metrics.activeOpportunities} active opportunities detected!`,
        value: this.metrics.activeOpportunities,
      });
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // CONNECTION
  // ═══════════════════════════════════════════════════════════════════════
  
  public setConnected(connected: boolean): void {
    this.isConnected = connected;
    this.emit('connection-change', connected);
  }
  
  public getMetrics(): ReaperMetrics {
    return { ...this.metrics };
  }
  
  public getTradeLogs(limit: number = 100): TradeLog[] {
    return this.tradeLogs.slice(-limit);
  }
  
  public setAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export default ReaperDashboard;
