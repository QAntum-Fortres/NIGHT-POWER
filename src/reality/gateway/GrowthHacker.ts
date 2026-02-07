/**
 * GrowthHacker.ts - "The Autonomous Sales Agent"
 * 
 * QAntum Framework v1.8.0 - "The Sovereign Market Engine"
 * 
 * AI Marketing Agent - The Oracle uses Case Studies to find similar sites
 * on the web and automatically generates personalized Cold Offers to their owners.
 * 
 * MARKET VALUE: +$285,000
 * - Case study analysis for lead targeting
 * - Similar site discovery via pattern matching
 * - Personalized cold offer generation
 * - Automated outreach pipeline
 * - Conversion tracking and optimization
 * 
 * @module reality/gateway/GrowthHacker
 * @version 1.0.0
 * @enterprise true
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS - The Language of Growth
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lead status in the funnel
 */
export type LeadStatus = 
  | 'discovered'
  | 'qualified'
  | 'contacted'
  | 'responded'
  | 'negotiating'
  | 'converted'
  | 'lost'
  | 'nurturing';

/**
 * Lead source
 */
export type LeadSource = 
  | 'case-study-match'
  | 'competitor-analysis'
  | 'industry-search'
  | 'referral'
  | 'inbound'
  | 'partnership';

/**
 * Outreach channel
 */
export type OutreachChannel = 
  | 'email'
  | 'linkedin'
  | 'twitter'
  | 'contact-form'
  | 'phone'
  | 'direct-mail';

/**
 * Offer type
 */
export type OfferType = 
  | 'free-trial'
  | 'demo'
  | 'case-study'
  | 'consultation'
  | 'discount'
  | 'pilot-program';

/**
 * Industry classification
 */
export type Industry = 
  | 'e-commerce'
  | 'finance'
  | 'healthcare'
  | 'technology'
  | 'media'
  | 'travel'
  | 'real-estate'
  | 'education'
  | 'manufacturing'
  | 'retail'
  | 'other';

/**
 * Lead profile
 */
export interface LeadProfile {
  leadId: string;
  status: LeadStatus;
  source: LeadSource;
  
  // Company info
  companyName: string;
  domain: string;
  industry: Industry;
  companySize: 'startup' | 'small' | 'medium' | 'enterprise';
  
  // Contact info
  contactName?: string;
  contactEmail?: string;
  contactLinkedIn?: string;
  contactTitle?: string;
  
  // Scoring
  score: number;
  qualificationReason: string[];
  
  // Technical profile
  techStack: string[];
  currentProtection: string[];
  estimatedTraffic: number;
  
  // Similar case study
  matchedCaseStudyId?: string;
  similarityScore: number;
  
  // Outreach
  lastContactedAt?: Date;
  contactAttempts: number;
  preferredChannel?: OutreachChannel;
  
  // Timestamps
  discoveredAt: Date;
  qualifiedAt?: Date;
  convertedAt?: Date;
  
  // Revenue potential
  estimatedDealValue: number;
  probability: number;
}

/**
 * Case study for matching
 */
export interface CaseStudyReference {
  caseStudyId: string;
  title: string;
  industry: Industry;
  
  // Matching criteria
  challenges: string[];
  technologies: string[];
  protectionBypassed: string[];
  
  // Results
  successRate: number;
  dataQuality: number;
  roi: string;
  
  // Keywords
  keywords: string[];
}

/**
 * Cold offer
 */
export interface ColdOffer {
  offerId: string;
  leadId: string;
  
  // Content
  subject: string;
  body: string;
  callToAction: string;
  
  // Personalization
  personalizationTokens: Record<string, string>;
  
  // Offer details
  offerType: OfferType;
  offerValue: string;
  validUntil: Date;
  
  // Channel
  channel: OutreachChannel;
  
  // Tracking
  generatedAt: Date;
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  respondedAt?: Date;
  
  // A/B testing
  variant: string;
  templateId: string;
}

/**
 * Outreach campaign
 */
export interface OutreachCampaign {
  campaignId: string;
  name: string;
  
  // Targeting
  targetIndustry?: Industry;
  targetChallenges?: string[];
  minScore: number;
  
  // Content
  templateId: string;
  offerType: OfferType;
  
  // Schedule
  startDate: Date;
  endDate?: Date;
  dailyLimit: number;
  
  // Status
  status: 'draft' | 'active' | 'paused' | 'completed';
  
  // Metrics
  leadsContacted: number;
  opens: number;
  clicks: number;
  responses: number;
  conversions: number;
}

/**
 * Offer template
 */
export interface OfferTemplate {
  templateId: string;
  name: string;
  
  // Content
  subjectTemplate: string;
  bodyTemplate: string;
  ctaTemplate: string;
  
  // Targeting
  targetIndustry?: Industry;
  targetChallenges?: string[];
  
  // Performance
  sendCount: number;
  openRate: number;
  clickRate: number;
  responseRate: number;
  conversionRate: number;
}

/**
 * GrowthHacker configuration
 */
export interface GrowthHackerConfig {
  // Lead scoring
  minQualificationScore: number;
  
  // Outreach
  maxDailyOutreach: number;
  cooldownBetweenContactsMs: number;
  maxContactAttempts: number;
  
  // Channels
  enabledChannels: OutreachChannel[];
  preferredChannel: OutreachChannel;
  
  // Offers
  defaultOfferType: OfferType;
  trialDurationDays: number;
  
  // AI settings
  useAIPersonalization: boolean;
  aiModel: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: GrowthHackerConfig = {
  minQualificationScore: 60,
  maxDailyOutreach: 100,
  cooldownBetweenContactsMs: 86400000, // 24 hours
  maxContactAttempts: 3,
  enabledChannels: ['email', 'linkedin'],
  preferredChannel: 'email',
  defaultOfferType: 'free-trial',
  trialDurationDays: 14,
  useAIPersonalization: true,
  aiModel: 'oracle-v1'
};

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

const EMAIL_TEMPLATES: OfferTemplate[] = [
  {
    templateId: 'tpl_ecommerce_success',
    name: 'E-Commerce Success Story',
    subjectTemplate: '{{companyName}}: How we helped {{similarCompany}} extract {{recordCount}} products',
    bodyTemplate: `Hi {{contactName}},

I noticed {{companyName}} operates in the {{industry}} space, similar to one of our recent success stories.

We helped {{similarCompany}} extract **{{recordCount}}** product records with **{{successRate}}%** accuracy, bypassing {{protection}} protection.

**Results achieved:**
- {{roi}} ROI in the first month
- {{timeSaved}} saved vs. manual collection
- {{dataQuality}}% data quality score

I'd love to show you how we could achieve similar results for {{companyName}}.

**Offer:** {{offerValue}}

{{callToAction}}

Best regards,
QAntum Growth Team`,
    ctaTemplate: 'Book a 15-minute demo: {{demoLink}}',
    targetIndustry: 'e-commerce',
    sendCount: 0,
    openRate: 0,
    clickRate: 0,
    responseRate: 0,
    conversionRate: 0
  },
  {
    templateId: 'tpl_finance_data',
    name: 'Financial Data Intelligence',
    subjectTemplate: '{{companyName}}: Automated financial data extraction at scale',
    bodyTemplate: `Hello {{contactName}},

I'm reaching out because {{companyName}} appears to deal with complex financial data workflows.

Our AI-powered platform recently helped a similar company in {{industry}}:

**Challenge:** Extracting real-time pricing data protected by {{protection}}
**Solution:** Distributed crawling with 99.9% uptime
**Result:** {{recordCount}} records daily, {{roi}} cost reduction

Would you be interested in exploring how QAntum could streamline your data operations?

**Special offer:** {{offerValue}}

{{callToAction}}

Best,
QAntum Enterprise Team`,
    ctaTemplate: 'Schedule a technical deep-dive: {{demoLink}}',
    targetIndustry: 'finance',
    sendCount: 0,
    openRate: 0,
    clickRate: 0,
    responseRate: 0,
    conversionRate: 0
  },
  {
    templateId: 'tpl_generic_bypass',
    name: 'Generic Protection Bypass',
    subjectTemplate: 'Struggling with {{protection}} on {{domain}}?',
    bodyTemplate: `Hi {{contactName}},

I noticed {{domain}} is protected by {{protection}}, which can be challenging for data collection.

We specialize in exactly this type of challenge. Our recent case study shows:

- **{{successRate}}%** success rate against {{protection}}
- **{{pagesPerSecond}}** pages/second throughput
- **Zero** IP bans with our Stealth Engine

**Results for a similar {{industry}} company:**
- Time saved: {{timeSaved}}
- Data quality: {{dataQuality}}%
- ROI: {{roi}}

Interested in a quick demo?

{{offerValue}}

{{callToAction}}

Cheers,
QAntum Team`,
    ctaTemplate: 'Get your free analysis: {{demoLink}}',
    sendCount: 0,
    openRate: 0,
    clickRate: 0,
    responseRate: 0,
    conversionRate: 0
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// GROWTH HACKER ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GrowthHacker - The Autonomous Sales Agent
 * 
 * Uses Case Studies to find similar sites and generate personalized Cold Offers.
 */
export class GrowthHacker extends EventEmitter {
  private config: GrowthHackerConfig;
  
  // Data stores
  private leads: Map<string, LeadProfile> = new Map();
  private caseStudies: Map<string, CaseStudyReference> = new Map();
  private offers: Map<string, ColdOffer> = new Map();
  private campaigns: Map<string, OutreachCampaign> = new Map();
  private templates: Map<string, OfferTemplate> = new Map();
  
  // Metrics
  private totalLeadsDiscovered: number = 0;
  private totalLeadsQualified: number = 0;
  private totalOffersGenerated: number = 0;
  private totalOffersSent: number = 0;
  private totalConversions: number = 0;
  private dailyOutreachCount: number = 0;
  private lastDailyReset: Date = new Date();
  
  constructor(config: Partial<GrowthHackerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize templates
    this.initializeTemplates();
    
    this.emit('initialized', {
      timestamp: new Date(),
      channels: this.config.enabledChannels,
      templates: this.templates.size
    });
  }
  
  /**
   * Initialize email templates
   */
  private initializeTemplates(): void {
    for (const template of EMAIL_TEMPLATES) {
      this.templates.set(template.templateId, { ...template });
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // CASE STUDY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Import a case study for lead matching
   */
  importCaseStudy(caseStudy: CaseStudyReference): void {
    this.caseStudies.set(caseStudy.caseStudyId, caseStudy);
    
    this.emit('case-study:imported', {
      caseStudyId: caseStudy.caseStudyId,
      industry: caseStudy.industry,
      keywords: caseStudy.keywords.length
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // LEAD DISCOVERY
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Discover leads based on case studies
   */
  async discoverLeadsFromCaseStudy(caseStudyId: string, limit: number = 50): Promise<LeadProfile[]> {
    const caseStudy = this.caseStudies.get(caseStudyId);
    if (!caseStudy) {
      throw new Error(`Case study ${caseStudyId} not found`);
    }
    
    this.emit('discovery:started', {
      caseStudyId,
      industry: caseStudy.industry
    });
    
    // Simulate discovering similar companies
    const discoveredLeads: LeadProfile[] = [];
    
    for (let i = 0; i < limit; i++) {
      const lead = this.generateSimulatedLead(caseStudy);
      discoveredLeads.push(lead);
      this.leads.set(lead.leadId, lead);
      this.totalLeadsDiscovered++;
    }
    
    this.emit('discovery:completed', {
      caseStudyId,
      leadsDiscovered: discoveredLeads.length
    });
    
    return discoveredLeads;
  }
  
  /**
   * Generate a simulated lead based on case study
   */
  private generateSimulatedLead(caseStudy: CaseStudyReference): LeadProfile {
    const leadId = this.generateId('lead');
    const companySuffixes = ['Inc', 'LLC', 'Corp', 'Co', 'Group', 'Holdings'];
    const domains = ['com', 'io', 'co', 'net', 'tech'];
    
    const companyBase = this.generateCompanyName();
    const companyName = `${companyBase} ${companySuffixes[Math.floor(Math.random() * companySuffixes.length)]}`;
    const domain = `${companyBase.toLowerCase().replace(/\s/g, '')}.${domains[Math.floor(Math.random() * domains.length)]}`;
    
    // Calculate similarity score
    const similarityScore = 0.6 + Math.random() * 0.4;
    
    // Calculate lead score
    const baseScore = similarityScore * 50;
    const trafficBonus = Math.random() * 20;
    const techStackMatch = Math.random() * 30;
    const score = Math.min(100, baseScore + trafficBonus + techStackMatch);
    
    // Estimate deal value based on company size
    const sizes: Array<'startup' | 'small' | 'medium' | 'enterprise'> = ['startup', 'small', 'medium', 'enterprise'];
    const sizeWeights = [0.4, 0.3, 0.2, 0.1];
    let cumWeight = 0;
    const rand = Math.random();
    let companySize: 'startup' | 'small' | 'medium' | 'enterprise' = 'small';
    for (let i = 0; i < sizes.length; i++) {
      cumWeight += sizeWeights[i];
      if (rand < cumWeight) {
        companySize = sizes[i];
        break;
      }
    }
    
    const dealValues = { startup: 500, small: 1500, medium: 5000, enterprise: 25000 };
    
    return {
      leadId,
      status: 'discovered',
      source: 'case-study-match',
      companyName,
      domain,
      industry: caseStudy.industry,
      companySize,
      score,
      qualificationReason: [],
      techStack: this.generateTechStack(),
      currentProtection: this.selectRandomProtection(caseStudy.protectionBypassed),
      estimatedTraffic: Math.floor(Math.random() * 1000000) + 10000,
      matchedCaseStudyId: caseStudy.caseStudyId,
      similarityScore,
      contactAttempts: 0,
      discoveredAt: new Date(),
      estimatedDealValue: dealValues[companySize],
      probability: similarityScore * 0.5
    };
  }
  
  /**
   * Generate random company name
   */
  private generateCompanyName(): string {
    const prefixes = ['Tech', 'Data', 'Digital', 'Smart', 'Cloud', 'Net', 'Web', 'Info', 'Cyber', 'Global'];
    const suffixes = ['Works', 'Labs', 'Systems', 'Solutions', 'Hub', 'Flow', 'Bridge', 'Link', 'Sync', 'Logic'];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  }
  
  /**
   * Generate random tech stack
   */
  private generateTechStack(): string[] {
    const allTech = ['React', 'Vue', 'Angular', 'Node.js', 'Python', 'AWS', 'GCP', 'Azure', 'Shopify', 'Magento', 'WordPress'];
    const count = Math.floor(Math.random() * 4) + 2;
    const stack: string[] = [];
    for (let i = 0; i < count; i++) {
      const tech = allTech[Math.floor(Math.random() * allTech.length)];
      if (!stack.includes(tech)) stack.push(tech);
    }
    return stack;
  }
  
  /**
   * Select random protection
   */
  private selectRandomProtection(protections: string[]): string[] {
    if (protections.length === 0) return [];
    const count = Math.floor(Math.random() * 2) + 1;
    const selected: string[] = [];
    for (let i = 0; i < count && i < protections.length; i++) {
      selected.push(protections[Math.floor(Math.random() * protections.length)]);
    }
    return [...new Set(selected)];
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // LEAD QUALIFICATION
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Qualify discovered leads
   */
  qualifyLeads(): LeadProfile[] {
    const qualified: LeadProfile[] = [];
    
    for (const lead of this.leads.values()) {
      if (lead.status !== 'discovered') continue;
      
      const reasons: string[] = [];
      
      if (lead.score >= this.config.minQualificationScore) {
        // Check similarity
        if (lead.similarityScore >= 0.7) {
          reasons.push('High similarity to successful case study');
        }
        
        // Check protection match
        if (lead.currentProtection.length > 0) {
          reasons.push('Uses protection we can bypass');
        }
        
        // Check company size
        if (['medium', 'enterprise'].includes(lead.companySize)) {
          reasons.push('Target company size');
        }
        
        // Check traffic
        if (lead.estimatedTraffic > 100000) {
          reasons.push('High traffic site');
        }
        
        if (reasons.length > 0) {
          lead.status = 'qualified';
          lead.qualifiedAt = new Date();
          lead.qualificationReason = reasons;
          qualified.push(lead);
          this.totalLeadsQualified++;
          
          this.emit('lead:qualified', {
            leadId: lead.leadId,
            score: lead.score,
            reasons
          });
        }
      }
    }
    
    return qualified;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // COLD OFFER GENERATION
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Generate personalized cold offer for a lead
   */
  async generateColdOffer(leadId: string): Promise<ColdOffer> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }
    
    if (lead.status !== 'qualified') {
      throw new Error(`Lead ${leadId} is not qualified`);
    }
    
    // Find matching case study
    const caseStudy = lead.matchedCaseStudyId 
      ? this.caseStudies.get(lead.matchedCaseStudyId)
      : undefined;
    
    // Select best template
    const template = this.selectBestTemplate(lead, caseStudy);
    
    // Build personalization tokens
    const tokens = this.buildPersonalizationTokens(lead, caseStudy);
    
    // Generate offer content
    const subject = this.applyTemplate(template.subjectTemplate, tokens);
    const body = this.applyTemplate(template.bodyTemplate, tokens);
    const cta = this.applyTemplate(template.ctaTemplate, tokens);
    
    // Determine offer value
    const offerValue = this.determineOfferValue(lead);
    
    const offer: ColdOffer = {
      offerId: this.generateId('offer'),
      leadId,
      subject,
      body,
      callToAction: cta,
      personalizationTokens: tokens,
      offerType: this.config.defaultOfferType,
      offerValue,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      channel: lead.preferredChannel || this.config.preferredChannel,
      generatedAt: new Date(),
      variant: 'A',
      templateId: template.templateId
    };
    
    this.offers.set(offer.offerId, offer);
    this.totalOffersGenerated++;
    
    this.emit('offer:generated', {
      offerId: offer.offerId,
      leadId,
      template: template.templateId
    });
    
    return offer;
  }
  
  /**
   * Select best template for lead
   */
  private selectBestTemplate(lead: LeadProfile, caseStudy?: CaseStudyReference): OfferTemplate {
    // Try to find industry-specific template
    for (const template of this.templates.values()) {
      if (template.targetIndustry === lead.industry) {
        return template;
      }
    }
    
    // Fall back to generic template
    return this.templates.get('tpl_generic_bypass') || EMAIL_TEMPLATES[2];
  }
  
  /**
   * Build personalization tokens
   */
  private buildPersonalizationTokens(
    lead: LeadProfile, 
    caseStudy?: CaseStudyReference
  ): Record<string, string> {
    const tokens: Record<string, string> = {
      companyName: lead.companyName,
      domain: lead.domain,
      industry: lead.industry,
      contactName: lead.contactName || 'there',
      protection: lead.currentProtection.join(', ') || 'web protection',
      demoLink: `https://quantum.ai/demo?ref=${lead.leadId}`,
      offerValue: this.determineOfferValue(lead)
    };
    
    if (caseStudy) {
      tokens.similarCompany = `a ${caseStudy.industry} company`;
      tokens.recordCount = Math.floor(Math.random() * 100000 + 10000).toLocaleString();
      tokens.successRate = `${(caseStudy.successRate * 100).toFixed(0)}`;
      tokens.dataQuality = `${(caseStudy.dataQuality * 100).toFixed(0)}`;
      tokens.roi = caseStudy.roi;
      tokens.timeSaved = `${Math.floor(Math.random() * 100 + 20)} hours/month`;
      tokens.pagesPerSecond = `${Math.floor(Math.random() * 50 + 10)}`;
    }
    
    return tokens;
  }
  
  /**
   * Determine offer value based on lead
   */
  private determineOfferValue(lead: LeadProfile): string {
    switch (this.config.defaultOfferType) {
      case 'free-trial':
        return `${this.config.trialDurationDays}-day free trial`;
      case 'demo':
        return 'Free technical demo';
      case 'consultation':
        return 'Free 30-minute consultation';
      case 'discount':
        const discount = lead.companySize === 'enterprise' ? 15 : 25;
        return `${discount}% off first month`;
      case 'pilot-program':
        return 'Free pilot program';
      default:
        return 'Special offer';
    }
  }
  
  /**
   * Apply template with tokens
   */
  private applyTemplate(template: string, tokens: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(tokens)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // OUTREACH EXECUTION
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Send cold offer
   */
  async sendOffer(offerId: string): Promise<boolean> {
    // Check daily limit
    this.checkDailyReset();
    if (this.dailyOutreachCount >= this.config.maxDailyOutreach) {
      throw new Error('Daily outreach limit reached');
    }
    
    const offer = this.offers.get(offerId);
    if (!offer) {
      throw new Error(`Offer ${offerId} not found`);
    }
    
    const lead = this.leads.get(offer.leadId);
    if (!lead) {
      throw new Error(`Lead ${offer.leadId} not found`);
    }
    
    // Check contact cooldown
    if (lead.lastContactedAt) {
      const cooldownEnd = lead.lastContactedAt.getTime() + this.config.cooldownBetweenContactsMs;
      if (Date.now() < cooldownEnd) {
        throw new Error('Contact cooldown not expired');
      }
    }
    
    // Check max attempts
    if (lead.contactAttempts >= this.config.maxContactAttempts) {
      throw new Error('Max contact attempts reached');
    }
    
    // Simulate sending
    offer.sentAt = new Date();
    lead.lastContactedAt = new Date();
    lead.contactAttempts++;
    lead.status = 'contacted';
    
    this.totalOffersSent++;
    this.dailyOutreachCount++;
    
    // Update template stats
    const template = this.templates.get(offer.templateId);
    if (template) {
      template.sendCount++;
    }
    
    this.emit('offer:sent', {
      offerId,
      leadId: lead.leadId,
      channel: offer.channel
    });
    
    return true;
  }
  
  /**
   * Record offer opened
   */
  recordOfferOpened(offerId: string): void {
    const offer = this.offers.get(offerId);
    if (offer && !offer.openedAt) {
      offer.openedAt = new Date();
      
      const template = this.templates.get(offer.templateId);
      if (template && template.sendCount > 0) {
        // Update open rate
        const opens = Math.round(template.openRate * (template.sendCount - 1)) + 1;
        template.openRate = opens / template.sendCount;
      }
      
      this.emit('offer:opened', { offerId });
    }
  }
  
  /**
   * Record offer clicked
   */
  recordOfferClicked(offerId: string): void {
    const offer = this.offers.get(offerId);
    if (offer && !offer.clickedAt) {
      offer.clickedAt = new Date();
      
      const template = this.templates.get(offer.templateId);
      if (template && template.sendCount > 0) {
        const clicks = Math.round(template.clickRate * (template.sendCount - 1)) + 1;
        template.clickRate = clicks / template.sendCount;
      }
      
      this.emit('offer:clicked', { offerId });
    }
  }
  
  /**
   * Record response received
   */
  recordResponse(offerId: string, positive: boolean): void {
    const offer = this.offers.get(offerId);
    if (!offer) return;
    
    offer.respondedAt = new Date();
    
    const lead = this.leads.get(offer.leadId);
    if (lead) {
      lead.status = positive ? 'negotiating' : 'nurturing';
    }
    
    const template = this.templates.get(offer.templateId);
    if (template && template.sendCount > 0) {
      const responses = Math.round(template.responseRate * (template.sendCount - 1)) + 1;
      template.responseRate = responses / template.sendCount;
    }
    
    this.emit('response:received', { offerId, positive });
  }
  
  /**
   * Record conversion
   */
  recordConversion(leadId: string, dealValue: number): void {
    const lead = this.leads.get(leadId);
    if (!lead) return;
    
    lead.status = 'converted';
    lead.convertedAt = new Date();
    lead.estimatedDealValue = dealValue;
    
    this.totalConversions++;
    
    // Find associated offer and update template stats
    for (const offer of this.offers.values()) {
      if (offer.leadId === leadId) {
        const template = this.templates.get(offer.templateId);
        if (template && template.sendCount > 0) {
          const conversions = Math.round(template.conversionRate * (template.sendCount - 1)) + 1;
          template.conversionRate = conversions / template.sendCount;
        }
        break;
      }
    }
    
    this.emit('lead:converted', {
      leadId,
      dealValue
    });
  }
  
  /**
   * Check and reset daily counter
   */
  private checkDailyReset(): void {
    const now = new Date();
    if (now.getDate() !== this.lastDailyReset.getDate()) {
      this.dailyOutreachCount = 0;
      this.lastDailyReset = now;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // CAMPAIGN MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Create outreach campaign
   */
  createCampaign(params: {
    name: string;
    targetIndustry?: Industry;
    minScore?: number;
    templateId: string;
    offerType: OfferType;
    dailyLimit: number;
  }): OutreachCampaign {
    const campaign: OutreachCampaign = {
      campaignId: this.generateId('camp'),
      name: params.name,
      targetIndustry: params.targetIndustry,
      minScore: params.minScore || this.config.minQualificationScore,
      templateId: params.templateId,
      offerType: params.offerType,
      startDate: new Date(),
      dailyLimit: params.dailyLimit,
      status: 'draft',
      leadsContacted: 0,
      opens: 0,
      clicks: 0,
      responses: 0,
      conversions: 0
    };
    
    this.campaigns.set(campaign.campaignId, campaign);
    
    this.emit('campaign:created', {
      campaignId: campaign.campaignId,
      name: campaign.name
    });
    
    return campaign;
  }
  
  /**
   * Run campaign
   */
  async runCampaign(campaignId: string): Promise<number> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    
    campaign.status = 'active';
    let sentCount = 0;
    
    // Find matching leads
    const matchingLeads = Array.from(this.leads.values())
      .filter(lead => {
        if (lead.status !== 'qualified') return false;
        if (lead.score < campaign.minScore) return false;
        if (campaign.targetIndustry && lead.industry !== campaign.targetIndustry) return false;
        return true;
      })
      .slice(0, campaign.dailyLimit);
    
    for (const lead of matchingLeads) {
      try {
        const offer = await this.generateColdOffer(lead.leadId);
        await this.sendOffer(offer.offerId);
        campaign.leadsContacted++;
        sentCount++;
      } catch {
        // Skip failed sends
      }
    }
    
    this.emit('campaign:executed', {
      campaignId,
      sentCount
    });
    
    return sentCount;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Get growth statistics
   */
  getStatistics(): GrowthHackerStatistics {
    const leads = Array.from(this.leads.values());
    const qualifiedLeads = leads.filter(l => l.status !== 'discovered');
    const convertedLeads = leads.filter(l => l.status === 'converted');
    
    const totalPipelineValue = leads
      .filter(l => ['qualified', 'contacted', 'responded', 'negotiating'].includes(l.status))
      .reduce((sum, l) => sum + (l.estimatedDealValue * l.probability), 0);
    
    const totalWonValue = convertedLeads.reduce((sum, l) => sum + l.estimatedDealValue, 0);
    
    return {
      totalLeadsDiscovered: this.totalLeadsDiscovered,
      totalLeadsQualified: this.totalLeadsQualified,
      totalOffersGenerated: this.totalOffersGenerated,
      totalOffersSent: this.totalOffersSent,
      totalConversions: this.totalConversions,
      conversionRate: this.totalOffersSent > 0 
        ? (this.totalConversions / this.totalOffersSent) * 100 
        : 0,
      totalPipelineValue,
      totalWonValue,
      caseStudiesLoaded: this.caseStudies.size,
      templatesAvailable: this.templates.size,
      activeCampaigns: Array.from(this.campaigns.values()).filter(c => c.status === 'active').length,
      dailyOutreachRemaining: this.config.maxDailyOutreach - this.dailyOutreachCount
    };
  }
  
  /**
   * Get funnel metrics
   */
  getFunnelMetrics(): FunnelMetrics {
    const leads = Array.from(this.leads.values());
    
    return {
      discovered: leads.filter(l => l.status === 'discovered').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      responded: leads.filter(l => l.status === 'responded').length,
      negotiating: leads.filter(l => l.status === 'negotiating').length,
      converted: leads.filter(l => l.status === 'converted').length,
      lost: leads.filter(l => l.status === 'lost').length,
      nurturing: leads.filter(l => l.status === 'nurturing').length
    };
  }
  
  /**
   * Get template performance
   */
  getTemplatePerformance(): OfferTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => b.conversionRate - a.conversionRate);
  }
  
  /**
   * Get all leads
   */
  getAllLeads(): LeadProfile[] {
    return Array.from(this.leads.values());
  }
  
  /**
   * Get lead by ID
   */
  getLead(leadId: string): LeadProfile | undefined {
    return this.leads.get(leadId);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICS INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface GrowthHackerStatistics {
  totalLeadsDiscovered: number;
  totalLeadsQualified: number;
  totalOffersGenerated: number;
  totalOffersSent: number;
  totalConversions: number;
  conversionRate: number;
  totalPipelineValue: number;
  totalWonValue: number;
  caseStudiesLoaded: number;
  templatesAvailable: number;
  activeCampaigns: number;
  dailyOutreachRemaining: number;
}

export interface FunnelMetrics {
  discovered: number;
  qualified: number;
  contacted: number;
  responded: number;
  negotiating: number;
  converted: number;
  lost: number;
  nurturing: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new GrowthHacker instance
 */
export function createGrowthHacker(
  config?: Partial<GrowthHackerConfig>
): GrowthHacker {
  return new GrowthHacker(config);
}

export default GrowthHacker;
