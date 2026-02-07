
import { Solution } from './thought-chain';

export type CritiqueDimension = 'Correctness' | 'Completeness' | 'Clarity';

export const DEFAULT_DIMENSIONS: CritiqueDimension[] = ['Correctness', 'Completeness', 'Clarity'];

export interface Weakness {
    dimension: CritiqueDimension;
    description: string;
}

export interface DimensionScore {
    dimension: CritiqueDimension;
    score: number;
    reasoning: string;
}

export interface EvaluationResult {
    score: number;
    scores: DimensionScore[];
    weaknesses: Weakness[];
    overallAssessment: string;
}

export interface CritiqueResult {
    evaluation: EvaluationResult;
}

export interface ImprovementIteration {
    iteration: number;
}

export interface SelfCritiqueConfig {
    maxIterations?: number;
}

export class SelfCritique {
    constructor(config?: Partial<SelfCritiqueConfig>) { }

    async iterateUntilSatisfied(
        solution: Solution,
        improver: (sol: Solution, weaknesses: Weakness[]) => Promise<Solution>
    ): Promise<{ finalOutput: Solution; iterations: number; finalScore: number }> {
        return {
            finalOutput: solution,
            iterations: 1,
            finalScore: 100
        };
    }

    evaluate(solution: Solution): EvaluationResult {
        return {
            score: 100,
            scores: [],
            weaknesses: [],
            overallAssessment: "Perfect"
        };
    }

    reset(): void { }

    getHistory(): any[] { return []; }
}

export function createSelfCritique(config?: Partial<SelfCritiqueConfig>) {
    return new SelfCritique(config);
}
