/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: SCHEDULER SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Task scheduling with cron expressions, intervals, and queue management
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0-QANTUM-PRIME
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

import { logger } from '../api/unified/utils/logger';
// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ScheduledTask {
  id: string;
  name: string;
  schedule: string | number;  // Cron expression or interval in ms
  handler: () => Promise<void> | void;
  options?: TaskOptions;
}

export interface TaskOptions {
  timezone?: string;
  runOnStart?: boolean;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  concurrency?: number;
  enabled?: boolean;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  error?: string;
  duration?: number;
}

interface SchedulerState {
  tasks: Map<string, ScheduledTaskInternal>;
  executions: TaskExecution[];
  running: boolean;
}

interface ScheduledTaskInternal extends ScheduledTask {
  nextRun?: Date;
  lastRun?: Date;
  runCount: number;
  failCount: number;
  timer?: ReturnType<typeof setTimeout>;
  cronParts?: CronParts;
}

interface CronParts {
  minute: number[];
  hour: number[];
  dayOfMonth: number[];
  month: number[];
  dayOfWeek: number[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRON PARSER
// ═══════════════════════════════════════════════════════════════════════════════

export class CronParser {
  static parse(expression: string): CronParts {
    const parts = expression.trim().split(/\s+/);
    
    if (parts.length !== 5) {
      throw new Error(`Invalid cron expression: ${expression}`);
    }

    return {
      minute: this.parsePart(parts[0], 0, 59),
      hour: this.parsePart(parts[1], 0, 23),
      dayOfMonth: this.parsePart(parts[2], 1, 31),
      month: this.parsePart(parts[3], 1, 12),
      dayOfWeek: this.parsePart(parts[4], 0, 6)
    };
  }

  private static parsePart(part: string, min: number, max: number): number[] {
    if (part === '*') {
      return this.range(min, max);
    }

    const values: number[] = [];

    for (const segment of part.split(',')) {
      if (segment.includes('/')) {
        const [range, step] = segment.split('/');
        const stepNum = parseInt(step);
        const [start, end] = range === '*' 
          ? [min, max] 
          : range.split('-').map(Number);
        
        for (let i = start; i <= (end ?? max); i += stepNum) {
          values.push(i);
        }
      } else if (segment.includes('-')) {
        const [start, end] = segment.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          values.push(i);
        }
      } else {
        values.push(parseInt(segment));
      }
    }

    return [...new Set(values)].sort((a, b) => a - b);
  }

  private static range(start: number, end: number): number[] {
    const result: number[] = [];
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  }

  static getNextRun(cronParts: CronParts, from: Date = new Date()): Date {
    const next = new Date(from.getTime());
    next.setSeconds(0);
    next.setMilliseconds(0);
    next.setMinutes(next.getMinutes() + 1);

    for (let i = 0; i < 366 * 24 * 60; i++) {
      if (
        cronParts.month.includes(next.getMonth() + 1) &&
        cronParts.dayOfMonth.includes(next.getDate()) &&
        cronParts.dayOfWeek.includes(next.getDay()) &&
        cronParts.hour.includes(next.getHours()) &&
        cronParts.minute.includes(next.getMinutes())
      ) {
        return next;
      }

      next.setMinutes(next.getMinutes() + 1);
    }

    throw new Error('Could not calculate next run');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULER
// ═══════════════════════════════════════════════════════════════════════════════

export class Scheduler extends EventEmitter {
  private state: SchedulerState = {
    tasks: new Map(),
    executions: [],
    running: false
  };

  private maxExecutionHistory: number = 1000;

  /**
   * Add scheduled task
   */
  addTask(task: ScheduledTask): this {
    const internal: ScheduledTaskInternal = {
      ...task,
      runCount: 0,
      failCount: 0,
      options: {
        enabled: true,
        retries: 3,
        retryDelay: 1000,
        timeout: 30000,
        ...task.options
      }
    };

    // Parse cron if string
    if (typeof task.schedule === 'string') {
      internal.cronParts = CronParser.parse(task.schedule);
      internal.nextRun = CronParser.getNextRun(internal.cronParts);
    }

    this.state.tasks.set(task.id, internal);
    this.emit('taskAdded', task.id);

    // Start scheduling if running
    if (this.state.running) {
      this.scheduleTask(internal);
    }

    return this;
  }

  /**
   * Remove task
   */
  removeTask(id: string): boolean {
    const task = this.state.tasks.get(id);
    
    if (!task) return false;

    if (task.timer) {
      clearTimeout(task.timer);
    }

    this.state.tasks.delete(id);
    this.emit('taskRemoved', id);
    
    return true;
  }

  /**
   * Get task
   */
  getTask(id: string): ScheduledTask | undefined {
    return this.state.tasks.get(id);
  }

  /**
   * List all tasks
   */
  listTasks(): Array<{
    id: string;
    name: string;
    schedule: string | number;
    enabled: boolean;
    nextRun?: Date;
    lastRun?: Date;
    runCount: number;
  }> {
    return Array.from(this.state.tasks.values()).map(t => ({
      id: t.id,
      name: t.name,
      schedule: t.schedule,
      enabled: t.options?.enabled ?? true,
      nextRun: t.nextRun,
      lastRun: t.lastRun,
      runCount: t.runCount
    }));
  }

  /**
   * Enable task
   */
  enableTask(id: string): void {
    const task = this.state.tasks.get(id);
    if (task?.options) {
      task.options.enabled = true;
      if (this.state.running) {
        this.scheduleTask(task);
      }
    }
  }

  /**
   * Disable task
   */
  disableTask(id: string): void {
    const task = this.state.tasks.get(id);
    if (task) {
      if (task.options) task.options.enabled = false;
      if (task.timer) {
        clearTimeout(task.timer);
        task.timer = undefined;
      }
    }
  }

  /**
   * Run task immediately
   */
  async runTask(id: string): Promise<TaskExecution> {
    const task = this.state.tasks.get(id);
    
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    return this.executeTask(task);
  }

  /**
   * Start scheduler
   */
  start(): void {
    if (this.state.running) return;

    this.state.running = true;
    this.emit('started');

    // Schedule all tasks
    for (const task of this.state.tasks.values()) {
      if (task.options?.enabled !== false) {
        // Run on start if configured
        if (task.options?.runOnStart) {
          this.executeTask(task).catch(() => {});
        }
        this.scheduleTask(task);
      }
    }
  }

  /**
   * Stop scheduler
   */
  stop(): void {
    if (!this.state.running) return;

    this.state.running = false;

    // Clear all timers
    for (const task of this.state.tasks.values()) {
      if (task.timer) {
        clearTimeout(task.timer);
        task.timer = undefined;
      }
    }

    this.emit('stopped');
  }

  /**
   * Get execution history
   */
  getExecutions(taskId?: string): TaskExecution[] {
    if (taskId) {
      return this.state.executions.filter(e => e.taskId === taskId);
    }
    return this.state.executions;
  }

  /**
   * Get scheduler stats
   */
  getStats(): {
    totalTasks: number;
    enabledTasks: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    running: boolean;
  } {
    const execs = this.state.executions;
    
    return {
      totalTasks: this.state.tasks.size,
      enabledTasks: Array.from(this.state.tasks.values())
        .filter(t => t.options?.enabled !== false).length,
      totalExecutions: execs.length,
      successfulExecutions: execs.filter(e => e.status === 'completed').length,
      failedExecutions: execs.filter(e => e.status === 'failed' || e.status === 'timeout').length,
      running: this.state.running
    };
  }

  private scheduleTask(task: ScheduledTaskInternal): void {
    if (!this.state.running || task.options?.enabled === false) {
      return;
    }

    // Clear existing timer
    if (task.timer) {
      clearTimeout(task.timer);
    }

    let delay: number;

    if (typeof task.schedule === 'number') {
      // Interval-based scheduling
      delay = task.schedule;
    } else {
      // Cron-based scheduling
      if (!task.cronParts) {
        task.cronParts = CronParser.parse(task.schedule);
      }
      
      task.nextRun = CronParser.getNextRun(task.cronParts);
      delay = task.nextRun.getTime() - Date.now();
    }

    // Ensure positive delay
    delay = Math.max(100, delay);

    task.timer = setTimeout(async () => {
      if (!this.state.running || task.options?.enabled === false) {
        return;
      }

      await this.executeTask(task);
      
      // Reschedule
      this.scheduleTask(task);
    }, delay);
  }

  private async executeTask(task: ScheduledTaskInternal): Promise<TaskExecution> {
    const executionId = `${task.id}-${Date.now()}`;
    
    const execution: TaskExecution = {
      id: executionId,
      taskId: task.id,
      startTime: new Date(),
      status: 'running'
    };

    this.state.executions.push(execution);
    this.trimExecutionHistory();

    this.emit('taskStart', { taskId: task.id, executionId });

    let retries = task.options?.retries ?? 0;
    let lastError: Error | undefined;

    while (retries >= 0) {
      try {
        // Timeout wrapper
        const timeout = task.options?.timeout ?? 30000;
        
        await Promise.race([
          task.handler(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Task timeout')), timeout)
          )
        ]);

        // Success
        execution.status = 'completed';
        task.runCount++;
        task.lastRun = new Date();
        break;

      } catch (error) {
        lastError = error as Error;
        retries--;

        if (retries >= 0) {
          await this.delay(task.options?.retryDelay ?? 1000);
        }
      }
    }

    // If still running, it failed
    if (execution.status === 'running') {
      execution.status = lastError?.message === 'Task timeout' ? 'timeout' : 'failed';
      execution.error = lastError?.message;
      task.failCount++;
    }

    execution.endTime = new Date();
    execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

    this.emit('taskEnd', {
      taskId: task.id,
      executionId,
      status: execution.status,
      duration: execution.duration
    });

    return execution;
  }

  private trimExecutionHistory(): void {
    if (this.state.executions.length > this.maxExecutionHistory) {
      this.state.executions = this.state.executions.slice(-this.maxExecutionHistory);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDEFINED SCHEDULES
// ═══════════════════════════════════════════════════════════════════════════════

export const SCHEDULES = {
  EVERY_MINUTE: '* * * * *',
  EVERY_5_MINUTES: '*/5 * * * *',
  EVERY_15_MINUTES: '*/15 * * * *',
  EVERY_30_MINUTES: '*/30 * * * *',
  EVERY_HOUR: '0 * * * *',
  EVERY_2_HOURS: '0 */2 * * *',
  EVERY_6_HOURS: '0 */6 * * *',
  EVERY_12_HOURS: '0 */12 * * *',
  DAILY: '0 0 * * *',
  DAILY_9AM: '0 9 * * *',
  DAILY_6PM: '0 18 * * *',
  WEEKLY: '0 0 * * 0',
  WEEKLY_MONDAY: '0 0 * * 1',
  MONTHLY: '0 0 1 * *',
  QUARTERLY: '0 0 1 */3 *',
  YEARLY: '0 0 1 1 *',
  WEEKDAYS: '0 9 * * 1-5',
  WEEKENDS: '0 10 * * 0,6'
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SCHEDULER
// ═══════════════════════════════════════════════════════════════════════════════

export class TestScheduler extends Scheduler {
  private testSuites: Map<string, TestSuiteSchedule> = new Map();

  addTestSuite(config: TestSuiteSchedule): this {
    this.testSuites.set(config.id, config);

    this.addTask({
      id: `test-suite-${config.id}`,
      name: `Test Suite: ${config.name}`,
      schedule: config.schedule,
      handler: async () => {
        this.emit('suiteStart', config);
        
        // Execute test suite logic here
        logger.debug(`Running test suite: ${config.name}`);
        
        this.emit('suiteEnd', config);
      },
      options: config.options
    });

    return this;
  }

  removeTestSuite(id: string): boolean {
    this.testSuites.delete(id);
    return this.removeTask(`test-suite-${id}`);
  }
}

export interface TestSuiteSchedule {
  id: string;
  name: string;
  schedule: string | number;
  tests: string[];
  browser?: string;
  options?: TaskOptions;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export function createScheduler(): Scheduler {
  return new Scheduler();
}

export function createTestScheduler(): TestScheduler {
  return new TestScheduler();
}

export default {
  Scheduler,
  TestScheduler,
  CronParser,
  SCHEDULES,
  createScheduler,
  createTestScheduler
};
