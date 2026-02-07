# 🏰 Bastion Layer

> **Security, fault tolerance, and infrastructure protection**

## Overview

The Bastion layer provides enterprise-grade security, circuit breakers, health monitoring, and sandboxed execution. It's the defensive core of QAntum.

## Modules

| Module | Lines | Description |
|--------|-------|-------------|
| [circuit-breaker.ts](./circuit/circuit-breaker.ts) | 525 | Automatic failover with 5-service chain |
| [health-check.ts](./health/health-check.ts) | 582 | System health monitoring |
| [sandbox-executor.ts](./sandbox/sandbox-executor.ts) | - | Isolated code execution |
| [neural-vault.ts](./neural/neural-vault.ts) | - | Encrypted secrets storage |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BASTION LAYER                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────┐    ┌─────────────────┐               │
│   │ Circuit Breaker │    │  Health Check   │               │
│   │                 │    │                 │               │
│   │ States:         │    │ Monitors:       │               │
│   │ • CLOSED ✓      │    │ • Memory        │               │
│   │ • OPEN ✗        │    │ • CPU           │               │
│   │ • HALF-OPEN ~   │    │ • Custom checks │               │
│   └────────┬────────┘    └────────┬────────┘               │
│            │                      │                         │
│            ▼                      ▼                         │
│   ┌─────────────────────────────────────────┐              │
│   │           Fallback Chain                │              │
│   │  Gemini → Claude → OpenAI → Ollama → Local            │
│   └─────────────────────────────────────────┘              │
│                                                             │
│   ┌─────────────────┐    ┌─────────────────┐               │
│   │ Sandbox Executor│    │  Neural Vault   │               │
│   │                 │    │                 │               │
│   │ • Isolated V8   │    │ • AES-256-GCM   │               │
│   │ • Resource limits│   │ • Hardware keys │               │
│   │ • Blocked APIs  │    │ • Zero-knowledge│               │
│   └─────────────────┘    └─────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Circuit Breaker - Automatic Failover

```typescript
import { CircuitBreakerManager } from './bastion/circuit/circuit-breaker';

const breaker = new CircuitBreakerManager({
  failureThreshold: 5,
  successThreshold: 3,
  resetTimeout: 30000,
  healthCheckInterval: 30000
});

// Execute with automatic failover
const result = await breaker.execute(
  async (service) => {
    return await callAIService(service, prompt);
  },
  { fallbackEnabled: true }
);

// Fallback chain: gemini → claude → openai → ollama → local
```

### Health Check System

```typescript
import { HealthCheckSystem } from './bastion/health/health-check';

const health = new HealthCheckSystem({
  interval: 30000,
  alerts: {
    memoryThreshold: 0.85,
    cpuThreshold: 0.90,
    failureThreshold: 3
  }
});

// Register custom health check
health.register('database', async () => ({
  module: 'database',
  healthy: await db.ping(),
  message: 'Database connection OK',
  timestamp: new Date()
}));

// Run all checks
const results = await health.runAllChecks();
console.log(results.overall);  // 'healthy' | 'degraded' | 'unhealthy'
```

### Sandbox Executor - Safe Code Execution

```typescript
import { SandboxExecutor } from './bastion/sandbox/sandbox-executor';

const sandbox = new SandboxExecutor({
  timeout: 5000,
  memoryLimit: 128 * 1024 * 1024,  // 128MB
  blockedGlobals: ['process', 'require', 'fetch']
});

const result = await sandbox.execute(`
  const sum = [1, 2, 3].reduce((a, b) => a + b, 0);
  return sum;
`);

console.log(result.value);   // 6
console.log(result.blocked); // false
```

## Circuit Breaker States

```
┌──────────┐  success   ┌──────────┐  failure  ┌──────────┐
│  CLOSED  │◀──────────│HALF-OPEN │──────────▶│   OPEN   │
│   (OK)   │           │  (test)  │           │ (failed) │
└────┬─────┘           └──────────┘           └────┬─────┘
     │                      ▲                      │
     │  failures ≥ 5       │  timeout             │
     └─────────────────────┼──────────────────────┘
                           │
                     (30s cooldown)
```

## Health Check Alerts

| Level | Trigger | Action |
|-------|---------|--------|
| `info` | Memory > 70% | Log only |
| `warning` | Memory > 85% | Alert + log |
| `critical` | Memory > 95% | Alert + remediate |

## Exports

```typescript
// Main exports from bastion/index.ts
export { BastionController } from './bastion-controller';
export { SandboxExecutor } from './sandbox/sandbox-executor';
export { WorkerPoolManager, workerMain } from './workers/worker-pool';
export { MemoryHardeningManager } from './memory/memory-hardening';
export { NeuralVault } from './neural/neural-vault';
export { ChecksumValidator } from './neural/checksum-validator';
export { CircuitBreakerManager } from './circuit/circuit-breaker';
export { HealthCheckSystem } from './health/health-check';
```

## Layer Dependencies

- **Imports from**: Physics (for AI calls)
- **Imported by**: Chaos, Enterprise, all modules needing protection

---

*© 2025-2026 Димитър Продромов. "В QAntum не лъжем."*
