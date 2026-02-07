/**
 * 🛡️ GUARDIANS MODULE - Central Protection Hub
 * All guards consolidated in one place
 * 
 * @module guardians
 * @version 35.0.0
 */

export * from './StrictCollar';
export * from './AuthGuard';
export * from './CognitiveCircularGuard';

// Re-export types
export type GuardianType = 'strict' | 'auth' | 'cognitive' | 'memory' | 'usage';

export interface GuardConfig {
  enabled: boolean;
  strictMode: boolean;
  logViolations: boolean;
  autoHeal: boolean;
}
