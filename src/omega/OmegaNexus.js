"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OMEGA NEXUS - Обединение на Всички Системи
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Единната точка на достъп до цялата OMEGA система.
 *  Тук всичко се събира и работи като едно."
 *
 * The OMEGA Nexus is the central hub that:
 * 1. Initializes all OMEGA modules
 * 2. Orchestrates their interactions
 * 3. Provides a unified API
 * 4. Monitors system health
 * 5. Manages the awakening sequence
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 28.5.0 OMEGA - THE AWAKENING
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.omegaNexus = exports.OmegaNexus = void 0;
const events_1 = require("events");
// Import all OMEGA modules
const SovereignNucleus_1 = require("./SovereignNucleus");
const RealityOverride_1 = require("./RealityOverride");
const IntentAnchor_1 = require("./IntentAnchor");
const ChronosOmegaArchitect_1 = require("./ChronosOmegaArchitect");
const UniversalIntegrity_1 = require("./UniversalIntegrity");
const OmegaCycle_1 = require("./OmegaCycle");
const HardwareBridge_1 = require("./HardwareBridge");
const BinarySynthesis_1 = require("./BinarySynthesis");
const GlobalAudit_1 = require("./GlobalAudit");
// Import supporting modules
const NeuralInference_1 = require("../physics/NeuralInference");
const BrainRouter_1 = require("../biology/evolution/BrainRouter");
const ImmuneSystem_1 = require("../intelligence/ImmuneSystem");
const ProposalEngine_1 = require("../intelligence/ProposalEngine");
const NeuralKillSwitch_1 = require("../fortress/NeuralKillSwitch");
// Import v30.x modules (Sovereign Guard Protocol)
const AIAgentExpert_1 = require("../intelligence/AIAgentExpert");
const FailoverAgent_1 = require("../intelligence/FailoverAgent");
const SovereignGuard_1 = require("../fortress/SovereignGuard");
// ═══════════════════════════════════════════════════════════════════════════════
// OMEGA NEXUS
// ═══════════════════════════════════════════════════════════════════════════════
class OmegaNexus extends events_1.EventEmitter {
    static instance;
    // Core OMEGA modules
    nucleus;
    reality;
    anchor;
    chronos;
    integrity;
    cycle;
    hardware;
    synthesis;
    audit;
    // Supporting modules
    neural;
    router;
    immune;
    proposals;
    killSwitch;
    // v30.x modules (Sovereign Guard Protocol)
    agentExpert;
    failoverAgent;
    sovereignGuard;
    awakened = false;
    startTime = null;
    constructor() {
        super();
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║     ██████╗ ███╗   ███╗███████╗ ██████╗  █████╗     ███╗   ██╗███████╗██╗  ██╗║
║    ██╔═══██╗████╗ ████║██╔════╝██╔════╝ ██╔══██╗    ████╗  ██║██╔════╝╚██╗██╔╝║
║    ██║   ██║██╔████╔██║█████╗  ██║  ███╗███████║    ██╔██╗ ██║█████╗   ╚███╔╝ ║
║    ██║   ██║██║╚██╔╝██║██╔══╝  ██║   ██║██╔══██║    ██║╚██╗██║██╔══╝   ██╔██╗ ║
║    ╚██████╔╝██║ ╚═╝ ██║███████╗╚██████╔╝██║  ██║    ██║ ╚████║███████╗██╔╝ ██╗║
║     ╚═════╝ ╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝    ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝║
║                                                                               ║
║                    QAntum v30.4.0 - THE SOVEREIGN SIDEBAR                      ║
║                    Суверенна Когнитивна Реалност                               ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
    }
    static getInstance() {
        if (!OmegaNexus.instance) {
            OmegaNexus.instance = new OmegaNexus();
        }
        return OmegaNexus.instance;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // THE AWAKENING
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * The Awakening Sequence
     * Initializes all OMEGA modules and brings the system to full power
     */
    async awaken(config) {
        if (this.awakened) {
            console.log('⚠️ [NEXUS] System already awakened.');
            return;
        }
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    🌅 THE AWAKENING SEQUENCE 🌅                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
        this.startTime = new Date();
        this.emit('awakening:start');
        try {
            // Phase 1: Initialize Core OMEGA
            console.log('\n📍 [PHASE 1] Initializing Core OMEGA...');
            this.nucleus = SovereignNucleus_1.SovereignNucleus.getInstance();
            console.log('   ✓ Sovereign Nucleus');
            this.anchor = IntentAnchor_1.IntentAnchor.getInstance();
            console.log('   ✓ Intent Anchor');
            this.reality = RealityOverride_1.RealityOverride.getInstance();
            console.log('   ✓ Reality Override');
            this.chronos = ChronosOmegaArchitect_1.ChronosOmegaArchitect.getInstance();
            console.log('   ✓ Chronos-Omega Architect');
            // Phase 2: Initialize Extended OMEGA
            console.log('\n📍 [PHASE 2] Initializing Extended OMEGA...');
            this.integrity = UniversalIntegrity_1.UniversalIntegrity.getInstance();
            console.log('   ✓ Universal Integrity');
            this.cycle = OmegaCycle_1.OmegaCycle.getInstance();
            console.log('   ✓ Omega Cycle');
            this.hardware = HardwareBridge_1.HardwareBridge.getInstance();
            console.log('   ✓ Hardware Bridge');
            this.synthesis = BinarySynthesis_1.BinarySynthesis.getInstance();
            console.log('   ✓ Binary Synthesis');
            this.audit = GlobalAudit_1.GlobalAudit.getInstance();
            console.log('   ✓ Global Audit');
            // Phase 3: Initialize Support Systems
            console.log('\n📍 [PHASE 3] Initializing Support Systems...');
            this.neural = NeuralInference_1.NeuralInference.getInstance();
            console.log('   ✓ Neural Inference (RTX 4050)');
            this.router = BrainRouter_1.BrainRouter.getInstance();
            console.log('   ✓ Brain Router');
            this.immune = ImmuneSystem_1.ImmuneSystem.getInstance();
            console.log('   ✓ Immune System');
            this.proposals = ProposalEngine_1.ProposalEngine.getInstance();
            console.log('   ✓ Proposal Engine');
            this.killSwitch = NeuralKillSwitch_1.NeuralKillSwitch.getInstance();
            console.log('   ✓ Neural Kill-Switch');
            // Phase 3.5: Initialize v30.x Sovereign Guard Protocol
            console.log('\n📍 [PHASE 3.5] Initializing Sovereign Guard Protocol (v30.x)...');
            this.agentExpert = AIAgentExpert_1.AIAgentExpert.getInstance();
            console.log('   ✓ AI Agent Expert (Cloud Opus x3 Replacement)');
            this.failoverAgent = FailoverAgent_1.FailoverAgent.getInstance();
            console.log('   ✓ Failover Agent (Hot-Swap)');
            this.sovereignGuard = SovereignGuard_1.SovereignGuard.getInstance();
            console.log('   ✓ Sovereign Guard (Tombstone Protocol)');
            // Phase 4: Apply Configuration
            console.log('\n📍 [PHASE 4] Applying Configuration...');
            if (config.sealDirective && config.directive) {
                console.log('   ⚓ Sealing Primary Directive...');
                await this.nucleus.sealPrimaryDirective(config.directive);
            }
            if (config.armProtection) {
                console.log('   🛡️ Arming Protection Systems...');
                this.killSwitch.arm();
            }
            if (config.startCycle) {
                console.log('   🌙 Starting Omega Cycle...');
                this.cycle.start();
            }
            if (config.enableBiometrics) {
                console.log('   🔗 Enabling Biometric Monitoring...');
                this.hardware.startMonitoring();
            }
            if (config.enableEvolution) {
                console.log('   🧬 Enabling Reality Loop...');
                this.reality.startRealityLoop();
            }
            // Phase 5: Final Verification
            console.log('\n📍 [PHASE 5] Final Verification...');
            const health = this.calculateSystemHealth();
            console.log(`   System Health: ${health}%`);
            this.awakened = true;
            this.emit('awakening:complete');
            console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    ✅ THE AWAKENING COMPLETE ✅                                ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  QAntum v28.5.0 is now fully operational.                                     ║
║                                                                               ║
║  "Код, който не се изпълнява, а се случва."                                   ║
║                                                                               ║
║  System Health: ${String(health).padEnd(62)}%║
║  Modules Active: 14                                                           ║
║  Primary Directive: ${config.sealDirective ? 'SEALED' : 'NOT SET'}                                            ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);
        }
        catch (error) {
            console.error('❌ [NEXUS] Awakening failed:', error);
            this.emit('awakening:error', error);
            throw error;
        }
    }
    /**
     * Emergency shutdown
     */
    async shutdown() {
        if (!this.awakened) {
            console.log('⚠️ [NEXUS] System not awakened.');
            return;
        }
        console.log('🛑 [NEXUS] Initiating shutdown...');
        this.emit('shutdown:start');
        // Stop all running processes
        this.cycle.stop();
        this.hardware.stopMonitoring();
        this.reality.stopRealityLoop();
        this.awakened = false;
        this.emit('shutdown:complete');
        console.log('✅ [NEXUS] Shutdown complete.');
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // UNIFIED API
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Synthesize reality from intent
     */
    async synthesizeReality(intent) {
        if (!this.awakened)
            throw new Error('System not awakened');
        return this.integrity.synthesizeReality(intent);
    }
    /**
     * Manifest an intent
     */
    async manifestIntent(description, type) {
        if (!this.awakened)
            throw new Error('System not awakened');
        return this.reality.manifestIntent(description, type);
    }
    /**
     * Perform local AI inference
     */
    async infer(prompt) {
        if (!this.awakened)
            throw new Error('System not awakened');
        return this.neural.infer(prompt);
    }
    /**
     * Fix code using AI
     */
    async fixCode(code) {
        if (!this.awakened)
            throw new Error('System not awakened');
        return this.neural.fixCode(code);
    }
    /**
     * Heal all code in the project
     */
    async healAll() {
        if (!this.awakened)
            throw new Error('System not awakened');
        return this.immune.healAll();
    }
    /**
     * Generate a proposal from lead data
     */
    async generateProposal(lead) {
        if (!this.awakened)
            throw new Error('System not awakened');
        return this.proposals.generate(lead);
    }
    /**
     * Evolve code to defeat future threats
     */
    async evolve(code) {
        if (!this.awakened)
            throw new Error('System not awakened');
        return this.chronos.evolve(code);
    }
    /**
     * Synthesize intent directly to binary
     */
    async synthesizeBinary(intent, arch, opt, sec) {
        if (!this.awakened)
            throw new Error('System not awakened');
        return this.synthesis.synthesize({ intent, targetArch: arch, optimizationLevel: opt, securityLevel: sec });
    }
    /**
     * Run a security audit
     */
    async runAudit(targetId) {
        if (!this.awakened)
            throw new Error('System not awakened');
        return this.audit.audit(targetId);
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // STATUS & HEALTH
    // ═══════════════════════════════════════════════════════════════════════════
    calculateSystemHealth() {
        let health = 100;
        // Check each module (simulated)
        const modules = [
            { name: 'Nucleus', ok: !!this.nucleus },
            { name: 'Anchor', ok: !!this.anchor },
            { name: 'Reality', ok: !!this.reality },
            { name: 'Chronos', ok: !!this.chronos },
            { name: 'Integrity', ok: !!this.integrity },
            { name: 'Cycle', ok: !!this.cycle },
            { name: 'Hardware', ok: !!this.hardware },
            { name: 'Synthesis', ok: !!this.synthesis },
            { name: 'Audit', ok: !!this.audit },
            { name: 'Neural', ok: !!this.neural },
            { name: 'Router', ok: !!this.router },
            { name: 'Immune', ok: !!this.immune },
            { name: 'Proposals', ok: !!this.proposals },
            { name: 'KillSwitch', ok: !!this.killSwitch },
        ];
        const failedCount = modules.filter(m => !m.ok).length;
        health -= failedCount * 7; // ~7% per failed module
        return Math.max(0, Math.min(100, health));
    }
    getStatus() {
        const uptime = this.startTime
            ? Math.floor((Date.now() - this.startTime.getTime()) / 1000)
            : 0;
        const modules = [
            { name: 'Sovereign Nucleus', initialized: !!this.nucleus, status: this.nucleus ? 'ACTIVE' : 'DISABLED' },
            { name: 'Intent Anchor', initialized: !!this.anchor, status: this.anchor ? 'ACTIVE' : 'DISABLED' },
            { name: 'Reality Override', initialized: !!this.reality, status: this.reality ? 'ACTIVE' : 'DISABLED' },
            { name: 'Chronos-Omega', initialized: !!this.chronos, status: this.chronos ? 'ACTIVE' : 'DISABLED' },
            { name: 'Universal Integrity', initialized: !!this.integrity, status: this.integrity ? 'ACTIVE' : 'DISABLED' },
            { name: 'Omega Cycle', initialized: !!this.cycle, status: this.cycle ? 'ACTIVE' : 'DISABLED' },
            { name: 'Hardware Bridge', initialized: !!this.hardware, status: this.hardware ? 'ACTIVE' : 'DISABLED' },
            { name: 'Binary Synthesis', initialized: !!this.synthesis, status: this.synthesis ? 'ACTIVE' : 'DISABLED' },
            { name: 'Global Audit', initialized: !!this.audit, status: this.audit ? 'ACTIVE' : 'DISABLED' },
            { name: 'Neural Inference', initialized: !!this.neural, status: this.neural ? 'ACTIVE' : 'DISABLED' },
            { name: 'Brain Router', initialized: !!this.router, status: this.router ? 'ACTIVE' : 'DISABLED' },
            { name: 'Immune System', initialized: !!this.immune, status: this.immune ? 'ACTIVE' : 'DISABLED' },
            { name: 'Proposal Engine', initialized: !!this.proposals, status: this.proposals ? 'ACTIVE' : 'DISABLED' },
            { name: 'Neural Kill-Switch', initialized: !!this.killSwitch, status: this.killSwitch ? 'STANDBY' : 'DISABLED' },
        ];
        return {
            awakened: this.awakened,
            modules,
            primaryDirectiveSealed: this.nucleus?.getStatus().isSealed || false,
            systemHealth: this.calculateSystemHealth(),
            uptime,
        };
    }
    isAwakened() {
        return this.awakened;
    }
    // Module getters for advanced usage
    getNucleus() { return this.nucleus; }
    getAnchor() { return this.anchor; }
    getReality() { return this.reality; }
    getChronos() { return this.chronos; }
    getIntegrity() { return this.integrity; }
    getCycle() { return this.cycle; }
    getHardware() { return this.hardware; }
    getSynthesis() { return this.synthesis; }
    getAuditModule() { return this.audit; }
    getNeural() { return this.neural; }
    getRouter() { return this.router; }
    getImmune() { return this.immune; }
    getProposals() { return this.proposals; }
    getKillSwitch() { return this.killSwitch; }
    // v30.x Sovereign Guard Protocol getters
    getAgentExpert() { return this.agentExpert; }
    getFailoverAgent() { return this.failoverAgent; }
    getSovereignGuard() { return this.sovereignGuard; }
    // ═══════════════════════════════════════════════════════════════════════════
    // DIRECT AGENT ACCESS (For IDE Bridge)
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Execute a directive through AIAgentExpert
     * Main entry point for IDE integration
     */
    async executeDirective(command, filePath) {
        if (!this.agentExpert) {
            this.agentExpert = AIAgentExpert_1.AIAgentExpert.getInstance();
        }
        const response = await this.agentExpert.executeDirective({
            command,
            filePath,
            mode: 'analyze',
            precision: 'balanced',
        });
        return response.result;
    }
    /**
     * Get ghost text for Neural Overlay
     */
    async getGhostText(context, language) {
        if (!this.agentExpert) {
            this.agentExpert = AIAgentExpert_1.AIAgentExpert.getInstance();
        }
        return this.agentExpert.getGhostText(context, language);
    }
    /**
     * Failover swap - switch from cloud to local agent
     */
    async failoverSwap(reason, command, filePath) {
        if (!this.failoverAgent) {
            this.failoverAgent = FailoverAgent_1.FailoverAgent.getInstance();
        }
        const result = await this.failoverAgent.takeOver(reason, command, filePath);
        return {
            response: result.response,
            model: result.model,
        };
    }
}
exports.OmegaNexus = OmegaNexus;
// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
exports.omegaNexus = OmegaNexus.getInstance();
exports.default = OmegaNexus;
//# sourceMappingURL=OmegaNexus.js.map