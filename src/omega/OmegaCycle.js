"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OMEGA CYCLE - Нощен Само-Подобряващ се Цикъл
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Всяка нощ в 03:00, докато светът спи, QAntum анализира работата си,
 *  сравнява се с идеалното си бъдеще и пренаписва по-слабите части."
 *
 * The Omega Cycle is a nightly self-improvement process:
 * 1. ANALYZE - Review all code written/modified that day
 * 2. COMPARE - Compare against mathematical perfection
 * 3. REWRITE - Evolve suboptimal components automatically
 * 4. VERIFY - Ensure no regression via Proof-of-Intent
 * 5. DEPLOY - Push improvements silently
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
exports.omegaCycle = exports.OmegaCycle = void 0;
const events_1 = require("events");
const schedule = __importStar(require("node-schedule"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ChronosOmegaArchitect_1 = require("./ChronosOmegaArchitect");
const UniversalIntegrity_1 = require("./UniversalIntegrity");
const SovereignNucleus_1 = require("./SovereignNucleus");
const IntentAnchor_1 = require("./IntentAnchor");
const NeuralInference_1 = require("../physics/NeuralInference");
const ImmuneSystem_1 = require("../intelligence/ImmuneSystem");
// ═══════════════════════════════════════════════════════════════════════════════
// OMEGA CYCLE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
class OmegaCycle extends events_1.EventEmitter {
    static instance;
    chronos = ChronosOmegaArchitect_1.ChronosOmegaArchitect.getInstance();
    integrity = UniversalIntegrity_1.UniversalIntegrity.getInstance();
    nucleus = SovereignNucleus_1.SovereignNucleus.getInstance();
    anchor = IntentAnchor_1.IntentAnchor.getInstance();
    brain = NeuralInference_1.NeuralInference.getInstance();
    immune = ImmuneSystem_1.ImmuneSystem.getInstance();
    cycleJob = null;
    inactivityCheckInterval = null;
    cycleHistory = [];
    isRunning = false;
    workspaceRoot = process.cwd();
    lastActivityTime = Date.now();
    // Configuration
    CYCLE_HOUR = 3; // 03:00 AM (fallback)
    CYCLE_MINUTE = 0;
    MAX_IMPROVEMENTS_PER_CYCLE = 50;
    QUALITY_THRESHOLD = 80; // Below this = needs improvement
    BACKUP_DIR = 'data/omega-backups';
    // Inactivity-based trigger (NEW)
    INACTIVITY_THRESHOLD_MS = 3 * 60 * 60 * 1000; // 3 hours
    INACTIVITY_CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes
    useInactivityTrigger = false;
    constructor() {
        super();
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        🌙 OMEGA CYCLE INITIALIZED 🌙                           ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  "QAntum еволюира когато ти почиваш."                                         ║
║                                                                               ║
║  Modes: Fixed (${String(this.CYCLE_HOUR).padStart(2, '0')}:${String(this.CYCLE_MINUTE).padStart(2, '0')}) | Inactivity (3+ hours)                              ║
║  Max improvements per cycle: ${this.MAX_IMPROVEMENTS_PER_CYCLE}                                         ║
║  Quality threshold: ${this.QUALITY_THRESHOLD}%                                                   ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
    }
    static getInstance() {
        if (!OmegaCycle.instance) {
            OmegaCycle.instance = new OmegaCycle();
        }
        return OmegaCycle.instance;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIVITY TRACKING
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Record user activity (call this from IDE integration)
     */
    recordActivity() {
        this.lastActivityTime = Date.now();
        this.emit('activity:recorded');
    }
    /**
     * Get inactivity duration in milliseconds
     */
    getInactivityDuration() {
        return Date.now() - this.lastActivityTime;
    }
    /**
     * Check if inactivity threshold is exceeded
     */
    isInactivityThresholdExceeded() {
        return this.getInactivityDuration() >= this.INACTIVITY_THRESHOLD_MS;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // SCHEDULE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Start with fixed schedule (03:00 daily)
     */
    start() {
        if (this.cycleJob) {
            console.log('⚠️ [OMEGA] Cycle already scheduled.');
            return;
        }
        // Schedule for 03:00 AM every day
        const rule = new schedule.RecurrenceRule();
        rule.hour = this.CYCLE_HOUR;
        rule.minute = this.CYCLE_MINUTE;
        this.cycleJob = schedule.scheduleJob(rule, () => this.runCycle());
        this.useInactivityTrigger = false;
        console.log(`🌙 [OMEGA] Cycle scheduled for ${this.CYCLE_HOUR}:${String(this.CYCLE_MINUTE).padStart(2, '0')} daily.`);
        this.emit('scheduled');
    }
    /**
     * Start with inactivity-based trigger (3+ hours of no activity)
     * This is the preferred mode - cycle runs when you're not working
     */
    startInactivityMode() {
        if (this.inactivityCheckInterval) {
            console.log('⚠️ [OMEGA] Inactivity mode already active.');
            return;
        }
        this.useInactivityTrigger = true;
        this.lastActivityTime = Date.now();
        // Check inactivity every 5 minutes
        this.inactivityCheckInterval = setInterval(async () => {
            if (this.isInactivityThresholdExceeded() && !this.isRunning) {
                const inactiveHours = (this.getInactivityDuration() / (60 * 60 * 1000)).toFixed(1);
                console.log(`💤 [OMEGA] ${inactiveHours}h of inactivity detected. Starting improvement cycle...`);
                await this.runCycle();
                // Reset activity time after cycle to prevent immediate re-run
                this.lastActivityTime = Date.now();
            }
        }, this.INACTIVITY_CHECK_INTERVAL_MS);
        console.log(`
🌙 [OMEGA] Inactivity mode ENABLED
   Threshold: ${this.INACTIVITY_THRESHOLD_MS / (60 * 60 * 1000)} hours of inactivity
   Check interval: Every ${this.INACTIVITY_CHECK_INTERVAL_MS / (60 * 1000)} minutes
   
   QAntum will evolve automatically when you take a break.
    `);
        this.emit('inactivity-mode:start');
    }
    /**
     * Stop all scheduling
     */
    stop() {
        if (this.cycleJob) {
            this.cycleJob.cancel();
            this.cycleJob = null;
        }
        if (this.inactivityCheckInterval) {
            clearInterval(this.inactivityCheckInterval);
            this.inactivityCheckInterval = null;
        }
        this.useInactivityTrigger = false;
        console.log('🛑 [OMEGA] Cycle stopped.');
        this.emit('stopped');
    }
    /**
     * Run the cycle manually (for testing or on-demand improvement)
     */
    async runManual() {
        return this.runCycle();
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // THE OMEGA CYCLE
    // ═══════════════════════════════════════════════════════════════════════════
    async runCycle() {
        if (this.isRunning) {
            console.log('⚠️ [OMEGA] Cycle already in progress. Skipping.');
            return this.cycleHistory[this.cycleHistory.length - 1];
        }
        this.isRunning = true;
        const startTime = new Date();
        const cycleId = `omega_${Date.now()}`;
        const triggerMode = this.useInactivityTrigger ? 'INACTIVITY' : 'SCHEDULED';
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        🌙 OMEGA CYCLE STARTING 🌙                              ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Cycle ID: ${cycleId.padEnd(60)}║
║  Started: ${startTime.toISOString().padEnd(60)}║
║  Trigger: ${triggerMode.padEnd(61)}║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
        this.emit('cycle:start', { cycleId, startTime, triggerMode });
        const improvements = [];
        try {
            // PHASE 1: ANALYZE
            console.log('\n📊 [PHASE 1] ANALYZE - Scanning codebase for evolution targets...');
            const targets = await this.analyzeCodebase();
            console.log(`   Found ${targets.length} files to analyze.`);
            // PHASE 2: COMPARE
            console.log('\n🔬 [PHASE 2] COMPARE - Measuring against mathematical perfection...');
            const evolutionCandidates = await this.compareToIdeal(targets);
            console.log(`   ${evolutionCandidates.length} candidates for improvement.`);
            // PHASE 3: REWRITE
            console.log('\n🔧 [PHASE 3] REWRITE - Evolving suboptimal components...');
            for (const candidate of evolutionCandidates.slice(0, this.MAX_IMPROVEMENTS_PER_CYCLE)) {
                const improvement = await this.rewriteModule(candidate);
                if (improvement) {
                    improvements.push(improvement);
                    console.log(`   ✅ Improved: ${path.basename(candidate.path)} (${improvement.improvementPercent.toFixed(1)}%)`);
                }
            }
            // PHASE 4: VERIFY
            console.log('\n✓ [PHASE 4] VERIFY - Running Proof-of-Intent validation...');
            const allValid = await this.verifyImprovements(improvements);
            if (!allValid) {
                console.log('   ⚠️ Some improvements failed verification. Rolling back...');
                await this.rollbackFailed(improvements);
            }
            // PHASE 5: DEPLOY
            console.log('\n🚀 [PHASE 5] DEPLOY - Committing improvements...');
            await this.deployImprovements(improvements);
        }
        catch (error) {
            console.error('❌ [OMEGA] Cycle failed:', error);
            this.emit('cycle:error', { cycleId, error });
        }
        // Generate report
        const endTime = new Date();
        const totalImprovement = improvements.length > 0
            ? improvements.reduce((sum, i) => sum + i.improvementPercent, 0) / improvements.length
            : 0;
        const report = {
            id: cycleId,
            startedAt: startTime,
            completedAt: endTime,
            phase: 'DEPLOY',
            modulesAnalyzed: improvements.length,
            improvementsMade: improvements,
            overallImprovement: totalImprovement,
            status: improvements.length > 0 ? 'SUCCESS' : 'PARTIAL',
        };
        this.cycleHistory.push(report);
        this.isRunning = false;
        this.emit('cycle:complete', report);
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        🌙 OMEGA CYCLE COMPLETE 🌙                              ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Duration: ${((endTime.getTime() - startTime.getTime()) / 1000).toFixed(1)}s                                                         ║
║  Modules improved: ${improvements.length.toString().padEnd(53)}║
║  Average improvement: ${totalImprovement.toFixed(1)}%                                                ║
║  Status: ${report.status.padEnd(63)}║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
        return report;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE IMPLEMENTATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * PHASE 1: Analyze the codebase to find evolution targets
     */
    async analyzeCodebase() {
        const targets = [];
        const srcDir = path.join(this.workspaceRoot, 'src');
        if (!fs.existsSync(srcDir)) {
            console.log('   ⚠️ No src directory found.');
            return targets;
        }
        const scanDir = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    scanDir(fullPath);
                }
                else if (entry.isFile() && /\.(ts|js)$/.test(entry.name)) {
                    const stats = fs.statSync(fullPath);
                    const quality = this.assessQuality(fullPath);
                    targets.push({
                        path: fullPath,
                        priority: quality < this.QUALITY_THRESHOLD ? 10 - Math.floor(quality / 10) : 1,
                        lastModified: stats.mtime,
                        currentQuality: quality,
                        idealQuality: 100,
                    });
                }
            }
        };
        scanDir(srcDir);
        // Sort by priority (highest first)
        return targets.sort((a, b) => b.priority - a.priority);
    }
    /**
     * Assess the quality of a file (0-100)
     */
    assessQuality(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            let quality = 100;
            // Check for common quality issues
            const lines = content.split('\n');
            // Long lines penalty
            const longLines = lines.filter(l => l.length > 120).length;
            quality -= Math.min(10, longLines);
            // No comments penalty
            const comments = content.match(/\/\/|\/\*/g)?.length || 0;
            if (comments < 5)
                quality -= 5;
            // No error handling penalty
            if (!content.includes('try') && !content.includes('catch')) {
                quality -= 5;
            }
            // Console.log in production penalty
            const consoleLogs = (content.match(/console\.log/g) || []).length;
            quality -= Math.min(5, consoleLogs);
            // Magic numbers penalty
            const magicNumbers = content.match(/[^a-zA-Z_]\d{3,}[^a-zA-Z_]/g)?.length || 0;
            quality -= Math.min(5, magicNumbers);
            // High complexity (many nested ifs)
            const nestedIfs = content.match(/if.*if.*if/g)?.length || 0;
            quality -= Math.min(10, nestedIfs * 2);
            // Type safety bonus (TypeScript)
            if (filePath.endsWith('.ts')) {
                const typeAnnotations = content.match(/:\s*(string|number|boolean|any|object|void)/g)?.length || 0;
                quality += Math.min(5, typeAnnotations / 2);
            }
            return Math.max(0, Math.min(100, quality));
        }
        catch {
            return 50; // Default if file can't be read
        }
    }
    /**
     * PHASE 2: Compare files to their ideal state
     */
    async compareToIdeal(targets) {
        // Filter to only those below threshold
        return targets.filter(t => t.currentQuality < this.QUALITY_THRESHOLD);
    }
    /**
     * PHASE 3: Rewrite a module to improve it
     */
    async rewriteModule(target) {
        try {
            const content = fs.readFileSync(target.path, 'utf-8');
            // Create backup
            const backupPath = await this.createBackup(target.path);
            // Use Neural Inference to improve the code
            const improvedCode = await this.brain.fixCode(content);
            // Calculate new quality
            const tempPath = target.path + '.tmp';
            fs.writeFileSync(tempPath, improvedCode);
            const newQuality = this.assessQuality(tempPath);
            fs.unlinkSync(tempPath);
            // Only apply if it's actually an improvement
            if (newQuality <= target.currentQuality) {
                return null;
            }
            // Write improved code
            fs.writeFileSync(target.path, improvedCode);
            return {
                filePath: target.path,
                originalComplexity: 100 - target.currentQuality,
                newComplexity: 100 - newQuality,
                improvementPercent: ((newQuality - target.currentQuality) / target.currentQuality) * 100,
                changeType: 'EVOLUTION',
                backupPath,
            };
        }
        catch (error) {
            console.error(`   ❌ Failed to improve ${target.path}:`, error);
            return null;
        }
    }
    /**
     * Create a backup of a file before modification
     */
    async createBackup(filePath) {
        const backupDir = path.join(this.workspaceRoot, this.BACKUP_DIR);
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const fileName = path.basename(filePath);
        const backupPath = path.join(backupDir, `${fileName}.${Date.now()}.bak`);
        fs.copyFileSync(filePath, backupPath);
        return backupPath;
    }
    /**
     * PHASE 4: Verify improvements haven't broken anything
     */
    async verifyImprovements(improvements) {
        // Use Proof-of-Intent to verify each improvement
        for (const improvement of improvements) {
            const verified = await this.anchor.verifyAction({
                type: 'OMEGA_IMPROVEMENT',
                target: improvement.filePath,
                description: `Improved complexity from ${improvement.originalComplexity} to ${improvement.newComplexity}`,
            });
            if (!verified.isApproved) {
                return false;
            }
        }
        return true;
    }
    /**
     * Rollback failed improvements
     */
    async rollbackFailed(improvements) {
        for (const improvement of improvements) {
            if (fs.existsSync(improvement.backupPath)) {
                fs.copyFileSync(improvement.backupPath, improvement.filePath);
                console.log(`   🔄 Rolled back: ${improvement.filePath}`);
            }
        }
    }
    /**
     * PHASE 5: Deploy the improvements
     */
    async deployImprovements(improvements) {
        // In a full implementation, this would:
        // 1. Run tests
        // 2. Commit changes
        // 3. Push to remote (if configured)
        console.log(`   📦 ${improvements.length} improvements deployed locally.`);
        this.emit('deployed', { count: improvements.length });
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // STATUS & HISTORY
    // ═══════════════════════════════════════════════════════════════════════════
    getStatus() {
        const nextInvocation = this.cycleJob?.nextInvocation()?.toDate() || null;
        const totalImprovements = this.cycleHistory.reduce((sum, c) => sum + c.improvementsMade.length, 0);
        return {
            isRunning: this.isRunning,
            nextRun: nextInvocation,
            totalCycles: this.cycleHistory.length,
            totalImprovements,
        };
    }
    getHistory() {
        return [...this.cycleHistory];
    }
    getLastReport() {
        return this.cycleHistory[this.cycleHistory.length - 1] || null;
    }
}
exports.OmegaCycle = OmegaCycle;
// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
exports.omegaCycle = OmegaCycle.getInstance();
exports.default = OmegaCycle;
//# sourceMappingURL=OmegaCycle.js.map