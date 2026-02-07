/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM PLUGIN SYSTEM                                                        ║
 * ║   "Extensible plugin architecture"                                            ║
 * ║                                                                               ║
 * ║   TODO B #44 - Plugin System                                                  ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Plugin metadata
 */
export interface PluginMetadata {
    name: string;
    version: string;
    description?: string;
    author?: string;
    license?: string;
    homepage?: string;
    repository?: string;
    keywords?: string[];
    dependencies?: { [name: string]: string };
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
    /** Called when plugin is registered */
    onRegister?(context: PluginContext): void | Promise<void>;
    
    /** Called when plugin is initialized */
    onInit?(context: PluginContext): void | Promise<void>;
    
    /** Called before each test */
    beforeTest?(context: TestContext): void | Promise<void>;
    
    /** Called after each test */
    afterTest?(context: TestContext): void | Promise<void>;
    
    /** Called before each suite */
    beforeSuite?(context: SuiteContext): void | Promise<void>;
    
    /** Called after each suite */
    afterSuite?(context: SuiteContext): void | Promise<void>;
    
    /** Called before all tests */
    beforeAll?(context: PluginContext): void | Promise<void>;
    
    /** Called after all tests */
    afterAll?(context: PluginContext, results: TestResults): void | Promise<void>;
    
    /** Called on error */
    onError?(error: Error, context: PluginContext): void | Promise<void>;
    
    /** Called when plugin is destroyed */
    onDestroy?(context: PluginContext): void | Promise<void>;
}

/**
 * Plugin interface
 */
export interface Plugin extends PluginHooks {
    metadata: PluginMetadata;
    config?: any;
}

/**
 * Plugin context
 */
export interface PluginContext {
    /** Plugin manager instance */
    manager: PluginManager;
    
    /** Configuration */
    config: any;
    
    /** Logger */
    log: PluginLogger;
    
    /** Storage for plugin data */
    storage: Map<string, any>;
    
    /** Get other plugin */
    getPlugin<T extends Plugin>(name: string): T | undefined;
    
    /** Emit event */
    emit(event: string, data?: any): void;
    
    /** Listen to event */
    on(event: string, handler: (data: any) => void): () => void;
}

/**
 * Test context
 */
export interface TestContext {
    name: string;
    suite?: string;
    file?: string;
    timeout: number;
    metadata: Map<string, any>;
}

/**
 * Suite context
 */
export interface SuiteContext {
    name: string;
    file?: string;
    tests: string[];
    metadata: Map<string, any>;
}

/**
 * Test results
 */
export interface TestResults {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    failures: Array<{
        name: string;
        error: Error;
        duration: number;
    }>;
}

/**
 * Plugin logger
 */
export interface PluginLogger {
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
}

/**
 * Plugin definition (for factory function)
 */
export type PluginFactory = (config?: any) => Plugin;

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Plugin Manager
 */
export class PluginManager {
    private plugins: Map<string, Plugin> = new Map();
    private initialized: Set<string> = new Set();
    private eventHandlers: Map<string, Array<(data: any) => void>> = new Map();
    private storage: Map<string, Map<string, any>> = new Map();

    /**
     * Register a plugin
     */
    async register(plugin: Plugin | PluginFactory, config?: any): Promise<void> {
        // Handle factory function
        const resolvedPlugin = typeof plugin === 'function' ? plugin(config) : plugin;
        
        const { name, version } = resolvedPlugin.metadata;

        if (this.plugins.has(name)) {
            throw new Error(`Plugin '${name}' is already registered`);
        }

        // Check dependencies
        if (resolvedPlugin.metadata.dependencies) {
            for (const [dep, requiredVersion] of Object.entries(resolvedPlugin.metadata.dependencies)) {
                if (!this.plugins.has(dep)) {
                    throw new Error(`Plugin '${name}' requires '${dep}' v${requiredVersion}`);
                }
            }
        }

        // Store plugin
        this.plugins.set(name, resolvedPlugin);
        this.storage.set(name, new Map());

        // Create context
        const context = this.createContext(name);

        // Call onRegister hook
        if (resolvedPlugin.onRegister) {
            await resolvedPlugin.onRegister(context);
        }

        this.log(`Registered plugin: ${name}@${version}`);
    }

    /**
     * Initialize all plugins
     */
    async init(): Promise<void> {
        for (const [name, plugin] of this.plugins) {
            if (this.initialized.has(name)) continue;

            const context = this.createContext(name);

            if (plugin.onInit) {
                await plugin.onInit(context);
            }

            this.initialized.add(name);
            this.log(`Initialized plugin: ${name}`);
        }
    }

    /**
     * Get a plugin
     */
    get<T extends Plugin>(name: string): T | undefined {
        return this.plugins.get(name) as T | undefined;
    }

    /**
     * Check if plugin is registered
     */
    has(name: string): boolean {
        return this.plugins.has(name);
    }

    /**
     * Get all plugins
     */
    getAll(): Plugin[] {
        return Array.from(this.plugins.values());
    }

    /**
     * Unregister a plugin
     */
    async unregister(name: string): Promise<void> {
        const plugin = this.plugins.get(name);
        if (!plugin) return;

        // Check if other plugins depend on this
        for (const [depName, depPlugin] of this.plugins) {
            if (depPlugin.metadata.dependencies?.[name]) {
                throw new Error(`Cannot unregister '${name}': '${depName}' depends on it`);
            }
        }

        const context = this.createContext(name);

        if (plugin.onDestroy) {
            await plugin.onDestroy(context);
        }

        this.plugins.delete(name);
        this.initialized.delete(name);
        this.storage.delete(name);

        this.log(`Unregistered plugin: ${name}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LIFECYCLE HOOKS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Call beforeAll hooks
     */
    async beforeAll(): Promise<void> {
        for (const [name, plugin] of this.plugins) {
            if (plugin.beforeAll) {
                await plugin.beforeAll(this.createContext(name));
            }
        }
    }

    /**
     * Call afterAll hooks
     */
    async afterAll(results: TestResults): Promise<void> {
        for (const [name, plugin] of this.plugins) {
            if (plugin.afterAll) {
                await plugin.afterAll(this.createContext(name), results);
            }
        }
    }

    /**
     * Call beforeSuite hooks
     */
    async beforeSuite(context: SuiteContext): Promise<void> {
        for (const [, plugin] of this.plugins) {
            if (plugin.beforeSuite) {
                await plugin.beforeSuite(context);
            }
        }
    }

    /**
     * Call afterSuite hooks
     */
    async afterSuite(context: SuiteContext): Promise<void> {
        for (const [, plugin] of this.plugins) {
            if (plugin.afterSuite) {
                await plugin.afterSuite(context);
            }
        }
    }

    /**
     * Call beforeTest hooks
     */
    async beforeTest(context: TestContext): Promise<void> {
        for (const [, plugin] of this.plugins) {
            if (plugin.beforeTest) {
                await plugin.beforeTest(context);
            }
        }
    }

    /**
     * Call afterTest hooks
     */
    async afterTest(context: TestContext): Promise<void> {
        for (const [, plugin] of this.plugins) {
            if (plugin.afterTest) {
                await plugin.afterTest(context);
            }
        }
    }

    /**
     * Call onError hooks
     */
    async onError(error: Error): Promise<void> {
        for (const [name, plugin] of this.plugins) {
            if (plugin.onError) {
                await plugin.onError(error, this.createContext(name));
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Emit event
     */
    emit(event: string, data?: any): void {
        const handlers = this.eventHandlers.get(event) || [];
        for (const handler of handlers) {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in event handler for '${event}':`, error);
            }
        }
    }

    /**
     * Subscribe to event
     */
    on(event: string, handler: (data: any) => void): () => void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event)!.push(handler);

        return () => {
            const handlers = this.eventHandlers.get(event);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index >= 0) handlers.splice(index, 1);
            }
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create plugin context
     */
    private createContext(pluginName: string): PluginContext {
        const plugin = this.plugins.get(pluginName);
        const storage = this.storage.get(pluginName) || new Map();

        return {
            manager: this,
            config: plugin?.config || {},
            log: this.createLogger(pluginName),
            storage,
            getPlugin: <T extends Plugin>(name: string) => this.get<T>(name),
            emit: (event: string, data?: any) => this.emit(event, data),
            on: (event: string, handler: (data: any) => void) => this.on(event, handler)
        };
    }

    /**
     * Create plugin logger
     */
    private createLogger(pluginName: string): PluginLogger {
        const prefix = `[${pluginName}]`;
        return {
            debug: (...args: any[]) => console.debug(prefix, ...args),
            info: (...args: any[]) => console.info(prefix, ...args),
            warn: (...args: any[]) => console.warn(prefix, ...args),
            error: (...args: any[]) => console.error(prefix, ...args)
        };
    }

    /**
     * Internal log
     */
    private log(message: string): void {
        console.debug('[PluginManager]', message);
    }

    /**
     * Destroy all plugins
     */
    async destroy(): Promise<void> {
        for (const name of Array.from(this.plugins.keys()).reverse()) {
            await this.unregister(name);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fluent plugin builder
 */
export class PluginBuilder {
    private plugin: Partial<Plugin> = {
        metadata: {
            name: '',
            version: '1.0.0'
        }
    };

    static create(name: string): PluginBuilder {
        const builder = new PluginBuilder();
        builder.plugin.metadata!.name = name;
        return builder;
    }

    version(version: string): this {
        this.plugin.metadata!.version = version;
        return this;
    }

    description(desc: string): this {
        this.plugin.metadata!.description = desc;
        return this;
    }

    author(author: string): this {
        this.plugin.metadata!.author = author;
        return this;
    }

    license(license: string): this {
        this.plugin.metadata!.license = license;
        return this;
    }

    keywords(...keywords: string[]): this {
        this.plugin.metadata!.keywords = keywords;
        return this;
    }

    depends(name: string, version: string = '*'): this {
        this.plugin.metadata!.dependencies = this.plugin.metadata!.dependencies || {};
        this.plugin.metadata!.dependencies[name] = version;
        return this;
    }

    config(config: any): this {
        this.plugin.config = config;
        return this;
    }

    onRegister(hook: PluginHooks['onRegister']): this {
        this.plugin.onRegister = hook;
        return this;
    }

    onInit(hook: PluginHooks['onInit']): this {
        this.plugin.onInit = hook;
        return this;
    }

    beforeTest(hook: PluginHooks['beforeTest']): this {
        this.plugin.beforeTest = hook;
        return this;
    }

    afterTest(hook: PluginHooks['afterTest']): this {
        this.plugin.afterTest = hook;
        return this;
    }

    beforeSuite(hook: PluginHooks['beforeSuite']): this {
        this.plugin.beforeSuite = hook;
        return this;
    }

    afterSuite(hook: PluginHooks['afterSuite']): this {
        this.plugin.afterSuite = hook;
        return this;
    }

    beforeAll(hook: PluginHooks['beforeAll']): this {
        this.plugin.beforeAll = hook;
        return this;
    }

    afterAll(hook: PluginHooks['afterAll']): this {
        this.plugin.afterAll = hook;
        return this;
    }

    onError(hook: PluginHooks['onError']): this {
        this.plugin.onError = hook;
        return this;
    }

    onDestroy(hook: PluginHooks['onDestroy']): this {
        this.plugin.onDestroy = hook;
        return this;
    }

    build(): Plugin {
        if (!this.plugin.metadata?.name) {
            throw new Error('Plugin name is required');
        }
        return this.plugin as Plugin;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN PLUGINS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Timer plugin - tracks test duration
 */
export const TimerPlugin: PluginFactory = () => 
    PluginBuilder.create('timer')
        .version('1.0.0')
        .description('Tracks test execution time')
        .beforeTest((ctx) => {
            ctx.metadata.set('startTime', Date.now());
        })
        .afterTest((ctx) => {
            const start = ctx.metadata.get('startTime');
            const duration = Date.now() - start;
            ctx.metadata.set('duration', duration);
        })
        .build();

/**
 * Retry plugin - retries failed tests
 */
export const RetryPlugin: PluginFactory = (config?: { maxRetries?: number }) =>
    PluginBuilder.create('retry')
        .version('1.0.0')
        .description('Retries failed tests')
        .config({ maxRetries: config?.maxRetries || 3 })
        .onInit((ctx) => {
            ctx.storage.set('retries', new Map());
        })
        .build();

/**
 * Console reporter plugin
 */
export const ConsoleReporterPlugin: PluginFactory = () =>
    PluginBuilder.create('console-reporter')
        .version('1.0.0')
        .description('Console output reporter')
        .beforeSuite((ctx) => {
            console.log(`\n📁 Suite: ${ctx.name}`);
        })
        .beforeTest((ctx) => {
            console.log(`  ⏳ ${ctx.name}`);
        })
        .afterTest((ctx) => {
            const duration = ctx.metadata.get('duration') || 0;
            console.log(`  ✅ ${ctx.name} (${duration}ms)`);
        })
        .afterAll((_, results) => {
            console.log('\n' + '═'.repeat(60));
            console.log(`📊 Results: ${results.passed}/${results.total} passed`);
            console.log(`⏱️  Duration: ${results.duration}ms`);
            console.log('═'.repeat(60) + '\n');
        })
        .build();

/**
 * Screenshot plugin
 */
export const ScreenshotPlugin: PluginFactory = (config?: { onFailure?: boolean }) =>
    PluginBuilder.create('screenshot')
        .version('1.0.0')
        .description('Captures screenshots')
        .config({ onFailure: config?.onFailure ?? true })
        .build();
