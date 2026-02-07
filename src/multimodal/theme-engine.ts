/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM THEME ENGINE                                                         ║
 * ║   "Dynamic theming with CSS variables"                                        ║
 * ║                                                                               ║
 * ║   TODO B #47 - Extensibility: Theme Engine                                    ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ThemeColors {
    // Brand
    primary: string;
    primaryHover: string;
    primaryActive: string;
    secondary: string;
    accent: string;

    // Backgrounds
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    surface: string;
    surfaceHover: string;

    // Text
    text: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;

    // Borders
    border: string;
    borderHover: string;
    borderFocus: string;

    // Status
    success: string;
    warning: string;
    error: string;
    info: string;

    // Code
    codeBg: string;
    codeText: string;
}

export interface ThemeTypography {
    fontFamily: string;
    fontFamilyMono: string;
    fontSizeBase: string;
    fontSizeSm: string;
    fontSizeLg: string;
    fontSizeXl: string;
    fontSizeXxl: string;
    lineHeight: string;
    fontWeightNormal: string;
    fontWeightMedium: string;
    fontWeightBold: string;
}

export interface ThemeSpacing {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
}

export interface ThemeBorderRadius {
    none: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
}

export interface ThemeShadows {
    sm: string;
    md: string;
    lg: string;
    xl: string;
}

export interface ThemeTransitions {
    fast: string;
    normal: string;
    slow: string;
}

export interface Theme {
    id: string;
    name: string;
    type: 'light' | 'dark';
    colors: ThemeColors;
    typography: ThemeTypography;
    spacing: ThemeSpacing;
    borderRadius: ThemeBorderRadius;
    shadows: ThemeShadows;
    transitions: ThemeTransitions;
    custom?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT THEMES
// ═══════════════════════════════════════════════════════════════════════════════

const commonTypography: ThemeTypography = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
    fontFamilyMono: '"JetBrains Mono", "Fira Code", Monaco, Consolas, monospace',
    fontSizeBase: '14px',
    fontSizeSm: '12px',
    fontSizeLg: '16px',
    fontSizeXl: '20px',
    fontSizeXxl: '28px',
    lineHeight: '1.5',
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    fontWeightBold: '700'
};

const commonSpacing: ThemeSpacing = {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
};

const commonBorderRadius: ThemeBorderRadius = {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px'
};

const commonTransitions: ThemeTransitions = {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '400ms ease'
};

export const lightTheme: Theme = {
    id: 'qantum-light',
    name: 'QAntum Light',
    type: 'light',
    colors: {
        primary: '#6366f1',
        primaryHover: '#4f46e5',
        primaryActive: '#4338ca',
        secondary: '#64748b',
        accent: '#f59e0b',

        background: '#ffffff',
        backgroundSecondary: '#f8fafc',
        backgroundTertiary: '#f1f5f9',
        surface: '#ffffff',
        surfaceHover: '#f8fafc',

        text: '#0f172a',
        textSecondary: '#475569',
        textMuted: '#94a3b8',
        textInverse: '#ffffff',

        border: '#e2e8f0',
        borderHover: '#cbd5e1',
        borderFocus: '#6366f1',

        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',

        codeBg: '#f1f5f9',
        codeText: '#0f172a'
    },
    typography: commonTypography,
    spacing: commonSpacing,
    borderRadius: commonBorderRadius,
    shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    },
    transitions: commonTransitions
};

export const darkTheme: Theme = {
    id: 'qantum-dark',
    name: 'QAntum Dark',
    type: 'dark',
    colors: {
        primary: '#818cf8',
        primaryHover: '#a5b4fc',
        primaryActive: '#6366f1',
        secondary: '#94a3b8',
        accent: '#fbbf24',

        background: '#0f172a',
        backgroundSecondary: '#1e293b',
        backgroundTertiary: '#334155',
        surface: '#1e293b',
        surfaceHover: '#334155',

        text: '#f8fafc',
        textSecondary: '#cbd5e1',
        textMuted: '#64748b',
        textInverse: '#0f172a',

        border: '#334155',
        borderHover: '#475569',
        borderFocus: '#818cf8',

        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        info: '#60a5fa',

        codeBg: '#1e293b',
        codeText: '#f8fafc'
    },
    typography: commonTypography,
    spacing: commonSpacing,
    borderRadius: commonBorderRadius,
    shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.6)'
    },
    transitions: commonTransitions
};

// ═══════════════════════════════════════════════════════════════════════════════
// THEME ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class ThemeEngine {
    private static instance: ThemeEngine;

    private themes: Map<string, Theme> = new Map();
    private currentTheme: Theme;
    private styleElement: HTMLStyleElement | null = null;
    private listeners: Set<(theme: Theme) => void> = new Set();

    private constructor() {
        // Register default themes
        this.register(lightTheme);
        this.register(darkTheme);
        this.currentTheme = darkTheme;
    }

    static getInstance(): ThemeEngine {
        if (!ThemeEngine.instance) {
            ThemeEngine.instance = new ThemeEngine();
        }
        return ThemeEngine.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // THEME MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Register a theme
     */
    register(theme: Theme): void {
        this.themes.set(theme.id, theme);
    }

    /**
     * Unregister a theme
     */
    unregister(themeId: string): boolean {
        if (themeId === this.currentTheme.id) {
            throw new Error('Cannot unregister active theme');
        }
        return this.themes.delete(themeId);
    }

    /**
     * Get a theme by ID
     */
    getTheme(themeId: string): Theme | undefined {
        return this.themes.get(themeId);
    }

    /**
     * Get all themes
     */
    getAllThemes(): Theme[] {
        return [...this.themes.values()];
    }

    /**
     * Get current theme
     */
    getCurrentTheme(): Theme {
        return this.currentTheme;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // THEME APPLICATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Apply a theme
     */
    apply(themeId: string): void {
        const theme = this.themes.get(themeId);
        if (!theme) {
            throw new Error(`Theme not found: ${themeId}`);
        }

        this.currentTheme = theme;
        this.injectStyles(theme);
        this.notifyListeners(theme);
    }

    /**
     * Toggle between light and dark
     */
    toggle(): Theme {
        const newTheme = this.currentTheme.type === 'dark' 
            ? this.findThemeByType('light')
            : this.findThemeByType('dark');

        if (newTheme) {
            this.apply(newTheme.id);
        }

        return this.currentTheme;
    }

    /**
     * Apply system preference
     */
    applySystemPreference(): void {
        if (typeof window !== 'undefined') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = prefersDark 
                ? this.findThemeByType('dark') 
                : this.findThemeByType('light');
            
            if (theme) {
                this.apply(theme.id);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CSS GENERATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate CSS variables for a theme
     */
    generateCSSVariables(theme: Theme): string {
        const vars: string[] = [];

        // Colors
        for (const [key, value] of Object.entries(theme.colors)) {
            vars.push(`  --color-${this.kebabCase(key)}: ${value};`);
        }

        // Typography
        for (const [key, value] of Object.entries(theme.typography)) {
            vars.push(`  --${this.kebabCase(key)}: ${value};`);
        }

        // Spacing
        for (const [key, value] of Object.entries(theme.spacing)) {
            vars.push(`  --spacing-${key}: ${value};`);
        }

        // Border radius
        for (const [key, value] of Object.entries(theme.borderRadius)) {
            vars.push(`  --radius-${key}: ${value};`);
        }

        // Shadows
        for (const [key, value] of Object.entries(theme.shadows)) {
            vars.push(`  --shadow-${key}: ${value};`);
        }

        // Transitions
        for (const [key, value] of Object.entries(theme.transitions)) {
            vars.push(`  --transition-${key}: ${value};`);
        }

        // Custom
        if (theme.custom) {
            for (const [key, value] of Object.entries(theme.custom)) {
                vars.push(`  --${this.kebabCase(key)}: ${value};`);
            }
        }

        return `:root {\n${vars.join('\n')}\n}`;
    }

    /**
     * Generate full CSS for a theme
     */
    generateCSS(theme: Theme): string {
        const variables = this.generateCSSVariables(theme);
        
        const baseStyles = `
/* QAntum Theme: ${theme.name} */
${variables}

body {
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: var(--line-height);
  transition: background-color var(--transition-normal), color var(--transition-normal);
}

::selection {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

a {
  color: var(--color-primary);
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--color-primary-hover);
}

code {
  font-family: var(--font-family-mono);
  background-color: var(--color-code-bg);
  color: var(--color-code-text);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}
`;

        return baseStyles;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LISTENERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Subscribe to theme changes
     */
    subscribe(callback: (theme: Theme) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    private notifyListeners(theme: Theme): void {
        for (const listener of this.listeners) {
            try {
                listener(theme);
            } catch (error) {
                console.error('[ThemeEngine] Listener error:', error);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // THEME CREATION HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create a theme extending base
     */
    extend(baseId: string, overrides: Partial<Theme> & { id: string; name: string }): Theme {
        const base = this.themes.get(baseId);
        if (!base) {
            throw new Error(`Base theme not found: ${baseId}`);
        }

        return {
            ...base,
            ...overrides,
            colors: { ...base.colors, ...overrides.colors },
            typography: { ...base.typography, ...overrides.typography },
            spacing: { ...base.spacing, ...overrides.spacing },
            borderRadius: { ...base.borderRadius, ...overrides.borderRadius },
            shadows: { ...base.shadows, ...overrides.shadows },
            transitions: { ...base.transitions, ...overrides.transitions },
            custom: { ...base.custom, ...overrides.custom }
        } as Theme;
    }

    /**
     * Create theme from colors only
     */
    createFromColors(
        id: string,
        name: string,
        type: 'light' | 'dark',
        colors: ThemeColors
    ): Theme {
        const base = type === 'dark' ? darkTheme : lightTheme;
        return this.extend(base.id, { id, name, type, colors });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE
    // ─────────────────────────────────────────────────────────────────────────

    private injectStyles(theme: Theme): void {
        if (typeof document === 'undefined') return;

        if (!this.styleElement) {
            this.styleElement = document.createElement('style');
            this.styleElement.id = 'qantum-theme';
            document.head.appendChild(this.styleElement);
        }

        this.styleElement.textContent = this.generateCSS(theme);
        document.documentElement.setAttribute('data-theme', theme.type);
    }

    private findThemeByType(type: 'light' | 'dark'): Theme | undefined {
        for (const theme of this.themes.values()) {
            if (theme.type === type) return theme;
        }
        return undefined;
    }

    private kebabCase(str: string): string {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getThemeEngine = (): ThemeEngine => ThemeEngine.getInstance();

export default ThemeEngine;
