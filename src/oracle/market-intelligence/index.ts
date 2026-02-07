/**
 * Oracle's Market Intelligence - Unified Export
 * 
 * QAntum Framework v1.6.0 - "The Oracle's Market Intelligence"
 * 
 * TOTAL v1.6.0 MARKET VALUE: +$650,000
 * 
 * Components:
 * - EnterpriseDiscovery: +$220,000 (Auto Deep Crawl with Ghost Protocol v2)
 * - MarketBlueprint: +$185,000 (Site logic → Purchasable packages)
 * - PredictiveScaler: +$150,000 (Chronos-Paradox resource prediction)
 * - SelfHealingSales: +$95,000 (Issue → Sales opportunity conversion)
 * 
 * @module oracle/market-intelligence
 * @version 1.6.0
 * @enterprise true
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENTERPRISE DISCOVERY - Auto Deep Crawl
// ═══════════════════════════════════════════════════════════════════════════

export {
  EnterpriseDiscovery,
  createEnterpriseDiscovery,
  type EnterpriseDiscoveryConfig,
  type CrawlJob,
  type CrawlResults,
  type MarketablePackage as DiscoveryPackage,
  type ResourcePrediction as DiscoveryResourcePrediction,
  type IssueReport as DiscoveryIssueReport,
  type DiscoveredIssue,
  type StealthLevel
} from '../oracle/EnterpriseDiscovery';

// ═══════════════════════════════════════════════════════════════════════════
// MARKET BLUEPRINT - Purchasable Test Packages
// ═══════════════════════════════════════════════════════════════════════════

export {
  MarketBlueprint,
  createMarketBlueprint,
  type MarketBlueprintConfig,
  type MarketablePackage,
  type PackageBundle,
  type PurchaseOrder,
  type BlueprintGenerationResult,
  type BlueprintSource,
  type TestCaseBlueprint,
  type PackageCategory,
  type ComplexityTier,
  type CrawlDataInput
} from '../biology/evolution/MarketBlueprint';

// ═══════════════════════════════════════════════════════════════════════════
// PREDICTIVE SCALER - Chronos-Paradox Integration
// ═══════════════════════════════════════════════════════════════════════════

export {
  PredictiveScaler,
  createPredictiveScaler,
  type PredictiveScalerConfig,
  type ResourcePrediction,
  type ResourceAllocation,
  type ScalingEvent,
  type HistoricalExecution,
  type ScalerAnalytics,
  type TemporalCoordinate,
  type ButterflyEffect,
  type CostEstimate,
  type TimeWindow
} from '../chronos/PredictiveScaler';

// ═══════════════════════════════════════════════════════════════════════════
// SELF-HEALING SALES - Issue → Opportunity Conversion
// ═══════════════════════════════════════════════════════════════════════════

export {
  SelfHealingSales,
  createSelfHealingSales,
  type SelfHealingSalesConfig,
  type IssueReport,
  type SalesOffer,
  type ValueProposition,
  type ConversionEvent,
  type SalesAnalytics,
  type IssueSeverity,
  type IssueCategory,
  type OfferStatus,
  type CrawlResults as SalesCrawlResults
} from '../sales/SelfHealingSales';

// ═══════════════════════════════════════════════════════════════════════════
// ORCHESTRATED PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

import { EnterpriseDiscovery, createEnterpriseDiscovery } from '../oracle/EnterpriseDiscovery';
import { MarketBlueprint, createMarketBlueprint } from '../biology/evolution/MarketBlueprint';
import { PredictiveScaler, createPredictiveScaler } from '../chronos/PredictiveScaler';
import { SelfHealingSales, createSelfHealingSales } from '../sales/SelfHealingSales';

/**
 * Oracle's Market Intelligence Pipeline
 * 
 * Orchestrates all v1.6.0 components into a unified workflow:
 * 1. Discovery → 2. Blueprint → 3. Prediction → 4. Sales
 */
export interface MarketIntelligencePipeline {
  discovery: EnterpriseDiscovery;
  blueprint: MarketBlueprint;
  scaler: PredictiveScaler;
  sales: SelfHealingSales;
}

/**
 * Create a complete Market Intelligence pipeline
 */
export function createMarketIntelligencePipeline(config?: {
  discovery?: Partial<import('../oracle/EnterpriseDiscovery').EnterpriseDiscoveryConfig>;
  blueprint?: Partial<import('../biology/evolution/MarketBlueprint').MarketBlueprintConfig>;
  scaler?: Partial<import('../chronos/PredictiveScaler').PredictiveScalerConfig>;
  sales?: Partial<import('../sales/SelfHealingSales').SelfHealingSalesConfig>;
}): MarketIntelligencePipeline {
  return {
    discovery: createEnterpriseDiscovery(config?.discovery),
    blueprint: createMarketBlueprint(config?.blueprint),
    scaler: createPredictiveScaler(config?.scaler),
    sales: createSelfHealingSales(config?.sales)
  };
}

/**
 * Version information
 */
export const VERSION = '1.6.0';
export const CODENAME = "The Oracle's Market Intelligence";
export const MARKET_VALUE = {
  enterpriseDiscovery: 220000,
  marketBlueprint: 185000,
  predictiveScaler: 150000,
  selfHealingSales: 95000,
  total: 650000
};

/**
 * v1.6.0 Feature Summary
 */
export const FEATURES = {
  enterpriseDiscovery: [
    'Auto Deep Crawl when client adds URL',
    'Ghost Protocol v2 stealth integration',
    'ClientOrchestrator authentication',
    'Multi-level stealth (standard/enhanced/ghost/phantom)'
  ],
  marketBlueprint: [
    'Convert site logic to purchasable packages',
    'Dynamic pricing with complexity tiers',
    'Package bundles with volume discounts',
    'White-label support for resellers'
  ],
  predictiveScaler: [
    'Chronos-Paradox temporal analysis',
    'Predict resources BEFORE Run button',
    'Butterfly effect risk assessment',
    'Cost-optimized resource allocation'
  ],
  selfHealingSales: [
    'Auto-detect bugs during crawling',
    'Generate professional issue reports',
    'Create targeted sales offers',
    'Track conversion metrics'
  ]
};

export default {
  createMarketIntelligencePipeline,
  VERSION,
  CODENAME,
  MARKET_VALUE,
  FEATURES
};
