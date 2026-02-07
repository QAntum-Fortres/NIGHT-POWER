/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * APPLICATION CHAOS STRATEGIES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 33.5 - MODULAR CHAOS
 */

import {
  ChaosStrategy,
  BlastRadius,
  InjectionResult,
  RecoveryResult,
  HealthCheckResult,
} from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// BASE APPLICATION STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

abstract class BaseApplicationStrategy implements ChaosStrategy {
  abstract readonly name: string;
  readonly category = 'application' as const;
  abstract readonly severity: 'low' | 'medium' | 'high' | 'critical';
  abstract readonly blastRadius: BlastRadius;

  protected active = false;
  protected startTime?: Date;

  abstract inject(): Promise<InjectionResult>;
  abstract recover(): Promise<RecoveryResult>;

  async healthCheck(): Promise<HealthCheckResult> {
    return {
      healthy: !this.active,
      timestamp: new Date(),
      checks: [
        {
          name: 'application_state',
          status: this.active ? 'warn' : 'pass',
          message: this.active ? 'Chaos injection active' : 'Normal operation',
        },
      ],
      overallScore: this.active ? 50 : 100,
    };
  }

  protected log(message: string): void {
    console.log(`🔥 [CHAOS:${this.name.toUpperCase()}] ${message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXCEPTION INJECTION STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

export class ExceptionInjectionStrategy extends BaseApplicationStrategy {
  readonly name = 'exception_injection';
  readonly severity = 'medium' as const;
  readonly blastRadius: BlastRadius;

  private originalFunctions = new Map<string, Function>();
  private errorRate: number;

  constructor(
    private readonly targetFunctions: string[],
    errorRatePercent: number = 10
  ) {
    super();
    this.errorRate = errorRatePercent / 100;
    this.blastRadius = {
      scope: 'service',
      affectedServices: targetFunctions,
      estimatedImpactPercent: errorRatePercent,
      maxDurationMs: 60000,
      rollbackTimeMs: 100,
    };
  }

  async inject(): Promise<InjectionResult> {
    this.startTime = new Date();
    this.active = true;

    this.log(`Injecting exceptions at ${this.errorRate * 100}% rate`);
    this.log(`Targets: ${this.targetFunctions.join(', ')}`);

    // In real implementation, would patch specific functions
    // Using dependency injection or module mocking

    return {
      success: true,
      strategyName: this.name,
      startTime: this.startTime,
      message: `Exception injection active at ${this.errorRate * 100}% rate`,
    };
  }

  async recover(): Promise<RecoveryResult> {
    const recoveryStart = Date.now();
    
    // Restore original functions
    this.originalFunctions.clear();
    this.active = false;

    return {
      success: true,
      strategyName: this.name,
      recoveryTimeMs: Date.now() - recoveryStart,
      healthRestored: true,
      message: 'Original functions restored',
    };
  }

  /**
   * Check if should throw based on error rate
   */
  shouldThrow(): boolean {
    return this.active && Math.random() < this.errorRate;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLOW RESPONSE STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

export class SlowResponseStrategy extends BaseApplicationStrategy {
  readonly name = 'slow_response';
  readonly severity = 'medium' as const;
  readonly blastRadius: BlastRadius;

  constructor(
    private readonly delayMs: number,
    private readonly affectedEndpoints: string[]
  ) {
    super();
    this.blastRadius = {
      scope: 'service',
      affectedServices: affectedEndpoints,
      estimatedImpactPercent: 40,
      maxDurationMs: 120000,
      rollbackTimeMs: 100,
    };
  }

  async inject(): Promise<InjectionResult> {
    this.startTime = new Date();
    this.active = true;

    this.log(`Injecting ${this.delayMs}ms delay to responses`);

    return {
      success: true,
      strategyName: this.name,
      startTime: this.startTime,
      message: `Responses delayed by ${this.delayMs}ms`,
      affectedEndpoints: this.affectedEndpoints,
    };
  }

  async recover(): Promise<RecoveryResult> {
    const recoveryStart = Date.now();
    this.active = false;

    return {
      success: true,
      strategyName: this.name,
      recoveryTimeMs: Date.now() - recoveryStart,
      healthRestored: true,
      message: 'Response delays removed',
    };
  }

  /**
   * Apply delay if active
   */
  async maybeDelay(): Promise<void> {
    if (this.active) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MALFORMED RESPONSE STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

export class MalformedResponseStrategy extends BaseApplicationStrategy {
  readonly name = 'malformed_response';
  readonly severity = 'high' as const;
  readonly blastRadius: BlastRadius;

  private corruptionType: 'json' | 'truncate' | 'garbage' | 'wrong_type';

  constructor(
    corruptionType: 'json' | 'truncate' | 'garbage' | 'wrong_type' = 'json',
    private readonly affectedEndpoints: string[]
  ) {
    super();
    this.corruptionType = corruptionType;
    this.blastRadius = {
      scope: 'service',
      affectedServices: affectedEndpoints,
      estimatedImpactPercent: 60,
      maxDurationMs: 30000,
      rollbackTimeMs: 100,
    };
  }

  async inject(): Promise<InjectionResult> {
    this.startTime = new Date();
    this.active = true;

    this.log(`Injecting ${this.corruptionType} corruption`);

    return {
      success: true,
      strategyName: this.name,
      startTime: this.startTime,
      message: `Response corruption (${this.corruptionType}) active`,
      affectedEndpoints: this.affectedEndpoints,
    };
  }

  async recover(): Promise<RecoveryResult> {
    const recoveryStart = Date.now();
    this.active = false;

    return {
      success: true,
      strategyName: this.name,
      recoveryTimeMs: Date.now() - recoveryStart,
      healthRestored: true,
      message: 'Response corruption stopped',
    };
  }

  /**
   * Corrupt response data
   */
  corrupt<T>(data: T): T | string {
    if (!this.active) return data;

    switch (this.corruptionType) {
      case 'json':
        return `{invalid json ${JSON.stringify(data).substring(0, 50)}`;
      case 'truncate':
        return JSON.stringify(data).substring(0, 10);
      case 'garbage':
        return '☠️💀🔥' + Math.random().toString(36);
      case 'wrong_type':
        return Array.isArray(data) ? ({} as T) : ([] as unknown as T);
      default:
        return data;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY LEAK SIMULATION STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

export class MemoryLeakStrategy extends BaseApplicationStrategy {
  readonly name = 'memory_leak';
  readonly severity = 'high' as const;
  readonly blastRadius: BlastRadius;

  private leakIntervalId?: NodeJS.Timeout;
  private leakedData: any[] = [];

  constructor(
    private readonly leakRateMbPerMinute: number = 10,
    private readonly maxLeakMb: number = 500
  ) {
    super();
    this.blastRadius = {
      scope: 'single',
      affectedServices: ['self'],
      estimatedImpactPercent: 30,
      maxDurationMs: 300000,
      rollbackTimeMs: 10000,
    };
  }

  async inject(): Promise<InjectionResult> {
    this.startTime = new Date();
    this.active = true;

    const bytesPerSecond = (this.leakRateMbPerMinute * 1024 * 1024) / 60;
    const chunkSize = Math.floor(bytesPerSecond);

    this.log(`Starting memory leak: ${this.leakRateMbPerMinute}MB/min`);

    this.leakIntervalId = setInterval(() => {
      const currentLeakMb = (this.leakedData.length * chunkSize) / 1024 / 1024;
      
      if (currentLeakMb >= this.maxLeakMb) {
        this.log(`Max leak reached (${this.maxLeakMb}MB), stopping`);
        this.recover();
        return;
      }

      // Create unreferenced data that won't be GC'd
      const leak = Buffer.alloc(chunkSize);
      leak.fill(Math.random() * 255);
      this.leakedData.push(leak);
    }, 1000);

    return {
      success: true,
      strategyName: this.name,
      startTime: this.startTime,
      message: `Memory leak simulation started: ${this.leakRateMbPerMinute}MB/min`,
    };
  }

  async recover(): Promise<RecoveryResult> {
    const recoveryStart = Date.now();
    
    if (this.leakIntervalId) {
      clearInterval(this.leakIntervalId);
    }

    const leakedMb = this.leakedData.reduce((sum, buf) => sum + buf.length, 0) / 1024 / 1024;
    this.log(`Recovering ${leakedMb.toFixed(2)}MB of leaked memory`);

    this.leakedData = [];
    
    if (global.gc) {
      global.gc();
    }

    this.active = false;

    return {
      success: true,
      strategyName: this.name,
      recoveryTimeMs: Date.now() - recoveryStart,
      healthRestored: true,
      message: `Released ${leakedMb.toFixed(2)}MB`,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEADLOCK STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

export class DeadlockStrategy extends BaseApplicationStrategy {
  readonly name = 'deadlock';
  readonly severity = 'critical' as const;
  readonly blastRadius: BlastRadius;

  private locks = new Map<string, Promise<void>>();
  private releaseCallbacks: (() => void)[] = [];

  constructor(private readonly resourceNames: string[]) {
    super();
    this.blastRadius = {
      scope: 'service',
      affectedServices: resourceNames,
      estimatedImpactPercent: 100,
      maxDurationMs: 10000,
      rollbackTimeMs: 100,
    };
  }

  async inject(): Promise<InjectionResult> {
    this.startTime = new Date();
    this.active = true;

    this.log(`Creating deadlock scenario with resources: ${this.resourceNames.join(', ')}`);

    // Simulate deadlock by creating circular waiting
    for (const resource of this.resourceNames) {
      let release: () => void;
      const lockPromise = new Promise<void>(resolve => {
        release = resolve;
      });
      this.releaseCallbacks.push(release!);
      this.locks.set(resource, lockPromise);
    }

    return {
      success: true,
      strategyName: this.name,
      startTime: this.startTime,
      message: `Deadlock simulation active on ${this.resourceNames.length} resources`,
    };
  }

  async recover(): Promise<RecoveryResult> {
    const recoveryStart = Date.now();
    
    // Release all locks
    this.releaseCallbacks.forEach(release => release());
    this.releaseCallbacks = [];
    this.locks.clear();
    this.active = false;

    return {
      success: true,
      strategyName: this.name,
      recoveryTimeMs: Date.now() - recoveryStart,
      healthRestored: true,
      message: 'Deadlock resolved, all resources released',
    };
  }

  /**
   * Try to acquire a lock (will hang if deadlock active)
   */
  async acquireLock(resource: string): Promise<void> {
    const lock = this.locks.get(resource);
    if (lock) {
      await lock;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const ApplicationStrategies = {
  exceptionInjection: ExceptionInjectionStrategy,
  slowResponse: SlowResponseStrategy,
  malformedResponse: MalformedResponseStrategy,
  memoryLeak: MemoryLeakStrategy,
  deadlock: DeadlockStrategy,
};
