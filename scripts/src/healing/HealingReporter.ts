/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🧠 QANTUM HYBRID v1.0.0 - Healing Reporter
 * HTML/JSON reports for healing events with statistics
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';
import { HealingRecord, SelfHealingEngine } from './SelfHealingEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ReportConfig {
  outputDir: string;
  includeTimestamps: boolean;
  includeSourceCode: boolean;
  theme: 'light' | 'dark';
}

export interface HealingReport {
  generated: string;
  summary: {
    totalHealings: number;
    uniqueSelectors: number;
    topStrategies: Array<{ strategy: string; count: number; percentage: number }>;
    avgAttemptsPerHealing: number;
    totalTimeSaved: number;
  };
  healings: HealingRecord[];
  charts: {
    strategyDistribution: Record<string, number>;
    timelineData: Array<{ time: string; count: number }>;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALING REPORTER
// ═══════════════════════════════════════════════════════════════════════════════

export class HealingReporter {
  private engine: SelfHealingEngine;
  private config: ReportConfig;

  constructor(engine: SelfHealingEngine, config?: Partial<ReportConfig>) {
    this.engine = engine;
    this.config = {
      outputDir: config?.outputDir ?? './reports/healing',
      includeTimestamps: config?.includeTimestamps ?? true,
      includeSourceCode: config?.includeSourceCode ?? true,
      theme: config?.theme ?? 'dark',
    };

    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Generate comprehensive report
   */
  generateReport(): HealingReport {
    const stats = this.engine.getStatistics();
    const history = this.engine.getHistory();

    // Calculate strategy distribution
    const strategyDistribution: Record<string, number> = {};
    for (const record of history) {
      strategyDistribution[record.strategyUsed] = (strategyDistribution[record.strategyUsed] || 0) + 1;
    }

    // Calculate timeline data (group by hour)
    const timelineMap = new Map<string, number>();
    for (const record of history) {
      const hour = new Date(record.timestamp).toISOString().substring(0, 13);
      timelineMap.set(hour, (timelineMap.get(hour) || 0) + 1);
    }
    const timelineData = Array.from(timelineMap.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => a.time.localeCompare(b.time));

    // Top strategies with percentage
    const total = history.length || 1;
    const topStrategies = stats.topStrategies.map(s => ({
      ...s,
      percentage: Math.round((s.count / total) * 100),
    }));

    return {
      generated: new Date().toISOString(),
      summary: {
        totalHealings: stats.totalHealings,
        uniqueSelectors: new Set(history.map(h => h.originalSelector)).size,
        topStrategies,
        avgAttemptsPerHealing: 0, // Would need to track this
        totalTimeSaved: history.length * 30, // Estimated 30s saved per healing
      },
      healings: history,
      charts: {
        strategyDistribution,
        timelineData,
      },
    };
  }

  /**
   * Save JSON report
   */
  saveJSON(filename?: string): string {
    const report = this.generateReport();
    const filepath = path.join(
      this.config.outputDir,
      filename ?? `healing-report-${Date.now()}.json`
    );
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    return filepath;
  }

  /**
   * Generate HTML report
   */
  generateHTML(): string {
    const report = this.generateReport();
    const isDark = this.config.theme === 'dark';

    const colors = isDark
      ? { bg: '#1a1a2e', card: '#16213e', text: '#eee', accent: '#e94560', success: '#00d9ff' }
      : { bg: '#f5f5f5', card: '#fff', text: '#333', accent: '#e94560', success: '#00b894' };

    const strategyChart = Object.entries(report.charts.strategyDistribution)
      .map(([strategy, count]) => {
        const width = Math.round((count / (report.summary.totalHealings || 1)) * 100);
        return `
          <div class="strategy-bar">
            <span class="strategy-name">${strategy}</span>
            <div class="bar-container">
              <div class="bar" style="width: ${width}%"></div>
            </div>
            <span class="strategy-count">${count}</span>
          </div>
        `;
      })
      .join('');

    const healingsTable = report.healings
      .slice(-50) // Last 50
      .reverse()
      .map((h, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><code>${this.escapeHtml(h.originalSelector.substring(0, 50))}</code></td>
          <td><code>${this.escapeHtml(h.healedSelector.substring(0, 50))}</code></td>
          <td><span class="badge">${h.strategyUsed}</span></td>
          <td>${new Date(h.timestamp).toLocaleString()}</td>
        </tr>
      `)
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔧 Self-Healing Report - QANTUM Hybrid</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: ${colors.bg};
      color: ${colors.text};
      padding: 20px;
      min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    
    header {
      text-align: center;
      padding: 40px 0;
      border-bottom: 2px solid ${colors.accent};
      margin-bottom: 30px;
    }
    header h1 {
      font-size: 2.5rem;
      color: ${colors.accent};
      margin-bottom: 10px;
    }
    header p { opacity: 0.7; }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: ${colors.card};
      border-radius: 12px;
      padding: 25px;
      text-align: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .stat-card .value {
      font-size: 2.5rem;
      font-weight: bold;
      color: ${colors.success};
    }
    .stat-card .label {
      font-size: 0.9rem;
      opacity: 0.7;
      margin-top: 5px;
    }
    
    .section {
      background: ${colors.card};
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 30px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .section h2 {
      color: ${colors.accent};
      margin-bottom: 20px;
      font-size: 1.3rem;
    }
    
    .strategy-bar {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
    .strategy-name {
      width: 100px;
      font-size: 0.85rem;
    }
    .bar-container {
      flex: 1;
      height: 24px;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      overflow: hidden;
      margin: 0 15px;
    }
    .bar {
      height: 100%;
      background: linear-gradient(90deg, ${colors.accent}, ${colors.success});
      border-radius: 12px;
      transition: width 0.5s ease;
    }
    .strategy-count {
      width: 40px;
      text-align: right;
      font-weight: bold;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    th {
      background: rgba(255,255,255,0.05);
      font-weight: 600;
    }
    code {
      background: rgba(255,255,255,0.1);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    .badge {
      background: ${colors.accent};
      color: white;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: bold;
    }
    
    footer {
      text-align: center;
      padding: 30px;
      opacity: 0.5;
    }
    
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      header h1 { font-size: 1.8rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔧 Self-Healing Report</h1>
      <p>QANTUM Hybrid v1.0.0 | Generated: ${report.generated}</p>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${report.summary.totalHealings}</div>
        <div class="label">Total Healings</div>
      </div>
      <div class="stat-card">
        <div class="value">${report.summary.uniqueSelectors}</div>
        <div class="label">Unique Selectors</div>
      </div>
      <div class="stat-card">
        <div class="value">${report.summary.topStrategies[0]?.strategy || 'N/A'}</div>
        <div class="label">Top Strategy</div>
      </div>
      <div class="stat-card">
        <div class="value">~${Math.round(report.summary.totalTimeSaved / 60)}m</div>
        <div class="label">Time Saved</div>
      </div>
    </div>

    <div class="section">
      <h2>📊 Strategy Distribution</h2>
      ${strategyChart || '<p>No healing data yet</p>'}
    </div>

    <div class="section">
      <h2>📋 Recent Healings</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Original Selector</th>
            <th>Healed Selector</th>
            <th>Strategy</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          ${healingsTable || '<tr><td colspan="5">No healings recorded</td></tr>'}
        </tbody>
      </table>
    </div>

    <footer>
      <p>🧠 QANTUM Hybrid v1.0.0 - Enterprise Self-Healing Framework</p>
    </footer>
  </div>
</body>
</html>`;
  }

  /**
   * Save HTML report
   */
  saveHTML(filename?: string): string {
    const html = this.generateHTML();
    const filepath = path.join(
      this.config.outputDir,
      filename ?? `healing-report-${Date.now()}.html`
    );
    
    fs.writeFileSync(filepath, html);
    return filepath;
  }

  /**
   * Generate Allure-compatible JSON
   */
  generateAllureAttachment(): object {
    const report = this.generateReport();
    
    return {
      name: 'Self-Healing Report',
      type: 'application/json',
      value: JSON.stringify({
        totalHealings: report.summary.totalHealings,
        strategies: report.summary.topStrategies,
        healings: report.healings.map(h => ({
          original: h.originalSelector,
          healed: h.healedSelector,
          strategy: h.strategyUsed,
          page: h.pageUrl,
        })),
      }),
    };
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export default HealingReporter;
