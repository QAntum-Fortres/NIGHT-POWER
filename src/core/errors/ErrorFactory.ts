/**
 * @file ErrorFactory.ts
 * @description Centralized Error Factory - Единна система за грешки в QAntum Prime
 * @version 1.0.0
 * @author QANTUM AI
 * @phase Phase 3: Development (The Synthesis)
 * 
 * @example
 * ```typescript
 * import { QAntumError, ErrorCodes } from '@/core/errors/ErrorFactory';
 * 
 * throw new QAntumError(ErrorCodes.NETWORK_TIMEOUT, {
 *   url: 'https://example.com',
 *   timeout: 5000
 * });
 * ```
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR CODES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Всички QAntum error кодове
 * Format: QA-{CATEGORY}{NUMBER}
 * 
 * Categories:
 * - 0XX: Core/System
 * - 1XX: Network
 * - 2XX: Authentication
 * - 3XX: Browser/Ghost
 * - 4XX: Oracle/AI
 * - 5XX: Swarm
 * - 6XX: Licensing
 * - 7XX: Security
 * - 8XX: Billing
 * - 9XX: Database
 */
export const ErrorCodes = {
  // ═══ CORE (0XX) ═══════════════════════════════════════════════════════════
  UNKNOWN: 'QA-001',
  INVALID_CONFIGURATION: 'QA-002',
  INITIALIZATION_FAILED: 'QA-003',
  SHUTDOWN_ERROR: 'QA-004',
  RESOURCE_EXHAUSTED: 'QA-005',
  TIMEOUT: 'QA-006',
  VALIDATION_ERROR: 'QA-007',
  NOT_IMPLEMENTED: 'QA-008',
  DEPENDENCY_ERROR: 'QA-009',
  CIRCULAR_DEPENDENCY: 'QA-010',

  // ═══ NETWORK (1XX) ════════════════════════════════════════════════════════
  NETWORK_ERROR: 'QA-101',
  NETWORK_TIMEOUT: 'QA-102',
  DNS_RESOLUTION_FAILED: 'QA-103',
  SSL_CERTIFICATE_ERROR: 'QA-104',
  PROXY_ERROR: 'QA-105',
  CONNECTION_REFUSED: 'QA-106',
  RATE_LIMITED: 'QA-107',
  NETWORK_PARTITION: 'QA-108',
  BANDWIDTH_EXCEEDED: 'QA-109',
  WEBSOCKET_ERROR: 'QA-110',

  // ═══ AUTHENTICATION (2XX) ═════════════════════════════════════════════════
  AUTH_FAILED: 'QA-201',
  TOKEN_EXPIRED: 'QA-202',
  TOKEN_INVALID: 'QA-203',
  INSUFFICIENT_PERMISSIONS: 'QA-204',
  SESSION_EXPIRED: 'QA-205',
  MFA_REQUIRED: 'QA-206',
  ACCOUNT_LOCKED: 'QA-207',
  CAPTCHA_REQUIRED: 'QA-208',
  LOGIN_RATE_LIMITED: 'QA-209',
  OAUTH_ERROR: 'QA-210',

  // ═══ BROWSER/GHOST (3XX) ══════════════════════════════════════════════════
  BROWSER_LAUNCH_FAILED: 'QA-301',
  BROWSER_CRASHED: 'QA-302',
  PAGE_LOAD_TIMEOUT: 'QA-303',
  NAVIGATION_ERROR: 'QA-304',
  ELEMENT_NOT_FOUND: 'QA-305',
  ELEMENT_NOT_VISIBLE: 'QA-306',
  ELEMENT_NOT_INTERACTABLE: 'QA-307',
  IFRAME_ERROR: 'QA-308',
  SCREENSHOT_FAILED: 'QA-309',
  GHOST_DETECTION: 'QA-310',
  FINGERPRINT_BLOCKED: 'QA-311',
  CAPTCHA_DETECTED: 'QA-312',
  BOT_PROTECTION_TRIGGERED: 'QA-313',
  HEADLESS_DETECTED: 'QA-314',
  BROWSER_CONTEXT_ERROR: 'QA-315',

  // ═══ ORACLE/AI (4XX) ══════════════════════════════════════════════════════
  ORACLE_OFFLINE: 'QA-401',
  PREDICTION_FAILED: 'QA-402',
  MODEL_LOAD_ERROR: 'QA-403',
  INFERENCE_TIMEOUT: 'QA-404',
  LOW_CONFIDENCE: 'QA-405',
  TRAINING_ERROR: 'QA-406',
  FEATURE_EXTRACTION_FAILED: 'QA-407',
  CHRONOS_PARADOX: 'QA-408',
  MEMORY_OVERFLOW: 'QA-409',
  GPU_ERROR: 'QA-410',
  QUANTUM_DECOHERENCE: 'QA-411',

  // ═══ SWARM (5XX) ══════════════════════════════════════════════════════════
  SWARM_INITIALIZATION_FAILED: 'QA-501',
  WORKER_SPAWN_ERROR: 'QA-502',
  WORKER_CRASHED: 'QA-503',
  TASK_QUEUE_FULL: 'QA-504',
  TASK_TIMEOUT: 'QA-505',
  WORKER_COMMUNICATION_ERROR: 'QA-506',
  LOAD_BALANCING_ERROR: 'QA-507',
  FAILOVER_FAILED: 'QA-508',
  WORKER_MEMORY_EXCEEDED: 'QA-509',
  SWARM_SHUTDOWN_TIMEOUT: 'QA-510',
  COORDINATION_ERROR: 'QA-511',

  // ═══ LICENSING (6XX) ══════════════════════════════════════════════════════
  LICENSE_INVALID: 'QA-601',
  LICENSE_EXPIRED: 'QA-602',
  LICENSE_TAMPERED: 'QA-603',
  HARDWARE_MISMATCH: 'QA-604',
  ACTIVATION_FAILED: 'QA-605',
  DEACTIVATION_FAILED: 'QA-606',
  LICENSE_SERVER_UNREACHABLE: 'QA-607',
  TRIAL_EXPIRED: 'QA-608',
  FEATURE_NOT_LICENSED: 'QA-609',
  LICENSE_REVOKED: 'QA-610',

  // ═══ SECURITY (7XX) ═══════════════════════════════════════════════════════
  SECURITY_VIOLATION: 'QA-701',
  INTRUSION_DETECTED: 'QA-702',
  ENCRYPTION_ERROR: 'QA-703',
  DECRYPTION_ERROR: 'QA-704',
  SIGNATURE_INVALID: 'QA-705',
  TAMPER_DETECTED: 'QA-706',
  HONEYPOT_TRIGGERED: 'QA-707',
  FATALITY_PROTOCOL_ACTIVE: 'QA-708',
  VAULT_LOCKED: 'QA-709',
  KEY_DERIVATION_FAILED: 'QA-710',

  // ═══ BILLING (8XX) ════════════════════════════════════════════════════════
  PAYMENT_FAILED: 'QA-801',
  CARD_DECLINED: 'QA-802',
  INSUFFICIENT_FUNDS: 'QA-803',
  SUBSCRIPTION_CANCELLED: 'QA-804',
  INVOICE_ERROR: 'QA-805',
  BILLING_ADDRESS_INVALID: 'QA-806',
  PAYMENT_METHOD_EXPIRED: 'QA-807',
  REFUND_ERROR: 'QA-808',
  STRIPE_WEBHOOK_ERROR: 'QA-809',
  USAGE_LIMIT_EXCEEDED: 'QA-810',

  // ═══ DATABASE (9XX) ═══════════════════════════════════════════════════════
  DATABASE_CONNECTION_FAILED: 'QA-901',
  QUERY_TIMEOUT: 'QA-902',
  DEADLOCK_DETECTED: 'QA-903',
  CONSTRAINT_VIOLATION: 'QA-904',
  DATA_CORRUPTION: 'QA-905',
  MIGRATION_FAILED: 'QA-906',
  BACKUP_FAILED: 'QA-907',
  RESTORE_FAILED: 'QA-908',
  REPLICATION_LAG: 'QA-909',
  STORAGE_FULL: 'QA-910',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

export enum ErrorCategory {
  CORE = 'CORE',
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  BROWSER = 'BROWSER',
  ORACLE = 'ORACLE',
  SWARM = 'SWARM',
  LICENSING = 'LICENSING',
  SECURITY = 'SECURITY',
  BILLING = 'BILLING',
  DATABASE = 'DATABASE',
}

export enum ErrorSeverity {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  CRITICAL = 4,
  FATAL = 5,
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR METADATA
// ═══════════════════════════════════════════════════════════════════════════════

interface ErrorMetadata {
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  humanReadable: string;
  technicalDescription: string;
  suggestedAction: string;
}

/**
 * Mapping на error кодове към metadata
 */
const ERROR_METADATA: Record<ErrorCode, ErrorMetadata> = {
  // Core
  'QA-001': {
    category: ErrorCategory.CORE,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    humanReadable: 'Непозната грешка',
    technicalDescription: 'An unknown error occurred',
    suggestedAction: 'Check logs for details',
  },
  'QA-002': {
    category: ErrorCategory.CORE,
    severity: ErrorSeverity.CRITICAL,
    retryable: false,
    humanReadable: 'Невалидна конфигурация',
    technicalDescription: 'Configuration validation failed',
    suggestedAction: 'Review configuration file',
  },
  'QA-003': {
    category: ErrorCategory.CORE,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    humanReadable: 'Грешка при стартиране',
    technicalDescription: 'System initialization failed',
    suggestedAction: 'Check prerequisites and retry',
  },
  'QA-004': {
    category: ErrorCategory.CORE,
    severity: ErrorSeverity.WARNING,
    retryable: false,
    humanReadable: 'Грешка при спиране',
    technicalDescription: 'Graceful shutdown failed',
    suggestedAction: 'Force shutdown may be required',
  },
  'QA-005': {
    category: ErrorCategory.CORE,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    humanReadable: 'Ресурсите са изчерпани',
    technicalDescription: 'System resources exhausted',
    suggestedAction: 'Free up memory/CPU and retry',
  },
  'QA-006': {
    category: ErrorCategory.CORE,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Операцията отне твърде много време',
    technicalDescription: 'Operation timed out',
    suggestedAction: 'Increase timeout or optimize operation',
  },
  'QA-007': {
    category: ErrorCategory.CORE,
    severity: ErrorSeverity.WARNING,
    retryable: false,
    humanReadable: 'Невалидни данни',
    technicalDescription: 'Input validation failed',
    suggestedAction: 'Check input data format',
  },
  'QA-008': {
    category: ErrorCategory.CORE,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    humanReadable: 'Функцията не е имплементирана',
    technicalDescription: 'Feature not implemented',
    suggestedAction: 'Wait for future release',
  },
  'QA-009': {
    category: ErrorCategory.CORE,
    severity: ErrorSeverity.CRITICAL,
    retryable: false,
    humanReadable: 'Зависимост не е намерена',
    technicalDescription: 'Required dependency missing',
    suggestedAction: 'Install missing dependency',
  },
  'QA-010': {
    category: ErrorCategory.CORE,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    humanReadable: 'Циклична зависимост',
    technicalDescription: 'Circular dependency detected',
    suggestedAction: 'Refactor module imports',
  },

  // Network
  'QA-101': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Мрежова грешка',
    technicalDescription: 'Network request failed',
    suggestedAction: 'Check network connectivity',
  },
  'QA-102': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Сървърът не отговаря',
    technicalDescription: 'Network request timed out',
    suggestedAction: 'Increase timeout or check server',
  },
  'QA-103': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'DNS грешка',
    technicalDescription: 'DNS resolution failed',
    suggestedAction: 'Check DNS settings',
  },
  'QA-104': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.WARNING,
    retryable: false,
    humanReadable: 'SSL сертификат е невалиден',
    technicalDescription: 'SSL/TLS certificate error',
    suggestedAction: 'Verify certificate or bypass for testing',
  },
  'QA-105': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Прокси грешка',
    technicalDescription: 'Proxy connection failed',
    suggestedAction: 'Check proxy settings',
  },
  'QA-106': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Връзката е отказана',
    technicalDescription: 'Connection refused by server',
    suggestedAction: 'Check if server is running',
  },
  'QA-107': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Твърде много заявки',
    technicalDescription: 'Rate limit exceeded',
    suggestedAction: 'Wait and retry with backoff',
  },
  'QA-108': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    humanReadable: 'Мрежова изолация',
    technicalDescription: 'Network partition detected',
    suggestedAction: 'Wait for network recovery',
  },
  'QA-109': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.WARNING,
    retryable: false,
    humanReadable: 'Bandwidth лимит',
    technicalDescription: 'Bandwidth quota exceeded',
    suggestedAction: 'Upgrade plan or wait for reset',
  },
  'QA-110': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'WebSocket грешка',
    technicalDescription: 'WebSocket connection error',
    suggestedAction: 'Reconnect WebSocket',
  },

  // Auth
  'QA-201': {
    category: ErrorCategory.AUTH,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    humanReadable: 'Грешни данни за вход',
    technicalDescription: 'Authentication failed',
    suggestedAction: 'Check credentials',
  },
  'QA-202': {
    category: ErrorCategory.AUTH,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Сесията изтече',
    technicalDescription: 'Token expired',
    suggestedAction: 'Refresh token or re-login',
  },
  'QA-203': {
    category: ErrorCategory.AUTH,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    humanReadable: 'Невалиден токен',
    technicalDescription: 'Token validation failed',
    suggestedAction: 'Re-authenticate',
  },
  'QA-204': {
    category: ErrorCategory.AUTH,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    humanReadable: 'Нямате права',
    technicalDescription: 'Insufficient permissions',
    suggestedAction: 'Request elevated permissions',
  },
  'QA-205': {
    category: ErrorCategory.AUTH,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Сесията изтече',
    technicalDescription: 'Session expired',
    suggestedAction: 'Re-login',
  },
  'QA-206': {
    category: ErrorCategory.AUTH,
    severity: ErrorSeverity.INFO,
    retryable: false,
    humanReadable: 'Изисква се 2FA',
    technicalDescription: 'Multi-factor authentication required',
    suggestedAction: 'Complete MFA',
  },
  'QA-207': {
    category: ErrorCategory.AUTH,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    humanReadable: 'Акаунтът е заключен',
    technicalDescription: 'Account locked',
    suggestedAction: 'Contact support',
  },
  'QA-208': {
    category: ErrorCategory.AUTH,
    severity: ErrorSeverity.WARNING,
    retryable: false,
    humanReadable: 'Изисква се CAPTCHA',
    technicalDescription: 'CAPTCHA verification required',
    suggestedAction: 'Complete CAPTCHA',
  },
  'QA-209': {
    category: ErrorCategory.AUTH,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Твърде много опити',
    technicalDescription: 'Login rate limited',
    suggestedAction: 'Wait before retrying',
  },
  'QA-210': {
    category: ErrorCategory.AUTH,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'OAuth грешка',
    technicalDescription: 'OAuth flow error',
    suggestedAction: 'Retry OAuth flow',
  },

  // Browser/Ghost
  'QA-301': {
    category: ErrorCategory.BROWSER,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    humanReadable: 'Браузърът не може да стартира',
    technicalDescription: 'Browser launch failed',
    suggestedAction: 'Check browser installation',
  },
  'QA-302': {
    category: ErrorCategory.BROWSER,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    humanReadable: 'Браузърът се срина',
    technicalDescription: 'Browser process crashed',
    suggestedAction: 'Restart browser',
  },
  'QA-303': {
    category: ErrorCategory.BROWSER,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Страницата не се зареди',
    technicalDescription: 'Page load timeout',
    suggestedAction: 'Increase timeout or check URL',
  },
  'QA-304': {
    category: ErrorCategory.BROWSER,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Грешка при навигация',
    technicalDescription: 'Navigation error',
    suggestedAction: 'Check URL validity',
  },
  'QA-305': {
    category: ErrorCategory.BROWSER,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Елементът не е намерен',
    technicalDescription: 'Element not found in DOM',
    suggestedAction: 'Wait for element or check selector',
  },
  'QA-306': {
    category: ErrorCategory.BROWSER,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Елементът не е видим',
    technicalDescription: 'Element not visible',
    suggestedAction: 'Scroll to element',
  },
  'QA-307': {
    category: ErrorCategory.BROWSER,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Не може да се кликне',
    technicalDescription: 'Element not interactable',
    suggestedAction: 'Wait for element to be clickable',
  },
  'QA-308': {
    category: ErrorCategory.BROWSER,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'iFrame грешка',
    technicalDescription: 'iFrame access error',
    suggestedAction: 'Check iFrame permissions',
  },
  'QA-309': {
    category: ErrorCategory.BROWSER,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Screenshot неуспешен',
    technicalDescription: 'Screenshot capture failed',
    suggestedAction: 'Check disk space',
  },
  'QA-310': {
    category: ErrorCategory.BROWSER,
    severity: ErrorSeverity.CRITICAL,
    retryable: false,
    humanReadable: 'Автоматизацията е засечена',
    technicalDescription: 'Bot detection triggered',
    suggestedAction: 'Enhance ghost protocol',
  },
  'QA-311': {
    category: ErrorCategory.BROWSER,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Fingerprint блокиран',
    technicalDescription: 'Browser fingerprint blocked',
    suggestedAction: 'Rotate fingerprint',
  },
  'QA-312': {
    category: ErrorCategory.BROWSER,
    severity: ErrorSeverity.WARNING,
    retryable: false,
    humanReadable: 'CAPTCHA засечена',
    technicalDescription: 'CAPTCHA challenge detected',
    suggestedAction: 'Solve CAPTCHA manually or use service',
  },
  'QA-313': {
    category: ErrorCategory.BROWSER,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Bot защита активирана',
    technicalDescription: 'Anti-bot protection triggered',
    suggestedAction: 'Wait and retry with different profile',
  },
  'QA-314': {
    category: ErrorCategory.BROWSER,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Headless режим засечен',
    technicalDescription: 'Headless browser detected',
    suggestedAction: 'Use headed mode or better evasion',
  },
  'QA-315': {
    category: ErrorCategory.BROWSER,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Browser context грешка',
    technicalDescription: 'Browser context error',
    suggestedAction: 'Create new context',
  },

  // Oracle/AI
  'QA-401': {
    category: ErrorCategory.ORACLE,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'AI модулът е офлайн',
    technicalDescription: 'Oracle service unavailable',
    suggestedAction: 'Wait for service recovery',
  },
  'QA-402': {
    category: ErrorCategory.ORACLE,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Предсказването се провали',
    technicalDescription: 'Prediction failed',
    suggestedAction: 'Retry or use fallback',
  },
  'QA-403': {
    category: ErrorCategory.ORACLE,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    humanReadable: 'Моделът не може да се зареди',
    technicalDescription: 'Model loading error',
    suggestedAction: 'Check model file integrity',
  },
  'QA-404': {
    category: ErrorCategory.ORACLE,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'AI обработката отне твърде дълго',
    technicalDescription: 'Inference timeout',
    suggestedAction: 'Reduce input size or increase timeout',
  },
  'QA-405': {
    category: ErrorCategory.ORACLE,
    severity: ErrorSeverity.INFO,
    retryable: false,
    humanReadable: 'Ниска увереност на AI',
    technicalDescription: 'Low confidence prediction',
    suggestedAction: 'Request human review',
  },
  'QA-406': {
    category: ErrorCategory.ORACLE,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Грешка при обучение',
    technicalDescription: 'Model training error',
    suggestedAction: 'Check training data',
  },
  'QA-407': {
    category: ErrorCategory.ORACLE,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Feature extraction се провали',
    technicalDescription: 'Feature extraction failed',
    suggestedAction: 'Check input format',
  },
  'QA-408': {
    category: ErrorCategory.ORACLE,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    humanReadable: 'Chronos парадокс',
    technicalDescription: 'Temporal prediction paradox',
    suggestedAction: 'Reset timeline state',
  },
  'QA-409': {
    category: ErrorCategory.ORACLE,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    humanReadable: 'AI паметта е пълна',
    technicalDescription: 'Model memory overflow',
    suggestedAction: 'Clear memory or restart',
  },
  'QA-410': {
    category: ErrorCategory.ORACLE,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    humanReadable: 'GPU грешка',
    technicalDescription: 'GPU computation error',
    suggestedAction: 'Check GPU drivers',
  },
  'QA-411': {
    category: ErrorCategory.ORACLE,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Квантова декохеренция',
    technicalDescription: 'Quantum state decoherence',
    suggestedAction: 'Reinitialize quantum state',
  },

  // Swarm
  'QA-501': {
    category: ErrorCategory.SWARM,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    humanReadable: 'Swarm не може да стартира',
    technicalDescription: 'Swarm initialization failed',
    suggestedAction: 'Check worker configuration',
  },
  'QA-502': {
    category: ErrorCategory.SWARM,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Worker не може да стартира',
    technicalDescription: 'Worker spawn failed',
    suggestedAction: 'Check resources',
  },
  'QA-503': {
    category: ErrorCategory.SWARM,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Worker се срина',
    technicalDescription: 'Worker process crashed',
    suggestedAction: 'Auto-respawn enabled',
  },
  'QA-504': {
    category: ErrorCategory.SWARM,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Опашката е пълна',
    technicalDescription: 'Task queue full',
    suggestedAction: 'Wait for tasks to complete',
  },
  'QA-505': {
    category: ErrorCategory.SWARM,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Задачата отне твърде дълго',
    technicalDescription: 'Task execution timeout',
    suggestedAction: 'Increase timeout',
  },
  'QA-506': {
    category: ErrorCategory.SWARM,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Worker комуникация се провали',
    technicalDescription: 'Worker IPC error',
    suggestedAction: 'Restart worker',
  },
  'QA-507': {
    category: ErrorCategory.SWARM,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Load balancing грешка',
    technicalDescription: 'Load balancing error',
    suggestedAction: 'Redistribute tasks',
  },
  'QA-508': {
    category: ErrorCategory.SWARM,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    humanReadable: 'Failover се провали',
    technicalDescription: 'Failover mechanism failed',
    suggestedAction: 'Manual intervention required',
  },
  'QA-509': {
    category: ErrorCategory.SWARM,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Worker ползва твърде много памет',
    technicalDescription: 'Worker memory exceeded',
    suggestedAction: 'Worker will be restarted',
  },
  'QA-510': {
    category: ErrorCategory.SWARM,
    severity: ErrorSeverity.WARNING,
    retryable: false,
    humanReadable: 'Swarm не се спря навреме',
    technicalDescription: 'Swarm shutdown timeout',
    suggestedAction: 'Force shutdown',
  },
  'QA-511': {
    category: ErrorCategory.SWARM,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Координационна грешка',
    technicalDescription: 'Swarm coordination error',
    suggestedAction: 'Restart coordinator',
  },

  // Licensing
  'QA-601': {
    category: ErrorCategory.LICENSING,
    severity: ErrorSeverity.FATAL,
    retryable: false,
    humanReadable: 'Невалиден лиценз',
    technicalDescription: 'License validation failed',
    suggestedAction: 'Contact sales',
  },
  'QA-602': {
    category: ErrorCategory.LICENSING,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    humanReadable: 'Лицензът изтече',
    technicalDescription: 'License expired',
    suggestedAction: 'Renew license',
  },
  'QA-603': {
    category: ErrorCategory.LICENSING,
    severity: ErrorSeverity.FATAL,
    retryable: false,
    humanReadable: 'Лицензът е модифициран',
    technicalDescription: 'License tampering detected',
    suggestedAction: 'Contact support',
  },
  'QA-604': {
    category: ErrorCategory.LICENSING,
    severity: ErrorSeverity.FATAL,
    retryable: false,
    humanReadable: 'Хардуерът не съвпада',
    technicalDescription: 'Hardware fingerprint mismatch',
    suggestedAction: 'Re-activate on this machine',
  },
  'QA-605': {
    category: ErrorCategory.LICENSING,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Активацията се провали',
    technicalDescription: 'License activation failed',
    suggestedAction: 'Check internet and retry',
  },
  'QA-606': {
    category: ErrorCategory.LICENSING,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Деактивацията се провали',
    technicalDescription: 'License deactivation failed',
    suggestedAction: 'Contact support',
  },
  'QA-607': {
    category: ErrorCategory.LICENSING,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Лицензният сървър е недостъпен',
    technicalDescription: 'License server unreachable',
    suggestedAction: 'Check internet',
  },
  'QA-608': {
    category: ErrorCategory.LICENSING,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    humanReadable: 'Пробният период изтече',
    technicalDescription: 'Trial period expired',
    suggestedAction: 'Purchase license',
  },
  'QA-609': {
    category: ErrorCategory.LICENSING,
    severity: ErrorSeverity.WARNING,
    retryable: false,
    humanReadable: 'Тази функция не е в плана ви',
    technicalDescription: 'Feature not in current plan',
    suggestedAction: 'Upgrade plan',
  },
  'QA-610': {
    category: ErrorCategory.LICENSING,
    severity: ErrorSeverity.FATAL,
    retryable: false,
    humanReadable: 'Лицензът е отнет',
    technicalDescription: 'License has been revoked',
    suggestedAction: 'Contact support',
  },

  // Security
  'QA-701': {
    category: ErrorCategory.SECURITY,
    severity: ErrorSeverity.CRITICAL,
    retryable: false,
    humanReadable: 'Сигурностно нарушение',
    technicalDescription: 'Security policy violation',
    suggestedAction: 'Review security logs',
  },
  'QA-702': {
    category: ErrorCategory.SECURITY,
    severity: ErrorSeverity.FATAL,
    retryable: false,
    humanReadable: 'Засечена е атака',
    technicalDescription: 'Intrusion detected',
    suggestedAction: 'Activate Fatality Protocol',
  },
  'QA-703': {
    category: ErrorCategory.SECURITY,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Криптирането се провали',
    technicalDescription: 'Encryption error',
    suggestedAction: 'Check encryption key',
  },
  'QA-704': {
    category: ErrorCategory.SECURITY,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    humanReadable: 'Декриптирането се провали',
    technicalDescription: 'Decryption error',
    suggestedAction: 'Check decryption key',
  },
  'QA-705': {
    category: ErrorCategory.SECURITY,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    humanReadable: 'Невалиден подпис',
    technicalDescription: 'Signature verification failed',
    suggestedAction: 'Data may be tampered',
  },
  'QA-706': {
    category: ErrorCategory.SECURITY,
    severity: ErrorSeverity.FATAL,
    retryable: false,
    humanReadable: 'Засечена е манипулация',
    technicalDescription: 'Tamper detection triggered',
    suggestedAction: 'System lockdown',
  },
  'QA-707': {
    category: ErrorCategory.SECURITY,
    severity: ErrorSeverity.INFO,
    retryable: false,
    humanReadable: 'HoneyPot активиран',
    technicalDescription: 'Honeypot trap triggered',
    suggestedAction: 'Attacker is being profiled',
  },
  'QA-708': {
    category: ErrorCategory.SECURITY,
    severity: ErrorSeverity.FATAL,
    retryable: false,
    humanReadable: 'Fatality Protocol е активен',
    technicalDescription: 'Fatality protocol engaged',
    suggestedAction: 'System in lockdown',
  },
  'QA-709': {
    category: ErrorCategory.SECURITY,
    severity: ErrorSeverity.WARNING,
    retryable: false,
    humanReadable: 'Vault е заключен',
    technicalDescription: 'Secure vault is locked',
    suggestedAction: 'Authenticate to unlock',
  },
  'QA-710': {
    category: ErrorCategory.SECURITY,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    humanReadable: 'Ключът не може да се генерира',
    technicalDescription: 'Key derivation failed',
    suggestedAction: 'Check master password',
  },

  // Billing
  'QA-801': {
    category: ErrorCategory.BILLING,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Плащането се провали',
    technicalDescription: 'Payment processing failed',
    suggestedAction: 'Try different payment method',
  },
  'QA-802': {
    category: ErrorCategory.BILLING,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Картата е отказана',
    technicalDescription: 'Card declined',
    suggestedAction: 'Contact bank or use different card',
  },
  'QA-803': {
    category: ErrorCategory.BILLING,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    humanReadable: 'Недостатъчен баланс',
    technicalDescription: 'Insufficient funds',
    suggestedAction: 'Add funds to account',
  },
  'QA-804': {
    category: ErrorCategory.BILLING,
    severity: ErrorSeverity.WARNING,
    retryable: false,
    humanReadable: 'Абонаментът е отменен',
    technicalDescription: 'Subscription cancelled',
    suggestedAction: 'Resubscribe',
  },
  'QA-805': {
    category: ErrorCategory.BILLING,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Грешка във фактурата',
    technicalDescription: 'Invoice generation error',
    suggestedAction: 'Contact support',
  },
  'QA-806': {
    category: ErrorCategory.BILLING,
    severity: ErrorSeverity.WARNING,
    retryable: false,
    humanReadable: 'Невалиден адрес',
    technicalDescription: 'Invalid billing address',
    suggestedAction: 'Update billing address',
  },
  'QA-807': {
    category: ErrorCategory.BILLING,
    severity: ErrorSeverity.WARNING,
    retryable: false,
    humanReadable: 'Методът на плащане изтече',
    technicalDescription: 'Payment method expired',
    suggestedAction: 'Update payment method',
  },
  'QA-808': {
    category: ErrorCategory.BILLING,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Възстановяването се провали',
    technicalDescription: 'Refund processing error',
    suggestedAction: 'Contact support',
  },
  'QA-809': {
    category: ErrorCategory.BILLING,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Stripe webhook грешка',
    technicalDescription: 'Stripe webhook processing error',
    suggestedAction: 'Check webhook logs',
  },
  'QA-810': {
    category: ErrorCategory.BILLING,
    severity: ErrorSeverity.WARNING,
    retryable: false,
    humanReadable: 'Лимитът е достигнат',
    technicalDescription: 'Usage limit exceeded',
    suggestedAction: 'Upgrade plan',
  },

  // Database
  'QA-901': {
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    humanReadable: 'Базата данни е недостъпна',
    technicalDescription: 'Database connection failed',
    suggestedAction: 'Check database server',
  },
  'QA-902': {
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    humanReadable: 'Заявката отне твърде дълго',
    technicalDescription: 'Query timeout',
    suggestedAction: 'Optimize query',
  },
  'QA-903': {
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Deadlock засечен',
    technicalDescription: 'Database deadlock detected',
    suggestedAction: 'Transaction will be retried',
  },
  'QA-904': {
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
    retryable: false,
    humanReadable: 'Нарушение на constraint',
    technicalDescription: 'Database constraint violation',
    suggestedAction: 'Check data validity',
  },
  'QA-905': {
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.FATAL,
    retryable: false,
    humanReadable: 'Данните са повредени',
    technicalDescription: 'Data corruption detected',
    suggestedAction: 'Restore from backup',
  },
  'QA-906': {
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    humanReadable: 'Миграцията се провали',
    technicalDescription: 'Database migration failed',
    suggestedAction: 'Rollback migration',
  },
  'QA-907': {
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    humanReadable: 'Backup се провали',
    technicalDescription: 'Backup operation failed',
    suggestedAction: 'Check storage space',
  },
  'QA-908': {
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    humanReadable: 'Restore се провали',
    technicalDescription: 'Restore operation failed',
    suggestedAction: 'Verify backup integrity',
  },
  'QA-909': {
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.WARNING,
    retryable: false,
    humanReadable: 'Репликацията е забавена',
    technicalDescription: 'Replication lag detected',
    suggestedAction: 'Check replica health',
  },
  'QA-910': {
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.CRITICAL,
    retryable: false,
    humanReadable: 'Дисковото пространство свърши',
    technicalDescription: 'Storage capacity full',
    suggestedAction: 'Free up space',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// QANTUM ERROR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @class QAntumError
 * @description Централизирана грешка за цялата QAntum система
 * 
 * @example
 * ```typescript
 * throw new QAntumError(ErrorCodes.NETWORK_TIMEOUT, {
 *   url: 'https://example.com',
 *   timeout: 5000
 * });
 * ```
 */
export class QAntumError extends Error {
  /** Уникален код на грешката */
  public readonly code: ErrorCode;
  
  /** Категория на грешката */
  public readonly category: ErrorCategory;
  
  /** Критичност */
  public readonly severity: ErrorSeverity;
  
  /** Може ли да се опита отново */
  public readonly retryable: boolean;
  
  /** Контекст данни */
  public readonly context: Record<string, unknown>;
  
  /** Време на възникване */
  public readonly timestamp: Date;
  
  /** Човешко съобщение (BG) */
  public readonly humanReadable: string;
  
  /** Предложено действие */
  public readonly suggestedAction: string;
  
  /** Стек от предишни грешки */
  public readonly causeChain: Error[];

  constructor(
    code: ErrorCode,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    const metadata = ERROR_METADATA[code];
    
    super(`[${code}] ${metadata.technicalDescription}`);
    
    this.name = 'QAntumError';
    this.code = code;
    this.category = metadata.category;
    this.severity = metadata.severity;
    this.retryable = metadata.retryable;
    this.humanReadable = metadata.humanReadable;
    this.suggestedAction = metadata.suggestedAction;
    this.context = context || {};
    this.timestamp = new Date();
    this.causeChain = [];

    // Build cause chain
    if (cause) {
      this.causeChain.push(cause);
      if (cause instanceof QAntumError) {
        this.causeChain.push(...cause.causeChain);
      }
    }

    // Capture stack trace
    Error.captureStackTrace?.(this, QAntumError);
  }

  /**
   * Получава пълно съобщение за потребителя
   */
  toUserMessage(): string {
    return `${this.humanReadable}. ${this.suggestedAction}.`;
  }

  /**
   * Получава пълно съобщение за лог
   */
  toLogMessage(): string {
    const parts = [
      `[${this.code}]`,
      `[${this.category}]`,
      `[${ErrorSeverity[this.severity]}]`,
      this.message,
    ];

    if (Object.keys(this.context).length > 0) {
      parts.push(`Context: ${JSON.stringify(this.context)}`);
    }

    return parts.join(' ');
  }

  /**
   * Сериализира грешката за изпращане
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      severity: ErrorSeverity[this.severity],
      retryable: this.retryable,
      humanReadable: this.humanReadable,
      suggestedAction: this.suggestedAction,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      causeChain: this.causeChain.map(e => ({
        name: e.name,
        message: e.message,
        stack: e.stack,
      })),
    };
  }

  /**
   * Проверява дали грешката е от определена категория
   */
  isCategory(category: ErrorCategory): boolean {
    return this.category === category;
  }

  /**
   * Проверява дали грешката е над определена критичност
   */
  isSevereEnough(minSeverity: ErrorSeverity): boolean {
    return this.severity >= minSeverity;
  }

  /**
   * Създава нова грешка с допълнителен контекст
   */
  withContext(additionalContext: Record<string, unknown>): QAntumError {
    return new QAntumError(
      this.code,
      { ...this.context, ...additionalContext },
      this.causeChain[0]
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR FACTORY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Бързо създаване на мрежова грешка
 */
export function networkError(
  url: string,
  originalError?: Error
): QAntumError {
  return new QAntumError(
    ErrorCodes.NETWORK_ERROR,
    { url },
    originalError
  );
}

/**
 * Бързо създаване на timeout грешка
 */
export function timeoutError(
  operation: string,
  timeoutMs: number,
  originalError?: Error
): QAntumError {
  return new QAntumError(
    ErrorCodes.TIMEOUT,
    { operation, timeoutMs },
    originalError
  );
}

/**
 * Бързо създаване на auth грешка
 */
export function authError(
  reason: string,
  originalError?: Error
): QAntumError {
  return new QAntumError(
    ErrorCodes.AUTH_FAILED,
    { reason },
    originalError
  );
}

/**
 * Бързо създаване на browser грешка
 */
export function browserError(
  code: ErrorCode,
  selector?: string,
  originalError?: Error
): QAntumError {
  return new QAntumError(
    code,
    { selector },
    originalError
  );
}

/**
 * Wrap функция с error handling
 */
export function wrapWithErrorHandling<T extends (...args: unknown[]) => unknown>(
  fn: T,
  defaultErrorCode: ErrorCode = ErrorCodes.UNKNOWN
): T {
  return ((...args: unknown[]) => {
    try {
      const result = fn(...args);
      
      if (result instanceof Promise) {
        return result.catch(error => {
          if (error instanceof QAntumError) {
            throw error;
          }
          throw new QAntumError(defaultErrorCode, { args }, error as Error);
        });
      }
      
      return result;
    } catch (error) {
      if (error instanceof QAntumError) {
        throw error;
      }
      throw new QAntumError(defaultErrorCode, { args }, error as Error);
    }
  }) as T;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR AGGREGATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @class ErrorAggregator
 * @description Събира множество грешки и ги обобщава
 */
export class ErrorAggregator {
  private errors: QAntumError[] = [];

  add(error: QAntumError): void {
    this.errors.push(error);
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): QAntumError[] {
    return [...this.errors];
  }

  getByCategory(category: ErrorCategory): QAntumError[] {
    return this.errors.filter(e => e.category === category);
  }

  getBySeverity(minSeverity: ErrorSeverity): QAntumError[] {
    return this.errors.filter(e => e.severity >= minSeverity);
  }

  getMostSevere(): QAntumError | undefined {
    return this.errors.reduce((max, current) =>
      (current.severity > (max?.severity ?? -1)) ? current : max,
      undefined as QAntumError | undefined
    );
  }

  throwIfErrors(): void {
    if (this.hasErrors()) {
      const most = this.getMostSevere()!;
      throw most.withContext({
        totalErrors: this.errors.length,
        otherCodes: this.errors.map(e => e.code),
      });
    }
  }

  toSummary(): string {
    if (!this.hasErrors()) return 'No errors';
    
    const byCategory = new Map<ErrorCategory, number>();
    for (const error of this.errors) {
      byCategory.set(error.category, (byCategory.get(error.category) || 0) + 1);
    }

    return Array.from(byCategory.entries())
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(', ');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  ERROR_METADATA,
  ErrorMetadata,
};
