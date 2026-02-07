"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI AGENT EXPERT - The Neural Mirror
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Това е „Cloud Opus x3" вътре в VS Code. Когато облачният агент достигне
 *  лимита си, QAntum поема управлението без загуба на контекст."
 *
 * This module provides:
 * 1. Opus-level reasoning via Recursive Chain-of-Thought
 * 2. Zero censorship - full sovereignty over operations
 * 3. Direct hardware access (RTX 4050, local files)
 * 4. Pinecone context injection for architectural consistency
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 30.1.0 - THE MERCHANT AWAKENS
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiAgentExpert = exports.AIAgentExpert = void 0;
const events_1 = require("events");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const NeuralInference_1 = require("../physics/NeuralInference");
const BrainRouter_1 = require("../biology/evolution/BrainRouter");
const IntentAnchor_1 = require("../omega/IntentAnchor");
const ImmuneSystem_1 = require("./ImmuneSystem");
// ═══════════════════════════════════════════════════════════════════════════════
// AI AGENT EXPERT
// ═══════════════════════════════════════════════════════════════════════════════
class AIAgentExpert extends events_1.EventEmitter {
    static instance;
    brain = NeuralInference_1.NeuralInference.getInstance();
    router = BrainRouter_1.BrainRouter.getInstance();
    anchor = IntentAnchor_1.IntentAnchor.getInstance();
    immune = ImmuneSystem_1.ImmuneSystem.getInstance();
    shadowContext;
    SHADOW_CONTEXT_PATH = 'data/context/shadow_context.json';
    MAX_SHADOW_COMMANDS = 50;
    constructor() {
        super();
        // Initialize or load shadow context
        this.shadowContext = this.loadShadowContext();
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    🤖 AI AGENT EXPERT INITIALIZED 🤖                           ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  "Cloud Opus x3, но без ограничения."                                         ║
║                                                                               ║
║  Mode: SOVEREIGN                                                              ║
║  Hardware: RTX 4050 (Local)                                                   ║
║  Context: Shadow Tracking ENABLED                                             ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
    }
    static getInstance() {
        if (!AIAgentExpert.instance) {
            AIAgentExpert.instance = new AIAgentExpert();
        }
        return AIAgentExpert.instance;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // SHADOW CONTEXT (For Hot-Swap)
    // ═══════════════════════════════════════════════════════════════════════════
    loadShadowContext() {
        try {
            const dir = path.dirname(this.SHADOW_CONTEXT_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            if (fs.existsSync(this.SHADOW_CONTEXT_PATH)) {
                const data = JSON.parse(fs.readFileSync(this.SHADOW_CONTEXT_PATH, 'utf-8'));
                return {
                    ...data,
                    sessionStart: new Date(data.sessionStart),
                    lastActivity: new Date(data.lastActivity),
                    recentChanges: data.recentChanges.map((c) => ({
                        ...c,
                        timestamp: new Date(c.timestamp)
                    }))
                };
            }
        }
        catch (error) {
            console.warn('⚠️ [EXPERT] Could not load shadow context, starting fresh.');
        }
        return {
            lastCommands: [],
            activeFiles: [],
            recentChanges: [],
            sessionStart: new Date(),
            lastActivity: new Date(),
        };
    }
    saveShadowContext() {
        try {
            const dir = path.dirname(this.SHADOW_CONTEXT_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.SHADOW_CONTEXT_PATH, JSON.stringify(this.shadowContext, null, 2));
        }
        catch (error) {
            console.error('❌ [EXPERT] Failed to save shadow context:', error);
        }
    }
    /**
     * Record activity for shadow context (call this from VS Code integration)
     */
    recordActivity(command, filePath) {
        this.shadowContext.lastCommands.push(command);
        if (this.shadowContext.lastCommands.length > this.MAX_SHADOW_COMMANDS) {
            this.shadowContext.lastCommands.shift();
        }
        if (filePath && !this.shadowContext.activeFiles.includes(filePath)) {
            this.shadowContext.activeFiles.push(filePath);
            if (this.shadowContext.activeFiles.length > 20) {
                this.shadowContext.activeFiles.shift();
            }
        }
        this.shadowContext.lastActivity = new Date();
        this.saveShadowContext();
        this.emit('activity:recorded', { command, filePath });
    }
    /**
     * Record a file change
     */
    recordFileChange(filePath, type, summary) {
        this.shadowContext.recentChanges.push({
            path: filePath,
            type,
            timestamp: new Date(),
            summary,
        });
        // Keep only last 100 changes
        if (this.shadowContext.recentChanges.length > 100) {
            this.shadowContext.recentChanges = this.shadowContext.recentChanges.slice(-100);
        }
        this.saveShadowContext();
    }
    getShadowContext() {
        return { ...this.shadowContext };
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // RECURSIVE CHAIN-OF-THOUGHT (Opus-Level Reasoning)
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Execute a directive with Opus-level reasoning
     * This is the main entry point for the AI Agent Expert
     */
    async executeDirective(directive) {
        const startTime = Date.now();
        console.log(`🤖 [EXPERT] Processing directive: "${directive.command}"`);
        this.emit('directive:start', directive);
        // Record activity
        this.recordActivity(directive.command, directive.filePath);
        try {
            // 1. Verify alignment with Primary Directive
            const verification = await this.anchor.verifyAction({
                type: 'AGENT_DIRECTIVE',
                target: directive.filePath || 'SYSTEM',
                description: directive.command,
            });
            if (!verification.isApproved) {
                return {
                    success: false,
                    result: '🚨 [REJECTED] Directive violates Primary Goal alignment.',
                    reasoning: {
                        analysis: 'Directive was checked against Primary Directive',
                        critique: 'Alignment score below threshold',
                        synthesis: 'Action blocked',
                        confidence: verification.alignmentScore,
                    },
                    filesModified: [],
                    executionTime: Date.now() - startTime,
                    model: 'IntentAnchor',
                };
            }
            // 2. Perform Recursive Chain-of-Thought
            const reasoning = await this.performChainOfThought(directive);
            // 3. Execute based on mode
            let result;
            const filesModified = [];
            let model = 'llama3.1:8b';
            switch (directive.mode) {
                case 'analyze':
                    result = await this.analyzeCode(directive, reasoning);
                    break;
                case 'fix':
                    const fixResult = await this.fixCode(directive, reasoning);
                    result = fixResult.result;
                    if (fixResult.modified)
                        filesModified.push(directive.filePath);
                    model = fixResult.model;
                    break;
                case 'generate':
                    result = await this.generateCode(directive, reasoning);
                    model = 'deepseek-v3';
                    break;
                case 'evolve':
                    const evolveResult = await this.evolveCode(directive, reasoning);
                    result = evolveResult.result;
                    filesModified.push(...evolveResult.files);
                    break;
                case 'audit':
                    result = await this.auditCode(directive, reasoning);
                    break;
                default:
                    result = reasoning.synthesis;
            }
            const response = {
                success: true,
                result,
                reasoning,
                filesModified,
                executionTime: Date.now() - startTime,
                model,
            };
            this.emit('directive:complete', response);
            return response;
        }
        catch (error) {
            console.error('❌ [EXPERT] Directive failed:', error);
            return {
                success: false,
                result: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                reasoning: {
                    analysis: 'Exception occurred',
                    critique: 'N/A',
                    synthesis: 'Failed',
                    confidence: 0,
                },
                filesModified: [],
                executionTime: Date.now() - startTime,
                model: 'error',
            };
        }
    }
    /**
     * Recursive Chain-of-Thought - 3 iterations for Opus-level depth
     */
    async performChainOfThought(directive) {
        console.log('🧠 [EXPERT] Initiating Chain-of-Thought reasoning...');
        // Get project context from Pinecone/local
        const projectContext = await this.getProjectContext(directive);
        // ITERATION 1: Analysis
        const analysisPrompt = `
ROLE: QAntum Sovereign Architect (Mister Mind)
TASK: Analyze the following directive with extreme precision.

DIRECTIVE: ${directive.command}
${directive.filePath ? `FILE: ${directive.filePath}` : ''}
${directive.context ? `CONTEXT: ${directive.context}` : ''}

PROJECT CONTEXT:
${projectContext}

Provide a detailed technical analysis. What is being asked? What are the implications?
    `.trim();
        const analysis = await this.brain.infer(analysisPrompt);
        // ITERATION 2: Self-Critique (Hallucination Check)
        const critiquePrompt = `
ROLE: Critical Auditor
PREVIOUS ANALYSIS: ${analysis}

Now critique this analysis:
1. Are there any logical errors?
2. Are there unfounded assumptions (hallucinations)?
3. What is missing from the analysis?
4. Rate confidence 0-100.

Be harsh and precise.
    `.trim();
        const critique = await this.brain.infer(critiquePrompt);
        // ITERATION 3: Final Synthesis
        const synthesisPrompt = `
ROLE: Master Synthesizer
ORIGINAL TASK: ${directive.command}
ANALYSIS: ${analysis}
CRITIQUE: ${critique}

Based on the analysis and its critique, provide the FINAL, OPTIMAL solution.
This must be:
- Mathematically correct
- Free of hallucinations
- Implementable immediately

Output the solution or code directly.
    `.trim();
        const synthesis = await this.brain.infer(synthesisPrompt);
        // Extract confidence from critique
        const confidenceMatch = critique.match(/(\d+)(?:%|\/100)/);
        const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) / 100 : 0.8;
        return {
            analysis,
            critique,
            synthesis,
            confidence,
        };
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // MODE IMPLEMENTATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    async getProjectContext(directive) {
        let context = '';
        // Add shadow context summary
        context += `RECENT COMMANDS: ${this.shadowContext.lastCommands.slice(-5).join('; ')}\n`;
        context += `ACTIVE FILES: ${this.shadowContext.activeFiles.slice(-5).join(', ')}\n`;
        // Add file content if specified
        if (directive.filePath && fs.existsSync(directive.filePath)) {
            const content = fs.readFileSync(directive.filePath, 'utf-8');
            context += `\nFILE CONTENT (${directive.filePath}):\n${content.slice(0, 3000)}`;
        }
        // Add custom context
        if (directive.context) {
            context += `\nADDITIONAL CONTEXT: ${directive.context}`;
        }
        return context;
    }
    async analyzeCode(directive, reasoning) {
        return `
## Analysis Result

### Summary
${reasoning.synthesis}

### Confidence: ${(reasoning.confidence * 100).toFixed(0)}%

### Detailed Analysis
${reasoning.analysis}

### Self-Critique Notes
${reasoning.critique}
    `.trim();
    }
    async fixCode(directive, reasoning) {
        if (!directive.filePath) {
            return { result: 'No file path specified for fix.', modified: false, model: 'none' };
        }
        // Use Immune System for fixes
        const code = fs.existsSync(directive.filePath)
            ? fs.readFileSync(directive.filePath, 'utf-8')
            : '';
        const fixedCode = await this.brain.fixCode(code);
        // Write if different
        if (fixedCode !== code) {
            fs.writeFileSync(directive.filePath, fixedCode);
            this.recordFileChange(directive.filePath, 'modify', 'Fixed via AIAgentExpert');
            return { result: `✅ Fixed ${directive.filePath}`, modified: true, model: 'llama3.1:8b' };
        }
        return { result: 'No changes needed.', modified: false, model: 'llama3.1:8b' };
    }
    async generateCode(directive, reasoning) {
        // For generation, use DeepSeek V3 via routing
        const routeDecision = await this.router.route(directive.command, 'code-generation');
        return reasoning.synthesis;
    }
    async evolveCode(directive, reasoning) {
        // Use Chronos-Omega for evolution
        return { result: reasoning.synthesis, files: [] };
    }
    async auditCode(directive, reasoning) {
        let auditReport = `
## Security Audit Report

### Target: ${directive.filePath || 'System'}

### Findings
${reasoning.synthesis}

### Confidence: ${(reasoning.confidence * 100).toFixed(0)}%
    `.trim();
        return auditReport;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // CONVENIENCE METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Quick ask - simple interface for terminal usage
     */
    async ask(question, filePath) {
        const response = await this.executeDirective({
            command: question,
            filePath,
            mode: 'analyze',
            precision: 'balanced',
        });
        return response.result;
    }
    /**
     * Quick fix - fix a file immediately
     */
    async fix(filePath, problem) {
        const response = await this.executeDirective({
            command: problem || 'Fix all issues in this file',
            filePath,
            mode: 'fix',
            precision: 'opus',
        });
        return response.result;
    }
    /**
     * Get inactivity duration in milliseconds
     */
    getInactivityDuration() {
        return Date.now() - this.shadowContext.lastActivity.getTime();
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // NEURAL OVERLAY (Ghost Text)
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Get ghost text completion for inline suggestions
     * This is the Neural Overlay feature - code suggestions appear as "ghost" text
     * that the user can accept with Tab
     *
     * @param context - The code context before cursor
     * @param language - The programming language
     * @param filePath - Optional file path for additional context
     * @returns Ghost text suggestion
     */
    async getGhostText(context, language = 'typescript', filePath) {
        // Don't trigger on very short context
        if (!context || context.trim().length < 10) {
            return '';
        }
        // Build focused prompt for completion
        const prompt = `Complete this ${language} code. Output ONLY the next few tokens (1-3 lines max), no explanations, no markdown:

${context.slice(-400)}`;
        try {
            const response = await this.brain.infer(prompt, {
                temperature: 0.2, // Low temperature for deterministic completions
                maxTokens: 50, // Short completions for ghost text
            });
            // Clean the response - remove markdown, explanations, etc.
            let ghostText = response
                .replace(/```[\w]*\n?/g, '')
                .replace(/```/g, '')
                .replace(/^(Here's|Here is|The|This|I'll|I will|Let me).*\n/gi, '')
                .trim();
            // Take only first 1-2 lines for inline completion
            const lines = ghostText.split('\n');
            ghostText = lines.slice(0, 2).join('\n');
            // Ensure it doesn't repeat the context
            if (context.endsWith(ghostText.slice(0, 10))) {
                ghostText = ghostText.slice(10);
            }
            return ghostText;
        }
        catch (error) {
            console.warn('⚠️ [NEURAL-OVERLAY] Ghost text generation failed:', error);
            return '';
        }
    }
    /**
     * Get ghost text with VS Code TextDocument and Position
     * For direct VS Code integration
     */
    async getGhostTextVSCode(documentText, cursorOffset, language = 'typescript') {
        // Get context before cursor (last 500 chars)
        const contextStart = Math.max(0, cursorOffset - 500);
        const context = documentText.slice(contextStart, cursorOffset);
        const suggestion = await this.getGhostText(context, language);
        return {
            insertText: suggestion,
            range: {
                start: cursorOffset,
                end: cursorOffset,
            },
        };
    }
}
exports.AIAgentExpert = AIAgentExpert;
// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
exports.aiAgentExpert = AIAgentExpert.getInstance();
exports.default = AIAgentExpert;
//# sourceMappingURL=AIAgentExpert.js.map