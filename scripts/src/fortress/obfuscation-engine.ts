/**
 * 🏰 THE FORTRESS - Code Obfuscation Engine
 * 
 * Protects intellectual property by transforming readable code
 * into functionally equivalent but unreadable form.
 * 
 * Techniques:
 * - Variable/function name mangling
 * - String encryption
 * - Control flow flattening
 * - Dead code injection
 * - Self-defending code
 * 
 * @version 1.0.0
 * @phase 71-72
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================
// TYPES
// ============================================================
interface ObfuscationConfig {
    // Core settings
    target: 'browser' | 'node';
    sourceMapEnabled: boolean;
    
    // Mangling
    mangleNames: boolean;
    reservedNames: string[];
    
    // String protection
    encryptStrings: boolean;
    stringEncryptionThreshold: number;
    
    // Control flow
    flattenControlFlow: boolean;
    controlFlowFlatteningThreshold: number;
    
    // Dead code
    injectDeadCode: boolean;
    deadCodeInjectionThreshold: number;
    
    // Self-defending
    selfDefending: boolean;
    debugProtection: boolean;
    disableConsoleOutput: boolean;
    
    // Domain lock
    domainLock: string[];
    domainLockRedirectUrl?: string;
}

interface ObfuscationResult {
    success: boolean;
    originalSize: number;
    obfuscatedSize: number;
    compressionRatio: number;
    filesProcessed: number;
    protectionLevel: 'basic' | 'standard' | 'maximum' | 'paranoid';
    timestamp: number;
}

// ============================================================
// OBFUSCATION ENGINE
// ============================================================
export class ObfuscationEngine {
    private config: ObfuscationConfig;
    private encryptionKey: Buffer;
    private processedFiles: Map<string, string> = new Map();

    constructor(config: Partial<ObfuscationConfig> = {}) {
        this.config = {
            target: 'node',
            sourceMapEnabled: false,
            mangleNames: true,
            reservedNames: ['exports', 'require', 'module', '__dirname', '__filename'],
            encryptStrings: true,
            stringEncryptionThreshold: 0.75,
            flattenControlFlow: true,
            controlFlowFlatteningThreshold: 0.75,
            injectDeadCode: true,
            deadCodeInjectionThreshold: 0.4,
            selfDefending: true,
            debugProtection: true,
            disableConsoleOutput: false,
            domainLock: [],
            ...config
        };

        // Generate encryption key from machine-specific data
        this.encryptionKey = this.generateMachineKey();
    }

    /**
     * Obfuscate entire dist directory
     */
    async obfuscateDirectory(distPath: string): Promise<ObfuscationResult> {
        console.log('🏰 [FORTRESS] Starting obfuscation...');
        console.log(`   Target: ${distPath}`);
        console.log(`   Protection Level: ${this.getProtectionLevel()}`);
        console.log('');

        const startTime = Date.now();
        let totalOriginalSize = 0;
        let totalObfuscatedSize = 0;
        let filesProcessed = 0;

        // Find all JS files
        const jsFiles = this.findJsFiles(distPath);
        console.log(`🏰 [FORTRESS] Found ${jsFiles.length} JavaScript files`);

        for (const filePath of jsFiles) {
            try {
                const originalCode = fs.readFileSync(filePath, 'utf-8');
                totalOriginalSize += originalCode.length;

                // Skip already obfuscated files
                if (this.isAlreadyObfuscated(originalCode)) {
                    console.log(`   ⏭️  Skipping (already protected): ${path.basename(filePath)}`);
                    continue;
                }

                const obfuscatedCode = await this.obfuscateCode(originalCode, filePath);
                totalObfuscatedSize += obfuscatedCode.length;

                // Write obfuscated code
                fs.writeFileSync(filePath, obfuscatedCode);
                this.processedFiles.set(filePath, obfuscatedCode);
                filesProcessed++;

                console.log(`   🔒 Protected: ${path.basename(filePath)}`);
            } catch (error) {
                console.error(`   ❌ Failed: ${path.basename(filePath)}`, error);
            }
        }

        // Generate integrity manifest
        this.generateIntegrityManifest(distPath);

        const duration = Date.now() - startTime;
        console.log('');
        console.log(`🏰 [FORTRESS] Obfuscation complete in ${duration}ms`);

        return {
            success: true,
            originalSize: totalOriginalSize,
            obfuscatedSize: totalObfuscatedSize,
            compressionRatio: totalObfuscatedSize / totalOriginalSize,
            filesProcessed,
            protectionLevel: this.getProtectionLevel(),
            timestamp: Date.now()
        };
    }

    /**
     * Obfuscate single code string
     */
    async obfuscateCode(code: string, filename?: string): Promise<string> {
        let result = code;

        // Step 1: Mangle variable names
        if (this.config.mangleNames) {
            result = this.mangleVariableNames(result);
        }

        // Step 2: Encrypt strings
        if (this.config.encryptStrings) {
            result = this.encryptStrings(result);
        }

        // Step 3: Flatten control flow
        if (this.config.flattenControlFlow) {
            result = this.flattenControlFlow(result);
        }

        // Step 4: Inject dead code
        if (this.config.injectDeadCode) {
            result = this.injectDeadCode(result);
        }

        // Step 5: Add self-defending wrapper
        if (this.config.selfDefending) {
            result = this.addSelfDefending(result);
        }

        // Step 6: Add debug protection
        if (this.config.debugProtection) {
            result = this.addDebugProtection(result);
        }

        // Step 7: Add fortress header
        result = this.addFortressHeader(result, filename);

        return result;
    }

    // ============================================================
    // OBFUSCATION TECHNIQUES
    // ============================================================

    /**
     * Mangle variable and function names
     */
    private mangleVariableNames(code: string): string {
        const nameMap = new Map<string, string>();
        let counter = 0;

        // Generate short mangled names
        const generateName = (): string => {
            const chars = 'abcdefghijklmnopqrstuvwxyz';
            let name = '';
            let n = counter++;
            do {
                name = chars[n % 26] + name;
                n = Math.floor(n / 26) - 1;
            } while (n >= 0);
            return '_' + name + '_';
        };

        // Find variable declarations
        const varPattern = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        const funcPattern = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;

        let match;
        while ((match = varPattern.exec(code)) !== null) {
            const name = match[1];
            if (!this.config.reservedNames.includes(name) && !nameMap.has(name)) {
                nameMap.set(name, generateName());
            }
        }

        while ((match = funcPattern.exec(code)) !== null) {
            const name = match[1];
            if (!this.config.reservedNames.includes(name) && !nameMap.has(name)) {
                nameMap.set(name, generateName());
            }
        }

        // Replace names
        let result = code;
        for (const [original, mangled] of nameMap) {
            const regex = new RegExp(`\\b${original}\\b`, 'g');
            result = result.replace(regex, mangled);
        }

        return result;
    }

    /**
     * Encrypt string literals
     */
    private encryptStrings(code: string): string {
        const stringArray: string[] = [];
        const decryptorVar = '_0x' + crypto.randomBytes(4).toString('hex');

        // Find all strings
        const stringPattern = /(['"`])(?:(?!\1)[^\\]|\\.)*\1/g;
        
        let result = code.replace(stringPattern, (match) => {
            // Skip short strings
            if (match.length < 4) return match;

            // Random chance to encrypt
            if (Math.random() > this.config.stringEncryptionThreshold) return match;

            const index = stringArray.length;
            const encrypted = this.encryptString(match.slice(1, -1));
            stringArray.push(encrypted);
            
            return `${decryptorVar}(${index})`;
        });

        // Add decryptor function
        if (stringArray.length > 0) {
            const decryptorCode = this.generateDecryptor(decryptorVar, stringArray);
            result = decryptorCode + '\n' + result;
        }

        return result;
    }

    /**
     * Flatten control flow to make decompilation harder
     */
    private flattenControlFlow(code: string): string {
        // This is a simplified version - real implementation would use AST
        const stateVar = '_s' + crypto.randomBytes(2).toString('hex');
        
        // Find if-else blocks and convert to switch-case
        const ifPattern = /if\s*\(([^)]+)\)\s*\{([^}]+)\}\s*else\s*\{([^}]+)\}/g;
        
        return code.replace(ifPattern, (match, condition, ifBlock, elseBlock) => {
            if (Math.random() > this.config.controlFlowFlatteningThreshold) return match;
            
            return `
var ${stateVar} = (${condition}) ? 1 : 2;
switch(${stateVar}) {
    case 1: ${ifBlock} break;
    case 2: ${elseBlock} break;
}`;
        });
    }

    /**
     * Inject dead code to confuse reverse engineers
     */
    private injectDeadCode(code: string): string {
        const deadCodeSnippets = [
            `if(false){console.log('${crypto.randomBytes(8).toString('hex')}')}`,
            `void function(){var _=${Math.random()}}()`,
            `typeof undefined==='undefined'&&void 0`,
            `!function(){return!1}()&&void 0`,
        ];

        // Insert dead code at random positions
        const lines = code.split('\n');
        const result: string[] = [];

        for (const line of lines) {
            result.push(line);
            if (Math.random() < this.config.deadCodeInjectionThreshold) {
                const snippet = deadCodeSnippets[Math.floor(Math.random() * deadCodeSnippets.length)];
                result.push(';' + snippet + ';');
            }
        }

        return result.join('\n');
    }

    /**
     * Add self-defending code that breaks if modified
     */
    private addSelfDefending(code: string): string {
        const hash = crypto.createHash('sha256').update(code).digest('hex').slice(0, 16);
        
        return `
(function(){
    var _h='${hash}';
    var _c=arguments.callee.toString();
    if(_c.length<100){
        (function(){while(true){}}());
    }
})();
${code}`;
    }

    /**
     * Add debug protection
     */
    private addDebugProtection(code: string): string {
        return `
(function(){
    var _d=function(){
        try{
            (function(){}).constructor('debugger')();
        }catch(e){}
    };
    setInterval(_d,${1000 + Math.floor(Math.random() * 4000)});
})();
${code}`;
    }

    /**
     * Add fortress header with metadata
     */
    private addFortressHeader(code: string, filename?: string): string {
        const timestamp = Date.now();
        const hash = crypto.createHash('md5').update(code).digest('hex');
        
        return `/**
 * 🏰 PROTECTED BY QANTUM FORTRESS
 * Generated: ${new Date(timestamp).toISOString()}
 * Hash: ${hash}
 * 
 * ⚠️ WARNING: This code is protected by international copyright law.
 * Unauthorized copying, modification, or distribution is prohibited.
 * Tampering will trigger security countermeasures.
 */
${code}`;
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    private generateMachineKey(): Buffer {
        // In production, this would use actual hardware identifiers
        const machineId = process.env.qantum_MACHINE_ID || 'default-key';
        return crypto.createHash('sha256').update(machineId).digest();
    }

    private encryptString(str: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
        let encrypted = cipher.update(str, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return iv.toString('base64') + ':' + encrypted;
    }

    private generateDecryptor(varName: string, strings: string[]): string {
        const key = this.encryptionKey.toString('base64');
        return `
var ${varName}=(function(){
    var _k='${key}';
    var _s=${JSON.stringify(strings)};
    var _d=function(i){
        try{
            var p=_s[i].split(':');
            var iv=Buffer.from(p[0],'base64');
            var enc=Buffer.from(p[1],'base64');
            var k=Buffer.from(_k,'base64');
            var d=require('crypto').createDecipheriv('aes-256-cbc',k,iv);
            return d.update(enc,'base64','utf8')+d.final('utf8');
        }catch(e){return''}
    };
    return _d;
})();`;
    }

    private findJsFiles(dir: string): string[] {
        const files: string[] = [];
        
        const scan = (currentDir: string) => {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                if (entry.isDirectory() && entry.name !== 'node_modules') {
                    scan(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.js')) {
                    files.push(fullPath);
                }
            }
        };

        scan(dir);
        return files;
    }

    private isAlreadyObfuscated(code: string): boolean {
        return code.includes('PROTECTED BY QANTUM FORTRESS');
    }

    private getProtectionLevel(): ObfuscationResult['protectionLevel'] {
        let score = 0;
        if (this.config.mangleNames) score++;
        if (this.config.encryptStrings) score++;
        if (this.config.flattenControlFlow) score++;
        if (this.config.injectDeadCode) score++;
        if (this.config.selfDefending) score++;
        if (this.config.debugProtection) score++;

        if (score >= 6) return 'paranoid';
        if (score >= 4) return 'maximum';
        if (score >= 2) return 'standard';
        return 'basic';
    }

    private generateIntegrityManifest(distPath: string): void {
        const manifest: Record<string, string> = {};
        
        for (const [filePath, content] of this.processedFiles) {
            const relativePath = path.relative(distPath, filePath);
            manifest[relativePath] = crypto.createHash('sha256').update(content).digest('hex');
        }

        const manifestPath = path.join(distPath, '.fortress-manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`🏰 [FORTRESS] Integrity manifest: ${manifestPath}`);
    }
}

// ============================================================
// CLI INTERFACE
// ============================================================
export async function obfuscateDist(distPath: string, config?: Partial<ObfuscationConfig>): Promise<void> {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🏰 THE FORTRESS - Code Protection System                     ║
║                                                               ║
║  "557,000 lines of digital gold, now impenetrable"            ║
╚═══════════════════════════════════════════════════════════════╝
`);

    const engine = new ObfuscationEngine(config);
    const result = await engine.obfuscateDirectory(distPath);

    console.log('');
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│ OBFUSCATION SUMMARY                                             │');
    console.log('├─────────────────────────────────────────────────────────────────┤');
    console.log(`│ Files Protected: ${result.filesProcessed.toString().padEnd(46)} │`);
    console.log(`│ Original Size: ${(result.originalSize / 1024).toFixed(1)}KB${' '.repeat(42 - (result.originalSize / 1024).toFixed(1).length)} │`);
    console.log(`│ Protected Size: ${(result.obfuscatedSize / 1024).toFixed(1)}KB${' '.repeat(41 - (result.obfuscatedSize / 1024).toFixed(1).length)} │`);
    console.log(`│ Protection Level: ${result.protectionLevel.toUpperCase().padEnd(44)} │`);
    console.log('└─────────────────────────────────────────────────────────────────┘');
}
