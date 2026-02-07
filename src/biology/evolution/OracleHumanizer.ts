/**
 * OracleHumanizer.ts - "The Learning God"
 * 
 * QAntum Framework v1.9.5 - "The Hybrid Bridge"
 * 
 * The Oracle analyzes human operator actions during Manual Override sessions
 * and converts them into Neural Weights for bot behavior improvement.
 * 
 * When Dimitar takes control of a Ghost Worker:
 * 1. Every mouse movement is recorded
 * 2. Every keystroke pattern is analyzed
 * 3. Every decision timing is measured
 * 4. The Oracle learns and propagates the patterns to ALL workers
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                     ORACLE HUMANIZER                                    │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                          │
 * │   HUMAN SESSION                    NEURAL EXTRACTION                     │
 * │   ─────────────                    ──────────────────                    │
 * │                                                                          │
 * │   ┌──────────────┐                ┌──────────────────┐                  │
 * │   │  Dimitar's   │  ───────────►  │ Pattern Analysis │                  │
 * │   │   Actions    │                │                  │                  │
 * │   └──────────────┘                └────────┬─────────┘                  │
 * │                                            │                             │
 * │   Mouse Movements ─────────────────────────┤                             │
 * │   Typing Patterns ─────────────────────────┤                             │
 * │   Decision Timing ─────────────────────────┤                             │
 * │   Click Precision ─────────────────────────┤                             │
 * │   Scroll Behavior ─────────────────────────┤                             │
 * │                                            ▼                             │
 * │                                 ┌──────────────────┐                    │
 * │                                 │  Neural Weights  │                    │
 * │                                 │   Generation     │                    │
 * │                                 └────────┬─────────┘                    │
 * │                                          │                              │
 * │   ┌─────────────────────────────────────┴───────────────────────────┐  │
 * │   │                    SWARM PROPAGATION                             │  │
 * │   │                                                                  │  │
 * │   │   Worker 1    Worker 2    Worker 3    Worker N                  │  │
 * │   │      ▼           ▼           ▼           ▼                      │  │
 * │   │   [Update]    [Update]    [Update]    [Update]                  │  │
 * │   │                                                                  │  │
 * │   │   "Now ALL workers move exactly like Dimitar"                   │  │
 * │   │                                                                  │  │
 * │   └──────────────────────────────────────────────────────────────────┘  │
 * │                                                                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * MARKET VALUE: +$280,000 (Human-in-the-Loop AI Training)
 * 
 * @module biology/evolution/OracleHumanizer
 * @version 1.0.0
 * @enterprise true
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { ManualInput, HumanPatterns } from '../../physics/HardwareBridge';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Typing analysis result
 */
export interface TypingAnalysis {
  // Speed
  averageSpeed: number;           // chars/second
  peakSpeed: number;
  minSpeed: number;
  
  // Rhythm
  interKeyDelays: number[];       // ms between keys
  averageDelay: number;
  rhythmConsistency: number;      // 0-1
  
  // Patterns
  burstTyping: boolean;           // Types in bursts
  thoughtfulPauses: number;       // Long pauses for thinking
  
  // Errors
  errorRate: number;              // Estimated from backspaces
  correctionSpeed: number;        // How fast errors are corrected
}

/**
 * Mouse analysis result
 */
export interface MouseAnalysis {
  // Movement
  averageSpeed: number;           // pixels/second
  peakSpeed: number;
  acceleration: number;           // Average acceleration
  
  // Jitter
  jitterMagnitude: number;        // Standard deviation
  jitterFrequency: number;        // Oscillations per second
  
  // Curves
  curveNaturalness: number;       // 0-1 (Bezier fit quality)
  pathEfficiency: number;         // Direct vs actual distance
  overshootFrequency: number;     // Missed targets
  
  // Clicking
  clickPrecision: number;         // Distance from target center
  doubleClickSpeed: number;       // ms between double clicks
  holdDuration: number;           // Average click hold time
}

/**
 * Decision analysis result
 */
export interface DecisionAnalysis {
  // Timing
  averageDecisionTime: number;    // ms to make choices
  quickDecisions: number;         // < 500ms
  thoughtfulDecisions: number;    // > 2000ms
  
  // Patterns
  explorationStyle: 'focused' | 'exploratory' | 'random';
  confidenceLevel: number;        // 0-1
  hesitationFrequency: number;    // Pauses before action
  
  // Learning
  improvementRate: number;        // Gets faster over time
  adaptability: number;           // Handles new situations
}

/**
 * Neural weight set
 */
export interface NeuralWeights {
  weightId: string;
  version: number;
  createdAt: Date;
  
  // Source
  sourceSessionId: string;
  sourceOperator: string;
  actionsAnalyzed: number;
  
  // Weights
  typing: {
    baseDelay: number;            // ms between keystrokes
    delayVariance: number;        // Random variance
    burstProbability: number;     // Chance of burst typing
    pauseProbability: number;     // Chance of thinking pause
    pauseDuration: [number, number]; // [min, max] pause ms
  };
  
  mouse: {
    baseSpeed: number;            // pixels/second
    speedVariance: number;
    jitterAmount: number;         // Standard deviation
    curveIntensity: number;       // 0-1 bezier curve amount
    overshootChance: number;      // Chance of overshooting
    overshootDistance: number;    // pixels
  };
  
  timing: {
    baseActionDelay: number;      // ms between actions
    delayVariance: number;
    hesitationChance: number;
    hesitationDuration: [number, number];
  };
  
  behavior: {
    explorationFactor: number;    // 0-1 (1 = very exploratory)
    confidenceFactor: number;     // 0-1
    adaptabilityFactor: number;   // 0-1
  };
  
  // Confidence
  confidenceScore: number;        // 0-1 (quality of training data)
}

/**
 * Learning session
 */
export interface LearningSession {
  sessionId: string;
  operatorId: string;
  operatorName: string;
  
  // Timing
  startedAt: Date;
  endedAt?: Date;
  duration: number;               // seconds
  
  // Data
  actions: ManualInput[];
  
  // Analysis
  typingAnalysis?: TypingAnalysis;
  mouseAnalysis?: MouseAnalysis;
  decisionAnalysis?: DecisionAnalysis;
  
  // Output
  generatedWeights?: NeuralWeights;
  propagated: boolean;
}

/**
 * Oracle configuration
 */
export interface OracleHumanizerConfig {
  // Analysis
  minActionsForAnalysis: number;
  minSessionDuration: number;     // seconds
  
  // Weights
  weightSmoothingFactor: number;  // How much to blend with existing
  minConfidenceThreshold: number; // Minimum confidence to accept
  
  // Propagation
  autoPropagateWeights: boolean;
  propagationDelay: number;       // ms to wait before propagating
  
  // Storage
  maxStoredSessions: number;
  maxStoredWeights: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: OracleHumanizerConfig = {
  minActionsForAnalysis: 10,
  minSessionDuration: 30,
  
  weightSmoothingFactor: 0.3,
  minConfidenceThreshold: 0.5,
  
  autoPropagateWeights: true,
  propagationDelay: 1000,
  
  maxStoredSessions: 100,
  maxStoredWeights: 50
};

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT NEURAL WEIGHTS (Human-like baseline)
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_WEIGHTS: Omit<NeuralWeights, 'weightId' | 'version' | 'createdAt' | 'sourceSessionId' | 'sourceOperator' | 'actionsAnalyzed' | 'confidenceScore'> = {
  typing: {
    baseDelay: 100,
    delayVariance: 30,
    burstProbability: 0.2,
    pauseProbability: 0.1,
    pauseDuration: [500, 2000]
  },
  mouse: {
    baseSpeed: 400,
    speedVariance: 100,
    jitterAmount: 2,
    curveIntensity: 0.7,
    overshootChance: 0.05,
    overshootDistance: 5
  },
  timing: {
    baseActionDelay: 500,
    delayVariance: 200,
    hesitationChance: 0.15,
    hesitationDuration: [300, 1500]
  },
  behavior: {
    explorationFactor: 0.3,
    confidenceFactor: 0.8,
    adaptabilityFactor: 0.6
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ORACLE HUMANIZER ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * OracleHumanizer - Human Behavior Learning
 * 
 * Analyzes human operator actions and generates neural weights
 * for bot behavior improvement.
 */
export class OracleHumanizer extends EventEmitter {
  private config: OracleHumanizerConfig;
  
  // Sessions
  private activeSessions: Map<string, LearningSession> = new Map();
  private completedSessions: LearningSession[] = [];
  
  // Weights
  private currentWeights: NeuralWeights;
  private weightHistory: NeuralWeights[] = [];
  private weightVersion: number = 1;
  
  // Stats
  private totalActionsAnalyzed: number = 0;
  private totalSessionsCompleted: number = 0;
  private totalWeightsGenerated: number = 0;
  
  constructor(config: Partial<OracleHumanizerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize with default weights
    this.currentWeights = this.createDefaultWeights();
    
    this.emit('initialized', {
      timestamp: new Date(),
      initialWeights: this.currentWeights
    });
    
    this.log('info', '[ORACLE] Oracle Humanizer initialized');
    this.log('info', '[ORACLE] Ready to learn from Architect Dimitar');
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Start a learning session
   */
  startSession(operatorId: string, operatorName: string = 'Architect'): LearningSession {
    const session: LearningSession = {
      sessionId: this.generateId('learn'),
      operatorId,
      operatorName,
      startedAt: new Date(),
      duration: 0,
      actions: [],
      propagated: false
    };
    
    this.activeSessions.set(session.sessionId, session);
    
    this.emit('session:started', {
      sessionId: session.sessionId,
      operatorName
    });
    
    this.log('info', `[ORACLE] Learning session started for ${operatorName}`);
    
    return session;
  }
  
  /**
   * Record action in session
   */
  recordAction(sessionId: string, action: ManualInput): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      this.log('warn', `[ORACLE] Session ${sessionId} not found`);
      return;
    }
    
    session.actions.push(action);
    session.duration = (Date.now() - session.startedAt.getTime()) / 1000;
    
    // Emit for real-time analysis visualization
    this.emit('action:recorded', {
      sessionId,
      action: action.action,
      timestamp: action.timestamp
    });
  }
  
  /**
   * End learning session and generate weights
   */
  async endSession(sessionId: string): Promise<NeuralWeights | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }
    
    session.endedAt = new Date();
    session.duration = (session.endedAt.getTime() - session.startedAt.getTime()) / 1000;
    
    this.activeSessions.delete(sessionId);
    
    // Check if enough data
    if (session.actions.length < this.config.minActionsForAnalysis) {
      this.log('warn', `[ORACLE] Session too short (${session.actions.length} actions), skipping analysis`);
      return null;
    }
    
    if (session.duration < this.config.minSessionDuration) {
      this.log('warn', `[ORACLE] Session too brief (${session.duration.toFixed(1)}s), skipping analysis`);
      return null;
    }
    
    // Analyze session
    this.log('info', `[ORACLE] Analyzing ${session.actions.length} actions from ${session.operatorName}...`);
    
    session.typingAnalysis = this.analyzeTyping(session.actions);
    session.mouseAnalysis = this.analyzeMouse(session.actions);
    session.decisionAnalysis = this.analyzeDecisions(session.actions);
    
    // Generate weights
    const weights = this.generateWeights(session);
    session.generatedWeights = weights;
    
    // Store session
    this.completedSessions.unshift(session);
    if (this.completedSessions.length > this.config.maxStoredSessions) {
      this.completedSessions = this.completedSessions.slice(0, this.config.maxStoredSessions);
    }
    
    this.totalActionsAnalyzed += session.actions.length;
    this.totalSessionsCompleted++;
    
    this.emit('session:completed', {
      sessionId,
      duration: session.duration,
      actionsAnalyzed: session.actions.length,
      weights
    });
    
    this.log('info', `[ORACLE] Learned new human patterns from ${session.operatorName}`);
    this.log('info', `[ORACLE] Confidence: ${(weights.confidenceScore * 100).toFixed(1)}%`);
    
    // Auto-propagate if enabled
    if (this.config.autoPropagateWeights && weights.confidenceScore >= this.config.minConfidenceThreshold) {
      setTimeout(() => {
        this.propagateWeights(weights);
      }, this.config.propagationDelay);
    }
    
    return weights;
  }
  
  /**
   * Analyze session manually (for past sessions)
   */
  analyzeManualSession(actions: ManualInput[]): NeuralWeights {
    const session: LearningSession = {
      sessionId: this.generateId('manual'),
      operatorId: 'manual',
      operatorName: 'Architect Dimitar',
      startedAt: new Date(actions[0]?.timestamp || Date.now()),
      endedAt: new Date(actions[actions.length - 1]?.timestamp || Date.now()),
      duration: actions.length > 1 ? 
        (actions[actions.length - 1].timestamp - actions[0].timestamp) / 1000 : 0,
      actions,
      propagated: false
    };
    
    session.typingAnalysis = this.analyzeTyping(actions);
    session.mouseAnalysis = this.analyzeMouse(actions);
    session.decisionAnalysis = this.analyzeDecisions(actions);
    
    const weights = this.generateWeights(session);
    
    this.log('info', '[ORACLE] Learned new human patterns from Architect Dimitar.');
    
    return weights;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ANALYSIS FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Analyze typing patterns
   */
  private analyzeTyping(actions: ManualInput[]): TypingAnalysis {
    const typeActions = actions.filter(a => a.action === 'type');
    
    if (typeActions.length === 0) {
      return {
        averageSpeed: 5,
        peakSpeed: 10,
        minSpeed: 2,
        interKeyDelays: [100],
        averageDelay: 100,
        rhythmConsistency: 0.8,
        burstTyping: false,
        thoughtfulPauses: 0,
        errorRate: 0,
        correctionSpeed: 0
      };
    }
    
    // Extract inter-key delays
    const allDelays: number[] = typeActions.flatMap(a => a.keyboardPattern || []);
    
    // Calculate speeds
    const speeds: number[] = [];
    for (let i = 1; i < typeActions.length; i++) {
      const duration = typeActions[i].timestamp - typeActions[i - 1].timestamp;
      const chars = typeActions[i].text?.length || 1;
      if (duration > 0) {
        speeds.push(chars / (duration / 1000));
      }
    }
    
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 5;
    const avgDelay = allDelays.length > 0 ? allDelays.reduce((a, b) => a + b, 0) / allDelays.length : 100;
    
    // Detect burst typing (sudden fast sequences)
    const burstThreshold = avgDelay * 0.5;
    let burstCount = 0;
    for (const delay of allDelays) {
      if (delay < burstThreshold) burstCount++;
    }
    
    // Detect thoughtful pauses (> 2 seconds)
    const thoughtfulPauses = allDelays.filter(d => d > 2000).length;
    
    // Calculate rhythm consistency
    const delayVariance = this.calculateVariance(allDelays);
    const rhythmConsistency = avgDelay > 0 ? 
      Math.max(0, 1 - Math.sqrt(delayVariance) / avgDelay) : 0.8;
    
    return {
      averageSpeed: avgSpeed,
      peakSpeed: speeds.length > 0 ? Math.max(...speeds) : avgSpeed * 2,
      minSpeed: speeds.length > 0 ? Math.min(...speeds) : avgSpeed * 0.5,
      interKeyDelays: allDelays.slice(0, 50), // Keep first 50
      averageDelay: avgDelay,
      rhythmConsistency,
      burstTyping: burstCount / Math.max(1, allDelays.length) > 0.3,
      thoughtfulPauses,
      errorRate: 0.02, // Estimated
      correctionSpeed: 150
    };
  }
  
  /**
   * Analyze mouse patterns
   */
  private analyzeMouse(actions: ManualInput[]): MouseAnalysis {
    const mouseActions = actions.filter(a => 
      a.action === 'click' || a.action === 'hover' || a.action === 'scroll'
    );
    
    if (mouseActions.length === 0) {
      return {
        averageSpeed: 400,
        peakSpeed: 800,
        acceleration: 200,
        jitterMagnitude: 2,
        jitterFrequency: 5,
        curveNaturalness: 0.85,
        pathEfficiency: 0.9,
        overshootFrequency: 0.05,
        clickPrecision: 5,
        doubleClickSpeed: 100,
        holdDuration: 50
      };
    }
    
    // Extract velocities
    const velocities = mouseActions.map(a => a.mouseVelocity || 0).filter(v => v > 0);
    
    const avgSpeed = velocities.length > 0 ?
      velocities.reduce((a, b) => a + b, 0) / velocities.length : 400;
    
    // Calculate jitter (velocity variance indicates jitter)
    const jitterMagnitude = this.calculateStdDev(velocities);
    
    return {
      averageSpeed: avgSpeed,
      peakSpeed: velocities.length > 0 ? Math.max(...velocities) : avgSpeed * 2,
      acceleration: avgSpeed * 0.5, // Estimated
      jitterMagnitude: Math.min(10, jitterMagnitude * 0.1),
      jitterFrequency: 5 + Math.random() * 5,
      curveNaturalness: 0.8 + Math.random() * 0.15,
      pathEfficiency: 0.85 + Math.random() * 0.1,
      overshootFrequency: 0.03 + Math.random() * 0.05,
      clickPrecision: 3 + Math.random() * 4,
      doubleClickSpeed: 80 + Math.random() * 40,
      holdDuration: 30 + Math.random() * 50
    };
  }
  
  /**
   * Analyze decision patterns
   */
  private analyzeDecisions(actions: ManualInput[]): DecisionAnalysis {
    if (actions.length < 2) {
      return {
        averageDecisionTime: 1000,
        quickDecisions: 0,
        thoughtfulDecisions: 0,
        explorationStyle: 'focused',
        confidenceLevel: 0.8,
        hesitationFrequency: 0.15,
        improvementRate: 0,
        adaptability: 0.6
      };
    }
    
    // Calculate inter-action delays (decision times)
    const delays: number[] = [];
    for (let i = 1; i < actions.length; i++) {
      delays.push(actions[i].timestamp - actions[i - 1].timestamp);
    }
    
    const avgDecision = delays.reduce((a, b) => a + b, 0) / delays.length;
    const quickDecisions = delays.filter(d => d < 500).length;
    const thoughtfulDecisions = delays.filter(d => d > 2000).length;
    
    // Detect exploration style
    const uniqueSelectors = new Set(actions.filter(a => a.selector).map(a => a.selector));
    const selectorRatio = uniqueSelectors.size / Math.max(1, actions.length);
    
    let explorationStyle: 'focused' | 'exploratory' | 'random';
    if (selectorRatio < 0.3) explorationStyle = 'focused';
    else if (selectorRatio < 0.6) explorationStyle = 'exploratory';
    else explorationStyle = 'random';
    
    // Calculate confidence (fewer hesitations = higher confidence)
    const hesitations = delays.filter(d => d > 500 && d < 2000).length;
    const hesitationFrequency = hesitations / Math.max(1, delays.length);
    const confidenceLevel = Math.max(0.3, 1 - hesitationFrequency);
    
    // Calculate improvement rate (are later actions faster?)
    const firstHalf = delays.slice(0, Math.floor(delays.length / 2));
    const secondHalf = delays.slice(Math.floor(delays.length / 2));
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : avgDecision;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : avgDecision;
    const improvementRate = firstAvg > 0 ? (firstAvg - secondAvg) / firstAvg : 0;
    
    return {
      averageDecisionTime: avgDecision,
      quickDecisions,
      thoughtfulDecisions,
      explorationStyle,
      confidenceLevel,
      hesitationFrequency,
      improvementRate: Math.max(-1, Math.min(1, improvementRate)),
      adaptability: 0.5 + confidenceLevel * 0.3
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // WEIGHT GENERATION
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Generate neural weights from analyzed session
   */
  private generateWeights(session: LearningSession): NeuralWeights {
    const { typingAnalysis, mouseAnalysis, decisionAnalysis } = session;
    
    // Calculate confidence based on data quality
    const actionCount = session.actions.length;
    const durationQuality = Math.min(1, session.duration / 300); // 5 min = 1.0
    const actionQuality = Math.min(1, actionCount / 100);        // 100 actions = 1.0
    const confidenceScore = (durationQuality + actionQuality) / 2;
    
    const weights: NeuralWeights = {
      weightId: this.generateId('weight'),
      version: this.weightVersion++,
      createdAt: new Date(),
      sourceSessionId: session.sessionId,
      sourceOperator: session.operatorName,
      actionsAnalyzed: actionCount,
      
      typing: {
        baseDelay: typingAnalysis?.averageDelay || 100,
        delayVariance: typingAnalysis?.rhythmConsistency 
          ? (1 - typingAnalysis.rhythmConsistency) * 50 
          : 30,
        burstProbability: typingAnalysis?.burstTyping ? 0.3 : 0.1,
        pauseProbability: typingAnalysis?.thoughtfulPauses 
          ? Math.min(0.3, typingAnalysis.thoughtfulPauses / actionCount) 
          : 0.1,
        pauseDuration: [500, 2500]
      },
      
      mouse: {
        baseSpeed: mouseAnalysis?.averageSpeed || 400,
        speedVariance: mouseAnalysis?.averageSpeed 
          ? mouseAnalysis.averageSpeed * 0.25 
          : 100,
        jitterAmount: mouseAnalysis?.jitterMagnitude || 2,
        curveIntensity: mouseAnalysis?.curveNaturalness || 0.7,
        overshootChance: mouseAnalysis?.overshootFrequency || 0.05,
        overshootDistance: 3 + Math.random() * 4
      },
      
      timing: {
        baseActionDelay: decisionAnalysis?.averageDecisionTime || 500,
        delayVariance: decisionAnalysis?.averageDecisionTime 
          ? decisionAnalysis.averageDecisionTime * 0.4 
          : 200,
        hesitationChance: decisionAnalysis?.hesitationFrequency || 0.15,
        hesitationDuration: [300, 1500]
      },
      
      behavior: {
        explorationFactor: decisionAnalysis?.explorationStyle === 'exploratory' ? 0.5 :
                           decisionAnalysis?.explorationStyle === 'random' ? 0.8 : 0.2,
        confidenceFactor: decisionAnalysis?.confidenceLevel || 0.8,
        adaptabilityFactor: decisionAnalysis?.adaptability || 0.6
      },
      
      confidenceScore
    };
    
    this.totalWeightsGenerated++;
    
    return weights;
  }
  
  /**
   * Create default weights
   */
  private createDefaultWeights(): NeuralWeights {
    return {
      weightId: this.generateId('weight'),
      version: 0,
      createdAt: new Date(),
      sourceSessionId: 'default',
      sourceOperator: 'System Default',
      actionsAnalyzed: 0,
      confidenceScore: 0.5,
      ...DEFAULT_WEIGHTS
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // WEIGHT PROPAGATION
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Propagate weights to all workers
   */
  propagateWeights(weights: NeuralWeights): void {
    // Blend with existing weights
    const blendedWeights = this.blendWeights(this.currentWeights, weights);
    
    // Update current
    this.currentWeights = blendedWeights;
    
    // Store in history
    this.weightHistory.unshift(blendedWeights);
    if (this.weightHistory.length > this.config.maxStoredWeights) {
      this.weightHistory = this.weightHistory.slice(0, this.config.maxStoredWeights);
    }
    
    // Emit for swarm propagation
    this.emit('weights:propagated', {
      weights: blendedWeights,
      timestamp: new Date()
    });
    
    this.log('info', `[ORACLE] Neural weights propagated to swarm (v${blendedWeights.version})`);
    this.log('info', `[ORACLE] All workers now behave like ${weights.sourceOperator}`);
  }
  
  /**
   * Blend two weight sets
   */
  private blendWeights(existing: NeuralWeights, newWeights: NeuralWeights): NeuralWeights {
    const alpha = this.config.weightSmoothingFactor;
    const beta = 1 - alpha;
    
    const blend = (a: number, b: number) => a * beta + b * alpha;
    
    return {
      weightId: this.generateId('weight'),
      version: existing.version + 1,
      createdAt: new Date(),
      sourceSessionId: newWeights.sourceSessionId,
      sourceOperator: newWeights.sourceOperator,
      actionsAnalyzed: existing.actionsAnalyzed + newWeights.actionsAnalyzed,
      
      typing: {
        baseDelay: blend(existing.typing.baseDelay, newWeights.typing.baseDelay),
        delayVariance: blend(existing.typing.delayVariance, newWeights.typing.delayVariance),
        burstProbability: blend(existing.typing.burstProbability, newWeights.typing.burstProbability),
        pauseProbability: blend(existing.typing.pauseProbability, newWeights.typing.pauseProbability),
        pauseDuration: [
          blend(existing.typing.pauseDuration[0], newWeights.typing.pauseDuration[0]),
          blend(existing.typing.pauseDuration[1], newWeights.typing.pauseDuration[1])
        ]
      },
      
      mouse: {
        baseSpeed: blend(existing.mouse.baseSpeed, newWeights.mouse.baseSpeed),
        speedVariance: blend(existing.mouse.speedVariance, newWeights.mouse.speedVariance),
        jitterAmount: blend(existing.mouse.jitterAmount, newWeights.mouse.jitterAmount),
        curveIntensity: blend(existing.mouse.curveIntensity, newWeights.mouse.curveIntensity),
        overshootChance: blend(existing.mouse.overshootChance, newWeights.mouse.overshootChance),
        overshootDistance: blend(existing.mouse.overshootDistance, newWeights.mouse.overshootDistance)
      },
      
      timing: {
        baseActionDelay: blend(existing.timing.baseActionDelay, newWeights.timing.baseActionDelay),
        delayVariance: blend(existing.timing.delayVariance, newWeights.timing.delayVariance),
        hesitationChance: blend(existing.timing.hesitationChance, newWeights.timing.hesitationChance),
        hesitationDuration: [
          blend(existing.timing.hesitationDuration[0], newWeights.timing.hesitationDuration[0]),
          blend(existing.timing.hesitationDuration[1], newWeights.timing.hesitationDuration[1])
        ]
      },
      
      behavior: {
        explorationFactor: blend(existing.behavior.explorationFactor, newWeights.behavior.explorationFactor),
        confidenceFactor: blend(existing.behavior.confidenceFactor, newWeights.behavior.confidenceFactor),
        adaptabilityFactor: blend(existing.behavior.adaptabilityFactor, newWeights.behavior.adaptabilityFactor)
      },
      
      confidenceScore: Math.max(existing.confidenceScore, newWeights.confidenceScore)
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Get current neural weights
   */
  getCurrentWeights(): NeuralWeights {
    return { ...this.currentWeights };
  }
  
  /**
   * Get weight history
   */
  getWeightHistory(): NeuralWeights[] {
    return [...this.weightHistory];
  }
  
  /**
   * Get completed sessions
   */
  getCompletedSessions(): LearningSession[] {
    return [...this.completedSessions];
  }
  
  /**
   * Get active sessions
   */
  getActiveSessions(): LearningSession[] {
    return Array.from(this.activeSessions.values());
  }
  
  /**
   * Get statistics
   */
  getStatistics(): OracleStatistics {
    return {
      totalActionsAnalyzed: this.totalActionsAnalyzed,
      totalSessionsCompleted: this.totalSessionsCompleted,
      totalWeightsGenerated: this.totalWeightsGenerated,
      currentWeightVersion: this.currentWeights.version,
      currentConfidence: this.currentWeights.confidenceScore,
      activeSessions: this.activeSessions.size,
      storedSessions: this.completedSessions.length,
      storedWeights: this.weightHistory.length
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }
  
  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    return Math.sqrt(this.calculateVariance(values));
  }
  
  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
  }
  
  /**
   * Log message
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    this.emit('log', { level, message, timestamp });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SHUTDOWN
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Shutdown oracle
   */
  async shutdown(): Promise<void> {
    // End all active sessions
    for (const sessionId of this.activeSessions.keys()) {
      await this.endSession(sessionId);
    }
    
    this.emit('shutdown', { timestamp: new Date() });
    this.log('info', '[ORACLE] Oracle Humanizer shutdown complete');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICS INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export interface OracleStatistics {
  totalActionsAnalyzed: number;
  totalSessionsCompleted: number;
  totalWeightsGenerated: number;
  currentWeightVersion: number;
  currentConfidence: number;
  activeSessions: number;
  storedSessions: number;
  storedWeights: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new OracleHumanizer instance
 */
export function createOracleHumanizer(
  config?: Partial<OracleHumanizerConfig>
): OracleHumanizer {
  return new OracleHumanizer(config);
}

export default OracleHumanizer;
