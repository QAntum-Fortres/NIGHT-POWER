/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM CONFIGURATION LOADER                                                 ║
 * ║   "Multi-format config loading with environment support"                      ║
 * ║                                                                               ║
 * ║   TODO B #43 - Configuration Management                                       ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ConfigValue {
    [key: string]: any;
}

export interface ConfigSource {
    name: string;
    priority: number;
    load(): Promise<ConfigValue> | ConfigValue;
}

export interface ConfigLoaderOptions {
    /** Base paths to search for config files */
    basePaths?: string[];
    /** Environment variable prefix for filtering */
    envPrefix?: string;
    /** Default values */
    defaults?: ConfigValue;
    /** Watch for changes */
    watch?: boolean;
    /** Merge strategy: 'deep' | 'shallow' */
    mergeStrategy?: 'deep' | 'shallow';
}

export interface ConfigFormat {
    extensions: string[];
    parse(content: string): ConfigValue;
    stringify?(value: ConfigValue): string;
}

export type ConfigChangeHandler = (key: string, newValue: any, oldValue: any) => void;

// ═══════════════════════════════════════════════════════════════════════════════
// PARSERS
// ═══════════════════════════════════════════════════════════════════════════════

const JSON_FORMAT: ConfigFormat = {
    extensions: ['.json', '.jsonc'],
    parse(content: string): ConfigValue {
        // Remove comments for JSONC
        const withoutComments = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        return JSON.parse(withoutComments);
    },
    stringify(value: ConfigValue): string {
        return JSON.stringify(value, null, 2);
    }
};

const YAML_FORMAT: ConfigFormat = {
    extensions: ['.yml', '.yaml'],
    parse(content: string): ConfigValue {
        // Simple YAML parser (basic support)
        const result: ConfigValue = {};
        const lines = content.split('\n');
        const stack: { indent: number; obj: any }[] = [{ indent: -1, obj: result }];

        for (const line of lines) {
            if (!line.trim() || line.trim().startsWith('#')) continue;

            const indent = line.search(/\S/);
            const trimmed = line.trim();

            // Pop stack until we find parent
            while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
                stack.pop();
            }

            const parent = stack[stack.length - 1].obj;

            if (trimmed.includes(':')) {
                const colonIndex = trimmed.indexOf(':');
                const key = trimmed.slice(0, colonIndex).trim();
                const value = trimmed.slice(colonIndex + 1).trim();

                if (value) {
                    // Parse value
                    parent[key] = parseYamlValue(value);
                } else {
                    // Nested object
                    parent[key] = {};
                    stack.push({ indent, obj: parent[key] });
                }
            } else if (trimmed.startsWith('-')) {
                // Array item
                const arrayKey = Object.keys(parent).pop();
                if (arrayKey && !Array.isArray(parent[arrayKey])) {
                    parent[arrayKey] = [];
                }
                const arrayParent = parent[arrayKey];
                if (Array.isArray(arrayParent)) {
                    arrayParent.push(parseYamlValue(trimmed.slice(1).trim()));
                }
            }
        }

        return result;
    }
};

function parseYamlValue(value: string): any {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (/^-?\d+$/.test(value)) return parseInt(value, 10);
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
    }
    return value;
}

const ENV_FORMAT: ConfigFormat = {
    extensions: ['.env'],
    parse(content: string): ConfigValue {
        const result: ConfigValue = {};
        const lines = content.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            const equalIndex = trimmed.indexOf('=');
            if (equalIndex === -1) continue;

            const key = trimmed.slice(0, equalIndex).trim();
            let value = trimmed.slice(equalIndex + 1).trim();

            // Handle quoted values
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            // Convert to nested object using underscores
            setNestedValue(result, key.split('_'), value);
        }

        return result;
    }
};

const TOML_FORMAT: ConfigFormat = {
    extensions: ['.toml'],
    parse(content: string): ConfigValue {
        const result: ConfigValue = {};
        let currentSection = result;
        const lines = content.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            // Section header
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                const section = trimmed.slice(1, -1);
                const parts = section.split('.');
                currentSection = result;
                for (const part of parts) {
                    currentSection[part] = currentSection[part] || {};
                    currentSection = currentSection[part];
                }
                continue;
            }

            // Key-value pair
            const equalIndex = trimmed.indexOf('=');
            if (equalIndex === -1) continue;

            const key = trimmed.slice(0, equalIndex).trim();
            const value = trimmed.slice(equalIndex + 1).trim();

            currentSection[key] = parseTomlValue(value);
        }

        return result;
    }
};

function parseTomlValue(value: string): any {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^-?\d+$/.test(value)) return parseInt(value, 10);
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
    if (value.startsWith('"') && value.endsWith('"')) {
        return value.slice(1, -1);
    }
    if (value.startsWith('[') && value.endsWith(']')) {
        // Simple array parsing
        const inner = value.slice(1, -1);
        return inner.split(',').map(v => parseTomlValue(v.trim()));
    }
    return value;
}

function setNestedValue(obj: any, keys: string[], value: any): void {
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i].toLowerCase();
        current[key] = current[key] || {};
        current = current[key];
    }
    current[keys[keys.length - 1].toLowerCase()] = value;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG SOURCES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Environment variables source
 */
export class EnvSource implements ConfigSource {
    name: string;
    priority: number;

    constructor(
        private prefix: string = '',
        priority: number = 100
    ) {
        this.name = `env:${prefix || '*'}`;
        this.priority = priority;
    }

    load(): ConfigValue {
        const result: ConfigValue = {};

        for (const [key, value] of Object.entries(process.env)) {
            if (this.prefix && !key.startsWith(this.prefix)) continue;

            const configKey = this.prefix 
                ? key.slice(this.prefix.length).replace(/^_/, '') 
                : key;

            const parts = configKey.split('_');
            setNestedValue(result, parts, value);
        }

        return result;
    }
}

/**
 * File source
 */
export class FileSource implements ConfigSource {
    name: string;
    priority: number;
    private format?: ConfigFormat;

    constructor(
        private filePath: string,
        priority: number = 50,
        format?: ConfigFormat
    ) {
        this.name = `file:${filePath}`;
        this.priority = priority;
        this.format = format;
    }

    load(): ConfigValue {
        if (!fs.existsSync(this.filePath)) {
            return {};
        }

        const content = fs.readFileSync(this.filePath, 'utf-8');
        const ext = path.extname(this.filePath).toLowerCase();

        const format = this.format || this.getFormat(ext);
        if (!format) {
            throw new Error(`Unsupported config format: ${ext}`);
        }

        return format.parse(content);
    }

    private getFormat(ext: string): ConfigFormat | undefined {
        const formats = [JSON_FORMAT, YAML_FORMAT, ENV_FORMAT, TOML_FORMAT];
        return formats.find(f => f.extensions.includes(ext));
    }
}

/**
 * Object source (for programmatic config)
 */
export class ObjectSource implements ConfigSource {
    name: string;
    priority: number;

    constructor(
        private config: ConfigValue,
        name: string = 'object',
        priority: number = 75
    ) {
        this.name = name;
        this.priority = priority;
    }

    load(): ConfigValue {
        return { ...this.config };
    }
}

/**
 * Remote source (for fetching config from URL)
 */
export class RemoteSource implements ConfigSource {
    name: string;
    priority: number;

    constructor(
        private url: string,
        priority: number = 25
    ) {
        this.name = `remote:${url}`;
        this.priority = priority;
    }

    async load(): Promise<ConfigValue> {
        try {
            const response = await fetch(this.url);
            const content = await response.text();
            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('yaml') || this.url.endsWith('.yaml') || this.url.endsWith('.yml')) {
                return YAML_FORMAT.parse(content);
            }

            return JSON.parse(content);
        } catch (error) {
            console.warn(`Failed to load remote config from ${this.url}:`, error);
            return {};
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG LOADER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Configuration Loader
 */
export class ConfigLoader {
    private sources: ConfigSource[] = [];
    private config: ConfigValue = {};
    private changeHandlers: ConfigChangeHandler[] = [];
    private watchers: fs.FSWatcher[] = [];
    private loaded = false;

    constructor(private options: ConfigLoaderOptions = {}) {
        this.config = options.defaults ? deepMerge({}, options.defaults) : {};
    }

    /**
     * Add configuration source
     */
    addSource(source: ConfigSource): this {
        this.sources.push(source);
        this.sources.sort((a, b) => a.priority - b.priority);
        this.loaded = false;
        return this;
    }

    /**
     * Add file source
     */
    addFile(filePath: string, priority?: number): this {
        return this.addSource(new FileSource(filePath, priority));
    }

    /**
     * Add environment source
     */
    addEnv(prefix?: string, priority?: number): this {
        return this.addSource(new EnvSource(prefix, priority));
    }

    /**
     * Add object source
     */
    addObject(config: ConfigValue, name?: string, priority?: number): this {
        return this.addSource(new ObjectSource(config, name, priority));
    }

    /**
     * Add remote source
     */
    addRemote(url: string, priority?: number): this {
        return this.addSource(new RemoteSource(url, priority));
    }

    /**
     * Load all sources
     */
    async load(): Promise<ConfigValue> {
        const loadedConfigs: ConfigValue[] = [];

        for (const source of this.sources) {
            try {
                const config = await source.load();
                loadedConfigs.push(config);
            } catch (error) {
                console.warn(`Failed to load config from ${source.name}:`, error);
            }
        }

        // Merge all configs (higher priority sources later)
        this.config = this.options.defaults ? deepMerge({}, this.options.defaults) : {};
        for (const loaded of loadedConfigs) {
            if (this.options.mergeStrategy === 'shallow') {
                Object.assign(this.config, loaded);
            } else {
                deepMerge(this.config, loaded);
            }
        }

        this.loaded = true;

        // Setup watchers if needed
        if (this.options.watch) {
            this.setupWatchers();
        }

        return this.config;
    }

    /**
     * Load synchronously (file sources only)
     */
    loadSync(): ConfigValue {
        const loadedConfigs: ConfigValue[] = [];

        for (const source of this.sources) {
            if (source instanceof FileSource || 
                source instanceof ObjectSource || 
                source instanceof EnvSource) {
                try {
                    const config = source.load() as ConfigValue;
                    loadedConfigs.push(config);
                } catch (error) {
                    console.warn(`Failed to load config from ${source.name}:`, error);
                }
            }
        }

        this.config = this.options.defaults ? deepMerge({}, this.options.defaults) : {};
        for (const loaded of loadedConfigs) {
            if (this.options.mergeStrategy === 'shallow') {
                Object.assign(this.config, loaded);
            } else {
                deepMerge(this.config, loaded);
            }
        }

        this.loaded = true;
        return this.config;
    }

    /**
     * Get configuration value
     */
    get<T = any>(key: string, defaultValue?: T): T {
        if (!this.loaded) {
            this.loadSync();
        }

        const parts = key.split('.');
        let current: any = this.config;

        for (const part of parts) {
            if (current === undefined || current === null) {
                return defaultValue as T;
            }
            current = current[part];
        }

        return current !== undefined ? current : defaultValue as T;
    }

    /**
     * Set configuration value
     */
    set(key: string, value: any): this {
        const parts = key.split('.');
        let current = this.config;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            current[part] = current[part] || {};
            current = current[part];
        }

        const lastKey = parts[parts.length - 1];
        const oldValue = current[lastKey];
        current[lastKey] = value;

        // Notify change handlers
        for (const handler of this.changeHandlers) {
            handler(key, value, oldValue);
        }

        return this;
    }

    /**
     * Check if key exists
     */
    has(key: string): boolean {
        return this.get(key) !== undefined;
    }

    /**
     * Get all configuration
     */
    getAll(): ConfigValue {
        if (!this.loaded) {
            this.loadSync();
        }
        return { ...this.config };
    }

    /**
     * Subscribe to changes
     */
    onChange(handler: ConfigChangeHandler): () => void {
        this.changeHandlers.push(handler);
        return () => {
            const index = this.changeHandlers.indexOf(handler);
            if (index >= 0) {
                this.changeHandlers.splice(index, 1);
            }
        };
    }

    /**
     * Setup file watchers
     */
    private setupWatchers(): void {
        for (const source of this.sources) {
            if (source instanceof FileSource) {
                const filePath = (source as any).filePath;
                if (fs.existsSync(filePath)) {
                    const watcher = fs.watch(filePath, async () => {
                        await this.load();
                    });
                    this.watchers.push(watcher);
                }
            }
        }
    }

    /**
     * Stop watching
     */
    stopWatching(): void {
        for (const watcher of this.watchers) {
            watcher.close();
        }
        this.watchers = [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Deep merge objects
 */
function deepMerge(target: any, source: any): any {
    for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            target[key] = target[key] || {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { JSON_FORMAT, YAML_FORMAT, ENV_FORMAT, TOML_FORMAT };
export { deepMerge };
