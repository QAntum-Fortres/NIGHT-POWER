/**
 * 🧬 SELF-EVOLUTION HOOK ENGINE
 * 
 * v1.0.0.0 Future Practice: Autonomous code refactoring with Git integration
 * 
 * When SelfOptimizingEngine detects need for change, this module has the
 * authority to automatically commit refactored code to Git.
 * 
 * Core Innovation:
 * - AI-driven code refactoring
 * - Automatic Git commits with semantic messages
 * - Non-breaking evolution strategy
 * - Rollback capability
 * - Code review queue for critical changes
 * 
 * @version 1.0.0
 * @phase Future Practices - Self-Evolution
 * @author QANTUM AI Architect
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================
// TYPES
// ============================================================

interface EvolutionTrigger {
    triggerId: string;
    type: 'schema_change' | 'api_update' | 'performance_issue' | 'security_fix' | 'deprecation' | 'optimization';
    source: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    detectedAt: number;
    context: Record<string, any>;
}

interface EvolutionPlan {
    planId: string;
    trigger: EvolutionTrigger;
    affectedFiles: string[];
    changes: CodeChange[];
    strategy: EvolutionStrategy;
    estimatedImpact: number;
    requiresReview: boolean;
    status: 'pending' | 'approved' | 'executing' | 'committed' | 'rolled_back' | 'failed';
}

interface CodeChange {
    changeId: string;
    filePath: string;
    changeType: 'modify' | 'create' | 'delete' | 'rename';
    originalCode?: string;
    newCode?: string;
    description: string;
    breakingChange: boolean;
}

interface EvolutionStrategy {
    approach: 'non-breaking' | 'breaking-with-migration' | 'full-replacement';
    testFirst: boolean;
    createBackup: boolean;
    autoRollbackOnFailure: boolean;
    requireApproval: boolean;
}

interface GitCommit {
    commitHash: string;
    message: string;
    filesChanged: string[];
    timestamp: number;
    evolutionPlanId: string;
}

interface EvolutionConfig {
    workingDirectory: string;
    gitEnabled: boolean;
    autoCommit: boolean;
    branchPrefix: string;
    requireApprovalFor: EvolutionTrigger['severity'][];
    backupDirectory: string;
    maxAutoCommitsPerHour: number;
    semanticCommitMessages: boolean;
}

// ============================================================
// SELF-EVOLUTION HOOK ENGINE
// ============================================================

export class SelfEvolutionHookEngine extends EventEmitter {
    private config: EvolutionConfig;
    private pendingPlans: Map<string, EvolutionPlan> = new Map();
    private executedPlans: EvolutionPlan[] = [];
    private commits: GitCommit[] = [];
    private autoCommitsThisHour = 0;
    private lastHourReset = Date.now();

    // Code transformation patterns
    private static readonly TRANSFORMATIONS = {
        // Add new parameter to function
        addParameter: (code: string, funcName: string, newParam: string, defaultValue: string) => {
            const funcRegex = new RegExp(`(function\\s+${funcName}\\s*\\()([^)]*)\\)`, 'g');
            return code.replace(funcRegex, (match, prefix, params) => {
                const newParams = params ? `${params}, ${newParam} = ${defaultValue}` : `${newParam} = ${defaultValue}`;
                return `${prefix}${newParams})`;
            });
        },
        
        // Update import statement
        updateImport: (code: string, oldImport: string, newImport: string) => {
            return code.replace(new RegExp(oldImport, 'g'), newImport);
        },
        
        // Wrap function call with try-catch
        addErrorHandling: (code: string, funcName: string) => {
            const callRegex = new RegExp(`(await\\s+)?${funcName}\\(([^)]*)\\)`, 'g');
            return code.replace(callRegex, (match, awaitKeyword, params) => {
                return `(() => { try { return ${awaitKeyword || ''}${funcName}(${params}); } catch(e) { console.error('${funcName} error:', e); throw e; } })()`;
            });
        },
        
        // Add deprecation warning
        addDeprecationWarning: (code: string, funcName: string, replacement: string) => {
            const funcRegex = new RegExp(`(function\\s+${funcName}\\s*\\([^)]*\\)\\s*{)`, 'g');
            return code.replace(funcRegex, (match, funcDecl) => {
                return `${funcDecl}\n    console.warn('DEPRECATED: ${funcName} is deprecated. Use ${replacement} instead.');`;
            });
        }
    };

    constructor(config: Partial<EvolutionConfig> = {}) {
        super();

        this.config = {
            workingDirectory: process.cwd(),
            gitEnabled: true,
            autoCommit: true,
            branchPrefix: 'evolution/',
            requireApprovalFor: ['high', 'critical'],
            backupDirectory: '.evolution-backups',
            maxAutoCommitsPerHour: 10,
            semanticCommitMessages: true,
            ...config
        };
    }

    /**
     * 🚀 Initialize Self-Evolution Hook
     */
    async initialize(): Promise<void> {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🧬 SELF-EVOLUTION HOOK ENGINE v1.0.0.0                        ║
║                                                               ║
║  "Code that evolves itself"                                   ║
╚═══════════════════════════════════════════════════════════════╝
`);

        // Ensure backup directory exists
        const backupPath = path.join(this.config.workingDirectory, this.config.backupDirectory);
        if (!fs.existsSync(backupPath)) {
            fs.mkdirSync(backupPath, { recursive: true });
        }

        // Check Git availability
        if (this.config.gitEnabled) {
            try {
                await execAsync('git --version');
                console.log('   ✅ Git integration enabled');
            } catch {
                console.log('   ⚠️ Git not available, disabling auto-commit');
                this.config.gitEnabled = false;
            }
        }

        console.log(`   ✅ Auto-commit: ${this.config.autoCommit ? 'ENABLED' : 'DISABLED'}`);
        console.log(`   ✅ Max commits/hour: ${this.config.maxAutoCommitsPerHour}`);
        console.log(`   ✅ Backup directory: ${this.config.backupDirectory}`);
    }

    /**
     * 🔍 Register evolution trigger
     */
    registerTrigger(trigger: Omit<EvolutionTrigger, 'triggerId' | 'detectedAt'>): EvolutionTrigger {
        const fullTrigger: EvolutionTrigger = {
            triggerId: `trigger_${crypto.randomBytes(6).toString('hex')}`,
            detectedAt: Date.now(),
            ...trigger
        };

        console.log(`\n🔔 Evolution trigger detected: ${fullTrigger.type}`);
        console.log(`   Severity: ${fullTrigger.severity}`);
        console.log(`   Source: ${fullTrigger.source}`);

        this.emit('trigger:detected', fullTrigger);
        return fullTrigger;
    }

    /**
     * 📋 Create evolution plan
     */
    async createEvolutionPlan(trigger: EvolutionTrigger): Promise<EvolutionPlan> {
        console.log(`\n📋 Creating evolution plan for trigger: ${trigger.triggerId}`);

        // Analyze affected files
        const affectedFiles = await this.analyzeAffectedFiles(trigger);
        
        // Generate code changes
        const changes = await this.generateChanges(trigger, affectedFiles);
        
        // Determine strategy
        const strategy = this.determineStrategy(trigger, changes);
        
        // Calculate impact
        const estimatedImpact = this.estimateImpact(changes);
        
        // Check if approval required
        const requiresReview = this.config.requireApprovalFor.includes(trigger.severity) ||
                              changes.some(c => c.breakingChange);

        const plan: EvolutionPlan = {
            planId: `plan_${crypto.randomBytes(6).toString('hex')}`,
            trigger,
            affectedFiles,
            changes,
            strategy,
            estimatedImpact,
            requiresReview,
            status: requiresReview ? 'pending' : 'approved'
        };

        this.pendingPlans.set(plan.planId, plan);

        console.log(`   ✅ Plan created: ${plan.planId}`);
        console.log(`   📁 Affected files: ${affectedFiles.length}`);
        console.log(`   🔧 Changes: ${changes.length}`);
        console.log(`   ⚠️ Requires review: ${requiresReview}`);

        this.emit('plan:created', plan);
        return plan;
    }

    /**
     * Analyze affected files based on trigger
     */
    private async analyzeAffectedFiles(trigger: EvolutionTrigger): Promise<string[]> {
        const files: string[] = [];
        
        // Search for files that might be affected
        const searchPatterns: Record<string, string[]> = {
            schema_change: ['**/*.ts', '**/*.js', '**/types.ts', '**/interfaces.ts'],
            api_update: ['**/*.test.ts', '**/*.spec.ts', '**/api/**/*.ts'],
            performance_issue: ['**/*.ts', '**/*.js'],
            security_fix: ['**/*.ts', '**/*.js', '**/auth/**', '**/security/**'],
            deprecation: ['**/*.ts', '**/*.js'],
            optimization: ['**/*.ts', '**/*.js']
        };

        const patterns = searchPatterns[trigger.type] || ['**/*.ts'];
        
        // Simulate file discovery (in production, use glob)
        if (trigger.context.targetFile) {
            files.push(trigger.context.targetFile);
        }
        
        if (trigger.context.relatedFiles) {
            files.push(...trigger.context.relatedFiles);
        }

        return files;
    }

    /**
     * Generate code changes for trigger
     */
    private async generateChanges(
        trigger: EvolutionTrigger,
        affectedFiles: string[]
    ): Promise<CodeChange[]> {
        const changes: CodeChange[] = [];

        for (const filePath of affectedFiles) {
            const fullPath = path.join(this.config.workingDirectory, filePath);
            
            if (!fs.existsSync(fullPath)) continue;
            
            const originalCode = fs.readFileSync(fullPath, 'utf-8');
            let newCode = originalCode;
            let description = '';
            let breakingChange = false;

            // Apply transformations based on trigger type
            switch (trigger.type) {
                case 'schema_change':
                    if (trigger.context.newField) {
                        description = `Add new field: ${trigger.context.newField}`;
                        // Would use AST transformation in production
                        if (trigger.context.newField && trigger.context.defaultValue) {
                            newCode = this.addFieldToInterface(originalCode, trigger.context);
                        }
                    }
                    break;

                case 'api_update':
                    if (trigger.context.newParameter) {
                        description = `Add parameter: ${trigger.context.newParameter}`;
                        newCode = SelfEvolutionHookEngine.TRANSFORMATIONS.addParameter(
                            originalCode,
                            trigger.context.functionName || '',
                            trigger.context.newParameter,
                            trigger.context.defaultValue || 'undefined'
                        );
                    }
                    break;

                case 'deprecation':
                    description = `Add deprecation warning for: ${trigger.context.functionName}`;
                    newCode = SelfEvolutionHookEngine.TRANSFORMATIONS.addDeprecationWarning(
                        originalCode,
                        trigger.context.functionName || '',
                        trigger.context.replacement || 'newFunction'
                    );
                    break;

                case 'security_fix':
                    description = `Add error handling to: ${trigger.context.functionName}`;
                    newCode = SelfEvolutionHookEngine.TRANSFORMATIONS.addErrorHandling(
                        originalCode,
                        trigger.context.functionName || ''
                    );
                    breakingChange = true;
                    break;

                case 'optimization':
                    description = `Optimize: ${trigger.context.description || 'performance improvement'}`;
                    // Would apply specific optimizations
                    break;
            }

            if (newCode !== originalCode) {
                changes.push({
                    changeId: `change_${crypto.randomBytes(4).toString('hex')}`,
                    filePath,
                    changeType: 'modify',
                    originalCode,
                    newCode,
                    description,
                    breakingChange
                });
            }
        }

        return changes;
    }

    /**
     * Add field to TypeScript interface
     */
    private addFieldToInterface(code: string, context: Record<string, any>): string {
        const interfaceName = context.interfaceName || '';
        const newField = context.newField || '';
        const fieldType = context.fieldType || 'any';
        
        const interfaceRegex = new RegExp(
            `(interface\\s+${interfaceName}\\s*{[^}]*)(})`
        );
        
        return code.replace(interfaceRegex, (match, body, closing) => {
            return `${body}    ${newField}: ${fieldType};\n${closing}`;
        });
    }

    /**
     * Determine evolution strategy
     */
    private determineStrategy(trigger: EvolutionTrigger, changes: CodeChange[]): EvolutionStrategy {
        const hasBreakingChanges = changes.some(c => c.breakingChange);
        const isCritical = trigger.severity === 'critical';

        return {
            approach: hasBreakingChanges ? 'breaking-with-migration' : 'non-breaking',
            testFirst: true,
            createBackup: true,
            autoRollbackOnFailure: true,
            requireApproval: isCritical || hasBreakingChanges
        };
    }

    /**
     * Estimate impact score (0-100)
     */
    private estimateImpact(changes: CodeChange[]): number {
        let impact = 0;
        
        for (const change of changes) {
            // Breaking changes have high impact
            if (change.breakingChange) impact += 30;
            
            // File modifications
            if (change.changeType === 'modify') impact += 10;
            if (change.changeType === 'delete') impact += 25;
            if (change.changeType === 'create') impact += 5;
            
            // Code size changes
            if (change.originalCode && change.newCode) {
                const sizeChange = Math.abs(change.newCode.length - change.originalCode.length);
                impact += Math.min(20, sizeChange / 100);
            }
        }

        return Math.min(100, impact);
    }

    /**
     * ✅ Approve evolution plan
     */
    approvePlan(planId: string): boolean {
        const plan = this.pendingPlans.get(planId);
        if (!plan || plan.status !== 'pending') return false;

        plan.status = 'approved';
        console.log(`✅ Plan ${planId} approved`);
        this.emit('plan:approved', plan);
        return true;
    }

    /**
     * 🚀 Execute evolution plan
     */
    async executePlan(planId: string): Promise<ExecutionResult> {
        const plan = this.pendingPlans.get(planId);
        
        if (!plan) {
            throw new Error(`Plan ${planId} not found`);
        }

        if (plan.status !== 'approved') {
            throw new Error(`Plan ${planId} not approved (status: ${plan.status})`);
        }

        console.log(`\n🚀 Executing evolution plan: ${planId}`);
        plan.status = 'executing';

        const result: ExecutionResult = {
            planId,
            success: false,
            filesModified: [],
            backupPath: '',
            commitHash: '',
            errors: []
        };

        try {
            // Create backup
            if (plan.strategy.createBackup) {
                result.backupPath = await this.createBackup(plan);
                console.log(`   📦 Backup created: ${result.backupPath}`);
            }

            // Apply changes
            for (const change of plan.changes) {
                try {
                    await this.applyChange(change);
                    result.filesModified.push(change.filePath);
                    console.log(`   ✅ Modified: ${change.filePath}`);
                } catch (error: any) {
                    result.errors.push(`Failed to modify ${change.filePath}: ${error.message}`);
                    
                    if (plan.strategy.autoRollbackOnFailure) {
                        await this.rollback(plan, result.backupPath);
                        plan.status = 'rolled_back';
                        return result;
                    }
                }
            }

            // Git commit
            if (this.config.gitEnabled && this.config.autoCommit) {
                result.commitHash = await this.commitChanges(plan);
                console.log(`   📝 Committed: ${result.commitHash}`);
            }

            result.success = true;
            plan.status = 'committed';
            this.executedPlans.push(plan);
            this.pendingPlans.delete(planId);

            console.log(`   ✅ Evolution complete!`);
            this.emit('plan:executed', { plan, result });

        } catch (error: any) {
            result.errors.push(error.message);
            plan.status = 'failed';
            
            if (plan.strategy.autoRollbackOnFailure && result.backupPath) {
                await this.rollback(plan, result.backupPath);
                plan.status = 'rolled_back';
            }
        }

        return result;
    }

    /**
     * Apply single code change
     */
    private async applyChange(change: CodeChange): Promise<void> {
        const fullPath = path.join(this.config.workingDirectory, change.filePath);

        switch (change.changeType) {
            case 'modify':
                if (change.newCode) {
                    fs.writeFileSync(fullPath, change.newCode);
                }
                break;
            case 'create':
                if (change.newCode) {
                    const dir = path.dirname(fullPath);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    fs.writeFileSync(fullPath, change.newCode);
                }
                break;
            case 'delete':
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
                break;
            case 'rename':
                // Would implement rename logic
                break;
        }
    }

    /**
     * Create backup of affected files
     */
    private async createBackup(plan: EvolutionPlan): Promise<string> {
        const backupId = `backup_${plan.planId}_${Date.now()}`;
        const backupPath = path.join(this.config.workingDirectory, this.config.backupDirectory, backupId);
        
        fs.mkdirSync(backupPath, { recursive: true });

        for (const change of plan.changes) {
            if (change.originalCode) {
                const backupFile = path.join(backupPath, change.filePath.replace(/\//g, '_'));
                fs.writeFileSync(backupFile, change.originalCode);
            }
        }

        // Save plan metadata
        fs.writeFileSync(
            path.join(backupPath, 'plan.json'),
            JSON.stringify(plan, null, 2)
        );

        return backupPath;
    }

    /**
     * Rollback changes from backup
     */
    private async rollback(plan: EvolutionPlan, backupPath: string): Promise<void> {
        console.log(`   ⏪ Rolling back changes...`);

        for (const change of plan.changes) {
            const backupFile = path.join(backupPath, change.filePath.replace(/\//g, '_'));
            const targetPath = path.join(this.config.workingDirectory, change.filePath);

            if (fs.existsSync(backupFile)) {
                const originalContent = fs.readFileSync(backupFile, 'utf-8');
                fs.writeFileSync(targetPath, originalContent);
            }
        }

        console.log(`   ✅ Rollback complete`);
    }

    /**
     * 📝 Commit changes to Git
     */
    private async commitChanges(plan: EvolutionPlan): Promise<string> {
        // Check rate limit
        this.checkAndResetHourlyLimit();
        
        if (this.autoCommitsThisHour >= this.config.maxAutoCommitsPerHour) {
            throw new Error('Auto-commit rate limit exceeded');
        }

        const message = this.generateCommitMessage(plan);
        const files = plan.changes.map(c => c.filePath).join(' ');

        try {
            // Stage files
            await execAsync(`git add ${files}`, { cwd: this.config.workingDirectory });
            
            // Commit
            const { stdout } = await execAsync(
                `git commit -m "${message}"`,
                { cwd: this.config.workingDirectory }
            );

            // Get commit hash
            const { stdout: hashOut } = await execAsync(
                'git rev-parse HEAD',
                { cwd: this.config.workingDirectory }
            );

            const commitHash = hashOut.trim().substring(0, 8);
            
            this.autoCommitsThisHour++;
            
            this.commits.push({
                commitHash,
                message,
                filesChanged: plan.changes.map(c => c.filePath),
                timestamp: Date.now(),
                evolutionPlanId: plan.planId
            });

            return commitHash;
        } catch (error: any) {
            throw new Error(`Git commit failed: ${error.message}`);
        }
    }

    /**
     * Generate semantic commit message
     */
    private generateCommitMessage(plan: EvolutionPlan): string {
        if (!this.config.semanticCommitMessages) {
            return `Evolution: ${plan.trigger.type}`;
        }

        const typeMap: Record<EvolutionTrigger['type'], string> = {
            schema_change: 'feat',
            api_update: 'feat',
            performance_issue: 'perf',
            security_fix: 'fix',
            deprecation: 'refactor',
            optimization: 'perf'
        };

        const type = typeMap[plan.trigger.type] || 'chore';
        const scope = plan.trigger.source.split('/').pop() || 'core';
        const description = plan.changes[0]?.description || plan.trigger.type;

        return `${type}(${scope}): ${description}\\n\\n🤖 Auto-evolved by Self-Evolution Hook\\nPlan: ${plan.planId}\\nImpact: ${plan.estimatedImpact}/100`;
    }

    /**
     * Check and reset hourly commit limit
     */
    private checkAndResetHourlyLimit(): void {
        const now = Date.now();
        if (now - this.lastHourReset > 3600000) {
            this.autoCommitsThisHour = 0;
            this.lastHourReset = now;
        }
    }

    /**
     * 🔄 Quick evolve - trigger + plan + execute in one step
     */
    async quickEvolve(
        type: EvolutionTrigger['type'],
        source: string,
        context: Record<string, any>,
        options: { severity?: EvolutionTrigger['severity']; skipApproval?: boolean } = {}
    ): Promise<ExecutionResult | null> {
        // Register trigger
        const trigger = this.registerTrigger({
            type,
            source,
            severity: options.severity || 'low',
            context
        });

        // Create plan
        const plan = await this.createEvolutionPlan(trigger);

        // Auto-approve if allowed
        if (options.skipApproval || !plan.requiresReview) {
            this.approvePlan(plan.planId);
        } else {
            console.log(`   ⏸️ Plan requires manual approval`);
            return null;
        }

        // Execute
        return this.executePlan(plan.planId);
    }

    /**
     * 📊 Get evolution statistics
     */
    getStats(): EvolutionStats {
        return {
            pendingPlans: this.pendingPlans.size,
            executedPlans: this.executedPlans.length,
            totalCommits: this.commits.length,
            commitsThisHour: this.autoCommitsThisHour,
            maxCommitsPerHour: this.config.maxAutoCommitsPerHour,
            successRate: this.calculateSuccessRate()
        };
    }

    private calculateSuccessRate(): number {
        if (this.executedPlans.length === 0) return 1;
        const successful = this.executedPlans.filter(p => p.status === 'committed').length;
        return successful / this.executedPlans.length;
    }

    /**
     * Get pending plans requiring approval
     */
    getPendingApprovals(): EvolutionPlan[] {
        return Array.from(this.pendingPlans.values())
            .filter(p => p.status === 'pending');
    }
}

// ============================================================
// SUPPORTING TYPES
// ============================================================

interface ExecutionResult {
    planId: string;
    success: boolean;
    filesModified: string[];
    backupPath: string;
    commitHash: string;
    errors: string[];
}

interface EvolutionStats {
    pendingPlans: number;
    executedPlans: number;
    totalCommits: number;
    commitsThisHour: number;
    maxCommitsPerHour: number;
    successRate: number;
}

// ============================================================
// EXPORTS
// ============================================================

export function createSelfEvolutionHook(config?: Partial<EvolutionConfig>): SelfEvolutionHookEngine {
    return new SelfEvolutionHookEngine(config);
}

export type {
    EvolutionTrigger,
    EvolutionPlan,
    CodeChange,
    EvolutionStrategy,
    GitCommit,
    EvolutionConfig,
    ExecutionResult,
    EvolutionStats
};
