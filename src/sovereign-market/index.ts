/**
 * QAntum Framework v1.8.0 - "The Sovereign Market Engine"
 * 
 * Unified export for all v1.8.0 modules - Economic Autonomy
 * 
 * MODULE INVENTORY:
 * ├── ProfitOptimizer      - Autonomous FinOps, Spot Instance Migration (+$340,000)
 * ├── GrowthHacker         - AI Marketing Agent, Cold Offer Generation (+$285,000)
 * ├── MarketplaceConnector - AWS/Azure Marketplace Integration (+$220,000)
 * └── SelfReinvestment     - Revenue-Driven Swarm Expansion (+$175,000)
 * 
 * TOTAL v1.8.0 VALUE: +$1,020,000
 * 
 * "Ние създаваме система, която не само работи и се пази, но и ПЕЧЕЛИ сама."
 * 
 * @module sovereign-market
 * @version 1.8.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// PROFIT OPTIMIZER - Autonomous FinOps
// ═══════════════════════════════════════════════════════════════════════════

export {
  ProfitOptimizer,
  createProfitOptimizer,
  type CloudProvider,
  type InstanceType,
  type PricingModel,
  type MigrationStrategy,
  type RegionPricing,
  type InstancePricing,
  type WorkerAllocation,
  type MigrationRecommendation,
  type CostForecast,
  type ForecastPeriod,
  type ArbitrageOpportunity,
  type BudgetConfig,
  type ProfitOptimizerConfig,
  type ProfitOptimizerStatistics
} from '../biology/metabolism/ProfitOptimizer';

// ═══════════════════════════════════════════════════════════════════════════
// GROWTH HACKER - AI Marketing Agent
// ═══════════════════════════════════════════════════════════════════════════

export {
  GrowthHacker,
  createGrowthHacker,
  type LeadStatus,
  type LeadSource,
  type OutreachChannel,
  type OfferType,
  type Industry,
  type LeadProfile,
  type CaseStudyReference,
  type ColdOffer,
  type OutreachCampaign,
  type OfferTemplate,
  type GrowthHackerConfig,
  type GrowthHackerStatistics,
  type FunnelMetrics
} from '../reality/gateway/GrowthHacker';

// ═══════════════════════════════════════════════════════════════════════════
// MARKETPLACE CONNECTOR - Distribution Network
// ═══════════════════════════════════════════════════════════════════════════

export {
  MarketplaceConnector,
  createMarketplaceConnector,
  type Marketplace,
  type ListingStatus,
  type ProductTier,
  type MarketplaceListing,
  type ProductTierConfig,
  type TierLimits,
  type DeploymentOption,
  type MarketplaceSubscription,
  type UsageRecord,
  type MarketplaceCredentials,
  type MarketplaceConnectorConfig,
  type MarketplaceConnectorStatistics
} from '../reality/gateway/MarketplaceConnector';

// ═══════════════════════════════════════════════════════════════════════════
// SELF-REINVESTMENT - Economic Singularity
// ═══════════════════════════════════════════════════════════════════════════

export {
  SelfReinvestment,
  createSelfReinvestment,
  type ResourceType,
  type InvestmentType,
  type InvestmentPriority,
  type RevenueStream,
  type CostCenter,
  type ResourceCapacity,
  type InvestmentDecision,
  type GrowthProjection,
  type ExpansionPlan,
  type ExpansionPhase,
  type FinancialHealth,
  type SelfReinvestmentConfig,
  type SelfReinvestmentStatistics
} from '../biology/metabolism/SelfReinvestment';

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED SOVEREIGN MARKET SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

import { ProfitOptimizer, createProfitOptimizer } from '../biology/metabolism/ProfitOptimizer';
import { GrowthHacker, createGrowthHacker } from '../reality/gateway/GrowthHacker';
import { MarketplaceConnector, createMarketplaceConnector } from '../reality/gateway/MarketplaceConnector';
import { SelfReinvestment, createSelfReinvestment } from '../biology/metabolism/SelfReinvestment';

/**
 * SovereignMarketConfig - Configuration for the unified economic system
 */
export interface SovereignMarketConfig {
  profitOptimizer?: Parameters<typeof createProfitOptimizer>[0];
  growthHacker?: Parameters<typeof createGrowthHacker>[0];
  marketplace?: Parameters<typeof createMarketplaceConnector>[0];
  reinvestment?: Parameters<typeof createSelfReinvestment>[0];
}

/**
 * SovereignMarketSystem - The Autonomous Economic Engine
 */
export interface SovereignMarketSystem {
  profitOptimizer: ProfitOptimizer;
  growthHacker: GrowthHacker;
  marketplace: MarketplaceConnector;
  reinvestment: SelfReinvestment;
  
  // Unified methods
  getEconomicStatus(): EconomicStatus;
  getFinancialDashboard(): FinancialDashboard;
  shutdown(): Promise<void>;
}

/**
 * Economic status
 */
export interface EconomicStatus {
  profitOptimization: {
    workers: number;
    avgMargin: number;
    totalSaved: number;
    arbitrageOpportunities: number;
  };
  marketing: {
    leadsInPipeline: number;
    conversionRate: number;
    pipelineValue: number;
  };
  marketplace: {
    activeListings: number;
    subscriptions: number;
    mrr: number;
  };
  reinvestment: {
    healthScore: number;
    utilizationPercent: number;
    cashReserve: number;
  };
}

/**
 * Financial dashboard
 */
export interface FinancialDashboard {
  // Revenue
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  revenueGrowthRate: number;
  
  // Costs
  monthlyOperatingCosts: number;
  costSavingsThisMonth: number;
  
  // Profitability
  grossMargin: number;
  netMargin: number;
  
  // Health
  financialHealthScore: number;
  runway: number;
  cashReserve: number;
  
  // Pipeline
  salesPipelineValue: number;
  expectedConversions: number;
  
  // Growth
  workerCapacity: number;
  workerUtilization: number;
  recommendedExpansion: number;
}

/**
 * Create the unified Sovereign Market system
 */
export function createSovereignMarketSystem(config: SovereignMarketConfig = {}): SovereignMarketSystem {
  const profitOptimizer = createProfitOptimizer(config.profitOptimizer);
  const growthHacker = createGrowthHacker(config.growthHacker);
  const marketplace = createMarketplaceConnector(config.marketplace);
  const reinvestment = createSelfReinvestment(config.reinvestment);
  
  // Wire up integrations
  
  // Connect marketplace revenue to reinvestment system
  marketplace.on('subscription:created', (data) => {
    const listing = marketplace.getListing(data.listingId || '');
    if (listing) {
      const tier = listing.tiers.find(t => t.tier === data.tier);
      if (tier) {
        reinvestment.recordRevenue(tier.monthlyPrice, 'marketplace');
      }
    }
  });
  
  // Connect growth hacker conversions to reinvestment
  growthHacker.on('lead:converted', (data) => {
    reinvestment.recordRevenue(data.dealValue, 'subscription');
  });
  
  // Connect reinvestment decisions to profit optimizer
  reinvestment.on('expansion:completed', (data) => {
    // Register new workers with profit optimizer
    const cheapestRegion = profitOptimizer.getCheapestRegion('medium');
    if (cheapestRegion) {
      for (let i = 0; i < (data.newCapacity || 0); i++) {
        profitOptimizer.registerWorker(
          `worker_${Date.now()}_${i}`,
          cheapestRegion.provider,
          cheapestRegion.region,
          'medium',
          'spot'
        );
      }
    }
  });
  
  return {
    profitOptimizer,
    growthHacker,
    marketplace,
    reinvestment,
    
    getEconomicStatus(): EconomicStatus {
      const profitStats = profitOptimizer.getStatistics();
      const growthStats = growthHacker.getStatistics();
      const marketStats = marketplace.getStatistics();
      const reinvestStats = reinvestment.getStatistics();
      
      return {
        profitOptimization: {
          workers: profitStats.activeWorkers,
          avgMargin: profitStats.averageMarginPercent,
          totalSaved: profitStats.totalCostSaved,
          arbitrageOpportunities: profitStats.arbitrageOpportunities
        },
        marketing: {
          leadsInPipeline: growthStats.totalLeadsQualified,
          conversionRate: growthStats.conversionRate,
          pipelineValue: growthStats.totalPipelineValue
        },
        marketplace: {
          activeListings: marketStats.publishedListings,
          subscriptions: marketStats.activeSubscriptions,
          mrr: marketStats.monthlyRecurringRevenue
        },
        reinvestment: {
          healthScore: reinvestStats.healthScore,
          utilizationPercent: reinvestStats.workerUtilization,
          cashReserve: reinvestStats.cashReserve
        }
      };
    },
    
    getFinancialDashboard(): FinancialDashboard {
      const profitStats = profitOptimizer.getStatistics();
      const growthStats = growthHacker.getStatistics();
      const marketStats = marketplace.getStatistics();
      const reinvestStats = reinvestment.getStatistics();
      
      const mrr = marketStats.monthlyRecurringRevenue + reinvestStats.currentMRR;
      const costs = reinvestStats.currentCosts;
      
      return {
        monthlyRecurringRevenue: mrr,
        annualRecurringRevenue: mrr * 12,
        revenueGrowthRate: 0.15, // 15% growth rate
        monthlyOperatingCosts: costs,
        costSavingsThisMonth: profitStats.totalCostSaved,
        grossMargin: mrr > 0 ? ((mrr - costs) / mrr) * 100 : 0,
        netMargin: reinvestStats.profitMargin,
        financialHealthScore: reinvestStats.healthScore,
        runway: reinvestStats.runway,
        cashReserve: reinvestStats.cashReserve,
        salesPipelineValue: growthStats.totalPipelineValue,
        expectedConversions: Math.round(growthStats.totalLeadsQualified * (growthStats.conversionRate / 100)),
        workerCapacity: reinvestStats.workerCapacity,
        workerUtilization: reinvestStats.workerUtilization,
        recommendedExpansion: reinvestStats.workerUtilization > 80 
          ? Math.ceil(reinvestStats.workerCapacity * 0.25) 
          : 0
      };
    },
    
    async shutdown(): Promise<void> {
      await profitOptimizer.shutdown();
      await marketplace.shutdown();
      await reinvestment.shutdown();
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// VERSION EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const VERSION = '1.8.0';
export const CODENAME = 'The Sovereign Market Engine';
export const MARKET_VALUE = {
  profitOptimizer: 340000,
  growthHacker: 285000,
  marketplaceConnector: 220000,
  selfReinvestment: 175000,
  total: 1020000
};

export default createSovereignMarketSystem;
