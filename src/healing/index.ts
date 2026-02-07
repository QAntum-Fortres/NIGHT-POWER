/**
 * 🏥 HEALING MODULE - Self-Repair Systems
 * Consolidated healing and health monitoring
 * 
 * @module healing
 * @version 35.0.0
 */

export * from './SelfHealing';
export * from './HealthMonitor';

// Re-export types
export interface HealingConfig {
  autoHeal: boolean;
  maxRetries: number;
  healingStrategies: HealingStrategy[];
  reportErrors: boolean;
}

export type HealingStrategy = 
  | 'fallback-selector'
  | 'semantic-match'
  | 'visual-match'
  | 'neighboring-elements'
  | 'structure-analysis'
  | 'ml-prediction';

export interface HealthReport {
  status: 'healthy' | 'degraded' | 'critical';
  score: number;
  issues: string[];
  lastCheck: Date;
}
