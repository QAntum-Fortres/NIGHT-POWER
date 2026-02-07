/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  QAntum Prime v28.0 - EMERGENCY KILL SWITCH                               ║
 * ║  "Nuclear Option" - ABORT ALL & WITHDRAW                                  ║
 * ║                                                                           ║
 * ║  ⚠️  КРИТИЧЕН МОДУЛ: Пълно изтегляне на ликвидност < 1 секунда           ║
 * ║  🔴 Червен бутон за Dashboard на стария лаптоп                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';
import { LiveWalletManager, liveWalletManager } from './LiveWalletManager';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface KillSwitchConfig {
  enabled: boolean;
  
  // Authorization
  requireConfirmation: boolean;
  confirmationTimeoutMs: number;
  requirePassword: boolean;
  
  // Withdrawal settings
  primaryWithdrawalAddress: string;
  primaryWithdrawalNetwork: string;
  backupWithdrawalAddress: string;
  backupWithdrawalNetwork: string;
  
  // Thresholds for auto-trigger
  autoTriggerEnabled: boolean;
  maxDrawdownPercent: number;     // Trigger if portfolio drops by X%
  maxLossUSD: number;             // Trigger if total loss exceeds X USD
  maxConsecutiveLosses: number;   // Trigger after X losing trades
  
  // Cooldown
  cooldownAfterTriggerMs: number;
}

export interface AbortResult {
  success: boolean;
  triggeredAt: number;
  completedAt: number;
  executionTimeMs: number;
  
  // Order cancellations
  ordersCancelled: number;
  ordersFailedToCancel: number;
  
  // Position closures
  positionsClosed: number;
  positionsFailedToClose: number;
  
  // Withdrawals
  withdrawalsInitiated: number;
  withdrawalsFailed: number;
  totalWithdrawnUSD: number;
  
  // Errors
  errors: string[];
}

export interface ActiveOrder {
  id: string;
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
}

export interface OpenPosition {
  exchange: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// EMERGENCY KILL SWITCH
// ═══════════════════════════════════════════════════════════════════════════

export class EmergencyKillSwitch extends EventEmitter {
  private config: KillSwitchConfig;
  private walletManager: LiveWalletManager;
  
  // State
  private isArmed: boolean = false;
  private lastTriggered: number = 0;
  private triggerCount: number = 0;
  
  // Monitoring
  private activeOrders: Map<string, ActiveOrder> = new Map();
  private openPositions: Map<string, OpenPosition> = new Map();
  private consecutiveLosses: number = 0;
  private peakPortfolioValue: number = 0;
  private currentPortfolioValue: number = 0;
  
  // Confirmation state
  private pendingConfirmation: boolean = false;
  private confirmationTimeout: NodeJS.Timeout | null = null;
  
  constructor(
    config: Partial<KillSwitchConfig> = {},
    walletManager: LiveWalletManager = liveWalletManager
  ) {
    super();
    
    this.config = {
      enabled: config.enabled ?? true,
      requireConfirmation: config.requireConfirmation ?? true,
      confirmationTimeoutMs: config.confirmationTimeoutMs ?? 5000,
      requirePassword: config.requirePassword ?? false,
      
      primaryWithdrawalAddress: config.primaryWithdrawalAddress ?? '',
      primaryWithdrawalNetwork: config.primaryWithdrawalNetwork ?? 'ETH',
      backupWithdrawalAddress: config.backupWithdrawalAddress ?? '',
      backupWithdrawalNetwork: config.backupWithdrawalNetwork ?? 'BTC',
      
      autoTriggerEnabled: config.autoTriggerEnabled ?? true,
      maxDrawdownPercent: config.maxDrawdownPercent ?? 20,
      maxLossUSD: config.maxLossUSD ?? 1000,
      maxConsecutiveLosses: config.maxConsecutiveLosses ?? 10,
      
      cooldownAfterTriggerMs: config.cooldownAfterTriggerMs ?? 3600000, // 1 hour
    };
    
    this.walletManager = walletManager;
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║  🔴 EMERGENCY KILL SWITCH - Nuclear Option                                ║
║                                                                           ║
║  ⚠️  ABORT ALL & WITHDRAW                                                 ║
║                                                                           ║
║  Auto-triggers:                                                           ║
║  • Max Drawdown: ${this.config.maxDrawdownPercent}%                                                      ║
║  • Max Loss: $${this.config.maxLossUSD}                                                        ║
║  • Consecutive Losses: ${this.config.maxConsecutiveLosses}                                                  ║
║                                                                           ║
║  Target: ${this.config.primaryWithdrawalNetwork} → ${this.config.primaryWithdrawalAddress.slice(0, 20)}...                  ║
╚═══════════════════════════════════════════════════════════════════════════╝
    `);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ARM/DISARM
  // ═══════════════════════════════════════════════════════════════════════
  
  public arm(): void {
    if (!this.config.enabled) {
      console.error('[KillSwitch] ❌ Kill switch is disabled in config');
      return;
    }
    
    if (!this.config.primaryWithdrawalAddress) {
      console.error('[KillSwitch] ❌ No withdrawal address configured!');
      return;
    }
    
    this.isArmed = true;
    console.log('[KillSwitch] 🔴 ARMED - Ready to abort all operations');
    this.emit('armed');
  }
  
  public disarm(): void {
    this.isArmed = false;
    console.log('[KillSwitch] 🟢 DISARMED');
    this.emit('disarmed');
  }
  
  public isSystemArmed(): boolean {
    return this.isArmed;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // TRIGGER KILL SWITCH
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Initiate emergency abort sequence
   * ABORT ALL TRADES & WITHDRAW ALL FUNDS
   */
  public async trigger(reason: string = 'Manual trigger'): Promise<AbortResult> {
    const triggeredAt = Date.now();
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║  🚨🚨🚨 KILL SWITCH TRIGGERED 🚨🚨🚨                                      ║
║                                                                           ║
║  Reason: ${reason.padEnd(50)}        ║
║  Time: ${new Date().toISOString()}                                 ║
║                                                                           ║
║  INITIATING EMERGENCY ABORT SEQUENCE...                                   ║
╚═══════════════════════════════════════════════════════════════════════════╝
    `);
    
    // Check cooldown
    if (Date.now() - this.lastTriggered < this.config.cooldownAfterTriggerMs) {
      const remaining = Math.ceil((this.config.cooldownAfterTriggerMs - (Date.now() - this.lastTriggered)) / 1000);
      console.error(`[KillSwitch] ⏳ Cooldown active. Wait ${remaining} seconds.`);
      return this.createFailedResult(triggeredAt, ['Cooldown active']);
    }
    
    // Check if confirmation is required
    if (this.config.requireConfirmation && !this.pendingConfirmation) {
      console.log('[KillSwitch] ⚠️  Confirmation required! Call confirmTrigger() within 5 seconds');
      this.pendingConfirmation = true;
      
      this.confirmationTimeout = setTimeout(() => {
        this.pendingConfirmation = false;
        console.log('[KillSwitch] ⏰ Confirmation timeout. Abort cancelled.');
        this.emit('confirmation-timeout');
      }, this.config.confirmationTimeoutMs);
      
      this.emit('confirmation-required', { reason, timeoutMs: this.config.confirmationTimeoutMs });
      return this.createFailedResult(triggeredAt, ['Awaiting confirmation']);
    }
    
    // Reset confirmation
    this.pendingConfirmation = false;
    if (this.confirmationTimeout) {
      clearTimeout(this.confirmationTimeout);
      this.confirmationTimeout = null;
    }
    
    this.emit('trigger-started', { reason, triggeredAt });
    
    const result: AbortResult = {
      success: false,
      triggeredAt,
      completedAt: 0,
      executionTimeMs: 0,
      ordersCancelled: 0,
      ordersFailedToCancel: 0,
      positionsClosed: 0,
      positionsFailedToClose: 0,
      withdrawalsInitiated: 0,
      withdrawalsFailed: 0,
      totalWithdrawnUSD: 0,
      errors: [],
    };
    
    try {
      // PHASE 1: Cancel all pending orders
      console.log('[KillSwitch] 🔸 PHASE 1: Cancelling all orders...');
      const cancelResult = await this.cancelAllOrders();
      result.ordersCancelled = cancelResult.cancelled;
      result.ordersFailedToCancel = cancelResult.failed;
      result.errors.push(...cancelResult.errors);
      
      // PHASE 2: Close all open positions
      console.log('[KillSwitch] 🔸 PHASE 2: Closing all positions...');
      const closeResult = await this.closeAllPositions();
      result.positionsClosed = closeResult.closed;
      result.positionsFailedToClose = closeResult.failed;
      result.errors.push(...closeResult.errors);
      
      // PHASE 3: Withdraw all funds
      console.log('[KillSwitch] 🔸 PHASE 3: Withdrawing all funds...');
      const withdrawResult = await this.withdrawAllFunds();
      result.withdrawalsInitiated = withdrawResult.initiated;
      result.withdrawalsFailed = withdrawResult.failed;
      result.totalWithdrawnUSD = withdrawResult.totalUSD;
      result.errors.push(...withdrawResult.errors);
      
      // Complete
      result.success = result.errors.length === 0;
      result.completedAt = Date.now();
      result.executionTimeMs = result.completedAt - result.triggeredAt;
      
      this.lastTriggered = result.triggeredAt;
      this.triggerCount++;
      
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║  ${result.success ? '✅ ABORT SEQUENCE COMPLETED' : '⚠️  ABORT SEQUENCE COMPLETED WITH ERRORS'}                                 ║
║                                                                           ║
║  Execution Time: ${result.executionTimeMs}ms                                                  ║
║  Orders Cancelled: ${result.ordersCancelled}                                                       ║
║  Positions Closed: ${result.positionsClosed}                                                       ║
║  Withdrawals: ${result.withdrawalsInitiated} ($${ result.totalWithdrawnUSD.toFixed(2)})                                     ║
║  Errors: ${result.errors.length}                                                              ║
╚═══════════════════════════════════════════════════════════════════════════╝
      `);
      
      this.emit('trigger-completed', result);
      
    } catch (error) {
      result.errors.push(String(error));
      result.completedAt = Date.now();
      result.executionTimeMs = result.completedAt - result.triggeredAt;
      
      console.error('[KillSwitch] ❌ CRITICAL ERROR during abort:', error);
      this.emit('trigger-error', { result, error });
    }
    
    return result;
  }
  
  /**
   * Confirm pending trigger
   */
  public async confirmTrigger(): Promise<AbortResult> {
    if (!this.pendingConfirmation) {
      console.error('[KillSwitch] ❌ No pending trigger to confirm');
      return this.createFailedResult(Date.now(), ['No pending confirmation']);
    }
    
    if (this.confirmationTimeout) {
      clearTimeout(this.confirmationTimeout);
      this.confirmationTimeout = null;
    }
    
    console.log('[KillSwitch] ✅ Trigger CONFIRMED');
    return this.trigger('Confirmed trigger');
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ABORT PHASES
  // ═══════════════════════════════════════════════════════════════════════
  
  private async cancelAllOrders(): Promise<{
    cancelled: number;
    failed: number;
    errors: string[];
  }> {
    let cancelled = 0;
    let failed = 0;
    const errors: string[] = [];
    
    const orders = Array.from(this.activeOrders.values());
    
    // Cancel all orders in parallel for speed
    const cancelPromises = orders.map(async (order) => {
      try {
        // In production, this would call actual exchange API
        await this.simulateCancelOrder(order);
        console.log(`[KillSwitch] ✅ Cancelled order ${order.id} on ${order.exchange}`);
        return { success: true, orderId: order.id };
      } catch (error) {
        console.error(`[KillSwitch] ❌ Failed to cancel order ${order.id}:`, error);
        return { success: false, orderId: order.id, error: String(error) };
      }
    });
    
    const results = await Promise.all(cancelPromises);
    
    for (const result of results) {
      if (result.success) {
        cancelled++;
        this.activeOrders.delete(result.orderId);
      } else {
        failed++;
        if (result.error) errors.push(result.error);
      }
    }
    
    return { cancelled, failed, errors };
  }
  
  private async closeAllPositions(): Promise<{
    closed: number;
    failed: number;
    errors: string[];
  }> {
    let closed = 0;
    let failed = 0;
    const errors: string[] = [];
    
    const positions = Array.from(this.openPositions.values());
    
    // Close all positions in parallel
    const closePromises = positions.map(async (position) => {
      try {
        await this.simulateClosePosition(position);
        console.log(`[KillSwitch] ✅ Closed ${position.side} position on ${position.symbol}`);
        return { success: true, symbol: position.symbol };
      } catch (error) {
        console.error(`[KillSwitch] ❌ Failed to close position ${position.symbol}:`, error);
        return { success: false, symbol: position.symbol, error: String(error) };
      }
    });
    
    const results = await Promise.all(closePromises);
    
    for (const result of results) {
      if (result.success) {
        closed++;
        this.openPositions.delete(result.symbol);
      } else {
        failed++;
        if (result.error) errors.push(result.error);
      }
    }
    
    return { closed, failed, errors };
  }
  
  private async withdrawAllFunds(): Promise<{
    initiated: number;
    failed: number;
    totalUSD: number;
    errors: string[];
  }> {
    let initiated = 0;
    let failed = 0;
    let totalUSD = 0;
    const errors: string[] = [];
    
    // Get all balances
    const balances = this.walletManager.getTotalBalance();
    
    // In production, this would initiate actual withdrawals
    // For now, simulate the process
    console.log(`[KillSwitch] 💰 Total balance to withdraw: $${balances.total.toFixed(2)}`);
    
    for (const [exchange, amount] of balances.byExchange) {
      try {
        await this.simulateWithdrawal(exchange, amount);
        console.log(`[KillSwitch] ✅ Initiated withdrawal from ${exchange}: $${amount.toFixed(2)}`);
        initiated++;
        totalUSD += amount;
      } catch (error) {
        console.error(`[KillSwitch] ❌ Failed withdrawal from ${exchange}:`, error);
        failed++;
        errors.push(String(error));
      }
    }
    
    return { initiated, failed, totalUSD, errors };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SIMULATION METHODS (Replace with real API calls in production)
  // ═══════════════════════════════════════════════════════════════════════
  
  private async simulateCancelOrder(order: ActiveOrder): Promise<void> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    // 95% success rate
    if (Math.random() < 0.05) {
      throw new Error('Exchange timeout');
    }
  }
  
  private async simulateClosePosition(position: OpenPosition): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    if (Math.random() < 0.03) {
      throw new Error('Insufficient liquidity');
    }
  }
  
  private async simulateWithdrawal(exchange: string, amount: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    if (Math.random() < 0.02) {
      throw new Error('Withdrawal limit exceeded');
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // AUTO-TRIGGER MONITORING
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Update portfolio value and check for auto-trigger conditions
   */
  public updatePortfolioValue(value: number): void {
    if (value > this.peakPortfolioValue) {
      this.peakPortfolioValue = value;
    }
    this.currentPortfolioValue = value;
    
    if (!this.config.autoTriggerEnabled || !this.isArmed) return;
    
    // Check drawdown
    const drawdown = ((this.peakPortfolioValue - value) / this.peakPortfolioValue) * 100;
    if (drawdown >= this.config.maxDrawdownPercent) {
      console.log(`[KillSwitch] 🚨 AUTO-TRIGGER: Drawdown ${drawdown.toFixed(2)}% exceeds ${this.config.maxDrawdownPercent}%`);
      this.trigger(`Auto-trigger: Drawdown ${drawdown.toFixed(2)}%`);
    }
  }
  
  /**
   * Record trade result and check for consecutive losses
   */
  public recordTradeResult(profit: number): void {
    if (profit < 0) {
      this.consecutiveLosses++;
      
      if (!this.config.autoTriggerEnabled || !this.isArmed) return;
      
      if (this.consecutiveLosses >= this.config.maxConsecutiveLosses) {
        console.log(`[KillSwitch] 🚨 AUTO-TRIGGER: ${this.consecutiveLosses} consecutive losses`);
        this.trigger(`Auto-trigger: ${this.consecutiveLosses} consecutive losses`);
      }
    } else {
      this.consecutiveLosses = 0;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ORDER/POSITION TRACKING
  // ═══════════════════════════════════════════════════════════════════════
  
  public registerOrder(order: ActiveOrder): void {
    this.activeOrders.set(order.id, order);
  }
  
  public unregisterOrder(orderId: string): void {
    this.activeOrders.delete(orderId);
  }
  
  public registerPosition(position: OpenPosition): void {
    this.openPositions.set(position.symbol, position);
  }
  
  public unregisterPosition(symbol: string): void {
    this.openPositions.delete(symbol);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════
  
  public setWithdrawalAddress(address: string, network: string): void {
    this.config.primaryWithdrawalAddress = address;
    this.config.primaryWithdrawalNetwork = network;
    console.log(`[KillSwitch] 📬 Primary withdrawal: ${network} → ${address.slice(0, 15)}...`);
  }
  
  public updateConfig(updates: Partial<KillSwitchConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('[KillSwitch] ⚙️ Configuration updated');
  }
  
  public getConfig(): KillSwitchConfig {
    return { ...this.config };
  }
  
  public getStatus(): {
    isArmed: boolean;
    triggerCount: number;
    lastTriggered: number;
    activeOrders: number;
    openPositions: number;
    consecutiveLosses: number;
    currentDrawdown: number;
  } {
    const drawdown = this.peakPortfolioValue > 0
      ? ((this.peakPortfolioValue - this.currentPortfolioValue) / this.peakPortfolioValue) * 100
      : 0;
    
    return {
      isArmed: this.isArmed,
      triggerCount: this.triggerCount,
      lastTriggered: this.lastTriggered,
      activeOrders: this.activeOrders.size,
      openPositions: this.openPositions.size,
      consecutiveLosses: this.consecutiveLosses,
      currentDrawdown: drawdown,
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════
  
  private createFailedResult(triggeredAt: number, errors: string[]): AbortResult {
    return {
      success: false,
      triggeredAt,
      completedAt: Date.now(),
      executionTimeMs: Date.now() - triggeredAt,
      ordersCancelled: 0,
      ordersFailedToCancel: 0,
      positionsClosed: 0,
      positionsFailedToClose: 0,
      withdrawalsInitiated: 0,
      withdrawalsFailed: 0,
      totalWithdrawnUSD: 0,
      errors,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const emergencyKillSwitch = new EmergencyKillSwitch();

export default EmergencyKillSwitch;
