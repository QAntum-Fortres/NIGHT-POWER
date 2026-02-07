# Chaos Experiment Lifecycle

## Complete Lifecycle Diagram

```mermaid
sequenceDiagram
    participant Operator
    participant Engine as Chaos Engine
    participant KillSwitch
    participant Strategy
    participant HealthCheck
    participant System

    Operator->>Engine: arm()
    Note over Engine: Engine armed and ready
    
    Operator->>Engine: runExperiment(config)
    
    Engine->>Engine: Validate Kill Switch (MANDATORY)
    Engine->>Engine: Validate Blast Radius (MANDATORY)
    
    Engine->>KillSwitch: Start monitoring
    activate KillSwitch
    
    Engine->>HealthCheck: Pre-flight check
    HealthCheck-->>Engine: System healthy ✓
    
    Engine->>Strategy: inject()
    Strategy->>System: Apply fault
    Note over System: Fault active
    
    loop Every 5 seconds
        KillSwitch->>HealthCheck: Check health
        alt Health OK
            HealthCheck-->>KillSwitch: Healthy ✓
        else Health Failed
            HealthCheck-->>KillSwitch: Unhealthy ✗
            KillSwitch->>Engine: TRIGGER KILL SWITCH
            Engine->>Strategy: recover() [EMERGENCY]
            Strategy->>System: Rollback fault
        end
    end
    
    Note over Engine: Duration elapsed
    
    Engine->>Strategy: recover()
    Strategy->>System: Remove fault
    
    Engine->>HealthCheck: Post-experiment check
    HealthCheck-->>Engine: System recovered ✓
    
    deactivate KillSwitch
    
    Engine-->>Operator: ExperimentResult
    
    Operator->>Engine: disarm()
    Note over Engine: Engine disarmed
```

## Kill Switch Triggers

```mermaid
flowchart TD
    A[Experiment Running] --> B{Health Check}
    
    B -->|Pass| C[Continue]
    B -->|Fail| D[KILL SWITCH]
    
    A --> E{Error Rate}
    E -->|< 10%| C
    E -->|> 10%| D
    
    A --> F{Timeout}
    F -->|Within limit| C
    F -->|Exceeded| D
    
    A --> G{Manual Stop}
    G -->|No| C
    G -->|Yes| D
    
    D --> H[Rollback]
    H --> I[Recover]
    I --> J[Report]
    
    C --> K{Duration Complete?}
    K -->|No| B
    K -->|Yes| I
```

## Blast Radius Levels

```mermaid
graph TB
    subgraph "Scope Levels"
        S1[single-service<br/>Impact: 1 service]
        S2[service-group<br/>Impact: Related services]
        S3[datacenter<br/>Impact: Full DC]
        S4[global<br/>Impact: All regions]
    end
    
    subgraph "Risk Level"
        R1[LOW<br/>< 5% impact]
        R2[MEDIUM<br/>5-20% impact]
        R3[HIGH<br/>20-50% impact]
        R4[CRITICAL<br/>> 50% impact]
    end
    
    S1 --> R1
    S2 --> R2
    S3 --> R3
    S4 --> R4
    
    style R4 fill:#ff0000,color:#fff
    style R3 fill:#ff9900,color:#fff
    style R2 fill:#ffcc00
    style R1 fill:#00cc00
```

## Usage Example

```typescript
import { FaultInjectionEngine } from './chaos/engine';
import { NetworkLatencyStrategy } from './chaos/strategies';

const engine = new FaultInjectionEngine();

// 1. ARM the engine
engine.arm();

// 2. RUN experiment
const result = await engine.runExperiment({
  name: 'api-latency-test',
  strategy: new NetworkLatencyStrategy({ latencyMs: 500 }),
  duration: 30000,  // 30 seconds
  
  // MANDATORY: Kill Switch
  killSwitch: {
    enabled: true,
    triggers: ['health_check_fail', 'error_rate_threshold'],
    action: 'rollback',
    errorRateThreshold: 0.1
  },
  
  // MANDATORY: Blast Radius
  blastRadius: {
    scope: 'single-service',
    affectedServices: ['api-gateway'],
    estimatedImpactPercent: 5,
    maxDurationMs: 60000,
    rollbackTimeMs: 5000
  }
});

// 3. DISARM after completion
engine.disarm();

console.log(result.success);
console.log(result.healthCheck);
```
