/**
 * 🔔 QANTUM - Slack & Discord Webhooks Integration
 * 
 * Features:
 * - Live test failure alerts with video links
 * - Success celebration messages
 * - Daily summary reports
 * - Self-healing notifications
 * 
 * @version 1.0.0-QANTUM-PRIME
 */

import * as https from 'https';
import * as http from 'http';

// ============================================================
// TYPES
// ============================================================
interface WebhookConfig {
    slackWebhookUrl?: string;
    discordWebhookUrl?: string;
    teamsWebhookUrl?: string;
    enabled: boolean;
}

interface TestResult {
    name: string;
    status: 'passed' | 'failed' | 'skipped' | 'healed';
    duration: number;
    error?: string;
    screenshot?: string;
    video?: string;
    healingInfo?: {
        oldSelector: string;
        newSelector: string;
        strategy: string;
        confidence: number;
    };
}

interface RunSummary {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    healed: number;
    passRate: number;
    duration: number;
    reportUrl?: string;
}

// ============================================================
// WEBHOOK NOTIFIER CLASS
// ============================================================
export class WebhookNotifier {
    private config: WebhookConfig;

    constructor(config: WebhookConfig) {
        this.config = config;
    }

    // ============================================================
    // SLACK NOTIFICATIONS
    // ============================================================
    
    /**
     * Send test failure alert to Slack
     */
    async sendSlackFailureAlert(test: TestResult): Promise<void> {
        if (!this.config.slackWebhookUrl || !this.config.enabled) return;

        const payload = {
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '🚨 Test Failure Alert',
                        emoji: true
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*Test Name:*\n${test.name}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Duration:*\n${test.duration}s`
                        }
                    ]
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Error:*\n\`\`\`${test.error || 'Unknown error'}\`\`\``
                    }
                },
                {
                    type: 'actions',
                    elements: [
                        ...(test.video ? [{
                            type: 'button',
                            text: { type: 'plain_text', text: '🎬 Watch Video', emoji: true },
                            url: test.video,
                            style: 'primary'
                        }] : []),
                        ...(test.screenshot ? [{
                            type: 'button',
                            text: { type: 'plain_text', text: '📸 View Screenshot', emoji: true },
                            url: test.screenshot
                        }] : [])
                    ]
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `🧠 Powered by *QANTUM* v1.0.0.0 | ${new Date().toLocaleString()}`
                        }
                    ]
                }
            ]
        };

        await this.sendWebhook(this.config.slackWebhookUrl, payload);
    }

    /**
     * Send self-healing notification to Slack
     */
    async sendSlackHealingAlert(test: TestResult): Promise<void> {
        if (!this.config.slackWebhookUrl || !this.config.enabled || !test.healingInfo) return;

        const payload = {
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '🔄 AI Self-Healing Activated',
                        emoji: true
                    }
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `Test *${test.name}* was automatically healed by QANTUM AI`
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*Old Selector:*\n\`${test.healingInfo.oldSelector}\``
                        },
                        {
                            type: 'mrkdwn',
                            text: `*New Selector:*\n\`${test.healingInfo.newSelector}\``
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Strategy:*\n${test.healingInfo.strategy}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Confidence:*\n${test.healingInfo.confidence}%`
                        }
                    ]
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `✨ No manual intervention required | 🧠 QANTUM v1.0.0.0`
                        }
                    ]
                }
            ]
        };

        await this.sendWebhook(this.config.slackWebhookUrl, payload);
    }

    /**
     * Send success celebration to Slack
     */
    async sendSlackSuccessCelebration(summary: RunSummary): Promise<void> {
        if (!this.config.slackWebhookUrl || !this.config.enabled) return;
        if (summary.passRate < 100) return; // Only celebrate 100% pass rate

        const payload = {
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '🎉 Perfect Test Run!',
                        emoji: true
                    }
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*All ${summary.total} tests passed!* 🚀\n\nGreat job team! Your code quality is exceptional.`
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*Pass Rate:*\n✅ 100%`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Duration:*\n⏱️ ${summary.duration}s`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Self-Healed:*\n🔄 ${summary.healed}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Total Tests:*\n🧪 ${summary.total}`
                        }
                    ]
                },
                ...(summary.reportUrl ? [{
                    type: 'actions',
                    elements: [{
                        type: 'button',
                        text: { type: 'plain_text', text: '📊 View Full Report', emoji: true },
                        url: summary.reportUrl,
                        style: 'primary'
                    }]
                }] : []),
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `🧠 Powered by *QANTUM* AI Engine v1.0.0.0`
                        }
                    ]
                }
            ]
        };

        await this.sendWebhook(this.config.slackWebhookUrl, payload);
    }

    /**
     * Send daily summary to Slack
     */
    async sendSlackDailySummary(summary: RunSummary): Promise<void> {
        if (!this.config.slackWebhookUrl || !this.config.enabled) return;

        const statusEmoji = summary.passRate >= 95 ? '🟢' : summary.passRate >= 80 ? '🟡' : '🔴';

        const payload = {
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '📊 Daily Test Summary',
                        emoji: true
                    }
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `${statusEmoji} *Pass Rate: ${summary.passRate.toFixed(1)}%*`
                    }
                },
                {
                    type: 'divider'
                },
                {
                    type: 'section',
                    fields: [
                        { type: 'mrkdwn', text: `*Total:*\n${summary.total}` },
                        { type: 'mrkdwn', text: `*Passed:*\n✅ ${summary.passed}` },
                        { type: 'mrkdwn', text: `*Failed:*\n❌ ${summary.failed}` },
                        { type: 'mrkdwn', text: `*Skipped:*\n⏭️ ${summary.skipped}` },
                        { type: 'mrkdwn', text: `*Self-Healed:*\n🔄 ${summary.healed}` },
                        { type: 'mrkdwn', text: `*Duration:*\n⏱️ ${(summary.duration / 60).toFixed(1)}min` }
                    ]
                },
                ...(summary.reportUrl ? [{
                    type: 'actions',
                    elements: [{
                        type: 'button',
                        text: { type: 'plain_text', text: '📄 Download PDF Report', emoji: true },
                        url: summary.reportUrl
                    }]
                }] : []),
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `🧠 QANTUM v1.0.0.0 | ${new Date().toLocaleDateString()}`
                        }
                    ]
                }
            ]
        };

        await this.sendWebhook(this.config.slackWebhookUrl, payload);
    }

    // ============================================================
    // DISCORD NOTIFICATIONS
    // ============================================================
    
    /**
     * Send test failure alert to Discord
     */
    async sendDiscordFailureAlert(test: TestResult): Promise<void> {
        if (!this.config.discordWebhookUrl || !this.config.enabled) return;

        const payload = {
            embeds: [{
                title: '🚨 Test Failure Alert',
                color: 0xef4444, // Red
                fields: [
                    { name: 'Test Name', value: test.name, inline: true },
                    { name: 'Duration', value: `${test.duration}s`, inline: true },
                    { name: 'Error', value: `\`\`\`${test.error || 'Unknown error'}\`\`\`` }
                ],
                footer: {
                    text: '🧠 QANTUM v1.0.0.0'
                },
                timestamp: new Date().toISOString()
            }]
        };

        await this.sendWebhook(this.config.discordWebhookUrl, payload);
    }

    /**
     * Send success celebration to Discord
     */
    async sendDiscordSuccessCelebration(summary: RunSummary): Promise<void> {
        if (!this.config.discordWebhookUrl || !this.config.enabled) return;
        if (summary.passRate < 100) return;

        const payload = {
            embeds: [{
                title: '🎉 Perfect Test Run!',
                description: `All **${summary.total}** tests passed! Great job team! 🚀`,
                color: 0x10b981, // Green
                fields: [
                    { name: '✅ Passed', value: summary.passed.toString(), inline: true },
                    { name: '🔄 Healed', value: summary.healed.toString(), inline: true },
                    { name: '⏱️ Duration', value: `${summary.duration}s`, inline: true }
                ],
                footer: {
                    text: '🧠 QANTUM AI Engine v1.0.0.0'
                },
                timestamp: new Date().toISOString()
            }]
        };

        await this.sendWebhook(this.config.discordWebhookUrl, payload);
    }

    /**
     * Send daily summary to Discord
     */
    async sendDiscordDailySummary(summary: RunSummary): Promise<void> {
        if (!this.config.discordWebhookUrl || !this.config.enabled) return;

        const color = summary.passRate >= 95 ? 0x10b981 : summary.passRate >= 80 ? 0xf59e0b : 0xef4444;

        const payload = {
            embeds: [{
                title: '📊 Daily Test Summary',
                color,
                fields: [
                    { name: '📈 Pass Rate', value: `${summary.passRate.toFixed(1)}%`, inline: true },
                    { name: '🧪 Total', value: summary.total.toString(), inline: true },
                    { name: '✅ Passed', value: summary.passed.toString(), inline: true },
                    { name: '❌ Failed', value: summary.failed.toString(), inline: true },
                    { name: '🔄 Healed', value: summary.healed.toString(), inline: true },
                    { name: '⏱️ Duration', value: `${(summary.duration / 60).toFixed(1)} min`, inline: true }
                ],
                footer: {
                    text: '🧠 QANTUM v1.0.0.0'
                },
                timestamp: new Date().toISOString()
            }]
        };

        await this.sendWebhook(this.config.discordWebhookUrl, payload);
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================
    
    private async sendWebhook(url: string, payload: object): Promise<void> {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify(payload);
            const urlObj = new URL(url);
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            const client = urlObj.protocol === 'https:' ? https : http;
            
            const req = client.request(options, (res) => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    resolve();
                } else {
                    reject(new Error(`Webhook failed with status ${res.statusCode}`));
                }
            });

            req.on('error', reject);
            req.write(data);
            req.end();
        });
    }
}

// ============================================================
// FACTORY FUNCTION
// ============================================================
export function createWebhookNotifier(config: WebhookConfig): WebhookNotifier {
    return new WebhookNotifier(config);
}

// ============================================================
// EXAMPLE USAGE
// ============================================================
/*
const notifier = createWebhookNotifier({
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
    enabled: true
});

// On test failure
await notifier.sendSlackFailureAlert({
    name: 'Login Test',
    status: 'failed',
    duration: 5.2,
    error: 'Element not found: #login-btn',
    video: 'https://example.com/video/123.mp4'
});

// On successful run
await notifier.sendSlackSuccessCelebration({
    total: 100,
    passed: 100,
    failed: 0,
    skipped: 0,
    healed: 3,
    passRate: 100,
    duration: 120
});
*/
