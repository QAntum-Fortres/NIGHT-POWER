/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: PLUGIN SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Extensible plugin architecture for Mind Engine
 * Plugin loading, lifecycle, hooks, and extensions
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0-QANTUM-PRIME
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

import { logger } from '../api/unified/utils/logger';
// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  dependencies?: Record<string, string>;
  engines?: Record<string, string>;
  main?: string;
  hooks?: string[];
}

export interface PluginContext {
  mind: MindEngineContext;
  config: Record<string, any>;
  logger: Logger;
  storage: PluginStorage;
}

export interface MindEngineContext {
  version: string;
  registerHook: (name: string, handler: HookHandler) => void;
  unregisterHook: (name: string, handler: HookHandler) => void;
  registerCommand: (command: PluginCommand) => void;
  registerReporter: (reporter: PluginReporter) => void;
  registerAdapter: (adapter: PluginAdapter) => void;
}

export interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

export interface PluginStorage {
  get: (key: string) => any;
  set: (key: string, value: any) => void;
  delete: (key: string) => void;
  clear: () => void;
}

export type HookHandler = (context: any) => Promise<any> | any;

export interface PluginCommand {
  name: string;
  description: string;
  execute: (args: string[], options: Record<string, any>) => Promise<void>;
}

export interface PluginReporter {
  name: string;
  onTestStart?: (test: any) => void;
  onTestEnd?: (test: any, result: any) => void;
  onSuiteStart?: (suite: any) => void;
  onSuiteEnd?: (suite: any, results: any) => void;
  generate?: (results: any) => Promise<void>;
}

export interface PluginAdapter {
  name: string;
  init: () => Promise<void>;
  dispose: () => Promise<void>;
  execute: (action: any) => Promise<any>;
}

export interface Plugin {
  metadata: PluginMetadata;
  activate: (context: PluginContext) => Promise<void> | void;
  deactivate?: () => Promise<void> | void;
}

export type PluginState = 'inactive' | 'activating' | 'active' | 'deactivating' | 'error';

interface LoadedPlugin {
  plugin: Plugin;
  state: PluginState;
  error?: Error;
  loadedAt: Date;
  activatedAt?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN HOOK SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export class HookRegistry {
  private hooks: Map<string, Set<HookHandler>> = new Map();

  register(name: string, handler: HookHandler): void {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, new Set());
    }
    this.hooks.get(name)!.add(handler);
  }

  unregister(name: string, handler: HookHandler): void {
    this.hooks.get(name)?.delete(handler);
  }

  async trigger(name: string, context: any): Promise<any[]> {
    const handlers = this.hooks.get(name);
    if (!handlers || handlers.size === 0) {
      return [];
    }

    const results: any[] = [];
    for (const handler of handlers) {
      try {
        const result = await handler(context);
        results.push(result);
      } catch (error) {
        logger.error(`Hook ${name} error:`, error);
      }
    }
    return results;
  }

  async triggerWaterfall(name: string, initialValue: any): Promise<any> {
    const handlers = this.hooks.get(name);
    if (!handlers || handlers.size === 0) {
      return initialValue;
    }

    let value = initialValue;
    for (const handler of handlers) {
      try {
        value = await handler(value);
      } catch (error) {
        logger.error(`Hook ${name} error:`, error);
      }
    }
    return value;
  }

  getHookNames(): string[] {
    return Array.from(this.hooks.keys());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class PluginManager extends EventEmitter {
  private plugins: Map<string, LoadedPlugin> = new Map();
  private hooks: HookRegistry = new HookRegistry();
  private commands: Map<string, PluginCommand> = new Map();
  private reporters: Map<string, PluginReporter> = new Map();
  private adapters: Map<string, PluginAdapter> = new Map();
  private pluginPaths: string[] = [];
  private storageDir: string;

  constructor(options: { pluginPaths?: string[]; storageDir?: string } = {}) {
    super();
    this.pluginPaths = options.pluginPaths || ['./plugins', './node_modules'];
    this.storageDir = options.storageDir || './.mind-plugins';
  }

  /**
   * Load plugin from path
   */
  async load(pluginPath: string): Promise<void> {
    try {
      const resolvedPath = this.resolvePath(pluginPath);
      
      // Load package.json or plugin module
      const metadata = await this.loadMetadata(resolvedPath);
      const plugin = await this.loadModule(resolvedPath, metadata);

      this.plugins.set(metadata.name, {
        plugin,
        state: 'inactive',
        loadedAt: new Date()
      });

      this.emit('loaded', metadata.name);

    } catch (error) {
      throw new Error(`Failed to load plugin ${pluginPath}: ${(error as Error).message}`);
    }
  }

  /**
   * Activate plugin
   */
  async activate(name: string): Promise<void> {
    const loaded = this.plugins.get(name);
    
    if (!loaded) {
      throw new Error(`Plugin not found: ${name}`);
    }

    if (loaded.state === 'active') {
      return;
    }

    loaded.state = 'activating';
    
    try {
      // Check dependencies
      await this.checkDependencies(loaded.plugin.metadata);

      // Create context
      const context = this.createContext(loaded.plugin.metadata);

      // Activate
      await loaded.plugin.activate(context);

      loaded.state = 'active';
      loaded.activatedAt = new Date();

      this.emit('activated', name);

    } catch (error) {
      loaded.state = 'error';
      loaded.error = error as Error;
      throw error;
    }
  }

  /**
   * Deactivate plugin
   */
  async deactivate(name: string): Promise<void> {
    const loaded = this.plugins.get(name);
    
    if (!loaded || loaded.state !== 'active') {
      return;
    }

    loaded.state = 'deactivating';

    try {
      if (loaded.plugin.deactivate) {
        await loaded.plugin.deactivate();
      }

      // Cleanup hooks registered by plugin
      this.cleanupPlugin(name);

      loaded.state = 'inactive';
      this.emit('deactivated', name);

    } catch (error) {
      loaded.state = 'error';
      loaded.error = error as Error;
      throw error;
    }
  }

  /**
   * Unload plugin
   */
  async unload(name: string): Promise<void> {
    await this.deactivate(name);
    this.plugins.delete(name);
    this.emit('unloaded', name);
  }

  /**
   * Discover and load plugins from paths
   */
  async discover(): Promise<string[]> {
    const discovered: string[] = [];

    for (const basePath of this.pluginPaths) {
      if (!fs.existsSync(basePath)) continue;

      const entries = fs.readdirSync(basePath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const pluginDir = path.join(basePath, entry.name);
        const packagePath = path.join(pluginDir, 'package.json');

        if (fs.existsSync(packagePath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
            
            if (pkg.mindEngine || pkg.keywords?.includes('mind-engine-plugin')) {
              await this.load(pluginDir);
              discovered.push(pkg.name);
            }
          } catch {
            // Skip invalid packages
          }
        }
      }
    }

    return discovered;
  }

  /**
   * Get plugin info
   */
  get(name: string): LoadedPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * List all plugins
   */
  list(): Array<{ name: string; state: PluginState; version: string }> {
    return Array.from(this.plugins.entries()).map(([name, loaded]) => ({
      name,
      state: loaded.state,
      version: loaded.plugin.metadata.version
    }));
  }

  /**
   * Trigger hook
   */
  async triggerHook(name: string, context: any): Promise<any[]> {
    return this.hooks.trigger(name, context);
  }

  /**
   * Get registered command
   */
  getCommand(name: string): PluginCommand | undefined {
    return this.commands.get(name);
  }

  /**
   * Get all commands
   */
  getCommands(): PluginCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get reporter
   */
  getReporter(name: string): PluginReporter | undefined {
    return this.reporters.get(name);
  }

  /**
   * Get adapter
   */
  getAdapter(name: string): PluginAdapter | undefined {
    return this.adapters.get(name);
  }

  private resolvePath(pluginPath: string): string {
    if (path.isAbsolute(pluginPath)) {
      return pluginPath;
    }

    // Check in plugin paths
    for (const basePath of this.pluginPaths) {
      const full = path.join(basePath, pluginPath);
      if (fs.existsSync(full)) {
        return full;
      }
    }

    // Try require.resolve
    return require.resolve(pluginPath);
  }

  private async loadMetadata(pluginPath: string): Promise<PluginMetadata> {
    const packagePath = path.join(pluginPath, 'package.json');
    
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      return {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        author: pkg.author,
        license: pkg.license,
        dependencies: pkg.dependencies,
        main: pkg.main || 'index.js',
        hooks: pkg.mindEngine?.hooks
      };
    }

    // Fallback for single-file plugins
    return {
      name: path.basename(pluginPath, '.js'),
      version: '1.0.0',
      main: path.basename(pluginPath)
    };
  }

  private async loadModule(pluginPath: string, metadata: PluginMetadata): Promise<Plugin> {
    const mainPath = path.join(pluginPath, metadata.main || 'index.js');
    const module = require(mainPath);
    
    const plugin = module.default || module;

    if (typeof plugin.activate !== 'function') {
      throw new Error('Plugin must export activate function');
    }

    return {
      metadata,
      activate: plugin.activate,
      deactivate: plugin.deactivate
    };
  }

  private async checkDependencies(metadata: PluginMetadata): Promise<void> {
    if (!metadata.dependencies) return;

    for (const [dep, version] of Object.entries(metadata.dependencies)) {
      // Check if dependency plugin is loaded
      if (dep.startsWith('mind-plugin-')) {
        const loaded = this.plugins.get(dep);
        if (!loaded || loaded.state !== 'active') {
          // Try to auto-load and activate
          await this.load(dep);
          await this.activate(dep);
        }
      }
    }
  }

  private createContext(metadata: PluginMetadata): PluginContext {
    const pluginStorage = this.createStorage(metadata.name);

    return {
      mind: {
        version: '1.0.0',
        registerHook: (name, handler) => {
          this.hooks.register(name, handler);
        },
        unregisterHook: (name, handler) => {
          this.hooks.unregister(name, handler);
        },
        registerCommand: (command) => {
          this.commands.set(command.name, command);
        },
        registerReporter: (reporter) => {
          this.reporters.set(reporter.name, reporter);
        },
        registerAdapter: (adapter) => {
          this.adapters.set(adapter.name, adapter);
        }
      },
      config: {},
      logger: this.createLogger(metadata.name),
      storage: pluginStorage
    };
  }

  private createLogger(name: string): Logger {
    const prefix = `[${name}]`;
    return {
      debug: (msg: string, ...args: unknown[]) => logger.debug(`${prefix} ${msg}`, args.length > 0 ? { args } : undefined),
      info: (msg: string, ...args: unknown[]) => logger.info(`${prefix} ${msg}`, args.length > 0 ? { args } : undefined),
      warn: (msg: string, ...args: unknown[]) => logger.warn(`${prefix} ${msg}`, args.length > 0 ? { args } : undefined),
      error: (msg: string, ...args: unknown[]) => logger.error(`${prefix} ${msg}`, args.length > 0 ? { args } : undefined)
    };
  }

  private createStorage(name: string): PluginStorage {
    const storePath = path.join(this.storageDir, `${name}.json`);
    let data: Record<string, any> = {};

    // Load existing
    if (fs.existsSync(storePath)) {
      try {
        data = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
      } catch {}
    }

    const save = () => {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
      fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
    };

    return {
      get: (key) => data[key],
      set: (key, value) => {
        data[key] = value;
        save();
      },
      delete: (key) => {
        delete data[key];
        save();
      },
      clear: () => {
        data = {};
        save();
      }
    };
  }

  private cleanupPlugin(name: string): void {
    // Would cleanup hooks, commands, reporters, adapters registered by plugin
    // In real implementation, we'd track what each plugin registered
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export const HOOKS = {
  // Lifecycle hooks
  BEFORE_ALL: 'mind:beforeAll',
  AFTER_ALL: 'mind:afterAll',
  BEFORE_EACH: 'mind:beforeEach',
  AFTER_EACH: 'mind:afterEach',

  // Test hooks
  TEST_START: 'mind:testStart',
  TEST_END: 'mind:testEnd',
  TEST_RETRY: 'mind:testRetry',
  TEST_SKIP: 'mind:testSkip',

  // Browser hooks
  BROWSER_LAUNCH: 'mind:browserLaunch',
  BROWSER_CLOSE: 'mind:browserClose',
  PAGE_CREATE: 'mind:pageCreate',
  PAGE_CLOSE: 'mind:pageClose',

  // Navigation hooks
  NAVIGATION_START: 'mind:navigationStart',
  NAVIGATION_END: 'mind:navigationEnd',

  // Action hooks
  BEFORE_ACTION: 'mind:beforeAction',
  AFTER_ACTION: 'mind:afterAction',
  ACTION_ERROR: 'mind:actionError',

  // Report hooks
  REPORT_GENERATE: 'mind:reportGenerate',

  // Transform hooks
  CONFIG_TRANSFORM: 'mind:configTransform',
  SELECTOR_TRANSFORM: 'mind:selectorTransform',
  DATA_TRANSFORM: 'mind:dataTransform'
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════════

export function createPlugin(
  metadata: Omit<PluginMetadata, 'main'>,
  handlers: {
    activate: (context: PluginContext) => Promise<void> | void;
    deactivate?: () => Promise<void> | void;
  }
): Plugin {
  return {
    metadata: { ...metadata, main: 'index.js' },
    activate: handlers.activate,
    deactivate: handlers.deactivate
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  PluginManager,
  HookRegistry,
  HOOKS,
  createPlugin
};
