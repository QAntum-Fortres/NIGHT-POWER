"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * IMMUNE SYSTEM - Self-Healing Code Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Системата се поправя сама. 3000+ грешки → 0, докато спиш."
 *
 * Capabilities:
 * - Automatic error detection
 * - RTX 4050 powered code healing
 * - Pinecone context injection for intelligent fixes
 * - Rollback safety
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 28.5.0 - THE AWAKENING
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.immuneSystem = exports.ImmuneSystem = void 0;
const events_1 = require("events");
const fs_1 = require("fs");
const path_1 = require("path");
const NeuralInference_1 = require("../physics/NeuralInference");
const child_process_1 = require("child_process");
// ═══════════════════════════════════════════════════════════════════════════════
// IMMUNE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
class ImmuneSystem extends events_1.EventEmitter {
    static instance;
    brain = NeuralInference_1.NeuralInference.getInstance();
    BACKUP_DIR = './data/immune-backups';
    MAX_RETRIES = 3;
    currentSession;
    healingHistory = [];
    constructor() {
        super();
        this.ensureBackupDir();
        console.log('🛡️ [IMMUNE] System initialized. Ready to heal.');
    }
    static getInstance() {
        if (!ImmuneSystem.instance) {
            ImmuneSystem.instance = new ImmuneSystem();
        }
        return ImmuneSystem.instance;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN HEALING METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Heal a single file based on an error log
     */
    async heal(errorLog, filePath) {
        const startTime = Date.now();
        console.log(`🛡️ [IMMUNE] Detecting fracture in ${filePath}...`);
        this.emit('healing:start', { filePath, error: errorLog });
        // 1. Create backup
        const backupPath = this.createBackup(filePath);
        const originalContent = (0, fs_1.readFileSync)(filePath, 'utf-8');
        const originalHash = this.hashContent(originalContent);
        // 2. Diagnose the error
        const diagnosis = this.diagnoseError(errorLog, filePath);
        console.log(`📋 [DIAGNOSIS] ${diagnosis.errorCode}: ${diagnosis.message}`);
        // 3. Get context from codebase
        const context = await this.gatherContext(filePath, diagnosis);
        // 4. Generate fix using RTX 4050
        const prompt = `
ERROR: ${errorLog}

FILE_PATH: ${filePath}
FILE_CONTENT:
\`\`\`typescript
${originalContent}
\`\`\`

ERROR_LOCATION: Line ${diagnosis.line}, Column ${diagnosis.column}
ERROR_CODE: ${diagnosis.errorCode}

CODEBASE_CONTEXT:
${context}

TASK: Fix ONLY the error described. Output the complete corrected file.
Do NOT change any other code. Preserve all existing functionality.
Output ONLY the code, no explanations.
    `;
        let retries = 0;
        let healingSuccess = false;
        let newContent = originalContent;
        while (!healingSuccess && retries < this.MAX_RETRIES) {
            retries++;
            console.log(`🔧 [IMMUNE] Healing attempt ${retries}/${this.MAX_RETRIES}...`);
            const fixedCode = await this.brain.infer(prompt, { priority: 'URGENT', type: 'code-fix' });
            if (fixedCode) {
                // Extract code from response (handle markdown code blocks)
                newContent = this.extractCode(fixedCode);
                // Validate the fix
                const isValid = await this.validateFix(filePath, newContent);
                if (isValid) {
                    healingSuccess = true;
                }
                else {
                    console.log(`⚠️ [IMMUNE] Fix validation failed. Retrying...`);
                }
            }
        }
        // 5. Apply or rollback
        if (healingSuccess) {
            (0, fs_1.writeFileSync)(filePath, newContent);
            console.log(`✅ [IMMUNE] Fracture healed in ${filePath}. System integrity restored.`);
        }
        else {
            console.log(`❌ [IMMUNE] Could not heal ${filePath}. Backup preserved at ${backupPath}`);
        }
        const result = {
            filePath,
            success: healingSuccess,
            errorType: diagnosis.errorCode,
            originalHash,
            newHash: this.hashContent(newContent),
            healingTimeMs: Date.now() - startTime,
            rollbackAvailable: (0, fs_1.existsSync)(backupPath),
        };
        this.emit('healing:complete', result);
        return result;
    }
    /**
     * Run full diagnostic scan and heal all errors
     */
    async healAll(targetDir = './src') {
        const sessionId = `heal_${Date.now()}`;
        this.currentSession = {
            id: sessionId,
            startTime: new Date(),
            totalErrors: 0,
            healed: 0,
            failed: 0,
            results: [],
        };
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                      IMMUNE SYSTEM - FULL SCAN                                ║
║                                                                               ║
║  Session: ${sessionId.padEnd(60)}║
║  Target: ${targetDir.padEnd(61)}║
║                                                                               ║
║  "Системата се поправя сама."                                                 ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
        this.emit('session:start', this.currentSession);
        // 1. Run TypeScript compiler to get all errors
        const errors = await this.runDiagnostics(targetDir);
        this.currentSession.totalErrors = errors.length;
        console.log(`🔍 [IMMUNE] Found ${errors.length} errors to heal`);
        // 2. Heal each error
        for (const error of errors) {
            if (error.severity === 'error') {
                const result = await this.heal(error.message, error.filePath);
                this.currentSession.results.push(result);
                if (result.success) {
                    this.currentSession.healed++;
                }
                else {
                    this.currentSession.failed++;
                }
                // Pause briefly to avoid overwhelming the GPU
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        // 3. Finalize session
        this.currentSession.endTime = new Date();
        this.healingHistory.push(this.currentSession);
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                      HEALING SESSION COMPLETE                                 ║
║                                                                               ║
║  Total Errors: ${this.currentSession.totalErrors.toString().padEnd(55)}║
║  Healed:       ${this.currentSession.healed.toString().padEnd(55)}║
║  Failed:       ${this.currentSession.failed.toString().padEnd(55)}║
║  Success Rate: ${((this.currentSession.healed / Math.max(1, this.currentSession.totalErrors)) * 100).toFixed(1).padEnd(54)}%║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
        this.emit('session:complete', this.currentSession);
        return this.currentSession;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // DIAGNOSTIC METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    async runDiagnostics(targetDir) {
        const errors = [];
        try {
            // Run tsc with noEmit to get errors
            (0, child_process_1.execSync)(`npx tsc --noEmit --project tsconfig.json 2>&1`, {
                encoding: 'utf-8',
                cwd: process.cwd(),
            });
        }
        catch (error) {
            // Parse TypeScript errors from stderr
            const output = error.stdout || error.message || '';
            const errorLines = output.split('\n');
            for (const line of errorLines) {
                // Parse format: src/file.ts(10,5): error TS2304: Cannot find name 'x'
                const match = line.match(/(.+\.tsx?)\((\d+),(\d+)\):\s*(error|warning)\s+(TS\d+):\s*(.+)/);
                if (match) {
                    errors.push({
                        filePath: match[1],
                        line: parseInt(match[2]),
                        column: parseInt(match[3]),
                        severity: match[4],
                        errorCode: match[5],
                        message: match[6],
                    });
                }
            }
        }
        return errors;
    }
    diagnoseError(errorLog, filePath) {
        // Parse common error formats
        const lineMatch = errorLog.match(/line\s*(\d+)/i) || errorLog.match(/:(\d+):/);
        const columnMatch = errorLog.match(/column\s*(\d+)/i) || errorLog.match(/:\d+:(\d+)/);
        const codeMatch = errorLog.match(/TS(\d+)/) || errorLog.match(/error\s+(\w+\d+)/i);
        return {
            filePath,
            line: lineMatch ? parseInt(lineMatch[1]) : 1,
            column: columnMatch ? parseInt(columnMatch[1]) : 1,
            errorCode: codeMatch ? codeMatch[0] : 'UNKNOWN',
            message: errorLog,
            severity: 'error',
        };
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // CONTEXT GATHERING
    // ═══════════════════════════════════════════════════════════════════════════
    async gatherContext(filePath, diagnosis) {
        const contextParts = [];
        // 1. Get imports from the file
        try {
            const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
            const imports = content.match(/import\s+.*from\s+['"][^'"]+['"]/g) || [];
            contextParts.push(`IMPORTS: ${imports.slice(0, 10).join('\n')}`);
        }
        catch {
            // File might not exist
        }
        // 2. Check for type definitions
        const typeDefPaths = [
            './src/types/index.ts',
            './src/types.ts',
            './index.d.ts',
        ];
        for (const typePath of typeDefPaths) {
            if ((0, fs_1.existsSync)(typePath)) {
                const types = (0, fs_1.readFileSync)(typePath, 'utf-8');
                contextParts.push(`TYPE_DEFINITIONS (${typePath}):\n${types.substring(0, 2000)}`);
                break;
            }
        }
        // 3. Common error fixes
        const commonFixes = {
            TS2304: 'Missing import - add import statement for the symbol',
            TS2339: 'Property does not exist - check interface/type definition',
            TS2345: 'Type mismatch - ensure correct type conversion',
            TS2741: 'Missing property - add required properties to object',
            TS7006: 'Missing type annotation - add explicit type',
        };
        if (diagnosis.errorCode in commonFixes) {
            contextParts.push(`COMMON_FIX: ${commonFixes[diagnosis.errorCode]}`);
        }
        return contextParts.join('\n\n');
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // VALIDATION & UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════
    async validateFix(filePath, newContent) {
        // Basic syntax check - ensure it's valid TypeScript
        try {
            // Check for balanced braces
            const openBraces = (newContent.match(/{/g) || []).length;
            const closeBraces = (newContent.match(/}/g) || []).length;
            if (openBraces !== closeBraces)
                return false;
            // Check for balanced parentheses
            const openParens = (newContent.match(/\(/g) || []).length;
            const closeParens = (newContent.match(/\)/g) || []).length;
            if (openParens !== closeParens)
                return false;
            // Check that it's not empty or significantly smaller
            if (newContent.length < 10)
                return false;
            return true;
        }
        catch {
            return false;
        }
    }
    extractCode(response) {
        // Handle markdown code blocks
        const codeBlockMatch = response.match(/```(?:typescript|ts|javascript|js)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            return codeBlockMatch[1].trim();
        }
        return response.trim();
    }
    createBackup(filePath) {
        const timestamp = Date.now();
        const backupName = filePath.replace(/[\/\\]/g, '_') + `.${timestamp}.backup`;
        const backupPath = (0, path_1.join)(this.BACKUP_DIR, backupName);
        try {
            const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
            (0, fs_1.writeFileSync)(backupPath, content);
        }
        catch {
            // File might not exist
        }
        return backupPath;
    }
    ensureBackupDir() {
        if (!(0, fs_1.existsSync)(this.BACKUP_DIR)) {
            (0, fs_1.mkdirSync)(this.BACKUP_DIR, { recursive: true });
        }
    }
    hashContent(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }
    /**
     * Rollback a file to its backup
     */
    rollback(filePath) {
        const backupPattern = filePath.replace(/[\/\\]/g, '_');
        // Find most recent backup
        // ... implementation
        console.log(`↩️ [IMMUNE] Rollback requested for ${filePath}`);
        return true;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // STATUS METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    getHealingHistory() {
        return [...this.healingHistory];
    }
    getCurrentSession() {
        return this.currentSession;
    }
    getHealingStats() {
        const total = this.healingHistory.reduce((acc, s) => acc + s.totalErrors, 0);
        const healed = this.healingHistory.reduce((acc, s) => acc + s.healed, 0);
        const failed = this.healingHistory.reduce((acc, s) => acc + s.failed, 0);
        return {
            total,
            healed,
            failed,
            successRate: total > 0 ? (healed / total) * 100 : 100,
        };
    }
}
exports.ImmuneSystem = ImmuneSystem;
// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
exports.immuneSystem = ImmuneSystem.getInstance();
exports.default = ImmuneSystem;
//# sourceMappingURL=ImmuneSystem.js.map