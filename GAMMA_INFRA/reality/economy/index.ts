/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * ⚙️ ECONOMY MODULE - Runtime Protection Export
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * @author Dimitar Prodromov
 * @version 17.0.0
 */

export { EmergencyKillSwitch } from './EmergencyKillSwitch';
export { MarketWatcher } from './MarketWatcher';
export { SecureConfigLoader } from './SecureConfigLoader';

// Re-export types
export type {
  ThreatEvent,
  ThreatType,
  ThreatLevel,
  ShutdownConfig,
  MonitoringConfig,
  AnomalyEvent,
  SystemMetrics,
  SecureLoadConfig,
  ConfigValidationResult,
} from '../../../types/security.types';
