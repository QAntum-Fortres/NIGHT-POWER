# ⚛️ Physics Layer

> **Layer 1** - Core computation and inference engine

## Overview

The Physics layer is the foundational computation layer of QAntum. It handles all AI inference, GPU acceleration, and hardware interactions.

## Modules

| Module | Lines | Description |
|--------|-------|-------------|
| [NeuralInference.ts](./NeuralInference.ts) | 800+ | Triple-hybrid AI inference (Groq→DeepSeek→Ollama) |
| [NeuralAccelerator.ts](./NeuralAccelerator.ts) | 1,284 | GPU-accelerated computation (WebGL/CUDA/WebGPU) |
| [HardwareBridge.ts](./HardwareBridge.ts) | - | Hardware abstraction layer |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PHYSICS LAYER                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────┐    ┌─────────────────┐               │
│   │ NeuralInference │───▶│ NeuralAccelerator│              │
│   │  (AI Routing)   │    │   (GPU Compute)  │              │
│   └────────┬────────┘    └─────────────────┘               │
│            │                                                │
│            ▼                                                │
│   ┌─────────────────────────────────────────┐              │
│   │           Triple Hybrid Fallback        │              │
│   │  ┌───────┐  ┌─────────┐  ┌──────────┐  │              │
│   │  │ Groq  │─▶│DeepSeek │─▶│  Ollama  │  │              │
│   │  │ 500+  │  │  128k   │  │  Local   │  │              │
│   │  │tok/sec│  │ context │  │  RTX4050 │  │              │
│   │  └───────┘  └─────────┘  └──────────┘  │              │
│   └─────────────────────────────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Inference

```typescript
import { getNeuralInference } from './physics/NeuralInference';

const neural = getNeuralInference();

// Simple chat
const response = await neural.chat('Explain QAntum architecture');

// With context
const result = await neural.infer({
  task: 'code-generation',
  prompt: 'Generate a Playwright test',
  context: { framework: 'playwright', language: 'typescript' }
});
```

### GPU Acceleration

```typescript
import { NeuralAccelerator } from './physics/NeuralAccelerator';

const accelerator = new NeuralAccelerator({
  backend: 'cuda',  // or 'webgl', 'webgpu', 'cpu'
  deviceId: 0
});

await accelerator.initialize();

// Batch inference
const results = await accelerator.batchInfer(tensors, {
  batchSize: 32,
  priority: 'high'
});
```

## Configuration

```typescript
interface NeuralConfig {
  // Primary model (Groq - fastest)
  groqApiKey?: string;
  groqModel?: string;  // default: 'llama-3.3-70b-versatile'
  
  // Fallback 1 (DeepSeek - largest context)
  deepseekApiKey?: string;
  deepseekModel?: string;  // default: 'deepseek-chat'
  
  // Fallback 2 (Ollama - local)
  ollamaBaseUrl?: string;  // default: 'http://localhost:11434'
  ollamaModel?: string;    // default: 'gemma3:4b'
}
```

## Performance

| Provider | Speed | Context | Cost |
|----------|-------|---------|------|
| **Groq** | 500+ tok/sec | 32k | $0.05/1M |
| **DeepSeek** | 60 tok/sec | 128k | $0.14/1M |
| **Ollama** | 30 tok/sec | 8k | FREE |

## Layer Dependencies

- **Imports from**: None (base layer)
- **Imported by**: Biology, Cognition, Chemistry, Reality

---

*© 2025-2026 Димитър Продромов. "В QAntum не лъжем."*
