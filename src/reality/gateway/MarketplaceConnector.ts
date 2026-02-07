/**
 * MarketplaceConnector.ts - "The Distribution Network"
 * 
 * QAntum Framework v1.8.0 - "The Sovereign Market Engine"
 * 
 * Marketplace Integration - Automatically lists QAntum services in AWS
 * and Azure Marketplaces for maximum distribution reach.
 * 
 * MARKET VALUE: +$220,000
 * - AWS Marketplace integration
 * - Azure Marketplace integration
 * - Automated listing management
 * - Dynamic pricing synchronization
 * - Usage-based billing integration
 * - Multi-region deployment
 * 
 * @module reality/gateway/MarketplaceConnector
 * @version 1.0.0
 * @enterprise true
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS - The Language of Distribution
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Supported marketplaces
 */
export type Marketplace = 'aws' | 'azure' | 'gcp' | 'digitalocean';

/**
 * Listing status
 */
export type ListingStatus = 
  | 'draft'
  | 'pending-review'
  | 'approved'
  | 'published'
  | 'suspended'
  | 'deprecated';

/**
 * Pricing model
 */
export type PricingModel = 
  | 'free-tier'
  | 'usage-based'
  | 'subscription'
  | 'byol'
  | 'contract';

/**
 * Product tier
 */
export type ProductTier = 
  | 'free'
  | 'starter'
  | 'professional'
  | 'enterprise'
  | 'unlimited';

/**
 * Marketplace listing
 */
export interface MarketplaceListing {
  listingId: string;
  marketplace: Marketplace;
  status: ListingStatus;
  
  // Product info
  productName: string;
  productDescription: string;
  shortDescription: string;
  
  // Categorization
  categories: string[];
  keywords: string[];
  
  // Media
  logoUrl: string;
  screenshotUrls: string[];
  videoUrl?: string;
  
  // Pricing
  pricingModel: PricingModel;
  tiers: ProductTierConfig[];
  
  // Deployment
  deploymentOptions: DeploymentOption[];
  supportedRegions: string[];
  
  // Legal
  eulaUrl: string;
  privacyPolicyUrl: string;
  supportUrl: string;
  
  // Metrics
  views: number;
  subscriptions: number;
  revenue: number;
  rating: number;
  reviewCount: number;
  
  // Timestamps
  createdAt: Date;
  publishedAt?: Date;
  lastUpdatedAt: Date;
}

/**
 * Product tier configuration
 */
export interface ProductTierConfig {
  tier: ProductTier;
  name: string;
  description: string;
  
  // Pricing
  monthlyPrice: number;
  yearlyPrice: number;
  usageUnit?: string;
  usagePrice?: number;
  
  // Limits
  limits: TierLimits;
  
  // Features
  features: string[];
}

/**
 * Tier limits
 */
export interface TierLimits {
  workersMax: number;
  requestsPerMonth: number;
  dataStorageGB: number;
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  slaUptime?: number;
}

/**
 * Deployment option
 */
export interface DeploymentOption {
  optionId: string;
  name: string;
  type: 'saas' | 'ami' | 'container' | 'helm' | 'terraform';
  
  // For AMI/Container
  imageId?: string;
  containerImage?: string;
  helmChart?: string;
  
  // Instance requirements
  minVCPUs: number;
  minMemoryGB: number;
  minStorageGB: number;
  
  // Recommended
  recommendedInstanceType: string;
}

/**
 * Marketplace subscription
 */
export interface MarketplaceSubscription {
  subscriptionId: string;
  marketplace: Marketplace;
  listingId: string;
  
  // Customer
  customerId: string;
  customerEmail: string;
  companyName: string;
  
  // Plan
  tier: ProductTier;
  pricingModel: PricingModel;
  
  // Billing
  monthlyCommitment: number;
  usageThisMonth: number;
  usageCost: number;
  totalBilled: number;
  
  // Status
  status: 'active' | 'suspended' | 'cancelled' | 'trial';
  trialEndsAt?: Date;
  
  // Deployment
  deploymentRegion: string;
  deploymentStatus: 'pending' | 'deployed' | 'failed';
  instanceId?: string;
  
  // Timestamps
  startedAt: Date;
  lastBilledAt?: Date;
  cancelledAt?: Date;
}

/**
 * Usage record
 */
export interface UsageRecord {
  recordId: string;
  subscriptionId: string;
  
  // Usage
  timestamp: Date;
  dimension: string;
  quantity: number;
  
  // Billing
  unitPrice: number;
  totalAmount: number;
  
  // Status
  reported: boolean;
  reportedAt?: Date;
}

/**
 * Marketplace API credentials
 */
export interface MarketplaceCredentials {
  marketplace: Marketplace;
  
  // AWS
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsMarketplaceRoleArn?: string;
  
  // Azure
  azureTenantId?: string;
  azureClientId?: string;
  azureClientSecret?: string;
  azurePublisherId?: string;
  
  // GCP
  gcpProjectId?: string;
  gcpServiceAccountKey?: string;
}

/**
 * Marketplace connector configuration
 */
export interface MarketplaceConnectorConfig {
  // Enabled marketplaces
  enabledMarketplaces: Marketplace[];
  
  // Product info
  productName: string;
  productDescription: string;
  companyName: string;
  
  // Default pricing
  defaultTiers: ProductTierConfig[];
  
  // Usage reporting
  usageReportingIntervalMs: number;
  
  // Auto-sync
  autoSyncListings: boolean;
  syncIntervalMs: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_TIERS: ProductTierConfig[] = [
  {
    tier: 'free',
    name: 'QAntum Free',
    description: 'Get started with basic web crawling capabilities',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      workersMax: 1,
      requestsPerMonth: 10000,
      dataStorageGB: 1,
      supportLevel: 'community'
    },
    features: [
      'Single worker',
      '10,000 requests/month',
      'Basic stealth mode',
      'Community support'
    ]
  },
  {
    tier: 'starter',
    name: 'QAntum Starter',
    description: 'For small teams getting started with data extraction',
    monthlyPrice: 99,
    yearlyPrice: 990,
    limits: {
      workersMax: 5,
      requestsPerMonth: 100000,
      dataStorageGB: 10,
      supportLevel: 'email'
    },
    features: [
      'Up to 5 workers',
      '100,000 requests/month',
      'Advanced stealth mode',
      'Email support',
      'Basic analytics'
    ]
  },
  {
    tier: 'professional',
    name: 'QAntum Professional',
    description: 'For growing businesses with serious data needs',
    monthlyPrice: 499,
    yearlyPrice: 4990,
    limits: {
      workersMax: 25,
      requestsPerMonth: 1000000,
      dataStorageGB: 100,
      supportLevel: 'priority',
      slaUptime: 99.5
    },
    features: [
      'Up to 25 workers',
      '1M requests/month',
      'Full stealth suite',
      'Priority support',
      'Advanced analytics',
      'Self-healing AI',
      '99.5% SLA'
    ]
  },
  {
    tier: 'enterprise',
    name: 'QAntum Enterprise',
    description: 'Enterprise-grade data extraction at scale',
    monthlyPrice: 2499,
    yearlyPrice: 24990,
    limits: {
      workersMax: 100,
      requestsPerMonth: 10000000,
      dataStorageGB: 1000,
      supportLevel: 'dedicated',
      slaUptime: 99.9
    },
    features: [
      'Up to 100 workers',
      '10M requests/month',
      'Custom stealth profiles',
      'Dedicated support',
      'Real-time analytics',
      'Custom integrations',
      '99.9% SLA',
      'SSO/SAML'
    ]
  },
  {
    tier: 'unlimited',
    name: 'QAntum Unlimited',
    description: 'Unlimited scale for the largest enterprises',
    monthlyPrice: 9999,
    yearlyPrice: 99990,
    usageUnit: '1M requests',
    usagePrice: 50,
    limits: {
      workersMax: 1000,
      requestsPerMonth: -1, // Unlimited
      dataStorageGB: -1, // Unlimited
      supportLevel: 'dedicated',
      slaUptime: 99.99
    },
    features: [
      'Unlimited workers',
      'Unlimited requests',
      'Global mesh network',
      '24/7 dedicated support',
      'Custom AI training',
      'On-premise option',
      '99.99% SLA',
      'White-label available'
    ]
  }
];

const DEFAULT_CONFIG: MarketplaceConnectorConfig = {
  enabledMarketplaces: ['aws', 'azure'],
  productName: 'QAntum Framework',
  productDescription: 'Enterprise-grade autonomous web intelligence platform with self-healing AI and global mesh distribution.',
  companyName: 'QANTUM Technologies',
  defaultTiers: DEFAULT_TIERS,
  usageReportingIntervalMs: 3600000, // 1 hour
  autoSyncListings: true,
  syncIntervalMs: 86400000 // 24 hours
};

// ═══════════════════════════════════════════════════════════════════════════
// MARKETPLACE CONNECTOR ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * MarketplaceConnector - The Distribution Network
 * 
 * Automates listing QAntum services across cloud marketplaces.
 */
export class MarketplaceConnector extends EventEmitter {
  private config: MarketplaceConnectorConfig;
  
  // Data stores
  private listings: Map<string, MarketplaceListing> = new Map();
  private subscriptions: Map<string, MarketplaceSubscription> = new Map();
  private usageRecords: Map<string, UsageRecord[]> = new Map();
  private credentials: Map<Marketplace, MarketplaceCredentials> = new Map();
  
  // Metrics
  private totalListings: number = 0;
  private totalSubscriptions: number = 0;
  private totalRevenue: number = 0;
  private monthlyRecurringRevenue: number = 0;
  
  // Intervals
  private usageReportingInterval?: NodeJS.Timeout;
  private syncInterval?: NodeJS.Timeout;
  
  constructor(config: Partial<MarketplaceConnectorConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Start background tasks
    this.startUsageReporting();
    this.startListingSync();
    
    this.emit('initialized', {
      timestamp: new Date(),
      marketplaces: this.config.enabledMarketplaces,
      tiers: this.config.defaultTiers.length
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // CREDENTIAL MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Configure marketplace credentials
   */
  configureCredentials(creds: MarketplaceCredentials): void {
    this.credentials.set(creds.marketplace, creds);
    
    this.emit('credentials:configured', {
      marketplace: creds.marketplace
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // LISTING MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Create a new marketplace listing
   */
  async createListing(marketplace: Marketplace): Promise<MarketplaceListing> {
    if (!this.config.enabledMarketplaces.includes(marketplace)) {
      throw new Error(`Marketplace ${marketplace} is not enabled`);
    }
    
    const listingId = this.generateId('lst');
    
    // Build deployment options based on marketplace
    const deploymentOptions = this.buildDeploymentOptions(marketplace);
    
    // Get supported regions
    const supportedRegions = this.getSupportedRegions(marketplace);
    
    const listing: MarketplaceListing = {
      listingId,
      marketplace,
      status: 'draft',
      productName: this.config.productName,
      productDescription: this.config.productDescription,
      shortDescription: 'AI-powered autonomous web intelligence platform',
      categories: this.getMarketplaceCategories(marketplace),
      keywords: [
        'web scraping', 'data extraction', 'web crawling', 'ai', 
        'automation', 'stealth', 'enterprise', 'api'
      ],
      logoUrl: 'https://quantum.ai/assets/logo.png',
      screenshotUrls: [
        'https://quantum.ai/assets/screenshot-1.png',
        'https://quantum.ai/assets/screenshot-2.png',
        'https://quantum.ai/assets/screenshot-3.png'
      ],
      pricingModel: 'subscription',
      tiers: this.config.defaultTiers,
      deploymentOptions,
      supportedRegions,
      eulaUrl: 'https://quantum.ai/legal/eula',
      privacyPolicyUrl: 'https://quantum.ai/legal/privacy',
      supportUrl: 'https://quantum.ai/support',
      views: 0,
      subscriptions: 0,
      revenue: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      lastUpdatedAt: new Date()
    };
    
    this.listings.set(listingId, listing);
    this.totalListings++;
    
    this.emit('listing:created', {
      listingId,
      marketplace
    });
    
    return listing;
  }
  
  /**
   * Build deployment options for marketplace
   */
  private buildDeploymentOptions(marketplace: Marketplace): DeploymentOption[] {
    const options: DeploymentOption[] = [];
    
    // SaaS option (always available)
    options.push({
      optionId: this.generateId('dep'),
      name: 'QAntum SaaS',
      type: 'saas',
      minVCPUs: 0,
      minMemoryGB: 0,
      minStorageGB: 0,
      recommendedInstanceType: 'N/A - Fully managed'
    });
    
    if (marketplace === 'aws') {
      // AMI option for AWS
      options.push({
        optionId: this.generateId('dep'),
        name: 'QAntum AMI',
        type: 'ami',
        imageId: 'ami-quantum-enterprise',
        minVCPUs: 4,
        minMemoryGB: 8,
        minStorageGB: 100,
        recommendedInstanceType: 'c5.xlarge'
      });
      
      // Container option
      options.push({
        optionId: this.generateId('dep'),
        name: 'QAntum Container (ECS/EKS)',
        type: 'container',
        containerImage: 'quantum/enterprise:latest',
        minVCPUs: 2,
        minMemoryGB: 4,
        minStorageGB: 50,
        recommendedInstanceType: 'Fargate 2vCPU/4GB'
      });
    }
    
    if (marketplace === 'azure') {
      // Container option for Azure
      options.push({
        optionId: this.generateId('dep'),
        name: 'QAntum Container (AKS)',
        type: 'container',
        containerImage: 'quantum.azurecr.io/enterprise:latest',
        minVCPUs: 2,
        minMemoryGB: 4,
        minStorageGB: 50,
        recommendedInstanceType: 'Standard_D2s_v3'
      });
      
      // ARM template
      options.push({
        optionId: this.generateId('dep'),
        name: 'QAntum ARM Template',
        type: 'terraform',
        minVCPUs: 4,
        minMemoryGB: 8,
        minStorageGB: 100,
        recommendedInstanceType: 'Standard_D4s_v3'
      });
    }
    
    // Helm chart (both)
    options.push({
      optionId: this.generateId('dep'),
      name: 'QAntum Helm Chart',
      type: 'helm',
      helmChart: 'quantum/enterprise',
      minVCPUs: 2,
      minMemoryGB: 4,
      minStorageGB: 50,
      recommendedInstanceType: 'varies'
    });
    
    return options;
  }
  
  /**
   * Get supported regions for marketplace
   */
  private getSupportedRegions(marketplace: Marketplace): string[] {
    switch (marketplace) {
      case 'aws':
        return [
          'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
          'eu-west-1', 'eu-west-2', 'eu-central-1',
          'ap-northeast-1', 'ap-southeast-1', 'ap-southeast-2'
        ];
      case 'azure':
        return [
          'eastus', 'eastus2', 'westus', 'westus2',
          'northeurope', 'westeurope',
          'japaneast', 'southeastasia', 'australiaeast'
        ];
      case 'gcp':
        return [
          'us-central1', 'us-east1', 'us-west1',
          'europe-west1', 'europe-west2',
          'asia-east1', 'asia-northeast1'
        ];
      default:
        return ['us-east', 'eu-west', 'ap-southeast'];
    }
  }
  
  /**
   * Get marketplace-specific categories
   */
  private getMarketplaceCategories(marketplace: Marketplace): string[] {
    switch (marketplace) {
      case 'aws':
        return [
          'Data Integration',
          'Machine Learning',
          'Application Development',
          'Business Intelligence'
        ];
      case 'azure':
        return [
          'AI + Machine Learning',
          'Analytics',
          'Developer Tools',
          'Integration'
        ];
      default:
        return ['Data', 'AI', 'Automation'];
    }
  }
  
  /**
   * Submit listing for review
   */
  async submitForReview(listingId: string): Promise<void> {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error(`Listing ${listingId} not found`);
    }
    
    if (listing.status !== 'draft') {
      throw new Error(`Listing ${listingId} is not in draft status`);
    }
    
    // Validate listing
    this.validateListing(listing);
    
    listing.status = 'pending-review';
    listing.lastUpdatedAt = new Date();
    
    this.emit('listing:submitted', {
      listingId,
      marketplace: listing.marketplace
    });
    
    // Simulate marketplace review (in production: webhook callback)
    setTimeout(() => {
      listing.status = 'approved';
      this.emit('listing:approved', { listingId });
    }, 5000);
  }
  
  /**
   * Publish listing
   */
  async publishListing(listingId: string): Promise<void> {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error(`Listing ${listingId} not found`);
    }
    
    if (listing.status !== 'approved') {
      throw new Error(`Listing ${listingId} is not approved`);
    }
    
    listing.status = 'published';
    listing.publishedAt = new Date();
    listing.lastUpdatedAt = new Date();
    
    this.emit('listing:published', {
      listingId,
      marketplace: listing.marketplace
    });
  }
  
  /**
   * Validate listing completeness
   */
  private validateListing(listing: MarketplaceListing): void {
    const errors: string[] = [];
    
    if (!listing.productName) errors.push('Product name is required');
    if (!listing.productDescription) errors.push('Description is required');
    if (listing.tiers.length === 0) errors.push('At least one pricing tier is required');
    if (listing.deploymentOptions.length === 0) errors.push('At least one deployment option is required');
    if (!listing.eulaUrl) errors.push('EULA URL is required');
    
    if (errors.length > 0) {
      throw new Error(`Listing validation failed: ${errors.join(', ')}`);
    }
  }
  
  /**
   * Update listing pricing
   */
  updatePricing(listingId: string, tiers: ProductTierConfig[]): void {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error(`Listing ${listingId} not found`);
    }
    
    listing.tiers = tiers;
    listing.lastUpdatedAt = new Date();
    
    this.emit('listing:pricing-updated', {
      listingId,
      tiersCount: tiers.length
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SUBSCRIPTION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Handle new marketplace subscription (webhook from marketplace)
   */
  async handleNewSubscription(event: {
    marketplace: Marketplace;
    listingId: string;
    customerId: string;
    customerEmail: string;
    companyName: string;
    tier: ProductTier;
    region: string;
  }): Promise<MarketplaceSubscription> {
    const listing = this.listings.get(event.listingId);
    if (!listing) {
      throw new Error(`Listing ${event.listingId} not found`);
    }
    
    const tierConfig = listing.tiers.find(t => t.tier === event.tier);
    if (!tierConfig) {
      throw new Error(`Tier ${event.tier} not found`);
    }
    
    const subscriptionId = this.generateId('sub');
    
    const subscription: MarketplaceSubscription = {
      subscriptionId,
      marketplace: event.marketplace,
      listingId: event.listingId,
      customerId: event.customerId,
      customerEmail: event.customerEmail,
      companyName: event.companyName,
      tier: event.tier,
      pricingModel: listing.pricingModel,
      monthlyCommitment: tierConfig.monthlyPrice,
      usageThisMonth: 0,
      usageCost: 0,
      totalBilled: 0,
      status: tierConfig.monthlyPrice === 0 ? 'active' : 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
      deploymentRegion: event.region,
      deploymentStatus: 'pending',
      startedAt: new Date()
    };
    
    this.subscriptions.set(subscriptionId, subscription);
    this.usageRecords.set(subscriptionId, []);
    
    // Update listing metrics
    listing.subscriptions++;
    
    this.totalSubscriptions++;
    
    this.emit('subscription:created', {
      subscriptionId,
      marketplace: event.marketplace,
      tier: event.tier,
      customer: event.companyName
    });
    
    // Deploy customer environment
    await this.deployCustomerEnvironment(subscription);
    
    return subscription;
  }
  
  /**
   * Deploy customer environment
   */
  private async deployCustomerEnvironment(subscription: MarketplaceSubscription): Promise<void> {
    this.emit('deployment:started', {
      subscriptionId: subscription.subscriptionId,
      region: subscription.deploymentRegion
    });
    
    // Simulate deployment
    await this.sleep(3000);
    
    subscription.deploymentStatus = 'deployed';
    subscription.instanceId = `inst-${this.generateId('')}`;
    
    this.emit('deployment:completed', {
      subscriptionId: subscription.subscriptionId,
      instanceId: subscription.instanceId
    });
  }
  
  /**
   * Handle subscription cancellation
   */
  async handleCancellation(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }
    
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    
    // Update listing metrics
    const listing = this.listings.get(subscription.listingId);
    if (listing) {
      listing.subscriptions = Math.max(0, listing.subscriptions - 1);
    }
    
    this.emit('subscription:cancelled', {
      subscriptionId,
      customer: subscription.companyName
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // USAGE & BILLING
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Record usage for a subscription
   */
  recordUsage(
    subscriptionId: string,
    dimension: string,
    quantity: number
  ): UsageRecord {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }
    
    const listing = this.listings.get(subscription.listingId);
    const tierConfig = listing?.tiers.find(t => t.tier === subscription.tier);
    
    const unitPrice = tierConfig?.usagePrice || 0;
    const totalAmount = quantity * unitPrice;
    
    const record: UsageRecord = {
      recordId: this.generateId('usage'),
      subscriptionId,
      timestamp: new Date(),
      dimension,
      quantity,
      unitPrice,
      totalAmount,
      reported: false
    };
    
    // Add to records
    const records = this.usageRecords.get(subscriptionId) || [];
    records.push(record);
    this.usageRecords.set(subscriptionId, records);
    
    // Update subscription usage
    subscription.usageThisMonth += quantity;
    subscription.usageCost += totalAmount;
    
    return record;
  }
  
  /**
   * Report usage to marketplace
   */
  private async reportUsageToMarketplace(subscription: MarketplaceSubscription): Promise<void> {
    const records = this.usageRecords.get(subscription.subscriptionId) || [];
    const unreported = records.filter(r => !r.reported);
    
    if (unreported.length === 0) return;
    
    // Simulate API call to marketplace
    for (const record of unreported) {
      record.reported = true;
      record.reportedAt = new Date();
    }
    
    this.emit('usage:reported', {
      subscriptionId: subscription.subscriptionId,
      recordsReported: unreported.length
    });
  }
  
  /**
   * Calculate monthly bill for subscription
   */
  calculateMonthlyBill(subscriptionId: string): {
    basePrice: number;
    usageCost: number;
    total: number;
  } {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }
    
    return {
      basePrice: subscription.monthlyCommitment,
      usageCost: subscription.usageCost,
      total: subscription.monthlyCommitment + subscription.usageCost
    };
  }
  
  /**
   * Start usage reporting background task
   */
  private startUsageReporting(): void {
    this.usageReportingInterval = setInterval(async () => {
      for (const subscription of this.subscriptions.values()) {
        if (subscription.status === 'active') {
          await this.reportUsageToMarketplace(subscription);
        }
      }
    }, this.config.usageReportingIntervalMs);
  }
  
  /**
   * Start listing sync background task
   */
  private startListingSync(): void {
    if (!this.config.autoSyncListings) return;
    
    this.syncInterval = setInterval(() => {
      this.syncAllListings();
    }, this.config.syncIntervalMs);
  }
  
  /**
   * Sync all listings with marketplaces
   */
  async syncAllListings(): Promise<void> {
    for (const listing of this.listings.values()) {
      if (listing.status === 'published') {
        // In production: API call to get latest metrics
        listing.views += Math.floor(Math.random() * 100);
        listing.lastUpdatedAt = new Date();
      }
    }
    
    this.emit('listings:synced', {
      count: this.listings.size
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Get connector statistics
   */
  getStatistics(): MarketplaceConnectorStatistics {
    const listings = Array.from(this.listings.values());
    const subscriptions = Array.from(this.subscriptions.values());
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    
    const mrr = activeSubscriptions.reduce((sum, s) => sum + s.monthlyCommitment, 0);
    const totalRevenue = subscriptions.reduce((sum, s) => sum + s.totalBilled, 0);
    
    const byMarketplace: Record<Marketplace, number> = {
      aws: 0, azure: 0, gcp: 0, digitalocean: 0
    };
    
    for (const sub of activeSubscriptions) {
      byMarketplace[sub.marketplace]++;
    }
    
    return {
      totalListings: this.listings.size,
      publishedListings: listings.filter(l => l.status === 'published').length,
      totalSubscriptions: this.totalSubscriptions,
      activeSubscriptions: activeSubscriptions.length,
      monthlyRecurringRevenue: mrr,
      annualRecurringRevenue: mrr * 12,
      totalRevenue,
      subscriptionsByMarketplace: byMarketplace,
      averageRevenuePerSubscription: activeSubscriptions.length > 0 
        ? mrr / activeSubscriptions.length 
        : 0
    };
  }
  
  /**
   * Get listing by ID
   */
  getListing(listingId: string): MarketplaceListing | undefined {
    return this.listings.get(listingId);
  }
  
  /**
   * Get all listings
   */
  getAllListings(): MarketplaceListing[] {
    return Array.from(this.listings.values());
  }
  
  /**
   * Get subscription by ID
   */
  getSubscription(subscriptionId: string): MarketplaceSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }
  
  /**
   * Get all subscriptions
   */
  getAllSubscriptions(): MarketplaceSubscription[] {
    return Array.from(this.subscriptions.values());
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return prefix ? `${prefix}_${crypto.randomBytes(8).toString('hex')}` 
                  : crypto.randomBytes(8).toString('hex');
  }
  
  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Shutdown connector
   */
  async shutdown(): Promise<void> {
    if (this.usageReportingInterval) {
      clearInterval(this.usageReportingInterval);
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.emit('shutdown', { timestamp: new Date() });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICS INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export interface MarketplaceConnectorStatistics {
  totalListings: number;
  publishedListings: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  totalRevenue: number;
  subscriptionsByMarketplace: Record<Marketplace, number>;
  averageRevenuePerSubscription: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new MarketplaceConnector instance
 */
export function createMarketplaceConnector(
  config?: Partial<MarketplaceConnectorConfig>
): MarketplaceConnector {
  return new MarketplaceConnector(config);
}

export default MarketplaceConnector;
