// [PURIFIED_BY_AETERNA: f5435d0f-ffec-4f7d-83f1-487e82ae769d]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 7259529d-db47-4f6d-8f54-9afb7be2bfdc]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 90c790fc-c9d0-4bfd-b81b-595873889688]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 90c790fc-c9d0-4bfd-b81b-595873889688]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: aacd073b-6d73-43bc-9109-f9f709df94c7]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 8cde934e-5451-4a2b-bb89-84a86ce0ab43]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 8cde934e-5451-4a2b-bb89-84a86ce0ab43]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: cc0f59d8-c93c-4b96-b378-d51bbc08dc05]
// Suggestion: Review and entrench stable logic.
/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM DEPENDENCY INJECTION CONTAINER                                       ║
 * ║   "Inversion of Control за loose coupling"                                    ║
 * ║                                                                               ║
 * ║   TODO B #4 - Dependency Injection                                            ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ТИПОВЕ
// ═══════════════════════════════════════════════════════════════════════════════

export type Constructor<T = unknown> = new (...args: any[]) => T;
export type Factory<T = unknown> = () => T;
export type Token<T = unknown> = symbol | string | Constructor<T>;

export interface Binding<T> {
  token: Token<T>;
  implementation: Constructor<T> | Factory<T> | T;
  scope: Scope;
  type: 'class' | 'factory' | 'value';
  tags: string[];
}

export type Scope = 'singleton' | 'transient' | 'request';

export interface ContainerOptions {
  defaultScope: Scope;
  autoBindInjectable: boolean;
  enableCircularDependencyCheck: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// METADATA KEYS
// ═══════════════════════════════════════════════════════════════════════════════

const INJECTABLE_KEY = Symbol('injectable');
const INJECT_KEY = Symbol('inject');
const OPTIONAL_KEY = Symbol('optional');

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Маркира клас като injectable
 */
export function Injectable(options?: { scope?: Scope; tags?: string[] }): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(
      INJECTABLE_KEY,
      {
        scope: options?.scope || 'transient',
        tags: options?.tags || [],
      },
      target
    );
  };
}

/**
 * Маркира dependency за injection
 */
export function Inject(token?: Token): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const existingInjections = Reflect.getMetadata(INJECT_KEY, target) || [];
    existingInjections[parameterIndex] = token;
    Reflect.defineMetadata(INJECT_KEY, existingInjections, target);
  };
}

/**
 * Маркира dependency като optional
 */
export function Optional(): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const existingOptionals = Reflect.getMetadata(OPTIONAL_KEY, target) || [];
    existingOptionals[parameterIndex] = true;
    Reflect.defineMetadata(OPTIONAL_KEY, existingOptionals, target);
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTAINER
// ═══════════════════════════════════════════════════════════════════════════════

export class Container {
  private static instance: Container;

  private bindings: Map<Token, Binding<unknown>> = new Map();
  private singletons: Map<Token, unknown> = new Map();
  private resolving: Set<Token> = new Set();
  private options: ContainerOptions;

  constructor(options: Partial<ContainerOptions> = {}) {
    this.options = {
      defaultScope: 'transient',
      autoBindInjectable: true,
      enableCircularDependencyCheck: true,
      ...options,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SINGLETON
  // ─────────────────────────────────────────────────────────────────────────

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  static resetInstance(): void {
    Container.instance = undefined as any;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BINDING API (Fluent)
  // ─────────────────────────────────────────────────────────────────────────

  bind<T>(token: Token<T>): BindingBuilder<T> {
    return new BindingBuilder<T>(this, token);
  }

  /**
   * Shorthand: bind to self
   */
  bindSelf<T>(constructor: Constructor<T>): void {
    this.bind(constructor).toSelf();
  }

  /**
   * Bind constant value
   */
  bindValue<T>(token: Token<T>, value: T): void {
    this.bind(token).toValue(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTERNAL BINDING
  // ─────────────────────────────────────────────────────────────────────────

  /** @internal */
  addBinding<T>(binding: Binding<T>): void {
    this.bindings.set(binding.token, binding as Binding<unknown>);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESOLUTION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Resolve a dependency
   */
  get<T>(token: Token<T>): T {
    // Check circular dependency
    if (this.options.enableCircularDependencyCheck) {
      if (this.resolving.has(token)) {
        throw new Error(`Circular dependency detected for: ${this.tokenToString(token)}`);
      }
    }

    // Check singleton cache
    if (this.singletons.has(token)) {
      return this.singletons.get(token) as T;
    }

    // Get binding
    let binding = this.bindings.get(token) as Binding<T> | undefined;

    // Auto-bind if enabled and token is a constructor
    if (!binding && this.options.autoBindInjectable && typeof token === 'function') {
      const meta = Reflect.getMetadata(INJECTABLE_KEY, token);
      if (meta) {
        this.bind(token).toSelf().inScope(meta.scope);
        binding = this.bindings.get(token) as Binding<T>;
      }
    }

    if (!binding) {
      throw new Error(`No binding found for: ${this.tokenToString(token)}`);
    }

    // Resolve
    this.resolving.add(token);
    let instance: T;

    try {
      instance = this.resolveBinding(binding);
    } finally {
      this.resolving.delete(token);
    }

    // Cache singleton
    if (binding.scope === 'singleton') {
      this.singletons.set(token, instance);
    }

    return instance;
  }

  /**
   * Try to resolve, return undefined if not found
   */
  tryGet<T>(token: Token<T>): T | undefined {
    try {
      return this.get(token);
    } catch {
      return undefined;
    }
  }

  /**
   * Check if binding exists
   */
  has(token: Token): boolean {
    return this.bindings.has(token);
  }

  /**
   * Get all bindings with a specific tag
   */
  getAllByTag<T>(tag: string): T[] {
    const results: T[] = [];
    for (const binding of this.bindings.values()) {
      if (binding.tags.includes(tag)) {
        results.push(this.get(binding.token) as T);
      }
    }
    return results;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE RESOLUTION
  // ─────────────────────────────────────────────────────────────────────────

  private resolveBinding<T>(binding: Binding<T>): T {
    switch (binding.type) {
      case 'value':
        return binding.implementation as T;

      case 'factory':
        return (binding.implementation as Factory<T>)();

      case 'class':
        return this.instantiate(binding.implementation as Constructor<T>);

      default:
        throw new Error(`Unknown binding type: ${binding.type}`);
    }
  }

  private instantiate<T>(constructor: Constructor<T>): T {
    // Get constructor parameter types
    const paramTypes = Reflect.getMetadata('design:paramtypes', constructor) || [];
    const injections = Reflect.getMetadata(INJECT_KEY, constructor) || [];
    const optionals = Reflect.getMetadata(OPTIONAL_KEY, constructor) || [];

    // Resolve dependencies
    const deps = paramTypes.map((type: Constructor, index: number) => {
      const token = injections[index] || type;
      const isOptional = optionals[index];

      if (isOptional) {
        return this.tryGet(token);
      }
      return this.get(token);
    });

    return new constructor(...deps);
  }

  private tokenToString(token: Token): string {
    if (typeof token === 'symbol') {
      return token.toString();
    }
    if (typeof token === 'function') {
      return token.name;
    }
    return String(token);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Clear all bindings and singletons
   */
  clear(): void {
    this.bindings.clear();
    this.singletons.clear();
  }

  /**
   * Unbind a specific token
   */
  unbind(token: Token): void {
    this.bindings.delete(token);
    this.singletons.delete(token);
  }

  /**
   * Rebind (unbind + bind)
   */
  rebind<T>(token: Token<T>): BindingBuilder<T> {
    this.unbind(token);
    return this.bind(token);
  }

  /**
   * Create a child container
   */
  createChild(): Container {
    const child = new Container(this.options);
    // Copy parent bindings
    for (const [token, binding] of this.bindings) {
      child.bindings.set(token, binding);
    }
    // Share singletons
    for (const [token, instance] of this.singletons) {
      child.singletons.set(token, instance);
    }
    return child;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DEBUG
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get debug info
   */
  debug(): { bindings: number; singletons: number; tokens: string[] } {
    return {
      bindings: this.bindings.size,
      singletons: this.singletons.size,
      tokens: [...this.bindings.keys()].map((t) => this.tokenToString(t)),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BINDING BUILDER (Fluent API)
// ═══════════════════════════════════════════════════════════════════════════════

export class BindingBuilder<T> {
  private binding: Partial<Binding<T>> = {
    scope: 'transient',
    tags: [],
    type: 'class',
  };

  constructor(
    private container: Container,
    token: Token<T>
  ) {
    this.binding.token = token;
  }

  /**
   * Bind to self (same class)
   */
  toSelf(): this {
    if (typeof this.binding.token !== 'function') {
      throw new Error('toSelf() can only be used with class tokens');
    }
    this.binding.implementation = this.binding.token as Constructor<T>;
    this.binding.type = 'class';
    this.finalize();
    return this;
  }

  /**
   * Bind to a different class
   */
  to(constructor: Constructor<T>): this {
    this.binding.implementation = constructor;
    this.binding.type = 'class';
    this.finalize();
    return this;
  }

  /**
   * Bind to a factory function
   */
  toFactory(factory: Factory<T>): this {
    this.binding.implementation = factory;
    this.binding.type = 'factory';
    this.finalize();
    return this;
  }

  /**
   * Bind to a constant value
   */
  toValue(value: T): this {
    this.binding.implementation = value;
    this.binding.type = 'value';
    this.finalize();
    return this;
  }

  /**
   * Set scope
   */
  inScope(scope: Scope): this {
    this.binding.scope = scope;
    this.finalize();
    return this;
  }

  /**
   * Shorthand: singleton scope
   */
  inSingletonScope(): this {
    return this.inScope('singleton');
  }

  /**
   * Shorthand: transient scope
   */
  inTransientScope(): this {
    return this.inScope('transient');
  }

  /**
   * Add tags
   */
  withTags(...tags: string[]): this {
    this.binding.tags = [...(this.binding.tags || []), ...tags];
    this.finalize();
    return this;
  }

  private finalize(): void {
    if (this.binding.implementation !== undefined) {
      this.container.addBinding(this.binding as Binding<T>);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

export const TOKENS = {
  // Core Services
  Logger: Symbol('Logger'),
  Config: Symbol('Config'),
  EventBus: Symbol('EventBus'),

  // Oracle Services
  Oracle: Symbol('Oracle'),
  PatternEngine: Symbol('PatternEngine'),
  LearningEngine: Symbol('LearningEngine'),

  // Cognition Services
  ThoughtChain: Symbol('ThoughtChain'),
  SelfCritique: Symbol('SelfCritique'),
  InferenceEngine: Symbol('InferenceEngine'),
  SemanticMemory: Symbol('SemanticMemory'),

  // Test Services
  TestRunner: Symbol('TestRunner'),
  TestReporter: Symbol('TestReporter'),
  AssertionEngine: Symbol('AssertionEngine'),
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getContainer = (): Container => Container.getInstance();

export default Container;
