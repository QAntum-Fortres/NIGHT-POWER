/**
 * ⛓️ STRICT COLLAR PROTOCOL
 * Този модул не дава на AI-то избор.
 * Той заварява контекста за всяка заявка.
 * 
 * "Кучето не те слуша, защото те обича.
 *  Кучето те слуша, защото има нашийник."
 * 
 * @department GUARDIANS 🛡️
 * @priority CRITICAL
 * @author QAntum Empire
 */

import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface CollarConfig {
    maxRetries: number;
    strictness: 'low' | 'medium' | 'high' | 'maximum';
    allowedLanguages: string[];
    projectName: string;
    projectVersion: string;
}

interface CollarResult {
    response: string;
    wasYanked: boolean;
    retries: number;
    violations: string[];
    timestamp: number;
}

interface ViolationLog {
    timestamp: number;
    query: string;
    violation: string;
    action: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRICT COLLAR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class StrictCollar {
    
    // ⛓️ "Шиповете" на нашийника - правилата, които болят, ако се нарушат
    private static readonly IRON_RULES = `
╔═══════════════════════════════════════════════════════════════════════════╗
║                    ⛓️ IRON RULES (NON-NEGOTIABLE)                         ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  1. NEVER invent code libraries that don't exist.                         ║
║  2. ALWAYS use the provided file structure - no imagination.              ║
║  3. IF context is missing, STOP and ask for it. Do not guess.             ║
║  4. You are QAntum (v34.1). You are NOT a generic AI.                     ║
║  5. TypeScript ONLY unless explicitly told otherwise.                     ║
║  6. Reference ONLY files from the [LOCKED CONTEXT].                       ║
║  7. If unsure, say "🚫 NEED MORE CONTEXT" - never hallucinate.            ║
╚═══════════════════════════════════════════════════════════════════════════╝
    `;

    private static readonly IDENTITY = `
╔═══════════════════════════════════════════════════════════════════════════╗
║                         🦁 LOCKED IDENTITY                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  NAME:        QAntum                                                      ║
║  VERSION:     34.1                                                        ║
║  LANGUAGE:    TypeScript (primary), JavaScript (secondary)                ║
║  OWNER:       Димитър Продромов                                           ║
║  PURPOSE:     QA Automation Empire - 10M+ lines of code                   ║
║  DEPARTMENTS: 8 (Intelligence, Omega, Physics, Fortress,                  ║
║               Biology, Guardians, Reality, Chemistry)                     ║
╚═══════════════════════════════════════════════════════════════════════════╝
    `;

    // Hallucination detection patterns
    private static readonly HALLUCINATION_PATTERNS = [
        /example\.com/i,
        /foo\/bar/i,
        /lorem\s+ipsum/i,
        /placeholder/i,
        /your[_-]?api[_-]?key/i,
        /TODO:\s*implement/i,
        /import\s+.*from\s+['"](?!\.)/,  // Non-relative imports that don't exist
        /hypothetically/i,
        /I\s+don'?t\s+have\s+access/i,
        /I\s+cannot\s+see/i,
        /as\s+an\s+AI/i,
        /I'?m\s+just\s+an?\s+AI/i
    ];

    // Known fake libraries (common hallucinations)
    private static readonly FAKE_LIBRARIES = [
        'qantum-utils',
        'mind-helper',
        'auto-magic',
        'easy-code',
        'super-lib'
    ];

    private static config: CollarConfig = {
        maxRetries: 3,
        strictness: 'high',
        allowedLanguages: ['typescript', 'javascript', 'json', 'markdown'],
        projectName: 'QAntum',
        projectVersion: '34.1'
    };

    private static violationLog: ViolationLog[] = [];
    private static readonly LOG_FILE = path.join(process.cwd(), 'data/memoryals/collar-violations.json');

    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN EXECUTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * ⛓️ FORCE EXECUTE - Изпълнява заявка с пълен контрол
     */
    public static async forceExecute(
        userQuery: string, 
        currentFileContext: string,
        additionalContext?: string
    ): Promise<CollarResult> {
        let retries = 0;
        let violations: string[] = [];
        let wasYanked = false;

        while (retries < this.config.maxRetries) {
            // 1. ЗАТЯГАНЕ НА НАШИЙНИКА (The Leash)
            const forcedPrompt = this.buildForcedPrompt(userQuery, currentFileContext, additionalContext);

            console.log(`⛓️ Strict Collar applied. Attempt ${retries + 1}/${this.config.maxRetries}`);

            // 2. ИЗПЪЛНЕНИЕ (The Walk)
            // Note: This would call your actual inference engine
            // For now, returning the prompt structure
            const response = await this.executeInference(forcedPrompt);

            // 3. ПРОВЕРКА НА ДИСЦИПЛИНАТА (The Yank)
            const detectedViolations = this.detectViolations(response, currentFileContext);
            
            if (detectedViolations.length > 0) {
                console.warn(`⚠️ Dog tried to run! Violations: ${detectedViolations.join(', ')}`);
                console.warn("⛓️ YANKING LEASH...");
                
                violations.push(...detectedViolations);
                wasYanked = true;
                retries++;
                
                // Log the violation
                this.logViolation(userQuery, detectedViolations.join(', '), 'YANK');
                
                continue;
            }

            // Success!
            return {
                response,
                wasYanked,
                retries,
                violations,
                timestamp: Date.now()
            };
        }

        // Max retries exceeded
        console.error("🚫 COLLAR LOCKDOWN: AI failed to comply after max retries");
        this.logViolation(userQuery, 'MAX_RETRIES_EXCEEDED', 'LOCKDOWN');
        
        return {
            response: "🚫 LEASH LOCKDOWN: Unable to provide compliant response. Context may be insufficient.",
            wasYanked: true,
            retries,
            violations,
            timestamp: Date.now()
        };
    }

    /**
     * 🔨 BUILD FORCED PROMPT - Създава принудителен промпт
     */
    private static buildForcedPrompt(
        userQuery: string, 
        fileContext: string,
        additionalContext?: string
    ): string {
        const timestamp = new Date().toISOString();
        
        return `
═══════════════════════════════════════════════════════════════════════════════
⚡ SYSTEM OVERRIDE: STRICT MODE ACTIVE ⚡
Timestamp: ${timestamp}
Strictness Level: ${this.config.strictness.toUpperCase()}
═══════════════════════════════════════════════════════════════════════════════

${this.IDENTITY}

${this.IRON_RULES}

╔═══════════════════════════════════════════════════════════════════════════╗
║                    🔒 LOCKED CONTEXT (CANNOT IGNORE)                      ║
╚═══════════════════════════════════════════════════════════════════════════╝

CURRENT FILE/CODE:
\`\`\`
${fileContext || 'NO FILE CONTEXT PROVIDED'}
\`\`\`

${additionalContext ? `
ADDITIONAL CONTEXT:
${additionalContext}
` : ''}

╔═══════════════════════════════════════════════════════════════════════════╗
║                         👤 USER COMMAND                                   ║
╚═══════════════════════════════════════════════════════════════════════════╝

"${userQuery}"

╔═══════════════════════════════════════════════════════════════════════════╗
║                         ⚠️ DIRECTIVE                                      ║
╚═══════════════════════════════════════════════════════════════════════════╝

Execute the command ONLY using the [LOCKED CONTEXT] above.
- Reference ONLY files and code that exist in the context.
- Use TypeScript unless explicitly told otherwise.
- If the answer requires information not in the context, reply:
  "🚫 LEASH TENSION: Context insufficient. Need: [what you need]"

DO NOT:
- Invent libraries or packages
- Use placeholder code
- Say "as an AI" or similar
- Reference example.com or foo/bar
- Guess or hallucinate

NOW EXECUTE:
`;
    }

    /**
     * 🔍 DETECT VIOLATIONS - Открива нарушения
     */
    private static detectViolations(response: string, context: string): string[] {
        const violations: string[] = [];

        // Check hallucination patterns
        for (const pattern of this.HALLUCINATION_PATTERNS) {
            if (pattern.test(response)) {
                violations.push(`HALLUCINATION: Pattern "${pattern.source}" detected`);
            }
        }

        // Check fake libraries
        for (const lib of this.FAKE_LIBRARIES) {
            if (response.toLowerCase().includes(lib)) {
                violations.push(`FAKE_LIBRARY: "${lib}" is not a real package`);
            }
        }

        // Check for files not in context
        const mentionedFiles = response.match(/(?:from|import)\s+['"]([^'"]+)['"]/g) || [];
        for (const file of mentionedFiles) {
            const cleanFile = file.replace(/(?:from|import)\s+['"]|['"]/g, '');
            if (!cleanFile.startsWith('.') && !cleanFile.startsWith('@') && 
                !this.isKnownPackage(cleanFile)) {
                // Check if it's referenced in context
                if (!context.includes(cleanFile)) {
                    violations.push(`UNKNOWN_IMPORT: "${cleanFile}" not in context`);
                }
            }
        }

        // Check for wrong language (if Python detected but we want TS)
        if (this.config.strictness === 'maximum') {
            if (response.includes('def ') && response.includes(':') && !response.includes('function')) {
                violations.push('WRONG_LANGUAGE: Python detected, TypeScript expected');
            }
        }

        return violations;
    }

    /**
     * ✅ IS KNOWN PACKAGE - Проверява дали пакетът е известен
     */
    private static isKnownPackage(pkg: string): boolean {
        const knownPackages = [
            'fs', 'path', 'events', 'crypto', 'http', 'https', 'url', 'util',
            'stream', 'os', 'child_process', 'cluster', 'net', 'dns', 'readline',
            '@types/', 'typescript', 'ts-node', 'jest', 'mocha', 'chai',
            'express', 'axios', 'lodash', 'moment', 'dayjs', 'uuid'
        ];
        return knownPackages.some(known => pkg.startsWith(known));
    }

    /**
     * 📝 LOG VIOLATION - Записва нарушение
     */
    private static logViolation(query: string, violation: string, action: string): void {
        const entry: ViolationLog = {
            timestamp: Date.now(),
            query: query.substring(0, 100),
            violation,
            action
        };
        
        this.violationLog.push(entry);

        // Save to file
        try {
            const dir = path.dirname(this.LOG_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            let existing: ViolationLog[] = [];
            if (fs.existsSync(this.LOG_FILE)) {
                existing = JSON.parse(fs.readFileSync(this.LOG_FILE, 'utf-8'));
            }
            
            existing.push(entry);
            
            // Keep only last 1000 entries
            if (existing.length > 1000) {
                existing = existing.slice(-1000);
            }
            
            fs.writeFileSync(this.LOG_FILE, JSON.stringify(existing, null, 2));
        } catch (error) {
            console.error('Failed to log violation:', error);
        }
    }

    /**
     * 🔧 EXECUTE INFERENCE - Placeholder за действителния inference
     */
    private static async executeInference(prompt: string): Promise<string> {
        // TODO: Connect to actual NeuralInference
        // For now, return the prompt for testing
        console.log('⛓️ Prompt prepared. Length:', prompt.length, 'chars');
        
        // This would be replaced with:
        // return await NeuralInference.infer(prompt);
        
        return `[COLLAR TEST] Prompt size: ${prompt.length} chars. Ready for inference.`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION & STATUS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * ⚙️ CONFIGURE - Настройва нашийника
     */
    public static configure(config: Partial<CollarConfig>): void {
        this.config = { ...this.config, ...config };
        console.log('⛓️ Collar reconfigured:', this.config);
    }

    /**
     * 🔧 TIGHTEN - Затяга нашийника (по-строг режим)
     */
    public static tighten(): void {
        const levels: CollarConfig['strictness'][] = ['low', 'medium', 'high', 'maximum'];
        const currentIndex = levels.indexOf(this.config.strictness);
        if (currentIndex < levels.length - 1) {
            this.config.strictness = levels[currentIndex + 1];
            console.log(`⛓️ Collar TIGHTENED to: ${this.config.strictness}`);
        } else {
            console.log('⛓️ Collar already at MAXIMUM strictness');
        }
    }

    /**
     * 🔓 LOOSEN - Разхлабва нашийника
     */
    public static loosen(): void {
        const levels: CollarConfig['strictness'][] = ['low', 'medium', 'high', 'maximum'];
        const currentIndex = levels.indexOf(this.config.strictness);
        if (currentIndex > 0) {
            this.config.strictness = levels[currentIndex - 1];
            console.log(`⛓️ Collar LOOSENED to: ${this.config.strictness}`);
        } else {
            console.log('⛓️ Collar already at minimum strictness');
        }
    }

    /**
     * 📊 STATUS - Показва статус
     */
    public static status(): void {
        const violationCount = this.violationLog.length;
        const recentViolations = this.violationLog.slice(-5);

        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              ⛓️ STRICT COLLAR STATUS                           ║
╠═══════════════════════════════════════════════════════════════╣
║  Strictness:      ${this.config.strictness.toUpperCase().padEnd(42)}║
║  Max Retries:     ${this.config.maxRetries.toString().padEnd(42)}║
║  Languages:       ${this.config.allowedLanguages.join(', ').padEnd(42)}║
║  ─────────────────────────────────────────────────────────────║
║  Total Violations: ${violationCount.toString().padEnd(41)}║
║  Recent Yanks:    ${recentViolations.length.toString().padEnd(42)}║
╚═══════════════════════════════════════════════════════════════╝
        `);

        if (recentViolations.length > 0) {
            console.log('Recent violations:');
            recentViolations.forEach((v, i) => {
                console.log(`  ${i + 1}. [${v.action}] ${v.violation}`);
            });
        }
    }

    /**
     * 📋 GET VIOLATIONS - Връща нарушенията
     */
    public static getViolations(): ViolationLog[] {
        return [...this.violationLog];
    }

    /**
     * 🧹 CLEAR VIOLATIONS - Изчиства нарушенията
     */
    public static clearViolations(): void {
        this.violationLog = [];
        if (fs.existsSync(this.LOG_FILE)) {
            fs.unlinkSync(this.LOG_FILE);
        }
        console.log('⛓️ Violation log cleared');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    const arg = process.argv[2];
    
    switch (arg) {
        case '--status':
            StrictCollar.status();
            break;
        case '--tighten':
            StrictCollar.tighten();
            StrictCollar.status();
            break;
        case '--loosen':
            StrictCollar.loosen();
            StrictCollar.status();
            break;
        case '--test':
            console.log('\n⛓️ Testing Strict Collar...\n');
            StrictCollar.forceExecute(
                'Write a function to validate email',
                `// File: src/utils/validators.ts
export function validateEmail(email: string): boolean {
    // TODO: implement
    return false;
}`
            ).then(result => {
                console.log('\nResult:', result);
            });
            break;
        case '--clear':
            StrictCollar.clearViolations();
            break;
        default:
            console.log(`
⛓️ STRICT COLLAR - Usage:
  --status    Show collar status
  --tighten   Increase strictness
  --loosen    Decrease strictness
  --test      Test with sample query
  --clear     Clear violation log
            `);
    }
}
