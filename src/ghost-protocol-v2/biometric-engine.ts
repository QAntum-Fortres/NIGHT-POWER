/**
 * ⚛️ BIOMETRIC ENGINE - Human Behavior Emulation
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates human-like mouse movements, typing patterns, and scroll behavior
 * Uses Gaussian distribution for realistic variance
 * 
 * @author DIMITAR PRODROMOV
 * @version 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Point {
  x: number;
  y: number;
}

export interface MouseMovement {
  x: number;
  y: number;
  timestamp: number;
  velocity: number;
  acceleration: number;
}

export interface KeystrokePattern {
  key: string;
  pressTime: number;
  releaseTime: number;
  interval: number;
  holdDuration: number;
}

export interface ScrollPattern {
  segments: ScrollSegment[];
  totalDuration: number;
  totalDistance: number;
}

export interface ScrollSegment {
  distance: number;
  duration: number;
  easing: 'ease-out' | 'ease-in-out' | 'linear';
  velocity: number;
}

export interface BehaviorProfile {
  mouseMovements: number;
  keystrokes: number;
  scrollEvents: number;
  avgMouseSpeed: number;
  avgTypingSpeed: number;
  humanScore: number;
}

export interface SensorData {
  valid: boolean;
  payload: string;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BIOMETRIC ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class BiometricEngine {
  private variance: number;
  private mouseMovementCount = 0;
  private keystrokeCount = 0;
  private scrollCount = 0;
  private totalMouseDistance = 0;
  private avgTypingWPM = 60; // Words per minute

  constructor(variance: number = 0.15) {
    this.variance = variance;
    console.log(`[BIOMETRIC] 🧬 Engine initialized | Variance: ${variance}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOUSE MOVEMENT GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate human-like mouse path using Bezier curves
   */
  generateBezierPath(start: Point, end: Point, steps: number = 50): MouseMovement[] {
    const path: MouseMovement[] = [];
    const startTime = Date.now();
    
    // Generate control points for natural curve
    const controlPoints = this.generateControlPoints(start, end);
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = this.bezierPoint(t, start, controlPoints[0], controlPoints[1], end);
      
      // Add Gaussian noise for human imperfection
      const noiseX = this.gaussianNoise(0, 2 * this.variance);
      const noiseY = this.gaussianNoise(0, 2 * this.variance);
      
      const x = Math.round(point.x + noiseX);
      const y = Math.round(point.y + noiseY);
      
      // Calculate velocity and acceleration
      const prevPoint = path[path.length - 1];
      const distance = prevPoint 
        ? Math.sqrt(Math.pow(x - prevPoint.x, 2) + Math.pow(y - prevPoint.y, 2))
        : 0;
      
      const timeDelta = this.gaussianDelay(20, 0.3); // ~20ms between points with variance
      const velocity = distance / timeDelta;
      const acceleration = prevPoint ? velocity - prevPoint.velocity : 0;
      
      path.push({
        x,
        y,
        timestamp: startTime + i * timeDelta,
        velocity,
        acceleration
      });
      
      this.totalMouseDistance += distance;
    }
    
    this.mouseMovementCount++;
    return path;
  }

  /**
   * Generate natural control points for Bezier curve
   */
  private generateControlPoints(start: Point, end: Point): [Point, Point] {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Randomize control point offsets
    const offset1 = distance * (0.2 + Math.random() * 0.3);
    const offset2 = distance * (0.2 + Math.random() * 0.3);
    
    const angle1 = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI / 4;
    const angle2 = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI / 4;
    
    return [
      {
        x: start.x + Math.cos(angle1) * offset1,
        y: start.y + Math.sin(angle1) * offset1
      },
      {
        x: end.x - Math.cos(angle2) * offset2,
        y: end.y - Math.sin(angle2) * offset2
      }
    ];
  }

  /**
   * Calculate point on cubic Bezier curve
   */
  private bezierPoint(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
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

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPING PATTERN GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate human-like typing pattern
   */
  generateTypingPattern(text: string): KeystrokePattern[] {
    const pattern: KeystrokePattern[] = [];
    let currentTime = Date.now();
    
    // Average interval based on WPM (5 chars per word)
    const avgInterval = 60000 / (this.avgTypingWPM * 5);
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Base interval with variance
      let interval = this.gaussianDelay(avgInterval, this.variance);
      
      // Longer pauses after punctuation and spaces
      if (['.', ',', '!', '?', ' '].includes(char)) {
        interval *= 1.5 + Math.random() * 0.5;
      }
      
      // Occasional longer pauses (thinking)
      if (Math.random() < 0.05) {
        interval += this.gaussianDelay(500, 0.3);
      }
      
      // Key hold duration (50-150ms)
      const holdDuration = 50 + Math.random() * 100;
      
      pattern.push({
        key: char,
        pressTime: currentTime,
        releaseTime: currentTime + holdDuration,
        interval: i === 0 ? 0 : interval,
        holdDuration
      });
      
      currentTime += interval;
      this.keystrokeCount++;
    }
    
    return pattern;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCROLL BEHAVIOR GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate human-like scroll pattern
   */
  generateScrollPattern(totalDistance: number): ScrollPattern {
    const segments: ScrollSegment[] = [];
    let remaining = totalDistance;
    let totalDuration = 0;
    
    while (remaining > 0) {
      // Humans scroll in chunks, not continuous motion
      const chunkSize = Math.min(
        remaining,
        100 + Math.random() * 300 // 100-400px chunks
      );
      
      // Scroll speed varies (300-800 px/s)
      const speed = 300 + Math.random() * 500;
      const duration = (chunkSize / speed) * 1000;
      
      // Add micro-pauses between scrolls
      const pauseDuration = Math.random() < 0.3 
        ? this.gaussianDelay(200, 0.5) 
        : 0;
      
      segments.push({
        distance: chunkSize,
        duration: duration + pauseDuration,
        easing: Math.random() > 0.5 ? 'ease-out' : 'ease-in-out',
        velocity: speed
      });
      
      remaining -= chunkSize;
      totalDuration += duration + pauseDuration;
      this.scrollCount++;
    }
    
    return {
      segments,
      totalDuration,
      totalDistance
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SENSOR DATA GENERATION (for Akamai, Shape, etc.)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate Akamai sensor data payload
   */
  generateAkamaiSensor(): SensorData {
    const timestamp = Date.now();
    const movements = this.mouseMovementCount;
    const keystrokes = this.keystrokeCount;
    
    // Simplified sensor - real implementation would be more complex
    const payload = this.encodePayload({
      ts: timestamp,
      mm: movements,
      kk: keystrokes,
      sc: this.scrollCount,
      hs: this.calculateBehaviorScore(),
      v: '2.0'
    });
    
    return {
      valid: this.calculateBehaviorScore() > 0.7,
      payload,
      timestamp
    };
  }

  /**
   * Generate Shape Security sensor data
   */
  generateShapeSensor(): SensorData {
    const timestamp = Date.now();
    
    const payload = this.encodePayload({
      t: timestamp,
      m: this.mouseMovementCount,
      k: this.keystrokeCount,
      s: this.scrollCount,
      d: this.totalMouseDistance,
      h: this.calculateBehaviorScore()
    });
    
    return {
      valid: this.calculateBehaviorScore() > 0.65,
      payload,
      timestamp
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BEHAVIOR SCORING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate behavior profile summary
   */
  generateBehaviorProfile(): BehaviorProfile {
    return {
      mouseMovements: this.mouseMovementCount,
      keystrokes: this.keystrokeCount,
      scrollEvents: this.scrollCount,
      avgMouseSpeed: this.totalMouseDistance / Math.max(this.mouseMovementCount, 1),
      avgTypingSpeed: this.avgTypingWPM,
      humanScore: this.calculateBehaviorScore()
    };
  }

  /**
   * Calculate human-likeness score (0-1)
   */
  calculateBehaviorScore(): number {
    let score = 0.5; // Base score
    
    // More interactions = more human
    if (this.mouseMovementCount > 0) score += 0.1;
    if (this.mouseMovementCount > 5) score += 0.05;
    if (this.keystrokeCount > 0) score += 0.1;
    if (this.scrollCount > 0) score += 0.1;
    
    // Natural mouse speed range
    const avgSpeed = this.totalMouseDistance / Math.max(this.mouseMovementCount, 1);
    if (avgSpeed > 50 && avgSpeed < 500) score += 0.1;
    
    // Add some randomness (humans aren't perfectly consistent)
    score += (Math.random() - 0.5) * 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate Gaussian-distributed delay
   */
  gaussianDelay(mean: number, variance: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, mean + normal * mean * variance);
  }

  /**
   * Generate Gaussian noise
   */
  private gaussianNoise(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + normal * stdDev;
  }

  /**
   * Encode payload to base64-like string
   */
  private encodePayload(data: Record<string, unknown>): string {
    const json = JSON.stringify(data);
    return Buffer.from(json).toString('base64');
  }

  /**
   * Reset behavior counters
   */
  reset(): void {
    this.mouseMovementCount = 0;
    this.keystrokeCount = 0;
    this.scrollCount = 0;
    this.totalMouseDistance = 0;
    console.log('[BIOMETRIC] 🔄 Counters reset');
  }

  /**
   * Set typing speed (WPM)
   */
  setTypingSpeed(wpm: number): void {
    this.avgTypingWPM = Math.max(20, Math.min(150, wpm));
  }
}

export default BiometricEngine;
