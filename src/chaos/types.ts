/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHAOS ENGINEERING - TYPE DEFINITIONS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 33.5 - MODULAR CHAOS
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CORE INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export type FaultCategory = 'network' | 'resource' | 'application' | 'infrastructure' | 'data';
export type FaultSeverity = 'low' | 'medium' | 'high' | 'critical';
export type InjectionMode = 'immediate' | 'scheduled' | 'probabilistic' | 'conditional';

/**
 * Base interface for all chaos strategies
 */
export interface ChaosStrategy {
  readonly name: string;
  readonly category: FaultCategory;
  readonly severity: FaultSeverity;
  readonly blastRadius: BlastRadius;
  
  inject(): Promise<InjectionResult>;
  recover(): Promise<RecoveryResult>;
  healthCheck(): Promise<HealthCheckResult>;
}

/**
 * Blast Radius - defines the scope of chaos impact
 */
export interface BlastRadius {
  scope: 'single' | 'service' | 'zone' | 'region' | 'global';
  affectedServices: string[];
  estimatedImpactPercent: number;
  maxDurationMs: number;
  rollbackTimeMs: number;
}

/**
 * Result of fault injection
 */
export interface InjectionResult {
  success: boolean;
  strategyName: string;
  startTime: Date;
  message: string;
  affectedEndpoints?: string[];
}

/**
 * Result of recovery operation
 */
export interface RecoveryResult {
  success: boolean;
  strategyName: string;
  recoveryTimeMs: number;
  healthRestored: boolean;
  message: string;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  healthy: boolean;
  timestamp: Date;
  checks: HealthCheckItem[];
  overallScore: number; // 0-100
}

export interface HealthCheckItem {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  responseTimeMs?: number;
  message?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPERIMENT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ChaosExperiment {
  id: string;
  name: string;
  hypothesis: string;
  strategies: ChaosStrategy[];
  blastRadius: BlastRadius;
  steadyStateChecks: SteadyStateCheck[];
  abortConditions: AbortCondition[];
  killSwitch: KillSwitch;
}

export interface SteadyStateCheck {
  name: string;
  check: () => Promise<boolean>;
  description: string;
  timeout: number;
}

export interface AbortCondition {
  name: string;
  condition: () => boolean;
  description: string;
}

export interface KillSwitch {
  enabled: boolean;
  triggerOn: KillSwitchTrigger[];
  action: 'rollback' | 'pause' | 'alert';
  notifyChannels: string[];
}

export type KillSwitchTrigger = 
  | 'health_check_fail'
  | 'recovery_timeout'
  | 'error_rate_threshold'
  | 'latency_threshold'
  | 'manual';

// ═══════════════════════════════════════════════════════════════════════════════
// METRICS & REPORTING
// ═══════════════════════════════════════════════════════════════════════════════

export interface ExperimentResult {
  experimentId: string;
  timestamp: Date;
  duration: number;
  strategies: StrategyResult[];
  hypothesisValidated: boolean;
  blastRadiusContained: boolean;
  killSwitchTriggered: boolean;
  resilienceScore: number;
  recommendations: string[];
  certificateId?: string;
}

export interface StrategyResult {
  strategyName: string;
  injection: InjectionResult;
  recovery: RecoveryResult;
  healthCheck: HealthCheckResult;
  metrics: StrategyMetrics;
}

export interface StrategyMetrics {
  requestsTotal: number;
  requestsFailed: number;
  requestsTimedOut: number;
  errorRate: number;
  p50LatencyMs: number;
  p99LatencyMs: number;
  circuitBreakerTrips: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

export interface EngineConfig {
  maxConcurrentStrategies: number;
  globalTimeout: number;
  healthCheckInterval: number;
  killSwitchEnabled: boolean;
  safeMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const DEFAULT_CONFIG: EngineConfig = {
  maxConcurrentStrategies: 3,
  globalTimeout: 300000, // 5 minutes
  healthCheckInterval: 5000, // 5 seconds
  killSwitchEnabled: true,
  safeMode: true,
  logLevel: 'info',
};
