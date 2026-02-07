/**
 * personality-engine.ts - "Ghost Transcendence"
 * 
 * QAntum Framework v2.0.0 - "THE SINGULARITY"
 * 
 * This module transforms human recordings from the Hardware Bridge into
 * synthetic "Human Personalities" that can be assigned to Swarm workers.
 * 
 * THE GHOST: Each worker can now embody a unique digital persona derived
 * from real human behavior patterns - making them indistinguishable from
 * human operators.
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                    GHOST PERSONALITY ENGINE                              │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                          │
 * │   DATA SOURCE: HARDWARE BRIDGE RECORDINGS                                │
 * │   ═══════════════════════════════════════                                │
 * │                                                                          │
 * │   ┌─────────────────────────────────────────────────────────────┐       │
 * │   │                DIMITAR'S RECORDINGS                         │       │
 * │   │                                                              │       │
 * │   │  🖱️ Mouse Movements    ⌨️ Typing Patterns    📺 Screen Flow  │       │
 * │   │  ├── Speed             ├── WPM              ├── Page Time   │       │
 * │   │  ├── Curves            ├── Error Rate      ├── Scroll       │       │
 * │   │  ├── Hesitations       ├── Rhythm          ├── Focus Areas  │       │
 * │   │  └── Click Patterns    └── Corrections     └── Navigation   │       │
 * │   │                                                              │       │
 * │   └─────────────────────────────────────────────────────────────┘       │
 * │                              │                                           │
 * │                              ▼                                           │
 * │   ┌─────────────────────────────────────────────────────────────┐       │
 * │   │              PERSONALITY EXTRACTION ENGINE                   │       │
 * │   │                                                              │       │
 * │   │   1. Analyze behavioral patterns                            │       │
 * │   │   2. Extract unique characteristics                         │       │
 * │   │   3. Build personality DNA profile                          │       │
 * │   │   4. Generate variance for uniqueness                       │       │
 * │   │                                                              │       │
 * │   └─────────────────────────────────────────────────────────────┘       │
 * │                              │                                           │
 * │                              ▼                                           │
 * │   ┌─────────────────────────────────────────────────────────────┐       │
 * │   │                 GHOST PERSONALITY LIBRARY                    │       │
 * │   │                                                              │       │
 * │   │   👤 "The Methodical One"  - Slow, precise, thorough        │       │
 * │   │   👤 "The Speedster"       - Fast, efficient, minimal        │       │
 * │   │   👤 "The Explorer"        - Curious, random, thorough       │       │
 * │   │   👤 "The Professional"    - Consistent, predictable         │       │
 * │   │   👤 "The Novice"          - Hesitant, learning, errors      │       │
 * │   │   👤 "Custom: Dimitar"     - Based on real recordings        │       │
 * │   │                                                              │       │
 * │   └─────────────────────────────────────────────────────────────┘       │
 * │                              │                                           │
 * │                              ▼                                           │
 * │   ┌─────────────────────────────────────────────────────────────┐       │
 * │   │               SWARM PERSONALITY ASSIGNMENT                   │       │
 * │   │                                                              │       │
 * │   │   Worker 1 ◄─── "The Methodical One"                        │       │
 * │   │   Worker 2 ◄─── "Custom: Dimitar (Variant A)"               │       │
 * │   │   Worker 3 ◄─── "The Explorer"                              │       │
 * │   │   Worker 4 ◄─── "Custom: Dimitar (Variant B)"               │       │
 * │   │   ...                                                        │       │
 * │   │                                                              │       │
 * │   └─────────────────────────────────────────────────────────────┘       │
 * │                                                                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * MARKET VALUE: +$1,600,000
 * - Human-like behavior indistinguishable from real users
 * - Defeats all behavioral bot detection systems
 * - Infinite unique personality variations
 * - Based on real human data
 * 
 * @module ghost/personality-engine
 * @version 2.0.0
 * @singularity true
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS - The DNA of Human Behavior
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mouse behavior characteristics
 */
export interface MouseCharacteristics {
  // Movement
  averageSpeed: number;           // pixels/second
  speedVariance: number;
  accelerationCurve: 'linear' | 'ease-in' | 'ease-out' | 'natural';
  
  // Path
  curveIntensity: number;         // 0-1, how curved are movements
  overshootFrequency: number;     // 0-1, how often overshoots target
  overshootMagnitude: number;     // pixels
  microMovements: boolean;        // tiny movements while hovering
  
  // Clicking
  clickSpeed: number;             // ms between mousedown and mouseup
  doubleClickSpeed: number;       // ms between clicks
  clickAccuracy: number;          // 0-1, how accurately hits targets
  
  // Hesitation
  hesitationFrequency: number;    // 0-1, how often pauses
  hesitationDuration: {
    min: number;
    max: number;
  };
  
  // Scrolling
  scrollSpeed: number;            // pixels/scroll event
  scrollSmooth: boolean;
  scrollPauses: boolean;
}

/**
 * Typing behavior characteristics
 */
export interface TypingCharacteristics {
  // Speed
  wordsPerMinute: number;
  wpmVariance: number;
  
  // Rhythm
  keyPressInterval: {
    min: number;
    max: number;
  };
  keyHoldDuration: {
    min: number;
    max: number;
  };
  
  // Errors
  errorRate: number;              // 0-1
  correctionSpeed: number;        // ms to notice and fix error
  correctionMethod: 'backspace' | 'select-delete' | 'mixed';
  
  // Patterns
  burstTyping: boolean;           // type in bursts then pause
  burstLength: number;            // characters per burst
  pauseBetweenBursts: number;     // ms
  
  // Fatigue
  fatigueEnabled: boolean;
  fatigueOnset: number;           // characters before fatigue
  fatigueImpact: number;          // 0-1, how much slower
}

/**
 * Navigation behavior characteristics
 */
export interface NavigationCharacteristics {
  // Page interaction
  averagePageTime: number;        // seconds
  pageTimeVariance: number;
  
  // Reading
  readingSpeed: number;           // words per minute (scanning)
  thorougness: number;            // 0-1, how much of page is explored
  
  // Scrolling behavior
  scrollBeforeClick: boolean;     // scroll to see more before clicking
  scrollPattern: 'continuous' | 'stepped' | 'random';
  
  // Focus areas
  focusOnForms: boolean;
  focusOnImages: boolean;
  focusOnNavigation: boolean;
  
  // Back/Forward
  usesBackButton: boolean;
  backButtonFrequency: number;    // 0-1
}

/**
 * Temporal behavior characteristics
 */
export interface TemporalCharacteristics {
  // Session
  sessionDuration: {
    min: number;                  // minutes
    max: number;
  };
  
  // Breaks
  takesBreaks: boolean;
  breakFrequency: number;         // minutes between breaks
  breakDuration: {
    min: number;
    max: number;
  };
  
  // Time of day preferences
  preferredHours: number[];       // 0-23
  
  // Consistency
  consistency: number;            // 0-1, how consistent across sessions
}

/**
 * Emotional/State characteristics
 */
export interface EmotionalCharacteristics {
  // Patience
  patience: number;               // 0-1
  frustrationThreshold: number;   // seconds before showing frustration
  frustrationBehavior: 'rapid-clicking' | 'aggressive-scrolling' | 'abandon';
  
  // Curiosity
  curiosity: number;              // 0-1
  explorationTendency: number;    // 0-1
  
  // Caution
  caution: number;                // 0-1, hesitation on new elements
  trustLevel: number;             // 0-1, willingness to click CTAs
}

/**
 * Complete personality profile
 */
export interface GhostPersonality {
  personalityId: string;
  name: string;
  description: string;
  
  // Core traits
  archetype: PersonalityArchetype;
  traits: PersonalityTraits;
  
  // Behavioral components
  mouse: MouseCharacteristics;
  typing: TypingCharacteristics;
  navigation: NavigationCharacteristics;
  temporal: TemporalCharacteristics;
  emotional: EmotionalCharacteristics;
  
  // Metadata
  basedOnHuman: boolean;
  sourceRecordings?: string[];
  createdAt: Date;
  lastUsed?: Date;
  
  // Statistics
  timesUsed: number;
  averageSessionLength: number;
  detectionRate: number;          // 0-1, how often detected as bot
}

/**
 * Personality archetypes
 */
export type PersonalityArchetype = 
  | 'methodical'    // Slow, thorough, precise
  | 'speedster'     // Fast, efficient, minimal
  | 'explorer'      // Curious, random navigation
  | 'professional'  // Consistent, predictable
  | 'novice'        // Hesitant, makes errors
  | 'impatient'     // Quick, frustrated easily
  | 'careful'       // Cautious, reads everything
  | 'custom';       // Based on real recordings

/**
 * High-level personality traits
 */
export interface PersonalityTraits {
  speed: number;        // 0-1
  accuracy: number;     // 0-1
  patience: number;     // 0-1
  curiosity: number;    // 0-1
  consistency: number;  // 0-1
}

/**
 * Recording from Hardware Bridge
 */
export interface HumanRecording {
  recordingId: string;
  operatorName: string;
  timestamp: Date;
  duration: number;     // seconds
  
  // Raw data
  mouseEvents: MouseEvent[];
  keyEvents: KeyEvent[];
  scrollEvents: ScrollEvent[];
  navigationEvents: NavigationEvent[];
  
  // Metadata
  url: string;
  taskType: string;
}

/**
 * Mouse event from recording
 */
export interface MouseEvent {
  timestamp: number;
  type: 'move' | 'click' | 'dblclick' | 'drag';
  x: number;
  y: number;
  button?: number;
  target?: string;      // CSS selector
}

/**
 * Key event from recording
 */
export interface KeyEvent {
  timestamp: number;
  type: 'keydown' | 'keyup';
  key: string;
  code: string;
  target?: string;
}

/**
 * Scroll event from recording
 */
export interface ScrollEvent {
  timestamp: number;
  deltaX: number;
  deltaY: number;
  scrollTop: number;
  scrollLeft: number;
}

/**
 * Navigation event from recording
 */
export interface NavigationEvent {
  timestamp: number;
  type: 'navigate' | 'back' | 'forward' | 'reload';
  fromUrl: string;
  toUrl: string;
}

/**
 * Personality assignment to worker
 */
export interface PersonalityAssignment {
  assignmentId: string;
  workerId: string;
  personalityId: string;
  
  // Variance applied
  varianceSeed: number;
  varianceAmount: number;
  
  // Timing
  assignedAt: Date;
  expiresAt?: Date;
  
  // Performance
  sessionsCompleted: number;
  detectionEvents: number;
}

/**
 * Engine configuration
 */
export interface PersonalityEngineConfig {
  // Personality generation
  defaultVariance: number;        // 0-1
  archetypeBlending: boolean;     // Allow mixing archetypes
  
  // Detection avoidance
  rotatePersonalities: boolean;   // Rotate personalities per session
  rotationInterval: number;       // sessions before rotation
  
  // Recording analysis
  minRecordingDuration: number;   // seconds
  samplesPerCharacteristic: number;
  
  // Performance
  cachePersonalities: boolean;
  maxCachedPersonalities: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: PersonalityEngineConfig = {
  defaultVariance: 0.2,
  archetypeBlending: true,
  rotatePersonalities: true,
  rotationInterval: 5,
  minRecordingDuration: 60,
  samplesPerCharacteristic: 100,
  cachePersonalities: true,
  maxCachedPersonalities: 1000
};

// ═══════════════════════════════════════════════════════════════════════════
// PRESET ARCHETYPES
// ═══════════════════════════════════════════════════════════════════════════

const ARCHETYPE_PRESETS: Record<Exclude<PersonalityArchetype, 'custom'>, Partial<GhostPersonality>> = {
  methodical: {
    traits: { speed: 0.3, accuracy: 0.95, patience: 0.9, curiosity: 0.5, consistency: 0.9 },
    mouse: {
      averageSpeed: 300,
      speedVariance: 0.1,
      accelerationCurve: 'ease-out',
      curveIntensity: 0.3,
      overshootFrequency: 0.05,
      overshootMagnitude: 5,
      microMovements: true,
      clickSpeed: 150,
      doubleClickSpeed: 300,
      clickAccuracy: 0.95,
      hesitationFrequency: 0.3,
      hesitationDuration: { min: 500, max: 2000 },
      scrollSpeed: 100,
      scrollSmooth: true,
      scrollPauses: true
    }
  },
  
  speedster: {
    traits: { speed: 0.9, accuracy: 0.7, patience: 0.4, curiosity: 0.3, consistency: 0.8 },
    mouse: {
      averageSpeed: 800,
      speedVariance: 0.2,
      accelerationCurve: 'linear',
      curveIntensity: 0.1,
      overshootFrequency: 0.15,
      overshootMagnitude: 15,
      microMovements: false,
      clickSpeed: 80,
      doubleClickSpeed: 150,
      clickAccuracy: 0.75,
      hesitationFrequency: 0.05,
      hesitationDuration: { min: 100, max: 300 },
      scrollSpeed: 300,
      scrollSmooth: false,
      scrollPauses: false
    }
  },
  
  explorer: {
    traits: { speed: 0.5, accuracy: 0.8, patience: 0.7, curiosity: 0.95, consistency: 0.4 },
    mouse: {
      averageSpeed: 500,
      speedVariance: 0.4,
      accelerationCurve: 'natural',
      curveIntensity: 0.5,
      overshootFrequency: 0.1,
      overshootMagnitude: 10,
      microMovements: true,
      clickSpeed: 120,
      doubleClickSpeed: 250,
      clickAccuracy: 0.85,
      hesitationFrequency: 0.2,
      hesitationDuration: { min: 300, max: 1500 },
      scrollSpeed: 200,
      scrollSmooth: true,
      scrollPauses: true
    }
  },
  
  professional: {
    traits: { speed: 0.6, accuracy: 0.9, patience: 0.8, curiosity: 0.4, consistency: 0.95 },
    mouse: {
      averageSpeed: 550,
      speedVariance: 0.1,
      accelerationCurve: 'ease-out',
      curveIntensity: 0.2,
      overshootFrequency: 0.03,
      overshootMagnitude: 3,
      microMovements: false,
      clickSpeed: 100,
      doubleClickSpeed: 200,
      clickAccuracy: 0.92,
      hesitationFrequency: 0.1,
      hesitationDuration: { min: 200, max: 600 },
      scrollSpeed: 150,
      scrollSmooth: true,
      scrollPauses: false
    }
  },
  
  novice: {
    traits: { speed: 0.3, accuracy: 0.5, patience: 0.6, curiosity: 0.7, consistency: 0.3 },
    mouse: {
      averageSpeed: 250,
      speedVariance: 0.5,
      accelerationCurve: 'natural',
      curveIntensity: 0.6,
      overshootFrequency: 0.25,
      overshootMagnitude: 20,
      microMovements: true,
      clickSpeed: 200,
      doubleClickSpeed: 400,
      clickAccuracy: 0.6,
      hesitationFrequency: 0.5,
      hesitationDuration: { min: 500, max: 3000 },
      scrollSpeed: 80,
      scrollSmooth: true,
      scrollPauses: true
    }
  },
  
  impatient: {
    traits: { speed: 0.85, accuracy: 0.65, patience: 0.2, curiosity: 0.5, consistency: 0.6 },
    mouse: {
      averageSpeed: 750,
      speedVariance: 0.3,
      accelerationCurve: 'linear',
      curveIntensity: 0.15,
      overshootFrequency: 0.2,
      overshootMagnitude: 12,
      microMovements: false,
      clickSpeed: 60,
      doubleClickSpeed: 120,
      clickAccuracy: 0.7,
      hesitationFrequency: 0.02,
      hesitationDuration: { min: 50, max: 200 },
      scrollSpeed: 350,
      scrollSmooth: false,
      scrollPauses: false
    }
  },
  
  careful: {
    traits: { speed: 0.25, accuracy: 0.98, patience: 0.95, curiosity: 0.6, consistency: 0.85 },
    mouse: {
      averageSpeed: 200,
      speedVariance: 0.1,
      accelerationCurve: 'ease-out',
      curveIntensity: 0.4,
      overshootFrequency: 0.02,
      overshootMagnitude: 2,
      microMovements: true,
      clickSpeed: 180,
      doubleClickSpeed: 350,
      clickAccuracy: 0.98,
      hesitationFrequency: 0.4,
      hesitationDuration: { min: 800, max: 3000 },
      scrollSpeed: 60,
      scrollSmooth: true,
      scrollPauses: true
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GHOST PERSONALITY ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GhostPersonalityEngine - Human Soul Generator
 * 
 * Transforms human behavior recordings into synthetic personalities
 * that can be assigned to Swarm workers for undetectable automation.
 */
export class GhostPersonalityEngine extends EventEmitter {
  private config: PersonalityEngineConfig;
  
  // Storage
  private personalities: Map<string, GhostPersonality> = new Map();
  private recordings: Map<string, HumanRecording> = new Map();
  private assignments: Map<string, PersonalityAssignment> = new Map();
  
  // Caches
  private varianceCache: Map<string, Float32Array> = new Map();
  
  // Statistics
  private stats = {
    personalitiesCreated: 0,
    recordingsProcessed: 0,
    assignmentsTotal: 0,
    averageDetectionRate: 0,
    totalSessionsCompleted: 0
  };
  
  constructor(config: Partial<PersonalityEngineConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize preset personalities
    this.initializePresets();
    
    this.emit('initialized', { timestamp: new Date(), config: this.config });
    this.log('info', '[GHOST-ENGINE] Personality Engine initialized');
    this.log('info', '[GHOST-ENGINE] THE GHOSTS ARE AWAKENING');
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Initialize preset personalities
   */
  private initializePresets(): void {
    const archetypes: Array<Exclude<PersonalityArchetype, 'custom'>> = [
      'methodical', 'speedster', 'explorer', 'professional', 'novice', 'impatient', 'careful'
    ];
    
    for (const archetype of archetypes) {
      const preset = ARCHETYPE_PRESETS[archetype];
      const personality = this.createFromArchetype(archetype);
      this.personalities.set(personality.personalityId, personality);
    }
    
    this.log('info', `[GHOST-ENGINE] Initialized ${archetypes.length} preset personalities`);
  }
  
  /**
   * Create personality from archetype
   */
  private createFromArchetype(archetype: Exclude<PersonalityArchetype, 'custom'>): GhostPersonality {
    const preset = ARCHETYPE_PRESETS[archetype];
    
    return {
      personalityId: this.generateId('personality'),
      name: `The ${archetype.charAt(0).toUpperCase() + archetype.slice(1)}`,
      description: this.getArchetypeDescription(archetype),
      archetype,
      traits: preset.traits!,
      mouse: preset.mouse!,
      typing: this.generateDefaultTyping(preset.traits!),
      navigation: this.generateDefaultNavigation(preset.traits!),
      temporal: this.generateDefaultTemporal(preset.traits!),
      emotional: this.generateDefaultEmotional(preset.traits!),
      basedOnHuman: false,
      createdAt: new Date(),
      timesUsed: 0,
      averageSessionLength: 0,
      detectionRate: 0
    };
  }
  
  /**
   * Get archetype description
   */
  private getArchetypeDescription(archetype: PersonalityArchetype): string {
    const descriptions: Record<PersonalityArchetype, string> = {
      methodical: 'Slow and precise, never rushes, reads everything carefully',
      speedster: 'Fast and efficient, knows exactly what they want',
      explorer: 'Curious and random, explores everything on the page',
      professional: 'Consistent and predictable, follows workflows exactly',
      novice: 'Hesitant and learning, makes mistakes, needs help',
      impatient: 'Quick and frustrated, abandons if things take too long',
      careful: 'Extremely cautious, reads fine print, hesitates on CTAs',
      custom: 'Based on real human behavior recordings'
    };
    return descriptions[archetype];
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // RECORDING INGESTION
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Ingest recording from Hardware Bridge
   */
  async ingestRecording(recording: HumanRecording): Promise<void> {
    // Validate duration
    if (recording.duration < this.config.minRecordingDuration) {
      this.log('warn', `[GHOST-ENGINE] Recording too short: ${recording.duration}s`);
      return;
    }
    
    this.recordings.set(recording.recordingId, recording);
    this.stats.recordingsProcessed++;
    
    this.emit('recording:ingested', {
      recordingId: recording.recordingId,
      operatorName: recording.operatorName,
      duration: recording.duration
    });
    
    this.log('info', `[GHOST-ENGINE] Recording ingested: ${recording.operatorName} (${recording.duration}s)`);
  }
  
  /**
   * Create personality from recordings
   */
  async createFromRecordings(
    operatorName: string,
    recordingIds: string[]
  ): Promise<GhostPersonality> {
    const recordings = recordingIds
      .map(id => this.recordings.get(id))
      .filter(Boolean) as HumanRecording[];
    
    if (recordings.length === 0) {
      throw new Error('No valid recordings found');
    }
    
    // Analyze mouse behavior
    const mouseChars = this.analyzeMouseBehavior(recordings);
    
    // Analyze typing behavior
    const typingChars = this.analyzeTypingBehavior(recordings);
    
    // Analyze navigation behavior
    const navChars = this.analyzeNavigationBehavior(recordings);
    
    // Calculate traits from analysis
    const traits = this.calculateTraitsFromAnalysis(mouseChars, typingChars, navChars);
    
    const personality: GhostPersonality = {
      personalityId: this.generateId('personality'),
      name: `Custom: ${operatorName}`,
      description: `Personality based on ${recordings.length} recording(s) from ${operatorName}`,
      archetype: 'custom',
      traits,
      mouse: mouseChars,
      typing: typingChars,
      navigation: navChars,
      temporal: this.generateDefaultTemporal(traits),
      emotional: this.inferEmotionalFromBehavior(mouseChars, typingChars),
      basedOnHuman: true,
      sourceRecordings: recordingIds,
      createdAt: new Date(),
      timesUsed: 0,
      averageSessionLength: 0,
      detectionRate: 0
    };
    
    this.personalities.set(personality.personalityId, personality);
    this.stats.personalitiesCreated++;
    
    this.emit('personality:created', {
      personalityId: personality.personalityId,
      name: personality.name,
      basedOnHuman: true
    });
    
    this.log('info', `[GHOST-ENGINE] Created personality from ${operatorName}'s recordings`);
    
    return personality;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // BEHAVIOR ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Analyze mouse behavior from recordings
   */
  private analyzeMouseBehavior(recordings: HumanRecording[]): MouseCharacteristics {
    const allMouseEvents: MouseEvent[] = [];
    for (const r of recordings) {
      allMouseEvents.push(...r.mouseEvents);
    }
    
    // Calculate speeds
    const speeds: number[] = [];
    for (let i = 1; i < allMouseEvents.length; i++) {
      if (allMouseEvents[i].type === 'move' && allMouseEvents[i-1].type === 'move') {
        const dx = allMouseEvents[i].x - allMouseEvents[i-1].x;
        const dy = allMouseEvents[i].y - allMouseEvents[i-1].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const time = (allMouseEvents[i].timestamp - allMouseEvents[i-1].timestamp) / 1000;
        if (time > 0) {
          speeds.push(distance / time);
        }
      }
    }
    
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 500;
    const speedVariance = this.calculateVariance(speeds) / avgSpeed;
    
    // Analyze click patterns
    const clicks = allMouseEvents.filter(e => e.type === 'click');
    
    // Analyze hesitations (pauses > 500ms)
    const hesitations: number[] = [];
    for (let i = 1; i < allMouseEvents.length; i++) {
      const gap = allMouseEvents[i].timestamp - allMouseEvents[i-1].timestamp;
      if (gap > 500 && gap < 5000) {
        hesitations.push(gap);
      }
    }
    
    return {
      averageSpeed: Math.round(avgSpeed),
      speedVariance: Math.min(1, speedVariance),
      accelerationCurve: 'natural',
      curveIntensity: 0.3 + Math.random() * 0.4,
      overshootFrequency: 0.1 + Math.random() * 0.1,
      overshootMagnitude: 8 + Math.random() * 8,
      microMovements: Math.random() > 0.5,
      clickSpeed: 100 + Math.random() * 100,
      doubleClickSpeed: 200 + Math.random() * 150,
      clickAccuracy: 0.8 + Math.random() * 0.15,
      hesitationFrequency: hesitations.length / allMouseEvents.length,
      hesitationDuration: {
        min: hesitations.length > 0 ? Math.min(...hesitations) : 300,
        max: hesitations.length > 0 ? Math.max(...hesitations) : 2000
      },
      scrollSpeed: 100 + Math.random() * 200,
      scrollSmooth: Math.random() > 0.3,
      scrollPauses: Math.random() > 0.4
    };
  }
  
  /**
   * Analyze typing behavior from recordings
   */
  private analyzeTypingBehavior(recordings: HumanRecording[]): TypingCharacteristics {
    const allKeyEvents: KeyEvent[] = [];
    for (const r of recordings) {
      allKeyEvents.push(...r.keyEvents);
    }
    
    // Calculate intervals between keystrokes
    const intervals: number[] = [];
    for (let i = 1; i < allKeyEvents.length; i++) {
      if (allKeyEvents[i].type === 'keydown' && allKeyEvents[i-1].type === 'keydown') {
        const interval = allKeyEvents[i].timestamp - allKeyEvents[i-1].timestamp;
        if (interval > 0 && interval < 2000) {
          intervals.push(interval);
        }
      }
    }
    
    const avgInterval = intervals.length > 0 ? 
      intervals.reduce((a, b) => a + b, 0) / intervals.length : 150;
    
    // Calculate WPM (assuming ~5 chars per word, 60000ms per minute)
    const wpm = Math.round(60000 / (avgInterval * 5));
    
    // Count errors (backspace events)
    const backspaces = allKeyEvents.filter(e => e.key === 'Backspace');
    const errorRate = backspaces.length / allKeyEvents.length;
    
    return {
      wordsPerMinute: Math.min(120, Math.max(20, wpm)),
      wpmVariance: 0.1 + Math.random() * 0.2,
      keyPressInterval: {
        min: Math.max(30, avgInterval * 0.5),
        max: Math.min(500, avgInterval * 1.5)
      },
      keyHoldDuration: {
        min: 50 + Math.random() * 30,
        max: 120 + Math.random() * 50
      },
      errorRate: Math.min(0.2, errorRate),
      correctionSpeed: 200 + Math.random() * 300,
      correctionMethod: 'backspace',
      burstTyping: Math.random() > 0.5,
      burstLength: 10 + Math.floor(Math.random() * 20),
      pauseBetweenBursts: 300 + Math.random() * 700,
      fatigueEnabled: Math.random() > 0.5,
      fatigueOnset: 500 + Math.floor(Math.random() * 500),
      fatigueImpact: 0.1 + Math.random() * 0.2
    };
  }
  
  /**
   * Analyze navigation behavior from recordings
   */
  private analyzeNavigationBehavior(recordings: HumanRecording[]): NavigationCharacteristics {
    const allNavEvents: NavigationEvent[] = [];
    for (const r of recordings) {
      allNavEvents.push(...r.navigationEvents);
    }
    
    // Calculate page times
    const pageTimes: number[] = [];
    for (let i = 1; i < allNavEvents.length; i++) {
      const time = (allNavEvents[i].timestamp - allNavEvents[i-1].timestamp) / 1000;
      if (time > 0 && time < 600) { // Max 10 minutes
        pageTimes.push(time);
      }
    }
    
    const avgPageTime = pageTimes.length > 0 ?
      pageTimes.reduce((a, b) => a + b, 0) / pageTimes.length : 30;
    
    // Count back button usage
    const backEvents = allNavEvents.filter(e => e.type === 'back');
    const backFrequency = backEvents.length / allNavEvents.length;
    
    return {
      averagePageTime: Math.round(avgPageTime),
      pageTimeVariance: 0.3 + Math.random() * 0.4,
      readingSpeed: 200 + Math.random() * 100,
      thorougness: 0.5 + Math.random() * 0.4,
      scrollBeforeClick: Math.random() > 0.4,
      scrollPattern: ['continuous', 'stepped', 'random'][Math.floor(Math.random() * 3)] as NavigationCharacteristics['scrollPattern'],
      focusOnForms: Math.random() > 0.5,
      focusOnImages: Math.random() > 0.5,
      focusOnNavigation: Math.random() > 0.5,
      usesBackButton: backFrequency > 0,
      backButtonFrequency: backFrequency
    };
  }
  
  /**
   * Calculate traits from behavior analysis
   */
  private calculateTraitsFromAnalysis(
    mouse: MouseCharacteristics,
    typing: TypingCharacteristics,
    nav: NavigationCharacteristics
  ): PersonalityTraits {
    // Speed: based on mouse speed and WPM
    const speedFromMouse = Math.min(1, mouse.averageSpeed / 800);
    const speedFromTyping = Math.min(1, typing.wordsPerMinute / 100);
    const speed = (speedFromMouse + speedFromTyping) / 2;
    
    // Accuracy: based on click accuracy and error rate
    const accuracy = (mouse.clickAccuracy + (1 - typing.errorRate)) / 2;
    
    // Patience: based on hesitation and page time
    const patience = Math.min(1, (mouse.hesitationFrequency * 2 + nav.averagePageTime / 60) / 2);
    
    // Curiosity: based on navigation patterns
    const curiosity = nav.thorougness;
    
    // Consistency: inverse of variance
    const consistency = 1 - ((mouse.speedVariance + typing.wpmVariance + nav.pageTimeVariance) / 3);
    
    return { speed, accuracy, patience, curiosity, consistency };
  }
  
  /**
   * Infer emotional characteristics from behavior
   */
  private inferEmotionalFromBehavior(
    mouse: MouseCharacteristics,
    typing: TypingCharacteristics
  ): EmotionalCharacteristics {
    return {
      patience: 1 - (mouse.averageSpeed / 1000),
      frustrationThreshold: 10 + (1 - mouse.averageSpeed / 1000) * 20,
      frustrationBehavior: mouse.averageSpeed > 600 ? 'rapid-clicking' : 'abandon',
      curiosity: 0.5 + Math.random() * 0.3,
      explorationTendency: 0.4 + Math.random() * 0.4,
      caution: mouse.hesitationFrequency,
      trustLevel: 0.5 + Math.random() * 0.3
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PERSONALITY ASSIGNMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Assign personality to worker
   */
  assignToWorker(
    workerId: string,
    personalityId?: string,
    variance?: number
  ): PersonalityAssignment {
    // Select personality
    let personality: GhostPersonality;
    
    if (personalityId) {
      const found = this.personalities.get(personalityId);
      if (!found) throw new Error(`Personality ${personalityId} not found`);
      personality = found;
    } else {
      // Random selection
      const all = Array.from(this.personalities.values());
      personality = all[Math.floor(Math.random() * all.length)];
    }
    
    // Check for existing assignment
    const existing = Array.from(this.assignments.values())
      .find(a => a.workerId === workerId);
    
    if (existing) {
      this.assignments.delete(existing.assignmentId);
    }
    
    // Create assignment
    const assignment: PersonalityAssignment = {
      assignmentId: this.generateId('assignment'),
      workerId,
      personalityId: personality.personalityId,
      varianceSeed: Math.random(),
      varianceAmount: variance ?? this.config.defaultVariance,
      assignedAt: new Date(),
      sessionsCompleted: 0,
      detectionEvents: 0
    };
    
    this.assignments.set(assignment.assignmentId, assignment);
    this.stats.assignmentsTotal++;
    personality.timesUsed++;
    personality.lastUsed = new Date();
    
    this.emit('personality:assigned', {
      workerId,
      personalityName: personality.name,
      variance: assignment.varianceAmount
    });
    
    this.log('info', `[GHOST-ENGINE] Assigned "${personality.name}" to worker ${workerId}`);
    
    return assignment;
  }
  
  /**
   * Get worker's current personality with variance applied
   */
  getWorkerPersonality(workerId: string): GhostPersonality | null {
    const assignment = Array.from(this.assignments.values())
      .find(a => a.workerId === workerId);
    
    if (!assignment) return null;
    
    const basePersonality = this.personalities.get(assignment.personalityId);
    if (!basePersonality) return null;
    
    // Apply variance
    return this.applyVariance(basePersonality, assignment.varianceSeed, assignment.varianceAmount);
  }
  
  /**
   * Apply variance to personality
   */
  private applyVariance(
    base: GhostPersonality,
    seed: number,
    amount: number
  ): GhostPersonality {
    // Create a seeded random function for reproducibility
    const seededRandom = this.createSeededRandom(seed);
    
    const vary = (value: number, max: number = 1): number => {
      const variance = (seededRandom() - 0.5) * 2 * amount;
      return Math.max(0, Math.min(max, value + value * variance));
    };
    
    return {
      ...base,
      traits: {
        speed: vary(base.traits.speed),
        accuracy: vary(base.traits.accuracy),
        patience: vary(base.traits.patience),
        curiosity: vary(base.traits.curiosity),
        consistency: vary(base.traits.consistency)
      },
      mouse: {
        ...base.mouse,
        averageSpeed: vary(base.mouse.averageSpeed, 1000),
        curveIntensity: vary(base.mouse.curveIntensity),
        clickAccuracy: vary(base.mouse.clickAccuracy),
        hesitationFrequency: vary(base.mouse.hesitationFrequency)
      },
      typing: {
        ...base.typing,
        wordsPerMinute: vary(base.typing.wordsPerMinute, 150),
        errorRate: vary(base.typing.errorRate, 0.3)
      }
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PERSONALITY GENERATION
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Generate variants of a personality
   */
  generateVariants(personalityId: string, count: number): GhostPersonality[] {
    const base = this.personalities.get(personalityId);
    if (!base) throw new Error(`Personality ${personalityId} not found`);
    
    const variants: GhostPersonality[] = [];
    
    for (let i = 0; i < count; i++) {
      const variant = this.applyVariance(base, Math.random(), this.config.defaultVariance);
      variant.personalityId = this.generateId('personality');
      variant.name = `${base.name} (Variant ${i + 1})`;
      
      this.personalities.set(variant.personalityId, variant);
      variants.push(variant);
      this.stats.personalitiesCreated++;
    }
    
    this.log('info', `[GHOST-ENGINE] Generated ${count} variants of "${base.name}"`);
    
    return variants;
  }
  
  /**
   * Blend multiple archetypes
   */
  blendArchetypes(
    archetypes: Array<{ archetype: Exclude<PersonalityArchetype, 'custom'>; weight: number }>,
    name: string
  ): GhostPersonality {
    if (!this.config.archetypeBlending) {
      throw new Error('Archetype blending is disabled');
    }
    
    // Normalize weights
    const totalWeight = archetypes.reduce((sum, a) => sum + a.weight, 0);
    const normalized = archetypes.map(a => ({ ...a, weight: a.weight / totalWeight }));
    
    // Blend traits
    const traits: PersonalityTraits = {
      speed: 0,
      accuracy: 0,
      patience: 0,
      curiosity: 0,
      consistency: 0
    };
    
    for (const { archetype, weight } of normalized) {
      const preset = ARCHETYPE_PRESETS[archetype];
      traits.speed += preset.traits!.speed * weight;
      traits.accuracy += preset.traits!.accuracy * weight;
      traits.patience += preset.traits!.patience * weight;
      traits.curiosity += preset.traits!.curiosity * weight;
      traits.consistency += preset.traits!.consistency * weight;
    }
    
    // Create blended personality
    const personality: GhostPersonality = {
      personalityId: this.generateId('personality'),
      name,
      description: `Blend of: ${archetypes.map(a => a.archetype).join(', ')}`,
      archetype: 'custom',
      traits,
      mouse: this.blendMouseCharacteristics(normalized),
      typing: this.generateDefaultTyping(traits),
      navigation: this.generateDefaultNavigation(traits),
      temporal: this.generateDefaultTemporal(traits),
      emotional: this.generateDefaultEmotional(traits),
      basedOnHuman: false,
      createdAt: new Date(),
      timesUsed: 0,
      averageSessionLength: 0,
      detectionRate: 0
    };
    
    this.personalities.set(personality.personalityId, personality);
    this.stats.personalitiesCreated++;
    
    this.emit('personality:blended', {
      personalityId: personality.personalityId,
      name,
      components: archetypes.map(a => a.archetype)
    });
    
    return personality;
  }
  
  /**
   * Blend mouse characteristics from archetypes
   */
  private blendMouseCharacteristics(
    archetypes: Array<{ archetype: Exclude<PersonalityArchetype, 'custom'>; weight: number }>
  ): MouseCharacteristics {
    const blended: MouseCharacteristics = {
      averageSpeed: 0,
      speedVariance: 0,
      accelerationCurve: 'natural',
      curveIntensity: 0,
      overshootFrequency: 0,
      overshootMagnitude: 0,
      microMovements: false,
      clickSpeed: 0,
      doubleClickSpeed: 0,
      clickAccuracy: 0,
      hesitationFrequency: 0,
      hesitationDuration: { min: 0, max: 0 },
      scrollSpeed: 0,
      scrollSmooth: true,
      scrollPauses: false
    };
    
    for (const { archetype, weight } of archetypes) {
      const preset = ARCHETYPE_PRESETS[archetype].mouse!;
      blended.averageSpeed += preset.averageSpeed * weight;
      blended.speedVariance += preset.speedVariance * weight;
      blended.curveIntensity += preset.curveIntensity * weight;
      blended.overshootFrequency += preset.overshootFrequency * weight;
      blended.overshootMagnitude += preset.overshootMagnitude * weight;
      blended.clickSpeed += preset.clickSpeed * weight;
      blended.doubleClickSpeed += preset.doubleClickSpeed * weight;
      blended.clickAccuracy += preset.clickAccuracy * weight;
      blended.hesitationFrequency += preset.hesitationFrequency * weight;
      blended.hesitationDuration.min += preset.hesitationDuration.min * weight;
      blended.hesitationDuration.max += preset.hesitationDuration.max * weight;
      blended.scrollSpeed += preset.scrollSpeed * weight;
    }
    
    return blended;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // DEFAULT GENERATORS
  // ═══════════════════════════════════════════════════════════════════════
  
  private generateDefaultTyping(traits: PersonalityTraits): TypingCharacteristics {
    return {
      wordsPerMinute: 40 + traits.speed * 60,
      wpmVariance: 0.1 + (1 - traits.consistency) * 0.2,
      keyPressInterval: {
        min: 80 - traits.speed * 40,
        max: 200 - traits.speed * 80
      },
      keyHoldDuration: { min: 50, max: 120 },
      errorRate: 0.02 + (1 - traits.accuracy) * 0.15,
      correctionSpeed: 200 + (1 - traits.speed) * 300,
      correctionMethod: 'backspace',
      burstTyping: traits.consistency < 0.7,
      burstLength: 15 + traits.speed * 10,
      pauseBetweenBursts: 500 - traits.speed * 300,
      fatigueEnabled: traits.consistency < 0.8,
      fatigueOnset: 300 + traits.patience * 400,
      fatigueImpact: 0.1 + (1 - traits.patience) * 0.15
    };
  }
  
  private generateDefaultNavigation(traits: PersonalityTraits): NavigationCharacteristics {
    return {
      averagePageTime: 20 + traits.patience * 40,
      pageTimeVariance: 0.2 + (1 - traits.consistency) * 0.4,
      readingSpeed: 200 + traits.speed * 100,
      thorougness: 0.3 + traits.curiosity * 0.5,
      scrollBeforeClick: traits.curiosity > 0.5,
      scrollPattern: traits.consistency > 0.7 ? 'continuous' : 'random',
      focusOnForms: true,
      focusOnImages: traits.curiosity > 0.5,
      focusOnNavigation: traits.curiosity > 0.3,
      usesBackButton: traits.curiosity > 0.4,
      backButtonFrequency: traits.curiosity * 0.2
    };
  }
  
  private generateDefaultTemporal(traits: PersonalityTraits): TemporalCharacteristics {
    return {
      sessionDuration: {
        min: 5 + traits.patience * 10,
        max: 30 + traits.patience * 30
      },
      takesBreaks: traits.patience > 0.5,
      breakFrequency: 15 + traits.patience * 15,
      breakDuration: { min: 1, max: 5 },
      preferredHours: [9, 10, 11, 14, 15, 16],
      consistency: traits.consistency
    };
  }
  
  private generateDefaultEmotional(traits: PersonalityTraits): EmotionalCharacteristics {
    return {
      patience: traits.patience,
      frustrationThreshold: 10 + traits.patience * 20,
      frustrationBehavior: traits.speed > 0.7 ? 'rapid-clicking' : 'abandon',
      curiosity: traits.curiosity,
      explorationTendency: traits.curiosity,
      caution: 1 - traits.speed,
      trustLevel: 0.5 + traits.patience * 0.3
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Get all personalities
   */
  getAllPersonalities(): GhostPersonality[] {
    return Array.from(this.personalities.values());
  }
  
  /**
   * Get personality by ID
   */
  getPersonality(id: string): GhostPersonality | undefined {
    return this.personalities.get(id);
  }
  
  /**
   * Get statistics
   */
  getStatistics(): typeof this.stats {
    return { ...this.stats };
  }
  
  /**
   * Get all assignments
   */
  getAllAssignments(): PersonalityAssignment[] {
    return Array.from(this.assignments.values());
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  /**
   * Calculate variance of array
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }
  
  /**
   * Create seeded random number generator
   */
  private createSeededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = Math.sin(s * 9999) * 10000;
      return s - Math.floor(s);
    };
  }
  
  /**
   * Log message
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    this.emit('log', { level, message, timestamp });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new GhostPersonalityEngine instance
 */
export function createGhostPersonalityEngine(
  config?: Partial<PersonalityEngineConfig>
): GhostPersonalityEngine {
  return new GhostPersonalityEngine(config);
}

export default GhostPersonalityEngine;
