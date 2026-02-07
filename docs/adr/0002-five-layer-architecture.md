# ADR 0002: Five-Layer Architecture

**Status:** Accepted  
**Date:** 2025-12-31  
**Author:** Димитър Продромов  

## Context

QAntum has grown to 700k+ lines of code. Without clear architectural boundaries:
- Circular dependencies become inevitable
- Code becomes unmaintainable
- New developers can't understand the system

## Decision

Implement **5-Layer Architecture** with strict dependency rules:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Layer 5: REALITY                                         │
│   └── Gateway, Sales, Market, Licensing                    │
│                  ▲                                          │
│                  │ can import                               │
│   Layer 4: BIOLOGY                                         │
│   └── Evolution, HiveMind, BrainRouter                     │
│                  ▲                                          │
│                  │ can import                               │
│   Layer 3: CHEMISTRY (Cognition)                           │
│   └── ContextInjector, DependencyGraph, Distiller          │
│                  ▲                                          │
│                  │ can import                               │
│   Layer 2: PHYSICS                                         │
│   └── NeuralInference, NeuralAccelerator, HardwareBridge   │
│                  ▲                                          │
│                  │ can import                               │
│   Layer 1: MATH                                            │
│   └── Types, Utils, Helpers (no dependencies)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Rules

| Layer | Can Import From | Cannot Import From |
|-------|----------------|-------------------|
| Math (1) | None | All |
| Physics (2) | Math | Chemistry, Biology, Reality |
| Chemistry (3) | Math, Physics | Biology, Reality |
| Biology (4) | Math, Physics, Chemistry | Reality |
| Reality (5) | All | None |

### Layer Responsibilities

1. **Math**: Pure functions, types, utilities
2. **Physics**: Hardware, computation, inference
3. **Chemistry**: Knowledge processing, context
4. **Biology**: Learning, evolution, adaptation
5. **Reality**: External world interaction

## Consequences

### Positive
- **Zero circular dependencies**: Mathematically impossible
- **Clear boundaries**: Each layer has defined responsibility
- **Testable**: Lower layers test independently
- **Scalable**: Add modules without breaking structure

### Negative
- **Strict rules**: Can't just import anything
- **Refactoring needed**: Move code to correct layer
- **Learning curve**: Developers must understand layers

## Validation

```bash
# Run layer validation
npm run lint:layers

# Check circular dependencies
npm run lint:circular
```

```typescript
// scripts/lint/circular-deps.ts
const LAYER_HIERARCHY = {
  'math': 1,
  'physics': 2,
  'chemistry': 3,
  'biology': 4,
  'reality': 5
};

function checkLayerViolation(from: string, to: string): boolean {
  const fromLayer = getLayer(from);
  const toLayer = getLayer(to);
  return LAYER_HIERARCHY[fromLayer] < LAYER_HIERARCHY[toLayer];
}
```

## References

- [DependencyGraph.ts](../src/cognition/DependencyGraph.ts)
- [circular-deps.ts](../scripts/lint/circular-deps.ts)
- Clean Architecture by Robert C. Martin
