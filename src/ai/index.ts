/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM AI MODULE                                                            ║
 * ║   "Intelligence at the Core of Testing"                                       ║
 * ║                                                                               ║
 * ║   TODO B #34-36 - Complete AI System                                          ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// RE-EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export * from './neural';
export * from './pattern-recognizer';
export * from './self-healing';

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════════════════════

import { 
    NeuralNetwork, 
    TestIntelligence, 
    getTestIntelligence,
    Activations,
    TrainingConfig,
    TrainingResult,
    Prediction
} from './neural';

import { 
    PatternRecognizer, 
    getPatternRecognizer,
    FeatureExtractor,
    SimilarityMetrics,
    Pattern,
    PatternType,
    PatternMatch,
    PatternCluster,
    RecognitionResult
} from './pattern-recognizer';

import { 
    SelfHealingEngine, 
    getSelfHealingEngine,
    SelectorGenerator,
    HealingStrategy,
    FailureContext,
    HealingResult,
    SelfHeal
} from './self-healing';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED AI FACADE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Unified AI - Intelligence Hub
 */
export class QAntumAI {
    private static instance: QAntumAI;

    private intelligence: TestIntelligence;
    private patternRecognizer: PatternRecognizer;
    private selfHealing: SelfHealingEngine;

    private constructor() {
        this.intelligence = getTestIntelligence();
        this.patternRecognizer = getPatternRecognizer();
        this.selfHealing = getSelfHealingEngine();
    }

    static getInstance(): QAntumAI {
        if (!QAntumAI.instance) {
            QAntumAI.instance = new QAntumAI();
        }
        return QAntumAI.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST INTELLIGENCE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Predict if a test will fail
     */
    async predictFailure(execution: {
        duration: number;
        avgDuration: number;
        passed: boolean;
        retries: number;
        errorType?: string;
        timeOfDay?: number;
        dayOfWeek?: number;
    }): Promise<{ willFail: boolean; confidence: number }> {
        const features = FeatureExtractor.fromExecution({
            ...execution,
            timeOfDay: execution.timeOfDay ?? new Date().getHours(),
            dayOfWeek: execution.dayOfWeek ?? new Date().getDay()
        });

        return this.intelligence.predictFailure(features);
    }

    /**
     * Calculate test priority
     */
    async calculatePriority(execution: {
        duration: number;
        avgDuration: number;
        passed: boolean;
        retries: number;
    }): Promise<{ priority: number; reason: string }> {
        const features = FeatureExtractor.fromExecution({
            ...execution,
            timeOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay()
        });

        return this.intelligence.calculatePriority(features);
    }

    /**
     * Detect flaky test
     */
    async detectFlakiness(execution: {
        duration: number;
        avgDuration: number;
        passed: boolean;
        retries: number;
    }): Promise<{ isFlaky: boolean; score: number }> {
        const features = FeatureExtractor.fromExecution({
            ...execution,
            timeOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay()
        });

        return this.intelligence.detectFlakiness(features);
    }

    /**
     * Train from historical data
     */
    async trainFromHistory(
        data: Array<{ features: number[]; outcome: 'pass' | 'fail' | 'flaky' }>
    ): Promise<void> {
        return this.intelligence.trainFromHistory(data);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATTERN RECOGNITION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Learn from failure
     */
    learnFromFailure(
        execution: {
            duration: number;
            avgDuration: number;
            retries: number;
            errorType?: string;
        },
        type: PatternType = 'failure'
    ): Pattern {
        const features = FeatureExtractor.fromExecution({
            ...execution,
            passed: false,
            timeOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay()
        });

        return this.patternRecognizer.learn(features, type);
    }

    /**
     * Recognize pattern in failure
     */
    recognizePattern(execution: {
        duration: number;
        avgDuration: number;
        retries: number;
        errorType?: string;
    }): RecognitionResult {
        const features = FeatureExtractor.fromExecution({
            ...execution,
            passed: false,
            timeOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay()
        });

        return this.patternRecognizer.recognize(features);
    }

    /**
     * Get similar patterns
     */
    findSimilarPatterns(
        errorMessage: string,
        limit: number = 5
    ): PatternMatch[] {
        const features = FeatureExtractor.fromError(errorMessage);
        const result = this.patternRecognizer.recognize(features);
        return result.matches.slice(0, limit);
    }

    /**
     * Cluster patterns
     */
    clusterPatterns(k: number = 5): PatternCluster[] {
        return this.patternRecognizer.cluster(k);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SELF-HEALING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Heal a test failure
     */
    async healFailure(failure: FailureContext): Promise<HealingResult> {
        return this.selfHealing.heal(failure);
    }

    /**
     * Heal with retry
     */
    async healWithRetry(
        failure: FailureContext,
        executor: (selector: string) => Promise<void>,
        maxRetries?: number
    ): Promise<boolean> {
        return this.selfHealing.healWithRetry(failure, executor, maxRetries);
    }

    /**
     * Register custom healing strategy
     */
    registerHealingStrategy(strategy: HealingStrategy): void {
        this.selfHealing.registerStrategy(strategy);
    }

    /**
     * Get healing statistics
     */
    getHealingStats(): {
        totalHealings: number;
        successfulHealings: number;
        byStrategy: Record<string, number>;
        mostHealedTests: Array<{ testId: string; count: number }>;
    } {
        return this.selfHealing.getStatistics();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEURAL NETWORK UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create a custom neural network
     */
    createNetwork(inputSize: number): NeuralNetwork {
        return new NeuralNetwork(inputSize);
    }

    /**
     * Train a custom network
     */
    async trainNetwork(
        network: NeuralNetwork,
        inputs: number[][],
        labels: number[],
        config?: Partial<TrainingConfig>
    ): Promise<TrainingResult> {
        return network.train(inputs, labels, config);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ANALYSIS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Analyze test suite health
     */
    async analyzeTestSuiteHealth(
        tests: Array<{
            name: string;
            runs: Array<{
                passed: boolean;
                duration: number;
                error?: string;
            }>;
        }>
    ): Promise<{
        overallHealth: number;
        flakyTests: string[];
        slowTests: string[];
        failingPatterns: RecognitionResult[];
        recommendations: string[];
    }> {
        const flakyTests: string[] = [];
        const slowTests: string[] = [];
        const failingPatterns: RecognitionResult[] = [];
        const recommendations: string[] = [];

        let totalPassed = 0;
        let totalRuns = 0;

        for (const test of tests) {
            const passRate = test.runs.filter(r => r.passed).length / test.runs.length;
            const avgDuration = test.runs.reduce((sum, r) => sum + r.duration, 0) / test.runs.length;
            
            totalPassed += test.runs.filter(r => r.passed).length;
            totalRuns += test.runs.length;

            // Detect flaky (passes sometimes, fails sometimes)
            if (passRate > 0.1 && passRate < 0.9) {
                flakyTests.push(test.name);
            }

            // Detect slow (>2x average)
            const globalAvg = tests.reduce((sum, t) => 
                sum + t.runs.reduce((s, r) => s + r.duration, 0) / t.runs.length, 0) / tests.length;
            
            if (avgDuration > globalAvg * 2) {
                slowTests.push(test.name);
            }

            // Analyze failures
            for (const run of test.runs.filter(r => !r.passed && r.error)) {
                const features = FeatureExtractor.fromError(run.error!);
                const pattern = this.patternRecognizer.recognize(features);
                if (pattern.matches.length > 0) {
                    failingPatterns.push(pattern);
                }
            }
        }

        // Generate recommendations
        if (flakyTests.length > 0) {
            recommendations.push(`${flakyTests.length} flaky tests detected - consider adding retries or stabilizing`);
        }
        if (slowTests.length > 0) {
            recommendations.push(`${slowTests.length} slow tests detected - consider optimization or parallelization`);
        }
        if (totalPassed / totalRuns < 0.95) {
            recommendations.push('Overall pass rate is below 95% - review failing patterns');
        }

        return {
            overallHealth: totalPassed / totalRuns,
            flakyTests,
            slowTests,
            failingPatterns,
            recommendations
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Extract features from execution
     */
    extractFeatures(execution: {
        duration: number;
        avgDuration: number;
        passed: boolean;
        retries: number;
        errorType?: string;
        timeOfDay?: number;
        dayOfWeek?: number;
        memoryUsage?: number;
        cpuUsage?: number;
    }): number[] {
        return FeatureExtractor.fromExecution({
            ...execution,
            timeOfDay: execution.timeOfDay ?? new Date().getHours(),
            dayOfWeek: execution.dayOfWeek ?? new Date().getDay()
        });
    }

    /**
     * Calculate similarity between feature vectors
     */
    calculateSimilarity(a: number[], b: number[]): number {
        return SimilarityMetrics.cosine(a, b);
    }

    /**
     * Clear all AI data
     */
    reset(): void {
        this.patternRecognizer.clear();
        this.selfHealing.clearHistory();
        this.selfHealing.clearCache();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const qantumAI = QAntumAI.getInstance();

// Re-export classes
export {
    NeuralNetwork,
    TestIntelligence,
    PatternRecognizer,
    SelfHealingEngine,
    FeatureExtractor,
    SimilarityMetrics,
    SelectorGenerator,
    Activations
};

// Re-export types
export type {
    TrainingConfig,
    TrainingResult,
    Prediction,
    Pattern,
    PatternType,
    PatternMatch,
    PatternCluster,
    RecognitionResult,
    HealingStrategy,
    FailureContext,
    HealingResult
};

// Re-export decorators
export { SelfHeal };

export default QAntumAI;
