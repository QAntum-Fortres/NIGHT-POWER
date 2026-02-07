/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM PLUGINS MODULE                                                       ║
 * ║   "Unified plugin system"                                                     ║
 * ║                                                                               ║
 * ║   TODO B #44 - Plugin System                                                  ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// RE-EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
    PluginManager,
    PluginBuilder,
    Plugin,
    PluginMetadata,
    PluginHooks,
    PluginContext,
    PluginLogger,
    PluginFactory,
    TestContext,
    SuiteContext,
    TestResults,
    // Built-in plugins
    TimerPlugin,
    RetryPlugin,
    ConsoleReporterPlugin,
    ScreenshotPlugin
} from './plugin';

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════════════════════

import {
    PluginManager,
    PluginBuilder,
    Plugin,
    PluginFactory,
    TimerPlugin,
    ConsoleReporterPlugin
} from './plugin';

// ═══════════════════════════════════════════════════════════════════════════════
// QANTUM PLUGINS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Unified QAntum Plugins
 */
export class QAntumPlugins {
    private static instance: QAntumPlugins;
    
    readonly manager: PluginManager;

    private constructor() {
        this.manager = new PluginManager();
    }

    static getInstance(): QAntumPlugins {
        if (!QAntumPlugins.instance) {
            QAntumPlugins.instance = new QAntumPlugins();
        }
        return QAntumPlugins.instance;
    }

    /**
     * Register plugin
     */
    async use(plugin: Plugin | PluginFactory, config?: any): Promise<this> {
        await this.manager.register(plugin, config);
        return this;
    }

    /**
     * Register multiple plugins
     */
    async useAll(...plugins: Array<Plugin | PluginFactory>): Promise<this> {
        for (const plugin of plugins) {
            await this.manager.register(plugin);
        }
        return this;
    }

    /**
     * Initialize all plugins
     */
    async init(): Promise<this> {
        await this.manager.init();
        return this;
    }

    /**
     * Load default plugins
     */
    async loadDefaults(): Promise<this> {
        await this.use(TimerPlugin);
        await this.use(ConsoleReporterPlugin);
        return this;
    }

    /**
     * Get plugin
     */
    get<T extends Plugin>(name: string): T | undefined {
        return this.manager.get<T>(name);
    }

    /**
     * Check if plugin exists
     */
    has(name: string): boolean {
        return this.manager.has(name);
    }

    /**
     * Get all plugins
     */
    list(): Plugin[] {
        return this.manager.getAll();
    }

    /**
     * Create custom plugin
     */
    create(name: string): PluginBuilder {
        return PluginBuilder.create(name);
    }

    /**
     * Destroy all
     */
    async destroy(): Promise<void> {
        await this.manager.destroy();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getQAntumPlugins = (): QAntumPlugins => QAntumPlugins.getInstance();

export const plugins = QAntumPlugins.getInstance();

export default QAntumPlugins;
