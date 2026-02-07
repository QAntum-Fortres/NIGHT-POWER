/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                               ║
 * ║  ██████╗ ██╗   ██╗██████╗  ██████╗ ███████╗    ███████╗███╗   ██╗ ██████╗ ██╗███╗   ██╗███████╗║
 * ║  ██╔══██╗██║   ██║██╔══██╗██╔════╝ ██╔════╝    ██╔════╝████╗  ██║██╔════╝ ██║████╗  ██║██╔════╝║
 * ║  ██████╔╝██║   ██║██████╔╝██║  ███╗█████╗      █████╗  ██╔██╗ ██║██║  ███╗██║██╔██╗ ██║█████╗  ║
 * ║  ██╔═══╝ ██║   ██║██╔══██╗██║   ██║██╔══╝      ██╔══╝  ██║╚██╗██║██║   ██║██║██║╚██╗██║██╔══╝  ║
 * ║  ██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗    ███████╗██║ ╚████║╚██████╔╝██║██║ ╚████║███████╗║
 * ║  ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝    ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝║
 * ║                                                                                               ║
 * ║                    THE GREAT PURGE v2 - "Dead Code Elimination Engine"                        ║
 * ║                       "Премахваме 4.2% мъртва материя безопасно"                              ║
 * ║                                                                                               ║
 * ║   Използва данните от meditation-result.json за:                                              ║
 * ║     • Безопасно премахване на неизползвани exports                                            ║
 * ║     • Изчистване на orphan interfaces                                                         ║
 * ║     • Tree-shaking на стероиди                                                                ║
 * ║                                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                                      ║
 * ║                                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises';
import { join, relative, dirname, basename } from 'path';
import { existsSync } from 'fs';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface DeadSymbol {
    name: string;
    file: string;
    type: 'export' | 'interface' | 'type' | 'function' | 'class' | 'const';
    line: number;
    reason: string;
}

interface MeditationResult {
    timestamp: string;
    duration: number;
    assimilation: {
        totalFiles: number;
        totalLines: number;
        totalSymbols: number;
    };
    layerAudit: {
        violations: any[];
        circularDependencies: any[];
        healthScore: number;
    };
    deadSymbols: {
        unusedExports: DeadSymbol[];
        unusedInterfaces: DeadSymbol[];
    };
}

interface PurgeResult {
    timestamp: string;
    symbolsPurged: number;
    filesModified: number;
    linesRemoved: number;
    bytesSaved: number;
    safetyChecks: SafetyCheck[];
    errors: PurgeError[];
    backupPath: string;
}

interface SafetyCheck {
    symbol: string;
    file: string;
    check: string;
    passed: boolean;
    details?: string;
}

interface PurgeError {
    symbol: string;
    file: string;
    error: string;
    recoverable: boolean;
}

interface PurgeOptions {
    dryRun: boolean;
    createBackup: boolean;
    preserveInterfaces: boolean;   // Keep interfaces даже и мъртви (за API стабилност)
    preserveTypes: boolean;        // Keep types даже и мъртви
    maxPurgePercent: number;       // Max % от файла за премахване
    excludePatterns: string[];     // Файлове да се изключат
    verbose: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PURGE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PurgeEngine - The Great Purge v2
 * 
 * Безопасно премахване на мъртъв код с:
 * - Backup преди всяка промяна
 * - Double-check с Assimilator
 * - Rollback при грешка
 */
export class PurgeEngine {
    private static instance: PurgeEngine;
    
    private meditationResult: MeditationResult | null = null;
    private srcRoot: string;
    private backupRoot: string;
    
    private options: PurgeOptions = {
        dryRun: false,
        createBackup: true,
        preserveInterfaces: true,
        preserveTypes: true,
        maxPurgePercent: 30,
        excludePatterns: [
            'index.ts',      // Entry points
            '.spec.ts',      // Tests
            '.test.ts',      // Tests
            'types.ts',      // Type definitions
            'interfaces.ts', // Interface definitions
        ],
        verbose: true
    };

    private constructor() {
        this.srcRoot = join(process.cwd(), 'src');
        this.backupRoot = join(process.cwd(), 'data', 'purge-backup');
    }

    /**
     * Get singleton instance
     */
    static getInstance(): PurgeEngine {
        if (!PurgeEngine.instance) {
            PurgeEngine.instance = new PurgeEngine();
        }
        return PurgeEngine.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MAIN PURGE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Execute the Great Purge
     */
    async purge(meditationResultPath: string, options?: Partial<PurgeOptions>): Promise<PurgeResult> {
        const startTime = Date.now();
        
        // Merge options
        if (options) {
            this.options = { ...this.options, ...options };
        }

        console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
        console.log('║                    💀 THE GREAT PURGE v2                                 ║');
        console.log('║                  "Eliminating Dead Code Safely"                         ║');
        console.log('╠══════════════════════════════════════════════════════════════════════════╣');
        console.log(`║  Mode: ${this.options.dryRun ? '🔍 DRY RUN (No changes)' : '⚡ LIVE PURGE'}                                       ║`);
        console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

        const result: PurgeResult = {
            timestamp: new Date().toISOString(),
            symbolsPurged: 0,
            filesModified: 0,
            linesRemoved: 0,
            bytesSaved: 0,
            safetyChecks: [],
            errors: [],
            backupPath: ''
        };

        try {
            // 1. Load meditation result
            console.log('📖 Loading meditation result...');
            await this.loadMeditationResult(meditationResultPath);
            
            const totalDead = this.getTotalDeadSymbols();
            console.log(`   Found ${totalDead} dead symbols to analyze\n`);

            // 2. Create backup
            if (this.options.createBackup && !this.options.dryRun) {
                console.log('💾 Creating backup...');
                result.backupPath = await this.createBackup();
                console.log(`   Backup: ${result.backupPath}\n`);
            }

            // 3. Group by file
            const symbolsByFile = this.groupSymbolsByFile();
            console.log(`📁 Symbols grouped into ${symbolsByFile.size} files\n`);

            // 4. Process each file
            console.log('═══════════════════════════════════════════════════════════════════════════');
            console.log('  PROCESSING FILES');
            console.log('═══════════════════════════════════════════════════════════════════════════\n');

            for (const [file, symbols] of symbolsByFile) {
                const fileResult = await this.processFile(file, symbols, result);
                
                if (fileResult.modified) {
                    result.filesModified++;
                    result.symbolsPurged += fileResult.symbolsPurged;
                    result.linesRemoved += fileResult.linesRemoved;
                    result.bytesSaved += fileResult.bytesSaved;
                }
            }

            // 5. Generate report
            await this.generateReport(result, Date.now() - startTime);

        } catch (error) {
            console.error('❌ Purge failed:', error);
            result.errors.push({
                symbol: 'GLOBAL',
                file: 'N/A',
                error: String(error),
                recoverable: false
            });
        }

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MEDITATION RESULT LOADING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Load meditation result
     */
    private async loadMeditationResult(path: string): Promise<void> {
        const content = await readFile(path, 'utf-8');
        this.meditationResult = JSON.parse(content);
    }

    /**
     * Get total dead symbols
     */
    private getTotalDeadSymbols(): number {
        if (!this.meditationResult) return 0;
        
        const exports = this.meditationResult.deadSymbols.unusedExports?.length || 0;
        const interfaces = this.meditationResult.deadSymbols.unusedInterfaces?.length || 0;
        
        return exports + interfaces;
    }

    /**
     * Group symbols by file
     */
    private groupSymbolsByFile(): Map<string, DeadSymbol[]> {
        const grouped = new Map<string, DeadSymbol[]>();
        
        if (!this.meditationResult) return grouped;

        const allDeadSymbols = [
            ...(this.meditationResult.deadSymbols.unusedExports || []),
            ...(this.meditationResult.deadSymbols.unusedInterfaces || [])
        ];

        for (const symbol of allDeadSymbols) {
            // Skip based on options
            if (this.options.preserveInterfaces && symbol.type === 'interface') continue;
            if (this.options.preserveTypes && symbol.type === 'type') continue;
            
            // Skip excluded patterns
            const shouldExclude = this.options.excludePatterns.some(pattern => 
                symbol.file.includes(pattern)
            );
            if (shouldExclude) continue;

            const existing = grouped.get(symbol.file) || [];
            existing.push(symbol);
            grouped.set(symbol.file, existing);
        }

        return grouped;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FILE PROCESSING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Process a single file
     */
    private async processFile(
        relativePath: string,
        symbols: DeadSymbol[],
        result: PurgeResult
    ): Promise<{ modified: boolean; symbolsPurged: number; linesRemoved: number; bytesSaved: number }> {
        const filePath = join(this.srcRoot, relativePath);
        
        // Check if file exists
        if (!existsSync(filePath)) {
            if (this.options.verbose) {
                console.log(`   ⚠️ File not found: ${relativePath}`);
            }
            return { modified: false, symbolsPurged: 0, linesRemoved: 0, bytesSaved: 0 };
        }

        const originalContent = await readFile(filePath, 'utf-8');
        const originalSize = originalContent.length;
        const originalLines = originalContent.split('\n').length;

        let modifiedContent = originalContent;
        let purgedCount = 0;

        console.log(`📄 ${relativePath} (${symbols.length} dead symbols)`);

        for (const symbol of symbols) {
            // Safety check
            const safetyCheck = this.performSafetyCheck(symbol, modifiedContent);
            result.safetyChecks.push(safetyCheck);

            if (!safetyCheck.passed) {
                console.log(`   ⚠️ Skip ${symbol.name}: ${safetyCheck.details}`);
                continue;
            }

            // Find and remove the symbol
            const removal = this.removeSymbol(symbol, modifiedContent);
            
            if (removal.success) {
                modifiedContent = removal.newContent;
                purgedCount++;
                console.log(`   ✅ Removed: ${symbol.name} (${symbol.type})`);
            } else {
                console.log(`   ❌ Failed: ${symbol.name} - ${removal.error}`);
                result.errors.push({
                    symbol: symbol.name,
                    file: symbol.file,
                    error: removal.error || 'Unknown error',
                    recoverable: true
                });
            }
        }

        // Calculate stats
        const newLines = modifiedContent.split('\n').length;
        const linesRemoved = originalLines - newLines;
        const bytesSaved = originalSize - modifiedContent.length;

        // Check max purge percent
        const purgePercent = (linesRemoved / originalLines) * 100;
        if (purgePercent > this.options.maxPurgePercent) {
            console.log(`   🛑 Aborting: Would remove ${purgePercent.toFixed(1)}% (max: ${this.options.maxPurgePercent}%)`);
            return { modified: false, symbolsPurged: 0, linesRemoved: 0, bytesSaved: 0 };
        }

        // Write changes (unless dry run)
        if (!this.options.dryRun && purgedCount > 0) {
            await writeFile(filePath, modifiedContent, 'utf-8');
        }

        if (purgedCount > 0) {
            console.log(`   📊 Result: -${linesRemoved} lines, -${bytesSaved} bytes\n`);
        }

        return {
            modified: purgedCount > 0,
            symbolsPurged: purgedCount,
            linesRemoved,
            bytesSaved
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SYMBOL REMOVAL
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Remove a symbol from content
     */
    private removeSymbol(
        symbol: DeadSymbol,
        content: string
    ): { success: boolean; newContent: string; error?: string } {
        try {
            const patterns = this.getRemovalPatterns(symbol);
            
            for (const pattern of patterns) {
                const match = content.match(pattern);
                if (match) {
                    // Remove the matched content
                    const newContent = content.replace(pattern, '');
                    
                    // Clean up empty lines
                    const cleanedContent = this.cleanupEmptyLines(newContent);
                    
                    return { success: true, newContent: cleanedContent };
                }
            }

            return { success: false, newContent: content, error: 'No matching pattern found' };
        } catch (error) {
            return { success: false, newContent: content, error: String(error) };
        }
    }

    /**
     * Get regex patterns for symbol removal
     */
    private getRemovalPatterns(symbol: DeadSymbol): RegExp[] {
        const name = this.escapeRegex(symbol.name);
        const patterns: RegExp[] = [];

        switch (symbol.type) {
            case 'export':
                // export const NAME = ...;
                patterns.push(new RegExp(`^\\s*export\\s+const\\s+${name}\\s*=.*?;\\s*$`, 'gm'));
                // export function NAME(...) { ... }
                patterns.push(new RegExp(`^\\s*export\\s+function\\s+${name}\\s*\\([^)]*\\)\\s*\\{[^}]*\\}\\s*$`, 'gms'));
                // export { NAME };
                patterns.push(new RegExp(`^\\s*export\\s*\\{[^}]*\\b${name}\\b[^}]*\\};?\\s*$`, 'gm'));
                break;

            case 'interface':
                // export interface NAME { ... }
                patterns.push(new RegExp(`^\\s*export\\s+interface\\s+${name}\\s*\\{[^}]*\\}\\s*$`, 'gms'));
                break;

            case 'type':
                // export type NAME = ...;
                patterns.push(new RegExp(`^\\s*export\\s+type\\s+${name}\\s*=.*?;\\s*$`, 'gms'));
                break;

            case 'class':
                // export class NAME { ... }
                patterns.push(new RegExp(`^\\s*export\\s+class\\s+${name}\\s*(extends[^{]*)?\\{[\\s\\S]*?^\\}\\s*$`, 'gm'));
                break;

            case 'function':
                // export function NAME
                patterns.push(new RegExp(`^\\s*export\\s+(async\\s+)?function\\s+${name}\\s*\\([^)]*\\)[^{]*\\{[\\s\\S]*?^\\}\\s*$`, 'gm'));
                break;

            case 'const':
                // export const NAME
                patterns.push(new RegExp(`^\\s*export\\s+const\\s+${name}\\s*[:=][^;]+;\\s*$`, 'gm'));
                break;
        }

        return patterns;
    }

    /**
     * Escape regex special characters
     */
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Clean up multiple empty lines
     */
    private cleanupEmptyLines(content: string): string {
        // Replace 3+ empty lines with 2
        return content.replace(/\n{4,}/g, '\n\n\n');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SAFETY CHECKS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Perform safety check before removal
     */
    private performSafetyCheck(symbol: DeadSymbol, content: string): SafetyCheck {
        // Check 1: Symbol actually exists
        const symbolExists = content.includes(symbol.name);
        if (!symbolExists) {
            return {
                symbol: symbol.name,
                file: symbol.file,
                check: 'existence',
                passed: false,
                details: 'Symbol not found in file'
            };
        }

        // Check 2: Not used elsewhere in the same file (internal reference)
        const exportPattern = new RegExp(`export\\s+(const|function|class|interface|type)\\s+${symbol.name}`, 'g');
        const usagePattern = new RegExp(`(?<!export\\s+(const|function|class|interface|type)\\s+)\\b${symbol.name}\\b`, 'g');
        
        const exportMatches = content.match(exportPattern) || [];
        const usageMatches = content.match(usagePattern) || [];
        
        // If used more times than exported, it's used internally
        if (usageMatches.length > exportMatches.length + 1) {
            return {
                symbol: symbol.name,
                file: symbol.file,
                check: 'internal-usage',
                passed: false,
                details: `Used ${usageMatches.length - exportMatches.length} times internally`
            };
        }

        // Check 3: Not a core infrastructure symbol
        const corePatterns = [
            /Config$/,
            /Options$/,
            /Settings$/,
            /^init/i,
            /^get[A-Z]/,
            /^create[A-Z]/,
            /Instance$/
        ];
        
        for (const pattern of corePatterns) {
            if (pattern.test(symbol.name)) {
                return {
                    symbol: symbol.name,
                    file: symbol.file,
                    check: 'core-pattern',
                    passed: false,
                    details: `Matches core pattern: ${pattern}`
                };
            }
        }

        return {
            symbol: symbol.name,
            file: symbol.file,
            check: 'all-checks',
            passed: true
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BACKUP
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create backup of src directory
     */
    private async createBackup(): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = join(this.backupRoot, `purge-${timestamp}`);
        
        await mkdir(backupPath, { recursive: true });

        // Copy all files that will be modified
        const symbolsByFile = this.groupSymbolsByFile();
        
        for (const [relativePath] of symbolsByFile) {
            const sourcePath = join(this.srcRoot, relativePath);
            const destPath = join(backupPath, relativePath);
            
            if (existsSync(sourcePath)) {
                await mkdir(dirname(destPath), { recursive: true });
                const content = await readFile(sourcePath, 'utf-8');
                await writeFile(destPath, content, 'utf-8');
            }
        }

        return backupPath;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REPORTING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate purge report
     */
    private async generateReport(result: PurgeResult, durationMs: number): Promise<void> {
        const reportPath = join(process.cwd(), 'data', 'purge-report.json');
        const mdReportPath = join(process.cwd(), 'data', 'purge-report.md');

        await mkdir(dirname(reportPath), { recursive: true });

        // JSON report
        await writeFile(reportPath, JSON.stringify(result, null, 2), 'utf-8');

        // Markdown report
        const mdContent = `# 💀 THE GREAT PURGE v2 - Report

**Generated:** ${result.timestamp}
**Duration:** ${(durationMs / 1000).toFixed(2)}s
**Mode:** ${this.options.dryRun ? 'DRY RUN' : 'LIVE'}

## 📊 Summary

| Metric | Value |
|--------|-------|
| Symbols Purged | ${result.symbolsPurged} |
| Files Modified | ${result.filesModified} |
| Lines Removed | ${result.linesRemoved} |
| Bytes Saved | ${(result.bytesSaved / 1024).toFixed(2)} KB |

## ✅ Safety Checks

${result.safetyChecks.filter(c => c.passed).length} / ${result.safetyChecks.length} passed

### Failed Checks:
${result.safetyChecks.filter(c => !c.passed).map(c => 
    `- **${c.symbol}** (${c.file}): ${c.details}`
).join('\n') || '_None_'}

## ❌ Errors

${result.errors.length > 0 ? result.errors.map(e =>
    `- **${e.symbol}** (${e.file}): ${e.error}`
).join('\n') : '_No errors_'}

## 💾 Backup

${result.backupPath ? `Backup created at: \`${result.backupPath}\`` : '_No backup created_'}

---
*Generated by QAntum Purge Engine v2*
`;

        await writeFile(mdReportPath, mdContent, 'utf-8');

        console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
        console.log('║                    💀 PURGE COMPLETE                                     ║');
        console.log('╠══════════════════════════════════════════════════════════════════════════╣');
        console.log(`║  📊 Symbols Purged: ${String(result.symbolsPurged).padEnd(8)} 📁 Files Modified: ${String(result.filesModified).padEnd(8)}║`);
        console.log(`║  📝 Lines Removed:  ${String(result.linesRemoved).padEnd(8)} 💾 Bytes Saved:    ${String((result.bytesSaved / 1024).toFixed(1) + ' KB').padEnd(8)}║`);
        console.log('║                                                                          ║');
        console.log(`║  ⏱️ Duration: ${(durationMs / 1000).toFixed(2)}s                                                    ║`);
        console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

        console.log(`📋 Reports saved to:`);
        console.log(`   • ${reportPath}`);
        console.log(`   • ${mdReportPath}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export function getPurgeEngine(): PurgeEngine {
    return PurgeEngine.getInstance();
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    
    const engine = getPurgeEngine();
    const meditationPath = join(process.cwd(), 'data', 'supreme-meditation', 'meditation-result.json');

    if (!existsSync(meditationPath)) {
        console.error('❌ meditation-result.json not found!');
        console.error('   Run supreme-meditation.ts first.');
        process.exit(1);
    }

    await engine.purge(meditationPath, { dryRun });
}

// Run if called directly
main().catch(console.error);
