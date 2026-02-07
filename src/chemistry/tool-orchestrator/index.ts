/**
 * Tool Orchestrator - Barrel Export
 *
 * @module chemistry/tool-orchestrator
 * @description
 * QAntum's external tool integration layer for orchestrating 25+ MCP tools.
 *
 * ## Quick Start
 *
 * ```typescript
 * import {
 *   ToolRegistry,
 *   ToolSelector,
 *   ToolExecutor,
 *   MCPTool,
 *   ToolExecutionRequest,
 *   ToolExecutionResult
 * } from './tool-orchestrator';
 *
 * // Select best tool for task
 * const selector = ToolSelector.getInstance();
 * const tools = await selector.selectTools('scrape website');
 *
 * // Execute tool operation
 * const executor = ToolExecutor.getInstance();
 * const result = await executor.execute({
 *   toolId: tools[0].tool.id,
 *   operation: 'scrape',
 *   params: { url: 'https://example.com' }
 * });
 * ```
 *
 * @layer Chemistry (Transformation)
 * @version 29.1.0
 * @author QAntum Empire
 * @license Proprietary
 *
 * @see {@link ToolRegistry} - Tool registration and discovery
 * @see {@link ToolSelector} - Intelligent tool selection
 * @see {@link ToolExecutor} - Secure tool execution
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  // Core types
  MCPTool,
  MCPOperation,
  MCPToolCategory,
  MCP_TOOL_IDS,

  // Execution types
  ToolExecutionRequest,
  ToolExecutionResult,
  ToolExecutionError,

  // Security types
  GhostProtocolConfig,
  FatalityEngineState,

  // Selection types
  ToolSuggestion,
  ToolSelectionCriteria,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// CLASS EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { ToolRegistry, getToolRegistry } from './ToolRegistry';
export { ToolSelector, getToolSelector } from './ToolSelector';
export { ToolExecutor, getToolExecutor } from './ToolExecutor';

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

import { ToolRegistry } from './ToolRegistry';
import { ToolSelector } from './ToolSelector';
import { ToolExecutor } from './ToolExecutor';
import type { ToolExecutionRequest, ToolExecutionResult, MCPTool } from './types';

/**
 * Quick tool execution - selects best tool and executes in one call.
 *
 * @param task - Natural language task description
 * @param params - Parameters to pass to the tool
 * @param timeout - Optional timeout in milliseconds
 * @returns Execution result
 *
 * @example
 * ```typescript
 * const result = await quickExecute(
 *   'scrape product prices',
 *   { url: 'https://amazon.com/dp/B09...' }
 * );
 * ```
 */
export async function quickExecute(
  task: string,
  params: Record<string, unknown>,
  timeout?: number
): Promise<ToolExecutionResult> {
  const selector = ToolSelector.getInstance();
  const executor = ToolExecutor.getInstance();

  // Select best tool
  const suggestions = await selector.selectTools(task, 1);

  if (suggestions.length === 0) {
    return {
      success: false,
      error: {
        code: 'NO_TOOL_FOUND',
        message: `No suitable tool found for task: ${task}`,
        isRetryable: false,
      },
      toolId: 'unknown',
      operationId: 'unknown',
      executionMs: 0,
      retryCount: 0,
      requestId: `req-${Date.now()}`,
      timestamp: new Date(),
    };
  }

  const bestTool = suggestions[0].tool;
  const bestOperation = suggestions[0].operation?.name || 'default';

  // Execute
  return executor.execute({
    toolId: bestTool.id,
    operationId: bestOperation,
    parameters: params,
    timeout,
  });
}

/**
 * Get all available tools grouped by category.
 *
 * @returns Tools grouped by category
 *
 * @example
 * ```typescript
 * const grouped = getToolsByCategory();
 * console.log(grouped['browser-automation']);
 * // [{ id: 'control-chrome', ... }, { id: 'kapture', ... }]
 * ```
 */
export function getToolsByCategory(): Record<string, MCPTool[]> {
  const registry = ToolRegistry.getInstance();
  const tools = registry.getAllTools();
  const grouped: Record<string, MCPTool[]> = {};

  for (const tool of tools) {
    if (!grouped[tool.category]) {
      grouped[tool.category] = [];
    }
    grouped[tool.category].push(tool);
  }

  return grouped;
}

/**
 * Check health of all registered tools.
 *
 * @returns Health status for each tool
 *
 * @example
 * ```typescript
 * const health = await checkAllToolsHealth();
 * for (const [toolId, status] of Object.entries(health)) {
 *   console.log(`${toolId}: ${status.healthy ? '✅' : '❌'}`);
 * }
 * ```
 */
export async function checkAllToolsHealth(): Promise<
  Record<string, { healthy: boolean; latencyMs?: number; error?: string }>
> {
  const registry = ToolRegistry.getInstance();
  const tools = registry.getAllTools();
  const results: Record<string, { healthy: boolean; latencyMs?: number; error?: string }> = {};

  await Promise.all(
    tools.map(async (tool) => {
      try {
        const health = await registry.healthCheck(tool.id);
        results[tool.id] = {
          healthy: health.healthy,
          latencyMs: health.latencyMs,
        };
      } catch (error) {
        results[tool.id] = {
          healthy: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  return results;
}
