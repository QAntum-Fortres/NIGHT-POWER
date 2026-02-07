# ADR 0003: Mandatory Kill Switch for Chaos Engineering

**Status:** Accepted  
**Date:** 2026-01-01  
**Author:** Димитър Продромов  

## Context

Chaos engineering tests system resilience by injecting faults. Without proper safeguards:
- Experiments can cause uncontrolled damage
- No way to stop runaway failures
- Production incidents from test tools

**Netflix Chaos Monkey taught us**: Even controlled chaos needs an emergency stop.

## Decision

**All chaos experiments MUST have a Kill Switch** - no exceptions.

### Kill Switch Requirements

```typescript
interface KillSwitch {
  enabled: true;  // ALWAYS true
  triggers: KillSwitchTrigger[];
  action: 'rollback' | 'pause' | 'alert';
  errorRateThreshold: number;  // default: 0.1 (10%)
  healthCheckInterval: number; // default: 5000ms
}

type KillSwitchTrigger = 
  | 'health_check_fail'
  | 'timeout_exceeded'
  | 'error_rate_threshold'
  | 'manual_trigger'
  | 'external_signal';
```

### Blast Radius Requirements

Every experiment must define its blast radius:

```typescript
interface BlastRadius {
  scope: 'single-service' | 'service-group' | 'datacenter' | 'global';
  affectedServices: string[];
  estimatedImpactPercent: number;  // 0-100
  maxDurationMs: number;
  rollbackTimeMs: number;
}
```

### Production Safety

```typescript
// CRITICAL: Block experiments with > 5% impact in production
if (environment === 'production' && blastRadius.estimatedImpactPercent > 5) {
  throw new Error('BLOCKED: Blast radius too large for production');
}
```

## Consequences

### Positive
- **Safe experimentation**: Automatic rollback on failure
- **Bounded impact**: Blast radius limits damage
- **Audit trail**: All experiments logged
- **Production protection**: Hard limits on impact

### Negative
- **More configuration**: Every experiment needs Kill Switch
- **Slower iteration**: Safety checks add overhead
- **False positives**: May stop valid experiments

## Implementation

```typescript
// src/chaos/engine.ts
class FaultInjectionEngine {
  async runExperiment(config: ExperimentConfig): Promise<ExperimentResult> {
    // MANDATORY: Check Kill Switch
    if (!config.killSwitch?.enabled) {
      throw new Error('Kill Switch is MANDATORY for all experiments');
    }
    
    // MANDATORY: Check Blast Radius
    if (!config.blastRadius) {
      throw new Error('Blast Radius must be defined');
    }
    
    // Start health monitoring
    this.startHealthMonitor(config.killSwitch);
    
    try {
      // Run experiment
      await strategy.inject();
      await this.wait(config.duration);
      await strategy.recover();
      
      // Post-experiment health check
      const health = await strategy.healthCheck();
      return { success: health.healthy, ... };
      
    } catch (error) {
      // Kill Switch triggered - automatic rollback
      await this.triggerKillSwitch(error);
      throw error;
    }
  }
}
```

## GitHub Actions Integration

```yaml
# .github/workflows/chaos-engineering.yml
jobs:
  chaos:
    steps:
      - name: Pre-flight Health
        run: npm run health:check
        
      - name: Run Chaos (with Kill Switch)
        run: npm run chaos -- --kill-switch=enabled
        timeout-minutes: 10
        
      - name: Post-experiment Health
        run: npm run health:check
        if: always()  # Run even if chaos failed
```

## References

- [chaos/engine.ts](../src/chaos/engine.ts)
- [chaos/types.ts](../src/chaos/types.ts)
- [Netflix Chaos Engineering](https://netflix.github.io/chaosmonkey/)
- [Principles of Chaos Engineering](https://principlesofchaos.org/)
