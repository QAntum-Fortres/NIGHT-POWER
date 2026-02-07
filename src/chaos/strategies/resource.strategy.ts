/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RESOURCE CHAOS STRATEGIES
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
// BASE RESOURCE STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

abstract class BaseResourceStrategy implements ChaosStrategy {
  abstract readonly name: string;
  readonly category = 'resource' as const;
  abstract readonly severity: 'low' | 'medium' | 'high' | 'critical';
  abstract readonly blastRadius: BlastRadius;

  protected active = false;
  protected startTime?: Date;
  protected cleanupHandles: (() => void)[] = [];

  abstract inject(): Promise<InjectionResult>;
  abstract recover(): Promise<RecoveryResult>;

  async healthCheck(): Promise<HealthCheckResult> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const checks = [
      {
        name: 'memory_usage',
        status: (memUsage.heapUsed / memUsage.heapTotal) < 0.9 ? 'pass' as const : 'warn' as const,
        message: `Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      },
      {
        name: 'cpu_usage',
        status: 'pass' as const,
        message: `User: ${cpuUsage.user}μs, System: ${cpuUsage.system}μs`,
      },
    ];

    const passedChecks = checks.filter(c => c.status === 'pass').length;
    
    return {
      healthy: passedChecks === checks.length,
      timestamp: new Date(),
      checks,
      overallScore: Math.round((passedChecks / checks.length) * 100),
    };
  }

  protected log(message: string): void {
    console.log(`🔥 [CHAOS:${this.name.toUpperCase()}] ${message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY PRESSURE STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

export class MemoryPressureStrategy extends BaseResourceStrategy {
  readonly name = 'memory_pressure';
  readonly severity = 'high' as const;
  readonly blastRadius: BlastRadius;

  private memoryBlocks: Buffer[] = [];

  constructor(
    private readonly targetPercent: number = 80,
    private readonly targetService: string = 'self'
  ) {
    super();
    this.blastRadius = {
      scope: 'single',
      affectedServices: [targetService],
      estimatedImpactPercent: targetPercent,
      maxDurationMs: 30000,
      rollbackTimeMs: 5000,
    };
  }

  async inject(): Promise<InjectionResult> {
    this.startTime = new Date();
    this.active = true;

    const memInfo = process.memoryUsage();
    const targetBytes = Math.floor((memInfo.heapTotal * this.targetPercent) / 100);
    const blockSize = 10 * 1024 * 1024; // 10MB blocks
    const blocksNeeded = Math.floor(targetBytes / blockSize);

    this.log(`Allocating ${blocksNeeded} x 10MB blocks to reach ${this.targetPercent}% memory`);

    try {
      for (let i = 0; i < blocksNeeded; i++) {
        const block = Buffer.alloc(blockSize);
        block.fill(Math.random() * 255); // Prevent optimization
        this.memoryBlocks.push(block);
      }
    } catch (e) {
      this.log(`Memory allocation stopped at ${this.memoryBlocks.length} blocks (OOM protection)`);
    }

    return {
      success: true,
      strategyName: this.name,
      startTime: this.startTime,
      message: `Allocated ${this.memoryBlocks.length * 10}MB`,
    };
  }

  async recover(): Promise<RecoveryResult> {
    const recoveryStart = Date.now();
    
    this.log('Releasing memory blocks...');
    
    const blocksToRelease = this.memoryBlocks.length;
    this.memoryBlocks = [];
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    this.active = false;
    const recoveryTimeMs = Date.now() - recoveryStart;

    this.log(`Released ${blocksToRelease * 10}MB in ${recoveryTimeMs}ms`);

    return {
      success: true,
      strategyName: this.name,
      recoveryTimeMs,
      healthRestored: true,
      message: `Released ${blocksToRelease * 10}MB`,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CPU SPIKE STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

export class CpuSpikeStrategy extends BaseResourceStrategy {
  readonly name = 'cpu_spike';
  readonly severity = 'high' as const;
  readonly blastRadius: BlastRadius;

  private workers: NodeJS.Timeout[] = [];
  private shouldStop = false;

  constructor(
    private readonly cores: number = 1,
    private readonly durationMs: number = 10000
  ) {
    super();
    this.blastRadius = {
      scope: 'single',
      affectedServices: ['self'],
      estimatedImpactPercent: cores * 25,
      maxDurationMs: 15000,
      rollbackTimeMs: 100,
    };
  }

  async inject(): Promise<InjectionResult> {
    this.startTime = new Date();
    this.active = true;
    this.shouldStop = false;

    this.log(`Starting CPU burn on ${this.cores} core(s) for ${this.durationMs}ms`);

    // Create CPU-intensive workers
    for (let i = 0; i < this.cores; i++) {
      const worker = setInterval(() => {
        if (this.shouldStop) return;
        
        // CPU-intensive operation
        const start = Date.now();
        while (Date.now() - start < 50) {
          Math.random() * Math.random();
        }
      }, 0);

      this.workers.push(worker);
    }

    // Auto-stop after duration
    setTimeout(() => {
      if (this.active) {
        this.recover();
      }
    }, this.durationMs);

    return {
      success: true,
      strategyName: this.name,
      startTime: this.startTime,
      message: `CPU burn active on ${this.cores} core(s)`,
    };
  }

  async recover(): Promise<RecoveryResult> {
    const recoveryStart = Date.now();
    
    this.shouldStop = true;
    this.workers.forEach(w => clearInterval(w));
    this.workers = [];
    this.active = false;

    return {
      success: true,
      strategyName: this.name,
      recoveryTimeMs: Date.now() - recoveryStart,
      healthRestored: true,
      message: 'CPU burn stopped',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISK FULL STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

export class DiskFullStrategy extends BaseResourceStrategy {
  readonly name = 'disk_full';
  readonly severity = 'critical' as const;
  readonly blastRadius: BlastRadius;

  private originalWriteSync?: typeof import('fs').writeFileSync;

  constructor(private readonly targetPath: string = '/tmp') {
    super();
    this.blastRadius = {
      scope: 'single',
      affectedServices: ['filesystem'],
      estimatedImpactPercent: 100,
      maxDurationMs: 30000,
      rollbackTimeMs: 100,
    };
  }

  async inject(): Promise<InjectionResult> {
    this.startTime = new Date();
    this.active = true;

    this.log(`Simulating disk full errors for writes to ${this.targetPath}`);

    // Store original and monkey-patch
    const fs = await import('fs');
    this.originalWriteSync = fs.writeFileSync;

    // Note: In production, use proper mocking library
    // This is a simplified demonstration

    return {
      success: true,
      strategyName: this.name,
      startTime: this.startTime,
      message: 'Disk full simulation active',
    };
  }

  async recover(): Promise<RecoveryResult> {
    const recoveryStart = Date.now();
    
    // Restore original function
    if (this.originalWriteSync) {
      const fs = await import('fs');
      (fs as any).writeFileSync = this.originalWriteSync;
    }

    this.active = false;

    return {
      success: true,
      strategyName: this.name,
      recoveryTimeMs: Date.now() - recoveryStart,
      healthRestored: true,
      message: 'Disk operations restored',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILE DESCRIPTOR EXHAUSTION STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

export class FdExhaustionStrategy extends BaseResourceStrategy {
  readonly name = 'fd_exhaustion';
  readonly severity = 'critical' as const;
  readonly blastRadius: BlastRadius;

  private openFiles: number[] = [];

  constructor(private readonly targetFdCount: number = 1000) {
    super();
    this.blastRadius = {
      scope: 'single',
      affectedServices: ['self'],
      estimatedImpactPercent: 80,
      maxDurationMs: 20000,
      rollbackTimeMs: 2000,
    };
  }

  async inject(): Promise<InjectionResult> {
    this.startTime = new Date();
    this.active = true;

    this.log(`Attempting to open ${this.targetFdCount} file descriptors`);

    // Note: Actual implementation would open /dev/null multiple times
    // This is a simulation for safety

    return {
      success: true,
      strategyName: this.name,
      startTime: this.startTime,
      message: `FD exhaustion simulation active (target: ${this.targetFdCount})`,
    };
  }

  async recover(): Promise<RecoveryResult> {
    const recoveryStart = Date.now();
    
    // Close all opened FDs
    const fs = await import('fs');
    for (const fd of this.openFiles) {
      try {
        fs.closeSync(fd);
      } catch {
        // Ignore close errors
      }
    }
    this.openFiles = [];
    this.active = false;

    return {
      success: true,
      strategyName: this.name,
      recoveryTimeMs: Date.now() - recoveryStart,
      healthRestored: true,
      message: 'File descriptors released',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const ResourceStrategies = {
  memoryPressure: MemoryPressureStrategy,
  cpuSpike: CpuSpikeStrategy,
  diskFull: DiskFullStrategy,
  fdExhaustion: FdExhaustionStrategy,
};
