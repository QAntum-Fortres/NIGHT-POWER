/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🧠 QANTUM - EXECUTOR AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @version 23.3.1 - Bug Fix Edition
 * @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * @license PROPRIETARY AND CONFIDENTIAL
 * 
 * This file is part of QAntum.
 * Unauthorized copying, modification, distribution, or use of this file,
 * via any medium, is strictly prohibited without express written permission.
 * 
 * For licensing inquiries: dimitar.prodromov@QAntum.dev
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { BaseAgent } from './base-agent';
import {
  AgentConfig,
  SwarmMessage,
  SwarmTask,
  TaskResult,
} from '../types';

/**
 * Browser page interface for type-safe page operations
 */
interface BrowserPageLike {
  goto: (url: string, options?: { waitUntil?: string; timeout?: number }) => Promise<unknown>;
  url: () => string;
  $: (selector: string) => Promise<ElementHandleLike | null>;
  $$: (selector: string) => Promise<ElementHandleLike[]>;
  content: () => Promise<string>;
}

interface ElementHandleLike {
  click: () => Promise<void>;
  fill: (value: string) => Promise<void>;
  textContent: () => Promise<string | null>;
  innerHTML: () => Promise<string>;
}

export class ExecutorAgent extends BaseAgent {
  private page: BrowserPageLike | null = null;
  private executionHistory: TaskResult[] = [];
  private maxHistorySize: number = 500;
  private retryDelay: number = 1000;

  constructor(config?: Partial<AgentConfig>) {
    super({ ...config, role: 'executor' });
  }

  setPage(page: unknown): void {
    if (this.isBrowserPage(page)) {
      this.page = page;
      this.log('Browser page reference set successfully');
    } else {
      throw new Error('Provided page object does not match BrowserPageLike interface');
    }
  }

  private isBrowserPage(page: unknown): page is BrowserPageLike {
    return (
      typeof page === 'object' &&
      page !== null &&
      'goto' in page &&
      'url' in page &&
      '$' in page
    );
  }

  protected async handleMessage(message: SwarmMessage): Promise<SwarmMessage | null> {
    switch (message.type) {
      case 'task': {
        const payload = message.payload as { task: SwarmTask };
        const result = await this.executeTask(payload.task);
        return this.createMessage(message.from, 'result', { result }, message.traceId);
      }
      
      case 'feedback': {
        const payload = message.payload as { task: SwarmTask; feedback: string };
        const retryResult = await this.retryWithFeedback(
          payload.task,
          payload.feedback
        );
        return this.createMessage(message.from, 'result', { result: retryResult }, message.traceId);
      }

      default:
        return null;
    }
  }

  async executeTask(task: SwarmTask): Promise<TaskResult> {
    const startTime = Date.now();
    const reasoning: string[] = [];
    this.log(`Executing task: ${task.type} - ${task.target}`);

    try {
      let result: unknown;
      let selectorUsed: string | undefined;
      let confidence = 0.8;

      if (!this.page && ['navigate', 'click', 'fill', 'extract', 'validate'].includes(task.type)) {
        throw new Error(`Task ${task.type} requires an active browser page.`);
      }

      switch (task.type) {
        case 'navigate':
          result = await this.executeNavigate(task, reasoning);
          confidence = 0.95;
          break;
        case 'click': {
          const clickRes = await this.executeClick(task, reasoning);
          result = clickRes.result;
          selectorUsed = clickRes.selector;
          confidence = clickRes.confidence;
          break;
        }
        case 'fill': {
          const fillRes = await this.executeFill(task, reasoning);
          result = fillRes.result;
          selectorUsed = fillRes.selector;
          confidence = fillRes.confidence;
          break;
        }
        case 'extract': {
          const extractRes = await this.executeExtract(task, reasoning);
          result = extractRes.result;
          selectorUsed = extractRes.selector;
          confidence = extractRes.confidence;
          break;
        }
        case 'validate': {
          const validateRes = await this.executeValidate(task, reasoning);
          result = validateRes.result;
          confidence = validateRes.confidence;
          break;
        }
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }

      const taskResult: TaskResult = {
        taskId: task.id,
        traceId: task.traceId,
        success: true,
        data: result,
        duration: Date.now() - startTime,
        executedBy: this.id,
        reasoning,
        selectorUsed,
        confidence,
        completedAt: new Date(),
      };

      this.storeResult(taskResult);
      return taskResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const taskResult: TaskResult = {
        taskId: task.id,
        traceId: task.traceId,
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
        executedBy: this.id,
        reasoning: [...reasoning, `Error: ${errorMessage}`],
        completedAt: new Date(),
      };

      if (task.retries && task.retries > 0) {
        await new Promise(res => setTimeout(res, this.retryDelay));
        return this.executeTask({ ...task, retries: task.retries - 1 });
      }

      this.storeResult(taskResult);
      return taskResult;
    }
  }

  private async executeNavigate(task: SwarmTask, reasoning: string[]): Promise<{ url: string; success: boolean }> {
    reasoning.push(`Navigating to: ${task.target}`);
    
    if (!this.page) {
      reasoning.push('No browser page available, simulating navigation');
      return { url: task.target, success: true };
    }
    
    await this.page.goto(task.target, { waitUntil: 'domcontentloaded' });
    const currentUrl = this.page.url();
    reasoning.push(`Successfully navigated to: ${currentUrl}`);
    return { url: currentUrl, success: true };
  }

  private async executeClick(
    task: SwarmTask, 
    reasoning: string[]
  ): Promise<{ result: { clicked: boolean }; selector: string; confidence: number }> {
    reasoning.push(`Attempting to click: ${task.target}`);
    const selectors = this.generateSelectors(task.target, 'click');
    
    if (!this.page) {
      reasoning.push('No browser page available, simulating click');
      return { result: { clicked: true }, selector: selectors[0] || task.target, confidence: 0.5 };
    }
    
    for (const selector of selectors) {
      const el = await this.page.$(selector);
      if (el) {
        await el.click();
        reasoning.push(`Clicked element with selector: ${selector}`);
        return { result: { clicked: true }, selector, confidence: 0.9 };
      }
    }
    throw new Error(`Element not found: ${task.target}`);
  }

  private async executeFill(
    task: SwarmTask, 
    reasoning: string[]
  ): Promise<{ result: { filled: boolean }; selector: string; confidence: number }> {
    reasoning.push(`Attempting to fill: ${task.target}`);
    const selectors = this.generateSelectors(task.target, 'fill');
    const value = (task.params as { value?: string })?.value || '';
    
    if (!this.page) {
      reasoning.push('No browser page available, simulating fill');
      return { result: { filled: true }, selector: selectors[0] || task.target, confidence: 0.5 };
    }
    
    for (const selector of selectors) {
      const el = await this.page.$(selector);
      if (el) {
        await el.fill(value);
        reasoning.push(`Filled element with selector: ${selector}`);
        return { result: { filled: true }, selector, confidence: 0.9 };
      }
    }
    throw new Error(`Field not found: ${task.target}`);
  }

  private async executeExtract(
    task: SwarmTask,
    reasoning: string[]
  ): Promise<{ result: { extracted: string[] }; selector: string; confidence: number }> {
    reasoning.push(`Attempting to extract from: ${task.target}`);
    const selector = task.target;
    
    if (!this.page) {
      reasoning.push('No browser page available, simulating extraction');
      return { result: { extracted: [] }, selector, confidence: 0.5 };
    }
    
    const elements = await this.page.$$(selector);
    const extracted: string[] = [];
    
    for (const el of elements) {
      const text = await el.textContent();
      if (text) extracted.push(text);
    }
    
    reasoning.push(`Extracted ${extracted.length} items`);
    return { result: { extracted }, selector, confidence: 0.85 };
  }

  private async executeValidate(
    task: SwarmTask,
    reasoning: string[]
  ): Promise<{ result: { valid: boolean; checks: Array<{ name: string; passed: boolean }> }; confidence: number }> {
    reasoning.push(`Validating: ${task.target}`);
    const checks: Array<{ name: string; passed: boolean }> = [];
    
    if (!this.page) {
      reasoning.push('No browser page available, simulating validation');
      return { result: { valid: true, checks: [] }, confidence: 0.5 };
    }
    
    const pageContent = await this.page.content();
    const validationChecks = (task.params as { checks?: Array<{ name: string; selector: string }> })?.checks || [];
    
    for (const check of validationChecks) {
      const element = await this.page.$(check.selector);
      checks.push({
        name: check.name,
        passed: element !== null,
      });
    }
    
    // Also check if target exists in content
    const targetExists = pageContent.includes(task.target);
    checks.push({ name: 'target-exists', passed: targetExists });
    
    const allPassed = checks.every(c => c.passed);
    reasoning.push(`Validation complete: ${allPassed ? 'PASSED' : 'FAILED'}`);
    
    return { result: { valid: allPassed, checks }, confidence: 0.9 };
  }

  private async retryWithFeedback(task: SwarmTask, feedback: string): Promise<TaskResult> {
    this.log(`Retrying task with feedback: ${feedback}`);
    
    // Adjust task based on feedback - use params for metadata
    const adjustedTask: SwarmTask = {
      ...task,
      params: {
        ...task.params,
        feedback,
        retryAttempt: true,
      },
    };
    
    return this.executeTask(adjustedTask);
  }

  private generateSelectors(target: string, action: string): string[] {
    const selectors: string[] = [];
    
    // Data attributes (most reliable)
    selectors.push(`[data-testid="${target}"]`);
    selectors.push(`[data-qa="${target}"]`);
    selectors.push(`[data-cy="${target}"]`);
    
    // ID selector
    selectors.push(`#${target}`);
    
    // Name attribute
    selectors.push(`[name="${target}"]`);
    
    // Text-based selectors
    if (action === 'click') {
      selectors.push(`button:has-text("${target}")`);
      selectors.push(`a:has-text("${target}")`);
      selectors.push(`text="${target}"`);
    } else if (action === 'fill') {
      selectors.push(`input[placeholder*="${target}"]`);
      selectors.push(`textarea[placeholder*="${target}"]`);
      selectors.push(`label:has-text("${target}") + input`);
    }
    
    // Aria label
    selectors.push(`[aria-label="${target}"]`);
    
    // Class-based (less reliable, last resort)
    selectors.push(`.${target}`);
    
    return selectors;
  }

  private storeResult(result: TaskResult): void {
    this.executionHistory.push(result);
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }
  }

  getExecutionHistory(): TaskResult[] {
    return [...this.executionHistory];
  }

  getSuccessRate(): number {
    if (this.executionHistory.length === 0) return 0;
    const successful = this.executionHistory.filter(r => r.success).length;
    return successful / this.executionHistory.length;
  }

  clearHistory(): void {
    this.executionHistory = [];
    this.log('Execution history cleared');
  }
}
