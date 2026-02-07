/**
 * ⚛️ PREDICTIVE AUDIT - DEMO
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Демонстрация на Predictive Audit Engine
 * 
 * @author DIMITAR PRODROMOV
 * @version 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { PredictiveAudit, AuditResult } from './index';

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

async function demo() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('🔍 PREDICTIVE AUDIT ENGINE - DEMO');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════════
  // Initialize Audit
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('📦 Initializing Predictive Audit...');
  const audit = new PredictiveAudit({
    sourcePaths: ['./src'],
    enableSecurity: true,
    enablePerformance: true,
    enableQuality: true,
    enableDependencies: true,
    severityThreshold: 'low'
  });
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════════
  // Run Audit
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('🚀 Running comprehensive audit...');
  console.log('');
  
  const result = await audit.runAudit();
  
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════════
  // Display Results
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('📊 AUDIT RESULTS');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');

  // Summary
  console.log('📋 SUMMARY');
  console.log('─────────────────────────────────────────────');
  console.log(`Total Issues: ${result.summary.totalIssues}`);
  console.log(`  🔴 Critical: ${result.summary.criticalCount}`);
  console.log(`  🟠 High: ${result.summary.highCount}`);
  console.log(`  🟡 Medium: ${result.summary.mediumCount}`);
  console.log(`  🟢 Low: ${result.summary.lowCount}`);
  console.log(`Files Scanned: ${result.summary.filesScanned}`);
  console.log(`Lines Analyzed: ${result.summary.linesAnalyzed}`);
  console.log(`Duration: ${result.summary.auditDuration}ms`);
  console.log('');

  // Score
  console.log('🎯 SCORES');
  console.log('─────────────────────────────────────────────');
  console.log(`Overall: ${result.score.overall}/100 (Grade: ${result.score.grade})`);
  console.log(`Security: ${result.score.security}/100`);
  console.log(`Performance: ${result.score.performance}/100`);
  console.log(`Quality: ${result.score.quality}/100`);
  console.log(`Dependencies: ${result.score.dependencies}/100`);
  console.log('');

  // Visual score bar
  console.log('Score Breakdown:');
  console.log(`Security     [${'█'.repeat(Math.floor(result.score.security / 10))}${'░'.repeat(10 - Math.floor(result.score.security / 10))}] ${result.score.security}%`);
  console.log(`Performance  [${'█'.repeat(Math.floor(result.score.performance / 10))}${'░'.repeat(10 - Math.floor(result.score.performance / 10))}] ${result.score.performance}%`);
  console.log(`Quality      [${'█'.repeat(Math.floor(result.score.quality / 10))}${'░'.repeat(10 - Math.floor(result.score.quality / 10))}] ${result.score.quality}%`);
  console.log(`Dependencies [${'█'.repeat(Math.floor(result.score.dependencies / 10))}${'░'.repeat(10 - Math.floor(result.score.dependencies / 10))}] ${result.score.dependencies}%`);
  console.log('');

  // Security Issues
  if (result.securityIssues.length > 0) {
    console.log('🔒 SECURITY ISSUES');
    console.log('─────────────────────────────────────────────');
    for (const issue of result.securityIssues) {
      const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'high' ? '🟠' : '🟡';
      console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.title}`);
      console.log(`   📁 ${issue.filePath}:${issue.lineNumber}`);
      console.log(`   💡 ${issue.recommendation}`);
    }
    console.log('');
  }

  // Performance Issues
  if (result.performanceIssues.length > 0) {
    console.log('⚡ PERFORMANCE ISSUES');
    console.log('─────────────────────────────────────────────');
    for (const issue of result.performanceIssues) {
      const icon = issue.severity === 'high' ? '🟠' : issue.severity === 'medium' ? '🟡' : '🟢';
      console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.title}`);
      console.log(`   📁 ${issue.filePath}:${issue.lineNumber}`);
      console.log(`   📊 Impact: ${issue.estimatedImpact}`);
    }
    console.log('');
  }

  // Dependency Issues
  if (result.dependencyIssues.length > 0) {
    console.log('📦 DEPENDENCY VULNERABILITIES');
    console.log('─────────────────────────────────────────────');
    for (const issue of result.dependencyIssues) {
      const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'high' ? '🟠' : '🟡';
      console.log(`${icon} ${issue.packageName}@${issue.currentVersion}`);
      console.log(`   🔐 ${issue.cveId || 'N/A'}: ${issue.title}`);
      console.log(`   ✅ Fix: Update to ${issue.fixedVersion}`);
    }
    console.log('');
  }

  // Recommendations
  console.log('💡 TOP RECOMMENDATIONS');
  console.log('─────────────────────────────────────────────');
  for (const rec of result.recommendations) {
    console.log(`[${rec.priority.toUpperCase()}] ${rec.title}`);
    console.log(`   Effort: ${rec.effort} | Impact: ${rec.impact}`);
    console.log(`   Steps: ${rec.steps.length}`);
  }
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════════
  // Generate Report
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('📄 FULL REPORT');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  
  const report = audit.generateReport(result);
  console.log(report.split('\n').slice(0, 30).join('\n'));
  console.log('... (truncated)');
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('✅ PREDICTIVE AUDIT - DEMO COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log('🎯 "Проблемите се виждат преди да станат проблеми."');
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════════

export { demo };

if (require.main === module) {
  demo().catch(console.error);
}
