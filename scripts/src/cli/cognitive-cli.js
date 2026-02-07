#!/usr/bin/env node

/**
 * 🧠 COGNITIVE CLI - Self-Writing Tests Interface
 * 
 * Command-line interface for the Cognitive Evolution system:
 * - explore: Autonomous site discovery
 * - generate: Auto-create tests from sitemap
 * - heal: Self-healing management
 * - anchor: Cognitive anchor operations
 * 
 * "QANTUM writes its own tests!"
 * 
 * @version 1.0.0
 * @phase 81-90
 */

const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');

// ASCII Art Banner
const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.magenta('🧠 QANTUM - COGNITIVE CLI')}                              ${chalk.cyan('║')}
${chalk.cyan('║')}                                                               ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.yellow('"Tests that write themselves"')}                               ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════════╝')}
`;

program
    .name('mind-cognitive')
    .description('Cognitive Evolution CLI - Autonomous Test Generation')
    .version('1.0.0');

// ============================================================
// EXPLORE COMMAND
// ============================================================
program
    .command('explore <url>')
    .description('🗺️  Autonomously explore and map a website')
    .option('-p, --pages <number>', 'Maximum pages to explore', '100')
    .option('-d, --depth <number>', 'Maximum crawl depth', '5')
    .option('-w, --workers <number>', 'Parallel workers', '4')
    .option('-o, --output <dir>', 'Output directory', './exploration-data')
    .option('--no-screenshots', 'Disable screenshots')
    .option('--headed', 'Run browser in headed mode')
    .action(async (url, options) => {
        console.log(banner);
        console.log(chalk.bold('\n🗺️  AUTONOMOUS EXPLORATION\n'));
        
        const spinner = ora('Initializing explorer...').start();

        try {
            // Dynamic import for ES modules compatibility
            const { AutonomousExplorer } = await import('../src/cognitive/autonomous-explorer.js');

            const explorer = new AutonomousExplorer({
                maxPages: parseInt(options.pages),
                maxDepth: parseInt(options.depth),
                parallelWorkers: parseInt(options.workers),
                outputDir: options.output,
                takeScreenshots: options.screenshots,
                headless: !options.headed
            });

            spinner.text = `Exploring ${url}...`;

            // Progress events
            explorer.on('page:crawled', (page) => {
                spinner.text = `Explored: ${page.title || page.url} (${page.forms.length} forms)`;
            });

            const siteMap = await explorer.explore(url);

            spinner.succeed(chalk.green('Exploration complete!'));

            // Print summary
            console.log('\n' + chalk.cyan('═'.repeat(60)));
            console.log(chalk.bold('📊 EXPLORATION SUMMARY'));
            console.log(chalk.cyan('═'.repeat(60)));
            console.log(`  ${chalk.yellow('Pages discovered:')} ${siteMap.totalPages}`);
            console.log(`  ${chalk.yellow('Forms found:')} ${siteMap.totalForms}`);
            console.log(`  ${chalk.yellow('API endpoints:')} ${siteMap.totalApiEndpoints}`);
            console.log(`  ${chalk.yellow('Transaction flows:')} ${siteMap.transactionFlows.length}`);
            console.log(`  ${chalk.yellow('Output:')} ${options.output}/sitemap.json`);
            console.log(chalk.cyan('═'.repeat(60)));

            // Authentication info
            if (siteMap.authentication) {
                console.log('\n' + chalk.bold('🔐 AUTHENTICATION DETECTED'));
                console.log(`  Login URL: ${siteMap.authentication.loginUrl}`);
                console.log(`  Username field: ${siteMap.authentication.usernameField}`);
                console.log(`  Password field: ${siteMap.authentication.passwordField}`);
            }

            // Transaction flows
            if (siteMap.transactionFlows.length > 0) {
                console.log('\n' + chalk.bold('🔄 TRANSACTION FLOWS'));
                for (const flow of siteMap.transactionFlows) {
                    console.log(`  • ${flow.name}: ${flow.steps.length} steps (${flow.businessPurpose})`);
                }
            }

        } catch (error) {
            spinner.fail(chalk.red('Exploration failed'));
            console.error(chalk.red(error.message));
            process.exit(1);
        }
    });

// ============================================================
// GENERATE COMMAND
// ============================================================
program
    .command('generate [sitemap]')
    .description('🏭 Generate tests from sitemap')
    .option('-s, --sitemap <path>', 'Path to sitemap.json', './exploration-data/sitemap.json')
    .option('-o, --output <dir>', 'Output directory', './generated_tests')
    .option('--ghost', 'Generate Ghost-API tests only')
    .option('--playwright', 'Generate Playwright tests only')
    .option('--api', 'Generate API tests only')
    .option('--e2e', 'Generate E2E tests only')
    .option('--ts', 'Generate TypeScript (default)')
    .option('--js', 'Generate JavaScript')
    .action(async (sitemap, options) => {
        console.log(banner);
        console.log(chalk.bold('\n🏭 AUTO TEST FACTORY\n'));

        const sitemapPath = sitemap || options.sitemap;
        const spinner = ora('Loading sitemap...').start();

        try {
            // Load sitemap
            if (!fs.existsSync(sitemapPath)) {
                throw new Error(`Sitemap not found: ${sitemapPath}\nRun 'mind-cognitive explore <url>' first.`);
            }

            const siteMapData = JSON.parse(fs.readFileSync(sitemapPath, 'utf-8'));
            
            // Convert back to Maps
            const siteMap = {
                ...siteMapData,
                pages: new Map(Object.entries(siteMapData.pages || {})),
                forms: new Map(Object.entries(siteMapData.forms || {})),
                apiEndpoints: new Map(Object.entries(siteMapData.apiEndpoints || {}))
            };

            spinner.text = 'Generating tests...';

            const { AutoTestFactory } = await import('../src/cognitive/auto-test-factory.js');

            const factory = new AutoTestFactory({
                outputDir: options.output,
                generateGhostTests: !options.playwright && !options.api && !options.e2e || options.ghost,
                generatePlaywrightTests: !options.ghost && !options.api && !options.e2e || options.playwright,
                generateApiTests: !options.ghost && !options.playwright && !options.e2e || options.api,
                generateE2ETests: !options.ghost && !options.playwright && !options.api || options.e2e,
                language: options.js ? 'javascript' : 'typescript'
            });

            const suites = await factory.generateFromSiteMap(siteMap);

            spinner.succeed(chalk.green('Test generation complete!'));

            // Print summary
            const totalTests = suites.reduce((sum, s) => sum + s.tests.length, 0);
            
            console.log('\n' + chalk.cyan('═'.repeat(60)));
            console.log(chalk.bold('📊 GENERATION SUMMARY'));
            console.log(chalk.cyan('═'.repeat(60)));
            
            for (const suite of suites) {
                console.log(`\n  ${chalk.bold(suite.name)}`);
                console.log(`  ${chalk.gray(suite.description)}`);
                console.log(`  Tests: ${chalk.green(suite.tests.length)}`);
            }

            console.log('\n' + chalk.cyan('─'.repeat(60)));
            console.log(`  ${chalk.bold('TOTAL:')} ${chalk.green(totalTests)} tests generated`);
            console.log(`  ${chalk.bold('Output:')} ${options.output}`);
            console.log(chalk.cyan('═'.repeat(60)));

            // Show Ghost speedup
            const uiDuration = suites
                .filter(s => s.name.includes('Playwright') || s.name.includes('E2E'))
                .reduce((sum, s) => sum + s.tests.reduce((t, test) => t + test.estimatedDuration, 0), 0);
            const ghostDuration = suites
                .filter(s => s.name.includes('Ghost'))
                .reduce((sum, s) => sum + s.tests.reduce((t, test) => t + test.estimatedDuration, 0), 0);

            if (ghostDuration > 0 && uiDuration > 0) {
                console.log('\n' + chalk.bold.magenta('👻 GHOST PROTOCOL SPEEDUP'));
                console.log(`  UI tests duration: ~${(uiDuration / 1000).toFixed(0)}s`);
                console.log(`  Ghost tests duration: ~${(ghostDuration / 1000).toFixed(1)}s`);
                console.log(`  ${chalk.bold.green(`Speedup: ${(uiDuration / ghostDuration).toFixed(0)}x faster!`)}`);
            }

        } catch (error) {
            spinner.fail(chalk.red('Generation failed'));
            console.error(chalk.red(error.message));
            process.exit(1);
        }
    });

// ============================================================
// HEAL COMMAND
// ============================================================
program
    .command('heal')
    .description('🔧 Self-healing management')
    .option('--status', 'Show healing statistics')
    .option('--history', 'Show healing history')
    .option('--patterns', 'Show learned patterns')
    .option('--clear', 'Clear healing data')
    .action(async (options) => {
        console.log(banner);
        console.log(chalk.bold('\n🔧 SELF-HEALING V2\n'));

        try {
            const { SelfHealingV2 } = await import('../src/cognitive/self-healing-v2.js');
            const healer = new SelfHealingV2();

            if (options.status || (!options.history && !options.patterns && !options.clear)) {
                const stats = healer.getStatistics();

                console.log(chalk.cyan('═'.repeat(60)));
                console.log(chalk.bold('📊 HEALING STATISTICS'));
                console.log(chalk.cyan('═'.repeat(60)));
                console.log(`  ${chalk.yellow('Total healings:')} ${stats.totalHealings}`);
                console.log(`  ${chalk.yellow('Success rate:')} ${(stats.successRate * 100).toFixed(1)}%`);
                console.log(`  ${chalk.yellow('Patterns learned:')} ${stats.patternsLearned}`);
                
                if (stats.topStrategies.length > 0) {
                    console.log('\n  ' + chalk.bold('Top strategies:'));
                    for (const s of stats.topStrategies.slice(0, 5)) {
                        console.log(`    • ${s.strategy}: ${s.count} successes`);
                    }
                }
                console.log(chalk.cyan('═'.repeat(60)));
            }

            if (options.patterns) {
                console.log('\n' + chalk.bold('🧠 LEARNED PATTERNS'));
                console.log(chalk.cyan('─'.repeat(60)));
                // Would display patterns from healer
                console.log('  (Patterns are learned from successful healings)');
            }

            if (options.clear) {
                const dataPath = './healing-data';
                if (fs.existsSync(dataPath)) {
                    fs.rmSync(dataPath, { recursive: true });
                    console.log(chalk.green('✓ Healing data cleared'));
                } else {
                    console.log(chalk.yellow('No healing data to clear'));
                }
            }

        } catch (error) {
            console.error(chalk.red(error.message));
            process.exit(1);
        }
    });

// ============================================================
// ANCHOR COMMAND
// ============================================================
program
    .command('anchor')
    .description('📍 Cognitive anchor management')
    .option('--list', 'List all anchors')
    .option('--export <file>', 'Export anchors to file')
    .option('--import <file>', 'Import anchors from file')
    .option('--analyze <id>', 'Analyze specific anchor')
    .action(async (options) => {
        console.log(banner);
        console.log(chalk.bold('\n📍 COGNITIVE ANCHORS\n'));

        try {
            const { NeuralMapEngine } = await import('../src/cognitive/neural-map-engine.js');
            const neuralMap = new NeuralMapEngine();

            if (options.list) {
                const anchors = neuralMap.getAllAnchors();
                
                console.log(chalk.cyan('═'.repeat(60)));
                console.log(chalk.bold('📍 REGISTERED ANCHORS'));
                console.log(chalk.cyan('═'.repeat(60)));

                if (anchors.length === 0) {
                    console.log('  No anchors registered yet.');
                } else {
                    for (const anchor of anchors) {
                        console.log(`\n  ${chalk.bold(anchor.id)}`);
                        console.log(`    Name: ${anchor.name}`);
                        console.log(`    Type: ${anchor.elementType}`);
                        console.log(`    Selectors: ${anchor.selectors.length}`);
                        console.log(`    Success rate: ${(anchor.learningData.successRate * 100).toFixed(1)}%`);
                    }
                }
                console.log(chalk.cyan('═'.repeat(60)));
            }

            if (options.export) {
                const anchors = neuralMap.getAllAnchors();
                fs.writeFileSync(options.export, JSON.stringify(anchors, null, 2));
                console.log(chalk.green(`✓ Exported ${anchors.length} anchors to ${options.export}`));
            }

            if (options.import) {
                if (!fs.existsSync(options.import)) {
                    throw new Error(`File not found: ${options.import}`);
                }
                const anchors = JSON.parse(fs.readFileSync(options.import, 'utf-8'));
                neuralMap.importAnchors(anchors);
                console.log(chalk.green(`✓ Imported ${anchors.length} anchors from ${options.import}`));
            }

        } catch (error) {
            console.error(chalk.red(error.message));
            process.exit(1);
        }
    });

// ============================================================
// RUN COMMAND - Full Pipeline
// ============================================================
program
    .command('run <url>')
    .description('🚀 Run full cognitive pipeline (explore → generate → heal)')
    .option('-o, --output <dir>', 'Output directory', './cognitive-output')
    .option('-p, --pages <number>', 'Maximum pages to explore', '50')
    .option('-w, --workers <number>', 'Parallel workers', '4')
    .action(async (url, options) => {
        console.log(banner);
        console.log(chalk.bold.magenta('\n🚀 FULL COGNITIVE PIPELINE\n'));
        console.log(chalk.gray(`Target: ${url}`));
        console.log(chalk.gray(`Output: ${options.output}\n`));

        const startTime = Date.now();

        try {
            const { CognitiveOrchestrator } = await import('../src/cognitive/index.js');

            const orchestrator = new CognitiveOrchestrator({
                outputDir: options.output,
                maxPages: parseInt(options.pages),
                parallelWorkers: parseInt(options.workers)
            });

            // Progress events
            orchestrator.on('exploration:page', (page) => {
                console.log(chalk.gray(`  📄 ${page.title || page.url}`));
            });

            const result = await orchestrator.autonomousRun(url);

            const duration = Date.now() - startTime;

            // Final summary
            console.log('\n' + chalk.bold.green('✅ PIPELINE COMPLETE'));
            console.log(chalk.cyan('═'.repeat(60)));
            console.log(`  ${chalk.yellow('Duration:')} ${(duration / 1000).toFixed(1)}s`);
            console.log(`  ${chalk.yellow('Pages:')} ${result.siteMap.totalPages}`);
            console.log(`  ${chalk.yellow('Tests generated:')} ${result.testsGenerated}`);
            console.log(`  ${chalk.yellow('Self-healing:')} ${result.healingEnabled ? chalk.green('ACTIVE') : 'Inactive'}`);
            console.log(chalk.cyan('═'.repeat(60)));

            console.log('\n' + chalk.bold('📁 OUTPUT STRUCTURE:'));
            console.log(`  ${options.output}/`);
            console.log('  ├── exploration/');
            console.log('  │   ├── sitemap.json');
            console.log('  │   └── screenshots/');
            console.log('  ├── tests/');
            console.log('  │   ├── ghost/');
            console.log('  │   ├── playwright/');
            console.log('  │   ├── api/');
            console.log('  │   └── e2e/');
            console.log('  └── healing/');
            console.log('      └── healing-history.json');

            console.log('\n' + chalk.bold('🎯 NEXT STEPS:'));
            console.log('  1. Review generated tests in ' + chalk.cyan(`${options.output}/tests/`));
            console.log('  2. Run tests: ' + chalk.cyan('npx playwright test'));
            console.log('  3. Monitor healing: ' + chalk.cyan('mind-cognitive heal --status'));

        } catch (error) {
            console.error(chalk.red('\n❌ Pipeline failed:'), error.message);
            process.exit(1);
        }
    });

// ============================================================
// DEMO COMMAND
// ============================================================
program
    .command('demo')
    .description('🎬 Run demo on sample site')
    .action(async () => {
        console.log(banner);
        console.log(chalk.bold.yellow('\n🎬 COGNITIVE DEMO\n'));
        
        console.log('This demo will:');
        console.log('  1. Explore a sample website');
        console.log('  2. Discover forms and API endpoints');
        console.log('  3. Generate tests automatically');
        console.log('  4. Enable self-healing\n');

        console.log(chalk.cyan('To run the full demo:'));
        console.log(chalk.white('  mind-cognitive run https://demo.playwright.dev/todomvc\n'));

        console.log(chalk.cyan('Or step by step:'));
        console.log(chalk.white('  1. mind-cognitive explore https://demo.playwright.dev/todomvc'));
        console.log(chalk.white('  2. mind-cognitive generate'));
        console.log(chalk.white('  3. mind-cognitive heal --status\n'));
    });

// Parse command line
program.parse();

// Show help if no command
if (!process.argv.slice(2).length) {
    console.log(banner);
    program.outputHelp();
}
