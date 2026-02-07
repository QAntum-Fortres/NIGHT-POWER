# Inference Flow Diagram

## Triple Hybrid Inference Architecture

```mermaid
sequenceDiagram
    participant User
    participant BrainRouter
    participant Groq
    participant DeepSeek
    participant Ollama
    participant Response

    User->>BrainRouter: Request (task, prompt, context)
    
    Note over BrainRouter: Analyze task complexity
    
    alt Simple task (selector repair)
        BrainRouter->>Groq: Fast inference request
        Groq-->>BrainRouter: Response (500+ tok/sec)
    else Complex task (architecture)
        BrainRouter->>DeepSeek: Deep reasoning request
        DeepSeek-->>BrainRouter: Response (128k context)
    end
    
    alt Groq fails
        BrainRouter->>DeepSeek: Fallback request
        alt DeepSeek fails
            BrainRouter->>Ollama: Local fallback
            Ollama-->>BrainRouter: Local response
        else DeepSeek succeeds
            DeepSeek-->>BrainRouter: Response
        end
    end
    
    BrainRouter->>Response: Formatted result
    Response-->>User: Final response
```

## Model Selection Logic

```mermaid
flowchart TD
    A[Incoming Task] --> B{Task Type?}
    
    B -->|selector-repair| C[Llama 3.1 8B]
    B -->|code-review| C
    B -->|test-generation| C
    
    B -->|logic-refactor| D[DeepSeek-V3]
    B -->|architecture| D
    B -->|security-audit| D
    
    C --> E{Groq Available?}
    D --> F{DeepSeek Available?}
    
    E -->|Yes| G[Groq API]
    E -->|No| H[Fallback Chain]
    
    F -->|Yes| I[DeepSeek API]
    F -->|No| H
    
    H --> J{DeepSeek?}
    J -->|Yes| I
    J -->|No| K[Ollama Local]
    
    G --> L[Response]
    I --> L
    K --> L
```

## Provider Comparison

```mermaid
graph LR
    subgraph Speed
        Groq[Groq: 500+ tok/sec]
        DeepSeek[DeepSeek: 60 tok/sec]
        Ollama[Ollama: 30 tok/sec]
    end
    
    subgraph Context
        G_CTX[Groq: 32k]
        D_CTX[DeepSeek: 128k]
        O_CTX[Ollama: 8k]
    end
    
    subgraph Cost
        G_COST[Groq: $0.05/1M]
        D_COST[DeepSeek: $0.14/1M]
        O_COST[Ollama: FREE]
    end
```

## Usage Example

```typescript
import { getNeuralInference } from './physics/NeuralInference';

const neural = getNeuralInference();

// Automatic provider selection based on availability
const response = await neural.infer({
  task: 'code-generation',
  prompt: 'Generate a Playwright test for login',
  context: {
    framework: 'playwright',
    language: 'typescript'
  }
});

console.log(response.content);
console.log(response.provider);  // 'groq' | 'deepseek' | 'ollama'
console.log(response.tokensUsed);
```
