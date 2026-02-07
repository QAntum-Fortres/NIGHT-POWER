/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SWARM INTERFACES - Type-Safe Communication Primitives
 * Part of PHYSICS Layer - Interaction Rules
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * "Тип-безопасност е щитът срещу хаоса."
 *                                     — QAntum Philosophy
 * 
 * These interfaces replace `any` types in the swarm subsystem with
 * properly typed contracts.
 * 
 * @module layers/physics/swarm-interfaces
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// SWARM MESSAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Base interface for all swarm messages
 */
export interface ISwarmMessage {
  readonly type: string;
  readonly timestamp: number;
  readonly correlationId?: string;
}

/**
 * Task output from a swarm worker
 */
export interface ITaskOutput {
  readonly success: boolean;
  readonly data?: unknown;
  readonly error?: string;
  readonly metrics?: ITaskMetrics;
}

/**
 * Task execution metrics
 */
export interface ITaskMetrics {
  readonly duration: number;
  readonly retries: number;
  readonly memoryUsed?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBSUB CHANNEL TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Channel message types by channel name
 */
export interface ISwarmChannels {
  'task:assigned': ITaskAssignedMessage;
  'task:completed': ITaskCompletedMessage;
  'task:failed': ITaskFailedMessage;
  'worker:ready': IWorkerReadyMessage;
  'worker:busy': IWorkerBusyMessage;
  'swarm:metrics': ISwarmMetricsMessage;
  [key: string]: ISwarmMessage; // Allow custom channels
}

/**
 * Task assigned to a worker
 */
export interface ITaskAssignedMessage extends ISwarmMessage {
  readonly type: 'task:assigned';
  readonly taskId: string;
  readonly workerId: string;
  readonly payload: unknown;
  readonly priority: number;
}

/**
 * Task completed successfully
 */
export interface ITaskCompletedMessage extends ISwarmMessage {
  readonly type: 'task:completed';
  readonly taskId: string;
  readonly workerId: string;
  readonly output: ITaskOutput;
}

/**
 * Task failed
 */
export interface ITaskFailedMessage extends ISwarmMessage {
  readonly type: 'task:failed';
  readonly taskId: string;
  readonly workerId: string;
  readonly error: string;
  readonly retryable: boolean;
}

/**
 * Worker ready for tasks
 */
export interface IWorkerReadyMessage extends ISwarmMessage {
  readonly type: 'worker:ready';
  readonly workerId: string;
  readonly capacity: number;
}

/**
 * Worker busy processing
 */
export interface IWorkerBusyMessage extends ISwarmMessage {
  readonly type: 'worker:busy';
  readonly workerId: string;
  readonly currentTasks: number;
}

/**
 * Swarm-wide metrics
 */
export interface ISwarmMetricsMessage extends ISwarmMessage {
  readonly type: 'swarm:metrics';
  readonly activeWorkers: number;
  readonly pendingTasks: number;
  readonly completedTasks: number;
  readonly failedTasks: number;
  readonly avgTaskDuration: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CALLBACK TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Type-safe subscriber callback
 */
export type SwarmSubscriberCallback<T extends ISwarmMessage = ISwarmMessage> = (data: T) => void;

/**
 * Generic subscriber for any message type
 */
export type GenericSwarmCallback = (data: ISwarmMessage) => void;

// ═══════════════════════════════════════════════════════════════════════════
// ATOMIC STATE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Atomic state container for thread-safe operations
 */
export interface IAtomicState<T> {
  readonly value: T;
  readonly version: number;
  readonly lastModified: number;
}

/**
 * Resource metrics for monitoring
 */
export interface IResourceMetrics {
  readonly cpuUsage: number;
  readonly memoryUsage: number;
  readonly heapUsed: number;
  readonly heapTotal: number;
  readonly external: number;
  readonly timestamp: number;
}

/**
 * Swarm packet for inter-worker communication
 */
export interface ISwarmPacket<T = unknown> {
  readonly header: IPacketHeader;
  readonly payload: T;
  readonly checksum?: string;
}

/**
 * Packet header with routing info
 */
export interface IPacketHeader {
  readonly source: string;
  readonly destination: string;
  readonly sequence: number;
  readonly priority: number;
  readonly timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE GUARDS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Type guard for task completed message
 */
export function isTaskCompletedMessage(msg: ISwarmMessage): msg is ITaskCompletedMessage {
  return msg.type === 'task:completed';
}

/**
 * Type guard for task failed message
 */
export function isTaskFailedMessage(msg: ISwarmMessage): msg is ITaskFailedMessage {
  return msg.type === 'task:failed';
}

/**
 * Type guard for swarm metrics message
 */
export function isSwarmMetricsMessage(msg: ISwarmMessage): msg is ISwarmMetricsMessage {
  return msg.type === 'swarm:metrics';
}

/**
 * Type guard for worker ready message
 */
export function isWorkerReadyMessage(msg: ISwarmMessage): msg is IWorkerReadyMessage {
  return msg.type === 'worker:ready';
}
