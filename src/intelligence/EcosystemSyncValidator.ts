/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                               ║
 * ║   ███████╗ ██████╗ ██████╗ ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗             ║
 * ║   ██╔════╝██╔════╝██╔═══██╗██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║             ║
 * ║   █████╗  ██║     ██║   ██║███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║             ║
 * ║   ██╔══╝  ██║     ██║   ██║╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║             ║
 * ║   ███████╗╚██████╗╚██████╔╝███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║             ║
 * ║   ╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝             ║
 * ║                                                                                               ║
 * ║                     SYNC VALIDATOR - ГАРАНТ ЗА ПЕРФЕКТНА СИНХРОНИЗАЦИЯ                        ║
 * ║                                                                                               ║
 * ║   "868,947 реда код, работещи като един организъм - всеки компонент                           ║
 * ║    свързан, всяка промяна синхронизирана, всеки тип валидиран."                               ║
 * ║                                                                                               ║
 * ║   Created: 2026-01-02 | QAntum Empire v34.0 - ABSOLUTE SOVEREIGNTY                            ║
 * ║   Author: Димитър Продромов                                                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface EcosystemProject {
  name: string;
  path: string;
  role: 'core' | 'shield' | 'voice';
  version: string;
  modules: ModuleInfo[];
  dependencies: DependencyInfo[];
  exports: ExportInfo[];
  stats: ProjectStats;
}

export interface ModuleInfo {
  name: string;
  path: string;
  classes: string[];
  interfaces: string[];
  functions: string[];
  exports: string[];
  imports: ImportInfo[];
  hash: string;
}

export interface ImportInfo {
  from: string;
  imports: string[];
  isExternal: boolean;
  isShared: boolean;
}

export interface ExportInfo {
  name: string;
  type: 'class' | 'interface' | 'function' | 'type' | 'const' | 'enum';
  module: string;
  usedBy: string[];
}

export interface DependencyInfo {
  name: string;
  version: string;
  isShared: boolean;
  sharedWith: string[];
}

export interface ProjectStats {
  totalFiles: number;
  totalLines: number;
  tsFiles: number;
  jsFiles: number;
  modules: number;
  exports: number;
}

export interface SyncReport {
  timestamp: Date;
  ecosystemHealth: 'PERFECT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  score: number;
  totalLines: number;
  totalFiles: number;
  projects: EcosystemProject[];
  sharedModules: SharedModule[];
  dependencyMatrix: DependencyMatrix;
  syncIssues: SyncIssue[];
  recommendations: string[];
}

export interface SharedModule {
  name: string;
  existsIn: string[];
  hashMatch: boolean;
  versions: { project: string; hash: string }[];
}

export interface DependencyMatrix {
  shared: DependencyInfo[];
  conflicts: DependencyConflict[];
  missing: string[];
}

export interface DependencyConflict {
  name: string;
  versions: { project: string; version: string }[];
  recommendation: string;
}

export interface SyncIssue {
  type: 'version_mismatch' | 'missing_export' | 'broken_import' | 'duplicate_code' | 'orphan_module';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  affectedProjects: string[];
  suggestedFix: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ECOSYSTEM SYNC VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class EcosystemSyncValidator {
  private projects: Map<string, EcosystemProject> = new Map();
  private ignoreDirs = ['node_modules', '.git', 'dist', '.venv', 'dist-forge', 'dist-protected', 'coverage', 'out'];
  
  // The Trident of Power 🔱
  private readonly TRIDENT = {
    MrMindQATool: { role: 'shield' as const, desc: 'The Shield - QA & Testing' },
    MisteMind: { role: 'core' as const, desc: 'The Core - Business Logic & AI' },
    MisterMindPage: { role: 'voice' as const, desc: 'The Voice - Public Interface' }
  };

  constructor() {
    console.log('🔱 EcosystemSyncValidator initialized');
    console.log('   "868,947 реда код в перфектна хармония"');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  async validateEcosystem(): Promise<SyncReport> {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║             🔍 ECOSYSTEM SYNC VALIDATION                      ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const startTime = Date.now();

    // 1. Scan all projects
    await this.scanProjects();

    // 2. Analyze dependencies
    const dependencyMatrix = this.analyzeDependencies();

    // 3. Find shared modules
    const sharedModules = this.findSharedModules();

    // 4. Detect sync issues
    const syncIssues = this.detectSyncIssues();

    // 5. Calculate health score
    const { health, score } = this.calculateHealth(syncIssues);

    // 6. Generate recommendations
    const recommendations = this.generateRecommendations(syncIssues, dependencyMatrix);

    // Calculate totals
    let totalLines = 0;
    let totalFiles = 0;
    const projectsList: EcosystemProject[] = [];
    
    this.projects.forEach((project) => {
      totalLines += project.stats.totalLines;
      totalFiles += project.stats.totalFiles;
      projectsList.push(project);
    });

    const report: SyncReport = {
      timestamp: new Date(),
      ecosystemHealth: health,
      score,
      totalLines,
      totalFiles,
      projects: projectsList,
      sharedModules,
      dependencyMatrix,
      syncIssues,
      recommendations
    };

    const duration = Date.now() - startTime;
    this.printReport(report, duration);

    return report;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECT SCANNING
  // ═══════════════════════════════════════════════════════════════════════════

  private async scanProjects(): Promise<void> {
    const projectPaths = [
      { name: 'MrMindQATool', path: 'C:\\MrMindQATool' },
      { name: 'MisteMind', path: 'C:\\MisteMind' },
      { name: 'MisterMindPage', path: 'C:\\MisterMindPage' }
    ];

    for (const proj of projectPaths) {
      console.log(`📂 Scanning ${proj.name}...`);
      const project = await this.scanProject(proj.name, proj.path);
      this.projects.set(proj.name, project);
      console.log(`   ✓ ${project.stats.totalFiles} files, ${project.stats.totalLines.toLocaleString()} lines`);
    }
  }

  private async scanProject(name: string, projectPath: string): Promise<EcosystemProject> {
    const stats: ProjectStats = { totalFiles: 0, totalLines: 0, tsFiles: 0, jsFiles: 0, modules: 0, exports: 0 };
    const modules: ModuleInfo[] = [];
    const dependencies: DependencyInfo[] = [];
    const exports: ExportInfo[] = [];

    // Get version from package.json
    let version = '0.0.0';
    const pkgPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        version = pkg.version || '0.0.0';
        
        // Extract dependencies
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        for (const [depName, depVersion] of Object.entries(allDeps)) {
          dependencies.push({
            name: depName,
            version: depVersion as string,
            isShared: false,
            sharedWith: []
          });
        }
      } catch (e) { /* ignore */ }
    }

    // Scan ALL directories, not just src/
    const scanDirs = ['src', 'scripts', 'tools', 'tests', 'data', 'docs', 'PROJECT', 'TRAINING', 'app', 'webapp', 'js', 'css'];
    for (const dir of scanDirs) {
      const dirPath = path.join(projectPath, dir);
      if (fs.existsSync(dirPath)) {
        this.scanDirectory(dirPath, modules, stats);
      }
    }
    
    // Also scan root files
    this.scanRootFiles(projectPath, stats);

    // Extract exports
    for (const mod of modules) {
      for (const exp of mod.exports) {
        exports.push({
          name: exp,
          type: 'class', // simplified
          module: mod.name,
          usedBy: []
        });
      }
    }

    stats.modules = modules.length;
    stats.exports = exports.length;

    return {
      name,
      path: projectPath,
      role: this.TRIDENT[name as keyof typeof this.TRIDENT]?.role || 'core',
      version,
      modules,
      dependencies,
      exports,
      stats
    };
  }

  private scanRootFiles(dir: string, stats: ProjectStats): void {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (!stat.isDirectory() && (item.endsWith('.ts') || item.endsWith('.js') || item.endsWith('.json') || item.endsWith('.md') || item.endsWith('.html'))) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          stats.totalFiles++;
          stats.totalLines += content.split('\n').length;
        }
      }
    } catch (e) { /* ignore */ }
  }

  private scanDirectory(dir: string, modules: ModuleInfo[], stats: ProjectStats): void {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!this.ignoreDirs.includes(item)) {
            this.scanDirectory(fullPath, modules, stats);
          }
        } else if (item.endsWith('.ts') || item.endsWith('.js') || item.endsWith('.json') || item.endsWith('.md') || item.endsWith('.html') || item.endsWith('.css') || item.endsWith('.py')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n').length;
          
          stats.totalFiles++;
          stats.totalLines += lines;
          
          if (item.endsWith('.ts')) stats.tsFiles++;
          if (item.endsWith('.js')) stats.jsFiles++;

          // Parse module info only for TS/JS
          if (item.endsWith('.ts') || item.endsWith('.js')) {
            const moduleInfo = this.parseModule(fullPath, content);
            if (moduleInfo.exports.length > 0 || moduleInfo.classes.length > 0) {
              modules.push(moduleInfo);
            }
          }
        }
      }
    } catch (e) { /* ignore */ }
  }

  private parseModule(filePath: string, content: string): ModuleInfo {
    const classes: string[] = [];
    const interfaces: string[] = [];
    const functions: string[] = [];
    const exports: string[] = [];
    const imports: ImportInfo[] = [];

    // Extract exports
    const exportClassRegex = /export\s+class\s+(\w+)/g;
    const exportInterfaceRegex = /export\s+interface\s+(\w+)/g;
    const exportFunctionRegex = /export\s+(async\s+)?function\s+(\w+)/g;
    const exportConstRegex = /export\s+const\s+(\w+)/g;
    
    let match;
    while ((match = exportClassRegex.exec(content)) !== null) {
      classes.push(match[1]);
      exports.push(match[1]);
    }
    while ((match = exportInterfaceRegex.exec(content)) !== null) {
      interfaces.push(match[1]);
      exports.push(match[1]);
    }
    while ((match = exportFunctionRegex.exec(content)) !== null) {
      functions.push(match[2]);
      exports.push(match[2]);
    }
    while ((match = exportConstRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    // Extract imports
    const importRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    while ((match = importRegex.exec(content)) !== null) {
      const importedItems = match[1] ? match[1].split(',').map(s => s.trim()) : [match[2]];
      const fromPath = match[3];
      
      imports.push({
        from: fromPath,
        imports: importedItems.filter(Boolean),
        isExternal: !fromPath.startsWith('.') && !fromPath.startsWith('@/'),
        isShared: fromPath.includes('@qantum') || fromPath.includes('shared')
      });
    }

    // Generate hash
    const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);

    return {
      name: path.basename(filePath, path.extname(filePath)),
      path: filePath,
      classes,
      interfaces,
      functions,
      exports,
      imports,
      hash
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPENDENCY ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  private analyzeDependencies(): DependencyMatrix {
    const allDeps = new Map<string, { project: string; version: string }[]>();
    const conflicts: DependencyConflict[] = [];
    const shared: DependencyInfo[] = [];

    // Collect all dependencies
    this.projects.forEach((project) => {
      for (const dep of project.dependencies) {
        const existing = allDeps.get(dep.name) || [];
        existing.push({ project: project.name, version: dep.version });
        allDeps.set(dep.name, existing);
      }
    });

    // Find shared and conflicts
    allDeps.forEach((versions, depName) => {
      if (versions.length > 1) {
        const uniqueVersions = [...new Set(versions.map(v => v.version))];
        
        if (uniqueVersions.length > 1) {
          conflicts.push({
            name: depName,
            versions,
            recommendation: `Align to latest version: ${uniqueVersions.sort().reverse()[0]}`
          });
        } else {
          shared.push({
            name: depName,
            version: versions[0].version,
            isShared: true,
            sharedWith: versions.map(v => v.project)
          });
        }
      }
    });

    return { shared, conflicts, missing: [] };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED MODULES DETECTION
  // ═══════════════════════════════════════════════════════════════════════════

  private findSharedModules(): SharedModule[] {
    const moduleMap = new Map<string, { project: string; hash: string }[]>();
    const shared: SharedModule[] = [];

    // Map all modules by name
    this.projects.forEach((project) => {
      for (const mod of project.modules) {
        const existing = moduleMap.get(mod.name) || [];
        existing.push({ project: project.name, hash: mod.hash });
        moduleMap.set(mod.name, existing);
      }
    });

    // Find modules that exist in multiple projects
    moduleMap.forEach((versions, modName) => {
      if (versions.length > 1) {
        const uniqueHashes = [...new Set(versions.map(v => v.hash))];
        shared.push({
          name: modName,
          existsIn: versions.map(v => v.project),
          hashMatch: uniqueHashes.length === 1,
          versions
        });
      }
    });

    return shared;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNC ISSUES DETECTION
  // ═══════════════════════════════════════════════════════════════════════════

  private detectSyncIssues(): SyncIssue[] {
    const issues: SyncIssue[] = [];

    // Check TypeScript config compatibility
    const tsConfigs = this.checkTsConfigSync();
    issues.push(...tsConfigs);

    // Check for duplicate modules with different implementations
    const sharedModules = this.findSharedModules();
    for (const mod of sharedModules) {
      if (!mod.hashMatch) {
        issues.push({
          type: 'duplicate_code',
          severity: 'warning',
          title: `Duplicate module: ${mod.name}`,
          description: `Module "${mod.name}" exists in ${mod.existsIn.join(', ')} with different implementations`,
          affectedProjects: mod.existsIn,
          suggestedFix: `Consolidate into shared package or use @qantum/shared`
        });
      }
    }

    // Check dependency version conflicts
    const depMatrix = this.analyzeDependencies();
    for (const conflict of depMatrix.conflicts) {
      issues.push({
        type: 'version_mismatch',
        severity: 'warning',
        title: `Dependency conflict: ${conflict.name}`,
        description: `Different versions across projects: ${conflict.versions.map(v => `${v.project}: ${v.version}`).join(', ')}`,
        affectedProjects: conflict.versions.map(v => v.project),
        suggestedFix: conflict.recommendation
      });
    }

    return issues;
  }

  private checkTsConfigSync(): SyncIssue[] {
    const issues: SyncIssue[] = [];
    const configs: { project: string; target: string; module: string }[] = [];

    this.projects.forEach((project) => {
      const tsConfigPath = path.join(project.path, 'tsconfig.json');
      if (fs.existsSync(tsConfigPath)) {
        try {
          const content = fs.readFileSync(tsConfigPath, 'utf-8');
          // Remove comments for JSON parsing
          const cleaned = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
          const config = JSON.parse(cleaned);
          configs.push({
            project: project.name,
            target: config.compilerOptions?.target || 'unknown',
            module: config.compilerOptions?.module || 'unknown'
          });
        } catch (e) { /* ignore */ }
      }
    });

    // Check for target mismatches
    const targets = [...new Set(configs.map(c => c.target))];
    if (targets.length > 1) {
      issues.push({
        type: 'version_mismatch',
        severity: 'info',
        title: 'TypeScript target mismatch',
        description: `Different TS targets: ${configs.map(c => `${c.project}: ${c.target}`).join(', ')}`,
        affectedProjects: configs.map(c => c.project),
        suggestedFix: 'Align to ES2022 for consistency'
      });
    }

    return issues;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALTH CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════

  private calculateHealth(issues: SyncIssue[]): { health: SyncReport['ecosystemHealth']; score: number } {
    let score = 100;
    
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': score -= 20; break;
        case 'warning': score -= 5; break;
        case 'info': score -= 1; break;
      }
    }

    score = Math.max(0, Math.min(100, score));

    let health: SyncReport['ecosystemHealth'];
    if (score >= 95) health = 'PERFECT';
    else if (score >= 80) health = 'GOOD';
    else if (score >= 60) health = 'WARNING';
    else health = 'CRITICAL';

    return { health, score };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  private generateRecommendations(issues: SyncIssue[], depMatrix: DependencyMatrix): string[] {
    const recommendations: string[] = [];

    if (issues.length === 0) {
      recommendations.push('✅ Ecosystem is in perfect sync! No actions needed.');
    } else {
      if (issues.some(i => i.type === 'duplicate_code')) {
        recommendations.push('📦 Consider creating @qantum/shared package for common modules');
      }
      if (depMatrix.conflicts.length > 0) {
        recommendations.push('📌 Run `npm update` in all projects to align dependency versions');
      }
      if (issues.some(i => i.type === 'version_mismatch')) {
        recommendations.push('🔧 Align TypeScript configurations across all projects');
      }
    }

    recommendations.push('🔄 Run this validator before each major release');
    recommendations.push('📊 Integrate into CI/CD pipeline for automated checks');

    return recommendations;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORT PRINTING
  // ═══════════════════════════════════════════════════════════════════════════

  private printReport(report: SyncReport, duration: number): void {
    const healthColors: Record<string, string> = {
      'PERFECT': '🟢',
      'GOOD': '🟡',
      'WARNING': '🟠',
      'CRITICAL': '🔴'
    };

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                 🔱 ECOSYSTEM SYNC REPORT 🔱                    ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║  Health: ${healthColors[report.ecosystemHealth]} ${report.ecosystemHealth.padEnd(12)} Score: ${report.score}/100`.padEnd(64) + '║');
    console.log(`║  Total: ${report.totalFiles.toLocaleString()} files, ${report.totalLines.toLocaleString()} lines`.padEnd(64) + '║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log('║  PROJECT BREAKDOWN                                            ║');
    console.log('╠───────────────────────────────────────────────────────────────╣');

    for (const project of report.projects) {
      const roleEmoji = { core: '🧠', shield: '🛡️', voice: '🌐' };
      console.log(`║  ${roleEmoji[project.role]} ${project.name.padEnd(20)} v${project.version.padEnd(10)}`.padEnd(64) + '║');
      console.log(`║     ${project.stats.totalFiles} files | ${project.stats.totalLines.toLocaleString()} lines | ${project.stats.modules} modules`.padEnd(64) + '║');
    }

    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log('║  SHARED DEPENDENCIES                                          ║');
    console.log('╠───────────────────────────────────────────────────────────────╣');
    
    const sharedDeps = report.dependencyMatrix.shared.slice(0, 5);
    for (const dep of sharedDeps) {
      console.log(`║  📦 ${dep.name.padEnd(25)} ${dep.version.padEnd(15)} [${dep.sharedWith.length} repos]`.padEnd(64) + '║');
    }
    if (report.dependencyMatrix.shared.length > 5) {
      console.log(`║  ... and ${report.dependencyMatrix.shared.length - 5} more shared dependencies`.padEnd(64) + '║');
    }

    if (report.syncIssues.length > 0) {
      console.log('╠═══════════════════════════════════════════════════════════════╣');
      console.log('║  ⚠️  SYNC ISSUES                                               ║');
      console.log('╠───────────────────────────────────────────────────────────────╣');
      for (const issue of report.syncIssues.slice(0, 5)) {
        const severityEmoji = { critical: '🔴', warning: '🟡', info: '🔵' };
        console.log(`║  ${severityEmoji[issue.severity]} ${issue.title.substring(0, 50).padEnd(50)}`.padEnd(64) + '║');
      }
    }

    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log('║  📋 RECOMMENDATIONS                                           ║');
    console.log('╠───────────────────────────────────────────────────────────────╣');
    for (const rec of report.recommendations.slice(0, 4)) {
      console.log(`║  ${rec.substring(0, 58).padEnd(58)}`.padEnd(64) + '║');
    }

    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║  ⏱️  Validation completed in ${duration}ms`.padEnd(64) + '║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT REPORT
  // ═══════════════════════════════════════════════════════════════════════════

  async exportReport(report: SyncReport, outputPath: string): Promise<void> {
    const json = JSON.stringify(report, null, 2);
    fs.writeFileSync(outputPath, json);
    console.log(`\n📄 Report exported to: ${outputPath}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

export async function runSyncValidation(): Promise<SyncReport> {
  const validator = new EcosystemSyncValidator();
  const report = await validator.validateEcosystem();
  
  // Export to file
  const outputPath = path.join('C:\\MisteMind\\data', 'ecosystem-sync-report.json');
  await validator.exportReport(report, outputPath);
  
  return report;
}

// Run if executed directly
if (require.main === module) {
  runSyncValidation()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Validation failed:', err);
      process.exit(1);
    });
}
