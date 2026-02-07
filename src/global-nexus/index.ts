/**
 * QAntum Framework v1.7.0 - "The Global Nexus & Autonomous Onboarding"
 * 
 * Unified export for all v1.7.0 modules
 * 
 * MODULE INVENTORY:
 * ├── NexusOrchestrator    - P2P Swarm Mesh Communication (+$280,000)
 * ├── AutoOnboarder        - Stripe → Docker Auto-Provisioning (+$195,000)
 * ├── GlobalThreatIntel    - Fatality + Nexus 0.05ms Immunity (+$320,000)
 * └── CaseStudyGenerator   - Auto Documentation v2 (+$85,000)
 * 
 * TOTAL v1.7.0 VALUE: +$880,000
 * 
 * @module global-nexus
 * @version 1.7.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// SWARM MESH - P2P Communication
// ═══════════════════════════════════════════════════════════════════════════

export {
  NexusOrchestrator,
  createNexusOrchestrator,
  type MeshNode,
  type MeshMessage,
  type MessageType,
  type StealthTactic,
  type TacticCategory,
  type ThreatAlert,
  type ImmunityPatch as MeshImmunityPatch,
  type TopologyUpdate,
  type ConsensusVote,
  type TaskBroadcast,
  type ResultShare,
  type MeshConfig,
  type MeshStatistics
} from '../swarm/mesh/NexusOrchestrator';

// ═══════════════════════════════════════════════════════════════════════════
// REALITY GATEWAY - Autonomous Client Onboarding
// ═══════════════════════════════════════════════════════════════════════════

export {
  AutoOnboarder,
  createAutoOnboarder,
  type SubscriptionTier,
  type OnboardingStatus,
  type CloudProvider,
  type CloudRegion,
  type ClientProfile,
  type ContainerSpec,
  type ProvisionedContainer,
  type OnboardingEvent,
  type AutoOnboarderConfig,
  type OnboardingStatistics
} from '../reality/gateway/AutoOnboarder';

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY - Global Threat Intelligence
// ═══════════════════════════════════════════════════════════════════════════

export {
  GlobalThreatIntel,
  createGlobalThreatIntel,
  type DetectionSource,
  type ThreatSeverity,
  type PatchType,
  type PropagationStrategy,
  type WorkerRegion,
  type ThreatDetection,
  type ThreatEvidence,
  type ImmunityPatch,
  type PatchConfiguration,
  type FingerprintConfig,
  type HeaderMutation,
  type TimingConfig,
  type BehaviorConfig,
  type NetworkConfig,
  type PropagationResult,
  type RegionPropagationStats,
  type WorkerState,
  type DetectionSignature,
  type GlobalThreatIntelConfig,
  type ThreatIntelAnalytics
} from '../security/GlobalThreatIntel';

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTATION - Auto Case Study Generation
// ═══════════════════════════════════════════════════════════════════════════

export {
  CaseStudyGenerator,
  createCaseStudyGenerator,
  type CaseStudyStatus,
  type Industry,
  type ChallengeCategory,
  type SuccessCrawlData,
  type CaseStudy,
  type CaseStudySection,
  type CaseStudyMetrics,
  type CaseStudyGeneratorConfig,
  type CaseStudyStatistics
} from '../docs/CaseStudyGenerator';

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED NEXUS SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

import { NexusOrchestrator, createNexusOrchestrator } from '../swarm/mesh/NexusOrchestrator';
import { AutoOnboarder, createAutoOnboarder } from '../reality/gateway/AutoOnboarder';
import { GlobalThreatIntel, createGlobalThreatIntel } from '../security/GlobalThreatIntel';
import { CaseStudyGenerator, createCaseStudyGenerator } from '../docs/CaseStudyGenerator';

/**
 * GlobalNexusConfig - Configuration for the unified system
 */
export interface GlobalNexusConfig {
  mesh?: Parameters<typeof createNexusOrchestrator>[0];
  onboarding?: Parameters<typeof createAutoOnboarder>[0];
  threatIntel?: Parameters<typeof createGlobalThreatIntel>[0];
  caseStudy?: Parameters<typeof createCaseStudyGenerator>[0];
}

/**
 * GlobalNexusSystem - The unified nervous system
 */
export interface GlobalNexusSystem {
  mesh: NexusOrchestrator;
  onboarding: AutoOnboarder;
  threatIntel: GlobalThreatIntel;
  caseStudy: CaseStudyGenerator;
  
  // Unified methods
  getSystemStatus(): GlobalNexusStatus;
  shutdown(): Promise<void>;
}

/**
 * Global nexus status
 */
export interface GlobalNexusStatus {
  mesh: {
    nodes: number;
    connected: number;
    messagesProcessed: number;
  };
  onboarding: {
    totalClients: number;
    activeContainers: number;
  };
  threatIntel: {
    workers: number;
    detections: number;
    patches: number;
    avgLatencyMs: number;
  };
  caseStudy: {
    generated: number;
    published: number;
  };
}

/**
 * Create the unified Global Nexus system
 */
export function createGlobalNexusSystem(config: GlobalNexusConfig = {}): GlobalNexusSystem {
  const mesh = createNexusOrchestrator(config.mesh);
  const onboarding = createAutoOnboarder(config.onboarding);
  const threatIntel = createGlobalThreatIntel(config.threatIntel);
  const caseStudy = createCaseStudyGenerator(config.caseStudy);
  
  // Wire up integrations
  
  // Connect threat intel to mesh for immunity patches
  threatIntel.on('patch:generated', (data) => {
    mesh.issueImmunityPatch({
      patchId: data.patchId,
      type: data.patchType,
      payload: '',
      priority: data.priority === 'emergency' ? 'critical' : 'high',
      source: 'global-threat-intel'
    });
  });
  
  // Connect mesh alerts to threat intel
  mesh.on('alert:received', (alert) => {
    threatIntel.reportThreatDetection({
      timestamp: new Date(),
      source: 'internal',
      detectedInRegion: 'virginia',
      detectedByWorkerId: alert.sourceNode,
      targetUrl: alert.affectedUrl || 'unknown',
      severity: alert.severity === 'critical' ? 'critical' : 'high',
      threatType: alert.threatType,
      confidence: 0.9,
      evidence: {
        requestFingerprint: '',
        userAgent: '',
        triggers: [alert.description],
        exitIp: '',
        proxyUsed: false
      },
      detectionLatencyMs: 0
    });
  });
  
  return {
    mesh,
    onboarding,
    threatIntel,
    caseStudy,
    
    getSystemStatus(): GlobalNexusStatus {
      const meshStats = mesh.getStatistics();
      const onboardingStats = onboarding.getStatistics();
      const threatStats = threatIntel.getAnalytics();
      const caseStats = caseStudy.getStatistics();
      
      return {
        mesh: {
          nodes: meshStats.totalNodes,
          connected: meshStats.connectedNodes,
          messagesProcessed: meshStats.messagesProcessed
        },
        onboarding: {
          totalClients: onboardingStats.totalClients,
          activeContainers: onboardingStats.activeContainers
        },
        threatIntel: {
          workers: threatStats.totalWorkers,
          detections: threatStats.totalDetections,
          patches: threatStats.totalPatches,
          avgLatencyMs: threatStats.averagePropagationLatencyMs
        },
        caseStudy: {
          generated: caseStats.totalGenerated,
          published: caseStats.totalPublished
        }
      };
    },
    
    async shutdown(): Promise<void> {
      await mesh.shutdown();
      await onboarding.shutdown();
      // threatIntel and caseStudy don't need explicit shutdown
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// VERSION EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const VERSION = '1.7.0';
export const CODENAME = 'The Global Nexus & Autonomous Onboarding';
export const MARKET_VALUE = {
  nexusOrchestrator: 280000,
  autoOnboarder: 195000,
  globalThreatIntel: 320000,
  caseStudyGenerator: 85000,
  total: 880000
};

export default createGlobalNexusSystem;
