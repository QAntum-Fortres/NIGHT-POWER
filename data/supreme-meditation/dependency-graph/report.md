# Dependency Graph Analysis Report
Generated: 2026-02-05T04:48:01.956Z

## Overview
- **Total Files:** 536
- **Total Dependencies:** 467
- **Modules:** 58
- **Health Score:** 90/100

## Module Metrics
| Module | Files | Lines | Ca | Ce | Instability |
|--------|-------|-------|----|----|-------------|
| multimodal | 179 | 76246 | 1 | 5 | 0.83 |
| omega | 39 | 16169 | 4 | 5 | 0.56 |
| intelligence | 28 | 12580 | 5 | 3 | 0.38 |
| reality | 24 | 14760 | 2 | 5 | 0.71 |
| core | 21 | 10812 | 2 | 2 | 0.50 |
| swarm | 20 | 7837 | 4 | 1 | 0.20 |
| cognition | 15 | 6130 | 2 | 2 | 0.50 |
| biology | 14 | 11150 | 4 | 3 | 0.43 |
| security | 12 | 7448 | 1 | 0 | 0.00 |
| bastion | 10 | 4741 | 1 | 0 | 0.00 |
| enterprise | 9 | 6724 | 0 | 5 | 1.00 |
| fortress | 9 | 2939 | 2 | 0 | 0.00 |
| chaos | 8 | 2230 | 0 | 0 | 0.00 |
| ghost | 8 | 4271 | 0 | 0 | 0.00 |
| segc | 8 | 3607 | 1 | 0 | 0.00 |
| agents | 7 | 1230 | 0 | 0 | 0.00 |
| ide | 7 | 3866 | 0 | 3 | 1.00 |
| chronos | 6 | 3806 | 1 | 0 | 0.00 |
| performance | 6 | 2528 | 0 | 0 | 0.00 |
| physics | 6 | 4364 | 8 | 0 | 0.00 |
| chemistry | 5 | 3105 | 1 | 0 | 0.00 |
| synthesis | 5 | 2278 | 1 | 0 | 0.00 |
| types | 5 | 1611 | 1 | 0 | 0.00 |
| ai | 4 | 2271 | 0 | 0 | 0.00 |
| data | 4 | 1577 | 0 | 0 | 0.00 |
| distributed | 4 | 1867 | 0 | 0 | 0.00 |
| guardians | 4 | 1645 | 0 | 0 | 0.00 |
| persona | 4 | 1142 | 0 | 0 | 0.00 |
| reporter | 4 | 1811 | 0 | 0 | 0.00 |
| saas | 4 | 1772 | 0 | 0 | 0.00 |
| storage | 4 | 1694 | 0 | 0 | 0.00 |
| validation | 4 | 1628 | 0 | 0 | 0.00 |
| api | 3 | 1294 | 0 | 0 | 0.00 |
| config | 3 | 1624 | 0 | 0 | 0.00 |
| dashboard | 3 | 2825 | 0 | 2 | 1.00 |
| events | 3 | 1026 | 0 | 0 | 0.00 |
| extensibility | 3 | 1231 | 0 | 0 | 0.00 |
| healing | 3 | 1285 | 0 | 0 | 0.00 |
| integration | 3 | 1145 | 0 | 0 | 0.00 |
| local | 3 | 1124 | 0 | 0 | 0.00 |
| visual | 3 | 1266 | 0 | 0 | 0.00 |
| accessibility | 2 | 821 | 0 | 0 | 0.00 |
| neural | 2 | 778 | 0 | 0 | 0.00 |
| plugins | 2 | 775 | 0 | 0 | 0.00 |
| telemetry | 2 | 584 | 1 | 0 | 0.00 |
| ux | 2 | 727 | 0 | 0 | 0.00 |
| asc | 1 | 1107 | 1 | 0 | 0.00 |
| docs | 1 | 964 | 1 | 0 | 0.00 |
| global-nexus | 1 | 266 | 0 | 4 | 1.00 |
| index.ts | 1 | 4576 | 0 | 4 | 1.00 |
| licensing | 1 | 1299 | 0 | 0 | 0.00 |
| market-reaper.ts | 1 | 56 | 0 | 0 | 0.00 |
| math | 1 | 481 | 1 | 0 | 0.00 |
| neural-hud.ts | 1 | 1304 | 0 | 0 | 0.00 |
| oracle | 1 | 182 | 0 | 0 | 0.00 |
| sales | 1 | 1452 | 0 | 0 | 0.00 |
| scripts | 1 | 76 | 1 | 0 | 0.00 |
| sovereign-market | 1 | 335 | 0 | 2 | 1.00 |

## 🚨 Layer Violations
- **WARNING:** src/biology/evolution/BrainRouter.ts (biology) → src/cognition/AdaptiveInterface.ts (cognition)
  - Rule: Layer biology (level 2) should not import from cognition (level 3)
- **WARNING:** src/biology/evolution/BrainRouter.ts (biology) → src/chemistry/tool-orchestrator/ToolSelector.ts (chemistry)
  - Rule: Layer biology (level 2) should not import from chemistry (level 4)
- **WARNING:** src/biology/evolution/index.ts (biology) → src/cognition/ContextInjector.ts (cognition)
  - Rule: Layer biology (level 2) should not import from cognition (level 3)
- **WARNING:** src/biology/evolution/SelfCorrectionLoop.ts (biology) → src/cognition/ContextInjector.ts (cognition)
  - Rule: Layer biology (level 2) should not import from cognition (level 3)

## Hub Files (Most Dependencies)
- **OmegaNexus.ts:** 4 dependents, 18 dependencies
- **NeuralInference.ts:** 19 dependents, 2 dependencies
- **OmegaNexus.d.ts:** 0 dependents, 18 dependencies
- **SovereignNucleus.ts:** 15 dependents, 2 dependencies
- **DepartmentEngine.ts:** 2 dependents, 12 dependencies
- **UniversalIntegrity.ts:** 6 dependents, 8 dependencies
- **AIAgentExpert.ts:** 7 dependents, 6 dependencies
- **IntentAnchor.ts:** 11 dependents, 2 dependencies
- **CognitiveBridge.ts:** 1 dependents, 10 dependencies
- **SystemOrchestrator.ts:** 0 dependents, 11 dependencies

## Orphan Files (No Dependencies)
- src/agents/CloudAgent.ts
- src/agents/DeepSeekAgent.ts
- src/agents/GeminiCloudAgent.ts
- src/agents/GroqAgent.ts
- src/agents/GroqCloudAgent.ts
- src/agents/index.ts
- src/agents/PineconeVectorStore.ts
- src/biology/evolution/BrainRouter.d.ts
- src/biology/evolution/BrainRouter.js
- src/biology/evolution/GenesisEngine.ts
- ... and 239 more