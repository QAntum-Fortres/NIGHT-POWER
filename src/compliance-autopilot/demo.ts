/**
 * ⚛️ COMPLIANCE AUTO-PILOT - DEMO
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @author DIMITAR PRODROMOV
 * @version 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { ComplianceAutoPilot } from './index';

async function demo() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('📋 COMPLIANCE AUTO-PILOT - DEMO');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');

  // Initialize
  console.log('📦 Initializing Compliance Auto-Pilot...');
  const compliance = new ComplianceAutoPilot({
    frameworks: ['GDPR', 'SOC2', 'ISO27001'],
    scanDatabase: true,
    scanInfrastructure: true,
    scanDocumentation: true
  });
  console.log('');

  // Run scan
  console.log('🔍 Running compliance scan...');
  console.log('');
  
  const results = await compliance.scan();
  
  console.log('');

  // Display results
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('📊 COMPLIANCE RESULTS');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');

  for (const [framework, result] of results) {
    const statusIcon = result.status === 'compliant' ? '✅' : result.status === 'partial' ? '⚠️' : '❌';
    
    console.log(`${statusIcon} ${framework}`);
    console.log('─────────────────────────────────────────────');
    console.log(`Score: ${result.overallScore}%`);
    console.log(`Status: ${result.status.toUpperCase()}`);
    console.log('');

    // Score bar
    const filled = Math.floor(result.overallScore / 10);
    const empty = 10 - filled;
    console.log(`[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${result.overallScore}%`);
    console.log('');

    // Categories
    console.log('Categories:');
    for (const category of result.categories) {
      const catIcon = category.score >= 80 ? '✅' : category.score >= 60 ? '⚠️' : '❌';
      console.log(`  ${catIcon} ${category.name}: ${category.score}%`);
    }
    console.log('');

    // Violations
    if (result.violations.length > 0) {
      console.log(`Violations (${result.violations.length}):`);
      for (const violation of result.violations.slice(0, 3)) {
        const sevIcon = violation.severity === 'critical' ? '🔴' : violation.severity === 'high' ? '🟠' : '🟡';
        console.log(`  ${sevIcon} ${violation.title}`);
        console.log(`     Deadline: ${violation.deadline}`);
      }
      if (result.violations.length > 3) {
        console.log(`  ... and ${result.violations.length - 3} more`);
      }
    }
    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  
  const summary = compliance.getSummary();
  console.log('| Framework  | Score | Status     |');
  console.log('|------------|-------|------------|');
  for (const s of summary) {
    console.log(`| ${s.framework.padEnd(10)} | ${String(s.score).padStart(4)}% | ${s.status.padEnd(10)} |`);
  }
  console.log('');

  // Generate report preview
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('📄 REPORT PREVIEW');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  
  const report = compliance.generateReport();
  console.log(report.split('\n').slice(0, 40).join('\n'));
  console.log('... (truncated)');
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('✅ COMPLIANCE AUTO-PILOT - DEMO COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log('🎯 "Compliance не е бреме. Това е щит."');
  console.log('');
}

export { demo };

if (require.main === module) {
  demo().catch(console.error);
}
