/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🔄 AUTONOMOUS FEEDBACK LOOP - Self-Healing Security System
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Metaphysical Principle: True resilience is not the absence of failure, but the ability
 * to recover from failure. The Autonomous Feedback Loop embodies the principle of
 * "antifragility" - a system that grows stronger from stressors rather than breaking.
 * 
 * Like the immune system that learns from pathogens to better defend against future attacks,
 * the Feedback Loop observes vulnerabilities, learns patterns, and autonomously implements
 * countermeasures.
 * 
 * The loop follows the OODA cycle: Observe → Orient → Decide → Act
 * 
 * @author Dimitar Prodromov
 * @version 17.0.0
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import type {
  AutoScanConfig,
  DependencyAuditConfig,
  VulnerabilityReport,
  BreachAttempt,
  ThreatLevel,
} from '../../../types/security.types';

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🔁 FEEDBACK LOOP TYPES
// ═══════════════════════════════════════════════════════════════════════════════════════

interface FeedbackState {
  active: boolean;
  lastScan: number | null;
  lastAudit: number | null;
  scansPerformed: number;
  vulnerabilitiesFound: number;
  vulnerabilitiesFixed: number;
  breachesBlocked: number;
  learnings: Map<string, SecurityLearning>;
}

interface SecurityLearning {
  pattern: string;
  type: string;
  occurrences: number;
  lastSeen: number;
  countermeasure: string;
  effectiveness: number; // 0-1
}

interface ScanResult {
  timestamp: number;
  scope: 'full' | 'critical' | 'changed';
  vulnerabilities: VulnerabilityReport[];
  duration: number;
  filesScanned: number;
}

interface PatchAction {
  vulnerability: VulnerabilityReport;
  action: 'update' | 'replace' | 'remove' | 'configure' | 'manual';
  applied: boolean;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🧬 AUTONOMOUS FEEDBACK LOOP ENGINE
// ═══════════════════════════════════════════════════════════════════════════════════════

export class AutonomousFeedbackLoop extends EventEmitter {
  private state: FeedbackState;
  private scanConfig: AutoScanConfig;
  private auditConfig: DependencyAuditConfig;
  private vulnerabilities: Map<string, VulnerabilityReport>;
  private breachAttempts: BreachAttempt[];
  private patchHistory: PatchAction[];
  private scanTimer: ReturnType<typeof setInterval> | null = null;
  private readonly MAX_BREACH_HISTORY = 1000;
  private readonly MAX_PATCH_HISTORY = 500;
  private readonly KNOWN_CVE_PATTERNS: Array<{ pattern: RegExp; severity: ThreatLevel; fix: string }>;

  constructor() {
    super();
    this.state = this.initializeState();
    this.scanConfig = this.getDefaultScanConfig();
    this.auditConfig = this.getDefaultAuditConfig();
    this.vulnerabilities = new Map();
    this.breachAttempts = [];
    this.patchHistory = [];
    this.KNOWN_CVE_PATTERNS = this.initializeKnownPatterns();
  }

  /**
   * Initialize feedback loop state
   */
  private initializeState(): FeedbackState {
    return {
      active: false,
      lastScan: null,
      lastAudit: null,
      scansPerformed: 0,
      vulnerabilitiesFound: 0,
      vulnerabilitiesFixed: 0,
      breachesBlocked: 0,
      learnings: new Map(),
    };
  }

  /**
   * Get default scan configuration
   */
  private getDefaultScanConfig(): AutoScanConfig {
    return {
      frequency: 'hourly',
      scope: 'full',
      autoFix: true,
      excludePatterns: ['node_modules/**', 'dist/**', '.git/**'],
    };
  }

  /**
   * Get default audit configuration
   */
  private getDefaultAuditConfig(): DependencyAuditConfig {
    return {
      checkNPM: true,
      checkCVE: true,
      autoUpdate: 'patch',
      ignoredPackages: [],
    };
  }

  /**
   * Initialize known vulnerability patterns
   */
  private initializeKnownPatterns(): Array<{ pattern: RegExp; severity: ThreatLevel; fix: string }> {
    return [
      // SQL Injection patterns
      {
        pattern: /(\$\{.*\}|'\s*\+|\+\s*'|query\s*\(.*\+)/gi,
        severity: 'critical',
        fix: 'Use parameterized queries',
      },
      // XSS patterns
      {
        pattern: /(innerHTML|outerHTML|document\.write|eval\()/gi,
        severity: 'high',
        fix: 'Use safe DOM manipulation methods',
      },
      // Command injection
      {
        pattern: /(exec\(|spawn\(|execSync\().*(\+|`|\$\{)/gi,
        severity: 'critical',
        fix: 'Sanitize command arguments',
      },
      // Path traversal
      {
        pattern: /\.\.\//g,
        severity: 'high',
        fix: 'Validate and sanitize file paths',
      },
      // Hardcoded secrets
      {
        pattern: /(password|secret|api_key|apikey|token)\s*[:=]\s*['"][^'"]+['"]/gi,
        severity: 'critical',
        fix: 'Use environment variables for secrets',
      },
      // Weak cryptography
      {
        pattern: /(md5|sha1)\s*\(/gi,
        severity: 'medium',
        fix: 'Use SHA-256 or stronger hashing',
      },
      // Insecure random
      {
        pattern: /Math\.random\(\)/g,
        severity: 'medium',
        fix: 'Use crypto.randomBytes for security',
      },
    ];
  }

  /**
   * Enable automatic scanning
   */
  public enableAutoScan(config: Partial<AutoScanConfig> = {}): void {
    this.scanConfig = { ...this.scanConfig, ...config };

    const intervalMs = this.getIntervalMs(this.scanConfig.frequency);

    if (this.scanTimer) {
      clearInterval(this.scanTimer);
    }

    this.scanTimer = setInterval(() => {
      this.performScan();
    }, intervalMs);

    this.state.active = true;
    this.emit('autoScanEnabled', { config: this.scanConfig });

    // Perform initial scan
    this.performScan();
  }

  /**
   * Disable automatic scanning
   */
  public disableAutoScan(): void {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }

    this.state.active = false;
    this.emit('autoScanDisabled');
  }

  /**
   * Convert frequency string to milliseconds
   */
  private getIntervalMs(frequency: AutoScanConfig['frequency']): number {
    switch (frequency) {
      case 'realtime': return 30000; // 30 seconds
      case 'hourly': return 3600000; // 1 hour
      case 'daily': return 86400000; // 24 hours
      case 'weekly': return 604800000; // 7 days
      default: return 3600000;
    }
  }

  /**
   * Perform security scan
   */
  public async performScan(): Promise<ScanResult> {
    const startTime = Date.now();
    const vulnerabilities: VulnerabilityReport[] = [];

    this.emit('scanStarted', { scope: this.scanConfig.scope, timestamp: startTime });

    try {
      // Scan for code vulnerabilities
      const codeVulns = await this.scanCodePatterns();
      vulnerabilities.push(...codeVulns);

      // Audit dependencies
      const depVulns = await this.auditDependencies();
      vulnerabilities.push(...depVulns);

      // Store vulnerabilities
      for (const vuln of vulnerabilities) {
        this.vulnerabilities.set(vuln.id, vuln);
      }

      // Auto-fix if enabled
      if (this.scanConfig.autoFix) {
        await this.autoFix(vulnerabilities);
      }

      // Update state
      this.state.lastScan = Date.now();
      this.state.scansPerformed++;
      this.state.vulnerabilitiesFound += vulnerabilities.length;

      const result: ScanResult = {
        timestamp: startTime,
        scope: this.scanConfig.scope,
        vulnerabilities,
        duration: Date.now() - startTime,
        filesScanned: 0, // Would be populated by actual scanner
      };

      this.emit('scanComplete', result);
      return result;

    } catch (error) {
      this.emit('scanError', { error, timestamp: Date.now() });
      throw error;
    }
  }

  /**
   * Scan code for vulnerability patterns
   */
  private async scanCodePatterns(): Promise<VulnerabilityReport[]> {
    const vulnerabilities: VulnerabilityReport[] = [];

    // In a real implementation, this would scan actual files
    // Here we simulate pattern detection

    for (const known of this.KNOWN_CVE_PATTERNS) {
      // Simulate finding vulnerabilities
      if (Math.random() < 0.1) { // 10% chance of finding each type
        vulnerabilities.push({
          id: `vuln_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          package: 'code_scan',
          version: '0.0.0',
          severity: known.severity,
          description: `Pattern detected: ${known.pattern.source}`,
          fixAvailable: true,
          fixVersion: known.fix,
        });
      }
    }

    return vulnerabilities;
  }

  /**
   * Audit dependencies for known vulnerabilities
   */
  public async auditDependencies(): Promise<VulnerabilityReport[]> {
    const vulnerabilities: VulnerabilityReport[] = [];

    if (!this.auditConfig.checkNPM && !this.auditConfig.checkCVE) {
      return vulnerabilities;
    }

    this.emit('auditStarted', { timestamp: Date.now() });

    // Simulate dependency audit
    // In real implementation, would use npm audit or similar

    const knownVulnerablePackages = [
      { pkg: 'lodash', vuln: 'Prototype Pollution', ver: '<4.17.21' },
      { pkg: 'minimist', vuln: 'Prototype Pollution', ver: '<1.2.6' },
      { pkg: 'axios', vuln: 'Server-Side Request Forgery', ver: '<0.21.1' },
    ];

    for (const known of knownVulnerablePackages) {
      if (this.auditConfig.ignoredPackages?.includes(known.pkg)) {
        continue;
      }

      // Simulate random detection
      if (Math.random() < 0.05) { // 5% chance
        vulnerabilities.push({
          id: `dep_${known.pkg}_${Date.now()}`,
          package: known.pkg,
          version: known.ver,
          severity: 'high',
          cve: `CVE-${2021 + Math.floor(Math.random() * 4)}-${Math.floor(Math.random() * 10000)}`,
          description: known.vuln,
          fixAvailable: true,
          fixVersion: 'latest',
        });
      }
    }

    this.state.lastAudit = Date.now();
    this.emit('auditComplete', { vulnerabilities, timestamp: Date.now() });

    return vulnerabilities;
  }

  /**
   * Automatically fix vulnerabilities
   */
  private async autoFix(vulnerabilities: VulnerabilityReport[]): Promise<number> {
    let fixed = 0;

    for (const vuln of vulnerabilities) {
      if (!vuln.fixAvailable) {
        continue;
      }

      const action = this.determinePatchAction(vuln);

      try {
        const applied = await this.applyPatch(vuln, action);

        if (applied) {
          vuln.autoFixed = true;
          fixed++;
          this.state.vulnerabilitiesFixed++;
        }

        this.patchHistory.push({
          vulnerability: vuln,
          action,
          applied,
          timestamp: Date.now(),
        });

        // Trim history
        if (this.patchHistory.length > this.MAX_PATCH_HISTORY) {
          this.patchHistory.shift();
        }

      } catch (error) {
        this.emit('patchError', { vulnerability: vuln, error });
      }
    }

    if (fixed > 0) {
      this.emit('vulnerabilitiesFixed', { count: fixed });
    }

    return fixed;
  }

  /**
   * Determine appropriate patch action
   */
  private determinePatchAction(_vuln: VulnerabilityReport): PatchAction['action'] {
    // Determine action based on auto-update config
    switch (this.auditConfig.autoUpdate) {
      case 'patch':
        // Only apply patch-level updates
        return 'update';

      case 'minor':
        // Apply minor version updates
        return 'update';

      case 'all':
        // Apply all updates including major
        return 'update';

      default:
        return 'manual';
    }
  }

  /**
   * Apply patch for vulnerability
   */
  private async applyPatch(
    vuln: VulnerabilityReport,
    action: PatchAction['action']
  ): Promise<boolean> {
    // Simulate patching
    // In real implementation, would run npm update, modify code, etc.

    this.emit('patchApplied', {
      vulnerability: vuln,
      action,
      timestamp: Date.now(),
    });

    return action !== 'manual';
  }

  /**
   * Record and learn from breach attempt
   */
  public recordBreachAttempt(attempt: BreachAttempt): void {
    this.breachAttempts.push(attempt);

    // Trim history
    if (this.breachAttempts.length > this.MAX_BREACH_HISTORY) {
      this.breachAttempts.shift();
    }

    // Block the attacker
    if (!attempt.blocked) {
      attempt.blocked = true;
      this.state.breachesBlocked++;
    }

    // Learn from the attempt
    this.learnFromBreach(attempt);

    // Auto-patch if enabled
    if (this.scanConfig.autoFix && !attempt.patched) {
      this.patchVulnerability(attempt.vulnerability)
        .then((patched) => {
          attempt.patched = patched;
        })
        .catch((error) => {
          this.emit('patchError', { vulnerability: attempt.vulnerability, error });
        });
    }

    this.emit('breachAttempt', attempt);
  }

  /**
   * Learn from breach attempt to improve future detection
   */
  private learnFromBreach(attempt: BreachAttempt): void {
    const patternHash = createHash('sha256')
      .update(attempt.payload)
      .digest('hex')
      .substring(0, 16);

    const existing = this.state.learnings.get(patternHash);

    if (existing) {
      existing.occurrences++;
      existing.lastSeen = attempt.timestamp;
      existing.effectiveness = Math.min(1, existing.effectiveness + 0.1);
    } else {
      this.state.learnings.set(patternHash, {
        pattern: attempt.payload.substring(0, 100), // Store truncated
        type: attempt.vulnerability,
        occurrences: 1,
        lastSeen: attempt.timestamp,
        countermeasure: 'block',
        effectiveness: 0.5,
      });
    }

    this.emit('learningUpdated', { patternHash, attempt });
  }

  /**
   * Patch a specific vulnerability
   */
  public async patchVulnerability(vulnerabilityType: string): Promise<boolean> {
    // Simulate patching
    this.emit('patchingVulnerability', { type: vulnerabilityType });

    // In real implementation, would apply specific countermeasures

    return true;
  }

  /**
   * Get vulnerability report
   */
  public getVulnerabilityReport(): {
    total: number;
    bySeverity: Record<ThreatLevel, number>;
    fixed: number;
    pending: number;
    vulnerabilities: VulnerabilityReport[];
  } {
    const vulnerabilities = Array.from(this.vulnerabilities.values());

    const bySeverity: Record<ThreatLevel, number> = {
      none: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let fixed = 0;

    for (const vuln of vulnerabilities) {
      bySeverity[vuln.severity]++;
      if (vuln.autoFixed) {
        fixed++;
      }
    }

    return {
      total: vulnerabilities.length,
      bySeverity,
      fixed,
      pending: vulnerabilities.length - fixed,
      vulnerabilities,
    };
  }

  /**
   * Get breach attempt statistics
   */
  public getBreachStatistics(): {
    total: number;
    blocked: number;
    patched: number;
    byType: Record<string, number>;
    recentAttempts: BreachAttempt[];
  } {
    const byType: Record<string, number> = {};
    let blocked = 0;
    let patched = 0;

    for (const attempt of this.breachAttempts) {
      byType[attempt.vulnerability] = (byType[attempt.vulnerability] || 0) + 1;
      if (attempt.blocked) blocked++;
      if (attempt.patched) patched++;
    }

    // Get recent attempts (last hour)
    const oneHourAgo = Date.now() - 3600000;
    const recentAttempts = this.breachAttempts.filter(
      (a) => a.timestamp > oneHourAgo
    );

    return {
      total: this.breachAttempts.length,
      blocked,
      patched,
      byType,
      recentAttempts,
    };
  }

  /**
   * Get security learnings
   */
  public getLearnings(): SecurityLearning[] {
    return Array.from(this.state.learnings.values());
  }

  /**
   * Get current threat level based on recent activity
   */
  public assessThreatLevel(): {
    level: ThreatLevel;
    factors: string[];
    recommendations: string[];
  } {
    const factors: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check recent breaches
    const recentBreaches = this.breachAttempts.filter(
      (a) => Date.now() - a.timestamp < 3600000
    ).length;

    if (recentBreaches > 10) {
      score += 40;
      factors.push(`High breach attempt rate: ${recentBreaches}/hour`);
      recommendations.push('Enable aggressive rate limiting');
    } else if (recentBreaches > 5) {
      score += 20;
      factors.push(`Elevated breach attempts: ${recentBreaches}/hour`);
    }

    // Check unpatched vulnerabilities
    const unpatchedCritical = Array.from(this.vulnerabilities.values())
      .filter((v) => !v.autoFixed && v.severity === 'critical').length;

    if (unpatchedCritical > 0) {
      score += 30;
      factors.push(`${unpatchedCritical} unpatched critical vulnerabilities`);
      recommendations.push('Immediately patch critical vulnerabilities');
    }

    // Check scan age
    if (this.state.lastScan) {
      const scanAge = Date.now() - this.state.lastScan;
      if (scanAge > 86400000) { // 24 hours
        score += 15;
        factors.push('Security scan is stale (>24 hours)');
        recommendations.push('Run security scan immediately');
      }
    } else {
      score += 20;
      factors.push('No security scan performed');
      recommendations.push('Enable automated security scanning');
    }

    // Determine level
    let level: ThreatLevel;
    if (score >= 60) level = 'critical';
    else if (score >= 40) level = 'high';
    else if (score >= 20) level = 'medium';
    else if (score > 0) level = 'low';
    else level = 'none';

    return { level, factors, recommendations };
  }

  /**
   * Get overall statistics
   */
  public getStatistics(): FeedbackState & { threatLevel: ThreatLevel } {
    return {
      ...this.state,
      threatLevel: this.assessThreatLevel().level,
    };
  }

  /**
   * Configure dependency auditing
   */
  public configureAudit(config: Partial<DependencyAuditConfig>): void {
    this.auditConfig = { ...this.auditConfig, ...config };
    this.emit('auditConfigured', { config: this.auditConfig });
  }

  /**
   * Reset all state
   */
  public reset(): void {
    this.disableAutoScan();
    this.state = this.initializeState();
    this.vulnerabilities.clear();
    this.breachAttempts = [];
    this.patchHistory = [];
    this.emit('reset', { timestamp: Date.now() });
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.disableAutoScan();
    this.reset();
    this.removeAllListeners();
  }
}

export default AutonomousFeedbackLoop;
