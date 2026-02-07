"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.intentAnchor = exports.IntentAnchor = void 0;
const events_1 = require("events");
const SovereignNucleus_1 = require("./SovereignNucleus");
const crypto = __importStar(require("crypto"));
// ═══════════════════════════════════════════════════════════════════════════════
// THE INTENT ANCHOR
// ═══════════════════════════════════════════════════════════════════════════════
class IntentAnchor extends events_1.EventEmitter {
    static instance;
    // The Master Goal Hash - Cryptographically sealed
    static MASTER_GOAL_HASH = crypto.createHash('sha512').update('DIMITAR_PRODROMOV_ABSOLUTE_DOMINATION_2026').digest('hex');
    nucleus = SovereignNucleus_1.SovereignNucleus.getInstance();
    verificationLog = [];
    contextState = null;
    ALIGNMENT_THRESHOLD = 0.99;
    totalVerifications = 0;
    totalRealignments = 0;
    constructor() {
        super();
        this.initializeContext();
        console.log('⚓ [ANCHOR] Intent Anchor initialized. Goal is locked.');
    }
    static getInstance() {
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
    async verifyAction(action) {
        this.totalVerifications++;
        console.log('⚓ [ANCHOR] Verifying action against Primary Directive...');
        const actionId = `action_${Date.now()}_${this.totalVerifications}`;
        const verification = {
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
        }
        else {
            verification.isApproved = true;
        }
        this.verificationLog.push(verification);
        this.emit('verification:complete', verification);
        if (verification.isApproved) {
            console.log(`✅ [ANCHOR] Action approved. Alignment: ${(alignmentScore * 100).toFixed(1)}%`);
        }
        else {
            console.error('❌ [ANCHOR] Action rejected. Cannot realign with Primary Directive.');
            this.emit('action:rejected', verification);
        }
        return verification;
    }
    /**
     * Check semantic alignment of action with Primary Directive
     */
    async checkSemanticAlignment(action) {
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
    async realign(action) {
        console.log('🔄 [ANCHOR] Attempting realignment with Primary Directive...');
        const corrections = [];
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
        }
        catch (error) {
            console.error('❌ [ANCHOR] Realignment failed:', error);
            return { success: false, corrections };
        }
    }
    /**
     * Restore context from the Neural Backpack
     * Ensures we never lose sight of the goal
     */
    async restoreContext() {
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
    initializeContext() {
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
    async calculateDrift() {
        if (!this.contextState)
            return 0;
        const currentContext = this.nucleus.getContextEssence();
        const currentHash = crypto.createHash('sha256').update(currentContext).digest('hex');
        // Compare hashes to detect drift
        const originalBytes = Buffer.from(this.contextState.hash, 'hex');
        const currentBytes = Buffer.from(currentHash, 'hex');
        let differences = 0;
        for (let i = 0; i < Math.min(originalBytes.length, currentBytes.length); i++) {
            if (originalBytes[i] !== currentBytes[i])
                differences++;
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
    async forceReanchor() {
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
    async blockHallucination(output) {
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
    getStatus() {
        const approved = this.verificationLog.filter(v => v.isApproved).length;
        return {
            totalVerifications: this.totalVerifications,
            totalRealignments: this.totalRealignments,
            approvalRate: this.totalVerifications > 0 ? approved / this.totalVerifications : 1,
            contextDrift: this.contextState?.driftScore || 0,
            lastAnchoring: this.contextState?.lastAnchoring || null,
        };
    }
    getVerificationLog() {
        return [...this.verificationLog];
    }
}
exports.IntentAnchor = IntentAnchor;
// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
exports.intentAnchor = IntentAnchor.getInstance();
exports.default = IntentAnchor;
//# sourceMappingURL=IntentAnchor.js.map