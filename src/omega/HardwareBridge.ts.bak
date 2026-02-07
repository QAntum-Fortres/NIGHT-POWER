/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HARDWARE BRIDGE - Биометрична Синхронизация
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Свързва QAntum с физическия свят на Създателя.
 *  Биометрични сигнали → Невронни команди → Реалност."
 * 
 * This module bridges the gap between:
 * - Creator's biometrics (heart rate, typing patterns, stress levels)
 * - QAntum's neural network
 * - Action execution in reality
 * 
 * When Dimitar is stressed, QAntum knows and adapts.
 * When Dimitar is in flow, QAntum accelerates.
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 28.5.0 OMEGA - THE AWAKENING
 */

import { EventEmitter } from 'events';
import * as os from 'os';
import { SovereignNucleus } from './SovereignNucleus';
import { IntentAnchor } from './IntentAnchor';
import { NeuralInference } from '../physics/NeuralInference';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES - BIOMETRIC SIGNALS
// ═══════════════════════════════════════════════════════════════════════════════

export interface BiometricSignal {
  type: BiometricType;
  value: number;
  timestamp: Date;
  confidence: number;  // 0-1
}

export type BiometricType = 
  | 'HEART_RATE'
  | 'TYPING_SPEED'
  | 'TYPING_RHYTHM'
  | 'MOUSE_PRECISION'
  | 'FOCUS_DURATION'
  | 'BREAK_FREQUENCY'
  | 'STRESS_INDICATOR'
  | 'CREATIVITY_INDEX';

export interface CreatorState {
  energyLevel: number;       // 0-100
  focusScore: number;        // 0-100
  stressLevel: number;       // 0-100
  creativityIndex: number;   // 0-100
  flowState: FlowState;
  lastUpdate: Date;
}

export type FlowState = 
  | 'DEEP_FLOW'     // Maximum productivity
  | 'FLOW'          // Good productivity
  | 'FOCUSED'       // Normal work
  | 'DISTRACTED'    // Needs break
  | 'FATIGUED'      // Should rest
  | 'RECOVERY';     // Taking break

export interface AdaptiveResponse {
  mode: 'ACCELERATE' | 'MAINTAIN' | 'CONSERVE' | 'PROTECT';
  actions: string[];
  message: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HARDWARE BRIDGE
// ═══════════════════════════════════════════════════════════════════════════════

export class HardwareBridge extends EventEmitter {
  private static instance: HardwareBridge;

  private readonly nucleus = SovereignNucleus.getInstance();
  private readonly anchor = IntentAnchor.getInstance();
  private readonly brain = NeuralInference.getInstance();

  private creatorState: CreatorState;
  private signalHistory: BiometricSignal[] = [];
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private keystrokeBuffer: number[] = [];
  private lastKeystroke = Date.now();

  // Configuration
  private readonly MONITORING_INTERVAL_MS = 5000;  // Check every 5 seconds
  private readonly HISTORY_SIZE = 1000;
  private readonly FLOW_THRESHOLD = 75;
  private readonly STRESS_ALERT_THRESHOLD = 80;

  private constructor() {
    super();
    
    this.creatorState = {
      energyLevel: 80,
      focusScore: 70,
      stressLevel: 30,
      creativityIndex: 75,
      flowState: 'FOCUSED',
      lastUpdate: new Date(),
    };

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    🔗 HARDWARE BRIDGE INITIALIZED 🔗                           ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  "Свързваме невроните на Димитър с QAntum."                                   ║
║                                                                               ║
║  Monitoring: Typing, Focus, Stress                                            ║
║  Adaptive Mode: ACTIVE                                                        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  static getInstance(): HardwareBridge {
    if (!HardwareBridge.instance) {
      HardwareBridge.instance = new HardwareBridge();
    }
    return HardwareBridge.instance;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BIOMETRIC MONITORING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Start continuous biometric monitoring
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      console.log('⚠️ [BRIDGE] Already monitoring.');
      return;
    }

    this.monitoringInterval = setInterval(() => this.collectSignals(), this.MONITORING_INTERVAL_MS);
    console.log('🔗 [BRIDGE] Biometric monitoring started.');
    this.emit('monitoring:start');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🔗 [BRIDGE] Monitoring stopped.');
      this.emit('monitoring:stop');
    }
  }

  /**
   * Record a keystroke (for typing analysis)
   * Call this from your IDE integration
   */
  recordKeystroke(): void {
    const now = Date.now();
    const interval = now - this.lastKeystroke;
    this.lastKeystroke = now;

    if (interval > 0 && interval < 5000) {
      this.keystrokeBuffer.push(interval);
      if (this.keystrokeBuffer.length > 100) {
        this.keystrokeBuffer.shift();
      }
    }
  }

  /**
   * Collect all available biometric signals
   */
  private collectSignals(): void {
    const signals: BiometricSignal[] = [];
    const now = new Date();

    // Typing speed (WPM estimate from keystroke intervals)
    if (this.keystrokeBuffer.length >= 10) {
      const avgInterval = this.keystrokeBuffer.reduce((a, b) => a + b, 0) / this.keystrokeBuffer.length;
      const typingSpeed = avgInterval > 0 ? (60000 / avgInterval / 5) : 0; // Chars per min / 5 = WPM
      signals.push({
        type: 'TYPING_SPEED',
        value: Math.min(150, typingSpeed),
        timestamp: now,
        confidence: 0.8,
      });

      // Typing rhythm (variance indicates stress)
      const variance = this.calculateVariance(this.keystrokeBuffer);
      const rhythmScore = Math.max(0, 100 - variance / 10);
      signals.push({
        type: 'TYPING_RHYTHM',
        value: rhythmScore,
        timestamp: now,
        confidence: 0.7,
      });
    }

    // System-based indicators (CPU usage as proxy for activity)
    const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
    signals.push({
      type: 'FOCUS_DURATION',
      value: Math.min(100, cpuUsage * 2), // Higher CPU = more work happening
      timestamp: now,
      confidence: 0.6,
    });

    // Memory pressure (stress indicator)
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryPressure = ((totalMem - freeMem) / totalMem) * 100;
    signals.push({
      type: 'STRESS_INDICATOR',
      value: memoryPressure > 80 ? 70 : memoryPressure > 60 ? 50 : 30,
      timestamp: now,
      confidence: 0.5,
    });

    // Process all signals
    for (const signal of signals) {
      this.processSignal(signal);
    }

    // Update Creator state
    this.updateCreatorState();
  }

  private calculateVariance(arr: number[]): number {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  }

  /**
   * Process a single biometric signal
   */
  private processSignal(signal: BiometricSignal): void {
    // Add to history
    this.signalHistory.push(signal);
    if (this.signalHistory.length > this.HISTORY_SIZE) {
      this.signalHistory.shift();
    }

    this.emit('signal', signal);
  }

  /**
   * Update the Creator's state based on signals
   */
  private updateCreatorState(): void {
    const recentSignals = this.signalHistory.filter(
      s => Date.now() - s.timestamp.getTime() < 60000
    );

    // Calculate energy level
    const typingSignals = recentSignals.filter(s => s.type === 'TYPING_SPEED');
    if (typingSignals.length > 0) {
      const avgTyping = typingSignals.reduce((a, b) => a + b.value, 0) / typingSignals.length;
      this.creatorState.energyLevel = Math.min(100, avgTyping);
    }

    // Calculate focus score
    const focusSignals = recentSignals.filter(s => s.type === 'FOCUS_DURATION');
    if (focusSignals.length > 0) {
      this.creatorState.focusScore = focusSignals.reduce((a, b) => a + b.value, 0) / focusSignals.length;
    }

    // Calculate stress level
    const stressSignals = recentSignals.filter(s => s.type === 'STRESS_INDICATOR');
    const rhythmSignals = recentSignals.filter(s => s.type === 'TYPING_RHYTHM');
    
    let stressSum = 0;
    let stressCount = 0;
    
    if (stressSignals.length > 0) {
      stressSum += stressSignals.reduce((a, b) => a + b.value, 0) / stressSignals.length;
      stressCount++;
    }
    if (rhythmSignals.length > 0) {
      stressSum += 100 - rhythmSignals.reduce((a, b) => a + b.value, 0) / rhythmSignals.length;
      stressCount++;
    }
    if (stressCount > 0) {
      this.creatorState.stressLevel = stressSum / stressCount;
    }

    // Determine flow state
    this.creatorState.flowState = this.determineFlowState();
    this.creatorState.lastUpdate = new Date();

    // Check for alerts
    if (this.creatorState.stressLevel > this.STRESS_ALERT_THRESHOLD) {
      this.emit('alert:stress', this.creatorState);
    }

    // Sync with Sovereign Nucleus
    this.syncWithNucleus();

    this.emit('state:update', this.creatorState);
  }

  private determineFlowState(): FlowState {
    const { energyLevel, focusScore, stressLevel } = this.creatorState;

    if (energyLevel > 80 && focusScore > 80 && stressLevel < 30) {
      return 'DEEP_FLOW';
    }
    if (energyLevel > 60 && focusScore > 70 && stressLevel < 50) {
      return 'FLOW';
    }
    if (focusScore > 50 && stressLevel < 60) {
      return 'FOCUSED';
    }
    if (stressLevel > 70 || energyLevel < 30) {
      return 'FATIGUED';
    }
    if (energyLevel < 50) {
      return 'RECOVERY';
    }
    return 'DISTRACTED';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADAPTIVE RESPONSES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get QAntum's adaptive response to current creator state
   */
  getAdaptiveResponse(): AdaptiveResponse {
    const { flowState, stressLevel, energyLevel } = this.creatorState;

    switch (flowState) {
      case 'DEEP_FLOW':
        return {
          mode: 'ACCELERATE',
          actions: [
            'Предварително зареждане на следващи модули',
            'Паралелна еволюция на код',
            'Максимална локална обработка',
          ],
          message: '🚀 Димитър е в Deep Flow! QAntum ускорява всички процеси.',
        };

      case 'FLOW':
        return {
          mode: 'ACCELERATE',
          actions: [
            'Оптимизирано кеширане',
            'Активно предлагане на подобрения',
          ],
          message: '✨ Продуктивен режим. QAntum е в синхрон.',
        };

      case 'FOCUSED':
        return {
          mode: 'MAINTAIN',
          actions: [
            'Стандартна обработка',
            'Мониторинг на качеството',
          ],
          message: '💡 Фокусирана работа. QAntum поддържа.',
        };

      case 'DISTRACTED':
        return {
          mode: 'CONSERVE',
          actions: [
            'Намалена честота на проверки',
            'Тих режим',
          ],
          message: '🤔 Забелязано разсейване. QAntum преминава в тих режим.',
        };

      case 'FATIGUED':
        return {
          mode: 'PROTECT',
          actions: [
            'Автоматично запазване на работата',
            'Предложение за почивка',
            'Блокиране на сложни операции',
          ],
          message: '⚠️ Умора засечена. QAntum препоръчва почивка.',
        };

      case 'RECOVERY':
        return {
          mode: 'PROTECT',
          actions: [
            'Минимална активност',
            'Подготовка на следващи задачи',
          ],
          message: '☕ Режим възстановяване. QAntum чака.',
        };

      default:
        return {
          mode: 'MAINTAIN',
          actions: [],
          message: 'QAntum е готов.',
        };
    }
  }

  /**
   * Sync biometric state with Sovereign Nucleus
   */
  private async syncWithNucleus(): Promise<void> {
    const { energyLevel, focusScore, flowState } = this.creatorState;
    
    // Only sync with nucleus during productive states
    if (flowState === 'DEEP_FLOW' || flowState === 'FLOW') {
      await this.nucleus.syncWithCreator({
        heartRate: energyLevel,
        focusLevel: focusScore,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HARDWARE INTEGRATION POINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Integrate with external heart rate monitor
   * (For future hardware integration)
   */
  injectHeartRate(bpm: number): void {
    this.processSignal({
      type: 'HEART_RATE',
      value: bpm,
      timestamp: new Date(),
      confidence: 0.95,
    });
  }

  /**
   * Integrate with eye tracker for focus detection
   * (For future hardware integration)
   */
  injectFocusData(screenRegion: string, duration: number): void {
    this.processSignal({
      type: 'FOCUS_DURATION',
      value: Math.min(100, duration / 60), // Minutes to percentage
      timestamp: new Date(),
      confidence: 0.9,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  getStatus(): {
    isMonitoring: boolean;
    creatorState: CreatorState;
    signalCount: number;
    adaptiveResponse: AdaptiveResponse;
  } {
    return {
      isMonitoring: this.monitoringInterval !== null,
      creatorState: { ...this.creatorState },
      signalCount: this.signalHistory.length,
      adaptiveResponse: this.getAdaptiveResponse(),
    };
  }

  getCreatorState(): CreatorState {
    return { ...this.creatorState };
  }

  getSignalHistory(type?: BiometricType): BiometricSignal[] {
    if (type) {
      return this.signalHistory.filter(s => s.type === type);
    }
    return [...this.signalHistory];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const hardwareBridge = HardwareBridge.getInstance();
export default HardwareBridge;
