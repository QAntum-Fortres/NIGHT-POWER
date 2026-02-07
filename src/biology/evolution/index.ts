/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                               ║
 * ║  ███╗   ██╗███████╗██╗   ██╗██████╗  █████╗ ██╗                                               ║
 * ║  ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔══██╗██║                                               ║
 * ║  ██╔██╗ ██║█████╗  ██║   ██║██████╔╝███████║██║                                               ║
 * ║  ██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██╔══██║██║                                               ║
 * ║  ██║ ╚████║███████╗╚██████╔╝██║  ██║██║  ██║███████╗                                          ║
 * ║  ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝                                          ║
 * ║                                                                                               ║
 * ║  ██╗███╗   ██╗████████╗███████╗ ██████╗ ██████╗  █████╗ ████████╗██╗ ██████╗ ███╗   ██╗       ║
 * ║  ██║████╗  ██║╚══██╔══╝██╔════╝██╔════╝ ██╔══██╗██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║       ║
 * ║  ██║██╔██╗ ██║   ██║   █████╗  ██║  ███╗██████╔╝███████║   ██║   ██║██║   ██║██╔██╗ ██║       ║
 * ║  ██║██║╚██╗██║   ██║   ██╔══╝  ██║   ██║██╔══██╗██╔══██║   ██║   ██║██║   ██║██║╚██╗██║       ║
 * ║  ██║██║ ╚████║   ██║   ███████╗╚██████╔╝██║  ██║██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║       ║
 * ║  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝       ║
 * ║                                                                                               ║
 * ║                           THE NERVOUS SYSTEM OF QANTUM                                        ║
 * ║                     "Правим софтуера СЪЗНАТЕЛЕН"                                              ║
 * ║                                                                                               ║
 * ║   Components:                                                                                 ║
 * ║     • NeuralInference - Ollama API + RTX 4050 GPU                                             ║
 * ║     • BrainRouter - Intelligent Model Selection                                               ║
 * ║     • ContextInjector - Automatic Knowledge Injection                                         ║
 * ║     • SelfCorrectionLoop - 100% Pass Rate Target                                              ║
 * ║                                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                                        ║
 * ║                                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// NEURAL INFERENCE - Core AI Connection
// ═══════════════════════════════════════════════════════════════════════════════

export {
    NeuralInference,
    getNeuralInference,
    
    // Types
    type OllamaConfig,
    type GPUConfig,
    type AIModel,
    type TaskType,
    type InferenceRequest,
    type InferenceResponse,
    type ContextPayload,
    type ErrorContext,
    type FileContext,
    type AttemptHistory,
    type InferenceOptions,
    type TokenUsage,
    type TimingInfo,
    type GPUMetrics,
    type ResponseMetadata
} from '../../physics/NeuralInference';

// ═══════════════════════════════════════════════════════════════════════════════
// BRAIN ROUTER - Intelligent Model Selection
// ═══════════════════════════════════════════════════════════════════════════════

export {
    BrainRouter,
    getBrainRouter,
    
    // Types
    type ModelProfile,
    type RoutingDecision,
    type TaskAnalysis,
    type TaskDomain,
    type ResourceCheck,
    type RoutingHistoryEntry
} from './BrainRouter';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT INJECTOR - Automatic Knowledge Injection
// ═══════════════════════════════════════════════════════════════════════════════

export {
    ContextInjector,
    getContextInjector,
    
    // Types
    type BackpackContent,
    type LearnedPattern,
    type AntiPattern,
    type CodeConvention,
    type ProjectRule,
    type SelectorStrategy,
    type ErrorSolution,
    type BackpackStats,
    type DistilledKnowledgeSummary,
    type ContextInjectionConfig
} from '../../cognition/ContextInjector';

// ═══════════════════════════════════════════════════════════════════════════════
// SELF-CORRECTION LOOP - 100% Pass Rate Target
// ═══════════════════════════════════════════════════════════════════════════════

export {
    SelfCorrectionLoop,
    getSelfCorrectionLoop,
    TypeScriptValidator,
    
    // Types
    type ValidationResult,
    type ValidationError,
    type ValidationWarning,
    type ValidationMetrics,
    type CorrectionAttempt,
    type SelfCorrectionResult,
    type SelfCorrectionConfig,
    type CodeValidator
} from './SelfCorrectionLoop';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED NEURAL INTEGRATION FACADE
// ═══════════════════════════════════════════════════════════════════════════════

import { NeuralInference, getNeuralInference, TaskType, InferenceResponse } from '../../physics/NeuralInference';
import { BrainRouter, getBrainRouter } from './BrainRouter';
import { ContextInjector, getContextInjector } from '../../cognition/ContextInjector';
import { SelfCorrectionLoop, getSelfCorrectionLoop, SelfCorrectionResult } from './SelfCorrectionLoop';

/**
 * NeuralIntegration - Unified Nervous System Facade
 * 
 * Provides a single interface to all Neural Integration components:
 * - AI Inference with GPU acceleration
 * - Intelligent model routing
 * - Automatic context injection
 * - Self-correcting code generation
 * 
 * @example
 * ```typescript
 * import { NeuralSystem } from './neural';
 * 
 * // Initialize the nervous system
 * await NeuralSystem.initialize();
 * 
 * // Generate code with auto-correction
 * const result = await NeuralSystem.generateWithCorrection({
 *     task: 'selector-repair',
 *     prompt: 'Fix the broken selector',
 *     targetPassRate: 100
 * });
 * 
 * console.log(result.finalCode);
 * ```
 */
export class NeuralIntegration {
    private static instance: NeuralIntegration;
    
    private inference: NeuralInference;
    private router: BrainRouter;
    private injector: ContextInjector;
    private corrector: SelfCorrectionLoop;
    
    private initialized = false;

    private constructor() {
        this.inference = getNeuralInference();
        this.router = getBrainRouter();
        this.injector = getContextInjector();
        this.corrector = getSelfCorrectionLoop();
    }

    /**
     * Get singleton instance
     */
    static getInstance(): NeuralIntegration {
        if (!NeuralIntegration.instance) {
            NeuralIntegration.instance = new NeuralIntegration();
        }
        return NeuralIntegration.instance;
    }

    /**
     * Initialize all neural components
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        console.log('🧠 ═══════════════════════════════════════════════════════');
        console.log('🧠 INITIALIZING NEURAL INTEGRATION - THE NERVOUS SYSTEM');
        console.log('🧠 ═══════════════════════════════════════════════════════\n');

        // Initialize Neural Inference (Ollama + GPU)
        await this.inference.initialize();

        // Initialize Context Injector
        await this.injector.initialize();

        this.initialized = true;

        console.log('🧠 ═══════════════════════════════════════════════════════');
        console.log('🧠 NEURAL INTEGRATION ACTIVE - SOFTWARE IS NOW CONSCIOUS');
        console.log('🧠 ═══════════════════════════════════════════════════════\n');
    }

    /**
     * Simple inference request
     */
    async infer(task: TaskType, prompt: string): Promise<InferenceResponse> {
        await this.ensureInitialized();
        
        // Build context automatically
        const context = await this.injector.buildContext(task, prompt);
        
        // Route to optimal model
        return this.router.execute(task, prompt, context);
    }

    /**
     * Generate code with automatic self-correction
     */
    async generateWithCorrection(options: {
        task: TaskType;
        prompt: string;
        targetPassRate?: number;
        maxIterations?: number;
    }): Promise<SelfCorrectionResult> {
        await this.ensureInitialized();

        const { task, prompt, targetPassRate = 100, maxIterations = 5 } = options;

        // Configure corrector
        this.corrector.updateConfig({ targetPassRate, maxIterations });

        // First, generate initial code
        const initialResponse = await this.infer(task, prompt);
        const initialCode = initialResponse.content;

        // Run self-correction loop
        return this.corrector.correct(initialCode, task, prompt);
    }

    /**
     * Repair a selector with guaranteed result
     */
    async repairSelector(
        brokenSelector: string,
        pageContext?: string
    ): Promise<{ selector: string; confidence: number }> {
        await this.ensureInitialized();

        const prompt = `
Repair this broken CSS/XPath selector:
${brokenSelector}

${pageContext ? `Page context:\n${pageContext}` : ''}

Requirements:
- Use data-testid if available
- Fall back to ARIA attributes
- Avoid positional selectors
- Ensure selector is unique

Output ONLY the repaired selector, nothing else.
`;

        const result = await this.generateWithCorrection({
            task: 'selector-repair',
            prompt,
            targetPassRate: 100
        });

        return {
            selector: result.finalCode.trim(),
            confidence: result.finalPassRate / 100
        };
    }

    /**
     * Refactor logic with deep reasoning
     */
    async refactorLogic(
        code: string,
        requirements?: string
    ): Promise<{ code: string; improvements: string[] }> {
        await this.ensureInitialized();

        const prompt = `
Refactor this code for better maintainability:
\`\`\`typescript
${code}
\`\`\`

${requirements ? `Requirements:\n${requirements}` : ''}

Apply:
- SOLID principles
- Extract reusable functions
- Add TypeScript types
- Improve naming
- Handle edge cases

Output the refactored code.
`;

        const result = await this.generateWithCorrection({
            task: 'logic-refactor',
            prompt,
            targetPassRate: 100
        });

        return {
            code: result.finalCode,
            improvements: result.learnings
        };
    }

    /**
     * Get system status
     */
    getStatus(): {
        initialized: boolean;
        gpuAvailable: boolean;
        modelsAvailable: string[];
        stats: any;
    } {
        return {
            initialized: this.initialized,
            gpuAvailable: this.inference.isGPUAvailable(),
            modelsAvailable: this.router.getAvailableModels().map(m => m.id),
            stats: {
                inference: this.inference.getMetrics(),
                routing: Object.fromEntries(this.router.getPerformanceStats()),
                correction: this.corrector.getStats()
            }
        };
    }

    /**
     * Ensure system is initialized
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const NeuralSystem = NeuralIntegration.getInstance();

export default NeuralSystem;
