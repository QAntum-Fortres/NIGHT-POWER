/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                               ║
 * ║   ███████╗ ██████╗ ██╗   ██╗███████╗██████╗ ███████╗██╗ ██████╗ ███╗   ██╗                    ║
 * ║   ██╔════╝██╔═══██╗██║   ██║██╔════╝██╔══██╗██╔════╝██║██╔════╝ ████╗  ██║                    ║
 * ║   ███████╗██║   ██║██║   ██║█████╗  ██████╔╝█████╗  ██║██║  ███╗██╔██╗ ██║                    ║
 * ║   ╚════██║██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗██╔══╝  ██║██║   ██║██║╚██╗██║                    ║
 * ║   ███████║╚██████╔╝ ╚████╔╝ ███████╗██║  ██║███████╗██║╚██████╔╝██║ ╚████║                    ║
 * ║   ╚══════╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝                    ║
 * ║                                                                                               ║
 * ║   ███╗   ███╗ █████╗  ██████╗ ███╗   ██╗███████╗████████╗                                     ║
 * ║   ████╗ ████║██╔══██╗██╔════╝ ████╗  ██║██╔════╝╚══██╔══╝                                     ║
 * ║   ██╔████╔██║███████║██║  ███╗██╔██╗ ██║█████╗     ██║                                        ║
 * ║   ██║╚██╔╝██║██╔══██║██║   ██║██║╚██╗██║██╔══╝     ██║                                        ║
 * ║   ██║ ╚═╝ ██║██║  ██║╚██████╔╝██║ ╚████║███████╗   ██║                                        ║
 * ║   ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝                                        ║
 * ║                                                                                               ║
 * ║   🧲 ГРАВИТАЦИОНЕН КЛАДЕНЕЦ ЗА СЪВЪРШЕНСТВО                                                   ║
 * ║   Zero-Trust Staging Area with Self-Healing Pipeline                                          ║
 * ║                                                                                               ║
 * ║   "В QAntum не лъжем." - Черна дупка за лошия код, звезда за добрия.                          ║
 * ║                                                                                               ║
 * ║   Created: 2026-01-02 | QAntum Empire - ABSOLUTE SOVEREIGNTY                                  ║
 * ║   Author: Димитър Продромов                                                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

interface MagnetConfig {
  stagingArea: string;
  targetRoot: string;
  quarantineArea: string;
  logPath: string;
  aiEndpoint?: string;
  autoHeal: boolean;
  watchEnabled: boolean;
}

const DEFAULT_CONFIG: MagnetConfig = {
  stagingArea: path.join(process.cwd(), 'staging'),
  targetRoot: path.join(process.cwd(), 'src'),
  quarantineArea: path.join(process.cwd(), 'quarantine'),
  logPath: path.join(process.cwd(), 'data', 'magnet-log.json'),
  autoHeal: true,
  watchEnabled: true
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER ARCHITECTURE - The 5 Sovereign Layers
// ═══════════════════════════════════════════════════════════════════════════════

const LAYER_SIGNATURES = {
  physics: {
    keywords: ['GPU', 'Math', 'Vector', 'Matrix', 'Neural', 'Tensor', 'Compute', 'Performance'],
    description: 'Raw computational power - mathematics and physics engines'
  },
  biology: {
    keywords: ['Evolve', 'Learn', 'Adapt', 'Mutate', 'Generation', 'Population', 'Fitness', 'DNA'],
    description: 'Self-evolving systems - genetic algorithms and learning'
  },
  chemistry: {
    keywords: ['Bind', 'Connect', 'Link', 'Bridge', 'Adapter', 'Transform', 'Compose'],
    description: 'System glue - connectors and transformers'
  },
  fortress: {
    keywords: ['Hash', 'Security', 'Encrypt', 'Auth', 'Token', 'Guard', 'Vault', 'Shield'],
    description: 'Security layer - encryption and authentication'
  },
  reality: {
    keywords: ['Market', 'User', 'API', 'HTTP', 'Request', 'Response', 'Client', 'Server'],
    description: 'External interface - APIs and user interactions'
  },
  omega: {
    keywords: ['Sovereign', 'Magnet', 'Guardian', 'Nucleus', 'Core', 'Empire', 'Master'],
    description: 'Command center - orchestration and control'
  },
  intelligence: {
    keywords: ['Sync', 'Monitor', 'Audit', 'Health', 'Validate', 'Harmonize', 'Analyze'],
    description: 'Intelligence layer - monitoring and analysis'
  },
  cognition: {
    keywords: ['Think', 'Reason', 'Decide', 'Plan', 'Strategy', 'Logic', 'Inference'],
    description: 'Cognitive layer - decision making and reasoning'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HEALING MEMORY
// ═══════════════════════════════════════════════════════════════════════════════

interface HealingRecord {
  timestamp: string;
  file: string;
  originalHash: string;
  healedHash: string;
  errors: string[];
  fixes: string[];
  layer: string;
  success: boolean;
}

class MagnetMemory {
  private uniqueHashes = new Set<string>();
  private healingHistory: HealingRecord[] = [];
  private memoryPath: string;

  constructor(basePath: string) {
    this.memoryPath = path.join(basePath, 'data', 'magnet-memory.json');
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.memoryPath)) {
        const data = JSON.parse(fs.readFileSync(this.memoryPath, 'utf-8'));
        this.uniqueHashes = new Set(data.hashes || []);
        this.healingHistory = data.history || [];
      }
    } catch (e) { /* ignore */ }
  }

  save() {
    const dir = path.dirname(this.memoryPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(this.memoryPath, JSON.stringify({
      hashes: [...this.uniqueHashes],
      history: this.healingHistory.slice(-500), // Keep last 500
      stats: this.getStats()
    }, null, 2));
  }

  isDuplicate(hash: string): boolean {
    return this.uniqueHashes.has(hash);
  }

  registerHash(hash: string) {
    this.uniqueHashes.add(hash);
    this.save();
  }

  recordHealing(record: HealingRecord) {
    this.healingHistory.push(record);
    this.save();
  }

  getStats() {
    return {
      totalProcessed: this.uniqueHashes.size,
      totalHealed: this.healingHistory.filter(h => h.success).length,
      totalFailed: this.healingHistory.filter(h => !h.success).length,
      byLayer: this.getLayerStats()
    };
  }

  private getLayerStats() {
    const stats: Record<string, number> = {};
    this.healingHistory.forEach(h => {
      stats[h.layer] = (stats[h.layer] || 0) + 1;
    });
    return stats;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYNTAX ANALYZER
// ═══════════════════════════════════════════════════════════════════════════════

class SyntaxAnalyzer {
  
  /**
   * Fast syntax check without ts-morph (for runtime)
   */
  static quickCheck(code: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check bracket balance
    const brackets = { '{': 0, '[': 0, '(': 0 };
    const closers: Record<string, keyof typeof brackets> = { '}': '{', ']': '[', ')': '(' };
    
    for (const char of code) {
      if (char in brackets) brackets[char as keyof typeof brackets]++;
      if (char in closers) brackets[closers[char]]--;
    }
    
    if (brackets['{'] !== 0) errors.push('Unbalanced curly braces');
    if (brackets['['] !== 0) errors.push('Unbalanced square brackets');
    if (brackets['('] !== 0) errors.push('Unbalanced parentheses');
    
    // Check for common issues
    if (/import\s+{[^}]*}\s+from\s+['"]['"]\s*;?/.test(code)) {
      errors.push('Empty import path detected');
    }
    
    if (/export\s+(default\s+)?;/.test(code)) {
      errors.push('Empty export detected');
    }
    
    // Check for unclosed strings
    const stringMatches = code.match(/(['"`])(?:(?!\1|\\).|\\.)*$/gm);
    if (stringMatches && stringMatches.length > 0) {
      errors.push('Unclosed string literal');
    }
    
    // Check for invalid syntax patterns
    if (/\)\s*{[^}]*$/.test(code) && !/\)\s*{\s*\n/.test(code)) {
      // Might be unclosed function - needs more context
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Determine which layer the code belongs to
   */
  static determineLayer(code: string, filename: string): string {
    const normalizedCode = code.toLowerCase();
    const normalizedFile = filename.toLowerCase();
    
    // Score each layer
    const scores: Record<string, number> = {};
    
    for (const [layer, config] of Object.entries(LAYER_SIGNATURES)) {
      scores[layer] = 0;
      
      for (const keyword of config.keywords) {
        const regex = new RegExp(keyword, 'gi');
        const matches = code.match(regex) || [];
        scores[layer] += matches.length * 2;
        
        // Bonus for filename match
        if (normalizedFile.includes(keyword.toLowerCase())) {
          scores[layer] += 10;
        }
      }
    }
    
    // Find highest score
    let bestLayer = 'chemistry'; // Default
    let bestScore = 0;
    
    for (const [layer, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestLayer = layer;
      }
    }
    
    return bestLayer;
  }

  /**
   * Extract module exports
   */
  static extractExports(code: string): string[] {
    const exports: string[] = [];
    
    // Named exports
    const namedExports = code.match(/export\s+(class|interface|function|const|let|var|type|enum)\s+(\w+)/g);
    if (namedExports) {
      namedExports.forEach(exp => {
        const match = exp.match(/\s(\w+)$/);
        if (match) exports.push(match[1]);
      });
    }
    
    // Default export
    if (/export\s+default/.test(code)) {
      exports.push('default');
    }
    
    return exports;
  }

  /**
   * Extract imports
   */
  static extractImports(code: string): Array<{ from: string; imports: string[] }> {
    const imports: Array<{ from: string; imports: string[] }> = [];
    
    const importRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(code)) !== null) {
      const namedImports = match[1] ? match[1].split(',').map(s => s.trim()) : [];
      const defaultImport = match[2] ? [match[2]] : [];
      imports.push({
        from: match[3],
        imports: [...namedImports, ...defaultImport]
      });
    }
    
    return imports;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CODE HEALER
// ═══════════════════════════════════════════════════════════════════════════════

class CodeHealer {
  
  /**
   * Attempt to fix common issues
   */
  static heal(code: string, errors: string[]): { healed: string; fixes: string[] } {
    let healedCode = code;
    const fixes: string[] = [];
    
    // Fix unbalanced brackets
    if (errors.some(e => e.includes('curly braces'))) {
      const opens = (healedCode.match(/{/g) || []).length;
      const closes = (healedCode.match(/}/g) || []).length;
      
      if (opens > closes) {
        healedCode += '\n' + '}'.repeat(opens - closes);
        fixes.push(`Added ${opens - closes} closing curly braces`);
      }
    }
    
    if (errors.some(e => e.includes('parentheses'))) {
      const opens = (healedCode.match(/\(/g) || []).length;
      const closes = (healedCode.match(/\)/g) || []).length;
      
      if (opens > closes) {
        healedCode = healedCode.replace(/\n$/, '') + ')'.repeat(opens - closes) + '\n';
        fixes.push(`Added ${opens - closes} closing parentheses`);
      }
    }
    
    // Fix empty imports
    if (errors.some(e => e.includes('Empty import'))) {
      healedCode = healedCode.replace(/import\s+{[^}]*}\s+from\s+['"]['"]\s*;?/g, '// Removed empty import');
      fixes.push('Removed empty import statement');
    }
    
    // Add missing semicolons (conservative)
    healedCode = healedCode.replace(/}\s*\n\s*(export|import|const|let|var|class|interface|function)/g, '};\n$1');
    
    // Ensure file ends with newline
    if (!healedCode.endsWith('\n')) {
      healedCode += '\n';
    }
    
    return { healed: healedCode, fixes };
  }

  /**
   * Format code consistently
   */
  static format(code: string): string {
    // Basic formatting
    let formatted = code;
    
    // Normalize line endings
    formatted = formatted.replace(/\r\n/g, '\n');
    
    // Remove trailing whitespace
    formatted = formatted.split('\n').map(line => line.trimEnd()).join('\n');
    
    // Ensure consistent spacing around operators
    formatted = formatted.replace(/\s*=\s*/g, ' = ');
    formatted = formatted.replace(/\s*=>\s*/g, ' => ');
    
    // Remove multiple blank lines
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    return formatted;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOVEREIGN MAGNET - Main Class
// ═══════════════════════════════════════════════════════════════════════════════

export class SovereignMagnet extends EventEmitter {
  private config: MagnetConfig;
  private memory: MagnetMemory;
  private watcher?: fs.FSWatcher;
  private isActive = false;
  private processQueue: string[] = [];
  private processing = false;

  constructor(config: Partial<MagnetConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memory = new MagnetMemory(path.dirname(this.config.targetRoot));
    this.ensureDirectories();
  }

  private ensureDirectories() {
    [this.config.stagingArea, this.config.quarantineArea].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 🧲 Activate the Magnetic Field
   */
  activateField(): void {
    if (this.isActive) return;
    
    console.log('\n╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                               ║');
    console.log('║   🧲 SOVEREIGN MAGNET PROTOCOL ACTIVATED 🧲                                   ║');
    console.log('║                                                                               ║');
    console.log('║   "Черна дупка за лошия код, звезда за добрия"                                ║');
    console.log('║                                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');
    
    console.log(`📂 Staging Area: ${this.config.stagingArea}`);
    console.log(`🎯 Target Root: ${this.config.targetRoot}`);
    console.log(`🔒 Quarantine: ${this.config.quarantineArea}`);
    console.log(`📊 Processed: ${this.memory.getStats().totalProcessed} modules\n`);
    
    this.isActive = true;
    
    if (this.config.watchEnabled) {
      this.startWatcher();
    }
    
    // Process any existing files in staging
    this.processExisting();
    
    this.emit('activated');
  }

  private startWatcher() {
    console.log('👁️ Watching for new matter...\n');
    
    this.watcher = fs.watch(this.config.stagingArea, { recursive: true }, (eventType, filename) => {
      if (filename && (eventType === 'rename' || eventType === 'change')) {
        const filePath = path.join(this.config.stagingArea, filename);
        
        // Only process TypeScript/JavaScript files
        if (/\.(ts|js|tsx|jsx)$/.test(filename) && fs.existsSync(filePath)) {
          this.queueProcess(filePath);
        }
      }
    });
  }

  private async processExisting() {
    const files = this.getAllFiles(this.config.stagingArea, ['.ts', '.js', '.tsx', '.jsx']);
    
    if (files.length > 0) {
      console.log(`📦 Found ${files.length} existing files in staging. Processing...\n`);
      
      for (const file of files) {
        await this.processMatter(file);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESSING QUEUE
  // ═══════════════════════════════════════════════════════════════════════════

  private queueProcess(filePath: string) {
    if (!this.processQueue.includes(filePath)) {
      this.processQueue.push(filePath);
      this.processNext();
    }
  }

  private async processNext() {
    if (this.processing || this.processQueue.length === 0) return;
    
    this.processing = true;
    const filePath = this.processQueue.shift()!;
    
    try {
      await this.processMatter(filePath);
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error);
    }
    
    this.processing = false;
    this.processNext();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MATTER PROCESSING (The Core)
  // ═══════════════════════════════════════════════════════════════════════════

  private async processMatter(filePath: string): Promise<void> {
    const filename = path.basename(filePath);
    console.log(`⚡ Detected new matter: ${filename}`);
    
    // Read file
    let code: string;
    try {
      code = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      console.log(`  ❌ Could not read file`);
      return;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: UNIQUENESS CHECK (The Unique Filter)
    // ─────────────────────────────────────────────────────────────────────────
    
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    
    if (this.memory.isDuplicate(hash)) {
      console.log(`  🗑️ Matter is duplicate. Disintegrating...`);
      fs.unlinkSync(filePath);
      this.emit('duplicate', { file: filename, hash });
      return;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: FLAW DETECTION (The Flaw Detector)
    // ─────────────────────────────────────────────────────────────────────────
    
    const { valid, errors } = SyntaxAnalyzer.quickCheck(code);
    
    if (!valid && this.config.autoHeal) {
      console.log(`  ⚠️ Flaws detected (${errors.length}). Initiating Immediate Repair...`);
      errors.forEach(e => console.log(`     • ${e}`));
      
      // ─────────────────────────────────────────────────────────────────────────
      // STEP 3: AUTOMATIC HEALING (The Forge)
      // ─────────────────────────────────────────────────────────────────────────
      
      const { healed, fixes } = CodeHealer.heal(code, errors);
      code = healed;
      
      if (fixes.length > 0) {
        console.log(`  ✨ Matter purified:`);
        fixes.forEach(f => console.log(`     ✓ ${f}`));
      }
      
      // Verify healing
      const recheck = SyntaxAnalyzer.quickCheck(code);
      if (!recheck.valid) {
        console.log(`  🔒 Matter still flawed. Moving to quarantine...`);
        const quarantinePath = path.join(this.config.quarantineArea, filename);
        fs.writeFileSync(quarantinePath, code);
        fs.unlinkSync(filePath);
        
        this.memory.recordHealing({
          timestamp: new Date().toISOString(),
          file: filename,
          originalHash: hash,
          healedHash: crypto.createHash('sha256').update(code).digest('hex'),
          errors,
          fixes,
          layer: 'quarantine',
          success: false
        });
        
        this.emit('quarantined', { file: filename, errors: recheck.errors });
        return;
      }
    }
    
    // Format code
    code = CodeHealer.format(code);
    
    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: LAYER DETERMINATION & TELEPORTATION (The Placement)
    // ─────────────────────────────────────────────────────────────────────────
    
    const targetLayer = SyntaxAnalyzer.determineLayer(code, filename);
    const targetDir = path.join(this.config.targetRoot, targetLayer);
    
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const targetPath = path.join(targetDir, filename);
    
    // Atomic move
    fs.writeFileSync(targetPath, code);
    fs.unlinkSync(filePath);
    
    const healedHash = crypto.createHash('sha256').update(code).digest('hex');
    this.memory.registerHash(healedHash);
    
    console.log(`  🚀 Module attracted and locked into: src/${targetLayer}/${filename}`);
    
    // ─────────────────────────────────────────────────────────────────────────
    // STEP 5: ENTANGLEMENT (Immediate Connection)
    // ─────────────────────────────────────────────────────────────────────────
    
    await this.entangleModule(targetPath);
    
    // Record success
    this.memory.recordHealing({
      timestamp: new Date().toISOString(),
      file: filename,
      originalHash: hash,
      healedHash,
      errors: errors,
      fixes: [],
      layer: targetLayer,
      success: true
    });
    
    this.emit('processed', { file: filename, layer: targetLayer, path: targetPath });
    console.log('');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENTANGLEMENT (Module Connection)
  // ═══════════════════════════════════════════════════════════════════════════

  private async entangleModule(targetPath: string): Promise<void> {
    const dir = path.dirname(targetPath);
    const moduleName = path.basename(targetPath, path.extname(targetPath));
    const indexFile = path.join(dir, 'index.ts');
    
    const exportLine = `export * from './${moduleName}';`;
    
    if (fs.existsSync(indexFile)) {
      const indexContent = fs.readFileSync(indexFile, 'utf-8');
      
      // Don't add if already exists
      if (!indexContent.includes(exportLine)) {
        fs.appendFileSync(indexFile, `\n${exportLine}\n`);
        console.log(`  🔗 Entangled with index.ts`);
      }
    } else {
      // Create new index.ts
      fs.writeFileSync(indexFile, `/**\n * Auto-generated index by SovereignMagnet\n */\n\n${exportLine}\n`);
      console.log(`  📄 Created index.ts with entanglement`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEACTIVATION
  // ═══════════════════════════════════════════════════════════════════════════

  deactivateField(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
    }
    
    this.memory.save();
    
    console.log('\n🛑 Magnetic field deactivated');
    console.log(`   Processed: ${this.memory.getStats().totalProcessed} modules`);
    
    this.emit('deactivated');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MANUAL INJECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Manually inject code into the magnet
   */
  async inject(filename: string, code: string): Promise<{ success: boolean; path?: string; error?: string }> {
    const stagingPath = path.join(this.config.stagingArea, filename);
    
    try {
      fs.writeFileSync(stagingPath, code);
      await this.processMatter(stagingPath);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  private getAllFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...this.getAllFiles(fullPath, extensions));
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (e) { /* ignore */ }
    
    return files;
  }

  getStats() {
    return this.memory.getStats();
  }

  isFieldActive(): boolean {
    return this.isActive;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

let magnetInstance: SovereignMagnet | null = null;

export function getMagnet(config?: Partial<MagnetConfig>): SovereignMagnet {
  if (!magnetInstance) {
    magnetInstance = new SovereignMagnet(config);
  }
  return magnetInstance;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  const magnet = new SovereignMagnet({
    stagingArea: path.join(__dirname, '..', '..', 'staging'),
    targetRoot: path.join(__dirname, '..'),
    quarantineArea: path.join(__dirname, '..', '..', 'quarantine')
  });

  magnet.on('processed', ({ file, layer }) => {
    console.log(`✅ ${file} → ${layer}`);
  });

  magnet.on('quarantined', ({ file }) => {
    console.log(`🔒 ${file} → quarantine`);
  });

  magnet.activateField();

  // Handle shutdown
  process.on('SIGINT', () => {
    magnet.deactivateField();
    process.exit(0);
  });
}
