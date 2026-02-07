/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM NOTIFICATION SYSTEM                                                  ║
 * ║   "Real-time notifications across multiple channels"                          ║
 * ║                                                                               ║
 * ║   TODO B #29 - Integration: Notifications                                     ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type NotificationChannel = 'slack' | 'discord' | 'teams' | 'email' | 'webhook' | 'console';
export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface NotificationPayload {
    title: string;
    message: string;
    level: NotificationLevel;
    details?: Record<string, any>;
    timestamp?: number;
    attachments?: Array<{
        name: string;
        content: string;
        type?: string;
    }>;
}

export interface ChannelConfig {
    channel: NotificationChannel;
    enabled: boolean;
    url?: string;
    token?: string;
    recipients?: string[];
    minLevel?: NotificationLevel;
}

export interface NotificationResult {
    channel: NotificationChannel;
    success: boolean;
    error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class NotificationManager {
    private static instance: NotificationManager;
    private channels: Map<NotificationChannel, ChannelConfig> = new Map();
    private levelPriority: Record<NotificationLevel, number> = {
        info: 0,
        success: 1,
        warning: 2,
        error: 3
    };

    private constructor() {
        // Default console channel
        this.channels.set('console', {
            channel: 'console',
            enabled: true
        });
    }

    static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHANNEL CONFIGURATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Configure channel
     */
    configureChannel(config: ChannelConfig): this {
        this.channels.set(config.channel, config);
        return this;
    }

    /**
     * Configure Slack
     */
    slack(webhookUrl: string, options: Partial<ChannelConfig> = {}): this {
        return this.configureChannel({
            channel: 'slack',
            enabled: true,
            url: webhookUrl,
            ...options
        });
    }

    /**
     * Configure Discord
     */
    discord(webhookUrl: string, options: Partial<ChannelConfig> = {}): this {
        return this.configureChannel({
            channel: 'discord',
            enabled: true,
            url: webhookUrl,
            ...options
        });
    }

    /**
     * Configure Microsoft Teams
     */
    teams(webhookUrl: string, options: Partial<ChannelConfig> = {}): this {
        return this.configureChannel({
            channel: 'teams',
            enabled: true,
            url: webhookUrl,
            ...options
        });
    }

    /**
     * Configure webhook
     */
    webhook(url: string, options: Partial<ChannelConfig> = {}): this {
        return this.configureChannel({
            channel: 'webhook',
            enabled: true,
            url,
            ...options
        });
    }

    /**
     * Enable/disable channel
     */
    setEnabled(channel: NotificationChannel, enabled: boolean): this {
        const config = this.channels.get(channel);
        if (config) {
            config.enabled = enabled;
        }
        return this;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NOTIFICATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Send notification
     */
    async notify(payload: NotificationPayload): Promise<NotificationResult[]> {
        const results: NotificationResult[] = [];
        payload.timestamp = payload.timestamp || Date.now();

        for (const [channel, config] of this.channels) {
            if (!config.enabled) continue;

            // Check minimum level
            if (config.minLevel && 
                this.levelPriority[payload.level] < this.levelPriority[config.minLevel]) {
                continue;
            }

            const result = await this.sendToChannel(channel, config, payload);
            results.push(result);
        }

        return results;
    }

    /**
     * Send info notification
     */
    async info(title: string, message: string, details?: Record<string, any>): Promise<NotificationResult[]> {
        return this.notify({ title, message, level: 'info', details });
    }

    /**
     * Send success notification
     */
    async success(title: string, message: string, details?: Record<string, any>): Promise<NotificationResult[]> {
        return this.notify({ title, message, level: 'success', details });
    }

    /**
     * Send warning notification
     */
    async warning(title: string, message: string, details?: Record<string, any>): Promise<NotificationResult[]> {
        return this.notify({ title, message, level: 'warning', details });
    }

    /**
     * Send error notification
     */
    async error(title: string, message: string, details?: Record<string, any>): Promise<NotificationResult[]> {
        return this.notify({ title, message, level: 'error', details });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHANNEL HANDLERS
    // ─────────────────────────────────────────────────────────────────────────

    private async sendToChannel(
        channel: NotificationChannel,
        config: ChannelConfig,
        payload: NotificationPayload
    ): Promise<NotificationResult> {
        try {
            switch (channel) {
                case 'slack':
                    await this.sendSlack(config, payload);
                    break;
                case 'discord':
                    await this.sendDiscord(config, payload);
                    break;
                case 'teams':
                    await this.sendTeams(config, payload);
                    break;
                case 'webhook':
                    await this.sendWebhook(config, payload);
                    break;
                case 'console':
                    this.sendConsole(payload);
                    break;
                default:
                    throw new Error(`Unknown channel: ${channel}`);
            }

            return { channel, success: true };
        } catch (error) {
            return { 
                channel, 
                success: false, 
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    private async sendSlack(config: ChannelConfig, payload: NotificationPayload): Promise<void> {
        if (!config.url) throw new Error('Slack webhook URL required');

        const color = this.getColor(payload.level);
        const body = {
            attachments: [{
                color,
                title: payload.title,
                text: payload.message,
                fields: payload.details ? Object.entries(payload.details).map(([title, value]) => ({
                    title,
                    value: String(value),
                    short: true
                })) : [],
                ts: Math.floor((payload.timestamp || Date.now()) / 1000)
            }]
        };

        await this.httpPost(config.url, body);
    }

    private async sendDiscord(config: ChannelConfig, payload: NotificationPayload): Promise<void> {
        if (!config.url) throw new Error('Discord webhook URL required');

        const color = parseInt(this.getColor(payload.level).replace('#', ''), 16);
        const body = {
            embeds: [{
                title: payload.title,
                description: payload.message,
                color,
                fields: payload.details ? Object.entries(payload.details).map(([name, value]) => ({
                    name,
                    value: String(value),
                    inline: true
                })) : [],
                timestamp: new Date(payload.timestamp || Date.now()).toISOString()
            }]
        };

        await this.httpPost(config.url, body);
    }

    private async sendTeams(config: ChannelConfig, payload: NotificationPayload): Promise<void> {
        if (!config.url) throw new Error('Teams webhook URL required');

        const color = this.getColor(payload.level);
        const body = {
            '@type': 'MessageCard',
            '@context': 'http://schema.org/extensions',
            themeColor: color.replace('#', ''),
            summary: payload.title,
            sections: [{
                activityTitle: payload.title,
                activitySubtitle: new Date(payload.timestamp || Date.now()).toISOString(),
                text: payload.message,
                facts: payload.details ? Object.entries(payload.details).map(([name, value]) => ({
                    name,
                    value: String(value)
                })) : []
            }]
        };

        await this.httpPost(config.url, body);
    }

    private async sendWebhook(config: ChannelConfig, payload: NotificationPayload): Promise<void> {
        if (!config.url) throw new Error('Webhook URL required');

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (config.token) {
            headers['Authorization'] = `Bearer ${config.token}`;
        }

        await this.httpPost(config.url, payload, headers);
    }

    private sendConsole(payload: NotificationPayload): void {
        const icon = this.getIcon(payload.level);
        const time = new Date(payload.timestamp || Date.now()).toISOString();
        
        console.log(`\n${icon} [${time}] ${payload.title}`);
        console.log(`   ${payload.message}`);
        
        if (payload.details) {
            for (const [key, value] of Object.entries(payload.details)) {
                console.log(`   ${key}: ${value}`);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private getColor(level: NotificationLevel): string {
        switch (level) {
            case 'info': return '#3498db';
            case 'success': return '#2ecc71';
            case 'warning': return '#f39c12';
            case 'error': return '#e74c3c';
        }
    }

    private getIcon(level: NotificationLevel): string {
        switch (level) {
            case 'info': return 'ℹ️';
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
        }
    }

    private async httpPost(url: string, body: any, headers: Record<string, string> = {}): Promise<void> {
        // Use native fetch if available, otherwise simulate
        const defaultHeaders = { 'Content-Type': 'application/json', ...headers };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: defaultHeaders,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            // If fetch is not available, throw the error
            throw error;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getNotifications = (): NotificationManager => NotificationManager.getInstance();

// Quick notification helpers
export const notify = {
    info: (title: string, message: string, details?: Record<string, any>) =>
        NotificationManager.getInstance().info(title, message, details),
    
    success: (title: string, message: string, details?: Record<string, any>) =>
        NotificationManager.getInstance().success(title, message, details),
    
    warning: (title: string, message: string, details?: Record<string, any>) =>
        NotificationManager.getInstance().warning(title, message, details),
    
    error: (title: string, message: string, details?: Record<string, any>) =>
        NotificationManager.getInstance().error(title, message, details)
};

export default NotificationManager;
