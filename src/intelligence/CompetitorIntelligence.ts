/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COMPETITOR INTELLIGENCE - The Strategic Radar
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Когато знаеш какво прави конкурентът, преди ТОЙ да знае - ти печелиш."
 * 
 * This module monitors PUBLICLY AVAILABLE competitor activity:
 * - Public JS bundle analysis (like view-source)
 * - npm package version tracking
 * - GitHub public releases/changelog
 * - Public API documentation changes
 * - Marketing page copy changes
 * 
 * LEGAL BASIS: All data is publicly accessible. We're doing what
 * any developer with view-source can do, just automated.
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 33.2.0 - THE COMPLIANCE PREDATOR
 */

import { EventEmitter } from 'events';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import * as https from 'https';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Competitor {
  id: string;
  name: string;
  domain: string;
  category: 'TESTING' | 'MONITORING' | 'SECURITY' | 'DEVTOOLS' | 'OTHER';
  trackingEnabled: boolean;
  lastCheck: Date | null;
  intel: CompetitorIntel[];
}

export interface CompetitorIntel {
  id: string;
  competitorId: string;
  timestamp: Date;
  type: IntelType;
  title: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  actionable: string;
  raw?: string;
}

export type IntelType = 
  | 'NEW_FEATURE'
  | 'VERSION_RELEASE'
  | 'PRICING_CHANGE'
  | 'API_UPDATE'
  | 'MARKETING_CHANGE'
  | 'TECH_STACK_CHANGE'
  | 'ACQUISITION'
  | 'HIRING'
  | 'PATENT'
  | 'OTHER';

export interface BundleAnalysis {
  domain: string;
  timestamp: Date;
  frameworks: string[];
  libraries: string[];
  apiEndpoints: string[];
  featureFlags: string[];
  hash: string;
}

export interface ChangeDetection {
  competitorId: string;
  field: string;
  previousValue: string;
  newValue: string;
  detectedAt: Date;
  significance: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

// ═══════════════════════════════════════════════════════════════════════════════
// KNOWN COMPETITORS
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_COMPETITORS: Omit<Competitor, 'id' | 'lastCheck' | 'intel'>[] = [
  { name: 'Cypress', domain: 'cypress.io', category: 'TESTING', trackingEnabled: true },
  { name: 'Playwright', domain: 'playwright.dev', category: 'TESTING', trackingEnabled: true },
  { name: 'Selenium', domain: 'selenium.dev', category: 'TESTING', trackingEnabled: true },
  { name: 'BrowserStack', domain: 'browserstack.com', category: 'TESTING', trackingEnabled: true },
  { name: 'Sauce Labs', domain: 'saucelabs.com', category: 'TESTING', trackingEnabled: true },
  { name: 'LambdaTest', domain: 'lambdatest.com', category: 'TESTING', trackingEnabled: true },
  { name: 'Datadog', domain: 'datadoghq.com', category: 'MONITORING', trackingEnabled: false },
  { name: 'Snyk', domain: 'snyk.io', category: 'SECURITY', trackingEnabled: true },
  { name: 'SonarQube', domain: 'sonarqube.org', category: 'SECURITY', trackingEnabled: true },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPETITOR INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════════

export class CompetitorIntelligence extends EventEmitter {
  private static instance: CompetitorIntelligence;

  // State
  private competitors: Map<string, Competitor> = new Map();
  private bundleCache: Map<string, BundleAnalysis> = new Map();

  // Paths
  private readonly DATA_PATH = join(process.cwd(), 'data', 'competitor-intel');
  private readonly COMPETITORS_FILE: string;
  private readonly INTEL_PATH: string;

  // Patterns for JS bundle analysis
  private static readonly FRAMEWORK_PATTERNS: Record<string, RegExp> = {
    'React': /react|React\.|ReactDOM/,
    'Vue': /Vue\.|__vue__|v-if|v-for/,
    'Angular': /angular|ng-|@angular/,
    'Svelte': /svelte|__svelte/,
    'Next.js': /next\/|__NEXT_/,
    'Nuxt': /nuxt|__nuxt/,
    'Remix': /remix|__remix/,
  };

  private static readonly LIBRARY_PATTERNS: Record<string, RegExp> = {
    'Redux': /redux|createStore|dispatch/,
    'MobX': /mobx|observable|makeAutoObservable/,
    'TailwindCSS': /tailwind|tw-/,
    'Stripe': /stripe\.js|Stripe\(/,
    'Sentry': /sentry|Sentry\.init/,
    'Analytics': /gtag|analytics|segment/,
    'Auth0': /auth0/i,
    'Firebase': /firebase|firestore/i,
    'Supabase': /supabase/i,
    'GraphQL': /graphql|__typename/,
    'Apollo': /apollo|ApolloClient/,
    'Socket.io': /socket\.io|io\.connect/,
    'Pusher': /pusher/i,
  };

  private constructor() {
    super();
    this.COMPETITORS_FILE = join(this.DATA_PATH, 'competitors.json');
    this.INTEL_PATH = join(this.DATA_PATH, 'intel');
    this.ensureDirectories();
    this.loadData();
    this.initializeDefaultCompetitors();

    console.log(`
🔍 ═══════════════════════════════════════════════════════════════════════════════
   COMPETITOR INTELLIGENCE v33.2 - THE STRATEGIC RADAR
   ─────────────────────────────────────────────────────────────────────────────
   Tracking: ${Array.from(this.competitors.values()).filter(c => c.trackingEnabled).length} competitors
   Intel Records: ${this.getTotalIntelCount()}
   "Познай врага си по-добре от себе си."
═══════════════════════════════════════════════════════════════════════════════
    `);
  }

  static getInstance(): CompetitorIntelligence {
    if (!CompetitorIntelligence.instance) {
      CompetitorIntelligence.instance = new CompetitorIntelligence();
    }
    return CompetitorIntelligence.instance;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUNDLE ANALYSIS (PUBLIC DATA ONLY)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Analyze a competitor's public JavaScript bundles.
   * This is equivalent to view-source - 100% legal.
   */
  async analyzeBundles(domain: string): Promise<BundleAnalysis> {
    console.log(`\n🔍 [INTEL] Analyzing public bundles for ${domain}...`);

    const url = `https://${domain}`;
    let html = '';

    try {
      html = await this.fetchPage(url);
    } catch (error) {
      console.log(`   └─ Failed to fetch: ${error}`);
      return {
        domain,
        timestamp: new Date(),
        frameworks: [],
        libraries: [],
        apiEndpoints: [],
        featureFlags: [],
        hash: '',
      };
    }

    // Extract script sources
    const scriptUrls = this.extractScriptUrls(html, url);
    console.log(`   └─ Found ${scriptUrls.length} script files`);

    // Analyze each script (limit to first 5 for performance)
    let combinedContent = html;
    for (const scriptUrl of scriptUrls.slice(0, 5)) {
      try {
        const scriptContent = await this.fetchPage(scriptUrl);
        combinedContent += '\n' + scriptContent;
      } catch {
        // Skip failed fetches
      }
    }

    // Detect frameworks
    const frameworks: string[] = [];
    for (const [name, pattern] of Object.entries(CompetitorIntelligence.FRAMEWORK_PATTERNS)) {
      if (pattern.test(combinedContent)) {
        frameworks.push(name);
      }
    }

    // Detect libraries
    const libraries: string[] = [];
    for (const [name, pattern] of Object.entries(CompetitorIntelligence.LIBRARY_PATTERNS)) {
      if (pattern.test(combinedContent)) {
        libraries.push(name);
      }
    }

    // Extract API endpoints (public ones visible in JS)
    const apiEndpoints = this.extractApiEndpoints(combinedContent);

    // Extract feature flags (common patterns)
    const featureFlags = this.extractFeatureFlags(combinedContent);

    // Generate hash for change detection
    const hash = crypto.createHash('md5')
      .update(frameworks.join(',') + libraries.join(','))
      .digest('hex');

    const analysis: BundleAnalysis = {
      domain,
      timestamp: new Date(),
      frameworks,
      libraries,
      apiEndpoints,
      featureFlags,
      hash,
    };

    // Check for changes
    const previousAnalysis = this.bundleCache.get(domain);
    if (previousAnalysis && previousAnalysis.hash !== hash) {
      this.detectChanges(domain, previousAnalysis, analysis);
    }

    this.bundleCache.set(domain, analysis);

    console.log(`   └─ Frameworks: ${frameworks.join(', ') || 'None detected'}`);
    console.log(`   └─ Libraries: ${libraries.join(', ') || 'None detected'}`);
    console.log(`   └─ API Endpoints: ${apiEndpoints.length}`);
    console.log(`   └─ Feature Flags: ${featureFlags.length}`);

    return analysis;
  }

  private extractScriptUrls(html: string, baseUrl: string): string[] {
    const scriptPattern = /<script[^>]+src=["']([^"']+)["'][^>]*>/g;
    const urls: string[] = [];
    let match;

    while ((match = scriptPattern.exec(html)) !== null) {
      let scriptUrl = match[1];
      
      // Skip inline data URLs and analytics
      if (scriptUrl.startsWith('data:') || 
          scriptUrl.includes('google') || 
          scriptUrl.includes('analytics') ||
          scriptUrl.includes('facebook')) {
        continue;
      }

      // Make absolute URL
      if (scriptUrl.startsWith('//')) {
        scriptUrl = 'https:' + scriptUrl;
      } else if (scriptUrl.startsWith('/')) {
        scriptUrl = baseUrl + scriptUrl;
      } else if (!scriptUrl.startsWith('http')) {
        scriptUrl = baseUrl + '/' + scriptUrl;
      }

      urls.push(scriptUrl);
    }

    return urls;
  }

  private extractApiEndpoints(content: string): string[] {
    const endpoints: string[] = [];
    
    // Common API patterns
    const patterns = [
      /["'](\/api\/[^"']+)["']/g,
      /["'](https?:\/\/api\.[^"']+)["']/g,
      /fetch\s*\(\s*["']([^"']+)["']/g,
      /axios\.[a-z]+\s*\(\s*["']([^"']+)["']/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const endpoint = match[1];
        if (!endpoint.includes('${') && !endpoints.includes(endpoint)) {
          endpoints.push(endpoint);
        }
      }
    }

    return endpoints.slice(0, 20); // Limit to 20
  }

  private extractFeatureFlags(content: string): string[] {
    const flags: string[] = [];
    
    // Common feature flag patterns
    const patterns = [
      /FEATURE_([A-Z_]+)/g,
      /feature[_-]?([a-z_]+)/gi,
      /isEnabled\s*\(\s*["']([^"']+)["']/g,
      /["']ff[_-]([^"']+)["']/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const flag = match[1];
        if (flag.length > 2 && flag.length < 50 && !flags.includes(flag)) {
          flags.push(flag);
        }
      }
    }

    return flags.slice(0, 15); // Limit to 15
  }

  private detectChanges(domain: string, prev: BundleAnalysis, current: BundleAnalysis): void {
    const competitor = Array.from(this.competitors.values())
      .find(c => c.domain === domain);

    if (!competitor) return;

    // New frameworks
    const newFrameworks = current.frameworks.filter(f => !prev.frameworks.includes(f));
    if (newFrameworks.length > 0) {
      this.addIntel(competitor.id, {
        type: 'TECH_STACK_CHANGE',
        title: `New framework detected: ${newFrameworks.join(', ')}`,
        description: `${competitor.name} appears to have added ${newFrameworks.join(', ')} to their stack.`,
        impact: 'MEDIUM',
        actionable: `Analyze if this affects our competitive positioning. Consider: ${newFrameworks.map(f => `How does our ${f} support compare?`).join(' ')}`,
      });
    }

    // New libraries
    const newLibraries = current.libraries.filter(l => !prev.libraries.includes(l));
    if (newLibraries.length > 0) {
      this.addIntel(competitor.id, {
        type: 'TECH_STACK_CHANGE',
        title: `New libraries detected: ${newLibraries.join(', ')}`,
        description: `${competitor.name} is now using: ${newLibraries.join(', ')}`,
        impact: 'LOW',
        actionable: 'Monitor for feature announcements related to these libraries.',
      });
    }

    // New API endpoints (might indicate new features)
    const newEndpoints = current.apiEndpoints.filter(e => !prev.apiEndpoints.includes(e));
    if (newEndpoints.length > 3) {
      this.addIntel(competitor.id, {
        type: 'API_UPDATE',
        title: `Significant API changes detected`,
        description: `${newEndpoints.length} new API endpoints found. Possible new feature development.`,
        impact: 'HIGH',
        actionable: 'Investigate new endpoints for feature hints. Cross-reference with their changelog.',
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NPM PACKAGE TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check npm registry for competitor package updates.
   * npm registry is public API.
   */
  async checkNpmPackage(packageName: string): Promise<{ version: string; published: Date } | null> {
    try {
      const data = await this.fetchPage(`https://registry.npmjs.org/${packageName}/latest`);
      const json = JSON.parse(data);
      
      return {
        version: json.version,
        published: new Date(json.time?.modified || Date.now()),
      };
    } catch {
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEL MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  private addIntel(competitorId: string, intel: Omit<CompetitorIntel, 'id' | 'competitorId' | 'timestamp'>): void {
    const competitor = this.competitors.get(competitorId);
    if (!competitor) return;

    const newIntel: CompetitorIntel = {
      id: `INTEL-${Date.now().toString(36).toUpperCase()}`,
      competitorId,
      timestamp: new Date(),
      ...intel,
    };

    competitor.intel.push(newIntel);
    competitor.lastCheck = new Date();

    this.saveData();
    this.emit('intel:new', newIntel);

    console.log(`\n🎯 [INTEL] NEW: ${intel.title}`);
    console.log(`   └─ Competitor: ${competitor.name}`);
    console.log(`   └─ Impact: ${intel.impact}`);
  }

  /**
   * Generate strategic insight from all gathered intel.
   */
  generateStrategicInsight(): string {
    const allIntel = Array.from(this.competitors.values())
      .flatMap(c => c.intel)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const recentHighImpact = allIntel
      .filter(i => i.impact === 'HIGH')
      .slice(0, 5);

    const techChanges = allIntel
      .filter(i => i.type === 'TECH_STACK_CHANGE')
      .slice(0, 10);

    return `
# QAntum Strategic Intelligence Briefing
Generated: ${new Date().toISOString()}

## High-Priority Items
${recentHighImpact.map(i => `- **${i.title}** (${this.competitors.get(i.competitorId)?.name})`).join('\n') || 'No high-priority items.'}

## Technology Trends
${techChanges.map(i => `- ${i.title}`).join('\n') || 'No recent tech changes detected.'}

## Recommendations
${this.generateRecommendations(allIntel)}

---
*"Know your enemy and know yourself, and you can fight a hundred battles."*
    `.trim();
  }

  private generateRecommendations(intel: CompetitorIntel[]): string {
    const recommendations: string[] = [];

    // Check for framework trends
    const frameworkChanges = intel.filter(i => 
      i.type === 'TECH_STACK_CHANGE' && i.title.includes('framework'));
    
    if (frameworkChanges.length > 2) {
      recommendations.push('Multiple competitors updating frameworks - ensure QAntum supports latest versions.');
    }

    // Check for API changes
    const apiChanges = intel.filter(i => i.type === 'API_UPDATE');
    if (apiChanges.length > 0) {
      recommendations.push('Competitors expanding APIs - consider what features they might be launching.');
    }

    return recommendations.length > 0 
      ? recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')
      : '- Continue monitoring. No immediate action required.';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  private fetchPage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'QAntum-Intel/33.2 (https://qantum.dev)',
          'Accept': 'text/html,application/javascript,*/*',
        },
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.end();
    });
  }

  private initializeDefaultCompetitors(): void {
    for (const comp of DEFAULT_COMPETITORS) {
      const existing = Array.from(this.competitors.values())
        .find(c => c.domain === comp.domain);
      
      if (!existing) {
        const id = `COMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6)}`;
        this.competitors.set(id, {
          id,
          ...comp,
          lastCheck: null,
          intel: [],
        });
      }
    }
    this.saveData();
  }

  private getTotalIntelCount(): number {
    return Array.from(this.competitors.values())
      .reduce((sum, c) => sum + c.intel.length, 0);
  }

  private ensureDirectories(): void {
    if (!existsSync(this.DATA_PATH)) {
      mkdirSync(this.DATA_PATH, { recursive: true });
    }
    if (!existsSync(this.INTEL_PATH)) {
      mkdirSync(this.INTEL_PATH, { recursive: true });
    }
  }

  private loadData(): void {
    try {
      if (existsSync(this.COMPETITORS_FILE)) {
        const data = JSON.parse(readFileSync(this.COMPETITORS_FILE, 'utf-8'));
        for (const comp of data) {
          comp.lastCheck = comp.lastCheck ? new Date(comp.lastCheck) : null;
          comp.intel = (comp.intel || []).map((i: any) => ({
            ...i,
            timestamp: new Date(i.timestamp),
          }));
          this.competitors.set(comp.id, comp);
        }
      }
    } catch {
      // Start fresh
    }
  }

  private saveData(): void {
    const data = Array.from(this.competitors.values());
    writeFileSync(this.COMPETITORS_FILE, JSON.stringify(data, null, 2));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  getCompetitor(id: string): Competitor | undefined {
    return this.competitors.get(id);
  }

  getAllCompetitors(): Competitor[] {
    return Array.from(this.competitors.values());
  }

  addCompetitor(name: string, domain: string, category: Competitor['category']): Competitor {
    const id = `COMP-${Date.now().toString(36).toUpperCase()}`;
    const competitor: Competitor = {
      id,
      name,
      domain,
      category,
      trackingEnabled: true,
      lastCheck: null,
      intel: [],
    };
    this.competitors.set(id, competitor);
    this.saveData();
    return competitor;
  }

  async runFullScan(): Promise<void> {
    console.log('\n🔍 [INTEL] Running full competitor scan...');
    
    const competitors = Array.from(this.competitors.values())
      .filter(c => c.trackingEnabled);

    for (const comp of competitors) {
      await this.analyzeBundles(comp.domain);
    }

    console.log('\n✅ Full scan complete.');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default CompetitorIntelligence;
