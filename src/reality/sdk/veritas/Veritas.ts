/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                               ║
 * ║  ██╗   ██╗███████╗██████╗ ██╗████████╗ █████╗ ███████╗    ███████╗██████╗ ██╗  ██╗           ║
 * ║  ██║   ██║██╔════╝██╔══██╗██║╚══██╔══╝██╔══██╗██╔════╝    ██╔════╝██╔══██╗██║ ██╔╝           ║
 * ║  ██║   ██║█████╗  ██████╔╝██║   ██║   ███████║███████╗    ███████╗██║  ██║█████╔╝            ║
 * ║  ╚██╗ ██╔╝██╔══╝  ██╔══██╗██║   ██║   ██╔══██║╚════██║    ╚════██║██║  ██║██╔═██╗            ║
 * ║   ╚████╔╝ ███████╗██║  ██║██║   ██║   ██║  ██║███████║    ███████║██████╔╝██║  ██╗           ║
 * ║    ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚══════╝╚═════╝ ╚═╝  ╚═╝           ║
 * ║                                                                                               ║
 * ║                         ANTI-HALLUCINATION SDK                                                ║
 * ║              "Stop AI Hallucinations. Ground Your AI in Reality."                             ║
 * ║                                                                                               ║
 * ║   © 2025-2026 Mister Mind | Dimitar Prodromov | Licensed under VERITAS-SDK-PRO               ║
 * ║                                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { IVeritasSDK, VeritasConfig, AssimilationResult, VerificationResult, SymbolRegistry, LicenseInfo } from './IVeritasSDK';
import { readdir, readFile, stat, writeFile, mkdir } from 'fs/promises';
import { join, extname, relative, basename, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// VERITAS CORE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Veritas SDK - Enterprise Anti-Hallucination Engine
 * 
 * Ground your AI in reality. Verify every symbol, every import, every reference.
 * 
 * @example
 * ```typescript
 * import { Veritas } from '@mistermind/veritas-sdk';
 * 
 * const veritas = await Veritas.create({
 *   projectPath: './src',
 *   licenseKey: 'VERITAS-SDK-PRO-XXXX'
 * });
 * 
 * // Scan your codebase
 * const result = await veritas.assimilate();
 * 
 * // Verify AI-generated code
 * const validation = veritas.validateCode(aiGeneratedCode);
 * if (!validation.valid) {
 *   console.log('HALLUCINATION DETECTED:', validation.errors);
 * }
 * ```
 */
export class Veritas implements IVeritasSDK {
    private static instance: Veritas | null = null;
    
    private config: VeritasConfig;
    private registry: SymbolRegistry;
    private lastResult: AssimilationResult | null = null;
    private license: LicenseInfo;
    private initialized: boolean = false;

    // ─────────────────────────────────────────────────────────────────────────
    // CONSTRUCTOR & FACTORY
    // ─────────────────────────────────────────────────────────────────────────

    private constructor(config: Partial<VeritasConfig>) {
        this.config = this.mergeConfig(config);
        this.registry = this.createEmptyRegistry();
        this.license = {
            type: 'TRIAL',
            valid: true,
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
            features: ['assimilate', 'verify'],
            maxFiles: 100,
            maxSymbols: 1000
        };
    }

    /**
     * Create a new Veritas instance
     */
    static async create(config: Partial<VeritasConfig> = {}): Promise<Veritas> {
        const instance = new Veritas(config);
        await instance.initialize();
        return instance;
    }

    /**
     * Get singleton instance (for integrations)
     */
    static getInstance(): Veritas | null {
        return Veritas.instance;
    }

    private async initialize(): Promise<void> {
        // Validate license
        if (this.config.licenseKey) {
            this.license = await this.validateLicense(this.config.licenseKey);
        }

        // Check features
        if (!this.license.valid) {
            throw new Error('Invalid Veritas SDK license. Get one at https://mistermind.dev/veritas');
        }

        this.initialized = true;
        Veritas.instance = this;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Assimilate a codebase into the truth registry
     */
    async assimilate(path?: string): Promise<AssimilationResult> {
        this.checkLicense('assimilate');
        
        const targetPath = path || this.config.projectPath;
        const startTime = Date.now();
        const warnings: string[] = [];

        console.log(`\n🔬 VERITAS: Assimilating ${targetPath}...`);

        // Reset registry
        this.registry = this.createEmptyRegistry();

        // Scan files
        const files = await this.scanDirectory(targetPath, warnings);

        // Build result
        const totalLines = files.reduce((sum, f) => sum.lines + f.lines, { lines: 0 }).lines || 
                          files.reduce((sum, f) => sum + f.lines, 0);
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);

        const result: AssimilationResult = {
            success: true,
            timestamp: new Date().toISOString(),
            projectPath: targetPath,
            totalFiles: files.length,
            totalLines,
            totalSize,
            totalSymbols: this.countSymbols(),
            registry: this.getRegistrySummary(),
            warnings,
            scanDuration: Date.now() - startTime
        };

        this.lastResult = result;

        console.log(`   ✓ ${files.length} files scanned`);
        console.log(`   ✓ ${totalLines.toLocaleString()} lines of code`);
        console.log(`   ✓ ${result.totalSymbols} symbols registered`);
        console.log(`   ⏱️ ${result.scanDuration}ms`);

        return result;
    }

    /**
     * Verify if a symbol exists in the codebase
     */
    verify(symbolName: string, expectedType?: string): VerificationResult {
        this.checkLicense('verify');

        // Search in all registries
        const registries: [Map<string, string>, string][] = [
            [this.registry.classes, 'class'],
            [this.registry.functions, 'function'],
            [this.registry.interfaces, 'interface'],
            [this.registry.types, 'type'],
            [this.registry.constants, 'const'],
            [this.registry.exports, 'export']
        ];

        for (const [registry, type] of registries) {
            if (registry.has(symbolName)) {
                const file = registry.get(symbolName)!;

                if (expectedType && expectedType !== type) {
                    return {
                        valid: false,
                        exists: true,
                        symbolName,
                        actualType: type,
                        expectedType,
                        file,
                        message: `Symbol '${symbolName}' exists as ${type}, not ${expectedType}`
                    };
                }

                return {
                    valid: true,
                    exists: true,
                    symbolName,
                    actualType: type,
                    file,
                    message: `✓ Verified: ${symbolName} (${type}) in ${file}`
                };
            }
        }

        // Not found - suggest alternatives
        const suggestions = this.findSimilar(symbolName);

        return {
            valid: false,
            exists: false,
            symbolName,
            suggestions,
            message: suggestions.length > 0
                ? `Symbol '${symbolName}' not found. Did you mean: ${suggestions.join(', ')}?`
                : `Symbol '${symbolName}' does not exist in the codebase. HALLUCINATION DETECTED!`
        };
    }

    /**
     * Validate AI-generated code against the truth registry
     */
    validateCode(code: string): {
        valid: boolean;
        errors: string[];
        warnings: string[];
        hallucinations: string[];
    } {
        this.checkLicense('validate');

        const errors: string[] = [];
        const warnings: string[] = [];
        const hallucinations: string[] = [];

        // Extract all symbol references from code
        const references = this.extractReferences(code);

        for (const ref of references) {
            const result = this.verify(ref.name, ref.type);
            
            if (!result.valid) {
                if (!result.exists) {
                    hallucinations.push(`🚨 HALLUCINATION: '${ref.name}' does not exist`);
                    errors.push(`Line ~${ref.line}: '${ref.name}' is not a real symbol`);
                } else {
                    warnings.push(`⚠️ Type mismatch: '${ref.name}' is ${result.actualType}, not ${ref.type}`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            hallucinations
        };
    }

    /**
     * Get relevant context for AI prompts
     */
    getContext(query: string, maxTokens: number = 10000): string {
        this.checkLicense('context');

        if (!this.lastResult) {
            return '⚠️ No assimilation result. Call assimilate() first.';
        }

        const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
        const relevantSymbols: string[] = [];

        // Find matching symbols
        const allSymbols = [
            ...Array.from(this.registry.classes.entries()).map(([k, v]) => ({ name: k, file: v, type: 'class' })),
            ...Array.from(this.registry.functions.entries()).map(([k, v]) => ({ name: k, file: v, type: 'function' })),
            ...Array.from(this.registry.interfaces.entries()).map(([k, v]) => ({ name: k, file: v, type: 'interface' })),
            ...Array.from(this.registry.types.entries()).map(([k, v]) => ({ name: k, file: v, type: 'type' }))
        ];

        for (const symbol of allSymbols) {
            const nameLower = symbol.name.toLowerCase();
            for (const word of queryWords) {
                if (nameLower.includes(word)) {
                    relevantSymbols.push(`${symbol.type} ${symbol.name} // from ${symbol.file}`);
                    break;
                }
            }
        }

        // Build context
        const context = [
            '═══════════════════════════════════════════════════════════════',
            '              VERITAS SDK - GROUNDED CONTEXT',
            '              All symbols verified against real code',
            '═══════════════════════════════════════════════════════════════',
            '',
            `Query: "${query}"`,
            '',
            '📋 RELEVANT SYMBOLS (VERIFIED):',
            ...relevantSymbols.slice(0, 50),
            '',
            '⚠️ RULES:',
            '• Only use symbols listed above',
            '• Any other symbol = HALLUCINATION',
            '• When in doubt, call veritas.verify(symbolName)',
            '═══════════════════════════════════════════════════════════════'
        ];

        return context.join('\n');
    }

    /**
     * Generate TypeScript types from registry
     */
    generateTypes(): string {
        this.checkLicense('types');

        const lines: string[] = [
            '// Auto-generated by Veritas SDK',
            '// All types verified against real codebase',
            '',
            '// ═══════════════════════════════════════════════════════════════',
            '// VERIFIED CLASSES',
            '// ═══════════════════════════════════════════════════════════════',
            ''
        ];

        for (const [name, file] of this.registry.classes) {
            lines.push(`export declare class ${name}; // from ${file}`);
        }

        lines.push('', '// ═══════════════════════════════════════════════════════════════');
        lines.push('// VERIFIED INTERFACES', '// ═══════════════════════════════════════════════════════════════', '');

        for (const [name, file] of this.registry.interfaces) {
            lines.push(`export declare interface ${name}; // from ${file}`);
        }

        lines.push('', '// ═══════════════════════════════════════════════════════════════');
        lines.push('// VERIFIED FUNCTIONS', '// ═══════════════════════════════════════════════════════════════', '');

        for (const [name, file] of this.registry.functions) {
            lines.push(`export declare function ${name}(...args: any[]): any; // from ${file}`);
        }

        return lines.join('\n');
    }

    /**
     * Export registry to JSON
     */
    exportRegistry(): string {
        return JSON.stringify({
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            classes: Object.fromEntries(this.registry.classes),
            functions: Object.fromEntries(this.registry.functions),
            interfaces: Object.fromEntries(this.registry.interfaces),
            types: Object.fromEntries(this.registry.types),
            constants: Object.fromEntries(this.registry.constants),
            exports: Object.fromEntries(this.registry.exports)
        }, null, 2);
    }

    /**
     * Import registry from JSON
     */
    importRegistry(json: string): void {
        const data = JSON.parse(json);
        this.registry = {
            classes: new Map(Object.entries(data.classes || {})),
            functions: new Map(Object.entries(data.functions || {})),
            interfaces: new Map(Object.entries(data.interfaces || {})),
            types: new Map(Object.entries(data.types || {})),
            constants: new Map(Object.entries(data.constants || {})),
            exports: new Map(Object.entries(data.exports || {}))
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE METHODS
    // ─────────────────────────────────────────────────────────────────────────

    private mergeConfig(config: Partial<VeritasConfig>): VeritasConfig {
        return {
            projectPath: config.projectPath || './src',
            extensions: config.extensions || ['.ts', '.js', '.tsx', '.jsx'],
            ignore: config.ignore || [/node_modules/, /dist/, /\.git/, /\.test\./, /\.spec\./],
            maxFileSize: config.maxFileSize || 100 * 1024,
            licenseKey: config.licenseKey,
            outputPath: config.outputPath || './veritas-output'
        };
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

    private async validateLicense(key: string): Promise<LicenseInfo> {
        // Check license format: VERITAS-SDK-PRO-XXXX-XXXX-XXXX
        const proMatch = key.match(/^VERITAS-SDK-PRO-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/);
        const freeMatch = key.match(/^VERITAS-SDK-FREE-([A-Z0-9]{8})$/);

        if (proMatch) {
            return {
                type: 'VERITAS-SDK-PRO',
                valid: true,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                features: ['assimilate', 'verify', 'validate', 'context', 'types', 'export', 'neural-map'],
                maxFiles: Infinity,
                maxSymbols: Infinity
            };
        }

        if (freeMatch) {
            return {
                type: 'VERITAS-SDK-FREE',
                valid: true,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                features: ['assimilate', 'verify'],
                maxFiles: 50,
                maxSymbols: 500
            };
        }

        // Invalid key - return trial
        return {
            type: 'TRIAL',
            valid: true,
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            features: ['assimilate', 'verify'],
            maxFiles: 100,
            maxSymbols: 1000
        };
    }

    private checkLicense(feature: string): void {
        if (!this.license.valid) {
            throw new Error('Veritas SDK license expired. Renew at https://mistermind.dev/veritas');
        }

        if (!this.license.features.includes(feature)) {
            throw new Error(`Feature '${feature}' requires VERITAS-SDK-PRO license. Upgrade at https://mistermind.dev/veritas`);
        }
    }

    private async scanDirectory(dir: string, warnings: string[]): Promise<any[]> {
        const files: any[] = [];

        if (!existsSync(dir)) {
            warnings.push(`Directory not found: ${dir}`);
            return files;
        }

        const entries = await readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = join(dir, entry.name);

            // Check ignore patterns
            if (this.shouldIgnore(fullPath, entry.name)) continue;

            if (entry.isDirectory()) {
                const subFiles = await this.scanDirectory(fullPath, warnings);
                files.push(...subFiles);
            } else if (entry.isFile()) {
                const ext = extname(entry.name);
                if (!this.config.extensions.includes(ext)) continue;

                try {
                    const content = await readFile(fullPath, 'utf-8');
                    const stats = await stat(fullPath);

                    if (stats.size > this.config.maxFileSize) {
                        warnings.push(`File too large, skipped: ${entry.name}`);
                        continue;
                    }

                    const file = this.processFile(fullPath, content);
                    files.push(file);
                    this.registerSymbols(file);
                } catch (error) {
                    warnings.push(`Error processing ${entry.name}: ${error}`);
                }
            }
        }

        return files;
    }

    private shouldIgnore(path: string, name: string): boolean {
        if (name.startsWith('.')) return true;
        for (const pattern of this.config.ignore) {
            if (pattern.test(path)) return true;
        }
        return false;
    }

    private processFile(path: string, content: string): any {
        const lines = content.split('\n');
        return {
            path,
            relativePath: relative(this.config.projectPath, path),
            name: basename(path),
            size: Buffer.byteLength(content, 'utf-8'),
            lines: lines.length,
            classes: this.extractPattern(content, /class\s+(\w+)/g),
            functions: this.extractPattern(content, /(?:function|async\s+function)\s+(\w+)/g),
            interfaces: this.extractPattern(content, /interface\s+(\w+)/g),
            types: this.extractPattern(content, /type\s+(\w+)\s*=/g),
            exports: this.extractExports(content)
        };
    }

    private extractPattern(content: string, pattern: RegExp): string[] {
        const matches: string[] = [];
        let match;
        while ((match = pattern.exec(content)) !== null) {
            if (!matches.includes(match[1])) {
                matches.push(match[1]);
            }
        }
        return matches;
    }

    private extractExports(content: string): string[] {
        const exports: string[] = [];
        const patterns = [
            /export\s+class\s+(\w+)/g,
            /export\s+(?:async\s+)?function\s+(\w+)/g,
            /export\s+const\s+(\w+)/g,
            /export\s+interface\s+(\w+)/g,
            /export\s+type\s+(\w+)/g,
            /export\s+default\s+(\w+)/g
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (!exports.includes(match[1])) {
                    exports.push(match[1]);
                }
            }
        }

        return exports;
    }

    private registerSymbols(file: any): void {
        for (const cls of file.classes) {
            this.registry.classes.set(cls, file.relativePath);
        }
        for (const fn of file.functions) {
            this.registry.functions.set(fn, file.relativePath);
        }
        for (const iface of file.interfaces) {
            this.registry.interfaces.set(iface, file.relativePath);
        }
        for (const type of file.types) {
            this.registry.types.set(type, file.relativePath);
        }
        for (const exp of file.exports) {
            this.registry.exports.set(exp, file.relativePath);
        }
    }

    private countSymbols(): number {
        return this.registry.classes.size +
               this.registry.functions.size +
               this.registry.interfaces.size +
               this.registry.types.size +
               this.registry.constants.size;
    }

    private getRegistrySummary(): any {
        return {
            classes: this.registry.classes.size,
            functions: this.registry.functions.size,
            interfaces: this.registry.interfaces.size,
            types: this.registry.types.size,
            constants: this.registry.constants.size,
            exports: this.registry.exports.size
        };
    }

    private extractReferences(code: string): { name: string; type?: string; line: number }[] {
        const refs: { name: string; type?: string; line: number }[] = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            // Import references
            const importMatch = line.match(/import\s+\{([^}]+)\}\s+from/);
            if (importMatch) {
                const names = importMatch[1].split(',').map(s => s.trim().split(' as ')[0]);
                names.forEach(name => refs.push({ name, line: index + 1 }));
            }

            // Class instantiation
            const newMatch = line.matchAll(/new\s+(\w+)\(/g);
            for (const match of newMatch) {
                refs.push({ name: match[1], type: 'class', line: index + 1 });
            }

            // Function calls
            const callMatch = line.matchAll(/(\w+)\(/g);
            for (const match of callMatch) {
                if (!['if', 'for', 'while', 'switch', 'function', 'async', 'await', 'return', 'new'].includes(match[1])) {
                    refs.push({ name: match[1], type: 'function', line: index + 1 });
                }
            }
        });

        return refs;
    }

    private findSimilar(name: string): string[] {
        const similar: string[] = [];
        const nameLower = name.toLowerCase();

        const allSymbols = [
            ...this.registry.classes.keys(),
            ...this.registry.functions.keys(),
            ...this.registry.interfaces.keys(),
            ...this.registry.types.keys()
        ];

        for (const symbol of allSymbols) {
            const symbolLower = symbol.toLowerCase();
            if (symbolLower.includes(nameLower) || nameLower.includes(symbolLower)) {
                similar.push(symbol);
            } else if (this.levenshtein(nameLower, symbolLower) <= 3) {
                similar.push(symbol);
            }
        }

        return similar.slice(0, 5);
    }

    private levenshtein(a: string, b: string): number {
        const matrix: number[][] = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { IVeritasSDK, VeritasConfig, AssimilationResult, VerificationResult, SymbolRegistry, LicenseInfo } from './IVeritasSDK';
export default Veritas;
