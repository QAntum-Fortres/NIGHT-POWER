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
import { EventEmitter } from 'events';
export interface AgentDirective {
    command: string;
    filePath?: string;
    context?: string;
    mode: 'analyze' | 'fix' | 'generate' | 'evolve' | 'audit';
    precision: 'fast' | 'balanced' | 'opus';
}
export interface AgentResponse {
    success: boolean;
    result: string;
    reasoning: ReasoningChain;
    filesModified: string[];
    executionTime: number;
    model: string;
}
export interface ReasoningChain {
    analysis: string;
    critique: string;
    synthesis: string;
    confidence: number;
}
export interface ShadowContext {
    lastCommands: string[];
    activeFiles: string[];
    recentChanges: FileChange[];
    sessionStart: Date;
    lastActivity: Date;
}
export interface FileChange {
    path: string;
    type: 'create' | 'modify' | 'delete';
    timestamp: Date;
    summary: string;
}
export declare class AIAgentExpert extends EventEmitter {
    private static instance;
    private readonly brain;
    private readonly router;
    private readonly anchor;
    private readonly immune;
    private shadowContext;
    private readonly SHADOW_CONTEXT_PATH;
    private readonly MAX_SHADOW_COMMANDS;
    private constructor();
    static getInstance(): AIAgentExpert;
    private loadShadowContext;
    private saveShadowContext;
    /**
     * Record activity for shadow context (call this from VS Code integration)
     */
    recordActivity(command: string, filePath?: string): void;
    /**
     * Record a file change
     */
    recordFileChange(filePath: string, type: 'create' | 'modify' | 'delete', summary: string): void;
    getShadowContext(): ShadowContext;
    /**
     * Execute a directive with Opus-level reasoning
     * This is the main entry point for the AI Agent Expert
     */
    executeDirective(directive: AgentDirective): Promise<AgentResponse>;
    /**
     * Recursive Chain-of-Thought - 3 iterations for Opus-level depth
     */
    private performChainOfThought;
    private getProjectContext;
    private analyzeCode;
    private fixCode;
    private generateCode;
    private evolveCode;
    private auditCode;
    /**
     * Quick ask - simple interface for terminal usage
     */
    ask(question: string, filePath?: string): Promise<string>;
    /**
     * Quick fix - fix a file immediately
     */
    fix(filePath: string, problem?: string): Promise<string>;
    /**
     * Get inactivity duration in milliseconds
     */
    getInactivityDuration(): number;
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
    getGhostText(context: string, language?: string, filePath?: string): Promise<string>;
    /**
     * Get ghost text with VS Code TextDocument and Position
     * For direct VS Code integration
     */
    getGhostTextVSCode(documentText: string, cursorOffset: number, language?: string): Promise<{
        insertText: string;
        range: {
            start: number;
            end: number;
        };
    }>;
}
export declare const aiAgentExpert: AIAgentExpert;
export default AIAgentExpert;
