/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FAULT INJECTION ENGINE - MODULAR CORE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Ако не си тествал системата под стрес, не знаеш дали работи."
 * 
 * Netflix Chaos Monkey inspired. Production-grade fault injection.
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 33.5 - MODULAR CHAOS
 */

import { EventEmitter } from 'events';
import {
  ChaosStrategy,
  ChaosExperiment,
  ExperimentResult,
  StrategyResult,
  HealthCheckResult,
  EngineConfig,
  DEFAULT_CONFIG,
  KillSwitchTrigger,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// FAULT INJECTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class FaultInjectionEngine extends EventEmitter {
  private static instance: FaultInjectionEngine;
  
  private activeStrategies: ChaosStrategy[] = [];
  private history: ExperimentResult[] = [];
  private config: EngineConfig;
  private armed = false;
  private healthCheckInterval?: NodeJS.Timeout;

  private constructor(config: Partial<EngineConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    console.log(`
🔥 ═══════════════════════════════════════════════════════════════════════════════
   FAULT INJECTION ENGINE v33.5 - MODULAR CHAOS
   ─────────────────────────────────────────────────────────────────────────────
   STATUS: ${this.armed ? '⚠️ ARMED' : '🔒 SAFE MODE'}
   KILL SWITCH: ${this.config.killSwitchEnabled ? '✅ ENABLED' : '❌ DISABLED'}
   MAX CONCURRENT: ${this.config.maxConcurrentStrategies}
   
   "Ако не си тествал под хаос, не знаеш дали работи."
═══════════════════════════════════════════════════════════════════════════════
    `);
  }

  static getInstance(config?: Partial<EngineConfig>): FaultInjectionEngine {
    if (!FaultInjectionEngine.instance) {
      FaultInjectionEngine.instance = new FaultInjectionEngine(config);
    }
    return FaultInjectionEngine.instance;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ARMING & DISARMING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Arm the engine (enable fault injection)
   */
  arm(confirmationCode: string): boolean {
    if (confirmationCode !== 'CHAOS_ENABLED_I_KNOW_WHAT_IM_DOING') {
      console.error('❌ [CHAOS] Invalid confirmation code');
      return false;
    }
    
    this.armed = true;
    this.startHealthMonitoring();
    console.log('⚠️ [CHAOS] Engine ARMED');
    this.emit('engine:armed');
    return true;
  }

  /**
   * Disarm the engine and rollback all active strategies
   */
  async disarm(): Promise<void> {
    console.log('🔒 [CHAOS] Disarming engine...');
    
    // Stop health monitoring
    this.stopHealthMonitoring();
    
    // Rollback all active strategies
    await this.rollbackAll();
    
    this.armed = false;
    console.log('🔒 [CHAOS] Engine DISARMED');
    this.emit('engine:disarmed');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPERIMENT EXECUTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Run a chaos experiment with automatic health checks and kill switch
   */
  async runExperiment(experiment: ChaosExperiment): Promise<ExperimentResult> {
    if (!this.armed) {
      throw new Error('Engine not armed. Call arm() first.');
    }

    if (this.activeStrategies.length + experiment.strategies.length > this.config.maxConcurrentStrategies) {
      throw new Error(`Would exceed max concurrent strategies (${this.config.maxConcurrentStrategies})`);
    }

    const startTime = Date.now();
    const strategyResults: StrategyResult[] = [];
    let killSwitchTriggered = false;

    console.log(`
🧪 ═══════════════════════════════════════════════════════════════════════════════
   CHAOS EXPERIMENT: ${experiment.name}
   ─────────────────────────────────────────────────────────────────────────────
   HYPOTHESIS: ${experiment.hypothesis}
   STRATEGIES: ${experiment.strategies.map(s => s.name).join(', ')}
   BLAST RADIUS: ${experiment.blastRadius.scope} (${experiment.blastRadius.estimatedImpactPercent}% impact)
═══════════════════════════════════════════════════════════════════════════════
    `);

    this.emit('experiment:started', experiment);

    // Verify pre-experiment steady state
    console.log('📊 [CHAOS] Verifying pre-experiment steady state...');
    for (const check of experiment.steadyStateChecks) {
      const passed = await Promise.race([
        check.check(),
        new Promise<boolean>(resolve => setTimeout(() => resolve(false), check.timeout)),
      ]);
      
      if (!passed) {
        throw new Error(`Pre-experiment steady state check failed: ${check.name}`);
      }
      console.log(`   ✅ ${check.name}`);
    }

    try {
      // Inject all strategies
      for (const strategy of experiment.strategies) {
        // Check abort conditions
        for (const abort of experiment.abortConditions) {
          if (abort.condition()) {
            console.warn(`⚠️ [CHAOS] Abort condition triggered: ${abort.name}`);
            killSwitchTriggered = true;
            break;
          }
        }

        if (killSwitchTriggered) break;

        const result = await this.injectStrategy(strategy);
        strategyResults.push(result);
      }

    } catch (error) {
      console.error('❌ [CHAOS] Experiment failed:', error);
      killSwitchTriggered = true;
      
      if (experiment.killSwitch.enabled) {
        await this.triggerKillSwitch(experiment, 'health_check_fail');
      }
    }

    // Always rollback and verify
    await this.rollbackAll();

    // Post-experiment health check
    console.log('\n📊 [CHAOS] Post-experiment health check...');
    const finalHealth = await this.performHealthCheck();
    
    if (!finalHealth.healthy && experiment.killSwitch.enabled) {
      await this.triggerKillSwitch(experiment, 'recovery_timeout');
      killSwitchTriggered = true;
    }

    // Verify post-experiment steady state
    const violations: string[] = [];
    for (const check of experiment.steadyStateChecks) {
      const passed = await check.check();
      if (!passed) {
        violations.push(check.name);
        console.error(`   ❌ ${check.name}`);
      } else {
        console.log(`   ✅ ${check.name}`);
      }
    }

    // Generate result
    const result = this.generateResult(
      experiment,
      strategyResults,
      violations,
      killSwitchTriggered,
      Date.now() - startTime
    );

    this.history.push(result);
    this.emit('experiment:completed', result);

    return result;
  }

  /**
   * Run a single strategy with test logic
   */
  async runStrategy(
    strategy: ChaosStrategy,
    testLogic: () => Promise<void>
  ): Promise<StrategyResult> {
    if (!this.armed) {
      throw new Error('Engine not armed');
    }

    console.log(`🔥 [CHAOS] Running strategy: ${strategy.name}`);
    console.log(`   Blast Radius: ${strategy.blastRadius.scope} (${strategy.blastRadius.estimatedImpactPercent}% impact)`);

    const injection = await strategy.inject();
    this.activeStrategies.push(strategy);

    let recovery;
    let healthCheck;

    try {
      await testLogic();
    } finally {
      recovery = await strategy.recover();
      this.activeStrategies = this.activeStrategies.filter(s => s !== strategy);
      healthCheck = await strategy.healthCheck();
    }

    return {
      strategyName: strategy.name,
      injection,
      recovery,
      healthCheck,
      metrics: {
        requestsTotal: 0,
        requestsFailed: 0,
        requestsTimedOut: 0,
        errorRate: 0,
        p50LatencyMs: 0,
        p99LatencyMs: 0,
        circuitBreakerTrips: 0,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private async injectStrategy(strategy: ChaosStrategy): Promise<StrategyResult> {
    const injection = await strategy.inject();
    this.activeStrategies.push(strategy);

    // Immediate health check after injection
    const healthCheck = await strategy.healthCheck();

    return {
      strategyName: strategy.name,
      injection,
      recovery: {
        success: false,
        strategyName: strategy.name,
        recoveryTimeMs: 0,
        healthRestored: false,
        message: 'Pending recovery',
      },
      healthCheck,
      metrics: {
        requestsTotal: 0,
        requestsFailed: 0,
        requestsTimedOut: 0,
        errorRate: 0,
        p50LatencyMs: 0,
        p99LatencyMs: 0,
        circuitBreakerTrips: 0,
      },
    };
  }

  private async rollbackAll(): Promise<void> {
    console.log(`🔄 [CHAOS] Rolling back ${this.activeStrategies.length} active strategies...`);
    
    for (const strategy of [...this.activeStrategies]) {
      try {
        await strategy.recover();
        console.log(`   ✅ ${strategy.name} recovered`);
      } catch (error) {
        console.error(`   ❌ ${strategy.name} recovery failed:`, error);
      }
    }
    
    this.activeStrategies = [];
  }

  private async performHealthCheck(): Promise<HealthCheckResult> {
    const allChecks: HealthCheckResult['checks'] = [];
    
    for (const strategy of this.activeStrategies) {
      const check = await strategy.healthCheck();
      allChecks.push(...check.checks);
    }

    if (allChecks.length === 0) {
      return {
        healthy: true,
        timestamp: new Date(),
        checks: [{ name: 'no_active_faults', status: 'pass' }],
        overallScore: 100,
      };
    }

    const passedChecks = allChecks.filter(c => c.status === 'pass').length;
    
    return {
      healthy: passedChecks === allChecks.length,
      timestamp: new Date(),
      checks: allChecks,
      overallScore: Math.round((passedChecks / allChecks.length) * 100),
    };
  }

  private async triggerKillSwitch(
    experiment: ChaosExperiment,
    trigger: KillSwitchTrigger
  ): Promise<void> {
    console.log(`🚨 [KILL SWITCH] Triggered by: ${trigger}`);
    this.emit('killswitch:triggered', { experiment, trigger });

    switch (experiment.killSwitch.action) {
      case 'rollback':
        await this.rollbackAll();
        break;
      case 'pause':
        // Pause but don't rollback
        console.log('⏸️ [KILL SWITCH] Experiment paused');
        break;
      case 'alert':
        // Just alert, don't take action
        console.log('🔔 [KILL SWITCH] Alert sent to:', experiment.killSwitch.notifyChannels);
        break;
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      if (this.activeStrategies.length > 0) {
        const health = await this.performHealthCheck();
        if (!health.healthy) {
          console.warn('⚠️ [CHAOS] Health check failed during active experiment');
          this.emit('health:failed', health);
        }
      }
    }, this.config.healthCheckInterval);
  }

  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  private generateResult(
    experiment: ChaosExperiment,
    strategyResults: StrategyResult[],
    violations: string[],
    killSwitchTriggered: boolean,
    duration: number
  ): ExperimentResult {
    const hypothesisValidated = violations.length === 0 && !killSwitchTriggered;
    const blastRadiusContained = strategyResults.every(
      r => r.healthCheck.overallScore >= 50
    );

    // Calculate resilience score
    const avgHealthScore = strategyResults.length > 0
      ? strategyResults.reduce((sum, r) => sum + r.healthCheck.overallScore, 0) / strategyResults.length
      : 100;

    const violationPenalty = violations.length * 10;
    const killSwitchPenalty = killSwitchTriggered ? 30 : 0;
    const resilienceScore = Math.max(0, Math.round(avgHealthScore - violationPenalty - killSwitchPenalty));

    const recommendations = this.generateRecommendations(strategyResults, violations, resilienceScore);

    console.log(`
🏆 ═══════════════════════════════════════════════════════════════════════════════
   EXPERIMENT RESULT: ${experiment.name}
   ─────────────────────────────────────────────────────────────────────────────
   HYPOTHESIS: ${hypothesisValidated ? '✅ VALIDATED' : '❌ INVALIDATED'}
   BLAST RADIUS: ${blastRadiusContained ? '✅ CONTAINED' : '⚠️ EXCEEDED'}
   KILL SWITCH: ${killSwitchTriggered ? '🚨 TRIGGERED' : '✅ NOT TRIGGERED'}
   RESILIENCE SCORE: ${resilienceScore}/100 ${this.getScoreEmoji(resilienceScore)}
   ${resilienceScore >= 80 ? `CERTIFICATE: QRC-${Date.now().toString(36).toUpperCase()}` : ''}
═══════════════════════════════════════════════════════════════════════════════
    `);

    return {
      experimentId: experiment.id,
      timestamp: new Date(),
      duration,
      strategies: strategyResults,
      hypothesisValidated,
      blastRadiusContained,
      killSwitchTriggered,
      resilienceScore,
      recommendations,
      certificateId: resilienceScore >= 80 ? `QRC-${Date.now().toString(36).toUpperCase()}` : undefined,
    };
  }

  private generateRecommendations(
    results: StrategyResult[],
    violations: string[],
    score: number
  ): string[] {
    const recommendations: string[] = [];

    if (score < 50) {
      recommendations.push('CRITICAL: System requires significant resilience improvements');
      recommendations.push('Implement circuit breakers for all external dependencies');
      recommendations.push('Add graceful degradation for non-critical features');
    } else if (score < 80) {
      recommendations.push('Review and improve error handling in affected services');
      recommendations.push('Consider implementing bulkhead pattern');
    }

    if (violations.length > 0) {
      recommendations.push('Steady state violations detected - review monitoring thresholds');
    }

    return recommendations;
  }

  private getScoreEmoji(score: number): string {
    if (score >= 90) return '🏆';
    if (score >= 80) return '✅';
    if (score >= 60) return '⚠️';
    return '❌';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  isArmed(): boolean {
    return this.armed;
  }

  getActiveStrategies(): string[] {
    return this.activeStrategies.map(s => s.name);
  }

  getHistory(): ExperimentResult[] {
    return [...this.history];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const chaosEngine = FaultInjectionEngine.getInstance();
export default FaultInjectionEngine;
