/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: ERROR MODULE EXPORTS
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export {
  ErrorHandler,
  ErrorClassifier,
  RetryManager,
  RecoveryStrategies,
  DeadLetterQueue,
  CircuitBreaker,
  ErrorCategory,
  ErrorSeverity,
  CircuitState,
  type ClassifiedError,
  type RecoveryAction,
  type RetryConfig,
  type DeadLetterItem,
  type RecoveryContext
} from './ErrorHandler';
