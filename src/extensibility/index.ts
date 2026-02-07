/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM EXTENSIBILITY MODULE                                                 ║
 * ║   "Plugin System & Theme Engine"                                              ║
 * ║                                                                               ║
 * ║   TODO B #46-47 - Extensibility Complete                                      ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export {
    PluginManager,
    getPluginManager,
    Command,
    Hook,
    type PluginManifest,
    type PluginContributions,
    type PluginContext,
    type PluginStorage,
    type PluginLogger,
    type Plugin,
    type PluginInfo,
    type PluginState,
    type Disposable
} from './plugin-system';

// ═══════════════════════════════════════════════════════════════════════════════
// THEME ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export {
    ThemeEngine,
    getThemeEngine,
    lightTheme,
    darkTheme,
    type Theme,
    type ThemeColors,
    type ThemeTypography,
    type ThemeSpacing,
    type ThemeBorderRadius,
    type ThemeShadows,
    type ThemeTransitions
} from './theme-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED EXTENSIBILITY FACADE
// ═══════════════════════════════════════════════════════════════════════════════

import { PluginManager, Plugin, PluginManifest } from './plugin-system';
import { ThemeEngine, Theme } from './theme-engine';

export class Extensibility {
    readonly plugins: PluginManager;
    readonly themes: ThemeEngine;

    constructor() {
        this.plugins = PluginManager.getInstance();
        this.themes = ThemeEngine.getInstance();
    }

    /**
     * Install and activate a plugin
     */
    async installPlugin(
        manifest: PluginManifest,
        PluginClass: new () => Plugin
    ): Promise<void> {
        this.plugins.register(manifest, PluginClass);
        await this.plugins.activate(manifest.id);
    }

    /**
     * Apply a theme by ID
     */
    applyTheme(themeId: string): void {
        this.themes.apply(themeId);
    }

    /**
     * Register and apply a custom theme
     */
    registerAndApplyTheme(theme: Theme): void {
        this.themes.register(theme);
        this.themes.apply(theme.id);
    }
}

// Singleton
let extensibilityInstance: Extensibility | null = null;

export function getExtensibility(): Extensibility {
    if (!extensibilityInstance) {
        extensibilityInstance = new Extensibility();
    }
    return extensibilityInstance;
}

export default Extensibility;
