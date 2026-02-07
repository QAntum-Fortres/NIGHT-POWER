/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                       ║
 * ║   🧲 QANTUM MAGNET - AUTOMATIC MODULE COLLECTOR                                       ║
 * ║   "Събира ВСИЧКИ модули без значение къде са"                                         ║
 * ║                                                                                       ║
 * ║   Scans ALL directories recursively and catalogs every module found                   ║
 * ║                                                                                       ║
 * ║   @author Dimitar Prodromov                                                           ║
 * ║   @version 35.0.0                                                                     ║
 * ║                                                                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════╝
 */

import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface MagnetModule {
  name: string;
  source: 'MrMindQATool' | 'MisteMind' | 'MisterMindPage' | 'Unknown';
  path: string;
  category: ModuleCategory;
  files: number;
  loc: number;
  status: 'active' | 'experimental' | 'deprecated';
  exports: string[];
  dependencies: string[];
  lastModified?: Date;
}

export type ModuleCategory = 
  | 'core'           // Core engine and utilities
  | 'security'       // Security, cryptography, bastion, fortress
  | 'ai'             // AI, cognition, neural networks
  | 'testing'        // QA, validation, performance
  | 'enterprise'     // Enterprise features, licensing
  | 'scientific'     // Math, physics, biology, chemistry
  | 'infrastructure' // Docker, swarm, distributed
  | 'ui'             // Dashboard, reporting, visualization
  | 'data'           // Storage, caching, data management
  | 'integration'    // API, plugins, extensibility
  | 'stealth'        // Ghost, anti-detection, phantom
  | 'synthesis';     // Code generation, content creation

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const CATEGORY_MAP: Record<string, ModuleCategory> = {
  // Core
  core: 'core',
  types: 'core',
  config: 'core',
  events: 'core',
  chronos: 'core',
  omega: 'core',
  
  // Security
  security: 'security',
  bastion: 'security',
  fortress: 'security',
  guardians: 'security',
  
  // AI & Cognition
  ai: 'ai',
  cognition: 'ai',
  intelligence: 'ai',
  neural: 'ai',
  multimodal: 'ai',
  persona: 'ai',
  oracle: 'ai',
  asc: 'ai',
  
  // Testing
  testing: 'testing',
  validation: 'testing',
  performance: 'testing',
  accessibility: 'testing',
  visual: 'testing',
  chaos: 'testing',
  segc: 'testing',
  
  // Scientific
  physics: 'scientific',
  biology: 'scientific',
  chemistry: 'scientific',
  math: 'scientific',
  
  // Enterprise
  enterprise: 'enterprise',
  licensing: 'enterprise',
  saas: 'enterprise',
  sales: 'enterprise',
  outreach: 'enterprise',
  
  // Infrastructure
  swarm: 'infrastructure',
  distributed: 'infrastructure',
  local: 'infrastructure',
  telemetry: 'infrastructure',
  
  // UI
  dashboard: 'ui',
  reporter: 'ui',
  ux: 'ui',
  
  // Data
  data: 'data',
  storage: 'data',
  
  // Integration
  api: 'integration',
  plugins: 'integration',
  extensibility: 'integration',
  integration: 'integration',
  
  // Stealth
  ghost: 'stealth',
  
  // Synthesis
  synthesis: 'synthesis',
  reality: 'synthesis',
  
  // Special
  ide: 'core',
  'global-nexus': 'core',
  'sovereign-market': 'enterprise',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCAN PATHS - ВСИЧКИ ВЪЗМОЖНИ ЛОКАЦИИ
// ═══════════════════════════════════════════════════════════════════════════════

const SCAN_PATHS = [
  // === PRIMARY SOURCES ===
  'C:/MrMindQATool/src',
  'C:/MisteMind/src',
  'C:/MisterMindPage',
  
  // === PRIVATE CORE (PROTECTED) ===
  'C:/MisteMind/PROJECT/PRIVATE/Mind-Engine-Core/src',
  'C:/MisteMind/PROJECT/PRIVATE/MrMindQATool/src',
  'C:/MisteMind/PROJECT/PRIVATE/QA-Framework/src',
  
  // === QA-SAAS PLATFORM (EXPANDED) ===
  'C:/MisteMind/PROJECT/QA-SAAS/apps',
  'C:/MisteMind/PROJECT/QA-SAAS/packages',
  
  // === NERVE CENTER ===
  'C:/MisteMind/qantum-nerve-center/src',
  'C:/MisteMind/qantum-nerve-center/server',
  
  // === TRAINING ===
  'C:/MisteMind/TRAINING/training-framework/src',
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAGNET CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class QAntumMagnet {
  private modules: Map<string, MagnetModule> = new Map();
  private scanPaths: string[];
  private lastScan?: Date;
  
  constructor(customPaths?: string[]) {
    this.scanPaths = customPaths || SCAN_PATHS;
  }
  
  /**
   * 🧲 ГЛАВНА ФУНКЦИЯ - Сканира и събира ВСИЧКИ модули
   */
  async scan(): Promise<MagnetModule[]> {
    console.log('🧲 QANTUM MAGNET ACTIVATED');
    console.log('═══════════════════════════════════════════════════════════');
    
    this.modules.clear();
    
    for (const basePath of this.scanPaths) {
      if (fs.existsSync(basePath)) {
        await this.scanDirectory(basePath);
      }
    }
    
    this.lastScan = new Date();
    
    const results = Array.from(this.modules.values());
    console.log(`\n🧲 MAGNET COMPLETE: ${results.length} modules collected`);
    console.log(`   Total LOC: ${results.reduce((sum, m) => sum + m.loc, 0).toLocaleString()}`);
    
    return results;
  }
  
  /**
   * Сканира директория за модули
   */
  private async scanDirectory(basePath: string): Promise<void> {
    const source = this.detectSource(basePath);
    console.log(`\n📁 Scanning: ${basePath} [${source}]`);
    
    try {
      const entries = fs.readdirSync(basePath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !this.shouldSkip(entry.name)) {
          const modulePath = path.join(basePath, entry.name);
          const module = await this.analyzeModule(entry.name, modulePath, source);
          
          if (module.files > 0) {
            const key = modulePath;
            this.modules.set(key, module);
            console.log(`   ✅ ${entry.name}: ${module.files} files, ${module.loc} LOC`);
          }
        }
      }
    } catch (error) {
      console.error(`   ❌ Error scanning ${basePath}:`, error);
    }
  }
  
  /**
   * Анализира един модул
   */
  private async analyzeModule(
    name: string, 
    modulePath: string, 
    source: MagnetModule['source']
  ): Promise<MagnetModule> {
    const tsFiles = this.findTsFiles(modulePath);
    const loc = this.countLOC(tsFiles);
    const exports = this.extractExports(modulePath);
    const deps = this.extractDependencies(modulePath);
    
    return {
      name,
      source,
      path: modulePath,
      category: CATEGORY_MAP[name] || 'core',
      files: tsFiles.length,
      loc,
      status: this.determineStatus(name, loc),
      exports,
      dependencies: deps,
      lastModified: this.getLastModified(modulePath)
    };
  }
  
  /**
   * Намира всички .ts файлове (без node_modules и .d.ts)
   */
  private findTsFiles(dir: string): string[] {
    const files: string[] = [];
    
    const scan = (currentDir: string) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            if (!this.shouldSkip(entry.name)) {
              scan(fullPath);
            }
          } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
            files.push(fullPath);
          }
        }
      } catch {}
    };
    
    scan(dir);
    return files;
  }
  
  /**
   * Брои LOC
   */
  private countLOC(files: string[]): number {
    let total = 0;
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        total += content.split('\n').length;
      } catch {}
    }
    
    return total;
  }
  
  /**
   * Извлича exports от index.ts
   */
  private extractExports(modulePath: string): string[] {
    const indexPath = path.join(modulePath, 'index.ts');
    const exports: string[] = [];
    
    try {
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf-8');
        const exportMatches = content.match(/export\s+(?:class|interface|function|const|type|enum)\s+(\w+)/g);
        
        if (exportMatches) {
          for (const match of exportMatches) {
            const name = match.split(/\s+/).pop();
            if (name) exports.push(name);
          }
        }
        
        // Also check for re-exports
        const reExportMatches = content.match(/export\s+\*\s+from\s+['"](.+)['"]/g);
        if (reExportMatches) {
          exports.push(`[re-exports: ${reExportMatches.length}]`);
        }
      }
    } catch {}
    
    return exports.slice(0, 10); // Limit to 10
  }
  
  /**
   * Извлича dependencies
   */
  private extractDependencies(modulePath: string): string[] {
    const deps = new Set<string>();
    const indexPath = path.join(modulePath, 'index.ts');
    
    try {
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf-8');
        const importMatches = content.match(/from\s+['"]\.\.\/(\w+)['"]/g);
        
        if (importMatches) {
          for (const match of importMatches) {
            const dep = match.match(/\.\.\/(\w+)/)?.[1];
            if (dep) deps.add(dep);
          }
        }
      }
    } catch {}
    
    return Array.from(deps);
  }
  
  /**
   * Определя source по пътя
   */
  private detectSource(basePath: string): MagnetModule['source'] {
    if (basePath.includes('MrMindQATool')) return 'MrMindQATool';
    if (basePath.includes('MisteMind')) return 'MisteMind';
    if (basePath.includes('MisterMindPage')) return 'MisterMindPage';
    return 'Unknown';
  }
  
  /**
   * Директории за пропускане
   */
  private shouldSkip(name: string): boolean {
    const skipList = [
      'node_modules', 'dist', '.git', '.vscode', 
      'coverage', 'build', '__tests__', '__mocks__'
    ];
    return skipList.includes(name) || name.startsWith('.');
  }
  
  /**
   * Определя статус на модула
   */
  private determineStatus(name: string, loc: number): MagnetModule['status'] {
    const experimental = ['multimodal', 'persona', 'reality', 'synthesis', 'oracle'];
    if (experimental.includes(name)) return 'experimental';
    if (loc < 100) return 'deprecated';
    return 'active';
  }
  
  /**
   * Последна модификация
   */
  private getLastModified(modulePath: string): Date | undefined {
    try {
      const stat = fs.statSync(modulePath);
      return stat.mtime;
    } catch {
      return undefined;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Връща всички модули
   */
  getAllModules(): MagnetModule[] {
    return Array.from(this.modules.values());
  }
  
  /**
   * Филтрира по категория
   */
  getByCategory(category: ModuleCategory): MagnetModule[] {
    return this.getAllModules().filter(m => m.category === category);
  }
  
  /**
   * Филтрира по source
   */
  getBySource(source: MagnetModule['source']): MagnetModule[] {
    return this.getAllModules().filter(m => m.source === source);
  }
  
  /**
   * Търсене по име
   */
  findModule(name: string): MagnetModule | undefined {
    return this.getAllModules().find(m => m.name === name);
  }
  
  /**
   * Статистики
   */
  getStats() {
    const modules = this.getAllModules();
    const byCategory: Record<string, { count: number; loc: number }> = {};
    const bySource: Record<string, { count: number; loc: number }> = {};
    
    for (const m of modules) {
      // By category
      if (!byCategory[m.category]) {
        byCategory[m.category] = { count: 0, loc: 0 };
      }
      byCategory[m.category].count++;
      byCategory[m.category].loc += m.loc;
      
      // By source
      if (!bySource[m.source]) {
        bySource[m.source] = { count: 0, loc: 0 };
      }
      bySource[m.source].count++;
      bySource[m.source].loc += m.loc;
    }
    
    return {
      totalModules: modules.length,
      totalLOC: modules.reduce((sum, m) => sum + m.loc, 0),
      totalFiles: modules.reduce((sum, m) => sum + m.files, 0),
      byCategory,
      bySource,
      activeModules: modules.filter(m => m.status === 'active').length,
      experimentalModules: modules.filter(m => m.status === 'experimental').length,
      lastScan: this.lastScan
    };
  }
  
  /**
   * Експорт към JSON
   */
  toJSON(): string {
    return JSON.stringify({
      modules: this.getAllModules(),
      stats: this.getStats(),
      scanPaths: this.scanPaths,
      generatedAt: new Date().toISOString()
    }, null, 2);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const magnet = new QAntumMagnet();

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-SCAN ON IMPORT (optional)
// ═══════════════════════════════════════════════════════════════════════════════

// Uncomment to auto-scan on import:
// magnet.scan().then(() => console.log('Magnet ready!'));

export default magnet;
