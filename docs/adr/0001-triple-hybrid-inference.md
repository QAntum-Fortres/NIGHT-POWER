# ADR 0001: Triple Hybrid Inference Architecture

**Status:** Accepted  
**Date:** 2025-12-31  
**Author:** Димитър Продромов  

## Context

QAntum requires reliable, fast, and cost-effective AI inference for:
- Selector repair and code generation
- Architecture analysis and refactoring
- Test generation and security audits

Single-provider solutions have critical weaknesses:
- **OpenAI/Anthropic**: Expensive, rate limits, no local fallback
- **Local-only (Ollama)**: Slow, limited context window
- **Single API**: Single point of failure

## Decision

Implement **Triple Hybrid Inference** with automatic fallback:

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  GROQ   │────▶│DEEPSEEK │────▶│ OLLAMA  │
│ PRIMARY │     │FALLBACK │     │  LOCAL  │
└─────────┘     └─────────┘     └─────────┘
   500+            128k           FREE
  tok/sec        context         local
```

### Fallback Chain

1. **Groq (Primary)**: Llama 3.3 70B @ 500+ tok/sec
   - Fastest inference available
   - Cost: $0.05/1M tokens
   - Context: 32k tokens

2. **DeepSeek V3 (Fallback 1)**: 128k context
   - Largest context window
   - Cost: $0.14/1M tokens
   - Best for architecture analysis

3. **Ollama (Fallback 2)**: gemma3:4b on RTX 4050
   - 100% local, no API dependency
   - FREE, unlimited usage
   - Works offline

## Consequences

### Positive
- **99.9% uptime**: Three independent providers
- **Cost optimization**: Groq first (cheapest), local fallback (free)
- **Offline capability**: Ollama works without internet
- **No vendor lock-in**: Easy to swap providers

### Negative
- **Complexity**: Three APIs to maintain
- **Inconsistency**: Different models may give different results
- **Local GPU required**: Ollama needs RTX 4050+ for good performance

### Mitigation
- Unified interface via `NeuralInference.ts`
- Consistent prompts with `MISTER_MIND_SYSTEM_PROMPT`
- GPU detection with graceful degradation

## Implementation

```typescript
// src/physics/NeuralInference.ts
const INFERENCE_ORDER = ['groq', 'deepseek', 'ollama'] as const;

async function infer(request: InferenceRequest): Promise<InferenceResponse> {
  for (const provider of INFERENCE_ORDER) {
    try {
      return await providers[provider].infer(request);
    } catch (error) {
      console.warn(`${provider} failed, trying next...`);
      continue;
    }
  }
  throw new Error('All inference providers failed');
}
```

## References

- [NeuralInference.ts](../src/physics/NeuralInference.ts)
- [Groq API Docs](https://console.groq.com/docs)
- [DeepSeek API](https://platform.deepseek.com)
- [Ollama](https://ollama.ai)
