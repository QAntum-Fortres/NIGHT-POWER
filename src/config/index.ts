/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM CONFIGURATION MODULE                                                 ║
 * ║   "Unified configuration management"                                          ║
 * ║                                                                               ║
 * ║   TODO B #43 - Configuration Management                                       ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// RE-EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
    ConfigLoader,
    ConfigLoaderOptions,
    ConfigSource,
    ConfigFormat,
    ConfigValue,
    ConfigChangeHandler,
    EnvSource,
    FileSource,
    ObjectSource,
    RemoteSource,
    JSON_FORMAT,
    YAML_FORMAT,
    ENV_FORMAT,
    TOML_FORMAT,
    deepMerge
} from './loader';

export {
    SchemaValidator,
    SchemaBuilder,
    Schema,
    SchemaRule,
    SchemaType,
    ValidationError,
    ValidationResult,
    s
} from './schema';

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════════════════════

import * as path from 'path';
import { ConfigLoader, ConfigValue, deepMerge } from './loader';
import { SchemaValidator, Schema, SchemaBuilder, s } from './schema';

// ═══════════════════════════════════════════════════════════════════════════════
// QANTUM CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * QAntum default configuration schema
 */
export const QANTUM_CONFIG_SCHEMA: Schema = {
    // Test runner settings
    'runner.timeout': s.number().default(30000).description('Test timeout in ms').build(),
    'runner.retries': s.number().default(0).min(0).description('Number of retries').build(),
    'runner.parallel': s.boolean().default(true).description('Run tests in parallel').build(),
    'runner.maxWorkers': s.number().default(4).min(1).env('QANTUM_MAX_WORKERS').build(),
    'runner.bail': s.boolean().default(false).description('Stop on first failure').build(),

    // Reporter settings
    'reporter.format': s.string().enum('console', 'json', 'html', 'junit').default('console').build(),
    'reporter.outputDir': s.string().default('./reports').format('path').build(),
    'reporter.verbose': s.boolean().default(false).env('QANTUM_VERBOSE').build(),

    // Coverage settings
    'coverage.enabled': s.boolean().default(false).build(),
    'coverage.threshold': s.object({
        lines: s.number().default(80).min(0).max(100).build(),
        branches: s.number().default(80).min(0).max(100).build(),
        functions: s.number().default(80).min(0).max(100).build(),
        statements: s.number().default(80).min(0).max(100).build()
    }).build(),
    'coverage.include': s.array(s.string().build()).default(['src/**/*.ts']).build(),
    'coverage.exclude': s.array(s.string().build()).default(['**/*.test.ts', '**/*.spec.ts']).build(),

    // Browser settings
    'browser.headless': s.boolean().default(true).env('QANTUM_HEADLESS').build(),
    'browser.viewport': s.object({
        width: s.number().default(1920).build(),
        height: s.number().default(1080).build()
    }).build(),
    'browser.timeout': s.number().default(30000).build(),
    'browser.screenshots': s.boolean().default(true).build(),

    // API settings
    'api.baseUrl': s.string().format('url').env('QANTUM_API_URL').build(),
    'api.timeout': s.number().default(30000).build(),
    'api.retries': s.number().default(3).build(),

    // Database settings
    'database.connectionString': s.string().env('DATABASE_URL').build(),
    'database.poolSize': s.number().default(10).min(1).build(),

    // Security settings
    'security.scanEnabled': s.boolean().default(false).build(),
    'security.vulnerabilityThreshold': s.string().enum('low', 'medium', 'high', 'critical').default('medium').build(),

    // Performance settings
    'performance.metricsEnabled': s.boolean().default(true).build(),
    'performance.thresholds': s.object({
        fcp: s.number().default(1500).description('First Contentful Paint (ms)').build(),
        lcp: s.number().default(2500).description('Largest Contentful Paint (ms)').build(),
        cls: s.number().default(0.1).description('Cumulative Layout Shift').build(),
        ttfb: s.number().default(800).description('Time to First Byte (ms)').build()
    }).build()
};

/**
 * QAntum Configuration
 */
export interface QAntumConfig {
    runner: {
        timeout: number;
        retries: number;
        parallel: boolean;
        maxWorkers: number;
        bail: boolean;
    };
    reporter: {
        format: 'console' | 'json' | 'html' | 'junit';
        outputDir: string;
        verbose: boolean;
    };
    coverage: {
        enabled: boolean;
        threshold: {
            lines: number;
            branches: number;
            functions: number;
            statements: number;
        };
        include: string[];
        exclude: string[];
    };
    browser: {
        headless: boolean;
        viewport: { width: number; height: number };
        timeout: number;
        screenshots: boolean;
    };
    api: {
        baseUrl?: string;
        timeout: number;
        retries: number;
    };
    database: {
        connectionString?: string;
        poolSize: number;
    };
    security: {
        scanEnabled: boolean;
        vulnerabilityThreshold: 'low' | 'medium' | 'high' | 'critical';
    };
    performance: {
        metricsEnabled: boolean;
        thresholds: {
            fcp: number;
            lcp: number;
            cls: number;
            ttfb: number;
        };
    };
}

/**
 * Unified QAntum Configuration Manager
 */
export class QAntumConfiguration {
    private static instance: QAntumConfiguration;
    
    private loader: ConfigLoader;
    private validator: SchemaValidator;
    private config: QAntumConfig | null = null;

    private constructor() {
        this.loader = new ConfigLoader({
            defaults: this.getDefaultConfig(),
            mergeStrategy: 'deep'
        });

        this.validator = new SchemaValidator(QANTUM_CONFIG_SCHEMA);
    }

    static getInstance(): QAntumConfiguration {
        if (!QAntumConfiguration.instance) {
            QAntumConfiguration.instance = new QAntumConfiguration();
        }
        return QAntumConfiguration.instance;
    }

    /**
     * Initialize with automatic detection
     */
    async init(basePath: string = process.cwd()): Promise<QAntumConfig> {
        // Add common config file locations
        const configFiles = [
            'qantum.config.json',
            'qantum.config.yaml',
            'qantum.config.yml',
            'qantum.config.toml',
            '.qantumrc',
            '.qantumrc.json',
            '.qantumrc.yaml'
        ];

        for (const file of configFiles) {
            this.loader.addFile(path.join(basePath, file), 50);
        }

        // Add environment variables
        this.loader.addEnv('QANTUM_', 100);

        // Load and validate
        await this.loader.load();
        const raw = this.loader.getAll();
        const result = this.validator.validate(raw);

        if (!result.valid) {
            console.warn('Configuration warnings:', result.errors);
        }

        this.config = this.flatToNested(result.config) as QAntumConfig;
        return this.config;
    }

    /**
     * Initialize from specific file
     */
    async initFromFile(filePath: string): Promise<QAntumConfig> {
        this.loader.addFile(filePath, 50);
        this.loader.addEnv('QANTUM_', 100);

        await this.loader.load();
        const raw = this.loader.getAll();
        const result = this.validator.validateOrThrow(raw);

        this.config = this.flatToNested(result) as QAntumConfig;
        return this.config;
    }

    /**
     * Initialize with object
     */
    initWithConfig(config: Partial<QAntumConfig>): QAntumConfig {
        const merged = deepMerge(this.getDefaultConfig(), config);
        this.config = merged as QAntumConfig;
        return this.config;
    }

    /**
     * Get configuration
     */
    get<K extends keyof QAntumConfig>(key: K): QAntumConfig[K];
    get<T = any>(key: string): T;
    get(key: string): any {
        if (!this.config) {
            this.config = this.getDefaultConfig() as QAntumConfig;
        }

        const parts = key.split('.');
        let current: any = this.config;

        for (const part of parts) {
            if (current === undefined) return undefined;
            current = current[part];
        }

        return current;
    }

    /**
     * Set configuration
     */
    set<K extends keyof QAntumConfig>(key: K, value: QAntumConfig[K]): void;
    set(key: string, value: any): void;
    set(key: string, value: any): void {
        if (!this.config) {
            this.config = this.getDefaultConfig() as QAntumConfig;
        }

        const parts = key.split('.');
        let current: any = this.config;

        for (let i = 0; i < parts.length - 1; i++) {
            current[parts[i]] = current[parts[i]] || {};
            current = current[parts[i]];
        }

        current[parts[parts.length - 1]] = value;
    }

    /**
     * Get all config
     */
    getAll(): QAntumConfig {
        if (!this.config) {
            this.config = this.getDefaultConfig() as QAntumConfig;
        }
        return { ...this.config } as QAntumConfig;
    }

    /**
     * Reset to defaults
     */
    reset(): void {
        this.config = this.getDefaultConfig() as QAntumConfig;
    }

    /**
     * Get default configuration
     */
    private getDefaultConfig(): ConfigValue {
        return {
            runner: {
                timeout: 30000,
                retries: 0,
                parallel: true,
                maxWorkers: 4,
                bail: false
            },
            reporter: {
                format: 'console',
                outputDir: './reports',
                verbose: false
            },
            coverage: {
                enabled: false,
                threshold: {
                    lines: 80,
                    branches: 80,
                    functions: 80,
                    statements: 80
                },
                include: ['src/**/*.ts'],
                exclude: ['**/*.test.ts', '**/*.spec.ts']
            },
            browser: {
                headless: true,
                viewport: { width: 1920, height: 1080 },
                timeout: 30000,
                screenshots: true
            },
            api: {
                timeout: 30000,
                retries: 3
            },
            database: {
                poolSize: 10
            },
            security: {
                scanEnabled: false,
                vulnerabilityThreshold: 'medium'
            },
            performance: {
                metricsEnabled: true,
                thresholds: {
                    fcp: 1500,
                    lcp: 2500,
                    cls: 0.1,
                    ttfb: 800
                }
            }
        };
    }

    /**
     * Convert flat keys to nested object
     */
    private flatToNested(flat: ConfigValue): ConfigValue {
        const result: ConfigValue = {};

        for (const [key, value] of Object.entries(flat)) {
            const parts = key.split('.');
            let current = result;

            for (let i = 0; i < parts.length - 1; i++) {
                current[parts[i]] = current[parts[i]] || {};
                current = current[parts[i]];
            }

            current[parts[parts.length - 1]] = value;
        }

        return deepMerge(this.getDefaultConfig(), result);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const getQAntumConfig = (): QAntumConfiguration => QAntumConfiguration.getInstance();

export const config = QAntumConfiguration.getInstance();

export default QAntumConfiguration;
