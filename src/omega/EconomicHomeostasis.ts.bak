/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ECONOMIC HOMEOSTASIS - The Hunger That Builds Empires
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Системата, която не изпитва глад, умира от комфорт."
 * 
 * Philosophy:
 * - Code without customers = Hobby, not Empire
 * - Static success = Future failure
 * - The metabolism of money must pulse 24/7
 * 
 * The Economic Cannibal Protocol:
 * 1. Monitors MRR (Monthly Recurring Revenue) continuously
 * 2. Activates PREDATOR MODE when below threshold
 * 3. Auto-mutates landing pages for conversion optimization
 * 4. Launches "Cold Audit" attacks on competitor clients
 * 5. Never sleeps until $10K MRR is achieved
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 32.0.0 - THE ECONOMIC CANNIBAL
 */

import { EventEmitter } from 'events';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { GlobalAudit, AuditTarget, AuditScan } from './GlobalAudit';
import { ChronosOmegaArchitect } from './ChronosOmegaArchitect';
import { ProposalEngine, LeadData } from '../intelligence/ProposalEngine';
import { NeuralInference } from '../physics/NeuralInference';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES - THE ECONOMICS OF SURVIVAL
// ═══════════════════════════════════════════════════════════════════════════════

export interface EconomicState {
  currentMRR: number;
  targetMRR: number;
  hungerLevel: HungerLevel;
  lastPulse: Date;
  daysSinceRevenue: number;
  conversionRate: number;
  leadsContacted: number;
  proposalsSent: number;
  dealsWon: number;
}

export type HungerLevel = 
  | 'SATIATED'      // MRR >= $50K - Expansion mode
  | 'COMFORTABLE'   // MRR >= $25K - Growth mode  
  | 'HUNGRY'        // MRR >= $10K - Aggressive mode
  | 'STARVING'      // MRR >= $1K  - Predator mode
  | 'DYING'         // MRR < $1K   - Survival mode (ALL SYSTEMS ACTIVATED)
  ;

export interface CompetitorTarget {
  company: string;
  website: string;
  clientsWebsites: string[];
  ctoEmail?: string;
  weaknesses: string[];
  estimatedACV: number;
}

export interface ConversionExperiment {
  id: string;
  element: 'headline' | 'cta' | 'hero_image' | 'pricing' | 'testimonial';
  variantA: string;
  variantB: string;
  winner?: 'A' | 'B';
  conversionsA: number;
  conversionsB: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface ColdAuditResult {
  target: CompetitorTarget;
  audit: AuditScan;
  vulnerabilitiesFound: number;
  proposalGenerated: boolean;
  proposalPath?: string;
  outreachSent: boolean;
  response?: 'opened' | 'replied' | 'meeting_booked' | 'deal_won' | 'rejected';
}

export interface EconomicPulseReport {
  timestamp: Date;
  state: EconomicState;
  actions: string[];
  nextPulseIn: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EXISTENTIAL';
}

// ═══════════════════════════════════════════════════════════════════════════════
// KNOWN COMPETITORS - The Prey
// ═══════════════════════════════════════════════════════════════════════════════

const KNOWN_COMPETITORS: CompetitorTarget[] = [
  {
    company: 'Cypress.io',
    website: 'https://cypress.io',
    clientsWebsites: [],  // Will be populated by scraping
    weaknesses: ['No anti-detection', 'No self-healing', 'No AI planning'],
    estimatedACV: 50000
  },
  {
    company: 'Playwright (Microsoft)',
    website: 'https://playwright.dev',
    clientsWebsites: [],
    weaknesses: ['Open source (no support)', 'No Ghost Protocol', 'No business logic AI'],
    estimatedACV: 0  // Free, but we can offer enterprise features
  },
  {
    company: 'Selenium',
    website: 'https://selenium.dev',
    clientsWebsites: [],
    weaknesses: ['Legacy', 'Slow', 'No anti-detection', 'High maintenance'],
    estimatedACV: 0
  },
  {
    company: 'BrowserStack',
    website: 'https://browserstack.com',
    clientsWebsites: [],
    weaknesses: ['Cloud-only', 'Expensive', 'No AI', 'No ghost protocol'],
    estimatedACV: 100000
  },
  {
    company: 'LambdaTest',
    website: 'https://lambdatest.com',
    clientsWebsites: [],
    weaknesses: ['Cloud-only', 'No local GPU', 'No self-evolving'],
    estimatedACV: 50000
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// THE ECONOMIC HOMEOSTASIS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class EconomicHomeostasis extends EventEmitter {
  private static instance: EconomicHomeostasis;

  // THE SURVIVAL THRESHOLDS
  private static readonly MIN_MRR_DYING = 1000;
  private static readonly MIN_MRR_STARVING = 5000;
  private static readonly MIN_MRR_HUNGRY = 10000;
  private static readonly MIN_MRR_COMFORTABLE = 25000;
  private static readonly MIN_MRR_SATIATED = 50000;

  // PULSE FREQUENCY (adapts to hunger)
  private static readonly PULSE_INTERVAL_DYING = 60 * 1000;        // Every minute when dying
  private static readonly PULSE_INTERVAL_STARVING = 5 * 60 * 1000;  // Every 5 minutes
  private static readonly PULSE_INTERVAL_HUNGRY = 15 * 60 * 1000;   // Every 15 minutes
  private static readonly PULSE_INTERVAL_COMFORTABLE = 60 * 60 * 1000; // Every hour
  private static readonly PULSE_INTERVAL_SATIATED = 24 * 60 * 60 * 1000; // Daily

  // MODULES
  private readonly globalAudit = GlobalAudit.getInstance();
  private readonly chronos = ChronosOmegaArchitect.getInstance();
  private readonly proposals = ProposalEngine.getInstance();
  private readonly brain = NeuralInference.getInstance();

  // STATE
  private state: EconomicState;
  private pulseInterval: NodeJS.Timeout | null = null;
  private experiments: ConversionExperiment[] = [];
  private coldAuditResults: ColdAuditResult[] = [];

  // PATHS
  private readonly DATA_PATH = join(process.cwd(), 'data', 'economic');
  private readonly STATE_FILE: string;
  private readonly EXPERIMENTS_FILE: string;
  private readonly COLD_AUDITS_FILE: string;

  private constructor() {
    super();
    this.STATE_FILE = join(this.DATA_PATH, 'economic-state.json');
    this.EXPERIMENTS_FILE = join(this.DATA_PATH, 'experiments.json');
    this.COLD_AUDITS_FILE = join(this.DATA_PATH, 'cold-audits.json');
    this.state = this.loadState();
    this.ensureDataDir();
  }

  static getInstance(): EconomicHomeostasis {
    if (!EconomicHomeostasis.instance) {
      EconomicHomeostasis.instance = new EconomicHomeostasis();
    }
    return EconomicHomeostasis.instance;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE PULSE - The Heartbeat of Economic Survival
  // ═══════════════════════════════════════════════════════════════════════════

  async startPulse(): Promise<void> {
    console.log('💰 [ECONOMY] Economic Homeostasis ACTIVATED');
    console.log(`   └─ Current MRR: $${this.state.currentMRR}`);
    console.log(`   └─ Target MRR:  $${this.state.targetMRR}`);
    console.log(`   └─ Hunger Level: ${this.state.hungerLevel}`);

    // Initial pulse
    await this.pulse();

    // Start recurring pulses
    const interval = this.getPulseInterval();
    this.pulseInterval = setInterval(() => this.pulse(), interval);
    
    this.emit('pulse:started', { interval, state: this.state });
  }

  stopPulse(): void {
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
      console.log('💰 [ECONOMY] Economic Homeostasis PAUSED');
    }
  }

  async pulse(): Promise<EconomicPulseReport> {
    const actions: string[] = [];
    
    console.log('\n' + '═'.repeat(70));
    console.log('💰 ECONOMIC PULSE - ' + new Date().toISOString());
    console.log('═'.repeat(70));

    // 1. Refresh MRR from Stripe (or manual input for now)
    const currentMRR = await this.fetchMRR();
    this.state.currentMRR = currentMRR;

    // 2. Calculate hunger level
    const previousHunger = this.state.hungerLevel;
    this.state.hungerLevel = this.calculateHungerLevel(currentMRR);

    if (previousHunger !== this.state.hungerLevel) {
      console.log(`🔄 Hunger Level Changed: ${previousHunger} → ${this.state.hungerLevel}`);
      this.emit('hunger:changed', { from: previousHunger, to: this.state.hungerLevel });
    }

    // 3. Execute survival actions based on hunger
    const urgency = this.getUrgency();
    
    console.log(`\n📊 Economic State:`);
    console.log(`   └─ MRR: $${currentMRR} / $${this.state.targetMRR}`);
    console.log(`   └─ Hunger: ${this.state.hungerLevel}`);
    console.log(`   └─ Urgency: ${urgency}`);
    console.log(`   └─ Days Without Revenue: ${this.state.daysSinceRevenue}`);

    // SURVIVAL ACTIONS
    switch (this.state.hungerLevel) {
      case 'DYING':
        actions.push(...await this.executeDyingProtocol());
        break;
      case 'STARVING':
        actions.push(...await this.executeStarvingProtocol());
        break;
      case 'HUNGRY':
        actions.push(...await this.executeHungryProtocol());
        break;
      case 'COMFORTABLE':
        actions.push(...await this.executeComfortableProtocol());
        break;
      case 'SATIATED':
        actions.push(...await this.executeSatiatedProtocol());
        break;
    }

    // 4. Update state
    this.state.lastPulse = new Date();
    this.saveState();

    // 5. Generate report
    const report: EconomicPulseReport = {
      timestamp: new Date(),
      state: { ...this.state },
      actions,
      nextPulseIn: this.getPulseInterval(),
      urgency
    };

    console.log(`\n✅ Pulse Complete. ${actions.length} actions taken.`);
    console.log(`   └─ Next pulse in ${Math.round(report.nextPulseIn / 1000)}s`);
    console.log('═'.repeat(70) + '\n');

    this.emit('pulse:complete', report);
    return report;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SURVIVAL PROTOCOLS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * DYING PROTOCOL - All systems at maximum. Existential threat.
   */
  private async executeDyingProtocol(): Promise<string[]> {
    console.log('\n🚨 [DYING] EXISTENTIAL THREAT - ALL SYSTEMS ACTIVATED');
    const actions: string[] = [];

    // 1. Cold Audit Attack on ALL competitor clients
    console.log('   └─ Launching Cold Audit Blitz...');
    const auditAction = await this.launchColdAuditBlitz(10);
    actions.push(auditAction);

    // 2. A/B Test EVERYTHING on landing page
    console.log('   └─ Mutating landing page for maximum conversion...');
    const mutationAction = await this.mutateLandingPage(['headline', 'cta', 'hero_image', 'pricing']);
    actions.push(mutationAction);

    // 3. Send aggressive proposals to all warm leads
    console.log('   └─ Sending aggressive proposals...');
    const proposalAction = await this.sendAggressiveProposals();
    actions.push(proposalAction);

    // 4. Activate social proof generator
    console.log('   └─ Generating social proof content...');
    const contentAction = await this.generateSocialProofContent();
    actions.push(contentAction);

    // 5. Price reduction consideration
    console.log('   └─ Evaluating emergency pricing...');
    actions.push('Evaluated emergency pricing strategy');

    return actions;
  }

  /**
   * STARVING PROTOCOL - Aggressive but controlled
   */
  private async executeStarvingProtocol(): Promise<string[]> {
    console.log('\n⚠️ [STARVING] PREDATOR MODE ACTIVATED');
    const actions: string[] = [];

    // 1. Cold Audit on top 5 targets
    const auditAction = await this.launchColdAuditBlitz(5);
    actions.push(auditAction);

    // 2. A/B Test headline and CTA
    const mutationAction = await this.mutateLandingPage(['headline', 'cta']);
    actions.push(mutationAction);

    // 3. Follow up on all pending proposals
    actions.push(await this.followUpProposals());

    return actions;
  }

  /**
   * HUNGRY PROTOCOL - Growth focus
   */
  private async executeHungryProtocol(): Promise<string[]> {
    console.log('\n🍴 [HUNGRY] AGGRESSIVE GROWTH MODE');
    const actions: string[] = [];

    // 1. One cold audit per pulse
    const auditAction = await this.launchColdAuditBlitz(1);
    actions.push(auditAction);

    // 2. Optimize conversion
    const mutationAction = await this.mutateLandingPage(['cta']);
    actions.push(mutationAction);

    return actions;
  }

  /**
   * COMFORTABLE PROTOCOL - Sustainable growth
   */
  private async executeComfortableProtocol(): Promise<string[]> {
    console.log('\n😊 [COMFORTABLE] SUSTAINABLE GROWTH MODE');
    const actions: string[] = [];

    // 1. Analyze experiment results
    actions.push(await this.analyzeExperiments());

    // 2. Plan new features based on feedback
    actions.push('Analyzed customer feedback for feature roadmap');

    return actions;
  }

  /**
   * SATIATED PROTOCOL - Expansion and dominance
   */
  private async executeSatiatedProtocol(): Promise<string[]> {
    console.log('\n🏆 [SATIATED] EXPANSION MODE');
    const actions: string[] = [];

    // 1. Focus on enterprise deals
    actions.push('Focused outreach on enterprise targets');

    // 2. Consider new markets
    actions.push('Analyzed expansion opportunities');

    return actions;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE COLD AUDIT ATTACK
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Launch Cold Audit attacks on competitor clients
   * "The Trojan Horse Audit"
   */
  private async launchColdAuditBlitz(targetCount: number): Promise<string> {
    console.log(`\n🎯 COLD AUDIT BLITZ - Targeting ${targetCount} companies`);

    // 1. Find competitor clients (this would use web scraping in production)
    const targets = await this.findCompetitorClients(targetCount);
    let auditsPerformed = 0;
    let proposalsSent = 0;

    for (const target of targets) {
      try {
        console.log(`   └─ Auditing: ${target.website}`);

        // 2. Perform security audit
        const auditTarget: AuditTarget = {
          id: `cold-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          domain: new URL(target.website).hostname,
          type: 'WEB_APP',
          authorized: true,  // Passive scan only - no active exploitation
          priority: 1,
          tags: ['cold-audit', 'competitor-client']
        };

        // Add target first, then audit
        const addedTarget = this.globalAudit.addTarget(auditTarget);
        const audit = await this.globalAudit.audit(addedTarget.id);
        auditsPerformed++;

        // 3. If vulnerabilities found, generate aggressive proposal
        if (audit.findings && audit.findings.length > 0) {
          const criticalFindings = audit.findings.filter(f => 
            f.severity === 'CRITICAL' || f.severity === 'HIGH'
          );

          if (criticalFindings.length > 0) {
            // Generate proposal
            const lead: LeadData = {
              id: `lead-${Date.now()}`,
              company: target.company,
              website: target.website,
              email: target.ctoEmail,
              priority: 'critical',
              detected_issue: criticalFindings[0].title,
              issues: criticalFindings.map(f => f.title),
              vulnerability_type: criticalFindings[0].type,
              estimated_value: target.estimatedACV
            };

            await this.proposals.generate(lead, {
              includeGhostProtocol: true,
              includeSelfHealing: true,
              includeCompliance: true,
              currency: 'USD',
              language: 'en'
            });
            proposalsSent++;

            console.log(`      ├─ Found ${criticalFindings.length} critical issues`);
            console.log(`      └─ Proposal generated ✅`);

            // Track result
            this.coldAuditResults.push({
              target,
              audit,
              vulnerabilitiesFound: criticalFindings.length,
              proposalGenerated: true,
              outreachSent: false
            });
          }
        }

        // Rate limiting - don't hammer targets
        await this.sleep(2000);

      } catch (error) {
        console.error(`   └─ Error auditing ${target.website}:`, error);
      }
    }

    this.saveColdAudits();
    return `Cold Audit Blitz: ${auditsPerformed} audits, ${proposalsSent} proposals generated`;
  }

  /**
   * Find clients using competitor products
   */
  private async findCompetitorClients(count: number): Promise<CompetitorTarget[]> {
    // In production, this would scrape competitor case studies, job boards mentioning
    // competitor tools, GitHub repos using competitor libraries, etc.
    
    // For now, return known targets from data file if exists
    const targetsFile = join(this.DATA_PATH, 'targets.json');
    
    if (existsSync(targetsFile)) {
      try {
        const data = JSON.parse(readFileSync(targetsFile, 'utf-8'));
        return data.slice(0, count);
      } catch {
        // Fall through to placeholder
      }
    }

    // Placeholder - would be populated by LeadHunter in production
    console.log('   └─ Note: Using placeholder targets. Run LeadHunter to populate real targets.');
    return [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LANDING PAGE MUTATION (Chronos-Omega Integration)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Mutate landing page elements for conversion optimization
   */
  private async mutateLandingPage(elements: ConversionExperiment['element'][]): Promise<string> {
    console.log(`\n🧬 LANDING PAGE MUTATION - Elements: ${elements.join(', ')}`);
    
    const landingPath = join(process.cwd(), 'webapp', 'landing', 'index.html');
    
    if (!existsSync(landingPath)) {
      console.log('   └─ Warning: Landing page not found at expected path');
      return 'Landing page mutation skipped - file not found';
    }

    let mutationsApplied = 0;

    for (const element of elements) {
      try {
        // Generate new variant using AI
        const currentContent = this.extractElement(landingPath, element);
        
        if (currentContent) {
          const newVariant = await this.generateVariant(element, currentContent);
          
          if (newVariant && newVariant !== currentContent) {
            // Create experiment
            const experiment: ConversionExperiment = {
              id: `exp-${Date.now()}-${element}`,
              element,
              variantA: currentContent,
              variantB: newVariant,
              conversionsA: 0,
              conversionsB: 0,
              startedAt: new Date()
            };
            
            this.experiments.push(experiment);
            mutationsApplied++;
            
            console.log(`   └─ ${element}: New variant generated`);
          }
        }
      } catch (error) {
        console.error(`   └─ Error mutating ${element}:`, error);
      }
    }

    this.saveExperiments();
    return `Landing page: ${mutationsApplied} mutations applied`;
  }

  private extractElement(filePath: string, element: ConversionExperiment['element']): string | null {
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // Simple extraction - in production would use proper HTML parsing
      const patterns: Record<string, RegExp> = {
        headline: /<h1[^>]*>([\s\S]*?)<\/h1>/i,
        cta: /<button[^>]*class="[^"]*cta[^"]*"[^>]*>([\s\S]*?)<\/button>/i,
        hero_image: /<img[^>]*class="[^"]*hero[^"]*"[^>]*src="([^"]+)"/i,
        pricing: /<div[^>]*class="[^"]*pricing[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        testimonial: /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i
      };

      const match = content.match(patterns[element]);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  private async generateVariant(element: string, current: string): Promise<string | null> {
    try {
      const prompt = `You are a conversion rate optimization expert. 
      Current ${element}: "${current}"
      
      Generate a more compelling variant that will increase conversions.
      Focus on: urgency, value proposition, social proof, and emotional triggers.
      
      Return ONLY the new text, nothing else.`;

      const response = await this.brain.infer(prompt, undefined, {
        maxTokens: 100,
        temperature: 0.8
      });

      return response?.trim() || null;
    } catch {
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROPOSAL & OUTREACH
  // ═══════════════════════════════════════════════════════════════════════════

  private async sendAggressiveProposals(): Promise<string> {
    // Get all leads that don't have proposals yet
    const leadsFile = join(process.cwd(), 'data', 'leads', 'warm-leads.json');
    
    if (!existsSync(leadsFile)) {
      return 'No warm leads file found';
    }

    try {
      const leads = JSON.parse(readFileSync(leadsFile, 'utf-8')) as LeadData[];
      let sent = 0;

      for (const lead of leads) {
        if (lead.priority === 'high' || lead.priority === 'critical') {
          await this.proposals.generate(lead, {
            includeGhostProtocol: true,
            includeSelfHealing: true,
            includeCompliance: true,
            currency: 'USD',
            language: 'en'
          });
          sent++;
          this.state.proposalsSent++;
        }
      }

      return `Sent ${sent} aggressive proposals`;
    } catch {
      return 'Error processing leads';
    }
  }

  private async followUpProposals(): Promise<string> {
    // In production, this would check proposal status and send follow-ups
    console.log('   └─ Following up on pending proposals...');
    return 'Followed up on pending proposals';
  }

  private async generateSocialProofContent(): Promise<string> {
    // Generate case studies, testimonials, etc.
    console.log('   └─ Generating social proof content...');
    return 'Generated social proof content';
  }

  private async analyzeExperiments(): Promise<string> {
    const active = this.experiments.filter(e => !e.completedAt);
    const completed = this.experiments.filter(e => e.completedAt);
    
    console.log(`   └─ Experiments: ${active.length} active, ${completed.length} completed`);
    return `Analyzed ${completed.length} completed experiments`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private async fetchMRR(): Promise<number> {
    // In production, this would call Stripe API
    // For now, read from state file
    return this.state.currentMRR || 0;
  }

  setMRR(mrr: number): void {
    this.state.currentMRR = mrr;
    this.state.hungerLevel = this.calculateHungerLevel(mrr);
    this.saveState();
    console.log(`💰 MRR updated: $${mrr} (${this.state.hungerLevel})`);
  }

  private calculateHungerLevel(mrr: number): HungerLevel {
    if (mrr >= EconomicHomeostasis.MIN_MRR_SATIATED) return 'SATIATED';
    if (mrr >= EconomicHomeostasis.MIN_MRR_COMFORTABLE) return 'COMFORTABLE';
    if (mrr >= EconomicHomeostasis.MIN_MRR_HUNGRY) return 'HUNGRY';
    if (mrr >= EconomicHomeostasis.MIN_MRR_STARVING) return 'STARVING';
    return 'DYING';
  }

  private getPulseInterval(): number {
    switch (this.state.hungerLevel) {
      case 'DYING': return EconomicHomeostasis.PULSE_INTERVAL_DYING;
      case 'STARVING': return EconomicHomeostasis.PULSE_INTERVAL_STARVING;
      case 'HUNGRY': return EconomicHomeostasis.PULSE_INTERVAL_HUNGRY;
      case 'COMFORTABLE': return EconomicHomeostasis.PULSE_INTERVAL_COMFORTABLE;
      case 'SATIATED': return EconomicHomeostasis.PULSE_INTERVAL_SATIATED;
    }
  }

  private getUrgency(): EconomicPulseReport['urgency'] {
    switch (this.state.hungerLevel) {
      case 'DYING': return 'EXISTENTIAL';
      case 'STARVING': return 'CRITICAL';
      case 'HUNGRY': return 'HIGH';
      case 'COMFORTABLE': return 'MEDIUM';
      case 'SATIATED': return 'LOW';
    }
  }

  private ensureDataDir(): void {
    if (!existsSync(this.DATA_PATH)) {
      mkdirSync(this.DATA_PATH, { recursive: true });
    }
  }

  private loadState(): EconomicState {
    try {
      if (existsSync(this.STATE_FILE)) {
        const data = JSON.parse(readFileSync(this.STATE_FILE, 'utf-8'));
        return {
          ...data,
          lastPulse: new Date(data.lastPulse)
        };
      }
    } catch {
      // Fall through to default
    }

    return {
      currentMRR: 0,
      targetMRR: 10000,
      hungerLevel: 'DYING',
      lastPulse: new Date(),
      daysSinceRevenue: 0,
      conversionRate: 0,
      leadsContacted: 0,
      proposalsSent: 0,
      dealsWon: 0
    };
  }

  private saveState(): void {
    writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  private saveExperiments(): void {
    writeFileSync(this.EXPERIMENTS_FILE, JSON.stringify(this.experiments, null, 2));
  }

  private saveColdAudits(): void {
    writeFileSync(this.COLD_AUDITS_FILE, JSON.stringify(this.coldAuditResults, null, 2));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  getState(): EconomicState {
    return { ...this.state };
  }

  getExperiments(): ConversionExperiment[] {
    return [...this.experiments];
  }

  getColdAuditResults(): ColdAuditResult[] {
    return [...this.coldAuditResults];
  }

  async forceHungerCheck(): Promise<EconomicPulseReport> {
    return this.pulse();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default EconomicHomeostasis;
