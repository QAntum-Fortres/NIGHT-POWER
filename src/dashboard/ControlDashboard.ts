/**
 * ControlDashboard.ts - "The Command Center"
 * 
 * QAntum Framework v1.9.5 - "The Hybrid Bridge"
 * 
 * Dashboard control interface with FULL AUTONOMY vs MANUAL UX OVERRIDE toggle.
 * Provides real-time state management for the entire Swarm consciousness.
 * 
 * Control Modes:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                          CONTROL DASHBOARD                             │
 * ├────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │   ┌─────────────────────────────────────────────────────────────────┐  │
 * │   │                    MODE SELECTOR                                 │  │
 * │   │                                                                  │  │
 * │   │    ◉ FULL AUTONOMY      ○ HYBRID       ○ MANUAL UX OVERRIDE    │  │
 * │   │    [====================================|            ]          │  │
 * │   │                                                                  │  │
 * │   └─────────────────────────────────────────────────────────────────┘  │
 * │                                                                         │
 * │   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
 * │   │  🤖 Workers: 47  │  │  👁️ Spectators: 2 │  │  🎮 Hijacked: 1  │    │
 * │   └──────────────────┘  └──────────────────┘  └──────────────────┘    │
 * │                                                                         │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * MARKET VALUE: +$180,000 (Enterprise Control)
 * 
 * @module dashboard/ControlDashboard
 * @version 1.0.0
 * @enterprise true
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { HardwareBridge, ControlMode, BridgeStatus } from '../physics/HardwareBridge';
import { SpectatorMode, SpectatorStatus } from '../swarm/SpectatorMode';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Dashboard state
 */
export interface DashboardState {
  // Control
  controlMode: ControlMode;
  modeLockedBy?: string;
  modeLockedAt?: Date;
  
  // System
  systemHealth: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  
  // Workers
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  errorWorkers: number;
  
  // Spectators
  spectatorCount: number;
  activeHijacks: number;
  
  // Performance
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  
  // Neural
  neuralWeightsLoaded: boolean;
  lastWeightUpdate?: Date;
  humanPatternsLearned: number;
  
  // Threat
  threatLevel: 'safe' | 'caution' | 'warning' | 'danger' | 'critical';
  activeAlerts: number;
}

/**
 * Worker status for dashboard
 */
export interface DashboardWorker {
  workerId: string;
  status: 'active' | 'idle' | 'hijacked' | 'error' | 'offline';
  
  // Current activity
  currentUrl?: string;
  currentTask?: string;
  
  // Performance
  cpuUsage: number;
  memoryMB: number;
  actionsPerMinute: number;
  
  // Threat
  threatLevel: string;
  detectionRisk: number;
  
  // Hijack
  isHijacked: boolean;
  hijackedBy?: string;
}

/**
 * Alert for dashboard
 */
export interface DashboardAlert {
  alertId: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: string;
  timestamp: Date;
  acknowledged: boolean;
}

/**
 * Mode transition request
 */
export interface ModeTransitionRequest {
  requestId: string;
  fromMode: ControlMode;
  toMode: ControlMode;
  requestedBy: string;
  requestedAt: Date;
  reason?: string;
  
  // Approval (for MANUAL_UX_OVERRIDE)
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

/**
 * Dashboard configuration
 */
export interface DashboardConfig {
  // Updates
  stateUpdateInterval: number;    // ms
  metricsUpdateInterval: number;  // ms
  
  // Security
  requireApprovalForManual: boolean;
  modeTransitionCooldown: number; // ms
  
  // Alerts
  maxAlerts: number;
  alertRetentionMinutes: number;
  
  // Thresholds
  cpuWarningThreshold: number;
  memoryWarningThreshold: number;
  threatEscalationThreshold: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: DashboardConfig = {
  stateUpdateInterval: 1000,
  metricsUpdateInterval: 5000,
  
  requireApprovalForManual: false,
  modeTransitionCooldown: 5000,
  
  maxAlerts: 100,
  alertRetentionMinutes: 60,
  
  cpuWarningThreshold: 80,
  memoryWarningThreshold: 85,
  threatEscalationThreshold: 0.7
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTROL DASHBOARD ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ControlDashboard - The Nerve Center
 * 
 * Central control interface for the entire QAntum swarm.
 * Manages FULL AUTONOMY vs MANUAL UX OVERRIDE switching.
 */
export class ControlDashboard extends EventEmitter {
  private config: DashboardConfig;
  private bridge: HardwareBridge;
  private spectator?: SpectatorMode;
  
  // State
  private state: DashboardState;
  private workers: Map<string, DashboardWorker> = new Map();
  private alerts: DashboardAlert[] = [];
  
  // Mode transitions
  private pendingTransitions: Map<string, ModeTransitionRequest> = new Map();
  private lastModeChange: Date = new Date();
  
  // Update timers
  private stateUpdateTimer?: NodeJS.Timeout;
  private metricsUpdateTimer?: NodeJS.Timeout;
  private alertCleanupTimer?: NodeJS.Timeout;
  
  // Event handlers for WebSocket broadcasting
  private stateChangeHandlers: Array<(state: DashboardState) => void> = [];
  
  constructor(
    bridge: HardwareBridge,
    spectator?: SpectatorMode,
    config: Partial<DashboardConfig> = {}
  ) {
    super();
    this.bridge = bridge;
    this.spectator = spectator;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize state
    this.state = {
      controlMode: 'FULL_AUTONOMY',
      systemHealth: 'healthy',
      uptime: 0,
      totalWorkers: 0,
      activeWorkers: 0,
      idleWorkers: 0,
      errorWorkers: 0,
      spectatorCount: 0,
      activeHijacks: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      networkLatency: 0,
      neuralWeightsLoaded: false,
      humanPatternsLearned: 0,
      threatLevel: 'safe',
      activeAlerts: 0
    };
    
    this.setupListeners();
    this.startUpdateLoops();
    
    this.emit('initialized', { timestamp: new Date() });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Setup event listeners from bridge and spectator
   */
  private setupListeners(): void {
    // Bridge events
    this.bridge.on('control:mode-changed', (data: { oldMode: ControlMode; newMode: ControlMode }) => {
      this.handleModeChange(data.newMode);
    });
    
    this.bridge.on('hijack:started', (data: { workerId: string; operatorId: string }) => {
      this.handleHijackStarted(data.workerId, data.operatorId);
    });
    
    this.bridge.on('hijack:ended', (data: { workerId: string }) => {
      this.handleHijackEnded(data.workerId);
    });
    
    this.bridge.on('client:connected', (data: { role: string }) => {
      if (data.role === 'spectator' || data.role === 'satellite') {
        this.state.spectatorCount++;
        this.emitStateChange();
      }
    });
    
    this.bridge.on('client:disconnected', (data: { role: string }) => {
      if (data.role === 'spectator' || data.role === 'satellite') {
        this.state.spectatorCount = Math.max(0, this.state.spectatorCount - 1);
        this.emitStateChange();
      }
    });
    
    // Spectator events
    if (this.spectator) {
      this.spectator.on('neural:weights-updated', (data: { sampleCount: number }) => {
        this.state.neuralWeightsLoaded = true;
        this.state.lastWeightUpdate = new Date();
        this.state.humanPatternsLearned = data.sampleCount;
        this.emitStateChange();
        
        this.addAlert('info', `Neural weights updated from ${data.sampleCount} human sessions`, 'OracleHumanizer');
      });
    }
  }
  
  /**
   * Start update loops
   */
  private startUpdateLoops(): void {
    // State update
    this.stateUpdateTimer = setInterval(() => {
      this.updateState();
    }, this.config.stateUpdateInterval);
    
    // Metrics update (less frequent)
    this.metricsUpdateTimer = setInterval(() => {
      this.updateMetrics();
    }, this.config.metricsUpdateInterval);
    
    // Alert cleanup
    this.alertCleanupTimer = setInterval(() => {
      this.cleanupAlerts();
    }, 60000);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // MODE CONTROL
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Request mode transition
   */
  async requestModeTransition(
    toMode: ControlMode,
    requestedBy: string,
    reason?: string
  ): Promise<ModeTransitionRequest> {
    const request: ModeTransitionRequest = {
      requestId: this.generateId('trans'),
      fromMode: this.state.controlMode,
      toMode,
      requestedBy,
      requestedAt: new Date(),
      reason,
      requiresApproval: toMode === 'MANUAL_UX_OVERRIDE' && this.config.requireApprovalForManual
    };
    
    // Check cooldown
    const timeSinceLastChange = Date.now() - this.lastModeChange.getTime();
    if (timeSinceLastChange < this.config.modeTransitionCooldown) {
      this.addAlert('warning', 
        `Mode transition blocked - cooldown ${(this.config.modeTransitionCooldown - timeSinceLastChange) / 1000}s remaining`,
        'ControlDashboard'
      );
      return request;
    }
    
    // If approval required, queue request
    if (request.requiresApproval) {
      this.pendingTransitions.set(request.requestId, request);
      this.addAlert('warning', 
        `Mode transition to ${toMode} requires approval`,
        'ControlDashboard'
      );
      this.emit('mode:approval-required', request);
      return request;
    }
    
    // Execute transition
    await this.executeTransition(request);
    
    return request;
  }
  
  /**
   * Approve pending mode transition
   */
  async approveModeTransition(requestId: string, approvedBy: string): Promise<boolean> {
    const request = this.pendingTransitions.get(requestId);
    if (!request) {
      return false;
    }
    
    request.approvedBy = approvedBy;
    request.approvedAt = new Date();
    
    await this.executeTransition(request);
    
    this.pendingTransitions.delete(requestId);
    
    return true;
  }
  
  /**
   * Execute mode transition
   */
  private async executeTransition(request: ModeTransitionRequest): Promise<void> {
    const { fromMode, toMode, requestedBy } = request;
    
    // Log transition
    this.log('info', `[CONTROL] Mode transition: ${fromMode} → ${toMode} by ${requestedBy}`);
    
    // Update bridge
    this.bridge.setControlMode(toMode);
    
    // Update state
    this.state.controlMode = toMode;
    this.state.modeLockedBy = requestedBy;
    this.state.modeLockedAt = new Date();
    this.lastModeChange = new Date();
    
    // Emit events
    this.emit('mode:changed', {
      fromMode,
      toMode,
      requestedBy,
      timestamp: new Date()
    });
    
    this.emitStateChange();
    
    // Add alert
    this.addAlert('info', 
      `Control mode changed to ${toMode}`,
      'ControlDashboard'
    );
    
    // Mode-specific actions
    if (toMode === 'FULL_AUTONOMY') {
      // Release all hijacks when going to full autonomy
      this.emit('mode:autonomy-activated');
    } else if (toMode === 'MANUAL_UX_OVERRIDE') {
      // Pause autonomous actions when going manual
      this.emit('mode:manual-activated');
    }
  }
  
  /**
   * Handle mode change from bridge
   */
  private handleModeChange(newMode: ControlMode): void {
    this.state.controlMode = newMode;
    this.lastModeChange = new Date();
    this.emitStateChange();
  }
  
  /**
   * Toggle between AUTONOMY and MANUAL
   */
  async toggleMode(requestedBy: string): Promise<ControlMode> {
    const newMode = this.state.controlMode === 'FULL_AUTONOMY' 
      ? 'MANUAL_UX_OVERRIDE' 
      : 'FULL_AUTONOMY';
    
    await this.requestModeTransition(newMode, requestedBy, 'Toggle');
    
    return newMode;
  }
  
  /**
   * Set to FULL AUTONOMY
   */
  async setAutonomyMode(requestedBy: string): Promise<void> {
    if (this.state.controlMode !== 'FULL_AUTONOMY') {
      await this.requestModeTransition('FULL_AUTONOMY', requestedBy);
    }
  }
  
  /**
   * Set to MANUAL UX OVERRIDE
   */
  async setManualMode(requestedBy: string): Promise<void> {
    if (this.state.controlMode !== 'MANUAL_UX_OVERRIDE') {
      await this.requestModeTransition('MANUAL_UX_OVERRIDE', requestedBy);
    }
  }
  
  /**
   * Set to HYBRID mode
   */
  async setHybridMode(requestedBy: string): Promise<void> {
    if (this.state.controlMode !== 'HYBRID') {
      await this.requestModeTransition('HYBRID', requestedBy);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // WORKER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Register worker for dashboard
   */
  registerWorker(workerId: string, initialStatus: Partial<DashboardWorker> = {}): void {
    const worker: DashboardWorker = {
      workerId,
      status: 'idle',
      cpuUsage: 0,
      memoryMB: 0,
      actionsPerMinute: 0,
      threatLevel: 'safe',
      detectionRisk: 0,
      isHijacked: false,
      ...initialStatus
    };
    
    this.workers.set(workerId, worker);
    this.updateWorkerCounts();
    
    this.emit('worker:registered', { workerId });
  }
  
  /**
   * Update worker status
   */
  updateWorkerStatus(workerId: string, status: Partial<DashboardWorker>): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      Object.assign(worker, status);
      this.updateWorkerCounts();
      
      // Check for threat escalation
      if (worker.detectionRisk > this.config.threatEscalationThreshold) {
        this.addAlert('warning', 
          `Worker ${workerId} detection risk elevated: ${(worker.detectionRisk * 100).toFixed(1)}%`,
          'ThreatMonitor'
        );
      }
    }
  }
  
  /**
   * Unregister worker
   */
  unregisterWorker(workerId: string): void {
    this.workers.delete(workerId);
    this.updateWorkerCounts();
    this.emit('worker:unregistered', { workerId });
  }
  
  /**
   * Handle hijack started
   */
  private handleHijackStarted(workerId: string, operatorId: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.isHijacked = true;
      worker.hijackedBy = operatorId;
      worker.status = 'hijacked';
    }
    
    this.state.activeHijacks++;
    this.emitStateChange();
    
    this.addAlert('info', 
      `Worker ${workerId} hijacked by ${operatorId}`,
      'SpectatorMode'
    );
  }
  
  /**
   * Handle hijack ended
   */
  private handleHijackEnded(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.isHijacked = false;
      worker.hijackedBy = undefined;
      worker.status = 'active';
    }
    
    this.state.activeHijacks = Math.max(0, this.state.activeHijacks - 1);
    this.emitStateChange();
    
    this.addAlert('info', 
      `Worker ${workerId} released from hijack`,
      'SpectatorMode'
    );
  }
  
  /**
   * Update worker counts
   */
  private updateWorkerCounts(): void {
    let active = 0, idle = 0, error = 0;
    
    for (const worker of this.workers.values()) {
      switch (worker.status) {
        case 'active':
        case 'hijacked':
          active++;
          break;
        case 'idle':
          idle++;
          break;
        case 'error':
        case 'offline':
          error++;
          break;
      }
    }
    
    this.state.totalWorkers = this.workers.size;
    this.state.activeWorkers = active;
    this.state.idleWorkers = idle;
    this.state.errorWorkers = error;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // STATE UPDATES
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Update dashboard state
   */
  private updateState(): void {
    // Update uptime
    const bridgeStatus = this.bridge.getStatus();
    this.state.uptime = bridgeStatus.uptime;
    
    // Update spectator count
    this.state.spectatorCount = bridgeStatus.clientsByRole.spectator + 
                                 bridgeStatus.clientsByRole.satellite;
    
    // Update active hijacks
    this.state.activeHijacks = bridgeStatus.activeHijacks;
    
    // Update alert count
    this.state.activeAlerts = this.alerts.filter(a => !a.acknowledged).length;
    
    // Calculate system health
    this.state.systemHealth = this.calculateSystemHealth();
    
    // Calculate threat level
    this.state.threatLevel = this.calculateThreatLevel();
    
    // Emit state update
    this.emitStateChange();
  }
  
  /**
   * Update metrics (less frequent)
   */
  private updateMetrics(): void {
    // CPU usage
    const cpuUsage = process.cpuUsage();
    this.state.cpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000 * 100;
    
    // Memory usage
    const memUsage = process.memoryUsage();
    this.state.memoryUsage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    // Check thresholds
    if (this.state.cpuUsage > this.config.cpuWarningThreshold) {
      this.addAlert('warning', 
        `CPU usage high: ${this.state.cpuUsage.toFixed(1)}%`,
        'SystemMonitor'
      );
    }
    
    if (this.state.memoryUsage > this.config.memoryWarningThreshold) {
      this.addAlert('warning', 
        `Memory usage high: ${this.state.memoryUsage.toFixed(1)}%`,
        'SystemMonitor'
      );
    }
  }
  
  /**
   * Calculate system health
   */
  private calculateSystemHealth(): 'healthy' | 'degraded' | 'critical' {
    const errorRatio = this.state.totalWorkers > 0 
      ? this.state.errorWorkers / this.state.totalWorkers 
      : 0;
    
    if (errorRatio > 0.5 || this.state.cpuUsage > 95 || this.state.memoryUsage > 95) {
      return 'critical';
    }
    
    if (errorRatio > 0.2 || this.state.cpuUsage > this.config.cpuWarningThreshold || 
        this.state.memoryUsage > this.config.memoryWarningThreshold) {
      return 'degraded';
    }
    
    return 'healthy';
  }
  
  /**
   * Calculate overall threat level
   */
  private calculateThreatLevel(): 'safe' | 'caution' | 'warning' | 'danger' | 'critical' {
    let maxRisk = 0;
    
    for (const worker of this.workers.values()) {
      if (worker.detectionRisk > maxRisk) {
        maxRisk = worker.detectionRisk;
      }
    }
    
    if (maxRisk > 0.9) return 'critical';
    if (maxRisk > 0.7) return 'danger';
    if (maxRisk > 0.5) return 'warning';
    if (maxRisk > 0.3) return 'caution';
    return 'safe';
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ALERTS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Add alert
   */
  addAlert(
    level: DashboardAlert['level'],
    message: string,
    source: string
  ): DashboardAlert {
    const alert: DashboardAlert = {
      alertId: this.generateId('alert'),
      level,
      message,
      source,
      timestamp: new Date(),
      acknowledged: false
    };
    
    this.alerts.unshift(alert);
    
    // Trim to max
    if (this.alerts.length > this.config.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.config.maxAlerts);
    }
    
    this.state.activeAlerts = this.alerts.filter(a => !a.acknowledged).length;
    
    this.emit('alert:new', alert);
    
    return alert;
  }
  
  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.alertId === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.state.activeAlerts = this.alerts.filter(a => !a.acknowledged).length;
      this.emit('alert:acknowledged', { alertId });
    }
  }
  
  /**
   * Acknowledge all alerts
   */
  acknowledgeAllAlerts(): void {
    for (const alert of this.alerts) {
      alert.acknowledged = true;
    }
    this.state.activeAlerts = 0;
    this.emit('alert:all-acknowledged');
  }
  
  /**
   * Cleanup old alerts
   */
  private cleanupAlerts(): void {
    const cutoff = Date.now() - this.config.alertRetentionMinutes * 60 * 1000;
    this.alerts = this.alerts.filter(a => 
      a.timestamp.getTime() > cutoff || !a.acknowledged
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // STATE BROADCASTING
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Register state change handler (for WebSocket broadcast)
   */
  onStateChange(handler: (state: DashboardState) => void): void {
    this.stateChangeHandlers.push(handler);
  }
  
  /**
   * Emit state change to all handlers
   */
  private emitStateChange(): void {
    const state = this.getState();
    
    for (const handler of this.stateChangeHandlers) {
      try {
        handler(state);
      } catch (error) {
        this.log('error', `State change handler error: ${(error as Error).message}`);
      }
    }
    
    this.emit('state:changed', state);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // API METHODS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Get current state
   */
  getState(): DashboardState {
    return { ...this.state };
  }
  
  /**
   * Get current control mode
   */
  getControlMode(): ControlMode {
    return this.state.controlMode;
  }
  
  /**
   * Check if in autonomy mode
   */
  isAutonomyMode(): boolean {
    return this.state.controlMode === 'FULL_AUTONOMY';
  }
  
  /**
   * Check if in manual mode
   */
  isManualMode(): boolean {
    return this.state.controlMode === 'MANUAL_UX_OVERRIDE';
  }
  
  /**
   * Check if in hybrid mode
   */
  isHybridMode(): boolean {
    return this.state.controlMode === 'HYBRID';
  }
  
  /**
   * Get all workers
   */
  getWorkers(): DashboardWorker[] {
    return Array.from(this.workers.values());
  }
  
  /**
   * Get worker by ID
   */
  getWorker(workerId: string): DashboardWorker | undefined {
    return this.workers.get(workerId);
  }
  
  /**
   * Get alerts
   */
  getAlerts(unacknowledgedOnly: boolean = false): DashboardAlert[] {
    if (unacknowledgedOnly) {
      return this.alerts.filter(a => !a.acknowledged);
    }
    return [...this.alerts];
  }
  
  /**
   * Get pending mode transitions
   */
  getPendingTransitions(): ModeTransitionRequest[] {
    return Array.from(this.pendingTransitions.values());
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
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
   * Shutdown dashboard
   */
  async shutdown(): Promise<void> {
    // Stop timers
    if (this.stateUpdateTimer) clearInterval(this.stateUpdateTimer);
    if (this.metricsUpdateTimer) clearInterval(this.metricsUpdateTimer);
    if (this.alertCleanupTimer) clearInterval(this.alertCleanupTimer);
    
    // Clear state
    this.workers.clear();
    this.alerts = [];
    this.pendingTransitions.clear();
    this.stateChangeHandlers = [];
    
    this.emit('shutdown', { timestamp: new Date() });
    this.log('info', '[DASHBOARD] Control dashboard shutdown complete');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new ControlDashboard instance
 */
export function createControlDashboard(
  bridge: HardwareBridge,
  spectator?: SpectatorMode,
  config?: Partial<DashboardConfig>
): ControlDashboard {
  return new ControlDashboard(bridge, spectator, config);
}

export default ControlDashboard;
