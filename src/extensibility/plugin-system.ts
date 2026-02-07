/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM PLUGIN SYSTEM                                                        ║
 * ║   "Hot-loadable plugin architecture with lifecycle hooks"                     ║
 * ║                                                                               ║
 * ║   TODO B #46 - Extensibility: Plugin System                                   ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    main: string;
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    activationEvents?: string[];
    contributes?: PluginContributions;
}

export interface PluginContributions {
    commands?: CommandContribution[];
    configuration?: ConfigurationContribution[];
    hooks?: HookContribution[];
}

export interface CommandContribution {
    command: string;
    title: string;
    description?: string;
}

export interface ConfigurationContribution {
    key: string;
    type: string;
    default: any;
    description: string;
}

export interface HookContribution {
    event: string;
    priority?: number;
}

export type PluginState = 'inactive' | 'activating' | 'active' | 'deactivating' | 'error';

export interface PluginContext {
    pluginId: string;
    version: string;
    storage: PluginStorage;
    logger: PluginLogger;
    subscriptions: Disposable[];
}

export interface Disposable {
    dispose(): void;
}

export interface PluginStorage {
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T): void;
    delete(key: string): void;
    keys(): string[];
}

export interface PluginLogger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

export interface Plugin {
    activate(context: PluginContext): void | Promise<void>;
    deactivate?(): void | Promise<void>;
}

export interface PluginInfo {
    manifest: PluginManifest;
    state: PluginState;
    instance?: Plugin;
    context?: PluginContext;
    error?: Error;
    loadedAt?: Date;
    activatedAt?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN STORAGE
// ═══════════════════════════════════════════════════════════════════════════════

class PluginStorageImpl implements PluginStorage {
    private data: Map<string, any> = new Map();
    private prefix: string;

    constructor(pluginId: string) {
        this.prefix = `plugin:${pluginId}:`;
    }

    get<T>(key: string): T | undefined {
        return this.data.get(this.prefix + key);
    }

    set<T>(key: string, value: T): void {
        this.data.set(this.prefix + key, value);
    }

    delete(key: string): void {
        this.data.delete(this.prefix + key);
    }

    keys(): string[] {
        return [...this.data.keys()]
            .filter(k => k.startsWith(this.prefix))
            .map(k => k.slice(this.prefix.length));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN LOGGER
// ═══════════════════════════════════════════════════════════════════════════════

class PluginLoggerImpl implements PluginLogger {
    constructor(private pluginId: string) {}

    private format(level: string, message: string): string {
        return `[${new Date().toISOString()}] [${level}] [${this.pluginId}] ${message}`;
    }

    debug(message: string, ...args: any[]): void {
        console.debug(this.format('DEBUG', message), ...args);
    }

    info(message: string, ...args: any[]): void {
        console.info(this.format('INFO', message), ...args);
    }

    warn(message: string, ...args: any[]): void {
        console.warn(this.format('WARN', message), ...args);
    }

    error(message: string, ...args: any[]): void {
        console.error(this.format('ERROR', message), ...args);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

type HookCallback = (...args: any[]) => any | Promise<any>;

interface HookRegistration {
    pluginId: string;
    callback: HookCallback;
    priority: number;
}

class HookManager {
    private hooks: Map<string, HookRegistration[]> = new Map();

    register(
        event: string,
        pluginId: string,
        callback: HookCallback,
        priority: number = 0
    ): Disposable {
        const registrations = this.hooks.get(event) || [];
        const registration: HookRegistration = { pluginId, callback, priority };
        
        registrations.push(registration);
        registrations.sort((a, b) => b.priority - a.priority);
        this.hooks.set(event, registrations);

        return {
            dispose: () => {
                const regs = this.hooks.get(event);
                if (regs) {
                    const idx = regs.indexOf(registration);
                    if (idx >= 0) regs.splice(idx, 1);
                }
            }
        };
    }

    async trigger(event: string, ...args: any[]): Promise<any[]> {
        const registrations = this.hooks.get(event) || [];
        const results: any[] = [];

        for (const reg of registrations) {
            try {
                const result = await reg.callback(...args);
                results.push(result);
            } catch (error) {
                console.error(`[Hook] Error in ${reg.pluginId} for ${event}:`, error);
            }
        }

        return results;
    }

    async triggerWaterfall<T>(event: string, initial: T): Promise<T> {
        const registrations = this.hooks.get(event) || [];
        let result = initial;

        for (const reg of registrations) {
            try {
                result = await reg.callback(result);
            } catch (error) {
                console.error(`[Hook] Error in ${reg.pluginId} for ${event}:`, error);
            }
        }

        return result;
    }

    unregisterAll(pluginId: string): void {
        for (const [event, registrations] of this.hooks) {
            this.hooks.set(
                event,
                registrations.filter(r => r.pluginId !== pluginId)
            );
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class PluginManager {
    private static instance: PluginManager;
    
    private plugins: Map<string, PluginInfo> = new Map();
    private hooks: HookManager = new HookManager();
    private commands: Map<string, { pluginId: string; handler: Function }> = new Map();

    static getInstance(): PluginManager {
        if (!PluginManager.instance) {
            PluginManager.instance = new PluginManager();
        }
        return PluginManager.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PLUGIN LIFECYCLE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Register a plugin from manifest
     */
    register(manifest: PluginManifest, PluginClass: new () => Plugin): void {
        if (this.plugins.has(manifest.id)) {
            throw new Error(`Plugin ${manifest.id} already registered`);
        }

        const info: PluginInfo = {
            manifest,
            state: 'inactive',
            instance: new PluginClass(),
            loadedAt: new Date()
        };

        this.plugins.set(manifest.id, info);
        console.log(`[PluginManager] Registered: ${manifest.name} v${manifest.version}`);
    }

    /**
     * Activate a plugin
     */
    async activate(pluginId: string): Promise<void> {
        const info = this.plugins.get(pluginId);
        if (!info) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        if (info.state === 'active') {
            return; // Already active
        }

        info.state = 'activating';

        try {
            // Check dependencies
            await this.checkDependencies(info.manifest);

            // Create context
            const context = this.createContext(info.manifest);
            info.context = context;

            // Activate plugin
            await info.instance!.activate(context);

            // Register contributions
            this.registerContributions(info);

            info.state = 'active';
            info.activatedAt = new Date();

            await this.hooks.trigger('plugin:activated', pluginId);
            console.log(`[PluginManager] Activated: ${info.manifest.name}`);

        } catch (error) {
            info.state = 'error';
            info.error = error as Error;
            throw error;
        }
    }

    /**
     * Deactivate a plugin
     */
    async deactivate(pluginId: string): Promise<void> {
        const info = this.plugins.get(pluginId);
        if (!info || info.state !== 'active') {
            return;
        }

        info.state = 'deactivating';

        try {
            // Call deactivate hook
            if (info.instance?.deactivate) {
                await info.instance.deactivate();
            }

            // Dispose subscriptions
            if (info.context) {
                for (const sub of info.context.subscriptions) {
                    sub.dispose();
                }
            }

            // Unregister contributions
            this.unregisterContributions(pluginId);
            this.hooks.unregisterAll(pluginId);

            info.state = 'inactive';
            info.context = undefined;

            await this.hooks.trigger('plugin:deactivated', pluginId);
            console.log(`[PluginManager] Deactivated: ${info.manifest.name}`);

        } catch (error) {
            info.state = 'error';
            info.error = error as Error;
            throw error;
        }
    }

    /**
     * Uninstall a plugin
     */
    async uninstall(pluginId: string): Promise<void> {
        await this.deactivate(pluginId);
        this.plugins.delete(pluginId);
        console.log(`[PluginManager] Uninstalled: ${pluginId}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERIES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get plugin info
     */
    getPlugin(pluginId: string): PluginInfo | undefined {
        return this.plugins.get(pluginId);
    }

    /**
     * Get all plugins
     */
    getAllPlugins(): PluginInfo[] {
        return [...this.plugins.values()];
    }

    /**
     * Get active plugins
     */
    getActivePlugins(): PluginInfo[] {
        return this.getAllPlugins().filter(p => p.state === 'active');
    }

    /**
     * Check if plugin is active
     */
    isActive(pluginId: string): boolean {
        return this.plugins.get(pluginId)?.state === 'active';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMMANDS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Register a command
     */
    registerCommand(
        pluginId: string,
        command: string,
        handler: Function
    ): Disposable {
        this.commands.set(command, { pluginId, handler });
        
        return {
            dispose: () => {
                const cmd = this.commands.get(command);
                if (cmd?.pluginId === pluginId) {
                    this.commands.delete(command);
                }
            }
        };
    }

    /**
     * Execute a command
     */
    async executeCommand(command: string, ...args: any[]): Promise<any> {
        const cmd = this.commands.get(command);
        if (!cmd) {
            throw new Error(`Command not found: ${command}`);
        }

        if (!this.isActive(cmd.pluginId)) {
            throw new Error(`Plugin ${cmd.pluginId} is not active`);
        }

        return cmd.handler(...args);
    }

    /**
     * Get all commands
     */
    getCommands(): string[] {
        return [...this.commands.keys()];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HOOKS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Register a hook
     */
    registerHook(
        pluginId: string,
        event: string,
        callback: HookCallback,
        priority?: number
    ): Disposable {
        return this.hooks.register(event, pluginId, callback, priority);
    }

    /**
     * Trigger a hook
     */
    async triggerHook(event: string, ...args: any[]): Promise<any[]> {
        return this.hooks.trigger(event, ...args);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE
    // ─────────────────────────────────────────────────────────────────────────

    private createContext(manifest: PluginManifest): PluginContext {
        return {
            pluginId: manifest.id,
            version: manifest.version,
            storage: new PluginStorageImpl(manifest.id),
            logger: new PluginLoggerImpl(manifest.id),
            subscriptions: []
        };
    }

    private async checkDependencies(manifest: PluginManifest): Promise<void> {
        if (!manifest.dependencies) return;

        for (const [depId, version] of Object.entries(manifest.dependencies)) {
            const dep = this.plugins.get(depId);
            if (!dep) {
                throw new Error(`Missing dependency: ${depId}`);
            }
            if (dep.state !== 'active') {
                await this.activate(depId);
            }
        }
    }

    private registerContributions(info: PluginInfo): void {
        const { manifest, context } = info;
        if (!manifest.contributes || !context) return;

        // Register commands
        if (manifest.contributes.commands) {
            for (const cmd of manifest.contributes.commands) {
                // Commands will be registered by the plugin itself
            }
        }

        // Register hooks
        if (manifest.contributes.hooks) {
            for (const hook of manifest.contributes.hooks) {
                // Hooks will be registered by the plugin itself
            }
        }
    }

    private unregisterContributions(pluginId: string): void {
        // Remove commands
        for (const [cmd, info] of this.commands) {
            if (info.pluginId === pluginId) {
                this.commands.delete(cmd);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @Command - Register a method as a command
 */
export function Command(command: string): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        // Store for later registration
        if (!target._commands) target._commands = [];
        target._commands.push({ command, method: propertyKey });
        return descriptor;
    };
}

/**
 * @Hook - Register a method as a hook handler
 */
export function Hook(event: string, priority: number = 0): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        if (!target._hooks) target._hooks = [];
        target._hooks.push({ event, method: propertyKey, priority });
        return descriptor;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getPluginManager = (): PluginManager => PluginManager.getInstance();

export default PluginManager;
