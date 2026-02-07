/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: BEHAVIOR ANALYSIS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * User flow analysis, heatmap generation, session recording, behavior reporting
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0-QANTUM-PRIME
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface UserAction {
  type: 'click' | 'type' | 'scroll' | 'hover' | 'navigate' | 'wait';
  timestamp: number;
  target?: string;
  value?: string;
  position?: { x: number; y: number };
  duration?: number;
  metadata?: Record<string, any>;
}

export interface FlowStep {
  action: UserAction;
  page: string;
  screenshot?: string;
  elementInfo?: ElementInfo;
  timing: {
    actionStart: number;
    actionEnd: number;
    pageLoadTime?: number;
  };
}

export interface ElementInfo {
  selector: string;
  tagName: string;
  text?: string;
  bounds: { x: number; y: number; width: number; height: number };
  visible: boolean;
}

export interface FlowAnalysis {
  flowId: string;
  name: string;
  steps: FlowStep[];
  totalDuration: number;
  pageTransitions: number;
  errorCount: number;
  patterns: FlowPattern[];
  recommendations: string[];
}

export interface FlowPattern {
  type: string;
  description: string;
  frequency: number;
  steps: number[];
}

export interface HeatmapData {
  pageUrl: string;
  width: number;
  height: number;
  clicks: Array<{ x: number; y: number; count: number }>;
  moves: Array<{ x: number; y: number; density: number }>;
  scrollDepth: number[];
  attention: AttentionZone[];
}

export interface AttentionZone {
  bounds: { x: number; y: number; width: number; height: number };
  timeSpent: number;
  interactionCount: number;
}

export interface SessionRecording {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  actions: RecordedAction[];
  pages: string[];
  duration: number;
  metadata: Record<string, any>;
}

export interface RecordedAction {
  timestamp: number;
  type: string;
  data: any;
  screenshot?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER FLOW ANALYZER
// ═══════════════════════════════════════════════════════════════════════════════

export class UserFlowAnalyzer extends EventEmitter {
  private flows: Map<string, FlowStep[]> = new Map();
  private currentFlowId: string | null = null;
  private patterns: FlowPattern[] = [];

  /**
   * Start recording a new flow
   */
  startFlow(name: string): string {
    const flowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentFlowId = flowId;
    this.flows.set(flowId, []);
    this.emit('flowStarted', { flowId, name });
    return flowId;
  }

  /**
   * Record a step in the current flow
   */
  recordStep(action: UserAction, page: string, elementInfo?: ElementInfo): void {
    if (!this.currentFlowId) {
      this.startFlow('default');
    }

    const step: FlowStep = {
      action,
      page,
      elementInfo,
      timing: {
        actionStart: Date.now(),
        actionEnd: Date.now() + (action.duration || 0)
      }
    };

    this.flows.get(this.currentFlowId!)!.push(step);
    this.emit('stepRecorded', step);
  }

  /**
   * End current flow and analyze
   */
  endFlow(): FlowAnalysis | null {
    if (!this.currentFlowId) return null;

    const steps = this.flows.get(this.currentFlowId)!;
    const analysis = this.analyzeFlow(this.currentFlowId, steps);
    
    this.emit('flowEnded', analysis);
    this.currentFlowId = null;
    
    return analysis;
  }

  /**
   * Analyze flow patterns
   */
  analyzeFlow(flowId: string, steps: FlowStep[]): FlowAnalysis {
    const pages = [...new Set(steps.map(s => s.page))];
    const pageTransitions = this.countPageTransitions(steps);
    const patterns = this.detectPatterns(steps);
    const recommendations = this.generateRecommendations(steps, patterns);

    let totalDuration = 0;
    let errorCount = 0;

    for (const step of steps) {
      totalDuration += step.timing.actionEnd - step.timing.actionStart;
      if (step.action.metadata?.error) errorCount++;
    }

    return {
      flowId,
      name: flowId,
      steps,
      totalDuration,
      pageTransitions,
      errorCount,
      patterns,
      recommendations
    };
  }

  /**
   * Compare two flows
   */
  compareFlows(flowId1: string, flowId2: string): FlowComparison {
    const flow1 = this.flows.get(flowId1) || [];
    const flow2 = this.flows.get(flowId2) || [];

    return {
      flow1Steps: flow1.length,
      flow2Steps: flow2.length,
      commonSteps: this.findCommonSteps(flow1, flow2),
      uniqueToFlow1: this.findUniqueSteps(flow1, flow2),
      uniqueToFlow2: this.findUniqueSteps(flow2, flow1),
      timingDifference: this.calculateTimingDiff(flow1, flow2)
    };
  }

  /**
   * Get optimal path for a goal
   */
  getOptimalPath(startPage: string, goalPage: string): FlowStep[] {
    const allFlows = Array.from(this.flows.values()).flat();
    const relevantFlows = allFlows.filter(s => s.page === startPage || s.page === goalPage);
    
    // Simple path finding (could be enhanced with Dijkstra's)
    const paths: FlowStep[][] = [];
    
    for (let i = 0; i < relevantFlows.length; i++) {
      if (relevantFlows[i].page === startPage) {
        const path: FlowStep[] = [relevantFlows[i]];
        for (let j = i + 1; j < relevantFlows.length; j++) {
          path.push(relevantFlows[j]);
          if (relevantFlows[j].page === goalPage) {
            paths.push([...path]);
            break;
          }
        }
      }
    }

    // Return shortest path
    return paths.sort((a, b) => a.length - b.length)[0] || [];
  }

  private countPageTransitions(steps: FlowStep[]): number {
    let transitions = 0;
    for (let i = 1; i < steps.length; i++) {
      if (steps[i].page !== steps[i - 1].page) transitions++;
    }
    return transitions;
  }

  private detectPatterns(steps: FlowStep[]): FlowPattern[] {
    const patterns: FlowPattern[] = [];

    // Detect repeated sequences
    const sequences = this.findRepeatedSequences(steps.map(s => s.action.type));
    for (const [seq, indices] of sequences) {
      if (indices.length >= 2) {
        patterns.push({
          type: 'repeated_sequence',
          description: `Repeated sequence: ${seq}`,
          frequency: indices.length,
          steps: indices
        });
      }
    }

    // Detect wait patterns
    const waits = steps.map((s, i) => ({ step: i, duration: s.action.duration || 0 }))
      .filter(w => w.duration > 1000);
    if (waits.length > 0) {
      patterns.push({
        type: 'long_waits',
        description: `${waits.length} steps with waits > 1s`,
        frequency: waits.length,
        steps: waits.map(w => w.step)
      });
    }

    // Detect rapid clicking
    const rapidClicks: number[] = [];
    for (let i = 1; i < steps.length; i++) {
      if (steps[i].action.type === 'click' && 
          steps[i - 1].action.type === 'click' &&
          steps[i].timing.actionStart - steps[i - 1].timing.actionEnd < 500) {
        rapidClicks.push(i);
      }
    }
    if (rapidClicks.length >= 3) {
      patterns.push({
        type: 'rapid_clicks',
        description: 'Multiple rapid clicks detected',
        frequency: rapidClicks.length,
        steps: rapidClicks
      });
    }

    return patterns;
  }

  private findRepeatedSequences(types: string[]): Map<string, number[]> {
    const sequences = new Map<string, number[]>();
    
    for (let len = 2; len <= Math.min(5, types.length / 2); len++) {
      for (let i = 0; i <= types.length - len; i++) {
        const seq = types.slice(i, i + len).join('-');
        if (!sequences.has(seq)) sequences.set(seq, []);
        sequences.get(seq)!.push(i);
      }
    }

    return sequences;
  }

  private generateRecommendations(steps: FlowStep[], patterns: FlowPattern[]): string[] {
    const recommendations: string[] = [];

    if (steps.length > 20) {
      recommendations.push('Consider breaking this flow into smaller sub-flows');
    }

    const longWaits = patterns.find(p => p.type === 'long_waits');
    if (longWaits && longWaits.frequency > 3) {
      recommendations.push('High wait times detected - investigate page load performance');
    }

    const rapidClicks = patterns.find(p => p.type === 'rapid_clicks');
    if (rapidClicks) {
      recommendations.push('Rapid clicks detected - ensure proper click handlers and debouncing');
    }

    const repeated = patterns.filter(p => p.type === 'repeated_sequence');
    if (repeated.length > 0) {
      recommendations.push('Repeated patterns found - consider extracting to reusable components');
    }

    return recommendations;
  }

  private findCommonSteps(flow1: FlowStep[], flow2: FlowStep[]): number {
    let common = 0;
    for (const s1 of flow1) {
      if (flow2.some(s2 => s2.action.type === s1.action.type && s2.page === s1.page)) {
        common++;
      }
    }
    return common;
  }

  private findUniqueSteps(flow1: FlowStep[], flow2: FlowStep[]): number {
    return flow1.length - this.findCommonSteps(flow1, flow2);
  }

  private calculateTimingDiff(flow1: FlowStep[], flow2: FlowStep[]): number {
    const duration1 = flow1.reduce((sum, s) => sum + (s.timing.actionEnd - s.timing.actionStart), 0);
    const duration2 = flow2.reduce((sum, s) => sum + (s.timing.actionEnd - s.timing.actionStart), 0);
    return duration1 - duration2;
  }
}

interface FlowComparison {
  flow1Steps: number;
  flow2Steps: number;
  commonSteps: number;
  uniqueToFlow1: number;
  uniqueToFlow2: number;
  timingDifference: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEATMAP GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class HeatmapGenerator extends EventEmitter {
  private heatmapData: Map<string, HeatmapData> = new Map();
  private gridSize: number = 10;

  /**
   * Record click
   */
  recordClick(pageUrl: string, x: number, y: number): void {
    const data = this.getOrCreateHeatmap(pageUrl);
    
    const gridX = Math.floor(x / this.gridSize) * this.gridSize;
    const gridY = Math.floor(y / this.gridSize) * this.gridSize;
    
    const existing = data.clicks.find(c => c.x === gridX && c.y === gridY);
    if (existing) {
      existing.count++;
    } else {
      data.clicks.push({ x: gridX, y: gridY, count: 1 });
    }

    this.emit('clickRecorded', { pageUrl, x, y });
  }

  /**
   * Record mouse movement
   */
  recordMove(pageUrl: string, x: number, y: number): void {
    const data = this.getOrCreateHeatmap(pageUrl);
    
    const gridX = Math.floor(x / this.gridSize) * this.gridSize;
    const gridY = Math.floor(y / this.gridSize) * this.gridSize;
    
    const existing = data.moves.find(m => m.x === gridX && m.y === gridY);
    if (existing) {
      existing.density++;
    } else {
      data.moves.push({ x: gridX, y: gridY, density: 1 });
    }
  }

  /**
   * Record scroll depth
   */
  recordScroll(pageUrl: string, scrollY: number, pageHeight: number): void {
    const data = this.getOrCreateHeatmap(pageUrl);
    const depth = Math.min(100, Math.round((scrollY / pageHeight) * 100));
    
    if (!data.scrollDepth.includes(depth)) {
      data.scrollDepth.push(depth);
      data.scrollDepth.sort((a, b) => a - b);
    }
  }

  /**
   * Record attention zone
   */
  recordAttention(pageUrl: string, zone: AttentionZone): void {
    const data = this.getOrCreateHeatmap(pageUrl);
    
    const existing = data.attention.find(a => 
      a.bounds.x === zone.bounds.x && a.bounds.y === zone.bounds.y
    );
    
    if (existing) {
      existing.timeSpent += zone.timeSpent;
      existing.interactionCount += zone.interactionCount;
    } else {
      data.attention.push(zone);
    }
  }

  /**
   * Generate heatmap visualization data
   */
  generateVisualization(pageUrl: string): HeatmapVisualization {
    const data = this.heatmapData.get(pageUrl);
    if (!data) {
      throw new Error(`No heatmap data for ${pageUrl}`);
    }

    // Normalize click counts
    const maxClicks = Math.max(...data.clicks.map(c => c.count));
    const normalizedClicks = data.clicks.map(c => ({
      ...c,
      intensity: c.count / maxClicks
    }));

    // Generate gradient colors
    const colors = normalizedClicks.map(c => this.intensityToColor(c.intensity));

    // Calculate hotspots
    const hotspots = this.findHotspots(data.clicks);

    // Generate scroll depth visualization
    const scrollVisualization = this.generateScrollVisualization(data.scrollDepth);

    return {
      pageUrl,
      width: data.width,
      height: data.height,
      clickHeatmap: normalizedClicks.map((c, i) => ({ ...c, color: colors[i] })),
      hotspots,
      scrollDepth: scrollVisualization,
      attentionZones: data.attention.sort((a, b) => b.timeSpent - a.timeSpent)
    };
  }

  /**
   * Export heatmap as HTML
   */
  exportAsHTML(pageUrl: string, outputPath: string): void {
    const viz = this.generateVisualization(pageUrl);
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Heatmap: ${pageUrl}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .heatmap-container { position: relative; border: 1px solid #ccc; }
    .heatmap-point { position: absolute; border-radius: 50%; opacity: 0.6; }
    .hotspot { position: absolute; border: 2px solid red; background: rgba(255,0,0,0.1); }
    .scroll-bar { position: absolute; right: 0; width: 20px; background: linear-gradient(to bottom, green, yellow, red); }
    .stats { margin-top: 20px; }
    .attention-zone { position: absolute; border: 2px dashed blue; background: rgba(0,0,255,0.1); }
  </style>
</head>
<body>
  <h1>Heatmap Analysis</h1>
  <p>Page: ${pageUrl}</p>
  
  <div class="heatmap-container" style="width:${viz.width}px;height:${viz.height}px;">
    ${viz.clickHeatmap.map(c => `
      <div class="heatmap-point" style="
        left: ${c.x}px; 
        top: ${c.y}px; 
        width: ${10 + c.intensity * 30}px; 
        height: ${10 + c.intensity * 30}px;
        background: ${c.color};
      "></div>
    `).join('')}
    
    ${viz.hotspots.map(h => `
      <div class="hotspot" style="
        left: ${h.x - 25}px;
        top: ${h.y - 25}px;
        width: 50px;
        height: 50px;
      " title="${h.clicks} clicks"></div>
    `).join('')}
    
    ${viz.attentionZones.slice(0, 5).map(z => `
      <div class="attention-zone" style="
        left: ${z.bounds.x}px;
        top: ${z.bounds.y}px;
        width: ${z.bounds.width}px;
        height: ${z.bounds.height}px;
      " title="${z.timeSpent}ms"></div>
    `).join('')}
  </div>
  
  <div class="stats">
    <h2>Statistics</h2>
    <ul>
      <li>Total click points: ${viz.clickHeatmap.length}</li>
      <li>Hotspots identified: ${viz.hotspots.length}</li>
      <li>Max scroll depth: ${Math.max(...viz.scrollDepth.map(s => s.depth))}%</li>
      <li>Attention zones: ${viz.attentionZones.length}</li>
    </ul>
  </div>
</body>
</html>`;

    fs.writeFileSync(outputPath, html);
    this.emit('exported', { pageUrl, outputPath });
  }

  private getOrCreateHeatmap(pageUrl: string): HeatmapData {
    if (!this.heatmapData.has(pageUrl)) {
      this.heatmapData.set(pageUrl, {
        pageUrl,
        width: 1920,
        height: 1080,
        clicks: [],
        moves: [],
        scrollDepth: [],
        attention: []
      });
    }
    return this.heatmapData.get(pageUrl)!;
  }

  private intensityToColor(intensity: number): string {
    // Blue (cold) -> Green -> Yellow -> Red (hot)
    if (intensity < 0.25) {
      return `rgba(0, 0, ${Math.round(255 * intensity * 4)}, 0.7)`;
    } else if (intensity < 0.5) {
      return `rgba(0, ${Math.round(255 * (intensity - 0.25) * 4)}, 255, 0.7)`;
    } else if (intensity < 0.75) {
      return `rgba(${Math.round(255 * (intensity - 0.5) * 4)}, 255, 0, 0.7)`;
    } else {
      return `rgba(255, ${Math.round(255 * (1 - intensity) * 4)}, 0, 0.8)`;
    }
  }

  private findHotspots(clicks: Array<{ x: number; y: number; count: number }>): Hotspot[] {
    const threshold = Math.max(...clicks.map(c => c.count)) * 0.7;
    return clicks
      .filter(c => c.count >= threshold)
      .map(c => ({ x: c.x, y: c.y, clicks: c.count }));
  }

  private generateScrollVisualization(depths: number[]): Array<{ depth: number; reached: boolean }> {
    const result: Array<{ depth: number; reached: boolean }> = [];
    for (let i = 0; i <= 100; i += 10) {
      result.push({ depth: i, reached: depths.some(d => d >= i) });
    }
    return result;
  }
}

interface HeatmapVisualization {
  pageUrl: string;
  width: number;
  height: number;
  clickHeatmap: Array<{ x: number; y: number; count: number; intensity: number; color: string }>;
  hotspots: Hotspot[];
  scrollDepth: Array<{ depth: number; reached: boolean }>;
  attentionZones: AttentionZone[];
}

interface Hotspot {
  x: number;
  y: number;
  clicks: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION RECORDER
// ═══════════════════════════════════════════════════════════════════════════════

export class SessionRecorder extends EventEmitter {
  private sessions: Map<string, SessionRecording> = new Map();
  private activeSession: string | null = null;
  private recordingInterval: NodeJS.Timer | null = null;
  private screenshotInterval: number = 5000;

  /**
   * Start recording session
   */
  startSession(metadata: Record<string, any> = {}): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.sessions.set(sessionId, {
      sessionId,
      startTime: new Date(),
      actions: [],
      pages: [],
      duration: 0,
      metadata
    });

    this.activeSession = sessionId;
    this.emit('sessionStarted', { sessionId });
    
    return sessionId;
  }

  /**
   * Record action
   */
  recordAction(type: string, data: any, screenshot?: string): void {
    if (!this.activeSession) return;

    const session = this.sessions.get(this.activeSession)!;
    session.actions.push({
      timestamp: Date.now(),
      type,
      data,
      screenshot
    });

    this.emit('actionRecorded', { sessionId: this.activeSession, type, data });
  }

  /**
   * Record page visit
   */
  recordPage(url: string): void {
    if (!this.activeSession) return;

    const session = this.sessions.get(this.activeSession)!;
    if (!session.pages.includes(url)) {
      session.pages.push(url);
    }

    this.recordAction('pageVisit', { url });
  }

  /**
   * End session
   */
  endSession(): SessionRecording | null {
    if (!this.activeSession) return null;

    const session = this.sessions.get(this.activeSession)!;
    session.endTime = new Date();
    session.duration = session.endTime.getTime() - session.startTime.getTime();

    this.emit('sessionEnded', session);
    this.activeSession = null;

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SessionRecording | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Export session
   */
  exportSession(sessionId: string, outputPath: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    fs.writeFileSync(outputPath, JSON.stringify(session, null, 2));
    this.emit('sessionExported', { sessionId, outputPath });
  }

  /**
   * Generate session replay
   */
  generateReplay(sessionId: string): SessionReplay {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const steps: ReplayStep[] = [];
    let prevTimestamp = session.startTime.getTime();

    for (const action of session.actions) {
      steps.push({
        delay: action.timestamp - prevTimestamp,
        action: action.type,
        data: action.data,
        screenshot: action.screenshot
      });
      prevTimestamp = action.timestamp;
    }

    return {
      sessionId,
      totalDuration: session.duration,
      steps,
      pages: session.pages,
      metadata: session.metadata
    };
  }

  /**
   * Replay session (returns async generator)
   */
  async *replaySession(sessionId: string): AsyncGenerator<ReplayStep> {
    const replay = this.generateReplay(sessionId);

    for (const step of replay.steps) {
      await this.delay(step.delay);
      yield step;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

interface SessionReplay {
  sessionId: string;
  totalDuration: number;
  steps: ReplayStep[];
  pages: string[];
  metadata: Record<string, any>;
}

interface ReplayStep {
  delay: number;
  action: string;
  data: any;
  screenshot?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BEHAVIOR REPORTER
// ═══════════════════════════════════════════════════════════════════════════════

export class BehaviorReporter extends EventEmitter {
  private flowAnalyzer: UserFlowAnalyzer;
  private heatmapGenerator: HeatmapGenerator;
  private sessionRecorder: SessionRecorder;

  constructor(
    flowAnalyzer: UserFlowAnalyzer,
    heatmapGenerator: HeatmapGenerator,
    sessionRecorder: SessionRecorder
  ) {
    super();
    this.flowAnalyzer = flowAnalyzer;
    this.heatmapGenerator = heatmapGenerator;
    this.sessionRecorder = sessionRecorder;
  }

  /**
   * Generate comprehensive behavior report
   */
  generateReport(options: ReportOptions): BehaviorReport {
    const report: BehaviorReport = {
      generatedAt: new Date(),
      period: options.period,
      summary: this.generateSummary(),
      userFlows: this.analyzeUserFlows(),
      heatmapInsights: this.analyzeHeatmaps(options.pages),
      sessionStats: this.analyzeSessionStats(),
      recommendations: this.generateRecommendations(),
      charts: this.generateChartData()
    };

    return report;
  }

  /**
   * Export report as HTML
   */
  exportAsHTML(report: BehaviorReport, outputPath: string): void {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Behavior Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
    .card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
    .card h3 { margin: 0; font-size: 2em; color: #007bff; }
    .card p { margin: 5px 0 0; color: #666; }
    .recommendation { background: #e3f2fd; padding: 15px; margin: 10px 0; border-left: 4px solid #2196f3; border-radius: 4px; }
    .flow-item { background: #fff3e0; padding: 15px; margin: 10px 0; border-left: 4px solid #ff9800; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: bold; }
    .chart-placeholder { background: #f5f5f5; height: 200px; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧠 Behavior Analysis Report</h1>
    <p>Generated: ${report.generatedAt.toLocaleString()}</p>
    <p>Period: ${report.period.start.toLocaleDateString()} - ${report.period.end.toLocaleDateString()}</p>
    
    <div class="summary-cards">
      <div class="card">
        <h3>${report.summary.totalSessions}</h3>
        <p>Total Sessions</p>
      </div>
      <div class="card">
        <h3>${report.summary.totalFlows}</h3>
        <p>User Flows</p>
      </div>
      <div class="card">
        <h3>${Math.round(report.summary.avgSessionDuration / 1000)}s</h3>
        <p>Avg Session</p>
      </div>
      <div class="card">
        <h3>${report.summary.totalActions}</h3>
        <p>Total Actions</p>
      </div>
    </div>

    <h2>📊 User Flow Analysis</h2>
    ${report.userFlows.map(f => `
      <div class="flow-item">
        <strong>${f.name}</strong> - ${f.steps} steps, ${f.pageTransitions} page transitions
        <br><small>${f.patterns.length} patterns detected</small>
      </div>
    `).join('')}

    <h2>🎯 Heatmap Insights</h2>
    <table>
      <tr><th>Page</th><th>Click Points</th><th>Hotspots</th><th>Max Scroll</th></tr>
      ${report.heatmapInsights.map(h => `
        <tr>
          <td>${h.page}</td>
          <td>${h.clickPoints}</td>
          <td>${h.hotspots}</td>
          <td>${h.maxScroll}%</td>
        </tr>
      `).join('')}
    </table>

    <h2>💡 Recommendations</h2>
    ${report.recommendations.map(r => `
      <div class="recommendation">
        <strong>${r.category}</strong>: ${r.suggestion}
        <br><small>Priority: ${r.priority}</small>
      </div>
    `).join('')}

    <h2>📈 Session Statistics</h2>
    <table>
      <tr>
        <td>Shortest Session</td><td>${report.sessionStats.shortest}ms</td>
      </tr>
      <tr>
        <td>Longest Session</td><td>${report.sessionStats.longest}ms</td>
      </tr>
      <tr>
        <td>Most Visited Page</td><td>${report.sessionStats.mostVisitedPage}</td>
      </tr>
      <tr>
        <td>Most Common Action</td><td>${report.sessionStats.mostCommonAction}</td>
      </tr>
    </table>
  </div>
</body>
</html>`;

    fs.writeFileSync(outputPath, html);
    this.emit('reportExported', { outputPath });
  }

  private generateSummary(): BehaviorSummary {
    return {
      totalSessions: 0,  // Would be populated from actual data
      totalFlows: 0,
      totalActions: 0,
      avgSessionDuration: 0,
      uniquePages: 0
    };
  }

  private analyzeUserFlows(): FlowSummary[] {
    return [];  // Would analyze actual flows
  }

  private analyzeHeatmaps(pages?: string[]): HeatmapInsight[] {
    return [];  // Would analyze actual heatmaps
  }

  private analyzeSessionStats(): SessionStats {
    return {
      shortest: 0,
      longest: 0,
      average: 0,
      mostVisitedPage: '',
      mostCommonAction: ''
    };
  }

  private generateRecommendations(): Recommendation[] {
    return [
      {
        category: 'Performance',
        suggestion: 'Reduce page load time on high-traffic pages',
        priority: 'high'
      },
      {
        category: 'UX',
        suggestion: 'Add clear CTAs to underperforming pages',
        priority: 'medium'
      }
    ];
  }

  private generateChartData(): ChartData[] {
    return [];
  }
}

interface ReportOptions {
  period: { start: Date; end: Date };
  pages?: string[];
  includeScreenshots?: boolean;
}

interface BehaviorReport {
  generatedAt: Date;
  period: { start: Date; end: Date };
  summary: BehaviorSummary;
  userFlows: FlowSummary[];
  heatmapInsights: HeatmapInsight[];
  sessionStats: SessionStats;
  recommendations: Recommendation[];
  charts: ChartData[];
}

interface BehaviorSummary {
  totalSessions: number;
  totalFlows: number;
  totalActions: number;
  avgSessionDuration: number;
  uniquePages: number;
}

interface FlowSummary {
  name: string;
  steps: number;
  pageTransitions: number;
  patterns: string[];
}

interface HeatmapInsight {
  page: string;
  clickPoints: number;
  hotspots: number;
  maxScroll: number;
}

interface SessionStats {
  shortest: number;
  longest: number;
  average: number;
  mostVisitedPage: string;
  mostCommonAction: string;
}

interface Recommendation {
  category: string;
  suggestion: string;
  priority: 'low' | 'medium' | 'high';
}

interface ChartData {
  type: string;
  data: any;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export function createFlowAnalyzer(): UserFlowAnalyzer {
  return new UserFlowAnalyzer();
}

export function createHeatmapGenerator(): HeatmapGenerator {
  return new HeatmapGenerator();
}

export function createSessionRecorder(): SessionRecorder {
  return new SessionRecorder();
}

export function createBehaviorReporter(
  flowAnalyzer: UserFlowAnalyzer,
  heatmapGenerator: HeatmapGenerator,
  sessionRecorder: SessionRecorder
): BehaviorReporter {
  return new BehaviorReporter(flowAnalyzer, heatmapGenerator, sessionRecorder);
}

export default {
  UserFlowAnalyzer,
  HeatmapGenerator,
  SessionRecorder,
  BehaviorReporter,
  createFlowAnalyzer,
  createHeatmapGenerator,
  createSessionRecorder,
  createBehaviorReporter
};
