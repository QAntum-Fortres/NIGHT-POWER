# 🧠 QAntum Cognition Module

> **Layer 3: Chemistry** - Knowledge processing, context injection, and adaptive intelligence.

## Overview

The cognition module represents "brain chemistry" - the knowledge processing and analytical capabilities that transform raw data into actionable intelligence.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        COGNITION LAYER                              │
│                                                                     │
│   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐        │
│   │   Context     │   │  Dependency   │   │   Distiller   │        │
│   │   Injector    │   │    Graph      │   │               │        │
│   └───────┬───────┘   └───────┬───────┘   └───────┬───────┘        │
│           │                   │                   │                │
│           └───────────┬───────┴───────────────────┘                │
│                       │                                            │
│              ┌────────▼────────┐   ┌───────────────────┐           │
│              │ Multi-Perspective│   │ AdaptiveInterface │           │
│              │   Analysis       │   │ (v29.1)           │           │
│              └──────────────────┘   └───────────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Components

### AdaptiveInterface.ts (v29.1 - NEW)

Human-AI communication bridge with 3 interaction modes:

```typescript
import { AdaptiveInterface } from './cognition/AdaptiveInterface';

const ai = AdaptiveInterface.getInstance();

// Switch modes
ai.setMode('ARCHITECT');  // Strategic vision, macro-architecture
ai.setMode('ENGINEER');   // Code blocks, file paths, benchmarks
ai.setMode('QA');         // Vulnerabilities, test coverage, risks

// Get context for response generation
const context = ai.getResponseContext();
// { mode, config, systemPrompt, guidelines }

// Auto-select mode based on query
const suggested = ai.selectMode('fix the bug in login.ts');
// Returns 'ENGINEER' (code-focused query)
```

**Mode Configurations:**

| Mode | Verbosity | Code Blocks | Focus Areas |
| ---- | --------- | ----------- | ----------- |
| ARCHITECT | Balanced | ❌ | Architecture, strategy, philosophy |
| ENGINEER | Detailed | ✅ | Code, APIs, benchmarks, files |
| QA | Detailed | ✅ | Risks, tests, vulnerabilities |

### ContextInjector.ts (971 lines)

Automatically enriches AI requests with accumulated knowledge:

```typescript
import { ContextInjector } from './cognition/ContextInjector';

const injector = ContextInjector.getInstance('/path/to/project');
await injector.initialize();

// Build context for a request
const context = await injector.buildContext('code-generation', 'Generate login test');

// Context includes:
// - Distilled architectural knowledge
// - Backpack accumulated wisdom
// - Relevant file context
// - Error history for learning
// - Anti-hallucination verified symbols
```

**Anti-Hallucination Engine:**

```typescript
// Verify generated code doesn't hallucinate imports
const verification = injector.verifyGeneratedCode(generatedCode);
if (!verification.valid) {
  console.log('Issues:', verification.issues);
  // ["Import 'FakeClass' does not exist in codebase"]
}

// Verify single symbol
const result = injector.verifySymbol('NeuralInference', 'class');
// { valid: true, exists: true, suggestions: [] }
```

### DependencyGraph.ts (1,004 lines)

Analyzes and visualizes project dependencies:

```typescript
import { DependencyGraph } from './cognition/DependencyGraph';

const graph = new DependencyGraph({ projectRoot: '/path/to/project' });
await graph.build();

// Detect circular dependencies
const cycles = graph.detectCycles();
if (cycles.length > 0) {
  console.log('CIRCULAR DEPENDENCIES:', cycles);
}

// Get import chain
const chain = graph.getImportChain('ComponentA', 'ComponentB');

// Visualize as Mermaid
const mermaid = graph.toMermaid();
```

### distiller.ts (1,023 lines)

Extracts and distills architectural knowledge from codebase:

```typescript
import { Distiller } from './cognition/distiller';

const distiller = new Distiller({ projectRoot: '/path/to/project' });

// Distill knowledge
const knowledge = await distiller.distill();

// Output includes:
// - Architectural principles
// - Module layers
// - Code statistics
// - Import graph
// - Naming conventions
```

### multi-perspective.ts (522 lines)

Analyzes code from multiple perspectives (architect, security, performance):

```typescript
import { MultiPerspectiveAnalyzer } from './cognition/multi-perspective';

const analyzer = new MultiPerspectiveAnalyzer();

const analysis = await analyzer.analyze(code, [
  'architect',   // Clean architecture review
  'security',    // Security vulnerabilities
  'performance', // Performance bottlenecks
  'testing'      // Test coverage gaps
]);

// Each perspective provides independent analysis
for (const [perspective, result] of analysis) {
  console.log(`${perspective}: ${result.score}/100`);
  console.log('Issues:', result.issues);
  console.log('Recommendations:', result.recommendations);
}
```

## Architecture Position

```
Layer 5: Reality     │ Gateway, Sales, Market
        ▲            │
Layer 4: Biology     │ Evolution, HiveMind, BrainRouter
        ▲            │
Layer 3: Chemistry   │ ← YOU ARE HERE ←
        (Cognition)  │ ContextInjector, DependencyGraph, Distiller
        ▲            │
Layer 2: Physics     │ NeuralInference, NeuralAccelerator
        ▲            │
Layer 1: Math        │ Types, Utils (no dependencies)
```

## Dependency Rules

✅ **CAN Import:**
- `math/*` (Layer 1)
- `physics/*` (Layer 2)

❌ **CANNOT Import:**
- `biology/*` (Layer 4) - would create circular dependency
- `reality/*` (Layer 5)

## Key Interfaces

```typescript
// Context payload for AI requests
interface ContextPayload {
  distilledKnowledge?: DistilledKnowledgeSummary;
  backpackContent?: string;
  projectStructure?: string;
  relevantFiles?: FileContext[];
  verifiedCodebaseContext?: string;
  recentErrors?: ErrorContext[];
}

// Backpack content (accumulated wisdom)
interface BackpackContent {
  patterns: LearnedPattern[];
  antiPatterns: AntiPattern[];
  conventions: CodeConvention[];
  projectRules: ProjectRule[];
  selectorStrategies: SelectorStrategy[];
  errorSolutions: ErrorSolution[];
}

// Dependency graph node
interface DependencyNode {
  path: string;
  imports: string[];
  exports: string[];
  layer: string;
  metrics: {
    loc: number;
    complexity: number;
    dependencies: number;
  };
}
```

## Integration Examples

### With NeuralInference

```typescript
import { getNeuralInference } from '../physics/NeuralInference';
import { ContextInjector } from './ContextInjector';

const neural = getNeuralInference();
const injector = ContextInjector.getInstance();

// Build enriched context
const context = await injector.buildContext('code-review', userPrompt);

// Send to AI with full context
const response = await neural.infer({
  task: 'code-review',
  prompt: userPrompt,
  context
});
```

### With SelfHealingEngine

```typescript
import { SelfHealingEngine } from '../healing/SelfHealingEngine';
import { ContextInjector } from './ContextInjector';

const healer = new SelfHealingEngine();
const injector = ContextInjector.getInstance();

// Record error for learning
injector.recordError({
  selector: '#broken-button',
  error: 'Element not found',
  timestamp: new Date()
});

// Get error history for self-correction
const recentErrors = injector.getRecentErrors();
```

## Statistics

| Metric | Value |
|--------|-------|
| Total Lines | 3,520+ |
| Test Coverage | 85% |
| Cyclomatic Complexity | Medium |
| Dependencies | physics, math |

## Related Documentation

- [ADR 0002: Five-Layer Architecture](../docs/adr/0002-five-layer-architecture.md)
- [Physics README](../physics/README.md)
- [Biology README](../biology/README.md)
