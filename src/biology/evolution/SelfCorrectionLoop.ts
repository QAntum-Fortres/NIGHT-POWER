/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                               ║
 * ║  ███████╗███████╗██╗     ███████╗       ██████╗ ██████╗ ██████╗ ██████╗ ███████╗ ██████╗████████╗║
 * ║  ██╔════╝██╔════╝██║     ██╔════╝      ██╔════╝██╔═══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝╚══██╔══╝║
 * ║  ███████╗█████╗  ██║     █████╗  █████╗██║     ██║   ██║██████╔╝██████╔╝█████╗  ██║        ██║   ║
 * ║  ╚════██║██╔══╝  ██║     ██╔══╝  ╚════╝██║     ██║   ██║██╔══██╗██╔══██╗██╔══╝  ██║        ██║   ║
 * ║  ███████║███████╗███████╗██║           ╚██████╗╚██████╔╝██║  ██║██║  ██║███████╗╚██████╗   ██║   ║
 * ║  ╚══════╝╚══════╝╚══════╝╚═╝            ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝   ╚═╝   ║
 * ║                                                                                               ║
 * ║  ██╗      ██████╗  ██████╗ ██████╗                                                            ║
 * ║  ██║     ██╔═══██╗██╔═══██╗██╔══██╗                                                           ║
 * ║  ██║     ██║   ██║██║   ██║██████╔╝                                                           ║
 * ║  ██║     ██║   ██║██║   ██║██╔═══╝                                                            ║
 * ║  ███████╗╚██████╔╝╚██████╔╝██║                                                                ║
 * ║  ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝                                                                ║
 * ║                                                                                               ║
 * ║                    NEURAL INTEGRATION - SELF-CORRECTION LOOP                                  ║
 * ║              "Автоматично поправяне докато не се постигне 100% Pass Rate"                     ║
 * ║                                                                                               ║
 * ║   Features:                                                                                   ║
 * ║     • AI generates code → System validates                                                    ║
 * ║     • If errors → Feed errors back to AI for correction                                       ║
 * ║     • Repeat until 100% Pass Rate or max iterations                                           ║
 * ║     • Learn from successful corrections                                                       ║
 * ║                                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                                        ║
 * ║                                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';
import {
    NeuralInference,
    InferenceResult
} from '../../physics/NeuralInference';
import { BrainRouter } from '../evolution/BrainRouter';
import { ContextInjector } from '../../cognition/ContextInjector';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES - Self-Correction Interface
// ═══════════════════════════════════════════════════════════════════════════════

export type TaskType = 'code-generation' | 'bug-fix' | 'test-generation' | 'optimization' | 'security-audit' | 'selector-repair' | 'logic-refactor';

export interface AttemptHistory {
    attempt: number;
    code: string;
    errors: string[];
    passRate: number;
    timestamp: number;
}

export interface ErrorContext {
    message: string;
    line?: number;
    file?: string;
}

/**
 * Validation result from code analysis
 */
export interface ValidationResult {
    passed: boolean;
    passRate: number;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    metrics: ValidationMetrics;
}

/**
 * Validation error
 */
export interface ValidationError {
    type: 'syntax' | 'type' | 'runtime' | 'lint' | 'test' | 'logic';
    message: string;
    file?: string;
    line?: number;
    column?: number;
    code?: string;
    suggestion?: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
    type: string;
    message: string;
    file?: string;
    line?: number;
}

/**
 * Validation metrics
 */
export interface ValidationMetrics {
    syntaxErrors: number;
    typeErrors: number;
    lintErrors: number;
    testFailures: number;
    codeSmells: number;
    coverage?: number;
}

/**
 * Correction attempt record
 */
export interface CorrectionAttempt {
    iteration: number;
    timestamp: number;
    code: string;
    validation: ValidationResult;
    aiResponse?: InferenceResult;
    duration: number;
}

/**
 * Self-correction result
 */
export interface SelfCorrectionResult {
    success: boolean;
    finalCode: string;
    finalPassRate: number;
    totalIterations: number;
    totalDuration: number;
    attempts: CorrectionAttempt[];
    learnings: string[];
}

/**
 * Self-correction configuration
 */
export interface SelfCorrectionConfig {
    maxIterations: number;
    targetPassRate: number;
    validationTimeout: number;
    enableTypeCheck: boolean;
    enableLinting: boolean;
    enableTests: boolean;
    learningEnabled: boolean;
    progressiveTemperature: boolean;
}

/**
 * Code validator interface
 */
export interface CodeValidator {
    validate(code: string, language: string): Promise<ValidationResult>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: SelfCorrectionConfig = {
    maxIterations: 5,
    targetPassRate: 100,
    validationTimeout: 30000,
    enableTypeCheck: true,
    enableLinting: true,
    enableTests: true,
    learningEnabled: true,
    progressiveTemperature: true
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TypeScriptValidator - Built-in code validation
 */
export class TypeScriptValidator implements CodeValidator {
    async validate(code: string, language: string = 'typescript'): Promise<ValidationResult> {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        // Syntax validation
        const syntaxErrors = this.checkSyntax(code);
        errors.push(...syntaxErrors);

        // Type validation (simulated)
        const typeErrors = this.checkTypes(code);
        errors.push(...typeErrors);

        // Lint validation
        const lintErrors = this.checkLint(code);
        errors.push(...lintErrors);

        // Calculate pass rate
        const totalChecks = 10; // Simplified
        const failedChecks = errors.length;
        const passRate = Math.max(0, ((totalChecks - failedChecks) / totalChecks) * 100);

        return {
            passed: errors.length === 0,
            passRate,
            errors,
            warnings,
            metrics: {
                syntaxErrors: syntaxErrors.length,
                typeErrors: typeErrors.length,
                lintErrors: lintErrors.length,
                testFailures: 0,
                codeSmells: warnings.length
            }
        };
    }

    private checkSyntax(code: string): ValidationError[] {
        const errors: ValidationError[] = [];

        // Check for unmatched brackets
        const brackets = { '(': ')', '[': ']', '{': '}' };
        const stack: string[] = [];

        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            if (char in brackets) {
                stack.push(char);
            } else if (Object.values(brackets).includes(char)) {
                const expected = stack.pop();
                if (!expected || brackets[expected as keyof typeof brackets] !== char) {
                    errors.push({
                        type: 'syntax',
                        message: `Unmatched bracket '${char}' at position ${i}`,
                        code: code.slice(Math.max(0, i - 20), i + 20)
                    });
                }
            }
        }

        if (stack.length > 0) {
            errors.push({
                type: 'syntax',
                message: `Unclosed brackets: ${stack.join(', ')}`,
                suggestion: 'Add missing closing brackets'
            });
        }

        // Check for common syntax issues
        if (code.includes(';;')) {
            errors.push({
                type: 'syntax',
                message: 'Double semicolon detected',
                suggestion: 'Remove extra semicolon'
            });
        }

        if (/=\s*=\s*=/.test(code) === false && /[^!=<>]==[^=]/.test(code)) {
            // Allow === but warn about ==
            // This is simplified, real implementation would use AST
        }

        return errors;
    }

    private checkTypes(code: string): ValidationError[] {
        const errors: ValidationError[] = [];

        // Check for any type usage
        const anyMatches = code.match(/:\s*any\b/g);
        if (anyMatches && anyMatches.length > 3) {
            errors.push({
                type: 'type',
                message: `Excessive use of 'any' type (${anyMatches.length} occurrences)`,
                suggestion: 'Replace any with specific types'
            });
        }

        // Check for missing return types on functions
        const funcWithoutReturn = /function\s+\w+\s*\([^)]*\)\s*{/g;
        const arrowWithoutReturn = /=>\s*{/g;
        // Simplified check - real implementation would use TypeScript compiler

        return errors;
    }

    private checkLint(code: string): ValidationError[] {
        const errors: ValidationError[] = [];

        // Check for console.log in production code
        if (code.includes('console.log') && !code.includes('// debug')) {
            errors.push({
                type: 'lint',
                message: 'console.log detected in code',
                suggestion: 'Remove or wrap in debug condition'
            });
        }

        // Check for TODO comments
        const todoMatches = code.match(/\/\/\s*TODO/gi);
        if (todoMatches && todoMatches.length > 0) {
            // Warning, not error
        }

        // Check for very long lines
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].length > 150) {
                errors.push({
                    type: 'lint',
                    message: `Line ${i + 1} exceeds 150 characters`,
                    line: i + 1,
                    suggestion: 'Break into multiple lines'
                });
            }
        }

        return errors;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELF-CORRECTION LOOP
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SelfCorrectionLoop - Automatic Error Correction
 * 
 * Implements the "Self-Critique Loop" that:
 * 1. Receives AI-generated code
 * 2. Validates it for errors
 * 3. If errors found, feeds them back to AI
 * 4. Repeats until 100% Pass Rate or max iterations
 * 5. Learns from successful corrections
 */
export class SelfCorrectionLoop extends EventEmitter {
    private static instance: SelfCorrectionLoop;

    private config: SelfCorrectionConfig;
    private neuralInference: NeuralInference;
    private brainRouter: BrainRouter;
    private contextInjector: ContextInjector;
    private validator: CodeValidator;

    // Statistics
    private stats = {
        totalCorrections: 0,
        successfulCorrections: 0,
        averageIterations: 0,
        averagePassRateImprovement: 0
    };

    private constructor(config: Partial<SelfCorrectionConfig> = {}) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.neuralInference = NeuralInference.getInstance();
        this.brainRouter = BrainRouter.getInstance();
        this.contextInjector = ContextInjector.getInstance();
        this.validator = new TypeScriptValidator();
    }

    /**
     * Get singleton instance
     */
    static getInstance(config?: Partial<SelfCorrectionConfig>): SelfCorrectionLoop {
        if (!SelfCorrectionLoop.instance) {
            SelfCorrectionLoop.instance = new SelfCorrectionLoop(config);
        }
        return SelfCorrectionLoop.instance;
    }

    /**
     * Execute self-correction loop on code
     */
    async correct(
        initialCode: string,
        task: TaskType,
        originalPrompt: string,
        language: string = 'typescript'
    ): Promise<SelfCorrectionResult> {
        const startTime = Date.now();
        const attempts: CorrectionAttempt[] = [];
        const learnings: string[] = [];

        let currentCode = initialCode;
        let iteration = 0;
        let bestPassRate = 0;
        let bestCode = initialCode;

        console.log('\n🔄 Starting Self-Correction Loop...');
        console.log(`   Target: ${this.config.targetPassRate}% Pass Rate`);
        console.log(`   Max Iterations: ${this.config.maxIterations}`);

        while (iteration < this.config.maxIterations) {
            iteration++;
            const iterationStart = Date.now();

            console.log(`\n   📝 Iteration ${iteration}/${this.config.maxIterations}`);

            // Validate current code
            const validation = await this.validator.validate(currentCode, language);

            console.log(`      Pass Rate: ${validation.passRate.toFixed(1)}%`);
            console.log(`      Errors: ${validation.errors.length}`);

            // Record attempt
            attempts.push({
                iteration,
                timestamp: Date.now(),
                code: currentCode,
                validation,
                duration: Date.now() - iterationStart
            });

            // Track best result
            if (validation.passRate > bestPassRate) {
                bestPassRate = validation.passRate;
                bestCode = currentCode;
            }

            // Check if target reached
            if (validation.passRate >= this.config.targetPassRate) {
                console.log(`   ✅ Target Pass Rate achieved!`);

                // Record learning
                if (this.config.learningEnabled && iteration > 1) {
                    const learning = this.extractLearning(attempts);
                    if (learning) learnings.push(learning);
                }

                this.updateStats(true, iteration, validation.passRate - 0);

                return {
                    success: true,
                    finalCode: currentCode,
                    finalPassRate: validation.passRate,
                    totalIterations: iteration,
                    totalDuration: Date.now() - startTime,
                    attempts,
                    learnings
                };
            }

            // If not last iteration, attempt correction
            if (iteration < this.config.maxIterations) {
                console.log(`      🔧 Requesting AI correction...`);

                // Build correction prompt
                const correctionPrompt = this.buildCorrectionPrompt(
                    originalPrompt,
                    currentCode,
                    validation,
                    attempts
                );

                // Get correction from AI
                const correctionResponse = await this.requestCorrection(
                    correctionPrompt,
                    task,
                    attempts,
                    iteration
                );

                if (correctionResponse) {
                    attempts[attempts.length - 1].aiResponse = correctionResponse;
                    currentCode = this.extractCode(correctionResponse.response);
                    console.log(`      📥 Received corrected code (${currentCode.length} chars)`);
                } else {
                    console.log(`      ⚠️ No correction received`);
                    break;
                }
            }

            this.emit('iteration:complete', {
                iteration,
                passRate: validation.passRate,
                errors: validation.errors.length
            });
        }

        // Max iterations reached
        console.log(`\n   ❌ Max iterations reached`);
        console.log(`   Best Pass Rate: ${bestPassRate.toFixed(1)}%`);

        this.updateStats(false, iteration, bestPassRate);

        return {
            success: bestPassRate >= this.config.targetPassRate,
            finalCode: bestCode,
            finalPassRate: bestPassRate,
            totalIterations: iteration,
            totalDuration: Date.now() - startTime,
            attempts,
            learnings
        };
    }

    /**
     * Correct code with automatic task detection
     */
    async autoCorrect(code: string, originalPrompt: string): Promise<SelfCorrectionResult> {
        // Detect task type from code content
        const task = this.detectTaskType(code, originalPrompt);
        return this.correct(code, task, originalPrompt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CORRECTION LOGIC
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Build correction prompt with error context
     */
    private buildCorrectionPrompt(
        originalPrompt: string,
        code: string,
        validation: ValidationResult,
        attempts: CorrectionAttempt[]
    ): string {
        const parts: string[] = [];

        parts.push('# CODE CORRECTION REQUEST');
        parts.push('');
        parts.push('## Original Task');
        parts.push(originalPrompt);
        parts.push('');

        parts.push('## Current Code (with errors)');
        parts.push('```typescript');
        parts.push(code);
        parts.push('```');
        parts.push('');

        parts.push('## Validation Errors');
        for (const error of validation.errors) {
            parts.push(`- **${error.type.toUpperCase()}**: ${error.message}`);
            if (error.line) {
                parts.push(`  - Line: ${error.line}`);
            }
            if (error.suggestion) {
                parts.push(`  - Suggestion: ${error.suggestion}`);
            }
        }
        parts.push('');

        if (attempts.length > 1) {
            parts.push('## Previous Attempts');
            for (const attempt of attempts.slice(-3)) {
                parts.push(`- Iteration ${attempt.iteration}: ${attempt.validation.passRate.toFixed(1)}% pass rate, ${attempt.validation.errors.length} errors`);
            }
            parts.push('');
        }

        parts.push('## Instructions');
        parts.push('1. Fix ALL the errors listed above');
        parts.push('2. Maintain the original functionality');
        parts.push('3. Output ONLY the corrected code, no explanations');
        parts.push('4. Ensure the code is complete and can run');
        parts.push('');
        parts.push('Output the corrected TypeScript code:');

        return parts.join('\n');
    }

    /**
     * Request correction from AI
     */
    private async requestCorrection(
        prompt: string,
        task: TaskType,
        attempts: CorrectionAttempt[],
        iteration: number
    ): Promise<InferenceResult | null> {
        try {
            // Build context with previous attempts
            const previousAttempts: AttemptHistory[] = attempts.map(a => ({
                attempt: a.iteration,
                code: a.code.slice(0, 1000),
                errors: a.validation.errors.map(e => e.message),
                passRate: a.validation.passRate,
                timestamp: a.timestamp
            }));

            // Build full context
            const context = await this.contextInjector.buildContext(task as any, prompt, { // Cast task as needed by ContextInjector if stricter
                previousAttempts
            });

            // Adjust temperature based on iteration (progressive)
            const temperature = this.config.progressiveTemperature
                ? 0.3 + (iteration * 0.1) // Start low, increase with iterations
                : 0.5;

            // Request correction
            const responseString = await this.neuralInference.infer(
                prompt,
                context,
                {
                    temperature,
                    maxTokens: 4000
                }
            );

            if (!responseString) return null;

            return {
                response: responseString,
                model: 'unknown',
                processingTimeMs: 0,
                tokensUsed: 0,
                fromCache: false
            };

        } catch (error) {
            console.error('Correction request failed:', error);
            return null;
        }
    }

    /**
     * Extract code from AI response
     */
    private extractCode(response: string): string {
        // Try to extract code block
        const codeBlockMatch = response.match(/```(?:typescript|ts|javascript|js)?\n([\s\S]*?)```/);
        if (codeBlockMatch) {
            return codeBlockMatch[1].trim();
        }

        // If no code block, assume entire response is code
        // Remove any markdown-like formatting
        return response
            .replace(/^#.*$/gm, '') // Remove headings
            .replace(/^\*.*$/gm, '') // Remove bullet points
            .replace(/^>/gm, '') // Remove quotes
            .trim();
    }

    /**
     * Detect task type from code
     */
    private detectTaskType(code: string, prompt: string): TaskType {
        const content = (code + prompt).toLowerCase();

        if (content.includes('selector') || content.includes('xpath') || content.includes('css')) {
            return 'selector-repair';
        }
        if (content.includes('refactor') || content.includes('redesign')) {
            return 'logic-refactor';
        }
        if (content.includes('test') || content.includes('spec')) {
            return 'test-generation';
        }
        if (content.includes('fix') || content.includes('bug') || content.includes('error')) {
            return 'bug-fix';
        }
        if (content.includes('optimize') || content.includes('performance')) {
            return 'optimization';
        }
        if (content.includes('security') || content.includes('vulnerability')) {
            return 'security-audit';
        }

        return 'code-generation';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LEARNING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Extract learning from successful correction
     */
    private extractLearning(attempts: CorrectionAttempt[]): string | null {
        if (attempts.length < 2) return null;

        const firstAttempt = attempts[0];
        const lastAttempt = attempts[attempts.length - 1];

        // Identify what was fixed
        const fixedErrors = firstAttempt.validation.errors.filter(e =>
            !lastAttempt.validation.errors.some(le => le.message === e.message)
        );

        if (fixedErrors.length === 0) return null;

        const errorTypes = [...new Set(fixedErrors.map(e => e.type))];
        return `Fixed ${fixedErrors.length} ${errorTypes.join('/')} errors in ${attempts.length} iterations`;
    }

    /**
     * Update statistics
     */
    private updateStats(success: boolean, iterations: number, passRateImprovement: number): void {
        this.stats.totalCorrections++;
        if (success) {
            this.stats.successfulCorrections++;
        }

        // Update running averages
        const n = this.stats.totalCorrections;
        this.stats.averageIterations =
            (this.stats.averageIterations * (n - 1) + iterations) / n;
        this.stats.averagePassRateImprovement =
            (this.stats.averagePassRateImprovement * (n - 1) + passRateImprovement) / n;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get current configuration
     */
    getConfig(): SelfCorrectionConfig {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    updateConfig(updates: Partial<SelfCorrectionConfig>): void {
        this.config = { ...this.config, ...updates };
    }

    /**
     * Set custom validator
     */
    setValidator(validator: CodeValidator): void {
        this.validator = validator;
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalCorrections > 0
                ? this.stats.successfulCorrections / this.stats.totalCorrections
                : 0
        };
    }

    /**
     * Reset statistics
     */
    resetStats(): void {
        this.stats = {
            totalCorrections: 0,
            successfulCorrections: 0,
            averageIterations: 0,
            averagePassRateImprovement: 0
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getSelfCorrectionLoop = (config?: Partial<SelfCorrectionConfig>) =>
    SelfCorrectionLoop.getInstance(config);

export default SelfCorrectionLoop;
