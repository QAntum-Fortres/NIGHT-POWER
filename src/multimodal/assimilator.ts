// @ts-nocheck
/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                               ║
 * ║   █████╗ ███████╗███████╗██╗███╗   ███╗██╗██╗      █████╗ ████████╗ ██████╗ ██████╗           ║
 * ║  ██╔══██╗██╔════╝██╔════╝██║████╗ ████║██║██║     ██╔══██╗╚══██╔══╝██╔═══██╗██╔══██╗          ║
 * ║  ███████║███████╗███████╗██║██╔████╔██║██║██║     ███████║   ██║   ██║   ██║██████╔╝          ║
 * ║  ██╔══██║╚════██║╚════██║██║██║╚██╔╝██║██║██║     ██╔══██║   ██║   ██║   ██║██╔══██╗          ║
 * ║  ██║  ██║███████║███████║██║██║ ╚═╝ ██║██║███████╗██║  ██║   ██║   ╚██████╔╝██║  ██║          ║
 * ║  ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝╚═╝     ╚═╝╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝          ║
 * ║                                                                                               ║
 * ║                      ANTI-HALLUCINATION ENGINE                                                ║
 * ║              "Реален контекст = Нула халюцинации"                                             ║
 * ║                                                                                               ║
 * ║   Purpose:                                                                                    ║
 * ║     • Assimilate REAL code from project folders                                               ║
 * ║     • Verify references actually exist                                                        ║
 * ║     • Provide grounded context to AI                                                          ║
 * ║     • Prevent fabricated imports, classes, methods                                            ║
 * ║                                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                                        ║
 * ║                                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { readdir, readFile, stat, writeFile } from 'fs/promises';
import { join, extname, relative, basename } from 'path';
import { existsSync } from 'fs';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AssimilationConfig {
    targetFolder: string;
    allowedExtensions: string[];
    ignoreFiles: string[];
    ignorePatterns: RegExp[];
    maxFileSize: number;
    maxTotalSize: number;
    recursive: boolean;
    includeMetadata: boolean;
    tokenBudget: number;
}

export interface AssimilatedFile {
    path: string;
    relativePath: string;
    name: string;
    extension: string;
    content: string;
    size: number;
    lines: number;
    hash: string;
    exports: ExportInfo[];
    imports: ImportInfo[];
    classes: string[];
    functions: string[];
    interfaces: string[];
    types: string[];
}

export interface ExportInfo {
    name: string;
    type: 'class' | 'function' | 'const' | 'interface' | 'type' | 'enum' | 'default';
    line: number;
}

export interface ImportInfo {
    module: string;
    imports: string[];
    line: number;
    isRelative: boolean;
}

export interface AssimilationResult {
    success: boolean;
    timestamp: string;
    sourceFolder: string;
    totalFiles: number;
    totalLines: number;
    totalSize: number;
    estimatedTokens: number;
    files: AssimilatedFile[];
    registry: SymbolRegistry;
    contextString: string;
    warnings: string[];
}

export interface SymbolRegistry {
    classes: Map<string, string>;      // name -> file path
    functions: Map<string, string>;
    interfaces: Map<string, string>;
    types: Map<string, string>;
    constants: Map<string, string>;
    exports: Map<string, string>;
}

export interface VerificationResult {
    valid: boolean;
    exists: boolean;
    type?: string;
    file?: string;
    suggestions?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: AssimilationConfig = {
    targetFolder: './src',
    allowedExtensions: ['.ts', '.js', '.tsx', '.jsx', '.json', '.md'],
    ignoreFiles: ['package-lock.json', 'yarn.lock', '.DS_Store', 'thumbs.db'],
    ignorePatterns: [/node_modules/, /\.git/, /dist/, /build/, /coverage/, /\.test\./, /\.spec\./],
    maxFileSize: 100 * 1024,      // 100KB per file
    maxTotalSize: 2 * 1024 * 1024, // 2MB total
    recursive: true,
    includeMetadata: true,
    tokenBudget: 50000            // ~50K tokens max context
};

// ═══════════════════════════════════════════════════════════════════════════════
// ASSIMILATOR ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Assimilator - The Anti-Hallucination Engine
 * 
 * Collects REAL code from the project and builds a verified symbol registry.
 * Any AI reference can be checked against this registry to prevent hallucinations.
 */
export class Assimilator {
    private static instance: Assimilator;

    private config: AssimilationConfig;
    private lastResult: AssimilationResult | null = null;
    private symbolRegistry: SymbolRegistry;

    private constructor(config: Partial<AssimilationConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.symbolRegistry = this.createEmptyRegistry();
    }

    static getInstance(config?: Partial<AssimilationConfig>): Assimilator {
        if (!Assimilator.instance) {
            Assimilator.instance = new Assimilator(config);
        }
        return Assimilator.instance;
    }

    /**
     * Assimilate an entire folder into verified context
     */
    async assimilate(folder?: string): Promise<AssimilationResult> {
        const targetFolder = folder || this.config.targetFolder;
        const startTime = Date.now();
        const warnings: string[] = [];

        console.log(`\n🔬 ASSIMILATOR: Scanning ${targetFolder}...`);

        // Reset registry
        this.symbolRegistry = this.createEmptyRegistry();

        // Collect all files
        const files: AssimilatedFile[] = [];
        let totalSize = 0;

        await this.scanDirectory(targetFolder, files, warnings);

        // Calculate totals
        const totalLines = files.reduce((sum, f) => sum + f.lines, 0);
        totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const estimatedTokens = Math.ceil(totalSize / 4);

        // Build context string
        const contextString = this.buildContextString(files);

        // Build result
        const result: AssimilationResult = {
            success: true,
            timestamp: new Date().toISOString(),
            sourceFolder: targetFolder,
            totalFiles: files.length,
            totalLines,
            totalSize,
            estimatedTokens,
            files,
            registry: this.symbolRegistry,
            contextString,
            warnings
        };

        this.lastResult = result;

        console.log(`   ✓ ${files.length} files assimilated`);
        console.log(`   ✓ ${totalLines.toLocaleString()} lines of code`);
        console.log(`   ✓ ~${estimatedTokens.toLocaleString()} tokens`);
        console.log(`   ✓ ${this.getRegistryStats()} symbols registered`);
        console.log(`   ⏱️ ${Date.now() - startTime}ms\n`);

        return result;
    }

    /**
     * Verify if a symbol exists in the codebase
     */
    verify(symbolName: string, expectedType?: string): VerificationResult {
        // Check each registry
        const checks: [Map<string, string>, string][] = [
            [this.symbolRegistry.classes, 'class'],
            [this.symbolRegistry.functions, 'function'],
            [this.symbolRegistry.interfaces, 'interface'],
            [this.symbolRegistry.types, 'type'],
            [this.symbolRegistry.constants, 'const'],
            [this.symbolRegistry.exports, 'export']
        ];

        for (const [registry, type] of checks) {
            if (registry.has(symbolName)) {
                const file = registry.get(symbolName)!;

                if (expectedType && expectedType !== type) {
                    return {
                        valid: false,
                        exists: true,
                        type,
                        file,
                        suggestions: [`${symbolName} exists but is a ${type}, not a ${expectedType}`]
                    };
                }

                return {
                    valid: true,
                    exists: true,
                    type,
                    file
                };
            }
        }

        // Not found - suggest similar names
        const suggestions = this.findSimilar(symbolName);

        return {
            valid: false,
            exists: false,
            suggestions: suggestions.length > 0
                ? [`Did you mean: ${suggestions.join(', ')}?`]
                : [`Symbol '${symbolName}' does not exist in the codebase`]
        };
    }

    /**
     * Verify an import statement
     */
    verifyImport(importPath: string, importedSymbols: string[]): VerificationResult {
        const results: string[] = [];
        let allValid = true;

        for (const symbol of importedSymbols) {
            const result = this.verify(symbol);
            if (!result.valid) {
                allValid = false;
                results.push(`'${symbol}' not found`);
            }
        }

        return {
            valid: allValid,
            exists: allValid,
            suggestions: results.length > 0 ? results : undefined
        };
    }

    /**
     * Get context for a specific module/file
     */
    getModuleContext(modulePath: string): string | null {
        if (!this.lastResult) return null;

        const file = this.lastResult.files.find(f =>
            f.path.includes(modulePath) || f.relativePath.includes(modulePath)
        );

        if (!file) return null;

        return this.formatFileContext(file);
    }

    /**
     * Get context for symbols matching a query
     */
    getRelevantContext(query: string, maxTokens: number = 10000): string {
        if (!this.lastResult) return '';

        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\W+/).filter(w => w.length > 2);

        // Score each file by relevance
        const scored = this.lastResult.files.map(file => {
            let score = 0;

            // Check file name
            if (file.name.toLowerCase().includes(queryLower)) score += 50;

            // Check exports
            for (const exp of file.exports) {
                if (exp.name.toLowerCase().includes(queryLower)) score += 30;
                for (const word of queryWords) {
                    if (exp.name.toLowerCase().includes(word)) score += 10;
                }
            }

            // Check classes/functions
            for (const cls of file.classes) {
                if (cls.toLowerCase().includes(queryLower)) score += 25;
            }
            for (const fn of file.functions) {
                if (fn.toLowerCase().includes(queryLower)) score += 20;
            }

            return { file, score };
        });

        // Sort by score and collect until token budget
        const sorted = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);

        const parts: string[] = [];
        let tokens = 0;

        for (const { file } of sorted) {
            const context = this.formatFileContext(file);
            const fileTokens = Math.ceil(context.length / 4);

            if (tokens + fileTokens > maxTokens) break;

            parts.push(context);
            tokens += fileTokens;
        }

        return parts.join('\n\n');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE METHODS
    // ─────────────────────────────────────────────────────────────────────────

    private async scanDirectory(
        dir: string,
        files: AssimilatedFile[],
        warnings: string[],
        depth: number = 0
    ): Promise<void> {
        if (!existsSync(dir)) {
            warnings.push(`Directory not found: ${dir}`);
            return;
        }

        const entries = await readdir(dir);

        for (const entry of entries) {
            const fullPath = join(dir, entry);

            // Check ignore patterns
            if (this.shouldIgnore(fullPath, entry)) continue;

            const stats = await stat(fullPath);

            if (stats.isDirectory() && this.config.recursive) {
                await this.scanDirectory(fullPath, files, warnings, depth + 1);
            } else if (stats.isFile()) {
                const ext = extname(entry);

                if (!this.config.allowedExtensions.includes(ext)) continue;
                if (stats.size > this.config.maxFileSize) {
                    warnings.push(`File too large, skipped: ${entry} (${stats.size} bytes)`);
                    continue;
                }

                try {
                    const file = await this.processFile(fullPath);
                    files.push(file);
                    this.registerSymbols(file);
                } catch (error) {
                    warnings.push(`Error processing ${entry}: ${error}`);
                }
            }
        }
    }

    private shouldIgnore(path: string, name: string): boolean {
        if (name.startsWith('.')) return true;
        if (this.config.ignoreFiles.includes(name)) return true;

        for (const pattern of this.config.ignorePatterns) {
            if (pattern.test(path)) return true;
        }

        return false;
    }

    private async processFile(filePath: string): Promise<AssimilatedFile> {
        const content = await readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        return {
            path: filePath,
            relativePath: relative(this.config.targetFolder, filePath),
            name: basename(filePath),
            extension: extname(filePath),
            content,
            size: Buffer.byteLength(content, 'utf-8'),
            lines: lines.length,
            hash: crypto.createHash('md5').update(content).digest('hex').slice(0, 8),
            exports: this.extractExports(content),
            imports: this.extractImports(content),
            classes: this.extractClasses(content),
            functions: this.extractFunctions(content),
            interfaces: this.extractInterfaces(content),
            types: this.extractTypes(content)
        };
    }

    private extractExports(content: string): ExportInfo[] {
        const exports: ExportInfo[] = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            // export class ClassName
            let match = line.match(/export\s+class\s+(\w+)/);
            if (match) {
                exports.push({ name: match[1], type: 'class', line: index + 1 });
            }

            // export function funcName
            match = line.match(/export\s+(?:async\s+)?function\s+(\w+)/);
            if (match) {
                exports.push({ name: match[1], type: 'function', line: index + 1 });
            }

            // export const constName
            match = line.match(/export\s+const\s+(\w+)/);
            if (match) {
                exports.push({ name: match[1], type: 'const', line: index + 1 });
            }

            // export interface InterfaceName
            match = line.match(/export\s+interface\s+(\w+)/);
            if (match) {
                exports.push({ name: match[1], type: 'interface', line: index + 1 });
            }

            // export type TypeName
            match = line.match(/export\s+type\s+(\w+)/);
            if (match) {
                exports.push({ name: match[1], type: 'type', line: index + 1 });
            }

            // export enum EnumName
            match = line.match(/export\s+enum\s+(\w+)/);
            if (match) {
                exports.push({ name: match[1], type: 'enum', line: index + 1 });
            }

            // export default
            match = line.match(/export\s+default\s+(\w+)/);
            if (match) {
                exports.push({ name: match[1], type: 'default', line: index + 1 });
            }
        });

        return exports;
    }

    private extractImports(content: string): ImportInfo[] {
        const imports: ImportInfo[] = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            // import { a, b } from 'module'
            const match = line.match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
            if (match) {
                const importedNames = match[1].split(',').map(s => s.trim().split(' as ')[0]);
                imports.push({
                    module: match[2],
                    imports: importedNames,
                    line: index + 1,
                    isRelative: match[2].startsWith('.')
                });
            }

            // import DefaultExport from 'module'
            const defaultMatch = line.match(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);
            if (defaultMatch && !line.includes('{')) {
                imports.push({
                    module: defaultMatch[2],
                    imports: [defaultMatch[1]],
                    line: index + 1,
                    isRelative: defaultMatch[2].startsWith('.')
                });
            }
        });

        return imports;
    }

    private extractClasses(content: string): string[] {
        const classes: string[] = [];
        const matches = content.matchAll(/class\s+(\w+)/g);
        for (const match of matches) {
            if (!classes.includes(match[1])) {
                classes.push(match[1]);
            }
        }
        return classes;
    }

    private extractFunctions(content: string): string[] {
        const functions: string[] = [];
        const matches = content.matchAll(/(?:function|async\s+function)\s+(\w+)/g);
        for (const match of matches) {
            if (!functions.includes(match[1])) {
                functions.push(match[1]);
            }
        }
        // Also arrow functions assigned to const
        const arrowMatches = content.matchAll(/const\s+(\w+)\s*=\s*(?:async\s*)?\(/g);
        for (const match of arrowMatches) {
            if (!functions.includes(match[1])) {
                functions.push(match[1]);
            }
        }
        return functions;
    }

    private extractInterfaces(content: string): string[] {
        const interfaces: string[] = [];
        const matches = content.matchAll(/interface\s+(\w+)/g);
        for (const match of matches) {
            if (!interfaces.includes(match[1])) {
                interfaces.push(match[1]);
            }
        }
        return interfaces;
    }

    private extractTypes(content: string): string[] {
        const types: string[] = [];
        const matches = content.matchAll(/type\s+(\w+)\s*=/g);
        for (const match of matches) {
            if (!types.includes(match[1])) {
                types.push(match[1]);
            }
        }
        return types;
    }

    private registerSymbols(file: AssimilatedFile): void {
        for (const cls of file.classes) {
            this.symbolRegistry.classes.set(cls, file.relativePath);
        }
        for (const fn of file.functions) {
            this.symbolRegistry.functions.set(fn, file.relativePath);
        }
        for (const iface of file.interfaces) {
            this.symbolRegistry.interfaces.set(iface, file.relativePath);
        }
        for (const type of file.types) {
            this.symbolRegistry.types.set(type, file.relativePath);
        }
        for (const exp of file.exports) {
            this.symbolRegistry.exports.set(exp.name, file.relativePath);
            if (exp.type === 'const') {
                this.symbolRegistry.constants.set(exp.name, file.relativePath);
            }
        }
    }

    private buildContextString(files: AssimilatedFile[]): string {
        const parts: string[] = [];

        parts.push('═══════════════════════════════════════════════════════════════');
        parts.push('              ASSIMILATED CODEBASE CONTEXT');
        parts.push('              Anti-Hallucination Verified ✓');
        parts.push('═══════════════════════════════════════════════════════════════');
        parts.push('');

        // Add symbol registry summary
        parts.push('📋 VERIFIED SYMBOLS:');
        parts.push(`   Classes: ${Array.from(this.symbolRegistry.classes.keys()).join(', ')}`);
        parts.push(`   Functions: ${Array.from(this.symbolRegistry.functions.keys()).slice(0, 20).join(', ')}${this.symbolRegistry.functions.size > 20 ? '...' : ''}`);
        parts.push(`   Interfaces: ${Array.from(this.symbolRegistry.interfaces.keys()).join(', ')}`);
        parts.push(`   Types: ${Array.from(this.symbolRegistry.types.keys()).join(', ')}`);
        parts.push('');

        // Add file contents
        for (const file of files) {
            parts.push(this.formatFileContext(file));
        }

        return parts.join('\n');
    }

    private formatFileContext(file: AssimilatedFile): string {
        const lines: string[] = [];

        lines.push(`--- START FILE: ${file.relativePath} [${file.hash}] ---`);

        if (this.config.includeMetadata) {
            lines.push(`// Lines: ${file.lines} | Size: ${file.size}b`);
            if (file.exports.length > 0) {
                lines.push(`// Exports: ${file.exports.map(e => e.name).join(', ')}`);
            }
        }

        lines.push(file.content);
        lines.push(`--- END FILE: ${file.relativePath} ---`);

        return lines.join('\n');
    }

    private findSimilar(name: string): string[] {
        const similar: string[] = [];
        const nameLower = name.toLowerCase();

        const allSymbols = [
            ...this.symbolRegistry.classes.keys(),
            ...this.symbolRegistry.functions.keys(),
            ...this.symbolRegistry.interfaces.keys(),
            ...this.symbolRegistry.types.keys()
        ];

        for (const symbol of allSymbols) {
            const symbolLower = symbol.toLowerCase();

            // Check if starts similarly
            if (symbolLower.startsWith(nameLower.slice(0, 3))) {
                similar.push(symbol);
            }
            // Check Levenshtein-like similarity
            else if (this.similarity(nameLower, symbolLower) > 0.6) {
                similar.push(symbol);
            }
        }

        return similar.slice(0, 5);
    }

    private similarity(s1: string, s2: string): number {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;

        if (longer.length === 0) return 1.0;

        const editDistance = this.levenshtein(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    private levenshtein(s1: string, s2: string): number {
        const m = s1.length, n = s2.length;
        const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (s1[i - 1] === s2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
                }
            }
        }

        return dp[m][n];
    }

    private createEmptyRegistry(): SymbolRegistry {
        return {
            classes: new Map(),
            functions: new Map(),
            interfaces: new Map(),
            types: new Map(),
            constants: new Map(),
            exports: new Map()
        };
    }

    private getRegistryStats(): string {
        const total =
            this.symbolRegistry.classes.size +
            this.symbolRegistry.functions.size +
            this.symbolRegistry.interfaces.size +
            this.symbolRegistry.types.size;
        return `${total}`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get the last assimilation result
     */
    getLastResult(): AssimilationResult | null {
        return this.lastResult;
    }

    /**
     * Get the symbol registry
     */
    getRegistry(): SymbolRegistry {
        return this.symbolRegistry;
    }

    /**
     * Check if a class exists
     */
    hasClass(name: string): boolean {
        return this.symbolRegistry.classes.has(name);
    }

    /**
     * Check if a function exists
     */
    hasFunction(name: string): boolean {
        return this.symbolRegistry.functions.has(name);
    }

    /**
     * Check if an interface exists
     */
    hasInterface(name: string): boolean {
        return this.symbolRegistry.interfaces.has(name);
    }

    /**
     * Get all exported symbols
     */
    getAllExports(): string[] {
        return Array.from(this.symbolRegistry.exports.keys());
    }

    /**
     * Save context to file (for debugging)
     */
    async saveContext(outputPath: string): Promise<void> {
        if (!this.lastResult) {
            throw new Error('No assimilation result available. Run assimilate() first.');
        }
        await writeFile(outputPath, this.lastResult.contextString, 'utf-8');
        console.log(`📝 Context saved to ${outputPath}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getAssimilator = (config?: Partial<AssimilationConfig>) =>
    Assimilator.getInstance(config);

export default Assimilator;

// ═══════════════════════════════════════════════════════════════════════════════
// CLI EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    (async () => {
        console.log('\n🔬 ASSIMILATOR - Anti-Hallucination Engine');
        console.log('═'.repeat(50));

        const assimilator = getAssimilator({
            targetFolder: './src',
            recursive: true
        });

        const result = await assimilator.assimilate();

        // Test verification
        console.log('\n🔍 Verification Tests:');
        console.log('   NeuralInference:', assimilator.verify('NeuralInference'));
        console.log('   BrainRouter:', assimilator.verify('BrainRouter'));
        console.log('   FakeClass:', assimilator.verify('FakeClass'));

        // Save context for inspection
        await assimilator.saveContext('./data/assimilated-context.txt');

        console.log('\n✅ Assimilation complete!');
    })();
}