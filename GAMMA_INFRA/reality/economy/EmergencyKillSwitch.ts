/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🚨 EMERGENCY KILL SWITCH - Instant Threat Response System
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Metaphysical Principle: In the face of existential threat, survival requires immediate,
 * decisive action. The Kill Switch embodies the "fail-secure" principle - when in doubt,
 * shut down. It is better to cease operation than to operate in a compromised state.
 * 
 * "The supreme art of security is to subdue the enemy without fighting."
 * - Adaptation of Sun Tzu
 * 
 * The Kill Switch monitors for threats and executes pre-defined shutdown procedures
 * when triggered. It can operate in graceful, immediate, or force modes.
 * 
 * @author Dimitar Prodromov
 * @version 17.0.0
 */

import { EventEmitter } from 'events';
import type {
  ThreatEvent,
  ThreatType,
  ThreatLevel,
  ShutdownConfig,
} from '../../../types/security.types';

// ═══════════════════════════════════════════════════════════════════════════════════════
// ⚙️ KILL SWITCH TYPES
// ═══════════════════════════════════════════════════════════════════════════════════════

interface ThreatThreshold {
  type: ThreatType;
  maxOccurrences: number;
  timeWindowMs: number;
  severity: ThreatLevel;
  action: 'warn' | 'throttle' | 'shutdown';
}

interface KillSwitchState {
  armed: boolean;
  triggered: boolean;
  triggeredAt: number | null;
  triggeredBy: ThreatEvent | null;
  shutdownMode: ShutdownConfig['mode'] | null;
  threatHistory: ThreatEvent[];
  sensitiveData: Map<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🔴 EMERGENCY KILL SWITCH ENGINE
// ═══════════════════════════════════════════════════════════════════════════════════════

export class EmergencyKillSwitch extends EventEmitter {
  private state: KillSwitchState;
  private thresholds: ThreatThreshold[];
  private shutdownHandlers: Array<() => Promise<void>>;
  private cleanupHandlers: Array<() => void>;
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private readonly MAX_THREAT_HISTORY = 1000;
  private readonly DEFAULT_SHUTDOWN_TIMEOUT = 30000;

  constructor() {
    super();
    this.state = this.initializeState();
    this.thresholds = this.getDefaultThresholds();
    this.shutdownHandlers = [];
    this.cleanupHandlers = [];
  }

  /**
   * Initialize kill switch state
   */
  private initializeState(): KillSwitchState {
    return {
      armed: false,
      triggered: false,
      triggeredAt: null,
      triggeredBy: null,
      shutdownMode: null,
      threatHistory: [],
      sensitiveData: new Map(),
    };
  }

  /**
   * Get default threat thresholds
   */
  private getDefaultThresholds(): ThreatThreshold[] {
    return [
      // Critical threats - immediate shutdown
      {
        type: 'memory_tampering',
        maxOccurrences: 1,
        timeWindowMs: 60000,
        severity: 'critical',
        action: 'shutdown',
      },
      {
        type: 'debugger_attachment',
        maxOccurrences: 1,
        timeWindowMs: 60000,
        severity: 'critical',
        action: 'shutdown',
      },
      {
        type: 'privilege_escalation',
        maxOccurrences: 1,
        timeWindowMs: 60000,
        severity: 'critical',
        action: 'shutdown',
      },
      
      // High severity - shutdown after repeated occurrences
      {
        type: 'injection',
        maxOccurrences: 5,
        timeWindowMs: 300000,
        severity: 'high',
        action: 'shutdown',
      },
      {
        type: 'xss',
        maxOccurrences: 10,
        timeWindowMs: 300000,
        severity: 'high',
        action: 'throttle',
      },
      
      // Medium severity - throttle
      {
        type: 'brute_force',
        maxOccurrences: 20,
        timeWindowMs: 60000,
        severity: 'medium',
        action: 'throttle',
      },
      {
        type: 'dos',
        maxOccurrences: 100,
        timeWindowMs: 60000,
        severity: 'medium',
        action: 'throttle',
      },
      
      // Data exfiltration - immediate action
      {
        type: 'data_exfiltration',
        maxOccurrences: 1,
        timeWindowMs: 60000,
        severity: 'critical',
        action: 'shutdown',
      },
    ];
  }

  /**
   * Arm the kill switch
   * 
   * Once armed, the kill switch actively monitors for threats
   * and will execute shutdown procedures when triggered.
   */
  public arm(): void {
    if (this.state.armed) {
      this.emit('warning', { message: 'Kill switch already armed' });
      return;
    }
    
    this.state.armed = true;
    this.startMonitoring();
    this.emit('armed', { timestamp: Date.now() });
  }

  /**
   * Disarm the kill switch
   */
  public disarm(): void {
    if (!this.state.armed) {
      return;
    }
    
    this.state.armed = false;
    this.stopMonitoring();
    this.emit('disarmed', { timestamp: Date.now() });
  }

  /**
   * Start active monitoring
   */
  private startMonitoring(): void {
    this.stopMonitoring();
    
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Stop monitoring
   */
  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Perform system health check
   */
  private performHealthCheck(): void {
    if (!this.state.armed || this.state.triggered) {
      return;
    }
    
    // Check for debugger
    this.checkDebugger();
    
    // Check memory integrity (basic)
    this.checkMemoryIntegrity();
    
    // Analyze threat patterns
    this.analyzeThreatPatterns();
  }

  /**
   * Check for debugger attachment
   */
  private checkDebugger(): void {
    // Basic debugger detection
    const startTime = performance.now();
    // eslint-disable-next-line no-debugger
    const endTime = performance.now();
    
    // Debugger statements cause delays when attached
    if (endTime - startTime > 100) {
      this.reportThreat({
        id: this.generateId(),
        type: 'debugger_attachment',
        severity: 'critical',
        timestamp: Date.now(),
        source: 'health_check',
        mitigated: false,
      });
    }
  }

  /**
   * Check memory integrity
   */
  private checkMemoryIntegrity(): void {
    // Verify sensitive data hasn't been tampered with
    for (const [key, value] of this.state.sensitiveData) {
      const hash = this.hashValue(value);
      const storedHash = this.state.sensitiveData.get(`${key}_hash`);
      
      if (storedHash && hash !== storedHash) {
        this.reportThreat({
          id: this.generateId(),
          type: 'memory_tampering',
          severity: 'critical',
          timestamp: Date.now(),
          source: 'integrity_check',
          target: key,
          mitigated: false,
        });
      }
    }
  }

  /**
   * Analyze threat patterns for threshold violations
   */
  private analyzeThreatPatterns(): void {
    const now = Date.now();
    
    for (const threshold of this.thresholds) {
      const recentThreats = this.state.threatHistory.filter(
        (t) => t.type === threshold.type && 
               now - t.timestamp < threshold.timeWindowMs
      );
      
      if (recentThreats.length >= threshold.maxOccurrences) {
        this.handleThresholdViolation(threshold, recentThreats);
      }
    }
  }

  /**
   * Handle threshold violation
   */
  private handleThresholdViolation(
    threshold: ThreatThreshold,
    threats: ThreatEvent[]
  ): void {
    this.emit('thresholdViolation', {
      threshold,
      occurrences: threats.length,
      timestamp: Date.now(),
    });
    
    switch (threshold.action) {
      case 'shutdown':
        this.trigger(threats[threats.length - 1], {
          mode: threshold.severity === 'critical' ? 'immediate' : 'graceful',
          wipeMemory: true,
          notifyAdmin: true,
        });
        break;
        
      case 'throttle':
        this.emit('throttle', {
          type: threshold.type,
          duration: 60000,
        });
        break;
        
      case 'warn':
        this.emit('warning', {
          type: threshold.type,
          occurrences: threats.length,
        });
        break;
    }
  }

  /**
   * Report a threat event
   */
  public reportThreat(threat: ThreatEvent): void {
    // Add to history
    this.state.threatHistory.push(threat);
    
    // Trim history if needed
    if (this.state.threatHistory.length > this.MAX_THREAT_HISTORY) {
      this.state.threatHistory = this.state.threatHistory.slice(-this.MAX_THREAT_HISTORY);
    }
    
    this.emit('threatDetected', threat);
    
    // Check if we should trigger based on this threat
    if (this.state.armed && !this.state.triggered) {
      const threshold = this.thresholds.find((t) => t.type === threat.type);
      
      if (threshold && threat.severity === 'critical') {
        this.trigger(threat, {
          mode: 'immediate',
          wipeMemory: true,
          notifyAdmin: true,
        });
      }
    }
  }

  /**
   * Trigger the kill switch
   * 
   * This initiates the shutdown sequence based on the provided configuration.
   */
  public async trigger(threat: ThreatEvent, config: ShutdownConfig): Promise<void> {
    if (this.state.triggered) {
      this.emit('warning', { message: 'Kill switch already triggered' });
      return;
    }
    
    this.state.triggered = true;
    this.state.triggeredAt = Date.now();
    this.state.triggeredBy = threat;
    this.state.shutdownMode = config.mode;
    
    this.emit('triggered', {
      threat,
      config,
      timestamp: this.state.triggeredAt,
    });
    
    await this.shutdown(config);
  }

  /**
   * Execute shutdown procedure
   */
  public async shutdown(config: ShutdownConfig): Promise<void> {
    const startTime = Date.now();
    const timeout = config.timeout || this.DEFAULT_SHUTDOWN_TIMEOUT;
    
    this.emit('shutdownInitiated', { mode: config.mode, timestamp: startTime });
    
    try {
      switch (config.mode) {
        case 'graceful':
          await this.gracefulShutdown(config, timeout);
          break;
          
        case 'immediate':
          await this.immediateShutdown(config);
          break;
          
        case 'force':
          this.forceShutdown(config);
          break;
      }
    } catch (error) {
      this.emit('shutdownError', { error, timestamp: Date.now() });
      
      // Force shutdown if graceful fails
      if (config.mode !== 'force') {
        this.forceShutdown(config);
      }
    }
  }

  /**
   * Graceful shutdown - save state, notify, clean up
   */
  private async gracefulShutdown(
    config: ShutdownConfig,
    timeout: number
  ): Promise<void> {
    const deadline = Date.now() + timeout;
    
    // Execute shutdown handlers with timeout
    for (const handler of this.shutdownHandlers) {
      if (Date.now() >= deadline) {
        this.emit('warning', { message: 'Shutdown timeout, forcing completion' });
        break;
      }
      
      try {
        await Promise.race([
          handler(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Handler timeout')), 5000)
          ),
        ]);
      } catch (error) {
        this.emit('handlerError', { error });
      }
    }
    
    // Wipe memory if requested
    if (config.wipeMemory) {
      this.wipeMemory();
    }
    
    // Notify admin
    if (config.notifyAdmin) {
      this.notifyAdmin();
    }
    
    // Run cleanup handlers
    for (const cleanup of this.cleanupHandlers) {
      try {
        cleanup();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    this.emit('shutdownComplete', { 
      mode: 'graceful',
      duration: Date.now() - (this.state.triggeredAt || Date.now()),
    });
  }

  /**
   * Immediate shutdown - minimal cleanup
   */
  private async immediateShutdown(config: ShutdownConfig): Promise<void> {
    // Wipe memory first
    if (config.wipeMemory) {
      this.wipeMemory();
    }
    
    // Notify admin
    if (config.notifyAdmin) {
      this.notifyAdmin();
    }
    
    this.emit('shutdownComplete', { mode: 'immediate' });
  }

  /**
   * Force shutdown - no cleanup, immediate termination
   */
  private forceShutdown(config: ShutdownConfig): void {
    // Wipe memory
    if (config.wipeMemory) {
      this.wipeMemory();
    }
    
    this.emit('shutdownComplete', { mode: 'force' });
    
    // In a real implementation, this might call process.exit()
    // For safety, we just emit the event
  }

  /**
   * Wipe sensitive data from memory
   */
  private wipeMemory(): void {
    // Clear sensitive data map
    this.state.sensitiveData.clear();
    
    // Clear threat history
    this.state.threatHistory = [];
    
    this.emit('memoryWiped', { timestamp: Date.now() });
  }

  /**
   * Notify admin of security event
   */
  private notifyAdmin(): void {
    this.emit('adminNotified', {
      threat: this.state.triggeredBy,
      timestamp: Date.now(),
    });
  }

  /**
   * Register shutdown handler
   */
  public onShutdown(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler);
  }

  /**
   * Register cleanup handler
   */
  public onCleanup(handler: () => void): void {
    this.cleanupHandlers.push(handler);
  }

  /**
   * Register sensitive data for integrity monitoring
   */
  public registerSensitiveData(key: string, value: unknown): void {
    this.state.sensitiveData.set(key, value);
    this.state.sensitiveData.set(`${key}_hash`, this.hashValue(value));
  }

  /**
   * Add custom threat threshold
   */
  public addThreshold(threshold: ThreatThreshold): void {
    this.thresholds.push(threshold);
    this.emit('thresholdAdded', { threshold });
  }

  /**
   * Remove threshold
   */
  public removeThreshold(type: ThreatType): boolean {
    const index = this.thresholds.findIndex((t) => t.type === type);
    if (index !== -1) {
      this.thresholds.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get current state
   */
  public getState(): {
    armed: boolean;
    triggered: boolean;
    triggeredAt: number | null;
    threatCount: number;
    recentThreats: number;
  } {
    const fiveMinutesAgo = Date.now() - 300000;
    
    return {
      armed: this.state.armed,
      triggered: this.state.triggered,
      triggeredAt: this.state.triggeredAt,
      threatCount: this.state.threatHistory.length,
      recentThreats: this.state.threatHistory.filter(
        (t) => t.timestamp > fiveMinutesAgo
      ).length,
    };
  }

  /**
   * Get threat history
   */
  public getThreatHistory(options: {
    type?: ThreatType;
    severity?: ThreatLevel;
    limit?: number;
    since?: number;
  } = {}): ThreatEvent[] {
    let history = [...this.state.threatHistory];
    
    if (options.type) {
      history = history.filter((t) => t.type === options.type);
    }
    
    if (options.severity) {
      history = history.filter((t) => t.severity === options.severity);
    }
    
    if (options.since !== undefined) {
      const since = options.since;
      history = history.filter((t) => t.timestamp >= since);
    }
    
    if (options.limit) {
      history = history.slice(-options.limit);
    }
    
    return history;
  }

  /**
   * Reset kill switch (after investigation)
   */
  public reset(): void {
    this.state = this.initializeState();
    this.emit('reset', { timestamp: Date.now() });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `threat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Hash value for integrity checking
   */
  private hashValue(value: unknown): string {
    const str = JSON.stringify(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.disarm();
    this.state = this.initializeState();
    this.shutdownHandlers = [];
    this.cleanupHandlers = [];
    this.removeAllListeners();
  }
}

export default EmergencyKillSwitch;
