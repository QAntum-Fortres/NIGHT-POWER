/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GLOBAL AUDIT - Автономна Ерозия на Несъвършенството
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "QAntum автономно сканира, анализира и сертифицира външни системи.
 *  Всяко слабо място е възможност. Всяка уязвимост е бизнес."
 *
 * The Global Audit system:
 * 1. Discovers targets (authorized only)
 * 2. Performs comprehensive security scan
 * 3. Issues Integrity Certificates
 * 4. Generates remediation proposals
 * 5. Tracks the global security landscape
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 28.5.0 OMEGA - THE AWAKENING
 */
import { EventEmitter } from 'events';
import { IntegrityCertificate } from './UniversalIntegrity';
export interface AuditTarget {
    id: string;
    domain: string;
    type: 'WEB_APP' | 'API' | 'INFRASTRUCTURE' | 'MOBILE' | 'IOT';
    authorized: boolean;
    authorizationDoc?: string;
    priority: number;
    tags: string[];
}
export interface AuditScan {
    id: string;
    target: AuditTarget;
    startedAt: Date;
    completedAt?: Date;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'UNAUTHORIZED';
    findings: SecurityFinding[];
    score: number;
}
export interface SecurityFinding {
    id: string;
    type: SecurityFindingType;
    severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    evidence?: string;
    remediation: string;
    cwe?: string;
    cvss?: number;
    qantumCanFix: boolean;
}
export type SecurityFindingType = 'INJECTION' | 'BROKEN_AUTH' | 'SENSITIVE_DATA' | 'XXE' | 'BROKEN_ACCESS' | 'MISCONFIGURATION' | 'XSS' | 'INSECURE_DESERIALIZATION' | 'VULNERABLE_COMPONENTS' | 'INSUFFICIENT_LOGGING' | 'SSRF' | 'OTHER';
export interface GlobalStats {
    totalScans: number;
    certificatesIssued: number;
    vulnerabilitiesFound: number;
    vulnerabilitiesFixed: number;
    potentialRevenue: number;
}
export declare class GlobalAudit extends EventEmitter {
    private static instance;
    private readonly integrity;
    private readonly nucleus;
    private readonly anchor;
    private readonly brain;
    private readonly proposalEngine;
    private targets;
    private scans;
    private globalStats;
    private readonly FINDING_VALUE;
    private constructor();
    static getInstance(): GlobalAudit;
    /**
     * Add a target for audit
     * CRITICAL: Authorization must be verified
     */
    addTarget(target: Omit<AuditTarget, 'id'>): AuditTarget;
    /**
     * Remove a target
     */
    removeTarget(targetId: string): void;
    /**
     * Perform a comprehensive security audit
     */
    audit(targetId: string): Promise<AuditScan>;
    private checkSSL;
    private checkHTTPS;
    private checkHeaders;
    private checkInfoDisclosure;
    private checkCommonVulns;
    private performAIAnalysis;
    private calculateScore;
    /**
     * Generate an Integrity Certificate from scan results
     */
    certify(scanId: string): Promise<IntegrityCertificate>;
    /**
     * Generate a remediation proposal from scan results
     */
    generateProposal(scanId: string): Promise<string>;
    getStatus(): {
        targets: number;
        activeScans: number;
        stats: GlobalStats;
    };
    getTargets(): AuditTarget[];
    getScans(): AuditScan[];
    getScan(scanId: string): AuditScan | undefined;
    getGlobalStats(): GlobalStats;
}
export declare const globalAudit: GlobalAudit;
export default GlobalAudit;
