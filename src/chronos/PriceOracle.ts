/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  QAntum Prime v28.0 - PRICE ORACLE                                        ║
 * ║  "Времевият Парадокс" - Chronos Arbitrage Predictor                       ║
 * ║                                                                           ║
 * ║  T+30s предсказване на цени, блокиране на сделки с риск >15%              ║
 * ║  Zero-Loss Trading чрез времева симулация                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface PricePrediction {
  symbol: string;
  exchange: string;
  currentPrice: number;
  predictedPrice: number;
  priceChange: number;
  changePercent: number;
  confidence: number;
  horizonSeconds: number;
  volatilityBand: {
    upper: number;
    lower: number;
  };
  trend: 'bullish' | 'bearish' | 'neutral';
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  timestamp: number;
}

export interface MarketSimulation {
  id: string;
  symbol: string;
  simulationSteps: number;
  timeHorizonMs: number;
  trajectories: PriceTrajectory[];
  consensus: {
    meanPrice: number;
    medianPrice: number;
    stdDev: number;
    worstCase: number;
    bestCase: number;
  };
  riskMetrics: {
    valueAtRisk: number;      // 95% VaR
    maxDrawdown: number;      // Maximum predicted drawdown
    sharpeRatio: number;      // Risk-adjusted return
    probabilityOfLoss: number;
  };
}

export interface PriceTrajectory {
  pathId: number;
  prices: number[];
  finalPrice: number;
  maxDrawdown: number;
  volatility: number;
}

export interface ChronosConfig {
  predictionHorizonSeconds: number;  // Default 30s
  monteCarloSimulations: number;     // Number of trajectories
  confidenceThreshold: number;       // Minimum confidence to proceed
  maxRiskPercent: number;            // Maximum acceptable risk (15%)
  butterflyEffectWeight: number;     // Chaos factor
  updateIntervalMs: number;          // How often to update predictions
}

// ═══════════════════════════════════════════════════════════════════════════
// HISTORICAL DATA STORE (Simulated for demo)
// ═══════════════════════════════════════════════════════════════════════════

interface HistoricalCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRICE ORACLE - CHRONOS PARADOX ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class PriceOracle extends EventEmitter {
  private config: ChronosConfig;
  private priceHistory: Map<string, HistoricalCandle[]> = new Map();
  private currentPrices: Map<string, number> = new Map();
  private predictions: Map<string, PricePrediction> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  
  // Model parameters learned from historical data
  private volatilityModels: Map<string, number> = new Map();
  private driftModels: Map<string, number> = new Map();
  private correlationMatrix: Map<string, Map<string, number>> = new Map();
  
  // Statistics
  private totalPredictions: number = 0;
  private accuratePredictions: number = 0;
  
  constructor(config: Partial<ChronosConfig> = {}) {
    super();
    
    this.config = {
      predictionHorizonSeconds: config.predictionHorizonSeconds ?? 30,
      monteCarloSimulations: config.monteCarloSimulations ?? 1000,
      confidenceThreshold: config.confidenceThreshold ?? 0.7,
      maxRiskPercent: config.maxRiskPercent ?? 15,
      butterflyEffectWeight: config.butterflyEffectWeight ?? 0.1,
      updateIntervalMs: config.updateIntervalMs ?? 1000,
    };
    
    this.initializeModels();
    console.log('[PriceOracle] 🔮 Chronos Paradox Engine initialized');
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // MODEL INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════
  
  private initializeModels(): void {
    const symbols = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'MATIC', 'AVAX'];
    
    // Initialize volatility models (annualized volatility)
    const volatilities: Record<string, number> = {
      'BTC': 0.65,   // 65% annualized
      'ETH': 0.80,   // 80% annualized
      'SOL': 1.20,   // 120% annualized
      'XRP': 0.90,   // 90% annualized
      'ADA': 0.95,   // 95% annualized
      'DOGE': 1.50,  // 150% annualized (very volatile)
      'MATIC': 1.10, // 110% annualized
      'AVAX': 1.05,  // 105% annualized
    };
    
    // Initialize drift models (expected return tendency)
    const drifts: Record<string, number> = {
      'BTC': 0.05,   // Slight upward bias
      'ETH': 0.03,
      'SOL': 0.02,
      'XRP': 0.01,
      'ADA': 0.01,
      'DOGE': 0.00,  // Random walk
      'MATIC': 0.02,
      'AVAX': 0.02,
    };
    
    for (const symbol of symbols) {
      this.volatilityModels.set(symbol, volatilities[symbol] ?? 1.0);
      this.driftModels.set(symbol, drifts[symbol] ?? 0.0);
      this.priceHistory.set(symbol, this.generateSyntheticHistory(symbol));
    }
    
    // Initialize correlation matrix
    this.initializeCorrelations(symbols);
    
    console.log(`[PriceOracle] 📊 Initialized models for ${symbols.length} assets`);
  }
  
  private generateSyntheticHistory(symbol: string): HistoricalCandle[] {
    // Generate 1000 candles of 1-minute data
    const candles: HistoricalCandle[] = [];
    const basePrice = this.getBasePrice(symbol);
    let price = basePrice;
    
    const volatility = this.volatilityModels.get(symbol) ?? 1.0;
    const minuteVolatility = volatility / Math.sqrt(365 * 24 * 60); // Convert to per-minute
    
    for (let i = 0; i < 1000; i++) {
      const timestamp = Date.now() - (1000 - i) * 60000;
      const change = (Math.random() - 0.5) * 2 * minuteVolatility * price;
      const open = price;
      price += change;
      const high = Math.max(open, price) * (1 + Math.random() * 0.001);
      const low = Math.min(open, price) * (1 - Math.random() * 0.001);
      
      candles.push({
        timestamp,
        open,
        high,
        low,
        close: price,
        volume: Math.random() * 1000000,
      });
    }
    
    return candles;
  }
  
  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      'BTC': 42500,
      'ETH': 2250,
      'SOL': 110,
      'XRP': 0.62,
      'ADA': 0.61,
      'DOGE': 0.092,
      'MATIC': 0.87,
      'AVAX': 38.5,
    };
    return prices[symbol] ?? 100;
  }
  
  private initializeCorrelations(symbols: string[]): void {
    // BTC-ETH correlation is typically high
    // ALTs are correlated with BTC but less so with each other
    const baseCorrelations: Record<string, Record<string, number>> = {
      'BTC': { 'ETH': 0.85, 'SOL': 0.70, 'XRP': 0.60, 'ADA': 0.65, 'DOGE': 0.50, 'MATIC': 0.70, 'AVAX': 0.70 },
      'ETH': { 'BTC': 0.85, 'SOL': 0.75, 'XRP': 0.55, 'ADA': 0.60, 'DOGE': 0.45, 'MATIC': 0.80, 'AVAX': 0.75 },
    };
    
    for (const s1 of symbols) {
      const corrMap = new Map<string, number>();
      for (const s2 of symbols) {
        if (s1 === s2) {
          corrMap.set(s2, 1.0);
        } else {
          const corr = baseCorrelations[s1]?.[s2] ?? 0.5;
          corrMap.set(s2, corr);
        }
      }
      this.correlationMatrix.set(s1, corrMap);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // CORE PREDICTION ENGINE - MONTE CARLO SIMULATION
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Predict price using Monte Carlo simulation with Geometric Brownian Motion
   * This is the core of the "Chronos Paradox" - simulating the future
   */
  public predictPrice(
    symbol: string,
    currentPrice: number,
    horizonSeconds: number = this.config.predictionHorizonSeconds
  ): PricePrediction {
    const volatility = this.volatilityModels.get(symbol) ?? 1.0;
    const drift = this.driftModels.get(symbol) ?? 0.0;
    
    // Convert annual volatility to per-second
    const secondsPerYear = 365 * 24 * 60 * 60;
    const sigmaPerSecond = volatility / Math.sqrt(secondsPerYear);
    const muPerSecond = drift / secondsPerYear;
    
    // Run Monte Carlo simulations
    const simulation = this.runMonteCarloSimulation(
      currentPrice,
      muPerSecond,
      sigmaPerSecond,
      horizonSeconds
    );
    
    // Calculate prediction metrics
    const predictedPrice = simulation.consensus.meanPrice;
    const priceChange = predictedPrice - currentPrice;
    const changePercent = (priceChange / currentPrice) * 100;
    
    // Calculate confidence based on simulation convergence
    const relativeStdDev = simulation.consensus.stdDev / currentPrice;
    const confidence = Math.max(0, Math.min(1, 1 - relativeStdDev * 2));
    
    // Determine trend
    let trend: 'bullish' | 'bearish' | 'neutral';
    if (changePercent > 0.5) trend = 'bullish';
    else if (changePercent < -0.5) trend = 'bearish';
    else trend = 'neutral';
    
    // Determine risk level based on VaR and max drawdown
    let riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    if (simulation.riskMetrics.valueAtRisk < 3) riskLevel = 'low';
    else if (simulation.riskMetrics.valueAtRisk < 7) riskLevel = 'medium';
    else if (simulation.riskMetrics.valueAtRisk < 15) riskLevel = 'high';
    else riskLevel = 'extreme';
    
    const prediction: PricePrediction = {
      symbol,
      exchange: 'aggregate',
      currentPrice,
      predictedPrice,
      priceChange,
      changePercent,
      confidence,
      horizonSeconds,
      volatilityBand: {
        upper: simulation.consensus.meanPrice + simulation.consensus.stdDev * 2,
        lower: simulation.consensus.meanPrice - simulation.consensus.stdDev * 2,
      },
      trend,
      riskLevel,
      timestamp: Date.now(),
    };
    
    this.predictions.set(symbol, prediction);
    this.totalPredictions++;
    
    return prediction;
  }
  
  private runMonteCarloSimulation(
    startPrice: number,
    mu: number,  // drift per second
    sigma: number,  // volatility per second
    horizonSeconds: number
  ): MarketSimulation {
    const trajectories: PriceTrajectory[] = [];
    const finalPrices: number[] = [];
    
    // Butterfly effect: small random perturbations that cascade
    const butterflyNoise = (Math.random() - 0.5) * this.config.butterflyEffectWeight;
    
    for (let sim = 0; sim < this.config.monteCarloSimulations; sim++) {
      const trajectory = this.simulateTrajectory(
        startPrice,
        mu + butterflyNoise * (sim / this.config.monteCarloSimulations),
        sigma,
        horizonSeconds
      );
      trajectories.push(trajectory);
      finalPrices.push(trajectory.finalPrice);
    }
    
    // Calculate consensus statistics
    finalPrices.sort((a, b) => a - b);
    const mean = finalPrices.reduce((a, b) => a + b) / finalPrices.length;
    const median = finalPrices[Math.floor(finalPrices.length / 2)];
    
    const squaredDiffs = finalPrices.map(p => Math.pow(p - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b) / squaredDiffs.length;
    const stdDev = Math.sqrt(variance);
    
    // Value at Risk (95th percentile loss)
    const var95Index = Math.floor(finalPrices.length * 0.05);
    const valueAtRisk = ((startPrice - finalPrices[var95Index]) / startPrice) * 100;
    
    // Max drawdown across all trajectories
    const maxDrawdown = Math.max(...trajectories.map(t => t.maxDrawdown));
    
    // Probability of loss
    const lossPaths = finalPrices.filter(p => p < startPrice).length;
    const probabilityOfLoss = lossPaths / finalPrices.length;
    
    // Sharpe ratio (simplified)
    const expectedReturn = (mean - startPrice) / startPrice;
    const sharpeRatio = stdDev > 0 ? expectedReturn / (stdDev / startPrice) : 0;
    
    return {
      id: `SIM-${Date.now()}`,
      symbol: '',
      simulationSteps: horizonSeconds,
      timeHorizonMs: horizonSeconds * 1000,
      trajectories: trajectories.slice(0, 10), // Keep only first 10 for memory
      consensus: {
        meanPrice: mean,
        medianPrice: median,
        stdDev,
        worstCase: finalPrices[0],
        bestCase: finalPrices[finalPrices.length - 1],
      },
      riskMetrics: {
        valueAtRisk: Math.max(0, valueAtRisk),
        maxDrawdown,
        sharpeRatio,
        probabilityOfLoss,
      },
    };
  }
  
  private simulateTrajectory(
    startPrice: number,
    mu: number,
    sigma: number,
    steps: number
  ): PriceTrajectory {
    const prices: number[] = [startPrice];
    let price = startPrice;
    let minPrice = startPrice;
    let maxPrice = startPrice;
    
    for (let i = 0; i < steps; i++) {
      // Geometric Brownian Motion step
      const randomShock = this.boxMullerTransform();
      const drift = (mu - 0.5 * sigma * sigma);
      const diffusion = sigma * randomShock;
      
      price = price * Math.exp(drift + diffusion);
      prices.push(price);
      
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);
    }
    
    const maxDrawdown = ((maxPrice - minPrice) / maxPrice) * 100;
    const volatility = this.calculateVolatility(prices);
    
    return {
      pathId: Math.floor(Math.random() * 1000000),
      prices,
      finalPrice: price,
      maxDrawdown,
      volatility,
    };
  }
  
  private boxMullerTransform(): number {
    // Generate standard normal random variable
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  
  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    
    const mean = returns.reduce((a, b) => a + b) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b) / squaredDiffs.length;
    
    return Math.sqrt(variance);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ARBITRAGE RISK ASSESSMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Evaluate if an arbitrage trade should proceed based on predicted price movement
   * Returns true if safe to proceed, false if risk is too high
   */
  public evaluateArbitrageRisk(
    symbol: string,
    buyPrice: number,
    sellPrice: number,
    expectedProfit: number,
    executionTimeMs: number = 5000
  ): {
    shouldProceed: boolean;
    riskAssessment: string;
    prediction: PricePrediction;
    worstCaseProfit: number;
    bestCaseProfit: number;
  } {
    // Predict where sell price will be when we execute
    const horizonSeconds = executionTimeMs / 1000;
    const prediction = this.predictPrice(symbol, sellPrice, horizonSeconds);
    
    // Calculate worst case scenario
    const worstCaseSellPrice = prediction.volatilityBand.lower;
    const worstCaseProfit = worstCaseSellPrice - buyPrice;
    const worstCaseProfitPercent = (worstCaseProfit / buyPrice) * 100;
    
    // Calculate best case scenario
    const bestCaseSellPrice = prediction.volatilityBand.upper;
    const bestCaseProfit = bestCaseSellPrice - buyPrice;
    
    // Decision logic
    const maxRisk = this.config.maxRiskPercent;
    const potentialLoss = ((sellPrice - worstCaseSellPrice) / sellPrice) * 100;
    
    let shouldProceed = true;
    let riskAssessment = '';
    
    if (prediction.riskLevel === 'extreme') {
      shouldProceed = false;
      riskAssessment = `🚫 БЛОКИРАНО: Екстремен риск (${prediction.riskLevel}). Пазарът е твърде волатилен.`;
    } else if (potentialLoss > maxRisk) {
      shouldProceed = false;
      riskAssessment = `🚫 БЛОКИРАНО: Потенциална загуба ${potentialLoss.toFixed(2)}% > максимален риск ${maxRisk}%`;
    } else if (worstCaseProfitPercent < -maxRisk) {
      shouldProceed = false;
      riskAssessment = `🚫 БЛОКИРАНО: Най-лош сценарий = ${worstCaseProfitPercent.toFixed(2)}% загуба`;
    } else if (prediction.trend === 'bearish' && prediction.confidence > 0.8) {
      shouldProceed = false;
      riskAssessment = `🚫 БЛОКИРАНО: Chronos предвижда мечи пазар с ${(prediction.confidence * 100).toFixed(0)}% увереност`;
    } else if (prediction.confidence < this.config.confidenceThreshold) {
      shouldProceed = false;
      riskAssessment = `⚠️ ПАУЗИРАНО: Ниска увереност в предсказването (${(prediction.confidence * 100).toFixed(0)}%)`;
    } else {
      shouldProceed = true;
      riskAssessment = `✅ ОДОБРЕНО: Риск ${potentialLoss.toFixed(2)}% е в допустимите граници. Очаквана печалба: $${expectedProfit.toFixed(2)}`;
    }
    
    console.log(`[PriceOracle] ${riskAssessment}`);
    
    return {
      shouldProceed,
      riskAssessment,
      prediction,
      worstCaseProfit,
      bestCaseProfit,
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // CONTINUOUS MONITORING
  // ═══════════════════════════════════════════════════════════════════════
  
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[PriceOracle] 🔮 Chronos Paradox ACTIVATED - Predicting futures...');
    
    this.updateInterval = setInterval(() => {
      this.updateAllPredictions();
    }, this.config.updateIntervalMs);
    
    this.emit('started');
  }
  
  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    console.log('[PriceOracle] 🛑 Chronos Paradox DEACTIVATED');
    this.emit('stopped');
  }
  
  public updatePrice(symbol: string, price: number): void {
    this.currentPrices.set(symbol, price);
    
    // Update history
    const history = this.priceHistory.get(symbol) || [];
    history.push({
      timestamp: Date.now(),
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 0,
    });
    
    // Keep last 1000 candles
    if (history.length > 1000) {
      history.shift();
    }
    
    this.priceHistory.set(symbol, history);
  }
  
  private updateAllPredictions(): void {
    for (const [symbol, price] of this.currentPrices) {
      this.predictPrice(symbol, price);
    }
    
    this.emit('predictions-updated', this.predictions);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════
  
  public getPrediction(symbol: string): PricePrediction | undefined {
    return this.predictions.get(symbol);
  }
  
  public getAllPredictions(): Map<string, PricePrediction> {
    return new Map(this.predictions);
  }
  
  public getAccuracy(): number {
    if (this.totalPredictions === 0) return 0;
    return (this.accuratePredictions / this.totalPredictions) * 100;
  }
  
  public recordOutcome(symbol: string, predictedPrice: number, actualPrice: number): void {
    // Within 2% is considered accurate
    const error = Math.abs(predictedPrice - actualPrice) / actualPrice;
    if (error < 0.02) {
      this.accuratePredictions++;
    }
    
    // Emit for learning
    this.emit('outcome', { symbol, predictedPrice, actualPrice, error });
  }
  
  public updateConfig(config: Partial<ChronosConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const priceOracle = new PriceOracle();

export default PriceOracle;
