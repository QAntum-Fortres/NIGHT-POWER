/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   ████████╗ ██████╗  ██████╗ ██╗                                              ║
 * ║   ╚══██╔══╝██╔═══██╗██╔═══██╗██║                                              ║
 * ║      ██║   ██║   ██║██║   ██║██║                                              ║
 * ║      ██║   ██║   ██║██║   ██║██║                                              ║
 * ║      ██║   ╚██████╔╝╚██████╔╝███████╗                                         ║
 * ║      ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝                                         ║
 * ║                                                                               ║
 * ║   ███████╗███████╗██╗     ███████╗ ██████╗████████╗ ██████╗ ██████╗           ║
 * ║   ██╔════╝██╔════╝██║     ██╔════╝██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗          ║
 * ║   ███████╗█████╗  ██║     █████╗  ██║        ██║   ██║   ██║██████╔╝          ║
 * ║   ╚════██║██╔══╝  ██║     ██╔══╝  ██║        ██║   ██║   ██║██╔══██╗          ║
 * ║   ███████║███████╗███████╗███████╗╚██████╗   ██║   ╚██████╔╝██║  ██║          ║
 * ║   ╚══════╝╚══════╝╚══════╝╚══════╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝          ║
 * ║                                                                               ║
 * ║   QAntum v29.0 "THE OMNIPOTENT NEXUS" - Intelligent Tool Selector             ║
 * ║   "Семантично търсене за оптимален инструмент"                                ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                      ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';
import {
  MCPTool,
  MCPOperation,
  MCPToolCategory,
  ToolSelectionQuery,
  ToolSelectionResult,
  ToolSelectorConfig,
} from './types';
import { ToolRegistry, getToolRegistry } from './ToolRegistry';

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: ToolSelectorConfig = {
  semanticSearchTopK: 5,
  minConfidenceThreshold: 0.5,
  considerSuccessRate: true,
  considerLatency: true,
  considerCost: false,
  enableFallbackTools: true,
  maxFallbackAttempts: 3,
};

// ═══════════════════════════════════════════════════════════════════════════════
// TASK-TO-CATEGORY MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const TASK_CATEGORY_MAP: Record<string, MCPToolCategory[]> = {
  // Browser tasks
  'scrape': ['data-scraping', 'browser-automation'],
  'crawl': ['data-scraping', 'browser-automation'],
  'screenshot': ['browser-automation'],
  'navigate': ['browser-automation'],
  'click': ['browser-automation'],
  'form': ['browser-automation', 'os-desktop'],

  // Desktop tasks
  'file': ['os-desktop'],
  'pdf': ['os-desktop'],
  'excel': ['os-desktop'],
  'document': ['os-desktop'],
  'window': ['os-desktop'],

  // Data tasks
  'email': ['data-scraping', 'communication'],
  'leads': ['data-scraping'],
  'enrich': ['data-scraping'],

  // Cloud tasks
  'deploy': ['cloud-infrastructure'],
  'scale': ['cloud-infrastructure'],
  'aws': ['cloud-infrastructure'],
  'kubernetes': ['cloud-infrastructure'],
  's3': ['cloud-infrastructure'],

  // Financial tasks
  'stock': ['financial-markets'],
  'market': ['financial-markets'],
  'trading': ['financial-markets'],
  'price': ['financial-markets'],

  // Analytics tasks
  'analytics': ['saas-analytics'],
  'heatmap': ['saas-analytics'],
  'experiment': ['saas-analytics'],
  'ab-test': ['saas-analytics'],

  // Communication tasks
  'send': ['communication'],
  'notify': ['communication'],
  'message': ['communication'],

  // Scientific tasks
  'gene': ['scientific-ai'],
  'pathway': ['scientific-ai'],
  'biology': ['scientific-ai'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL SELECTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ToolSelector - Intelligent Tool Selection Engine
 * 
 * Uses semantic search and task analysis to select the optimal MCP tool
 * for any given task. Integrates with BrainRouter for decision making.
 * 
 * @example
 * ```typescript
 * const selector = ToolSelector.getInstance();
 * 
 * const result = await selector.selectTool({
 *   task: 'Scrape all product prices from amazon.com',
 *   requiredCapabilities: ['web-scraping', 'data-extraction']
 * });
 * 
 * console.log(result.tool.name);       // 'Apify'
 * console.log(result.operation.name);  // 'Run Actor'
 * console.log(result.confidence);      // 0.92
 * ```
 */
export class ToolSelector extends EventEmitter {
  private static instance: ToolSelector;

  private config: ToolSelectorConfig;
  private registry: ToolRegistry;

  // Selection cache
  private selectionCache: Map<string, { result: ToolSelectionResult; timestamp: Date }> = new Map();
  private cacheTTLMs: number = 60000;  // 1 minute

  // Learning: track selection patterns
  private selectionHistory: Array<{
    query: ToolSelectionQuery;
    selected: string;
    success: boolean;
    timestamp: Date;
  }> = [];

  private constructor(config: Partial<ToolSelectorConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.registry = getToolRegistry();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<ToolSelectorConfig>): ToolSelector {
    if (!ToolSelector.instance) {
      ToolSelector.instance = new ToolSelector(config);
    }
    return ToolSelector.instance;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN SELECTION API
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Select the optimal tool for a task
   */
  async selectTool(query: ToolSelectionQuery): Promise<ToolSelectionResult | null> {
    const startTime = Date.now();

    // Check cache
    const cacheKey = this.getCacheKey(query);
    const cached = this.selectionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTTLMs) {
      return cached.result;
    }

    // Step 1: Infer categories from task
    const inferredCategories = this.inferCategories(query.task);
    const categories = query.preferredCategory
      ? [query.preferredCategory, ...inferredCategories]
      : inferredCategories;

    // Step 2: Get candidate tools
    const candidates = this.getCandidateTools(query, categories);

    if (candidates.length === 0) {
      this.emit('selection:no-candidates', { query });
      return null;
    }

    // Step 3: Score each candidate
    const scoredCandidates = await this.scoreCandidates(candidates, query);

    // Step 4: Select best match
    const best = scoredCandidates[0];
    if (!best || best.score < this.config.minConfidenceThreshold) {
      this.emit('selection:low-confidence', { query, bestScore: best?.score });
      return null;
    }

    // Step 5: Select best operation
    const operation = this.selectOperation(best.tool, query);

    // Build result
    const result: ToolSelectionResult = {
      tool: best.tool,
      operation: operation!,
      confidence: best.score,
      reasoning: best.reasoning,
      alternativeTools: scoredCandidates.slice(1, 4).map(c => ({
        tool: c.tool,
        operation: this.selectOperation(c.tool, query)!,
        confidence: c.score
      }))
    };

    // Cache result
    this.selectionCache.set(cacheKey, { result, timestamp: new Date() });

    // Log selection
    const elapsed = Date.now() - startTime;
    this.emit('selection:completed', {
      query,
      result,
      elapsedMs: elapsed
    });

    return result;
  }

  /**
   * Select multiple tools for a complex task
   */
  async selectMultipleTools(
    query: ToolSelectionQuery,
    count: number = 3
  ): Promise<ToolSelectionResult[]> {
    const results: ToolSelectionResult[] = [];
    const usedTools = new Set<string>();

    for (let i = 0; i < count; i++) {
      const result = await this.selectTool({
        ...query,
        excludeTools: [...(query.excludeTools || []), ...usedTools]
      });

      if (result) {
        results.push(result);
        usedTools.add(result.tool.id);
      }
    }

    return results;
  }

  /**
   * Convenience alias for selectMultipleTools taking string task directly
   */
  async selectTools(
    task: string,
    count: number = 3
  ): Promise<ToolSelectionResult[]> {
    return this.selectMultipleTools({ task }, count);
  }

  /**
   * Quick select by category and capability
   */
  quickSelect(
    category: MCPToolCategory,
    capability?: string
  ): MCPTool | undefined {
    const tools = this.registry.getToolsByCategory(category);

    if (!capability) {
      return tools.find(t => t.status === 'available');
    }

    return tools.find(t =>
      t.status === 'available' &&
      t.capabilities.includes(capability)
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY INFERENCE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Infer tool categories from task description
   */
  private inferCategories(task: string): MCPToolCategory[] {
    const categories = new Set<MCPToolCategory>();
    const taskLower = task.toLowerCase();

    for (const [keyword, cats] of Object.entries(TASK_CATEGORY_MAP)) {
      if (taskLower.includes(keyword)) {
        cats.forEach(c => categories.add(c));
      }
    }

    // If no categories inferred, return all
    if (categories.size === 0) {
      return [
        'browser-automation',
        'data-scraping',
        'os-desktop',
        'cloud-infrastructure',
        'financial-markets',
        'saas-analytics',
        'communication',
        'scientific-ai'
      ];
    }

    return Array.from(categories);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CANDIDATE SELECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get candidate tools based on query
   */
  private getCandidateTools(
    query: ToolSelectionQuery,
    categories: MCPToolCategory[]
  ): MCPTool[] {
    let candidates = this.registry.getAvailableTools();

    // Filter by category
    if (categories.length > 0) {
      candidates = candidates.filter(t => categories.includes(t.category));
    }

    // Filter by required capabilities
    if (query.requiredCapabilities && query.requiredCapabilities.length > 0) {
      candidates = candidates.filter(t =>
        query.requiredCapabilities!.every(cap =>
          t.capabilities.some(c => c.toLowerCase().includes(cap.toLowerCase()))
        )
      );
    }

    // Exclude specified tools
    if (query.excludeTools && query.excludeTools.length > 0) {
      candidates = candidates.filter(t => !query.excludeTools!.includes(t.id));
    }

    return candidates;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Score candidate tools
   */
  private async scoreCandidates(
    candidates: MCPTool[],
    query: ToolSelectionQuery
  ): Promise<Array<{ tool: MCPTool; score: number; reasoning: string }>> {
    const scored = candidates.map(tool => {
      const { score, reasoning } = this.scoreTool(tool, query);
      return { tool, score, reasoning };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored;
  }

  /**
   * Score a single tool
   */
  private scoreTool(
    tool: MCPTool,
    query: ToolSelectionQuery
  ): { score: number; reasoning: string } {
    let score = 0;
    const reasons: string[] = [];

    // 1. Semantic similarity (0-40 points)
    const semanticScore = this.calculateSemanticScore(tool, query.task);
    score += semanticScore * 40;
    if (semanticScore > 0.7) {
      reasons.push(`High semantic match (${(semanticScore * 100).toFixed(0)}%)`);
    }

    // 2. Capability match (0-30 points)
    const capabilityScore = this.calculateCapabilityScore(tool, query);
    score += capabilityScore * 30;
    if (capabilityScore > 0.5) {
      reasons.push(`Capabilities match (${(capabilityScore * 100).toFixed(0)}%)`);
    }

    // 3. Success rate (0-15 points)
    if (this.config.considerSuccessRate) {
      const metrics = this.registry.getToolMetrics(tool.id);
      const successScore = metrics?.successRate || 1.0;
      score += successScore * 15;
      if (successScore > 0.9) {
        reasons.push(`High success rate (${(successScore * 100).toFixed(0)}%)`);
      }
    }

    // 4. Latency (0-15 points) - lower is better
    if (this.config.considerLatency) {
      const metrics = this.registry.getToolMetrics(tool.id);
      const avgLatency = metrics?.avgLatencyMs || 1000;
      const latencyScore = Math.max(0, 1 - avgLatency / 5000);  // 5s = 0 points
      score += latencyScore * 15;
      if (latencyScore > 0.8) {
        reasons.push(`Fast response time (${avgLatency}ms avg)`);
      }
    }

    // Normalize to 0-1
    score = score / 100;

    return {
      score,
      reasoning: reasons.join('; ') || 'Default match'
    };
  }

  /**
   * Calculate semantic similarity score
   */
  private calculateSemanticScore(tool: MCPTool, task: string): number {
    const taskWords = new Set(task.toLowerCase().split(/\s+/));

    // Check against tool keywords, capabilities, and description
    const toolWords = new Set([
      ...tool.keywords,
      ...tool.capabilities,
      ...tool.description.toLowerCase().split(/\s+/)
    ]);

    let matches = 0;
    let total = taskWords.size;

    for (const word of taskWords) {
      for (const toolWord of toolWords) {
        if (toolWord.includes(word) || word.includes(toolWord)) {
          matches++;
          break;
        }
      }
    }

    return total > 0 ? matches / total : 0;
  }

  /**
   * Calculate capability match score
   */
  private calculateCapabilityScore(
    tool: MCPTool,
    query: ToolSelectionQuery
  ): number {
    if (!query.requiredCapabilities || query.requiredCapabilities.length === 0) {
      return 0.5;  // Neutral score
    }

    let matches = 0;
    for (const required of query.requiredCapabilities) {
      if (tool.capabilities.some(c =>
        c.toLowerCase().includes(required.toLowerCase())
      )) {
        matches++;
      }
    }

    return matches / query.requiredCapabilities.length;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPERATION SELECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Select the best operation for a tool given a query
   */
  private selectOperation(
    tool: MCPTool,
    query: ToolSelectionQuery
  ): MCPOperation | undefined {
    if (tool.operations.length === 0) return undefined;
    if (tool.operations.length === 1) return tool.operations[0];

    // Score operations
    const taskLower = query.task.toLowerCase();
    const scored = tool.operations.map(op => {
      let score = 0;

      // Check if task mentions operation name
      if (taskLower.includes(op.name.toLowerCase())) {
        score += 50;
      }

      // Check description match
      const descWords = op.description.toLowerCase().split(/\s+/);
      for (const word of descWords) {
        if (taskLower.includes(word) && word.length > 3) {
          score += 5;
        }
      }

      return { op, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].op;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEARNING & FEEDBACK
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Record selection outcome for learning
   */
  recordOutcome(query: ToolSelectionQuery, toolId: string, success: boolean): void {
    this.selectionHistory.push({
      query,
      selected: toolId,
      success,
      timestamp: new Date()
    });

    // Keep only last 1000 entries
    if (this.selectionHistory.length > 1000) {
      this.selectionHistory = this.selectionHistory.slice(-1000);
    }

    this.emit('outcome:recorded', { query, toolId, success });
  }

  /**
   * Get selection success rate for a tool
   */
  getToolSelectionSuccessRate(toolId: string): number {
    const relevant = this.selectionHistory.filter(h => h.selected === toolId);
    if (relevant.length === 0) return 1.0;

    const successes = relevant.filter(h => h.success).length;
    return successes / relevant.length;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate cache key for query
   */
  private getCacheKey(query: ToolSelectionQuery): string {
    return JSON.stringify({
      task: query.task,
      capabilities: query.requiredCapabilities?.sort(),
      category: query.preferredCategory,
      exclude: query.excludeTools?.sort()
    });
  }

  /**
   * Clear selection cache
   */
  clearCache(): void {
    this.selectionCache.clear();
  }

  /**
   * Get selection statistics
   */
  getStats(): {
    totalSelections: number;
    successRate: number;
    cacheHitRate: number;
    topTools: Array<{ toolId: string; count: number }>;
  } {
    const toolCounts = new Map<string, number>();
    let successes = 0;

    for (const entry of this.selectionHistory) {
      if (entry.success) successes++;
      toolCounts.set(
        entry.selected,
        (toolCounts.get(entry.selected) || 0) + 1
      );
    }

    const topTools = Array.from(toolCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([toolId, count]) => ({ toolId, count }));

    return {
      totalSelections: this.selectionHistory.length,
      successRate: this.selectionHistory.length > 0
        ? successes / this.selectionHistory.length
        : 1.0,
      cacheHitRate: 0,  // Would track if needed
      topTools
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getToolSelector = (config?: Partial<ToolSelectorConfig>): ToolSelector => {
  return ToolSelector.getInstance(config);
};

export default ToolSelector;
