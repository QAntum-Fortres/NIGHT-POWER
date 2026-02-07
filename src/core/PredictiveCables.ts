/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                               ║
 * ║   ██████╗ ██████╗ ███████╗██████╗ ██╗ ██████╗████████╗██╗██╗   ██╗███████╗                    ║
 * ║   ██╔══██╗██╔══██╗██╔════╝██╔══██╗██║██╔════╝╚══██╔══╝██║██║   ██║██╔════╝                    ║
 * ║   ██████╔╝██████╔╝█████╗  ██║  ██║██║██║        ██║   ██║██║   ██║█████╗                      ║
 * ║   ██╔═══╝ ██╔══██╗██╔══╝  ██║  ██║██║██║        ██║   ██║╚██╗ ██╔╝██╔══╝                      ║
 * ║   ██║     ██║  ██║███████╗██████╔╝██║╚██████╗   ██║   ██║ ╚████╔╝ ███████╗                    ║
 * ║   ╚═╝     ╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝ ╚═════╝   ╚═╝   ╚═╝  ╚═══╝  ╚══════╝                    ║
 * ║                                                                                               ║
 * ║    ██████╗ █████╗ ██████╗ ██╗     ███████╗███████╗                                            ║
 * ║   ██╔════╝██╔══██╗██╔══██╗██║     ██╔════╝██╔════╝                                            ║
 * ║   ██║     ███████║██████╔╝██║     █████╗  ███████╗                                            ║
 * ║   ██║     ██╔══██║██╔══██╗██║     ██╔══╝  ╚════██║                                            ║
 * ║   ╚██████╗██║  ██║██████╔╝███████╗███████╗███████║                                            ║
 * ║    ╚═════╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝╚══════╝                                            ║
 * ║                                                                                               ║
 * ║   🔭 ДАТЧИК-ТЕЛЕСКОП - Вижда проблема ПРЕДИ да се случи                                       ║
 * ║                                                                                               ║
 * ║   "Не поправяме скъсан кабел. Виждаме го преди да се скъса."                                  ║
 * ║                                                                                               ║
 * ║   Features:                                                                                   ║
 * ║   • Trend Analysis - анализ на тенденциите                                                    ║
 * ║   • Anomaly Detection - засичане на аномалии                                                  ║
 * ║   • Predictive Alerts - предупреждения преди проблем                                          ║
 * ║   • Auto-Prevention - автоматично предотвратяване                                             ║
 * ║   • Learning Memory - учи се от историята                                                     ║
 * ║                                                                                               ║
 * ║   Created: 2026-01-02 | QAntum Empire                                                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { ModuleClassName, MODULE_CLASS_REGISTRY } from './ModuleClasses';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export type ThreatLevel = 'safe' | 'monitoring' | 'warning' | 'danger' | 'critical';

export interface SensorReading {
  timestamp: Date;
  latency: number;         // ms
  throughput: number;      // ops/sec
  errorRate: number;       // 0-1
  memoryPressure: number;  // 0-1
  cpuLoad: number;         // 0-1
  queueDepth: number;      // pending operations
}

export interface TrendAnalysis {
  direction: 'improving' | 'stable' | 'degrading';
  velocity: number;        // rate of change
  acceleration: number;    // change in rate
  predictedValue: number;  // where it's heading
  confidence: number;      // 0-1
  timeToThreshold: number; // seconds until problem
}

export interface Anomaly {
  timestamp: Date;
  metric: string;
  expected: number;
  actual: number;
  deviation: number;       // standard deviations
  severity: ThreatLevel;
}

export interface Prediction {
  timestamp: Date;
  cableId: string;
  threatLevel: ThreatLevel;
  predictedFailure: Date | null;
  confidence: number;
  factors: string[];
  recommendations: string[];
}

export interface CableTelemetry {
  id: string;
  from: ModuleClassName;
  to: ModuleClassName;
  readings: SensorReading[];
  trends: Map<string, TrendAnalysis>;
  anomalies: Anomaly[];
  predictions: Prediction[];
  healthScore: number;
  threatLevel: ThreatLevel;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════════

const THRESHOLDS = {
  latency: { warning: 50, danger: 100, critical: 200 },        // ms
  throughput: { warning: 100, danger: 50, critical: 10 },      // ops/sec (lower is worse)
  errorRate: { warning: 0.01, danger: 0.05, critical: 0.1 },   // 1%, 5%, 10%
  memoryPressure: { warning: 0.7, danger: 0.85, critical: 0.95 },
  cpuLoad: { warning: 0.7, danger: 0.85, critical: 0.95 },
  queueDepth: { warning: 100, danger: 500, critical: 1000 }
};

const ANOMALY_THRESHOLD = 2.5;  // standard deviations
const PREDICTION_WINDOW = 60;   // seconds to look ahead
const HISTORY_SIZE = 100;       // readings to keep

// ═══════════════════════════════════════════════════════════════════════════════
// STATISTICAL UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

class Statistics {
  static mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  static standardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const avg = this.mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  static movingAverage(values: number[], window: number): number {
    if (values.length === 0) return 0;
    const slice = values.slice(-window);
    return this.mean(slice);
  }

  static exponentialMovingAverage(values: number[], alpha: number = 0.3): number {
    if (values.length === 0) return 0;
    let ema = values[0];
    for (let i = 1; i < values.length; i++) {
      ema = alpha * values[i] + (1 - alpha) * ema;
    }
    return ema;
  }

  static linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 0, r2: 0 };

    const xMean = (n - 1) / 2;
    const yMean = this.mean(values);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Calculate R²
    let ssRes = 0;
    let ssTot = 0;
    for (let i = 0; i < n; i++) {
      const predicted = slope * i + intercept;
      ssRes += Math.pow(values[i] - predicted, 2);
      ssTot += Math.pow(values[i] - yMean, 2);
    }
    const r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

    return { slope, intercept, r2 };
  }

  static predict(values: number[], stepsAhead: number): number {
    const { slope, intercept } = this.linearRegression(values);
    return slope * (values.length + stepsAhead) + intercept;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTIVE SENSOR
// ═══════════════════════════════════════════════════════════════════════════════

class PredictiveSensor {
  private readings: SensorReading[] = [];
  private readonly maxHistory = HISTORY_SIZE;

  addReading(reading: SensorReading): void {
    this.readings.push(reading);
    if (this.readings.length > this.maxHistory) {
      this.readings.shift();
    }
  }

  getMetricHistory(metric: keyof SensorReading): number[] {
    return this.readings.map(r => r[metric] as number);
  }

  analyzeTrend(metric: keyof SensorReading): TrendAnalysis {
    const values = this.getMetricHistory(metric);
    
    if (values.length < 5) {
      return {
        direction: 'stable',
        velocity: 0,
        acceleration: 0,
        predictedValue: values[values.length - 1] || 0,
        confidence: 0,
        timeToThreshold: Infinity
      };
    }

    const { slope, r2 } = Statistics.linearRegression(values);
    const recentValues = values.slice(-10);
    const olderValues = values.slice(-20, -10);
    
    const recentSlope = Statistics.linearRegression(recentValues).slope;
    const olderSlope = olderValues.length > 5 ? Statistics.linearRegression(olderValues).slope : recentSlope;
    
    const acceleration = recentSlope - olderSlope;
    const predictedValue = Statistics.predict(values, PREDICTION_WINDOW);
    
    // Determine direction
    let direction: TrendAnalysis['direction'] = 'stable';
    if (Math.abs(slope) > 0.01) {
      // For metrics where higher is worse (latency, errorRate, etc.)
      if (metric === 'throughput') {
        direction = slope > 0 ? 'improving' : 'degrading';
      } else {
        direction = slope < 0 ? 'improving' : 'degrading';
      }
    }

    // Calculate time to threshold
    let timeToThreshold = Infinity;
    const thresholds = THRESHOLDS[metric as keyof typeof THRESHOLDS];
    if (thresholds && slope !== 0) {
      const currentValue = values[values.length - 1];
      const targetThreshold = metric === 'throughput' 
        ? thresholds.warning 
        : thresholds.warning;
      
      if ((metric === 'throughput' && slope < 0) || 
          (metric !== 'throughput' && slope > 0)) {
        timeToThreshold = Math.abs((targetThreshold - currentValue) / slope);
      }
    }

    return {
      direction,
      velocity: slope,
      acceleration,
      predictedValue,
      confidence: Math.abs(r2),
      timeToThreshold
    };
  }

  detectAnomalies(): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const metrics: (keyof SensorReading)[] = ['latency', 'throughput', 'errorRate', 'memoryPressure', 'cpuLoad'];

    for (const metric of metrics) {
      const values = this.getMetricHistory(metric);
      if (values.length < 10) continue;

      const mean = Statistics.mean(values.slice(0, -1));
      const std = Statistics.standardDeviation(values.slice(0, -1));
      const current = values[values.length - 1];

      if (std > 0) {
        const deviation = Math.abs(current - mean) / std;
        
        if (deviation > ANOMALY_THRESHOLD) {
          const severity = this.calculateSeverity(metric, current);
          anomalies.push({
            timestamp: new Date(),
            metric,
            expected: mean,
            actual: current,
            deviation,
            severity
          });
        }
      }
    }

    return anomalies;
  }

  private calculateSeverity(metric: string, value: number): ThreatLevel {
    const thresholds = THRESHOLDS[metric as keyof typeof THRESHOLDS];
    if (!thresholds) return 'monitoring';

    if (metric === 'throughput') {
      // Lower is worse for throughput
      if (value < thresholds.critical) return 'critical';
      if (value < thresholds.danger) return 'danger';
      if (value < thresholds.warning) return 'warning';
    } else {
      // Higher is worse for other metrics
      if (value > thresholds.critical) return 'critical';
      if (value > thresholds.danger) return 'danger';
      if (value > thresholds.warning) return 'warning';
    }

    return 'safe';
  }

  generatePrediction(cableId: string): Prediction {
    const trends = new Map<string, TrendAnalysis>();
    const metrics: (keyof SensorReading)[] = ['latency', 'throughput', 'errorRate', 'memoryPressure', 'cpuLoad'];
    
    let worstThreatLevel: ThreatLevel = 'safe';
    let shortestTimeToFailure = Infinity;
    const factors: string[] = [];
    const recommendations: string[] = [];

    for (const metric of metrics) {
      const trend = this.analyzeTrend(metric);
      trends.set(metric, trend);

      if (trend.direction === 'degrading') {
        const severity = this.calculateSeverity(metric, trend.predictedValue);
        
        if (this.compareThreatLevels(severity, worstThreatLevel) > 0) {
          worstThreatLevel = severity;
        }

        if (trend.timeToThreshold < shortestTimeToFailure) {
          shortestTimeToFailure = trend.timeToThreshold;
        }

        factors.push(`${metric} is degrading (${trend.velocity.toFixed(3)}/reading)`);

        // Generate recommendations
        switch (metric) {
          case 'latency':
            recommendations.push('Consider optimizing data serialization');
            recommendations.push('Check network congestion');
            break;
          case 'throughput':
            recommendations.push('Scale up processing capacity');
            recommendations.push('Implement request batching');
            break;
          case 'errorRate':
            recommendations.push('Review recent code changes');
            recommendations.push('Check external dependencies');
            break;
          case 'memoryPressure':
            recommendations.push('Implement garbage collection');
            recommendations.push('Review memory-intensive operations');
            break;
          case 'cpuLoad':
            recommendations.push('Optimize computation-heavy operations');
            recommendations.push('Consider horizontal scaling');
            break;
        }
      }
    }

    // Calculate confidence
    const confidence = Array.from(trends.values())
      .reduce((sum, t) => sum + t.confidence, 0) / trends.size;

    return {
      timestamp: new Date(),
      cableId,
      threatLevel: worstThreatLevel,
      predictedFailure: shortestTimeToFailure < Infinity 
        ? new Date(Date.now() + shortestTimeToFailure * 1000)
        : null,
      confidence,
      factors,
      recommendations: [...new Set(recommendations)]
    };
  }

  private compareThreatLevels(a: ThreatLevel, b: ThreatLevel): number {
    const order: ThreatLevel[] = ['safe', 'monitoring', 'warning', 'danger', 'critical'];
    return order.indexOf(a) - order.indexOf(b);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTIVE CABLE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export class PredictiveCableSystem extends EventEmitter {
  private cables: Map<string, CableTelemetry> = new Map();
  private sensors: Map<string, PredictiveSensor> = new Map();
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private memoryPath: string;
  private learningMemory: LearningMemory;

  constructor(dataPath: string = 'C:\\MisteMind\\data') {
    super();
    this.memoryPath = path.join(dataPath, 'predictive-memory.json');
    this.learningMemory = new LearningMemory(this.memoryPath);
    this.initializeCables();
  }

  private initializeCables(): void {
    // Define all cables based on class architecture
    const cableDefinitions = [
      // PHYSICS powers everything
      { from: 'PHYSICS' as ModuleClassName, to: 'OMEGA' as ModuleClassName },
      { from: 'PHYSICS' as ModuleClassName, to: 'INTELLIGENCE' as ModuleClassName },
      { from: 'PHYSICS' as ModuleClassName, to: 'BIOLOGY' as ModuleClassName },
      { from: 'PHYSICS' as ModuleClassName, to: 'FORTRESS' as ModuleClassName },
      
      // OMEGA commands
      { from: 'OMEGA' as ModuleClassName, to: 'GUARDIANS' as ModuleClassName },
      { from: 'OMEGA' as ModuleClassName, to: 'INTELLIGENCE' as ModuleClassName },
      { from: 'OMEGA' as ModuleClassName, to: 'REALITY' as ModuleClassName },
      
      // INTELLIGENCE analyzes
      { from: 'INTELLIGENCE' as ModuleClassName, to: 'GUARDIANS' as ModuleClassName },
      { from: 'INTELLIGENCE' as ModuleClassName, to: 'BIOLOGY' as ModuleClassName },
      { from: 'INTELLIGENCE' as ModuleClassName, to: 'OMEGA' as ModuleClassName },
      
      // FORTRESS protects
      { from: 'FORTRESS' as ModuleClassName, to: 'OMEGA' as ModuleClassName },
      { from: 'FORTRESS' as ModuleClassName, to: 'REALITY' as ModuleClassName },
      
      // BIOLOGY evolves
      { from: 'BIOLOGY' as ModuleClassName, to: 'INTELLIGENCE' as ModuleClassName },
      
      // GUARDIANS watch everything
      { from: 'GUARDIANS' as ModuleClassName, to: 'OMEGA' as ModuleClassName },
      { from: 'GUARDIANS' as ModuleClassName, to: 'INTELLIGENCE' as ModuleClassName },
      { from: 'GUARDIANS' as ModuleClassName, to: 'PHYSICS' as ModuleClassName },
      { from: 'GUARDIANS' as ModuleClassName, to: 'FORTRESS' as ModuleClassName },
      { from: 'GUARDIANS' as ModuleClassName, to: 'BIOLOGY' as ModuleClassName },
      { from: 'GUARDIANS' as ModuleClassName, to: 'REALITY' as ModuleClassName },
      
      // CHEMISTRY connects
      { from: 'CHEMISTRY' as ModuleClassName, to: 'INTELLIGENCE' as ModuleClassName },
      { from: 'CHEMISTRY' as ModuleClassName, to: 'OMEGA' as ModuleClassName },
      { from: 'CHEMISTRY' as ModuleClassName, to: 'REALITY' as ModuleClassName },
      
      // REALITY interfaces
      { from: 'REALITY' as ModuleClassName, to: 'INTELLIGENCE' as ModuleClassName },
      { from: 'REALITY' as ModuleClassName, to: 'FORTRESS' as ModuleClassName }
    ];

    for (const def of cableDefinitions) {
      const id = `${def.from}->${def.to}`;
      
      this.cables.set(id, {
        id,
        from: def.from,
        to: def.to,
        readings: [],
        trends: new Map(),
        anomalies: [],
        predictions: [],
        healthScore: 100,
        threatLevel: 'safe'
      });

      this.sensors.set(id, new PredictiveSensor());
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MONITORING
  // ═══════════════════════════════════════════════════════════════════════════

  startMonitoring(intervalMs: number = 1000): void {
    if (this.monitoringInterval) return;

    console.log('\n🔭 PREDICTIVE CABLE SYSTEM ACTIVATED');
    console.log('   "Виждаме проблема преди да се случи"\n');

    this.monitoringInterval = setInterval(() => {
      this.collectTelemetry();
      this.analyzeAndPredict();
    }, intervalMs);

    this.emit('monitoring:started');
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.learningMemory.save();
      this.emit('monitoring:stopped');
    }
  }

  private collectTelemetry(): void {
    for (const [id, cable] of this.cables) {
      const sensor = this.sensors.get(id)!;
      
      // Simulate realistic telemetry (in production, this would be real data)
      const reading = this.generateRealisticReading(cable);
      sensor.addReading(reading);
      
      cable.readings.push(reading);
      if (cable.readings.length > HISTORY_SIZE) {
        cable.readings.shift();
      }
    }
  }

  private generateRealisticReading(cable: CableTelemetry): SensorReading {
    // Get baseline from learning memory
    const baseline = this.learningMemory.getBaseline(cable.id);
    
    // Add realistic noise and trends
    const noise = () => (Math.random() - 0.5) * 0.1;
    
    return {
      timestamp: new Date(),
      latency: Math.max(0, baseline.latency * (1 + noise())),
      throughput: Math.max(1, baseline.throughput * (1 + noise())),
      errorRate: Math.max(0, Math.min(1, baseline.errorRate * (1 + noise() * 2))),
      memoryPressure: Math.max(0, Math.min(1, baseline.memoryPressure * (1 + noise()))),
      cpuLoad: Math.max(0, Math.min(1, baseline.cpuLoad * (1 + noise()))),
      queueDepth: Math.max(0, Math.round(baseline.queueDepth * (1 + noise())))
    };
  }

  private analyzeAndPredict(): void {
    for (const [id, cable] of this.cables) {
      const sensor = this.sensors.get(id)!;
      
      // Detect anomalies
      const newAnomalies = sensor.detectAnomalies();
      if (newAnomalies.length > 0) {
        cable.anomalies.push(...newAnomalies);
        
        for (const anomaly of newAnomalies) {
          this.emit('anomaly:detected', { cable: id, anomaly });
          this.handleAnomaly(cable, anomaly);
        }
      }

      // Generate prediction
      const prediction = sensor.generatePrediction(id);
      cable.predictions.push(prediction);
      
      // Keep only recent predictions
      if (cable.predictions.length > 10) {
        cable.predictions.shift();
      }

      // Update cable state
      cable.threatLevel = prediction.threatLevel;
      cable.healthScore = this.calculateHealthScore(prediction);

      // Handle threat levels
      if (prediction.threatLevel !== 'safe') {
        this.handleThreat(cable, prediction);
      }
    }
  }

  private calculateHealthScore(prediction: Prediction): number {
    const threatScores: Record<ThreatLevel, number> = {
      'safe': 100,
      'monitoring': 85,
      'warning': 65,
      'danger': 35,
      'critical': 10
    };
    return threatScores[prediction.threatLevel];
  }

  private handleAnomaly(cable: CableTelemetry, anomaly: Anomaly): void {
    console.log(`\n⚠️ ANOMALY DETECTED on ${cable.id}`);
    console.log(`   Metric: ${anomaly.metric}`);
    console.log(`   Expected: ${anomaly.expected.toFixed(2)}`);
    console.log(`   Actual: ${anomaly.actual.toFixed(2)}`);
    console.log(`   Deviation: ${anomaly.deviation.toFixed(1)}σ`);
    console.log(`   Severity: ${anomaly.severity}`);

    // Learn from anomaly
    this.learningMemory.recordAnomaly(cable.id, anomaly);
  }

  private handleThreat(cable: CableTelemetry, prediction: Prediction): void {
    const emoji: Record<ThreatLevel, string> = {
      'safe': '🟢',
      'monitoring': '🔵',
      'warning': '🟡',
      'danger': '🟠',
      'critical': '🔴'
    };

    console.log(`\n${emoji[prediction.threatLevel]} THREAT LEVEL: ${prediction.threatLevel.toUpperCase()} on ${cable.id}`);
    
    if (prediction.predictedFailure) {
      const timeUntil = (prediction.predictedFailure.getTime() - Date.now()) / 1000;
      console.log(`   ⏰ Predicted failure in: ${timeUntil.toFixed(0)} seconds`);
    }

    if (prediction.factors.length > 0) {
      console.log(`   📊 Factors:`);
      prediction.factors.forEach(f => console.log(`      • ${f}`));
    }

    if (prediction.recommendations.length > 0) {
      console.log(`   💡 Recommendations:`);
      prediction.recommendations.forEach(r => console.log(`      • ${r}`));
    }

    // Auto-prevention for critical threats
    if (prediction.threatLevel === 'critical') {
      this.autoPrevent(cable, prediction);
    }

    this.emit('threat:detected', { cable: cable.id, prediction });
  }

  private autoPrevent(cable: CableTelemetry, prediction: Prediction): void {
    console.log(`\n🛡️ AUTO-PREVENTION ACTIVATED for ${cable.id}`);
    
    // Take preventive action based on factors
    for (const factor of prediction.factors) {
      if (factor.includes('latency')) {
        console.log('   → Enabling request queuing');
      } else if (factor.includes('throughput')) {
        console.log('   → Activating load balancing');
      } else if (factor.includes('errorRate')) {
        console.log('   → Enabling circuit breaker');
      } else if (factor.includes('memory')) {
        console.log('   → Triggering garbage collection');
      } else if (factor.includes('cpu')) {
        console.log('   → Throttling non-essential operations');
      }
    }

    this.learningMemory.recordPrevention(cable.id, prediction);
    this.emit('prevention:activated', { cable: cable.id, prediction });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIMULATION (for testing)
  // ═══════════════════════════════════════════════════════════════════════════

  simulateDegradation(cableId: string, metric: keyof SensorReading, rate: number): void {
    const cable = this.cables.get(cableId);
    if (!cable) return;

    console.log(`\n🧪 SIMULATING DEGRADATION on ${cableId}`);
    console.log(`   Metric: ${metric}, Rate: ${rate}/reading`);

    // Modify the baseline to simulate degradation
    this.learningMemory.simulateDegradation(cableId, metric, rate);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTING
  // ═══════════════════════════════════════════════════════════════════════════

  getSystemStatus(): SystemStatus {
    const cables = Array.from(this.cables.values());
    
    const byThreatLevel: Record<ThreatLevel, number> = {
      'safe': 0,
      'monitoring': 0,
      'warning': 0,
      'danger': 0,
      'critical': 0
    };

    for (const cable of cables) {
      byThreatLevel[cable.threatLevel]++;
    }

    const avgHealth = cables.reduce((sum, c) => sum + c.healthScore, 0) / cables.length;

    return {
      timestamp: new Date(),
      totalCables: cables.length,
      byThreatLevel,
      averageHealth: avgHealth,
      activeAnomalies: cables.reduce((sum, c) => sum + c.anomalies.filter(a => a.severity !== 'safe').length, 0),
      predictedFailures: cables.filter(c => c.predictions.some(p => p.predictedFailure !== null)).length
    };
  }

  visualize(): string {
    const status = this.getSystemStatus();
    
    let output = '\n╔═══════════════════════════════════════════════════════════════════════════════╗\n';
    output += '║                    🔭 PREDICTIVE CABLE SYSTEM 🔭                               ║\n';
    output += '║                "Виждаме проблема преди да се случи"                            ║\n';
    output += '╠═══════════════════════════════════════════════════════════════════════════════╣\n';
    output += `║  Total Cables: ${status.totalCables.toString().padEnd(5)} │ Avg Health: ${status.averageHealth.toFixed(0).padEnd(3)}% │ Active Anomalies: ${status.activeAnomalies.toString().padEnd(3)} ║\n`;
    output += '╠═══════════════════════════════════════════════════════════════════════════════╣\n';
    output += `║  🟢 Safe: ${status.byThreatLevel.safe.toString().padEnd(3)} │ 🔵 Monitoring: ${status.byThreatLevel.monitoring.toString().padEnd(3)} │ 🟡 Warning: ${status.byThreatLevel.warning.toString().padEnd(3)}              ║\n`;
    output += `║  🟠 Danger: ${status.byThreatLevel.danger.toString().padEnd(3)} │ 🔴 Critical: ${status.byThreatLevel.critical.toString().padEnd(3)} │ ⏰ Predicted Failures: ${status.predictedFailures.toString().padEnd(3)}    ║\n`;
    output += '╠═══════════════════════════════════════════════════════════════════════════════╣\n';

    // Show cables with issues
    const issuesCables = Array.from(this.cables.values())
      .filter(c => c.threatLevel !== 'safe')
      .sort((a, b) => b.healthScore - a.healthScore);

    if (issuesCables.length > 0) {
      output += '║  CABLES REQUIRING ATTENTION:                                                  ║\n';
      for (const cable of issuesCables.slice(0, 5)) {
        const emoji = cable.threatLevel === 'critical' ? '🔴' : 
                      cable.threatLevel === 'danger' ? '🟠' :
                      cable.threatLevel === 'warning' ? '🟡' : '🔵';
        output += `║  ${emoji} ${cable.id.padEnd(30)} │ Health: ${cable.healthScore.toString().padEnd(3)}% │ ${cable.threatLevel.padEnd(10)} ║\n`;
      }
    } else {
      output += '║  ✅ ALL CABLES HEALTHY - No issues detected                                   ║\n';
    }

    output += '╚═══════════════════════════════════════════════════════════════════════════════╝\n';

    return output;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARNING MEMORY
// ═══════════════════════════════════════════════════════════════════════════════

class LearningMemory {
  private data: {
    baselines: Record<string, SensorReading>;
    anomalyPatterns: Array<{ cableId: string; anomaly: Anomaly; prevention?: string }>;
    preventions: Array<{ cableId: string; prediction: Prediction; timestamp: Date }>;
    degradationSims: Record<string, { metric: string; rate: number }>;
  };
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.data = this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      }
    } catch (e) { /* ignore */ }

    return {
      baselines: {},
      anomalyPatterns: [],
      preventions: [],
      degradationSims: {}
    };
  }

  save(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  getBaseline(cableId: string): SensorReading {
    if (this.data.baselines[cableId]) {
      const baseline = { ...this.data.baselines[cableId] };
      
      // Apply degradation simulation if active
      const sim = this.data.degradationSims[cableId];
      if (sim) {
        (baseline as any)[sim.metric] += sim.rate;
      }
      
      return baseline;
    }

    // Default baseline
    return {
      timestamp: new Date(),
      latency: 5 + Math.random() * 10,
      throughput: 500 + Math.random() * 200,
      errorRate: 0.001 + Math.random() * 0.005,
      memoryPressure: 0.3 + Math.random() * 0.2,
      cpuLoad: 0.2 + Math.random() * 0.2,
      queueDepth: Math.round(10 + Math.random() * 20)
    };
  }

  recordAnomaly(cableId: string, anomaly: Anomaly): void {
    this.data.anomalyPatterns.push({ cableId, anomaly });
    
    // Keep only last 1000
    if (this.data.anomalyPatterns.length > 1000) {
      this.data.anomalyPatterns = this.data.anomalyPatterns.slice(-1000);
    }
  }

  recordPrevention(cableId: string, prediction: Prediction): void {
    this.data.preventions.push({ cableId, prediction, timestamp: new Date() });
  }

  simulateDegradation(cableId: string, metric: string, rate: number): void {
    this.data.degradationSims[cableId] = { metric, rate };
  }

  clearDegradation(cableId: string): void {
    delete this.data.degradationSims[cableId];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface SystemStatus {
  timestamp: Date;
  totalCables: number;
  byThreatLevel: Record<ThreatLevel, number>;
  averageHealth: number;
  activeAnomalies: number;
  predictedFailures: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  const system = new PredictiveCableSystem();

  console.log('\n' + '═'.repeat(80));
  console.log('   🔭 PREDICTIVE CABLE SYSTEM - DEMONSTRATION');
  console.log('   "Не поправяме скъсан кабел. Виждаме го преди да се скъса."');
  console.log('═'.repeat(80) + '\n');

  // Start monitoring
  system.startMonitoring(500);

  // Show initial status
  setTimeout(() => {
    console.log(system.visualize());
  }, 2000);

  // Simulate degradation after 3 seconds
  setTimeout(() => {
    console.log('\n🧪 STARTING DEGRADATION SIMULATION...');
    system.simulateDegradation('PHYSICS->OMEGA', 'latency', 5);
  }, 3000);

  // Show status after degradation
  setTimeout(() => {
    console.log(system.visualize());
  }, 8000);

  // Stop after 10 seconds
  setTimeout(() => {
    system.stopMonitoring();
    console.log('\n✅ Demonstration complete');
    process.exit(0);
  }, 10000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { Statistics, PredictiveSensor, LearningMemory };
