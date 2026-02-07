/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROPOSAL ENGINE - Automated Technical Proposal Generator
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Когато Оракулът намери възможност, Proposal Engine я превръща в оферта за 2 секунди."
 *
 * Features:
 * - AI-powered technical proposals
 * - Automatic vulnerability assessment
 * - Pricing calculation
 * - PDF-ready markdown output
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 28.5.0 - THE AWAKENING
 */
import { EventEmitter } from 'events';
export interface LeadData {
    id: string;
    company: string;
    website?: string;
    contact?: string;
    email?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    detected_issue?: string;
    issues?: string[];
    latency?: number;
    vulnerability_type?: string;
    technology_stack?: string[];
    estimated_value?: number;
    source?: string;
}
export interface ProposalConfig {
    includeGhostProtocol: boolean;
    includeSelfHealing: boolean;
    includeCompliance: boolean;
    customPricing?: number;
    currency: 'USD' | 'EUR' | 'BGN' | 'BTC';
    language: 'en' | 'bg';
}
export interface GeneratedProposal {
    id: string;
    leadId: string;
    company: string;
    filePath: string;
    content: string;
    pricing: ProposalPricing;
    generatedAt: Date;
}
export interface ProposalPricing {
    base: number;
    ghostProtocol: number;
    selfHealing: number;
    compliance: number;
    total: number;
    currency: string;
    period: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
}
export declare class ProposalEngine extends EventEmitter {
    private static instance;
    private readonly brain;
    private readonly OUTPUT_DIR;
    private generatedProposals;
    private readonly PRICING;
    private constructor();
    static getInstance(): ProposalEngine;
    /**
     * Generate a technical proposal for a lead
     */
    generate(targetData: LeadData, config?: Partial<ProposalConfig>): Promise<GeneratedProposal>;
    private generateContent;
    private getDefaultSummary;
    private getPackageName;
    private calculatePricing;
    private formatCurrency;
    /**
     * Generate proposals for all high-priority leads
     */
    generateBatch(leads: LeadData[], config?: Partial<ProposalConfig>): Promise<GeneratedProposal[]>;
    private ensureOutputDir;
    getGeneratedProposals(): GeneratedProposal[];
    getTotalPotentialRevenue(): number;
}
export declare const proposalEngine: ProposalEngine;
export default ProposalEngine;
