/**
 * 🔮 PREDICTIVE RESOURCE ALLOCATION ENGINE
 * 
 * Advanced Practice #2: Swarm predicts Lambda instances needed before tests start.
 * 
 * This module uses ML patterns and historical data to predict resource needs,
 * pre-warming cloud instances, and optimizing cost/performance ratio.
 * 
 * Features:
 * - Time-series analysis of test patterns
 * - Lambda/container pre-warming
 * - Cost optimization algorithms
 * - Auto-scaling predictions
 * - Load balancing forecasts
 * 
 * @version 1.0.0-QANTUM-PRIME
 * @phase Future Practices - Beyond Phase 100
 * @author QANTUM AI Architect
 */

import { EventEmitter } from 'events';

import { logger } from '../api/unified/utils/logger';
// ============================================================
// TYPES
// ============================================================

interface ResourcePrediction {
    predictionId: string;
    timestamp: number;
    timeHorizon: number; // minutes ahead
    resources: {
        lambdaInstances: number;
        containerCount: number;
        memoryMB: number;
        cpuUnits: number;
        networkBandwidth: number;
    };
    confidence: number;
    factors: PredictionFactor[];
    estimatedCost: number;
    actualUsage?: ResourceUsage;
}

interface ResourceUsage {
    timestamp: number;
    lambdaInvocations: number;
    containerCount: number;
    memoryPeakMB: number;
    cpuPeakPercent: number;
    networkMB: number;
    duration: number;
    cost: number;
}

interface PredictionFactor {
    name: string;
    weight: number;
    value: number;
    contribution: number;
}

interface TestPattern {
    patternId: string;
    dayOfWeek: number;
    hourOfDay: number;
    testCount: number;
    avgDuration: number;
    resourceProfile: ResourceProfile;
    frequency: number;
}

interface ResourceProfile {
    avgLambdas: number;
    peakLambdas: number;
    avgMemory: number;
    peakMemory: number;
    avgCpu: number;
    networkIntensive: boolean;
}

interface PreWarmConfig {
    provider: 'aws' | 'azure' | 'gcp' | 'local';
    region: string;
    preWarmMinutes: number;
    maxInstances: number;
    costThreshold: number;
    enableAutoScale: boolean;
}

interface TimeSeriesPoint {
    timestamp: number;
    value: number;
    metric: string;
}

// ============================================================
// PREDICTIVE RESOURCE ALLOCATION ENGINE
// ============================================================

export class PredictiveResourceEngine extends EventEmitter {
    private config: PreWarmConfig;
    private patterns: Map<string, TestPattern> = new Map();
    private predictions: ResourcePrediction[] = [];
    private usageHistory: ResourceUsage[] = [];
    private timeSeriesData: Map<string, TimeSeriesPoint[]> = new Map();
    
    // ML model weights (simulated)
    private modelWeights = {
        dayOfWeek: 0.15,
        hourOfDay: 0.25,
        historicalAvg: 0.20,
        recentTrend: 0.25,
        testComplexity: 0.15
    };

    // Seasonality patterns
    private seasonality = {
        monday: 1.2,    // Higher on Mondays (regression testing)
        tuesday: 1.0,
        wednesday: 1.1,
        thursday: 1.0,
        friday: 0.8,    // Lower on Fridays
        saturday: 0.3,  // Minimal on weekends
        sunday: 0.2
    };

    // Hourly patterns
    private hourlyPattern = [
        0.1, 0.1, 0.1, 0.1, 0.2, 0.3,  // 00-05
        0.5, 0.8, 1.0, 1.2, 1.2, 1.0,  // 06-11
        0.8, 1.0, 1.2, 1.3, 1.2, 1.0,  // 12-17
        0.8, 0.6, 0.4, 0.3, 0.2, 0.1   // 18-23
    ];

    constructor(config: Partial<PreWarmConfig> = {}) {
        super();

        this.config = {
            provider: 'aws',
            region: 'eu-central-1',
            preWarmMinutes: 5,
            maxInstances: 100,
            costThreshold: 50, // $ per hour
            enableAutoScale: true,
            ...config
        };
    }

    /**
     * 🚀 Initialize prediction engine
     */
    async initialize(): Promise<void> {
        logger.debug(`
╔═══════════════════════════════════════════════════════════════╗
║  🔮 PREDICTIVE RESOURCE ALLOCATION ENGINE                     ║
║                                                               ║
║  "Predict. Pre-warm. Perform."                                ║
╚═══════════════════════════════════════════════════════════════╝
`);

        // Load historical patterns
        await this.loadHistoricalPatterns();
        
        // Initialize time series
        this.initializeTimeSeries();

        logger.debug(`   ✅ Loaded ${this.patterns.size} test patterns`);
        logger.debug(`   ✅ Provider: ${this.config.provider.toUpperCase()}`);
        logger.debug(`   ✅ Pre-warm window: ${this.config.preWarmMinutes} minutes`);
    }

    /**
     * 📊 Load historical test patterns
     */
    private async loadHistoricalPatterns(): Promise<void> {
        // Simulated historical data - in production, load from database
        const historicalPatterns: TestPattern[] = [
            {
                patternId: 'pattern_morning_peak',
                dayOfWeek: 1, // Monday
                hourOfDay: 9,
                testCount: 150,
                avgDuration: 45,
                resourceProfile: {
                    avgLambdas: 25,
                    peakLambdas: 50,
                    avgMemory: 2048,
                    peakMemory: 4096,
                    avgCpu: 60,
                    networkIntensive: false
                },
                frequency: 22 // days per month
            },
            {
                patternId: 'pattern_regression',
                dayOfWeek: 4, // Thursday
                hourOfDay: 14,
                testCount: 500,
                avgDuration: 120,
                resourceProfile: {
                    avgLambdas: 75,
                    peakLambdas: 120,
                    avgMemory: 4096,
                    peakMemory: 8192,
                    avgCpu: 85,
                    networkIntensive: true
                },
                frequency: 4 // weekly
            },
            {
                patternId: 'pattern_nightly_full',
                dayOfWeek: 0, // Daily
                hourOfDay: 2,
                testCount: 1000,
                avgDuration: 180,
                resourceProfile: {
                    avgLambdas: 100,
                    peakLambdas: 150,
                    avgMemory: 8192,
                    peakMemory: 16384,
                    avgCpu: 95,
                    networkIntensive: true
                },
                frequency: 30 // daily
            }
        ];

        for (const pattern of historicalPatterns) {
            this.patterns.set(pattern.patternId, pattern);
        }
    }

    /**
     * 📈 Initialize time series tracking
     */
    private initializeTimeSeries(): void {
        const metrics = ['lambdaInvocations', 'memoryUsage', 'cpuUsage', 'testCount'];
        
        for (const metric of metrics) {
            this.timeSeriesData.set(metric, []);
        }
    }

    /**
     * 🔮 Generate resource prediction for upcoming time window
     */
    async predictResources(minutesAhead: number = 30): Promise<ResourcePrediction> {
        const now = Date.now();
        const targetTime = now + (minutesAhead * 60 * 1000);
        const targetDate = new Date(targetTime);

        // Calculate prediction factors
        const factors = this.calculatePredictionFactors(targetDate);
        
        // Calculate base resources
        const baseResources = this.calculateBaseResources(factors);
        
        // Apply multipliers
        const predictedResources = this.applyMultipliers(baseResources, factors);
        
        // Calculate confidence
        const confidence = this.calculateConfidence(factors);
        
        // Estimate cost
        const estimatedCost = this.estimateCost(predictedResources, minutesAhead);

        const prediction: ResourcePrediction = {
            predictionId: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: now,
            timeHorizon: minutesAhead,
            resources: predictedResources,
            confidence,
            factors,
            estimatedCost
        };

        this.predictions.push(prediction);
        this.emit('prediction:generated', prediction);

        return prediction;
    }

    /**
     * 📊 Calculate prediction factors
     */
    private calculatePredictionFactors(targetDate: Date): PredictionFactor[] {
        const factors: PredictionFactor[] = [];
        const dayOfWeek = targetDate.getDay();
        const hourOfDay = targetDate.getHours();

        // Day of week factor
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayMultiplier = this.seasonality[dayNames[dayOfWeek] as keyof typeof this.seasonality];
        factors.push({
            name: 'dayOfWeek',
            weight: this.modelWeights.dayOfWeek,
            value: dayMultiplier,
            contribution: dayMultiplier * this.modelWeights.dayOfWeek
        });

        // Hour of day factor
        const hourMultiplier = this.hourlyPattern[hourOfDay];
        factors.push({
            name: 'hourOfDay',
            weight: this.modelWeights.hourOfDay,
            value: hourMultiplier,
            contribution: hourMultiplier * this.modelWeights.hourOfDay
        });

        // Historical average factor
        const historicalAvg = this.calculateHistoricalAverage(dayOfWeek, hourOfDay);
        factors.push({
            name: 'historicalAvg',
            weight: this.modelWeights.historicalAvg,
            value: historicalAvg,
            contribution: historicalAvg * this.modelWeights.historicalAvg
        });

        // Recent trend factor
        const recentTrend = this.calculateRecentTrend();
        factors.push({
            name: 'recentTrend',
            weight: this.modelWeights.recentTrend,
            value: recentTrend,
            contribution: recentTrend * this.modelWeights.recentTrend
        });

        // Test complexity factor (from scheduled tests)
        const complexity = this.estimateTestComplexity();
        factors.push({
            name: 'testComplexity',
            weight: this.modelWeights.testComplexity,
            value: complexity,
            contribution: complexity * this.modelWeights.testComplexity
        });

        return factors;
    }

    /**
     * Calculate historical average for time slot
     */
    private calculateHistoricalAverage(dayOfWeek: number, hourOfDay: number): number {
        let sum = 0;
        let count = 0;

        for (const pattern of this.patterns.values()) {
            if (pattern.dayOfWeek === dayOfWeek || pattern.dayOfWeek === 0) {
                if (Math.abs(pattern.hourOfDay - hourOfDay) <= 2) {
                    sum += pattern.resourceProfile.avgLambdas / 100; // Normalize
                    count++;
                }
            }
        }

        return count > 0 ? sum / count : 0.5;
    }

    /**
     * Calculate recent usage trend
     */
    private calculateRecentTrend(): number {
        if (this.usageHistory.length < 2) return 1.0;

        const recent = this.usageHistory.slice(-10);
        const trend = recent.reduce((acc, usage, i) => {
            if (i === 0) return 0;
            return acc + (usage.lambdaInvocations - recent[i-1].lambdaInvocations);
        }, 0) / (recent.length - 1);

        // Normalize trend to 0.5-1.5 range
        return Math.max(0.5, Math.min(1.5, 1 + (trend / 100)));
    }

    /**
     * Estimate test complexity based on scheduled tests
     */
    private estimateTestComplexity(): number {
        // Placeholder - in production, analyze test queue
        return 1.0;
    }

    /**
     * Calculate base resources
     */
    private calculateBaseResources(factors: PredictionFactor[]): ResourcePrediction['resources'] {
        const totalFactor = factors.reduce((sum, f) => sum + f.contribution, 0);
        
        // Base calculations
        const baseLambdas = 10;
        const baseMemory = 512;
        const baseCpu = 256;
        const baseNetwork = 100;

        return {
            lambdaInstances: Math.ceil(baseLambdas * totalFactor * 5),
            containerCount: Math.ceil(totalFactor * 3),
            memoryMB: Math.ceil(baseMemory * totalFactor * 4),
            cpuUnits: Math.ceil(baseCpu * totalFactor * 4),
            networkBandwidth: Math.ceil(baseNetwork * totalFactor)
        };
    }

    /**
     * Apply multipliers and constraints
     */
    private applyMultipliers(
        base: ResourcePrediction['resources'],
        factors: PredictionFactor[]
    ): ResourcePrediction['resources'] {
        // Apply provider-specific multipliers
        const providerMultiplier = {
            aws: 1.0,
            azure: 1.1,
            gcp: 0.95,
            local: 0.5
        }[this.config.provider];

        const adjusted = {
            lambdaInstances: Math.min(
                Math.ceil(base.lambdaInstances * providerMultiplier),
                this.config.maxInstances
            ),
            containerCount: Math.ceil(base.containerCount * providerMultiplier),
            memoryMB: Math.ceil(base.memoryMB * providerMultiplier),
            cpuUnits: Math.ceil(base.cpuUnits * providerMultiplier),
            networkBandwidth: base.networkBandwidth
        };

        // Apply safety buffer (20%)
        adjusted.lambdaInstances = Math.ceil(adjusted.lambdaInstances * 1.2);
        adjusted.memoryMB = Math.ceil(adjusted.memoryMB * 1.2);

        return adjusted;
    }

    /**
     * Calculate prediction confidence
     */
    private calculateConfidence(factors: PredictionFactor[]): number {
        let confidence = 0.7; // Base confidence

        // Increase confidence with more historical data
        if (this.usageHistory.length > 100) confidence += 0.1;
        if (this.patterns.size > 10) confidence += 0.1;

        // Decrease confidence for unusual factor values
        for (const factor of factors) {
            if (factor.value < 0.3 || factor.value > 1.5) {
                confidence -= 0.05;
            }
        }

        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * 💰 Estimate cost for predicted resources
     */
    private estimateCost(resources: ResourcePrediction['resources'], minutes: number): number {
        const hours = minutes / 60;

        // Pricing (simulated - per hour)
        const pricing = {
            lambda: 0.0000166667 * 1000, // Per 1000 invocations
            memory: 0.00001667,           // Per MB-second
            compute: 0.034,               // Per vCPU-hour
            network: 0.09                 // Per GB
        };

        const cost = 
            (resources.lambdaInstances * pricing.lambda * hours) +
            (resources.memoryMB * pricing.memory * hours * 3600) +
            (resources.cpuUnits / 1024 * pricing.compute * hours) +
            (resources.networkBandwidth / 1024 * pricing.network * hours);

        return Math.round(cost * 100) / 100;
    }

    /**
     * 🔥 Pre-warm resources based on prediction
     */
    async preWarmResources(prediction: ResourcePrediction): Promise<PreWarmResult> {
        logger.debug(`\n🔥 Pre-warming resources for ${this.config.provider.toUpperCase()}...`);
        logger.debug(`   Lambdas: ${prediction.resources.lambdaInstances}`);
        logger.debug(`   Containers: ${prediction.resources.containerCount}`);
        logger.debug(`   Memory: ${prediction.resources.memoryMB}MB`);
        logger.debug(`   Estimated cost: $${prediction.estimatedCost}`);

        const result: PreWarmResult = {
            predictionId: prediction.predictionId,
            provider: this.config.provider,
            requestedResources: prediction.resources,
            warmedResources: { ...prediction.resources },
            startTime: Date.now(),
            status: 'pending',
            errors: []
        };

        // Check cost threshold
        if (prediction.estimatedCost > this.config.costThreshold) {
            logger.debug(`   ⚠️ Cost exceeds threshold. Scaling down...`);
            result.warmedResources.lambdaInstances = Math.ceil(
                result.warmedResources.lambdaInstances * (this.config.costThreshold / prediction.estimatedCost)
            );
        }

        try {
            // Simulate pre-warming based on provider
            await this.executePreWarm(result);
            result.status = 'success';
            result.endTime = Date.now();

            logger.debug(`   ✅ Pre-warming complete in ${result.endTime - result.startTime}ms`);
            this.emit('prewarm:success', result);
        } catch (error: any) {
            result.status = 'failed';
            result.errors.push(error.message);
            logger.error(`   ❌ Pre-warming failed: ${error.message}`);
            this.emit('prewarm:failed', result);
        }

        return result;
    }

    /**
     * Execute pre-warm commands
     */
    private async executePreWarm(result: PreWarmResult): Promise<void> {
        switch (this.config.provider) {
            case 'aws':
                await this.preWarmAWS(result);
                break;
            case 'azure':
                await this.preWarmAzure(result);
                break;
            case 'gcp':
                await this.preWarmGCP(result);
                break;
            case 'local':
                await this.preWarmLocal(result);
                break;
        }
    }

    /**
     * AWS Lambda pre-warming
     */
    private async preWarmAWS(result: PreWarmResult): Promise<void> {
        // Generate pre-warm commands
        const commands = [];
        
        // Provisioned concurrency
        commands.push({
            service: 'lambda',
            command: 'put-provisioned-concurrency-config',
            params: {
                FunctionName: 'qantum-worker',
                Qualifier: 'LATEST',
                ProvisionedConcurrentExecutions: result.warmedResources.lambdaInstances
            }
        });

        // ECS service scaling
        commands.push({
            service: 'ecs',
            command: 'update-service',
            params: {
                cluster: 'qantum-cluster',
                service: 'worker-service',
                desiredCount: result.warmedResources.containerCount
            }
        });

        logger.debug(`   📦 AWS commands generated: ${commands.length}`);
        
        // Simulate execution delay
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    /**
     * Azure pre-warming
     */
    private async preWarmAzure(result: PreWarmResult): Promise<void> {
        logger.debug(`   ☁️ Azure Functions pre-warming...`);
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    /**
     * GCP pre-warming
     */
    private async preWarmGCP(result: PreWarmResult): Promise<void> {
        logger.debug(`   🌐 GCP Cloud Functions pre-warming...`);
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    /**
     * Local Docker pre-warming
     */
    private async preWarmLocal(result: PreWarmResult): Promise<void> {
        logger.debug(`   🐳 Local Docker containers pre-warming...`);
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    /**
     * 📊 Record actual usage for model improvement
     */
    recordUsage(usage: ResourceUsage): void {
        this.usageHistory.push(usage);

        // Trim history to last 1000 entries
        if (this.usageHistory.length > 1000) {
            this.usageHistory = this.usageHistory.slice(-1000);
        }

        // Update time series
        this.updateTimeSeries('lambdaInvocations', usage.timestamp, usage.lambdaInvocations);
        this.updateTimeSeries('memoryUsage', usage.timestamp, usage.memoryPeakMB);
        this.updateTimeSeries('cpuUsage', usage.timestamp, usage.cpuPeakPercent);

        // Find matching prediction and update accuracy
        const matchingPrediction = this.predictions.find(p => 
            Math.abs(p.timestamp + (p.timeHorizon * 60 * 1000) - usage.timestamp) < 300000 // 5 min window
        );

        if (matchingPrediction) {
            matchingPrediction.actualUsage = usage;
            this.adjustModelWeights(matchingPrediction, usage);
        }

        this.emit('usage:recorded', usage);
    }

    /**
     * Update time series data
     */
    private updateTimeSeries(metric: string, timestamp: number, value: number): void {
        const series = this.timeSeriesData.get(metric) || [];
        series.push({ timestamp, value, metric });

        // Keep last 1000 points
        if (series.length > 1000) {
            series.shift();
        }

        this.timeSeriesData.set(metric, series);
    }

    /**
     * 🧠 Adjust model weights based on prediction accuracy
     */
    private adjustModelWeights(prediction: ResourcePrediction, actual: ResourceUsage): void {
        const predicted = prediction.resources.lambdaInstances;
        const actualValue = actual.lambdaInvocations;

        const error = Math.abs(predicted - actualValue) / Math.max(predicted, actualValue);

        // Adjust weights based on error
        if (error > 0.3) {
            // High error - adjust weights
            for (const factor of prediction.factors) {
                const currentWeight = this.modelWeights[factor.name as keyof typeof this.modelWeights];
                if (currentWeight !== undefined) {
                    // Reduce weight for factors that contributed most to error
                    const adjustment = error * factor.contribution * 0.01;
                    this.modelWeights[factor.name as keyof typeof this.modelWeights] = 
                        Math.max(0.05, currentWeight - adjustment);
                }
            }

            // Normalize weights to sum to 1
            const totalWeight = Object.values(this.modelWeights).reduce((a, b) => a + b, 0);
            for (const key of Object.keys(this.modelWeights) as (keyof typeof this.modelWeights)[]) {
                this.modelWeights[key] /= totalWeight;
            }

            logger.debug('   🧠 Model weights adjusted based on prediction accuracy');
        }
    }

    /**
     * 📈 Get prediction accuracy stats
     */
    getAccuracyStats(): PredictionAccuracyStats {
        const predictionsWithActual = this.predictions.filter(p => p.actualUsage);
        
        if (predictionsWithActual.length === 0) {
            return {
                totalPredictions: this.predictions.length,
                evaluatedPredictions: 0,
                avgAccuracy: 0,
                avgOverPrediction: 0,
                avgUnderPrediction: 0,
                costSavings: 0
            };
        }

        let totalAccuracy = 0;
        let overPredictions = 0;
        let underPredictions = 0;
        let costSavings = 0;

        for (const pred of predictionsWithActual) {
            const actual = pred.actualUsage!;
            const accuracy = 1 - Math.abs(pred.resources.lambdaInstances - actual.lambdaInvocations) / 
                            Math.max(pred.resources.lambdaInstances, actual.lambdaInvocations);
            
            totalAccuracy += accuracy;

            if (pred.resources.lambdaInstances > actual.lambdaInvocations) {
                overPredictions++;
            } else {
                underPredictions++;
            }

            // Estimate cost savings from accurate prediction
            const withoutPrediction = actual.cost * 1.3; // Assume 30% overhead without prediction
            costSavings += withoutPrediction - actual.cost;
        }

        return {
            totalPredictions: this.predictions.length,
            evaluatedPredictions: predictionsWithActual.length,
            avgAccuracy: totalAccuracy / predictionsWithActual.length,
            avgOverPrediction: overPredictions / predictionsWithActual.length,
            avgUnderPrediction: underPredictions / predictionsWithActual.length,
            costSavings
        };
    }

    /**
     * 📊 Generate resource report
     */
    generateReport(): ResourceReport {
        const stats = this.getAccuracyStats();
        const recentUsage = this.usageHistory.slice(-24);
        
        return {
            timestamp: Date.now(),
            provider: this.config.provider,
            region: this.config.region,
            predictionStats: stats,
            modelWeights: { ...this.modelWeights },
            recentPredictions: this.predictions.slice(-10),
            recentUsage,
            recommendations: this.generateRecommendations(stats, recentUsage)
        };
    }

    /**
     * Generate optimization recommendations
     */
    private generateRecommendations(
        stats: PredictionAccuracyStats,
        recentUsage: ResourceUsage[]
    ): string[] {
        const recommendations: string[] = [];

        if (stats.avgAccuracy < 0.7) {
            recommendations.push('Consider collecting more historical data to improve prediction accuracy');
        }

        if (stats.avgOverPrediction > 0.6) {
            recommendations.push('Model tends to over-predict. Consider reducing safety buffer');
        }

        if (stats.avgUnderPrediction > 0.4) {
            recommendations.push('Model tends to under-predict. Increase safety buffer to prevent throttling');
        }

        const avgCost = recentUsage.reduce((sum, u) => sum + u.cost, 0) / recentUsage.length;
        if (avgCost > this.config.costThreshold * 0.8) {
            recommendations.push('Approaching cost threshold. Review resource allocation policies');
        }

        return recommendations;
    }
}

// ============================================================
// SUPPORTING TYPES
// ============================================================

interface PreWarmResult {
    predictionId: string;
    provider: string;
    requestedResources: ResourcePrediction['resources'];
    warmedResources: ResourcePrediction['resources'];
    startTime: number;
    endTime?: number;
    status: 'pending' | 'success' | 'failed';
    errors: string[];
}

interface PredictionAccuracyStats {
    totalPredictions: number;
    evaluatedPredictions: number;
    avgAccuracy: number;
    avgOverPrediction: number;
    avgUnderPrediction: number;
    costSavings: number;
}

interface ResourceReport {
    timestamp: number;
    provider: string;
    region: string;
    predictionStats: PredictionAccuracyStats;
    modelWeights: Record<string, number>;
    recentPredictions: ResourcePrediction[];
    recentUsage: ResourceUsage[];
    recommendations: string[];
}

// ============================================================
// EXPORTS
// ============================================================

export function createPredictiveResourceEngine(config?: Partial<PreWarmConfig>): PredictiveResourceEngine {
    return new PredictiveResourceEngine(config);
}

export type {
    ResourcePrediction,
    ResourceUsage,
    PreWarmConfig,
    PreWarmResult,
    PredictionAccuracyStats,
    ResourceReport
};
