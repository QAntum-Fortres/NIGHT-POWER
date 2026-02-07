# 💥 Chaos Engineering Layer

> **Fault injection and resilience testing with mandatory Kill Switch**

## Overview

The Chaos layer provides controlled fault injection for testing system resilience. Every experiment requires a Kill Switch and defined Blast Radius.

## Modules

| Module | Lines | Description |
|--------|-------|-------------|
| [engine.ts](./engine.ts) | ~400 | Modular chaos engine core |
| [types.ts](./types.ts) | ~180 | Core types, BlastRadius, KillSwitch |
| [strategies/](./strategies/) | - | 19 fault injection strategies |

## Strategies (19 Total)

### Network (5)
- `NetworkLatencyStrategy` - Add latency to requests
- `PacketLossStrategy` - Simulate packet loss
- `DnsFailureStrategy` - DNS resolution failures
- `ConnectionResetStrategy` - TCP connection resets
- `BandwidthThrottleStrategy` - Limit bandwidth

### Resource (4)
- `MemoryPressureStrategy` - Memory exhaustion
- `CpuSpikeStrategy` - CPU saturation
- `DiskFullStrategy` - Disk space exhaustion
- `FdExhaustionStrategy` - File descriptor limits

### Application (5)
- `ExceptionInjectionStrategy` - Random exceptions
- `SlowResponseStrategy` - Delayed responses
- `MalformedResponseStrategy` - Invalid responses
- `MemoryLeakStrategy` - Gradual memory leak
- `DeadlockStrategy` - Thread deadlocks

### Infrastructure (5)
- `NodeCrashStrategy` - Node failures
- `ZoneFailureStrategy` - Availability zone outage
- `DependencyTimeoutStrategy` - External service timeout
- `DatabaseFailoverStrategy` - Database failover
- `CacheInvalidationStrategy` - Cache invalidation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   CHAOS ENGINE                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────┐                                      │
│   │   KILL SWITCH   │◀──── MANDATORY for ALL experiments   │
│   │                 │                                       │
│   │ Triggers:       │                                       │
│   │ • health_check_fail                                    │
│   │ • timeout_exceeded                                     │
│   │ • error_rate > threshold                               │
│   └────────┬────────┘                                       │
│            │                                                │
│            ▼                                                │
│   ┌─────────────────┐    ┌─────────────────┐               │
│   │  BLAST RADIUS   │───▶│    STRATEGY     │              │
│   │                 │    │                 │               │
│   │ scope: 'single' │    │  inject()       │               │
│   │ impact: < 5%    │    │  recover()      │               │
│   │ duration: 60s   │    │  healthCheck()  │               │
│   │ rollback: 5s    │    │                 │               │
│   └─────────────────┘    └─────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Experiment

```typescript
import { FaultInjectionEngine } from './chaos/engine';
import { NetworkLatencyStrategy } from './chaos/strategies';

const engine = new FaultInjectionEngine();

// Arm the engine (REQUIRED)
engine.arm();

// Run experiment with automatic health checks
const result = await engine.runExperiment({
  name: 'api-latency-test',
  strategy: new NetworkLatencyStrategy({ latencyMs: 500 }),
  duration: 30000,
  blastRadius: {
    scope: 'single-service',
    affectedServices: ['api-gateway'],
    estimatedImpactPercent: 5,
    maxDurationMs: 60000,
    rollbackTimeMs: 5000
  }
});

// Always disarm after
engine.disarm();
```

### Kill Switch Configuration

```typescript
const engine = new FaultInjectionEngine({
  killSwitch: {
    enabled: true,
    triggers: ['health_check_fail', 'timeout_exceeded', 'error_rate_threshold'],
    action: 'rollback',  // or 'pause', 'alert'
    errorRateThreshold: 0.1,
    healthCheckInterval: 5000
  }
});
```

## ⚠️ CRITICAL RULES

1. **Kill Switch is MANDATORY** - No experiment runs without it
2. **Blast Radius REQUIRED** - Define scope before injection
3. **Health Checks AFTER** - Every experiment needs post-check
4. **Production Limit** - `estimatedImpactPercent > 5%` blocks in prod

## Blast Radius Definition

```typescript
interface BlastRadius {
  scope: 'single-service' | 'service-group' | 'datacenter' | 'global';
  affectedServices: string[];
  estimatedImpactPercent: number;  // 0-100
  maxDurationMs: number;
  rollbackTimeMs: number;
}
```

## GitHub Actions Integration

```yaml
# .github/workflows/chaos-engineering.yml
jobs:
  chaos-test:
    runs-on: ubuntu-latest
    steps:
      - name: Pre-flight Health Check
        run: npm run health:check
        
      - name: Run Chaos Experiment
        run: npm run chaos:run -- --strategy=network-latency
        
      - name: Post-experiment Health Check
        run: npm run health:check
```

## Layer Dependencies

- **Imports from**: Physics, Bastion (CircuitBreaker, HealthCheck)
- **Imported by**: CI/CD workflows

---

*© 2025-2026 Димитър Продромов. "В QAntum не лъжем."*
