"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NEURAL INFERENCE ENGINE - DeepSeek V3 + RTX 4050 Hybrid Intelligence
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "DeepSeek V3 с 128k контекст - облачен мозък, локален контрол."
 *
 * Hybrid Intelligence:
 * - PRIMARY: DeepSeek V3 API (128k context, fast, cheap)
 * - FALLBACK: Ollama + RTX 4050 local inference
 * - RTX 4050 for embeddings and small tasks
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 30.6.2 - THE DEEPSEEK ASCENSION
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
exports.neuralEngine = exports.NeuralInference = void 0;
const events_1 = require("events");
const fs_1 = require("fs");
const path = __importStar(require("path"));
// ═══════════════════════════════════════════════════════════════════════════════
// NEURAL INFERENCE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
class NeuralInference extends events_1.EventEmitter {
    static instance;
    // DeepSeek V3 Configuration (PRIMARY)
    deepseekEndpoint = 'https://api.deepseek.com/v1/chat/completions';
    deepseekModel = 'deepseek-chat';
    deepseekApiKey = null;
    // Ollama Configuration (FALLBACK)
    localEndpoint = 'http://localhost:11434/api/generate';
    gpuAccelerator = 'NVIDIA RTX 4050';
    defaultLocalModel = 'gemma3:4b'; // Available on your system
    cache = new Map();
    totalInferences = 0;
    totalSavings = 0;
    deepseekCalls = 0;
    localCalls = 0;
    constructor() {
        super();
        this.loadApiKey();
        console.log(`
🧠 ═══════════════════════════════════════════════════════════════════════════════
   NEURAL INFERENCE ENGINE v30.6.2 - THE DEEPSEEK ASCENSION
   ─────────────────────────────────────────────────────────────────────────────
   PRIMARY:  DeepSeek V3 (128k context) ${this.deepseekApiKey ? '✅ ARMED' : '❌ NO KEY'}
   FALLBACK: ${this.gpuAccelerator} + Ollama (${this.defaultLocalModel})
═══════════════════════════════════════════════════════════════════════════════
    `);
    }
    loadApiKey() {
        // Try multiple locations for the API key
        const envPaths = [
            path.join(process.cwd(), '.env'),
            'C:\\MisteMind\\.env',
            'C:\\MrMindQATool\\.env'
        ];
        for (const envPath of envPaths) {
            try {
                if ((0, fs_1.existsSync)(envPath)) {
                    const content = (0, fs_1.readFileSync)(envPath, 'utf-8');
                    const match = content.match(/DEEPSEEK_API_KEY=([^\r\n]+)/);
                    if (match && match[1] && !match[1].includes('your_')) {
                        this.deepseekApiKey = match[1].trim();
                        console.log(`🔑 [NEURAL] DeepSeek API key loaded from ${envPath}`);
                        return;
                    }
                }
            }
            catch (e) {
                // Continue to next path
            }
        }
        // Try environment variable
        if (process.env.DEEPSEEK_API_KEY) {
            this.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
            console.log('🔑 [NEURAL] DeepSeek API key loaded from environment');
        }
    }
    static getInstance() {
        if (!NeuralInference.instance) {
            NeuralInference.instance = new NeuralInference();
        }
        return NeuralInference.instance;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN INFERENCE METHOD - HYBRID: DeepSeek PRIMARY, Ollama FALLBACK
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Perform hybrid inference:
     * 1. Try DeepSeek V3 first (128k context, fast)
     * 2. Fallback to RTX 4050 + Ollama if DeepSeek fails
     */
    async infer(prompt, context, options) {
        const startTime = Date.now();
        this.emit('inference:start', { prompt: prompt.substring(0, 100) });
        // Check cache first
        const cacheKey = this.createCacheKey(prompt, context);
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            console.log('💾 [NEURAL] Cache hit! Instant response.');
            this.emit('inference:complete', { ...cached, fromCache: true });
            return cached.response;
        }
        // Enrich prompt with context
        const enrichedPrompt = this.enrichPrompt(prompt, context);
        // ─────────────────────────────────────────────────────────────────────────
        // TRY 1: DeepSeek V3 (PRIMARY)
        // ─────────────────────────────────────────────────────────────────────────
        if (this.deepseekApiKey) {
            try {
                console.log('☁️ [NEURAL] Routing to DeepSeek V3 (128k context)...');
                const response = await fetch(this.deepseekEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.deepseekApiKey}`,
                    },
                    body: JSON.stringify({
                        model: this.deepseekModel,
                        messages: [
                            {
                                role: 'system',
                                content: 'You are Mister Mind, the QAntum Empire Architect. Respond with precision and expertise. Be concise.'
                            },
                            { role: 'user', content: enrichedPrompt }
                        ],
                        temperature: options?.temperature ?? 0.1,
                        max_tokens: options?.maxTokens ?? 4096,
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    const processingTimeMs = Date.now() - startTime;
                    this.deepseekCalls++;
                    this.totalInferences++;
                    const result = {
                        response: data.choices[0].message.content,
                        model: 'DeepSeek-V3',
                        processingTimeMs,
                        tokensUsed: data.usage?.total_tokens || 0,
                        fromCache: false,
                    };
                    this.cache.set(cacheKey, result);
                    console.log(`✅ [NEURAL] DeepSeek response in ${processingTimeMs}ms`);
                    console.log(`📊 [STATS] DeepSeek: ${this.deepseekCalls} | Local: ${this.localCalls}`);
                    this.emit('inference:complete', result);
                    return data.choices[0].message.content;
                }
                else {
                    console.warn(`⚠️ [NEURAL] DeepSeek returned ${response.status}, falling back to local...`);
                }
            }
            catch (error) {
                console.warn('⚠️ [NEURAL] DeepSeek failed:', error);
            }
        }
        // ─────────────────────────────────────────────────────────────────────────
        // TRY 2: Ollama + RTX 4050 (FALLBACK)
        // ─────────────────────────────────────────────────────────────────────────
        console.log(`🎮 [NEURAL] Falling back to ${this.gpuAccelerator} + Ollama...`);
        try {
            const response = await fetch(this.localEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: options?.model || this.defaultLocalModel,
                    prompt: enrichedPrompt,
                    stream: false,
                    options: {
                        temperature: options?.temperature ?? 0.1,
                        num_gpu: options?.numGpu ?? 1,
                        num_predict: options?.maxTokens ?? 2048,
                    },
                }),
            });
            if (!response.ok) {
                throw new Error(`Ollama returned ${response.status}`);
            }
            const data = await response.json();
            const processingTimeMs = Date.now() - startTime;
            this.localCalls++;
            this.totalInferences++;
            this.totalSavings += 0.01;
            const result = {
                response: data.response,
                model: this.defaultLocalModel,
                processingTimeMs,
                tokensUsed: data.eval_count || 0,
                fromCache: false,
            };
            this.cache.set(cacheKey, result);
            console.log(`✅ [NEURAL] Local inference in ${processingTimeMs}ms`);
            console.log(`💰 [SAVINGS] $${this.totalSavings.toFixed(2)} saved (${this.localCalls} local inferences)`);
            this.emit('inference:complete', result);
            return data.response;
        }
        catch (error) {
            console.error('⚠️ [NEURAL] Local inference failed:', error);
            this.emit('inference:error', { error, prompt: prompt.substring(0, 100) });
            // Return null to trigger BrainRouter fallback
            return null;
        }
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // SPECIALIZED INFERENCE METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Generate code fix for an error
     */
    async fixCode(errorLog, fileContent, context) {
        const prompt = `
ERROR: ${errorLog}

FILE_CONTENT:
\`\`\`typescript
${fileContent}
\`\`\`

${context ? `ADDITIONAL_CONTEXT: ${context}` : ''}

TASK: Provide ONLY the corrected code. No explanations. Output must be valid TypeScript.
    `;
        return this.infer(prompt, { priority: 'URGENT', type: 'code-fix' });
    }
    /**
     * Generate security analysis
     */
    async analyzeVulnerability(code, threatVector) {
        const prompt = `
SECURITY ANALYSIS REQUEST

CODE:
\`\`\`typescript
${code}
\`\`\`

THREAT VECTOR: ${threatVector}

TASK: Analyze the code for this specific threat vector. Provide:
1. Vulnerability assessment (LOW/MEDIUM/HIGH/CRITICAL)
2. Specific vulnerable lines
3. Recommended fix
4. Future-proofing suggestions

Format: Structured JSON response.
    `;
        return this.infer(prompt, { type: 'security-analysis' });
    }
    /**
     * Generate proposal for a lead
     */
    async generateProposal(leadData) {
        const prompt = `
SALES PROPOSAL GENERATION

TARGET COMPANY: ${leadData.company}
DETECTED ISSUES: ${JSON.stringify(leadData.issues)}
PRIORITY: ${leadData.priority}

TASK: Generate a professional technical audit proposal that:
1. Identifies their specific pain points
2. Proposes QAntum Ghost Protocol as the solution
3. Includes quantified benefits
4. Has a clear call-to-action
5. Pricing: Based on complexity

Format: Markdown document suitable for PDF export.
    `;
        return this.infer(prompt, { type: 'proposal-generation' });
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    enrichPrompt(prompt, context) {
        if (!context)
            return prompt;
        // Load backpack context if available
        let backpackSummary = '';
        try {
            const backpack = JSON.parse((0, fs_1.readFileSync)('./data/backpack.json', 'utf-8'));
            backpackSummary = backpack.summary || 'QAntum Prime - AI-Powered Security QA Framework';
        }
        catch {
            backpackSummary = 'QAntum Prime - AI-Powered Security QA Framework';
        }
        return `
SYSTEM: You are Mister Mind, the Singular QA Architect of QAntum Empire.
CONTEXT: ${backpackSummary}
ADDITIONAL_CONTEXT: ${JSON.stringify(context)}
DIRECTIVE: Execute with 100% precision. No hallucinations. No guessing.

---

${prompt}
    `;
    }
    createCacheKey(prompt, context) {
        const combined = prompt + JSON.stringify(context || {});
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `neural_${hash}`;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // STATUS METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    getTotalInferences() {
        return this.totalInferences;
    }
    getTotalSavings() {
        return this.totalSavings;
    }
    getCacheSize() {
        return this.cache.size;
    }
    clearCache() {
        this.cache.clear();
        console.log('🗑️ [NEURAL] Cache cleared');
    }
    async healthCheck() {
        try {
            const response = await fetch('http://localhost:11434/api/tags');
            return response.ok;
        }
        catch {
            return false;
        }
    }
}
exports.NeuralInference = NeuralInference;
// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
exports.neuralEngine = NeuralInference.getInstance();
exports.default = NeuralInference;
//# sourceMappingURL=NeuralInference.js.map