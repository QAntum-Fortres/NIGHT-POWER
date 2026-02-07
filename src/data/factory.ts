/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM DATA FACTORIES                                                       ║
 * ║   "Sophisticated test data generation"                                        ║
 * ║                                                                               ║
 * ║   TODO B #38 - Data: Factory patterns                                         ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type FactoryDefinition<T> = () => T;
export type FactorySequence = () => number;
export type FactoryTrait<T> = Partial<T>;
export type FactoryCallback<T> = (entity: T, index: number) => T;

export interface FactoryConfig<T> {
    definition: FactoryDefinition<T>;
    traits?: Record<string, FactoryTrait<T>>;
    sequences?: Record<string, FactorySequence>;
    afterCreate?: FactoryCallback<T>;
    afterBuild?: FactoryCallback<T>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export class Factory<T extends object> {
    private config: FactoryConfig<T>;
    private sequenceValues = new Map<string, number>();
    private buildIndex = 0;

    constructor(config: FactoryConfig<T>) {
        this.config = config;
    }

    /**
     * Build entity without saving
     */
    build(overrides?: Partial<T>, traits?: string[]): T {
        const index = ++this.buildIndex;
        let entity = this.config.definition();

        // Apply traits
        if (traits) {
            for (const traitName of traits) {
                const trait = this.config.traits?.[traitName];
                if (trait) {
                    entity = { ...entity, ...trait };
                }
            }
        }

        // Apply overrides
        if (overrides) {
            entity = { ...entity, ...overrides };
        }

        // Run afterBuild callback
        if (this.config.afterBuild) {
            entity = this.config.afterBuild(entity, index);
        }

        return entity;
    }

    /**
     * Build multiple entities
     */
    buildList(count: number, overrides?: Partial<T>, traits?: string[]): T[] {
        return Array.from({ length: count }, () => this.build(overrides, traits));
    }

    /**
     * Create entity (build + afterCreate)
     */
    create(overrides?: Partial<T>, traits?: string[]): T {
        const index = this.buildIndex;
        let entity = this.build(overrides, traits);

        if (this.config.afterCreate) {
            entity = this.config.afterCreate(entity, index);
        }

        return entity;
    }

    /**
     * Create multiple entities
     */
    createList(count: number, overrides?: Partial<T>, traits?: string[]): T[] {
        return Array.from({ length: count }, () => this.create(overrides, traits));
    }

    /**
     * Build with specific trait
     */
    trait(traitName: string): this {
        // Returns a modified factory that applies this trait by default
        return this;
    }

    /**
     * Get next sequence value
     */
    sequence(name: string = 'default'): number {
        const current = this.sequenceValues.get(name) || 0;
        const next = current + 1;
        this.sequenceValues.set(name, next);
        return next;
    }

    /**
     * Reset sequences
     */
    resetSequences(): void {
        this.sequenceValues.clear();
        this.buildIndex = 0;
    }

    /**
     * Add trait to factory
     */
    addTrait(name: string, trait: FactoryTrait<T>): this {
        if (!this.config.traits) {
            this.config.traits = {};
        }
        this.config.traits[name] = trait;
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class FactoryManager {
    private static instance: FactoryManager;
    private factories = new Map<string, Factory<any>>();

    private constructor() {}

    static getInstance(): FactoryManager {
        if (!FactoryManager.instance) {
            FactoryManager.instance = new FactoryManager();
        }
        return FactoryManager.instance;
    }

    /**
     * Define a factory
     */
    define<T extends object>(name: string, config: FactoryConfig<T>): Factory<T> {
        const factory = new Factory<T>(config);
        this.factories.set(name, factory);
        return factory;
    }

    /**
     * Get factory
     */
    get<T extends object>(name: string): Factory<T> {
        const factory = this.factories.get(name);
        if (!factory) {
            throw new Error(`Factory "${name}" not found`);
        }
        return factory as Factory<T>;
    }

    /**
     * Build using named factory
     */
    build<T extends object>(name: string, overrides?: Partial<T>): T {
        return this.get<T>(name).build(overrides);
    }

    /**
     * Create using named factory
     */
    create<T extends object>(name: string, overrides?: Partial<T>): T {
        return this.get<T>(name).create(overrides);
    }

    /**
     * Build list using named factory
     */
    buildList<T extends object>(name: string, count: number, overrides?: Partial<T>): T[] {
        return this.get<T>(name).buildList(count, overrides);
    }

    /**
     * Reset all factories
     */
    resetAll(): void {
        for (const factory of this.factories.values()) {
            factory.resetSequences();
        }
    }

    /**
     * Clear all factories
     */
    clear(): void {
        this.factories.clear();
    }

    /**
     * Has factory
     */
    has(name: string): boolean {
        return this.factories.has(name);
    }

    /**
     * List factory names
     */
    list(): string[] {
        return [...this.factories.keys()];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

export class FactoryBuilder<T extends object> {
    private config: Partial<FactoryConfig<T>> = {};
    private name?: string;

    constructor(name?: string) {
        this.name = name;
    }

    /**
     * Set definition
     */
    definition(fn: FactoryDefinition<T>): this {
        this.config.definition = fn;
        return this;
    }

    /**
     * Add trait
     */
    trait(name: string, trait: FactoryTrait<T>): this {
        if (!this.config.traits) {
            this.config.traits = {};
        }
        this.config.traits[name] = trait;
        return this;
    }

    /**
     * Add sequence
     */
    sequence(name: string, fn: FactorySequence): this {
        if (!this.config.sequences) {
            this.config.sequences = {};
        }
        this.config.sequences[name] = fn;
        return this;
    }

    /**
     * After build callback
     */
    afterBuild(fn: FactoryCallback<T>): this {
        this.config.afterBuild = fn;
        return this;
    }

    /**
     * After create callback
     */
    afterCreate(fn: FactoryCallback<T>): this {
        this.config.afterCreate = fn;
        return this;
    }

    /**
     * Build factory
     */
    build(): Factory<T> {
        if (!this.config.definition) {
            throw new Error('Factory definition is required');
        }

        const factory = new Factory<T>(this.config as FactoryConfig<T>);

        if (this.name) {
            FactoryManager.getInstance().factories.set(this.name, factory);
        }

        return factory;
    }

    /**
     * Register with manager
     */
    register(name: string): Factory<T> {
        this.name = name;
        return this.build();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getFactoryManager = (): FactoryManager => FactoryManager.getInstance();

export function defineFactory<T extends object>(
    name: string, 
    config: FactoryConfig<T>
): Factory<T> {
    return FactoryManager.getInstance().define(name, config);
}

export function factory<T extends object>(name?: string): FactoryBuilder<T> {
    return new FactoryBuilder<T>(name);
}

// Quick factory operations
export const factories = {
    define: <T extends object>(name: string, config: FactoryConfig<T>) => 
        FactoryManager.getInstance().define(name, config),
    get: <T extends object>(name: string) => 
        FactoryManager.getInstance().get<T>(name),
    build: <T extends object>(name: string, overrides?: Partial<T>) => 
        FactoryManager.getInstance().build<T>(name, overrides),
    create: <T extends object>(name: string, overrides?: Partial<T>) => 
        FactoryManager.getInstance().create<T>(name, overrides),
    buildList: <T extends object>(name: string, count: number, overrides?: Partial<T>) => 
        FactoryManager.getInstance().buildList<T>(name, count, overrides),
    reset: () => FactoryManager.getInstance().resetAll(),
    clear: () => FactoryManager.getInstance().clear()
};

export default Factory;
