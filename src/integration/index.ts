/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM INTEGRATION MODULE                                                   ║
 * ║   "Seamless integration with CI/CD and notification systems"                  ║
 * ║                                                                               ║
 * ║   TODO B #28-29 - Integration: CI/CD & Notifications                          ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export * from './ci.js';
export * from './notifications.js';

import { CIIntegration, CIEnvironment, CIConfig, BuildAnnotation, CIProvider } from './ci.js';
import { NotificationManager, NotificationPayload, ChannelConfig, NotificationLevel, notify } from './notifications.js';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED INTEGRATION FACADE
// ═══════════════════════════════════════════════════════════════════════════════

export class QAntumIntegration {
    private static instance: QAntumIntegration;

    private ci: CIIntegration;
    private notifications: NotificationManager;

    private constructor() {
        this.ci = CIIntegration.getInstance();
        this.notifications = NotificationManager.getInstance();
    }

    static getInstance(): QAntumIntegration {
        if (!QAntumIntegration.instance) {
            QAntumIntegration.instance = new QAntumIntegration();
        }
        return QAntumIntegration.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CI/CD
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get CI integration
     */
    getCI(): CIIntegration {
        return this.ci;
    }

    /**
     * Get CI environment info
     */
    getCIEnvironment(): CIEnvironment {
        return this.ci.getEnvironment();
    }

    /**
     * Check if running in CI
     */
    isCI(): boolean {
        return this.ci.isCI();
    }

    /**
     * Get CI provider
     */
    getCIProvider(): CIProvider {
        return this.ci.getProvider();
    }

    /**
     * Add build annotation
     */
    annotate(annotation: BuildAnnotation): void {
        this.ci.annotate(annotation);
    }

    /**
     * Set CI output variable
     */
    setOutput(name: string, value: string): void {
        this.ci.setOutput(name, value);
    }

    /**
     * Create log group
     */
    group(name: string, fn: () => void | Promise<void>): void | Promise<void> {
        return this.ci.group(name, fn);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NOTIFICATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get notification manager
     */
    getNotifications(): NotificationManager {
        return this.notifications;
    }

    /**
     * Configure Slack
     */
    slack(webhookUrl: string): this {
        this.notifications.slack(webhookUrl);
        return this;
    }

    /**
     * Configure Discord
     */
    discord(webhookUrl: string): this {
        this.notifications.discord(webhookUrl);
        return this;
    }

    /**
     * Configure Teams
     */
    teams(webhookUrl: string): this {
        this.notifications.teams(webhookUrl);
        return this;
    }

    /**
     * Configure webhook
     */
    webhook(url: string): this {
        this.notifications.webhook(url);
        return this;
    }

    /**
     * Send notification
     */
    async notify(payload: NotificationPayload): Promise<void> {
        await this.notifications.notify(payload);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMBINED OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Report test results
     */
    async reportResults(results: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        duration: number;
    }): Promise<void> {
        const { total, passed, failed, skipped, duration } = results;
        const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

        // Set CI outputs
        if (this.isCI()) {
            this.setOutput('total', String(total));
            this.setOutput('passed', String(passed));
            this.setOutput('failed', String(failed));
            this.setOutput('skipped', String(skipped));
            this.setOutput('pass_rate', passRate);
            this.setOutput('duration', String(duration));
        }

        // Send notification
        const level: NotificationLevel = failed > 0 ? 'error' : 'success';
        const title = failed > 0 ? '❌ Tests Failed' : '✅ Tests Passed';
        const message = `${passed}/${total} tests passed (${passRate}%)`;

        await this.notifications.notify({
            title,
            message,
            level,
            details: {
                'Total': total,
                'Passed': passed,
                'Failed': failed,
                'Skipped': skipped,
                'Duration': `${(duration / 1000).toFixed(1)}s`,
                'Pass Rate': `${passRate}%`
            }
        });

        // Add CI annotation for failures
        if (failed > 0 && this.isCI()) {
            this.annotate({
                type: 'error',
                title: 'Test Failures',
                message: `${failed} test(s) failed`
            });
        }
    }

    /**
     * Generate CI workflow
     */
    generateWorkflow(provider?: CIProvider): string {
        const targetProvider = provider || this.getCIProvider();

        switch (targetProvider) {
            case 'github':
                return this.ci.generateGitHubWorkflow();
            case 'gitlab':
                return this.ci.generateGitLabCI();
            default:
                return this.ci.generateGitHubWorkflow();
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getIntegration = (): QAntumIntegration => QAntumIntegration.getInstance();

// Re-export notify helpers
export { notify };

export default QAntumIntegration;
