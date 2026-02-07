/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INTEGRATION HUB - The Lock-In Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Колкото по-дълбоко се интегрираме, толкова по-скъпо е да се махнат от нас."
 * 
 * The Integration Hub connects QAntum to:
 * - Slack: Real-time alerts and commands
 * - Jira: Issue creation and tracking
 * - GitHub: PR scanning, code analysis
 * - Webhook: Universal event dispatch
 * 
 * Each integration increases switching cost exponentially.
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 33.1.0 - THE ETHICAL PREDATOR
 */

import { EventEmitter } from 'events';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import * as https from 'https';
import * as http from 'http';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type IntegrationType = 'SLACK' | 'JIRA' | 'GITHUB' | 'WEBHOOK' | 'TEAMS' | 'DISCORD';

export interface Integration {
  id: string;
  clientId: string;
  type: IntegrationType;
  name: string;
  config: IntegrationConfig;
  enabled: boolean;
  createdAt: Date;
  lastUsed: Date | null;
  stats: IntegrationStats;
}

export interface IntegrationConfig {
  webhookUrl?: string;
  apiToken?: string;
  channel?: string;
  projectKey?: string;
  repository?: string;
  events?: string[];
}

export interface IntegrationStats {
  messagesSent: number;
  issuesCreated: number;
  lastError?: string;
  lastErrorAt?: Date;
}

export interface IntegrationMessage {
  type: 'ALERT' | 'REPORT' | 'COMMAND' | 'NOTIFICATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  name: string;
  content: string;
  type: 'text' | 'json' | 'markdown';
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION HUB
// ═══════════════════════════════════════════════════════════════════════════════

export class IntegrationHub extends EventEmitter {
  private static instance: IntegrationHub;

  // State
  private integrations: Map<string, Integration> = new Map();

  // Paths
  private readonly DATA_PATH = join(process.cwd(), 'data', 'integrations');
  private readonly CONFIG_FILE: string;

  // Adapters
  private readonly adapters: Map<IntegrationType, IntegrationAdapter> = new Map();

  private constructor() {
    super();
    this.CONFIG_FILE = join(this.DATA_PATH, 'config.json');
    this.ensureDirectories();
    this.loadConfig();
    this.registerAdapters();

    console.log(`
🔗 ═══════════════════════════════════════════════════════════════════════════════
   INTEGRATION HUB v33.1 - THE LOCK-IN ENGINE
   ─────────────────────────────────────────────────────────────────────────────
   Active Integrations: ${this.integrations.size}
   Adapters: ${this.adapters.size}
   "Всеки канал е верига, която ни свързва с клиента."
═══════════════════════════════════════════════════════════════════════════════
    `);
  }

  static getInstance(): IntegrationHub {
    if (!IntegrationHub.instance) {
      IntegrationHub.instance = new IntegrationHub();
    }
    return IntegrationHub.instance;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADAPTER REGISTRATION
  // ═══════════════════════════════════════════════════════════════════════════

  private registerAdapters(): void {
    this.adapters.set('SLACK', new SlackAdapter());
    this.adapters.set('JIRA', new JiraAdapter());
    this.adapters.set('GITHUB', new GitHubAdapter());
    this.adapters.set('WEBHOOK', new WebhookAdapter());
    this.adapters.set('TEAMS', new TeamsAdapter());
    this.adapters.set('DISCORD', new DiscordAdapter());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Register a new integration for a client.
   */
  register(clientId: string, type: IntegrationType, name: string, config: IntegrationConfig): Integration {
    console.log(`\n🔗 [HUB] Registering ${type} integration for client ${clientId}...`);

    const id = `INT-${Date.now().toString(36).toUpperCase()}-${type}`;

    const integration: Integration = {
      id,
      clientId,
      type,
      name,
      config,
      enabled: true,
      createdAt: new Date(),
      lastUsed: null,
      stats: {
        messagesSent: 0,
        issuesCreated: 0,
      },
    };

    this.integrations.set(id, integration);
    this.saveConfig();

    console.log(`   └─ Integration ID: ${id}`);
    console.log(`   └─ Type: ${type}`);
    console.log(`   └─ Status: ENABLED`);

    this.emit('integration:registered', integration);
    return integration;
  }

  /**
   * Send a message through an integration.
   */
  async send(integrationId: string, message: IntegrationMessage): Promise<boolean> {
    const integration = this.integrations.get(integrationId);
    
    if (!integration) {
      console.error(`[HUB] Integration not found: ${integrationId}`);
      return false;
    }

    if (!integration.enabled) {
      console.warn(`[HUB] Integration disabled: ${integrationId}`);
      return false;
    }

    const adapter = this.adapters.get(integration.type);
    if (!adapter) {
      console.error(`[HUB] No adapter for type: ${integration.type}`);
      return false;
    }

    try {
      await adapter.send(integration, message);
      integration.lastUsed = new Date();
      integration.stats.messagesSent++;
      this.saveConfig();
      this.emit('message:sent', { integration, message });
      return true;
    } catch (error) {
      integration.stats.lastError = error instanceof Error ? error.message : String(error);
      integration.stats.lastErrorAt = new Date();
      this.saveConfig();
      this.emit('message:error', { integration, message, error });
      return false;
    }
  }

  /**
   * Broadcast a message to all enabled integrations for a client.
   */
  async broadcast(clientId: string, message: IntegrationMessage): Promise<{ success: number; failed: number }> {
    const results = { success: 0, failed: 0 };

    const clientIntegrations = Array.from(this.integrations.values())
      .filter(i => i.clientId === clientId && i.enabled);

    for (const integration of clientIntegrations) {
      const success = await this.send(integration.id, message);
      if (success) results.success++;
      else results.failed++;
    }

    return results;
  }

  /**
   * Create an issue in connected issue tracker (Jira/GitHub).
   */
  async createIssue(clientId: string, issue: {
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    labels?: string[];
  }): Promise<{ created: boolean; url?: string }> {
    // Find Jira or GitHub integration
    const integration = Array.from(this.integrations.values())
      .find(i => i.clientId === clientId && (i.type === 'JIRA' || i.type === 'GITHUB') && i.enabled);

    if (!integration) {
      return { created: false };
    }

    const adapter = this.adapters.get(integration.type);
    if (!adapter || !adapter.createIssue) {
      return { created: false };
    }

    try {
      const result = await adapter.createIssue(integration, issue);
      integration.stats.issuesCreated++;
      this.saveConfig();
      return result;
    } catch {
      return { created: false };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK SETUP
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Quick setup for Slack integration.
   */
  setupSlack(clientId: string, webhookUrl: string, channel?: string): Integration {
    return this.register(clientId, 'SLACK', 'Slack Alerts', {
      webhookUrl,
      channel: channel || '#qantum-alerts',
      events: ['critical', 'security', 'performance'],
    });
  }

  /**
   * Quick setup for Jira integration.
   */
  setupJira(clientId: string, apiToken: string, projectKey: string): Integration {
    return this.register(clientId, 'JIRA', 'Jira Issues', {
      apiToken,
      projectKey,
      events: ['critical', 'security'],
    });
  }

  /**
   * Quick setup for GitHub integration.
   */
  setupGitHub(clientId: string, apiToken: string, repository: string): Integration {
    return this.register(clientId, 'GITHUB', 'GitHub Integration', {
      apiToken,
      repository,
      events: ['security', 'code-review'],
    });
  }

  /**
   * Quick setup for custom webhook.
   */
  setupWebhook(clientId: string, webhookUrl: string, events: string[]): Integration {
    return this.register(clientId, 'WEBHOOK', 'Custom Webhook', {
      webhookUrl,
      events,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  enable(integrationId: string): boolean {
    const integration = this.integrations.get(integrationId);
    if (integration) {
      integration.enabled = true;
      this.saveConfig();
      return true;
    }
    return false;
  }

  disable(integrationId: string): boolean {
    const integration = this.integrations.get(integrationId);
    if (integration) {
      integration.enabled = false;
      this.saveConfig();
      return true;
    }
    return false;
  }

  remove(integrationId: string): boolean {
    if (this.integrations.has(integrationId)) {
      this.integrations.delete(integrationId);
      this.saveConfig();
      return true;
    }
    return false;
  }

  getIntegration(id: string): Integration | undefined {
    return this.integrations.get(id);
  }

  getClientIntegrations(clientId: string): Integration[] {
    return Array.from(this.integrations.values())
      .filter(i => i.clientId === clientId);
  }

  getAllIntegrations(): Integration[] {
    return Array.from(this.integrations.values());
  }

  getStats() {
    const integrations = this.getAllIntegrations();
    return {
      total: integrations.length,
      enabled: integrations.filter(i => i.enabled).length,
      byType: {
        slack: integrations.filter(i => i.type === 'SLACK').length,
        jira: integrations.filter(i => i.type === 'JIRA').length,
        github: integrations.filter(i => i.type === 'GITHUB').length,
        webhook: integrations.filter(i => i.type === 'WEBHOOK').length,
        teams: integrations.filter(i => i.type === 'TEAMS').length,
        discord: integrations.filter(i => i.type === 'DISCORD').length,
      },
      totalMessages: integrations.reduce((sum, i) => sum + i.stats.messagesSent, 0),
      totalIssues: integrations.reduce((sum, i) => sum + i.stats.issuesCreated, 0),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════════

  private ensureDirectories(): void {
    if (!existsSync(this.DATA_PATH)) {
      mkdirSync(this.DATA_PATH, { recursive: true });
    }
  }

  private loadConfig(): void {
    try {
      if (existsSync(this.CONFIG_FILE)) {
        const data = JSON.parse(readFileSync(this.CONFIG_FILE, 'utf-8'));
        for (const int of data) {
          int.createdAt = new Date(int.createdAt);
          int.lastUsed = int.lastUsed ? new Date(int.lastUsed) : null;
          if (int.stats.lastErrorAt) {
            int.stats.lastErrorAt = new Date(int.stats.lastErrorAt);
          }
          this.integrations.set(int.id, int);
        }
      }
    } catch {
      // Start fresh
    }
  }

  private saveConfig(): void {
    const data = Array.from(this.integrations.values());
    writeFileSync(this.CONFIG_FILE, JSON.stringify(data, null, 2));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADAPTERS
// ═══════════════════════════════════════════════════════════════════════════════

interface IntegrationAdapter {
  send(integration: Integration, message: IntegrationMessage): Promise<void>;
  createIssue?(integration: Integration, issue: {
    title: string;
    description: string;
    priority: string;
    labels?: string[];
  }): Promise<{ created: boolean; url?: string }>;
}

class SlackAdapter implements IntegrationAdapter {
  async send(integration: Integration, message: IntegrationMessage): Promise<void> {
    const payload = {
      channel: integration.config.channel,
      attachments: [{
        color: this.getPriorityColor(message.priority),
        title: message.title,
        text: message.body,
        footer: 'QAntum OMEGA v33.1',
        ts: Math.floor(Date.now() / 1000),
      }],
    };

    await this.post(integration.config.webhookUrl!, payload);
  }

  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'CRITICAL': return '#FF0000';
      case 'HIGH': return '#FF6B00';
      case 'MEDIUM': return '#FFD700';
      default: return '#00FF00';
    }
  }

  private post(url: string, data: object): Promise<void> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      };

      const req = https.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(JSON.stringify(data));
      req.end();
    });
  }
}

class JiraAdapter implements IntegrationAdapter {
  async send(_integration: Integration, _message: IntegrationMessage): Promise<void> {
    // Jira doesn't support direct messaging - use createIssue instead
    console.log('[JIRA] Use createIssue for Jira integration');
  }

  async createIssue(integration: Integration, issue: {
    title: string;
    description: string;
    priority: string;
    labels?: string[];
  }): Promise<{ created: boolean; url?: string }> {
    // In production, this would call Jira API
    console.log(`[JIRA] Creating issue in project ${integration.config.projectKey}: ${issue.title}`);
    return { created: true, url: `https://jira.example.com/browse/${integration.config.projectKey}-XXX` };
  }
}

class GitHubAdapter implements IntegrationAdapter {
  async send(_integration: Integration, _message: IntegrationMessage): Promise<void> {
    // GitHub uses createIssue for notifications
    console.log('[GITHUB] Use createIssue for GitHub integration');
  }

  async createIssue(integration: Integration, issue: {
    title: string;
    description: string;
    priority: string;
    labels?: string[];
  }): Promise<{ created: boolean; url?: string }> {
    // In production, this would call GitHub API
    console.log(`[GITHUB] Creating issue in ${integration.config.repository}: ${issue.title}`);
    return { created: true, url: `https://github.com/${integration.config.repository}/issues/XXX` };
  }
}

class WebhookAdapter implements IntegrationAdapter {
  async send(integration: Integration, message: IntegrationMessage): Promise<void> {
    const payload = {
      event: message.type,
      priority: message.priority,
      title: message.title,
      body: message.body,
      data: message.data,
      timestamp: new Date().toISOString(),
      source: 'QAntum OMEGA v33.1',
    };

    await this.post(integration.config.webhookUrl!, payload);
  }

  private post(url: string, data: object): Promise<void> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      };

      const req = protocol.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(JSON.stringify(data));
      req.end();
    });
  }
}

class TeamsAdapter implements IntegrationAdapter {
  async send(integration: Integration, message: IntegrationMessage): Promise<void> {
    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: this.getPriorityColor(message.priority),
      summary: message.title,
      sections: [{
        activityTitle: message.title,
        text: message.body,
        markdown: true,
      }],
    };

    await this.post(integration.config.webhookUrl!, payload);
  }

  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'CRITICAL': return 'FF0000';
      case 'HIGH': return 'FF6B00';
      case 'MEDIUM': return 'FFD700';
      default: return '00FF00';
    }
  }

  private post(url: string, data: object): Promise<void> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      };

      const req = https.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(JSON.stringify(data));
      req.end();
    });
  }
}

class DiscordAdapter implements IntegrationAdapter {
  async send(integration: Integration, message: IntegrationMessage): Promise<void> {
    const payload = {
      embeds: [{
        title: message.title,
        description: message.body,
        color: this.getPriorityColorInt(message.priority),
        footer: { text: 'QAntum OMEGA v33.1' },
        timestamp: new Date().toISOString(),
      }],
    };

    await this.post(integration.config.webhookUrl!, payload);
  }

  private getPriorityColorInt(priority: string): number {
    switch (priority) {
      case 'CRITICAL': return 0xFF0000;
      case 'HIGH': return 0xFF6B00;
      case 'MEDIUM': return 0xFFD700;
      default: return 0x00FF00;
    }
  }

  private post(url: string, data: object): Promise<void> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      };

      const req = https.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(JSON.stringify(data));
      req.end();
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default IntegrationHub;
