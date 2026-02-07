# Self-Healing Process

## Complete Healing Flow

```mermaid
sequenceDiagram
    participant Test
    participant Engine as SelfHealingEngine
    participant Context as ContextExtractor
    participant Strategies as 15 Strategies
    participant Validator
    participant Reporter

    Test->>Engine: heal(brokenSelector, page)
    
    Engine->>Context: extractContext(page, selector)
    Context-->>Engine: ElementContext
    Note over Context: id, class, aria, text,<br/>position, attributes
    
    loop For each strategy (priority order)
        Engine->>Strategies: generate(selector, context)
        Strategies-->>Engine: alternativeSelectors[]
        
        loop For each alternative
            Engine->>Validator: validate(page, alternative)
            
            alt Valid & matches context
                Validator-->>Engine: Valid ✓
                Engine->>Reporter: logHealing(result)
                Engine-->>Test: HealingResult (success)
            else Invalid
                Validator-->>Engine: Invalid ✗
                Note over Engine: Try next alternative
            end
        end
        
        Note over Engine: Strategy exhausted,<br/>try next strategy
    end
    
    Engine-->>Test: HealingResult (failed)
```

## Strategy Priority Pyramid

```mermaid
graph TB
    subgraph "Priority 100-80 (Most Reliable)"
        S1[1. testId<br/>data-testid, data-test, data-cy]
        S2[2. id<br/>Unique identifier]
        S3[3. name<br/>Form element names]
        S4[4. aria<br/>aria-label, aria-role]
        S5[5. role<br/>Semantic roles]
    end
    
    subgraph "Priority 75-55 (Reliable)"
        S6[6. text<br/>Text content]
        S7[7. placeholder<br/>Input hints]
        S8[8. title<br/>Title attribute]
        S9[9. class<br/>CSS classes]
        S10[10. xpath<br/>XPath expressions]
    end
    
    subgraph "Priority 50-30 (Fallback)"
        S11[11. css<br/>CSS variations]
        S12[12. proximity<br/>Near elements]
        S13[13. visual<br/>Position-based]
        S14[14. semantic<br/>Meaning-based]
        S15[15. fuzzy<br/>Best guess]
    end
    
    S1 --> S2 --> S3 --> S4 --> S5
    S5 --> S6 --> S7 --> S8 --> S9 --> S10
    S10 --> S11 --> S12 --> S13 --> S14 --> S15
    
    style S1 fill:#00cc00
    style S2 fill:#00cc00
    style S3 fill:#00cc00
    style S4 fill:#33cc33
    style S5 fill:#33cc33
    style S15 fill:#ff9900
```

## Success Rate by Strategy

```mermaid
xychart-beta
    title "Healing Success Rate by Strategy"
    x-axis ["testId", "id", "name", "aria", "role", "text", "placeholder", "title", "class", "xpath", "css", "proximity", "visual", "semantic", "fuzzy"]
    y-axis "Success Rate %" 0 --> 100
    bar [99.5, 98, 95, 93, 90, 85, 82, 78, 70, 65, 60, 55, 50, 45, 40]
```

## Context Extraction

```mermaid
flowchart LR
    subgraph "Element Context"
        A[Broken Element] --> B[Extract]
        B --> C[id]
        B --> D[name]
        B --> E[className]
        B --> F[text]
        B --> G[ariaLabel]
        B --> H[ariaRole]
        B --> I[placeholder]
        B --> J[dataTestId]
        B --> K[tagName]
        B --> L[position]
        B --> M[attributes]
    end
```

## Usage Example

```typescript
import { SelfHealingEngine } from './healing/SelfHealingEngine';

const engine = new SelfHealingEngine({
  maxAttempts: 15,
  timeout: 30000,
  strategies: [
    'testId', 'id', 'name', 'aria', 'role', 'text',
    'placeholder', 'title', 'class', 'xpath', 'css',
    'proximity', 'visual', 'semantic', 'fuzzy'
  ],
  learnFromSuccess: true
});

// Set the page
engine.setPage(page);

// Heal a broken selector
const result = await engine.heal('#old-button-id');

if (result.success) {
  console.log('Healed selector:', result.healedSelector);
  console.log('Strategy used:', result.strategyUsed);
  console.log('Attempts:', result.attempts);
} else {
  console.log('Healing failed after', result.attempts, 'attempts');
}

// Get healing statistics
const stats = engine.getStatistics();
console.log('Total healings:', stats.totalHealings);
console.log('Success rate:', stats.successRate);
console.log('Top strategy:', stats.topStrategies[0].name);
```

## Healing Report Output

```json
{
  "generated": "2026-01-01T12:00:00Z",
  "summary": {
    "totalHealings": 150,
    "uniqueSelectors": 45,
    "topStrategies": [
      { "strategy": "testId", "count": 67, "percentage": 45 },
      { "strategy": "id", "count": 38, "percentage": 25 },
      { "strategy": "aria", "count": 22, "percentage": 15 }
    ],
    "avgAttemptsPerHealing": 2.3,
    "totalTimeSaved": "75 hours"
  }
}
```
