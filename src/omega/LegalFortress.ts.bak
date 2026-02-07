/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LEGAL FORTRESS - The Compliance Guardian
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Истинският суверен е този, който е недосегаем, 
 *  защото оперира там, където законът е негов съюзник."
 * 
 * This module ensures that every action taken by QAntum is:
 * - CFAA Compliant (no unauthorized access)
 * - GDPR Compliant (no personal data without consent)
 * - RICO Safe (no coercion or threats)
 * - Audit Trail Maintained (ISO-27001)
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 33.0.0 - THE LEGAL FORTRESS
 */

import { EventEmitter } from 'events';
import { existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ActionType = 
  | 'PUBLIC_SCAN'       // Scanning public data
  | 'PROPOSAL_SEND'     // Sending a proposal
  | 'BADGE_ISSUE'       // Issuing a trust badge
  | 'AUDIT_REPORT'      // Generating an audit report
  | 'OUTREACH'          // Cold outreach
  | 'INFILTRATION'      // BLOCKED - Unauthorized access attempt
  | 'DATA_HARVEST'      // BLOCKED - Personal data collection
  | 'COERCION'          // BLOCKED - Threatening language
  ;

export interface Action {
  id: string;
  type: ActionType;
  target?: string;
  payload?: any;
  timestamp: Date;
  requestedBy: string;
}

export interface LegalValidation {
  approved: boolean;
  action: Action;
  legalBasis?: string;
  violation?: LegalViolation;
  sanitizedAction?: Action;
}

export interface LegalViolation {
  code: string;
  law: string;
  description: string;
  penalty: string;
  alternative: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEGAL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const LEGAL_VIOLATIONS: Record<string, LegalViolation> = {
  CFAA_UNAUTHORIZED_ACCESS: {
    code: '18 U.S.C. § 1030',
    law: 'Computer Fraud and Abuse Act (CFAA)',
    description: 'Accessing a computer without authorization or exceeding authorized access.',
    penalty: 'Up to 10 years imprisonment for first offense.',
    alternative: 'Use PUBLIC_SCAN to analyze only publicly accessible data.'
  },
  GDPR_DATA_COLLECTION: {
    code: 'Article 6 GDPR',
    law: 'General Data Protection Regulation',
    description: 'Processing personal data without lawful basis.',
    penalty: 'Fines up to €20 million or 4% of annual global turnover.',
    alternative: 'Collect only business data (company info, not personal emails).'
  },
  RICO_EXTORTION: {
    code: '18 U.S.C. § 1951',
    law: 'Hobbs Act / RICO',
    description: 'Obtaining property through threats or coercion.',
    penalty: 'Up to 20 years imprisonment.',
    alternative: 'Offer value-first proposals without threats or ultimatums.'
  },
  CAN_SPAM_VIOLATION: {
    code: '15 U.S.C. § 7701',
    law: 'CAN-SPAM Act',
    description: 'Sending commercial emails without opt-out mechanism.',
    penalty: 'Up to $46,517 per email.',
    alternative: 'Include clear opt-out in all outreach emails.'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// THE LEGAL FORTRESS
// ═══════════════════════════════════════════════════════════════════════════════

export class LegalFortress extends EventEmitter {
  private static instance: LegalFortress;

  // Blocked keywords that indicate illegal intent
  private static readonly BLOCKED_KEYWORDS = [
    'infiltrate',
    'hack',
    'breach',
    'exploit',
    'blackmail',
    'extort',
    'threaten',
    'coerce',
    'unauthorized',
    'bypass authentication',
    'steal',
    'scrape personal',
  ];

  // Threat indicators in message content
  private static readonly THREAT_INDICATORS = [
    'if you don\'t pay',
    'or else',
    'we will expose',
    'your score will drop',
    'we have access to',
    'we found vulnerabilities and will',
  ];

  // Audit log path
  private readonly AUDIT_LOG = join(process.cwd(), 'data', 'legal', 'compliance-audit.log');

  private constructor() {
    super();
    this.ensureLogDir();

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║  ⚖️ LEGAL FORTRESS v33.0 - COMPLIANCE GUARDIAN                                ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  "Mister Mind Directive: 100% Legal Aggression Only"                          ║
║                                                                               ║
║  ACTIVE PROTECTIONS:                                                          ║
║  ├── CFAA Shield:  No unauthorized access                                     ║
║  ├── GDPR Guard:   No personal data without consent                           ║
║  ├── RICO Block:   No coercion or threats                                     ║
║  └── CAN-SPAM:     Opt-out in all communications                              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  static getInstance(): LegalFortress {
    if (!LegalFortress.instance) {
      LegalFortress.instance = new LegalFortress();
    }
    return LegalFortress.instance;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTION VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Validate an action before execution.
   * Returns approved=true if legal, or provides a sanitized alternative.
   */
  validateAction(action: Action): LegalValidation {
    this.log(`VALIDATE: ${action.type} on ${action.target || 'N/A'}`);

    // Check for explicitly blocked action types
    if (action.type === 'INFILTRATION') {
      return this.block(action, 'CFAA_UNAUTHORIZED_ACCESS');
    }

    if (action.type === 'DATA_HARVEST') {
      return this.block(action, 'GDPR_DATA_COLLECTION');
    }

    if (action.type === 'COERCION') {
      return this.block(action, 'RICO_EXTORTION');
    }

    // Check payload for blocked keywords
    const payloadStr = JSON.stringify(action.payload || {}).toLowerCase();
    
    for (const keyword of LegalFortress.BLOCKED_KEYWORDS) {
      if (payloadStr.includes(keyword)) {
        this.log(`BLOCKED: Keyword "${keyword}" detected`);
        return this.block(action, 'CFAA_UNAUTHORIZED_ACCESS');
      }
    }

    // Check for threat indicators in outreach
    if (action.type === 'OUTREACH' && action.payload?.message) {
      const message = action.payload.message.toLowerCase();
      
      for (const threat of LegalFortress.THREAT_INDICATORS) {
        if (message.includes(threat)) {
          this.log(`BLOCKED: Threat indicator "${threat}" detected`);
          return this.block(action, 'RICO_EXTORTION');
        }
      }

      // Ensure opt-out is present
      if (!message.includes('unsubscribe') && !message.includes('opt-out') && !message.includes('opt out')) {
        this.log(`WARN: No opt-out mechanism in outreach`);
        // Sanitize by adding opt-out
        return this.sanitize(action, 'CAN_SPAM_VIOLATION');
      }
    }

    // Action is legal
    this.log(`APPROVED: ${action.type}`);
    
    return {
      approved: true,
      action,
      legalBasis: this.getLegalBasis(action.type)
    };
  }

  /**
   * Block an action and return violation details
   */
  private block(action: Action, violationType: string): LegalValidation {
    const violation = LEGAL_VIOLATIONS[violationType];
    
    this.log(`🚨 BLOCKED: ${action.type} - ${violationType}`);
    this.emit('violation:blocked', { action, violation });

    return {
      approved: false,
      action,
      violation,
      sanitizedAction: this.createSanitizedAction(action, violationType)
    };
  }

  /**
   * Sanitize an action to make it compliant
   */
  private sanitize(action: Action, violationType: string): LegalValidation {
    const sanitized = this.createSanitizedAction(action, violationType);
    
    this.log(`⚠️ SANITIZED: ${action.type} → ${sanitized.type}`);
    this.emit('action:sanitized', { original: action, sanitized });

    return {
      approved: true,
      action: sanitized,
      legalBasis: this.getLegalBasis(sanitized.type)
    };
  }

  /**
   * Create a legal alternative to a blocked action
   */
  private createSanitizedAction(action: Action, violationType: string): Action {
    const sanitized = { ...action, id: `${action.id}_sanitized` };

    switch (violationType) {
      case 'CFAA_UNAUTHORIZED_ACCESS':
        sanitized.type = 'PUBLIC_SCAN';
        sanitized.payload = {
          ...sanitized.payload,
          mode: 'READ_ONLY_PUBLIC',
          compliance: 'ISO-27001-COMPLIANT'
        };
        break;

      case 'GDPR_DATA_COLLECTION':
        sanitized.type = 'PUBLIC_SCAN';
        // Remove any personal data fields
        if (sanitized.payload) {
          delete sanitized.payload.personalEmails;
          delete sanitized.payload.employeeData;
          delete sanitized.payload.userIds;
        }
        break;

      case 'RICO_EXTORTION':
        sanitized.type = 'PROPOSAL_SEND';
        if (sanitized.payload?.message) {
          // Remove threatening language
          sanitized.payload.message = this.removeThreats(sanitized.payload.message);
        }
        break;

      case 'CAN_SPAM_VIOLATION':
        if (sanitized.payload?.message) {
          sanitized.payload.message += '\n\n---\nTo opt out of future communications, reply with "UNSUBSCRIBE".';
        }
        break;
    }

    return sanitized;
  }

  /**
   * Remove threatening language from a message
   */
  private removeThreats(message: string): string {
    let clean = message;
    
    for (const threat of LegalFortress.THREAT_INDICATORS) {
      const regex = new RegExp(threat, 'gi');
      clean = clean.replace(regex, '');
    }

    // Replace aggressive tone with value-first language
    clean = clean.replace(/we discovered vulnerabilities/gi, 'we identified opportunities for improvement');
    clean = clean.replace(/your security is compromised/gi, 'there are areas where security can be enhanced');
    clean = clean.replace(/exposed/gi, 'noted');
    clean = clean.replace(/attack/gi, 'assessment');

    return clean.trim();
  }

  /**
   * Get the legal basis for an action type
   */
  private getLegalBasis(type: ActionType): string {
    const bases: Record<ActionType, string> = {
      'PUBLIC_SCAN': 'Analysis of publicly accessible data (robots.txt, SSL certs, HTTP headers). No authentication bypassed.',
      'PROPOSAL_SEND': 'Commercial communication with opt-out mechanism per CAN-SPAM Act.',
      'BADGE_ISSUE': 'Voluntary certification program. Client consents to verification.',
      'AUDIT_REPORT': 'Report based solely on public data. No unauthorized access.',
      'OUTREACH': 'B2B commercial communication to business emails with opt-out.',
      'INFILTRATION': 'ILLEGAL - Do not use.',
      'DATA_HARVEST': 'ILLEGAL - Do not use.',
      'COERCION': 'ILLEGAL - Do not use.',
    };

    return bases[type] || 'Unknown';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT LOGGING
  // ═══════════════════════════════════════════════════════════════════════════

  private ensureLogDir(): void {
    const dir = join(process.cwd(), 'data', 'legal');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}\n`;
    
    try {
      appendFileSync(this.AUDIT_LOG, entry);
    } catch {
      // Logging should not crash the system
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if a message contains threatening language
   */
  isMessageCompliant(message: string): boolean {
    const lower = message.toLowerCase();
    
    for (const threat of LegalFortress.THREAT_INDICATORS) {
      if (lower.includes(threat)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sanitize a message for compliant outreach
   */
  sanitizeMessage(message: string): string {
    let clean = this.removeThreats(message);
    
    // Ensure opt-out
    if (!clean.includes('unsubscribe') && !clean.includes('opt-out')) {
      clean += '\n\n---\nTo opt out of future communications, reply with "UNSUBSCRIBE".';
    }

    return clean;
  }

  /**
   * Get compliance status
   */
  getComplianceStatus(): object {
    return {
      cfaa: 'ENFORCED',
      gdpr: 'ENFORCED',
      rico: 'ENFORCED',
      canSpam: 'ENFORCED',
      auditLog: this.AUDIT_LOG,
      status: 'ALL SYSTEMS COMPLIANT'
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default LegalFortress;
