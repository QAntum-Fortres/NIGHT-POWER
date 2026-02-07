/**
 * ⚛️ DOC GENERATOR - DEMO
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Демонстрация на Self-Generating Documentation Engine
 * 
 * @author DIMITAR PRODROMOV
 * @version 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { DocGenerator } from './index';
import { TypeScriptAnalyzer } from './typescript-analyzer';
import { OpenAPIGenerator } from './openapi-generator';
import { MarkdownBuilder } from './markdown-builder';
import { ChangelogTracker } from './changelog-tracker';

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

async function demo() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('📚 SELF-GENERATING DOCUMENTATION ENGINE - DEMO');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Initialize Doc Generator
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('📦 [1/5] Initializing Doc Generator...');
  const docGen = new DocGenerator({
    projectName: 'QAntum',
    version: '1.0.0',
    author: 'DIMITAR PRODROMOV',
    sourcePaths: ['./src'],
    outputPath: './docs',
    generateJSDoc: true,
    generateOpenAPI: true,
    generateReadme: true,
    generateChangelog: true,
    language: 'bilingual'
  });
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. TypeScript Analysis
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('🔍 [2/5] TypeScript Analyzer Demo');
  console.log('─────────────────────────────────────────────');
  
  const analyzer = new TypeScriptAnalyzer();
  const analysis = await analyzer.analyzeDirectory('./src');
  
  console.log(`Files processed: ${analysis.filesProcessed}`);
  console.log(`Functions found: ${analysis.functions.length}`);
  console.log(`Classes found: ${analysis.classes.length}`);
  console.log(`Interfaces found: ${analysis.interfaces.length}`);
  console.log(`Endpoints found: ${analysis.endpoints.length}`);
  console.log(`Exports found: ${analysis.exports.length}`);
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. OpenAPI Generation
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('🌐 [3/5] OpenAPI Generator Demo');
  console.log('─────────────────────────────────────────────');
  
  const openApiGen = new OpenAPIGenerator({
    projectName: 'QAntum',
    version: '1.0.0',
    author: 'DIMITAR PRODROMOV'
  });
  
  const openApiSpec = openApiGen.generate(analysis.endpoints, analysis.interfaces);
  
  console.log(`OpenAPI version: ${openApiSpec.openapi}`);
  console.log(`Paths generated: ${Object.keys(openApiSpec.paths).length}`);
  console.log(`Schemas generated: ${Object.keys(openApiSpec.components.schemas).length}`);
  console.log(`Tags: ${openApiSpec.tags.map(t => t.name).join(', ')}`);
  console.log('');

  // Preview YAML output
  console.log('OpenAPI YAML Preview:');
  console.log('───────────────────────');
  const yamlPreview = openApiGen.toYAML(openApiSpec).split('\n').slice(0, 15).join('\n');
  console.log(yamlPreview);
  console.log('... (truncated)');
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Markdown Generation
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('📖 [4/5] Markdown Builder Demo');
  console.log('─────────────────────────────────────────────');
  
  const mdBuilder = new MarkdownBuilder({
    projectName: 'QAntum',
    version: '1.0.0',
    author: 'DIMITAR PRODROMOV',
    language: 'bilingual'
  });

  const header = mdBuilder.buildHeader('QAntum', '1.0.0');
  const badges = mdBuilder.buildBadges();
  
  console.log('README Header Preview:');
  console.log('───────────────────────');
  console.log(header.split('\n').slice(0, 5).join('\n'));
  console.log('');
  console.log('Badges:');
  console.log(badges.split('\n').slice(0, 3).join('\n'));
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Changelog Generation
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('📋 [5/5] Changelog Tracker Demo');
  console.log('─────────────────────────────────────────────');
  
  const changelogTracker = new ChangelogTracker();
  const changelog = await changelogTracker.generate('1.0.0');
  
  console.log('Changelog Preview:');
  console.log('───────────────────────');
  console.log(changelog.split('\n').slice(0, 20).join('\n'));
  console.log('... (truncated)');
  console.log('');

  // Version recommendation
  const nextVersion = changelogTracker.recommendVersion('1.0.0');
  console.log(`Recommended next version: ${nextVersion}`);
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('🚀 FULL DOCUMENTATION GENERATION');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');

  const result = await docGen.generate();

  console.log('📊 GENERATION STATS');
  console.log('─────────────────────────────────────────────');
  console.log(`Files analyzed: ${result.stats.filesAnalyzed}`);
  console.log(`Functions documented: ${result.stats.functionsDocumented}`);
  console.log(`Classes documented: ${result.stats.classesDocumented}`);
  console.log(`Interfaces documented: ${result.stats.interfacesDocumented}`);
  console.log(`Endpoints documented: ${result.stats.endpointsDocumented}`);
  console.log(`Total lines generated: ${result.stats.totalLinesGenerated}`);
  console.log(`Generation time: ${result.stats.generationTime}ms`);
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('✅ SELF-GENERATING DOCUMENTATION ENGINE - DEMO COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log('📁 Generated outputs:');
  console.log('   • JSDoc comments for all functions/classes');
  console.log('   • OpenAPI 3.0 specification (openapi.yaml)');
  console.log('   • README.md with full documentation');
  console.log('   • CHANGELOG.md with version history');
  console.log('');
  console.log('🎯 "Документацията се пише сама. Кодът разказва историята си."');
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TEST
// ═══════════════════════════════════════════════════════════════════════════════

async function integrationTest() {
  console.log('');
  console.log('🧪 Running Integration Tests...');
  console.log('');

  const tests = [
    {
      name: 'DocGenerator initialization',
      test: () => {
        const gen = new DocGenerator({ projectName: 'Test' });
        return gen !== null;
      }
    },
    {
      name: 'TypeScriptAnalyzer analysis',
      test: async () => {
        const analyzer = new TypeScriptAnalyzer();
        const result = await analyzer.analyzeDirectory('./src');
        return result.filesProcessed >= 0;
      }
    },
    {
      name: 'OpenAPIGenerator spec generation',
      test: () => {
        const gen = new OpenAPIGenerator({ projectName: 'Test', version: '1.0.0', author: 'Test' });
        const spec = gen.generate([], []);
        return spec.openapi === '3.0.0';
      }
    },
    {
      name: 'MarkdownBuilder header',
      test: () => {
        const builder = new MarkdownBuilder({ projectName: 'Test', version: '1.0.0', author: 'Test', language: 'en' });
        const header = builder.buildHeader('Test', '1.0.0');
        return header.includes('Test');
      }
    },
    {
      name: 'ChangelogTracker generation',
      test: async () => {
        const tracker = new ChangelogTracker();
        const changelog = await tracker.generate('1.0.0');
        return changelog.includes('Changelog');
      }
    },
    {
      name: 'Full documentation generation',
      test: async () => {
        const gen = new DocGenerator({ projectName: 'Test', version: '1.0.0' });
        const result = await gen.generate();
        return result.stats.generationTime > 0;
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      const result = await t.test();
      if (result) {
        console.log(`  ✅ ${t.name}`);
        passed++;
      } else {
        console.log(`  ❌ ${t.name} - returned false`);
        failed++;
      }
    } catch (err) {
      console.log(`  ❌ ${t.name} - ${(err as Error).message}`);
      failed++;
    }
  }

  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('');
  
  return failed === 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════════

export { demo, integrationTest };

if (require.main === module) {
  (async () => {
    await demo();
    await integrationTest();
  })();
}
