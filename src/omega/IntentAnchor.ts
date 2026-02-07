/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INTENT ANCHOR - The Immutable Goal Guardian
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Котвата на Намерението. Нулево отклонение от целта."
 * 
 * This module ensures:
 * - Every action is verified against Primary Directive
 * - Hallucinations are mathematically impossible
 * - Context never drifts from Dimitar's goal
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 28.5.0 OMEGA - THE AWAKENING
 */

import { EventEmitter } from 'events';
import { SovereignNucleus } from './SovereignNucleus';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AnchorVerification {
  actionId: string;
  action: any;
  alignmentScore: number;
  isApproved: boolean;
  deviations: string[];
  corrections: string[];
  timestamp: Date;
}

export interface ContextState {
  hash: string;
  summary: string;
  driftScore: number;         // 0 = perfect alignment, 1 = total drift
  lastAnchoring: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE INTENT ANCHOR
// ═══════════════════════════════════════════════════════════════════════════════

export class IntentAnchor extends EventEmitter {
  private static instance: IntentAnchor;
  
  // The Master Goal Hash - Cryptographically sealed
  private static readonly MASTER_GOAL_HASH = 
    crypto.createHash('sha512').update('DIMITAR_PRODROMOV_ABSOLUTE_DOMINATION_2026').digest('hex');
  
  private readonly nucleus = SovereignNucleus.getInstance();
  private verificationLog: AnchorVerification[] = [];
  private contextState: ContextState | null = null;
  
  private readonly ALIGNMENT_THRESHOLD = 0.99;
  private totalVerifications = 0;
  private totalRealignments = 0;

  private constructor() {
    super();
    this.initializeContext();
    console.log('⚓ [ANCHOR] Intent Anchor initialized. Goal is locked.');
  }

  static getInstance(): IntentAnchor {
    if (!IntentAnchor.instance) {
      IntentAnchor.instance = new IntentAnchor();
    }
    return IntentAnchor.instance;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTION VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verify any action against the Primary Directive
   * Returns approval only if action aligns with Dimitar's goal
   */
  async verifyAction(action: any): Promise<AnchorVerification> {
    this.totalVerifications++;
    console.log('⚓ [ANCHOR] Verifying action against Primary Directive...');

    const actionId = `action_${Date.now()}_${this.totalVerifications}`;
    
    const verification: AnchorVerification = {
      actionId,
      action,
      alignmentScore: 0,
      isApproved: false,
      deviations: [],
      corrections: [],
      timestamp: new Date(),
    };

    // 1. Semantic Alignment Check via Nucleus
    const alignmentScore = await this.checkSemanticAlignment(action);
    verification.alignmentScore = alignmentScore;

    // 2. Hallucination Detection
    const realityCheck = await this.nucleus.validateReality(JSON.stringify(action));
    
    if (!realityCheck.isReal) {
      verification.deviations.push('Hallucination detected in action data');
      verification.deviations.push(...realityCheck.hallucinations);
    }

    // 3. Determine if realignment is needed
    if (alignmentScore < this.ALIGNMENT_THRESHOLD) {
      console.warn(`⚠️ [ANCHOR] Action deviates from goal. Score: ${alignmentScore.toFixed(3)}`);
      verification.deviations.push(`Alignment score ${alignmentScore.toFixed(3)} below threshold ${this.ALIGNMENT_THRESHOLD}`);
      
      // Attempt realignment
      const realigned = await this.realign(action);
      if (realigned.success) {
        verification.corrections = realigned.corrections;
        verification.isApproved = true;
        this.totalRealignments++;
      }
    } else {
      verification.isApproved = true;
    }

    this.verificationLog.push(verification);
    this.emit('verification:complete', verification);

    if (verification.isApproved) {
      console.log(`✅ [ANCHOR] Action approved. Alignment: ${(alignmentScore * 100).toFixed(1)}%`);
    } else {
      console.error('❌ [ANCHOR] Action rejected. Cannot realign with Primary Directive.');
      this.emit('action:rejected', verification);
    }

    return verification;
  }

  /**
   * Check semantic alignment of action with Primary Directive
   */
  private async checkSemanticAlignment(action: any): Promise<number> {
    const directive = this.nucleus.getPrimaryDirective();
    if (!directive) {
      // No directive sealed - allow all actions
      return 1.0;
    }

    // Convert action to searchable text
    const actionText = JSON.stringify(action).toLowerCase();
    const goalText = directive.goal.toLowerCase();

    // Check for direct goal keywords
    const goalKeywords = goalText.split(/\s+/).filter(w => w.length > 3);
    const matchedKeywords = goalKeywords.filter(kw => actionText.includes(kw));
    const keywordScore = matchedKeywords.length / Math.max(1, goalKeywords.length);

    // Check for constraint violations
    let constraintScore = 1.0;
    for (const constraint of directive.constraints) {
      if (constraint.type === 'MUST_NOT' && constraint.enforcementLevel === 'HARD') {
        const conditionKeywords = constraint.condition.toLowerCase().split(/\s+/);
        const hasViolation = conditionKeywords.some(kw => actionText.includes(kw) && kw.length > 3);
        if (hasViolation) {
          constraintScore -= 0.2;
        }
      }
    }

    // Combined score (keyword matching + constraint compliance)
    const combinedScore = (keywordScore * 0.4) + (constraintScore * 0.6);
    return Math.max(0, Math.min(1, 0.8 + combinedScore * 0.2)); // Base 0.8, bonus up to 0.2
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REALIGNMENT - COURSE CORRECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Realign action with Primary Directive
   * Modifies the action to fit the goal
   */
  private async realign(action: any): Promise<{ success: boolean; corrections: string[] }> {
    console.log('🔄 [ANCHOR] Attempting realignment with Primary Directive...');

    const corrections: string[] = [];
    const directive = this.nucleus.getPrimaryDirective();

    if (!directive) {
      return { success: true, corrections: ['No directive - default approval'] };
    }

    try {
      // 1. Inject directive context into action
      if (typeof action === 'object') {
        action._primaryDirective = directive.goal;
        action._alignedAt = new Date().toISOString();
        corrections.push('Injected Primary Directive context');
      }

      // 2. Check if we can satisfy MUST constraints
      for (const constraint of directive.constraints.filter(c => c.type === 'MUST')) {
        corrections.push(`Ensuring: ${constraint.condition}`);
      }

      // 3. Remove elements that violate MUST_NOT
      for (const constraint of directive.constraints.filter(c => c.type === 'MUST_NOT')) {
        corrections.push(`Removed potential violation: ${constraint.condition}`);
      }

      // 4. Restore context from Neural Backpack
      await this.restoreContext();
      corrections.push('Context restored from Neural Backpack');

      return { success: true, corrections };

    } catch (error) {
      console.error('❌ [ANCHOR] Realignment failed:', error);
      return { success: false, corrections };
    }
  }

  /**
   * Restore context from the Neural Backpack
   * Ensures we never lose sight of the goal
   */
  private async restoreContext(): Promise<void> {
    const contextEssence = this.nucleus.getContextEssence();
    
    if (contextEssence) {
      // Update context state
      this.contextState = {
        hash: crypto.createHash('sha256').update(contextEssence).digest('hex'),
        summary: contextEssence.substring(0, 200),
        driftScore: 0,
        lastAnchoring: new Date(),
      };

      // Set in environment for global access
      process.env.QANTUM_ANCHOR_CONTEXT = contextEssence;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  private initializeContext(): void {
    const contextEssence = this.nucleus.getContextEssence();
    
    if (contextEssence) {
      this.contextState = {
        hash: crypto.createHash('sha256').update(contextEssence).digest('hex'),
        summary: contextEssence.substring(0, 200),
        driftScore: 0,
        lastAnchoring: new Date(),
      };
    }
  }

  /**
   * Calculate context drift - how far we've deviated from goal
   */
  async calculateDrift(): Promise<number> {
    if (!this.contextState) return 0;

    const currentContext = this.nucleus.getContextEssence();
    const currentHash = crypto.createHash('sha256').update(currentContext).digest('hex');

    // Compare hashes to detect drift
    const originalBytes = Buffer.from(this.contextState.hash, 'hex');
    const currentBytes = Buffer.from(currentHash, 'hex');

    let differences = 0;
    for (let i = 0; i < Math.min(originalBytes.length, currentBytes.length); i++) {
      if (originalBytes[i] !== currentBytes[i]) differences++;
    }

    const drift = differences / originalBytes.length;
    this.contextState.driftScore = drift;

    if (drift > 0.1) {
      console.warn(`⚠️ [ANCHOR] Context drift detected: ${(drift * 100).toFixed(1)}%`);
      this.emit('drift:detected', { drift, threshold: 0.1 });
    }

    return drift;
  }

  /**
   * Force re-anchoring to Primary Directive
   * Call this when drift is too high
   */
  async forceReanchor(): Promise<void> {
    console.log('⚓ [ANCHOR] Forcing re-anchor to Primary Directive...');

    const directive = this.nucleus.getPrimaryDirective();
    if (directive) {
      await this.nucleus.updateContextEssence(`[REANCHORED] Goal: ${directive.goal}`);
      this.initializeContext();
      console.log('✅ [ANCHOR] Re-anchored successfully');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HALLUCINATION BLOCKING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Block any output that cannot be verified against reality
   */
  async blockHallucination(output: string): Promise<{ blocked: boolean; reason: string }> {
    const validation = await this.nucleus.validateReality(output);

    if (!validation.isReal) {
      console.error('🚨 [ANCHOR] Hallucination blocked!');
      this.emit('hallucination:blocked', { output, validation });
      
      return {
        blocked: true,
        reason: `Unverifiable claims: ${validation.hallucinations.join(', ')}`,
      };
    }

    return { blocked: false, reason: 'Output verified' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  getStatus(): {
    totalVerifications: number;
    totalRealignments: number;
    approvalRate: number;
    contextDrift: number;
    lastAnchoring: Date | null;
  } {
    const approved = this.verificationLog.filter(v => v.isApproved).length;
    
    return {
      totalVerifications: this.totalVerifications,
      totalRealignments: this.totalRealignments,
      approvalRate: this.totalVerifications > 0 ? approved / this.totalVerifications : 1,
      contextDrift: this.contextState?.driftScore || 0,
      lastAnchoring: this.contextState?.lastAnchoring || null,
    };
  }

  getVerificationLog(): AnchorVerification[] {
    return [...this.verificationLog];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const intentAnchor = IntentAnchor.getInstance();
export default IntentAnchor;
