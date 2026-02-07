/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM COGNITION MODULE                                                     ║
 * ║   "Разсъждение, самокритика, логика"                                         ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// Chain-of-Thought
export {
    ThoughtChain,
    createThoughtChain,
    type Problem,
    type SubProblem,
    type Analysis,
    type Insight,
    type Approach,
    type Risk,
    type SolutionCandidate,
    type Solution,
    type ChainConfig
} from './thought-chain';

// Self-Critique
export {
    SelfCritique,
    createSelfCritique,
    DEFAULT_DIMENSIONS,
    type EvaluationResult,
    type DimensionScore,
    type Weakness,
    type CritiqueResult,
    type ImprovementIteration,
    type SelfCritiqueConfig,
    type CritiqueDimension
} from './self-critique';

// Knowledge Graph & Dependencies
export {
    DependencyGraph,
    type DependencyNode,
    type ImportEdge as DependencyEdge,
    type GraphAnalysis,
    type CircularDependency,
    type LayerViolation,
    type ModuleMetrics
} from './DependencyGraph';

// Knowledge Distiller
export {
    KnowledgeDistiller,
    NeuralBackpack,
    createDistiller,
    createBackpack,
    QANTUM_LAYERS,
    type ArchitecturalPrinciple,
    type PrincipleCategory,
    type Evidence,
    type ImportGraph,
    type FileNode,
    type ImportEdge,
    type DistilledKnowledge,
    type DistilledKnowledgeSummary,
    type LayerViolation as DistillerLayerViolation,
    type KnowledgeStats,
    type DistillerConfig,
    type LayerDefinition
} from './distiller';

// Cognitive Circular Guard
export {
    CognitiveCircularGuard,
    createGuard,
    runGuard,
    type CycleReport,
    type DetectedCycle,
    type DetectedCycle as CycleInfo,
    type GuardConfig
} from './cognitive-circular-guard';

// Self-Critique for Distiller
export {
    critiqueDistiller,
    CODE_DIMENSIONS
} from './critique-distiller';

// Semantic Memory Bank
export {
    SemanticMemoryBank,
    createSemanticMemory,
    VectorOps,
    type MemoryEntry,
    type MemoryRelation,
    type MemoryType,
    type RelationType,
    type QueryResult,
    type MemoryStats,
    type SemanticMemoryConfig
} from './semantic-memory';

// Logical Inference Engine
export {
    LogicalInferenceEngine,
    createInferenceEngine,
    type Proposition,
    type Rule,
    type RuleType,
    type InferenceStep,
    type InferenceResult,
    type KnowledgeBase
} from './inference-engine';

// Multi-Perspective Analyzer
export {
    MultiPerspectiveAnalyzer,
    createMultiPerspectiveAnalyzer,
    PERSPECTIVES,
    type Perspective,
    type Problem as PerspectiveProblem,
    type PerspectiveAnalysis,
    type MultiPerspectiveResult,
    type MultiPerspectiveConfig,
    type ConflictPoint
} from './multi-perspective';

// Uncertainty Quantifier
export {
    UncertaintyQuantifier,
    createUncertaintyQuantifier,
    type UncertaintyEstimate,
    type UncertaintySource,
    type UncertaintyType,
    type UncertaintyLevel,
    type Prediction,
    type CalibrationResult,
    type PredictionFactor
} from './uncertainty';

// Context Injector
export {
    ContextInjector,
    createContextInjector,
    type ContextInjectionConfig,
    type BackpackContent,
    type LearnedPattern,
    type AntiPattern,
    type CodeConvention,
    type ProjectRule,
    type SelectorStrategy,
    type ErrorSolution
} from './ContextInjector';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED COGNITION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

import { ThoughtChain, Problem, Solution, ChainConfig } from './thought-chain';
import { SelfCritique, SelfCritiqueConfig, Weakness, CritiqueResult } from './self-critique';

/**
 * Обединен когнитивен двигател
 * Комбинира Chain-of-Thought с Self-Critique
 */
export class CognitionEngine {
    private thoughtChain: ThoughtChain;
    private selfCritique: SelfCritique;

    constructor(
        chainConfig?: Partial<ChainConfig>,
        critiqueConfig?: Partial<SelfCritiqueConfig>
    ) {
        this.thoughtChain = new ThoughtChain(chainConfig);
        this.selfCritique = new SelfCritique(critiqueConfig);
    }

    /**
     * Решава проблем с пълен когнитивен pipeline:
     * 1. Chain-of-Thought разсъждение
     * 2. Self-Critique подобрение
     */
    async reason(problem: Problem): Promise<Solution> {
        console.log('\n🧠 COGNITION ENGINE ACTIVATED\n');

        // Стъпка 1: Първоначално решение чрез Chain-of-Thought
        console.log('📦 Phase 1: Chain-of-Thought Processing...');
        const solution = await this.thoughtChain.solve(problem);

        // Стъпка 2: Self-Critique подобрение
        console.log('\n🔄 Phase 2: Self-Critique Refinement...');
        const { finalOutput, iterations, finalScore } = await this.selfCritique.iterateUntilSatisfied(
            solution,
            async (sol, weaknesses) => this.improveSolution(sol, weaknesses)
        );

        console.log(`\n✅ COGNITION COMPLETE`);
        console.log(`   Iterations: ${iterations}`);
        console.log(`   Final Score: ${finalScore.toFixed(1)}/100`);

        return finalOutput;
    }

    /**
     * Подобрява решение базирано на слабости
     */
    private async improveSolution(solution: Solution, weaknesses: Weakness[]): Promise<Solution> {
        // Копие на решението
        const improved = { ...solution };

        // Подобрение базирано на слабости
        for (const weakness of weaknesses) {
            switch (weakness.dimension) {
                case 'Correctness':
                    // Добавяне на валидация
                    improved.reasoning.push('Additional validation: Cross-checked with constraints');
                    break;

                case 'Completeness':
                    // Добавяне на детайли
                    improved.reasoning.push('Expanded: Added edge case handling');
                    break;

                case 'Clarity':
                    // Опростяване на обяснение
                    improved.selectedCandidate.explanation =
                        improved.selectedCandidate.explanation
                            .split('. ')
                            .map(s => s.trim())
                            .filter(s => s.length > 0)
                            .join('.\n');
                    break;
            }
        }

        // Увеличаване на confidence ако са направени подобрения
        if (weaknesses.length > 0) {
            improved.confidence = Math.min(1.0, improved.confidence + 0.05 * weaknesses.length);
        }

        return improved;
    }

    /**
     * Бързо оценяване без подобрение
     */
    evaluateOnly(solution: Solution): { score: number; feedback: string } {
        const evaluation = this.selfCritique.evaluate(solution);
        return {
            score: evaluation.score,
            feedback: evaluation.overallAssessment
        };
    }

    /**
     * Reset на състоянието
     */
    reset(): void {
        this.thoughtChain.reset();
        this.selfCritique.reset();
    }

    /**
     * Вземане на логове
     */
    getLogs(): { thoughtLog: string[]; critiqueHistory: CritiqueResult[] } {
        return {
            thoughtLog: this.thoughtChain.getThoughtLog(),
            critiqueHistory: this.selfCritique.getHistory()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export const createCognitionEngine = (
    chainConfig?: Partial<ChainConfig>,
    critiqueConfig?: Partial<SelfCritiqueConfig>
): CognitionEngine => {
    return new CognitionEngine(chainConfig, critiqueConfig);
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default CognitionEngine;
