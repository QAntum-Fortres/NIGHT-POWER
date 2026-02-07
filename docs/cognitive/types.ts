// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  QANTUM v23.3.0 - Cognitive Capabilities Type Definitions               ║
// ║  "Type-Safe Sovereign" - Interactive Documentation                           ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * Cognitive capability category
 */
export type CognitiveCategory =
  | 'perception'
  | 'reasoning'
  | 'memory'
  | 'action'
  | 'prediction'
  | 'evolution'
  | 'security'
  | 'observability';

/**
 * License tier requirement
 */
export type LicenseTier = 'free' | 'pro' | 'enterprise';

/**
 * Capability complexity level
 */
export type ComplexityLevel = 'basic' | 'intermediate' | 'advanced' | 'expert';

/**
 * Version when capability was introduced
 */
export interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  codename: string;
}

/**
 * Code example for a capability
 */
export interface CodeExample {
  language: 'typescript' | 'javascript' | 'bash';
  code: string;
  description: string;
}

/**
 * Single cognitive capability definition
 */
export interface CognitiveCapability {
  id: string;
  name: string;
  nameБГ: string;
  category: CognitiveCategory;
  description: string;
  descriptionБГ: string;
  howItWorks: string;
  tier: LicenseTier;
  complexity: ComplexityLevel;
  introducedIn: VersionInfo;
  examples: CodeExample[];
  relatedCapabilities: string[];
  icon: string;
  tags: string[];
  metrics?: {
    accuracy?: number;
    performance?: number;
    reliability?: number;
  };
}

/**
 * Category metadata
 */
export interface CategoryInfo {
  id: CognitiveCategory;
  name: string;
  nameБГ: string;
  description: string;
  icon: string;
  color: string;
  capabilities: CognitiveCapability[];
}

/**
 * Evolution timeline entry
 */
export interface EvolutionEntry {
  version: string;
  date: string;
  codename: string;
  capabilitiesAdded: number;
  totalCapabilities: number;
  highlights: string[];
}

/**
 * Gardner intelligence type
 */
export interface GardnerIntelligence {
  type: string;
  typeБГ: string;
  score: number;
  capabilities: string[];
  icon: string;
}

/**
 * Application state
 */
export interface AppState {
  selectedCategory: CognitiveCategory | 'all';
  selectedCapability: CognitiveCapability | null;
  searchQuery: string;
  filterTier: LicenseTier | 'all';
  theme: 'dark' | 'light';
  language: 'en' | 'bg';
  viewMode: 'grid' | 'list' | 'timeline';
}
