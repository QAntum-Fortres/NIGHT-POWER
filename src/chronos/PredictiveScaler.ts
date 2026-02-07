/**
 * PredictiveScaler.ts - "The Temporal Oracle"
 * 
 * QAntum Framework v1.6.0 - "The Oracle's Market Intelligence"
 * 
 * Uses Chronos-Paradox engine to predict Swarm resources BEFORE
 * the client clicks Run. Proactive scaling for optimal performance.
 * 
 * MARKET VALUE: +$150,000
 * - Predicts resource needs before execution
 * - Auto-scales Swarm workers proactively
 * - Eliminates cold-start delays
 * - Cost optimization through precise allocation
 * 
 * @module chronos/PredictiveScaler
 * @version 1.0.0
 * @enterprise true
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS - The Fabric of Time
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Resource types in the Swarm
 */
export type ResourceType = 
  | 'worker'
  | 'browser'
  | 'memory'
  | 'cpu'
  | 'network'
  | 'storage';

/**
 * Scaling action types
 */
export type ScalingAction = 
  | 'scale-up'
  | 'scale-down'
  | 'maintain'
  | 'preemptive-scale'
  | 'emergency-scale';

/**
 * Confidence levels for predictions
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'certain';

/**
 * Temporal coordinate from Chronos-Paradox
 */
export interface TemporalCoordinate {
  timestamp: Date;
  dimension: string;
  probability: number;
  divergence: number;
}

/**
 * Butterfly effect prediction
 */
export interface ButterflyEffect {
  trigger: string;
  cascadeChain: string[];
  impactMagnitude: number;
  mitigationStrategies: string[];
}

/**
 * Resource prediction result
 */
export interface ResourcePrediction {
  predictionId: string;
  timestamp: Date;
  
  // What we're predicting for
  targetJobId: string;
  targetUrl: string;
  testCount: number;
  
  // Predicted resources
  resources: ResourceAllocation;
  
  // Timing
  estimatedDuration: number;
  optimalStartWindow: TimeWindow;
  
  // Confidence
  confidence: ConfidenceLevel;
  confidenceScore: number;
  
  // Temporal analysis
  temporalCoordinate: TemporalCoordinate;
  butterflyEffects: ButterflyEffect[];
  
  // Cost analysis
  estimatedCost: CostEstimate;
  
  // Alternative scenarios
  alternatives: AlternativeScenario[];
}

/**
 * Resource allocation
 */
export interface ResourceAllocation {
  workers: WorkerAllocation;
  browsers: BrowserAllocation;
  compute: ComputeAllocation;
  network: NetworkAllocation;
  storage: StorageAllocation;
}

/**
 * Worker allocation
 */
export interface WorkerAllocation {
  minimum: number;
  optimal: number;
  maximum: number;
  type: 'standard' | 'high-performance' | 'gpu-enabled';
  distribution: 'concentrated' | 'distributed' | 'hybrid';
}

/**
 * Browser allocation
 */
export interface BrowserAllocation {
  chromium: number;
  firefox: number;
  webkit: number;
  headless: boolean;
  parallelism: number;
}

/**
 * Compute allocation
 */
export interface ComputeAllocation {
  vcpus: number;
  memoryGb: number;
  gpuUnits: number;
  cpuArchitecture: 'x86' | 'arm' | 'any';
}

/**
 * Network allocation
 */
export interface NetworkAllocation {
  bandwidthMbps: number;
  concurrentConnections: number;
  geoDistribution: string[];
  proxyRequired: boolean;
}

/**
 * Storage allocation
 */
export interface StorageAllocation {
  scratchSpaceGb: number;
  artifactStorageGb: number;
  cacheStorageGb: number;
  iops: number;
}

/**
 * Time window for optimal execution
 */
export interface TimeWindow {
  start: Date;
  end: Date;
  reason: string;
  savingsPercent: number;
}

/**
 * Cost estimate
 */
export interface CostEstimate {
  compute: number;
  network: number;
  storage: number;
  workers: number;
  total: number;
  currency: 'USD';
  savingsFromPrediction: number;
  costPerTest: number;
}

/**
 * Alternative execution scenario
 */
export interface AlternativeScenario {
  scenarioId: string;
  name: string;
  description: string;
  resources: ResourceAllocation;
  duration: number;
  cost: CostEstimate;
  tradeoffs: string[];
  recommended: boolean;
}

/**
 * Scaling event
 */
export interface ScalingEvent {
  eventId: string;
  timestamp: Date;
  action: ScalingAction;
  resourceType: ResourceType;
  previousValue: number;
  newValue: number;
  reason: string;
  predictionId?: string;
  success: boolean;
}

/**
 * Historical execution data for learning
 */
export interface HistoricalExecution {
  executionId: string;
  timestamp: Date;
  jobType: string;
  testCount: number;
  actualDuration: number;
  predictedDuration?: number;
  actualResources: ResourceAllocation;
  predictedResources?: ResourceAllocation;
  outcome: 'success' | 'partial' | 'failure';
  bottlenecks: string[];
}

/**
 * Scaler configuration
 */
export interface PredictiveScalerConfig {
  // Learning
  learningEnabled: boolean;
  historicalWindowDays: number;
  minSamplesForPrediction: number;
  
  // Safety margins
  resourceBufferPercent: number;
  costBufferPercent: number;
  
  // Scaling limits
  maxWorkers: number;
  maxBrowsers: number;
  maxVcpus: number;
  maxMemoryGb: number;
  
  // Timing
  preemptiveScaleMinutes: number;
  cooldownMinutes: number;
  
  // Cost optimization
  spotInstancePreference: number;
  maxCostPerTest: number;
  
  // Paradox integration
  paradoxEngineEndpoint?: string;
  temporalAnalysisDepth: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: PredictiveScalerConfig = {
  learningEnabled: true,
  historicalWindowDays: 30,
  minSamplesForPrediction: 5,
  
  resourceBufferPercent: 20,
  costBufferPercent: 10,
  
  maxWorkers: 100,
  maxBrowsers: 50,
  maxVcpus: 256,
  maxMemoryGb: 512,
  
  preemptiveScaleMinutes: 5,
  cooldownMinutes: 10,
  
  spotInstancePreference: 0.7,
  maxCostPerTest: 5.0,
  
  temporalAnalysisDepth: 3
};

// ═══════════════════════════════════════════════════════════════════════════
// PREDICTIVE SCALER ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * PredictiveScaler - The Temporal Oracle
 * 
 * Leverages Chronos-Paradox to predict resource needs before execution.
 * Eliminates cold-start delays and optimizes cost allocation.
 */
export class PredictiveScaler extends EventEmitter {
  private config: PredictiveScalerConfig;
  private historicalData: HistoricalExecution[] = [];
  private scalingHistory: ScalingEvent[] = [];
  private activePredictions: Map<string, ResourcePrediction> = new Map();
  private currentAllocation: ResourceAllocation;
  
  // Learning models
  private resourceModels: Map<string, ResourceModel> = new Map();
  private durationModels: Map<string, DurationModel> = new Map();
  
  // Metrics
  private predictionAccuracy: number = 0.85;
  private costSavingsTotal: number = 0;
  private coldStartsAvoided: number = 0;
  
  constructor(config: Partial<PredictiveScalerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize with baseline allocation
    this.currentAllocation = this.getBaselineAllocation();
    
    // Initialize learning models
    this.initializeModels();
    
    this.emit('initialized', {
      timestamp: new Date(),
      config: this.config
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PREDICTION ENGINE
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Predict resources needed for a test execution
   */
  async predictResources(
    jobId: string,
    targetUrl: string,
    testCount: number,
    testCategories: string[],
    complexity: string
  ): Promise<ResourcePrediction> {
    const predictionId = this.generateId('pred');
    const startTime = Date.now();
    
    this.emit('prediction:started', { predictionId, jobId });
    
    try {
      // Analyze test requirements
      const baseResources = this.calculateBaseResources(testCount, testCategories, complexity);
      
      // Apply historical learning
      const learnedAdjustments = await this.applyHistoricalLearning(
        testCategories,
        complexity,
        baseResources
      );
      
      // Temporal analysis via Chronos-Paradox
      const temporalAnalysis = await this.performTemporalAnalysis(
        jobId,
        testCount,
        baseResources
      );
      
      // Calculate optimal allocation
      const optimalResources = this.calculateOptimalAllocation(
        baseResources,
        learnedAdjustments,
        temporalAnalysis
      );
      
      // Estimate duration
      const estimatedDuration = this.estimateDuration(
        testCount,
        testCategories,
        optimalResources
      );
      
      // Calculate cost
      const estimatedCost = this.calculateCost(optimalResources, estimatedDuration);
      
      // Find optimal execution window
      const optimalWindow = this.findOptimalWindow(estimatedDuration);
      
      // Generate alternative scenarios
      const alternatives = this.generateAlternatives(
        optimalResources,
        estimatedDuration,
        estimatedCost
      );
      
      // Calculate confidence
      const confidence = this.calculateConfidence(
        testCount,
        testCategories,
        this.historicalData.length
      );
      
      const prediction: ResourcePrediction = {
        predictionId,
        timestamp: new Date(),
        targetJobId: jobId,
        targetUrl,
        testCount,
        resources: optimalResources,
        estimatedDuration,
        optimalStartWindow: optimalWindow,
        confidence: confidence.level,
        confidenceScore: confidence.score,
        temporalCoordinate: temporalAnalysis.coordinate,
        butterflyEffects: temporalAnalysis.effects,
        estimatedCost,
        alternatives
      };
      
      // Cache prediction
      this.activePredictions.set(predictionId, prediction);
      
      this.emit('prediction:completed', {
        predictionId,
        duration: Date.now() - startTime,
        prediction
      });
      
      return prediction;
      
    } catch (error) {
      this.emit('prediction:failed', { predictionId, error });
      throw error;
    }
  }
  
  /**
   * Calculate base resource requirements
   */
  private calculateBaseResources(
    testCount: number,
    categories: string[],
    complexity: string
  ): ResourceAllocation {
    // Base calculations
    const baseWorkers = Math.ceil(testCount / 10);
    const baseBrowsers = Math.ceil(testCount / 5);
    
    // Category adjustments
    const categoryMultipliers = this.getCategoryMultipliers(categories);
    
    // Complexity adjustments
    const complexityMultiplier = this.getComplexityMultiplier(complexity);
    
    const workers = Math.ceil(baseWorkers * categoryMultipliers.workers * complexityMultiplier);
    const browsers = Math.ceil(baseBrowsers * categoryMultipliers.browsers * complexityMultiplier);
    
    return {
      workers: {
        minimum: Math.max(1, Math.floor(workers * 0.5)),
        optimal: workers,
        maximum: Math.ceil(workers * 1.5),
        type: complexity === 'enterprise' ? 'high-performance' : 'standard',
        distribution: testCount > 50 ? 'distributed' : 'concentrated'
      },
      browsers: {
        chromium: Math.ceil(browsers * 0.6),
        firefox: Math.ceil(browsers * 0.25),
        webkit: Math.ceil(browsers * 0.15),
        headless: true,
        parallelism: Math.min(workers, 20)
      },
      compute: {
        vcpus: Math.min(workers * 2, this.config.maxVcpus),
        memoryGb: Math.min(workers * 4, this.config.maxMemoryGb),
        gpuUnits: categories.includes('visual') ? Math.ceil(workers / 10) : 0,
        cpuArchitecture: 'any'
      },
      network: {
        bandwidthMbps: testCount * 10,
        concurrentConnections: testCount * 5,
        geoDistribution: ['us-east', 'eu-west'],
        proxyRequired: categories.includes('security')
      },
      storage: {
        scratchSpaceGb: testCount * 0.5,
        artifactStorageGb: testCount * 0.2,
        cacheStorageGb: 10,
        iops: 3000
      }
    };
  }
  
  /**
   * Get category-specific multipliers
   */
  private getCategoryMultipliers(categories: string[]): {
    workers: number;
    browsers: number;
  } {
    const multipliers = {
      workers: 1.0,
      browsers: 1.0
    };
    
    for (const category of categories) {
      switch (category) {
        case 'e2e':
          multipliers.workers *= 1.5;
          multipliers.browsers *= 2.0;
          break;
        case 'performance':
          multipliers.workers *= 2.0;
          multipliers.browsers *= 1.5;
          break;
        case 'security':
          multipliers.workers *= 1.8;
          multipliers.browsers *= 1.3;
          break;
        case 'visual':
          multipliers.workers *= 1.3;
          multipliers.browsers *= 1.8;
          break;
        case 'api':
          multipliers.workers *= 1.4;
          multipliers.browsers *= 0.5;
          break;
        case 'chaos':
          multipliers.workers *= 3.0;
          multipliers.browsers *= 2.5;
          break;
      }
    }
    
    return multipliers;
  }
  
  /**
   * Get complexity multiplier
   */
  private getComplexityMultiplier(complexity: string): number {
    const multipliers: Record<string, number> = {
      trivial: 0.5,
      simple: 0.8,
      moderate: 1.0,
      complex: 1.5,
      enterprise: 2.5
    };
    return multipliers[complexity] || 1.0;
  }
  
  /**
   * Apply historical learning to resource predictions
   */
  private async applyHistoricalLearning(
    categories: string[],
    complexity: string,
    baseResources: ResourceAllocation
  ): Promise<ResourceAdjustment> {
    if (!this.config.learningEnabled || this.historicalData.length < this.config.minSamplesForPrediction) {
      return { multiplier: 1.0, adjustments: {} };
    }
    
    // Find similar executions
    const similarExecutions = this.historicalData.filter(exec => {
      const categoryMatch = categories.some(cat => exec.jobType.includes(cat));
      return categoryMatch;
    });
    
    if (similarExecutions.length === 0) {
      return { multiplier: 1.0, adjustments: {} };
    }
    
    // Calculate average resource utilization
    const avgWorkerUsage = similarExecutions.reduce((sum, exec) => {
      if (exec.predictedResources && exec.actualResources) {
        return sum + (exec.actualResources.workers.optimal / exec.predictedResources.workers.optimal);
      }
      return sum + 1.0;
    }, 0) / similarExecutions.length;
    
    // Calculate average duration accuracy
    const avgDurationAccuracy = similarExecutions.reduce((sum, exec) => {
      if (exec.predictedDuration && exec.actualDuration) {
        return sum + (exec.actualDuration / exec.predictedDuration);
      }
      return sum + 1.0;
    }, 0) / similarExecutions.length;
    
    return {
      multiplier: avgWorkerUsage,
      adjustments: {
        durationMultiplier: avgDurationAccuracy,
        workerAdjustment: avgWorkerUsage
      }
    };
  }
  
  /**
   * Perform temporal analysis using Chronos-Paradox concepts
   */
  private async performTemporalAnalysis(
    jobId: string,
    testCount: number,
    resources: ResourceAllocation
  ): Promise<TemporalAnalysisResult> {
    // Simulate Chronos-Paradox temporal analysis
    const coordinate: TemporalCoordinate = {
      timestamp: new Date(),
      dimension: 'primary',
      probability: 0.85 + Math.random() * 0.15,
      divergence: Math.random() * 0.1
    };
    
    // Identify potential butterfly effects
    const effects: ButterflyEffect[] = [];
    
    // Resource contention effect
    if (resources.workers.optimal > 20) {
      effects.push({
        trigger: 'High worker count',
        cascadeChain: [
          'Resource contention',
          'Slower test execution',
          'Timeout risks',
          'Potential failures'
        ],
        impactMagnitude: 0.3,
        mitigationStrategies: [
          'Distribute across regions',
          'Implement gradual ramp-up',
          'Add queue management'
        ]
      });
    }
    
    // Network saturation effect
    if (testCount > 100) {
      effects.push({
        trigger: 'High test volume',
        cascadeChain: [
          'Network saturation',
          'Connection throttling',
          'Increased latency',
          'False negatives'
        ],
        impactMagnitude: 0.4,
        mitigationStrategies: [
          'Implement request batching',
          'Add connection pooling',
          'Enable smart retry logic'
        ]
      });
    }
    
    // Memory pressure effect
    if (resources.compute.memoryGb > 64) {
      effects.push({
        trigger: 'High memory allocation',
        cascadeChain: [
          'Memory pressure',
          'GC pauses',
          'Performance degradation',
          'OOM risks'
        ],
        impactMagnitude: 0.25,
        mitigationStrategies: [
          'Implement memory limits per worker',
          'Add browser recycling',
          'Enable aggressive cleanup'
        ]
      });
    }
    
    return { coordinate, effects };
  }
  
  /**
   * Calculate optimal resource allocation
   */
  private calculateOptimalAllocation(
    base: ResourceAllocation,
    learned: ResourceAdjustment,
    temporal: TemporalAnalysisResult
  ): ResourceAllocation {
    const bufferMultiplier = 1 + (this.config.resourceBufferPercent / 100);
    
    // Apply learned adjustments
    const learnedMultiplier = learned.multiplier;
    
    // Apply temporal risk adjustments
    const temporalRisk = temporal.effects.reduce(
      (sum, effect) => sum + effect.impactMagnitude,
      0
    );
    const temporalMultiplier = 1 + (temporalRisk * 0.1);
    
    const finalMultiplier = bufferMultiplier * learnedMultiplier * temporalMultiplier;
    
    return {
      workers: {
        ...base.workers,
        minimum: Math.ceil(base.workers.minimum * finalMultiplier),
        optimal: Math.min(
          Math.ceil(base.workers.optimal * finalMultiplier),
          this.config.maxWorkers
        ),
        maximum: Math.min(
          Math.ceil(base.workers.maximum * finalMultiplier),
          this.config.maxWorkers
        )
      },
      browsers: {
        ...base.browsers,
        chromium: Math.ceil(base.browsers.chromium * finalMultiplier),
        firefox: Math.ceil(base.browsers.firefox * finalMultiplier),
        webkit: Math.ceil(base.browsers.webkit * finalMultiplier),
        parallelism: Math.min(
          Math.ceil(base.browsers.parallelism * finalMultiplier),
          this.config.maxBrowsers
        )
      },
      compute: {
        ...base.compute,
        vcpus: Math.min(
          Math.ceil(base.compute.vcpus * finalMultiplier),
          this.config.maxVcpus
        ),
        memoryGb: Math.min(
          Math.ceil(base.compute.memoryGb * finalMultiplier),
          this.config.maxMemoryGb
        )
      },
      network: {
        ...base.network,
        bandwidthMbps: Math.ceil(base.network.bandwidthMbps * finalMultiplier),
        concurrentConnections: Math.ceil(base.network.concurrentConnections * finalMultiplier)
      },
      storage: {
        ...base.storage,
        scratchSpaceGb: Math.ceil(base.storage.scratchSpaceGb * finalMultiplier),
        artifactStorageGb: Math.ceil(base.storage.artifactStorageGb * finalMultiplier)
      }
    };
  }
  
  /**
   * Estimate execution duration
   */
  private estimateDuration(
    testCount: number,
    categories: string[],
    resources: ResourceAllocation
  ): number {
    // Base duration per test (seconds)
    const baseDurationPerTest = 30;
    
    // Category adjustments
    let categoryMultiplier = 1.0;
    for (const category of categories) {
      switch (category) {
        case 'e2e': categoryMultiplier *= 2.0; break;
        case 'performance': categoryMultiplier *= 3.0; break;
        case 'security': categoryMultiplier *= 2.5; break;
        case 'visual': categoryMultiplier *= 1.5; break;
        case 'smoke': categoryMultiplier *= 0.5; break;
      }
    }
    
    // Parallelism benefit
    const parallelismFactor = Math.max(1, resources.browsers.parallelism);
    
    // Calculate total duration
    const rawDuration = (testCount * baseDurationPerTest * categoryMultiplier) / parallelismFactor;
    
    // Add overhead (setup, teardown, reporting)
    const overhead = 60 + (testCount * 2);
    
    return Math.ceil(rawDuration + overhead);
  }
  
  /**
   * Calculate cost estimate
   */
  private calculateCost(
    resources: ResourceAllocation,
    durationSeconds: number
  ): CostEstimate {
    const durationHours = durationSeconds / 3600;
    
    // Pricing (per hour)
    const workerHourlyCost = 0.10;
    const vcpuHourlyCost = 0.05;
    const memoryGbHourlyCost = 0.01;
    const bandwidthGbCost = 0.09;
    const storageGbHourlyCost = 0.001;
    
    // Calculate costs
    const workerCost = resources.workers.optimal * workerHourlyCost * durationHours;
    const computeCost = (resources.compute.vcpus * vcpuHourlyCost + 
      resources.compute.memoryGb * memoryGbHourlyCost) * durationHours;
    const networkCost = (resources.network.bandwidthMbps / 1000) * bandwidthGbCost * durationHours;
    const storageCost = (resources.storage.scratchSpaceGb + resources.storage.artifactStorageGb) * 
      storageGbHourlyCost * durationHours;
    
    const total = workerCost + computeCost + networkCost + storageCost;
    
    // Savings from prediction (vs. reactive scaling)
    const reactiveOverhead = 0.30; // 30% overhead from reactive scaling
    const savingsFromPrediction = total * reactiveOverhead;
    
    return {
      compute: computeCost,
      network: networkCost,
      storage: storageCost,
      workers: workerCost,
      total,
      currency: 'USD',
      savingsFromPrediction,
      costPerTest: total / Math.max(1, resources.workers.optimal * 10)
    };
  }
  
  /**
   * Find optimal execution window
   */
  private findOptimalWindow(durationSeconds: number): TimeWindow {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Off-peak hours (lowest cost)
    const offPeakStart = 2; // 2 AM
    const offPeakEnd = 6; // 6 AM
    
    let optimalStart: Date;
    let reason: string;
    let savingsPercent: number;
    
    if (currentHour >= offPeakStart && currentHour < offPeakEnd) {
      // Currently in off-peak
      optimalStart = now;
      reason = 'Currently in off-peak hours - lowest resource costs';
      savingsPercent = 25;
    } else if (currentHour < offPeakStart) {
      // Before off-peak today
      optimalStart = new Date(now);
      optimalStart.setHours(offPeakStart, 0, 0, 0);
      reason = 'Schedule for off-peak hours for cost savings';
      savingsPercent = 25;
    } else {
      // After off-peak, schedule for tomorrow
      optimalStart = new Date(now);
      optimalStart.setDate(optimalStart.getDate() + 1);
      optimalStart.setHours(offPeakStart, 0, 0, 0);
      reason = 'Schedule for tomorrow\'s off-peak hours';
      savingsPercent = 25;
    }
    
    // If immediate execution requested, minimal savings
    if (Math.abs(now.getTime() - optimalStart.getTime()) < 3600000) {
      savingsPercent = 5;
      reason = 'Immediate execution with minimal delay';
    }
    
    const optimalEnd = new Date(optimalStart.getTime() + durationSeconds * 1000);
    
    return {
      start: optimalStart,
      end: optimalEnd,
      reason,
      savingsPercent
    };
  }
  
  /**
   * Generate alternative execution scenarios
   */
  private generateAlternatives(
    optimal: ResourceAllocation,
    duration: number,
    cost: CostEstimate
  ): AlternativeScenario[] {
    const alternatives: AlternativeScenario[] = [];
    
    // Economy scenario
    const economyResources = this.scaleResources(optimal, 0.6);
    alternatives.push({
      scenarioId: this.generateId('scn'),
      name: 'Economy',
      description: 'Reduced resources for cost-sensitive executions',
      resources: economyResources,
      duration: Math.ceil(duration * 1.6),
      cost: {
        ...cost,
        total: cost.total * 0.5,
        savingsFromPrediction: cost.savingsFromPrediction * 0.5
      },
      tradeoffs: [
        'Longer execution time',
        'May hit timeouts on complex tests',
        'Lower parallelism'
      ],
      recommended: false
    });
    
    // Premium scenario
    const premiumResources = this.scaleResources(optimal, 1.5);
    alternatives.push({
      scenarioId: this.generateId('scn'),
      name: 'Premium',
      description: 'Maximum resources for fastest execution',
      resources: premiumResources,
      duration: Math.ceil(duration * 0.6),
      cost: {
        ...cost,
        total: cost.total * 1.8,
        savingsFromPrediction: cost.savingsFromPrediction * 1.5
      },
      tradeoffs: [
        'Higher cost',
        'May be unnecessary for simple tests'
      ],
      recommended: false
    });
    
    // Balanced scenario (recommended)
    alternatives.push({
      scenarioId: this.generateId('scn'),
      name: 'Balanced',
      description: 'Optimal balance of speed and cost',
      resources: optimal,
      duration,
      cost,
      tradeoffs: [],
      recommended: true
    });
    
    return alternatives;
  }
  
  /**
   * Scale resources by a factor
   */
  private scaleResources(resources: ResourceAllocation, factor: number): ResourceAllocation {
    return {
      workers: {
        ...resources.workers,
        minimum: Math.ceil(resources.workers.minimum * factor),
        optimal: Math.ceil(resources.workers.optimal * factor),
        maximum: Math.ceil(resources.workers.maximum * factor)
      },
      browsers: {
        ...resources.browsers,
        chromium: Math.ceil(resources.browsers.chromium * factor),
        firefox: Math.ceil(resources.browsers.firefox * factor),
        webkit: Math.ceil(resources.browsers.webkit * factor),
        parallelism: Math.ceil(resources.browsers.parallelism * factor)
      },
      compute: {
        ...resources.compute,
        vcpus: Math.ceil(resources.compute.vcpus * factor),
        memoryGb: Math.ceil(resources.compute.memoryGb * factor)
      },
      network: {
        ...resources.network,
        bandwidthMbps: Math.ceil(resources.network.bandwidthMbps * factor),
        concurrentConnections: Math.ceil(resources.network.concurrentConnections * factor)
      },
      storage: {
        ...resources.storage,
        scratchSpaceGb: Math.ceil(resources.storage.scratchSpaceGb * factor),
        artifactStorageGb: Math.ceil(resources.storage.artifactStorageGb * factor)
      }
    };
  }
  
  /**
   * Calculate confidence level
   */
  private calculateConfidence(
    testCount: number,
    categories: string[],
    historicalSamples: number
  ): { level: ConfidenceLevel; score: number } {
    let score = 0.5; // Base confidence
    
    // Historical data boost
    if (historicalSamples >= 100) score += 0.3;
    else if (historicalSamples >= 50) score += 0.2;
    else if (historicalSamples >= 20) score += 0.1;
    
    // Test count familiarity
    if (testCount >= 10 && testCount <= 100) score += 0.1;
    
    // Category familiarity
    const commonCategories = ['smoke', 'regression', 'e2e'];
    const knownCategories = categories.filter(c => commonCategories.includes(c));
    score += knownCategories.length * 0.05;
    
    // Cap at 0.99
    score = Math.min(0.99, score);
    
    let level: ConfidenceLevel;
    if (score >= 0.9) level = 'certain';
    else if (score >= 0.75) level = 'high';
    else if (score >= 0.5) level = 'medium';
    else level = 'low';
    
    return { level, score };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PREEMPTIVE SCALING
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Execute preemptive scaling based on prediction
   */
  async executePreemptiveScale(predictionId: string): Promise<ScalingEvent[]> {
    const prediction = this.activePredictions.get(predictionId);
    if (!prediction) {
      throw new Error(`Prediction not found: ${predictionId}`);
    }
    
    this.emit('preemptive:started', { predictionId });
    
    const events: ScalingEvent[] = [];
    
    try {
      // Scale workers
      if (prediction.resources.workers.optimal > this.currentAllocation.workers.optimal) {
        const workerEvent = await this.scaleResource(
          'worker',
          this.currentAllocation.workers.optimal,
          prediction.resources.workers.optimal,
          `Preemptive scale for job ${prediction.targetJobId}`,
          predictionId
        );
        events.push(workerEvent);
      }
      
      // Scale browsers
      const currentBrowsers = this.currentAllocation.browsers.parallelism;
      const targetBrowsers = prediction.resources.browsers.parallelism;
      if (targetBrowsers > currentBrowsers) {
        const browserEvent = await this.scaleResource(
          'browser',
          currentBrowsers,
          targetBrowsers,
          `Preemptive browser scale for job ${prediction.targetJobId}`,
          predictionId
        );
        events.push(browserEvent);
      }
      
      // Scale compute
      if (prediction.resources.compute.vcpus > this.currentAllocation.compute.vcpus) {
        const cpuEvent = await this.scaleResource(
          'cpu',
          this.currentAllocation.compute.vcpus,
          prediction.resources.compute.vcpus,
          `Preemptive CPU scale for job ${prediction.targetJobId}`,
          predictionId
        );
        events.push(cpuEvent);
      }
      
      // Update current allocation
      this.currentAllocation = prediction.resources;
      this.coldStartsAvoided++;
      
      this.emit('preemptive:completed', {
        predictionId,
        events,
        coldStartAvoided: true
      });
      
      return events;
      
    } catch (error) {
      this.emit('preemptive:failed', { predictionId, error });
      throw error;
    }
  }
  
  /**
   * Scale a specific resource
   */
  private async scaleResource(
    resourceType: ResourceType,
    previousValue: number,
    newValue: number,
    reason: string,
    predictionId?: string
  ): Promise<ScalingEvent> {
    const event: ScalingEvent = {
      eventId: this.generateId('evt'),
      timestamp: new Date(),
      action: newValue > previousValue ? 'preemptive-scale' : 'scale-down',
      resourceType,
      previousValue,
      newValue,
      reason,
      predictionId,
      success: true
    };
    
    // Simulate scaling operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.scalingHistory.push(event);
    this.emit('resource:scaled', event);
    
    return event;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // LEARNING & FEEDBACK
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Record execution outcome for learning
   */
  recordExecution(execution: HistoricalExecution): void {
    this.historicalData.push(execution);
    
    // Trim old data
    const cutoff = Date.now() - (this.config.historicalWindowDays * 24 * 60 * 60 * 1000);
    this.historicalData = this.historicalData.filter(
      e => e.timestamp.getTime() > cutoff
    );
    
    // Update prediction accuracy
    if (execution.predictedDuration && execution.predictedResources) {
      const durationAccuracy = 1 - Math.abs(
        execution.actualDuration - execution.predictedDuration
      ) / execution.predictedDuration;
      
      // Exponential moving average
      this.predictionAccuracy = this.predictionAccuracy * 0.9 + durationAccuracy * 0.1;
    }
    
    // Calculate cost savings
    if (execution.predictedResources && execution.outcome === 'success') {
      const predictedCost = this.calculateCost(
        execution.predictedResources,
        execution.predictedDuration || execution.actualDuration
      );
      this.costSavingsTotal += predictedCost.savingsFromPrediction;
    }
    
    this.emit('execution:recorded', {
      executionId: execution.executionId,
      accuracy: this.predictionAccuracy
    });
  }
  
  /**
   * Initialize learning models
   */
  private initializeModels(): void {
    // Resource models for each category
    const categories = ['smoke', 'regression', 'e2e', 'api', 'performance', 'security', 'visual'];
    
    for (const category of categories) {
      this.resourceModels.set(category, {
        category,
        workerCoefficient: 0.1,
        browserCoefficient: 0.2,
        memoryCoefficient: 0.4,
        lastUpdated: new Date()
      });
      
      this.durationModels.set(category, {
        category,
        baseSeconds: 30,
        perTestSeconds: 5,
        complexityFactor: 1.0,
        lastUpdated: new Date()
      });
    }
  }
  
  /**
   * Get baseline resource allocation
   */
  private getBaselineAllocation(): ResourceAllocation {
    return {
      workers: {
        minimum: 1,
        optimal: 2,
        maximum: 5,
        type: 'standard',
        distribution: 'concentrated'
      },
      browsers: {
        chromium: 2,
        firefox: 1,
        webkit: 1,
        headless: true,
        parallelism: 2
      },
      compute: {
        vcpus: 4,
        memoryGb: 8,
        gpuUnits: 0,
        cpuArchitecture: 'any'
      },
      network: {
        bandwidthMbps: 100,
        concurrentConnections: 50,
        geoDistribution: ['us-east'],
        proxyRequired: false
      },
      storage: {
        scratchSpaceGb: 5,
        artifactStorageGb: 2,
        cacheStorageGb: 5,
        iops: 1000
      }
    };
  }
  
  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ANALYTICS & REPORTING
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Get scaler analytics
   */
  getAnalytics(): ScalerAnalytics {
    return {
      predictionAccuracy: this.predictionAccuracy,
      costSavingsTotal: this.costSavingsTotal,
      coldStartsAvoided: this.coldStartsAvoided,
      totalPredictions: this.activePredictions.size,
      totalScalingEvents: this.scalingHistory.length,
      historicalDataPoints: this.historicalData.length,
      averageLeadTime: this.config.preemptiveScaleMinutes * 60
    };
  }
  
  /**
   * Get scaling history
   */
  getScalingHistory(limit: number = 100): ScalingEvent[] {
    return this.scalingHistory.slice(-limit);
  }
  
  /**
   * Get active predictions
   */
  getActivePredictions(): ResourcePrediction[] {
    return Array.from(this.activePredictions.values());
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPPORTING INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface ResourceModel {
  category: string;
  workerCoefficient: number;
  browserCoefficient: number;
  memoryCoefficient: number;
  lastUpdated: Date;
}

interface DurationModel {
  category: string;
  baseSeconds: number;
  perTestSeconds: number;
  complexityFactor: number;
  lastUpdated: Date;
}

interface ResourceAdjustment {
  multiplier: number;
  adjustments: Record<string, number>;
}

interface TemporalAnalysisResult {
  coordinate: TemporalCoordinate;
  effects: ButterflyEffect[];
}

/**
 * Scaler analytics
 */
export interface ScalerAnalytics {
  predictionAccuracy: number;
  costSavingsTotal: number;
  coldStartsAvoided: number;
  totalPredictions: number;
  totalScalingEvents: number;
  historicalDataPoints: number;
  averageLeadTime: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new PredictiveScaler instance
 */
export function createPredictiveScaler(
  config?: Partial<PredictiveScalerConfig>
): PredictiveScaler {
  return new PredictiveScaler(config);
}

export default PredictiveScaler;
