/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    QANTUM ECOSYSTEM - SHARED TYPES                            ║
 * ║                                                                               ║
 * ║   Common types used across all three repositories:                            ║
 * ║   • MisteMind (Core) - Business logic & AI                                    ║
 * ║   • MrMindQATool (Shield) - QA & Testing                                      ║
 * ║   • MisterMindPage (Voice) - Public interface                                 ║
 * ║                                                                               ║
 * ║   Generated: 2026-01-02T01:37:28.448Z                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CORE BUSINESS TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface QAntumConfig {
  version: string;
  environment: 'development' | 'production' | 'test';
  features: FeatureFlags;
  licensing: LicenseConfig;
}

export interface FeatureFlags {
  enableAI: boolean;
  enableSwarm: boolean;
  enableThermalManagement: boolean;
  enableBulgarianTTS: boolean;
  enableDashboard: boolean;
}

export interface LicenseConfig {
  type: 'trial' | 'professional' | 'enterprise' | 'sovereign';
  validUntil: Date;
  features: string[];
  hardwareLocked: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST RESULT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration: number;
  error?: TestError;
  metadata?: Record<string, unknown>;
}

export interface TestError {
  message: string;
  stack?: string;
  type: string;
  screenshot?: string;
}

export interface TestSuite {
  id: string;
  name: string;
  tests: TestResult[];
  startTime: Date;
  endTime?: Date;
  totalDuration: number;
  passRate: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SecurityScanResult {
  target: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  vulnerabilities: Vulnerability[];
  scanDate: Date;
  recommendations: string[];
}

export interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  cwe?: string;
  remediation: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ECOSYSTEM SYNC TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface EcosystemHealth {
  status: 'PERFECT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  score: number;
  lastChecked: Date;
  projects: {
    name: string;
    role: 'core' | 'shield' | 'voice';
    healthy: boolean;
    version: string;
  }[];
}

export interface SyncEvent {
  type: 'change' | 'sync' | 'conflict';
  sourceProject: string;
  targetProjects: string[];
  timestamp: Date;
  details: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERSION CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const QANTUM_VERSION = '34.0.0';
export const PRIME_VERSION = '28.4.0';
export const ECOSYSTEM_VERSION = '1.0.0';
export const CODENAME = 'ABSOLUTE_SOVEREIGNTY';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE GUARDS
// ═══════════════════════════════════════════════════════════════════════════════

export function isTestPassed(result: TestResult): boolean {
  return result.status === 'passed';
}

export function isVulnerabilityCritical(vuln: Vulnerability): boolean {
  return vuln.severity === 'critical' || vuln.severity === 'high';
}

export function isEcosystemHealthy(health: EcosystemHealth): boolean {
  return health.status === 'PERFECT' || health.status === 'GOOD';
}
