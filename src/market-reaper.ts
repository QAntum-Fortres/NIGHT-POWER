/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  QAntum-Market-Reaper v28.0 - Module Exports                              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Core Components
export { MarketWatcher, marketWatcher } from './reality/economy/MarketWatcher';
export { ArbitrageOrchestrator, arbitrageOrchestrator } from './reality/economy/ArbitrageOrchestrator';
export { ArbitrageLogic, arbitrageLogic } from './math/ArbitrageLogic';
export { PriceOracle, priceOracle } from './chronos/PriceOracle';
export { AtomicTrader, atomicTrader } from './physics/AtomicTrader';
export { ReaperDashboard, reaperDashboard } from './dashboard/ReaperDashboard';

// Types
export type {
  MarketPrice,
  MarketConfig,
  PriceSpread,
  StealthProfile,
} from './reality/economy/MarketWatcher';

export type {
  ExchangeFees,
  SlippageModel,
  NetworkCosts,
  ArbitrageOpportunity,
  ArbitrageConfig,
} from './math/ArbitrageLogic';

export type {
  PricePrediction,
  MarketSimulation,
  PriceTrajectory,
  ChronosConfig,
} from './chronos/PriceOracle';

export type {
  TradeOrder,
  AtomicSwap,
  SwarmWorker,
  AtomicTraderConfig,
} from './physics/AtomicTrader';

export type {
  ReaperMetrics,
  TradeLog,
  AlertConfig,
} from './dashboard/ReaperDashboard';

export type {
  OrchestratorConfig,
  DailyStats,
  ReaperStatus,
} from './reality/economy/ArbitrageOrchestrator';
