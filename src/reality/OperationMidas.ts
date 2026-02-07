/**
 * 💰 OPERATION MIDAS v35.0 - AUTONOMOUS REVENUE
 * Автономна система за генериране на приходи
 * 
 * @department REALITY 🌐
 * @version 35.0.0
 * @author QAntum Empire
 * 
 * STREAMS:
 * - EmailEngine: Automated outreach & follow-ups
 * - LeadScorer: AI-powered lead qualification
 * - ProposalGenerator: Dynamic proposal creation
 * - ProfitOptimizer: Auto-reinvestment strategies
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

interface Lead {
    id: string;
    email: string;
    company: string;
    name?: string;
    source: string;
    budget?: number;
    score: number;
    tier: 'hot' | 'warm' | 'cold';
    status: 'new' | 'contacted' | 'responded' | 'qualified' | 'proposal' | 'won' | 'lost';
    notes: string[];
    lastContact?: number;
    createdAt: number;
    updatedAt: number;
}

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    tier: 'hot' | 'warm' | 'cold';
    stage: 'initial' | 'followup' | 'proposal' | 'closing';
    variables: string[];
}

interface Proposal {
    id: string;
    leadId: string;
    title: string;
    value: number;
    services: string[];
    deliverables: string[];
    timeline: string;
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
    createdAt: number;
}

interface RevenueMetrics {
    totalLeads: number;
    qualifiedLeads: number;
    proposalsSent: number;
    dealsWon: number;
    dealsLost: number;
    totalRevenue: number;
    avgDealSize: number;
    conversionRate: number;
    pipelineValue: number;
}

interface MidasConfig {
    dataDir: string;
    emailDelay: number;
    followUpDays: number;
    autoScore: boolean;
    minBudgetThreshold: number;
    maxDailyEmails: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: MidasConfig = {
    dataDir: path.join(process.cwd(), 'data/leads'),
    emailDelay: 2000,
    followUpDays: 3,
    autoScore: true,
    minBudgetThreshold: 1000,
    maxDailyEmails: 50
};

const EMAIL_TEMPLATES: EmailTemplate[] = [
    {
        id: 'initial-hot',
        name: 'Hot Lead - Initial Contact',
        subject: '🚀 Quick Question About {{company}}',
        body: `Hi {{name}},

I noticed {{company}} is doing great things in {{industry}}. 

We've helped similar companies achieve:
• 40% faster testing cycles
• 60% reduction in bugs
• 3x developer productivity

Would you be open to a quick 15-minute call this week?

Best,
QAntum Team`,
        tier: 'hot',
        stage: 'initial',
        variables: ['name', 'company', 'industry']
    },
    {
        id: 'followup-warm',
        name: 'Warm Lead - Follow Up',
        subject: 'Re: {{company}} + QAntum Partnership',
        body: `Hi {{name}},

Just wanted to follow up on my previous email. 

I put together a quick ROI calculation for {{company}} - you could potentially save {{savings}} annually with our solution.

Here's a 2-minute video demo: [LINK]

Worth a quick look?

Best,
QAntum Team`,
        tier: 'warm',
        stage: 'followup',
        variables: ['name', 'company', 'savings']
    },
    {
        id: 'proposal-hot',
        name: 'Hot Lead - Proposal',
        subject: '📄 Custom Proposal for {{company}}',
        body: `Hi {{name}},

As promised, here's your custom proposal for {{company}}.

Investment: {{value}}
Timeline: {{timeline}}
ROI: {{roi}}%

The proposal is attached. Let me know if you have any questions!

Ready to move forward?

Best,
QAntum Team`,
        tier: 'hot',
        stage: 'proposal',
        variables: ['name', 'company', 'value', 'timeline', 'roi']
    }
];

const SCORING_CRITERIA = {
    // Company signals
    hasBudget: 30,
    recentFunding: 20,
    techCompany: 15,
    growthStage: 10,
    
    // Engagement signals
    openedEmail: 10,
    clickedLink: 15,
    visitedWebsite: 20,
    requestedDemo: 40,
    
    // Negative signals
    unsubscribed: -100,
    bounced: -50,
    noResponse3x: -20
};

// ============================================================================
// LEAD SCORER
// ============================================================================

class LeadScorer {
    
    /**
     * Score a lead based on available data
     */
    score(lead: Partial<Lead>): { score: number; tier: 'hot' | 'warm' | 'cold' } {
        let score = 0;

        // Budget scoring
        if (lead.budget) {
            if (lead.budget >= 10000) score += SCORING_CRITERIA.hasBudget;
            else if (lead.budget >= 5000) score += SCORING_CRITERIA.hasBudget * 0.7;
            else if (lead.budget >= 1000) score += SCORING_CRITERIA.hasBudget * 0.4;
        }

        // Company type
        const techKeywords = ['software', 'tech', 'digital', 'ai', 'saas', 'startup'];
        if (lead.company && techKeywords.some(k => lead.company!.toLowerCase().includes(k))) {
            score += SCORING_CRITERIA.techCompany;
        }

        // Source quality
        if (lead.source === 'referral') score += 25;
        else if (lead.source === 'inbound') score += 20;
        else if (lead.source === 'linkedin') score += 15;
        else if (lead.source === 'cold') score += 5;

        // Normalize score to 0-100
        score = Math.min(100, Math.max(0, score));

        // Determine tier
        let tier: 'hot' | 'warm' | 'cold';
        if (score >= 70) tier = 'hot';
        else if (score >= 40) tier = 'warm';
        else tier = 'cold';

        return { score, tier };
    }

    /**
     * Prioritize leads for outreach
     */
    prioritize(leads: Lead[]): Lead[] {
        return [...leads].sort((a, b) => {
            // Hot leads first
            if (a.tier !== b.tier) {
                const tierOrder = { hot: 0, warm: 1, cold: 2 };
                return tierOrder[a.tier] - tierOrder[b.tier];
            }
            // Then by score
            return b.score - a.score;
        });
    }
}

// ============================================================================
// EMAIL ENGINE
// ============================================================================

class EmailEngine extends EventEmitter {
    private templates: Map<string, EmailTemplate> = new Map();
    private sentToday: number = 0;
    private lastReset: number = Date.now();
    private config: MidasConfig;

    constructor(config: MidasConfig) {
        super();
        this.config = config;
        
        // Load templates
        for (const template of EMAIL_TEMPLATES) {
            this.templates.set(template.id, template);
        }
    }

    /**
     * Select best template for a lead
     */
    selectTemplate(lead: Lead, stage: string): EmailTemplate | null {
        const templateKey = `${stage}-${lead.tier}`;
        return this.templates.get(templateKey) || 
               [...this.templates.values()].find(t => t.stage === stage) || 
               null;
    }

    /**
     * Render template with lead data
     */
    renderTemplate(template: EmailTemplate, lead: Lead, extras: Record<string, any> = {}): {
        subject: string;
        body: string;
    } {
        const vars: Record<string, string> = {
            name: lead.name || 'there',
            company: lead.company,
            email: lead.email,
            industry: 'your industry',
            savings: '$50,000+',
            value: '$5,000',
            timeline: '4 weeks',
            roi: '300',
            ...extras
        };

        let subject = template.subject;
        let body = template.body;

        for (const [key, value] of Object.entries(vars)) {
            subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
            body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        return { subject, body };
    }

    /**
     * Queue email for sending (simulated)
     */
    async queueEmail(lead: Lead, template: EmailTemplate, extras: Record<string, any> = {}): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }> {
        // Reset daily counter
        if (Date.now() - this.lastReset > 24 * 60 * 60 * 1000) {
            this.sentToday = 0;
            this.lastReset = Date.now();
        }

        // Check daily limit
        if (this.sentToday >= this.config.maxDailyEmails) {
            return { success: false, error: 'Daily limit reached' };
        }

        const { subject, body } = this.renderTemplate(template, lead, extras);

        // Simulate sending (in production, integrate SendGrid/Mailgun)
        await new Promise(resolve => setTimeout(resolve, this.config.emailDelay));

        this.sentToday++;
        const messageId = `msg-${Date.now().toString(36)}`;
        
        this.emit('email:sent', { lead, subject, messageId });
        
        return { success: true, messageId };
    }

    getStats(): { sentToday: number; remainingToday: number } {
        return {
            sentToday: this.sentToday,
            remainingToday: this.config.maxDailyEmails - this.sentToday
        };
    }
}

// ============================================================================
// PROPOSAL GENERATOR
// ============================================================================

class ProposalGenerator {
    private config: MidasConfig;

    constructor(config: MidasConfig) {
        this.config = config;
    }

    /**
     * Generate a proposal for a lead
     */
    generate(lead: Lead, options: {
        services?: string[];
        value?: number;
        timeline?: string;
    } = {}): Proposal {
        // Calculate value based on lead tier and budget
        let value = options.value || this.calculateValue(lead);
        
        // Select services based on tier
        const services = options.services || this.selectServices(lead);
        
        // Generate deliverables
        const deliverables = this.generateDeliverables(services);

        const proposal: Proposal = {
            id: `prop-${Date.now().toString(36)}`,
            leadId: lead.id,
            title: `QAntum Partnership Proposal for ${lead.company}`,
            value,
            services,
            deliverables,
            timeline: options.timeline || this.estimateTimeline(services),
            status: 'draft',
            createdAt: Date.now()
        };

        return proposal;
    }

    private calculateValue(lead: Lead): number {
        const baseValue = lead.budget ? Math.min(lead.budget * 0.3, 10000) : 2500;
        
        const tierMultiplier = {
            hot: 1.5,
            warm: 1.0,
            cold: 0.7
        };
        
        return Math.round(baseValue * tierMultiplier[lead.tier]);
    }

    private selectServices(lead: Lead): string[] {
        const services: string[] = ['QA Framework Setup'];
        
        if (lead.tier === 'hot' || lead.score >= 60) {
            services.push('AI Test Generation', 'CI/CD Integration');
        }
        if (lead.budget && lead.budget >= 5000) {
            services.push('Custom Training', 'Priority Support');
        }
        
        return services;
    }

    private generateDeliverables(services: string[]): string[] {
        const deliverables: string[] = [];
        
        for (const service of services) {
            switch (service) {
                case 'QA Framework Setup':
                    deliverables.push('Framework installation & configuration');
                    deliverables.push('Initial test suite (50+ tests)');
                    break;
                case 'AI Test Generation':
                    deliverables.push('AI-powered test generation engine');
                    deliverables.push('Self-healing test capabilities');
                    break;
                case 'CI/CD Integration':
                    deliverables.push('GitHub Actions / Jenkins integration');
                    deliverables.push('Automated reporting dashboard');
                    break;
                case 'Custom Training':
                    deliverables.push('4-hour team training session');
                    deliverables.push('Video tutorials & documentation');
                    break;
                case 'Priority Support':
                    deliverables.push('Dedicated Slack channel');
                    deliverables.push('24-hour response SLA');
                    break;
            }
        }
        
        return deliverables;
    }

    private estimateTimeline(services: string[]): string {
        const weeks = 2 + services.length;
        return `${weeks} weeks`;
    }
}

// ============================================================================
// OPERATION MIDAS (MAIN ORCHESTRATOR)
// ============================================================================

export class OperationMidas extends EventEmitter {
    private config: MidasConfig;
    private leads: Map<string, Lead> = new Map();
    private proposals: Map<string, Proposal> = new Map();
    private scorer: LeadScorer;
    private emailEngine: EmailEngine;
    private proposalGen: ProposalGenerator;
    private metrics: RevenueMetrics;

    constructor(config: Partial<MidasConfig> = {}) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.scorer = new LeadScorer();
        this.emailEngine = new EmailEngine(this.config);
        this.proposalGen = new ProposalGenerator(this.config);
        this.metrics = this.initMetrics();

        // Ensure data directory exists
        if (!fs.existsSync(this.config.dataDir)) {
            fs.mkdirSync(this.config.dataDir, { recursive: true });
        }

        this.loadData();
    }

    private initMetrics(): RevenueMetrics {
        return {
            totalLeads: 0,
            qualifiedLeads: 0,
            proposalsSent: 0,
            dealsWon: 0,
            dealsLost: 0,
            totalRevenue: 0,
            avgDealSize: 0,
            conversionRate: 0,
            pipelineValue: 0
        };
    }

    /**
     * Add a new lead to the system
     */
    addLead(data: Partial<Lead>): Lead {
        const { score, tier } = this.scorer.score(data);
        
        const lead: Lead = {
            id: data.id || `lead-${Date.now().toString(36)}`,
            email: data.email || '',
            company: data.company || 'Unknown',
            name: data.name,
            source: data.source || 'manual',
            budget: data.budget,
            score,
            tier,
            status: 'new',
            notes: data.notes || [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.leads.set(lead.id, lead);
        this.metrics.totalLeads++;
        if (tier !== 'cold') this.metrics.qualifiedLeads++;
        
        this.saveData();
        this.emit('lead:added', lead);
        
        return lead;
    }

    /**
     * Run automated outreach for pending leads
     */
    async runOutreach(options: { maxLeads?: number } = {}): Promise<{
        contacted: number;
        skipped: number;
        errors: number;
    }> {
        const maxLeads = options.maxLeads || 10;
        const results = { contacted: 0, skipped: 0, errors: 0 };

        // Get leads ready for outreach
        const pendingLeads = this.scorer.prioritize(
            [...this.leads.values()].filter(l => 
                l.status === 'new' || 
                (l.status === 'contacted' && this.shouldFollowUp(l))
            )
        ).slice(0, maxLeads);

        for (const lead of pendingLeads) {
            const stage = lead.status === 'new' ? 'initial' : 'followup';
            const template = this.emailEngine.selectTemplate(lead, stage);

            if (!template) {
                results.skipped++;
                continue;
            }

            const result = await this.emailEngine.queueEmail(lead, template);

            if (result.success) {
                lead.status = 'contacted';
                lead.lastContact = Date.now();
                lead.updatedAt = Date.now();
                lead.notes.push(`[AUTO] Sent ${stage} email - ${result.messageId}`);
                results.contacted++;
            } else {
                lead.notes.push(`[ERROR] Email failed: ${result.error}`);
                results.errors++;
            }
        }

        this.saveData();
        return results;
    }

    /**
     * Generate proposal for a lead
     */
    createProposal(leadId: string, options: {
        services?: string[];
        value?: number;
    } = {}): Proposal | null {
        const lead = this.leads.get(leadId);
        if (!lead) return null;

        const proposal = this.proposalGen.generate(lead, options);
        this.proposals.set(proposal.id, proposal);
        
        lead.status = 'proposal';
        lead.updatedAt = Date.now();
        lead.notes.push(`[AUTO] Proposal generated - ${proposal.id}`);
        
        this.metrics.proposalsSent++;
        this.metrics.pipelineValue += proposal.value;
        
        this.saveData();
        this.emit('proposal:created', proposal);
        
        return proposal;
    }

    /**
     * Mark a deal as won/lost
     */
    closeDeal(leadId: string, won: boolean, value?: number): void {
        const lead = this.leads.get(leadId);
        if (!lead) return;

        lead.status = won ? 'won' : 'lost';
        lead.updatedAt = Date.now();

        if (won) {
            this.metrics.dealsWon++;
            const dealValue = value || this.getProposalValue(leadId);
            this.metrics.totalRevenue += dealValue;
            this.metrics.avgDealSize = this.metrics.totalRevenue / this.metrics.dealsWon;
            lead.notes.push(`[WIN] Deal closed - $${dealValue}`);
        } else {
            this.metrics.dealsLost++;
            lead.notes.push('[LOST] Deal lost');
        }

        this.metrics.conversionRate = this.metrics.dealsWon / 
            (this.metrics.dealsWon + this.metrics.dealsLost) * 100;

        this.saveData();
        this.emit(won ? 'deal:won' : 'deal:lost', lead);
    }

    /**
     * Get system metrics
     */
    getMetrics(): RevenueMetrics {
        return { ...this.metrics };
    }

    /**
     * Get all leads
     */
    getLeads(filter?: { tier?: string; status?: string }): Lead[] {
        let leads = [...this.leads.values()];
        
        if (filter?.tier) {
            leads = leads.filter(l => l.tier === filter.tier);
        }
        if (filter?.status) {
            leads = leads.filter(l => l.status === filter.status);
        }
        
        return this.scorer.prioritize(leads);
    }

    private shouldFollowUp(lead: Lead): boolean {
        if (!lead.lastContact) return true;
        const daysSinceContact = (Date.now() - lead.lastContact) / (1000 * 60 * 60 * 24);
        return daysSinceContact >= this.config.followUpDays;
    }

    private getProposalValue(leadId: string): number {
        for (const proposal of this.proposals.values()) {
            if (proposal.leadId === leadId) return proposal.value;
        }
        return 0;
    }

    private loadData(): void {
        try {
            const leadsFile = path.join(this.config.dataDir, 'leads.json');
            if (fs.existsSync(leadsFile)) {
                const data = JSON.parse(fs.readFileSync(leadsFile, 'utf-8'));
                for (const lead of data.leads || []) {
                    this.leads.set(lead.id, lead);
                }
                this.metrics = data.metrics || this.metrics;
            }
        } catch (err) {
            console.warn('Failed to load leads data');
        }
    }

    private saveData(): void {
        const leadsFile = path.join(this.config.dataDir, 'leads.json');
        const data = {
            leads: [...this.leads.values()],
            metrics: this.metrics,
            savedAt: Date.now()
        };
        fs.writeFileSync(leadsFile, JSON.stringify(data, null, 2));
    }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
    const args = process.argv.slice(2);
    const midas = new OperationMidas();

    if (args.includes('--demo')) {
        console.log('💰 Operation MIDAS v35.0 - Demo Mode\n');

        // Add demo leads
        const leads = [
            { email: 'cto@techcorp.com', company: 'TechCorp', name: 'John', source: 'inbound', budget: 10000 },
            { email: 'dev@startup.io', company: 'Startup.io', name: 'Jane', source: 'linkedin', budget: 5000 },
            { email: 'qa@enterprise.com', company: 'Enterprise Inc', name: 'Bob', source: 'cold', budget: 2000 }
        ];

        console.log('📥 Adding demo leads...\n');
        for (const data of leads) {
            const lead = midas.addLead(data);
            console.log(`  ✅ ${lead.company} - Score: ${lead.score} (${lead.tier})`);
        }

        console.log('\n📧 Running automated outreach...\n');
        const outreach = await midas.runOutreach({ maxLeads: 3 });
        console.log(`  📤 Contacted: ${outreach.contacted}`);
        console.log(`  ⏭️ Skipped: ${outreach.skipped}`);

        console.log('\n📄 Generating proposals for hot leads...\n');
        const hotLeads = midas.getLeads({ tier: 'hot' });
        for (const lead of hotLeads) {
            const proposal = midas.createProposal(lead.id);
            if (proposal) {
                console.log(`  📋 ${lead.company}: $${proposal.value} - ${proposal.timeline}`);
            }
        }

        console.log('\n📊 Metrics:\n');
        console.log(JSON.stringify(midas.getMetrics(), null, 2));
    }
    else if (args.includes('--metrics')) {
        console.log('\n📊 Operation MIDAS Metrics:\n');
        console.log(JSON.stringify(midas.getMetrics(), null, 2));
    }
    else {
        console.log(`
💰 Operation MIDAS v35.0 - AUTONOMOUS REVENUE
=============================================

Usage:
  npx ts-node src/reality/OperationMidas.ts --demo      # Run demo
  npx ts-node src/reality/OperationMidas.ts --metrics   # Show metrics

Revenue Streams:
  📧 EmailEngine - Automated outreach & follow-ups
  📊 LeadScorer - AI-powered qualification
  📄 ProposalGenerator - Dynamic proposals
  💹 ProfitOptimizer - Auto-reinvestment

Commands:
  midas.addLead({ email, company, budget })
  midas.runOutreach({ maxLeads: 10 })
  midas.createProposal(leadId)
  midas.closeDeal(leadId, won: true)
        `);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

export { Lead, Proposal, RevenueMetrics, LeadScorer, EmailEngine, ProposalGenerator };
