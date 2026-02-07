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

import { EventEmitter } from 'events';
import * as schedule from 'node-schedule';
import * as fs from 'fs';
import * as path from 'path';
import { ChronosOmegaArchitect } from './ChronosOmegaArchitect';
import { UniversalIntegrity } from './UniversalIntegrity';
import { SovereignNucleus } from './SovereignNucleus';
import { IntentAnchor } from './IntentAnchor';
import { NeuralInference } from '../physics/NeuralInference';
import { ImmuneSystem } from '../intelligence/ImmuneSystem';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES - THE CYCLE STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════════

export interface CycleReport {
  id: string;
  startedAt: Date;
  completedAt: Date;
  phase: 'ANALYZE' | 'COMPARE' | 'REWRITE' | 'VERIFY' | 'DEPLOY';
  modulesAnalyzed: number;
  improvementsMade: ImprovementRecord[];
  overallImprovement: number;  // Percentage
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

export interface ImprovementRecord {
  filePath: string;
  originalComplexity: number;
  newComplexity: number;
  improvementPercent: number;
  changeType: 'OPTIMIZATION' | 'SECURITY' | 'CLEANUP' | 'EVOLUTION';
  backupPath: string;
}

export interface EvolutionTarget {
  path: string;
  priority: number;          // 1-10, 10 = most urgent
  lastModified: Date;
  currentQuality: number;    // 0-100
  idealQuality: number;      // Always 100
}

// ═══════════════════════════════════════════════════════════════════════════════
// OMEGA CYCLE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class OmegaCycle extends EventEmitter {
  private static instance: OmegaCycle;

  private readonly chronos = ChronosOmegaArchitect.getInstance();
  private readonly integrity = UniversalIntegrity.getInstance();
  private readonly nucleus = SovereignNucleus.getInstance();
  private readonly anchor = IntentAnchor.getInstance();
  private readonly brain = NeuralInference.getInstance();
  private readonly immune = ImmuneSystem.getInstance();

  private cycleJob: schedule.Job | null = null;
  private inactivityCheckInterval: ReturnType<typeof setInterval> | null = null;
  private cycleHistory: CycleReport[] = [];
  private isRunning = false;
  private workspaceRoot = process.cwd();
  private lastActivityTime = Date.now();

  // Configuration
  private readonly CYCLE_HOUR = 3;           // 03:00 AM (fallback)
  private readonly CYCLE_MINUTE = 0;
  private readonly MAX_IMPROVEMENTS_PER_CYCLE = 50;
  private readonly QUALITY_THRESHOLD = 80;   // Below this = needs improvement
  private readonly BACKUP_DIR = 'data/omega-backups';
  
  // Inactivity-based trigger (NEW)
  private readonly INACTIVITY_THRESHOLD_MS = 3 * 60 * 60 * 1000; // 3 hours
  private readonly INACTIVITY_CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes
  private useInactivityTrigger = false;

  private constructor() {
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

  static getInstance(): OmegaCycle {
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
  recordActivity(): void {
    this.lastActivityTime = Date.now();
    this.emit('activity:recorded');
  }

  /**
   * Get inactivity duration in milliseconds
   */
  getInactivityDuration(): number {
    return Date.now() - this.lastActivityTime;
  }

  /**
   * Check if inactivity threshold is exceeded
   */
  isInactivityThresholdExceeded(): boolean {
    return this.getInactivityDuration() >= this.INACTIVITY_THRESHOLD_MS;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Start with fixed schedule (03:00 daily)
   */
  start(): void {
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
  startInactivityMode(): void {
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
  stop(): void {
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
  async runManual(): Promise<CycleReport> {
    return this.runCycle();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE OMEGA CYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  private async runCycle(): Promise<CycleReport> {
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

    const improvements: ImprovementRecord[] = [];

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

    } catch (error) {
      console.error('❌ [OMEGA] Cycle failed:', error);
      this.emit('cycle:error', { cycleId, error });
    }

    // Generate report
    const endTime = new Date();
    const totalImprovement = improvements.length > 0
      ? improvements.reduce((sum, i) => sum + i.improvementPercent, 0) / improvements.length
      : 0;

    const report: CycleReport = {
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
  private async analyzeCodebase(): Promise<EvolutionTarget[]> {
    const targets: EvolutionTarget[] = [];
    const srcDir = path.join(this.workspaceRoot, 'src');

    if (!fs.existsSync(srcDir)) {
      console.log('   ⚠️ No src directory found.');
      return targets;
    }

    const scanDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDir(fullPath);
        } else if (entry.isFile() && /\.(ts|js)$/.test(entry.name)) {
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
  private assessQuality(filePath: string): number {
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
      if (comments < 5) quality -= 5;

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
    } catch {
      return 50; // Default if file can't be read
    }
  }

  /**
   * PHASE 2: Compare files to their ideal state
   */
  private async compareToIdeal(targets: EvolutionTarget[]): Promise<EvolutionTarget[]> {
    // Filter to only those below threshold
    return targets.filter(t => t.currentQuality < this.QUALITY_THRESHOLD);
  }

  /**
   * PHASE 3: Rewrite a module to improve it
   */
  private async rewriteModule(target: EvolutionTarget): Promise<ImprovementRecord | null> {
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
    } catch (error) {
      console.error(`   ❌ Failed to improve ${target.path}:`, error);
      return null;
    }
  }

  /**
   * Create a backup of a file before modification
   */
  private async createBackup(filePath: string): Promise<string> {
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
  private async verifyImprovements(improvements: ImprovementRecord[]): Promise<boolean> {
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
  private async rollbackFailed(improvements: ImprovementRecord[]): Promise<void> {
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
  private async deployImprovements(improvements: ImprovementRecord[]): Promise<void> {
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

  getStatus(): {
    isRunning: boolean;
    nextRun: Date | null;
    totalCycles: number;
    totalImprovements: number;
  } {
    const nextInvocation = this.cycleJob?.nextInvocation()?.toDate() || null;
    const totalImprovements = this.cycleHistory.reduce(
      (sum, c) => sum + c.improvementsMade.length, 
      0
    );

    return {
      isRunning: this.isRunning,
      nextRun: nextInvocation,
      totalCycles: this.cycleHistory.length,
      totalImprovements,
    };
  }

  getHistory(): CycleReport[] {
    return [...this.cycleHistory];
  }

  getLastReport(): CycleReport | null {
    return this.cycleHistory[this.cycleHistory.length - 1] || null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const omegaCycle = OmegaCycle.getInstance();
export default OmegaCycle;
