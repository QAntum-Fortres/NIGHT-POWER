/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                               ║
 * ║                           VERITAS SDK - PUBLIC INTERFACE                                      ║
 * ║              "The contract between your code and the truth"                                   ║
 * ║                                                                                               ║
 * ║   © 2025-2026 Mister Mind | Dimitar Prodromov                                                ║
 * ║                                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Configuration for Veritas SDK
 */
export interface VeritasConfig {
    /**
     * Path to the project root or source directory
     * @default './src'
     */
    projectPath: string;

    /**
     * File extensions to scan
     * @default ['.ts', '.js', '.tsx', '.jsx']
     */
    extensions: string[];

    /**
     * Patterns to ignore during scanning
     * @default [/node_modules/, /dist/, /.git/]
     */
    ignore: RegExp[];

    /**
     * Maximum file size to process (in bytes)
     * @default 102400 (100KB)
     */
    maxFileSize: number;

    /**
     * Your Veritas SDK license key
     * Get one at https://mistermind.dev/veritas
     */
    licenseKey?: string;

    /**
     * Output path for generated files
     * @default './veritas-output'
     */
    outputPath: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Result of codebase assimilation
 */
export interface AssimilationResult {
    /** Whether the scan was successful */
    success: boolean;

    /** ISO timestamp of the scan */
    timestamp: string;

    /** Path that was scanned */
    projectPath: string;

    /** Total number of files scanned */
    totalFiles: number;

    /** Total lines of code */
    totalLines: number;

    /** Total size in bytes */
    totalSize: number;

    /** Total symbols registered */
    totalSymbols: number;

    /** Summary of the symbol registry */
    registry: {
        classes: number;
        functions: number;
        interfaces: number;
        types: number;
        constants: number;
        exports: number;
    };

    /** Any warnings encountered */
    warnings: string[];

    /** Time taken to scan (ms) */
    scanDuration: number;
}

/**
 * Result of symbol verification
 */
export interface VerificationResult {
    /** Whether the symbol is valid */
    valid: boolean;

    /** Whether the symbol exists in the codebase */
    exists: boolean;

    /** The symbol name that was verified */
    symbolName: string;

    /** The actual type of the symbol (if found) */
    actualType?: string;

    /** The expected type (if specified) */
    expectedType?: string;

    /** The file where the symbol is defined */
    file?: string;

    /** Suggested alternatives (for typos) */
    suggestions?: string[];

    /** Human-readable message */
    message: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The Symbol Registry - Source of Truth
 */
export interface SymbolRegistry {
    /** Map of class names to file paths */
    classes: Map<string, string>;

    /** Map of function names to file paths */
    functions: Map<string, string>;

    /** Map of interface names to file paths */
    interfaces: Map<string, string>;

    /** Map of type names to file paths */
    types: Map<string, string>;

    /** Map of constant names to file paths */
    constants: Map<string, string>;

    /** Map of exported names to file paths */
    exports: Map<string, string>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LICENSING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * License information
 */
export interface LicenseInfo {
    /** License type: TRIAL, VERITAS-SDK-FREE, VERITAS-SDK-PRO */
    type: 'TRIAL' | 'VERITAS-SDK-FREE' | 'VERITAS-SDK-PRO';

    /** Whether the license is valid */
    valid: boolean;

    /** Expiration date */
    expiresAt: Date;

    /** Features enabled by this license */
    features: string[];

    /** Maximum files allowed */
    maxFiles: number;

    /** Maximum symbols allowed */
    maxSymbols: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The Veritas SDK Interface
 * 
 * @example
 * ```typescript
 * import { Veritas } from '@mistermind/veritas-sdk';
 * 
 * // Create instance
 * const veritas = await Veritas.create({
 *   projectPath: './src',
 *   licenseKey: process.env.VERITAS_LICENSE_KEY
 * });
 * 
 * // Scan codebase
 * await veritas.assimilate();
 * 
 * // Verify a symbol
 * const result = veritas.verify('MyClass', 'class');
 * if (!result.valid) {
 *   console.error('HALLUCINATION:', result.message);
 * }
 * 
 * // Validate AI-generated code
 * const validation = veritas.validateCode(aiCode);
 * console.log('Hallucinations found:', validation.hallucinations);
 * ```
 */
export interface IVeritasSDK {
    /**
     * Assimilate a codebase into the truth registry
     * @param path - Optional path to scan (defaults to config.projectPath)
     */
    assimilate(path?: string): Promise<AssimilationResult>;

    /**
     * Verify if a symbol exists in the codebase
     * @param symbolName - The symbol to verify
     * @param expectedType - Optional expected type (class, function, etc.)
     */
    verify(symbolName: string, expectedType?: string): VerificationResult;

    /**
     * Validate AI-generated code against the truth registry
     * @param code - The code to validate
     */
    validateCode(code: string): {
        valid: boolean;
        errors: string[];
        warnings: string[];
        hallucinations: string[];
    };

    /**
     * Get relevant context for AI prompts
     * @param query - Search query for relevant symbols
     * @param maxTokens - Maximum tokens to return
     */
    getContext(query: string, maxTokens?: number): string;

    /**
     * Generate TypeScript type declarations from the registry
     */
    generateTypes(): string;

    /**
     * Export the registry as JSON
     */
    exportRegistry(): string;

    /**
     * Import a registry from JSON
     * @param json - The JSON string to import
     */
    importRegistry(json: string): void;
}
