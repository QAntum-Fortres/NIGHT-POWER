/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM MULTI-PERSPECTIVE ANALYZER                                           ║
 * ║   "Разглеждане на проблеми от множество гледни точки"                        ║
 * ║                                                                               ║
 * ║   TODO A #6 - Multi-Perspective Analysis                                      ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ТИПОВЕ
// ═══════════════════════════════════════════════════════════════════════════════

export interface Perspective {
    id: string;
    name: string;
    description: string;
    biases: string[];
    strengths: string[];
    analyzeFunc: (problem: Problem) => PerspectiveAnalysis;
}

export interface Problem {
    statement: string;
    domain: string;
    constraints: string[];
    context: Record<string, unknown>;
}

export interface PerspectiveAnalysis {
    perspectiveId: string;
    interpretation: string;
    insights: string[];
    blindSpots: string[];
    suggestedActions: string[];
    confidence: number;
    reasoning: string;
}

export interface MultiPerspectiveResult {
    problem: Problem;
    analyses: PerspectiveAnalysis[];
    synthesis: {
        commonInsights: string[];
        conflicts: ConflictPoint[];
        recommendation: string;
        confidence: number;
    };
    meta: {
        perspectivesUsed: number;
        processingTime: number;
        dominantPerspective: string;
    };
}

export interface ConflictPoint {
    description: string;
    perspectives: string[];
    resolution: string | null;
    importance: 'high' | 'medium' | 'low';
}

export interface MultiPerspectiveConfig {
    enabledPerspectives?: string[];
    maxPerspectives?: number;
    synthesizeConflicts?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN PERSPECTIVES
// ═══════════════════════════════════════════════════════════════════════════════

const PERSPECTIVES: Perspective[] = [
    // ─────────────────────────────────────────────────────────────────────────
    // OPTIMIST - Вижда възможности
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'optimist',
        name: 'Optimist',
        description: 'Focuses on opportunities and positive outcomes',
        biases: ['May underestimate risks', 'Tends to ignore potential failures'],
        strengths: ['Identifies opportunities', 'Motivating perspective', 'Sees potential'],
        analyzeFunc: (problem: Problem): PerspectiveAnalysis => {
            const insights: string[] = [];
            const actions: string[] = [];

            // Анализ на възможности
            if (problem.constraints.length > 0) {
                insights.push(`Constraints can be opportunities: ${problem.constraints[0]} could lead to innovation`);
            }
            insights.push('This problem opens doors for growth and improvement');
            insights.push('Success in solving this will strengthen future capabilities');

            actions.push('Start with small wins to build momentum');
            actions.push('Focus on what can be done, not limitations');
            actions.push('Celebrate progress along the way');

            return {
                perspectiveId: 'optimist',
                interpretation: `This is an opportunity to ${problem.statement.toLowerCase().replace(/problem|issue|bug/gi, 'improve')}`,
                insights,
                blindSpots: ['May miss critical risks', 'Could underestimate complexity'],
                suggestedActions: actions,
                confidence: 0.75,
                reasoning: 'Optimistic view emphasizes potential positive outcomes'
            };
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PESSIMIST - Вижда рискове
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'pessimist',
        name: 'Pessimist / Devil\'s Advocate',
        description: 'Identifies risks, failures, and worst-case scenarios',
        biases: ['May miss opportunities', 'Can be demotivating'],
        strengths: ['Risk identification', 'Thorough analysis', 'Prevents disasters'],
        analyzeFunc: (problem: Problem): PerspectiveAnalysis => {
            const insights: string[] = [];
            const actions: string[] = [];

            insights.push('What could go wrong will go wrong - plan for it');
            insights.push(`Hidden dependencies in ${problem.domain} could cause cascading failures`);
            insights.push('Current approach might not scale');

            actions.push('Create comprehensive fallback plans');
            actions.push('Test edge cases extensively');
            actions.push('Document all assumptions for future review');
            actions.push('Set up monitoring for early warning signs');

            return {
                perspectiveId: 'pessimist',
                interpretation: `Critical risks in "${problem.statement}" that need immediate attention`,
                insights,
                blindSpots: ['May miss valid opportunities', 'Can cause analysis paralysis'],
                suggestedActions: actions,
                confidence: 0.85,
                reasoning: 'Pessimistic view emphasizes risk mitigation'
            };
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // ENGINEER - Практически подход
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'engineer',
        name: 'Engineer / Pragmatist',
        description: 'Focuses on practical, implementable solutions',
        biases: ['May over-simplify', 'Prefers known patterns'],
        strengths: ['Actionable solutions', 'Realistic timelines', 'Proven methods'],
        analyzeFunc: (problem: Problem): PerspectiveAnalysis => {
            const insights: string[] = [];
            const actions: string[] = [];

            insights.push('Break the problem into smaller, manageable components');
            insights.push('Existing solutions can likely be adapted');
            insights.push('Focus on MVP first, optimize later');

            const constraintCount = problem.constraints.length;
            if (constraintCount > 3) {
                insights.push('High constraint count suggests need for phased approach');
            }

            actions.push('Define clear acceptance criteria');
            actions.push('Create prototype within 2-day sprint');
            actions.push('Iterate based on feedback');
            actions.push('Document technical decisions');

            return {
                perspectiveId: 'engineer',
                interpretation: `Technical solution for "${problem.statement}" with ${constraintCount} constraints`,
                insights,
                blindSpots: ['May miss business context', 'Could ignore user experience'],
                suggestedActions: actions,
                confidence: 0.9,
                reasoning: 'Engineering view emphasizes practical implementation'
            };
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // USER - Фокус върху потребителя
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'user',
        name: 'User Advocate',
        description: 'Focuses on user experience and needs',
        biases: ['May ignore technical constraints', 'Can be idealistic'],
        strengths: ['User-centric', 'Experience-focused', 'Empathetic'],
        analyzeFunc: (problem: Problem): PerspectiveAnalysis => {
            const insights: string[] = [];
            const actions: string[] = [];

            insights.push('How does this affect the person using it?');
            insights.push('Simplicity is more important than features');
            insights.push('Users will find workarounds if the solution is too complex');

            actions.push('Interview actual users about their needs');
            actions.push('Create user journey maps');
            actions.push('Test with real users early and often');
            actions.push('Prioritize intuitive over powerful');

            return {
                perspectiveId: 'user',
                interpretation: `User impact of "${problem.statement}"`,
                insights,
                blindSpots: ['May underestimate technical complexity', 'Could ignore system constraints'],
                suggestedActions: actions,
                confidence: 0.8,
                reasoning: 'User-centric view emphasizes experience and accessibility'
            };
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // STRATEGIST - Дългосрочен изглед
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'strategist',
        name: 'Strategist',
        description: 'Focuses on long-term implications and systemic effects',
        biases: ['May ignore immediate needs', 'Can be too abstract'],
        strengths: ['Big picture', 'Future planning', 'Systemic thinking'],
        analyzeFunc: (problem: Problem): PerspectiveAnalysis => {
            const insights: string[] = [];
            const actions: string[] = [];

            insights.push('How does this fit into the larger vision?');
            insights.push('Decisions now will compound over time');
            insights.push('Consider second and third-order effects');
            insights.push(`${problem.domain} trends suggest future evolution of this problem`);

            actions.push('Map this to strategic objectives');
            actions.push('Consider impact on other initiatives');
            actions.push('Build for extensibility, not just current needs');
            actions.push('Document the strategic rationale');

            return {
                perspectiveId: 'strategist',
                interpretation: `Strategic implications of "${problem.statement}" in ${problem.domain}`,
                insights,
                blindSpots: ['May miss tactical details', 'Can delay immediate action'],
                suggestedActions: actions,
                confidence: 0.7,
                reasoning: 'Strategic view emphasizes long-term positioning'
            };
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SCIENTIST - Емпиричен подход
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'scientist',
        name: 'Scientist / Empiricist',
        description: 'Focuses on evidence, testing, and measurable outcomes',
        biases: ['May over-rely on data', 'Can be slow to act'],
        strengths: ['Evidence-based', 'Objective', 'Measurable'],
        analyzeFunc: (problem: Problem): PerspectiveAnalysis => {
            const insights: string[] = [];
            const actions: string[] = [];

            insights.push('What data do we have? What do we need?');
            insights.push('Hypothesis: The root cause might not be what it appears');
            insights.push('We need controlled experiments to validate assumptions');

            actions.push('Define metrics for success');
            actions.push('Set up A/B testing framework');
            actions.push('Collect baseline measurements');
            actions.push('Design experiments with control groups');

            return {
                perspectiveId: 'scientist',
                interpretation: `Empirical analysis of "${problem.statement}"`,
                insights,
                blindSpots: ['May delay action for perfect data', 'Can miss intuitive solutions'],
                suggestedActions: actions,
                confidence: 0.85,
                reasoning: 'Scientific view emphasizes evidence and measurement'
            };
        }
    }
];

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-PERSPECTIVE ANALYZER
// ═══════════════════════════════════════════════════════════════════════════════

export class MultiPerspectiveAnalyzer {
    private perspectives: Perspective[] = [...PERSPECTIVES];

    constructor() { }

    // ─────────────────────────────────────────────────────────────────────────
    // АНАЛИЗ
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Анализира проблем от множество гледни точки
     */
    analyze(problem: Problem, selectedPerspectives?: string[]): MultiPerspectiveResult {
        const startTime = Date.now();

        // Избиране на перспективи
        const perspectivesToUse = selectedPerspectives
            ? this.perspectives.filter(p => selectedPerspectives.includes(p.id))
            : this.perspectives;

        // Анализ от всяка перспектива
        const analyses: PerspectiveAnalysis[] = perspectivesToUse.map(p => p.analyzeFunc(problem));

        // Синтез на резултатите
        const synthesis = this.synthesize(analyses);

        // Намиране на доминираща перспектива
        const dominant = analyses.reduce((best, curr) =>
            curr.confidence > best.confidence ? curr : best
        );

        return {
            problem,
            analyses,
            synthesis,
            meta: {
                perspectivesUsed: perspectivesToUse.length,
                processingTime: Date.now() - startTime,
                dominantPerspective: dominant.perspectiveId
            }
        };
    }

    /**
     * Бърз анализ само от 2 противоположни перспективи
     */
    quickDual(problem: Problem): MultiPerspectiveResult {
        return this.analyze(problem, ['optimist', 'pessimist']);
    }

    /**
     * Балансиран анализ от 3 ключови перспективи
     */
    balanced(problem: Problem): MultiPerspectiveResult {
        return this.analyze(problem, ['engineer', 'user', 'strategist']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ДОБАВЯНЕ НА ПЕРСПЕКТИВИ
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Добавяне на custom перспектива
     */
    addPerspective(perspective: Perspective): void {
        if (!this.perspectives.find(p => p.id === perspective.id)) {
            this.perspectives.push(perspective);
        }
    }

    /**
     * Списък на всички перспективи
     */
    listPerspectives(): { id: string; name: string; description: string }[] {
        return this.perspectives.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description
        }));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // СИНТЕЗ
    // ─────────────────────────────────────────────────────────────────────────

    private synthesize(analyses: PerspectiveAnalysis[]): MultiPerspectiveResult['synthesis'] {
        // Намиране на общи insights
        const allInsights = analyses.flatMap(a => a.insights);
        const insightCounts = new Map<string, number>();
        for (const insight of allInsights) {
            const key = this.normalizeText(insight);
            insightCounts.set(key, (insightCounts.get(key) || 0) + 1);
        }
        const commonInsights = [...insightCounts.entries()]
            .filter(([, count]) => count > 1)
            .map(([key]) => key);

        // Намиране на конфликти
        const conflicts = this.findConflicts(analyses);

        // Генериране на препоръка
        const recommendation = this.generateRecommendation(analyses, commonInsights, conflicts);

        // Изчисляване на overall confidence
        const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
        const conflictPenalty = conflicts.filter(c => c.importance === 'high').length * 0.1;

        return {
            commonInsights,
            conflicts,
            recommendation,
            confidence: Math.max(0.3, avgConfidence - conflictPenalty)
        };
    }

    private findConflicts(analyses: PerspectiveAnalysis[]): ConflictPoint[] {
        const conflicts: ConflictPoint[] = [];

        // Сравняване на всеки анализ с всеки друг
        for (let i = 0; i < analyses.length; i++) {
            for (let j = i + 1; j < analyses.length; j++) {
                const a1 = analyses[i];
                const a2 = analyses[j];

                // Проверка за противоречиви actions
                const conflictingActions = this.findContradictions(
                    a1.suggestedActions,
                    a2.suggestedActions
                );

                if (conflictingActions.length > 0) {
                    conflicts.push({
                        description: `${a1.perspectiveId} vs ${a2.perspectiveId}: ${conflictingActions[0]}`,
                        perspectives: [a1.perspectiveId, a2.perspectiveId],
                        resolution: this.suggestResolution(a1, a2, conflictingActions[0]),
                        importance: this.assessImportance(conflictingActions[0])
                    });
                }
            }
        }

        return conflicts;
    }

    private findContradictions(actions1: string[], actions2: string[]): string[] {
        const contradictions: string[] = [];
        const opposites: [string, string][] = [
            ['fast', 'slow'],
            ['simple', 'complex'],
            ['more', 'less'],
            ['start', 'wait'],
            ['build', 'buy'],
            ['short-term', 'long-term']
        ];

        for (const a1 of actions1) {
            for (const a2 of actions2) {
                for (const [pos, neg] of opposites) {
                    if (
                        (a1.toLowerCase().includes(pos) && a2.toLowerCase().includes(neg)) ||
                        (a1.toLowerCase().includes(neg) && a2.toLowerCase().includes(pos))
                    ) {
                        contradictions.push(`"${a1}" vs "${a2}"`);
                    }
                }
            }
        }

        return contradictions;
    }

    private suggestResolution(a1: PerspectiveAnalysis, a2: PerspectiveAnalysis, conflict: string): string {
        // Prefer higher confidence perspective
        if (a1.confidence > a2.confidence + 0.2) {
            return `Lean towards ${a1.perspectiveId} approach due to higher confidence`;
        } else if (a2.confidence > a1.confidence + 0.2) {
            return `Lean towards ${a2.perspectiveId} approach due to higher confidence`;
        }
        return 'Seek compromise or test both approaches';
    }

    private assessImportance(conflict: string): 'high' | 'medium' | 'low' {
        const highPriority = ['critical', 'urgent', 'immediately', 'must'];
        const lowPriority = ['optional', 'might', 'consider'];

        const lower = conflict.toLowerCase();
        if (highPriority.some(w => lower.includes(w))) return 'high';
        if (lowPriority.some(w => lower.includes(w))) return 'low';
        return 'medium';
    }

    private generateRecommendation(
        analyses: PerspectiveAnalysis[],
        commonInsights: string[],
        conflicts: ConflictPoint[]
    ): string {
        const lines: string[] = [];

        if (commonInsights.length > 0) {
            lines.push(`All perspectives agree: ${commonInsights[0]}`);
        }

        // Find highest confidence actions
        const allActions = analyses
            .flatMap(a => a.suggestedActions.map(act => ({ action: act, confidence: a.confidence })))
            .sort((a, b) => b.confidence - a.confidence);

        if (allActions.length > 0) {
            lines.push(`Recommended first step: ${allActions[0].action}`);
        }

        if (conflicts.length > 0) {
            lines.push(`Note: ${conflicts.length} perspective conflict(s) require attention`);
        }

        return lines.join('. ');
    }

    private normalizeText(text: string): string {
        return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const createMultiPerspectiveAnalyzer = (): MultiPerspectiveAnalyzer => {
    return new MultiPerspectiveAnalyzer();
};

export { PERSPECTIVES };
export default MultiPerspectiveAnalyzer;
