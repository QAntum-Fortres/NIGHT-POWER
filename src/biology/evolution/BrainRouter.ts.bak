/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BRAIN ROUTER - Intelligent Model Selection System + Adaptive Interface
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Избираме модела базирано на сложността. RTX 4050 за бързо. DeepSeek за дълбоко."
 * 
 * Routing Logic:
 * - Complexity < 7: LOCAL_LLAMA_3.1_8B (Fast, Free, Local)
 * - Complexity >= 7: CLOUD_DEEPSEEK_V3 (Slow, Paid, Infinite)
 * 
 * v29.1 Enhancements:
 * - Adaptive Interface integration for mode-aware routing
 * - Tool Selector integration for MCP tool orchestration
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 29.1.0 - THE ADAPTIVE CONSCIOUSNESS
 */

import { NeuralInference } from '../../physics/NeuralInference';
import { EventEmitter } from 'events';
import { AdaptiveInterface, InteractionMode } from '../../cognition/AdaptiveInterface';
import { ToolSelector } from '../../chemistry/tool-orchestrator/ToolSelector';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ModelProvider = 
  | 'LOCAL_LLAMA_3.1_8B'    // RTX 4050 accelerated, free
  | 'LOCAL_CODELLAMA_13B'   // For code-specific tasks
  | 'LOCAL_MISTRAL_7B'      // Fast general purpose
  | 'CLOUD_DEEPSEEK_V3'     // Infinite intelligence, paid
  | 'CLOUD_GPT4O'           // OpenAI fallback
  | 'CLOUD_CLAUDE_OPUS';    // Anthropic fallback

export interface TaskAnalysis {
  complexity: number;         // 1-10
  taskType: TaskType;
  requiredCapabilities: string[];
  estimatedTokens: number;
  securityLevel: 'public' | 'sensitive' | 'classified';
}

export type TaskType = 
  | 'code-generation'
  | 'code-fix'
  | 'security-analysis'
  | 'proposal-generation'
  | 'semantic-search'
  | 'general-chat'
  | 'complex-reasoning'
  | 'future-simulation';

export interface RoutingDecision {
  provider: ModelProvider;
  model: string;
  reason: string;
  estimatedCost: number;
  estimatedLatency: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BRAIN ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

export class BrainRouter extends EventEmitter {
  private static instance: BrainRouter;
  
  private readonly localEngine = NeuralInference.getInstance();
  
  // v29.1: Adaptive Interface and Tool Selector integration
  private adaptiveInterface: AdaptiveInterface;
  private toolSelector: ToolSelector;
  
  private readonly MODEL_CONFIG: Record<ModelProvider, { model: string; costPer1k: number; latencyMs: number }> = {
    'LOCAL_LLAMA_3.1_8B': { model: 'llama3.1:8b', costPer1k: 0, latencyMs: 500 },
    'LOCAL_CODELLAMA_13B': { model: 'codellama:13b', costPer1k: 0, latencyMs: 800 },
    'LOCAL_MISTRAL_7B': { model: 'mistral:7b', costPer1k: 0, latencyMs: 400 },
    'CLOUD_DEEPSEEK_V3': { model: 'deepseek-v3', costPer1k: 0.001, latencyMs: 2000 },
    'CLOUD_GPT4O': { model: 'gpt-4o', costPer1k: 0.015, latencyMs: 1500 },
    'CLOUD_CLAUDE_OPUS': { model: 'claude-opus-4-20250514', costPer1k: 0.030, latencyMs: 3000 },
  };

  private readonly COMPLEXITY_THRESHOLD = 7;
  private routingHistory: RoutingDecision[] = [];

  private constructor() {
    super();
    
    // Initialize v29.1 integrations
    this.adaptiveInterface = AdaptiveInterface.getInstance();
    this.toolSelector = ToolSelector.getInstance();
    
    console.log('🧭 [BRAIN-ROUTER] Intelligent routing system initialized with Adaptive Interface');
  }

  static getInstance(): BrainRouter {
    if (!BrainRouter.instance) {
      BrainRouter.instance = new BrainRouter();
    }
    return BrainRouter.instance;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTING DECISION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Route task to optimal model based on complexity and type
   * v29.1: Now mode-aware via Adaptive Interface
   */
  async route(prompt: string, taskType?: TaskType): Promise<RoutingDecision> {
    const analysis = this.analyzeTask(prompt, taskType);
    
    // v29.1: Select mode based on query (auto-switch if enabled)
    const suggestedMode = this.adaptiveInterface.selectMode(prompt);
    const currentMode = this.adaptiveInterface.getMode();
    
    let provider: ModelProvider;
    let reason: string;

    // Security-sensitive tasks always local
    if (analysis.securityLevel === 'classified') {
      provider = 'LOCAL_LLAMA_3.1_8B';
      reason = 'Classified data - local processing only';
    }
    // v29.1: Mode-aware routing adjustments
    else if (currentMode === 'ARCHITECT' && analysis.taskType !== 'code-generation') {
      // ARCHITECT mode prefers faster responses for strategic discussions
      if (analysis.complexity < 8) {
        provider = 'LOCAL_LLAMA_3.1_8B';
        reason = 'ARCHITECT mode - fast strategic response';
      } else {
        provider = 'CLOUD_DEEPSEEK_V3';
        reason = 'ARCHITECT mode - complex strategic analysis';
      }
    }
    else if (currentMode === 'QA' && analysis.taskType === 'security-analysis') {
      // QA mode always uses cloud for thorough security analysis
      provider = 'CLOUD_DEEPSEEK_V3';
      reason = 'QA AUDITOR mode - thorough security analysis';
    }
    // Code tasks prefer CodeLlama
    else if (analysis.taskType === 'code-generation' || analysis.taskType === 'code-fix') {
      if (analysis.complexity < this.COMPLEXITY_THRESHOLD) {
        provider = 'LOCAL_CODELLAMA_13B';
        reason = 'Code task, moderate complexity - CodeLlama optimal';
      } else {
        provider = 'CLOUD_DEEPSEEK_V3';
        reason = 'Complex code task - DeepSeek V3 for accuracy';
      }
    }
    // Future simulation needs maximum intelligence
    else if (analysis.taskType === 'future-simulation') {
      provider = 'CLOUD_DEEPSEEK_V3';
      reason = 'Future simulation requires infinite intelligence';
    }
    // Complex reasoning
    else if (analysis.taskType === 'complex-reasoning' || analysis.complexity >= 9) {
      provider = 'CLOUD_DEEPSEEK_V3';
      reason = 'High complexity reasoning task';
    }
    // Default: Local for speed and cost
    else if (analysis.complexity < this.COMPLEXITY_THRESHOLD) {
      provider = 'LOCAL_LLAMA_3.1_8B';
      reason = 'Standard task - local processing for speed';
    }
    // Fallback to cloud
    else {
      provider = 'CLOUD_DEEPSEEK_V3';
      reason = 'Above complexity threshold - cloud processing';
    }

    const config = this.MODEL_CONFIG[provider];
    const decision: RoutingDecision = {
      provider,
      model: config.model,
      reason,
      estimatedCost: (analysis.estimatedTokens / 1000) * config.costPer1k,
      estimatedLatency: config.latencyMs,
    };

    this.routingHistory.push(decision);
    this.emit('route:decision', decision);

    console.log(`
🧭 [BRAIN-ROUTER] Decision:
  Provider: ${provider}
  Model: ${config.model}
  Reason: ${reason}
  Est. Cost: $${decision.estimatedCost.toFixed(4)}
  Est. Latency: ${config.latencyMs}ms
    `);

    return decision;
  }

  /**
   * Execute task with automatic routing
   */
  async execute(prompt: string, taskType?: TaskType, context?: Record<string, any>): Promise<string | null> {
    const decision = await this.route(prompt, taskType);

    // Local models
    if (decision.provider.startsWith('LOCAL_')) {
      return this.localEngine.infer(prompt, context, {
        model: decision.model,
      });
    }

    // Cloud models (DeepSeek, GPT-4o, Claude)
    return this.executeCloud(prompt, decision, context);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TASK ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  private analyzeTask(prompt: string, taskType?: TaskType): TaskAnalysis {
    // Estimate token count
    const estimatedTokens = Math.ceil(prompt.length / 4);

    // Detect task type from prompt if not provided
    const detectedType = taskType || this.detectTaskType(prompt);

    // Calculate complexity
    const complexity = this.calculateComplexity(prompt, detectedType);

    // Determine security level
    const securityLevel = this.determineSecurityLevel(prompt);

    // Extract required capabilities
    const requiredCapabilities = this.extractCapabilities(prompt, detectedType);

    return {
      complexity,
      taskType: detectedType,
      requiredCapabilities,
      estimatedTokens,
      securityLevel,
    };
  }

  private detectTaskType(prompt: string): TaskType {
    const lower = prompt.toLowerCase();

    if (lower.includes('fix') || lower.includes('error') || lower.includes('bug')) {
      return 'code-fix';
    }
    if (lower.includes('generate') || lower.includes('create') || lower.includes('write code')) {
      return 'code-generation';
    }
    if (lower.includes('security') || lower.includes('vulnerability') || lower.includes('audit')) {
      return 'security-analysis';
    }
    if (lower.includes('proposal') || lower.includes('offer') || lower.includes('client')) {
      return 'proposal-generation';
    }
    if (lower.includes('search') || lower.includes('find') || lower.includes('similar')) {
      return 'semantic-search';
    }
    if (lower.includes('future') || lower.includes('predict') || lower.includes('simulate')) {
      return 'future-simulation';
    }
    if (lower.includes('analyze') || lower.includes('explain') || lower.includes('complex')) {
      return 'complex-reasoning';
    }

    return 'general-chat';
  }

  private calculateComplexity(prompt: string, taskType: TaskType): number {
    let complexity = 3; // Base complexity

    // Length factor
    if (prompt.length > 2000) complexity += 2;
    else if (prompt.length > 500) complexity += 1;

    // Task type factor
    const taskComplexity: Record<TaskType, number> = {
      'code-generation': 2,
      'code-fix': 2,
      'security-analysis': 3,
      'proposal-generation': 1,
      'semantic-search': 1,
      'general-chat': 0,
      'complex-reasoning': 3,
      'future-simulation': 4,
    };
    complexity += taskComplexity[taskType];

    // Keywords that increase complexity
    const complexKeywords = [
      'quantum', 'cryptography', 'architecture', 'optimize', 'refactor',
      'multi-threaded', 'distributed', 'algorithm', 'proof', 'theorem',
    ];
    for (const keyword of complexKeywords) {
      if (prompt.toLowerCase().includes(keyword)) complexity += 0.5;
    }

    return Math.min(10, Math.max(1, complexity));
  }

  private determineSecurityLevel(prompt: string): 'public' | 'sensitive' | 'classified' {
    const lower = prompt.toLowerCase();

    // Classified indicators
    const classifiedKeywords = ['api_key', 'password', 'secret', 'private_key', 'credential'];
    if (classifiedKeywords.some(kw => lower.includes(kw))) {
      return 'classified';
    }

    // Sensitive indicators
    const sensitiveKeywords = ['customer', 'financial', 'personal', 'email', 'lead'];
    if (sensitiveKeywords.some(kw => lower.includes(kw))) {
      return 'sensitive';
    }

    return 'public';
  }

  private extractCapabilities(prompt: string, taskType: TaskType): string[] {
    const capabilities: string[] = [];

    if (taskType === 'code-generation' || taskType === 'code-fix') {
      capabilities.push('code-understanding', 'syntax-awareness');
    }
    if (taskType === 'security-analysis') {
      capabilities.push('security-knowledge', 'vulnerability-detection');
    }
    if (taskType === 'future-simulation') {
      capabilities.push('predictive-modeling', 'trend-analysis');
    }

    return capabilities;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLOUD EXECUTION
  // ═══════════════════════════════════════════════════════════════════════════

  private async executeCloud(
    prompt: string, 
    decision: RoutingDecision, 
    context?: Record<string, any>
  ): Promise<string | null> {
    console.log(`☁️ [BRAIN-ROUTER] Routing to cloud: ${decision.provider}`);

    // For now, fallback to local if cloud not configured
    // In production, implement actual API calls to DeepSeek/OpenAI/Anthropic
    
    if (decision.provider === 'CLOUD_DEEPSEEK_V3') {
      // DeepSeek API implementation
      const endpoint = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
      const apiKey = process.env.DEEPSEEK_API_KEY;

      if (!apiKey) {
        console.warn('⚠️ [BRAIN-ROUTER] DeepSeek API key not configured. Falling back to local.');
        return this.localEngine.infer(prompt, context);
      }

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'You are Mister Mind, the QAntum Empire Architect.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.1,
          }),
        });

        if (!response.ok) {
          throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        console.error('⚠️ [BRAIN-ROUTER] Cloud execution failed:', error);
        return this.localEngine.infer(prompt, context);
      }
    }

    // Default fallback to local
    return this.localEngine.infer(prompt, context);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATIC CONVENIENCE METHOD
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Quick routing decision based on complexity score
   */
  static async routeByComplexity(taskComplexity: number): Promise<ModelProvider> {
    if (taskComplexity < 7) {
      return 'LOCAL_LLAMA_3.1_8B';
    } else {
      return 'CLOUD_DEEPSEEK_V3';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  getRoutingHistory(): RoutingDecision[] {
    return [...this.routingHistory];
  }

  getRoutingStats(): { local: number; cloud: number; totalCost: number } {
    const local = this.routingHistory.filter(d => d.provider.startsWith('LOCAL_')).length;
    const cloud = this.routingHistory.length - local;
    const totalCost = this.routingHistory.reduce((acc, d) => acc + d.estimatedCost, 0);

    return { local, cloud, totalCost };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // v29.1: ADAPTIVE INTERFACE INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Set interaction mode (ARCHITECT, ENGINEER, QA)
   */
  setMode(mode: InteractionMode): void {
    this.adaptiveInterface.setMode(mode);
    this.emit('mode:changed', mode);
  }

  /**
   * Get current interaction mode
   */
  getMode(): InteractionMode {
    return this.adaptiveInterface.getMode();
  }

  /**
   * Get response context with mode-aware formatting
   */
  getResponseContext(): ReturnType<AdaptiveInterface['getResponseContext']> {
    return this.adaptiveInterface.getResponseContext();
  }

  /**
   * Check if a task might need MCP tool execution
   */
  async checkToolNeed(prompt: string): Promise<{
    needsTool: boolean;
    suggestedTools?: Array<{ id: string; confidence: number }>;
  }> {
    const toolKeywords = [
      'scrape', 'browser', 'automation', 'excel', 'pdf', 'api',
      'screenshot', 'click', 'navigate', 'extract', 'website'
    ];
    
    const lower = prompt.toLowerCase();
    const needsTool = toolKeywords.some(kw => lower.includes(kw));
    
    if (needsTool) {
      const suggestions = await this.toolSelector.selectTools(prompt, 3);
      return {
        needsTool: true,
        suggestedTools: suggestions.map(s => ({
          id: s.tool.id,
          confidence: s.score / 100
        }))
      };
    }
    
    return { needsTool: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const brainRouter = BrainRouter.getInstance();
export default BrainRouter;
