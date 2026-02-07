/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: AI/ML INTEGRATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Smart selectors, anomaly detection, predictive healing, ML model training
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0-QANTUM-PRIME
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ElementFeatures {
  tagName: string;
  id: string;
  className: string;
  text: string;
  attributes: Record<string, string>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  xpath: string;
  cssSelector: string;
  depth: number;
  siblingIndex: number;
  parentTag: string;
  childCount: number;
  isVisible: boolean;
  isInteractive: boolean;
}

export interface SelectorPrediction {
  selector: string;
  confidence: number;
  strategy: 'id' | 'css' | 'xpath' | 'text' | 'role' | 'ai';
  fallbacks: string[];
}

export interface AnomalyResult {
  isAnomaly: boolean;
  score: number;
  reasons: string[];
  baseline: any;
  current: any;
}

export interface PredictionResult {
  willFail: boolean;
  probability: number;
  reasons: string[];
  suggestedAction: string;
}

export interface TrainingData {
  features: number[];
  label: number;
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMART SELECTOR AI
// ═══════════════════════════════════════════════════════════════════════════════

export class SmartSelectorAI extends EventEmitter {
  private model: SelectorModel;
  private selectorHistory: Map<string, SelectorHistory> = new Map();
  private learningRate: number = 0.1;

  constructor() {
    super();
    this.model = new SelectorModel();
  }

  /**
   * Find element with AI-powered selector
   */
  async findElement(page: any, description: string): Promise<{
    element: any;
    prediction: SelectorPrediction;
  }> {
    // Extract features from description
    const features = this.extractFeaturesFromDescription(description);
    
    // Generate candidate selectors
    const candidates = await this.generateCandidates(page, features);
    
    // Rank candidates using ML model
    const ranked = this.rankCandidates(candidates, features);
    
    // Try each candidate
    for (const candidate of ranked) {
      try {
        const element = await page.locator(candidate.selector).first();
        const isVisible = await element.isVisible();
        
        if (isVisible) {
          // Record success
          this.recordSuccess(description, candidate);
          
          return {
            element,
            prediction: candidate
          };
        }
      } catch {
        // Selector failed, try next
      }
    }

    throw new Error(`Could not find element matching: ${description}`);
  }

  /**
   * Learn from selector success/failure
   */
  learn(description: string, selector: string, success: boolean): void {
    const key = this.hashDescription(description);
    
    if (!this.selectorHistory.has(key)) {
      this.selectorHistory.set(key, {
        description,
        attempts: [],
        successfulSelectors: []
      });
    }

    const history = this.selectorHistory.get(key)!;
    history.attempts.push({ selector, success, timestamp: Date.now() });

    if (success) {
      if (!history.successfulSelectors.includes(selector)) {
        history.successfulSelectors.push(selector);
      }
    }

    // Update model weights
    this.model.updateWeights(this.extractSelectorFeatures(selector), success);
    
    this.emit('learned', { description, selector, success });
  }

  /**
   * Suggest best selector for element
   */
  async suggestSelector(page: any, element: any): Promise<SelectorPrediction[]> {
    const features = await this.extractElementFeatures(page, element);
    const suggestions: SelectorPrediction[] = [];

    // ID-based selector (highest priority)
    if (features.id) {
      suggestions.push({
        selector: `#${features.id}`,
        confidence: 0.95,
        strategy: 'id',
        fallbacks: []
      });
    }

    // Data-testid selector
    if (features.attributes['data-testid']) {
      suggestions.push({
        selector: `[data-testid="${features.attributes['data-testid']}"]`,
        confidence: 0.9,
        strategy: 'css',
        fallbacks: []
      });
    }

    // Role-based selector
    if (features.attributes['role']) {
      const roleSelector = `[role="${features.attributes['role']}"]`;
      suggestions.push({
        selector: roleSelector,
        confidence: 0.7,
        strategy: 'role',
        fallbacks: [features.cssSelector]
      });
    }

    // Text-based selector
    if (features.text && features.text.length < 50) {
      suggestions.push({
        selector: `text="${features.text}"`,
        confidence: 0.6,
        strategy: 'text',
        fallbacks: [features.xpath]
      });
    }

    // AI-generated selector
    const aiSelector = this.model.predictSelector(features);
    suggestions.push({
      selector: aiSelector.selector,
      confidence: aiSelector.confidence,
      strategy: 'ai',
      fallbacks: [features.xpath, features.cssSelector]
    });

    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private extractFeaturesFromDescription(description: string): Record<string, any> {
    const features: Record<string, any> = {
      hasId: /id|#/.test(description),
      hasClass: /class|\./.test(description),
      hasText: /text|label|button|link/i.test(description),
      hasRole: /role|aria/i.test(description),
      isButton: /button|btn|submit/i.test(description),
      isInput: /input|field|text|email|password/i.test(description),
      isLink: /link|anchor|href/i.test(description),
      words: description.toLowerCase().split(/\s+/)
    };

    return features;
  }

  private async generateCandidates(page: any, features: Record<string, any>): Promise<SelectorPrediction[]> {
    const candidates: SelectorPrediction[] = [];

    // Generate based on features
    for (const word of features.words) {
      candidates.push(
        { selector: `#${word}`, confidence: 0.5, strategy: 'id', fallbacks: [] },
        { selector: `.${word}`, confidence: 0.4, strategy: 'css', fallbacks: [] },
        { selector: `[data-testid="${word}"]`, confidence: 0.6, strategy: 'css', fallbacks: [] },
        { selector: `text="${word}"`, confidence: 0.3, strategy: 'text', fallbacks: [] }
      );
    }

    if (features.isButton) {
      candidates.push(
        { selector: 'button', confidence: 0.3, strategy: 'css', fallbacks: [] },
        { selector: '[type="submit"]', confidence: 0.4, strategy: 'css', fallbacks: [] }
      );
    }

    return candidates;
  }

  private rankCandidates(candidates: SelectorPrediction[], features: Record<string, any>): SelectorPrediction[] {
    return candidates
      .map(c => ({
        ...c,
        confidence: this.model.predictConfidence(c.selector, features)
      }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  private async extractElementFeatures(page: any, element: any): Promise<ElementFeatures> {
    return page.evaluate((el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(el);

      return {
        tagName: el.tagName.toLowerCase(),
        id: el.id,
        className: el.className,
        text: el.textContent?.trim().slice(0, 100) || '',
        attributes: Object.fromEntries(
          Array.from(el.attributes).map(a => [a.name, a.value])
        ),
        position: { x: rect.x, y: rect.y },
        size: { width: rect.width, height: rect.height },
        xpath: '',  // Would compute XPath
        cssSelector: '',  // Would compute CSS selector
        depth: 0,  // Would compute DOM depth
        siblingIndex: Array.from(el.parentElement?.children || []).indexOf(el),
        parentTag: el.parentElement?.tagName.toLowerCase() || '',
        childCount: el.children.length,
        isVisible: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden',
        isInteractive: ['button', 'a', 'input', 'select', 'textarea'].includes(el.tagName.toLowerCase())
      };
    }, element);
  }

  private extractSelectorFeatures(selector: string): number[] {
    return [
      selector.startsWith('#') ? 1 : 0,
      selector.startsWith('.') ? 1 : 0,
      selector.includes('[') ? 1 : 0,
      selector.includes('text=') ? 1 : 0,
      selector.includes('role=') ? 1 : 0,
      selector.length / 100,
      (selector.match(/\s/g) || []).length / 10
    ];
  }

  private hashDescription(description: string): string {
    return description.toLowerCase().replace(/\s+/g, '-');
  }

  private recordSuccess(description: string, prediction: SelectorPrediction): void {
    this.learn(description, prediction.selector, true);
  }
}

interface SelectorHistory {
  description: string;
  attempts: Array<{ selector: string; success: boolean; timestamp: number }>;
  successfulSelectors: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELECTOR MODEL (Simple Neural Network Simulation)
// ═══════════════════════════════════════════════════════════════════════════════

class SelectorModel {
  private weights: number[] = [0.3, 0.3, 0.2, 0.1, 0.1, 0.5, 0.3];
  private bias: number = 0.5;
  private learningRate: number = 0.01;

  predict(features: number[]): number {
    let sum = this.bias;
    for (let i = 0; i < features.length && i < this.weights.length; i++) {
      sum += features[i] * this.weights[i];
    }
    return this.sigmoid(sum);
  }

  predictConfidence(selector: string, features: Record<string, any>): number {
    const selectorFeatures = this.extractFeatures(selector, features);
    return this.predict(selectorFeatures);
  }

  predictSelector(elementFeatures: ElementFeatures): { selector: string; confidence: number } {
    const candidates = this.generateSelectors(elementFeatures);
    let best = { selector: '', confidence: 0 };

    for (const selector of candidates) {
      const conf = this.predictConfidence(selector, elementFeatures as any);
      if (conf > best.confidence) {
        best = { selector, confidence: conf };
      }
    }

    return best;
  }

  updateWeights(features: number[], success: boolean): void {
    const target = success ? 1 : 0;
    const prediction = this.predict(features);
    const error = target - prediction;

    for (let i = 0; i < this.weights.length && i < features.length; i++) {
      this.weights[i] += this.learningRate * error * features[i];
    }
    this.bias += this.learningRate * error;
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  private extractFeatures(selector: string, ctx: Record<string, any>): number[] {
    return [
      selector.startsWith('#') ? 1 : 0,
      selector.startsWith('.') ? 1 : 0,
      selector.includes('[data-') ? 1 : 0,
      selector.includes('text=') ? 1 : 0,
      ctx.hasId ? 0.5 : 0,
      ctx.isButton ? 0.3 : 0,
      Math.min(selector.length / 50, 1)
    ];
  }

  private generateSelectors(features: ElementFeatures): string[] {
    const selectors: string[] = [];

    if (features.id) selectors.push(`#${features.id}`);
    if (features.className) {
      const classes = features.className.split(' ').filter(Boolean);
      for (const cls of classes.slice(0, 3)) {
        selectors.push(`.${cls}`);
      }
    }
    if (features.attributes['data-testid']) {
      selectors.push(`[data-testid="${features.attributes['data-testid']}"]`);
    }
    if (features.text) {
      selectors.push(`text="${features.text.slice(0, 30)}"`);
    }

    return selectors;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANOMALY DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

export class AnomalyDetector extends EventEmitter {
  private baselines: Map<string, BaselineData> = new Map();
  private threshold: number;

  constructor(threshold: number = 2.0) {
    super();
    this.threshold = threshold;  // Standard deviations
  }

  /**
   * Record baseline data
   */
  recordBaseline(key: string, value: number): void {
    if (!this.baselines.has(key)) {
      this.baselines.set(key, {
        values: [],
        mean: 0,
        stdDev: 0,
        min: Infinity,
        max: -Infinity
      });
    }

    const baseline = this.baselines.get(key)!;
    baseline.values.push(value);
    baseline.min = Math.min(baseline.min, value);
    baseline.max = Math.max(baseline.max, value);

    // Update statistics
    this.updateStatistics(baseline);
  }

  /**
   * Detect anomaly
   */
  detect(key: string, value: number): AnomalyResult {
    const baseline = this.baselines.get(key);

    if (!baseline || baseline.values.length < 5) {
      return {
        isAnomaly: false,
        score: 0,
        reasons: ['Insufficient baseline data'],
        baseline: null,
        current: value
      };
    }

    const zScore = Math.abs((value - baseline.mean) / (baseline.stdDev || 1));
    const isAnomaly = zScore > this.threshold;

    const reasons: string[] = [];
    if (value > baseline.max * 1.5) {
      reasons.push(`Value ${value} is 50%+ above historical max ${baseline.max}`);
    }
    if (value < baseline.min * 0.5) {
      reasons.push(`Value ${value} is 50%+ below historical min ${baseline.min}`);
    }
    if (zScore > this.threshold) {
      reasons.push(`Z-score ${zScore.toFixed(2)} exceeds threshold ${this.threshold}`);
    }

    const result: AnomalyResult = {
      isAnomaly,
      score: zScore,
      reasons,
      baseline: {
        mean: baseline.mean,
        stdDev: baseline.stdDev,
        min: baseline.min,
        max: baseline.max
      },
      current: value
    };

    if (isAnomaly) {
      this.emit('anomaly', { key, ...result });
    }

    return result;
  }

  /**
   * Detect multiple metrics
   */
  detectMultiple(metrics: Record<string, number>): Map<string, AnomalyResult> {
    const results = new Map<string, AnomalyResult>();

    for (const [key, value] of Object.entries(metrics)) {
      results.set(key, this.detect(key, value));
    }

    return results;
  }

  /**
   * Export baselines
   */
  exportBaselines(): Record<string, BaselineData> {
    const exported: Record<string, BaselineData> = {};
    for (const [key, value] of this.baselines) {
      exported[key] = { ...value };
    }
    return exported;
  }

  /**
   * Import baselines
   */
  importBaselines(data: Record<string, BaselineData>): void {
    for (const [key, value] of Object.entries(data)) {
      this.baselines.set(key, value);
    }
  }

  private updateStatistics(baseline: BaselineData): void {
    const n = baseline.values.length;
    baseline.mean = baseline.values.reduce((a, b) => a + b, 0) / n;
    
    const variance = baseline.values.reduce((sum, val) => 
      sum + Math.pow(val - baseline.mean, 2), 0
    ) / n;
    
    baseline.stdDev = Math.sqrt(variance);
  }
}

interface BaselineData {
  values: number[];
  mean: number;
  stdDev: number;
  min: number;
  max: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTIVE HEALING
// ═══════════════════════════════════════════════════════════════════════════════

export class PredictiveHealing extends EventEmitter {
  private failurePatterns: FailurePattern[] = [];
  private elementHealth: Map<string, ElementHealth> = new Map();

  /**
   * Record element interaction
   */
  recordInteraction(selector: string, success: boolean, context: Record<string, any>): void {
    if (!this.elementHealth.has(selector)) {
      this.elementHealth.set(selector, {
        selector,
        totalAttempts: 0,
        failures: 0,
        lastSuccess: null,
        lastFailure: null,
        contexts: []
      });
    }

    const health = this.elementHealth.get(selector)!;
    health.totalAttempts++;
    
    if (success) {
      health.lastSuccess = new Date();
    } else {
      health.failures++;
      health.lastFailure = new Date();
      health.contexts.push(context);

      // Learn failure pattern
      this.learnFailurePattern(selector, context);
    }
  }

  /**
   * Predict if selector will fail
   */
  predict(selector: string, context: Record<string, any>): PredictionResult {
    const health = this.elementHealth.get(selector);
    
    if (!health) {
      return {
        willFail: false,
        probability: 0,
        reasons: ['No historical data'],
        suggestedAction: 'proceed'
      };
    }

    const failureRate = health.failures / health.totalAttempts;
    const matchingPatterns = this.findMatchingPatterns(selector, context);
    
    let probability = failureRate;
    const reasons: string[] = [];

    // Increase probability based on patterns
    for (const pattern of matchingPatterns) {
      probability = Math.min(0.95, probability + pattern.weight * 0.2);
      reasons.push(pattern.description);
    }

    // Check recent failures
    if (health.lastFailure) {
      const timeSinceFailure = Date.now() - health.lastFailure.getTime();
      if (timeSinceFailure < 60000) {  // Within last minute
        probability = Math.min(0.95, probability + 0.2);
        reasons.push('Recent failure detected');
      }
    }

    const willFail = probability > 0.5;
    let suggestedAction = 'proceed';

    if (willFail) {
      if (probability > 0.8) {
        suggestedAction = 'use-fallback';
      } else {
        suggestedAction = 'add-retry';
      }
    }

    return {
      willFail,
      probability,
      reasons,
      suggestedAction
    };
  }

  /**
   * Get healing suggestions
   */
  getHealingSuggestions(selector: string): string[] {
    const suggestions: string[] = [];
    const health = this.elementHealth.get(selector);

    if (!health) return suggestions;

    // Analyze failure contexts
    const contextPatterns = this.analyzeContexts(health.contexts);

    if (contextPatterns.timingIssues) {
      suggestions.push('Add explicit wait before interaction');
    }
    if (contextPatterns.visibilityIssues) {
      suggestions.push('Check element visibility before action');
    }
    if (contextPatterns.staleElement) {
      suggestions.push('Re-locate element before each interaction');
    }
    if (contextPatterns.overlappingElements) {
      suggestions.push('Scroll element into view or use force click');
    }

    return suggestions;
  }

  private learnFailurePattern(selector: string, context: Record<string, any>): void {
    // Create pattern from context
    const pattern: FailurePattern = {
      selector,
      conditions: context,
      weight: 1,
      occurrences: 1,
      description: this.describePattern(context)
    };

    // Check if similar pattern exists
    const existing = this.failurePatterns.find(p => 
      p.selector === selector && this.matchesConditions(p.conditions, context)
    );

    if (existing) {
      existing.occurrences++;
      existing.weight = Math.min(1, existing.weight + 0.1);
    } else {
      this.failurePatterns.push(pattern);
    }
  }

  private findMatchingPatterns(selector: string, context: Record<string, any>): FailurePattern[] {
    return this.failurePatterns.filter(p =>
      (p.selector === selector || p.selector === '*') &&
      this.matchesConditions(p.conditions, context)
    );
  }

  private matchesConditions(pattern: Record<string, any>, context: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(pattern)) {
      if (context[key] !== value) return false;
    }
    return true;
  }

  private describePattern(context: Record<string, any>): string {
    const parts: string[] = [];
    
    if (context.error) parts.push(`Error: ${context.error}`);
    if (context.viewport) parts.push(`Viewport: ${context.viewport}`);
    if (context.timing) parts.push(`Timing issue detected`);

    return parts.join(', ') || 'Unknown pattern';
  }

  private analyzeContexts(contexts: Record<string, any>[]): Record<string, boolean> {
    return {
      timingIssues: contexts.some(c => c.error?.includes('timeout')),
      visibilityIssues: contexts.some(c => c.error?.includes('visible')),
      staleElement: contexts.some(c => c.error?.includes('stale')),
      overlappingElements: contexts.some(c => c.error?.includes('intercept'))
    };
  }
}

interface FailurePattern {
  selector: string;
  conditions: Record<string, any>;
  weight: number;
  occurrences: number;
  description: string;
}

interface ElementHealth {
  selector: string;
  totalAttempts: number;
  failures: number;
  lastSuccess: Date | null;
  lastFailure: Date | null;
  contexts: Record<string, any>[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ML MODEL TRAINER
// ═══════════════════════════════════════════════════════════════════════════════

export class MLModelTrainer extends EventEmitter {
  private trainingData: TrainingData[] = [];
  private model: SimpleNeuralNetwork;

  constructor() {
    super();
    this.model = new SimpleNeuralNetwork([10, 8, 4, 1]);
  }

  /**
   * Add training sample
   */
  addSample(features: number[], label: number, metadata?: Record<string, any>): void {
    this.trainingData.push({ features, label, metadata });
  }

  /**
   * Train model
   */
  train(epochs: number = 100, learningRate: number = 0.01): TrainingResult {
    const startTime = Date.now();
    const losses: number[] = [];

    for (let epoch = 0; epoch < epochs; epoch++) {
      let epochLoss = 0;

      for (const sample of this.trainingData) {
        const output = this.model.forward(sample.features);
        const loss = this.model.backward(sample.label, learningRate);
        epochLoss += loss;
      }

      epochLoss /= this.trainingData.length;
      losses.push(epochLoss);

      if (epoch % 10 === 0) {
        this.emit('progress', { epoch, loss: epochLoss });
      }
    }

    return {
      epochs,
      finalLoss: losses[losses.length - 1],
      duration: Date.now() - startTime,
      samplesUsed: this.trainingData.length
    };
  }

  /**
   * Predict
   */
  predict(features: number[]): number {
    return this.model.forward(features);
  }

  /**
   * Save model
   */
  saveModel(filePath: string): void {
    const modelData = this.model.export();
    fs.writeFileSync(filePath, JSON.stringify(modelData, null, 2));
  }

  /**
   * Load model
   */
  loadModel(filePath: string): void {
    const modelData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    this.model.import(modelData);
  }

  /**
   * Export training data
   */
  exportTrainingData(filePath: string): void {
    fs.writeFileSync(filePath, JSON.stringify(this.trainingData, null, 2));
  }

  /**
   * Import training data
   */
  importTrainingData(filePath: string): void {
    this.trainingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
}

interface TrainingResult {
  epochs: number;
  finalLoss: number;
  duration: number;
  samplesUsed: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLE NEURAL NETWORK
// ═══════════════════════════════════════════════════════════════════════════════

class SimpleNeuralNetwork {
  private layers: number[];
  private weights: number[][][];
  private biases: number[][];
  private activations: number[][];

  constructor(layers: number[]) {
    this.layers = layers;
    this.weights = [];
    this.biases = [];
    this.activations = [];

    // Initialize weights and biases
    for (let i = 0; i < layers.length - 1; i++) {
      const w: number[][] = [];
      for (let j = 0; j < layers[i + 1]; j++) {
        const row: number[] = [];
        for (let k = 0; k < layers[i]; k++) {
          row.push((Math.random() - 0.5) * 2);
        }
        w.push(row);
      }
      this.weights.push(w);

      const b: number[] = [];
      for (let j = 0; j < layers[i + 1]; j++) {
        b.push(0);
      }
      this.biases.push(b);
    }
  }

  forward(input: number[]): number {
    this.activations = [input];
    let current = input;

    for (let i = 0; i < this.weights.length; i++) {
      const next: number[] = [];
      
      for (let j = 0; j < this.weights[i].length; j++) {
        let sum = this.biases[i][j];
        for (let k = 0; k < current.length; k++) {
          sum += current[k] * this.weights[i][j][k];
        }
        next.push(this.sigmoid(sum));
      }
      
      current = next;
      this.activations.push(current);
    }

    return current[0];
  }

  backward(target: number, learningRate: number): number {
    const output = this.activations[this.activations.length - 1][0];
    const error = target - output;
    const loss = error * error;

    // Simple gradient descent (simplified backprop)
    let delta = [error * this.sigmoidDerivative(output)];

    for (let i = this.weights.length - 1; i >= 0; i--) {
      const newDelta: number[] = [];
      
      for (let j = 0; j < this.weights[i].length; j++) {
        for (let k = 0; k < this.weights[i][j].length; k++) {
          this.weights[i][j][k] += learningRate * delta[j] * this.activations[i][k];
        }
        this.biases[i][j] += learningRate * delta[j];
      }

      if (i > 0) {
        for (let k = 0; k < this.activations[i].length; k++) {
          let sum = 0;
          for (let j = 0; j < delta.length; j++) {
            sum += delta[j] * (this.weights[i][j]?.[k] || 0);
          }
          newDelta.push(sum * this.sigmoidDerivative(this.activations[i][k]));
        }
        delta = newDelta;
      }
    }

    return loss;
  }

  export(): any {
    return {
      layers: this.layers,
      weights: this.weights,
      biases: this.biases
    };
  }

  import(data: any): void {
    this.layers = data.layers;
    this.weights = data.weights;
    this.biases = data.biases;
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }

  private sigmoidDerivative(x: number): number {
    return x * (1 - x);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export function createSmartSelectorAI(): SmartSelectorAI {
  return new SmartSelectorAI();
}

export function createAnomalyDetector(threshold?: number): AnomalyDetector {
  return new AnomalyDetector(threshold);
}

export function createPredictiveHealing(): PredictiveHealing {
  return new PredictiveHealing();
}

export function createMLTrainer(): MLModelTrainer {
  return new MLModelTrainer();
}

export default {
  SmartSelectorAI,
  AnomalyDetector,
  PredictiveHealing,
  MLModelTrainer,
  createSmartSelectorAI,
  createAnomalyDetector,
  createPredictiveHealing,
  createMLTrainer
};
