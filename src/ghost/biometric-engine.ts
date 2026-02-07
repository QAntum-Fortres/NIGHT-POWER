/**
 * ⚛️ QANTUM GHOST PROTOCOL v2 - BIOMETRIC ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Human-like Mouse Movements, Keyboard Patterns & Timing
 * 
 * Defeats: Akamai Bot Manager, PerimeterX HUMAN, DataDome Behavioral Analysis
 * 
 * "Machines calculate. Humans hesitate. We hesitate perfectly."
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Point {
  x: number;
  y: number;
}

export interface BiometricConfig {
  // Mouse settings
  mouseSpeed: number;        // Base speed multiplier (0.5-2.0)
  curveIntensity: number;    // How curved the paths are (0-1)
  jitterAmount: number;      // Random micro-movements (0-1)
  overshootProbability: number; // Chance to overshoot target
  
  // Timing settings
  baseDelay: number;         // Base delay between actions (ms)
  delayVariance: number;     // Variance in delays (0-1)
  humanFatigue: boolean;     // Gradually slow down over time
  
  // Keyboard settings
  typingSpeed: number;       // Characters per minute
  typoRate: number;          // Probability of typos (0-0.1)
  fixTypos: boolean;         // Whether to correct typos
  
  // Behavior patterns
  microPauses: boolean;      // Brief pauses during movement
  scrollBehavior: 'smooth' | 'stepped' | 'mixed';
}

export interface MousePath {
  points: Point[];
  duration: number;
  timestamps: number[];
}

export interface KeystrokePattern {
  key: string;
  downTime: number;
  upTime: number;
  delay: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAUSSIAN DISTRIBUTION
// ═══════════════════════════════════════════════════════════════════════════════

class GaussianRandom {
  private spare: number | null = null;
  
  /**
   * Box-Muller transform for Gaussian random numbers
   */
  next(mean: number = 0, stdDev: number = 1): number {
    if (this.spare !== null) {
      const result = this.spare * stdDev + mean;
      this.spare = null;
      return result;
    }
    
    let u, v, s;
    do {
      u = Math.random() * 2 - 1;
      v = Math.random() * 2 - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);
    
    const mul = Math.sqrt(-2.0 * Math.log(s) / s);
    this.spare = v * mul;
    return u * mul * stdDev + mean;
  }
  
  /**
   * Bounded Gaussian - ensures result stays within bounds
   */
  bounded(mean: number, stdDev: number, min: number, max: number): number {
    let result;
    let attempts = 0;
    do {
      result = this.next(mean, stdDev);
      attempts++;
    } while ((result < min || result > max) && attempts < 100);
    
    return Math.max(min, Math.min(max, result));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BEZIER CURVE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class BezierEngine {
  /**
   * Calculate point on cubic Bezier curve
   */
  static cubicBezier(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    
    return {
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
    };
  }
  
  /**
   * Generate control points for natural-looking curve
   */
  static generateControlPoints(start: Point, end: Point, intensity: number): [Point, Point] {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Perpendicular offset for curve
    const perpX = -dy / distance;
    const perpY = dx / distance;
    
    // Random curve direction
    const curveDir = Math.random() > 0.5 ? 1 : -1;
    const curveAmount = distance * intensity * curveDir * (0.2 + Math.random() * 0.3);
    
    // Control points with some randomness
    const ctrl1: Point = {
      x: start.x + dx * 0.25 + perpX * curveAmount * (0.5 + Math.random() * 0.5),
      y: start.y + dy * 0.25 + perpY * curveAmount * (0.5 + Math.random() * 0.5)
    };
    
    const ctrl2: Point = {
      x: start.x + dx * 0.75 + perpX * curveAmount * (0.5 + Math.random() * 0.5),
      y: start.y + dy * 0.75 + perpY * curveAmount * (0.5 + Math.random() * 0.5)
    };
    
    return [ctrl1, ctrl2];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BIOMETRIC ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class BiometricEngine {
  private config: BiometricConfig;
  private gaussian: GaussianRandom;
  private actionCount: number = 0;
  private sessionStart: number;
  
  // Keyboard layout for typo simulation
  private static readonly KEYBOARD_NEIGHBORS: Record<string, string[]> = {
    'a': ['q', 'w', 's', 'z'],
    'b': ['v', 'g', 'h', 'n'],
    'c': ['x', 'd', 'f', 'v'],
    'd': ['s', 'e', 'r', 'f', 'c', 'x'],
    'e': ['w', 's', 'd', 'r'],
    'f': ['d', 'r', 't', 'g', 'v', 'c'],
    'g': ['f', 't', 'y', 'h', 'b', 'v'],
    'h': ['g', 'y', 'u', 'j', 'n', 'b'],
    'i': ['u', 'j', 'k', 'o'],
    'j': ['h', 'u', 'i', 'k', 'm', 'n'],
    'k': ['j', 'i', 'o', 'l', 'm'],
    'l': ['k', 'o', 'p'],
    'm': ['n', 'j', 'k'],
    'n': ['b', 'h', 'j', 'm'],
    'o': ['i', 'k', 'l', 'p'],
    'p': ['o', 'l'],
    'q': ['w', 'a'],
    'r': ['e', 'd', 'f', 't'],
    's': ['a', 'w', 'e', 'd', 'x', 'z'],
    't': ['r', 'f', 'g', 'y'],
    'u': ['y', 'h', 'j', 'i'],
    'v': ['c', 'f', 'g', 'b'],
    'w': ['q', 'a', 's', 'e'],
    'x': ['z', 's', 'd', 'c'],
    'y': ['t', 'g', 'h', 'u'],
    'z': ['a', 's', 'x'],
    ' ': ['c', 'v', 'b', 'n', 'm']
  };

  constructor(config?: Partial<BiometricConfig>) {
    this.config = {
      mouseSpeed: config?.mouseSpeed ?? 1.0,
      curveIntensity: config?.curveIntensity ?? 0.3,
      jitterAmount: config?.jitterAmount ?? 0.1,
      overshootProbability: config?.overshootProbability ?? 0.15,
      baseDelay: config?.baseDelay ?? 50,
      delayVariance: config?.delayVariance ?? 0.3,
      humanFatigue: config?.humanFatigue ?? true,
      typingSpeed: config?.typingSpeed ?? 280,
      typoRate: config?.typoRate ?? 0.02,
      fixTypos: config?.fixTypos ?? true,
      microPauses: config?.microPauses ?? true,
      scrollBehavior: config?.scrollBehavior ?? 'mixed'
    };
    
    this.gaussian = new GaussianRandom();
    this.sessionStart = Date.now();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MOUSE PATH GENERATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate human-like mouse path from point A to B
   */
  generateMousePath(from: Point, to: Point): MousePath {
    const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    
    // Calculate duration based on Fitts' Law
    const baseDuration = this.calculateMovementTime(distance);
    const duration = baseDuration * (1 / this.config.mouseSpeed);
    
    // Generate path
    const points: Point[] = [];
    const timestamps: number[] = [];
    
    // Number of points based on distance and duration
    const numPoints = Math.max(10, Math.floor(distance / 10));
    
    // Check for overshoot
    const willOvershoot = Math.random() < this.config.overshootProbability && distance > 50;
    
    if (willOvershoot) {
      // Overshoot target then correct
      const overshootDist = distance * (0.05 + Math.random() * 0.1);
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const overshootPoint: Point = {
        x: to.x + Math.cos(angle) * overshootDist,
        y: to.y + Math.sin(angle) * overshootDist
      };
      
      // Path to overshoot
      const [ctrl1, ctrl2] = BezierEngine.generateControlPoints(from, overshootPoint, this.config.curveIntensity);
      const overPoints = Math.floor(numPoints * 0.7);
      
      for (let i = 0; i <= overPoints; i++) {
        const t = i / overPoints;
        const point = BezierEngine.cubicBezier(t, from, ctrl1, ctrl2, overshootPoint);
        points.push(this.addJitter(point, this.config.jitterAmount));
        timestamps.push(this.calculateTimestamp(t * 0.7, duration));
      }
      
      // Correction path
      const correctionPoints = numPoints - overPoints;
      for (let i = 1; i <= correctionPoints; i++) {
        const t = i / correctionPoints;
        const point = this.lerp(overshootPoint, to, t);
        points.push(this.addJitter(point, this.config.jitterAmount * 0.5));
        timestamps.push(this.calculateTimestamp(0.7 + t * 0.3, duration));
      }
    } else {
      // Normal curved path
      const [ctrl1, ctrl2] = BezierEngine.generateControlPoints(from, to, this.config.curveIntensity);
      
      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const point = BezierEngine.cubicBezier(t, from, ctrl1, ctrl2, to);
        points.push(this.addJitter(point, this.config.jitterAmount));
        timestamps.push(this.calculateTimestamp(t, duration));
        
        // Add micro-pause
        if (this.config.microPauses && Math.random() < 0.05 && i > 0 && i < numPoints) {
          // Duplicate point for pause
          points.push(this.addJitter(point, this.config.jitterAmount * 0.3));
          timestamps.push(timestamps[timestamps.length - 1] + this.gaussian.bounded(30, 15, 10, 80));
        }
      }
    }

    this.actionCount++;
    
    return {
      points,
      duration,
      timestamps
    };
  }

  /**
   * Fitts' Law - Movement time calculation
   */
  private calculateMovementTime(distance: number, targetWidth: number = 20): number {
    // Fitts' Law: MT = a + b * log2(2D/W)
    const a = 50; // Base time (ms)
    const b = 150; // Movement time coefficient
    const id = Math.log2(2 * distance / targetWidth + 1);
    
    return a + b * id + this.gaussian.bounded(0, 30, -50, 100);
  }

  private calculateTimestamp(t: number, totalDuration: number): number {
    // Ease-in-out timing
    const eased = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
    
    return eased * totalDuration;
  }

  private addJitter(point: Point, amount: number): Point {
    if (amount === 0) return point;
    
    return {
      x: Math.round(point.x + this.gaussian.next(0, amount * 3)),
      y: Math.round(point.y + this.gaussian.next(0, amount * 3))
    };
  }

  private lerp(a: Point, b: Point, t: number): Point {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CLICK BEHAVIOR
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate human-like click timing
   */
  generateClickTiming(): { preDelay: number; holdDuration: number; postDelay: number } {
    return {
      preDelay: this.gaussian.bounded(50, 30, 10, 150),
      holdDuration: this.gaussian.bounded(85, 25, 50, 200),
      postDelay: this.gaussian.bounded(100, 50, 30, 300)
    };
  }

  /**
   * Generate double-click timing
   */
  generateDoubleClickTiming(): { interval: number; holdDurations: [number, number] } {
    return {
      interval: this.gaussian.bounded(100, 30, 50, 200),
      holdDurations: [
        this.gaussian.bounded(70, 20, 40, 120),
        this.gaussian.bounded(80, 25, 45, 140)
      ]
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // KEYBOARD BEHAVIOR
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate keystroke pattern for text input
   */
  generateKeystrokePattern(text: string): KeystrokePattern[] {
    const pattern: KeystrokePattern[] = [];
    const msPerChar = 60000 / this.config.typingSpeed;
    
    let currentTime = 0;
    const chars = text.split('');
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      
      // Check for typo
      if (this.config.typoRate > 0 && Math.random() < this.config.typoRate) {
        const typo = this.generateTypo(char);
        
        // Type wrong character
        const typoHoldDuration = this.gaussian.bounded(msPerChar * 0.3, 20, 30, 150);
        pattern.push({
          key: typo,
          downTime: currentTime,
          upTime: currentTime + typoHoldDuration,
          delay: this.gaussian.bounded(msPerChar, msPerChar * 0.3, msPerChar * 0.4, msPerChar * 2)
        });
        currentTime += pattern[pattern.length - 1].delay;
        
        // Fix typo if configured
        if (this.config.fixTypos) {
          // Pause (noticing the mistake)
          currentTime += this.gaussian.bounded(200, 80, 100, 500);
          
          // Backspace
          const bsHold = this.gaussian.bounded(60, 20, 30, 100);
          pattern.push({
            key: 'Backspace',
            downTime: currentTime,
            upTime: currentTime + bsHold,
            delay: this.gaussian.bounded(msPerChar * 0.8, 30, 40, 200)
          });
          currentTime += pattern[pattern.length - 1].delay;
        }
      }
      
      // Type correct character
      const holdDuration = this.gaussian.bounded(msPerChar * 0.35, 25, 30, 180);
      const delay = this.calculateInterKeyDelay(chars[i - 1], char, msPerChar);
      
      pattern.push({
        key: char,
        downTime: currentTime,
        upTime: currentTime + holdDuration,
        delay
      });
      
      currentTime += delay;
    }
    
    this.actionCount++;
    return pattern;
  }

  private generateTypo(intended: string): string {
    const lower = intended.toLowerCase();
    const neighbors = BiometricEngine.KEYBOARD_NEIGHBORS[lower];
    
    if (neighbors && neighbors.length > 0) {
      const typo = neighbors[Math.floor(Math.random() * neighbors.length)];
      return intended === intended.toUpperCase() ? typo.toUpperCase() : typo;
    }
    
    return intended;
  }

  private calculateInterKeyDelay(prevChar: string | undefined, currentChar: string, baseDelay: number): number {
    let modifier = 1;
    
    // Same finger = slower
    if (prevChar && this.sameFingerKeys(prevChar, currentChar)) {
      modifier *= 1.2;
    }
    
    // Different hand = faster
    if (prevChar && this.differentHandKeys(prevChar, currentChar)) {
      modifier *= 0.85;
    }
    
    // Shift = slower
    if (currentChar !== currentChar.toLowerCase()) {
      modifier *= 1.15;
    }
    
    // Space after word = slight pause
    if (currentChar === ' ') {
      modifier *= 1.1;
    }
    
    return this.gaussian.bounded(baseDelay * modifier, baseDelay * 0.3, baseDelay * 0.4, baseDelay * 2.5);
  }

  private sameFingerKeys(a: string, b: string): boolean {
    const fingerGroups = [
      ['q', 'a', 'z', '1'],
      ['w', 's', 'x', '2'],
      ['e', 'd', 'c', '3'],
      ['r', 'f', 'v', 't', 'g', 'b', '4', '5'],
      ['y', 'h', 'n', 'u', 'j', 'm', '6', '7'],
      ['i', 'k', '8'],
      ['o', 'l', '9'],
      ['p', '0']
    ];
    
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    return fingerGroups.some(group => group.includes(aLower) && group.includes(bLower));
  }

  private differentHandKeys(a: string, b: string): boolean {
    const leftHand = ['q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f', 'g', 'z', 'x', 'c', 'v', 'b', '1', '2', '3', '4', '5'];
    const rightHand = ['y', 'u', 'i', 'o', 'p', 'h', 'j', 'k', 'l', 'n', 'm', '6', '7', '8', '9', '0'];
    
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    return (leftHand.includes(aLower) && rightHand.includes(bLower)) ||
           (rightHand.includes(aLower) && leftHand.includes(bLower));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCROLL BEHAVIOR
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate scroll behavior pattern
   */
  generateScrollPattern(totalDistance: number, direction: 'up' | 'down' = 'down'): Array<{ distance: number; delay: number }> {
    const pattern: Array<{ distance: number; delay: number }> = [];
    let remaining = Math.abs(totalDistance);
    const sign = direction === 'down' ? 1 : -1;
    
    const behavior = this.config.scrollBehavior === 'mixed'
      ? (Math.random() > 0.5 ? 'smooth' : 'stepped')
      : this.config.scrollBehavior;
    
    if (behavior === 'smooth') {
      // Smooth scroll with momentum
      while (remaining > 0) {
        const scrollAmount = Math.min(
          remaining,
          this.gaussian.bounded(100, 40, 30, 200)
        );
        
        pattern.push({
          distance: scrollAmount * sign,
          delay: this.gaussian.bounded(16, 5, 8, 30) // ~60fps
        });
        
        remaining -= scrollAmount;
      }
    } else {
      // Stepped scroll (like mouse wheel)
      const wheelDelta = 100; // Standard mouse wheel delta
      
      while (remaining > 0) {
        const numSteps = Math.min(
          Math.ceil(remaining / wheelDelta),
          Math.floor(this.gaussian.bounded(3, 1, 1, 6))
        );
        
        for (let i = 0; i < numSteps && remaining > 0; i++) {
          const distance = Math.min(remaining, wheelDelta);
          pattern.push({
            distance: distance * sign,
            delay: this.gaussian.bounded(80, 30, 30, 200)
          });
          remaining -= distance;
        }
        
        // Pause between scroll bursts
        if (remaining > 0) {
          pattern.push({
            distance: 0,
            delay: this.gaussian.bounded(300, 150, 100, 800)
          });
        }
      }
    }

    this.actionCount++;
    return pattern;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DELAY GENERATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate human-like delay between actions
   */
  generateDelay(context: 'click' | 'type' | 'scroll' | 'navigation' | 'thinking' = 'click'): number {
    let baseMean: number;
    let baseStd: number;
    
    switch (context) {
      case 'click':
        baseMean = 150;
        baseStd = 50;
        break;
      case 'type':
        baseMean = 50;
        baseStd = 20;
        break;
      case 'scroll':
        baseMean = 200;
        baseStd = 80;
        break;
      case 'navigation':
        baseMean = 500;
        baseStd = 200;
        break;
      case 'thinking':
        baseMean = 1500;
        baseStd = 500;
        break;
      default:
        baseMean = this.config.baseDelay;
        baseStd = this.config.baseDelay * this.config.delayVariance;
    }
    
    // Apply fatigue factor
    let delay = this.gaussian.bounded(baseMean, baseStd, baseMean * 0.3, baseMean * 3);
    
    if (this.config.humanFatigue) {
      const sessionMinutes = (Date.now() - this.sessionStart) / 60000;
      const fatigueFactor = 1 + Math.min(sessionMinutes / 30, 0.5) * 0.2;
      delay *= fatigueFactor;
    }
    
    return Math.round(delay);
  }

  /**
   * Generate "reading" delay based on content length
   */
  generateReadingDelay(textLength: number, wordsPerMinute: number = 250): number {
    const words = textLength / 5; // Average word length
    const baseTime = (words / wordsPerMinute) * 60000;
    
    // Humans don't read at constant speed
    return this.gaussian.bounded(baseTime, baseTime * 0.2, baseTime * 0.5, baseTime * 2);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PLAYWRIGHT/PUPPETEER INTEGRATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Execute mouse movement on Playwright page
   */
  async executeMouseMove(page: any, from: Point, to: Point): Promise<void> {
    const path = this.generateMousePath(from, to);
    
    for (let i = 0; i < path.points.length; i++) {
      const point = path.points[i];
      const delay = i > 0 ? path.timestamps[i] - path.timestamps[i - 1] : 0;
      
      if (delay > 0) {
        await this.sleep(delay);
      }
      
      await page.mouse.move(point.x, point.y);
    }
  }

  /**
   * Execute human-like click
   */
  async executeClick(page: any, point: Point, options?: { button?: 'left' | 'right' | 'middle' }): Promise<void> {
    const timing = this.generateClickTiming();
    
    await this.sleep(timing.preDelay);
    await page.mouse.move(point.x, point.y);
    await page.mouse.down({ button: options?.button || 'left' });
    await this.sleep(timing.holdDuration);
    await page.mouse.up({ button: options?.button || 'left' });
    await this.sleep(timing.postDelay);
  }

  /**
   * Execute human-like typing
   */
  async executeType(page: any, selector: string, text: string): Promise<void> {
    const pattern = this.generateKeystrokePattern(text);
    
    await page.click(selector);
    await this.sleep(this.generateDelay('click'));
    
    for (const keystroke of pattern) {
      await this.sleep(keystroke.delay);
      
      if (keystroke.key === 'Backspace') {
        await page.keyboard.press('Backspace');
      } else {
        await page.keyboard.type(keystroke.key, { delay: keystroke.upTime - keystroke.downTime });
      }
    }
  }

  /**
   * Execute human-like scroll
   */
  async executeScroll(page: any, distance: number, direction: 'up' | 'down' = 'down'): Promise<void> {
    const pattern = this.generateScrollPattern(distance, direction);
    
    for (const step of pattern) {
      if (step.distance !== 0) {
        await page.mouse.wheel(0, step.distance);
      }
      await this.sleep(step.delay);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STATISTICS
  // ─────────────────────────────────────────────────────────────────────────────

  getStats(): Record<string, unknown> {
    return {
      actionCount: this.actionCount,
      sessionDuration: Date.now() - this.sessionStart,
      config: this.config,
      fatigueLevel: this.config.humanFatigue 
        ? Math.min((Date.now() - this.sessionStart) / 1800000, 1)
        : 0
    };
  }

  resetSession(): void {
    this.actionCount = 0;
    this.sessionStart = Date.now();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

let defaultEngine: BiometricEngine | null = null;

export function getBiometricEngine(config?: Partial<BiometricConfig>): BiometricEngine {
  if (!defaultEngine) {
    defaultEngine = new BiometricEngine(config);
  }
  return defaultEngine;
}

export function createBiometricEngine(config?: Partial<BiometricConfig>): BiometricEngine {
  return new BiometricEngine(config);
}

export default BiometricEngine;
