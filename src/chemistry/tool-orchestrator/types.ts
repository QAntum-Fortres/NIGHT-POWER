/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   ████████╗ ██████╗  ██████╗ ██╗         ████████╗██╗   ██╗██████╗ ███████╗   ║
 * ║   ╚══██╔══╝██╔═══██╗██╔═══██╗██║         ╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝   ║
 * ║      ██║   ██║   ██║██║   ██║██║            ██║    ╚████╔╝ ██████╔╝█████╗     ║
 * ║      ██║   ██║   ██║██║   ██║██║            ██║     ╚██╔╝  ██╔═══╝ ██╔══╝     ║
 * ║      ██║   ╚██████╔╝╚██████╔╝███████╗       ██║      ██║   ██║     ███████╗   ║
 * ║      ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝       ╚═╝      ╚═╝   ╚═╝     ╚══════╝   ║
 * ║                                                                               ║
 * ║   QAntum v29.0 "THE OMNIPOTENT NEXUS" - Tool Orchestrator Types               ║
 * ║   Adaptive Tooling Layer - Universal MCP Integration                          ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                      ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// MCP TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MCP Tool Categories - The 8 Domains of External Power
 */
export type MCPToolCategory =
  | 'browser-automation'      // Chrome, Kapture, Windows-MCP
  | 'os-desktop'              // Desktop Commander, PDF, Excel, Word
  | 'data-scraping'           // Apify, Explorium, Tomba
  | 'cloud-infrastructure'    // AWS, Kubernetes, Cloudinary
  | 'financial-markets'       // Polygon, Trading APIs
  | 'saas-analytics'          // Clarity, Metabase, GrowthBook
  | 'communication'           // Mailtrap, iMessages
  | 'scientific-ai';          // Enrichr, 10x Genomics, PopHIVE

/**
 * Tool Status
 */
export type ToolStatus =
  | 'available'
  | 'unavailable'
  | 'rate-limited'
  | 'error'
  | 'initializing';

/**
 * Tool Authentication Type
 */
export type AuthType =
  | 'api-key'
  | 'oauth2'
  | 'basic'
  | 'bearer'
  | 'custom'
  | 'none';

/**
 * MCP Tool Definition
 */
export interface MCPTool {
  id: string;
  name: string;
  category: MCPToolCategory;
  version: string;

  // Description for semantic search
  description: string;
  capabilities: string[];
  keywords: string[];

  // Connection
  endpoint: string;
  authType: AuthType;
  envKeyName?: string;  // Key name in .env.fortress

  // Metadata
  documentation?: string;
  openApiSpec?: string;

  // Operations
  operations: MCPOperation[];

  // Status
  status: ToolStatus;
  lastHealthCheck?: Date;

  // Performance
  avgLatencyMs?: number;
  successRate?: number;
  usageCount?: number;

  // Ghost Protocol
  requiresGhostProtocol: boolean;

  // Indexing
  pineconeVectorId?: string;
  embeddingVector?: number[];
}

/**
 * MCP Operation (Function/Method)
 */
export interface MCPOperation {
  id: string;
  name: string;
  description: string;

  // Parameters
  parameters: OperationParameter[];
  requiredParams: string[];

  // Response
  responseSchema?: Record<string, unknown>;

  // Execution
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;

  // Rate limits
  rateLimit?: {
    requests: number;
    windowMs: number;
  };

  // Performance
  avgExecutionMs?: number;
  successRate?: number;
}

/**
 * Operation Parameter
 */
export interface OperationParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL SELECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tool Selection Query
 */
export interface ToolSelectionQuery {
  task: string;
  context?: Record<string, unknown>;
  requiredCapabilities?: string[];
  preferredCategory?: MCPToolCategory;
  excludeTools?: string[];
  maxResults?: number;
}

/**
 * Tool Selection Result
 */
export interface ToolSelectionResult {
  tool: MCPTool;
  operation: MCPOperation;
  confidence: number;
  reasoning: string;
  alternativeTools?: Array<{
    tool: MCPTool;
    operation: MCPOperation;
    confidence: number;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tool Execution Request
 */
export interface ToolExecutionRequest {
  toolId: string;
  operationId: string;
  parameters: Record<string, unknown>;

  // Options
  timeout?: number;
  retries?: number;
  useGhostProtocol?: boolean;

  // Context
  requestId?: string;
  correlationId?: string;
}

/**
 * Tool Execution Result
 */
export interface ToolExecutionResult {
  success: boolean;
  toolId: string;
  operationId: string;

  // Response
  data?: unknown;
  error?: ToolExecutionError;

  // Performance
  executionMs: number;
  retryCount: number;

  // Metadata
  requestId: string;
  timestamp: Date;

  // Learning
  lessonLearned?: LessonLearned;
}

/**
 * Tool Execution Error
 */
export interface ToolExecutionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  isRetryable: boolean;
  suggestedAction?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARNING & FEEDBACK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Lesson Learned from Tool Execution
 */
export interface LessonLearned {
  id: string;
  toolId: string;
  operationId: string;

  // Context
  taskDescription: string;
  inputParameters: Record<string, unknown>;

  // Outcome
  success: boolean;
  outcome: string;

  // Metrics
  executionMs: number;

  // Learnings
  whatWorked?: string[];
  whatFailed?: string[];
  improvements?: string[];

  // Timestamp
  timestamp: Date;
}

/**
 * Tool Performance Metrics
 */
export interface ToolPerformanceMetrics {
  toolId: string;

  // Usage
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;

  // Performance
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;

  // Success Rate
  successRate: number;

  // Time-based
  lastUsed: Date;
  firstUsed: Date;

  // Learning
  lessonsLearned: number;
  improvementsSuggested: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tool Registry Configuration
 */
export interface ToolRegistryConfig {
  // Pinecone
  pineconeApiKey?: string;
  pineconeEnvironment?: string;
  pineconeIndex?: string;

  // Embedding
  embeddingProvider: 'openai' | 'groq' | 'local';
  embeddingModel?: string;

  // Health Check
  healthCheckIntervalMs: number;
  healthCheckTimeoutMs: number;

  // Caching
  cacheToolsInMemory: boolean;
  cacheTTLMs: number;

  // Security
  fortressEnvPath?: string;
}

/**
 * Tool Selector Configuration
 */
export interface ToolSelectorConfig {
  // Search
  semanticSearchTopK: number;
  minConfidenceThreshold: number;

  // Ranking
  considerSuccessRate: boolean;
  considerLatency: boolean;
  considerCost: boolean;

  // Fallback
  enableFallbackTools: boolean;
  maxFallbackAttempts: number;
}

/**
 * Tool Executor Configuration
 */
export interface ToolExecutorConfig {
  // Timeouts
  defaultTimeoutMs: number;
  maxTimeoutMs: number;

  // Retries
  defaultRetries: number;
  maxRetries: number;
  retryDelayMs: number;
  exponentialBackoff: boolean;

  // Ghost Protocol
  enableGhostProtocol: boolean;
  ghostProtocolConfig?: GhostProtocolConfig;

  // Fatality Engine
  enableFatalityMonitoring: boolean;
  fatalityThreshold: number;  // Max failures before circuit break

  // Rate Limiting
  enableRateLimiting: boolean;
  globalRateLimit?: {
    requests: number;
    windowMs: number;
  };
}

/**
 * Ghost Protocol Configuration
 */
export interface GhostProtocolConfig {
  // TLS/JA3 Fingerprinting
  enableTLSPhantom: boolean;
  ja3Fingerprint?: string;

  // WebGL Spoofing
  enableWebGLSpoofing: boolean;
  gpuVendor?: string;
  gpuRenderer?: string;

  // Biometric
  enableBiometricInjection: boolean;

  // Headers
  rotateUserAgent: boolean;
  customHeaders?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS - THE 25+ MCP TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Pre-defined MCP Tool IDs
 */
export const MCP_TOOL_IDS = {
  // Browser Automation
  CONTROL_CHROME: 'mcp-control-chrome',
  KAPTURE: 'mcp-kapture',
  WINDOWS_MCP: 'mcp-windows',

  // OS/Desktop
  DESKTOP_COMMANDER: 'mcp-desktop-commander',
  PDF_TOOLS: 'mcp-pdf-tools',
  EXCEL: 'mcp-excel',
  WORD: 'mcp-word',
  POWERPOINT: 'mcp-powerpoint',
  MAC_CONTROL: 'mcp-mac-control',

  // Data Scraping
  APIFY: 'mcp-apify',
  EXPLORIUM: 'mcp-explorium',
  TOMBA: 'mcp-tomba',

  // Cloud Infrastructure
  AWS_API: 'mcp-aws',
  KUBERNETES: 'mcp-kubernetes',
  CLOUDINARY: 'mcp-cloudinary',

  // Financial Markets
  POLYGON: 'mcp-polygon',

  // SaaS Analytics
  CLARITY: 'mcp-clarity',
  METABASE: 'mcp-metabase',
  GROWTHBOOK: 'mcp-growthbook',
  BRAZE: 'mcp-braze',
  VENDR: 'mcp-vendr',
  COUPLER: 'mcp-coupler',

  // Communication
  MAILTRAP: 'mcp-mailtrap',
  IMESSAGES: 'mcp-imessages',

  // Scientific AI
  ENRICHR: 'mcp-enrichr',
  GENOMICS_10X: 'mcp-10x-genomics',
  POPHIVE: 'mcp-pophive',
} as const;

export type MCPToolId = typeof MCP_TOOL_IDS[keyof typeof MCP_TOOL_IDS];

// ═══════════════════════════════════════════════════════════════════════════════
// LEARNING & OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════════════════



/**
 * Fatality Engine State
 * Tracks circuit breaker status for each tool
 */
export interface FatalityEngineState {
  /** Tool ID */
  toolId: string;

  /** Circuit breaker state */
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';

  /** Number of consecutive failures */
  failureCount: number;

  /** When the circuit was opened */
  openedAt?: Date;

  /** When to attempt reset */
  resetAt?: Date;

  /** Last failure reason */
  lastError?: string;
}

/**
 * Tool Suggestion from semantic search
 */
export interface ToolSuggestion {
  /** The suggested tool */
  tool: MCPTool;

  /** Recommended operation */
  operation?: MCPOperation;

  /** Confidence score (0-100) */
  score: number;

  /** Reasons for suggestion */
  reasons: string[];
}

/**
 * Tool Selection Criteria
 */
export interface ToolSelectionCriteria {
  /** Task description */
  task: string;

  /** Preferred categories */
  preferredCategories?: MCPToolCategory[];

  /** Required capabilities */
  requiredCapabilities?: string[];

  /** Maximum acceptable latency */
  maxLatencyMs?: number;

  /** Minimum success rate required */
  minSuccessRate?: number;

  /** Whether Ghost Protocol is required */
  requiresGhostProtocol?: boolean;
}

