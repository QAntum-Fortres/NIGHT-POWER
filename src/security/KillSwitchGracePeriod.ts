/**
 * @file KillSwitchGracePeriod.ts
 * @description Kill Switch с 24-часов Grace Period - Soft-lock → Hard-lock stages
 * @version 1.0.0
 * @author QANTUM AI
 * @phase Phase 5: Security & SaaS (Business & Protection)
 * 
 * @example
 * ```typescript
 * import { KillSwitch } from '@/security/KillSwitchGracePeriod';
 * 
 * const killSwitch = new KillSwitch({
 *   gracePeriodHours: 24,
 *   notificationEmail: 'admin@example.com',
 *   notificationSMS: '+359888123456'
 * });
 * 
 * // Trigger soft-lock
 * await killSwitch.trigger('license_expired');
 * ```
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export enum KillSwitchState {
  /** Normal operation */
  ACTIVE = 'ACTIVE',
  /** Warning state - 24h before soft-lock */
  WARNING = 'WARNING',
  /** Soft-lock - limited functionality */
  SOFT_LOCKED = 'SOFT_LOCKED',
  /** Hard-lock - no functionality */
  HARD_LOCKED = 'HARD_LOCKED',
  /** Emergency - immediate shutdown */
  EMERGENCY = 'EMERGENCY',
}

export enum TriggerReason {
  LICENSE_EXPIRED = 'license_expired',
  LICENSE_REVOKED = 'license_revoked',
  PAYMENT_FAILED = 'payment_failed',
  SECURITY_BREACH = 'security_breach',
  TERMS_VIOLATION = 'terms_violation',
  MANUAL_ADMIN = 'manual_admin',
  HARDWARE_MISMATCH = 'hardware_mismatch',
  TAMPERING_DETECTED = 'tampering_detected',
}

export interface KillSwitchConfig {
  /** Hours until soft-lock becomes hard-lock */
  gracePeriodHours: number;
  /** Hours before soft-lock to send warning */
  warningHours: number;
  /** Email for notifications */
  notificationEmail?: string;
  /** Phone for SMS notifications */
  notificationSMS?: string;
  /** Discord webhook */
  discordWebhook?: string;
  /** Slack webhook */
  slackWebhook?: string;
  /** Allow manual override with master key */
  allowMasterKeyOverride: boolean;
  /** Features to disable in soft-lock */
  softLockDisabledFeatures: string[];
  /** Log all state changes */
  enableAuditLog: boolean;
}

export interface KillSwitchStatus {
  state: KillSwitchState;
  reason?: TriggerReason;
  triggeredAt?: Date;
  softLockAt?: Date;
  hardLockAt?: Date;
  timeUntilSoftLock?: number; // ms
  timeUntilHardLock?: number; // ms
  notificationsSent: number;
  lastNotification?: Date;
  canOverride: boolean;
}

export interface NotificationPayload {
  type: 'warning' | 'soft_lock' | 'hard_lock' | 'emergency';
  state: KillSwitchState;
  reason: TriggerReason;
  timeRemaining?: string;
  action: string;
}

export interface AuditLogEntry {
  timestamp: Date;
  event: string;
  previousState: KillSwitchState;
  newState: KillSwitchState;
  reason?: TriggerReason;
  actor: string;
  metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: KillSwitchConfig = {
  gracePeriodHours: 24,
  warningHours: 48, // 48 hours before soft-lock
  allowMasterKeyOverride: true,
  softLockDisabledFeatures: [
    'swarm:create',
    'oracle:predict',
    'export:data',
    'api:write',
  ],
  enableAuditLog: true,
};

// ═══════════════════════════════════════════════════════════════════════════════
// KILL SWITCH CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @class KillSwitch
 * @description Graceful shutdown system with 24-hour grace period
 * @extends EventEmitter
 * 
 * Events:
 * - 'warning': Warning state activated
 * - 'soft-lock': Soft-lock activated
 * - 'hard-lock': Hard-lock activated
 * - 'emergency': Emergency shutdown
 * - 'override': Master key override used
 * - 'recovered': System recovered to active
 */
export class KillSwitch extends EventEmitter {
  private config: KillSwitchConfig;
  private state: KillSwitchState = KillSwitchState.ACTIVE;
  private reason?: TriggerReason;
  private triggeredAt?: Date;
  private auditLog: AuditLogEntry[] = [];
  private notificationsSent = 0;
  private lastNotification?: Date;
  
  private warningTimer?: NodeJS.Timeout;
  private softLockTimer?: NodeJS.Timeout;
  private hardLockTimer?: NodeJS.Timeout;
  private notificationInterval?: NodeJS.Timeout;

  constructor(config: Partial<KillSwitchConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Trigger the kill switch with grace period
   */
  async trigger(reason: TriggerReason): Promise<void> {
    if (this.state !== KillSwitchState.ACTIVE) {
      console.warn(`⚠️  Kill switch already in state: ${this.state}`);
      return;
    }

    this.log('KILL_SWITCH_TRIGGERED', this.state, KillSwitchState.WARNING, reason);
    
    this.reason = reason;
    this.triggeredAt = new Date();
    this.state = KillSwitchState.WARNING;

    console.log(`\n🚨 KILL SWITCH TRIGGERED: ${reason}`);
    console.log(`   Grace Period: ${this.config.gracePeriodHours} hours`);
    console.log(`   Warning Period: ${this.config.warningHours} hours`);

    // Send initial notification
    await this.sendNotification({
      type: 'warning',
      state: this.state,
      reason,
      timeRemaining: `${this.config.warningHours + this.config.gracePeriodHours} hours`,
      action: 'Please resolve the issue to avoid service interruption',
    });

    // Schedule state transitions
    this.scheduleTransitions();

    // Start periodic notifications
    this.startNotificationInterval();

    this.emit('warning', { reason, state: this.state });
  }

  /**
   * Trigger emergency shutdown (immediate, no grace period)
   */
  async emergency(reason: TriggerReason): Promise<void> {
    this.log('EMERGENCY_SHUTDOWN', this.state, KillSwitchState.EMERGENCY, reason);
    
    this.clearAllTimers();
    this.reason = reason;
    this.triggeredAt = new Date();
    this.state = KillSwitchState.EMERGENCY;

    console.log(`\n🔴 EMERGENCY SHUTDOWN: ${reason}`);

    await this.sendNotification({
      type: 'emergency',
      state: this.state,
      reason,
      action: 'IMMEDIATE SHUTDOWN - All services terminated',
    });

    this.emit('emergency', { reason });

    // Actually kill the process after notification
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }

  /**
   * Override kill switch with master key
   */
  async override(masterKey: string): Promise<boolean> {
    if (!this.config.allowMasterKeyOverride) {
      console.error('❌ Master key override not allowed');
      return false;
    }

    // Verify master key (in real implementation, check against secure hash)
    if (!this.verifyMasterKey(masterKey)) {
      console.error('❌ Invalid master key');
      this.log('INVALID_OVERRIDE_ATTEMPT', this.state, this.state);
      return false;
    }

    this.log('MASTER_KEY_OVERRIDE', this.state, KillSwitchState.ACTIVE);
    
    this.clearAllTimers();
    const previousState = this.state;
    this.state = KillSwitchState.ACTIVE;
    this.reason = undefined;
    this.triggeredAt = undefined;

    console.log(`\n✅ KILL SWITCH OVERRIDE: System restored to ACTIVE`);

    this.emit('override', { previousState });
    return true;
  }

  /**
   * Recover system to active state (e.g., payment received)
   */
  async recover(): Promise<void> {
    if (this.state === KillSwitchState.ACTIVE) {
      return;
    }

    if (this.state === KillSwitchState.EMERGENCY) {
      console.error('❌ Cannot recover from EMERGENCY state');
      return;
    }

    this.log('SYSTEM_RECOVERED', this.state, KillSwitchState.ACTIVE);
    
    this.clearAllTimers();
    const previousState = this.state;
    this.state = KillSwitchState.ACTIVE;
    this.reason = undefined;
    this.triggeredAt = undefined;

    console.log(`\n✅ SYSTEM RECOVERED: State changed from ${previousState} to ACTIVE`);

    await this.sendNotification({
      type: 'warning',
      state: this.state,
      reason: TriggerReason.MANUAL_ADMIN,
      action: 'System has been restored. Thank you for resolving the issue.',
    });

    this.emit('recovered', { previousState });
  }

  /**
   * Get current status
   */
  getStatus(): KillSwitchStatus {
    const now = Date.now();
    let timeUntilSoftLock: number | undefined;
    let timeUntilHardLock: number | undefined;

    if (this.triggeredAt) {
      const warningMs = this.config.warningHours * 60 * 60 * 1000;
      const graceMs = this.config.gracePeriodHours * 60 * 60 * 1000;
      const elapsed = now - this.triggeredAt.getTime();

      if (this.state === KillSwitchState.WARNING) {
        timeUntilSoftLock = Math.max(0, warningMs - elapsed);
        timeUntilHardLock = Math.max(0, warningMs + graceMs - elapsed);
      } else if (this.state === KillSwitchState.SOFT_LOCKED) {
        timeUntilHardLock = Math.max(0, warningMs + graceMs - elapsed);
      }
    }

    return {
      state: this.state,
      reason: this.reason,
      triggeredAt: this.triggeredAt,
      softLockAt: this.triggeredAt 
        ? new Date(this.triggeredAt.getTime() + this.config.warningHours * 60 * 60 * 1000)
        : undefined,
      hardLockAt: this.triggeredAt
        ? new Date(this.triggeredAt.getTime() + (this.config.warningHours + this.config.gracePeriodHours) * 60 * 60 * 1000)
        : undefined,
      timeUntilSoftLock,
      timeUntilHardLock,
      notificationsSent: this.notificationsSent,
      lastNotification: this.lastNotification,
      canOverride: this.config.allowMasterKeyOverride && this.state !== KillSwitchState.EMERGENCY,
    };
  }

  /**
   * Check if a feature is allowed in current state
   */
  isFeatureAllowed(feature: string): boolean {
    if (this.state === KillSwitchState.ACTIVE) {
      return true;
    }

    if (this.state === KillSwitchState.HARD_LOCKED || this.state === KillSwitchState.EMERGENCY) {
      return false;
    }

    if (this.state === KillSwitchState.SOFT_LOCKED) {
      return !this.config.softLockDisabledFeatures.includes(feature);
    }

    // WARNING state - all features allowed
    return true;
  }

  /**
   * Get audit log
   */
  getAuditLog(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private scheduleTransitions(): void {
    const warningMs = this.config.warningHours * 60 * 60 * 1000;
    const graceMs = this.config.gracePeriodHours * 60 * 60 * 1000;

    // Schedule soft-lock
    this.softLockTimer = setTimeout(() => {
      this.transitionToSoftLock();
    }, warningMs);

    // Schedule hard-lock
    this.hardLockTimer = setTimeout(() => {
      this.transitionToHardLock();
    }, warningMs + graceMs);
  }

  private async transitionToSoftLock(): Promise<void> {
    this.log('SOFT_LOCK_ACTIVATED', this.state, KillSwitchState.SOFT_LOCKED, this.reason);
    this.state = KillSwitchState.SOFT_LOCKED;

    console.log(`\n⚠️  SOFT-LOCK ACTIVATED`);
    console.log(`   Disabled features: ${this.config.softLockDisabledFeatures.join(', ')}`);
    console.log(`   Time until hard-lock: ${this.config.gracePeriodHours} hours`);

    await this.sendNotification({
      type: 'soft_lock',
      state: this.state,
      reason: this.reason!,
      timeRemaining: `${this.config.gracePeriodHours} hours`,
      action: 'URGENT: Some features are now disabled. Resolve immediately to restore full access.',
    });

    this.emit('soft-lock', { reason: this.reason, state: this.state });
  }

  private async transitionToHardLock(): Promise<void> {
    this.log('HARD_LOCK_ACTIVATED', this.state, KillSwitchState.HARD_LOCKED, this.reason);
    this.state = KillSwitchState.HARD_LOCKED;

    console.log(`\n🔴 HARD-LOCK ACTIVATED`);
    console.log(`   All services disabled`);

    await this.sendNotification({
      type: 'hard_lock',
      state: this.state,
      reason: this.reason!,
      action: 'CRITICAL: All services are now disabled. Contact support to restore access.',
    });

    this.clearAllTimers();
    this.emit('hard-lock', { reason: this.reason, state: this.state });
  }

  private startNotificationInterval(): void {
    // Send notifications every 4 hours during grace period
    this.notificationInterval = setInterval(async () => {
      const status = this.getStatus();
      
      if (status.timeUntilHardLock && status.timeUntilHardLock > 0) {
        const hoursRemaining = Math.ceil(status.timeUntilHardLock / (60 * 60 * 1000));
        
        await this.sendNotification({
          type: this.state === KillSwitchState.SOFT_LOCKED ? 'soft_lock' : 'warning',
          state: this.state,
          reason: this.reason!,
          timeRemaining: `${hoursRemaining} hours`,
          action: `You have ${hoursRemaining} hours to resolve the issue before ${this.state === KillSwitchState.SOFT_LOCKED ? 'hard-lock' : 'soft-lock'}.`,
        });
      }
    }, 4 * 60 * 60 * 1000); // Every 4 hours
  }

  private async sendNotification(payload: NotificationPayload): Promise<void> {
    this.notificationsSent++;
    this.lastNotification = new Date();

    console.log(`\n📧 Sending notification (${payload.type})`);

    // Email notification
    if (this.config.notificationEmail) {
      await this.sendEmail(payload);
    }

    // SMS notification
    if (this.config.notificationSMS) {
      await this.sendSMS(payload);
    }

    // Discord notification
    if (this.config.discordWebhook) {
      await this.sendDiscord(payload);
    }

    // Slack notification
    if (this.config.slackWebhook) {
      await this.sendSlack(payload);
    }
  }

  private async sendEmail(payload: NotificationPayload): Promise<void> {
    // In real implementation, use SendGrid or similar
    console.log(`   📧 Email to ${this.config.notificationEmail}: ${payload.action}`);
    
    // Example SendGrid integration:
    // await sendgrid.send({
    //   to: this.config.notificationEmail,
    //   from: 'alerts@qantum.dev',
    //   subject: `[${payload.type.toUpperCase()}] QAntum Prime - ${payload.reason}`,
    //   text: payload.action,
    // });
  }

  private async sendSMS(payload: NotificationPayload): Promise<void> {
    // In real implementation, use Twilio or similar
    console.log(`   📱 SMS to ${this.config.notificationSMS}: ${payload.action.slice(0, 160)}`);
    
    // Example Twilio integration:
    // await twilio.messages.create({
    //   to: this.config.notificationSMS,
    //   from: '+1234567890',
    //   body: `QAntum: ${payload.action.slice(0, 140)}`,
    // });
  }

  private async sendDiscord(payload: NotificationPayload): Promise<void> {
    if (!this.config.discordWebhook) return;

    const colors: Record<string, number> = {
      warning: 0xFFCC00,
      soft_lock: 0xFF9900,
      hard_lock: 0xFF0000,
      emergency: 0x990000,
    };

    try {
      await fetch(this.config.discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: `🚨 QAntum Kill Switch - ${payload.type.toUpperCase()}`,
            description: payload.action,
            color: colors[payload.type] || 0xFF0000,
            fields: [
              { name: 'State', value: payload.state, inline: true },
              { name: 'Reason', value: payload.reason, inline: true },
              { name: 'Time Remaining', value: payload.timeRemaining || 'N/A', inline: true },
            ],
            timestamp: new Date().toISOString(),
          }],
        }),
      });
      console.log('   💬 Discord notification sent');
    } catch (error) {
      console.error(`   ❌ Discord notification failed: ${error}`);
    }
  }

  private async sendSlack(payload: NotificationPayload): Promise<void> {
    if (!this.config.slackWebhook) return;

    const emojis: Record<string, string> = {
      warning: '⚠️',
      soft_lock: '🟠',
      hard_lock: '🔴',
      emergency: '🚨',
    };

    try {
      await fetch(this.config.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${emojis[payload.type]} QAntum Kill Switch - ${payload.type.toUpperCase()}`,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${payload.action}*`,
              },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*State:* ${payload.state}` },
                { type: 'mrkdwn', text: `*Reason:* ${payload.reason}` },
                { type: 'mrkdwn', text: `*Time:* ${payload.timeRemaining || 'N/A'}` },
              ],
            },
          ],
        }),
      });
      console.log('   💬 Slack notification sent');
    } catch (error) {
      console.error(`   ❌ Slack notification failed: ${error}`);
    }
  }

  private verifyMasterKey(key: string): boolean {
    // In real implementation, verify against secure hash
    // This is a placeholder
    const validKeys = [
      process.env.QANTUM_MASTER_KEY,
      'EMERGENCY_OVERRIDE_2025', // Remove in production!
    ];
    
    return validKeys.includes(key);
  }

  private log(
    event: string,
    previousState: KillSwitchState,
    newState: KillSwitchState,
    reason?: TriggerReason
  ): void {
    if (!this.config.enableAuditLog) return;

    const entry: AuditLogEntry = {
      timestamp: new Date(),
      event,
      previousState,
      newState,
      reason,
      actor: 'system',
    };

    this.auditLog.push(entry);

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }
  }

  private clearAllTimers(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = undefined;
    }
    if (this.softLockTimer) {
      clearTimeout(this.softLockTimer);
      this.softLockTimer = undefined;
    }
    if (this.hardLockTimer) {
      clearTimeout(this.hardLockTimer);
      this.hardLockTimer = undefined;
    }
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
      this.notificationInterval = undefined;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE FOR EXPRESS/FASTIFY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Middleware to check kill switch state
 */
export function killSwitchMiddleware(killSwitch: KillSwitch) {
  return (req: any, res: any, next: Function) => {
    const status = killSwitch.getStatus();

    // Add status to request for downstream use
    req.killSwitchStatus = status;

    // Hard-lock or emergency - block all requests
    if (status.state === KillSwitchState.HARD_LOCKED || status.state === KillSwitchState.EMERGENCY) {
      return res.status(503).json({
        error: 'Service Unavailable',
        code: 'KILL_SWITCH_ACTIVE',
        state: status.state,
        reason: status.reason,
        message: 'This service is temporarily unavailable. Please contact support.',
      });
    }

    // Soft-lock - check feature
    if (status.state === KillSwitchState.SOFT_LOCKED) {
      const feature = `${req.method.toLowerCase()}:${req.path.split('/')[1] || 'root'}`;
      
      if (!killSwitch.isFeatureAllowed(feature)) {
        return res.status(403).json({
          error: 'Feature Disabled',
          code: 'FEATURE_SOFT_LOCKED',
          feature,
          timeRemaining: status.timeUntilHardLock,
          message: 'This feature is temporarily disabled. Please resolve billing issues.',
        });
      }
    }

    // Warning - add header
    if (status.state === KillSwitchState.WARNING) {
      res.setHeader('X-KillSwitch-Warning', 'true');
      res.setHeader('X-KillSwitch-TimeRemaining', status.timeUntilSoftLock || 0);
    }

    next();
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

let globalKillSwitch: KillSwitch | null = null;

export function getGlobalKillSwitch(config?: Partial<KillSwitchConfig>): KillSwitch {
  if (!globalKillSwitch) {
    globalKillSwitch = new KillSwitch(config);
  }
  return globalKillSwitch;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI MODE
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  console.log('🔴 Kill Switch Grace Period - Test Mode');
  console.log('═'.repeat(50));

  const killSwitch = new KillSwitch({
    gracePeriodHours: 0.01, // 36 seconds for testing
    warningHours: 0.005,    // 18 seconds for testing
    enableAuditLog: true,
  });

  killSwitch.on('warning', () => console.log('EVENT: warning'));
  killSwitch.on('soft-lock', () => console.log('EVENT: soft-lock'));
  killSwitch.on('hard-lock', () => console.log('EVENT: hard-lock'));

  // Trigger for testing
  killSwitch.trigger(TriggerReason.LICENSE_EXPIRED);

  // Check status periodically
  const statusInterval = setInterval(() => {
    const status = killSwitch.getStatus();
    console.log(`\nStatus: ${status.state}`);
    console.log(`Time until soft-lock: ${status.timeUntilSoftLock}ms`);
    console.log(`Time until hard-lock: ${status.timeUntilHardLock}ms`);
    
    if (status.state === KillSwitchState.HARD_LOCKED) {
      clearInterval(statusInterval);
      process.exit(0);
    }
  }, 5000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default KillSwitch;
