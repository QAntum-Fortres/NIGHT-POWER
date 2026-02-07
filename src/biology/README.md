# 🧬 Biology Layer

> **Layer 2** - Evolution, adaptation, and intelligent routing

## Overview

The Biology layer handles intelligent decision-making, self-correction, and evolutionary algorithms. It's where QAntum "thinks" and "learns".

## Modules

| Module | Lines | Description |
|--------|-------|-------------|
| [BrainRouter.ts](./evolution/BrainRouter.ts) | 647 | Intelligent model routing |
| [HiveMind.ts](./evolution/HiveMind.ts) | 1,481 | Federated learning swarm |
| [SelfCorrectionLoop.ts](./evolution/SelfCorrectionLoop.ts) | 738 | Auto-fix until 100% pass |
| [MarketBlueprint.ts](./evolution/MarketBlueprint.ts) | - | Market strategy evolution |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BIOLOGY LAYER                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────┐                                      │
│   │   BrainRouter   │◀──── Task Analysis                   │
│   │                 │                                       │
│   │  Selector? ────▶│ Llama 3.1 8B (fast)                  │
│   │  Logic?    ────▶│ DeepSeek-V3 (deep)                   │
│   └────────┬────────┘                                       │
│            │                                                │
│            ▼                                                │
│   ┌─────────────────┐    ┌─────────────────┐               │
│   │SelfCorrectionLoop│───▶│    HiveMind     │              │
│   │                 │    │                 │               │
│   │ Generate Code   │    │ Federated Learn │               │
│   │ Validate        │    │ Privacy-Safe    │               │
│   │ Fix Errors      │    │ Swarm Sync      │               │
│   │ Repeat → 100%   │    │                 │               │
│   └─────────────────┘    └─────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Brain Router - Intelligent Model Selection

```typescript
import { getBrainRouter } from './biology/evolution/BrainRouter';

const router = getBrainRouter();

// Router automatically selects best model for task
const decision = await router.route({
  task: 'selector-repair',
  input: 'Fix broken CSS selector: .old-class',
  complexity: 'simple'
});

console.log(decision.selectedModel);  // 'llama3.1:8b'
console.log(decision.reasoning);      // ['Fast inference needed', 'CSS expertise']
```

### Self-Correction Loop - Auto-Fix Until Perfect

```typescript
import { SelfCorrectionLoop } from './biology/evolution/SelfCorrectionLoop';

const loop = new SelfCorrectionLoop({
  maxIterations: 5,
  targetPassRate: 100,
  learningEnabled: true
});

const result = await loop.correct({
  initialCode: brokenCode,
  language: 'typescript',
  validators: ['typescript', 'eslint', 'jest']
});

console.log(result.finalPassRate);    // 100
console.log(result.totalIterations);  // 3
console.log(result.learnings);        // ['Added null check', 'Fixed async/await']
```

### HiveMind - Federated Learning

```typescript
import { HiveMind } from './biology/evolution/HiveMind';

const hive = new HiveMind({
  privacyBudget: 1.0,
  aggregationRounds: 10
});

// Workers learn from each other without sharing data
await hive.startFederatedRound({
  modelType: 'stealth-detection',
  participants: workerIds
});
```

## Model Routing Logic

| Task Type | Optimal Model | Reason |
|-----------|---------------|--------|
| `selector-repair` | Llama 3.1 8B | Fast, CSS expert |
| `logic-refactor` | DeepSeek-V3 | Deep reasoning |
| `architecture` | DeepSeek-V3 | Complex analysis |
| `test-generation` | Llama 3.1 8B | Structured output |
| `security-audit` | DeepSeek-V3 | Thorough analysis |

## Self-Correction Process

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Generate │────▶│ Validate │────▶│  Errors? │────▶│  Learn   │
│   Code   │     │   Code   │     │          │     │  & Fix   │
└──────────┘     └──────────┘     └────┬─────┘     └────┬─────┘
                                       │                 │
                                       │ No              │ Yes
                                       ▼                 │
                                  ┌──────────┐          │
                                  │  DONE    │◀─────────┘
                                  │  100%    │   (repeat max 5x)
                                  └──────────┘
```

## Layer Dependencies

- **Imports from**: Physics, Cognition (AdaptiveInterface)
- **Imported by**: Cognition, Chemistry, Reality

## Genesis Engine (v29.1)

Self-creating code ecosystem with template-based entity generation:

```typescript
import { GenesisEngine } from './biology/evolution/GenesisEngine';

const genesis = GenesisEngine.getInstance();

// Create new entity
const result = await genesis.create({
  name: 'DataValidator',
  type: 'class',
  layer: 'chemistry',
  description: 'Validates incoming data structures'
});

// Entity lifecycle management
genesis.updateEntityState('entity-id', 'deprecated');

// Ecosystem health check
const health = genesis.calculateEcosystemHealth();
console.log(`Score: ${health.score}/100`);
```

**CLI Commands:**

```bash
qantum genesis MyClass --type class --layer biology
qantum genesis MyInterface --type interface --layer cognition
qantum genesis MyClassTest --type test --layer biology
```

---

*© 2025-2026 Димитър Продромов. "В QAntum не лъжем."*
