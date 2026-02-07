#!/usr/bin/env node
/**
 * 🚀 PHASE 3: INTEGRATION IN QANTUM
 * 
 * Integrates analyzed modules into QAntum:
 * 1. Extracts TOP 50 most valuable modules
 * 2. Integrates into OmniCore
 * 3. Creates @qantum/core-utils shared library
 * 4. Generates training dataset for code-gen models
 */

import * as fs from 'fs';
import * as path from 'path';

interface ModuleValue {
  file: string;
  score: number;
  category: string;
  complexity: number;
  dependencies: number;
  exports: number;
  reusability: number;
}

interface IntegrationPlan {
  topModules: ModuleValue[];
  omniCoreIntegrations: string[];
  sharedLibraryModules: string[];
  trainingDataset: TrainingExample[];
}

interface TrainingExample {
  input: string;
  output: string;
  category: string;
  metadata: {
    complexity: number;
    language: string;
    pattern: string;
  };
}

class QAntumIntegrator {
  private taxonomyPath: string;
  private docsPath: string;
  private patternsPath: string;
  private taxonomy: any;
  private documentation: any[];
  private patterns: any[];

  constructor(analysisDir: string) {
    this.taxonomyPath = path.join(analysisDir, 'TAXONOMY.json');
    this.docsPath = path.join(analysisDir, 'auto-documentation.json');
    this.patternsPath = path.join(analysisDir, 'architectural-patterns.json');
    
    this.loadAnalysisData();
  }

  /**
   * Load analysis data
   */
  private loadAnalysisData(): void {
    if (fs.existsSync(this.taxonomyPath)) {
      this.taxonomy = JSON.parse(fs.readFileSync(this.taxonomyPath, 'utf-8'));
    } else {
      this.taxonomy = {};
    }

    if (fs.existsSync(this.docsPath)) {
      this.documentation = JSON.parse(fs.readFileSync(this.docsPath, 'utf-8'));
    } else {
      this.documentation = [];
    }

    if (fs.existsSync(this.patternsPath)) {
      this.patterns = JSON.parse(fs.readFileSync(this.patternsPath, 'utf-8'));
    } else {
      this.patterns = [];
    }

    console.log('✅ Analysis data loaded');
  }

  /**
   * Calculate module value score
   */
  private calculateModuleValue(doc: any): ModuleValue {
    // Scoring factors:
    // 1. Reusability (exports / dependencies ratio)
    // 2. Category importance (security, ai_core > other)
    // 3. Complexity (moderate complexity is good, too high/low is bad)
    // 4. Pattern usage (modules using recognized patterns score higher)

    const exportCount = doc.exports?.length || 0;
    const depCount = doc.dependencies?.length || 0;
    const complexity = doc.complexity || 1;

    // Reusability score
    const reusability = depCount === 0 ? exportCount : exportCount / (depCount + 1);

    // Category importance
    const categoryScores: { [key: string]: number } = {
      security: 10,
      ai_core: 9,
      swarm: 8,
      cognitive: 8,
      enterprise: 7,
      healing: 7,
      infrastructure: 6,
      quantum: 6,
      test_automation: 5,
      compliance: 5,
      visualization: 4,
      integration: 4,
      economy: 3,
      other: 1
    };
    const categoryScore = categoryScores[doc.category] || 1;

    // Complexity score (sweet spot is 10-50)
    let complexityScore = 1;
    if (complexity >= 10 && complexity <= 50) {
      complexityScore = 2;
    } else if (complexity > 50) {
      complexityScore = 1.5;
    }

    // Pattern bonus
    let patternBonus = 0;
    for (const pattern of this.patterns) {
      if (pattern.files.includes(doc.file)) {
        patternBonus += pattern.confidence;
      }
    }

    // Calculate final score
    const score = (categoryScore * 2) + 
                  (reusability * 3) + 
                  (complexityScore * 2) + 
                  (patternBonus * 5);

    return {
      file: doc.file,
      score,
      category: doc.category,
      complexity,
      dependencies: depCount,
      exports: exportCount,
      reusability
    };
  }

  /**
   * Extract TOP 50 most valuable modules
   */
  public extractTopModules(topN: number = 50): ModuleValue[] {
    console.log('🎯 Extracting top valuable modules...');

    const moduleValues = this.documentation.map(doc => this.calculateModuleValue(doc));
    
    // Sort by score descending
    moduleValues.sort((a, b) => b.score - a.score);

    const topModules = moduleValues.slice(0, topN);

    console.log(`✅ Extracted top ${topModules.length} modules`);
    return topModules;
  }

  /**
   * Identify modules for OmniCore integration
   */
  public identifyOmniCoreModules(topModules: ModuleValue[]): string[] {
    console.log('🧠 Identifying OmniCore integration candidates...');

    // OmniCore should get: security, AI core, swarm intelligence, cognitive
    const omniCoreCategories = ['security', 'ai_core', 'swarm', 'cognitive', 'neural'];
    
    const omniCoreModules = topModules
      .filter(m => omniCoreCategories.some(cat => m.category.includes(cat)))
      .map(m => m.file)
      .slice(0, 20); // Top 20 for OmniCore

    console.log(`✅ Selected ${omniCoreModules.length} modules for OmniCore`);
    return omniCoreModules;
  }

  /**
   * Identify modules for shared library
   */
  public identifySharedLibraryModules(topModules: ModuleValue[]): string[] {
    console.log('📦 Identifying shared library modules...');

    // Shared library should have high reusability, low dependencies
    const sharedLibModules = topModules
      .filter(m => m.reusability > 2 && m.dependencies < 5)
      .map(m => m.file)
      .slice(0, 30); // Top 30 for shared library

    console.log(`✅ Selected ${sharedLibModules.length} modules for shared library`);
    return sharedLibModules;
  }

  /**
   * Generate training dataset for code-gen models
   */
  public generateTrainingDataset(topModules: ModuleValue[]): TrainingExample[] {
    console.log('🤖 Generating training dataset...');

    const trainingExamples: TrainingExample[] = [];

    topModules.forEach(moduleValue => {
      const doc = this.documentation.find(d => d.file === moduleValue.file);
      if (!doc || !fs.existsSync(moduleValue.file)) return;

      const content = fs.readFileSync(moduleValue.file, 'utf-8');
      const fileName = path.basename(moduleValue.file);
      const ext = path.extname(fileName);
      
      // Extract functions/classes from content
      const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*{([^}]+)}/g;
      const classRegex = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?\s*{([^}]+)}/g;
      
      let match;
      
      // Functions
      while ((match = functionRegex.exec(content)) !== null) {
        const functionName = match[1];
        const functionBody = match[2].substring(0, 200); // First 200 chars
        
        trainingExamples.push({
          input: `Create a function named ${functionName} in ${doc.category} category`,
          output: match[0].substring(0, 500), // Limit output size
          category: doc.category,
          metadata: {
            complexity: moduleValue.complexity,
            language: ext === '.ts' ? 'TypeScript' : ext === '.js' ? 'JavaScript' : 'Other',
            pattern: this.findPattern(moduleValue.file)
          }
        });
      }

      // Classes
      while ((match = classRegex.exec(content)) !== null) {
        const className = match[1];
        
        trainingExamples.push({
          input: `Create a class named ${className} for ${doc.purpose}`,
          output: match[0].substring(0, 500), // Limit output size
          category: doc.category,
          metadata: {
            complexity: moduleValue.complexity,
            language: ext === '.ts' ? 'TypeScript' : ext === '.js' ? 'JavaScript' : 'Other',
            pattern: this.findPattern(moduleValue.file)
          }
        });
      }

      // Also add module-level example
      trainingExamples.push({
        input: `Implement ${doc.description} for ${doc.purpose}`,
        output: content.substring(0, 1000), // First 1000 chars of module
        category: doc.category,
        metadata: {
          complexity: moduleValue.complexity,
          language: ext === '.ts' ? 'TypeScript' : ext === '.js' ? 'JavaScript' : 'Other',
          pattern: this.findPattern(moduleValue.file)
        }
      });
    });

    console.log(`✅ Generated ${trainingExamples.length} training examples`);
    return trainingExamples;
  }

  /**
   * Find architectural pattern for file
   */
  private findPattern(filePath: string): string {
    for (const pattern of this.patterns) {
      if (pattern.files.includes(filePath)) {
        return pattern.name;
      }
    }
    return 'None';
  }

  /**
   * Create @qantum/core-utils package structure
   */
  public createSharedLibraryStructure(modules: string[], outputDir: string): void {
    console.log('📦 Creating @qantum/core-utils structure...');

    const libDir = path.join(outputDir, 'qantum-core-utils');
    
    // Create directory structure
    const dirs = [
      libDir,
      path.join(libDir, 'src'),
      path.join(libDir, 'src', 'security'),
      path.join(libDir, 'src', 'ai'),
      path.join(libDir, 'src', 'utils'),
      path.join(libDir, 'src', 'swarm'),
      path.join(libDir, 'dist')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Create package.json
    const packageJson = {
      name: '@qantum/core-utils',
      version: '1.0.0',
      description: 'QAntum Core Utilities - Shared library of reusable modules',
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      scripts: {
        build: 'tsc',
        test: 'jest',
        prepublishOnly: 'npm run build'
      },
      keywords: [
        'qantum',
        'ai',
        'testing',
        'automation',
        'security',
        'utilities'
      ],
      author: 'QAntum Team',
      license: 'MIT',
      devDependencies: {
        typescript: '^5.0.0',
        '@types/node': '^20.0.0',
        jest: '^29.0.0'
      },
      peerDependencies: {},
      files: [
        'dist/',
        'README.md',
        'LICENSE'
      ]
    };

    fs.writeFileSync(
      path.join(libDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        declaration: true,
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };

    fs.writeFileSync(
      path.join(libDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );

    // Create README
    const readme = `# @qantum/core-utils

Shared library of core utilities extracted from QAntum framework.

## Installation

\`\`\`bash
npm install @qantum/core-utils
\`\`\`

## Usage

\`\`\`typescript
import { SecurityUtils, AICore, SwarmUtils } from '@qantum/core-utils';
\`\`\`

## Modules

This library contains ${modules.length} highly reusable modules extracted from the QAntum ecosystem.

## License

MIT
`;

    fs.writeFileSync(path.join(libDir, 'README.md'), readme);

    // Create index.ts
    const indexContent = `/**
 * @qantum/core-utils
 * 
 * Shared library of core utilities from QAntum
 */

// Export modules here
export * from './security';
export * from './ai';
export * from './utils';
export * from './swarm';
`;

    fs.writeFileSync(path.join(libDir, 'src', 'index.ts'), indexContent);

    console.log(`✅ Created @qantum/core-utils structure at ${libDir}`);
  }

  /**
   * Generate OmniCore integration guide
   */
  public generateOmniCoreGuide(modules: string[], outputDir: string): void {
    const guidePath = path.join(outputDir, 'OMNICORE-INTEGRATION-GUIDE.md');
    
    const lines: string[] = [];
    lines.push('# 🧠 OmniCore Integration Guide');
    lines.push('');
    lines.push('## Overview');
    lines.push('');
    lines.push(`This guide describes integration of ${modules.length} high-value modules into OmniCore.`);
    lines.push('');
    lines.push('## Modules for Integration');
    lines.push('');
    
    modules.forEach((file, idx) => {
      const doc = this.documentation.find(d => d.file === file);
      lines.push(`### ${idx + 1}. ${path.basename(file)}`);
      if (doc) {
        lines.push(`- **Category**: ${doc.category}`);
        lines.push(`- **Purpose**: ${doc.purpose}`);
        lines.push(`- **Exports**: ${doc.exports.join(', ')}`);
        lines.push('');
      }
    });

    lines.push('## Integration Steps');
    lines.push('');
    lines.push('1. Review module dependencies');
    lines.push('2. Create integration points in OmniCore');
    lines.push('3. Update imports and exports');
    lines.push('4. Run integration tests');
    lines.push('5. Update documentation');
    
    fs.writeFileSync(guidePath, lines.join('\n'));
    console.log(`✅ Generated OmniCore integration guide at ${guidePath}`);
  }

  /**
   * Run full integration process
   */
  public integrate(outputDir: string): IntegrationPlan {
    console.log('🚀 Starting QAntum Integration...');
    console.log('');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Step 1: Extract top modules
    const topModules = this.extractTopModules(50);

    // Step 2: Identify OmniCore modules
    const omniCoreModules = this.identifyOmniCoreModules(topModules);

    // Step 3: Identify shared library modules
    const sharedLibModules = this.identifySharedLibraryModules(topModules);

    // Step 4: Generate training dataset
    const trainingDataset = this.generateTrainingDataset(topModules);

    // Step 5: Create shared library structure
    this.createSharedLibraryStructure(sharedLibModules, outputDir);

    // Step 6: Generate OmniCore guide
    this.generateOmniCoreGuide(omniCoreModules, outputDir);

    const plan: IntegrationPlan = {
      topModules,
      omniCoreIntegrations: omniCoreModules,
      sharedLibraryModules: sharedLibModules,
      trainingDataset
    };

    return plan;
  }

  /**
   * Save integration plan
   */
  public saveIntegrationPlan(plan: IntegrationPlan, outputDir: string): void {
    // Save full plan
    const planPath = path.join(outputDir, 'integration-plan.json');
    fs.writeFileSync(planPath, JSON.stringify({
      topModules: plan.topModules,
      omniCoreIntegrations: plan.omniCoreIntegrations,
      sharedLibraryModules: plan.sharedLibraryModules,
      trainingDatasetSize: plan.trainingDataset.length
    }, null, 2));
    console.log(`✅ Integration plan saved to ${planPath}`);

    // Save training dataset
    const datasetPath = path.join(outputDir, 'training-dataset.jsonl');
    const datasetLines = plan.trainingDataset.map(ex => JSON.stringify(ex));
    fs.writeFileSync(datasetPath, datasetLines.join('\n'));
    console.log(`✅ Training dataset saved to ${datasetPath}`);

    // Save summary
    const summaryPath = path.join(outputDir, 'integration-summary.txt');
    const summary = this.generateSummary(plan);
    fs.writeFileSync(summaryPath, summary);
    console.log(`✅ Summary saved to ${summaryPath}`);
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(plan: IntegrationPlan): string {
    const lines: string[] = [];
    
    lines.push('🚀 QANTUM INTEGRATION PLAN');
    lines.push('═'.repeat(60));
    lines.push('');
    
    lines.push('📊 OVERVIEW:');
    lines.push(`  Top Modules Analyzed: ${plan.topModules.length}`);
    lines.push(`  OmniCore Integrations: ${plan.omniCoreIntegrations.length}`);
    lines.push(`  Shared Library Modules: ${plan.sharedLibraryModules.length}`);
    lines.push(`  Training Examples: ${plan.trainingDataset.length}`);
    lines.push('');
    
    lines.push('🏆 TOP 10 MOST VALUABLE MODULES:');
    plan.topModules.slice(0, 10).forEach((module, idx) => {
      lines.push(`  ${idx + 1}. ${path.basename(module.file)} (Score: ${module.score.toFixed(2)})`);
      lines.push(`     Category: ${module.category}, Complexity: ${module.complexity}, Reusability: ${module.reusability.toFixed(2)}`);
    });
    lines.push('');
    
    lines.push('🧠 OMNICORE INTEGRATION CANDIDATES:');
    plan.omniCoreIntegrations.slice(0, 10).forEach((file, idx) => {
      lines.push(`  ${idx + 1}. ${path.basename(file)}`);
    });
    lines.push('');
    
    lines.push('📦 SHARED LIBRARY MODULES:');
    const categoryCount = new Map<string, number>();
    plan.topModules.forEach(m => {
      categoryCount.set(m.category, (categoryCount.get(m.category) || 0) + 1);
    });
    categoryCount.forEach((count, category) => {
      lines.push(`  ${category}: ${count} modules`);
    });
    lines.push('');
    
    lines.push('🤖 TRAINING DATASET STATISTICS:');
    const langCount = new Map<string, number>();
    plan.trainingDataset.forEach(ex => {
      const lang = ex.metadata.language;
      langCount.set(lang, (langCount.get(lang) || 0) + 1);
    });
    langCount.forEach((count, lang) => {
      lines.push(`  ${lang}: ${count} examples`);
    });
    
    return lines.join('\n');
  }
}

// Main execution
if (require.main === module) {
  const analysisDir = process.argv[2] || path.join(process.cwd(), 'analysis-output');
  const outputDir = process.argv[3] || analysisDir;

  console.log('🚀 Starting QAntum Integration...');
  console.log(`📁 Analysis Directory: ${analysisDir}`);
  console.log(`📁 Output Directory: ${outputDir}`);
  console.log('');

  const integrator = new QAntumIntegrator(analysisDir);
  const plan = integrator.integrate(outputDir);
  
  console.log('');
  console.log('💾 Saving integration plan...');
  integrator.saveIntegrationPlan(plan, outputDir);
  
  console.log('');
  console.log('✨ Integration complete!');
  console.log(`🏆 Selected ${plan.topModules.length} top modules`);
  console.log(`🧠 ${plan.omniCoreIntegrations.length} modules for OmniCore`);
  console.log(`📦 ${plan.sharedLibraryModules.length} modules for shared library`);
  console.log(`🤖 ${plan.trainingDataset.length} training examples generated`);
}

export { QAntumIntegrator, IntegrationPlan, ModuleValue, TrainingExample };
