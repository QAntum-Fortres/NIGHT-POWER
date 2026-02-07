/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * STRATEGY EXPORTS - BARREL FILE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export * from './network.strategy';
export * from './resource.strategy';
export * from './application.strategy';
export * from './infrastructure.strategy';

// Re-export strategy collections
import { NetworkStrategies } from './network.strategy';
import { ResourceStrategies } from './resource.strategy';
import { ApplicationStrategies } from './application.strategy';
import { InfrastructureStrategies } from './infrastructure.strategy';

export const AllStrategies = {
  network: NetworkStrategies,
  resource: ResourceStrategies,
  application: ApplicationStrategies,
  infrastructure: InfrastructureStrategies,
};
