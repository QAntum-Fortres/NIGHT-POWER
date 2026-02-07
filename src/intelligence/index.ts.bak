/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QANTUM INTELLIGENCE MODULE - The All-Seeing Eye
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Central export hub for all intelligence gathering and trust systems.
 * 100% legal, 100% ethical, 100% devastating.
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 33.1.0 - THE ETHICAL PREDATOR
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CORE SCANNERS
// ═══════════════════════════════════════════════════════════════════════════════

export { PublicScanner } from './PublicScanner';
export type {
  PublicScanResult,
  SSLInfo,
  SecurityHeaders,
  SecurityTxt,
  RobotsTxt,
  PerformanceMetrics,
  DNSInfo,
} from './PublicScanner';

// ═══════════════════════════════════════════════════════════════════════════════
// TRUST NETWORK
// ═══════════════════════════════════════════════════════════════════════════════

export { TrustNetwork } from './TrustNetwork';
export type {
  TrustSeal,
  TrustLevel,
  TrustNetworkStats,
  SealConfig,
  ScanSummary,
} from './TrustNetwork';

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

import { PublicScanner } from './PublicScanner';
import { TrustNetwork } from './TrustNetwork';

/**
 * Get singleton instances of all intelligence modules.
 */
export function getIntelligence() {
  return {
    scanner: PublicScanner.getInstance(),
    trust: TrustNetwork.getInstance(),
  };
}

/**
 * Quick scan a domain and return intelligence report.
 */
export async function quickScan(url: string) {
  const scanner = PublicScanner.getInstance();
  return scanner.scan(url);
}

/**
 * Generate and issue a trust seal for a domain.
 */
export async function issueTrustSeal(clientId: string, domain: string) {
  const trust = TrustNetwork.getInstance();
  return trust.generateSeal(clientId, domain);
}

/**
 * Verify an existing trust seal.
 */
export async function verifySeal(sealId: string) {
  const trust = TrustNetwork.getInstance();
  return trust.verifySeal(sealId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  PublicScanner,
  TrustNetwork,
  getIntelligence,
  quickScan,
  issueTrustSeal,
  verifySeal,
};
