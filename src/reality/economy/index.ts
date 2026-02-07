/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  QAntum Prime v28.2 - MONEY PIPELINE INDEX                                ║
 * ║  "Изходът за парите" - All Revenue Modules                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT GATEWAYS
// ═══════════════════════════════════════════════════════════════════════════

export { 
  PaymentGateway, 
  paymentGateway,
  type PaymentConfig,
  type PaymentIntent,
  type Subscription,
} from './PaymentGateway';

// ═══════════════════════════════════════════════════════════════════════════
// EXCHANGE CONNECTORS
// ═══════════════════════════════════════════════════════════════════════════

export { 
  ExchangeHub, 
  exchangeHub,
  type ExchangeCredentials,
  type Order,
  type OrderParams,
  type Balance,
  type Ticker,
} from './ExchangeConnectors';

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export { 
  EmailEngine, 
  emailEngine,
  type EmailConfig,
  type EmailTemplate,
  type EmailRecipient,
  type EmailCampaign,
  type EmailResult,
} from './EmailEngine';

// ═══════════════════════════════════════════════════════════════════════════
// SECURE CONFIG
// ═══════════════════════════════════════════════════════════════════════════

export { 
  SecureConfigLoader, 
  secureConfig,
  type QAntumConfig,
} from './SecureConfigLoader';

// ═══════════════════════════════════════════════════════════════════════════
// ARMED REAPER (Live Trading)
// ═══════════════════════════════════════════════════════════════════════════

export { 
  ArmedReaper, 
  armedReaper,
  type ArmedReaperConfig,
  type LiveTradeRecord,
} from './ArmedReaper';

// ═══════════════════════════════════════════════════════════════════════════
// WALLET MANAGER
// ═══════════════════════════════════════════════════════════════════════════

export { 
  LiveWalletManager, 
  liveWalletManager,
} from './LiveWalletManager';

// ═══════════════════════════════════════════════════════════════════════════
// EMERGENCY KILL SWITCH
// ═══════════════════════════════════════════════════════════════════════════

export { 
  EmergencyKillSwitch, 
  emergencyKillSwitch,
} from './EmergencyKillSwitch';

// ═══════════════════════════════════════════════════════════════════════════
// ARBITRAGE
// ═══════════════════════════════════════════════════════════════════════════

export { 
  ArbitrageOrchestrator, 
  arbitrageOrchestrator,
} from './ArbitrageOrchestrator';

export { 
  MarketWatcher, 
  marketWatcher,
} from './MarketWatcher';

// ═══════════════════════════════════════════════════════════════════════════
// QUICK START HELPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize the Money Pipeline with configuration
 * 
 * @example
 * ```typescript
 * import { initMoneyPipeline } from './economy';
 * 
 * await initMoneyPipeline({
 *   configPath: '.env.fortress',
 *   masterPassword: 'my-secure-password',
 *   mode: 'paper'
 * });
 * ```
 */
export async function initMoneyPipeline(options: {
  configPath?: string;
  masterPassword: string;
  mode?: 'dry-run' | 'paper' | 'live';
}): Promise<{
  config: any;
  reaper: typeof armedReaper;
  payments: typeof paymentGateway;
  exchanges: typeof exchangeHub;
  emails: typeof emailEngine;
}> {
  const { configPath = '.env.fortress', masterPassword, mode = 'dry-run' } = options;
  
  // Load configuration
  secureConfig.loadFromFile(configPath);
  secureConfig.encrypt(masterPassword);
  const config = secureConfig.decrypt(masterPassword);
  
  // Configure payment gateways
  if (config.stripe.secretKey) {
    paymentGateway.configureStripe(config.stripe.secretKey, config.stripe.webhookSecret);
  }
  if (config.paypal.clientId) {
    paymentGateway.configurePayPal(config.paypal.clientId, config.paypal.clientSecret, config.paypal.mode);
  }
  
  // Configure exchanges
  for (const [exchangeId, creds] of Object.entries(config.exchanges)) {
    if (creds) {
      exchangeHub.configure(exchangeId, creds as any);
    }
  }
  
  // Configure email
  if (config.sendgrid.apiKey) {
    emailEngine.configure({
      apiKey: config.sendgrid.apiKey,
      fromEmail: config.sendgrid.fromEmail,
      fromName: config.sendgrid.fromName,
      trackOpens: true,
      trackClicks: true,
    });
  }
  
  // Update reaper config
  armedReaper.updateConfig({
    mode,
    maxDailyLossUSD: config.limits.maxDailyLossUSD,
    maxDrawdownPercent: config.limits.maxDrawdownPercent,
    maxPositionSizeUSD: config.limits.maxPositionSizeUSD,
    withdrawalAddress: config.emergency.walletAddress,
    withdrawalNetwork: config.emergency.walletNetwork,
  });
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║  💰 MONEY PIPELINE INITIALIZED                                                        ║
║                                                                                       ║
║  Mode: ${mode.toUpperCase().padEnd(15)}                                                            ║
║  Payments: ${config.stripe.secretKey ? 'Stripe ✅' : '❌'}  ${config.paypal.clientId ? 'PayPal ✅' : '❌'}                                         ║
║  Exchanges: ${Object.keys(config.exchanges).filter(e => config.exchanges[e]).join(', ') || 'None'}                                         ║
║  Email: ${config.sendgrid.apiKey ? 'SendGrid ✅' : '❌'}                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
  `);
  
  return {
    config,
    reaper: armedReaper,
    payments: paymentGateway,
    exchanges: exchangeHub,
    emails: emailEngine,
  };
}
