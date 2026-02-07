/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🧬 KERNEL MODULE - Autonomous Systems Export
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * @author Dimitar Prodromov
 * @version 17.0.0
 */

export { AutonomousFeedbackLoop } from './AutonomousFeedbackLoop';

// Re-export types
export type {
  AutoScanConfig,
  DependencyAuditConfig,
  VulnerabilityReport,
  BreachAttempt,
  ThreatLevel,
} from '../../../types/security.types';
